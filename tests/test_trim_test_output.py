"""Contract, safety and real Node output checks for both project hooks."""
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "scripts" / "trim-test-output.py"
SPEC = importlib.util.spec_from_file_location("trim_test_output", SCRIPT)
FILTER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(FILTER)
PASSES = "\n".join(f"✔ passing test number {n} (1.234ms)" for n in range(100))


class FilterTests(unittest.TestCase):
    def event(self, output=PASSES, code=0, command="fnm exec --using=26 npm test", client="codex"):
        response = {"output": output, "exit_code": code}
        if client == "claude":
            response = {"stdout": output, "stderr": "", "interrupted": False, "isImage": False}
        return {"hook_event_name": "PostToolUse", "tool_name": "Bash", "cwd": str(ROOT),
                "tool_input": {"command": command}, "tool_response": response}

    def filtered(self, event, client="codex"):
        result = FILTER.handle(event, client)
        self.assertIsNotNone(result)
        if client == "codex":
            self.assertFalse(result["continue"])
            self.assertNotIn("decision", result)
            message = result["stopReason"]
        else:
            self.assertNotIn("continue", result)
            self.assertNotIn("decision", result)
            specific = result["hookSpecificOutput"]
            self.assertEqual(specific["hookEventName"], "PostToolUse")
            replacement = specific["updatedToolOutput"]
            for key, value in event["tool_response"].items():
                if key not in ("stdout", "stderr"):
                    self.assertEqual(replacement[key], value)
            self.assertEqual(replacement["stderr"], "")
            message = replacement["stdout"]
        self.assertTrue(message.startswith("Full original output: "))
        log = Path(message.splitlines()[0].removeprefix("Full original output: "))
        self.addCleanup(log.unlink)
        self.assertEqual(log.read_text(), FILTER.extract(event["tool_response"], client)[0])
        self.assertEqual(log.stat().st_mode & 0o777, 0o600)
        return message

    def test_passes_collapse_and_save_original(self):
        for client in ("codex", "claude"):
            with self.subTest(client=client):
                message = self.filtered(self.event(client=client), client)
                self.assertNotIn("passing test number", message)
                self.assertLess(len(message), len(PASSES) // 10)
                if client == "codex":
                    self.assertIn("exit code: 0", message)
                else:
                    self.assertIn("exit code not supplied", message)
                    self.assertNotIn("exit code: 0", message)

    def test_failure_diff_stack_and_status_preserved(self):
        failure = "✖ calculates tax\n  AssertionError: mismatch\n  - 100\n  + 101\n    at calculate (tax.ts:40)"
        message = self.filtered(self.event(PASSES + "\n" + failure, 7))
        self.assertIn(failure, message)
        self.assertIn("exit code: 7", message)

    def test_multiline_warning_preserved_in_both_clients(self):
        warning = "(node:10) DeprecationWarning: old API\n  use the replacement API\n    at test.ts:2"
        for client in ("codex", "claude"):
            event = self.event(client=client)
            if client == "claude":
                event["tool_response"]["stderr"] = warning
            else:
                event["tool_response"]["output"] += "\n" + warning
            self.assertIn(warning, self.filtered(event, client))

    def test_unknown_messages_and_metadata_preserved(self):
        self.assertIn("database connection lost", self.filtered(self.event(PASSES + "\ndatabase connection lost", 7)))
        event = self.event(client="claude")
        event["tool_response"]["extraMetadata"] = {"duration": 123}
        self.filtered(event, "claude")

    def test_tap_metadata_and_failures(self):
        success = "# Subtest: good\nok 1 - good\n  ---\n  duration_ms: 0.5\n  type: 'test'\n  ...\n"
        failure = "not ok 2 - bad\n  ---\n  expected: 2\n  actual: 1\n  stack: |-\n    test.ts:1\n  ..."
        text, count = FILTER.compact(success + failure)
        self.assertEqual(text, failure)
        self.assertEqual(count, 6)
        unknown = "ok 1 - good\n  ---\n  custom: something meaningful\n  ..."
        self.assertIn("custom: something meaningful", FILTER.compact(unknown)[0])
        self.assertIn("# fail 1", FILTER.compact("# pass 10\n# fail 1")[0])

    def test_ansi_successes(self):
        self.assertNotIn("passing test", self.filtered(self.event("\x1b[32m" + PASSES + "\x1b[0m")))

    def test_diagnostic_words_in_passing_test_names_are_not_warnings(self):
        text = "✔ throws an error for a failure (1ms)\n# Subtest: warning handling\nok 1 - warning handling\n" + PASSES
        message = self.filtered(self.event(text))
        self.assertNotIn("warning handling", message)
        self.assertNotIn("throws an error", message)

    def test_command_recognition(self):
        for command in ("npm test", "npm run check", "cd tests && npm test",
                        "CI=1 fnm exec --using=26 npm test", "fnm exec --using 26 -- npm run check",
                        "fnm exec --using=26 node --import tsx --test 'tests/**/*.ts'",
                        "node --test tests/example.test.ts", "npm test && npm test"):
            with self.subTest(command=command):
                self.assertTrue(FILTER.test_command(command, ROOT))
        for command in ("echo 'npm test'", "cat results.txt", "npm test && npm run build",
                        "npm test | tee log", "npm test > log", "npm test &", "npm test --watch",
                        "cd /tmp && npm test", "fnm exec --using=26 npm run build", "npm test\nls",
                        "npm test --prefix /tmp", "npm test --prefix=/tmp", "npm test -w other",
                        "npm run check --workspace=other", "npm test -C/tmp"):
            with self.subTest(command=command):
                self.assertFalse(FILTER.test_command(command, ROOT))

    def test_outside_repo_and_unknown_results_are_untouched(self):
        event = self.event()
        event["cwd"] = tempfile.gettempdir()
        self.assertIsNone(FILTER.handle(event, "codex"))
        event = self.event()
        event["tool_input"]["workdir"] = tempfile.gettempdir()
        self.assertIsNone(FILTER.handle(event, "codex"))
        self.assertIsNone(FILTER.handle(self.event("custom output"), "codex"))
        event = self.event()
        del event["cwd"]
        self.assertIsNone(FILTER.handle(event, "codex"))
        for value in (False, 2, [], {}):
            event = self.event()
            event["tool_input"]["workdir"] = value
            self.assertIsNone(FILTER.handle(event, "codex"))

    def test_incomplete_results_and_failures_are_untouched(self):
        for client in ("codex", "claude"):
            for key, value in (("session_id", 23), ("interrupted", True), ("backgroundTaskId", "job1"), ("isImage", True)):
                event = self.event(client=client)
                event["tool_response"][key] = value
                self.assertIsNone(FILTER.handle(event, client))
            self.assertIsNone(FILTER.handle(self.event(PASSES + "\nOutput truncated", client=client), client))
            event = self.event(client=client)
            event["hook_event_name"] = "PostToolUseFailure"
            self.assertIsNone(FILTER.handle(event, client))
        event = self.event()
        event["tool_response"]["exit_code"] = None
        self.assertIsNone(FILTER.handle(event, "codex"))
        event = self.event(client="claude")
        del event["tool_response"]["interrupted"]
        self.assertIsNone(FILTER.handle(event, "claude"))
        self.assertIsNone(FILTER.handle(self.event(PASSES + "\nFAIL\n" + "details" * 1000, 1), "codex"))

    def test_codex_serialized_results(self):
        text = "Chunk ID: abc\nWall time: 1 seconds\nProcess exited with code 1\nFinal output:\nerror"
        self.assertEqual(FILTER.extract(text, "codex"), ("error", 1))
        response = json.dumps({"output": "ok", "metadata": {"exit_code": 0}})
        self.assertEqual(FILTER.extract(response, "codex"), ("ok", 0))

    def test_malformed_input_fails_open(self):
        for client in ("codex", "claude"):
            for value in ("invalid json", "[]", "null", "{}"):
                result = subprocess.run([sys.executable, "-B", str(SCRIPT), f"--{client}"],
                                        input=value, text=True, capture_output=True)
                self.assertEqual((result.returncode, result.stdout), (0, ""))

    def test_registered_commands_run_from_root_and_subdirectory(self):
        for client, config_path in (("codex", ROOT / ".codex/hooks.json"), ("claude", ROOT / ".claude/settings.json")):
            config = json.loads(config_path.read_text())
            groups = config["hooks"]["PostToolUse"]
            self.assertEqual(groups[0]["matcher"], "^Bash$")
            command = groups[0]["hooks"][0]["command"]
            self.assertNotIn("/Users/", command)
            for cwd in (ROOT, ROOT / "tests"):
                event = self.event(client=client)
                event["cwd"] = str(cwd)
                result = subprocess.run(command, shell=True, cwd=cwd, input=json.dumps(event),
                                        text=True, capture_output=True)
                self.assertEqual(result.returncode, 0, result.stderr)
                response = json.loads(result.stdout)
                message = response["stopReason"] if client == "codex" else response["hookSpecificOutput"]["updatedToolOutput"]["stdout"]
                Path(message.splitlines()[0].removeprefix("Full original output: ")).unlink()
                self.assertNotIn("passing test number", message)

    def test_real_node_output_keeps_warning_and_assertion(self):
        node = os.environ.get("TEST_NODE", "node")
        env = dict(os.environ)
        # This suite also runs under node --test in CI. Start a fresh test
        # runner for each fixture, rather than inheriting its parent's context.
        env.pop("NODE_TEST_CONTEXT", None)
        with tempfile.TemporaryDirectory() as folder:
            fixture = Path(folder) / "sample.test.cjs"
            for warning in ("", "console.warn('Warning: preserve this diagnostic');"):
                fixture.write_text(
                    "const {test}=require('node:test');const assert=require('node:assert');"
                    "for(let i=0;i<100;i++)test('passing '+i,()=>{});"
                    f"test('bad',()=>{{{warning}assert.equal(1,2)}});"
                )
                for reporter in ("spec", "tap"):
                    run = subprocess.run([node, "--test", f"--test-reporter={reporter}", str(fixture)],
                                         capture_output=True, text=True, env=env)
                    self.assertEqual(run.returncode, 1, run.stderr)
                    raw = run.stdout + run.stderr
                    if warning:
                        # Node can print warnings before any passing results. A
                        # conservative hook then leaves the entire result alone.
                        result = FILTER.handle(self.event(raw, run.returncode), "codex")
                        message = raw if result is None else result["stopReason"]
                        if result:
                            Path(message.splitlines()[0].removeprefix("Full original output: ")).unlink()
                        self.assertIn("preserve this diagnostic", message)
                    else:
                        message = self.filtered(self.event(raw, run.returncode))
                        self.assertIn("exit code: 1", message)
                    self.assertIn("ERR_ASSERTION", message)


if __name__ == "__main__":
    unittest.main()

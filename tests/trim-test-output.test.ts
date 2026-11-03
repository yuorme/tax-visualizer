import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

test("project test-output hooks preserve diagnostics for Codex and Claude", () => {
  const result = spawnSync(
    "python3",
    ["-B", "-m", "unittest", "discover", "-s", "tests", "-p", "test_trim_test_output.py"],
    {
      cwd: fileURLToPath(new URL("..", import.meta.url)),
      encoding: "utf8",
      env: { ...process.env, TEST_NODE: process.execPath },
      timeout: 30_000,
    },
  );
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

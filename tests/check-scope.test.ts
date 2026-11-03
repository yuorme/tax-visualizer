import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { type TestContext, test } from "node:test";
import vm from "node:vm";
import { parse } from "yaml";

const script = path.resolve(import.meta.dirname, "../scripts/check-scope.mjs");
function fixture(t: TestContext) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tax-check-scope-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const repo = path.join(root, "repo");
  fs.mkdirSync(repo);
  const git = (...args: string[]) =>
    execFileSync("git", args, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  const write = (name: string, content = "changed\n") => {
    fs.mkdirSync(path.dirname(path.join(repo, name)), { recursive: true });
    fs.writeFileSync(path.join(repo, name), content);
  };
  const commit = () => {
    git("add", ".");
    git("commit", "-m", "Fixture change");
    return git("rev-parse", "HEAD");
  };
  git("init", "--initial-branch=main");
  git("config", "user.name", "Scope Test");
  git("config", "user.email", "test@example.invalid");
  write("README.md", "initial\n");
  write("src/app.ts", "export const value = 1;\n");
  write("docs/remove.md", "old documentation\n");
  const base = commit();
  const run = (args: string[], eventName?: string, event?: unknown) => {
    const eventFile = path.join(root, "event.json");
    const outputFile = path.join(root, "output.txt");
    fs.writeFileSync(eventFile, typeof event === "string" ? event : JSON.stringify(event ?? {}));
    fs.writeFileSync(outputFile, "");
    const result = spawnSync(process.execPath, [script, ...args], {
      cwd: repo,
      encoding: "utf8",
      env: {
        ...process.env,
        GITHUB_EVENT_NAME: eventName ?? "",
        GITHUB_EVENT_PATH: eventFile,
        GITHUB_OUTPUT: outputFile,
      },
    });
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /^docs_only=(true|false)\n$/);
    if (args[0] === "--event") assert.equal(fs.readFileSync(outputFile, "utf8"), result.stdout);
    return result.stdout === "docs_only=true\n";
  };
  const pr = (baseSha = base, headSha = git("rev-parse", "HEAD")) =>
    run(["--event"], "pull_request", { pull_request: { base: { sha: baseSha }, head: { sha: headSha } } });
  const push = (before = base, after = git("rev-parse", "HEAD")) => run(["--event"], "push", { before, after });
  return { repo, git, write, commit, base, run, pr, push };
}

test("root, nested docs and agent Markdown additions, edits, deletions and renames use the fast path", t => {
  const f = fixture(t);
  f.write("CLAUDE.md");
  f.write("README.md");
  f.write("docs/design/with spaces.md");
  f.write(".claude/agents/reviewer.md");
  f.git("mv", "docs/remove.md", "docs/renamed.md");
  f.commit();
  assert.equal(f.pr(), true);
  assert.equal(f.push(), true);
  f.git("rm", "docs/renamed.md");
  f.commit();
  assert.equal(f.run([f.base, "HEAD"]), true);
});

for (const file of [
  "src/engine/new.ts",
  "data/years/2026/federal.yaml",
  "tests/fixture.md",
  "scripts/new.mjs",
  ".github/workflows/ci.yml",
  ".claude/settings.json",
  "package-lock.json",
  "docs/verification/source.txt",
  "src/docs-looking.md",
  "docs/looks.md\ncode.ts",
]) {
  test(`a mixed change including ${JSON.stringify(file)} retains full checks`, t => {
    const f = fixture(t);
    f.write("CLAUDE.md");
    f.write(file);
    f.commit();
    assert.equal(f.pr(), false);
    assert.equal(f.push(), false);
  });
}

test("a newline in an allowed Markdown filename does not split it into unrelated paths", t => {
  const f = fixture(t);
  f.write("docs/first\nsecond.md");
  f.commit();
  assert.equal(f.pr(), true);
});

test("Markdown validation reads spaces and newlines in filenames and still rejects overlong prose", t => {
  const f = fixture(t);
  const name = "docs/first line\nsecond line.md";
  f.write(name, "Short policy prose.\n");
  f.commit();
  const check = () =>
    spawnSync(process.execPath, [path.resolve(import.meta.dirname, "../scripts/check-docs.mjs")], {
      cwd: f.repo,
      encoding: "utf8",
    });
  const valid = check();
  assert.equal(valid.status, 0, valid.stderr);
  f.write(name, `${"x".repeat(121)}\n`);
  const invalid = check();
  assert.equal(invalid.status, 1, invalid.stdout);
  assert.match(invalid.stderr, /121 characters/);
  assert.ok(invalid.stderr.includes(name));
});

test("renaming source into Markdown or Markdown into source retains full checks", t => {
  const f = fixture(t);
  f.git("mv", "src/app.ts", "docs/app.md");
  f.commit();
  assert.equal(f.pr(), false);
  const before = f.git("rev-parse", "HEAD");
  f.git("mv", "docs/app.md", "src/app.ts");
  f.commit();
  assert.equal(f.push(before), false);
});

test("push scope includes earlier code commits even when the final commit only changes policy", t => {
  const f = fixture(t);
  f.write("src/app.ts");
  const code = f.commit();
  f.write("CLAUDE.md");
  f.commit();
  assert.equal(f.push(code), true);
  assert.equal(f.push(), false);
});

test("PR scope starts at the merge base while a push compares its exact before and after trees", t => {
  const f = fixture(t);
  f.git("checkout", "-b", "policy");
  f.write("CLAUDE.md");
  const head = f.commit();
  f.git("checkout", "main");
  f.write("src/app.ts");
  const advancedBase = f.commit();
  f.git("checkout", "policy");
  assert.equal(f.pr(advancedBase, head), true);
  assert.equal(f.run([advancedBase, head]), true);
  assert.equal(f.push(advancedBase, head), false);
});

test("empty comparisons and unavailable or malformed event history fall back to full checks", t => {
  const f = fixture(t);
  assert.equal(f.pr(), false);
  assert.equal(f.push(), false);
  assert.equal(f.run(["missing-base", "HEAD"]), false);
  assert.equal(f.run([]), false);
  assert.equal(f.run(["--event"], "pull_request", "{"), false);
  assert.equal(f.run(["--event"], "pull_request", {}), false);
  assert.equal(f.run(["--event"], "workflow_dispatch", {}), false);
  assert.equal(f.pr("f".repeat(40)), false);
  assert.equal(f.push("0".repeat(40)), false);
  f.git("checkout", "--orphan", "unrelated");
  f.git("rm", "-rf", ".");
  f.write("CLAUDE.md");
  f.commit();
  assert.equal(f.pr(), false, "unrelated histories cannot establish a Markdown-only PR");
});

test("local scope includes unstaged, staged and untracked changes, including renamed source", t => {
  const f = fixture(t);
  f.write("CLAUDE.md");
  f.commit();
  assert.equal(f.run([f.base, "HEAD"]), true);
  f.write("docs/new.md");
  assert.equal(f.run([f.base, "HEAD"]), true);
  f.write("src/app.ts");
  assert.equal(f.run([f.base, "HEAD"]), false);
  f.git("add", "src/app.ts");
  assert.equal(f.run([f.base, "HEAD"]), false);
  f.git("restore", "--source=HEAD", "--staged", "--worktree", "src/app.ts");
  f.write("untracked.mjs");
  assert.equal(f.run([f.base, "HEAD"]), false);
  fs.unlinkSync(path.join(f.repo, "untracked.mjs"));
  f.git("mv", "src/app.ts", "docs/moved.md");
  assert.equal(f.run([f.base, "HEAD"]), false);
});

test("required check runs on docs PRs while dependency, browser, application and deployment steps are gated", () => {
  interface Step {
    id?: string;
    uses?: string;
    run?: string;
    if?: string;
    with?: Record<string, unknown>;
  }
  const ci = parse(fs.readFileSync(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8")) as {
    on: { pull_request: unknown; push: { branches: string[] } };
    jobs: {
      check: { if?: string; outputs: { docs_only: string }; steps: Step[] };
      deploy: { if: string; needs: string };
    };
  };
  assert.equal(ci.on.pull_request, null, "required workflow must not exclude Markdown paths");
  assert.deepEqual(ci.on.push, { branches: ["main"] });
  assert.equal(ci.jobs.check.if, undefined, "required check must always report a result");
  // biome-ignore lint/suspicious/noTemplateCurlyInString: GitHub Actions expression, not JavaScript interpolation.
  assert.equal(ci.jobs.check.outputs.docs_only, "${{ steps.scope.outputs.docs_only }}");
  assert.equal(ci.jobs.deploy.needs, "check");
  const active = (condition: string | undefined, docs: string, ref: string) =>
    condition === undefined ||
    vm.runInNewContext(
      condition
        .replaceAll("steps.scope.outputs.docs_only", JSON.stringify(docs))
        .replaceAll("needs.check.outputs.docs_only", JSON.stringify(docs))
        .replaceAll("steps.browser-cache.outputs.cache-hit", '"false"')
        .replaceAll("github.ref", JSON.stringify(ref)),
    );
  const steps = ci.jobs.check.steps;
  assert.equal(steps.find(step => step.id === "scope")?.run, "node scripts/check-scope.mjs --event");
  assert.equal(steps.find(step => step.uses?.startsWith("actions/checkout@"))?.with?.["fetch-depth"], 0);
  const commands = ["npm ci", "npm run lint", "npm run typecheck", "npm test", "npm run build", "npm run e2e"];
  const heavy = steps.filter(
    step =>
      commands.includes(step.run ?? "") ||
      step.id === "playwright" ||
      step.id === "browser-cache" ||
      step.run?.startsWith("npx playwright install"),
  );
  assert.equal(heavy.length, commands.length + 3, "every expensive step is accounted for");
  for (const step of heavy) {
    const label = step.run ?? step.id ?? "application step";
    assert.equal(active(step.if, "true", "refs/heads/main"), false, label);
    assert.equal(active(step.if, "false", "refs/heads/main"), true, label);
    assert.equal(active(step.if, "", "refs/heads/main"), true, "missing scope output must retain full checks");
  }
  const docs = steps.find(step => step.run === "node scripts/check-docs.mjs");
  assert.ok(docs);
  assert.equal(active(docs.if, "true", "refs/pull/1/merge"), true);
  assert.equal(active(docs.if, "false", "refs/pull/1/merge"), false);
  const artifact = steps.find(step => step.uses?.startsWith("actions/upload-pages-artifact@"));
  assert.ok(artifact);
  for (const condition of [artifact.if, ci.jobs.deploy.if]) {
    assert.equal(active(condition, "true", "refs/heads/main"), false);
    assert.equal(active(condition, "false", "refs/heads/main"), true);
    assert.equal(active(condition, "false", "refs/pull/1/merge"), false);
  }
});

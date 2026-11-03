import assert from "node:assert/strict";
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { type TestContext, test } from "node:test";

const script = path.resolve(import.meta.dirname, "../scripts/worktree-cleanup.mjs");

function fixture(t: TestContext) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "tax-worktree-test-")));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const repo = path.join(root, "repo");
  const remote = path.join(root, "origin.git");
  const worktree = path.join(root, "finished checkout");
  const git = (dir: string, ...args: string[]) =>
    execFileSync("git", ["-C", dir, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  git(root, "init", "--bare", "--initial-branch=main", remote);
  git(root, "init", "--initial-branch=main", repo);
  git(repo, "config", "user.email", "test@example.invalid");
  git(repo, "config", "user.name", "Cleanup Test");
  fs.writeFileSync(path.join(repo, ".gitignore"), "node_modules\ndist/\n*.secret\n.DS_Store\n");
  fs.writeFileSync(path.join(repo, "source.txt"), "base\n");
  git(repo, "add", ".");
  git(repo, "commit", "-m", "Initial commit");
  git(repo, "remote", "add", "origin", remote);
  git(repo, "push", "-u", "origin", "main");
  git(repo, "worktree", "add", "-b", "feature", worktree);
  const run = (args: string[] = [], cwd = repo, env = process.env) => {
    const result = spawnSync(process.execPath, [script, ...args], { cwd, env, encoding: "utf8" });
    assert.ifError(result.error);
    return { status: result.status, output: result.stdout + result.stderr };
  };
  return { root, repo, remote, worktree, git, run };
}

test("cleanup defaults to a dry run and removes a pushed unmerged checkout only with --apply", t => {
  const f = fixture(t);
  fs.writeFileSync(path.join(f.worktree, "source.txt"), "unmerged feature\n");
  f.git(f.worktree, "commit", "-am", "Feature");
  f.git(f.worktree, "push", "origin", "feature");
  const head = f.git(f.worktree, "rev-parse", "HEAD");
  fs.mkdirSync(path.join(f.worktree, "node_modules"));
  fs.writeFileSync(path.join(f.worktree, "node_modules", "installed.txt"), "regenerable");
  fs.writeFileSync(path.join(f.worktree, ".DS_Store"), "Finder metadata");
  const dry = f.run([f.worktree]);
  assert.equal(dry.status, 0, dry.output);
  assert.match(dry.output, /Would remove/);
  assert.ok(fs.existsSync(f.worktree));
  const apply = f.run(["--apply", f.worktree]);
  assert.equal(apply.status, 0, apply.output);
  assert.ok(!fs.existsSync(f.worktree));
  assert.equal(f.git(f.repo, "rev-parse", "feature"), head, "local branch and commits survive");
  assert.doesNotMatch(f.git(f.repo, "worktree", "list"), /finished checkout/);
});

test("cleanup removes a detached merged checkout without following dependency symlinks", t => {
  const f = fixture(t);
  f.git(f.worktree, "checkout", "--detach");
  const shared = path.join(f.root, "shared-modules");
  fs.mkdirSync(shared);
  fs.writeFileSync(path.join(shared, "keep.txt"), "shared");
  fs.symlinkSync(shared, path.join(f.worktree, "node_modules"));
  const result = f.run(["--apply", f.worktree]);
  assert.equal(result.status, 0, result.output);
  assert.ok(!fs.existsSync(f.worktree));
  assert.equal(fs.readFileSync(path.join(shared, "keep.txt"), "utf8"), "shared");
});

for (const [name, file] of [
  ["tracked changes", "source.txt"],
  ["untracked files", "notes.txt"],
  ["unknown ignored files", "credentials.secret"],
] as const) {
  test(`cleanup preserves ${name}`, t => {
    const f = fixture(t);
    fs.writeFileSync(path.join(f.worktree, file), "work to preserve");
    const result = f.run(["--apply", f.worktree]);
    assert.equal(result.status, 1, result.output);
    assert.match(result.output, /Contains (tracked changes or untracked files|ignored files to preserve)/);
    assert.equal(fs.readFileSync(path.join(f.worktree, file), "utf8"), "work to preserve");
  });
}

test("cleanup preserves local-only commits even when a local branch retains them", t => {
  const f = fixture(t);
  fs.writeFileSync(path.join(f.worktree, "source.txt"), "unpushed\n");
  f.git(f.worktree, "commit", "-am", "Local work");
  const result = f.run(["--apply", f.worktree]);
  assert.equal(result.status, 1, result.output);
  assert.match(result.output, /HEAD is not retained/);
  assert.ok(fs.existsSync(f.worktree));
});

for (const flags of [["--assume-unchanged"], ["--skip-worktree"], ["--assume-unchanged", "--skip-worktree"]]) {
  test(`cleanup preserves hidden edits with ${flags.join(" and ")}`, t => {
    const f = fixture(t);
    for (const flag of flags) f.git(f.worktree, "update-index", flag, "source.txt");
    const indexBefore = f.git(f.worktree, "ls-files", "-v", "--", "source.txt");
    fs.writeFileSync(path.join(f.worktree, "source.txt"), "hidden work to preserve\n");
    assert.equal(f.git(f.worktree, "status", "--porcelain"), "", "normal status hides this edit");
    const result = f.run(["--apply", f.worktree]);
    assert.equal(result.status, 1, result.output);
    assert.match(result.output, /assume-unchanged or skip-worktree/);
    assert.equal(fs.readFileSync(path.join(f.worktree, "source.txt"), "utf8"), "hidden work to preserve\n");
    assert.equal(f.git(f.worktree, "ls-files", "-v", "--", "source.txt"), indexBefore, "index flags stay intact");
  });
}

test("cleanup fetches and prunes stale origin branches before deciding", t => {
  const f = fixture(t);
  fs.writeFileSync(path.join(f.worktree, "source.txt"), "feature\n");
  f.git(f.worktree, "commit", "-am", "Feature");
  f.git(f.worktree, "push", "origin", "feature");
  f.git(f.remote, "update-ref", "-d", "refs/heads/feature");
  assert.ok(f.git(f.repo, "rev-parse", "origin/feature"), "a stale local tracking ref still exists");
  const result = f.run(["--apply", f.worktree]);
  assert.equal(result.status, 1, result.output);
  assert.match(result.output, /HEAD is not retained/);
  assert.ok(fs.existsSync(f.worktree));
});

test("cleanup preserves everything when fetching origin fails", t => {
  const f = fixture(t);
  fs.renameSync(f.remote, `${f.remote}.unavailable`);
  const result = f.run(["--apply", f.worktree]);
  assert.equal(result.status, 1, result.output);
  assert.match(result.output, /Cleanup stopped/);
  assert.ok(fs.existsSync(f.worktree));
});

test("cleanup preserves locked worktrees", t => {
  const f = fixture(t);
  f.git(f.repo, "worktree", "lock", "--reason", "Agent still working", f.worktree);
  const result = f.run(["--apply", f.worktree]);
  assert.equal(result.status, 1, result.output);
  assert.match(result.output, /Worktree is locked/);
  assert.ok(fs.existsSync(f.worktree));
});

test("cleanup preserves a checkout with a running process", async t => {
  const f = fixture(t);
  const child = spawn(process.execPath, ["-e", 'process.send("ready"); setInterval(() => {}, 1000)'], {
    cwd: f.worktree,
    stdio: ["ignore", "ignore", "ignore", "ipc"],
  });
  t.after(() => child.kill());
  await once(child, "message");
  const result = f.run(["--apply", f.worktree]);
  assert.equal(result.status, 1, result.output);
  assert.match(result.output, /running process/);
  assert.ok(fs.existsSync(f.worktree));
  child.kill();
  await once(child, "exit");
});

test("cleanup fails closed when process inspection fails", t => {
  const f = fixture(t);
  const bin = path.join(f.root, "bin");
  fs.mkdirSync(bin);
  fs.writeFileSync(path.join(bin, "lsof"), "#!/bin/sh\nexit 1\n", { mode: 0o755 });
  const result = f.run(["--apply", f.worktree], f.repo, { ...process.env, PATH: `${bin}:${process.env.PATH}` });
  assert.equal(result.status, 1, result.output);
  assert.ok(fs.existsSync(f.worktree));
});

test("cleanup rejects main/current paths, unknown paths and nested worktrees", t => {
  const f = fixture(t);
  const main = f.run(["--apply", f.repo]);
  assert.equal(main.status, 1, main.output);
  assert.match(main.output, /main and current/);
  const current = f.run(["--apply", f.worktree], f.worktree);
  assert.equal(current.status, 1, current.output);
  assert.match(current.output, /main and current/);
  const unknown = f.run(["--apply", f.root]);
  assert.equal(unknown.status, 1, unknown.output);
  assert.match(unknown.output, /Not a registered worktree/);
  const nested = path.join(f.worktree, "nested");
  f.git(f.repo, "worktree", "add", "--detach", nested);
  const parent = f.run(["--apply", f.worktree]);
  assert.equal(parent.status, 1, parent.output);
  assert.match(parent.output, /Contains another registered worktree/);
  assert.ok(fs.existsSync(nested));
});

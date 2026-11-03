// Remove explicitly named, finished worktrees after their agents/preview processes have stopped.
// Dry run: node scripts/worktree-cleanup.mjs <path>...
// Remove:  node scripts/worktree-cleanup.mjs --apply <path>...
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const generated = new Set(["node_modules", "dist", "coverage", "test-results", "playwright-report"]);
const cwd = fs.realpathSync(process.cwd());
const git = (dir, ...args) =>
  execFileSync("git", ["--no-optional-locks", "-C", dir, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 32 * 1024 * 1024,
  });
const inside = (parent, child) => child === parent || child.startsWith(`${parent}${path.sep}`);

function worktrees() {
  return git(cwd, "worktree", "list", "--porcelain", "-z")
    .split("\0\0")
    .filter(Boolean)
    .map(record => {
      const fields = Object.fromEntries(
        record.split("\0").map(field => {
          const space = field.indexOf(" ");
          return space < 0 ? [field, true] : [field.slice(0, space), field.slice(space + 1)];
        }),
      );
      return { ...fields, worktree: path.resolve(fields.worktree) };
    });
}

function activeDirectories() {
  // lsof is available on macOS and Linux. Refuse cleanup if the process check cannot run.
  // Inspect this user's processes; other users should not have write access to these checkouts.
  const result = spawnSync("lsof", ["-n", "-P", "-a", "-u", String(process.getuid()), "-d", "cwd", "-F0pn"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error || result.status !== 0 || result.stderr)
    throw new Error(`Process cwd inspection failed: ${result.error?.message ?? (result.stderr || result.status)}`);
  const directories = result.stdout
    .split("\0")
    .map(field => field.replace(/^\n/, ""))
    .filter(field => field.startsWith("n/"))
    .map(field => field.slice(1));
  if (!directories.includes(cwd)) throw new Error("Process cwd inspection was incomplete; keep all worktrees.");
  return directories;
}

function inspect(target, list) {
  const tree = list.find(item => item.worktree === target);
  if (!tree) throw new Error("Not a registered worktree of this repository.");
  if (tree === list[0] || inside(target, cwd)) throw new Error("Keep the main and current worktrees.");
  if (list.some(item => item !== tree && inside(target, item.worktree)))
    throw new Error("Contains another registered worktree.");
  if (tree.locked !== undefined) throw new Error("Worktree is locked; its owner must stop the agent and unlock it.");
  if (fs.realpathSync(target) !== target) throw new Error("Use the worktree's canonical path.");
  if (activeDirectories().some(dir => inside(target, dir)))
    throw new Error("A running process has its cwd inside this worktree.");
  // Git status and worktree remove can both overlook edits hidden by these index flags.
  const flagged = git(target, "ls-files", "-v", "-z")
    .split("\0")
    .filter(entry => /^[a-zS] /.test(entry));
  if (flagged.length)
    throw new Error(
      `Contains assume-unchanged or skip-worktree entries: ${flagged.map(entry => entry.slice(2)).join(", ")}`,
    );
  if (git(target, "status", "--porcelain=v1", "--untracked-files=all"))
    throw new Error("Contains tracked changes or untracked files.");
  const ignored = git(target, "ls-files", "--others", "--ignored", "--exclude-standard", "--directory", "-z")
    .split("\0")
    .filter(Boolean);
  const unknown = ignored.filter(
    file =>
      !generated.has(file.split("/")[0]) &&
      !(path.basename(file) === ".DS_Store" && fs.lstatSync(path.join(target, file)).isFile()),
  );
  if (unknown.length) throw new Error(`Contains ignored files to preserve: ${unknown.join(", ")}`);
  const head = git(target, "rev-parse", "HEAD").trim();
  const retained = git(cwd, "for-each-ref", `--contains=${head}`, "--format=%(refname)", "refs/remotes/origin/")
    .trim()
    .split("\n")
    .filter(ref => ref && ref !== "refs/remotes/origin/HEAD");
  if (!retained.length)
    throw new Error("HEAD is not retained on a freshly fetched origin branch; preserve local work.");
  return retained[0].replace("refs/remotes/", "");
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    console.log("Usage: node scripts/worktree-cleanup.mjs [--apply] <finished-worktree>...");
    console.log("Dry run by default. Fetches origin, preserves branches and refuses unsafe or active worktrees.");
    return;
  }
  const apply = args.includes("--apply");
  const targets = args.filter(arg => arg !== "--apply");
  if (!targets.length || targets.some(arg => arg.startsWith("-")))
    throw new Error("Specify worktree paths; use --help for usage.");
  // An explicit refspec makes this reliable even in clones with a narrow fetch configuration.
  git(cwd, "fetch", "--prune", "origin", "+refs/heads/*:refs/remotes/origin/*");
  for (const target of new Set(targets.map(arg => path.resolve(cwd, arg)))) {
    try {
      const retained = inspect(target, worktrees());
      if (apply) git(cwd, "worktree", "remove", "--", target);
      console.log(`${apply ? "Removed" : "Would remove"} ${target} (HEAD retained by ${retained}; branch kept)`);
    } catch (error) {
      console.error(`Kept ${target}: ${error.message}`);
      process.exitCode = 1;
    }
  }
}

try {
  main();
} catch (error) {
  console.error(`Cleanup stopped: ${error.message}`);
  process.exitCode = 1;
}

// Select the validation path without dependencies. Renames count as deletion + addition so both paths are checked.
// Local: node scripts/check-scope.mjs <base-ref> <head-ref> (also includes working-tree and untracked changes).
// CI:    node scripts/check-scope.mjs --event (PR merge-base diff, or the entire before/after push).
import { execFileSync } from "node:child_process";
import fs from "node:fs";

const git = (...args) => execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const paths = output => output.split("\0").filter(Boolean);
const commit = ref => git("rev-parse", "--verify", "--end-of-options", `${ref}^{commit}`).trim();
const markdown = file => /^(?:[^/]+|docs\/.+|\.claude\/agents\/[^/]+)\.md$/s.test(file);

function docsOnly() {
  const args = process.argv.slice(2);
  const eventMode = args.length === 1 && args[0] === "--event";
  let base;
  let head;
  let comparison = "...";
  if (eventMode) {
    const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
    if (process.env.GITHUB_EVENT_NAME === "pull_request") {
      base = event.pull_request?.base?.sha;
      head = event.pull_request?.head?.sha;
    } else if (process.env.GITHUB_EVENT_NAME === "push") {
      base = event.before;
      head = event.after;
      comparison = "..";
    } else throw new Error("Unsupported event");
    if (![base, head].every(ref => typeof ref === "string" && /^[a-f0-9]{40}$/.test(ref)))
      throw new Error("Missing event commit IDs");
  } else {
    if (args.length !== 2) throw new Error("Usage: check-scope.mjs <base-ref> <head-ref> | --event");
    [base, head] = args;
  }
  const changed = paths(
    git("diff", "--no-renames", "--name-only", "-z", `${commit(base)}${comparison}${commit(head)}`, "--"),
  );
  if (!eventMode) {
    changed.push(...paths(git("diff", "--no-renames", "--name-only", "-z", commit(head), "--")));
    changed.push(...paths(git("ls-files", "--others", "--exclude-standard", "-z")));
  }
  return changed.length > 0 && changed.every(markdown);
}

let docs = false;
try {
  docs = docsOnly();
} catch (error) {
  console.error(`Scope unavailable; using full validation: ${error.message}`);
}
const result = `docs_only=${docs}\n`;
process.stdout.write(result);
if (process.argv[2] === "--event" && process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, result);

// Builds a pull request, branch or commit and opens it in two phone-sized browser windows and a desktop one, each
// with dark and light tabs, for reviewing UI changes:
//   npm run preview -- 68                 pull request #68
//   npm run preview -- feat/5-input-tabs  a branch (local or GitHub's, whichever is newer), tag or commit
//   npm run preview                       this checkout, uncommitted changes included; the windows reload whenever
//                                         dist/index.html changes, so run `npm run dev` alongside for live reload
// Pull requests and refs are built in a detached git worktree at .preview/ in the main checkout (gitignored), which
// shares the main checkout's node_modules when package-lock.json is the same and runs `npm ci` otherwise.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const PHONES = [375, 430]; // phone window widths, from the left edge of the screen
const PHONE_HEIGHT = 860;
const WINDOW_CHROME = 120; // title bar and toolbar above the page
const MIN_DESKTOP = 800; // wide enough for the desktop layout; on small screens it overlaps the phones
const GAP = 10; // between windows

// Runs git in the given directory (with -C, so it never acts on the wrong checkout); returns its output, or null
// if the command fails
const git = (dir, args) => {
  try {
    return execFileSync("git", ["-C", dir, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
};
const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: "inherit" });
const fail = message => {
  console.error(message);
  process.exit(1);
};

// The checkout this was run from (maybe an agent's worktree), and the main checkout it belongs to
const here = path.resolve(import.meta.dirname, "..");
const common = git(here, ["rev-parse", "--git-common-dir"]);
if (common === null) fail(`${here} isn't a git checkout; run this from a clone of the project`);
const root = path.dirname(path.resolve(here, common));
const target = process.argv[2];
if (target?.startsWith("-")) fail(`Unknown option ${target}; usage: npm run preview [-- <PR number|branch|commit>]`);

let dir = here;
if (target) {
  // Branches are shared by all worktrees, so a local branch includes an agent's commits that aren't pushed yet;
  // fetch too, and take GitHub's version when it's ahead (e.g. local main that hasn't been pulled)
  const pr = /^\d+$/.test(target); // an all-digit target is always a pull request number, never a branch
  const local = pr ? null : git(root, ["rev-parse", "--verify", "--quiet", `${target}^{commit}`]);
  const fetched = git(root, ["fetch", "--quiet", "origin", pr ? `pull/${target}/head` : target]);
  // ^{commit} turns an annotated tag into its commit, so it compares with the local one
  const remote = fetched === null ? null : git(root, ["rev-parse", "FETCH_HEAD^{commit}"]);
  if (local && !remote) console.warn(`Couldn't fetch ${target} from GitHub (not pushed, or offline); using local`);
  const behind = local && remote && git(root, ["merge-base", "--is-ancestor", local, remote]) !== null;
  const commit = behind ? remote : (local ?? remote);
  if (!commit)
    fail(pr ? `Couldn't find pull request #${target} on GitHub` : `Couldn't find ${target} locally or on GitHub`);
  console.log(`Previewing ${commit.slice(0, 7)} (${commit === local ? "local" : "GitHub"})`);

  // A detached checkout in its own worktree, so it works even when another worktree has the branch checked out.
  // Reuse .preview only if it's a worktree of its own: inside a plain directory git would find the main checkout
  // and force the checkout there.
  dir = path.join(root, ".preview");
  if (fs.existsSync(dir)) {
    if (git(dir, ["rev-parse", "--show-toplevel"]) !== fs.realpathSync(dir))
      fail(`${dir} exists but isn't a git worktree; delete it and run again`);
    run("git", ["-C", dir, "checkout", "--quiet", "--force", "--detach", commit]);
  } else {
    // Forget a .preview worktree that was deleted without `git worktree remove`, or adding it again fails
    run("git", ["-C", root, "worktree", "prune"]);
    run("git", ["-C", root, "worktree", "add", "--quiet", "--detach", dir, commit]);
  }

  // Reuse the main checkout's packages when the lockfile matches; otherwise install the branch's own
  const lockfile = d => fs.readFileSync(path.join(d, "package-lock.json"), "utf8");
  const modules = path.join(dir, "node_modules");
  const linked = fs.lstatSync(modules, { throwIfNoEntry: false })?.isSymbolicLink();
  if (lockfile(dir) === lockfile(root)) {
    const shared = path.join(root, "node_modules");
    if (!fs.existsSync(shared)) fail(`${root} has no node_modules; run \`npm ci\` there first`);
    if (!linked) {
      fs.rmSync(modules, { recursive: true, force: true });
      fs.symlinkSync(shared, modules);
    }
  } else {
    if (linked) fs.rmSync(modules);
    run("npm", ["ci", "--silent"], dir);
  }
}
run("npm", ["run", "--silent", "build"], dir);

const file = path.join(dir, "dist", "index.html");
if (!fs.existsSync(file)) fail(`${file} not found; run \`npm run build\` first`);

const pages = [];
const browsers = [];

// Registered before any window opens, so Ctrl+C during startup still closes the browsers
async function quit() {
  await Promise.all(browsers.map(b => b.close().catch(() => {})));
  process.exit(0);
}
process.on("SIGINT", quit);
process.on("SIGTERM", quit);

// Opens a browser window with a dark tab (shown first) and a light tab, and returns the dark one
async function open(name, options) {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext(options);
  const tabs = [];
  for (const scheme of ["dark", "light"]) {
    const page = await context.newPage();
    const label = `${name} ${scheme}`;
    await page.emulateMedia({ colorScheme: scheme });
    page.on("load", () =>
      page
        .evaluate(l => {
          document.title = `${l} · ${document.title}`;
        }, label)
        .catch(() => {}),
    );
    page.on("pageerror", e => console.error(`[${label}] ${e.message}`));
    await page.goto(pathToFileURL(file).href);
    // On macOS closing a window leaves its browser running (and Cmd+Q doesn't reach a browser Playwright controls),
    // so close the browser once both its tabs are closed, and stop when every browser is gone
    page.on("close", () => {
      tabs.splice(tabs.indexOf(page), 1);
      pages.splice(pages.indexOf(page), 1);
      if (!tabs.length) browser.close().catch(() => {});
    });
    tabs.push(page);
    pages.push(page);
  }
  await tabs[0].bringToFront();
  browser.on("disconnected", () => {
    browsers.splice(browsers.indexOf(browser), 1);
    if (!browsers.length) process.exit(0);
  });
  browsers.push(browser);
  return tabs[0];
}

// Moves and resizes a page's window, and returns the bounds it actually got
async function place(page, bounds) {
  const cdp = await page.context().newCDPSession(page);
  const { windowId } = await cdp.send("Browser.getWindowForTarget");
  await cdp.send("Browser.setWindowBounds", { windowId, bounds });
  return (await cdp.send("Browser.getWindowBounds", { windowId })).bounds;
}

// The desktop window is a normal one (resizing it reflows the page), so it can report the real screen size
const desktop = await open("desktop", { viewport: null });
const display = await desktop.evaluate(() => ({
  left: screen.availLeft,
  top: screen.availTop,
  width: screen.availWidth,
  height: screen.availHeight,
}));
const height = Math.min(PHONE_HEIGHT, display.height - WINDOW_CHROME); // fits short screens
let left = display.left;
for (const width of PHONES) {
  const phone = await open(`${width}`, {
    viewport: { width, height },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
  });
  // Chromium may make the window wider than asked, so step along by the size it actually got
  left += (await place(phone, { left, top: display.top, width, height: height + WINDOW_CHROME })).width + GAP;
}
// Against the right edge of the screen, up to two thirds of its width but not over the phones, unless that would
// leave it narrower than MIN_DESKTOP (and never wider than the screen)
const free = Math.min(Math.round((display.width * 2) / 3), display.left + display.width - left);
const width = Math.min(display.width, Math.max(MIN_DESKTOP, free));
await place(desktop, { left: display.left + display.width - width, top: display.top, width, height: display.height });

console.log(
  `Previewing ${target ? `${target} (${dir})` : "this checkout"}. Close the windows or press Ctrl+C to stop.`,
);
if (!target) {
  let timer;
  fs.watch(path.dirname(file), () => {
    clearTimeout(timer);
    timer = setTimeout(() => Promise.all(pages.map(p => p.reload().catch(() => {}))), 200);
  });
}

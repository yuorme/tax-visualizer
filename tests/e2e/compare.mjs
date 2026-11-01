// Compares the page built at a git ref with the page built from the working tree, so a reviewer can see what a UI
// change does without reading screenshots:
//   npm run compare -- <git-ref>       (default origin/main)
// The ref is built in a temporary git worktree under $TMPDIR (removed afterwards); it shares this checkout's
// node_modules when package-lock.json is the same at both, and runs `npm ci` there otherwise. Both pages are opened
// with page.mjs, walked through the same steps at 375 px, 430 px and desktop width in light and dark mode, and after
// each step their visible text (innerText) and control state (values, checked, open, aria-pressed and the like) are
// diffed. Identical differences seen in several runs print once, with where they were seen. Exits 1 on any
// difference, 2 if a build fails.
//
// STEPS duplicates a short version of smoke.mjs's steps (smoke.mjs runs on import, so it can't export them). A step
// that throws on one side (say, a renamed selector) is recorded as a difference, not a crash.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";

const root = path.resolve(import.meta.dirname, "../..");
const ref = process.argv.slice(2).find(a => !a.startsWith("-")) ?? "origin/main";
const WIDTHS = [375, 430, 1280];
const SCHEMES = ["light", "dark"];
const MAX_LINES = 12; // diff lines printed per difference

const sh = (cmd, args, cwd = root) =>
  execFileSync(cmd, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });

const STEPS = [
  ["default", async () => {}],
  [
    "income 28k, 1 child, rent",
    async p => {
      await p.fill("#income", "28,000");
      await p.dispatchEvent("#income", "input");
      await p.$eval("#kids", el => {
        el.value = 1;
        el.dispatchEvent(new Event("input", { bubbles: true }));
      });
      await p.$eval("#cred-panel", el => {
        el.open = true;
      });
      await p.fill("#rent", "1,200");
      await p.dispatchEvent("#rent", "input");
    },
  ],
  [
    "partner, BC home, $ view",
    async p => {
      await p.click("#add-partner");
      await p.selectOption("#home", "BC");
      await p.click("#m-usd");
    },
  ],
  [
    "investments, Quebec destination",
    async p => {
      await p.$eval("#invest", el => {
        el.open = true;
      });
      await p.fill("#cg", "20,000");
      await p.dispatchEvent("#cg", "input");
      await p.selectOption("#dest", "QC");
      await p.click("#m-pct");
    },
  ],
  [
    "home value, frugality, sort",
    async p => {
      await p.$eval("#prop-panel", el => {
        el.open = true;
      });
      await p.fill("#hv", "750,000");
      await p.dispatchEvent("#hv", "input");
      await p.$eval("#frug", el => {
        el.value = -20;
        el.dispatchEvent(new Event("input", { bubbles: true }));
      });
      await p.click("#sort-geo");
    },
  ],
];

/** Visible text, one line per entry, and every control's state, one line per control. */
const capture = p =>
  p.evaluate(() => {
    const key = (el, i) => {
      if (el.id) return `#${el.id}`;
      const owner = el.parentElement?.closest("[id]");
      return `${owner ? `#${owner.id} ` : ""}${el.tagName.toLowerCase()}[${i}]`;
    };
    const controls = [
      ...document.querySelectorAll("input, select, textarea, details, [aria-pressed], [aria-expanded], [aria-checked]"),
    ].map((el, i) => {
      const s = [];
      if ("value" in el && el.tagName !== "BUTTON") s.push(`value=${JSON.stringify(el.value)}`);
      if (el.type === "checkbox" || el.type === "radio") s.push(`checked=${el.checked}`);
      if (el.tagName === "DETAILS") s.push(`open=${el.open}`);
      if (el.disabled) s.push("disabled");
      for (const a of ["aria-pressed", "aria-expanded", "aria-checked"])
        if (el.hasAttribute(a)) s.push(`${a}=${el.getAttribute(a)}`);
      return `${key(el, i)} ${s.join(" ")}`;
    });
    // biome-ignore lint/performance/useDomNodeTextContent: the text a reader sees (hidden elements excluded) is the point
    const text = document.body.innerText;
    return {
      text: text
        .split("\n")
        .map(l => l.trim())
        .filter(Boolean),
      controls,
    };
  });

/** Line diff of a against b (longest common subsequence), as "- line" / "+ line" entries. */
function diffLines(a, b) {
  const n = a.length;
  const m = b.length;
  const lcs = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
  const out = [];
  let [i, j] = [0, 0];
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) [i, j] = [i + 1, j + 1];
    else if (i < n && (j === m || lcs[i + 1][j] >= lcs[i][j + 1])) out.push(`- ${a[i++]}`);
    else out.push(`+ ${b[j++]}`);
  }
  return out;
}

/** Builds the page at `ref` in a temporary worktree and returns its HTML; the worktree is always removed. */
function buildRef() {
  const commit = sh("git", ["rev-parse", "--verify", `${ref}^{commit}`]).trim();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tax-compare-"));
  try {
    sh("git", ["worktree", "add", "--detach", "--quiet", dir, commit]);
    const lock = f => fs.readFileSync(path.join(f, "package-lock.json"), "utf8");
    if (fs.existsSync(path.join(root, "node_modules")) && lock(dir) === lock(root))
      fs.symlinkSync(path.join(root, "node_modules"), path.join(dir, "node_modules"), "dir");
    else {
      console.log(`package-lock.json differs at ${ref}: running npm ci in the temporary worktree`);
      sh("npm", ["ci", "--no-audit", "--no-fund", "--loglevel=error"], dir);
    }
    sh("npm", ["run", "--silent", "build"], dir);
    return { commit, html: fs.readFileSync(path.join(dir, "dist/index.html"), "utf8") };
  } finally {
    try {
      sh("git", ["worktree", "remove", "--force", dir]);
    } catch {
      fs.rmSync(dir, { recursive: true, force: true });
      sh("git", ["worktree", "prune"]);
    }
  }
}

let before;
try {
  before = buildRef();
  sh("npm", ["run", "--silent", "build"]);
} catch (e) {
  console.error(`build failed: ${e.message}`);
  process.exit(2);
}
const after = fs.readFileSync(path.join(root, "dist/index.html"), "utf8");
// page.mjs reads dist/index.html when it loads, so import it only once the working tree is built.
const { openPage, settle } = await import("./page.mjs");

/** Opens one build, walks it through STEPS and captures every state. */
async function run(browser, html, width, colorScheme) {
  const { page, errors, close } = await openPage(browser, { width, colorScheme, html });
  page.setDefaultTimeout(3000);
  const states = [];
  for (const [name, step] of STEPS) {
    let failed = null;
    try {
      await step(page);
      await settle(page);
    } catch (e) {
      failed = e.message.split("\n")[0];
    }
    states.push({ name, failed, ...(await capture(page)) });
  }
  await close();
  return { states, errors };
}

const differences = new Map(); // printed difference -> run label -> steps it was seen in (null: the whole run)
const note = (msg, label, step = null) => {
  const runs = differences.get(msg) ?? new Map();
  runs.set(label, [...(runs.get(label) ?? []), step]);
  differences.set(msg, runs);
};
/** "every run and step", or each run with "every step" or the steps it was seen in. */
const seenIn = runs => {
  const all = steps => steps.includes(null) || steps.length === STEPS.length;
  const total = WIDTHS.length * SCHEMES.length;
  if (runs.size === total && [...runs.values()].every(all)) return "every run and step";
  return [...runs]
    .map(([label, steps]) => `${label} (${all(steps) ? "every step" : steps.map(s => `"${s}"`).join(", ")})`)
    .join("; ");
};
const started = Date.now();
const browser = await chromium.launch();
for (const width of WIDTHS)
  for (const scheme of SCHEMES) {
    const label = `${width}px ${scheme}`;
    const [a, b] = [await run(browser, before.html, width, scheme), await run(browser, after, width, scheme)];
    if (a.errors.join() !== b.errors.join())
      note(`script errors\n  - ${a.errors.join("; ") || "none"}\n  + ${b.errors.join("; ") || "none"}`, label);
    a.states.forEach((s, i) => {
      const t = b.states[i];
      if (s.failed !== t.failed) note(`step failed\n  - ${s.failed ?? "ok"}\n  + ${t.failed ?? "ok"}`, label, s.name);
      for (const k of ["text", "controls"]) {
        const d = diffLines(s[k], t[k]);
        if (!d.length) continue;
        const more = d.length > MAX_LINES ? `\n  … ${d.length - MAX_LINES} more lines` : "";
        note(
          `${k}\n${d
            .slice(0, MAX_LINES)
            .map(l => `  ${l.slice(0, 160)}`)
            .join("\n")}${more}`,
          label,
          s.name,
        );
      }
    });
  }
await browser.close();

const seconds = ((Date.now() - started) / 1000).toFixed(1);
const runs = WIDTHS.length * SCHEMES.length;
console.log(
  `compared ${ref} (${before.commit.slice(0, 9)}, "-") with the working tree ("+"): ${runs} runs, ${STEPS.length} steps each`,
);
for (const [msg, seen] of differences) console.log(`\nDIFF ${msg}\n  seen in: ${seenIn(seen)}`);
if (differences.size) {
  console.log(`\n${differences.size} difference(s) in ${seconds}s`);
  process.exit(1);
}
console.log(`no differences in ${seconds}s`);

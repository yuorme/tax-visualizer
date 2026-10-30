// Browser smoke test for dist/index.html (run `npm run build` first). Every page is opened with the shared helper
// in page.mjs (reduced motion, fonts loaded) and walked through the same sequence of inputs (STEPS). It checks:
//  1. no script errors, in light mode at 1000, 430 and 375 px and in dark mode at 430 and 375 px;
//  2. no sideways scrolling at phone widths, after every step, in light and dark mode;
//  3. the chart, comparison table and credits panel show exactly the same text as the legacy single-file app
//     (legacy/tax-compare.html) after each step, in light mode at each width;
//  4. the UI rules in rules.mjs after every step: chart column labels are at most two characters, and no visible hint
//     text outside the info tooltips;
//  5. axe-core's colour-contrast rule at 375 px in light and dark mode, before the first and after the last step;
//  6. the built page is self-contained: it requests nothing but the external hosts listed in page.mjs.
// Known failures (rules.KNOWN) are reported but don't fail the run; `npm run e2e -- --strict` fails on them too.
import fs from "node:fs";
import { chromium } from "playwright";
import { ALLOWED_HOSTS, openPage, settle } from "./page.mjs";
import { COLUMN_COUNT, contrastViolations, inspect, KNOWN, MAX_LABEL_LENGTH } from "./rules.mjs";

const started = Date.now();
const read = f => fs.readFileSync(new URL(f, import.meta.url), "utf8");
const legacy = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${read("../../legacy/tax-compare.html")}</body></html>`;
const STRICT = process.argv.includes("--strict");
const PHONE = 500; // widths below this are phones, where the page must not scroll sideways

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
      for (const [id, v] of [
        ["cg", "20,000"],
        ["ed", "12,000"],
        ["fd", "8,000"],
      ]) {
        await p.fill(`#${id}`, v);
        await p.dispatchEvent(`#${id}`, "input");
      }
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

const capture = p =>
  p.evaluate(() => ({
    cols: [...document.querySelectorAll(".col")].map(c => [
      c.id,
      c.querySelector(".cv").textContent,
      c.querySelector(".cm").textContent,
    ]),
    title: document.getElementById("chart-title").textContent,
    // innerText, not textContent: compare the text a reader sees (hidden elements and CSS line breaks matter).
    // biome-ignore-start lint/performance/useDomNodeTextContent: rendered text is the point of this comparison
    detail: document.getElementById("detail-body").innerText,
    credits: document.getElementById("cred-list").innerText,
    // biome-ignore-end lint/performance/useDomNodeTextContent: see above
    sums: ["prop-sum", "cred-sum", "invest-sum", "spend"].map(
      id => document.getElementById(id).textContent || document.getElementById(id).value,
    ),
  }));

// Failures are grouped by message, so a problem seen in every run and step prints once, with where it was seen.
const failures = new Map();
const fail = (msg, where) => failures.set(msg, [...(failures.get(msg) ?? []), where]);
const knownSeen = new Map(Object.values(KNOWN).flatMap(o => Object.keys(o).map(sel => [sel, 0])));
let fontsMissing = false;

const browser = await chromium.launch();

/** Opens a page, walks it through STEPS, and records what each check needs after every step. */
async function run({ width, colorScheme = "light", html, contrast = false }) {
  const { page, errors, blocked, fontsLoaded, close } = await openPage(browser, { width, colorScheme, html });
  if (!fontsLoaded) fontsMissing = true;
  const states = [];
  for (const [i, [name, step]] of STEPS.entries()) {
    await step(page);
    await settle(page);
    const axe = contrast && (i === 0 || i === STEPS.length - 1) ? await contrastViolations(page) : [];
    states.push({ name, capture: await capture(page), inspect: await inspect(page), axe });
  }
  await close();
  return { states, errors, blocked };
}

/** Applies the checks that don't depend on the legacy page to one run of the built page. */
function check(label, width, { states, errors, blocked }) {
  if (errors.length) fail(`script errors: ${errors.join("; ")}`, label);
  for (const url of blocked)
    fail(`requested ${url}: the page must be self-contained (allowed hosts: ${ALLOWED_HOSTS.join(", ")})`, label);
  for (const { name, inspect: s, axe } of states) {
    const where = `${label}, "${name}"`;
    if (width < PHONE && s.scrollWidth > width) fail(`page scrolls sideways (${s.scrollWidth}px wide)`, where);
    if (s.labels.length !== COLUMN_COUNT) fail(`chart has ${s.labels.length} columns, expected ${COLUMN_COUNT}`, where);
    for (const l of s.labels)
      if (l === null || l.length === 0 || l.length > MAX_LABEL_LENGTH)
        fail(`chart column label ${JSON.stringify(l)} isn't a code of 1-${MAX_LABEL_LENGTH} characters`, where);
    for (const h of s.hints)
      if (h.known && !STRICT) knownSeen.set(h.known, knownSeen.get(h.known) + 1);
      else fail(`visible hint text outside an info tooltip, in ${h.where}: "${h.text}"`, where);
    for (const v of axe)
      if (v.known && !STRICT) knownSeen.set(v.known, knownSeen.get(v.known) + 1);
      else fail(`colour contrast: ${v.message}`, `${where} ${v.target}`);
  }
}

for (const width of [1000, 430, 375]) {
  const [a, b] = [await run({ width, contrast: width === 375 }), await run({ width, html: legacy })];
  check(`${width}px light`, width, a);
  a.states.forEach(({ name, capture: s }, i) => {
    const t = b.states[i].capture;
    for (const key of Object.keys(s))
      if (JSON.stringify(s[key]) !== JSON.stringify(t[key]))
        fail(
          `"${name}": ${key} differs from legacy\n  new:    ${JSON.stringify(s[key]).slice(0, 300)}\n  legacy: ${JSON.stringify(t[key]).slice(0, 300)}`,
          `${width}px`,
        );
  });
  console.log(`${width}px light: ${a.states.length} states checked`);
}
for (const width of [430, 375]) {
  check(`${width}px dark`, width, await run({ width, colorScheme: "dark", contrast: width === 375 }));
  console.log(`${width}px dark: ${STEPS.length} states checked`);
}
await browser.close();

if (fontsMissing)
  console.warn("warning: the web fonts didn't load (offline?), so widths were measured in fallback fonts");
for (const [rule, entries] of STRICT ? [] : Object.entries(KNOWN))
  for (const [sel, todo] of Object.entries(entries)) {
    const n = knownSeen.get(sel);
    if (n) console.warn(`known failure, not counted (${rule}, ${sel}, ${n} findings): ${todo}`);
    else console.warn(`note: known failure ${rule} "${sel}" no longer occurs; remove it from KNOWN in rules.mjs`);
  }
for (const [msg, where] of failures) console.error(`FAIL ${msg}\n  seen in: ${[...new Set(where)].join("; ")}`);
const seconds = ((Date.now() - started) / 1000).toFixed(1);
if (failures.size) {
  console.error(`${failures.size} failure(s) in ${seconds}s`);
  process.exit(1);
}
console.log(`smoke test passed in ${seconds}s`);

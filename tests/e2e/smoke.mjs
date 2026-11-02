// Browser smoke test for dist/index.html (run `npm run build` first). Every page is opened with the shared helper
// in page.mjs (reduced motion, fonts loaded) and walked through the same sequence of inputs (STEPS). It checks:
//  1. no script errors, in light mode at 1000, 430 and 375 px and in dark mode at 430 and 375 px;
//  2. no sideways scrolling at phone widths, after every step, in light and dark mode;
//  3. the chart, comparison table and credits panel show exactly the same text as the legacy single-file app
//     (legacy/tax-compare.html) after each step, in light mode at each width;
//  4. the UI rules in rules.mjs after every step: chart column labels are at most two characters, and no visible hint
//     text outside the info tooltips;
//  5. axe-core's colour-contrast rule at 375 px in light and dark mode, after every step;
//  6. the built page is self-contained: it requests nothing but the external hosts listed in page.mjs;
//  7. the tab bar under the inputs: every tab closed on first load, and a tab opens alone and closes when tapped again;
//  8. fuel tax (FUEL_STEPS, built page only, at every width and scheme): the Driving tab follows Credits, distance
//     starts at the home province's survey average and efficiency at the national one, both are editable and take 0,
//     a comma in the efficiency is a decimal point, and fuel tax is its own line in the comparison.
// The legacy page has no fuel tax, so the light-mode runs compared with it (3) set the built page's distance to 0
// first. The dark-mode runs keep the starting driving, so STEPS also run with fuel tax in the totals.
// Known failures (rules.KNOWN) are reported but don't fail the run; `npm run e2e -- --strict` fails on them too.
import fs from "node:fs";
import { chromium } from "playwright";
import { listYears, loadYear } from "../../src/data/load.ts";
import { compute } from "../../src/engine/index.ts";
import { toHousehold } from "../golden/adapter.ts";
import { CHILDCARE_STEPS } from "./childcare.mjs";
import { DEDUCTION_STEPS } from "./deductions.mjs";
import { ALLOWED_HOSTS, openPage, settle } from "./page.mjs";
import { COLUMN_COUNT, contrastViolations, inspect, KNOWN, MAX_LABEL_LENGTH } from "./rules.mjs";

const started = Date.now();
const read = f => fs.readFileSync(new URL(f, import.meta.url), "utf8");
const legacy = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${read("../../legacy/tax-compare.html")}</body></html>`;
const STRICT = process.argv.includes("--strict");
const PHONE = 500; // widths below this are phones, where the page must not scroll sideways

// The same steps run on the built page and the legacy one, which differ in how optional inputs are revealed: the
// built page has a tab bar (#tabbar) that opens one panel at a time; the legacy page has a <details> per section.
const tabbed = async p => (await p.$("#tabbar")) !== null;
/** Opens a tab on the built page, unless it's open already (clicking the open tab would close it). */
async function openTab(p, tab) {
  const button = `#tabbar [data-tab="${tab}"]`;
  if ((await p.getAttribute(button, "aria-expanded")) !== "true") await p.click(button);
}
const openDetails = (p, id) =>
  p.$eval(`#${id}`, el => {
    el.open = true;
  });
/** The tab bar as the page shows it: the tabs marked open, and the panels not hidden. */
const tabState = p =>
  p.evaluate(() => ({
    expanded: [...document.querySelectorAll("#tabbar [aria-expanded]")]
      .filter(b => b.getAttribute("aria-expanded") !== "false")
      .map(b => b.dataset.tab),
    shown: [...document.querySelectorAll(".tab-panel")].filter(el => !el.hidden).map(el => el.id),
  }));
/** A problem message unless exactly `tab` is open (or none, for null), with only its panel showing. */
async function expectTab(p, tab, when) {
  const { expanded, shown } = await tabState(p);
  const want = tab ? { expanded: [tab], shown: [`panel-${tab}`] } : { expanded: [], shown: [] };
  return JSON.stringify({ expanded, shown }) === JSON.stringify(want)
    ? []
    : [`${when}: expected ${tab ? `only the ${tab} tab` : "no tab"} open, got ${JSON.stringify({ expanded, shown })}`];
}

// Each step may return a list of problems found on the built page, which fail the run.
const STEPS = [
  ["default", async p => ((await tabbed(p)) ? expectTab(p, null, "on first load") : [])],
  [
    "a tab opens, and closes when tapped again",
    async p => {
      if (!(await tabbed(p))) return [];
      await p.click('#tabbar [data-tab="income"]');
      const opened = await expectTab(p, "income", "after tapping Income");
      await p.click('#tabbar [data-tab="income"]');
      return [...opened, ...(await expectTab(p, null, "after tapping the open Income tab"))];
    },
  ],
  [
    "income 28k, 1 child, rent",
    async p => {
      await p.fill("#income", "28,000");
      await p.dispatchEvent("#income", "input");
      await p.$eval("#kids", el => {
        el.value = 1;
        el.dispatchEvent(new Event("input", { bubbles: true }));
      });
      // Rent is under Home (Rent) on the built page, and in the credits panel on the legacy page
      if (await tabbed(p)) {
        await openTab(p, "home");
        await p.click('[data-tenure="rent"]');
      } else await openDetails(p, "cred-panel");
      await p.fill("#rent", "1,200");
      await p.dispatchEvent("#rent", "input");
      if (await tabbed(p)) await openTab(p, "credits");
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
      if (await tabbed(p)) await openTab(p, "income");
      else await openDetails(p, "invest");
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
    "home value, taxable spending, sort",
    async p => {
      // The built page is still set to Rent from step 2; the legacy page ignores rent once there's a home value
      if (await tabbed(p)) {
        await openTab(p, "home");
        await p.click('[data-tenure="own"]');
      } else await openDetails(p, "prop-panel");
      await p.fill("#hv", "750,000");
      await p.dispatchEvent("#hv", "input");
      if (await p.$("#frug")) {
        await p.$eval("#frug", el => {
          el.value = -20;
          el.dispatchEvent(new Event("input", { bubbles: true }));
        });
      } else {
        const current = Number((await p.inputValue("#spend")).replace(/[^\d]/g, ""));
        await p.fill("#spend", String(current * 0.8));
        await p.locator("#spend").blur();
      }
      await p.click("#sort-geo");
    },
  ],
];

/** Sets the built page's distance driven to 0, so it has no fuel tax, like the legacy page; leaves every tab closed. */
async function noDriving(p) {
  if (!(await tabbed(p))) return;
  await p.click('#tabbar [data-tab="driving"]');
  await p.fill("#km", "0");
  await p.dispatchEvent("#km", "input");
  await p.click('#tabbar [data-tab="driving"]');
}

// Fuel tax checks, from the page's starting values (Ontario home, Alberta destination). Expected distances are the
// provinces' 2009 Canadian Vehicle Survey averages in data/years/2026/provinces/<XX>.yaml.
const value = (p, sel) => p.$eval(sel, el => el.value);
const shown = (p, sel) => p.$eval(sel, el => !el.hidden && el.checkVisibility());
/** The comparison's fuel tax row as [label, home, destination, difference], or null when there isn't one. */
const fuelRow = p =>
  p.$$eval("#detail-body table.cmp tbody tr", rows => {
    const r = rows.find(tr => tr.cells[0]?.textContent.startsWith("Fuel tax"));
    return r ? [...r.cells].map(c => c.textContent.trim()) : null;
  });
/** Sets a text box as typing would, and leaves it. */
async function type(p, sel, text) {
  await p.fill(sel, text);
  await p.dispatchEvent(sel, "input");
  await p.$eval(sel, el => el.blur());
}
const expectValue = async (p, sel, want, when) => {
  const got = await value(p, sel);
  return got === want ? [] : [`${when}: ${sel} shows ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`];
};
const expectNoFuelRow = async (p, when) => {
  const row = await fuelRow(p);
  return row ? [`${when}: the comparison still has a fuel tax row: ${row.join(" | ")}`] : [];
};
const FUEL_STEPS = [
  [
    "fuel: starting values and the comparison line",
    async p => {
      const problems = [];
      const tabs = await p.$$eval("#tabbar [data-tab]", bs => bs.map(b => b.dataset.tab));
      if (tabs.indexOf("driving") !== tabs.indexOf("credits") + 1)
        problems.push(`the Driving tab should come right after Credits, got ${tabs.join(", ")}`);
      await openTab(p, "driving");
      problems.push(...(await expectTab(p, "driving", "after tapping Driving")));
      problems.push(...(await expectValue(p, "#km", "16,200", "Ontario home")));
      problems.push(...(await expectValue(p, "#eff", "9.0", "starting efficiency")));
      const row = await fuelRow(p);
      if (!row) problems.push("no fuel tax row in the comparison at the starting values");
      else if (!/¢ vs [\d.]+¢ a litre/.test(row[0]) || row.slice(1, 3).some(v => !/^\$[1-9]/.test(v)))
        problems.push(
          `fuel tax row should show both per-litre rates and an amount for each province: ${row.join(" | ")}`,
        );
      if (!(await shown(p, "#legend-fuel"))) problems.push("the chart legend has no fuel tax entry");
      const segs = await p.$$eval(".stack .g", els => els.filter(e => e.getBoundingClientRect().height > 0).length);
      if (segs !== 13) problems.push(`${segs} of 13 chart columns show a fuel tax segment`);
      return problems;
    },
  ],
  [
    "fuel: distance follows the home province until typed",
    async p => {
      await p.selectOption("#home", "BC");
      const problems = await expectValue(p, "#km", "12,900", "British Columbia home");
      await type(p, "#km", "20,000");
      await p.selectOption("#home", "QC");
      problems.push(...(await expectValue(p, "#km", "20,000", "typed distance after moving home to Quebec")));
      if (!(await shown(p, "#km-reset"))) problems.push("no Reset link for a typed distance");
      await p.click("#km-reset");
      problems.push(...(await expectValue(p, "#km", "14,800", "Reset with a Quebec home")));
      return problems;
    },
  ],
  [
    "fuel: 0 km and 0 L/100 km are allowed",
    async p => {
      await type(p, "#km", "0");
      const problems = await expectValue(p, "#km", "0", "distance 0");
      problems.push(...(await expectNoFuelRow(p, "distance 0")));
      if ((await p.textContent("#tab-driving-sum")) !== "none")
        problems.push("Driving tab summary should say none at 0 km");
      await p.click("#km-reset");
      await type(p, "#eff", "0");
      problems.push(...(await expectValue(p, "#eff", "0.0", "efficiency 0")));
      problems.push(...(await expectNoFuelRow(p, "efficiency 0")));
      await type(p, "#eff", "9,5");
      problems.push(...(await expectValue(p, "#eff", "9.5", "efficiency typed with a decimal comma")));
      return problems;
    },
  ],
];

const YEAR_STEPS = [
  [
    "year: latest by default, every data year available",
    async p => {
      const expected = listYears()
        .sort((a, b) => b - a)
        .map(String);
      const options = await p.locator("#tax-year option").evaluateAll(nodes => nodes.map(n => n.value));
      const problems =
        JSON.stringify(options) === JSON.stringify(expected) ? [] : ["year options differ from data years"];
      if ((await p.inputValue("#tax-year")) !== expected[0]) problems.push("default year is not the latest");
      await type(p, "#income", "48,000");
      await openTab(p, "driving");
      await type(p, "#km", "20,000");
      return problems;
    },
  ],
  ...listYears()
    .sort((a, b) => b - a)
    .map(year => [
      `year: ${year} recalculates every province and notes`,
      async p => {
        await p.selectOption("#tax-year", String(year));
        const saved = await p.evaluate(() => JSON.parse(localStorage.getItem("taxcmp")));
        const data = loadYear(year);
        const problems = [];
        const input = toHousehold({
          ...saved,
          frug: saved.spendingAdjustment ?? saved.frug ?? 0,
          efficiency: saved.eff ?? data.federal.driving?.efficiency ?? 0,
        });
        if (saved.year !== year || saved.people[0].ord !== 48000 || saved.km !== 20000)
          problems.push("year switch did not preserve income/driving or save year");
        for (const province of data.provinces) {
          const result = compute(data, province, input);
          const actual = await p.textContent(`#col-${province.code} .cv`);
          const expected = `${(result.avg * 100).toFixed(1)}${p.viewportSize().width <= 520 ? "" : "%"}`;
          if (actual !== expected) problems.push(`${province.code} ${year}: expected ${expected}, got ${actual}`);
        }
        const notes = await p.textContent("#year-notes");
        if (!notes.includes(`up to the ${year} dollar limit`))
          problems.push("notes still show another year's RRSP limit");
        const tip = await p.getAttribute('[data-note="rrsp"]', "data-tip");
        if (!tip.includes(`the ${year} limit`)) problems.push("RRSP tooltip did not follow selected year");
        const sharedSources = await p.locator("#default-sources a").count();
        if (sharedSources !== 3) problems.push("shared spending assumption sources disappeared");
        if ((await p.title()) !== `Provincial Tax Compare ${year}`) problems.push("page title did not follow year");
        const fuel = data.federal.fuelTax != null && data.federal.driving != null;
        if ((await shown(p, "#tab-driving")) !== fuel) problems.push("Driving tab does not match year's fuel coverage");
        if (!fuel && (await shown(p, "#panel-driving"))) problems.push("Driving panel stayed open without fuel data");
        if (!(await p.textContent("#year-sources")).startsWith(`Sources for ${year}:`))
          problems.push("sources did not follow year");
        return problems;
      },
    ]),
  [
    "year: selection survives reload and invalid saved year falls back",
    async p => {
      const selected = await p.inputValue("#tax-year");
      const before = await capture(p);
      await p.reload();
      await settle(p);
      const problems = [];
      if ((await p.inputValue("#tax-year")) !== selected || JSON.stringify(await capture(p)) !== JSON.stringify(before))
        problems.push("saved year/scenario did not survive reload");
      await p.evaluate(() => {
        const saved = JSON.parse(localStorage.getItem("taxcmp"));
        saved.year = "invalid";
        localStorage.setItem("taxcmp", JSON.stringify(saved));
      });
      await p.reload();
      if ((await p.inputValue("#tax-year")) !== String(Math.max(...listYears())))
        problems.push("invalid year did not fall back");
      return problems;
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
    // biome-ignore-end lint/performance/useDomNodeTextContent: see above
    // The credits table cell by cell: innerText would depend on whether its panel is open, and the built page opens
    // one panel at a time where the legacy page keeps several open.
    credits: [...document.getElementById("cred-list").rows].map(r => [...r.cells].map(c => c.textContent)),
    sums: ["prop-sum", "cred-sum", "invest-sum", "spend"].map(
      id => document.getElementById(id).textContent || document.getElementById(id).value,
    ),
  }));

// Failures are grouped by message, so a problem seen in every run and step prints once, with where it was seen.
const failures = new Map();
const fail = (msg, where) => failures.set(msg, [...(failures.get(msg) ?? []), where]);
const knownSeen = new Map(KNOWN.map(k => [k.id, 0]));
let fontsMissing = false;

const browser = await chromium.launch();

/** Opens a page, walks it through STEPS, and records what each check needs after every step. */
async function run({ width, colorScheme = "light", html, contrast = false, steps = STEPS, before = async () => {} }) {
  const { page, errors, blocked, fontsLoaded, close } = await openPage(browser, { width, colorScheme, html });
  if (!fontsLoaded) fontsMissing = true;
  await before(page);
  await settle(page);
  const states = [];
  for (const [name, step] of steps) {
    const problems = (await step(page)) ?? [];
    await settle(page);
    const axe = contrast ? await contrastViolations(page, colorScheme) : [];
    states.push({ name, problems, capture: await capture(page), inspect: await inspect(page), axe });
  }
  await close();
  return { states, errors, blocked };
}

/** Applies the checks that don't depend on the legacy page to one run of the built page. */
function check(label, width, { states, errors, blocked }) {
  if (errors.length) fail(`script errors: ${errors.join("; ")}`, label);
  for (const url of blocked)
    fail(`requested ${url}: the page must be self-contained (allowed hosts: ${ALLOWED_HOSTS.join(", ")})`, label);
  for (const { name, problems, inspect: s, axe } of states) {
    const where = `${label}, "${name}"`;
    for (const msg of problems) fail(msg, where);
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
  const [a, b] = [await run({ width, contrast: width === 375, before: noDriving }), await run({ width, html: legacy })];
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
for (const [width, colorScheme] of [
  [1000, "light"],
  [430, "light"],
  [375, "light"],
  [430, "dark"],
  [375, "dark"],
]) {
  const fuel = await run({ width, colorScheme, contrast: width === 375, steps: FUEL_STEPS });
  check(`${width}px ${colorScheme}, fuel tax`, width, fuel);
  console.log(`${width}px ${colorScheme}: ${FUEL_STEPS.length} fuel tax states checked`);
  const history = await run({ width, colorScheme, contrast: width === 375, steps: YEAR_STEPS });
  check(`${width}px ${colorScheme}, year selector`, width, history);
  console.log(`${width}px ${colorScheme}: ${YEAR_STEPS.length} year selector states checked`);
}
for (const width of [1000, 430, 375]) {
  for (const colorScheme of ["light", "dark"]) {
    const deductions = await run({ width, colorScheme, contrast: width === 375, steps: DEDUCTION_STEPS });
    check(`${width}px ${colorScheme}, deductions`, width, deductions);
    console.log(`${width}px ${colorScheme}: ${DEDUCTION_STEPS.length} deduction states checked`);
    const childcare = await run({ width, colorScheme, contrast: width === 375, steps: CHILDCARE_STEPS });
    check(`${width}px ${colorScheme}, childcare`, width, childcare);
    console.log(`${width}px ${colorScheme}: ${CHILDCARE_STEPS.length} childcare states checked`);
  }
}
await browser.close();

if (fontsMissing)
  console.warn("warning: the web fonts didn't load (offline?), so widths were measured in fallback fonts");
for (const k of STRICT ? [] : KNOWN) {
  const n = knownSeen.get(k.id);
  if (n) console.warn(`known failure, not counted (${k.id}, ${n} findings): ${k.what}`);
  else console.warn(`note: known failure "${k.id}" no longer occurs; remove it from KNOWN in rules.mjs`);
}
for (const [msg, where] of failures) console.error(`FAIL ${msg}\n  seen in: ${[...new Set(where)].join("; ")}`);
const seconds = ((Date.now() - started) / 1000).toFixed(1);
if (failures.size) {
  console.error(`${failures.size} failure(s) in ${seconds}s`);
  process.exit(1);
}
console.log(`smoke test passed in ${seconds}s`);

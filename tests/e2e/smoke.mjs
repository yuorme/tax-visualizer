// Browser smoke test for dist/index.html (run `npm run build` first). Every page is opened with the shared helper
// in page.mjs (reduced motion, fonts loaded) and walked through the same sequence of inputs (STEPS). It checks:
//  1. no script errors, in light mode at 1000, 430 and 375 px and in dark mode at 430 and 375 px;
//  2. no sideways scrolling at phone widths, after every step, in light and dark mode;
//  3. the chart, comparison table and credits panel show exactly the same text as the legacy single-file app
//     (legacy/tax-compare.html) after each step, in light mode at each width, apart from the intended wording changes
//     listed in LEGACY_WORDING;
//  4. the UI rules in rules.mjs after every step: chart column labels are at most two characters, and no visible hint
//     text outside the info tooltips;
//  5. axe-core's colour-contrast rule at 375 px in light and dark mode, after every step;
//  6. the built page is self-contained: it requests nothing but the external hosts listed in page.mjs;
//  7. the tab bar under the inputs: every tab closed on first load, and a tab opens alone and closes when tapped again;
//  8. fuel tax (FUEL_STEPS, built page only, at every width and scheme): the Driving tab follows Credits, distance
//     starts at the home province's survey average and efficiency at the national one, both are editable and take 0,
//     a comma in the efficiency is a decimal point, and fuel tax is its own line in the comparison;
//  9. other income (OTHER_STEPS, built page only, at every width and scheme): the employment income box is labelled as
//     such, each adult has an other income box above the investment boxes, other income pays no CPP/QPP or EI and gets
//     no employment amount, isn't working income for the Canada Workers Benefit, and claws back child benefits.
// The legacy page has no fuel tax, so the light-mode runs compared with it (3) set the built page's distance to 0
// first. The dark-mode runs keep the starting driving, so STEPS also run with fuel tax in the totals.
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
    "home value, frugality, sort",
    async p => {
      // The built page is still set to Rent from step 2; the legacy page ignores rent once there's a home value
      if (await tabbed(p)) {
        await openTab(p, "home");
        await p.click('[data-tenure="own"]');
      } else await openDetails(p, "prop-panel");
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

// Other income checks (#13), from the page's starting values (Ontario home, Alberta destination, $75,000 of
// employment income): the employment income box says what it holds, other income has a box of its own for each adult
// above the investment boxes, it pays no CPP/QPP or EI and gets no employment amount, it isn't working income for the
// Canada Workers Benefit, and it counts in net income for benefit clawbacks.
const text = async (p, sel) => (await p.textContent(sel)).trim();
const expectText = async (p, sel, want, when) => {
  const got = await text(p, sel);
  return got === want ? [] : [`${when}: ${sel} shows ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`];
};
/** The income tax detail's ledgers by heading (Federal, the province, Payroll): each table's row labels and values. */
const ledgers = p =>
  p.$$eval("#detail-body .ledger", els =>
    Object.fromEntries(
      els.map(el => [
        el.querySelector("h4").textContent.trim(),
        [...el.querySelectorAll("table")].map(t => [...t.rows].map(r => [...r.cells].map(c => c.textContent.trim()))),
      ]),
    ),
  );
/** The selected province's refundable credits, by name. */
const creditNames = p => p.$$eval("#cred-list tr", rows => rows.map(r => r.cells[0].textContent.trim()));
/** The comparison's child benefits for the home province, in dollars. */
const childBenefits = p =>
  p.$$eval("#detail-body table.cmp tbody tr", rows => {
    const r = rows.find(tr => tr.cells[0]?.textContent.startsWith("Child benefits"));
    return r ? Number(r.cells[1].textContent.replace(/[^\d.]/g, "")) : null;
  });
const percent = s => Number(s.replace("%", ""));
const OTHER_STEPS = [
  [
    "other income: a box of its own for each adult, above investments",
    async p => {
      const problems = await expectText(p, "#income-label", "Employment income", "starting page");
      await openTab(p, "income");
      const top = sel => p.$eval(sel, el => el.getBoundingClientRect().top);
      if (!((await top("#oth")) < (await top("#cg"))))
        problems.push("the other income box should come before the investment income boxes");
      await type(p, "#oth", "30,000");
      problems.push(...(await expectValue(p, "#oth", "30,000", "other income typed")));
      problems.push(...(await expectValue(p, "#oth-range", "30000", "other income slider")));
      problems.push(...(await expectText(p, "#other-sum", "$30,000 a year", "other income summary")));
      problems.push(...(await expectText(p, "#tab-income-sum", "$30k", "Income tab summary")));
      problems.push(...(await expectText(p, '#people .person[data-i="0"] small', "$105,000", "your total income")));
      if (!(await text(p, "#chart-title")).startsWith("Tax rate on $105,000"))
        problems.push(`the chart title should count other income: ${await text(p, "#chart-title")}`);
      // At $75,000 the next dollar of employment income pays CPP; the next dollar of other income doesn't
      const rate = Object.fromEntries((await ledgers(p)).Payroll[1].map(([l, v]) => [l, v]));
      const [other, work] = [rate["Interest, rental & other income"], rate["Employment income"]];
      if (!other || !work || !(percent(other) < percent(work)))
        problems.push(`the next dollar of other income should cost less than employment income: ${other} vs ${work}`);
      // The partner's other income is their own
      await p.click("#add-partner");
      problems.push(...(await expectValue(p, "#oth", "0", "partner added")));
      problems.push(...(await expectText(p, "#other-title", "Partner's other income", "partner added")));
      problems.push(...(await expectText(p, "#income-label", "Partner's employment income", "partner added")));
      await type(p, "#oth", "12,000");
      await p.click('#people .person[data-i="0"]');
      problems.push(...(await expectValue(p, "#oth", "30,000", "back to your income")));
      problems.push(...(await expectText(p, "#tab-income-sum", "$42k", "Income tab summary for two")));
      await p.click("#remove-partner");
      return problems;
    },
  ],
  [
    "other income: no CPP/QPP, EI or employment amount",
    async p => {
      await type(p, "#income", "0");
      const problems = [];
      const home = await ledgers(p);
      const payroll = home.Payroll[0].map(r => r[0]);
      if (payroll.some(l => /^(CPP|QPP|EI|QPIP)\b/.test(l)))
        problems.push(`payroll on other income alone: ${payroll.join(" | ")}`);
      if (!payroll.some(l => l.startsWith("Ontario Health Premium")))
        problems.push(`other income should count toward the Ontario Health Premium: ${payroll.join(" | ")}`);
      const federal = home.Federal[0].map(r => r[0]);
      if (federal.some(l => l.includes("employment amount")))
        problems.push(`employment amount on other income alone: ${federal.find(l => l.includes("employment amount"))}`);
      const notes = await p.$$eval("#detail-body p.note", els => els.map(el => el.textContent));
      if (!notes.some(n => n.includes("Taxable income is $30,000: $30,000 other income.")))
        problems.push(`the taxable income note should list the other income: ${notes.join(" | ")}`);
      await p.click('[data-view="dest"]');
      const dest = (await ledgers(p)).Payroll[0].map(r => r[0]);
      if (!dest.includes("None at this income")) problems.push(`Alberta payroll on other income: ${dest.join(" | ")}`);
      await p.click('[data-view="home"]');
      return problems;
    },
  ],
  [
    "other income: not working income for the Canada Workers Benefit",
    async p => {
      await type(p, "#oth", "15,000");
      await openTab(p, "credits");
      const problems = [];
      if ((await creditNames(p)).includes("Canada Workers Benefit"))
        problems.push("the Canada Workers Benefit is paid on $15,000 of other income");
      await type(p, "#income", "15,000");
      await openTab(p, "income");
      await type(p, "#oth", "0");
      await openTab(p, "credits");
      if (!(await creditNames(p)).includes("Canada Workers Benefit"))
        problems.push("no Canada Workers Benefit on $15,000 of employment income (the check above proves nothing)");
      return problems;
    },
  ],
  [
    "other income: counted for benefit clawbacks",
    async p => {
      await p.$eval("#kids", el => {
        el.value = 2;
        el.dispatchEvent(new Event("input", { bubbles: true }));
      });
      const before = await childBenefits(p);
      await openTab(p, "income");
      await type(p, "#oth", "40,000");
      const after = await childBenefits(p);
      return before && after !== null && after < before
        ? []
        : [`child benefits should fall when other income is added: $${before} then $${after}`];
    },
  ],
];

// Intended wording changes since the legacy page: [issue, pattern in the built page's comparison text, legacy text].
// The built page's text is rewritten with these before it's compared with the legacy page, so everything else still
// has to match exactly. Each entry must match in every legacy comparison run (the runs stop matching if the wording
// changes again, and then the entry has to go).
const LEGACY_WORDING = [
  // #13: income from a job is now "employment income", and other income has a field and a marginal rate of its own
  ["#13", /(\$[\d,]+) employment income\b/g, "$1 employment & other"],
  ["#13", /^Employment income\t/gm, "Employment & other income\t"],
  ["#13", /^Interest, rental & other income\t[^\n]*\n/gm, ""],
];
const wordingSeen = LEGACY_WORDING.map(() => new Set());
/** The built page's comparison text in the legacy page's wording; notes which entries matched in which run. */
function asLegacy(detail, run) {
  return LEGACY_WORDING.reduce((text, [, pattern, legacy], i) => {
    if (text.match(pattern)) wordingSeen[i].add(run);
    return text.replace(pattern, legacy);
  }, detail);
}

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
  a.states.forEach(({ name, capture: built }, i) => {
    const s = { ...built, detail: asLegacy(built.detail, width) };
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
LEGACY_WORDING.forEach(([issue, pattern], i) => {
  if (wordingSeen[i].size !== 3)
    fail(`legacy wording entry ${issue} ${pattern} no longer matches: remove it from LEGACY_WORDING`, "legacy runs");
});
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
  const other = await run({ width, colorScheme, contrast: width === 375, steps: OTHER_STEPS });
  check(`${width}px ${colorScheme}, other income`, width, other);
  console.log(`${width}px ${colorScheme}: ${OTHER_STEPS.length} other income states checked`);
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

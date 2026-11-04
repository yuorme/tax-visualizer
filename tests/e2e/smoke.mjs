// Browser checks for dist/index.html (run `npm run build` first), using page.mjs for reduced motion and loaded fonts.
// - Legacy comparisons retain all three widths: visible text and percent formatting depend on the viewport.
// - Every detailed functional sequence runs once at 1000px light, including every available tax year.
// - A compact visual sequence covers desktop/430/375px in both themes. It exposes each panel, expanded childcare
//   controls and invalid drafts, and reuses a representative year switch to check mobile numeric formatting.
// - Contrast scans cover those distinct visual states at 375px in both themes, not every arithmetic/persistence case.
// Every built-page state still checks script errors, unexpected requests, chart labels, visible hints and phone
// overflow. The legacy comparison disables driving because the legacy page predates fuel tax.
// Known failures (rules.KNOWN) are reported but don't fail the run; `npm run e2e -- --strict` fails on them too.
import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium } from "playwright";
import { listYears, loadYear } from "../../src/data/load.ts";
import { compute } from "../../src/engine/index.ts";
import { toHousehold } from "../golden/adapter.ts";
import { CARBON_STEPS } from "./carbon.mjs";
import { CHILDCARE_STEPS } from "./childcare.mjs";
import { DEDUCTION_STEPS } from "./deductions.mjs";
import { HISTORY_STEPS } from "./history.mjs";
import { checkManitobaFamilyLedger } from "./mb-family-benefit.mjs";
import { ALLOWED_HOSTS, openPage, settle } from "./page.mjs";
import { PORTFOLIO_RESPONSIVE_STEPS, PORTFOLIO_STEPS } from "./portfolio.mjs";
import { checkQuebecHealthFund } from "./qc-health-fund.mjs";
import { COMPARISON_STEPS, RESPONSIVE_STEPS } from "./responsive.mjs";
import { COLUMN_COUNT, contrastViolations, inspect, KNOWN, MAX_LABEL_LENGTH } from "./rules.mjs";

const started = Date.now();
const read = f => fs.readFileSync(new URL(f, import.meta.url), "utf8");
const legacy = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${read("../../legacy/tax-compare.html")}</body></html>`;
const STRICT = process.argv.includes("--strict");
const PHONE = 500; // widths below this are phones, where the page must not scroll sideways

const flagUrl = code =>
  `data:image/png;base64,${fs.readFileSync(new URL(`../../src/ui/flags/CA-${code}.png`, import.meta.url)).toString("base64")}`;
async function expectProvinceFlags(p, chart = true) {
  const home = await p.inputValue("#home"),
    dest = await p.inputValue("#dest");
  for (const [selector, code] of [
    ["#home-flag", home],
    ["#cmp-home-flag", home],
    ["#dest-flag", dest],
  ]) {
    assert.equal(await p.getAttribute(selector, "src"), flagUrl(code), `${selector} shows ${code}`);
    assert.equal(await p.getAttribute(selector, "alt"), "", "decorative flags do not repeat province names");
    assert.equal(await p.getAttribute(selector, "aria-hidden"), "true");
    assert.equal(await p.locator(selector).isVisible(), true);
  }
  if (!chart) return;
  for (const code of loadYear(Math.max(...listYears())).provinces.map(p => p.code)) {
    const selector = `#col-${code} .province-flag`;
    assert.equal(await p.getAttribute(selector, "src"), flagUrl(code), `${code} chart asset`);
    assert.equal(await p.locator(selector).isVisible(), p.viewportSize().width > 520);
    assert.equal(await p.locator(selector).evaluate(el => el.complete && el.naturalWidth > 0), true);
  }
}

const FLAG_STEPS = [
  [
    "all province selections use their supplied inline flags",
    async p => {
      const codes = loadYear(Math.max(...listYears())).provinces.map(p => p.code);
      for (const [i, code] of codes.entries()) {
        await p.selectOption("#home", code);
        await p.selectOption("#dest", codes[(i + 1) % codes.length]);
        await expectProvinceFlags(p, false);
      }
      await expectProvinceFlags(p);
    },
  ],
  [
    "flags follow swapped provinces, shared-link reload, year and sorting",
    async p => {
      await p.selectOption("#home", "QC");
      await p.selectOption("#dest", "ON");
      await p.selectOption("#home", "ON");
      await p.selectOption("#dest", "QC");
      await expectProvinceFlags(p);
      await p.evaluate(() => localStorage.clear());
      await p.reload();
      assert.equal(await p.inputValue("#home"), "ON");
      assert.equal(await p.inputValue("#dest"), "QC");
      await expectProvinceFlags(p);
      await p.selectOption("#tax-year", String(Math.min(...listYears())));
      await p.click("#sort-geo");
      await expectProvinceFlags(p);
      await p.click("#sort-rate");
      await expectProvinceFlags(p);
      await p.click("#view-history");
      assert.equal(await p.getAttribute("#home-flag", "src"), flagUrl("ON"));
      await p.click("#view-provinces");
      await expectProvinceFlags(p);
      // Native select type-ahead remains available; BC is the only code starting with B.
      await p.selectOption("#home", "AB");
      await p.focus("#home");
      await p.keyboard.press("b");
      await p.keyboard.press("Enter");
      assert.equal(await p.inputValue("#home"), "BC");
      await expectProvinceFlags(p);
    },
  ],
];

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

const propertyRow = p =>
  p.$$eval("#detail-body table.cmp tbody tr", rows => {
    const row = rows.find(tr => tr.cells[0]?.textContent.startsWith("Property tax"));
    return row ? [...row.cells].slice(1, 3).map(cell => Number(cell.textContent.replace(/[^\d.]/g, ""))) : null;
  });
const PROPERTY_STEPS = [
  [
    "property bill: optional override affects only home province",
    async p => {
      await openTab(p, "home");
      await type(p, "#hv", "500000");
      await type(p, "#pr-rate", "1");
      const before = await propertyRow(p);
      const problems = [];
      if (before?.[0] !== 5000) problems.push("blank property bill changed the existing municipal-rate override");
      await type(p, "#property-tax-bill", "4200");
      const after = await propertyRow(p);
      if (after?.[0] !== 4200 || after?.[1] !== before?.[1])
        problems.push("annual bill did not replace only the home-province tax");
      await type(p, "#property-tax-bill", "");
      if ((await propertyRow(p))?.[0] !== 5000) problems.push("empty bill did not restore the rate estimate");
      await type(p, "#property-tax-bill", "4200");
      if (!(await p.locator("#pr-rate").isDisabled())) problems.push("unused rate control remains active");
      if (
        !((await p.getAttribute('[aria-label="About your annual property tax"]', "data-tip")) ?? "").includes(
          "largest city's rate",
        )
      )
        problems.push("bill tooltip does not explain other provinces' city rates");
      if (!(await p.textContent("#prop-sum")).includes("your bill"))
        problems.push("property summary mislabels bill as rate estimate");
      return problems;
    },
  ],
  [
    "property bill: reload, year, rent and restore retain the owner's bill",
    async p => {
      await p.reload();
      await settle(p);
      const problems = await expectValue(p, "#property-tax-bill", "4,200", "saved annual bill");
      await p.selectOption("#tax-year", "2025");
      if ((await propertyRow(p))?.[0] !== 4200) problems.push("year switch lost annual bill");
      await p.click('[data-tenure="rent"]');
      await type(p, "#rent", "1200");
      if (await propertyRow(p)) problems.push("renter still pays retained owner bill");
      await p.click('[data-tenure="own"]');
      if ((await propertyRow(p))?.[0] !== 4200) problems.push("owner bill was lost while renting");
      await p.click("#property-tax-bill-reset");
      if ((await propertyRow(p))?.[0] !== 5000 || (await p.locator("#pr-rate").isDisabled()))
        problems.push("Use estimate did not restore the retained rate override");
      return problems;
    },
  ],
  [
    "property bill: explicit zero, missing valuation, invalid input and changing home",
    async p => {
      const problems = [];
      await type(p, "#property-tax-bill", "0");
      await p.reload();
      await settle(p);
      problems.push(...(await expectValue(p, "#property-tax-bill", "0", "saved zero bill")));
      if ((await propertyRow(p))?.[0] !== 0) problems.push("zero bill fell back to estimate");
      await type(p, "#hv", "0");
      await type(p, "#property-tax-bill", "800");
      if ((await propertyRow(p))?.[0] !== 800) problems.push("bill requires an unnecessary home valuation");
      await type(p, "#property-tax-bill", "-4");
      problems.push(...(await expectValue(p, "#property-tax-bill", "", "invalid negative bill")));
      await type(p, "#property-tax-bill", "800");
      await p.selectOption("#home", "BC");
      problems.push(...(await expectValue(p, "#property-tax-bill", "", "bill cleared for another home province")));
      if (await propertyRow(p)) problems.push("previous home's bill leaked into new province");
      return problems;
    },
  ],
];

// Unit toggles never rewrite canonical driving amounts, even when the displayed conversion is rounded.
const drivingSaved = p =>
  p.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem("taxcmp"));
    return { km: saved.km, eff: saved.eff, units: saved.drivingUnits };
  });
const drivingResults = p =>
  p.evaluate(() => ({
    chart: document.querySelector("#cols").textContent,
    detail: document.querySelector("#detail-body").textContent,
  }));
FUEL_STEPS.push([
  "fuel: US units preserve inputs, results, defaults and saved state",
  async p => {
    const problems = [];
    await p.click("#eff-reset");
    const initial = await drivingResults(p);
    await p.click('[data-driving-units="us"]');
    problems.push(...(await expectValue(p, "#km", "9,196.294", "Quebec distance in miles")));
    problems.push(...(await expectValue(p, "#eff", "26.134954", "US mpg")));
    for (const selector of ["#km", "#eff"])
      if (await p.$eval(selector, input => input.scrollWidth > input.clientWidth + 1))
        problems.push(`${selector} clips its converted value`);
    if ((await p.textContent("#eff-unit")) !== "US mpg" || (await p.textContent("#km-unit")) !== "mi a year")
      problems.push("distance and efficiency unit labels did not switch together");
    if (JSON.stringify(initial) !== JSON.stringify(await drivingResults(p)))
      problems.push("switching units changed tax results");
    if ((await drivingSaved(p)).km !== null || (await drivingSaved(p)).eff !== null)
      problems.push("switching units replaced province/national defaults with overrides");
    await p.selectOption("#home", "BC");
    problems.push(...(await expectValue(p, "#km", "8,015.688", "BC default in miles")));
    await type(p, "#km", "10,000");
    await type(p, "#eff", "30");
    const typed = await drivingSaved(p);
    if (typed.km !== 16093.44 || Math.abs(typed.eff - 7.840486111111111) > 1e-12)
      problems.push("US inputs did not save equivalent metric amounts");
    const result = await drivingResults(p);
    for (let i = 0; i < 4; i++) {
      await p.click('[data-driving-units="metric"]');
      await p.click('[data-driving-units="us"]');
    }
    if (
      JSON.stringify(typed) !== JSON.stringify(await drivingSaved(p)) ||
      JSON.stringify(result) !== JSON.stringify(await drivingResults(p))
    )
      problems.push("repeated unit toggles drifted inputs or results");
    await p.reload();
    await settle(p);
    problems.push(...(await expectValue(p, "#km", "10,000", "saved miles")));
    problems.push(...(await expectValue(p, "#eff", "30.0", "saved US mpg")));
    await p.click('[data-driving-units="metric"]');
    problems.push(...(await expectValue(p, "#km", "16,093.44", "equivalent metric distance")));
    if (JSON.stringify(result) !== JSON.stringify(await drivingResults(p)))
      problems.push("metric view of US inputs has different results");
    await p.click('[data-driving-units="us"]');
    await type(p, "#eff", "0");
    problems.push(...(await expectValue(p, "#eff", "∞", "no-gasoline US mpg")));
    problems.push(...(await expectNoFuelRow(p, "no-gasoline US mpg")));
    await p.click('[data-driving-units="metric"]');
    problems.push(...(await expectValue(p, "#eff", "0.0", "no-gasoline metric consumption")));
    await p.click('[data-driving-units="us"]');
    await type(p, "#eff", "30,5");
    problems.push(...(await expectValue(p, "#eff", "30.5", "decimal-comma US mpg")));
    await type(p, "#km", "0");
    problems.push(...(await expectNoFuelRow(p, "zero miles")));
    await type(p, "#km", "-100");
    problems.push(...(await expectValue(p, "#km", "0", "negative miles")));
    await type(p, "#eff", "invalid");
    if ((await drivingSaved(p)).eff !== 0) problems.push("invalid mpg did not become safe zero consumption");
    await p.click("#km-reset");
    await p.click("#eff-reset");
    if ((await drivingSaved(p)).km !== null || (await drivingSaved(p)).eff !== null)
      problems.push("Reset in US units did not restore default tracking");
    await p.focus("#km-range");
    await p.keyboard.press("End");
    if (Math.abs((await drivingSaved(p)).km - 50000) > 1e-8)
      problems.push("US distance slider no longer represents its 50,000 km maximum");
    if (!(await p.getAttribute("#km-range", "aria-valuetext")).endsWith(" mi"))
      problems.push("US distance slider has no accessible miles value");
    await p.keyboard.press("Home");
    problems.push(...(await expectNoFuelRow(p, "US slider at zero")));
    if (!((await p.getAttribute('[aria-label="About driving units"]', "data-tip")) ?? "").includes("imperial mpg"))
      problems.push("unit tooltip lacks the imperial gallon distinction");
    return problems;
  },
]);

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
        [...el.querySelector("h4").childNodes]
          .filter(n => n.nodeType === Node.TEXT_NODE)
          .map(n => n.textContent)
          .join("")
          .trim(),
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
      const notes = await p.$$eval('#detail-body [data-comparison-note="taxable income"]', els =>
        els.map(el => el.dataset.tip),
      );
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
        if (sharedSources !== 4) problems.push("shared spending and portfolio assumption sources disappeared");
        if ((await p.title()) !== `Provincial Tax Compare ${year}`) problems.push("page title did not follow year");
        const driving = data.federal.driving != null;
        if ((await shown(p, "#tab-driving")) !== driving)
          problems.push("Driving tab does not match year's fuel/carbon coverage");
        if (!driving && (await shown(p, "#panel-driving")))
          problems.push("Driving panel stayed open without fuel/carbon data");
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
      await p.evaluate(() => history.replaceState(null, "", location.pathname + location.search));
      await p.reload();
      if ((await p.inputValue("#tax-year")) !== String(Math.max(...listYears())))
        problems.push("invalid year did not fall back");
      return problems;
    },
  ],
];

// Intended wording changes since the legacy page: [issue, pattern in the built page's comparison text, legacy text].
// The built page's text is rewritten with these before it's compared with the legacy page, so everything else still
// has to match exactly. Each entry must match in every legacy comparison run (the runs stop matching if the wording
// changes again, and then the entry has to go).
const LEGACY_WORDING = [
  [
    "#13",
    /investment income adds on top of the rest of its income\./g,
    "investment income adds on top of other income.",
  ],
  // #13: income from a job is now "employment income", and other income has a field and a marginal rate of its own
  ["#13", /([Tt]axable income is \$[\d,]+: )(\$[\d,]+) employment income\b/g, "$1$2 employment & other"],
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
  p.evaluate(() => {
    const body = document.getElementById("detail-body");
    // #57 moves these exact explanations into tooltips. Compare them separately against the legacy prose,
    // retaining every word and computed amount, while still comparing all visible results and tables.
    const tips = [...body.querySelectorAll("[data-comparison-note]")];
    const notes = [...body.querySelectorAll("p.note")].filter(n => !n.textContent.startsWith("Net tax is "));
    // biome-ignore-start lint/performance/useDomNodeTextContent: preserve rendered table formatting
    let detail = body.innerText;
    for (const node of tips) {
      const heading = node.parentElement.innerText;
      detail = detail.replace(heading, heading.slice(0, -node.innerText.length));
    }
    for (const node of notes) detail = detail.replace(node.innerText, "");
    // biome-ignore-end lint/performance/useDomNodeTextContent: see above
    return {
      cols: [...document.querySelectorAll(".col")].map(c => [
        c.id,
        c.querySelector(".cv").textContent,
        c.querySelector(".cm").textContent,
      ]),
      title: document.getElementById("chart-title").textContent,
      detail: detail
        .split("\n")
        .map(line => line.trim())
        .filter(Boolean)
        .join("\n"),
      explanations: (tips.length ? tips.map(n => n.dataset.tip) : notes.map(n => n.textContent))
        .map(text => text.trim())
        .join("\n"),
      // The credits table cell by cell: innerText would depend on whether its panel is open, and the built page opens
      // one panel at a time where the legacy page keeps several open.
      credits: [...document.getElementById("cred-list").rows].map(r => [...r.cells].map(c => c.textContent)),
      sums: ["prop-sum", "cred-sum", "invest-sum", "spend"].map(
        id => document.getElementById(id).textContent || document.getElementById(id).value,
      ),
    };
  });

const SHARE_STEPS = [
  [
    "the default address is compact and explicit; edits keep it current",
    async p => {
      assert.match(p.url(), /#s=1&year=\d{4}$/);
      await type(p, "#income", "83,456");
      const params = new URL(p.url()).hash;
      assert.match(params, /people=/);
      assert.equal(new URLSearchParams(params.slice(1)).has("spend"), false);
      await p.evaluate(() => {
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: {
            writeText: async value => {
              window.copiedScenario = value;
            },
          },
        });
      });
      await p.click("#copy-link");
      assert.equal(await p.evaluate(() => window.copiedScenario), p.url());
      assert.equal(await p.textContent("#share-status"), "Link copied");
      await type(p, "#income", "84,000");
      assert.equal(await p.textContent("#share-status"), "");
    },
  ],
  [
    "every saved input and result survives sharing into a fresh context with conflicting storage",
    async p => {
      await p.evaluate(() => {
        const state = JSON.parse(localStorage.getItem("taxcmp"));
        Object.assign(state, {
          year: 2025,
          home: "QC",
          dest: "BC",
          adults: 3,
          kids: 2,
          under6: 1,
          people: [
            { ord: 84000, oth: 1234, cg: -500, ed: 2000, nd: 300, fd: 400, ded: 100, rrsp: 1200, fhsa: 800 },
            { ord: 35000, oth: 500, cg: 1000, ed: 200, nd: 100, fd: 300, ded: 50 },
          ],
          active: 1,
          spouse: false,
          sort: "geo",
          view: "dest",
          metric: "usd",
          useBpa: false,
          useCredits: true,
          whRate: 0.3,
          spend: 4000,
          spendingAdjustment: -20,
          homeValue: 650000,
          propOverride: 0.007,
          propertyTaxBill: 4200.25,
          rent: 1500,
          tenure: "own",
          tab: "home",
          km: 16093.44,
          eff: 7.840486111111111,
          drivingUnits: "us",
          historyOpen: false,
          historyMode: "nominal",
          childcare: {
            monthly: 1000,
            mode: "manual",
            activeChildren: 2,
            earnings: [40000, 0],
            earningsOverridden: [true, true],
            claims: [4000, 0],
            touched: ["care-age-0", "care-age-1"],
            children: [
              {
                age: 4,
                expenses: 8000,
                qcEligibleExpenses: 7000,
                disabilityTaxCredit: false,
                infirm: false,
                qcSevereImpairment: false,
              },
              {
                age: 10,
                expenses: 4000,
                qcEligibleExpenses: 3000,
                disabilityTaxCredit: true,
                infirm: true,
                qcSevereImpairment: true,
              },
            ],
          },
        });
        localStorage.setItem("taxcmp", JSON.stringify(state));
        history.replaceState(null, "", location.pathname);
      });
      await p.reload();
      await settle(p);
      const expected = await p.evaluate(() => JSON.parse(localStorage.getItem("taxcmp")));
      const expectedResults = await capture(p);
      const link = p.url();
      const recipient = await openPage(browser, { width: 1000 });
      counts.pages++;
      try {
        await recipient.page.evaluate(url => {
          localStorage.setItem("taxcmp", JSON.stringify({ v: 3, year: 2026, home: "AB", people: [{ ord: 999 }] }));
          history.replaceState(null, "", url);
        }, link);
        await recipient.page.reload();
        await settle(recipient.page);
        assert.deepEqual(await recipient.page.evaluate(() => JSON.parse(localStorage.getItem("taxcmp"))), expected);
        assert.deepEqual(await capture(recipient.page), expectedResults);
        assert.deepEqual(recipient.errors, []);
        assert.deepEqual(recipient.blocked, []);
      } finally {
        await recipient.close();
      }
    },
  ],
  [
    "history mode, disabled credits, zero overrides and drafts also reproduce",
    async p => {
      await openTab(p, "credits");
      await p.click("label[for=cred-toggle]");
      assert.equal(await p.isChecked("#cred-toggle"), false);
      await openTab(p, "home");
      await type(p, "#property-tax-bill", "0");
      await p.click('[data-tenure="rent"]');
      await p.$eval("#childcare-details", el => {
        el.open = true;
      });
      await p.fill("#care-age-0", "not an age");
      await p.locator("#care-age-0").blur();
      await p.click("#view-history");
      await p.click("#history-real");
      const expected = await p.evaluate(() => JSON.parse(localStorage.getItem("taxcmp")));
      const rows = await p.textContent("#history-rows");
      await p.evaluate(() => localStorage.clear());
      await p.reload();
      assert.deepEqual(await p.evaluate(() => JSON.parse(localStorage.getItem("taxcmp"))), expected);
      assert.equal(await p.textContent("#history-rows"), rows);
      assert.equal(await p.getAttribute("#history-real", "aria-pressed"), "true");
    },
  ],
  [
    "clipboard failure exposes a selectable link without changing the scenario",
    async p => {
      await p.evaluate(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined }));
      const before = p.url();
      await p.click("#copy-link");
      assert.equal(await p.inputValue("#share-url"), before);
      assert.equal(await p.$eval("#share-url", el => el.selectionEnd - el.selectionStart), before.length);
      assert.equal(await p.locator("#share-url").isVisible(), true);
    },
  ],
  [
    "old, malformed and explicit default links ignore saved values",
    async p => {
      for (const hash of [
        "#s=0&year=2019",
        "#s=1&year=9999&people=broken&kids=1.5&home=%22ZZ%22",
        `#s=1&year=${Math.max(...listYears())}`,
      ]) {
        await p.evaluate(hash => history.replaceState(null, "", hash), hash);
        await p.reload();
        assert.equal(await p.inputValue("#income"), "75,000");
        assert.equal(await p.inputValue("#home"), "ON");
        assert.equal(await p.inputValue("#kids"), "0");
        assert.equal(await p.inputValue("#tax-year"), String(Math.max(...listYears())));
      }
      // Pasting another scenario into the address bar can navigate within the same document.
      await Promise.all([
        p.waitForEvent("load"),
        p.evaluate(() => {
          location.hash = "s=1&people=%5B%7B%22ord%22%3A12345%7D%5D";
        }),
      ]);
      assert.equal(await p.inputValue("#income"), "12,345");
    },
  ],
];

// Failures are grouped by message, so a problem seen in every run and step prints once, with where it was seen.
const failures = new Map();
const fail = (msg, where) => failures.set(msg, [...(failures.get(msg) ?? []), where]);
const knownSeen = new Map(KNOWN.map(k => [k.id, 0]));
let fontsMissing = false;
const counts = { pages: 0, states: 0, contrast: 0 };

const browser = await chromium.launch();

/** Opens a page, walks it through STEPS, and records what each check needs after every step. */
async function run({ width, colorScheme = "light", html, contrast = false, steps = STEPS, before = async () => {} }) {
  counts.pages++;
  const { page, errors, blocked, fontsLoaded, close } = await openPage(browser, { width, colorScheme, html });
  if (!fontsLoaded) fontsMissing = true;
  await before(page);
  await settle(page);
  const states = [];
  for (const [name, step, options = {}] of steps) {
    counts.states++;
    const problems = (await step(page)) ?? [];
    await settle(page);
    const scanContrast = contrast && options.contrast !== false;
    if (scanContrast) counts.contrast++;
    const axe = scanContrast ? await contrastViolations(page, colorScheme) : [];
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
  for (const colorScheme of ["light", "dark"]) {
    const family = await run({
      width,
      colorScheme,
      steps: [["Manitoba family ledger, ages 17–19 and persistence", checkManitobaFamilyLedger]],
    });
    check(`${width}px ${colorScheme}, Manitoba family benefit`, width, family);
    const healthFund = await run({
      width,
      colorScheme,
      steps: [["Quebec Health Services Fund inputs, totals and historical coverage", checkQuebecHealthFund]],
    });
    check(`${width}px ${colorScheme}, Quebec Health Services Fund`, width, healthFund);
  }
}

for (const width of [1000, 430, 375]) {
  const [a, b] = [await run({ width, before: noDriving }), await run({ width, html: legacy })];
  check(`${width}px light`, width, a);
  a.states.forEach(({ name, capture: built }, i) => {
    const s = {
      ...built,
      detail: asLegacy(built.detail, width),
      explanations: asLegacy(built.explanations, width),
    };
    const t = b.states[i].capture;
    if (name === "income 28k, 1 child, rent") {
      // #145: independently audited MB tax 126.5598 → 0; the +$100 tax 136.54116 → 0.
      // Correct only these two obsolete chart values; every other legacy cell and state still compares exactly.
      // Full arithmetic and before/after inventory: docs/verification/145-manitoba-family-benefit.md.
      const suffix = width < PHONE ? "" : "%";
      const mb = t.cols.find(col => col[0] === "col-MB");
      assert.deepEqual(mb, ["col-MB", `-19.4${suffix}`, `17.6${suffix}`]);
      mb[1] = `-19.8${suffix}`;
      mb[2] = `7.6${suffix}`;
    }
    if (name === "investments, Quebec destination" || name === "home value, taxable spending, sort") {
      // #91: partner's subject income = 20,000 × 50% + 12,000 + 8,000 = 30,000.
      // 2026 Schedule F: (30,000 − 18,500) × 1% = 115. Income tax/benefits are unchanged.
      // Guard every obsolete value before replacing it; every other cell still compares exactly.
      const own = name === "home value, taxable spending, sort";
      const changes = [
        [
          "CPP/QPP, EI & health premiums\t$7,284\t$7,741\t+$458",
          "CPP/QPP, EI & health premiums\t$7,284\t$7,856\t+$573",
        ],
        ["Partner\t$22,788\t$29,503\t+$6,715", "Partner\t$22,788\t$29,618\t+$6,830"],
        ["Tax on investment income\t$7,161\t$9,756\t+$2,595", "Tax on investment income\t$7,161\t$9,871\t+$2,710"],
        ...(own
          ? [
              ["cost your household $11,700 more", "cost your household $11,815 more"],
              [
                "Net tax is 29.3% of income in Quebec vs 21.1% in British Columbia (+8.2 points)",
                "Net tax is 29.4% of income in Quebec vs 21.1% in British Columbia (+8.3 points)",
              ],
              ["Household net tax\t$30,191\t$41,891\t+$11,700", "Household net tax\t$30,191\t$42,006\t+$11,815"],
              ["Net rate\t21.1%\t29.3%\t+8.2 pts", "Net rate\t21.1%\t29.4%\t+8.3 pts"],
              [
                "Left after all of this\t$112,809\t$101,109\t−$11,700",
                "Left after all of this\t$112,809\t$100,994\t−$11,815",
              ],
            ]
          : [
              ["cost your household $7,450 more", "cost your household $7,565 more"],
              [
                "Quebec vs 20.2% in British Columbia (+5.2 points)",
                "Quebec vs 20.2% in British Columbia (+5.3 points)",
              ],
              ["Household net tax\t$28,949\t$36,399\t+$7,450", "Household net tax\t$28,949\t$36,514\t+$7,565"],
              ["Net rate\t20.2%\t25.5%\t+5.2 pts", "Net rate\t20.2%\t25.5%\t+5.3 pts"],
              [
                "Left after all of this\t$114,051\t$106,601\t−$7,450",
                "Left after all of this\t$114,051\t$106,486\t−$7,565",
              ],
            ]),
      ];
      for (const [before, after] of changes) {
        assert.equal(t.detail.split(before).length, 2, `legacy health fund value: ${before}`);
        t.detail = t.detail.replace(before, after);
      }
      if (own) {
        const suffix = width < PHONE ? "" : "%";
        const qc = t.cols.find(col => col[0] === "col-QC");
        assert.deepEqual(qc, ["col-QC", `29.3${suffix}`, `42.1${suffix}`]);
        qc[1] = `29.4${suffix}`;
      }
    }
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
// Keep complete sequences intact: their later steps depend on state established by earlier steps.
for (const [label, steps] of [
  ["fuel tax", FUEL_STEPS],
  ["property bill", PROPERTY_STEPS],
  ["other income", OTHER_STEPS],
  ["year selector", YEAR_STEPS],
  ["deductions", DEDUCTION_STEPS],
  ["portfolio", PORTFOLIO_STEPS],
  ["history", HISTORY_STEPS],
  ["carbon pricing", CARBON_STEPS],
  ["childcare", CHILDCARE_STEPS],
  ["shareable links", SHARE_STEPS],
  ["province flags", FLAG_STEPS],
  ["comparison explanation variants", COMPARISON_STEPS.slice(3)],
]) {
  check(`1000px light, ${label}`, 1000, await run({ width: 1000, steps }));
  console.log(`1000px light: ${steps.length} ${label} states checked`);
}

// The first step establishes income/driving values; the previous year's step checks all 13 chart values and
// year-specific notes, sources and controls. Only this representative switch repeats across viewport/theme pairs.
const responsive = [
  YEAR_STEPS[0],
  YEAR_STEPS[2],
  ...RESPONSIVE_STEPS,
  // Interactions and tooltip geometry repeat across widths/themes; text-only conditional variants run once above.
  // One representative open tooltip adds contrast coverage; subsequent interactions use the same styling.
  ...COMPARISON_STEPS.slice(0, 3).map(([name, step], i) => [name, step, { contrast: i === 0 }]),
  ...PORTFOLIO_RESPONSIVE_STEPS,
  [
    "layout: driving units show equivalent values without clipping",
    async p => {
      await p.click("#view-provinces");
      await openTab(p, "driving");
      await type(p, "#km", "16,093.44");
      await type(p, "#eff", "9");
      const before = await drivingResults(p);
      await p.click('[data-driving-units="us"]');
      const problems = await expectValue(p, "#km", "10,000", "responsive US miles");
      problems.push(...(await expectValue(p, "#eff", "26.134954", "responsive US mpg")));
      if (JSON.stringify(before) !== JSON.stringify(await drivingResults(p)))
        problems.push("responsive unit toggle changed tax results");
      for (const selector of ["#km", "#eff"])
        if (await p.$eval(selector, input => input.scrollWidth > input.clientWidth + 1))
          problems.push(`${selector} clips its converted value`);
      return problems;
    },
  ],
];
for (const width of [1000, 430, 375]) {
  for (const colorScheme of ["light", "dark"]) {
    const result = await run({ width, colorScheme, contrast: width === 375, steps: responsive });
    check(`${width}px ${colorScheme}, responsive`, width, result);
    console.log(`${width}px ${colorScheme}: ${responsive.length} responsive states checked`);
  }
}
await browser.close();
console.log(`coverage: ${counts.pages} pages, ${counts.states} states, ${counts.contrast} contrast scans`);

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

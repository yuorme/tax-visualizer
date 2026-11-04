// Retirement-age employee CPP/QPP inputs in the built page. Each result is recomputed through the engine with an
// explicit Person, so a page that lost a field, used a fixed age or sent `age: null` shows up as a different number
// or as a script error, which the harness records on every state.
import assert from "node:assert/strict";
import { listYears, loadCpi, loadYear } from "../../src/data/load.ts";
import { historyComparison } from "../../src/engine/history.ts";
import { blank, compute } from "../../src/engine/index.ts";
import { money, rate } from "../../src/ui/notes.ts";
import { settle } from "./page.mjs";
import { inspect } from "./rules.mjs";

const saved = p => p.evaluate(() => JSON.parse(localStorage.getItem("taxcmp")));
const NEWEST = Math.max(...listYears());
const supported = listYears()
  .sort((a, b) => a - b)
  .filter(y => loadYear(y).federal.payroll.employeeRetirement);
const unsupported = listYears()
  .sort((a, b) => a - b)
  .filter(y => !supported.includes(y));

async function load(p, state = {}) {
  await p.evaluate(
    state => {
      localStorage.setItem(
        "taxcmp",
        JSON.stringify({
          v: 3,
          year: Math.max(...state.__years),
          home: "ON",
          dest: "QC",
          adults: 1,
          people: [{ ord: 100000 }],
          ...state,
        }),
      );
      history.replaceState(null, "", location.pathname);
    },
    { __years: listYears(), ...state },
  );
  await p.reload();
  await settle(p);
}
const open = async p => {
  if ((await p.getAttribute("#tab-income", "aria-expanded")) !== "true") await p.click("#tab-income");
  if (!(await p.$eval("#retirement-details", el => el.open))) await p.locator("#retirement-details > summary").click();
};
const setBirth = async (p, year, month) => {
  await p.fill("#ret-birth-year", String(year));
  await p.locator("#ret-birth-year").blur();
  await p.selectOption("#ret-birth-month", String(month));
  await settle(p);
};
const setDate = async (p, key, year, month) => {
  await p.selectOption(`#ret-${key}-month`, String(month));
  await p.fill(`#ret-${key}-year`, String(year));
  await p.locator(`#ret-${key}-year`).blur();
  await settle(p);
};
const household = person => ({
  people: [person],
  active: 0,
  spouse: true,
  adults: 1,
  kids: 0,
  under6: 0,
  useBpa: true,
  whRate: 0.15,
  useCredits: true,
  homeValue: 0,
  rent: 0,
  monthlySpending: 2000,
});
/** The chart's column value for one province, as shown. */
const shownRate = (p, code) => p.locator(`#col-${code} .cv`).textContent();
const expectedRate = (year, code, person) => {
  const y = loadYear(year);
  const r = compute(
    y,
    y.provinces.find(x => x.code === code),
    {
      ...household(person),
      driving: y.federal.driving
        ? { km: y.provinces.find(x => x.code === "ON").driving.distance, lPer100km: y.federal.driving.efficiency }
        : undefined,
    },
  );
  return `${(r.avg * 100).toFixed(1)}%`;
};
const historyRows = p =>
  p.locator("#history-rows tr").evaluateAll(rows => rows.map(r => [...r.cells].map(c => c.textContent)));
async function historyTip(p) {
  await p.locator("#history-info").scrollIntoViewIfNeeded();
  await settle(p);
  await p.locator("#history-info").focus();
  const text = await p.textContent("#tip");
  const box = await p.locator("#tip").boundingBox();
  assert.ok(box.x >= 0 && box.x + box.width <= p.viewportSize().width, "history tooltip fits the viewport");
  await p.keyboard.press("Escape");
  await p.locator("#history-info").blur();
  return text;
}

export const RETIREMENT_STEPS = [
  [
    "retirement: the section starts closed and empty, and opening it changes nothing",
    async p => {
      await load(p);
      const before = await shownRate(p, "ON");
      const results = await p.textContent("#detail-body");
      assert.equal(await p.textContent("#tab-income-sum"), "none");
      await p.click("#tab-income");
      assert.equal(await p.$eval("#retirement-details", el => el.open), false);
      assert.equal(await p.textContent("#retirement-sum"), "not set");
      await open(p);
      assert.equal(await p.locator("#ret-more").isVisible(), false, "later fields wait for a birth date");
      assert.equal(await p.locator("#retirement-clear").isVisible(), false);
      assert.equal(await shownRate(p, "ON"), before);
      assert.equal(await p.textContent("#detail-body"), results);
      assert.deepEqual((await saved(p)).retirement, []);
      assert.ok(!(await p.evaluate(() => location.hash)).includes("retirement"));
      assert.equal(await p.locator("#retirement-gate").isVisible(), false);
    },
  ],
  [
    "retirement: half a birth date changes nothing; the whole date applies that year's age",
    async p => {
      const before = await shownRate(p, "ON");
      await p.fill("#ret-birth-year", "1955");
      await p.locator("#ret-birth-year").blur();
      await settle(p);
      assert.equal(await shownRate(p, "ON"), before, "a birth year alone stays on ordinary payroll");
      assert.equal(await p.textContent("#retirement-sum"), "incomplete");
      assert.match(await p.textContent("#retirement-status"), /both the birth year and month/);
      await p.selectOption("#ret-birth-month", "6");
      await settle(p);
      const person = { ...blank(100000), age: NEWEST - 1955, birthMonth: 6 };
      assert.equal(await shownRate(p, "ON"), expectedRate(NEWEST, "ON", person));
      assert.equal(await shownRate(p, "QC"), expectedRate(NEWEST, "QC", person));
      assert.notEqual(await shownRate(p, "ON"), before, "past the CPP stopping age");
      assert.equal(await p.textContent("#retirement-sum"), `age ${NEWEST - 1955} in ${NEWEST}`);
      assert.match(await p.textContent("#retirement-status"), /CPP applies to 0 of 12 months/);
      assert.equal(await p.textContent("#tab-income-sum"), "age set");
      await p.fill("#oth", "12,000");
      await p.locator("#oth").blur();
      await settle(p);
      assert.equal(await p.textContent("#tab-income-sum"), "$12k + age");
      await p.fill("#oth", "0");
      await p.locator("#oth").blur();
      assert.equal(await p.locator("#ret-more").isVisible(), true);
      await p.selectOption("#ret-birth-month", "");
      await settle(p);
      assert.equal(await shownRate(p, "ON"), before, "clearing the month returns to ordinary payroll");
      await p.fill("#ret-birth-year", "");
      await p.locator("#ret-birth-year").blur();
      await settle(p);
      assert.equal(
        await p.textContent("#retirement-sum"),
        "not set",
        "emptying the section is the same as never using it",
      );
      assert.deepEqual((await saved(p)).retirement, []);
    },
  ],
  [
    "retirement: elections, a restart and an ineligible date reach the engine with their calendar dates",
    async p => {
      await load(p);
      await open(p);
      await setBirth(p, 1960, 6);
      assert.equal(await p.locator("#ret-cppRestart-field").isVisible(), false, "no restart before a stop");
      await setDate(p, "cppStop", 2025, 6);
      assert.match(await p.textContent("#retirement-status"), /no effect/, "no pension yet: the stop is ineligible");
      await setDate(p, "pensionSince", 2025, 1);
      const stopped = {
        retirementPensionSince: { year: 2025, month: 1 },
        cppElection: { stop: { year: 2025, month: 6 } },
      };
      let person = { ...blank(100000), age: NEWEST - 1960, birthMonth: 6, employeePayroll: stopped };
      assert.equal(await shownRate(p, "ON"), expectedRate(NEWEST, "ON", person));
      assert.match(await p.textContent("#retirement-status"), /stop election is valid/);
      assert.equal(await p.locator("#ret-cppRestart-field").isVisible(), true);
      await setDate(p, "cppRestart", 2025, 11);
      assert.match(await p.textContent("#retirement-status"), /stop stays in force/, "same-year restart");
      await setDate(p, "cppRestart", NEWEST, 3);
      person = {
        ...person,
        employeePayroll: {
          ...stopped,
          cppElection: { ...stopped.cppElection, restart: { year: NEWEST, month: 3 } },
        },
      };
      assert.equal(await shownRate(p, "ON"), expectedRate(NEWEST, "ON", person));
      assert.match(await p.textContent("#retirement-status"), /CPP applies to 9 of 12 months/);
      await p.selectOption("#home", "QC");
      await settle(p);
      assert.match(await p.textContent("#retirement-status"), /QPP applies to 12 of 12 months/, "plans stay separate");
      await p.selectOption("#home", "ON");
      await settle(p);
      const tip = p.getByRole("button", { name: "About retirement-age payroll", exact: true }).first();
      assert.match(await tip.getAttribute("data-tip"), /CPP applies to 9 of 12 months/);
    },
  ],
  [
    "retirement: pay timing divides income, and a zero total falls back to even pay",
    async p => {
      await load(p);
      await open(p);
      await setBirth(p, 1960, 6);
      await setDate(p, "pensionSince", 2025, 1);
      await setDate(p, "cppStop", NEWEST, 6);
      const even = await shownRate(p, "ON");
      assert.equal(await p.locator("#ret-months").isVisible(), false);
      await p.click('[data-ret-pay="month"]');
      await settle(p);
      assert.equal(await p.locator("#ret-months").isVisible(), true);
      assert.equal(await shownRate(p, "ON"), even, "equal monthly amounts match even pay");
      assert.equal(await p.locator("#ret-pay-status").isVisible(), false);
      for (let i = 6; i < 12; i++) await p.fill(`#ret-weight-${i}`, "0");
      await settle(p);
      const employeePayroll = {
        retirementPensionSince: { year: 2025, month: 1 },
        cppElection: { stop: { year: NEWEST, month: 6 } },
        monthlyEarningsWeights: [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
      };
      assert.equal(
        await shownRate(p, "ON"),
        expectedRate(NEWEST, "ON", { ...blank(100000), age: NEWEST - 1960, birthMonth: 6, employeePayroll }),
      );
      assert.match(await p.textContent("#retirement-status"), /on \$100,000 of employment income/);
      assert.equal(await p.textContent("#income-label"), "Employment income");
      assert.equal(await p.inputValue("#income"), "100,000", "timing never changes the annual total");
      await p.fill("#ret-weight-0", "abc");
      await p.locator("#ret-weight-0").blur();
      assert.equal(await p.inputValue("#ret-weight-0"), "1", "unreadable text keeps the last good value");
      for (let i = 0; i < 6; i++) await p.fill(`#ret-weight-${i}`, "0");
      await p.locator("#ret-weight-5").blur();
      await settle(p);
      assert.equal(await p.locator("#ret-pay-status").isVisible(), true);
      assert.equal(await shownRate(p, "ON"), even);
      await p.click('[data-ret-pay="even"]');
      await settle(p);
      assert.equal((await saved(p)).retirement[0].weights, null);
    },
  ],
  [
    "retirement: each person keeps their own inputs, and removing a partner removes theirs",
    async p => {
      await load(p);
      await open(p);
      await setBirth(p, 1955, 6);
      await p.click("#add-partner");
      await settle(p);
      assert.equal(await p.inputValue("#ret-birth-year"), "", "the partner starts blank");
      await setBirth(p, 1962, 3);
      assert.equal(await p.textContent("#retirement-sum"), `age ${NEWEST - 1962} in ${NEWEST}`);
      await p.click('#people .person[data-i="0"]');
      await settle(p);
      assert.equal(await p.inputValue("#ret-birth-year"), "1955");
      assert.equal(await p.inputValue("#ret-birth-month"), "6");
      assert.deepEqual(
        (await saved(p)).retirement.map(r => r.birthYear),
        [1955, 1962],
      );
      await p.click("#remove-partner");
      await settle(p);
      assert.equal((await saved(p)).retirement.length, 1);
      await p.click("#retirement-clear");
      await settle(p);
      assert.deepEqual((await saved(p)).retirement, []);
      assert.equal(await p.textContent("#retirement-sum"), "not set");
    },
  ],
  [
    "retirement: an unsupported selected year says so and is otherwise the ordinary result",
    async p => {
      await load(p, { year: unsupported[0] });
      const ordinary = await shownRate(p, "ON");
      await load(p, { year: unsupported[0], retirement: [{ birthYear: 1955, birthMonth: 6 }] });
      assert.equal(await shownRate(p, "ON"), ordinary);
      const gate = await p.textContent("#retirement-gate");
      assert.equal(await p.locator("#retirement-gate").isVisible(), true);
      assert.ok(gate.includes(`${supported.join(" and ")} only`), gate);
      assert.ok(gate.includes(`these ${unsupported[0]} results use ordinary CPP/QPP`), gate);
      await open(p);
      assert.equal(await p.textContent("#retirement-sum"), `not applied in ${unsupported[0]}`);
      assert.match(await p.textContent("#retirement-status"), /has no retirement-age payroll rules/);
      assert.equal((await saved(p)).retirement[0].birthYear, 1955, "inputs are retained, not dropped");
      await p.selectOption("#tax-year", String(NEWEST));
      await settle(p);
      assert.equal(await p.locator("#retirement-gate").isVisible(), false);
      assert.equal(await p.textContent("#retirement-sum"), `age ${NEWEST - 1955} in ${NEWEST}`);
    },
  ],
  [
    "retirement: an age at the contribution start stays on ordinary payroll with a notice",
    async p => {
      const start = loadYear(NEWEST).federal.payroll.employeeRetirement.cpp.params.contributionStartAge;
      await load(p);
      const ordinary = await shownRate(p, "ON");
      await load(p, { retirement: [{ birthYear: NEWEST - start, birthMonth: 6 }] });
      assert.equal(await shownRate(p, "ON"), ordinary);
      assert.match(await p.textContent("#retirement-gate"), new RegExp(`you \\(age ${start}\\) in ${NEWEST}`));
      await load(p, { retirement: [{ birthYear: NEWEST + 5, birthMonth: 6 }] });
      assert.equal(await shownRate(p, "ON"), ordinary);
      assert.equal(await p.locator("#retirement-gate").isVisible(), true);
    },
  ],
  [
    "retirement: history leaves out unsupported years and gives each row its own age",
    async p => {
      await load(p, { retirement: [{ birthYear: 1955, birthMonth: 6 }], historyOpen: true, historyMode: "nominal" });
      assert.equal(await p.locator("#history-view").isVisible(), true);
      assert.equal(await p.locator("#retirement-gate").isVisible(), false);
      const expected = supported.map(year => {
        const y = loadYear(year);
        const person = { ...blank(100000), age: year - 1955, birthMonth: 6 };
        const input = {
          ...household(person),
          driving: {
            km: loadYear(NEWEST).provinces.find(x => x.code === "ON").driving.distance,
            lPer100km: loadYear(NEWEST).federal.driving.efficiency,
          },
        };
        const r = historyComparison([y], loadCpi(), input, ["ON"], "nominal").rows[0].provinces[0];
        return [String(year), money(r.income), money(r.tax), rate(r.rate)];
      });
      assert.deepEqual(await historyRows(p), expected);
      assert.match(await p.textContent("#history-basis"), /retirement-age payroll years only/);
      const tip = await historyTip(p);
      assert.ok(tip.includes(`only for ${supported.join(" and ")}`), tip);
      assert.ok(tip.includes("are left out"), tip);
      assert.match(tip, /each person's age in that year/);
      assert.doesNotMatch(tip, /modelled only from/, "shown rows all have those programs");
      await p.click("#history-real");
      await settle(p);
      const real = await historyRows(p);
      assert.deepEqual(
        real.map(row => row[0]),
        supported.filter(year => loadCpi().values[year] != null).map(String),
      );
      const realTip = await historyTip(p);
      assert.doesNotMatch(realTip, /ages, rates/, "the fixed-age wording goes with these inputs");
      assert.match(realTip, /each person's age in that year/);
    },
  ],
  [
    "retirement: a history row at the contribution start age is left out; none left still renders",
    async p => {
      const start = loadYear(NEWEST).federal.payroll.employeeRetirement.cpp.params.contributionStartAge;
      const birthYear = NEWEST - start - 1; // old enough for the newest year, too young the year before
      await load(p, { retirement: [{ birthYear, birthMonth: 6 }], historyOpen: true, historyMode: "nominal" });
      assert.deepEqual(
        (await historyRows(p)).map(row => row[0]),
        [String(NEWEST)],
      );
      assert.ok((await historyTip(p)).includes(`${NEWEST - 1} left out`));
      await p.click("#history-real");
      await settle(p);
      assert.match(await p.textContent("#history-rows"), /No year in this view covers/);
      assert.equal(await p.textContent("#history-title"), "Ontario over time");
      await p.click("#view-provinces");
      await settle(p);
      assert.equal(await p.locator("#province-view").isVisible(), true);
    },
  ],
  [
    "retirement: a saved page and a shared link restore every field; damaged ones fall back safely",
    async p => {
      await load(p);
      await open(p);
      await setBirth(p, 1956, 12);
      await setDate(p, "pensionSince", 2021, 7);
      await setDate(p, "cppStop", 2025, 6);
      await setDate(p, "cppRestart", NEWEST, 2);
      await setDate(p, "qppStop", NEWEST, 3);
      await setDate(p, "qppRestart", NEWEST + 1, 1);
      await p.click('[data-ret-pay="month"]');
      await p.fill("#ret-weight-11", "0.5");
      await p.locator("#ret-weight-11").blur();
      await settle(p);
      const entered = (await saved(p)).retirement;
      const result = await shownRate(p, "ON");
      await p.reload();
      await settle(p);
      assert.deepEqual((await saved(p)).retirement, entered, "local storage");
      assert.equal(await shownRate(p, "ON"), result);
      const hash = await p.evaluate(() => location.hash);
      assert.ok(new URLSearchParams(hash.slice(1)).has("retirement"));
      await p.evaluate(() => localStorage.clear());
      await p.evaluate(hash => {
        history.replaceState(null, "", location.pathname + hash);
      }, hash);
      await p.reload();
      await settle(p);
      assert.deepEqual((await saved(p)).retirement, entered, "shared link");
      assert.equal(await shownRate(p, "ON"), result);
      await open(p);
      assert.equal(await p.inputValue("#ret-cppStop-year"), "2025");
      assert.equal(await p.inputValue("#ret-cppStop-month"), "6");
      assert.equal(await p.inputValue("#ret-weight-11"), "0.5");

      await load(p);
      const ordinary = await shownRate(p, "ON");
      const damaged = JSON.stringify([
        { birthYear: "x", birthMonth: 6, age: null, cppStop: { year: 1e308, month: 40 }, weights: [Number.MAX_VALUE] },
      ]);
      for (const value of [damaged, "{bad", "null", "[null,null]"]) {
        await p.evaluate(
          ({ value, year }) => {
            localStorage.clear();
            const hash = new URLSearchParams({ s: "1", year: String(year), retirement: value });
            history.replaceState(
              null,
              "",
              `${location.pathname}#${hash}&people=${encodeURIComponent('[{"ord":100000}]')}`,
            );
          },
          { value, year: NEWEST },
        );
        await p.reload();
        await settle(p);
        assert.equal(await shownRate(p, "ON"), ordinary, value);
        assert.equal(await p.textContent("#tab-income-sum"), "none", value);
      }
      await load(p, { retirement: "junk" });
      assert.deepEqual((await saved(p)).retirement, []);
    },
  ],
];

export const RETIREMENT_RESPONSIVE_STEPS = [
  [
    "layout: retirement-age inputs fit with every field showing",
    async p => {
      await load(p, { dest: "QC" });
      await open(p);
      await setBirth(p, 1956, 12);
      await setDate(p, "pensionSince", 2021, 7);
      await setDate(p, "cppStop", 2025, 6);
      await setDate(p, "qppStop", NEWEST, 3);
      await p.click('[data-ret-pay="month"]');
      await settle(p);
      for (const id of ["#ret-cppRestart-year", "#ret-qppRestart-month", "#ret-weight-11", "#retirement-clear"])
        assert.equal(await p.locator(id).isVisible(), true, id);
      const width = p.viewportSize().width;
      const boxes = await p
        .locator("#retirement-details :is(input, select, .lbl, .info, button)")
        .evaluateAll(list =>
          list.filter(el => el.checkVisibility()).map(el => [el.id, el.getBoundingClientRect().right]),
        );
      for (const [id, right] of boxes) assert.ok(right <= width, `${id} ends at ${right}, past ${width}`);
      const clipped = await p
        .locator("#retirement-details input")
        .evaluateAll(list =>
          list.filter(el => el.checkVisibility() && el.scrollWidth > el.clientWidth + 1).map(el => el.id),
        );
      assert.deepEqual(clipped, []);
      assert.equal((await inspect(p)).scrollWidth <= width, true);
      const tip = p.getByRole("button", { name: "About QPP stop and restart forms", exact: true });
      await tip.scrollIntoViewIfNeeded();
      await settle(p);
      await tip.focus();
      assert.equal(await p.locator("#tip").isVisible(), true);
      const box = await p.locator("#tip").boundingBox();
      assert.ok(box.x >= 0 && box.x + box.width <= width, "tooltip fits width");
      assert.ok(box.y >= 0 && box.y + box.height <= p.viewportSize().height, "tooltip fits height");
      await p.keyboard.press("Escape");
      await tip.blur();
    },
    { contrast: true },
  ],
  [
    "layout: the unsupported-year notice fits beside the results",
    async p => {
      await load(p, { year: unsupported[0], retirement: [{ birthYear: 1955, birthMonth: 6 }] });
      assert.equal(await p.locator("#retirement-gate").isVisible(), true);
      assert.ok((await inspect(p)).scrollWidth <= p.viewportSize().width);
    },
    { contrast: true },
  ],
  [
    "layout: retirement history shows its supported rows and tooltip",
    async p => {
      await load(p, { retirement: [{ birthYear: 1955, birthMonth: 6 }], historyOpen: true, historyMode: "nominal" });
      assert.equal(await p.locator("#history-rows tr").count(), supported.length);
      await historyTip(p);
      assert.ok((await inspect(p)).scrollWidth <= p.viewportSize().width);
      await load(p);
    },
  ],
];

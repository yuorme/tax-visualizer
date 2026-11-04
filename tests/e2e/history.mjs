import assert from "node:assert/strict";
import { tsImport } from "tsx/esm/api";
import { listYears, loadCpi, loadYear } from "../../src/data/load.ts";
import { historyComparison } from "../../src/engine/history.ts";
import { childcareOf, compute } from "../../src/engine/index.ts";
import { money, rate } from "../../src/ui/notes.ts";
import { toHousehold } from "../golden/adapter.ts";
import { settle } from "./page.mjs";

// The UI module includes constructor parameter properties, which Node's native type stripping cannot load.
const { ChildcareModel } = await tsImport("../../src/ui/childcare.ts", import.meta.url);

export async function checkHistoryCoverageNotes(p) {
  const provincialNotes = [
    ["Quebec's Health Services Fund contribution", ["QC"]],
    ["Manitoba's family tax benefit", []],
    ["The provincial childcare tax credit", ["ON", "QC", "NL"]],
  ];
  const codes = loadYear(Math.max(...listYears())).provinces.map(province => province.code);
  for (const mode of ["real", "nominal"]) {
    await p.click(`#history-${mode}`);
    for (const province of codes) {
      await p.selectOption("#home", province);
      await settle(p);
      assert.ok(
        !(await p.locator("#history-view").textContent()).includes("modelled only from"),
        "coverage explanations stay in the tooltip",
      );
      await p.locator("#history-info").scrollIntoViewIfNeeded();
      await settle(p);
      await p.locator("#history-info").focus();
      assert.equal(await p.locator("#tip").isVisible(), true);
      const tip = await p.textContent("#tip");
      for (const [name, affected] of provincialNotes) {
        assert.equal(
          tip.includes(`${name} is modelled only from 2025`),
          affected.includes(province),
          `${province} ${mode}: province-specific coverage for ${name}`,
        );
      }
      assert.ok(tip.includes("The federal childcare expense deduction is modelled only from 2025"));
      assert.ok(tip.includes("Gasoline fuel tax (excluding carbon pricing) is modelled only from 2025"));
      assert.ok(!tip.includes("carbon pricing is modelled only from 2025"));
      assert.ok(tip.includes("year-to-year changes can also reflect model coverage"));
      const box = await p.locator("#tip").boundingBox();
      assert.ok(box.x >= 0 && box.x + box.width <= p.viewportSize().width, "tooltip fits the viewport");
      assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await p.keyboard.press("Escape");
      await p.locator("#history-info").blur();
    }
  }
  return [];
}

async function checkRows(page, mode, overrides = {}) {
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem("taxcmp")));
  const year = loadYear(state.year);
  const home = year.provinces.find(p => p.code === state.home);
  const input = toHousehold({
    ...state,
    frug: state.spendingAdjustment ?? state.frug ?? 0,
    homeValue: state.tenure === "own" ? state.homeValue : 0,
    rent: state.tenure === "rent" ? state.rent : 0,
    km: state.km ?? home.driving?.distance ?? 0,
    efficiency: state.eff ?? year.federal.driving?.efficiency ?? 0,
  });
  const care = new ChildcareModel();
  care.restore(state.childcare);
  const people = compute(year, home, input).list.map(p => p.x);
  care.configure(
    people.map(p => p.ord + (p.oth ?? 0)),
    state.kids,
  );
  const ages = care.benefitAgeProfile();
  if (ages) {
    const counts = childcareOf(year.federal, { ...input, childcare: ages }, people).childCounts;
    if (counts) Object.assign(input, counts);
  }
  input.childcare = care.claimInput();
  const result = historyComparison(
    listYears().map(loadYear),
    loadCpi(),
    { ...input, ...overrides },
    [state.home],
    mode,
  );
  const expected = result.rows.map(row => {
    const r = row.provinces[0];
    return [String(row.year), money(r.income), r.tax < 0 ? `−${money(-r.tax)}` : money(r.tax), rate(r.rate)];
  });
  const actual = await page
    .locator("#history-rows tr")
    .evaluateAll(rows => rows.map(r => [...r.cells].map(c => c.textContent)));
  return JSON.stringify(actual) === JSON.stringify(expected) ? [] : ["historical table differs from engine results"];
}

export const HISTORY_STEPS = [
  [
    "history: opens in real mode with published CPI years",
    async p => {
      await p.click("#view-history");
      const problems = await checkRows(p, "real");
      if (!(await p.locator("#history-view").isVisible())) problems.push("history view did not open");
      if (await p.locator("#province-view").isVisible()) problems.push("province chart still visible in history view");
      if ((await p.locator("#detail").isVisible()) || (await p.locator("#notes").isVisible()))
        problems.push("single-year details still visible in history view");
      if (!(await p.locator("#tax-year").isDisabled()))
        problems.push("single-year selector is active during history comparison");
      if (
        !(await p.textContent("#history-basis")).includes(
          String(Math.max(...Object.keys(loadCpi().values).map(Number))),
        )
      )
        problems.push("real dollar basis is not labelled");
      return problems;
    },
  ],
  [
    "history: other income follows real and nominal inputs without employee payroll",
    async p => {
      await p.click("#tab-income");
      await p.fill("#oth", "12,000");
      await p.locator("#oth").blur();
      const problems = await checkRows(p, "real");
      const incomes = () => p.locator("#history-rows tr").evaluateAll(rows => rows.map(r => r.cells[1].textContent));
      assert.ok((await incomes()).every(income => income === "$87,000"));
      await p.click("#history-nominal");
      problems.push(...(await checkRows(p, "nominal")));
      assert.ok((await incomes()).every(income => income === "$87,000"));
      return problems;
    },
  ],
  [
    "history: nominal includes every year and follows household inputs",
    async p => {
      await p.click("#history-nominal");
      await p.fill("#income", "120,000");
      await p.dispatchEvent("#income", "input");
      await p.selectOption("#home", "QC");
      const problems = await checkRows(p, "nominal");
      if (!(await p.textContent("#history-title")).includes("Quebec"))
        problems.push("history did not follow home province");
      if ((await p.locator("#history-rows tr").count()) !== listYears().length)
        problems.push("nominal history omits a year");
      return problems;
    },
  ],
  ["history: partial program coverage follows province in both dollar modes", checkHistoryCoverageNotes],
  [
    "history: childcare follows age and earnings edits immediately",
    async p => {
      await p.fill("#oth", "0");
      await p.locator("#oth").blur();
      await p.selectOption("#home", "ON");
      await p.locator("#kids").evaluate(el => {
        el.value = "1";
        el.dispatchEvent(new Event("input", { bubbles: true }));
      });
      await p.fill("#childcare-monthly", "500");
      await p.locator("#childcare-monthly").blur();
      if (!(await p.$eval("#childcare-details", el => el.open)))
        await p.locator("#childcare-details > summary").click();
      await p.fill("#care-age-0", "4");
      await p.locator("#care-age-0").blur();
      await p.fill("#care-expenses-0", "6000");
      await p.locator("#care-expenses-0").blur();
      const problems = await checkRows(p, "nominal");
      await p.fill("#income", "3,000");
      await p.dispatchEvent("#income", "input");
      problems.push(...(await checkRows(p, "nominal")));
      // $3,000 employment permits $2,000 childcare; adding $3,000 other income raises the default to $4,000.
      await p.fill("#oth", "3,000");
      await p.locator("#oth").blur();
      problems.push(...(await checkRows(p, "nominal")));
      await p.fill("#care-age-0", "20");
      await p.locator("#care-age-0").blur();
      problems.push(...(await checkRows(p, "nominal")));
      await p.click("#history-real");
      problems.push(...(await checkRows(p, "real")));
      await p.click("#history-nominal");
      return problems;
    },
  ],
  [
    "history: survives reload and returns to the provincial comparison",
    async p => {
      await p.reload();
      await settle(p);
      const problems = await checkRows(p, "nominal");
      if (!(await p.locator("#history-view").isVisible())) problems.push("history view was not restored");
      await p.click("#view-provinces");
      if (!(await p.locator("#province-view").isVisible()) || !(await p.locator("#detail").isVisible()))
        problems.push("provincial comparison did not return");
      if (await p.locator("#tax-year").isDisabled()) problems.push("single-year selector stayed disabled");
      return problems;
    },
  ],
  [
    "history: childcare claims and edited dependant ages reach both dollar modes immediately",
    async p => {
      await p.evaluate(() =>
        localStorage.setItem(
          "taxcmp",
          JSON.stringify({
            v: 3,
            year: 2026,
            home: "ON",
            dest: "AB",
            adults: 1,
            kids: 1,
            under6: 1,
            spouse: false,
            people: [{ ord: 30000 }],
            spendingAdjustment: -20,
            childcare: {
              monthly: 500,
              mode: "automatic",
              children: [{ age: 4, expenses: 6000 }],
              earningsOverridden: [false, false],
            },
          }),
        ),
      );
      await p.evaluate(() => history.replaceState(null, "", location.pathname + location.search));
      await p.reload();
      await settle(p);
      await p.click("#view-history");
      const problems = [];
      for (const [mode, monthly] of [
        ["real", 500],
        ["nominal", 500],
        ["real", 0],
        ["nominal", 0],
      ]) {
        await p.click(`#history-${mode}`);
        await p.fill("#childcare-monthly", String(monthly));
        for (const age of [4, 20]) {
          if (!(await p.$eval("#childcare-details", el => el.open)))
            await p.locator("#childcare-details > summary").click();
          await p.fill("#care-age-0", String(age));
          problems.push(
            ...(
              await checkRows(p, mode, {
                kids: age < 18 ? 1 : 0,
                under6: age < 6 ? 1 : 0,
                childcare:
                  monthly > 0
                    ? {
                        mode: "automatic",
                        children: [{ age, expenses: 6000 }],
                        declaredAnnualExpenses: 6000,
                        earnedIncome: [30000],
                      }
                    : undefined,
              })
            ).map(problem => `age ${age}, ${mode}, monthly ${monthly}: ${problem}`),
          );
        }
      }
      return problems;
    },
  ],
];

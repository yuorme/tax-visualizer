import assert from "node:assert/strict";
import { listYears, loadCpi, loadYear } from "../../src/data/load.ts";
import { historyComparison } from "../../src/engine/history.ts";
import { money, rate } from "../../src/ui/notes.ts";
import { toHousehold } from "../golden/adapter.ts";
import { settle } from "./page.mjs";

async function checkRows(page, mode) {
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem("taxcmp")));
  const year = loadYear(state.year);
  const home = year.provinces.find(p => p.code === state.home);
  const input = toHousehold({
    ...state,
    homeValue: state.tenure === "own" ? state.homeValue : 0,
    rent: state.tenure === "rent" ? state.rent : 0,
    km: state.km ?? home.driving?.distance ?? 0,
    efficiency: state.eff ?? year.federal.driving?.efficiency ?? 0,
  });
  const result = historyComparison(listYears().map(loadYear), loadCpi(), input, [state.home], mode);
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
];

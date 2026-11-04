// Focused browser assertions for #164, run by smoke.mjs at every viewport/theme pair.
import assert from "node:assert/strict";
import { settle } from "./page.mjs";

const REDUCTION = "Less low-income tax reduction";
const FOREIGN = "Less foreign tax credit";
// Each 428 form's line order, as recorded by `claimants.lowIncomeReduction.order` in that province's data.
const FORM_ORDER = { NB: FOREIGN, NL: FOREIGN, NS: FOREIGN, PE: REDUCTION };
// 2024 has no `claimants` data and its locked calculation applies the reduction first, so a province check would fail.
const CASES = [
  // Year, other income that leaves both rows visible, and the row expected first in each province.
  ["2025", 8000, FORM_ORDER],
  ["2026", 8000, FORM_ORDER],
  ["2024", 18000, { NB: REDUCTION }],
];

export async function checkLedgerOrder(page) {
  const type = async (id, value) => {
    await page.fill(`#${id}`, String(value));
    await page.dispatchEvent(`#${id}`, "input");
    await page.locator(`#${id}`).blur();
    await settle(page);
  };
  await type("income", 0);
  await page.click('#tabbar [data-tab="income"]');
  await type("fd", 12000);
  for (const [year, other, provinces] of CASES) {
    await page.selectOption("#tax-year", year);
    await settle(page);
    await type("oth", other);
    for (const [code, first] of Object.entries(provinces)) {
      await page.selectOption("#home", code);
      await settle(page);
      const labels = await page.$$eval("#detail-body .ledger", ledgers =>
        [...ledgers[1].querySelector("table").rows].map(r => r.cells[0].textContent.trim()),
      );
      const [low, foreign] = [labels.indexOf(REDUCTION), labels.indexOf(FOREIGN)];
      assert.ok(low >= 0 && foreign >= 0, `${year} ${code}: both rows must show, got ${labels.join(" | ")}`);
      assert.equal(low < foreign ? REDUCTION : FOREIGN, first, `${year} ${code}: ${labels.join(" | ")}`);
    }
  }
}

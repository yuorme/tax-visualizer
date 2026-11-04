import assert from "node:assert/strict";
import { settle } from "./page.mjs";

// Runs from smoke at 375/430/desktop in both themes, using the real inputs and independently calculated amounts.
export async function checkQuebecHealthFund(page) {
  const tab = async name => {
    const button = `#tabbar [data-tab="${name}"]`;
    if ((await page.getAttribute(button, "aria-expanded")) !== "true") await page.click(button);
  };
  const type = async (id, value) => {
    await page.fill(`#${id}`, String(value));
    await page.dispatchEvent(`#${id}`, "input");
    await page.locator(`#${id}`).blur();
    await settle(page);
  };
  const rowAmount = async label => {
    const rows = await page.$$eval("#detail-body tr", rows =>
      rows.map(r => [...r.cells].map(c => c.textContent.trim())),
    );
    const matches = rows.filter(r => r[0] === label);
    assert.equal(matches.length, 1, `${label} occurs once`);
    return matches[0][1];
  };
  await page.selectOption("#home", "QC");
  await page.selectOption("#dest", "ON");
  await type("income", 0);
  await type("spend", 0);
  await page.click('label[for="bpa-toggle"]');
  await tab("credits");
  await page.click('label[for="cred-toggle"]');
  await tab("driving");
  await type("km", 0);
  await tab("income");
  for (const [year, threshold, upper, amount, total] of [
    [2025, 18130, 63060, "$69", "$6,596"],
    [2026, 18500, 64355, "$65", "$6,488"],
  ]) {
    await page.selectOption("#tax-year", String(year));
    await type("oth", 25000);
    assert.equal(await rowAmount("Quebec Health Services Fund"), amount);
    assert.equal(await page.getByText("Quebec Health Services Fund", { exact: true }).isVisible(), true);
    assert.equal(await rowAmount("CPP/QPP, EI & health premiums"), amount);
    assert.equal(await rowAmount("Net tax"), total, "contribution reaches total exactly once");
    const tip = await page.getAttribute('[data-note="otherIncome"]', "data-tip");
    assert.match(tip, /calculated separately for each person/);
    assert.doesNotMatch(tip, /contribution on non-employment income is not modelled/);
    assert.equal(tip.includes("caps and income rules provisionally continue"), year === 2026);
    // This differs from using grossed-up dividends ($150), so the browser really delivers the income-base rule.
    await type("oth", 0);
    await type("ed", 25000);
    assert.equal(await rowAmount("Quebec Health Services Fund"), amount);
    await type("ed", 0);
    await type("oth", 25000);
    await page.$eval("#deductions", el => {
      el.open = true;
    });
    await type("rrsp", 5000);
    assert.equal(await rowAmount("Quebec Health Services Fund"), amount);
    await type("rrsp", 0);
    for (const [income, expected] of [
      [threshold, null],
      [threshold + 100, "$1"],
      [threshold + 15000, "$150"],
      [upper, "$150"],
      [upper + 100, "$151"],
      [upper + 85000, "$1,000"],
    ]) {
      await type("oth", income);
      if (expected === null)
        assert.equal(await page.getByText("Quebec Health Services Fund", { exact: true }).count(), 0);
      else assert.equal(await rowAmount("Quebec Health Services Fund"), expected);
    }
    await type("oth", 0);
    await type("income", 200000);
    assert.equal(
      await page.getByText("Quebec Health Services Fund", { exact: true }).count(),
      0,
      "employment excluded",
    );
    await type("income", 0);
  }
  await type("oth", 25000);
  for (const year of [2019, 2020, 2021, 2022, 2023, 2024]) {
    await page.selectOption("#tax-year", String(year));
    await settle(page);
    assert.equal(await page.getByText("Quebec Health Services Fund", { exact: true }).count(), 0);
    assert.match(
      await page.getAttribute('[data-note="otherIncome"]', "data-tip"),
      /contribution on non-employment income is not modelled/,
    );
  }
  await page.selectOption("#tax-year", "2026");
  await type("income", 60000);
  await type("oth", 40000);
  await page.locator("#col-QC .stack .y").click();
  assert.equal(await page.locator("#tip").isVisible(), true);
  assert.match(await page.textContent("#tip .t-num"), /^\$4,748 a year/);
  assert.equal(
    await page.locator("#tip .t-sub").first().textContent(),
    "QPP $3,560 · EI $780 · QPIP $258 · Quebec Health Services Fund $150.",
    "payroll tooltip itemizes the contribution in its total",
  );
  await page.keyboard.press("Escape");
  await type("income", 0);
  await type("oth", 25000);
  await page.click("#add-partner");
  await type("income", 0);
  await type("oth", 25000);
  assert.equal(await rowAmount("Quebec Health Services Fund"), "$65", "selected adult's own contribution");
  assert.equal(await rowAmount("CPP/QPP, EI & health premiums"), "$130", "household sums both adults");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
}

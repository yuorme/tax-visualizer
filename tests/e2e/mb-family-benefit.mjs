// Focused browser assertions for #145. Called by the review screenshot script; no network/server needed.
import assert from "node:assert/strict";
import { settle } from "./page.mjs";

export async function checkManitobaFamilyLedger(page) {
  await page.selectOption("#home", "MB");
  const type = async (selector, value) => {
    await page.fill(selector, value);
    await page.dispatchEvent(selector, "input");
    await settle(page);
  };
  await type("#income", "0");
  await page.click('#tabbar [data-tab="income"]');
  await type("#oth", "40000");
  await page.$eval("#adults", el => {
    el.value = "2";
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.$eval("#kids", el => {
    el.value = "2";
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  for (const year of [2025, 2026, 2024]) {
    await page.selectOption("#tax-year", String(year));
    await settle(page);
    const rows = await page.$$eval("#detail-body .ledger", ledgers => {
      const mb = ledgers.find(el => el.querySelector("h4").textContent.includes("Manitoba"));
      return [...mb.querySelector("table").rows].map(r => [...r.cells].map(c => c.textContent.trim()));
    });
    const family = rows.find(r => r[0] === "Less family tax benefit");
    if (year === 2024) {
      assert.equal(family, undefined, "historical year must not advertise the correction");
    } else {
      assert.ok(family, `${year}: missing family benefit ledger row`);
      assert.match(family.at(-1), /652/, "example's $651.672 credit rounds to $652");
      assert.match(rows.at(-1).at(-1), /978/, "example's $977.616 Manitoba tax rounds to $978");
      const familyIndex = rows.indexOf(family);
      const dividendIndex = rows.findIndex(r => r[0] === "Less dividend tax credit");
      assert.ok(dividendIndex === -1 || familyIndex < dividendIndex);
    }
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
      false,
      `${year}: horizontal overflow`,
    );
  }
  await page.selectOption("#tax-year", "2025");
  await settle(page);
}

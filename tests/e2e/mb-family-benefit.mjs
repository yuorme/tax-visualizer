// Focused browser assertions for #145, run by smoke.mjs at every viewport/theme pair.
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
  await page.$eval("#kids", el => {
    el.value = "1";
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  // Reveal the existing age editor through paid care, then retain the age with no childcare claim.
  await type("#childcare-monthly", "100");
  await page.$eval("#childcare-details", el => {
    el.open = true;
  });
  await type("#care-age-0", "17");
  await type("#childcare-monthly", "0");
  await page.$eval("#childcare-details", el => {
    el.open = true;
  });
  const expectAgeLedger = async (age, credit, tax) => {
    assert.equal(await page.inputValue("#care-age-0"), String(age));
    assert.equal(await page.inputValue("#childcare-monthly"), "0", "no paid childcare");
    const ledger = page.locator("#detail-body .ledger").filter({ has: page.locator("h4", { hasText: "Manitoba" }) });
    const family = ledger.locator("tr").filter({ hasText: "Less family tax benefit" });
    assert.equal(await family.locator("td").last().textContent(), credit, `age ${age}: family credit`);
    assert.equal(await ledger.locator("tr").last().locator("td").last().textContent(), tax, `age ${age}: tax`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
  };
  for (const [age, credit, tax] of [
    [17, "−$354", "$1,275"],
    [18, "−$354", "$1,275"],
    [19, "−$57", "$1,572"],
  ]) {
    await type("#care-age-0", String(age));
    await expectAgeLedger(age, credit, tax);
    if (age === 18) {
      // Existing saved scenarios and links already retain ages; no storage/schema migration is needed.
      const link = page.url();
      await page.evaluate(() => history.replaceState(null, "", location.pathname));
      await page.reload();
      await settle(page);
      await expectAgeLedger(age, credit, tax);
      await page.evaluate(url => {
        localStorage.clear();
        history.replaceState(null, "", url);
      }, link);
      await page.reload();
      await settle(page);
      await expectAgeLedger(age, credit, tax);
      await page.$eval("#childcare-details", el => {
        el.open = true;
      });
    }
  }
}

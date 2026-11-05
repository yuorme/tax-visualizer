import assert from "node:assert/strict";
import { settle } from "./page.mjs";

// Literal expectations from TP-1 and the federal spouse credit; no engine-derived expected savings.
export async function checkQuebecSpouseSavings(page) {
  for (const [donor, saving] of [
    [0, "$4,577"],
    [18000, "$133"],
  ]) {
    await page.evaluate(donor => {
      localStorage.setItem(
        "taxcmp",
        JSON.stringify({
          v: 3,
          year: 2026,
          home: "QC",
          dest: "ON",
          adults: 2,
          spouse: true,
          people: [{ ord: 60000 }, { ord: 0, oth: donor }],
          active: 0,
          useBpa: true,
          useCredits: false,
          spend: 0,
          km: 0,
        }),
      );
      history.replaceState(null, "", location.pathname);
    }, donor);
    await page.reload();
    await settle(page);
    const button = page.getByRole("button", { name: "About spouse and dependant amounts", exact: true });
    await button.scrollIntoViewIfNeeded();
    await settle(page);
    await button.focus();
    await settle(page);
    assert.equal(await page.locator("#tip").isVisible(), true);
    const text = await page.textContent("#tip");
    assert.match(text, /^The spouse amount saves your household /);
    assert.ok(text.includes(`${saving} in Quebec`), text);
    assert.doesNotMatch(text, /lower earner's income is too high/);
    const box = await page.locator("#tip").boundingBox();
    assert.ok(box && box.x >= 0 && box.x + box.width <= page.viewportSize().width, "savings tooltip fits width");
    await page.keyboard.press("Escape");
    const labels = await page.locator("#detail-body .ledger").nth(1).locator("tr td:first-child").allTextContents();
    assert.equal(labels.filter(label => label.includes("unused Quebec credit transferred")).length, 1);
    assert.ok(!labels.includes("Less partner's unused credit transferred"), "dead BPA-only row is absent");
  }
}

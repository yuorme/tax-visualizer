import assert from "node:assert/strict";

const fill = async (p, id, value) => {
  await p.fill(`#${id}`, String(value));
  await p.locator(`#${id}`).blur();
};
const saved = p => p.evaluate(() => JSON.parse(localStorage.getItem("taxcmp")));
const cell = (p, label, column = 1) =>
  p.locator("tr.care-breakdown").filter({ hasText: label }).first().locator("td").nth(column).textContent();
const open = async (p, selector) => {
  if (!(await p.$eval(selector, el => el.open))) await p.locator(`${selector} > summary`).click();
};

export const CHILDCARE_STEPS = [
  [
    "legacy spending and generic deductions migrate without changing effective dollars",
    async p => {
      await p.evaluate(() =>
        localStorage.setItem(
          "taxcmp",
          JSON.stringify({
            v: 3,
            year: 2026,
            adults: 2,
            kids: 2,
            under6: 1,
            spend: 4000,
            frug: -20,
            people: [{ ord: 75000, cg: 0, ed: 0, nd: 0, fd: 0, ded: 1200 }],
          }),
        ),
      );
      await p.reload();
      assert.equal(await p.locator("#frug").count(), 0);
      assert.equal(await p.inputValue("#spend"), "3,200");
      assert.equal(await p.textContent("#ded-total"), "$1,200");
      assert.equal(await p.locator("#childcare-details").isVisible(), false);
      assert.equal((await saved(p)).spendingAdjustment, -20);
      assert.equal("frug" in (await saved(p)), false);
    },
  ],
  [
    "monthly cost reveals incomplete child details without assuming earnings or allocating costs",
    async p => {
      await fill(p, "childcare-monthly", 1000);
      assert.equal(await p.locator("#childcare-details").isVisible(), true);
      assert.equal(await p.inputValue("#care-age-0"), "");
      assert.equal(await p.inputValue("#care-expenses-0"), "0");
      assert.equal(await p.inputValue("#care-earnings-0"), "");
      assert.equal(await p.inputValue("#care-earnings-1"), "");
      assert.equal(await cell(p, "Federal calculation"), "Details needed");
      assert.equal(await p.inputValue("#spend"), "3,200");
    },
  ],
  [
    "valid ages drive benefit counts, but missing earnings still prevent automatic deductions",
    async p => {
      await fill(p, "care-age-0", 4);
      await fill(p, "care-age-1", 10);
      await fill(p, "care-expenses-0", 10000);
      await fill(p, "care-expenses-1", 2000);
      assert.equal(await cell(p, "Federal calculation"), "Details needed");
      assert.equal(await p.locator("#kids").isDisabled(), true);
      assert.equal(await p.locator("#u6").isDisabled(), true);
      assert.equal(await p.inputValue("#kids"), "2");
      assert.equal(await p.inputValue("#u6"), "1");
      assert.equal(await p.getAttribute("#childcare-monthly", "aria-invalid"), "false");
      assert.equal(await cell(p, "Your federal childcare deduction"), "$0");
    },
  ],
  [
    "implicit zero-income spouse requires explicit eligible zero and receives no ordinary deduction",
    async p => {
      await fill(p, "care-earnings-0", 75000);
      assert.equal(await cell(p, "Federal calculation"), "Details needed");
      await fill(p, "care-earnings-1", 0);
      assert.equal(await cell(p, "Federal calculation"), "Calculated");
      assert.equal(await cell(p, "Partner's federal childcare deduction"), "$0");
      assert.match(
        await p
          .locator("tr.care-breakdown")
          .filter({ hasText: "Federal calculation" })
          .locator(".info")
          .getAttribute("data-tip"),
        /Your partner is the selected claimant as the lower-net-income adult/,
      );
      await p.selectOption("#care-mode", "manual");
      await fill(p, "care-claim-0", 0);
      assert.equal(await cell(p, "Federal calculation"), "Details needed");
      await fill(p, "care-claim-1", 0);
      assert.equal(await cell(p, "Federal calculation"), "Calculated");
      await p.selectOption("#care-mode", "automatic");
    },
  ],
  [
    "partner income and earnings produce pooled federal claim without changing editable deductions",
    async p => {
      await p.click("#add-partner");
      await fill(p, "income", 30000);
      await fill(p, "care-earnings-1", 30000);
      assert.equal(await cell(p, "Partner's federal childcare deduction"), "$12,000");
      assert.equal(await p.textContent("#ded-total"), "$0");
      assert.match(await p.textContent("#detail-body"), /12,000 deductions/);
      await fill(p, "care-age-0", 7);
      assert.equal(await p.inputValue("#u6"), "0");
      assert.equal(await cell(p, "Partner's federal childcare deduction"), "$10,000");
      await fill(p, "care-age-0", 4);
    },
  ],
  [
    "allocation mismatch suppresses relief while preserving validated child ages",
    async p => {
      await fill(p, "childcare-monthly", 1100);
      assert.equal(await cell(p, "Federal calculation"), "Details needed");
      assert.equal(await cell(p, "Partner's federal childcare deduction"), "$0");
      assert.equal(await p.inputValue("#u6"), "1");
      assert.equal(await p.getAttribute("#childcare-monthly", "aria-invalid"), "true");
      await fill(p, "childcare-monthly", 1000);
      assert.equal(await cell(p, "Partner's federal childcare deduction"), "$12,000");
    },
  ],
  [
    "Quebec missing eligibility differs from confirmed zero and qualifying expenses",
    async p => {
      await p.selectOption("#dest", "QC");
      assert.match(await cell(p, "Provincial childcare credit", 2), /Details needed/);
      for (const c of await p.locator(".care-quebec").all()) await c.locator("summary").click();
      await fill(p, "care-qc-0", 0);
      await fill(p, "care-qc-1", 0);
      assert.equal(await cell(p, "Provincial childcare credit", 2), "$0");
      await fill(p, "care-qc-0", 10000);
      await fill(p, "care-qc-1", 2000);
      assert.equal(await cell(p, "Provincial childcare credit", 2), "$8,400");
      await fill(p, "care-earnings-1", 0);
      assert.equal(await cell(p, "Partner's federal childcare deduction"), "$0");
      assert.equal(await cell(p, "Provincial childcare credit", 2), "$8,400");
      await fill(p, "care-earnings-1", 30000);
    },
  ],
  [
    "manual verified claims replace automatic claims and remain separate from other deductions",
    async p => {
      await p.selectOption("#care-mode", "manual");
      await fill(p, "care-claim-1", "");
      await fill(p, "care-claim-0", 3000);
      assert.equal(await cell(p, "Federal calculation"), "Details needed");
      await fill(p, "care-claim-1", 2000);
      assert.equal(await cell(p, "Your federal childcare deduction"), "$3,000");
      assert.equal(await cell(p, "Partner's federal childcare deduction"), "$2,000");
      await p.click('#people [data-i="0"]');
      assert.equal(await p.textContent("#ded-total"), "$1,200");
      await fill(p, "care-claim-0", 13000);
      assert.equal(await cell(p, "Federal calculation"), "Check inputs");
      await fill(p, "care-claim-0", 3000);
    },
  ],
  [
    "annual costs reconcile with a monthly average rounded to cents",
    async p => {
      await fill(p, "childcare-monthly", "833.33");
      await fill(p, "care-expenses-1", 0);
      await open(p, ".care-child:nth-of-type(2) .care-quebec");
      await fill(p, "care-qc-1", 0);
      assert.equal(await p.inputValue("#childcare-monthly"), "833.33");
      assert.equal(await p.getAttribute("#childcare-monthly", "aria-invalid"), "false");
      assert.equal(await cell(p, "Allocated annual childcare expenses"), "$10,000");
      assert.equal(await cell(p, "Federal calculation"), "Calculated");
    },
  ],
  [
    "Quebec age policy follows the selected year and provincial disability eligibility is separate",
    async p => {
      await fill(p, "care-age-0", 15);
      assert.equal(await cell(p, "Provincial childcare credit", 2), "$0");
      await p.check("#care-dtc-0");
      assert.equal(await cell(p, "Provincial childcare credit", 2), "$0");
      await open(p, ".care-child:nth-of-type(1) .care-quebec");
      await p.check("#care-severe-0");
      assert.equal(await cell(p, "Provincial childcare credit", 2), "$7,000");
      await p.uncheck("#care-severe-0");
      await p.uncheck("#care-dtc-0");
      await p.selectOption("#tax-year", "2025");
      assert.equal(await cell(p, "Provincial childcare credit", 2), "$7,000");
      await p.selectOption("#tax-year", "2026");
      assert.equal(await cell(p, "Provincial childcare credit", 2), "$0");
      await fill(p, "care-age-0", 4);
    },
  ],
  [
    "refund switch controls applied childcare credits without changing federal deductions",
    async p => {
      await p.click("#tab-credits");
      await p.click("label[for=cred-toggle]");
      assert.equal(await cell(p, "Provincial childcare credit", 2), "$0");
      assert.equal(await cell(p, "Your federal childcare deduction"), "$3,000");
      await p.click("label[for=cred-toggle]");
      assert.equal(await cell(p, "Provincial childcare credit", 2), "$7,000");
    },
  ],
  [
    "childcare survives reload, person switching and tax-year switching",
    async p => {
      const before = (await saved(p)).childcare;
      await p.reload();
      await open(p, "#childcare-details");
      assert.deepEqual((await saved(p)).childcare, before);
      assert.equal(await p.inputValue("#childcare-monthly"), "833.33");
      await p.selectOption("#tax-year", "2025");
      assert.equal(await p.inputValue("#care-age-0"), "4");
      assert.deepEqual((await saved(p)).childcare, before);
      await p.selectOption("#tax-year", "2026");
      await p.click('#people [data-i="1"]');
      assert.equal(await p.inputValue("#care-claim-0"), "3,000");
      assert.equal(await p.inputValue("#care-claim-1"), "2,000");
      for (const count of [3, 2]) {
        await p.locator("#adults").evaluate((el, value) => {
          el.value = String(value);
          el.dispatchEvent(new Event("input", { bubbles: true }));
        }, count);
        assert.deepEqual((await saved(p)).childcare, before);
        assert.equal(await p.inputValue("#kids"), "2");
        assert.equal((await saved(p)).spendingAdjustment, -20);
      }
      assert.match(await p.getAttribute("#childcare-info", "data-tip"), /advance tax-credit/);
      assert.equal(await p.locator("#pr-reset").count(), 1);
      assert.equal(await p.locator("#spend-reset").count(), 0);
    },
  ],
  [
    "removing the last detailed child clears counts and restores the existing aggregate controls",
    async p => {
      await fill(p, "childcare-monthly", 0);
      await fill(p, "care-expenses-0", 0);
      await p.locator('[data-care="remove"]').first().click();
      assert.equal(await p.inputValue("#kids"), "1");
      await p.locator('[data-care="remove"]').first().click();
      assert.equal(await p.inputValue("#kids"), "0");
      assert.equal(await p.inputValue("#u6"), "0");
      assert.equal(await p.locator("#kids").isDisabled(), false);
      assert.equal(await p.locator("#childcare-details").isVisible(), false);
      assert.equal((await saved(p)).spendingAdjustment, -20);
      assert.equal(await p.locator("tr.care-breakdown").count(), 0);
    },
  ],
].map(([name, step]) => [
  name,
  async p => {
    await step(p);
    const overflow = await p.evaluate(() => {
      const card = document.querySelector("#spend-panel").closest(".control").getBoundingClientRect();
      return [
        ...document.querySelectorAll(
          "#childcare-monthly, #childcare-info, #childcare-details input, #childcare-details button, #childcare-details select, #childcare-details fieldset",
        ),
      ]
        .filter(el => el.checkVisibility())
        .filter(el => {
          const b = el.getBoundingClientRect();
          return b.left < card.left - 1 || b.right > card.right + 1;
        })
        .map(el => el.id || el.className);
    });
    assert.deepEqual(overflow, [], "childcare controls stay inside their card");
  },
]);

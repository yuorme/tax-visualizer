import assert from "node:assert/strict";

const fill = async (p, id, value) => {
  if (id === "oth" && !(await p.locator("#oth").isVisible())) await p.click("#tab-income");
  if (id.startsWith("care-")) await open(p, "#childcare-details");
  if (/^care-(earnings|claim)-/.test(id)) await open(p, "#care-adjustments");
  if (id.startsWith("care-earnings-")) {
    const checkbox = p.locator(`#care-override-${id.split("-").at(-1)}`);
    if (!(await checkbox.isChecked())) await checkbox.check();
  }
  if (id.startsWith("care-qc-")) await open(p, `#care-quebec-${id.split("-").at(-1)}`);
  await p.fill(`#${id}`, String(value));
  await p.locator(`#${id}`).blur();
};
const saved = p => p.evaluate(() => JSON.parse(localStorage.getItem("taxcmp")));
const cell = (p, label, column = 1) =>
  p.locator("tr.care-breakdown").filter({ hasText: label }).first().locator("td").nth(column).textContent();
const open = async (p, selector) => {
  if (!(await p.$eval(selector, el => el.open))) await p.locator(`${selector} > summary`).click();
};

const setCount = async (p, count) =>
  p.locator("#kids").evaluate((el, value) => {
    el.value = String(value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, count);
const qcCell = async p => cell(p, "Provincial childcare credit", (await p.inputValue("#home")) === "QC" ? 1 : 2);

export const CHILDCARE_STEPS = [
  [
    "legacy spending and generic deductions migrate without changing effective dollars",
    async p => {
      assert.equal(await p.inputValue("#kids"), "0");
      assert.equal(await p.locator("#childcare-costs").isVisible(), false);
      assert.equal(await p.locator("#childcare-details").isVisible(), false);
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
    "monthly cost reveals compact child rows without untouched errors or advanced controls",
    async p => {
      await fill(p, "childcare-monthly", 1000);
      assert.equal(await p.locator("#childcare-details").isVisible(), true);
      assert.equal(await p.inputValue("#care-age-0"), "");
      assert.equal(await p.getAttribute("#care-age-0", "inputmode"), "numeric");
      assert.equal(await p.inputValue("#care-expenses-0"), "");
      assert.equal(await p.locator("#care-earnings-0").count(), 0);
      assert.equal(await p.locator("#care-mode").isVisible(), false);
      assert.equal(await p.locator("#care-dtc-0").isVisible(), false);
      assert.equal(await p.locator(".care-quebec").count(), 0);
      assert.equal(await p.locator('#childcare-details [aria-invalid="true"]').count(), 0);
      assert.equal(await p.getAttribute("#childcare-monthly", "aria-invalid"), "false");
      assert.match(
        await p.getAttribute("#childcare-info", "data-tip"),
        /follow employment and other income by default/,
      );
      assert.equal(await cell(p, "Federal calculation"), "Details needed");
      assert.equal(await p.inputValue("#spend"), "3,200");
    },
  ],
  [
    "ages drive benefit eligibility and ordinary income supplies the default eligible earnings",
    async p => {
      await fill(p, "care-age-0", 4);
      await fill(p, "care-age-1", 10);
      await fill(p, "care-expenses-0", 10000);
      await fill(p, "care-expenses-1", 2000);
      assert.equal(await cell(p, "Federal calculation"), "Calculated");
      assert.equal(await p.locator("#kids").isDisabled(), false);
      assert.equal(await p.locator("#u6").isDisabled(), true);
      assert.equal(await p.inputValue("#kids"), "2");
      assert.equal(await p.inputValue("#u6"), "1");
      assert.equal(await p.getAttribute("#childcare-monthly", "aria-invalid"), "false");
      assert.equal(await cell(p, "Your federal childcare deduction"), "$0");
    },
  ],
  [
    "implicit spouse defaults to zero earnings; manual exceptions are optional and initially neutral",
    async p => {
      await open(p, "#care-adjustments");
      assert.equal(await p.locator("#care-override-0").isChecked(), false);
      assert.equal(await p.locator("#care-override-1").isChecked(), false);
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
      assert.equal(await p.getAttribute("#care-claim-0", "aria-invalid"), "false");
      assert.equal(await p.getAttribute("#care-claim-1", "aria-invalid"), "false");
      await fill(p, "care-claim-0", 0);
      assert.equal(await cell(p, "Federal calculation"), "Details needed");
      await fill(p, "care-claim-1", 0);
      assert.equal(await cell(p, "Federal calculation"), "Calculated");
      await p.selectOption("#care-mode", "automatic");
    },
  ],
  [
    "earnings follow income through reload until an explicit override, including zero",
    async p => {
      await p.click("#add-partner");
      await fill(p, "income", 6000);
      assert.equal(await cell(p, "Partner's federal childcare deduction"), "$4,000");
      await p.reload();
      assert.equal(await cell(p, "Partner's federal childcare deduction"), "$4,000");
      assert.equal((await saved(p)).childcare.earningsOverridden[1], false);
      // The default combines both income fields; the engine still receives an explicit eligibility assumption.
      await fill(p, "oth", 3000);
      assert.equal(await cell(p, "Partner's federal childcare deduction"), "$6,000");
      await p.reload();
      assert.equal(await cell(p, "Partner's federal childcare deduction"), "$6,000");
      await fill(p, "care-earnings-1", 3000);
      await fill(p, "oth", 6000);
      assert.equal(await cell(p, "Partner's federal childcare deduction"), "$2,000");
      await fill(p, "care-earnings-1", "");
      await fill(p, "oth", 9000);
      assert.equal(await cell(p, "Federal calculation"), "Details needed");
      assert.equal(await cell(p, "Partner's federal childcare deduction"), "$0");
      await p.uncheck("#care-override-1");
      assert.equal(await cell(p, "Partner's federal childcare deduction"), "$10,000");
      await fill(p, "oth", 0);
      await fill(p, "income", 30000);
      assert.equal(await cell(p, "Partner's federal childcare deduction"), "$12,000");
      await fill(p, "care-earnings-1", 0);
      await fill(p, "income", 40000);
      await fill(p, "oth", 6000);
      assert.equal(await cell(p, "Partner's federal childcare deduction"), "$0");
      await p.reload();
      await open(p, "#childcare-details");
      await open(p, "#care-adjustments");
      assert.equal(await p.inputValue("#care-earnings-1"), "0");
      assert.equal(await p.locator("#care-override-1").isChecked(), true);
      assert.equal(await cell(p, "Partner's federal childcare deduction"), "$0");
      await p.uncheck("#care-override-1");
      assert.equal(await cell(p, "Partner's federal childcare deduction"), "$12,000");
      await fill(p, "oth", 0);
      await fill(p, "income", 30000);
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
    "Quebec fields follow Home Province and retain eligibility when hidden",
    async p => {
      await p.selectOption("#dest", "QC");
      assert.equal(await p.locator(".care-quebec").count(), 0);
      assert.match(await qcCell(p), /Details needed/);
      await p.selectOption("#home", "QC");
      await p.selectOption("#dest", "ON");
      assert.equal(await p.locator(".care-quebec").count(), 2);
      await fill(p, "care-qc-0", 0);
      await fill(p, "care-qc-1", 0);
      assert.equal(await qcCell(p), "$0");
      await fill(p, "care-qc-0", 10000);
      await fill(p, "care-qc-1", 2000);
      assert.equal(await qcCell(p), "$8,400");
      await fill(p, "care-earnings-1", 0);
      assert.equal(await cell(p, "Partner's federal childcare deduction"), "$0");
      assert.equal(await qcCell(p), "$8,400");
      await p.uncheck("#care-override-1");
      await p.selectOption("#home", "ON");
      await p.selectOption("#dest", "QC");
      assert.equal(await p.locator(".care-quebec").count(), 0);
      assert.equal(await qcCell(p), "$8,400");
      await p.reload();
      assert.equal(await p.locator(".care-quebec").count(), 0);
      await p.selectOption("#home", "QC");
      await p.selectOption("#dest", "ON");
      await open(p, "#childcare-details");
      await open(p, "#care-quebec-0");
      assert.equal(await p.inputValue("#care-qc-0"), "10,000");
    },
  ],
  [
    "invalid numeric drafts survive blur, year changes and reload without manufacturing relief or ages",
    async p => {
      for (const [id, raw, valid, federalComplete, qcComplete] of [
        ["care-age-0", "abc", 4, false, false],
        ["care-age-0", "-4", 4, false, false],
        ["care-age-0", "1.5", 4, false, false],
        ["care-earnings-1", "-30000", 30000, false, true],
        ["care-earnings-1", "Infinity", 30000, false, true],
        ["care-earnings-1", "abc", 30000, false, true],
        ["childcare-monthly", "1.2.3", 1000, false, false],
        ["care-expenses-0", "abc", 10000, false, false],
        ["care-expenses-0", "", 10000, false, false],
        ["care-qc-0", '1" onfocus="alert(1)', 10000, true, false],
      ]) {
        if (id === "care-qc-0") await open(p, "#care-quebec-0");
        await fill(p, id, raw);
        const invalid = async () => {
          assert.equal(await p.inputValue(`#${id}`), raw);
          assert.equal(await p.getAttribute(`#${id}`, "aria-invalid"), "true");
          assert.equal(await p.locator(`#${id}`).evaluate(el => el.validity.customError), true);
          assert.equal(await p.getAttribute(`#${id}`, "onfocus"), null);
          assert.equal(await p.inputValue("#kids"), "2");
          assert.equal(await p.inputValue("#u6"), "1");
          assert.equal(await cell(p, "Federal calculation"), federalComplete ? "Calculated" : "Details needed");
          assert.equal(await cell(p, "Partner's federal childcare deduction"), federalComplete ? "$12,000" : "$0");
          if (qcComplete) assert.equal(await qcCell(p), "$8,400");
          else assert.match(await qcCell(p), /^\$0/);
        };
        await invalid();
        await p.selectOption("#tax-year", "2025");
        await p.selectOption("#tax-year", "2026");
        await invalid();
        const before = (await saved(p)).childcare;
        await p.reload();
        await open(p, "#childcare-details");
        assert.deepEqual((await saved(p)).childcare, before);
        await invalid();
        if (id === "care-qc-0") await open(p, "#care-quebec-0");
        await fill(p, id, valid);
        assert.equal(await cell(p, "Partner's federal childcare deduction"), "$12,000");
        assert.equal(await qcCell(p), "$8,400");
      }
    },
  ],
  [
    "manual verified claims replace automatic claims and remain separate from other deductions",
    async p => {
      await open(p, "#care-adjustments");
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
    "negative manual claims remain invalid through mode switches and reload",
    async p => {
      await fill(p, "care-claim-0", -3000);
      assert.equal(await cell(p, "Federal calculation"), "Details needed");
      assert.equal(await cell(p, "Your federal childcare deduction"), "$0");
      assert.equal(await qcCell(p), "$8,400");
      await p.selectOption("#care-mode", "automatic");
      await p.selectOption("#care-mode", "manual");
      await p.reload();
      await open(p, "#childcare-details");
      assert.equal(await p.inputValue("#care-claim-0"), "-3000");
      assert.equal(await p.getAttribute("#care-claim-0", "aria-invalid"), "true");
      assert.equal(await p.locator("#care-claim-0").evaluate(el => el.validity.customError), true);
      assert.equal(await cell(p, "Your federal childcare deduction"), "$0");
      await fill(p, "care-claim-0", 3000);
    },
  ],
  [
    "annual costs reconcile with a monthly average rounded to cents",
    async p => {
      await fill(p, "childcare-monthly", "833.33");
      await fill(p, "care-expenses-1", 0);
      await open(p, "#care-quebec-1");
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
      assert.equal(await qcCell(p), "$0");
      await open(p, "#care-exceptions-0");
      await p.check("#care-dtc-0");
      assert.equal(await qcCell(p), "$0");
      await open(p, "#care-quebec-0");
      await p.check("#care-severe-0");
      assert.equal(await qcCell(p), "$7,000");
      await p.uncheck("#care-severe-0");
      await p.uncheck("#care-dtc-0");
      await p.selectOption("#tax-year", "2025");
      assert.equal(await qcCell(p), "$7,000");
      await p.selectOption("#tax-year", "2026");
      assert.equal(await qcCell(p), "$0");
      await fill(p, "care-age-0", 4);
    },
  ],
  [
    "refund switch controls applied childcare credits without changing federal deductions",
    async p => {
      await p.click("#tab-credits");
      await p.click("label[for=cred-toggle]");
      assert.equal(await qcCell(p), "$0");
      assert.equal(await cell(p, "Your federal childcare deduction"), "$3,000");
      await p.click("label[for=cred-toggle]");
      assert.equal(await qcCell(p), "$7,000");
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
    "child rows and the Children control stay in sync, including adult dependants",
    async p => {
      await p.locator('[data-care="add"]').click();
      assert.equal(await p.inputValue("#kids"), "3");
      assert.equal(await p.locator(".care-child").count(), 3);
      assert.equal(await p.getAttribute("#care-age-2", "aria-invalid"), "false");
      await fill(p, "care-age-2", 8);
      await fill(p, "care-expenses-2", 0);
      await p.locator('[data-care="remove"][data-index="2"]').click();
      assert.equal(await p.inputValue("#kids"), "2");
      await fill(p, "care-age-0", 20);
      await fill(p, "care-age-1", 20);
      assert.equal(await p.inputValue("#kids"), "2");
      assert.equal(await p.inputValue("#u6"), "0");
      assert.equal(await p.locator("#childcare-costs").isVisible(), true);
      assert.equal(await p.locator(".care-child").count(), 2);
      const benefits = p.locator("table.cmp tr").filter({ hasText: "Child benefits" }).first();
      assert.equal(await benefits.locator("td").nth(1).textContent(), "$0");
      await fill(p, "care-expenses-0", "abc");
      await fill(p, "childcare-monthly", 0);
      assert.equal(await benefits.locator("td").nth(1).textContent(), "$0");
      assert.equal(await p.inputValue("#kids"), "2");
      assert.equal(await p.locator("#childcare-details").isVisible(), true);
      assert.equal(await p.locator("#childcare-details").evaluate(el => el.open), false);
      assert.equal(await p.textContent("#childcare-details > summary"), "Children's ages");
      assert.equal(await p.locator("#care-expenses-0").count(), 0);
      await p.reload();
      assert.equal(await benefits.locator("td").nth(1).textContent(), "$0");
      await fill(p, "care-age-0", "abc");
      assert.equal(await p.locator("#childcare-details").isVisible(), true);
      assert.equal(await p.getAttribute("#care-age-0", "aria-invalid"), "true");
      await fill(p, "care-age-0", 4);
      assert.notEqual(await benefits.locator("td").nth(1).textContent(), "$0");
      await fill(p, "childcare-monthly", "833.33");
      assert.equal(await p.inputValue("#care-expenses-0"), "abc");
      assert.equal(await p.getAttribute("#care-expenses-0", "aria-invalid"), "true");
      await fill(p, "care-expenses-0", 10000);
      await fill(p, "care-age-0", 4);
      await fill(p, "care-age-1", 10);
    },
  ],
  [
    "zero children and zero cost deactivate childcare without losing saved rows or hidden spending",
    async p => {
      const before = (await saved(p)).childcare.children;
      await fill(p, "childcare-monthly", 0);
      assert.equal(await p.locator("#childcare-details").isVisible(), true);
      assert.equal(await p.locator("#childcare-details").evaluate(el => el.open), false);
      assert.equal(await p.locator("#care-expenses-0").count(), 0);
      assert.equal(await p.inputValue("#kids"), "2");
      assert.equal(await p.inputValue("#u6"), "1");
      assert.equal(await p.locator("#u6").isDisabled(), true);
      assert.equal(await p.locator("tr.care-breakdown").count(), 0);
      await fill(p, "childcare-monthly", "833.33");
      assert.deepEqual((await saved(p)).childcare.children, before);
      await setCount(p, 0);
      assert.equal(await p.locator("#childcare-costs").isVisible(), false);
      assert.equal(await p.locator("#childcare-details").isVisible(), false);
      assert.equal(await p.locator("tr.care-breakdown").count(), 0);
      assert.equal(await p.inputValue("#kids"), "0");
      assert.equal(await p.inputValue("#u6"), "0");
      assert.match(await p.getAttribute('[data-note="children"]', "data-tip"), /Children under 18/);
      const hidden = await saved(p);
      const totals = async () => ({
        chart: await p.locator(".col .cv").allTextContents(),
        comparison: await p.textContent("#detail-body"),
        spend: await p.inputValue("#spend"),
      });
      const hiddenTotals = await totals();
      await p.reload();
      assert.deepEqual(await totals(), hiddenTotals);
      await p.evaluate(s => localStorage.setItem("taxcmp", JSON.stringify({ ...s, childcare: undefined })), hidden);
      await p.reload();
      assert.deepEqual(await totals(), hiddenTotals);
      await p.evaluate(s => localStorage.setItem("taxcmp", JSON.stringify(s)), hidden);
      await p.reload();
      await setCount(p, 1);
      await open(p, "#childcare-details");
      assert.equal(await p.locator(".care-child").count(), 1);
      assert.equal(await p.inputValue("#care-age-0"), "4");
      await setCount(p, 2);
      assert.equal(await p.inputValue("#care-age-1"), "10");
      assert.deepEqual((await saved(p)).childcare.children, before);
      await p.locator('[data-care="remove"]').first().click();
      assert.equal(await p.inputValue("#kids"), "1");
      assert.equal(await p.inputValue("#care-age-0"), "10");
      await p.locator('[data-care="remove"]').first().click();
      assert.equal(await p.inputValue("#kids"), "0");
      assert.equal(await p.locator("#childcare-costs").isVisible(), false);
      assert.equal(await p.locator("tr.care-breakdown").count(), 0);
      assert.equal((await saved(p)).spendingAdjustment, -20);
    },
  ],
  [
    "invalid expenses cannot turn a valid adult age into child benefits or eligible-dependant relief",
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
            under6: 0,
            spouse: false,
            people: [{ ord: 30000 }],
            childcare: {
              monthly: 1000,
              mode: "automatic",
              children: [{ age: 20, expenses: 12000 }],
              earningsOverridden: [false, false],
            },
          }),
        ),
      );
      await p.reload();
      const noChildRelief = async () => {
        const benefits = p.locator("table.cmp tr").filter({ hasText: "Child benefits" }).first();
        assert.equal(await benefits.locator("td").nth(1).textContent(), "$0");
        assert.doesNotMatch(await p.textContent("#detail-body"), /eligible dependant amount/);
        assert.equal(await p.inputValue("#kids"), "1");
        assert.equal(await p.inputValue("#u6"), "0");
      };
      await noChildRelief();
      const baseline = await p.locator(".col .cv").allTextContents();
      await fill(p, "care-expenses-0", "abc");
      assert.equal(await cell(p, "Federal calculation"), "Details needed");
      await noChildRelief();
      assert.deepEqual(await p.locator(".col .cv").allTextContents(), baseline);
      await p.reload();
      await noChildRelief();
      for (const monthly of ["0", "1000", "bad amount", "1000"]) {
        await fill(p, "childcare-monthly", monthly);
        await noChildRelief();
        assert.deepEqual(await p.locator(".col .cv").allTextContents(), baseline);
      }
      await p.reload();
      await open(p, "#childcare-details");
      assert.equal(await p.inputValue("#care-expenses-0"), "abc");
      assert.equal(await p.getAttribute("#care-expenses-0", "aria-invalid"), "true");
      await noChildRelief();
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

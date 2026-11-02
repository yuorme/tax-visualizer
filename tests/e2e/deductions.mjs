import assert from "node:assert/strict";

const value = (p, id) => p.inputValue(`#${id}`);
const total = p => p.textContent("#ded-total");
const saved = p => p.evaluate(() => JSON.parse(localStorage.getItem("taxcmp")));
const fill = async (p, id, amount) => {
  await p.fill(`#${id}`, amount);
  await p.locator(`#${id}`).blur();
};
const open = async p => {
  if (!(await p.$eval("#deductions", el => el.open))) await p.click("#deductions summary");
};

export const DEDUCTION_STEPS = [
  [
    "legacy generic deduction stays in other; itemized amounts start at zero",
    async p => {
      await p.evaluate(() => {
        localStorage.setItem(
          "taxcmp",
          JSON.stringify({ v: 3, adults: 1, people: [{ ord: 75000, cg: 2000, ed: 0, nd: 0, fd: 0, ded: 1200 }] }),
        );
      });
      await p.reload();
      assert.equal(await total(p), "$1,200");
      await p.locator("#deductions summary").focus();
      await p.keyboard.press("Enter");
      assert.equal(await value(p, "ded"), "1,200");
      assert.equal(await value(p, "rrsp"), "0");
      assert.equal(await value(p, "fhsa"), "0");
    },
  ],
  [
    "itemized claims add once; deferred FHSA claim exceeds one-year contribution allowance",
    async p => {
      await fill(p, "rrsp", "8,000");
      await fill(p, "fhsa", "13,000");
      assert.equal(await total(p), "$22,200");
      assert.equal(await value(p, "fhsa"), "13,000");
      const x = (await saved(p)).people[0];
      assert.equal(x.ded, 1200);
      assert.equal(x.rrsp, 8000);
      assert.equal(x.fhsa, 13000);
      assert.equal(x.cg, 2000);
      assert.match(await p.textContent("#detail-body"), /22,200 deductions/);
      assert.match(await p.getAttribute('[data-note="fhsa"]', "data-tip"), /Transfers from an RRSP/);
    },
  ],
  [
    "estimated RRSP shortcut changes only the selected adult's RRSP claim",
    async p => {
      assert.match(await p.textContent("#max-rrsp"), /Use estimate/);
      await p.click("#max-rrsp");
      assert.equal(await value(p, "rrsp"), "13,500");
      assert.equal(await value(p, "fhsa"), "13,000");
      assert.equal(await value(p, "ded"), "1,200");
      assert.equal(await total(p), "$27,700");
    },
  ],
  [
    "partner deductions are independent and survive reload and person switching",
    async p => {
      await p.click("#add-partner");
      assert.equal(await total(p), "$0");
      await fill(p, "rrsp", "2,000");
      await fill(p, "fhsa", "4,000");
      await fill(p, "ded", "500");
      assert.equal(await total(p), "$6,500");
      const before = await saved(p);
      await p.reload();
      await open(p);
      assert.deepEqual((await saved(p)).people, before.people);
      assert.equal(await value(p, "rrsp"), "2,000");
      assert.equal(await value(p, "fhsa"), "4,000");
      assert.equal(await value(p, "ded"), "500");
      await p.click('#people [data-i="0"]');
      assert.equal(await value(p, "rrsp"), "13,500");
      assert.equal(await value(p, "fhsa"), "13,000");
      assert.equal(await value(p, "ded"), "1,200");
      assert.equal(await total(p), "$27,700");
      await p.click('#people [data-i="1"]');
      assert.equal(await total(p), "$6,500");
    },
  ],
  [
    "clearing claims resets their total without affecting the other adult",
    async p => {
      for (const id of ["rrsp", "fhsa", "ded"]) await fill(p, id, "");
      assert.equal(await total(p), "$0");
      await p.click('#people [data-i="0"]');
      assert.equal(await total(p), "$27,700");
      await p.click("#deductions summary");
      assert.equal(await p.locator("#rrsp").isVisible(), false);
    },
  ],
];

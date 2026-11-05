import assert from "node:assert/strict";
import { loadCpi, loadYear } from "../../src/data/load.ts";
import { historyComparison } from "../../src/engine/history.ts";
import { blank, compute } from "../../src/engine/index.ts";
import { money, rate } from "../../src/ui/notes.ts";
import { settle } from "./page.mjs";
import { inspect } from "./rules.mjs";

const saved = p => p.evaluate(() => JSON.parse(localStorage.getItem("taxcmp")));
const birth = { birthYear: 1960, birthMonth: 12 };
const receipts = [
  { type: "rppLifetime", amount: 10000.25 },
  { type: "rrif", amount: 3000, survivorEligible: false },
  { type: "rrif", amount: 2000, survivorEligible: true },
  { type: "rrspAnnuity", amount: 1500, survivorEligible: false },
  { type: "rrspAnnuity", amount: 500, survivorEligible: true },
  { type: "rrspWithdrawal", amount: 1000 },
];
async function load(p, state = {}, hash = "") {
  await p.evaluate(
    ({ state, hash }) => {
      localStorage.setItem(
        "taxcmp",
        JSON.stringify({
          v: 3,
          year: 2025,
          home: "ON",
          dest: "QC",
          people: [{ ord: 0, oth: 30000 }],
          adults: 1,
          spend: 0,
          km: 0,
          tab: "income",
          ...state,
        }),
      );
      history.replaceState(null, "", location.pathname + hash);
    },
    { state, hash },
  );
  await p.reload();
  await settle(p);
}
async function open(p) {
  await p.$eval("#senior-details", el => {
    el.open = true;
  });
  await p.$eval("#retirement-details", el => {
    el.open = true;
  });
}
const household = (people, active = 0, extra = {}) => ({
  people,
  active,
  spouse: true,
  adults: people.length,
  kids: 0,
  under6: 0,
  useBpa: true,
  whRate: 0.15,
  useCredits: true,
  homeValue: 0,
  rent: 0,
  monthlySpending: 0,
  driving: { km: 0, lPer100km: 9 },
  ...extra,
});
async function chart(p, year, people, active = 0, extra = {}) {
  const y = loadYear(year);
  for (const province of y.provinces) {
    const expected = compute(y, province, household(people, active, extra));
    const suffix = p.viewportSize().width < 500 ? "" : "%";
    assert.equal(
      await p.textContent(`#col-${province.code} .cv`),
      `${(expected.avg * 100).toFixed(1)}${suffix}`,
      `${year} ${province.code}`,
    );
  }
}
async function tip(p, selector) {
  const button = p.locator(selector);
  await button.scrollIntoViewIfNeeded();
  await settle(p);
  await button.focus();
  await settle(p);
  const text = await p.textContent("#tip");
  const box = await p.locator("#tip").boundingBox();
  assert.ok(box.x >= 0 && box.x + box.width <= p.viewportSize().width, "tooltip fits width");
  assert.ok(box.y >= 0 && box.y + box.height <= p.viewportSize().height, "tooltip fits height");
  await p.keyboard.press("Escape");
  await button.blur();
  return text;
}
const rows = p =>
  p.locator("#history-rows tr[data-year]").evaluateAll(rows => rows.map(r => [...r.cells].map(c => c.textContent)));

export const SENIOR_STEPS = [
  [
    "seniors: each adult's age and every receipt field survive URL and storage round trips",
    async p => {
      await load(p);
      await open(p);
      assert.equal(await p.locator("#senior-rows > div").count(), 0);
      await p.fill("#ret-birth-year", "1960");
      await p.selectOption("#ret-birth-month", "12");
      for (const [i, receipt] of receipts.entries()) {
        await p.click("#senior-add");
        await p.selectOption(`#senior-type-${i}`, receipt.type);
        await p.fill(`#senior-amount-${i}`, String(receipt.amount));
        if (receipt.survivorEligible !== undefined) {
          // Exercise explicit false as well as true.
          await p.check(`#senior-survivor-${i}`);
          if (!receipt.survivorEligible) await p.uncheck(`#senior-survivor-${i}`);
        }
      }
      await p.locator("#senior-amount-5").blur();
      assert.deepEqual((await saved(p)).people[0].retirementIncome, receipts);
      await p.click("#add-partner");
      assert.equal(await p.locator("#senior-rows > div").count(), 0);
      await p.fill("#income", "0");
      await p.fill("#oth", "120000");
      await p.fill("#ret-birth-year", "1950");
      await p.selectOption("#ret-birth-month", "1");
      await p.click("#senior-add");
      await p.selectOption("#senior-type-0", "rrspWithdrawal");
      await p.fill("#senior-amount-0", "5000");
      await p.fill("#spend", "0");
      await settle(p);
      const state = await saved(p);
      const people = [
        { ...blank(0), oth: 30000, age: 65, birthMonth: 12, retirementIncome: receipts },
        {
          ...blank(0),
          oth: 120000,
          age: 75,
          birthMonth: 1,
          retirementIncome: [{ type: "rrspWithdrawal", amount: 5000 }],
        },
      ];
      await chart(p, 2025, people, 1);
      const hash = await p.evaluate(() => location.hash);
      await p.evaluate(() => history.replaceState(null, "", location.pathname));
      await p.reload();
      await settle(p);
      assert.deepEqual((await saved(p)).people, state.people, "storage restores all receipt fields");
      assert.deepEqual((await saved(p)).retirement, state.retirement);
      await load(p, { people: [{ ord: 999999 }] }, hash);
      assert.deepEqual((await saved(p)).people, state.people, "URL overrides recipient storage");
      assert.deepEqual((await saved(p)).retirement, state.retirement);
      await chart(p, 2025, people, 1);
      await open(p);
      await p.click('#people [data-i="0"]');
      assert.equal(await p.inputValue("#ret-birth-year"), "1960");
      assert.equal(await p.inputValue("#senior-amount-0"), "10,000.25");
      await p.click("#remove-partner");
      assert.equal((await saved(p)).people.length, 1);
      assert.equal((await saved(p)).retirement.length, 1);
    },
  ],
  [
    "seniors: age boundary, phase-outs, receipt classifications and transfers reach all jurisdictions",
    async p => {
      for (const year of [2025, 2026]) {
        for (const age of [64, 65, 75]) {
          const people = [
            { ...blank(0), oth: age === 75 ? 100000 : 20000, age, birthMonth: 12, retirementIncome: receipts },
            {
              ...blank(0),
              oth: 120000,
              age: 65,
              birthMonth: 1,
              retirementIncome: [{ type: "rppLifetime", amount: 1000 }],
            },
          ];
          await load(p, {
            year,
            people,
            adults: 2,
            retirement: [
              { birthYear: year - age, birthMonth: 12 },
              { birthYear: year - 65, birthMonth: 1 },
            ],
          });
          await chart(p, year, people);
          assert.match(await p.textContent("#retirement-sum"), new RegExp(`age ${age} in ${year}`));
          assert.match(await tip(p, '[aria-label="About taxable income"]'), /retirement receipts/);
        }
      }
      // Published full-return example from the engine verification note: 30k other + 10k RPP at age 65.
      await load(p, {
        retirement: [birth],
        people: [{ ord: 0, oth: 30000, retirementIncome: [{ type: "rppLifetime", amount: 10000 }] }],
      });
      const federal = p.locator("#detail-body .ledger").first();
      assert.equal(await federal.locator("tr").last().locator("td").last().textContent(), "$1,862");
      assert.match(await federal.textContent(), /Less age\/pension credits/);
      await p.selectOption("#tax-year", "2026");
      assert.equal(await federal.locator("tr").last().locator("td").last().textContent(), "$1,728");
      await p.click('label[for="bpa-toggle"]');
      await chart(
        p,
        2026,
        [
          {
            ...blank(0),
            oth: 30000,
            age: 66,
            birthMonth: 12,
            retirementIncome: [{ type: "rppLifetime", amount: 10000 }],
          },
        ],
        0,
        { useBpa: false },
      );
      assert.doesNotMatch(await federal.textContent(), /Less age\/pension credits/);
    },
  ],
  [
    "seniors: ledgers display engine credit amounts and Quebec transfers",
    async p => {
      for (const couple of [false, true]) {
        const people = couple
          ? [
              {
                ...blank(0),
                oth: 0,
                age: 65,
                birthMonth: 12,
                retirementIncome: [{ type: "rppLifetime", amount: 10000 }],
              },
              { ...blank(0), oth: 120000, age: 65, birthMonth: 12 },
            ]
          : [
              {
                ...blank(0),
                oth: 20000,
                age: 65,
                birthMonth: 12,
                retirementIncome: [{ type: "rppLifetime", amount: 10000 }],
              },
            ];
        const active = couple ? 1 : 0;
        await load(p, { people, active, adults: people.length, retirement: people.map(() => birth) });
        const y = loadYear(2025);
        for (const province of y.provinces) {
          await p.selectOption("#home", province.code);
          const credit = compute(y, province, household(people, active)).me.breakdown.seniorCredits;
          const ledgers = p.locator("#detail-body .ledger");
          for (const [index, label, value] of [
            [0, "Less age/pension credits and unused spouse transfers", credit.federalApplied],
            [
              1,
              province.code === "QC"
                ? "Less age/living-alone/retirement credits"
                : "Less age/pension credits and unused spouse transfers",
              credit.provincialApplied,
            ],
            [1, "Less partner's unused Quebec credit transferred", credit.quebecTransferApplied],
            [1, "Less provincial age tax credit", credit.ageTaxApplied],
          ]) {
            const row = ledgers.nth(index).locator("tr").filter({ hasText: label });
            if (value > 0.5) assert.equal(await row.locator("td").last().textContent(), `−${money(value)}`);
            else assert.equal(await row.count(), 0);
          }
        }
      }
    },
  ],
  [
    "seniors: incomplete birth dates, survivor exceptions, invalid drafts and removal",
    async p => {
      await load(p, { people: [{ ord: 0, oth: 30000, retirementIncome: [{ type: "rrif", amount: 10000 }] }] });
      await open(p);
      assert.match(await p.textContent("#senior-gate"), /Enter both birth year and month/);
      await chart(p, 2025, [{ ...blank(0), oth: 30000 }]);
      await p.fill("#ret-birth-year", "1960");
      await chart(p, 2025, [{ ...blank(0), oth: 30000 }]);
      await p.check("#senior-survivor-0");
      await chart(p, 2025, [
        { ...blank(0), oth: 30000, retirementIncome: [{ type: "rrif", amount: 10000, survivorEligible: true }] },
      ]);
      assert.equal(await p.locator("#senior-gate").isVisible(), false);
      for (const invalid of ["-1", "abc", "1e309"]) {
        await p.fill("#senior-amount-0", invalid);
        assert.equal(await p.getAttribute("#senior-amount-0", "aria-invalid"), "true");
        assert.equal((await saved(p)).people[0].retirementIncome[0].amount, 10000);
      }
      await p.fill("#senior-amount-0", "10000.25");
      await p.fill("#senior-amount-0", "abc");
      await p.locator("#senior-type-0").focus();
      await p.selectOption("#senior-type-0", "rrspAnnuity");
      await settle(p);
      assert.equal(await p.inputValue("#senior-amount-0"), "abc", "type changes preserve the invalid amount draft");
      assert.equal(await p.getAttribute("#senior-amount-0", "aria-invalid"), "true");
      assert.equal(await p.$eval("#senior-amount-0", input => input.validity.customError), true);
      assert.equal((await saved(p)).people[0].retirementIncome[0].amount, 10000.25);
      await p.fill("#senior-amount-0", "0");
      assert.equal(await p.getAttribute("#senior-amount-0", "aria-invalid"), "false");
      assert.equal(await p.$eval("#senior-amount-0", input => input.validationMessage), "");
      assert.equal((await saved(p)).people[0].retirementIncome[0].amount, 0);
      await p.selectOption("#senior-type-0", "rrspWithdrawal");
      assert.equal(Object.hasOwn((await saved(p)).people[0].retirementIncome[0], "survivorEligible"), false);
      assert.equal(await p.locator("#senior-survivor-0").isVisible(), false);
      await p.click('[data-remove="0"]');
      assert.equal(Object.hasOwn((await saved(p)).people[0], "retirementIncome"), false);
    },
  ],
  [
    "seniors: old URLs and saved states keep ordinary pensions and results unchanged",
    async p => {
      for (const year of [2024, 2025, 2026]) {
        const people = [{ ...blank(0), oth: 40000 }];
        await load(p, { year, people });
        await chart(p, year, people);
        assert.equal(Object.hasOwn((await saved(p)).people[0], "retirementIncome"), false);
        const hash = `#s=1&year=${year}&people=${encodeURIComponent(JSON.stringify(people))}&spend=0&km=0`;
        await load(p, { people: [{ ord: 999999, retirementIncome: receipts }], retirement: [birth] }, hash);
        assert.deepEqual((await saved(p)).people, people);
        assert.deepEqual((await saved(p)).retirement, []);
        await chart(p, year, people);
      }
    },
  ],
  [
    "seniors: selected historical year retains inputs and history omits unsupported years in both modes",
    async p => {
      const person = { ...blank(0), oth: 30000, retirementIncome: receipts };
      await load(p, { year: 2024, people: [person], retirement: [birth] });
      assert.equal(await p.locator("#senior-gate").isVisible(), true);
      assert.match(await p.textContent("#senior-gate"), /2025 and 2026 only.*2024 results exclude/);
      await chart(p, 2024, [{ ...blank(0), oth: 30000 }]);
      assert.deepEqual((await saved(p)).people[0].retirementIncome, receipts);
      await p.click("#view-history");
      for (const mode of ["nominal", "real"]) {
        await p.click(`#history-${mode}`);
        await settle(p);
        const expected = [2025, 2026]
          .flatMap(
            year =>
              historyComparison(
                [loadYear(year)],
                loadCpi(),
                household([{ ...person, age: year - 1960, birthMonth: 12 }]),
                ["ON"],
                mode,
              ).rows,
          )
          .map(row => {
            const r = row.provinces[0];
            return [String(row.year), money(r.income), money(r.tax), rate(r.rate)];
          });
        assert.deepEqual(await rows(p), expected);
        assert.match(await p.textContent("#history-basis"), /age\/pension credits: 2025 and 2026 only/);
        assert.match(await tip(p, "#history-info"), /earlier years are left out, not complete senior-tax comparisons/);
      }
      // Age-independent receipts must also restrict history, even without a birth date.
      await load(p, {
        people: [{ ord: 0, retirementIncome: [{ type: "rppLifetime", amount: 40000 }] }],
        historyOpen: true,
        historyMode: "nominal",
      });
      assert.deepEqual(
        (await rows(p)).map(row => row[0]),
        ["2025", "2026"],
      );
    },
  ],
];

export const SENIOR_RESPONSIVE_STEPS = [
  [
    "layout: senior receipts, limitations tooltips and older-year notice fit",
    async p => {
      await load(p, { retirement: [birth], people: [{ ord: 0, oth: 30000, retirementIncome: receipts }] });
      await open(p);
      await settle(p);
      const text = await tip(p, '[data-note="seniorIncome"]');
      assert.match(text, /2025 and 2026 only/);
      assert.match(text, /RRIF minimums, OAS\/CPP deferral and residency rules are not modelled/);
      assert.match(text, /Move any amounts already in Other income/);
      assert.match(text, /December 31/);
      assert.match(text, /Quebec.*Health Services Fund/);
      assert.match(await tip(p, '[data-note="seniorSurvivor"]'), /death of a spouse or common-law partner/);
      assert.match(await tip(p, '[data-note="retirementAge"]'), /December 31/);
      for (const selector of ["#senior-amount-0", "#senior-type-5", "#senior-survivor-1", "#senior-add"]) {
        assert.equal(await p.locator(selector).isVisible(), true);
        const box = await p.locator(selector).boundingBox();
        assert.ok(box.x >= 0 && box.x + box.width <= p.viewportSize().width, selector);
      }
      assert.deepEqual(
        await p
          .locator("#senior-rows input:not([type=checkbox])")
          .evaluateAll(inputs => inputs.filter(i => i.scrollWidth > i.clientWidth + 1).map(i => i.id)),
        [],
      );
      assert.ok((await inspect(p)).scrollWidth <= p.viewportSize().width);
      await p.selectOption("#tax-year", "2024");
      assert.equal(await p.locator("#senior-gate").isVisible(), true);
      assert.ok((await inspect(p)).scrollWidth <= p.viewportSize().width);
      await load(p);
    },
    { contrast: true },
  ],
];

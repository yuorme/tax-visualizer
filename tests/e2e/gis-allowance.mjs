import assert from "node:assert/strict";
import { loadCpi, loadYear } from "../../src/data/load.ts";
import { historyComparison } from "../../src/engine/history.ts";
import { blank, compute } from "../../src/engine/index.ts";
import { money, rate } from "../../src/ui/notes.ts";
import { settle } from "./page.mjs";
import { inspect } from "./rules.mjs";
import { chart, household, load, open, rows, saved, tip } from "./senior-income.mjs";

const adult = (age, extra = {}) => ({ ...blank(0), age, birthMonth: 6, ...extra });
async function scenario(p, year, people, extra = {}) {
  await load(p, {
    year,
    people,
    adults: people.length,
    retirement: people.map(person => ({ birthYear: year - person.age, birthMonth: person.birthMonth })),
    ...extra,
  });
}
const signed = amount => `${amount < 0 ? "−" : ""}${money(Math.abs(amount))}`;
async function ledger(p, year, people, active = 0, extra = {}) {
  for (const code of ["ON", "QC"]) {
    await p.selectOption("#home", code);
    const y = loadYear(year);
    const result = compute(
      y,
      y.provinces.find(province => province.code === code),
      household(people, active, extra),
    );
    const details = result.me.breakdown;
    const benefit = result.breakdown.gisAllowance.adults[active];
    for (const [label, amount] of [
      ["Gross GIS benefit", benefit.gis],
      ["Gross Allowance benefit", benefit.allowance],
      ["Federal net income (includes benefits)", details.netIncomeTotal],
      ["Provincial net income (includes benefits)", details.provincialNetIncome],
      ["Other-payments deduction from taxable income", -details.otherPaymentsDeduction],
      ["Recovery deduction (included in deductions)", -(details.netIncome.oasRecovery ?? 0)],
      ["Supplement recovery (included in federal recovery)", details.supplementRecovery],
    ])
      assert.equal(
        await p.locator(".senior-benefit-ledger tr").filter({ hasText: label }).locator("td").last().textContent(),
        signed(amount),
      );
    const federal = p.locator("#detail-body .ledger").first();
    assert.equal(await federal.locator("tfoot tr").last().locator("td").last().textContent(), money(result.me.fed));
    const recovery = federal.locator("tfoot tr").filter({ hasText: "OAS / supplement recovery tax" });
    if (details.netIncome.oasRecovery > 0.5)
      assert.equal(await recovery.locator("td").last().textContent(), `+${money(details.netIncome.oasRecovery)}`);
    else assert.equal(await recovery.count(), 0);
    const comparison = p
      .locator("#detail-body tr")
      .filter({ has: p.locator('[data-comparison-note="GIS and Allowance in net tax"]') });
    assert.ok((await comparison.textContent()).includes(money(result.breakdown.gisAllowance.total)));
    const comparisonRows = p.locator("#detail-body tr");
    for (const [label, amount] of [
      [people.length === 2 ? "Household net tax" : "Net tax", result.total],
      ["Left after all of this", result.breakdown.left],
    ]) {
      const row = comparisonRows.filter({ has: p.locator("td:first-child", { hasText: new RegExp(`^${label}$`) }) });
      assert.equal(await row.locator("td").nth(1).textContent(), signed(amount));
    }
    const taxable = await tip(p, '[data-comparison-note="taxable income"]');
    if (details.netFederalSupplements)
      assert.ok(taxable.includes(`${money(details.netFederalSupplements)} GIS and Allowance`));
    if (details.otherPaymentsDeduction)
      assert.ok(taxable.includes(`${money(details.otherPaymentsDeduction)} other-payments deduction`));
    assert.deepEqual(
      await p
        .locator("#detail-body .ledger")
        .evaluateAll(els => els.filter(el => el.scrollWidth > el.clientWidth + 1).map(el => el.textContent)),
      [],
    );
  }
}

export const GIS_ALLOWANCE_STEPS = [
  [
    "GIS: independent per-adult opt-ins round-trip every field and false through URL and saved state",
    async p => {
      await load(p, { people: [{ ord: 0, oth: 0 }] });
      await open(p);
      for (const key of ["gis", "allowance"]) assert.equal(await p.isChecked(`#senior-${key}`), false);
      await p.fill("#ret-birth-year", "1950");
      await p.selectOption("#ret-birth-month", "6");
      await p.check("#senior-oas");
      await p.check("#senior-gis");
      assert.equal(await p.locator("#senior-allowance").isVisible(), false);
      await p.click("#add-partner");
      await p.click('#people [data-i="0"]');
      await p.check("#senior-allowance");
      await p.uncheck("#senior-allowance");
      await p.click('#people [data-i="1"]');
      assert.equal(await p.isChecked("#senior-gis"), false);
      await p.fill("#income", "0");
      await p.fill("#ret-birth-year", "1963");
      await p.selectOption("#ret-birth-month", "6");
      await p.check("#senior-gis");
      await p.uncheck("#senior-gis");
      await p.check("#senior-allowance");
      await p.fill("#spend", "0");
      await settle(p);
      const state = await saved(p);
      const hash = await p.evaluate(() => location.hash);
      assert.equal(state.people[0].gis, true);
      assert.equal(state.people[0].allowance, false);
      assert.equal(state.people[1].gis, false);
      assert.equal(state.people[1].allowance, true);
      await p.evaluate(() => history.replaceState(null, "", location.pathname));
      await p.reload();
      await settle(p);
      assert.deepEqual((await saved(p)).people, state.people);
      await load(p, { people: [{ ord: 999999, gis: false, allowance: false }] }, hash);
      assert.deepEqual((await saved(p)).people, state.people);
      assert.deepEqual((await saved(p)).retirement, state.retirement);
      const people = [
        adult(75, { oas: true, gis: true, allowance: false }),
        adult(62, { gis: false, allowance: true }),
      ];
      await chart(p, 2025, people, 1);
      await open(p);
      assert.equal(await p.isChecked("#senior-allowance"), true);
      await p.click('#people [data-i="0"]');
      assert.equal(await p.isChecked("#senior-gis"), true);
      assert.equal(await p.isChecked("#senior-allowance"), false);
      await p.click("#remove-partner");
      assert.equal((await saved(p)).people.length, 1);
    },
  ],
  [
    "GIS: Allowance is offered only to spouse households and hidden drafts survive URL and storage round trips",
    async p => {
      for (const spouse of [true, false]) {
        const people = spouse
          ? [adult(62, { allowance: true })]
          : [adult(62, { allowance: true }), adult(76, { oas: true, gis: true })];
        await scenario(p, 2025, people, { spouse });
        await open(p);
        assert.equal(await p.locator("#senior-allowance-label").isVisible(), false);
        assert.equal(await p.locator("#senior-allowance").isVisible(), false);
        await chart(p, 2025, people, 0, { spouse });
        const state = await saved(p);
        const hash = await p.evaluate(() => location.hash);
        await p.evaluate(() => history.replaceState(null, "", location.pathname));
        await p.reload();
        await settle(p);
        assert.deepEqual((await saved(p)).people, state.people);
        await open(p);
        assert.equal(await p.locator("#senior-allowance").isVisible(), false);
        await load(p, {}, hash);
        assert.deepEqual((await saved(p)).people, state.people);
        assert.equal((await saved(p)).spouse, spouse);
        await open(p);
        assert.equal(await p.locator("#senior-allowance").isVisible(), false);
        if (people.length === 1) {
          await p.click("#add-partner");
          await p.click('#people [data-i="0"]');
        } else await p.check("#spouse-toggle");
        assert.equal(await p.locator("#senior-allowance").isVisible(), true);
        assert.equal(await p.isChecked("#senior-allowance"), true);
        await p.uncheck("#spouse-toggle");
        assert.equal(await p.locator("#senior-allowance").isVisible(), false);
        await p.check("#spouse-toggle");
        assert.equal(await p.isChecked("#senior-allowance"), true);
        await p.click("#remove-partner");
        assert.equal(await p.locator("#senior-allowance").isVisible(), false);
        assert.equal((await saved(p)).people[0].allowance, true);
      }
    },
  ],
  [
    "GIS: zero payments are omitted from the benefits tooltip and young birth dates get the correct notice",
    async p => {
      await scenario(p, 2025, [adult(76, { oth: 10000, gis: true, oas: false })]);
      assert.equal(await p.locator("#col-ON .ben").isVisible(), true);
      await p.locator("#col-ON .ben").dispatchEvent("pointerover", { pointerType: "mouse" });
      assert.doesNotMatch(await p.textContent("#tip"), /GIS and Allowance/);
      assert.match(await p.textContent("#tip"), /Netted off the tax above/);
      await p.keyboard.press("Escape");
      for (const key of ["gis", "allowance"]) {
        await load(p, { people: [{ ord: 0, [key]: true }], retirement: [{ birthYear: 2007, birthMonth: 6 }] });
        await open(p);
        assert.equal(await p.inputValue("#ret-birth-year"), "2007");
        assert.equal(await p.inputValue("#ret-birth-month"), "6");
        assert.match(
          await p.textContent("#senior-benefit-gate"),
          /too young for the retirement rules modelled in 2025/,
        );
        assert.doesNotMatch(await p.textContent("#senior-benefit-gate"), /Enter both birth year and month/);
        await chart(p, 2025, [blank(0)]);
        await p.click("#view-history");
        assert.doesNotMatch(await tip(p, "#history-info"), /Enter both birth year and month/);
        await p.click("#view-provinces");
        await p.fill("#ret-birth-year", "2008");
        assert.match(await p.textContent("#senior-benefit-gate"), /too young for the retirement rules/);
        await p.click("#view-history");
        const text = await tip(p, "#history-info");
        assert.match(text, /too young for the retirement rules modelled in 2026/);
        assert.doesNotMatch(text, /Enter both birth year and month/);
      }
    },
  ],
  [
    "GIS: marital categories, income taper, OAS prerequisite and birthday transitions reach chart and ledger",
    async p => {
      for (const year of [2025, 2026]) {
        const senior = adult(76, { oas: true, gis: true });
        for (const [people, spouse] of [
          [[senior], true],
          [[{ ...senior, oth: 10112 }], true],
          [[{ ...senior, oas: false }], true],
          [[{ ...senior, oas: undefined }], true],
          [[senior, adult(70, { oas: true })], true],
          [[senior, adult(62)], true],
          [[senior, adult(62, { allowance: true })], true],
          [[{ ...senior, oth: 40752 }, adult(62, { allowance: true })], true],
          [[senior, adult(62, { allowance: true })], false],
          ...[60, 65].flatMap(age =>
            [6, 12].map(birthMonth => [
              [senior, adult(age, { birthMonth, allowance: true, oas: true, gis: true })],
              true,
            ]),
          ),
        ]) {
          await scenario(p, year, people, { spouse });
          await chart(p, year, people, 0, { spouse });
          await ledger(p, year, people, 0, { spouse });
          if (people.length === 2) {
            await p.click('#people [data-i="1"]');
            await ledger(p, year, people, 1, { spouse });
          }
        }
      }
      await scenario(p, 2025, [adult(76, { oas: true, gis: true })]);
      await p.locator("#col-ON .ben").dispatchEvent("pointerover", { pointerType: "mouse" });
      assert.match(await p.textContent("#tip"), /GIS and Allowance \$13,131/);
      assert.match(await p.textContent("#tip"), /Netted off the tax above/);
      assert.match(await p.getAttribute("#col-ON", "aria-label"), /benefits and credits/);
      await p.keyboard.press("Escape");
      assert.equal(
        await p
          .locator(".senior-benefit-ledger tr")
          .filter({ hasText: "Gross GIS benefit" })
          .locator("td")
          .last()
          .textContent(),
        "$13,131",
        "published quarterly single maximum sums to 13,130.82",
      );
    },
  ],
  [
    "GIS: benefits survive credit switches and Allowance-only recovery is shown once",
    async p => {
      const people = [adult(76, { oas: true, gis: true, ded: 200000 }), adult(62, { allowance: true, oth: 200000 })];
      await scenario(p, 2025, people);
      await p.click('#people [data-i="1"]');
      await chart(p, 2025, people, 1);
      await ledger(p, 2025, people, 1);
      assert.equal(
        await p
          .locator(".senior-benefit-ledger tr")
          .filter({ hasText: "Gross Allowance benefit" })
          .locator("td")
          .last()
          .textContent(),
        "$16,695",
      );
      for (const extra of [{ useCredits: false }, { useBpa: false }, { useCredits: false, useBpa: false }]) {
        const low = [adult(76, { oas: true, gis: true }), adult(62, { allowance: true })];
        await scenario(p, 2025, low, extra);
        await chart(p, 2025, low, 0, extra);
        await ledger(p, 2025, low, 0, extra);
      }
    },
  ],
  [
    "GIS: incomplete birth dates retain opt-ins and pre-19 URLs and saves preserve results",
    async p => {
      for (const key of ["gis", "allowance"]) {
        await load(p, { people: [{ ord: 0, oth: 30000, [key]: true }] });
        await open(p);
        assert.match(await p.textContent("#senior-benefit-gate"), /Enter both birth year and month/);
        await chart(p, 2025, [{ ...blank(0), oth: 30000 }]);
        await p.fill("#ret-birth-year", "1950");
        await chart(p, 2025, [{ ...blank(0), oth: 30000 }]);
        await p.selectOption("#ret-birth-month", "6");
        assert.equal(await p.locator("#senior-benefit-gate").isVisible(), false);
        await p.click("#retirement-clear");
        assert.equal((await saved(p)).people[0][key], true);
      }
      for (const year of [2024, 2025, 2026]) {
        const person = {
          ...blank(0),
          oth: 40000,
          oas: true,
          cppQpp: 10000,
          retirementIncome: [{ type: "rppLifetime", amount: 1000 }],
        };
        const retirement = [{ birthYear: 1950, birthMonth: 6 }];
        const hash = `#s=1&year=${year}&people=${encodeURIComponent(JSON.stringify([person]))}&retirement=${encodeURIComponent(JSON.stringify(retirement))}&spend=0&km=0`;
        for (const fromUrl of [false, true]) {
          await load(
            p,
            fromUrl
              ? { people: [{ ord: 999999, gis: true, allowance: true }] }
              : { year, people: [person], retirement },
            fromUrl ? hash : "",
          );
          assert.deepEqual((await saved(p)).people, [person]);
          await chart(p, year, [
            year === 2024 ? { ...blank(0), oth: 40000 } : { ...person, age: year - 1950, birthMonth: 6 },
          ]);
          await open(p);
          for (const key of ["gis", "allowance"]) assert.equal(await p.isChecked(`#senior-${key}`), false);
          assert.equal(await p.locator(".senior-benefit-ledger").count(), 0);
        }
      }
    },
  ],
  [
    "GIS: selected older year excludes drafts and both history modes show only covered years",
    async p => {
      for (const person of [
        { ...blank(0), gis: false },
        { ...blank(0), allowance: false },
        { ...blank(0), oas: true, gis: true, allowance: true },
      ]) {
        const retirement = person.gis ? [{ birthYear: 1950, birthMonth: 6 }] : [];
        await load(p, { year: 2024, people: [person], retirement });
        assert.match(await p.textContent("#senior-benefit-gate"), /2025 and 2026 only.*2024 results exclude/);
        await chart(p, 2024, [blank(0)]);
        assert.deepEqual((await saved(p)).people, [person]);
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
                  household([{ ...person, ...(person.gis ? { age: year - 1950, birthMonth: 6 } : {}) }]),
                  ["ON"],
                  mode,
                ).rows,
            )
            .map(row => {
              const r = row.provinces[0];
              return [String(row.year), money(r.income), signed(r.tax), rate(r.rate)];
            });
          assert.deepEqual(await rows(p), expected);
          assert.match(await p.textContent("#history-basis"), /GIS and Allowance: 2025 and 2026 only/);
          const text = await tip(p, "#history-info");
          assert.match(text, /earlier years are left out, not complete senior-tax comparisons/);
          assert.match(text, /income-year proxy/);
        }
        await p.click("#view-provinces");
        await p.selectOption("#tax-year", "2026");
        assert.equal(await p.locator("#senior-benefit-gate").isVisible(), false);
      }
    },
  ],
];

export const GIS_ALLOWANCE_RESPONSIVE_STEPS = [
  [
    "layout: GIS and Allowance controls, assumptions, ledgers and older-year notice fit",
    async p => {
      const people = [adult(76, { oas: true, gis: true }), adult(62, { allowance: true })];
      await scenario(p, 2025, people);
      await open(p);
      for (const [note, patterns] of [
        [
          "seniorBenefits",
          [
            /2025 and 2026 only/,
            /GIS requires Full resident OAS to be entered/,
            /single category/,
            /spouse receiving OAS, the Allowance or neither/,
            /Allowance requires a GIS recipient spouse/,
            /Allowance for the Survivor is not modelled/,
            /Full Canadian residence/,
          ],
        ],
        [
          "seniorBenefitTiming",
          [
            /2025 and 2026 only/,
            /prior-year income/,
            /GIS requires Full resident OAS to be entered/,
            /both historical income years/,
            /income-year proxy/,
            /December 31/,
            /month after the 60th birthday/,
            /65th birthday month/,
            /December birthday/,
            /no day-of-month exceptions/,
            /each quarter.s published rates/,
          ],
        ],
        [
          "seniorBenefitTax",
          [
            /netted off household tax once/,
            /credits disabled/,
            /income denominator/,
            /net income/,
            /taxable income/,
            /Other income/,
          ],
        ],
      ]) {
        const text = await tip(p, `[data-note="${note}"]`);
        for (const pattern of patterns) assert.match(text, pattern);
      }
      for (const selector of ["#senior-gis", "#senior-allowance"]) {
        assert.equal(await p.locator(selector).isVisible(), true);
        const box = await p.locator(selector).boundingBox();
        assert.ok(box.x >= 0 && box.x + box.width <= p.viewportSize().width);
      }
      await ledger(p, 2025, people);
      await p.click('#people [data-i="1"]');
      await ledger(p, 2025, people, 1);
      assert.match(await tip(p, '[data-comparison-note="GIS and Allowance accounting"]'), /gross cash benefits/);
      assert.match(
        await tip(p, '[data-comparison-note="GIS and Allowance in net tax"]'),
        /netted off household tax once/,
      );
      await p.uncheck("#spouse-toggle");
      assert.equal(await p.locator("#senior-allowance").isVisible(), false);
      assert.ok((await inspect(p)).scrollWidth <= p.viewportSize().width);
      await p.check("#spouse-toggle");
      assert.equal(await p.isChecked("#senior-allowance"), true);
      await p.click("#remove-partner");
      assert.equal(await p.locator("#senior-allowance").isVisible(), false);
      await p.selectOption("#tax-year", "2024");
      assert.equal(await p.locator("#senior-benefit-gate").isVisible(), true);
      assert.ok((await inspect(p)).scrollWidth <= p.viewportSize().width);
      await load(p);
    },
    { contrast: true },
  ],
];

import assert from "node:assert/strict";
import { loadCpi, loadYear } from "../../src/data/load.ts";
import { historyComparison } from "../../src/engine/history.ts";
import { blank, compute } from "../../src/engine/index.ts";
import { money, rate } from "../../src/ui/notes.ts";
import { settle } from "./page.mjs";
import { inspect } from "./rules.mjs";
import { chart, household, load, open, rows, saved, tip } from "./senior-income.mjs";

async function ledger(p, year, people, active = 0) {
  for (const code of ["ON", "QC"]) {
    await p.selectOption("#home", code);
    const data = loadYear(year);
    const result = compute(
      data,
      data.provinces.find(province => province.code === code),
      household(people, active),
    );
    const federal = p.locator("#detail-body .ledger").first();
    assert.equal(
      await federal
        .locator(".public-pension-ledger")
        .evaluate(table => table.getBoundingClientRect().width <= table.parentElement.clientWidth + 1),
      true,
      "public pension rows fit the ledger without horizontal scrolling",
    );
    const pension = result.me.breakdown.publicPensions;
    for (const [i, person] of result.list.entries())
      assert.equal(await p.textContent(`#people [data-i="${i}"] small`), money(person.cash));
    assert.ok((await p.textContent("#cmp-eyebrow")).includes(`${money(result.cash)} total income`));
    for (const [label, amount] of [
      ["Gross OAS income", pension.oas],
      ["CPP/QPP retirement income", pension.cppQpp],
      ["OAS recovery deduction (included in deductions)", -pension.recoveryDeduction],
    ]) {
      const cell = federal.locator(".public-pension-ledger tr").filter({ hasText: label }).locator("td").last();
      assert.equal(await cell.textContent(), `${amount < 0 ? "−" : ""}${money(Math.abs(amount))}`);
    }
    const recovery = federal.locator("tfoot tr").filter({ hasText: "OAS recovery tax" });
    if (pension.recoveryTax > 0.5)
      assert.equal(await recovery.locator("td").last().textContent(), `+${money(pension.recoveryTax)}`);
    else assert.equal(await recovery.count(), 0);
    assert.equal(await federal.locator("tfoot tr").last().locator("td").last().textContent(), money(result.me.fed));
    const payroll = p.locator("#detail-body .ledger").nth(2);
    const hsf = payroll.locator("tr").filter({ hasText: "Quebec Health Services Fund" });
    const contribution = result.me.breakdown.healthServicesFund.contribution;
    if (contribution > 0.5) assert.equal(await hsf.locator("td").last().textContent(), money(contribution));
    else assert.equal(await hsf.count(), 0);
    const taxable = await tip(p, '[data-comparison-note="taxable income"]');
    if (pension.oas) assert.ok(taxable.includes(`${money(pension.oas)} OAS`));
    if (pension.cppQpp) assert.ok(taxable.includes(`${money(pension.cppQpp)} CPP/QPP retirement income`));
    assert.ok((await inspect(p)).scrollWidth <= p.viewportSize().width);
    assert.deepEqual(
      await p
        .locator("#detail-body .ledger")
        .evaluateAll(ledgers =>
          ledgers
            .filter(ledger => ledger.scrollWidth > ledger.clientWidth + 1)
            .map(ledger => ledger.querySelector("h4").textContent),
        ),
      [],
      "all ledger amounts remain visible without sideways scrolling",
    );
  }
}

export const PUBLIC_PENSION_STEPS = [
  [
    "public pensions: both adults' fields round-trip through URLs and saved state, independently of payroll elections",
    async p => {
      await load(p);
      await open(p);
      await p.fill("#ret-birth-year", "1950");
      await p.selectOption("#ret-birth-month", "6");
      await p.check("#senior-oas");
      await p.fill("#senior-cpp-qpp", "12345.67");
      await p.click("#add-partner");
      assert.equal(await p.isChecked("#senior-oas"), false);
      assert.equal(await p.inputValue("#senior-cpp-qpp"), "");
      await p.fill("#income", "0");
      await p.fill("#oth", "120000");
      await p.fill("#spend", "0");
      await p.fill("#ret-birth-year", "1960");
      await p.selectOption("#ret-birth-month", "12");
      await p.check("#senior-oas");
      await p.uncheck("#senior-oas");
      await p.fill("#senior-cpp-qpp", "0");
      const state = await saved(p);
      assert.equal(state.people[0].oas, true);
      assert.equal(state.people[0].cppQpp, 12345.67);
      assert.equal(state.people[0].oth, 30000);
      assert.equal(state.people[1].oas, false);
      assert.equal(state.people[1].cppQpp, 0);
      assert.deepEqual(
        state.retirement.map(r => r.pensionSince),
        [
          { year: null, month: null },
          { year: null, month: null },
        ],
      );
      const people = state.people.map((person, i) => ({
        ...person,
        age: 2025 - state.retirement[i].birthYear,
        birthMonth: state.retirement[i].birthMonth,
      }));
      await chart(p, 2025, people, 1);
      const hash = await p.evaluate(() => location.hash);
      await p.evaluate(() => history.replaceState(null, "", location.pathname));
      await p.reload();
      await settle(p);
      assert.deepEqual((await saved(p)).people, state.people);
      assert.deepEqual((await saved(p)).retirement, state.retirement);
      await load(p, { people: [{ ord: 999999, oas: true, cppQpp: 99999 }] }, hash);
      assert.deepEqual((await saved(p)).people, state.people);
      assert.deepEqual((await saved(p)).retirement, state.retirement);
      await chart(p, 2025, people, 1);
      await open(p);
      await p.click('#people [data-i="0"]');
      assert.equal(await p.isChecked("#senior-oas"), true);
      assert.equal(await p.inputValue("#senior-cpp-qpp"), "12,345.67");
      await p.fill("#senior-cpp-qpp", "bad");
      await p.click('#people [data-i="1"]');
      assert.equal(await p.inputValue("#senior-cpp-qpp"), "0");
      assert.equal(await p.getAttribute("#senior-cpp-qpp", "aria-invalid"), "false");
      await p.click("#remove-partner");
      assert.equal((await saved(p)).people.length, 1);
      assert.equal((await saved(p)).people[0].cppQpp, 12345.67);
    },
  ],
  [
    "public pensions: birthday and 75+ timing, per-adult recovery and capped recovery reach charts and ledgers",
    async p => {
      for (const year of [2025, 2026]) {
        for (const [age, birthMonth, oth] of [
          [64, 1, 20000],
          [65, 6, 20000],
          [65, 12, 20000],
          [75, 6, 80000],
          [75, 12, 200000],
          [76, 1, 20000],
        ]) {
          const people = [
            { ...blank(0), oth, age, birthMonth, oas: true, cppQpp: 20000 },
            { ...blank(0), oth: 95000, age: 70, birthMonth: 1, oas: true, cppQpp: 5000 },
          ];
          await load(p, {
            year,
            people,
            adults: 2,
            retirement: people.map(person => ({ birthYear: year - person.age, birthMonth: person.birthMonth })),
          });
          await chart(p, year, people);
          await ledger(p, year, people);
          await p.click('#people [data-i="1"]');
          await ledger(p, year, people, 1);
        }
      }
    },
  ],
  [
    "public pensions: incomplete birth dates exclude only OAS, invalid amounts preserve prior values and empty removes",
    async p => {
      await load(p, { people: [{ ord: 0, oth: 30000, oas: true, cppQpp: 10000 }] });
      await open(p);
      assert.match(await p.textContent("#public-pension-gate"), /Enter both birth year and month/);
      const person = { ...blank(0), oth: 30000, cppQpp: 10000 };
      await chart(p, 2025, [person]);
      await p.fill("#ret-birth-year", "1950");
      await chart(p, 2025, [person]);
      await p.selectOption("#ret-birth-month", "6");
      assert.equal(await p.locator("#public-pension-gate").isVisible(), false);
      await chart(p, 2025, [{ ...person, age: 75, birthMonth: 6, oas: true }]);
      for (const invalid of ["-1", "abc", "1e309", "1.234"]) {
        await p.fill("#senior-cpp-qpp", invalid);
        await p.locator("#senior-cpp-qpp").blur();
        assert.equal(await p.inputValue("#senior-cpp-qpp"), invalid);
        assert.equal(await p.getAttribute("#senior-cpp-qpp", "aria-invalid"), "true");
        assert.equal((await saved(p)).people[0].cppQpp, 10000);
      }
      await p.fill("#senior-cpp-qpp", "0");
      assert.equal((await saved(p)).people[0].cppQpp, 0);
      assert.equal(await p.getAttribute("#senior-cpp-qpp", "aria-invalid"), "false");
      await p.fill("#senior-cpp-qpp", "");
      assert.equal(Object.hasOwn((await saved(p)).people[0], "cppQpp"), false);
      await p.click("#retirement-clear");
      assert.match(await p.textContent("#public-pension-gate"), /Enter both birth year and month/);
      assert.equal((await saved(p)).people[0].oas, true);
    },
  ],
  [
    "public pensions: pre-18 URLs and saves preserve Other income, typed receipts and age without enabling pensions",
    async p => {
      for (const year of [2024, 2025, 2026]) {
        const person = { ...blank(0), oth: 40000, retirementIncome: [{ type: "rppLifetime", amount: 1000 }] };
        const retirement = [{ birthYear: 1950, birthMonth: 6 }];
        const expected = year === 2024 ? { ...blank(0), oth: 40000 } : { ...person, age: year - 1950, birthMonth: 6 };
        const hash = `#s=1&year=${year}&people=${encodeURIComponent(JSON.stringify([person]))}&retirement=${encodeURIComponent(JSON.stringify(retirement))}&spend=0&km=0`;
        for (const fromUrl of [false, true]) {
          await load(
            p,
            fromUrl ? { people: [{ ord: 999999, oas: true, cppQpp: 99999 }] } : { year, people: [person], retirement },
            fromUrl ? hash : "",
          );
          assert.deepEqual((await saved(p)).people, [person]);
          await chart(p, year, [expected]);
          await open(p);
          assert.equal(await p.isChecked("#senior-oas"), false);
          assert.equal(await p.inputValue("#senior-cpp-qpp"), "");
          assert.equal(await p.locator(".public-pension-ledger").count(), 0);
        }
      }
    },
  ],
  [
    "public pensions: older selected years retain inputs and history restricts both modes, including CPP without age",
    async p => {
      for (const oas of [undefined, true]) {
        const person = { ...blank(0), oth: 30000, cppQpp: 10000, ...(oas ? { oas } : {}) };
        await load(p, { year: 2024, people: [person], retirement: oas ? [{ birthYear: 1950, birthMonth: 6 }] : [] });
        assert.match(await p.textContent("#public-pension-gate"), /2025 and 2026 only.*2024 results exclude/);
        await chart(p, 2024, [{ ...blank(0), oth: 30000 }]);
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
                  household([{ ...person, ...(oas ? { age: year - 1950, birthMonth: 6 } : {}) }]),
                  ["ON"],
                  mode,
                ).rows,
            )
            .map(row => {
              const r = row.provinces[0];
              return [String(row.year), money(r.income), money(r.tax), rate(r.rate)];
            });
          assert.deepEqual(await rows(p), expected);
          assert.match(await p.textContent("#history-basis"), /OAS and CPP\/QPP retirement income: 2025 and 2026 only/);
          assert.match(
            await tip(p, "#history-info"),
            /earlier years are left out, not complete senior-tax comparisons/,
          );
        }
        await p.click("#view-provinces");
        await p.selectOption("#tax-year", "2026");
        assert.equal(await p.locator("#public-pension-gate").isVisible(), false);
        await chart(p, 2026, [{ ...person, ...(oas ? { age: 76, birthMonth: 6 } : {}) }]);
      }
    },
  ],
];

export const PUBLIC_PENSION_RESPONSIVE_STEPS = [
  [
    "layout: public pension controls, coverage, assumptions and recovery ledger fit",
    async p => {
      const person = { ...blank(0), oth: 80000, oas: true, cppQpp: 20000 };
      await load(p, { people: [person], retirement: [{ birthYear: 1950, birthMonth: 6 }] });
      await open(p);
      const text = await tip(p, '[data-note="publicPensions"]');
      for (const pattern of [
        /2025 and 2026 only/,
        /Recovery is current-year liability, not withholding based on the preceding return/,
        /December 31/,
        /month after the 65th birthday/,
        /month after the 75th birthday/,
        /December birthday takes effect the following year/,
        /published monthly amounts for each quarter, not an annualized run rate/,
        /OAS deferral and residency rules are not modelled/,
        /Do not enter an amount here and in Other income/,
        /not an entitlement estimate or a payroll stop election/,
        /OAS is excluded from Quebec.*CPP\/QPP is included/,
      ])
        assert.match(text, pattern);
      for (const selector of ['[data-note="oasRecovery"]', '[data-comparison-note="OAS recovery"]']) {
        const recovery = await tip(p, selector);
        assert.match(recovery, /current-year liability, not withholding based on the preceding return/);
        assert.match(recovery, /deduction is already included in total deductions/);
        assert.match(recovery, /not a refundable credit/);
      }
      for (const selector of ["#senior-oas", "#senior-cpp-qpp"]) {
        assert.equal(await p.locator(selector).isVisible(), true);
        const box = await p.locator(selector).boundingBox();
        assert.ok(box.x >= 0 && box.x + box.width <= p.viewportSize().width);
      }
      await ledger(p, 2025, [{ ...person, age: 75, birthMonth: 6 }]);
      await p.selectOption("#tax-year", "2024");
      assert.equal(await p.locator("#public-pension-gate").isVisible(), true);
      assert.ok((await inspect(p)).scrollWidth <= p.viewportSize().width);
      await load(p);
    },
    { contrast: true },
  ],
];

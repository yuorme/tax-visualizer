import assert from "node:assert/strict";
import { loadYear } from "../../src/data/load.ts";
import { blank, compute } from "../../src/engine/index.ts";
import { money } from "../../src/ui/notes.ts";
import { inspect } from "./rules.mjs";
import { chart, household, load, open, tip } from "./senior-income.mjs";

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
const detailRow = (p, label) =>
  p.locator("#detail-body tr").filter({ has: p.locator("td:first-child", { hasText: label }) });
const province = (year, code) => loadYear(year).provinces.find(x => x.code === code);

/** Comparison row, ledger and chart for a province that pays a cash supplement. */
async function cashSupplement(p, year, code, people, extra = {}) {
  await p.selectOption("#home", code);
  const y = loadYear(year);
  const result = compute(y, province(year, code), household(people, 0, extra));
  const supplements = result.breakdown.provincialSupplements;
  assert.ok(supplements?.total > 0, `${year} ${code} pays a supplement`);
  await chart(p, year, people, 0, extra);
  const row = detailRow(p, "Provincial seniors' supplements");
  assert.equal(await row.locator("td").nth(1).textContent(), `−${money(supplements.total)}`);
  assert.ok(await row.locator('[data-comparison-note="Provincial seniors\' supplements"]').count());
  const ledger = p.locator(".senior-benefit-ledger", { hasText: "Provincial seniors' supplements" });
  for (const payment of supplements.payments.filter(x => x.recipients[0] > 0))
    assert.equal(
      await ledger.locator("tr").filter({ hasText: payment.name }).locator("td").last().textContent(),
      money(payment.recipients[0]),
    );
  assert.equal(
    await ledger.locator("tr").filter({ hasText: "line 14500" }).locator("td").last().textContent(),
    money(supplements.reported[0]),
  );
  const taxable = await tip(p, '[data-comparison-note="taxable income"]');
  if (supplements.reported[0] > 0)
    assert.ok(taxable.includes(`${money(supplements.reported[0])} reportable provincial seniors' supplements`));
  for (const label of ["Household net tax", "Net tax"]) {
    const net = detailRow(p, new RegExp(`^${label}$`));
    if (await net.count())
      assert.equal(
        await net.locator("td").nth(1).textContent(),
        `${result.total < 0 ? "−" : ""}${money(Math.abs(result.total))}`,
      );
  }
  assert.deepEqual(
    await p
      .locator("#detail-body .ledger, #detail-body .senior-benefit-ledger")
      .evaluateAll(els => els.filter(el => el.scrollWidth > el.clientWidth + 1).map(el => el.textContent)),
    [],
  );
}

export const SENIOR_SUPPLEMENT_STEPS = [
  [
    "supplements: a cash supplement reconciles in the comparison row, ledger and net tax in both years",
    async p => {
      for (const year of [2025, 2026]) {
        const people = [adult(75, { oas: true, gis: true })];
        await scenario(p, year, people);
        await cashSupplement(p, year, "ON", people);
        await cashSupplement(p, year, "BC", people);
      }
    },
  ],
  [
    "supplements: Yukon and PEI read as not modelled, never as zero, and disclosures name what is left out",
    async p => {
      const people = [adult(75, { oas: true, gis: true })];
      await scenario(p, 2025, people);
      await p.selectOption("#home", "ON");
      for (const code of ["YT", "PE"]) {
        await p.selectOption("#dest", code);
        const row = detailRow(p, "Provincial seniors' supplements");
        assert.equal(await row.locator("td").nth(2).textContent(), "not modelled");
        assert.notEqual(await row.locator("td").nth(1).textContent(), "not modelled");
      }
      await p.selectOption("#home", "YT");
      await p.selectOption("#dest", "PE");
      assert.equal(
        await detailRow(p, "Provincial seniors' supplements").locator("td").nth(1).textContent(),
        "not modelled",
      );
      await open(p);
      const text = await tip(p, '[data-note="seniorSupplements"]');
      for (const pattern of [
        /2025 and 2026 only/,
        /Ontario/,
        /no inputs/,
        /prior-year income/,
        /Current-year income stands in/,
        /Yukon.s Seniors Income Supplement/,
        /Yukon shows no supplement, not a zero entitlement/,
        /Prince Edward Island.s assessed/,
        /Coastal Labrador/,
        /survivors and people in care/,
        /Housing and care programs are not included/,
        /#216/,
      ])
        assert.match(text, pattern);
      assert.doesNotMatch(text, /Yukon[^.]*Territory[^.]*modelled for/);
      assert.match(await tip(p, '[data-note="seniorBenefitTax"]'), /Provincial seniors. supplements are separate/);
    },
  ],
  [
    "supplements: refundable-credit programs stay in Refundable credits and a household without them shows no row",
    async p => {
      const people = [adult(72, { oas: true, gis: true, oth: 30000 })];
      await scenario(p, 2025, people);
      await p.selectOption("#home", "QC");
      await p.selectOption("#dest", "ON");
      const y = loadYear(2025);
      const result = compute(y, province(2025, "QC"), household(people, 0));
      assert.ok(
        result.credits.some(([name]) => /senior/i.test(name)),
        "Quebec senior assistance is a credit",
      );
      assert.ok(result.refund > 0);
      assert.ok(
        (
          await detailRow(p, /^Refundable credits/)
            .locator("td")
            .nth(1)
            .textContent()
        ).includes(money(result.refund)),
      );
      await scenario(p, 2025, [adult(40, { ord: 60000 })]);
      assert.equal(await detailRow(p, "Provincial seniors' supplements").count(), 0);
    },
  ],
];

export const SENIOR_SUPPLEMENT_RESPONSIVE_STEPS = [
  [
    "layout: provincial seniors' supplements row, ledger and tooltips fit",
    async p => {
      const people = [adult(75, { oas: true, gis: true })];
      await scenario(p, 2025, people);
      await cashSupplement(p, 2025, "ON", people);
      await p.selectOption("#dest", "YT");
      assert.equal(
        await detailRow(p, "Provincial seniors' supplements").locator("td").nth(2).textContent(),
        "not modelled",
      );
      await open(p);
      assert.match(await tip(p, '[data-note="seniorSupplements"]'), /Housing and care programs are not included/);
      assert.match(
        await tip(p, '[data-comparison-note="Provincial seniors\' supplements"]'),
        /Yukon shows no supplement/,
      );
      assert.ok((await inspect(p)).scrollWidth <= p.viewportSize().width);
      await load(p);
    },
    { contrast: true },
  ],
];

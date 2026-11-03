import assert from "node:assert/strict";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { blank, compute, deductionsOf, type Household, netOf, type Person, type Result } from "../src/engine/index.ts";

/** Compare every calculated field, excluding the deliberately different raw person inputs echoed in results. */
function calculated(r: Result) {
  const { x: _input, ...me } = r.me;
  return { ...r, me, list: r.list.map(({ x: _input, ...person }) => person) };
}

const household = (people: Person[], active = 0): Household => ({
  people,
  active,
  adults: people.length,
  spouse: true,
  kids: 2,
  under6: 1,
  useBpa: true,
  useCredits: true,
  whRate: 0.15,
  homeValue: 0,
  rent: 1800,
  monthlySpending: 2000,
});

for (const year of [2025, 2026]) {
  const y = loadYear(year);
  test(`${year}: itemized deductions equal the same legacy total in every result and marginal path`, () => {
    const claims = [
      { ...blank(65_000), cg: 5000, ed: 2000, fd: 1000, ded: 1200, rrsp: 8000, fhsa: 13_000 },
      { ...blank(45_000), ded: 750, rrsp: 4000, fhsa: 5000 },
    ];
    const legacy = claims.map(({ rrsp, fhsa, ...person }) => ({ ...person, ded: person.ded + rrsp + fhsa }));
    for (const p of y.provinces)
      for (const active of [0, 1]) {
        assert.deepEqual(
          calculated(compute(y, p, household(claims, active))),
          calculated(compute(y, p, household(legacy, active))),
          `${p.code}, adult ${active}`,
        );
      }
  });

  test(`${year}: absent and zero claims preserve legacy results; deductions don't reduce cash or payroll`, () => {
    for (const p of y.provinces) {
      const base = household([{ ...blank(60_000), ded: 2000 }]);
      const old = compute(y, p, base);
      assert.deepEqual(
        calculated(compute(y, p, { ...base, people: [{ ...base.people[0], rrsp: 0, fhsa: 0 }] })),
        calculated(old),
      );
      const claimed = compute(y, p, { ...base, people: [{ ...base.people[0], rrsp: 10_000, fhsa: 5000 }] });
      assert.equal(claimed.cash, old.cash);
      assert.deepEqual(claimed.me.pay, old.me.pay);
      assert.equal(claimed.me.breakdown.netIncome.ded, 17_000);
      assert.ok(claimed.benefits > old.benefits, `${p.code}: lower net income increases child benefits`);
      assert.ok(claimed.total < old.total, `${p.code}: claims lower net household taxes`);
    }
  });
}

test("CRA deferred FHSA example: Nagia's 2026 claim is $13,000, not capped at $8,000", () => {
  // CRA: $8,000 contributed in 2025 but not deducted, plus $5,000 in 2026, claimed together in 2026.
  // https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/first-home-savings-account/tax-deductions-fhsa-contributions.html
  const y = loadYear(2026);
  const x = blank(80_000);
  assert.equal(netOf(y.federal, null, x) - netOf(y.federal, null, { ...x, fhsa: 13_000 }), 13_000);
  assert.equal(deductionsOf({ ...x, ded: 1000, rrsp: 5000, fhsa: 13_000 }), 19_000);
  assert.equal(netOf(y.federal, null, { ...blank(2000), rrsp: 5000, fhsa: 13_000 }), 0);
});

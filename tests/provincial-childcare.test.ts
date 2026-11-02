import assert from "node:assert/strict";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { blank, type ChildcareInput, compute, type Household, type Person } from "../src/engine/index.ts";

const hh = (people: Person[], childcare: ChildcareInput, over: Partial<Household> = {}): Household => ({
  people,
  childcare,
  active: 0,
  adults: people.length,
  spouse: true,
  kids: 0,
  under6: 0,
  useBpa: true,
  useCredits: true,
  whRate: 0,
  homeValue: 0,
  rent: 0,
  monthlySpending: 0,
  ...over,
});
const auto = (expenses = 10_000, age = 3): ChildcareInput => ({
  mode: "automatic",
  children: [{ age, expenses, qcEligibleExpenses: expenses }],
  earnedIncome: [60_000],
});
const close = (actual: number, expected: number) =>
  assert.ok(Math.abs(actual - expected) < 1e-7, `${actual} != ${expected}`);

for (const year of [2025, 2026]) {
  const y = loadYear(year);
  const province = (code: string) => {
    const p = y.provinces.find(p => p.code === code);
    assert.ok(p);
    return p;
  };
  const calc = (
    code: string,
    input: ChildcareInput = auto(),
    people = [blank(60_000)],
    over: Partial<Household> = {},
  ) => compute(y, province(code), hh(people, input, over));
  const detail = (
    code: string,
    input: ChildcareInput = auto(),
    people = [blank(60_000)],
    over: Partial<Household> = {},
  ) => {
    const d = calc(code, input, people, over).breakdown.childcareCredit;
    assert.ok(d);
    return d;
  };

  test(`${year}: Ontario published CARE table includes each exact boundary and started income step`, () => {
    // ON479-A 2025, page 2; the statutory table continues in 2026.
    const cases = [
      [0, 0.75],
      [20_000, 0.75],
      [20_000.01, 0.73],
      [22_500, 0.73],
      [22_500.01, 0.71],
      [40_000, 0.59],
      [40_000.01, 0.57],
      [45_000, 0.57],
      [60_000, 0.51],
      [60_000.01, 0.49],
      [63_600, 0.49],
      [63_600.01, 0.47],
      [146_400, 0.03],
      [146_400.01, 0.01],
      [150_000, 0.01],
      [150_000.01, 0],
    ];
    const input: ChildcareInput = { ...auto(1000), mode: "manual", manualClaims: [1000] };
    for (const [income, rate] of cases) {
      // No payroll deductions or dividend gross-up: raw net equals the requested income.
      const d = detail("ON", input, [{ ...blank(0), fd: income }]);
      close(d.income, income);
      close(d.rate, rate);
      close(d.calculated, 1000 * rate);
      close(d.applied, d.calculated);
    }
  });

  test(`${year}: Ontario adds back before zero floor and sums per-person adjusted incomes`, () => {
    const input: ChildcareInput = { ...auto(10_000), mode: "manual", manualClaims: [8000, 2000] };
    const d = detail("ON", input, [
      { ...blank(0), fd: 1000, ded: 1500 },
      { ...blank(0), fd: 20_000 },
    ]);
    assert.equal(d.income, 20_000); // max(0,-500)+20k; adding claims to floored net would give28k.
    assert.equal(d.allowedExpenses, 10_000);
    assert.equal(d.applied, 7500);
    const incomplete = detail("ON", { ...auto(), earnedIncome: undefined });
    assert.equal(incomplete.status, "incomplete");
    assert.equal(incomplete.applied, 0);
  });

  test(`${year}: Quebec published rate table changes only above each inclusive threshold`, () => {
    const thresholds =
      year === 2025
        ? [24795, 43725, 45340, 46970, 48570, 50195, 119835]
        : [25305, 44620, 46270, 47935, 49565, 51225, 122290];
    const rates = [0.78, 0.75, 0.74, 0.73, 0.72, 0.71, 0.7, 0.67];
    for (let i = 0; i < thresholds.length; i++) {
      const at = detail("QC", auto(1000), [{ ...blank(0), fd: thresholds[i] }]);
      const above = detail("QC", auto(1000), [{ ...blank(0), fd: thresholds[i] + 0.01 }]);
      assert.equal(at.rate, rates[i]);
      assert.equal(above.rate, rates[i + 1]);
      close(at.applied, 1000 * rates[i]);
    }
  });

  test(`${year}: Quebec pools all eligible child caps including children with no expenses`, () => {
    const young = year === 2025 ? 12275 : 12525,
      other = year === 2025 ? 6180 : 6305;
    const input: ChildcareInput = {
      ...auto(20_000),
      children: [
        { age: 3, expenses: 20_000, qcEligibleExpenses: 20_000 },
        { age: 10, expenses: 0 },
      ],
    };
    const d = detail("QC", input);
    assert.equal(d.annualLimit, young + other);
    assert.equal(d.allowedExpenses, young + other);
    close(d.calculated, (young + other) * 0.7);
    assert.equal(detail("QC", auto(20_000, 6)).annualLimit, young);
    assert.equal(detail("QC", auto(20_000, 7)).annualLimit, other);
  });

  test(`${year}: Quebec severe impairment is distinct from federal DTC and infirm older dependants`, () => {
    const severe = year === 2025 ? 16800 : 17145,
      other = year === 2025 ? 6180 : 6305;
    const child = { age: 22, expenses: 20_000, qcEligibleExpenses: 20_000 };
    const input = (flags: object): ChildcareInput => ({ ...auto(), children: [{ ...child, ...flags }] });
    assert.equal(detail("QC", input({ disabilityTaxCredit: true })).annualLimit, 0);
    assert.equal(detail("QC", input({ infirm: true })).annualLimit, other);
    const r = calc("QC", input({ qcSevereImpairment: true }));
    assert.equal(r.breakdown.childcareCredit?.annualLimit, severe);
    assert.equal(r.childcare.annualLimit, 0); // Provincial flag does not attest federal eligibility.
    assert.deepEqual(r.childcare.childCounts, { kids: 0, under6: 0 });
  });

  test(`${year}: Quebec ordinary age limit changes in 2026, including children turning the cutoff age`, () => {
    const through = year === 2025 ? 16 : 14;
    assert.equal(detail("QC", auto(1000, through)).allowedExpenses, 1000);
    assert.equal(detail("QC", auto(1000, through + 1)).allowedExpenses, 0);
    assert.equal(detail("QC", auto(1000, 15)).allowedExpenses, year === 2025 ? 1000 : 0);
  });

  test(`${year}: Quebec uses exact provincial income and supplied eligible costs independently of earnings`, () => {
    const input = { ...auto(), earnedIncome: [0] };
    const r = calc("QC", input);
    const d = r.breakdown.childcareCredit;
    assert.ok(d);
    assert.deepEqual(r.childcare.claims, [0]);
    assert.equal(d.status, "complete");
    assert.equal(d.applied, 7000);
    assert.equal(d.income, r.me.tiP);
    assert.equal(d.income, r.famNet - r.me.workerDed);
    const missingEarnings = calc("QC", { ...input, earnedIncome: undefined });
    assert.equal(missingEarnings.childcare.status, "incomplete");
    assert.equal(missingEarnings.breakdown.childcareCredit?.applied, 7000);
    const withClaim = calc("QC", auto());
    assert.equal(withClaim.breakdown.childcareCredit?.income, d.income);
    assert.equal(withClaim.breakdown.childcareCredit?.applied, d.applied);
    const couple = calc("QC", { ...auto(), earnedIncome: [60_000, 30_000] }, [blank(60_000), blank(30_000)]);
    assert.equal(
      couple.breakdown.childcareCredit?.income,
      couple.list.reduce((s, p) => s + p.tiP, 0),
    );
  });

  test(`${year}: missing, zero, subsidized and invalid Quebec costs do not invalidate the federal claim`, () => {
    const qc = (qcEligibleExpenses?: number) =>
      calc("QC", { ...auto(), children: [{ age: 3, expenses: 10_000, qcEligibleExpenses }] });
    assert.equal(qc().breakdown.childcareCredit?.status, "incomplete");
    assert.equal(qc(0).breakdown.childcareCredit?.status, "complete");
    assert.equal(qc(0).breakdown.childcareCredit?.applied, 0);
    assert.equal(qc(2000).breakdown.childcareCredit?.applied, 1400);
    for (const value of [-1, NaN, Infinity, 10_001]) {
      const r = qc(value);
      assert.equal(r.childcare.status, "complete");
      assert.deepEqual(r.childcare.claims, [8000]);
      assert.equal(r.breakdown.childcareCredit?.status, "invalid");
      assert.equal(r.breakdown.childcareCredit?.applied, 0);
    }
    assert.equal(detail("QC", { ...auto(), children: [{ age: 3, expenses: 0 }] }).status, "complete");
  });

  test(`${year}: monthly allocation validation preserves counts and gates all relief with currency tolerance`, () => {
    for (const code of ["ON", "QC", "NL"]) {
      for (const declaredAnnualExpenses of [10_000, 9999.96, 9999.94, 10000.06]) {
        const r = calc(code, { ...auto(), declaredAnnualExpenses });
        assert.equal(r.childcare.status, "complete");
        assert.equal(r.childcare.expenses, 10_000);
      }
      for (const declaredAnnualExpenses of [9999.93, 10000.07, 12_000]) {
        const r = calc(code, { ...auto(), declaredAnnualExpenses });
        assert.equal(r.childcare.status, "incomplete");
        assert.deepEqual(r.childcare.childCounts, { kids: 1, under6: 1 });
        assert.deepEqual(r.childcare.claims, [0]);
        assert.equal(r.breakdown.childcareCredit?.applied, 0);
        assert.deepEqual(r.breakdown.childcareCredit?.reasons, ["expenses-not-allocated"]);
      }
      for (const declaredAnnualExpenses of [-1, NaN, Infinity]) {
        const r = calc(code, { ...auto(), declaredAnnualExpenses });
        assert.equal(r.childcare.status, "invalid");
        assert.equal(r.breakdown.childcareCredit?.applied, 0);
      }
    }
  });

  test(`${year}: unresolved provincial supporting-person configurations are explicit, even in federal manual mode`, () => {
    const input: ChildcareInput = { ...auto(), mode: "manual", manualClaims: [8000, 0] };
    for (const code of ["ON", "QC"]) {
      const r = calc(code, input, [blank(60_000), blank(0)], { spouse: false });
      assert.equal(r.childcare.status, "complete");
      assert.equal(r.breakdown.childcareCredit?.status, "unsupported");
      assert.equal(r.breakdown.childcareCredit?.applied, 0);
    }
  });

  test(`${year}: refundable toggle gates Ontario/Quebec applied amounts, not calculations or NL credits`, () => {
    for (const code of ["ON", "QC", "NL"]) {
      const on = detail(code),
        off = detail(code, auto(), [blank(60_000)], { useCredits: false });
      assert.equal(off.calculated, on.calculated);
      assert.equal(off.applied, code === "NL" ? on.applied : 0);
      assert.equal(off.refundable, code !== "NL");
    }
  });

  test(`${year}: NL428 child care amount applies per claimant before dividends/reductions and never below zero`, () => {
    const p = province("NL");
    const input: ChildcareInput = { ...auto(), mode: "manual", manualClaims: [6000, 4000] };
    const h = hh([blank(80_000), blank(50_000)], input);
    const r = compute(y, p, h),
      no = compute(y, { ...p, childcareCredit: undefined }, h);
    const d = r.breakdown.childcareCredit;
    assert.ok(d);
    close(d.calculated, 870);
    assert.deepEqual(d.perPerson, [522, 348]);
    close(no.prov - r.prov, 870);
    assert.equal(r.refund, no.refund);
    assert.equal(r.payroll, no.payroll);
    const poor = calc("NL", { ...auto(), mode: "manual", manualClaims: [8000] }, [blank(10_000)]);
    assert.equal(poor.breakdown.childcareCredit?.calculated, 696);
    assert.equal(poor.breakdown.childcareCredit?.applied, 0);
    assert.equal(poor.prov, 0);
    const noBasic = detail("NL", auto(), [blank(60_000)], { useBpa: false });
    assert.equal(noBasic.applied, 696);
    const dividends = calc("NL", auto(), [{ ...blank(20_000), ed: 50_000 }]);
    const x = dividends.me;
    const remaining = Math.max(0, x.pr.tax - x.pCred - x.pSp - x.pEmp - x.pKid);
    close(x.breakdown.childcareCredit.applied, Math.min(remaining, 696));
    close(x.pDtc, Math.min(Math.max(0, remaining - x.breakdown.childcareCredit.applied), x.pDtcFull));
    assert.ok(dividends.prov >= 0);
  });
}

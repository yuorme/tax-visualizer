// Unit tests for the figures the engine hands the page for display (result.breakdown and person.breakdown): the
// pieces of net income, RRSP room, the Quebec abatement, the foreign tax credit, the household sums in the chart
// tooltips and the money left after tax. The page only formats these, so each one is checked here.
import assert from "node:assert/strict";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { blank, compute, type Household, type Person, payrollOf } from "../src/engine/index.ts";

const y = loadYear(2026);
const F = y.federal;
const prov = (code: string) => {
  const p = y.provinces.find(q => q.code === code);
  if (!p) throw new Error(`no ${code}`);
  return p;
};
const person = (over: Partial<Person>): Person => ({ ...blank(0), ...over });
const household = (people: Person[], over: Partial<Household> = {}): Household => ({
  people,
  active: 0,
  spouse: true,
  adults: people.length,
  kids: 0,
  under6: 0,
  useBpa: true,
  whRate: F.investment.foreignWithholding.usTreaty,
  useCredits: true,
  homeValue: 0,
  rent: 0,
  monthlySpending: 0,
  ...over,
});
/** The selected person's result in one province. */
const me = (code: string, x: Person, over: Partial<Household> = {}) => compute(y, prov(code), household([x], over)).me;
const close = (a: number, b: number, what: string) => assert.ok(Math.abs(a - b) < 1e-6, `${what}: ${a} vs ${b}`);

test("net income parts: each dividend type is grossed up by its own rate", () => {
  const gu = F.investment.grossUp;
  // The test only tells the two apart if the year's gross-ups differ (2026: 38% and 15%).
  assert.notEqual(gu.eligible, gu.nonEligible);
  const eligible = me("ON", person({ ord: 50_000, ed: 10_000 })).breakdown.netIncome;
  assert.equal(eligible.ed, 10_000 * gu.eligible);
  close(eligible.ed, 13_800, "eligible");
  assert.equal(eligible.nd, 0);
  const nonEligible = me("ON", person({ ord: 50_000, nd: 10_000 })).breakdown.netIncome;
  assert.equal(nonEligible.nd, 10_000 * gu.nonEligible);
  close(nonEligible.nd, 11_500, "non-eligible");
  assert.equal(nonEligible.ed, 0);
});

test("net income parts: the taxable share of gains, foreign dividends at face value, a net loss counts as 0", () => {
  const n = me("BC", person({ ord: 40_000, cg: 20_000, fd: 3_000, ded: 5_000 })).breakdown.netIncome;
  assert.equal(n.cg, 20_000 * F.investment.capitalGainsInclusion);
  assert.equal(n.cg, 10_000);
  assert.equal(n.fd, 3_000);
  assert.equal(n.ded, 5_000);
  assert.equal(n.ord, 40_000);
  assert.equal(me("BC", person({ ord: 40_000, cg: -20_000 })).breakdown.netIncome.cg, 0);
});

test("net income parts add up to taxable income in every province, enhanced CPP/QPP included", () => {
  const people = [
    person({ ord: 120_000, cg: 15_000, ed: 4_000, nd: 2_000, fd: 6_000, ded: 9_000 }),
    person({ ord: 30_000, cg: -8_000, nd: 12_000 }),
    person({ ord: 2_000, ded: 10_000 }), // deductions larger than income: net income is floored at 0
  ];
  for (const p of y.provinces)
    for (const x of people) {
      const m = compute(y, p, household([x])).me;
      const n = m.breakdown.netIncome;
      assert.equal(Math.max(0, n.ord + n.cg + n.ed + n.nd + n.fd - n.ded - n.enh), m.ti, `${p.code} ${x.ord}`);
      assert.equal(n.enh, payrollOf(F, p, x).enh, `${p.code} ${x.ord}`);
    }
  // The enhanced contribution is part of the breakdown, not left out of it
  assert.ok(me("ON", people[0]).breakdown.netIncome.enh > 0);
});

test("RRSP room: a share of employment income, capped at the year's limit, rounded to the dollar", () => {
  assert.equal(me("ON", blank(100_000)).breakdown.rrspRoom, 100_000 * F.rrsp.rate);
  assert.equal(me("ON", blank(100_000)).breakdown.rrspRoom, 18_000);
  assert.equal(me("ON", blank(12_345)).breakdown.rrspRoom, Math.round(12_345 * F.rrsp.rate));
  assert.equal(me("ON", blank(500_000)).breakdown.rrspRoom, F.rrsp.limit);
  // Investment income isn't earned income, and deductions already taken don't shrink the room
  assert.equal(me("ON", person({ ed: 100_000, cg: 50_000 })).breakdown.rrspRoom, 0);
  assert.equal(me("ON", person({ ord: 100_000, ded: 18_000 })).breakdown.rrspRoom, 18_000);
});

test("Quebec abatement: the abatement rate times basic federal tax, and nothing outside Quebec", () => {
  const qc = me("QC", blank(100_000));
  const b = qc.breakdown;
  assert.ok(qc.fedBasic > 0);
  close(b.quebecAbatement, qc.fedBasic * F.quebecAbatement, "abatement");
  // Basic federal tax splits into what's paid, the abatement and the foreign tax credit
  close(qc.fed + b.quebecAbatement + qc.fFtc, qc.fedBasic, "fedBasic");
  assert.ok(b.quebecAbatement < qc.fed); // 16.5% abated, not 83.5%
  assert.equal(me("ON", blank(100_000)).breakdown.quebecAbatement, 0);
});

test("foreign tax credit: federal plus provincial, and the withholding left uncredited", () => {
  // Foreign dividends only, withheld at 50%: both credits apply and still don't cover the withholding
  const m = me("ON", person({ fd: 100_000 }), { whRate: 0.5 });
  const b = m.breakdown;
  assert.ok(m.fFtc > 0 && m.pFtc > 0);
  assert.equal(b.ftc, m.fFtc + m.pFtc);
  assert.equal(b.whUncredited, m.wh - b.ftc);
  assert.ok(b.whUncredited > 0);
  // At the treaty rate with other income, the whole withholding is credited
  const t = me("ON", person({ ord: 60_000, fd: 10_000 })).breakdown;
  assert.ok(t.ftc > 0);
  close(t.whUncredited, 0, "uncredited at treaty rate");
});

test("household sums: surtax, provincial reductions and the foreign tax credit add up over both people", () => {
  const rich = compute(y, prov("ON"), household([person({ ord: 250_000, fd: 20_000 }), person({ ord: 220_000 })]));
  const [a, c] = rich.list;
  assert.ok(a.surtax > 0 && c.surtax > 0);
  assert.equal(rich.breakdown.surtax, a.surtax + c.surtax);
  assert.equal(rich.breakdown.ftc, a.breakdown.ftc + c.breakdown.ftc);
  assert.ok(rich.breakdown.ftc > 0);
  // Low incomes: the Ontario tax reduction and LIFT credit, and the BC tax reduction
  const low = [person({ ord: 18_000 }), person({ ord: 16_000 })];
  for (const code of ["ON", "BC"]) {
    const r = compute(y, prov(code), household(low, { spouse: false }));
    const sum = r.list.reduce((s, x) => s + x.onRed + x.lift + x.bcRed, 0);
    assert.ok(sum > 0, code);
    close(r.breakdown.provReductions, sum, code);
    // Each person's reduction counts, not just the selected one's
    assert.ok(r.breakdown.provReductions > r.me.onRed + r.me.lift + r.me.bcRed, code);
  }
});

test("household sums: payroll by kind adds up to total payroll in every province", () => {
  const people = [person({ ord: 95_000 }), person({ ord: 40_000 })];
  for (const p of y.provinces) {
    const r = compute(y, p, household(people));
    const t = r.breakdown.payroll;
    close(t.cpp + t.ei + t.qpip + t.terr + t.ohp, r.payroll, p.code);
    close(t.cpp, r.list[0].pay.base + r.list[0].pay.enh + r.list[1].pay.base + r.list[1].pay.enh, `${p.code} cpp`);
  }
  // Each kind shows where it applies: QPIP in Quebec, the health premium in Ontario, payroll tax in the territories
  // that charge one
  assert.ok(compute(y, prov("QC"), household(people)).breakdown.payroll.qpip > 0);
  assert.ok(compute(y, prov("ON"), household(people)).breakdown.payroll.ohp > 0);
  assert.equal(compute(y, prov("ON"), household(people)).breakdown.payroll.qpip, 0);
  const terr = y.provinces.filter(p => p.payroll?.employeeTax);
  assert.ok(terr.length > 0);
  for (const p of terr) assert.ok(compute(y, p, household(people)).breakdown.payroll.terr > 0, p.code);
});

test("money left: income less net tax, also when there's no income and benefits exceed tax", () => {
  const r = compute(y, prov("ON"), household([blank(80_000)], { monthlySpending: 3_000 }));
  close(r.breakdown.left, r.cash - r.total, "left");
  // No income, two children: benefits make net tax negative, and the money left is exactly those benefits.
  // (Income here is 0, not the 1 the average rate divides by.)
  const z = compute(y, prov("ON"), household([blank(0)], { kids: 2, under6: 1 }));
  assert.ok(z.total < 0);
  assert.equal(z.breakdown.left, -z.total);
});

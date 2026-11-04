// Unit tests for other income (interest, rental and other income, Person.oth): taxed as ordinary income and counted
// in net income for every benefit and clawback, but no CPP/QPP, EI, QPIP or territorial payroll tax, no Canada
// employment amount, and not working income for the Canada Workers Benefit, Quebec's work premium or the working
// components of the Alberta and New Brunswick child benefits. Each test is written so that a reading that treats
// other income as employment income (or leaves it out of net income) fails it.
import assert from "node:assert/strict";
import test from "node:test";
import { listYears, loadYear } from "../src/data/load.ts";
import {
  blank,
  ccbOf,
  compute,
  creditsOf,
  type Household,
  healthPremium,
  household,
  netOf,
  type Person,
  payrollOf,
  phased,
  provincialChildBenefit,
  type YearData,
} from "../src/engine/index.ts";

const YEARS = listYears().map(loadYear);
const y = loadYear(2026);
const F = y.federal;
const provIn = (yd: YearData, code: string) => {
  const p = yd.provinces.find(q => q.code === code);
  if (!p) throw new Error(`no ${code} in ${yd.year}`);
  return p;
};
const prov = (code: string) => provIn(y, code);
const person = (over: Partial<Person>): Person => ({ ...blank(0), ...over });
const hh = (people: Person[], over: Partial<Household> = {}): Household => ({
  people,
  active: 0,
  spouse: true,
  adults: people.length,
  kids: 0,
  under6: 0,
  useBpa: true,
  whRate: 0,
  useCredits: true,
  homeValue: 0,
  rent: 0,
  monthlySpending: 0,
  ...over,
});
const close = (a: number, b: number, what: string) => assert.ok(Math.abs(a - b) < 1e-6, `${what}: ${a} vs ${b}`);
const creditOf = (credits: [string, number][], name: string) => credits.find(([n]) => n === name)?.[1] ?? 0;
const CWB = "Canada Workers Benefit";

test("other income pays no CPP/QPP, EI, QPIP or territorial payroll tax, in every province and year", () => {
  for (const yd of YEARS)
    for (const p of yd.provinces) {
      const alone = household(yd, p, hh([person({ oth: 80_000 })])).list[0];
      assert.deepEqual(
        alone.pay,
        { base: 0, enh: 0, ei: 0, qpip: 0, terr: 0 },
        `${yd.year} ${p.code}: other income alone`,
      );
      // Mixed with employment income, payroll is exactly what the employment income alone pays
      const mixed = household(yd, p, hh([person({ ord: 40_000, oth: 60_000 })])).list[0];
      assert.deepEqual(mixed.pay, payrollOf(yd.federal, p, blank(40_000)), `${yd.year} ${p.code}: mixed`);
    }
});

test("other income gets no Canada employment amount, no Yukon employment amount and no CPP/EI credits", () => {
  for (const yd of YEARS)
    for (const p of yd.provinces) {
      const alone = household(yd, p, hh([person({ oth: 50_000 })])).list[0];
      assert.equal(alone.empAmt, 0, `${yd.year} ${p.code}: employment amount on other income`);
      assert.equal(alone.fEmp, 0, `${yd.year} ${p.code}: federal employment and payroll credits`);
      assert.equal(alone.pEmp, 0, `${yd.year} ${p.code}: provincial employment and payroll credits`);
      // With a little employment income, the amount is that income, not employment plus other income
      const mixed = household(yd, p, hh([person({ ord: 500, oth: 50_000 })])).list[0];
      assert.equal(mixed.empAmt, 500, `${yd.year} ${p.code}: employment amount with $500 of employment income`);
    }
});

test("Quebec: no QPIP and no deduction for workers on other income", () => {
  const qc = prov("QC");
  const alone = household(y, qc, hh([person({ oth: 50_000 })])).list[0];
  assert.equal(alone.pay.qpip, 0);
  assert.equal(alone.workerDed, 0);
  assert.equal(alone.tiP, alone.ti);
  const mixed = household(y, qc, hh([person({ ord: 10_000, oth: 50_000 })])).list[0];
  const wd = qc.quebec?.workerDeduction;
  assert.ok(wd);
  close(mixed.workerDed, Math.min(wd.max, 10_000 * wd.rate), "deduction for workers on $10,000 of employment income");
});

test("Ontario: other income earns no LIFT credit, but counts for the Ontario Health Premium", () => {
  const on = prov("ON");
  // The same net income, with and without employment income in it (LIFT is non-refundable, so it needs tax to reduce)
  const other = household(y, on, hh([person({ oth: 30_000 })])).list[0];
  const work = household(y, on, hh([person({ ord: 20_000, oth: 10_000 })])).list[0];
  assert.ok(work.lift > 0, "the test needs a LIFT credit on $20,000 of employment income");
  assert.equal(other.lift, 0, "LIFT credit on other income");
  assert.ok(other.prov > 0, "the test needs Ontario tax for a LIFT credit to reduce");
  const premium = household(y, on, hh([person({ oth: 40_000 })])).list[0];
  assert.ok(premium.ohp > 0);
  assert.equal(premium.ohp, healthPremium(on, premium.ti));
  assert.equal(premium.payroll, premium.ohp, "the health premium is the only payroll on other income");
});

test("other income is not working income for the Workers Benefit or Quebec's work premium", () => {
  for (const yd of YEARS)
    for (const p of yd.provinces) {
      const at = `${yd.year} ${p.code}`;
      // Low income, all of it other income: no Workers Benefit, though the same employment income gets one
      const other = household(yd, p, hh([person({ oth: 12_000 })]));
      const work = household(yd, p, hh([person({ ord: 12_000 })]));
      assert.ok(creditOf(work.credits, CWB) > 0, `${at}: the test needs a Workers Benefit at $12,000 of employment`);
      assert.equal(creditOf(other.credits, CWB), 0, `${at}: Workers Benefit on other income`);
      if (p.system === "quebec") {
        const premium = (p.credits ?? []).find(c => c.program === "quebec-work-premium");
        assert.ok(premium);
        const name = premium.name ?? premium.program;
        assert.ok(creditOf(work.credits, name) > 0, `${at}: the test needs a work premium at $12,000`);
        assert.equal(creditOf(other.credits, name), 0, `${at}: work premium on other income`);
      }
      // A couple: one spouse's employment income in the phase-in, the other's other income. Working income and the
      // secondary earner exemption use employment income only; family net income includes the other income.
      const couple = household(yd, p, hh([person({ ord: 8_000 }), person({ oth: 25_000 })]));
      const expected = creditsOf(yd.federal, p, {
        famNet: couple.famNet,
        famEmp: 8_000,
        couple: true,
        kids: 0,
        ppl: [blank(8_000), blank(0)],
        propTax: 0,
        rent: 0,
      });
      assert.deepEqual(couple.credits, expected, `${at}: couple's credits`);
      close(couple.famNet, netOf(yd.federal, p, blank(8_000)) + 25_000, `${at}: family net income`);
    }
});

test("other income counts in family net income for child benefits, but not in working income", () => {
  for (const code of ["AB", "NB", "ON", "QC", "BC"]) {
    const p = prov(code);
    const kids = 2,
      under6 = 1;
    const h = household(y, p, hh([person({ ord: 15_000, oth: 30_000 })], { kids, under6 }));
    close(h.famNet, netOf(F, p, blank(15_000)) + 30_000, `${code}: family net income`);
    close(h.ccb, ccbOf(F, h.famNet, kids, under6), `${code}: CCB`);
    // The working components (Alberta, New Brunswick) see $15,000 of working income, not $45,000
    const benefitNet = p.system === "quebec" ? h.breakdown.incomeBases.provincialFamily : h.famNet;
    close(
      h.provBen,
      provincialChildBenefit(p.childBenefit, benefitNet, 15_000, kids, true, under6),
      `${code}: benefit`,
    );
    // And the other income claws benefits back: less CCB than with the employment income alone
    const without = household(y, p, hh([person({ ord: 15_000 })], { kids, under6 }));
    assert.ok(h.ccb < without.ccb, `${code}: other income should reduce the CCB`);
  }
});

test("other income reduces the spouse amount like any income", () => {
  const on = prov("ON");
  const h = household(y, on, hh([person({ ord: 90_000 }), person({ oth: 8_000 })]));
  assert.ok(h.claim);
  assert.equal(h.claim.c, 0);
  close(h.claim.fAmt, phased(F.basicPersonalAmount, h.list[0].ti) - 8_000, "federal spouse amount");
});

test("other income is taxed in full: net income, cash received and RRSP room", () => {
  const r = compute(y, prov("BC"), hh([person({ ord: 30_000, oth: 20_000, ded: 4_000 })]));
  const n = r.me.breakdown.netIncome;
  assert.equal(n.oth, 20_000);
  close(n.ord + n.oth + n.cg + n.ed + n.nd + n.fd - n.ded - n.enh, r.me.ti, "net income from its parts");
  assert.equal(r.cash, 50_000);
  assert.equal(r.me.cash, 50_000);
  // RRSP room is earned on employment income only
  assert.equal(r.me.breakdown.rrspRoom, Math.round(30_000 * F.rrsp.rate));
  assert.equal(compute(y, prov("BC"), hh([person({ oth: 100_000 })])).me.breakdown.rrspRoom, 0);
});

test("other income is not investment income", () => {
  const r = compute(y, prov("ON"), hh([person({ ord: 50_000, oth: 20_000 })]));
  assert.equal(r.hasInv, false);
  assert.equal(r.invAmt, 0);
  assert.equal(r.invTax, 0);
});

test("the marginal rate on other income has no payroll in it", () => {
  for (const code of ["AB", "ON", "QC", "NT"]) {
    const base = hh([person({ ord: 50_000, oth: 10_000 })]);
    const r = compute(y, prov(code), base);
    const more = compute(y, prov(code), { ...base, people: [person({ ord: 50_000, oth: 10_100 })] });
    close(r.breakdown.margOther, (more.netTotal - r.netTotal) / 100, `${code}: measured on the next $100`);
    // At $50,000 the next dollar of employment income pays CPP/QPP and EI; the next dollar of other income doesn't
    assert.ok(r.breakdown.margOther < r.margBy.ord - 0.05, `${code}: ${r.breakdown.margOther} vs ${r.margBy.ord}`);
  }
});

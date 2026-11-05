import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { scaleHousehold } from "../src/engine/history.ts";
import {
  blank,
  cashOf,
  compute,
  type Household,
  household,
  netOf,
  type Person,
  publicPensionReceipts,
  UnsupportedPublicPensionsError,
} from "../src/engine/index.ts";

interface Case {
  id: string;
  year: number;
  province: string;
  household: Omit<Partial<Household>, "people"> & { people: Partial<Person>[] };
  expected: Record<string, number>;
}
const fixture: { defaults: Omit<Household, "people">; cases: Case[] } = JSON.parse(
  fs.readFileSync(new URL("./golden/features/oas-cpp.json", import.meta.url), "utf8"),
);
const years = [loadYear(2025), loadYear(2026)];
const input = (people: Partial<Person>[], extra: Partial<Household> = {}): Household => ({
  ...fixture.defaults,
  adults: people.length,
  ...extra,
  people: people.map(p => ({ ...blank(0), ...p })),
});
const round = (n: number) => Math.round(n * 1e4) / 1e4;
const near = (actual: number, expected: number) =>
  assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
function valueAt(value: unknown, path: string): number {
  for (const key of path.split(".")) {
    assert.ok(value && typeof value === "object" && key in value, path);
    value = (value as Record<string, unknown>)[key];
  }
  assert.equal(typeof value, "number");
  return value as number;
}
for (const c of fixture.cases) {
  test(`OAS/CPP golden: ${c.id}`, () => {
    const y = years.find(y => y.year === c.year);
    assert.ok(y);
    const p = y.provinces.find(p => p.code === c.province);
    assert.ok(p);
    const r = household(y, p, input(c.household.people, c.household as Partial<Household>));
    for (const [path, expected] of Object.entries(c.expected))
      assert.equal(round(valueAt(r, path)), expected, `${c.id}: ${path}`);
  });
}

test("OAS/CPP goldens cover both years and all thirteen jurisdictions with unique cases", () => {
  assert.equal(new Set(fixture.cases.map(c => c.id)).size, fixture.cases.length);
  for (const y of years)
    assert.deepEqual(
      new Set(fixture.cases.filter(c => c.year === y.year).map(c => c.province)),
      new Set(y.provinces.map(p => p.code)),
    );
});

for (const y of years) {
  const gross = y.year === 2025 ? 8791.14 : 8999.49;
  const threshold = y.year === 2025 ? 93454 : 95323;
  test(`${y.year}: reviewer CARE reproduction adds recovery back while CCB retains the deduction`, () => {
    const p = y.provinces.find(p => p.code === "ON");
    assert.ok(p);
    const h = input([{ ord: 50000, oth: 107000 - 50000 - gross, age: 74, birthMonth: 6, oas: true }], {
      useCredits: true,
      childcare: { mode: "automatic", children: [{ age: 4, expenses: 8000 }], earnedIncome: [50000] },
    });
    const r = household(y, p, h);
    const recovery = y.year === 2025 ? 831.9 : 551.55;
    const net = 99000 - recovery;
    near(r.list[0].breakdown.publicPensions?.recoveryTax ?? -1, recovery);
    near(r.breakdown.childcareCredit?.income ?? -1, 107000);
    near(r.breakdown.childcareCredit?.applied ?? -1, 1840);
    near(r.famNet, net);
    // T4114: one child under six, second CCB taper; unlike CARE this uses post-recovery net income.
    near(r.ccb, y.year === 2025 ? 7997 - 3061 - 0.032 * (net - 81222) : 8157 - 3123 - 0.032 * (net - 82847));
    // Equivalent verified manual claim must give the same result as the automatic T778 claim.
    const manual = household(y, p, { ...h, childcare: { ...h.childcare, mode: "manual", manualClaims: [8000] } });
    near(r.netTotal, manual.netTotal);
  });

  test(`${y.year}: CARE's add-back does not leak into Quebec's Schedule C family income`, () => {
    const p = y.provinces.find(p => p.code === "QC");
    assert.ok(p);
    const r = household(
      y,
      p,
      input([{ age: 74, birthMonth: 6, oas: true, oth: threshold + 10000 - gross }], {
        useCredits: true,
        childcare: {
          mode: "manual",
          children: [{ age: 4, expenses: 8000, qcEligibleExpenses: 8000 }],
          manualClaims: [8000],
        },
      }),
    );
    near(r.breakdown.incomeBases.beforeChildcareAndRecovery[0], threshold + 10000);
    near(r.breakdown.incomeBases.beforeChildcare[0], threshold + 9700);
    near(r.breakdown.childcareCredit?.income ?? -1, threshold + 9700);
    near(r.famNet, threshold + 1700);
  });

  test(`${y.year}: every birthday month starts OAS and the higher rate in the following month`, () => {
    // Published cents, independent of loaded YAML and of the receipt algorithm.
    const low = y.year === 2025 ? [727.67, 727.67, 734.95, 740.09] : [742.31, 743.05, 751.97, 762.5];
    const high = y.year === 2025 ? [800.44, 800.44, 808.45, 814.1] : [816.54, 817.36, 827.17, 838.75];
    for (let birthMonth = 1; birthMonth <= 12; birthMonth++) {
      for (const age of [64, 65, 66, 74, 75, 76]) {
        const r = publicPensionReceipts(y.federal, { ...blank(0), oas: true, age, birthMonth });
        for (let i = 0; i < 12; i++) {
          const quarter = Math.floor(i / 3);
          const expected =
            age < 65 || (age === 65 && i < birthMonth)
              ? 0
              : age > 75 || (age === 75 && i >= birthMonth)
                ? high[quarter]
                : low[quarter];
          assert.equal(r.monthly[i], expected, `${age}/${birthMonth}, receipt ${i + 1}`);
        }
      }
    }
  });

  test(`${y.year}: recovery is additional federal liability, after all credits/abatement, with one deduction`, () => {
    for (const p of y.provinces)
      for (const income of [40000, 100000, 200000]) {
        const person = { age: 74, birthMonth: 6, oas: true, cppQpp: 12000, oth: income - gross - 12000 };
        const recovery = Math.min(gross, 0.15 * Math.max(0, income - threshold));
        const r = compute(y, p, input([person], { useCredits: true }));
        // Equal taxable income and age, encoded through existing ordinary-income mechanics.
        const control = compute(
          y,
          p,
          input([{ age: 74, birthMonth: 6, oth: income - recovery }], { useCredits: true }),
        );
        near(r.cash, income);
        near(r.famNet, income - recovery);
        near(r.fed - control.fed, recovery);
        near(r.prov, control.prov);
        near(r.benefits, control.benefits);
        near(r.total - control.total, recovery + r.breakdown.healthServicesFund - control.breakdown.healthServicesFund);
        near(r.breakdown.left, income - r.total);
        assert.equal(r.list[0].breakdown.publicPensions?.withholding, null);
        assert.equal(r.list[0].breakdown.seniorCredits.eligibleFederal, 0);
        assert.equal(r.list[0].breakdown.seniorCredits.eligibleQuebec, 0);
      }
  });

  test(`${y.year}: both adults have independent recovery caps, thresholds and receipts`, () => {
    const h = input([
      { age: 74, birthMonth: 6, oas: true, oth: threshold + 1000 - gross },
      { age: 76, birthMonth: 6, oas: true, cppQpp: 12000 },
    ]);
    for (const p of y.provinces) {
      const r = household(y, p, h);
      near(r.list[0].breakdown.publicPensions?.recoveryTax ?? -1, 150);
      assert.equal(r.list[1].breakdown.publicPensions?.recoveryTax, 0);
      assert.equal(r.list[1].breakdown.publicPensions?.oas, y.year === 2025 ? 9670.29 : 9899.46);
      near(r.famNet, r.cash - 150);
    }
  });

  test(`${y.year}: Quebec copies federal recovery after childcare without deducting childcare itself`, () => {
    const p = y.provinces.find(p => p.code === "QC");
    assert.ok(p);
    const h = input([{ age: 74, birthMonth: 6, oas: true, oth: threshold + 10000 - gross }], {
      childcare: {
        mode: "manual",
        children: [{ age: 4, expenses: 8000, qcEligibleExpenses: 0 }],
        manualClaims: [8000],
      },
    });
    const r = household(y, p, h);
    assert.equal(r.childcare.status, "complete");
    near(r.list[0].breakdown.publicPensions?.recoveryTax ?? -1, 300);
    near(r.list[0].ti, threshold + 1700);
    near(r.list[0].tiP, threshold + 9700);
    near(r.breakdown.incomeBases.beforeChildcare[0], threshold + 9700);
    near(r.breakdown.incomeBases.provincialFamily, threshold + 9700);
  });

  test(`${y.year}: dividend gross-ups, taxable gains and deductions determine recovery, not cash`, () => {
    const x = {
      ...blank(0),
      age: 74,
      birthMonth: 6,
      oas: true,
      oth: threshold - gross,
      ed: 1000,
      nd: 1000,
      cg: 1000,
      fd: 1000,
      ded: 100,
      rrsp: 200,
      fhsa: 300,
    };
    const p = y.provinces.find(p => p.code === "ON");
    assert.ok(p);
    const r = household(y, p, input([x]));
    // 1380 + 1150 + 500 + 1000 - 100 - 200 - 300 = 3430 above threshold.
    near(r.list[0].breakdown.publicPensions?.recoveryTax ?? -1, 514.5);
    near(r.famNet, threshold + 3430 - 514.5);
    near(r.cash, threshold + 4000);
  });

  test(`${y.year}: CPP/QPP is entered once, carries no employment/pension credit or contribution`, () => {
    for (const p of y.provinces) {
      const r = compute(y, p, input([{ cppQpp: 30000 }]));
      const old = compute(y, p, input([{ oth: 30000 }]));
      for (const key of ["cash", "fed", "prov", "total", "famNet", "payroll", "benefits"] as const)
        assert.equal(r[key], old[key], `${p.code}: ${key}`);
      assert.equal(r.list[0].empAmt, 0);
      assert.equal(r.list[0].breakdown.rrspRoom, 0);
      assert.equal(r.list[0].pay.base, 0);
      assert.equal(r.list[0].pay.enh, 0);
      assert.equal(r.list[0].breakdown.seniorCredits.federalPension, 0);
    }
    const h = input([{ age: 74, birthMonth: 6, oas: true, cppQpp: 12000 }]);
    const scaled = scaleHousehold(h, 2);
    assert.equal(scaled.people[0].cppQpp, 24000);
    assert.equal(scaled.people[0].oas, true);
    assert.equal(publicPensionReceipts(y.federal, scaled.people[0]).oas, gross);
    assert.throws(() => cashOf(h.people[0]), /federal data/);
    assert.equal(cashOf(h.people[0], y.federal), gross + 12000);
  });

  test(`${y.year}: benefit income does not elect to stop payroll and payroll deductions precede recovery`, () => {
    for (const p of y.provinces) {
      const x = { ...blank(50000), age: 66, birthMonth: 6, cppQpp: 12000, oas: true, oth: 50000 };
      const r = household(y, p, input([x]));
      const control = household(y, p, input([{ ...x, cppQpp: undefined, oas: undefined }]));
      assert.deepEqual(r.list[0].pay, control.list[0].pay);
      // Both plans' employee enhancement is 1% of (50,000 - 3,500); no second-tier earnings.
      near(r.list[0].pay.enh, 465);
      near(r.list[0].breakdown.publicPensions?.recoveryTax ?? -1, 0.15 * (112000 + gross - 465 - threshold));
    }
  });
}

test("public pension validation and unsupported historical coverage never silently drop income", () => {
  const y = years[0];
  const old = loadYear(2024);
  for (const x of [{ cppQpp: 1 }, { cppQpp: 0 }, { oas: true }, { oas: false }])
    assert.throws(() => netOf(old.federal, old.provinces[0], { ...blank(0), ...x }), UnsupportedPublicPensionsError);
  for (const cppQpp of [-1, NaN, Infinity])
    assert.throws(() => netOf(y.federal, y.provinces[0], { ...blank(0), cppQpp }), RangeError);
  for (const extra of [
    {},
    { age: 74 },
    { age: 74, birthMonth: 0 },
    { age: 74, birthMonth: 13 },
    { age: 74.5, birthMonth: 1 },
    { age: -1, birthMonth: 1 },
  ])
    assert.throws(() => publicPensionReceipts(y.federal, { ...blank(0), oas: true, ...extra }), RangeError);
  assert.throws(() => publicPensionReceipts(y.federal, { ...blank(0), oas: "yes" } as unknown as Person), RangeError);
});

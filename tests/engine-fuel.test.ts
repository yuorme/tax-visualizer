// Unit tests for fuel tax on gasoline (#6): litres from distance and efficiency, rates that change during the year
// weighted by days, the regional transit taxes, how fuel tax enters the totals, a year without fuel data, the
// all-or-nothing data rule, and the notes and tooltips that describe it.
import assert from "node:assert/strict";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { type FuelRate, yearSchema } from "../src/data/schema.ts";
import {
  blank,
  compute,
  type Driving,
  fuelTaxOf,
  type Household,
  ratePeriods,
  yearAverage,
} from "../src/engine/index.ts";
import { DEFAULT_INCOME, spendEst } from "../src/ui/defaults.ts";
import { footerNotes, tooltips } from "../src/ui/notes.ts";

const y = loadYear(2026);
const prov = (code: string, data = y) => {
  const p = data.provinces.find(q => q.code === code);
  if (!p) throw new Error(`no ${code}`);
  return p;
};
const hh = (over: Partial<Household> = {}): Household => ({
  people: [blank(60_000)],
  active: 0,
  spouse: true,
  adults: 1,
  kids: 0,
  under6: 0,
  useBpa: true,
  whRate: 0.15,
  useCredits: true,
  homeValue: 0,
  rent: 0,
  monthlySpending: 2_000,
  ...over,
});
const drive: Driving = { km: 20_000, lPer100km: 8 }; // 1,600 litres
const close = (a: number, b: number, what = "") => assert.ok(Math.abs(a - b) < 1e-9, `${what} ${a} vs ${b}`);

test("a rate that changes during the year counts each rate for the days it applied", () => {
  const r: FuelRate = [
    { from: "2026-01-01", rate: 0.1 },
    { from: "2026-04-20", rate: 0 },
  ];
  // January 1 to April 19 is 109 days of 365: not half the year (one per rate) and not 3.5 of 12 months
  close(yearAverage(r, 2026), (0.1 * 109) / 365);
  assert.deepEqual(
    ratePeriods(r, 2026).map(p => [p.from, p.to]),
    [
      ["2026-01-01", "2026-04-20"],
      ["2026-04-20", "2027-01-01"],
    ],
  );
  close(yearAverage(0.15, 2026), 0.15, "a rate that held all year");
  // A leap year has 366 days: January and February are 60 of them
  close(
    yearAverage(
      [
        { from: "2028-01-01", rate: 0.2 },
        { from: "2028-03-01", rate: 0.1 },
      ],
      2028,
    ),
    (0.2 * 60 + 0.1 * 306) / 366,
  );
});

test("litres are distance × efficiency ÷ 100, taxed at the federal, provincial and regional rates", () => {
  const fed = yearAverage(y.federal.fuelTax?.gasoline ?? 0, 2026);
  const on = fuelTaxOf(y, prov("ON"), drive);
  assert.ok(on);
  assert.equal(on.litres, 1_600);
  close(on.perLitre.total, fed + 0.09);
  assert.equal(on.regional, 0);
  assert.equal(on.regionalName, null);
  close(on.total, 1_600 * (fed + 0.09));
  // Vancouver adds TransLink and Montreal the ARTM tax, on top of the provincial rate
  const bc = fuelTaxOf(y, prov("BC"), drive);
  assert.ok(bc);
  assert.equal(bc.regionalName, "TransLink");
  close(bc.regional, 1_600 * 0.185);
  close(bc.total, bc.federal + bc.provincial + bc.regional);
  close(bc.provincial, 1_600 * 0.085);
  const qc = fuelTaxOf(y, prov("QC"), drive);
  assert.ok(qc);
  assert.equal(qc.regionalName, "ARTM");
  close(qc.perLitre.total, fed + 0.192 + 0.03);
});

test("0 km or 0 L/100 km means no fuel tax; no driving entered means no litres", () => {
  for (const d of [{ km: 0, lPer100km: 9 }, { km: 15_000, lPer100km: 0 }, undefined]) {
    const f = fuelTaxOf(y, prov("SK"), d);
    assert.ok(f);
    assert.equal(f.litres, 0);
    assert.equal(f.total, 0);
  }
});

test("fuel tax adds to gross and net tax exactly, and nothing else changes", () => {
  for (const p of y.provinces) {
    const without = compute(y, p, hh());
    const withFuel = compute(y, p, hh({ driving: drive }));
    const fuel = withFuel.fuel?.total ?? Number.NaN;
    assert.ok(fuel > 0, p.code);
    close(withFuel.gross - without.gross, fuel, `${p.code} gross`);
    close(withFuel.total - without.total, fuel, `${p.code} total`);
    for (const k of ["fed", "prov", "payroll", "sales", "property", "benefits", "marg"] as const)
      assert.equal(withFuel[k], without[k], `${p.code} ${k}`);
  }
});

test("GST/HST on gasoline isn't added to fuel tax: it's in the sales tax on spending", () => {
  const p = prov("NS"); // 15% HST
  const a = compute(y, p, hh({ driving: drive, monthlySpending: 0 }));
  const b = compute(y, p, hh({ driving: drive, monthlySpending: 3_000 }));
  assert.equal(a.fuel?.total, b.fuel?.total);
  close(a.fuel?.total ?? 0, 1_600 * (a.fuel?.perLitre.total ?? 0));
});

test("fuel tax follows the driving entered, not the size of the household", () => {
  const one = compute(y, prov("MB"), hh({ driving: drive }));
  const big = compute(
    y,
    prov("MB"),
    hh({ driving: drive, people: [blank(60_000), blank(40_000)], adults: 4, kids: 3, under6: 1 }),
  );
  assert.equal(one.fuel?.total, big.fuel?.total);
});

test("a year without fuel data has no fuel tax, whatever the driving", () => {
  const y25 = loadYear(2025);
  // Keep the original missing-fuel rule specimen explicit as real 2025 data activates fuel and carbon.
  delete y25.federal.fuelTax;
  for (const p of y25.provinces) {
    delete p.carbon;
    delete p.fuelTax;
  }
  assert.equal(y25.federal.fuelTax, undefined);
  const p = prov("ON", y25);
  const a = compute(y25, p, hh());
  const b = compute(y25, p, hh({ driving: drive }));
  assert.equal(b.fuel, null);
  assert.equal(b.gross, a.gross);
  assert.equal(b.total, a.total);
});

test("fuel data is all or nothing, and mid-year rate changes stay inside the year", () => {
  const ok = structuredClone(y);
  assert.ok(yearSchema.safeParse(ok).success);
  const missing = structuredClone(y);
  delete missing.provinces[3].fuelTax;
  assert.ok(!yearSchema.safeParse(missing).success, "one province without fuel tax");
  const noDefaults = structuredClone(y);
  delete noDefaults.federal.driving;
  assert.ok(!yearSchema.safeParse(noDefaults).success, "no national efficiency");
  const none = structuredClone(y);
  delete none.federal.fuelTax;
  delete none.federal.driving;
  for (const p of none.provinces) {
    delete p.fuelTax;
    delete p.driving;
  }
  assert.ok(yearSchema.safeParse(none).success, "no fuel data at all");
  const late = structuredClone(y);
  late.federal.fuelTax = {
    gasoline: [
      { from: "2026-02-01", rate: 0.1 },
      { from: "2026-04-20", rate: 0 },
    ],
  };
  assert.ok(!yearSchema.safeParse(late).success, "first rate after January 1");
  const nextYear = structuredClone(y);
  nextYear.federal.fuelTax = {
    gasoline: [
      { from: "2026-01-01", rate: 0 },
      { from: "2027-02-01", rate: 0.05 },
    ],
  };
  assert.ok(!yearSchema.safeParse(nextYear).success, "a change in another year");
  const notADate = structuredClone(y);
  notADate.federal.fuelTax = {
    gasoline: [
      { from: "2026-01-01", rate: 0.1 },
      { from: "2026-02-30", rate: 0 },
    ],
  };
  assert.ok(!yearSchema.safeParse(notADate).success, "not a real date");
});

const page = { defaultIncome: DEFAULT_INCOME, spendEst };

test("2026 notes describe the fuel taxes, their mid-year changes and the starting values", () => {
  const notes = footerNotes(y, page);
  for (const s of [
    "<b>Fuel tax.</b>",
    "TransLink in Vancouver (18.5¢) and ARTM in Montreal (3¢)",
    "federal 10¢, 0¢ from April 20 (suspended to January 31, 2027)",
    "Alberta 13¢, 0¢ from October 1",
    "PEI 8.47¢, 0¢ from September 26",
    "Newfoundland and Labrador 7.5¢, 0¢ from December 1 (announced October 26, 2026, legislation pending)",
    "British Columbia 8.5¢ (Vancouver area)",
    "for a 2026 average of federal 2.99¢, Alberta 9.72¢, PEI 6.22¢ and Newfoundland and Labrador 6.86¢",
    "GST, HST and QST on gasoline are part of taxable spending",
    "from 6,800 km in Nunavut to 17,400 km in Nova Scotia",
    "9.0 L/100 km",
    "taxes on diesel and heating fuel, other excise taxes and corporate taxes",
  ])
    assert.ok(notes.includes(s), `missing: ${s}`);
  const tips = tooltips(y);
  assert.match(tips.fuel, /GST\/HST \(and QST in Quebec\) on gasoline isn't added here/);
  assert.match(tips.spending, /Include gasoline: its GST\/HST \(and QST in Quebec\) is counted here/);
  assert.match(tips.distance, /2009 Canadian Vehicle Survey/);
  assert.match(tips.efficiency, /starts at 9\.0/);
});

test("2025 notes have no fuel paragraph and still list fuel taxes as not included", () => {
  const y25 = loadYear(2025);
  // Preserve the original absence-of-fuel notes specimen; real 2025 fuel has separate coverage.
  delete y25.federal.fuelTax;
  for (const p of y25.provinces) {
    delete p.carbon;
    delete p.fuelTax;
  }
  const notes = footerNotes(y25, page);
  assert.ok(!notes.includes("<b>Fuel tax.</b>"));
  assert.ok(notes.includes("fuel, excise and corporate taxes"));
  const tips = tooltips(y25);
  assert.match(tips.fuel, /aren't in the 2025 data yet/);
  assert.ok(!tips.spending.includes("gasoline"));
});

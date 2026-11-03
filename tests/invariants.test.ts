// Invariant (property-style) tests: rules that must hold for every year in data/years/, every province and
// territory, and any household. Golden tests freeze today's numbers; these check the shape of the results, so they
// catch whole classes of engine and data mistakes (a sign error, a credit that can go negative, a phase-out that
// runs the wrong way) in years and households no golden scenario covers.
//
// Households come from a seeded generator, so a failure is reproducible: every message names the year, the
// province and the household as JSON, which can be passed straight to household() or compute().
import assert from "node:assert/strict";
import test from "node:test";
import { listYears, loadYear } from "../src/data/load.ts";
import {
  blank,
  compute,
  type Household,
  household,
  type Person,
  type Province,
  payrollOf,
  type YearData,
} from "../src/engine/index.ts";

const YEARS = listYears().map(loadYear);
const EPS = 1e-6; // floating-point slack, in dollars

// ---- Seeded household generator -------------------------------------------------------------------------------

type Rng = () => number;

/** mulberry32: a small seeded PRNG, so every run draws the same households. */
function rng(seed: number): Rng {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const int = (r: Rng, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
const pick = <T>(r: Rng, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)];
/** A dollar amount: zero with probability `zero`, otherwise log-uniform between $500 and `max`. */
const amount = (r: Rng, max: number, zero = 0.2) => (r() < zero ? 0 : Math.round(500 * (max / 500) ** r()));

function randomPerson(r: Rng): Person {
  const ord = amount(r, 500_000, 0.1);
  const inv = r() < 0.3;
  return {
    ord,
    cg: inv ? (r() < 0.15 ? -amount(r, 50_000, 0) : amount(r, 200_000, 0.4)) : 0,
    ed: inv ? amount(r, 150_000, 0.5) : 0,
    nd: inv ? amount(r, 100_000, 0.6) : 0,
    fd: inv ? amount(r, 50_000, 0.6) : 0,
    ded: r() < 0.25 ? Math.round(r() * 0.18 * ord) : 0,
  };
}

interface Shape {
  two?: boolean; // two people with income (otherwise one)
  spouse?: boolean; // the two are spouses (otherwise drawn)
  kids?: boolean; // at least one child (otherwise drawn)
}

function randomHousehold(r: Rng, shape: Shape = {}): Household {
  const two = shape.two ?? r() < 0.45;
  const people = two ? [randomPerson(r), randomPerson(r)] : [randomPerson(r)];
  const kids = shape.kids === undefined ? (r() < 0.5 ? 0 : int(r, 1, 6)) : shape.kids ? int(r, 1, 6) : 0;
  const owner = r() < 0.4;
  return {
    people,
    active: two ? int(r, 0, 1) : 0,
    spouse: shape.spouse ?? (two ? r() < 0.8 : r() < 0.5),
    adults: two ? int(r, 2, 4) : r() < 0.75 ? 1 : int(r, 2, 4),
    kids,
    under6: int(r, 0, kids),
    useBpa: r() < 0.9,
    whRate: pick(r, [0, 0.15, 0.3]),
    useCredits: r() < 0.85,
    homeValue: owner ? amount(r, 2_500_000, 0) : 0,
    rent: owner ? 0 : pick(r, [0, 700, 1500, 3000]),
    monthlySpending: int(r, 0, 100) * 100,
  };
}

/** Run `check` for every year × province × `n` households drawn from `seed`. The same households go to every
 *  province, so a difference between provinces is the province's rules, not the draw. */
function forAll(seed: number, n: number, shape: Shape, check: (y: YearData, p: Province, hh: Household) => void) {
  const r = rng(seed);
  const households = Array.from({ length: n }, () => randomHousehold(r, shape));
  for (const y of YEARS) for (const p of y.provinces) for (const hh of households) check(y, p, hh);
}

const where = (y: YearData, p: Province, hh: Household) => `${y.year} ${p.code}, household ${JSON.stringify(hh)}`;

// ---- What the engine returns, grouped -------------------------------------------------------------------------

type H = ReturnType<typeof household>;
const incomeTax = (h: H) => h.fed + h.prov + h.wh;

/** Every benefit and refundable credit line, keyed by program: "canada-child-benefit", the province's child
 *  benefit program, the federal "groceries-benefit" and "canada-workers-benefit", and each provincial credit's
 *  program id. A line the engine drops (under 50 cents) is absent; read it as 0. */
function benefitLines(p: Province, h: H): Map<string, number> {
  const lines = new Map<string, number>([["canada-child-benefit", h.ccb]]);
  if (p.childBenefit) lines.set(p.childBenefit.program, h.provBen);
  for (const [name, value] of h.credits) lines.set(creditProgram(p, name), value);
  return lines;
}
function creditProgram(p: Province, name: string): string {
  for (const cr of p.credits ?? [])
    if (name === (cr.name ?? cr.program) || ("nameRenter" in cr && name === cr.nameRenter)) return cr.program;
  if (name === "Canada Workers Benefit") return "canada-workers-benefit";
  return "groceries-benefit"; // the federal sales tax credit, whose name changes with the year's data
}
const lineOf = (lines: Map<string, number>, key: string) => lines.get(key) ?? 0;
const keysOf = (...maps: Map<string, number>[]) => new Set(maps.flatMap(m => [...m.keys()]));

/** Program ids of the benefit lines a year can produce in province p. */
function programsIn(p: Province): Set<string> {
  const ids = ["canada-child-benefit", "groceries-benefit", "canada-workers-benefit"];
  if (p.childBenefit) ids.push(p.childBenefit.program);
  for (const cr of p.credits ?? []) ids.push(cr.program);
  return new Set(ids);
}

// ---- Employment income sweeps ---------------------------------------------------------------------------------

const SWEEP_STEP = 500;
const SWEEP_MAX = 250_000;

/** The other earner's income in the two-person sweep bases, in turn: none, low, middle and high, so the active
 *  person's income crosses theirs and the spouse amount, claimant and family income all come into play. */
const OTHER_EARNER = [0, 30_000, 70_000, 150_000];

/** Base households for the income sweeps: the shapes that matter for phase-ins and clawbacks (a single person,
 *  a single parent, a couple with or without children), with every other input drawn at random. Investment
 *  income is dropped so the sweep isolates employment income. */
function sweepBases(seed: number): Household[] {
  const r = rng(seed);
  let pairs = 0;
  const shapes: Shape[] = [
    { two: false, kids: false },
    { two: false, kids: true },
    { two: false, kids: true },
    { two: true, spouse: true, kids: false },
    { two: true, spouse: true, kids: true },
    { two: true, spouse: true, kids: true },
    { two: true, spouse: false, kids: true },
  ];
  return shapes.flatMap(shape =>
    [0, 1].map(() => {
      const hh = randomHousehold(r, shape);
      hh.people = hh.people.map(x => ({ ...blank(x.ord), ded: x.ded }));
      hh.useCredits = true; // the credits are what the sweeps examine
      if (!shape.two) hh.adults = 1;
      if (shape.two) hh.people[1 - hh.active].ord = OTHER_EARNER[pairs++ % OTHER_EARNER.length];
      return hh;
    }),
  );
}

const BASES = sweepBases(1);

/** One step of a sweep: the household before and after the active person's raise, and both results. */
interface Step {
  y: YearData;
  p: Province;
  from: Household;
  to: Household;
  a: H;
  b: H;
}
const describe = (s: Step) => `${where(s.y, s.p, s.from)} → active person's income ${s.to.people[s.to.active].ord}`;

/** What one sweep of every province found for a year. */
interface Findings {
  taxFell: string[]; // income tax fell as income rose
  grossFell: string[]; // income tax plus payroll fell
  rising: Map<string, Map<string, string>>; // province → benefit program seen rising with income → an example
  cliffs: Map<string, Set<string>>; // province → cliff programs seen cutting disposable income
  stacked: Step[]; // disposable income fell with no cliff: clawbacks stacked past 100%
}

/** Walk the active person's employment income from 0 to SWEEP_MAX in SWEEP_STEP steps, for every base household
 *  in every province, and note each step where a result moves the wrong way. One walk serves several tests. */
function sweepYear(y: YearData): Findings {
  const out: Findings = { taxFell: [], grossFell: [], rising: new Map(), cliffs: new Map(), stacked: [] };
  for (const p of y.provinces) {
    const rising = new Map<string, string>(),
      cliffs = new Set<string>();
    out.rising.set(p.code, rising);
    out.cliffs.set(p.code, cliffs);
    for (const base of BASES) {
      let from: Household | null = null,
        a: H | null = null;
      for (let ord = 0; ord <= SWEEP_MAX; ord += SWEEP_STEP) {
        const to = {
          ...base,
          people: base.people.map((x, i) => (i === base.active ? { ...x, ord, ded: Math.min(x.ded, ord) } : x)),
        };
        const b = household(y, p, to);
        if (from && a) {
          const s: Step = { y, p, from, to, a, b };
          if (incomeTax(b) < incomeTax(a) - EPS) out.taxFell.push(describe(s));
          if (b.total < a.total - EPS) out.grossFell.push(describe(s));
          const la = benefitLines(p, a),
            lb = benefitLines(p, b);
          let cliff = "";
          for (const key of keysOf(la, lb)) {
            const d = lineOf(la, key) - lineOf(lb, key);
            if (d < -EPS && !rising.has(key)) rising.set(key, describe(s));
            if (d > EPS && CLIFFS.has(key)) cliff = key; // a step benefit only falls at a step
          }
          // Disposable income (cash less net tax) fell: the extra income cost more than it paid
          if (b.cash - b.netTotal < a.cash - a.netTotal - EPS) {
            if (cliff) cliffs.add(cliff);
            else out.stacked.push(s);
          }
        }
        from = to;
        a = b;
      }
    }
  }
  return out;
}

const findings = new Map<number, Findings>();
function findingsFor(y: YearData): Findings {
  const f = findings.get(y.year) ?? sweepYear(y);
  findings.set(y.year, f);
  return f;
}

/** Benefits that grow with earned income over part of their range (a phase-in), so net tax after benefits falls
 *  there as income rises. Every other benefit only stays level or shrinks as income rises. */
const PHASE_IN = new Set([
  "groceries-benefit", // the single supplement phases in above a floor
  "canada-workers-benefit",
  "quebec-work-premium",
  "alberta-child-family-benefit", // the working component
  "alberta-child-family-benefit-by-child", // same statutory working phase-in
  "nb-child-tax-benefit", // the working income supplement
  "nl-income-supplement", // the extra amount above a floor
  "pei-sales-tax-credit", // the supplement above a floor
]);

/** Benefits that end in a step rather than a taper, so one more dollar of income can cost a family hundreds. */
const CLIFFS = new Set(["nova-scotia-child-benefit", "income-band-per-child"]);

/** A known place where a raise lowers disposable income without a cliff, pinned to a province, a household shape
 *  and a range of net income (and to a year, for an exception tied to one year's data). */
interface Stacked {
  code: string;
  year?: number;
  why: string;
  applies: (s: Step) => boolean;
}
const singleParent = (hh: Household, minKids: number) =>
  hh.people.length === 1 && hh.adults === 1 && hh.kids >= minKids;
/** The step's family net income lies within [lo, hi]. */
const netWithin = (s: Step, lo: number, hi: number) => s.a.famNet >= lo && s.b.famNet <= hi;
/** The step's net income overlaps one of the Ontario Health Premium's steepest bands, as the year's data sets them. */
function inSteepestOhpBand(s: Step): boolean {
  const bands = s.p.payroll?.healthPremium ?? [];
  const top = Math.max(0, ...bands.map(([, , rate]) => rate));
  return bands.some(
    ([from, base, rate, cap]) => rate === top && s.a.famNet < from + (cap - base) / rate && s.b.famNet > from,
  );
}

/** Where smooth clawbacks stack past 100%, so a raise lowers disposable income. Every entry must still be seen. */
const STACKED: Stacked[] = [
  {
    code: "NL",
    year: 2023,
    // CRA GST calculation sheet (2022 base year), T4114-23, Schedule 6, RC4210-23 and NL428-23;
    // cached under docs/verification/2023/sources. The provincial child benefit is zero in this interval.
    why:
      "a single parent with 4+ children at the 2023 GST/HST clawback onset ($42,335 net income), below the " +
      "generic NL exception's $45,000 bound. CCB 23%, CWB 15%, GST 5%, NL supplement 9% and NL tax reduction " +
      "16%, plus income tax/payroll, yield a 102.54554% fully overlapping marginal burden. A $500 sweep " +
      "step can straddle the onset",
    applies: s =>
      singleParent(s.to, 4) &&
      s.a.famNet < 45_000 &&
      s.b.famNet > 42_335 &&
      netWithin(s, 42_335 - SWEEP_STEP, 45_000 + SWEEP_STEP),
  },
  {
    code: "ON",
    why:
      "a single parent with 3+ children in an Ontario Health Premium band charged at 25%, on top of the Canada " +
      "Child Benefit, Ontario Child Benefit, Canada Workers Benefit and sales tax credit clawbacks: up to about 110%",
    applies: s => singleParent(s.to, 3) && inSteepestOhpBand(s),
  },
  {
    code: "NL",
    why:
      "a single parent with 4+ children at $45,000 to $50,000 of net income: the Canada Child Benefit, Canada " +
      "Workers Benefit, sales tax credit, NL income supplement and NL low-income reduction clawbacks plus tax and " +
      "payroll come to about 102%",
    applies: s => singleParent(s.to, 4) && netWithin(s, 45_000, 50_000),
  },
  {
    code: "NL",
    year: 2025,
    why:
      "#77: a single parent with 5 children at $37,000 to $38,500 of net income, about 109%. The NL Child Benefit " +
      "falls by about 50 cents a dollar here under the estimated straight-line taper in data/years/2025 (without " +
      "it the rate is about 59%). Not excused as a rule: when #77 corrects the taper this entry stops matching, " +
      "and the test says to remove it",
    applies: s => singleParent(s.to, 5) && netWithin(s, 37_000, 38_500),
  },
  {
    code: "NL",
    year: 2024,
    // CRA GST calculation sheet (2023 base year), T4114-24, 5000-S6-24, RC4210-24 and NL428-24;
    // all cached under docs/verification/2024/sources. Keep the existing other-year exceptions unchanged.
    why:
      "a single parent with 4+ children at the onset of the 2024 GST/HST clawback ($44,324 net income), below " +
      "the generic NL exception's $45,000 bound. Published CCB (23%), CWB (15%), GST (5%), NL supplement (9%) " +
      "and NL low-income reduction (16%) clawbacks plus tax/payroll yield 102.56843% once fully overlapping. " +
      "A $500 sweep step can straddle that onset; the provincial child benefit is already zero here",
    applies: s =>
      singleParent(s.to, 4) &&
      s.a.famNet < 45_000 &&
      s.b.famNet > 44_324 &&
      netWithin(s, 44_324 - SWEEP_STEP, 45_000 + SWEEP_STEP),
  },
];
const stackedFor = (s: Step) =>
  STACKED.find(k => k.code === s.p.code && (k.year === undefined || k.year === s.y.year) && k.applies(s));

for (const y of YEARS) {
  test(`${y.year}: more employment income never lowers income tax, nor income tax plus payroll`, () => {
    const f = findingsFor(y);
    assert.deepEqual(f.taxFell.slice(0, 3), [], "income tax fell as income rose");
    assert.deepEqual(f.grossFell.slice(0, 3), [], "income tax plus payroll fell as income rose");
  });

  test(`${y.year}: net tax after benefits falls with more income only where a benefit phases in`, () => {
    const f = findingsFor(y);
    for (const p of y.provinces) {
      const rising = f.rising.get(p.code) ?? new Map<string, string>();
      for (const [key, step] of rising) assert.ok(PHASE_IN.has(key), `${key} rose with income: ${step}`);
      // The list stays exact per province: each phase-in program the province has is seen phasing in there.
      const expected = [...PHASE_IN].filter(k => programsIn(p).has(k)).sort();
      assert.deepEqual([...rising.keys()].sort(), expected, `${y.year} ${p.code}: programs seen phasing in`);
    }
  });

  test(`${y.year}: a raise lowers disposable income only at a benefit cliff or where clawbacks stack`, () => {
    const f = findingsFor(y);
    for (const s of f.stacked) assert.ok(stackedFor(s), `${s.p.code}: a raise cost more than it paid: ${describe(s)}`);
    for (const p of y.provinces) {
      const expected = [...CLIFFS].filter(k => programsIn(p).has(k)).sort();
      assert.deepEqual([...(f.cliffs.get(p.code) ?? [])].sort(), expected, `${y.year} ${p.code}: cliffs seen`);
    }
  });
}

test("every known stacked-clawback exception is still seen", () => {
  const seen = new Set(YEARS.flatMap(y => findingsFor(y).stacked.map(stackedFor)));
  for (const k of STACKED)
    assert.ok(seen.has(k), `${k.code}${k.year ? ` ${k.year}` : ""} no longer stacks (${k.why}): remove the entry`);
});

// ---- Rates, signs and caps ------------------------------------------------------------------------------------

/** Highest combined federal and provincial rate on the next dollar of ordinary income: the top bracket rates, the
 *  Quebec abatement, and any surtax charged on top of provincial tax. */
function topCombinedRate(y: YearData, p: Province): number {
  const k = p.system === "quebec" ? 1 - y.federal.quebecAbatement : 1;
  const top = (b: [number, number][]) => Math.max(...b.map(([, r]) => r));
  const surtax = (p.surtax ?? []).reduce((a, [, r]) => a + r, 0) + (p.postDividendSurtax?.params.rate ?? 0);
  return top(y.federal.brackets) * k + top(p.brackets) * (1 + surtax);
}
/** Income received, counting a capital loss as nothing: it can't offset other income. */
const received = (hh: Household) => hh.people.reduce((a, x) => a + x.ord + Math.max(0, x.cg) + x.ed + x.nd + x.fd, 0);

test("the effective income tax rate is below the top combined marginal rate", () => {
  forAll(2, 300, {}, (y, p, hh) => {
    const base = received(hh);
    if (base === 0) return;
    const rate = incomeTax(household(y, p, hh)) / base;
    assert.ok(rate < topCombinedRate(y, p), `effective rate ${rate} ≥ top rate: ${where(y, p, hh)}`);
  });
});

/** The most an employee can pay of each capped payroll contribution: the published maximums, from the data. */
function payrollCaps(y: YearData, p: Province) {
  const pay = y.federal.payroll,
    qc = p.system === "quebec",
    plan = qc ? pay.qpp : pay.cpp;
  return {
    base: (plan.ympe - plan.exempt) * plan.base,
    enh: (plan.ympe - plan.exempt) * plan.enh1 + (plan.yampe - plan.ympe) * plan.enh2,
    ei: pay.ei.maxInsurable * (qc ? pay.ei.quebecRate : pay.ei.rate),
    qpip: qc ? pay.qpip.maxInsurable * pay.qpip.rate : 0,
    ohp: Math.max(0, ...(p.payroll?.healthPremium ?? []).map(band => band[3])),
  };
}

/** Each credit, reduction and benefit line in a result, by name. */
function signedLines(p: Province, h: H): [string, number][] {
  const lines: [string, number][] = [...benefitLines(p, h)];
  h.list.forEach((r, i) => {
    const per = { fed: r.fed, prov: r.prov, wh: r.wh, fCred: r.fCred, pCred: r.pCred, fSp: r.fSp, pSp: r.pSp };
    const more = { fEmp: r.fEmp, pEmp: r.pEmp, pKid: r.pKid, fDtc: r.fDtc, pDtc: r.pDtc, lowRed: r.lowRed };
    const rest = { surtax: r.surtax, onRed: r.onRed, lift: r.lift, bcRed: r.bcRed, fFtc: r.fFtc, pFtc: r.pFtc };
    for (const [k, v] of Object.entries({ ...per, ...more, ...rest, ...r.pay, ohp: r.ohp }))
      lines.push([`${k}[${i}]`, v]);
  });
  return lines;
}

test("every tax, credit, benefit and payroll line is ≥ 0, and capped payroll stays within its maximum", () => {
  forAll(3, 300, {}, (y, p, hh) => {
    const h = household(y, p, hh);
    for (const [name, v] of signedLines(p, h)) assert.ok(v >= -EPS, `${name} = ${v} < 0: ${where(y, p, hh)}`);
    const caps = payrollCaps(y, p);
    for (const r of h.list) {
      for (const k of ["base", "enh", "ei", "qpip"] as const)
        assert.ok(r.pay[k] <= caps[k] + EPS, `${k} ${r.pay[k]} over its cap ${caps[k]}: ${where(y, p, hh)}`);
      assert.ok(r.ohp <= caps.ohp + EPS, `health premium ${r.ohp} over its cap: ${where(y, p, hh)}`);
    }
  });
  // A very high earner pays exactly the maximum of each
  for (const y of YEARS)
    for (const p of y.provinces) {
      const caps = payrollCaps(y, p),
        pay = payrollOf(y.federal, p, blank(10_000_000));
      for (const k of ["base", "enh", "ei", "qpip"] as const)
        assert.ok(Math.abs(pay[k] - caps[k]) < EPS, `${y.year} ${p.code}: top earner's ${k} ${pay[k]} ≠ ${caps[k]}`);
    }
});

// ---- Household structure ---------------------------------------------------------------------------------------

test("a single person's results don't depend on partner-only fields", () => {
  forAll(4, 200, { two: false }, (y, p, hh) => {
    const single = { ...hh, adults: 1 };
    const expected = compute(y, p, { ...single, spouse: false });
    assert.deepStrictEqual(compute(y, p, { ...single, spouse: true }), expected, `spouse flag: ${where(y, p, single)}`);
  });
});

test("a second adult with no income entered is the same as a partner entered with zero income", () => {
  forAll(5, 200, { two: false }, (y, p, hh) => {
    const shared = { ...hh, active: 0, adults: Math.max(2, hh.adults) };
    const entered = { ...shared, people: [hh.people[0], blank(0)] };
    assert.deepStrictEqual(household(y, p, entered), household(y, p, shared), where(y, p, shared));
  });
});

const close = (a: number, b: number) => Math.abs(a - b) <= EPS * Math.max(1, Math.abs(a), Math.abs(b));

test("swapping two spouses' incomes leaves the household's totals unchanged", () => {
  forAll(6, 300, { two: true, spouse: true }, (y, p, hh) => {
    const swapped = { ...hh, people: [hh.people[1], hh.people[0]], active: 1 - hh.active };
    const a = compute(y, p, hh),
      b = compute(y, p, swapped);
    for (const k of ["fed", "prov", "wh", "payroll", "ccb", "provBen", "refund", "netTotal", "total"] as const)
      assert.ok(close(a[k], b[k]), `${k}: ${a[k]} vs ${b[k]} swapped: ${where(y, p, hh)}`);
    for (const k of ["ord", "cg", "ed", "nd", "fd"] as const)
      assert.ok(close(a.margBy[k], b.margBy[k]), `marginal rate on ${k} for the same person: ${where(y, p, hh)}`);
  });
});

test("swapping two unrelated adults leaves income tax and payroll unchanged (benefits: known exception #74)", () => {
  let benefitsDiffer = 0;
  forAll(9, 300, { two: true, spouse: false }, (y, p, hh) => {
    const swapped = { ...hh, people: [hh.people[1], hh.people[0]], active: 1 - hh.active };
    const a = household(y, p, hh),
      b = household(y, p, swapped);
    for (const k of ["fed", "prov", "wh", "payroll"] as const)
      assert.ok(close(a[k], b[k]), `${k}: ${a[k]} vs ${b[k]} swapped: ${where(y, p, hh)}`);
    // Known exception, #74: benefits and refundable credits use only the first person's income, so the gap is
    // exactly the first person's benefits less the second's, each worked out with the other adult at $0.
    // When #74 is fixed these fail: add "ccb", "provBen" and "refund" to the keys above and delete this part.
    const firstOnly = (x: Person) => household(y, p, { ...hh, people: [x, blank(0)] }).benefits;
    const gap = firstOnly(hh.people[0]) - firstOnly(hh.people[1]);
    assert.ok(close(a.benefits, firstOnly(hh.people[0])), `#74: benefits not the first person's: ${where(y, p, hh)}`);
    assert.ok(close(a.benefits - b.benefits, gap), `#74: swap gap ${a.benefits - b.benefits} ≠ ${gap}`);
    if (!close(a.benefits, b.benefits)) benefitsDiffer++;
  });
  assert.ok(benefitsDiffer > 0, "unrelated adults' benefits are now symmetric: #74 looks fixed");
});

test("with no income there is no income tax and no payroll", () => {
  forAll(7, 200, {}, (y, p, hh) => {
    const none = { ...hh, people: hh.people.map(x => ({ ...blank(0), ded: x.ded })) };
    const h = household(y, p, none);
    assert.equal(incomeTax(h), 0, `income tax: ${where(y, p, none)}`);
    assert.equal(h.payroll, 0, `payroll: ${where(y, p, none)}`);
  });
});

/** Benefit lines that can shrink when a child is added, as "province: line". In Quebec the Canada Workers Benefit is
 *  harmonized with the work premium: with children its phase-in rate and maximum are lower (the work premium's are
 *  higher) and it phases out over a shorter range, so the CWB alone can fall. Total benefits still never fall. */
const CHILD_EXCEPTIONS = new Set(["QC: canada-workers-benefit"]);

// Alberta A30 s.30.2: with low earnings but high investment income, an extra child's higher working
// reduction can exceed the unchanged phase-in amount. Only admit the exact uncapped, positive case.
function albertaWorkingReduction(y: YearData, p: Province, hh: Household, a: H, b: H): boolean {
  const program = p.childBenefit;
  if (
    (y.year !== 2023 && y.year !== 2024) ||
    p.code !== "AB" ||
    program?.program !== "alberta-child-family-benefit-by-child"
  )
    return false;
  if (hh.kids < 1 || hh.kids >= 4 || Math.abs(a.famNet - b.famNet) > EPS) return false;
  const q = program.params;
  const i = hh.kids - 1;
  const netOver = a.famNet - q.workingThreshold;
  if (netOver <= 0) return false;
  const baseOver = Math.max(0, a.famNet - q.baseThreshold);
  if (q.base[i] > q.baseRate[i] * baseOver || q.base[i + 1] > q.baseRate[i + 1] * baseOver) return false;
  const earned = hh.people[0].ord + (hh.spouse ? (hh.people[1]?.ord ?? 0) : 0);
  const phaseIn = q.workingRate * Math.max(0, earned - q.workingFloor);
  if (phaseIn <= 0 || phaseIn >= Math.min(q.working[i], q.working[i + 1])) return false;
  if (a.provBen <= q.minAnnual || b.provBen <= q.minAnnual) return false;
  const expectedFall = (q.workingPhaseOut[i + 1] - q.workingPhaseOut[i]) * netOver;
  return expectedFall > 0 && Math.abs(a.provBen - b.provBen - expectedFall) < EPS;
}

test("another child never raises income tax and benefit declines follow documented rules", () => {
  const albertaReductionYears = new Set<number>();
  const excepted = new Set<string>();
  forAll(8, 300, {}, (y, p, hh) => {
    const a = household(y, p, hh),
      la = benefitLines(p, a);
    for (const under6 of [hh.under6, hh.under6 + 1]) {
      const more = { ...hh, kids: hh.kids + 1, under6 };
      const b = household(y, p, more),
        lb = benefitLines(p, b);
      const step = `${where(y, p, hh)} → ${more.kids} children, ${under6} under 6`;
      assert.ok(incomeTax(b) <= incomeTax(a) + EPS, `income tax rose: ${step}`);
      assert.ok(b.benefits >= a.benefits - EPS, `total benefits fell: ${step}`);
      for (const key of keysOf(la, lb)) {
        if (lineOf(lb, key) >= lineOf(la, key) - EPS) continue;
        if (key === "alberta-child-family-benefit-by-child" && albertaWorkingReduction(y, p, hh, a, b)) {
          albertaReductionYears.add(y.year);
          continue;
        }
        assert.ok(CHILD_EXCEPTIONS.has(`${p.code}: ${key}`), `${key} fell: ${step}`);
        excepted.add(`${p.code}: ${key}`);
      }
    }
  });
  assert.deepEqual([...excepted].sort(), [...CHILD_EXCEPTIONS].sort(), "CHILD_EXCEPTIONS lists exactly what falls");
  for (const year of [2023, 2024])
    if (YEARS.some(y => y.year === year))
      assert.ok(albertaReductionYears.has(year), `${year} Alberta working-reduction exception is still seen`);
});

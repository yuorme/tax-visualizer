// Household scenarios used for golden (snapshot) tests. Deterministic: a fixed list of hand-picked
// edge cases plus a seeded random sample across every input. Each scenario is run for all 13 provinces.
const blank = (ord, extra = {}) => ({ ord, cg: 0, ed: 0, nd: 0, fd: 0, ded: 0, ...extra });

export const DEFAULTS = {
  people: [blank(75000)],
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
  propOverride: null,
  home: "ON",
  spend: 2000,
  frug: 0,
};

const hand = [
  {},
  { people: [blank(0)] },
  { people: [blank(12000)] },
  { people: [blank(25000)], rent: 1200 },
  { people: [blank(28000)], kids: 1, under6: 0, rent: 1200 },
  { people: [blank(30000)], kids: 1, under6: 1 },
  { people: [blank(45000)], kids: 6, under6: 3 },
  { people: [blank(60000)], kids: 5, under6: 2, adults: 2 },
  { people: [blank(75000), blank(75000)], adults: 2, kids: 2, under6: 1, spend: 4500 },
  { people: [blank(70000), blank(50000)], adults: 2, kids: 1, spend: 3500 },
  { people: [blank(35000), blank(10000)], adults: 2, kids: 2, rent: 1500 },
  { people: [blank(120000), blank(0)], adults: 2, kids: 3, under6: 2 },
  { people: [blank(0), blank(90000)], adults: 2, active: 1 },
  { people: [blank(80000), blank(40000)], adults: 2, spouse: false },
  { people: [blank(108000)], home: "BC", kids: 2, spend: 4500 },
  { people: [blank(250000)], spend: 6000, homeValue: 1500000 },
  { people: [blank(600000, { ed: 50000, cg: 50000 })] },
  { people: [blank(0, { ed: 50000 })] },
  { people: [blank(0, { nd: 50000 })] },
  { people: [blank(0, { fd: 50000 })], whRate: 0.3 },
  { people: [blank(50000, { cg: -50000 })] },
  { people: [blank(150000, { cg: 30000, ed: 20000, nd: 5000, fd: 10000, ded: 27000 })] },
  { people: [blank(100000)], useBpa: false },
  { people: [blank(30000)], kids: 2, useCredits: false },
  { people: [blank(40000)], homeValue: 600000, propOverride: 0.012, home: "ON" },
  { people: [blank(40000)], homeValue: 600000, home: "MB" },
  { people: [blank(22000)], rent: 900, home: "MB", frug: -30 },
  { people: [blank(200000), blank(200000)], adults: 4, kids: 2, frug: 40, spend: 6000 },
];

// Seeded PRNG (mulberry32) so the sample never changes between runs
function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const r = rng(20261029);
const pick = a => a[Math.floor(r() * a.length)];
const INCOMES = [
  0, 8000, 15000, 22000, 30000, 38000, 47000, 55000, 68000, 75000, 85000, 100000, 120000, 160000, 200000, 250000,
];
const sample = [];
for (let i = 0; i < 120; i++) {
  const two = r() < 0.45;
  const inv = () =>
    r() < 0.3
      ? {
          cg: pick([-20000, 0, 5000, 25000, 50000]),
          ed: pick([0, 2000, 12000, 40000]),
          nd: pick([0, 0, 8000, 30000]),
          fd: pick([0, 3000, 20000]),
        }
      : {};
  const ded = () => (r() < 0.25 ? { ded: pick([5000, 15000, 30000]) } : {});
  const people = [blank(pick(INCOMES), { ...inv(), ...ded() })];
  if (two) people.push(blank(pick(INCOMES), { ...inv(), ...ded() }));
  const kids = pick([0, 0, 0, 1, 2, 3, 4, 6]);
  const own = r() < 0.3;
  sample.push({
    people,
    active: two && r() < 0.3 ? 1 : 0,
    spouse: !two || r() < 0.85,
    adults: two ? pick([2, 2, 3]) : pick([1, 1, 1, 2]),
    kids,
    under6: kids ? Math.floor(r() * (kids + 1)) : 0,
    useBpa: r() < 0.93,
    whRate: pick([0, 0.15, 0.15, 0.25]),
    useCredits: r() < 0.85,
    homeValue: own ? pick([300000, 750000, 1500000]) : 0,
    rent: own ? 0 : pick([0, 0, 800, 1500, 2500]),
    propOverride: own && r() < 0.2 ? pick([0.005, 0.011]) : null,
    home: pick(["ON", "BC", "AB", "QC", "MB", "NS", "NL", "NU"]),
    spend: pick([1200, 2000, 2800, 4000, 6000]),
    frug: pick([0, 0, -25, 20]),
  });
}

export const SCENARIOS = [...hand, ...sample].map((s, i) => ({ id: i, ...DEFAULTS, ...s }));

// The page notes and tooltips are built from the year's data: they render for every year, cover every info button
// that asks for them, and change when a data value changes.
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { listYears, loadYear } from "../src/data/load.ts";
import type { YearData } from "../src/data/schema.ts";
import { DEFAULT_INCOME, spendEst } from "../src/ui/defaults.ts";
import { footerNotes, type PageDefaults, tooltips } from "../src/ui/notes.ts";

// The page's own starting values, so the notes are checked against what the page uses.
const page: PageDefaults = { defaultIncome: DEFAULT_INCOME, spendEst };
const render = (y: YearData) => [footerNotes(y, page), ...Object.values(tooltips(y))].join("\n");
const html = fs.readFileSync(new URL("../src/ui/index.html", import.meta.url), "utf8");
const noteKeys = [...html.matchAll(/data-note="([^"]+)"/g)].map(m => m[1]);

for (const year of listYears()) {
  test(`${year}: notes and tooltips render from the data`, () => {
    const y = loadYear(year);
    const tips = tooltips(y);
    assert.ok(noteKeys.length > 0);
    for (const k of noteKeys) assert.ok(tips[k], `no tooltip for data-note="${k}"`);
    const text = render(y);
    assert.doesNotMatch(text, /undefined|NaN|Infinity|\[object/);
    assert.match(text, new RegExp(`\\b${year}\\b`));
  });
}

test("2026: notes quote the year's figures", () => {
  const text = render(loadYear(2026));
  for (const s of [
    "federal: 14% of $16,452",
    "up to the 2026 dollar limit of $33,810",
    "drops from $16,452 to $14,829 between $181,440 and $258,482",
    "Manitoba's $15,780 phases out to zero between $200,000 and $400,000",
    "phased out between $25,570 and $44,952 of net income",
    "2025 figures indexed by 2%",
    "from $11,932 in Nova Scotia to $22,769 in Alberta",
    "from 5% GST in Alberta and the territories to 15% HST in New Brunswick, Newfoundland and Labrador and PEI",
    "from 0.30% in Vancouver to 1.67% in Charlottetown",
    "the Northwest Territories and Nunavut withhold a 2% payroll tax",
    "Whitehorse, Yellowknife and Iqaluit use a rough 1.0% estimate",
    "its April 2026 budget increase to $13,094, effective January 1, 2026",
    "$2,000 for one person, $2,800 for two, $3,500 for three, $4,000 for four, $4,500 for five and $4,900 for six",
    "(15% for the U.S. under the tax treaty)",
  ])
    assert.ok(text.includes(s), `missing: ${s}`);
});

// Program names, former names, benefit periods and rate sources come from each year's data: 2026 renamed the GST/HST
// credit and replaced PEI's sales tax credit, so neither year's names may show up in the other's notes.
const PROGRAMS: Record<number, { has: string[]; not: string[] }> = {
  2025: {
    has: [
      "for July 2025 to June 2026: the GST/HST credit ($349 per adult",
      "household above: the GST/HST credit, the Canada Workers Benefit",
      "the Nova Scotia affordable living tax credit; the PEI sales tax credit; and",
      "Nunavut's uses the 3% / 5% rates in its 2026 Bill 4 (no 2025 source gives them).",
      "using July 2025 to June 2026 amounts",
    ],
    not: ["Groceries", "essentials benefit", "formerly", "renamed", "July 2026 to", "2025 Bill 4"],
  },
  2026: {
    has: [
      "household above: the Canada Groceries and Essentials Benefit (formerly the GST/HST credit), the Canada Workers",
      "for July 2026 to June 2027: the Canada Groceries and Essentials Benefit (the renamed GST/HST credit: $445 per adult",
      "the Nova Scotia affordable living tax credit; the PEI essentials benefit; and",
      "Nunavut's uses the 3% / 5% rates in its 2026 Bill 4.",
    ],
    not: ["PEI sales tax credit", "July 2025", "no 2025 source"],
  },
};
for (const [year, { has, not }] of Object.entries(PROGRAMS))
  test(`${year}: notes name that year's programs and benefit period`, () => {
    const text = render(loadYear(Number(year)));
    for (const s of has) assert.ok(text.includes(s), `missing: ${s}`);
    for (const s of not) assert.ok(!text.includes(s), `should not include: ${s}`);
  });

// Property tax: an estimated rate (2025's are 2026 rates carried over) stays in the list of city rates and is
// called an estimate; only rough placeholders (the territories) are listed apart.
test("2025: estimated provincial property tax rates are listed and called estimates", () => {
  const text = render(loadYear(2025));
  for (const s of [
    "largest city for 2025: Vancouver 0.30%, Calgary 0.66%",
    // Charlottetown's 2025 rate is published; the other nine are 2026 rates carried over.
    "Halifax 0.61% and St. John's 0.91%. The Vancouver, Calgary, Saskatoon, Winnipeg, Toronto, Montreal, Moncton, Halifax and St. John's rates are estimates, not yet checked against 2025 municipal rates. Whitehorse, Yellowknife and Iqaluit use a rough 1.0% estimate.",
    "from 0.30% in Vancouver to 1.67% in Charlottetown; the Vancouver, Calgary, Saskatoon, Winnipeg, Toronto, Montreal, Moncton, Halifax and St. John's rates are estimates, not yet checked against 2025 municipal rates, and territorial rates are rough estimates.",
  ])
    assert.ok(text.includes(s), `missing: ${s}`);
});

test("2026: published property tax rates carry no estimate caveat", () => {
  const text = render(loadYear(2026));
  assert.ok(text.includes("from 0.30% in Vancouver to 1.67% in Charlottetown; territorial rates are rough estimates."));
  assert.ok(text.includes("Halifax 0.61% and St. John's 0.91%. Whitehorse, Yellowknife and Iqaluit use a rough"));
  assert.ok(!text.includes("not yet checked"));
});

test("a single estimated property tax rate is named, and stays in the list", () => {
  const y = structuredClone(loadYear(2026));
  byCode(y, "ON").propertyTax.estimated = true;
  const text = render(y);
  assert.ok(text.includes("Winnipeg 1.38%, Toronto 0.76%, Montreal"));
  assert.ok(text.includes("St. John's 0.91%. The Toronto rate is an estimate, not yet checked against 2026 municipal"));
  assert.ok(text.includes("1.67% in Charlottetown; the Toronto rate is an estimate, not yet checked against 2026"));
});

test("when every provincial property tax rate is estimated, the notes say so once", () => {
  const y = structuredClone(loadYear(2026));
  for (const p of y.provinces) p.propertyTax.estimated = true;
  const text = render(y);
  assert.ok(text.includes("St. John's 0.91%. Provincial rates are estimates, not yet checked against 2026 municipal"));
  assert.ok(text.includes("1.67% in Charlottetown; provincial rates are estimates, not yet checked against 2026"));
});

for (const year of listYears())
  test(`${year}: rough property tax placeholders are also marked estimated`, () => {
    for (const p of loadYear(year).provinces)
      if (p.propertyTax.rough) assert.equal(p.propertyTax.estimated, true, `${p.code} rough but not estimated`);
  });

// Each case changes one data value and names text that must appear (and text that must go) as a result.
const CASES: [string, (y: YearData) => void, string, string][] = [
  [
    "federal basic personal amount",
    y => {
      y.federal.basicPersonalAmount.max = 17000;
    },
    "$17,000",
    "$16,452",
  ],
  [
    "RRSP dollar limit",
    y => {
      y.federal.rrsp.limit = 35000;
    },
    "limit of $35,000",
    "$33,810",
  ],
  [
    "EI rate",
    y => {
      y.federal.payroll.ei.rate = 0.0171;
    },
    "EI: 1.71% of earnings",
    "1.63%",
  ],
  [
    "capital gains inclusion",
    y => {
      y.federal.investment.capitalGainsInclusion = 0.6;
    },
    "Only 60% of a net gain",
    "half of a net gain",
  ],
  [
    "indexation factor",
    y => {
      y.federal.indexation = 0.027;
    },
    "indexed by 2.7%",
    "indexed by 2%",
  ],
  [
    "Ontario surtax threshold",
    y => {
      byCode(y, "ON").surtax = [
        [6000, 0.2],
        [7446, 0.36],
      ];
    },
    "20% of Ontario tax over $6,000",
    "$5,818",
  ],
  [
    "Vancouver property rate",
    y => {
      byCode(y, "BC").propertyTax.rate = 0.0025;
    },
    "Vancouver 0.25%",
    "Vancouver 0.30%",
  ],
  [
    "Nova Scotia basic personal amount",
    y => {
      byCode(y, "NS").basicPersonalAmount = 12500;
    },
    "from $12,500 in Nova Scotia",
    "$11,932",
  ],
  [
    "Ontario child benefit",
    y => {
      const b = byCode(y, "ON").childBenefit;
      if (b?.program === "ontario-child-benefit") b.params.perChild = 1800;
    },
    "up to $1,800 per child",
    "$1,760",
  ],
  [
    "tax year",
    y => {
      y.year = 2030;
      y.federal.year = 2030;
    },
    "July 2030 to June 2031",
    "July 2026",
  ],
];
function byCode(y: YearData, code: string) {
  const p = y.provinces.find(x => x.code === code);
  assert.ok(p, code);
  return p;
}

for (const [what, change, expect, gone] of CASES)
  test(`changing the ${what} changes the notes`, () => {
    const y = structuredClone(loadYear(2026));
    assert.ok(render(y).includes(gone), `2026 text should include ${gone}`);
    change(y);
    const text = render(y);
    assert.ok(text.includes(expect), `expected ${expect}`);
    assert.ok(!text.includes(gone), `${gone} should be gone`);
  });

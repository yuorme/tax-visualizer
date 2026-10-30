// The page notes and tooltips are built from the year's data: they render for every year, cover every info button
// that asks for them, and change when a data value changes.
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { listYears, loadYear } from "../src/data/load.ts";
import type { YearData } from "../src/data/schema.ts";
import { footerNotes, type PageDefaults, tooltips } from "../src/ui/notes.ts";

const page: PageDefaults = { defaultIncome: 75000, spendEst: n => Math.round((2012 * Math.sqrt(n)) / 100) * 100 };
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

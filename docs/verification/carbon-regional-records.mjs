import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
const root = ".";
const src = (y, n) => `${y}/sources/carbon-regional-${n}.txt`;
const fed = [
  ["2019-01-01", 0],
  ["2019-07-01", 0.0442],
  ["2020-04-01", 0.0663],
  ["2021-04-01", 0.0884],
  ["2022-04-01", 0.1105],
  ["2023-04-01", 0.1431],
  ["2024-04-01", 0.1761],
  ["2025-04-01", 0],
];
const schedules = {
  YT: fed,
  NU: fed.map(([date, rate]) => [date, date < "2023-04-01" ? rate / 2 : rate]),
  NT: [
    ["2019-01-01", 0],
    ["2019-09-01", 0.047],
    ["2020-07-01", 0.07],
    ["2021-07-01", 0.094],
    ["2022-07-01", 0.117],
    ["2023-04-01", 0.1431],
    ["2024-04-01", 0.1761],
    ["2025-04-01", 0],
  ],
  AB: [
    ["2019-01-01", 0.0673],
    ["2019-05-30", 0],
  ],
  NB: [
    ["2020-01-01", 0.0442],
    ["2020-04-01", 0.0663],
    ["2021-04-01", 0.0884],
    ["2022-04-01", 0.1105],
    ["2023-07-01", 0.1431],
  ],
  PE: [
    ["2019-01-01", 0],
    ["2019-04-01", 0.0442],
    ["2020-04-01", 0.0663],
    ["2022-05-09", 0.1105],
    ["2023-07-01", 0.1431],
  ],
  NL: [
    ["2019-01-01", 0.0442],
    ["2020-11-07", 0.0663],
    ["2021-07-01", 0.0884],
    ["2022-05-01", 0.1105],
    ["2023-07-01", 0.1431],
  ],
};
const sourceMap = {
  YT: [src(2025, "federal-rates"), src(2025, "yt-rebates"), src(2019, "yt-start"), src(2019, "yt-law")],
  NU: [
    src(2025, "federal-rates"),
    src(2019, "nu-start"),
    src(2022, "nu-rebate-extension"),
    src(2023, "nu-change"),
    src(2023, "nu-hansard"),
    src(2024, "nu-rebate"),
    src(2025, "nu-cra-dates"),
  ],
  NT: [
    src(2025, "nt-report-final"),
    src(2019, "nt-start"),
    src(2020, "nt-lump-sum"),
    src(2023, "nt-change"),
    src(2025, "nt-end"),
  ],
  AB: [src(2019, "ab-rates"), src(2019, "ab-statute"), src(2019, "ab-end")],
  NB: [
    src(2020, "nb-act"),
    src(2021, "nb-act"),
    src(2022, "nb-rates"),
    src(2023, "nb-end"),
    src(2020, "nb-exemptions"),
  ],
  PE: [
    src(2019, "pe-rates"),
    src(2022, "pe-rates"),
    src(2023, "pe-end"),
    src(2022, "pe-statute"),
    src(2022, "pe-regular-formula"),
    src(2022, "pe-rebate"),
  ],
  NL: [src(2019, "nl-start"), src(2020, "nl-rates"), src(2023, "nl-rates"), src(2023, "nl-heating-exemptions")],
};
const dated = (year, schedule) => {
  const start = `${year}-01-01`,
    end = `${year + 1}-01-01`;
  const first = schedule.filter(([d]) => d <= start).at(-1);
  if (!first) return null;
  const out = [
    { from: start, rate: first[1] },
    ...schedule.filter(([d]) => d > start && d < end).map(([from, rate]) => ({ from, rate })),
  ];
  return out.length === 1 ? out[0].rate : out;
};
const payment = (date, adult, child = adult) => ({
  date,
  adult,
  spouse: adult,
  child,
  firstChild: child,
  threshold: [0, 0],
  rate: 0,
});
const regular = {
  individual: 110,
  spouseOrDependant: 55,
  supplementRate: 0.005,
  supplementFrom: 30000,
  supplementMax: 55,
  threshold: 50000,
  rate: 0.02,
};
const enhanced = { ...regular, individual: 670, rate: 0.04 };
const ytAnnual = { 2020: 192, 2021: 176, 2022: 320, 2023: 372, 2024: 310 };
const ntAnnual = { 2020: [156, 180], 2021: [208, 240], 2022: [260, 300], 2023: [441, 493], 2024: [441, 505] };
const data = [];
for (let year = 2019; year <= 2025; year++)
  for (const region of ["YT", "NT", "NU", "AB", "NB", "PE", "NL"]) {
    if (
      (region === "AB" && year !== 2019) ||
      (["NB", "PE", "NL"].includes(region) && year > 2023) ||
      (region === "NB" && year < 2020)
    )
      continue;
    const row = {
      year,
      region,
      gasoline: dated(year, schedules[region]),
      sources: sourceMap[region],
      rebates: [],
      notes: [],
    };
    if (["YT", "NT", "NU"].includes(region)) {
      const payments = [];
      if (["YT", "NT"].includes(region)) {
        if (year === 2019) payments.push(payment("2019-10-31", region === "YT" ? 43 : 52, region === "YT" ? 43 : 60));
        if (year === 2020) payments.push(payment("2020-04-30", region === "YT" ? 43 : 52, region === "YT" ? 43 : 60));
        for (const month of [1, 4, 7, 10]) {
          if ((year === 2020 && month < 7) || year === 2019 || (year === 2025 && month > 4)) continue;
          const benefitYear = month < 7 ? year - 1 : year;
          const annual = region === "YT" ? [ytAnnual[benefitYear], ytAnnual[benefitYear]] : ntAnnual[benefitYear];
          const p = payment(`${year}-${String(month).padStart(2, "0")}-01`, annual[0] / 4, annual[1] / 4);
          if (region === "NT" && benefitYear === 2020) {
            p.date = p.date.slice(0, 7);
            p.smallPayment = { below: 50, multiplier: month === 7 ? 4 : 0 };
          }
          payments.push(p);
        }
      } else {
        if (year === 2023) payments.push(payment("2023-09-05", 77), payment("2023-10-05", 77));
        if (year === 2024)
          payments.push(
            payment("2024-01-01", 77),
            payment("2024-04-01", 77),
            payment("2024-07-05", 25),
            payment("2024-10-01", 25),
          );
        if (year === 2025) payments.push(payment("2025-01-01", 25), payment("2025-04-04", 25));
        row.notes.push(
          "NU published quarterly schedule; discretionary small-payment consolidation not activated without evidence of actual use.",
        );
      }
      if (payments.some(p => p.smallPayment))
        for (const p of payments) p.smallPayment ??= { below: 50, multiplier: 1 };
      if (payments.length)
        row.rebates.push({
          name:
            region === "YT"
              ? "Yukon carbon rebate"
              : region === "NT"
                ? "Cost of Living Offset"
                : "Nunavut Carbon Credit",
          program: payments.some(p => p.smallPayment)
            ? "carbon-rebate-consolidated-payments"
            : "carbon-rebate-payments",
          params: { payments },
        });
      row.notes.push("Dates ending -01 are sourced payment-month anchors, not assertions about the bank-deposit day.");
      if (region === "NT") row.notes.push("Zone A / Yellowknife reference city. B/C variants in research tables.");
      if (region === "YT")
        row.notes.push("Whitehorse reference city; remote supplement10% benefit-years2020–23,20%2024.");
      if (region === "NU")
        row.notes.push(
          "Gasoline is net of50% point-of-sale rebate until2023-03-31; excluded extraordinary1000homeowner application benefit.",
        );
    }
    if (region === "AB")
      row.rebates = [
        {
          name: "Alberta climate leadership adjustment rebate",
          program: "alberta-carbon-rebate-payments",
          params: {
            payments: ["2019-01", "2019-04"].map(date => ({
              date,
              adult: 300,
              spouse: 150,
              child: 45,
              firstChild: 150,
              childCap: 4,
              threshold: [47500, 95000],
              rate: [0.0267, 0.04],
              minAnnual: 100,
              weight: 0.25,
            })),
          },
        },
      ];
    if (region === "PE" && year === 2022)
      row.rebates = [
        {
          name: "PEI carbon rebate",
          program: "pei-carbon-rebate-increment",
          params: { payments: [{ date: "2022-07-05", weight: 0.25, regular, enhanced }] },
        },
      ];
    data.push(row);
  }
function value(row, couple = false, kids = 0) {
  let out = 0;
  for (const rebate of row.rebates)
    for (const p of rebate.params.payments) {
      if (!("adult" in p)) continue;
      let n = p.adult + (couple ? p.spouse : 0) + p.child * kids;
      if (p.smallPayment && n < p.smallPayment.below) n *= p.smallPayment.multiplier;
      out += n;
    }
  return out;
}
const find = (y, r) => data.find(x => x.year === y && x.region === r);
assert.equal(value(find(2020, "NT")), 208);
assert.equal(value(find(2021, "NT")), 104);
assert.equal(value(find(2020, "NT"), true, 2), 560);
assert.equal(value(find(2021, "NT"), true, 2), 784);
assert.equal(value(find(2024, "NU")), 204);
assert.equal(value(find(2025, "NU")), 50);
assert.deepEqual(
  [2019, 2020, 2021, 2022, 2023, 2024, 2025].map(y => value(find(y, "YT"))),
  [43, 139, 184, 248, 346, 341, 155],
);
const calc = (q, income, couple, kids) =>
  Math.max(
    0,
    q.individual +
      (couple || kids ? q.spouseOrDependant : 0) +
      Math.min(q.supplementMax, q.supplementRate * Math.max(0, income - q.supplementFrom)) -
      q.rate * Math.max(0, income - q.threshold),
  );
const pe = (income, couple = false, kids = 0) =>
  (calc(enhanced, income, couple, kids) - calc(regular, income, couple, kids)) / 4;
assert.equal(pe(45000), 140);
assert.equal(pe(55000), 115);
assert.equal(pe(63000, true), 65);
const heating = {
  YT: {
    unit: "CAD/litre",
    proxyLitres: 1750,
    proxy: "Midpoint of1500–2000L/year2017Yukon oil-heated-home illustration; estimated, not territorialmean",
    oil: [
      ["2019-01-01", 0],
      ["2019-07-01", 0.0537],
      ["2020-04-01", 0.0805],
      ["2021-04-01", 0.1073],
      ["2022-04-01", 0.1341],
      ["2023-04-01", 0.1738],
      ["2023-11-09", 0],
    ],
    sources: [src(2025, "federal-rates"), src(2023, "yt-heating-proxy"), src(2025, "yt-rebates")],
  },
  NT: {
    unit: "CAD/litre",
    proxyLitres: 2406,
    proxy:
      "2012Deline feasibility-study residential-building assumption reused for allNWT; estimated, not Yellowknifemeasurement",
    oil: [
      ["2019-01-01", 0],
      ["2023-04-01", 0.1738],
      ["2024-04-01", 0],
    ],
    sources: [src(2025, "nt-report-final"), src(2023, "nt-heating-proxy")],
  },
  NU: {
    unit: "CAD/litre",
    proxyLitres: 2406,
    proxy:
      "Reuse NWT2012Deline residential-building oil assumption because no reliableNUhousehold figure found; estimated cross-territoryproxy",
    oil: [
      ["2019-01-01", 0],
      ["2019-07-01", 0.02685],
      ["2020-04-01", 0.04025],
      ["2021-04-01", 0.05365],
      ["2022-04-01", 0.06705],
      ["2023-04-01", 0.1738],
      ["2023-11-09", 0],
    ],
    sources: [
      src(2025, "federal-rates"),
      src(2019, "nu-start"),
      src(2022, "nu-rebate-extension"),
      src(2023, "nu-change"),
      src(2023, "nt-heating-proxy"),
    ],
  },
  AB: {
    unit: "CAD/litre",
    oil: [
      ["2019-01-01", 0.0803],
      ["2019-05-30", 0],
    ],
    naturalGasUnit: "CAD/GJ",
    naturalGas: [
      ["2019-01-01", 1.517],
      ["2019-05-30", 0],
    ],
    validYears: [2019],
    sources: sourceMap.AB,
  },
  NB: {
    unit: "CAD/litre",
    oil: [
      ["2020-01-01", 0.0537],
      ["2020-04-01", 0],
      ["2023-07-01", 0.1738],
      ["2023-11-09", 0],
    ],
    propane: [
      ["2020-01-01", 0.031],
      ["2020-04-01", 0],
      ["2023-07-01", 0.1006],
    ],
    naturalGasUnit: "CAD/cubic metre",
    naturalGas: [
      ["2020-01-01", 0.0391],
      ["2020-04-01", 0.0587],
      ["2021-04-01", 0.0783],
      ["2022-04-01", 0.0979],
      ["2023-07-01", 0.1239],
    ],
    validYears: [2020, 2021, 2022, 2023],
    sources: [...sourceMap.NB, src(2025, "federal-rates")],
  },
};
function effective(year, schedule) {
  const a = Date.UTC(year, 0, 1),
    b = Date.UTC(year + 1, 0, 1),
    r = dated(year, schedule);
  if (r === null) return null;
  if (typeof r === "number") return r;
  return r.reduce(
    (sum, p, i) => sum + (p.rate * ((i + 1 < r.length ? Date.parse(r[i + 1].from) : b) - Date.parse(p.from))) / (b - a),
    0,
  );
}
for (const spec of Object.values(heating))
  spec.calendarEffectiveOilRates = Object.fromEntries(
    (spec.validYears ?? [2019, 2020, 2021, 2022, 2023, 2024, 2025]).map(y => [y, effective(y, spec.oil)]),
  );
const result = {
  status: "Verified regional records; source paths and notes are collection metadata, not carbon schema fields",
  sourceRoot: root,
  records: data,
  heating,
};
writeFileSync(
  fileURLToPath(new URL("./carbon-regional-records.json", import.meta.url)),
  JSON.stringify(result, null, 2) + "\n",
);
console.log(`${data.length} regional year records; independent cash and PE published-example arithmetic passed.`);

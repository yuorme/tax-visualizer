import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { loadCpi, loadYear } from "../src/data/load.ts";
import { historyComparison } from "../src/engine/history.ts";
import { blank, type Household } from "../src/engine/index.ts";

test("history carbon golden: physical fuel and fixed heating stay nominal, then net tax converts to base dollars", () => {
  const years = [2019, 2025].map(year => {
    const data = loadYear(2025);
    // This intentionally synthetic carbon-only system predates ordinary fuel activation in real 2025.
    delete data.federal.fuelTax;
    for (const province of data.provinces) delete province.fuelTax;
    data.year = year;
    data.federal.year = year;
    data.federal.brackets = [[Infinity, 0]];
    Object.assign(data.federal.groceriesBenefit, { adult: 0, spouseOrFirstChild: 0, child: 0 });
    data.federal.groceriesBenefit.singleSupplement.max = 0;
    const p = data.provinces.find(p => p.code === "AB");
    assert.ok(p);
    p.brackets = [[Infinity, 0]];
    p.credits = [];
    p.childBenefit = undefined;
    p.carbon = {
      name: "Synthetic carbon system",
      gasoline: 0.1,
      heating: { amount: 50, estimated: true, method: "Synthetic fixed heating for CPI verification" },
      rebates: [
        {
          program: "carbon-rebate-payments",
          name: "Synthetic calendar rebate",
          params: {
            payments: [
              { date: `${year}-01-01`, adult: 20, spouse: 0, child: 0, firstChild: 0, threshold: [0, 0], rate: 0 },
            ],
          },
        },
      ],
    };
    data.provinces = [p];
    return data;
  });
  const household: Household = {
    people: [{ ...blank(0), fd: 100000 }],
    active: 0,
    adults: 1,
    spouse: false,
    kids: 0,
    under6: 0,
    useBpa: false,
    useCredits: true,
    whRate: 0,
    homeValue: 0,
    rent: 0,
    monthlySpending: 0,
    driving: { km: 10000, lPer100km: 10 },
  };
  const cpi = { ...loadCpi(), values: { 2019: 50, 2025: 100 } };
  const fixture = JSON.parse(
    fs.readFileSync(new URL("./golden/features/history-carbon.json", import.meta.url), "utf8"),
  );
  const cases = {
    withRebate: household,
    withoutRebate: { ...household, useCredits: false },
    withoutDriving: { ...household, driving: { km: 0, lPer100km: 10 } },
  };
  for (const [id, hh] of Object.entries(cases))
    for (const mode of ["real", "nominal"] as const) {
      const result = historyComparison(years, cpi, hh, ["AB"], mode);
      assert.deepEqual(
        result.rows.map(row => row.provinces[0].tax),
        fixture[id][mode],
        `${id}/${mode}`,
      );
      assert.deepEqual(
        result.rows.map(row => row.provinces[0].income),
        [100000, 100000],
      );
    }
});

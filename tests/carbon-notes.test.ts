import assert from "node:assert/strict";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { footerNotes, tooltips } from "../src/ui/notes.ts";

test("carbon-only driving explains its costs, calendar rebates and fixed heating estimate", () => {
  const y = structuredClone(loadYear(2025));
  delete y.federal.fuelTax;
  y.federal.driving = loadYear(2026).federal.driving;
  for (const p of y.provinces) {
    delete p.fuelTax;
    delete p.carbon;
    p.driving = { distance: 10000, estimated: true };
  }
  y.provinces[0].carbon = {
    name: "Carbon pricing",
    gasoline: [
      { from: "2025-01-01", rate: 0.1761 },
      { from: "2025-04-01", rate: 0 },
    ],
    heating: { amount: 100, estimated: true, method: "Synthetic household energy estimate for note verification" },
    rebates: [],
  };
  const tips = tooltips(y);
  const notes = footerNotes(y, { defaultIncome: 75000, spendEst: () => 2000 });
  assert.match(tips.fuel, /Ordinary fuel taxes aren't in the 2025 data yet/);
  assert.match(tips.fuel, /Driving includes the carbon charge/);
  assert.doesNotMatch(tips.fuel, /driving adds nothing/);
  assert.match(tips.distance, /Historical distances are estimates/);
  assert.match(tips.efficiency, /Enter 0 for an electric car/);
  assert.match(notes, /17.61¢.*April 1/);
  assert.match(notes, /estimated household heating \$100/);
  assert.match(notes, /Synthetic household energy estimate/);
  assert.match(notes, /cash payments in calendar 2025/);
  assert.match(notes, /Quebec cap-and-trade and carbon costs embedded in goods or electricity are excluded/);
});

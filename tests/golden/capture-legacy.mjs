// Runs the legacy single-file engine (legacy/tax-compare.html) over every scenario and saves the results.
// These fixtures are the reference the refactored engine must reproduce. Re-run only on purpose:
//   node tests/golden/capture-legacy.mjs
import fs from "node:fs";
import vm from "node:vm";
import { SCENARIOS } from "./scenarios.mjs";
import { snapshot } from "./snapshot.mjs";

const html = fs.readFileSync(new URL("../../legacy/tax-compare.html", import.meta.url), "utf8");
const script = html.slice(html.indexOf("<script>") + 8, html.indexOf("</script>"));
const engine = script.slice(0, script.indexOf("const $ = id"));
const stateStart = script.indexOf("const hasInv");
const state = script.slice(stateStart, script.indexOf("const me = () =>"));
const harness = `
${engine}
${state}
globalThis.__run = function (s) {
  people = s.people.map(x => ({...x})); active = s.active; spouse = s.spouse; adults = s.adults;
  kids = s.kids; under6 = s.under6; useBpa = s.useBpa; whRate = s.whRate; useCredits = s.useCredits;
  homeValue = s.homeValue; rent = s.rent; propOverride = s.propOverride; home = s.home; spend = s.spend; frug = s.frug;
  return P.map(p => [p.c, calc(p)]);
};`;
const ctx = vm.createContext({ Math, Infinity, console });
vm.runInContext(harness, ctx);

const out = { source: "legacy/tax-compare.html", year: 2026, scenarios: [] };
for (const s of SCENARIOS) {
  const res = ctx.__run(s);
  out.scenarios.push({ id: s.id, results: Object.fromEntries(res.map(([c, h]) => [c, snapshot(h)])) });
}
fs.writeFileSync(new URL("./2026.json", import.meta.url), JSON.stringify(out));
console.log(`captured ${out.scenarios.length} scenarios × 13 provinces`);

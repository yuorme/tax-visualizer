// Captures one year's golden results from the TypeScript engine: every scenario in scenarios.mjs × every province,
// reduced by snapshot.mjs, written to tests/golden/<year>.json in the format tests/golden.test.ts reads. Run it
// only on purpose: for a new year once its data is verified, or with --force after an intended result change.
//   npm run golden:capture -- <year>                   write tests/golden/<year>.json (refuses if it exists)
//   npm run golden:capture -- <year> --force           overwrite it
//   npm run golden:capture -- <year> --out <file>      write somewhere else, e.g. to compare with the fixture
// It reads only data/years/<year>/ and writes only the one file, so other years' fixtures never change.
// (capture-legacy.mjs is the record of how 2026 was first locked, from the original single-file app.)
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { listYears, loadYear } from "../../src/data/load.ts";
import { computeAll } from "../../src/engine/index.ts";
import { type Scenario, toHousehold } from "./adapter.ts";
import { SCENARIOS } from "./scenarios.mjs";
import { snapshot } from "./snapshot.mjs";

const usage = "usage: npm run golden:capture -- <year> [--force] [--out <file>]";
const fail = (msg: string): never => {
  console.error(`${msg}\n${usage}`);
  process.exit(1);
};

const { positionals, values } = (() => {
  try {
    return parseArgs({
      allowPositionals: true,
      options: { force: { type: "boolean", default: false }, out: { type: "string" } },
    });
  } catch (e) {
    return fail((e as Error).message);
  }
})();
if (positionals.length !== 1 || !/^\d{4}$/.test(positionals[0])) fail("give exactly one four-digit year");
const year = Number(positionals[0]);
if (!listYears().includes(year)) fail(`no data for ${year} in data/years/ (have ${listYears().join(", ")})`);

const data = loadYear(year);
const out = {
  source: "src/engine",
  year,
  scenarios: (SCENARIOS as unknown as Scenario[]).map(s => ({
    id: s.id,
    results: Object.fromEntries(computeAll(data, toHousehold(s)).map(({ p, r }) => [p.code, snapshot(r)])),
  })),
};

// npm runs scripts from the package root; INIT_CWD is where the command was typed, so --out resolves from there.
const cwd = process.env.INIT_CWD ?? process.cwd();
const file = values.out ? path.resolve(cwd, values.out) : path.resolve(import.meta.dirname, `${year}.json`);
const shown = path.relative(process.cwd(), file).startsWith("..") ? file : path.relative(process.cwd(), file);
try {
  // "wx" fails if the file exists, so an existing fixture is never overwritten without --force.
  fs.writeFileSync(file, JSON.stringify(out), { flag: values.force ? "w" : "wx" });
} catch (e) {
  if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
  fail(`${shown} already exists; pass --force to overwrite it`);
}
console.log(`captured ${out.scenarios.length} scenarios × ${data.provinces.length} provinces for ${year} to ${shown}`);

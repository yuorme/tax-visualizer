// Node-only loader: reads data/years/<year>/*.yaml, validates against the schema and returns typed data.
// Used by the tests and by scripts/build.ts, which bakes the validated data into the app bundle.
import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { yearSchema, type YearData } from "./schema.ts";

export const DATA_DIR = path.resolve(import.meta.dirname, "../../data/years");

export function listYears(): number[] {
  return fs
    .readdirSync(DATA_DIR)
    .filter(d => /^\d{4}$/.test(d))
    .map(Number)
    .sort();
}

export function loadYear(year: number): YearData {
  const dir = path.join(DATA_DIR, String(year));
  const read = (f: string) => parse(fs.readFileSync(f, "utf8"));
  const provDir = path.join(dir, "provinces");
  const raw = {
    year,
    federal: read(path.join(dir, "federal.yaml")),
    provinces: fs
      .readdirSync(provDir)
      .filter(f => f.endsWith(".yaml"))
      .sort()
      .map(f => read(path.join(provDir, f))),
  };
  const res = yearSchema.safeParse(raw);
  if (!res.success) {
    const msg = res.error.issues.map(i => `  ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`data/years/${year} failed validation:\n${msg}`);
  }
  for (const p of res.data.provinces) {
    const file = path.join(provDir, `${p.code}.yaml`);
    if (!fs.existsSync(file)) throw new Error(`${p.code}: file name must match its code`);
  }
  res.data.provinces.sort((a, b) => a.order - b.order);
  return res.data;
}

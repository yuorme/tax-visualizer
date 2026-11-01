// Compares one year's data with another, field by field, and prints a Markdown report for data pull requests. Its
// main job is catching values carried over by mistake: an amount that should have been indexed but wasn't updated.
//   npm run year-diff -- <year>                      compare with the previous year (the nearest year if none)
//   npm run year-diff -- <year> <base-year>          compare with a given year
//   npm run year-diff -- <year> --threshold 10       flag changes over 10% as large (default 15)
//   npm run year-diff -- <year> --data <dir>         read years from <dir> instead of data/years
//
// The report always runs from the earlier year to the later one, so percentages read as indexation. It lists:
// - suspiciously unchanged amounts: equal in both years and normally indexed (amounts, thresholds, bracket limits).
//   Rates, zeros and bookkeeping fields (year, order...) are exempt. A value opts out when its province sets
//   `bracketsFrozenSince` (bracket limits only), or when a comment saying "not indexed" sits on its line, on the
//   line of an enclosing key or list item, or in the comment-only lines directly above one of those;
// - large changes, over the threshold;
// - added, removed and replaced fields: a list of programs is matched by `program`, and a field whose `program`
//   changed is reported as replaced, not compared parameter by parameter;
// - every changed value, collapsed. `sources` lists are skipped.
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { isMap, isPair, isScalar, isSeq, LineCounter, type Node, Parser, parseDocument } from "yaml";

/** A comment containing this phrase opts the values it covers out of the "suspiciously unchanged" check. */
export const NOT_INDEXED = /\bnot indexed\b/i;
/** Numeric fields that are bookkeeping or counts, never indexed amounts. */
const NOT_MONEY = new Set(["year", "order", "bracketsFrozenSince", "maxChildren"]);
/** Named keys that hold rates even when the value is 1 or more (a dividend gross-up of 1.38). */
const RATE_KEY = /rate|grossup|inclusion/i;
const SKIP_KEYS = new Set(["sources"]);

// ---------------------------------------------------------------------------------------------------------------
// Parsing: a YAML file becomes a tree that remembers, for every node, whether a "not indexed" comment covers it.

export type Tree =
  | { kind: "map"; entries: Map<string, Tree>; optOut: boolean }
  | { kind: "seq"; items: Tree[]; optOut: boolean }
  | { kind: "scalar"; value: unknown; optOut: boolean };

export function parseTree(src: string): Tree {
  const lines = new LineCounter();
  const doc = parseDocument(src, { lineCounter: lines });
  if (doc.errors.length) throw new Error(doc.errors[0].message);
  const lineOf = (offset: number) => lines.linePos(offset).line;

  // Comments by line, from the syntax tree, so a `#` inside a quoted string isn't mistaken for one.
  const comments = new Map<number, string>();
  const collect = (tok: unknown): void => {
    if (Array.isArray(tok)) {
      for (const t of tok) collect(t);
    } else if (tok && typeof tok === "object") {
      const t = tok as { type?: string; offset?: number; source?: string };
      if (t.type === "comment" && typeof t.offset === "number" && t.source) {
        const line = lineOf(t.offset);
        comments.set(line, `${comments.get(line) ?? ""} ${t.source}`);
      }
      for (const v of Object.values(tok)) if (v && typeof v === "object") collect(v);
    }
  };
  collect([...new Parser().parse(src)]);
  const text = src.split(/\r?\n/);
  const ownLine = (line: number) => /^\s*#/.test(text[line - 1] ?? "");
  // A marker on the line itself, or in the run of comment-only lines directly above it.
  const marked = (line: number): boolean => {
    if (NOT_INDEXED.test(comments.get(line) ?? "")) return true;
    for (let l = line - 1; l >= 1 && ownLine(l); l--) if (NOT_INDEXED.test(comments.get(l) ?? "")) return true;
    return false;
  };
  const start = (n: unknown) => (n as { range?: [number, number, number] } | null)?.range?.[0];
  const covered = (inherited: boolean, n: unknown) => {
    const at = start(n);
    return inherited || (at !== undefined && marked(lineOf(at)));
  };

  // Only keys, list items and scalars anchor a comment. A block map starts on its first key's line, so letting the
  // map itself match would stretch a comment meant for that key over its siblings.
  const build = (n: Node | null | undefined, inherited: boolean): Tree => {
    const optOut = isMap(n) || isSeq(n) ? inherited : covered(inherited, n);
    if (isMap(n)) {
      const entries = new Map<string, Tree>();
      for (const pair of n.items) {
        if (!isPair(pair)) continue;
        const key = String(isScalar(pair.key) ? pair.key.value : pair.key);
        entries.set(key, build(pair.value as Node | null, covered(optOut, pair.key)));
      }
      return { kind: "map", entries, optOut };
    }
    if (isSeq(n)) {
      return { kind: "seq", items: n.items.map(item => build(item as Node, covered(optOut, item))), optOut };
    }
    return { kind: "scalar", value: isScalar(n) ? n.value : null, optOut };
  };
  return build(doc.contents, false);
}

// ---------------------------------------------------------------------------------------------------------------
// Diffing two trees for the same file.

export type Value = unknown;
export interface Changed {
  file: string;
  path: string;
  before: Value;
  after: Value;
  /** Percentage change from the earlier to the later year; undefined when it can't be computed. */
  pct?: number;
  large: boolean;
}
export interface Unchanged {
  file: string;
  path: string;
  /** `path` split for the report, which lists values that share a parent on one row. */
  group: string;
  field: string;
  value: number;
  /** Why the value is exempt, when it is opted out. */
  optOut?: string;
}
export interface Structural {
  file: string;
  path: string;
  type: "added" | "removed" | "replaced";
  before?: Value;
  after?: Value;
}
export interface FileDiff {
  changed: Changed[];
  unchanged: Unchanged[];
  structural: Structural[];
}
export interface DiffOptions {
  /** Changes over this percentage are large. */
  threshold: number;
  /** The later of the two years, for `bracketsFrozenSince`. */
  laterYear: number;
}

type Seg = string | number;

/** `childBenefit.params.perChild`, `brackets[2].limit`, `credits[ontario-sales-tax-credit].params.rate`. */
export function formatPath(segs: Seg[]): string {
  return segs.map((s, i) => (typeof s === "number" ? `[${s}]` : s.startsWith("[") || !i ? s : `.${s}`)).join("");
}

const isIndex = (s: Seg | undefined) => typeof s === "number" || (s?.startsWith("[") ?? false);

/**
 * Splits a path into the object it belongs to and the field within it: `credits[x].params` + `adult`,
 * `childBenefit.params` + `under6[1]`, `brackets` + `[2].limit`. Top-level fields have an empty group.
 */
export function splitPath(segs: Seg[]): { group: string; field: string } {
  let i = segs.length;
  while (i > 0 && isIndex(segs[i - 1])) i--;
  if (i > 0) i--;
  while (i > 0 && isIndex(segs[i - 1])) i--;
  return { group: formatPath(segs.slice(0, i)), field: formatPath(segs.slice(i)) };
}

/** Whether a number is an indexable amount, a rate, or neither. */
export function classify(segs: Seg[], value: unknown): "amount" | "rate" | "other" {
  if (typeof value !== "number" || !Number.isFinite(value) || value === 0) return "other";
  const named = segs.filter((s): s is string => typeof s === "string" && !s.startsWith("["));
  const leaf = named.at(-1) ?? "";
  if (NOT_MONEY.has(leaf)) return "other";
  if (Math.abs(value) < 1) return "rate";
  if (named.slice(-2).some(k => RATE_KEY.test(k))) return "rate";
  return "amount";
}

const programOf = (t: Tree | undefined) => {
  const p = t?.kind === "map" ? t.entries.get("program") : undefined;
  return p?.kind === "scalar" && typeof p.value === "string" ? p.value : undefined;
};

/** Keys for a list's items: by `program` (or `name`) when every item has a distinct one, else by position. */
function itemKeys(a: Tree[], b: Tree[]): [Seg[], Seg[]] {
  for (const field of ["program", "name"]) {
    const keyOf = (t: Tree) => {
      const v = t.kind === "map" ? t.entries.get(field) : undefined;
      return v?.kind === "scalar" && typeof v.value === "string" ? `[${v.value}]` : undefined;
    };
    const ka = a.map(keyOf);
    const kb = b.map(keyOf);
    const ok = (ks: (string | undefined)[]) => ks.every(k => k !== undefined) && new Set(ks).size === ks.length;
    if (a.length + b.length > 0 && ok(ka) && ok(kb)) return [ka as Seg[], kb as Seg[]];
  }
  return [a.map((_, i) => i), b.map((_, i) => i)];
}

/** Plain value of a subtree, for the report. */
export function plain(t: Tree | undefined): Value {
  if (!t) return undefined;
  if (t.kind === "scalar") return t.value;
  if (t.kind === "seq") return t.items.map(plain);
  return Object.fromEntries([...t.entries].filter(([k]) => !SKIP_KEYS.has(k)).map(([k, v]) => [k, plain(v)]));
}

/**
 * Compares two parsed files. `earlier` and `later` are in calendar order; either may be missing (a file added or
 * removed between the years).
 */
export function diffTrees(file: string, earlier: Tree | undefined, later: Tree | undefined, opts: DiffOptions) {
  const out: FileDiff = { changed: [], unchanged: [], structural: [] };
  const top = (t: Tree | undefined, k: string) => (t?.kind === "map" ? t.entries.get(k) : undefined);
  const frozen = [top(later, "bracketsFrozenSince"), top(earlier, "bracketsFrozenSince")]
    .map(t => (t?.kind === "scalar" && typeof t.value === "number" ? t.value : undefined))
    .find(v => v !== undefined);
  const frozenLimit = (segs: Seg[]) =>
    frozen !== undefined &&
    frozen <= opts.laterYear &&
    segs.length === 3 &&
    segs[0] === "brackets" &&
    segs[2] === "limit";

  const walk = (a: Tree | undefined, b: Tree | undefined, segs: Seg[]): void => {
    const p = formatPath(segs);
    if (!a && !b) return;
    if (!a) return void out.structural.push({ file, path: p, type: "added", after: plain(b) });
    if (!b) return void out.structural.push({ file, path: p, type: "removed", before: plain(a) });
    const [pa, pb] = [programOf(a), programOf(b)];
    if (a.kind !== b.kind || pa !== pb) {
      return void out.structural.push({ file, path: p, type: "replaced", before: plain(a), after: plain(b) });
    }
    if (a.kind === "map" && b.kind === "map") {
      const keys = [...b.entries.keys(), ...[...a.entries.keys()].filter(k => !b.entries.has(k))];
      for (const k of keys) {
        // `year` changes every time; it isn't a parameter.
        if (SKIP_KEYS.has(k) || (k === "year" && !segs.length)) continue;
        walk(a.entries.get(k), b.entries.get(k), [...segs, k]);
      }
      return;
    }
    if (a.kind === "seq" && b.kind === "seq") {
      const [ka, kb] = itemKeys(a.items, b.items);
      const byKey = new Map(ka.map((k, i) => [k, a.items[i]]));
      // Bracket rows are [limit, rate] pairs: name the two columns.
      const tuple = segs.length === 2 && segs[0] === "brackets";
      const seg = (k: Seg): Seg => (tuple && typeof k === "number" ? (["limit", "rate"][k] ?? k) : k);
      for (const [i, k] of kb.entries()) walk(byKey.get(k), b.items[i], [...segs, seg(k)]);
      for (const [i, k] of ka.entries()) if (!kb.includes(k)) walk(a.items[i], undefined, [...segs, seg(k)]);
      return;
    }
    if (a.kind !== "scalar" || b.kind !== "scalar") return;
    const [x, y] = [a.value, b.value];
    if (Object.is(x, y)) {
      if (classify(segs, y) !== "amount") return;
      const optOut = frozenLimit(segs)
        ? `bracketsFrozenSince: ${frozen}`
        : a.optOut || b.optOut
          ? "not indexed comment"
          : undefined;
      out.unchanged.push({ file, path: p, ...splitPath(segs), value: y as number, ...(optOut ? { optOut } : {}) });
      return;
    }
    const numeric = typeof x === "number" && typeof y === "number";
    const pct =
      numeric && Number.isFinite(x) && Number.isFinite(y) && x !== 0 ? ((y - x) / Math.abs(x)) * 100 : undefined;
    // From or to zero, or to or from no limit, is as large as a change gets.
    const large = numeric && (pct === undefined || Math.abs(pct) > opts.threshold);
    out.changed.push({ file, path: p, before: x, after: y, ...(pct === undefined ? {} : { pct }), large });
  };
  walk(earlier, later, []);
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// Whole years.

export interface Report extends FileDiff {
  /** The year under review and the year it's compared with. */
  year: number;
  base: number;
  threshold: number;
}

/** Files of a year as `label → YAML source`: `federal`, then each province by code. */
export function readYearFiles(dataDir: string, year: number): Map<string, string> {
  const dir = path.join(dataDir, String(year));
  const files = new Map([["federal", fs.readFileSync(path.join(dir, "federal.yaml"), "utf8")]]);
  const provDir = path.join(dir, "provinces");
  for (const f of fs
    .readdirSync(provDir)
    .filter(f => f.endsWith(".yaml"))
    .sort()) {
    files.set(path.basename(f, ".yaml"), fs.readFileSync(path.join(provDir, f), "utf8"));
  }
  return files;
}

/** Compares the files of `year` with those of `base`, in calendar order whichever comes first. */
export function diffYears(
  year: number,
  files: Map<string, string>,
  base: number,
  baseFiles: Map<string, string>,
  threshold = 15,
): Report {
  const [earlier, later] = base < year ? [baseFiles, files] : [files, baseFiles];
  const labels = [...new Set([...later.keys(), ...earlier.keys()])];
  const report: Report = { year, base, threshold, changed: [], unchanged: [], structural: [] };
  for (const label of labels) {
    const parse = (src: string | undefined) => (src === undefined ? undefined : parseTree(src));
    const d = diffTrees(label, parse(earlier.get(label)), parse(later.get(label)), {
      threshold,
      laterYear: Math.max(year, base),
    });
    report.changed.push(...d.changed);
    report.unchanged.push(...d.unchanged);
    report.structural.push(...d.structural);
  }
  return report;
}

/** The previous year when it has data, otherwise the nearest year that does (the earlier one on a tie). */
export function defaultBase(year: number, available: number[]): number | undefined {
  return available
    .filter(y => y !== year)
    .sort((a, b) => Math.abs(a - year) - Math.abs(b - year) || a - b)
    .at(0);
}

// ---------------------------------------------------------------------------------------------------------------
// Markdown.

export function formatValue(v: Value, max = 80): string {
  const f = (x: Value): string => {
    if (x === Number.POSITIVE_INFINITY) return ".inf";
    if (x === Number.NEGATIVE_INFINITY) return "-.inf";
    if (Array.isArray(x)) return `[${x.map(f).join(", ")}]`;
    if (x && typeof x === "object") {
      return `{${Object.entries(x)
        .map(([k, y]) => `${k}: ${f(y)}`)
        .join(", ")}}`;
    }
    if (typeof x === "string") return /^[\w .,%$()/-]*$/.test(x) && x !== "" ? x : JSON.stringify(x);
    return String(x);
  };
  const s = f(v);
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

const cell = (s: string) => s.replace(/\|/g, "\\|");
const code = (s: string) => `\`${s.replace(/`/g, "'")}\``;
const pctText = (p: number | undefined) => (p === undefined ? "n/a" : `${p > 0 ? "+" : ""}${p.toFixed(1)}%`);
const count = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Runs of unchanged values in the same file, object and opt-out reason, one report row each. */
function grouped(rows: Unchanged[]) {
  const out: { file: string; group: string; why: string; values: string }[] = [];
  let last: (typeof out)[number] | undefined;
  for (const u of rows) {
    const why = u.optOut ?? "";
    const item = `${code(u.field)} ${formatValue(u.value)}`;
    if (last && last.file === u.file && last.group === u.group && last.why === why) {
      last.values += `, ${item}`;
    } else {
      last = { file: u.file, group: u.group, why, values: item };
      out.push(last);
    }
  }
  return out;
}

export function formatReport(r: Report): string {
  const [y1, y2] = r.base < r.year ? [r.base, r.year] : [r.year, r.base];
  const flagged = r.unchanged.filter(u => !u.optOut);
  const optedOut = r.unchanged.filter(u => u.optOut);
  const large = r.changed.filter(c => c.large);
  const by = (t: Structural["type"]) => r.structural.filter(s => s.type === t).length;
  const changedTable = (rows: Changed[]) => [
    `| File | Field | ${y1} | ${y2} | Change |`,
    "|---|---|--:|--:|--:|",
    ...rows.map(
      c =>
        `| ${c.file} | ${code(c.path)} | ${cell(formatValue(c.before, 40))} | ${cell(formatValue(c.after, 40))} | ` +
        `${typeof c.before === "number" && typeof c.after === "number" ? pctText(c.pct) : ""} |`,
    ),
  ];
  const out = [
    `## Data diff: ${r.year} against ${r.base}`,
    "",
    `${count(r.changed.length, "value")} changed from ${y1} to ${y2} (${large.length} over ${r.threshold}%), ` +
      `${count(flagged.length, "amount")} suspiciously unchanged, ${by("added")} added, ${by("removed")} removed, ` +
      `${by("replaced")} replaced. ${count(optedOut.length, "unchanged value")} opted out.`,
    "",
    `### Suspiciously unchanged (${flagged.length})`,
    "",
  ];
  if (flagged.length) {
    out.push(
      "Amounts, thresholds and bracket limits that are the same in both years. If one is meant to stay put, say so " +
        "with a `# not indexed` comment on its line (or `bracketsFrozenSince` for bracket limits).",
      "",
      "| File | In | Unchanged values |",
      "|---|---|---|",
      ...grouped(flagged).map(g => `| ${g.file} | ${g.group ? code(g.group) : ""} | ${g.values} |`),
    );
  } else out.push("None.");
  out.push("", `### Large changes, over ${r.threshold}% (${large.length})`, "");
  out.push(...(large.length ? changedTable(large) : ["None."]));
  out.push("", `### Added, removed and replaced (${r.structural.length})`, "");
  if (r.structural.length) {
    out.push(
      "| File | Field | | Value |",
      "|---|---|---|---|",
      ...r.structural.map(s => {
        const v =
          s.type === "replaced"
            ? `${formatValue(s.before, 60)} → ${formatValue(s.after, 60)}`
            : formatValue(s.type === "added" ? s.after : s.before);
        return `| ${s.file} | ${code(s.path)} | ${s.type} | ${cell(v)} |`;
      }),
    );
  } else out.push("None.");
  if (r.changed.length) {
    out.push("", `<details><summary>All ${count(r.changed.length, "changed value")}</summary>`, "");
    out.push(...changedTable(r.changed), "", "</details>");
  }
  if (optedOut.length) {
    out.push("", `<details><summary>${count(optedOut.length, "unchanged value")} opted out</summary>`, "");
    out.push("| File | In | Unchanged values | Why |", "|---|---|---|---|");
    out.push(...grouped(optedOut).map(g => `| ${g.file} | ${g.group ? code(g.group) : ""} | ${g.values} | ${g.why} |`));
    out.push("", "</details>");
  }
  return `${out.join("\n")}\n`;
}

// ---------------------------------------------------------------------------------------------------------------
// Command line.

function main() {
  const usage = "usage: npm run year-diff -- <year> [<base-year>] [--threshold <percent>] [--data <dir>]";
  const fail = (msg: string): never => {
    console.error(`${msg}\n${usage}`);
    process.exit(1);
  };
  const { positionals, values } = (() => {
    try {
      return parseArgs({
        allowPositionals: true,
        options: { threshold: { type: "string" }, data: { type: "string" } },
      });
    } catch (e) {
      return fail((e as Error).message);
    }
  })();
  const dataDir = path.resolve(values.data ?? path.join(import.meta.dirname, "../data/years"));
  const available = fs.existsSync(dataDir)
    ? fs
        .readdirSync(dataDir)
        .filter(d => /^\d{4}$/.test(d))
        .map(Number)
    : [];
  const asYear = (s: string | undefined, what: string) => {
    const y = Number(s);
    if (!s || !/^\d{4}$/.test(s)) fail(`${what} must be a four-digit year`);
    if (!available.includes(y)) fail(`no data for ${y} in ${dataDir} (have ${available.sort().join(", ") || "none"})`);
    return y;
  };
  if (positionals.length < 1 || positionals.length > 2) fail("give one year, and optionally a base year");
  const year = asYear(positionals[0], "year");
  const base = positionals[1] ? asYear(positionals[1], "base year") : defaultBase(year, available);
  if (base === undefined) return fail(`no other year to compare ${year} with`);
  if (base === year) fail("the base year must differ from the year");
  const threshold = values.threshold === undefined ? 15 : Number(values.threshold);
  if (!Number.isFinite(threshold) || threshold < 0) fail("--threshold must be a non-negative number");
  const report = diffYears(year, readYearFiles(dataDir, year), base, readYearFiles(dataDir, base), threshold);
  process.stdout.write(formatReport(report));
}

if (import.meta.main) main();

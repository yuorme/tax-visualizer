// Independent audit: no engine or YAML imports. Constants transcribed from 2025 Schedule F and the
// 2026 Finances Québec parameter table (rate/thresholds only). The 2026 caps/rules continue 2025 provisionally.
// See docs/verification/91-qc-health-fund.md. Values copied from YAML would test arithmetic, not data.
export interface FormIncome {
  ord?: number;
  oth?: number;
  cg?: number;
  ed?: number;
  nd?: number;
  fd?: number;
  ded?: number;
  rrsp?: number;
  fhsa?: number;
}
export interface FormAdjustments {
  forestAveraging?: number;
  employmentCorrection?: number;
  // Amounts already included in total income / oth, by Schedule F line number.
  exclusions?: Partial<Record<20 | 22 | 26 | 28 | 29 | 30 | 31 | 33, number>>;
  deductions?: Partial<Record<41 | 42 | 43 | 43.1 | 44 | 45 | 46 | 54 | 56 | 58 | 60 | 62, number>>;
}

export function scheduleF(year: number, x: FormIncome, a: FormAdjustments = {}) {
  if (year !== 2025 && year !== 2026) throw new Error("audit supports only 2025/2026");
  const threshold = year === 2025 ? 18130 : 18500;
  const upper = year === 2025 ? 63060 : 64355;
  const lines: Record<number, number> = {};
  // TP-1 line 199 uses taxable gains and grossed-up dividends. Do not start with net income (275).
  lines[10] =
    (x.ord ?? 0) +
    (x.oth ?? 0) +
    Math.max(0, x.cg ?? 0) / 2 +
    (x.ed ?? 0) * 1.38 +
    (x.nd ?? 0) * 1.15 +
    (x.fd ?? 0) +
    (a.forestAveraging ?? 0);
  const done = (contribution: number) => ({ lines, contribution });
  if (lines[10] <= threshold) return done(0);
  lines[12] = x.ord ?? 0;
  lines[14] = a.employmentCorrection ?? 0;
  lines[16] = lines[12] + lines[14];
  lines[18] = lines[10] - lines[16];
  if (lines[18] <= threshold) return done(0);
  for (const n of [20, 22, 26, 28, 29, 30, 31, 33] as const) lines[n] = a.exclusions?.[n] ?? 0;
  lines[23] = (x.ed ?? 0) * 1.38 + (x.nd ?? 0) * 1.15;
  lines[24] = (x.ed ?? 0) + (x.nd ?? 0);
  lines[25] = lines[23] - lines[24];
  lines[34] = [20, 22, 25, 26, 28, 29, 30, 31, 33].reduce((s, n) => s + lines[n], 0);
  lines[36] = lines[18] - lines[34];
  if (lines[36] <= threshold) return done(0);
  for (const n of [41, 42, 43, 43.1, 44, 45, 46, 54, 56, 58, 60, 62] as const) lines[n] = a.deductions?.[n] ?? 0;
  lines[68] = [41, 42, 43, 43.1, 44, 45, 46, 54, 56, 58, 60, 62].reduce((s, n) => s + lines[n], 0);
  lines[70] = lines[36] - lines[68];
  if (lines[70] <= threshold) return done(0);
  // Choose ONE column, then follow lines 76–82 vertically; do not sum two bracket charges.
  const right = lines[70] > upper;
  lines[76] = lines[70];
  lines[77] = right ? upper : threshold;
  lines[78] = Math.max(0, lines[76] - lines[77]);
  lines[80] = lines[78] / 100;
  lines[81] = right ? 150 : 0;
  lines[82] = Math.min(lines[80] + lines[81], right ? 1000 : 150);
  return done(lines[82]);
}

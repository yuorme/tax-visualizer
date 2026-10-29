import type { Brackets, PhasedAmount } from "../data/schema.ts";

export interface BracketLine { lo: number; hi: number; r: number; part: number; t: number }
export interface BracketResult { tax: number; marg: number; lines: BracketLine[] }

/** Tax on `inc` under progressive brackets, with the per-bracket breakdown and the top rate reached. */
export function walk(brackets: Brackets, inc: number): BracketResult {
  let lo = 0, tax = 0, marg = brackets[0][1];
  const lines = brackets.map(([hi, r]) => {
    const part = Math.max(0, Math.min(inc, hi) - lo);
    const t = part * r;
    if (inc > lo) marg = r;
    const line = { lo, hi, r, part, t };
    tax += t; lo = hi; return line;
  });
  return { tax, marg, lines };
}

/** A fixed amount, or one that shrinks linearly from max to min across [from, to] of net income. */
export function phased(spec: number | PhasedAmount, inc: number): number {
  if (typeof spec === "number") return spec;
  const t = Math.min(1, Math.max(0, (inc - spec.from) / (spec.to - spec.from)));
  return spec.max - (spec.max - spec.min) * t;
}

// Reduces a household result to the numbers worth locking down, rounded to the nearest 0.0001 (a hundredth of a cent).
const r4 = v => typeof v === "number" ? (Number.isFinite(v) ? Math.round(v * 1e4) / 1e4 : String(v)) : v;
const nums = o => Object.fromEntries(Object.entries(o).filter(([, v]) => typeof v === "number").map(([k, v]) => [k, r4(v)]));
export function snapshot(h) {
  return {
    ...nums(h),
    margBy: nums(h.margBy),
    credits: h.credits.map(([n, v]) => [n, r4(v)]),
    claim: h.claim ? nums({ ...h.claim, qc: h.claim.qc ? 1 : 0 }) : null,
    claimKind: h.claim ? h.claim.kind : null,
    people: h.list.map(r => ({
      ...nums(r), fTax: r4(r.f.tax), pTax: r4(r.pr.tax), fMarg: r4(r.f.marg), pMarg: r4(r.pr.marg),
      pay: nums(r.pay),
    })),
  };
}

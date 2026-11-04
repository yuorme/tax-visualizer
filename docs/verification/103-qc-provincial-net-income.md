# Quebec provincial benefit income bases (#103)

The correction covers every supported year, **2019–2026**. Family Allowance, solidarity and the work-premium
reduction use Quebec net family income after the worker deduction. Federal CCB, GST/Groceries and Essentials,
and CWB retain federal net income. Federal childcare deductions do not reduce any of these Quebec bases.

## Sources, checked separately

- **Family Allowance:** [Retraite Québec's income definition][family] explicitly identifies line 275 of each
  spouse's Quebec return. Cached at `2026/sources/quebec-family-income.txt`. Retraite Québec administers this
  benefit; the underlying Revenu Québec return establishes which deductions enter line 275.
  `2019/sources/provincial-quebec-family-history.txt` also describes family income as the individual's net income
  plus the spouse's net income. It documents the historical by-child schedule separately from the later flat rate.
  This fiche is the **2025 edition**, despite its cache directory. No year-specific primary source for the
  **2019–2025 Family Allowance income definition** has been verified here: that historical conclusion rests
  on the Retraite Québec page and this fiche, not a separate publication for each tax year.
- **Solidarity:** each year's Revenu Québec TP-1 guide explicitly identifies the line 275 sum for that year:
  [2019, PDF page 24][guide2019]; [2020, page 20][guide2020]; [2021, page 20][guide2021];
  [2022, page 12][guide2022]; [2023, page 12][guide2023]; [2024, page 12][guide2024];
  and [2025, page 12][guide]. Each is cached at `<year>/sources/qc-solidarity-guide.txt`, with the source URL,
  retrieval date and original PDF hash in the extract and the year's source index. The guides separately discuss
  worldwide income for part-year residents; this app does not model residence changes.
  The earlier `provincial-quebec-solidarity-history.txt` copies under 2019–2023 all contain the **2025-edition**
  fiche, and no such copy exists under 2024. They are not year-specific evidence; the guides above supply it.
  Special deemed-zero rules for social-assistance recipients are outside the model's supported inputs.
- **Work premium:** [2025 Schedule P][premium], Part C lines 52–54, adds the two line 275 amounts without an
  addback for the worker deduction. Parts A and E separately calculate work income and the phase-in; the worker
  deduction does **not** reduce work income. Cached at `2025/sources/qc-work-premium-income.txt`.
  Each of `2019` through `2024` has a cached `sources/provincial-quebec-work-premium.txt`; each Part C uses the
  same lines 52–54 and the same definition. The model covers employment, not Schedule P's additional special
  work-income categories or the adapted premium/supplement.
- **Quebec childcare:** [2025 Schedule C][childcare], Part C lines 76–80, uses the two line 275 amounts;
  cached at `2025/sources/quebec-childcare-schedule.txt`. Its existing provincial income base already includes
  the worker deduction. This correction shares that base; it does not change the childcare credit's formula.
- **Line 275 construction:** [2025 TP-1 return][return], PDF page 3, includes the worker deduction at line 201
  in deductions at line 254, then floors net income at zero at line 275. Cached at
  `138-senior-credit-rules/sources/qc-return-2025.txt`. Historical returns are cached separately in each of
  `2019` through `2024` as `sources/provincial-quebec-return.txt`. The worker deduction exists throughout.

There is no verified 2019–2024 difference in these income definitions that requires another program id or
year-selected income rule. Existing YAML still selects each year's worker cap, benefit parameters and the
2019 by-child Family Allowance program. The 2026 calculation continues the published income definitions with
the existing 2026 parameters; a final 2026 Schedule P is not part of this verification.

The solidarity HTML pages returned HTTP 403 to the source-cache script. The linked official PDF guide supplied
the same definition and was successfully cached instead. Cache headers and `sources/INDEX.md` record hashes.

## Implementation boundary

For supported income and deductions, `PersonResult.tiP` equals Quebec line 275. The existing
`breakdown.incomeBases.provincialFamily` sums those individually floored amounts for spouses, or uses only the
first person's amount without a spouse. Household benefits now receive this base. Quebec credits receive it
through `CreditInput.provincialFamNet`; `famNet` remains the federal base. Direct formula callers may omit the
provincial field only when their scalar `famNet` represents both bases.

The earlier household `provincialNets` variable is before the worker deduction and still serves existing
non-refundable-credit and claimant logic. Those paths are outside #103. Replacing it globally would change
unrelated behavior. Future below-net-income provincial deductions must distinguish taxable income from line 275
before extending this shared base; they are not currently separate inputs.

## Independent calculations and new golden coverage

`tests/golden/features/qc-provincial-net-income.json` contains static expected values calculated without engine
helpers. `tests/qc-provincial-net-income.test.ts` runs each case through the household caller.
For these ordinary employment/other-income specimens:

```text
enhanced QPP = max(0, min(wages, YMPE) - exemption) × first additional rate
            + max(0, min(wages, YAMPE) - YMPE) × second additional rate
federal net before childcare = max(0, wages + other income - deductions - enhanced QPP)
worker deduction = min(year's cap, max(0, wages) × 6%)
line 275 = max(0, federal net before childcare - worker deduction)
Quebec family income = line 275 + spouse's line 275, if applicable
Family Allowance = max(minimum, maximum - 4% × max(0, family income - threshold))
solidarity = max(0, QST + housing + child amounts - 6% × max(0, family income - threshold))
work premium = max(0, rate × max(0, min(work income, threshold) - excluded income)
                   - 10% × max(0, family income - threshold))
```

The unchanged display filter drops refundable credits below $0.50. Golden endpoints include $10 below the
zero cutoff so they also exercise a positive displayed credit, plus $1 below, exactly at and $1 above it.
All parameters come from the year's already sourced QC/federal YAML; this task verifies income bases,
not the completeness of existing benefit components, eligibility or payment-period conventions.

| Changed or protected path | Golden case IDs (year prefix omitted) |
| --- | --- |
| Family Allowance after worker deduction, 2019–2026 | `parent-worker-cap` |
| 2019 by-child schedule with multiple children | `by-child-two-children` |
| Solidarity reduction, 2019 | `by-child-two-children` |
| Solidarity reduction, 2020–2021 | `parent-worker-cap` |
| Solidarity reduction, 2022–2026 | `parent-worker-cap`, `couple-two-worker-deductions` |
| Work premium: single, couple, couple with children, 2019–2026 | `single-work-premium`, `couple-work-premium`, `couple-parent-work-premium` |
| Work premium: single parent, phase-in, cap and reduction boundaries | `work-exclusion-*`, `work-cap-*`, `premium-start-*`, `premium-end-*` |
| Family Allowance maximum and minimum boundaries | `family-start-*`, `family-minimum-*` |
| Solidarity start and zero boundaries | `solidarity-start-*`, `solidarity-end-*` |
| Worker deduction below/at/above its cap | `worker-cap-*` |
| Per-spouse zero floor before aggregation | `zero-floor-spouse` |
| No worker deduction for investment/other income | `no-employment` |
| Federal childcare exclusion from Quebec bases | `childcare-federal-only` |

Additional regression tests remove the provincial-only worker deduction in copied province data. Federal net,
CCB and federal refundable credits must remain identical. Work-premium phase-in stays unchanged; its reduction
changes by 10% of the worker deduction. Two childcare cases exercise both the work-premium reduction and the
Family Allowance/solidarity reductions, while preserving Quebec childcare credit income and checking its payment.
A separate test excludes a second adult who is not a spouse from Quebec benefit family income.

For the issue's 2026 single parent earning $55,000:

- Enhanced QPP: `(55000 - 3500) × 1% = 515`; federal net is **54,485**.
- Worker deduction: `min(1450, 55000 × 6%) = 1450`; line 275 is **53,035**.
- Family Allowance: `4145 - 4% × (53035 - 44032) = 3784.88`, formerly **3726.88**.
- Solidarity: `363 + 172 + 746 + 158 - 6% × (53035 - 43195) = 848.60`, formerly **761.60**.
- An $8,000 federal childcare claim lowers federal net to **46,485**; Quebec income stays **53,035**.
  Quebec childcare credit remains `8000 × 70% = 5600`.

## Existing assertions: before and after

[`103-golden-changes.json`](103-golden-changes.json) lists every changed existing golden leaf with file,
case, path, before and after. There are **3,838 changed leaves in 588 QC cases**: 587 shared/other-income snapshots
plus one QPP feature assertion. No input, tolerance, assertion count or non-QC cell was changed.

The snapshot audit first reproduced each old QC snapshot using the pre-fix household code, then independently
calculated each benefit delta from the equations above. Let `D(h)` be the increase in household benefits:

- `provBen` and `childBen` increase by the Family Allowance delta.
- `refund` increases by the solidarity/work-premium delta; `benefits` increases by their sum `D(h)`.
- `total` and `netTotal` decrease by `D(h)`; `avg` decreases by `D(h) / cash` when cash is positive.
- Each marginal rate changes by `(D(h) - D(h with $100 more of that income)) / 100`.
- Investment tax changes by `D(h without investment income) - D(h)`.
- The audit asserted that every remaining snapshot field, including CCB, federal family net income, personal
  tax, payroll and claim elections, stayed identical. Existing four-decimal rounding was preserved.

The QPP specimen `quebec-childcare-claimant-follows-qpp-net-income` changes **1943.92 → 2001.92**:
its synthetic QPP gives pre-childcare federal nets 44,000 and 44,500; subtracting the first spouse's 1,450
worker deduction makes Quebec family income 87,050 instead of 88,500. Family Allowance rises by `1450 × 4% = 58`.

One changed non-golden numerical assertion is in `tests/engine-other-income.test.ts`, the QC branch of
“other income counts in family net income for child benefits, but not in working income.” Its expected
Family Allowance changes **7305.88 → 7340**. Wages 15,000 plus other income 30,000 give federal net 44,885 and
Quebec net 43,985 after the 900 worker deduction. The latter is below the 44,032 reduction threshold;
the former reduces the full 7,340 benefit (including 127 for school supplies) by 34.12.
The helper now selects the appropriate base for QC only.
The childcare test changes an obsolete comment only; its assertions are preserved.

`tests/e2e/smoke.mjs` also guards three obsolete legacy-page expectations before correcting them:

- “income 28k, 1 child, rent”: QC net rate **−27.0% → −27.5%**, with QC ordered before BC at −27.1%.
  Work premium increases `1450 × 10% = 145`; the net-rate change is `−145 / 28000 × 100 = −0.517857` points.
  The employment marginal rate remains 31.8%. Phone displays omit the percent sign.
- “partner, BC home, $ view”: desktop QC tax label **$26.6k → $26.5k**. Two workers' deductions increase
  Family Allowance by `2 × 1450 × 4% = 116`. Mobile's rounded label and the 46.0% marginal rate do not change.
- “investments, Quebec destination” and “home value, taxable spending, sort”: after #91's existing health-fund
  correction, QC investment tax **$9,871 → $9,987** and its difference from BC **+$2,710 → +$2,826**.
  Actual investment income puts Family Allowance at its minimum; the counterfactual without investments gains
  the extra 116 allowance, increasing the investment-tax difference by 116. BC's 7,161 stays unchanged.

The first full check found these intended legacy differences; it did not hit the #174 health-fund flake.
The legacy HTML and the empty `KNOWN` failure list remain unchanged. Every obsolete value is asserted before
replacement; the rest of each captured state still compares exactly.

## Review-round integration with main

PR #181 was observed merged on the first 30-second poll, before fetching. Main was merged once at
`e96fa43` (including #181's PE and #183's AB corrections). The conflicting files were
`tests/golden/2025.json`, `tests/golden/2026.json` and `tests/golden/other-income-original.json`.
A three-way JSON leaf merge retained this branch's QC values and main's values for every other province,
including AB and PE. Each province subtree was checked against its respective parent after reconciliation.
**No leaf was changed differently by both parents**, so no combined calculation or new expected value was needed.
The original QC before/after ledger and all scenario inputs remain unchanged; no golden capture was run.

[family]: https://www.retraitequebec.gouv.qc.ca/en/citizens/children/family-allowance/quebec-income-tax-return
[guide]: https://www.revenuquebec.ca/documents/en/formulaires/tp/2025-12/TP-1.G-V(2025-12).pdf
[guide2019]: https://www.revenuquebec.ca/documents/en/formulaires/tp/2019-12/TP-1.G-V(2019-12).pdf
[guide2020]: https://www.revenuquebec.ca/documents/en/formulaires/tp/2020-12/TP-1.G-V(2020-12).pdf
[guide2021]: https://www.revenuquebec.ca/documents/en/formulaires/tp/2021-12/TP-1.G-V(2021-12).pdf
[guide2022]: https://www.revenuquebec.ca/documents/en/formulaires/tp/2022-12/TP-1.G-V(2022-12).pdf
[guide2023]: https://www.revenuquebec.ca/documents/en/formulaires/tp/2023-12/TP-1.G-V(2023-12).pdf
[guide2024]: https://www.revenuquebec.ca/documents/en/formulaires/tp/2024-12/TP-1.G-V(2024-12).pdf
[premium]: https://www.revenuquebec.ca/documents/en/formulaires/tp/2025-12/TP-1.D.P-V(2025-12).pdf
[childcare]: https://www.revenuquebec.ca/documents/en/formulaires/tp/2025-12/TP-1.D.C-V(2025-12).pdf
[return]: https://www.revenuquebec.ca/documents/en/formulaires/tp/2025-12/TP-1.D-V(2025-12).pdf

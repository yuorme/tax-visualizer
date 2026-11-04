# Issue 102: CWB secondary-earner adjusted-net-income cap

## Verified rule and scope

The original exemption used only working income and the annual ceiling. It could remove more than the
secondary earner's entire adjusted net income from the family's phase-out base.

Sources fetched with `fnm exec --using=26 npm run fetch-source` on 2026-11-04:

- [2025 Schedule 6, cached text](2025/sources/issue-102-schedule6.txt), pages 2–4.
- [Income Tax Act s.122.7, cached text](2025/sources/issue-102-ita-122-7.txt), subsections (1.3) and (5).
- [2021 Schedule 6, existing cache](2021/sources/federal-schedule6-5000.txt), lines 12–14, confirms the
  same net-income cap when the secondary-earner exemption began. The 2019–2020 exemption is zero.

Schedule 6 selects the spouse with lower working income, then limits the exemption to that person's
working income, adjusted net income and the annual ceiling. Lines 7–12 start with federal net income,
adjust for exempt income, UCCB/RDSP payments and repayments, and floor each person's result at zero.
Those special adjustments are outside the model; its federal net income already includes enhanced
CPP/QPP, generic deductions, itemized RRSP/FHSA and allocated federal childcare deductions.
Do not substitute Quebec provincial taxable income or net income before childcare.

For equal working income, line 14 selects the claimant's spouse. Either spouse may claim the basic CWB
(Schedule 6 Step 2 and s.122.7(5)); the household model chooses the election yielding the larger exemption.
This is an inference from the permitted elections, not an extra statutory tie-breaker. Partner order and
the adult selected for marginal rates do not choose the CWB claimant. Disability supplements remain excluded.

No data parameters or stated scope limits change. The 2026 CWB parameters retain their existing estimated
status. These are independently calculated rule specimens, not CRA-published household tax totals.

## Implementation and rule-to-golden mapping

`household` passes its final per-person federal net incomes to `creditsOf`. Direct callers may omit them
when there is no allocated childcare; `netOf` then supplies the same deduction-aware income using the
province's pension plan. The cap is applied before either the standard/regional or Quebec CWB formula.

All case IDs below have year prefixes `2025-` and `2026-` in
`tests/golden/features/cwb-secondary-cap.json`. Each runs with both partner orders. The runner checks
the per-person federal net incomes as well as CWB. Every non-childcare specimen also tests the direct-call fallback.

| Rule path / boundary | Golden suffixes |
| --- | --- |
| Net-income cap, standard and both regional schedules | `ON-low-net`, `AB-low-net`, `NU-low-net` |
| Quebec formula uses federal adjusted income | `QC-low-net`, `QC-childcare-net` |
| Generic and itemized deductions | `ON-low-net`, `ON-itemized-claims` |
| Net income just above zero, zero and negative before flooring | `ON-above-zero-net`, `ON-zero-net`, `ON-negative-net` |
| Select by working income, not the lowest net income | `ON-working-order-not-net-order` |
| Working-income limit and both sides of equality | `ON-working-cap`, `ON-below-working-cap`, `ON-net-equals-work` |
| Working-income limit above equality | `ON-above-working-cap` |
| Annual ceiling and both sides of equality | `ON-annual-cap`, `ON-below-annual-cap`, `ON-at-annual-cap` |
| Annual ceiling above equality | `ON-above-annual-cap` |
| Equal earnings: best legal claimant election | `ON-tied-working-income` |
| Zero-working-income spouse receives no exemption | `ON-nonworking-spouse` |
| Caller passes post-childcare income | `ON-childcare-net`, `QC-childcare-net` |

Additional targeted tests preserve single/unrelated-adult behavior and reproduce the issue's exact household.
The 2024 reference-test helper now supplies its intended net-income split explicitly; the existing form-line
inputs, expected $2,589 and tolerance stay unchanged. Those synthetic specimens deliberately supply family
net income independently of employment income, so deriving it from payroll would contradict their premise.

## Independent calculations for the new fixture

All specimen earnings are below the first pension ceiling. Enhanced CPP/QPP is 1% of earnings over $3,500
in both data years: $45,000 -> $415, $35,000 -> $315, $30,000 -> $265, $20,000 -> $165,
$15,000 -> $115 and $10,000 -> $65. Subtract these and the stated deductions, adding other income,
then floor at zero. Other income affects adjusted net income, never working income or spouse selection.

For the original issue, the spouses' net incomes are $44,585 and $885. The exemption is $885, leaving
$44,585 for phase-out. Thus 2025 CWB is `2813 - .15 * (44585 - 30639) = 721.10` and 2026 CWB is
`2869 - .15 * (44585 - 31251) = 868.90`. Before the fix these were $2,813 and $2,869 respectively.

For AB and NU, substitute their loaded maximum, threshold and reduction rate. For QC with no children,
the phase-in maximum is `(19534 - 3600) * .373 = 5943.382` in 2025 and
`(19828 - 3600) * .373 = 6053.044` in 2026; subtract 20% above $21,787.19 / $22,223.
All new couple cases are beyond their phase-in maxima. Clamp a negative final CWB at zero.

The childcare specimens use one child aged three, $8,000 expenses and explicit $15,000 lower-spouse
earnings. T778 permits the $8,000 deduction, alongside $6,000 RRSP, leaving that spouse $885.
For QC couples with children, the maxima are `(19534 - 3600) * .239 = 3808.226` and
`(19828 - 3600) * .239 = 3878.492`; subtract 20% above $22,007.75 / $22,424.
The phase-out base is $29,735. ON is below the phase-out threshold in these childcare cases.

The following fixed values were computed with decimal arithmetic, without calling the engine:

| Case | Federal net incomes | Exemption | CWB |
| --- | --- | --- | --- |
| 2025-ON-low-net | 44585, 885 | 885 | 721.10 |
| 2025-AB-low-net | 44585, 885 | 885 | 847.05 |
| 2025-NU-low-net | 44585, 885 | 885 | 1822.36 |
| 2025-QC-low-net | 44585, 885 | 885 | 1383.8200 |
| 2025-ON-zero-net | 44585, 0 | 0 | 721.10 |
| 2025-ON-above-zero-net | 44585, 1 | 1 | 721.10 |
| 2025-ON-negative-net | 44585, 0 | 0 | 721.10 |
| 2025-ON-itemized-claims | 44585, 885 | 885 | 721.10 |
| 2025-ON-working-order-not-net-order | 4585, 44885 | 15000 | 2238.35 |
| 2025-ON-working-cap | 44585, 19935 | 10000 | 0 |
| 2025-ON-net-equals-work | 44585, 15000 | 15000 | 721.10 |
| 2025-ON-below-working-cap | 44585, 14999 | 14999 | 721.10 |
| 2025-ON-above-working-cap | 44585, 15001 | 15000 | 720.95 |
| 2025-ON-annual-cap | 34685, 19835 | 16386 | 1688.75 |
| 2025-ON-below-annual-cap | 34685, 16385 | 16385 | 2206.10 |
| 2025-ON-at-annual-cap | 34685, 16386 | 16386 | 2206.10 |
| 2025-ON-above-annual-cap | 34685, 16387 | 16386 | 2205.95 |
| 2025-ON-tied-working-income | 44885, 885 | 15000 | 2793.35 |
| 2025-ON-nonworking-spouse | 44585, 10000 | 0 | 0 |
| 2025-ON-childcare-net | 29735, 885 | 885 | 2813 |
| 2025-QC-childcare-net | 29735, 885 | 885 | 2262.776 |
| 2026-ON-low-net | 44585, 885 | 885 | 868.90 |
| 2026-AB-low-net | 44585, 885 | 885 | 997.30 |
| 2026-NU-low-net | 44585, 885 | 885 | 1930.48 |
| 2026-QC-low-net | 44585, 885 | 885 | 1580.644 |
| 2026-ON-zero-net | 44585, 0 | 0 | 868.90 |
| 2026-ON-above-zero-net | 44585, 1 | 1 | 868.90 |
| 2026-ON-negative-net | 44585, 0 | 0 | 868.90 |
| 2026-ON-itemized-claims | 44585, 885 | 885 | 868.90 |
| 2026-ON-working-order-not-net-order | 4585, 44885 | 15000 | 2386.15 |
| 2026-ON-working-cap | 44585, 19935 | 10000 | 0 |
| 2026-ON-net-equals-work | 44585, 15000 | 15000 | 868.90 |
| 2026-ON-below-working-cap | 44585, 14999 | 14999 | 868.90 |
| 2026-ON-above-working-cap | 44585, 15001 | 15000 | 868.75 |
| 2026-ON-annual-cap | 34685, 19835 | 16714 | 1885.75 |
| 2026-ON-below-annual-cap | 34685, 16713 | 16713 | 2353.90 |
| 2026-ON-at-annual-cap | 34685, 16714 | 16714 | 2353.90 |
| 2026-ON-above-annual-cap | 34685, 16715 | 16714 | 2353.75 |
| 2026-ON-tied-working-income | 44885, 885 | 15000 | 2869.00 |
| 2026-ON-nonworking-spouse | 44585, 10000 | 0 | 0 |
| 2026-ON-childcare-net | 29735, 885 | 885 | 2869 |
| 2026-QC-childcare-net | 29735, 885 | 885 | 2416.292 |

## Existing locked results: necessary corrections only

The same independently verified rule makes existing annual corrections unavoidable, including the
2025/2026 files also touched by PR #171. These overlaps must be reconciled and checked again after integration.
No capture command was used. Unchanged cases, inputs, assertions and tolerances remain intact.

Affected annual scenario IDs:

- 2021 and 2022: 10, 59, 60, 133.
- 2023 and 2024: 10, 39, 59, 60, 70, 133.
- 2025: 10, 39, 59, 70, 133.
- 2026: 10, 39, 59, 70, 133, 145.
- `other-income-original.json`: scenario 156 in 2025 and 2026.

The [complete before/after ledger](102-cwb-golden-changes.md) lists all 1,259 changed fields across 258
province/case results. Of these, 131 results change CWB itself; others change only marginal or investment
counterfactuals. The 2019 and 2020 fixtures remain byte-identical. No individual tax/payroll results,
other credit amounts, child benefits, family net incomes or gross tax change.

The audit first ran the original engine from HEAD in a temporary directory and required it to match every
existing affected snapshot exactly. A separate Schedule 6 worksheet then computed pension deductions,
per-person net income, the exemption and CWB directly from scenario inputs and YAML parameters, without
calling engine credit, payroll or net-income functions. It calculated both the household and every $100
marginal-income and zero-investment counterfactual. Only the independently checked changed fields were patched.

For a CWB change `d = new - old`, refund and benefits change by `d`, netTotal and total by `-d`, and
average tax by `-d / cash`. Marginal-rate changes are `(d_base - d_bumped) / 100`; investment-tax changes
are `d_without_investments - d_base`. Aggregates were summed from unchanged raw baseline components
before rounding to the original four decimal places, to avoid accumulating rounded-snapshot error.
The entire corrected snapshot was then required to equal the independent result exactly.

Examples: annual scenario 10, ON CWB changes from $2,215.85 to $2,206.10 in 2025 and from $2,363.65 to
$2,353.90 in 2026. The secondary earner's $10,000 pay has a $65 enhanced pension deduction, so the
exemption falls by $65 and CWB by `65 * 15% = 9.75`. The ledger also records every derived aggregate.
The same scenario's QC CWB falls by `65 * 20% = 13`; NU can be on its plateau and remain unchanged.

## Validation

- `fnm exec --using=26 npm ci` and `npm run format` completed.
- `fnm exec --using=26 npm run check` passed: lint, typecheck, 1,410 tests, build and browser smoke.
- Browser coverage: 43 pages, 261 states and 40 contrast scans; desktop, 430 px and 375 px, light and dark.
- The new feature fixture has 42 cases, each run in both partner orders, plus four targeted tests.
- A final JSON comparison against HEAD confirmed exactly the ledger's 1,259 leaf changes and no other
  golden values or input changes. Documentation validation was repeated after staging the new Markdown files.

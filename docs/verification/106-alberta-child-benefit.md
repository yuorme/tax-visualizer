# Alberta child benefit correction, 2025 and 2026

Issue #106 selects the existing `alberta-child-family-benefit-by-child` program for both years.
No engine or schema change is needed. The benefit year beginning in July remains the annual schedule used by
each data year; this correction does not change that convention or household eligibility assumptions.

## Evidence and parameters

- [Alberta Personal Income Tax Act, section 30.2(2) and (4)](https://kings-printer.alberta.ca/documents/Acts/A30.pdf),
  PDF pages 41–43: both reduction schedules, working phase-in and combined annual minimum.
  The existing [cached extract](2024/sources/provincial-ab-act.txt) includes the 2025 dollar amounts.
- [CRA T4114 for July 2025–June 2026](2025/sources/issue-106-t4114.txt), PDF page 10, printed pages 19–20:
  2025 maxima, $27,565/$46,191 reduction thresholds and $2,760 earnings floor.
- [Alberta's benefit table](2026/sources/issue-106-acfb.txt), fetched November 4, 2026:
  both years' maxima, the 2026 thresholds, and the 15% working phase-in above $2,760.
  [Official page](https://www.alberta.ca/alberta-child-and-family-benefit).

| Children | 2025 base | 2025 working | 2026 base | 2026 working | Base reduction | Working reduction |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1499 | 767 | 1529 | 782 | 8.05% | 3.40% |
| 2 | 2248 | 1465 | 2293 | 1494 | 12.07% | 6.49% |
| 3 | 2997 | 1883 | 3057 | 1920 | 16.09% | 8.34% |
| 4 or more | 3746 | 2021 | 3821 | 2061 | 20.11% | 8.95% |

| Benefit year starts | Base threshold | Working threshold | Working earnings floor | Positive annual minimum |
| --- | ---: | ---: | ---: | ---: |
| July 2025 | 27565 | 46191 | 2760 | 10 |
| July 2026 | 28116 | 47115 | 2760 | 10 |

The old base reductions were 8%, 12%, 16% and 20%. The old 15% working reduction confused the phase-in
with the phase-out. Maxima and thresholds are already correct and stay unchanged. The new program also applies
the statutory $10 minimum to a positive combined annual benefit; zero entitlement stays zero.

T4114's narrative says the 2025 combined maximum is $5,768, but its listed components sum to $5,767.
The statute and Alberta's table agree with the individual components, so those govern this calculation.
The `estimated` flag on each child benefit is removed: every parameter is now sourced directly.
Unrelated property, driving and heating assumptions retain their existing flags and notes.
The 2020–2024 files already select the statutory program; 2019 uses its predecessor. No earlier-year error
was identified by this issue's schedule check, and none of those files is changed.

## Independent calculations and fixture

Let `n = min(children, 4)`, `N` be family net income and `E` family employment income. For at least one child:

```text
base = max(0, baseMaximum[n] - baseRate[n] * max(0, N - baseThreshold))
working = max(0, min(workingMaximum[n], 0.15 * max(0, E - 2760))
                 - workingRate[n] * max(0, N - workingThreshold))
benefit = base + working
if 0 < benefit < 10: benefit = 10
```

The 177 cases in `tests/golden/features/alberta-child-benefit.json` were calculated using Python Decimal,
transcribing the published table and statute without reading the YAML or calling the engine.
Each stores the two component calculations, expected annual entitlement, and household inputs.
The separate TypeScript reference calculation uses integer basis points and checks every fixture expectation.
The test runner checks both the direct benefit function and the full household result against those values.

For integration inputs, earnings are below both years' CPP ceilings. The enhanced CPP deduction is 1% of
earnings above $3,500. Other income or deductions adjust the family net income to the stated fixture input.
Other income does not earn the working component. Expected amounts are annual and are not rounded to monthly cents.

Examples for one child and $20,000 earnings:

| Case | Calculation | Expected benefit |
| --- | --- | ---: |
| 2025, net $47,191 | 767 - 1000 × 3.40% | 733 |
| 2025, net $61,191 | 767 - 15000 × 3.40% | 257 |
| 2026, net $48,115 | 782 - 1000 × 3.40% | 748 |
| 2026, net $62,115 | 782 - 15000 × 3.40% | 272 |
| 2025, net $68,749 | raw working 0.028, raised to the annual minimum | 10 |
| 2025, net $68,750 | exhausted working and base components | 0 |
| 2026, net $70,114.99 | raw working 0.00034, raised to the annual minimum | 10 |
| 2026, net $70,115 | exactly exhausted working and base components | 0 |

The old 15% phase-out pays zero for every `working-survives` case, where the correct entitlement exceeds $250.
The `combined-*` cases have two positive components below $10: applying separate component minima would
incorrectly pay $20. The `combined-above-minimum` cases instead pay their combined amount above $10.

## Rule-to-golden mapping

IDs below have prefix `ab-Y-N-`, with `Y` in 2025/2026 and `N` in 1, 2, 3, 4, 5 unless stated otherwise.
Five children explicitly exercise the four-or-more cap. All references are to the new feature fixture.

| Rule path | Golden suffixes |
| --- | --- |
| Exact child-count base reduction and onset | `base-below`, `base-at`, `base-reduction` |
| Exact child-count working reduction and onset | `working-below`, `working-at`, `working-above`, `working-reduction` |
| Working entitlement survives the old 15% cutoff | `working-survives` |
| Employment floor, phase-in and maximum | `earned-floor`, `earned-phase-in`, `maximum` |
| Positive minimum and zero floor, both components | `base-last-positive`, `base-zero`, `working-last-positive`, `working-zero` |
| One minimum for the combined entitlement | `combined-minimum`, `combined-above-minimum` |
| Exact working exhaustion, cent below | `ab-2026-1-working-cent-before-zero`, `ab-2026-1-working-zero` |
| Zero children | `ab-Y-0-no-children` |
| Low earnings with higher family income: fourth-child decline | `ab-Y-3-low-earnings-reduction`, `ab-Y-4-low-earnings-reduction` |

## Existing golden reconciliation

[Every before/after cell](106-alberta-golden-changes.md) is recorded by file, year, scenario and AB result path.
The 713 changes affect 33 scenarios in `2025.json`, 32 in `2026.json`, and scenarios 154/156 in each year
of `other-income-original.json`. The latter retains its original pre-carbon and 2025 pre-fuel context.
No scenario inputs, unrelated province cells, assertions or tolerances were changed in these golden suites.

Before writing, each stored AB snapshot was reproduced exactly with the inherited program and schedule.
The independent reference calculation verified both benefits and their difference for every scenario, every
$100 income counterfactual, and the counterfactual with investments removed. Only changed AB objects were
replaced in the original serialized files; all text outside those objects remained identical.
There was no blanket recapture. The permanent independent audit covers 2,528 household evaluations.

For benefit change `d`, `provBen`, `childBen` and `benefits` rise by `d`; `total` and `netTotal` fall by `d`.
The average changes by `-d / cash` when cash is positive. A marginal rate changes by
`(d - d_at_bumped_income) / 100`, and investment tax by `d_without_investments - d`.
Income tax, payroll, CCB, refundable credits, gross tax and all other snapshot fields remain identical.
The existing four-decimal snapshot rounding is preserved, so a rounded tax difference can differ by $0.0001
from subtracting two separately rounded benefits.

In annual scenarios, benefit changes range from -$18.722 to +$801.262 in 2025 and
-$18.1159 to +$809.7228 in 2026. Tax burden changes in the opposite direction.
Some scenarios change only marginal rates or investment tax because their counterfactual enters a reduction range.

## Existing assertion changes

`tests/invariants.test.ts`, `albertaWorkingReduction`:

- Before: the exact statutory working-reduction exception admits only 2023/2024.
- After: it also admits 2025/2026; province, program, child count, equal net income, exhausted base,
  positive uncapped phase-in, exact child-count reduction and combined-minimum checks are unchanged.
- Before: the coverage assertion requires seeing this exception in 2023/2024.
- After: it requires seeing the exception in 2023/2024/2025/2026.

At net income $51,682.68 and earnings $8,050, the working phase-in is $793.50 for either three or four children.
The higher four-child reduction can lower this provincial component. `low-earnings-reduction` cases independently
verify that decline while also asserting that combined benefits grow after including CCB.
No other existing assertion or helper needed a change. The old schedule remains only in explicit inherited
negative controls and migration audits, where it is needed to reproduce and explain the old results.

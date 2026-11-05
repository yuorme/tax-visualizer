# Issue #18: OAS and CPP/QPP retirement income, engine half

Coverage is **2025 and 2026, all thirteen jurisdictions**. This implements the engine half of #18 and both
#91 comments. Page controls, tooltips, URL encoding and saved-state migration follow on a separate branch.
GIS (#19), pension splitting (#20) and seniors' supplements (#21) are not included. No existing golden changes.

## Contract and assumptions

- `Person.oas?: boolean` explicitly opts into full resident OAS. Omission leaves legacy inputs unchanged;
  age alone does not enable receipts. `true` requires year-end `age` and `birthMonth` (1–12).
- `Person.cppQpp?: number` is annual gross CPP/QPP retirement receipts, finite and nonnegative. It does not
  estimate entitlement, require age, create earned income, or establish a payroll stop election.
- Both amounts are additional to other income and typed retirement receipts. Move amounts out of `oth` when
  using these fields; neither the engine nor this branch migrates existing scenarios or guesses their composition.
- OAS starts in the month following the 65th birthday. The higher published 75+ amount starts in the month
  following the 75th birthday. A December birthday therefore affects the following year. Dates have month
  precision; no birthday-day exception is inferred. Full-year resident status, full entitlement and commencement
  at 65 are assumed. Partial residency pensions, deferral, arrears, death, incarceration and prior overpayments
  need separate inputs and remain unsupported.
- CPP/QPP and OAS are outside federal/provincial pension-income credit eligibility and Quebec's retirement
  amount. Their net income still affects age amounts, spouse transfers and other income-tested credits.
- Unsupported years throw explicitly. Real-dollar history scales the entered CPP/QPP amount; OAS continues
  to use the selected year's published parameters. The page branch must gate unsupported years.

## Published figures and cached sources

Each row is a **monthly** amount, not an annual run rate. ESDC Table 5 publishes both age groups, including
monthly rounding of the 10% increase. Do not multiply the annual younger pension by 1.1.

| Quarter | 2025 ages 65–74 | 2025 ages 75+ | 2026 ages 65–74 | 2026 ages 75+ |
| --- | ---: | ---: | ---: | ---: |
| January–March | 727.67 | 800.44 | 742.31 | 816.54 |
| April–June | 727.67 | 800.44 | 743.05 | 817.36 |
| July–September | 734.95 | 808.45 | 751.97 | 827.17 |
| October–December | 740.09 | 814.10 | 762.50 | 838.75 |
| Twelve-month receipts | 8,791.14 | 9,670.29 | 8,999.49 | 9,899.46 |

Amounts and source hashes are cached in [2025 sources](2025/sources/INDEX.md) and
[2026 sources](2026/sources/INDEX.md), files `oas-q1.txt` through `oas-q4.txt` for each year.
The 2025 and 2026 reference suites assert every published monthly amount, recovery threshold and annual sum.
For example, 2025 younger receipts are `3 × (727.67 + 727.67 + 734.95 + 740.09) = 8,791.14`;
the December annualized rate would instead be `740.09 × 12 = 8,881.08`.

Additional rules use these cached publications:

- [Service Canada receipt timing](2026/sources/oas-receiving.txt) and
  [age-75 increase](2026/sources/oas-timing.txt): month after the birthday.
- [CRA federal worksheet, page 2](2025/sources/oas-federal-worksheet.txt): line 23500 deduction and line 42200
  liability, adjusted net income and cap. [Service Canada recovery](2026/sources/oas-recovery.txt) and the
  quarterly footnotes publish thresholds of 93,454 (2025) and 95,323 (2026), with a 15% rate.
- [CRA line 11400](2025/sources/oas-cpp-income.txt): gross CPP/QPP benefits belong in income.
  [Pension eligibility](2025/sources/seniors-pension.txt) supplies the existing #17 exclusion of public pensions.
- [Quebec guide, page 37](2025/sources/oas-qc-guide.txt): line 250 point 3 copies federal line 23500.
  [Schedule F](2025/sources/qc-schedule-f-2025.txt) line 22 removes OAS from its base; CPP/QPP has no exclusion.
  Its deduction list does not deduct OAS recovery again. See the [#91 audit](91-qc-health-fund.md).

The Quebec HTML endpoint returned 403; its official PDF was cached instead. All eight quarterly amounts are
published, not estimated. The 2026 program marks `estimated: true` only because filing mechanics provisionally
continue the 2025 worksheet pending 2026 forms. No earlier-year coverage is implied.

## Recovery, income and totals

For supported inputs, let `G` be calendar-year gross OAS and `N` be federal net income before recovery:
taxable income types (including grossed-up dividends, taxable gains, CPP/QPP and OAS), less ordinary claims,
enhanced CPP/QPP and applicable business/childcare deductions. Recovery is
`R = min(G, 0.15 × max(0, N − threshold))`. It is calculated once, before its own deduction.
Unsupported EI repayments, UCCB/RDSP adjustments, net federal supplements and prior OAS overpayments are
not inferred from unclassified other income or deductions.

`netIncome.oas` and `netIncome.cppQpp` identify receipts; `netIncome.oasRecovery` is already included in `ded`.
`publicPensions` reports gross OAS, monthly receipts, CPP/QPP, recovery income, tax and deduction. Its
`withholding: null` means unknown. The current year's liability is not next July's withholding schedule;
amounts withheld from cheques are payments on account and never another tax in this engine.

Income-tax credits, benefits and Quebec worker deductions use income after the federal recovery deduction.
Quebec excludes the federal childcare deduction but copies the actual federal recovery, rather than recomputing
it on higher Quebec income. Recovery is added once to `fed` after federal credits, foreign tax credits and
Quebec abatement. It is consequently present in household totals, cash remaining and marginal calculations.
Gross OAS remains in cash; recovery is a tax, not a second cash subtraction or refundable-credit adjustment.

Independent examples (all dollars):

- In 2025, pre-recovery income 100,000 gives `R = (100,000 − 93,454) × .15 = 981.90`, net 99,018.10.
  The age base is `9,028 − .15 × (99,018.10 − 45,522) = 1,003.585`, showing the deduction's credit effect.
- Full-year younger/older recovery caps begin at `threshold + G/.15`: 152,061.60 / 157,922.60 in 2025 and
  155,319.60 / 161,319.40 in 2026. Published rounded cutoffs are not substituted for these receipt-specific edges.
  A June 65th birthday in 2025 produces only `3 × 734.95 + 3 × 740.09 = 4,425.12` and caps at 122,954.80.
- Turning 75 in June 2025 gives `6 × 727.67 + 3 × 808.45 + 3 × 814.10 = 9,233.67`.
  Turning 75 in December gets the younger total; age 76 gets all twelve higher payments.
- Quebec, 2025: 20,000 CPP/QPP plus 8,791.14 OAS means cash/net 28,791.14, HSF base 20,000 and contribution
  `(20,000 − 18,130) × .01 = 18.70`. Encoding the same receipts together in `oth` gives HSF 106.6114.
  The 87.9114 difference is exactly 1% of excluded OAS. CPP/QPP alone has the same tax as equal `oth`.
- Quebec, 2025: pre-childcare net 103,454 with an 8,000 federal childcare claim gives recovery 300, federal net
  95,154 and Quebec net 103,154. Recomputing recovery on Quebec income would wrongly deduct 1,500.
- A 2025 adult at 94,454 pre-recovery income repays 150; their spouse receiving only OAS and CPP/QPP repays zero.
  No recovery thresholds or caps are shared. Family net income aggregates the separate results.

## Independent golden coverage

`tests/golden/features/oas-cpp.json` is new. Expected values were generated from literal published cents and
independent arithmetic, without importing the engine or capturing its output. Federal expectations use the
published brackets, BPA, age taper and Quebec abatement. HSF expectations use Schedule F's two tiers.
The first targeted run caught a transcription error in the new 2026 HSF upper threshold (64,365 rather than
the published 64,355); only those new expectations were corrected against the cached publication.

Existing golden cases, inputs, expected cells, assertions and tolerances are unchanged: **zero changed cells**
for every existing year/province. New cases combine receipts, recovery and credit effects using the arithmetic
above, with no snapshots used as proof. The following prefixes apply to each year:

| Rule path | Golden case suffix |
| --- | --- |
| All 13 jurisdictions, both incomes taxable once, age taper, pension-credit exclusion | `taxable-income-age-taper` |
| Under 65; first receipts; ages 74/75/76; January, June, December birthdays | `age-*-birth-*` |
| Both age-band recovery thresholds and caps ±0.01, ON and QC | `age-*-threshold-*`, `age-*-cap-*` |
| First-year receipt cap ±0.01 | `first-year-cap-*` |
| Disabled OAS, entered CPP/QPP without age, Quebec inclusion/exclusion | `opt-out-cpp-only`, `cpp-without-age` |
| Quebec OAS exclusion and CPP/QPP inclusion together | `oas-exclusion-cpp-inclusion` |
| Ordinary/RRSP/FHSA deductions before recovery | `deductions-before-recovery` |
| Dividend gross-ups, gains and foreign dividends in recovery base | `investment-recovery-base` |
| Per-adult receipt amounts and independent liability | `independent-adults` |
| Federal childcare changes recovery copied into Quebec | `childcare-recovery-deduction` |
| Recovery deduction restores age-amount eligibility | `recovery-restores-age-amount` |

Targeted tests additionally exercise every birthday month, validation and unsupported years, real-income scaling,
payroll-election independence, enhanced payroll deductions before recovery, and totals/credits equivalence to
an independently constructed ordinary-income control in all thirteen jurisdictions at low, partial and full recovery.

## Validation and handoff

Required validation: `fnm exec --using=26 npm ci`, formatting and `npm run check` (lint, typecheck, all tests,
build and browser smoke). The existing 2,875-test suite passed unchanged before adding new fixtures.
Final check results are reported in the PR. No page changes or UI acceptance claims belong to this branch.
The orchestrator should arrange the independent review and file the separate History back-fill issue at merge.

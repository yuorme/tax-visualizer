# Quebec Health Services Fund contribution (#91)

## Evidence and parameter status

The implementation selects `qc-health-services-fund` from province data, separately for each person's return.
There are no province/year tests or tax parameters in the formula. Only the 2025 and 2026 QC data enable it.

- [2025 Schedule F](2025/sources/qc-schedule-f-2025.txt), the complete one-page Revenu Québec form, is the primary
  authority for Part A and both Part B columns. Its source URL and original PDF hash are in the cache header.
- [2025 TP-1](138-senior-credit-rules/sources/qc-return-2025.txt), pages 2–5, locates total income, deductions,
  income tax, and the separate contributions that enter line 450.
- [2025 Schedule R](2025/sources/qc-schedule-r-2025.txt), Part A line 26, verifies Schedule F line 43.
- [2025 Schedule U](2025/sources/qc-schedule-u-2025.txt), pages 3–7, verifies Schedule F line 43.1 and distinguishes
  self-employment deductions from employment deductions. Page 9 documents the Part C special cases.
- [2025 guide, pages 46, 50 and 61](2025/sources/qc-guide-line-446-2025.txt) verifies line 446's special cases,
  the basic personal amount's treatment of contributions and the exclusion from medical expenses.
- [2026 parameters](138-senior-credit-rules/sources/qc-parameters-2026.txt), Table 3, printed page 10 / PDF page 14,
  independently publishes the 1% rate and the two thresholds for both years. This publication is from
  **Finances Québec**, not Revenu Québec. No 2026 Schedule F is in the supplied cache.

| Parameter | 2025 | 2026 | Evidence |
| --- | ---: | ---: | --- |
| Lower threshold | 18,130 | 18,500 | Schedule F; 2026 Table 3 |
| Upper threshold | 63,060 | 64,355 | Schedule F; 2026 Table 3 |
| Rate in both columns | 1% | 1% | Schedule F; Table 3 heading |
| First column maximum | 150 | 150 | 2025 verified; 2026 continuation |
| Second column additive amount | 150 | 150 | 2025 line 81; 2026 continuation |
| Overall maximum | 1,000 | 1,000 | 2025 verified; 2026 continuation |
| Part A income/deduction rules | Schedule F | Same provisionally | 2026 continuation |

The 2026 program is `estimated: true`, with the continued components identified in YAML and SCOPE.md.
The reference test pins only the independently published 2026 rate and thresholds. Parameters typed from YAML
would test arithmetic, **not data**. The audit instead transcribes these published constants, while explicitly
carrying forward the unverified caps and rules.

## Schedule F, line by line

The input model cannot distinguish every TP-1 line. An unclassified amount is not silently reinterpreted as a
particular return line. The table distinguishes the supported calculation from form-only requirements.

| Schedule F line | Form instruction and mapping |
| --- | --- |
| 10 | TP-1 total income (199), plus forest-producer averaging. Uses gross income, before deductions. |
| 12 | Remove employment (`ord`), even when it is large enough to use every tax bracket. |
| 14, 16 | Employment correction is not separately modelled; supported employment is already in `ord`. |
| 18 | Total less employment. Stop at or below the lower threshold. |
| 20 | Profit-sharing allocations are excluded; no separate engine input. |
| 22 | OAS is excluded. No OAS input exists yet; it cannot be identified within generic `oth`. |
| 23 | Taxable Canadian dividends: eligible and non-eligible gross-ups initially enter total income. |
| 24 | Actual Canadian dividends are `ed + nd`. |
| 25 | Remove taxable-over-actual gross-up. Both dividend types therefore enter at actual cash amounts. |
| 26 | Taxable support receipts other than repayment are excluded; no separate input. |
| 28 | Social assistance and similar assistance are excluded; no separate input. |
| 29 | Income replacement indemnities and net federal supplements are excluded; no separate input. |
| 30 | Scholarships/bursaries and similar assistance are excluded; no separate input. |
| 31 | Recovery of spousal-RRSP contribution deduction is excluded; not an ordinary RRSP withdrawal. No input. |
| 33 | TP-1 line 154 points 2, 5, 12 are excluded; no corresponding classified inputs. |
| 34 | Sum the specified exclusions, including dividend gross-up. |
| 36 | Line 18 less exclusions; stop at or below the lower threshold. |
| 41 | Eligible overpayment repayments, with listed exclusions. No classified input. |
| 42 | Repayment of wage-loss replacement benefits, line 207 point 12. No classified input. |
| 43 | Schedule R Part A line 26: deductible share of self-employment QPIP; not employee QPIP. See detail below. |
| 43.1 | Schedule U Part C lines 101 + 103 + 115; not employee enhanced QPP. See detail below. |
| 44 | EI benefits repaid federally. Not modelled. |
| 45 | Only listed line 250 deductions (points 4, 5, 6, 11, 13, 14, 15). No classified inputs. |
| 46 | Deduct retirement income transferred to spouse, line 245. Pension splitting is not built yet. |
| 54 | Deduct deductible support paid, line 225. Generic deductions cannot identify this amount. |
| 56 | Deduct carrying charges and interest, line 231. Generic deductions cannot identify this amount. |
| 58 | Business investment loss, line 234. Not equivalent to an ordinary negative capital gain. No input. |
| 60 | Conditional line 293 deduction, excluding already removed amounts. Not modelled. |
| 62 | TP-1 line 297, excluding amounts for F 12/26; guide points 9/12/14/21 rule below. Not classified. |
| 68 | Sum only the specified deductions, not all income-tax deductions. |
| 70 | Line 36 less line 68; stop at or below the threshold. |
| 76 | Carry line 70 into exactly one Part B column. |
| 77 | Left column subtracts lower threshold; right column subtracts upper threshold. |
| 78 | Floor the difference at zero. |
| 80 | Multiply by 1%. |
| 81 | Add zero in left column; add 150 in right column. |
| 82 | Apply that column's maximum (150 / 1,000) and carry to TP-1 line 446. |

Remaining supported income and deduction categories:

| Engine input | Enters Schedule F? | Reason |
| --- | --- | --- |
| `cg` | Taxable portion of positive net gains | Included in total income; no general exclusion. |
| Negative `cg` | Zero | Ordinary capital losses cannot reduce other current-year income. |
| `fd` | Full dividend before foreign withholding | No Canadian dividend gross-up and no Part A exclusion. |
| Net rental / interest / ordinary pension / withdrawals in `oth` | Full amount | Included in total income. |
| Rental expenses | Already removed | Input is net rental income; do not deduct expenses twice. |
| `rrsp` | No deduction | TP-1 line 214 is absent from Part A's deduction list. |
| `fhsa` | No deduction | TP-1 line 215 is absent from that list. |
| Federal childcare claim | No deduction | Not on the Quebec Schedule F deduction list; QC instead has a credit. |
| `ded` | No automatic deduction | Mixes allowed support/carrying charges with unlisted union dues/moving claims. |
| Quebec worker deduction | No deduction | Line 201 is absent; employment was already removed. |

The generic other-income amount assumes subject income. OAS, support and other excluded receipts entered there
cannot be separated and would be charged: the tooltip and SCOPE.md disclose this limitation. The model must not
claim to implement those exclusions until typed inputs exist. Likewise, eligible Schedule F deductions mixed
into `ded` are not deducted. This convention avoids incorrectly deducting every generic claim.

### Companion forms and line 446: verification completed

Schedule R line 26 is **43.736% of line 24**, the QPIP premium on self-employment/resource income in Part A.
Part B instead calculates the premium for residents employed outside Quebec, ending at line 44. Neither that
amount nor ordinary employee QPIP is Schedule R line 26. Therefore the current employee QPIP is correctly
left out of Schedule F line 43. Resource income has additional instructions and remains outside this model.

Schedule U Part C page 6 computes line 101 as **42.1875% of line 48** and line 103 as **15.6250% of line 48**;
line 48 is the first-tier self-employment contribution. Line 115 is the smaller of line 93 (second-tier
self-employment contribution) and line 99 (total payable). Schedule F takes these three lines only.
The employee enhanced-QPP deduction is Part B line 23; for mixed employment/self-employment, employee amounts
are in Part C lines 113 and 123. These are absent from Schedule F. In particular, Schedule U line 124 and TP-1
line 248 contain more than Schedule F allows: do not deduct either wholesale. At 81,300 employment income,
the model's 1,074 enhanced QPP deduction does **not** reduce the contribution on separate investment income.
Part C page 9 also restricts deductions for certain exempt business/resource income; #14 must respect those
instructions when building self-employment, rather than applying the percentages to every receipt.

Schedule F also names LE-35 lines 112, 113 and 116 as the alternative to Schedule U. That reference is verified
in Schedule F; LE-35's internal calculation is not verified or implemented here. Cross-plan/optional
contribution cases must be verified when implemented; they do not alter this model's ordinary employee mapping.

The guide's line 446 has exactly these two special-case bullets:

- A Quebec resident carrying on business elsewhere in Canada multiplies Schedule F line 82 by TP-22 line 35's
  allocation percentage. This is a **contribution allocation**, not a Part A deduction. The model assumes the
  full Quebec amount; business allocation is outside #91 and belongs with #14. Ignoring a share below 100%
  overstates the contribution by the unallocated share of line 82 (before other modeling differences).
- For TP-1 line 297 deductions under points **9, 12, 14 or 21**, exclude from Schedule F line 62 any portion
  relating to employment income (TP-1 line 101) or support receipts (TP-1 line 142). This supplements Schedule F's
  instruction not to deduct amounts for lines 12 or 26 again. Only the remaining qualifying portion can reach
  line 62; the model does not classify these claims. It cannot double-deduct excluded employment/support.

No formula or existing golden correction was needed after checking the companion forms. The implementation
already omits employee pension/premium deductions and all unclassified deductions. Tests now explicitly guard
the 1,074 employee-QPP counterexample and quantify the OAS/support classification limit.

### Decision 1: deductions, and the direction of the error

Keep RRSP and FHSA outside this contribution calculation and keep generic `ded` unclassified. These are
different cases: RRSP/FHSA exclusion is the correct rule, whereas ignoring a qualifying generic claim is a
known approximation. The following error directions concern **only the Health Services Fund contribution**,
not the separate income-tax treatment of generic deductions.

| Claim | TP-1 / Schedule F route, by form text | Current contribution error |
| --- | --- | --- |
| RRSP | TP-1 214; no Schedule F deduction line | None: correctly not deducted |
| FHSA | TP-1 215; no Schedule F deduction line | None: correctly not deducted |
| Federal childcare | No deduction on Schedule F | None: correctly not deducted |
| Union/professional dues | TP-1 397 credit; no Schedule F deduction line | None for this contribution |
| Moving expenses | TP-1 228; no Schedule F deduction line | None: correctly not deducted |
| Deductible support paid | TP-1 225 → Schedule F 54 | Overstated or unchanged when entered in `ded` |
| Carrying charges/interest | TP-1 231 → Schedule F 56 | Overstated or unchanged when entered in `ded` |
| Retirement income transferred | TP-1 245 → Schedule F 46 | Overstated or unchanged for transferor; splitting absent |
| Other listed claims | Only F 41/42/44/45/58/60/62, with their stated restrictions | Overstated or unchanged if eligible |
| Employee enhanced QPP | U 23, or U 113/123; none reaches F 43.1 | None: correctly not deducted |
| Self-employment QPIP/QPP | R 26 → F 43; U 101/103/115 → F 43.1 | Not implemented; #14 must classify these |

For a correctly eligible deduction of `d`, ignoring it adds between zero and `1% × d`, limited by the form's
plateaus and overall cap. For example, 25,000 subject income and 5,000 deductible support/carrying charges give
18.70 in 2025; entering that claim in generic `ded` leaves 68.70, an overstatement of 50. The same claim as RRSP,
FHSA or moving expenses correctly leaves 68.70. None of these omitted deductions understates this contribution.

### Decision 2: excluded receipts, including a typical senior example

Keep the combined Other income input for now and disclose that it assumes subject income. Schedule F line 22
excludes OAS; line 26 excludes taxable support receipts **other than a repayment**. Other excluded receipts
follow lines 20 and 28–33. If included in `oth`, these amounts can only overstate this contribution or leave it
unchanged. Do not remove OAS from the income-tax input as a workaround: it still belongs in taxable income.

For an illustrative senior with **20,000 of QPP/private pension plus 9,000 of OAS**, all entered as 29,000 in
Other income, the correct 2025 contribution is `(20,000 − 18,130) × 1% = 18.70`; the model charges 108.70.
That is **90 too much per year** in Payroll and total burden solely from the missing OAS exclusion. The analogous
2026 values are 15 and 105, also 90 too much. The 9,000 is a rounded illustrative annual receipt, not an exact
published entitlement: the [cached federal table](2025/sources/seniors-oas-q4.txt) gives 740.09 per month for
ages 65–74 in October–December 2025 (8,881.08 if annualized, not the actual calendar-year maximum).

There is no single error for every senior: OAS alone at this amount is below the threshold (zero error), and
40,000 pension plus 9,000 OAS stays on the 150 plateau (zero error). For a fixed 9,000 excluded receipt the
possible overstatement is **0–90**, depending on the other subject income. Taxable support has the same effect
when it qualifies for line 26. Tests cover the zero and 90 cases in both years.

**#18 must exclude its new OAS input from this contribution base (Schedule F line 22), while retaining OAS in
the appropriate income-tax/benefit calculations, and must prevent counting it again in Other income.** Its
tests should include OAS alone, OAS alongside pension income in a rising band, and the plateau. This decision
does not claim that the current model handles OAS recovery tax, GIS or other senior-specific rules.

`healthServicesIncome` centralizes the supported base. `healthServicesFund` accepts an independently classified
deduction amount. #14 can add net business income to that base and pass only its verified Schedule R/U deductions;
it must not subtract every payroll deduction. No self-employment input or calculation is built in this change.

## Return placement and income bases

TP-1 page 4 completes income tax and credit transfers at line 432. Page 5 adds QPIP (439), self-employment QPP
(445), Health Services Fund (446), and other contributions before line 450. Line 446 is neither an income-tax
credit nor part of the provincial income-tax amount available for foreign-tax credits or spouse transfers.

The page includes it in Payroll, with a named ledger row, and sums each person's amount once. It is outside
`payrollOf`, which describes employment contributions, and outside `incomeTax`. The existing nested employment
payroll breakdown retains its shape; `breakdown.healthServicesFund` supplies the new household component.

There is no line 446 deduction in the modelled net-income calculation. The contribution does not reduce federal
or Quebec net/taxable income, create a separate contribution credit, increase FTC capacity, or change a benefit base.
The guide's page 46 says the fixed Quebec basic personal amount already takes this contribution into account;
page 50 expressly excludes line 446 from medical expenses. Neither creates relief varying with the amount paid.
Tests compare the program enabled/disabled: `ti`, `tiP`, all income tax, income bases, CCB, provincial benefits,
refundable credits and childcare credits stay identical. Payroll, personal/household totals and net burden rise
by exactly the independently calculated contribution. Investment-tax attribution and marginal rates include
only the contribution difference between their respective inputs.

## Independent arithmetic and negative controls

`tests/qc-health-fund-form.ts` imports neither the engine nor YAML. It starts at TP-1 total income and follows
Schedule F's numbered lines in order, including its four early exits and its two mutually exclusive columns.
The engine instead sums the supported subject-income components directly. The comparison test exercises every
existing shared and original-other-income scenario, all six next-$100 inputs, and the no-investment input.

At 25,000 subject income the contributions are `(25,000 - 18,130) / 100 = 68.70` (2025) and 65 (2026).
At 80,000 they are `150 + (80,000 - 63,060) / 100 = 319.40` and 306.45.
They first reach 150 at 33,130 / 33,500, remain 150 through 63,060 / 64,355, then reach the overall cap at
148,060 / 149,355. At or below the lower threshold the result is zero, not a negative contribution.

Negative controls produce different positive liabilities:

- 25,000 eligible dividends: correct 2025 contribution 68.70; using the grossed-up 34,500 gives 150.
- Deducting a 5,000 RRSP claim from that base incorrectly gives 18.70.
- Two people with 25,000 each owe 137.40 together; pooling 50,000 incorrectly gives 150.
- Form-only 40,000 income including 8,000 OAS and 3,000 support, less 1,000 carrying charges and 2,000 pension
  transfer, gives 26,000 subject income and 78.70. Ignoring those adjustments gives 150. This documents the
  classification required by future inputs; the current generic input cannot infer those amounts.

Feature goldens independently pin both years immediately below, at, and above all four material boundaries;
actual eligible/non-eligible/foreign dividends, taxable gains, losses, mixed employment, unclassified deductions,
separate people and per-person caps. For the no-credit 25,000 other-income case, 2025 income tax is
`25,000 × (14.5% × 83.5% + 14%) = 6,526.875`; total is 6,595.575 after the 68.70 contribution.
For 2026 the analogous tax is 6,422.50 and total 6,487.50. These are worksheet calculations, not a published
taxpayer narrative example. The reference test explicitly cites the published Schedule F worksheet.

The two childcare goldens claim 6,000 federally against 40,000 employment and 25,000 other income. Enhanced QPP
is 365, so federal taxable income is 58,635. Quebec excludes the federal childcare claim and subtracts its worker
deduction: provincial taxable income is 63,215 / 63,185. Schedule F subject income remains 25,000 in both years.

## Golden patch method

Only QC results in `2025.json`, `2026.json` and `other-income-original.json` change. No fixture was recaptured.
The targeted patch starts with locked values and adds independent Schedule F amounts to personal/household
payroll, personal total, household netTotal/gross/total; it recalculates averages from the corrected totals.
Investment tax adds the contribution difference after removing investments. Each marginal rate adds the
contribution difference for the active person's next 100 of that income type, divided by 100.
Inputs, assertions, tolerances, income taxes, benefits, unrelated paths and 2019–2024 values are preserved.

Marginal calculations subtract the unchanged portion and the new contribution separately, preserving the
original floating-point subtraction order when the contribution is constant. This avoids changing unrelated
fourth-decimal rounding. The independent patch matched every new and untouched engine snapshot path.
The inventory below lists all 100 affected cases and all 1,056 changed numeric paths.

## Browser coverage and validation

`tests/e2e/qc-health-fund.mjs` is imported and executed by smoke, therefore by `npm run check`, at 375, 430 and
1,000 px in light and dark. It uses actual input controls for other income, dividends, employment, deductions
and a second adult. It checks the ledger, payroll subtotal, independent total burden, the threshold/caps,
all six legacy years, both new years' tooltips and horizontal overflow.
The payroll chart tooltip is also checked at 60,000 employment plus 40,000 other income in 2026: its 4,748
total lists QPP 3,560, EI 780, QPIP 258 and the Health Services Fund contribution of 150.
`tests/e2e/history.mjs` checks both dollar modes for Quebec and Manitoba's partial program coverage, and
Ontario's absence of those caveats. The first modelled year comes from installed program data, not fixed years.

The legacy smoke page omits the contribution. Its two affected 2026 steps enter 20,000 capital gains, 12,000
eligible dividends and 8,000 foreign dividends for the partner. Subject income is 30,000 and the contribution
is `(30,000 - 18,500) × 1% = 115`. The 28,000 employment-only adult contributes zero; household cash is 143,000.
The following displayed amounts are whole-dollar roundings. Exact old strings are asserted before replacement;
all other legacy cells and control state continue to compare exactly.

| Displayed QC value | Before | After |
| --- | ---: | ---: |
| Payroll, both steps | 7,741 | 7,856 |
| Partner income tax and payroll | 29,503 | 29,618 |
| Tax attributed to investment income | 9,756 | 9,871 |
| Renter household net tax | 36,399 | 36,514 |
| Renter cost above BC | 7,450 | 7,565 |
| Renter money left | 106,601 | 106,486 |
| Renter gap above BC, percentage points | 5.2 | 5.3 |
| Owner household net tax | 41,891 | 42,006 |
| Owner cost above BC | 11,700 | 11,815 |
| Owner money left | 101,109 | 100,994 |
| Owner net rate, percent | 29.3 | 29.4 |
| Owner gap above BC, percentage points | 8.2 | 8.3 |

The corresponding difference cells change by the same 115. The renter's displayed QC rate remains 25.5%, and
the employment marginal rate remains 42.1% in both steps. The owner chart's only changed cell is QC's net rate.

`npm run compare -- origin/main` completed six width/theme runs, five steps each, and returned its expected
difference status (1): notes and sources changed; controls did not. Those comparison inputs keep subject income
below the contribution threshold. The new smoke sequence, in contrast, exercises positive liabilities directly.
Round 3 escalated `fnm exec --using=26 npm run check` passed on 2026-11-04: lint, typecheck, 1,322 tests, build,
and smoke (37 pages, 255 states, 40 contrast scans; 131.2 seconds). `npm run format` and `git diff --check` pass.
The newly added Markdown was also checked directly for prose lines exceeding 120 characters, because the
repository's docs script only examines tracked files and this sandbox cannot stage the new files.

## Affected locked cases

Contributions below are independent Schedule F amounts per person. All provinces are QC.

| File | Year | Case | Contributions per person | Household addition |
| --- | ---: | ---: | --- | ---: |
| 2025.json | 2025 | 16 | 269.4 | 269.4 |
| 2025.json | 2025 | 17 | 150 | 150 |
| 2025.json | 2025 | 18 | 150 | 150 |
| 2025.json | 2025 | 19 | 150 | 150 |
| 2025.json | 2025 | 21 | 150 | 150 |
| 2025.json | 2025 | 28 | 63.7 | 63.7 |
| 2025.json | 2025 | 30 | 150, 0 | 150 |
| 2025.json | 2025 | 33 | 138.7 | 138.7 |
| 2025.json | 2025 | 35 | 0, 93.7 | 93.7 |
| 2025.json | 2025 | 39 | 419.4, 150 | 569.4 |
| 2025.json | 2025 | 42 | 150, 0 | 150 |
| 2025.json | 2025 | 43 | 150, 0 | 150 |
| 2025.json | 2025 | 45 | 249.4 | 249.4 |
| 2025.json | 2025 | 47 | 143.7, 0 | 143.7 |
| 2025.json | 2025 | 48 | 419.4 | 419.4 |
| 2025.json | 2025 | 49 | 150 | 150 |
| 2025.json | 2025 | 55 | 150 | 150 |
| 2025.json | 2025 | 58 | 150 | 150 |
| 2025.json | 2025 | 59 | 0, 143.7 | 143.7 |
| 2025.json | 2025 | 62 | 150 | 150 |
| 2025.json | 2025 | 71 | 0, 150 | 150 |
| 2025.json | 2025 | 73 | 0, 148.7 | 148.7 |
| 2025.json | 2025 | 76 | 150 | 150 |
| 2025.json | 2025 | 80 | 150 | 150 |
| 2025.json | 2025 | 83 | 289.4, 324.4 | 613.8 |
| 2025.json | 2025 | 93 | 150 | 150 |
| 2025.json | 2025 | 98 | 150, 0 | 150 |
| 2025.json | 2025 | 105 | 0, 88.7 | 88.7 |
| 2025.json | 2025 | 110 | 369.4 | 369.4 |
| 2025.json | 2025 | 113 | 53.7 | 53.7 |
| 2025.json | 2025 | 114 | 150 | 150 |
| 2025.json | 2025 | 117 | 0, 279.4 | 279.4 |
| 2025.json | 2025 | 118 | 219.4 | 219.4 |
| 2025.json | 2025 | 122 | 98.7 | 98.7 |
| 2025.json | 2025 | 126 | 150, 0 | 150 |
| 2025.json | 2025 | 127 | 38.7 | 38.7 |
| 2025.json | 2025 | 130 | 150, 0 | 150 |
| 2025.json | 2025 | 133 | 0, 63.7 | 63.7 |
| 2025.json | 2025 | 134 | 150, 0 | 150 |
| 2025.json | 2025 | 135 | 249.4 | 249.4 |
| 2025.json | 2025 | 140 | 374.4, 0 | 374.4 |
| 2025.json | 2025 | 143 | 0, 88.7 | 88.7 |
| 2025.json | 2025 | 147 | 38.7 | 38.7 |
| 2026.json | 2026 | 16 | 256.45 | 256.45 |
| 2026.json | 2026 | 17 | 150 | 150 |
| 2026.json | 2026 | 18 | 150 | 150 |
| 2026.json | 2026 | 19 | 150 | 150 |
| 2026.json | 2026 | 21 | 150 | 150 |
| 2026.json | 2026 | 28 | 60 | 60 |
| 2026.json | 2026 | 30 | 150, 0 | 150 |
| 2026.json | 2026 | 33 | 135 | 135 |
| 2026.json | 2026 | 35 | 0, 90 | 90 |
| 2026.json | 2026 | 39 | 406.45, 150 | 556.45 |
| 2026.json | 2026 | 42 | 150, 0 | 150 |
| 2026.json | 2026 | 43 | 150, 0 | 150 |
| 2026.json | 2026 | 45 | 236.45 | 236.45 |
| 2026.json | 2026 | 47 | 140, 0 | 140 |
| 2026.json | 2026 | 48 | 406.45 | 406.45 |
| 2026.json | 2026 | 49 | 150 | 150 |
| 2026.json | 2026 | 55 | 150 | 150 |
| 2026.json | 2026 | 58 | 150 | 150 |
| 2026.json | 2026 | 59 | 0, 140 | 140 |
| 2026.json | 2026 | 62 | 150 | 150 |
| 2026.json | 2026 | 71 | 0, 150 | 150 |
| 2026.json | 2026 | 73 | 0, 145 | 145 |
| 2026.json | 2026 | 76 | 150 | 150 |
| 2026.json | 2026 | 80 | 150 | 150 |
| 2026.json | 2026 | 83 | 276.45, 311.45 | 587.9 |
| 2026.json | 2026 | 93 | 150 | 150 |
| 2026.json | 2026 | 98 | 150, 0 | 150 |
| 2026.json | 2026 | 105 | 0, 85 | 85 |
| 2026.json | 2026 | 110 | 356.45 | 356.45 |
| 2026.json | 2026 | 113 | 50 | 50 |
| 2026.json | 2026 | 114 | 150 | 150 |
| 2026.json | 2026 | 117 | 0, 266.45 | 266.45 |
| 2026.json | 2026 | 118 | 206.45 | 206.45 |
| 2026.json | 2026 | 122 | 95 | 95 |
| 2026.json | 2026 | 126 | 150, 0 | 150 |
| 2026.json | 2026 | 127 | 35 | 35 |
| 2026.json | 2026 | 130 | 150, 0 | 150 |
| 2026.json | 2026 | 133 | 0, 60 | 60 |
| 2026.json | 2026 | 134 | 150, 0 | 150 |
| 2026.json | 2026 | 135 | 236.45 | 236.45 |
| 2026.json | 2026 | 140 | 361.45, 0 | 361.45 |
| 2026.json | 2026 | 143 | 0, 85 | 85 |
| 2026.json | 2026 | 147 | 35 | 35 |
| other-income-original.json | 2025 | 148 | 150 | 150 |
| other-income-original.json | 2025 | 150 | 118.7 | 118.7 |
| other-income-original.json | 2025 | 151 | 719.4 | 719.4 |
| other-income-original.json | 2025 | 153 | 0, 118.7 | 118.7 |
| other-income-original.json | 2025 | 154 | 68.7 | 68.7 |
| other-income-original.json | 2025 | 155 | 150 | 150 |
| other-income-original.json | 2025 | 156 | 18.7, 0 | 18.7 |
| other-income-original.json | 2026 | 148 | 150 | 150 |
| other-income-original.json | 2026 | 150 | 115 | 115 |
| other-income-original.json | 2026 | 151 | 706.45 | 706.45 |
| other-income-original.json | 2026 | 153 | 0, 115 | 115 |
| other-income-original.json | 2026 | 154 | 65 | 65 |
| other-income-original.json | 2026 | 155 | 150 | 150 |
| other-income-original.json | 2026 | 156 | 15, 0 | 15 |

## Every changed locked value

Paths are relative to each case’s QC result. Inputs and all other paths remain unchanged.

| File | Year | Case | Path | Before | After |
| --- | ---: | ---: | --- | ---: | ---: |
| 2025.json | 2025 | 16 | total | 325951.3547 | 326220.7547 |
| 2025.json | 2025 | 16 | payroll | 6079.99 | 6349.39 |
| 2025.json | 2025 | 16 | netTotal | 321887.8787 | 322157.2787 |
| 2025.json | 2025 | 16 | invTax | 33380.0422 | 33649.4422 |
| 2025.json | 2025 | 16 | gross | 325951.3547 | 326220.7547 |
| 2025.json | 2025 | 16 | avg | 0.4656 | 0.466 |
| 2025.json | 2025 | 16 | grossAvg | 0.4656 | 0.466 |
| 2025.json | 2025 | 16 | margBy.cg | 0.2665 | 0.2715 |
| 2025.json | 2025 | 16 | margBy.ed | 0.4011 | 0.4111 |
| 2025.json | 2025 | 16 | margBy.nd | 0.487 | 0.497 |
| 2025.json | 2025 | 16 | margBy.fd | 0.533 | 0.543 |
| 2025.json | 2025 | 16 | people.0.payroll | 6079.99 | 6349.39 |
| 2025.json | 2025 | 16 | people.0.total | 321887.8787 | 322157.2787 |
| 2025.json | 2025 | 17 | total | 4063.476 | 4213.476 |
| 2025.json | 2025 | 17 | payroll | 0 | 150 |
| 2025.json | 2025 | 17 | netTotal | 0 | 150 |
| 2025.json | 2025 | 17 | invTax | 1605 | 1755 |
| 2025.json | 2025 | 17 | gross | 4063.476 | 4213.476 |
| 2025.json | 2025 | 17 | avg | 0.0813 | 0.0843 |
| 2025.json | 2025 | 17 | grossAvg | 0.0813 | 0.0843 |
| 2025.json | 2025 | 17 | people.0.payroll | 0 | 150 |
| 2025.json | 2025 | 17 | people.0.total | 0 | 150 |
| 2025.json | 2025 | 18 | total | 8093.4656 | 8243.4656 |
| 2025.json | 2025 | 18 | payroll | 0 | 150 |
| 2025.json | 2025 | 18 | netTotal | 4029.9896 | 4179.9896 |
| 2025.json | 2025 | 18 | invTax | 5634.9896 | 5784.9896 |
| 2025.json | 2025 | 18 | gross | 8438.9656 | 8588.9656 |
| 2025.json | 2025 | 18 | avg | 0.1619 | 0.1649 |
| 2025.json | 2025 | 18 | grossAvg | 0.1688 | 0.1718 |
| 2025.json | 2025 | 18 | people.0.payroll | 0 | 150 |
| 2025.json | 2025 | 18 | people.0.total | 4375.4896 | 4525.4896 |
| 2025.json | 2025 | 19 | total | 17958.926 | 18108.926 |
| 2025.json | 2025 | 19 | payroll | 0 | 150 |
| 2025.json | 2025 | 19 | netTotal | 13895.45 | 14045.45 |
| 2025.json | 2025 | 19 | invTax | 15500.45 | 15650.45 |
| 2025.json | 2025 | 19 | gross | 19063.476 | 19213.476 |
| 2025.json | 2025 | 19 | avg | 0.3592 | 0.3622 |
| 2025.json | 2025 | 19 | grossAvg | 0.3813 | 0.3843 |
| 2025.json | 2025 | 19 | people.0.payroll | 0 | 150 |
| 2025.json | 2025 | 19 | people.0.total | 15000 | 15150 |
| 2025.json | 2025 | 21 | total | 64345.3435 | 64495.3435 |
| 2025.json | 2025 | 21 | payroll | 6079.99 | 6229.99 |
| 2025.json | 2025 | 21 | netTotal | 60281.8675 | 60431.8675 |
| 2025.json | 2025 | 21 | invTax | 20279.1444 | 20429.1444 |
| 2025.json | 2025 | 21 | gross | 64345.3435 | 64495.3435 |
| 2025.json | 2025 | 21 | avg | 0.2993 | 0.3 |
| 2025.json | 2025 | 21 | grossAvg | 0.2993 | 0.3 |
| 2025.json | 2025 | 21 | people.0.payroll | 6079.99 | 6229.99 |
| 2025.json | 2025 | 21 | people.0.total | 60281.8675 | 60431.8675 |
| 2025.json | 2025 | 28 | total | 30193.5764 | 30257.2764 |
| 2025.json | 2025 | 28 | payroll | 4288.2 | 4351.9 |
| 2025.json | 2025 | 28 | netTotal | 21426.2964 | 21489.9964 |
| 2025.json | 2025 | 28 | invTax | 8911.1252 | 8974.8252 |
| 2025.json | 2025 | 28 | gross | 30193.5764 | 30257.2764 |
| 2025.json | 2025 | 28 | avg | 0.3682 | 0.369 |
| 2025.json | 2025 | 28 | grossAvg | 0.3682 | 0.369 |
| 2025.json | 2025 | 28 | margBy.cg | 0.1806 | 0.1856 |
| 2025.json | 2025 | 28 | margBy.ed | 0.1639 | 0.1739 |
| 2025.json | 2025 | 28 | margBy.nd | 0.2893 | 0.2993 |
| 2025.json | 2025 | 28 | margBy.fd | 0.3612 | 0.3712 |
| 2025.json | 2025 | 28 | people.0.payroll | 4288.2 | 4351.9 |
| 2025.json | 2025 | 28 | people.0.total | 21426.2964 | 21489.9964 |
| 2025.json | 2025 | 30 | total | 81762.388 | 81912.388 |
| 2025.json | 2025 | 30 | payroll | 10368.19 | 10518.19 |
| 2025.json | 2025 | 30 | netTotal | 76261.312 | 76411.312 |
| 2025.json | 2025 | 30 | invTax | 24503.5177 | 24653.5177 |
| 2025.json | 2025 | 30 | gross | 81762.388 | 81912.388 |
| 2025.json | 2025 | 30 | avg | 0.3232 | 0.3238 |
| 2025.json | 2025 | 30 | grossAvg | 0.3232 | 0.3238 |
| 2025.json | 2025 | 30 | people.0.payroll | 6079.99 | 6229.99 |
| 2025.json | 2025 | 30 | people.0.total | 63134.9408 | 63284.9408 |
| 2025.json | 2025 | 33 | total | 63916.6952 | 64055.3952 |
| 2025.json | 2025 | 33 | payroll | 6079.99 | 6218.69 |
| 2025.json | 2025 | 33 | netTotal | 58743.4152 | 58882.1152 |
| 2025.json | 2025 | 33 | invTax | 18204.1207 | 18342.8207 |
| 2025.json | 2025 | 33 | gross | 74409.5752 | 74548.2752 |
| 2025.json | 2025 | 33 | avg | 0.3329 | 0.3336 |
| 2025.json | 2025 | 33 | grossAvg | 0.3875 | 0.3883 |
| 2025.json | 2025 | 33 | margBy.cg | 0.2924 | 0.2974 |
| 2025.json | 2025 | 33 | margBy.ed | 0.4724 | 0.4824 |
| 2025.json | 2025 | 33 | margBy.nd | 0.5464 | 0.5564 |
| 2025.json | 2025 | 33 | margBy.fd | 0.5848 | 0.5948 |
| 2025.json | 2025 | 33 | people.0.payroll | 6079.99 | 6218.69 |
| 2025.json | 2025 | 33 | people.0.total | 69236.2952 | 69374.9952 |
| 2025.json | 2025 | 35 | total | 12464.876 | 12558.576 |
| 2025.json | 2025 | 35 | payroll | 1006.6 | 1100.3 |
| 2025.json | 2025 | 35 | netTotal | -943 | -849.3 |
| 2025.json | 2025 | 35 | invTax | 5923 | 6016.7 |
| 2025.json | 2025 | 35 | gross | 14414.476 | 14508.176 |
| 2025.json | 2025 | 35 | avg | 0.2266 | 0.2283 |
| 2025.json | 2025 | 35 | grossAvg | 0.2621 | 0.2638 |
| 2025.json | 2025 | 35 | people.1.payroll | 1006.6 | 1100.3 |
| 2025.json | 2025 | 35 | people.1.total | 1006.6 | 1100.3 |
| 2025.json | 2025 | 39 | total | 37434.3355 | 38003.7355 |
| 2025.json | 2025 | 39 | payroll | 3243.8 | 3813.2 |
| 2025.json | 2025 | 39 | netTotal | 35277.9355 | 35847.3355 |
| 2025.json | 2025 | 39 | invTax | 65448.8778 | 66018.2778 |
| 2025.json | 2025 | 39 | gross | 42819.6955 | 43389.0955 |
| 2025.json | 2025 | 39 | avg | 0.1872 | 0.19 |
| 2025.json | 2025 | 39 | grossAvg | 0.2141 | 0.2169 |
| 2025.json | 2025 | 39 | margBy.cg | 0.2413 | 0.2463 |
| 2025.json | 2025 | 39 | margBy.ed | 0.3907 | 0.4007 |
| 2025.json | 2025 | 39 | margBy.nd | 0.452 | 0.462 |
| 2025.json | 2025 | 39 | margBy.fd | 0.5718 | 0.5818 |
| 2025.json | 2025 | 39 | people.0.payroll | 1006.6 | 1426 |
| 2025.json | 2025 | 39 | people.0.total | 21392.9689 | 21812.3689 |
| 2025.json | 2025 | 39 | people.1.payroll | 2237.2 | 2387.2 |
| 2025.json | 2025 | 39 | people.1.total | 19270.3266 | 19420.3266 |
| 2025.json | 2025 | 42 | total | 68892.5494 | 69042.5494 |
| 2025.json | 2025 | 42 | payroll | 9711.87 | 9861.87 |
| 2025.json | 2025 | 42 | netTotal | 52647.2994 | 52797.2994 |
| 2025.json | 2025 | 42 | invTax | 20503.3809 | 20653.3809 |
| 2025.json | 2025 | 42 | gross | 74914.7964 | 75064.7964 |
| 2025.json | 2025 | 42 | avg | 0.3377 | 0.3384 |
| 2025.json | 2025 | 42 | grossAvg | 0.3672 | 0.368 |
| 2025.json | 2025 | 42 | people.0.payroll | 6079.99 | 6229.99 |
| 2025.json | 2025 | 42 | people.0.total | 48197.4312 | 48347.4312 |
| 2025.json | 2025 | 43 | total | 53533.591 | 53683.591 |
| 2025.json | 2025 | 43 | payroll | 8317.19 | 8467.19 |
| 2025.json | 2025 | 43 | netTotal | 51235.511 | 51385.511 |
| 2025.json | 2025 | 43 | invTax | 4826.7073 | 4976.7073 |
| 2025.json | 2025 | 43 | gross | 53533.591 | 53683.591 |
| 2025.json | 2025 | 43 | avg | 0.2745 | 0.2753 |
| 2025.json | 2025 | 43 | grossAvg | 0.2745 | 0.2753 |
| 2025.json | 2025 | 43 | people.0.payroll | 2237.2 | 2387.2 |
| 2025.json | 2025 | 43 | people.0.total | 14211.287 | 14361.287 |
| 2025.json | 2025 | 45 | total | 56555.566 | 56804.966 |
| 2025.json | 2025 | 45 | payroll | 6015.77 | 6265.17 |
| 2025.json | 2025 | 45 | netTotal | 49792.09 | 50041.49 |
| 2025.json | 2025 | 45 | invTax | 24600.5693 | 24849.9693 |
| 2025.json | 2025 | 45 | gross | 56555.566 | 56804.966 |
| 2025.json | 2025 | 45 | avg | 0.309 | 0.3104 |
| 2025.json | 2025 | 45 | grossAvg | 0.309 | 0.3104 |
| 2025.json | 2025 | 45 | margBy.cg | 0.2373 | 0.2423 |
| 2025.json | 2025 | 45 | margBy.ed | 0.3204 | 0.3304 |
| 2025.json | 2025 | 45 | margBy.nd | 0.4197 | 0.4297 |
| 2025.json | 2025 | 45 | margBy.fd | 0.4746 | 0.4846 |
| 2025.json | 2025 | 45 | people.0.payroll | 6015.77 | 6265.17 |
| 2025.json | 2025 | 45 | people.0.total | 49792.09 | 50041.49 |
| 2025.json | 2025 | 47 | total | 147592.7806 | 147736.4806 |
| 2025.json | 2025 | 47 | payroll | 11404.58 | 11548.28 |
| 2025.json | 2025 | 47 | netTotal | 128652.0306 | 128795.7306 |
| 2025.json | 2025 | 47 | invTax | 11738.1875 | 11881.8875 |
| 2025.json | 2025 | 47 | gross | 151304.7806 | 151448.4806 |
| 2025.json | 2025 | 47 | avg | 0.4066 | 0.407 |
| 2025.json | 2025 | 47 | grossAvg | 0.4168 | 0.4172 |
| 2025.json | 2025 | 47 | margBy.cg | 0.1806 | 0.1856 |
| 2025.json | 2025 | 47 | margBy.ed | 0.1639 | 0.1739 |
| 2025.json | 2025 | 47 | margBy.nd | 0.2893 | 0.2993 |
| 2025.json | 2025 | 47 | margBy.fd | 0.3612 | 0.3712 |
| 2025.json | 2025 | 47 | people.0.payroll | 5324.59 | 5468.29 |
| 2025.json | 2025 | 47 | people.0.total | 30285.2408 | 30428.9408 |
| 2025.json | 2025 | 48 | total | 18623.2642 | 19042.6642 |
| 2025.json | 2025 | 48 | payroll | 1580.88 | 2000.28 |
| 2025.json | 2025 | 48 | netTotal | 10395.0842 | 10814.4842 |
| 2025.json | 2025 | 48 | invTax | 8814.2042 | 9233.6042 |
| 2025.json | 2025 | 48 | gross | 18623.2642 | 19042.6642 |
| 2025.json | 2025 | 48 | avg | 0.1663 | 0.17 |
| 2025.json | 2025 | 48 | grossAvg | 0.1663 | 0.17 |
| 2025.json | 2025 | 48 | margBy.cg | 0.1806 | 0.1856 |
| 2025.json | 2025 | 48 | margBy.ed | 0.1639 | 0.1739 |
| 2025.json | 2025 | 48 | margBy.nd | 0.2893 | 0.2993 |
| 2025.json | 2025 | 48 | margBy.fd | 0.3612 | 0.3712 |
| 2025.json | 2025 | 48 | people.0.payroll | 1580.88 | 2000.28 |
| 2025.json | 2025 | 48 | people.0.total | 10395.0842 | 10814.4842 |
| 2025.json | 2025 | 49 | total | -10025.4006 | -9875.4006 |
| 2025.json | 2025 | 49 | payroll | 1580.88 | 1730.88 |
| 2025.json | 2025 | 49 | netTotal | -17213.4006 | -17063.4006 |
| 2025.json | 2025 | 49 | invTax | 15269.7194 | 15419.7194 |
| 2025.json | 2025 | 49 | gross | 15556.0794 | 15706.0794 |
| 2025.json | 2025 | 49 | avg | -0.1453 | -0.1431 |
| 2025.json | 2025 | 49 | grossAvg | 0.2255 | 0.2276 |
| 2025.json | 2025 | 49 | people.0.payroll | 1580.88 | 1730.88 |
| 2025.json | 2025 | 49 | people.0.total | 8368.0794 | 8518.0794 |
| 2025.json | 2025 | 55 | total | 23405.134 | 23555.134 |
| 2025.json | 2025 | 55 | payroll | 6015.77 | 6165.77 |
| 2025.json | 2025 | 55 | netTotal | 12591.658 | 12741.658 |
| 2025.json | 2025 | 55 | invTax | 17978.2359 | 18128.2359 |
| 2025.json | 2025 | 55 | gross | 46419.814 | 46569.814 |
| 2025.json | 2025 | 55 | avg | 0.1592 | 0.1602 |
| 2025.json | 2025 | 55 | grossAvg | 0.3158 | 0.3168 |
| 2025.json | 2025 | 55 | people.0.payroll | 6015.77 | 6165.77 |
| 2025.json | 2025 | 55 | people.0.total | 35606.338 | 35756.338 |
| 2025.json | 2025 | 58 | total | 86844.7666 | 86994.7666 |
| 2025.json | 2025 | 58 | payroll | 6079.99 | 6229.99 |
| 2025.json | 2025 | 58 | netTotal | 73764.6866 | 73914.6866 |
| 2025.json | 2025 | 58 | invTax | 16360.7335 | 16510.7335 |
| 2025.json | 2025 | 58 | gross | 86844.7666 | 86994.7666 |
| 2025.json | 2025 | 58 | avg | 0.3947 | 0.3954 |
| 2025.json | 2025 | 58 | grossAvg | 0.3947 | 0.3954 |
| 2025.json | 2025 | 58 | people.0.payroll | 6079.99 | 6229.99 |
| 2025.json | 2025 | 58 | people.0.total | 73764.6866 | 73914.6866 |
| 2025.json | 2025 | 59 | total | 39213.916 | 39357.616 |
| 2025.json | 2025 | 59 | payroll | 5294.8 | 5438.5 |
| 2025.json | 2025 | 59 | netTotal | 17627.416 | 17771.116 |
| 2025.json | 2025 | 59 | invTax | 6296.5971 | 6440.2971 |
| 2025.json | 2025 | 59 | gross | 39213.916 | 39357.616 |
| 2025.json | 2025 | 59 | avg | 0.3735 | 0.3748 |
| 2025.json | 2025 | 59 | grossAvg | 0.3735 | 0.3748 |
| 2025.json | 2025 | 59 | people.1.payroll | 1006.6 | 1150.3 |
| 2025.json | 2025 | 59 | people.1.total | 4501.0448 | 4644.7448 |
| 2025.json | 2025 | 62 | total | 44545.7894 | 44695.7894 |
| 2025.json | 2025 | 62 | payroll | 5718.37 | 5868.37 |
| 2025.json | 2025 | 62 | netTotal | 35050.5394 | 35200.5394 |
| 2025.json | 2025 | 62 | invTax | 22754.5848 | 22904.5848 |
| 2025.json | 2025 | 62 | gross | 48287.0054 | 48437.0054 |
| 2025.json | 2025 | 62 | avg | 0.3375 | 0.3386 |
| 2025.json | 2025 | 62 | grossAvg | 0.3658 | 0.3669 |
| 2025.json | 2025 | 62 | people.0.payroll | 5718.37 | 5868.37 |
| 2025.json | 2025 | 62 | people.0.total | 38791.7554 | 38941.7554 |
| 2025.json | 2025 | 71 | total | 39446.9109 | 39596.9109 |
| 2025.json | 2025 | 71 | payroll | 7086.59 | 7236.59 |
| 2025.json | 2025 | 71 | netTotal | 37290.5109 | 37440.5109 |
| 2025.json | 2025 | 71 | invTax | 9223.0798 | 9373.0798 |
| 2025.json | 2025 | 71 | gross | 51017.5029 | 51167.5029 |
| 2025.json | 2025 | 71 | avg | 0.1896 | 0.1904 |
| 2025.json | 2025 | 71 | grossAvg | 0.2453 | 0.246 |
| 2025.json | 2025 | 71 | people.1.payroll | 1006.6 | 1156.6 |
| 2025.json | 2025 | 71 | people.1.total | 10229.6798 | 10379.6798 |
| 2025.json | 2025 | 73 | total | 69996.2365 | 70144.9365 |
| 2025.json | 2025 | 73 | payroll | 7086.59 | 7235.29 |
| 2025.json | 2025 | 73 | netTotal | 56372.5565 | 56521.2565 |
| 2025.json | 2025 | 73 | invTax | 5873.6607 | 6022.3607 |
| 2025.json | 2025 | 73 | gross | 69996.2365 | 70144.9365 |
| 2025.json | 2025 | 73 | avg | 0.3723 | 0.3731 |
| 2025.json | 2025 | 73 | grossAvg | 0.3723 | 0.3731 |
| 2025.json | 2025 | 73 | margBy.ed | 0.0322 | 0.0422 |
| 2025.json | 2025 | 73 | margBy.nd | 0.1702 | 0.1802 |
| 2025.json | 2025 | 73 | margBy.fd | 0.3004 | 0.3104 |
| 2025.json | 2025 | 73 | people.1.payroll | 1006.6 | 1155.3 |
| 2025.json | 2025 | 73 | people.1.total | 6087.6034 | 6236.3034 |
| 2025.json | 2025 | 76 | total | 68767.1328 | 68917.1328 |
| 2025.json | 2025 | 76 | payroll | 6079.99 | 6229.99 |
| 2025.json | 2025 | 76 | netTotal | 51673.1328 | 51823.1328 |
| 2025.json | 2025 | 76 | invTax | 36728.2783 | 36878.2783 |
| 2025.json | 2025 | 76 | gross | 100463.3128 | 100613.3128 |
| 2025.json | 2025 | 76 | avg | 0.2807 | 0.2813 |
| 2025.json | 2025 | 76 | grossAvg | 0.4101 | 0.4107 |
| 2025.json | 2025 | 76 | people.0.payroll | 6079.99 | 6229.99 |
| 2025.json | 2025 | 76 | people.0.total | 83369.3128 | 83519.3128 |
| 2025.json | 2025 | 80 | total | -58344.324 | -58194.324 |
| 2025.json | 2025 | 80 | payroll | 432.32 | 582.32 |
| 2025.json | 2025 | 80 | netTotal | -60431.1 | -60281.1 |
| 2025.json | 2025 | 80 | invTax | 9388.18 | 9538.18 |
| 2025.json | 2025 | 80 | gross | 2519.096 | 2669.096 |
| 2025.json | 2025 | 80 | avg | -0.7992 | -0.7972 |
| 2025.json | 2025 | 80 | grossAvg | 0.0345 | 0.0366 |
| 2025.json | 2025 | 80 | people.0.payroll | 432.32 | 582.32 |
| 2025.json | 2025 | 80 | people.0.total | 432.32 | 582.32 |
| 2025.json | 2025 | 83 | total | 73135.7728 | 73749.5728 |
| 2025.json | 2025 | 83 | payroll | 7596.65 | 8210.45 |
| 2025.json | 2025 | 83 | netTotal | 62212.0928 | 62825.8928 |
| 2025.json | 2025 | 83 | invTax | 45454.0122 | 46067.8122 |
| 2025.json | 2025 | 83 | gross | 73135.7728 | 73749.5728 |
| 2025.json | 2025 | 83 | avg | 0.2422 | 0.2442 |
| 2025.json | 2025 | 83 | grossAvg | 0.2422 | 0.2442 |
| 2025.json | 2025 | 83 | margBy.cg | 0.2373 | 0.2423 |
| 2025.json | 2025 | 83 | margBy.ed | 0.3204 | 0.3304 |
| 2025.json | 2025 | 83 | margBy.nd | 0.4197 | 0.4297 |
| 2025.json | 2025 | 83 | margBy.fd | 0.4746 | 0.4846 |
| 2025.json | 2025 | 83 | people.0.payroll | 6015.77 | 6305.17 |
| 2025.json | 2025 | 83 | people.0.total | 42104.7922 | 42394.1922 |
| 2025.json | 2025 | 83 | people.1.payroll | 1580.88 | 1905.28 |
| 2025.json | 2025 | 83 | people.1.total | 20107.3006 | 20431.7006 |
| 2025.json | 2025 | 93 | total | 57949.3408 | 58099.3408 |
| 2025.json | 2025 | 93 | payroll | 6079.99 | 6229.99 |
| 2025.json | 2025 | 93 | netTotal | 42971.1608 | 43121.1608 |
| 2025.json | 2025 | 93 | invTax | 15917.3205 | 16067.3205 |
| 2025.json | 2025 | 93 | gross | 57949.3408 | 58099.3408 |
| 2025.json | 2025 | 93 | avg | 0.335 | 0.3358 |
| 2025.json | 2025 | 93 | grossAvg | 0.335 | 0.3358 |
| 2025.json | 2025 | 93 | people.0.payroll | 6079.99 | 6229.99 |
| 2025.json | 2025 | 93 | people.0.total | 42971.1608 | 43121.1608 |
| 2025.json | 2025 | 98 | total | -22653.1746 | -22503.1746 |
| 2025.json | 2025 | 98 | payroll | 5212.76 | 5362.76 |
| 2025.json | 2025 | 98 | netTotal | -27826.4546 | -27676.4546 |
| 2025.json | 2025 | 98 | invTax | 15187.7853 | 15337.7853 |
| 2025.json | 2025 | 98 | gross | 21875.8754 | 22025.8754 |
| 2025.json | 2025 | 98 | avg | -0.1987 | -0.1974 |
| 2025.json | 2025 | 98 | grossAvg | 0.1919 | 0.1932 |
| 2025.json | 2025 | 98 | people.0.payroll | 1580.88 | 1730.88 |
| 2025.json | 2025 | 98 | people.0.total | 6230.4802 | 6380.4802 |
| 2025.json | 2025 | 105 | total | 63098.6521 | 63187.3521 |
| 2025.json | 2025 | 105 | payroll | 11798.36 | 11887.06 |
| 2025.json | 2025 | 105 | netTotal | 58316.3761 | 58405.0761 |
| 2025.json | 2025 | 105 | invTax | 9884.6125 | 9973.3125 |
| 2025.json | 2025 | 105 | gross | 63098.6521 | 63187.3521 |
| 2025.json | 2025 | 105 | avg | 0.2555 | 0.2558 |
| 2025.json | 2025 | 105 | grossAvg | 0.2555 | 0.2558 |
| 2025.json | 2025 | 105 | people.1.payroll | 6079.99 | 6168.69 |
| 2025.json | 2025 | 105 | people.1.total | 36938.4528 | 37027.1528 |
| 2025.json | 2025 | 110 | total | 41300.0962 | 41669.4962 |
| 2025.json | 2025 | 110 | payroll | 1580.88 | 1950.28 |
| 2025.json | 2025 | 110 | netTotal | 16548.6202 | 16918.0202 |
| 2025.json | 2025 | 110 | invTax | 30889.5522 | 31258.9522 |
| 2025.json | 2025 | 110 | gross | 45422.7202 | 45792.1202 |
| 2025.json | 2025 | 110 | avg | 0.3129 | 0.3157 |
| 2025.json | 2025 | 110 | grossAvg | 0.3441 | 0.3469 |
| 2025.json | 2025 | 110 | margBy.cg | 0.2445 | 0.2495 |
| 2025.json | 2025 | 110 | margBy.ed | 0.3404 | 0.3504 |
| 2025.json | 2025 | 110 | margBy.nd | 0.4364 | 0.4464 |
| 2025.json | 2025 | 110 | margBy.fd | 0.4891 | 0.4991 |
| 2025.json | 2025 | 110 | people.0.payroll | 1580.88 | 1950.28 |
| 2025.json | 2025 | 110 | people.0.total | 20671.2442 | 21040.6442 |
| 2025.json | 2025 | 113 | total | 10619.3453 | 10673.0453 |
| 2025.json | 2025 | 113 | payroll | 3631.88 | 3685.58 |
| 2025.json | 2025 | 113 | netTotal | 7782.1653 | 7835.8653 |
| 2025.json | 2025 | 113 | invTax | 4150.2853 | 4203.9853 |
| 2025.json | 2025 | 113 | gross | 10619.3453 | 10673.0453 |
| 2025.json | 2025 | 113 | avg | 0.1279 | 0.1286 |
| 2025.json | 2025 | 113 | grossAvg | 0.1279 | 0.1286 |
| 2025.json | 2025 | 113 | margBy.cg | 0.1305 | 0.1355 |
| 2025.json | 2025 | 113 | margBy.ed | 0.0258 | 0.0358 |
| 2025.json | 2025 | 113 | margBy.nd | 0.1742 | 0.1842 |
| 2025.json | 2025 | 113 | margBy.fd | 0.2611 | 0.2711 |
| 2025.json | 2025 | 113 | people.0.payroll | 3631.88 | 3685.58 |
| 2025.json | 2025 | 113 | people.0.total | 7782.1653 | 7835.8653 |
| 2025.json | 2025 | 114 | total | 3544.7433 | 3694.7433 |
| 2025.json | 2025 | 114 | payroll | 3631.88 | 3781.88 |
| 2025.json | 2025 | 114 | netTotal | 1388.3433 | 1538.3433 |
| 2025.json | 2025 | 114 | invTax | 24132.2781 | 24282.2781 |
| 2025.json | 2025 | 114 | gross | 24483.7033 | 24633.7033 |
| 2025.json | 2025 | 114 | avg | 0.0331 | 0.0345 |
| 2025.json | 2025 | 114 | grossAvg | 0.2288 | 0.2302 |
| 2025.json | 2025 | 114 | people.0.payroll | 3631.88 | 3781.88 |
| 2025.json | 2025 | 114 | people.0.total | 22327.3033 | 22477.3033 |
| 2025.json | 2025 | 117 | total | 64937.0936 | 65216.4936 |
| 2025.json | 2025 | 117 | payroll | 7660.87 | 7940.27 |
| 2025.json | 2025 | 117 | netTotal | 52746.3436 | 53025.7436 |
| 2025.json | 2025 | 117 | invTax | 25230.9555 | 25510.3555 |
| 2025.json | 2025 | 117 | gross | 68897.0936 | 69176.4936 |
| 2025.json | 2025 | 117 | avg | 0.2672 | 0.2684 |
| 2025.json | 2025 | 117 | grossAvg | 0.2835 | 0.2847 |
| 2025.json | 2025 | 117 | margBy.cg | 0.2056 | 0.2106 |
| 2025.json | 2025 | 117 | margBy.ed | 0.2329 | 0.2429 |
| 2025.json | 2025 | 117 | margBy.nd | 0.3468 | 0.3568 |
| 2025.json | 2025 | 117 | margBy.fd | 0.4112 | 0.4212 |
| 2025.json | 2025 | 117 | people.1.payroll | 1580.88 | 1860.28 |
| 2025.json | 2025 | 117 | people.1.total | 18074.9205 | 18354.3205 |
| 2025.json | 2025 | 118 | total | 16068.5091 | 16287.9091 |
| 2025.json | 2025 | 118 | payroll | 0 | 219.4 |
| 2025.json | 2025 | 118 | netTotal | 5144.8291 | 5364.2291 |
| 2025.json | 2025 | 118 | invTax | 6749.8291 | 6969.2291 |
| 2025.json | 2025 | 118 | gross | 16068.5091 | 16287.9091 |
| 2025.json | 2025 | 118 | avg | 0.3214 | 0.3258 |
| 2025.json | 2025 | 118 | grossAvg | 0.3214 | 0.3258 |
| 2025.json | 2025 | 118 | margBy.ed | 0.1639 | 0.1739 |
| 2025.json | 2025 | 118 | margBy.nd | 0.2893 | 0.2993 |
| 2025.json | 2025 | 118 | margBy.fd | 0.4512 | 0.4612 |
| 2025.json | 2025 | 118 | people.0.payroll | 0 | 219.4 |
| 2025.json | 2025 | 118 | people.0.total | 5144.8291 | 5364.2291 |
| 2025.json | 2025 | 122 | total | 20950.6032 | 21049.3032 |
| 2025.json | 2025 | 122 | payroll | 3631.88 | 3730.58 |
| 2025.json | 2025 | 122 | netTotal | 14510.2532 | 14608.9532 |
| 2025.json | 2025 | 122 | invTax | 11570.1167 | 11668.8167 |
| 2025.json | 2025 | 122 | gross | 20950.6032 | 21049.3032 |
| 2025.json | 2025 | 122 | avg | 0.2793 | 0.2807 |
| 2025.json | 2025 | 122 | grossAvg | 0.2793 | 0.2807 |
| 2025.json | 2025 | 122 | margBy.cg | 0.1806 | 0.1856 |
| 2025.json | 2025 | 122 | margBy.ed | 0.1639 | 0.1739 |
| 2025.json | 2025 | 122 | margBy.nd | 0.2893 | 0.2993 |
| 2025.json | 2025 | 122 | margBy.fd | 0.3612 | 0.3712 |
| 2025.json | 2025 | 122 | people.0.payroll | 3631.88 | 3730.58 |
| 2025.json | 2025 | 122 | people.0.total | 14510.2532 | 14608.9532 |
| 2025.json | 2025 | 126 | total | 49813.5894 | 49963.5894 |
| 2025.json | 2025 | 126 | payroll | 6512.31 | 6662.31 |
| 2025.json | 2025 | 126 | netTotal | 41727.0894 | 41877.0894 |
| 2025.json | 2025 | 126 | invTax | 21302.2533 | 21452.2533 |
| 2025.json | 2025 | 126 | gross | 58409.3894 | 58559.3894 |
| 2025.json | 2025 | 126 | avg | 0.2361 | 0.2368 |
| 2025.json | 2025 | 126 | grossAvg | 0.2768 | 0.2775 |
| 2025.json | 2025 | 126 | people.0.payroll | 432.32 | 582.32 |
| 2025.json | 2025 | 126 | people.0.total | 11691.4663 | 11841.4663 |
| 2025.json | 2025 | 127 | total | 3234.5102 | 3273.2102 |
| 2025.json | 2025 | 127 | payroll | 4288.2 | 4326.9 |
| 2025.json | 2025 | 127 | netTotal | -3205.8398 | -3167.1398 |
| 2025.json | 2025 | 127 | invTax | 14424.9877 | 14463.6877 |
| 2025.json | 2025 | 127 | gross | 25010.8902 | 25049.5902 |
| 2025.json | 2025 | 127 | avg | 0.042 | 0.0425 |
| 2025.json | 2025 | 127 | grossAvg | 0.3248 | 0.3253 |
| 2025.json | 2025 | 127 | margBy.cg | 0.2956 | 0.3006 |
| 2025.json | 2025 | 127 | margBy.ed | 0.4813 | 0.4913 |
| 2025.json | 2025 | 127 | margBy.nd | 0.5538 | 0.5638 |
| 2025.json | 2025 | 127 | margBy.fd | 0.5912 | 0.6012 |
| 2025.json | 2025 | 127 | people.0.payroll | 4288.2 | 4326.9 |
| 2025.json | 2025 | 127 | people.0.total | 18570.5402 | 18609.2402 |
| 2025.json | 2025 | 130 | total | 184123.8766 | 184273.8766 |
| 2025.json | 2025 | 130 | payroll | 12159.98 | 12309.98 |
| 2025.json | 2025 | 130 | netTotal | 178622.8006 | 178772.8006 |
| 2025.json | 2025 | 130 | invTax | 15961.2461 | 16111.2461 |
| 2025.json | 2025 | 130 | gross | 185443.8766 | 185593.8766 |
| 2025.json | 2025 | 130 | avg | 0.3735 | 0.3738 |
| 2025.json | 2025 | 130 | grossAvg | 0.3762 | 0.3765 |
| 2025.json | 2025 | 130 | people.0.payroll | 6079.99 | 6229.99 |
| 2025.json | 2025 | 130 | people.0.total | 92930.0202 | 93080.0202 |
| 2025.json | 2025 | 133 | total | -36709.5567 | -36645.8567 |
| 2025.json | 2025 | 133 | payroll | 4064.2 | 4127.9 |
| 2025.json | 2025 | 133 | netTotal | -40624.9367 | -40561.2367 |
| 2025.json | 2025 | 133 | invTax | 21952.9462 | 22016.6462 |
| 2025.json | 2025 | 133 | gross | 15897.5633 | 15961.2633 |
| 2025.json | 2025 | 133 | avg | -0.4219 | -0.4212 |
| 2025.json | 2025 | 133 | grossAvg | 0.1827 | 0.1835 |
| 2025.json | 2025 | 133 | margBy.cg | 0.3455 | 0.3505 |
| 2025.json | 2025 | 133 | margBy.ed | 0.6192 | 0.6292 |
| 2025.json | 2025 | 133 | margBy.nd | 0.6687 | 0.6787 |
| 2025.json | 2025 | 133 | margBy.fd | 0.6911 | 0.7011 |
| 2025.json | 2025 | 133 | people.1.payroll | 3631.88 | 3695.58 |
| 2025.json | 2025 | 133 | people.1.total | 11549.8633 | 11613.5633 |
| 2025.json | 2025 | 134 | total | 34637.702 | 34787.702 |
| 2025.json | 2025 | 134 | payroll | 7299.25 | 7449.25 |
| 2025.json | 2025 | 134 | netTotal | 29246.702 | 29396.702 |
| 2025.json | 2025 | 134 | invTax | 5677.2138 | 5827.2138 |
| 2025.json | 2025 | 134 | gross | 34637.702 | 34787.702 |
| 2025.json | 2025 | 134 | avg | 0.2356 | 0.2367 |
| 2025.json | 2025 | 134 | grossAvg | 0.2356 | 0.2367 |
| 2025.json | 2025 | 134 | people.0.payroll | 1580.88 | 1730.88 |
| 2025.json | 2025 | 134 | people.0.total | 7541.002 | 7691.002 |
| 2025.json | 2025 | 135 | total | 28693.6813 | 28943.0813 |
| 2025.json | 2025 | 135 | payroll | 2893.52 | 3142.92 |
| 2025.json | 2025 | 135 | netTotal | 11130.2053 | 11379.6053 |
| 2025.json | 2025 | 135 | invTax | 14839.2653 | 15088.6653 |
| 2025.json | 2025 | 135 | gross | 28693.6813 | 28943.0813 |
| 2025.json | 2025 | 135 | avg | 0.2585 | 0.2607 |
| 2025.json | 2025 | 135 | grossAvg | 0.2585 | 0.2607 |
| 2025.json | 2025 | 135 | margBy.cg | 0.1806 | 0.1856 |
| 2025.json | 2025 | 135 | margBy.ed | 0.1639 | 0.1739 |
| 2025.json | 2025 | 135 | margBy.nd | 0.2893 | 0.2993 |
| 2025.json | 2025 | 135 | margBy.fd | 0.3612 | 0.3712 |
| 2025.json | 2025 | 135 | people.0.payroll | 2893.52 | 3142.92 |
| 2025.json | 2025 | 135 | people.0.total | 11130.2053 | 11379.6053 |
| 2025.json | 2025 | 140 | total | 44157.3996 | 44531.7996 |
| 2025.json | 2025 | 140 | payroll | 7181.72 | 7556.12 |
| 2025.json | 2025 | 140 | netTotal | 41531.5236 | 41905.9236 |
| 2025.json | 2025 | 140 | invTax | 26075.8594 | 26450.2594 |
| 2025.json | 2025 | 140 | gross | 45477.3996 | 45851.7996 |
| 2025.json | 2025 | 140 | avg | 0.2312 | 0.2332 |
| 2025.json | 2025 | 140 | grossAvg | 0.2381 | 0.2401 |
| 2025.json | 2025 | 140 | people.0.payroll | 2893.52 | 3267.92 |
| 2025.json | 2025 | 140 | people.0.total | 29725.1524 | 30099.5524 |
| 2025.json | 2025 | 143 | total | 1198.6866 | 1287.3866 |
| 2025.json | 2025 | 143 | payroll | 2587.48 | 2676.18 |
| 2025.json | 2025 | 143 | netTotal | -2716.6934 | -2627.9934 |
| 2025.json | 2025 | 143 | invTax | 14910.9526 | 14999.6526 |
| 2025.json | 2025 | 143 | gross | 11571.8866 | 11660.5866 |
| 2025.json | 2025 | 143 | avg | 0.0135 | 0.0145 |
| 2025.json | 2025 | 143 | grossAvg | 0.13 | 0.131 |
| 2025.json | 2025 | 143 | people.1.payroll | 1006.6 | 1095.3 |
| 2025.json | 2025 | 143 | people.1.total | 6075.6266 | 6164.3266 |
| 2025.json | 2025 | 147 | total | 116429.5381 | 116468.2381 |
| 2025.json | 2025 | 147 | payroll | 6079.99 | 6118.69 |
| 2025.json | 2025 | 147 | netTotal | 113403.4881 | 113442.1881 |
| 2025.json | 2025 | 147 | invTax | 11324.6983 | 11363.3983 |
| 2025.json | 2025 | 147 | gross | 116429.5381 | 116468.2381 |
| 2025.json | 2025 | 147 | avg | 0.462 | 0.4622 |
| 2025.json | 2025 | 147 | grossAvg | 0.462 | 0.4622 |
| 2025.json | 2025 | 147 | margBy.ed | 0.4011 | 0.4111 |
| 2025.json | 2025 | 147 | margBy.nd | 0.487 | 0.497 |
| 2025.json | 2025 | 147 | margBy.fd | 0.5331 | 0.5431 |
| 2025.json | 2025 | 147 | people.0.payroll | 6079.99 | 6118.69 |
| 2025.json | 2025 | 147 | people.0.total | 113403.4881 | 113442.1881 |
| 2026.json | 2026 | 16 | total | 325076.2468 | 325332.6968 |
| 2026.json | 2026 | 16 | payroll | 6233.9 | 6490.35 |
| 2026.json | 2026 | 16 | netTotal | 321115.0305 | 321371.4805 |
| 2026.json | 2026 | 16 | invTax | 33380.0422 | 33636.4922 |
| 2026.json | 2026 | 16 | gross | 325076.2468 | 325332.6968 |
| 2026.json | 2026 | 16 | avg | 0.4644 | 0.4648 |
| 2026.json | 2026 | 16 | grossAvg | 0.4644 | 0.4648 |
| 2026.json | 2026 | 16 | margBy.cg | 0.2665 | 0.2715 |
| 2026.json | 2026 | 16 | margBy.ed | 0.4011 | 0.4111 |
| 2026.json | 2026 | 16 | margBy.nd | 0.487 | 0.497 |
| 2026.json | 2026 | 16 | margBy.fd | 0.533 | 0.543 |
| 2026.json | 2026 | 16 | people.0.payroll | 6233.9 | 6490.35 |
| 2026.json | 2026 | 16 | people.0.total | 321115.0305 | 321371.4805 |
| 2026.json | 2026 | 17 | total | 3961.2163 | 4111.2163 |
| 2026.json | 2026 | 17 | payroll | 0 | 150 |
| 2026.json | 2026 | 17 | netTotal | 0 | 150 |
| 2026.json | 2026 | 17 | invTax | 1726 | 1876 |
| 2026.json | 2026 | 17 | gross | 3961.2163 | 4111.2163 |
| 2026.json | 2026 | 17 | avg | 0.0792 | 0.0822 |
| 2026.json | 2026 | 17 | grossAvg | 0.0792 | 0.0822 |
| 2026.json | 2026 | 17 | people.0.payroll | 0 | 150 |
| 2026.json | 2026 | 17 | people.0.total | 0 | 150 |
| 2026.json | 2026 | 18 | total | 7463.8207 | 7613.8207 |
| 2026.json | 2026 | 18 | payroll | 0 | 150 |
| 2026.json | 2026 | 18 | netTotal | 3502.6044 | 3652.6044 |
| 2026.json | 2026 | 18 | invTax | 5228.6044 | 5378.6044 |
| 2026.json | 2026 | 18 | gross | 8012.1207 | 8162.1207 |
| 2026.json | 2026 | 18 | avg | 0.1493 | 0.1523 |
| 2026.json | 2026 | 18 | grossAvg | 0.1602 | 0.1632 |
| 2026.json | 2026 | 18 | people.0.payroll | 0 | 150 |
| 2026.json | 2026 | 18 | people.0.total | 4050.9044 | 4200.9044 |
| 2026.json | 2026 | 19 | total | 17587.9163 | 17737.9163 |
| 2026.json | 2026 | 19 | payroll | 0 | 150 |
| 2026.json | 2026 | 19 | netTotal | 13626.7 | 13776.7 |
| 2026.json | 2026 | 19 | invTax | 15352.7 | 15502.7 |
| 2026.json | 2026 | 19 | gross | 18961.2163 | 19111.2163 |
| 2026.json | 2026 | 19 | avg | 0.3518 | 0.3548 |
| 2026.json | 2026 | 19 | grossAvg | 0.3792 | 0.3822 |
| 2026.json | 2026 | 19 | people.0.payroll | 0 | 150 |
| 2026.json | 2026 | 19 | people.0.total | 15000 | 15150 |
| 2026.json | 2026 | 21 | total | 63668.559 | 63818.559 |
| 2026.json | 2026 | 21 | payroll | 6233.9 | 6383.9 |
| 2026.json | 2026 | 21 | netTotal | 59707.3428 | 59857.3428 |
| 2026.json | 2026 | 21 | invTax | 20165.1542 | 20315.1542 |
| 2026.json | 2026 | 21 | gross | 63668.559 | 63818.559 |
| 2026.json | 2026 | 21 | avg | 0.2961 | 0.2968 |
| 2026.json | 2026 | 21 | grossAvg | 0.2961 | 0.2968 |
| 2026.json | 2026 | 21 | people.0.payroll | 6233.9 | 6383.9 |
| 2026.json | 2026 | 21 | people.0.total | 59707.3428 | 59857.3428 |
| 2026.json | 2026 | 28 | total | 29713.8734 | 29773.8734 |
| 2026.json | 2026 | 28 | payroll | 4196 | 4256 |
| 2026.json | 2026 | 28 | netTotal | 20977.4536 | 21037.4536 |
| 2026.json | 2026 | 28 | invTax | 9050.9192 | 9110.9192 |
| 2026.json | 2026 | 28 | gross | 29713.8734 | 29773.8734 |
| 2026.json | 2026 | 28 | avg | 0.3624 | 0.3631 |
| 2026.json | 2026 | 28 | grossAvg | 0.3624 | 0.3631 |
| 2026.json | 2026 | 28 | margBy.cg | 0.1806 | 0.1856 |
| 2026.json | 2026 | 28 | margBy.ed | 0.1639 | 0.1739 |
| 2026.json | 2026 | 28 | margBy.nd | 0.2893 | 0.2993 |
| 2026.json | 2026 | 28 | margBy.fd | 0.3612 | 0.3712 |
| 2026.json | 2026 | 28 | people.0.payroll | 4196 | 4256 |
| 2026.json | 2026 | 28 | people.0.total | 20977.4536 | 21037.4536 |
| 2026.json | 2026 | 30 | total | 80833.2094 | 80983.2094 |
| 2026.json | 2026 | 30 | payroll | 10429.9 | 10579.9 |
| 2026.json | 2026 | 30 | netTotal | 75434.3932 | 75584.3932 |
| 2026.json | 2026 | 30 | invTax | 24455.6027 | 24605.6027 |
| 2026.json | 2026 | 30 | gross | 80833.2094 | 80983.2094 |
| 2026.json | 2026 | 30 | avg | 0.3195 | 0.3201 |
| 2026.json | 2026 | 30 | grossAvg | 0.3195 | 0.3201 |
| 2026.json | 2026 | 30 | people.0.payroll | 6233.9 | 6383.9 |
| 2026.json | 2026 | 30 | people.0.total | 62626.4913 | 62776.4913 |
| 2026.json | 2026 | 33 | total | 62659.3156 | 62794.3156 |
| 2026.json | 2026 | 33 | payroll | 6233.9 | 6368.9 |
| 2026.json | 2026 | 33 | netTotal | 57516.8959 | 57651.8959 |
| 2026.json | 2026 | 33 | invTax | 18144.9112 | 18279.9112 |
| 2026.json | 2026 | 33 | gross | 73788.3956 | 73923.3956 |
| 2026.json | 2026 | 33 | avg | 0.3264 | 0.3271 |
| 2026.json | 2026 | 33 | grossAvg | 0.3843 | 0.385 |
| 2026.json | 2026 | 33 | margBy.cg | 0.3123 | 0.3173 |
| 2026.json | 2026 | 33 | margBy.ed | 0.5274 | 0.5374 |
| 2026.json | 2026 | 33 | margBy.nd | 0.5922 | 0.6022 |
| 2026.json | 2026 | 33 | margBy.fd | 0.6246 | 0.6346 |
| 2026.json | 2026 | 33 | people.0.payroll | 6233.9 | 6368.9 |
| 2026.json | 2026 | 33 | people.0.total | 68645.9759 | 68780.9759 |
| 2026.json | 2026 | 35 | total | 12018.2663 | 12108.2663 |
| 2026.json | 2026 | 35 | payroll | 984 | 1074 |
| 2026.json | 2026 | 35 | netTotal | -1287.35 | -1197.35 |
| 2026.json | 2026 | 35 | invTax | 5825.25 | 5915.25 |
| 2026.json | 2026 | 35 | gross | 14289.6163 | 14379.6163 |
| 2026.json | 2026 | 35 | avg | 0.2185 | 0.2202 |
| 2026.json | 2026 | 35 | grossAvg | 0.2598 | 0.2614 |
| 2026.json | 2026 | 35 | people.1.payroll | 984 | 1074 |
| 2026.json | 2026 | 35 | people.1.total | 984 | 1074 |
| 2026.json | 2026 | 39 | total | 36156.1683 | 36712.6183 |
| 2026.json | 2026 | 39 | payroll | 3172.5 | 3728.95 |
| 2026.json | 2026 | 39 | netTotal | 33999.7683 | 34556.2183 |
| 2026.json | 2026 | 39 | invTax | 65897.5739 | 66454.0239 |
| 2026.json | 2026 | 39 | gross | 41994.5283 | 42550.9783 |
| 2026.json | 2026 | 39 | avg | 0.1808 | 0.1836 |
| 2026.json | 2026 | 39 | grossAvg | 0.21 | 0.2128 |
| 2026.json | 2026 | 39 | margBy.cg | 0.2409 | 0.2459 |
| 2026.json | 2026 | 39 | margBy.ed | 0.3895 | 0.3995 |
| 2026.json | 2026 | 39 | margBy.nd | 0.451 | 0.461 |
| 2026.json | 2026 | 39 | margBy.fd | 0.5762 | 0.5862 |
| 2026.json | 2026 | 39 | people.0.payroll | 984 | 1390.45 |
| 2026.json | 2026 | 39 | people.0.total | 20890.3396 | 21296.7896 |
| 2026.json | 2026 | 39 | people.1.payroll | 2188.5 | 2338.5 |
| 2026.json | 2026 | 39 | people.1.total | 18947.7886 | 19097.7886 |
| 2026.json | 2026 | 42 | total | 67442.6958 | 67592.6958 |
| 2026.json | 2026 | 42 | payroll | 9774.6 | 9924.6 |
| 2026.json | 2026 | 42 | netTotal | 51504.2951 | 51654.2951 |
| 2026.json | 2026 | 42 | invTax | 20351.514 | 20501.514 |
| 2026.json | 2026 | 42 | gross | 73812.5888 | 73962.5888 |
| 2026.json | 2026 | 42 | avg | 0.3306 | 0.3313 |
| 2026.json | 2026 | 42 | grossAvg | 0.3618 | 0.3626 |
| 2026.json | 2026 | 42 | people.0.payroll | 6221 | 6371 |
| 2026.json | 2026 | 42 | people.0.total | 47677.5897 | 47827.5897 |
| 2026.json | 2026 | 43 | total | 52893.0012 | 53043.0012 |
| 2026.json | 2026 | 43 | payroll | 8422.4 | 8572.4 |
| 2026.json | 2026 | 43 | netTotal | 50625.7815 | 50775.7815 |
| 2026.json | 2026 | 43 | invTax | 4593.0026 | 4743.0026 |
| 2026.json | 2026 | 43 | gross | 52893.0012 | 53043.0012 |
| 2026.json | 2026 | 43 | avg | 0.2712 | 0.272 |
| 2026.json | 2026 | 43 | grossAvg | 0.2712 | 0.272 |
| 2026.json | 2026 | 43 | people.0.payroll | 2188.5 | 2338.5 |
| 2026.json | 2026 | 43 | people.0.total | 13817.1 | 13967.1 |
| 2026.json | 2026 | 45 | total | 55932.9494 | 56169.3994 |
| 2026.json | 2026 | 45 | payroll | 6156.5 | 6392.95 |
| 2026.json | 2026 | 45 | netTotal | 49271.7331 | 49508.1831 |
| 2026.json | 2026 | 45 | invTax | 24331.4224 | 24567.8724 |
| 2026.json | 2026 | 45 | gross | 55932.9494 | 56169.3994 |
| 2026.json | 2026 | 45 | avg | 0.3056 | 0.3069 |
| 2026.json | 2026 | 45 | grossAvg | 0.3056 | 0.3069 |
| 2026.json | 2026 | 45 | margBy.cg | 0.2373 | 0.2423 |
| 2026.json | 2026 | 45 | margBy.ed | 0.3204 | 0.3304 |
| 2026.json | 2026 | 45 | margBy.nd | 0.4197 | 0.4297 |
| 2026.json | 2026 | 45 | margBy.fd | 0.4746 | 0.4846 |
| 2026.json | 2026 | 45 | people.0.payroll | 6156.5 | 6392.95 |
| 2026.json | 2026 | 45 | people.0.total | 49271.7331 | 49508.1831 |
| 2026.json | 2026 | 47 | total | 146155.4801 | 146295.4801 |
| 2026.json | 2026 | 47 | payroll | 11473.8 | 11613.8 |
| 2026.json | 2026 | 47 | netTotal | 127521.5794 | 127661.5794 |
| 2026.json | 2026 | 47 | invTax | 11738.1875 | 11878.1875 |
| 2026.json | 2026 | 47 | gross | 149945.4801 | 150085.4801 |
| 2026.json | 2026 | 47 | avg | 0.4026 | 0.403 |
| 2026.json | 2026 | 47 | grossAvg | 0.4131 | 0.4135 |
| 2026.json | 2026 | 47 | margBy.cg | 0.1806 | 0.1856 |
| 2026.json | 2026 | 47 | margBy.ed | 0.1639 | 0.1739 |
| 2026.json | 2026 | 47 | margBy.nd | 0.2893 | 0.2993 |
| 2026.json | 2026 | 47 | margBy.fd | 0.3612 | 0.3712 |
| 2026.json | 2026 | 47 | people.0.payroll | 5239.9 | 5379.9 |
| 2026.json | 2026 | 47 | people.0.total | 29846.8143 | 29986.8143 |
| 2026.json | 2026 | 48 | total | 18190.0435 | 18596.4935 |
| 2026.json | 2026 | 48 | payroll | 1546.1 | 1952.55 |
| 2026.json | 2026 | 48 | netTotal | 9992.7237 | 10399.1737 |
| 2026.json | 2026 | 48 | invTax | 8446.6237 | 8853.0737 |
| 2026.json | 2026 | 48 | gross | 18190.0435 | 18596.4935 |
| 2026.json | 2026 | 48 | avg | 0.1624 | 0.166 |
| 2026.json | 2026 | 48 | grossAvg | 0.1624 | 0.166 |
| 2026.json | 2026 | 48 | margBy.cg | 0.1806 | 0.1856 |
| 2026.json | 2026 | 48 | margBy.ed | 0.1639 | 0.1739 |
| 2026.json | 2026 | 48 | margBy.nd | 0.2893 | 0.2993 |
| 2026.json | 2026 | 48 | margBy.fd | 0.3612 | 0.3712 |
| 2026.json | 2026 | 48 | people.0.payroll | 1546.1 | 1952.55 |
| 2026.json | 2026 | 48 | people.0.total | 9992.7237 | 10399.1737 |
| 2026.json | 2026 | 49 | total | -11258.7612 | -11108.7612 |
| 2026.json | 2026 | 49 | payroll | 1546.1 | 1696.1 |
| 2026.json | 2026 | 49 | netTotal | -18446.7612 | -18296.7612 |
| 2026.json | 2026 | 49 | invTax | 14759.1388 | 14909.1388 |
| 2026.json | 2026 | 49 | gross | 15183.2988 | 15333.2988 |
| 2026.json | 2026 | 49 | avg | -0.1632 | -0.161 |
| 2026.json | 2026 | 49 | grossAvg | 0.22 | 0.2222 |
| 2026.json | 2026 | 49 | people.0.payroll | 1546.1 | 1696.1 |
| 2026.json | 2026 | 49 | people.0.total | 7995.2988 | 8145.2988 |
| 2026.json | 2026 | 55 | total | 22047.4022 | 22197.4022 |
| 2026.json | 2026 | 55 | payroll | 6156.5 | 6306.5 |
| 2026.json | 2026 | 55 | netTotal | 11336.1859 | 11486.1859 |
| 2026.json | 2026 | 55 | invTax | 17757.004 | 17907.004 |
| 2026.json | 2026 | 55 | gross | 45874.6922 | 46024.6922 |
| 2026.json | 2026 | 55 | avg | 0.15 | 0.151 |
| 2026.json | 2026 | 55 | grossAvg | 0.3121 | 0.3131 |
| 2026.json | 2026 | 55 | people.0.payroll | 6156.5 | 6306.5 |
| 2026.json | 2026 | 55 | people.0.total | 35163.4759 | 35313.4759 |
| 2026.json | 2026 | 58 | total | 86204.5305 | 86354.5305 |
| 2026.json | 2026 | 58 | payroll | 6233.9 | 6383.9 |
| 2026.json | 2026 | 58 | netTotal | 73155.3107 | 73305.3107 |
| 2026.json | 2026 | 58 | invTax | 16259.8072 | 16409.8072 |
| 2026.json | 2026 | 58 | gross | 86204.5305 | 86354.5305 |
| 2026.json | 2026 | 58 | avg | 0.3918 | 0.3925 |
| 2026.json | 2026 | 58 | grossAvg | 0.3918 | 0.3925 |
| 2026.json | 2026 | 58 | people.0.payroll | 6233.9 | 6383.9 |
| 2026.json | 2026 | 58 | people.0.total | 73155.3107 | 73305.3107 |
| 2026.json | 2026 | 59 | total | 38662.3405 | 38802.3405 |
| 2026.json | 2026 | 59 | payroll | 5180 | 5320 |
| 2026.json | 2026 | 59 | netTotal | 17075.8405 | 17215.8405 |
| 2026.json | 2026 | 59 | invTax | 6432.1449 | 6572.1449 |
| 2026.json | 2026 | 59 | gross | 38662.3405 | 38802.3405 |
| 2026.json | 2026 | 59 | avg | 0.3682 | 0.3695 |
| 2026.json | 2026 | 59 | grossAvg | 0.3682 | 0.3695 |
| 2026.json | 2026 | 59 | people.1.payroll | 984 | 1124 |
| 2026.json | 2026 | 59 | people.1.total | 4267.9386 | 4407.9386 |
| 2026.json | 2026 | 62 | total | 43514.9158 | 43664.9158 |
| 2026.json | 2026 | 62 | payroll | 5713.5 | 5863.5 |
| 2026.json | 2026 | 62 | netTotal | 34326.5151 | 34476.5151 |
| 2026.json | 2026 | 62 | invTax | 22637.5365 | 22787.5365 |
| 2026.json | 2026 | 62 | gross | 47414.9638 | 47564.9638 |
| 2026.json | 2026 | 62 | avg | 0.3297 | 0.3308 |
| 2026.json | 2026 | 62 | grossAvg | 0.3592 | 0.3603 |
| 2026.json | 2026 | 62 | people.0.payroll | 5713.5 | 5863.5 |
| 2026.json | 2026 | 62 | people.0.total | 38226.5631 | 38376.5631 |
| 2026.json | 2026 | 71 | total | 38127.7406 | 38277.7406 |
| 2026.json | 2026 | 71 | payroll | 7217.9 | 7367.9 |
| 2026.json | 2026 | 71 | netTotal | 35971.3406 | 36121.3406 |
| 2026.json | 2026 | 71 | invTax | 8851.9701 | 9001.9701 |
| 2026.json | 2026 | 71 | gross | 50163.2586 | 50313.2586 |
| 2026.json | 2026 | 71 | avg | 0.1833 | 0.184 |
| 2026.json | 2026 | 71 | grossAvg | 0.2412 | 0.2419 |
| 2026.json | 2026 | 71 | people.1.payroll | 984 | 1134 |
| 2026.json | 2026 | 71 | people.1.total | 9835.9701 | 9985.9701 |
| 2026.json | 2026 | 73 | total | 69216.2668 | 69361.2668 |
| 2026.json | 2026 | 73 | payroll | 7217.9 | 7362.9 |
| 2026.json | 2026 | 73 | netTotal | 55623.447 | 55768.447 |
| 2026.json | 2026 | 73 | invTax | 5741.5058 | 5886.5058 |
| 2026.json | 2026 | 73 | gross | 69216.2668 | 69361.2668 |
| 2026.json | 2026 | 73 | avg | 0.3682 | 0.3689 |
| 2026.json | 2026 | 73 | grossAvg | 0.3682 | 0.3689 |
| 2026.json | 2026 | 73 | margBy.ed | 0.0264 | 0.0364 |
| 2026.json | 2026 | 73 | margBy.nd | 0.1654 | 0.1754 |
| 2026.json | 2026 | 73 | margBy.fd | 0.3013 | 0.3113 |
| 2026.json | 2026 | 73 | people.1.payroll | 984 | 1129 |
| 2026.json | 2026 | 73 | people.1.total | 5846.9435 | 5991.9435 |
| 2026.json | 2026 | 76 | total | 66915.2952 | 67065.2952 |
| 2026.json | 2026 | 76 | payroll | 6233.9 | 6383.9 |
| 2026.json | 2026 | 76 | netTotal | 49821.2952 | 49971.2952 |
| 2026.json | 2026 | 76 | invTax | 36611.9205 | 36761.9205 |
| 2026.json | 2026 | 76 | gross | 99868.0852 | 100018.0852 |
| 2026.json | 2026 | 76 | avg | 0.2731 | 0.2737 |
| 2026.json | 2026 | 76 | grossAvg | 0.4076 | 0.4082 |
| 2026.json | 2026 | 76 | people.0.payroll | 6233.9 | 6383.9 |
| 2026.json | 2026 | 76 | people.0.total | 82774.0852 | 82924.0852 |
| 2026.json | 2026 | 80 | total | -60598.4137 | -60448.4137 |
| 2026.json | 2026 | 80 | payroll | 421.9 | 571.9 |
| 2026.json | 2026 | 80 | netTotal | -62582.93 | -62432.93 |
| 2026.json | 2026 | 80 | invTax | 9076.77 | 9226.77 |
| 2026.json | 2026 | 80 | gross | 2406.4163 | 2556.4163 |
| 2026.json | 2026 | 80 | avg | -0.8301 | -0.8281 |
| 2026.json | 2026 | 80 | grossAvg | 0.033 | 0.035 |
| 2026.json | 2026 | 80 | people.0.payroll | 421.9 | 571.9 |
| 2026.json | 2026 | 80 | people.0.total | 421.9 | 571.9 |
| 2026.json | 2026 | 83 | total | 71967.5472 | 72555.4472 |
| 2026.json | 2026 | 83 | payroll | 7702.6 | 8290.5 |
| 2026.json | 2026 | 83 | netTotal | 61074.7275 | 61662.6275 |
| 2026.json | 2026 | 83 | invTax | 44566.7128 | 45154.6128 |
| 2026.json | 2026 | 83 | gross | 71967.5472 | 72555.4472 |
| 2026.json | 2026 | 83 | avg | 0.2383 | 0.2402 |
| 2026.json | 2026 | 83 | grossAvg | 0.2383 | 0.2402 |
| 2026.json | 2026 | 83 | margBy.cg | 0.2373 | 0.2423 |
| 2026.json | 2026 | 83 | margBy.ed | 0.3204 | 0.3304 |
| 2026.json | 2026 | 83 | margBy.nd | 0.4197 | 0.4297 |
| 2026.json | 2026 | 83 | margBy.fd | 0.4746 | 0.4846 |
| 2026.json | 2026 | 83 | people.0.payroll | 6156.5 | 6432.95 |
| 2026.json | 2026 | 83 | people.0.total | 41584.4352 | 41860.8852 |
| 2026.json | 2026 | 83 | people.1.payroll | 1546.1 | 1857.55 |
| 2026.json | 2026 | 83 | people.1.total | 19490.2923 | 19801.7423 |
| 2026.json | 2026 | 93 | total | 57457.946 | 57607.946 |
| 2026.json | 2026 | 93 | payroll | 6233.9 | 6383.9 |
| 2026.json | 2026 | 93 | netTotal | 42510.6263 | 42660.6263 |
| 2026.json | 2026 | 93 | invTax | 15696.0886 | 15846.0886 |
| 2026.json | 2026 | 93 | gross | 57457.946 | 57607.946 |
| 2026.json | 2026 | 93 | avg | 0.3321 | 0.333 |
| 2026.json | 2026 | 93 | grossAvg | 0.3321 | 0.333 |
| 2026.json | 2026 | 93 | people.0.payroll | 6233.9 | 6383.9 |
| 2026.json | 2026 | 93 | people.0.total | 42510.6263 | 42660.6263 |
| 2026.json | 2026 | 98 | total | -24600.447 | -24450.447 |
| 2026.json | 2026 | 98 | payroll | 5099.7 | 5249.7 |
| 2026.json | 2026 | 98 | netTotal | -29742.8667 | -29592.8667 |
| 2026.json | 2026 | 98 | invTax | 15781.3896 | 15931.3896 |
| 2026.json | 2026 | 98 | gross | 21167.138 | 21317.138 |
| 2026.json | 2026 | 98 | avg | -0.2158 | -0.2145 |
| 2026.json | 2026 | 98 | grossAvg | 0.1857 | 0.187 |
| 2026.json | 2026 | 98 | people.0.payroll | 1546.1 | 1696.1 |
| 2026.json | 2026 | 98 | people.0.total | 5828.1198 | 5978.1198 |
| 2026.json | 2026 | 105 | total | 62211.913 | 62296.913 |
| 2026.json | 2026 | 105 | payroll | 11947.4 | 12032.4 |
| 2026.json | 2026 | 105 | netTotal | 57531.8967 | 57616.8967 |
| 2026.json | 2026 | 105 | invTax | 9682.3017 | 9767.3017 |
| 2026.json | 2026 | 105 | gross | 62211.913 | 62296.913 |
| 2026.json | 2026 | 105 | avg | 0.2519 | 0.2522 |
| 2026.json | 2026 | 105 | grossAvg | 0.2519 | 0.2522 |
| 2026.json | 2026 | 105 | people.1.payroll | 6233.9 | 6318.9 |
| 2026.json | 2026 | 105 | people.1.total | 36496.8393 | 36581.8393 |
| 2026.json | 2026 | 110 | total | 40448.408 | 40804.858 |
| 2026.json | 2026 | 110 | payroll | 1546.1 | 1902.55 |
| 2026.json | 2026 | 110 | netTotal | 15799.1917 | 16155.6417 |
| 2026.json | 2026 | 110 | invTax | 30833.7917 | 31190.2417 |
| 2026.json | 2026 | 110 | gross | 44733.032 | 45089.482 |
| 2026.json | 2026 | 110 | avg | 0.3064 | 0.3091 |
| 2026.json | 2026 | 110 | grossAvg | 0.3389 | 0.3416 |
| 2026.json | 2026 | 110 | margBy.cg | 0.2446 | 0.2496 |
| 2026.json | 2026 | 110 | margBy.ed | 0.3404 | 0.3504 |
| 2026.json | 2026 | 110 | margBy.nd | 0.4364 | 0.4464 |
| 2026.json | 2026 | 110 | margBy.fd | 0.4891 | 0.4991 |
| 2026.json | 2026 | 110 | people.0.payroll | 1546.1 | 1902.55 |
| 2026.json | 2026 | 110 | people.0.total | 20083.8157 | 20440.2657 |
| 2026.json | 2026 | 113 | total | 10328.9359 | 10378.9359 |
| 2026.json | 2026 | 113 | payroll | 3553.6 | 3603.6 |
| 2026.json | 2026 | 113 | netTotal | 7522.6162 | 7572.6162 |
| 2026.json | 2026 | 113 | invTax | 3969.0162 | 4019.0162 |
| 2026.json | 2026 | 113 | gross | 10328.9359 | 10378.9359 |
| 2026.json | 2026 | 113 | avg | 0.1244 | 0.125 |
| 2026.json | 2026 | 113 | grossAvg | 0.1244 | 0.125 |
| 2026.json | 2026 | 113 | margBy.cg | 0.1284 | 0.1334 |
| 2026.json | 2026 | 113 | margBy.ed | 0.02 | 0.03 |
| 2026.json | 2026 | 113 | margBy.nd | 0.1694 | 0.1794 |
| 2026.json | 2026 | 113 | margBy.fd | 0.2569 | 0.2669 |
| 2026.json | 2026 | 113 | people.0.payroll | 3553.6 | 3603.6 |
| 2026.json | 2026 | 113 | people.0.total | 7522.6162 | 7572.6162 |
| 2026.json | 2026 | 114 | total | 2486.586 | 2636.586 |
| 2026.json | 2026 | 114 | payroll | 3553.6 | 3703.6 |
| 2026.json | 2026 | 114 | netTotal | 330.186 | 480.186 |
| 2026.json | 2026 | 114 | invTax | 24187.5038 | 24337.5038 |
| 2026.json | 2026 | 114 | gross | 24085.626 | 24235.626 |
| 2026.json | 2026 | 114 | avg | 0.0232 | 0.0246 |
| 2026.json | 2026 | 114 | grossAvg | 0.2251 | 0.2265 |
| 2026.json | 2026 | 114 | people.0.payroll | 3553.6 | 3703.6 |
| 2026.json | 2026 | 114 | people.0.total | 21929.226 | 22079.226 |
| 2026.json | 2026 | 117 | total | 63420.3792 | 63686.8292 |
| 2026.json | 2026 | 117 | payroll | 7780 | 8046.45 |
| 2026.json | 2026 | 117 | netTotal | 51536.4786 | 51802.9286 |
| 2026.json | 2026 | 117 | invTax | 25230.2348 | 25496.6848 |
| 2026.json | 2026 | 117 | gross | 67618.0992 | 67884.5492 |
| 2026.json | 2026 | 117 | avg | 0.261 | 0.2621 |
| 2026.json | 2026 | 117 | grossAvg | 0.2783 | 0.2794 |
| 2026.json | 2026 | 117 | margBy.cg | 0.2456 | 0.2506 |
| 2026.json | 2026 | 117 | margBy.ed | 0.3433 | 0.3533 |
| 2026.json | 2026 | 117 | margBy.nd | 0.4388 | 0.4488 |
| 2026.json | 2026 | 117 | margBy.fd | 0.4912 | 0.5012 |
| 2026.json | 2026 | 117 | people.1.payroll | 1546.1 | 1812.55 |
| 2026.json | 2026 | 117 | people.1.total | 17563.31 | 17829.76 |
| 2026.json | 2026 | 118 | total | 15657.5403 | 15863.9903 |
| 2026.json | 2026 | 118 | payroll | 0 | 206.45 |
| 2026.json | 2026 | 118 | netTotal | 4764.7206 | 4971.1706 |
| 2026.json | 2026 | 118 | invTax | 6490.7206 | 6697.1706 |
| 2026.json | 2026 | 118 | gross | 15657.5403 | 15863.9903 |
| 2026.json | 2026 | 118 | avg | 0.3132 | 0.3173 |
| 2026.json | 2026 | 118 | grossAvg | 0.3132 | 0.3173 |
| 2026.json | 2026 | 118 | margBy.ed | 0.1639 | 0.1739 |
| 2026.json | 2026 | 118 | margBy.nd | 0.2893 | 0.2993 |
| 2026.json | 2026 | 118 | margBy.fd | 0.4561 | 0.4661 |
| 2026.json | 2026 | 118 | people.0.payroll | 0 | 206.45 |
| 2026.json | 2026 | 118 | people.0.total | 4764.7206 | 4971.1706 |
| 2026.json | 2026 | 122 | total | 20181.0376 | 20276.0376 |
| 2026.json | 2026 | 122 | payroll | 3553.6 | 3648.6 |
| 2026.json | 2026 | 122 | netTotal | 14047.5369 | 14142.5369 |
| 2026.json | 2026 | 122 | invTax | 11925.2513 | 12020.2513 |
| 2026.json | 2026 | 122 | gross | 20181.0376 | 20276.0376 |
| 2026.json | 2026 | 122 | avg | 0.2691 | 0.2703 |
| 2026.json | 2026 | 122 | grossAvg | 0.2691 | 0.2703 |
| 2026.json | 2026 | 122 | margBy.cg | 0.1806 | 0.1856 |
| 2026.json | 2026 | 122 | margBy.ed | 0.1639 | 0.1739 |
| 2026.json | 2026 | 122 | margBy.nd | 0.2893 | 0.2993 |
| 2026.json | 2026 | 122 | margBy.fd | 0.3612 | 0.3712 |
| 2026.json | 2026 | 122 | people.0.payroll | 3553.6 | 3648.6 |
| 2026.json | 2026 | 122 | people.0.total | 14047.5369 | 14142.5369 |
| 2026.json | 2026 | 126 | total | 48334.476 | 48484.476 |
| 2026.json | 2026 | 126 | payroll | 6655.8 | 6805.8 |
| 2026.json | 2026 | 126 | netTotal | 40247.976 | 40397.976 |
| 2026.json | 2026 | 126 | invTax | 20984.5867 | 21134.5867 |
| 2026.json | 2026 | 126 | gross | 57563.796 | 57713.796 |
| 2026.json | 2026 | 126 | avg | 0.2291 | 0.2298 |
| 2026.json | 2026 | 126 | grossAvg | 0.2728 | 0.2735 |
| 2026.json | 2026 | 126 | people.0.payroll | 421.9 | 571.9 |
| 2026.json | 2026 | 126 | people.0.total | 11306.4074 | 11456.4074 |
| 2026.json | 2026 | 127 | total | 1662.468 | 1697.468 |
| 2026.json | 2026 | 127 | payroll | 4196 | 4231 |
| 2026.json | 2026 | 127 | netTotal | -4471.0327 | -4436.0327 |
| 2026.json | 2026 | 127 | invTax | 14718.4317 | 14753.4317 |
| 2026.json | 2026 | 127 | gross | 24284.778 | 24319.778 |
| 2026.json | 2026 | 127 | avg | 0.0216 | 0.022 |
| 2026.json | 2026 | 127 | grossAvg | 0.3154 | 0.3158 |
| 2026.json | 2026 | 127 | margBy.cg | 0.3206 | 0.3256 |
| 2026.json | 2026 | 127 | margBy.ed | 0.5503 | 0.5603 |
| 2026.json | 2026 | 127 | margBy.nd | 0.6113 | 0.6213 |
| 2026.json | 2026 | 127 | margBy.fd | 0.6412 | 0.6512 |
| 2026.json | 2026 | 127 | people.0.payroll | 4196 | 4231 |
| 2026.json | 2026 | 127 | people.0.total | 18151.2773 | 18186.2773 |
| 2026.json | 2026 | 130 | total | 182652.9642 | 182802.9642 |
| 2026.json | 2026 | 130 | payroll | 12467.8 | 12617.8 |
| 2026.json | 2026 | 130 | netTotal | 177254.1479 | 177404.1479 |
| 2026.json | 2026 | 130 | invTax | 15841.6309 | 15991.6309 |
| 2026.json | 2026 | 130 | gross | 184000.9642 | 184150.9642 |
| 2026.json | 2026 | 130 | avg | 0.3705 | 0.3708 |
| 2026.json | 2026 | 130 | grossAvg | 0.3732 | 0.3735 |
| 2026.json | 2026 | 130 | people.0.payroll | 6233.9 | 6383.9 |
| 2026.json | 2026 | 130 | people.0.total | 92200.7628 | 92350.7628 |
| 2026.json | 2026 | 133 | total | -39259.6194 | -39199.6194 |
| 2026.json | 2026 | 133 | payroll | 3975.5 | 4035.5 |
| 2026.json | 2026 | 133 | netTotal | -43144.1392 | -43084.1392 |
| 2026.json | 2026 | 133 | invTax | 21840.9837 | 21900.9837 |
| 2026.json | 2026 | 133 | gross | 15400.9106 | 15460.9106 |
| 2026.json | 2026 | 133 | avg | -0.4513 | -0.4506 |
| 2026.json | 2026 | 133 | grossAvg | 0.177 | 0.1777 |
| 2026.json | 2026 | 133 | margBy.cg | 0.3434 | 0.3484 |
| 2026.json | 2026 | 133 | margBy.ed | 0.6134 | 0.6234 |
| 2026.json | 2026 | 133 | margBy.nd | 0.6639 | 0.6739 |
| 2026.json | 2026 | 133 | margBy.fd | 0.6869 | 0.6969 |
| 2026.json | 2026 | 133 | people.1.payroll | 3553.6 | 3613.6 |
| 2026.json | 2026 | 133 | people.1.total | 11094.4908 | 11154.4908 |
| 2026.json | 2026 | 134 | total | 33907.7059 | 34057.7059 |
| 2026.json | 2026 | 134 | payroll | 7259.6 | 7409.6 |
| 2026.json | 2026 | 134 | netTotal | 28516.7059 | 28666.7059 |
| 2026.json | 2026 | 134 | invTax | 5427.1733 | 5577.1733 |
| 2026.json | 2026 | 134 | gross | 33907.7059 | 34057.7059 |
| 2026.json | 2026 | 134 | avg | 0.2307 | 0.2317 |
| 2026.json | 2026 | 134 | grossAvg | 0.2307 | 0.2317 |
| 2026.json | 2026 | 134 | people.0.payroll | 1546.1 | 1696.1 |
| 2026.json | 2026 | 134 | people.0.total | 7153.8718 | 7303.8718 |
| 2026.json | 2026 | 135 | total | 28163.5879 | 28400.0379 |
| 2026.json | 2026 | 135 | payroll | 2830.9 | 3067.35 |
| 2026.json | 2026 | 135 | netTotal | 10702.3716 | 10938.8216 |
| 2026.json | 2026 | 135 | invTax | 14686.9836 | 14923.4336 |
| 2026.json | 2026 | 135 | gross | 28163.5879 | 28400.0379 |
| 2026.json | 2026 | 135 | avg | 0.2537 | 0.2559 |
| 2026.json | 2026 | 135 | grossAvg | 0.2537 | 0.2559 |
| 2026.json | 2026 | 135 | margBy.cg | 0.1806 | 0.1856 |
| 2026.json | 2026 | 135 | margBy.ed | 0.1639 | 0.1739 |
| 2026.json | 2026 | 135 | margBy.nd | 0.2893 | 0.2993 |
| 2026.json | 2026 | 135 | margBy.fd | 0.3612 | 0.3712 |
| 2026.json | 2026 | 135 | people.0.payroll | 2830.9 | 3067.35 |
| 2026.json | 2026 | 135 | people.0.total | 10702.3716 | 10938.8216 |
| 2026.json | 2026 | 140 | total | 42921.4775 | 43282.9275 |
| 2026.json | 2026 | 140 | payroll | 7026.9 | 7388.35 |
| 2026.json | 2026 | 140 | netTotal | 40397.8613 | 40759.3113 |
| 2026.json | 2026 | 140 | invTax | 25719.0213 | 26080.4713 |
| 2026.json | 2026 | 140 | gross | 44365.7015 | 44727.1515 |
| 2026.json | 2026 | 140 | avg | 0.2247 | 0.2266 |
| 2026.json | 2026 | 140 | grossAvg | 0.2323 | 0.2342 |
| 2026.json | 2026 | 140 | people.0.payroll | 2830.9 | 3192.35 |
| 2026.json | 2026 | 140 | people.0.total | 29034.1834 | 29395.6334 |
| 2026.json | 2026 | 143 | total | 117.6121 | 202.6121 |
| 2026.json | 2026 | 143 | payroll | 2530.1 | 2615.1 |
| 2026.json | 2026 | 143 | netTotal | -3766.9076 | -3681.9076 |
| 2026.json | 2026 | 143 | invTax | 14590.2844 | 14675.2844 |
| 2026.json | 2026 | 143 | gross | 11237.5021 | 11322.5021 |
| 2026.json | 2026 | 143 | avg | 0.0013 | 0.0023 |
| 2026.json | 2026 | 143 | grossAvg | 0.1263 | 0.1272 |
| 2026.json | 2026 | 143 | people.1.payroll | 984 | 1069 |
| 2026.json | 2026 | 143 | people.1.total | 5806.8824 | 5891.8824 |
| 2026.json | 2026 | 147 | total | 115349.8407 | 115384.8407 |
| 2026.json | 2026 | 147 | payroll | 6233.9 | 6268.9 |
| 2026.json | 2026 | 147 | netTotal | 112630.64 | 112665.64 |
| 2026.json | 2026 | 147 | invTax | 11165.8748 | 11200.8748 |
| 2026.json | 2026 | 147 | gross | 115349.8407 | 115384.8407 |
| 2026.json | 2026 | 147 | avg | 0.4577 | 0.4579 |
| 2026.json | 2026 | 147 | grossAvg | 0.4577 | 0.4579 |
| 2026.json | 2026 | 147 | margBy.ed | 0.4011 | 0.4111 |
| 2026.json | 2026 | 147 | margBy.nd | 0.487 | 0.497 |
| 2026.json | 2026 | 147 | margBy.fd | 0.5331 | 0.5431 |
| 2026.json | 2026 | 147 | people.0.payroll | 6233.9 | 6268.9 |
| 2026.json | 2026 | 147 | people.0.total | 112630.64 | 112665.64 |
| other-income-original.json | 2025 | 148 | total | 7397.3213 | 7547.3213 |
| other-income-original.json | 2025 | 148 | payroll | 0 | 150 |
| other-income-original.json | 2025 | 148 | netTotal | 3803.3213 | 3953.3213 |
| other-income-original.json | 2025 | 148 | gross | 9186.3213 | 9336.3213 |
| other-income-original.json | 2025 | 148 | avg | 0.1849 | 0.1887 |
| other-income-original.json | 2025 | 148 | grossAvg | 0.2297 | 0.2334 |
| other-income-original.json | 2025 | 148 | people.0.payroll | 0 | 150 |
| other-income-original.json | 2025 | 148 | people.0.total | 5592.3213 | 5742.3213 |
| other-income-original.json | 2025 | 150 | total | 25246.9272 | 25365.6272 |
| other-income-original.json | 2025 | 150 | payroll | 3878 | 3996.7 |
| other-income-original.json | 2025 | 150 | netTotal | 21652.9272 | 21771.6272 |
| other-income-original.json | 2025 | 150 | gross | 25246.9272 | 25365.6272 |
| other-income-original.json | 2025 | 150 | avg | 0.3156 | 0.3171 |
| other-income-original.json | 2025 | 150 | grossAvg | 0.3156 | 0.3171 |
| other-income-original.json | 2025 | 150 | margBy.cg | 0.1806 | 0.1856 |
| other-income-original.json | 2025 | 150 | margBy.ed | 0.1639 | 0.1739 |
| other-income-original.json | 2025 | 150 | margBy.nd | 0.2893 | 0.2993 |
| other-income-original.json | 2025 | 150 | margBy.fd | 0.3612 | 0.3712 |
| other-income-original.json | 2025 | 150 | people.0.payroll | 3878 | 3996.7 |
| other-income-original.json | 2025 | 150 | people.0.total | 21652.9272 | 21771.6272 |
| other-income-original.json | 2025 | 151 | total | 40158.5038 | 40877.9038 |
| other-income-original.json | 2025 | 151 | payroll | 0 | 719.4 |
| other-income-original.json | 2025 | 151 | netTotal | 29814.5038 | 30533.9038 |
| other-income-original.json | 2025 | 151 | gross | 40158.5038 | 40877.9038 |
| other-income-original.json | 2025 | 151 | avg | 0.3347 | 0.3406 |
| other-income-original.json | 2025 | 151 | grossAvg | 0.3347 | 0.3406 |
| other-income-original.json | 2025 | 151 | margBy.cg | 0.2056 | 0.2106 |
| other-income-original.json | 2025 | 151 | margBy.ed | 0.2329 | 0.2429 |
| other-income-original.json | 2025 | 151 | margBy.nd | 0.3468 | 0.3568 |
| other-income-original.json | 2025 | 151 | margBy.fd | 0.4112 | 0.4212 |
| other-income-original.json | 2025 | 151 | people.0.payroll | 0 | 719.4 |
| other-income-original.json | 2025 | 151 | people.0.total | 29814.5038 | 30533.9038 |
| other-income-original.json | 2025 | 153 | total | 9608.243 | 9726.943 |
| other-income-original.json | 2025 | 153 | payroll | 4474.4 | 4593.1 |
| other-income-original.json | 2025 | 153 | netTotal | 6014.243 | 6132.943 |
| other-income-original.json | 2025 | 153 | gross | 22426.067 | 22544.767 |
| other-income-original.json | 2025 | 153 | avg | 0.1011 | 0.1024 |
| other-income-original.json | 2025 | 153 | grossAvg | 0.2361 | 0.2373 |
| other-income-original.json | 2025 | 153 | people.1.payroll | 1416.8 | 1535.5 |
| other-income-original.json | 2025 | 153 | people.1.total | 9377.0509 | 9495.7509 |
| other-income-original.json | 2025 | 154 | total | -12647.4875 | -12578.7875 |
| other-income-original.json | 2025 | 154 | payroll | 1580.88 | 1649.58 |
| other-income-original.json | 2025 | 154 | netTotal | -16241.4875 | -16172.7875 |
| other-income-original.json | 2025 | 154 | gross | 10185.7325 | 10254.4325 |
| other-income-original.json | 2025 | 154 | avg | -0.2691 | -0.2676 |
| other-income-original.json | 2025 | 154 | grossAvg | 0.2167 | 0.2182 |
| other-income-original.json | 2025 | 154 | margBy.cg | 0.2862 | 0.2912 |
| other-income-original.json | 2025 | 154 | margBy.ed | 0.4553 | 0.4653 |
| other-income-original.json | 2025 | 154 | margBy.nd | 0.5321 | 0.5421 |
| other-income-original.json | 2025 | 154 | margBy.fd | 0.6089 | 0.6189 |
| other-income-original.json | 2025 | 154 | people.0.payroll | 1580.88 | 1649.58 |
| other-income-original.json | 2025 | 154 | people.0.total | 6591.7325 | 6660.4325 |
| other-income-original.json | 2025 | 155 | total | -15957.5948 | -15807.5948 |
| other-income-original.json | 2025 | 155 | payroll | 0 | 150 |
| other-income-original.json | 2025 | 155 | netTotal | -19551.5948 | -19401.5948 |
| other-income-original.json | 2025 | 155 | gross | 13221.6852 | 13371.6852 |
| other-income-original.json | 2025 | 155 | avg | -0.266 | -0.2635 |
| other-income-original.json | 2025 | 155 | grossAvg | 0.2204 | 0.2229 |
| other-income-original.json | 2025 | 155 | people.0.payroll | 0 | 150 |
| other-income-original.json | 2025 | 155 | people.0.total | 9627.6852 | 9777.6852 |
| other-income-original.json | 2025 | 156 | total | 5675.3137 | 5694.0137 |
| other-income-original.json | 2025 | 156 | payroll | 3243.8 | 3262.5 |
| other-income-original.json | 2025 | 156 | netTotal | 2081.3137 | 2100.0137 |
| other-income-original.json | 2025 | 156 | gross | 13861.2637 | 13879.9637 |
| other-income-original.json | 2025 | 156 | avg | 0.0873 | 0.0876 |
| other-income-original.json | 2025 | 156 | grossAvg | 0.2133 | 0.2135 |
| other-income-original.json | 2025 | 156 | people.0.payroll | 2237.2 | 2255.9 |
| other-income-original.json | 2025 | 156 | people.0.total | 9260.6637 | 9279.3637 |
| other-income-original.json | 2026 | 148 | total | 7396.6175 | 7546.6175 |
| other-income-original.json | 2026 | 148 | payroll | 0 | 150 |
| other-income-original.json | 2026 | 148 | netTotal | 3435.4012 | 3585.4012 |
| other-income-original.json | 2026 | 148 | gross | 9356.6175 | 9506.6175 |
| other-income-original.json | 2026 | 148 | avg | 0.1849 | 0.1887 |
| other-income-original.json | 2026 | 148 | grossAvg | 0.2339 | 0.2377 |
| other-income-original.json | 2026 | 148 | people.0.payroll | 0 | 150 |
| other-income-original.json | 2026 | 148 | people.0.total | 5395.4012 | 5545.4012 |
| other-income-original.json | 2026 | 150 | total | 25171.4798 | 25286.4798 |
| other-income-original.json | 2026 | 150 | payroll | 3794.5 | 3909.5 |
| other-income-original.json | 2026 | 150 | netTotal | 21210.2636 | 21325.2636 |
| other-income-original.json | 2026 | 150 | gross | 25171.4798 | 25286.4798 |
| other-income-original.json | 2026 | 150 | avg | 0.3146 | 0.3161 |
| other-income-original.json | 2026 | 150 | grossAvg | 0.3146 | 0.3161 |
| other-income-original.json | 2026 | 150 | margBy.cg | 0.1806 | 0.1856 |
| other-income-original.json | 2026 | 150 | margBy.ed | 0.1639 | 0.1739 |
| other-income-original.json | 2026 | 150 | margBy.nd | 0.2893 | 0.2993 |
| other-income-original.json | 2026 | 150 | margBy.fd | 0.3612 | 0.3712 |
| other-income-original.json | 2026 | 150 | people.0.payroll | 3794.5 | 3909.5 |
| other-income-original.json | 2026 | 150 | people.0.total | 21210.2636 | 21325.2636 |
| other-income-original.json | 2026 | 151 | total | 40036.3616 | 40742.8116 |
| other-income-original.json | 2026 | 151 | payroll | 0 | 706.45 |
| other-income-original.json | 2026 | 151 | netTotal | 29325.1454 | 30031.5954 |
| other-income-original.json | 2026 | 151 | gross | 40036.3616 | 40742.8116 |
| other-income-original.json | 2026 | 151 | avg | 0.3336 | 0.3395 |
| other-income-original.json | 2026 | 151 | grossAvg | 0.3336 | 0.3395 |
| other-income-original.json | 2026 | 151 | margBy.cg | 0.2056 | 0.2106 |
| other-income-original.json | 2026 | 151 | margBy.ed | 0.2329 | 0.2429 |
| other-income-original.json | 2026 | 151 | margBy.nd | 0.3468 | 0.3568 |
| other-income-original.json | 2026 | 151 | margBy.fd | 0.4112 | 0.4212 |
| other-income-original.json | 2026 | 151 | people.0.payroll | 0 | 706.45 |
| other-income-original.json | 2026 | 151 | people.0.total | 29325.1454 | 30031.5954 |
| other-income-original.json | 2026 | 153 | total | 9027.2646 | 9142.2646 |
| other-income-original.json | 2026 | 153 | payroll | 4377 | 4492 |
| other-income-original.json | 2026 | 153 | netTotal | 5066.0483 | 5181.0483 |
| other-income-original.json | 2026 | 153 | gross | 22282.8736 | 22397.8736 |
| other-income-original.json | 2026 | 153 | avg | 0.095 | 0.0962 |
| other-income-original.json | 2026 | 153 | grossAvg | 0.2346 | 0.2358 |
| other-income-original.json | 2026 | 153 | people.1.payroll | 1385.5 | 1500.5 |
| other-income-original.json | 2026 | 153 | people.1.total | 9125.4494 | 9240.4494 |
| other-income-original.json | 2026 | 154 | total | -13517.1023 | -13452.1023 |
| other-income-original.json | 2026 | 154 | payroll | 1546.1 | 1611.1 |
| other-income-original.json | 2026 | 154 | netTotal | -17478.3186 | -17413.3186 |
| other-income-original.json | 2026 | 154 | gross | 10312.1977 | 10377.1977 |
| other-income-original.json | 2026 | 154 | avg | -0.2876 | -0.2862 |
| other-income-original.json | 2026 | 154 | grossAvg | 0.2194 | 0.2208 |
| other-income-original.json | 2026 | 154 | margBy.cg | 0.2841 | 0.2891 |
| other-income-original.json | 2026 | 154 | margBy.ed | 0.4495 | 0.4595 |
| other-income-original.json | 2026 | 154 | margBy.nd | 0.5273 | 0.5373 |
| other-income-original.json | 2026 | 154 | margBy.fd | 0.6096 | 0.6196 |
| other-income-original.json | 2026 | 154 | people.0.payroll | 1546.1 | 1611.1 |
| other-income-original.json | 2026 | 154 | people.0.total | 6350.9814 | 6415.9814 |
| other-income-original.json | 2026 | 155 | total | -17253.2372 | -17103.2372 |
| other-income-original.json | 2026 | 155 | payroll | 0 | 150 |
| other-income-original.json | 2026 | 155 | netTotal | -21214.4534 | -21064.4534 |
| other-income-original.json | 2026 | 155 | gross | 13238.3728 | 13388.3728 |
| other-income-original.json | 2026 | 155 | avg | -0.2876 | -0.2851 |
| other-income-original.json | 2026 | 155 | grossAvg | 0.2206 | 0.2231 |
| other-income-original.json | 2026 | 155 | people.0.payroll | 0 | 150 |
| other-income-original.json | 2026 | 155 | people.0.total | 9277.1566 | 9427.1566 |
| other-income-original.json | 2026 | 156 | total | 5070.8226 | 5085.8226 |
| other-income-original.json | 2026 | 156 | payroll | 3172.5 | 3187.5 |
| other-income-original.json | 2026 | 156 | netTotal | 1109.6064 | 1124.6064 |
| other-income-original.json | 2026 | 156 | gross | 13852.2326 | 13867.2326 |
| other-income-original.json | 2026 | 156 | avg | 0.078 | 0.0782 |
| other-income-original.json | 2026 | 156 | grossAvg | 0.2131 | 0.2133 |
| other-income-original.json | 2026 | 156 | people.0.payroll | 2188.5 | 2203.5 |
| other-income-original.json | 2026 | 156 | people.0.total | 8907.0164 | 8922.0164 |

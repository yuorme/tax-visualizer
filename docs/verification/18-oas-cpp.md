# Issue #18: OAS and CPP/QPP retirement income

Coverage is **2025 and 2026, all thirteen jurisdictions**. PR #198 implemented the engine half of #18 and both
#91 comments. The page branch adds controls, tooltips, URL encoding and saved-state migration, described below.
GIS (#19), pension splitting (#20) and seniors' supplements (#21) are not included. No existing golden changes.

## Contract and assumptions

- `Person.oas?: boolean` explicitly opts into full resident OAS. Omission leaves legacy inputs unchanged;
  age alone does not enable receipts. `true` requires year-end `age` and `birthMonth` (1–12).
- `Person.cppQpp?: number` is annual gross CPP/QPP retirement receipts, finite and nonnegative. It does not
  estimate entitlement, require age, create earned income, or establish a payroll stop election.
- Both amounts are additional to other income and typed retirement receipts. Move amounts out of `oth` when
  using these fields; neither engine nor page moves existing amounts or guesses their composition.
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

Income-tax credits and benefits generally use income after the federal recovery deduction; T778's claimant
comparison and Ontario CARE are explicit exceptions, documented below. Quebec's worker deduction stays wage-based.
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
| T778 claimant ranking reversed by recovery, both adult orders | `t778-recovery-reverses-ranking*` |
| CARE rate step and final cutoff, each ±0.01 | `care-recovery-106800-*`, `care-recovery-150000-*` |
| CARE reviewer reproduction, CCB retaining recovery | `care-review-reproduction-ccb-retains-recovery` |
| Quebec childcare retains recovery despite CARE's add-back | `childcare-retains-recovery` |

Targeted tests additionally exercise every birthday month, validation and unsupported years, real-income scaling,
payroll-election independence, enhanced payroll deductions before recovery, and totals/credits equivalence to
an independently constructed ordinary-income control in all thirteen jurisdictions at low, partial and full recovery.

## PR #198 review corrections and line 23500 audit

The review of `be00c0b` found two consumers that must not use post-recovery income. The new tests reproduced
both errors. The correction changes only those consumers; `netOf` continues to represent post-recovery net income.

1. [T778 page 2](2025/sources/t778-childcare.txt) compares the adults before both line 21400 and line 23500.
   The automatic claimant comparison now calculates income with neither deduction. It does not add recovery to
   an already floored net income or use the selected claimant's eventual childcare deduction to choose that claimant.
2. [ON479-A page 2](2025/sources/ontario-care.txt) starts with unfloored line 23600, adds lines 21400 and 23500,
   then floors each person's result before adding the family. `incomeBases.beforeChildcareAndRecovery` supplies
   that basis. The existing `beforeChildcare` retains actual recovery, and `federal`, `provincial` and
   `provincialFamily` continue to include the correct recovery deduction. The obsolete no-repayment assumption
   in `childcare-credits.ts` is removed. A floating-point guard prevents a few binary roundoff bits from advancing
   CARE to the next rate step; genuine one-cent crossings still change the rate.

Independent calculations for the added cases:

- T778: adult A has gross/net-before-recovery income 100,000. A's recovery is 981.90 in 2025 or 701.55 in 2026.
  Adult B earns 100,695. Enhanced CPP is `(71,300 − 3,500) × .01 + (81,200 − 71,300) × .04 = 1,074`
  in 2025, and `(74,600 − 3,500) × .01 + (85,000 − 74,600) × .04 = 1,127` in 2026. Thus B's comparison
  income is 99,621 / 99,568, below A's 100,000 but above A's post-recovery 99,018.10 / 99,298.45.
  B has sufficient eligible earnings and claims the full 8,000; A claims zero. The two adult orders are locked.
- CARE reproduction: at age 74, wages 50,000 no longer attract CPP enhancements. Other income is 48,208.86 /
  48,000.51, giving 107,000 with OAS. Deducting childcare 8,000 gives recovery income 99,000, liability
  831.90 / 551.55 and federal net 98,168.10 / 98,448.45. CARE adds both deductions back to 107,000:
  the published rate is 23%, hence 1,840. Without the recovery add-back it wrongly pays 2,000 in both years.
  The CCB deliberately retains recovery: `7,997 − 3,061 − .032 × (98,168.10 − 81,222) = 4,393.7248`
  in 2025; `8,157 − 3,123 − .032 × (98,448.45 − 82,847) = 4,534.7536` in 2026.
- CARE boundaries: 106,799.99 and 106,800 use 25%; 106,800.01 uses 23%. At 149,999.99 / 150,000 the rate
  is 1%, and at 150,000.01 it is zero. With an 8,000 claim these are 2,000 / 1,840 and 80 / 0 respectively.
  All have positive recovery, proving the add-back at each boundary in both years.
- Quebec Schedule C: income before deductions is the OAS threshold plus 10,000. A verified federal childcare
  claim of 8,000 makes recovery 300. Federal net is threshold plus 1,700; Quebec family income and childcare
  credit income remain threshold plus 9,700, not the CARE basis of threshold plus 10,000.

The review adds **20 cases / 130 numeric expectations**, without altering the original 114 cases. The final
new fixture has **134 cases / 1,892 expectations**. In each year ON has 37 cases / 470 cells, QC has 19 / 289,
and each of the other eleven jurisdictions has 1 / 17. All 55 pre-existing golden files remain byte-identical.

### Other income-tested programs examined

The audit followed every net-income consumer in `household.ts`, `personal.ts`, `credits.ts`, `benefits.ts`,
`senior-credits.ts`, `childcare.ts`, `childcare-credits.ts` and `health-premiums.ts`; it also inspected the
income-tested carbon payment formulas. Searches included `23500`, `23400`, social-benefits repayments and
the corresponding Quebec line 250 deduction in cached forms and program guides. These are the dispositions;
the 2026 programs continue the documented 2025 filing mechanics where new forms are not yet published.

| Programs | Form basis and disposition |
| --- | --- |
| T778 automatic claimant | Excludes 21400 and 23500; fixed. Exceptional Part D claims remain verified manual input. |
| Ontario CARE | ON479-A adds both deductions before individual zero floors; fixed. |
| OAS recovery itself | Worksheet uses 23400 before its own repayment; already correct. |
| Federal / CRA-filed age, BPA, spouse/dependant credits | 23600 or taxable 26000; retain recovery. |
| Saskatchewan/Nunavut child claimants; Manitoba family benefit | Net/taxable-income comparisons retain recovery. |
| BC, NB, NS, PE, NL low-income reductions | 428s start with 23600; UCCB/RDSP adjustments are not OAS add-backs. |
| Ontario tax reduction, LIFT and health premium | Higher net-income claimant, adjusted 23600, or taxable 26000; retain. |
| Federal/CRA provincial FTC | T2209 note 3 starts with 23600; T2036 imports it. No 23500 add-back. |
| Quebec FTC | TP-772-V lines 20–25 start with 275 and deduct specified taxable-income deductions; retain recovery. |
| CWB, including secondary-earner exemption | Schedule 6 Part B starts with 23600, adjusting UCCB/RDSP, not OAS. |
| CCB; BC/AB/ON/NB/NS/PE/NL/YT/NT/NU child benefits | T4114 adjusted family net income; retain recovery. |
| GST/HST/CGEB; SK, NB, NS, PE, NL income-tested refundable credits | RC4210 adjusted family net income; retain recovery. |
| Ontario sales and energy/property credits; BC renter's credit | Adjusted family net income, no OAS add-back. |
| Quebec age/living-alone pool, solidarity, work premium, Family Allowance | Provincial line 275; retain line 250 recovery. |
| Quebec childcare | Schedule C lines 76/78 use 275; no CARE-style add-back. |
| Quebec Health Services Fund | Schedule F starts at total income, excludes OAS, never deducts OAS recovery; correct. |
| Income-tested carbon payments (BC; historical PE entries) | Adjusted family net income; retain recovery. |
| Other carbon rebates; Manitoba housing credits | No relevant income taper; no recovery adjustment. |
| Historical BC MSP | Absent in 2025–2026; new OAS inputs reject its earlier years. No new intersection. |

Supporting source groups:

- [All-jurisdiction 428s, worksheets and S2s](138-senior-credit-rules/sources/) include the age amounts,
  low-income reductions, child claimant rules and Manitoba family benefit; no 23500 add-back appears in these.
  [LIFT](2025/sources/oas-audit-on-lift.txt), [T2209](2025/sources/oas-audit-t2209.txt) and
  [T2036](2025/sources/oas-audit-t2036.txt) were additionally cached for this audit.
- [CWB Schedule 6](2025/sources/issue-102-schedule6.txt), [T4114](2025/sources/t4114-25.txt),
  [RC4210](2025/sources/rc4210-25.txt), [BC479](2025/sources/oas-audit-bc479.txt) and
  [OEPTC guidance](2025/sources/oas-audit-oeptc.txt) distinguish OAS recovery from UCCB/RDSP repayments.
  [CRA line 23600](2025/sources/oas-audit-net-income.txt) supplies the general net-income definition.
- Quebec [Schedule C](2025/sources/quebec-childcare-schedule.txt), [Schedule B](2025/sources/qc-schedule-b.txt),
  [Schedule P](2025/sources/qc-work-premium-income.txt), [solidarity](2025/sources/qc-solidarity-guide.txt),
  [Family Allowance definition](2026/sources/quebec-family-income.txt) and
  [Schedule F](2025/sources/qc-schedule-f-2025.txt)
  preserve their separate bases. The [BC carbon guide](2025/sources/carbon-bc-rebates.txt) uses adjusted family income.
- Quebec [TP-772-V (2025-12), pages 1–3](2025/sources/oas-audit-tp772.txt) supplies the missing Quebec FTC
  evidence: lines 20–25 use line 275, with no line 250 recovery add-back; lines 42/49 deduct federal FTC and
  lines 58/59 limit the provincial credit to its income share and tax otherwise payable.

No additional modelled program needed a line 23500 correction. The federal worksheet also uses pre-recovery
income for EI repayment and the line 25000 net-supplement deduction. Those receipts and GIS remain unmodelled;
no amounts are inferred from `oth`. This audit does not claim their implementation or expand senior supplements.

## Issue #206: audit follow-up

The [PR #198 audit](https://github.com/yuorme/tax-visualizer/pull/198#issuecomment-6654125640) and the #195
audit are now covered by one additive `senior-audit.json` fixture and `senior-audit.test.ts` runner. Expectations
were prepared with Python Decimal arithmetic using the published literals in these notes and cached forms;
the preparation imported neither engine code nor production YAML and took no snapshots. Cases retain full
calculated precision and use `1e-8` for binary arithmetic. All pre-existing golden files remain byte-identical.

There are **102 new cases / 248 numeric assertions**. Each year's additions have these same counts:

| Jurisdiction | Cases | Assertions |
| --- | ---: | ---: |
| ON | 20 | 42 |
| QC | 8 | 21 |
| MB | 5 | 13 |
| NS | 4 | 13 |
| PE | 4 | 7 |
| SK, NU (each) | 2 | 5 |
| AB, BC, NB, NL, NT, YT (each) | 1 | 3 |
| Total per year | 51 | 124 |

These are new assertions, with no prior expected value. The only runtime edit corrects the unused reporting
field `incomeBases.beforeChildcare`: pass actual supplements into `netIncomeParts` so an Allowance recipient
without an `oas` property still retains their recovery deduction. For `2025-ON-audit-allowance-recovery`, the
old unasserted value 216,695.09 becomes `200,000 + 16,695.09 - 16,695.09 = 200,000`. Separate new cases assert
200,000 in both years; the original cases and their tax/benefit expectations are unchanged. The other cleanup
is already resolved by #19: `publicPensions.recoveryIncome` has golden readers/assertions, so it is retained.
The new self-employment cases assert it in all thirteen jurisdictions too. No tax-rule defect was exposed.

### Independent calculations and gap mapping

All amounts below follow the existing 2025 forms and the documented provisional 2026 mechanics.
The [#17 follow-up](17-senior-credits.md#issue-206-post-merge-audit-coverage) supplies senior-only calculations.

- **`self-employed-recovery` (B08):** 110,000 business profit at age 66, no payroll election. In 2025/2026,
  CPP employer halves are 3,356.10/3,519.45; both enhanced shares total 2,148/2,254. Thus federal recovery bases
  are `110,000 + 8,791.14/8,999.49 - employer half - enhancements = 113,287.04/113,226.04` and recoveries
  are 2,974.956/2,685.456. Quebec instead deducts QPP employer halves 3,661.20/3,768.30 and QPIP deductions
  `98,000 × .00878 × .43736 = 376.3220384` / `103,000 × .00764 × .43717 = 344.0178164`.
  Its bases are 112,605.6179616/112,633.1721836 and recoveries 2,872.74269424/2,596.52582754.
- **`child-benefit-recovery` (C07):** total income 100,000 gives recovery 981.90/701.55 and net income
  99,018.10/99,298.45. ON with four young children pays `4 × 1,726.92/1,760 - .08 × (net - 26,364/26,865)`.
  QC with two young children pays `2 × 3,006/3,068 + 1,055/1,077 - .04 × (net - 43,280/44,032)`.
  Both remain inside their benefit tapers, above zero/minimum; the recovery deduction changes entitlement.
- **`spouse-bpa-recovery` (C11):** total income 200,000 recovers all OAS. The zero-income spouse's federal
  amount is the claimant's post-recovery BPA: subtract `1,591 × (net - 177,882) / 75,532` from 16,129 in 2025,
  or `1,623 × (net - 181,440) / 77,042` from 16,452 in 2026. Multiply by .145/.14 for the spouse credit.
- **`foreign-credit-recovery`, `provincial-foreign-share` (D05/D06/D11):** OAS plus other/foreign receipts
  total 100,000; foreign income is 20,000. Calculate bracket tax independently, subtract BPA and the still
  positive age amount, then use `foreign / (100,000 - recovery)`. At 15% withholding, federal FTC is limited
  by this share; recovery is excluded from basic tax. Provincial FTC uses the lesser of remaining withholding,
  provincial tax times its own net-income share, and provincial tax. ON surtax precedes FTC. A separate ON
  case uses the existing engine's 50% withholding setting to make the provincial share bind. QC has no wages,
  childcare or supplements in this case, so its TP-772-V income basis equals post-recovery federal net income.
- **`health-premium-*` (D07):** other income is 199,999, 200,000, 200,001, 200,599, 200,600 or 200,601, plus
  OAS. Full recovery removes OAS from taxable income. OHP is `min(900, 750 + .25 × max(0, income - 200,000))`.
- **`couple-pool-recovery` (C13):** the OAS spouse has total income 100,000 including 3,000 RPP; the other
  age-65 spouse has 3,000 RPP. Schedule B starts with two age amounts and two capped retirement amounts.
  Reduce once by `.1875 × (103,000 - recovery - 42,090/42,955)`. The first return can use the whole pool.
  This deliberately combines retirement caps and the post-recovery family taper; both are calculated explicitly.
- **`claimant-recovery-reversal`, `child-claimant-recovery-reversal` (C12/C19):** the OAS recipient's
  100,000 falls below the other adult's 99,500 after recovery in both years. MB's ten child claims belong
  to the latter, with base `2,065 + 10 × 2,752 - .09 × 99,500`; the OAS recipient's own base is zero.
  SK/NU child claims go to the former (lower taxable/net income); no synthetic income tie is involved.
- **`large-family-recovery` (C17/D13):** supported child counts make these intersections reachable.
  MB's single senior with ten children has base `3 × 2,065 + 9 × 2,752 - .09 × net`; the three terms are
  basic, own age and eligible dependant. PE's senior with fifteen children has reduction
  `350 + 350 + 250 + 14 × 300 - .05 × (net - 22,650/23,000)`, before its tax-capacity limit.
- **`refundable-credit-recovery`, `solidarity-recovery` (C08/C09):** twenty children keep GST/CGEB, ON sales
  and QC solidarity in their tapers at positive recovery. Single-parent GST/CGEB maxima are
  `2 × 349 + 20 × 184` / `2 × 445 + 20 × 234`, reduced 5% above 45,521/46,432.
  ON uses `21 × 371/378 - .04 × (net - 35,632/36,309)`; solidarity uses
  `356 + 169 + 731 + 20 × 155 - .06 × (net - 42,325)` in 2025, and
  `363 + 172 + 746 + 20 × 158 - .06 × (net - 43,195)` in 2026. Each named credit is asserted separately.
- **`care-individual-floor` (H04):** one adult's pre-deduction income is 107,000; the other's raw income
  is -10,000. ON479-A floors each first, retaining 107,000 and a 23% rate on the verified 8,000 manual claim.
- **`care-cutoff-roundoff-*` (H03):** decimal-cent components total exactly 150,000 before childcare/recovery.
  In 2025, `50,000 + 88,752.46 + 8,093.89 - 5,637.49 + 8,791.14 = 150,000`; in 2026,
  `50,000 + 85,556.71 + 9,395.70 - 3,951.90 + 8,999.49 = 150,000`.
  Binary summation lands slightly above the cutoff, but CARE remains 1% (80 on 8,000). Adding a real cent
  to other income makes CARE zero. Both cases have positive recovery after childcare.

### Mutation outcomes and exclusions

The original 83 #198 definitions were recovered locally; all were either rerun or explicitly excluded below.
Each applied mutation ran in a separate disposable `/tmp/206-mutants` copy, using only the seven affected test
files listed in the #17 follow-up. Original `ti` and call-site edits were translated to the post-#19 net-income
and supplement plumbing without changing their intended wrong basis. No worktree file was mutated.
The unmutated control passed; all kills were assertions, with no syntax/import-error kills.

**74 applicable #198 mutants killed; nine excluded.** Together with #195, the final run killed **100/100**
applicable mutants. The initial classification run confirmed C02/C03 survived before excluding their obsolete
tax paths. The final run includes all 25 original focused-suite survivors through kills or exclusions.

| Original IDs | Final outcome |
| --- | --- |
| A01–A08; B01–B13 | All killed; B08 specifically by all 26 self-employment/recovery cases. |
| C01, C04–C09, C11–C13, C16–C17, C19 | All killed; claimant, pool and refundable gaps now have named cases. |
| D01–D11, D13, D15–D17, D22 | All killed; #19 already kills D08/D09/D17. |
| E01; F01–F03; G01–G03, G06–G08 | All killed by existing component/control cases and #19. |
| H01–H04; I01; J02–J03; K01–K07 | All killed; H03/H04 by new cutoff/floor cases. |
| C02, C03 | Excluded: after #205, QC's old household credit-context basis has no tax consumer. |
| C10 | Excluded: CWB's secondary-earner cap is saturated far below positive recovery income. |
| C14 | Excluded: single Schedule B exhausts at 92,778 / 94,683, below recovery at 93,454 / 95,323. |
| C15 | Excluded: paying OAS requires age; the legacy living-alone branch is then bypassed. |
| D14 | Excluded: neither supported NL year has an `additionalTax` program. |
| D19, D20 | Excluded: LIFT ends by 50,000 individual income; BC reduction ends below 42,000. |
| D21 | Excluded: NS's taxable-income cutoff is 24,000, far below positive-recovery taxable income. |

For C02/C03, final personal results and benefit bases are calculated independently of that old context;
QC has no CRA low-income reduction, LIFT or MB family benefit. Only the unused provincial spouse-credit
selector can differ; #205 always supplies zero provincial spouse credit. These are tax-equivalent mutations.
For C14, the maxima include age, retirement and living-alone amounts; positive recovery leaves net income
at least at its threshold. #19 supplements retain that net-income floor and cannot bring NS taxable income
down to 24,000: even the largest annual supplement is below 18,000. No exclusion relies on a random sample.

The final full validation is `fnm exec --using=26 npm ci` and `npm run check`, after formatting and the last
documentation edit; results are reported in the PR. Existing fixture identity is checked separately against HEAD.

## Engine validation and handoff

Required validation: `fnm exec --using=26 npm ci`, formatting and `npm run check` (lint, typecheck, all tests,
build and browser smoke). The existing 2,875-test suite passed unchanged before adding new fixtures.
Final check results are reported in the PR. No page changes or UI acceptance claims belong to this branch.
The orchestrator should arrange the independent review and file the separate History back-fill issue at merge.

## Page implementation

The page adds `oas` and `cppQpp` per adult within the existing Retirement income section. OAS is an explicit
checkbox; CPP/QPP is an annual gross amount accepting cents. Both reuse the #17 birth-year/month controls;
no new date or payroll election is inferred. An incomplete birth date retains the OAS choice but excludes OAS
from results until both fields apply. CPP/QPP needs no age. Invalid amounts leave the last valid value intact;
empty removes the field, while zero remains explicit. Switching adults clears invalid drafts from the control.

`normalizePublicPensions` is shared by saved-state loading and the URL codec. Existing version-3 saves and
version-1 URL fragments retain their meanings. Omitted fields stay omitted, including for adults with age,
pension receipts or OAS/CPP already entered as Other income. Explicit false and zero survive both round trips.
The page never identifies the composition of Other income or moves amounts automatically. Both new values
remain stored when an older year is selected, but the engine receives neither; its older-year calculations are
unchanged. History omits unsupported years in both modes, including CPP/QPP-only scenarios without birth dates.

The federal ledger shows engine-reported gross OAS, CPP/QPP income and the recovery deduction, labelled as
already included in deductions. Recovery appears once among adjustments to federal tax, after credits and
Quebec abatement. The existing taxable-income tooltip includes the new receipts; the person buttons and
Income tab summary include their cash amounts. No receipt or tax formula is implemented in the page.

Tooltips state the coverage, month-after-birthday commencement and higher-age timing, December birthday effect,
quarterly calendar-year amounts, current-year recovery versus withholding, full entitlement/residence assumptions,
unmodelled deferral/residency rules and the need to remove duplicate amounts from Other income. They distinguish
CPP/QPP receipts from the separate payroll election and explain Quebec's OAS exclusion and CPP/QPP inclusion.
The older-year result notice and history basis explicitly limit these inputs to 2025–2026.

### Page acceptance coverage

`tests/public-pension-page.test.ts` covers both fields for both adults, false/zero/omission, malformed values,
legacy migration and supported/incomplete/unsupported input gating. Existing #17 tests remain unchanged.
`tests/e2e/public-pensions.mjs`, registered in the full smoke suite, asserts:

- UI entry and independent adult values, every new field and birth dates through URL and storage reloads,
  no implicit pension-start election, invalid drafts, clearing, partner switching and removal.
- Both years and all thirteen chart results against the merged engine, including ages 64/65/75/76,
  June/December effective months, partial and capped recovery and independent adult liabilities.
- ON and QC ledger receipts, recovery deduction and tax, federal totals, taxable-income explanations and
  Quebec Health Services Fund amounts against engine results. Existing engine reference tests supply published
  figure verification; these browser assertions check the page's integration and formatting, not new tax rules.
- Pre-#18 URLs and saved states with Other income, typed pension receipts and age in 2024, 2025 and 2026,
  including URL precedence over a recipient's saved public-pension inputs.
- Older-year results without new receipts, retained drafts, return to a supported year, nominal/real history
  values and coverage notices, including CPP/QPP with no age.
- Assumption and recovery tooltip text, controls and ledger geometry at mobile/desktop widths in both themes.

No engine, schema, data or golden fixture changes are part of the page branch.

### Page validation

Required commands are `fnm exec --using=26 npm ci`, `npm run format`, `npm run check` and
`npm run compare -- origin/main`. The focused page suite checks 375, 430 and 1280 px in light and dark;
the full smoke suite repeats responsive coverage at 375, 430 and 1000 px, including contrast scans.

The comparison against `origin/main` (`f32ab2175`) covers six viewport/theme combinations and five states each.
It reports three grouped control diffs: the new unchecked OAS checkbox and empty CPP/QPP amount, plus the
resulting two-position shifts in generated identifiers for existing anonymous controls. Visible text and numeric
results are unchanged throughout those legacy scenarios. Its exit status is 1 because it reports intended diffs.
The focused public-pension browser suite separately exercises the new expanded controls and results.

The first focused run caught a page call to `cashOf` without federal data; the person-summary buttons now pass
the selected year's federal data. Browser assertions check each adult's cash label and household income as well
as chart percentages, receipt/deduction rows and tax totals. No engine change was necessary.
Screenshot inspection also caught the new deduction label and existing bracket ranges widening their tables.
Ledger labels now wrap, and the browser suite asserts that public-pension rows and all three ledgers fit without
horizontal scrolling, so recovery tax and federal totals remain visible on the narrowest screen.

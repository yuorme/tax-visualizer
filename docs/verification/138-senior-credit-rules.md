# Age and pension credit specification, 2025–2026

Research for #138, enabling #17. Checked on **2026-11-03**. This is a specification, not an implementation
or a claim that #17 is complete. Production data, engine code and existing golden expectations are unchanged.
The [sizing study](16-seniors-sizing.md) establishes why these features matter; this report supplies their rules.

## Evidence status and conventions

The [source directory](138-senior-credit-rules/sources/) contains official extracts with URL, title, retrieval
date and original-document SHA-256. The [source index](138-senior-credit-rules/SOURCES.md) lists them.
The 2025 CRA returns, worksheets and spouse schedules are final published filing documents. The 2026 amounts
below are **published official parameters**, taken from 2026 TD1 forms or Quebec's November 2025 parameter
bulletin, not values obtained by multiplying last year's amounts by an inflation estimate.

Final 2026 T1/428/Schedule 2 and Quebec Schedule B filing packages were not available in the sources checked.
For 2026, carry-forward of the 2025 filing formulas and transfer ordering is explicitly a **provisional rule
assumption**, supported by the 2026 TD1 claims and the absence of a contrary change in the collected publications.
Reconcile against final forms before presenting final-return precision; keep this status in the year's source
notes, and mark a parameter `estimated: true` if it is derived rather than published. Do not label the published
2026 dollar amounts themselves as invented estimates. BC's later 2026 budget supersedes January payroll rates.

Amounts in tables are **credit bases**, not dollar refunds. Multiply by the indicated credit rate, then apply
non-refundable limits and the jurisdiction's ordering. All figures are CAD. The ordinary full-year Canadian
resident case is covered; part-year residence, death, bankruptcy, split income tax, foreign tax credits and
cross-province spouses need separate handling and must not be inferred from these examples.

## Federal and CRA-administered jurisdictions

For each row, a person aged at least 65 on December 31 has the following age-credit base:

```text
ageBase = max(0, ageMaximum − 0.15 × max(0, ownFederalNetIncome − ageThreshold))
pensionBase = min(pensionCap, ownEligibleFederalPensionIncome)
```

For someone under 65, `ageBase = 0`; the pension base can still be positive. Net income means **line 23600**,
not taxable income (line 26000), gross cash receipts or combined household income. Yukon copies federal
line 30100. The 15% reduction is applied to the credit base, then the province's credit rate applies.
Published upper cutoffs round whole dollars: derive the exact zero from `threshold + maximum / 0.15` for
continuous calculations; do not interpolate between rounded endpoints or round the reduction rate.

Each 2025 link contains the province's worksheet and each 2026 link its official TD1. Companion 428 forms
in the source index give 2025 credit rates and pension caps. Federal values also appear in the cached
[2025 federal worksheet](138-senior-credit-rules/sources/federal-worksheet-2025.txt) and
[2026 federal worksheet](138-senior-credit-rules/sources/td1-ws-2026.txt).

| Jurisdiction | 2025 age max | 2025 threshold | 2025 pension cap | 2026 age max | 2026 threshold | 2026 pension cap | Credit rate 2025 / 2026 | Sources 2025 / 2026 |
|---|---:|---:|---:|---:|---:|---:|---|---|
| Federal | 9,028 | 45,522 | 2,000 | 9,208 | 46,432 | 2,000 | 14.5% / 14% | [T1](138-senior-credit-rules/sources/federal-t1-2025.txt) / [TD1](138-senior-credit-rules/sources/td1-2026.txt) |
| AB | 6,221 | 46,308 | 1,719 | 6,345 | 47,234 | 1,753 | 8% / 8% | [worksheet](138-senior-credit-rules/sources/ab-worksheet-2025.txt) / [TD1](138-senior-credit-rules/sources/td1ab-2026.txt) |
| BC | 5,799 | 43,169 | 1,000 | 5,927 | 44,119 | 1,000 | 5.06% / 5.60% | [worksheet](138-senior-credit-rules/sources/bc-worksheet-2025.txt) / [TD1](138-senior-credit-rules/sources/td1bc-2026.txt) |
| MB | 3,728 | 27,749 | 1,000 | 3,728 | 27,749 | 1,000 | 10.8% / 10.8% | [worksheet](138-senior-credit-rules/sources/mb-worksheet-2025.txt) / [TD1](138-senior-credit-rules/sources/td1mb-2026.txt) |
| NB | 6,037 | 44,945 | 1,000 | 6,158 | 45,844 | 1,000 | 9.4% / 9.4% | [worksheet](138-senior-credit-rules/sources/nb-worksheet-2025.txt) / [TD1](138-senior-credit-rules/sources/td1nb-2026.txt) |
| NL | 7,064 | 38,712 | 1,000 | 7,142 | 39,138 | 1,000 | 8.7% / 8.7% | [worksheet](138-senior-credit-rules/sources/nl-worksheet-2025.txt) / [TD1](138-senior-credit-rules/sources/td1nl-2026.txt) |
| NT | 8,727 | 45,522 | 1,000 | 8,902 | 46,432 | 1,000 | 5.9% / 5.9% | [worksheet](138-senior-credit-rules/sources/nt-worksheet-2025.txt) / [TD1](138-senior-credit-rules/sources/td1nt-2026.txt) |
| NS | 5,734 | 30,828 | 1,173 | 5,826 | 30,828 | 1,173 | 8.79% / 8.79% | [worksheet](138-senior-credit-rules/sources/ns-worksheet-2025.txt) / [TD1](138-senior-credit-rules/sources/td1ns-2026.txt) |
| NU | 12,303 | 45,522 | 2,000 | 12,550 | 46,432 | 2,000 | 4% / 4% | [worksheet](138-senior-credit-rules/sources/nu-worksheet-2025.txt) / [TD1](138-senior-credit-rules/sources/td1nu-2026.txt) |
| ON | 6,223 | 46,330 | 1,762 | 6,342 | 47,210 | 1,796 | 5.05% / 5.05% | [worksheet](138-senior-credit-rules/sources/on-worksheet-2025.txt) / [TD1](138-senior-credit-rules/sources/td1on-2026.txt) |
| PE | 6,510 | 36,600 | 1,000 | 6,510 | 36,600 | 1,000 | 9.5% / 9.5% | [worksheet](138-senior-credit-rules/sources/pe-worksheet-2025.txt) / [TD1](138-senior-credit-rules/sources/td1pe-2026.txt) |
| SK | 5,785 | 43,066 | 1,000 | 5,901 | 43,927 | 1,000 | 10.5% / 10.5% | [worksheet](138-senior-credit-rules/sources/sk-worksheet-2025.txt) / [TD1](138-senior-credit-rules/sources/td1sk-2026.txt) |
| YT | 9,028 | 45,522 | 2,000 | 9,208 | 46,432 | 2,000 | 6.4% / 6.4% | [428](138-senior-credit-rules/sources/yt-428-2025.txt) / [TD1](138-senior-credit-rules/sources/td1yt-2026.txt) |

The [2026 payroll formulas](138-senior-credit-rules/sources/t4127-2026.txt), Chapter 8, confirm the credit rates
except BC's later change. [BC Budget 2026, printed page 81](138-senior-credit-rules/sources/bc-budget-2026.txt)
sets the annual credit rate at 5.60%. The [July payroll guide](138-senior-credit-rules/sources/bc-payroll-july-2026.txt)
uses 6.14% to catch up withholding for the second half; **6.14% is not the annual income-tax credit rate**.
Alberta's annual credit rate is 8% in both years, not the old 10% or July 2025 withholding's 6%.
NS's age maximum rises in 2026, but its $30,828 threshold and $1,173 pension cap do not: avoid blanket indexing.

## Pension income classification

The [CRA line 31400 eligibility chart](2025/sources/seniors-pension.txt) is the primary federal checklist.
All twelve CRA provinces/territories use the eligible federal pension amount, capped at their own limit.
Quebec uses a separate eligible-income calculation and must not inherit federal eligibility booleans.

| Income received | Federal / CRA provinces, under 65 | Federal / CRA provinces, 65+ | Quebec retirement amount |
|---|---|---|---|
| RPP lifetime pension, including retroactive lifetime benefits | Eligible | Eligible | Eligible line 122 income |
| RRIF/LIF income | Eligible only for the chart's survivor case | Eligible | Eligible line 122 income, no general age-65 condition |
| RRSP annuity, T4RSP box 16 | Eligible only for the chart's survivor case | Eligible | Eligible line 122 income |
| Ordinary RRSP withdrawal, including T4RSP box 22 | Ineligible | Ineligible | **Eligible** when included on line 122, subject to Schedule B adjustments |
| CPP/QPP, OAS | Ineligible | Ineligible | Ineligible (lines 119 and 114) |
| GIS/Allowance | Ineligible | Ineligible | Do not treat as eligible retirement income |
| Tax-free treaty portion of foreign pension; US IRA | Ineligible federally | Ineligible federally | Separate treatment; do not infer eligibility from federal classification |

RRIF amounts rolled into an RRSP, another RRIF or an annuity are excluded from the federal pension credit.
The CRA chart also distinguishes DPSP, ordinary annuities, EBP, variable pension benefits and survivor receipts.
An unqualified field called "pension" is insufficient. Either support these explicit categories or label the
initial controls narrowly as RPP lifetime pension, RRIF/LIF, RRSP annuity and ordinary RRSP withdrawals, with a
survivor toggle only for the eligible types. Do not exclude ordinary RRSP cash from taxable income merely because
it is ineligible for a federal credit. Exclude lump-sum death benefits, retiring allowances and RCA receipts
from the generic eligible federal input. Foreign pension and special slip cases need an explicit scope note.

## Quebec: one combined household pool

Sources: [2025 Schedule B](138-senior-credit-rules/sources/qc-schedule-b-2025.txt),
[guide lines 122 and 361](138-senior-credit-rules/sources/qc-guide-2025.txt),
[2025 return](138-senior-credit-rules/sources/qc-return-2025.txt), and
[official 2026 parameter bulletin](138-senior-credit-rules/sources/qc-parameters-2026.txt), tables 3–4.

| Parameter | 2025 | 2026 | Unit / rule |
|---|---:|---:|---|
| Age amount per eligible adult | 3,906 | 3,986 | Age 65+ at December 31 |
| Retirement amount per adult | 3,470 | 3,541 | Cap on **1.25 ×** adjusted eligible retirement income |
| Living-alone base | 2,128 | 2,172 | Household eligibility below |
| Additional single-parent amount | 2,627 | 2,681 | Separate eligibility and Family Allowance month adjustment |
| Family-income threshold | 42,090 | 42,955 | Sum of both adults' Quebec net income, line 275 |
| Combined reduction rate | 18.75% | 18.75%* | Reduce sum of all amounts once |
| Credit rate | 14% | 14% | Apply after reduction and household allocation |

`*` The 2026 dollar amounts and threshold are published; the Schedule B formula is carried forward as described
in Evidence status. The multiplier is not the 14% credit rate, and 18.75% is not the federal 15% reduction.

```text
eligibleRetirement[i] = line122[i] + line123[i] − listedScheduleBAdjustments[i]
retirementBase[i] = min(retirementCap, 1.25 × eligibleRetirement[i])
pool = max(0, livingAloneBase + additionalSingleParentBase
              + sum(ageBase[i] + retirementBase[i])
              − 0.1875 × max(0, sum(quebecNetIncome[i]) − familyThreshold))
claimA + claimB <= pool; credit[i] = 0.14 × claim[i]
```

Schedule B adjustments remove the specified RRSP/RRIF/PRPP transfers or annuity purchases, unused PRPP refund
deduction, line 293 deduction, relevant line 297 deductions, and retirement income transferred out at line 245.
RCA annuity amounts transferred between spouses are excluded from both the incoming and outgoing work-chart
entries. For simple domestic receipts without deductions, use the actual taxable line 122 receipt.

Living alone means the qualifying dwelling arrangement **throughout the year**: alone, with minors, or only
with qualifying adult student descendants. A single adult sharing with a roommate or parent does not qualify.
The additional single-parent amount requires a qualifying adult student child and no December Family Allowance
entitlement, and is reduced for months with Family Allowance entitlement (2025 work chart: $218.92 per month).
Do not silently enable this additional amount from an ordinary "has children" flag. Retain the current model's
limitations explicitly if the student and dwelling details are not collected.

Replace the current standalone living-alone computation with this pool; adding age and retirement credits
beside it would apply the family-income reduction more than once. Each spouse can claim part of the resulting
base, but both returns must reconcile: Schedule B line 33 subtracts the other spouse's line 361 claim.
Allocate to available tax capacity, never duplicate the full pool on both returns.

Quebec line 275 includes the worker deduction (return line 201), while federal line 23600 does not include that
Quebec-only deduction. Use a named Quebec net-income result after Quebec deductions; the current engine's
`provincialNet` variable is calculated before its worker deduction and is not itself the Schedule B income base.

## Unused spouse amounts, distinct from pension splitting

The [federal Schedule 2](138-senior-credit-rules/sources/federal-s2-2025.txt),
[Quebec-resident federal variant](138-senior-credit-rules/sources/federal-qc-s2-2025.txt), and all twelve
provincial/territorial S2 forms are cached. They authorize transfers of unused age and pension **credit bases**.
They do not transfer cash, pension receipts, net income or taxable income. Federal eligibility excludes spouses
separated due to relationship breakdown for at least 90 days including December 31. Cross-province spouses need
the schedules' special rules; the comparison can assume both adults resident in the province being evaluated.

For the supported age/pension-only pool, reproduce each jurisdiction's own Schedule 2:

```text
pool = donorAgeBase + donorPensionBase + otherSupportedTransferableBases
equivalentIncome = donorTaxableIncome, if within first bracket
                 = donorBracketTax / creditRate, otherwise
adjustedIncome = max(0, equivalentIncome − donorBPA − designatedPriorBases − donorTuitionUsed)
unusedBase = max(0, pool − adjustedIncome)
recipientCredit += creditRate × unusedBase, subject to recipient non-refundable capacity
```

`designatedPriorBases` means exactly the credit-base subtotal identified on that year's S2, not all available
credits or final tax payable. For federal 2025 it is T1 line 96 (line 100 on the Quebec return), covering the
specified CPP/QPP, EI, QPIP, volunteer, employment, home and adoption amounts. Ordinary employment amounts in
the existing engine must therefore enter donor capacity. The pension base is excluded from this prior subtotal.
Use the cached S2s as the mapping checklist when implementing additional currently unsupported credits.

Run federal and provincial transfer calculations separately. A donor can exhaust federal credits while leaving
provincial credits unused. Do not multiply the federal transfer by the provincial rate, cap the recipient's
transferred amount at their own pension cap, or use the recipient's income to phase out the donor's age amount.
Donor amounts used personally cannot also transfer; recipient relief cannot produce a refund. Review Quebec
federal abatement and Ontario surtax ordering when integrating transfers into existing tax calculation stages.

Saskatchewan's [S2](138-senior-credit-rules/sources/sk-s2-2025.txt) also includes its senior supplementary amount
and dependent-child amount; existing supported transferable amounts must not disappear when age/pension are added.
Coordinate with existing **#92** for Saskatchewan's lower-income-first child claim and unused transfer; do not
create a duplicate correction. If #17's transfer phase depends on those child bases, make that dependency explicit.
Quebec instead permits the shared Schedule B allocation above and a general unused-credit transfer at line 431:
the [guide](138-senior-credit-rules/sources/qc-guide-2025.txt) transfers a negative line 430 balance to the spouse,
with donor line 432 zero and recipient using the transferred credit. This is a **dollar credit** transfer, not
federal S2's credit-base formula. Both the allocation and final balance transfer must conserve the household total.

Future #20 elects pension **income** splitting and must recompute eligibility, income tests and these credit
transfers afterwards. No pension income is split automatically by #17. Quebec income splitting requires its own
election and transferor age rules; the guide does not justify copying federal splitting eligibility. Leave that
election to #20 while making the credit-transfer stage reusable.

## Adjacent age-sensitive rules and implementation boundaries

These are concrete interactions, not permission to silently enlarge or cut #17. Include the direct credit
interactions in #17 or create explicit linked prerequisites before claiming full senior income-tax results.
Benefits and property relief remain #21/#22.

| Rule | Verified evidence and implementation consequence |
|---|---|
| SK senior supplementary | [SK428](138-senior-credit-rules/sources/sk-428-2025.txt): $2,028 in 2025; [2026 TD1](138-senior-credit-rules/sources/td1sk-2026.txt): $2,569. Age 65+, no income taper, 10.5% credit, transferable through SK(S2). It survives complete phase-out of the ordinary age amount. |
| MB family tax benefit | [MB428-A](138-senior-credit-rules/sources/mb-family-2025.txt) adds $2,065 per senior adult to its base, then subtracts 9% of claimant line 23600 income, floor zero, before 10.8% credit conversion. The [2026 TD1 worksheet](138-senior-credit-rules/sources/td1mb-ws-2026.txt) confirms $2,065/9%, but its payroll eligibility shorthand is not a substitute for final MB428-A spouse rules. |
| NS separate age tax credit | [NS428 line 98](138-senior-credit-rules/sources/ns-428-2025.txt): up to $1,000 **tax dollars**, age 65+, **taxable** income strictly below $24,000. No 8.79% multiplication. Separate from the regular age amount. 2026 final filing confirmation outstanding; do not infer an indexed threshold from the ordinary age amount. |
| PE low-income reduction | [PE428 lines 76/78](138-senior-credit-rules/sources/pe-428-2025.txt): $250 reduction for each senior adult, combined with the existing family reduction before its income taper. 2026 final filing confirmation outstanding. This is a reduction dollar amount, not a 9.5% credit base. |
| AB supplemental credit | [AB worksheet line 61545](138-senior-credit-rules/sources/ab-worksheet-2025.txt): 25% of the excess over $4,800 of 8% × (line 58800 bases less tuition line 58560), floor zero. Age, pension and transferred bases can affect this subtotal. Do not treat the 8% table as a complete tax calculation. |

NS's ordinary age formula no longer uses the older enhanced-age-income phase-out found in pre-2025 material.
The direct age extensions above are separate from Quebec senior assistance, provincial GIS-linked supplements,
medical/disability credits and property programs, whose all-jurisdiction inventory remains #21/#22.
Existing **#91** tracks Quebec Health Services Fund contributions on non-employment income. That limitation,
and the later OAS/GIS/splitting/benefit tasks, mean age/pension credits alone do not complete the seniors tax burden.

Code inspection at `3788dfc`: PE already has a family low-income reduction, and QC already has a standalone
living-alone amount. Neither has the senior integration described here. SK's supplementary amount and NS's
separate age tax credit are absent. More broadly, **MB family tax benefit and AB supplemental tax credit are
absent programs**, not existing programs that merely need a senior parameter. Adding them can change ordinary
non-senior results. Track the following separately before deciding how their effects enter #17:

- **MB family tax benefit:** implement MB428-A's basic/dependant/child terms and individual-income reduction,
  with senior terms prepared for #17; resolve spouse claim conditions against the guide and final 2026 form.
  A usable non-senior example is a married adult with $40,000 ordinary non-employment income, a zero-income
  spouse and two dependent minor children, no other claims: base `2,065 + 2,065 + 2 × 2,752 − .09 × 40,000`
  is $6,034, worth **$651.672**. Tax before this credit is
  `.108 × (40,000 − 15,780 − 9,134) = $1,629.288`, enough to use it all. The isolated effect is **1.62918
  percentage points** of the household's $40,000 income, supporting a material correction. This is not the
  refundable property credit. Source: cached MB428-A and MB428 line 41.
- **AB supplemental-credit audit/sizing follow-up:** verify worksheet line 61545 and remaining-tax capacity;
  its subtotal
  includes credits independently of age. A qualifying non-tuition base of $70,000 gives
  `.25 × (.08 × 70,000 − 4,800) = $200` before remaining-tax capacity. Source: cached AB worksheet.
  This algebraic example does not establish an achievable supported household or a material omission.
  Find such a household before requiring implementation; it is **not a mandatory #17 prerequisite** on the
  evidence here. If justified, scope a correction to verified years and confirm 2026/historical rules separately.

For both corrections, independently document any affected locked golden before/after values; do not recapture
unrelated baselines. The examples above demonstrate formula effects, not a claim that these hypothetical bases
always leave enough tax to use the credit. The #17 report must distinguish existing limitations from completed
corrections, and the orchestrator should link the correction issues explicitly.

### Recommended separate payroll prerequisite

Age must affect employment payroll before #17 enables unrestricted senior employment scenarios. This is a
separate small engine/input task, not a side effect of adding credits. The following rules apply to 2025–2026:

| Rule | CPP | QPP |
|---|---|---|
| Automatic stop | Include contributions through the birthday month when turning 70; stop the following month. Turned 70 before this tax year means zero all year. | Continue through December 31 of the year turning 72; stop January 1 of the following year. Do not stop in the 72nd birthday month. |
| Optional stop | Ages 65–69, receiving CPP or QPP retirement pension, with pensionable employment; completed CPT30 election. Default is continued contributions. | Age 65+ and under 73 at year end, receiving QPP or CPP retirement pension; completed RR-50 election. Default is continued contributions. |
| Employee election timing | Effective first day of month after employer receives the election; contributions include the delivery month. | Can elect after 65th birthday; effective first day of month after delivery to employer. Revocation of a prior-year election also starts next month. |
| Maximum adjustment | Prorate maximum contributions and relevant thresholds for pensionable months; CPP2 follows its own Schedule 8 computation. | **Do not prorate the annual employee maximum solely because of an optional stop/restart election.** Calculate actual pensionable pay and pay-period exemptions until the stop. |

Sources: [CRA starting/stopping](138-senior-credit-rules/sources/cpp-start-stop.txt),
[prorating guidance](138-senior-credit-rules/sources/cpp-prorating.txt),
[2025 Schedule 8](138-senior-credit-rules/sources/federal-s8-2025.txt),
[QPP election form](138-senior-credit-rules/sources/qpp-election-form.txt), and
[2026 employer guide sections 4.5.4–4.5.6](138-senior-credit-rules/sources/qpp-employer-guide-2026.txt).
Self-employment election timing differs and is outside the existing employment-only model; do not apply its
earlier effective-month rule to employee income. Existing elections need a January 1 active state, not just a
"new election this year" checkbox. An optional restart must enforce the prior-year-election restriction.

Proposed inputs per adult, to size in the prerequisite rather than newly approved UI scope: year-end age plus
birth month, retirement-pension-recipient status/start month, active prior
election and this year's election/revocation effective month. A cross-province comparison must not assume that
a filed CPP election is automatically a filed QPP election. Use explicit scenario choices for each regime.
Annual employment income alone does not determine earnings before a midyear stop: either collect pensionable
earnings/pay-period timing or state a uniform-monthly-employment assumption and test it. Keep death, disability
and interprovincial actual payroll histories outside this focused prerequisite unless separately authorized.

Recalculate base and both enhanced contribution components.
[T1 line 22215](138-senior-credit-rules/sources/federal-t1-2025.txt)
and Schedule 8 deduct enhanced contributions; fewer contributions mean a smaller deduction, which changes net
income, age-credit taper, spouse capacity and income-tested benefits. The base component instead feeds the
applicable non-refundable credit. Do not just zero the displayed payroll charge while leaving either credit or
enhanced deduction unchanged. EI/QPIP must not stop solely because the person is 65+.

Minimum acceptance cases: CPP turns 70 in February (two contributing months), January and December boundaries;
QPP turns 72 in February (full-year default) versus already 73 in January (zero); 65-year-old with no retirement
pension cannot elect; eligible 65-year-old defaults to contributing; valid October election stops in November;
CPP and QPP maximum treatment differs; prior-year election and restart; net-income deduction propagation.
Add independent payroll expectations for these cases in that implementation PR. Until this prerequisite lands,
reject unsupported senior-employment configurations explicitly instead of silently using ordinary payroll.

## Concrete schema and program outline

Use year data for all amounts, rates, age thresholds and caps. These names describe a proposed shape, not APIs
already present in the repository:

```text
Person
  ageAtYearEnd: integer | unknownLegacy
  birthMonth?: integer                         # later monthly pension/payroll transitions
  retirementIncome[]: { type, amount, survivorEligible? }
    type = rppLifetime | rrif | rrspAnnuity | rrspWithdrawal
  cppQppPensionReceived?: amount               # #18, not automatically generated here
  payrollElection?: { stopMonth, pensionRecipient }  # linked payroll task

year.seniorCoverage = supported | unsupported
year.federal.seniorCredits
  age: { program: age-net-income, minimumAge, maximum, threshold, reductionRate }
  pension: { program: federal-pension-eligible, minimumRrifAge, maximum }
  transfer: { program: schedule2-unused-base }
year.province.seniorCredits
  CRA: age-net-income + federal-pension-capped + schedule2-unused-base
  YT: federal-age-copy + federal-pension-capped + schedule2-unused-base
  QC: quebec-age-living-alone-retirement-pool
    { ageAmount, retirementMaximum, retirementMultiplier, livingAlone,
      singleParentAdditional, familyThreshold, reductionRate, creditRate }
  SK addition: senior-supplementary-base
  MB prerequisite: new family-tax-benefit program, then age terms
  NS addition: age-taxable-income-credit
  PE addition: age terms in low-income-reduction program
```

Retain `oth` as legacy ordinary income. New retirement components are **additional distinct receipts**, included
once in income and once in cash totals. Moving $10,000 from `oth` to a pension field must leave gross cash
unchanged. Classifiers compute eligible credit bases from the same receipts; they never add a second receipt.
OAS/CPP entered manually today must be moved, not copied, when #18 gains dedicated controls. Pension income is
not employment income for CPP/QPP, EI, QPIP or Canada employment amount. Retirement-credit classification must
return independent federal and Quebec eligibility.

Recommended calculation seam: classify receipts → deductions/payroll and both net-income measures → personal
credit bases → household Schedule 2 transfers / Quebec pool allocation → finalize each adult's tax → household
benefits and totals. Returning provisional person tax plus transferable bases is safer than asking a completed
`personalTax` result to reconstruct unused amounts. Couple computation must run before final tax/benefit totals.

An integer year-end age supports 60–64, 65–74 and 75+ displays without losing CPP's 70 and QPP's 72/73 boundaries.
Do not reduce stored information to a 65+ checkbox. A full age credit applies in the year of turning 65, whereas
later OAS age changes and payroll changes require month information. Explain the year-end convention and
unmodelled RRIF minimums, OAS/CPP deferral and residency in tooltips. No new OAS/GIS entitlement is implied.

## Independent reference cases

Run `fnm exec --using=26 node docs/verification/138-senior-credit-rules/calculate.mjs`.
The script imports **no production engine or tax data**. Transcribed parameters and literal expected answers
provide repeatable paper arithmetic, including every table row/year at age 64/65, the reduction threshold,
inside the taper, its exact zero point, above zero, and pension cap boundaries.
These are component reference vectors; full household golden results must additionally calculate existing
brackets, surtax, abatement, low-income reductions and benefits independently. Do not copy an isolated credit
saving into a full disposable-income golden result without those interactions.

| Case | Independent result |
|---|---|
| Federal 2025, 65, net income $46,522 | Base `9,028 − 0.15 × 1,000 = 8,878`; credit $1,287.31 |
| Federal 2026, 65, net income $47,432 | Base `9,208 − 150 = 9,058`; credit $1,268.12 |
| BC 2025/2026 full age amount | $293.4294 / $331.912 before tax capacity; the rate change matters |
| Ontario 2025 full pension amount | `1,762 × .0505 = $88.981`, before surtax interactions |
| $1,600 ordinary RRSP withdrawal, age 64 | Federal pension base zero; Quebec retirement base $2,000, credit $280 before household taper |
| $1,600 RRIF, age 64 versus 65, no survivor condition | Federal pension credit $0 versus $232 in 2025; Quebec retirement base $2,000 at either age |
| Quebec 2025 single senior, living alone, retirement $2,776, net $42,090 | Pool `2,128 + 3,906 + 3,470 = 9,504`; credit $1,330.56 |
| Same Quebec senior, net $43,090 | Pool `9,504 − 187.50 = 9,316.50`; credit $1,304.31; reduction applies once |
| Quebec 2026 same categories, retirement $2,832.80, net $43,955 | Pool `2,172 + 3,986 + 3,541 − 187.50 = 9,511.50`; credit $1,331.61 |
| Quebec 2025 couple, both 65+, each retirement $2,776, family net $43,090 | Pool `2 × (3,906 + 3,470) − 187.50 = 14,564.50`; household credit capacity $2,039.03; never claim twice |
| Federal 2025 donor age 65, taxable/net $20,000, eligible pension ≥$2,000, no other credits | Pool $11,028; adjusted income `20,000 − 16,129 = 3,871`; transfer $7,157 base, recipient relief at most $1,037.765 |
| Same donor, Ontario 2025 | Pool $7,985; adjusted income `20,000 − 12,747 = 7,253`; transfer $732 base, recipient relief at most $36.966 |
| SK ordinary age amount fully phased out, age 65 | Supplementary credit still $212.94 (2025) or $269.745 (2026), before tax capacity |
| MB 2025 single senior, net $30,000, no other family-benefit terms | Family-benefit base `2,065 + 2,065 − .09 × 30,000 = 1,430`; credit $154.44 |
| NS 2025 senior taxable income $23,999.99 / $24,000 | Separate age tax credit $1,000 / $0 before capacity; strict boundary, not a taper |

Further implementation tests must exercise zero recipient tax capacity, employment credit in donor capacity,
both transfer directions, SK supplementary transfers, federal Quebec abatement, Ontario surtax, Quebec
allocation plus line 431 (no double use), ordinary RRSP versus annuity, survivor eligibility, unrelated existing
credits, and cash conservation. Age-absent legacy cases must retain existing behavior and locked golden results.

## Delivery and remaining decisions

The core rules support implementation; they require a household credit phase and a Quebec-specific program,
not one generic age/pension credit call. A single #17 engine/data/UI PR is possible but substantial. Recommended
sequencing is linked age-aware payroll and the material MB correction, then #17 including the
SK/MB/NS/PE direct credit interactions and transfer integration. The orchestrator should record that scope explicitly.
Final 2026
forms remain a reconciliation item, especially NS/PE supplementary conditions, MB spouse claims and S2 ordering;
they do not justify pretending that provisional rules are final or blocking all 2025 work.

The proposed 2025–2026-first delivery is **not an approved reduction of historical scope**. Keep 2019–2024
ordinary inputs/results available. For a newly configured retirement scenario in a year with no verified
senior rules, return an explicit unsupported result (and explain it in the UI), or collect that year's rules
before enabling it. Do not convert missing amounts to zero, silently drop pension input, carry current-year
parameters backward, or put a "complete" historical chart point beside supported senior years. Serialized
legacy scenarios without senior fields must still load. Historical collection needs its own tracked work;
user approval of coverage remains separate from this research.

Coordinate with #12's shareable links: every added age, income, survivor and payroll-election field must extend
the versioned URL codec and saved-state migration. Round-trip complete retirement scenarios through copy/reload,
and retain old scenarios' defaults. No new field may silently disappear during serialization.

# Seniors scope sizing (#16)

All seven planned categories pass the 0.1 percentage-point rule for at least one applicable household.
Keep #17–22; no category is cut. Pension splitting also changes a measured province gap by more than 0.1 points.
This is a reproducible scope study, not a completed seniors tax engine or a census of every local program.

## Method and households

Run `fnm exec --using=26 node docs/verification/16-seniors-sizing/calculate.mjs`.
The script imports no production engine or data. It calculates from the official schedules cited below.
Dollar amounts retain precision until display; rounding individual return lines can move the last cent.

For each feature, hold a common household income denominator D fixed in both comparisons:
`own-rate movement = 100 × abs(change in tax less refundable benefits) / D`.
The gap movement is `100 × abs(change in BC − change in ON) / D`, or BC versus Saskatchewan as labelled.
These are percentage points, not relative percentage changes. Keeping D fixed isolates the missing rule instead
of mixing in a change of denominator. The eventual product must count OAS and CPP/QPP as income exactly once;
OAS is **not** a refundable credit. GIS and Allowance are netted against tax as specified in #19.
As in the existing engine, refundable benefits are not added to D. For L and A, D is OAS alone; their benefit
effects can consequently exceed 100 points. Counting all transfers in D instead would still leave GIS at
59.898 points and Allowance at 34.346 points, far above the cutoff.

| Household | Assumptions | D |
|---|---|---:|
| M: modest single retiree | Age 68; $20,000 qualifying workplace pension, $6,118.92 CPP, $8,881.08 OAS; no deductions | $35,000 |
| H: higher-income single | Age 68; $80,000 qualifying pension; remaining $20,000 includes OAS/CPP; no deductions | $100,000 |
| L: low-income single | Age 68; full OAS and maximum GIS; zero private income | $8,881.08 |
| A: mixed-age couple | Ages 68/62; full OAS, spouse-rate GIS and Allowance; zero private income | $8,881.08 |
| C: unequal pension couple | Both 68; incomes $100,000/$40,000, including eligible pensions $80,000/$20,000 | $140,000 |
| P: senior homeowner | Age 68; $35,000 income; enough qualifying property/school tax; conditions below | $35,000 |

No household has earnings, children, dividends, capital gains, disability claims or special residency conditions.
M/H/C are illustrative profiles, not statistically estimated averages. L/A test common program eligibility groups,
including the largest entitlements; a zero effect for a richer household would not justify excluding them.

Income-tax calculations use 2025 schedules, basic/age/pension credits, BC tax reduction, Ontario surtax, Ontario
tax reduction and health premium. Other refundable benefits and consumption/property taxes are held fixed except
in their own rows. Thus these are isolated sensitivities, not complete disposable-income comparisons. They must
not become golden expectations for the full engine without calculating the additional interactions.

OAS/GIS/Allowance amounts use **October–December 2025 monthly rates multiplied by 12** to give comparable annual
run rates. They are **not calendar-2025 receipts**. Property grants use the dated 2026 eligibility references
and Manitoba's rule effective 2025. No result is an invented 2026 tax return or an indexed estimate.

## Measured effects

The age and pension rows remove that credit alone, leaving the other in place. An OAS row adds taxable pension
income and reports the resulting **tax increase**, not the pension payment as a tax saving. Recovery is also a
cost; other rows report reductions in tax less benefits. The table gives absolute movements.

| Feature / household | BC dollars | Ontario dollars | BC own points | Ontario own points | Gap points |
|---|---:|---:|---:|---:|---:|
| Federal + provincial age credits / M | 1,602.49 | 1,623.32 | 4.579 | 4.638 | 0.060 |
| Federal + provincial pension credits / M | 340.60 | 378.98 | 0.973 | 1.083 | 0.110 |
| Income tax on OAS / M | 1,703.13 | 1,857.77 | 4.866 | 5.308 | 0.442 |
| Income tax on 75+ OAS increment / M | 205.33 | 173.63 | 0.587 | 0.496 | 0.091 |
| OAS recovery, including deduction / H | 656.15 | 651.44 | 0.656 | 0.651 | 0.005 |
| GIS / L | 13,265.16 | 13,265.16 | 149.364 | 149.364 | 0.000 |
| Allowance, after spouse GIS interaction / A | 11,585.76 | 11,585.76 | 130.454 | 130.454 | 0.000 |
| Eligible pension splitting / C | 1,305.31 | 1,754.38 | 0.932 | 1.253 | 0.321 |
| Senior-specific property relief / P | 275.00 | 500.00 | 0.786 | 1.429 | 0.643 |

For L, BC's maximum supplement is $1,191.60/year (13.417 points), versus Saskatchewan's $4,320
(48.643 points): a **35.225-point** change in their gap when adding those two programs. These are direct
supplement effects before any interaction with other provincial benefits. For P, Manitoba's maximum seniors'
school rebate is $235 (0.671 points); versus Ontario's $500, the isolated gap movement is 0.757 points.

The federal age credit alone saves `9,028 × 14.5% = $1,309.06` for M; BC adds `$5,799 × 5.06% = $293.43`.
The federal pension credit alone saves `$2,000 × 14.5% = $290`; BC adds $50.60 and Ontario $88.98.
All are non-refundable: zero tax payable can make the usable credit zero. At sufficiently high income the age
credit is fully phased out; that boundary does not change the decision for the households it helps.

The independently transcribed inputs come from the
[CRA 2025 T1](2025/sources/seniors-t1.txt),
[BC428](2025/sources/seniors-bc428.txt), [ON428](2025/sources/seniors-on428.txt),
[federal worksheet](2025/sources/seniors-federal-worksheet.txt),
[BC worksheet](2025/sources/seniors-bc-worksheet.txt) and [Ontario worksheet](2025/sources/seniors-on-worksheet.txt).
The [CRA age overview](2025/sources/seniors-age.txt) gives other jurisdictions' age-amount limits;
the [pension overview](2025/sources/seniors-pension.txt) gives eligibility and provincial caps.
Each cached extract contains its official URL, retrieval date and original-file hash.

### OAS, GIS and Allowance details

The [ESDC Q4 2025 table](2025/sources/seniors-oas-q4.txt) supplies monthly OAS $740.09 at 65–74 and $814.10
at 75+, single GIS $1,105.43, GIS with an Allowance-recipient spouse $665.41, and Allowance $1,405.50.
The 75+ example raises M's income by `$888.12`, keeping D at $35,000. OAS/CPP are taxable income; pensions
already manually entered must not be added a second time when the dedicated controls arrive.

For A, disabling Allowance changes the older spouse's GIS category to a spouse not receiving OAS/Allowance.
The net federal-transfer gain is therefore
`12 × (1,405.50 + 665.41 − 1,105.43) = $11,585.76`, rather than $16,866.
Income tax is zero in both zero-private-income cases; income-tested provincial benefits remain outside this row.
The equal direct federal effects explain the zero BC/ON gap, but the own-rate criterion easily passes.

The [official recovery example](2025/sources/seniors-oas-recovery.txt) calculates
`15% × ($100,000 − $93,454) = $981.90`. The T1 and federal worksheet deduct the repayment at line 23500
and add it to payable tax. Recomputing income tax on $99,018.10 produces the smaller net costs in the table,
including age-credit restoration. Implementing recovery only as an extra 15% charge would miss that deduction.
Withholding based on the preceding year's return is not the same as the current tax year's final liability.

### Pension splitting

For C, transfer $30,000 of the higher earner's $80,000 eligible pension: a legal 37.5% election, producing
$70,000 each. Both spouses retain enough eligible pension to use their credit caps. Neither needs a spouse
amount or an unused-credit transfer in this example. Income-tax totals before/after are:

| Province | Before | After | Saving |
|---|---:|---:|---:|
| BC | $22,898.16 | $21,592.85 | $1,305.31 |
| Ontario | $24,696.66 | $22,942.28 | $1,754.38 |

This is one feasible split, **not a proof of the optimum**. It includes age-credit phase-outs and provincial
tax mechanics, but isolates income tax from OAS recovery and other benefit changes. The optimizer must search
the complete household objective, include zero, and consider either spouse as transferor. Re-run the choice
when the later benefits are added; a nominal 50% split is not inherently optimal.

[CRA's splitting rules](2025/sources/seniors-split.txt) allow at most 50% of eligible pension. OAS/CPP/QPP
are excluded. Ordinary RRSP withdrawals are not interchangeable with eligible RRSP annuity payments or age-eligible
RRIF income. The recipient's pension-credit eligibility also needs its own check. Quebec's provincial election
rules require separate sourcing in #20; this BC/ON calculation makes no assertion that Quebec uses the same rules.

### Provincial supplements and property relief

BC's [July 2025 rate table](2025/sources/seniors-bc-supplement.txt) supplies $99.30 monthly for a single senior.
Saskatchewan's [effective-July-2023 announcement](2025/sources/seniors-sk-supplement.txt) supplies $360;
its current [program page](2025/sources/seniors-sk-current.txt)
continues to identify those rates as effective July 2023. Maximums assume zero private income and full qualifying
OAS/GIS. They establish materiality of both programs, not that each person receives the maximum.

Two further candidates have clear material maximums, but are not mixed into the 2025 comparison:
[Alberta's July-2026 rules](2026/sources/seniors-ab-supplement.txt) provide up to $3,946 annually to a single
homeowner/renter/lodge resident, with its own income exclusions and 0.1714 reduction rate;
[Ontario's July-2026–June-2027 GAINS](2026/sources/seniors-on-gains.txt) provides up to $92 monthly.
Collect year-specific rules for both before implementing. Other provincial/territorial programs are **not sized
or excluded here**: #21 retains its explicit requirement to inventory every jurisdiction and justify any cut.

For P, assume a $500,000 Vancouver home and $4,000 property tax before grants; compare only the senior increment.
The [dated 2026 BC announcement](2026/sources/seniors-bc-property-release.txt) gives $570 ordinary versus $845
senior grant, hence $275. This does not authorize forgetting the ordinary grant: #22 must reconcile it with the
existing property-tax estimate. The [live BC page](2026/sources/seniors-bc-property.txt) now also discusses 2027;
do not copy that future geography rule into 2025/2026 data.

The [CRA 2026 Ontario grant rules](2026/sources/seniors-on-property.txt) cap the grant at property tax paid or
$500, with the single-person reduction above $35,000. At $4,000 tax the property-component overlap cap does not
bind in this example. Its 2026 payment is claimed using 2025 income/property tax: it is not a 2025 cash receipt.
[Manitoba's budget bulletin](2025/sources/seniors-mb-property.txt) retains the $235 seniors' school rebate
from 2025 despite replacing other property programs. Its reduction starts above $40,000 family income.
The $235 example requires at least $235 eligible school tax remaining after other relief; total property tax
alone does not establish this. Deferrals remain excluded because they postpone rather than remove tax.

## Implementation ticket recommendations

No deletion or scope cut is supported. Resolve the pension-splitting question in SCOPE.md as material, linking here.
Recommended initial implementation is 2025–2026, with a separately tracked historical extension and explicit
unsupported-year behavior; a zero seniors benefit in a historical year must not masquerade as a complete estimate.
This is a proposed delivery sequence, not an approved change to historical scope.

| Ticket | Add to acceptance criteria |
|---|---|
| #17 | Separate workplace pension, eligible RRIF/annuity income, and ordinary RRSP withdrawals; source federal/provincial eligibility, phase-outs and spouse transfers. Preserve legacy other-income inputs. Record age information sufficient for later 60–64/65–74/75+ distinctions. |
| #18 | Treat OAS and entered CPP/QPP as taxable cash income once; apply the 75+ change from its effective month; use sourced quarterly rates, current-year recovery liability and its deduction. Specify year/month assumptions. Never subtract OAS as a refundable credit. |
| #19 | Source income definitions, earnings exemptions, benefit periods, marital categories and spouse-GIS/Allowance interaction. Distinguish taxable income from GIS income tests. Use published examples beyond maximums and at taper boundaries. |
| #20 | Exclude OAS/CPP/QPP and ineligible withdrawals; source Quebec rules separately. Optimize the complete tax/benefit objective per province, with zero split and both transfer directions. Re-evaluate after #18–19 and #21. |
| #21 | Keep all-jurisdiction inventory. Size each additional program before cutting; use province-specific income definitions and benefit years. Account for supplements already embedded in existing credits rather than double counting. |
| #22 | Inventory recurring grants/rebates, including age changes to existing property/renter credits. Reconcile BC ordinary versus additional grant, Ontario overlap caps and Manitoba remaining school tax. Keep deferrals out and distinguish gross bills from bills already reduced by grants. |

These recommendations should be copied into the existing issues by the orchestrator after review. Production
data, formulas, UI and golden baselines are unchanged by this study. Future feature PRs still require independently
verified reference cases and golden coverage for every implemented rule path and material boundary.

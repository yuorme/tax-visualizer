# Seniors' property-tax relief inventory, 2025–2026

Research for **#22, phase 1 only**, checked **2026-11-05** against base `7757e93`.
This is an inventory and implementation brief. No production data, engine, UI or golden expectations change.
The [sizing study in PR #135](https://github.com/yuorme/tax-visualizer/pull/135)
and its [verification note](16-seniors-sizing.md) retain this category; this inventory does not reverse that decision.

## Evidence status and conventions

The [source index](22-property-tax-relief/SOURCES.md) links the collected government publications.
Raw-download extracts record official URL, retrieval date and original-document SHA-256, as in
[the #138 specification](138-senior-credit-rules.md). A few territorial/PE pages were readable through the
web reader but rejected raw downloads; their status is explicit, and no original-file hash is invented.
The regional appendices preserve detailed eligibility, source limitations and municipal interactions:
[AB/SK/QC](22-property-tax-relief/west-qc.md), [Atlantic](22-property-tax-relief/atlantic.md), and
[territories](22-property-tax-relief/territories.md). Annual shared source indexes are untouched.

All amounts are CAD. A representative recipient is a continuously resident qualifying owner aged 68 with
$35,000 income and a $3,000–$4,000 gross residential bill, unless a row specifies another profile.
These are sizing examples, **not population averages**. Means are labelled with their actual observation year.
At $35,000 income, $35 changes the effective tax rate by 0.1 percentage points. Maximums alone are not used
to claim that a typical recipient gets the maximum, and an unknown amount is never treated as zero.

**In** means retain for implementation; **out** gives a scope reason after sizing. **Unresolved/material**
means retain the candidate, collect the missing rule or choose a separately tracked delivery scope before
shipping it. It does not authorize silently omitting the benefit. Municipal rules are local, not province-wide.
No grant found means no grant identified in the cited government inventory/reference-city search, not proof
that every local authority has none. Repairs, home-care services and rent-geared-to-income housing are not
property-tax rebates; material adjacent housing transfers are separately identified below.

**Tax year, income year, bill year and benefit year are distinct.** BC/MB/YT/NT bill relief generally concerns
the current bill. Ontario's 2025 benefit uses 2024 income/occupancy costs; 2026 uses 2025, with OEPTC paid
July–June. NS's 2025 program refunds 2024 taxes; its 2026 program refunds 2025 taxes. Quebec's municipal
grant concerns the next municipal bill claimed through the preceding return; shelter allowance runs October–September.
The existing app largely combines tax-year taxes with annual benefit-year rates and current-income proxies.
Implementation must label that convention or collect reference-year inputs; it cannot call those annualized
entitlements actual calendar-year cash receipts. 2026 filing forms are not assumed final merely because a
2026 program amount or budget is published. Coverage proposed here is **2025–2026 only**, with historical
back-fill tracked.

## All-jurisdiction decision inventory

The detailed sections/appendices supply the income definitions, timing and evidence behind each row.

| Jurisdiction | Retained recurring relief and annual size | Out / no-program finding, after sizing |
|---|---|---|
| BC | HOG ordinary $570 / senior $845 in Vancouver: $275 age increment on a normal bill; rural $770/$1,045. Low-income restoration can be $845. Both years. | Deferral finances tax, $0 forgiven. Existing renter credit $400 has no senior increment; keep once. SAFER housing support about $4,044 annualized: scope decision, not small. |
| AB | No provincial senior property grant/renter-credit age increment identified for either year. | Senior tax-deferral loan: illustrative $4,000 financed, $0 forgiven. Calgary age-neutral tax-increase assistance: illustrative $200, out of senior scope. St. Albert's 2026 $200 senior grant is outside Calgary, not province-wide. |
| SK | No provincial senior property grant/renter-credit age increment identified for either year. | Provincial school-tax loan: illustrative $2,000 financed; Saskatoon municipal/library deferral: $3,000 financed; both $0 forgiven. |
| MB | Seniors school rebate up to $235 after other school relief; renter age-65 top-up max $328.57/$357.14 in 2025/2026, about $41.08/$44.63 at $35,000 family income. | Retired EPTC senior top-up and School Tax Credit for Homeowners: $0 entitlement from 2025, not extra live programs. Ordinary HATC $1,500/$1,600 and rent credit $575/$625 already present. Rent Assist is a material housing-scope decision. |
| ON | OSHPTG up to $500 in both benefit years; replace ordinary OEPTC with senior schedule, max $1,461/$1,488 total, not another full credit. | Toronto cancellation is material: average-home city levy increase about $268 in 2025/$91.53 in 2026; municipal scope decision. Deferral of that increase saves $0 tax. OSTC senior increment $34.60/$38.56 belongs to #21/OTB coordination. |
| QC | Municipal-tax-increase grant: implied 2023 mean about $145; new-roll increment up to $500 **plus carryover**. 2025/2026 income caps $62,900/$64,200. | Shelter allowance, age 50: $1,200–$2,040 yearly, material housing-scope decision. Existing solidarity housing component remains once; no separate senior housing increment identified. |
| NB | No provincial senior property grant/renter-credit age increment identified for either year; no Moncton senior grant found. | Tax-increase deferral: official example $100 financed, $0 forgiven. General senior cash benefit $616/$629 belongs to #21. |
| NS | Provincial rebate 50%, max $800, both program years. Halifax exemption material, with 2026 GIS exception to assessed-value cap; municipal scope decision. | Halifax financing of residual tax: illustrative $630 deferred, $0 extra forgiveness. 2026/27 municipal amount table remains unverified. |
| PE | No provincial senior grant/renter-credit age increment identified for either year; no Charlottetown senior grant found. | Senior deferral: historical published mean $1,729 financed, $0 forgiven. Ordinary resident credit already embedded in reference rate; do not subtract again. |
| NL | St. John's senior reduction 25% in both years: $682.50 on illustrative $2,730 levy. Retain local path. | No province-wide senior property grant/renter-credit age increment identified; general Seniors' Benefit belongs to #21, not a property grant. |
| YT | HOG ordinary $450 / senior $500 on $3,000 tax; age increment $50, or $150 on $600 tax. 2025 continuation needs final source confirmation. | Tax deferral: illustrative $2,500 after grant financed, $0 forgiven. No separate renter-credit age increment identified. |
| NT | Yellowknife combined municipal/territorial relief up to $2,000, independently dated in both years; $2,000 on $3,000 tax. Other communities require local rule/award. | No separate renter-credit age increment or senior tax deferral identified in checked law/guides. A discretionary full general-area exemption could be $3,000, not assumed automatically. |
| NU | Territorial general-area and separate Iqaluit senior relief exist. **Award amount unresolved/material**; 100% of $3,000 is $3,000 exposure, not a verified typical award. | No separate renter-credit age increment or senior tax deferral identified. Do not ship $0 or import NT's $2,000 cap as a supposed NU rule. |

## BC: ordinary grant, senior replacement and restoration

Sources: [HOG Act, s.2 and Schedules 1–4](22-property-tax-relief/sources/bc-hog-act.txt),
[dated 2026 release](22-property-tax-relief/sources/bc-2026-release.txt),
[senior eligibility](22-property-tax-relief/sources/bc-senior.txt),
[regulation, ss.9–18](22-property-tax-relief/sources/bc-hog-regulation.txt), and
[FIN 65](22-property-tax-relief/sources/bc-fin65.txt).
The release says grant amounts remain unchanged and identifies the preceding year's threshold, supporting
2025/2026 amounts below; the live pages also describe a **2027** rural change that must not be backdated.

| Parameter | 2025 | 2026 |
|---|---:|---:|
| Full-grant assessed/partitioned-value threshold | 2,175,000 | 2,075,000 |
| Ordinary / senior grant, Metro Vancouver, Capital and Fraser Valley regions | 570 / 845 | 570 / 845 |
| Ordinary / senior grant, outside those regions | 770 / 1,045 | 770 / 1,045 |
| Minimum property tax remaining, ordinary / senior schedule | 350 / 100 | 350 / 100 |
| Grant reduction per $1,000 excess assessed value | 5 | 5 |

The registered applicant must be a citizen/permanent resident, ordinarily resident in BC, occupying the
principal residence; age 65 at some time during the tax year selects the senior schedule. There is no ordinary
income test. Senior is a **replacement schedule**, not an automatic $845 on top of $570, and not always
a $275 increment: on $600 tax below the value threshold, ordinary grant is $250 and senior grant $500.
For a standard Vancouver bill $4,000, the amounts are $570/$845, leaving $3,430/$3,155.
The Act applies the property-tax schedule first, then the assessed-value reduction. On $600 tax with $20,000
excess value, senior grant is `$500 − $100 = $400`; clipping only after reducing the $845 maximum gives a
wrong result. Values are assessed school-tax residential values, not necessarily market values entered in the app.

**Low-income grant supplement: in.** It restores the high-assessment reduction, up to the pre-reduction grant.
The income is **previous-year federal net income**, with each negative person's income floored at zero, adding
the shared-income partner, then applying regulation s.11 deductions: $3,000 for the partner, $3,000 per
age-65 person, dependent-child adjustments, disability deductions and the specified net UCCB adjustment.
It is not current-year household gross income or generic AFNI. A single senior with $35,000 prior-year net
income has adjusted income $32,000. Adjusted income **at most $30,000 restores the full lost grant**;
over $30,000 through $32,000 restores **half**; above $32,000 gives none. A calculated supplement below
$25 is not payable. There is no linear $30,000–$32,000 taper.

Example with adequate tax and an assessed value $200,000 above the year's threshold: ordinary senior grant
is exhausted; at adjusted income $30,000 the supplement can restore $845 in Vancouver, at $31,000 it can
restore $422.50, above $32,000 $0. Restoration is only the actual reduction, never another independent
$845 on a property already receiving its full grant. Typical ordinary-value seniors get $0 supplement because
their normal grant was not reduced; that is not evidence against retaining this material high-value path.

**Out:** [property-tax deferment](22-property-tax-relief/sources/bc-defer.txt) is financing, available through
the age-55/survivor/disability regular route or families route, with equity/interest conditions. Deferring
the illustrative senior residual $3,155 postpones $3,155; it forgives **$0**. It does not cancel HOG eligibility.
[BC renter credit](22-property-tax-relief/sources/bc-renter.txt) is already present, max $400, 2% reduction
above adjusted family income $64,764/$66,189 for 2025/2026, zero at $84,764/$86,189. It has no senior
increment, and rental subsidies do not reduce it. Preserve it once; no new age-related renter credit is inferred.

## Ontario: one OEPTC calculation and an overlapping grant

Sources: [2025 ON-BEN](22-property-tax-relief/sources/on-2024-ben.txt),
[2025 Finance provisions](22-property-tax-relief/sources/on-budget-2025.txt),
[OSHPTG Q&A](22-property-tax-relief/sources/on-grant-2026.txt),
[OEPTC Q&A](22-property-tax-relief/sources/on-oeptc-qa.txt), and the four cached senior calculation sheets.

**OSHPTG: in.** For benefit year `b`, applicant is at least 64 on December 31 of `b−1`, an Ontario resident
owning and occupying the principal residence with eligible tax paid for `b−1`. One couple claim, using
the same claimant as OEPTC; one qualifying senior spouse is sufficient. Non-spousal co-owners claim only
their share. Paid-up qualifying long/life leases have specific rules; ordinary renters do not get this grant.
Use previous-year **adjusted family net income**: spouses' federal net incomes, less UCCB/RDSP income,
plus the corresponding repayments, with CRA's applicable residency adjustments. Do not remove GIS merely
because it is non-taxable: federal net income can include it. Family status and medical-separation exceptions
need their documented treatment, rather than summing every adult resident's income.

```text
grant = max(0, min(500, eligiblePriorYearPropertyTax)
               − 0.0333 × max(0, priorYearAFNI − threshold))
threshold = 35,000 single; 45,000 couple
explicit no entitlement at AFNI >= 50,000 single / 60,000 couple
```

The same published amounts apply to 2025 and 2026 benefits. A qualifying single at $35,000 and $4,000
prior-year tax gets $500. At $40,000, $333.50 before any administrative rounding. The advertised 3.33%
coefficient and explicit endpoint need both tests; do not extrapolate a small positive amount at the cutoff.

**OEPTC age schedule: in, replacing the existing under-65 schedule.** Both renters and owners qualify under
the relevant occupancy rules. The senior worksheets use age 64+ at December 31 of the preceding year;
mixed-age couples need only one qualifying senior. Income is previous-year AFNI as above, not taxable income.
Ordinary full-year owner/renter formulas, excluding special residence/reserve accommodation, are:

```text
O = eligible prior-year property tax + 0.20 × eligible prior-year rent
E = min(O, energyMaximum)
P = min(O, propertyBase + min(0.10 × O, propertyIncrementMaximum))
rawOEPTC = max(0, E + P − 0.02 × max(0, priorYearAFNI − seniorThreshold))
overlap = max(0, max(0, rawOEPTC + OSHPTG − E) − O)
OEPTC = max(0, rawOEPTC − overlap)
```

| Benefit year / income and cost year | Energy maximum | Senior property base | Senior incremental maximum | Senior full property maximum | Senior single / family income threshold |
|---|---:|---:|---:|---:|---:|
| [2025 / 2024, single](22-property-tax-relief/sources/on-senior-2025.txt), [couple](22-property-tax-relief/sources/on-couple-2025.txt) | 285 | 606 | 570 | 1,176 | 35,632 / 42,758 |
| [2026 / 2025, single](22-property-tax-relief/sources/on-senior-2026.txt), [couple](22-property-tax-relief/sources/on-couple-2026.txt) | 290 | 617 | 581 | 1,198 | 36,309 / 43,571 |

The maximum total OEPTC is $1,461/$1,488; the difference from the ordinary maximum is $178/$181, but
typical differences also depend on occupancy cost and higher senior income thresholds. At $35,000 AFNI and
$4,000 eligible tax, 2025 senior OEPTC is `$285 + $1,006 = $1,291`, versus current ordinary $626.12;
OSHPTG adds $500 without binding the cap. In 2026, senior OEPTC is $1,307 versus ordinary $643.94,
plus $500 OSHPTG. These are benefit-year amounts, not refunds on those years' T1s.
At $600 occupancy cost in 2026 and low income: raw OEPTC $890, grant $500, overlap $500,
final OEPTC $390. Combined $890 equals $600 property plus $290 energy. A blanket total-credit cap at
the property bill would incorrectly remove the energy component; independent addition would overpay $500.
Rent $1,000/month gives 2025 senior OEPTC $1,131 at $35,000 AFNI, with no OSHPTG.

**Toronto municipal cancellation: retain as a material local scope decision.**
[2025](22-property-tax-relief/sources/on-toronto-2025.txt) and
[2026 budget](22-property-tax-relief/sources/on-toronto-2026.txt) permit cancellation of the qualifying
annual increase with household income at most $60,000/$62,000 and assessment at most $975,000.
Applicant is 65+, or meets the specified 60–64 federal-supplement/disability route; ownership/occupancy
and good-standing requirements apply. [City guidance](22-property-tax-relief/sources/on-toronto-relief.txt)
uses income of all resident owners plus spouses, not just applicant/spouse AFNI. Exact accepted income
document year/line and levy exclusions need the application/bylaw before implementation. The budgets size
an average-home municipal increase at about $268/$91.53; an eligible recipient may have that increase
cancelled. These are not measured recipient means. The parallel increase-deferral program merely postpones
the same tax and forgives $0. Cancellation already credited to a bill cannot also generate another grant
on the cancelled amount. Utility rebates are distinct from property tax and are not inferred from a levy.

**Coordinate outside #22:** [OSTC senior-family threshold](22-property-tax-relief/sources/on-ostc-senior.txt)
is $36,497/$37,273 for 2025/2026 benefits, versus ordinary $35,632/$36,309, with 4% reduction.
At $38,000 AFNI, a couple's age increment is $34.60/$38.56 yearly; 2026 exceeds 0.1 points at that income.
This sales-tax-credit change belongs with #21/OTB work, and must not become another property grant.

## Manitoba: school-tax base and the existing renter credit

Sources: [2025 MB479](22-property-tax-relief/sources/mb-479-2025.txt),
[2025 guide](22-property-tax-relief/sources/mb-guide-2025.txt),
[enacted 2025 amendments, ss.19–21 and commencement](22-property-tax-relief/sources/mb-act-2025.txt),
[2024 budget bulletin](22-property-tax-relief/sources/mb-budget-2024.txt), and
[2026 bulletin](22-property-tax-relief/sources/mb-budget-2026.txt).
Use enacted text and current forms: some live summary pages still describe the discontinued EPTC ordering.

**Seniors school tax rebate: in.** Owner or spouse is 65+ at year-end, principal-residence/HATC eligibility
applies, and only one spouse claims both HATC and this rebate. Manitoba **family income** is MB479 line 6:
each person's federal line 23600, adding UCCB/RDSP repayments, subtracting UCCB/RDSP income, then
flooring each person's result at zero and summing spouses. Medical separate-residence cases exclude the
other spouse as instructed. It is neither taxable income nor total pre-tax cash income.
For a full-year ordinary qualifying owner in both years:

```text
remainingSchoolTax = max(0, grossEligibleSchoolTax − allHATCRelief)
rebate = max(0, min(235, remainingSchoolTax) − 0.01 × max(0, familyIncome − 40,000))
allHATCRelief = advance already credited + remaining HATC claimable
```

HATC maximum is $1,500 in 2025/$1,600 in 2026, capped by **school tax**, not total municipal-plus-school
tax. Reconstruct gross school tax from a net-school figure plus its advance; never subtract the advance
twice or add a second HATC maximum on the return. If eligible school tax is $1,700, a full 2026 HATC
leaves $100 and senior rebate at $35,000 family income is $100, not $235. At $2,000 school tax and
$50,000 income, rebate is `$235 − $100 = $135`; at $63,500 no rebate. With only $100 remaining,
the rebate is exhausted already at $50,000. The taxpayer cannot skip otherwise claimable HATC to enlarge
the senior rebate. The 2025 amended law and MB479 also prorate eligibility days; use their actual ordering
and reconcile final 2026 forms before extending the full-year formula to changes of residence.

**Renters affordability credit senior calculation: in as replacement of the ordinary renter amount.**
Applicant/spouse is 65+ at year-end; eligible residence occupied more than half each claimed month's days;
one claimant per residence/month. Full credit is capped by actual eligible rent. At most 12 months qualify;
same-period ownership and renting cannot generate both credits for the same residence.

| Tax year | Ordinary annual amount | Senior combined maximum | Maximum age top-up | Reduction coefficient on family income |
|---|---:|---:|---:|---:|
| 2025 | 575 | 903.57 | 328.57 | 0.8214% |
| 2026 | 625 | 982.14 | 357.14 | 0.8929% |

The full-year senior amount is combined maximum less the lesser of maximum top-up and the stated
percentage of family income, capped by actual rent; month fractions then matter. At $35,000, 2025 is
`$903.57 − $287.49 = $616.08`, an increment of $41.08; 2026 is `$982.14 − $312.515 = $669.625`,
about $44.63 above $625. The reduction starts at **zero income**, not at $40,000. Published rounded
coefficients leave cent-level endpoint issues: 0.8214% of $40,000 is $328.56, and MB479 also prints
a $47.91 monthly ordinary floor rather than exact $575/12. Verify statutory/monthly rounding against
the final calculation before changing a locked annual baseline; do not invent tolerances or a new cliff.

**Out as obsolete:** the senior EPTC top-up and School Tax Credit for Homeowners were removed effective
2025; they are not additional current-year benefits. The 2027 $1,700 HATC and assessed-value taper must
not enter 2026. Ordinary current credits are already in the engine and must be replaced/extended, not duplicated.

## Other jurisdictions and material adjacent programs

The [Atlantic appendix](22-property-tax-relief/atlantic.md) records the complete NB/NS/PE/NL eligibility
and timing. Retain **NS's 50%, $800** rebate after municipal exemptions, with GIS eligibility age 65+
or Allowance eligibility age 60–64 in the program year. Use the named federal-benefit eligibility basis,
not a generic line-23600 threshold or a universal age-65 gate. Official example: $971.77 eligible paid
tax gives $485.89. A $1,830 prior-year bill gives $800; if municipal relief leaves $630, it gives $315.
Halifax's 2025/26 exemption table gives $1,200–$1,400 before income scaling/minimum-payable limits;
the 2026/27 table remains missing. From April 1, 2026, GIS recipients escape its new $425,000 taxable
assessment cap. Halifax household income includes other adults and enumerated exclusions; it is not AFNI.
**St. John's 25%** applies in 2025/2026 to qualifying resident senior owners with GIS, or age 60–64
Allowance for Survivor recipients. Ordinary Allowance is not interchangeable with Survivor Allowance.
Its $2,730 tax example saves $682.50; water charges are separate and not shown eligible for that percentage.

The [AB/SK/QC appendix](22-property-tax-relief/west-qc.md) distinguishes **QC's municipal-increase grant**
from a second supposed Montreal grant: they are the same program. At December 31 before the bill year,
claimant is 65+, has 15 consecutive ownership years under the specified spouse rules, and meets the
$62,900/$64,200 combined Quebec **line-275** limits. The one-unit residential principal home must have
an eligible municipal bill. Use municipality-issued potential grant and previous-roll carryover, not total
tax times a guessed percentage. New-roll increment is capped at $500 plus prior-roll amounts; the 2023
rounded estimated cost $1.9 million divided by 13,077 recipients implies about $145.29. Exact assessment/co-owner
allocation still needs the claim form/law before coding. Montreal's 2026–2028 valuation threshold is 18.41%.

The [territorial appendix](22-property-tax-relief/territories.md) gives owner/residence/co-owner rules.
**Yukon HOG** uses 50%/$450 ordinary versus 75%/$500 senior, age 65 in the calendar year, no income
test, 184 residence days and paid taxes; ordinary relief is absent from the engine too. The precise senior
low-bill floor/survivor rules and dated 2025 schedule remain unconfirmed; published 2024 and 2026 schedules
match. **Yellowknife** is `2 × min(0.5 × eligibleTax, $1,000)`, combining city exemption and territory's
equal payment, verified for both years. Age 65 during the tax period, residence and eligible co-owners apply;
prior NOAs establish dependency in some ownership cases, not a general AFNI taper. $1,200 eligible tax
gets $1,200 relief; $3,000 gets $2,000. **NU** has a general-area route excluding Iqaluit and a separate
Iqaluit application. No universal percentage/cap or recipient mean was established: $3,000 potential full
exemption is a size exposure only. Retain unresolved; a local award rule is required for default calculations.

The following housing transfers are **material**, outside a narrow property-tax-credit implementation
unless expressly included; assign follow-up scope rather than treating them as immaterial:

- **BC SAFER, age 60+:** [program](22-property-tax-relief/sources/bc-safer.txt) and
  [March 2025 release](22-property-tax-relief/sources/bc-safer-2025-release.txt). From April 2025, gross
  household income below $40,000, at least 12 months' BC residence, qualifying private rent above 30% of
  gross income, maximum recognized rent $1,150/month, minimum benefit $50/month. Income verification
  excludes specified bus-pass/senior-supplement amounts; do not reuse ordinary credit AFNI. Payments begin
  in the application month and annual reapplication is required. Government projected mean monthly
  assistance $337, or **$4,044 annualized**, not calendar-2025 actual receipts. 2026 current rules continue;
  January–March 2025 needs the earlier schedule for cash-year precision. No second BC renter tax credit.
- **QC Shelter Allowance, age 50 or qualifying children:** annual tiers $1,200/$1,800/$2,040 at housing
  ratios 30%/50%/80%; assets at most $50,000 with specified exclusions. Prior-year combined line 275,
  child-support adjustments and October–September periods differ from the tax-credit engine. A single
  senior with $22,000 reference income and $900/month qualifying rent gets **$1,800** under both collected
  October schedules. The appendix gives all 2025/26 and 2026/27 family thresholds and cost allowances;
  January–September 2025 rules remain uncollected.
- **MB non-EIA Rent Assist, age-55 distinction:** [program](22-property-tax-relief/sources/mb-rent-assist.txt)
  and [estimator](22-property-tax-relief/sources/mb-rent-estimator.txt) use 80% median market rent less
  30% net household income. Current single income limits $29,120 ordinary/$33,920 age 55+ imply, by
  independent algebra, $8,736/$10,176 annual recognized housing amounts. At $20,000 relevant income,
  that is illustrative **$2,736/$4,176 annual support**, an age difference $1,440. These are undated
  current-page sizing values, **not verified 2025 or 2026 schedules**. The estimator expressly says OAS
  income is treated differently. Exact net-income adjustments, July renewals and both years' dated rental
  schedules remain open. No observed recipient mean was found; no exclusion for small size is justified.

AB Seniors Benefit, SK Seniors Income Plan, NB/NL general senior cash benefits and territorial living-cost
supplements belong in #21. They do not become property rebates merely because recipients own a home.
NB's verified $616/$629 is material. This note makes no size-based exclusion of uncollected #21 programs.
Deferrals in BC/AB/SK/NB/PE/YT and municipal deferrals remain **out**, regardless of principal size:
tax forgiven is $0. Interest concessions are financing benefits, not removal of the property tax assessed.

## Existing engine and avoiding duplicate relief

Read-only inspection at the base commit found:

- `src/engine/household.ts` `propertyTax()` uses a province-specific explicit bill, including zero, or
  `homeValue × propertyRate`. The result feeds **both** `creditsOf()` and the gross property-tax total.
  There is no gross/net basis, school-tax split, already-applied grant, local eligibility or reference-bill year.
- `src/engine/credits.ts` applies ordinary ON OEPTC, BC renter credit, MB HATC/renter credit and QC
  solidarity housing once. MB currently caps HATC against **total property tax**. That total is insufficient
  to establish school tax remaining for a senior rebate, and can overstate HATC on a small school levy.
  2025/2026 data do not have a sourced school-tax share; do not reuse 2024's estimate without verification.
- BC/YT ordinary HOG and senior grants are absent. The current city tax **rates** do not explicitly net a
  personalized HOG. Conversely PE's ordinary resident credit is already reflected in the reference rate;
  [its verification](86-charlottetown-owner-credit.md) prevents another subtraction of that credit.
- #11's UI tooltip says enter the bill **before credits calculated here**. Preserve existing serialized
  bills as that documented gross convention. It has no field proving whether a newly added BC HOG or
  municipal grant was already deducted from a real notice; amount alone cannot establish this.

Proposed accounting contract, to settle before UI/engine implementation:

```text
gross eligible levy = entered net levy + known grants/cancellations already in that levy
net property burden = gross levy − each entitled property relief exactly once
```

Store bill basis and **amounts by relief/program**, not just a single "net bill" flag. For a $4,000 Vancouver
gross bill, $845 total senior HOG leaves $3,155. For a $3,430 bill already net of the ordinary $570,
only $275 remains to credit; for $3,155 already net of senior HOG, no further HOG is due. All three
represent the same final property burden. A generic net bill with unknown adjustments cannot be grossed
up reliably; request the gross levy/credited amounts, or explicitly mark automatic relief incomplete.
Do not suppress unrelated unclaimed relief merely because one grant is already applied.

Keep eligible tax components distinct: MB gross school tax/advance, Ontario prior-year eligible paid property
tax/occupancy cost, NS prior-year paid residential tax after municipal exemptions, and current-year bill.
Track credited-on-bill amounts versus return/cash rebates. Either show gross property plus itemized relief,
or net property plus only relief not yet reflected; never subtract the same amount in property **and** credits.
An explicit zero bill keeps its meaning; missing is not zero. A home value of zero with a supplied owner bill
must still enter owner eligibility. Custom rates/bills remain home-province-only as #11 specifies.

## Decisions and missing evidence before phase 2

1. Decide whether #22 includes reference-city municipal cancellation/exemption paths (Toronto, Halifax,
   St. John's and territorial local rules), or tracks explicit follow-ups. Their amounts are material;
   excluding them cannot be justified as a 0.1-point cut. A custom province bill does not identify its city.
2. Decide whether to include age-gated housing allowances (BC SAFER, QC Shelter Allowance, MB Rent Assist)
   here or create a housing-benefits follow-up. They are material and cannot silently disappear from senior estimates.
3. Choose and label the app's benefit-period convention: annual benefit-year entitlement with reference-year
   inputs/current-income approximation, versus actual calendar cash. Collect missing prior periods for the latter.
4. Confirm gross/net bill input design and MB school-tax input/reference-school-rate source. Existing #11
   saved values retain the documented pre-credit meaning; unknown new net bills need explicit handling.
5. Collect NU's operative Iqaluit award rule and general-area award policy; Yukon 2025/low-bill/survivor
   evidence; Halifax 2026/27 table; QC assessment/co-owner claim details; Toronto application income/levy
   details; and MB final monthly/annual rounding. These are rule gaps, not findings of immateriality.

## Phase 1 validation

Only this note and its issue-local evidence folder changed. `check-scope.mjs origin/main HEAD` reports
`docs_only=false` because cached sources are `.txt`, so the full validation path was used. Under Node 26,
`npm ci`, `npm run format` (no fixes) and `npm run check` passed: 3,567 tests, build and browser smoke
coverage of 54 pages, 344 states and 54 contrast scans at desktop/430/375 in light/dark. The first sandboxed
run reached Chromium startup but failed with `bootstrap_check_in ... Permission denied (1100)`; the
escalated full rerun passed. The scope command, `node scripts/check-docs.mjs` and `git diff --cached --check`
were also run on the final staged documents. No production or golden file changed.

## Short implementation plan

1. Add a pure `src/engine/property-relief.ts` evaluator, with data-driven year-specific amounts and a
   household relief result carrying gross levy, eligible components, amounts already applied and remaining
   relief. Integrate once in `household.ts` after its current owner is finished. Follow `useCredits` consistently;
   document whether the switch disables all new grants as it does existing property credits. Never test calendar
   years in a formula to change rule shape; use a new `program` id. Include ordinary BC/YT schedules so senior
   increments and net ordinary bills reconcile correctly.
2. Proposed ids: `bc-home-owner-grant`, `bc-low-income-grant-supplement`,
   `ontario-senior-homeowners-property-grant`, `ontario-energy-property-tax-credit-senior-overlap`,
   `mb-homeowners-school-tax-credit`, `mb-senior-school-tax-rebate`, `mb-renters-affordability-senior`,
   `qc-senior-municipal-tax-increase-grant`, `ns-senior-property-rebate`, `stjohns-senior-property-reduction`,
   `yukon-home-owners-grant`, `nwt-yellowknife-senior-property-relief`; collect NU rules before enabling
   `nunavut-senior-property-exemption`. If accepted, add `toronto-property-tax-increase-cancellation`,
   `halifax-low-income-property-exemption` and distinct housing-allowance ids. ON/MB replacement ids prevent
   applying old and new whole credits together. NT's match is inside one path, not another claimable benefit.
3. Existing files requiring changes: `src/data/schema.ts`, `src/engine/types.ts`, `credits.ts`,
   `household.ts`, `index.ts` exports and `history.ts` bill scaling; 2025/2026 provincial YAMLs for enabled
   programs; `src/ui/app.ts`, `index.html`, `notes.ts`, `defaults.ts`, `scenario-url.ts` plus bill/eligibility
   controls and saved-state migration. Check retirement/editor inputs for the new reference-year and
   federal-supplement distinctions. Add tax-source comments and `estimated: true` only for derived parameters,
   not for officially published amounts. Scope/coverage documentation will need orchestration approval outside
   this inventory's file ownership. Add the deferral exclusion to the property tooltip.
4. **Goldens:** none move in phase 1. Existing senior-credit fixtures use `useCredits: false` and no tenure;
   do not rewrite them for this feature. New senior paths get separate golden cases. Enabling ordinary BC/YT
   HOG for all owners necessarily changes **BC/YT owner cases in 2025/2026 main goldens** (up to $570/$450
   ordinary relief); report that as an independently justified correction, not a senior-only baseline refresh.
   MB's corrected school basis may move **low-school-tax MB owner cases**, including explicit-bill fixtures
   in `tests/golden/features/property-tax-bill.json`; high-school-tax capped cases stay fixed. Broader Halifax
   ordinary exemption would also move NS non-senior owners. Quantify only after approved implementation scope;
   preserve unrelated cells and all historical years. Do not claim exact changed-cell counts from an inventory.
5. Add independent correctness tests and separate goldens for every selected rule and material boundary:
   BC ordinary/senior replacement, $350/$100 floors, value thresholds/zero endpoints, low bill before taper,
   $30,000/$32,000 supplement steps and $25 minimum; ON 64-before-benefit/65, mixed-age spouses, renter vs
   owner, both income thresholds, explicit grant cutoffs and $600 overlap example; MB $100/$235 remaining
   school tax, $40,000/$63,500 taper and earlier zero on small balances, credited advance, eligible months/days
   and renter rounded coefficients; QC 65/15-year/income/carryover/co-owners; NS $1,600 cap boundary,
   60–64 Allowance and municipal-first ordering; St. John's Survivor Allowance distinction; Yukon $600/$3,000
   bill and 183/184 days; NT $1,200/$2,000/$3,000 bills and co-owners. NU cases wait for a sourced award rule.
   Every implemented path also needs gross, ordinary-grant-net and fully-net custom bills with identical final
   burden, explicit zero, unknown-basis handling, no grant on deferral alone, and home-only override checks.
   Add serialization/reload and tooltip e2e assertions at 375/430/desktop in light/dark. Recalculate combined
   marginal-rate/benefit effects independently where new income-tested relief changes existing total results.

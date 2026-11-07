# Seniors' property-tax relief inventory, 2025–2026

Research for **#22, phases 1 and 1b**, checked **2026-11-05**; original inventory base `7757e93`.
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
Phase 1b closes or bounds the original gaps in those appendices and the
[municipal](22-property-tax-relief/municipal-follow-up.md) and
[Manitoba](22-property-tax-relief/manitoba-follow-up.md) follow-ups. Each records its search attempts and limits.

All amounts are CAD. A representative recipient is a continuously resident qualifying owner aged 68 with
$35,000 income and a $3,000–$4,000 gross residential bill, unless a row specifies another profile.
These are sizing examples, **not population averages**. Means are labelled with their actual observation year.
At $35,000 income, $35 changes the effective tax rate by 0.1 percentage points. Maximums alone are not used
to claim that a typical recipient gets the maximum, and an unknown amount is never treated as zero.

**In** means retain for implementation; **out** gives a scope reason after sizing. **Unresolved/material**
means retain the candidate and collect the missing rule before claiming a complete calculation.
Nunavut's unresolved award paths remain explicitly **not modelled**, as the user decided.
Municipal rules are local, not province-wide.
No grant found means no grant identified in the cited government inventory/reference-city search, not proof
that every local authority has none. Repairs, home-care services and rent-geared-to-income housing are not
property-tax rebates; material adjacent housing transfers are separately identified below.

**Tax year, income year, bill year and benefit year are distinct.** BC/MB/YT/NT bill relief generally concerns
the current bill. Ontario's 2025 benefit uses 2024 income/occupancy costs; 2026 uses 2025, with OEPTC paid
July–June. NS's 2025 program refunds 2024 taxes; its 2026 program refunds 2025 taxes. Quebec's municipal
grant concerns the next municipal bill claimed through the preceding return; shelter allowance runs October–September.
The existing app largely combines tax-year taxes with annual benefit-year rates and current-income proxies.
The user selected **annual entitlement for the benefit year**, labelled as such. Use correctly dated
reference-year income/costs; if using a stationary-income or bill proxy, identify it as an estimate rather
than a second reporting convention. These entitlements are not actual calendar-year cash receipts.
2026 filing forms are not assumed final merely because a
2026 program amount or budget is published. Coverage proposed here is **2025–2026 only**, with historical
back-fill tracked.

## Scope decided by the user

The [decisions recorded on #22](https://github.com/yuorme/tax-visualizer/issues/22) are now implementation constraints:

1. Apply city-level relief **only to the default reference-city bill** and explain that limitation in the tooltip.
   A custom province-wide bill does not identify a city, so it receives no automatic Toronto, Halifax,
   St. John's or Yellowknife municipal relief. Provincial grants can still apply with their required inputs.
2. BC SAFER, Quebec Shelter Allowance and Manitoba Rent Assist move to
   [#216](https://github.com/yuorme/tax-visualizer/issues/216). The UI states that these housing allowances
   are not modelled. Their material size is retained in this inventory; they are not small-size exclusions.
3. Report annual **benefit-year entitlement**, not actual calendar-year cash.
4. Keep saved bills **gross**, their current meaning. Add an explicit net-bill choice and prevent credits
   already included in that bill from being applied twice.
5. Nunavut remains **not modelled** while its award rule is unresolved; never substitute $0 or NWT's cap.

These choices are removed from the open list. Phase 1b remains research only; implementation waits for #21 to merge.

## All-jurisdiction decision inventory

The detailed sections/appendices supply the income definitions, timing and evidence behind each row.

| Jurisdiction | Retained recurring relief and annual size | Out / no-program finding, after sizing |
|---|---|---|
| BC | HOG ordinary $570 / senior $845 in Vancouver: $275 age increment on a normal bill; rural $770/$1,045. Low-income restoration can be $845. Both years. | Deferral finances tax, $0 forgiven. Existing renter credit $400 has no senior increment; keep once. SAFER about $4,044 annualized is assigned to #216. |
| AB | No provincial senior property grant/renter-credit age increment identified for either year. | Senior tax-deferral loan: illustrative $4,000 financed, $0 forgiven. Calgary age-neutral tax-increase assistance: illustrative $200, out of senior scope. St. Albert's 2026 $200 senior grant is outside Calgary, not province-wide. |
| SK | No provincial senior property grant/renter-credit age increment identified for either year. | Provincial school-tax loan: illustrative $2,000 financed; Saskatoon municipal/library deferral: $3,000 financed; both $0 forgiven. |
| MB | Seniors school rebate up to $235 after other school relief; renter age-65 top-up max $328.57/$357.14 in 2025/2026, about $41.08/$44.63 at $35,000 family income. | Retired EPTC senior top-up and School Tax Credit for Homeowners: $0 entitlement from 2025, not extra live programs. Ordinary HATC $1,500/$1,600 and rent credit $575/$625 already present. Rent Assist is assigned to #216. |
| ON | OSHPTG up to $500 in both benefit years; senior OEPTC replaces ordinary schedule, max $1,461/$1,488. Toronto cancellation is included for default-city bills: first-time average-home examples about $268/$91.53; continuing awards include eligible prior cancellations. | Custom bills do not get automatic Toronto relief. Deferral saves $0 tax. OSTC senior increment $34.60/$38.56 belongs to #21/OTB coordination. |
| QC | Municipal-tax-increase grant: implied 2023 mean about $145; new-roll increment up to $500 **plus carryover**. 2025/2026 income caps $62,900/$64,200; co-owners share one property entitlement. | Shelter allowance, age 50: $1,200–$2,040 yearly, assigned to #216. Existing solidarity housing component remains once; no separate senior housing increment identified. |
| NB | No provincial senior property grant/renter-credit age increment identified for either year; no Moncton senior grant found. | Tax-increase deferral: official example $100 financed, $0 forgiven. General senior cash benefit $616/$629 belongs to #21. |
| NS | Provincial rebate 50%, max $800, both program years. Halifax default-city exemption included; 2026 GIS exception to assessment cap and 2026/27 income/max table verified. | Halifax financing of residual tax: illustrative $630 deferred, $0 extra forgiveness. New 2026/27 table minimum-payment row conflicts with AO10; exact low-bill awards remain qualified. |
| PE | No provincial senior grant/renter-credit age increment identified for either year; no Charlottetown senior grant found. | Senior deferral: historical published mean $1,729 financed, $0 forgiven. Ordinary resident credit already embedded in reference rate; do not subtract again. |
| NL | St. John's senior reduction 25% in both years: $682.50 on illustrative $2,730 levy. Retain local path. | No province-wide senior property grant/renter-credit age increment identified; general Seniors' Benefit belongs to #21, not a property grant. |
| YT | HOG ordinary $450 / senior $500 on $3,000 tax; age increment $50, or $150 on $600 tax. Both years established by Act; senior 75% overrides ordinary low-bill floor. Survivor/residence rules verified. | Tax deferral: illustrative $2,500 after grant financed, $0 forgiven. No separate renter-credit age increment identified. |
| NT | Yellowknife combined municipal/territorial relief up to $2,000 on default reference-city bills, independently dated in both years; $2,000 on $3,000 tax. | No automatic Yellowknife award on custom province bills. No separate renter-credit age increment/deferral identified. Other local/general-area awards are not inferred from province identity. |
| NU | Territorial general-area and separate Iqaluit senior relief exist. Award amount remains unresolved/material after bounded follow-up; both paths are **not modelled**. | 100% of $3,000 is exposure only, not a verified award. No separate renter-credit age increment/deferral identified. Do not ship $0 or import NT's cap. |

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

**Toronto municipal cancellation: in, only for default reference-city bills.**
[2025](22-property-tax-relief/sources/on-toronto-2025.txt) and
[2026 budget](22-property-tax-relief/sources/on-toronto-2026.txt) permit cancellation of the qualifying
annual increase with household income at most $60,000/$62,000 and assessment at most $975,000.
Applicant is 65+, or meets the specified 60–64 OAS Allowance/disability route; ownership/occupancy
and good-standing requirements apply. The [phase 1b municipal follow-up](22-property-tax-relief/municipal-follow-up.md)
closes the income-document years: 2025 relief uses 2024 NOAs; 2026 uses 2025 NOAs for all resident owners
and their spouses. Income is combined gross income, not AFNI. Line 15000 has historical official form
support; contemporary forms omit the number, so its continuation is an explicit interpretation.

Code 767 defines gross prior/current levies before relief, excludes construction/improvement-driven
increases, and cancels eligible new increases **plus previously cancelled increments still payable**,
with a $10 minimum and continuity conditions. Provincial education tax is not categorically excluded;
City Building Fund is part of the levy. Utility charges and interest are not annual levy taxes.
The official Code URL serves a 2023 consolidation; later forms/budget confirm operation and supersede
old thresholds, but a final 2025/2026 structural consolidation was not found. Preserve that qualification.
The budgets' average-home first-time examples are about $268/$91.53; with an approved $268 carryover,
a 2026 continuing claimant can instead have $359.53. These examples are not flat province-wide grants.
The parallel deferral forgives $0. A custom province bill receives no automatic Toronto cancellation;
any cancellation already in its net amount remains part of bill accounting, never a second deduction.

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
a $47.91 monthly ordinary floor rather than exact $575/12. Phase 1b checks the
[statute's annual formulas](22-property-tax-relief/sources/gap-mb-statute-2025.txt): use the annual amount
times eligible months/12, retaining the ordinary $575/$625 baselines. There is no statutory instruction
to turn $575 into `12 × $47.91` or round the monthly intermediate first. Final CRA filing-line rounding
remains unverified; the current form index lists 2025 and the expected 2026 PDF returns HTTP 404.
The [Manitoba follow-up](22-property-tax-relief/manitoba-follow-up.md) records the searches, competing
cent outcomes and independent annual cases. Do not invent tolerances or an income-$40,000 cliff.

**School-tax input/reference source: closed for planning.** Custom bills need the actual gross eligible
school amount and HATC already credited; missing school tax is unknown, not the whole property bill.
Winnipeg's own typical-home publications use **Winnipeg School Division No. 1**. The collected city tables
give residential portion 45%, school mills 14.630 in 2025 / 15.994 in 2026, and zero residential provincial
ESL. Thus sourced reference school rates on full assessed value are 0.0065835 / 0.0071973. Use a named
reference estimate for default-city bills only, never a city school share on a custom province bill.
At $200,000 assessed value, school taxes are $1,316.70/$1,439.46, fully covered by HATC, leaving no
senior rebate. The follow-up gives the full source/rate table, default estimate assumptions and net-bill cases.

**Out as obsolete:** the senior EPTC top-up and School Tax Credit for Homeowners were removed effective
2025; they are not additional current-year benefits. The 2027 $1,700 HATC and assessed-value taper must
not enter 2026. Ordinary current credits are already in the engine and must be replaced/extended, not duplicated.

## Other jurisdictions and material adjacent programs

The [Atlantic appendix](22-property-tax-relief/atlantic.md) records the complete NB/NS/PE/NL eligibility
and timing. Retain **NS's 50%, $800** rebate after municipal exemptions, with GIS eligibility age 65+
or Allowance eligibility age 60–64 in the program year. Use the named federal-benefit eligibility basis,
not a generic line-23600 threshold or a universal age-65 gate. Official example: $971.77 eligible paid
tax gives $485.89. A $1,830 prior-year bill gives $800; if municipal relief leaves $630, it gives $315.
Halifax's tables give $1,200–$1,400 before income scaling/minimum-payable limits. Phase 1b found the
2026/27 guide: income bands end at $39,000/$44,000/$49,000/$54,000/$59,000, with the same
100/80/60/40/20% shares. Its printed minimum-payment row conflicts with AO10's formula; exact low-bill
awards remain qualified. From April 1, 2026, GIS recipients escape its new $425,000 taxable
assessment cap. Halifax household income includes other adults and enumerated exclusions; it is not AFNI.
Municipal and provincial benefit years must not be collapsed: at $35,000 income and $1,830 gross
2025 tax, Halifax 2025/26 relief is $960, leaving $870, so the **2026 provincial rebate is $435**.
The **2026/27 Halifax entitlement** on an otherwise identical bill is $1,200; subtracting it from the
2025 bill would incorrectly make the 2026 provincial rebate $315. This example assumes federal eligibility
and an unchanged profile and holds each bill/benefit year explicit. Both municipal paths below apply only
to default reference-city bills; custom net bills retain any actual municipal relief already reflected.
**St. John's 25%** applies in 2025/2026 to qualifying resident senior owners with GIS, or age 60–64
Allowance for Survivor recipients. Ordinary Allowance is not interchangeable with Survivor Allowance.
Its $2,730 tax example saves $682.50; water charges are separate and not shown eligible for that percentage.

The [AB/SK/QC appendix](22-property-tax-relief/west-qc.md) distinguishes **QC's municipal-increase grant**
from a second supposed Montreal grant: they are the same program. At December 31 before the bill year,
claimant is 65+, has 15 consecutive ownership years under the specified spouse rules, and meets the
$62,900/$64,200 combined Quebec **line-275** limits. The one-unit residential principal home must have
an eligible municipal bill. Use municipality-issued potential grant and previous-roll carryover, not total
tax times a guessed percentage. New-roll increment is capped at $500 plus prior-roll amounts; the 2023
rounded estimated cost $1.9 million divided by 13,077 recipients implies about $145.29.
**Assessment/co-owner gaps closed:** final claim forms for both years and Gazette enactments establish
`D = round4(F/G + 0.075)`, adding **7.5 percentage points** to average dwelling-value growth.
Without assessment averaging, the municipality calculates `min(500, A × max(0, B − C × D))`, adds
the preceding roll's final-year awarded grant, then rounds the whole-property amount to whole dollars.
The [QC appendix](22-property-tax-relief/west-qc.md) defines every variable, rate/rounding rule and source.
Montreal's 18.41% threshold is consistent with a 10.91% average increase, not multiplication by 1.075.

The engine should consume the municipality's **year-specific potential amount**, avoiding a new roll-averaging
calculator. Each co-owner files separately and subtracts others' claims from the whole-property entitlement;
allocation can be agreed and is not necessarily ownership-percentage based. Example: current potential
$500 plus $120 preceding-roll awards gives $620, allocable $300/$320, never $620 each. The prior-roll
final year is fixed while the current roll runs; it is not always the immediately preceding year. The grant
is provincial and can apply to a custom bill when actual property/claim inputs establish eligibility.

The [territorial appendix](22-property-tax-relief/territories.md) gives owner/residence/co-owner rules.
**Yukon HOG** uses 50%/$450 ordinary versus 75%/$500 senior, age 65 in the calendar year, no income
test; ordinary relief is absent from the engine too. **Yukon gaps closed by the Act/history:** the same
statutory amounts apply in 2025/2026; the senior 75% calculation expressly overrides the ordinary low-bill
floor. At $150 tax, ordinary grant is $50 and senior grant $112.50; at $100, $0/$75. Residence may be
from January 1 through application **or** 184 days. A qualifying survivor whose deceased spouse received
the senior grant and who has not remarried uses the senior rule; a widowed flag alone is insufficient.
Taxes must be paid or covered by an eligible non-defaulted senior tax-deferral agreement. The territorial
grant can apply to custom bills with its required inputs. **Yellowknife** is
`2 × min(0.5 × eligibleTax, $1,000)`, combining city exemption and territory's
equal payment, verified for both years. Age 65 during the tax period, residence and eligible co-owners apply;
prior NOAs establish dependency in some ownership cases, not a general AFNI taper. $1,200 eligible tax
gets $1,200 relief; $3,000 gets $2,000. **NU** has a general-area route excluding Iqaluit and a separate
Iqaluit application. No universal percentage/cap or recipient mean was established: $3,000 potential full
exemption is a size exposure only. Both NU award paths stay **not modelled**. The bounded follow-up
checked the Act, GN policy and Iqaluit bylaw/application sources; none establishes the current award.
Iqaluit's 2025 100%/$300,000-cap exemption is for eligible organizations and explicitly excludes residences.

The following housing transfers are **out of #22 by the user's decision**, assigned to
[#216](https://github.com/yuorme/tax-visualizer/issues/216). They remain material; the UI must state that
they are **not modelled**. Their uncollected details no longer block #22:

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

Accounting contract under the decided gross/net bill policy:

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

## Phase 1b gap disposition

Scope choices are settled above. No housing or calendar-cash collection is needed for #22. Evidence work
was bounded to government search, linked publications and operative law/forms; the linked follow-ups record
the queries/URLs, rejected documents and exact retrieval failures rather than treating missing evidence as zero.

| Original gap | Phase 1b result | Remaining limit |
|---|---|---|
| NU Iqaluit award and general-area policy | Rechecked municipal application/bylaw, GN policy/Act and 2025 process notice. The organization exemption cannot be reused for residences. | Neither current award amount established. Both paths stay **not modelled**. See territorial search log. |
| Yukon 2025, low-bill and survivor rules | Closed by Act/history plus dated 2025 application notice. Senior overrides ordinary floor; survivor and alternative residence routes verified. | Raw Act/history downloads denied, so caches are explicit web-reader evidence, not invented original hashes. |
| Halifax 2026/27 table | Closed: current guide/application and visual table establish bands, maximums and income documents. | Published minimum-payment row conflicts with AO10's midpoint formula. Legal formula has precedence; exact administrative low-bill awards need reconciliation. |
| QC assessment and co-owner claim | Closed for the proposed published-potential input: both forms, 2017 enactment and 2021 cap amendment establish calculation, rounding, carryover and shared claims. | A new municipal assessment-averaging calculator is unnecessary and is not proposed. |
| Toronto income year and eligible levy | Closed/qualified: 2024/2025 NOAs, resident-owner/spouse gross income, construction exclusions, prior cancellation history, $10 minimum, education/City Building treatment. | Contemporary forms omit income line number; line 15000 is a supported continuation interpretation. Code URL serves 2023; final 2025/2026 structural consolidation not retrieved. |
| MB final rounding | Statutory annual amounts, eligible-month fraction and cent-level coefficient endpoints established; ordinary $575/$625 remain correct annual-model baselines. | CRA paper monthly floor conflicts with annual law; final filing-line rounding unverified, 2026 form unavailable. Do not claim return-level cent precision. |
| MB school-tax input/reference source | Closed for planning: separate gross school/advance inputs; named Winnipeg School Division No. 1 rate/portion sources for both years and independent examples. | Default assessed-value/division proxy must be labelled estimated. Custom bills need actual school amount; missing is incomplete, not zero. |

The remaining evidence limitations are NU award rules, Halifax's minimum-payment inconsistency,
Toronto's current administrative/consolidation qualifications and Manitoba's final filing-rounding practice.
They are not new requests to decide the already-approved scope. No implementation is authorized in this phase.

## Validation

Only this note and its issue-local evidence folder changed. `check-scope.mjs origin/main HEAD` reports
`docs_only=false` because cached sources are `.txt`, so the full validation path was used. Under Node 26,
`npm ci`, `npm run format` (no fixes) and `npm run check` passed: 3,567 tests, build and browser smoke
coverage of 54 pages, 344 states and 54 contrast scans at desktop/430/375 in light/dark. The first sandboxed
run reached Chromium startup but failed with `bootstrap_check_in ... Permission denied (1100)`; the
escalated full rerun passed. The scope command, `node scripts/check-docs.mjs` and `git diff --cached --check`
were also run on the final staged documents. No production or golden file changed.

Phase 1b repeated `npm ci`, formatting (no fixes) and the full check under Node 26. All 3,567 tests,
build and smoke checks passed again: 54 pages, 344 states and 54 contrast scans. The full check used
the approved escalation for Chromium startup. Scope and Markdown checks are rerun on the final staged
note/evidence updates; the file-ownership check confirms `src/`, `data/` and `tests/` remain untouched.

## Short implementation plan

1. Add a pure `src/engine/property-relief.ts` evaluator, with data-driven year-specific amounts and a
   household relief result carrying gross levy, eligible components, amounts already applied and remaining
   relief and explicit incomplete/not-modelled status. Integrate once in `household.ts` **after #21 merges**,
   reconciling its net-income/OTB changes. Follow `useCredits` consistently;
   document whether the switch disables all new grants as it does existing property credits. Never test calendar
   years in a formula to change rule shape; use a new `program` id. Include ordinary BC/YT schedules in the same
   program as the senior amounts, so net ordinary bills reconcile correctly (one bill line, one id; see Slice 1). One
   exception: BC's cheque-paid low-income supplement is never on a bill (see Slice 2).
   Gate city-only programs on the default reference-city
   bill; custom province bills do not receive automatic municipal relief. Keep actually reported municipal
   relief already embedded in a net bill in its ledger without treating it as a newly modelled award.
2. Proposed ids: `bc-home-owner-grant` (ordinary and senior amounts together, as Slice 1 requires),
   `bc-low-income-grant-supplement` (never on a bill, so its own id; see Slice 2),
   `ontario-senior-homeowners-property-grant`, `ontario-energy-property-tax-credit-senior-overlap`,
   `mb-homeowners-school-tax-credit`, `mb-senior-school-tax-rebate`, `mb-renters-affordability-senior`,
   `qc-senior-municipal-tax-increase-grant`, `ns-senior-property-rebate`, `stjohns-senior-property-reduction`,
   `yukon-home-owners-grant`, `nwt-yellowknife-senior-property-relief`,
   `toronto-property-tax-increase-cancellation` and `halifax-low-income-property-exemption`.
   NU remains not modelled pending a sourced award rule; no zero-value placeholder program. Housing allowance
   ids/implementation belong to #216. ON/MB replacement ids prevent applying old and new whole credits together.
   NT's match is inside one path. QC consumes year-specific municipal potential/carryover and reconciles co-owner
   allocations; it does not implement the municipality's roll-averaging system. Toronto needs eligible current/prior
   levy and approved cancellation history, or an explicit first-time-claimant estimate; no flat average-home grant.
3. Existing files requiring changes: `src/data/schema.ts`, `src/engine/types.ts`, `credits.ts`,
   `household.ts`, `index.ts` exports and `history.ts` bill scaling; 2025/2026 provincial YAMLs for enabled
   programs; `src/ui/app.ts`, `index.html`, `notes.ts`, `defaults.ts`, `scenario-url.ts` plus bill/eligibility
   controls and saved-state migration. Missing bill-basis metadata on old saves means **gross**; add an explicit
   net choice plus credited relief amounts and MB gross school tax/advance inputs. Use a named sourced default
   school component, with estimates identified, and keep custom bills without a school amount incomplete.
   Check retirement/editor inputs for the new reference-year and
   federal-supplement distinctions. Add tax-source comments and `estimated: true` only for derived parameters,
   not for officially published amounts. Scope/coverage documentation will need orchestration approval outside
   this inventory's file ownership. Tooltips must explain city relief's default-bill limit, annual benefit-year
   entitlement and prior-year bases, excluded deferrals and housing allowances not modelled under #216.
4. **Goldens:** none move in phase 1. Existing senior-credit fixtures use `useCredits: false` and no tenure;
   do not rewrite them for this feature. New senior paths get separate golden cases. Enabling ordinary BC/YT
   HOG for all owners necessarily changes **BC/YT owner cases in 2025/2026 main goldens** (up to $570/$450
   ordinary relief); report that as an independently justified correction, not a senior-only baseline refresh.
   MB's corrected school basis may move **low-school-tax MB owner cases**, including explicit-bill fixtures
   in `tests/golden/features/property-tax-bill.json`; high-school-tax capped cases stay fixed. Broader Halifax
   ordinary exemption also affects default-city NS non-senior owners; custom bills do not get that new award.
   Toronto, St. John's and Yellowknife senior-only paths change eligible default-city cases; absent age or
   disability fields must not invent an eligibility election. Quantify after implementation;
   preserve unrelated cells and all historical years. Do not claim exact changed-cell counts from an inventory.
5. Add independent correctness tests and separate goldens for every selected rule and material boundary:
   BC ordinary/senior replacement, $350/$100 floors, value thresholds/zero endpoints, low bill before taper,
   $30,000/$32,000 supplement steps and $25 minimum; ON 64-before-benefit/65, mixed-age spouses, renter vs
   owner, both income thresholds, explicit grant cutoffs and $600 overlap example; MB $100/$235 remaining
   school tax, $40,000/$63,500 taper and earlier zero on small balances, credited advance, eligible months/days
   and renter annual/month coefficients; QC 65/15-year/income, $500-plus-carryover cap, $300/$320 co-owner
   allocation and fixed preceding-roll year; NS $1,600 cap boundary, 60–64 Allowance and **bill-year-correct**
   municipal-first ordering; Halifax 2025/26 vs 2026/27 bands, $425,000/GIS exception and both competing
   low-bill readings until reconciled; Toronto $10 minimum, construction exclusion, $268+$91.53 carryforward,
   ownership/income membership and contemporary-form qualifications; St. John's Survivor Allowance distinction;
   Yukon $100/$150/$600/$3,000 bills, ordinary vs senior floor, Jan-1/application or 184-day residence and
   survivor-grant/remarriage conditions; NT $1,200/$2,000/$3,000 bills and co-owners. NU gets explicit
   not-modelled status checks, not invented dollar expectations.
   Every implemented path also needs gross, ordinary-grant-net and fully-net custom bills with identical final
   burden for **provincial** grants; municipal programs instead need separate tests proving custom bills receive
   no automatic city award. Test explicit zero, unknown-basis handling, no grant on deferral alone, home-only
   overrides, annual benefit labels, housing exclusions and old-save gross defaults.
   Add serialization/reload and tooltip e2e assertions at 375/430/desktop in light/dark. Recalculate combined
   marginal-rate/benefit effects independently where new income-tested relief changes existing total results.

## Slice 1 (#222): shared engine shape, built

The first implementation slice adds the layer every regional slice uses, with **no province's program switched on**:
no YAML in `data/years/` changes and no golden moves. Regional slices (#223–#226) and the page (#227) follow.
Coverage when programs arrive is **2026 only**, by a later user decision that narrows the 2025–2026 scope above.
Real programs will exist only in `data/years/2026/`; a year with no `propertyRelief` entries evaluates to no relief and
its results are unchanged, with no year check in the engine. The 2025 research above stays for a History back-fill.

**What exists.** `src/engine/property-relief.ts` holds a pure evaluator, `propertyReliefOf(rules, input)`. It returns
the gross levy, one line per program (eligible components, entitlement, amount already applied, remaining relief,
status) and the total credited. `household.ts` computes the gross levy before the existing credits, calls the
evaluator once after them and appends each line's remaining relief to `credits`. `Province.propertyRelief` is a new
optional list in `schema.ts`; today its only member is `property-relief-not-modelled`, which is how Nunavut will be
declared (reason text, never a $0 program).

**Accounting.** Every program is evaluated on the gross levy, then only the relief the bill does not already reflect
is credited:

```text
gross levy       = bill entered + relief the bill reflects (net bills only)
remaining relief = max(0, entitlement on the gross levy − amount the bill reflects), per program
final burden     = bill entered − remaining relief = gross levy − entitlement
```

For a $4,000 gross bill with one home owner grant ($570 ordinary, $845 for a senior), a gross bill, a $3,430
bill net of the ordinary part and a $3,155 fully-net bill all end at a $3,155 burden. An amount reflected beyond
the entitlement is the household's own bill: remaining relief floors at zero and nothing is clawed back.

**One bill line, one id.** The floor is per program id, so a grant whose parts are separate ids leaks: with an
ordinary id and a senior-increment id on a $3,155 bill, stating $845 against the ordinary id and $0 against the
senior id credits the $275 increment again and ends at $2,880. A grant with ordinary and senior
amounts is therefore one program whose handler computes the total (BC: `bc-home-owner-grant`, the senior total
replacing the ordinary amount), and only separate bill lines (a grant and a municipal rebate) are separate ids. The
one exception is an amount that is never on a bill (BC's cheque-paid supplement, see Slice 2).
The household states one amount per line, and the page (#227) asks for one per line.

**Existing credits read the gross levy.** Ontario's property credit and Manitoba's homeowner credit are computed from
the property bill, so `household.ts` hands them the gross levy, not the bill entered, whenever a province has relief
rules. One levy then gives one total however it was entered (tested for all 13 provinces, with bills either side of
Manitoba's cap and one a grant fully covers). When a net bill's amounts are incomplete the gross levy is unknown and
they read the bill entered, as before; the relief lines are `incomplete` and credit nothing.

**Inputs (all optional, by province code).** `propertyBillBasis` is `"gross"` or `"net"`; missing means gross, so old
saves and the documented #11 meaning are unchanged. `propertyReliefApplied` holds the amount each program id is
already reflected in a net bill. On a net bill every program that will run needs its amount, zero stated explicitly;
an omitted amount makes the gross levy, and so every entitlement, unknown, and those lines report `incomplete` with
null amounts. A basis is honoured only for a supplied bill (an estimate has nothing to be net of), and reflected
amounts are ignored on a gross bill. The default reference-city gate is derived, not stored: a bill is the city's
own only when no bill is supplied and no rate override is set for that province. `scaleHousehold` scales the
reflected amounts with the bill.

**Statuses never report $0.** `modelled` (a true zero is possible), `incomplete` (input missing),
`not-modelled` (declared, with its reason) and `city-bill-required` (a `municipal` program on a bill that is not the
reference city's, where no automatic award applies). The last three carry null entitlement and remaining relief and
add nothing to credits. `complete` is false while any line is incomplete or not modelled; `credited` is then a lower
bound, and null (like `applied`) while the gross levy is unknown. Relief that a custom net bill already reflects (for
example a municipal cancellation) still grosses the levy up when the household states it, but is not treated as an
award the model computed.

**The credits switch.** Property relief follows `useCredits` exactly as the Ontario, Manitoba, BC and Quebec property
and housing credits do: with the switch off, nothing is evaluated, nothing is credited and
`breakdown.propertyRelief` is absent. It is a credit entry, so an income-tested program shows in the marginal rates
like the other credits.

**Extension point for a regional slice.** Add `reliefProgram("<id>", params)` to the union in `schema.ts`, its entry
under `propertyRelief` in the province YAML (with `scope: municipal` for city programs, which gates it with no handler
code) and one handler in `BUILT_IN` in `property-relief.ts`. The handler gets the household facts, the bill facts
(entered amount, supplied or estimated, default city), the gross levy, the existing credits already counted by program
id (for an Ontario overlap or a replacement of a whole credit) and the lines before it (data order, for a
municipal-first sequence), and returns an entitlement or an `incomplete` reason. TypeScript requires a handler for
each schema id. Component inputs the Manitoba slice needs (school tax, advance) and household inputs for ages or
prior-year amounts are added by the slice that needs them.

**Tests.** `tests/property-relief.test.ts` uses fixture programs defined in the file and registered through
`withPropertyReliefHandler`, so nothing fixture-shaped ships in data. Rule paths map to tests as follows.

| Rule path | Test |
| --- | --- |
| Gross, ordinary-part-net and fully-net bills reach one burden | evaluator and household-total tests |
| One bill line, one id; unrelated relief still due | one-bill-line test |
| Entitlement on the gross levy, not the entered bill | levy-share test |
| Existing credits (Ontario, Manitoba, all 13 provinces) read the gross levy | existing-credits parity test |
| No double counting, and an old net bill without a basis | wrong-reading test (a net bill read as gross gains $845) |
| Missing reflected amount, invalid amounts | incomplete test, bill-facts test |
| Explicit zero reflected amount, zero bill, zero home value with a bill | the three explicit-zero tests |
| Reference-city gate, bill and rate override | city tests (the handler is never called when gated) |
| Not-modelled status | not-modelled test, schema test |
| Context a handler receives, negative and cents handling | context-spy and rounding tests |
| Credits switch, no program, history scaling | switch, unchanged-provinces and scaling tests |

No golden is added: with no real program there is no result to lock. The existing 2019–2026 goldens and
`tests/golden/features/` are untouched and pass unchanged. Regional slices add their own golden cases.

## Slice 2 (#223): BC and Manitoba, built

Coverage is **2026 only**. Programs are in `data/years/2026/provinces/BC.yaml` and `MB.yaml` under `propertyRelief`;
2025 has none, so its results and goldens are unchanged, and no engine code tests a year. Alberta and Saskatchewan:
no provincial seniors' property grant or renter-credit age increment was identified for either year (inventory
above), so they get no entry, no placeholder and no test beyond "declares none". Deferral and loan programs there
and in BC and Manitoba stay out: they finance tax and forgive $0.

**New input.** `Household.propertyReliefFacts[code]` holds what a bill alone does not say: `bcNorthernRural` (BC's
higher Schedule 3 and 4 amounts; omitted means the reference city's region, Metro Vancouver) and `schoolTax`
(Manitoba, below). `scaleHousehold` scales `schoolTax` with the bill. Ages come from `Person.age`; a missing age
is never 65, so no senior schedule is invented. Handlers also see `basis` and the program's own `reflected` amount.

**BC, `bc-home-owner-grant`.** One id, as Slice 1 requires: the schedule is `min(full grant, max(0, tax − minimum
remaining))` for the ordinary (570 / 350) or senior (845 / 100) column, northern and rural 770 / 1,045; any household
member aged 65 selects the senior column, replacing the ordinary amount. The assessed-value reduction then takes
`5 × (value − 2,075,000) / 1,000` off the schedule amount (a rate, so no rounding up to whole thousands), never below
zero: $600 tax, senior, $20,000 over the threshold is `500 − 100 = 400`, not `min(845 − 100, 500)`. The entered
home value stands in for the assessed value, so the line is `estimated`; a bill with no home value has no assessed
value and the line is `incomplete`, never $0 or an unreduced grant. A renter has no grant.

**BC, `bc-low-income-grant-supplement`.** A separate id because it is a separate payment: it is applied for with the
Province on FIN 65 and paid by cheque, never on the tax notice, so a net bill reflects $0 of it. It restores only the
actual reduction of a **senior-schedule** grant (Act s.2(8) names Schedules 2 and 4; an under-65 owner's ordinary
reduction is not restored): in full when adjusted income is at most $30,000, in half up to $32,000, nothing above,
and nothing when the amount is under $25 (regulation ss.16–18). Adjusted income is each person's federal net income
floored at zero, summed, less $3,000 for a partner, $3,000 per person aged 65, and $3,000 per child (s.11(2)–(3)).
**Previous-year income is a proxy:** the law uses the previous year's net income and the app has only this year's, so
current income stands in, the approach the user approved on #21; the line is `estimated`. Not modelled: the
half-of-child-care reduction of the child amount, the disability deduction and the UCCB adjustment (each would lower
adjusted income, so omitting them can only withhold a supplement). It reads the grant line before it for the
reduction, so the grant must come first in the data; an unknown reduction makes it `incomplete`. This is the one
exception to "one bill line, one id", and two guards keep the two floors from adding up to more than the schedule:
a non-zero amount stated under the supplement id makes both it and the grant `incomplete` (the notice cannot reflect
it), and the supplement is reduced by any grant the bill reflects beyond the model's entitlement. Senior, home
$2,155,000, income $20,000, levy
$4,000: gross gives grant 445 plus supplement 400; a $3,155 net bill stating 845 as the grant leaves the supplement
`400 − (845 − 445) = 0`, burden 3,155, not 2,755. Net bills must state 0 for the supplement.

**Manitoba.** The old `mb-affordability-credits` whole credit is replaced for 2026, not added to:
`creditsOf` skips that entry whenever the province declares `mb-homeowners-school-tax-credit`, and the three programs
below take over under the same display names ("Homeowners affordability tax credit", "Renters affordability tax
credit"), so each household still has one line. The entry stays in the YAML only for the page's prose until #227.

- `mb-homeowners-school-tax-credit`: `min(1,600, gross eligible school tax)`, capped by school tax, not the whole bill.
  The household states `schoolTax`; on a net bill that figure is net of the advance and the bill's stated amount for
  this id (the advance) restores the gross (`levy 3,400 + 1,600 = 5,000`, `school 100 + 1,600 = 1,700`). Only the
  default-city bill has an estimate: `homeValue × 0.45 × 15.994 / 1,000`, Winnipeg School Division No. 1, capped by
  the gross levy and `estimated`. A supplied bill or a rate override with no `schoolTax` is `incomplete`; a school tax
  above the whole bill is `incomplete`. An explicit zero is a real zero.
- Interim, removed by #227: the page has no school-tax input, so for a bill or rate override it sets the fact
  `creditOnWholeBill`, and the homeowners credit is then `min(1,600, levy)`, as before the school-tax programs. A stated
  `schoolTax` still wins, and no school tax is reported, so the rebate stays `incomplete` (the page showed none).
  The engine default without the fact stays `incomplete`, so `mb-custom-bill-*` keep their expectations.
- `mb-senior-school-tax-rebate`: owner with anyone aged 65, `max(0, min(235, school tax − all homeowners credit) −
  1% × (family income − 40,000))`, family income being each person's net income floored at zero, summed. It reads
  the credit line before it. The credit is never skipped to enlarge the rebate.
- `mb-renters-affordability-senior`: a renter's `min(rent, 625)`; with anyone aged 65 it is `min(rent, 982.14 −
  min(357.14, 0.008929 × family income))`, the reduction starting at zero income and never leaving less than the
  ordinary amount. A full year of rent is assumed (eligible months are not an input).

**Goldens.** The 2026 main goldens move in **35 BC cells** (every BC owner with the credits switch on; five owners
have it off) and `other-income-original.json` in **one** (2026, scenario 151, BC). Every one is a BC owner gaining
the ordinary grant, `min(570, max(0, bill − 350))`: 570 where the bill is at least 920, and 550 for the $300,000
homes, whose bill is $900. No scenario has an age, so the senior schedule, the value reduction (no home is worth over
$2,075,000) and the supplement do not enter. Independent check (a script with no engine code, reading only scenario
inputs and the schedule): for each of the 35 cells `refund` and `benefits` rise by the grant, `total` and `netTotal`
fall by it, one credit `["B.C. home owner grant", grant]` is appended, `avg` follows from the new total, and the
marginal rates, people and claim are unchanged; every other cell is identical. No Manitoba main-golden cell moves: the
scenario owners (lowest home value $300,000) have school tax above $1,600 and none has a rate override, and every
renter pays at least $800 a month, so the rent cap never binds. The four Manitoba explicit-bill cases in
`tests/golden/features/property-tax-bill.json` gained a `schoolTax` equal to their bill, which was the old rule's
implicit assumption, so their expected credits (800, 1,600, 1,600, 0) are untouched; without it the credit is
unknown, not $0 or the bill. The browser smoke test compares the page with the frozen legacy page; its one BC
owner step (home $750,000, income $143,000) now expects the ordinary grant: tax $2,250, grant `min(570, 2,250 − 350)`,
net tax `30,191 − 570 = 29,621` (20.7%, Quebec 8.7 points higher), with every obsolete value guarded in
`tests/e2e/smoke.mjs`.
All 2019–2025 goldens and the other `tests/golden/features/` files are unchanged.

New hand-calculated cases are in `tests/golden/features/property-relief-west.json`, run by
`tests/property-relief-west.test.ts`:

| Rule path | Cases |
| --- | --- |
| BC schedules, senior replaces ordinary, $350 / $100 floors, 920 / 945 full-grant bills, age 64 / 65 | `bc-ordinary-*`, `bc-senior-*`, `bc-age-*`, `bc-couple-one-senior` |
| BC northern and rural amounts, reference-city region | `bc-rural-*`, `bc-default-city-*` |
| BC value reduction before / after the schedule, threshold, zero endpoints, no assessed value | `bc-senior-600-excess-20k`, `bc-*-value-*`, `bc-no-assessed-value-*` |
| BC supplement limits 30,000 / 32,000, $25 minimum, only the actual reduction, no ordinary restoration | `bc-supplement-*` |
| BC supplement deductions: partner, each 65+, child; per-person floor at zero | `bc-supplement-couple-*`, `-child-*`, floor test |
| BC gross, net-of-ordinary and fully net bills; supplement never on the bill | `bc-net-*`, `bc-fully-net-bill` |
| MB school-tax basis, estimate, cap at 1,600, explicit zero, school above bill, no school tax | `mb-default-*`, `mb-hatc-*`, `mb-custom-bill-*` |
| MB rebate: remaining after credit, 40,000 / 63,500, 64 / 65, spouse, family income | `mb-rebate-*`, `mb-custom-school-*` |
| MB net bill restores advance and school tax, one burden | `mb-net-bill-*`, `mb-gross-bill-same-burden` |
| MB renter: ordinary, rent cap, senior from zero income, 40,000 cap, 64 / 65 | `mb-renter-*`, `mb-owner-with-rent-*` |
| BC grant over-reflected on a net bill: supplement reduced; stated supplement amount rejected | `bc-net-grant-overstated-*`, `bc-net-supplement-amount-*` |
| MB interim whole-bill credit for a bill or override (until #227); stated school tax wins | `mb-interim-*`, smoke step in `tests/e2e/smoke.mjs` |
| MB per-person income floors; second spouse senior; senior renter has no rebate; owner ignores rent | floor test, `mb-renter-couple-second-*`, `mb-senior-renter-*` |
| Old credit not repeated; switch; 2025 and AB / SK declare none; history scaling | the tests after the cases |

## Slice 3 (#227): page for BC and Manitoba, built

Scope is BC and Manitoba, 2026 only; #224, #225 and #226 add their own rows and tooltips. The page keeps the layout
simple, ahead of a larger UI refactor.

**Controls.** In the Property tax panel, a "Property-tax relief" block shows for a home province that has relief in any
year of data. It holds a gross or net choice (shown when a bill is entered), a BC region choice, a Manitoba school-tax
input, and one amount per bill line for a net bill: the BC home owner grant and Manitoba's credit advance. Programs a
bill never reflects (the BC supplement, the senior rebate, the renter credit) are sent as an explicit 0. A bill line
left blank is not sent, so its relief shows as Incomplete rather than $0. Controls follow the year's data: 2025 has no
programs, so only the year notice remains.

**Interim fact removed.** `creditOnWholeBill` is gone from the engine, types, tests and the page. A Manitoba bill or
rate override with no school tax is Incomplete, as the engine already reported. Six cases in
`tests/golden/features/property-relief-west.json` carried the fact: the three that asserted the whole-bill credit
(`mb-interim-whole-bill-below-cap`, `-above-cap`, `mb-interim-rate-override`) now expect `incomplete`, and the two
that only added the fact to a stated school tax or a default-city bill lose the fact with their expectations unchanged.
No other golden moves. The 2026 `mb-affordability-credits` YAML entry is removed: `notes.ts` now describes the
Manitoba programs from `propertyRelief` for a year that declares them. Tests that read that entry now use the relief
line by name, or the 2025 entry where they need a whole-bill credit.

**Saved state.** `propertyBillBasis`, `propertyReliefApplied`, `schoolTax` and `bcNorthernRural` follow the
`scenario-url.ts` conventions: defaults are omitted from links, damaged fields fall back one by one, and a save or link
without them loads as a gross bill with nothing reflected. They reset with the home province, like the bill.

**Ledger.** Relief lines that are Incomplete, Not modelled or city-bill-only show those words in the credits list,
never $0. Tooltips cover the default-bill limit on city relief, benefit-year entitlement and prior-year bases, excluded
deferrals, housing allowances (SAFER, Rent Assist; #216) and the 2026-only notice, each asserted in
`tests/e2e/property-relief.mjs` at 375 px, 430 px and desktop, in light and dark.

## Slice 4 (#224): Ontario, Toronto and Quebec, built

Coverage is **2026 only**: the programs are in `data/years/2026/provinces/ON.yaml` and `QC.yaml`, 2025 declares none,
and no engine code tests a year. Ages follow the app's convention (whole years on December 31 of the tax year), so a
rule that is tested at December 31 of the year *before* the benefit year uses `age − 1`: Ontario's "64 on December 31,
2025" for the 2026 benefit is an app age of **65**, and Quebec's "65 on December 31, 2025" is an app age of **66**. A
missing age is never senior. All prior-year income and tax bases are proxied by this year's, so these lines are
`estimated`.

**Ontario, `ontario-senior-homeowners-property-grant`.** An owner in a household with someone aged 64 at the prior
year end (one spouse is enough). `min(500, tax) − 0.0333 × max(0, AFNI − 35,000)` (couple 45,000), and nothing at AFNI
of 50,000 (couple 60,000) or more, so there is no small positive amount at the cutoff. AFNI is the household's federal
family net income; the tax is the gross levy (the household's own share if it co-owns with a non-spouse).

**Ontario, `ontario-energy-property-tax-credit-senior-overlap`.** The CRA senior sheets' steps 1 to 5. With occupancy
cost `O` (the gross levy, or 20% of annual rent when there is no bill), `E = min(O, 290)`, `P = min(O, 617 + min(0.1
O, 581))`, `raw = max(0, E + P − 0.02 × max(0, AFNI − 36,309))` (couple 43,571) and `overlap = max(0, max(0, raw +
OSHPTG − E) − O)`, the credit is `max(0, raw − overlap)`. At `O = 600` and low income: raw 890, grant 500, overlap
500, credit 390; together 890 = 600 property + 290 energy. Adding the two without the overlap overpays 500, and
capping their total at the bill would drop the energy component. A **single senior with a child** uses the ordinary
sheet (the single senior sheet is for "no care of a child under 18"); a couple uses the couple sheet with or without
children.

**Replacement, not addition.** `creditsOf` skips the ordinary `ontario-energy-property-tax-credit` for exactly the
households that take the senior schedule (`usesSeniorOeptc`, one definition used by both files), so the credit list
has one "Ontario energy and property tax credit" line, in the senior's case computed by the relief program. Everyone
else keeps the ordinary credit, in its old place and amount. The handler also refuses if `existingCredits` shows the
ordinary credit counted, as a guard. **Neither program is on a tax bill** (the grant and credit are paid with the
Ontario Trillium Benefit), so a net bill states 0 for both and any other amount makes them incomplete; the gross and
net bills reach the same burden.

**Toronto, `toronto-property-tax-increase-cancellation`** (municipal scope: the default reference-city bill only; a
custom bill or a rate override is `city-bill-required`). Eligible: an owner aged 65, or 60 to 64 with an OAS Allowance
(`Person.allowance`), whose household's **total (gross) income** (line 15000: net income with the deductions added back,
`totalIncomeOf`, never net income) is at most $62,000 and whose home (value standing in for the assessment) is at most
$975,000. No age is no eligibility. The disability route, the good-standing and ownership-period tests and the
construction exclusion are not modelled. The cancellation is the year's tax increase plus earlier cancelled increases
still payable, if the sum is at least $10, and never more than the levy. **First-time claimant basis, not a flat
grant:** unless the household states last year's levy (`torontoPriorYearLevy`, increase = levy − prior), the increase is
estimated as `levy × r / (1 + r)` with r the City's 2026 residential increase of 2.2%, which reproduces the budget's
average-home figure exactly (4,252 × 0.022 / 1.022 = $91.53). Earlier cancelled increases are stated
(`torontoCarryover`) and default to none, as for a first-time claimant; with the budget's $268 carryover the
continuing claimant is $359.53. The provincial grants above read the gross levy and do not net the cancellation (their
bases are prior-year amounts, and the app's one bill stands in for them).

**Quebec, `qc-senior-municipal-tax-increase-grant`** (provincial scope: a custom bill can receive it, because the
household states the grant's own figures; it is claimed on line 462 of the return, never on the tax bill, so a net bill
states 0 and any other amount makes it incomplete). Eligible: an owner with someone 65 at the prior year end (an app age
of 66), 15 consecutive years' ownership at that date (`qcOwnershipYears`, unknown makes it incomplete) and the spouses'
line 275 income at most $64,200 (the form says "or less"; the 2025 bill's limit was $62,900). The household states the
municipality's potential grant for the current roll year (`qcPotentialGrant`, form line 41) and the preceding roll's
final-year awards to all owners (`qcPrecedingRollGrant`, line 43, zero when none); missing either is incomplete. The
whole-property grant is `round(min(500, potential) + preceding)`: the cap is on the new-roll increment, so $500 plus
$120 is $620, not $500, and a stated potential above $500 is capped before the carryover is added. The claimant has the
whole grant less what other co-owners claim on their returns (`qcOtherClaims`, line 45, none when omitted): $620 can
be allocated $300/$320, never $620 each. The **final year of the preceding roll is fixed while the current roll runs**
(a 2026-2028 roll uses 2025; a 2025-2027 roll uses 2024), so the carryover is whatever that year's awards were, not
last year's grant by default; the engine takes the stated figure and does not derive a year. The roll-averaging system
that produces the potential amount is not reproduced.

**Goldens.** No existing golden cell moves, in any year or file. The cases the issue expected to move do not exist: no
scenario in the 2019-2026 main goldens or `other-income-original.json` has a person's age (BC's slice made the same
observation), so no household there is a senior, over 60 with an Allowance or a Quebec claimant, and Toronto's
cancellation also needs an age. The older senior fixtures in `tests/golden/features/` run with the credits switch off
and no tenure (Slice 1), so they evaluate no relief. Every senior path is therefore a **new** hand-calculated case in
`tests/golden/features/property-relief-on-qc.json`, run by `tests/property-relief-on-qc.test.ts`; each case's `calc`
shows its arithmetic, and the expected numbers were written with a script that reads no engine code. An ordinary
Ontario household keeps the ordinary credit in its old place and amount, which is why no cell moved.

| Rule path | Cases |
| --- | --- |
| OSHPTG single and couple thresholds, 50,000 / 60,000 cutoffs, 35,001 edge | `on-single-*`, `on-couple-*` |
| Senior OEPTC schedule and income thresholds 36,309 / 43,571 | `on-single-35000-tax-4000`, `-40000`, `-46309-*`, `on-couple-50000` |
| Overlap and the energy component ($600 example, $300 bill) | `on-single-tax-300`, `on-single-tax-600` |
| Age 64 / 65, mixed-age spouses, no age | `on-age-*`, `on-couple-one-senior-*`, `on-couple-both-64-*`, `on-no-age-*` |
| Renter, single senior with a child | `on-renter-senior-rent-1000`, `on-single-senior-with-child-*` |
| Toronto first-time, $91.53 / $359.53, $10 minimum, prior levy, carryover, cap at the levy | `tor-*` |
| Toronto income 62,000 / 62,001, gross not net, assessment 975,000 / 975,001, ages, renter | `tor-income-*`, `tor-gross-*`, `tor-assessment-*`, `tor-age-*` |
| Toronto custom bill or rate override receives nothing | `tor-custom-bill-*`, `tor-rate-override-*` |
| QC $500 cap, carryover, rounding, co-owner allocation $300/$320, income 64,200 / 64,201, age, 15 years | `qc-*` |
| QC missing facts are incomplete; a net bill states 0; a custom bill receives it | `qc-*-missing`, `qc-net-bill-*`, `qc-custom-bill-*` |
| Ordinary and senior OEPTC never together; the guard; the credits switch; 2025 declares none | the tests after the cases |
# Provincial and territorial seniors' supplements, 2025–2026

Verification for **#21, phases 1 and 2**, checked **2026-11-05**; Codex Sol `gpt-6.1-sol`, `xhigh`.
The engine/data implementation covers **2025 and 2026 only**, with no new household inputs or page changes.
The thirteen-jurisdiction inventory below preserves the original research. The final implementation,
estimated conventions, omissions, independent calculations and golden reconciliation follow at the end.

The [phase-2 scope/evidence record](21-provincial-supplements/phase2-status.md) supersedes the inventory's
original open scope questions. The user approved current income as the historical-income proxy and
unavoidable, independently calculated changes to qualifying senior feature goldens; the case-count limit
was subsequently removed. The evidence was committed before application changes, in `1ecf27a`.

## Evidence status and conventions

The [sizing study in PR #135](https://github.com/yuorme/tax-visualizer/pull/135), committed as
[the #16 report](16-seniors-sizing.md), retains provincial supplements. Its BC/SK examples are annualized
benefit rates, and its Ontario/Alberta examples use July 2026 publications. They do not establish
calendar-2025 receipts, every jurisdiction's rules, or any exclusion of other programs.

The [source index](21-provincial-supplements/SOURCES.md) links the official publications and local extracts.
Extract headers record URL, retrieval date and original-file SHA-256. Sources are cached in this issue's
folder, leaving the shared annual source indexes untouched. The fetch helper's exported extraction functions
were reused with a custom destination. Application code is unchanged; the `.txt` cache paths nevertheless
require the full validation path under the repository's scope checker.
Some government HTML endpoints return access challenges; successful transport alone is not source evidence.
Unusable challenge/empty extracts are omitted. Remaining access and dating gaps are identified below.

Amounts are CAD **cash benefits or tax dollars**, except where explicitly identified as non-refundable bases.
For sizing, an illustrative ordinary recipient is a full-year resident aged 68, with full OAS, qualifying GIS
and little private income; Quebec's assistance example uses age 72. This is an eligible household profile,
not a statistical average. Show both a low-income maximum and nonmaximum examples where rules permit.
At a fixed $35,000 income denominator, the study's 0.1-point threshold is only **$35 annually**.
Every retained income supplement materially exceeds it for an applicable recipient. Lack of a verified formula
or dated rate is an **open evidence item**, never a finding of immateriality.

Keep three dates separate: income reference year, legal benefit period, and cash receipt year. July–June
programs generally use the preceding tax return, so calendar 2025 can depend on 2023 and 2024 incomes, and
calendar 2026 on 2024 and 2025. Manitoba 55 PLUS uses April–March; Yukon indexes in October. The existing
#19 engine explicitly substitutes current scenario income for both historical reference years and sums
quarterly/monthly payments over the calendar year. Reusing that approximation for #21 must be explicit;
it does not authorize multiplying a July rate by twelve and labelling it calendar receipts.

**In** below means retain for #21 or explicitly integrate its senior refundable-credit equivalent.
**Out of #21** means an identified boundary, existing implementation, or routing to another issue;
it does not mean a material program has been dropped from the product. Expense, residence and geographic
conditions need inputs or explicit unsupported treatment. Do not assume every senior meets them.

## All-jurisdiction decision register

Detailed eligibility, income tests, sources, year gaps and adjacent exclusions follow. Annualized figures
are labelled; calendar totals assume unchanged eligibility and reference incomes throughout the year.

| Jurisdiction | General income support / equivalent | Typical eligible annual size, 2025 / 2026 | Decision |
|---|---|---|---|
| BC | Senior's Supplement | Single maximum $1,191.60 / $1,191.60; couple $2,646 | In |
| AB | Alberta Seniors Benefit | Ordinary single maximum $3,868 / $3,946; couple $5,801 / $5,918 | In; dated-rate conflict below |
| SK | Seniors Income Plan (SIP) | Single maximum $4,320 / $4,320; both-pensioner couple $7,800 | In |
| MB | 55 PLUS; refundable personal tax credit senior addition | 55 PLUS single up to $647.20; senior addition up to $113 each year | In; separate programs |
| ON | Guaranteed Annual Income System (GAINS) | Single calendar maximum $1,062 / $1,092; both-pensioner couple twice that | In |
| QC | Refundable Senior Assistance Tax Credit | Up to $2,000 per age-70+ adult in either year | In; no separate GIS-linked monthly top-up identified |
| NB | Low-Income Seniors' Benefit | $616 / $629 per qualifying household | In |
| NS | Seniors Provincial Income Tax Refund | Actual qualifying provincial tax refunded, published $50–$10,000 range | In; no general monthly GIS top-up identified |
| PE | Seniors Independence Initiative | Up to $1,800 per year for approved costs | Out of #21: assessed services; no general monthly income supplement identified |
| NL | Seniors' Benefit; Coastal Labrador supplement | General single calendar maximum $1,533.50 / $1,716.50; eligible Labrador adult additional $500 | In; geographic input needed |
| YT | Yukon Seniors Income Supplement (YSIS) | Dated maximum $314.46/month ($3,773.52 annualized); current $323.26 ($3,879.12 annualized) | In; calendar transitions and formula unresolved |
| NT | Senior Citizen Supplementary Benefit (SCSB) | $196/month = $2,352 per qualifying adult in either year | In |
| NU | Senior Citizen Supplementary Benefit (SCSB) | Current administrative $300/month = $3,600 per qualifying adult | In; legislation/publication discrepancy below |

The NS, PE and QC absence statements are bounded by the official program inventories reviewed: none describes
a separate general monthly GIS top-up. NS instead has a tax refund, QC a refundable age/income credit, and
PE assessed expense assistance. This is not a claim that no senior support, municipal program or care subsidy exists.

## British Columbia

**Senior's Supplement — in, both years.** The
[policy](21-provincial-supplements/sources/bc-policy.txt) covers permanent BC residents receiving GIS,
and qualifying Allowance recipients who are spouses of GIS recipients. It uses the federal entitlement,
with the [income tables](21-provincial-supplements/sources/bc-income-tables.txt) expressly defining income
as income for **GIS purposes**, not line 23600 or raw CPP alone. Apply the GIS earnings exemptions and
deductions through that definition. Eligibility starts after federal notification; a full-year assumption
does not describe a new claimant's first year. Up to six months' absence is permitted.

Monthly maxima are $99.30 single or spouse without OAS/Allowance, $110.25 per adult when both receive OAS/GIS,
and $99.83 for the Allowance-recipient spouse (older spouse $110.25). These are supported by the
[dated July 2025 publication](2025/sources/seniors-bc-supplement.txt) and
[January 2026 table](21-provincial-supplements/sources/bc-rate-2026.txt).
Annual maxima are $1,191.60 single, $2,646 both-pensioner couple, and $2,520.96 mixed GIS/Allowance couple.

The October 2026 income lookup has final positive single bands through $2,279.99, both-pensioner family
bands through $4,895.99, and older GIS recipient with Allowance spouse through $8,111.99; the spouse's
Allowance supplement reaches zero earlier. Ordinary single income $984–$1,007.99 gives $58.30/month,
or **$699.60/year** at that rate. The last single band pays $1/month. These are lookup boundaries,
not permission to draw one straight taper through the maximum and endpoint. Mixed-age categories and
GIS top-ups change the slope. The older-spouse/no-OAS table has its own offset.

The published BC 75+ summary contains an inconsistent OAS total in its January 2026 single column.
Use federal quarterly OAS/GIS and the provincial supplement separately; do not import that combined total.
The October 2026 detailed income table is not a dated 2025 nonmaximum oracle. Obtain earlier detailed tables
or independently reconcile the unchanged provincial policy to each quarter's federal payment rows before coding.

The [2025 T5007 guidance](21-provincial-supplements/sources/bc-tax-slip.txt) explicitly includes this benefit
on lines 14500 and 25000, affecting net-income-tested credits but not OAS/GIS eligibility. The bus-pass
value is separately reported; do not add that in-kind value to cash or duplicate the supplement.

Adjacent programs are sized before routing:

| Program | Size / eligibility and period | Decision |
|---|---|---|
| [SAFER](21-provincial-supplements/sources/bc-safer.txt) | Rent assistance for qualifying 60+ private renters; minimum $50/month = $600/year, rent ceiling $1,150 and household income below $40,000 from April 2025 | Material; route housing assistance to #22; not an unconditional income supplement. Full 2025 pre-April and detailed benefit formula remain to collect there. |
| Home owner grant senior increment | $275/year above ordinary grant in the dated 2026 example; ordinary grant must also be reconciled | #22, as [already sized](16-seniors-sizing.md); not immaterial |
| [Winter Supplement](21-provincial-supplements/sources/bc-winter.txt) | $0 for a supplement-only senior with no dependants receiving assistance: explicitly excluded | Out for that household; general income-assistance families are a different eligibility group |

## Alberta

**Alberta Seniors Benefit — in, both years.** Age 65+, Canadian citizen/permanent resident, at least three
months' Alberta residence and receiving OAS; deferring OAS disqualifies the applicant/spouse under the
[current eligibility page](21-provincial-supplements/sources/ab-current.txt). GIS receipt is not itself required.
The benefit year is July–June, using previous-calendar-year income; a first-time applicant can use an
estimated current income, subsequently reconciled. Do not import GIS's income test here.

The calculation starts from each adult's **line 15000**, excluding OAS, RDSP income, social assistance,
net federal supplements, RPP/RRSP deductions and the specified split-pension adjustment; employment relief
is up to $3,600 of employment income or line 22900 employment expenses, whichever is higher. Other listed
special exclusions need their own support. Floor each adult's negative program income to zero before
combining spouses, irrespective of spouse age. This differs from #19's household loss treatment.
The current page establishes the definition; verify the dated booklet if implementing earlier earnings or
split-pension edge cases rather than assuming every present-day exclusion applied identically.

Each amount below is an **annual maximum**, paid monthly. These are transcriptions of the cached dated
[January 2025](21-provincial-supplements/sources/ab-january-2025.txt),
[July 2025](21-provincial-supplements/sources/ab-july-2025.txt),
[January 2026](21-provincial-supplements/sources/ab-january-2026.txt),
[April 2026](21-provincial-supplements/sources/ab-april-2026.txt) and
[July 2026](21-provincial-supplements/sources/ab-july-2026.txt) sheets.

| Effective months | Ordinary max single / couple | Ordinary reduction single / couple | Other-residence max single / couple | Other-residence reduction single / couple | Published program-income threshold single / couple | Total-income guideline single / couple |
|---|---|---|---|---|---|---|
| Jan–Jun 2025 | 3,868 / 5,801 | 15.89% / 15.92% | 2,695 / 5,388 | 11.08% / 14.80% | 24,225 / 36,265 | 33,410 / 54,640 |
| Jul–Dec 2025 | 3,868 / 5,801 | 15.22% / 15.24% | 2,695 / 5,388 | 10.61% / 14.17% | 25,295 / 37,865 | 34,770 / 56,820 |
| Jan–Jun 2026, January/April sheets | 3,946 / 5,918 | **15.52%** / 15.54% | 2,749 / 5,496 | 10.82% / 14.45% | 25,295 / 37,865 | 34,770 / 56,820 |
| Jul–Dec 2026 | 3,946 / 5,918 | 17.14% / 17.17% | 2,749 / 5,496 | 11.94% / 15.94% | 23,020 / 34,460 | 32,690 / 53,800 |

**Unresolved official conflict:** July 2026's retrospective Jan–Jun column prints **15.22%** for the single
ordinary category, whereas both January and April print **15.52%**. At $10,000 program income that changes
six months' benefit by $15. Retain the dated sources and resolve with an official correction/administrator
before locking that boundary; do not silently choose or blend them. The total-income amounts are guidelines
including full OAS, not taper starting points. Preserve the $10 monthly minimum and negative-result exclusion
in the sheets; clarify its relationship to the published program-income thresholds before a zero-boundary test.

At zero program income the ordinary single receives **$3,868 in 2025** or **$3,946 in 2026**. At unchanged
$10,000 program income, independent 2025 arithmetic gives
`(3,868 − .1589 × 10,000)/2 + (3,868 − .1522 × 10,000)/2 = $2,312.50`, before monthly cents rounding.
The July-2026 annual run rate at the same income is **$2,232**. Neither matches a generic GIS taper.

Additional Alberta support is material, but conditional:

| Program | Sized annual support / income definition | Decision |
|---|---|---|
| Supplementary Accommodation Benefit | For post-Oct-2007 continuing-care entrants, up to $8,520/year in 2025/early 2026; $9,000 annualized from March 2026. Monthly benefit uses private-room charge + $365 (2025) or $373 (2026) disposable allowance − previous-year monthly total income, excluding prior accommodation benefit. | Out of ordinary #21 household path; retain as a material institutional-residence extension, not zero. It is paid with ASB, so the website's $12,466 must not be added to ordinary ASB again. |
| Older continuing-care category | Published annual max $19,934 from Jan 2025, $20,730 Aug 2025, $21,145 Jan 2026, $21,729 Mar 2026 and $22,259 Jul 2026, with separate percentages in dated sheets | Same institutional extension; residence history is a missing input |
| [Special Needs Assistance](21-provincial-supplements/sources/ab-special-needs.txt) | Current maximum $5,872 per July–June benefit year, subject to qualifying receipts/items and income; current primary thresholds $32,690 single / $53,800 couple. Earlier item maxima not verified here. | Out of unconditional #21 path: expense/needs reimbursement, clearly material; keep missing 2025 schedule explicit |

## Saskatchewan

**Seniors Income Plan — in, both years.** Permanent resident aged 65+, receiving full or partial OAS and GIS.
The [program page](21-provincial-supplements/sources/sk-current.txt) lists taxable private income such as
CPP, interest, dividends, pensions and wages, excluding OAS/GIS, with no asset test. The legal payment rule
is more precise: [regulations ss.3–6](21-provincial-supplements/sources/sk-regulations.txt) tie entitlement
to **monthly GIS/Allowance entitlement**, with a July–June period reassessed in July. Work from that
entitlement and the federal income definition; the plain-language taxable-income description is not a
replacement for federal earnings exemptions or bands.

The regulation's last benefit amendment is effective July 2023, corroborated by the 2026 program page.
Maximum is $360/month single or pensioner whose spouse is not a pensioner, $325 **each** when both are
pensioners, and $50/month for an eligible special-care-home resident. Thus full-year sizes are **$4,320**,
**$7,800 per couple**, or **$600 per facility resident** in either year.

The October 2026 webpage gives at-home zero-income boundaries $4,560 single, $7,440 both-pensioner couple,
$11,808 with spouse under 60 and $9,120 with an Allowance-recipient spouse. Special-care counterparts are
$912/$1,776/$9,792/$1,824. These are dated resulting boundaries, not universal base thresholds for 2025.

Reduce the maximum by $1.90 for each $1 **basic** GIS reduction in federal Table 1, $2.10 for Table 2,
and $6.55 for Table 3. The basic-benefit interpretation is derived from the administered cutoffs and
labelled estimated; including federal top-up reductions contradicts those cutoffs. The Allowance-spouse
branch uses $1.90 per $3 basic Allowance reduction in Table 4, including the regulation's
remainder provision; do not substitute the older spouse's flat GIS maximum. Positive benefits have minimums
of $15/month at home and $5 in a facility; zero is still zero. At $1,000 single GIS-test income in a federal
band with $41 monthly GIS reduction, SIP is `360 − 1.90 × 41 = $282.10/month`, **$3,385.20 annualized**.
Tests must use actual dated federal bands, especially near GIS top-up and Allowance transitions.

The existing SK supplementary age credit is a **different, already implemented non-refundable credit**.
Its $2,028/$2,569 bases give at most $212.94/$269.745 tax relief in 2025/2026; do not add the bases as cash.

[Personal Care Home Benefit](21-provincial-supplements/sources/sk-personal-care.txt) is a separate material
residence-dependent program: age 65+, OAS, licensed personal-care home, monthly income below $3,500;
for a couple, use half combined household income. The
[dated April 2025 increase](21-provincial-supplements/sources/sk-care-increase.txt) raises the threshold
from $2,500 to $3,500. At $2,000 monthly income the new support is **$18,000 annualized**, versus $6,000
at the old threshold. Out of the ordinary #21 path because institutional living and its income/charge
model are not represented; retain a separate residence extension. It is not a $3,500 payment to everyone.

## Ontario

**Guaranteed Annual Income System (GAINS) — in, both years.** The
[official eligibility page](21-provincial-supplements/sources/on-current.txt) requires age 65+, OAS and GIS,
ten years' Canadian residence and either the previous twelve months in Ontario or twenty Ontario years
since age 18. It is automatic for qualifying OAS/GIS recipients. The July–June benefit year uses prior-year
private income; CPP, workplace pensions and interest are included. OAS/GIS are not private income.
Exact earnings/deduction alignment with GIS must be checked against the Act before extending beyond the
ordinary private-pension cases; access to the e-Laws page did not yield a usable local text extract.

The [government data catalogue](21-provincial-supplements/sources/on-catalogue.txt) supplies all eight
quarterly 2025/2026 English CSV groups, cached here for the four age-65–74 marital categories. These show
monthly income bands, rather than merely a headline maximum:

| Months | Single / each spouse maximum | Single first zero private-income band | Both-pensioner family first zero band | One-pensioner / Allowance-spouse family first zero band |
|---|---|---|---|---|
| Jan–Jun 2025 | $87 | $4,176 | $8,352 | $17,088 |
| Jul–Sep 2025 | $90 | $4,320 | $8,640 | $17,472 |
| Oct–Dec 2025 | $90 | $4,320 | $8,640 | $17,568 |
| Jan–Jun 2026 | $90 | $4,320 | $8,640 | $17,568 |
| Jul–Sep 2026 | $92 | $4,416 | $8,832 | $17,856 |
| Oct–Dec 2026 | $92 | $4,416 | $8,832 | $18,000 |

Sources: [early 2025 single](21-provincial-supplements/sources/on-jan-1-to-mar-31-2025-single.txt),
[July 2025](21-provincial-supplements/sources/on-jul-1-to-sept-30-2025-single.txt),
[early 2026](21-provincial-supplements/sources/on-jan-1-march-31-2026-single.txt),
[July 2026](21-provincial-supplements/sources/on-jul-1-to-sept-30-2026-single-en.txt), and the parallel
marital tables indexed in SOURCES.md. In the single table each $24 annual band reduces monthly GAINS by
$0.50; for both-pensioner couples it is $48 of combined income per $0.50 **per adult**. Mixed-age families
have an initial full-benefit range and different bands; do not apply the single cutoff to them. Collect
the age-75+ companion tables before claiming every age/category path is verified.

Unchanged full-year single eligibility produces **$1,062 in 2025** (`6 × 87 + 6 × 90`) and **$1,092 in
2026** (`6 × 90 + 6 × 92`), versus annualized July maxima $1,080/$1,104. With $2,400 private income in
both reference years, the cached single rows give $37/$40 monthly in the two halves of 2025 (**$462**),
and $40/$42 in 2026 (**$492**). Both-pensioner couple maxima are double the single calendar amounts.

The existing Ontario energy/property credit uses ordinary-adult parameters, not senior amounts. Its age
uplift and the $500 senior homeowners' grant belong in #22, with the published overlap cap, rather than
being hidden inside GAINS. The
[Seniors Care at Home Tax Credit](21-provincial-supplements/sources/on-medical.txt), age 70+ applicant or
spouse, pays 25% of eligible claimable medical costs up to $6,000: **$1,500/year** maximum, reduced by 5%
of family net income above $35,000 (gone by $65,000). Out of unconditional #21: medical-spending-dependent,
not immaterial. It is unrelated to the existing Ontario **childcare** CARE credit.

## Manitoba

**55 PLUS senior and junior components — in, both years.** The
[Manitoba/Quebec appendix](21-provincial-supplements/mb-qc.md) supplies the five senior schedules and
junior income definition, dated statutory reconciliation, examples and additional property/care programs.
The [senior regulation](21-provincial-supplements/sources/mbqc-mb-senior-regulation.txt) and
[junior regulation](21-provincial-supplements/sources/mbqc-mb-junior-regulation.txt) are distinct rule paths.
Manitoba residence, age 55+, Manitoba Health registration and assistance exclusions apply. The senior
component uses federal OAS/GIS/Allowance status, including surviving spouses; the junior component covers
those not eligible for federal OAS benefits. Do not reduce this inventory to age-65+ GIS recipients.

The senior test uses federally accepted declared GIS/Allowance income and marital category. Full quarterly
maxima are $161.80 single or $173.90 per eligible married adult, giving **$647.20 single / $1,391.20 couple**
for four payments. At $500 annual single tested income, the $480–$503.99 row pays $74.80/quarter,
**$299.20/year**. Other schedules cover a non-pensioner spouse, Allowance spouse and surviving spouse.
Use the actual discrete rows, not a universal slope. The no-federal-benefit spouse offset includes basic
monthly OAS rounded upward to a $4 multiple, times twelve, plus $47.99; clarify the negative-income floor
and missing terminal zero rows before coding. These ambiguities do not make 55 PLUS immaterial.

The junior test includes program-defined gross income, total capital gains/losses and a frozen April 2011
level of family-member OAS benefits, then specific employment/business/payroll deductions. It is not GIS
income or T1 net income. Single annual maximum $647.20 applies through $8,930.40 program net income;
couple maximum $695.60 **per eligible adult** applies through $14,479.20. At $9,000 single income, the
published row gives **$595.20**. The public final bands extend to $9,746.40/$16,255.20, but the eligibility
section stops at $9,722.40/$16,207.20: retain this official conflict as an implementation prerequisite.
Benefit year is April–March, prior-tax-year income; junior applications recur annually and payments begin
in the approved quarter. Amounts were not indexed between the collected 2025 and 2026 rules.

**Refundable personal tax credit senior terms — retain as an equivalent requiring explicit allocation.**
[2025 MB479](21-provincial-supplements/sources/mbqc-mb-479-2025.txt) and the
[2026 statute](21-provincial-supplements/sources/mbqc-mb-tax-act-2026.txt) provide $195 ordinary base plus
$113 age-65+ terms, with qualifying spouse/dependant/disability additions, less 1% of adjusted family net
income. The form starts from both adults' line 23600, adjusts UCCB/RDSP, floors each adjusted adult income
at zero and sums. This includes federal supplements, unlike 55 PLUS's private-income test. Detailed 2026
filing ordering remains to reconcile. At $15,000 family income a single senior gets **$158**, compared with
$45 absent the age term; at $25,000 the senior gets **$58**, ordinary adult zero. The whole program is
missing from the inspected engine. Do not bolt on a flat $113 or confuse it with MB428-A's existing
non-refundable family benefit. Implementing its ordinary base may need a separately scoped correction.

Out of #21, retained for **#22**: senior renter additions up to $328.57/$357.14 in 2025/2026, with their own
income/rent limits, and the $235 seniors' school-tax rebate against remaining school tax. At $25,000 family
income the full-year renter additions are about $123.22/$133.915; at $35,000 and sufficient remaining tax,
the school rebate is $235. The appendix supplies sourced formulas and caps. They are material and absent
from ordinary affordability-credit parameters; prevent duplicate claims when #22 changes that credit.

## Quebec

**Senior Assistance Tax Credit — in, both years.** No separate general monthly GIS top-up was found in the
[official seniors catalogue](21-provincial-supplements/sources/mbqc-qc-seniors-catalog.txt); this refundable
equivalent is material. The
[2025 form](21-provincial-supplements/sources/mbqc-qc-assistance-form-2025.txt) and actual
[2026-10 form](21-provincial-supplements/sources/mbqc-qc-assistance-form-2026.txt) are available, so its
2026 formula is **verified**, not a provisional 2025 carry-forward. At least one eligible adult must be
70+ at December 31, with Quebec residence/status and filing conditions. A younger eligible spouse may
share the credit but does not create another age entitlement.

| Parameter | 2025 | 2026 |
|---|---:|---:|
| Maximum per eligible age-70+ adult | $2,000 | $2,000 |
| Single threshold | $27,835 | $28,405 |
| Couple threshold, whether one or two eligible seniors | $45,270 | $46,200 |
| Reduction on excess household Quebec line 275 income | 5.40% | 5.47% |

Reduce the **household maximum once**, floor at zero, then allocate between eligible spouses. Current-tax-year
entitlement is distinct from the following year's refund receipt. At single line 275 income $35,000, age 72,
the independent entitlement is **$1,613.09 / $1,639.2535**, before return rounding. A two-senior couple at
$60,000 receives $3,204.58/$3,245.14. See the appendix for derived zero points and residency exceptions.
This credit is separate from solidarity and the age-65/living-alone/pension non-refundable pool; never
multiply the $2,000 refund by the pool's 14% rate or add a second copy of the existing age credit.

The [appendix's adjacent-program register](21-provincial-supplements/mb-qc.md) sizes the routed programs.
Material **#22/housing** items include home-support deemed rent ($234/$240 on $1,000 monthly rent), ordinary
home-support costs ($1,170/$1,200 on $3,000 eligible services), Shelter Allowance ($1,200–$2,040 annualized),
and the municipal-tax-increase grant ($500 current-roll increment plus any allowed prior-roll carry).
Home support is not always zero when explicit care spending is absent: ordinary apartments have deemed costs.
Expense/care follow-ups include independent-living equipment ($350 on $2,000 costs), rehabilitation ($600 on
$3,000 eligible costs) and the caregiver relative component ($1,494/$1,525 base), all with separate conditions.
The career-extension credit belongs to a separate income-tax follow-up: up to **$1,750/$1,785.70** with work
income and tax capacity. The former senior-activities credit is **$0 in both years because abolished in 2023**.
Domestic-help supplier subsidies remain an unsized care-program evidence item, not an immateriality exclusion.

## New Brunswick

**Low-Income Seniors' Benefit — in, both years.** The
[2025 form](21-provincial-supplements/sources/atlantic-nb-benefit-2025.txt) establishes **$616**, and the
[2026 program](21-provincial-supplements/sources/atlantic-nb-benefit-2026.txt) **$629**, for an applicant
resident in NB at the preceding December 31 who received GIS, Allowance or Allowance for the Survivor
**during the preceding year**. Ages follow those federal categories (65+, or 60–64 Allowance); CPP survivor
pension alone is insufficient. There is no separate NB income taper: prior federal receipt is the test.
Co-resident qualifying couples ordinarily receive one payment; separate residences can qualify for two.
Confirm mixed GIS/Allowance household wording against the 2026 image form before implementation.
Applications open April 1 and close December 31. A typical eligible household receives the flat annual amount.

The [Atlantic appendix](21-provincial-supplements/atlantic.md) records primary sources and sized exclusions:
property allowance up to $300 to **#22**, renovation credit up to $1,000 and forgivable home-repair assistance
up to $7,000 senior adaptations/$18,000 repairs to expense/housing follow-ups; emergency fuel assistance up
to $550 to assessed energy support. Electricity tax rebate is general bill relief, not senior income:
$2,000 qualifying consumption gives $200. The current status of the old $100 Home Energy Assistance Program
was not established; no zero-value materiality conclusion is made.

## Nova Scotia

**Seniors Provincial Income Tax Refund — in as an equivalent, both years.** The
[regulation](21-provincial-supplements/sources/atlantic-ns-tax-refund.txt), effective for 2010 onward,
requires NS residence, attainment of 65 before December 31, **actual GIS receipt at some time in the tax
year**, filing/reporting GIS, and assessed provincial liability. Death in the year and specified imprisonment
or exempt-person cases exclude eligibility. Resolve the December 31 birthday wording against the summary
before claiming that exact boundary. There is no new income-dollar taper: actual GIS receipt and assessed
provincial tax are the relevant measures. It is not an Allowance-only refund.

The [program](21-provincial-supplements/sources/atlantic-ns-tax-refund-program.txt) describes refunding the
eligible provincial assessment. The regulation gives zero at zero liability, $50 for positive liability below
$50, the liability itself between $50 and $10,000, and ordinarily $10,000 above that; further excess refund
is discretionary on application. Thus $25/$500 of qualifying final NS tax produces **$50/$500**, not a
fixed $1,000 benefit. It applies after existing non-refundable credits, including the separately implemented
$1,000 NS age tax credit. Count the refund once. The regulation attributes it to the calendar tax year
regardless of payment date, supporting tax-year entitlement accounting.

**Seniors Care Grant:** $750 per qualifying household in the documented 2025–26 and 2026–27 rounds, income
ceiling $45,100 and qualifying home/health/heating services in the April–March round. It is material but
out of an unconditional #21 calculation: assessed expense/household conditions require inputs and some
income-definition details remain unresolved. HARP is $400 with heating and income/federal-benefit conditions;
property rebate is 50% of qualifying prior-year paid tax up to $800, routed to **#22**. General energy tax
rebate on $2,000 qualifying spending is $180 at the current 9% rate; full dated 2025 allocation remains open.
The appendix also sizes current repair grants ($10,000) and conditional forgivable loans ($8,000), with
2025 transition details still unverified. None is excluded as too small.

## Prince Edward Island

**No general unconditional monthly seniors' income supplement identified** in the official support inventory
reviewed. The material equivalent is the **Seniors Independence Initiative**, a service/needs-assessed
payment rather than an automatic age/income entitlement. The
[policy](21-provincial-supplements/sources/atlantic-pe-sii-policy.txt), together with the dated 2024 increase
cited in the [Atlantic appendix](21-provincial-supplements/atlantic.md), supports these annual ceilings in
the 2025–2026 inventory:

| Single income | Couple income | Annual ceiling |
|---|---|---:|
| ≤$22,253 | ≤$31,470 | $1,800 |
| $22,254–$25,753 | $31,471–$34,970 | $1,325 |
| $25,754–$29,253 | $34,971–$38,470 | $950 |
| $29,254–$32,753 | $38,471–$41,970 | $575 |

Applicants are 65+, PEI residents with status conditions, living independently in an owned/rented home.
Income is claimant/spouse net income using the current policy's preceding NOA; asset, dwelling and natural
support tests also apply. Eligibility is reassessed at least annually. The current asset condition is less
than $100,000 excluding specified home/vehicle assets; the older announcement and revision dates differ,
so do not backdate all current wording to 2025. Exact whole-dollar versus cent boundaries remain open.
An eligible single at $30,000 with sufficient assessed need has a **$575** ceiling; a couple at $36,000 has
$950. **Out of automatic #21**, retained as a material assessed-service follow-up, not a finding of no support.

The existing $250 PE senior low-income-reduction term is already non-refundable; it is not SII cash.
Additional routed programs: home repair up to $4,000, Safe @ Home up to $10,000, and heating assistance up to
$1,200 to a vendor, each with distinct income, assessment and expense conditions. Exact older repair rules
remain a gap. The appendix records 2025/2026 source dates and the heating administrator transition; an annual
utility bill or loan principal must not be silently treated as an unrestricted senior grant.

## Newfoundland and Labrador

**Seniors' Benefit — in, both years.** The
[regulation](21-provincial-supplements/sources/atlantic-nl-benefit-regulations.txt),
[2026 amendment](21-provincial-supplements/sources/atlantic-nl-benefit-2026-amendment.txt) and dated CRA
guides in the [Atlantic appendix](21-provincial-supplements/atlantic.md) establish a single **household**
amount, including for a couple with two seniors. Age 64 by December 31 of the income-reference year is
the published criterion. Payment is quarterly with the federal credit, using prior-year adjusted family
net income (line 23600 sum, UCCB/RDSP adjustments), not GIS-test income. OAS/GIS cannot simply be removed.

| July–June payment year | Maximum annual schedule | AFNI full-benefit threshold | Reduction above threshold |
|---|---:|---:|---:|
| 2024–25, affects Jan/Apr 2025 | $1,516 | $29,402 | 11.66% |
| 2025–26 | $1,551 | $30,078 | 11.66% |
| 2026–27 | $1,882 | $30,409 | 11.66% |

At constant AFNI $35,000, the latter two annual schedules give **$977.0948/$1,346.6894** before administrator
rounding. Continuous full eligibility gives calendar maxima **$1,533.50 in 2025 / $1,716.50 in 2026**, not
$1,551/$1,882 cash in those years. Published upper cutoffs round differently; use the legal formula and
verified payment rounding rather than a guessed linear interpolation between whole-dollar endpoints.
The existing `nl-income-supplement` is the **ordinary adult/spouse/child component only**; keep it and add
the senior amount once, using the correct period and AFNI.

**Coastal Labrador Seniors' Food and Heating Supplement — retain geographic path, both years.** The
[regulation](21-provincial-supplements/sources/atlantic-nl-coastal.txt) gives **$500 per eligible senior**,
age 65+ and resident at the preceding December 31 in Cartwright–L'Anse au Clair or Torngat Mountains,
with the prior return filed. No income taper. The present St. John's property-tax reference does not
establish household geography. Add an explicit eligibility input or mark the geography unsupported;
do not silently classify the program as immaterial.

Out of unconditional #21: Aging Well at Home **$400/household**, with age, 2024 net-income and April
2025–March 2026 service conditions; the next round is unverified even though the application is labelled
“2026.” Heating support is **$200–$500 in 2025 / $400–$1,000 in 2026** with fuel-purchase/household tests.
Repairs/modifications are material grant-equivalent capital assistance; the appendix documents the October
2026 increases. The **one-time $500 Seniors Affordability Payment** announced November 2, 2026 is material
but **out under the existing one-time-payments scope rule**, not recurring #21 income support.

## Yukon

**Yukon Seniors Income Supplement — in, evidence incomplete.** The
[territorial appendix](21-provincial-supplements/territories.md) links the official program, law indexes,
dated announcements and the [spring 2025 briefing](21-provincial-supplements/sources/territories-yt-briefing-2025.txt).
YSIS depends on federal GIS entitlement and Yukon residence, and includes qualifying 60–64 spouse/survivor
Allowance categories. Do not read the current page's 65+/OAS/GIS/Allowance list as requiring all conditions
simultaneously. The federal income reference and monthly status matter; no separate verified YT dollar
income cutoff or modern taper was established here.

October 2024's indexed maximum **$314.46/month** is documented in March 2025; current official page maximum
is **$323.26/month**. Annualized sizes **$3,773.52/$3,879.12** establish materiality, but the precise
October 2025/October 2026 transitions and 2025/2026 calendar totals remain unverified. The briefing records
annual October CPI indexation and an earlier OAS-input transcription error. A stale 2002 Act's formula
was repealed in 2009; do not implement it or invent a proportional-GIS formula. Modern regulation, category
tables, minimums and commencement details are implementation prerequisites.

The Pioneer Utility Grant is also material: maximum **$1,340.94 Whitehorse / $1,448.21 rural in 2025**,
**$1,382.58/$1,466.50 in 2026**. It has ownership/rent, residence, income and utility conditions, distinct
from GIS. Recommend a separate housing/utility path; obtain a scope allocation before excluding it from
the eventual seniors model. YT Supplementary Allowance requires social assistance ($250/month, $3,000
annualized); out of ordinary #21 without an assistance model. Homeowner grant senior/ordinary caps
$500/$450 belong in **#22**; the increment is material at $50 when both caps bind.

## Northwest Territories

**Senior Citizen Supplementary Benefit — in, both years.** The
[Act](21-provincial-supplements/sources/territories-nt-act.txt) and
[regulation](21-provincial-supplements/sources/territories-nt-regulation.txt) establish residence plus
qualifying federal GIS or spouse's Allowance receipt, and a **flat $196/month** (effective since 2017).
This is **$2,352 per adult / $4,704 for two eligible adults** for a continuously eligible year, including
an eligible 60–64 Allowance spouse. There is no new territorial income taper: use positive per-month
federal entitlement, including its income definition, not a gross household-income cutoff. July federal
reassessment/quarterly amounts can change the receipt condition. Survivor Allowance interpretation remains
open and is outside existing #19 coverage.

The [current administration page](21-provincial-supplements/sources/territories-nt-program.txt) confirms the
amount, automatic payment and T5007 reporting. Heating subsidy is material but pays suppliers and depends
on separately paid heat: **$3,680/$4,480/$6,000 for the eight-month 2025–26 season** by zone, household
income limits $66,000/$75,000/$87,000. Route to a heating extension with actual bills; these are not
calendar receipts or unconditional senior cash. General Taxation Area qualifying property relief is 100%
of eligible property tax, routed to **#22**, with amounts equal to the actual bill.

## Nunavut

**Senior Citizen Supplementary Benefit — in, rate authority needs reconciliation.** The current official
program and an older government poverty report describe **$300/month**, **$3,600 per qualifying adult /
$7,200 couple annualized**, for residents aged 60+ receiving GIS or the qualifying Allowance. The policy
revised in 2023 and expiring March 2027 supports administrative continuation through both tax years.
There is no separately published territorial income taper: use monthly federal eligibility and its income
test. The [territorial appendix](21-provincial-supplements/territories.md) gives the official live links.

The official linked [consolidated regulation](21-provincial-supplements/sources/territories-nu-regulation.txt)
still says **$200**, while administrative publications say $300. The
[2019 Act amendment](21-provincial-supplements/sources/territories-nu-amend-2019.txt) broadens the Allowance
wording but does not establish the rate increase. Obtain the later authorizing instrument/effective date;
neither $200 as current payment nor $300 as a fully reconciled legal parameter is justified by that PDF alone.
The policy's “60–84” Allowance age range is an apparent typo; never turn it into an eligibility rule.
Current administrative evidence sizes the program; unresolved authorization is not immateriality.

Fuel assistance is material but consumption-dependent: eligible seniors aged 60+ who own/occupy a home,
with total net income ≤$100,000, may receive 100% reimbursement of up to **4,000 litres**. Annual dollar
size is eligible litres times actual price (for example, $6,000 at an expressly assumed $1.50/litre);
no verified standard representative dollar amount was found. Property relief belongs in **#22**; its
current amount/rate was not resolved here and must not be assigned zero.

## Existing engine reconciliation and unresolved decisions

Inspected `src/data/schema.ts`, the 2025/2026 province YAML, `credits.ts`, `senior-credits.ts`,
`gis-allowance.ts`, `personal.ts`, `payroll.ts`, `household.ts`, current feature goldens and `docs/SCOPE.md`.
The current engine has no provincial seniors cash-supplement dispatch. In particular:

| Existing path | What to preserve / avoid double counting |
|---|---|
| SK `senior-supplementary-base` | Non-refundable age credit, already handled by #17; SIP is separate cash |
| MB `mb-family-senior-terms` | Non-refundable MB428-A pool, not 55 PLUS or refundable MB479 personal credit |
| NS `ageTaxCredit` | $1,000 non-refundable credit before assessed-tax refund; never refund tax before this reduction |
| PE `family-reduction-senior` | $250 low-income-reduction term per qualifying adult, not SII cash |
| QC `quebec-age-living-alone-retirement-pool` / legacy living-alone | One non-refundable pool/taper; assistance is a new refundable age-70 path; keep living-alone from being claimed twice |
| NL `nl-income-supplement` | Ordinary supplement only; senior benefit adds a distinct household amount |
| Ordinary ON energy/property and MB affordability credits | Senior property/rent uplifts belong in #22; ordinary parameters do not prove senior relief already exists |
| #19 federal `netFederalSupplements` | Line **14600**, with federal recovery and taxable deduction; not a container for provincial T5007 amounts |

The [CRA guide](21-provincial-supplements/sources/federal-tax-slips.txt), BC and territorial sources establish
that non-taxable provincial supplements can be **T5007 box 11 / line 14500 income**, with an equal
line 25000 taxable deduction. Receipt can change net-income-tested credits without being taxable. For
co-resident spouses, the reporting adult can be the higher-income spouse rather than the cash recipient;
the comparison has its own exclusions. Preserve cash recipient and tax reporter as different concepts.
Do not add cash to both gross-income `cash` and `benefits`, or feed this income back into GIS eligibility.
Verify program-specific reporting, Quebec line 275/295 treatment, the age/spouse/credit interactions and
childcare claimant ordering before implementation. Refundable tax credits are not automatically T5007 income.

Research gaps to resolve before claiming complete 2025–2026 coverage:

- Yukon modern formula, household tables, October 2025/2026 changes, rounding and commencement.
- Nunavut $300 authorizing instrument/effective date and Allowance/survivor interpretation; NT survivor scope.
- Alberta conflicting first-half 2026 single taper, minimum/threshold behavior and dated income exclusions.
- Manitoba junior terminal-band conflict, senior adjusted-income floor and terminal rows; 2026 MB479 ordering.
- Ontario precise legal earnings/deduction definition and 75+ companion tables; dated BC nonmaximum tables.
- Prior-year federal receipt inputs for NB and actual receipt versus computed current-income proxies for NS;
  NS December 31 birthday and NB 2026 mixed-benefit household wording.

User/orchestrator scope choices are limited and concrete: retain #19's disclosed current-income proxy or add
reference-year/actual-receipt inputs; allocate the missing ordinary MB refundable-credit prerequisite;
allocate Pioneer Utility Grant and assessed service grants to a housing/care follow-up; decide how to expose
unsupported institutional/geographic/survivor cases. These choices affect inputs and delivery sequence,
not whether the programs are material. No scope reduction or fabricated parameter is approved by this inventory.

## Short implementation plan

1. Resolve the evidence/input gates above, then take ownership of the currently busy `household.ts` before
   code work. Keep initial data coverage **2025–2026**, explicit unsupported historical senior scenarios, and
   a separately tracked History back-fill. Add a data-driven monthly/quarterly benefit module rather than
   year checks or one generic net-income taper. Share the existing federal monthly eligibility results;
   keep program-specific income definitions and tax reporting separate.
2. Proposed program ids / paths:

   | Rule path | Proposed program ids |
   |---|---|
   | GIS-linked declining monthly payments | `bc-seniors-gis-top-up`, `saskatchewan-seniors-income-plan`, `yukon-seniors-income-supplement` |
   | Flat monthly payment with positive federal eligibility | `nwt-senior-citizen-supplement`, `nunavut-senior-citizen-supplement` |
   | Private/program-income and category schedules | `ontario-gains`, `alberta-seniors-benefit`, `manitoba-55-plus-senior`, `manitoba-55-plus-junior` |
   | Annual prior-receipt / geographic payment | `nb-low-income-seniors-benefit`, `nl-coastal-labrador-seniors-supplement` |
   | Household AFNI benefit with payment periods | `nl-seniors-benefit` |
   | Current-tax-year refundable household credit | `quebec-senior-assistance`, `mb-personal-tax-credit` |
   | Refund after provincial liability is assessed | `ns-gis-provincial-tax-refund` |

3. Existing files requiring implementation edits: `src/data/schema.ts`; relevant province YAML in
   `data/years/{2025,2026}/provinces/` (all except PE for the retained unconditional paths);
   `src/engine/types.ts`, `household.ts`, `personal.ts`, `payroll.ts`, `credits.ts`, and exports in `index.ts`.
   Review `gis-allowance.ts`/`childcare.ts` for shared income/claimant plumbing without changing federal rules.
   Add a new supplement module and targeted tests. UI integration needs `src/ui/senior-benefits.ts`,
   `senior-editor.ts`, `app.ts`, `index.html`, `scenario-url.ts`, `history.ts` and associated codec/e2e tests
   for any new eligibility/reference-year fields and ledger rows. Update `docs/SCOPE.md` and this note.
   None of these files is authorized for editing in this phase.
4. Golden impact: **none in this inventory**. Preserve legacy scenarios without supplement inputs; use an
   explicit eligibility/participation contract rather than inferring every benefit from age or taxable Other
   income. Automatically enabling provincial cash for existing GIS opt-ins would change the qualifying BC,
   AB, SK, MB, ON, NB, NL, YT, NT and NU cases in `tests/golden/features/gis-allowance.json`, including benefits,
   totals and net-income-dependent tax/credits. Preserve those locked assumptions by adding separate cases,
   or document unavoidable task-required changes with independent complete recalculations; never re-capture.
   QC age-70+ scenarios with refundable credits enabled can also move. Implementing MB's ordinary refundable
   base can affect existing low-income MB results in `tests/golden/{2025,2026}.json` and feature fixtures,
   including adults without age fields; scope and verify that prerequisite explicitly. No unrelated province
   or year baseline may move, and counting only the new payment is insufficient where T5007 changes income.
5. Add independently verified cases for each retained path: published zero/nonmaximum/monthly bands, age
   55/60/65/70 and commencement boundaries, each marital/Allowance category, the last positive and first zero
   band, positive minimum versus exact zero, birthdays and cross-benefit-year months. Include AB January/July
   transitions and per-adult loss flooring; SK 1.90/2.10/6.55 and Allowance remainder branches; all MB senior
   schedules plus junior exclusions and terminal rows once resolved; ON mixed-age offsets and 2025 $87→$90;
   QC one/two seniors with one household taper; NB one/two-household and actual prior-year receipt; NS
   zero/$25/$500/$10,000 liability after existing credits; NL per-household quarterly schedules and Labrador
   geography; NT/NU full flat payment with tiny positive federal eligibility versus zero; YT October changes
   only after dated formulas are obtained. Add T5007 spouse attribution, net/taxable-income separation,
   benefits/cash conservation, unaffected payroll/pension-credit bases, switch/opt-in behavior, codec reload
   and unsupported-year tests. Expected values must come from published rows or written independent
   calculations of the **complete** tax/benefit interaction, not engine snapshots or the sizing study alone.

## Phase 2 final implementation

The engine now implements the supported retained paths for **2025 and 2026**, with current income standing
in for historical assessment income and existing OAS/GIS/Allowance elections supplying receipt status.
It adds no inputs. Ordinary residency, co-residence, continuing applications and independent living are
assumed. Cash programs follow receipt eligibility even when refundable credits are disabled; the four
refundable senior-credit paths follow `useCredits`. The page and its disclosures remain a stacked follow-up.

| Jurisdiction | Rule id | Ordinary full-year scale |
|---|---|---|
| BC | `bc-senior-supplement` | $1,191.60 single; $2,646 two pensioners |
| AB | `ab-seniors-benefit` | Single $3,868.08 / $3,946.08 after monthly upward cent rounding |
| SK | `sk-seniors-income-plan` | $4,320 single; $7,800 two pensioners |
| MB | `mb-55-plus` | $647.20 single; $1,391.20 two recipients |
| MB | `mb-senior-personal-credit` | $308 single senior maximum before the 1% family-income reduction |
| ON | `on-gains` | $1,062 / $1,092 single; two pensioners receive twice that |
| QC | `qc-senior-assistance` | $2,000 per eligible age-70 adult, one household reduction |
| NB | `nb-low-income-seniors-benefit` | $616 / $629 per eligible household |
| NS | `ns-gis-tax-refund` | Positive-liability refund $50–$10,000 per GIS recipient |
| NL | `nl-seniors-benefit` | $1,533.50 / $1,716.50 calendar maximum per household |
| NT | `territorial-senior-supplement` | $2,352 per full-year recipient |
| NU | `territorial-senior-supplement` | Estimated $3,600 per full-year recipient |
| PE | No new automatic path | Assessed SII ceilings $575–$1,800 remain outside this PR |
| YT | Explicitly unsupported | Inventoried YSIS maxima are material; modern taper remains unverified |

All ages, rates, amounts, table rows, reporting exceptions and effective-period parameters live in the
two years' province YAML. `seniorSupplements` is separate from the existing non-refundable `seniorCredits`.
In particular, SK supplementary bases, MB428-A age/family terms, NS's $1,000 age credit, PE's $250 reduction,
and Quebec's age/living-alone/retirement pool retain their existing calculation. No duplicate credit is added.
MB479's ordinary adult/dependant/child foundation is included only in a household containing a 65+ adult.

### Income reporting and cash conservation

Provincial entitlement is calculated after federal GIS/Allowance, using the pre-provincial historical-income
proxy. Neither provincial receipts nor their effect on current credits enters GIS eligibility. The federal
excess-dividend-credit proxy explicitly disables provincial supplements as well.

Cash recipients are recorded separately from tax reporters. Compare spouses' incomes excluding provincial
social assistance and before childcare deductions and OAS repayments; the higher-income spouse reports all
reportable payments, while a tie retains each recipient's amount. Federal line **14500** increases net income,
and line **25000** removes it from taxable income. It does not become working income, pension-credit income
or payroll income. Reportable assistance **is included in OAS recovery income** under ITA 180.2; line
25000 is a later taxable-income deduction. Current T778 ordering and net-income-tested credits use the
actual reportable receipts. No receipt is counted in both gross `cash` and `benefits`.

The issuer's $500 information-return exception is **not** a general recipient-income exclusion under
paragraph 56(1)(u). The implementation therefore reports every positive classified social-assistance amount
for AB/SK/MB/ON/NB/NT/NU. BC alone has a verified program instruction saying annual payments of $500 or
less need not be reported: test this per recipient/program before spouse attribution, retain all cash, and
report the full series above $500. This corrects the broader generalisations in earlier appendices.
[BC recipient bulletin](21-provincial-supplements/sources/bc-tax-slip.txt),
[CRA issuer guide](21-provincial-supplements/sources/federal-tax-slips.txt),
[federal recipient rules](21-provincial-supplements/sources/mbqc-phase2-federal-social-assistance.txt).

QC Senior Assistance, MB479 and NL's related GST benefit generate no line 14500 amount. NS is treated as a
statutory tax refund, with its reporting classification marked estimated. Quebec's federal-supplement
deduction remains separate from provincial assistance: T5007 social assistance would not automatically be
deductible at Quebec line 295. This scope creates no such Quebec provincial-assistance payment.

NL's new senior amount shares the ordinary income supplement's statutory payment timing. The new credit
entry includes the adjustment needed to reconcile the existing ordinary annual entry when the **combined**
quarterly payment is below $10. It is not sufficient to test only the senior portion. Ordinary non-senior
NL cases retain their existing baseline; a couple at $46,300 in 2026 has a $3.55 senior/timing adjustment
to the existing $22 ordinary entry, producing $25.55 in calendar-year combined payments.

### Explicit estimates and unsupported paths

- **BC:** the $100 mixed-Allowance protection is derived from the published table's plateau and reduction
  rows. Ordinary payment begins with the first positive federal month in this model; notification/processing
  lags and retroactive cash are not inputs. These conventions are marked estimated.
- **AB:** the calculator verifies the dated rates, separate recipient payments, per-adult $10 minimum,
  negative-income floor and nonbinding published income guidelines. Four-decimal intermediate precision,
  followed by upward cents, fits the near-zero oracle probes; this remains a labelled derivation. The
  official historic ASB audit and general CRA rules support the reporting classification; a current
  program-specific slip instruction remains unlocated. Generic deductions are not assumed to be RPP or
  employment expenses; only the separately identified RRSP deduction and published employment exclusion
  can be classified from the available inputs.
- **MB 55 PLUS:** the original enacted schedules supply the missing both-pensioner tail. Pay zero outside
  their listed positive domains and floor a negative non-pensioner offset at zero. Those interpretations,
  the administered junior terminal band despite the conflicting eligibility subsection, and assumed
  application in the first age-eligible quarter are labelled estimates. Junior instalments are one-quarter
  of the annual table amount; a person turning 55 in June receives three eligible quarters under this
  assumption, not a full annual amount. Sections 4(3)/5(3) prescribe quarterly instalments and application-
  quarter commencement in the [current regulation](21-provincial-supplements/sources/mbqc-mb-junior-regulation.txt).
  Income-tested assistance classification follows CRA and the policy
  manual; current Manitoba slip practice was not independently confirmed. Junior families containing an
  OAS/GIS/Allowance recipient remain unsupported because the frozen April 2011 pension-income adjustment
  is not verified. The supported senior payment can still apply in that household. Junior payments during
  the year of transition into OAS eligibility are also unsupported; the senior component begins separately.
- **SK:** apply the enacted SIP reduction coefficients to **basic** GIS/Allowance, excluding the additional
  federal top-ups. This interpretation is derived from the four administered home-category cutoff rows
  and is now labelled estimated. Including the top-up reduction contradicted the published positive tail.
  The detailed reconciliation and boundary arithmetic appear in the review-round section below.
- **MB479 2026:** statutory dollar parameters are confirmed; filing order provisionally continues 2025
  pending the final 2026 form. The spouse's $113 age term does not require an unused-age transfer.
- **NB:** prior-year age and receipt timing are preserved, with current federal rates/income as the proxy
  for prior receipt. This is estimated near historical federal cutoffs. Its T5007 classification is inferred
  from Statistics Canada's named methodological treatment and general CRA rules, rather than a verified
  NB slip promise. The household receives one annual payment, including mixed GIS/Allowance couples.
- **NS:** the refund is calculated after all existing provincial credits, including the age credit.
  Treating the statutory overpayment as a non-income tax refund remains an explicit classification
  inference. The ordinary cap is automatic; discretionary refunds above $10,000 are excluded.
- **NL:** the two calendar-half schedules and base-year ages are enacted. Annual formula totals are rounded
  to cents after the calendar-year/timing calculation; the administrator's cent-rounding sequence is
  unverified, so the entry is estimated. At $35,000, the raw senior calendar totals are $920.184 in 2025 and
  $1,161.8921 in 2026, modelled as $920.18/$1,161.89. Per-installment rounding can differ by a cent.
- **NU:** $300 continues the dated administrative report rate into both years. The authorizing amendment
  remains unlocated; the data explicitly says estimated rather than treating the stale $200 regulation as
  a verified current rate.
- **YT:** leave YSIS out rather than fabricate an unknown modern taper or dated October rates. The inventory
  records its material size. Pioneer Utility Grant and assessed-service programs remain in #216; coastal
  Labrador, survivors, care and separate-residence cases remain outside the approved scope.

The supporting closures and exact original-source hashes are in the
[evidence index](21-provincial-supplements/SOURCES.md) and linked regional phase-2 notes. No source was
added to the shared year-source index. There are no additional scope questions requiring user permission;
the evidence gaps above remain visible limitations for review and the page follow-up.

### Independent calculations and existing golden changes

[calculate.mjs](21-provincial-supplements/calculate.mjs) imports no engine code. It starts from immutable
pre-feature expectations at `1ecf27a`, transcribed published maxima and actual cached table rows, then
calculates each permitted new expectation. Its writer edits only the changed numeric tokens in named
cases. There is no bulk engine capture, tolerance change, input change, deleted assertion or unrelated
baseline rewrite. The obsolete separate gate note was removed; its useful reasoning is incorporated here.

**74 qualifying senior cases / 212 numeric expectations change** relative to the pre-feature baseline,
in `gis-allowance.json` and
`senior-audit.json`. All belong to 2025/2026 and receive a retained supplement. Counts below include the
two Ontario before-childcare cases in the latter fixture. Every annual `tests/golden/<year>.json` remains
unchanged. GIS eligibility/amounts, its income proxy, and unrelated values remain unchanged.

| Province | 2025 cases / values | 2026 cases / values | Reason |
|---|---:|---:|---|
| BC | 3 / 9 | 3 / 9 | New cash, remaining cash, net income |
| AB | 3 / 9 | 3 / 9 | New recipient payments and reporting |
| SK | 3 / 9 | 3 / 9 | SIP cash and reporting |
| MB | 4 / 12 | 4 / 12 | 55 PLUS; one high-net-income BPA interaction |
| ON | 15 / 39 | 15 / 41 | GAINS; reporting, OAS recovery, BPA, CCB, CWB and CARE |
| NB | 3 / 9 | 3 / 9 | One annual household payment and reporting |
| NT | 3 / 9 | 3 / 9 | Flat payments and reporting |
| NU | 3 / 9 | 3 / 9 | Estimated flat payments and reporting |

Representative complete recalculations:

- `2025-BC-single`: twelve $99.30 payments give $1,191.60 cash and reportable income. Total burden moves
  from −$13,082.82 to **−$14,274.42**; remaining cash from $21,873.96 to **$23,065.56**; federal net income
  from $21,921.96 to **$23,113.56**. GIS stays $13,130.82, OAS cash $8,791.14, taxable income $8,791.14.
- Ontario's 2025 current-net-income CWB case gains $1,062 GAINS but loses `.15 × 1062 = $159.30` CWB:
  $1,754.8835 becomes **$1,595.5835**. This is a reporting interaction, not a GIS reduction.
- Manitoba's 2025 high-income case gains $647.20 55 PLUS and owes `.15 × 647.20 = $97.08` more OAS
  recovery. Own net income becomes $203,201.886 from $202,651.766; the published BPA taper gives
  `15780 × (1 − (203201.886 − 200000) / 200000) = 15527.3711946`, or **$15,527.3712** at golden precision.
  Its 10.8% full credit is **$1,676.9561**. The recovered-GIS deduction also declines; taxable income stays
  $200,000 because this specimen is already recovering GIS after the OAS pension.
- Ontario's 2026 CARE case gains $1,092 GAINS. Family net income moves $45,998.44 → **$47,090.44**;
  first-band CCB falls `.07 × 1092 = $76.44` to **$7,537.2592**. CARE's income with childcare added back
  moves $53,998.44 → **$55,090.44**, crossing a published rate step from 53% to 51%; the $8,000 claim's
  credit becomes **$4,080** from $4,240. These fields combine the cash/reporting change with existing rules.

The calculator's new fixture supplies **258 separate household cases and 288 published monthly Ontario
rows**, covering all thirteen jurisdictions in both years. Each selected Ontario row tests its lower and
upper boundary. Cash minimums/zeroes, all marital categories, Alberta half-year rates and oracle cutoffs,
MB restored tails/junior conflicts, age/reference-year boundaries, refundable pools, NL combined-payment
timing, and tax-reporter/cash-recipient distinctions have separate coverage. Additional targeted tests cover
BC's exact $500/$500.01 reporting boundary, NS's liability minimum/cap, and tiny positive territorial federal
entitlements. Each household case compares federal GIS against the same case without provincial rules.

The bounded [mutation pass](21-provincial-supplements/mutate.mjs) killed **33/33** plausible rule mutations
in **33.6 seconds**, within a 120-second budget. It covers each new program family, reporting and the
line-25000 deduction. It restores the production files after each attempt, rejects invalid mutation runs,
and does not edit expectations. Final validation uses `npm ci` and `npm run check`; the PR records results.

### Review round 1: source reconciliation and regression coverage

Both verdicts on `4f6227b` were checked in full. All actionable findings are accepted. This revision merges
`origin/main` before final validation. The model/effort wording added there is followed in the PR body.

**Saskatchewan.** The official [administered table](21-provincial-supplements/sources/sk-current.txt)
publishes home-category zeroes of $4,560 single, $7,440 both pensioners, $11,808 spouse under 60 (October
2026), and $9,120 spouse receiving Allowance. The old formula wrongly added loss of the federal top-up to
the SIP reduction. [OAS Act 12.1](21-provincial-supplements/sources/r1-oas-12-1.txt) and
[22.1](21-provincial-supplements/sources/r1-oas-22-1.txt) distinguish those additional amounts from the
basic benefit. Applying the published SIP coefficients to basic-benefit reductions reconciles all four
home-category cutoff rows:

```text
single:   360 − 1.90 × floor(I / 24); first zero 190 × 24 = 4,560
both:     325 − 2.10 × floor(I / 48); first zero 155 × 48 = 7,440
Allowance spouse: 360 − 1.90 × ceil(basic Allowance loss / 3); first zero 190 × 48 = 9,120
neither:  360 − 6.55 × floor(max(0, I − rounded-OAS annual offset) / 48)
2026 Q4 neither offset: 12 × ceil(762.50 / 4) × 4 = 9,168; first zero 9,168 + 55 × 48 = 11,808
```

Apply the statutory $15 positive minimum after the reduction; exact zero stays zero. At $4,000 a single
gets `(360 − 1.90 × 166) × 12 = $535.20`, rather than zero. A single at $4,559.99 gets $15/month and
at $4,560 gets zero. Each of two pensioners at $7,439.99 gets $15/month; $7,440 yields zero. Mixed
categories have their own positive-tail/zero cases. Near an exact Allowance reduction step, scaled binary
roundoff protection prevents `ceil(189.00000000000003)` from prematurely eliminating a payment.
Only SIP reads the new basic-benefit helper; actual federal GIS/Allowance retains its original top-ups,
protection and eligibility. Interior SIP payments are a labelled derivation from the regulation's
coefficients and administered endpoints, rather than a claim to have found a complete provincial payment table.

**OAS recovery.** The earlier exclusion statement in this note was wrong.
[ITA 180.2](21-provincial-supplements/sources/r1-ita-180-2.txt) defines adjusted income from Part I income;
its exclusions do not include paragraph 56(1)(u) assistance. The
[CRA line-23500 instructions](21-provincial-supplements/sources/r1-cra-23500.txt) start with line 23400
and list the permitted adjustments, without subtracting line 14500. The line-25000 deduction affects
taxable income later. Reportable assistance now enters recovery income before the repayment is calculated;
it remains excluded from GIS assessment and the reporter comparison. Current recovery is also passed to
the before-childcare income breakdown consistently.

For the $100,000 private-income Ontario specimen, independent arithmetic from the published annual
OAS/GIS/GAINS totals and worksheet thresholds gives:

| Year | Recovery-income calculation | Recovery at 15% | Taxable income |
|---|---|---:|---:|
| 2025 | `100000 + 8791.14 + 7903.95 + 1062 = 117757.09` | 3,645.4635 | 105,145.6765 |
| 2026 | `100000 + 8999.49 + 8091.42 + 1092 = 118182.91` | 3,428.9865 | 105,570.5035 |

Subtract the $93,454/$95,323 worksheet threshold before multiplying by 15%. These repayments rise by
$159.30/$163.80. At $150,000 private income, recovery rises by the same amounts, while the remaining
deductible federal supplement declines equally, leaving taxable income $150,000. Fully capped repayments
stay capped. Net-income and BPA fields in the partial-recovery cases are independently recalculated as
well; counting only the additional repayment would leave the golden interaction incomplete.

**Children, reporter paths and breakdown.** The refundable helper receives the resolved child count and
eligible ages used by `household.ts`. MB479 includes an age-18 child even when supplied only through the
childcare profile: `195 + 113 + 26 − .01 × 25000 = $84`. For 2026 NL at $46,300, a derived age-10 child
makes the ordinary amount `254 + 266 + 231 − .09 × 6300 = $184`. The combined payment exceeds $10, so
the senior calendar-half amount is `$29.1094 / 2 = $14.5547`, rounded $14.55 rather than accelerated $29.11.
No-GIS Alberta and MB junior receipts now expose net-income and provincial-income breakdowns, using
the same values already used for taxation.

Every reachable survivor has a separate independently calculated case:

- AB's identified $10,000 RRSP deduction restores the maximum on $10,000 private income; no OAS election
  pays no ASB. Neither is conflated with the existing generic-deduction specimen.
- MB junior at $10,500 wages deducts $346.50 base CPP, $70 enhanced CPP, $172.20/$171.15 EI and $500 work
  expenses. The resulting $9,411.30/$9,412.35 selects the enacted $282 annual row; omitting base CPP pays zero.
- MB479 explicit and childcare-derived age-18 children each preserve the $26 term.
- NT's senior on GIS with a 59-year-old spouse at $12,000 other income keeps the $2,352 reportable
  payment. Omitting GIS from the reporter comparison wrongly moves it to the spouse.
- An Alberta couple has equal pre-childcare/recovery incomes of OAS plus $10,000, one ASB recipient and
  $6,000 childcare. A tie keeps ASB on that recipient, making the spouse the T778 claimant. Omitting
  assistance instead claims it on the first adult. Each adult has $10,000 verified eligible wages.

The statutory reporter-comparison exclusion remains explicit (`recoveryOverride: 0`). Opus's second-round
verdict reports that its recovery-in-comparison mutation now fails the affected tests, superseding our
earlier blanket statement that this path lacked mutation coverage. A separate explicit `0 → undefined`
override probe still survives the senior-supplement, GIS and senior-audit suites in our rerun; that variant
is not counted among our killed mutations. The reviewers' reported mutation and this probe are distinguished
because no exact reproduction of Opus's edit was supplied.

Relative to reviewed head `4f6227b`, **10 legacy cases / 26 values** change for recovery/reporting and
**six existing SIP feature cases / 12 values** change for the basic-GIS correction. All sixteen existing
cases are 2025/2026 seniors. There are **45 additional household cases**, bringing the separate fixture to
258. Its old case inputs and assertion shapes stay unchanged; six old SIP case names are retained even
where they describe the former erroneous cutoff. The whole-fixture
[audit](21-provincial-supplements/audit-goldens.mjs) verifies the independent proposals, unchanged inputs,
unchanged GIS fields and byte-identical annual fixtures. Relative to the pre-feature baseline, the final
legacy count is **74 cases / 212 values**: **37/105** in 2025 and **37/107** in 2026, as tabulated above.

### Review round 2: before-childcare recovery coverage

Production code remains unchanged. The two Ontario assistance/partial-recovery feature cases now also
assert the first adult's before-childcare income. Neither case claims childcare, so the independent
calculation is line-23400 income less the assistance-adjusted repayment already calculated above:
`117757.09 − 3645.4635 = $114111.6265` in 2025 and
`118182.91 − 3428.9865 = $114753.9235` in 2026. These expectations come from the same published
OAS/GIS/GAINS totals and line-23500 worksheet, through the calculator without engine imports.

Omitting assistance when calculating the recovery passed to this breakdown overstates it by
`.15 × 1062 = $159.30` in 2025 and `.15 × 1092 = $163.80` in 2026, despite correct current net income.
The regression adds two assertions to existing feature cases; it changes no earlier expectation,
household input, GIS result or annual golden. The fixture remains 258 household cases and 288 monthly
rows, and the pre-feature impact remains 74 cases / 212 values.

The bounded mutation pass now includes that exact omission from the household recovery calculation;
both partial-recovery cases fail on it. All 33 listed mutations are killed, and production files are
restored before the full checks run. The exploratory reporter-comparison probe described above is separate
from this claimed total.

### Final rule paths and follow-up plan

`src/engine/senior-supplements.ts` owns the program ids listed above, cash eligibility, recipient payments,
reporting attribution and refundable equivalents. `household.ts` orders entitlement before current reporting
and tax/refund calculations; `payroll.ts`, `personal.ts` and `types.ts` carry the separate line-14500 amount.
`src/data/schema.ts` defines the optional rule collection; only the 2025/2026 province data activates it.
`tests/senior-supplements.test.ts` and its separate feature fixture provide the new independent cases.
The existing GIS invariant now includes the difference in provincial reportable receipts; its taxable-income,
cash-conservation and working-income assertions remain intact.

After engine review, the stacked page branch must expose the new ledger/reporting breakdown and disclose
the proxy, estimates and unsupported paths in the existing senior UI/tooltips. It owns `src/ui/**`, relevant
codec/e2e files and `docs/SCOPE.md`; this PR changes none of them. Resolve the listed source gaps before
adding unsupported paths. Historical back-fill belongs in a separate History issue at merge.

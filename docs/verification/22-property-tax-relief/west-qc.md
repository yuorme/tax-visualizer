# Alberta, Saskatchewan and Quebec evidence for #22

Inventory only, checked **2026-11-05**. All amounts are CAD. This supplements the main #22 report;
no production files or goldens changed. Representative calculations below are independent arithmetic,
not observed recipient averages unless explicitly identified as such.

## Evidence status

Cached extracts in `sources/west-qc-*.txt` record the official URL, retrieval date and original SHA-256.
They use the repository's extraction helpers without writing its annual indexes. Revenu Québec HTML
was readable through the web tool, but direct retrieval returned `Error: 403 `, including its alternate
`www-prd` host (`403 Forbidden`). The official Finance tax-expenditure page and Montreal page were
downloadable. The July 2026 shelter brochure and September 2025 Gazette also downloaded successfully.
Guessed older brochure/form PDF paths returned `410`; they are not evidence. The former official
2025–2026 shelter-information URL returned `(410) Gone` through the web tool. These gaps do not mean
the programs are immaterial.

## Alberta

**No province-wide recurring senior property-tax grant or senior renter-tax-credit increment was found**
in the provincial [seniors program inventory](sources/west-qc-ab-directory.txt) and tax-relief sources checked
for 2025–2026. Alberta Seniors Benefit is a living-expense supplement, assigned to #21; do not add a second
property credit simply because that program distinguishes accommodation types. This is a bounded search
conclusion, not proof that every Alberta municipality offers no assistance.

**Seniors Property Tax Deferral Program — out, both years, because it is repayable.**
The [official program](sources/west-qc-ab-deferral.txt) requires one owner/spouse age 65+, three months'
Alberta residence, principal-residence ownership and at least 25% equity; there is no income test.
It finances all or part of the residential bill, including education taxes. Illustratively, a $4,000 bill
can become $4,000 loan principal; permanent tax forgiveness is **$0**, with interest payable separately.
The live interest quote is not a fixed 2025 or 2026 annual tax-benefit parameter.

**Calgary Property Tax Assistance Program — out of #22's age-related scope, not excluded as immaterial.**
The [2026 city page](sources/west-qc-ab-calgary-assistance.txt) covers owners of any age with at least
365 days on title, no other Calgary property and a year-over-year tax increase. Physical/owner-initiated
assessment changes and specified supplementary assessments are excluded. Assistance offsets the eligible
increase. A representative $4,000 prior bill rising to $4,200 therefore implies **$200 annually**, subject
to approval; a published recipient average was not found.
The [current Fair Entry income table](sources/west-qc-ab-calgary-income.txt) uses total income, line 15000,
for adult related family members at the address: $31,906 single, $39,721 two people, then $48,832/$59,288/
$67,244/$75,839/$84,436 for three through seven people. The cached table is current 2026 information;
its 2025 values and exact accepted income-document year need a dated application before implementation.
Any future general municipal-relief feature must use city identity, prior levy and relief-already-in-bill status.

Municipal senior grants exist elsewhere: [St. Albert's 2026 grant](https://stalbert.ca/home/assessment/payments/seniors/)
is **$200**, age 65+ on May 1 and receiving GIS, credited directly to the owner's tax account. It is outside
Calgary and must not be treated as province-wide; its 2025 amount was not independently established here.

## Saskatchewan

**No province-wide recurring senior property-tax grant or age-related renter-tax-credit increment was found**
in the provincial property-tax programs checked for 2025–2026. The existing SK low-income tax credit has no
tenure/age adjustment; its ordinary credit must not be duplicated. The senior supplementary income-tax
amount is already a separate #17 rule, and Seniors Income Plan belongs to #21.

**Seniors Education Property Tax Deferral Program — out, both years, repayable loan.**
The [official program](sources/west-qc-sk-deferral.txt) requires age 65 in the current year, principal-residence
ownership/occupancy, household income below $70,000, 25% equity, insurance and good standing.
The [official linked application](https://publications.saskatchewan.ca/api/v1/products/89454/formats/106303/download)
uses previous-year returns/assessments for occupants aged 18+, excluding tenants, and expressly includes
other occupants' gross income. Do not substitute applicant-and-spouse net income. The application is an
April 2018 publication still linked by the live program; no contrary 2025–2026 rule change was located.
Its [Q&A](https://publications.saskatchewan.ca/api/v1/products/89453/formats/106302/download) confirms simple
interest and that the resident remains responsible for paying the tax bill. A $2,000 school levy can generate
up to $2,000 loan proceeds, **$0 tax forgiven**. The current application was readable through the web tool,
but direct Node fetching failed with `TypeError: fetch failed`; it is not represented as a hashed cache.

**Saskatoon low-income seniors property-tax deferral — out, both years, repayable.**
The dated [2025 application](sources/west-qc-sk-saskatoon-deferral-2025.txt) and
[2026 application](sources/west-qc-sk-saskatoon-deferral-2026.txt) require 65+, ownership/occupancy and
previous-year total income (form says line 150) of all adult residents within LICO. Single/couple limits
are **$26,926/$33,519 in 2025**, **$27,478/$34,206 in 2026**. Municipal and library taxes may be deferred
in whole or part until sale, transfer or loss of occupancy. A $3,000 municipal/library bill deferred in full
is $3,000 postponed and **$0 forgiven**. This is separate from the provincial school-tax loan.

## Quebec

**Grant for Seniors to Offset a Municipal Tax Increase — in, 2025–2026; needs explicit assessment inputs.**
The [official Finance rule and expenditure report](sources/west-qc-qc-grant-finance.txt) identifies a recurring
refund for a long-held principal residence, with a new assessment-roll increment capped at **$500**, plus
grants attached to the property's last year under the preceding roll. Thus $500 is not necessarily the total
household ceiling. Prior-year family net-income caps are **$62,900 for the 2025 bill** and **$64,200 for 2026**.
The 2023 published cost/recipient figures imply **$1,900,000 / 13,077 = $145.29 per recipient**; this is an
implied mean from a rounded estimated cost, not an observed payment mean or a 2025–2026 forecast. A $300 increment
plus $100 previous-roll grant would be $400, subject to the final claim's allocation rules. Retain it as material.

The [2026 RQ eligibility page](https://www.revenuquebec.ca/en/citizens/tax-credits/grant-for-seniors-to-offset-a-municipal-tax-increase/)
requires Quebec residence, age 65+ and 15 consecutive years' ownership at December 31, 2025; a spouse's
pre-transfer ownership can count. The dwelling must be entirely residential, one unit, principal residence,
with a 2026 bill. Income is both spouses' Quebec **line 275**, not federal taxable income. The 2025 government
[seniors guide](https://cdn-contenu.quebec.ca/cdn-contenu/services_quebec/Guide_Senior_EN_2025.pdf) states the
corresponding December 31, 2024 test for the 2025 bill. Filing on the prior-year return does not turn the
next year's municipal grant into a prior-calendar-year cash receipt.

Montreal's [dated 2026 explanation](sources/west-qc-qc-montreal-grant.txt) describes the **same provincial
grant**, not an extra municipal grant. The 2026–2028 roll valuation threshold is **18.41%**.
Use the city-issued potential grant; home value alone cannot reconstruct it. Independently verify the
form/law's exact assessment formula and co-owner allocation before coding; the Finance description's
7.5% wording must not be converted casually into a 7.5-percentage-point threshold. No deferral is involved.

**Shelter Allowance Program — material age-gated housing assistance; retain as an explicit scope decision.**
It is not an existing engine credit. It supports owners, private-market tenants and boarders when the applicant
or spouse has a dependent child or reaches **50 by the benefit period's end**. HLM/PSL-subsidized dwellings and
specified institutional accommodation are excluded. Assets at prior December 31 must be **at most $50,000**
in bank accounts/TFSA/investments, excluding registered plans and FHSA. It is a housing transfer, so decide
explicitly whether #22 includes it or assigns it to a housing-benefits follow-up; **do not cut for small size**.

The [2025 Gazette, sections 5–8](sources/west-qc-qc-shelter-gazette-2025.txt) gives the October 2025–September
2026 rules. Annual tiers are **$1,200/$1,800/$2,040** for housing-cost ratios **[30%,50%)/[50%,80%)/80%+**.
Income $0 is deemed in the highest ratio. Reduce the annual tier dollar-for-dollar above these family thresholds:

| Benefit period | Income reference | Single 50+ | Couple, no children | Couple 1 child / single parent 1–2 | Couple 2+ / single parent 3+ |
|---|---|---:|---:|---:|---:|
| Oct 2025–Sep 2026 | 2024 | 22,900 | 32,200 | 39,500 | 45,500 |
| Oct 2026–Sep 2027 | 2025 | 23,600 | 33,100 | 40,600 | 46,800 |

2026 thresholds and reduced-income caps are published in
[RQ's eligibility page](https://www.revenuquebec.ca/en/citizens/your-situation/low-income/shelter-allowance-program/eligibility-shelter-allowance-program/)
and [July 2026 brochure](sources/west-qc-qc-shelter-brochure-2026.txt). For each tier the final zero is its
threshold plus $1,200/$1,800/$2,040, respectively. Income is prior-year combined Quebec line 275, adding
child support received above $6,000 per child and subtracting child support paid; see
[RQ's definition](https://www.revenuquebec.ca/en/definitions/2025-family-income-shelter-allowance/).

For 2025–2026 housing costs, the Gazette provides annual energy/insurance allowances of **$1,301/$434**
for an apartment; homeowners add **$5,997** for energy/maintenance/insurance, previous-year property tax and
mortgage interest. Contributions from others reduce costs; rent including personal services loses 27%.
The [2026–2027 cost page](https://www.revenuquebec.ca/en/citizens/your-situation/low-income/shelter-allowance-program/calculating-the-percentage-of-your-income-you-spend-on-housing/)
publishes **$1,340/$445** apartment allowances and **$6,139** homeowner allowance. Example: single age 67,
$22,000 reference income, $900/month apartment rent with heat included: $(10,800+434)/22,000=51.06%$,
giving **$1,800 annually** in 2025–2026. With no other changes, 2026–2027 is 51.11%, also $1,800.
These examples establish material size independently of engine output. Calendar-year 2025 Jan–Sep
2024–2025 parameters remain uncollected; do not use the October 2025 rules for those nine months.

**Existing Quebec solidarity credit — preserve once.** The engine already includes its housing component
for owners/renters and uses Quebec family net income. There is no separate age-65 housing addition in
the checked 2025–2026 data/rules. Home-support/service credits concern eligible services, not a property-tax
bill rebate; they must not be inferred from total rent or deducted from municipal taxes as another #22 grant.

## Implementation implications for these jurisdictions

Proposed QC program ids: `qc-senior-municipal-tax-increase-grant` and, only if accepted here,
`qc-shelter-allowance-cost-ratio`. Both require data entries for 2025/2026 and schema validation. The municipal
grant needs prior ownership eligibility, municipal potential grant and prior-roll carryover/co-owner inputs;
shelter allowance needs assets, dwelling/subsidy status and actual eligible housing-cost components plus
reference-year income. Neither can be inferred safely from present home value, annual tax and age alone.

Existing `src/engine/credits.ts` solidarity handling must remain once; add property-relief evaluation in a
dedicated engine module, integrated by `household.ts`, then UI inputs/tooltips and `scenario-url.ts` serialization.
No AB/SK production benefit should be added for a loan. Existing ordinary AB/SK/QC goldens should remain;
new QC cases cover age/15-year/income eligibility, previous-roll carryover, co-owners and bill already net of
relief. If housing allowance is included, add age-50, asset-$50,000, ratio-30/50/80%, dollar taper, zero-income
and October-period boundaries with independent calculations. Add year-specific data and golden fixtures
without recapturing the ordinary baseline.

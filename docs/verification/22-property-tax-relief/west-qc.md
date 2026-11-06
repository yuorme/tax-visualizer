# Alberta, Saskatchewan and Quebec evidence for #22

Inventory only, checked **2026-11-05**, with phase 1b evidence reconciliation on the same date.
All amounts are CAD. This supplements the main #22 report;
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
The phase 1b law/form checks below resolve the earlier assessment and co-owner questions. This is a provincial
grant, so it is distinct from a local cancellation available only on the app's default reference-city bill.
Use a municipality-issued potential grant for the actual property; home value or a custom total bill alone
cannot reconstruct it. No deferral is involved.

### Phase 1b: assessment formula and claim allocation — closed

Both final forms are cached: [2025 grant on the 2024 return](sources/gap-quebec-form-2025-grant.txt),
TP-1029.TM-V (2024-11), and [2026 grant on the 2025 return](sources/gap-quebec-form-2026-grant.txt),
TP-1029.TM-V (2025-11). Their page 2 calculation is the same apart from the year references:

```text
wholePropertyGrant = currentYearPotentialGrant + precedingRollFinalYearGrant
claimantGrant = wholePropertyGrant − totalGrantsClaimedByOtherCoOwners
```

The current-year potential amount (line 41) comes from that year's municipal bill or municipal potential-grant
notice and has a $500 maximum. Line 43 is the **total actually awarded to all co-owners** for the final year
of the preceding roll. It is not just the present claimant's prior claim, not last year's grant if last year
was already in the current roll, and not a new grant that can be added repeatedly within the same roll.
Line 45 subtracts other co-owners' claims on the corresponding prior-year returns. Each claiming co-owner
files a separate form. [Municipal Taxation Act s.210.14](sources/gap-quebec-grant-2017-amendment.txt)
limits the combined claims to one whole-property entitlement; co-owners agree their allocation, and the
Minister can allocate it if they cannot agree. There is **no automatic ownership-percentage split** in
this rule. Each claimant still independently needs the age, ownership, principal-residence and family-income
eligibility. In particular, a non-owner senior spouse cannot be assumed to qualify just because the other
spouse owns the property. A spouse who receives ownership can count the transferring spouse's ownership
years under the form's deemed-ownership rules.

The applicant must still own and principally reside in the property on the municipal billing date, even
if eligible at the preceding December 31. The bill may be in another co-owner's name. Attach the form to
line 462 of the preceding return, keep the bill six years, and apply by December 31 of the fourth year
after the grant year (2025 grant: 2029; 2026 grant: 2030). If review changes the potential grant after
filing, the form requires an adjusted return and updated form within 60 days.

The normative assessment calculation is in the
[2017 Gazette, s.44, inserting ss.210.7–210.10](sources/gap-quebec-grant-2017-amendment.txt),
**read with the later [2021 Gazette, s.13 cap amendment](sources/gap-quebec-grant-2021-cap-amendment.txt)**.
The 2021 amendment removes the old $500 cap on the entire grant and instead caps the current-roll product;
it applies to applications filed after September 23, 2016. Reading the old 2017/2018 text alone would give
the wrong cap for both target years. For a roll without assessment averaging:

```text
D = round4(F / G + 0.075)
excessValue = max(0, B − C × D)
newRollAmount = min(500, A × excessValue)
wholePropertyGrant = roundToWholeDollar(newRollAmount + E)
```

- `B` is the property's value on the current roll on deposit; `C` is its value on the previous roll as it
  stood immediately before the current roll's deposit. Assessment-review adjustments follow ss.210.11–210.12.
- `F` and `G` are current/prior **average dwelling values** from assessment-roll-summary dwelling lines
  501, 502 and 514: sum the listed values and divide by their dwelling counts. These are not the average
  total property values of all municipal property classes. Round each quotient to four decimal places.
- `A` is the sum of the prescribed ad-valorem municipal rates applicable to the property in the **first
  year of the current roll**: general property tax, qualifying municipality-wide special property taxes,
  specified former-municipality debt tax, Montreal borough tax where applicable, and agglomeration tax.
  Flat charges, school tax and arbitrary current bill components are not interchangeable with `A`.
- `E` is the awarded grant for the preceding roll's last year, across all owners, as in form line 43.
- Section 210.8 rounds the final grant to whole dollars (first decimal digit 5+ rounds upward) and the
  average-value quotients and `D` to four decimals (fifth decimal digit 5+ rounds upward).

Thus the threshold adds **7.5 percentage points** to the average valuation increase. It does not multiply
that increase by 1.075. Montreal's 18.41% threshold is consistent with `F/G = 1.1091`, giving `D = 1.1841`;
this is an algebraic reconciliation, not a separately observed Montreal average. At exactly that threshold,
new excess value is zero, although `E` can still yield a grant.

Section 210.9 substitutes first-/second-year fractions of one-third/two-thirds when the municipality averages
the assessment variation over three years, or one-half for the first year of two-year averaging. This is a
further reason to use the **year-specific municipal potential amount** instead of estimating it from home
value. Phase 2 should consume that published amount; it need not reproduce the municipality's roll system.
The precise cap placement for a newly implemented municipal averaging calculator is not independently
resolved here and is unnecessary for the proposed potential-amount input. Do not invent an averaging amount.

Independent correctness cases for the proposed claim path:

- Current-year potential $300 and preceding-roll final-year awards $100 -> property entitlement **$400**.
  If another qualifying co-owner claims $150, claimant gets **$250**; both together remain $400.
- Current-year potential $500 and preceding-roll awards $120 -> **$620**, rejecting a total $500 cap.
  Two qualifying spouses can allocate $620/$0 or $300/$320; they cannot both claim $620.
- At `A = 0.006`, `C = $300,000`, `F/G = 1.10`, no averaging, `D = 1.1750`:
  `B = $352,500` gives $0 new amount; `B = $400,000` gives **$285**; `B = $500,000` gives the
  **$500** new-roll maximum. Add any valid `E` after that cap, then reconcile co-owner claims.
- Whole-property unrounded grants $223.49/$223.50 round to **$223/$224**. This rounding belongs to the
  municipality's whole-property grant calculation, not independent rounding of every co-owner's share.
- A 2026–2028 roll uses **2025** as the previous roll's final year for line 43; a 2025–2027 roll uses
  **2024** even when computing a 2026 claim. Both examples are explicit in the 2026 form's footnote 2.

**Search record:** found the live RQ form catalogue and followed its official PDF link to the 2025-11 form;
the matching 2024-11 PDF also downloaded and closes the 2025 form gap. An initially guessed 2024-12 path
returned HTTP 410. Direct current Légis Québec HTML/PDF downloads returned HTTP 403 and web PDF opening
returned 502; an indexed current September 2025 PDF confirms the formula/cap, while the raw 2017 and
2021 Gazette publications provide separately hash-verifiable enactment text. The linked July 2018 historical
Act exposed the old total-cap wording and was **not** used as the current cap. No original hash is claimed
for a blocked current consolidation. No further RQ claim-allocation evidence gap remains for the input path.

**Shelter Allowance Program — out of #22, assigned to [#216](https://github.com/yuorme/tax-visualizer/issues/216).**
It is not an existing engine credit. It supports owners, private-market tenants and boarders when the applicant
or spouse has a dependent child or reaches **50 by the benefit period's end**. HLM/PSL-subsidized dwellings and
specified institutional accommodation are excluded. Assets at prior December 31 must be **at most $50,000**
in bank accounts/TFSA/investments, excluding registered plans and FHSA. The user assigned this housing
transfer to #216; the UI must state that it is not modelled. This is **not a small-size exclusion**.

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
These examples establish material size independently of engine output. The user selected annual benefit-year
entitlement, not calendar-year cash. Missing January–September 2025 cash-period parameters therefore do not
block #22; any future housing implementation belongs to #216 and must label its own benefit period.

**Existing Quebec solidarity credit — preserve once.** The engine already includes its housing component
for owners/renters and uses Quebec family net income. There is no separate age-65 housing addition in
the checked 2025–2026 data/rules. Home-support/service credits concern eligible services, not a property-tax
bill rebate; they must not be inferred from total rent or deducted from municipal taxes as another #22 grant.

## Implementation implications for these jurisdictions

Proposed #22 QC program id: `qc-senior-municipal-tax-increase-grant`, with 2025/2026 data and schema validation.
It needs ownership/eligibility, the year-specific municipal potential grant and the preceding roll's final-year
total awards plus other co-owner claims. The two final forms now source that claim path. Do not infer these
values from present home value, annual tax and age alone. The grant is provincial even though municipalities
calculate the potential amount; it is not an extra Montreal municipal cancellation. Local-only relief applies
only to default reference-city bills under the user's decision, while a supplied provincial-grant amount needs
its own actual-property evidence. Existing saved bills stay gross; offer an explicit net-bill choice and record
known relief already applied to prevent duplicate subtraction. Entitlement is annual for the labelled benefit year.

Existing `src/engine/credits.ts` solidarity handling must remain once; add property-relief evaluation in a
dedicated engine module, integrated by `household.ts`, then UI inputs/tooltips and `scenario-url.ts` serialization.
No AB/SK production benefit should be added for a loan. Existing ordinary AB/SK/QC goldens should remain;
new QC cases cover age/15-year/income eligibility, previous-roll carryover, co-owners and bill already net of
relief. Housing-allowance implementation and its age/asset/cost-ratio tests belong to #216, not this branch.
Add year-specific data and golden fixtures
without recapturing the ordinary baseline.

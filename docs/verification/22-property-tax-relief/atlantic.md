# Atlantic property-tax relief inventory, 2025–2026

Research for #22, checked **2026-11-05**. Inventory only; production files and golden expectations unchanged.
Dollar examples are independent illustrations, not observed recipient averages unless explicitly identified.
The main issue note integrates these regional findings.

## New Brunswick

**No province-wide recurring senior property-tax grant/rebate or senior renter-credit increment identified for
2025 or 2026.** The official [property-program directory](sources/atlantic-nb-program-list.txt) lists the
senior deferral and the general Low-Income Seniors' Benefit. It does not establish that no municipality has
any local relief. No senior grant was identified for the reference city, Moncton; do not turn that search
result into a claim that every NB municipality has none.

**Property Tax Deferral Program for Seniors — out because it is repayable, not because it is small.**
At least one deed owner is 65+, the property is the principal residence receiving the Provincial Residential
Tax Credit, and the tax account must be in good standing. It defers the increase above the base year:
the latest of the year before turning 65, purchase year and 2011. Deferred taxes and interest become a lien
payable on sale or transfer; the surviving resident spouse can continue. The
[official program](sources/atlantic-nb-deferral.txt) gives an independent example of a $100 annual deferral
on a $2,100 bill versus a $2,000 base-year bill. That is $100 financing and **$0 tax forgiven**.
An observed 2025/2026 typical recipient amount was not found.

The current page uses prior-year tax-return household income to set interest, describes it as **taxable
household income**, and quotes 3.949% below $124,178 and 8.949% above it. These are undated current-page
values, **not independently verified 2025/2026 interest schedules**. The rates change with the provincial
borrowing rate. Nothing needs to be estimated in tax results because the program is excluded.

**Low-Income Seniors' Benefit — out of #22; separate provincial cash-benefit category.** It is not tied to
property ownership or tax paid. It is material: **$616 for 2025**, **$629 for 2026**, normally one per
co-resident couple. The [2025 form](sources/atlantic-nb-cash-2025.txt) requires NB residence on December 31,
2024 and receipt of GIS, Allowance or Allowance for Survivor in 2024. GIS recipients must be 65+;
Allowance recipients 60–64. The [April 2026 release](sources/atlantic-nb-cash-2026.txt) confirms the new
amount and federal-benefit eligibility; do not substitute a property-tax income taper. These eligibility
tests inherit the relevant federal income definition rather than current gross household income.

## Nova Scotia

**Property Tax Rebate for Seniors — in.** Annual rebate is `min($800, 50% × eligible paid residential taxes)`.
The [2025 application](sources/atlantic-ns-rebate-form-2025.txt) covers **2024 bills paid in full** and
requires GIS eligibility at 65+ or Allowance eligibility at 60–64 **in 2025**. The
[2026 program page](sources/atlantic-ns-rebate-2026.txt) covers **2025 bills paid in full**, primary-residence
occupation in 2025 and GIS/Allowance eligibility **in 2026**, with December 31, 2026 deadline.
These are benefit/program years, not identical bill years.

The [regulations](sources/atlantic-ns-rebate-regulations.txt) define program year as the calendar year
immediately after the rebate year and allow only one rebate per property per program year. They include
specified deceased-applicant and multiple-owner rules. The program has no independent dollar income
threshold: it uses eligibility for the named federal supplement. Therefore reuse the verified GIS/Allowance
income definition and benefit-period eligibility; do not test generic line 23600 or gross pension receipts.
The primary form explicitly includes Allowance recipients younger than 65; an age-65-only implementation fails.

Exclude commercial/resource portions and **municipal exemptions or rebates** from the eligible bill before
the 50% calculation. A net bill with the municipal exemption already deducted must not be reduced again.
The official 2026 page's worked example yields $485.89 on $971.77 eligible tax after exclusions.
For a modest reference home valued at $300,000, the engine's 0.61% rate gives a $1,830 bill;
assuming this is the relevant prior-year paid residential bill, the rebate is **$800**. On $1,000 eligible
tax it is **$500**. With $1,000 municipal relief already applied to the $1,830 bill, NS relief is
`0.5 × ($1,830 − $1,000) = $415`, not $800.

**Halifax Partial Property Tax Exemption — municipal overlap and a 2026 GIS exception retained.**
The [2025/26 guide](sources/atlantic-ns-halifax-guide-2025.txt), PDF page 4, publishes gross household
income bands of $0–33,000, $33,001–37,000, $37,001–41,000, $41,001–45,000 and $45,001–49,000.
Rebate percentages across the bands are 100%, 80%, 60%, 40% and 20%. The lowest-income maximum is
$1,200 for tax up to $2,500, $1,300 for $2,501–3,500 and $1,400 above $3,500. Minimum tax payable
across income bands is $170/$350/$390/$430/$470. This is a substantial relief program, not immaterial.

Registered owner/co-owner must occupy the property as permanent residence; include the income of all
adult residents, with supporting CRA current NOAs showing line 15000 and specific world-income/business
documents where applicable. The [Administrative Order 10](sources/atlantic-ns-halifax-ao10.txt),
sections 2(b), 3.4 and 4.1–4.4, uses **prior-calendar-year income**, with its own enumerated exclusions
(including child benefits, GST/HST and oil rebates, specified veterans' allowances/pensions). Do not
equate its household to only the two spouses or its income to federal AFNI.

AO10 section 6.1 means minimum tax payable is a floor on the **remaining bill**: greater of $100 and
1% of the income-band midpoint rounded to $10. It is not a deduction from the table's grant in every case.
Example under the 2025/26 table: a $1,830 bill and qualifying household income at most $33,000 produce
`min($1,200, $1,830 − $170) = $1,200` relief, leaving $630. If $630 is the bill for the relevant NS rebate
year, provincial relief is then $315. Do not apply the municipality's and province's maximum independently.

AO10 amendment 6 was approved May 13, 2025 and is **effective April 1, 2026**. Sections 3.8–3.9 limit
ordinary eligibility to taxable assessed value of **$425,000 or less**, but waive that cap where the owner
receives GIS or specified federal/provincial disability support. This is a real age-related/GIS pathway
in the 2026/27 fiscal year. **2026/27 annual rebate-table dollars and income bands were not verified**;
do not publish the 2025/26 table as 2026/27 data. Taxable assessment and market home value are distinct.

The Halifax deferral/payment-plan components are **out**: section 8.1 permits exemption and deferral
together, but only the exemption forgives tax. Deferring the residual $630 in the illustrative example
is $630 cash-flow financing with **$0 additional tax relief**. An observed typical annual deferral was not found.
The municipality's annual fiscal-year table also needs an explicit annualization convention for the app.

## Prince Edward Island

**No recurring province-wide senior property-tax grant/rebate or age increment to a renter credit identified
for 2025 or 2026.** The existing ordinary resident credit is already reflected in the reference rate:
see [the separate owner-credit verification](../86-charlottetown-owner-credit.md). Do not subtract that
credit again; the existing 1.67% reference rate contains the net 1% provincial levy. Separate historic
ownership/assessment credits are not senior-specific and require their own histories or a net custom bill.
No senior-specific Charlottetown property grant was identified in the primary material checked.

**Seniors Property Tax Deferral Program — out, repayable.** Age 65+, principal residence occupied for
the qualifying preceding-year period, and annual household income **less than $42,000**. The
[May 30, 2024 provincial release][pe-size] establishes that the old $35,000 threshold was raised then;
the [November 2025 program page][pe-2025] and [October 2026 page][pe-2026] retain $42,000.
The pages say at least six months' occupation; the
[Act section 14](sources/atlantic-pe-deferral-law-current.txt) says more than six months or a shorter
period approved by the Minister. Use the Act where that boundary matters.

Section 14(1) defines household income as the applicant's **preceding-calendar-year annual income plus
that of every other current co-resident**. Application requires previous-year NOAs. The Act does not in
this extract identify a specific T1 line, so do not silently translate this to line 23600.
Deferral covers eligible principal-residence taxes, including arrears, with the scope reduced for mixed
farm/commercial use; ordinarily it becomes payable on death or transfer to someone other than the spouse.
The current program says no interest accumulates while deferred.

**Size:** the May 2024 official release reports **$1,729 average annual amount deferred per household**
(316 participating households), not a grant. The same release's $485,000 aggregate and 316 count do not
arithmetically reproduce that mean; preserve the published figures without presenting an independently
reconciled average. For a fresh illustrative $2,000 eligible bill, $2,000 may be postponed and
**$0 tax is forgiven**. No separate 2025/2026 observed recipient mean was found.

Raw PE HTML downloads returned `Verifying your browser before proceeding...`; the web reader supplied
the linked page text. Those pages are **web-only evidence**, not falsely labelled hashed original extracts.
The cached Act URL now serves a consolidation current to May 29, 2026, although search labelled it as
August 2025. Its title and extract record the actual document currency.

## Newfoundland and Labrador

**No province-wide recurring senior property-tax grant/rebate or age increment to a renter credit identified
for 2025 or 2026.** The official [tax-program directory](sources/atlantic-nl-program-list.txt) lists
the general NL Seniors' Benefit separately; that benefit is not conditioned on property tax and belongs to
the provincial cash-benefit inventory. This does not mean no local property relief exists.

**St. John's Seniors Tax Reduction — retain, material reference-city program.** The
[official tax-rate table](sources/atlantic-nl-stjohns-rates.txt) explicitly publishes a **25% reduction
for both 2025 and 2026**, beside residential rates of 9.1 mills with water/sewer service.
The [eligibility page](sources/atlantic-nl-stjohns-eligibility.txt) requires registered ownership and principal
residence, age 65+ with GIS, or age 60–64 with **Allowance for the Survivor**. This differs from NS's
generic Allowance eligibility; do not share a single undifferentiated supplement-eligible boolean.
The city requires federal confirmation of receipt, rather than a stand-alone municipal AFNI taper.
Tax year and reduction year coincide; no separate one-year-delayed rebate is described.

**Size:** at $300,000 assessed value, `$300,000 × 0.0091 = $2,730` tax and `25% × $2,730 = $682.50`
annual relief in either year; a $200,000 assessment yields $455. This warrants inclusion or a deliberate
municipal-scope decision, never exclusion for immateriality. Current data's 0.91% is the ordinary gross
rate, so the engine does **not** already reflect this senior reduction. A custom bill may reflect it.
Do not subtract it again from an already-net bill. The published rates list a separate $690/$700 water
charge for 2025/2026; no evidence here establishes that the seniors percentage applies to that utility
charge, and the engine's property rate does not include it. No provincial senior deferral identified.

## Candidate implementation paths and independent cases

- `ns-senior-property-rebate`: bill-year/program-year distinction; GIS versus Allowance gate; paid status;
  residential amount after municipal relief; half-bill and $800 ceiling. Test $1,000 -> $500,
  $1,600 -> $800, just either side of $1,600, no qualifying federal supplement, and a 60–64 Allowance recipient.
- `halifax-low-income-property-exemption`: municipal identity, prior-year multi-adult income, taxable
  assessment, 2026 $425,000 cap/GIS exception and fiscal-year table. Keep the 2026/27 dollar-table gap explicit.
  Test $425,000 and immediately above with/without GIS, the $170 minimum, and municipal -> NS ordering.
- `stjohns-senior-property-reduction`: 25% current-year eligible property bill, GIS or Survivor Allowance
  recipient, registered ownership/primary residence. Test $2,730 -> $682.50, age 60 with Survivor Allowance,
  non-survivor Allowance rejection, and gross versus already-net custom bills.
- NB and PE deferral programs never reduce tax; tooltips should say that repayable deferrals are excluded.
  No Atlantic-specific existing golden moves are needed solely from senior rules unless fixtures already
  activate age/federal-supplement inputs. Enabling ordinary Halifax relief would also affect non-senior
  reference scenarios: quantify those changes separately and preserve unrelated baselines.

Likely shared implementation files: `src/engine/household.ts`, a property-relief engine module,
`src/engine/types.ts`, `src/data/schema.ts`, the 2025/2026 provincial YAMLs, UI bill-basis/eligibility controls,
scenario codec/defaults, property tooltips, and separate golden/correctness/e2e fixtures.

[pe-size]: https://www.princeedwardisland.ca/en/news/property-tax-deferral-available-to-more-seniors
[pe-2025]: https://www.princeedwardisland.ca/en/information/finance/seniors-property-tax-deferral-program-0
[pe-2026]: https://www.princeedwardisland.ca/en/information/finance-and-affordability/seniors-property-tax-deferral-program

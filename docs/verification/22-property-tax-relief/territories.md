# Territorial property-tax relief inventory, 2025–2026

Research support for #22, checked **2026-11-05**. No production files were changed.
Figures below are CAD. A representative $3,000 gross residential bill is a sizing scenario, not a published average.
All source caches are in [sources](sources/); the main inventory owns the final implementation decisions.

## Yukon

**In: Home Owners Grant, including age-related calculation.**
The [2026 territorial page](https://yukon.ca/en/housing-and-property/property-tax-and-assessments/apply-home-owners-grant)
and [Whitehorse current tax page](sources/territories-yt-whitehorse.txt) state the ordinary rate is 50%, capped at $450;
for a person reaching age 65 in the calendar year, the rate is 75%, capped at $500.
No income test is stated; gross income, net income and GIS eligibility are irrelevant to the ordinary senior claim.
The grant is for one owner-occupied principal residence per tax year, with at least 184 days' residence and taxes paid.
It covers municipal and territorial rural properties. The claim deadline is February 15 following the bill year.
The [official application](https://yukon.ca/sites/yukon.ca/files/cs/cs-forms/cs-home-owners-grant.pdf)
also provides a surviving-spouse route under Act section 2(4), and permits combining periods of normal residence
at successive homes for the 184-day requirement. Exact survivor conditions need the Act before implementation.

**Size:** for $3,000 tax, ordinary relief is $450 and senior relief $500: the age increment is $50 annually.
At $600 tax the uncapped amounts are $300 ordinary and $450 senior, a $150 age increment.
Do not drop Yukon based only on the $50 maximum-bill increment: total missing relief is $500, and smaller bills
have a different age effect. A $500 grant is 1.667 percentage points of a $30,000-income household's gross income.
This is a real annual grant, so retain it despite its modest senior-only difference on a normal larger bill.

**2025 status:** the current official page explicitly covers 2026. The
[April 2024 official release](https://yukon.ca/en/news/government-yukon-making-life-more-affordable-rural-yukoners)
states the same rates and caps. Applying that unchanged schedule to 2025 is a carry-forward assumption pending
a dated 2025 notice or the consolidated Act. Do not label a 2026 web page as a final 2025 filing publication.

**Boundary to settle:** the territorial page attaches a $100 minimum-tax condition to the ordinary grant;
Whitehorse says the grant applies when taxes exceed $100. Neither captured source settles the exact senior
low-bill floor. Do not silently import BC's $100-after-relief floor into Yukon. Verify section 2 before testing
tax bills around $100–$400. The $600/$3,000 sizing calculations above are unaffected by this ambiguity.

**Out: Seniors' Property Tax Deferment, territorial rural program and Whitehorse version.**
Whitehorse's [current official page](sources/territories-yt-whitehorse.txt) permits age-65 owner-occupiers with
insurance to defer tax, with accumulated limits tied to 75% of assessed value for titled property or 50% for
mobile-park homes; interest accrues. A $3,000 bill less the $500 grant may leave $2,500 to finance annually.
Annual reduction in tax liability is **$0**: this is debt, excluded for that reason rather than small size.
Grant entitlement still exists and is credited to the account; a financed bill must not generate another grant.
No age-specific renter/property tax credit was found in the checked territorial grant and CRA YT428 material;
ordinary renter tax-credit age increment identified here is $0, not a claim that no housing assistance exists.

## Northwest Territories

**In: Senior Citizens and Disabled Persons Property Tax Relief, with the Yellowknife reference-city rules.**
The [territorial Act](sources/territories-nt-act.txt), sections 1–4, applies when the owner reaches 65 at any time
in the tax period, ordinarily resides in the eligible dwelling/mobile unit, and satisfies co-ownership rules.
Municipal co-owners must also be seniors, disabled people or dependants of the applicant.
No general income threshold or net-income benefit calculation is specified; dependency may require evidence.
The [city form](sources/territories-nt-form.txt) requests the prior-year notices of assessment when not all
co-owners are seniors/disabled, rather than imposing an advertised income clawback on every senior.

[Yellowknife By-law 4207 section 8](sources/territories-nt-bylaw4207.txt) exempts 50% of eligible taxes, capped at
$1,000. Act section 3 permits the territory to pay an equal amount on behalf of the taxpayer, removing that
further liability. The separately dated [2025 guide](sources/territories-nt-guide-2025.txt) and
[2026 guide](sources/territories-nt-guide-2026.txt), printed page 5, both confirm total annual relief up to $2,000.
Thus the supported ordinary Yellowknife case is `2 × min(0.5 × eligibleTax, 1000)`, capped by the remaining bill.
This is one combined municipal/territorial relief calculation; do not add a second territorial full exemption.
Tax excludes arrears, local improvement charges and interest. Benefits concern the current bill year;
city guidance rejects retroactive relief. Sole eligible owners do not necessarily renew each year; the city
form requires renewal where more than one owner exists and not all qualify independently.

**Size:** $3,000 bill -> $1,000 city exemption + $1,000 territorial payment = **$2,000 annual relief**;
remaining bill $1,000. A $1,200 eligible bill yields $600 + $600 = $1,200, not $2,000.
At $30,000 household income the $2,000 result is 6.667 percentage points. There is no evidence of immateriality.

**Other communities:** Act section 4 authorizes all/part exemption in the general taxation area; municipal
bylaws govern Fort Simpson, Fort Smith, Hay River, Inuvik and Norman Wells, not Yellowknife's $2,000 cap.
An approved full exemption would save $3,000 on the sizing bill. The captured Act establishes discretion,
not a universal automatic 100% award. Keep these paths in scope but require locality/actual-award inputs or
collect their policies before enabling calculations outside Yellowknife. A custom NT bill alone gives no locality.
No separate age-sensitive property/renter refundable credit or senior tax-deferral scheme was identified in
the checked relief law/city guides/CRA NT428 material. This is a bounded search finding, not a territorial guarantee.

## Nunavut

**In, with unresolved award amount: Senior Citizens and People with Disabilities Property Tax Relief.**
The [current territorial property-tax page](sources/territories-nu-program-web.txt) covers the general taxation
area **excluding Iqaluit**. Owner/part-owner must ordinarily reside in the property and turn 65 in the relevant
taxation period; an annual application is required. No income threshold is stated. The Finance Minister may
exempt eligible property; the page does not publish a universal award percentage or cap.
The [general-area form hosted by the city](sources/territories-nu-general-application.txt) confirms age 65 by
December 31 and owner/part-owner residence. Do not mistake its Iqaluit mailing address for Iqaluit-city coverage.

**Iqaluit has a separate municipal route.** The city's
[Schedule A to By-law 656](sources/territories-nu-iqaluit-656.txt) establishes a senior application for an
owner/part-owner ordinarily residing in the eligible dwelling. The
[January 2023 territorial municipal policy](sources/territories-nu-policy-web.txt), valid through January 31,
2027, authorizes bylaw relief for part or all of municipal taxes; GN funding depends on accepted municipal
applications and appropriations. Eligible tax excludes arrears, local improvements and interest.
Neither this policy nor the captured application specifies the city's actual percentage/cap or an income test.
The old city page entitled "Property tax relief for senior citizens and disabled persons" links the territorial
general-area form, so it cannot fill that rule gap. Treat 2025/2026 municipal award precision as unresolved.

**Size:** an approved 100% exemption would save **$3,000 annually** on the sizing bill, 10 percentage points
of $30,000 household income. This is an upper-bound scenario, not a verified typical award. No published mean
recipient award or current Iqaluit percentage was found. Do **not** exclude the program for immateriality or
substitute a $0 result: obtain the operative bylaw/award notice before a default Iqaluit calculation is shipped.
2023–January 2027 policy coverage supports the existence of the municipal pathway in both target years.
No separate age-sensitive property/renter refundable credit or senior property-tax deferral was identified in
the checked territorial tax page/policy/application/CRA NU428 material; housing subsidies are a different category.

## Implementation implications and independent cases

The three territorial 2025/2026 YAML files currently contain rough largest-city gross-tax rate proxies, with no
property grants. `propertyTax()` in `src/engine/household.ts` returns a custom bill or home value times rate;
it carries no before/after-grant metadata. Existing credits do not apply the programs inventoried here.

Proposed ids: `yukon-home-owners-grant`; `nwt-yellowknife-senior-property-relief`; and, only after rules are
collected, `nunavut-senior-property-exemption` with distinct municipal/general-area eligibility. Do not make
the GNWT statutory municipal match another independently claimable grant.
Track gross bill, grants already reflected in the input, and relief not yet received. For a known net custom
bill do not subtract the same award again; for a gross proxy bill subtract once. Yukon ordinary relief must
be reconciled alongside its senior replacement; a net ordinary bill needs the incremental relief, not $500 again.

Independent cases: Yukon $3,000 tax at age 64/65 -> $450/$500, $600 -> $300/$450; 183/184 residence days;
survivor and low-bill conditions once verified. Yellowknife $1,200/$2,000/$3,000 -> $1,200/$2,000/$2,000 combined
relief, eligible/unsupported co-owner, and 64/65 age boundary. In each jurisdiction compare gross custom bill,
ordinary-grant-net bill and senior-grant-net bill. NU tests must wait for a sourced operative award rule,
then distinguish city/general taxation area. Deferral election changes tax debt/cash timing, never tax liability.

Required files include territorial 2025/2026 YAML, schema/types, a pure property-relief engine module, household
integration, tooltip/serialization controls, targeted tests and separate senior golden scenarios.
If ordinary Yukon grant is applied to all supported owner cases, existing 2025/2026 Yukon owner baselines will
move by up to $450; a senior-only activation can preserve legacy baselines but must disclose its limited coverage.
NT/NU new senior-only paths should use separate goldens. Never recapture unrelated baselines.

# Territorial property-tax relief inventory, 2025–2026

Research support for #22, checked **2026-11-05**. No production files were changed.
Figures below are CAD. A representative $3,000 gross residential bill is a sizing scenario, not a published average.
All source caches are in [sources](sources/); the main inventory owns the final implementation decisions.

Phase 1b applies the user's [issue decisions](https://github.com/yuorme/tax-visualizer/issues/22): city relief
is calculated only for the default reference-city bill, with a tooltip explaining that limitation. A custom
province bill supplies no city identity. Results are annual benefit-year entitlements, not calendar cash.
Saved bills keep their gross meaning; a new explicit net-bill choice must prevent duplicate grants.
Housing allowances are assigned to #216. Unresolved NU relief is explicitly **not modelled**, never $0.

## Yukon

**In: Home Owners Grant, including age-related calculation.**
The [2026 territorial page](https://yukon.ca/en/housing-and-property/property-tax-and-assessments/apply-home-owners-grant)
and [Whitehorse current tax page](sources/territories-yt-whitehorse.txt) state the ordinary rate is 50%, capped at $450;
for a person reaching age 65 in the calendar year, the rate is 75%, capped at $500.
No income test is stated; gross income, net income and GIS eligibility are irrelevant to the ordinary senior claim.
The official Act's section 2(3), PDF page 7 (printed page 3), requires evidence of age at least 65;
it does **not** require OAS pension eligibility. The OAS reference appears only in the survivor deeming
provision in section 2(4), not as an additional ordinary-senior condition.
The grant is for one eligible owner-occupied residence per tax year. The
[Act, ss.1–9](sources/gap-territories-yt-act-web.txt) permits normal residence from January 1 through
application **or** at least 184 days in the tax year; 184 days is not the only route. Qualifying taxes must
be paid, or the applicant holds a seniors' tax-deferral agreement not in default. Eligible taxes exclude
local improvements, arrears, penalties, licence fees, delinquent taxes and interest. It covers municipal
and territorial rural properties. The claim deadline is February 15 following the bill year.
The [official application](https://yukon.ca/sites/yukon.ca/files/cs/cs-forms/cs-home-owners-grant.pdf)
also provides a surviving-spouse route under Act section 2(4), and permits combining periods of normal residence
at successive homes under section 9's conditions. Section 2(4) is now checked: a qualified applicant who is
the surviving spouse of someone who **received the senior grant under section 2(3)** and has **not remarried**
uses the senior calculation even if the survivor is not eligible for OAS. Do not enable it merely from a
widowed flag. Section 7 separately permits payment of a deceased eligible applicant's grant to an heir/spouse.

**Size:** for $3,000 tax, ordinary relief is $450 and senior relief $500: the age increment is $50 annually.
At $600 tax the uncapped amounts are $300 ordinary and $450 senior, a $150 age increment.
Do not drop Yukon based only on the $50 maximum-bill increment: total missing relief is $500, and smaller bills
have a different age effect. A $500 grant is 1.667 percentage points of a $30,000-income household's gross income.
This is a real annual grant, so retain it despite its modest senior-only difference on a normal larger bill.

**2025 applicability closed by legislation:** the government Act sets these amounts directly in section 2.
The [official legislative-history table](sources/gap-territories-yt-history-web.txt) lists only the 2009
section 3 deadline amendment, with no amendment to section 2. This establishes the schedule for both
2025 and 2026 without an inflation/carry-forward estimate. The
[May 30, 2025 city notice](sources/gap-territories-yt-2025-news.txt) independently confirms 2025 grant
applications were available; it does not print a dollar table. A standalone dated 2025 dollar notice was
not found, but is no longer required to guess the amount because the statute establishes it.

**Low-bill rule closed:** section 2(2) makes the ordinary grant the lesser of $450, 50% of taxes and,
where taxes are below $200, taxes minus $100; no negative grant is payable. Section 2(3) expressly
overrides subsection (2): senior grant is `min($500, 75% × eligibleTax)`. It does **not** retain the
ordinary $100 floor. At $150 tax: ordinary $50 / senior $112.50; at $200: $100 / $150; at $400:
$200 / $300. The city summary's broad statement that grants require tax over $100 does not describe
the statutory senior override. Use the Act for the senior rule, not an imported BC minimum. At $100 tax,
the statute yields ordinary $0 / senior $75; this is a useful test against wrongly sharing the floor.

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
not a universal automatic 100% award. Under the decided scope, calculate Yellowknife municipal relief only
for the default reference-city bill; suppress automatic city relief for a custom province bill. Other local
rules are not enabled by this issue's custom-bill input. A custom NT bill alone gives no locality.
No separate age-sensitive property/renter refundable credit or senior tax-deferral scheme was identified in
the checked relief law/city guides/CRA NT428 material. This is a bounded search finding, not a territorial guarantee.

## Nunavut

**Retained as material but not modelled: Senior Citizens and People with Disabilities Property Tax Relief.**
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

### Phase 1b evidence attempts and result

- Checked the [GN current property-tax program](https://www.gov.nu.ca/en/taxation-and-insurance/property-tax),
  annual application/renewal links, [policy directory](https://www.gov.nu.ca/en/policies), and the complete
  [January 2023 policy](https://www.gov.nu.ca/sites/default/files/policies-legislations/2025-04/Senior_Citizens_and_People_with_Disabilities_Property_Tax_Relief_Policy.pdf).
  Policy page 2 expressly recognizes the Finance Minister's general-area exemption power, but says only
  that the Minister may exempt qualifying property. No universal award fraction, cap or dated general-area
  operating schedule was found. The policy directory lists no separate Finance senior-property award policy.
- Downloaded the [official relief Act consolidation](sources/gap-territories-nu-act-consolidation.txt).
  It is explicitly current only to **May 10, 2012**, and its official landing page warns of later amendments.
  Section 4 permits all/part relief. A future replacement section includes a deemed full-exemption clause
  for the period before its commencement; future/unproclaimed text is **not proof of a current automatic
  100% award**. The 2025 reorganization and disability-definition amendments identified by the landing
  page do not supply a senior award schedule. A current operative award remains unestablished.
- Searched the city's full bylaws and document lists for `656`, `senior citizens`, `exemption`, `100%`
  and 2025/2026 tax relief. The `_0.pdf` version of the By-law 656 senior application has exactly the
  same original SHA-256 as the already cached two-page application, not a newly found operative bylaw.
  Its award percentage/cap remains absent. Search/opening its older landing page or one PDF variant
  sometimes returned `Cache miss`; that is recorded as a retrieval limit, not evidence of no program.
- Ruled out the [March 25, 2025 city exemption announcement](sources/gap-territories-nu-iqaluit-2025-process.txt):
  its 100% exemption and $300,000 annual budget cap concern **organizations/places of worship**, expressly
  excluding residences. Those figures cannot become a senior-homeowner award. By-law 1001 and its 1028
  amendment are therefore not substitutes for the missing senior award rule.
- Direct GN policy requests returned HTTP 403; the official web reader supplied the policy pages. The
  NU Act downloaded successfully, while its PDF web-reader request returned `Cache miss`. Yukon Act,
  history and regulation downloads returned HTTP 403 through Node and curl; the official web reader
  supplied the Act/history. Those caches are labelled factual paraphrases without original-byte hashes.

**Result:** Yukon statutory 2025/2026 amounts, senior low-bill calculation and survivor rule are closed.
Both Nunavut award calculations remain **not modelled**. Search effort found eligibility/discretionary
authority, not a reliable current award; no further amount is inferred and no user scope question remains.

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

Independent cases: Yukon $3,000 tax at age 64/65 -> $450/$500, $600 -> $300/$450; low bills $100/$150/
$200/$400; 183/184 days for the completed-year route and a separate January-1-to-application case;
survivor with/without the deceased's actual senior grant and remarriage. Yellowknife $1,200/$2,000/$3,000
-> $1,200/$2,000/$2,000 combined relief, eligible/unsupported co-owner, 64/65 age boundary and default
reference bill versus custom province bill. Yukon territory-wide grant applies to qualifying gross/net custom
bills as well as the reference estimate, with applied amounts counted once. NU outputs must explicitly show
not modelled until a sourced award rule exists. Deferral affects debt/cash timing, never tax liability.

Required files include territorial 2025/2026 YAML, schema/types, a pure property-relief engine module, household
integration, tooltip/serialization controls, targeted tests and separate senior golden scenarios.
If ordinary Yukon grant is applied to all supported owner cases, existing 2025/2026 Yukon owner baselines will
move by up to $450; a senior-only activation can preserve legacy baselines but must disclose its limited coverage.
NT's new senior-only paths and NU's explicit unsupported result should use separate goldens.
Never recapture unrelated baselines.

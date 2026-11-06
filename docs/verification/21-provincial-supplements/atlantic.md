# Atlantic seniors' supplement inventory, 2025–2026

Inventory for #21, checked **2026-11-05**. This appendix changes no engine, data or test expectations.
Read alongside [the sizing method](../16-seniors-sizing.md) and [scope policy](../../SCOPE.md).
NB and NL have material unrestricted recurring supplements. NS has a material GIS-related income-tax refund;
NS and PE also have material cash grants tied to services. None should be classified as immaterial.

## Evidence and sizing conventions

Every retained extract below has its official URL, retrieval date and original-response SHA-256 in its header.
The repository's `fetch-source.ts` exports made the extracts through a temporary wrapper, without changing a
shared source index. Official PEI HTML remained readable through web search/open but direct downloads returned
an HTTP 200 Radware challenge. Those challenge responses are not evidence and are not retained. The PEI SII
policy PDF was downloadable. The NB 2026 application PDF had no extractable text; its official program page
supplies the 2026 evidence instead.

Annual schedules, calendar receipts and income base years are separate concepts. Sizes below are recipient
entitlements or illustrative cases, not population means. No verified representative mean payment was found.
For comparison, `$35` on an unchanged `$35,000` income denominator is 0.1 percentage points. A cap can establish
potential materiality but does not make every senior eligible or prove a typical payment equals the cap.

| Jurisdiction | Recurring supplement or equivalent | Annual recipient size | Inventory conclusion |
|---|---|---|---|
| NB | Low-Income Seniors' Benefit | Flat $616 in 2025; $629 in 2026 per eligible household | Retain in #21; prior-year federal benefit receipt is required |
| NS | Seniors Provincial Income Tax Refund | Provincial liability refunded; normally $50–$10,000, with exceptions below | Retain in #21 as an equivalent; separate from the existing age credit |
| NS | Seniors Care Grant | $750 per qualifying household in both 2025–26 and 2026–27 rounds | Material service-linked cash grant; retain as candidate, requires expense/household eligibility |
| PE | Seniors Independence Initiative (SII) | Up to $575/$950/$1,325/$1,800 annually, depending on income | Material assessed service support; retain candidate, not automatic income-only entitlement |
| NL | Seniors' Benefit | $1,551 July 2025–June 2026; $1,882 July 2026–June 2027 | Retain in #21; household amount, not one per senior |
| NL | Aging Well at Home Grant | $400 per qualifying household for April 2025–March 2026 services | Material service-linked cash grant; next round unverified |
| NL | Coastal Labrador Seniors' Food and Heating Supplement | $500 annually per eligible senior | Retain geographic candidate; do not silently award zero when location is unknown |

No general unconditional monthly GIS top-up was identified for NS or PE in the government financial-support
inventories and program evidence reviewed. Their documented equivalents are listed above. This is a qualified
inventory finding, not proof that every possible program is absent, and not a zero-value materiality finding.

## New Brunswick

The [2025 application][nb25] establishes the $616 annual payment, NB residence on December 31, 2024, and receipt
of GIS, Allowance or Allowance for the Survivor during 2024. GIS recipients must be 65+; the two Allowance
categories are 60–64. CPP and the CPP survivor pension alone do not qualify. A co-resident couple receiving
qualifying OAS benefits receives one payment; qualifying spouses living separately can each receive it.
Applications/payments begin April 1, 2025. The [2026 program page][nb26] confirms $629, NB residence on
December 31, 2025, prior-year qualifying benefit receipt and a December 31, 2026 application deadline.
The 2025 application is due December 31, 2025, according to the [dated release][nb25news].
Caches: [2025](sources/atlantic-nb-benefit-2025.txt), [2026](sources/atlantic-nb-benefit-2026.txt).

There is no separate provincial dollar-income taper on those pages: entitlement follows actual prior-year
federal receipt, not merely the engine's current-year calculated GIS. A steady-state approximation must be named.
The 2026 page states the one-household restriction in terms of two GIS recipients, while the 2025 form applies it
to all qualifying benefit combinations; verify the 2026 form visually before specifying mixed-benefit couples.
The flat payments are representative of eligible recipients, rather than only maxima. On sizing household L's
$8,881.08 denominator, they move its own rate by 6.936 and 7.082 points, respectively.

Related material items, sized before assignment outside #21:

| Program and official evidence | Size and conditions | Proposed treatment / remaining evidence |
|---|---|---|
| [Property Tax Allowance][nbproperty], [cache](sources/atlantic-nb-property.txt) | Up to $300/$200/$100; prior-year combined taxable income, line 26000, under $22,000 / $22,001–$25,000 / $25,001–$30,000; principal-residence owner | #22/property reconciliation; $300 is 0.857 points at $35,000. Published wording leaves exactly $22,000 unclear; do not invent a boundary. 2025 form explicitly uses 2024 income; current 2026 page uses 2025. |
| [Seniors' Home Renovation Tax Credit][nbreno], [cache](sources/atlantic-nb-renovation-credit.txt) | Refundable 10% of up to $10,000 eligible annual accessibility expenses: maximum $1,000, no income test; senior 65+ or qualifying co-resident family member | Material expense-based candidate, 2.857 points at $35,000; not a flat income supplement. Confirm assistance/expense overlap before implementation. |
| [Homeowner Repair Program][nbrepair], [cache](sources/atlantic-nb-repairs.txt) | Current maximum forgivable loan $7,000 for seniors' adaptations; $18,000 major repairs; low income and need assessment | Grant-equivalent portions are material: $7,000 is 20 points at $35,000 in a repair year. Repayable principal is separate. Precise 2025 schedule, income limits and forgiveness conditions remain unverified. |
| [Emergency Fuel Benefit in the government's guide][nbguide], [cache](sources/atlantic-nb-emergency-fuel.txt) | Up to $550 per year, emergency inability to pay winter heating | Material at 1.571 points at $35,000; assessed emergency assistance, not ordinary annual income entitlement. Full year-specific assessment rules remain a gap. |
| [NB Power's provincial electricity rebate description][nbenergy], [cache](sources/atlantic-nb-energy-rebate.txt) | 10% of eligible electricity-consumption charges from January 2025; excludes service/rental fees | A $2,000 eligible annual consumption charge gives $200, or 0.571 points at $35,000. General on-bill tax relief, not a senior payment; reconcile existing energy/sales-tax scope and net bills. |

Seniors' property-tax deferral is excluded by existing scope because it postpones tax. Do not revive the old
$100 Home Energy Assistance Program from historical pages: no current 2025/2026 entitlement was established.
That unresolved program status is not a materiality conclusion.

## Nova Scotia

The [Seniors Provincial Income Tax Refund page][nsrefund] and [regulations][nsrefundreg] establish an annual
cash refund for a resident individual who received GIS during the tax year, reported it on the return, filed a
return and owes NS income tax. The regulation applies from 2010 onward, supporting both 2025 and 2026.
Its ordinary refund is $50 when liability is above zero but below $50, the liability itself from $50 to $10,000,
and $10,000 above that. An additional refund above $10,000 is discretionary on application within 24 months.
Zero liability produces no ordinary refund. Death in the tax year, imprisonment for at least 90 days and other
specified exclusions apply. An eligible year's refund can be paid to the estate after a subsequent death.
The regulation attributes the refund to January–December of the tax year regardless of payment date.
Caches: [program](sources/atlantic-ns-tax-refund-program.txt), [regulation](sources/atlantic-ns-tax-refund.txt).

This is individually assessed, not a family-income taper. Receipt of GIS in any part of the year matters;
current-year private income alone cannot establish receipt. The regulation literally requires attaining 65
before December 31, whereas the summary says 65 or older in the tax year. Verify December 31 birthdays before
final boundary tests. A qualifying $500 assessed liability produces a $500 refund, or 1.429 points at $35,000;
a $25 liability produces $50. These independently follow the refund schedule, not the production engine.
The separately implemented NS $1,000 age tax credit reduces liability first: do not refund the pre-credit bill.

The [2025–26 Seniors Care Grant application][nscare25] and [2026–27 page][nscare26] both specify $750 per
household and net household income no more than $45,100. The applicant must live in an owned/rented home and
meet residence-document requirements. Age is 65 by March 31, 2026 or March 31, 2027, respectively. Eligible service,
healthcare and heating costs fall in April 1–March 31 of each round; receipts can be audited. The first round's
application window is September 1, 2025–March 31, 2026; the next closes December 1, 2026. A household anticipating
at least $750 qualifying costs can receive $750: 2.143 points on $35,000. This is cash with spending conditions.
Caches: [2025–26](sources/atlantic-ns-care-2025.txt), [2026–27](sources/atlantic-ns-care-2026.txt).
Exact base-income year, tax-line definition, treatment of other adults, and grants below $750 expenses require
further program guidance; do not replace these gaps with a generic adjusted-family-net-income formula.

Related material programs:

| Program and official evidence | Size / period / eligibility | Proposed treatment / gap |
|---|---|---|
| [Property Tax Rebate 2025 form][nsproperty25] / [2026 page][nsproperty26], caches [2025](sources/atlantic-ns-property-2025.txt), [2026](sources/atlantic-ns-property-current.txt) | 50% of prior-year paid eligible municipal residential taxes, maximum $800; GIS/Allowance qualification in the application year, principal-residence owner | #22; $1,000 eligible tax gives $500, $1,600 gives $800. Those are 1.429/2.286 points at $35,000. Subtract municipal exemptions/rebates first; 2025 pays against 2024 taxes, 2026 against 2025. |
| [HARP 2025–26 release][nsharp25] / [2026–27 page][nsharp26], caches [2025](sources/atlantic-ns-heating-2025.txt), [2026](sources/atlantic-ns-heating-current.txt) | $400 household payment in both rounds; applicant pays heat separately; single net income ≤$30,000 or other-adult household ≤$45,000, or GIS/Allowance/income assistance; prior-year income | Material, 1.143 points at $35,000; general energy benefit with expense conditions. 2025 form uses 2024 income; 2026 page uses 2025. Existing Seniors Care Grant can coexist. |
| [Your Energy Rebate consumer guide][nsyerp], [cache](sources/atlantic-ns-energy-rebate.txt) | Current rebate 9% of pretax residential energy; not income tested, commonly deducted on bill | $2,000 qualifying spending gives $180, or 0.514 points at $35,000. Generic tax relief, not extra senior income. Final 2025 date/rate allocation still needs historical reconciliation. |
| [Housing Repair and Accessibility Program][nsrepair], [cache](sources/atlantic-ns-housing-repairs.txt) | Current each-stream repair/accessibility funding: $10,000 grant plus $8,000 conditional forgivable loan; additional repayable loan possible | Material capital assistance, not annual unrestricted cash. $10,000 is 28.571 points at $35,000 in a repair year. Income/assets/property/need tests and contractor payment apply; do not count repayable principal. 2025 transition and forgiveness periods need collection. |

## Prince Edward Island

The [September 2024 announcement][pesii24] establishes increased SII funding effective September 1, 2024,
retroactive to July 1, 2024. The [May 2026 policy][pesiipolicy] retains the following annual funding schedule:

| Single income | Couple income | Annual funding ceiling |
|---|---|---:|
| Up to $22,253 | Up to $31,470 | $1,800 |
| $22,254–$25,753 | $31,471–$34,970 | $1,325 |
| $25,754–$29,253 | $34,971–$38,470 | $950 |
| $29,254–$32,753 | $38,471–$41,970 | $575 |

Those published bands support 2025–2026 inventory amounts; do not manufacture an indexed 2026 schedule.
Applicants must be PEI residents, citizens/permanent residents, 65+ when applying, own/rent their home and live
independently or with a spouse. Current policy requires assets **less than** $100,000, excluding the principal
residence, its land and primary vehicle. It excludes care-facility residents and care arrangements such as an
adult child living with a senior parent; independent roommates can qualify under specified conditions.
It pays the applicant or agent directly for practical services, complementing existing supports. Eligibility is
reviewed at least every 12 months. Cache: [current policy](sources/atlantic-pe-sii-policy.txt).

Income is claimant-plus-spouse line 23600, adjusted for program requirements. The adjustment details and base
year are not specified in the policy. The 2024 release describes assets as no greater than $100,000 and excludes
vehicles more broadly; do not backdate the stricter/current 2026 asset wording to 2025. The current PDF's revision
header says May 6, 2026, while its final change log says May 6, 2025 for the income-definition amendment: retain
this conflict as a dating gap. Its whole-dollar bands also do not settle cent-valued income boundaries.

SII is not automatically the ceiling: needs/service assessment and existing natural supports matter. An
otherwise eligible single with $30,000 income and sufficient assessed need has a $575 ceiling, or 1.917 points;
a couple with $36,000 has a $950 ceiling, or 2.639 points on $36,000. Both are material nonmaximum examples.
No program-wide mean or distribution of actual payments was verified. This service-based benefit must remain
in the inventory even if implementation needs assessment/expense inputs or an explicit unsupported scenario.

Related material programs:

| Program and official evidence | Size / conditions | Proposed treatment / gap |
|---|---|---|
| [Seniors Home Repair / Seniors Safe @ Home][pereno] | Age 60+; current maxima $4,000 repair / $10,000 accessibility; combined income ≤$50,000 with lower grant bands above $35,000; repairs require owned principal residence and property-value test | Material capital assistance: 11.429/28.571 points at $35,000 in a qualifying year. Safe @ Home uses senior/spouse income only; ordinary repair counts all adult residents. Prior approval, invoices and 15-year maximum-grant restriction apply. Exact 2025 policy and income-tax line remain gaps. HTML inspected through web, not successfully cached. |
| [Home Heating Program 2026 page][peheat26], [2025 administrator form][peheat25], [2025 cache](sources/atlantic-pe-heating-2025.txt) | Up to $1,200 per calendar year; hardship, separate heating bill, gross line 15000 income ≤$45,000 single / ≤$60,000 family; account credit to vendor | Material general energy support, 3.429 points at $35,000; not unrestricted senior cash. 2025 delivery form uses 2024 NOAs; current page uses 2025 NOA after May 1, 2026. PEI Social Assistance excluded; current 2026 page also excludes AccessAbility Assured Income. |

The heating program moved from its contracted Salvation Army administrator to Access PEI on November 1, 2026;
the government forbids a second 2026 application after prior administrator assistance. The 2025 cached form is
primary evidence from that actual delivery administrator, rather than a government-hosted document. PEI property
tax deferral remains outside scope; do not convert a deferred bill into an annual grant.

## Newfoundland and Labrador

The [CRA 2024 guide][nlcra24], [2025 guide][nlcra25], [current provincial page][nlfinance],
[current CRA page][nlcra26] and
[regulation][nlreg] establish a tax-free household Seniors' Benefit, paid quarterly with the federal credit.
One eligible single or couple receives one amount regardless of whether both spouses are seniors. Eligibility
is at least 64 by December 31 of the preceding income year, equivalent to turning at least 65 in the benefit
year. No separate application is needed, but returns must be filed. The [2026 amendment][nl26amend] confirms the
new parameters effective July 1, 2026 and suspends additional indexation for the 2026 taxation year.

| Payment period | Prior-year AFNI for full amount | Annual maximum | Taper |
|---|---:|---:|---:|
| July 2024–June 2025 | $29,402 (2023 income) | $1,516 | 11.66% above threshold |
| July 2025–June 2026 | $30,078 (2024 income) | $1,551 | 11.66% above threshold |
| July 2026–June 2027 | $30,409 (2025 income) | $1,882 | 11.66% above threshold |

The annual formula is `max(0, maximum − .1166 × max(0, AFNI − threshold))` before administrator rounding.
AFNI combines line 23600 amounts, subtracts UCCB/RDSP receipts and adds their repayments. It is not taxable
income or GIS's own income test. OAS/GIS/Allowance cannot simply be stripped from line 23600. CRA quotes partial
eligibility through $43,380 in 2025 and $46,549 in 2026; the provincial 2026 page rounds the upper figure to
$46,550. Formula zeros are approximately $43,379.8868 / $46,549.6518; use the formula and verified rounding rules,
not inconsistent whole-dollar summary cutoffs.
Caches: [2024 guide](sources/atlantic-nl-gst-2024.txt), [2025 guide](sources/atlantic-nl-gst-2025.txt),
[CRA current](sources/atlantic-nl-cra-current.txt), [province](sources/atlantic-nl-benefits-current.txt),
[regulation](sources/atlantic-nl-benefit-regulations.txt), [amendment](sources/atlantic-nl-benefit-2026-amendment.txt).

Independent nonmaximum example: constant relevant AFNI $35,000 gives annual schedules
`1,551 − .1166 × 4,922 = $977.0948` and `1,882 − .1166 × 4,591 = $1,346.6894`, or 2.792/3.848 points on
$35,000. Continuous maximum eligibility instead gives calendar receipts `(1,516 + 1,551)/2 = $1,533.50` for
2025 and `(1,551 + 1,882)/2 = $1,716.50` for 2026. Constant AFNI $35,000 yields calendar amounts about $920.18
and $1,161.89. These assume all four eligible quarters and stable family status; quarter rounding is unresolved.

The [Coastal Labrador regulation][nlcoastal] provides **$500 per eligible senior annually**, without an income
test: age 65+ and resident in Cartwright–L'Anse au Clair or Torngat Mountains at the preceding December 31,
with the preceding return filed by the end of the program year. It is material (1.429 points at $35,000) and
continues under a recurring regulation, supporting both years. [Cache](sources/atlantic-nl-coastal.txt).
Reference-city St. John's assumptions cannot award it, but cannot justify declaring it immaterial. Retain a
geographic implementation requirement or explicitly unsupported eligible geography; do not silently use zero.

Related material programs:

| Program and official evidence | Size / period / conditions | Proposed treatment / gap |
|---|---|---|
| [Aging Well at Home Grant][nlaging], [application labelled 2026][nlagingform], caches [page](sources/atlantic-nl-aging-current.txt), [form](sources/atlantic-nl-aging-2026-form.txt) | $400 household; 65+ by March 31, 2025; 2024 line 23600 household income ≤$32,700 single / ≤$50,000 couple; owned/rented home; eligible services April 2025–March 2026; apply by March 31, 2026 | Material at 1.143 points at $35,000. Cash, receipts auditable and funding capped. The file's “2026” title does not establish April 2026–March 2027 rules; that round is an explicit gap. |
| [Home Heating Supplement 2025 form][nlheat25] / [enhanced 2026 page][nlheat26], caches [2025](sources/atlantic-nl-heating-2025.txt), [2026](sources/atlantic-nl-heating-2026.txt) | $200–$500 in 2025; enhanced $400–$1,000 in 2026. Prior-year combined line 23600 income: full below/equal $100,000, partial through $150,000; special death/separation/care/training adjustments. At least 250 litres oil bought in calendar year; one household claim | Material energy support: maximum 1.429/2.857 points at $35,000. 2026 doubling includes second payments for previous recipients. Not automatically granted to electric-heat households. Verify amended legal taper before implementation; current regulation inspected still showed old $500 formula. |
| [NLHC homeowner programs launching October 1, 2026][nlrepair], [cache](sources/atlantic-nl-repairs-launch-2026.txt) | Repair forgivable loan rises from $5,000 to $10,000 ($6,500 to $13,000 Labrador); modification from $7,500 to $15,000; repair income limit $42,500/$65,000 Labrador; modification $51,500/$65,000 | Material capital grant-equivalent funding; $5,000 is 14.286 points at $35,000 in a repair year. Forgiveness and actual grant-versus-loan cash timing require collection; repayable principal excluded. Avoid treating the 2026 increased amount as operative throughout 2025/2026. |
| [Seniors Affordability Payment announced November 2, 2026][nloneoff], [cache](sources/atlantic-nl-affordability-2026.txt) | One-time $500 at individual adjusted net income ≤$75,000; partial to $100 at $100,000; age 65 by December 31, 2025; file 2025 return by December 31, 2026; cheques expected before year-end | Material at 1.429 points on $35,000, but excluded by SCOPE.md's existing one-time-payments rule. Not a recurring #21 supplement. Exact adjustment definition, residency date and continuous taper are not specified in announcement; do not infer those as implementation facts. |

## Existing-credit reconciliation and remaining gates

Inspected 2025/2026 NB/NS/PE/NL YAML, `src/engine/credits.ts`, `personal.ts` and `senior-credits.ts`.
NB HST, NS affordable-living and PE essentials/sales-tax credits are general credits, not the cash programs here.
NL's existing `nl-income-supplement` implements only the regulation's ordinary adult/spouse/child component;
it does **not** contain paragraph 3(c)'s Seniors' Benefit. Add that separate senior amount once, preserving the
ordinary supplement. NS's existing `ageTaxCredit` is the $1,000 liability reduction, not the GIS refund.
PE's existing $250 `lowIncomeSenior` is a nonrefundable low-income-reduction term, not SII cash.

No implementation should claim full 2025–2026 coverage until its missing evidence/input gates are resolved.
In particular, retain explicit gaps for prior-year federal receipt (NB/NS), NS grant income/household rules,
PE assessed need/assets and policy dating, NL 2026–27 Aging Well rules, and NL geographic eligibility.
Capital repair programs and general energy benefits require a separate scope/ownership decision after this
sizing; these candidates are material or unresolved, rather than dismissed as too small.

[nb25]: https://www2.snb.ca/content/dam/snb/lisb-pafr/lisb-application-2025.pdf
[nb25news]: https://www.gnb.ca/en/news/n-b.2025.04.applications-for-2025-low-income-seniors-benefit-now-available.html
[nb26]: https://www2.gnb.ca/content/gnb/en/corporate/promo/new-brunswick-low-income-seniors-benefit.html
[nbproperty]: https://www.pxw1.snb.ca/SNB7001/e/1000/CSS-FOL-SNB-SN-0003E.pdf
[nbreno]: https://www.gnb.ca/en/topic/family-home-community/seniors/senior-tax-credit.html
[nbrepair]: https://www.gnb.ca/en/topic/family-home-community/housing-property/home-repair.html
[nbguide]: https://www2.gnb.ca/content/dam/gnb/Departments/sd-ds/pdf/Seniors/aging-in-nb.pdf
[nbenergy]: https://www.nbpower.com/en/accounts-billing/understanding-your-bill/reading-a-typical-bill
[nsrefund]: https://www.novascotia.ca/seniors-provincial-income-tax-refund
[nsrefundreg]: https://novascotia.ca/just/regulations/regs/incgis.html
[nscare25]: https://www.novascotia.ca/sites/default/files/documents/2-2750/seniors-care-grant-application-form-en.pdf
[nscare26]: https://www.novascotia.ca/apply-help-household-healthcare-and-home-heating-costs-seniors-care-grant
[nsproperty25]: https://beta.novascotia.ca/sites/default/files/documents/2-1781/property-tax-rebate-seniors-application-form-en.pdf
[nsproperty26]: https://www.novascotia.ca/apply-property-tax-rebate-property-tax-rebate-seniors
[nsharp25]: https://news.novascotia.ca/en/2025/09/26/heating-assistance-rebate-program-opens-october-1
[nsharp26]: https://www.novascotia.ca/apply-heating-assistance-rebate-heating-assistance-rebate-program
[nsyerp]: https://www.novascotia.ca/sites/default/files/documents/1-202/your-energy-rebate-program-en.pdf
[nsrepair]: https://www.novascotia.ca/apply-help-home-repairs-and-accessibility-adaptations-housing-repair-and-accessibility-program
[pesii24]: https://www.princeedwardisland.ca/en/news/increased-funding-to-help-island-seniors-stay-independent-in-their-homes
[pesiipolicy]: https://www.princeedwardisland.ca/sites/default/files/64b8/4.1%20Seniors%20Independence%20Initiative.pdf
[pereno]: https://www.princeedwardisland.ca/en/service/pei-home-renovation-programs
[peheat25]: https://salvationarmy.ca/atlantic/wp-content/uploads/sites/3/2025/11/2025-Home-Heating-APPLICATION-FORM_1.pdf
[peheat26]: https://www.princeedwardisland.ca/en/information/housing-and-communities/pei-home-heating-program
[nlcra24]: https://www.canada.ca/content/dam/cra-arc/formspubs/pub/rc4210/rc4210-24e.pdf
[nlcra25]: https://www.canada.ca/content/dam/cra-arc/formspubs/pub/rc4210/rc4210-25e.pdf
[nlcra26]: https://www.canada.ca/en/revenue-agency/services/child-family-benefits/provincial-territorial-programs/province-newfoundland-labrador.html
[nlfinance]: https://www.gov.nl.ca/fin/tax-programs-incentives/personal/income-supplement/
[nlreg]: https://www.assembly.nl.ca/legislation/sr/regulations/rc160032.htm
[nl26amend]: https://www.assembly.nl.ca/legislation/sr/annualregs/2026/nr260017.htm
[nlcoastal]: https://assembly.nl.ca/Legislation/sr/regulations/rc240080.htm
[nlaging]: https://nlhealthservices.ca/key-information/the-aging-well-at-home-grant/
[nlagingform]: https://nlhealthservices.ca/wp-content/uploads/2025/12/Aging-Well-at-Home-Grant-2026-Application.pdf
[nlheat25]: https://www.gov.nl.ca/fin/files/2025-Application-Form.pdf
[nlheat26]: https://www.gov.nl.ca/fin/home-heating-supplement-program/
[nlrepair]: https://www.nlhc.nl.ca/2026/09/provincial-homeowner-support-programs-launching-next-week/
[nloneoff]: https://www.gov.nl.ca/releases/2026/exec/1102n02/

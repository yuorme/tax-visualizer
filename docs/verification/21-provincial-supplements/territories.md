# Territorial seniors' supplements: #21 phase 1 inventory

Researched 2026-11-05 for tax years 2025 and 2026. This is an inventory and implementation assessment; it changes
no tax parameters or engine behaviour. Amounts below distinguish a full-year eligible household from a published
monthly rate annualized only to establish materiality.

## Findings and coverage decision

| Territory/program | Published amount | Independent annual size | #21 decision |
|---|---|---|---|
| NT Senior Citizen Supplementary Benefit (SCSB) | $196 per eligible adult per month | $2,352 single; $4,704 for two eligible adults | Include; material cash supplement |
| NU Senior Citizen Supplementary Benefit (SCSB) | Current program says $300 per eligible adult per month | $3,600 single; $7,200 for two eligible adults | Include; material; reconcile stale legal rate before implementation |
| YT Yukon Seniors Income Supplement (YSIS) | Spring 2025 briefing: maximum $314.46; current page: $323.26 | Maximum annualized rates $3,773.52 and $3,879.12 per adult | Include; material; exact 2025/26 calendar amounts and formula unresolved |

The NT calculations are `196 × 12` and `196 × 12 × 2`; NU calculations are `300 × 12` and `300 × 12 × 2`.
These illustrate an established, continuously eligible single senior or couple, with no private income and positive
GIS every month. They are arithmetic independent of this engine. A 60–64 spouse receiving the federal Allowance
can also attract an NT/NU payment. The YT annualized figures are `314.46 × 12` and `323.26 × 12`, **not verified
calendar-year 2025 or 2026 totals**. The dated rates alone establish that omission can change a household
comparison by thousands of dollars.

Rate sources: [NT regulation][nt-reg], [NT administration][nt-program], [NU administration][nu-program],
[YT spring 2025 briefing][yt-briefing] (printed pp. 10–12; PDF pp. 407–409), and [YT current program][yt-program].

## Northwest Territories: flat payment conditional on federal receipt

The [Senior Citizens Benefits Act][nt-act], ss. 1, 3–4, requires receipt of GIS or the spouse's allowance in NT and
ordinary residence/home in NT, excluding tourists, transients and visitors. It permits payment for each month
of federal receipt. Eligibility ends when those conditions cease, or after payment for the month of death.
The [Amount of Benefit Regulations][nt-reg], s. 1, sets $196 monthly, effective September 1, 2017; the current
[program page][nt-program] confirms that amount. No territorial income threshold, household reduction rate,
indexation or declining-dollar table appears in this flat-payment rule.

| Tax year | Territorial maximum/month | Territorial threshold and phaseout | Benefit period |
|---|---|---|---|
| 2025 | $196 per eligible adult | Positive qualifying GIS/Allowance; then $196, otherwise zero | Each eligible month |
| 2026 | $196 per eligible adult | Same | Each eligible month |

The program is automatic with GIS/OAS or the spouse's Allowance and is included in the federal monthly payment.
Applying for GIS and annual filing maintain entitlement. There is no separate annual NT July–June amount;
July–June federal income reassessment and quarterly federal rates can change whether a month qualifies.
[NT administration][nt-program] and [Act][nt-act].

**Income definition:** this is federal receipt eligibility, not federal line 23600 or AFNI against a new NT
threshold. Reuse the actual per-month GIS/Allowance entitlement. The existing #19 income model includes
CPP/QPP/private pensions, ordinary investment income, taxable gains and grossed-up dividends; it excludes OAS
and supplements, applies the employment/self-employment exemption and supported deductions, and combines spouse
income where applicable. See the sourced [#19 income analysis](../19-gis-allowance.md) and
[gisIncomeOf](../../../src/engine/gis-allowance.ts). A simple gross-income cutoff would be wrong for earnings,
deductions or a mixed-age couple. The federal Allowance is a 60–64 benefit; GIS normally begins with OAS at 65.
Monthly eligibility should follow those federal paths rather than require age 65 for every territorial recipient.

The official Act uses the historical term spouse's allowance. Its precise application to Allowance for the
Survivor was not resolved here. Survivor Allowance is already outside #19 coverage; do not silently claim it is
supported by adding the territorial benefit.

## Nunavut: flat payment, with an unresolved legal/publication mismatch

The [current NU program page][nu-program] says $300 monthly, automatically merged with the OAS payment, for
Nunavummiut aged 60+ receiving federal GIS or the spouse's Allowance. It confirms T5007 reporting. An official
[2021–22 poverty reduction report][nu-poverty] also records the increase to $300, so this is not only a current
undated website value.

The [current Family Services grants policy][nu-policy], Schedule A-11, printed p. 23, revised August 10, 2023 and
expiring March 31, 2027, links entitlement to the Senior Citizens Benefits Act and federal eligibility. It says
65+ GIS recipients or Allowance recipients whose spouse receives GIS; its printed age range is **60–84**, an
apparent typo that must not become an implementation rule. Federal Allowance ages control the modelled path.
Payments continue monthly while federally eligible, with the federal government supplying monthly benefit data.

| Tax year | Administrative maximum/month | Territorial threshold and phaseout | Evidence status |
|---|---|---|---|
| 2025 | $300 per eligible adult | Positive qualifying GIS/Allowance; no separate territorial taper published | Strong administrative evidence; legal rate discrepancy unresolved |
| 2026 | $300 per eligible adult | Same | Same; current policy expires in 2027 |

The official legislative index presently links a [2015 consolidated rate regulation][nu-reg] whose sole rate is
**$200**, without a linked later amendment on that entry. Its [2014 consolidated Act][nu-act] must be read with
[S.Nu. 2019, c. 12][nu-amend]: the 2019 amendment replaces spouse's allowance with the more general allowance
authorized under the Old Age Security Act. It does not establish the $300 rate. The index also flags 2020
consequential amendments; a complete consolidation audit remains necessary before coding.

Use $300 for materiality and the prospective administrative rule; do not describe the cached $200 regulation as
proof of $300, or silently replace $300 with $200. Obtain the authorizing change/instrument, effective date and
any current survivor-allowance interpretation. The 2019 broader wording makes a survivor-path omission especially
important to disclose. The present engine supports the spouse's Allowance only.

Income assessment and benefit-year handling follow the federal GIS/Allowance machinery, as for NT: there is no
new Nunavut net-income taper established by these publications. Full-year arithmetic assumes continuous federal
entitlement; birthdays and months with no GIS/Allowance require proration.

## Yukon: material indexed maximum, missing modern formula and transition dates

The [current program page][yt-program] gives maximum $323.26 monthly and bases the payment on the person's
GIS amount. Its bullet list simultaneously mentions age 65/OAS/GIS and spouse/survivor Allowance, so it cannot
be read as a conjunction requiring every condition. The dated [October 2023 government announcement][yt-2023]
expressly includes spouses aged 60–64 receiving Spouse's or Survivor's Allowance.

The [spring 2025 ministerial briefing][yt-briefing], printed pp. 10–12, supplies stronger dated evidence:

- The maximum following the October 2024 CPI adjustment of 2.4% was $314.46, versus $307.08 after the 2023
  adjustment of 6.4%.
- YSIS increases with CPI calculated each October and normally pays around the 15th, after federal data arrive.
- An October 2024 transcription error in OAS inputs reduced YSIS payments; corrective payments followed
  November 1. The government reviewed formulas and procedures with Canada.
- Temporary inflation payments operated April 2023–March 2024 and were not renewed. They are not 2025/26
  recurring supplements.

| Period needing parameters | Confirmed evidence | Still missing |
|---|---|---|
| Jan–Sep 2025 | October 2024 maximum $314.46, documented March 2025 | Modern household/category formula and rounded payment table |
| Oct–Dec 2025 | Annual October indexation exists | Dated October 2025 maximum and transition evidence |
| Jan–Sep 2026 | Current page gives $323.26 | Proof this is the rate throughout that period |
| Oct–Dec 2026 | Annual October indexation exists | Dated October 2026 maximum and transition evidence |

The public [legislative index][yt-reg-index] identifies Seniors Benefit Regulation, O.I.C. 2017/121, effective
July 1, 2017. The official [statute amendment table][yt-statute-index] says the old Act's amount formula, s. 3,
was repealed January 1, 2009. The readily searchable [2002 Act PDF][yt-stale-act] still contains the old $100
formula. **It is stale evidence and is not an implementation source.** The current regulation/formula could not
be retrieved in this pass. In particular, do not infer a proportional-GIS formula, a new taxable-income cutoff,
or a flat payment equal to the maximum. The 2016 [government release][yt-2016] confirms that changed federal GIS
rules required a territorial formula correction; category and top-up treatment matter.

YSIS is in scope. Remaining implementation prerequisites are the modern formula, marital/federal benefit
categories, October 2025/2026 maximums, cents rounding, minimum payments, commencement delay, and allowance
handling. Annualized current maximums establish materiality but cannot supply exact calendar-year fixtures.

## Adjacent programs: size before deferral or exclusion

| Program | Published size | Scope decision and input gap |
|---|---|---|
| YT Pioneer Utility Grant | 2025 maxima $1,340.94 Whitehorse / $1,448.21 rural; 2026 $1,382.58 / $1,466.50 | Material. Housing/heating grant, not GIS supplement; separate explicit scope decision, not a claim it is negligible |
| NT Senior Home Heating Subsidy | From 2025–26: $460/$560/$750 monthly for eight months; $3,680/$4,480/$6,000 by zone | Consumption/supplier-dependent; exclude from unconditional cash supplement calculation, disclose separately |
| NU Senior Fuel Subsidy | Up to 4,000 litres; 100% reimbursement at homeowner total net income ≤$100,000 | Material consumption-dependent support; cash size is eligible litres × actual fuel price, not a flat cash benefit |
| YT Supplementary Allowance | $250 monthly, or $3,000 annualized | Social-assistance eligibility required; outside generic senior top-up unless assistance model is added |
| YT senior Home Owners Grant | Up to 75% of residence property tax, maximum $500; ordinary maximum $450 | #22 property-tax relief; senior increment can be $50 at both caps, larger below caps |
| NT senior/disabled property-tax relief | General Taxation Area: 100% rebate of qualifying property tax | #22; material amount equals eligible tax, varies by ownership/community |
| NU senior/disabled property-tax relief | Government confirms program; exact current dollars/rate not resolved here | #22; unknown size is an evidence gap, not evidence of immateriality |

PUG sources: dated [2025 information sheet][pug-2025], [2026 program][pug-2026], and cached
[2026 privacy assessment][pug-pia]. It covers owners and renters, requires annual application, and considers
income, residence and utility costs. In 2026 the page requires 2025 NOA net income and cuts off above $154,206
single/$217,470 couple. It does not require GIS. Its full phaseout and actual-heating-cost cap need separate
verification if selected for implementation; do not automatically discard it simply because it is labelled utility.

NT heating sources: [program][nt-heat] and [FAQ][nt-heat-faq]. Ages 60+, own/occupy or rent a self-contained home
with separate heat, no Income Assistance; annual application. 2025–26 zone household limits are
$66,000/$75,000/$87,000. The subsidy pays suppliers; unused monthly amounts carry forward. These are heating-season
totals, not calendar 2025/2026 totals. [NU fuel program][nu-fuel] requires permanent residency, age 60+, home
ownership/occupancy, no social assistance and annual application.

Other sources: [YT supplementary allowance][yt-extra], [YT homeowner grant][yt-hog], [NT property relief][nt-property]
and the [NU property-tax relief Act][nu-property]. This is not a complete survey of assistance, public housing,
home repair or health services. Those have separate needs, assets, residence or actual-expense conditions;
unverified amounts remain unverified rather than being assigned zero.

## Reporting, engine seam and double counting

NT's page and YT's page say a T5007 is issued above $500 in a calendar year; NU's page says recipients receive
one each tax year. Phase 2 corrected the original inventory's reporting-threshold interpretation: the
[CRA issuer guide](sources/federal-tax-slips.txt) excludes a series totalling $500 or less from slip reporting,
and [BC's FAQ](sources/bc-tax-slip.txt) expressly says its recipients need not report that income. Keep cash
and reportable income separate, and verify program-specific application. See
[the phase-2 reporting correction](evidence-west-phase2.md). [CRA T5007 instructions][t5007]
put box 11 provincial/territorial supplements on **line 14500**, included in net income, with an equal
**line 25000 taxable-income deduction**. For spouses living together, the higher-net-income spouse reports the
amount; ties use the named recipient. The [line 14500 instructions][line145] explain the comparison excludes
social assistance and the childcare/recovery deductions. Do not assign all reported income automatically to the
adult receiving the cash.

Current `gis-allowance.ts` calculates monthly federal benefits only; `household.ts` adds their total to cash
benefits; `payroll.ts`/`personal.ts` handle line 14600 federal supplements and their taxable-income deduction.
No `T5007`/territorial-supplement path exists. Territorial cash therefore is absent today, and adding it as
`netFederalSupplements` would confuse line 14500 with line 14600 and recipient with tax reporter.

Suggested seam: calculate territorial entitlement after monthly federal GIS/Allowance; preserve per-adult cash
and per-month eligibility, then separately attribute T5007 reportable income and the taxable-income deduction.
Add cash to benefits once. Exclude it from GIS-test income, consistent with #19's sourced income definition;
do not route it through taxable Other income, payroll, pension credits or elected pension splitting. Preserve
the existing explicit GIS/Allowance opt-ins and disclose their full-residency/current-income-proxy assumptions.

Correctness cases should cover two eligible pensioners, a 60–64 Allowance spouse, first/last eligible month,
positive versus zero federal entitlement, a near-GIS-exhaustion month receiving the full NT/NU flat payment,
and higher-income-spouse T5007 attribution with offsetting taxable deduction. YT additionally needs independent
published category/boundary rows and October transitions after the missing evidence is obtained.

## Cached evidence and fetch limitations

Each successful raw download below records URL, 2026-11-05 retrieval date and original-file SHA-256. The custom
temporary wrapper used `scripts/fetch-source.ts`'s exported helpers with this issue's destination and did not
edit any annual `sources/INDEX.md`. HTML hashes can change without substantive text changes.

| Local extract | Evidence |
|---|---|
| [NT Act](sources/territories-nt-act.txt) | Actual PDF downloaded from GNWT's new legacy-files URL |
| [NT regulation](sources/territories-nt-regulation.txt) | Actual PDF; $196/month |
| [NT program](sources/territories-nt-program.txt) | Current program, reporting and automatic payment |
| [NU Act](sources/territories-nu-act.txt) | Old consolidation; subsequent amendment required |
| [NU 2019 amendment](sources/territories-nu-amend-2019.txt) | Changes spouse's allowance to allowance |
| [NU regulation](sources/territories-nu-regulation.txt) | Stale $200 consolidated text; retain discrepancy evidence |
| [YT 2025 briefing](sources/territories-yt-briefing-2025.txt) | PDF pp. 407–409; rates, correction, timing |
| [NT heating](sources/territories-nt-heating.txt) | Current zone amounts and eligibility |
| [NT heating FAQ](sources/territories-nt-heating-faq.txt) | Supplier payments and carry-forward |
| [NT property relief](sources/territories-nt-property.txt) | 100% GTA rebate |
| [PUG privacy assessment](sources/territories-yt-pug.txt) | Program nature, inputs and annual application |
| [CRA T5007](sources/territories-t5007.txt) | Reporting and deduction |

Direct raw HTTP downloads of Yukon program/law pages and Nunavut program/policy PDFs returned 403; the web tool
could read the cited official indexed text. No original-file hash is claimed for those uncached sources.
Some old justice.gov.nt.ca PDF URLs redirect to HTML resource pages; the cached NT legal sources above instead
use the actual PDFs under `gnwt.ca/sites/default/files/legacy_justice/`. Treat missing downloadable originals
and the rate/formula gaps identified above as remaining verification work.

[nt-act]: https://gnwt.ca/sites/default/files/legacy_justice/files/legislation/senior-citizens-benefits/senior-citizens-benefits.a.pdf
[nt-reg]: https://gnwt.ca/sites/default/files/legacy_justice/files/legislation/senior-citizens-benefits/senior-citizens-benefits.r1.pdf
[nt-program]: https://www.ece.gov.nt.ca/en/services/income-security-programs/nwt-senior-citizen-supplementary-benefit
[nu-program]: https://www.gov.nu.ca/en/social-supports/senior-citizen-supplementary-benefit-scsb
[nu-act]: https://www.nunavutlegislation.ca/en/file-download/download/public/176
[nu-reg]: https://www.nunavutlegislation.ca/en/file-download/download/public/657
[nu-amend]: https://www.nunavutlegislation.ca/en/file-download/download/public/2561
[nu-policy]: https://www.gov.nu.ca/sites/default/files/policies-legislations/2024-01/Grants%20and%20Contributions%20Policy%200823%200327.pdf
[nu-poverty]: https://www.gov.nu.ca/sites/default/files/documents/2024-03/Minister%27s%20Annual%20Report%20PRD%202021-22%20-%20English.pdf
[yt-program]: https://yukon.ca/en/ysis
[yt-briefing]: https://open.yukon.ca/information/c5a31769-93f5-4b0a-9bff-d57551764a56/resource/378a5fa4-730c-32be-86c4-fa5ab18b2c19/download/hss_spring_2025.pdf
[yt-2023]: https://yukon.ca/en/news/recipients-yukon-seniors-income-supplement-receive-payment-two-installments-month
[yt-reg-index]: https://laws.yukon.ca/cms/table-of-public-statutes.html?catid=93&id=206%3Aindex-of-regulations-s&view=article
[yt-statute-index]: https://laws.yukon.ca/cms/table-of-public-statutes.html?catid=95&id=260%3Atable-of-public-statutes-s&view=article
[yt-stale-act]: https://laws.yukon.ca/cms/images/LEGISLATION/acts/seinsu.pdf
[yt-2016]: https://open.yukon.ca/information/23402bc0-d679-4e16-a889-a1fc8250411b/resource/f4c3e6db-0d0c-30f6-b13a-258c8bac7547/download/16-273.pdf
[pug-2025]: https://yukon.ca/sites/default/files/2025-07/H4_Form_PUG_Information_FinalPrint.pdf
[pug-2026]: https://yukon.ca/en/pioneer-utility-grant
[pug-pia]: https://open.yukon.ca/pia-summaries/pioneer-utility-grant
[nt-heat]: https://www.ece.gov.nt.ca/en/services/income-security-programs/senior-home-heating-subsidy
[nt-heat-faq]: https://www.ece.gov.nt.ca/en/services/income-security-programs/senior-home-heating-subsidy-faqs
[nu-fuel]: https://www.gov.nu.ca/en/social-supports/seniors-fuel-subsidy
[yt-extra]: https://yukon.ca/en/legal-and-social-supports/supports-adults-and-seniors/apply-allowance-supplement-your-social
[yt-hog]: https://yukon.ca/en/housing-and-property/property-tax-and-assessments/apply-home-owners-grant
[nt-property]: https://www.maca.gov.nt.ca/en/services/seniors-and-disabled-persons-property-tax-relief
[nu-property]: https://www.nunavutlegislation.ca/en/consolidated-law/senior-citizens-and-disabled-persons-property-tax-relief-act-consolidation
[t5007]: https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/tax-slips/statement-benefits-t5007.html
[line145]: https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/personal-income/line-145-social-assistance-payments.html

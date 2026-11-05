# Issue #21 phase 2: territories and Alberta reporting evidence

Research by Codex Sol, `gpt-6.1-sol`, `xhigh`, on 2026-11-05. This note records evidence for later implementation;
it changes no engine, data or golden expectations. Use the existing current-income proxy and federal eligibility
inputs. Survivor Allowance and care facilities remain excluded; Pioneer Utility Grant belongs to #216.

## Territorial decision and remaining gaps

| Program | 2025 and 2026 treatment | Evidence and limitation |
|---|---|---|
| NT SCSB | $196 per eligible adult per qualifying month | Verified regulation; no independent territorial taper |
| NU SCSB | $300 per eligible adult per qualifying month, `estimated: true` | Administrative continuation; legal rate instrument/date unresolved |
| YT YSIS | Explicitly unsupported | Modern formula and dated October 2025/2026 rates unresolved |

NT's [rate regulation][nt-reg] fixes $196 monthly, effective September 1, 2017; its
[administrative page][nt-program] confirms the amount. The [Act][nt-act] ties each month's payment to GIS or
the spouse's Allowance and ordinary NT residence. There is no separate flat income threshold or taper to add.
Continuously eligible adults receive `196 × 12 = $2,352`; two eligible adults receive $4,704. The spouse's federal
Allowance path covers ages 60–64; requiring every territorial recipient to be 65 would omit eligible spouses.

Nunavut's [2023–24 ministerial report][nu-report], p. 31, explicitly records $300/month and an average 620 clients
from January to April 2024. This corroborates the [current program page][nu-program] and the earlier government
report cited in [the inventory](territories.md). The new [cached extract](sources/territories-phase2-nu-report-2024.txt)
therefore establishes a dated $300 administrative rate before both target tax years, rather than relying solely
on an undated current page. The report's imprecise federal benefit terminology does not replace the Act/policy
eligibility conditions.

The official legislative index still supplies a [rate regulation][nu-reg] with $200, consolidated in 2015.
The [2019 amendment][nu-amend] broadens the Act's spouse's allowance wording to allowance; it does not set $300.
The authorizing $300 instrument and first effective date were not recovered. For 2025/2026, the proposed
`estimated: true` derivation is continuation of the documented $300 administrative rate, supported by the current
program and policy. Do not claim the stale $200 regulation proves $300. A continuously eligible adult's estimated
calendar receipts are `300 × 12 = $3,600`; two adults receive $7,200. No independent NU taper was found.

YT's dated [spring 2025 briefing][yt-briefing] supports the October 2024 maximum $314.46; the
[current page][yt-program] gives $323.26. Their annualized run rates are $3,773.52 and $3,879.12, respectively.
These are not verified calendar-year totals. The modern category/formula rules, October 2025 rate and October
2026 rate remain missing. Do not substitute the repealed $100 formula, scale GIS proportionally, or pay the
maximum as a flat amount. Explicit unsupported status preserves this material omission for later work.

## Independent federal eligibility boundaries for NT/NU

These examples use published federal rows, independently of this engine. Income is the federal annual
GIS/Allowance-test amount after its exclusions and deductions, not gross earnings or line 23600.
The sources are [January–March 2025 tables][gis-2025] and [January–March 2026 tables][gis-2026], already cached in
[2025](../2025/sources/gis-table-q1.txt) and [2026](../2026/sources/gis-table-q1.txt).

| Quarter/category | Annual test income | Monthly federal entitlement | Monthly NT / NU consequence |
|---|---|---|---|
| 2025 Q1 single | $22,032–$22,055.99 | GIS $0.52 | Full $196 / $300 to the adult |
| 2025 Q1 single | $22,056 | GIS zero | Zero territorial payment |
| 2026 Q1 single | $22,464–$22,487.99 | GIS $1.00 | Full $196 / $300 to the adult |
| 2026 Q1 single | $22,488 | GIS zero | Zero territorial payment |
| 2025 Q1 GIS + Allowance couple | $40,752–$40,799.99 | GIS $250.99; Allowance $0.53 | $196 / $300 to each adult |
| 2025 Q1 couple, spouse Allowance exhausted | $40,800 | Older adult GIS $250.52; Allowance zero | $196 / $300 to older adult only |
| 2026 Q1 GIS + Allowance couple | $41,568–$41,615.99 | GIS $256.26; Allowance $0.74 | $196 / $300 to each adult |
| 2026 Q1 couple, spouse Allowance exhausted | $41,616 | Older adult GIS $256.00; Allowance zero | $196 / $300 to older adult only |

Monthly territorial entitlement follows positive qualifying federal entitlement, including the last small payment.
Birthdays, quarterly federal rates and the annual federal reassessment can change qualifying months. The project
continues to approximate the federal assessment using current income; no prior-year-income input is proposed.

## T5007: cash recipient, tax reporter and the $500 exception

[CRA's line 14500 guidance][cra-145] puts box 11 social assistance into net income and permits an equal deduction
on line 25000, leaving taxable income unchanged. For spouses living together, the higher-income spouse reports
both spouses' reportable payments. Compare net income excluding line 14500 and before the deductions on lines
21400 and 23500; equivalently add those deductions back before comparing. Ties leave each slip with its named
recipient. This attribution is separate from the adult who receives the cash. The [T5007 guide][cra-guide]
and [Income Tax Act paragraph 56(1)(u)][ita-56] provide the corresponding reporting basis.

The $500 rule is a payer information-return exception, not a recipient income exemption.
[Income Tax Regulations subsection 233(1)][itr-233] requires an information return for relevant social assistance;
paragraph 233(2)(f) excepts a series whose calendar-year total does not exceed $500. Paragraph 56(1)(u) contains
no matching $500 income exclusion. For example, $120 of otherwise reportable recurring support still enters
line 14500, with the offsetting line 25000 deduction, even if no slip must be issued. Do not zero reportable
income merely because the annual payment is at or below $500. Other legal exceptions are separate conditions.

NT and NU program pages identify T5007 reporting. For Alberta, the [Auditor General's official ASB report][ab-audit],
printed p. 53, explicitly says recipients report ASB as income and deduct it when calculating taxable income.
That publication is from 2005: it corroborates the reporting mechanism, not present rates. Current CRA guidance
provides the net-income, taxable-deduction and spouse-attribution rules. A current Alberta page explicitly naming
the ASB T5007 slip was not located in this pass; that exact present-day label remains a source gap.

An attribution example independent of benefit computation: adults with comparison incomes $8,000 and $12,000
receive $2,352 each in NT cash. The second adult reports $4,704 at line 14500 and deducts $4,704 at line 25000;
the cash recipients retain $2,352 each. At equal comparison incomes, each reports their own $2,352 instead.

The [current Alberta application][ab-application], section 5, separately requests applicant banking information
and spouse/partner banking information when that spouse is 65 or soon to turn 65. This supports distinct adult
cash recipients; the official estimator below independently shows the allocation. Do not automatically assign
all household ASB cash to the T5007 reporter or split one-senior-couple cash equally.

## Alberta: independent official calculator observations

The [public estimator][ab-estimator] calls the official [calculation endpoint][ab-api] using the request schema
in [its JavaScript][ab-code]. The cached [request/response cases](sources/territories-phase2-ab-estimator-cases.txt)
contain the effective date, every synthetic input, HTTP status, original response and SHA-256 of that response.
All requests used invented financial values and no identifying information; no application was submitted.
`APPASBAmount` and `SPSASBAmount` are applicant/spouse monthly cash results. Accommodation amounts were zero.

All cases use residence code `H`, applicant OAS eligibility, and explicitly supplied non-deductible income (NDI).
The applicant's synthetic OAS receipt is held at $8,791.10. Couple cases give an eligible spouse the same OAS
receipt; a spouse under 65 has no OAS. These controlled inputs isolate the tested rule and are not an OAS-rate
claim. The frontend's old embedded constants are not current rate evidence; the official service responses are.

| Effective date and case | Annual NDI applicant / spouse | Applicant / spouse monthly ASB |
|---|---|---|
| January 2026 single | $10,000 / — | $199.50 / — |
| January 2026 single | $0 / — | $328.84 / — |
| January 2026 single | $25,295.10 / — | $10 / — |
| January 2026 single | $25,425.25 / — | $10 / — |
| January 2026 single | $25,425.26 / — | $0 / — |
| July 2026 single | $0 / — | $328.84 / — |
| July 2026 single | $23,020.10 / — | $10 / — |
| July 2026 single | $23,022.16 / — | $10 / — |
| July 2026 single | $23,022.17 / — | $0 / — |
| July 2026 two eligible adults | $0 / $0 | $246.59 / $246.59 |
| July 2026 only applicant 65+ | $0 / $0 | $493.17 / $0 |
| July 2026 two eligible adults | $0 / $10,000 | $175.05 / $175.05 |
| July 2026 two eligible adults | −$5,000 / $10,000 | $175.05 / $175.05 |
| July 2026 two eligible adults | $0 / $34,000 | $10 / $10 |
| July 2026 only applicant 65+ | $0 / $34,000 | $10 / $0 |
| July 2026 two eligible adults | $0 / $34,467.09 | $10 / $10 |
| July 2026 two eligible adults | $0 / $34,467.10 | $0 / $0 |

The January $10,000 result resolves the conflicting single reduction-rate evidence: using the documented $3,946
annual maximum, `(3946 − 0.1552 × 10000) / 12 = $199.50`, exactly the service result. Substituting 0.1522 gives
$202 and fails this independent oracle. This supports 0.1552 for January 2026, even if a later publication's
retrospective column differs.

The published $25,295 January and $23,020 July guideline amounts are not hard NDI cutoffs: the service pays $10
above them. The cached cases establish positive-payment and zero-payment observations at the cent boundaries
shown above. They also show the $10 minimum is applied per eligible adult: two seniors receive $20 household
cash; one senior receives $10. Negative applicant NDI does not offset the spouse's positive NDI in the tested
couple, consistent with flooring individual NDI before combination.

The zero-income observations match upward cent rounding after allocation: $3,946 / 12 gives $328.84 paid;
$5,918 / 24 gives $246.59 to each of two seniors; $5,918 / 12 gives $493.17 to the only eligible senior.
Their twelve-month run rates are $3,946.08, $5,918.16 and $5,918.04. Do not silently replace observed monthly
cash with nominal annual maxima, or treat those run rates as independently verified calendar receipts.

**Intermediate precision is unresolved.** A simple unrounded-positive-annual-benefit rule disagrees with the
July $23,022.17 zero result by a tiny residual. Extra sub-cent input cases are retained in the cache, but do not
establish the service's complete input/intermediate-rounding algorithm. The observations support the listed
boundaries and ordinary upward-cent examples; they do not justify inventing a general precision rule.

## Additional source cache

Every source extract records its official URL, retrieval date and SHA-256 of the original download. The API cache
instead records each original response hash alongside its request. The small estimator-page extract preserves
only a page summary; use the JavaScript and response cache for request/result evidence.

| Extract | Purpose |
|---|---|
| [NU 2023–24 report](sources/territories-phase2-nu-report-2024.txt) | Dated $300 administrative amount |
| [CRA line 14500](sources/territories-phase2-cra-line145.txt) | Net income, deduction and spouse attribution |
| [CRA T5007 guide](sources/territories-phase2-cra-t5007-guide.txt) | Payer and recipient reporting |
| [Income Tax Act s. 56](sources/territories-phase2-income-tax-act-56.txt) | Recipient income-inclusion rule |
| [Income Tax Regulations s. 233](sources/territories-phase2-income-tax-reg-233.txt) | $500 information-return exception |
| [AB audit](sources/territories-phase2-ab-audit-tax.txt) | ASB reported income and taxable deduction |
| [AB application](sources/territories-phase2-ab-application.txt) | Separate adult payment banking details |
| [AB estimator page](sources/territories-phase2-ab-estimator.txt) | Official calculator entry point |
| [AB estimator JavaScript](sources/territories-phase2-ab-estimator-code.txt) | Official request schema |
| [AB estimator responses](sources/territories-phase2-ab-estimator-cases.txt) | Synthetic independent boundary observations |

[nt-reg]: https://gnwt.ca/sites/default/files/legacy_justice/files/legislation/senior-citizens-benefits/senior-citizens-benefits.r1.pdf
[nt-act]: https://gnwt.ca/sites/default/files/legacy_justice/files/legislation/senior-citizens-benefits/senior-citizens-benefits.a.pdf
[nt-program]: https://www.ece.gov.nt.ca/en/services/income-security-programs/nwt-senior-citizen-supplementary-benefit
[nu-program]: https://www.gov.nu.ca/en/social-supports/senior-citizen-supplementary-benefit-scsb
[nu-report]: https://www.assembly.nu.ca/sites/default/files/2025-02/TD-360-6%282%29-EN-Minister%E2%80%99s%202023-2024%20Report%20on%20Poverty%20Reduction.pdf
[nu-reg]: https://www.nunavutlegislation.ca/en/file-download/download/public/657
[nu-amend]: https://www.nunavutlegislation.ca/en/file-download/download/public/2561
[yt-program]: https://yukon.ca/en/ysis
[yt-briefing]: https://open.yukon.ca/information/c5a31769-93f5-4b0a-9bff-d57551764a56/resource/378a5fa4-730c-32be-86c4-fa5ab18b2c19/download/hss_spring_2025.pdf
[gis-2025]: https://publications.gc.ca/collections/collection_2025/edsc-esdc/SG3-3-2025-1.pdf
[gis-2026]: https://publications.gc.ca/collections/collection_2026/edsc-esdc/SG3-3-2026-1.pdf
[cra-145]: https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/personal-income/line-145-social-assistance-payments.html
[cra-guide]: https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4115/guide-t5007-return-benefits.html
[ita-56]: https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-56.html
[itr-233]: https://laws-lois.justice.gc.ca/eng/regulations/C.R.C.,_c._945/section-233.html
[ab-audit]: https://www.oag.ab.ca/wp-content/uploads/2020/05/2005_-_May_2005_Seniors_Care_Report_xhOqJxi.pdf
[ab-application]: https://www.alberta.ca/system/files/alss-seniors-financial-assistance-information-application.pdf
[ab-estimator]: https://www.seniors.alberta.ca/benefit-estimate-calculator
[ab-api]: https://www.seniors.alberta.ca/submit-documents/EstimateBenefits.php
[ab-code]: https://www.seniors.alberta.ca/js/estimators/webcalc.min.js

# Halifax and Toronto evidence follow-up, #22 phase 1b

Checked **2026-11-05**. Research only; no production files or goldens change. The user's decisions on
[#22](https://github.com/yuorme/tax-visualizer/issues/22) apply municipal relief **only to the default reference-city bill**.
Custom province bills do not identify a city and must not receive Toronto/Halifax relief automatically.
Use annual entitlement for the benefit year, labelled as such. Saved bills keep their gross meaning and
an explicit net-bill choice is added at implementation. Housing allowances are assigned to #216.

## Halifax: 2026/27 table found; minimum-payable conflict remains

The new [municipal tax-assistance page](sources/gap-municipal-halifax-program-2026.txt), modified May 26,
2026, links the [2026 guide](sources/gap-municipal-halifax-guide-2026.txt), PDF page 5, and
[2026 application](sources/gap-municipal-halifax-application-2026.txt). These are successful raw downloads
with original hashes. The old generic Information Guide URL instead serves a **2020/21** table; it must
not be treated as current evidence. The new Table T was also checked visually against the official image:
[2026/27 table](https://cdn.halifax.ca/sites/default/files/pages/in-content/2026-05/table-t-2026.png).

| Benefit/fiscal year | Income band 1 | Band 2 | Band 3 | Band 4 | Band 5 |
|---|---|---|---|---|---|
| 2025/26 | 0–33,000 | 33,001–37,000 | 37,001–41,000 | 41,001–45,000 | 45,001–49,000 |
| 2026/27 | 0–39,000 | 39,001–44,000 | 44,001–49,000 | 49,001–54,000 | 54,001–59,000 |
| Rebate percentage, both tables | 100% | 80% | 60% | 40% | 20% |

The property-tax brackets and maximums are unchanged: tax at most $2,500 gives maximum $1,200;
$2,501–$3,500 gives $1,300; above $3,500 gives $1,400. Multiply the maximum by the band's percentage.
The 2026 guide uses gross income of **all adult residents**, including roommates, and requires current
CRA NOA/Option C with **line 15000** plus applicable world-income, rental and business documents.
[AO10](sources/atlantic-ns-halifax-ao10.txt), sections 3.4 and 4.2, makes it prior-calendar-year income,
so the 2026/27 entitlement uses 2025 income, with its enumerated exclusions. It is not couple-only AFNI.
Taxable assessment at most $425,000 is required from April 1, 2026 unless the owner receives GIS or
specified federal/provincial disability support; market value is not interchangeable with taxable assessment.

**Unresolved conflict:** the 2026/27 guide and visual Table T print minimum tax payable
**$170/$350/$390/$430/$470**, unchanged from 2025/26. AO10 section 6.1 instead requires the greater
of $100 and 1% of the relevant income band's midpoint, rounded to $10. On the new bands that implies
approximately **$200/$420/$470/$520/$570**. This is a primary-source inconsistency, not missing inflation
arithmetic. Do not claim both as the same rule or silently resolve it by carrying the old minimums forward.
The legal formula has higher authority than the guide, but a calculation purporting to reproduce the
municipality's 2026 awards needs clarification/corrected guidance. Preserve this as an implementation
boundary limitation or obtain municipal confirmation before asserting exact low-bill awards.

The usual sizing example is unaffected: $1,830 eligible tax and $35,000 household income in 2026/27
gives maximum $1,200, leaving $630, above either competing minimum. In 2025/26 the same income falls
in band 2, giving $960, not $1,200. A $1,300 bill at low 2026 income exposes the conflict: table-floor
interpretation permits $1,130 relief; AO10's $200 floor permits $1,100. Do not use the conflicting guide's
phrase "deducted from rebate" to subtract the floor from every maximum: AO10 applies a floor to the net bill.

## Toronto: reference income and levy construction clarified

Sources: downloaded [2026 application](sources/gap-municipal-toronto-application-2026.txt),
[Code 767, Article 5](sources/gap-municipal-toronto-code767.txt),
[2026 budget-implementation report, pages 20–21 and 24](sources/gap-municipal-toronto-budget-implementation-2026.txt),
and the previously cached 2025/2026 budget summaries. The Code URL currently serves the **May 2023**
consolidation, not a final 2026 consolidation. Its formula is a continuing-rule source; the dated later
application/budget overrides its obsolete income thresholds and application dates. A later consolidation
was not obtained. Do not present the 2023 income limit as current.

The 2026 application explicitly requires **2025 NOAs** for every resident owner and each owner's spouse;
the indexed [2025 application](sources/gap-municipal-toronto-application-2025-web.txt) explicitly requires
**2024 NOAs**. Non-resident owners can be excluded with proof of residence elsewhere, with additional
extenuating-circumstance documents accepted in 2026. All resident owners other than the applicant's spouse
must meet eligibility. Therefore this is not simply the engine's applicant-and-spouse net-income sum.
The qualifying household-income limits are **$60,000 in 2025/$62,000 in 2026**; the assessment limit is
**$975,000 or less**, not strictly below. The current 2026 form requires ownership/occupation for a year
before October 31, 2026, good-standing tax/utility accounts and a new application each year.

**Income definition:** Code 767-5.1 says combined **gross income**, not net income. The indexed
[2023 form](sources/gap-municipal-toronto-application-2023-web.txt) explicitly names **line 15000**;
the downloaded [2019 form](sources/gap-municipal-toronto-application-2019.txt) names its former line 150.
The 2025 indexed form and downloaded 2026 form omit the line number, while continuing to request prior
NOAs and combined income. Using prior-year line 15000 is thus supported by the Code and historical
form; it is a **continuation interpretation**, not an explicit line-15000 instruction newly verified on
the final 2025/2026 forms. Never substitute AFNI or taxable income. The accepted contemporary line
number remains a narrow administrative-confirmation gap if final-form precision is required.

The 2026 form explicitly includes age 60–64 recipients of an **allowance under the Old Age Security Act**;
the web eligibility page's GIS shorthand must not be read as requiring ordinary age-65 GIS at 60. Age 65+
qualifies without that supplement. The age-50 pension route applies to deferral/utility programs, not the
property-tax cancellation column. Check the original table where column alignment matters.

**Levy and amount:** Code 767-5.1 defines current/previous taxes **before** amounts deferred or cancelled
under this or previous programs. Tax increase excludes the portion caused by erection, alteration,
enlargement or improvement of the property. Section 767-5.4 cancels the sum of the current eligible
increase **plus previously cancelled increments still payable in the current year**, provided the sum is
at least **$10**. After two consecutive years without an approved application, prior cancelled increments
cannot be resumed. A current-year-increase-only formula therefore understates continuing recipients.
Use approved prior cancellation history, or explicitly scope a first-time claimant estimate; do not infer
that history from age alone. This structure is documented in the 2023 Code; no contrary later structural
amendment was found, but a 2025/2026 consolidated text was not retrieved.

The 2026 budget report confirms provincial **education tax** has been cancelled under the program,
so education is not categorically excluded. Current/previous total-tax definitions include all levy taxes;
the **City Building Fund** is a property-tax levy, and the annual published municipal increases expressly
include it. Its inclusion follows from those definitions, rather than a separate exclusion or another
standalone grant. Ordinary 2026 education tax is unchanged on the average home, so it contributes $0
new increase in that example; it can still matter in restored previously cancelled increases.
Utility charges, penalties and interest are not ordinary annual levy taxes; do not inflate the eligible
year-over-year levy by utility rebates or arrears charges. Construction-driven levy changes are excluded.

Independent examples, assuming eligible income/ownership and no construction change:

- The 2026 average-home report has city taxes about $4,160 to $4,252 and education $1,059 to $1,059.
  A first-time claimant's eligible increase is about $92, including City Building Fund; the precise budget
  summary amount is $91.53 before rounded tabular dollars.
- With $268 previously cancelled still payable plus $91.53 new increase, a continuing claimant can have
  **$359.53**, rather than $91.53, subject to the Code's continuity rules and actual approved history.
- A current levy increase $200 containing $150 caused by new construction gives $50 eligible new
  increase, before allowed prior cancellations. A $9 total cancellation is below the Code's $10 minimum.

## Proportionate search record and remaining limits

- Halifax: searched government-domain 2026/27 exemption, Table T, $59,000 and guide queries. The old
  tax/exemptions path and some browser requests returned 403. Following the current Affordable Access
  landing page to `/about-halifax/affordable-access-program/tax-bill-payment-assistance` found the new
  2026 guide/application and table image. The generic older guide URL returned 2020/21; it was rejected
  as current evidence. Guide/table amounts now close; the AO10 minimum-payable conflict remains.
- Toronto: searched current application/deadline page, 2025/2026 paper forms, line 15000, Code 767 and
  cancellation/City Building/education terms. The 2026 PDF downloaded. The indexed official 2025 and
  2023 PDF URLs returned 404 to both Node fetch and web open; their limited indexed evidence is recorded
  as web-only paraphrase without an invented original hash. The surviving 2019 PDF provides a raw
  historical income-line check. Code 767's official consolidated URL serves 2023, so current administrative
  line confirmation and final 2025/2026 structural consolidation remain bounded limitations.
- Scope is decided: Halifax, Toronto and St. John's municipal paths are included only on default-city
  estimates. They are not applied automatically to custom province bills. Annual benefit entitlement is
  the selected reporting convention; actual cash receipts and housing allowances are not remaining #22 choices.

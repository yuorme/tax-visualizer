# Manitoba school-tax evidence and rounding follow-up

Phase 1b for #22, checked **2026-11-05**. This adds evidence and proposes the input contract; no engine,
data or tests change. Manitoba's school-tax credits apply province-wide, so they remain relevant to custom
bills. The user's reference-city-only restriction concerns municipal relief, not the provincial HATC/rebate.
Housing Rent Assist belongs to [#216](https://github.com/yuorme/tax-visualizer/issues/216).

## School-tax input and default reference source: closed

Use **gross eligible residential school tax before HATC**, plus any HATC advance already credited to the
tax notice, as separate amounts. The [2025 MB479](sources/mb-479-2025.txt), page 2, asks for net school
tax at line 20 and the advance at line 21, then restores the gross eligible amount at line 22. The HATC
claim is its entitlement **less the advance**, not a second maximum. Page 4 limits the senior rebate to
school taxes remaining after HATC. The [2025 statute excerpt](sources/gap-mb-statute-2025.txt),
sections 5.3–5.6.1, supplies eligibility, ownership-day proration and credit ordering. Specified mobile-home
fees and community-revitalization-levy substitutions are separate documented categories, not a reason to
call every component of the total municipal bill a school tax.

Recommended controls for a custom Manitoba bill:

- Annual total bill, with the already-decided gross/net choice and actual credited relief amounts.
- An optional **gross school-tax amount before credits**, explicitly separate from the total bill.
  If the user has only the net school figure, collect the HATC advance so it can be reconstructed.
- No school-tax amount means **unknown**, not zero or the whole bill. Do not apply a Winnipeg school
  percentage to a province-wide custom bill. Show the school-dependent credit as incomplete until supplied.
- Validate the ordinary case's gross school amount against the reconstructed total gross bill. Zero school
  tax is explicit and permits no HATC/senior rebate. Keep exceptional fee/levy categories separate if enabled.

There is no single school division covering Winnipeg. The city's
[2025 and 2026 statistical publications](sources/gap-mb-statistics-2025.txt), page 1, both identify
**Winnipeg School Division No. 1** for their typical-home illustration. Use that named division as the
default reference proxy, rather than inventing a city-wide school rate. The
[historical combined rates](sources/gap-mb-historical-mills.txt), PDF pages 1–2,
[current 2026 table](sources/gap-mb-combined-2026.txt), and
[assessment portioning table](sources/gap-mb-portion-rates.txt) give:

| Reference parameter | 2025 | 2026 |
|---|---:|---:|
| Ordinary residential assessment portion | 45% | 45% |
| Municipal mill rate | 12.920 | 13.372 |
| Residential provincial Education Support Levy | 0 | 0 |
| Winnipeg School Division No. 1 special-levy mills | 14.630 | 15.994 |
| Combined municipal + school mills | 27.550 | 29.366 |
| School rate on full assessed value, derived | 0.0065835 | 0.0071973 |
| Combined ad-valorem rate on full assessed value, derived | 0.0123975 | 0.0132147 |
| School share of that ad-valorem levy, derived | 0.5310344827586207 | 0.5446434652319008 |

`schoolTax = fullAssessedValue × 0.45 × schoolMills / 1,000`. The 45% factor must not be applied twice.
The reference is residential: the non-residential provincial ESL column must not be added. The dated
[2026 statistics](sources/gap-mb-statistics-2026.txt), pages 3/7/8, corroborate the 2026 heading and rates;
the combined table's footer still says April 7, 2025, so that stale footer is not the evidence for the tax year.
The 2025 publication's corresponding pages corroborate 2025 values.

**Implementation assumption:** using an entered market home value as assessed value, and one division
as the reference for the whole province, are estimates. Mark the derived reference parameters/assumption
`estimated: true` and name the division in the tooltip. A sourced rate is not a claim that every Winnipeg
property or every Manitoba custom bill has the same school tax. Source amounts themselves are published.
The existing total-bill rate 0.0138 is a separate approximate proxy. For the default estimate, use the
independently sourced school component capped by its gross total, not that entire total as the school base.
Do not silently recalibrate the total bill while adding the school component; any separate rate correction
must explain its additional golden effects. A total-bill override requires an actual school-tax input.

Independent full-year examples with no special fees and income at most $40,000:

| Full assessed value | 2025 school tax / HATC / senior rebate | 2026 school tax / HATC / senior rebate |
|---|---|---|
| $200,000 | $1,316.70 / $1,316.70 / $0 | $1,439.46 / $1,439.46 / $0 |
| $500,000 | $3,291.75 / $1,500 / $235 | $3,598.65 / $1,600 / $235 |

For a custom **2026** gross total $5,000 with gross eligible school tax $1,700, HATC is $1,600 and
senior rebate $100. If the entered total is instead $3,400 after the $1,600 HATC advance, and net school
tax is $100, restore gross total $5,000 and gross school $1,700; remaining HATC is zero and senior rebate
is still $100. Both give final burden $3,300. This rejects applying HATC twice to a net bill.

## Annual renter formula settled; final filing rounding remains open

The [archived 2025 statute](sources/gap-mb-statute-2025.txt), sections 5.6.1(3)–(5), explicitly gives:

```text
ordinary = min(eligibleRent, 575 × eligibleMonths / 12)
senior = min(eligibleRent, (903.57 − min(328.57, 0.008214 × familyIncome)) × eligibleMonths / 12)
```

The [enacted amendments](sources/mb-act-2025.txt), sections 21 and 52(7), replace these constants with
625, 982.14, 357.14 and 0.008929 from January 1, 2026. There is **no statutory instruction to round a
monthly intermediate or replace annual $575 with `12 × $47.91`**. For the app's continuous annual
entitlement model, use these annual formulas and preserve the ordinary $575/$625 baselines.

For 12 eligible months and sufficient rent, independent unrounded results are:

| Family income | 2025 senior credit | 2026 senior credit |
|---|---:|---:|
| $0 | 903.57 | 982.14 |
| $35,000 | 616.08 | 669.625 |
| $40,000 | 575.01 | 625.00 |
| $40,002 | 575.00 | 625.00 |

These are formula results, **not a claim of final CRA line rounding**. Displaying $669.63 rounds the final
unrounded result for the UI; it is not authority for a specific sequence of paper-return intermediate steps.
The 2025 MB479 prints $47.91 as the ordinary monthly floor. A direct reading gives $574.92 for twelve
months, contradicting the statute's $575 annual formula; rounding $575/12 to $47.92 first would instead
give $575.04. Do not substitute either outcome or delete/weaken a baseline without authoritative resolution.
The rounded coefficient also leaves the genuine $575.01 result at $40,000 in 2025; do not invent an
income-$40,000 cliff from summary wording.

The [CRA MB479 publication index](sources/gap-mb-forms-index.txt) lists 2025 as the latest edition checked.
The expected 2026 PDF URL returned **HTTP 404**. The
[2025 electronic-records manual](sources/gap-mb-efile-2025.txt) documents school amount/advance/month
fields, but supplies no calculation rule settling this monthly-versus-annual discrepancy. The
[public EFILE error chapter](https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/rc4018/chapter-2.html/1000?wbdisable=true)
likewise identifies month limits/field validation, not a binding cent-rounding sequence. Therefore final
filing-form/administrative rounding remains a narrow evidence gap; annual legal amounts and input bases
are no longer open. Reconcile the final 2026 form when available before claiming return-level precision.

## Bounded search record

- Searched CRA for `MB479 rounding`, `MB479 47.92`, `renters affordability EFILE`, and Manitoba's
  site for `renters rounding`. No official correction/rounding bulletin was located.
- Requested the expected `5007-tc-26e.pdf`: HTTP 404. Inspected the official form index and existing
  2025 MB479; do not interpret a filing season called 2026 as a final **tax-year 2026** form.
- Read archived statute sections 5.3–5.6.1 and enacted 2026 changes. Those settle annual/month-fraction
  formulas, eligible school base and the HATC advance; they do not settle CRA's final line-rounding practice.
- Followed Winnipeg's official Tax Rates/Statistics links to actual `CombinedMillRates.pdf`,
  `HistoricalCombinedMillRates.pdf` and `ShortFormTaxationSection2025/2026.pdf`. Initially guessed
  year-prefixed combined-table URLs returned HTTP 403; the linked files downloaded successfully.
  Navigation-only HTML responses were discarded, not cached as school-rate evidence.

No further open user scope choice remains here. The input contract above is an implementation proposal
within the decided gross/net policy; a missing school amount must remain visibly incomplete.

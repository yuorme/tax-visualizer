# Manitoba and Quebec supplement inventory, 2025–2026

Issue #21, phase 1 research; checked **2026-11-05**. Class Normal; Codex Sol, `gpt-6.1-sol`, `xhigh`.
This note changes no production data, formulas or golden expectations. All amounts are CAD.

**Retain Manitoba 55 PLUS, its junior component, Manitoba's refundable personal-credit senior terms, and
Quebec's refundable Senior Assistance Tax Credit.** Their effects exceed the 0.1 percentage-point test.
Property/rent relief belongs in #22; Quebec's career-extension credit needs an adjacent income-tax follow-up.
The Manitoba junior final-band conflict below must be resolved before claiming complete implementation.

## Evidence and annualization

The [source directory](sources/) contains `mbqc-*` official text extracts with original URL, retrieval date,
title and original-file SHA-256. The cache uses the repository's `extract`/`formatExtract` helpers with a custom
destination; it does not modify annual source indexes. Revenu Quebec HTML returned HTTP 403 to direct fetch;
dated PDF forms and Finance Quebec publications downloaded successfully.

The [2025 Quebec assistance form][qc25] and **[2026 assistance form][qc26]** are both available. The latter is
version 2026-10, PDF metadata modified 2026-09-10; its 2026 formula is verified, not a provisional carry-forward.
The [November 2025 parameter bulletin][qcparam] independently publishes the 2025/2026 thresholds and rates.

Manitoba's junior regulation has applied since July 5, 2024. The senior regulation's
[pre-December-12-2025 version][mbold] and [current version][mbsenior] establish the dated rules.
The December 2025 changes rename the assistance Act and correct the French translation of rounding upward;
the English benefit amounts and offset formula are unchanged. No blanket CPI indexing is justified.
The [official bilingual senior PDF][mbseniorpdf] and [junior PDF][mbjuniorpdf] were also cached and checked:
the senior table endpoints and junior eligibility/table conflict appear in both HTML and official PDFs.

Sizing follows [#16](../16-seniors-sizing.md): `points = 100 × benefit / fixed household income D`.
These are isolated program effects, not complete tax/benefit forecasts or golden expectations. A quarterly
maximum multiplied by four is a full-benefit-year run rate; payment start dates can reduce actual receipts.
The low-income OAS denominator, $8,881.08, is #16's October–December 2025 OAS run rate, not calendar-year OAS.

## Manitoba: 55 PLUS senior component

The [program overview][mboverview] covers Manitoba residents aged 55+ registered with Manitoba Health.
The senior component uses federal OAS-program status; OAS recipients are assessed automatically using GIS,
Allowance or Allowance for the Survivor information. Do not gate every category solely on age 65.
Income assistance/general assistance and federal/band social assistance disqualify recipients, except assistance
consisting only of health benefits. [M.R. 65/90][mbsenior] contains the exact five quarterly schedules.

The [Social Services Administration Act, section 18][mbact], defines the relevant income as declared in the
federal supplement application and accepted for federal OAS Act Part II purposes. The regulation calls it
**total income declared**. Use the applicable federally accepted GIS/Allowance income measure and marital
category, including its permitted exclusions; neither T1 taxable income nor gross OAS+GIS cash is a substitute.
The federal income-test work in #19 is a prerequisite; a positive GIS amount alone does not determine the row.

The benefit year is **April 1–March 31**; quarters start April, July, October and January, with payments late
in those months. The overview says prior-tax-year income determines eligibility. Calendar 2025 therefore spans
January's 2024–2025 benefit year and April/July/October's 2025–2026 year; calendar 2026 similarly spans two years.
Do not silently relabel a four-quarter steady-income proxy as observed historical cash receipts.

| Regulation | Category | Quarterly maximum and income band | Last published band and quarterly payment |
|---|---|---|---|
| 2(1) | Single, widowed/divorced or separated surviving partner | $161.80 at $0–$23.99 | $816–$839.99: $13.90 |
| 2(2) | Married/common-law, both pensioners | $173.90 **each** at combined $0–$47.99 | $1,488–$1,535.99: $39.10 each |
| 2(3) | Pensioner with spouse who is neither pensioner nor Allowance recipient | $161.80 to pensioner at adjusted $0–$47.99 | Adjusted $528–$575.99: $18.30 |
| 2(4) | Pensioner and spouse aged 60–64 receiving Allowance | $173.90 **each** at combined $0–$47.99 | $3,600–$3,647.99: $10.70 each |
| 2(5) | Surviving spouse aged 60–64 receiving Allowance for the Survivor | $173.90 at $0–$47.99 | $1,776–$1,823.99: $13.00 |

Every intermediate row is preserved in the [cached regulation][mbsenior]; the tables are discrete and must not
be replaced with a guessed percentage taper. In 2(3), subtract from combined declared income an amount equal to
the **basic monthly OAS pension rounded upward to a multiple of $4, multiplied by 12, plus $47.99**.
Its OAS reference may change quarterly even though the Manitoba payment tables do not.
The source does not expressly show how a negative adjusted income maps into the first band; treating it as
zero is a modelling inference requiring explicit confirmation. Nor does it explicitly print a zero row after
each table's last positive band. In particular, 2(2) ends earlier than 2(5): do not copy the survivor tail into
the two-pensioner table or extrapolate further rows. These are implementation questions, not immaterial cases.

For a single full-OAS/GIS recipient with zero declared private income, four payments give
`4 × $161.80 = $647.20`, or **7.287 points** at D=$8,881.08. A nonmaximum example with $500 accepted annual
declared income uses the $480–$503.99 row: `4 × $74.80 = $299.20`, or **3.189 points** at D=$9,381.08.
For two eligible pensioners or an eligible pensioner/Allowance couple at zero tested income,
`2 × 4 × $173.90 = $1,391.20` per household. All are material; a $35,000 private-pension household receiving
zero does not justify dropping the program. [Exact amounts: M.R. 65/90][mbsenior].

## Manitoba: 55 PLUS junior component

[M.R. 64/90][mbjunior] applies to Manitoba Health-registered residents aged **55+ who are not eligible for
federal OAS Act benefits**. It is relevant to mixed-age households and people aged 55–64, not only age 65+.
It excludes incarceration and the same assistance categories described above. Application is required annually;
payments start in the quarter in which the completed application is received. OAS eligibility ends junior
payments beginning in the following quarter. The April–March year and previous-tax-year income rule apply.

The junior income base is bespoke. Section 1 includes gross employment, business/farming, private pensions,
CPP or equivalent, taxable annuities/RRSP receipts, interest/dividends, **total capital gains/losses**, rental
and specified other receipts. It excludes listed child/social benefits, relatives' gifts, tax rebates and
shelter assistance. OAS Act benefits received by a family member are included at the **April 1, 2011** level,
excluding subsequent increases (section 1.1). Section 3 then deducts CPP/EI premiums, employment expenses of
20% of employment earnings capped at $500, allowed business/farm/rental expenses excluding CCA and the livestock
adjustment, permitted carrying charges, and alimony/maintenance paid. A federal-net-income shortcut is wrong.

| Household | Maximum annual amount | Full-amount net-family-income range | Last schedule band |
|---|---:|---|---|
| Single | $647.20 | $0–$8,930.40 | $9,722.41–$9,746.40 pays $55.60 |
| Married/common-law | $695.60 **per eligible adult** | $0–$14,479.20 combined | $16,207.21–$16,255.20 pays $52 each |

**Unresolved source conflict:** section 2(1) limits eligibility to **$9,722.40 single / $16,207.20 couple**,
while section 4's last row and the [public program page][mboverview] extend to **$9,746.40 / $16,255.20**.
Preserve both statements and seek administrative clarification; do not label either terminal band verified.
All lower rows and maxima are directly published in the [regulation][mbjunior].

Sizing examples assume no OAS eligibility and that the stated amount is net family income under these rules.
A single age-60 recipient at $8,000 receives `$647.20`, **8.090 points** at D=$8,000.
At $9,000, the $8,978.41–$9,002.40 row gives **$595.20**, or **6.613 points**.
A couple with both adults eligible and $15,000 combined income uses the $14,959.21–$15,007.20 row:
`2 × $504.40 = $1,008.80`, **6.725 points** at D=$15,000. Retain the whole component; this is not a tiny
exception to the senior component. [Annual tables][mbjunior].

## Manitoba: refundable personal tax credit, including senior additions

This is a **retained #21 equivalent requiring explicit implementation allocation**, not the non-refundable
family tax benefit already modelled. The [2025 MB479, page 1][mb479] and [Income Tax Act section 5.7][mbtax]
provide a $195 basic refundable credit, qualifying spouse/dependant/child/disability terms, and **$113 senior
terms**, less **1% of family income**, floored at zero. An ordinary single age-65+ case is
`max(0, $195 + $113 − 0.01 × familyIncome)`; its refund ends at $30,800, versus $19,500 without the age term.
The spouse age addition has claimant/transfer conditions: age alone does not authorize two independent claims.

Family income is MB479 lines 1–6: both adults' line 23600 income, add UCCB/RDSP repayments, subtract UCCB/RDSP
income, floor each adjusted amount at zero, then add. The form has a medical-separate-residence exception.
GIS/Allowance enter line 23600; do not use the senior 55 PLUS private-income test here. Manitoba residence,
dependant-claim exclusions, incarceration and EIA/MSPD adjustments also need the form/statute's own rules.
The [current statute][mbtax] confirms the $195/$113/1% terms for 2026; final 2026 MB479 filing instructions
were not collected, so detailed 2026 form ordering remains a reconciliation item.

At family income $15,000, a qualifying single senior receives `195 + 113 − 150 = $158`; the otherwise
identical ordinary single receives `$45`. The age increment is **$113 / $15,000 × 100 = 0.753 points**.
At family income $25,000, the senior refund is **$58**, ordinary refund zero: **0.232 points** at D=$25,000.
The whole program is absent from the inspected data; adding a flat $113 would overpay people beyond the shared
taper and omit the ordinary base. Implement the complete necessary base/claimant formula, with separate
ordinary and senior coverage, or track a prerequisite. Do not duplicate the existing MB428-A senior benefit.

## Quebec: refundable Senior Assistance Tax Credit

[TP-1029.SA-V for 2025][qc25] and [2026][qc26] verify an annual refundable credit, calculated automatically
from filed returns, with optional allocation between eligible spouses. It is not a monthly GIS supplement and
does not require GIS receipt. The official [seniors program catalog][qccatalog] identifies this support,
the existing age/retirement-income credits, housing relief and home-support measures; this inventory found no
separate general Quebec monthly GIS-linked provincial supplement in those official sources.

For the ordinary full-year resident case, at least one eligible adult is **70+ at December 31**. Eligible
individual status requires Quebec residence and recognized citizenship/immigration status of self or spouse;
temporary residents need 18 months in Canada. The forms cover death and nonresident-spouse exceptions and
exclude the specified year-end imprisonment case. Both spouses must file returns. A qualifying younger spouse
can share the household credit but does not create another $2,000 age entitlement.

| Parameter | 2025 | 2026 |
|---|---:|---:|
| Maximum, single eligible senior | $2,000 | $2,000 |
| Couple maximum, one eligible adult aged 70+ | $2,000 | $2,000 |
| Couple maximum, both eligible adults aged 70+ | $4,000 | $4,000 |
| Single income threshold | $27,835 | $28,405 |
| Spouse-present income threshold | $45,270 | $46,200 |
| Reduction rate | 5.40% | 5.47% |

```text
familyIncome = own Quebec line 275 + spouse Quebec line 275, if applicable
maximum = 2,000 × number of eligible household adults aged at least 70
credit = max(0, maximum − reductionRate × max(0, familyIncome − applicableThreshold))
claimA + claimB = household credit, never a second copy of the maximum
```

This is the current tax year's **Quebec net income**, including applicable OAS/GIS/Allowance receipts and
Quebec deductions. It is not taxable income or the federal net-income measure. The 2025 credit normally appears
after filing in 2026, and the 2026 credit after filing in 2027. Choose tax-year entitlement versus cash-year
accounting explicitly. The assistance itself must not become a second taxable pension receipt.
[Sources: 2025 form][qc25], [2026 form][qc26], [Finance explanation][qcfinance].

For continuous analytical calculations, the single credit reaches zero at approximately **$64,872.04 in
2025 / $64,968.07 in 2026**. One-age-eligible-adult couple zeros are **$82,307.04 / $82,763.07**; two eligible
senior couple zeros **$119,344.07 / $119,326.14**. These are derived as `threshold + maximum / rate`, not
extra published thresholds; the forms' whole-dollar cutoff displays reflect rounding.

Typical nonmaximum case: single age 72, line 275 income $35,000, no deductions affecting that stated income.
2025 gives `2,000 − 0.054 × (35,000 − 27,835) = $1,613.09`, **4.609 points** at D=$35,000.
2026 gives `2,000 − 0.0547 × (35,000 − 28,405) = $1,639.2535`, **4.684 points** before return rounding.
A two-senior couple at $60,000 receives `$3,204.58 / $3,245.14`, or **5.341 / 5.409 points**.
These independent calculations use the published form parameters, not engine snapshots. Retain the credit.

### Existing-credit reconciliation

The inspected 2025/2026 Quebec YAML already contains solidarity, work premium and the non-refundable
`quebec-age-living-alone-retirement-pool`. That pool combines the age-65+ base, eligible retirement amount and
living-alone amount, reduces the combined base once at 18.75% above **$42,090 / $42,955**, then applies 14%.
Its age bases are **$3,906 / $3,986**, retirement caps **$3,470 / $3,541**, and living-alone bases
**$2,128 / $2,172**. The legacy standalone living-alone parameters also remain in the data, but the senior
path replaces that calculation with the pool. [Verified credit specification](../138-senior-credit-rules.md).

Senior assistance has its **own refundable household formula** and starts at age 70. Do not put its $2,000 into
the non-refundable pool, multiply it by 14%, count it within solidarity, or re-add age/retirement/living-alone
credits while implementing it. Reuse the correctly computed Quebec line 275 income after worker and relevant
public-benefit deductions. Pension-income splitting must recompute each program's correct income measure.

## Material adjacent programs and scope allocation

These programs are sized before being routed elsewhere. Routing to #22 or an income-tax/care follow-up is not
an assertion that their effect is below 0.1 points. Unless stated otherwise, examples assume full-year eligibility.

| Program and source | 2025/2026 size and eligibility | Decision |
|---|---|---|
| MB seniors' renter top-up: [MB479][mb479], [2026 Act][mbtax] | Age 65+ self/spouse; full-year extra `max(0, 328.57 − 0.008214 × familyIncome)` in 2025 and `max(0, 357.14 − 0.008929 × familyIncome)` in 2026, subject to rent/month limits. At $25,000: $123.22 / $133.915, or 0.493 / 0.536 points. Zero-income maxima $328.57 / $357.14. | #22; existing ordinary renter credit is not the senior top-up. |
| MB Seniors' School Tax Rebate: [MB479][mb479], [2026 Act][mbtax] | Age 65+ self/spouse; cap $235, restricted to remaining school tax after ordinary relief, less 1% of family income over $40,000; eligibility proration applies. At $35,000 and sufficient remaining school tax: $235, 0.671 points. At $50,000: $135, 0.270 points. Both years material. | #22; reconcile ordinary homeowner credit already in engine. |
| QC home-support services credit: [Finance rules][qchome] | Age 70+; annual qualifying services; 39% / 40%; non-dependent expense cap $19,500, dependent $25,500. Maxima $7,605/$7,800 or $9,945/$10,200 before taper. At $3,000 eligible services and income $35,000: $1,170/$1,200, 3.343/3.429 points. | #22/home-support follow-up; material consumption-dependent credit. |
| QC home-support deemed ordinary-apartment rent: [Finance rules][qchome] | Eligible service cost is 5% of monthly rent subject to $600 minimum/$1,200 maximum rent reference. At $1,000 monthly rent, a qualifying low-income senior has `12 × 1,000 × 5% × 39%/40%` = $234/$240: 0.669/0.686 points at $35,000. | #22; cannot dismiss all home support because no separate care spending was entered. |
| QC municipal-tax-increase grant: [Finance rules][qcmunicipal], [2026 grant form][qcmunicipalform] | Age 65+ in preceding year, principal single-dwelling residence owned 15 consecutive years, income cap $62,900 for 2025 grant / $64,200 for 2026 grant. Prior-year line 275 family income; current-roll increment capped at $500 **plus prior-roll carried grant**. A $127 eligible increment gives 0.363 points at $35,000; $500 gives 1.429 points. | #22; not a universal $500 annual cap on the total. |
| QC Shelter Allowance: [program decree][qcshelter], [official catalog][qccatalog] | Childless single/couple eligible from age 50; also families. Housing cost at least 30% of family income, financial-asset test, October–September year. Published $100/$150/$170 monthly tiers yield $1,200/$1,800/$2,040 run rates. $1,200 at income $20,000 is 6 points. | #22 housing-benefit follow-up; material, with prior-income and housing inputs. |
| QC career-extension credit: [2025 form][qccareer25], [2026 form][qccareer26] | Age 65+ year-end. 14% of eligible earned income above $7,500/$7,655, capped excess $12,500/$12,755, then 7% reduction on own net income above $56,500/$57,660; tax-capacity limit. At $50,000 work income: $1,750/$1,785.70, 3.500/3.571 points with sufficient tax. | Adjacent #17 income-tax follow-up; non-refundable, distinct from #21 cash supplements. |
| QC independent-living equipment credit: [Finance rules][qcequipment], [2025 guide][qcguide] | Age 70+, eligible equipment paid in year by self/spouse, 20% of cost over $250, no income taper. $2,000 qualifying equipment gives $350, 1 point at $35,000. | Care/expense follow-up; material but spending-specific, not a flat income supplement. |
| QC rehabilitation transition stay: [Finance rules][qcrehab], [2025 guide][qcguide] | Age 70+, qualifying recovery stay after accident/surgery, credit 20% of eligible first 60 days of each stay; no general income taper. $3,000 eligible cost gives $600, 1.714 points at $35,000. | Care/expense follow-up; avoid double claims with other expense credits. |
| QC caregiver age-70+ relative component: [Finance rules][qccaregiver] | Qualifying co-resident relative other than spouse, care period 365 consecutive days including at least 183 in year; $1,494/$1,525 universal base, not income tapered. At household income $50,000: 2.988/3.050 points. Disability-care component has additional rules. | Separate caregiver/multigenerational follow-up; not an ordinary single/spouse senior supplement. |
| QC former senior-activities credit: [Finance record][qcactivities] | Abolished from 2023. Annual effect is **zero in both 2025 and 2026**; former 20%/$40 rules must not be revived from stale secondary pages. | Exclude because inactive, not because an active benefit is assumed immaterial. |

For home support, family income is the senior's and spouse's Quebec net income. The non-dependent reduction
uses 3% between **$71,010–$115,035 in 2025 / $72,465–$117,395 in 2026**, then 7% above the second threshold.
For dependent seniors, only the enhancement over 35% is reduced, at 3% above the first threshold, preserving
the 35% base. Birthdays, dependency and dwelling-type rules affect eligible expenses. [Full rules][qchome].

The municipal grant for **2026 bills** uses **2025 income** but is claimed on the **2025 return**; its $64,200
limit must not be mislabelled the grant for 2025 bills, which uses $62,900. [Dated 2026 grant form][qcmunicipalform].
The ordinary Manitoba homeowner maximum is $1,500 in 2025 and **$1,600 in 2026**, already represented in data;
the $1,700 announcement applies to 2027. [MB479][mb479], [March 2026 bulletin][mbbudget].

Shelter Allowance uses prior-reference-year Quebec line 275 family income with its specified child-support
adjustments. The [2024 decree][qcshelter] fixes the $100/$150/$170 tiers and indexes income thresholds from
October 2025; it does not justify computing new annual thresholds by guesswork. Its October 2024 single
reduction threshold is $22,400, couple $31,500; the corresponding eligibility ceilings depend on housing-cost
tier. **The complete October 2025 and October 2026 published threshold tables remain to be cached and
reconciled for #22.** No missing year-specific threshold is treated as evidence of immateriality.

The [official catalog][qccatalog] also lists RAMQ domestic-help assistance, which reduces qualifying service
prices through recognized suppliers. This is a consumption-dependent service subsidy, not a general monthly
GIS supplement. The [live RAMQ program page](https://www.ramq.gouv.qc.ca/en/citizens/aid-programs/domestic-help)
read on November 5, 2026 gives $4/hour fixed assistance plus variable assistance of $2.76–$22.08/hour.
Eight qualifying hours per month at just the fixed amount gives `$4 × 8 × 12 = $384`, **1.097 points** at
D=$35,000. This is a current-page illustration, **not verified 2025 or full-calendar-2026 receipts**.
Its dated annual hourly schedules and interaction with the home-support credit remain unverified; direct
fetch returned HTTP 403, although the web research tool read the page. Retain it for care-program review;
do not exclude it as immaterial. This inventory does not claim a complete healthcare/service-subsidy model.

[mbsenior]: sources/mbqc-mb-senior-regulation.txt
[mbseniorpdf]: sources/mbqc-mb-senior-official-pdf.txt
[mbjuniorpdf]: sources/mbqc-mb-junior-official-pdf.txt
[mbold]: sources/mbqc-mb-senior-pre-dec2025.txt
[mbjunior]: sources/mbqc-mb-junior-regulation.txt
[mboverview]: sources/mbqc-mb-overview.txt
[mbact]: sources/mbqc-mb-act.txt
[mb479]: sources/mbqc-mb-479-2025.txt
[mbtax]: sources/mbqc-mb-tax-act-2026.txt
[mbbudget]: sources/mbqc-mb-budget-2026.txt
[qc25]: sources/mbqc-qc-assistance-form-2025.txt
[qc26]: sources/mbqc-qc-assistance-form-2026.txt
[qcparam]: sources/mbqc-qc-parameters-2026.txt
[qcfinance]: sources/mbqc-qc-assistance-2025-2026-finance.txt
[qccatalog]: sources/mbqc-qc-seniors-catalog.txt
[qchome]: sources/mbqc-qc-home-support-2025-2026-finance.txt
[qcmunicipal]: sources/mbqc-qc-municipal-finance.txt
[qcmunicipalform]: sources/mbqc-qc-municipal-form-2026.txt
[qcshelter]: sources/mbqc-qc-shelter-rule-2024-onward.txt
[qccareer25]: sources/mbqc-qc-career-form-2025.txt
[qccareer26]: sources/mbqc-qc-career-form-2026.txt
[qcequipment]: sources/mbqc-qc-equipment-2025-2026.txt
[qcrehab]: sources/mbqc-qc-rehabilitation-2025-2026.txt
[qcguide]: sources/mbqc-qc-guide-2025-adjacent.txt
[qccaregiver]: sources/mbqc-qc-caregiver-2025-2026.txt
[qcactivities]: sources/mbqc-qc-activities-abolished.txt

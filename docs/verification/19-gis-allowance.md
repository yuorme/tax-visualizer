# Issue #19: GIS and the spouse's Allowance engine

Coverage: **2025 and 2026, all thirteen provinces and territories**. This implements the engine half of #19
and its sizing refinements, following [#18](18-oas-cpp.md). The page half (controls, tooltips, URL codec and
saved-state migration) is a later branch. Pension splitting (#20) and provincial senior supplements (#21)
are excluded. Earlier tax years are not implemented. Existing golden files are unchanged.

## Input and payment contract

- `Person.gis?: boolean` opts into GIS; `Person.allowance?: boolean` opts into the spouse's Allowance.
  Omission and explicit false pay nothing. A true flag requires whole year-end `age` and `birthMonth` 1–12.
  Unsupported years reject even explicit false. Age alone never enables these benefits.
- GIS pays only in months with positive modelled OAS. `oas: false` or omitted means zero GIS, even when
  `gis: true`. OAS must also be enabled for a spouse to select the two-pensioner GIS category.
- The household's existing `spouse` flag represents marriage/common-law status. Non-spouses use individual
  single rates; this includes single, separated, divorced and widowed pensioners. A spouse receiving full
  OAS selects the couple rate even when their own GIS opt-in is off or their GIS is nil. A spouse without
  OAS selects the non-pensioner rate unless eligible and opted into the Allowance.
- Allowance requires a GIS recipient spouse, starts the month after turning 60, and continues through the
  65th birthday month. When OAS begins the following month, the older adult's category changes to spouse-OAS.
  If the younger adult's OAS remains off, the older adult instead returns to spouse-neither. Month precision
  follows #18; no day-of-month exception, delayed application or retrospective entitlement is inferred.
- Opt-in assumes Canadian residence, legal eligibility, timely application and full qualifying entitlement.
  Partial OAS/residency, sponsorship bars, residence abroad, incarceration, involuntary separation, changes
  in marital status during the year and Allowance for the Survivor require additional inputs and are excluded.
- Benefits are computed regardless of `useBpa` or `useCredits`. Those switches do not withdraw an application.
  The dividend-credit income adjustment uses ordinary personal credits even when the tax display disables them.

## Source cache and periods

Official publications are cached with original-byte SHA-256 hashes in the
[2025 index](2025/sources/INDEX.md) and [2026 index](2026/sources/INDEX.md).

| Cached publication | Evidence |
| --- | --- |
| `gis-table-q1.txt` through `gis-table-q4.txt`, each year | ESDC SG3-3 Tables 1–4: income bands, maximums, partial payments, cutoffs and protected GIS. |
| [ESDC calculation guide](2025/sources/gis-calculations.txt), PDF pp. 166–170 | Separate base/top-up tapers, pension equivalents and reduction/cutoff rounding. |
| [OAS Act s.2](2025/sources/gis-income-act.txt) | Income definition, exclusions, payroll deductions, earnings exemption and excess dividend-credit adjustment. |
| [Act s.10](2025/sources/gis-act-10.txt), [s.12](2025/sources/gis-rates-act.txt) | Base calendar year, GIS categories and monthly income steps. |
| [Act s.12.1](2025/sources/gis-act-12.1.txt), [s.22.1](2025/sources/gis-act-22.1.txt) | GIS and Allowance top-ups and their separate income tests. |
| [Act s.19](2025/sources/gis-act-19.txt), [s.23](2025/sources/gis-act-23.txt) | Allowance eligibility and commencement. |
| [Act s.22](2025/sources/gis-act-22.txt) | Allowance pension/GIS portions and protection under subsections (5)–(6). |
| [Service Canada timing](2025/sources/gis-allowance-timing.txt) | Month after 60, end after 65 and July reassessment. |
| [ISP3026](2025/sources/gis-income-statement.txt) | Income blocks and exact T1 lines; payroll deductions precede the earnings exemption. |
| [ITA s.126(7)](2025/sources/gis-dividend-tax-definition.txt) | Federal tax otherwise payable before DTC, FTC and Quebec abatement. |
| [CRA line 14600](2025/sources/gis-net-income.txt), [line 25000](2025/sources/gis-taxable-deduction.txt) | Net-income inclusion and offsetting taxable-income deduction, including repayments. |
| [Quebec guide pp. 27, 42](2025/sources/gis-quebec-income-deduction.txt) | Lines 148 and 295: equivalent inclusion/deduction and federal repayment. |

The Publications site initially returned its archive notice instead of PDF bytes. Downloads succeeded with
the archive notice as HTTP Referer, through `npm run fetch-source` with a temporary fetch-header preload.
No repository tooling changed. The Quebec HTML endpoint returned 403; its official PDF supplied the evidence.
Cached Tables 1–4 are complete; pages after 85, concerning the out-of-scope survivor program, are omitted.

Real payments use a July–June payment period and the calendar year before that period begins. Thus January–June
2025 uses 2023 income, July–December 2025 uses 2024; 2026 uses 2024 and 2025 respectively. This page has one
income year: **the entered selected-year income and payroll stand in for both historical years**, held constant
across quarters. This is not a prediction of the first year's actual Service Canada award after retirement.
The same proxy treats current ordinary childcare deductions and pre-supplement federal tax as historical inputs.
It does not feed this year's new GIS/Allowance back into that historical calculation. Current T778 selection
then includes actual supplements, so its claimant can differ from the proxy year's claimant.

## Quarterly amounts and arithmetic

Each figure below is monthly. The maximum includes the top-up; the engine subtracts the top-up to obtain
the base and reduces each component separately. OAS equivalents use #18's **65–74** rate, even at age 75+.

| Quarter | GIS single maximum | Single top-up | GIS couple maximum | Couple top-up | Allowance maximum |
| --- | ---: | ---: | ---: | ---: | ---: |
| 2025 Q1 | 1,086.88 | 168.36 | 654.23 | 47.70 | 1,381.90 |
| 2025 Q2 | 1,086.88 | 168.36 | 654.23 | 47.70 | 1,381.90 |
| 2025 Q3 | 1,097.75 | 170.04 | 660.78 | 48.18 | 1,395.73 |
| 2025 Q4 | 1,105.43 | 171.23 | 665.41 | 48.52 | 1,405.50 |
| 2026 Q1 | 1,108.74 | 171.74 | 667.41 | 48.67 | 1,409.72 |
| 2026 Q2 | 1,109.85 | 171.91 | 668.08 | 48.72 | 1,411.13 |
| 2026 Q3 | 1,123.17 | 173.97 | 676.09 | 49.30 | 1,428.06 |
| 2026 Q4 | 1,138.90 | 176.41 | 685.56 | 49.99 | 1,448.06 |

Top-ups are recovered exactly from published rows after top-up exhaustion. Example: 2025 Q1 Table 1 at income
10,112 pays 497.52. Adding the 421 base reduction steps gives base 918.52; `1,086.88 − 918.52 = 168.36`.
2026 Q1 at 10,256 pays 510.00; `510 + floor(10,256/24) = 937`, hence top-up 171.74. Table 2 at 8,704 pays
437.74; adding 181 steps gives base 618.74 and top-up `667.41 − 618.74 = 48.67`. Each quarter is checked
against its own table. The data's `estimated: true` marks these derived components, **not unpublished rates**.
The 2026 filing treatment provisionally continues verified 2025 forms, as #18 does.

With `I` the tested annual income, `S/C` the single/couple base and `Ts/Tc` their top-ups:

- Single: `max(0, S − floor(I/24)) + max(0, Ts − floor(max(0,I−2000)/48))`.
- Spouse-OAS: `max(0, C − floor(I/48)) + max(0, Tc − floor(max(0,I−4000)/96))` per opted-in pensioner.
- Spouse-neither: offset `N = 48 × ceil(OAS/4)`; base reduction `floor(max(0,I−N)/48)` and single top-up
  reduced by `floor(max(0,I−4000)/96)`. This is neither the single-person nor two-pensioner income test.
- Allowance: offset `A = 48 × ceil(OAS/3)`. Its pension portion is
  `max(0, OAS − 3 × floor(I/48))`; its GIS portion is `max(0,C − floor(max(0,I−A)/48))`, plus the couple
  top-up. The older spouse initially receives the same GIS portion and top-up without the pension portion.
- Protect the combined payment: increase the older spouse's GIS by
  `max(0, spouseNeitherGIS − olderGIS − Allowance)`. When Allowance becomes zero, GIS continues under
  Table 3 until its higher cutoff. The Table 5 quarterly summary's Allowance cutoff is not a GIS cutoff.

Published examples beyond the maximum:

- 2025 Q1, single income 24–47.99: GIS 1,085.88. At 2,048, the first top-up reduction joins the base taper.
  At 10,111.99, GIS is 497.88; at 10,112 it is 497.52. Final base exhaustion is 22,056.
- 2025 Q1 Allowance pension portion ends at `48 × ceil(727.67/3) = 11,664`; its GIS portion starts
  falling at 11,712. At income 40,752–40,799.99, the published table pays **250.99 GIS and 0.53 Allowance**:
  unprotected GIS is 0.53, Table 3 entitlement is 251.52, so protection is `251.52 − 0.53 − 0.53 = 250.46`.
  At 40,800 Allowance is zero but the older adult still receives 250.52 GIS; GIS ends only at 52,848.
- 2026 Q1's final Allowance band 41,568–41,615.99 pays **256.26 GIS and 0.74 Allowance**. The next band
  pays no Allowance and 256.00 GIS. The reference suites assert these transitions in every quarter.
- Full-year 2025 GIS is `3 × (1086.88 + 1086.88 + 1097.75 + 1105.43) = 13,130.82` for a single adult,
  and 7,903.95 per couple-rate adult. Allowance is 16,695.09. In 2026 these are 13,441.98, 8,091.42 and
  17,090.91. A June 60th birthday pays only the last six Allowance months; prior months use spouse-neither GIS.

## Income definition and integration

For each adult, subtract the full employee and self-employed CPP/QPP contributions and employee EI from
employment plus business profit, then apply one combined earnings exemption: first 5,000 plus half the next
10,000. Both spouses get their own exemption. Enhanced contributions and the employer base share are not
deducted again. Self-employed QPIP's deductible fraction is a separate deduction, not an earnings exemption.
Employee QPIP remains a credit and is not deducted, matching ISP3026. Business losses and self-employed EI
are unsupported by the existing income inputs.

Add ordinary other income, foreign dividends, grossed-up Canadian dividends, the taxable share of positive
gains, CPP/QPP retirement benefits and all four supported private retirement receipt types. Deduct the supported
ordinary, RRSP, FHSA and proxy childcare claims. OAS, GIS and Allowance are excluded, as is OAS repayment.
Net capital losses do not offset other income. Ordinary deductions may produce negative individual income;
combine spouses before flooring the tested amount at zero.

OAS Act s.2(d) additionally deducts three times the excess of the federal DTC over federal tax before that
credit, FTC and Quebec abatement. The proxy household calculation obtains that tax with ordinary personal
credits enabled and new supplements absent. This implements zero, partially used and fully used DTC paths.
For 1,000 eligible and 1,000 non-eligible dividends with no federal tax capacity, the reduction is
`3 × (1380 × .150198 + 1150 × .090301) = 933.35637`; GIS-test income is 1,596.64363, not 2,530 or 2,000.

Other independently calculated examples:

- A 62-year-old with 20,000 business profit outside Quebec pays `16,500 × .119 = 1,963.50` CPP.
  Working income for GIS is 18,036.50; the 10,000 exemption leaves 8,036.50. Deducting only the taxable-income
  CPP deduction would overstate GIS-test income. Each adult's exemption is separately locked.
- Quebec at 20,000 profit: 2025 QPP is `16,500 × .128 = 2,112`; QPIP deduction is
  `20,000 × .00878 × .43736 = 76.800416`. Tested income is 7,811.199584. For 2026 it is 7,854.200424,
  using QPP .126 and QPIP `.00764 × .43717`. The exact published/provisional fractions from #14 matter;
  replacing them with a difference of premium rates changes the fourth decimal. Existing payroll data is unchanged.
- A single adult with 20,000 RRSP deductions has negative pre-benefit income. Add GIS before flooring net
  income: 2025 net is `8791.14 + 13130.82 − 20000 = 1921.96`, taxable zero. Flooring first is wrong.
- T778 claimant reversal: in 2025 a 76-year-old earns 10,000 and their 59-year-old spouse earns 20,000.
  Proxy GIS income is `(9836 − 7418 − 6666.666667) + (18690.25 − 10000) = 4441.583333`.
  Table 3 reduces the single top-up by four dollars monthly, giving annual GIS 13,082.82. Including this
  reverses the current childcare claimant: the spouse claims 8,000, family net is 44,588.11 and CCB is
  `7997 − .07 × (44588.11 − 37487) = 7499.9223`. In 2026 the spouse earns 21,000 to retain the same
  proxy ranking despite higher OAS; tested income is 5,368.283333 and GIS is 13,273.98. Family net is
  45,998.44 and CCB is `8157 − .07 × (45998.44 − 38237) = 7613.6992`.

GIS/Allowance enter T1 line 14600 and Quebec line 148. Federal net income and Quebec line 275 include them;
line 25000/295 removes them from taxable income. They affect the model's net-income-tested age/spouse credits,
low-income reductions, CWB, GST/CGEB, child benefits, provincial refundable credits, Quebec senior pool and
childcare credits. They do not create earnings, pension-credit eligibility, CPP/EI/QPIP, Ontario taxable-income
health premium or Quebec HSF income. Schedule F line 29 expressly excludes federal supplements. T2209 note 3
deducts line 25000 from its denominator; foreign-tax-credit income therefore excludes the supplements too.
T778 claimant comparisons and Ontario CARE include supplements but exclude the specified childcare/recovery
deductions. Quebec child benefits and credits use line 275, not taxable income after line 295.

The 15% social-benefits recovery includes supplements in income and the combined OAS/supplement cap. Any
recovery beyond OAS reduces the line 25000/295 deduction, so it never taxes repaid supplements a second time.
This rarely intersects ordinary current-income GIS cases, but large offsetting spousal deductions can create
the intersection. The `supplement-recovery-cap` goldens cover it without altering #18's original cases.

In totals, GIS/Allowance join `benefits`, reducing `netTotal` and `compute().total` once. Gross `cash` keeps
the existing convention of income before benefit transfers; `breakdown.left = cash − total` consequently adds
the transfers once. Do not also add them to `cashOf`. Counterfactuals and marginal calculations recalculate
income tests and categories. Net-income consumers receive the calculated amounts through household contexts;
standalone `netOf(person)` cannot infer spouse eligibility and does not calculate GIS.

## Independent golden coverage

`tests/golden/features/gis-published.json` contains direct ESDC table transcriptions at band starts and ends,
including nonmaximum payments, top-up exhaustion, Allowance's pension/GIS transitions and protected GIS.
`gis-allowance.json` contains annual household cases independently calculated by looking up each month's
published row and summing cents. Neither fixture was captured from the engine. Monetary input examples use
the calculations above; all existing golden files, assertions and tolerances remain unchanged.
There are 390 annual cases with 2,596 numeric expected cells, plus 2,796 published monthly cases with
5,592 payment cells. New tests exercise 402 cases, including the monthly table comparisons.

| New path | Annual golden case suffixes (both years unless noted) |
| --- | --- |
| All 13 jurisdictions; net totals, taxable exclusion and cash remaining | `single`, `couple-oas`, `allowance` |
| Four marital categories; income-band, top-up, base and Allowance cutoffs ±0.01 | `*-boundary-*` |
| GIS/Allowance commencement and age-65 transitions with/without OAS | `gis-start-65-*`, `allowance-start-60-*`, `allowance-to-oas-65-*`, `allowance-ends-oas-off-*` |
| Missing/disabled OAS; disabled GIS/Allowance; missing qualifying spouse | `oas-off`, `partner-oas-off`, `partner-gis-off`, `allowance-off`, `allowance-without-gis`, `allowance-alone` |
| CPP/QPP and typed pension receipts; gains/losses; ordinary and registered deductions | `cpp-and-private-income`, `gains-inclusion`, `capital-loss`, `deductions` |
| Individual losses offset spouse; zero floor after supplements | `spousal-loss-offset`, `deductions-before-net-floor` |
| Earnings exemptions at 5,000 and 15,000 ±0.01; two separate exemptions | `earnings-*`, `two-earnings-exemptions` |
| Business contributions; Quebec QPIP deduction | `business-spouse`, `business-qpip` |
| Full, partial and zero excess DTC adjustments | `dividend-credit-adjustment`, `partial-dividend-credit-adjustment`, `no-excess-dividend-credit` |
| Proxy childcare reduces GIS income; current supplements can reverse the T778 claimant | `manual-childcare-income`, `t778-supplements-reverse-claimant` |
| Higher OAS at 75 never increases the GIS base or pension equivalent | `age75-spouse-neither` |
| Partial OAS/supplement recovery, combined cap and remaining taxable-income deduction | `partial-recovery-*`, `supplement-recovery-cap` |

Targeted tests also verify validation, unsupported years, adult-order invariance, unrelated adults, opt-outs,
net-income versus taxable-income effects across every jurisdiction, income-tested benefits, unchanged payroll
and HSF, and refundable-credit-switch independence. Reference tests in each year's suite use published
quarterly maximums **and the final nonzero Allowance band with protected GIS**, not just maximum entitlements.

The first new-fixture run caught omitted existing 2025 heating costs in six jurisdictions; the expectations now
include the locked heating amounts (BC 48, AB 99.45, MB 49.77, ON 58.86, NB 3.20, NS 3.95). These cells combine
the new benefit subtraction with unchanged carbon costs. The QPIP fourth-decimal correction is described above.
No pre-existing baseline was changed to resolve either failure.

## Handoff and validation

The page branch should serialize both opt-ins independently, preserve omission/false, gate unsupported years,
reuse #18's age/month controls and avoid inferring eligibility from age. Explain the historical-income proxy,
full-residency assumption, OAS prerequisite, survivor exclusion and gross-cash/net-tax convention.

`breakdown.gisAllowance` exposes per-adult income components, twelve monthly categories/tested incomes,
GIS/Allowance receipts, the protected GIS increment, annual amounts and the income-year assumption. Person
breakdowns expose net income, provincial net income, other-payments deduction and supplement recovery. #21
will need each province's qualifying months, residency rules, marital definitions and distinct income exclusions;
it must distinguish base GIS from top-ups/protection where required and must not feed its supplements back into
the federal test (OAS Act s.2 excludes similar provincial payments). Do not assume every provincial supplement
uses taxable income or the same federal income test. Quebec drug-premium exemptions remain outside this page.

Validation uses `fnm exec --using=26 npm ci`, formatting, targeted GIS/reference tests and the required
`npm run check` (lint, typecheck, all tests, build and browser smoke). Final results and new case/cell counts
are recorded in the PR. The orchestrator owns independent review and the separate History back-fill issue at merge.

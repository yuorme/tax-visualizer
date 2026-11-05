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
`3 × (1380 × .150198 + 1150 × .090301) = 933.35817`; GIS-test income is 1,596.64183, not 2,530 or 2,000.

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
There are 412 annual cases with 2,692 numeric expected cells, plus 2,796 published monthly cases with
5,592 payment cells. The GIS test file runs 424 tests, including the monthly table comparisons.

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
net-income inclusion and taxable exclusion across every jurisdiction, the exact first-band CCB formula,
unchanged payroll and HSF, and refundable-credit-switch independence. Downstream tax/credit amounts are locked
for the specific ON, BC, NL and QC paths below; this is not exhaustive coverage of every provincial credit.
Reference tests in each year's suite use published
quarterly maximums **and the final nonzero Allowance band with protected GIS**, not just maximum entitlements.

The first new-fixture run caught omitted existing 2025 heating costs in six jurisdictions; the expectations now
include the locked heating amounts (BC 48, AB 99.45, MB 49.77, ON 58.86, NB 3.20, NS 3.95). These cells combine
the new benefit subtraction with unchanged carbon costs. The QPIP fourth-decimal correction is described above.
No pre-existing baseline was changed to resolve either failure.

## Review follow-up: net-income consumers

The first review correctly found that the original 390 annual cases did not enable refundable credits and
mostly locked benefit receipts, not their effects on other programs. Added **22 cases / 96 numeric cells**,
eleven cases per year, all with `useCredits: true`. The original 390 cases and all pre-PR golden fixtures are
unchanged. Refundable expectations are keyed by name because zero credits are omitted from the returned list.
The all-jurisdiction CCB test now asserts the exact one-child-under-six formula and a strict decrease from
the no-supplement maximum, rather than permitting equality.

The new expectations were calculated in a separate Python script, without engine imports or engine output:
lookup the GIS income band in cached Tables 1/3, sum quarterly cents, then apply the cited form arithmetic.
Parameters come from the already sourced year data; 2026 provisional rules/estimates retain their existing
status. These cached sources support the distinct bases:

- [Federal worksheet](2025/sources/seniors-federal-worksheet.txt): net-income-based age amount and BPA.
- [ON428](2025/sources/seniors-on428.txt), [BC428](2025/sources/seniors-bc428.txt) and
  [NL428](2025/sources/nl-childcare-credit.txt): LIFT and low-income reductions; OHP uses taxable income.
- [T2209 note 3](2025/sources/oas-audit-t2209.txt): subtract line 25000 from line 23600 for its denominator.
- [Schedule 6](2025/sources/issue-102-schedule6.txt) and [RC4210](2025/sources/rc4210-25.txt): CWB and GST
  adjusted family income do not remove line 14600 supplements; RC4210 also documents Ontario sales tax credit.
- [Quebec Schedule B](2025/sources/qc-schedule-b.txt), [solidarity guide](2025/sources/qc-solidarity-guide.txt)
  and [Schedule P](2025/sources/qc-work-premium-income.txt): family income uses line 275, before line 295.

Independent 2025 examples (the same forms with the year's parameters give the paired 2026 cases):

- `net-tested-age-gst-ostc` and `-off`: age 70, other income 35,000, non-pensioner spouse. Table 3 gives
  GIS 4,550.85. Net income rises from 43,791.14 to 48,341.99, crossing the age threshold 45,522 and GST
  threshold 45,521 **only because of GIS**. Age base is `9028 − .15 × (48341.99 − 45522) = 8605.0015`;
  applied credit is 1,247.7252175. GST is `698 − .05 × (48341.99 − 45521) = 556.9505` and OSTC is
  `742 − .04 × (48341.99 − 35632) = 233.6004`. Off cases lock the unreduced age/GST and higher OSTC.
- `net-tested-bpa-recovery`: other income 180,000 and spouse deductions 180,000 retain GIS 13,130.82.
  Recovery is `.15 × (180000 + 8791.14 + 13130.82 − 93454) = 16270.194`. Net income is 185,651.766;
  taxable income is 180,000 and remaining line 25000 is 5,651.766. BPA is
  `16129 − 1591 × (185651.766 − 177882) / 75532 = 15965.3383` to four decimals.
- `net-tested-lift-ohp`: age 76, wages 32,000, non-pensioner spouse. EI 524.80 leaves GIS-test income
  21,475.20 after exemption; Table 3 pays 7,934.85 annually. Net is 49,605.14 and LIFT is
  `875 − .05 × (49605.14 − 32500) = 19.743`, below available provincial tax. Taxable income 41,670.29
  keeps OHP at 450. In 2026, net 50,148.35 exhausts LIFT while OHP remains 450.
- BC `net-tested-reduction`: other income 20,000 gives net 29,891.99. Reduction is
  `562 − .0356 × (29891.99 − 25020) = 388.557156`; pre-reduction tax is
  `(28791.14 − 12932 − 5799) × .0506 = 509.043084`, leaving 120.485928.
- NL `net-tested-reduction`: other income 18,000 gives net 28,887.99. Reduction is
  `997 − .16 × (28887.99 − 23928) = 203.4016`; pre-reduction tax is
  `(26791.14 − 11067 − 7064) × .087 = 753.43218`, leaving 550.03058.
- `net-tested-foreign-credit`: foreign dividends 20,000, no other entered income. Basic federal tax is
  `(28791.14 − 16129 − 9028) × .145 = 526.9503`. T2209 allows
  `526.9503 × 20000 / 28791.14 = 366.0503` to four decimals; this cap is below withholding.
- `net-tested-cwb`: age 76, wages 15,000, non-pensioner spouse, no children. Net income 37,693.11 includes
  GIS 13,022.82. CWB is `2813 − .15 × (37693.11 − 30639) = 1754.8835`; secondary-earner exemption is zero.
- `net-tested-work-premium`: the same wages in QC, with one child. Worker deduction 900 makes line 275
  36,793.11. Work premium is `.25 × (15000 − 3600) − .10 × (36793.11 − 19534) = 1124.089`.
  Federal CWB instead uses 37,693.11 and is zero after its separate couple-with-child taper.
- `net-tested-couple-pool`: other income 35,000, non-pensioner spouse. QC pool is
  `3906 − .1875 × (48341.99 − 42090) = 2733.751875`, applied at 14%. Solidarity is
  `356 + 356 + 888 − .06 × (48341.99 − 42325) = 1238.9806`.
- `net-tested-single-pool`: age 76, wages 40,000, three children aged four with expenses 7,500 each.
  The automatic federal childcare claim is 22,500 (below both the 24,000 child cap and two-thirds earnings).
  GIS-test income is `40000 − 524 − 10000 − 22500 = 6976`; annual GIS is 8,414.82. QC line 275 excludes
  federal childcare but deducts the 1,420 worker amount: `40000 + 9670.29 + 8414.82 − 1420 = 56665.11`.
  Pool is `3906 + 2128 − .1875 × (56665.11 − 42090) = 3301.166875`, applied at 14%.
  Solidarity including three children is `356 + 169 + 731 + 465 − .06 × (56665.11 − 42325) = 860.5934`.
  Decimal half-up rounding gives the 2026 applied-credit expectation: `3491.6675 × .14 = 488.83345`,
  or 488.8335 at the fixture's four decimals; Python's default half-even rounding would give the wrong last digit.

Reproduced the review's eleven mutations one at a time in a temporary copy of `src`, `data` and `tests`,
with shared read-only dependencies. Ran `fnm exec --using=26 node --import tsx --test tests/gis-allowance.test.ts`
for each mutation, restoring the source between runs. Both unmodified controls (before and after) passed all
424 tests. Every mutant failed assertions, not syntax/import errors. No engine correction was needed.

| Mutation | Golden witness suffix, in both years | Outcome / failing tests |
| --- | --- | --- |
| Federal age input `net` → `ti` | `net-tested-age-gst-ostc` | Killed / 2 |
| Federal BPA input `net` → `ti` | `net-tested-bpa-recovery` | Killed / 2 |
| LIFT individual income `net` → `ti` | `net-tested-lift-ohp` | Killed / 2 |
| BC reduction income `net` → `ti` | BC `net-tested-reduction` | Killed / 2 |
| Both personal low-income-reduction call sites `net` → `ti` | NL `net-tested-reduction` | Killed / 2 |
| T2209 denominator `ti` → `net` | `net-tested-foreign-credit` | Killed / 2 |
| Couple QC pool income → `tiP` | `net-tested-couple-pool` | Killed / 2 |
| Single QC pool income → `tiP` | `net-tested-single-pool` | Killed / 2 |
| Subtract supplements from `creditsOf.famNet` | age/GST/OSTC, CWB, QC work-premium cases | Killed / 6 |
| Subtract supplements from `creditsOf.provincialFamNet` | both QC pools and work premium | Killed / 6 |
| OHP income `ti` → `net` | `net-tested-lift-ohp`, existing ON `single` | Killed / 4 |

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

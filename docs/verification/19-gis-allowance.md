# Issue #19: GIS and the spouse's Allowance

Coverage: **2025 and 2026, all thirteen provinces and territories**. This implements the engine and page halves of #19
and its sizing refinements, following [#18](18-oas-cpp.md). The page half now adds controls, tooltips, URL codec
and saved-state migration on top of the engine merged in PR #202.
Pension splitting (#20) and provincial senior supplements (#21)
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
There are 436 annual cases with 2,850 numeric expected cells, plus 2,796 published monthly cases with
5,592 payment cells. The GIS test file runs 448 tests, including the monthly table comparisons.

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
for the specific ON, BC, MB, NL and QC paths below; this is not exhaustive coverage of every provincial credit.
Reference tests in each year's suite use published
quarterly maximums **and the final nonzero Allowance band with protected GIS**, not just maximum entitlements.

The first new-fixture run caught omitted existing 2025 heating costs in six jurisdictions; the expectations now
include the locked heating amounts (BC 48, AB 99.45, MB 49.77, ON 58.86, NB 3.20, NS 3.95). These cells combine
the new benefit subtraction with unchanged carbon costs. The QPIP fourth-decimal correction is described above.
No pre-existing baseline was changed to resolve either failure.

## Review follow-up: net-income consumers

The first review correctly found that the original 390 annual cases did not enable refundable credits and
mostly locked benefit receipts, not their effects on other programs. Added **22 cases / 96 numeric cells**,
eleven cases per year, all with `useCredits: true`. That round preserved the original 390 cases exactly;
all pre-PR golden fixtures remain unchanged. Refundable expectations are keyed by name because zero credits
are omitted from the returned list.
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
| Combined low-income call-site mutation; reachable multi-line site caused the failures | NL `net-tested-reduction` | Killed / 2 |
| T2209 denominator `ti` → `net` | `net-tested-foreign-credit` | Killed / 2 |
| Couple QC pool income → `tiP` | `net-tested-couple-pool` | Killed / 2 |
| Single QC pool income → `tiP` | `net-tested-single-pool` | Killed / 2 |
| Subtract supplements from `creditsOf.famNet` | age/GST/OSTC, CWB, QC work-premium cases | Killed / 6 |
| Subtract supplements from `creditsOf.provincialFamNet` | both QC pools and work premium | Killed / 6 |
| OHP income `ti` → `net` | `net-tested-lift-ohp`, existing ON `single` | Killed / 4 |

## Round 3: provincial FTC, spouse credit and complete income-base audit

The second review identified two additional unlocked consumers. Added provincial FTC assertions to the two
`net-tested-foreign-credit` cases and a `net-tested-allowance-spouse` case in each year. The wider audit
then added eleven paired scenarios and explicit reporting assertions: **24 new cases / 158 added cells**
since `0e429d3`. Every pre-existing input and expected value is preserved; additions are confined to this PR's
new fixture. No engine code or pre-PR golden file changed. The first 390 cases now have some additional
assertions, so the earlier round's exact-object comparison describes that round, not this final fixture.

Independent arithmetic for the two requested consumers:

- [T2036 note 3](2025/sources/oas-audit-t2036.txt) imports T2209's income denominator, excluding line 25000.
  In 2025 ON tax after BPA/age is `(28791.14 − 12747 − 6223) × .0505 = 495.96757`.
  Ontario reduction is `588 − 495.96757 = 92.03243`, leaving 403.93514. Provincial FTC is therefore
  `403.93514 × 20000 / 28791.14 = 280.5968` to four decimals; unused foreign withholding does not bind.
  For 2026 the corresponding pre-FTC tax is 376.51749 and denominator 28,999.49, giving 259.6718.
  Both cases have positive provincial tax before and after FTC.
- Allowance spouse: older adult age 70 with other income 32,000, spouse age 62. Table 4 sums give 2025 GIS
  3,037.20 and spouse Allowance 2,269.65. Federal spouse base is `16129 − 2269.65 = 13859.35`, giving
  applied credit `13859.35 × .145 = 2009.60575`. Federal tax stays positive:
  `(40791.14 − 16129 − 13859.35 − 9028) × .145 = 257.34455`.
  In 2026 Allowance 2,515.38 reduces the base to 13,936.62, credit to 1,951.1268, and leaves tax 196.4018.
  The provincial spouse amount and applied credit are also locked. The inputs and net-income definition
  follow [T1](2025/sources/seniors-t1.txt) and [ON428](2025/sources/seniors-on428.txt).

Additional independent calculations used to close the audit gaps (paired cases cover both years):

- `audit-proxy-credit-switch` retains the existing independently verified partial-DTC income/payment
  expectations with `useBpa: false`. `audit-proxy-spouse-dividend` uses 25,000 eligible dividends and an
  Allowance spouse: 2025 historical pre-DTC tax is `(34500 + 8791.14 − 2×16129 − 9028) × .145 = 290.7453`.
  The adjustment is `3 × (34500×.150198 − 290.7453) = 14673.2571`; Table 4 tests 19,826.7429.
  Current Allowance must not reduce that historical spouse credit or feed back into the proxy income.
- `audit-t778-negative-base`: older worker age 76 earns 10,000 and deducts 30,000 RRSP; spouse earns 5,000.
  Full GIS is payable after combining the proxy incomes. Current pre-childcare income is
  `10000 + 9670.29 − 30000 + 13130.82 = 2801.11`, below the spouse's `5000 − 15 = 4985`.
  The older worker claims 2,000 and has net 801.11. Flooring before adding GIS elects the wrong claimant.
- `audit-allowance-recovery`: the younger spouse has 200,000 other income and no OAS field; the older
  spouse has offsetting 200,000 deductions. The 15% recovery exceeds and is capped at the younger spouse's
  16,695.09 Allowance in 2025 (17,090.91 in 2026). Their line 25000 deduction is zero and net/taxable
  income both equal 200,000. The recovery trigger must work for Allowance without OAS.
- `audit-childcare-repayment-bases`: QC older adult has 150,000 other income and an explicitly verified
  exceptional manual childcare claim of 8,000; spouse deductions offset the GIS test. Gross income including
  OAS/GIS is 171,921.96. Federal recovery is `.15 × (171921.96 − 8000 − 93454) = 10570.194`.
  QC imports that recovery, excludes federal childcare, and reports line 275 of 161,351.766 and taxable
  income 150,000. Recomputing recovery on the provincial base would incorrectly increase it by 1,200.
- `audit-bpa-net`: MB other income 200,000 with offsetting spouse deductions gives net 202,651.766 in 2025.
  BPA is `15780 × (1 − (202651.766 − 200000)/200000) = 15570.7756626`; taxable income remains 200,000.
  `audit-family-benefit`: MB single other income 20,000 gives family-benefit base
  `2065 + 2065 − .09×29891.99 = 1439.7209`, applied at 10.8%. See
  [Manitoba's Act](2025/sources/mb-income-tax-act.txt) and the sourced MB parameters.
- `audit-allowance-family-reduction`: the same 32,000/Allowance household in NL has family net 46,097.99
  in 2025, so its reduction is `997 + 557 − .16×(46097.99 − 40460) = 651.9216`. Positive tax permits the
  whole reduction. This tests the family branch separately from the prior single-adult case.
- `audit-childcare-family-benefit` repeats the independently checked QC single-parent case with all three
  7,500 expenses attested as Quebec-eligible. At line 275 of 56,665.11, childcare credit is
  `22500 × .70 = 15750`; family allowance is `3×3006 + 1055 − .04×(56665.11 − 43280) = 9537.5956`.
  The children are under six, so no school-supplies amount enters. The
  [Schedule C](2025/sources/quebec-childcare-schedule.txt) income base differs from federal net income.
- `audit-care-income` enables credits for the existing T778 reversal case. [ON479-A](2025/sources/ontario-care.txt)
  adds the 8,000 deduction back to net income 44,588.11. CARE has eight reduction steps through 40,000 and
  three more to 52,588.11: rate `.75 − 11×.02 = .53`, applied credit `8000 × .53 = 4240`.
- `audit-cwb-secondary-earner`: older worker age 76 earns 15,000; Allowance spouse earns 10,000 and deducts
  10,000 RRSP plus 65 enhanced CPP. Full GIS/Allowance give family net 49,204.33 in 2025. The spouse's
  net 16,630.09 exceeds wages, so the secondary exemption is 10,000, not their negative pre-Allowance net.
  CWB is `2813 − .15×(49204.33 − 10000 − 30639) = 1528.2005`.
- Reporting assertions use these same sums, not engine capture. At the final Q1 Allowance band its pension
  portion is zero, so protected GIS minus Allowance gives the protection increment: 250.46 in 2025 and
  255.52 in 2026. Income-component and pre-childcare/pre-recovery reports are locked separately from taxes.

### Changed-line inventory and mutation method

Inventory is against this PR's merge base; engine line numbers are unchanged since `65dff0a`. Continuation
lines belong to the same expression. The following covers every changed executable statement reading a
supplement or income base, with declarations, comments and imports identified separately:

| File | Changed lines / statements audited |
| --- | --- |
| `childcare.ts` | 131–133: pre-deduction net, supplement inclusion, zero floor and claimant comparison. |
| `household.ts` | 115–123: proxy dividend calculation/forwarding; 144–154: proxy/current childcare, GIS/Allowance and net forwarding; 156–160: recovery and Quebec net; 183: person context; 296, 308–313: QC pools; 381–387: four exposed income bases and both spouse terms; 420: benefit subtraction; 435: supplement breakdown. |
| `payroll.ts` | 267–272: supplement assignment, recovery trigger/cap/income; 292: total net-income inclusion. |
| `personal.ts` | 60–65: amounts, net/floor, repayment-adjusted deduction and taxable income; 68–73: provincial net/recovery/deduction and senior base; 82: BPA; 186–193 and 199: reductions; 213: LIFT; 219: BC reduction; 225 and 228–229: FTC denominators; 301–309 and 314: all new net/deduction/repayment reports. |
| `gis-allowance.ts` | 49–70: every income type, payroll, exemption, deduction, combined income and reports; 78–113: OAS equivalent, tested income, steps, top-ups, all bases/offsets/tapers and protection; 128–129, 146, 152–167: annual income/OAS/category/quarter forwarding and receipt assignment; 170, 174–180: monthly retention, annual sums and reports. |
| Additional downstream consumers | `household.ts` 192, 204, 211, 393, 399–400, 406–407, 412 and `personal.ts` 83, 145, 246: family context, spouse amounts, child/childcare/refundable credits, secondary-earner exemption, provincial BPA/family benefit and OHP. These unchanged lines consume the newly changed bases and were included too. |
| Non-executable or structural changes | Import/export lines; `Person`/`Ctx`/`NetIncomeParts` declarations and function parameters; public-pension recovery comment; GIS validation/type declarations and result containers. Their supplied values and runtime consumers are tested above. |

Each mutation runs alone in a scratch copy; the working-tree engine is untouched. The main command is
`fnm exec --using=26 node --import tsx --test tests/gis-allowance.test.ts`. Both controls pass 448 tests.
The Quebec legacy-net mutation additionally runs `tests/qc-living-alone.test.ts`; its controls pass 80 tests
and it fails three assertions, including both years' single-parent childcare cases. Those existing tests and
goldens are unchanged. With GIS enabled, the senior-pool route supersedes that legacy living-alone consumer.

There are **125 mutations: 123 killed, two equivalent**, with no unexplained survivor or syntax/import failure.
Equivalence is established independently of test survival:

- `proxy-dividend-excess`: removing `−fedBasic` cannot change the positive excess DTC. DTC is applied up
  to pre-DTC tax; either it is fully used (excess zero), or tax after DTC is zero (`fedBasic = 0`).
- `low-income-legacy-unreachable`: only the one-line call at `personal.ts:199` changes. Every 2025/2026
  province with a low-income reduction supplies `claimants.lowIncomeReduction`, so these years always use
  the multi-line call. Older years cannot enable GIS; net and taxable bases remain equal there. The
  reachable own-income and family-income calls were mutated separately and both failed.

The complete per-mutant outcomes follow. IDs identify the single substitution; locations name its source
statement. Killed means a numerical or required-field assertion failed, not that the test process crashed.

| Mutation | Engine location | Outcome (failed tests) |
| --- | --- | --- |
| `federal-age` | `personal.ts:73` | Killed (2) |
| `federal-bpa` | `personal.ts:82` | Killed (2) |
| `lift` | `personal.ts:213` | Killed (2) |
| `bc-reduction` | `personal.ts:219` | Killed (2) |
| `low-income-reductions` | `personal.ts:187` | Killed (2) |
| `t2209-denominator` | `personal.ts:225` | Killed (2) |
| `qc-couple-pool` | `household.ts:296` | Killed (2) |
| `qc-single-pool` | `household.ts:311` | Killed (4) |
| `refundable-federal-income` | `household.ts:405` | Killed (8) |
| `refundable-qc-income` | `household.ts:407` | Killed (8) |
| `ontario-health-premium` | `personal.ts:246` | Killed (4) |
| `t2036-denominator` | `personal.ts:228` | Killed (2) |
| `spouse-federal` | `household.ts:204` | Killed (2) |
| `spouse-provincial` | `household.ts:211` | Killed (2) |
| `childcare-comparison` | `childcare.ts:132` | Killed (4) |
| `childcare-income-floor` | `childcare.ts:132` | Killed (2) |
| `proxy-strip-supplements` | `household.ts:119` | Killed (2) |
| `proxy-credit-switch` | `household.ts:120` | Killed (2) |
| `proxy-dividend-excess` | `household.ts:121` | Equivalent (0; proof above) |
| `proxy-dividend-forward` | `household.ts:123` | Killed (8) |
| `gis-childcare-forward` | `household.ts:145` | Killed (10) |
| `gis-dividend-forward` | `household.ts:145` | Killed (8) |
| `supplements-gis-component` | `household.ts:148` | Killed (126) |
| `supplements-allowance-component` | `household.ts:148` | Killed (36) |
| `current-childcare-forward` | `household.ts:150` | Killed (4) |
| `household-net-forward` | `household.ts:153` | Killed (108) |
| `household-net-floor` | `household.ts:153` | Killed (4) |
| `household-recovery-forward` | `household.ts:158` | Killed (2) |
| `qc-legacy-net-childcare` | `household.ts:160` | Killed (3); living-alone suite |
| `person-context-supplements` | `household.ts:183` | Killed (40) |
| `before-childcare-report` | `household.ts:381` | Killed (4) |
| `before-recovery-base` | `household.ts:382` | Killed (6) |
| `provincial-array-report` | `household.ts:384` | Killed (2) |
| `provincial-family-first` | `household.ts:386` | Killed (6) |
| `provincial-family-second` | `household.ts:386` | Killed (2) |
| `provincial-family-single` | `household.ts:387` | Killed (4) |
| `benefit-subtraction` | `household.ts:420` | Killed (78) |
| `gis-breakdown-report` | `household.ts:435` | Killed (408) |
| `monthly-protection-report` | `gis-allowance.ts:113` | Killed (2) |
| `income-working-report` | `gis-allowance.ts:65` | Killed (16) |
| `income-exemption-report` | `gis-allowance.ts:66` | Killed (16) |
| `income-other-report` | `gis-allowance.ts:67` | Killed (2) |
| `income-deductions-report` | `gis-allowance.ts:68` | Killed (10) |
| `income-adjustment-report` | `gis-allowance.ts:69` | Killed (8) |
| `monthly-oas-equivalent` | `gis-allowance.ts:78` | Killed (202) |
| `neither-offset-rounding` | `gis-allowance.ts:95` | Killed (86) |
| `allowance-offset-rounding` | `gis-allowance.ts:105` | Killed (75) |
| `neither-payment` | `gis-allowance.ts:103` | Killed (95) |
| `protection-application` | `gis-allowance.ts:111` | Killed (43) |
| `annual-income-forward` | `gis-allowance.ts:165` | Killed (274) |
| `monthly-receipt-store` | `gis-allowance.ts:166` | Killed (409) |
| `annual-incomes-report` | `gis-allowance.ts:178` | Killed (34) |
| `annual-adults-report` | `gis-allowance.ts:179` | Killed (436) |
| `payroll-supplement-report` | `payroll.ts:267` | Killed (130) |
| `allowance-recovery-trigger` | `payroll.ts:268` | Killed (2) |
| `recovery-cap` | `payroll.ts:271` | Killed (12) |
| `recovery-income` | `payroll.ts:271` | Killed (13) |
| `net-income-total` | `payroll.ts:292` | Killed (130) |
| `personal-supplement-local` | `personal.ts:60` | Killed (110) |
| `personal-net-forward` | `personal.ts:61` | Killed (116) |
| `personal-net-floor` | `personal.ts:62` | Killed (2) |
| `line25000-repayment` | `personal.ts:64` | Killed (12) |
| `federal-taxable-deduction` | `personal.ts:65` | Killed (102) |
| `qc-personal-net-forward` | `personal.ts:69` | Killed (12) |
| `qc-recovery-override` | `personal.ts:69` | Killed (2) |
| `nonqc-personal-net-base` | `personal.ts:70` | Killed (17) |
| `provincial-net-amount-base` | `personal.ts:71` | Killed (4) |
| `provincial-taxable-deduction` | `personal.ts:72` | Killed (14) |
| `low-income-legacy-unreachable` | `personal.ts:199` | Equivalent (0; proof above) |
| `t2036-share` | `personal.ts:229` | Killed (2) |
| `supplement-report-gate` | `personal.ts:301` | Killed (30) |
| `supplement-report` | `personal.ts:303` | Killed (2) |
| `net-report` | `personal.ts:304` | Killed (8) |
| `qc-net-report` | `personal.ts:305` | Killed (14) |
| `deduction-report` | `personal.ts:306` | Killed (6) |
| `repayment-report` | `personal.ts:307` | Killed (4) |
| `recovery-income-report` | `personal.ts:314` | Killed (4) |
| `income-wages` | `gis-allowance.ts:49` | Killed (28) |
| `income-business` | `gis-allowance.ts:49` | Killed (6) |
| `income-base-payroll` | `gis-allowance.ts:49` | Killed (10) |
| `income-enhanced-payroll` | `gis-allowance.ts:49` | Killed (10) |
| `income-ei` | `gis-allowance.ts:49` | Killed (30) |
| `full-earnings-exemption` | `gis-allowance.ts:51` | Killed (36) |
| `partial-earnings-exemption` | `gis-allowance.ts:52` | Killed (30) |
| `income-other` | `gis-allowance.ts:54` | Killed (254) |
| `income-cpp` | `gis-allowance.ts:55` | Killed (2) |
| `income-retirement` | `gis-allowance.ts:56` | Killed (2) |
| `income-foreign` | `gis-allowance.ts:57` | Killed (2) |
| `income-gains` | `gis-allowance.ts:58` | Killed (2) |
| `income-eligible-dividends` | `gis-allowance.ts:59` | Killed (10) |
| `income-noneligible-dividends` | `gis-allowance.ts:60` | Killed (2) |
| `income-dtc-adjustment` | `gis-allowance.ts:61` | Killed (8) |
| `income-ordinary-deductions` | `gis-allowance.ts:62` | Killed (20) |
| `income-childcare` | `gis-allowance.ts:62` | Killed (10) |
| `income-qpip` | `gis-allowance.ts:62` | Killed (4) |
| `income-aggregate-floor` | `gis-allowance.ts:70` | Killed (22) |
| `monthly-tested-income` | `gis-allowance.ts:81` | Killed (276) |
| `monthly-band-step` | `gis-allowance.ts:82` | Killed (148) |
| `monthly-topup-threshold` | `gis-allowance.ts:89` | Killed (98) |
| `monthly-topup-step` | `gis-allowance.ts:90` | Killed (70) |
| `monthly-single-base` | `gis-allowance.ts:93` | Killed (251) |
| `monthly-couple-base` | `gis-allowance.ts:94` | Killed (226) |
| `monthly-neither-offset` | `gis-allowance.ts:96` | Killed (112) |
| `monthly-single-taper` | `gis-allowance.ts:100` | Killed (73) |
| `monthly-couple-taper` | `gis-allowance.ts:102` | Killed (39) |
| `monthly-allowance-offset` | `gis-allowance.ts:106` | Killed (97) |
| `monthly-allowance-pension` | `gis-allowance.ts:108` | Killed (103) |
| `monthly-protection` | `gis-allowance.ts:110` | Killed (43) |
| `annual-childcare-input` | `gis-allowance.ts:128` | Killed (10) |
| `annual-dtc-input` | `gis-allowance.ts:128` | Killed (8) |
| `annual-income-couple` | `gis-allowance.ts:146` | Killed (61) |
| `annual-income-single` | `gis-allowance.ts:146` | Killed (75) |
| `annual-quarter` | `gis-allowance.ts:165` | Killed (410) |
| `annual-allowance-payment` | `gis-allowance.ts:167` | Killed (153) |
| `annual-gis-sum` | `gis-allowance.ts:174` | Killed (409) |
| `annual-allowance-sum` | `gis-allowance.ts:175` | Killed (153) |
| `annual-total` | `gis-allowance.ts:180` | Killed (143) |
| `provincial-bpa-consumer` | `personal.ts:83` | Killed (2) |
| `mb-family-consumer` | `personal.ts:145` | Killed (2) |
| `household-low-income-context` | `household.ts:192` | Killed (2) |
| `child-benefit-qc-base` | `household.ts:393` | Killed (2) |
| `care-income-base` | `household.ts:399` | Killed (2) |
| `qc-childcare-income-base` | `household.ts:400` | Killed (2) |
| `cwb-secondary-earner-base` | `household.ts:412` | Killed (2) |
| `personal-low-income-family-base` | `personal.ts:189` | Killed (2) |

## Handoff and validation

The page serializes both opt-ins independently, preserves omission/false, gates unsupported years and reuses
#18’s age/month controls without inferring eligibility from age. Tooltips explain the historical-income proxy,
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


## Page implementation and verification

The Normal page task is implemented with Codex Astra at high effort. Its scope is `src/ui/**`, page e2e tests,
new migration/codec tests, this note and SCOPE. Engine, schema, data and golden files are unchanged; the known
`incomeBases.beforeChildcare` issue is untouched. No amounts, rates, thresholds or benefit formulas were added to UI.

- `senior-benefits.ts` centralizes boolean normalization, data-driven coverage, incomplete-date gating and tooltips.
  Both URL decoding and saved-state cleanup use it. Omitted fields stay omitted, false stays false, malformed
  values are ignored and age alone never opts anyone in. A codec version bump is unnecessary for additive fields.
- GIS and the spouse’s Allowance checkboxes sit inside the existing Retirement income controls. Each adult owns
  their choices. Existing age/month controls supply the engine dates; clearing a date retains the benefit draft.
  The Allowance control is shown only for two adults with spouse/common-law status. Hiding it never clears the
  stored flag; URL/storage round trips and restoring spouse status preserve it. There is no age-window gating.
  Complete dates too young for the existing retirement rules get a specific notice, using `retirementCoverage`
  rather than adding an age threshold. Mixed young/incomplete adult drafts receive both applicable notices.
  All statutory eligibility, marital-category selection, income tests and monthly payments remain in the engine.
- The per-adult ledger formats engine-reported GIS, Allowance, federal/provincial net income, other-payments
  deduction and supplement recovery. Recovery uses `netIncome.oasRecovery`, including when Allowance is enabled
  without an OAS field. The household comparison shows the engine’s total supplements as a credit before net tax;
  chart benefit tooltips identify payments above the display cutoff and omit zero payments.
  Taxable-income explanations include the benefits and offsetting deduction.
- Separate tooltips cover eligibility, income-year/birthday/quarterly timing and accounting. They explain that
  gross benefits reduce net tax once, remain outside the income denominator, affect other net-income-tested programs
  and do not depend on the credit switches. They also warn against duplicating benefits in Other income.
- Selected older years strip even explicit false before the engine, retain drafts and show the coverage notice.
  Nominal and real history omit unsupported years and describe coverage and the income-year proxy. Existing
  scenarios without the new fields retain their previous calculations and historical rows.

`tests/gis-allowance-page.test.ts` covers both fields’ omission/false/true combinations for both adults, malformed
values, pre-#19 URLs and saves, date completion and unsupported years. `tests/e2e/gis-allowance.mjs` is registered
in the required smoke suite and asserts every page acceptance item:

- per-adult controls, switching/removal, every new URL field and saved-state restoration, including explicit false;
- hidden Allowance controls for single/non-spouse households, preserved true drafts and restored checked controls;
- zero-payment segment tooltips and correct young-date notices in the selected year and history;
- all marital categories, a partial-payment income, the protected Allowance boundary, OAS false/omitted and both
  years’ June/December birthdays at the Allowance start/end, comparing all thirteen chart results to the engine;
- ON/QC per-adult ledger values, net tax and cash left, taxable-income explanations and Allowance-only recovery;
- both credit switches, incomplete dates, pre-#19 URL and saved-state results, selected 2024 and both history modes;
- coverage and assumption tooltip text, phone tooltip bounds, controls and ledger overflow, in light and dark.

Published independent anchors remain in the engine note above. Browser assertions additionally pin the displayed
2025 full-year single GIS to $13,131 and Allowance to $16,695 (rounded from 13,130.82 and 16,695.09). The other page
assertions compare to engine reports to catch wiring/formatting mistakes, rather than recomputing benefits in UI.

Validation: `fnm exec --using=26 npm ci`, `npm run format`, the five page unit tests and `npm run check`.
The browser matrix covers 375 px, 430 px and desktop, light and dark, with no sideways scrolling. Comparison uses
`npm run compare -- origin/main`: six runs, five steps each. It reports three intended control differences
(the two new unchecked checkboxes and shifted anonymous control indexes); no visible text or result changes
occur in its legacy scenarios. Exit 1 is the comparator’s expected status for these differences. Final check
results are also recorded in the page PR.
The orchestrator owns independent review and the History back-fill issue at merge.

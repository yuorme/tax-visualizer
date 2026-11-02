# Golden coverage audit

Issue #111, initially audited against `4212d8a` (main after PR #104), then extended against `5ad729c` after
childcare PRs #105/#107 merged. This is a coverage audit of the implemented model,
not a certification of all Canadian tax rules. It preserves every existing golden fixture, scenario and assertion.
The 2025/2026 baseline still runs 148 households across all 13 jurisdictions for each year.

## Findings and additions

The legacy scenarios never supply `rrsp` or `fhsa`. Their snapshot omits nested display breakdowns, fuel
components and bracket lines. Driving already affects locked 2026 totals. No 2025/2026 data selects the four
historical program IDs added in #104. Passing those goldens cannot establish regression coverage for the
missing inputs, historical paths or omitted nested outputs, even if execution coverage is high.
Existing unit tests covered several of these paths, but unit coverage is not golden coverage.

`tests/golden/features/coverage.json` adds 95 named household cases and three fuel-period cases, read by
`tests/golden-features.test.ts`. Expected values were authored with independent arithmetic below, not captured
from engine output. The runner calls `compute` for every household, including historical programs, and compares
fixed named output paths to four decimal places. Each path must exist; a renamed or missing output fails.
The runner has no recapture mode. The separate fixture leaves the legacy snapshot format intact.

Historical specimens patch only their named rule onto 2025 data. They test the rule and its household wiring;
they are explicitly **not full 2024 tax-return fixtures**. The 2024 data PR must also carry its own year goldens.

## Engine inventory

`L<n>` means scenario ID `<n>` in both existing year fixtures unless a year is specified. These are regression
observations from the locked results, not newly verified legal claims. Every legacy case runs every jurisdiction.
New case prefixes below refer to the additive fixture. Program IDs are listed explicitly so future audits can
compare this inventory with the schema and engine switches.

| Engine feature or input | Existing golden evidence | Added coverage / disposition |
|---|---|---|
| Progressive brackets, fixed/phased BPA, credit floors | L1, L16, L22; `fTax`, `pTax`, `fMarg`, `pMarg`, amounts | `display-bracket-lines` also locks nested widths/taxes |
| Employment `ord`, CPP/QPP base/enhanced, EI, QPIP, territorial payroll | L0, L2, L15, L16; each person's `pay` | `display-payroll-*` locks household sums for ON/QC/NT |
| Ontario health premium | L0, L2, L15; `ohp` and payroll | `itemized-*` and `display-payroll-ON` |
| Eligible/noneligible dividend gross-ups and credits | L16–L18, L21; taxable income and credit amounts | `display-investment-parts` locks displayed gross-ups |
| Capital gains inclusion and loss floor | L16, L20, L21 | `display-investment-parts`, `display-capital-loss` |
| Foreign dividends, withholding, federal/provincial credit caps | L19, L21; `wh`, `fFtc`, `pFtc` | `display-qc-abatement-foreign-tax` locks nested FTC/uncredited amounts |
| Generic deduction `ded`, zero net-income floor | L21 and seeded cases | `itemized-floor-*`, independently fixed expected zero |
| Claimed RRSP and FHSA, including FHSA above $8,000 | Absent; unit equivalence tests only | `itemized-*`: both years, two adults, benefits and floors |
| RRSP estimated room helper: earned income, rounding, cap | Absent from snapshot | `display-room-*`, `display-investment-parts`, `itemized-*` |
| Quebec worker deduction and federal abatement | QC L0, L15; `workerDed`, `tiP`, `k`, federal tax | Nested abatement locked by `display-qc-abatement-foreign-tax` |
| Spouse/dependant credit, higher-net claimant, implicit zero-income spouse | L7, L10–L13; `claim`, person credits | NS historical cases; explicit two-person deduction case |
| Quebec unused-credit transfer and living-alone amount | QC L0, L11; claim and person credits | Existing golden coverage retained |
| Federal-linked spouse/BPA (YT) and fixed provincial spouse amounts | YT and other jurisdictions L11 | Existing golden coverage retained |
| `nova-scotia-spouse-amount`, claimant taper and independent dependant reductions | No data activates it | `ns-*`: thresholds, disregard, exhausted supplement/base, disabled/floored credit |
| Provincial child amounts, all children versus under-six | SK/NS/NU L4–L7; `kidAmt`, `pKid` | Existing golden coverage retained |
| Ontario surtax before dividend credit | ON L15–L18, L21; `surtax`, `pDtc` | `display-two-person-surtax` locks nested sum |
| Ontario tax reduction, LIFT, BC reduction | ON/BC L2–L4; `onRed`, `lift`, `bcRed` | `display-two-person-reductions`, `display-lift-reduction`, `display-bc-reduction` |
| `nl-low-income-reduction` | NL L2–L4; `lowRed` | Existing golden coverage retained |
| `nb-low-income-reduction` | NB L2–L4; `lowRed` | Existing golden coverage retained |
| `family-low-income-reduction` | NS/PE L2–L4; `lowRed` | Existing golden coverage retained |
| CCB maximum, child-age split, child-count rates and income reduction | L4–L8; `ccb` | `itemized-benefits-*` locks deduction flow into benefit income |
| GST/HST credit / groceries benefit, family types, supplement and phase-out | L1–L4, L10; named credits | Existing golden coverage retained |
| CWB standard, AB/NU regional and QC family types | L2–L4, L10; named CWB credit | Existing regression coverage; known issue #102 remains open |
| `active`, `spouse`, `adults`, `kids`, `under6` | L4–L13, L27; claims, benefits, `margBy` | `itemized-two-people-active-second` locks selected adult's marginal FD tax |
| `useBpa`, `useCredits`, `whRate` | L19, L22, L23; person credits and credit list | `ns-disabled`, `mb-disabled`, foreign-tax display case |
| `homeValue`, `rent`, `propertyRates` | L3, L15, L24–L26; property and housing credits | `mb-*`, `fuel-sales-property-integration` |
| `monthlySpending` and sales tax | L0, L8, L15, L27; `sales`, `gross`, `total` | Fuel integration locks no duplicated sales tax on gasoline |
| `driving`, fuel availability, component taxes, day weighting | 2026 totals include fuel; nested fuel absent | `fuel-*`: component amounts, negative/zero/absent input and missing-year data |
| Fuel `ratePeriods` / `yearAverage`, leap year and constant rates | Unit-only | Three fixed period/average goldens, including 60/366 leap-year split |
| Cash, investment totals/tax, marginal rates, averages and household totals | All legacy cases; top-level numbers and `margBy` | Itemized and fuel totals; nested money-left at zero/positive income |
| Nested net-income parts, payroll, surtax, reductions, FTC, money left | Unit-only; omitted by snapshot | `display-*` plus itemized and fuel cases |

### Provincial child-benefit dispatch

All existing child-benefit programs have a positive locked `provBen` in L4; this was checked directly in both
JSON fixtures. Absence of a program in SK/MB is intentional. The historical programs need synthetic activation.

| Program | Golden evidence |
|---|---|
| `ontario-child-benefit` | ON L4; new deduction/benefit cases |
| `quebec-family-allowance` | QC L4–L7, including school-age split and single-parent/couple cases |
| `bc-family-benefit` | BC L4–L8, plus higher-income seeded cases |
| `alberta-child-family-benefit` | AB L4–L8; preserved scalar approximation |
| `alberta-child-family-benefit-by-child` | `ab-*`: each rate, capped count, phase-in, exhaustion and one combined minimum |
| `nova-scotia-child-benefit` | NS L4–L6, including full/partial/zero income regions |
| `nb-child-tax-benefit` | NB L4–L7; child benefit and working supplement combined in `provBen` |
| `per-child-reduced` | YT/NU L4–L7, including more-than-one-child rate |
| `nwt-child-benefit` | NT L4–L7, including mixed ages and more than four children |
| `nl-child-benefit` | NL L4–L7; preserved common-endpoint approximation |
| `nl-child-benefit-reduction` | `nl-*`: one/two/three/four/six children, threshold, reduction and zero floor |
| `income-band-per-child` | PE L4–L7; positive/zero results in both years |

### Provincial refundable-credit dispatch

Each entry below was observed by its credit name with a positive amount in the locked fixture. The legacy
snapshot stores complete credit lists, so unexpected omissions or extra nonzero entries also fail.

| Program | Positive legacy witness / added cases |
|---|---|
| `ontario-sales-tax-credit` | ON L1 |
| `ontario-energy-property-tax-credit` | ON L3; occupancy/property scenarios also L24 |
| `quebec-solidarity-tax-credit` | QC L1 |
| `quebec-work-premium` | QC L2 |
| `bc-renters-tax-credit` | BC L3 |
| `mb-affordability-credits` | MB L3 renter, L15 homeowner |
| `mb-school-tax-credits` | `mb-*`: school-share basis, remaining-tax cap, rent cap, owner precedence and switch |
| `sk-low-income-tax-credit` | SK L1 |
| `nb-hst-credit` | NB L1 |
| `ns-affordable-living-tax-credit` | NS L1 |
| `pei-essentials-benefit` | PE 2026 L0; minimum and phase-out exercised at higher incomes |
| `pei-sales-tax-credit` | PE 2025 L1; supplement in seeded incomes |
| `nl-income-supplement` | NL L1 |

## Independent expected-value derivations

The fixture stores literal inputs and expected values. The following arithmetic can be checked without running
the implementation. Supporting correctness tests remain in `engine-history`, `deductions`, `engine-fuel` and
`engine-display`; the new fixture is not a substitute for those tests or for source validation.

- **NS:** [cached worksheet](2024/sources/rule-ns-worksheet-2024.txt) and
  [rule audit](2024-rule-shapes.md). At claimant/dependant income $25,000/$1,000, base is
  `8,481 − (1,000 − 848) = 8,329`; supplement is `3,000 − 1,000 = 2,000`; total is $10,329.
  At $50,000/$2,000, base is $7,329 and the $1,500 supplement is exhausted. At $75,000, the supplement is zero.
  Claims totaling $30,000 reduce $80,000 to $50,000. All inputs use FD to avoid payroll deductions.
- **MB:** [cached MB479](2024/sources/rule-mb479-2024.txt) and the rule audit describe the 50% rebate, $350
  remaining-school-tax cap and $525 rent cap. The fixture's 50% school share is deliberately synthetic.
  Gross tax $1,000/$1,400/$4,000 gives school tax $500/$700/$2,000 and total relief $500/$700/$1,350.
  Monthly rent $10/$1,000 gives annual relief $120/$525; an owner receives only school relief.
- **NL:** [cached regulation](2024/sources/rule-nl-child-regulations-2024.txt), January 2024 amounts.
  One/two/three/four/six children have maxima $1,788/$3,684/$5,720/$7,908/$12,284. At $1,000 above $17,397,
  reductions are $161/$331.80/$515.10/$712.20/$1,106.40. High income exhausts entitlement; no child means zero.
- **AB:** [cached original enactment](2024/sources/rule-ab-2019-enactment.txt), section 30.2; original amounts,
  not indexed 2024 figures. At $1,000 over the base threshold, subtract $80.50/$120.70/$160.90/$201.10.
  At $42,000 net and $50,000 employment, base is exhausted; subtract $34/$64.90/$83.40/$89.50 from working maxima.
  The input uses $7,535 deductions plus $465 enhanced CPP to make net income exactly $42,000.
  At $40,970 net/$2,800 employment/four children, base is $6.2467 and working is $6: combined $12.2467,
  not two $10 minima. Positive $2 or $1 entitlement becomes $10; zero remains zero. Six children use the fourth rate.
- **Itemized claims:** $50,000 FD less $8,000 RRSP, $13,000 FHSA and $1,000 other = $28,000 taxable income.
  With personal credits disabled, 2025 federal tax is `28,000 × .145 = 4,060`, Ontario tax is
  `28,000 × .0505 = 1,414`, health premium $300: total $5,774. The 2026 federal rate .14 makes total $5,634.
  Cash stays $50,000. Excess deductions floor net income and tax at zero. See the independently sourced
  deferred $13,000 FHSA example in `tests/deductions.test.ts`.
- **Deduction/benefit flow:** $60,000 less $22,000 claims = $38,000 family net. The 2025 CCB is
  `7,997 − (38,000 − 37,487) × .07 = 7,961.09`; Ontario benefit is
  `1,726.92 − (38,000 − 26,364) × .08 = 796.04`. For 2026 the corresponding values are $8,157 and $869.20.
  These parameters are in the sourced federal and Ontario YAML files. The case disables refundable credits,
  so it does not newly lock the known CWB issue.
- **Two adults:** FD $60,000/$30,000 less claims $22,000/$10,000 gives $38,000/$20,000 net.
  With personal credits disabled, federal $8,410 + Ontario $2,929 + health premium $420 = $11,759.
  The second adult's next $100 FD crosses into the 6% health-premium slope: marginal tax `.145 + .0505 + .06`.
- **Fuel:** 20,000 km at 8 L/100 km gives 1,600 L. The 2026 federal 10-cent rate applies for 109/365 days.
  Provincial rates are ON .09, BC .085, QC .192; regional rates are BC .185 and QC .03.
  AB .13 applies 273 days, PE .0847 applies 268 days and NL .075 applies 334 days. The last schedule is an
  announced-policy assumption already marked in year data, not a new legal verification. Zero income and
  credits off isolate fuel in gross/net tax. Adding $2,000 monthly spending and $1,000 property tax adds
  exactly $3,120 sales tax + $1,000, without charging sales tax a second time on fuel.
  The synthetic leap-year helper fixture uses 60 days at .20 and 306 days at .10 over 366 days.
- **Display payroll:** For 2025 incomes $95,000/$40,000, CPP base is $3,356.10 + $1,806.75; enhanced is
  $1,074 + $365, totaling $6,601.85. QPP base is $3,661.20 + $1,971, totaling $7,071.20 with enhancement.
  EI is $1,733.48 outside QC and $1,384.67 in QC; QPIP is $666.90; NT payroll tax is $2,700.
  Ontario health premiums are $750 + $450. These match the 2025 sourced payroll parameters.
- **Display investment parts:** $40,000 ordinary + $10,000 taxable gains + $13,800 grossed-up eligible
  dividends + $11,500 noneligible + $3,000 FD − $19,000 claims − $365 enhanced CPP = $58,935.
  Cash is $83,000. A $20,000 capital loss contributes zero to taxable income, but reduces cash.
  Estimated RRSP room is 18% of employment: $12,345 rounds to $2,222; $500,000 is capped at $32,490.
- **Display FTC:** $50,000 FD in QC, personal credits disabled, yields $7,250 basic federal tax;
  16.5% abatement is $1,196.25. At 50% withholding, federal/provincial credits total
  `$6,053.75 + $7,000 = $13,053.75`, leaving $11,946.25 uncredited. No employment means no worker deduction.
- **Other display totals:** Two-person surtax sums each person's two Ontario surtax bands before dividend
  credits. At ordinary incomes $18,000/$16,000, Ontario reductions exhaust remaining provincial taxes
  $206.800025/$113.465925, totaling $320.26595 before snapshot rounding. At $30,000 ordinary income, LIFT
  exhausts $766.804625 remaining Ontario tax; BC reduction is `562 − (29,735 − 25,020) × .0356 = 394.146`.
  The zero-income parent gets CCB
  $14,745 + Ontario child benefit $3,453.84; net tax is negative $18,198.84 and money left positive $18,198.84.
  Bracket-line expectations use published bracket widths, e.g. federal $60,000 splits into $57,375 and $2,625.

## Childcare extension against `5ad729c`

While this audit was open, the federal deduction and three provincial childcare credits merged into main.
`tests/golden/features/childcare.json` therefore adds 178 cases, 89 per year, without changing any of the
original 98 feature cases. The same runner checks their fixed expected values through `compute`.
The full feature suite now has 276 cases plus one integrity test. The legacy scenarios supply no childcare input.

| Merged feature/program | New golden cases, each run for 2025 and 2026 |
|---|---|
| `federal-childcare`: expenses, pooled annual limits, two-thirds earnings | `published-pooled-example`, `zero-cost-child-pool`, `earnings-cap` |
| Federal age through 16, under-7 cap, DTC and infirmity | `federal-age*`, `federal-infirm17`, `federal-dtc20` |
| Age-derived benefit counts override legacy counts | Federal age cases start with stale `kids=6`, `under6=6` |
| Lower pre-childcare net claimant, RRSP/FHSA and tie election | `lower-net`, `rrsp-fhsa-reselect`, `equal-net-first` |
| Explicit/implicit zero-income spouse | `explicit-spouse`, `implicit-spouse` |
| Missing versus explicit zero earnings | `zero-earnings`, `missing-earnings`, `null-earnings` |
| Manual exception replaces ordinary claims; no excess-expense claim | `manual-replaces-automatic`, `manual-exceeds-expense` |
| Unrelated supporting adults and zero expenses | `unrelated-adults`, `zero-cost-no-earnings-needed` |
| Deduction flow into federal tax base/CCB, separate QC base and zero floor | `deductions-income-benefits`, `independent-income-floors` |
| Declared/allocation mismatch suppresses all relief | `allocation-mismatch-ON/QC/NL` |
| `ontario-care`: started income steps and terminal boundary | Fourteen `on-rate-*` cases, including exact thresholds and one cent above |
| CARE raw addback before each zero floor, allowed-claim expense cap | `on-addback-before-floor`, `on-earnings-cap-toggle-*` |
| CARE unresolved supporting persons | `on-manual-unrelated` |
| `quebec-childcare`: each inclusive rate threshold | Fourteen `qc-rate-*` cases |
| QC base includes worker deduction, excludes federal childcare claim | `qc-independent-*`, `qc-couple-family-base` |
| QC eligibility independent of federal zero/missing earnings | `qc-independent-zero`, `qc-independent-missing` |
| QC missing/zero/partial/invalid eligible portion | `qc-expense-*`; all preserve the federal $8,000 claim |
| QC pooled caps include zero-expense children | `qc-pool-zero-cost-child` |
| QC severe-impairment flag distinct from federal DTC | `qc-dtc22`, `qc-infirm22`, `qc-severe22` |
| QC young/older caps and 2026 age-cutoff change | `qc-young6`, `qc-other7`, `qc-age14/15/16/17` |
| QC unresolved adults and federal/provincial spouse-claimant divergence | `qc-manual-unrelated`, `qc-distinct-spouse-claimants` |
| ON/QC refundable switches | `on-earnings-cap-toggle-*`, `qc-disabled-credit` |
| `nl-childcare`: claim per adult, nonrefundable cap, no transfer | `nl-two-earners`, `nl-no-transfer`, `nl-manual-allocation` |
| NL credit survives both switches and precedes dividend credit | `nl-tax-floor-toggle-*`, `nl-credit-before-dividends` |
| Childcare expense is a separate outflow, not tax/sales/payroll | `expense-is-not-tax-or-sales`, `deductions-income-benefits` |
| Marginal/investment counterfactuals preserve earnings and reselect claimant | `counterfactual-fixed-earnings`, `counterfactual-reselect-claimant` |

### Childcare expected-value evidence

Sources and limitations are recorded in [the childcare verification](childcare/README.md), including cached
T778, the federal folio, ON479-A, Quebec Schedule C/parameter tables and NL428. The new fixture expectations
use those published rules and the following independent arithmetic; they were not captured from engine output.

- The folio's three-child example gives `min(19,000 expenses, 24,000 pooled cap, 30,000 × 2/3) = 19,000`.
  Two 2025/2026 salaries $30,000/$60,000 have $265/$565 enhanced CPP, so family net after the claim is $70,170.
  One young child with $10,000 expenses plus a zero-expense older child gives a $13,000 pool and a $10,000 claim.
  At eligible earnings $9,000, the same ordinary deduction cannot exceed $6,000.
- Federal caps are $8,000 under age 7, $5,000 through age 16 or for an older infirm dependant, and $11,000
  with DTC eligibility. Benefit counts independently use under 18 and under 6. A 20-year-old DTC dependant
  can receive the deduction without becoming a benefit child.
- $70,000 salary less $20,000 RRSP/FHSA and $665 enhanced CPP gives $49,335 pre-childcare net, below the
  other adult's `$60,000 − $565 = $59,435`. The claimant therefore changes to the first adult.
  Verified manual claims $6,000/$4,000 remain those claims even for a 17-year-old with no ordinary annual cap.
- A $60,000 FD income with $9,000 other/RRSP/FHSA deductions and $8,000 childcare gives $43,000 federal net.
  CCB is $7,611.09 in 2025 and $7,823.59 in 2026. Cash stays $60,000, payroll zero and BC sales tax on $2,000
  monthly spending stays $2,880. The separate $9,000 childcare expense is neither payroll nor sales-taxable spending.
- Ontario's $20,000 CARE income gives 75%; one cent above starts the first step and gives 73%. The schedule
  changes from $2,500 steps to $5,000 steps above $40,000, then $3,600 steps above $60,000. At $150,000 the
  rate is 1%, and above it zero. Multiplying a fixed $1,000 claim yields the fixture's fixed $750/$730/etc.
  Raw pre-childcare incomes −$500/$20,000 and verified claims $8,000/$2,000 still give CARE income $20,000,
  so the $10,000 claim generates $7,500. Adding claims back after flooring would incorrectly use $28,000.
  A $6,000 federal claim at $30,000 CARE income gives `6,000 × .67 = 4,020`.
- Quebec young/older/severe caps are $12,275/$6,180/$16,800 for 2025 and $12,525/$6,305/$17,145 for 2026.
  A young child with $20,000 qualifying expenses plus a zero-expense older child has a $18,455/$18,830 pool;
  at 70% the credit is $12,918.50/$13,181. A 22-year-old with federal DTC alone has no QC cap; infirmity gives
  the older cap, and separate severe impairment gives the higher cap. The latter does not establish federal DTC.
- Quebec's $60,000 salary gives federal pre-childcare net $59,435, but provincial taxable/family income is
  `$59,435 − $1,420 = $58,015` in 2025 and `$59,435 − $1,450 = $57,985` in 2026. Federal childcare claims do
  not reduce this provincial base. Attested qualifying costs $10,000 still give $7,000 at zero or missing federal
  eligible earnings. An explicit $3,000 qualifying portion gives $2,100. Missing is incomplete; explicit zero
  is a completed zero credit. Each published rate threshold and one cent above is stored separately.
- Newfoundland and Labrador uses 8.7% per adult: claims $6,000/$4,000 calculate $522/$348. If the second adult
  has no taxable income, only $522 applies and the unused $348 does not transfer. Reallocating a verified $10,000
  claim to the taxable adult gives $870. With basic credits disabled, $10,000 FD minus an $8,000 claim leaves
  $2,000 taxable and $174 provincial tax, so only $174 of the calculated $696 credit applies. Refundable-credit
  settings do not change this. $10,000 eligible dividends gross up to $13,800; after the $8,000 deduction,
  `$5,800 × .087 = $504.60` is consumed by childcare before the dividend credit, which then applies zero.
- Engine `childcare.expenses` records the outflow separately. `total` remains tax net of benefits and
  `breakdown.left` remains cash minus that tax; subtracting childcare spending belongs to the spending/UI layer.
  A zero-income household with a verified zero claim and $12,000 expenses therefore has zero tax and zero
  `breakdown.left`, with `childcare.expenses=12,000`. This does not claim that the expense disappears from a budget.
- Counterfactual specimens use Alberta, personal/refundable credits disabled, and a 20-year-old DTC dependant
  (childcare eligibility without child benefits). FD $30,000/$40,000 with a $6,000 earnings-limited claim leaves
  $64,000 combined taxable income. Both adults stay in the first brackets, so investment tax is
  `64,000 × (.145 + .08) = 14,400` in 2025 or `64,000 × (.14 + .08) = 14,080` in 2026. The next $100 FD
  leaves explicit earnings fixed. With the second adult instead at $30,050, the first adult's $100 bump changes
  the lower-income claimant and raises the claim from $6,000 to $10,000. Combined taxable income falls $3,900:
  the finite-difference marginal rate is −8.775 in 2025 or −8.58 in 2026. This locks the documented discontinuity.

## Limits and pending branches

This maps each implemented feature and program to asserted golden results; it does not claim exhaustive
combinatorial or every-dollar boundary coverage. Existing invariant and published-reference tests remain essential.
Old AB/NL approximations, estimated property rates and policy assumptions remain locked as regressions;
new tests do not endorse those assumptions as accurate tax advice. Known issues #102 (CWB secondary-earner
exemption) and #103 (QC benefit income base) are unchanged and are not used as newly certified expectations.

The original audit excluded then-unmerged childcare PRs #105/#107. The extension above now covers their merged
engine behavior. Childcare UI PR #109, other-income PR #90 and 2023 rule PR #108 remain outside the two audited
bases. New engine inputs/programs need additive goldens before merging under the clarified policy; those branches
cannot rely on this audit or unchanged legacy fixtures. PR #110's 2024 year capture
complements, but does not replace, the historical feature specimens here.

## Verification

The original 98 cases and 178 childcare additions pass, plus the fixture-integrity test. The 2025/2026 golden files,
scenarios,
adapter and snapshot are unchanged. Fifteen intentional mutations were tested in disposable copies of the source:

| Mutation | Legacy goldens | New feature goldens |
|---|---|---|
| Ignore RRSP claims | Pass | Fail |
| Cap FHSA claims at $8,000 | Pass | Fail |
| Omit fuel from total | Fail | Fail |
| Weight fuel periods equally instead of by days | Fail | Fail |
| Ignore dependant income in NS supplement | Pass | Fail |
| Use all MB property tax instead of school share | Pass | Fail |
| Give every MB renter the maximum | Pass | Fail |
| Omit NL additional-child reduction | Pass | Fail |
| Use AB first-child working reduction for every count | Pass | Fail |
| Omit AB positive minimum | Pass | Fail |
| Display zero RRSP room | Pass | Fail |
| Display last person's EI instead of household sum | Pass | Fail |
| Display zero Quebec abatement | Pass | Fail |
| Display last person's provincial reduction only | Pass | Fail |
| Display zero bracket widths | Pass | Fail |

Thirteen mutants surviving the old suite demonstrate actual assertion gaps; the two fuel mutants confirm
existing coverage of fuel totals and day weighting. The combined repository check is recorded in the PR.

The childcare extension adds five disposable-source mutation checks. Each passes the legacy year goldens and
fails the new feature suite: omit zero-expense children from pooled caps; choose the higher-income claimant;
count only completed Ontario income steps; omit the Quebec worker deduction from childcare family income;
and remove the NL remaining-tax limit. No tracked engine file was changed for these checks.

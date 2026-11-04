# Manitoba family tax benefit, issue #145

The ordinary calculation, credit ordering and ledger are implemented for 2025–2026. The supplied $40,000 example
gains $651.672 of credit, reducing Manitoba tax from $1,629.288 to $977.616. Equal-income spouses elect the whole
child claim that minimizes household tax, following the orchestrator's interpretation and #92's tie mechanism.
The Act does not state this tie rule; the interpretation is recorded explicitly here and in both data files.

## Evidence and limits

All sources were read from the existing verification cache, including the Act supplied for this round.
No official publication was fetched in this sandbox.

- [Manitoba Income Tax Act](2025/sources/mb-income-tax-act.txt), PDF pages 53–54, s. 4.6(16.1)–(16.2):
  bases, individual-income taper, eligible-individual condition at any time in the year, and competing claims.
  The cached consolidation is current from July 1 to October 28, 2026; the 2025 schedule independently confirms
  the modeled 2025 amounts and birth-year band. The statute governs eligibility; forms explain its application.
- [2025 MB428-A](138-senior-credit-rules/sources/mb-family-2025.txt): lines 1–3, 9 and 11–12.
  Basic $2,065; claimed dependent spouse or eligible dependant $2,065; qualifying child $2,752.
  Subtract 9% of the claimant's own line 23600 net income; floor the combined base at zero.
- [2025 guide](138-senior-credit-rules/sources/mb-guide-2025.txt): MB428-A lines 5–9 and MB428 lines 58120/58160.
  The ordinary dependent amount requires a claim on line 58120 or 58160, with dependent income below $9,134.
  It does not require that the spouse credit use positive tax capacity.
- [2025 MB428](138-senior-credit-rules/sources/mb-428-2025.txt): benefit base enters line 41/61470, then lines
  51–53 convert it at 10.8%; line 57 joins Part C line 61. Dividend credit is line 62, zero floor line 65,
  foreign tax credit line 73. There is no low-income reduction in this supported Manitoba path.
- [2025 worksheet](138-senior-credit-rules/sources/mb-worksheet-2025.txt): BPA $15,780, phase-out
  $200,000–$400,000, and dividend-credit calculation. These establish capacity separately from benefit entitlement.
- [2025 MB(S2)](138-senior-credit-rules/sources/mb-s2-2025.txt): integration requirements for #17, below.
- [2026 TD1MB](138-senior-credit-rules/sources/td1mb-2026.txt), line 12, directs to
  [TD1MB-WS](138-senior-credit-rules/sources/td1mb-ws-2026.txt), line 12 section. Its lines 1/4/5/7/12 publish
  $2,065 basic/dependent, $2,752 child, and 9% individual-income reduction. TD1MB confirms $15,780/$9,134.
- [2026 T4127](138-senior-credit-rules/sources/t4127-2026.txt): table 8.2 confirms Manitoba 10.8%, 12.75%,
  17.4% and the $47,000/$100,000 thresholds; its BPA formula confirms the $200,000–$400,000 phase-out.
  These were checked against the cached publication separately from arithmetic tests.
- [2025 T1](138-senior-credit-rules/sources/federal-t1-2025.txt) and
  [T2036](2025/sources/t2036-2025.txt): federal credit and provincial FTC inputs in the independent worksheet.
- [Cached CRA CCB guide](2020/sources/provincial-t4114-20.txt), printed pages 6–7: under-18 child, living with
  and caring for the child, residence/status and special-allowance conditions. This older publication supplies
  context for the eligibility assumptions, not proof of every current federal eligibility exception.

The 2026 payroll worksheet prints dependent children "born in 2004 or later". This does not establish the
2026 filing cutoff. The model continues the 2025 birth-year-band mapping provisionally, together with
claimant/exclusion rules and form ordering. The whole program is `estimated: true` in 2026 YAML; the published
amounts and taper are distinguished from those provisional conditions in references, notes and `docs/SCOPE.md`.
CRA's 2026 filing forms publish in January 2027. The continued filing-form rules are not called verified.

## Supported household interpretation

**Eligibility is not an age-only rule.** Section 4.6(16.1)(b) requires the individual **or their spouse** to have
been an eligible individual under federal s. 122.6 in relation to the dependant **at any time in the year**.
It excludes a dependant for whom an eligible-dependant or infirm-dependant amount was claimed. The statute governs;
MB428-A line 9's "born in 2007 or later" and the guide's "18 years of age or younger on December 31, 2025" are
its filing instructions. They do not require the child to remain under 18 at year-end: a child turning 18 can
have qualified earlier in the year. Thus replacing this count with the model's year-end CCB under-18 count would
wrongly exclude ordinary turning-18 cases. Receiving a positive CCB payment is not the statutory test either.

The supported household assumes an eligible parent met the residence/status and care conditions while the child
was under 18 during the year, including for a child whose entered year-end age is 18. This reconciles the form
with the Act without treating age as sufficient evidence. Year-end age cannot establish exact dates or whether
eligibility began only after the eighteenth birthday. Those exceptional cases, custody/competing-parent claims,
newcomer/emigrant proration and foster allowances are unsupported; no eligibility/date inputs are added here.
The guide also requires the child to live with the parent in Canada and excludes competing claims and special
allowances. These remain explicit household assumptions. Entered dependants are assumed to have no income.

Detailed ages come from validated childcare child entries, even with zero childcare expenses. The family benefit
counts through age 18 independently of CCB's under-18 count. Legacy `kids` counts represent qualifying minors.
A single parent's claimed eligible dependant uses the $2,065 component and is excluded from the $2,752 component.
An age-18 child alone receives the child component under these assumptions. The existing eligible-dependant
calculator uses the minor count and does not claim that child; this is a limitation of that existing calculation,
not a legal finding that an eligible-dependant claim could never be made in a turning-18 year. This task does not
expand that separate eligibility model. Disability/infirmity flags on childcare entries create no MB disability claim.

For spouses, s. 4.6(16.2)(a) allows only the person with greater income to claim the same dependant, but says
nothing about equality. **Documented interpretation, not a verified statutory tie rule:** equality permits a
choice between spouses rather than barring both. Following the orchestrator's decision and
[#92](92-claimant-rules.md), the engine compares both whole claims after dividend credits and FTC and selects
the lower household tax. It uses #92's `bestElection` and a shared floating-point income-tie comparison.
Reversing spouse order preserves total tax. The unequal-income rule remains mandatory even if the lower-income
spouse would save more. Grossed-up dividends and deductions, including childcare, enter the income comparison.
Each person retains their own basic component and taper; there is no unused-benefit transfer.

For people who are **not spouses**, s. 4.6(16.2)(b) permits one otherwise eligible person to claim by agreement;
only if they cannot agree does higher income decide. The engine's `spouse: false` input does not identify each
child's parent, whether both adults were eligible individuals, or their agreement. It retains the existing proxy
that the higher-income adult is the eligible parent. That is a modeling assumption, **not** a claim that the Act
always requires the higher-income unrelated adult. Multiple eligible supporting adults and their elections are
unsupported. The unrelated-adults specimen verifies the proxy and single allocation; it does not verify every
arrangement permitted by (16.2)(b).

Turning off personal credits also disables this ordinary non-refundable credit. The refundable-credit switch
does not disable it. These two settings have separate feature cases.

## Preparing senior integration (#17)

No age, pension or disability amount is introduced here. Add qualifying senior terms to the same MB428-A base
before applying its single 9% individual-income reduction and non-refundable capacity limit.
The claimant's age addition is separate from the spouse-age addition.

The spouse-age addition requires a claimed transfer of the spouse's age amount on MB(S2) line 1 **and strict
line 1 > line 11**, per the 2025 guide. A spouse aged 65, a positive generic transfer pool, or line 1 = line 11
does not suffice. MB(S2) line 11 subtracts its specified ordinary bases from tax expressed as a base; compute it
once for the applicable transfer pool. Do not use Manitoba family-benefit capacity as a substitute for MB(S2).
The 2026 filing condition still needs reconciliation when the forms are published.

## Historical inventory

| Years | Cached evidence | Change here |
| --- | --- | --- |
| 2019 | [MB428 line 28/61470](2019/sources/provincial-5007-c.txt) lists the family benefit | None |
| 2020 | [MB428 line 41/61470](2020/sources/provincial-5007-c.txt) lists the family benefit | None |
| 2021 | [MB428 line 41/61470](2021/sources/provincial-5007-c.txt) lists the family benefit | None |
| 2022 | [MB428 line 41/61470](2022/sources/provincial-5007-c.txt) lists the family benefit | None |
| 2023 | [MB428 line 41/61470](2023/sources/provincial-5007-c.txt) lists the family benefit | None |
| 2024 | [MB428 line 41/61470](2024/sources/provincial-5007-c.txt) lists the family benefit | None |
| 2025 | Act, form, schedule and guide above | Ordinary components; documented tie interpretation |
| 2026 | Act and published payroll parameters above | Provisional filing continuation; same tie interpretation |

The older forms establish that omission also needs historical investigation. They do not establish each year's
schedule parameters and claimant conditions. 2019–2024 data and locked goldens remain unchanged; no corrected
historical results are claimed. The program is selected by YAML presence, never an engine year check.

## Independent checks and feature coverage

`tests/mb-family-forms.ts` imports input types only; it reads neither production engine outputs nor runtime YAML.
It computes income and payroll from separately typed constants, evaluates MB428-A, aggregates ordinary credits
on MB428 line 57, then deducts dividends at line 62 and FTC at line 73. It does not take bases from `household()`.
Its 2026 constants initially transcribe the annual parameter set for arithmetic checks; those checks alone do not
prove data correctness. `tests/reference/2026.test.ts` separately pins values checked against cached TD1MB,
TD1MB-WS and T4127. Annual federal/payroll constants repeat the existing claimant audit's parameter set;
the new MB rules and form order are checked against the sources above.

Example: other income $40,000, zero-income spouse, two qualifying minor children.
Base = `2065 + 2065 + 2 × 2752 − .09 × 40000 = 6034`.
Capacity after BPA/spouse = `.108 × (40000 − 15780 − 9134) = 1629.288`.
Credit = `.108 × 6034 = 651.672`; Manitoba tax = `977.616`.
Isolated saving / household income = `651.672 / 40000 × 100 = 1.62918` percentage points.

`tests/golden/features/mb-family-benefit.json` contains 33 specimens in each year, generated from the independent
worksheet rather than production snapshots. The runner checks exact four-decimal values, individual form lines,
reversed spouses, and reconciliation of the provincial ledger and household totals.

| Rule or boundary | Specimen suffixes (both 2025 and 2026) |
| --- | --- |
| Supplied example, implicit spouse | `example`, `implicit-zero-income-spouse` |
| Zero and capped capacity | `zero-capacity`, `capped-capacity`, `basic-capped` |
| Individual taper and exhaustion | `basic-taper`, `basic-taper-last-dollar`, `basic-taper-exhausted` |
| Dependant exclusion | `single-parent-one`, `single-parent-two` |
| Claimed spouse amount > 0, not merely married | `spouse-below-limit`, `spouse-at-limit` |
| Higher net income, deductions and dividend gross-up | `higher-income-child-claim`, `net-income-not-cash` |
| Grossed-up claimant and before-dividend capacity | `dividend-gross-up-claimant`, `dividend-credit-capped` |
| Before-FTC order affects actual tax | `mixed-dividends-foreign` |
| Through age 18, independent of CCB | `child-age-17`, `child-age-18`, `child-age-19` |
| Existing eligible-dependant model | `single-parent-age-18`, `single-parent-mixed-ages` |
| Deduct childcare before claimant selection/taper | `childcare-deduction` |
| No fabricated disability claims | `disability-flags-do-not-create-claims` |
| Personal/refundable switches | `personal-credits-off`, `refund-switch-independent` |
| No duplicate claims for unrelated adults | `unrelated-adults` |
| Equal/adjacent ordinary incomes | `equal-income-spouses`, `near-equal-income-spouses` |
| Tie election after dividends/FTC, binary roundoff | `equal-income-dividend-capacity`, `equal-income-foreign-tax` |
| Strict income priority despite lost tax capacity | `near-equal-dividend-restriction` |
| Family taper fully exhausted | `family-taper-exhausted` |

Negative controls deliberately move the family credit after FTC or allocate children to the lower-income spouse.
Both produce materially different positive household tax; a zero-tax coincidence cannot make them pass.
On ties, forced first-adult claims in the dividend/FTC specimens also lose more than $500 of actual tax savings.
For both years, two $30,000 incomes and two children produce a $4,869 base and $525.852 credit, bringing combined
Manitoba tax from $3,071.52 without this program to $2,545.668. With $20,000 eligible dividends versus $27,600
other income (equal grossed-up net incomes), the other-income spouse claims the $5,085 base/$549.18 credit;
household Manitoba tax is $727.38. Giving the dividend spouse one extra cent makes that spouse the required
claimant, leaving household Manitoba tax $1,276.56. These material differences check both the interpretation
and the statutory unequal-income restriction. The foreign-income tie independently checks allocation after FTC.
The 2,528 legacy checks cover 158 inputs × eight variants × two years: original household, all six $100 marginal
bumps, and investment income removed. Every individual provincial tax, DTC, FTC and family amount is audited.

## Legacy smoke correction

Only two expected chart values change, in `income 28k, 1 child, rent`, for 2026 Manitoba:

| Chart value | Before | After |
| --- | ---: | ---: |
| Net average tax | −19.4% | −19.8% |
| Next employment income | 17.6% | 7.6% |

Independent calculation: employment $28,000 gives enhanced CPP $245, net income $27,755, base CPP $1,212.75
and EI $456.40. Before the family benefit, MB tax is
`.108 × (27755 − 15780 − 9134 − 1212.75 − 456.40) = 126.5598`.
The family base is `2065 + 2065 − .09 × 27755 = 1632.05` (the sole child is the eligible dependant).
Its $176.2614 calculated credit absorbs all $126.5598 remaining tax. At $28,100 employment, net income is
$27,854, CPP $1,217.70 and EI $458.03; old tax is $136.54116, and the $1,623.14 family base again absorbs it.
The corrected marginal rate therefore loses `(136.54116 − 126.5598) / 100 = .0998136`.

Unchanged components in this smoke state: federal tax $0, payroll $1,914.15, sales tax $4,032, CCB $6,883,
federal benefits $1,124 and $2,869, and Manitoba renter credit $625. Their sum, less benefits, is −$5,554.85.
Adding the formerly omitted $126.5598 tax gives the legacy −$5,428.2902; dividing by $28,000 and rounding
gives the average percentages above. Only payroll grows over the $100 step after correction: CPP/EI together
increase $7.58, giving 7.58%, displayed as 7.6%. Adding the old MB increment gives 17.56136%, displayed as 17.6%.
The targeted unit test checks both form calculations independently, and the browser comparison checks the
corrected display values. It first asserts the exact obsolete MB row, replaces only its two numeric strings,
and still compares every other province, column and state. Mobile omits percent signs; desktop retains them.

## Validation

Validation on 2026-11-03:

- Required escalated `fnm exec --using=26 npm run check` passes: lint, typecheck, all 1,245 tests, build and
  Chromium smoke (25 pages, 242 states, 40 contrast scans; no failures). The four previously failing invariant
  cases pass without changes to their assertions. Log: `/private/tmp/145-r2-check.log`.
- The 73 focused family-benefit tests pass, including all 66 feature goldens, the complete independent
  legacy/counterfactual audit, reversed adults, age boundaries and both smoke-state calculations.
- Focused browser ledger assertions pass at 375, 430 and 1280 px in light/dark: the $652 applied credit and
  $978 final tax display for 2025/2026, absence in 2024, and no horizontal overflow. Log:
  `/private/tmp/145-r2-browser.log`; screenshots: `/private/tmp/145-<width>-<theme>.png`.
- `npm run compare -- origin/main` completes all six viewport/theme runs and five states each, against
  `93a5f94fd`. Exit 1 reports three expected text-difference groups: methodology/sources and the corrected
  Manitoba chart values in mobile/desktop formatting. No control-state differences. This comparison retains
  driving, so its average-tax displays are −16.3% → −16.8%; the smoke comparison above disables driving.
  Log: `/private/tmp/145-r2-compare.log`.
- Structural diff against HEAD verifies exactly the numeric leaves below, unchanged fixture inputs/shape and
  no other-province or historical edits. Formatting, documentation lint and `git diff --check` pass.

## Existing golden corrections

Only numeric leaves under Manitoba were patched, after verifying each delta with the independent worksheet.
No scenario inputs, assertions, tolerances, other provinces or older years were replaced.
There was no blanket recapture. The original other-income specimens retain their original carbon/fuel contexts.

| Fixture | Changed scenarios | Changed numeric paths |
| --- | ---: | ---: |
| `2025.json` | 51 | 660 |
| `2026.json` | 51 | 660 |
| `other-income-original.json`, 2025 | 4 (153–156) | 51 |
| `other-income-original.json`, 2026 | 4 (153–156) | 48 |

Total: 1,419 numeric leaves across 110 Manitoba results, plus the two smoke chart values above. Some household
results change only in marginal rates or investment tax because a counterfactual enters benefit eligibility.
Equal-income results incorporate the documented interpretation; no assertion or tolerance is weakened.
Each original provincial tax is checked against an independently calculated return omitting only this program;
each replacement is checked against the corrected worksheet. Aggregate/marginal/investment deltas are derived
from those independent return differences; the 0.0001 comparison allowance only accounts for subtraction of
two already-rounded fixture values. Existing production snapshot assertions and tolerances are unchanged.

The exact path-level before/after inventory follows.

### 2025, scenario 4

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -6103.6634 | -6229.9208 |
| `prov` | 126.2574 | 0 |
| `netTotal` | -9424.7926 | -9551.05 |
| `marg` | 0.1757 | 0.0759 |
| `incomeTax` | 126.2574 | 0 |
| `gross` | 5364.3366 | 5238.0792 |
| `avg` | -0.218 | -0.2225 |
| `grossAvg` | 0.1916 | 0.1871 |
| `margBy.ord` | 0.1757 | 0.0759 |
| `margBy.cg` | 0.054 | 0 |
| `margBy.ed` | 0.0386 | 0 |
| `margBy.nd` | 0.1152 | 0 |
| `margBy.fd` | 0.2531 | 0.15 |
| `people.0.prov` | 126.2574 | 0 |
| `people.0.total` | 2043.2074 | 1916.95 |

### 2025, scenario 5

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -6426.2578 | -6583.2736 |
| `prov` | 325.863 | 168.8472 |
| `netTotal` | -9747.387 | -9904.4028 |
| `marg` | 0.1757 | 0.1853 |
| `incomeTax` | 325.863 | 168.8472 |
| `gross` | 5715.7422 | 5558.7264 |
| `avg` | -0.2142 | -0.2194 |
| `grossAvg` | 0.1905 | 0.1853 |
| `margBy.ord` | 0.1757 | 0.1853 |
| `margBy.cg` | 0.054 | 0.0589 |
| `margBy.ed` | 0.0386 | 0.0521 |
| `margBy.nd` | 0.1152 | 0.1264 |
| `margBy.fd` | 0.2467 | 0.2617 |
| `people.0.prov` | 325.863 | 168.8472 |
| `people.0.total` | 2394.613 | 2237.5972 |

### 2025, scenario 6

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -36430.0321 | -37928.7859 |
| `prov` | 1822.905 | 324.1512 |
| `netTotal` | -39751.1612 | -41249.915 |
| `marg` | 0.6859 | 0.6955 |
| `incomeTax` | 2992.1488 | 1493.395 |
| `gross` | 9520.5279 | 8021.7741 |
| `avg` | -0.8096 | -0.8429 |
| `grossAvg` | 0.2116 | 0.1783 |
| `margBy.ord` | 0.6859 | 0.6955 |
| `margBy.cg` | 0.3165 | 0.3214 |
| `margBy.ed` | 0.5559 | 0.5693 |
| `margBy.nd` | 0.6151 | 0.6263 |
| `margBy.fd` | 0.7155 | 0.7587 |
| `people.0.prov` | 1822.905 | 324.1512 |
| `people.0.total` | 6199.3988 | 4700.645 |

### 2025, scenario 7

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -18405.1901 | -19759.6019 |
| `prov` | 3562.4295 | 2208.0177 |
| `netTotal` | -21726.3192 | -23080.7311 |
| `marg` | 0.6656 | 0.6752 |
| `incomeTax` | 6865.1908 | 5510.779 |
| `gross` | 14532.0699 | 13177.6581 |
| `avg` | -0.3068 | -0.3293 |
| `grossAvg` | 0.2422 | 0.2196 |
| `margBy.ord` | 0.6656 | 0.6752 |
| `margBy.cg` | 0.3063 | 0.3111 |
| `margBy.ed` | 0.5276 | 0.541 |
| `margBy.nd` | 0.5915 | 0.6027 |
| `margBy.fd` | 0.6466 | 0.6791 |
| `people.0.prov` | 3562.4295 | 2208.0177 |
| `people.0.total` | 11210.9408 | 9856.529 |

### 2025, scenario 8

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 41677.3097 | 41580.829 |
| `prov` | 12715.2367 | 12618.756 |
| `netTotal` | 34756.1805 | 34659.6998 |
| `marg` | 0.4139 | 0.4233 |
| `incomeTax` | 29851.8385 | 29755.3578 |
| `gross` | 47292.1277 | 47195.647 |
| `avg` | 0.2778 | 0.2772 |
| `grossAvg` | 0.3153 | 0.3146 |
| `margBy.ord` | 0.4139 | 0.4233 |
| `margBy.cg` | 0.1947 | 0.1996 |
| `margBy.ed` | 0.2198 | 0.2333 |
| `margBy.nd` | 0.3351 | 0.3462 |
| `margBy.fd` | 0.3895 | 0.3992 |
| `people.0.prov` | 6357.6184 | 6261.1376 |
| `people.0.total` | 20185.4993 | 20089.0185 |

### 2025, scenario 10

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -7588.5431 | -8068.8569 |
| `prov` | 1811.349 | 1331.0352 |
| `netTotal` | -10909.6722 | -11389.986 |
| `marg` | 0.5918 | 0.6015 |
| `incomeTax` | 3081.2228 | 2600.909 |
| `gross` | 9401.3519 | 8921.0381 |
| `avg` | -0.1686 | -0.1793 |
| `grossAvg` | 0.2089 | 0.1982 |
| `margBy.ord` | 0.5918 | 0.6015 |
| `margBy.cg` | 0.269 | 0.2739 |
| `margBy.ed` | 0.4248 | 0.4382 |
| `margBy.nd` | 0.5058 | 0.517 |
| `margBy.fd` | 0.5987 | 0.6222 |
| `people.0.prov` | 1811.349 | 1331.0352 |
| `people.0.total` | 5529.4728 | 5049.159 |

### 2025, scenario 11

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 24328.5504 | 24146.8231 |
| `prov` | 11957.0854 | 11775.3581 |
| `netTotal` | 21007.4213 | 20825.694 |
| `marg` | 0.514 | 0.5237 |
| `incomeTax` | 27590.5213 | 27408.794 |
| `gross` | 36419.2304 | 36237.5031 |
| `avg` | 0.2027 | 0.2012 |
| `grossAvg` | 0.3035 | 0.302 |
| `margBy.ord` | 0.514 | 0.5237 |
| `margBy.cg` | 0.257 | 0.2619 |
| `margBy.ed` | 0.3916 | 0.4051 |
| `margBy.nd` | 0.4782 | 0.4894 |
| `margBy.fd` | 0.514 | 0.5237 |
| `people.0.prov` | 11957.0854 | 11775.3581 |
| `people.0.total` | 33098.1013 | 32916.374 |

### 2025, scenario 23

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -7780.2578 | -8106.1208 |
| `prov` | 325.863 | 0 |
| `netTotal` | -11101.387 | -11427.25 |
| `marg` | 0.1757 | 0.0759 |
| `incomeTax` | 325.863 | 0 |
| `gross` | 5715.7422 | 5389.8792 |
| `avg` | -0.2593 | -0.2702 |
| `grossAvg` | 0.1905 | 0.1797 |
| `margBy.ord` | 0.1757 | 0.0759 |
| `margBy.cg` | 0.054 | 0 |
| `margBy.ed` | 0.0386 | 0 |
| `margBy.nd` | 0.1152 | 0 |
| `margBy.fd` | 0.2467 | 0.15 |
| `people.0.prov` | 325.863 | 0 |
| `people.0.total` | 2394.613 | 2068.75 |

### 2025, scenario 26

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 1817.667 | 1806.6888 |
| `prov` | 513.9126 | 502.9344 |
| `netTotal` | -639.4622 | -650.4404 |
| `marg` | 0.3097 | 0.3193 |
| `incomeTax` | 939.9878 | 929.0096 |
| `gross` | 4858.667 | 4847.6888 |
| `avg` | 0.0826 | 0.0821 |
| `grossAvg` | 0.2208 | 0.2203 |
| `margBy.ord` | 0.3097 | 0.3193 |
| `margBy.cg` | 0.1265 | 0.1314 |
| `margBy.ed` | 0.0315 | 0.0449 |
| `margBy.nd` | 0.1781 | 0.1893 |
| `margBy.fd` | 0.359 | 0.3691 |
| `people.0.prov` | 513.9126 | 502.9344 |
| `people.0.total` | 2401.5378 | 2390.5596 |

### 2025, scenario 36

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -27422.3214 | -28405.0836 |
| `prov` | 1042.9586 | 60.1964 |
| `netTotal` | -30352.0914 | -31334.8536 |
| `marg` | 0.3242 | 0.3338 |
| `invTax` | 1924.3586 | 941.5964 |
| `incomeTax` | 1042.9586 | 60.1964 |
| `gross` | 5434.2786 | 4451.5164 |
| `avg` | -0.7216 | -0.7475 |
| `grossAvg` | 0.143 | 0.1171 |
| `margBy.ord` | 0.3242 | 0.3338 |
| `margBy.cg` | 0.129 | 0.1339 |
| `margBy.ed` | 0.2456 | 0.2591 |
| `margBy.nd` | 0.2877 | 0.2989 |
| `margBy.fd` | 0.258 | 0.2677 |
| `people.0.prov` | 1042.9586 | 60.1964 |
| `people.0.total` | 2504.5086 | 1521.7464 |

### 2025, scenario 37

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -11352.4291 | -12363.1147 |
| `prov` | 2959.74 | 1949.0544 |
| `netTotal` | -15456.545 | -16467.2306 |
| `marg` | 0.7354 | 0.745 |
| `incomeTax` | 6405.665 | 5394.9794 |
| `gross` | 16544.7809 | 15534.0953 |
| `avg` | -0.1336 | -0.1454 |
| `grossAvg` | 0.1946 | 0.1828 |
| `margBy.ord` | 0.7354 | 0.745 |
| `margBy.cg` | 0.3415 | 0.3464 |
| `margBy.ed` | 0.6249 | 0.6383 |
| `margBy.nd` | 0.6726 | 0.6838 |
| `margBy.fd` | 0.7999 | 0.8338 |
| `people.0.prov` | 490.7574 | 487.944 |
| `people.0.total` | 3561.6946 | 3558.8812 |
| `people.1.prov` | 2468.9826 | 1461.1104 |
| `people.1.total` | 8878.9704 | 7871.0981 |

### 2025, scenario 39

| Path | Before | After |
| --- | ---: | ---: |
| `invTax` | 56125.38 | 56951.0238 |

### 2025, scenario 40

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -33148.8016 | -34551.3274 |
| `prov` | 2966.8905 | 1564.3647 |
| `netTotal` | -34885.9307 | -36288.4565 |
| `marg` | 0.6062 | 0.6158 |
| `incomeTax` | 5476.0793 | 4073.5535 |
| `gross` | 11179.4584 | 9776.9326 |
| `avg` | -0.6027 | -0.6282 |
| `grossAvg` | 0.2033 | 0.1778 |
| `margBy.ord` | 0.6062 | 0.6158 |
| `margBy.cg` | 0.2763 | 0.2811 |
| `margBy.ed` | 0.4448 | 0.4582 |
| `margBy.nd` | 0.5225 | 0.5337 |
| `margBy.fd` | 0.6017 | 0.6371 |
| `people.0.prov` | 2966.8905 | 1564.3647 |
| `people.0.total` | 9442.3293 | 8039.8035 |

### 2025, scenario 49

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -3919.9275 | -4227.7545 |
| `prov` | 4270.1256 | 3962.2986 |
| `netTotal` | -9729.6975 | -10037.5245 |
| `marg` | 0.5765 | 0.5861 |
| `invTax` | 12799.7525 | 12491.9255 |
| `incomeTax` | 5601.0325 | 5293.2055 |
| `gross` | 12872.3525 | 12564.5255 |
| `avg` | -0.0568 | -0.0613 |
| `grossAvg` | 0.1866 | 0.1821 |
| `margBy.ord` | 0.5765 | 0.5861 |
| `margBy.cg` | 0.2613 | 0.2661 |
| `margBy.ed` | 0.4034 | 0.4168 |
| `margBy.nd` | 0.488 | 0.4992 |
| `margBy.fd` | 0.5225 | 0.5322 |
| `people.0.prov` | 4270.1256 | 3962.2986 |
| `people.0.total` | 7062.5825 | 6754.7555 |

### 2025, scenario 55

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 30901.2715 | 30783.3075 |
| `prov` | 11773.7254 | 11655.7613 |
| `netTotal` | 17230.1424 | 17112.1783 |
| `marg` | 0.529 | 0.5387 |
| `invTax` | 15730.4001 | 16134.3633 |
| `incomeTax` | 26625.4824 | 26507.5183 |
| `gross` | 45804.1915 | 45686.2275 |
| `avg` | 0.2102 | 0.2094 |
| `grossAvg` | 0.3116 | 0.3108 |
| `margBy.ord` | 0.529 | 0.5387 |
| `margBy.cg` | 0.2645 | 0.2694 |
| `margBy.ed` | 0.4123 | 0.4258 |
| `margBy.nd` | 0.4955 | 0.5067 |
| `margBy.fd` | 0.529 | 0.5387 |
| `people.0.prov` | 11773.7254 | 11655.7613 |
| `people.0.total` | 32133.0624 | 32015.0983 |

### 2025, scenario 60

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -1463.7902 | -1850.3708 |
| `prov` | 386.5806 | 0 |
| `netTotal` | -10544.9194 | -10931.5 |
| `marg` | 0.1828 | 0.0759 |
| `incomeTax` | 386.5806 | 0 |
| `gross` | 11328.2098 | 10941.6292 |
| `avg` | -0.0488 | -0.0617 |
| `grossAvg` | 0.3776 | 0.3647 |
| `margBy.ord` | 0.1828 | 0.0759 |
| `margBy.cg` | 0.054 | 0 |
| `margBy.ed` | 0.149 | 0 |
| `margBy.nd` | 0.1242 | 0 |
| `margBy.fd` | 0.258 | 0.15 |
| `people.0.prov` | 386.5806 | 0 |
| `people.0.total` | 1848.1306 | 1461.55 |

### 2025, scenario 61

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 11091.9323 | 10706.1509 |
| `prov` | 4519.3657 | 4133.5843 |
| `netTotal` | 2402.1623 | 2016.3809 |
| `marg` | 0.5098 | 0.5194 |
| `incomeTax` | 9374.7523 | 8988.9709 |
| `gross` | 22979.7523 | 22593.9709 |
| `avg` | 0.1631 | 0.1574 |
| `grossAvg` | 0.3379 | 0.3323 |
| `margBy.ord` | 0.5098 | 0.5194 |
| `margBy.cg` | 0.2338 | 0.2386 |
| `margBy.ed` | 0.3275 | 0.3409 |
| `margBy.nd` | 0.4248 | 0.4359 |
| `margBy.fd` | 0.478 | 0.4935 |
| `people.0.prov` | 4519.3657 | 4133.5843 |
| `people.0.total` | 14289.9823 | 13904.2009 |

### 2025, scenario 63

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -3646.8651 | -3860.5269 |
| `prov` | 2966.8905 | 2753.2287 |
| `netTotal` | -5974.7407 | -6188.4025 |
| `marg` | 0.5122 | 0.5218 |
| `incomeTax` | 5476.0793 | 5262.4175 |
| `gross` | 11770.2049 | 11556.5431 |
| `avg` | -0.0663 | -0.0702 |
| `grossAvg` | 0.214 | 0.2101 |
| `margBy.ord` | 0.5122 | 0.5218 |
| `margBy.cg` | 0.2288 | 0.2336 |
| `margBy.ed` | 0.3137 | 0.3271 |
| `margBy.nd` | 0.4133 | 0.4244 |
| `margBy.fd` | 0.4575 | 0.4672 |
| `people.0.prov` | 2966.8905 | 2753.2287 |
| `people.0.total` | 9442.3293 | 9228.6675 |

### 2025, scenario 64

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -889.6077 | -1572.6051 |
| `prov` | 4519.3657 | 3836.3683 |
| `netTotal` | -9579.3777 | -10262.3751 |
| `marg` | 0.6039 | 0.6135 |
| `incomeTax` | 9374.7523 | 8691.7549 |
| `gross` | 22979.7523 | 22296.7549 |
| `avg` | -0.0131 | -0.0231 |
| `grossAvg` | 0.3379 | 0.3279 |
| `margBy.ord` | 0.6039 | 0.6135 |
| `margBy.cg` | 0.2813 | 0.2861 |
| `margBy.ed` | 0.4586 | 0.472 |
| `margBy.nd` | 0.534 | 0.5452 |
| `margBy.fd` | 0.673 | 0.6929 |
| `people.0.prov` | 4519.3657 | 3836.3683 |
| `people.0.total` | 14289.9823 | 13606.9849 |

### 2025, scenario 65

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 15642.8114 | 15266.6841 |
| `prov` | 8527.0264 | 8150.8991 |
| `netTotal` | 12321.6823 | 11945.555 |
| `marg` | 0.4125 | 0.4222 |
| `incomeTax` | 19830.7823 | 19454.655 |
| `gross` | 28659.4914 | 28283.3641 |
| `avg` | 0.1564 | 0.1527 |
| `grossAvg` | 0.2866 | 0.2828 |
| `margBy.ord` | 0.4125 | 0.4222 |
| `margBy.cg` | 0.2063 | 0.2111 |
| `margBy.ed` | 0.2516 | 0.265 |
| `margBy.nd` | 0.3615 | 0.3727 |
| `margBy.fd` | 0.4125 | 0.4222 |
| `people.0.prov` | 8527.0264 | 8150.8991 |
| `people.0.total` | 25338.3623 | 24962.235 |

### 2025, scenario 66

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -6020.2477 | -6636.9645 |
| `prov` | 5371.1464 | 4754.4296 |
| `netTotal` | -7366.0177 | -7982.7345 |
| `marg` | 0.5935 | 0.6028 |
| `incomeTax` | 11600.7423 | 10984.0255 |
| `gross` | 18206.0923 | 17589.3755 |
| `avg` | -0.0803 | -0.0885 |
| `grossAvg` | 0.2427 | 0.2345 |
| `margBy.ord` | 0.5935 | 0.6028 |
| `margBy.cg` | 0.2947 | 0.2996 |
| `margBy.ed` | 0.4721 | 0.4855 |
| `margBy.nd` | 0.5475 | 0.5587 |
| `margBy.fd` | 0.576 | 0.5857 |
| `people.0.prov` | 5371.1464 | 4754.4296 |
| `people.0.total` | 16860.3223 | 16243.6055 |

### 2025, scenario 69

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 31083.6505 | 30392.7378 |
| `prov` | 7669.9534 | 6979.0406 |
| `netTotal` | 9037.8805 | 8346.9678 |
| `marg` | 0.4504 | 0.4597 |
| `incomeTax` | 17736.2855 | 17045.3728 |
| `gross` | 47110.3855 | 46419.4728 |
| `avg` | 0.296 | 0.2895 |
| `grossAvg` | 0.4487 | 0.4421 |
| `margBy.ord` | 0.4504 | 0.4597 |
| `margBy.cg` | 0.2138 | 0.2186 |
| `margBy.ed` | 0.2723 | 0.2857 |
| `margBy.nd` | 0.3788 | 0.3899 |
| `margBy.fd` | 0.4275 | 0.4372 |
| `people.0.prov` | 6357.6184 | 5666.7056 |
| `people.0.total` | 20185.4993 | 19494.5865 |

### 2025, scenario 70

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 819.0745 | 454.2343 |
| `prov` | 3008.9826 | 2644.1424 |
| `netTotal` | -2502.0546 | -2866.8948 |
| `incomeTax` | 6604.5403 | 6239.7001 |
| `gross` | 14214.9695 | 13850.1293 |
| `avg` | 0.0132 | 0.0073 |
| `grossAvg` | 0.2293 | 0.2234 |
| `people.0.prov` | 3008.9826 | 2644.1424 |
| `people.0.total` | 9963.5903 | 9598.7502 |

### 2025, scenario 76

| Path | Before | After |
| --- | ---: | ---: |
| `invTax` | 32379.565 | 32766.9242 |

### 2025, scenario 79

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -21384.617 | -21710.48 |
| `prov` | 325.863 | 0 |
| `netTotal` | -23162.387 | -23488.25 |
| `marg` | 0.1757 | 0.0759 |
| `incomeTax` | 325.863 | 0 |
| `gross` | 4172.383 | 3846.52 |
| `avg` | -0.7128 | -0.7237 |
| `grossAvg` | 0.1391 | 0.1282 |
| `margBy.ord` | 0.1757 | 0.0759 |
| `margBy.cg` | 0.054 | 0 |
| `margBy.ed` | 0.0386 | 0 |
| `margBy.nd` | 0.1152 | 0 |
| `margBy.fd` | 0.2467 | 0.15 |
| `people.0.prov` | 325.863 | 0 |
| `people.0.total` | 2394.613 | 2068.75 |

### 2025, scenario 80

| Path | Before | After |
| --- | ---: | ---: |
| `people.0.pDtc` | 4088.0739 | 2448.3045 |

### 2025, scenario 83

| Path | Before | After |
| --- | ---: | ---: |
| `invTax` | 43058.1847 | 43069.1629 |

### 2025, scenario 89

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 4713.1809 | 3830.8911 |
| `prov` | 5524.1199 | 4641.8301 |
| `netTotal` | -3508.5891 | -4390.8789 |
| `marg` | 0.4231 | 0.4327 |
| `incomeTax` | 12217.0009 | 11334.7111 |
| `gross` | 27080.9709 | 26198.6811 |
| `avg` | 0.0507 | 0.0412 |
| `grossAvg` | 0.2912 | 0.2817 |
| `margBy.ord` | 0.4231 | 0.4327 |
| `margBy.cg` | 0.1838 | 0.1886 |
| `margBy.ed` | 0.1895 | 0.2029 |
| `margBy.nd` | 0.3098 | 0.3209 |
| `margBy.fd` | 0.3675 | 0.3816 |
| `people.0.prov` | 3953.3625 | 3071.0727 |
| `people.0.total` | 12767.5063 | 11885.2165 |

### 2025, scenario 97

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 7737.7513 | 7609.1179 |
| `prov` | 584.2854 | 455.652 |
| `netTotal` | -398.3646 | -526.998 |
| `marg` | 0.3242 | 0.3338 |
| `incomeTax` | 584.2854 | 455.652 |
| `gross` | 11396.3513 | 11267.7179 |
| `avg` | 0.2036 | 0.2002 |
| `grossAvg` | 0.2999 | 0.2965 |
| `margBy.ord` | 0.3242 | 0.3338 |
| `margBy.cg` | 0.129 | 0.1339 |
| `margBy.ed` | 0.2456 | 0.2591 |
| `margBy.nd` | 0.2877 | 0.2989 |
| `margBy.fd` | 0.3898 | 0.4034 |
| `people.0.prov` | 584.2854 | 455.652 |
| `people.0.total` | 3260.2354 | 3131.602 |

### 2025, scenario 98

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -9541.4933 | -10774.9235 |
| `prov` | 5972.5377 | 4739.1075 |
| `netTotal` | -13741.3689 | -14974.7991 |
| `marg` | 0.4825 | 0.4921 |
| `invTax` | 11727.7829 | 12059.0351 |
| `incomeTax` | 11578.5211 | 10345.0909 |
| `gross` | 20598.9967 | 19365.5665 |
| `avg` | -0.0837 | -0.0945 |
| `grossAvg` | 0.1807 | 0.1699 |
| `margBy.ord` | 0.4825 | 0.4921 |
| `margBy.cg` | 0.2138 | 0.2186 |
| `margBy.ed` | 0.2723 | 0.2857 |
| `margBy.nd` | 0.3788 | 0.3899 |
| `margBy.fd` | 0.5169 | 0.5421 |
| `people.0.prov` | 2963.5551 | 1730.1249 |
| `people.0.total` | 6255.1508 | 5021.7206 |

### 2025, scenario 99

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -36127.617 | -36453.48 |
| `prov` | 325.863 | 0 |
| `netTotal` | -43089.387 | -43415.25 |
| `marg` | 0.1757 | 0.0759 |
| `incomeTax` | 325.863 | 0 |
| `gross` | 9356.383 | 9030.52 |
| `avg` | -1.2043 | -1.2151 |
| `grossAvg` | 0.3119 | 0.301 |
| `margBy.ord` | 0.1757 | 0.0759 |
| `margBy.cg` | 0.054 | 0 |
| `margBy.ed` | 0.0386 | 0 |
| `margBy.nd` | 0.1152 | 0 |
| `margBy.fd` | 0.2467 | 0.15 |
| `people.0.prov` | 325.863 | 0 |
| `people.0.total` | 2394.613 | 2068.75 |

### 2025, scenario 101

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -4271.9607 | -4883.0615 |
| `prov` | 1601.2534 | 990.1526 |
| `netTotal` | -15373.7307 | -15984.8315 |
| `marg` | 0.6093 | 0.6186 |
| `incomeTax` | 2472.9093 | 1861.8085 |
| `gross` | 18834.2593 | 18223.1585 |
| `avg` | -0.057 | -0.0651 |
| `grossAvg` | 0.2511 | 0.243 |
| `margBy.ord` | 0.6093 | 0.6186 |
| `margBy.cg` | 0.2965 | 0.3014 |
| `margBy.ed` | 0.5007 | 0.5141 |
| `margBy.nd` | 0.5691 | 0.5803 |
| `margBy.fd` | 0.6866 | 0.7101 |
| `people.0.prov` | 1601.2534 | 990.1526 |
| `people.0.total` | 7732.4893 | 7121.3885 |

### 2025, scenario 103

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -2078.4467 | -2158.4801 |
| `prov` | 1124.2854 | 1044.252 |
| `netTotal` | -8546.3223 | -8626.3557 |
| `marg` | 0.5275 | 0.5371 |
| `incomeTax` | 1355.5676 | 1275.5342 |
| `gross` | 10499.3933 | 10419.3599 |
| `avg` | -0.0547 | -0.0568 |
| `grossAvg` | 0.2763 | 0.2742 |
| `margBy.ord` | 0.5275 | 0.5371 |
| `margBy.cg` | 0.2365 | 0.2414 |
| `margBy.ed` | 0.3351 | 0.3485 |
| `margBy.nd` | 0.4311 | 0.4423 |
| `margBy.fd` | 0.6864 | 0.6982 |
| `people.0.prov` | 1124.2854 | 1044.252 |
| `people.0.total` | 4031.5176 | 3951.4842 |

### 2025, scenario 107

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 15579.1182 | 15113.8174 |
| `prov` | 3458.6464 | 2993.3456 |
| `netTotal` | -10664.9977 | -11130.2985 |
| `marg` | 0.5896 | 0.5989 |
| `incomeTax` | 6613.2423 | 6147.9415 |
| `gross` | 38116.9382 | 37651.6374 |
| `avg` | 0.2077 | 0.2015 |
| `grossAvg` | 0.5082 | 0.502 |
| `margBy.ord` | 0.5896 | 0.5989 |
| `margBy.cg` | 0.2863 | 0.2911 |
| `margBy.ed` | 0.4724 | 0.4858 |
| `margBy.nd` | 0.5455 | 0.5567 |
| `margBy.fd` | 0.6104 | 0.6279 |
| `people.0.prov` | 3458.6464 | 2993.3456 |
| `people.0.total` | 11872.8223 | 11407.5215 |

### 2025, scenario 114

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 8734.3246 | 8661.5578 |
| `prov` | 8000.644 | 7927.8773 |
| `netTotal` | 6956.5546 | 6883.7878 |
| `marg` | 0.4631 | 0.4724 |
| `invTax` | 21154.9412 | 21670.0347 |
| `incomeTax` | 16581.2646 | 16508.4978 |
| `gross` | 21718.0846 | 21645.3178 |
| `avg` | 0.0816 | 0.0809 |
| `grossAvg` | 0.203 | 0.2023 |
| `margBy.ord` | 0.4631 | 0.4724 |
| `margBy.cg` | 0.2037 | 0.2084 |
| `margBy.ed` | 0.2542 | 0.2671 |
| `margBy.nd` | 0.3591 | 0.3699 |
| `margBy.fd` | 0.4929 | 0.5031 |
| `people.0.pFtc` | 249.1766 | 246.9103 |
| `people.0.prov` | 8000.644 | 7927.8773 |
| `people.0.total` | 19940.3146 | 19867.5478 |

### 2025, scenario 116

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -17329.1007 | -18969.4101 |
| `prov` | 4221.5148 | 2581.2054 |
| `netTotal` | -23858.8707 | -25499.1801 |
| `marg` | 0.5869 | 0.5965 |
| `incomeTax` | 9361.4893 | 7721.1799 |
| `gross` | 21243.1593 | 19602.8499 |
| `avg` | -0.228 | -0.2496 |
| `grossAvg` | 0.2795 | 0.2579 |
| `margBy.ord` | 0.5869 | 0.5965 |
| `margBy.cg` | 0.2665 | 0.2714 |
| `margBy.ed` | 0.4179 | 0.4313 |
| `margBy.nd` | 0.5001 | 0.5113 |
| `margBy.fd` | 0.6584 | 0.7115 |
| `people.0.prov` | 2110.7574 | 470.448 |
| `people.0.total` | 7356.6947 | 5716.3852 |

### 2025, scenario 117

| Path | Before | After |
| --- | ---: | ---: |
| `invTax` | 22321.9892 | 22332.9674 |

### 2025, scenario 119

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -22155.617 | -22481.48 |
| `prov` | 325.863 | 0 |
| `netTotal` | -25085.387 | -25411.25 |
| `marg` | 0.1757 | 0.0759 |
| `incomeTax` | 325.863 | 0 |
| `gross` | 5324.383 | 4998.52 |
| `avg` | -0.7385 | -0.7494 |
| `grossAvg` | 0.1775 | 0.1666 |
| `margBy.ord` | 0.1757 | 0.0759 |
| `margBy.cg` | 0.054 | 0 |
| `margBy.ed` | 0.0386 | 0 |
| `margBy.nd` | 0.1152 | 0 |
| `margBy.fd` | 0.108 | 0 |
| `people.0.prov` | 325.863 | 0 |
| `people.0.total` | 2394.613 | 2068.75 |

### 2025, scenario 121

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -22423.6723 | -23395.3537 |
| `prov` | 1124.2854 | 152.604 |
| `netTotal` | -31113.4423 | -32085.1237 |
| `marg` | 0.6859 | 0.6955 |
| `incomeTax` | 1355.5676 | 383.8862 |
| `gross` | 12721.2877 | 11749.6063 |
| `avg` | -0.5901 | -0.6157 |
| `grossAvg` | 0.3348 | 0.3092 |
| `margBy.ord` | 0.6859 | 0.6955 |
| `margBy.cg` | 0.3165 | 0.3214 |
| `margBy.ed` | 0.5559 | 0.5693 |
| `margBy.nd` | 0.6151 | 0.6263 |
| `margBy.fd` | 0.7464 | 0.7819 |
| `people.0.prov` | 1124.2854 | 152.604 |
| `people.0.total` | 4031.5176 | 3059.8362 |

### 2025, scenario 123

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 28796.9987 | 28045.4213 |
| `prov` | 3181.2502 | 2429.6728 |
| `netTotal` | -710.8769 | -1462.4543 |
| `incomeTax` | 6924.5731 | 6172.9957 |
| `gross` | 43416.4287 | 42664.8513 |
| `avg` | 0.2938 | 0.2862 |
| `grossAvg` | 0.443 | 0.4354 |
| `people.1.prov` | 1868.9152 | 1117.3378 |
| `people.1.total` | 9029.4368 | 8277.8594 |

### 2025, scenario 124

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 13155.3079 | 13144.3297 |
| `prov` | 513.9126 | 502.9344 |
| `netTotal` | -1564.4622 | -1575.4404 |
| `marg` | 0.3097 | 0.3193 |
| `incomeTax` | 939.9878 | 929.0096 |
| `gross` | 17121.3079 | 17110.3297 |
| `avg` | 0.598 | 0.5975 |
| `grossAvg` | 0.7782 | 0.7777 |
| `margBy.ord` | 0.3097 | 0.3193 |
| `margBy.cg` | 0.1265 | 0.1314 |
| `margBy.ed` | 0.0315 | 0.0449 |
| `margBy.nd` | 0.1781 | 0.1893 |
| `margBy.fd` | 0.359 | 0.3691 |
| `people.0.prov` | 513.9126 | 502.9344 |
| `people.0.total` | 2401.5378 | 2390.5596 |

### 2025, scenario 126

| Path | Before | After |
| --- | ---: | ---: |
| `invTax` | 17648.3682 | 17830.0954 |

### 2025, scenario 127

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 7592.4187 | 7302.7681 |
| `prov` | 4353.484 | 4063.8334 |
| `netTotal` | 2336.3028 | 2046.6522 |
| `marg` | 0.5765 | 0.5861 |
| `invTax` | 11885.1535 | 12106.3807 |
| `incomeTax` | 12235.0328 | 11945.3822 |
| `gross` | 21457.3987 | 21167.7481 |
| `avg` | 0.0986 | 0.0948 |
| `grossAvg` | 0.2787 | 0.2749 |
| `margBy.ord` | 0.5765 | 0.5861 |
| `margBy.cg` | 0.2613 | 0.2661 |
| `margBy.ed` | 0.4034 | 0.4168 |
| `margBy.nd` | 0.488 | 0.4992 |
| `margBy.fd` | 0.5225 | 0.5322 |
| `people.0.prov` | 4353.484 | 4063.8334 |
| `people.0.total` | 16201.2828 | 15911.6322 |

### 2025, scenario 128

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 9673.229 | 9382.5848 |
| `prov` | 2022.5106 | 1731.8664 |
| `netTotal` | -2572.6466 | -2863.2908 |
| `marg` | 0.577 | 0.5866 |
| `incomeTax` | 3459.7434 | 3169.0991 |
| `gross` | 19064.669 | 18774.0248 |
| `avg` | 0.2058 | 0.1996 |
| `grossAvg` | 0.4056 | 0.3994 |
| `margBy.ord` | 0.577 | 0.5866 |
| `margBy.cg` | 0.2615 | 0.2664 |
| `margBy.ed` | 0.4041 | 0.4175 |
| `margBy.nd` | 0.4886 | 0.4998 |
| `margBy.fd` | 0.6983 | 0.7142 |
| `people.0.prov` | 2022.5106 | 1731.8664 |
| `people.0.total` | 6818.7934 | 6528.1491 |

### 2025, scenario 133

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -18800.073 | -20254.05 |
| `prov` | 4087.8501 | 2633.8731 |
| `netTotal` | -21991.9486 | -23445.9256 |
| `marg` | 0.6062 | 0.6158 |
| `invTax` | 17975.953 | 17783.6266 |
| `incomeTax` | 8586.9114 | 7132.9344 |
| `gross` | 15536.787 | 14082.81 |
| `avg` | -0.2161 | -0.2328 |
| `grossAvg` | 0.1786 | 0.1619 |
| `margBy.ord` | 0.6062 | 0.6158 |
| `margBy.cg` | 0.2763 | 0.2811 |
| `margBy.ed` | 0.4448 | 0.4582 |
| `margBy.nd` | 0.5225 | 0.5337 |
| `margBy.fd` | 0.5525 | 0.5622 |
| `people.1.prov` | 4087.8501 | 2633.8731 |
| `people.1.total` | 11945.9614 | 10491.9844 |

### 2025, scenario 134

| Path | Before | After |
| --- | ---: | ---: |
| `invTax` | 5372.9192 | 5383.8974 |

### 2025, scenario 136

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -10023.4877 | -11139.847 |
| `prov` | 6614.5264 | 5498.1671 |
| `netTotal` | -14393.2577 | -15509.617 |
| `marg` | 0.4275 | 0.4372 |
| `incomeTax` | 14843.2823 | 13726.923 |
| `gross` | 24720.6323 | 23604.273 |
| `avg` | -0.1179 | -0.1311 |
| `grossAvg` | 0.2908 | 0.2777 |
| `margBy.ord` | 0.4275 | 0.4372 |
| `margBy.cg` | 0.2138 | 0.2186 |
| `margBy.ed` | 0.2723 | 0.2857 |
| `margBy.nd` | 0.3788 | 0.3899 |
| `margBy.fd` | 0.4275 | 0.4372 |
| `people.0.prov` | 6614.5264 | 5498.1671 |
| `people.0.total` | 20350.8623 | 19234.503 |

### 2025, scenario 141

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 6837.9193 | 6327.0415 |
| `prov` | 2966.8905 | 2456.0127 |
| `netTotal` | -10473.8507 | -10984.7285 |
| `marg` | 0.5666 | 0.5762 |
| `incomeTax` | 5476.0793 | 4965.2015 |
| `gross` | 26754.0993 | 26243.2215 |
| `avg` | 0.1243 | 0.115 |
| `grossAvg` | 0.4864 | 0.4771 |
| `margBy.ord` | 0.5666 | 0.5762 |
| `margBy.cg` | 0.2563 | 0.2611 |
| `margBy.ed` | 0.3896 | 0.403 |
| `margBy.nd` | 0.4765 | 0.4877 |
| `margBy.fd` | 0.5617 | 0.5807 |
| `people.0.prov` | 2966.8905 | 2456.0127 |
| `people.0.total` | 9442.3293 | 8931.4515 |

### 2025, scenario 143

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 2791.2259 | 2685.4993 |
| `prov` | 2592.573 | 2486.8464 |
| `netTotal` | -400.6497 | -506.3763 |
| `invTax` | 9999.5503 | 9893.8237 |
| `incomeTax` | 5691.3403 | 5585.6137 |
| `gross` | 11275.0159 | 11169.2893 |
| `avg` | 0.0314 | 0.0302 |
| `grossAvg` | 0.1267 | 0.1255 |
| `people.1.prov` | 2592.573 | 2486.8464 |
| `people.1.total` | 6621.5903 | 6515.8637 |

### 2025, scenario 144

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 24555.0633 | 24513.0351 |
| `prov` | 1482.5106 | 1440.4824 |
| `netTotal` | 1731.6933 | 1689.6651 |
| `marg` | 0.4582 | 0.4678 |
| `incomeTax` | 2194.7433 | 2152.7151 |
| `gross` | 28377.1634 | 28335.1352 |
| `avg` | 0.5224 | 0.5216 |
| `grossAvg` | 0.6038 | 0.6029 |
| `margBy.ord` | 0.4582 | 0.4678 |
| `margBy.cg` | 0.2015 | 0.2064 |
| `margBy.ed` | 0.2385 | 0.2519 |
| `margBy.nd` | 0.3506 | 0.3618 |
| `margBy.fd` | 0.5997 | 0.6104 |
| `people.0.prov` | 1482.5106 | 1440.4824 |
| `people.0.total` | 5553.7933 | 5511.7651 |

### 2025, scenario 145

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 6566.1545 | 6201.3143 |
| `prov` | 3008.9826 | 2644.1424 |
| `netTotal` | -786.9747 | -1151.8148 |
| `marg` | 0.6413 | 0.651 |
| `incomeTax` | 6784.9203 | 6420.0801 |
| `gross` | 20856.1495 | 20491.3093 |
| `avg` | 0.0699 | 0.066 |
| `grossAvg` | 0.2219 | 0.218 |
| `margBy.ord` | 0.6413 | 0.651 |
| `margBy.cg` | 0.294 | 0.2989 |
| `margBy.ed` | 0.4938 | 0.5072 |
| `margBy.nd` | 0.5633 | 0.5745 |
| `margBy.fd` | 0.588 | 0.5977 |
| `people.1.prov` | 3008.9826 | 2644.1424 |
| `people.1.total` | 10143.9704 | 9779.1301 |

### 2026, scenario 4

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -6354.4999 | -6481.0597 |
| `prov` | 126.5598 | 0 |
| `netTotal` | -9460.2902 | -9586.85 |
| `marg` | 0.1756 | 0.0758 |
| `incomeTax` | 126.5598 | 0 |
| `gross` | 5146.5001 | 5019.9403 |
| `avg` | -0.2269 | -0.2315 |
| `grossAvg` | 0.1838 | 0.1793 |
| `margBy.ord` | 0.1756 | 0.0758 |
| `margBy.cg` | 0.054 | 0 |
| `margBy.ed` | 0.0386 | 0 |
| `margBy.nd` | 0.1152 | 0 |
| `margBy.fd` | 0.2531 | 0.15 |
| `people.0.prov` | 126.5598 | 0 |
| `people.0.total` | 2040.7098 | 1914.15 |

### 2026, scenario 5

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -6652.2727 | -6809.2885 |
| `prov` | 326.187 | 169.1712 |
| `netTotal` | -9758.063 | -9915.0788 |
| `marg` | 0.1756 | 0.1852 |
| `incomeTax` | 326.187 | 169.1712 |
| `gross` | 5497.7273 | 5340.7115 |
| `avg` | -0.2217 | -0.227 |
| `grossAvg` | 0.1833 | 0.178 |
| `margBy.ord` | 0.1756 | 0.1852 |
| `margBy.cg` | 0.054 | 0.0589 |
| `margBy.ed` | 0.0386 | 0.0521 |
| `margBy.nd` | 0.1152 | 0.1264 |
| `margBy.fd` | 0.2467 | 0.2617 |
| `people.0.prov` | 326.187 | 169.1712 |
| `people.0.total` | 2391.937 | 2234.9212 |

### 2026, scenario 6

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -37656.0137 | -39154.7675 |
| `prov` | 1823.391 | 324.6372 |
| `netTotal` | -40761.804 | -42260.5578 |
| `marg` | 0.6812 | 0.6908 |
| `incomeTax` | 2858.306 | 1359.5522 |
| `gross` | 9166.8463 | 7668.0925 |
| `avg` | -0.8368 | -0.8701 |
| `grossAvg` | 0.2037 | 0.1704 |
| `margBy.ord` | 0.6812 | 0.6908 |
| `margBy.cg` | 0.314 | 0.3189 |
| `margBy.ed` | 0.549 | 0.5624 |
| `margBy.nd` | 0.6093 | 0.6205 |
| `margBy.fd` | 0.7135 | 0.7567 |
| `people.0.prov` | 1823.391 | 324.6372 |
| `people.0.total` | 6061.056 | 4562.3022 |

### 2026, scenario 7

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -19453.6772 | -20808.089 |
| `prov` | 3563.0775 | 2208.6657 |
| `netTotal` | -22559.4675 | -23913.8793 |
| `marg` | 0.6659 | 0.6755 |
| `incomeTax` | 6598.0925 | 5243.6807 |
| `gross` | 14043.6328 | 12689.221 |
| `avg` | -0.3242 | -0.3468 |
| `grossAvg` | 0.2341 | 0.2115 |
| `margBy.ord` | 0.6659 | 0.6755 |
| `margBy.cg` | 0.3063 | 0.3111 |
| `margBy.ed` | 0.5276 | 0.541 |
| `margBy.nd` | 0.5915 | 0.6027 |
| `margBy.fd` | 0.6511 | 0.6836 |
| `people.0.prov` | 3563.0775 | 2208.6657 |
| `people.0.total` | 10937.8425 | 9583.4307 |

### 2026, scenario 8

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 41384.2184 | 41288.6999 |
| `prov` | 12695.3507 | 12599.8322 |
| `netTotal` | 34678.4281 | 34582.9096 |
| `marg` | 0.4139 | 0.4233 |
| `incomeTax` | 29212.5451 | 29117.0266 |
| `gross` | 46657.3754 | 46561.8569 |
| `avg` | 0.2759 | 0.2753 |
| `grossAvg` | 0.311 | 0.3104 |
| `margBy.ord` | 0.4139 | 0.4233 |
| `margBy.cg` | 0.1947 | 0.1996 |
| `margBy.ed` | 0.2198 | 0.2333 |
| `margBy.nd` | 0.3351 | 0.3462 |
| `margBy.fd` | 0.3895 | 0.3992 |
| `people.0.prov` | 6347.6753 | 6252.1569 |
| `people.0.total` | 19975.7925 | 19880.2741 |

### 2026, scenario 10

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -8206.9927 | -8687.3065 |
| `prov` | 1811.727 | 1331.4132 |
| `netTotal` | -11312.783 | -11793.0968 |
| `marg` | 0.5872 | 0.5968 |
| `incomeTax` | 2943.662 | 2463.3482 |
| `gross` | 9043.9523 | 8563.6385 |
| `avg` | -0.1824 | -0.1931 |
| `grossAvg` | 0.201 | 0.1903 |
| `margBy.ord` | 0.5872 | 0.5968 |
| `margBy.cg` | 0.2665 | 0.2714 |
| `margBy.ed` | 0.4179 | 0.4313 |
| `margBy.nd` | 0.5001 | 0.5113 |
| `margBy.fd` | 0.5977 | 0.6212 |
| `people.0.prov` | 1811.727 | 1331.4132 |
| `people.0.total` | 5388.412 | 4908.0982 |

### 2026, scenario 11

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 24160.5453 | 23978.3029 |
| `prov` | 11925.2978 | 11743.0554 |
| `netTotal` | 21054.755 | 20872.5126 |
| `marg` | 0.514 | 0.5237 |
| `incomeTax` | 27124.155 | 26941.9126 |
| `gross` | 35999.4653 | 35817.2229 |
| `avg` | 0.2013 | 0.1998 |
| `grossAvg` | 0.3 | 0.2985 |
| `margBy.ord` | 0.514 | 0.5237 |
| `margBy.cg` | 0.257 | 0.2619 |
| `margBy.ed` | 0.3916 | 0.4051 |
| `margBy.nd` | 0.4782 | 0.4894 |
| `margBy.fd` | 0.514 | 0.5237 |
| `people.0.prov` | 11925.2978 | 11743.0554 |
| `people.0.total` | 32893.675 | 32711.4326 |

### 2026, scenario 23

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -8268.2727 | -8594.4597 |
| `prov` | 326.187 | 0 |
| `netTotal` | -11374.063 | -11700.25 |
| `marg` | 0.1756 | 0.0758 |
| `incomeTax` | 326.187 | 0 |
| `gross` | 5497.7273 | 5171.5403 |
| `avg` | -0.2756 | -0.2865 |
| `grossAvg` | 0.1833 | 0.1724 |
| `margBy.ord` | 0.1756 | 0.0758 |
| `margBy.cg` | 0.054 | 0 |
| `margBy.ed` | 0.0386 | 0 |
| `margBy.nd` | 0.1152 | 0 |
| `margBy.fd` | 0.2467 | 0.15 |
| `people.0.prov` | 326.187 | 0 |
| `people.0.total` | 2391.937 | 2065.75 |

### 2026, scenario 26

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 1637.5415 | 1626.5633 |
| `prov` | 514.1502 | 503.172 |
| `netTotal` | -604.2488 | -615.227 |
| `marg` | 0.2852 | 0.2948 |
| `incomeTax` | 876.4212 | 865.443 |
| `gross` | 4577.5615 | 4566.5833 |
| `avg` | 0.0744 | 0.0739 |
| `grossAvg` | 0.2081 | 0.2076 |
| `margBy.ord` | 0.2852 | 0.2948 |
| `margBy.cg` | 0.114 | 0.1189 |
| `margBy.ed` | -0.003 | 0.0104 |
| `margBy.nd` | 0.1493 | 0.1605 |
| `margBy.fd` | 0.3369 | 0.3471 |
| `people.0.prov` | 514.1502 | 503.172 |
| `people.0.total` | 2335.7712 | 2324.793 |

### 2026, scenario 36

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -27953.8538 | -28936.616 |
| `prov` | 1043.1962 | 60.434 |
| `netTotal` | -30833.8538 | -31816.616 |
| `marg` | 0.3241 | 0.3337 |
| `invTax` | 1832.7962 | 850.034 |
| `incomeTax` | 1043.1962 | 60.434 |
| `gross` | 5382.5462 | 4399.784 |
| `avg` | -0.7356 | -0.7615 |
| `grossAvg` | 0.1416 | 0.1158 |
| `margBy.ord` | 0.3241 | 0.3337 |
| `margBy.cg` | 0.129 | 0.1339 |
| `margBy.ed` | 0.2456 | 0.2591 |
| `margBy.nd` | 0.2877 | 0.2989 |
| `margBy.fd` | 0.258 | 0.2677 |
| `people.0.prov` | 1043.1962 | 60.434 |
| `people.0.total` | 2502.5462 | 1519.784 |

### 2026, scenario 37

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -12870.1263 | -13880.8119 |
| `prov` | 2960.658 | 1949.9724 |
| `netTotal` | -16427.652 | -17438.3376 |
| `marg` | 0.7307 | 0.7403 |
| `incomeTax` | 6190.108 | 5179.4224 |
| `gross` | 15774.1337 | 14763.4481 |
| `avg` | -0.1514 | -0.1633 |
| `grossAvg` | 0.1856 | 0.1737 |
| `margBy.ord` | 0.7307 | 0.7403 |
| `margBy.cg` | 0.339 | 0.3439 |
| `margBy.ed` | 0.618 | 0.6314 |
| `margBy.nd` | 0.6668 | 0.678 |
| `margBy.fd` | 0.7986 | 0.8325 |
| `people.0.prov` | 491.1678 | 488.3544 |
| `people.0.total` | 3495.7968 | 3492.9834 |
| `people.1.prov` | 2469.4902 | 1461.618 |
| `people.1.total` | 8720.8112 | 7712.939 |

### 2026, scenario 39

| Path | Before | After |
| --- | ---: | ---: |
| `invTax` | 56225.9309 | 57051.5747 |

### 2026, scenario 40

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -34394.4902 | -35797.016 |
| `prov` | 2967.4845 | 1564.9587 |
| `netTotal` | -35916.2805 | -37318.8063 |
| `marg` | 0.6015 | 0.6111 |
| `incomeTax` | 5296.2795 | 3893.7537 |
| `gross` | 10778.8198 | 9376.294 |
| `avg` | -0.6254 | -0.6509 |
| `grossAvg` | 0.196 | 0.1705 |
| `margBy.ord` | 0.6015 | 0.6111 |
| `margBy.cg` | 0.2738 | 0.2786 |
| `margBy.ed` | 0.4379 | 0.4513 |
| `margBy.nd` | 0.5168 | 0.5279 |
| `margBy.fd` | 0.6 | 0.6354 |
| `people.0.prov` | 2967.4845 | 1564.9587 |
| `people.0.total` | 9257.0295 | 7854.5037 |

### 2026, scenario 49

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -4874.9592 | -5182.7862 |
| `prov` | 4270.3632 | 3962.5362 |
| `netTotal` | -10634.9592 | -10942.7862 |
| `marg` | 0.5768 | 0.5864 |
| `invTax` | 12376.6908 | 12068.8638 |
| `incomeTax` | 5320.4708 | 5012.6438 |
| `gross` | 12539.8208 | 12231.9938 |
| `avg` | -0.0707 | -0.0751 |
| `grossAvg` | 0.1817 | 0.1773 |
| `margBy.ord` | 0.5768 | 0.5864 |
| `margBy.cg` | 0.2613 | 0.2661 |
| `margBy.ed` | 0.4034 | 0.4168 |
| `margBy.nd` | 0.488 | 0.4992 |
| `margBy.fd` | 0.5225 | 0.5322 |
| `people.0.prov` | 4270.3632 | 3962.5362 |
| `people.0.total` | 6779.8208 | 6471.9938 |

### 2026, scenario 55

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 30558.0964 | 30439.6172 |
| `prov` | 11741.9378 | 11623.4586 |
| `netTotal` | 17102.3062 | 16983.8269 |
| `marg` | 0.529 | 0.5387 |
| `invTax` | 15598.7956 | 16002.7588 |
| `incomeTax` | 26159.1162 | 26040.6369 |
| `gross` | 45384.4264 | 45265.9472 |
| `avg` | 0.2079 | 0.2071 |
| `grossAvg` | 0.3087 | 0.3079 |
| `margBy.ord` | 0.529 | 0.5387 |
| `margBy.cg` | 0.2645 | 0.2694 |
| `margBy.ed` | 0.4123 | 0.4258 |
| `margBy.nd` | 0.4955 | 0.5067 |
| `margBy.fd` | 0.529 | 0.5387 |
| `people.0.prov` | 11741.9378 | 11623.4586 |
| `people.0.total` | 31928.6362 | 31810.1569 |

### 2026, scenario 60

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -1664.8915 | -2051.7097 |
| `prov` | 386.8182 | 0 |
| `netTotal` | -10530.6818 | -10917.5 |
| `marg` | 0.1827 | 0.0758 |
| `incomeTax` | 386.8182 | 0 |
| `gross` | 11110.1085 | 10723.2903 |
| `avg` | -0.0555 | -0.0684 |
| `grossAvg` | 0.3703 | 0.3574 |
| `margBy.ord` | 0.1827 | 0.0758 |
| `margBy.cg` | 0.054 | 0 |
| `margBy.ed` | 0.149 | 0 |
| `margBy.nd` | 0.1242 | 0 |
| `margBy.fd` | 0.258 | 0.15 |
| `people.0.prov` | 386.8182 | 0 |
| `people.0.total` | 1846.1682 | 1459.35 |

### 2026, scenario 61

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 10641.1753 | 10255.3939 |
| `prov` | 4516.0263 | 4130.2449 |
| `netTotal` | 2001.1753 | 1615.3939 |
| `marg` | 0.5718 | 0.5814 |
| `incomeTax` | 9100.9453 | 8715.1639 |
| `gross` | 22687.0953 | 22301.3139 |
| `avg` | 0.1565 | 0.1508 |
| `grossAvg` | 0.3336 | 0.328 |
| `margBy.ord` | 0.5718 | 0.5814 |
| `margBy.cg` | 0.2588 | 0.2636 |
| `margBy.ed` | 0.3965 | 0.4099 |
| `margBy.nd` | 0.4823 | 0.4934 |
| `margBy.fd` | 0.5321 | 0.5475 |
| `people.0.prov` | 4516.0263 | 4130.2449 |
| `people.0.total` | 14047.0953 | 13661.3139 |

### 2026, scenario 63

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -4215.7008 | -4429.3626 |
| `prov` | 2967.4845 | 2753.8227 |
| `netTotal` | -6443.8405 | -6657.5023 |
| `marg` | 0.5075 | 0.5171 |
| `incomeTax` | 5296.2795 | 5082.6177 |
| `gross` | 11485.1692 | 11271.5074 |
| `avg` | -0.0766 | -0.0805 |
| `grossAvg` | 0.2088 | 0.2049 |
| `margBy.ord` | 0.5075 | 0.5171 |
| `margBy.cg` | 0.2263 | 0.2311 |
| `margBy.ed` | 0.3068 | 0.3202 |
| `margBy.nd` | 0.4075 | 0.4187 |
| `margBy.fd` | 0.4525 | 0.4622 |
| `people.0.prov` | 2967.4845 | 2753.8227 |
| `people.0.total` | 9257.0295 | 9043.3677 |

### 2026, scenario 64

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -1969.7647 | -2652.7621 |
| `prov` | 4516.0263 | 3833.0289 |
| `netTotal` | -10609.7647 | -11292.7621 |
| `marg` | 0.6164 | 0.626 |
| `incomeTax` | 9100.9453 | 8417.9479 |
| `gross` | 22687.0953 | 22004.0979 |
| `avg` | -0.029 | -0.039 |
| `grossAvg` | 0.3336 | 0.3236 |
| `margBy.ord` | 0.6164 | 0.626 |
| `margBy.cg` | 0.2813 | 0.2861 |
| `margBy.ed` | 0.4586 | 0.472 |
| `margBy.nd` | 0.534 | 0.5452 |
| `margBy.fd` | 0.6771 | 0.6969 |
| `people.0.prov` | 4516.0263 | 3833.0289 |
| `people.0.total` | 14047.0953 | 13364.0979 |

### 2026, scenario 65

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 15581.4108 | 15204.7684 |
| `prov` | 8497.7033 | 8121.0609 |
| `netTotal` | 12475.6205 | 12098.9781 |
| `marg` | 0.4125 | 0.4222 |
| `incomeTax` | 19496.0205 | 19119.3781 |
| `gross` | 28371.3308 | 27994.6884 |
| `avg` | 0.1558 | 0.152 |
| `grossAvg` | 0.2837 | 0.2799 |
| `margBy.ord` | 0.4125 | 0.4222 |
| `margBy.cg` | 0.2063 | 0.2111 |
| `margBy.ed` | 0.2516 | 0.265 |
| `margBy.nd` | 0.3615 | 0.3727 |
| `margBy.fd` | 0.4125 | 0.4222 |
| `people.0.prov` | 8497.7033 | 8121.0609 |
| `people.0.total` | 25265.5405 | 24888.8981 |

### 2026, scenario 66

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -6791.6295 | -7407.3839 |
| `prov` | 5361.2033 | 4745.4489 |
| `netTotal` | -8087.6295 | -8703.3839 |
| `marg` | 0.628 | 0.6373 |
| `incomeTax` | 11316.5205 | 10700.7661 |
| `gross` | 17982.0405 | 17366.2861 |
| `avg` | -0.0906 | -0.0988 |
| `grossAvg` | 0.2398 | 0.2316 |
| `margBy.ord` | 0.628 | 0.6373 |
| `margBy.cg` | 0.3063 | 0.3111 |
| `margBy.ed` | 0.5276 | 0.541 |
| `margBy.nd` | 0.5915 | 0.6027 |
| `margBy.fd` | 0.6125 | 0.6222 |
| `people.0.prov` | 5361.2033 | 4745.4489 |
| `people.0.total` | 16686.0405 | 16070.2861 |

### 2026, scenario 69

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 30211.8715 | 29521.9211 |
| `prov` | 7660.3343 | 6970.3839 |
| `netTotal` | 8215.8715 | 7525.9211 |
| `marg` | 0.4504 | 0.4597 |
| `incomeTax` | 17316.3065 | 16626.3561 |
| `gross` | 46747.5765 | 46057.6261 |
| `avg` | 0.2877 | 0.2812 |
| `grossAvg` | 0.4452 | 0.4386 |
| `margBy.ord` | 0.4504 | 0.4597 |
| `margBy.cg` | 0.2138 | 0.2186 |
| `margBy.ed` | 0.2723 | 0.2857 |
| `margBy.nd` | 0.3788 | 0.3899 |
| `margBy.fd` | 0.4275 | 0.4372 |
| `people.0.prov` | 6347.6753 | 5657.7249 |
| `people.0.total` | 19975.7925 | 19285.8421 |

### 2026, scenario 70

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 48.4765 | -316.3637 |
| `prov` | 3009.4902 | 2644.65 |
| `netTotal` | -3057.3138 | -3422.154 |
| `incomeTax` | 6387.0812 | 6022.241 |
| `gross` | 13775.9715 | 13411.1313 |
| `avg` | 0.0008 | -0.0051 |
| `grossAvg` | 0.2222 | 0.2163 |
| `people.0.prov` | 3009.4902 | 2644.65 |
| `people.0.total` | 9741.4312 | 9376.591 |

### 2026, scenario 76

| Path | Before | After |
| --- | ---: | ---: |
| `invTax` | 32239.7626 | 32627.637 |

### 2026, scenario 79

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -21615.063 | -21941.25 |
| `prov` | 326.187 | 0 |
| `netTotal` | -23343.063 | -23669.25 |
| `marg` | 0.1756 | 0.0758 |
| `incomeTax` | 326.187 | 0 |
| `gross` | 4119.937 | 3793.75 |
| `avg` | -0.7205 | -0.7314 |
| `grossAvg` | 0.1373 | 0.1265 |
| `margBy.ord` | 0.1756 | 0.0758 |
| `margBy.cg` | 0.054 | 0 |
| `margBy.ed` | 0.0386 | 0 |
| `margBy.nd` | 0.1152 | 0 |
| `margBy.fd` | 0.2467 | 0.15 |
| `people.0.prov` | 326.187 | 0 |
| `people.0.total` | 2391.937 | 2065.75 |

### 2026, scenario 80

| Path | Before | After |
| --- | ---: | ---: |
| `people.0.pDtc` | 4088.1603 | 2448.3909 |

### 2026, scenario 83

| Path | Before | After |
| --- | ---: | ---: |
| `invTax` | 42452.6252 | 42463.6034 |

### 2026, scenario 89

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 4408.4133 | 3526.1235 |
| `prov` | 5525.1243 | 4642.8345 |
| `netTotal` | -3763.5867 | -4645.8765 |
| `marg` | 0.4184 | 0.428 |
| `incomeTax` | 11889.6783 | 11007.3885 |
| `gross` | 26694.5783 | 25812.2885 |
| `avg` | 0.0474 | 0.0379 |
| `grossAvg` | 0.287 | 0.2776 |
| `margBy.ord` | 0.4184 | 0.428 |
| `margBy.cg` | 0.1813 | 0.1861 |
| `margBy.ed` | 0.1826 | 0.196 |
| `margBy.nd` | 0.304 | 0.3152 |
| `margBy.fd` | 0.3625 | 0.3806 |
| `people.0.prov` | 3953.9565 | 3071.6667 |
| `people.0.total` | 12546.7815 | 11664.4917 |

### 2026, scenario 97

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 7297.9715 | 7169.3381 |
| `prov` | 584.6958 | 456.0624 |
| `netTotal` | -291.5542 | -420.1876 |
| `marg` | 0.3241 | 0.3337 |
| `incomeTax` | 584.6958 | 456.0624 |
| `gross` | 10846.3715 | 10717.7381 |
| `avg` | 0.1921 | 0.1887 |
| `grossAvg` | 0.2854 | 0.282 |
| `margBy.ord` | 0.3241 | 0.3337 |
| `margBy.cg` | 0.129 | 0.1339 |
| `margBy.ed` | 0.2456 | 0.2591 |
| `margBy.nd` | 0.2877 | 0.2989 |
| `margBy.fd` | 0.3898 | 0.4034 |
| `people.0.prov` | 584.6958 | 456.0624 |
| `people.0.total` | 3256.8458 | 3128.2124 |

### 2026, scenario 98

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -10105.95 | -11339.3802 |
| `prov` | 5973.2829 | 4739.8527 |
| `netTotal` | -14206.0897 | -15439.5199 |
| `marg` | 0.4827 | 0.4923 |
| `invTax` | 12232.0379 | 12563.2901 |
| `incomeTax` | 11084.0753 | 9850.6451 |
| `gross` | 19997.915 | 18764.4848 |
| `avg` | -0.0886 | -0.0995 |
| `grossAvg` | 0.1754 | 0.1646 |
| `margBy.ord` | 0.4827 | 0.4923 |
| `margBy.cg` | 0.2138 | 0.2186 |
| `margBy.ed` | 0.2723 | 0.2857 |
| `margBy.nd` | 0.3788 | 0.3899 |
| `margBy.fd` | 0.5208 | 0.546 |
| `people.0.prov` | 2963.7927 | 1730.3625 |
| `people.0.total` | 5936.9641 | 4703.5339 |

### 2026, scenario 99

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -37090.063 | -37416.25 |
| `prov` | 326.187 | 0 |
| `netTotal` | -44002.063 | -44328.25 |
| `marg` | 0.1756 | 0.0758 |
| `incomeTax` | 326.187 | 0 |
| `gross` | 9303.937 | 8977.75 |
| `avg` | -1.2363 | -1.2472 |
| `grossAvg` | 0.3101 | 0.2993 |
| `margBy.ord` | 0.1756 | 0.0758 |
| `margBy.cg` | 0.054 | 0 |
| `margBy.ed` | 0.0386 | 0 |
| `margBy.nd` | 0.1152 | 0 |
| `margBy.fd` | 0.2467 | 0.15 |
| `people.0.prov` | 326.187 | 0 |
| `people.0.total` | 2391.937 | 2065.75 |

### 2026, scenario 101

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -4867.393 | -5477.5314 |
| `prov` | 1589.3798 | 979.2414 |
| `netTotal` | -15919.393 | -16529.5314 |
| `marg` | 0.6045 | 0.6138 |
| `incomeTax` | 2320.947 | 1710.8086 |
| `gross` | 18742.467 | 18132.3286 |
| `avg` | -0.0649 | -0.073 |
| `grossAvg` | 0.2499 | 0.2418 |
| `margBy.ord` | 0.6045 | 0.6138 |
| `margBy.cg` | 0.294 | 0.2989 |
| `margBy.ed` | 0.4938 | 0.5072 |
| `margBy.nd` | 0.5633 | 0.5745 |
| `margBy.fd` | 0.6851 | 0.7086 |
| `people.0.prov` | 1589.3798 | 979.2414 |
| `people.0.total` | 7690.467 | 7080.3286 |

### 2026, scenario 103

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -2495.2155 | -2575.2489 |
| `prov` | 1124.6958 | 1044.6624 |
| `netTotal` | -8863.3552 | -8943.3886 |
| `marg` | 0.4535 | 0.4631 |
| `incomeTax` | 1253.8948 | 1173.8614 |
| `gross` | 10294.1845 | 10214.1511 |
| `avg` | -0.0657 | -0.0678 |
| `grossAvg` | 0.2709 | 0.2688 |
| `margBy.ord` | 0.4535 | 0.4631 |
| `margBy.cg` | 0.199 | 0.2039 |
| `margBy.ed` | 0.2316 | 0.245 |
| `margBy.nd` | 0.3448 | 0.356 |
| `margBy.fd` | 0.6141 | 0.6259 |
| `people.0.prov` | 1124.6958 | 1044.6624 |
| `people.0.total` | 3926.0448 | 3846.0114 |

### 2026, scenario 107

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 14371.9562 | 13907.6178 |
| `prov` | 3448.7033 | 2984.3649 |
| `netTotal` | -11325.5695 | -11789.9079 |
| `marg` | 0.5896 | 0.5989 |
| `incomeTax` | 6329.0205 | 5864.6821 |
| `gross` | 37396.0662 | 36931.7278 |
| `avg` | 0.1916 | 0.1854 |
| `grossAvg` | 0.4986 | 0.4924 |
| `margBy.ord` | 0.5896 | 0.5989 |
| `margBy.cg` | 0.2863 | 0.2911 |
| `margBy.ed` | 0.4724 | 0.4858 |
| `margBy.nd` | 0.5455 | 0.5567 |
| `margBy.fd` | 0.6153 | 0.6329 |
| `people.0.prov` | 3448.7033 | 2984.3649 |
| `people.0.total` | 11698.5405 | 11234.2021 |

### 2026, scenario 114

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 7997.3569 | 7924.5902 |
| `prov` | 8001.1363 | 7928.3696 |
| `netTotal` | 6269.3569 | 6196.5902 |
| `marg` | 0.4632 | 0.4726 |
| `invTax` | 21212.9777 | 21728.0712 |
| `incomeTax` | 16317.7669 | 16245.0002 |
| `gross` | 21400.1169 | 21327.3502 |
| `avg` | 0.0747 | 0.0741 |
| `grossAvg` | 0.2 | 0.1993 |
| `margBy.ord` | 0.4632 | 0.4726 |
| `margBy.cg` | 0.2037 | 0.2084 |
| `margBy.ed` | 0.254 | 0.267 |
| `margBy.nd` | 0.359 | 0.3698 |
| `margBy.fd` | 0.4956 | 0.5057 |
| `people.0.pFtc` | 249.1919 | 246.9256 |
| `people.0.prov` | 8001.1363 | 7928.3696 |
| `people.0.total` | 19672.1169 | 19599.3502 |

### 2026, scenario 116

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -18430.7164 | -20071.0258 |
| `prov` | 4222.3356 | 2582.0262 |
| `netTotal` | -24910.7164 | -26551.0258 |
| `marg` | 0.5822 | 0.5918 |
| `incomeTax` | 9087.2936 | 7446.9842 |
| `gross` | 20911.5936 | 19271.2842 |
| `avg` | -0.2425 | -0.2641 |
| `grossAvg` | 0.2752 | 0.2536 |
| `margBy.ord` | 0.5822 | 0.5918 |
| `margBy.cg` | 0.264 | 0.2689 |
| `margBy.ed` | 0.411 | 0.4244 |
| `margBy.nd` | 0.4943 | 0.5055 |
| `margBy.fd` | 0.657 | 0.7101 |
| `people.0.prov` | 2111.1678 | 470.8584 |
| `people.0.total` | 7215.7968 | 5575.4874 |

### 2026, scenario 117

| Path | Before | After |
| --- | ---: | ---: |
| `invTax` | 22289.0892 | 22300.0674 |

### 2026, scenario 119

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -22386.063 | -22712.25 |
| `prov` | 326.187 | 0 |
| `netTotal` | -25266.063 | -25592.25 |
| `marg` | 0.1756 | 0.0758 |
| `incomeTax` | 326.187 | 0 |
| `gross` | 5271.937 | 4945.75 |
| `avg` | -0.7462 | -0.7571 |
| `grossAvg` | 0.1757 | 0.1649 |
| `margBy.ord` | 0.1756 | 0.0758 |
| `margBy.cg` | 0.054 | 0 |
| `margBy.ed` | 0.0386 | 0 |
| `margBy.nd` | 0.1152 | 0 |
| `margBy.fd` | 0.108 | 0 |
| `people.0.prov` | 326.187 | 0 |
| `people.0.total` | 2391.937 | 2065.75 |

### 2026, scenario 121

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -23147.3552 | -24119.0366 |
| `prov` | 1124.6958 | 153.0144 |
| `netTotal` | -31787.3552 | -32759.0366 |
| `marg` | 0.4535 | 0.4631 |
| `incomeTax` | 1253.8948 | 282.2134 |
| `gross` | 12566.0448 | 11594.3634 |
| `avg` | -0.6091 | -0.6347 |
| `grossAvg` | 0.3307 | 0.3051 |
| `margBy.ord` | 0.4535 | 0.4631 |
| `margBy.cg` | 0.199 | 0.2039 |
| `margBy.ed` | 0.2316 | 0.245 |
| `margBy.nd` | 0.3448 | 0.356 |
| `margBy.fd` | 0.5141 | 0.5496 |
| `people.0.prov` | 1124.6958 | 153.0144 |
| `people.0.total` | 3926.0448 | 2954.3634 |

### 2026, scenario 123

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 27942.8385 | 27191.2611 |
| `prov` | 3178.2348 | 2426.6574 |
| `netTotal` | -1465.3012 | -2216.8786 |
| `incomeTax` | 6689.7288 | 5938.1514 |
| `gross` | 43109.7685 | 42358.1911 |
| `avg` | 0.2851 | 0.2775 |
| `grossAvg` | 0.4399 | 0.4322 |
| `people.1.prov` | 1865.5758 | 1113.9984 |
| `people.1.total` | 8925.8448 | 8174.2674 |

### 2026, scenario 124

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 13090.7512 | 13079.773 |
| `prov` | 514.1502 | 503.172 |
| `netTotal` | -1579.2488 | -1590.227 |
| `marg` | 0.2852 | 0.2948 |
| `incomeTax` | 876.4212 | 865.443 |
| `gross` | 17005.7712 | 16994.793 |
| `avg` | 0.595 | 0.5945 |
| `grossAvg` | 0.773 | 0.7725 |
| `margBy.ord` | 0.2852 | 0.2948 |
| `margBy.cg` | 0.114 | 0.1189 |
| `margBy.ed` | -0.003 | 0.0104 |
| `margBy.nd` | 0.1493 | 0.1605 |
| `margBy.fd` | 0.3369 | 0.3471 |
| `people.0.prov` | 514.1502 | 503.172 |
| `people.0.total` | 2335.7712 | 2324.793 |

### 2026, scenario 126

| Path | Before | After |
| --- | ---: | ---: |
| `invTax` | 17331.7713 | 17514.0137 |

### 2026, scenario 127

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 6722.6087 | 6432.9581 |
| `prov` | 4284.3094 | 3994.6588 |
| `netTotal` | 2013.083 | 1723.4324 |
| `marg` | 0.6263 | 0.6359 |
| `invTax` | 12132.2835 | 12353.5107 |
| `incomeTax` | 11966.163 | 11676.5124 |
| `gross` | 20636.4387 | 20346.7881 |
| `avg` | 0.0873 | 0.0835 |
| `grossAvg` | 0.268 | 0.2642 |
| `margBy.ord` | 0.6263 | 0.6359 |
| `margBy.cg` | 0.2863 | 0.2911 |
| `margBy.ed` | 0.4724 | 0.4858 |
| `margBy.nd` | 0.5455 | 0.5567 |
| `margBy.fd` | 0.5725 | 0.5822 |
| `people.0.prov` | 4284.3094 | 3994.6588 |
| `people.0.total` | 15926.913 | 15637.2624 |

### 2026, scenario 128

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 9227.9089 | 8937.2647 |
| `prov` | 2023.0182 | 1732.374 |
| `netTotal` | -2918.2308 | -3208.875 |
| `marg` | 0.5723 | 0.5819 |
| `incomeTax` | 3316.7092 | 3026.065 |
| `gross` | 18817.1989 | 18526.5547 |
| `avg` | 0.1963 | 0.1902 |
| `grossAvg` | 0.4004 | 0.3942 |
| `margBy.ord` | 0.5723 | 0.5819 |
| `margBy.cg` | 0.259 | 0.2639 |
| `margBy.ed` | 0.3972 | 0.4106 |
| `margBy.nd` | 0.4828 | 0.494 |
| `margBy.fd` | 0.6964 | 0.7123 |
| `people.0.prov` | 2023.0182 | 1732.374 |
| `people.0.total` | 6671.0592 | 6380.415 |

### 2026, scenario 133

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -19788.2681 | -21242.2451 |
| `prov` | 4088.3577 | 2634.3807 |
| `netTotal` | -22880.4078 | -24334.3848 |
| `marg` | 0.6015 | 0.6111 |
| `invTax` | 17923.103 | 17731.2842 |
| `incomeTax` | 8324.0022 | 6870.0252 |
| `gross` | 15168.6419 | 13714.6649 |
| `avg` | -0.2275 | -0.2442 |
| `grossAvg` | 0.1744 | 0.1576 |
| `margBy.ord` | 0.6015 | 0.6111 |
| `margBy.cg` | 0.2738 | 0.2786 |
| `margBy.ed` | 0.4379 | 0.4513 |
| `margBy.nd` | 0.5168 | 0.5279 |
| `margBy.fd` | 0.5475 | 0.5572 |
| `people.1.prov` | 4088.3577 | 2634.3807 |
| `people.1.total` | 11678.3522 | 10224.3752 |

### 2026, scenario 134

| Path | Before | After |
| --- | ---: | ---: |
| `invTax` | 5131.9876 | 5142.9658 |

### 2026, scenario 136

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -10586.4395 | -11703.3139 |
| `prov` | 6585.2033 | 5468.3289 |
| `netTotal` | -14906.4395 | -16023.3139 |
| `marg` | 0.4775 | 0.4872 |
| `incomeTax` | 14508.5205 | 13391.6461 |
| `gross` | 24598.0405 | 23481.1661 |
| `avg` | -0.1245 | -0.1377 |
| `grossAvg` | 0.2894 | 0.2762 |
| `margBy.ord` | 0.4775 | 0.4872 |
| `margBy.cg` | 0.2388 | 0.2436 |
| `margBy.ed` | 0.3413 | 0.3547 |
| `margBy.nd` | 0.4363 | 0.4474 |
| `margBy.fd` | 0.4775 | 0.4872 |
| `people.0.prov` | 6585.2033 | 5468.3289 |
| `people.0.total` | 20278.0405 | 19161.1661 |

### 2026, scenario 141

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 6167.7995 | 5656.9217 |
| `prov` | 2967.4845 | 2456.6067 |
| `netTotal` | -11094.2005 | -11605.0783 |
| `marg` | 0.5619 | 0.5715 |
| `incomeTax` | 5296.2795 | 4785.4017 |
| `gross` | 26519.0295 | 26008.1517 |
| `avg` | 0.1121 | 0.1029 |
| `grossAvg` | 0.4822 | 0.4729 |
| `margBy.ord` | 0.5619 | 0.5715 |
| `margBy.cg` | 0.2537 | 0.2586 |
| `margBy.ed` | 0.3827 | 0.3961 |
| `margBy.nd` | 0.4708 | 0.4819 |
| `margBy.fd` | 0.56 | 0.579 |
| `people.0.prov` | 2967.4845 | 2456.6067 |
| `people.0.total` | 9257.0295 | 8746.1517 |

### 2026, scenario 143

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 2344.7432 | 2239.0166 |
| `prov` | 2592.735 | 2487.0084 |
| `netTotal` | -747.3965 | -853.1231 |
| `invTax` | 9639.5035 | 9533.7769 |
| `incomeTax` | 5521.1435 | 5415.4169 |
| `gross` | 11001.3832 | 10895.6566 |
| `avg` | 0.0263 | 0.0252 |
| `grossAvg` | 0.1236 | 0.1224 |
| `people.1.prov` | 2592.735 | 2487.0084 |
| `people.1.total` | 6449.8935 | 6344.1669 |

### 2026, scenario 144

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 24392.7592 | 24350.731 |
| `prov` | 1483.0182 | 1440.99 |
| `netTotal` | 1619.1592 | 1577.131 |
| `marg` | 0.4535 | 0.4631 |
| `incomeTax` | 2076.7092 | 2034.681 |
| `gross` | 28204.6592 | 28162.631 |
| `avg` | 0.519 | 0.5181 |
| `grossAvg` | 0.6001 | 0.5992 |
| `margBy.ord` | 0.4535 | 0.4631 |
| `margBy.cg` | 0.199 | 0.2039 |
| `margBy.ed` | 0.2316 | 0.245 |
| `margBy.nd` | 0.3448 | 0.356 |
| `margBy.fd` | 0.5976 | 0.6083 |
| `people.0.prov` | 1483.0182 | 1440.99 |
| `people.0.total` | 5431.0592 | 5389.031 |

### 2026, scenario 145

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 5757.1565 | 5392.3163 |
| `prov` | 3009.4902 | 2644.65 |
| `netTotal` | -1380.6338 | -1745.474 |
| `marg` | 0.6367 | 0.6463 |
| `incomeTax` | 6606.4612 | 6241.621 |
| `gross` | 20452.9515 | 20088.1113 |
| `avg` | 0.0612 | 0.0574 |
| `grossAvg` | 0.2176 | 0.2137 |
| `margBy.ord` | 0.6367 | 0.6463 |
| `margBy.cg` | 0.2915 | 0.2964 |
| `margBy.ed` | 0.4869 | 0.5003 |
| `margBy.nd` | 0.5576 | 0.5688 |
| `margBy.fd` | 0.583 | 0.5927 |
| `people.1.prov` | 3009.4902 | 2644.65 |
| `people.1.total` | 9960.8112 | 9595.971 |

### other-income 2025, scenario 153

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 12887.651 | 12554.5952 |
| `prov` | 6459.9525 | 6126.8967 |
| `netTotal` | 10007.651 | 9674.5952 |
| `incomeTax` | 14531.015 | 14197.9592 |
| `gross` | 21548.515 | 21215.4592 |
| `avg` | 0.1357 | 0.1322 |
| `grossAvg` | 0.2268 | 0.2233 |
| `people.1.prov` | 3609.5895 | 3276.5337 |
| `people.1.total` | 9427.4258 | 9094.37 |

### other-income 2025, scenario 154

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -7167.2591 | -7455.4733 |
| `prov` | 2227.4406 | 1939.2264 |
| `netTotal` | -10047.2591 | -10335.4733 |
| `marg` | 0.6413 | 0.651 |
| `incomeTax` | 3939.8108 | 3651.5966 |
| `gross` | 8281.3608 | 7993.1467 |
| `avg` | -0.1525 | -0.1586 |
| `grossAvg` | 0.1762 | 0.1701 |
| `margBy.ord` | 0.6413 | 0.651 |
| `margBy.cg` | 0.294 | 0.2989 |
| `margBy.ed` | 0.4938 | 0.5072 |
| `margBy.nd` | 0.5633 | 0.5745 |
| `margBy.fd` | 0.6535 | 0.6693 |
| `people.0.prov` | 2227.4406 | 1939.2264 |
| `people.0.total` | 5401.3608 | 5113.1467 |

### other-income 2025, scenario 155

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -7887.702 | -8344.974 |
| `prov` | 4042.788 | 3585.516 |
| `netTotal` | -10767.702 | -11224.974 |
| `marg` | 0.4398 | 0.4495 |
| `incomeTax` | 8222.878 | 7765.606 |
| `gross` | 11102.878 | 10645.606 |
| `avg` | -0.1315 | -0.1391 |
| `grossAvg` | 0.185 | 0.1774 |
| `margBy.ord` | 0.4398 | 0.4495 |
| `margBy.cg` | 0.2863 | 0.2911 |
| `margBy.ed` | 0.4724 | 0.4858 |
| `margBy.nd` | 0.5455 | 0.5567 |
| `margBy.fd` | 0.5851 | 0.6024 |
| `people.0.prov` | 4042.788 | 3585.516 |
| `people.0.total` | 8222.878 | 7765.606 |

### other-income 2025, scenario 156

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 8198.6288 | 8161.817 |
| `prov` | 3525.6675 | 3488.8557 |
| `netTotal` | 5318.6288 | 5281.8169 |
| `marg` | 0.2887 | 0.2888 |
| `incomeTax` | 7743.3188 | 7706.507 |
| `gross` | 13622.3188 | 13585.507 |
| `avg` | 0.1261 | 0.1256 |
| `grossAvg` | 0.2096 | 0.209 |
| `margBy.ord` | 0.2887 | 0.2888 |
| `margBy.nd` | 0.2472 | 0.2473 |
| `people.0.prov` | 3525.6675 | 3488.8557 |
| `people.0.total` | 9812.0688 | 9775.2569 |

### other-income 2026, scenario 153

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 12412.1518 | 12079.096 |
| `prov` | 6460.6005 | 6127.5447 |
| `netTotal` | 9306.3615 | 8973.3057 |
| `incomeTax` | 14155.3505 | 13822.2947 |
| `gross` | 21392.6408 | 21059.585 |
| `avg` | 0.1307 | 0.1271 |
| `grossAvg` | 0.2252 | 0.2217 |
| `people.1.prov` | 3609.8055 | 3276.7497 |
| `people.1.total` | 9221.0505 | 8887.9947 |

### other-income 2026, scenario 154

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -8028.4105 | -8316.6247 |
| `prov` | 2227.6782 | 1939.464 |
| `netTotal` | -11134.2008 | -11422.415 |
| `marg` | 0.6367 | 0.6463 |
| `incomeTax` | 3786.6692 | 3498.455 |
| `gross` | 8351.8095 | 8063.5953 |
| `avg` | -0.1708 | -0.1769 |
| `grossAvg` | 0.1777 | 0.1716 |
| `margBy.ord` | 0.6367 | 0.6463 |
| `margBy.cg` | 0.2915 | 0.2964 |
| `margBy.ed` | 0.4869 | 0.5003 |
| `margBy.nd` | 0.5576 | 0.5688 |
| `margBy.fd` | 0.6518 | 0.6676 |
| `people.0.prov` | 2227.6782 | 1939.464 |
| `people.0.total` | 5246.0192 | 4957.805 |

### other-income 2026, scenario 155

| Path | Before | After |
| --- | ---: | ---: |
| `total` | -8937.6067 | -9394.8787 |
| `prov` | 4042.788 | 3585.516 |
| `netTotal` | -12043.397 | -12500.669 |
| `marg` | 0.4448 | 0.4545 |
| `incomeTax` | 7932.233 | 7474.961 |
| `gross` | 11038.0233 | 10580.7513 |
| `avg` | -0.149 | -0.1566 |
| `grossAvg` | 0.184 | 0.1763 |
| `margBy.ord` | 0.4448 | 0.4545 |
| `margBy.cg` | 0.2863 | 0.2911 |
| `margBy.ed` | 0.4724 | 0.4858 |
| `margBy.nd` | 0.5455 | 0.5567 |
| `margBy.fd` | 0.59 | 0.6073 |
| `people.0.prov` | 4042.788 | 3585.516 |
| `people.0.total` | 7932.233 | 7474.961 |

### other-income 2026, scenario 156

| Path | Before | After |
| --- | ---: | ---: |
| `total` | 7614.8368 | 7578.025 |
| `prov` | 3525.9915 | 3489.1797 |
| `netTotal` | 4509.0465 | 4472.2347 |
| `incomeTax` | 7503.9865 | 7467.1747 |
| `gross` | 13604.2768 | 13567.465 |
| `avg` | 0.1172 | 0.1166 |
| `grossAvg` | 0.2093 | 0.2087 |
| `people.0.prov` | 3525.9915 | 3489.1797 |
| `people.0.total` | 9569.7365 | 9532.9247 |


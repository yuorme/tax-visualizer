# Manitoba family tax benefit history, issue #166

The ordinary Manitoba family tax benefit is selected through data for 2019–2024, reusing #145's program.
No engine or schema change is needed. The six MB428-A schedules have the same ordinary calculation:

`max(0, 2065 + 2065 × claimed spouse/dependant + 2752 × qualifying children − 0.09 × own net income)`.

MB428 converts that base at 10.8%, limited to tax capacity before dividend and foreign tax credits.
The amounts are not indexed. The $40,000 other-income, zero-income spouse, two-child example has a
$6,034 base and $651.672 calculated credit in every year. Different annual brackets and personal amounts
still produce legitimate historical differences; enabling this program removes the artificial 2024/2025 jump.

## Year-specific evidence

All 18 sources below were fetched with `npm run fetch-source`; each year's index records the original URL,
retrieval date and SHA-256. The 2019 guide PDF and the older-style 2023 guide page returned HTTP 404;
the archived HTML guide URLs in the caches and YAML source lists are the successful sources actually read.

| Year | Amounts and taper | Eligibility and claimant | Conversion, capacity and ordering |
| --- | --- | --- | --- |
| 2019 | [MB428-A](2019/sources/mb-family-benefit.txt) | [Guide](2019/sources/mb-guide.txt) | [MB428](2019/sources/mb428.txt) |
| 2020 | [MB428-A](2020/sources/mb-family-benefit.txt) | [Guide](2020/sources/mb-guide.txt) | [MB428](2020/sources/mb428.txt) |
| 2021 | [MB428-A](2021/sources/mb-family-benefit.txt) | [Guide](2021/sources/mb-guide.txt) | [MB428](2021/sources/mb428.txt) |
| 2022 | [MB428-A](2022/sources/mb-family-benefit.txt) | [Guide](2022/sources/mb-guide.txt) | [MB428](2022/sources/mb428.txt) |
| 2023 | [MB428-A](2023/sources/mb-family-benefit.txt) | [Guide](2023/sources/mb-guide.txt) | [MB428](2023/sources/mb428.txt) |
| 2024 | [MB428-A](2024/sources/mb-family-benefit.txt) | [Guide](2024/sources/mb-guide.txt) | [MB428](2024/sources/mb428.txt) |

MB428-A lines 1–3, 9 and 11–12 establish the $2,065/$2,065/$2,752 bases, individual 9% taper and zero floor.
The dependent-child birth-year band is 2001/2002/2003/2004/2005/2006 or later, respectively.
Each year's guide explicitly includes children aged 18 or younger on December 31, requires the child to
live with an eligible parent in Canada, excludes competing claims and children's special allowances,
and assigns the whole child claim to the higher-net-income spouse. A child claimed on line 3 is excluded
from line 9. Each MB428 prints the unchanged $9,134 spouse/eligible-dependant base.

The 2019 MB428 has different line numbers: family base line 28/61470, conversion lines 36–38,
dividend credit line 55, and provincial FTC line 67. From 2020 the family base is line 41/61470,
conversion lines 51–53, and dividend credit line 62. Provincial FTC is line 70 in 2020 and line 73
in 2021–2024. These are numbering/layout differences; the ordinary calculation and ordering have the
same shape throughout. None requires a new formula or a year check in the engine.

The ordinary eligible-parent assumptions and unsupported senior/disability, custody, residency-proration
and competing-parent cases remain those documented in [#145](145-manitoba-family-benefit.md).
The child band includes an ordinary child turning 18 who qualified earlier in the year. Age alone does
not prove statutory eligibility. Equal-income election of the whole child claim follows #145/#92's
interpretation, rather than a newly asserted statutory tie rule; every YAML file identifies this interpretation.

## Independent calculations and golden coverage

The separate feature fixture is `tests/golden/features/mb-family-benefit-history.json`: 31 cases per year,
186 total. Expectations were calculated from the independent MB428/MB428-A worksheet, never captured
from the engine. The worksheet uses each year's cached MB428 brackets and BPA and the already-cached
`federal-t4127.txt` (2019–2023) or `federal-t4127-24.txt` (2024) for federal tax and payroll inputs.
Base CPP is 4.95%; enhanced CPP is deducted, with each year's published enhancement rate and ceilings.
The federal worksheet is needed to limit provincial FTC after federal FTC; it is independent of engine imports.
The committed worksheet is `tests/mb-family-forms.ts`; `tests/mb-family-history.test.ts` runs the historical
feature fixtures, negative controls and 14,208 baseline/counterfactual returns with and without the benefit.

For example, 2019 tax on $40,000 is `40000 × .108 + (40000 − 32670) × .0195 = 4462.935`.
Ordinary BPA and spouse credits are `(9626 + 9134) × .108 = 2026.08`, leaving $2,436.855.
The family credit reduces that to $1,785.183. In 2024 the same calculation leaves $1,629.288 before,
then $977.616 after the family credit, matching 2025's worked example.

All IDs below have a prefix of `2019-`, `2020-`, `2021-`, `2022-`, `2023-` or `2024-`.

| Changed data-selected rule path or material boundary | Feature golden suffixes |
| --- | --- |
| Basic amount, individual taper and exact exhaustion | `basic-capped`, `basic-taper`, `basic-taper-last-dollar`, `basic-taper-exhausted` |
| Claimed spouse/dependant supplement, $9,134 dependent-income boundary | `example`, `spouse-below-limit`, `spouse-at-limit`, `implicit-zero-income-spouse` |
| Single-parent exclusion from child count | `single-parent-one`, `single-parent-two` |
| Child age boundary at 18/19, independent of CCB | `ages-only-17`, `ages-only-18`, `ages-only-19` |
| Higher-net-income child claimant, gross-up and net-income bases | `higher-income-child-claim`, `net-income-not-cash`, `dividend-gross-up-claimant` |
| Whole-claim election on ties and strict restriction outside ties | `equal-income-spouses`, `equal-income-dividend-capacity`, `equal-income-foreign-tax`, `near-equal-income-spouses`, `near-equal-dividend-restriction` |
| Unrelated-adult eligible-parent interpretation | `unrelated-adults`, `equal-income-unrelated-dividend-capacity`, `equal-income-unrelated-foreign-tax` |
| 10.8% conversion, non-refundable capacity and zero floor | `example`, `zero-capacity`, `capped-capacity`, `family-taper-exhausted` |
| Credit ordering before dividends and FTC | `mixed-dividends-foreign`, `dividend-credit-capped`, `equal-income-foreign-tax` |
| Personal-credit switch and independent refundable-credit switch | `personal-credits-off`, `refund-switch-independent` |

Before editing any locked expectation, disabling only the newly selected program reproduced every existing
Manitoba snapshot exactly for all 148 households in all six years. An independent worksheet audit then checked
17,184 complete household returns: the 148 locked scenarios plus the 31 new feature households per year,
each at its original input, all six $100 income counterfactuals and the zero-investment counterfactual,
with and without the benefit. Every person's net income, family base, applied family credit, usable dividend
credit, federal FTC, provincial FTC and final provincial tax agreed within $0.0000001.

Existing golden inputs, assertions and tolerances are preserved. There are 351 corrected Manitoba baseline
cases: 62 each in 2019–2022, 52 in 2023 and 51 in 2024, comprising 4,537 changed scalar expectations.
Only independently audited Manitoba fields
that differ are corrected; all other provinces, unchanged fields and 2025/2026 data and fixtures are preserved.
Cases with changes only in marginal or investment outputs reflect a counterfactual entering the taper or
regaining a benefit, even when the original household's provincial tax is unchanged.

## Parallel-work note

`src/ui/history.ts` belongs to #168 and is untouched. Its current coverage-note function derives the first
supported year from installed data, so adding 2019 coverage automatically removes the Manitoba partial-coverage
warning. The browser expectation now follows the expanded coverage. Its one-line Manitoba table edit may
conflict with #173's coverage-table changes; no changes from that branch were pulled into this worktree.
The orchestrator explicitly approved changing existing assertions that encoded the pre-2025 omission,
plus extending the independent worksheet and adding the history runner. The PR records each assertion's
before/after behavior. No golden assertion or tolerance was weakened.

## Existing golden before/after values

Every changed scalar is listed below at the locked fixture's original four-decimal precision.

| Year | Scenario | Path | Before | After |
| --- | --- | --- | ---: | ---: |
| 2019 | 2 | `total` | 2037.5172 | 1931.0133 |
| 2019 | 2 | `prov` | 188.5788 | 82.0749 |
| 2019 | 2 | `netTotal` | -1050.0262 | -1156.5301 |
| 2019 | 2 | `marg` | 0.148 | 0.1577 |
| 2019 | 2 | `incomeTax` | 188.5788 | 82.0749 |
| 2019 | 2 | `gross` | 3904.0222 | 3797.5183 |
| 2019 | 2 | `avg` | 0.1698 | 0.1609 |
| 2019 | 2 | `grossAvg` | 0.3253 | 0.3165 |
| 2019 | 2 | `margBy.ord` | 0.148 | 0.1577 |
| 2019 | 2 | `margBy.cg` | 0.044 | 0.0489 |
| 2019 | 2 | `margBy.ed` | 0.011 | 0.0245 |
| 2019 | 2 | `margBy.nd` | 0.0922 | 0.1034 |
| 2019 | 2 | `margBy.fd` | 0.2215 | 0.24 |
| 2019 | 2 | `people.0.prov` | 188.5788 | 82.0749 |
| 2019 | 2 | `people.0.total` | 816.4788 | 709.9749 |
| 2019 | 4 | `total` | -2567.2464 | -2741.4836 |
| 2019 | 4 | `prov` | 813.9852 | 639.748 |
| 2019 | 4 | `netTotal` | -5654.7898 | -5829.027 |
| 2019 | 4 | `marg` | 0.4277 | 0.4374 |
| 2019 | 4 | `incomeTax` | 954.5202 | 780.283 |
| 2019 | 4 | `gross` | 5745.1636 | 5570.9264 |
| 2019 | 4 | `avg` | -0.0917 | -0.0979 |
| 2019 | 4 | `grossAvg` | 0.2052 | 0.199 |
| 2019 | 4 | `margBy.ord` | 0.4277 | 0.4374 |
| 2019 | 4 | `margBy.cg` | 0.189 | 0.1939 |
| 2019 | 4 | `margBy.ed` | 0.204 | 0.2174 |
| 2019 | 4 | `margBy.nd` | 0.3218 | 0.333 |
| 2019 | 4 | `margBy.fd` | 0.4931 | 0.509 |
| 2019 | 4 | `people.0.prov` | 813.9852 | 639.748 |
| 2019 | 4 | `people.0.total` | 2657.6202 | 2483.383 |
| 2019 | 5 | `total` | -2048.8816 | -2203.708 |
| 2019 | 5 | `prov` | 1015.47 | 860.6436 |
| 2019 | 5 | `netTotal` | -5136.425 | -5291.2514 |
| 2019 | 5 | `marg` | 0.4277 | 0.4374 |
| 2019 | 5 | `incomeTax` | 1435.845 | 1281.0186 |
| 2019 | 5 | `gross` | 6360.8884 | 6206.062 |
| 2019 | 5 | `avg` | -0.0683 | -0.0735 |
| 2019 | 5 | `grossAvg` | 0.212 | 0.2069 |
| 2019 | 5 | `margBy.ord` | 0.4277 | 0.4374 |
| 2019 | 5 | `margBy.cg` | 0.189 | 0.1939 |
| 2019 | 5 | `margBy.ed` | 0.204 | 0.2174 |
| 2019 | 5 | `margBy.nd` | 0.3218 | 0.333 |
| 2019 | 5 | `margBy.fd` | 0.4794 | 0.4942 |
| 2019 | 5 | `people.0.prov` | 1015.47 | 860.6436 |
| 2019 | 5 | `people.0.total` | 3273.345 | 3118.5186 |
| 2019 | 6 | `total` | -23932.4345 | -25427.7595 |
| 2019 | 6 | `prov` | 2765.8271 | 1270.5021 |
| 2019 | 6 | `netTotal` | -27019.9779 | -28515.3029 |
| 2019 | 6 | `marg` | 0.6069 | 0.6166 |
| 2019 | 6 | `incomeTax` | 5285.0021 | 3789.6771 |
| 2019 | 6 | `gross` | 11218.0455 | 9722.7205 |
| 2019 | 6 | `avg` | -0.5318 | -0.5651 |
| 2019 | 6 | `grossAvg` | 0.2493 | 0.2161 |
| 2019 | 6 | `margBy.ord` | 0.6069 | 0.6166 |
| 2019 | 6 | `margBy.cg` | 0.2788 | 0.2836 |
| 2019 | 6 | `margBy.ed` | 0.4517 | 0.4651 |
| 2019 | 6 | `margBy.nd` | 0.5283 | 0.5394 |
| 2019 | 6 | `margBy.fd` | 0.5895 | 0.6324 |
| 2019 | 6 | `people.0.prov` | 2765.8271 | 1270.5021 |
| 2019 | 6 | `people.0.total` | 8130.5021 | 6635.1771 |
| 2019 | 7 | `total` | -7540.9959 | -8890.7017 |
| 2019 | 7 | `prov` | 4595.4935 | 3245.7876 |
| 2019 | 7 | `netTotal` | -10628.5393 | -11978.2451 |
| 2019 | 7 | `marg` | 0.6125 | 0.6222 |
| 2019 | 7 | `incomeTax` | 9926.0287 | 8576.3229 |
| 2019 | 7 | `gross` | 16622.6921 | 15272.9863 |
| 2019 | 7 | `avg` | -0.1257 | -0.1482 |
| 2019 | 7 | `grossAvg` | 0.277 | 0.2545 |
| 2019 | 7 | `margBy.ord` | 0.6125 | 0.6222 |
| 2019 | 7 | `margBy.cg` | 0.3063 | 0.3111 |
| 2019 | 7 | `margBy.ed` | 0.5276 | 0.541 |
| 2019 | 7 | `margBy.nd` | 0.5915 | 0.6027 |
| 2019 | 7 | `margBy.fd` | 0.6125 | 0.6288 |
| 2019 | 7 | `people.0.prov` | 4595.4935 | 3245.7876 |
| 2019 | 7 | `people.0.total` | 13535.1487 | 12185.4429 |
| 2019 | 8 | `total` | 46895.7369 | 46806.499 |
| 2019 | 8 | `prov` | 15389.6819 | 15300.444 |
| 2019 | 8 | `netTotal` | 40058.1935 | 39968.9556 |
| 2019 | 8 | `marg` | 0.436 | 0.4457 |
| 2019 | 8 | `incomeTax` | 35821.4524 | 35732.2145 |
| 2019 | 8 | `gross` | 49877.2358 | 49787.9979 |
| 2019 | 8 | `avg` | 0.3126 | 0.312 |
| 2019 | 8 | `grossAvg` | 0.3325 | 0.3319 |
| 2019 | 8 | `margBy.ord` | 0.436 | 0.4457 |
| 2019 | 8 | `margBy.cg` | 0.218 | 0.2229 |
| 2019 | 8 | `margBy.ed` | 0.284 | 0.2974 |
| 2019 | 8 | `margBy.nd` | 0.3885 | 0.3997 |
| 2019 | 8 | `margBy.fd` | 0.436 | 0.4457 |
| 2019 | 8 | `people.0.prov` | 7694.8409 | 7605.6031 |
| 2019 | 8 | `people.0.total` | 21519.8462 | 21430.6083 |
| 2019 | 10 | `total` | 18.0285 | -459.6827 |
| 2019 | 10 | `prov` | 2550.1676 | 2072.4564 |
| 2019 | 10 | `netTotal` | -3069.5149 | -3547.2261 |
| 2019 | 10 | `marg` | 0.5121 | 0.5218 |
| 2019 | 10 | `incomeTax` | 5168.6801 | 4690.9689 |
| 2019 | 10 | `gross` | 10923.2235 | 10445.5123 |
| 2019 | 10 | `avg` | 0.0004 | -0.0102 |
| 2019 | 10 | `grossAvg` | 0.2427 | 0.2321 |
| 2019 | 10 | `margBy.ord` | 0.5121 | 0.5218 |
| 2019 | 10 | `margBy.cg` | 0.2313 | 0.2361 |
| 2019 | 10 | `margBy.ed` | 0.3206 | 0.334 |
| 2019 | 10 | `margBy.nd` | 0.419 | 0.4302 |
| 2019 | 10 | `margBy.fd` | 0.4643 | 0.4876 |
| 2019 | 10 | `people.0.prov` | 2550.1676 | 2072.4564 |
| 2019 | 10 | `people.0.total` | 7342.1801 | 6864.4689 |
| 2019 | 11 | `total` | 32058.3278 | 31886.254 |
| 2019 | 11 | `prov` | 14538.3689 | 14366.2951 |
| 2019 | 11 | `netTotal` | 28970.7844 | 28798.7106 |
| 2019 | 11 | `marg` | 0.514 | 0.5237 |
| 2019 | 11 | `incomeTax` | 33525.2124 | 33353.1386 |
| 2019 | 11 | `gross` | 40221.8758 | 40049.802 |
| 2019 | 11 | `avg` | 0.2672 | 0.2657 |
| 2019 | 11 | `grossAvg` | 0.3352 | 0.3337 |
| 2019 | 11 | `margBy.ord` | 0.514 | 0.5237 |
| 2019 | 11 | `margBy.cg` | 0.257 | 0.2619 |
| 2019 | 11 | `margBy.ed` | 0.3916 | 0.4051 |
| 2019 | 11 | `margBy.nd` | 0.4782 | 0.4894 |
| 2019 | 11 | `margBy.fd` | 0.514 | 0.5237 |
| 2019 | 11 | `people.0.prov` | 14538.3689 | 14366.2951 |
| 2019 | 11 | `people.0.total` | 37134.3324 | 36962.2586 |
| 2019 | 23 | `total` | -4843.1116 | -5295.154 |
| 2019 | 23 | `prov` | 1015.47 | 563.4276 |
| 2019 | 23 | `netTotal` | -7930.655 | -8382.6974 |
| 2019 | 23 | `marg` | 0.3079 | 0.3176 |
| 2019 | 23 | `incomeTax` | 1435.845 | 983.8026 |
| 2019 | 23 | `gross` | 6360.8884 | 5908.846 |
| 2019 | 23 | `avg` | -0.1614 | -0.1765 |
| 2019 | 23 | `grossAvg` | 0.212 | 0.197 |
| 2019 | 23 | `margBy.ord` | 0.3079 | 0.3176 |
| 2019 | 23 | `margBy.cg` | 0.129 | 0.1339 |
| 2019 | 23 | `margBy.ed` | 0.0384 | 0.0518 |
| 2019 | 23 | `margBy.nd` | 0.1838 | 0.195 |
| 2019 | 23 | `margBy.fd` | 0.3594 | 0.3841 |
| 2019 | 23 | `people.0.prov` | 1015.47 | 563.4276 |
| 2019 | 23 | `people.0.total` | 3273.345 | 2821.3026 |
| 2019 | 26 | `total` | 4225.0812 | 4215.6315 |
| 2019 | 26 | `prov` | 1196.0028 | 1186.5531 |
| 2019 | 26 | `netTotal` | 2037.5378 | 2028.0881 |
| 2019 | 26 | `marg` | 0.4277 | 0.4374 |
| 2019 | 26 | `incomeTax` | 2307.3678 | 2297.9181 |
| 2019 | 26 | `gross` | 5794.8112 | 5785.3615 |
| 2019 | 26 | `avg` | 0.192 | 0.1916 |
| 2019 | 26 | `grossAvg` | 0.2634 | 0.263 |
| 2019 | 26 | `margBy.ord` | 0.4277 | 0.4374 |
| 2019 | 26 | `margBy.cg` | 0.189 | 0.1939 |
| 2019 | 26 | `margBy.ed` | 0.204 | 0.2174 |
| 2019 | 26 | `margBy.nd` | 0.3218 | 0.333 |
| 2019 | 26 | `margBy.fd` | 0.4223 | 0.4324 |
| 2019 | 26 | `people.0.prov` | 1196.0028 | 1186.5531 |
| 2019 | 26 | `people.0.total` | 3607.2678 | 3597.8181 |
| 2019 | 31 | `total` | -12150.9092 | -12360.44 |
| 2019 | 31 | `prov` | 209.5308 | 0 |
| 2019 | 31 | `netTotal` | -21189.8992 | -21399.43 |
| 2019 | 31 | `marg` | 0.2878 | 0.187 |
| 2019 | 31 | `incomeTax` | 209.5308 | 0 |
| 2019 | 31 | `gross` | 10548.4208 | 10338.89 |
| 2019 | 31 | `avg` | -0.5523 | -0.5618 |
| 2019 | 31 | `grossAvg` | 0.4795 | 0.4699 |
| 2019 | 31 | `margBy.ord` | 0.2878 | 0.187 |
| 2019 | 31 | `margBy.cg` | 0.114 | 0.06 |
| 2019 | 31 | `margBy.ed` | 0.2042 | 0.1656 |
| 2019 | 31 | `margBy.nd` | 0.2532 | 0.138 |
| 2019 | 31 | `margBy.fd` | 0.228 | 0.12 |
| 2019 | 31 | `people.0.prov` | 209.5308 | 0 |
| 2019 | 31 | `people.0.total` | 1509.4308 | 1299.9 |
| 2019 | 36 | `total` | -17623.754 | -18604.9878 |
| 2019 | 36 | `prov` | 1803.0927 | 821.8589 |
| 2019 | 36 | `netTotal` | -20662.744 | -21643.9778 |
| 2019 | 36 | `marg` | 0.557 | 0.5667 |
| 2019 | 36 | `invTax` | 5287.1552 | 4515.4522 |
| 2019 | 36 | `incomeTax` | 2478.3385 | 1497.1047 |
| 2019 | 36 | `gross` | 6817.2285 | 5835.9947 |
| 2019 | 36 | `avg` | -0.4638 | -0.4896 |
| 2019 | 36 | `grossAvg` | 0.1794 | 0.1536 |
| 2019 | 36 | `margBy.ord` | 0.557 | 0.5667 |
| 2019 | 36 | `margBy.cg` | 0.2537 | 0.2586 |
| 2019 | 36 | `margBy.ed` | 0.3827 | 0.3961 |
| 2019 | 36 | `margBy.nd` | 0.4708 | 0.4819 |
| 2019 | 36 | `margBy.fd` | 0.5075 | 0.5172 |
| 2019 | 36 | `people.0.prov` | 1803.0927 | 821.8589 |
| 2019 | 36 | `people.0.total` | 3778.2385 | 2797.0047 |
| 2019 | 37 | `total` | -1871.2699 | -2875.5481 |
| 2019 | 37 | `prov` | 4543.1066 | 3538.8284 |
| 2019 | 37 | `netTotal` | -5055.9534 | -6060.2316 |
| 2019 | 37 | `marg` | 0.557 | 0.5667 |
| 2019 | 37 | `incomeTax` | 9502.5566 | 8498.2784 |
| 2019 | 37 | `gross` | 18042.2401 | 17037.9619 |
| 2019 | 37 | `avg` | -0.022 | -0.0338 |
| 2019 | 37 | `grossAvg` | 0.2123 | 0.2004 |
| 2019 | 37 | `margBy.ord` | 0.557 | 0.5667 |
| 2019 | 37 | `margBy.cg` | 0.2537 | 0.2586 |
| 2019 | 37 | `margBy.ed` | 0.3827 | 0.3961 |
| 2019 | 37 | `margBy.nd` | 0.4708 | 0.4819 |
| 2019 | 37 | `margBy.fd` | 0.5852 | 0.6188 |
| 2019 | 37 | `people.1.prov` | 3355.2254 | 2350.9472 |
| 2019 | 37 | `people.1.total` | 10194.4904 | 9190.2122 |
| 2019 | 39 | `invTax` | 53761.874 | 54662.716 |
| 2019 | 40 | `total` | -20872.0405 | -22270.3114 |
| 2019 | 40 | `prov` | 3971.2829 | 2573.012 |
| 2019 | 40 | `netTotal` | -22309.5839 | -23707.8548 |
| 2019 | 40 | `marg` | 0.6498 | 0.6595 |
| 2019 | 40 | `incomeTax` | 8295.3761 | 6897.1052 |
| 2019 | 40 | `gross` | 13219.6395 | 11821.3686 |
| 2019 | 40 | `avg` | -0.3795 | -0.4049 |
| 2019 | 40 | `grossAvg` | 0.2404 | 0.2149 |
| 2019 | 40 | `margBy.ord` | 0.6498 | 0.6595 |
| 2019 | 40 | `margBy.cg` | 0.3063 | 0.3111 |
| 2019 | 40 | `margBy.ed` | 0.5276 | 0.541 |
| 2019 | 40 | `margBy.nd` | 0.5915 | 0.6027 |
| 2019 | 40 | `margBy.fd` | 0.6125 | 0.6462 |
| 2019 | 40 | `people.0.prov` | 3971.2829 | 2573.012 |
| 2019 | 40 | `people.0.total` | 11782.0961 | 10383.8252 |
| 2019 | 49 | `total` | 3698.9672 | 3392.6686 |
| 2019 | 49 | `prov` | 5463.6018 | 5157.3033 |
| 2019 | 49 | `netTotal` | -2340.0228 | -2646.3214 |
| 2019 | 49 | `marg` | 0.5086 | 0.5183 |
| 2019 | 49 | `invTax` | 16067.5464 | 15970.7786 |
| 2019 | 49 | `incomeTax` | 8730.5772 | 8424.2786 |
| 2019 | 49 | `gross` | 16069.4672 | 15763.1686 |
| 2019 | 49 | `avg` | 0.0536 | 0.0492 |
| 2019 | 49 | `grossAvg` | 0.2329 | 0.2285 |
| 2019 | 49 | `margBy.ord` | 0.5086 | 0.5183 |
| 2019 | 49 | `margBy.cg` | 0.2295 | 0.2344 |
| 2019 | 49 | `margBy.ed` | 0.3157 | 0.3292 |
| 2019 | 49 | `margBy.nd` | 0.415 | 0.4262 |
| 2019 | 49 | `margBy.fd` | 0.459 | 0.4687 |
| 2019 | 49 | `people.0.prov` | 5463.6018 | 5157.3033 |
| 2019 | 49 | `people.0.total` | 10030.4772 | 9724.1786 |
| 2019 | 55 | `total` | 39320.6362 | 39212.3255 |
| 2019 | 55 | `prov` | 14355.0089 | 14246.6983 |
| 2019 | 55 | `netTotal` | 26641.3428 | 26533.0321 |
| 2019 | 55 | `marg` | 0.529 | 0.5387 |
| 2019 | 55 | `invTax` | 17604.4694 | 18008.4326 |
| 2019 | 55 | `incomeTax` | 32560.1736 | 32451.8629 |
| 2019 | 55 | `gross` | 48848.587 | 48740.2763 |
| 2019 | 55 | `avg` | 0.2675 | 0.2668 |
| 2019 | 55 | `grossAvg` | 0.3323 | 0.3316 |
| 2019 | 55 | `margBy.ord` | 0.529 | 0.5387 |
| 2019 | 55 | `margBy.cg` | 0.2645 | 0.2694 |
| 2019 | 55 | `margBy.ed` | 0.4123 | 0.4258 |
| 2019 | 55 | `margBy.nd` | 0.4955 | 0.5067 |
| 2019 | 55 | `margBy.fd` | 0.529 | 0.5387 |
| 2019 | 55 | `people.0.prov` | 14355.0089 | 14246.6983 |
| 2019 | 55 | `people.0.total` | 36169.2936 | 36060.9829 |
| 2019 | 56 | `total` | 5825.0228 | 5766.9731 |
| 2019 | 56 | `prov` | 656.0028 | 597.9531 |
| 2019 | 56 | `netTotal` | 149.3328 | 91.2831 |
| 2019 | 56 | `marg` | 0.4097 | 0.4194 |
| 2019 | 56 | `incomeTax` | 1017.3678 | 959.3181 |
| 2019 | 56 | `gross` | 7992.9578 | 7934.9081 |
| 2019 | 56 | `avg` | 0.2648 | 0.2621 |
| 2019 | 56 | `grossAvg` | 0.3633 | 0.3607 |
| 2019 | 56 | `margBy.ord` | 0.4097 | 0.4194 |
| 2019 | 56 | `margBy.cg` | 0.179 | 0.1839 |
| 2019 | 56 | `margBy.ed` | 0.186 | 0.1994 |
| 2019 | 56 | `margBy.nd` | 0.3039 | 0.3151 |
| 2019 | 56 | `margBy.fd` | 0.4489 | 0.462 |
| 2019 | 56 | `people.0.prov` | 656.0028 | 597.9531 |
| 2019 | 56 | `people.0.total` | 2317.2678 | 2259.2181 |
| 2019 | 57 | `total` | -10542.2157 | -10751.7465 |
| 2019 | 57 | `prov` | 209.5308 | 0 |
| 2019 | 57 | `netTotal` | -21526.8992 | -21736.43 |
| 2019 | 57 | `marg` | 0.2878 | 0.187 |
| 2019 | 57 | `incomeTax` | 209.5308 | 0 |
| 2019 | 57 | `gross` | 12494.1143 | 12284.5835 |
| 2019 | 57 | `avg` | -0.4792 | -0.4887 |
| 2019 | 57 | `grossAvg` | 0.5679 | 0.5584 |
| 2019 | 57 | `margBy.ord` | 0.2878 | 0.187 |
| 2019 | 57 | `margBy.cg` | 0.114 | 0.06 |
| 2019 | 57 | `margBy.ed` | 0.2042 | 0.1656 |
| 2019 | 57 | `margBy.nd` | 0.2532 | 0.138 |
| 2019 | 57 | `margBy.fd` | 0.368 | 0.27 |
| 2019 | 57 | `people.0.prov` | 209.5308 | 0 |
| 2019 | 57 | `people.0.total` | 1509.4308 | 1299.9 |
| 2019 | 60 | `total` | 3168.2077 | 2638.522 |
| 2019 | 60 | `prov` | 1072.8018 | 543.1161 |
| 2019 | 60 | `netTotal` | -5919.3357 | -6449.0214 |
| 2019 | 60 | `incomeTax` | 1572.8043 | 1043.1186 |
| 2019 | 60 | `gross` | 12319.3477 | 11789.662 |
| 2019 | 60 | `avg` | 0.1056 | 0.088 |
| 2019 | 60 | `grossAvg` | 0.4106 | 0.393 |
| 2019 | 60 | `people.0.prov` | 1072.8018 | 543.1161 |
| 2019 | 60 | `people.0.total` | 2872.7043 | 2343.0186 |
| 2019 | 61 | `total` | 16883.2483 | 16502.9504 |
| 2019 | 61 | `prov` | 5615.4935 | 5235.1956 |
| 2019 | 61 | `netTotal` | 7844.2583 | 7463.9604 |
| 2019 | 61 | `marg` | 0.3895 | 0.3992 |
| 2019 | 61 | `incomeTax` | 12586.0287 | 12205.7309 |
| 2019 | 61 | `gross` | 25234.1387 | 24853.8409 |
| 2019 | 61 | `avg` | 0.2483 | 0.2427 |
| 2019 | 61 | `grossAvg` | 0.3711 | 0.3655 |
| 2019 | 61 | `margBy.ord` | 0.3895 | 0.3992 |
| 2019 | 61 | `margBy.cg` | 0.1948 | 0.1996 |
| 2019 | 61 | `margBy.ed` | 0.2198 | 0.2333 |
| 2019 | 61 | `margBy.nd` | 0.3351 | 0.3462 |
| 2019 | 61 | `margBy.fd` | 0.3895 | 0.3992 |
| 2019 | 61 | `people.0.prov` | 5615.4935 | 5235.1956 |
| 2019 | 61 | `people.0.total` | 16195.1487 | 15814.8509 |
| 2019 | 63 | `total` | 2994.7975 | 2785.3906 |
| 2019 | 63 | `prov` | 3971.2829 | 3761.876 |
| 2019 | 63 | `netTotal` | 691.1549 | 481.748 |
| 2019 | 63 | `marg` | 0.555 | 0.5647 |
| 2019 | 63 | `incomeTax` | 8295.3761 | 8085.9692 |
| 2019 | 63 | `gross` | 14085.7387 | 13876.3318 |
| 2019 | 63 | `avg` | 0.0545 | 0.0506 |
| 2019 | 63 | `grossAvg` | 0.2561 | 0.2523 |
| 2019 | 63 | `margBy.ord` | 0.555 | 0.5647 |
| 2019 | 63 | `margBy.cg` | 0.2588 | 0.2636 |
| 2019 | 63 | `margBy.ed` | 0.3965 | 0.4099 |
| 2019 | 63 | `margBy.nd` | 0.4823 | 0.4934 |
| 2019 | 63 | `margBy.fd` | 0.5175 | 0.5272 |
| 2019 | 63 | `people.0.prov` | 3971.2829 | 3761.876 |
| 2019 | 63 | `people.0.total` | 11782.0961 | 11572.6892 |
| 2019 | 64 | `total` | 8112.988 | 7435.4741 |
| 2019 | 64 | `prov` | 5615.4935 | 4937.9796 |
| 2019 | 64 | `netTotal` | -926.002 | -1603.5159 |
| 2019 | 64 | `marg` | 0.4275 | 0.4372 |
| 2019 | 64 | `incomeTax` | 12586.0287 | 11908.5149 |
| 2019 | 64 | `gross` | 25234.1387 | 24556.6249 |
| 2019 | 64 | `avg` | 0.1193 | 0.1093 |
| 2019 | 64 | `grossAvg` | 0.3711 | 0.3611 |
| 2019 | 64 | `margBy.ord` | 0.4275 | 0.4372 |
| 2019 | 64 | `margBy.cg` | 0.2138 | 0.2186 |
| 2019 | 64 | `margBy.ed` | 0.2723 | 0.2857 |
| 2019 | 64 | `margBy.nd` | 0.3788 | 0.3899 |
| 2019 | 64 | `margBy.fd` | 0.492 | 0.5116 |
| 2019 | 64 | `people.0.prov` | 5615.4935 | 4937.9796 |
| 2019 | 64 | `people.0.total` | 16195.1487 | 15517.6349 |
| 2019 | 65 | `total` | 22115.3278 | 21748.854 |
| 2019 | 65 | `prov` | 11058.3689 | 10691.8951 |
| 2019 | 65 | `netTotal` | 19027.7844 | 18661.3106 |
| 2019 | 65 | `marg` | 0.514 | 0.5237 |
| 2019 | 65 | `incomeTax` | 24845.2124 | 24478.7386 |
| 2019 | 65 | `gross` | 31541.8758 | 31175.402 |
| 2019 | 65 | `avg` | 0.2212 | 0.2175 |
| 2019 | 65 | `grossAvg` | 0.3154 | 0.3118 |
| 2019 | 65 | `margBy.ord` | 0.514 | 0.5237 |
| 2019 | 65 | `margBy.cg` | 0.257 | 0.2619 |
| 2019 | 65 | `margBy.ed` | 0.3916 | 0.4051 |
| 2019 | 65 | `margBy.nd` | 0.4782 | 0.4894 |
| 2019 | 65 | `margBy.fd` | 0.514 | 0.5237 |
| 2019 | 65 | `people.0.prov` | 11058.3689 | 10691.8951 |
| 2019 | 65 | `people.0.total` | 28454.3324 | 28087.8586 |
| 2019 | 66 | `total` | 2237.8634 | 1628.3896 |
| 2019 | 66 | `prov` | 6708.3689 | 6098.8951 |
| 2019 | 66 | `netTotal` | 848.8734 | 239.3996 |
| 2019 | 66 | `marg` | 0.474 | 0.4837 |
| 2019 | 66 | `incomeTax` | 15113.9042 | 14504.4303 |
| 2019 | 66 | `gross` | 20112.0142 | 19502.5403 |
| 2019 | 66 | `avg` | 0.0298 | 0.0217 |
| 2019 | 66 | `grossAvg` | 0.2682 | 0.26 |
| 2019 | 66 | `margBy.ord` | 0.474 | 0.4837 |
| 2019 | 66 | `margBy.cg` | 0.237 | 0.2419 |
| 2019 | 66 | `margBy.ed` | 0.3364 | 0.3499 |
| 2019 | 66 | `margBy.nd` | 0.4322 | 0.4434 |
| 2019 | 66 | `margBy.fd` | 0.474 | 0.4837 |
| 2019 | 66 | `people.0.prov` | 6708.3689 | 6098.8951 |
| 2019 | 66 | `people.0.total` | 18723.0242 | 18113.5503 |
| 2019 | 69 | `total` | 36626.5762 | 35942.9063 |
| 2019 | 69 | `prov` | 9696.7829 | 9013.1131 |
| 2019 | 69 | `netTotal` | 16054.0862 | 15370.4163 |
| 2019 | 69 | `marg` | 0.474 | 0.4837 |
| 2019 | 69 | `incomeTax` | 22143.3932 | 21459.7233 |
| 2019 | 69 | `gross` | 48162.5032 | 47478.8333 |
| 2019 | 69 | `avg` | 0.3488 | 0.3423 |
| 2019 | 69 | `grossAvg` | 0.4587 | 0.4522 |
| 2019 | 69 | `margBy.ord` | 0.474 | 0.4837 |
| 2019 | 69 | `margBy.cg` | 0.237 | 0.2419 |
| 2019 | 69 | `margBy.ed` | 0.3364 | 0.3499 |
| 2019 | 69 | `margBy.nd` | 0.4322 | 0.4434 |
| 2019 | 69 | `margBy.fd` | 0.474 | 0.4837 |
| 2019 | 69 | `people.0.prov` | 7694.8409 | 7011.1711 |
| 2019 | 69 | `people.0.total` | 21519.8462 | 20836.1763 |
| 2019 | 70 | `total` | 6999.4273 | 6560.7934 |
| 2019 | 70 | `prov` | 4483.5314 | 4044.8975 |
| 2019 | 70 | `netTotal` | 3911.8839 | 3473.25 |
| 2019 | 70 | `marg` | 0.4427 | 0.4524 |
| 2019 | 70 | `incomeTax` | 9224.8214 | 8786.1875 |
| 2019 | 70 | `gross` | 16121.7648 | 15683.1309 |
| 2019 | 70 | `avg` | 0.1129 | 0.1058 |
| 2019 | 70 | `grossAvg` | 0.26 | 0.253 |
| 2019 | 70 | `margBy.ord` | 0.4427 | 0.4524 |
| 2019 | 70 | `margBy.cg` | 0.1965 | 0.2014 |
| 2019 | 70 | `margBy.ed` | 0.2247 | 0.2381 |
| 2019 | 70 | `margBy.nd` | 0.3391 | 0.3503 |
| 2019 | 70 | `margBy.fd` | 0.6 | 0.6148 |
| 2019 | 70 | `people.0.prov` | 3992.7254 | 3631.4792 |
| 2019 | 70 | `people.0.total` | 11581.9904 | 11220.7442 |
| 2019 | 70 | `people.1.prov` | 490.806 | 413.4183 |
| 2019 | 70 | `people.1.total` | 1452.231 | 1374.8433 |
| 2019 | 71 | `invTax` | 11019.7698 | 11097.1575 |
| 2019 | 73 | `invTax` | 6960.1136 | 7037.5012 |
| 2019 | 76 | `invTax` | 33051.6275 | 33429.3334 |
| 2019 | 79 | `total` | -14596.435 | -15611.905 |
| 2019 | 79 | `prov` | 1015.47 | 0 |
| 2019 | 79 | `netTotal` | -16435.425 | -17450.895 |
| 2019 | 79 | `marg` | 0.4277 | 0.3269 |
| 2019 | 79 | `incomeTax` | 1435.845 | 420.375 |
| 2019 | 79 | `gross` | 5112.335 | 4096.865 |
| 2019 | 79 | `avg` | -0.4865 | -0.5204 |
| 2019 | 79 | `grossAvg` | 0.1704 | 0.1366 |
| 2019 | 79 | `margBy.ord` | 0.4277 | 0.3269 |
| 2019 | 79 | `margBy.cg` | 0.189 | 0.135 |
| 2019 | 79 | `margBy.ed` | 0.204 | 0.1653 |
| 2019 | 79 | `margBy.nd` | 0.3218 | 0.2067 |
| 2019 | 79 | `margBy.fd` | 0.4794 | 0.4055 |
| 2019 | 79 | `people.0.prov` | 1015.47 | 0 |
| 2019 | 79 | `people.0.total` | 3273.345 | 2257.875 |
| 2019 | 80 | `total` | -29400.106 | -30021.2966 |
| 2019 | 80 | `prov` | 621.1906 | 0 |
| 2019 | 80 | `netTotal` | -30837.6494 | -31458.84 |
| 2019 | 80 | `marg` | 0.467 | 0.3468 |
| 2019 | 80 | `invTax` | 9868.2506 | 9247.06 |
| 2019 | 80 | `incomeTax` | 621.1906 | 0 |
| 2019 | 80 | `gross` | 2417.834 | 1796.6434 |
| 2019 | 80 | `avg` | -0.4027 | -0.4113 |
| 2019 | 80 | `grossAvg` | 0.0331 | 0.0246 |
| 2019 | 80 | `margBy.ord` | 0.467 | 0.3468 |
| 2019 | 80 | `margBy.cg` | 0.2037 | 0.14 |
| 2019 | 80 | `margBy.ed` | 0.4519 | 0.3864 |
| 2019 | 80 | `margBy.nd` | 0.4596 | 0.322 |
| 2019 | 80 | `margBy.fd` | 0.5471 | 0.43 |
| 2019 | 80 | `people.0.pDtc` | 4416 | 3397.793 |
| 2019 | 80 | `people.0.prov` | 621.1906 | 0 |
| 2019 | 80 | `people.0.total` | 980.2906 | 359.1 |
| 2019 | 82 | `total` | -25301.3173 | -25502.7265 |
| 2019 | 82 | `prov` | 201.4092 | 0 |
| 2019 | 82 | `netTotal` | -35322.7008 | -35524.11 |
| 2019 | 82 | `marg` | 0.2878 | 0.187 |
| 2019 | 82 | `incomeTax` | 201.4092 | 0 |
| 2019 | 82 | `gross` | 12597.8927 | 12396.4835 |
| 2019 | 82 | `avg` | -0.6658 | -0.6711 |
| 2019 | 82 | `grossAvg` | 0.3315 | 0.3262 |
| 2019 | 82 | `margBy.ord` | 0.2878 | 0.187 |
| 2019 | 82 | `margBy.cg` | 0.114 | 0.06 |
| 2019 | 82 | `margBy.ed` | 0.2042 | 0.1656 |
| 2019 | 82 | `margBy.nd` | 0.2532 | 0.138 |
| 2019 | 82 | `margBy.fd` | 0.4688 | 0.37 |
| 2019 | 82 | `people.0.prov` | 201.4092 | 0 |
| 2019 | 82 | `people.0.total` | 2576.5092 | 2375.1 |
| 2019 | 83 | `invTax` | 49264.0954 | 49273.5452 |
| 2019 | 89 | `total` | 13554.3752 | 12676.3403 |
| 2019 | 89 | `prov` | 7231.0619 | 6353.0271 |
| 2019 | 89 | `netTotal` | 5478.6852 | 4600.6503 |
| 2019 | 89 | `marg` | 0.4651 | 0.4748 |
| 2019 | 89 | `incomeTax` | 15965.5902 | 15087.5553 |
| 2019 | 89 | `gross` | 29903.1002 | 29025.0653 |
| 2019 | 89 | `avg` | 0.1457 | 0.1363 |
| 2019 | 89 | `grossAvg` | 0.3215 | 0.3121 |
| 2019 | 89 | `margBy.ord` | 0.4651 | 0.4748 |
| 2019 | 89 | `margBy.cg` | 0.2138 | 0.2186 |
| 2019 | 89 | `margBy.ed` | 0.2723 | 0.2857 |
| 2019 | 89 | `margBy.nd` | 0.3788 | 0.3899 |
| 2019 | 89 | `margBy.fd` | 0.4275 | 0.4372 |
| 2019 | 89 | `people.0.prov` | 4957.7549 | 4079.72 |
| 2019 | 89 | `people.0.total` | 14578.9181 | 13700.8832 |
| 2019 | 97 | `total` | 10577.1436 | 10451.3606 |
| 2019 | 97 | `prov` | 1286.8351 | 1161.0521 |
| 2019 | 97 | `netTotal` | 3192.4601 | 3066.6771 |
| 2019 | 97 | `marg` | 0.4472 | 0.4569 |
| 2019 | 97 | `incomeTax` | 2076.5701 | 1950.7871 |
| 2019 | 97 | `gross` | 11836.3536 | 11710.5706 |
| 2019 | 97 | `avg` | 0.2783 | 0.275 |
| 2019 | 97 | `grossAvg` | 0.3115 | 0.3082 |
| 2019 | 97 | `margBy.ord` | 0.4472 | 0.4569 |
| 2019 | 97 | `margBy.cg` | 0.1988 | 0.2036 |
| 2019 | 97 | `margBy.ed` | 0.2309 | 0.2443 |
| 2019 | 97 | `margBy.nd` | 0.3443 | 0.3554 |
| 2019 | 97 | `margBy.fd` | 0.4838 | 0.4973 |
| 2019 | 97 | `people.0.prov` | 1286.8351 | 1161.0521 |
| 2019 | 97 | `people.0.total` | 4451.6701 | 4325.8871 |
| 2019 | 98 | `total` | 1803.0285 | 571.1267 |
| 2019 | 98 | `prov` | 8342.2667 | 7110.365 |
| 2019 | 98 | `netTotal` | -2450.6141 | -3682.5159 |
| 2019 | 98 | `marg` | 0.5235 | 0.5332 |
| 2019 | 98 | `invTax` | 10761.4326 | 11089.0909 |
| 2019 | 98 | `incomeTax` | 16189.3909 | 14957.4891 |
| 2019 | 98 | `gross` | 24722.8335 | 23490.9317 |
| 2019 | 98 | `avg` | 0.0158 | 0.005 |
| 2019 | 98 | `grossAvg` | 0.2169 | 0.2061 |
| 2019 | 98 | `margBy.ord` | 0.5235 | 0.5332 |
| 2019 | 98 | `margBy.cg` | 0.237 | 0.2419 |
| 2019 | 98 | `margBy.ed` | 0.3364 | 0.3499 |
| 2019 | 98 | `margBy.nd` | 0.4322 | 0.4434 |
| 2019 | 98 | `margBy.fd` | 0.5284 | 0.5536 |
| 2019 | 98 | `people.0.prov` | 4349.5413 | 3117.6396 |
| 2019 | 98 | `people.0.total` | 8887.2005 | 7655.2987 |
| 2019 | 99 | `total` | -27247.665 | -28263.135 |
| 2019 | 99 | `prov` | 1015.47 | 0 |
| 2019 | 99 | `netTotal` | -34486.655 | -35502.125 |
| 2019 | 99 | `marg` | 0.3079 | 0.2071 |
| 2019 | 99 | `incomeTax` | 1435.845 | 420.375 |
| 2019 | 99 | `gross` | 10512.335 | 9496.865 |
| 2019 | 99 | `avg` | -0.9083 | -0.9421 |
| 2019 | 99 | `grossAvg` | 0.3504 | 0.3166 |
| 2019 | 99 | `margBy.ord` | 0.3079 | 0.2071 |
| 2019 | 99 | `margBy.cg` | 0.129 | 0.075 |
| 2019 | 99 | `margBy.ed` | 0.0384 | -0.0003 |
| 2019 | 99 | `margBy.nd` | 0.1838 | 0.0687 |
| 2019 | 99 | `margBy.fd` | 0.3594 | 0.2855 |
| 2019 | 99 | `people.0.prov` | 1015.47 | 0 |
| 2019 | 99 | `people.0.total` | 3273.345 | 2257.875 |
| 2019 | 100 | `total` | -13260.1574 | -13461.5666 |
| 2019 | 100 | `prov` | 201.4092 | 0 |
| 2019 | 100 | `netTotal` | -19347.7008 | -19549.11 |
| 2019 | 100 | `marg` | 0.2878 | 0.187 |
| 2019 | 100 | `incomeTax` | 201.4092 | 0 |
| 2019 | 100 | `gross` | 8664.0526 | 8462.6434 |
| 2019 | 100 | `avg` | -0.349 | -0.3543 |
| 2019 | 100 | `grossAvg` | 0.228 | 0.2227 |
| 2019 | 100 | `margBy.ord` | 0.2878 | 0.187 |
| 2019 | 100 | `margBy.cg` | 0.114 | 0.06 |
| 2019 | 100 | `margBy.ed` | 0.2042 | 0.1656 |
| 2019 | 100 | `margBy.nd` | 0.2532 | 0.138 |
| 2019 | 100 | `margBy.fd` | 0.228 | 0.12 |
| 2019 | 100 | `people.0.prov` | 201.4092 | 0 |
| 2019 | 100 | `people.0.total` | 2576.5092 | 2375.1 |
| 2019 | 101 | `total` | 3866.7815 | 3262.9236 |
| 2019 | 101 | `prov` | 2682.9935 | 2079.1356 |
| 2019 | 101 | `netTotal` | -7208.9085 | -7812.7664 |
| 2019 | 101 | `marg` | 0.5175 | 0.5272 |
| 2019 | 101 | `incomeTax` | 5087.6255 | 4483.7676 |
| 2019 | 101 | `gross` | 19772.4355 | 19168.5776 |
| 2019 | 101 | `avg` | 0.0516 | 0.0435 |
| 2019 | 101 | `grossAvg` | 0.2636 | 0.2556 |
| 2019 | 101 | `margBy.ord` | 0.5175 | 0.5272 |
| 2019 | 101 | `margBy.cg` | 0.2588 | 0.2636 |
| 2019 | 101 | `margBy.ed` | 0.3965 | 0.4099 |
| 2019 | 101 | `margBy.nd` | 0.4823 | 0.4934 |
| 2019 | 101 | `margBy.fd` | 0.5539 | 0.577 |
| 2019 | 101 | `people.0.prov` | 2682.9935 | 2079.1356 |
| 2019 | 101 | `people.0.total` | 8696.7455 | 8092.8876 |
| 2019 | 103 | `total` | 4138.4527 | 4061.2697 |
| 2019 | 103 | `prov` | 1924.3351 | 1847.1521 |
| 2019 | 103 | `netTotal` | -2001.8899 | -2079.0729 |
| 2019 | 103 | `marg` | 0.4472 | 0.4569 |
| 2019 | 103 | `incomeTax` | 3464.0701 | 3386.8871 |
| 2019 | 103 | `gross` | 11979.5127 | 11902.3297 |
| 2019 | 103 | `avg` | 0.1089 | 0.1069 |
| 2019 | 103 | `grossAvg` | 0.3153 | 0.3132 |
| 2019 | 103 | `margBy.ord` | 0.4472 | 0.4569 |
| 2019 | 103 | `margBy.cg` | 0.1988 | 0.2036 |
| 2019 | 103 | `margBy.ed` | 0.2309 | 0.2443 |
| 2019 | 103 | `margBy.nd` | 0.3443 | 0.3554 |
| 2019 | 103 | `margBy.fd` | 0.5557 | 0.5674 |
| 2019 | 103 | `people.0.prov` | 1924.3351 | 1847.1521 |
| 2019 | 103 | `people.0.total` | 5839.1701 | 5761.9871 |
| 2019 | 107 | `total` | 21919.1707 | 21461.1128 |
| 2019 | 107 | `prov` | 4595.4935 | 4137.4356 |
| 2019 | 107 | `netTotal` | -1949.0128 | -2407.0706 |
| 2019 | 107 | `marg` | 0.5225 | 0.5322 |
| 2019 | 107 | `incomeTax` | 9926.0287 | 9467.9709 |
| 2019 | 107 | `gross` | 37403.3322 | 36945.2743 |
| 2019 | 107 | `avg` | 0.2923 | 0.2861 |
| 2019 | 107 | `grossAvg` | 0.4987 | 0.4926 |
| 2019 | 107 | `margBy.ord` | 0.5225 | 0.5322 |
| 2019 | 107 | `margBy.cg` | 0.2613 | 0.2661 |
| 2019 | 107 | `margBy.ed` | 0.4034 | 0.4168 |
| 2019 | 107 | `margBy.nd` | 0.488 | 0.4992 |
| 2019 | 107 | `margBy.fd` | 0.5225 | 0.5322 |
| 2019 | 107 | `people.0.prov` | 4595.4935 | 4137.4356 |
| 2019 | 107 | `people.0.total` | 13535.1487 | 13077.0909 |
| 2019 | 110 | `invTax` | 28935.8864 | 29145.4172 |
| 2019 | 113 | `invTax` | 5644.5614 | 5702.9757 |
| 2019 | 114 | `total` | 16425.017 | 16355.7277 |
| 2019 | 114 | `prov` | 10275.679 | 10206.3897 |
| 2019 | 114 | `netTotal` | 14586.027 | 14516.7377 |
| 2019 | 114 | `marg` | 0.5572 | 0.5666 |
| 2019 | 114 | `invTax` | 21676.056 | 22191.033 |
| 2019 | 114 | `incomeTax` | 21006.627 | 20937.3377 |
| 2019 | 114 | `gross` | 25825.517 | 25756.2277 |
| 2019 | 114 | `avg` | 0.1535 | 0.1529 |
| 2019 | 114 | `grossAvg` | 0.2414 | 0.2407 |
| 2019 | 114 | `margBy.ord` | 0.5572 | 0.5666 |
| 2019 | 114 | `margBy.cg` | 0.2536 | 0.2583 |
| 2019 | 114 | `margBy.ed` | 0.3919 | 0.4049 |
| 2019 | 114 | `margBy.nd` | 0.4739 | 0.4847 |
| 2019 | 114 | `margBy.fd` | 0.5475 | 0.5576 |
| 2019 | 114 | `people.0.pFtc` | 318.8078 | 316.658 |
| 2019 | 114 | `people.0.prov` | 10275.679 | 10206.3897 |
| 2019 | 114 | `people.0.total` | 23986.527 | 23917.2377 |
| 2019 | 116 | `total` | -5750.3283 | -7387.7874 |
| 2019 | 116 | `prov` | 5821.6141 | 4184.1551 |
| 2019 | 116 | `netTotal` | -12539.3183 | -14176.7774 |
| 2019 | 116 | `marg` | 0.4222 | 0.4319 |
| 2019 | 116 | `incomeTax` | 12521.7842 | 10884.3251 |
| 2019 | 116 | `gross` | 24060.9742 | 22423.5151 |
| 2019 | 116 | `avg` | -0.0757 | -0.0972 |
| 2019 | 116 | `grossAvg` | 0.3166 | 0.295 |
| 2019 | 116 | `margBy.ord` | 0.4222 | 0.4319 |
| 2019 | 116 | `margBy.cg` | 0.1863 | 0.1911 |
| 2019 | 116 | `margBy.ed` | 0.1964 | 0.2098 |
| 2019 | 116 | `margBy.nd` | 0.3155 | 0.3267 |
| 2019 | 116 | `margBy.fd` | 0.4572 | 0.51 |
| 2019 | 116 | `people.0.prov` | 2910.8071 | 1273.3481 |
| 2019 | 116 | `people.0.total` | 8635.9921 | 6998.5331 |
| 2019 | 117 | `invTax` | 22530.3782 | 22539.8279 |
| 2019 | 119 | `total` | -14770.435 | -15785.905 |
| 2019 | 119 | `prov` | 1015.47 | 0 |
| 2019 | 119 | `netTotal` | -17809.425 | -18824.895 |
| 2019 | 119 | `marg` | 0.4277 | 0.3269 |
| 2019 | 119 | `incomeTax` | 1435.845 | 420.375 |
| 2019 | 119 | `gross` | 6312.335 | 5296.865 |
| 2019 | 119 | `avg` | -0.4923 | -0.5262 |
| 2019 | 119 | `grossAvg` | 0.2104 | 0.1766 |
| 2019 | 119 | `margBy.ord` | 0.4277 | 0.3269 |
| 2019 | 119 | `margBy.cg` | 0.189 | 0.135 |
| 2019 | 119 | `margBy.ed` | 0.204 | 0.1653 |
| 2019 | 119 | `margBy.nd` | 0.3218 | 0.2067 |
| 2019 | 119 | `margBy.fd` | 0.378 | 0.27 |
| 2019 | 119 | `people.0.prov` | 1015.47 | 0 |
| 2019 | 119 | `people.0.total` | 3273.345 | 2257.875 |
| 2019 | 121 | `total` | -11335.3799 | -12304.2109 |
| 2019 | 121 | `prov` | 1924.3351 | 955.5041 |
| 2019 | 121 | `netTotal` | -20374.3699 | -21343.2009 |
| 2019 | 121 | `marg` | 0.6069 | 0.6166 |
| 2019 | 121 | `incomeTax` | 3464.0701 | 2495.2391 |
| 2019 | 121 | `gross` | 14878.1601 | 13909.3291 |
| 2019 | 121 | `avg` | -0.2983 | -0.3238 |
| 2019 | 121 | `grossAvg` | 0.3915 | 0.366 |
| 2019 | 121 | `margBy.ord` | 0.6069 | 0.6166 |
| 2019 | 121 | `margBy.cg` | 0.2788 | 0.2836 |
| 2019 | 121 | `margBy.ed` | 0.4517 | 0.4651 |
| 2019 | 121 | `margBy.nd` | 0.5283 | 0.5394 |
| 2019 | 121 | `margBy.fd` | 0.6157 | 0.6509 |
| 2019 | 121 | `people.0.prov` | 1924.3351 | 955.5041 |
| 2019 | 121 | `people.0.total` | 5839.1701 | 4870.3391 |
| 2019 | 123 | `total` | 33986.6491 | 33240.5552 |
| 2019 | 123 | `prov` | 4778.9075 | 4032.8136 |
| 2019 | 123 | `netTotal` | 5749.5065 | 5003.4126 |
| 2019 | 123 | `incomeTax` | 10174.6145 | 9428.5206 |
| 2019 | 123 | `gross` | 43858.3771 | 43112.2832 |
| 2019 | 123 | `avg` | 0.3468 | 0.3392 |
| 2019 | 123 | `grossAvg` | 0.4475 | 0.4399 |
| 2019 | 123 | `people.1.prov` | 2776.9655 | 2030.8716 |
| 2019 | 123 | `people.1.total` | 9551.0675 | 8804.9736 |
| 2019 | 124 | `total` | 16168.2778 | 16158.8281 |
| 2019 | 124 | `prov` | 1196.0028 | 1186.5531 |
| 2019 | 124 | `netTotal` | 2037.5378 | 2028.0881 |
| 2019 | 124 | `marg` | 0.4277 | 0.4374 |
| 2019 | 124 | `incomeTax` | 2307.3678 | 2297.9181 |
| 2019 | 124 | `gross` | 17738.0078 | 17728.5581 |
| 2019 | 124 | `avg` | 0.7349 | 0.7345 |
| 2019 | 124 | `grossAvg` | 0.8063 | 0.8058 |
| 2019 | 124 | `margBy.ord` | 0.4277 | 0.4374 |
| 2019 | 124 | `margBy.cg` | 0.189 | 0.1939 |
| 2019 | 124 | `margBy.ed` | 0.204 | 0.2174 |
| 2019 | 124 | `margBy.nd` | 0.3218 | 0.333 |
| 2019 | 124 | `margBy.fd` | 0.4223 | 0.4324 |
| 2019 | 124 | `people.0.prov` | 1196.0028 | 1186.5531 |
| 2019 | 124 | `people.0.total` | 3607.2678 | 3597.8181 |
| 2019 | 126 | `invTax` | 19406.9978 | 19579.0717 |
| 2019 | 127 | `total` | 13301.556 | 13016.1603 |
| 2019 | 127 | `prov` | 6189.0524 | 5903.6567 |
| 2019 | 127 | `netTotal` | 8916.8725 | 8631.4768 |
| 2019 | 127 | `marg` | 0.4965 | 0.5062 |
| 2019 | 127 | `invTax` | 10639.5664 | 10860.7936 |
| 2019 | 127 | `incomeTax` | 15556.6125 | 15271.2168 |
| 2019 | 127 | `gross` | 23428.016 | 23142.6203 |
| 2019 | 127 | `avg` | 0.1727 | 0.169 |
| 2019 | 127 | `grossAvg` | 0.3043 | 0.3006 |
| 2019 | 127 | `margBy.ord` | 0.4965 | 0.5062 |
| 2019 | 127 | `margBy.cg` | 0.2295 | 0.2344 |
| 2019 | 127 | `margBy.ed` | 0.3157 | 0.3292 |
| 2019 | 127 | `margBy.nd` | 0.415 | 0.4262 |
| 2019 | 127 | `margBy.fd` | 0.459 | 0.4687 |
| 2019 | 127 | `people.0.prov` | 6189.0524 | 5903.6567 |
| 2019 | 127 | `people.0.total` | 19043.3325 | 18757.9368 |
| 2019 | 128 | `total` | 14462.881 | 14175.8308 |
| 2019 | 128 | `prov` | 3006.2534 | 2719.2032 |
| 2019 | 128 | `netTotal` | 3017.4884 | 2730.4382 |
| 2019 | 128 | `marg` | 0.4472 | 0.4569 |
| 2019 | 128 | `incomeTax` | 5805.2684 | 5518.2182 |
| 2019 | 128 | `gross` | 20230.561 | 19943.5108 |
| 2019 | 128 | `avg` | 0.3077 | 0.3016 |
| 2019 | 128 | `grossAvg` | 0.4304 | 0.4243 |
| 2019 | 128 | `margBy.ord` | 0.4472 | 0.4569 |
| 2019 | 128 | `margBy.cg` | 0.1988 | 0.2036 |
| 2019 | 128 | `margBy.ed` | 0.2309 | 0.2443 |
| 2019 | 128 | `margBy.nd` | 0.3443 | 0.3554 |
| 2019 | 128 | `margBy.fd` | 0.5235 | 0.5393 |
| 2019 | 128 | `people.0.prov` | 3006.2534 | 2719.2032 |
| 2019 | 128 | `people.0.total` | 8785.1684 | 8498.1182 |
| 2019 | 133 | `total` | -7363.923 | -8903.6444 |
| 2019 | 133 | `prov` | 5266.9646 | 3727.2432 |
| 2019 | 133 | `netTotal` | -10567.5656 | -12107.287 |
| 2019 | 133 | `marg` | 0.4771 | 0.4868 |
| 2019 | 133 | `invTax` | 15858.2801 | 16237.4889 |
| 2019 | 133 | `incomeTax` | 11526.8444 | 9987.123 |
| 2019 | 133 | `gross` | 18069.487 | 16529.7656 |
| 2019 | 133 | `avg` | -0.0846 | -0.1023 |
| 2019 | 133 | `grossAvg` | 0.2077 | 0.19 |
| 2019 | 133 | `margBy.ord` | 0.4771 | 0.4868 |
| 2019 | 133 | `margBy.cg` | 0.2138 | 0.2186 |
| 2019 | 133 | `margBy.ed` | 0.2723 | 0.2857 |
| 2019 | 133 | `margBy.nd` | 0.3788 | 0.3899 |
| 2019 | 133 | `margBy.fd` | 0.4275 | 0.4372 |
| 2019 | 133 | `people.0.prov` | 186.8892 | 97.5508 |
| 2019 | 133 | `people.0.total` | 545.9892 | 456.6508 |
| 2019 | 133 | `people.1.prov` | 5080.0754 | 3629.6924 |
| 2019 | 133 | `people.1.total` | 14319.8552 | 12869.4722 |
| 2019 | 134 | `invTax` | 6961.0399 | 6970.4896 |
| 2019 | 136 | `total` | -123.1366 | -1229.8424 |
| 2019 | 136 | `prov` | 8448.3689 | 7341.6631 |
| 2019 | 136 | `netTotal` | -4662.1266 | -5768.8324 |
| 2019 | 136 | `marg` | 0.474 | 0.4837 |
| 2019 | 136 | `incomeTax` | 18903.9042 | 17797.1983 |
| 2019 | 136 | `gross` | 27052.0142 | 25945.3083 |
| 2019 | 136 | `avg` | -0.0014 | -0.0145 |
| 2019 | 136 | `grossAvg` | 0.3183 | 0.3052 |
| 2019 | 136 | `margBy.ord` | 0.474 | 0.4837 |
| 2019 | 136 | `margBy.cg` | 0.237 | 0.2419 |
| 2019 | 136 | `margBy.ed` | 0.3364 | 0.3499 |
| 2019 | 136 | `margBy.nd` | 0.4322 | 0.4434 |
| 2019 | 136 | `margBy.fd` | 0.474 | 0.4837 |
| 2019 | 136 | `people.0.prov` | 8448.3689 | 7341.6631 |
| 2019 | 136 | `people.0.total` | 22513.0242 | 21406.3183 |
| 2019 | 141 | `total` | 15108.0461 | 14601.4232 |
| 2019 | 141 | `prov` | 3971.2829 | 3464.66 |
| 2019 | 141 | `netTotal` | -1722.6939 | -2229.3168 |
| 2019 | 141 | `marg` | 0.6099 | 0.6196 |
| 2019 | 141 | `incomeTax` | 8295.3761 | 7788.7532 |
| 2019 | 141 | `gross` | 28612.8361 | 28106.2132 |
| 2019 | 141 | `avg` | 0.2747 | 0.2655 |
| 2019 | 141 | `grossAvg` | 0.5202 | 0.511 |
| 2019 | 141 | `margBy.ord` | 0.6099 | 0.6196 |
| 2019 | 141 | `margBy.cg` | 0.2863 | 0.2911 |
| 2019 | 141 | `margBy.ed` | 0.4724 | 0.4858 |
| 2019 | 141 | `margBy.nd` | 0.5455 | 0.5567 |
| 2019 | 141 | `margBy.fd` | 0.5725 | 0.59 |
| 2019 | 141 | `people.0.prov` | 3971.2829 | 3464.66 |
| 2019 | 141 | `people.0.total` | 11782.0961 | 11275.4732 |
| 2019 | 143 | `total` | 8061.9435 | 7899.1173 |
| 2019 | 143 | `prov` | 4120.5074 | 3957.6812 |
| 2019 | 143 | `netTotal` | 4858.3009 | 4695.4747 |
| 2019 | 143 | `marg` | 0.3778 | 0.3875 |
| 2019 | 143 | `invTax` | 9942.7521 | 10212.5793 |
| 2019 | 143 | `incomeTax` | 8363.2509 | 8200.4247 |
| 2019 | 143 | `gross` | 13696.2935 | 13533.4673 |
| 2019 | 143 | `avg` | 0.0906 | 0.0888 |
| 2019 | 143 | `grossAvg` | 0.1539 | 0.1521 |
| 2019 | 143 | `margBy.ord` | 0.3778 | 0.3875 |
| 2019 | 143 | `margBy.cg` | 0.164 | 0.1689 |
| 2019 | 143 | `margBy.ed` | 0.135 | 0.1484 |
| 2019 | 143 | `margBy.nd` | 0.2643 | 0.2755 |
| 2019 | 143 | `margBy.fd` | 0.328 | 0.3377 |
| 2019 | 143 | `people.0.prov` | 656.0028 | 597.9531 |
| 2019 | 143 | `people.0.total` | 2317.2678 | 2259.2181 |
| 2019 | 143 | `people.1.prov` | 3464.5046 | 3359.7282 |
| 2019 | 143 | `people.1.total` | 8175.3831 | 8070.6067 |
| 2019 | 144 | `total` | 27452.4459 | 27414.0117 |
| 2019 | 144 | `prov` | 2368.7534 | 2330.3192 |
| 2019 | 144 | `netTotal` | 6069.9559 | 6031.5217 |
| 2019 | 144 | `marg` | 0.3773 | 0.387 |
| 2019 | 144 | `incomeTax` | 4417.7684 | 4379.3342 |
| 2019 | 144 | `gross` | 28780.1584 | 28741.7242 |
| 2019 | 144 | `avg` | 0.5841 | 0.5833 |
| 2019 | 144 | `grossAvg` | 0.6123 | 0.6115 |
| 2019 | 144 | `margBy.ord` | 0.3773 | 0.387 |
| 2019 | 144 | `margBy.cg` | 0.1638 | 0.1686 |
| 2019 | 144 | `margBy.ed` | 0.1343 | 0.1477 |
| 2019 | 144 | `margBy.nd` | 0.2638 | 0.2749 |
| 2019 | 144 | `margBy.fd` | 0.4717 | 0.4824 |
| 2019 | 144 | `people.0.prov` | 2368.7534 | 2330.3192 |
| 2019 | 144 | `people.0.total` | 7397.6684 | 7359.2342 |
| 2019 | 145 | `total` | 12537.5441 | 12117.8837 |
| 2019 | 145 | `prov` | 4467.2882 | 4047.6278 |
| 2019 | 145 | `netTotal` | 5250.0007 | 4830.3403 |
| 2019 | 145 | `marg` | 0.4621 | 0.4718 |
| 2019 | 145 | `incomeTax` | 9186.0182 | 8766.3578 |
| 2019 | 145 | `gross` | 22433.3616 | 22013.7012 |
| 2019 | 145 | `avg` | 0.1334 | 0.1289 |
| 2019 | 145 | `grossAvg` | 0.2387 | 0.2342 |
| 2019 | 145 | `margBy.ord` | 0.4621 | 0.4718 |
| 2019 | 145 | `margBy.cg` | 0.2063 | 0.2111 |
| 2019 | 145 | `margBy.ed` | 0.2516 | 0.265 |
| 2019 | 145 | `margBy.nd` | 0.3615 | 0.3727 |
| 2019 | 145 | `margBy.fd` | 0.4125 | 0.4222 |
| 2019 | 145 | `people.0.prov` | 474.5628 | 416.1486 |
| 2019 | 145 | `people.0.total` | 3563.8278 | 3505.4136 |
| 2019 | 145 | `people.1.prov` | 3992.7254 | 3631.4792 |
| 2019 | 145 | `people.1.total` | 11581.9904 | 11220.7442 |
| 2019 | 146 | `total` | 21781.7359 | 21723.3217 |
| 2019 | 146 | `prov` | 5432.3177 | 5373.9034 |
| 2019 | 146 | `netTotal` | 18142.7459 | 18084.3317 |
| 2019 | 146 | `marg` | 0.3079 | 0.3176 |
| 2019 | 146 | `incomeTax` | 11676.1259 | 11617.7117 |
| 2019 | 146 | `gross` | 21781.7359 | 21723.3217 |
| 2019 | 146 | `avg` | 0.2135 | 0.213 |
| 2019 | 146 | `grossAvg` | 0.2135 | 0.213 |
| 2019 | 146 | `margBy.ord` | 0.3079 | 0.3176 |
| 2019 | 146 | `margBy.cg` | 0.129 | 0.1339 |
| 2019 | 146 | `margBy.ed` | 0.0384 | 0.0518 |
| 2019 | 146 | `margBy.nd` | 0.1838 | 0.195 |
| 2019 | 146 | `margBy.fd` | 0.3722 | 0.3853 |
| 2019 | 146 | `people.0.prov` | 474.5628 | 416.1486 |
| 2019 | 146 | `people.0.total` | 3563.8278 | 3505.4136 |
| 2020 | 2 | `total` | 1872.8782 | 1766.2503 |
| 2020 | 2 | `prov` | 164.8242 | 58.1963 |
| 2020 | 2 | `netTotal` | -1167.0158 | -1273.6437 |
| 2020 | 2 | `marg` | 0.149 | 0.1587 |
| 2020 | 2 | `incomeTax` | 164.8242 | 58.1963 |
| 2020 | 2 | `gross` | 3840.5682 | 3733.9403 |
| 2020 | 2 | `avg` | 0.1561 | 0.1472 |
| 2020 | 2 | `grossAvg` | 0.32 | 0.3112 |
| 2020 | 2 | `margBy.ord` | 0.149 | 0.1587 |
| 2020 | 2 | `margBy.cg` | 0.044 | 0.0489 |
| 2020 | 2 | `margBy.ed` | 0.011 | 0.0245 |
| 2020 | 2 | `margBy.nd` | 0.0922 | 0.1034 |
| 2020 | 2 | `margBy.fd` | 0.2235 | 0.2419 |
| 2020 | 2 | `people.0.prov` | 164.8242 | 58.1963 |
| 2020 | 2 | `people.0.total` | 800.6742 | 694.0463 |
| 2020 | 4 | `total` | -3071.7062 | -3246.3007 |
| 2020 | 4 | `prov` | 788.3298 | 613.7354 |
| 2020 | 4 | `netTotal` | -6111.6002 | -6286.1946 |
| 2020 | 4 | `marg` | 0.2886 | 0.2983 |
| 2020 | 4 | `incomeTax` | 788.3298 | 613.7354 |
| 2020 | 4 | `gross` | 5556.8738 | 5382.2793 |
| 2020 | 4 | `avg` | -0.1097 | -0.1159 |
| 2020 | 4 | `grossAvg` | 0.1985 | 0.1922 |
| 2020 | 4 | `margBy.ord` | 0.2886 | 0.2983 |
| 2020 | 4 | `margBy.cg` | 0.114 | 0.1189 |
| 2020 | 4 | `margBy.ed` | 0.2042 | 0.2177 |
| 2020 | 4 | `margBy.nd` | 0.2532 | 0.2644 |
| 2020 | 4 | `margBy.fd` | 0.3495 | 0.3654 |
| 2020 | 4 | `people.0.prov` | 788.3298 | 613.7354 |
| 2020 | 4 | `people.0.total` | 2516.9798 | 2342.3854 |
| 2020 | 5 | `total` | -2786.8165 | -2942.0293 |
| 2020 | 5 | `prov` | 989.577 | 834.3643 |
| 2020 | 5 | `netTotal` | -5826.7105 | -5981.9232 |
| 2020 | 5 | `marg` | 0.4283 | 0.438 |
| 2020 | 5 | `incomeTax` | 1054.3395 | 899.1268 |
| 2020 | 5 | `gross` | 5959.4835 | 5804.2707 |
| 2020 | 5 | `avg` | -0.0929 | -0.0981 |
| 2020 | 5 | `grossAvg` | 0.1986 | 0.1935 |
| 2020 | 5 | `margBy.ord` | 0.4283 | 0.438 |
| 2020 | 5 | `margBy.cg` | 0.189 | 0.1939 |
| 2020 | 5 | `margBy.ed` | 0.204 | 0.2174 |
| 2020 | 5 | `margBy.nd` | 0.3218 | 0.333 |
| 2020 | 5 | `margBy.fd` | 0.492 | 0.5069 |
| 2020 | 5 | `people.0.prov` | 989.577 | 834.3643 |
| 2020 | 5 | `people.0.total` | 2919.5895 | 2764.3768 |
| 2020 | 6 | `total` | -25450.0908 | -26946.0209 |
| 2020 | 6 | `prov` | 2722.9178 | 1226.9876 |
| 2020 | 6 | `netTotal` | -28489.9847 | -29985.9149 |
| 2020 | 6 | `marg` | 0.6073 | 0.617 |
| 2020 | 6 | `incomeTax` | 4884.0053 | 3388.0751 |
| 2020 | 6 | `gross` | 10813.6492 | 9317.7191 |
| 2020 | 6 | `avg` | -0.5656 | -0.5988 |
| 2020 | 6 | `grossAvg` | 0.2403 | 0.2071 |
| 2020 | 6 | `margBy.ord` | 0.6073 | 0.617 |
| 2020 | 6 | `margBy.cg` | 0.2788 | 0.2836 |
| 2020 | 6 | `margBy.ed` | 0.4517 | 0.4651 |
| 2020 | 6 | `margBy.nd` | 0.5283 | 0.5394 |
| 2020 | 6 | `margBy.fd` | 0.5983 | 0.6412 |
| 2020 | 6 | `people.0.prov` | 2722.9178 | 1226.9876 |
| 2020 | 6 | `people.0.total` | 7773.7553 | 6277.8251 |
| 2020 | 7 | `total` | -8916.8926 | -10267.4222 |
| 2020 | 7 | `prov` | 4541.2384 | 3190.7088 |
| 2020 | 7 | `netTotal` | -11956.7866 | -13307.3162 |
| 2020 | 7 | `marg` | 0.6125 | 0.6222 |
| 2020 | 7 | `incomeTax` | 9444.1014 | 8093.5718 |
| 2020 | 7 | `gross` | 16238.3554 | 14887.8258 |
| 2020 | 7 | `avg` | -0.1486 | -0.1711 |
| 2020 | 7 | `grossAvg` | 0.2706 | 0.2481 |
| 2020 | 7 | `margBy.ord` | 0.6125 | 0.6222 |
| 2020 | 7 | `margBy.cg` | 0.3063 | 0.3111 |
| 2020 | 7 | `margBy.ed` | 0.5276 | 0.541 |
| 2020 | 7 | `margBy.nd` | 0.5915 | 0.6027 |
| 2020 | 7 | `margBy.fd` | 0.6125 | 0.6366 |
| 2020 | 7 | `people.0.prov` | 4541.2384 | 3190.7088 |
| 2020 | 7 | `people.0.total` | 13198.4614 | 11847.9318 |
| 2020 | 8 | `total` | 45852.5736 | 45762.512 |
| 2020 | 8 | `prov` | 15128.768 | 15038.7064 |
| 2020 | 8 | `netTotal` | 39212.6796 | 39122.618 |
| 2020 | 8 | `marg` | 0.436 | 0.4457 |
| 2020 | 8 | `incomeTax` | 35053.194 | 34963.1324 |
| 2020 | 8 | `gross` | 49201.808 | 49111.7464 |
| 2020 | 8 | `avg` | 0.3057 | 0.3051 |
| 2020 | 8 | `grossAvg` | 0.328 | 0.3274 |
| 2020 | 8 | `margBy.ord` | 0.436 | 0.4457 |
| 2020 | 8 | `margBy.cg` | 0.218 | 0.2229 |
| 2020 | 8 | `margBy.ed` | 0.284 | 0.2974 |
| 2020 | 8 | `margBy.nd` | 0.3885 | 0.3997 |
| 2020 | 8 | `margBy.fd` | 0.436 | 0.4457 |
| 2020 | 8 | `people.0.prov` | 7564.384 | 7474.3224 |
| 2020 | 8 | `people.0.total` | 21280.957 | 21190.8954 |
| 2020 | 10 | `total` | -891.1798 | -1369.3503 |
| 2020 | 10 | `prov` | 2508.7388 | 2030.5682 |
| 2020 | 10 | `netTotal` | -3931.0737 | -4409.2443 |
| 2020 | 10 | `marg` | 0.5126 | 0.5223 |
| 2020 | 10 | `incomeTax` | 4769.3513 | 4291.1807 |
| 2020 | 10 | `gross` | 10515.2452 | 10037.0747 |
| 2020 | 10 | `avg` | -0.0198 | -0.0304 |
| 2020 | 10 | `grossAvg` | 0.2337 | 0.223 |
| 2020 | 10 | `margBy.ord` | 0.5126 | 0.5223 |
| 2020 | 10 | `margBy.cg` | 0.2313 | 0.2361 |
| 2020 | 10 | `margBy.ed` | 0.3206 | 0.334 |
| 2020 | 10 | `margBy.nd` | 0.419 | 0.4302 |
| 2020 | 10 | `margBy.fd` | 0.4755 | 0.4988 |
| 2020 | 10 | `people.0.prov` | 2508.7388 | 2030.5682 |
| 2020 | 10 | `people.0.total` | 6976.1013 | 6497.9307 |
| 2020 | 11 | `total` | 30991.238 | 30818.3404 |
| 2020 | 11 | `prov` | 14407.912 | 14235.0144 |
| 2020 | 11 | `netTotal` | 27951.344 | 27778.4464 |
| 2020 | 11 | `marg` | 0.514 | 0.5237 |
| 2020 | 11 | `incomeTax` | 32862.872 | 32689.9744 |
| 2020 | 11 | `gross` | 39657.126 | 39484.2284 |
| 2020 | 11 | `avg` | 0.2583 | 0.2568 |
| 2020 | 11 | `grossAvg` | 0.3305 | 0.329 |
| 2020 | 11 | `margBy.ord` | 0.514 | 0.5237 |
| 2020 | 11 | `margBy.cg` | 0.257 | 0.2619 |
| 2020 | 11 | `margBy.ed` | 0.3916 | 0.4051 |
| 2020 | 11 | `margBy.nd` | 0.4782 | 0.4894 |
| 2020 | 11 | `margBy.fd` | 0.514 | 0.5237 |
| 2020 | 11 | `people.0.prov` | 14407.912 | 14235.0144 |
| 2020 | 11 | `people.0.total` | 36617.232 | 36444.3344 |
| 2020 | 23 | `total` | -5456.5165 | -5908.9453 |
| 2020 | 23 | `prov` | 989.577 | 537.1483 |
| 2020 | 23 | `netTotal` | -8496.4105 | -8948.8392 |
| 2020 | 23 | `marg` | 0.3087 | 0.3184 |
| 2020 | 23 | `incomeTax` | 1054.3395 | 601.9108 |
| 2020 | 23 | `gross` | 5959.4835 | 5507.0547 |
| 2020 | 23 | `avg` | -0.1819 | -0.197 |
| 2020 | 23 | `grossAvg` | 0.1986 | 0.1836 |
| 2020 | 23 | `margBy.ord` | 0.3087 | 0.3184 |
| 2020 | 23 | `margBy.cg` | 0.129 | 0.1339 |
| 2020 | 23 | `margBy.ed` | 0.0384 | 0.0518 |
| 2020 | 23 | `margBy.nd` | 0.1838 | 0.195 |
| 2020 | 23 | `margBy.fd` | 0.372 | 0.3968 |
| 2020 | 23 | `people.0.prov` | 989.577 | 537.1483 |
| 2020 | 23 | `people.0.total` | 2919.5895 | 2467.1608 |
| 2020 | 26 | `total` | 3887.5367 | 3877.8172 |
| 2020 | 26 | `prov` | 1171.0602 | 1161.3407 |
| 2020 | 26 | `netTotal` | 1711.6427 | 1701.9232 |
| 2020 | 26 | `marg` | 0.4283 | 0.438 |
| 2020 | 26 | `incomeTax` | 2102.1327 | 2092.4132 |
| 2020 | 26 | `gross` | 5596.8767 | 5587.1572 |
| 2020 | 26 | `avg` | 0.1767 | 0.1763 |
| 2020 | 26 | `grossAvg` | 0.2544 | 0.254 |
| 2020 | 26 | `margBy.ord` | 0.4283 | 0.438 |
| 2020 | 26 | `margBy.cg` | 0.189 | 0.1939 |
| 2020 | 26 | `margBy.ed` | 0.204 | 0.2174 |
| 2020 | 26 | `margBy.nd` | 0.3218 | 0.333 |
| 2020 | 26 | `margBy.fd` | 0.4315 | 0.4416 |
| 2020 | 26 | `people.0.prov` | 1171.0602 | 1161.3407 |
| 2020 | 26 | `people.0.total` | 3420.9827 | 3411.2632 |
| 2020 | 31 | `total` | -13093.7418 | -13278.33 |
| 2020 | 31 | `prov` | 184.5882 | 0 |
| 2020 | 31 | `netTotal` | -21804.9818 | -21989.57 |
| 2020 | 31 | `marg` | 0.2886 | 0.1879 |
| 2020 | 31 | `incomeTax` | 184.5882 | 0 |
| 2020 | 31 | `gross` | 10214.6782 | 10030.09 |
| 2020 | 31 | `avg` | -0.5952 | -0.6036 |
| 2020 | 31 | `grossAvg` | 0.4643 | 0.4559 |
| 2020 | 31 | `margBy.ord` | 0.2886 | 0.1879 |
| 2020 | 31 | `margBy.cg` | 0.114 | 0.06 |
| 2020 | 31 | `margBy.ed` | 0.2042 | 0.1656 |
| 2020 | 31 | `margBy.nd` | 0.2532 | 0.138 |
| 2020 | 31 | `margBy.fd` | 0.228 | 0.12 |
| 2020 | 31 | `people.0.prov` | 184.5882 | 0 |
| 2020 | 31 | `people.0.total` | 1503.4382 | 1318.85 |
| 2020 | 36 | `total` | -18922.0832 | -19903.5867 |
| 2020 | 36 | `prov` | 1763.5885 | 782.085 |
| 2020 | 36 | `netTotal` | -21873.3232 | -22854.8267 |
| 2020 | 36 | `marg` | 0.6771 | 0.6868 |
| 2020 | 36 | `invTax` | 4798.6586 | 4001.7433 |
| 2020 | 36 | `incomeTax` | 2084.5418 | 1103.0383 |
| 2020 | 36 | `gross` | 6354.6318 | 5373.1283 |
| 2020 | 36 | `avg` | -0.4979 | -0.5238 |
| 2020 | 36 | `grossAvg` | 0.1672 | 0.1414 |
| 2020 | 36 | `margBy.ord` | 0.6771 | 0.6868 |
| 2020 | 36 | `margBy.cg` | 0.3137 | 0.3186 |
| 2020 | 36 | `margBy.ed` | 0.5483 | 0.5617 |
| 2020 | 36 | `margBy.nd` | 0.6088 | 0.6199 |
| 2020 | 36 | `margBy.fd` | 0.6275 | 0.6372 |
| 2020 | 36 | `people.0.prov` | 1763.5885 | 782.085 |
| 2020 | 36 | `people.0.total` | 3403.3918 | 2421.8883 |
| 2020 | 37 | `total` | -3044.9295 | -4050.308 |
| 2020 | 37 | `prov` | 4473.0578 | 3467.6793 |
| 2020 | 37 | `netTotal` | -6262.1922 | -7267.5707 |
| 2020 | 37 | `marg` | 0.5574 | 0.5671 |
| 2020 | 37 | `incomeTax` | 9065.1578 | 8059.7793 |
| 2020 | 37 | `gross` | 17720.4205 | 16715.042 |
| 2020 | 37 | `avg` | -0.0358 | -0.0477 |
| 2020 | 37 | `grossAvg` | 0.2085 | 0.1966 |
| 2020 | 37 | `margBy.ord` | 0.5574 | 0.5671 |
| 2020 | 37 | `margBy.cg` | 0.2537 | 0.2586 |
| 2020 | 37 | `margBy.ed` | 0.3827 | 0.3961 |
| 2020 | 37 | `margBy.nd` | 0.4708 | 0.4819 |
| 2020 | 37 | `margBy.fd` | 0.5904 | 0.624 |
| 2020 | 37 | `people.0.prov` | 1161.0378 | 1160.5718 |
| 2020 | 37 | `people.0.total` | 4489.8403 | 4489.3743 |
| 2020 | 37 | `people.1.prov` | 3312.02 | 2307.1075 |
| 2020 | 37 | `people.1.total` | 10013.3175 | 9008.405 |
| 2020 | 39 | `invTax` | 53980.5085 | 54881.9046 |
| 2020 | 40 | `total` | -22380.5912 | -23779.6129 |
| 2020 | 40 | `prov` | 3924.9339 | 2525.9121 |
| 2020 | 40 | `netTotal` | -23836.4851 | -25235.5069 |
| 2020 | 40 | `marg` | 0.6504 | 0.6601 |
| 2020 | 40 | `incomeTax` | 7832.5449 | 6433.5231 |
| 2020 | 40 | `gross` | 12848.5488 | 11449.5271 |
| 2020 | 40 | `avg` | -0.4069 | -0.4324 |
| 2020 | 40 | `grossAvg` | 0.2336 | 0.2082 |
| 2020 | 40 | `margBy.ord` | 0.6504 | 0.6601 |
| 2020 | 40 | `margBy.cg` | 0.3063 | 0.3111 |
| 2020 | 40 | `margBy.ed` | 0.5276 | 0.541 |
| 2020 | 40 | `margBy.nd` | 0.5915 | 0.6027 |
| 2020 | 40 | `margBy.fd` | 0.6193 | 0.6545 |
| 2020 | 40 | `people.0.prov` | 3924.9339 | 2525.9121 |
| 2020 | 40 | `people.0.total` | 11392.6549 | 9993.6331 |
| 2020 | 49 | `total` | 2639.7378 | 2333.1696 |
| 2020 | 49 | `prov` | 5350.5462 | 5043.9779 |
| 2020 | 49 | `netTotal` | -3191.5022 | -3498.0704 |
| 2020 | 49 | `marg` | 0.5091 | 0.5188 |
| 2020 | 49 | `invTax` | 15600.0596 | 15478.0796 |
| 2020 | 49 | `incomeTax` | 8211.9278 | 7905.3596 |
| 2020 | 49 | `gross` | 15362.0178 | 15055.4496 |
| 2020 | 49 | `avg` | 0.0383 | 0.0338 |
| 2020 | 49 | `grossAvg` | 0.2226 | 0.2182 |
| 2020 | 49 | `margBy.ord` | 0.5091 | 0.5188 |
| 2020 | 49 | `margBy.cg` | 0.2295 | 0.2344 |
| 2020 | 49 | `margBy.ed` | 0.3157 | 0.3292 |
| 2020 | 49 | `margBy.nd` | 0.415 | 0.4262 |
| 2020 | 49 | `margBy.fd` | 0.459 | 0.4687 |
| 2020 | 49 | `people.0.prov` | 5350.5462 | 5043.9779 |
| 2020 | 49 | `people.0.total` | 9530.7778 | 9224.2096 |
| 2020 | 55 | `total` | 37891.3076 | 37782.1732 |
| 2020 | 55 | `prov` | 14224.552 | 14115.4176 |
| 2020 | 55 | `netTotal` | 25562.4011 | 25453.2667 |
| 2020 | 55 | `marg` | 0.529 | 0.5387 |
| 2020 | 55 | `invTax` | 17500.2581 | 17904.2213 |
| 2020 | 55 | `incomeTax` | 31897.8331 | 31788.6987 |
| 2020 | 55 | `gross` | 47981.0996 | 47871.9652 |
| 2020 | 55 | `avg` | 0.2578 | 0.257 |
| 2020 | 55 | `grossAvg` | 0.3264 | 0.3257 |
| 2020 | 55 | `margBy.ord` | 0.529 | 0.5387 |
| 2020 | 55 | `margBy.cg` | 0.2645 | 0.2694 |
| 2020 | 55 | `margBy.ed` | 0.4123 | 0.4258 |
| 2020 | 55 | `margBy.nd` | 0.4955 | 0.5067 |
| 2020 | 55 | `margBy.fd` | 0.529 | 0.5387 |
| 2020 | 55 | `people.0.prov` | 14224.552 | 14115.4176 |
| 2020 | 55 | `people.0.total` | 35652.1931 | 35543.0587 |
| 2020 | 56 | `total` | 5344.3977 | 5286.0782 |
| 2020 | 56 | `prov` | 631.0602 | 572.7407 |
| 2020 | 56 | `netTotal` | -170.4473 | -228.7668 |
| 2020 | 56 | `marg` | 0.4084 | 0.4181 |
| 2020 | 56 | `incomeTax` | 812.1327 | 753.8132 |
| 2020 | 56 | `gross` | 7645.8277 | 7587.5082 |
| 2020 | 56 | `avg` | 0.2429 | 0.2403 |
| 2020 | 56 | `grossAvg` | 0.3475 | 0.3449 |
| 2020 | 56 | `margBy.ord` | 0.4084 | 0.4181 |
| 2020 | 56 | `margBy.cg` | 0.179 | 0.1839 |
| 2020 | 56 | `margBy.ed` | 0.1764 | 0.1898 |
| 2020 | 56 | `margBy.nd` | 0.2988 | 0.31 |
| 2020 | 56 | `margBy.fd` | 0.4588 | 0.4719 |
| 2020 | 56 | `people.0.prov` | 631.0602 | 572.7407 |
| 2020 | 56 | `people.0.total` | 2130.9827 | 2072.6632 |
| 2020 | 57 | `total` | -11456.7191 | -11641.3073 |
| 2020 | 57 | `prov` | 184.5882 | 0 |
| 2020 | 57 | `netTotal` | -22161.9818 | -22346.57 |
| 2020 | 57 | `marg` | 0.2886 | 0.1879 |
| 2020 | 57 | `incomeTax` | 184.5882 | 0 |
| 2020 | 57 | `gross` | 12208.7009 | 12024.1127 |
| 2020 | 57 | `avg` | -0.5208 | -0.5292 |
| 2020 | 57 | `grossAvg` | 0.5549 | 0.5466 |
| 2020 | 57 | `margBy.ord` | 0.2886 | 0.1879 |
| 2020 | 57 | `margBy.cg` | 0.114 | 0.06 |
| 2020 | 57 | `margBy.ed` | 0.2042 | 0.1656 |
| 2020 | 57 | `margBy.nd` | 0.2532 | 0.138 |
| 2020 | 57 | `margBy.fd` | 0.3691 | 0.27 |
| 2020 | 57 | `people.0.prov` | 184.5882 | 0 |
| 2020 | 57 | `people.0.total` | 1503.4382 | 1318.85 |
| 2020 | 60 | `total` | 2167.1817 | 1637.2262 |
| 2020 | 60 | `prov` | 1047.1302 | 517.1747 |
| 2020 | 60 | `netTotal` | -6632.7123 | -7162.6678 |
| 2020 | 60 | `incomeTax` | 1191.8277 | 661.8722 |
| 2020 | 60 | `gross` | 11673.2217 | 11143.2662 |
| 2020 | 60 | `avg` | 0.0722 | 0.0546 |
| 2020 | 60 | `grossAvg` | 0.3891 | 0.3714 |
| 2020 | 60 | `people.0.prov` | 1047.1302 | 517.1747 |
| 2020 | 60 | `people.0.total` | 2510.6777 | 1980.7222 |
| 2020 | 61 | `total` | 15787.3604 | 15406.2388 |
| 2020 | 61 | `prov` | 5561.2384 | 5180.1168 |
| 2020 | 61 | `netTotal` | 7076.1204 | 6694.9988 |
| 2020 | 61 | `marg` | 0.4675 | 0.4772 |
| 2020 | 61 | `incomeTax` | 12104.1014 | 11722.9798 |
| 2020 | 61 | `gross` | 24569.7014 | 24188.5798 |
| 2020 | 61 | `avg` | 0.2322 | 0.2266 |
| 2020 | 61 | `grossAvg` | 0.3613 | 0.3557 |
| 2020 | 61 | `margBy.ord` | 0.4675 | 0.4772 |
| 2020 | 61 | `margBy.cg` | 0.2338 | 0.2386 |
| 2020 | 61 | `margBy.ed` | 0.3275 | 0.3409 |
| 2020 | 61 | `margBy.nd` | 0.4248 | 0.4359 |
| 2020 | 61 | `margBy.fd` | 0.4675 | 0.4772 |
| 2020 | 61 | `people.0.prov` | 5561.2384 | 5180.1168 |
| 2020 | 61 | `people.0.total` | 15858.4614 | 15477.3398 |
| 2020 | 63 | `total` | 2033.7317 | 1823.5739 |
| 2020 | 63 | `prov` | 3924.9339 | 3714.7761 |
| 2020 | 63 | `netTotal` | -224.2626 | -434.4204 |
| 2020 | 63 | `marg` | 0.5557 | 0.5654 |
| 2020 | 63 | `incomeTax` | 7832.5449 | 7622.3871 |
| 2020 | 63 | `gross` | 13650.6492 | 13440.4914 |
| 2020 | 63 | `avg` | 0.037 | 0.0332 |
| 2020 | 63 | `grossAvg` | 0.2482 | 0.2444 |
| 2020 | 63 | `margBy.ord` | 0.5557 | 0.5654 |
| 2020 | 63 | `margBy.cg` | 0.2588 | 0.2636 |
| 2020 | 63 | `margBy.ed` | 0.3965 | 0.4099 |
| 2020 | 63 | `margBy.nd` | 0.4823 | 0.4934 |
| 2020 | 63 | `margBy.fd` | 0.5175 | 0.5272 |
| 2020 | 63 | `people.0.prov` | 3924.9339 | 3714.7761 |
| 2020 | 63 | `people.0.total` | 11392.6549 | 11182.4971 |
| 2020 | 64 | `total` | 6875.0834 | 6196.7458 |
| 2020 | 64 | `prov` | 5561.2384 | 4882.9008 |
| 2020 | 64 | `netTotal` | -1836.1566 | -2514.4942 |
| 2020 | 64 | `marg` | 0.5625 | 0.5722 |
| 2020 | 64 | `incomeTax` | 12104.1014 | 11425.7638 |
| 2020 | 64 | `gross` | 24569.7014 | 23891.3638 |
| 2020 | 64 | `avg` | 0.1011 | 0.0911 |
| 2020 | 64 | `grossAvg` | 0.3613 | 0.3513 |
| 2020 | 64 | `margBy.ord` | 0.5625 | 0.5722 |
| 2020 | 64 | `margBy.cg` | 0.2813 | 0.2861 |
| 2020 | 64 | `margBy.ed` | 0.4586 | 0.472 |
| 2020 | 64 | `margBy.nd` | 0.534 | 0.5452 |
| 2020 | 64 | `margBy.fd` | 0.6338 | 0.6535 |
| 2020 | 64 | `people.0.prov` | 5561.2384 | 4882.9008 |
| 2020 | 64 | `people.0.total` | 15858.4614 | 15180.1238 |
| 2020 | 65 | `total` | 21068.238 | 20700.9404 |
| 2020 | 65 | `prov` | 10927.912 | 10560.6144 |
| 2020 | 65 | `netTotal` | 18028.344 | 17661.0464 |
| 2020 | 65 | `marg` | 0.514 | 0.5237 |
| 2020 | 65 | `incomeTax` | 24182.872 | 23815.5744 |
| 2020 | 65 | `gross` | 30977.126 | 30609.8284 |
| 2020 | 65 | `avg` | 0.2107 | 0.207 |
| 2020 | 65 | `grossAvg` | 0.3098 | 0.3061 |
| 2020 | 65 | `margBy.ord` | 0.514 | 0.5237 |
| 2020 | 65 | `margBy.cg` | 0.257 | 0.2619 |
| 2020 | 65 | `margBy.ed` | 0.3916 | 0.4051 |
| 2020 | 65 | `margBy.nd` | 0.4782 | 0.4894 |
| 2020 | 65 | `margBy.fd` | 0.514 | 0.5237 |
| 2020 | 65 | `people.0.prov` | 10927.912 | 10560.6144 |
| 2020 | 65 | `people.0.total` | 27937.232 | 27569.9344 |
| 2020 | 66 | `total` | 1161.383 | 551.0854 |
| 2020 | 66 | `prov` | 6577.912 | 5967.6144 |
| 2020 | 66 | `netTotal` | -205.857 | -816.1546 |
| 2020 | 66 | `marg` | 0.474 | 0.4837 |
| 2020 | 66 | `incomeTax` | 14555.775 | 13945.4774 |
| 2020 | 66 | `gross` | 19677.375 | 19067.0774 |
| 2020 | 66 | `avg` | 0.0155 | 0.0073 |
| 2020 | 66 | `grossAvg` | 0.2624 | 0.2542 |
| 2020 | 66 | `margBy.ord` | 0.474 | 0.4837 |
| 2020 | 66 | `margBy.cg` | 0.237 | 0.2419 |
| 2020 | 66 | `margBy.ed` | 0.3364 | 0.3499 |
| 2020 | 66 | `margBy.nd` | 0.4322 | 0.4434 |
| 2020 | 66 | `margBy.fd` | 0.474 | 0.4837 |
| 2020 | 66 | `people.0.prov` | 6577.912 | 5967.6144 |
| 2020 | 66 | `people.0.total` | 18310.135 | 17699.8374 |
| 2020 | 69 | `total` | 35161.089 | 34476.5954 |
| 2020 | 69 | `prov` | 9540.433 | 8855.9394 |
| 2020 | 69 | `netTotal` | 15215.824 | 14531.3304 |
| 2020 | 69 | `marg` | 0.474 | 0.4837 |
| 2020 | 69 | `incomeTax` | 21551.7585 | 20867.2649 |
| 2020 | 69 | `gross` | 47116.6335 | 46432.1399 |
| 2020 | 69 | `avg` | 0.3349 | 0.3283 |
| 2020 | 69 | `grossAvg` | 0.4487 | 0.4422 |
| 2020 | 69 | `margBy.ord` | 0.474 | 0.4837 |
| 2020 | 69 | `margBy.cg` | 0.237 | 0.2419 |
| 2020 | 69 | `margBy.ed` | 0.3364 | 0.3499 |
| 2020 | 69 | `margBy.nd` | 0.4322 | 0.4434 |
| 2020 | 69 | `margBy.fd` | 0.474 | 0.4837 |
| 2020 | 69 | `people.0.prov` | 7564.384 | 6879.8904 |
| 2020 | 69 | `people.0.total` | 21280.957 | 20596.4634 |
| 2020 | 70 | `total` | 6155.8964 | 5716.4606 |
| 2020 | 70 | `prov` | 4416.215 | 3976.7792 |
| 2020 | 70 | `netTotal` | 3116.0025 | 2676.5667 |
| 2020 | 70 | `marg` | 0.3035 | 0.3132 |
| 2020 | 70 | `incomeTax` | 8841.1625 | 8401.7267 |
| 2020 | 70 | `gross` | 15748.1564 | 15308.7206 |
| 2020 | 70 | `avg` | 0.0993 | 0.0922 |
| 2020 | 70 | `grossAvg` | 0.254 | 0.2469 |
| 2020 | 70 | `margBy.ord` | 0.3035 | 0.3132 |
| 2020 | 70 | `margBy.cg` | 0.1215 | 0.1264 |
| 2020 | 70 | `margBy.ed` | 0.2249 | 0.2384 |
| 2020 | 70 | `margBy.nd` | 0.2704 | 0.2816 |
| 2020 | 70 | `margBy.fd` | 0.4613 | 0.4761 |
| 2020 | 70 | `people.0.prov` | 3949.52 | 3587.6395 |
| 2020 | 70 | `people.0.total` | 11400.8175 | 11038.937 |
| 2020 | 70 | `people.1.prov` | 466.695 | 389.1397 |
| 2020 | 70 | `people.1.total` | 1307.445 | 1229.8897 |
| 2020 | 71 | `invTax` | 10907.4767 | 10985.032 |
| 2020 | 73 | `invTax` | 6863.0214 | 6940.5768 |
| 2020 | 76 | `invTax` | 33126.7366 | 33505.2663 |
| 2020 | 79 | `total` | -15579.4705 | -16569.0475 |
| 2020 | 79 | `prov` | 989.577 | 0 |
| 2020 | 79 | `netTotal` | -17378.7105 | -18368.2875 |
| 2020 | 79 | `marg` | 0.4283 | 0.3277 |
| 2020 | 79 | `incomeTax` | 1054.3395 | 64.7625 |
| 2020 | 79 | `gross` | 4718.8295 | 3729.2525 |
| 2020 | 79 | `avg` | -0.5193 | -0.5523 |
| 2020 | 79 | `grossAvg` | 0.1573 | 0.1243 |
| 2020 | 79 | `margBy.ord` | 0.4283 | 0.3277 |
| 2020 | 79 | `margBy.cg` | 0.189 | 0.135 |
| 2020 | 79 | `margBy.ed` | 0.204 | 0.1653 |
| 2020 | 79 | `margBy.nd` | 0.3218 | 0.2067 |
| 2020 | 79 | `margBy.fd` | 0.492 | 0.4173 |
| 2020 | 79 | `people.0.prov` | 989.577 | 0 |
| 2020 | 79 | `people.0.total` | 2919.5895 | 1930.0125 |
| 2020 | 80 | `total` | -30552.357 | -31136.116 |
| 2020 | 80 | `prov` | 583.7591 | 0 |
| 2020 | 80 | `netTotal` | -32008.2509 | -32592.01 |
| 2020 | 80 | `marg` | 0.4675 | 0.3475 |
| 2020 | 80 | `invTax` | 9657.0991 | 9073.34 |
| 2020 | 80 | `incomeTax` | 583.7591 | 0 |
| 2020 | 80 | `gross` | 2402.303 | 1818.544 |
| 2020 | 80 | `avg` | -0.4185 | -0.4265 |
| 2020 | 80 | `grossAvg` | 0.0329 | 0.0249 |
| 2020 | 80 | `margBy.ord` | 0.4675 | 0.3475 |
| 2020 | 80 | `margBy.cg` | 0.2037 | 0.14 |
| 2020 | 80 | `margBy.ed` | 0.4519 | 0.3864 |
| 2020 | 80 | `margBy.nd` | 0.4596 | 0.322 |
| 2020 | 80 | `margBy.fd` | 0.5477 | 0.43 |
| 2020 | 80 | `people.0.pDtc` | 4416 | 3360.2958 |
| 2020 | 80 | `people.0.prov` | 583.7591 | 0 |
| 2020 | 80 | `people.0.total` | 946.4091 | 362.65 |
| 2020 | 82 | `total` | -26453.0965 | -26627.6623 |
| 2020 | 82 | `prov` | 174.5658 | 0 |
| 2020 | 82 | `netTotal` | -36265.9642 | -36440.53 |
| 2020 | 82 | `marg` | 0.2886 | 0.1879 |
| 2020 | 82 | `incomeTax` | 174.5658 | 0 |
| 2020 | 82 | `gross` | 12399.0835 | 12224.5177 |
| 2020 | 82 | `avg` | -0.6961 | -0.7007 |
| 2020 | 82 | `grossAvg` | 0.3263 | 0.3217 |
| 2020 | 82 | `margBy.ord` | 0.2886 | 0.1879 |
| 2020 | 82 | `margBy.cg` | 0.114 | 0.06 |
| 2020 | 82 | `margBy.ed` | 0.2042 | 0.1656 |
| 2020 | 82 | `margBy.nd` | 0.2532 | 0.138 |
| 2020 | 82 | `margBy.fd` | 0.4699 | 0.37 |
| 2020 | 82 | `people.0.prov` | 174.5658 | 0 |
| 2020 | 82 | `people.0.total` | 2586.2158 | 2411.65 |
| 2020 | 83 | `invTax` | 48843.1918 | 48852.9113 |
| 2020 | 89 | `total` | 12258.3922 | 11379.6064 |
| 2020 | 89 | `prov` | 7152.4437 | 6273.6579 |
| 2020 | 89 | `netTotal` | 4439.5472 | 3560.7614 |
| 2020 | 89 | `marg` | 0.4659 | 0.4756 |
| 2020 | 89 | `incomeTax` | 15461.5572 | 14582.7714 |
| 2020 | 89 | `gross` | 29252.1622 | 28373.3764 |
| 2020 | 89 | `avg` | 0.1318 | 0.1224 |
| 2020 | 89 | `grossAvg` | 0.3145 | 0.3051 |
| 2020 | 89 | `margBy.ord` | 0.4659 | 0.4756 |
| 2020 | 89 | `margBy.cg` | 0.2138 | 0.2186 |
| 2020 | 89 | `margBy.ed` | 0.2723 | 0.2857 |
| 2020 | 89 | `margBy.nd` | 0.3788 | 0.3899 |
| 2020 | 89 | `margBy.fd` | 0.4275 | 0.4372 |
| 2020 | 89 | `people.0.prov` | 4911.4059 | 4032.6201 |
| 2020 | 89 | `people.0.total` | 14363.4769 | 13484.6911 |
| 2020 | 97 | `total` | 9879.101 | 9752.815 |
| 2020 | 97 | `prov` | 1254.5658 | 1128.2798 |
| 2020 | 97 | `netTotal` | 2629.8383 | 2503.5523 |
| 2020 | 97 | `marg` | 0.4283 | 0.438 |
| 2020 | 97 | `incomeTax` | 1687.3683 | 1561.0823 |
| 2020 | 97 | `gross` | 11348.281 | 11221.995 |
| 2020 | 97 | `avg` | 0.26 | 0.2567 |
| 2020 | 97 | `grossAvg` | 0.2986 | 0.2953 |
| 2020 | 97 | `margBy.ord` | 0.4283 | 0.438 |
| 2020 | 97 | `margBy.cg` | 0.189 | 0.1939 |
| 2020 | 97 | `margBy.ed` | 0.204 | 0.2174 |
| 2020 | 97 | `margBy.nd` | 0.3218 | 0.333 |
| 2020 | 97 | `margBy.fd` | 0.4761 | 0.4896 |
| 2020 | 97 | `people.0.prov` | 1254.5658 | 1128.2798 |
| 2020 | 97 | `people.0.total` | 4099.0183 | 3972.7323 |
| 2020 | 98 | `total` | 300.8828 | -931.2886 |
| 2020 | 98 | `prov` | 8186.0057 | 6953.8342 |
| 2020 | 98 | `netTotal` | -3829.1114 | -5061.2829 |
| 2020 | 98 | `marg` | 0.524 | 0.5337 |
| 2020 | 98 | `invTax` | 10628.6684 | 10956.9609 |
| 2020 | 98 | `incomeTax` | 15617.1186 | 14384.9471 |
| 2020 | 98 | `gross` | 24092.3128 | 22860.1414 |
| 2020 | 98 | `avg` | 0.0026 | -0.0082 |
| 2020 | 98 | `grossAvg` | 0.2113 | 0.2005 |
| 2020 | 98 | `margBy.ord` | 0.524 | 0.5337 |
| 2020 | 98 | `margBy.cg` | 0.237 | 0.2419 |
| 2020 | 98 | `margBy.ed` | 0.3364 | 0.3499 |
| 2020 | 98 | `margBy.nd` | 0.4322 | 0.4434 |
| 2020 | 98 | `margBy.fd` | 0.5327 | 0.5579 |
| 2020 | 98 | `people.0.prov` | 4236.4857 | 3004.3142 |
| 2020 | 98 | `people.0.total` | 8561.5011 | 7329.3296 |
| 2020 | 99 | `total` | -28573.1705 | -29562.7475 |
| 2020 | 99 | `prov` | 989.577 | 0 |
| 2020 | 99 | `netTotal` | -35556.4105 | -36545.9875 |
| 2020 | 99 | `marg` | 0.3087 | 0.2081 |
| 2020 | 99 | `incomeTax` | 1054.3395 | 64.7625 |
| 2020 | 99 | `gross` | 9902.8295 | 8913.2525 |
| 2020 | 99 | `avg` | -0.9524 | -0.9854 |
| 2020 | 99 | `grossAvg` | 0.3301 | 0.2971 |
| 2020 | 99 | `margBy.ord` | 0.3087 | 0.2081 |
| 2020 | 99 | `margBy.cg` | 0.129 | 0.075 |
| 2020 | 99 | `margBy.ed` | 0.0384 | -0.0003 |
| 2020 | 99 | `margBy.nd` | 0.1838 | 0.0687 |
| 2020 | 99 | `margBy.fd` | 0.372 | 0.2973 |
| 2020 | 99 | `people.0.prov` | 989.577 | 0 |
| 2020 | 99 | `people.0.total` | 2919.5895 | 1930.0125 |
| 2020 | 100 | `total` | -14049.0702 | -14223.636 |
| 2020 | 100 | `prov` | 174.5658 | 0 |
| 2020 | 100 | `netTotal` | -19968.9642 | -20143.53 |
| 2020 | 100 | `marg` | 0.2886 | 0.1879 |
| 2020 | 100 | `incomeTax` | 174.5658 | 0 |
| 2020 | 100 | `gross` | 8506.1098 | 8331.544 |
| 2020 | 100 | `avg` | -0.3697 | -0.3743 |
| 2020 | 100 | `grossAvg` | 0.2238 | 0.2193 |
| 2020 | 100 | `margBy.ord` | 0.2886 | 0.1879 |
| 2020 | 100 | `margBy.cg` | 0.114 | 0.06 |
| 2020 | 100 | `margBy.ed` | 0.2042 | 0.1656 |
| 2020 | 100 | `margBy.nd` | 0.2532 | 0.138 |
| 2020 | 100 | `margBy.fd` | 0.228 | 0.12 |
| 2020 | 100 | `people.0.prov` | 174.5658 | 0 |
| 2020 | 100 | `people.0.total` | 2586.2158 | 2411.65 |
| 2020 | 101 | `total` | 2556.1554 | 1951.4738 |
| 2020 | 101 | `prov` | 2628.7384 | 2024.0568 |
| 2020 | 101 | `netTotal` | -8142.6896 | -8747.3712 |
| 2020 | 101 | `marg` | 0.5175 | 0.5272 |
| 2020 | 101 | `incomeTax` | 4660.1344 | 4055.4528 |
| 2020 | 101 | `gross` | 19113.3394 | 18508.6578 |
| 2020 | 101 | `avg` | 0.0341 | 0.026 |
| 2020 | 101 | `grossAvg` | 0.2548 | 0.2468 |
| 2020 | 101 | `margBy.ord` | 0.5175 | 0.5272 |
| 2020 | 101 | `margBy.cg` | 0.2588 | 0.2636 |
| 2020 | 101 | `margBy.ed` | 0.3965 | 0.4099 |
| 2020 | 101 | `margBy.nd` | 0.4823 | 0.4934 |
| 2020 | 101 | `margBy.fd` | 0.5632 | 0.5863 |
| 2020 | 101 | `people.0.prov` | 2628.7384 | 2024.0568 |
| 2020 | 101 | `people.0.total` | 8414.4944 | 7809.8128 |
| 2020 | 103 | `total` | 3307.4988 | 3229.8128 |
| 2020 | 103 | `prov` | 1882.4621 | 1804.776 |
| 2020 | 103 | `netTotal` | -2666.1005 | -2743.7865 |
| 2020 | 103 | `marg` | 0.3979 | 0.4076 |
| 2020 | 103 | `incomeTax` | 3065.2646 | 2987.5785 |
| 2020 | 103 | `gross` | 11450.5138 | 11372.8278 |
| 2020 | 103 | `avg` | 0.087 | 0.085 |
| 2020 | 103 | `grossAvg` | 0.3013 | 0.2993 |
| 2020 | 103 | `margBy.ord` | 0.3979 | 0.4076 |
| 2020 | 103 | `margBy.cg` | 0.1737 | 0.1786 |
| 2020 | 103 | `margBy.ed` | 0.1619 | 0.1753 |
| 2020 | 103 | `margBy.nd` | 0.2868 | 0.2979 |
| 2020 | 103 | `margBy.fd` | 0.5161 | 0.5278 |
| 2020 | 103 | `people.0.prov` | 1882.4621 | 1804.776 |
| 2020 | 103 | `people.0.total` | 5476.9145 | 5399.2285 |
| 2020 | 107 | `total` | 20296.1951 | 19837.3135 |
| 2020 | 107 | `prov` | 4541.2384 | 4082.3568 |
| 2020 | 107 | `netTotal` | -2939.0926 | -3397.9742 |
| 2020 | 107 | `marg` | 0.5225 | 0.5322 |
| 2020 | 107 | `incomeTax` | 9444.1014 | 8985.2198 |
| 2020 | 107 | `gross` | 36433.7491 | 35974.8675 |
| 2020 | 107 | `avg` | 0.2706 | 0.2645 |
| 2020 | 107 | `grossAvg` | 0.4858 | 0.4797 |
| 2020 | 107 | `margBy.ord` | 0.5225 | 0.5322 |
| 2020 | 107 | `margBy.cg` | 0.2613 | 0.2661 |
| 2020 | 107 | `margBy.ed` | 0.4034 | 0.4168 |
| 2020 | 107 | `margBy.nd` | 0.488 | 0.4992 |
| 2020 | 107 | `margBy.fd` | 0.5225 | 0.5322 |
| 2020 | 107 | `people.0.prov` | 4541.2384 | 4082.3568 |
| 2020 | 107 | `people.0.total` | 13198.4614 | 12739.5798 |
| 2020 | 110 | `invTax` | 28448.2814 | 28632.8696 |
| 2020 | 113 | `invTax` | 5554.2161 | 5613.2645 |
| 2020 | 114 | `total` | 15482.178 | 15412.275 |
| 2020 | 114 | `prov` | 10160.5379 | 10090.6349 |
| 2020 | 114 | `netTotal` | 13682.938 | 13613.035 |
| 2020 | 114 | `marg` | 0.5575 | 0.5669 |
| 2020 | 114 | `invTax` | 21610.8276 | 22125.825 |
| 2020 | 114 | `incomeTax` | 20391.868 | 20321.965 |
| 2020 | 114 | `gross` | 25217.458 | 25147.555 |
| 2020 | 114 | `avg` | 0.1447 | 0.144 |
| 2020 | 114 | `grossAvg` | 0.2357 | 0.235 |
| 2020 | 114 | `margBy.ord` | 0.5575 | 0.5669 |
| 2020 | 114 | `margBy.cg` | 0.2535 | 0.2582 |
| 2020 | 114 | `margBy.ed` | 0.3916 | 0.4046 |
| 2020 | 114 | `margBy.nd` | 0.4737 | 0.4845 |
| 2020 | 114 | `margBy.fd` | 0.5536 | 0.5637 |
| 2020 | 114 | `people.0.pFtc` | 315.4483 | 313.2781 |
| 2020 | 114 | `people.0.prov` | 10160.5379 | 10090.6349 |
| 2020 | 114 | `people.0.total` | 23418.218 | 23348.315 |
| 2020 | 116 | `total` | -7277.2119 | -8915.1739 |
| 2020 | 116 | `prov` | 5737.8681 | 4099.9061 |
| 2020 | 116 | `netTotal` | -13828.4519 | -15466.4139 |
| 2020 | 116 | `marg` | 0.4228 | 0.4325 |
| 2020 | 116 | `incomeTax` | 12072.1731 | 10434.2111 |
| 2020 | 116 | `gross` | 23446.7131 | 21808.7511 |
| 2020 | 116 | `avg` | -0.0958 | -0.1173 |
| 2020 | 116 | `grossAvg` | 0.3085 | 0.287 |
| 2020 | 116 | `margBy.ord` | 0.4228 | 0.4325 |
| 2020 | 116 | `margBy.cg` | 0.1863 | 0.1911 |
| 2020 | 116 | `margBy.ed` | 0.1964 | 0.2098 |
| 2020 | 116 | `margBy.nd` | 0.3155 | 0.3267 |
| 2020 | 116 | `margBy.fd` | 0.4629 | 0.5157 |
| 2020 | 116 | `people.0.prov` | 2868.9341 | 1230.972 |
| 2020 | 116 | `people.0.total` | 8447.7366 | 6809.7745 |
| 2020 | 117 | `invTax` | 22588.4477 | 22598.1672 |
| 2020 | 119 | `total` | -15841.4705 | -16831.0475 |
| 2020 | 119 | `prov` | 989.577 | 0 |
| 2020 | 119 | `netTotal` | -18792.7105 | -19782.2875 |
| 2020 | 119 | `marg` | 0.4283 | 0.3277 |
| 2020 | 119 | `incomeTax` | 1054.3395 | 64.7625 |
| 2020 | 119 | `gross` | 5870.8295 | 4881.2525 |
| 2020 | 119 | `avg` | -0.528 | -0.561 |
| 2020 | 119 | `grossAvg` | 0.1957 | 0.1627 |
| 2020 | 119 | `margBy.ord` | 0.4283 | 0.3277 |
| 2020 | 119 | `margBy.cg` | 0.189 | 0.135 |
| 2020 | 119 | `margBy.ed` | 0.204 | 0.1653 |
| 2020 | 119 | `margBy.nd` | 0.3218 | 0.2067 |
| 2020 | 119 | `margBy.fd` | 0.378 | 0.27 |
| 2020 | 119 | `people.0.prov` | 989.577 | 0 |
| 2020 | 119 | `people.0.total` | 2919.5895 | 1930.0125 |
| 2020 | 121 | `total` | -12851.1804 | -13820.5145 |
| 2020 | 121 | `prov` | 1882.4621 | 913.128 |
| 2020 | 121 | `netTotal` | -21562.4204 | -22531.7545 |
| 2020 | 121 | `marg` | 0.5574 | 0.5671 |
| 2020 | 121 | `incomeTax` | 3065.2646 | 2095.9305 |
| 2020 | 121 | `gross` | 14188.1546 | 13218.8205 |
| 2020 | 121 | `avg` | -0.3382 | -0.3637 |
| 2020 | 121 | `grossAvg` | 0.3734 | 0.3479 |
| 2020 | 121 | `margBy.ord` | 0.5574 | 0.5671 |
| 2020 | 121 | `margBy.cg` | 0.2537 | 0.2586 |
| 2020 | 121 | `margBy.ed` | 0.3827 | 0.3961 |
| 2020 | 121 | `margBy.nd` | 0.4708 | 0.4819 |
| 2020 | 121 | `margBy.fd` | 0.5761 | 0.6113 |
| 2020 | 121 | `people.0.prov` | 1882.4621 | 913.128 |
| 2020 | 121 | `people.0.total` | 5476.9145 | 4507.5805 |
| 2020 | 123 | `total` | 32373.5882 | 31626.6706 |
| 2020 | 123 | `prov` | 4698.7594 | 3951.8418 |
| 2020 | 123 | `netTotal` | 5057.5689 | 4310.6513 |
| 2020 | 123 | `incomeTax` | 9713.6179 | 8966.7003 |
| 2020 | 123 | `gross` | 42649.2472 | 41902.3296 |
| 2020 | 123 | `avg` | 0.3303 | 0.3227 |
| 2020 | 123 | `grossAvg` | 0.4352 | 0.4276 |
| 2020 | 123 | `people.1.prov` | 2722.7104 | 1975.7928 |
| 2020 | 123 | `people.1.total` | 9442.8164 | 8695.8988 |
| 2020 | 124 | `total` | 15391.8952 | 15382.1757 |
| 2020 | 124 | `prov` | 1171.0602 | 1161.3407 |
| 2020 | 124 | `netTotal` | 1711.6427 | 1701.9232 |
| 2020 | 124 | `marg` | 0.4283 | 0.438 |
| 2020 | 124 | `incomeTax` | 2102.1327 | 2092.4132 |
| 2020 | 124 | `gross` | 17101.2352 | 17091.5157 |
| 2020 | 124 | `avg` | 0.6996 | 0.6992 |
| 2020 | 124 | `grossAvg` | 0.7773 | 0.7769 |
| 2020 | 124 | `margBy.ord` | 0.4283 | 0.438 |
| 2020 | 124 | `margBy.cg` | 0.189 | 0.1939 |
| 2020 | 124 | `margBy.ed` | 0.204 | 0.2174 |
| 2020 | 124 | `margBy.nd` | 0.3218 | 0.333 |
| 2020 | 124 | `margBy.fd` | 0.4315 | 0.4416 |
| 2020 | 124 | `people.0.prov` | 1171.0602 | 1161.3407 |
| 2020 | 124 | `people.0.total` | 3420.9827 | 3411.2632 |
| 2020 | 126 | `invTax` | 19317.1791 | 19490.0767 |
| 2020 | 127 | `total` | 12378.1009 | 12091.9543 |
| 2020 | 127 | `prov` | 5961.7147 | 5675.5682 |
| 2020 | 127 | `netTotal` | 8008.8381 | 7722.6916 |
| 2020 | 127 | `marg` | 0.4974 | 0.507 |
| 2020 | 127 | `invTax` | 10770.7033 | 10991.9305 |
| 2020 | 127 | `incomeTax` | 15017.9281 | 14731.7816 |
| 2020 | 127 | `gross` | 22947.3009 | 22661.1543 |
| 2020 | 127 | `avg` | 0.1608 | 0.157 |
| 2020 | 127 | `grossAvg` | 0.298 | 0.2943 |
| 2020 | 127 | `margBy.ord` | 0.4974 | 0.507 |
| 2020 | 127 | `margBy.cg` | 0.2295 | 0.2344 |
| 2020 | 127 | `margBy.ed` | 0.3157 | 0.3292 |
| 2020 | 127 | `margBy.nd` | 0.415 | 0.4262 |
| 2020 | 127 | `margBy.fd` | 0.459 | 0.4687 |
| 2020 | 127 | `people.0.prov` | 5961.7147 | 5675.5682 |
| 2020 | 127 | `people.0.total` | 18578.0381 | 18291.8916 |
| 2020 | 128 | `total` | 13444.2222 | 13156.5378 |
| 2020 | 128 | `prov` | 2963.048 | 2675.3635 |
| 2020 | 128 | `netTotal` | 2329.2155 | 2041.531 |
| 2020 | 128 | `marg` | 0.4478 | 0.4575 |
| 2020 | 128 | `incomeTax` | 5403.6455 | 5115.961 |
| 2020 | 128 | `gross` | 19545.0022 | 19257.3178 |
| 2020 | 128 | `avg` | 0.286 | 0.2799 |
| 2020 | 128 | `grossAvg` | 0.4159 | 0.4097 |
| 2020 | 128 | `margBy.ord` | 0.4478 | 0.4575 |
| 2020 | 128 | `margBy.cg` | 0.1988 | 0.2036 |
| 2020 | 128 | `margBy.ed` | 0.2309 | 0.2443 |
| 2020 | 128 | `margBy.nd` | 0.3443 | 0.3554 |
| 2020 | 128 | `margBy.fd` | 0.5319 | 0.5477 |
| 2020 | 128 | `people.0.prov` | 2963.048 | 2675.3635 |
| 2020 | 128 | `people.0.total` | 8429.9955 | 8142.311 |
| 2020 | 133 | `total` | -8529.4674 | -10069.8887 |
| 2020 | 133 | `prov` | 5200.4798 | 3660.0585 |
| 2020 | 133 | `netTotal` | -11651.4617 | -13191.883 |
| 2020 | 133 | `marg` | 0.4777 | 0.4874 |
| 2020 | 133 | `invTax` | 16187.4456 | 16566.5888 |
| 2020 | 133 | `incomeTax` | 11222.5783 | 9682.157 |
| 2020 | 133 | `gross` | 17733.5726 | 16193.1513 |
| 2020 | 133 | `avg` | -0.098 | -0.1157 |
| 2020 | 133 | `grossAvg` | 0.2038 | 0.1861 |
| 2020 | 133 | `margBy.ord` | 0.4777 | 0.4874 |
| 2020 | 133 | `margBy.cg` | 0.2138 | 0.2186 |
| 2020 | 133 | `margBy.ed` | 0.2723 | 0.2857 |
| 2020 | 133 | `margBy.nd` | 0.3788 | 0.3899 |
| 2020 | 133 | `margBy.fd` | 0.4275 | 0.4372 |
| 2020 | 133 | `people.0.prov` | 163.6098 | 74.2058 |
| 2020 | 133 | `people.0.total` | 526.2598 | 436.8558 |
| 2020 | 133 | `people.1.prov` | 5036.87 | 3585.8527 |
| 2020 | 133 | `people.1.total` | 14085.3185 | 12634.3012 |
| 2020 | 134 | `invTax` | 6834.0301 | 6843.7496 |
| 2020 | 136 | `total` | -1555.617 | -2663.1466 |
| 2020 | 136 | `prov` | 8317.912 | 7210.3824 |
| 2020 | 136 | `netTotal` | -5946.857 | -7054.3866 |
| 2020 | 136 | `marg` | 0.474 | 0.4837 |
| 2020 | 136 | `incomeTax` | 18345.775 | 17238.2454 |
| 2020 | 136 | `gross` | 26491.375 | 25383.8454 |
| 2020 | 136 | `avg` | -0.0183 | -0.0313 |
| 2020 | 136 | `grossAvg` | 0.3117 | 0.2986 |
| 2020 | 136 | `margBy.ord` | 0.474 | 0.4837 |
| 2020 | 136 | `margBy.cg` | 0.237 | 0.2419 |
| 2020 | 136 | `margBy.ed` | 0.3364 | 0.3499 |
| 2020 | 136 | `margBy.nd` | 0.4322 | 0.4434 |
| 2020 | 136 | `margBy.fd` | 0.474 | 0.4837 |
| 2020 | 136 | `people.0.prov` | 8317.912 | 7210.3824 |
| 2020 | 136 | `people.0.total` | 22100.135 | 20992.6054 |
| 2020 | 141 | `total` | 13510.3874 | 13003.0136 |
| 2020 | 141 | `prov` | 3924.9339 | 3417.5601 |
| 2020 | 141 | `netTotal` | -2761.8651 | -3269.2389 |
| 2020 | 141 | `marg` | 0.6105 | 0.6202 |
| 2020 | 141 | `incomeTax` | 7832.5449 | 7325.1711 |
| 2020 | 141 | `gross` | 27664.9074 | 27157.5336 |
| 2020 | 141 | `avg` | 0.2456 | 0.2364 |
| 2020 | 141 | `grossAvg` | 0.503 | 0.4938 |
| 2020 | 141 | `margBy.ord` | 0.6105 | 0.6202 |
| 2020 | 141 | `margBy.cg` | 0.2863 | 0.2911 |
| 2020 | 141 | `margBy.ed` | 0.4724 | 0.4858 |
| 2020 | 141 | `margBy.nd` | 0.5455 | 0.5567 |
| 2020 | 141 | `margBy.fd` | 0.5793 | 0.5983 |
| 2020 | 141 | `people.0.prov` | 3924.9339 | 3417.5601 |
| 2020 | 141 | `people.0.total` | 11392.6549 | 10885.2811 |
| 2020 | 143 | `total` | 7289.1348 | 7125.8712 |
| 2020 | 143 | `prov` | 4057.097 | 3893.8334 |
| 2020 | 143 | `netTotal` | 4167.1405 | 4003.8769 |
| 2020 | 143 | `marg` | 0.3785 | 0.3882 |
| 2020 | 143 | `invTax` | 9983.3428 | 10253.17 |
| 2020 | 143 | `incomeTax` | 7940.4105 | 7777.1469 |
| 2020 | 143 | `gross` | 13222.0048 | 13058.7412 |
| 2020 | 143 | `avg` | 0.0819 | 0.0801 |
| 2020 | 143 | `grossAvg` | 0.1486 | 0.1467 |
| 2020 | 143 | `margBy.ord` | 0.3785 | 0.3882 |
| 2020 | 143 | `margBy.cg` | 0.164 | 0.1689 |
| 2020 | 143 | `margBy.ed` | 0.135 | 0.1484 |
| 2020 | 143 | `margBy.nd` | 0.2643 | 0.2755 |
| 2020 | 143 | `margBy.fd` | 0.328 | 0.3377 |
| 2020 | 143 | `people.0.prov` | 631.0602 | 572.7407 |
| 2020 | 143 | `people.0.total` | 2130.9827 | 2072.6632 |
| 2020 | 143 | `people.1.prov` | 3426.0368 | 3321.0926 |
| 2020 | 143 | `people.1.total` | 7969.0278 | 7864.0836 |
| 2020 | 144 | `total` | 26277.4855 | 26238.417 |
| 2020 | 144 | `prov` | 2325.548 | 2286.4795 |
| 2020 | 144 | `netTotal` | 5554.6205 | 5515.552 |
| 2020 | 144 | `marg` | 0.378 | 0.3877 |
| 2020 | 144 | `incomeTax` | 4016.1455 | 3977.077 |
| 2020 | 144 | `gross` | 27765.3605 | 27726.292 |
| 2020 | 144 | `avg` | 0.5591 | 0.5583 |
| 2020 | 144 | `grossAvg` | 0.5908 | 0.5899 |
| 2020 | 144 | `margBy.ord` | 0.378 | 0.3877 |
| 2020 | 144 | `margBy.cg` | 0.1638 | 0.1686 |
| 2020 | 144 | `margBy.ed` | 0.1343 | 0.1477 |
| 2020 | 144 | `margBy.nd` | 0.2638 | 0.2749 |
| 2020 | 144 | `margBy.fd` | 0.4811 | 0.4918 |
| 2020 | 144 | `people.0.prov` | 2325.548 | 2286.4795 |
| 2020 | 144 | `people.0.total` | 7042.4955 | 7003.427 |
| 2020 | 145 | `total` | 11553.4916 | 11132.5627 |
| 2020 | 145 | `prov` | 4396.1702 | 3975.2412 |
| 2020 | 145 | `netTotal` | 4481.5977 | 4060.6687 |
| 2020 | 145 | `marg` | 0.4627 | 0.4724 |
| 2020 | 145 | `incomeTax` | 8821.1177 | 8400.1887 |
| 2020 | 145 | `gross` | 21945.7116 | 21524.7827 |
| 2020 | 145 | `avg` | 0.1229 | 0.1184 |
| 2020 | 145 | `grossAvg` | 0.2335 | 0.229 |
| 2020 | 145 | `margBy.ord` | 0.4627 | 0.4724 |
| 2020 | 145 | `margBy.cg` | 0.2063 | 0.2111 |
| 2020 | 145 | `margBy.ed` | 0.2516 | 0.265 |
| 2020 | 145 | `margBy.nd` | 0.3615 | 0.3727 |
| 2020 | 145 | `margBy.fd` | 0.4125 | 0.4222 |
| 2020 | 145 | `people.0.prov` | 446.6502 | 387.6017 |
| 2020 | 145 | `people.0.total` | 3473.0002 | 3413.9517 |
| 2020 | 145 | `people.1.prov` | 3949.52 | 3587.6395 |
| 2020 | 145 | `people.1.total` | 11400.8175 | 11038.937 |
| 2020 | 146 | `total` | 21363.7171 | 21304.6686 |
| 2020 | 146 | `prov` | 5358.0561 | 5299.0076 |
| 2020 | 146 | `netTotal` | 17836.4771 | 17777.4286 |
| 2020 | 146 | `marg` | 0.1689 | 0.1786 |
| 2020 | 146 | `incomeTax` | 11250.0171 | 11190.9686 |
| 2020 | 146 | `gross` | 21363.7171 | 21304.6686 |
| 2020 | 146 | `avg` | 0.2094 | 0.2089 |
| 2020 | 146 | `grossAvg` | 0.2094 | 0.2089 |
| 2020 | 146 | `margBy.ord` | 0.1689 | 0.1786 |
| 2020 | 146 | `margBy.cg` | 0.054 | 0.0589 |
| 2020 | 146 | `margBy.ed` | 0.0386 | 0.0521 |
| 2020 | 146 | `margBy.nd` | 0.1152 | 0.1264 |
| 2020 | 146 | `margBy.fd` | 0.231 | 0.2442 |
| 2020 | 146 | `people.0.prov` | 446.6502 | 387.6017 |
| 2020 | 146 | `people.0.total` | 3473.0002 | 3413.9517 |
| 2021 | 2 | `total` | 1804.0063 | 1697.2132 |
| 2021 | 2 | `prov` | 152.4042 | 45.6111 |
| 2021 | 2 | `netTotal` | -1294.1758 | -1400.9689 |
| 2021 | 2 | `marg` | 0.1508 | 0.1605 |
| 2021 | 2 | `incomeTax` | 152.4042 | 45.6111 |
| 2021 | 2 | `gross` | 3903.4363 | 3796.6432 |
| 2021 | 2 | `avg` | 0.1503 | 0.1414 |
| 2021 | 2 | `grossAvg` | 0.3253 | 0.3164 |
| 2021 | 2 | `margBy.ord` | 0.1508 | 0.1605 |
| 2021 | 2 | `margBy.cg` | 0.044 | 0.0489 |
| 2021 | 2 | `margBy.ed` | 0.011 | 0.0245 |
| 2021 | 2 | `margBy.nd` | 0.0922 | 0.1034 |
| 2021 | 2 | `margBy.fd` | 0.2245 | 0.243 |
| 2021 | 2 | `people.0.prov` | 152.4042 | 45.6111 |
| 2021 | 2 | `people.0.total` | 805.2542 | 698.4611 |
| 2021 | 4 | `total` | -4084.6391 | -4259.7098 |
| 2021 | 4 | `prov` | 772.4538 | 597.3831 |
| 2021 | 4 | `netTotal` | -7182.8212 | -7357.8919 |
| 2021 | 4 | `marg` | 0.32 | 0.3296 |
| 2021 | 4 | `incomeTax` | 772.4538 | 597.3831 |
| 2021 | 4 | `gross` | 5648.2859 | 5473.2152 |
| 2021 | 4 | `avg` | -0.1459 | -0.1521 |
| 2021 | 4 | `grossAvg` | 0.2017 | 0.1955 |
| 2021 | 4 | `margBy.ord` | 0.32 | 0.3296 |
| 2021 | 4 | `margBy.cg` | 0.129 | 0.1339 |
| 2021 | 4 | `margBy.ed` | 0.2456 | 0.2591 |
| 2021 | 4 | `margBy.nd` | 0.2877 | 0.2989 |
| 2021 | 4 | `margBy.fd` | 0.38 | 0.3959 |
| 2021 | 4 | `people.0.prov` | 772.4538 | 597.3831 |
| 2021 | 4 | `people.0.total` | 2550.1038 | 2375.0331 |
| 2021 | 5 | `total` | -3987.7239 | -4143.4518 |
| 2021 | 5 | `prov` | 973.269 | 817.5411 |
| 2021 | 5 | `netTotal` | -7085.906 | -7241.6339 |
| 2021 | 5 | `marg` | 0.32 | 0.3296 |
| 2021 | 5 | `incomeTax` | 973.269 | 817.5411 |
| 2021 | 5 | `gross` | 5989.7011 | 5833.9732 |
| 2021 | 5 | `avg` | -0.1329 | -0.1381 |
| 2021 | 5 | `grossAvg` | 0.1997 | 0.1945 |
| 2021 | 5 | `margBy.ord` | 0.32 | 0.3296 |
| 2021 | 5 | `margBy.cg` | 0.129 | 0.1339 |
| 2021 | 5 | `margBy.ed` | 0.2456 | 0.2591 |
| 2021 | 5 | `margBy.nd` | 0.2877 | 0.2989 |
| 2021 | 5 | `margBy.fd` | 0.3752 | 0.39 |
| 2021 | 5 | `people.0.prov` | 973.269 | 817.5411 |
| 2021 | 5 | `people.0.total` | 2891.519 | 2735.7911 |
| 2021 | 6 | `total` | -26353.8322 | -27850.5691 |
| 2021 | 6 | `prov` | 2695.2383 | 1198.5014 |
| 2021 | 6 | `netTotal` | -29452.0142 | -30948.7511 |
| 2021 | 6 | `marg` | 0.6082 | 0.6178 |
| 2021 | 6 | `incomeTax` | 4668.3758 | 3171.6389 |
| 2021 | 6 | `gross` | 10739.3078 | 9242.5709 |
| 2021 | 6 | `avg` | -0.5856 | -0.6189 |
| 2021 | 6 | `grossAvg` | 0.2387 | 0.2054 |
| 2021 | 6 | `margBy.ord` | 0.6082 | 0.6178 |
| 2021 | 6 | `margBy.cg` | 0.2788 | 0.2836 |
| 2021 | 6 | `margBy.ed` | 0.4517 | 0.4651 |
| 2021 | 6 | `margBy.nd` | 0.5283 | 0.5394 |
| 2021 | 6 | `margBy.fd` | 0.6029 | 0.6459 |
| 2021 | 6 | `people.0.prov` | 2695.2383 | 1198.5014 |
| 2021 | 6 | `people.0.total` | 7641.1258 | 6144.3889 |
| 2021 | 7 | `total` | -9696.3705 | -11048.0364 |
| 2021 | 7 | `prov` | 4498.7034 | 3147.0375 |
| 2021 | 7 | `netTotal` | -12794.5526 | -14146.2185 |
| 2021 | 7 | `marg` | 0.6512 | 0.6608 |
| 2021 | 7 | `incomeTax` | 9160.7974 | 7809.1315 |
| 2021 | 7 | `gross` | 16227.7695 | 14876.1036 |
| 2021 | 7 | `avg` | -0.1616 | -0.1841 |
| 2021 | 7 | `grossAvg` | 0.2705 | 0.2479 |
| 2021 | 7 | `margBy.ord` | 0.6512 | 0.6608 |
| 2021 | 7 | `margBy.cg` | 0.3063 | 0.3111 |
| 2021 | 7 | `margBy.ed` | 0.5276 | 0.541 |
| 2021 | 7 | `margBy.nd` | 0.5915 | 0.6027 |
| 2021 | 7 | `margBy.fd` | 0.6125 | 0.6411 |
| 2021 | 7 | `people.0.prov` | 4498.7034 | 3147.0375 |
| 2021 | 7 | `people.0.total` | 13129.5874 | 11777.9215 |
| 2021 | 8 | `total` | 45632.9603 | 45541.6846 |
| 2021 | 8 | `prov` | 14945.8822 | 14854.6065 |
| 2021 | 8 | `netTotal` | 38934.7782 | 38843.5025 |
| 2021 | 8 | `marg` | 0.436 | 0.4457 |
| 2021 | 8 | `incomeTax` | 34535.4302 | 34444.1545 |
| 2021 | 8 | `gross` | 49345.5923 | 49254.3166 |
| 2021 | 8 | `avg` | 0.3042 | 0.3036 |
| 2021 | 8 | `grossAvg` | 0.329 | 0.3284 |
| 2021 | 8 | `margBy.ord` | 0.436 | 0.4457 |
| 2021 | 8 | `margBy.cg` | 0.218 | 0.2229 |
| 2021 | 8 | `margBy.ed` | 0.284 | 0.2974 |
| 2021 | 8 | `margBy.nd` | 0.3885 | 0.3997 |
| 2021 | 8 | `margBy.fd` | 0.436 | 0.4457 |
| 2021 | 8 | `people.0.prov` | 7472.9411 | 7381.6654 |
| 2021 | 8 | `people.0.total` | 21323.7051 | 21232.4294 |
| 2021 | 10 | `total` | -2336.0762 | -2814.8591 |
| 2021 | 10 | `prov` | 2483.6093 | 2004.8264 |
| 2021 | 10 | `netTotal` | -5434.2582 | -5913.0411 |
| 2021 | 10 | `marg` | 0.6629 | 0.6726 |
| 2021 | 10 | `incomeTax` | 4557.3218 | 4078.5389 |
| 2021 | 10 | `gross` | 10437.5038 | 9958.7209 |
| 2021 | 10 | `avg` | -0.0519 | -0.0626 |
| 2021 | 10 | `grossAvg` | 0.2319 | 0.2213 |
| 2021 | 10 | `margBy.ord` | 0.6629 | 0.6726 |
| 2021 | 10 | `margBy.cg` | 0.3063 | 0.3111 |
| 2021 | 10 | `margBy.ed` | 0.5276 | 0.541 |
| 2021 | 10 | `margBy.nd` | 0.5915 | 0.6027 |
| 2021 | 10 | `margBy.fd` | 0.6313 | 0.6547 |
| 2021 | 10 | `people.0.prov` | 2483.6093 | 2004.8264 |
| 2021 | 10 | `people.0.total` | 6827.0718 | 6348.2889 |
| 2021 | 11 | `total` | 30495.1977 | 30321.086 |
| 2021 | 11 | `prov` | 14316.4691 | 14142.3574 |
| 2021 | 11 | `netTotal` | 27397.0156 | 27222.9039 |
| 2021 | 11 | `marg` | 0.514 | 0.5237 |
| 2021 | 11 | `incomeTax` | 32456.8656 | 32282.7539 |
| 2021 | 11 | `gross` | 39611.0377 | 39436.926 |
| 2021 | 11 | `avg` | 0.2541 | 0.2527 |
| 2021 | 11 | `grossAvg` | 0.3301 | 0.3286 |
| 2021 | 11 | `margBy.ord` | 0.514 | 0.5237 |
| 2021 | 11 | `margBy.cg` | 0.257 | 0.2619 |
| 2021 | 11 | `margBy.ed` | 0.3916 | 0.4051 |
| 2021 | 11 | `margBy.nd` | 0.4782 | 0.4894 |
| 2021 | 11 | `margBy.fd` | 0.514 | 0.5237 |
| 2021 | 11 | `people.0.prov` | 14316.4691 | 14142.3574 |
| 2021 | 11 | `people.0.total` | 36512.8556 | 36338.7439 |
| 2021 | 23 | `total` | -5540.2989 | -5993.2428 |
| 2021 | 23 | `prov` | 973.269 | 520.3251 |
| 2021 | 23 | `netTotal` | -8638.481 | -9091.4249 |
| 2021 | 23 | `marg` | 0.1707 | 0.1804 |
| 2021 | 23 | `incomeTax` | 973.269 | 520.3251 |
| 2021 | 23 | `gross` | 5989.7011 | 5536.7572 |
| 2021 | 23 | `avg` | -0.1847 | -0.1998 |
| 2021 | 23 | `grossAvg` | 0.1997 | 0.1846 |
| 2021 | 23 | `margBy.ord` | 0.1707 | 0.1804 |
| 2021 | 23 | `margBy.cg` | 0.054 | 0.0589 |
| 2021 | 23 | `margBy.ed` | 0.0386 | 0.0521 |
| 2021 | 23 | `margBy.nd` | 0.1152 | 0.1264 |
| 2021 | 23 | `margBy.fd` | 0.2252 | 0.25 |
| 2021 | 23 | `people.0.prov` | 973.269 | 520.3251 |
| 2021 | 23 | `people.0.total` | 2891.519 | 2438.5751 |
| 2021 | 26 | `total` | 2847.3848 | 2837.3057 |
| 2021 | 26 | `prov` | 1156.4802 | 1146.4011 |
| 2021 | 26 | `netTotal` | 613.2027 | 603.1236 |
| 2021 | 26 | `marg` | 0.3102 | 0.3198 |
| 2021 | 26 | `incomeTax` | 1993.3527 | 1983.2736 |
| 2021 | 26 | `gross` | 5583.3848 | 5573.3057 |
| 2021 | 26 | `avg` | 0.1294 | 0.129 |
| 2021 | 26 | `grossAvg` | 0.2538 | 0.2533 |
| 2021 | 26 | `margBy.ord` | 0.3102 | 0.3198 |
| 2021 | 26 | `margBy.cg` | 0.129 | 0.1339 |
| 2021 | 26 | `margBy.ed` | 0.0384 | 0.0518 |
| 2021 | 26 | `margBy.nd` | 0.1838 | 0.195 |
| 2021 | 26 | `margBy.fd` | 0.3163 | 0.3264 |
| 2021 | 26 | `people.0.prov` | 1156.4802 | 1146.4011 |
| 2021 | 26 | `people.0.total` | 3349.2027 | 3339.1236 |
| 2021 | 31 | `total` | -13884.9018 | -14054.91 |
| 2021 | 31 | `prov` | 170.0082 | 0 |
| 2021 | 31 | `netTotal` | -22622.1418 | -22792.15 |
| 2021 | 31 | `marg` | 0.1707 | 0.0703 |
| 2021 | 31 | `incomeTax` | 170.0082 | 0 |
| 2021 | 31 | `gross` | 10263.0982 | 10093.09 |
| 2021 | 31 | `avg` | -0.6311 | -0.6389 |
| 2021 | 31 | `grossAvg` | 0.4665 | 0.4588 |
| 2021 | 31 | `margBy.ord` | 0.1707 | 0.0703 |
| 2021 | 31 | `margBy.cg` | 0.054 | 0 |
| 2021 | 31 | `margBy.ed` | 0.0386 | 0 |
| 2021 | 31 | `margBy.nd` | 0.1152 | 0 |
| 2021 | 31 | `margBy.fd` | 0.108 | 0 |
| 2021 | 31 | `people.0.prov` | 170.0082 | 0 |
| 2021 | 31 | `people.0.total` | 1525.8582 | 1355.85 |
| 2021 | 36 | `total` | -20259.3728 | -21241.2358 |
| 2021 | 36 | `prov` | 1741.7739 | 759.9108 |
| 2021 | 36 | `netTotal` | -23236.6127 | -24218.4758 |
| 2021 | 36 | `marg` | 0.7077 | 0.7173 |
| 2021 | 36 | `invTax` | 4329.5291 | 3517.6742 |
| 2021 | 36 | `incomeTax` | 1881.6772 | 899.8141 |
| 2021 | 36 | `gross` | 6214.7672 | 5232.9041 |
| 2021 | 36 | `avg` | -0.5331 | -0.559 |
| 2021 | 36 | `grossAvg` | 0.1635 | 0.1377 |
| 2021 | 36 | `margBy.ord` | 0.7077 | 0.7173 |
| 2021 | 36 | `margBy.cg` | 0.3288 | 0.3336 |
| 2021 | 36 | `margBy.ed` | 0.5897 | 0.6031 |
| 2021 | 36 | `margBy.nd` | 0.6433 | 0.6544 |
| 2021 | 36 | `margBy.fd` | 0.6575 | 0.6672 |
| 2021 | 36 | `people.0.prov` | 1741.7739 | 759.9108 |
| 2021 | 36 | `people.0.total` | 3237.5272 | 2255.6641 |
| 2021 | 37 | `total` | -3510.7585 | -4517.6533 |
| 2021 | 37 | `prov` | 4426.8323 | 3419.9375 |
| 2021 | 37 | `netTotal` | -6850.9077 | -7857.8025 |
| 2021 | 37 | `marg` | 0.5584 | 0.5681 |
| 2021 | 37 | `incomeTax` | 8818.2323 | 7811.3375 |
| 2021 | 37 | `gross` | 17752.3815 | 16745.4867 |
| 2021 | 37 | `avg` | -0.0413 | -0.0531 |
| 2021 | 37 | `grossAvg` | 0.2089 | 0.197 |
| 2021 | 37 | `margBy.ord` | 0.5584 | 0.5681 |
| 2021 | 37 | `margBy.cg` | 0.2537 | 0.2586 |
| 2021 | 37 | `margBy.ed` | 0.3827 | 0.3961 |
| 2021 | 37 | `margBy.nd` | 0.4708 | 0.4819 |
| 2021 | 37 | `margBy.fd` | 0.5931 | 0.6268 |
| 2021 | 37 | `people.0.prov` | 1143.0018 | 1141.8651 |
| 2021 | 37 | `people.0.total` | 4441.8043 | 4440.6676 |
| 2021 | 37 | `people.1.prov` | 3283.8305 | 2278.0724 |
| 2021 | 37 | `people.1.total` | 9970.428 | 8964.6699 |
| 2021 | 39 | `invTax` | 55755.7334 | 56657.8682 |
| 2021 | 40 | `total` | -23134.4437 | -24534.4666 |
| 2021 | 40 | `prov` | 3893.3393 | 2493.3164 |
| 2021 | 40 | `netTotal` | -24648.6257 | -26048.6486 |
| 2021 | 40 | `marg` | 0.6629 | 0.6726 |
| 2021 | 40 | `incomeTax` | 7575.7643 | 6175.7414 |
| 2021 | 40 | `gross` | 12765.6963 | 11365.6734 |
| 2021 | 40 | `avg` | -0.4206 | -0.4461 |
| 2021 | 40 | `grossAvg` | 0.2321 | 0.2066 |
| 2021 | 40 | `margBy.ord` | 0.6629 | 0.6726 |
| 2021 | 40 | `margBy.cg` | 0.3063 | 0.3111 |
| 2021 | 40 | `margBy.ed` | 0.5276 | 0.541 |
| 2021 | 40 | `margBy.nd` | 0.5915 | 0.6027 |
| 2021 | 40 | `margBy.fd` | 0.6238 | 0.659 |
| 2021 | 40 | `people.0.prov` | 3893.3393 | 2493.3164 |
| 2021 | 40 | `people.0.total` | 11251.5143 | 9851.4914 |
| 2021 | 49 | `total` | 2244.9963 | 1938.0684 |
| 2021 | 49 | `prov` | 5293.4847 | 4986.5568 |
| 2021 | 49 | `netTotal` | -3612.2437 | -3919.1716 |
| 2021 | 49 | `marg` | 0.5102 | 0.5198 |
| 2021 | 49 | `invTax` | 15360.8981 | 15223.9784 |
| 2021 | 49 | `incomeTax` | 7945.1063 | 7638.1784 |
| 2021 | 49 | `gross` | 15158.1963 | 14851.2684 |
| 2021 | 49 | `avg` | 0.0325 | 0.0281 |
| 2021 | 49 | `grossAvg` | 0.2197 | 0.2152 |
| 2021 | 49 | `margBy.ord` | 0.5102 | 0.5198 |
| 2021 | 49 | `margBy.cg` | 0.2295 | 0.2344 |
| 2021 | 49 | `margBy.ed` | 0.3157 | 0.3292 |
| 2021 | 49 | `margBy.nd` | 0.415 | 0.4262 |
| 2021 | 49 | `margBy.fd` | 0.459 | 0.4687 |
| 2021 | 49 | `people.0.prov` | 5293.4847 | 4986.5568 |
| 2021 | 49 | `people.0.total` | 9300.9563 | 8994.0284 |
| 2021 | 55 | `total` | 36381.2357 | 36270.8872 |
| 2021 | 55 | `prov` | 14133.1091 | 14022.7606 |
| 2021 | 55 | `netTotal` | 23919.4536 | 23809.1051 |
| 2021 | 55 | `marg` | 0.529 | 0.5387 |
| 2021 | 55 | `invTax` | 17439.9836 | 17843.9468 |
| 2021 | 55 | `incomeTax` | 31491.8267 | 31381.4782 |
| 2021 | 55 | `gross` | 48009.5988 | 47899.2503 |
| 2021 | 55 | `avg` | 0.2475 | 0.2467 |
| 2021 | 55 | `grossAvg` | 0.3266 | 0.3258 |
| 2021 | 55 | `margBy.ord` | 0.529 | 0.5387 |
| 2021 | 55 | `margBy.cg` | 0.2645 | 0.2694 |
| 2021 | 55 | `margBy.ed` | 0.4123 | 0.4258 |
| 2021 | 55 | `margBy.nd` | 0.4955 | 0.5067 |
| 2021 | 55 | `margBy.fd` | 0.529 | 0.5387 |
| 2021 | 55 | `people.0.prov` | 14133.1091 | 14022.7606 |
| 2021 | 55 | `people.0.total` | 35547.8167 | 35437.4682 |
| 2021 | 56 | `total` | 4414.2765 | 4355.5974 |
| 2021 | 56 | `prov` | 616.4802 | 557.8011 |
| 2021 | 56 | `netTotal` | -1156.4035 | -1215.0826 |
| 2021 | 56 | `marg` | 0.2903 | 0.2999 |
| 2021 | 56 | `incomeTax` | 703.3527 | 644.6736 |
| 2021 | 56 | `gross` | 7629.8827 | 7571.2036 |
| 2021 | 56 | `avg` | 0.2006 | 0.198 |
| 2021 | 56 | `grossAvg` | 0.3468 | 0.3441 |
| 2021 | 56 | `margBy.ord` | 0.2903 | 0.2999 |
| 2021 | 56 | `margBy.cg` | 0.119 | 0.1239 |
| 2021 | 56 | `margBy.ed` | 0.0108 | 0.0242 |
| 2021 | 56 | `margBy.nd` | 0.1608 | 0.172 |
| 2021 | 56 | `margBy.fd` | 0.3451 | 0.3582 |
| 2021 | 56 | `people.0.prov` | 616.4802 | 557.8011 |
| 2021 | 56 | `people.0.total` | 2059.2027 | 2000.5236 |
| 2021 | 57 | `total` | -12336.9926 | -12507.0008 |
| 2021 | 57 | `prov` | 170.0082 | 0 |
| 2021 | 57 | `netTotal` | -23165.1418 | -23335.15 |
| 2021 | 57 | `marg` | 0.1707 | 0.0703 |
| 2021 | 57 | `incomeTax` | 170.0082 | 0 |
| 2021 | 57 | `gross` | 12354.0074 | 12183.9992 |
| 2021 | 57 | `avg` | -0.5608 | -0.5685 |
| 2021 | 57 | `grossAvg` | 0.5615 | 0.5538 |
| 2021 | 57 | `margBy.ord` | 0.1707 | 0.0703 |
| 2021 | 57 | `margBy.cg` | 0.054 | 0 |
| 2021 | 57 | `margBy.ed` | 0.0386 | 0 |
| 2021 | 57 | `margBy.nd` | 0.1152 | 0 |
| 2021 | 57 | `margBy.fd` | 0.2498 | 0.15 |
| 2021 | 57 | `people.0.prov` | 170.0082 | 0 |
| 2021 | 57 | `people.0.total` | 1525.8582 | 1355.85 |
| 2021 | 60 | `total` | 471.2603 | -59.0548 |
| 2021 | 60 | `prov` | 1031.5782 | 501.2631 |
| 2021 | 60 | `netTotal` | -8386.9218 | -8917.2369 |
| 2021 | 60 | `incomeTax` | 1031.5782 | 501.2631 |
| 2021 | 60 | `gross` | 11617.2603 | 11086.9452 |
| 2021 | 60 | `avg` | 0.0157 | -0.002 |
| 2021 | 60 | `grossAvg` | 0.3872 | 0.3696 |
| 2021 | 60 | `people.0.prov` | 1031.5782 | 501.2631 |
| 2021 | 60 | `people.0.total` | 2387.4282 | 1857.1131 |
| 2021 | 61 | `total` | 15564.9363 | 15182.6007 |
| 2021 | 61 | `prov` | 5509.1298 | 5126.7942 |
| 2021 | 61 | `netTotal` | 6827.6963 | 6445.3607 |
| 2021 | 61 | `marg` | 0.4675 | 0.4772 |
| 2021 | 61 | `incomeTax` | 11797.7038 | 11415.3682 |
| 2021 | 61 | `gross` | 24590.9338 | 24208.5982 |
| 2021 | 61 | `avg` | 0.2289 | 0.2233 |
| 2021 | 61 | `grossAvg` | 0.3616 | 0.356 |
| 2021 | 61 | `margBy.ord` | 0.4675 | 0.4772 |
| 2021 | 61 | `margBy.cg` | 0.2338 | 0.2386 |
| 2021 | 61 | `margBy.ed` | 0.3275 | 0.3409 |
| 2021 | 61 | `margBy.nd` | 0.4248 | 0.4359 |
| 2021 | 61 | `margBy.fd` | 0.4675 | 0.4772 |
| 2021 | 61 | `people.0.prov` | 5509.1298 | 5126.7942 |
| 2021 | 61 | `people.0.total` | 15853.6938 | 15471.3582 |
| 2021 | 63 | `total` | 1671.2351 | 1460.0762 |
| 2021 | 63 | `prov` | 3893.3393 | 3682.1804 |
| 2021 | 63 | `netTotal` | -622.5032 | -833.6622 |
| 2021 | 63 | `marg` | 0.5684 | 0.578 |
| 2021 | 63 | `incomeTax` | 7575.7643 | 7364.6054 |
| 2021 | 63 | `gross` | 13545.2526 | 13334.0937 |
| 2021 | 63 | `avg` | 0.0304 | 0.0265 |
| 2021 | 63 | `grossAvg` | 0.2463 | 0.2424 |
| 2021 | 63 | `margBy.ord` | 0.5684 | 0.578 |
| 2021 | 63 | `margBy.cg` | 0.2588 | 0.2636 |
| 2021 | 63 | `margBy.ed` | 0.3965 | 0.4099 |
| 2021 | 63 | `margBy.nd` | 0.4823 | 0.4934 |
| 2021 | 63 | `margBy.fd` | 0.5175 | 0.5272 |
| 2021 | 63 | `people.0.prov` | 3893.3393 | 3682.1804 |
| 2021 | 63 | `people.0.total` | 11251.5143 | 11040.3554 |
| 2021 | 64 | `total` | 6533.6788 | 5854.1272 |
| 2021 | 64 | `prov` | 5509.1298 | 4829.5782 |
| 2021 | 64 | `netTotal` | -2203.5612 | -2883.1128 |
| 2021 | 64 | `marg` | 0.5625 | 0.5722 |
| 2021 | 64 | `incomeTax` | 11797.7038 | 11118.1522 |
| 2021 | 64 | `gross` | 24590.9338 | 23911.3822 |
| 2021 | 64 | `avg` | 0.0961 | 0.0861 |
| 2021 | 64 | `grossAvg` | 0.3616 | 0.3516 |
| 2021 | 64 | `margBy.ord` | 0.5625 | 0.5722 |
| 2021 | 64 | `margBy.cg` | 0.2813 | 0.2861 |
| 2021 | 64 | `margBy.ed` | 0.4586 | 0.472 |
| 2021 | 64 | `margBy.nd` | 0.534 | 0.5452 |
| 2021 | 64 | `margBy.fd` | 0.638 | 0.6578 |
| 2021 | 64 | `people.0.prov` | 5509.1298 | 4829.5782 |
| 2021 | 64 | `people.0.total` | 15853.6938 | 15174.1422 |
| 2021 | 65 | `total` | 20758.1977 | 20389.686 |
| 2021 | 65 | `prov` | 10836.4691 | 10467.9574 |
| 2021 | 65 | `netTotal` | 17660.0156 | 17291.5039 |
| 2021 | 65 | `marg` | 0.514 | 0.5237 |
| 2021 | 65 | `incomeTax` | 23776.8656 | 23408.3539 |
| 2021 | 65 | `gross` | 30931.0377 | 30562.526 |
| 2021 | 65 | `avg` | 0.2076 | 0.2039 |
| 2021 | 65 | `grossAvg` | 0.3093 | 0.3056 |
| 2021 | 65 | `margBy.ord` | 0.514 | 0.5237 |
| 2021 | 65 | `margBy.cg` | 0.257 | 0.2619 |
| 2021 | 65 | `margBy.ed` | 0.3916 | 0.4051 |
| 2021 | 65 | `margBy.nd` | 0.4782 | 0.4894 |
| 2021 | 65 | `margBy.fd` | 0.514 | 0.5237 |
| 2021 | 65 | `people.0.prov` | 10836.4691 | 10467.9574 |
| 2021 | 65 | `people.0.total` | 27832.8556 | 27464.3439 |
| 2021 | 66 | `total` | 616.1506 | 4.6389 |
| 2021 | 66 | `prov` | 6486.4691 | 5874.9574 |
| 2021 | 66 | `netTotal` | -777.0894 | -1388.6011 |
| 2021 | 66 | `marg` | 0.474 | 0.4837 |
| 2021 | 66 | `incomeTax` | 14210.0431 | 13598.5314 |
| 2021 | 66 | `gross` | 19659.2731 | 19047.7614 |
| 2021 | 66 | `avg` | 0.0082 | 0.0001 |
| 2021 | 66 | `grossAvg` | 0.2621 | 0.254 |
| 2021 | 66 | `margBy.ord` | 0.474 | 0.4837 |
| 2021 | 66 | `margBy.cg` | 0.237 | 0.2419 |
| 2021 | 66 | `margBy.ed` | 0.3364 | 0.3499 |
| 2021 | 66 | `margBy.nd` | 0.4322 | 0.4434 |
| 2021 | 66 | `margBy.fd` | 0.474 | 0.4837 |
| 2021 | 66 | `people.0.prov` | 6486.4691 | 5874.9574 |
| 2021 | 66 | `people.0.total` | 18266.0331 | 17654.5214 |
| 2021 | 69 | `total` | 35082.9386 | 34397.2309 |
| 2021 | 69 | `prov` | 9432.6821 | 8746.9744 |
| 2021 | 69 | `netTotal` | 14962.4986 | 14276.7909 |
| 2021 | 69 | `marg` | 0.474 | 0.4837 |
| 2021 | 69 | `incomeTax` | 21179.9686 | 20494.2609 |
| 2021 | 69 | `gross` | 47274.6486 | 46588.9409 |
| 2021 | 69 | `avg` | 0.3341 | 0.3276 |
| 2021 | 69 | `grossAvg` | 0.4502 | 0.4437 |
| 2021 | 69 | `margBy.ord` | 0.474 | 0.4837 |
| 2021 | 69 | `margBy.cg` | 0.237 | 0.2419 |
| 2021 | 69 | `margBy.ed` | 0.3364 | 0.3499 |
| 2021 | 69 | `margBy.nd` | 0.4322 | 0.4434 |
| 2021 | 69 | `margBy.fd` | 0.474 | 0.4837 |
| 2021 | 69 | `people.0.prov` | 7472.9411 | 6787.2334 |
| 2021 | 69 | `people.0.total` | 21323.7051 | 20637.9974 |
| 2021 | 70 | `total` | 5939.582 | 5499.077 |
| 2021 | 70 | `prov` | 4374.9575 | 3934.4525 |
| 2021 | 70 | `netTotal` | 2841.4 | 2400.895 |
| 2021 | 70 | `marg` | 0.305 | 0.3147 |
| 2021 | 70 | `incomeTax` | 8698.205 | 8257.7 |
| 2021 | 70 | `gross` | 15773.487 | 15332.982 |
| 2021 | 70 | `avg` | 0.0958 | 0.0887 |
| 2021 | 70 | `grossAvg` | 0.2544 | 0.2473 |
| 2021 | 70 | `margBy.ord` | 0.305 | 0.3147 |
| 2021 | 70 | `margBy.cg` | 0.1215 | 0.1264 |
| 2021 | 70 | `margBy.ed` | 0.2249 | 0.2384 |
| 2021 | 70 | `margBy.nd` | 0.2704 | 0.2816 |
| 2021 | 70 | `margBy.fd` | 0.4621 | 0.477 |
| 2021 | 70 | `people.0.prov` | 3921.3305 | 3558.6044 |
| 2021 | 70 | `people.0.total` | 11357.928 | 10995.2019 |
| 2021 | 70 | `people.1.prov` | 453.627 | 375.8481 |
| 2021 | 70 | `people.1.total` | 1317.377 | 1239.5981 |
| 2021 | 71 | `invTax` | 10780.4752 | 10858.2541 |
| 2021 | 73 | `invTax` | 6743.8497 | 6821.6286 |
| 2021 | 76 | `invTax` | 33163.8899 | 33543.6335 |
| 2021 | 79 | `total` | -16831.666 | -17804.935 |
| 2021 | 79 | `prov` | 973.269 | 0 |
| 2021 | 79 | `netTotal` | -18656.906 | -19630.175 |
| 2021 | 79 | `marg` | 0.32 | 0.2195 |
| 2021 | 79 | `incomeTax` | 973.269 | 0 |
| 2021 | 79 | `gross` | 4716.759 | 3743.49 |
| 2021 | 79 | `avg` | -0.5611 | -0.5935 |
| 2021 | 79 | `grossAvg` | 0.1572 | 0.1248 |
| 2021 | 79 | `margBy.ord` | 0.32 | 0.2195 |
| 2021 | 79 | `margBy.cg` | 0.129 | 0.075 |
| 2021 | 79 | `margBy.ed` | 0.2456 | 0.207 |
| 2021 | 79 | `margBy.nd` | 0.2877 | 0.1725 |
| 2021 | 79 | `margBy.fd` | 0.3752 | 0.3 |
| 2021 | 79 | `people.0.prov` | 973.269 | 0 |
| 2021 | 79 | `people.0.total` | 2891.519 | 1918.25 |
| 2021 | 80 | `total` | -31351.9934 | -31917.5079 |
| 2021 | 80 | `prov` | 565.5146 | 0 |
| 2021 | 80 | `netTotal` | -32866.1754 | -33431.69 |
| 2021 | 80 | `marg` | 0.4687 | 0.3489 |
| 2021 | 80 | `invTax` | 9594.1746 | 9028.66 |
| 2021 | 80 | `incomeTax` | 565.5146 | 0 |
| 2021 | 80 | `gross` | 2451.3466 | 1885.8321 |
| 2021 | 80 | `avg` | -0.4295 | -0.4372 |
| 2021 | 80 | `grossAvg` | 0.0336 | 0.0258 |
| 2021 | 80 | `margBy.ord` | 0.4687 | 0.3489 |
| 2021 | 80 | `margBy.cg` | 0.2037 | 0.14 |
| 2021 | 80 | `margBy.ed` | 0.4519 | 0.3864 |
| 2021 | 80 | `margBy.nd` | 0.4596 | 0.322 |
| 2021 | 80 | `margBy.fd` | 0.548 | 0.43 |
| 2021 | 80 | `people.0.pDtc` | 4416 | 3341.9639 |
| 2021 | 80 | `people.0.prov` | 565.5146 | 0 |
| 2021 | 80 | `people.0.total` | 937.1646 | 371.65 |
| 2021 | 82 | `total` | -27937.4072 | -28093.937 |
| 2021 | 82 | `prov` | 156.5298 | 0 |
| 2021 | 82 | `netTotal` | -37902.9965 | -38059.5262 |
| 2021 | 82 | `marg` | 0.1707 | 0.0703 |
| 2021 | 82 | `incomeTax` | 156.5298 | 0 |
| 2021 | 82 | `gross` | 12602.769 | 12446.2392 |
| 2021 | 82 | `avg` | -0.7352 | -0.7393 |
| 2021 | 82 | `grossAvg` | 0.3317 | 0.3275 |
| 2021 | 82 | `margBy.ord` | 0.1707 | 0.0703 |
| 2021 | 82 | `margBy.cg` | 0.054 | 0 |
| 2021 | 82 | `margBy.ed` | 0.0386 | 0 |
| 2021 | 82 | `margBy.nd` | 0.1152 | 0 |
| 2021 | 82 | `margBy.fd` | 0.3507 | 0.25 |
| 2021 | 82 | `people.0.prov` | 156.5298 | 0 |
| 2021 | 82 | `people.0.total` | 2637.1798 | 2480.65 |
| 2021 | 83 | `invTax` | 48616.9515 | 48627.0306 |
| 2021 | 89 | `total` | 11345.1193 | 10465.3324 |
| 2021 | 89 | `prov` | 7102.8131 | 6223.0262 |
| 2021 | 89 | `netTotal` | 3470.4393 | 2590.6524 |
| 2021 | 89 | `marg` | 0.4788 | 0.4885 |
| 2021 | 89 | `incomeTax` | 15174.5906 | 14294.8036 |
| 2021 | 89 | `gross` | 29205.6706 | 28325.8836 |
| 2021 | 89 | `avg` | 0.122 | 0.1125 |
| 2021 | 89 | `grossAvg` | 0.314 | 0.3046 |
| 2021 | 89 | `margBy.ord` | 0.4788 | 0.4885 |
| 2021 | 89 | `margBy.cg` | 0.2138 | 0.2186 |
| 2021 | 89 | `margBy.ed` | 0.2723 | 0.2857 |
| 2021 | 89 | `margBy.nd` | 0.3788 | 0.3899 |
| 2021 | 89 | `margBy.fd` | 0.4275 | 0.4372 |
| 2021 | 89 | `people.0.prov` | 4879.8113 | 4000.0244 |
| 2021 | 89 | `people.0.total` | 14309.1863 | 13429.3994 |
| 2021 | 97 | `total` | 8792.8565 | 8665.8998 |
| 2021 | 97 | `prov` | 1236.5298 | 1109.5731 |
| 2021 | 97 | `netTotal` | 1420.7073 | 1293.7506 |
| 2021 | 97 | `marg` | 0.4594 | 0.4691 |
| 2021 | 97 | `incomeTax` | 1483.4823 | 1356.5256 |
| 2021 | 97 | `gross` | 11336.2815 | 11209.3248 |
| 2021 | 97 | `avg` | 0.2314 | 0.228 |
| 2021 | 97 | `grossAvg` | 0.2983 | 0.295 |
| 2021 | 97 | `margBy.ord` | 0.4594 | 0.4691 |
| 2021 | 97 | `margBy.cg` | 0.204 | 0.2089 |
| 2021 | 97 | `margBy.ed` | 0.2454 | 0.2588 |
| 2021 | 97 | `margBy.nd` | 0.3563 | 0.3675 |
| 2021 | 97 | `margBy.fd` | 0.5122 | 0.5257 |
| 2021 | 97 | `people.0.prov` | 1236.5298 | 1109.5731 |
| 2021 | 97 | `people.0.total` | 3964.1323 | 3837.1756 |
| 2021 | 98 | `total` | -380.2791 | -1612.8102 |
| 2021 | 98 | `prov` | 8100.7547 | 6868.2236 |
| 2021 | 98 | `netTotal` | -4546.0174 | -5778.5485 |
| 2021 | 98 | `marg` | 0.5251 | 0.5348 |
| 2021 | 98 | `invTax` | 10695.6919 | 11024.83 |
| 2021 | 98 | `incomeTax` | 15307.2576 | 14074.7265 |
| 2021 | 98 | `gross` | 23942.1959 | 22709.6648 |
| 2021 | 98 | `avg` | -0.0033 | -0.0141 |
| 2021 | 98 | `grossAvg` | 0.21 | 0.1992 |
| 2021 | 98 | `margBy.ord` | 0.5251 | 0.5348 |
| 2021 | 98 | `margBy.cg` | 0.237 | 0.2419 |
| 2021 | 98 | `margBy.ed` | 0.3364 | 0.3499 |
| 2021 | 98 | `margBy.nd` | 0.4322 | 0.4434 |
| 2021 | 98 | `margBy.fd` | 0.5349 | 0.5601 |
| 2021 | 98 | `people.0.prov` | 4179.4242 | 2946.8931 |
| 2021 | 98 | `people.0.total` | 8418.5296 | 7185.9985 |
| 2021 | 99 | `total` | -28961.241 | -29934.51 |
| 2021 | 99 | `prov` | 973.269 | 0 |
| 2021 | 99 | `netTotal` | -35970.481 | -36943.75 |
| 2021 | 99 | `marg` | 0.1707 | 0.0703 |
| 2021 | 99 | `incomeTax` | 973.269 | 0 |
| 2021 | 99 | `gross` | 9900.759 | 8927.49 |
| 2021 | 99 | `avg` | -0.9654 | -0.9978 |
| 2021 | 99 | `grossAvg` | 0.33 | 0.2976 |
| 2021 | 99 | `margBy.ord` | 0.1707 | 0.0703 |
| 2021 | 99 | `margBy.cg` | 0.054 | 0 |
| 2021 | 99 | `margBy.ed` | 0.0386 | 0 |
| 2021 | 99 | `margBy.nd` | 0.1152 | 0 |
| 2021 | 99 | `margBy.fd` | 0.2252 | 0.15 |
| 2021 | 99 | `people.0.prov` | 973.269 | 0 |
| 2021 | 99 | `people.0.total` | 2891.519 | 1918.25 |
| 2021 | 100 | `total` | -15097.6381 | -15254.1679 |
| 2021 | 100 | `prov` | 156.5298 | 0 |
| 2021 | 100 | `netTotal` | -21075.8202 | -21232.35 |
| 2021 | 100 | `marg` | 0.1707 | 0.0703 |
| 2021 | 100 | `incomeTax` | 156.5298 | 0 |
| 2021 | 100 | `gross` | 8615.3619 | 8458.8321 |
| 2021 | 100 | `avg` | -0.3973 | -0.4014 |
| 2021 | 100 | `grossAvg` | 0.2267 | 0.2226 |
| 2021 | 100 | `margBy.ord` | 0.1707 | 0.0703 |
| 2021 | 100 | `margBy.cg` | 0.054 | 0 |
| 2021 | 100 | `margBy.ed` | 0.0386 | 0 |
| 2021 | 100 | `margBy.nd` | 0.1152 | 0 |
| 2021 | 100 | `margBy.fd` | 0.108 | 0 |
| 2021 | 100 | `people.0.prov` | 156.5298 | 0 |
| 2021 | 100 | `people.0.total` | 2637.1798 | 2480.65 |
| 2021 | 101 | `total` | 1797.1351 | 1191.2394 |
| 2021 | 101 | `prov` | 2576.6298 | 1970.7342 |
| 2021 | 101 | `netTotal` | -8957.5449 | -9563.4406 |
| 2021 | 101 | `marg` | 0.5175 | 0.5272 |
| 2021 | 101 | `incomeTax` | 4387.2813 | 3781.3857 |
| 2021 | 101 | `gross` | 19197.9513 | 18592.0557 |
| 2021 | 101 | `avg` | 0.024 | 0.0159 |
| 2021 | 101 | `grossAvg` | 0.256 | 0.2479 |
| 2021 | 101 | `margBy.ord` | 0.5175 | 0.5272 |
| 2021 | 101 | `margBy.cg` | 0.2588 | 0.2636 |
| 2021 | 101 | `margBy.ed` | 0.3965 | 0.4099 |
| 2021 | 101 | `margBy.nd` | 0.4823 | 0.4934 |
| 2021 | 101 | `margBy.fd` | 0.569 | 0.5922 |
| 2021 | 101 | `people.0.prov` | 2576.6298 | 1970.7342 |
| 2021 | 101 | `people.0.total` | 8443.2713 | 7837.3757 |
| 2021 | 103 | `total` | 1978.7121 | 1900.3554 |
| 2021 | 103 | `prov` | 1856.5676 | 1778.2109 |
| 2021 | 103 | `netTotal` | -4060.4662 | -4138.8229 |
| 2021 | 103 | `marg` | 0.5485 | 0.5581 |
| 2021 | 103 | `incomeTax` | 2853.5201 | 2775.1634 |
| 2021 | 103 | `gross` | 11373.3484 | 11294.9917 |
| 2021 | 103 | `avg` | 0.0521 | 0.05 |
| 2021 | 103 | `grossAvg` | 0.2993 | 0.2972 |
| 2021 | 103 | `margBy.ord` | 0.5485 | 0.5581 |
| 2021 | 103 | `margBy.cg` | 0.2488 | 0.2536 |
| 2021 | 103 | `margBy.ed` | 0.3689 | 0.3823 |
| 2021 | 103 | `margBy.nd` | 0.4593 | 0.4704 |
| 2021 | 103 | `margBy.fd` | 0.6715 | 0.6833 |
| 2021 | 103 | `people.0.prov` | 1856.5676 | 1778.2109 |
| 2021 | 103 | `people.0.total` | 5334.1701 | 5255.8134 |
| 2021 | 107 | `total` | 17727.5218 | 17267.4262 |
| 2021 | 107 | `prov` | 4489.1298 | 4029.0342 |
| 2021 | 107 | `netTotal` | -5779.8274 | -6239.9231 |
| 2021 | 107 | `marg` | 0.5725 | 0.5822 |
| 2021 | 107 | `incomeTax` | 9137.7038 | 8677.6082 |
| 2021 | 107 | `gross` | 36701.0431 | 36240.9474 |
| 2021 | 107 | `avg` | 0.2364 | 0.2302 |
| 2021 | 107 | `grossAvg` | 0.4893 | 0.4832 |
| 2021 | 107 | `margBy.ord` | 0.5725 | 0.5822 |
| 2021 | 107 | `margBy.cg` | 0.2863 | 0.2911 |
| 2021 | 107 | `margBy.ed` | 0.4724 | 0.4858 |
| 2021 | 107 | `margBy.nd` | 0.5455 | 0.5567 |
| 2021 | 107 | `margBy.fd` | 0.5725 | 0.5866 |
| 2021 | 107 | `people.0.prov` | 4489.1298 | 4029.0342 |
| 2021 | 107 | `people.0.total` | 13193.6938 | 12733.5982 |
| 2021 | 110 | `invTax` | 28727.0119 | 28897.0201 |
| 2021 | 113 | `invTax` | 5444.3066 | 5504.2007 |
| 2021 | 114 | `total` | 15077.1298 | 15006.4086 |
| 2021 | 114 | `prov` | 10096.4826 | 10025.7613 |
| 2021 | 114 | `netTotal` | 13251.8898 | 13181.1686 |
| 2021 | 114 | `marg` | 0.5584 | 0.5677 |
| 2021 | 114 | `invTax` | 21579.2789 | 22094.3037 |
| 2021 | 114 | `incomeTax` | 20057.7398 | 19987.0186 |
| 2021 | 114 | `gross` | 24996.3298 | 24925.6086 |
| 2021 | 114 | `avg` | 0.1409 | 0.1402 |
| 2021 | 114 | `grossAvg` | 0.2336 | 0.2329 |
| 2021 | 114 | `margBy.ord` | 0.5584 | 0.5677 |
| 2021 | 114 | `margBy.cg` | 0.2535 | 0.2582 |
| 2021 | 114 | `margBy.ed` | 0.3915 | 0.4045 |
| 2021 | 114 | `margBy.nd` | 0.4735 | 0.4844 |
| 2021 | 114 | `margBy.fd` | 0.5567 | 0.5669 |
| 2021 | 114 | `people.0.pFtc` | 313.7421 | 311.5445 |
| 2021 | 114 | `people.0.prov` | 10096.4826 | 10025.7613 |
| 2021 | 114 | `people.0.total` | 23171.0898 | 23100.3686 |
| 2021 | 116 | `total` | -7917.3759 | -9556.0086 |
| 2021 | 116 | `prov` | 5686.0791 | 4047.4464 |
| 2021 | 116 | `netTotal` | -14494.6159 | -16133.2486 |
| 2021 | 116 | `marg` | 0.4241 | 0.4338 |
| 2021 | 116 | `incomeTax` | 11822.3841 | 10183.7514 |
| 2021 | 116 | `gross` | 23360.9241 | 21722.2914 |
| 2021 | 116 | `avg` | -0.1042 | -0.1257 |
| 2021 | 116 | `grossAvg` | 0.3074 | 0.2858 |
| 2021 | 116 | `margBy.ord` | 0.4241 | 0.4338 |
| 2021 | 116 | `margBy.cg` | 0.1863 | 0.1911 |
| 2021 | 116 | `margBy.ed` | 0.1964 | 0.2098 |
| 2021 | 116 | `margBy.nd` | 0.3155 | 0.3267 |
| 2021 | 116 | `margBy.fd` | 0.4659 | 0.5188 |
| 2021 | 116 | `people.0.prov` | 2843.0396 | 1204.4069 |
| 2021 | 116 | `people.0.total` | 8391.8421 | 6753.2094 |
| 2021 | 117 | `invTax` | 22629.7282 | 22639.8073 |
| 2021 | 119 | `total` | -17290.666 | -18263.935 |
| 2021 | 119 | `prov` | 973.269 | 0 |
| 2021 | 119 | `netTotal` | -20267.906 | -21241.175 |
| 2021 | 119 | `marg` | 0.32 | 0.2195 |
| 2021 | 119 | `incomeTax` | 973.269 | 0 |
| 2021 | 119 | `gross` | 5868.759 | 4895.49 |
| 2021 | 119 | `avg` | -0.5764 | -0.6088 |
| 2021 | 119 | `grossAvg` | 0.1956 | 0.1632 |
| 2021 | 119 | `margBy.ord` | 0.32 | 0.2195 |
| 2021 | 119 | `margBy.cg` | 0.129 | 0.075 |
| 2021 | 119 | `margBy.ed` | 0.2456 | 0.207 |
| 2021 | 119 | `margBy.nd` | 0.2877 | 0.1725 |
| 2021 | 119 | `margBy.fd` | 0.258 | 0.15 |
| 2021 | 119 | `people.0.prov` | 973.269 | 0 |
| 2021 | 119 | `people.0.total` | 2891.519 | 1918.25 |
| 2021 | 121 | `total` | -14075.1299 | -15045.1346 |
| 2021 | 121 | `prov` | 1856.5676 | 886.5629 |
| 2021 | 121 | `netTotal` | -22812.3699 | -23782.3746 |
| 2021 | 121 | `marg` | 0.7077 | 0.7173 |
| 2021 | 121 | `incomeTax` | 2853.5201 | 1883.5154 |
| 2021 | 121 | `gross` | 14071.4101 | 13101.4054 |
| 2021 | 121 | `avg` | -0.3704 | -0.3959 |
| 2021 | 121 | `grossAvg` | 0.3703 | 0.3448 |
| 2021 | 121 | `margBy.ord` | 0.7077 | 0.7173 |
| 2021 | 121 | `margBy.cg` | 0.3288 | 0.3336 |
| 2021 | 121 | `margBy.ed` | 0.5897 | 0.6031 |
| 2021 | 121 | `margBy.nd` | 0.6433 | 0.6544 |
| 2021 | 121 | `margBy.fd` | 0.7315 | 0.7668 |
| 2021 | 121 | `people.0.prov` | 1856.5676 | 886.5629 |
| 2021 | 121 | `people.0.total` | 5334.1701 | 4364.1654 |
| 2021 | 123 | `total` | 32349.1951 | 31601.0635 |
| 2021 | 123 | `prov` | 4630.3428 | 3882.2112 |
| 2021 | 123 | `netTotal` | 4848.2568 | 4100.1252 |
| 2021 | 123 | `incomeTax` | 9414.7068 | 8666.5752 |
| 2021 | 123 | `gross` | 42889.8851 | 42141.7535 |
| 2021 | 123 | `avg` | 0.3301 | 0.3225 |
| 2021 | 123 | `grossAvg` | 0.4377 | 0.43 |
| 2021 | 123 | `people.1.prov` | 2670.6018 | 1922.4702 |
| 2021 | 123 | `people.1.total` | 9558.4433 | 8810.3117 |
| 2021 | 124 | `total` | 13163.6021 | 13153.523 |
| 2021 | 124 | `prov` | 1156.4802 | 1146.4011 |
| 2021 | 124 | `netTotal` | -617.2379 | -627.317 |
| 2021 | 124 | `marg` | 0.3102 | 0.3198 |
| 2021 | 124 | `incomeTax` | 1993.3527 | 1983.2736 |
| 2021 | 124 | `gross` | 17130.0427 | 17119.9636 |
| 2021 | 124 | `avg` | 0.5983 | 0.5979 |
| 2021 | 124 | `grossAvg` | 0.7786 | 0.7782 |
| 2021 | 124 | `margBy.ord` | 0.3102 | 0.3198 |
| 2021 | 124 | `margBy.cg` | 0.129 | 0.1339 |
| 2021 | 124 | `margBy.ed` | 0.0384 | 0.0518 |
| 2021 | 124 | `margBy.nd` | 0.1838 | 0.195 |
| 2021 | 124 | `margBy.fd` | 0.3163 | 0.3264 |
| 2021 | 124 | `people.0.prov` | 1156.4802 | 1146.4011 |
| 2021 | 124 | `people.0.total` | 3349.2027 | 3339.1236 |
| 2021 | 126 | `invTax` | 19270.9366 | 19445.0482 |
| 2021 | 127 | `total` | 12099.3308 | 11812.1831 |
| 2021 | 127 | `prov` | 5836.4879 | 5549.3402 |
| 2021 | 127 | `netTotal` | 7607.1815 | 7320.0338 |
| 2021 | 127 | `marg` | 0.5102 | 0.5198 |
| 2021 | 127 | `invTax` | 10856.3873 | 11077.6145 |
| 2021 | 127 | `incomeTax` | 14722.8315 | 14435.6838 |
| 2021 | 127 | `gross` | 22890.7308 | 22603.5831 |
| 2021 | 127 | `avg` | 0.1571 | 0.1534 |
| 2021 | 127 | `grossAvg` | 0.2973 | 0.2936 |
| 2021 | 127 | `margBy.ord` | 0.5102 | 0.5198 |
| 2021 | 127 | `margBy.cg` | 0.2295 | 0.2344 |
| 2021 | 127 | `margBy.ed` | 0.3157 | 0.3292 |
| 2021 | 127 | `margBy.nd` | 0.415 | 0.4262 |
| 2021 | 127 | `margBy.fd` | 0.459 | 0.4687 |
| 2021 | 127 | `people.0.prov` | 5836.4879 | 5549.3402 |
| 2021 | 127 | `people.0.total` | 18398.5815 | 18111.4338 |
| 2021 | 128 | `total` | 12047.4936 | 11758.9635 |
| 2021 | 128 | `prov` | 2934.8585 | 2646.3284 |
| 2021 | 128 | `netTotal` | 822.1553 | 533.6252 |
| 2021 | 128 | `marg` | 0.449 | 0.4586 |
| 2021 | 128 | `incomeTax` | 5186.906 | 4898.3759 |
| 2021 | 128 | `gross` | 19525.5943 | 19237.0642 |
| 2021 | 128 | `avg` | 0.2563 | 0.2502 |
| 2021 | 128 | `grossAvg` | 0.4154 | 0.4093 |
| 2021 | 128 | `margBy.ord` | 0.449 | 0.4586 |
| 2021 | 128 | `margBy.cg` | 0.1988 | 0.2036 |
| 2021 | 128 | `margBy.ed` | 0.2309 | 0.2443 |
| 2021 | 128 | `margBy.nd` | 0.3443 | 0.3554 |
| 2021 | 128 | `margBy.fd` | 0.5363 | 0.5521 |
| 2021 | 128 | `people.0.prov` | 2934.8585 | 2646.3284 |
| 2021 | 128 | `people.0.total` | 8300.256 | 8011.7259 |
| 2021 | 133 | `total` | -9262.5889 | -10803.9433 |
| 2021 | 133 | `prov` | 5160.7342 | 3619.3799 |
| 2021 | 133 | `netTotal` | -12420.3272 | -13961.6816 |
| 2021 | 133 | `marg` | 0.4788 | 0.4885 |
| 2021 | 133 | `invTax` | 17928.0221 | 18307.0778 |
| 2021 | 133 | `incomeTax` | 11039.0978 | 9497.7434 |
| 2021 | 133 | `gross` | 17681.8361 | 16140.4817 |
| 2021 | 133 | `avg` | -0.1065 | -0.1242 |
| 2021 | 133 | `grossAvg` | 0.2032 | 0.1855 |
| 2021 | 133 | `margBy.ord` | 0.4788 | 0.4885 |
| 2021 | 133 | `margBy.cg` | 0.2138 | 0.2186 |
| 2021 | 133 | `margBy.ed` | 0.2723 | 0.2857 |
| 2021 | 133 | `margBy.nd` | 0.3788 | 0.3899 |
| 2021 | 133 | `margBy.fd` | 0.4275 | 0.4372 |
| 2021 | 133 | `people.0.prov` | 152.0538 | 62.5623 |
| 2021 | 133 | `people.0.total` | 523.7038 | 434.2123 |
| 2021 | 133 | `people.1.prov` | 5008.6805 | 3556.8176 |
| 2021 | 133 | `people.1.total` | 14000.394 | 12548.5311 |
| 2021 | 134 | `invTax` | 6769.2383 | 6779.3174 |
| 2021 | 136 | `total` | -2261.8494 | -3370.5931 |
| 2021 | 136 | `prov` | 8226.4691 | 7117.7254 |
| 2021 | 136 | `netTotal` | -6679.0894 | -7787.8331 |
| 2021 | 136 | `marg` | 0.474 | 0.4837 |
| 2021 | 136 | `incomeTax` | 18000.0431 | 16891.2994 |
| 2021 | 136 | `gross` | 26473.2731 | 25364.5294 |
| 2021 | 136 | `avg` | -0.0266 | -0.0397 |
| 2021 | 136 | `grossAvg` | 0.3115 | 0.2984 |
| 2021 | 136 | `margBy.ord` | 0.474 | 0.4837 |
| 2021 | 136 | `margBy.cg` | 0.237 | 0.2419 |
| 2021 | 136 | `margBy.ed` | 0.3364 | 0.3499 |
| 2021 | 136 | `margBy.nd` | 0.4322 | 0.4434 |
| 2021 | 136 | `margBy.fd` | 0.474 | 0.4837 |
| 2021 | 136 | `people.0.prov` | 8226.4691 | 7117.7254 |
| 2021 | 136 | `people.0.total` | 22056.0331 | 20947.2894 |
| 2021 | 141 | `total` | 11893.1936 | 11384.8187 |
| 2021 | 141 | `prov` | 3893.3393 | 3384.9644 |
| 2021 | 141 | `netTotal` | -4479.6464 | -4988.0213 |
| 2021 | 141 | `marg` | 0.6231 | 0.6328 |
| 2021 | 141 | `incomeTax` | 7575.7643 | 7067.3894 |
| 2021 | 141 | `gross` | 27624.3543 | 27115.9794 |
| 2021 | 141 | `avg` | 0.2162 | 0.207 |
| 2021 | 141 | `grossAvg` | 0.5023 | 0.493 |
| 2021 | 141 | `margBy.ord` | 0.6231 | 0.6328 |
| 2021 | 141 | `margBy.cg` | 0.2863 | 0.2911 |
| 2021 | 141 | `margBy.ed` | 0.4724 | 0.4858 |
| 2021 | 141 | `margBy.nd` | 0.5455 | 0.5567 |
| 2021 | 141 | `margBy.fd` | 0.5838 | 0.6027 |
| 2021 | 141 | `people.0.prov` | 3893.3393 | 3384.9644 |
| 2021 | 141 | `people.0.total` | 11251.5143 | 10743.1394 |
| 2021 | 143 | `total` | 7039.5793 | 6875.7325 |
| 2021 | 143 | `prov` | 4022.4875 | 3858.6407 |
| 2021 | 143 | `netTotal` | 3881.841 | 3717.9942 |
| 2021 | 143 | `marg` | 0.3798 | 0.3895 |
| 2021 | 143 | `invTax` | 11651.2613 | 11921.0885 |
| 2021 | 143 | `incomeTax` | 7719.501 | 7555.6542 |
| 2021 | 143 | `gross` | 13096.8393 | 12932.9925 |
| 2021 | 143 | `avg` | 0.0791 | 0.0773 |
| 2021 | 143 | `grossAvg` | 0.1472 | 0.1453 |
| 2021 | 143 | `margBy.ord` | 0.3798 | 0.3895 |
| 2021 | 143 | `margBy.cg` | 0.164 | 0.1689 |
| 2021 | 143 | `margBy.ed` | 0.135 | 0.1484 |
| 2021 | 143 | `margBy.nd` | 0.2643 | 0.2755 |
| 2021 | 143 | `margBy.fd` | 0.328 | 0.3377 |
| 2021 | 143 | `people.0.prov` | 616.4802 | 557.8011 |
| 2021 | 143 | `people.0.total` | 2059.2027 | 2000.5236 |
| 2021 | 143 | `people.1.prov` | 3406.0073 | 3300.8396 |
| 2021 | 143 | `people.1.total` | 7879.8983 | 7774.7306 |
| 2021 | 144 | `total` | 23769.2647 | 23729.3506 |
| 2021 | 144 | `prov` | 2297.3585 | 2257.4444 |
| 2021 | 144 | `netTotal` | 2871.2247 | 2831.3106 |
| 2021 | 144 | `marg` | 0.5286 | 0.5382 |
| 2021 | 144 | `incomeTax` | 3799.406 | 3759.4919 |
| 2021 | 144 | `gross` | 27810.796 | 27770.8819 |
| 2021 | 144 | `avg` | 0.5057 | 0.5049 |
| 2021 | 144 | `grossAvg` | 0.5917 | 0.5909 |
| 2021 | 144 | `margBy.ord` | 0.5286 | 0.5382 |
| 2021 | 144 | `margBy.cg` | 0.2388 | 0.2436 |
| 2021 | 144 | `margBy.ed` | 0.3413 | 0.3547 |
| 2021 | 144 | `margBy.nd` | 0.4363 | 0.4474 |
| 2021 | 144 | `margBy.fd` | 0.6361 | 0.6468 |
| 2021 | 144 | `people.0.prov` | 2297.3585 | 2257.4444 |
| 2021 | 144 | `people.0.total` | 6912.756 | 6872.8419 |
| 2021 | 145 | `total` | 11374.6252 | 10952.005 |
| 2021 | 145 | `prov` | 4348.0007 | 3925.3805 |
| 2021 | 145 | `netTotal` | 4244.4431 | 3821.823 |
| 2021 | 145 | `marg` | 0.4639 | 0.4736 |
| 2021 | 145 | `incomeTax` | 8671.2482 | 8248.628 |
| 2021 | 145 | `gross` | 22028.1302 | 21605.51 |
| 2021 | 145 | `avg` | 0.121 | 0.1165 |
| 2021 | 145 | `grossAvg` | 0.2343 | 0.2298 |
| 2021 | 145 | `margBy.ord` | 0.4639 | 0.4736 |
| 2021 | 145 | `margBy.cg` | 0.2063 | 0.2111 |
| 2021 | 145 | `margBy.ed` | 0.2516 | 0.265 |
| 2021 | 145 | `margBy.nd` | 0.3615 | 0.3727 |
| 2021 | 145 | `margBy.fd` | 0.4125 | 0.4222 |
| 2021 | 145 | `people.0.prov` | 426.6702 | 366.7761 |
| 2021 | 145 | `people.0.total` | 3540.0202 | 3480.1261 |
| 2021 | 145 | `people.1.prov` | 3921.3305 | 3558.6044 |
| 2021 | 145 | `people.1.total` | 11357.928 | 10995.2019 |
| 2021 | 146 | `total` | 21402.4465 | 21342.5524 |
| 2021 | 146 | `prov` | 5306.4814 | 5246.5874 |
| 2021 | 146 | `netTotal` | 17849.2064 | 17789.3124 |
| 2021 | 146 | `marg` | 0.1707 | 0.1804 |
| 2021 | 146 | `incomeTax` | 11060.1065 | 11000.2123 |
| 2021 | 146 | `gross` | 21402.4465 | 21342.5524 |
| 2021 | 146 | `avg` | 0.2098 | 0.2092 |
| 2021 | 146 | `grossAvg` | 0.2098 | 0.2092 |
| 2021 | 146 | `margBy.ord` | 0.1707 | 0.1804 |
| 2021 | 146 | `margBy.cg` | 0.054 | 0.0589 |
| 2021 | 146 | `margBy.ed` | 0.0386 | 0.0521 |
| 2021 | 146 | `margBy.nd` | 0.1152 | 0.1264 |
| 2021 | 146 | `margBy.fd` | 0.2321 | 0.2453 |
| 2021 | 146 | `people.0.prov` | 426.6702 | 366.7761 |
| 2021 | 146 | `people.0.total` | 3540.0202 | 3480.1261 |
| 2022 | 2 | `total` | 1871.6361 | 1764.6364 |
| 2022 | 2 | `prov` | 127.5372 | 20.5375 |
| 2022 | 2 | `netTotal` | -1284.7078 | -1391.7075 |
| 2022 | 2 | `marg` | 0.1531 | 0.1627 |
| 2022 | 2 | `incomeTax` | 127.5372 | 20.5375 |
| 2022 | 2 | `gross` | 3957.9811 | 3850.9814 |
| 2022 | 2 | `avg` | 0.156 | 0.1471 |
| 2022 | 2 | `grossAvg` | 0.3298 | 0.3209 |
| 2022 | 2 | `margBy.ord` | 0.1531 | 0.1627 |
| 2022 | 2 | `margBy.cg` | 0.044 | 0.0489 |
| 2022 | 2 | `margBy.ed` | 0.011 | 0.0245 |
| 2022 | 2 | `margBy.nd` | 0.0922 | 0.1034 |
| 2022 | 2 | `margBy.fd` | 0.2265 | 0.245 |
| 2022 | 2 | `people.0.prov` | 127.5372 | 20.5375 |
| 2022 | 2 | `people.0.total` | 801.6372 | 694.6375 |
| 2022 | 4 | `total` | -4239.8018 | -4415.4679 |
| 2022 | 4 | `prov` | 743.2668 | 567.6007 |
| 2022 | 4 | `netTotal` | -7396.1457 | -7571.8118 |
| 2022 | 4 | `marg` | 0.3218 | 0.3315 |
| 2022 | 4 | `incomeTax` | 743.2668 | 567.6007 |
| 2022 | 4 | `gross` | 5738.5107 | 5562.8446 |
| 2022 | 4 | `avg` | -0.1514 | -0.1577 |
| 2022 | 4 | `grossAvg` | 0.2049 | 0.1987 |
| 2022 | 4 | `margBy.ord` | 0.3218 | 0.3315 |
| 2022 | 4 | `margBy.cg` | 0.129 | 0.1339 |
| 2022 | 4 | `margBy.ed` | 0.2456 | 0.2591 |
| 2022 | 4 | `margBy.nd` | 0.2877 | 0.2989 |
| 2022 | 4 | `margBy.fd` | 0.381 | 0.397 |
| 2022 | 4 | `people.0.prov` | 743.2668 | 567.6007 |
| 2022 | 4 | `people.0.total` | 2582.1668 | 2406.5007 |
| 2022 | 5 | `total` | -4165.1766 | -4321.5485 |
| 2022 | 5 | `prov` | 943.542 | 787.1702 |
| 2022 | 5 | `netTotal` | -7321.5205 | -7477.8923 |
| 2022 | 5 | `marg` | 0.3218 | 0.3315 |
| 2022 | 5 | `incomeTax` | 943.542 | 787.1702 |
| 2022 | 5 | `gross` | 6084.3859 | 5928.014 |
| 2022 | 5 | `avg` | -0.1388 | -0.1441 |
| 2022 | 5 | `grossAvg` | 0.2028 | 0.1976 |
| 2022 | 5 | `margBy.ord` | 0.3218 | 0.3315 |
| 2022 | 5 | `margBy.cg` | 0.129 | 0.1339 |
| 2022 | 5 | `margBy.ed` | 0.2456 | 0.2591 |
| 2022 | 5 | `margBy.nd` | 0.2877 | 0.2989 |
| 2022 | 5 | `margBy.fd` | 0.3761 | 0.391 |
| 2022 | 5 | `people.0.prov` | 943.542 | 787.1702 |
| 2022 | 5 | `people.0.total` | 2928.042 | 2771.6702 |
| 2022 | 6 | `total` | -27503.209 | -29000.9543 |
| 2022 | 6 | `prov` | 2645.6321 | 1147.8868 |
| 2022 | 6 | `netTotal` | -30659.5529 | -32157.2982 |
| 2022 | 6 | `marg` | 0.6093 | 0.6189 |
| 2022 | 6 | `incomeTax` | 4421.7071 | 2923.9618 |
| 2022 | 6 | `gross` | 10654.551 | 9156.8057 |
| 2022 | 6 | `avg` | -0.6112 | -0.6445 |
| 2022 | 6 | `grossAvg` | 0.2368 | 0.2035 |
| 2022 | 6 | `margBy.ord` | 0.6093 | 0.6189 |
| 2022 | 6 | `margBy.cg` | 0.2788 | 0.2836 |
| 2022 | 6 | `margBy.ed` | 0.4517 | 0.4651 |
| 2022 | 6 | `margBy.nd` | 0.5283 | 0.5394 |
| 2022 | 6 | `margBy.fd` | 0.6082 | 0.6513 |
| 2022 | 6 | `people.0.prov` | 2645.6321 | 1147.8868 |
| 2022 | 6 | `people.0.total` | 7498.2071 | 6000.4618 |
| 2022 | 7 | `total` | -10690.28 | -12043.3188 |
| 2022 | 7 | `prov` | 4438.0024 | 3084.9635 |
| 2022 | 7 | `netTotal` | -13846.6239 | -15199.6627 |
| 2022 | 7 | `marg` | 0.6639 | 0.6735 |
| 2022 | 7 | `incomeTax` | 8816.1361 | 7463.0973 |
| 2022 | 7 | `gross` | 16140.98 | 14787.9412 |
| 2022 | 7 | `avg` | -0.1782 | -0.2007 |
| 2022 | 7 | `grossAvg` | 0.269 | 0.2465 |
| 2022 | 7 | `margBy.ord` | 0.6639 | 0.6735 |
| 2022 | 7 | `margBy.cg` | 0.3063 | 0.3111 |
| 2022 | 7 | `margBy.ed` | 0.5276 | 0.541 |
| 2022 | 7 | `margBy.nd` | 0.5915 | 0.6027 |
| 2022 | 7 | `margBy.fd` | 0.6142 | 0.6466 |
| 2022 | 7 | `people.0.prov` | 4438.0024 | 3084.9635 |
| 2022 | 7 | `people.0.total` | 12984.6361 | 11631.5973 |
| 2022 | 8 | `total` | 45509.5683 | 45416.6402 |
| 2022 | 8 | `prov` | 14622.6484 | 14529.7203 |
| 2022 | 8 | `netTotal` | 38753.2244 | 38660.2963 |
| 2022 | 8 | `marg` | 0.436 | 0.4457 |
| 2022 | 8 | `incomeTax` | 33759.0614 | 33666.1333 |
| 2022 | 8 | `gross` | 49420.4853 | 49327.5572 |
| 2022 | 8 | `avg` | 0.3034 | 0.3028 |
| 2022 | 8 | `grossAvg` | 0.3295 | 0.3289 |
| 2022 | 8 | `margBy.ord` | 0.436 | 0.4457 |
| 2022 | 8 | `margBy.cg` | 0.218 | 0.2229 |
| 2022 | 8 | `margBy.ed` | 0.284 | 0.2974 |
| 2022 | 8 | `margBy.nd` | 0.3885 | 0.3997 |
| 2022 | 8 | `margBy.fd` | 0.436 | 0.4457 |
| 2022 | 8 | `people.0.prov` | 7311.3242 | 7218.3961 |
| 2022 | 8 | `people.0.total` | 21332.0707 | 21239.1426 |
| 2022 | 10 | `total` | -2961.623 | -3441.1713 |
| 2022 | 10 | `prov` | 2437.1906 | 1957.6423 |
| 2022 | 10 | `netTotal` | -6117.9669 | -6597.5152 |
| 2022 | 10 | `marg` | 0.6639 | 0.6735 |
| 2022 | 10 | `incomeTax` | 4315.1531 | 3835.6048 |
| 2022 | 10 | `gross` | 10348.497 | 9868.9487 |
| 2022 | 10 | `avg` | -0.0658 | -0.0765 |
| 2022 | 10 | `grossAvg` | 0.23 | 0.2193 |
| 2022 | 10 | `margBy.ord` | 0.6639 | 0.6735 |
| 2022 | 10 | `margBy.cg` | 0.3063 | 0.3111 |
| 2022 | 10 | `margBy.ed` | 0.5276 | 0.541 |
| 2022 | 10 | `margBy.nd` | 0.5915 | 0.6027 |
| 2022 | 10 | `margBy.fd` | 0.6379 | 0.6614 |
| 2022 | 10 | `people.0.prov` | 2437.1906 | 1957.6423 |
| 2022 | 10 | `people.0.total` | 6663.6531 | 6184.1048 |
| 2022 | 11 | `total` | 29999.7151 | 29823.951 |
| 2022 | 11 | `prov` | 14154.8522 | 13979.0881 |
| 2022 | 11 | `netTotal` | 26843.3712 | 26667.6071 |
| 2022 | 11 | `marg` | 0.514 | 0.5237 |
| 2022 | 11 | `incomeTax` | 31841.4712 | 31665.7071 |
| 2022 | 11 | `gross` | 39450.3551 | 39274.591 |
| 2022 | 11 | `avg` | 0.25 | 0.2485 |
| 2022 | 11 | `grossAvg` | 0.3288 | 0.3273 |
| 2022 | 11 | `margBy.ord` | 0.514 | 0.5237 |
| 2022 | 11 | `margBy.cg` | 0.257 | 0.2619 |
| 2022 | 11 | `margBy.ed` | 0.3916 | 0.4051 |
| 2022 | 11 | `margBy.nd` | 0.4782 | 0.4894 |
| 2022 | 11 | `margBy.fd` | 0.514 | 0.5237 |
| 2022 | 11 | `people.0.prov` | 14154.8522 | 13979.0881 |
| 2022 | 11 | `people.0.total` | 36294.0112 | 36118.2471 |
| 2022 | 23 | `total` | -5721.6141 | -6175.202 |
| 2022 | 23 | `prov` | 943.542 | 489.9542 |
| 2022 | 23 | `netTotal` | -8877.958 | -9331.5458 |
| 2022 | 23 | `marg` | 0.1729 | 0.1826 |
| 2022 | 23 | `incomeTax` | 943.542 | 489.9542 |
| 2022 | 23 | `gross` | 6084.3859 | 5630.798 |
| 2022 | 23 | `avg` | -0.1907 | -0.2058 |
| 2022 | 23 | `grossAvg` | 0.2028 | 0.1877 |
| 2022 | 23 | `margBy.ord` | 0.1729 | 0.1826 |
| 2022 | 23 | `margBy.cg` | 0.054 | 0.0589 |
| 2022 | 23 | `margBy.ed` | 0.0386 | 0.0521 |
| 2022 | 23 | `margBy.nd` | 0.1152 | 0.1264 |
| 2022 | 23 | `margBy.fd` | 0.2261 | 0.2509 |
| 2022 | 23 | `people.0.prov` | 943.542 | 489.9542 |
| 2022 | 23 | `people.0.total` | 2928.042 | 2474.4542 |
| 2022 | 26 | `total` | 2828.2921 | 2817.7634 |
| 2022 | 26 | `prov` | 1128.9132 | 1118.3845 |
| 2022 | 26 | `netTotal` | 535.9482 | 525.4195 |
| 2022 | 26 | `marg` | 0.312 | 0.3217 |
| 2022 | 26 | `incomeTax` | 1865.8482 | 1855.3196 |
| 2022 | 26 | `gross` | 5560.2921 | 5549.7634 |
| 2022 | 26 | `avg` | 0.1286 | 0.1281 |
| 2022 | 26 | `grossAvg` | 0.2527 | 0.2523 |
| 2022 | 26 | `margBy.ord` | 0.312 | 0.3217 |
| 2022 | 26 | `margBy.cg` | 0.129 | 0.1339 |
| 2022 | 26 | `margBy.ed` | 0.0384 | 0.0518 |
| 2022 | 26 | `margBy.nd` | 0.1838 | 0.195 |
| 2022 | 26 | `margBy.fd` | 0.3219 | 0.332 |
| 2022 | 26 | `people.0.prov` | 1128.9132 | 1118.3845 |
| 2022 | 26 | `people.0.total` | 3267.9482 | 3257.4195 |
| 2022 | 31 | `total` | -14294.2788 | -14436.72 |
| 2022 | 31 | `prov` | 142.4412 | 0 |
| 2022 | 31 | `netTotal` | -23057.4588 | -23199.9 |
| 2022 | 31 | `marg` | 0.1729 | 0.0728 |
| 2022 | 31 | `incomeTax` | 142.4412 | 0 |
| 2022 | 31 | `gross` | 10307.7212 | 10165.28 |
| 2022 | 31 | `avg` | -0.6497 | -0.6562 |
| 2022 | 31 | `grossAvg` | 0.4685 | 0.4621 |
| 2022 | 31 | `margBy.ord` | 0.1729 | 0.0728 |
| 2022 | 31 | `margBy.cg` | 0.054 | 0 |
| 2022 | 31 | `margBy.ed` | 0.0386 | 0 |
| 2022 | 31 | `margBy.nd` | 0.1152 | 0 |
| 2022 | 31 | `margBy.fd` | 0.108 | 0 |
| 2022 | 31 | `people.0.prov` | 142.4412 | 0 |
| 2022 | 31 | `people.0.total` | 1544.5412 | 1402.1 |
| 2022 | 36 | `total` | -21216.0059 | -22198.3186 |
| 2022 | 36 | `prov` | 1699.4991 | 717.1864 |
| 2022 | 36 | `netTotal` | -24219.1859 | -25201.4986 |
| 2022 | 36 | `marg` | 0.5694 | 0.5791 |
| 2022 | 36 | `invTax` | 3886.2729 | 3046.4014 |
| 2022 | 36 | `incomeTax` | 1699.4991 | 717.1864 |
| 2022 | 36 | `gross` | 6104.7791 | 5122.4664 |
| 2022 | 36 | `avg` | -0.5583 | -0.5842 |
| 2022 | 36 | `grossAvg` | 0.1607 | 0.1348 |
| 2022 | 36 | `margBy.ord` | 0.5694 | 0.5791 |
| 2022 | 36 | `margBy.cg` | 0.2537 | 0.2586 |
| 2022 | 36 | `margBy.ed` | 0.59 | 0.6034 |
| 2022 | 36 | `margBy.nd` | 0.5746 | 0.5858 |
| 2022 | 36 | `margBy.fd` | 0.5075 | 0.5172 |
| 2022 | 36 | `people.0.prov` | 1699.4991 | 717.1864 |
| 2022 | 36 | `people.0.total` | 3101.5991 | 2119.2864 |
| 2022 | 37 | `total` | -4274.7816 | -5283.5718 |
| 2022 | 37 | `prov` | 4344.7016 | 3335.9114 |
| 2022 | 37 | `netTotal` | -7737.5584 | -8746.3486 |
| 2022 | 37 | `marg` | 0.6093 | 0.6189 |
| 2022 | 37 | `incomeTax` | 8520.8516 | 7512.0614 |
| 2022 | 37 | `gross` | 17772.6284 | 16763.8382 |
| 2022 | 37 | `avg` | -0.0503 | -0.0622 |
| 2022 | 37 | `grossAvg` | 0.2091 | 0.1972 |
| 2022 | 37 | `margBy.ord` | 0.6093 | 0.6189 |
| 2022 | 37 | `margBy.cg` | 0.2788 | 0.2836 |
| 2022 | 37 | `margBy.ed` | 0.4517 | 0.4651 |
| 2022 | 37 | `margBy.nd` | 0.5283 | 0.5394 |
| 2022 | 37 | `margBy.fd` | 0.6465 | 0.6803 |
| 2022 | 37 | `people.0.prov` | 1111.1148 | 1109.1397 |
| 2022 | 37 | `people.0.total` | 4390.2298 | 4388.2548 |
| 2022 | 37 | `people.1.prov` | 3233.5868 | 2226.7717 |
| 2022 | 37 | `people.1.total` | 9919.6218 | 8912.8067 |
| 2022 | 39 | `invTax` | 56216.3562 | 57119.4144 |
| 2022 | 40 | `total` | -24370.5742 | -25771.8486 |
| 2022 | 40 | `prov` | 3840.5456 | 2439.2713 |
| 2022 | 40 | `netTotal` | -25942.9181 | -27344.1925 |
| 2022 | 40 | `marg` | 0.6639 | 0.6735 |
| 2022 | 40 | `incomeTax` | 7250.3419 | 5849.0675 |
| 2022 | 40 | `gross` | 12627.1858 | 11225.9114 |
| 2022 | 40 | `avg` | -0.4431 | -0.4686 |
| 2022 | 40 | `grossAvg` | 0.2296 | 0.2041 |
| 2022 | 40 | `margBy.ord` | 0.6639 | 0.6735 |
| 2022 | 40 | `margBy.cg` | 0.3063 | 0.3111 |
| 2022 | 40 | `margBy.ed` | 0.5276 | 0.541 |
| 2022 | 40 | `margBy.nd` | 0.5915 | 0.6027 |
| 2022 | 40 | `margBy.fd` | 0.6294 | 0.6647 |
| 2022 | 40 | `people.0.prov` | 3840.5456 | 2439.2713 |
| 2022 | 40 | `people.0.total` | 11054.8419 | 9653.5675 |
| 2022 | 49 | `total` | 1486.9531 | 1179.5756 |
| 2022 | 49 | `prov` | 5177.8677 | 4870.4903 |
| 2022 | 49 | `netTotal` | -4396.2269 | -4703.6044 |
| 2022 | 49 | `marg` | 0.5115 | 0.5212 |
| 2022 | 49 | `invTax` | 15050.2319 | 14885.2956 |
| 2022 | 49 | `incomeTax` | 7573.7731 | 7266.3956 |
| 2022 | 49 | `gross` | 14859.0531 | 14551.6756 |
| 2022 | 49 | `avg` | 0.0216 | 0.0171 |
| 2022 | 49 | `grossAvg` | 0.2153 | 0.2109 |
| 2022 | 49 | `margBy.ord` | 0.5115 | 0.5212 |
| 2022 | 49 | `margBy.cg` | 0.2295 | 0.2344 |
| 2022 | 49 | `margBy.ed` | 0.3157 | 0.3292 |
| 2022 | 49 | `margBy.nd` | 0.415 | 0.4262 |
| 2022 | 49 | `margBy.fd` | 0.459 | 0.4687 |
| 2022 | 49 | `people.0.prov` | 5177.8677 | 4870.4903 |
| 2022 | 49 | `people.0.total` | 8975.8731 | 8668.4956 |
| 2022 | 55 | `total` | 35377.5265 | 35265.5257 |
| 2022 | 55 | `prov` | 13971.4922 | 13859.4913 |
| 2022 | 55 | `netTotal` | 22766.1201 | 22654.1193 |
| 2022 | 55 | `marg` | 0.529 | 0.5387 |
| 2022 | 55 | `invTax` | 17301.2736 | 17705.2368 |
| 2022 | 55 | `incomeTax` | 30876.4323 | 30764.4314 |
| 2022 | 55 | `gross` | 47940.3787 | 47828.3778 |
| 2022 | 55 | `avg` | 0.2407 | 0.2399 |
| 2022 | 55 | `grossAvg` | 0.3261 | 0.3254 |
| 2022 | 55 | `margBy.ord` | 0.529 | 0.5387 |
| 2022 | 55 | `margBy.cg` | 0.2645 | 0.2694 |
| 2022 | 55 | `margBy.ed` | 0.4123 | 0.4258 |
| 2022 | 55 | `margBy.nd` | 0.4955 | 0.5067 |
| 2022 | 55 | `margBy.fd` | 0.529 | 0.5387 |
| 2022 | 55 | `people.0.prov` | 13971.4922 | 13859.4913 |
| 2022 | 55 | `people.0.total` | 35328.9723 | 35216.9714 |
| 2022 | 56 | `total` | 4265.4313 | 4206.3027 |
| 2022 | 56 | `prov` | 588.9132 | 529.7845 |
| 2022 | 56 | `netTotal` | -1367.7737 | -1426.9023 |
| 2022 | 56 | `marg` | 0.1615 | 0.1712 |
| 2022 | 56 | `incomeTax` | 588.9132 | 529.7845 |
| 2022 | 56 | `gross` | 7624.2182 | 7565.0896 |
| 2022 | 56 | `avg` | 0.1939 | 0.1912 |
| 2022 | 56 | `grossAvg` | 0.3466 | 0.3439 |
| 2022 | 56 | `margBy.ord` | 0.1615 | 0.1712 |
| 2022 | 56 | `margBy.cg` | 0.044 | 0.0489 |
| 2022 | 56 | `margBy.ed` | 0.011 | 0.0245 |
| 2022 | 56 | `margBy.nd` | 0.0922 | 0.1034 |
| 2022 | 56 | `margBy.fd` | 0.2219 | 0.235 |
| 2022 | 56 | `people.0.prov` | 588.9132 | 529.7845 |
| 2022 | 56 | `people.0.total` | 1991.0132 | 1931.8845 |
| 2022 | 57 | `total` | -12675.6821 | -12818.1233 |
| 2022 | 57 | `prov` | 142.4412 | 0 |
| 2022 | 57 | `netTotal` | -23626.4588 | -23768.9 |
| 2022 | 57 | `marg` | 0.1729 | 0.0728 |
| 2022 | 57 | `incomeTax` | 142.4412 | 0 |
| 2022 | 57 | `gross` | 12495.3179 | 12352.8767 |
| 2022 | 57 | `avg` | -0.5762 | -0.5826 |
| 2022 | 57 | `grossAvg` | 0.568 | 0.5615 |
| 2022 | 57 | `margBy.ord` | 0.1729 | 0.0728 |
| 2022 | 57 | `margBy.cg` | 0.054 | 0 |
| 2022 | 57 | `margBy.ed` | 0.0386 | 0 |
| 2022 | 57 | `margBy.nd` | 0.1152 | 0 |
| 2022 | 57 | `margBy.fd` | 0.251 | 0.15 |
| 2022 | 57 | `people.0.prov` | 142.4412 | 0 |
| 2022 | 57 | `people.0.total` | 1544.5412 | 1402.1 |
| 2022 | 60 | `total` | 402.1401 | -128.6246 |
| 2022 | 60 | `prov` | 1002.7962 | 472.0315 |
| 2022 | 60 | `netTotal` | -8514.2038 | -9044.9684 |
| 2022 | 60 | `incomeTax` | 1002.7962 | 472.0315 |
| 2022 | 60 | `gross` | 11704.1401 | 11173.3754 |
| 2022 | 60 | `avg` | 0.0134 | -0.0043 |
| 2022 | 60 | `grossAvg` | 0.3901 | 0.3724 |
| 2022 | 60 | `people.0.prov` | 1002.7962 | 472.0315 |
| 2022 | 60 | `people.0.total` | 2404.8962 | 1874.1315 |
| 2022 | 61 | `total` | 15257.0734 | 14873.0854 |
| 2022 | 61 | `prov` | 5426.6094 | 5042.6214 |
| 2022 | 61 | `netTotal` | 6493.8934 | 6109.9054 |
| 2022 | 61 | `marg` | 0.4675 | 0.4772 |
| 2022 | 61 | `incomeTax` | 11400.1159 | 11016.1279 |
| 2022 | 61 | `gross` | 24615.8359 | 24231.8479 |
| 2022 | 61 | `avg` | 0.2244 | 0.2187 |
| 2022 | 61 | `grossAvg` | 0.362 | 0.3564 |
| 2022 | 61 | `margBy.ord` | 0.4675 | 0.4772 |
| 2022 | 61 | `margBy.cg` | 0.2338 | 0.2386 |
| 2022 | 61 | `margBy.ed` | 0.3275 | 0.3409 |
| 2022 | 61 | `margBy.nd` | 0.4248 | 0.4359 |
| 2022 | 61 | `margBy.fd` | 0.4675 | 0.4772 |
| 2022 | 61 | `people.0.prov` | 5426.6094 | 5042.6214 |
| 2022 | 61 | `people.0.total` | 15852.6559 | 15468.6679 |
| 2022 | 63 | `total` | 1069.8929 | 857.4826 |
| 2022 | 63 | `prov` | 3840.5456 | 3628.1353 |
| 2022 | 63 | `netTotal` | -1259.5094 | -1471.9197 |
| 2022 | 63 | `marg` | 0.5696 | 0.5792 |
| 2022 | 63 | `incomeTax` | 7250.3419 | 7037.9315 |
| 2022 | 63 | `gross` | 13384.2442 | 13171.8338 |
| 2022 | 63 | `avg` | 0.0195 | 0.0156 |
| 2022 | 63 | `grossAvg` | 0.2433 | 0.2395 |
| 2022 | 63 | `margBy.ord` | 0.5696 | 0.5792 |
| 2022 | 63 | `margBy.cg` | 0.2588 | 0.2636 |
| 2022 | 63 | `margBy.ed` | 0.3965 | 0.4099 |
| 2022 | 63 | `margBy.nd` | 0.4823 | 0.4934 |
| 2022 | 63 | `margBy.fd` | 0.5175 | 0.5272 |
| 2022 | 63 | `people.0.prov` | 3840.5456 | 3628.1353 |
| 2022 | 63 | `people.0.total` | 11054.8419 | 10842.4315 |
| 2022 | 64 | `total` | 5712.6109 | 5031.4069 |
| 2022 | 64 | `prov` | 5426.6094 | 4745.4054 |
| 2022 | 64 | `netTotal` | -3050.5691 | -3731.7731 |
| 2022 | 64 | `marg` | 0.5625 | 0.5722 |
| 2022 | 64 | `incomeTax` | 11400.1159 | 10718.9119 |
| 2022 | 64 | `gross` | 24615.8359 | 23934.6319 |
| 2022 | 64 | `avg` | 0.084 | 0.074 |
| 2022 | 64 | `grossAvg` | 0.362 | 0.352 |
| 2022 | 64 | `margBy.ord` | 0.5625 | 0.5722 |
| 2022 | 64 | `margBy.cg` | 0.2813 | 0.2861 |
| 2022 | 64 | `margBy.ed` | 0.4586 | 0.472 |
| 2022 | 64 | `margBy.nd` | 0.534 | 0.5452 |
| 2022 | 64 | `margBy.fd` | 0.6435 | 0.6632 |
| 2022 | 64 | `people.0.prov` | 5426.6094 | 4745.4054 |
| 2022 | 64 | `people.0.total` | 15852.6559 | 15171.4519 |
| 2022 | 65 | `total` | 20335.6026 | 19965.4385 |
| 2022 | 65 | `prov` | 10674.8522 | 10304.6881 |
| 2022 | 65 | `netTotal` | 17179.2587 | 16809.0946 |
| 2022 | 65 | `marg` | 0.459 | 0.4687 |
| 2022 | 65 | `incomeTax` | 23208.3587 | 22838.1946 |
| 2022 | 65 | `gross` | 30817.2426 | 30447.0785 |
| 2022 | 65 | `avg` | 0.2034 | 0.1997 |
| 2022 | 65 | `grossAvg` | 0.3082 | 0.3045 |
| 2022 | 65 | `margBy.ord` | 0.459 | 0.4687 |
| 2022 | 65 | `margBy.cg` | 0.2295 | 0.2344 |
| 2022 | 65 | `margBy.ed` | 0.3157 | 0.3292 |
| 2022 | 65 | `margBy.nd` | 0.415 | 0.4262 |
| 2022 | 65 | `margBy.fd` | 0.459 | 0.4687 |
| 2022 | 65 | `people.0.prov` | 10674.8522 | 10304.6881 |
| 2022 | 65 | `people.0.total` | 27660.8987 | 27290.7346 |
| 2022 | 66 | `total` | 46.6312 | -566.5329 |
| 2022 | 66 | `prov` | 6324.8522 | 5711.6881 |
| 2022 | 66 | `netTotal` | -1372.5488 | -1985.7129 |
| 2022 | 66 | `marg` | 0.474 | 0.4837 |
| 2022 | 66 | `incomeTax` | 13733.3587 | 13120.1946 |
| 2022 | 66 | `gross` | 19605.0787 | 18991.9146 |
| 2022 | 66 | `avg` | 0.0006 | -0.0076 |
| 2022 | 66 | `grossAvg` | 0.2614 | 0.2532 |
| 2022 | 66 | `margBy.ord` | 0.474 | 0.4837 |
| 2022 | 66 | `margBy.cg` | 0.237 | 0.2419 |
| 2022 | 66 | `margBy.ed` | 0.3364 | 0.3499 |
| 2022 | 66 | `margBy.nd` | 0.4322 | 0.4434 |
| 2022 | 66 | `margBy.fd` | 0.474 | 0.4837 |
| 2022 | 66 | `people.0.prov` | 6324.8522 | 5711.6881 |
| 2022 | 66 | `people.0.total` | 18185.8987 | 17572.7346 |
| 2022 | 69 | `total` | 34682.1359 | 33994.7759 |
| 2022 | 69 | `prov` | 9241.3382 | 8553.9781 |
| 2022 | 69 | `netTotal` | 14352.8309 | 13665.4709 |
| 2022 | 69 | `marg` | 0.474 | 0.4837 |
| 2022 | 69 | `incomeTax` | 20659.1197 | 19971.7596 |
| 2022 | 69 | `gross` | 47425.4647 | 46738.1046 |
| 2022 | 69 | `avg` | 0.3303 | 0.3238 |
| 2022 | 69 | `grossAvg` | 0.4517 | 0.4451 |
| 2022 | 69 | `margBy.ord` | 0.474 | 0.4837 |
| 2022 | 69 | `margBy.cg` | 0.237 | 0.2419 |
| 2022 | 69 | `margBy.ed` | 0.3364 | 0.3499 |
| 2022 | 69 | `margBy.nd` | 0.4322 | 0.4434 |
| 2022 | 69 | `margBy.fd` | 0.474 | 0.4837 |
| 2022 | 69 | `people.0.prov` | 7311.3242 | 6623.9641 |
| 2022 | 69 | `people.0.total` | 21332.0707 | 20644.7106 |
| 2022 | 70 | `total` | 5621.6332 | 5179.7917 |
| 2022 | 70 | `prov` | 4299.0368 | 3857.1953 |
| 2022 | 70 | `netTotal` | 2465.2893 | 2023.4478 |
| 2022 | 70 | `marg` | 0.3069 | 0.3166 |
| 2022 | 70 | `incomeTax` | 8512.9718 | 8071.1303 |
| 2022 | 70 | `gross` | 15783.9157 | 15342.0742 |
| 2022 | 70 | `avg` | 0.0907 | 0.0835 |
| 2022 | 70 | `grossAvg` | 0.2546 | 0.2475 |
| 2022 | 70 | `margBy.ord` | 0.3069 | 0.3166 |
| 2022 | 70 | `margBy.cg` | 0.1215 | 0.1264 |
| 2022 | 70 | `margBy.ed` | 0.2249 | 0.2384 |
| 2022 | 70 | `margBy.nd` | 0.2704 | 0.2816 |
| 2022 | 70 | `margBy.fd` | 0.4638 | 0.4786 |
| 2022 | 70 | `people.0.prov` | 3871.0868 | 3507.3037 |
| 2022 | 70 | `people.0.total` | 11307.1218 | 10943.3387 |
| 2022 | 70 | `people.1.prov` | 427.95 | 349.8916 |
| 2022 | 70 | `people.1.total` | 1320.45 | 1242.3916 |
| 2022 | 71 | `invTax` | 10602.4798 | 10680.5381 |
| 2022 | 73 | `invTax` | 6577.2873 | 6655.3457 |
| 2022 | 76 | `invTax` | 33056.8243 | 33438.2204 |
| 2022 | 79 | `total` | -17263.3405 | -18206.8825 |
| 2022 | 79 | `prov` | 943.542 | 0 |
| 2022 | 79 | `netTotal` | -19114.5205 | -20058.0625 |
| 2022 | 79 | `marg` | 0.3218 | 0.2217 |
| 2022 | 79 | `incomeTax` | 943.542 | 0 |
| 2022 | 79 | `gross` | 4779.222 | 3835.68 |
| 2022 | 79 | `avg` | -0.5754 | -0.6069 |
| 2022 | 79 | `grossAvg` | 0.1593 | 0.1279 |
| 2022 | 79 | `margBy.ord` | 0.3218 | 0.2217 |
| 2022 | 79 | `margBy.cg` | 0.129 | 0.075 |
| 2022 | 79 | `margBy.ed` | 0.2456 | 0.207 |
| 2022 | 79 | `margBy.nd` | 0.2877 | 0.1725 |
| 2022 | 79 | `margBy.fd` | 0.3761 | 0.3 |
| 2022 | 79 | `people.0.prov` | 943.542 | 0 |
| 2022 | 79 | `people.0.total` | 2928.042 | 1984.5 |
| 2022 | 80 | `total` | -32373.1139 | -32900.8161 |
| 2022 | 80 | `prov` | 527.7022 | 0 |
| 2022 | 80 | `netTotal` | -33945.4578 | -34473.16 |
| 2022 | 80 | `marg` | 0.4702 | 0.3507 |
| 2022 | 80 | `invTax` | 9329.6422 | 8801.94 |
| 2022 | 80 | `incomeTax` | 527.7022 | 0 |
| 2022 | 80 | `gross` | 2482.9461 | 1955.2439 |
| 2022 | 80 | `avg` | -0.4435 | -0.4507 |
| 2022 | 80 | `grossAvg` | 0.034 | 0.0268 |
| 2022 | 80 | `margBy.ord` | 0.4702 | 0.3507 |
| 2022 | 80 | `margBy.cg` | 0.2037 | 0.14 |
| 2022 | 80 | `margBy.ed` | 0.452 | 0.3864 |
| 2022 | 80 | `margBy.nd` | 0.4596 | 0.322 |
| 2022 | 80 | `margBy.fd` | 0.5486 | 0.43 |
| 2022 | 80 | `people.0.pDtc` | 4416 | 3304.0421 |
| 2022 | 80 | `people.0.prov` | 527.7022 | 0 |
| 2022 | 80 | `people.0.total` | 910.6022 | 382.9 |
| 2022 | 82 | `total` | -28672.5973 | -28797.2401 |
| 2022 | 82 | `prov` | 124.6428 | 0 |
| 2022 | 82 | `netTotal` | -38797.3991 | -38922.0419 |
| 2022 | 82 | `marg` | 0.1729 | 0.0728 |
| 2022 | 82 | `incomeTax` | 124.6428 | 0 |
| 2022 | 82 | `gross` | 12816.3445 | 12691.7017 |
| 2022 | 82 | `avg` | -0.7545 | -0.7578 |
| 2022 | 82 | `grossAvg` | 0.3373 | 0.334 |
| 2022 | 82 | `margBy.ord` | 0.1729 | 0.0728 |
| 2022 | 82 | `margBy.cg` | 0.054 | 0 |
| 2022 | 82 | `margBy.ed` | 0.0386 | 0 |
| 2022 | 82 | `margBy.nd` | 0.1152 | 0 |
| 2022 | 82 | `margBy.fd` | 0.3521 | 0.25 |
| 2022 | 82 | `people.0.prov` | 124.6428 | 0 |
| 2022 | 82 | `people.0.total` | 2691.5428 | 2566.9 |
| 2022 | 83 | `invTax` | 48111.9125 | 48122.4411 |
| 2022 | 89 | `total` | 10609.5318 | 9728.4934 |
| 2022 | 89 | `prov` | 7018.1324 | 6137.0941 |
| 2022 | 89 | `netTotal` | 2672.3268 | 1791.2884 |
| 2022 | 89 | `marg` | 0.4802 | 0.4899 |
| 2022 | 89 | `incomeTax` | 14799.8437 | 13918.8053 |
| 2022 | 89 | `gross` | 29108.4487 | 28227.4103 |
| 2022 | 89 | `avg` | 0.1141 | 0.1046 |
| 2022 | 89 | `grossAvg` | 0.313 | 0.3035 |
| 2022 | 89 | `margBy.ord` | 0.4802 | 0.4899 |
| 2022 | 89 | `margBy.cg` | 0.2138 | 0.2186 |
| 2022 | 89 | `margBy.ed` | 0.2723 | 0.2857 |
| 2022 | 89 | `margBy.nd` | 0.3788 | 0.3899 |
| 2022 | 89 | `margBy.fd` | 0.4275 | 0.4372 |
| 2022 | 89 | `people.0.prov` | 4827.0176 | 3945.9793 |
| 2022 | 89 | `people.0.total` | 14201.0139 | 13319.9755 |
| 2022 | 97 | `total` | 8668.272 | 8540.477 |
| 2022 | 97 | `prov` | 1204.6428 | 1076.8477 |
| 2022 | 97 | `netTotal` | 1173.4953 | 1045.7002 |
| 2022 | 97 | `marg` | 0.4609 | 0.4705 |
| 2022 | 97 | `incomeTax` | 1257.1578 | 1129.3628 |
| 2022 | 97 | `gross` | 11318.8345 | 11191.0395 |
| 2022 | 97 | `avg` | 0.2281 | 0.2247 |
| 2022 | 97 | `grossAvg` | 0.2979 | 0.2945 |
| 2022 | 97 | `margBy.ord` | 0.4609 | 0.4705 |
| 2022 | 97 | `margBy.cg` | 0.204 | 0.2089 |
| 2022 | 97 | `margBy.ed` | 0.2454 | 0.2588 |
| 2022 | 97 | `margBy.nd` | 0.3563 | 0.3675 |
| 2022 | 97 | `margBy.fd` | 0.5189 | 0.5325 |
| 2022 | 97 | `people.0.prov` | 1204.6428 | 1076.8477 |
| 2022 | 97 | `people.0.total` | 3824.0578 | 3696.2628 |
| 2022 | 98 | `total` | -1333.9045 | -2566.8852 |
| 2022 | 98 | `prov` | 7934.894 | 6701.9134 |
| 2022 | 98 | `netTotal` | -5535.3068 | -6768.2875 |
| 2022 | 98 | `marg` | 0.5264 | 0.536 |
| 2022 | 98 | `invTax` | 10879.4332 | 11209.6283 |
| 2022 | 98 | `incomeTax` | 14864.8682 | 13631.8875 |
| 2022 | 98 | `gross` | 23690.4705 | 22457.4898 |
| 2022 | 98 | `avg` | -0.0117 | -0.0225 |
| 2022 | 98 | `grossAvg` | 0.2078 | 0.197 |
| 2022 | 98 | `margBy.ord` | 0.5264 | 0.536 |
| 2022 | 98 | `margBy.cg` | 0.237 | 0.2419 |
| 2022 | 98 | `margBy.ed` | 0.3364 | 0.3499 |
| 2022 | 98 | `margBy.nd` | 0.4322 | 0.4434 |
| 2022 | 98 | `margBy.fd` | 0.5384 | 0.5636 |
| 2022 | 98 | `people.0.prov` | 4063.8072 | 2830.8266 |
| 2022 | 98 | `people.0.total` | 8181.9463 | 6948.9657 |
| 2022 | 99 | `total` | -29830.778 | -30774.32 |
| 2022 | 99 | `prov` | 943.542 | 0 |
| 2022 | 99 | `netTotal` | -36865.958 | -37809.5 |
| 2022 | 99 | `marg` | 0.1729 | 0.0728 |
| 2022 | 99 | `incomeTax` | 943.542 | 0 |
| 2022 | 99 | `gross` | 9963.222 | 9019.68 |
| 2022 | 99 | `avg` | -0.9944 | -1.0258 |
| 2022 | 99 | `grossAvg` | 0.3321 | 0.3007 |
| 2022 | 99 | `margBy.ord` | 0.1729 | 0.0728 |
| 2022 | 99 | `margBy.cg` | 0.054 | 0 |
| 2022 | 99 | `margBy.ed` | 0.0386 | 0 |
| 2022 | 99 | `margBy.nd` | 0.1152 | 0 |
| 2022 | 99 | `margBy.fd` | 0.2261 | 0.15 |
| 2022 | 99 | `people.0.prov` | 943.542 | 0 |
| 2022 | 99 | `people.0.total` | 2928.042 | 1984.5 |
| 2022 | 100 | `total` | -15427.1133 | -15551.7561 |
| 2022 | 100 | `prov` | 124.6428 | 0 |
| 2022 | 100 | `netTotal` | -21463.4572 | -21588.1 |
| 2022 | 100 | `marg` | 0.1729 | 0.0728 |
| 2022 | 100 | `incomeTax` | 124.6428 | 0 |
| 2022 | 100 | `gross` | 8727.8867 | 8603.2439 |
| 2022 | 100 | `avg` | -0.406 | -0.4093 |
| 2022 | 100 | `grossAvg` | 0.2297 | 0.2264 |
| 2022 | 100 | `margBy.ord` | 0.1729 | 0.0728 |
| 2022 | 100 | `margBy.cg` | 0.054 | 0 |
| 2022 | 100 | `margBy.ed` | 0.0386 | 0 |
| 2022 | 100 | `margBy.nd` | 0.1152 | 0 |
| 2022 | 100 | `margBy.fd` | 0.108 | 0 |
| 2022 | 100 | `people.0.prov` | 124.6428 | 0 |
| 2022 | 100 | `people.0.total` | 2691.5428 | 2566.9 |
| 2022 | 101 | `total` | 1198.3316 | 590.7835 |
| 2022 | 101 | `prov` | 2494.1094 | 1886.5614 |
| 2022 | 101 | `netTotal` | -9618.8734 | -10226.4215 |
| 2022 | 101 | `marg` | 0.5175 | 0.5272 |
| 2022 | 101 | `incomeTax` | 4063.7784 | 3456.2304 |
| 2022 | 101 | `gross` | 19333.5234 | 18725.9754 |
| 2022 | 101 | `avg` | 0.016 | 0.0079 |
| 2022 | 101 | `grossAvg` | 0.2578 | 0.2497 |
| 2022 | 101 | `margBy.ord` | 0.5175 | 0.5272 |
| 2022 | 101 | `margBy.cg` | 0.2588 | 0.2636 |
| 2022 | 101 | `margBy.ed` | 0.3965 | 0.4099 |
| 2022 | 101 | `margBy.nd` | 0.4823 | 0.4934 |
| 2022 | 101 | `margBy.fd` | 0.5758 | 0.5992 |
| 2022 | 101 | `people.0.prov` | 2494.1094 | 1886.5614 |
| 2022 | 101 | `people.0.total` | 8516.3184 | 7908.7704 |
| 2022 | 103 | `total` | 1403.6281 | 1324.4331 |
| 2022 | 103 | `prov` | 1809.1927 | 1729.9976 |
| 2022 | 103 | `netTotal` | -4707.7992 | -4786.9942 |
| 2022 | 103 | `marg` | 0.5497 | 0.5594 |
| 2022 | 103 | `incomeTax` | 2611.7077 | 2532.5126 |
| 2022 | 103 | `gross` | 11290.035 | 11210.8399 |
| 2022 | 103 | `avg` | 0.0369 | 0.0349 |
| 2022 | 103 | `grossAvg` | 0.2971 | 0.295 |
| 2022 | 103 | `margBy.ord` | 0.5497 | 0.5594 |
| 2022 | 103 | `margBy.cg` | 0.2488 | 0.2536 |
| 2022 | 103 | `margBy.ed` | 0.3689 | 0.3823 |
| 2022 | 103 | `margBy.nd` | 0.4593 | 0.4704 |
| 2022 | 103 | `margBy.fd` | 0.6777 | 0.6895 |
| 2022 | 103 | `people.0.prov` | 1809.1927 | 1729.9976 |
| 2022 | 103 | `people.0.total` | 5178.6077 | 5099.4126 |
| 2022 | 107 | `total` | 16242.5983 | 15780.8502 |
| 2022 | 107 | `prov` | 4406.6094 | 3944.8614 |
| 2022 | 107 | `netTotal` | -7570.3034 | -8032.0515 |
| 2022 | 107 | `marg` | 0.5725 | 0.5822 |
| 2022 | 107 | `incomeTax` | 8740.1159 | 8278.3679 |
| 2022 | 107 | `gross` | 37005.5577 | 36543.8096 |
| 2022 | 107 | `avg` | 0.2166 | 0.2104 |
| 2022 | 107 | `grossAvg` | 0.4934 | 0.4873 |
| 2022 | 107 | `margBy.ord` | 0.5725 | 0.5822 |
| 2022 | 107 | `margBy.cg` | 0.2863 | 0.2911 |
| 2022 | 107 | `margBy.ed` | 0.4724 | 0.4858 |
| 2022 | 107 | `margBy.nd` | 0.5455 | 0.5567 |
| 2022 | 107 | `margBy.fd` | 0.5754 | 0.5928 |
| 2022 | 107 | `people.0.prov` | 4406.6094 | 3944.8614 |
| 2022 | 107 | `people.0.total` | 13192.6559 | 12730.9079 |
| 2022 | 110 | `invTax` | 28334.5819 | 28477.0231 |
| 2022 | 113 | `invTax` | 5319.0674 | 5380.0186 |
| 2022 | 114 | `total` | 14310.0168 | 14238.2727 |
| 2022 | 114 | `prov` | 9973.4638 | 9901.7198 |
| 2022 | 114 | `netTotal` | 12458.8368 | 12387.0927 |
| 2022 | 114 | `marg` | 0.5065 | 0.5159 |
| 2022 | 114 | `invTax` | 21558.3044 | 22073.3635 |
| 2022 | 114 | `incomeTax` | 19593.8368 | 19522.0927 |
| 2022 | 114 | `gross` | 24667.1168 | 24595.3727 |
| 2022 | 114 | `avg` | 0.1337 | 0.1331 |
| 2022 | 114 | `grossAvg` | 0.2305 | 0.2299 |
| 2022 | 114 | `margBy.ord` | 0.5065 | 0.5159 |
| 2022 | 114 | `margBy.cg` | 0.2267 | 0.2314 |
| 2022 | 114 | `margBy.ed` | 0.3177 | 0.3307 |
| 2022 | 114 | `margBy.nd` | 0.412 | 0.4228 |
| 2022 | 114 | `margBy.fd` | 0.5079 | 0.518 |
| 2022 | 114 | `people.0.pFtc` | 310.2689 | 308.037 |
| 2022 | 114 | `people.0.prov` | 9973.4638 | 9901.7198 |
| 2022 | 114 | `people.0.total` | 22815.9368 | 22744.1927 |
| 2022 | 116 | `total` | -8781.1231 | -10420.5942 |
| 2022 | 116 | `prov` | 5591.3294 | 3951.8583 |
| 2022 | 116 | `netTotal` | -15384.3031 | -17023.7742 |
| 2022 | 116 | `marg` | 0.4257 | 0.4353 |
| 2022 | 116 | `incomeTax` | 11515.7594 | 9876.2883 |
| 2022 | 116 | `gross` | 23252.7394 | 21613.2683 |
| 2022 | 116 | `avg` | -0.1155 | -0.1371 |
| 2022 | 116 | `grossAvg` | 0.306 | 0.2844 |
| 2022 | 116 | `margBy.ord` | 0.4257 | 0.4353 |
| 2022 | 116 | `margBy.cg` | 0.1863 | 0.1911 |
| 2022 | 116 | `margBy.ed` | 0.1964 | 0.2098 |
| 2022 | 116 | `margBy.nd` | 0.3155 | 0.3267 |
| 2022 | 116 | `margBy.fd` | 0.4696 | 0.5226 |
| 2022 | 116 | `people.0.prov` | 2795.6647 | 1156.1936 |
| 2022 | 116 | `people.0.total` | 8324.7797 | 6685.3086 |
| 2022 | 117 | `invTax` | 22736.9957 | 22747.5243 |
| 2022 | 119 | `total` | -17774.3405 | -18717.8825 |
| 2022 | 119 | `prov` | 943.542 | 0 |
| 2022 | 119 | `netTotal` | -20777.5205 | -21721.0625 |
| 2022 | 119 | `marg` | 0.3218 | 0.2217 |
| 2022 | 119 | `incomeTax` | 943.542 | 0 |
| 2022 | 119 | `gross` | 5931.222 | 4987.68 |
| 2022 | 119 | `avg` | -0.5925 | -0.6239 |
| 2022 | 119 | `grossAvg` | 0.1977 | 0.1663 |
| 2022 | 119 | `margBy.ord` | 0.3218 | 0.2217 |
| 2022 | 119 | `margBy.cg` | 0.129 | 0.075 |
| 2022 | 119 | `margBy.ed` | 0.2456 | 0.207 |
| 2022 | 119 | `margBy.nd` | 0.2877 | 0.1725 |
| 2022 | 119 | `margBy.fd` | 0.258 | 0.15 |
| 2022 | 119 | `people.0.prov` | 943.542 | 0 |
| 2022 | 119 | `people.0.total` | 2928.042 | 1984.5 |
| 2022 | 121 | `total` | -15118.5973 | -16089.4404 |
| 2022 | 121 | `prov` | 1809.1927 | 838.3496 |
| 2022 | 121 | `netTotal` | -23881.7773 | -24852.6204 |
| 2022 | 121 | `marg` | 0.7085 | 0.7182 |
| 2022 | 121 | `incomeTax` | 2611.7077 | 1640.8646 |
| 2022 | 121 | `gross` | 13941.7877 | 12970.9446 |
| 2022 | 121 | `avg` | -0.3979 | -0.4234 |
| 2022 | 121 | `grossAvg` | 0.3669 | 0.3413 |
| 2022 | 121 | `margBy.ord` | 0.7085 | 0.7182 |
| 2022 | 121 | `margBy.cg` | 0.3288 | 0.3336 |
| 2022 | 121 | `margBy.ed` | 0.5897 | 0.6031 |
| 2022 | 121 | `margBy.nd` | 0.6433 | 0.6544 |
| 2022 | 121 | `margBy.fd` | 0.7377 | 0.7731 |
| 2022 | 121 | `people.0.prov` | 1809.1927 | 838.3496 |
| 2022 | 121 | `people.0.total` | 5178.6077 | 4207.7646 |
| 2022 | 123 | `total` | 32057.9192 | 31308.1352 |
| 2022 | 123 | `prov` | 4518.0954 | 3768.3114 |
| 2022 | 123 | `netTotal` | 4338.3919 | 3588.6079 |
| 2022 | 123 | `incomeTax` | 9047.0394 | 8297.2554 |
| 2022 | 123 | `gross` | 43203.6067 | 42453.8227 |
| 2022 | 123 | `avg` | 0.3271 | 0.3195 |
| 2022 | 123 | `grossAvg` | 0.4409 | 0.4332 |
| 2022 | 123 | `people.1.prov` | 2588.0814 | 1838.2974 |
| 2022 | 123 | `people.1.total` | 9719.9904 | 8970.2064 |
| 2022 | 124 | `total` | 12680.586 | 12670.0574 |
| 2022 | 124 | `prov` | 1128.9132 | 1118.3845 |
| 2022 | 124 | `netTotal` | -1217.6565 | -1228.1851 |
| 2022 | 124 | `marg` | 0.312 | 0.3217 |
| 2022 | 124 | `incomeTax` | 1865.8482 | 1855.3196 |
| 2022 | 124 | `gross` | 17166.1907 | 17155.6621 |
| 2022 | 124 | `avg` | 0.5764 | 0.5759 |
| 2022 | 124 | `grossAvg` | 0.7803 | 0.7798 |
| 2022 | 124 | `margBy.ord` | 0.312 | 0.3217 |
| 2022 | 124 | `margBy.cg` | 0.129 | 0.1339 |
| 2022 | 124 | `margBy.ed` | 0.0384 | 0.0518 |
| 2022 | 124 | `margBy.nd` | 0.1838 | 0.195 |
| 2022 | 124 | `margBy.fd` | 0.3219 | 0.332 |
| 2022 | 124 | `people.0.prov` | 1128.9132 | 1118.3845 |
| 2022 | 124 | `people.0.total` | 3267.9482 | 3257.4195 |
| 2022 | 126 | `invTax` | 19164.4854 | 19340.2495 |
| 2022 | 127 | `total` | 11656.6075 | 11368.2084 |
| 2022 | 127 | `prov` | 5639.452 | 5351.0529 |
| 2022 | 127 | `netTotal` | 7041.8308 | 6753.4316 |
| 2022 | 127 | `marg` | 0.5115 | 0.5212 |
| 2022 | 127 | `invTax` | 11055.4189 | 11276.6461 |
| 2022 | 127 | `incomeTax` | 14320.2308 | 14031.8316 |
| 2022 | 127 | `gross` | 22739.5075 | 22451.1084 |
| 2022 | 127 | `avg` | 0.1514 | 0.1476 |
| 2022 | 127 | `grossAvg` | 0.2953 | 0.2916 |
| 2022 | 127 | `margBy.ord` | 0.5115 | 0.5212 |
| 2022 | 127 | `margBy.cg` | 0.2295 | 0.2344 |
| 2022 | 127 | `margBy.ed` | 0.3157 | 0.3292 |
| 2022 | 127 | `margBy.nd` | 0.415 | 0.4262 |
| 2022 | 127 | `margBy.fd` | 0.459 | 0.4687 |
| 2022 | 127 | `people.0.prov` | 5639.452 | 5351.0529 |
| 2022 | 127 | `people.0.total` | 18124.7308 | 17836.3316 |
| 2022 | 128 | `total` | 11326.5699 | 11036.9828 |
| 2022 | 128 | `prov` | 2884.6148 | 2595.0277 |
| 2022 | 128 | `netTotal` | -25.8949 | -315.482 |
| 2022 | 128 | `marg` | 0.4505 | 0.4601 |
| 2022 | 128 | `incomeTax` | 4938.8498 | 4649.2627 |
| 2022 | 128 | `gross` | 19513.4146 | 19223.8275 |
| 2022 | 128 | `avg` | 0.241 | 0.2348 |
| 2022 | 128 | `grossAvg` | 0.4152 | 0.409 |
| 2022 | 128 | `margBy.ord` | 0.4505 | 0.4601 |
| 2022 | 128 | `margBy.cg` | 0.1988 | 0.2036 |
| 2022 | 128 | `margBy.ed` | 0.2309 | 0.2443 |
| 2022 | 128 | `margBy.nd` | 0.3443 | 0.3554 |
| 2022 | 128 | `margBy.fd` | 0.5413 | 0.5572 |
| 2022 | 128 | `people.0.prov` | 2884.6148 | 2595.0277 |
| 2022 | 128 | `people.0.total` | 8160.9498 | 7871.3627 |
| 2022 | 133 | `total` | -10188.5568 | -11731.0776 |
| 2022 | 133 | `prov` | 5086.7036 | 3544.1828 |
| 2022 | 133 | `netTotal` | -13381.9591 | -14924.4799 |
| 2022 | 133 | `marg` | 0.6639 | 0.6735 |
| 2022 | 133 | `invTax` | 18221.4922 | 18565.2076 |
| 2022 | 133 | `incomeTax` | 10694.8509 | 9152.3301 |
| 2022 | 133 | `gross` | 17493.2532 | 15950.7324 |
| 2022 | 133 | `avg` | -0.1171 | -0.1348 |
| 2022 | 133 | `grossAvg` | 0.2011 | 0.1833 |
| 2022 | 133 | `margBy.ord` | 0.6639 | 0.6735 |
| 2022 | 133 | `margBy.cg` | 0.3063 | 0.3111 |
| 2022 | 133 | `margBy.ed` | 0.5276 | 0.541 |
| 2022 | 133 | `margBy.nd` | 0.5915 | 0.6027 |
| 2022 | 133 | `margBy.fd` | 0.6125 | 0.6222 |
| 2022 | 133 | `people.0.prov` | 128.2668 | 38.6659 |
| 2022 | 133 | `people.0.total` | 511.1668 | 421.5659 |
| 2022 | 133 | `people.1.prov` | 4958.4368 | 3505.5169 |
| 2022 | 133 | `people.1.total` | 13788.6841 | 12335.7641 |
| 2022 | 134 | `invTax` | 6624.0199 | 6634.5486 |
| 2022 | 136 | `total` | -3057.3688 | -4167.7649 |
| 2022 | 136 | `prov` | 8064.8522 | 6954.4561 |
| 2022 | 136 | `netTotal` | -7500.5488 | -8610.9449 |
| 2022 | 136 | `marg` | 0.474 | 0.4837 |
| 2022 | 136 | `incomeTax` | 17523.3587 | 16412.9626 |
| 2022 | 136 | `gross` | 26419.0787 | 25308.6826 |
| 2022 | 136 | `avg` | -0.036 | -0.049 |
| 2022 | 136 | `grossAvg` | 0.3108 | 0.2977 |
| 2022 | 136 | `margBy.ord` | 0.474 | 0.4837 |
| 2022 | 136 | `margBy.cg` | 0.237 | 0.2419 |
| 2022 | 136 | `margBy.ed` | 0.3364 | 0.3499 |
| 2022 | 136 | `margBy.nd` | 0.4322 | 0.4434 |
| 2022 | 136 | `margBy.fd` | 0.474 | 0.4837 |
| 2022 | 136 | `people.0.prov` | 8064.8522 | 6954.4561 |
| 2022 | 136 | `people.0.total` | 21975.8987 | 20865.5026 |
| 2022 | 141 | `total` | 10723.0497 | 10213.4233 |
| 2022 | 141 | `prov` | 3840.5456 | 3330.9193 |
| 2022 | 141 | `netTotal` | -5767.1928 | -6276.8192 |
| 2022 | 141 | `marg` | 0.6242 | 0.6338 |
| 2022 | 141 | `incomeTax` | 7250.3419 | 6740.7155 |
| 2022 | 141 | `gross` | 27545.0844 | 27035.458 |
| 2022 | 141 | `avg` | 0.195 | 0.1857 |
| 2022 | 141 | `grossAvg` | 0.5008 | 0.4916 |
| 2022 | 141 | `margBy.ord` | 0.6242 | 0.6338 |
| 2022 | 141 | `margBy.cg` | 0.2863 | 0.2911 |
| 2022 | 141 | `margBy.ed` | 0.4724 | 0.4858 |
| 2022 | 141 | `margBy.nd` | 0.5455 | 0.5567 |
| 2022 | 141 | `margBy.fd` | 0.5894 | 0.6084 |
| 2022 | 141 | `people.0.prov` | 3840.5456 | 3330.9193 |
| 2022 | 141 | `people.0.total` | 11054.8419 | 10545.2155 |
| 2022 | 143 | `total` | 6759.3676 | 6594.7918 |
| 2022 | 143 | `prov` | 3954.8768 | 3790.301 |
| 2022 | 143 | `netTotal` | 3565.9653 | 3401.3895 |
| 2022 | 143 | `marg` | 0.2508 | 0.2605 |
| 2022 | 143 | `invTax` | 11556.5021 | 11826.3293 |
| 2022 | 143 | `incomeTax` | 7467.7053 | 7303.1295 |
| 2022 | 143 | `gross` | 12955.7076 | 12791.1318 |
| 2022 | 143 | `avg` | 0.0759 | 0.0741 |
| 2022 | 143 | `grossAvg` | 0.1456 | 0.1437 |
| 2022 | 143 | `margBy.ord` | 0.2508 | 0.2605 |
| 2022 | 143 | `margBy.cg` | 0.089 | 0.0939 |
| 2022 | 143 | `margBy.ed` | 0.1352 | 0.1487 |
| 2022 | 143 | `margBy.nd` | 0.1957 | 0.2069 |
| 2022 | 143 | `margBy.fd` | 0.1974 | 0.2071 |
| 2022 | 143 | `people.0.prov` | 588.9132 | 529.7845 |
| 2022 | 143 | `people.0.total` | 1991.0132 | 1931.8845 |
| 2022 | 143 | `people.1.prov` | 3365.9636 | 3260.5165 |
| 2022 | 143 | `people.1.total` | 7771.2921 | 7665.845 |
| 2022 | 144 | `total` | 22542.3455 | 22501.3743 |
| 2022 | 144 | `prov` | 2247.1148 | 2206.1437 |
| 2022 | 144 | `netTotal` | 1435.4405 | 1394.4693 |
| 2022 | 144 | `marg` | 0.5299 | 0.5395 |
| 2022 | 144 | `incomeTax` | 3551.3498 | 3510.3787 |
| 2022 | 144 | `gross` | 27880.3548 | 27839.3837 |
| 2022 | 144 | `avg` | 0.4796 | 0.4788 |
| 2022 | 144 | `grossAvg` | 0.5932 | 0.5923 |
| 2022 | 144 | `margBy.ord` | 0.5299 | 0.5395 |
| 2022 | 144 | `margBy.cg` | 0.2388 | 0.2436 |
| 2022 | 144 | `margBy.ed` | 0.3413 | 0.3547 |
| 2022 | 144 | `margBy.nd` | 0.4363 | 0.4474 |
| 2022 | 144 | `margBy.fd` | 0.6418 | 0.6525 |
| 2022 | 144 | `people.0.prov` | 2247.1148 | 2206.1437 |
| 2022 | 144 | `people.0.total` | 6773.4498 | 6732.4787 |
| 2022 | 145 | `total` | 11091.2364 | 10666.5021 |
| 2022 | 145 | `prov` | 4263.44 | 3838.7057 |
| 2022 | 145 | `netTotal` | 3902.8925 | 3478.1582 |
| 2022 | 145 | `marg` | 0.4654 | 0.475 |
| 2022 | 145 | `incomeTax` | 8477.375 | 8052.6407 |
| 2022 | 145 | `gross` | 22109.9189 | 21685.1846 |
| 2022 | 145 | `avg` | 0.118 | 0.1135 |
| 2022 | 145 | `grossAvg` | 0.2352 | 0.2307 |
| 2022 | 145 | `margBy.ord` | 0.4654 | 0.475 |
| 2022 | 145 | `margBy.cg` | 0.2063 | 0.2111 |
| 2022 | 145 | `margBy.ed` | 0.2516 | 0.265 |
| 2022 | 145 | `margBy.nd` | 0.3615 | 0.3727 |
| 2022 | 145 | `margBy.fd` | 0.4125 | 0.4222 |
| 2022 | 145 | `people.0.prov` | 392.3532 | 331.402 |
| 2022 | 145 | `people.0.total` | 3614.4532 | 3553.502 |
| 2022 | 145 | `people.1.prov` | 3871.0868 | 3507.3037 |
| 2022 | 145 | `people.1.total` | 11307.1218 | 10943.3387 |
| 2022 | 146 | `total` | 21394.6471 | 21333.6959 |
| 2022 | 146 | `prov` | 5219.3708 | 5158.4197 |
| 2022 | 146 | `netTotal` | 17815.4671 | 17754.5159 |
| 2022 | 146 | `marg` | 0.1729 | 0.1826 |
| 2022 | 146 | `incomeTax` | 10788.8671 | 10727.9159 |
| 2022 | 146 | `gross` | 21394.6471 | 21333.6959 |
| 2022 | 146 | `avg` | 0.2098 | 0.2092 |
| 2022 | 146 | `grossAvg` | 0.2098 | 0.2092 |
| 2022 | 146 | `margBy.ord` | 0.1729 | 0.1826 |
| 2022 | 146 | `margBy.cg` | 0.054 | 0.0589 |
| 2022 | 146 | `margBy.ed` | 0.0386 | 0.0521 |
| 2022 | 146 | `margBy.nd` | 0.1152 | 0.1264 |
| 2022 | 146 | `margBy.fd` | 0.234 | 0.2473 |
| 2022 | 146 | `people.0.prov` | 392.3532 | 331.402 |
| 2022 | 146 | `people.0.total` | 3614.4532 | 3553.502 |
| 2023 | 4 | `total` | -5629.6303 | -5805.8917 |
| 2023 | 4 | `prov` | 210.7998 | 34.5384 |
| 2023 | 4 | `netTotal` | -8862.0502 | -9038.3116 |
| 2023 | 4 | `marg` | 0.1756 | 0.1852 |
| 2023 | 4 | `incomeTax` | 210.7998 | 34.5384 |
| 2023 | 4 | `gross` | 5357.3697 | 5181.1083 |
| 2023 | 4 | `avg` | -0.2011 | -0.2074 |
| 2023 | 4 | `grossAvg` | 0.1913 | 0.185 |
| 2023 | 4 | `margBy.ord` | 0.1756 | 0.1852 |
| 2023 | 4 | `margBy.cg` | 0.054 | 0.0589 |
| 2023 | 4 | `margBy.ed` | 0.0386 | 0.0521 |
| 2023 | 4 | `margBy.nd` | 0.1152 | 0.1264 |
| 2023 | 4 | `margBy.fd` | 0.25 | 0.2661 |
| 2023 | 4 | `people.0.prov` | 210.7998 | 34.5384 |
| 2023 | 4 | `people.0.total` | 2124.9498 | 1948.6884 |
| 2023 | 5 | `total` | -5729.2531 | -5886.2689 |
| 2023 | 5 | `prov` | 410.427 | 253.4112 |
| 2023 | 5 | `netTotal` | -8961.673 | -9118.6888 |
| 2023 | 5 | `marg` | 0.3241 | 0.3337 |
| 2023 | 5 | `incomeTax` | 410.427 | 253.4112 |
| 2023 | 5 | `gross` | 5708.5969 | 5551.5811 |
| 2023 | 5 | `avg` | -0.191 | -0.1962 |
| 2023 | 5 | `grossAvg` | 0.1903 | 0.1851 |
| 2023 | 5 | `margBy.ord` | 0.3241 | 0.3337 |
| 2023 | 5 | `margBy.cg` | 0.129 | 0.1339 |
| 2023 | 5 | `margBy.ed` | 0.2456 | 0.2591 |
| 2023 | 5 | `margBy.nd` | 0.2877 | 0.2989 |
| 2023 | 5 | `margBy.fd` | 0.3939 | 0.4088 |
| 2023 | 5 | `people.0.prov` | 410.427 | 253.4112 |
| 2023 | 5 | `people.0.total` | 2476.177 | 2319.1612 |
| 2023 | 6 | `total` | -31982.6131 | -33481.3669 |
| 2023 | 6 | `prov` | 2058.6195 | 559.8657 |
| 2023 | 6 | `netTotal` | -35215.033 | -36713.7868 |
| 2023 | 6 | `marg` | 0.7592 | 0.7689 |
| 2023 | 6 | `incomeTax` | 3623.007 | 2124.2532 |
| 2023 | 6 | `gross` | 10058.1769 | 8559.4231 |
| 2023 | 6 | `avg` | -0.7107 | -0.744 |
| 2023 | 6 | `grossAvg` | 0.2235 | 0.1902 |
| 2023 | 6 | `margBy.ord` | 0.7592 | 0.7689 |
| 2023 | 6 | `margBy.cg` | 0.3538 | 0.3586 |
| 2023 | 6 | `margBy.ed` | 0.6587 | 0.6721 |
| 2023 | 6 | `margBy.nd` | 0.7008 | 0.7119 |
| 2023 | 6 | `margBy.fd` | 0.7758 | 0.819 |
| 2023 | 6 | `people.0.prov` | 2058.6195 | 559.8657 |
| 2023 | 6 | `people.0.total` | 6825.757 | 5327.0032 |
| 2023 | 7 | `total` | -14676.8541 | -16031.2659 |
| 2023 | 7 | `prov` | 3845.3985 | 2490.9867 |
| 2023 | 7 | `netTotal` | -17909.274 | -19263.6858 |
| 2023 | 7 | `marg` | 0.6652 | 0.6748 |
| 2023 | 7 | `incomeTax` | 7823.416 | 6469.0042 |
| 2023 | 7 | `gross` | 15395.5859 | 14041.1741 |
| 2023 | 7 | `avg` | -0.2446 | -0.2672 |
| 2023 | 7 | `grossAvg` | 0.2566 | 0.234 |
| 2023 | 7 | `margBy.ord` | 0.6652 | 0.6748 |
| 2023 | 7 | `margBy.cg` | 0.3063 | 0.3111 |
| 2023 | 7 | `margBy.ed` | 0.5276 | 0.541 |
| 2023 | 7 | `margBy.nd` | 0.5915 | 0.6027 |
| 2023 | 7 | `margBy.fd` | 0.6305 | 0.663 |
| 2023 | 7 | `people.0.prov` | 3845.3985 | 2490.9867 |
| 2023 | 7 | `people.0.total` | 12163.166 | 10808.7542 |
| 2023 | 8 | `total` | 43167.3695 | 43072.7842 |
| 2023 | 8 | `prov` | 13396.0626 | 13301.4773 |
| 2023 | 8 | `netTotal` | 36334.9496 | 36240.3643 |
| 2023 | 8 | `marg` | 0.3895 | 0.3992 |
| 2023 | 8 | `incomeTax` | 31869.6926 | 31775.1073 |
| 2023 | 8 | `gross` | 48215.9125 | 48121.3272 |
| 2023 | 8 | `avg` | 0.2878 | 0.2872 |
| 2023 | 8 | `grossAvg` | 0.3214 | 0.3208 |
| 2023 | 8 | `margBy.ord` | 0.3895 | 0.3992 |
| 2023 | 8 | `margBy.cg` | 0.1947 | 0.1996 |
| 2023 | 8 | `margBy.ed` | 0.2198 | 0.2333 |
| 2023 | 8 | `margBy.nd` | 0.3351 | 0.3462 |
| 2023 | 8 | `margBy.fd` | 0.3895 | 0.3992 |
| 2023 | 8 | `people.0.prov` | 6698.0313 | 6603.446 |
| 2023 | 8 | `people.0.total` | 20691.7463 | 20597.161 |
| 2023 | 10 | `total` | -5541.4306 | -6021.7444 |
| 2023 | 10 | `prov` | 1895.967 | 1415.6532 |
| 2023 | 10 | `netTotal` | -8773.8505 | -9254.1643 |
| 2023 | 10 | `marg` | 0.6459 | 0.6555 |
| 2023 | 10 | `incomeTax` | 3564.3045 | 3083.9907 |
| 2023 | 10 | `gross` | 9791.2244 | 9310.9106 |
| 2023 | 10 | `avg` | -0.1231 | -0.1338 |
| 2023 | 10 | `grossAvg` | 0.2176 | 0.2069 |
| 2023 | 10 | `margBy.ord` | 0.6459 | 0.6555 |
| 2023 | 10 | `margBy.cg` | 0.2965 | 0.3014 |
| 2023 | 10 | `margBy.ed` | 0.5007 | 0.5141 |
| 2023 | 10 | `margBy.nd` | 0.5691 | 0.5803 |
| 2023 | 10 | `margBy.fd` | 0.6398 | 0.6633 |
| 2023 | 10 | `people.0.prov` | 1895.967 | 1415.6532 |
| 2023 | 10 | `people.0.total` | 6009.0545 | 5528.7407 |
| 2023 | 11 | `total` | 27154.7102 | 26977.2889 |
| 2023 | 11 | `prov` | 13297.1553 | 13119.734 |
| 2023 | 11 | `netTotal` | 23922.2903 | 23744.869 |
| 2023 | 11 | `marg` | 0.514 | 0.5237 |
| 2023 | 11 | `incomeTax` | 30204.8303 | 30027.409 |
| 2023 | 11 | `gross` | 38194.1502 | 38016.7289 |
| 2023 | 11 | `avg` | 0.2263 | 0.2248 |
| 2023 | 11 | `grossAvg` | 0.3183 | 0.3168 |
| 2023 | 11 | `margBy.ord` | 0.514 | 0.5237 |
| 2023 | 11 | `margBy.cg` | 0.257 | 0.2619 |
| 2023 | 11 | `margBy.ed` | 0.3916 | 0.4051 |
| 2023 | 11 | `margBy.nd` | 0.4782 | 0.4894 |
| 2023 | 11 | `margBy.fd` | 0.514 | 0.5237 |
| 2023 | 11 | `people.0.prov` | 13297.1553 | 13119.734 |
| 2023 | 11 | `people.0.total` | 34961.7303 | 34784.309 |
| 2023 | 23 | `total` | -6841.4031 | -7251.8301 |
| 2023 | 23 | `prov` | 410.427 | 0 |
| 2023 | 23 | `netTotal` | -10073.823 | -10484.25 |
| 2023 | 23 | `marg` | 0.1756 | 0.0758 |
| 2023 | 23 | `incomeTax` | 410.427 | 0 |
| 2023 | 23 | `gross` | 5708.5969 | 5298.1699 |
| 2023 | 23 | `avg` | -0.228 | -0.2417 |
| 2023 | 23 | `grossAvg` | 0.1903 | 0.1766 |
| 2023 | 23 | `margBy.ord` | 0.1756 | 0.0758 |
| 2023 | 23 | `margBy.cg` | 0.054 | 0 |
| 2023 | 23 | `margBy.ed` | 0.0386 | 0 |
| 2023 | 23 | `margBy.nd` | 0.1152 | 0 |
| 2023 | 23 | `margBy.fd` | 0.2439 | 0.15 |
| 2023 | 23 | `people.0.prov` | 410.427 | 0 |
| 2023 | 23 | `people.0.total` | 2476.177 | 2065.75 |
| 2023 | 26 | `total` | 2013.0576 | 2002.0794 |
| 2023 | 26 | `prov` | 598.3902 | 587.412 |
| 2023 | 26 | `netTotal` | -355.3623 | -366.3405 |
| 2023 | 26 | `marg` | 0.3142 | 0.3239 |
| 2023 | 26 | `incomeTax` | 1224.2877 | 1213.3095 |
| 2023 | 26 | `gross` | 5052.0576 | 5041.0794 |
| 2023 | 26 | `avg` | 0.0915 | 0.091 |
| 2023 | 26 | `grossAvg` | 0.2296 | 0.2291 |
| 2023 | 26 | `margBy.ord` | 0.3142 | 0.3239 |
| 2023 | 26 | `margBy.cg` | 0.129 | 0.1339 |
| 2023 | 26 | `margBy.ed` | 0.0384 | 0.0518 |
| 2023 | 26 | `margBy.nd` | 0.1838 | 0.195 |
| 2023 | 26 | `margBy.fd` | 0.351 | 0.3611 |
| 2023 | 26 | `people.0.prov` | 598.3902 | 587.412 |
| 2023 | 26 | `people.0.total` | 2683.6377 | 2672.6595 |
| 2023 | 36 | `total` | -24656.6038 | -25639.366 |
| 2023 | 36 | `prov` | 1127.4362 | 144.674 |
| 2023 | 36 | `netTotal` | -27692.1038 | -28674.866 |
| 2023 | 36 | `marg` | 0.5518 | 0.5614 |
| 2023 | 36 | `invTax` | 2710.5462 | 1727.784 |
| 2023 | 36 | `incomeTax` | 1127.4362 | 144.674 |
| 2023 | 36 | `gross` | 5622.2862 | 4639.524 |
| 2023 | 36 | `avg` | -0.6489 | -0.6747 |
| 2023 | 36 | `grossAvg` | 0.148 | 0.1221 |
| 2023 | 36 | `margBy.ord` | 0.5518 | 0.5614 |
| 2023 | 36 | `margBy.cg` | 0.244 | 0.2489 |
| 2023 | 36 | `margBy.ed` | 0.563 | 0.5765 |
| 2023 | 36 | `margBy.nd` | 0.5522 | 0.5634 |
| 2023 | 36 | `margBy.fd` | 0.488 | 0.4977 |
| 2023 | 36 | `people.0.prov` | 1127.4362 | 144.674 |
| 2023 | 36 | `people.0.total` | 2586.7862 | 1604.024 |
| 2023 | 37 | `total` | -8200.8838 | -9211.5694 |
| 2023 | 37 | `prov` | 3221.2365 | 2210.5509 |
| 2023 | 37 | `netTotal` | -11827.2785 | -12837.9641 |
| 2023 | 37 | `marg` | 0.6107 | 0.6204 |
| 2023 | 37 | `incomeTax` | 7156.8615 | 6146.1759 |
| 2023 | 37 | `gross` | 16809.7562 | 15799.0706 |
| 2023 | 37 | `avg` | -0.0965 | -0.1084 |
| 2023 | 37 | `grossAvg` | 0.1978 | 0.1859 |
| 2023 | 37 | `margBy.ord` | 0.6107 | 0.6204 |
| 2023 | 37 | `margBy.cg` | 0.2788 | 0.2836 |
| 2023 | 37 | `margBy.ed` | 0.4517 | 0.4651 |
| 2023 | 37 | `margBy.nd` | 0.5283 | 0.5394 |
| 2023 | 37 | `margBy.fd` | 0.6631 | 0.697 |
| 2023 | 37 | `people.0.prov` | 575.4078 | 572.5944 |
| 2023 | 37 | `people.0.total` | 3841.5353 | 3838.7219 |
| 2023 | 37 | `people.1.prov` | 2645.8287 | 1637.9565 |
| 2023 | 37 | `people.1.total` | 9341.8262 | 8333.954 |
| 2023 | 39 | `invTax` | 57335.1828 | 58160.8266 |
| 2023 | 40 | `total` | -28881.8471 | -30284.3729 |
| 2023 | 40 | `prov` | 3249.8055 | 1847.2797 |
| 2023 | 40 | `netTotal` | -30530.267 | -31932.7928 |
| 2023 | 40 | `marg` | 0.6652 | 0.6748 |
| 2023 | 40 | `incomeTax` | 6262.423 | 4859.8972 |
| 2023 | 40 | `gross` | 11871.5929 | 10469.0671 |
| 2023 | 40 | `avg` | -0.5251 | -0.5506 |
| 2023 | 40 | `grossAvg` | 0.2158 | 0.1903 |
| 2023 | 40 | `margBy.ord` | 0.6652 | 0.6748 |
| 2023 | 40 | `margBy.cg` | 0.3063 | 0.3111 |
| 2023 | 40 | `margBy.ed` | 0.5276 | 0.541 |
| 2023 | 40 | `margBy.nd` | 0.5915 | 0.6027 |
| 2023 | 40 | `margBy.fd` | 0.6472 | 0.6826 |
| 2023 | 40 | `people.0.prov` | 3249.8055 | 1847.2797 |
| 2023 | 40 | `people.0.total` | 10223.173 | 8820.6472 |
| 2023 | 49 | `total` | -668.0717 | -975.8987 |
| 2023 | 49 | `prov` | 4552.6842 | 4244.8572 |
| 2023 | 49 | `netTotal` | -6583.5717 | -6891.3987 |
| 2023 | 49 | `marg` | 0.5761 | 0.5857 |
| 2023 | 49 | `invTax` | 14268.0783 | 13960.2513 |
| 2023 | 49 | `incomeTax` | 6570.7983 | 6262.9713 |
| 2023 | 49 | `gross` | 13945.6483 | 13637.8213 |
| 2023 | 49 | `avg` | -0.0097 | -0.0141 |
| 2023 | 49 | `grossAvg` | 0.2021 | 0.1976 |
| 2023 | 49 | `margBy.ord` | 0.5761 | 0.5857 |
| 2023 | 49 | `margBy.cg` | 0.2613 | 0.2661 |
| 2023 | 49 | `margBy.ed` | 0.4034 | 0.4168 |
| 2023 | 49 | `margBy.nd` | 0.488 | 0.4992 |
| 2023 | 49 | `margBy.fd` | 0.5225 | 0.5322 |
| 2023 | 49 | `people.0.prov` | 4552.6842 | 4244.8572 |
| 2023 | 49 | `people.0.total` | 8030.1483 | 7722.3213 |
| 2023 | 55 | `total` | 31434.8075 | 31321.1494 |
| 2023 | 55 | `prov` | 13113.7953 | 13000.1372 |
| 2023 | 55 | `netTotal` | 19279.2252 | 19165.567 |
| 2023 | 55 | `marg` | 0.529 | 0.5387 |
| 2023 | 55 | `invTax` | 16944.0211 | 17347.9843 |
| 2023 | 55 | `incomeTax` | 29239.7914 | 29126.1333 |
| 2023 | 55 | `gross` | 46152.2738 | 46038.6157 |
| 2023 | 55 | `avg` | 0.2138 | 0.2131 |
| 2023 | 55 | `grossAvg` | 0.314 | 0.3132 |
| 2023 | 55 | `margBy.ord` | 0.529 | 0.5387 |
| 2023 | 55 | `margBy.cg` | 0.2645 | 0.2694 |
| 2023 | 55 | `margBy.ed` | 0.4123 | 0.4258 |
| 2023 | 55 | `margBy.nd` | 0.4955 | 0.5067 |
| 2023 | 55 | `margBy.fd` | 0.529 | 0.5387 |
| 2023 | 55 | `people.0.prov` | 13113.7953 | 13000.1372 |
| 2023 | 55 | `people.0.total` | 33996.6914 | 33883.0333 |
| 2023 | 56 | `total` | 3238.2027 | 3179.8125 |
| 2023 | 56 | `prov` | 58.3902 | 0 |
| 2023 | 56 | `netTotal` | -2214.5623 | -2272.9525 |
| 2023 | 56 | `marg` | 0.1558 | 0.1536 |
| 2023 | 56 | `incomeTax` | 58.3902 | 0 |
| 2023 | 56 | `gross` | 6970.5052 | 6912.115 |
| 2023 | 56 | `avg` | 0.1472 | 0.1445 |
| 2023 | 56 | `grossAvg` | 0.3168 | 0.3142 |
| 2023 | 56 | `margBy.ord` | 0.1558 | 0.1536 |
| 2023 | 56 | `margBy.cg` | 0.044 | 0.037 |
| 2023 | 56 | `margBy.ed` | 0.011 | 0.0126 |
| 2023 | 56 | `margBy.nd` | 0.0922 | 0.0915 |
| 2023 | 56 | `margBy.fd` | 0.2339 | 0.2352 |
| 2023 | 56 | `people.0.prov` | 58.3902 | 0 |
| 2023 | 56 | `people.0.total` | 1517.7402 | 1459.35 |
| 2023 | 60 | `total` | -953.0219 | -1424.0801 |
| 2023 | 60 | `prov` | 471.0582 | 0 |
| 2023 | 60 | `netTotal` | -9945.4418 | -10416.5 |
| 2023 | 60 | `marg` | 0.1827 | 0.0758 |
| 2023 | 60 | `incomeTax` | 471.0582 | 0 |
| 2023 | 60 | `gross` | 11320.9781 | 10849.9199 |
| 2023 | 60 | `avg` | -0.0318 | -0.0475 |
| 2023 | 60 | `grossAvg` | 0.3774 | 0.3617 |
| 2023 | 60 | `margBy.ord` | 0.1827 | 0.0758 |
| 2023 | 60 | `margBy.cg` | 0.054 | 0 |
| 2023 | 60 | `margBy.ed` | 0.149 | 0 |
| 2023 | 60 | `margBy.nd` | 0.1242 | 0 |
| 2023 | 60 | `margBy.fd` | 0.258 | 0.15 |
| 2023 | 60 | `people.0.prov` | 471.0582 | 0 |
| 2023 | 60 | `people.0.total` | 1930.4082 | 1459.35 |
| 2023 | 61 | `total` | 13074.5843 | 12688.939 |
| 2023 | 61 | `prov` | 4819.0593 | 4433.414 |
| 2023 | 61 | `netTotal` | 4279.0843 | 3893.439 |
| 2023 | 61 | `marg` | 0.4675 | 0.4772 |
| 2023 | 61 | `incomeTax` | 10370.8743 | 9985.229 |
| 2023 | 61 | `gross` | 23923.2743 | 23537.629 |
| 2023 | 61 | `avg` | 0.1923 | 0.1866 |
| 2023 | 61 | `grossAvg` | 0.3518 | 0.3461 |
| 2023 | 61 | `margBy.ord` | 0.4675 | 0.4772 |
| 2023 | 61 | `margBy.cg` | 0.2338 | 0.2386 |
| 2023 | 61 | `margBy.ed` | 0.3275 | 0.3409 |
| 2023 | 61 | `margBy.nd` | 0.4248 | 0.4359 |
| 2023 | 61 | `margBy.fd` | 0.4675 | 0.4787 |
| 2023 | 61 | `people.0.prov` | 4819.0593 | 4433.414 |
| 2023 | 61 | `people.0.total` | 15127.7743 | 14742.129 |
| 2023 | 63 | `total` | -1411.4299 | -1625.0917 |
| 2023 | 63 | `prov` | 3249.8055 | 3036.1437 |
| 2023 | 63 | `netTotal` | -3786.357 | -4000.0188 |
| 2023 | 63 | `marg` | 0.5711 | 0.5808 |
| 2023 | 63 | `incomeTax` | 6262.423 | 6048.7612 |
| 2023 | 63 | `gross` | 12598.1001 | 12384.4383 |
| 2023 | 63 | `avg` | -0.0257 | -0.0295 |
| 2023 | 63 | `grossAvg` | 0.2291 | 0.2252 |
| 2023 | 63 | `margBy.ord` | 0.5711 | 0.5808 |
| 2023 | 63 | `margBy.cg` | 0.2588 | 0.2636 |
| 2023 | 63 | `margBy.ed` | 0.3965 | 0.4099 |
| 2023 | 63 | `margBy.nd` | 0.4823 | 0.4934 |
| 2023 | 63 | `margBy.fd` | 0.5175 | 0.5272 |
| 2023 | 63 | `people.0.prov` | 3249.8055 | 3036.1437 |
| 2023 | 63 | `people.0.total` | 10223.173 | 10009.5112 |
| 2023 | 64 | `total` | 2813.6543 | 2130.793 |
| 2023 | 64 | `prov` | 4819.0593 | 4136.198 |
| 2023 | 64 | `netTotal` | -5981.8457 | -6664.707 |
| 2023 | 64 | `marg` | 0.5625 | 0.5722 |
| 2023 | 64 | `incomeTax` | 10370.8743 | 9688.013 |
| 2023 | 64 | `gross` | 23923.2743 | 23240.413 |
| 2023 | 64 | `avg` | 0.0414 | 0.0313 |
| 2023 | 64 | `grossAvg` | 0.3518 | 0.3418 |
| 2023 | 64 | `margBy.ord` | 0.5625 | 0.5722 |
| 2023 | 64 | `margBy.cg` | 0.2813 | 0.2861 |
| 2023 | 64 | `margBy.ed` | 0.4586 | 0.472 |
| 2023 | 64 | `margBy.nd` | 0.534 | 0.5452 |
| 2023 | 64 | `margBy.fd` | 0.6583 | 0.6781 |
| 2023 | 64 | `people.0.prov` | 4819.0593 | 4136.198 |
| 2023 | 64 | `people.0.total` | 15127.7743 | 14444.913 |
| 2023 | 65 | `total` | 17915.8502 | 17544.0289 |
| 2023 | 65 | `prov` | 9817.1553 | 9445.334 |
| 2023 | 65 | `netTotal` | 14683.4303 | 14311.609 |
| 2023 | 65 | `marg` | 0.459 | 0.4687 |
| 2023 | 65 | `incomeTax` | 21928.9703 | 21557.149 |
| 2023 | 65 | `gross` | 29918.2902 | 29546.4689 |
| 2023 | 65 | `avg` | 0.1792 | 0.1754 |
| 2023 | 65 | `grossAvg` | 0.2992 | 0.2955 |
| 2023 | 65 | `margBy.ord` | 0.459 | 0.4687 |
| 2023 | 65 | `margBy.cg` | 0.2295 | 0.2344 |
| 2023 | 65 | `margBy.ed` | 0.3157 | 0.3292 |
| 2023 | 65 | `margBy.nd` | 0.415 | 0.4262 |
| 2023 | 65 | `margBy.fd` | 0.459 | 0.4687 |
| 2023 | 65 | `people.0.prov` | 9817.1553 | 9445.334 |
| 2023 | 65 | `people.0.total` | 26685.8703 | 26314.049 |
| 2023 | 66 | `total` | -2879.8457 | -3494.667 |
| 2023 | 66 | `prov` | 5711.5593 | 5096.738 |
| 2023 | 66 | `netTotal` | -4331.3457 | -4946.167 |
| 2023 | 66 | `marg` | 0.5625 | 0.5722 |
| 2023 | 66 | `incomeTax` | 12698.3743 | 12083.553 |
| 2023 | 66 | `gross` | 18906.7743 | 18291.953 |
| 2023 | 66 | `avg` | -0.0384 | -0.0466 |
| 2023 | 66 | `grossAvg` | 0.2521 | 0.2439 |
| 2023 | 66 | `margBy.ord` | 0.5625 | 0.5722 |
| 2023 | 66 | `margBy.cg` | 0.2813 | 0.2861 |
| 2023 | 66 | `margBy.ed` | 0.4586 | 0.472 |
| 2023 | 66 | `margBy.nd` | 0.534 | 0.5452 |
| 2023 | 66 | `margBy.fd` | 0.5625 | 0.5722 |
| 2023 | 66 | `people.0.prov` | 5711.5593 | 5096.738 |
| 2023 | 66 | `people.0.total` | 17455.2743 | 16840.453 |
| 2023 | 69 | `total` | 30994.0228 | 30305.0055 |
| 2023 | 69 | `prov` | 8094.9303 | 7405.913 |
| 2023 | 69 | `netTotal` | 11696.1978 | 11007.1805 |
| 2023 | 69 | `marg` | 0.4275 | 0.4372 |
| 2023 | 69 | `incomeTax` | 19066.6828 | 18377.6655 |
| 2023 | 69 | `gross` | 45187.1578 | 44498.1405 |
| 2023 | 69 | `avg` | 0.2952 | 0.2886 |
| 2023 | 69 | `grossAvg` | 0.4304 | 0.4238 |
| 2023 | 69 | `margBy.ord` | 0.4275 | 0.4372 |
| 2023 | 69 | `margBy.cg` | 0.2138 | 0.2186 |
| 2023 | 69 | `margBy.ed` | 0.2723 | 0.2857 |
| 2023 | 69 | `margBy.nd` | 0.3788 | 0.3899 |
| 2023 | 69 | `margBy.fd` | 0.4275 | 0.4372 |
| 2023 | 69 | `people.0.prov` | 6698.0313 | 6009.014 |
| 2023 | 69 | `people.0.total` | 20691.7463 | 20002.729 |
| 2023 | 70 | `total` | 3189.2411 | 2824.4009 |
| 2023 | 70 | `prov` | 3283.3287 | 2918.4885 |
| 2023 | 70 | `netTotal` | -43.1788 | -408.019 |
| 2023 | 70 | `incomeTax` | 7357.7262 | 6992.886 |
| 2023 | 70 | `gross` | 14873.2461 | 14508.4059 |
| 2023 | 70 | `avg` | 0.0514 | 0.0456 |
| 2023 | 70 | `grossAvg` | 0.2399 | 0.234 |
| 2023 | 70 | `people.0.prov` | 3283.3287 | 2918.4885 |
| 2023 | 70 | `people.0.total` | 10712.0762 | 10347.236 |
| 2023 | 76 | `invTax` | 32651.3999 | 33034.4532 |
| 2023 | 79 | `total` | -19708.173 | -20118.6 |
| 2023 | 79 | `prov` | 410.427 | 0 |
| 2023 | 79 | `netTotal` | -21591.673 | -22002.1 |
| 2023 | 79 | `marg` | 0.3241 | 0.2243 |
| 2023 | 79 | `incomeTax` | 410.427 | 0 |
| 2023 | 79 | `gross` | 4359.677 | 3949.25 |
| 2023 | 79 | `avg` | -0.6569 | -0.6706 |
| 2023 | 79 | `grossAvg` | 0.1453 | 0.1316 |
| 2023 | 79 | `margBy.ord` | 0.3241 | 0.2243 |
| 2023 | 79 | `margBy.cg` | 0.129 | 0.075 |
| 2023 | 79 | `margBy.ed` | 0.2456 | 0.207 |
| 2023 | 79 | `margBy.nd` | 0.2877 | 0.1725 |
| 2023 | 79 | `margBy.fd` | 0.3939 | 0.3 |
| 2023 | 79 | `people.0.prov` | 410.427 | 0 |
| 2023 | 79 | `people.0.total` | 2476.177 | 2065.75 |
| 2023 | 80 | `people.0.pDtc` | 4370.4813 | 2730.7119 |
| 2023 | 83 | `invTax` | 46685.3552 | 46696.3334 |
| 2023 | 89 | `total` | 6995.3478 | 6113.058 |
| 2023 | 89 | `prov` | 5891.6853 | 5009.3955 |
| 2023 | 89 | `netTotal` | -761.4172 | -1643.707 |
| 2023 | 89 | `marg` | 0.482 | 0.4917 |
| 2023 | 89 | `incomeTax` | 13248.2803 | 12365.9905 |
| 2023 | 89 | `gross` | 27637.9453 | 26755.6555 |
| 2023 | 89 | `avg` | 0.0752 | 0.0657 |
| 2023 | 89 | `grossAvg` | 0.2972 | 0.2877 |
| 2023 | 89 | `margBy.ord` | 0.482 | 0.4917 |
| 2023 | 89 | `margBy.cg` | 0.2138 | 0.2186 |
| 2023 | 89 | `margBy.ed` | 0.2723 | 0.2857 |
| 2023 | 89 | `margBy.nd` | 0.3788 | 0.3899 |
| 2023 | 89 | `margBy.fd` | 0.4275 | 0.4372 |
| 2023 | 89 | `people.0.prov` | 4236.2775 | 3353.9877 |
| 2023 | 89 | `people.0.total` | 13459.645 | 12577.3552 |
| 2023 | 97 | `total` | 7607.6305 | 7478.9971 |
| 2023 | 97 | `prov` | 668.9358 | 540.3024 |
| 2023 | 97 | `netTotal` | -50.7642 | -179.3976 |
| 2023 | 97 | `marg` | 0.3241 | 0.3337 |
| 2023 | 97 | `incomeTax` | 668.9358 | 540.3024 |
| 2023 | 97 | `gross` | 10999.4805 | 10870.8471 |
| 2023 | 97 | `avg` | 0.2002 | 0.1968 |
| 2023 | 97 | `grossAvg` | 0.2895 | 0.2861 |
| 2023 | 97 | `margBy.ord` | 0.3241 | 0.3337 |
| 2023 | 97 | `margBy.cg` | 0.129 | 0.1339 |
| 2023 | 97 | `margBy.ed` | 0.2456 | 0.2591 |
| 2023 | 97 | `margBy.nd` | 0.2877 | 0.2989 |
| 2023 | 97 | `margBy.fd` | 0.3872 | 0.4009 |
| 2023 | 97 | `people.0.prov` | 668.9358 | 540.3024 |
| 2023 | 97 | `people.0.total` | 3341.0858 | 3212.4524 |
| 2023 | 98 | `total` | -5732.1501 | -6965.5803 |
| 2023 | 98 | `prov` | 6529.4424 | 5296.0122 |
| 2023 | 98 | `netTotal` | -9979.0772 | -11212.5074 |
| 2023 | 98 | `marg` | 0.482 | 0.4917 |
| 2023 | 98 | `invTax` | 11271.7989 | 11603.0511 |
| 2023 | 98 | `incomeTax` | 13049.6378 | 11816.2076 |
| 2023 | 98 | `gross` | 22110.2649 | 20876.8347 |
| 2023 | 98 | `avg` | -0.0503 | -0.0611 |
| 2023 | 98 | `grossAvg` | 0.1939 | 0.1831 |
| 2023 | 98 | `margBy.ord` | 0.482 | 0.4917 |
| 2023 | 98 | `margBy.cg` | 0.2138 | 0.2186 |
| 2023 | 98 | `margBy.ed` | 0.2853 | 0.2987 |
| 2023 | 98 | `margBy.nd` | 0.3811 | 0.3923 |
| 2023 | 98 | `margBy.fd` | 0.5058 | 0.531 |
| 2023 | 98 | `people.0.prov` | 3246.1137 | 2012.6835 |
| 2023 | 98 | `people.0.total` | 7134.0116 | 5900.5814 |
| 2023 | 99 | `total` | -32754.323 | -33164.75 |
| 2023 | 99 | `prov` | 410.427 | 0 |
| 2023 | 99 | `netTotal` | -39821.823 | -40232.25 |
| 2023 | 99 | `marg` | 0.1756 | 0.0758 |
| 2023 | 99 | `incomeTax` | 410.427 | 0 |
| 2023 | 99 | `gross` | 9543.677 | 9133.25 |
| 2023 | 99 | `avg` | -1.0918 | -1.1055 |
| 2023 | 99 | `grossAvg` | 0.3181 | 0.3044 |
| 2023 | 99 | `margBy.ord` | 0.1756 | 0.0758 |
| 2023 | 99 | `margBy.cg` | 0.054 | 0 |
| 2023 | 99 | `margBy.ed` | 0.0386 | 0 |
| 2023 | 99 | `margBy.nd` | 0.1152 | 0 |
| 2023 | 99 | `margBy.fd` | 0.2439 | 0.15 |
| 2023 | 99 | `people.0.prov` | 410.427 | 0 |
| 2023 | 99 | `people.0.total` | 2476.177 | 2065.75 |
| 2023 | 101 | `total` | -1967.3032 | -2576.5085 |
| 2023 | 101 | `prov` | 1886.5593 | 1277.354 |
| 2023 | 101 | `netTotal` | -12604.0682 | -13213.2735 |
| 2023 | 101 | `marg` | 0.6675 | 0.6772 |
| 2023 | 101 | `incomeTax` | 3217.8243 | 2608.619 |
| 2023 | 101 | `gross` | 18611.4893 | 18002.284 |
| 2023 | 101 | `avg` | -0.0262 | -0.0344 |
| 2023 | 101 | `grossAvg` | 0.2482 | 0.24 |
| 2023 | 101 | `margBy.ord` | 0.6675 | 0.6772 |
| 2023 | 101 | `margBy.cg` | 0.3338 | 0.3386 |
| 2023 | 101 | `margBy.ed` | 0.6035 | 0.6169 |
| 2023 | 101 | `margBy.nd` | 0.6548 | 0.6659 |
| 2023 | 101 | `margBy.fd` | 0.7445 | 0.7679 |
| 2023 | 101 | `people.0.prov` | 1886.5593 | 1277.354 |
| 2023 | 101 | `people.0.total` | 7974.7243 | 7365.519 |
| 2023 | 103 | `total` | -883.1836 | -963.217 |
| 2023 | 103 | `prov` | 1224.7893 | 1144.7559 |
| 2023 | 103 | `netTotal` | -6827.3757 | -6907.4091 |
| 2023 | 103 | `marg` | 0.5513 | 0.561 |
| 2023 | 103 | `incomeTax` | 1818.7668 | 1738.7334 |
| 2023 | 103 | `gross` | 10435.1089 | 10355.0755 |
| 2023 | 103 | `avg` | -0.0232 | -0.0253 |
| 2023 | 103 | `grossAvg` | 0.2746 | 0.2725 |
| 2023 | 103 | `margBy.ord` | 0.5513 | 0.561 |
| 2023 | 103 | `margBy.cg` | 0.2488 | 0.2536 |
| 2023 | 103 | `margBy.ed` | 0.3689 | 0.3823 |
| 2023 | 103 | `margBy.nd` | 0.4593 | 0.4704 |
| 2023 | 103 | `margBy.fd` | 0.6986 | 0.7104 |
| 2023 | 103 | `people.0.prov` | 1224.7893 | 1144.7559 |
| 2023 | 103 | `people.0.total` | 4490.9168 | 4410.8834 |
| 2023 | 107 | `total` | 11494.9215 | 11031.5162 |
| 2023 | 107 | `prov` | 3799.0593 | 3335.654 |
| 2023 | 107 | `netTotal` | -11417.7982 | -11881.2035 |
| 2023 | 107 | `marg` | 0.5725 | 0.5822 |
| 2023 | 107 | `incomeTax` | 7710.8743 | 7247.469 |
| 2023 | 107 | `gross` | 35380.494 | 34917.0887 |
| 2023 | 107 | `avg` | 0.1533 | 0.1471 |
| 2023 | 107 | `grossAvg` | 0.4717 | 0.4656 |
| 2023 | 107 | `margBy.ord` | 0.5725 | 0.5822 |
| 2023 | 107 | `margBy.cg` | 0.2863 | 0.2911 |
| 2023 | 107 | `margBy.ed` | 0.4724 | 0.4858 |
| 2023 | 107 | `margBy.nd` | 0.5455 | 0.5567 |
| 2023 | 107 | `margBy.fd` | 0.5923 | 0.6098 |
| 2023 | 107 | `people.0.prov` | 3799.0593 | 3335.654 |
| 2023 | 107 | `people.0.total` | 12467.7743 | 12004.369 |
| 2023 | 114 | `total` | 12122.6483 | 12049.8816 |
| 2023 | 114 | `prov` | 9163.3119 | 9090.5451 |
| 2023 | 114 | `netTotal` | 10239.1483 | 10166.3816 |
| 2023 | 114 | `marg` | 0.5079 | 0.5172 |
| 2023 | 114 | `invTax` | 21671.9141 | 22187.0076 |
| 2023 | 114 | `incomeTax` | 18402.7583 | 18329.9916 |
| 2023 | 114 | `gross` | 23640.6083 | 23567.8416 |
| 2023 | 114 | `avg` | 0.1133 | 0.1126 |
| 2023 | 114 | `grossAvg` | 0.2209 | 0.2203 |
| 2023 | 114 | `margBy.ord` | 0.5079 | 0.5172 |
| 2023 | 114 | `margBy.cg` | 0.2265 | 0.2312 |
| 2023 | 114 | `margBy.ed` | 0.3172 | 0.3302 |
| 2023 | 114 | `margBy.nd` | 0.4116 | 0.4224 |
| 2023 | 114 | `margBy.fd` | 0.5196 | 0.5298 |
| 2023 | 114 | `people.0.pFtc` | 285.3873 | 283.1211 |
| 2023 | 114 | `people.0.prov` | 9163.3119 | 9090.5451 |
| 2023 | 114 | `people.0.total` | 21757.1083 | 21684.3416 |
| 2023 | 116 | `total` | -12957.1624 | -14597.4718 |
| 2023 | 116 | `prov` | 4422.5226 | 2782.2132 |
| 2023 | 116 | `netTotal` | -19592.6624 | -21232.9718 |
| 2023 | 116 | `marg` | 0.6107 | 0.6204 |
| 2023 | 116 | `incomeTax` | 10110.4776 | 8470.1682 |
| 2023 | 116 | `gross` | 22090.2776 | 20449.9682 |
| 2023 | 116 | `avg` | -0.1705 | -0.1921 |
| 2023 | 116 | `grossAvg` | 0.2907 | 0.2691 |
| 2023 | 116 | `margBy.ord` | 0.6107 | 0.6204 |
| 2023 | 116 | `margBy.cg` | 0.2788 | 0.2836 |
| 2023 | 116 | `margBy.ed` | 0.4517 | 0.4651 |
| 2023 | 116 | `margBy.nd` | 0.5283 | 0.5394 |
| 2023 | 116 | `margBy.fd` | 0.6729 | 0.726 |
| 2023 | 116 | `people.0.prov` | 2211.2613 | 570.9519 |
| 2023 | 116 | `people.0.total` | 7727.3888 | 6087.0794 |
| 2023 | 117 | `invTax` | 22951.3377 | 22962.3159 |
| 2023 | 119 | `total` | -20355.173 | -20765.6 |
| 2023 | 119 | `prov` | 410.427 | 0 |
| 2023 | 119 | `netTotal` | -23390.673 | -23801.1 |
| 2023 | 119 | `marg` | 0.3241 | 0.2243 |
| 2023 | 119 | `incomeTax` | 410.427 | 0 |
| 2023 | 119 | `gross` | 5511.677 | 5101.25 |
| 2023 | 119 | `avg` | -0.6785 | -0.6922 |
| 2023 | 119 | `grossAvg` | 0.1837 | 0.17 |
| 2023 | 119 | `margBy.ord` | 0.3241 | 0.2243 |
| 2023 | 119 | `margBy.cg` | 0.129 | 0.075 |
| 2023 | 119 | `margBy.ed` | 0.2456 | 0.207 |
| 2023 | 119 | `margBy.nd` | 0.2877 | 0.1725 |
| 2023 | 119 | `margBy.fd` | 0.258 | 0.15 |
| 2023 | 119 | `people.0.prov` | 410.427 | 0 |
| 2023 | 119 | `people.0.total` | 2476.177 | 2065.75 |
| 2023 | 121 | `total` | -18883.2732 | -19854.9546 |
| 2023 | 121 | `prov` | 1224.7893 | 253.1079 |
| 2023 | 121 | `netTotal` | -27678.7732 | -28650.4546 |
| 2023 | 121 | `marg` | 0.7097 | 0.7194 |
| 2023 | 121 | `incomeTax` | 1818.7668 | 847.0854 |
| 2023 | 121 | `gross` | 13286.4168 | 12314.7354 |
| 2023 | 121 | `avg` | -0.4969 | -0.5225 |
| 2023 | 121 | `grossAvg` | 0.3496 | 0.3241 |
| 2023 | 121 | `margBy.ord` | 0.7097 | 0.7194 |
| 2023 | 121 | `margBy.cg` | 0.3288 | 0.3336 |
| 2023 | 121 | `margBy.ed` | 0.5897 | 0.6031 |
| 2023 | 121 | `margBy.nd` | 0.6433 | 0.6544 |
| 2023 | 121 | `margBy.fd` | 0.7586 | 0.794 |
| 2023 | 121 | `people.0.prov` | 1224.7893 | 253.1079 |
| 2023 | 121 | `people.0.total` | 4490.9168 | 3519.2354 |
| 2023 | 123 | `total` | 28468.3249 | 27716.8836 |
| 2023 | 123 | `prov` | 3377.4303 | 2625.989 |
| 2023 | 123 | `netTotal` | 1767.0728 | 1015.6315 |
| 2023 | 123 | `incomeTax` | 7643.6328 | 6892.1915 |
| 2023 | 123 | `gross` | 41167.5349 | 40416.0936 |
| 2023 | 123 | `avg` | 0.2905 | 0.2828 |
| 2023 | 123 | `grossAvg` | 0.4201 | 0.4124 |
| 2023 | 123 | `people.1.prov` | 1980.5313 | 1229.09 |
| 2023 | 123 | `people.1.total` | 9268.6963 | 8517.255 |
| 2023 | 124 | `total` | 10933.594 | 10922.6158 |
| 2023 | 124 | `prov` | 598.3902 | 587.412 |
| 2023 | 124 | `netTotal` | -2465.0685 | -2476.0467 |
| 2023 | 124 | `marg` | 0.3142 | 0.3239 |
| 2023 | 124 | `incomeTax` | 1224.2877 | 1213.3095 |
| 2023 | 124 | `gross` | 16082.3002 | 16071.322 |
| 2023 | 124 | `avg` | 0.497 | 0.4965 |
| 2023 | 124 | `grossAvg` | 0.731 | 0.7305 |
| 2023 | 124 | `margBy.ord` | 0.3142 | 0.3239 |
| 2023 | 124 | `margBy.cg` | 0.129 | 0.1339 |
| 2023 | 124 | `margBy.ed` | 0.0384 | 0.0518 |
| 2023 | 124 | `margBy.nd` | 0.1838 | 0.195 |
| 2023 | 124 | `margBy.fd` | 0.351 | 0.3611 |
| 2023 | 124 | `people.0.prov` | 598.3902 | 587.412 |
| 2023 | 124 | `people.0.total` | 2683.6377 | 2672.6595 |
| 2023 | 126 | `invTax` | 18405.2008 | 18582.6221 |
| 2023 | 127 | `total` | 9448.5612 | 9158.9106 |
| 2023 | 127 | `prov` | 4811.6411 | 4521.9905 |
| 2023 | 127 | `netTotal` | 4670.1665 | 4380.5159 |
| 2023 | 127 | `marg` | 0.4672 | 0.4768 |
| 2023 | 127 | `invTax` | 11624.3135 | 11845.5407 |
| 2023 | 127 | `incomeTax` | 13194.7765 | 12905.1259 |
| 2023 | 127 | `gross` | 21933.9212 | 21644.2706 |
| 2023 | 127 | `avg` | 0.1227 | 0.1189 |
| 2023 | 127 | `grossAvg` | 0.2849 | 0.2811 |
| 2023 | 127 | `margBy.ord` | 0.4672 | 0.4768 |
| 2023 | 127 | `margBy.cg` | 0.2063 | 0.2111 |
| 2023 | 127 | `margBy.ed` | 0.2516 | 0.265 |
| 2023 | 127 | `margBy.nd` | 0.3615 | 0.3727 |
| 2023 | 127 | `margBy.fd` | 0.4125 | 0.4222 |
| 2023 | 127 | `people.0.prov` | 4811.6411 | 4521.9905 |
| 2023 | 127 | `people.0.total` | 17155.5265 | 16865.8759 |
| 2023 | 128 | `total` | 8783.8776 | 8493.2334 |
| 2023 | 128 | `prov` | 2296.8567 | 2006.2125 |
| 2023 | 128 | `netTotal` | -2082.212 | -2372.8562 |
| 2023 | 128 | `marg` | 0.4523 | 0.462 |
| 2023 | 128 | `incomeTax` | 4138.5042 | 3847.86 |
| 2023 | 128 | `gross` | 18358.9438 | 18068.2996 |
| 2023 | 128 | `avg` | 0.1869 | 0.1807 |
| 2023 | 128 | `grossAvg` | 0.3906 | 0.3844 |
| 2023 | 128 | `margBy.ord` | 0.4523 | 0.462 |
| 2023 | 128 | `margBy.cg` | 0.1988 | 0.2036 |
| 2023 | 128 | `margBy.ed` | 0.2309 | 0.2443 |
| 2023 | 128 | `margBy.nd` | 0.3443 | 0.3554 |
| 2023 | 128 | `margBy.fd` | 0.5582 | 0.5741 |
| 2023 | 128 | `people.0.prov` | 2296.8567 | 2006.2125 |
| 2023 | 128 | `people.0.total` | 7492.8542 | 7202.21 |
| 2023 | 133 | `total` | -14633.9532 | -16087.9302 |
| 2023 | 133 | `prov` | 4370.6787 | 2916.7017 |
| 2023 | 133 | `netTotal` | -17872.8803 | -19326.8573 |
| 2023 | 133 | `marg` | 0.6652 | 0.6748 |
| 2023 | 133 | `invTax` | 18160.314 | 18052.7352 |
| 2023 | 133 | `incomeTax` | 9584.6597 | 8130.6827 |
| 2023 | 133 | `gross` | 16576.0868 | 15122.1098 |
| 2023 | 133 | `avg` | -0.1682 | -0.1849 |
| 2023 | 133 | `grossAvg` | 0.1905 | 0.1738 |
| 2023 | 133 | `margBy.ord` | 0.6652 | 0.6748 |
| 2023 | 133 | `margBy.cg` | 0.3063 | 0.3111 |
| 2023 | 133 | `margBy.ed` | 0.5276 | 0.541 |
| 2023 | 133 | `margBy.nd` | 0.5915 | 0.6027 |
| 2023 | 133 | `margBy.fd` | 0.6125 | 0.6222 |
| 2023 | 133 | `people.1.prov` | 4370.6787 | 2916.7017 |
| 2023 | 133 | `people.1.total` | 12939.0097 | 11485.0327 |
| 2023 | 134 | `invTax` | 6067.1466 | 6078.1248 |
| 2023 | 136 | `total` | -6840.5897 | -7952.643 |
| 2023 | 136 | `prov` | 7207.1553 | 6095.102 |
| 2023 | 136 | `netTotal` | -11316.0897 | -12428.143 |
| 2023 | 136 | `marg` | 0.474 | 0.4837 |
| 2023 | 136 | `incomeTax` | 16243.9703 | 15131.917 |
| 2023 | 136 | `gross` | 25476.3703 | 24364.317 |
| 2023 | 136 | `avg` | -0.0805 | -0.0936 |
| 2023 | 136 | `grossAvg` | 0.2997 | 0.2866 |
| 2023 | 136 | `margBy.ord` | 0.474 | 0.4837 |
| 2023 | 136 | `margBy.cg` | 0.237 | 0.2419 |
| 2023 | 136 | `margBy.ed` | 0.3364 | 0.3499 |
| 2023 | 136 | `margBy.nd` | 0.4322 | 0.4434 |
| 2023 | 136 | `margBy.fd` | 0.474 | 0.4837 |
| 2023 | 136 | `people.0.prov` | 7207.1553 | 6095.102 |
| 2023 | 136 | `people.0.total` | 21000.8703 | 19888.817 |
| 2023 | 141 | `total` | 6926.8093 | 6415.9315 |
| 2023 | 141 | `prov` | 3249.8055 | 2738.9277 |
| 2023 | 141 | `netTotal` | -9063.8532 | -9574.731 |
| 2023 | 141 | `marg` | 0.6256 | 0.6352 |
| 2023 | 141 | `incomeTax` | 6262.423 | 5751.5452 |
| 2023 | 141 | `gross` | 26213.8355 | 25702.9577 |
| 2023 | 141 | `avg` | 0.1259 | 0.1167 |
| 2023 | 141 | `grossAvg` | 0.4766 | 0.4673 |
| 2023 | 141 | `margBy.ord` | 0.6256 | 0.6352 |
| 2023 | 141 | `margBy.cg` | 0.2863 | 0.2911 |
| 2023 | 141 | `margBy.ed` | 0.4724 | 0.4858 |
| 2023 | 141 | `margBy.nd` | 0.5455 | 0.5567 |
| 2023 | 141 | `margBy.fd` | 0.6072 | 0.6262 |
| 2023 | 141 | `people.0.prov` | 3249.8055 | 2738.9277 |
| 2023 | 141 | `people.0.total` | 10223.173 | 9712.2952 |
| 2023 | 143 | `total` | 4544.1818 | 4380.065 |
| 2023 | 143 | `prov` | 2848.5237 | 2684.4069 |
| 2023 | 143 | `netTotal` | 1305.2547 | 1141.1379 |
| 2023 | 143 | `marg` | 0.3934 | 0.3912 |
| 2023 | 143 | `invTax` | 11132.7645 | 11027.0379 |
| 2023 | 143 | `incomeTax` | 6253.4647 | 6089.3479 |
| 2023 | 143 | `gross` | 11880.4918 | 11716.375 |
| 2023 | 143 | `avg` | 0.0511 | 0.0492 |
| 2023 | 143 | `grossAvg` | 0.1335 | 0.1316 |
| 2023 | 143 | `margBy.ord` | 0.3934 | 0.3912 |
| 2023 | 143 | `margBy.cg` | 0.164 | 0.157 |
| 2023 | 143 | `margBy.ed` | 0.3422 | 0.3438 |
| 2023 | 143 | `margBy.nd` | 0.3682 | 0.3675 |
| 2023 | 143 | `margBy.fd` | 0.328 | 0.3258 |
| 2023 | 143 | `people.0.prov` | 58.3902 | 0 |
| 2023 | 143 | `people.0.total` | 1517.7402 | 1459.35 |
| 2023 | 143 | `people.1.prov` | 2790.1335 | 2684.4069 |
| 2023 | 143 | `people.1.total` | 7123.8245 | 7018.0979 |
| 2023 | 144 | `total` | 19206.0167 | 19163.9885 |
| 2023 | 144 | `prov` | 1659.3567 | 1617.3285 |
| 2023 | 144 | `netTotal` | -869.4083 | -911.4365 |
| 2023 | 144 | `marg` | 0.482 | 0.4917 |
| 2023 | 144 | `incomeTax` | 2751.0042 | 2708.976 |
| 2023 | 144 | `gross` | 26180.7792 | 26138.751 |
| 2023 | 144 | `avg` | 0.4086 | 0.4077 |
| 2023 | 144 | `grossAvg` | 0.557 | 0.5561 |
| 2023 | 144 | `margBy.ord` | 0.482 | 0.4917 |
| 2023 | 144 | `margBy.cg` | 0.2138 | 0.2186 |
| 2023 | 144 | `margBy.ed` | 0.2723 | 0.2857 |
| 2023 | 144 | `margBy.nd` | 0.3788 | 0.3899 |
| 2023 | 144 | `margBy.fd` | 0.6108 | 0.6215 |
| 2023 | 144 | `people.0.prov` | 1659.3567 | 1617.3285 |
| 2023 | 144 | `people.0.total` | 6105.3542 | 6063.326 |
| 2023 | 145 | `total` | 8765.1411 | 8400.3009 |
| 2023 | 145 | `prov` | 3283.3287 | 2918.4885 |
| 2023 | 145 | `netTotal` | 1500.7212 | 1135.881 |
| 2023 | 145 | `marg` | 0.4672 | 0.4768 |
| 2023 | 145 | `incomeTax` | 7374.9762 | 7010.136 |
| 2023 | 145 | `gross` | 21348.0961 | 20983.2559 |
| 2023 | 145 | `avg` | 0.0932 | 0.0894 |
| 2023 | 145 | `grossAvg` | 0.2271 | 0.2232 |
| 2023 | 145 | `margBy.ord` | 0.4672 | 0.4768 |
| 2023 | 145 | `margBy.cg` | 0.2063 | 0.2111 |
| 2023 | 145 | `margBy.ed` | 0.2516 | 0.265 |
| 2023 | 145 | `margBy.nd` | 0.3615 | 0.3727 |
| 2023 | 145 | `margBy.fd` | 0.4125 | 0.4222 |
| 2023 | 145 | `people.1.prov` | 3283.3287 | 2918.4885 |
| 2023 | 145 | `people.1.total` | 10729.3262 | 10364.486 |
| 2024 | 4 | `total` | -6200.5764 | -6326.229 |
| 2024 | 4 | `prov` | 125.6526 | 0 |
| 2024 | 4 | `netTotal` | -9517.7974 | -9643.45 |
| 2024 | 4 | `marg` | 0.1759 | 0.0761 |
| 2024 | 4 | `incomeTax` | 125.6526 | 0 |
| 2024 | 4 | `gross` | 5365.4236 | 5239.771 |
| 2024 | 4 | `avg` | -0.2214 | -0.2259 |
| 2024 | 4 | `grossAvg` | 0.1916 | 0.1871 |
| 2024 | 4 | `margBy.ord` | 0.1759 | 0.0761 |
| 2024 | 4 | `margBy.cg` | 0.054 | 0 |
| 2024 | 4 | `margBy.ed` | 0.0386 | 0 |
| 2024 | 4 | `margBy.nd` | 0.1152 | 0 |
| 2024 | 4 | `margBy.fd` | 0.2531 | 0.15 |
| 2024 | 4 | `people.0.prov` | 125.6526 | 0 |
| 2024 | 4 | `people.0.total` | 2048.2026 | 1922.55 |
| 2024 | 5 | `total` | -6540.814 | -6697.8298 |
| 2024 | 5 | `prov` | 325.215 | 168.1992 |
| 2024 | 5 | `netTotal` | -9858.035 | -10015.0508 |
| 2024 | 5 | `marg` | 0.1774 | 0.187 |
| 2024 | 5 | `incomeTax` | 325.215 | 168.1992 |
| 2024 | 5 | `gross` | 5717.186 | 5560.1702 |
| 2024 | 5 | `avg` | -0.218 | -0.2233 |
| 2024 | 5 | `grossAvg` | 0.1906 | 0.1853 |
| 2024 | 5 | `margBy.ord` | 0.1774 | 0.187 |
| 2024 | 5 | `margBy.cg` | 0.054 | 0.0589 |
| 2024 | 5 | `margBy.ed` | 0.0986 | 0.1121 |
| 2024 | 5 | `margBy.nd` | 0.1407 | 0.1519 |
| 2024 | 5 | `margBy.fd` | 0.2497 | 0.2647 |
| 2024 | 5 | `people.0.prov` | 325.215 | 168.1992 |
| 2024 | 5 | `people.0.total` | 2399.965 | 2242.9492 |
| 2024 | 6 | `total` | -35383.0435 | -36881.7973 |
| 2024 | 6 | `prov` | 1821.933 | 323.1792 |
| 2024 | 6 | `netTotal` | -38700.2645 | -40199.0183 |
| 2024 | 6 | `marg` | 0.7402 | 0.7498 |
| 2024 | 6 | `incomeTax` | 3163.0455 | 1664.2917 |
| 2024 | 6 | `gross` | 9696.5165 | 8197.7627 |
| 2024 | 6 | `avg` | -0.7863 | -0.8196 |
| 2024 | 6 | `grossAvg` | 0.2155 | 0.1822 |
| 2024 | 6 | `margBy.ord` | 0.7402 | 0.7498 |
| 2024 | 6 | `margBy.cg` | 0.344 | 0.3489 |
| 2024 | 6 | `margBy.ed` | 0.6318 | 0.6452 |
| 2024 | 6 | `margBy.nd` | 0.6783 | 0.6895 |
| 2024 | 6 | `margBy.fd` | 0.7666 | 0.8099 |
| 2024 | 6 | `people.0.prov` | 1821.933 | 323.1792 |
| 2024 | 6 | `people.0.total` | 6379.2955 | 4880.5417 |
| 2024 | 7 | `total` | -17577.128 | -18931.5398 |
| 2024 | 7 | `prov` | 3561.1335 | 2206.7217 |
| 2024 | 7 | `netTotal` | -20894.349 | -22248.7608 |
| 2024 | 7 | `marg` | 0.6654 | 0.675 |
| 2024 | 7 | `incomeTax` | 7177.261 | 5822.8492 |
| 2024 | 7 | `gross` | 14852.232 | 13497.8202 |
| 2024 | 7 | `avg` | -0.293 | -0.3155 |
| 2024 | 7 | `grossAvg` | 0.2475 | 0.225 |
| 2024 | 7 | `margBy.ord` | 0.6654 | 0.675 |
| 2024 | 7 | `margBy.cg` | 0.3063 | 0.3111 |
| 2024 | 7 | `margBy.ed` | 0.5276 | 0.541 |
| 2024 | 7 | `margBy.nd` | 0.5915 | 0.6027 |
| 2024 | 7 | `margBy.fd` | 0.6414 | 0.6738 |
| 2024 | 7 | `people.0.prov` | 3561.1335 | 2206.7217 |
| 2024 | 7 | `people.0.total` | 11535.011 | 10180.5992 |
| 2024 | 8 | `total` | 41888.8741 | 41792.2767 |
| 2024 | 8 | `prov` | 12748.2401 | 12651.6427 |
| 2024 | 8 | `netTotal` | 34971.6531 | 34875.0557 |
| 2024 | 8 | `marg` | 0.3895 | 0.3992 |
| 2024 | 8 | `incomeTax` | 30587.9041 | 30491.3067 |
| 2024 | 8 | `gross` | 47714.3651 | 47617.7677 |
| 2024 | 8 | `avg` | 0.2793 | 0.2786 |
| 2024 | 8 | `grossAvg` | 0.3181 | 0.3175 |
| 2024 | 8 | `margBy.ord` | 0.3895 | 0.3992 |
| 2024 | 8 | `margBy.cg` | 0.1947 | 0.1996 |
| 2024 | 8 | `margBy.ed` | 0.2198 | 0.2333 |
| 2024 | 8 | `margBy.nd` | 0.3351 | 0.3462 |
| 2024 | 8 | `margBy.fd` | 0.3895 | 0.3992 |
| 2024 | 8 | `people.0.prov` | 6374.12 | 6277.5227 |
| 2024 | 8 | `people.0.total` | 20398.572 | 20301.9747 |
| 2024 | 10 | `total` | -7195.8935 | -7676.2073 |
| 2024 | 10 | `prov` | 1810.593 | 1330.2792 |
| 2024 | 10 | `netTotal` | -10513.1145 | -10993.4283 |
| 2024 | 10 | `marg` | 0.6461 | 0.6557 |
| 2024 | 10 | `incomeTax` | 3256.1055 | 2775.7917 |
| 2024 | 10 | `gross` | 9581.3265 | 9101.0127 |
| 2024 | 10 | `avg` | -0.1599 | -0.1706 |
| 2024 | 10 | `grossAvg` | 0.2129 | 0.2022 |
| 2024 | 10 | `margBy.ord` | 0.6461 | 0.6557 |
| 2024 | 10 | `margBy.cg` | 0.2965 | 0.3014 |
| 2024 | 10 | `margBy.ed` | 0.5007 | 0.5141 |
| 2024 | 10 | `margBy.nd` | 0.5691 | 0.5803 |
| 2024 | 10 | `margBy.fd` | 0.6487 | 0.6722 |
| 2024 | 10 | `people.0.prov` | 1810.593 | 1330.2792 |
| 2024 | 10 | `people.0.total` | 5711.3555 | 5231.0417 |
| 2024 | 11 | `total` | 24479.1991 | 24299.7657 |
| 2024 | 11 | `prov` | 12016.181 | 11836.7477 |
| 2024 | 11 | `netTotal` | 21161.978 | 20982.5447 |
| 2024 | 11 | `marg` | 0.514 | 0.5237 |
| 2024 | 11 | `incomeTax` | 28213.858 | 28034.4247 |
| 2024 | 11 | `gross` | 36635.6991 | 36456.2657 |
| 2024 | 11 | `avg` | 0.204 | 0.2025 |
| 2024 | 11 | `grossAvg` | 0.3053 | 0.3038 |
| 2024 | 11 | `margBy.ord` | 0.514 | 0.5237 |
| 2024 | 11 | `margBy.cg` | 0.257 | 0.2619 |
| 2024 | 11 | `margBy.ed` | 0.3916 | 0.4051 |
| 2024 | 11 | `margBy.nd` | 0.4782 | 0.4894 |
| 2024 | 11 | `margBy.fd` | 0.514 | 0.5237 |
| 2024 | 11 | `people.0.prov` | 12016.181 | 11836.7477 |
| 2024 | 11 | `people.0.total` | 33318.478 | 33139.0447 |
| 2024 | 23 | `total` | -7422.814 | -7748.029 |
| 2024 | 23 | `prov` | 325.215 | 0 |
| 2024 | 23 | `netTotal` | -10740.035 | -11065.25 |
| 2024 | 23 | `marg` | 0.1759 | 0.0761 |
| 2024 | 23 | `incomeTax` | 325.215 | 0 |
| 2024 | 23 | `gross` | 5717.186 | 5391.971 |
| 2024 | 23 | `avg` | -0.2474 | -0.2583 |
| 2024 | 23 | `grossAvg` | 0.1906 | 0.1797 |
| 2024 | 23 | `margBy.ord` | 0.1759 | 0.0761 |
| 2024 | 23 | `margBy.cg` | 0.054 | 0 |
| 2024 | 23 | `margBy.ed` | 0.0386 | 0 |
| 2024 | 23 | `margBy.nd` | 0.1152 | 0 |
| 2024 | 23 | `margBy.fd` | 0.2467 | 0.15 |
| 2024 | 23 | `people.0.prov` | 325.215 | 0 |
| 2024 | 23 | `people.0.total` | 2399.965 | 2074.75 |
| 2024 | 26 | `total` | 1726.0159 | 1715.0377 |
| 2024 | 26 | `prov` | 513.4374 | 502.4592 |
| 2024 | 26 | `netTotal` | -727.2051 | -738.1833 |
| 2024 | 26 | `marg` | 0.3145 | 0.3241 |
| 2024 | 26 | `incomeTax` | 1022.8449 | 1011.8667 |
| 2024 | 26 | `gross` | 4942.0159 | 4931.0377 |
| 2024 | 26 | `avg` | 0.0785 | 0.078 |
| 2024 | 26 | `grossAvg` | 0.2246 | 0.2241 |
| 2024 | 26 | `margBy.ord` | 0.3145 | 0.3241 |
| 2024 | 26 | `margBy.cg` | 0.129 | 0.1339 |
| 2024 | 26 | `margBy.ed` | 0.0384 | 0.0518 |
| 2024 | 26 | `margBy.nd` | 0.1838 | 0.195 |
| 2024 | 26 | `margBy.fd` | 0.3601 | 0.3703 |
| 2024 | 26 | `people.0.prov` | 513.4374 | 502.4592 |
| 2024 | 26 | `people.0.total` | 2488.7949 | 2477.8167 |
| 2024 | 36 | `total` | -26880.3466 | -27863.1088 |
| 2024 | 36 | `prov` | 1042.4834 | 59.7212 |
| 2024 | 36 | `netTotal` | -29952.7766 | -30935.5388 |
| 2024 | 36 | `marg` | 0.5521 | 0.5617 |
| 2024 | 36 | `invTax` | 2047.7734 | 1065.0112 |
| 2024 | 36 | `incomeTax` | 1042.4834 | 59.7212 |
| 2024 | 36 | `gross` | 5580.8634 | 4598.1012 |
| 2024 | 36 | `avg` | -0.7074 | -0.7332 |
| 2024 | 36 | `grossAvg` | 0.1469 | 0.121 |
| 2024 | 36 | `margBy.ord` | 0.5521 | 0.5617 |
| 2024 | 36 | `margBy.cg` | 0.244 | 0.2489 |
| 2024 | 36 | `margBy.ed` | 0.563 | 0.5765 |
| 2024 | 36 | `margBy.nd` | 0.5522 | 0.5634 |
| 2024 | 36 | `margBy.fd` | 0.488 | 0.4977 |
| 2024 | 36 | `people.0.prov` | 1042.4834 | 59.7212 |
| 2024 | 36 | `people.0.total` | 2508.4334 | 1525.6712 |
| 2024 | 37 | `total` | -10636.385 | -11647.0706 |
| 2024 | 37 | `prov` | 2957.904 | 1947.2184 |
| 2024 | 37 | `netTotal` | -14443.356 | -15454.0416 |
| 2024 | 37 | `marg` | 0.5917 | 0.6013 |
| 2024 | 37 | `incomeTax` | 6658.704 | 5648.0184 |
| 2024 | 37 | `gross` | 16517.675 | 15506.9894 |
| 2024 | 37 | `avg` | -0.1251 | -0.137 |
| 2024 | 37 | `grossAvg` | 0.1943 | 0.1824 |
| 2024 | 37 | `margBy.ord` | 0.5917 | 0.6013 |
| 2024 | 37 | `margBy.cg` | 0.269 | 0.2739 |
| 2024 | 37 | `margBy.ed` | 0.4248 | 0.4382 |
| 2024 | 37 | `margBy.nd` | 0.5058 | 0.517 |
| 2024 | 37 | `margBy.fd` | 0.6508 | 0.6847 |
| 2024 | 37 | `people.0.prov` | 489.9366 | 487.1232 |
| 2024 | 37 | `people.0.total` | 3650.2541 | 3647.4407 |
| 2024 | 37 | `people.1.prov` | 2467.9674 | 1460.0952 |
| 2024 | 37 | `people.1.total` | 9060.4499 | 8052.5777 |
| 2024 | 39 | `invTax` | 56284.5631 | 57110.2069 |
| 2024 | 40 | `total` | -32120.224 | -33522.7498 |
| 2024 | 40 | `prov` | 2965.7025 | 1563.1767 |
| 2024 | 40 | `netTotal` | -33853.445 | -35255.9708 |
| 2024 | 40 | `marg` | 0.611 | 0.6206 |
| 2024 | 40 | `incomeTax` | 5692.665 | 4290.1392 |
| 2024 | 40 | `gross` | 11403.136 | 10000.6102 |
| 2024 | 40 | `avg` | -0.584 | -0.6095 |
| 2024 | 40 | `grossAvg` | 0.2073 | 0.1818 |
| 2024 | 40 | `margBy.ord` | 0.611 | 0.6206 |
| 2024 | 40 | `margBy.cg` | 0.2788 | 0.2836 |
| 2024 | 40 | `margBy.ed` | 0.4517 | 0.4651 |
| 2024 | 40 | `margBy.nd` | 0.5283 | 0.5394 |
| 2024 | 40 | `margBy.fd` | 0.6027 | 0.6381 |
| 2024 | 40 | `people.0.prov` | 2965.7025 | 1563.1767 |
| 2024 | 40 | `people.0.total` | 9669.915 | 8267.3892 |
| 2024 | 49 | `total` | -2629.1655 | -2936.9925 |
| 2024 | 49 | `prov` | 4269.6504 | 3961.8234 |
| 2024 | 49 | `netTotal` | -8581.5955 | -8889.4225 |
| 2024 | 49 | `marg` | 0.5763 | 0.5859 |
| 2024 | 49 | `invTax` | 13313.4545 | 13005.6275 |
| 2024 | 49 | `incomeTax` | 5927.5845 | 5619.7575 |
| 2024 | 49 | `gross` | 13345.9645 | 13038.1375 |
| 2024 | 49 | `avg` | -0.0381 | -0.0426 |
| 2024 | 49 | `grossAvg` | 0.1934 | 0.189 |
| 2024 | 49 | `margBy.ord` | 0.5763 | 0.5859 |
| 2024 | 49 | `margBy.cg` | 0.2613 | 0.2661 |
| 2024 | 49 | `margBy.ed` | 0.4034 | 0.4168 |
| 2024 | 49 | `margBy.nd` | 0.488 | 0.4992 |
| 2024 | 49 | `margBy.fd` | 0.5225 | 0.5322 |
| 2024 | 49 | `people.0.prov` | 4269.6504 | 3961.8234 |
| 2024 | 49 | `people.0.total` | 7393.5345 | 7085.7075 |
| 2024 | 55 | `total` | 28813.4727 | 28697.8025 |
| 2024 | 55 | `prov` | 11832.821 | 11717.1509 |
| 2024 | 55 | `netTotal` | 16288.5767 | 16172.9065 |
| 2024 | 55 | `marg` | 0.529 | 0.5387 |
| 2024 | 55 | `invTax` | 15920.2891 | 16324.2523 |
| 2024 | 55 | `incomeTax` | 27248.8192 | 27133.149 |
| 2024 | 55 | `gross` | 44878.3352 | 44762.665 |
| 2024 | 55 | `avg` | 0.196 | 0.1952 |
| 2024 | 55 | `grossAvg` | 0.3053 | 0.3045 |
| 2024 | 55 | `margBy.ord` | 0.529 | 0.5387 |
| 2024 | 55 | `margBy.cg` | 0.2645 | 0.2694 |
| 2024 | 55 | `margBy.ed` | 0.4123 | 0.4258 |
| 2024 | 55 | `margBy.nd` | 0.4955 | 0.5067 |
| 2024 | 55 | `margBy.fd` | 0.529 | 0.5387 |
| 2024 | 55 | `people.0.prov` | 11832.821 | 11717.1509 |
| 2024 | 55 | `people.0.total` | 32353.4392 | 32237.769 |
| 2024 | 60 | `total` | -1598.6736 | -1984.779 |
| 2024 | 60 | `prov` | 386.1054 | 0 |
| 2024 | 60 | `netTotal` | -10675.8946 | -11062 |
| 2024 | 60 | `marg` | 0.183 | 0.0761 |
| 2024 | 60 | `incomeTax` | 386.1054 | 0 |
| 2024 | 60 | `gross` | 11329.8264 | 10943.721 |
| 2024 | 60 | `avg` | -0.0533 | -0.0662 |
| 2024 | 60 | `grossAvg` | 0.3777 | 0.3648 |
| 2024 | 60 | `margBy.ord` | 0.183 | 0.0761 |
| 2024 | 60 | `margBy.cg` | 0.054 | 0 |
| 2024 | 60 | `margBy.ed` | 0.149 | 0 |
| 2024 | 60 | `margBy.nd` | 0.1242 | 0 |
| 2024 | 60 | `margBy.fd` | 0.258 | 0.15 |
| 2024 | 60 | `people.0.prov` | 386.1054 | 0 |
| 2024 | 60 | `people.0.total` | 1852.0554 | 1465.95 |
| 2024 | 61 | `total` | 11533.243 | 11147.4616 |
| 2024 | 61 | `prov` | 4522.4285 | 4136.6471 |
| 2024 | 61 | `netTotal` | 2700.813 | 2315.0316 |
| 2024 | 61 | `marg` | 0.5096 | 0.5192 |
| 2024 | 61 | `incomeTax` | 9694.788 | 9309.0066 |
| 2024 | 61 | `gross` | 23414.088 | 23028.3066 |
| 2024 | 61 | `avg` | 0.1696 | 0.1639 |
| 2024 | 61 | `grossAvg` | 0.3443 | 0.3387 |
| 2024 | 61 | `margBy.ord` | 0.5096 | 0.5192 |
| 2024 | 61 | `margBy.cg` | 0.2338 | 0.2386 |
| 2024 | 61 | `margBy.ed` | 0.3275 | 0.3409 |
| 2024 | 61 | `margBy.nd` | 0.4248 | 0.4359 |
| 2024 | 61 | `margBy.fd` | 0.4733 | 0.4887 |
| 2024 | 61 | `people.0.prov` | 4522.4285 | 4136.6471 |
| 2024 | 61 | `people.0.total` | 14581.658 | 14195.8766 |
| 2024 | 63 | `total` | -3123.5262 | -3337.188 |
| 2024 | 63 | `prov` | 2965.7025 | 2752.0407 |
| 2024 | 63 | `netTotal` | -5549.83 | -5763.4918 |
| 2024 | 63 | `marg` | 0.5169 | 0.5265 |
| 2024 | 63 | `incomeTax` | 5692.665 | 5479.0032 |
| 2024 | 63 | `gross` | 12096.2188 | 11882.557 |
| 2024 | 63 | `avg` | -0.0568 | -0.0607 |
| 2024 | 63 | `grossAvg` | 0.2199 | 0.216 |
| 2024 | 63 | `margBy.ord` | 0.5169 | 0.5265 |
| 2024 | 63 | `margBy.cg` | 0.2313 | 0.2361 |
| 2024 | 63 | `margBy.ed` | 0.3206 | 0.334 |
| 2024 | 63 | `margBy.nd` | 0.419 | 0.4302 |
| 2024 | 63 | `margBy.fd` | 0.4625 | 0.4722 |
| 2024 | 63 | `people.0.prov` | 2965.7025 | 2752.0407 |
| 2024 | 63 | `people.0.total` | 9669.915 | 9456.2532 |
| 2024 | 64 | `total` | 579.278 | -103.7194 |
| 2024 | 64 | `prov` | 4522.4285 | 3839.4311 |
| 2024 | 64 | `netTotal` | -8253.152 | -8936.1494 |
| 2024 | 64 | `marg` | 0.6036 | 0.6132 |
| 2024 | 64 | `incomeTax` | 9694.788 | 9011.7906 |
| 2024 | 64 | `gross` | 23414.088 | 22731.0906 |
| 2024 | 64 | `avg` | 0.0085 | -0.0015 |
| 2024 | 64 | `grossAvg` | 0.3443 | 0.3343 |
| 2024 | 64 | `margBy.ord` | 0.6036 | 0.6132 |
| 2024 | 64 | `margBy.cg` | 0.2813 | 0.2861 |
| 2024 | 64 | `margBy.ed` | 0.4586 | 0.472 |
| 2024 | 64 | `margBy.nd` | 0.534 | 0.5452 |
| 2024 | 64 | `margBy.fd` | 0.6683 | 0.6881 |
| 2024 | 64 | `people.0.prov` | 4522.4285 | 3839.4311 |
| 2024 | 64 | `people.0.total` | 14581.658 | 13898.6606 |
| 2024 | 65 | `total` | 15621.5711 | 15247.7377 |
| 2024 | 65 | `prov` | 8575.148 | 8201.3147 |
| 2024 | 65 | `netTotal` | 12304.35 | 11930.5167 |
| 2024 | 65 | `marg` | 0.4125 | 0.4222 |
| 2024 | 65 | `incomeTax` | 20264.23 | 19890.3967 |
| 2024 | 65 | `gross` | 28686.0711 | 28312.2377 |
| 2024 | 65 | `avg` | 0.1562 | 0.1525 |
| 2024 | 65 | `grossAvg` | 0.2869 | 0.2831 |
| 2024 | 65 | `margBy.ord` | 0.4125 | 0.4222 |
| 2024 | 65 | `margBy.cg` | 0.2063 | 0.2111 |
| 2024 | 65 | `margBy.ed` | 0.2516 | 0.265 |
| 2024 | 65 | `margBy.nd` | 0.3615 | 0.3727 |
| 2024 | 65 | `margBy.fd` | 0.4125 | 0.4222 |
| 2024 | 65 | `people.0.prov` | 8575.148 | 8201.3147 |
| 2024 | 65 | `people.0.total` | 25368.85 | 24995.0167 |
| 2024 | 66 | `total` | -5250.92 | -5867.7533 |
| 2024 | 66 | `prov` | 5387.648 | 4770.8147 |
| 2024 | 66 | `netTotal` | -6739.35 | -7356.1833 |
| 2024 | 66 | `marg` | 0.5625 | 0.5722 |
| 2024 | 66 | `incomeTax` | 11951.73 | 11334.8967 |
| 2024 | 66 | `gross` | 18544.78 | 17927.9467 |
| 2024 | 66 | `avg` | -0.07 | -0.0782 |
| 2024 | 66 | `grossAvg` | 0.2473 | 0.239 |
| 2024 | 66 | `margBy.ord` | 0.5625 | 0.5722 |
| 2024 | 66 | `margBy.cg` | 0.2813 | 0.2861 |
| 2024 | 66 | `margBy.ed` | 0.4586 | 0.472 |
| 2024 | 66 | `margBy.nd` | 0.534 | 0.5452 |
| 2024 | 66 | `margBy.fd` | 0.5625 | 0.5722 |
| 2024 | 66 | `people.0.prov` | 5387.648 | 4770.8147 |
| 2024 | 66 | `people.0.total` | 17056.35 | 16439.5167 |
| 2024 | 69 | `total` | 29961.8265 | 29270.7972 |
| 2024 | 69 | `prov` | 7685.807 | 6994.7777 |
| 2024 | 69 | `netTotal` | 10058.0465 | 9367.0172 |
| 2024 | 69 | `marg` | 0.4275 | 0.4372 |
| 2024 | 69 | `incomeTax` | 18223.7265 | 17532.6972 |
| 2024 | 69 | `gross` | 45306.8765 | 44615.8472 |
| 2024 | 69 | `avg` | 0.2854 | 0.2788 |
| 2024 | 69 | `grossAvg` | 0.4315 | 0.4249 |
| 2024 | 69 | `margBy.ord` | 0.4275 | 0.4372 |
| 2024 | 69 | `margBy.cg` | 0.2138 | 0.2186 |
| 2024 | 69 | `margBy.ed` | 0.2723 | 0.2857 |
| 2024 | 69 | `margBy.nd` | 0.3788 | 0.3899 |
| 2024 | 69 | `margBy.fd` | 0.4275 | 0.4372 |
| 2024 | 69 | `people.0.prov` | 6374.12 | 5683.0907 |
| 2024 | 69 | `people.0.total` | 20398.572 | 19707.5427 |
| 2024 | 70 | `total` | 1371.7509 | 1006.9107 |
| 2024 | 70 | `prov` | 3007.9674 | 2643.1272 |
| 2024 | 70 | `netTotal` | -1945.4701 | -2310.3103 |
| 2024 | 70 | `incomeTax` | 6858.9999 | 6494.1597 |
| 2024 | 70 | `gross` | 14477.9209 | 14113.0807 |
| 2024 | 70 | `avg` | 0.0221 | 0.0162 |
| 2024 | 70 | `grossAvg` | 0.2335 | 0.2276 |
| 2024 | 70 | `people.0.prov` | 3007.9674 | 2643.1272 |
| 2024 | 70 | `people.0.total` | 10227.4499 | 9862.6097 |
| 2024 | 76 | `invTax` | 32361.6215 | 32746.6868 |
| 2024 | 79 | `total` | -21180.105 | -21505.32 |
| 2024 | 79 | `prov` | 325.215 | 0 |
| 2024 | 79 | `netTotal` | -23100.535 | -23425.75 |
| 2024 | 79 | `marg` | 0.1774 | 0.0776 |
| 2024 | 79 | `incomeTax` | 325.215 | 0 |
| 2024 | 79 | `gross` | 4320.395 | 3995.18 |
| 2024 | 79 | `avg` | -0.706 | -0.7168 |
| 2024 | 79 | `grossAvg` | 0.144 | 0.1332 |
| 2024 | 79 | `margBy.ord` | 0.1774 | 0.0776 |
| 2024 | 79 | `margBy.cg` | 0.054 | 0 |
| 2024 | 79 | `margBy.ed` | 0.0986 | 0.06 |
| 2024 | 79 | `margBy.nd` | 0.1407 | 0.0255 |
| 2024 | 79 | `margBy.fd` | 0.2497 | 0.153 |
| 2024 | 79 | `people.0.prov` | 325.215 | 0 |
| 2024 | 79 | `people.0.total` | 2399.965 | 2074.75 |
| 2024 | 80 | `people.0.pDtc` | 4087.9011 | 2448.1317 |
| 2024 | 83 | `invTax` | 43787.9137 | 43798.8919 |
| 2024 | 89 | `total` | 5033.6511 | 4151.3613 |
| 2024 | 89 | `prov` | 5522.1111 | 4639.8213 |
| 2024 | 89 | `netTotal` | -2873.8489 | -3756.1387 |
| 2024 | 89 | `marg` | 0.4278 | 0.4374 |
| 2024 | 89 | `incomeTax` | 12581.5911 | 11699.3013 |
| 2024 | 89 | `gross` | 27149.8911 | 26267.6013 |
| 2024 | 89 | `avg` | 0.0541 | 0.0446 |
| 2024 | 89 | `grossAvg` | 0.2919 | 0.2824 |
| 2024 | 89 | `margBy.ord` | 0.4278 | 0.4374 |
| 2024 | 89 | `margBy.cg` | 0.1863 | 0.1911 |
| 2024 | 89 | `margBy.ed` | 0.1964 | 0.2098 |
| 2024 | 89 | `margBy.nd` | 0.3155 | 0.3267 |
| 2024 | 89 | `margBy.fd` | 0.3725 | 0.3823 |
| 2024 | 89 | `people.0.prov` | 3952.1745 | 3069.8847 |
| 2024 | 89 | `people.0.total` | 13012.137 | 12129.8472 |
| 2024 | 97 | `total` | 7237.2856 | 7108.6522 |
| 2024 | 97 | `prov` | 583.4646 | 454.8312 |
| 2024 | 97 | `netTotal` | -601.6854 | -730.3188 |
| 2024 | 97 | `marg` | 0.3244 | 0.334 |
| 2024 | 97 | `incomeTax` | 583.4646 | 454.8312 |
| 2024 | 97 | `gross` | 11105.9856 | 10977.3522 |
| 2024 | 97 | `avg` | 0.1905 | 0.1871 |
| 2024 | 97 | `grossAvg` | 0.2923 | 0.2889 |
| 2024 | 97 | `margBy.ord` | 0.3244 | 0.334 |
| 2024 | 97 | `margBy.cg` | 0.129 | 0.1339 |
| 2024 | 97 | `margBy.ed` | 0.2456 | 0.2591 |
| 2024 | 97 | `margBy.nd` | 0.2877 | 0.2989 |
| 2024 | 97 | `margBy.fd` | 0.3899 | 0.4035 |
| 2024 | 97 | `people.0.prov` | 583.4646 | 454.8312 |
| 2024 | 97 | `people.0.total` | 3267.0146 | 3138.3812 |
| 2024 | 98 | `total` | -8613.7635 | -9847.1937 |
| 2024 | 98 | `prov` | 5971.0473 | 4737.6171 |
| 2024 | 98 | `netTotal` | -12912.0673 | -14145.4975 |
| 2024 | 98 | `marg` | 0.4823 | 0.4919 |
| 2024 | 98 | `invTax` | 11592.9479 | 11924.2001 |
| 2024 | 98 | `incomeTax` | 12119.1977 | 10885.7675 |
| 2024 | 98 | `gross` | 21251.9015 | 20018.4713 |
| 2024 | 98 | `avg` | -0.0756 | -0.0864 |
| 2024 | 98 | `grossAvg` | 0.1864 | 0.1756 |
| 2024 | 98 | `margBy.ord` | 0.4823 | 0.4919 |
| 2024 | 98 | `margBy.cg` | 0.2138 | 0.2186 |
| 2024 | 98 | `margBy.ed` | 0.2723 | 0.2857 |
| 2024 | 98 | `margBy.nd` | 0.3788 | 0.3899 |
| 2024 | 98 | `margBy.fd` | 0.5126 | 0.5378 |
| 2024 | 98 | `people.0.prov` | 2963.0799 | 1729.6497 |
| 2024 | 98 | `people.0.total` | 6603.1478 | 5369.7176 |
| 2024 | 99 | `total` | -34783.605 | -35108.82 |
| 2024 | 99 | `prov` | 325.215 | 0 |
| 2024 | 99 | `netTotal` | -41888.035 | -42213.25 |
| 2024 | 99 | `marg` | 0.1759 | 0.0761 |
| 2024 | 99 | `incomeTax` | 325.215 | 0 |
| 2024 | 99 | `gross` | 9504.395 | 9179.18 |
| 2024 | 99 | `avg` | -1.1595 | -1.1703 |
| 2024 | 99 | `grossAvg` | 0.3168 | 0.306 |
| 2024 | 99 | `margBy.ord` | 0.1759 | 0.0761 |
| 2024 | 99 | `margBy.cg` | 0.054 | 0 |
| 2024 | 99 | `margBy.ed` | 0.0386 | 0 |
| 2024 | 99 | `margBy.nd` | 0.1152 | 0 |
| 2024 | 99 | `margBy.fd` | 0.2467 | 0.15 |
| 2024 | 99 | `people.0.prov` | 325.215 | 0 |
| 2024 | 99 | `people.0.total` | 2399.965 | 2074.75 |
| 2024 | 101 | `total` | -3947.559 | -4558.7763 |
| 2024 | 101 | `prov` | 1617.989 | 1006.7717 |
| 2024 | 101 | `netTotal` | -14735.059 | -15346.2763 |
| 2024 | 101 | `marg` | 0.598 | 0.6077 |
| 2024 | 101 | `incomeTax` | 2675.846 | 2064.6287 |
| 2024 | 101 | `gross` | 18567.966 | 17956.7487 |
| 2024 | 101 | `avg` | -0.0526 | -0.0608 |
| 2024 | 101 | `grossAvg` | 0.2476 | 0.2394 |
| 2024 | 101 | `margBy.ord` | 0.598 | 0.6077 |
| 2024 | 101 | `margBy.cg` | 0.299 | 0.3039 |
| 2024 | 101 | `margBy.ed` | 0.5076 | 0.521 |
| 2024 | 101 | `margBy.nd` | 0.5748 | 0.586 |
| 2024 | 101 | `margBy.fd` | 0.687 | 0.7105 |
| 2024 | 101 | `people.0.prov` | 1617.989 | 1006.7717 |
| 2024 | 101 | `people.0.total` | 7780.466 | 7169.2487 |
| 2024 | 103 | `total` | -2006.8591 | -2086.8925 |
| 2024 | 103 | `prov` | 1123.4646 | 1043.4312 |
| 2024 | 103 | `netTotal` | -8116.2329 | -8196.2663 |
| 2024 | 103 | `marg` | 0.5323 | 0.5419 |
| 2024 | 103 | `incomeTax` | 1494.4821 | 1414.4487 |
| 2024 | 103 | `gross` | 10287.4059 | 10207.3725 |
| 2024 | 103 | `avg` | -0.0528 | -0.0549 |
| 2024 | 103 | `grossAvg` | 0.2707 | 0.2686 |
| 2024 | 103 | `margBy.ord` | 0.5323 | 0.5419 |
| 2024 | 103 | `margBy.cg` | 0.239 | 0.2439 |
| 2024 | 103 | `margBy.ed` | 0.342 | 0.3554 |
| 2024 | 103 | `margBy.nd` | 0.4368 | 0.448 |
| 2024 | 103 | `margBy.fd` | 0.6877 | 0.6995 |
| 2024 | 103 | `people.0.prov` | 1123.4646 | 1043.4312 |
| 2024 | 103 | `people.0.total` | 4178.0321 | 4097.9987 |
| 2024 | 107 | `total` | 9985.096 | 9519.6787 |
| 2024 | 107 | `prov` | 3475.148 | 3009.7307 |
| 2024 | 107 | `netTotal` | -13677.225 | -14142.6423 |
| 2024 | 107 | `marg` | 0.5725 | 0.5822 |
| 2024 | 107 | `incomeTax` | 6964.23 | 6498.8127 |
| 2024 | 107 | `gross` | 35731.171 | 35265.7537 |
| 2024 | 107 | `avg` | 0.1331 | 0.1269 |
| 2024 | 107 | `grossAvg` | 0.4764 | 0.4702 |
| 2024 | 107 | `margBy.ord` | 0.5725 | 0.5822 |
| 2024 | 107 | `margBy.cg` | 0.2863 | 0.2911 |
| 2024 | 107 | `margBy.ed` | 0.4724 | 0.4858 |
| 2024 | 107 | `margBy.nd` | 0.5455 | 0.5567 |
| 2024 | 107 | `margBy.fd` | 0.6044 | 0.622 |
| 2024 | 107 | `people.0.prov` | 3475.148 | 3009.7307 |
| 2024 | 107 | `people.0.total` | 12068.85 | 11603.4327 |
| 2024 | 114 | `total` | 9743.6337 | 9670.867 |
| 2024 | 114 | `prov` | 7999.6595 | 7926.8928 |
| 2024 | 114 | `netTotal` | 7823.2037 | 7750.437 |
| 2024 | 114 | `marg` | 0.463 | 0.4723 |
| 2024 | 114 | `invTax` | 21047.0058 | 21562.0993 |
| 2024 | 114 | `incomeTax` | 16888.7137 | 16815.947 |
| 2024 | 114 | `gross` | 22177.5937 | 22104.827 |
| 2024 | 114 | `avg` | 0.0911 | 0.0904 |
| 2024 | 114 | `grossAvg` | 0.2073 | 0.2066 |
| 2024 | 114 | `margBy.ord` | 0.463 | 0.4723 |
| 2024 | 114 | `margBy.cg` | 0.2038 | 0.2085 |
| 2024 | 114 | `margBy.ed` | 0.2543 | 0.2673 |
| 2024 | 114 | `margBy.nd` | 0.3592 | 0.37 |
| 2024 | 114 | `margBy.fd` | 0.4898 | 0.5 |
| 2024 | 114 | `people.0.pFtc` | 249.1459 | 246.8796 |
| 2024 | 114 | `people.0.prov` | 7999.6595 | 7926.8928 |
| 2024 | 114 | `people.0.total` | 20257.1637 | 20184.397 |
| 2024 | 116 | `total` | -16124.9218 | -17765.2312 |
| 2024 | 116 | `prov` | 4219.8732 | 2579.5638 |
| 2024 | 116 | `netTotal` | -22797.3518 | -24437.6612 |
| 2024 | 116 | `marg` | 0.5917 | 0.6013 |
| 2024 | 116 | `incomeTax` | 9673.4082 | 8033.0988 |
| 2024 | 116 | `gross` | 21712.9382 | 20072.6288 |
| 2024 | 116 | `avg` | -0.2122 | -0.2338 |
| 2024 | 116 | `grossAvg` | 0.2857 | 0.2641 |
| 2024 | 116 | `margBy.ord` | 0.5917 | 0.6013 |
| 2024 | 116 | `margBy.cg` | 0.269 | 0.2739 |
| 2024 | 116 | `margBy.ed` | 0.4248 | 0.4382 |
| 2024 | 116 | `margBy.nd` | 0.5058 | 0.517 |
| 2024 | 116 | `margBy.fd` | 0.6592 | 0.7123 |
| 2024 | 116 | `people.0.prov` | 2109.9366 | 469.6272 |
| 2024 | 116 | `people.0.total` | 7520.2541 | 5879.9447 |
| 2024 | 117 | `invTax` | 22214.5592 | 22225.5374 |
| 2024 | 119 | `total` | -21937.105 | -22262.32 |
| 2024 | 119 | `prov` | 325.215 | 0 |
| 2024 | 119 | `netTotal` | -25009.535 | -25334.75 |
| 2024 | 119 | `marg` | 0.1774 | 0.0776 |
| 2024 | 119 | `incomeTax` | 325.215 | 0 |
| 2024 | 119 | `gross` | 5472.395 | 5147.18 |
| 2024 | 119 | `avg` | -0.7312 | -0.7421 |
| 2024 | 119 | `grossAvg` | 0.1824 | 0.1716 |
| 2024 | 119 | `margBy.ord` | 0.1774 | 0.0776 |
| 2024 | 119 | `margBy.cg` | 0.054 | 0 |
| 2024 | 119 | `margBy.ed` | 0.0986 | 0.06 |
| 2024 | 119 | `margBy.nd` | 0.1407 | 0.0255 |
| 2024 | 119 | `margBy.fd` | 0.111 | 0.003 |
| 2024 | 119 | `people.0.prov` | 325.215 | 0 |
| 2024 | 119 | `people.0.total` | 2399.965 | 2074.75 |
| 2024 | 121 | `total` | -21451.5479 | -22423.2293 |
| 2024 | 121 | `prov` | 1123.4646 | 151.7832 |
| 2024 | 121 | `netTotal` | -30283.9779 | -31255.6593 |
| 2024 | 121 | `marg` | 0.6907 | 0.7003 |
| 2024 | 121 | `incomeTax` | 1494.4821 | 522.8007 |
| 2024 | 121 | `gross` | 13010.4621 | 12038.7807 |
| 2024 | 121 | `avg` | -0.5645 | -0.5901 |
| 2024 | 121 | `grossAvg` | 0.3424 | 0.3168 |
| 2024 | 121 | `margBy.ord` | 0.6907 | 0.7003 |
| 2024 | 121 | `margBy.cg` | 0.319 | 0.3239 |
| 2024 | 121 | `margBy.ed` | 0.5628 | 0.5762 |
| 2024 | 121 | `margBy.nd` | 0.6208 | 0.632 |
| 2024 | 121 | `margBy.fd` | 0.7477 | 0.7832 |
| 2024 | 121 | `people.0.prov` | 1123.4646 | 151.7832 |
| 2024 | 121 | `people.0.total` | 4178.0321 | 3206.3507 |
| 2024 | 123 | `total` | 27583.0159 | 26831.4385 |
| 2024 | 123 | `prov` | 3183.665 | 2432.0876 |
| 2024 | 123 | `netTotal` | 261.362 | -490.2154 |
| 2024 | 123 | `incomeTax` | 7198.022 | 6446.4446 |
| 2024 | 123 | `gross` | 41481.2959 | 40729.7185 |
| 2024 | 123 | `avg` | 0.2815 | 0.2738 |
| 2024 | 123 | `grossAvg` | 0.4233 | 0.4156 |
| 2024 | 123 | `people.1.prov` | 1871.978 | 1120.4006 |
| 2024 | 123 | `people.1.total` | 9155.1175 | 8403.5401 |
| 2024 | 124 | `total` | 10817.2124 | 10806.2342 |
| 2024 | 124 | `prov` | 513.4374 | 502.4592 |
| 2024 | 124 | `netTotal` | -2902.8926 | -2913.8708 |
| 2024 | 124 | `marg` | 0.3145 | 0.3241 |
| 2024 | 124 | `incomeTax` | 1022.8449 | 1011.8667 |
| 2024 | 124 | `gross` | 16208.8999 | 16197.9217 |
| 2024 | 124 | `avg` | 0.4917 | 0.4912 |
| 2024 | 124 | `grossAvg` | 0.7368 | 0.7363 |
| 2024 | 124 | `margBy.ord` | 0.3145 | 0.3241 |
| 2024 | 124 | `margBy.cg` | 0.129 | 0.1339 |
| 2024 | 124 | `margBy.ed` | 0.0384 | 0.0518 |
| 2024 | 124 | `margBy.nd` | 0.1838 | 0.195 |
| 2024 | 124 | `margBy.fd` | 0.3601 | 0.3703 |
| 2024 | 124 | `people.0.prov` | 513.4374 | 502.4592 |
| 2024 | 124 | `people.0.total` | 2488.7949 | 2477.8167 |
| 2024 | 126 | `invTax` | 17974.5706 | 18154.004 |
| 2024 | 127 | `total` | 7827.3995 | 7537.7489 |
| 2024 | 127 | `prov` | 4433.8971 | 4144.2465 |
| 2024 | 127 | `netTotal` | 2868.4285 | 2578.7779 |
| 2024 | 127 | `marg` | 0.5763 | 0.5859 |
| 2024 | 127 | `invTax` | 11889.6935 | 12110.9207 |
| 2024 | 127 | `incomeTax` | 12549.0085 | 12259.3579 |
| 2024 | 127 | `gross` | 21485.2295 | 21195.5789 |
| 2024 | 127 | `avg` | 0.1017 | 0.0979 |
| 2024 | 127 | `grossAvg` | 0.279 | 0.2753 |
| 2024 | 127 | `margBy.ord` | 0.5763 | 0.5859 |
| 2024 | 127 | `margBy.cg` | 0.2613 | 0.2661 |
| 2024 | 127 | `margBy.ed` | 0.4034 | 0.4168 |
| 2024 | 127 | `margBy.nd` | 0.488 | 0.4992 |
| 2024 | 127 | `margBy.fd` | 0.5225 | 0.5322 |
| 2024 | 127 | `people.0.prov` | 4433.8971 | 4144.2465 |
| 2024 | 127 | `people.0.total` | 16526.2585 | 16236.6079 |
| 2024 | 128 | `total` | 7649.2792 | 7358.635 |
| 2024 | 128 | `prov` | 2021.4954 | 1730.8512 |
| 2024 | 128 | `netTotal` | -3552.6996 | -3843.3438 |
| 2024 | 128 | `marg` | 0.5818 | 0.5914 |
| 2024 | 128 | `incomeTax` | 3639.7779 | 3349.1337 |
| 2024 | 128 | `gross` | 18210.2067 | 17919.5625 |
| 2024 | 128 | `avg` | 0.1628 | 0.1566 |
| 2024 | 128 | `grossAvg` | 0.3875 | 0.3813 |
| 2024 | 128 | `margBy.ord` | 0.5818 | 0.5914 |
| 2024 | 128 | `margBy.cg` | 0.264 | 0.2689 |
| 2024 | 128 | `margBy.ed` | 0.411 | 0.4244 |
| 2024 | 128 | `margBy.nd` | 0.4943 | 0.5055 |
| 2024 | 128 | `margBy.fd` | 0.6994 | 0.7154 |
| 2024 | 128 | `people.0.prov` | 2021.4954 | 1730.8512 |
| 2024 | 128 | `people.0.total` | 7008.2279 | 6717.5837 |
| 2024 | 133 | `total` | -17781.6452 | -19235.6222 |
| 2024 | 133 | `prov` | 4086.8349 | 2632.8579 |
| 2024 | 133 | `netTotal` | -21071.9491 | -22525.9261 |
| 2024 | 133 | `marg` | 0.6654 | 0.675 |
| 2024 | 133 | `invTax` | 18048.693 | 17855.3514 |
| 2024 | 133 | `incomeTax` | 8939.5109 | 7485.5339 |
| 2024 | 133 | `gross` | 15998.8148 | 14544.8378 |
| 2024 | 133 | `avg` | -0.2044 | -0.2211 |
| 2024 | 133 | `grossAvg` | 0.1839 | 0.1672 |
| 2024 | 133 | `margBy.ord` | 0.6654 | 0.675 |
| 2024 | 133 | `margBy.cg` | 0.3063 | 0.3111 |
| 2024 | 133 | `margBy.ed` | 0.5276 | 0.541 |
| 2024 | 133 | `margBy.nd` | 0.5915 | 0.6027 |
| 2024 | 133 | `margBy.fd` | 0.6125 | 0.6222 |
| 2024 | 133 | `people.1.prov` | 4086.8349 | 2632.8579 |
| 2024 | 133 | `people.1.total` | 12307.9609 | 10853.9839 |
| 2024 | 134 | `invTax` | 5621.1671 | 5632.1453 |
| 2024 | 136 | `total` | -9500.595 | -10614.6603 |
| 2024 | 136 | `prov` | 6662.648 | 5548.5827 |
| 2024 | 136 | `netTotal` | -14013.025 | -15127.0903 |
| 2024 | 136 | `marg` | 0.4275 | 0.4372 |
| 2024 | 136 | `incomeTax` | 15276.73 | 14162.6647 |
| 2024 | 136 | `gross` | 24893.78 | 23779.7147 |
| 2024 | 136 | `avg` | -0.1118 | -0.1249 |
| 2024 | 136 | `grossAvg` | 0.2929 | 0.2798 |
| 2024 | 136 | `margBy.ord` | 0.4275 | 0.4372 |
| 2024 | 136 | `margBy.cg` | 0.2138 | 0.2186 |
| 2024 | 136 | `margBy.ed` | 0.2723 | 0.2857 |
| 2024 | 136 | `margBy.nd` | 0.3788 | 0.3899 |
| 2024 | 136 | `margBy.fd` | 0.4275 | 0.4372 |
| 2024 | 136 | `people.0.prov` | 6662.648 | 5548.5827 |
| 2024 | 136 | `people.0.total` | 20381.35 | 19267.2847 |
| 2024 | 141 | `total` | 5115.1525 | 4604.2747 |
| 2024 | 141 | `prov` | 2965.7025 | 2454.8247 |
| 2024 | 141 | `netTotal` | -11196.9525 | -11707.8303 |
| 2024 | 141 | `marg` | 0.5714 | 0.581 |
| 2024 | 141 | `incomeTax` | 5692.665 | 5181.7872 |
| 2024 | 141 | `gross` | 25982.02 | 25471.1422 |
| 2024 | 141 | `avg` | 0.093 | 0.0837 |
| 2024 | 141 | `grossAvg` | 0.4724 | 0.4631 |
| 2024 | 141 | `margBy.ord` | 0.5714 | 0.581 |
| 2024 | 141 | `margBy.cg` | 0.2588 | 0.2636 |
| 2024 | 141 | `margBy.ed` | 0.3965 | 0.4099 |
| 2024 | 141 | `margBy.nd` | 0.4823 | 0.4934 |
| 2024 | 141 | `margBy.fd` | 0.5627 | 0.5818 |
| 2024 | 141 | `people.0.prov` | 2965.7025 | 2454.8247 |
| 2024 | 141 | `people.0.total` | 9669.915 | 9159.0372 |
| 2024 | 143 | `total` | 3199.9289 | 3094.2023 |
| 2024 | 143 | `prov` | 2592.249 | 2486.5224 |
| 2024 | 143 | `netTotal` | -90.375 | -196.1016 |
| 2024 | 143 | `invTax` | 10438.925 | 10333.1984 |
| 2024 | 143 | `incomeTax` | 5881.015 | 5775.2884 |
| 2024 | 143 | `gross` | 11570.5189 | 11464.7923 |
| 2024 | 143 | `avg` | 0.036 | 0.0348 |
| 2024 | 143 | `grossAvg` | 0.13 | 0.1288 |
| 2024 | 143 | `people.1.prov` | 2592.249 | 2486.5224 |
| 2024 | 143 | `people.1.total` | 6814.265 | 6708.5384 |
| 2024 | 144 | `total` | 18816.0329 | 18774.0047 |
| 2024 | 144 | `prov` | 1481.4954 | 1439.4672 |
| 2024 | 144 | `netTotal` | -1865.3471 | -1907.3753 |
| 2024 | 144 | `marg` | 0.463 | 0.4726 |
| 2024 | 144 | `incomeTax` | 2349.7779 | 2307.7497 |
| 2024 | 144 | `gross` | 26399.6079 | 26357.5797 |
| 2024 | 144 | `avg` | 0.4003 | 0.3994 |
| 2024 | 144 | `grossAvg` | 0.5617 | 0.5608 |
| 2024 | 144 | `margBy.ord` | 0.463 | 0.4726 |
| 2024 | 144 | `margBy.cg` | 0.204 | 0.2089 |
| 2024 | 144 | `margBy.ed` | 0.2454 | 0.2588 |
| 2024 | 144 | `margBy.nd` | 0.3563 | 0.3675 |
| 2024 | 144 | `margBy.fd` | 0.601 | 0.6117 |
| 2024 | 144 | `people.0.prov` | 1481.4954 | 1439.4672 |
| 2024 | 144 | `people.0.total` | 5718.2279 | 5676.1997 |
| 2024 | 145 | `total` | 7164.5009 | 6799.6607 |
| 2024 | 145 | `prov` | 3007.9674 | 2643.1272 |
| 2024 | 145 | `netTotal` | -184.7201 | -549.5603 |
| 2024 | 145 | `marg` | 0.6461 | 0.6557 |
| 2024 | 145 | `incomeTax` | 6981.9999 | 6617.1597 |
| 2024 | 145 | `gross` | 21068.1209 | 20703.2807 |
| 2024 | 145 | `avg` | 0.0762 | 0.0723 |
| 2024 | 145 | `grossAvg` | 0.2241 | 0.2202 |
| 2024 | 145 | `margBy.ord` | 0.6461 | 0.6557 |
| 2024 | 145 | `margBy.cg` | 0.2965 | 0.3014 |
| 2024 | 145 | `margBy.ed` | 0.5007 | 0.5141 |
| 2024 | 145 | `margBy.nd` | 0.5691 | 0.5803 |
| 2024 | 145 | `margBy.fd` | 0.593 | 0.6027 |
| 2024 | 145 | `people.1.prov` | 3007.9674 | 2643.1272 |
| 2024 | 145 | `people.1.total` | 10350.4499 | 9985.6097 |

## Year-diff output

Full adjacent-year reports follow. Existing unrelated warnings remain visible for review.
The six newly installed programs have unchanged published amounts and are marked `not indexed`.
The 2025 report checks the 2024/2025 boundary without editing 2025 data.

```text
> tax-visualizer@0.1.0 year-diff
> node --import tsx scripts/year-diff.ts 2020 2019

## Data diff: 2020 against 2019

253 values changed from 2019 to 2020 (44 over 15%), 138 amounts suspiciously unchanged, 6 added, 6 removed, 8 replaced. 4 unchanged values opted out.

### Suspiciously unchanged (138)

Amounts, thresholds and bracket limits that are the same in both years. If one is meant to stay put, say so with a `# not indexed` comment on its line (or `bracketsFrozenSince` for bracket limits).

| File | In | Unchanged values |
|---|---|---|
| federal | `payroll.cpp` | `exempt` 3500 |
| federal | `payroll.qpp` | `exempt` 3500 |
| federal | `workersBenefit.standard` | `floor[0]` 3000, `floor[1]` 3000 |
| federal | `workersBenefit.regional.AB` | `floor[0]` 2760, `floor[1]` 2760 |
| federal | `workersBenefit.regional.NU` | `floor[0]` 6000, `floor[1]` 6000 |
| federal | `workersBenefit.quebec` | `single[1]` 2400, `couple[1]` 3600, `parent[1]` 2400, `coupleKids[1]` 3600 |
| federal | `driving` | `efficiency` 9 |
| AB | `brackets` | `[0].limit` 131220, `[1].limit` 157464, `[2].limit` 209952, `[3].limit` 314928 |
| AB |  | `basicPersonalAmount` 19369 |
| AB | `spouseAmount` | `max` 19369 |
| AB | `driving` | `distance` 16100 |
| BC | `driving` | `distance` 12900 |
| MB | `spouseAmount` | `max` 9134 |
| MB | `credits[mb-school-tax-credits-rent-share].params` | `educationCreditMax` 700, `renterMax` 700 |
| MB | `driving` | `distance` 15000 |
| NB | `childBenefit.params` | `perChild` 250, `threshold` 20000 |
| NB | `childBenefit.params.workingIncomeSupplement` | `floor` 3750, `max` 250, `threshold` 20921 |
| NB | `credits[nb-hst-credit].params` | `adult` 300, `spouse` 300, `child` 100, `threshold` 35000 |
| NB | `driving` | `distance` 16100 |
| NL | `childBenefit.params` | `threshold` 17397 |
| NL | `credits[nl-income-supplement].params` | `base` 220, `extraMax` 230, `extraFrom` 15000, `couple` 60, `child` 200, `threshold` 40000 |
| NL | `driving` | `distance` 15100 |
| NS | `brackets` | `[0].limit` 29590, `[1].limit` 59180, `[2].limit` 93000, `[3].limit` 150000 |
| NS | `basicPersonalAmount` | `max` 11481, `min` 8481, `from` 25000, `to` 75000 |
| NS | `spouseAmount.params` | `max` 8481, `threshold` 848 |
| NS | `spouseAmount.params.supplement` | `max` 3000, `threshold` 25000 |
| NS | `childAmount` | `perChild` 1200 |
| NS | `lowIncomeReduction.params` | `individual` 300, `spouse` 300, `child` 165, `threshold` 15000 |
| NS | `credits[ns-affordable-living-tax-credit].params` | `base` 255, `child` 60, `threshold` 30000 |
| NS | `driving` | `distance` 17400 |
| NT | `childBenefit.params` | `under6[1]` 815, `under6[2]` 1467, `under6[3]` 1997, `under6[4]` 2445, `under6More` 367, `over6[1]` 652, `over6[2]` 1174, `over6[3]` 1597, `over6[4]` 1956, `over6More` 293, `fullUpTo` 30000, `endsAt` 80000 |
| NT | `driving` | `distance` 11000 |
| NU | `childAmount` | `perChild` 1200 |
| NU | `childBenefit.params` | `perChild` 330, `threshold` 20921 |
| NU | `driving` | `distance` 6800 |
| ON | `brackets` | `[2].limit` 150000, `[3].limit` 220000 |
| ON | `lift` | `max` 850, `threshold` 30000, `familyThreshold` 60000 |
| ON | `payroll` | `healthPremium[0][0]` 200000, `healthPremium[0][1]` 750, `healthPremium[0][3]` 900, `healthPremium[1][0]` 72000, `healthPremium[1][1]` 600, `healthPremium[1][3]` 750, `healthPremium[2][0]` 48000, `healthPremium[2][1]` 450, `healthPremium[2][3]` 600, `healthPremium[3][0]` 36000, `healthPremium[3][1]` 300, `healthPremium[3][3]` 450, `healthPremium[4][0]` 20000, `healthPremium[4][3]` 300 |
| ON | `driving` | `distance` 16200 |
| PE | `brackets` | `[0].limit` 31984, `[1].limit` 63969 |
| PE | `lowIncomeReduction.params` | `individual` 350, `spouse` 350, `child` 300 |
| PE | `credits[pei-sales-tax-credit].params` | `individual` 110, `spouseOrDependant` 55, `supplementFrom` 30000, `supplementMax` 55, `threshold` 50000 |
| PE | `childAmount` | `perChild` 1200 |
| PE | `postDividendSurtax.params` | `threshold` 12500 |
| PE | `driving` | `distance` 15100 |
| QC | `credits[quebec-work-premium].params` | `single[1]` 2400, `couple[1]` 3600, `parent[1]` 2400, `coupleKids[1]` 3600 |
| QC | `driving` | `distance` 14800 |
| SK | `brackets` | `[0].limit` 45225, `[1].limit` 129214 |
| SK |  | `basicPersonalAmount` 16065 |
| SK | `spouseAmount` | `max` 16065, `threshold` 1607 |
| SK | `childAmount` | `perChild` 6094 |
| SK | `credits[sk-low-income-tax-credit].params` | `adult` 346, `spouse` 346, `child` 136, `threshold` 32643 |
| SK | `driving` | `distance` 15300 |
| YT | `brackets` | `[3].limit` 500000 |
| YT | `childBenefit.params` | `perChild` 820, `threshold` 35000 |
| YT | `driving` | `distance` 13200 |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments` | `[0].adult` 43, `[0].spouse` 43, `[0].child` 43, `[0].firstChild` 43 |

### Large changes, over 15% (44)

| File | Field | 2019 | 2020 | Change |
|---|---|--:|--:|--:|
| federal | `payroll.cpp.enh1` | 0.0015 | 0.003 | +100.0% |
| federal | `payroll.qpp.enh1` | 0.0015 | 0.003 | +100.0% |
| AB | `carbon.gasoline[0].rate` | 0.0673 | 0.0442 | -34.3% |
| AB | `carbon.gasoline[1].rate` | 0 | 0.0663 | n/a |
| AB | `carbon.heating.amount` | 60.99 | 142.36 | +133.4% |
| BC | `brackets[5].limit` | .inf | 220000 | n/a |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].adult` | 38.625 | 218 | +464.4% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].spouse` | 38.625 | 218 | +464.4% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].child` | 11.375 | 64 | +462.6% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].firstChild` | 38.625 | 218 | +464.4% |
| MB | `carbon.gasoline[0].rate` | 0 | 0.0442 | n/a |
| MB | `carbon.gasoline[1].rate` | 0.0442 | 0.0663 | +50.0% |
| MB | `carbon.heating.amount` | 38.99 | 71.24 | +82.7% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 170 | 243 | +42.9% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 85 | 121 | +42.4% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 42 | 61 | +45.2% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 85 | 121 | +42.4% |
| NB | `carbon.gasoline[0].rate` | 0 | 0.0442 | n/a |
| NB | `carbon.gasoline[1].rate` | 0.0442 | 0.0663 | +50.0% |
| NB | `carbon.heating.amount` | 8.08 | 6.42 | -20.5% |
| NT | `carbon.gasoline[0].rate` | 0 | 0.047 | n/a |
| NT | `carbon.gasoline[1].rate` | 0.047 | 0.07 | +48.9% |
| NU | `carbon.heating.amount` | 32.57 | 88.83 | +172.7% |
| NU | `carbon.gasoline[0].rate` | 0 | 0.0221 | n/a |
| NU | `carbon.gasoline[1].rate` | 0.0221 | 0.03315 | +50.0% |
| ON | `carbon.gasoline[0].rate` | 0 | 0.0442 | n/a |
| ON | `carbon.gasoline[1].rate` | 0.0442 | 0.0663 | +50.0% |
| ON | `carbon.heating.amount` | 47.23 | 86.3 | +82.7% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 154 | 224 | +45.5% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 77 | 112 | +45.5% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 38 | 56 | +47.4% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 77 | 112 | +45.5% |
| PE | `carbon.gasoline[0].rate` | 0 | 0.0442 | n/a |
| PE | `carbon.gasoline[1].rate` | 0.0442 | 0.0663 | +50.0% |
| SK | `carbon.gasoline[0].rate` | 0 | 0.0442 | n/a |
| SK | `carbon.gasoline[1].rate` | 0.0442 | 0.0663 | +50.0% |
| SK | `carbon.heating.amount` | 60.19 | 109.98 | +82.7% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 305 | 405 | +32.8% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 152 | 202 | +32.9% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 76 | 101 | +32.9% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 152 | 202 | +32.9% |
| YT | `carbon.heating.amount` | 47.37 | 129.21 | +172.8% |
| YT | `carbon.gasoline[0].rate` | 0 | 0.0442 | n/a |
| YT | `carbon.gasoline[1].rate` | 0.0442 | 0.0663 | +50.0% |

### Added, removed and replaced (20)

| File | Field | | Value |
|---|---|---|---|
| federal | `basicPersonalAmount` | replaced | 12069 → {max: 13229, min: 12298, from: 150473, to: 214368} |
| AB | `childBenefit` | replaced | {name: Alberta Child Benefit and Family Employment Tax Cred… → {name: Alberta Child and Family Benefit, program: alberta-c… |
| AB | `carbon.rebates[carbon-rebate-payments]` | added | {program: carbon-rebate-payments, name: Climate Action Incentive / Canada Carbo… |
| AB | `carbon.rebates[alberta-carbon-rebate-payments]` | removed | {name: Alberta climate leadership adjustment rebate, program: alberta-carbon-re… |
| BC | `brackets[6]` | added | [.inf, 0.205] |
| BC | `childBenefit` | replaced | {name: B.C. early childhood tax benefit, program: bc-early-… → {name: B.C. early childhood / child opportunity benefit, pr… |
| BC | `carbon.gasoline` | replaced | [{from: 2019-01-01, rate: 0.0778}, {from: 2019-04-01, rate:… → 0.0889 |
| BC | `householdPremium` | removed | {program: bc-msp-premiums, estimated: true, params: {spouseDeduction: 3000, chi… |
| MB | `salesTax.estimated` | removed | true |
| NB | `carbon.rebates[carbon-rebate-payments]` | removed | {program: carbon-rebate-payments, name: Climate Action Incentive / Canada Carbo… |
| NL | `carbon.gasoline` | replaced | 0.0442 → [{from: 2020-01-01, rate: 0.0442}, {from: 2020-11-07, rate:… |
| NL | `additionalTax` | removed | {program: nl-deficit-reduction-levy, params: {bands: [[50000, 0, 0.1, 100], [55… |
| NS | `childBenefit` | replaced | {name: Nova Scotia Child Benefit, program: nova-scotia-chil… → {name: Nova Scotia Child Benefit, program: nova-scotia-chil… |
| NT | `carbon.rebates[carbon-rebate-consolidated-payments]` | added | {name: Cost of Living Offset, program: carbon-rebate-consolidated-payments, par… |
| NT | `carbon.rebates[carbon-rebate-payments]` | removed | {name: Cost of Living Offset, program: carbon-rebate-payments, params: {payment… |
| NU | `carbon.gasoline[0].note` | added | Net household rate after the statutory 50% point-of-sale rebate |
| QC | `childBenefit` | replaced | {name: Family allowance, program: quebec-family-allowance-b… → {name: Family allowance, program: quebec-family-allowance, … |
| YT | `spouseAmount` | replaced | {max: 12069, threshold: 0} → federal |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[1]` | added | {date: 2020-07-01, adult: 48, spouse: 48, child: 48, firstChild: 48, threshold:… |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[2]` | added | {date: 2020-10-01, adult: 48, spouse: 48, child: 48, firstChild: 48, threshold:… |

<details><summary>All 253 changed values</summary>

| File | Field | 2019 | 2020 | Change |
|---|---|--:|--:|--:|
| federal | `brackets[0].limit` | 47630 | 48535 | +1.9% |
| federal | `brackets[1].limit` | 95259 | 97069 | +1.9% |
| federal | `brackets[2].limit` | 147667 | 150473 | +1.9% |
| federal | `brackets[3].limit` | 210371 | 214368 | +1.9% |
| federal | `employmentAmount` | 1222 | 1245 | +1.9% |
| federal | `indexation` | 0.022 | 0.019 | -13.6% |
| federal | `rrsp.limit` | 26500 | 27230 | +2.8% |
| federal | `payroll.cpp.ympe` | 57400 | 58700 | +2.3% |
| federal | `payroll.cpp.yampe` | 57400 | 58700 | +2.3% |
| federal | `payroll.cpp.enh1` | 0.0015 | 0.003 | +100.0% |
| federal | `payroll.qpp.ympe` | 57400 | 58700 | +2.3% |
| federal | `payroll.qpp.yampe` | 57400 | 58700 | +2.3% |
| federal | `payroll.qpp.enh1` | 0.0015 | 0.003 | +100.0% |
| federal | `payroll.ei.maxInsurable` | 53100 | 54200 | +2.1% |
| federal | `payroll.ei.rate` | 0.0162 | 0.0158 | -2.5% |
| federal | `payroll.ei.quebecRate` | 0.0125 | 0.012 | -4.0% |
| federal | `payroll.qpip.maxInsurable` | 76500 | 78500 | +2.6% |
| federal | `payroll.qpip.rate` | 0.00526 | 0.00494 | -6.1% |
| federal | `childBenefit.perChildUnder6` | 6639 | 6765 | +1.9% |
| federal | `childBenefit.perChild6to17` | 5602 | 5708 | +1.9% |
| federal | `childBenefit.threshold1` | 31120 | 31711 | +1.9% |
| federal | `childBenefit.threshold2` | 67426 | 68708 | +1.9% |
| federal | `childBenefit.fixed2[1]` | 2541 | 2590 | +1.9% |
| federal | `childBenefit.fixed2[2]` | 4901 | 4995 | +1.9% |
| federal | `childBenefit.fixed2[3]` | 6898 | 7029 | +1.9% |
| federal | `childBenefit.fixed2[4]` | 8351 | 8509 | +1.9% |
| federal | `groceriesBenefit.adult` | 290 | 296 | +2.1% |
| federal | `groceriesBenefit.spouseOrFirstChild` | 290 | 296 | +2.1% |
| federal | `groceriesBenefit.child` | 153 | 155 | +1.3% |
| federal | `groceriesBenefit.singleSupplement.max` | 153 | 155 | +1.3% |
| federal | `groceriesBenefit.singleSupplement.from` | 9412 | 9590 | +1.9% |
| federal | `groceriesBenefit.phaseOut.from` | 37789 | 38507 | +1.9% |
| federal | `workersBenefit.estimationNote` | "Quebec's income-at-maximum thresholds … | "Quebec's income-at-maximum thresholds … |  |
| federal | `workersBenefit.standard.max[0]` | 1355 | 1381 | +1.9% |
| federal | `workersBenefit.standard.max[1]` | 2335 | 2379 | +1.9% |
| federal | `workersBenefit.standard.threshold[0]` | 12820 | 13064 | +1.9% |
| federal | `workersBenefit.standard.threshold[1]` | 17025 | 17348 | +1.9% |
| federal | `workersBenefit.regional.AB.max[0]` | 1453 | 1481 | +1.9% |
| federal | `workersBenefit.regional.AB.max[1]` | 2175 | 2216 | +1.9% |
| federal | `workersBenefit.regional.AB.threshold[0]` | 13200 | 13451 | +1.9% |
| federal | `workersBenefit.regional.AB.threshold[1]` | 17950 | 18291 | +1.9% |
| federal | `workersBenefit.regional.NU.max[0]` | 1065 | 1085 | +1.9% |
| federal | `workersBenefit.regional.NU.max[1]` | 1600 | 1630 | +1.9% |
| federal | `workersBenefit.regional.NU.threshold[0]` | 21250 | 21654 | +1.9% |
| federal | `workersBenefit.regional.NU.threshold[1]` | 29000 | 29551 | +1.9% |
| federal | `workersBenefit.quebec.single[2]` | 10720 | 10864.014598540145 | +1.3% |
| federal | `workersBenefit.quebec.single[3]` | 12060 | 12308.41 | +2.1% |
| federal | `workersBenefit.quebec.couple[2]` | 16584.014598540147 | 16812.007299270073 | +1.4% |
| federal | `workersBenefit.quebec.couple[3]` | 18520 | 18897.5 | +2.0% |
| federal | `workersBenefit.quebec.parent[2]` | 10720 | 10864 | +1.3% |
| federal | `workersBenefit.quebec.parent[3]` | 12065 | 12304.8 | +2.0% |
| federal | `workersBenefit.quebec.coupleKids[2]` | 16584 | 16812 | +1.4% |
| federal | `workersBenefit.quebec.coupleKids[3]` | 18540 | 18905.35 | +2.0% |
| AB | `propertyTax.rate` | 0.006654 | 0.007523 | +13.1% |
| AB | `carbon.gasoline[0].from` | 2019-01-01 | 2020-01-01 |  |
| AB | `carbon.gasoline[0].rate` | 0.0673 | 0.0442 | -34.3% |
| AB | `carbon.gasoline[1].from` | 2019-05-30 | 2020-04-01 |  |
| AB | `carbon.gasoline[1].rate` | 0 | 0.0663 | n/a |
| AB | `carbon.heating.amount` | 60.99 | 142.36 | +133.4% |
| AB | `carbon.heating.method` | "Estimated 2021 Statistics Canada house… | "2021 Statistics Canada household natur… |  |
| BC | `brackets[0].limit` | 40707 | 41725 | +2.5% |
| BC | `brackets[1].limit` | 81416 | 83451 | +2.5% |
| BC | `brackets[2].limit` | 93476 | 95812 | +2.5% |
| BC | `brackets[3].limit` | 113506 | 116344 | +2.5% |
| BC | `brackets[4].limit` | 153900 | 157748 | +2.5% |
| BC | `brackets[5].limit` | .inf | 220000 | n/a |
| BC | `basicPersonalAmount` | 10682 | 10949 | +2.5% |
| BC | `spouseAmount.max` | 9147 | 9376 | +2.5% |
| BC | `spouseAmount.threshold` | 915 | 938 | +2.5% |
| BC | `bcTaxReduction.max` | 464 | 476 | +2.6% |
| BC | `bcTaxReduction.threshold` | 20668 | 21185 | +2.5% |
| BC | `propertyTax.rate` | 0.00256116 | 0.00292568 | +14.2% |
| BC | `carbon.heating.amount` | 94.02 | 97.01 | +3.2% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2019-01-01 | 2020-01-01 |  |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 33.75 | 38.625 | +14.4% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 33.75 | 38.625 | +14.4% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 10 | 11.375 | +13.8% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 33.75 | 38.625 | +14.4% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].threshold[0]` | 33993 | 34876 | +2.6% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].threshold[1]` | 39658 | 40689 | +2.6% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].date` | 2019-04-01 | 2020-04-01 |  |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].adult` | 33.75 | 38.625 | +14.4% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].spouse` | 33.75 | 38.625 | +14.4% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 10 | 11.375 | +13.8% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 33.75 | 38.625 | +14.4% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].threshold[0]` | 33993 | 34876 | +2.6% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].threshold[1]` | 39658 | 40689 | +2.6% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].date` | 2019-07-01 | 2020-07-01 |  |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].adult` | 38.625 | 218 | +464.4% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].spouse` | 38.625 | 218 | +464.4% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].child` | 11.375 | 64 | +462.6% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].firstChild` | 38.625 | 218 | +464.4% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].threshold[0]` | 34876 | 35748 | +2.5% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].threshold[1]` | 40689 | 41706 | +2.5% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[3].date` | 2019-10-01 | 2020-10-01 |  |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[3].adult` | 38.625 | 43.5 | +12.6% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[3].spouse` | 38.625 | 43.5 | +12.6% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[3].child` | 11.375 | 12.75 | +12.1% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[3].firstChild` | 38.625 | 43.5 | +12.6% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[3].threshold[0]` | 34876 | 35748 | +2.5% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[3].threshold[1]` | 40689 | 41706 | +2.5% |
| MB | `brackets[0].limit` | 32670 | 33389 | +2.2% |
| MB | `brackets[1].limit` | 70610 | 72164 | +2.2% |
| MB | `basicPersonalAmount` | 9626 | 9838 | +2.2% |
| MB | `salesTax.rate` | 0.125 | 0.12 | -4.0% |
| MB | `salesTax.label` | "5% GST + 7.5% average RST" | "5% GST + 7% RST" |  |
| MB | `propertyTax.rate` | 0.012789000000000002 | 0.012385350000000002 | -3.2% |
| MB | `credits[mb-school-tax-credits-rent-share].params.schoolTaxShare` | 0.5323715693173822 | 0.5327180903244559 | +0.1% |
| MB | `carbon.gasoline[0].from` | 2019-01-01 | 2020-01-01 |  |
| MB | `carbon.gasoline[0].rate` | 0 | 0.0442 | n/a |
| MB | `carbon.gasoline[1].from` | 2019-04-01 | 2020-04-01 |  |
| MB | `carbon.gasoline[1].rate` | 0.0442 | 0.0663 | +50.0% |
| MB | `carbon.heating.amount` | 38.99 | 71.24 | +82.7% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2019-04-01 | 2020-04-01 |  |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 170 | 243 | +42.9% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 85 | 121 | +42.4% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 42 | 61 | +45.2% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 85 | 121 | +42.4% |
| NB | `brackets[0].limit` | 42592 | 43401 | +1.9% |
| NB | `brackets[1].limit` | 85184 | 86803 | +1.9% |
| NB | `brackets[2].limit` | 138491 | 141122 | +1.9% |
| NB | `brackets[3].limit` | 157778 | 160776 | +1.9% |
| NB | `basicPersonalAmount` | 10264 | 10459 | +1.9% |
| NB | `spouseAmount.max` | 8716 | 8882 | +1.9% |
| NB | `spouseAmount.threshold` | 872 | 889 | +1.9% |
| NB | `lowIncomeReduction.params.amount` | 665 | 678 | +2.0% |
| NB | `lowIncomeReduction.params.threshold` | 17130 | 17455 | +1.9% |
| NB | `carbon.gasoline[0].from` | 2019-01-01 | 2020-01-01 |  |
| NB | `carbon.gasoline[0].rate` | 0 | 0.0442 | n/a |
| NB | `carbon.gasoline[1].from` | 2019-04-01 | 2020-04-01 |  |
| NB | `carbon.gasoline[1].rate` | 0.0442 | 0.0663 | +50.0% |
| NB | `carbon.heating.amount` | 8.08 | 6.42 | -20.5% |
| NB | `carbon.heating.method` | "2021 Statistics Canada household natur… | "Estimated 2021 Statistics Canada house… |  |
| NL | `brackets[0].limit` | 37591 | 37929 | +0.9% |
| NL | `brackets[1].limit` | 75181 | 75858 | +0.9% |
| NL | `brackets[2].limit` | 134224 | 135432 | +0.9% |
| NL | `brackets[3].limit` | 187913 | 189604 | +0.9% |
| NL | `basicPersonalAmount` | 9414 | 9498 | +0.9% |
| NL | `spouseAmount.max` | 7692 | 7761 | +0.9% |
| NL | `spouseAmount.threshold` | 770 | 777 | +0.9% |
| NL | `lowIncomeReduction.params.individual` | 850 | 859 | +1.1% |
| NL | `lowIncomeReduction.params.family` | 474 | 479 | +1.1% |
| NL | `lowIncomeReduction.params.thresholdIndividual` | 20354 | 20537 | +0.9% |
| NL | `lowIncomeReduction.params.thresholdFamily` | 34417 | 34727 | +0.9% |
| NL | `childBenefit.params.perChild[0]` | 405 | 408.96 | +1.0% |
| NL | `childBenefit.params.perChild[1]` | 429.96 | 433.92 | +0.9% |
| NL | `childBenefit.params.perChild[2]` | 462 | 465.96 | +0.9% |
| NL | `childBenefit.params.perChild[3]` | 495.96 | 499.92 | +0.8% |
| NT | `brackets[0].limit` | 43137 | 43957 | +1.9% |
| NT | `brackets[1].limit` | 86277 | 87916 | +1.9% |
| NT | `brackets[2].limit` | 140267 | 142932 | +1.9% |
| NT | `basicPersonalAmount` | 14811 | 15093 | +1.9% |
| NT | `spouseAmount.max` | 14811 | 15093 | +1.9% |
| NT | `propertyTax.rate` | 0.00826 | 0.00835 | +1.1% |
| NT | `carbon.gasoline[0].from` | 2019-01-01 | 2020-01-01 |  |
| NT | `carbon.gasoline[0].rate` | 0 | 0.047 | n/a |
| NT | `carbon.gasoline[1].from` | 2019-09-01 | 2020-07-01 |  |
| NT | `carbon.gasoline[1].rate` | 0.047 | 0.07 | +48.9% |
| NU | `brackets[0].limit` | 45414 | 46277 | +1.9% |
| NU | `brackets[1].limit` | 90829 | 92555 | +1.9% |
| NU | `brackets[2].limit` | 147667 | 150473 | +1.9% |
| NU | `basicPersonalAmount` | 16000 | 16304 | +1.9% |
| NU | `spouseAmount.max` | 16000 | 16304 | +1.9% |
| NU | `propertyTax.rate` | 0.01879 | 0.01935 | +3.0% |
| NU | `carbon.heating.amount` | 32.57 | 88.83 | +172.7% |
| NU | `carbon.gasoline[0].from` | 2019-01-01 | 2020-01-01 |  |
| NU | `carbon.gasoline[0].rate` | 0 | 0.0221 | n/a |
| NU | `carbon.gasoline[1].from` | 2019-07-01 | 2020-04-01 |  |
| NU | `carbon.gasoline[1].rate` | 0.0221 | 0.03315 | +50.0% |
| ON | `brackets[0].limit` | 43906 | 44740 | +1.9% |
| ON | `brackets[1].limit` | 87813 | 89482 | +1.9% |
| ON | `basicPersonalAmount` | 10582 | 10783 | +1.9% |
| ON | `dividendTaxCredit.nonEligible` | 0.032863 | 0.029863 | -9.1% |
| ON | `spouseAmount.max` | 8985 | 9156 | +1.9% |
| ON | `spouseAmount.threshold` | 898 | 915 | +1.9% |
| ON | `surtax[0][0]` | 4740 | 4830 | +1.9% |
| ON | `surtax[1][0]` | 6067 | 6182 | +1.9% |
| ON | `ontarioTaxReduction.base` | 244 | 249 | +2.0% |
| ON | `ontarioTaxReduction.perChild` | 452 | 460 | +1.8% |
| ON | `propertyTax.rate` | 0.0061477 | 0.00599704 | -2.5% |
| ON | `childBenefit.params.perChild` | 1434 | 1461 | +1.9% |
| ON | `childBenefit.params.threshold` | 21887 | 22303 | +1.9% |
| ON | `credits[ontario-sales-tax-credit].params.perPerson` | 308 | 313 | +1.6% |
| ON | `credits[ontario-sales-tax-credit].params.thresholdSingle` | 23665 | 24115 | +1.9% |
| ON | `credits[ontario-sales-tax-credit].params.thresholdFamily` | 29581 | 30143 | +1.9% |
| ON | `credits[ontario-energy-property-tax-credit].params.energyMax` | 237 | 241 | +1.7% |
| ON | `credits[ontario-energy-property-tax-credit].params.propertyBase` | 59 | 60 | +1.7% |
| ON | `credits[ontario-energy-property-tax-credit].params.propertyMax` | 769 | 784 | +2.0% |
| ON | `credits[ontario-energy-property-tax-credit].params.thresholdSingle` | 23665 | 24115 | +1.9% |
| ON | `credits[ontario-energy-property-tax-credit].params.thresholdFamily` | 29581 | 30143 | +1.9% |
| ON | `carbon.gasoline[0].from` | 2019-01-01 | 2020-01-01 |  |
| ON | `carbon.gasoline[0].rate` | 0 | 0.0442 | n/a |
| ON | `carbon.gasoline[1].from` | 2019-04-01 | 2020-04-01 |  |
| ON | `carbon.gasoline[1].rate` | 0.0442 | 0.0663 | +50.0% |
| ON | `carbon.heating.amount` | 47.23 | 86.3 | +82.7% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2019-04-01 | 2020-04-01 |  |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 154 | 224 | +45.5% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 77 | 112 | +45.5% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 38 | 56 | +47.4% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 77 | 112 | +45.5% |
| PE | `basicPersonalAmount` | 9160 | 10000 | +9.2% |
| PE | `spouseAmount.max` | 7780 | 8493 | +9.2% |
| PE | `spouseAmount.threshold` | 778 | 849 | +9.1% |
| PE | `lowIncomeReduction.params.threshold` | 17000 | 18000 | +5.9% |
| PE | `carbon.gasoline[0].from` | 2019-01-01 | 2020-01-01 |  |
| PE | `carbon.gasoline[0].rate` | 0 | 0.0442 | n/a |
| PE | `carbon.gasoline[1].from` | 2019-04-01 | 2020-04-01 |  |
| PE | `carbon.gasoline[1].rate` | 0.0442 | 0.0663 | +50.0% |
| QC | `brackets[0].limit` | 43790 | 44545 | +1.7% |
| QC | `brackets[1].limit` | 87575 | 89080 | +1.7% |
| QC | `brackets[2].limit` | 106555 | 108390 | +1.7% |
| QC | `basicPersonalAmount` | 15269 | 15532 | +1.7% |
| QC | `dividendTaxCredit.eligible` | 0.1178 | 0.117 | -0.7% |
| QC | `dividendTaxCredit.nonEligible` | 0.0555 | 0.0477 | -14.1% |
| QC | `quebec.workerDeduction.max` | 1170 | 1190 | +1.7% |
| QC | `quebec.livingAlone.max` | 1750 | 1780 | +1.7% |
| QC | `quebec.livingAlone.threshold` | 34610 | 35205 | +1.7% |
| QC | `propertyTax.rate` | 0.008158 | 0.007956 | -2.5% |
| QC | `credits[quebec-solidarity-tax-credit].params.qstAdult` | 292 | 297 | +1.7% |
| QC | `credits[quebec-solidarity-tax-credit].params.qstSpouse` | 292 | 297 | +1.7% |
| QC | `credits[quebec-solidarity-tax-credit].params.qstAlone` | 139 | 141 | +1.4% |
| QC | `credits[quebec-solidarity-tax-credit].params.housingCouple` | 687 | 699 | +1.7% |
| QC | `credits[quebec-solidarity-tax-credit].params.housingSingle` | 567 | 577 | +1.8% |
| QC | `credits[quebec-solidarity-tax-credit].params.child` | 121 | 123 | +1.7% |
| QC | `credits[quebec-solidarity-tax-credit].params.threshold` | 34800 | 35400 | +1.7% |
| QC | `credits[quebec-work-premium].params.single[0]` | 0.105 | 0.108 | +2.9% |
| QC | `credits[quebec-work-premium].params.single[2]` | 10720 | 10864 | +1.3% |
| QC | `credits[quebec-work-premium].params.couple[0]` | 0.105 | 0.108 | +2.9% |
| QC | `credits[quebec-work-premium].params.couple[2]` | 16584 | 16812 | +1.4% |
| QC | `credits[quebec-work-premium].params.parent[2]` | 10720 | 10864 | +1.3% |
| QC | `credits[quebec-work-premium].params.coupleKids[2]` | 16584 | 16812 | +1.4% |
| SK | `propertyTax.rate` | 0.00890536416 | 0.009120385600000001 | +2.4% |
| SK | `carbon.gasoline[0].from` | 2019-01-01 | 2020-01-01 |  |
| SK | `carbon.gasoline[0].rate` | 0 | 0.0442 | n/a |
| SK | `carbon.gasoline[1].from` | 2019-04-01 | 2020-04-01 |  |
| SK | `carbon.gasoline[1].rate` | 0.0442 | 0.0663 | +50.0% |
| SK | `carbon.heating.amount` | 60.19 | 109.98 | +82.7% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2019-04-01 | 2020-04-01 |  |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 305 | 405 | +32.8% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 152 | 202 | +32.9% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 76 | 101 | +32.9% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 152 | 202 | +32.9% |
| YT | `brackets[0].limit` | 47630 | 48535 | +1.9% |
| YT | `brackets[1].limit` | 95259 | 97069 | +1.9% |
| YT | `brackets[2].limit` | 147667 | 150473 | +1.9% |
| YT | `basicPersonalAmount` | 12069 | federal |  |
| YT | `propertyTax.rate` | 0.01097 | 0.01084 | -1.2% |
| YT | `carbon.heating.amount` | 47.37 | 129.21 | +172.8% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2019-10-31 | 2020-04-30 |  |
| YT | `carbon.gasoline[0].from` | 2019-01-01 | 2020-01-01 |  |
| YT | `carbon.gasoline[0].rate` | 0 | 0.0442 | n/a |
| YT | `carbon.gasoline[1].from` | 2019-07-01 | 2020-04-01 |  |
| YT | `carbon.gasoline[1].rate` | 0.0442 | 0.0663 | +50.0% |

</details>

<details><summary>4 unchanged values opted out</summary>

| File | In | Unchanged values | Why |
|---|---|---|---|
| MB | `familyTaxBenefit.params` | `basic` 2065, `dependant` 2065, `child` 2752, `childThrough` 18 | not indexed comment |

</details>
```

```text
> tax-visualizer@0.1.0 year-diff
> node --import tsx scripts/year-diff.ts 2021 2020

## Data diff: 2021 against 2020

313 values changed from 2020 to 2021 (78 over 15%), 154 amounts suspiciously unchanged, 3 added, 0 removed, 4 replaced. 4 unchanged values opted out.

### Suspiciously unchanged (154)

Amounts, thresholds and bracket limits that are the same in both years. If one is meant to stay put, say so with a `# not indexed` comment on its line (or `bracketsFrozenSince` for bracket limits).

| File | In | Unchanged values |
|---|---|---|
| federal | `payroll.cpp` | `exempt` 3500 |
| federal | `payroll.qpp` | `exempt` 3500 |
| federal | `workersBenefit.standard` | `floor[0]` 3000, `floor[1]` 3000 |
| federal | `workersBenefit.regional.AB` | `floor[0]` 2760, `floor[1]` 2760 |
| federal | `workersBenefit.regional.NU` | `floor[0]` 6000, `floor[1]` 6000 |
| federal | `workersBenefit.quebec` | `single[1]` 2400, `couple[1]` 3600, `parent[1]` 2400, `coupleKids[1]` 3600 |
| federal | `driving` | `efficiency` 9 |
| AB | `brackets` | `[0].limit` 131220, `[1].limit` 157464, `[2].limit` 209952, `[3].limit` 314928 |
| AB |  | `basicPersonalAmount` 19369 |
| AB | `spouseAmount` | `max` 19369 |
| AB | `childBenefit.params` | `base[0]` 1330, `base[1]` 1995, `base[2]` 2660, `base[3]` 3325, `baseThreshold` 24467, `working[0]` 681, `working[1]` 1301, `working[2]` 1672, `working[3]` 1795, `workingFloor` 2760, `workingThreshold` 41000, `minAnnual` 10 |
| AB | `driving` | `distance` 16100 |
| BC | `driving` | `distance` 12900 |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments` | `[3].adult` 43.5, `[3].spouse` 43.5, `[3].child` 12.75, `[3].firstChild` 43.5 |
| MB | `spouseAmount` | `max` 9134 |
| MB | `driving` | `distance` 15000 |
| NB | `childBenefit.params` | `perChild` 250, `threshold` 20000 |
| NB | `childBenefit.params.workingIncomeSupplement` | `floor` 3750, `max` 250, `threshold` 20921 |
| NB | `credits[nb-hst-credit].params` | `adult` 300, `spouse` 300, `child` 100, `threshold` 35000 |
| NB | `driving` | `distance` 16100 |
| NL | `childBenefit.params` | `threshold` 17397 |
| NL | `credits[nl-income-supplement].params` | `base` 220, `extraMax` 230, `extraFrom` 15000, `couple` 60, `child` 200, `threshold` 40000 |
| NL | `driving` | `distance` 15100 |
| NS | `brackets` | `[0].limit` 29590, `[1].limit` 59180, `[2].limit` 93000, `[3].limit` 150000 |
| NS | `basicPersonalAmount` | `max` 11481, `min` 8481, `from` 25000, `to` 75000 |
| NS | `spouseAmount.params` | `max` 8481, `threshold` 848 |
| NS | `spouseAmount.params.supplement` | `max` 3000, `threshold` 25000 |
| NS | `childAmount` | `perChild` 1200 |
| NS | `lowIncomeReduction.params` | `individual` 300, `spouse` 300, `child` 165, `threshold` 15000 |
| NS | `childBenefit.params` | `perChild[0]` 925, `perChild[1]` 825, `perChild[2]` 900, `fullBelow` 26000, `partialBelow` 34000 |
| NS | `credits[ns-affordable-living-tax-credit].params` | `base` 255, `child` 60, `threshold` 30000 |
| NS | `driving` | `distance` 17400 |
| NT | `childBenefit.params` | `under6[1]` 815, `under6[2]` 1467, `under6[3]` 1997, `under6[4]` 2445, `under6More` 367, `over6[1]` 652, `over6[2]` 1174, `over6[3]` 1597, `over6[4]` 1956, `over6More` 293, `fullUpTo` 30000, `endsAt` 80000 |
| NT | `driving` | `distance` 11000 |
| NT | `carbon.rebates[carbon-rebate-consolidated-payments].params.payments[0].smallPayment` | `below` 50 |
| NT | `carbon.rebates[carbon-rebate-consolidated-payments].params.payments` | `[1].adult` 39, `[1].spouse` 39, `[1].child` 45, `[1].firstChild` 45 |
| NT | `carbon.rebates[carbon-rebate-consolidated-payments].params.payments[1].smallPayment` | `below` 50 |
| NT | `carbon.rebates[carbon-rebate-consolidated-payments].params.payments[2].smallPayment` | `below` 50 |
| NU | `childAmount` | `perChild` 1200 |
| NU | `childBenefit.params` | `perChild` 330, `threshold` 20921 |
| NU | `driving` | `distance` 6800 |
| ON | `brackets` | `[2].limit` 150000, `[3].limit` 220000 |
| ON | `lift` | `max` 850, `threshold` 30000, `familyThreshold` 60000 |
| ON | `payroll` | `healthPremium[0][0]` 200000, `healthPremium[0][1]` 750, `healthPremium[0][3]` 900, `healthPremium[1][0]` 72000, `healthPremium[1][1]` 600, `healthPremium[1][3]` 750, `healthPremium[2][0]` 48000, `healthPremium[2][1]` 450, `healthPremium[2][3]` 600, `healthPremium[3][0]` 36000, `healthPremium[3][1]` 300, `healthPremium[3][3]` 450, `healthPremium[4][0]` 20000, `healthPremium[4][3]` 300 |
| ON | `driving` | `distance` 16200 |
| PE | `brackets` | `[0].limit` 31984, `[1].limit` 63969 |
| PE | `lowIncomeReduction.params` | `individual` 350, `spouse` 350, `child` 300 |
| PE | `credits[pei-sales-tax-credit].params` | `individual` 110, `spouseOrDependant` 55, `supplementFrom` 30000, `supplementMax` 55, `threshold` 50000 |
| PE | `childAmount` | `perChild` 1200 |
| PE | `postDividendSurtax.params` | `threshold` 12500 |
| PE | `driving` | `distance` 15100 |
| QC | `credits[quebec-work-premium].params` | `single[1]` 2400, `couple[1]` 3600, `parent[1]` 2400, `coupleKids[1]` 3600 |
| QC | `driving` | `distance` 14800 |
| SK | `driving` | `distance` 15300 |
| YT | `brackets` | `[3].limit` 500000 |
| YT | `childBenefit.params` | `perChild` 820, `threshold` 35000 |
| YT | `driving` | `distance` 13200 |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments` | `[1].adult` 48, `[1].spouse` 48, `[1].child` 48, `[1].firstChild` 48 |

### Large changes, over 15% (78)

| File | Field | 2020 | 2021 | Change |
|---|---|--:|--:|--:|
| federal | `indexation` | 0.019 | 0.01 | -47.4% |
| federal | `payroll.cpp.enh1` | 0.003 | 0.005 | +66.7% |
| federal | `payroll.qpp.enh1` | 0.003 | 0.005 | +66.7% |
| federal | `workersBenefit.standard.threshold[0]` | 13064 | 22944 | +75.6% |
| federal | `workersBenefit.standard.threshold[1]` | 17348 | 26177 | +50.9% |
| federal | `workersBenefit.standard.phaseOut[0]` | 0.12 | 0.15 | +25.0% |
| federal | `workersBenefit.standard.phaseOut[1]` | 0.12 | 0.15 | +25.0% |
| federal | `workersBenefit.secondaryEarnerExemption` | 0 | 14000 | n/a |
| federal | `workersBenefit.regional.AB.threshold[0]` | 13451 | 22350 | +66.2% |
| federal | `workersBenefit.regional.AB.threshold[1]` | 18291 | 28000 | +53.1% |
| federal | `workersBenefit.regional.AB.phaseOut[0]` | 0.12 | 0.15 | +25.0% |
| federal | `workersBenefit.regional.AB.phaseOut[1]` | 0.12 | 0.15 | +25.0% |
| federal | `workersBenefit.regional.NU.max[0]` | 1085 | 1385 | +27.6% |
| federal | `workersBenefit.regional.NU.max[1]` | 1630 | 2080 | +27.6% |
| federal | `workersBenefit.quebec.single[0]` | 0.274 | 0.373 | +36.1% |
| federal | `workersBenefit.quebec.couple[0]` | 0.274 | 0.373 | +36.1% |
| federal | `workersBenefit.quebec.parent[0]` | 0.15 | 0.2 | +33.3% |
| federal | `workersBenefit.quebec.coupleKids[0]` | 0.14 | 0.239 | +70.7% |
| AB | `dividendTaxCredit.eligible` | 0.1 | 0.0812 | -18.8% |
| AB | `carbon.gasoline[0].rate` | 0.0442 | 0.0663 | +50.0% |
| AB | `carbon.gasoline[1].rate` | 0.0663 | 0.0884 | +33.3% |
| AB | `carbon.heating.amount` | 142.36 | 194.3 | +36.5% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].adult` | 218 | 43.5 | -80.0% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].spouse` | 218 | 43.5 | -80.0% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].child` | 64 | 12.75 | -80.1% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].firstChild` | 218 | 43.5 | -80.0% |
| MB | `credits[mb-school-tax-credits-rent-share].params.schoolRebateRate` | 0 | 0.25 | n/a |
| MB | `credits[mb-school-tax-credits-rent-share].params.educationCreditMax` | 700 | 525 | -25.0% |
| MB | `credits[mb-school-tax-credits-rent-share].params.renterMax` | 700 | 525 | -25.0% |
| MB | `credits[mb-school-tax-credits-rent-share].params.renterShare` | 0.2 | 0.15 | -25.0% |
| MB | `carbon.gasoline[0].rate` | 0.0442 | 0.0663 | +50.0% |
| MB | `carbon.gasoline[1].rate` | 0.0663 | 0.0884 | +33.3% |
| MB | `carbon.heating.amount` | 71.24 | 97.24 | +36.5% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 243 | 360 | +48.1% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 121 | 180 | +48.8% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 61 | 90 | +47.5% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 121 | 180 | +48.8% |
| NB | `carbon.gasoline[0].rate` | 0.0442 | 0.0663 | +50.0% |
| NB | `carbon.gasoline[1].rate` | 0.0663 | 0.0884 | +33.3% |
| NL | `carbon.gasoline[0].rate` | 0.0442 | 0.0663 | +50.0% |
| NL | `carbon.gasoline[1].rate` | 0.0663 | 0.0884 | +33.3% |
| NT | `carbon.rebates[carbon-rebate-consolidated-payments].params.payments[0].adult` | 52 | 39 | -25.0% |
| NT | `carbon.rebates[carbon-rebate-consolidated-payments].params.payments[0].spouse` | 52 | 39 | -25.0% |
| NT | `carbon.rebates[carbon-rebate-consolidated-payments].params.payments[0].child` | 60 | 45 | -25.0% |
| NT | `carbon.rebates[carbon-rebate-consolidated-payments].params.payments[0].firstChild` | 60 | 45 | -25.0% |
| NT | `carbon.rebates[carbon-rebate-consolidated-payments].params.payments[0].smallPayment.multiplier` | 1 | 0 | -100.0% |
| NT | `carbon.rebates[carbon-rebate-consolidated-payments].params.payments[1].smallPayment.multiplier` | 4 | 0 | -100.0% |
| NT | `carbon.rebates[carbon-rebate-consolidated-payments].params.payments[2].adult` | 39 | 52 | +33.3% |
| NT | `carbon.rebates[carbon-rebate-consolidated-payments].params.payments[2].spouse` | 39 | 52 | +33.3% |
| NT | `carbon.rebates[carbon-rebate-consolidated-payments].params.payments[2].child` | 45 | 60 | +33.3% |
| NT | `carbon.rebates[carbon-rebate-consolidated-payments].params.payments[2].firstChild` | 45 | 60 | +33.3% |
| NT | `carbon.rebates[carbon-rebate-consolidated-payments].params.payments[2].smallPayment.multiplier` | 0 | 1 | n/a |
| NT | `carbon.gasoline[0].rate` | 0.047 | 0.07 | +48.9% |
| NT | `carbon.gasoline[1].rate` | 0.07 | 0.094 | +34.3% |
| NU | `carbon.heating.amount` | 88.83 | 121.13 | +36.4% |
| NU | `carbon.gasoline[0].rate` | 0.0221 | 0.03315 | +50.0% |
| NU | `carbon.gasoline[1].rate` | 0.03315 | 0.0442 | +33.3% |
| ON | `carbon.gasoline[0].rate` | 0.0442 | 0.0663 | +50.0% |
| ON | `carbon.gasoline[1].rate` | 0.0663 | 0.0884 | +33.3% |
| ON | `carbon.heating.amount` | 86.3 | 117.79 | +36.5% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 224 | 300 | +33.9% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 112 | 150 | +33.9% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 56 | 75 | +33.9% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 112 | 150 | +33.9% |
| PE | `dividendTaxCredit.nonEligible` | 0.0274 | 0.0196 | -28.5% |
| QC | `dividendTaxCredit.nonEligible` | 0.0477 | 0.0401 | -15.9% |
| SK | `dividendTaxCredit.nonEligible` | 0.03362 | 0.01695 | -49.6% |
| SK | `carbon.gasoline[0].rate` | 0.0442 | 0.0663 | +50.0% |
| SK | `carbon.gasoline[1].rate` | 0.0663 | 0.0884 | +33.3% |
| SK | `carbon.heating.amount` | 109.98 | 150.11 | +36.5% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 405 | 500 | +23.5% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 202 | 250 | +23.8% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 101 | 125 | +23.8% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 202 | 250 | +23.8% |
| YT | `dividendTaxCredit.nonEligible` | 0.023 | 0.0067 | -70.9% |
| YT | `carbon.heating.amount` | 129.21 | 176.21 | +36.4% |
| YT | `carbon.gasoline[0].rate` | 0.0442 | 0.0663 | +50.0% |
| YT | `carbon.gasoline[1].rate` | 0.0663 | 0.0884 | +33.3% |

### Added, removed and replaced (7)

| File | Field | | Value |
|---|---|---|---|
| federal | `workersBenefit.regional.NU.rate` | replaced | [0.1, 0.14] → 0.14 |
| BC | `childBenefit` | replaced | {name: B.C. early childhood / child opportunity benefit, pr… → {name: B.C. child opportunity benefit, program: bc-family-b… |
| BC | `carbon.gasoline` | replaced | 0.0889 → [{from: 2021-01-01, rate: 0.0889}, {from: 2021-04-01, rate:… |
| NT | `carbon.rebates[carbon-rebate-consolidated-payments].params.payments[3]` | added | {date: 2021-10-01, adult: 52, spouse: 52, child: 60, firstChild: 60, threshold:… |
| PE | `carbon.gasoline` | replaced | [{from: 2020-01-01, rate: 0.0442}, {from: 2020-04-01, rate:… → 0.0663 |
| SK | `credits[sk-low-income-tax-credit].estimated` | added | true |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[3]` | added | {date: 2021-10-01, adult: 44, spouse: 44, child: 44, firstChild: 44, threshold:… |

<details><summary>All 313 changed values</summary>

| File | Field | 2020 | 2021 | Change |
|---|---|--:|--:|--:|
| federal | `brackets[0].limit` | 48535 | 49020 | +1.0% |
| federal | `brackets[1].limit` | 97069 | 98040 | +1.0% |
| federal | `brackets[2].limit` | 150473 | 151978 | +1.0% |
| federal | `brackets[3].limit` | 214368 | 216511 | +1.0% |
| federal | `basicPersonalAmount.max` | 13229 | 13808 | +4.4% |
| federal | `basicPersonalAmount.min` | 12298 | 12421 | +1.0% |
| federal | `basicPersonalAmount.from` | 150473 | 151978 | +1.0% |
| federal | `basicPersonalAmount.to` | 214368 | 216511 | +1.0% |
| federal | `employmentAmount` | 1245 | 1257 | +1.0% |
| federal | `indexation` | 0.019 | 0.01 | -47.4% |
| federal | `rrsp.limit` | 27230 | 27830 | +2.2% |
| federal | `payroll.cpp.ympe` | 58700 | 61600 | +4.9% |
| federal | `payroll.cpp.yampe` | 58700 | 61600 | +4.9% |
| federal | `payroll.cpp.enh1` | 0.003 | 0.005 | +66.7% |
| federal | `payroll.qpp.ympe` | 58700 | 61600 | +4.9% |
| federal | `payroll.qpp.yampe` | 58700 | 61600 | +4.9% |
| federal | `payroll.qpp.enh1` | 0.003 | 0.005 | +66.7% |
| federal | `payroll.ei.maxInsurable` | 54200 | 56300 | +3.9% |
| federal | `payroll.ei.quebecRate` | 0.012 | 0.0118 | -1.7% |
| federal | `payroll.qpip.maxInsurable` | 78500 | 83500 | +6.4% |
| federal | `childBenefit.perChildUnder6` | 6765 | 6833 | +1.0% |
| federal | `childBenefit.perChild6to17` | 5708 | 5765 | +1.0% |
| federal | `childBenefit.threshold1` | 31711 | 32028 | +1.0% |
| federal | `childBenefit.threshold2` | 68708 | 69395 | +1.0% |
| federal | `childBenefit.fixed2[1]` | 2590 | 2616 | +1.0% |
| federal | `childBenefit.fixed2[2]` | 4995 | 5044 | +1.0% |
| federal | `childBenefit.fixed2[3]` | 7029 | 7100 | +1.0% |
| federal | `childBenefit.fixed2[4]` | 8509 | 8594 | +1.0% |
| federal | `groceriesBenefit.adult` | 296 | 299 | +1.0% |
| federal | `groceriesBenefit.spouseOrFirstChild` | 296 | 299 | +1.0% |
| federal | `groceriesBenefit.child` | 155 | 157 | +1.3% |
| federal | `groceriesBenefit.singleSupplement.max` | 155 | 157 | +1.3% |
| federal | `groceriesBenefit.singleSupplement.from` | 9590 | 9686 | +1.0% |
| federal | `groceriesBenefit.phaseOut.from` | 38507 | 38892 | +1.0% |
| federal | `workersBenefit.estimationNote` | "Quebec's income-at-maximum thresholds … | "Quebec's income-at-maximum thresholds … |  |
| federal | `workersBenefit.standard.max[0]` | 1381 | 1395 | +1.0% |
| federal | `workersBenefit.standard.max[1]` | 2379 | 2403 | +1.0% |
| federal | `workersBenefit.standard.rate` | 0.26 | 0.27 | +3.8% |
| federal | `workersBenefit.standard.threshold[0]` | 13064 | 22944 | +75.6% |
| federal | `workersBenefit.standard.threshold[1]` | 17348 | 26177 | +50.9% |
| federal | `workersBenefit.standard.phaseOut[0]` | 0.12 | 0.15 | +25.0% |
| federal | `workersBenefit.standard.phaseOut[1]` | 0.12 | 0.15 | +25.0% |
| federal | `workersBenefit.secondaryEarnerExemption` | 0 | 14000 | n/a |
| federal | `workersBenefit.regional.AB.max[0]` | 1481 | 1495 | +0.9% |
| federal | `workersBenefit.regional.AB.max[1]` | 2216 | 2238 | +1.0% |
| federal | `workersBenefit.regional.AB.threshold[0]` | 13451 | 22350 | +66.2% |
| federal | `workersBenefit.regional.AB.threshold[1]` | 18291 | 28000 | +53.1% |
| federal | `workersBenefit.regional.AB.phaseOut[0]` | 0.12 | 0.15 | +25.0% |
| federal | `workersBenefit.regional.AB.phaseOut[1]` | 0.12 | 0.15 | +25.0% |
| federal | `workersBenefit.regional.NU.max[0]` | 1085 | 1385 | +27.6% |
| federal | `workersBenefit.regional.NU.max[1]` | 1630 | 2080 | +27.6% |
| federal | `workersBenefit.regional.NU.threshold[0]` | 21654 | 22925 | +5.9% |
| federal | `workersBenefit.regional.NU.threshold[1]` | 29551 | 31550 | +6.8% |
| federal | `workersBenefit.quebec.single[0]` | 0.274 | 0.373 | +36.1% |
| federal | `workersBenefit.quebec.single[2]` | 10864.014598540145 | 10982.01072386059 | +1.1% |
| federal | `workersBenefit.quebec.single[3]` | 12308.41 | 12385.8 | +0.6% |
| federal | `workersBenefit.quebec.couple[0]` | 0.274 | 0.373 | +36.1% |
| federal | `workersBenefit.quebec.couple[2]` | 16812.007299270073 | 17006.005361930293 | +1.2% |
| federal | `workersBenefit.quebec.couple[3]` | 18897.5 | 19001.73 | +0.6% |
| federal | `workersBenefit.quebec.parent[0]` | 0.15 | 0.2 | +33.3% |
| federal | `workersBenefit.quebec.parent[2]` | 10864 | 10982 | +1.1% |
| federal | `workersBenefit.quebec.parent[3]` | 12304.8 | 12402.83 | +0.8% |
| federal | `workersBenefit.quebec.coupleKids[0]` | 0.14 | 0.239 | +70.7% |
| federal | `workersBenefit.quebec.coupleKids[2]` | 16812 | 17005.983263598326 | +1.2% |
| federal | `workersBenefit.quebec.coupleKids[3]` | 18905.35 | 19051.09 | +0.8% |
| AB | `dividendTaxCredit.eligible` | 0.1 | 0.0812 | -18.8% |
| AB | `propertyTax.rate` | 0.007523 | 0.007407 | -1.5% |
| AB | `carbon.gasoline[0].from` | 2020-01-01 | 2021-01-01 |  |
| AB | `carbon.gasoline[0].rate` | 0.0442 | 0.0663 | +50.0% |
| AB | `carbon.gasoline[1].from` | 2020-04-01 | 2021-04-01 |  |
| AB | `carbon.gasoline[1].rate` | 0.0663 | 0.0884 | +33.3% |
| AB | `carbon.heating.amount` | 142.36 | 194.3 | +36.5% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2020-04-01 | 2021-04-01 |  |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 444 | 490 | +10.4% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 222 | 245 | +10.4% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 111 | 123 | +10.8% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 222 | 245 | +10.4% |
| BC | `brackets[0].limit` | 41725 | 42184 | +1.1% |
| BC | `brackets[1].limit` | 83451 | 84369 | +1.1% |
| BC | `brackets[2].limit` | 95812 | 96866 | +1.1% |
| BC | `brackets[3].limit` | 116344 | 117623 | +1.1% |
| BC | `brackets[4].limit` | 157748 | 159483 | +1.1% |
| BC | `brackets[5].limit` | 220000 | 222420 | +1.1% |
| BC | `basicPersonalAmount` | 10949 | 11070 | +1.1% |
| BC | `spouseAmount.max` | 9376 | 9479 | +1.1% |
| BC | `spouseAmount.threshold` | 938 | 948 | +1.1% |
| BC | `bcTaxReduction.max` | 476 | 481 | +1.1% |
| BC | `bcTaxReduction.threshold` | 21185 | 21418 | +1.1% |
| BC | `propertyTax.rate` | 0.00292568 | 0.0029225 | -0.1% |
| BC | `carbon.heating.amount` | 97.01 | 108.74 | +12.1% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2020-01-01 | 2021-01-01 |  |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 38.625 | 43.5 | +12.6% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 38.625 | 43.5 | +12.6% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 11.375 | 12.75 | +12.1% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 38.625 | 43.5 | +12.6% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].threshold[0]` | 34876 | 35748 | +2.5% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].threshold[1]` | 40689 | 41706 | +2.5% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].date` | 2020-04-01 | 2021-04-01 |  |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].adult` | 38.625 | 43.5 | +12.6% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].spouse` | 38.625 | 43.5 | +12.6% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 11.375 | 12.75 | +12.1% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 38.625 | 43.5 | +12.6% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].threshold[0]` | 34876 | 35748 | +2.5% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].threshold[1]` | 40689 | 41706 | +2.5% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].date` | 2020-07-01 | 2021-07-01 |  |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].adult` | 218 | 43.5 | -80.0% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].spouse` | 218 | 43.5 | -80.0% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].child` | 64 | 12.75 | -80.1% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].firstChild` | 218 | 43.5 | -80.0% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].threshold[0]` | 35748 | 36142 | +1.1% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].threshold[1]` | 41706 | 42165 | +1.1% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[3].date` | 2020-10-01 | 2021-10-01 |  |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[3].threshold[0]` | 35748 | 36142 | +1.1% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[3].threshold[1]` | 41706 | 42165 | +1.1% |
| MB | `brackets[0].limit` | 33389 | 33723 | +1.0% |
| MB | `brackets[1].limit` | 72164 | 72885 | +1.0% |
| MB | `basicPersonalAmount` | 9838 | 9936 | +1.0% |
| MB | `propertyTax.rate` | 0.012385350000000002 | 0.0124848 | +0.8% |
| MB | `credits[mb-school-tax-credits-rent-share].name` | Education property tax credit | School tax rebate and education propert… |  |
| MB | `credits[mb-school-tax-credits-rent-share].nameRenter` | Education property tax credit | Renters tax credit |  |
| MB | `credits[mb-school-tax-credits-rent-share].params.schoolTaxShare` | 0.5327180903244559 | 0.5256271626297578 | -1.3% |
| MB | `credits[mb-school-tax-credits-rent-share].params.schoolRebateRate` | 0 | 0.25 | n/a |
| MB | `credits[mb-school-tax-credits-rent-share].params.educationCreditMax` | 700 | 525 | -25.0% |
| MB | `credits[mb-school-tax-credits-rent-share].params.renterMax` | 700 | 525 | -25.0% |
| MB | `credits[mb-school-tax-credits-rent-share].params.renterShare` | 0.2 | 0.15 | -25.0% |
| MB | `carbon.gasoline[0].from` | 2020-01-01 | 2021-01-01 |  |
| MB | `carbon.gasoline[0].rate` | 0.0442 | 0.0663 | +50.0% |
| MB | `carbon.gasoline[1].from` | 2020-04-01 | 2021-04-01 |  |
| MB | `carbon.gasoline[1].rate` | 0.0663 | 0.0884 | +33.3% |
| MB | `carbon.heating.amount` | 71.24 | 97.24 | +36.5% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2020-04-01 | 2021-04-01 |  |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 243 | 360 | +48.1% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 121 | 180 | +48.8% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 61 | 90 | +47.5% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 121 | 180 | +48.8% |
| NB | `brackets[0].limit` | 43401 | 43835 | +1.0% |
| NB | `brackets[0].rate` | 0.0968 | 0.094 | -2.9% |
| NB | `brackets[1].limit` | 86803 | 87671 | +1.0% |
| NB | `brackets[2].limit` | 141122 | 142534 | +1.0% |
| NB | `brackets[3].limit` | 160776 | 162383 | +1.0% |
| NB | `basicPersonalAmount` | 10459 | 10564 | +1.0% |
| NB | `spouseAmount.max` | 8882 | 8970 | +1.0% |
| NB | `spouseAmount.threshold` | 889 | 898 | +1.0% |
| NB | `lowIncomeReduction.params.amount` | 678 | 684 | +0.9% |
| NB | `lowIncomeReduction.params.threshold` | 17455 | 17840 | +2.2% |
| NB | `carbon.gasoline[0].from` | 2020-01-01 | 2021-01-01 |  |
| NB | `carbon.gasoline[0].rate` | 0.0442 | 0.0663 | +50.0% |
| NB | `carbon.gasoline[1].from` | 2020-04-01 | 2021-04-01 |  |
| NB | `carbon.gasoline[1].rate` | 0.0663 | 0.0884 | +33.3% |
| NB | `carbon.heating.amount` | 6.42 | 6.26 | -2.5% |
| NL | `brackets[0].limit` | 37929 | 38081 | +0.4% |
| NL | `brackets[1].limit` | 75858 | 76161 | +0.4% |
| NL | `brackets[2].limit` | 135432 | 135973 | +0.4% |
| NL | `brackets[3].limit` | 189604 | 190363 | +0.4% |
| NL | `basicPersonalAmount` | 9498 | 9536 | +0.4% |
| NL | `spouseAmount.max` | 7761 | 7792 | +0.4% |
| NL | `spouseAmount.threshold` | 777 | 780 | +0.4% |
| NL | `lowIncomeReduction.params.individual` | 859 | 862 | +0.3% |
| NL | `lowIncomeReduction.params.family` | 479 | 481 | +0.4% |
| NL | `lowIncomeReduction.params.thresholdIndividual` | 20537 | 20619 | +0.4% |
| NL | `lowIncomeReduction.params.thresholdFamily` | 34727 | 34866 | +0.4% |
| NL | `childBenefit.params.perChild[0]` | 408.96 | 409.92 | +0.2% |
| NL | `childBenefit.params.perChild[1]` | 433.92 | 435.96 | +0.5% |
| NL | `childBenefit.params.perChild[2]` | 465.96 | 468 | +0.4% |
| NL | `childBenefit.params.perChild[3]` | 499.92 | 501.96 | +0.4% |
| NL | `carbon.gasoline[0].from` | 2020-01-01 | 2021-01-01 |  |
| NL | `carbon.gasoline[0].rate` | 0.0442 | 0.0663 | +50.0% |
| NL | `carbon.gasoline[1].from` | 2020-11-07 | 2021-07-01 |  |
| NL | `carbon.gasoline[1].rate` | 0.0663 | 0.0884 | +33.3% |
| NS | `propertyTax.rate` | 0.01196 | 0.01189 | -0.6% |
| NT | `brackets[0].limit` | 43957 | 44396 | +1.0% |
| NT | `brackets[1].limit` | 87916 | 88796 | +1.0% |
| NT | `brackets[2].limit` | 142932 | 144362 | +1.0% |
| NT | `basicPersonalAmount` | 15093 | 15243 | +1.0% |
| NT | `spouseAmount.max` | 15093 | 15243 | +1.0% |
| NT | `propertyTax.rate` | 0.00835 | 0.00849 | +1.7% |
| NT | `carbon.rebates[carbon-rebate-consolidated-payments].params.payments[0].date` | 2020-04-30 | 2021-01 |  |
| NT | `carbon.rebates[carbon-rebate-consolidated-payments].params.payments[0].adult` | 52 | 39 | -25.0% |
| NT | `carbon.rebates[carbon-rebate-consolidated-payments].params.payments[0].spouse` | 52 | 39 | -25.0% |
| NT | `carbon.rebates[carbon-rebate-consolidated-payments].params.payments[0].child` | 60 | 45 | -25.0% |
| NT | `carbon.rebates[carbon-rebate-consolidated-payments].params.payments[0].firstChild` | 60 | 45 | -25.0% |
| NT | `carbon.rebates[carbon-rebate-consolidated-payments].params.payments[0].smallPayment.multiplier` | 1 | 0 | -100.0% |
| NT | `carbon.rebates[carbon-rebate-consolidated-payments].params.payments[1].date` | 2020-07 | 2021-04 |  |
| NT | `carbon.rebates[carbon-rebate-consolidated-payments].params.payments[1].smallPayment.multiplier` | 4 | 0 | -100.0% |
| NT | `carbon.rebates[carbon-rebate-consolidated-payments].params.payments[2].date` | 2020-10 | 2021-07-01 |  |
| NT | `carbon.rebates[carbon-rebate-consolidated-payments].params.payments[2].adult` | 39 | 52 | +33.3% |
| NT | `carbon.rebates[carbon-rebate-consolidated-payments].params.payments[2].spouse` | 39 | 52 | +33.3% |
| NT | `carbon.rebates[carbon-rebate-consolidated-payments].params.payments[2].child` | 45 | 60 | +33.3% |
| NT | `carbon.rebates[carbon-rebate-consolidated-payments].params.payments[2].firstChild` | 45 | 60 | +33.3% |
| NT | `carbon.rebates[carbon-rebate-consolidated-payments].params.payments[2].smallPayment.multiplier` | 0 | 1 | n/a |
| NT | `carbon.gasoline[0].from` | 2020-01-01 | 2021-01-01 |  |
| NT | `carbon.gasoline[0].rate` | 0.047 | 0.07 | +48.9% |
| NT | `carbon.gasoline[1].from` | 2020-07-01 | 2021-07-01 |  |
| NT | `carbon.gasoline[1].rate` | 0.07 | 0.094 | +34.3% |
| NU | `brackets[0].limit` | 46277 | 46740 | +1.0% |
| NU | `brackets[1].limit` | 92555 | 93480 | +1.0% |
| NU | `brackets[2].limit` | 150473 | 151978 | +1.0% |
| NU | `basicPersonalAmount` | 16304 | 16467 | +1.0% |
| NU | `spouseAmount.max` | 16304 | 16467 | +1.0% |
| NU | `propertyTax.rate` | 0.01935 | 0.01954 | +1.0% |
| NU | `carbon.heating.amount` | 88.83 | 121.13 | +36.4% |
| NU | `carbon.gasoline[0].from` | 2020-01-01 | 2021-01-01 |  |
| NU | `carbon.gasoline[0].rate` | 0.0221 | 0.03315 | +50.0% |
| NU | `carbon.gasoline[1].from` | 2020-04-01 | 2021-04-01 |  |
| NU | `carbon.gasoline[1].rate` | 0.03315 | 0.0442 | +33.3% |
| ON | `brackets[0].limit` | 44740 | 45142 | +0.9% |
| ON | `brackets[1].limit` | 89482 | 90287 | +0.9% |
| ON | `basicPersonalAmount` | 10783 | 10880 | +0.9% |
| ON | `spouseAmount.max` | 9156 | 9238 | +0.9% |
| ON | `spouseAmount.threshold` | 915 | 924 | +1.0% |
| ON | `surtax[0][0]` | 4830 | 4874 | +0.9% |
| ON | `surtax[1][0]` | 6182 | 6237 | +0.9% |
| ON | `ontarioTaxReduction.base` | 249 | 251 | +0.8% |
| ON | `ontarioTaxReduction.perChild` | 460 | 464 | +0.9% |
| ON | `propertyTax.rate` | 0.00599704 | 0.00611013 | +1.9% |
| ON | `childBenefit.params.perChild` | 1461 | 1473.96 | +0.9% |
| ON | `childBenefit.params.threshold` | 22303 | 22504 | +0.9% |
| ON | `credits[ontario-sales-tax-credit].params.perPerson` | 313 | 316 | +1.0% |
| ON | `credits[ontario-sales-tax-credit].params.thresholdSingle` | 24115 | 24332 | +0.9% |
| ON | `credits[ontario-sales-tax-credit].params.thresholdFamily` | 30143 | 30415 | +0.9% |
| ON | `credits[ontario-energy-property-tax-credit].params.energyMax` | 241 | 243 | +0.8% |
| ON | `credits[ontario-energy-property-tax-credit].params.propertyBase` | 60 | 61 | +1.7% |
| ON | `credits[ontario-energy-property-tax-credit].params.propertyMax` | 784 | 791 | +0.9% |
| ON | `credits[ontario-energy-property-tax-credit].params.thresholdSingle` | 24115 | 24332 | +0.9% |
| ON | `credits[ontario-energy-property-tax-credit].params.thresholdFamily` | 30143 | 30415 | +0.9% |
| ON | `carbon.gasoline[0].from` | 2020-01-01 | 2021-01-01 |  |
| ON | `carbon.gasoline[0].rate` | 0.0442 | 0.0663 | +50.0% |
| ON | `carbon.gasoline[1].from` | 2020-04-01 | 2021-04-01 |  |
| ON | `carbon.gasoline[1].rate` | 0.0663 | 0.0884 | +33.3% |
| ON | `carbon.heating.amount` | 86.3 | 117.79 | +36.5% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2020-04-01 | 2021-04-01 |  |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 224 | 300 | +33.9% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 112 | 150 | +33.9% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 56 | 75 | +33.9% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 112 | 150 | +33.9% |
| PE | `basicPersonalAmount` | 10000 | 10500 | +5.0% |
| PE | `dividendTaxCredit.nonEligible` | 0.0274 | 0.0196 | -28.5% |
| PE | `spouseAmount.max` | 8493 | 8918 | +5.0% |
| PE | `spouseAmount.threshold` | 849 | 891 | +4.9% |
| PE | `lowIncomeReduction.params.threshold` | 18000 | 19000 | +5.6% |
| QC | `brackets[0].limit` | 44545 | 45105 | +1.3% |
| QC | `brackets[1].limit` | 89080 | 90200 | +1.3% |
| QC | `brackets[2].limit` | 108390 | 109755 | +1.3% |
| QC | `basicPersonalAmount` | 15532 | 15728 | +1.3% |
| QC | `dividendTaxCredit.nonEligible` | 0.0477 | 0.0401 | -15.9% |
| QC | `quebec.workerDeduction.max` | 1190 | 1205 | +1.3% |
| QC | `quebec.livingAlone.max` | 1780 | 1802 | +1.2% |
| QC | `quebec.livingAlone.threshold` | 35205 | 35650 | +1.3% |
| QC | `propertyTax.rate` | 0.007956 | 0.008118 | +2.0% |
| QC | `propertyTax.note` | "Ville-Marie proxy; school tax is bille… | school tax is billed separately |  |
| QC | `childBenefit.params.max` | 2515 | 2547 | +1.3% |
| QC | `childBenefit.params.maxSingleParent` | 882 | 893 | +1.2% |
| QC | `childBenefit.params.min` | 1000 | 1013 | +1.3% |
| QC | `childBenefit.params.minSingleParent` | 352 | 356 | +1.1% |
| QC | `childBenefit.params.thresholdSingle` | 36256 | 36728 | +1.3% |
| QC | `childBenefit.params.thresholdCouple` | 49842 | 50521 | +1.4% |
| QC | `childBenefit.params.schoolSupplies` | 104 | 105 | +1.0% |
| QC | `credits[quebec-solidarity-tax-credit].params.qstAdult` | 297 | 301 | +1.3% |
| QC | `credits[quebec-solidarity-tax-credit].params.qstSpouse` | 297 | 301 | +1.3% |
| QC | `credits[quebec-solidarity-tax-credit].params.qstAlone` | 141 | 143 | +1.4% |
| QC | `credits[quebec-solidarity-tax-credit].params.housingCouple` | 699 | 708 | +1.3% |
| QC | `credits[quebec-solidarity-tax-credit].params.housingSingle` | 577 | 584 | +1.2% |
| QC | `credits[quebec-solidarity-tax-credit].params.child` | 123 | 125 | +1.6% |
| QC | `credits[quebec-solidarity-tax-credit].params.threshold` | 35400 | 35845 | +1.3% |
| QC | `credits[quebec-work-premium].params.single[0]` | 0.108 | 0.112 | +3.7% |
| QC | `credits[quebec-work-premium].params.single[2]` | 10864 | 10982 | +1.1% |
| QC | `credits[quebec-work-premium].params.couple[0]` | 0.108 | 0.112 | +3.7% |
| QC | `credits[quebec-work-premium].params.couple[2]` | 16812 | 17006 | +1.2% |
| QC | `credits[quebec-work-premium].params.parent[2]` | 10864 | 10982 | +1.1% |
| QC | `credits[quebec-work-premium].params.coupleKids[2]` | 16812 | 17006 | +1.2% |
| SK | `brackets[0].limit` | 45225 | 45677 | +1.0% |
| SK | `brackets[1].limit` | 129214 | 130506 | +1.0% |
| SK | `basicPersonalAmount` | 16065 | 16225 | +1.0% |
| SK | `dividendTaxCredit.nonEligible` | 0.03362 | 0.01695 | -49.6% |
| SK | `spouseAmount.max` | 16065 | 16225 | +1.0% |
| SK | `spouseAmount.threshold` | 1607 | 1623 | +1.0% |
| SK | `childAmount.perChild` | 6094 | 6155 | +1.0% |
| SK | `propertyTax.rate` | 0.009120385600000001 | 0.009721518080000002 | +6.6% |
| SK | `credits[sk-low-income-tax-credit].params.adult` | 346 | 349 | +0.9% |
| SK | `credits[sk-low-income-tax-credit].params.spouse` | 346 | 349 | +0.9% |
| SK | `credits[sk-low-income-tax-credit].params.child` | 136 | 137 | +0.7% |
| SK | `credits[sk-low-income-tax-credit].params.threshold` | 32643 | 32986 | +1.1% |
| SK | `carbon.gasoline[0].from` | 2020-01-01 | 2021-01-01 |  |
| SK | `carbon.gasoline[0].rate` | 0.0442 | 0.0663 | +50.0% |
| SK | `carbon.gasoline[1].from` | 2020-04-01 | 2021-04-01 |  |
| SK | `carbon.gasoline[1].rate` | 0.0663 | 0.0884 | +33.3% |
| SK | `carbon.heating.amount` | 109.98 | 150.11 | +36.5% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2020-04-01 | 2021-04-01 |  |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 405 | 500 | +23.5% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 202 | 250 | +23.8% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 101 | 125 | +23.8% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 202 | 250 | +23.8% |
| YT | `brackets[0].limit` | 48535 | 49020 | +1.0% |
| YT | `brackets[1].limit` | 97069 | 98040 | +1.0% |
| YT | `brackets[2].limit` | 150473 | 151978 | +1.0% |
| YT | `dividendTaxCredit.nonEligible` | 0.023 | 0.0067 | -70.9% |
| YT | `propertyTax.rate` | 0.01084 | 0.0107 | -1.3% |
| YT | `carbon.heating.amount` | 129.21 | 176.21 | +36.4% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2020-04-30 | 2021-01-01 |  |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 43 | 48 | +11.6% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 43 | 48 | +11.6% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 43 | 48 | +11.6% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 43 | 48 | +11.6% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[1].date` | 2020-07-01 | 2021-04-01 |  |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[2].date` | 2020-10-01 | 2021-07-01 |  |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[2].adult` | 48 | 44 | -8.3% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[2].spouse` | 48 | 44 | -8.3% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[2].child` | 48 | 44 | -8.3% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[2].firstChild` | 48 | 44 | -8.3% |
| YT | `carbon.gasoline[0].from` | 2020-01-01 | 2021-01-01 |  |
| YT | `carbon.gasoline[0].rate` | 0.0442 | 0.0663 | +50.0% |
| YT | `carbon.gasoline[1].from` | 2020-04-01 | 2021-04-01 |  |
| YT | `carbon.gasoline[1].rate` | 0.0663 | 0.0884 | +33.3% |

</details>

<details><summary>4 unchanged values opted out</summary>

| File | In | Unchanged values | Why |
|---|---|---|---|
| MB | `familyTaxBenefit.params` | `basic` 2065, `dependant` 2065, `child` 2752, `childThrough` 18 | not indexed comment |

</details>
```

```text
> tax-visualizer@0.1.0 year-diff
> node --import tsx scripts/year-diff.ts 2022 2021

## Data diff: 2022 against 2021

310 values changed from 2021 to 2022 (60 over 15%), 129 amounts suspiciously unchanged, 10 added, 3 removed, 3 replaced. 4 unchanged values opted out.

### Suspiciously unchanged (129)

Amounts, thresholds and bracket limits that are the same in both years. If one is meant to stay put, say so with a `# not indexed` comment on its line (or `bracketsFrozenSince` for bracket limits).

| File | In | Unchanged values |
|---|---|---|
| federal | `payroll.cpp` | `exempt` 3500 |
| federal | `payroll.qpp` | `exempt` 3500 |
| federal | `workersBenefit.standard` | `floor[0]` 3000, `floor[1]` 3000 |
| federal | `workersBenefit.regional.AB` | `floor[0]` 2760, `floor[1]` 2760 |
| federal | `workersBenefit.regional.NU` | `floor[0]` 6000, `floor[1]` 6000 |
| federal | `workersBenefit.quebec` | `single[1]` 2400, `couple[1]` 3600, `parent[1]` 2400, `coupleKids[1]` 3600 |
| federal | `driving` | `efficiency` 9 |
| AB | `childBenefit.params` | `base[0]` 1330, `base[1]` 1995, `base[2]` 2660, `base[3]` 3325, `baseThreshold` 24467, `working[0]` 681, `working[1]` 1301, `working[2]` 1672, `working[3]` 1795, `workingFloor` 2760, `workingThreshold` 41000, `minAnnual` 10 |
| AB | `driving` | `distance` 16100 |
| BC | `driving` | `distance` 12900 |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments` | `[0].adult` 43.5, `[0].spouse` 43.5, `[0].child` 12.75, `[0].firstChild` 43.5, `[1].adult` 43.5, `[1].spouse` 43.5, `[1].child` 12.75, `[1].firstChild` 43.5 |
| MB | `spouseAmount` | `max` 9134 |
| MB | `driving` | `distance` 15000 |
| NB | `childBenefit.params` | `perChild` 250, `threshold` 20000 |
| NB | `childBenefit.params.workingIncomeSupplement` | `floor` 3750, `max` 250, `threshold` 20921 |
| NB | `credits[nb-hst-credit].params` | `adult` 300, `spouse` 300, `child` 100, `threshold` 35000 |
| NB | `driving` | `distance` 16100 |
| NL | `childBenefit.params` | `threshold` 17397 |
| NL | `credits[nl-income-supplement].params` | `extraFrom` 15000, `threshold` 40000 |
| NL | `driving` | `distance` 15100 |
| NS | `brackets` | `[0].limit` 29590, `[1].limit` 59180, `[2].limit` 93000, `[3].limit` 150000 |
| NS | `basicPersonalAmount` | `max` 11481, `min` 8481, `from` 25000, `to` 75000 |
| NS | `spouseAmount.params` | `max` 8481, `threshold` 848 |
| NS | `spouseAmount.params.supplement` | `max` 3000, `threshold` 25000 |
| NS | `childAmount` | `perChild` 1200 |
| NS | `lowIncomeReduction.params` | `individual` 300, `spouse` 300, `child` 165, `threshold` 15000 |
| NS | `credits[ns-affordable-living-tax-credit].params` | `base` 255, `child` 60, `threshold` 30000 |
| NS | `driving` | `distance` 17400 |
| NT | `childBenefit.params` | `under6[1]` 815, `under6[2]` 1467, `under6[3]` 1997, `under6[4]` 2445, `under6More` 367, `over6[1]` 652, `over6[2]` 1174, `over6[3]` 1597, `over6[4]` 1956, `over6More` 293, `fullUpTo` 30000, `endsAt` 80000 |
| NT | `driving` | `distance` 11000 |
| NU | `childAmount` | `perChild` 1200 |
| NU | `childBenefit.params` | `perChild` 330, `threshold` 20921 |
| NU | `driving` | `distance` 6800 |
| ON | `brackets` | `[2].limit` 150000, `[3].limit` 220000 |
| ON | `payroll` | `healthPremium[0][0]` 200000, `healthPremium[0][1]` 750, `healthPremium[0][3]` 900, `healthPremium[1][0]` 72000, `healthPremium[1][1]` 600, `healthPremium[1][3]` 750, `healthPremium[2][0]` 48000, `healthPremium[2][1]` 450, `healthPremium[2][3]` 600, `healthPremium[3][0]` 36000, `healthPremium[3][1]` 300, `healthPremium[3][3]` 450, `healthPremium[4][0]` 20000, `healthPremium[4][3]` 300 |
| ON | `driving` | `distance` 16200 |
| PE | `brackets` | `[0].limit` 31984, `[1].limit` 63969 |
| PE | `lowIncomeReduction.params` | `individual` 350, `spouse` 350, `child` 300 |
| PE | `credits[pei-sales-tax-credit].params` | `individual` 110, `spouseOrDependant` 55, `supplementFrom` 30000, `supplementMax` 55, `threshold` 50000 |
| PE | `childAmount` | `perChild` 1200 |
| PE | `postDividendSurtax.params` | `threshold` 12500 |
| PE | `driving` | `distance` 15100 |
| QC | `credits[quebec-work-premium].params` | `single[1]` 2400, `couple[1]` 3600, `parent[1]` 2400, `coupleKids[1]` 3600 |
| QC | `driving` | `distance` 14800 |
| SK | `driving` | `distance` 15300 |
| YT | `brackets` | `[3].limit` 500000 |
| YT | `childBenefit.params` | `perChild` 820, `threshold` 35000 |
| YT | `driving` | `distance` 13200 |

### Large changes, over 15% (60)

| File | Field | 2021 | 2022 | Change |
|---|---|--:|--:|--:|
| federal | `indexation` | 0.01 | 0.024 | +140.0% |
| federal | `payroll.cpp.enh1` | 0.005 | 0.0075 | +50.0% |
| federal | `payroll.qpp.enh1` | 0.005 | 0.0075 | +50.0% |
| AB | `carbon.gasoline[0].rate` | 0.0663 | 0.0884 | +33.3% |
| AB | `carbon.gasoline[1].rate` | 0.0884 | 0.1105 | +25.0% |
| AB | `carbon.heating.amount` | 194.3 | 246.14 | +26.7% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 490 | 269.5 | -45.0% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 245 | 135 | -44.9% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 123 | 67.5 | -45.1% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 245 | 135 | -44.9% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[3].adult` | 43.5 | 212.375 | +388.2% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[3].spouse` | 43.5 | 212.375 | +388.2% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[3].child` | 12.75 | 55.125 | +332.4% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[3].firstChild` | 43.5 | 212.375 | +388.2% |
| MB | `carbon.gasoline[0].rate` | 0.0663 | 0.0884 | +33.3% |
| MB | `carbon.gasoline[1].rate` | 0.0884 | 0.1105 | +25.0% |
| MB | `carbon.heating.amount` | 97.24 | 123.18 | +26.7% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 360 | 208 | -42.2% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 180 | 104 | -42.2% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 90 | 52 | -42.2% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 180 | 104 | -42.2% |
| NB | `carbon.gasoline[0].rate` | 0.0663 | 0.0884 | +33.3% |
| NB | `carbon.gasoline[1].rate` | 0.0884 | 0.1105 | +25.0% |
| NB | `carbon.heating.amount` | 6.26 | 7.93 | +26.7% |
| NL | `brackets[4].limit` | .inf | 250000 | n/a |
| NL | `dividendTaxCredit.eligible` | 0.054 | 0.063 | +16.7% |
| NL | `carbon.gasoline[0].rate` | 0.0663 | 0.0884 | +33.3% |
| NL | `carbon.gasoline[1].rate` | 0.0884 | 0.1105 | +25.0% |
| NT | `carbon.gasoline[0].rate` | 0.07 | 0.094 | +34.3% |
| NT | `carbon.gasoline[1].rate` | 0.094 | 0.117 | +24.5% |
| NU | `carbon.heating.amount` | 121.13 | 153.37 | +26.6% |
| NU | `carbon.gasoline[0].rate` | 0.03315 | 0.0442 | +33.3% |
| NU | `carbon.gasoline[1].rate` | 0.0442 | 0.05525 | +25.0% |
| ON | `lift.phaseOut` | 0.1 | 0.05 | -50.0% |
| ON | `carbon.gasoline[0].rate` | 0.0663 | 0.0884 | +33.3% |
| ON | `carbon.gasoline[1].rate` | 0.0884 | 0.1105 | +25.0% |
| ON | `carbon.heating.amount` | 117.79 | 149.21 | +26.7% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 300 | 186.5 | -37.8% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 150 | 93 | -38.0% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 75 | 46.5 | -38.0% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 150 | 93 | -38.0% |
| PE | `dividendTaxCredit.nonEligible` | 0.0196 | 0.013 | -33.7% |
| SK | `carbon.gasoline[0].rate` | 0.0663 | 0.0884 | +33.3% |
| SK | `carbon.gasoline[1].rate` | 0.0884 | 0.1105 | +25.0% |
| SK | `carbon.heating.amount` | 150.11 | 190.16 | +26.7% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 500 | 275 | -45.0% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 250 | 137.5 | -45.0% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 125 | 69 | -44.8% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 250 | 137.5 | -45.0% |
| YT | `carbon.heating.amount` | 176.21 | 223.11 | +26.6% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[2].adult` | 44 | 80 | +81.8% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[2].spouse` | 44 | 80 | +81.8% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[2].child` | 44 | 80 | +81.8% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[2].firstChild` | 44 | 80 | +81.8% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[3].adult` | 44 | 80 | +81.8% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[3].spouse` | 44 | 80 | +81.8% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[3].child` | 44 | 80 | +81.8% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[3].firstChild` | 44 | 80 | +81.8% |
| YT | `carbon.gasoline[0].rate` | 0.0663 | 0.0884 | +33.3% |
| YT | `carbon.gasoline[1].rate` | 0.0884 | 0.1105 | +25.0% |

### Added, removed and replaced (16)

| File | Field | | Value |
|---|---|---|---|
| AB | `propertyTax.estimated` | removed | true |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[1]` | added | {date: 2022-10-01, adult: 134.75, spouse: 67.5, child: 33.75, firstChild: 67.5,… |
| BC | `childBenefit` | replaced | {name: B.C. child opportunity benefit, program: bc-family-b… → {name: B.C. child opportunity / family benefit, program: bc… |
| MB | `credits[mb-school-tax-credits]` | added | {name: School tax rebate and education property tax credit, nameRenter: Renters… |
| MB | `credits[mb-school-tax-credits-rent-share]` | removed | {name: School tax rebate and education property tax credit, nameRenter: Renters… |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[1]` | added | {date: 2022-10-01, adult: 104, spouse: 52, child: 26, firstChild: 52, threshold… |
| NL | `brackets[5]` | added | [500000, 0.208] |
| NL | `brackets[6]` | added | [1000000, 0.213] |
| NL | `brackets[7]` | added | [.inf, 0.218] |
| NS | `childBenefit` | replaced | {name: Nova Scotia Child Benefit, program: nova-scotia-chil… → {name: Nova Scotia Child Benefit, program: nova-scotia-chil… |
| NT | `carbon.rebates[carbon-rebate-payments]` | added | {name: Cost of Living Offset, program: carbon-rebate-payments, params: {payment… |
| NT | `carbon.rebates[carbon-rebate-consolidated-payments]` | removed | {name: Cost of Living Offset, program: carbon-rebate-consolidated-payments, par… |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[1]` | added | {date: 2022-10-01, adult: 93.25, spouse: 46.5, child: 23.25, firstChild: 46.5, … |
| PE | `carbon.gasoline` | replaced | 0.0663 → [{from: 2022-01-01, rate: 0.0663}, {from: 2022-05-09, rate:… |
| PE | `carbon.rebates[pei-carbon-rebate-increment]` | added | {name: PEI carbon rebate, program: pei-carbon-rebate-increment, params: {paymen… |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[1]` | added | {date: 2022-10-01, adult: 137.5, spouse: 68.75, child: 34.5, firstChild: 68.75,… |

<details><summary>All 310 changed values</summary>

| File | Field | 2021 | 2022 | Change |
|---|---|--:|--:|--:|
| federal | `brackets[0].limit` | 49020 | 50197 | +2.4% |
| federal | `brackets[1].limit` | 98040 | 100392 | +2.4% |
| federal | `brackets[2].limit` | 151978 | 155625 | +2.4% |
| federal | `brackets[3].limit` | 216511 | 221708 | +2.4% |
| federal | `basicPersonalAmount.max` | 13808 | 14398 | +4.3% |
| federal | `basicPersonalAmount.min` | 12421 | 12719 | +2.4% |
| federal | `basicPersonalAmount.from` | 151978 | 155625 | +2.4% |
| federal | `basicPersonalAmount.to` | 216511 | 221708 | +2.4% |
| federal | `employmentAmount` | 1257 | 1287 | +2.4% |
| federal | `indexation` | 0.01 | 0.024 | +140.0% |
| federal | `rrsp.limit` | 27830 | 29210 | +5.0% |
| federal | `payroll.cpp.ympe` | 61600 | 64900 | +5.4% |
| federal | `payroll.cpp.yampe` | 61600 | 64900 | +5.4% |
| federal | `payroll.cpp.enh1` | 0.005 | 0.0075 | +50.0% |
| federal | `payroll.qpp.ympe` | 61600 | 64900 | +5.4% |
| federal | `payroll.qpp.yampe` | 61600 | 64900 | +5.4% |
| federal | `payroll.qpp.enh1` | 0.005 | 0.0075 | +50.0% |
| federal | `payroll.ei.maxInsurable` | 56300 | 60300 | +7.1% |
| federal | `payroll.ei.quebecRate` | 0.0118 | 0.012 | +1.7% |
| federal | `payroll.qpip.maxInsurable` | 83500 | 88000 | +5.4% |
| federal | `childBenefit.perChildUnder6` | 6833 | 6997 | +2.4% |
| federal | `childBenefit.perChild6to17` | 5765 | 5903 | +2.4% |
| federal | `childBenefit.threshold1` | 32028 | 32797 | +2.4% |
| federal | `childBenefit.threshold2` | 69395 | 71060 | +2.4% |
| federal | `childBenefit.fixed2[1]` | 2616 | 2678 | +2.4% |
| federal | `childBenefit.fixed2[2]` | 5044 | 5166 | +2.4% |
| federal | `childBenefit.fixed2[3]` | 7100 | 7270 | +2.4% |
| federal | `childBenefit.fixed2[4]` | 8594 | 8801 | +2.4% |
| federal | `groceriesBenefit.adult` | 299 | 306 | +2.3% |
| federal | `groceriesBenefit.spouseOrFirstChild` | 299 | 306 | +2.3% |
| federal | `groceriesBenefit.child` | 157 | 161 | +2.5% |
| federal | `groceriesBenefit.singleSupplement.max` | 157 | 161 | +2.5% |
| federal | `groceriesBenefit.singleSupplement.from` | 9686 | 9919 | +2.4% |
| federal | `groceriesBenefit.phaseOut.from` | 38892 | 39826 | +2.4% |
| federal | `workersBenefit.estimationNote` | "Quebec's income-at-maximum thresholds … | "Quebec's income-at-maximum thresholds … |  |
| federal | `workersBenefit.standard.max[0]` | 1395 | 1428 | +2.4% |
| federal | `workersBenefit.standard.max[1]` | 2403 | 2461 | +2.4% |
| federal | `workersBenefit.standard.threshold[0]` | 22944 | 23495 | +2.4% |
| federal | `workersBenefit.standard.threshold[1]` | 26177 | 26805 | +2.4% |
| federal | `workersBenefit.secondaryEarnerExemption` | 14000 | 14336 | +2.4% |
| federal | `workersBenefit.regional.AB.max[0]` | 1495 | 1531 | +2.4% |
| federal | `workersBenefit.regional.AB.max[1]` | 2238 | 2292 | +2.4% |
| federal | `workersBenefit.regional.AB.threshold[0]` | 22350 | 22886 | +2.4% |
| federal | `workersBenefit.regional.AB.threshold[1]` | 28000 | 28672 | +2.4% |
| federal | `workersBenefit.regional.NU.max[0]` | 1385 | 1418 | +2.4% |
| federal | `workersBenefit.regional.NU.max[1]` | 2080 | 2130 | +2.4% |
| federal | `workersBenefit.regional.NU.threshold[0]` | 22925 | 23475 | +2.4% |
| federal | `workersBenefit.regional.NU.threshold[1]` | 31550 | 32307 | +2.4% |
| federal | `workersBenefit.quebec.single[2]` | 10982.01072386059 | 11237.989276139411 | +2.3% |
| federal | `workersBenefit.quebec.single[3]` | 12385.8 | 12589.79 | +1.6% |
| federal | `workersBenefit.quebec.couple[2]` | 17006.005361930293 | 17397.989276139408 | +2.3% |
| federal | `workersBenefit.quebec.couple[3]` | 19001.73 | 19326.77 | +1.7% |
| federal | `workersBenefit.quebec.parent[2]` | 10982 | 11238 | +2.3% |
| federal | `workersBenefit.quebec.parent[3]` | 12402.83 | 12650.47 | +2.0% |
| federal | `workersBenefit.quebec.coupleKids[2]` | 17005.983263598326 | 17397.991631799163 | +2.3% |
| federal | `workersBenefit.quebec.coupleKids[3]` | 19051.09 | 19424.35 | +2.0% |
| AB | `brackets[0].limit` | 131220 | 134238 | +2.3% |
| AB | `brackets[1].limit` | 157464 | 161086 | +2.3% |
| AB | `brackets[2].limit` | 209952 | 214781 | +2.3% |
| AB | `brackets[3].limit` | 314928 | 322171 | +2.3% |
| AB | `basicPersonalAmount` | 19369 | 19814 | +2.3% |
| AB | `spouseAmount.max` | 19369 | 19814 | +2.3% |
| AB | `propertyTax.rate` | 0.007407 | 0.0071498 | -3.5% |
| AB | `carbon.gasoline[0].from` | 2021-01-01 | 2022-01-01 |  |
| AB | `carbon.gasoline[0].rate` | 0.0663 | 0.0884 | +33.3% |
| AB | `carbon.gasoline[1].from` | 2021-04-01 | 2022-04-01 |  |
| AB | `carbon.gasoline[1].rate` | 0.0884 | 0.1105 | +25.0% |
| AB | `carbon.heating.amount` | 194.3 | 246.14 | +26.7% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2021-04-01 | 2022-07-01 |  |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 490 | 269.5 | -45.0% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 245 | 135 | -44.9% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 123 | 67.5 | -45.1% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 245 | 135 | -44.9% |
| BC | `brackets[0].limit` | 42184 | 43070 | +2.1% |
| BC | `brackets[1].limit` | 84369 | 86141 | +2.1% |
| BC | `brackets[2].limit` | 96866 | 98901 | +2.1% |
| BC | `brackets[3].limit` | 117623 | 120094 | +2.1% |
| BC | `brackets[4].limit` | 159483 | 162832 | +2.1% |
| BC | `brackets[5].limit` | 222420 | 227091 | +2.1% |
| BC | `basicPersonalAmount` | 11070 | 11302 | +2.1% |
| BC | `spouseAmount.max` | 9479 | 9678 | +2.1% |
| BC | `spouseAmount.threshold` | 948 | 968 | +2.1% |
| BC | `bcTaxReduction.max` | 481 | 491 | +2.1% |
| BC | `bcTaxReduction.threshold` | 21418 | 21867 | +2.1% |
| BC | `propertyTax.rate` | 0.0029225 | 0.00269293 | -7.9% |
| BC | `carbon.gasoline[0].from` | 2021-01-01 | 2022-01-01 |  |
| BC | `carbon.gasoline[0].rate` | 0.0889 | 0.0996 | +12.0% |
| BC | `carbon.gasoline[1].from` | 2021-04-01 | 2022-04-01 |  |
| BC | `carbon.gasoline[1].rate` | 0.0996 | 0.1105 | +10.9% |
| BC | `carbon.heating.amount` | 108.74 | 121.9 | +12.1% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2021-01-01 | 2022-01-01 |  |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].threshold[0]` | 35748 | 36142 | +1.1% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].threshold[1]` | 41706 | 42165 | +1.1% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].date` | 2021-04-01 | 2022-04-01 |  |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].threshold[0]` | 35748 | 36142 | +1.1% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].threshold[1]` | 41706 | 42165 | +1.1% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].date` | 2021-07-01 | 2022-07-01 |  |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].adult` | 43.5 | 48.375 | +11.2% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].spouse` | 43.5 | 48.375 | +11.2% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].child` | 12.75 | 14.125 | +10.8% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].firstChild` | 43.5 | 48.375 | +11.2% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].threshold[0]` | 36142 | 36901 | +2.1% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].threshold[1]` | 42165 | 43051 | +2.1% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[3].date` | 2021-10-01 | 2022-10-01 |  |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[3].adult` | 43.5 | 212.375 | +388.2% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[3].spouse` | 43.5 | 212.375 | +388.2% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[3].child` | 12.75 | 55.125 | +332.4% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[3].firstChild` | 43.5 | 212.375 | +388.2% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[3].threshold[0]` | 36142 | 36901 | +2.1% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[3].threshold[1]` | 42165 | 43051 | +2.1% |
| MB | `brackets[0].limit` | 33723 | 34431 | +2.1% |
| MB | `brackets[1].limit` | 72885 | 74416 | +2.1% |
| MB | `basicPersonalAmount` | 9936 | 10145 | +2.1% |
| MB | `propertyTax.rate` | 0.0124848 | 0.01260675 | +1.0% |
| MB | `carbon.gasoline[0].from` | 2021-01-01 | 2022-01-01 |  |
| MB | `carbon.gasoline[0].rate` | 0.0663 | 0.0884 | +33.3% |
| MB | `carbon.gasoline[1].from` | 2021-04-01 | 2022-04-01 |  |
| MB | `carbon.gasoline[1].rate` | 0.0884 | 0.1105 | +25.0% |
| MB | `carbon.heating.amount` | 97.24 | 123.18 | +26.7% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2021-04-01 | 2022-07-01 |  |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 360 | 208 | -42.2% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 180 | 104 | -42.2% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 90 | 52 | -42.2% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 180 | 104 | -42.2% |
| NB | `brackets[0].limit` | 43835 | 44887 | +2.4% |
| NB | `brackets[1].limit` | 87671 | 89775 | +2.4% |
| NB | `brackets[2].limit` | 142534 | 145955 | +2.4% |
| NB | `brackets[3].limit` | 162383 | 166280 | +2.4% |
| NB | `basicPersonalAmount` | 10564 | 11720 | +10.9% |
| NB | `spouseAmount.max` | 8970 | 9186 | +2.4% |
| NB | `spouseAmount.threshold` | 898 | 919 | +2.3% |
| NB | `lowIncomeReduction.params.amount` | 684 | 701 | +2.5% |
| NB | `lowIncomeReduction.params.threshold` | 17840 | 19177 | +7.5% |
| NB | `propertyTax.rate` | 0.016497 | 0.015472 | -6.2% |
| NB | `carbon.gasoline[0].from` | 2021-01-01 | 2022-01-01 |  |
| NB | `carbon.gasoline[0].rate` | 0.0663 | 0.0884 | +33.3% |
| NB | `carbon.gasoline[1].from` | 2021-04-01 | 2022-04-01 |  |
| NB | `carbon.gasoline[1].rate` | 0.0884 | 0.1105 | +25.0% |
| NB | `carbon.heating.amount` | 6.26 | 7.93 | +26.7% |
| NL | `brackets[0].limit` | 38081 | 39147 | +2.8% |
| NL | `brackets[1].limit` | 76161 | 78294 | +2.8% |
| NL | `brackets[2].limit` | 135973 | 139780 | +2.8% |
| NL | `brackets[3].limit` | 190363 | 195693 | +2.8% |
| NL | `brackets[3].rate` | 0.173 | 0.178 | +2.9% |
| NL | `brackets[4].limit` | .inf | 250000 | n/a |
| NL | `brackets[4].rate` | 0.183 | 0.198 | +8.2% |
| NL | `basicPersonalAmount` | 9536 | 9803 | +2.8% |
| NL | `dividendTaxCredit.eligible` | 0.054 | 0.063 | +16.7% |
| NL | `dividendTaxCredit.nonEligible` | 0.035 | 0.032 | -8.6% |
| NL | `spouseAmount.max` | 7792 | 8011 | +2.8% |
| NL | `spouseAmount.threshold` | 780 | 802 | +2.8% |
| NL | `lowIncomeReduction.params.individual` | 862 | 886 | +2.8% |
| NL | `lowIncomeReduction.params.family` | 481 | 494 | +2.7% |
| NL | `lowIncomeReduction.params.thresholdIndividual` | 20619 | 21196 | +2.8% |
| NL | `lowIncomeReduction.params.thresholdFamily` | 34866 | 35842 | +2.8% |
| NL | `propertyTax.rate` | 0.0077 | 0.0083 | +7.8% |
| NL | `childBenefit.params.perChild[0]` | 409.92 | 421.92 | +2.9% |
| NL | `childBenefit.params.perChild[1]` | 435.96 | 447.96 | +2.8% |
| NL | `childBenefit.params.perChild[2]` | 468 | 480.96 | +2.8% |
| NL | `childBenefit.params.perChild[3]` | 501.96 | 516 | +2.8% |
| NL | `credits[nl-income-supplement].params.base` | 220 | 242 | +10.0% |
| NL | `credits[nl-income-supplement].params.extraMax` | 230 | 253 | +10.0% |
| NL | `credits[nl-income-supplement].params.extraRate` | 0.046 | 0.0506 | +10.0% |
| NL | `credits[nl-income-supplement].params.couple` | 60 | 66 | +10.0% |
| NL | `credits[nl-income-supplement].params.child` | 200 | 220 | +10.0% |
| NL | `carbon.gasoline[0].from` | 2021-01-01 | 2022-01-01 |  |
| NL | `carbon.gasoline[0].rate` | 0.0663 | 0.0884 | +33.3% |
| NL | `carbon.gasoline[1].from` | 2021-07-01 | 2022-05-01 |  |
| NL | `carbon.gasoline[1].rate` | 0.0884 | 0.1105 | +25.0% |
| NS | `propertyTax.rate` | 0.01189 | 0.01154 | -2.9% |
| NT | `brackets[0].limit` | 44396 | 45462 | +2.4% |
| NT | `brackets[1].limit` | 88796 | 90927 | +2.4% |
| NT | `brackets[2].limit` | 144362 | 147826 | +2.4% |
| NT | `basicPersonalAmount` | 15243 | 15609 | +2.4% |
| NT | `spouseAmount.max` | 15243 | 15609 | +2.4% |
| NT | `propertyTax.rate` | 0.00849 | 0.00899 | +5.9% |
| NT | `carbon.gasoline[0].from` | 2021-01-01 | 2022-01-01 |  |
| NT | `carbon.gasoline[0].rate` | 0.07 | 0.094 | +34.3% |
| NT | `carbon.gasoline[1].from` | 2021-07-01 | 2022-07-01 |  |
| NT | `carbon.gasoline[1].rate` | 0.094 | 0.117 | +24.5% |
| NU | `brackets[0].limit` | 46740 | 47862 | +2.4% |
| NU | `brackets[1].limit` | 93480 | 95724 | +2.4% |
| NU | `brackets[2].limit` | 151978 | 155625 | +2.4% |
| NU | `basicPersonalAmount` | 16467 | 16862 | +2.4% |
| NU | `spouseAmount.max` | 16467 | 16862 | +2.4% |
| NU | `propertyTax.rate` | 0.01954 | 0.02013 | +3.0% |
| NU | `carbon.heating.amount` | 121.13 | 153.37 | +26.6% |
| NU | `carbon.gasoline[0].from` | 2021-01-01 | 2022-01-01 |  |
| NU | `carbon.gasoline[0].rate` | 0.03315 | 0.0442 | +33.3% |
| NU | `carbon.gasoline[1].from` | 2021-04-01 | 2022-04-01 |  |
| NU | `carbon.gasoline[1].rate` | 0.0442 | 0.05525 | +25.0% |
| ON | `brackets[0].limit` | 45142 | 46226 | +2.4% |
| ON | `brackets[1].limit` | 90287 | 92454 | +2.4% |
| ON | `basicPersonalAmount` | 10880 | 11141 | +2.4% |
| ON | `spouseAmount.max` | 9238 | 9460 | +2.4% |
| ON | `spouseAmount.threshold` | 924 | 946 | +2.4% |
| ON | `surtax[0][0]` | 4874 | 4991 | +2.4% |
| ON | `surtax[1][0]` | 6237 | 6387 | +2.4% |
| ON | `ontarioTaxReduction.base` | 251 | 257 | +2.4% |
| ON | `ontarioTaxReduction.perChild` | 464 | 475 | +2.4% |
| ON | `lift.max` | 850 | 875 | +2.9% |
| ON | `lift.threshold` | 30000 | 32500 | +8.3% |
| ON | `lift.familyThreshold` | 60000 | 65000 | +8.3% |
| ON | `lift.phaseOut` | 0.1 | 0.05 | -50.0% |
| ON | `propertyTax.rate` | 0.00611013 | 0.00631933 | +3.4% |
| ON | `childBenefit.params.perChild` | 1473.96 | 1509 | +2.4% |
| ON | `childBenefit.params.threshold` | 22504 | 23044 | +2.4% |
| ON | `credits[ontario-sales-tax-credit].params.perPerson` | 316 | 324 | +2.5% |
| ON | `credits[ontario-sales-tax-credit].params.thresholdSingle` | 24332 | 24916 | +2.4% |
| ON | `credits[ontario-sales-tax-credit].params.thresholdFamily` | 30415 | 31144 | +2.4% |
| ON | `credits[ontario-energy-property-tax-credit].params.energyMax` | 243 | 249 | +2.5% |
| ON | `credits[ontario-energy-property-tax-credit].params.propertyBase` | 61 | 62 | +1.6% |
| ON | `credits[ontario-energy-property-tax-credit].params.propertyMax` | 791 | 810 | +2.4% |
| ON | `credits[ontario-energy-property-tax-credit].params.thresholdSingle` | 24332 | 24916 | +2.4% |
| ON | `credits[ontario-energy-property-tax-credit].params.thresholdFamily` | 30415 | 31144 | +2.4% |
| ON | `carbon.gasoline[0].from` | 2021-01-01 | 2022-01-01 |  |
| ON | `carbon.gasoline[0].rate` | 0.0663 | 0.0884 | +33.3% |
| ON | `carbon.gasoline[1].from` | 2021-04-01 | 2022-04-01 |  |
| ON | `carbon.gasoline[1].rate` | 0.0884 | 0.1105 | +25.0% |
| ON | `carbon.heating.amount` | 117.79 | 149.21 | +26.7% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2021-04-01 | 2022-07-01 |  |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 300 | 186.5 | -37.8% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 150 | 93 | -38.0% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 75 | 46.5 | -38.0% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 150 | 93 | -38.0% |
| PE | `basicPersonalAmount` | 10500 | 11250 | +7.1% |
| PE | `dividendTaxCredit.nonEligible` | 0.0196 | 0.013 | -33.7% |
| PE | `spouseAmount.max` | 8918 | 9555 | +7.1% |
| PE | `spouseAmount.threshold` | 891 | 955 | +7.2% |
| PE | `lowIncomeReduction.params.threshold` | 19000 | 20000 | +5.3% |
| QC | `brackets[0].limit` | 45105 | 46295 | +2.6% |
| QC | `brackets[1].limit` | 90200 | 92580 | +2.6% |
| QC | `brackets[2].limit` | 109755 | 112655 | +2.6% |
| QC | `basicPersonalAmount` | 15728 | 16143 | +2.6% |
| QC | `dividendTaxCredit.nonEligible` | 0.0401 | 0.0342 | -14.7% |
| QC | `quebec.workerDeduction.max` | 1205 | 1235 | +2.5% |
| QC | `quebec.livingAlone.max` | 1802 | 1850 | +2.7% |
| QC | `quebec.livingAlone.threshold` | 35650 | 36590 | +2.6% |
| QC | `propertyTax.rate` | 0.008118 | 0.007953 | -2.0% |
| QC | `childBenefit.params.max` | 2547 | 2614 | +2.6% |
| QC | `childBenefit.params.maxSingleParent` | 893 | 917 | +2.7% |
| QC | `childBenefit.params.min` | 1013 | 1040 | +2.7% |
| QC | `childBenefit.params.minSingleParent` | 356 | 365 | +2.5% |
| QC | `childBenefit.params.thresholdSingle` | 36728 | 37752 | +2.8% |
| QC | `childBenefit.params.thresholdCouple` | 50521 | 51893 | +2.7% |
| QC | `childBenefit.params.schoolSupplies` | 105 | 108 | +2.9% |
| QC | `credits[quebec-solidarity-tax-credit].params.qstAdult` | 301 | 309 | +2.7% |
| QC | `credits[quebec-solidarity-tax-credit].params.qstSpouse` | 301 | 309 | +2.7% |
| QC | `credits[quebec-solidarity-tax-credit].params.qstAlone` | 143 | 147 | +2.8% |
| QC | `credits[quebec-solidarity-tax-credit].params.housingCouple` | 708 | 727 | +2.7% |
| QC | `credits[quebec-solidarity-tax-credit].params.housingSingle` | 584 | 599 | +2.6% |
| QC | `credits[quebec-solidarity-tax-credit].params.child` | 125 | 128 | +2.4% |
| QC | `credits[quebec-solidarity-tax-credit].params.threshold` | 35845 | 36790 | +2.6% |
| QC | `credits[quebec-work-premium].params.single[0]` | 0.112 | 0.116 | +3.6% |
| QC | `credits[quebec-work-premium].params.single[2]` | 10982 | 11238 | +2.3% |
| QC | `credits[quebec-work-premium].params.couple[0]` | 0.112 | 0.116 | +3.6% |
| QC | `credits[quebec-work-premium].params.couple[2]` | 17006 | 17398 | +2.3% |
| QC | `credits[quebec-work-premium].params.parent[2]` | 10982 | 11238 | +2.3% |
| QC | `credits[quebec-work-premium].params.coupleKids[2]` | 17006 | 17398 | +2.3% |
| SK | `brackets[0].limit` | 45677 | 46773 | +2.4% |
| SK | `brackets[1].limit` | 130506 | 133638 | +2.4% |
| SK | `basicPersonalAmount` | 16225 | 16615 | +2.4% |
| SK | `spouseAmount.max` | 16225 | 16615 | +2.4% |
| SK | `spouseAmount.threshold` | 1623 | 1662 | +2.4% |
| SK | `childAmount.perChild` | 6155 | 6303 | +2.4% |
| SK | `propertyTax.rate` | 0.009721518080000002 | 0.010024999184000002 | +3.1% |
| SK | `credits[sk-low-income-tax-credit].params.adult` | 349 | 358 | +2.6% |
| SK | `credits[sk-low-income-tax-credit].params.spouse` | 349 | 358 | +2.6% |
| SK | `credits[sk-low-income-tax-credit].params.child` | 137 | 141 | +2.9% |
| SK | `credits[sk-low-income-tax-credit].params.rate` | 0.0275 | 0.0275006888950124 | +0.0% |
| SK | `credits[sk-low-income-tax-credit].params.threshold` | 32986 | 33755 | +2.3% |
| SK | `carbon.gasoline[0].from` | 2021-01-01 | 2022-01-01 |  |
| SK | `carbon.gasoline[0].rate` | 0.0663 | 0.0884 | +33.3% |
| SK | `carbon.gasoline[1].from` | 2021-04-01 | 2022-04-01 |  |
| SK | `carbon.gasoline[1].rate` | 0.0884 | 0.1105 | +25.0% |
| SK | `carbon.heating.amount` | 150.11 | 190.16 | +26.7% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2021-04-01 | 2022-07-01 |  |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 500 | 275 | -45.0% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 250 | 137.5 | -45.0% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 125 | 69 | -44.8% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 250 | 137.5 | -45.0% |
| YT | `brackets[0].limit` | 49020 | 50197 | +2.4% |
| YT | `brackets[1].limit` | 98040 | 100392 | +2.4% |
| YT | `brackets[2].limit` | 151978 | 155625 | +2.4% |
| YT | `propertyTax.rate` | 0.0107 | 0.01054 | -1.5% |
| YT | `carbon.heating.amount` | 176.21 | 223.11 | +26.6% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2021-01-01 | 2022-01-01 |  |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 48 | 44 | -8.3% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 48 | 44 | -8.3% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 48 | 44 | -8.3% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 48 | 44 | -8.3% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[1].date` | 2021-04-01 | 2022-04-01 |  |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[1].adult` | 48 | 44 | -8.3% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[1].spouse` | 48 | 44 | -8.3% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 48 | 44 | -8.3% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 48 | 44 | -8.3% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[2].date` | 2021-07-01 | 2022-07-01 |  |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[2].adult` | 44 | 80 | +81.8% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[2].spouse` | 44 | 80 | +81.8% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[2].child` | 44 | 80 | +81.8% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[2].firstChild` | 44 | 80 | +81.8% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[3].date` | 2021-10-01 | 2022-10-01 |  |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[3].adult` | 44 | 80 | +81.8% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[3].spouse` | 44 | 80 | +81.8% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[3].child` | 44 | 80 | +81.8% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[3].firstChild` | 44 | 80 | +81.8% |
| YT | `carbon.gasoline[0].from` | 2021-01-01 | 2022-01-01 |  |
| YT | `carbon.gasoline[0].rate` | 0.0663 | 0.0884 | +33.3% |
| YT | `carbon.gasoline[1].from` | 2021-04-01 | 2022-04-01 |  |
| YT | `carbon.gasoline[1].rate` | 0.0884 | 0.1105 | +25.0% |

</details>

<details><summary>4 unchanged values opted out</summary>

| File | In | Unchanged values | Why |
|---|---|---|---|
| MB | `familyTaxBenefit.params` | `basic` 2065, `dependant` 2065, `child` 2752, `childThrough` 18 | not indexed comment |

</details>
```

```text
> tax-visualizer@0.1.0 year-diff
> node --import tsx scripts/year-diff.ts 2023 2022

## Data diff: 2023 against 2022

375 values changed from 2022 to 2023 (124 over 15%), 113 amounts suspiciously unchanged, 15 added, 3 removed, 2 replaced. 4 unchanged values opted out.

### Suspiciously unchanged (113)

Amounts, thresholds and bracket limits that are the same in both years. If one is meant to stay put, say so with a `# not indexed` comment on its line (or `bracketsFrozenSince` for bracket limits).

| File | In | Unchanged values |
|---|---|---|
| federal | `payroll.cpp` | `exempt` 3500 |
| federal | `payroll.qpp` | `exempt` 3500 |
| federal | `workersBenefit.standard` | `floor[0]` 3000, `floor[1]` 3000 |
| federal | `workersBenefit.regional.AB` | `floor[0]` 2760, `floor[1]` 2760 |
| federal | `workersBenefit.regional.NU` | `floor[0]` 6000, `floor[1]` 6000 |
| federal | `workersBenefit.quebec` | `single[1]` 2400, `couple[1]` 3600, `parent[1]` 2400, `coupleKids[1]` 3600 |
| federal | `driving` | `efficiency` 9 |
| AB | `childBenefit.params` | `workingFloor` 2760, `minAnnual` 10 |
| AB | `driving` | `distance` 16100 |
| BC | `driving` | `distance` 12900 |
| MB | `spouseAmount` | `max` 9134 |
| MB | `credits[mb-school-tax-credits].params` | `renterMax` 525 |
| MB | `driving` | `distance` 15000 |
| NB | `childBenefit.params` | `perChild` 250, `threshold` 20000 |
| NB | `childBenefit.params.workingIncomeSupplement` | `floor` 3750, `max` 250, `threshold` 20921 |
| NB | `credits[nb-hst-credit].params` | `adult` 300, `spouse` 300, `child` 100, `threshold` 35000 |
| NB | `driving` | `distance` 16100 |
| NL | `credits[nl-income-supplement].params` | `extraFrom` 15000, `threshold` 40000 |
| NL | `driving` | `distance` 15100 |
| NS | `brackets` | `[0].limit` 29590, `[1].limit` 59180, `[2].limit` 93000, `[3].limit` 150000 |
| NS | `basicPersonalAmount` | `max` 11481, `min` 8481, `from` 25000, `to` 75000 |
| NS | `spouseAmount.params` | `max` 8481, `threshold` 848 |
| NS | `spouseAmount.params.supplement` | `max` 3000, `threshold` 25000 |
| NS | `childAmount` | `perChild` 1200 |
| NS | `lowIncomeReduction.params` | `individual` 300, `spouse` 300, `child` 165, `threshold` 15000 |
| NS | `childBenefit.params` | `fullBelow` 26000, `partialBelow` 34000 |
| NS | `credits[ns-affordable-living-tax-credit].params` | `base` 255, `child` 60, `threshold` 30000 |
| NS | `driving` | `distance` 17400 |
| NT | `childBenefit.params` | `under6[1]` 815, `under6[2]` 1467, `under6[3]` 1997, `under6[4]` 2445, `under6More` 367, `over6[1]` 652, `over6[2]` 1174, `over6[3]` 1597, `over6[4]` 1956, `over6More` 293, `fullUpTo` 30000, `endsAt` 80000 |
| NT | `driving` | `distance` 11000 |
| NU | `childAmount` | `perChild` 1200 |
| NU | `driving` | `distance` 6800 |
| ON | `brackets` | `[2].limit` 150000, `[3].limit` 220000 |
| ON | `lift` | `max` 875, `threshold` 32500, `familyThreshold` 65000 |
| ON | `payroll` | `healthPremium[0][0]` 200000, `healthPremium[0][1]` 750, `healthPremium[0][3]` 900, `healthPremium[1][0]` 72000, `healthPremium[1][1]` 600, `healthPremium[1][3]` 750, `healthPremium[2][0]` 48000, `healthPremium[2][1]` 450, `healthPremium[2][3]` 600, `healthPremium[3][0]` 36000, `healthPremium[3][1]` 300, `healthPremium[3][3]` 450, `healthPremium[4][0]` 20000, `healthPremium[4][3]` 300 |
| ON | `driving` | `distance` 16200 |
| PE | `brackets` | `[0].limit` 31984, `[1].limit` 63969 |
| PE | `lowIncomeReduction.params` | `individual` 350, `spouse` 350, `child` 300 |
| PE | `credits[pei-sales-tax-credit].params` | `individual` 110, `spouseOrDependant` 55, `supplementFrom` 30000, `supplementMax` 55, `threshold` 50000 |
| PE | `childAmount` | `perChild` 1200 |
| PE | `postDividendSurtax.params` | `threshold` 12500 |
| PE | `driving` | `distance` 15100 |
| QC | `credits[quebec-work-premium].params` | `single[1]` 2400, `couple[1]` 3600, `parent[1]` 2400, `coupleKids[1]` 3600 |
| QC | `driving` | `distance` 14800 |
| SK | `driving` | `distance` 15300 |
| YT | `brackets` | `[3].limit` 500000 |
| YT | `childBenefit.params` | `threshold` 35000 |
| YT | `driving` | `distance` 13200 |

### Large changes, over 15% (124)

| File | Field | 2022 | 2023 | Change |
|---|---|--:|--:|--:|
| federal | `indexation` | 0.024 | 0.063 | +162.5% |
| federal | `payroll.cpp.enh1` | 0.0075 | 0.01 | +33.3% |
| federal | `payroll.qpp.enh1` | 0.0075 | 0.01 | +33.3% |
| AB | `carbon.gasoline[0].rate` | 0.0884 | 0.1105 | +25.0% |
| AB | `carbon.gasoline[1].rate` | 0.1105 | 0.1431 | +29.5% |
| AB | `carbon.heating.amount` | 246.14 | 310.73 | +26.2% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 269.5 | 134.75 | -50.0% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 135 | 67.5 | -50.0% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 67.5 | 33.75 | -50.0% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 135 | 67.5 | -50.0% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[1].adult` | 134.75 | 193 | +43.2% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[1].spouse` | 67.5 | 96.5 | +43.0% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 33.75 | 48.25 | +43.0% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 67.5 | 96.5 | +43.0% |
| BC | `carbon.gasoline[1].rate` | 0.1105 | 0.1431 | +29.5% |
| BC | `carbon.heating.amount` | 121.9 | 149.98 | +23.0% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 43.5 | 212.375 | +388.2% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 43.5 | 212.375 | +388.2% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 12.75 | 55.125 | +332.4% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 43.5 | 212.375 | +388.2% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].adult` | 43.5 | 212.375 | +388.2% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].spouse` | 43.5 | 212.375 | +388.2% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 12.75 | 55.125 | +332.4% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 43.5 | 212.375 | +388.2% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].adult` | 48.375 | 111.75 | +131.0% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].spouse` | 48.375 | 55.875 | +15.5% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].child` | 14.125 | 27.875 | +97.3% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].firstChild` | 48.375 | 55.875 | +15.5% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].threshold[1]` | 43051 | 50170 | +16.5% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[3].adult` | 212.375 | 111.75 | -47.4% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[3].spouse` | 212.375 | 55.875 | -73.7% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[3].child` | 55.125 | 27.875 | -49.4% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[3].firstChild` | 212.375 | 55.875 | -73.7% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[3].threshold[1]` | 43051 | 50170 | +16.5% |
| MB | `basicPersonalAmount` | 10145 | 15000 | +47.9% |
| MB | `credits[mb-school-tax-credits].params.schoolRebateRate` | 0.375 | 0.5 | +33.3% |
| MB | `credits[mb-school-tax-credits].params.educationCreditMax` | 437.5 | 350 | -20.0% |
| MB | `carbon.gasoline[0].rate` | 0.0884 | 0.1105 | +25.0% |
| MB | `carbon.gasoline[1].rate` | 0.1105 | 0.1431 | +29.5% |
| MB | `carbon.heating.amount` | 123.18 | 155.5 | +26.2% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 208 | 104 | -50.0% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 104 | 52 | -50.0% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 52 | 26 | -50.0% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 104 | 52 | -50.0% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[1].adult` | 104 | 132 | +26.9% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[1].spouse` | 52 | 66 | +26.9% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 26 | 33 | +26.9% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 52 | 66 | +26.9% |
| NB | `brackets[2].limit` | 145955 | 176756 | +21.1% |
| NB | `brackets[3].limit` | 166280 | .inf | n/a |
| NB | `carbon.gasoline[0].rate` | 0.0884 | 0.1105 | +25.0% |
| NB | `carbon.gasoline[1].rate` | 0.1105 | 0.1431 | +29.5% |
| NB | `carbon.heating.amount` | 7.93 | 18.04 | +127.5% |
| NL | `carbon.gasoline[0].rate` | 0.0884 | 0.1105 | +25.0% |
| NL | `carbon.gasoline[1].rate` | 0.1105 | 0.1431 | +29.5% |
| NL | `carbon.heating.amount` | 0 | 24.03 | n/a |
| NS | `childBenefit.params.perChild` | 1275 | 1525 | +19.6% |
| NS | `childBenefit.params.partialOtherChildren` | 637.5 | 762.5 | +19.6% |
| NT | `carbon.heating.amount` | 0 | 315.05 | n/a |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 52 | 65 | +25.0% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 52 | 65 | +25.0% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 60 | 75 | +25.0% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 60 | 75 | +25.0% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[1].adult` | 52 | 65 | +25.0% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[1].spouse` | 52 | 65 | +25.0% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 60 | 75 | +25.0% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 60 | 75 | +25.0% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[2].adult` | 65 | 110.25 | +69.6% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[2].spouse` | 65 | 110.25 | +69.6% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[2].child` | 75 | 123.25 | +64.3% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[2].firstChild` | 75 | 123.25 | +64.3% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[3].adult` | 65 | 110.25 | +69.6% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[3].spouse` | 65 | 110.25 | +69.6% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[3].child` | 75 | 123.25 | +64.3% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[3].firstChild` | 75 | 123.25 | +64.3% |
| NT | `carbon.gasoline[0].rate` | 0.094 | 0.117 | +24.5% |
| NT | `carbon.gasoline[1].rate` | 0.117 | 0.1431 | +22.3% |
| NU | `carbon.heating.amount` | 153.37 | 294.11 | +91.8% |
| NU | `carbon.gasoline[0].rate` | 0.0442 | 0.05525 | +25.0% |
| NU | `carbon.gasoline[1].rate` | 0.05525 | 0.1431 | +159.0% |
| ON | `carbon.gasoline[0].rate` | 0.0884 | 0.1105 | +25.0% |
| ON | `carbon.gasoline[1].rate` | 0.1105 | 0.1431 | +29.5% |
| ON | `carbon.heating.amount` | 149.21 | 187.75 | +25.8% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 186.5 | 93.25 | -50.0% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 93 | 46.5 | -50.0% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 46.5 | 23.25 | -50.0% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 93 | 46.5 | -50.0% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[1].adult` | 93.25 | 122 | +30.8% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[1].spouse` | 46.5 | 61 | +31.2% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 23.25 | 30.5 | +31.2% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 46.5 | 61 | +31.2% |
| PE | `carbon.gasoline[0].rate` | 0.0663 | 0.1105 | +66.7% |
| PE | `carbon.gasoline[1].rate` | 0.1105 | 0.1431 | +29.5% |
| PE | `carbon.heating.amount` | 0 | 59.39 | n/a |
| SK | `dividendTaxCredit.nonEligible` | 0.01695 | 0.02105 | +24.2% |
| SK | `carbon.gasoline[0].rate` | 0.0884 | 0.1105 | +25.0% |
| SK | `carbon.gasoline[1].rate` | 0.1105 | 0.1431 | +29.5% |
| SK | `carbon.heating.amount` | 190.16 | 240.06 | +26.2% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 275 | 137.5 | -50.0% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 137.5 | 68.75 | -50.0% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 69 | 34.5 | -50.0% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 137.5 | 68.75 | -50.0% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[1].adult` | 137.5 | 170 | +23.6% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[1].spouse` | 68.75 | 85 | +23.6% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 34.5 | 42.5 | +23.2% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 68.75 | 85 | +23.6% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 44 | 80 | +81.8% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 44 | 80 | +81.8% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 44 | 80 | +81.8% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 44 | 80 | +81.8% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[1].adult` | 44 | 80 | +81.8% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[1].spouse` | 44 | 80 | +81.8% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 44 | 80 | +81.8% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 44 | 80 | +81.8% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[2].adult` | 80 | 93 | +16.3% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[2].spouse` | 80 | 93 | +16.3% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[2].child` | 80 | 93 | +16.3% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[2].firstChild` | 80 | 93 | +16.3% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[3].adult` | 80 | 93 | +16.3% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[3].spouse` | 80 | 93 | +16.3% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[3].child` | 80 | 93 | +16.3% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[3].firstChild` | 80 | 93 | +16.3% |
| YT | `carbon.gasoline[0].rate` | 0.0884 | 0.1105 | +25.0% |
| YT | `carbon.gasoline[1].rate` | 0.1105 | 0.1431 | +29.5% |

### Added, removed and replaced (20)

| File | Field | | Value |
|---|---|---|---|
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[2]` | added | {date: 2023-07-01, adult: 193, spouse: 96.5, child: 48.25, firstChild: 96.5, th… |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[3]` | added | {date: 2023-10-01, adult: 193, spouse: 96.5, child: 48.25, firstChild: 96.5, th… |
| BC | `creditsUseRent` | added | true |
| BC | `childBenefit` | replaced | {name: B.C. child opportunity / family benefit, program: bc… → {name: B.C. family benefit, program: bc-family-benefit, par… |
| BC | `credits` | added | [{name: "B.C. renter's tax credit", program: bc-renters-tax-credit, params: {ma… |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[2]` | added | {date: 2023-07-01, adult: 132, spouse: 66, child: 33, firstChild: 66, threshold… |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[3]` | added | {date: 2023-10-01, adult: 132, spouse: 66, child: 33, firstChild: 66, threshold… |
| NB | `brackets[4]` | removed | [.inf, 0.203] |
| NB | `carbon.rebates[carbon-rebate-payments]` | added | {program: carbon-rebate-payments, name: Climate Action Incentive / Canada Carbo… |
| NL | `childBenefit` | replaced | {name: NL Child Benefit, program: nl-child-benefit-reductio… → {name: NL Child Benefit, program: nl-child-benefit-periods,… |
| NL | `carbon.rebates[carbon-rebate-payments]` | added | {program: carbon-rebate-payments, name: Climate Action Incentive / Canada Carbo… |
| NS | `carbon` | added | {name: Federal carbon pricing, gasoline: [{from: 2023-01-01, rate: 0}, {from: 2… |
| NU | `carbon.rebates[carbon-rebate-payments]` | added | {name: Nunavut Carbon Credit, program: carbon-rebate-payments, params: {payment… |
| NU | `carbon.gasoline[1].note` | removed | Net household rate after the statutory 50% point-of-sale rebate |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[2]` | added | {date: 2023-07-01, adult: 122, spouse: 61, child: 30.5, firstChild: 61, thresho… |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[3]` | added | {date: 2023-10-01, adult: 122, spouse: 61, child: 30.5, firstChild: 61, thresho… |
| PE | `carbon.rebates[carbon-rebate-payments]` | added | {program: carbon-rebate-payments, name: Climate Action Incentive / Canada Carbo… |
| PE | `carbon.rebates[pei-carbon-rebate-increment]` | removed | {name: PEI carbon rebate, program: pei-carbon-rebate-increment, params: {paymen… |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[2]` | added | {date: 2023-07-01, adult: 170, spouse: 85, child: 42.5, firstChild: 85, thresho… |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[3]` | added | {date: 2023-10-01, adult: 170, spouse: 85, child: 42.5, firstChild: 85, thresho… |

<details><summary>All 375 changed values</summary>

| File | Field | 2022 | 2023 | Change |
|---|---|--:|--:|--:|
| federal | `brackets[0].limit` | 50197 | 53359 | +6.3% |
| federal | `brackets[1].limit` | 100392 | 106717 | +6.3% |
| federal | `brackets[2].limit` | 155625 | 165430 | +6.3% |
| federal | `brackets[3].limit` | 221708 | 235675 | +6.3% |
| federal | `basicPersonalAmount.max` | 14398 | 15000 | +4.2% |
| federal | `basicPersonalAmount.min` | 12719 | 13521 | +6.3% |
| federal | `basicPersonalAmount.from` | 155625 | 165430 | +6.3% |
| federal | `basicPersonalAmount.to` | 221708 | 235675 | +6.3% |
| federal | `employmentAmount` | 1287 | 1368 | +6.3% |
| federal | `indexation` | 0.024 | 0.063 | +162.5% |
| federal | `rrsp.limit` | 29210 | 30780 | +5.4% |
| federal | `payroll.cpp.ympe` | 64900 | 66600 | +2.6% |
| federal | `payroll.cpp.yampe` | 64900 | 66600 | +2.6% |
| federal | `payroll.cpp.enh1` | 0.0075 | 0.01 | +33.3% |
| federal | `payroll.qpp.ympe` | 64900 | 66600 | +2.6% |
| federal | `payroll.qpp.yampe` | 64900 | 66600 | +2.6% |
| federal | `payroll.qpp.enh1` | 0.0075 | 0.01 | +33.3% |
| federal | `payroll.ei.maxInsurable` | 60300 | 61500 | +2.0% |
| federal | `payroll.ei.rate` | 0.0158 | 0.0163 | +3.2% |
| federal | `payroll.ei.quebecRate` | 0.012 | 0.0127 | +5.8% |
| federal | `payroll.qpip.maxInsurable` | 88000 | 91000 | +3.4% |
| federal | `childBenefit.perChildUnder6` | 6997 | 7437 | +6.3% |
| federal | `childBenefit.perChild6to17` | 5903 | 6275 | +6.3% |
| federal | `childBenefit.threshold1` | 32797 | 34863 | +6.3% |
| federal | `childBenefit.threshold2` | 71060 | 75537 | +6.3% |
| federal | `childBenefit.fixed2[1]` | 2678 | 2847 | +6.3% |
| federal | `childBenefit.fixed2[2]` | 5166 | 5491 | +6.3% |
| federal | `childBenefit.fixed2[3]` | 7270 | 7728 | +6.3% |
| federal | `childBenefit.fixed2[4]` | 8801 | 9355 | +6.3% |
| federal | `groceriesBenefit.adult` | 306 | 325 | +6.2% |
| federal | `groceriesBenefit.spouseOrFirstChild` | 306 | 325 | +6.2% |
| federal | `groceriesBenefit.child` | 161 | 171 | +6.2% |
| federal | `groceriesBenefit.singleSupplement.max` | 161 | 171 | +6.2% |
| federal | `groceriesBenefit.singleSupplement.from` | 9919 | 10544 | +6.3% |
| federal | `groceriesBenefit.phaseOut.from` | 39826 | 42335 | +6.3% |
| federal | `workersBenefit.estimationNote` | "Quebec's income-at-maximum thresholds … | "Quebec's income-at-maximum thresholds … |  |
| federal | `workersBenefit.standard.max[0]` | 1428 | 1518 | +6.3% |
| federal | `workersBenefit.standard.max[1]` | 2461 | 2616 | +6.3% |
| federal | `workersBenefit.standard.threshold[0]` | 23495 | 24975 | +6.3% |
| federal | `workersBenefit.standard.threshold[1]` | 26805 | 28494 | +6.3% |
| federal | `workersBenefit.secondaryEarnerExemption` | 14336 | 15239 | +6.3% |
| federal | `workersBenefit.regional.AB.max[0]` | 1531 | 1627 | +6.3% |
| federal | `workersBenefit.regional.AB.max[1]` | 2292 | 2436 | +6.3% |
| federal | `workersBenefit.regional.AB.threshold[0]` | 22886 | 24328 | +6.3% |
| federal | `workersBenefit.regional.AB.threshold[1]` | 28672 | 30478 | +6.3% |
| federal | `workersBenefit.regional.NU.max[0]` | 1418 | 1508 | +6.3% |
| federal | `workersBenefit.regional.NU.max[1]` | 2130 | 2264 | +6.3% |
| federal | `workersBenefit.regional.NU.threshold[0]` | 23475 | 24954 | +6.3% |
| federal | `workersBenefit.regional.NU.threshold[1]` | 32307 | 34343 | +6.3% |
| federal | `workersBenefit.quebec.single[2]` | 11237.989276139411 | 11842.010723860589 | +5.4% |
| federal | `workersBenefit.quebec.single[3]` | 12589.79 | 13294.87 | +5.6% |
| federal | `workersBenefit.quebec.couple[2]` | 17397.989276139408 | 18337.98927613941 | +5.4% |
| federal | `workersBenefit.quebec.couple[3]` | 19326.77 | 20412.45 | +5.6% |
| federal | `workersBenefit.quebec.parent[2]` | 11238 | 11842 | +5.4% |
| federal | `workersBenefit.quebec.parent[3]` | 12650.47 | 13400.24 | +5.9% |
| federal | `workersBenefit.quebec.coupleKids[2]` | 17397.991631799163 | 18337.991631799166 | +5.4% |
| federal | `workersBenefit.quebec.coupleKids[3]` | 19424.35 | 20563.57 | +5.9% |
| AB | `brackets[0].limit` | 134238 | 142292 | +6.0% |
| AB | `brackets[1].limit` | 161086 | 170751 | +6.0% |
| AB | `brackets[2].limit` | 214781 | 227668 | +6.0% |
| AB | `brackets[3].limit` | 322171 | 341502 | +6.0% |
| AB | `basicPersonalAmount` | 19814 | 21003 | +6.0% |
| AB | `spouseAmount.max` | 19814 | 21003 | +6.0% |
| AB | `propertyTax.rate` | 0.0071498 | 0.0065718 | -8.1% |
| AB | `childBenefit.params.base[0]` | 1330 | 1410 | +6.0% |
| AB | `childBenefit.params.base[1]` | 1995 | 2115 | +6.0% |
| AB | `childBenefit.params.base[2]` | 2660 | 2820 | +6.0% |
| AB | `childBenefit.params.base[3]` | 3325 | 3525 | +6.0% |
| AB | `childBenefit.params.baseThreshold` | 24467 | 25935 | +6.0% |
| AB | `childBenefit.params.working[0]` | 681 | 722 | +6.0% |
| AB | `childBenefit.params.working[1]` | 1301 | 1379 | +6.0% |
| AB | `childBenefit.params.working[2]` | 1672 | 1772 | +6.0% |
| AB | `childBenefit.params.working[3]` | 1795 | 1902 | +6.0% |
| AB | `childBenefit.params.workingThreshold` | 41000 | 43460 | +6.0% |
| AB | `carbon.gasoline[0].from` | 2022-01-01 | 2023-01-01 |  |
| AB | `carbon.gasoline[0].rate` | 0.0884 | 0.1105 | +25.0% |
| AB | `carbon.gasoline[1].from` | 2022-04-01 | 2023-04-01 |  |
| AB | `carbon.gasoline[1].rate` | 0.1105 | 0.1431 | +29.5% |
| AB | `carbon.heating.amount` | 246.14 | 310.73 | +26.2% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2022-07-01 | 2023-01-01 |  |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 269.5 | 134.75 | -50.0% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 135 | 67.5 | -50.0% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 67.5 | 33.75 | -50.0% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 135 | 67.5 | -50.0% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[1].date` | 2022-10-01 | 2023-04-01 |  |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[1].adult` | 134.75 | 193 | +43.2% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[1].spouse` | 67.5 | 96.5 | +43.0% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 33.75 | 48.25 | +43.0% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 67.5 | 96.5 | +43.0% |
| BC | `brackets[0].limit` | 43070 | 45654 | +6.0% |
| BC | `brackets[1].limit` | 86141 | 91310 | +6.0% |
| BC | `brackets[2].limit` | 98901 | 104835 | +6.0% |
| BC | `brackets[3].limit` | 120094 | 127299 | +6.0% |
| BC | `brackets[4].limit` | 162832 | 172602 | +6.0% |
| BC | `brackets[5].limit` | 227091 | 240716 | +6.0% |
| BC | `basicPersonalAmount` | 11302 | 11981 | +6.0% |
| BC | `spouseAmount.max` | 9678 | 10259 | +6.0% |
| BC | `spouseAmount.threshold` | 968 | 1026 | +6.0% |
| BC | `bcTaxReduction.max` | 491 | 521 | +6.1% |
| BC | `bcTaxReduction.threshold` | 21867 | 23179 | +6.0% |
| BC | `propertyTax.rate` | 0.00269293 | 0.0027807 | +3.3% |
| BC | `carbon.gasoline[0].from` | 2022-01-01 | 2023-01-01 |  |
| BC | `carbon.gasoline[0].rate` | 0.0996 | 0.1105 | +10.9% |
| BC | `carbon.gasoline[1].from` | 2022-04-01 | 2023-04-01 |  |
| BC | `carbon.gasoline[1].rate` | 0.1105 | 0.1431 | +29.5% |
| BC | `carbon.heating.amount` | 121.9 | 149.98 | +23.0% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2022-01-01 | 2023-01-01 |  |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 43.5 | 212.375 | +388.2% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 43.5 | 212.375 | +388.2% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 12.75 | 55.125 | +332.4% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 43.5 | 212.375 | +388.2% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].threshold[0]` | 36142 | 36901 | +2.1% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].threshold[1]` | 42165 | 43051 | +2.1% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].date` | 2022-04-01 | 2023-04-01 |  |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].adult` | 43.5 | 212.375 | +388.2% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].spouse` | 43.5 | 212.375 | +388.2% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 12.75 | 55.125 | +332.4% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 43.5 | 212.375 | +388.2% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].threshold[0]` | 36142 | 36901 | +2.1% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].threshold[1]` | 42165 | 43051 | +2.1% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].date` | 2022-07-01 | 2023-07-01 |  |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].adult` | 48.375 | 111.75 | +131.0% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].spouse` | 48.375 | 55.875 | +15.5% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].child` | 14.125 | 27.875 | +97.3% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].firstChild` | 48.375 | 55.875 | +15.5% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].threshold[0]` | 36901 | 39115 | +6.0% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].threshold[1]` | 43051 | 50170 | +16.5% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[3].date` | 2022-10-01 | 2023-10-01 |  |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[3].adult` | 212.375 | 111.75 | -47.4% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[3].spouse` | 212.375 | 55.875 | -73.7% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[3].child` | 55.125 | 27.875 | -49.4% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[3].firstChild` | 212.375 | 55.875 | -73.7% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[3].threshold[0]` | 36901 | 39115 | +6.0% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[3].threshold[1]` | 43051 | 50170 | +16.5% |
| MB | `brackets[0].limit` | 34431 | 36842 | +7.0% |
| MB | `brackets[1].limit` | 74416 | 79625 | +7.0% |
| MB | `basicPersonalAmount` | 10145 | 15000 | +47.9% |
| MB | `propertyTax.rate` | 0.01260675 | 0.011897550000000002 | -5.6% |
| MB | `credits[mb-school-tax-credits].params.schoolTaxShare` | 0.5192575406032482 | 0.5120844207420855 | -1.4% |
| MB | `credits[mb-school-tax-credits].params.schoolRebateRate` | 0.375 | 0.5 | +33.3% |
| MB | `credits[mb-school-tax-credits].params.educationCreditMax` | 437.5 | 350 | -20.0% |
| MB | `carbon.gasoline[0].from` | 2022-01-01 | 2023-01-01 |  |
| MB | `carbon.gasoline[0].rate` | 0.0884 | 0.1105 | +25.0% |
| MB | `carbon.gasoline[1].from` | 2022-04-01 | 2023-04-01 |  |
| MB | `carbon.gasoline[1].rate` | 0.1105 | 0.1431 | +29.5% |
| MB | `carbon.heating.amount` | 123.18 | 155.5 | +26.2% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2022-07-01 | 2023-01-01 |  |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 208 | 104 | -50.0% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 104 | 52 | -50.0% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 52 | 26 | -50.0% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 104 | 52 | -50.0% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[1].date` | 2022-10-01 | 2023-04-01 |  |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[1].adult` | 104 | 132 | +26.9% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[1].spouse` | 52 | 66 | +26.9% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 26 | 33 | +26.9% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 52 | 66 | +26.9% |
| NB | `brackets[0].limit` | 44887 | 47715 | +6.3% |
| NB | `brackets[1].limit` | 89775 | 95431 | +6.3% |
| NB | `brackets[1].rate` | 0.1482 | 0.14 | -5.5% |
| NB | `brackets[2].limit` | 145955 | 176756 | +21.1% |
| NB | `brackets[2].rate` | 0.1652 | 0.16 | -3.1% |
| NB | `brackets[3].limit` | 166280 | .inf | n/a |
| NB | `brackets[3].rate` | 0.1784 | 0.195 | +9.3% |
| NB | `basicPersonalAmount` | 11720 | 12458 | +6.3% |
| NB | `spouseAmount.max` | 9186 | 9764 | +6.3% |
| NB | `spouseAmount.threshold` | 919 | 977 | +6.3% |
| NB | `lowIncomeReduction.params.amount` | 701 | 746 | +6.4% |
| NB | `lowIncomeReduction.params.threshold` | 19177 | 20385 | +6.3% |
| NB | `propertyTax.rate` | 0.015472 | 0.014443 | -6.7% |
| NB | `carbon.gasoline[0].from` | 2022-01-01 | 2023-01-01 |  |
| NB | `carbon.gasoline[0].rate` | 0.0884 | 0.1105 | +25.0% |
| NB | `carbon.gasoline[1].from` | 2022-04-01 | 2023-07-01 |  |
| NB | `carbon.gasoline[1].rate` | 0.1105 | 0.1431 | +29.5% |
| NB | `carbon.heating.amount` | 7.93 | 18.04 | +127.5% |
| NL | `brackets[0].limit` | 39147 | 41457 | +5.9% |
| NL | `brackets[1].limit` | 78294 | 82913 | +5.9% |
| NL | `brackets[2].limit` | 139780 | 148027 | +5.9% |
| NL | `brackets[3].limit` | 195693 | 207239 | +5.9% |
| NL | `brackets[4].limit` | 250000 | 264750 | +5.9% |
| NL | `brackets[5].limit` | 500000 | 529500 | +5.9% |
| NL | `brackets[6].limit` | 1000000 | 1059000 | +5.9% |
| NL | `basicPersonalAmount` | 9803 | 10382 | +5.9% |
| NL | `spouseAmount.max` | 8011 | 8483 | +5.9% |
| NL | `spouseAmount.threshold` | 802 | 849 | +5.9% |
| NL | `lowIncomeReduction.params.individual` | 886 | 936 | +5.6% |
| NL | `lowIncomeReduction.params.family` | 494 | 523 | +5.9% |
| NL | `lowIncomeReduction.params.thresholdIndividual` | 21196 | 22447 | +5.9% |
| NL | `lowIncomeReduction.params.thresholdFamily` | 35842 | 37957 | +5.9% |
| NL | `credits[nl-income-supplement].params.base` | 242 | 254 | +5.0% |
| NL | `credits[nl-income-supplement].params.extraMax` | 253 | 266 | +5.1% |
| NL | `credits[nl-income-supplement].params.extraRate` | 0.0506 | 0.0532 | +5.1% |
| NL | `credits[nl-income-supplement].params.couple` | 66 | 69 | +4.5% |
| NL | `credits[nl-income-supplement].params.child` | 220 | 231 | +5.0% |
| NL | `carbon.gasoline[0].from` | 2022-01-01 | 2023-01-01 |  |
| NL | `carbon.gasoline[0].rate` | 0.0884 | 0.1105 | +25.0% |
| NL | `carbon.gasoline[1].from` | 2022-05-01 | 2023-07-01 |  |
| NL | `carbon.gasoline[1].rate` | 0.1105 | 0.1431 | +29.5% |
| NL | `carbon.heating.amount` | 0 | 24.03 | n/a |
| NS | `propertyTax.rate` | 0.01154 | 0.01115 | -3.4% |
| NS | `childBenefit.params.perChild` | 1275 | 1525 | +19.6% |
| NS | `childBenefit.params.partialOtherChildren` | 637.5 | 762.5 | +19.6% |
| NT | `brackets[0].limit` | 45462 | 48326 | +6.3% |
| NT | `brackets[1].limit` | 90927 | 96655 | +6.3% |
| NT | `brackets[2].limit` | 147826 | 157139 | +6.3% |
| NT | `basicPersonalAmount` | 15609 | 16593 | +6.3% |
| NT | `spouseAmount.max` | 15609 | 16593 | +6.3% |
| NT | `propertyTax.rate` | 0.00899 | 0.00924 | +2.8% |
| NT | `carbon.heating.amount` | 0 | 315.05 | n/a |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2022-01-01 | 2023-01-01 |  |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 52 | 65 | +25.0% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 52 | 65 | +25.0% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 60 | 75 | +25.0% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 60 | 75 | +25.0% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[1].date` | 2022-04-01 | 2023-04-01 |  |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[1].adult` | 52 | 65 | +25.0% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[1].spouse` | 52 | 65 | +25.0% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 60 | 75 | +25.0% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 60 | 75 | +25.0% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[2].date` | 2022-07-01 | 2023-07-01 |  |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[2].adult` | 65 | 110.25 | +69.6% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[2].spouse` | 65 | 110.25 | +69.6% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[2].child` | 75 | 123.25 | +64.3% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[2].firstChild` | 75 | 123.25 | +64.3% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[3].date` | 2022-10-01 | 2023-10-01 |  |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[3].adult` | 65 | 110.25 | +69.6% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[3].spouse` | 65 | 110.25 | +69.6% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[3].child` | 75 | 123.25 | +64.3% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[3].firstChild` | 75 | 123.25 | +64.3% |
| NT | `carbon.gasoline[0].from` | 2022-01-01 | 2023-01-01 |  |
| NT | `carbon.gasoline[0].rate` | 0.094 | 0.117 | +24.5% |
| NT | `carbon.gasoline[1].from` | 2022-07-01 | 2023-04-01 |  |
| NT | `carbon.gasoline[1].rate` | 0.117 | 0.1431 | +22.3% |
| NU | `brackets[0].limit` | 47862 | 50877 | +6.3% |
| NU | `brackets[1].limit` | 95724 | 101754 | +6.3% |
| NU | `brackets[2].limit` | 155625 | 165429 | +6.3% |
| NU | `basicPersonalAmount` | 16862 | 17925 | +6.3% |
| NU | `spouseAmount.max` | 16862 | 17925 | +6.3% |
| NU | `propertyTax.rate` | 0.02013 | 0.02033 | +1.0% |
| NU | `childBenefit.params.perChild` | 330 | 346.92 | +5.1% |
| NU | `childBenefit.params.threshold` | 20921 | 21999 | +5.2% |
| NU | `carbon.heating.amount` | 153.37 | 294.11 | +91.8% |
| NU | `carbon.gasoline[0].from` | 2022-01-01 | 2023-01-01 |  |
| NU | `carbon.gasoline[0].rate` | 0.0442 | 0.05525 | +25.0% |
| NU | `carbon.gasoline[1].from` | 2022-04-01 | 2023-04-01 |  |
| NU | `carbon.gasoline[1].rate` | 0.05525 | 0.1431 | +159.0% |
| ON | `brackets[0].limit` | 46226 | 49231 | +6.5% |
| ON | `brackets[1].limit` | 92454 | 98463 | +6.5% |
| ON | `basicPersonalAmount` | 11141 | 11865 | +6.5% |
| ON | `spouseAmount.max` | 9460 | 10075 | +6.5% |
| ON | `spouseAmount.threshold` | 946 | 1007 | +6.4% |
| ON | `surtax[0][0]` | 4991 | 5315 | +6.5% |
| ON | `surtax[1][0]` | 6387 | 6802 | +6.5% |
| ON | `ontarioTaxReduction.base` | 257 | 274 | +6.6% |
| ON | `ontarioTaxReduction.perChild` | 475 | 506 | +6.5% |
| ON | `propertyTax.rate` | 0.00631933 | 0.00666274 | +5.4% |
| ON | `childBenefit.params.perChild` | 1509 | 1606.92 | +6.5% |
| ON | `childBenefit.params.threshold` | 23044 | 24542 | +6.5% |
| ON | `credits[ontario-sales-tax-credit].params.perPerson` | 324 | 345 | +6.5% |
| ON | `credits[ontario-sales-tax-credit].params.thresholdSingle` | 24916 | 26535 | +6.5% |
| ON | `credits[ontario-sales-tax-credit].params.thresholdFamily` | 31144 | 33169 | +6.5% |
| ON | `credits[ontario-energy-property-tax-credit].params.energyMax` | 249 | 265 | +6.4% |
| ON | `credits[ontario-energy-property-tax-credit].params.propertyBase` | 62 | 66 | +6.5% |
| ON | `credits[ontario-energy-property-tax-credit].params.propertyMax` | 810 | 863 | +6.5% |
| ON | `credits[ontario-energy-property-tax-credit].params.thresholdSingle` | 24916 | 26535 | +6.5% |
| ON | `credits[ontario-energy-property-tax-credit].params.thresholdFamily` | 31144 | 33169 | +6.5% |
| ON | `carbon.gasoline[0].from` | 2022-01-01 | 2023-01-01 |  |
| ON | `carbon.gasoline[0].rate` | 0.0884 | 0.1105 | +25.0% |
| ON | `carbon.gasoline[1].from` | 2022-04-01 | 2023-04-01 |  |
| ON | `carbon.gasoline[1].rate` | 0.1105 | 0.1431 | +29.5% |
| ON | `carbon.heating.amount` | 149.21 | 187.75 | +25.8% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2022-07-01 | 2023-01-01 |  |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 186.5 | 93.25 | -50.0% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 93 | 46.5 | -50.0% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 46.5 | 23.25 | -50.0% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 93 | 46.5 | -50.0% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[1].date` | 2022-10-01 | 2023-04-01 |  |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[1].adult` | 93.25 | 122 | +30.8% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[1].spouse` | 46.5 | 61 | +31.2% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 23.25 | 30.5 | +31.2% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 46.5 | 61 | +31.2% |
| PE | `basicPersonalAmount` | 11250 | 12750 | +13.3% |
| PE | `spouseAmount.max` | 9555 | 10829 | +13.3% |
| PE | `spouseAmount.threshold` | 955 | 1083 | +13.4% |
| PE | `lowIncomeReduction.params.threshold` | 20000 | 20750 | +3.8% |
| PE | `carbon.gasoline[0].from` | 2022-01-01 | 2023-01-01 |  |
| PE | `carbon.gasoline[0].rate` | 0.0663 | 0.1105 | +66.7% |
| PE | `carbon.gasoline[1].from` | 2022-05-09 | 2023-07-01 |  |
| PE | `carbon.gasoline[1].rate` | 0.1105 | 0.1431 | +29.5% |
| PE | `carbon.heating.amount` | 0 | 59.39 | n/a |
| QC | `brackets[0].limit` | 46295 | 49275 | +6.4% |
| QC | `brackets[0].rate` | 0.15 | 0.14 | -6.7% |
| QC | `brackets[1].limit` | 92580 | 98540 | +6.4% |
| QC | `brackets[1].rate` | 0.2 | 0.19 | -5.0% |
| QC | `brackets[2].limit` | 112655 | 119910 | +6.4% |
| QC | `basicPersonalAmount` | 16143 | 17183 | +6.4% |
| QC | `quebec.workerDeduction.max` | 1235 | 1315 | +6.5% |
| QC | `quebec.livingAlone.max` | 1850 | 1969 | +6.4% |
| QC | `quebec.livingAlone.threshold` | 36590 | 38945 | +6.4% |
| QC | `propertyTax.rate` | 0.007953 | 0.007414 | -6.8% |
| QC | `childBenefit.params.max` | 2614 | 2782 | +6.4% |
| QC | `childBenefit.params.maxSingleParent` | 917 | 976 | +6.4% |
| QC | `childBenefit.params.min` | 1040 | 1107 | +6.4% |
| QC | `childBenefit.params.minSingleParent` | 365 | 389 | +6.6% |
| QC | `childBenefit.params.thresholdSingle` | 37752 | 40168 | +6.4% |
| QC | `childBenefit.params.thresholdCouple` | 51893 | 55183 | +6.3% |
| QC | `childBenefit.params.schoolSupplies` | 108 | 115 | +6.5% |
| QC | `credits[quebec-solidarity-tax-credit].params.qstAdult` | 309 | 329 | +6.5% |
| QC | `credits[quebec-solidarity-tax-credit].params.qstSpouse` | 309 | 329 | +6.5% |
| QC | `credits[quebec-solidarity-tax-credit].params.qstAlone` | 147 | 156 | +6.1% |
| QC | `credits[quebec-solidarity-tax-credit].params.housingCouple` | 727 | 821 | +12.9% |
| QC | `credits[quebec-solidarity-tax-credit].params.housingSingle` | 599 | 677 | +13.0% |
| QC | `credits[quebec-solidarity-tax-credit].params.child` | 128 | 144 | +12.5% |
| QC | `credits[quebec-solidarity-tax-credit].params.threshold` | 36790 | 39160 | +6.4% |
| QC | `credits[quebec-work-premium].params.single[2]` | 11238 | 11842 | +5.4% |
| QC | `credits[quebec-work-premium].params.couple[2]` | 17398 | 18338 | +5.4% |
| QC | `credits[quebec-work-premium].params.parent[2]` | 11238 | 11842 | +5.4% |
| QC | `credits[quebec-work-premium].params.coupleKids[2]` | 17398 | 18338 | +5.4% |
| SK | `brackets[0].limit` | 46773 | 49720 | +6.3% |
| SK | `brackets[1].limit` | 133638 | 142058 | +6.3% |
| SK | `basicPersonalAmount` | 16615 | 17661 | +6.3% |
| SK | `dividendTaxCredit.nonEligible` | 0.01695 | 0.02105 | +24.2% |
| SK | `spouseAmount.max` | 16615 | 17661 | +6.3% |
| SK | `spouseAmount.threshold` | 1662 | 1767 | +6.3% |
| SK | `childAmount.perChild` | 6303 | 6700 | +6.3% |
| SK | `propertyTax.rate` | 0.010024999184000002 | 0.010314586976000002 | +2.9% |
| SK | `credits[sk-low-income-tax-credit].params.adult` | 358 | 380 | +6.1% |
| SK | `credits[sk-low-income-tax-credit].params.spouse` | 358 | 380 | +6.1% |
| SK | `credits[sk-low-income-tax-credit].params.child` | 141 | 150 | +6.4% |
| SK | `credits[sk-low-income-tax-credit].params.rate` | 0.0275006888950124 | 0.027501037775010378 | +0.0% |
| SK | `credits[sk-low-income-tax-credit].params.threshold` | 33755 | 35902 | +6.4% |
| SK | `carbon.gasoline[0].from` | 2022-01-01 | 2023-01-01 |  |
| SK | `carbon.gasoline[0].rate` | 0.0884 | 0.1105 | +25.0% |
| SK | `carbon.gasoline[1].from` | 2022-04-01 | 2023-04-01 |  |
| SK | `carbon.gasoline[1].rate` | 0.1105 | 0.1431 | +29.5% |
| SK | `carbon.heating.amount` | 190.16 | 240.06 | +26.2% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2022-07-01 | 2023-01-01 |  |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 275 | 137.5 | -50.0% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 137.5 | 68.75 | -50.0% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 69 | 34.5 | -50.0% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 137.5 | 68.75 | -50.0% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[1].date` | 2022-10-01 | 2023-04-01 |  |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[1].adult` | 137.5 | 170 | +23.6% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[1].spouse` | 68.75 | 85 | +23.6% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 34.5 | 42.5 | +23.2% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 68.75 | 85 | +23.6% |
| YT | `brackets[0].limit` | 50197 | 53359 | +6.3% |
| YT | `brackets[1].limit` | 100392 | 106717 | +6.3% |
| YT | `brackets[2].limit` | 155625 | 165430 | +6.3% |
| YT | `propertyTax.rate` | 0.01054 | 0.01076 | +2.1% |
| YT | `childBenefit.params.perChild` | 820 | 876 | +6.8% |
| YT | `carbon.heating.amount` | 223.11 | 242.85 | +8.8% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2022-01-01 | 2023-01-01 |  |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 44 | 80 | +81.8% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 44 | 80 | +81.8% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 44 | 80 | +81.8% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 44 | 80 | +81.8% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[1].date` | 2022-04-01 | 2023-04-01 |  |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[1].adult` | 44 | 80 | +81.8% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[1].spouse` | 44 | 80 | +81.8% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 44 | 80 | +81.8% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 44 | 80 | +81.8% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[2].date` | 2022-07-01 | 2023-07-01 |  |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[2].adult` | 80 | 93 | +16.3% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[2].spouse` | 80 | 93 | +16.3% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[2].child` | 80 | 93 | +16.3% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[2].firstChild` | 80 | 93 | +16.3% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[3].date` | 2022-10-01 | 2023-10-01 |  |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[3].adult` | 80 | 93 | +16.3% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[3].spouse` | 80 | 93 | +16.3% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[3].child` | 80 | 93 | +16.3% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[3].firstChild` | 80 | 93 | +16.3% |
| YT | `carbon.gasoline[0].from` | 2022-01-01 | 2023-01-01 |  |
| YT | `carbon.gasoline[0].rate` | 0.0884 | 0.1105 | +25.0% |
| YT | `carbon.gasoline[1].from` | 2022-04-01 | 2023-04-01 |  |
| YT | `carbon.gasoline[1].rate` | 0.1105 | 0.1431 | +29.5% |

</details>

<details><summary>4 unchanged values opted out</summary>

| File | In | Unchanged values | Why |
|---|---|---|---|
| MB | `familyTaxBenefit.params` | `basic` 2065, `dependant` 2065, `child` 2752, `childThrough` 18 | not indexed comment |

</details>
```

```text
> tax-visualizer@0.1.0 year-diff
> node --import tsx scripts/year-diff.ts 2024 2023

## Data diff: 2024 against 2023

441 values changed from 2023 to 2024 (121 over 15%), 143 amounts suspiciously unchanged, 15 added, 3 removed, 1 replaced. 4 unchanged values opted out.

### Suspiciously unchanged (143)

Amounts, thresholds and bracket limits that are the same in both years. If one is meant to stay put, say so with a `# not indexed` comment on its line (or `bracketsFrozenSince` for bracket limits).

| File | In | Unchanged values |
|---|---|---|
| federal | `payroll.cpp` | `exempt` 3500 |
| federal | `payroll.qpp` | `exempt` 3500 |
| federal | `workersBenefit.standard` | `floor[0]` 3000, `floor[1]` 3000 |
| federal | `workersBenefit.regional.AB` | `floor[0]` 2760, `floor[1]` 2760 |
| federal | `workersBenefit.regional.NU` | `floor[0]` 6000, `floor[1]` 6000 |
| federal | `workersBenefit.quebec` | `single[1]` 2400, `couple[1]` 3600, `parent[1]` 2400, `coupleKids[1]` 3600 |
| federal | `driving` | `efficiency` 9 |
| AB | `childBenefit.params` | `workingFloor` 2760, `minAnnual` 10 |
| AB | `driving` | `distance` 16100 |
| BC | `childBenefit.params` | `singleParent` 500 |
| BC | `credits[bc-renters-tax-credit].params` | `max` 400 |
| BC | `driving` | `distance` 12900 |
| MB | `spouseAmount` | `max` 9134 |
| MB | `credits[mb-school-tax-credits].params` | `educationCreditMax` 350, `renterMax` 525 |
| MB | `driving` | `distance` 15000 |
| NB | `childBenefit.params` | `perChild` 250, `threshold` 20000 |
| NB | `childBenefit.params.workingIncomeSupplement` | `floor` 3750, `max` 250, `threshold` 20921 |
| NB | `credits[nb-hst-credit].params` | `adult` 300, `spouse` 300, `child` 100, `threshold` 35000 |
| NB | `driving` | `distance` 16100 |
| NL | `credits[nl-income-supplement].params` | `base` 254, `extraMax` 266, `extraFrom` 15000, `couple` 69, `child` 231, `threshold` 40000 |
| NL | `driving` | `distance` 15100 |
| NL | `carbon.rebates[carbon-rebate-payments].params.payments` | `[0].adult` 164, `[0].spouse` 82, `[0].child` 41, `[0].firstChild` 82 |
| NS | `brackets` | `[0].limit` 29590, `[1].limit` 59180, `[2].limit` 93000, `[3].limit` 150000 |
| NS | `basicPersonalAmount` | `max` 11481, `min` 8481, `from` 25000, `to` 75000 |
| NS | `spouseAmount.params` | `max` 8481, `threshold` 848 |
| NS | `spouseAmount.params.supplement` | `max` 3000, `threshold` 25000 |
| NS | `childAmount` | `perChild` 1200 |
| NS | `lowIncomeReduction.params` | `individual` 300, `spouse` 300, `child` 165, `threshold` 15000 |
| NS | `childBenefit.params` | `perChild` 1525, `fullBelow` 26000, `partialBelow` 34000, `partialOtherChildren` 762.5 |
| NS | `credits[ns-affordable-living-tax-credit].params` | `base` 255, `child` 60, `threshold` 30000 |
| NS | `driving` | `distance` 17400 |
| NS | `carbon.rebates[carbon-rebate-payments].params.payments` | `[0].adult` 124, `[0].spouse` 62, `[0].child` 31, `[0].firstChild` 62 |
| NT | `childBenefit.params` | `under6[1]` 815, `under6[2]` 1467, `under6[3]` 1997, `under6[4]` 2445, `under6More` 367, `over6[1]` 652, `over6[2]` 1174, `over6[3]` 1597, `over6[4]` 1956, `over6More` 293, `fullUpTo` 30000, `endsAt` 80000 |
| NT | `driving` | `distance` 11000 |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments` | `[2].adult` 110.25, `[2].spouse` 110.25, `[3].adult` 110.25, `[3].spouse` 110.25 |
| NU | `childAmount` | `perChild` 1200 |
| NU | `driving` | `distance` 6800 |
| NU | `carbon.rebates[carbon-rebate-payments].params.payments` | `[0].adult` 77, `[0].spouse` 77, `[0].child` 77, `[0].firstChild` 77, `[1].adult` 77, `[1].spouse` 77, `[1].child` 77, `[1].firstChild` 77 |
| ON | `brackets` | `[2].limit` 150000, `[3].limit` 220000 |
| ON | `lift` | `max` 875, `threshold` 32500, `familyThreshold` 65000 |
| ON | `payroll` | `healthPremium[0][0]` 200000, `healthPremium[0][1]` 750, `healthPremium[0][3]` 900, `healthPremium[1][0]` 72000, `healthPremium[1][1]` 600, `healthPremium[1][3]` 750, `healthPremium[2][0]` 48000, `healthPremium[2][1]` 450, `healthPremium[2][3]` 600, `healthPremium[3][0]` 36000, `healthPremium[3][1]` 300, `healthPremium[3][3]` 450, `healthPremium[4][0]` 20000, `healthPremium[4][3]` 300 |
| ON | `driving` | `distance` 16200 |
| PE | `lowIncomeReduction.params` | `individual` 350, `spouse` 350, `child` 300 |
| PE | `credits[pei-sales-tax-credit].params` | `individual` 110, `spouseOrDependant` 55, `supplementFrom` 30000, `supplementMax` 55, `threshold` 50000 |
| PE | `childAmount` | `perChild` 1200 |
| PE | `driving` | `distance` 15100 |
| PE | `carbon.rebates[carbon-rebate-payments].params.payments` | `[0].adult` 120, `[0].spouse` 60, `[0].child` 30, `[0].firstChild` 60 |
| QC | `credits[quebec-work-premium].params` | `single[1]` 2400, `couple[1]` 3600, `parent[1]` 2400, `coupleKids[1]` 3600 |
| QC | `driving` | `distance` 14800 |
| SK | `driving` | `distance` 15300 |
| YT | `brackets` | `[3].limit` 500000 |
| YT | `childBenefit.params` | `threshold` 35000 |
| YT | `driving` | `distance` 13200 |

### Large changes, over 15% (121)

| File | Field | 2023 | 2024 | Change |
|---|---|--:|--:|--:|
| federal | `indexation` | 0.063 | 0.047 | -25.4% |
| federal | `payroll.cpp.enh2` | 0 | 0.04 | n/a |
| federal | `payroll.qpp.enh2` | 0 | 0.04 | n/a |
| AB | `carbon.gasoline[0].rate` | 0.1105 | 0.1431 | +29.5% |
| AB | `carbon.gasoline[1].rate` | 0.1431 | 0.1761 | +23.1% |
| AB | `carbon.heating.amount` | 310.73 | 384.52 | +23.7% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 134.75 | 193 | +43.2% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 67.5 | 96.5 | +43.0% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 33.75 | 48.25 | +43.0% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 67.5 | 96.5 | +43.0% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[1].adult` | 193 | 225 | +16.6% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[1].spouse` | 96.5 | 112.5 | +16.6% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 48.25 | 56.25 | +16.6% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 96.5 | 112.5 | +16.6% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[2].adult` | 193 | 225 | +16.6% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[2].spouse` | 96.5 | 112.5 | +16.6% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[2].child` | 48.25 | 56.25 | +16.6% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[2].firstChild` | 96.5 | 112.5 | +16.6% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[3].adult` | 193 | 225 | +16.6% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[3].spouse` | 96.5 | 112.5 | +16.6% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[3].child` | 48.25 | 56.25 | +16.6% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[3].firstChild` | 96.5 | 112.5 | +16.6% |
| BC | `childBenefit.params.max[0]` | 1750 | 2188 | +25.0% |
| BC | `childBenefit.params.max[1]` | 1100 | 1375 | +25.0% |
| BC | `childBenefit.params.max[2]` | 900 | 1125 | +25.0% |
| BC | `childBenefit.params.min[0]` | 775 | 969 | +25.0% |
| BC | `childBenefit.params.min[1]` | 750 | 937 | +24.9% |
| BC | `childBenefit.params.min[2]` | 725 | 906 | +25.0% |
| BC | `childBenefit.params.threshold` | 27354 | 35902 | +31.2% |
| BC | `childBenefit.params.minThreshold` | 87533 | 114887 | +31.2% |
| BC | `carbon.gasoline[0].rate` | 0.1105 | 0.1431 | +29.5% |
| BC | `carbon.gasoline[1].rate` | 0.1431 | 0.1761 | +23.1% |
| BC | `carbon.heating.amount` | 149.98 | 185.6 | +23.7% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 212.375 | 111.75 | -47.4% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 212.375 | 55.875 | -73.7% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 55.125 | 27.875 | -49.4% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 212.375 | 55.875 | -73.7% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].threshold[1]` | 43051 | 50170 | +16.5% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].adult` | 212.375 | 111.75 | -47.4% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].spouse` | 212.375 | 55.875 | -73.7% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 55.125 | 27.875 | -49.4% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 212.375 | 55.875 | -73.7% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].threshold[1]` | 43051 | 50170 | +16.5% |
| MB | `brackets[0].limit` | 36842 | 47000 | +27.6% |
| MB | `brackets[1].limit` | 79625 | 100000 | +25.6% |
| MB | `carbon.gasoline[0].rate` | 0.1105 | 0.1431 | +29.5% |
| MB | `carbon.gasoline[1].rate` | 0.1431 | 0.1761 | +23.1% |
| MB | `carbon.heating.amount` | 155.5 | 192.43 | +23.7% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 104 | 132 | +26.9% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 52 | 66 | +26.9% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 26 | 33 | +26.9% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 52 | 66 | +26.9% |
| NB | `carbon.gasoline[0].rate` | 0.1105 | 0.1431 | +29.5% |
| NB | `carbon.gasoline[1].rate` | 0.1431 | 0.1761 | +23.1% |
| NB | `carbon.heating.amount` | 18.04 | 12.39 | -31.3% |
| NB | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 184 | 92 | -50.0% |
| NB | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 92 | 46 | -50.0% |
| NB | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 46 | 23 | -50.0% |
| NB | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 92 | 46 | -50.0% |
| NL | `carbon.gasoline[0].rate` | 0.1105 | 0.1431 | +29.5% |
| NL | `carbon.gasoline[1].rate` | 0.1431 | 0.1761 | +23.1% |
| NL | `carbon.heating.amount` | 24.03 | 0 | -100.0% |
| NS | `carbon.gasoline[0].rate` | 0 | 0.1431 | n/a |
| NS | `carbon.gasoline[1].rate` | 0.1431 | 0.1761 | +23.1% |
| NS | `carbon.heating.amount` | 50.59 | 15.28 | -69.8% |
| NS | `carbon.rebates[carbon-rebate-payments].params.payments[1].adult` | 124 | 103 | -16.9% |
| NS | `carbon.rebates[carbon-rebate-payments].params.payments[1].spouse` | 62 | 51.5 | -16.9% |
| NS | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 31 | 25.75 | -16.9% |
| NS | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 62 | 51.5 | -16.9% |
| NT | `carbon.heating.amount` | 315.05 | 103.97 | -67.0% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 65 | 110.25 | +69.6% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 65 | 110.25 | +69.6% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 75 | 123.25 | +64.3% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 75 | 123.25 | +64.3% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[1].adult` | 65 | 110.25 | +69.6% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[1].spouse` | 65 | 110.25 | +69.6% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 75 | 123.25 | +64.3% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 75 | 123.25 | +64.3% |
| NT | `carbon.gasoline[0].rate` | 0.117 | 0.1431 | +22.3% |
| NT | `carbon.gasoline[1].rate` | 0.1431 | 0.1761 | +23.1% |
| NU | `carbon.heating.amount` | 294.11 | 0 | -100.0% |
| NU | `carbon.gasoline[0].rate` | 0.05525 | 0.1431 | +159.0% |
| NU | `carbon.gasoline[1].rate` | 0.1431 | 0.1761 | +23.1% |
| ON | `carbon.gasoline[0].rate` | 0.1105 | 0.1431 | +29.5% |
| ON | `carbon.gasoline[1].rate` | 0.1431 | 0.1761 | +23.1% |
| ON | `carbon.heating.amount` | 187.75 | 227.57 | +21.2% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 93.25 | 122 | +30.8% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 46.5 | 61 | +31.2% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 23.25 | 30.5 | +31.2% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 46.5 | 61 | +31.2% |
| PE | `brackets[2].limit` | .inf | 105000 | n/a |
| PE | `carbon.gasoline[0].rate` | 0.1105 | 0.1431 | +29.5% |
| PE | `carbon.gasoline[1].rate` | 0.1431 | 0.1761 | +23.1% |
| PE | `carbon.heating.amount` | 59.39 | 0 | -100.0% |
| SK | `dividendTaxCredit.nonEligible` | 0.02105 | 0.02519 | +19.7% |
| SK | `carbon.gasoline[0].rate` | 0.1105 | 0.1431 | +29.5% |
| SK | `carbon.gasoline[1].rate` | 0.1431 | 0.1761 | +23.1% |
| SK | `carbon.heating.amount` | 240.06 | 0 | -100.0% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 137.5 | 170 | +23.6% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 68.75 | 85 | +23.6% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 34.5 | 42.5 | +23.2% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 68.75 | 85 | +23.6% |
| YT | `carbon.heating.amount` | 242.85 | 0 | -100.0% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 80 | 93 | +16.3% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 80 | 93 | +16.3% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 80 | 93 | +16.3% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 80 | 93 | +16.3% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[1].adult` | 80 | 93 | +16.3% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[1].spouse` | 80 | 93 | +16.3% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 80 | 93 | +16.3% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 80 | 93 | +16.3% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[2].adult` | 93 | 77.5 | -16.7% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[2].spouse` | 93 | 77.5 | -16.7% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[2].child` | 93 | 77.5 | -16.7% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[2].firstChild` | 93 | 77.5 | -16.7% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[3].adult` | 93 | 77.5 | -16.7% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[3].spouse` | 93 | 77.5 | -16.7% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[3].child` | 93 | 77.5 | -16.7% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[3].firstChild` | 93 | 77.5 | -16.7% |
| YT | `carbon.gasoline[0].rate` | 0.1105 | 0.1431 | +29.5% |
| YT | `carbon.gasoline[1].rate` | 0.1431 | 0.1761 | +23.1% |

### Added, removed and replaced (19)

| File | Field | | Value |
|---|---|---|---|
| NB | `carbon.rebates[carbon-rebate-payments].params.payments[1]` | added | {date: 2024-04-01, adult: 95, spouse: 47.5, child: 23.75, firstChild: 47.5, thr… |
| NB | `carbon.rebates[carbon-rebate-payments].params.payments[2]` | added | {date: 2024-07-01, adult: 95, spouse: 47.5, child: 23.75, firstChild: 47.5, thr… |
| NB | `carbon.rebates[carbon-rebate-payments].params.payments[3]` | added | {date: 2024-10-01, adult: 95, spouse: 47.5, child: 23.75, firstChild: 47.5, thr… |
| NL | `childBenefit` | replaced | {name: NL Child Benefit, program: nl-child-benefit-periods,… → {name: NL Child Benefit, program: nl-child-benefit-reductio… |
| NL | `carbon.rebates[carbon-rebate-payments].params.payments[2]` | added | {date: 2024-07-01, adult: 149, spouse: 74.5, child: 37.25, firstChild: 74.5, th… |
| NL | `carbon.rebates[carbon-rebate-payments].params.payments[3]` | added | {date: 2024-10-01, adult: 149, spouse: 74.5, child: 37.25, firstChild: 74.5, th… |
| NS | `carbon.rebates[carbon-rebate-payments].params.payments[2]` | added | {date: 2024-07-01, adult: 103, spouse: 51.5, child: 25.75, firstChild: 51.5, th… |
| NS | `carbon.rebates[carbon-rebate-payments].params.payments[3]` | added | {date: 2024-10-01, adult: 103, spouse: 51.5, child: 25.75, firstChild: 51.5, th… |
| NU | `carbon.rebates[carbon-rebate-payments].params.payments[2]` | added | {date: 2024-07-05, adult: 25, spouse: 25, child: 25, firstChild: 25, threshold:… |
| NU | `carbon.rebates[carbon-rebate-payments].params.payments[3]` | added | {date: 2024-10-01, adult: 25, spouse: 25, child: 25, firstChild: 25, threshold:… |
| NU | `carbon.rebates[carbon-rebate-payments].estimated` | added | true |
| NU | `carbon.gasoline[0].note` | removed | Net household rate after the statutory 50% point-of-sale rebate |
| ON | `childBenefit.estimated` | removed | true |
| PE | `brackets[3]` | added | [140000, 0.18] |
| PE | `brackets[4]` | added | [.inf, 0.1875] |
| PE | `childBenefit` | added | {name: PEI Child Benefit, program: income-band-per-child, params: {bands: [[450… |
| PE | `carbon.rebates[carbon-rebate-payments].params.payments[2]` | added | {date: 2024-07-01, adult: 110, spouse: 55, child: 27.5, firstChild: 55, thresho… |
| PE | `carbon.rebates[carbon-rebate-payments].params.payments[3]` | added | {date: 2024-10-01, adult: 110, spouse: 55, child: 27.5, firstChild: 55, thresho… |
| PE | `postDividendSurtax` | removed | {program: pei-surtax, params: {threshold: 12500, rate: 0.1}} |

<details><summary>All 441 changed values</summary>

| File | Field | 2023 | 2024 | Change |
|---|---|--:|--:|--:|
| federal | `brackets[0].limit` | 53359 | 55867 | +4.7% |
| federal | `brackets[1].limit` | 106717 | 111733 | +4.7% |
| federal | `brackets[2].limit` | 165430 | 173205 | +4.7% |
| federal | `brackets[3].limit` | 235675 | 246752 | +4.7% |
| federal | `basicPersonalAmount.max` | 15000 | 15705 | +4.7% |
| federal | `basicPersonalAmount.min` | 13521 | 14156 | +4.7% |
| federal | `basicPersonalAmount.from` | 165430 | 173205 | +4.7% |
| federal | `basicPersonalAmount.to` | 235675 | 246752 | +4.7% |
| federal | `employmentAmount` | 1368 | 1433 | +4.8% |
| federal | `indexation` | 0.063 | 0.047 | -25.4% |
| federal | `rrsp.limit` | 30780 | 31560 | +2.5% |
| federal | `payroll.cpp.ympe` | 66600 | 68500 | +2.9% |
| federal | `payroll.cpp.yampe` | 66600 | 73200 | +9.9% |
| federal | `payroll.cpp.enh2` | 0 | 0.04 | n/a |
| federal | `payroll.qpp.ympe` | 66600 | 68500 | +2.9% |
| federal | `payroll.qpp.yampe` | 66600 | 73200 | +9.9% |
| federal | `payroll.qpp.enh2` | 0 | 0.04 | n/a |
| federal | `payroll.ei.maxInsurable` | 61500 | 63200 | +2.8% |
| federal | `payroll.ei.rate` | 0.0163 | 0.0166 | +1.8% |
| federal | `payroll.ei.quebecRate` | 0.0127 | 0.0132 | +3.9% |
| federal | `payroll.qpip.maxInsurable` | 91000 | 94000 | +3.3% |
| federal | `childBenefit.perChildUnder6` | 7437 | 7787 | +4.7% |
| federal | `childBenefit.perChild6to17` | 6275 | 6570 | +4.7% |
| federal | `childBenefit.threshold1` | 34863 | 36502 | +4.7% |
| federal | `childBenefit.threshold2` | 75537 | 79087 | +4.7% |
| federal | `childBenefit.fixed2[1]` | 2847 | 2981 | +4.7% |
| federal | `childBenefit.fixed2[2]` | 5491 | 5749 | +4.7% |
| federal | `childBenefit.fixed2[3]` | 7728 | 8091 | +4.7% |
| federal | `childBenefit.fixed2[4]` | 9355 | 9795 | +4.7% |
| federal | `groceriesBenefit.adult` | 325 | 340 | +4.6% |
| federal | `groceriesBenefit.spouseOrFirstChild` | 325 | 340 | +4.6% |
| federal | `groceriesBenefit.child` | 171 | 179 | +4.7% |
| federal | `groceriesBenefit.singleSupplement.max` | 171 | 179 | +4.7% |
| federal | `groceriesBenefit.singleSupplement.from` | 10544 | 11039 | +4.7% |
| federal | `groceriesBenefit.phaseOut.from` | 42335 | 44324 | +4.7% |
| federal | `workersBenefit.estimationNote` | "Quebec's income-at-maximum thresholds … | "Quebec's income-at-maximum thresholds … |  |
| federal | `workersBenefit.standard.max[0]` | 1518 | 1590 | +4.7% |
| federal | `workersBenefit.standard.max[1]` | 2616 | 2739 | +4.7% |
| federal | `workersBenefit.standard.threshold[0]` | 24975 | 26149 | +4.7% |
| federal | `workersBenefit.standard.threshold[1]` | 28494 | 29833 | +4.7% |
| federal | `workersBenefit.secondaryEarnerExemption` | 15239 | 15955 | +4.7% |
| federal | `workersBenefit.regional.AB.max[0]` | 1627 | 1704 | +4.7% |
| federal | `workersBenefit.regional.AB.max[1]` | 2436 | 2551 | +4.7% |
| federal | `workersBenefit.regional.AB.threshold[0]` | 24328 | 25472 | +4.7% |
| federal | `workersBenefit.regional.AB.threshold[1]` | 30478 | 31911 | +4.7% |
| federal | `workersBenefit.regional.NU.max[0]` | 1508 | 1578 | +4.6% |
| federal | `workersBenefit.regional.NU.max[1]` | 2264 | 2371 | +4.7% |
| federal | `workersBenefit.regional.NU.threshold[0]` | 24954 | 26127 | +4.7% |
| federal | `workersBenefit.regional.NU.threshold[1]` | 34343 | 35957 | +4.7% |
| federal | `workersBenefit.quebec.single[2]` | 11842.010723860589 | 12333.994638069706 | +4.2% |
| federal | `workersBenefit.quebec.single[3]` | 13294.87 | 13829.82 | +4.0% |
| federal | `workersBenefit.quebec.couple[2]` | 18337.98927613941 | 19092.010723860592 | +4.1% |
| federal | `workersBenefit.quebec.couple[3]` | 20412.45 | 21257.44 | +4.1% |
| federal | `workersBenefit.quebec.parent[2]` | 11842 | 12334 | +4.2% |
| federal | `workersBenefit.quebec.parent[3]` | 13400.24 | 13981.83 | +4.3% |
| federal | `workersBenefit.quebec.coupleKids[2]` | 18337.991631799166 | 19092.00836820084 | +4.1% |
| federal | `workersBenefit.quebec.coupleKids[3]` | 20563.57 | 21456.77 | +4.3% |
| AB | `brackets[0].limit` | 142292 | 148269 | +4.2% |
| AB | `brackets[1].limit` | 170751 | 177922 | +4.2% |
| AB | `brackets[2].limit` | 227668 | 237230 | +4.2% |
| AB | `brackets[3].limit` | 341502 | 355845 | +4.2% |
| AB | `basicPersonalAmount` | 21003 | 21885 | +4.2% |
| AB | `spouseAmount.max` | 21003 | 21885 | +4.2% |
| AB | `propertyTax.rate` | 0.0065718 | 0.0064861 | -1.3% |
| AB | `childBenefit.params.base[0]` | 1410 | 1469 | +4.2% |
| AB | `childBenefit.params.base[1]` | 2115 | 2204 | +4.2% |
| AB | `childBenefit.params.base[2]` | 2820 | 2939 | +4.2% |
| AB | `childBenefit.params.base[3]` | 3525 | 3674 | +4.2% |
| AB | `childBenefit.params.baseThreshold` | 25935 | 27024 | +4.2% |
| AB | `childBenefit.params.working[0]` | 722 | 752 | +4.2% |
| AB | `childBenefit.params.working[1]` | 1379 | 1437 | +4.2% |
| AB | `childBenefit.params.working[2]` | 1772 | 1847 | +4.2% |
| AB | `childBenefit.params.working[3]` | 1902 | 1982 | +4.2% |
| AB | `childBenefit.params.workingThreshold` | 43460 | 45285 | +4.2% |
| AB | `carbon.gasoline[0].from` | 2023-01-01 | 2024-01-01 |  |
| AB | `carbon.gasoline[0].rate` | 0.1105 | 0.1431 | +29.5% |
| AB | `carbon.gasoline[1].from` | 2023-04-01 | 2024-04-01 |  |
| AB | `carbon.gasoline[1].rate` | 0.1431 | 0.1761 | +23.1% |
| AB | `carbon.heating.amount` | 310.73 | 384.52 | +23.7% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2023-01-01 | 2024-01-01 |  |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 134.75 | 193 | +43.2% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 67.5 | 96.5 | +43.0% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 33.75 | 48.25 | +43.0% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 67.5 | 96.5 | +43.0% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[1].date` | 2023-04-01 | 2024-04-01 |  |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[1].adult` | 193 | 225 | +16.6% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[1].spouse` | 96.5 | 112.5 | +16.6% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 48.25 | 56.25 | +16.6% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 96.5 | 112.5 | +16.6% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[2].date` | 2023-07-01 | 2024-07-01 |  |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[2].adult` | 193 | 225 | +16.6% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[2].spouse` | 96.5 | 112.5 | +16.6% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[2].child` | 48.25 | 56.25 | +16.6% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[2].firstChild` | 96.5 | 112.5 | +16.6% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[3].date` | 2023-10-01 | 2024-10-01 |  |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[3].adult` | 193 | 225 | +16.6% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[3].spouse` | 96.5 | 112.5 | +16.6% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[3].child` | 48.25 | 56.25 | +16.6% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[3].firstChild` | 96.5 | 112.5 | +16.6% |
| BC | `brackets[0].limit` | 45654 | 47937 | +5.0% |
| BC | `brackets[1].limit` | 91310 | 95875 | +5.0% |
| BC | `brackets[2].limit` | 104835 | 110076 | +5.0% |
| BC | `brackets[3].limit` | 127299 | 133664 | +5.0% |
| BC | `brackets[4].limit` | 172602 | 181232 | +5.0% |
| BC | `brackets[5].limit` | 240716 | 252752 | +5.0% |
| BC | `basicPersonalAmount` | 11981 | 12580 | +5.0% |
| BC | `spouseAmount.max` | 10259 | 10772 | +5.0% |
| BC | `spouseAmount.threshold` | 1026 | 1078 | +5.1% |
| BC | `bcTaxReduction.max` | 521 | 547 | +5.0% |
| BC | `bcTaxReduction.threshold` | 23179 | 24338 | +5.0% |
| BC | `propertyTax.rate` | 0.0027807 | 0.00296818 | +6.7% |
| BC | `childBenefit.params.max[0]` | 1750 | 2188 | +25.0% |
| BC | `childBenefit.params.max[1]` | 1100 | 1375 | +25.0% |
| BC | `childBenefit.params.max[2]` | 900 | 1125 | +25.0% |
| BC | `childBenefit.params.min[0]` | 775 | 969 | +25.0% |
| BC | `childBenefit.params.min[1]` | 750 | 937 | +24.9% |
| BC | `childBenefit.params.min[2]` | 725 | 906 | +25.0% |
| BC | `childBenefit.params.threshold` | 27354 | 35902 | +31.2% |
| BC | `childBenefit.params.minThreshold` | 87533 | 114887 | +31.2% |
| BC | `credits[bc-renters-tax-credit].params.threshold` | 60000 | 63000 | +5.0% |
| BC | `carbon.gasoline[0].from` | 2023-01-01 | 2024-01-01 |  |
| BC | `carbon.gasoline[0].rate` | 0.1105 | 0.1431 | +29.5% |
| BC | `carbon.gasoline[1].from` | 2023-04-01 | 2024-04-01 |  |
| BC | `carbon.gasoline[1].rate` | 0.1431 | 0.1761 | +23.1% |
| BC | `carbon.heating.amount` | 149.98 | 185.6 | +23.7% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2023-01-01 | 2024-01-01 |  |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 212.375 | 111.75 | -47.4% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 212.375 | 55.875 | -73.7% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 55.125 | 27.875 | -49.4% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 212.375 | 55.875 | -73.7% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].threshold[0]` | 36901 | 39115 | +6.0% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].threshold[1]` | 43051 | 50170 | +16.5% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].date` | 2023-04-01 | 2024-04-01 |  |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].adult` | 212.375 | 111.75 | -47.4% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].spouse` | 212.375 | 55.875 | -73.7% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 55.125 | 27.875 | -49.4% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 212.375 | 55.875 | -73.7% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].threshold[0]` | 36901 | 39115 | +6.0% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].threshold[1]` | 43051 | 50170 | +16.5% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].date` | 2023-07-01 | 2024-07-01 |  |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].adult` | 111.75 | 126 | +12.8% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].spouse` | 55.875 | 63 | +12.8% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].child` | 27.875 | 31.5 | +13.0% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].firstChild` | 55.875 | 63 | +12.8% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].threshold[0]` | 39115 | 41071 | +5.0% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2].threshold[1]` | 50170 | 57288 | +14.2% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[3].date` | 2023-10-01 | 2024-10-01 |  |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[3].adult` | 111.75 | 126 | +12.8% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[3].spouse` | 55.875 | 63 | +12.8% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[3].child` | 27.875 | 31.5 | +13.0% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[3].firstChild` | 55.875 | 63 | +12.8% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[3].threshold[0]` | 39115 | 41071 | +5.0% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[3].threshold[1]` | 50170 | 57288 | +14.2% |
| MB | `brackets[0].limit` | 36842 | 47000 | +27.6% |
| MB | `brackets[1].limit` | 79625 | 100000 | +25.6% |
| MB | `basicPersonalAmount` | 15000 | 15780 | +5.2% |
| MB | `propertyTax.rate` | 0.011897550000000002 | 0.0122769 | +3.2% |
| MB | `credits[mb-school-tax-credits].params.schoolTaxShare` | 0.5120844207420855 | 0.5105930650245583 | -0.3% |
| MB | `carbon.gasoline[0].from` | 2023-01-01 | 2024-01-01 |  |
| MB | `carbon.gasoline[0].rate` | 0.1105 | 0.1431 | +29.5% |
| MB | `carbon.gasoline[1].from` | 2023-04-01 | 2024-04-01 |  |
| MB | `carbon.gasoline[1].rate` | 0.1431 | 0.1761 | +23.1% |
| MB | `carbon.heating.amount` | 155.5 | 192.43 | +23.7% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2023-01-01 | 2024-01-01 |  |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 104 | 132 | +26.9% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 52 | 66 | +26.9% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 26 | 33 | +26.9% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 52 | 66 | +26.9% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[1].date` | 2023-04-01 | 2024-04-01 |  |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[1].adult` | 132 | 150 | +13.6% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[1].spouse` | 66 | 75 | +13.6% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 33 | 37.5 | +13.6% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 66 | 75 | +13.6% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[2].date` | 2023-07-01 | 2024-07-01 |  |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[2].adult` | 132 | 150 | +13.6% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[2].spouse` | 66 | 75 | +13.6% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[2].child` | 33 | 37.5 | +13.6% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[2].firstChild` | 66 | 75 | +13.6% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[3].date` | 2023-10-01 | 2024-10-01 |  |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[3].adult` | 132 | 150 | +13.6% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[3].spouse` | 66 | 75 | +13.6% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[3].child` | 33 | 37.5 | +13.6% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[3].firstChild` | 66 | 75 | +13.6% |
| NB | `brackets[0].limit` | 47715 | 49958 | +4.7% |
| NB | `brackets[1].limit` | 95431 | 99916 | +4.7% |
| NB | `brackets[2].limit` | 176756 | 185064 | +4.7% |
| NB | `basicPersonalAmount` | 12458 | 13044 | +4.7% |
| NB | `spouseAmount.max` | 9764 | 10223 | +4.7% |
| NB | `spouseAmount.threshold` | 977 | 1023 | +4.7% |
| NB | `lowIncomeReduction.params.amount` | 746 | 781 | +4.7% |
| NB | `lowIncomeReduction.params.threshold` | 20385 | 21343 | +4.7% |
| NB | `propertyTax.rate` | 0.014443 | 0.014231 | -1.5% |
| NB | `carbon.gasoline[0].from` | 2023-01-01 | 2024-01-01 |  |
| NB | `carbon.gasoline[0].rate` | 0.1105 | 0.1431 | +29.5% |
| NB | `carbon.gasoline[1].from` | 2023-07-01 | 2024-04-01 |  |
| NB | `carbon.gasoline[1].rate` | 0.1431 | 0.1761 | +23.1% |
| NB | `carbon.heating.amount` | 18.04 | 12.39 | -31.3% |
| NB | `carbon.heating.method` | "Estimated 2021 Statistics Canada house… | "2021 Statistics Canada household natur… |  |
| NB | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2023-10-01 | 2024-01-01 |  |
| NB | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 184 | 92 | -50.0% |
| NB | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 92 | 46 | -50.0% |
| NB | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 46 | 23 | -50.0% |
| NB | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 92 | 46 | -50.0% |
| NL | `brackets[0].limit` | 41457 | 43198 | +4.2% |
| NL | `brackets[1].limit` | 82913 | 86395 | +4.2% |
| NL | `brackets[2].limit` | 148027 | 154244 | +4.2% |
| NL | `brackets[3].limit` | 207239 | 215943 | +4.2% |
| NL | `brackets[4].limit` | 264750 | 275870 | +4.2% |
| NL | `brackets[5].limit` | 529500 | 551739 | +4.2% |
| NL | `brackets[6].limit` | 1059000 | 1103478 | +4.2% |
| NL | `basicPersonalAmount` | 10382 | 10818 | +4.2% |
| NL | `spouseAmount.max` | 8483 | 8840 | +4.2% |
| NL | `spouseAmount.threshold` | 849 | 885 | +4.2% |
| NL | `lowIncomeReduction.params.individual` | 936 | 974 | +4.1% |
| NL | `lowIncomeReduction.params.family` | 523 | 544 | +4.0% |
| NL | `lowIncomeReduction.params.thresholdIndividual` | 22447 | 23390 | +4.2% |
| NL | `lowIncomeReduction.params.thresholdFamily` | 37957 | 39551 | +4.2% |
| NL | `propertyTax.rate` | 0.0083 | 0.0091 | +9.6% |
| NL | `carbon.gasoline[0].from` | 2023-01-01 | 2024-01-01 |  |
| NL | `carbon.gasoline[0].rate` | 0.1105 | 0.1431 | +29.5% |
| NL | `carbon.gasoline[1].from` | 2023-07-01 | 2024-04-01 |  |
| NL | `carbon.gasoline[1].rate` | 0.1431 | 0.1761 | +23.1% |
| NL | `carbon.heating.amount` | 24.03 | 0 | -100.0% |
| NL | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2023-07-01 | 2024-01-01 |  |
| NL | `carbon.rebates[carbon-rebate-payments].params.payments[1].date` | 2023-10-01 | 2024-04-01 |  |
| NL | `carbon.rebates[carbon-rebate-payments].params.payments[1].adult` | 164 | 149 | -9.1% |
| NL | `carbon.rebates[carbon-rebate-payments].params.payments[1].spouse` | 82 | 74.5 | -9.1% |
| NL | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 41 | 37.25 | -9.1% |
| NL | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 82 | 74.5 | -9.1% |
| NS | `propertyTax.rate` | 0.01115 | 0.0111 | -0.4% |
| NS | `carbon.gasoline[0].from` | 2023-01-01 | 2024-01-01 |  |
| NS | `carbon.gasoline[0].rate` | 0 | 0.1431 | n/a |
| NS | `carbon.gasoline[1].from` | 2023-07-01 | 2024-04-01 |  |
| NS | `carbon.gasoline[1].rate` | 0.1431 | 0.1761 | +23.1% |
| NS | `carbon.heating.amount` | 50.59 | 15.28 | -69.8% |
| NS | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2023-07-01 | 2024-01-01 |  |
| NS | `carbon.rebates[carbon-rebate-payments].params.payments[1].date` | 2023-10-01 | 2024-04-01 |  |
| NS | `carbon.rebates[carbon-rebate-payments].params.payments[1].adult` | 124 | 103 | -16.9% |
| NS | `carbon.rebates[carbon-rebate-payments].params.payments[1].spouse` | 62 | 51.5 | -16.9% |
| NS | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 31 | 25.75 | -16.9% |
| NS | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 62 | 51.5 | -16.9% |
| NT | `brackets[0].limit` | 48326 | 50597 | +4.7% |
| NT | `brackets[1].limit` | 96655 | 101198 | +4.7% |
| NT | `brackets[2].limit` | 157139 | 164525 | +4.7% |
| NT | `basicPersonalAmount` | 16593 | 17373 | +4.7% |
| NT | `spouseAmount.max` | 16593 | 17373 | +4.7% |
| NT | `propertyTax.rate` | 0.00924 | 0.00956 | +3.5% |
| NT | `carbon.heating.amount` | 315.05 | 103.97 | -67.0% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2023-01-01 | 2024-01-01 |  |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 65 | 110.25 | +69.6% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 65 | 110.25 | +69.6% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 75 | 123.25 | +64.3% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 75 | 123.25 | +64.3% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[1].date` | 2023-04-01 | 2024-04-01 |  |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[1].adult` | 65 | 110.25 | +69.6% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[1].spouse` | 65 | 110.25 | +69.6% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 75 | 123.25 | +64.3% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 75 | 123.25 | +64.3% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[2].date` | 2023-07-01 | 2024-07-01 |  |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[2].child` | 123.25 | 126.25 | +2.4% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[2].firstChild` | 123.25 | 126.25 | +2.4% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[3].date` | 2023-10-01 | 2024-10-01 |  |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[3].child` | 123.25 | 126.25 | +2.4% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[3].firstChild` | 123.25 | 126.25 | +2.4% |
| NT | `carbon.gasoline[0].from` | 2023-01-01 | 2024-01-01 |  |
| NT | `carbon.gasoline[0].rate` | 0.117 | 0.1431 | +22.3% |
| NT | `carbon.gasoline[1].from` | 2023-04-01 | 2024-04-01 |  |
| NT | `carbon.gasoline[1].rate` | 0.1431 | 0.1761 | +23.1% |
| NU | `brackets[0].limit` | 50877 | 53268 | +4.7% |
| NU | `brackets[1].limit` | 101754 | 106537 | +4.7% |
| NU | `brackets[2].limit` | 165429 | 173205 | +4.7% |
| NU | `basicPersonalAmount` | 17925 | 18767 | +4.7% |
| NU | `spouseAmount.max` | 17925 | 18767 | +4.7% |
| NU | `childBenefit.params.perChild` | 346.92 | 348 | +0.3% |
| NU | `childBenefit.params.threshold` | 21999 | 22065 | +0.3% |
| NU | `carbon.heating.amount` | 294.11 | 0 | -100.0% |
| NU | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2023-09-05 | 2024-01-01 |  |
| NU | `carbon.rebates[carbon-rebate-payments].params.payments[1].date` | 2023-10-05 | 2024-04-01 |  |
| NU | `carbon.gasoline[0].from` | 2023-01-01 | 2024-01-01 |  |
| NU | `carbon.gasoline[0].rate` | 0.05525 | 0.1431 | +159.0% |
| NU | `carbon.gasoline[1].from` | 2023-04-01 | 2024-04-01 |  |
| NU | `carbon.gasoline[1].rate` | 0.1431 | 0.1761 | +23.1% |
| ON | `brackets[0].limit` | 49231 | 51446 | +4.5% |
| ON | `brackets[1].limit` | 98463 | 102894 | +4.5% |
| ON | `basicPersonalAmount` | 11865 | 12399 | +4.5% |
| ON | `spouseAmount.max` | 10075 | 10528 | +4.5% |
| ON | `spouseAmount.threshold` | 1007 | 1053 | +4.6% |
| ON | `surtax[0][0]` | 5315 | 5554 | +4.5% |
| ON | `surtax[1][0]` | 6802 | 7108 | +4.5% |
| ON | `ontarioTaxReduction.base` | 274 | 286 | +4.4% |
| ON | `ontarioTaxReduction.perChild` | 506 | 529 | +4.5% |
| ON | `propertyTax.rate` | 0.00666274 | 0.00715289 | +7.4% |
| ON | `childBenefit.params.perChild` | 1606.92 | 1680 | +4.5% |
| ON | `childBenefit.params.threshold` | 24542 | 25646 | +4.5% |
| ON | `credits[ontario-sales-tax-credit].params.perPerson` | 345 | 360 | +4.3% |
| ON | `credits[ontario-sales-tax-credit].params.thresholdSingle` | 26535 | 27729 | +4.5% |
| ON | `credits[ontario-sales-tax-credit].params.thresholdFamily` | 33169 | 34661 | +4.5% |
| ON | `credits[ontario-energy-property-tax-credit].params.energyMax` | 265 | 277 | +4.5% |
| ON | `credits[ontario-energy-property-tax-credit].params.propertyBase` | 66 | 69 | +4.5% |
| ON | `credits[ontario-energy-property-tax-credit].params.propertyMax` | 863 | 902 | +4.5% |
| ON | `credits[ontario-energy-property-tax-credit].params.thresholdSingle` | 26535 | 27729 | +4.5% |
| ON | `credits[ontario-energy-property-tax-credit].params.thresholdFamily` | 33169 | 34661 | +4.5% |
| ON | `carbon.gasoline[0].from` | 2023-01-01 | 2024-01-01 |  |
| ON | `carbon.gasoline[0].rate` | 0.1105 | 0.1431 | +29.5% |
| ON | `carbon.gasoline[1].from` | 2023-04-01 | 2024-04-01 |  |
| ON | `carbon.gasoline[1].rate` | 0.1431 | 0.1761 | +23.1% |
| ON | `carbon.heating.amount` | 187.75 | 227.57 | +21.2% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2023-01-01 | 2024-01-01 |  |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 93.25 | 122 | +30.8% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 46.5 | 61 | +31.2% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 23.25 | 30.5 | +31.2% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 46.5 | 61 | +31.2% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[1].date` | 2023-04-01 | 2024-04-01 |  |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[1].adult` | 122 | 140 | +14.8% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[1].spouse` | 61 | 70 | +14.8% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 30.5 | 35 | +14.8% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 61 | 70 | +14.8% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[2].date` | 2023-07-01 | 2024-07-01 |  |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[2].adult` | 122 | 140 | +14.8% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[2].spouse` | 61 | 70 | +14.8% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[2].child` | 30.5 | 35 | +14.8% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[2].firstChild` | 61 | 70 | +14.8% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[3].date` | 2023-10-01 | 2024-10-01 |  |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[3].adult` | 122 | 140 | +14.8% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[3].spouse` | 61 | 70 | +14.8% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[3].child` | 30.5 | 35 | +14.8% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[3].firstChild` | 61 | 70 | +14.8% |
| PE | `brackets[0].limit` | 31984 | 32656 | +2.1% |
| PE | `brackets[0].rate` | 0.098 | 0.0965 | -1.5% |
| PE | `brackets[1].limit` | 63969 | 64313 | +0.5% |
| PE | `brackets[1].rate` | 0.138 | 0.1363 | -1.2% |
| PE | `brackets[2].limit` | .inf | 105000 | n/a |
| PE | `brackets[2].rate` | 0.167 | 0.1665 | -0.3% |
| PE | `basicPersonalAmount` | 12750 | 13500 | +5.9% |
| PE | `spouseAmount.max` | 10829 | 11466 | +5.9% |
| PE | `spouseAmount.threshold` | 1083 | 1147 | +5.9% |
| PE | `lowIncomeReduction.params.threshold` | 20750 | 21500 | +3.6% |
| PE | `carbon.gasoline[0].from` | 2023-01-01 | 2024-01-01 |  |
| PE | `carbon.gasoline[0].rate` | 0.1105 | 0.1431 | +29.5% |
| PE | `carbon.gasoline[1].from` | 2023-07-01 | 2024-04-01 |  |
| PE | `carbon.gasoline[1].rate` | 0.1431 | 0.1761 | +23.1% |
| PE | `carbon.heating.amount` | 59.39 | 0 | -100.0% |
| PE | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2023-07-01 | 2024-01-01 |  |
| PE | `carbon.rebates[carbon-rebate-payments].params.payments[1].date` | 2023-10-01 | 2024-04-01 |  |
| PE | `carbon.rebates[carbon-rebate-payments].params.payments[1].adult` | 120 | 110 | -8.3% |
| PE | `carbon.rebates[carbon-rebate-payments].params.payments[1].spouse` | 60 | 55 | -8.3% |
| PE | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 30 | 27.5 | -8.3% |
| PE | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 60 | 55 | -8.3% |
| QC | `brackets[0].limit` | 49275 | 51780 | +5.1% |
| QC | `brackets[1].limit` | 98540 | 103545 | +5.1% |
| QC | `brackets[2].limit` | 119910 | 126000 | +5.1% |
| QC | `basicPersonalAmount` | 17183 | 18056 | +5.1% |
| QC | `quebec.workerDeduction.max` | 1315 | 1380 | +4.9% |
| QC | `quebec.livingAlone.max` | 1969 | 2069 | +5.1% |
| QC | `quebec.livingAlone.threshold` | 38945 | 40925 | +5.1% |
| QC | `propertyTax.rate` | 0.007414 | 0.007043 | -5.0% |
| QC | `childBenefit.params.max` | 2782 | 2923 | +5.1% |
| QC | `childBenefit.params.maxSingleParent` | 976 | 1026 | +5.1% |
| QC | `childBenefit.params.min` | 1107 | 1163 | +5.1% |
| QC | `childBenefit.params.minSingleParent` | 389 | 409 | +5.1% |
| QC | `childBenefit.params.thresholdSingle` | 40168 | 42136 | +4.9% |
| QC | `childBenefit.params.thresholdCouple` | 55183 | 57822 | +4.8% |
| QC | `childBenefit.params.schoolSupplies` | 115 | 121 | +5.2% |
| QC | `credits[quebec-solidarity-tax-credit].params.qstAdult` | 329 | 346 | +5.2% |
| QC | `credits[quebec-solidarity-tax-credit].params.qstSpouse` | 329 | 346 | +5.2% |
| QC | `credits[quebec-solidarity-tax-credit].params.qstAlone` | 156 | 164 | +5.1% |
| QC | `credits[quebec-solidarity-tax-credit].params.housingCouple` | 821 | 863 | +5.1% |
| QC | `credits[quebec-solidarity-tax-credit].params.housingSingle` | 677 | 711 | +5.0% |
| QC | `credits[quebec-solidarity-tax-credit].params.child` | 144 | 151 | +4.9% |
| QC | `credits[quebec-solidarity-tax-credit].params.threshold` | 39160 | 41150 | +5.1% |
| QC | `credits[quebec-work-premium].params.single[2]` | 11842 | 12334 | +4.2% |
| QC | `credits[quebec-work-premium].params.couple[2]` | 18338 | 19092 | +4.1% |
| QC | `credits[quebec-work-premium].params.parent[2]` | 11842 | 12334 | +4.2% |
| QC | `credits[quebec-work-premium].params.coupleKids[2]` | 18338 | 19092 | +4.1% |
| SK | `brackets[0].limit` | 49720 | 52057 | +4.7% |
| SK | `brackets[1].limit` | 142058 | 148734 | +4.7% |
| SK | `basicPersonalAmount` | 17661 | 18491 | +4.7% |
| SK | `dividendTaxCredit.nonEligible` | 0.02105 | 0.02519 | +19.7% |
| SK | `spouseAmount.max` | 17661 | 18491 | +4.7% |
| SK | `spouseAmount.threshold` | 1767 | 1850 | +4.7% |
| SK | `childAmount.perChild` | 6700 | 7015 | +4.7% |
| SK | `propertyTax.rate` | 0.010314586976000002 | 0.010716096728 | +3.9% |
| SK | `credits[sk-low-income-tax-credit].params.adult` | 380 | 398 | +4.7% |
| SK | `credits[sk-low-income-tax-credit].params.spouse` | 380 | 398 | +4.7% |
| SK | `credits[sk-low-income-tax-credit].params.child` | 150 | 157 | +4.7% |
| SK | `credits[sk-low-income-tax-credit].params.rate` | 0.027501037775010378 | 0.02750043356539405 | -0.0% |
| SK | `credits[sk-low-income-tax-credit].params.threshold` | 35902 | 37584 | +4.7% |
| SK | `carbon.gasoline[0].from` | 2023-01-01 | 2024-01-01 |  |
| SK | `carbon.gasoline[0].rate` | 0.1105 | 0.1431 | +29.5% |
| SK | `carbon.gasoline[1].from` | 2023-04-01 | 2024-04-01 |  |
| SK | `carbon.gasoline[1].rate` | 0.1431 | 0.1761 | +23.1% |
| SK | `carbon.heating.amount` | 240.06 | 0 | -100.0% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2023-01-01 | 2024-01-01 |  |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 137.5 | 170 | +23.6% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 68.75 | 85 | +23.6% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 34.5 | 42.5 | +23.2% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 68.75 | 85 | +23.6% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[1].date` | 2023-04-01 | 2024-04-01 |  |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[1].adult` | 170 | 188 | +10.6% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[1].spouse` | 85 | 94 | +10.6% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 42.5 | 47 | +10.6% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 85 | 94 | +10.6% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[2].date` | 2023-07-01 | 2024-07-01 |  |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[2].adult` | 170 | 188 | +10.6% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[2].spouse` | 85 | 94 | +10.6% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[2].child` | 42.5 | 47 | +10.6% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[2].firstChild` | 85 | 94 | +10.6% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[3].date` | 2023-10-01 | 2024-10-01 |  |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[3].adult` | 170 | 188 | +10.6% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[3].spouse` | 85 | 94 | +10.6% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[3].child` | 42.5 | 47 | +10.6% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[3].firstChild` | 85 | 94 | +10.6% |
| YT | `brackets[0].limit` | 53359 | 55867 | +4.7% |
| YT | `brackets[1].limit` | 106717 | 111733 | +4.7% |
| YT | `brackets[2].limit` | 165430 | 173205 | +4.7% |
| YT | `childBenefit.params.perChild` | 876 | 918 | +4.8% |
| YT | `carbon.heating.amount` | 242.85 | 0 | -100.0% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2023-01-01 | 2024-01-01 |  |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 80 | 93 | +16.3% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 80 | 93 | +16.3% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 80 | 93 | +16.3% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 80 | 93 | +16.3% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[1].date` | 2023-04-01 | 2024-04-01 |  |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[1].adult` | 80 | 93 | +16.3% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[1].spouse` | 80 | 93 | +16.3% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 80 | 93 | +16.3% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 80 | 93 | +16.3% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[2].date` | 2023-07-01 | 2024-07-01 |  |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[2].adult` | 93 | 77.5 | -16.7% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[2].spouse` | 93 | 77.5 | -16.7% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[2].child` | 93 | 77.5 | -16.7% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[2].firstChild` | 93 | 77.5 | -16.7% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[3].date` | 2023-10-01 | 2024-10-01 |  |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[3].adult` | 93 | 77.5 | -16.7% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[3].spouse` | 93 | 77.5 | -16.7% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[3].child` | 93 | 77.5 | -16.7% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[3].firstChild` | 93 | 77.5 | -16.7% |
| YT | `carbon.gasoline[0].from` | 2023-01-01 | 2024-01-01 |  |
| YT | `carbon.gasoline[0].rate` | 0.1105 | 0.1431 | +29.5% |
| YT | `carbon.gasoline[1].from` | 2023-04-01 | 2024-04-01 |  |
| YT | `carbon.gasoline[1].rate` | 0.1431 | 0.1761 | +23.1% |

</details>

<details><summary>4 unchanged values opted out</summary>

| File | In | Unchanged values | Why |
|---|---|---|---|
| MB | `familyTaxBenefit.params` | `basic` 2065, `dependant` 2065, `child` 2752, `childThrough` 18 | not indexed comment |

</details>
```

```text
> tax-visualizer@0.1.0 year-diff
> node --import tsx scripts/year-diff.ts 2025 2024

## Data diff: 2025 against 2024

379 values changed from 2024 to 2025 (81 over 15%), 93 amounts suspiciously unchanged, 39 added, 29 removed, 6 replaced. 23 unchanged values opted out.

### Suspiciously unchanged (93)

Amounts, thresholds and bracket limits that are the same in both years. If one is meant to stay put, say so with a `# not indexed` comment on its line (or `bracketsFrozenSince` for bracket limits).

| File | In | Unchanged values |
|---|---|---|
| federal | `payroll.cpp` | `exempt` 3500 |
| federal | `payroll.qpp` | `exempt` 3500 |
| federal | `workersBenefit.standard` | `floor[0]` 3000, `floor[1]` 3000 |
| federal | `workersBenefit.regional.AB` | `floor[0]` 2760, `floor[1]` 2760 |
| federal | `workersBenefit.regional.NU` | `floor[0]` 6000, `floor[1]` 6000 |
| federal | `workersBenefit.quebec` | `single[1]` 2400, `couple[1]` 3600, `parent[1]` 2400, `coupleKids[1]` 3600 |
| federal | `driving` | `efficiency` 9 |
| AB | `driving` | `distance` 16100 |
| BC | `childBenefit.params` | `singleParent` 500 |
| BC | `credits[bc-renters-tax-credit].params` | `max` 400 |
| BC | `driving` | `distance` 12900 |
| MB | `spouseAmount` | `max` 9134 |
| MB | `driving` | `distance` 15000 |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments` | `[1].adult` 150, `[1].spouse` 75, `[1].child` 37.5, `[1].firstChild` 75 |
| NB | `childBenefit.params` | `perChild` 250, `threshold` 20000 |
| NB | `childBenefit.params.workingIncomeSupplement` | `floor` 3750, `max` 250, `threshold` 20921 |
| NB | `credits[nb-hst-credit].params` | `adult` 300, `spouse` 300, `child` 100, `threshold` 35000 |
| NB | `driving` | `distance` 16100 |
| NL | `credits[nl-income-supplement].params` | `base` 254, `extraMax` 266, `extraFrom` 15000, `couple` 69, `child` 231, `threshold` 40000 |
| NL | `driving` | `distance` 15100 |
| NL | `carbon.rebates[carbon-rebate-payments].params.payments` | `[1].adult` 149, `[1].spouse` 74.5, `[1].child` 37.25, `[1].firstChild` 74.5 |
| NS | `childAmount` | `perChild` 1200 |
| NS | `lowIncomeReduction.params` | `individual` 300, `spouse` 300, `child` 165, `threshold` 15000 |
| NS | `childBenefit.params` | `fullBelow` 26000, `partialBelow` 34000 |
| NS | `credits[ns-affordable-living-tax-credit].params` | `base` 255, `child` 60, `threshold` 30000 |
| NS | `driving` | `distance` 17400 |
| NT | `driving` | `distance` 11000 |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments` | `[0].adult` 110.25, `[0].spouse` 110.25, `[1].adult` 110.25, `[1].spouse` 110.25 |
| NU | `childAmount` | `perChild` 1200 |
| NU | `childBenefit.params` | `perChild` 348, `threshold` 22065 |
| NU | `driving` | `distance` 6800 |
| ON | `brackets` | `[2].limit` 150000, `[3].limit` 220000 |
| ON | `driving` | `distance` 16200 |
| PE | `brackets` | `[2].limit` 105000, `[3].limit` 140000 |
| PE | `lowIncomeReduction.params` | `individual` 350, `spouse` 350, `child` 300 |
| PE | `childBenefit.params` | `bands[0][0]` 45000, `bands[1][0]` 80000 |
| PE | `credits[pei-sales-tax-credit].params` | `individual` 110, `spouseOrDependant` 55, `supplementFrom` 30000, `supplementMax` 55, `threshold` 50000 |
| PE | `driving` | `distance` 15100 |
| PE | `carbon.rebates[carbon-rebate-payments].params.payments` | `[1].adult` 110, `[1].spouse` 55, `[1].child` 27.5, `[1].firstChild` 55 |
| QC | `credits[quebec-work-premium].params` | `single[1]` 2400, `couple[1]` 3600, `parent[1]` 2400, `coupleKids[1]` 3600 |
| QC | `driving` | `distance` 14800 |
| SK | `driving` | `distance` 15300 |
| YT | `brackets` | `[3].limit` 500000 |
| YT | `childBenefit.params` | `threshold` 35000 |
| YT | `driving` | `distance` 13200 |

### Large changes, over 15% (81)

| File | Field | 2024 | 2025 | Change |
|---|---|--:|--:|--:|
| federal | `indexation` | 0.047 | 0.027 | -42.6% |
| AB | `brackets[0].limit` | 148269 | 60000 | -59.5% |
| AB | `brackets[0].rate` | 0.1 | 0.08 | -20.0% |
| AB | `brackets[1].rate` | 0.12 | 0.1 | -16.7% |
| AB | `brackets[2].limit` | 237230 | 181481 | -23.5% |
| AB | `brackets[3].limit` | 355845 | 241974 | -32.0% |
| AB | `brackets[4].limit` | .inf | 362961 | n/a |
| AB | `carbon.gasoline[0].rate` | 0.1431 | 0.1761 | +23.1% |
| AB | `carbon.gasoline[1].rate` | 0.1761 | 0 | -100.0% |
| AB | `carbon.heating.amount` | 384.52 | 99.45 | -74.1% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 193 | 225 | +16.6% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 96.5 | 112.5 | +16.6% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 48.25 | 56.25 | +16.6% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 96.5 | 112.5 | +16.6% |
| BC | `childBenefit.params.max[0]` | 2188 | 1750 | -20.0% |
| BC | `childBenefit.params.max[1]` | 1375 | 1100 | -20.0% |
| BC | `childBenefit.params.max[2]` | 1125 | 900 | -20.0% |
| BC | `childBenefit.params.min[0]` | 969 | 775 | -20.0% |
| BC | `childBenefit.params.min[1]` | 937 | 750 | -20.0% |
| BC | `childBenefit.params.min[2]` | 906 | 725 | -20.0% |
| BC | `childBenefit.params.threshold` | 35902 | 29526 | -17.8% |
| BC | `childBenefit.params.minThreshold` | 114887 | 94483 | -17.8% |
| BC | `carbon.gasoline[0].rate` | 0.1431 | 0.1761 | +23.1% |
| BC | `carbon.gasoline[1].rate` | 0.1761 | 0 | -100.0% |
| BC | `carbon.heating.amount` | 185.6 | 48 | -74.1% |
| MB | `carbon.gasoline[0].rate` | 0.1431 | 0.1761 | +23.1% |
| MB | `carbon.gasoline[1].rate` | 0.1761 | 0 | -100.0% |
| MB | `carbon.heating.amount` | 192.43 | 49.77 | -74.1% |
| NB | `carbon.gasoline[0].rate` | 0.1431 | 0.1761 | +23.1% |
| NB | `carbon.gasoline[1].rate` | 0.1761 | 0 | -100.0% |
| NB | `carbon.heating.amount` | 12.39 | 3.2 | -74.2% |
| NB | `carbon.rebates[carbon-rebate-payments].params.payments[1].adult` | 95 | 165 | +73.7% |
| NB | `carbon.rebates[carbon-rebate-payments].params.payments[1].spouse` | 47.5 | 82.5 | +73.7% |
| NB | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 23.75 | 41.25 | +73.7% |
| NB | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 47.5 | 82.5 | +73.7% |
| NL | `carbon.gasoline[0].rate` | 0.1431 | 0.1761 | +23.1% |
| NL | `carbon.gasoline[1].rate` | 0.1761 | 0 | -100.0% |
| NS | `dividendTaxCredit.nonEligible` | 0.0299 | 0.015 | -49.8% |
| NS | `propertyTax.rate` | 0.0111 | 0.0061 | -45.0% |
| NS | `carbon.gasoline[0].rate` | 0.1431 | 0.1761 | +23.1% |
| NS | `carbon.gasoline[1].rate` | 0.1761 | 0 | -100.0% |
| NS | `carbon.heating.amount` | 15.28 | 3.95 | -74.1% |
| NS | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 124 | 103 | -16.9% |
| NS | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 62 | 51.5 | -16.9% |
| NS | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 31 | 25.75 | -16.9% |
| NS | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 62 | 51.5 | -16.9% |
| NT | `carbon.heating.amount` | 103.97 | 0 | -100.0% |
| NT | `carbon.gasoline[0].rate` | 0.1431 | 0.1761 | +23.1% |
| NT | `carbon.gasoline[1].rate` | 0.1761 | 0 | -100.0% |
| NU | `propertyTax.rate` | 0.02033 | 0.01 | -50.8% |
| NU | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 77 | 25 | -67.5% |
| NU | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 77 | 25 | -67.5% |
| NU | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 77 | 25 | -67.5% |
| NU | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 77 | 25 | -67.5% |
| NU | `carbon.rebates[carbon-rebate-payments].params.payments[1].adult` | 77 | 25 | -67.5% |
| NU | `carbon.rebates[carbon-rebate-payments].params.payments[1].spouse` | 77 | 25 | -67.5% |
| NU | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 77 | 25 | -67.5% |
| NU | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 77 | 25 | -67.5% |
| NU | `carbon.gasoline[0].rate` | 0.1431 | 0.1761 | +23.1% |
| NU | `carbon.gasoline[1].rate` | 0.1761 | 0 | -100.0% |
| ON | `carbon.gasoline[0].rate` | 0.1431 | 0.1761 | +23.1% |
| ON | `carbon.gasoline[1].rate` | 0.1761 | 0 | -100.0% |
| ON | `carbon.heating.amount` | 227.57 | 58.86 | -74.1% |
| PE | `childBenefit.params.bands[0][1]` | 180 | 360 | +100.0% |
| PE | `childBenefit.params.bands[1][1]` | 120 | 240 | +100.0% |
| PE | `carbon.gasoline[0].rate` | 0.1431 | 0.1761 | +23.1% |
| PE | `carbon.gasoline[1].rate` | 0.1761 | 0 | -100.0% |
| QC | `propertyTax.rate` | 0.007043 | 0.009 | +27.8% |
| SK | `propertyTax.rate` | 0.010716096728 | 0.0134 | +25.0% |
| SK | `carbon.gasoline[0].rate` | 0.1431 | 0.1761 | +23.1% |
| SK | `carbon.gasoline[1].rate` | 0.1761 | 0 | -100.0% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 93 | 77.5 | -16.7% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 93 | 77.5 | -16.7% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 93 | 77.5 | -16.7% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 93 | 77.5 | -16.7% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[1].adult` | 93 | 77.5 | -16.7% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[1].spouse` | 93 | 77.5 | -16.7% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 93 | 77.5 | -16.7% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 93 | 77.5 | -16.7% |
| YT | `carbon.gasoline[0].rate` | 0.1431 | 0.1761 | +23.1% |
| YT | `carbon.gasoline[1].rate` | 0.1761 | 0 | -100.0% |

### Added, removed and replaced (74)

| File | Field | | Value |
|---|---|---|---|
| federal | `childcare` | added | {program: federal-childcare, params: {youngUnder: 7, eligibleThrough: 16, annua… |
| federal | `workersBenefit.estimated` | removed | true |
| federal | `workersBenefit.estimationNote` | removed | "Quebec's income-at-maximum thresholds are derived from the published Schedule … |
| federal | `fuelTax` | added | {gasoline: 0.1} |
| AB | `brackets[5]` | added | [.inf, 0.15] |
| AB | `propertyTax.estimated` | added | true |
| AB | `childBenefit` | replaced | {name: Alberta Child and Family Benefit, program: alberta-c… → {name: Alberta Child and Family Benefit, program: alberta-c… |
| AB | `fuelTax` | added | {gasoline: 0.13} |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[2]` | removed | {date: 2024-07-01, adult: 225, spouse: 112.5, child: 56.25, firstChild: 112.5, … |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[3]` | removed | {date: 2024-10-01, adult: 225, spouse: 112.5, child: 56.25, firstChild: 112.5, … |
| BC | `propertyTax.estimated` | added | true |
| BC | `fuelTax` | added | {gasoline: 0.085, area: Vancouver area, regional: {name: TransLink, gasoline: 0… |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[2]` | removed | {date: 2024-07-01, adult: 126, spouse: 63, child: 31.5, firstChild: 63, thresho… |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[3]` | removed | {date: 2024-10-01, adult: 126, spouse: 63, child: 31.5, firstChild: 63, thresho… |
| MB | `bracketsFrozenSince` | added | 2025 |
| MB | `basicPersonalAmount` | replaced | 15780 → {max: 15780, min: 0, from: 200000, to: 400000} |
| MB | `credits[mb-affordability-credits]` | added | {name: Homeowners affordability tax credit, nameRenter: Renters affordability t… |
| MB | `credits[mb-school-tax-credits]` | removed | {name: School tax rebate and education property tax credit, nameRenter: Renters… |
| MB | `fuelTax` | added | {gasoline: 0.125} |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[2]` | removed | {date: 2024-07-01, adult: 150, spouse: 75, child: 37.5, firstChild: 75, thresho… |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[3]` | removed | {date: 2024-10-01, adult: 150, spouse: 75, child: 37.5, firstChild: 75, thresho… |
| NB | `claimants` | added | {lowIncomeReduction: {claimant: minimum-household-tax, transferUnused: true, or… |
| NB | `propertyTax.estimated` | added | true |
| NB | `fuelTax` | added | {gasoline: 0.1087} |
| NB | `carbon.rebates[carbon-rebate-payments].params.payments[2]` | removed | {date: 2024-07-01, adult: 95, spouse: 47.5, child: 23.75, firstChild: 47.5, thr… |
| NB | `carbon.rebates[carbon-rebate-payments].params.payments[3]` | removed | {date: 2024-10-01, adult: 95, spouse: 47.5, child: 23.75, firstChild: 47.5, thr… |
| NL | `claimants` | added | {lowIncomeReduction: {claimant: minimum-household-tax, transferUnused: true, or… |
| NL | `propertyTax.estimated` | added | true |
| NL | `childBenefit` | replaced | {name: NL Child Benefit, program: nl-child-benefit-reductio… → {name: NL Child Benefit, program: nl-child-benefit, params:… |
| NL | `childcareCredit` | added | {name: Newfoundland and Labrador child care amount, program: nl-childcare, para… |
| NL | `fuelTax` | added | {gasoline: 0.075} |
| NL | `carbon.rebates[carbon-rebate-payments].params.payments[2]` | removed | {date: 2024-07-01, adult: 149, spouse: 74.5, child: 37.25, firstChild: 74.5, th… |
| NL | `carbon.rebates[carbon-rebate-payments].params.payments[3]` | removed | {date: 2024-10-01, adult: 149, spouse: 74.5, child: 37.25, firstChild: 74.5, th… |
| NS | `basicPersonalAmount` | replaced | {max: 11481, min: 8481, from: 25000, to: 75000} → 11744 |
| NS | `spouseAmount` | replaced | {program: nova-scotia-spouse-amount, params: {max: 8481, th… → {max: 11744, threshold: 874} |
| NS | `claimants` | added | {childAmount: {claimant: lower-net-income, transfer: none}, lowIncomeReduction:… |
| NS | `propertyTax.estimated` | added | true |
| NS | `fuelTax` | added | {gasoline: 0.155} |
| NS | `carbon.rebates[carbon-rebate-payments].params.payments[2]` | removed | {date: 2024-07-01, adult: 103, spouse: 51.5, child: 25.75, firstChild: 51.5, th… |
| NS | `carbon.rebates[carbon-rebate-payments].params.payments[3]` | removed | {date: 2024-10-01, adult: 103, spouse: 51.5, child: 25.75, firstChild: 51.5, th… |
| NT | `propertyTax.estimated` | added | true |
| NT | `propertyTax.rough` | added | true |
| NT | `childBenefit` | replaced | {name: NWT Child Benefit, program: nwt-child-benefit-age-gr… → {name: NWT Child Benefit, program: nwt-child-benefit, param… |
| NT | `fuelTax` | added | {gasoline: 0.107} |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[2]` | removed | {date: 2024-07-01, adult: 110.25, spouse: 110.25, child: 126.25, firstChild: 12… |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[3]` | removed | {date: 2024-10-01, adult: 110.25, spouse: 110.25, child: 126.25, firstChild: 12… |
| NU | `claimants` | added | {childAmount: {claimant: lower-net-income, transfer: schedule-2}} |
| NU | `propertyTax.rough` | added | true |
| NU | `fuelTax` | added | {gasoline: 0.064} |
| NU | `carbon.rebates[carbon-rebate-payments].params.payments[2]` | removed | {date: 2024-07-05, adult: 25, spouse: 25, child: 25, firstChild: 25, threshold:… |
| NU | `carbon.rebates[carbon-rebate-payments].params.payments[3]` | removed | {date: 2024-10-01, adult: 25, spouse: 25, child: 25, firstChild: 25, threshold:… |
| ON | `propertyTax.estimated` | added | true |
| ON | `childcareCredit` | added | {name: Ontario CARE tax credit, program: ontario-care, params: {fullThrough: 20… |
| ON | `fuelTax` | added | {gasoline: 0.09} |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[2]` | removed | {date: 2024-07-01, adult: 140, spouse: 70, child: 35, firstChild: 70, threshold… |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[3]` | removed | {date: 2024-10-01, adult: 140, spouse: 70, child: 35, firstChild: 70, threshold… |
| PE | `claimants` | added | {lowIncomeReduction: {claimant: minimum-household-tax, transferUnused: true, or… |
| PE | `childBenefit.estimated` | removed | true |
| PE | `fuelTax` | added | {gasoline: 0.0847} |
| PE | `carbon.rebates[carbon-rebate-payments].params.payments[2]` | removed | {date: 2024-07-01, adult: 110, spouse: 55, child: 27.5, firstChild: 55, thresho… |
| PE | `carbon.rebates[carbon-rebate-payments].params.payments[3]` | removed | {date: 2024-10-01, adult: 110, spouse: 55, child: 27.5, firstChild: 55, thresho… |
| PE | `childAmount` | removed | {perChild: 1200, ages: under6} |
| QC | `healthServicesFund` | added | {name: Quebec Health Services Fund, program: qc-health-services-fund, params: {… |
| QC | `childcareCredit` | added | {name: Quebec childcare expenses tax credit, program: quebec-childcare, params:… |
| QC | `fuelTax` | added | {gasoline: 0.192, regional: {name: ARTM, gasoline: 0.03}} |
| SK | `claimants` | added | {childAmount: {claimant: lower-taxable-income, transfer: schedule-2}} |
| SK | `fuelTax` | added | {gasoline: 0.15} |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[2]` | removed | {date: 2024-07-01, adult: 188, spouse: 94, child: 47, firstChild: 94, threshold… |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[3]` | removed | {date: 2024-10-01, adult: 188, spouse: 94, child: 47, firstChild: 94, threshold… |
| YT | `propertyTax.estimated` | added | true |
| YT | `propertyTax.rough` | added | true |
| YT | `fuelTax` | added | {gasoline: 0.062} |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[2]` | removed | {date: 2024-07-01, adult: 77.5, spouse: 77.5, child: 77.5, firstChild: 77.5, th… |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[3]` | removed | {date: 2024-10-01, adult: 77.5, spouse: 77.5, child: 77.5, firstChild: 77.5, th… |

<details><summary>All 379 changed values</summary>

| File | Field | 2024 | 2025 | Change |
|---|---|--:|--:|--:|
| federal | `brackets[0].limit` | 55867 | 57375 | +2.7% |
| federal | `brackets[0].rate` | 0.15 | 0.145 | -3.3% |
| federal | `brackets[1].limit` | 111733 | 114750 | +2.7% |
| federal | `brackets[2].limit` | 173205 | 177882 | +2.7% |
| federal | `brackets[3].limit` | 246752 | 253414 | +2.7% |
| federal | `basicPersonalAmount.max` | 15705 | 16129 | +2.7% |
| federal | `basicPersonalAmount.min` | 14156 | 14538 | +2.7% |
| federal | `basicPersonalAmount.from` | 173205 | 177882 | +2.7% |
| federal | `basicPersonalAmount.to` | 246752 | 253414 | +2.7% |
| federal | `employmentAmount` | 1433 | 1471 | +2.7% |
| federal | `indexation` | 0.047 | 0.027 | -42.6% |
| federal | `rrsp.limit` | 31560 | 32490 | +2.9% |
| federal | `payroll.cpp.ympe` | 68500 | 71300 | +4.1% |
| federal | `payroll.cpp.yampe` | 73200 | 81200 | +10.9% |
| federal | `payroll.qpp.ympe` | 68500 | 71300 | +4.1% |
| federal | `payroll.qpp.yampe` | 73200 | 81200 | +10.9% |
| federal | `payroll.ei.maxInsurable` | 63200 | 65700 | +4.0% |
| federal | `payroll.ei.rate` | 0.0166 | 0.0164 | -1.2% |
| federal | `payroll.ei.quebecRate` | 0.0132 | 0.0131 | -0.8% |
| federal | `payroll.qpip.maxInsurable` | 94000 | 98000 | +4.3% |
| federal | `childBenefit.perChildUnder6` | 7787 | 7997 | +2.7% |
| federal | `childBenefit.perChild6to17` | 6570 | 6748 | +2.7% |
| federal | `childBenefit.threshold1` | 36502 | 37487 | +2.7% |
| federal | `childBenefit.threshold2` | 79087 | 81222 | +2.7% |
| federal | `childBenefit.fixed2[1]` | 2981 | 3061 | +2.7% |
| federal | `childBenefit.fixed2[2]` | 5749 | 5904 | +2.7% |
| federal | `childBenefit.fixed2[3]` | 8091 | 8310 | +2.7% |
| federal | `childBenefit.fixed2[4]` | 9795 | 10059 | +2.7% |
| federal | `groceriesBenefit.adult` | 340 | 349 | +2.6% |
| federal | `groceriesBenefit.spouseOrFirstChild` | 340 | 349 | +2.6% |
| federal | `groceriesBenefit.child` | 179 | 184 | +2.8% |
| federal | `groceriesBenefit.singleSupplement.max` | 179 | 184 | +2.8% |
| federal | `groceriesBenefit.singleSupplement.from` | 11039 | 11337 | +2.7% |
| federal | `groceriesBenefit.phaseOut.from` | 44324 | 45521 | +2.7% |
| federal | `workersBenefit.standard.max[0]` | 1590 | 1633 | +2.7% |
| federal | `workersBenefit.standard.max[1]` | 2739 | 2813 | +2.7% |
| federal | `workersBenefit.standard.threshold[0]` | 26149 | 26855 | +2.7% |
| federal | `workersBenefit.standard.threshold[1]` | 29833 | 30639 | +2.7% |
| federal | `workersBenefit.secondaryEarnerExemption` | 15955 | 16386 | +2.7% |
| federal | `workersBenefit.regional.AB.max[0]` | 1704 | 1750 | +2.7% |
| federal | `workersBenefit.regional.AB.max[1]` | 2551 | 2619 | +2.7% |
| federal | `workersBenefit.regional.AB.threshold[0]` | 25472 | 26159 | +2.7% |
| federal | `workersBenefit.regional.AB.threshold[1]` | 31911 | 32772 | +2.7% |
| federal | `workersBenefit.regional.NU.max[0]` | 1578 | 1621 | +2.7% |
| federal | `workersBenefit.regional.NU.max[1]` | 2371 | 2435 | +2.7% |
| federal | `workersBenefit.regional.NU.threshold[0]` | 26127 | 26832 | +2.7% |
| federal | `workersBenefit.regional.NU.threshold[1]` | 35957 | 36927 | +2.7% |
| federal | `workersBenefit.quebec.single[2]` | 12333.994638069706 | 12620 | +2.3% |
| federal | `workersBenefit.quebec.single[3]` | 13829.82 | 14170.05 | +2.5% |
| federal | `workersBenefit.quebec.couple[2]` | 19092.010723860592 | 19534 | +2.3% |
| federal | `workersBenefit.quebec.couple[3]` | 21257.44 | 21787.19 | +2.5% |
| federal | `workersBenefit.quebec.parent[2]` | 12334 | 12620 | +2.3% |
| federal | `workersBenefit.quebec.parent[3]` | 13981.83 | 14341.56 | +2.6% |
| federal | `workersBenefit.quebec.coupleKids[2]` | 19092.00836820084 | 19534 | +2.3% |
| federal | `workersBenefit.quebec.coupleKids[3]` | 21456.77 | 22007.75 | +2.6% |
| AB | `brackets[0].limit` | 148269 | 60000 | -59.5% |
| AB | `brackets[0].rate` | 0.1 | 0.08 | -20.0% |
| AB | `brackets[1].limit` | 177922 | 151234 | -15.0% |
| AB | `brackets[1].rate` | 0.12 | 0.1 | -16.7% |
| AB | `brackets[2].limit` | 237230 | 181481 | -23.5% |
| AB | `brackets[2].rate` | 0.13 | 0.12 | -7.7% |
| AB | `brackets[3].limit` | 355845 | 241974 | -32.0% |
| AB | `brackets[3].rate` | 0.14 | 0.13 | -7.1% |
| AB | `brackets[4].limit` | .inf | 362961 | n/a |
| AB | `brackets[4].rate` | 0.15 | 0.14 | -6.7% |
| AB | `basicPersonalAmount` | 21885 | 22323 | +2.0% |
| AB | `spouseAmount.max` | 21885 | 22323 | +2.0% |
| AB | `propertyTax.rate` | 0.0064861 | 0.0066 | +1.8% |
| AB | `carbon.gasoline[0].from` | 2024-01-01 | 2025-01-01 |  |
| AB | `carbon.gasoline[0].rate` | 0.1431 | 0.1761 | +23.1% |
| AB | `carbon.gasoline[1].from` | 2024-04-01 | 2025-04-01 |  |
| AB | `carbon.gasoline[1].rate` | 0.1761 | 0 | -100.0% |
| AB | `carbon.heating.amount` | 384.52 | 99.45 | -74.1% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2024-01-01 | 2025-01-01 |  |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 193 | 225 | +16.6% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 96.5 | 112.5 | +16.6% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 48.25 | 56.25 | +16.6% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 96.5 | 112.5 | +16.6% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[1].date` | 2024-04-01 | 2025-04-01 |  |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[1].adult` | 225 | 228 | +1.3% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[1].spouse` | 112.5 | 114 | +1.3% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 56.25 | 57 | +1.3% |
| AB | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 112.5 | 114 | +1.3% |
| BC | `brackets[0].limit` | 47937 | 49279 | +2.8% |
| BC | `brackets[1].limit` | 95875 | 98560 | +2.8% |
| BC | `brackets[2].limit` | 110076 | 113158 | +2.8% |
| BC | `brackets[3].limit` | 133664 | 137407 | +2.8% |
| BC | `brackets[4].limit` | 181232 | 186306 | +2.8% |
| BC | `brackets[5].limit` | 252752 | 259829 | +2.8% |
| BC | `basicPersonalAmount` | 12580 | 12932 | +2.8% |
| BC | `spouseAmount.max` | 10772 | 11073 | +2.8% |
| BC | `spouseAmount.threshold` | 1078 | 1108 | +2.8% |
| BC | `bcTaxReduction.max` | 547 | 562 | +2.7% |
| BC | `bcTaxReduction.threshold` | 24338 | 25020 | +2.8% |
| BC | `propertyTax.rate` | 0.00296818 | 0.003 | +1.1% |
| BC | `childBenefit.params.max[0]` | 2188 | 1750 | -20.0% |
| BC | `childBenefit.params.max[1]` | 1375 | 1100 | -20.0% |
| BC | `childBenefit.params.max[2]` | 1125 | 900 | -20.0% |
| BC | `childBenefit.params.min[0]` | 969 | 775 | -20.0% |
| BC | `childBenefit.params.min[1]` | 937 | 750 | -20.0% |
| BC | `childBenefit.params.min[2]` | 906 | 725 | -20.0% |
| BC | `childBenefit.params.threshold` | 35902 | 29526 | -17.8% |
| BC | `childBenefit.params.minThreshold` | 114887 | 94483 | -17.8% |
| BC | `credits[bc-renters-tax-credit].params.threshold` | 63000 | 64764 | +2.8% |
| BC | `carbon.gasoline[0].from` | 2024-01-01 | 2025-01-01 |  |
| BC | `carbon.gasoline[0].rate` | 0.1431 | 0.1761 | +23.1% |
| BC | `carbon.gasoline[1].from` | 2024-04-01 | 2025-04-01 |  |
| BC | `carbon.gasoline[1].rate` | 0.1761 | 0 | -100.0% |
| BC | `carbon.heating.amount` | 185.6 | 48 | -74.1% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2024-01-01 | 2025-01-01 |  |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 111.75 | 126 | +12.8% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 55.875 | 63 | +12.8% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 27.875 | 31.5 | +13.0% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 55.875 | 63 | +12.8% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].threshold[0]` | 39115 | 41071 | +5.0% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[0].threshold[1]` | 50170 | 57288 | +14.2% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].date` | 2024-04-01 | 2025-04-01 |  |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].adult` | 111.75 | 126 | +12.8% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].spouse` | 55.875 | 63 | +12.8% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 27.875 | 31.5 | +13.0% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 55.875 | 63 | +12.8% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].threshold[0]` | 39115 | 41071 | +5.0% |
| BC | `carbon.rebates[carbon-rebate-payments].params.payments[1].threshold[1]` | 50170 | 57288 | +14.2% |
| MB | `propertyTax.rate` | 0.0122769 | 0.0138 | +12.4% |
| MB | `carbon.gasoline[0].from` | 2024-01-01 | 2025-01-01 |  |
| MB | `carbon.gasoline[0].rate` | 0.1431 | 0.1761 | +23.1% |
| MB | `carbon.gasoline[1].from` | 2024-04-01 | 2025-04-01 |  |
| MB | `carbon.gasoline[1].rate` | 0.1761 | 0 | -100.0% |
| MB | `carbon.heating.amount` | 192.43 | 49.77 | -74.1% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2024-01-01 | 2025-01-01 |  |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 132 | 150 | +13.6% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 66 | 75 | +13.6% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 33 | 37.5 | +13.6% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 66 | 75 | +13.6% |
| MB | `carbon.rebates[carbon-rebate-payments].params.payments[1].date` | 2024-04-01 | 2025-04-01 |  |
| NB | `brackets[0].limit` | 49958 | 51306 | +2.7% |
| NB | `brackets[1].limit` | 99916 | 102614 | +2.7% |
| NB | `brackets[2].limit` | 185064 | 190060 | +2.7% |
| NB | `basicPersonalAmount` | 13044 | 13396 | +2.7% |
| NB | `spouseAmount.max` | 10223 | 10499 | +2.7% |
| NB | `spouseAmount.threshold` | 1023 | 1051 | +2.7% |
| NB | `lowIncomeReduction.params.amount` | 781 | 802 | +2.7% |
| NB | `lowIncomeReduction.params.threshold` | 21343 | 21920 | +2.7% |
| NB | `propertyTax.rate` | 0.014231 | 0.0136 | -4.4% |
| NB | `carbon.gasoline[0].from` | 2024-01-01 | 2025-01-01 |  |
| NB | `carbon.gasoline[0].rate` | 0.1431 | 0.1761 | +23.1% |
| NB | `carbon.gasoline[1].from` | 2024-04-01 | 2025-04-01 |  |
| NB | `carbon.gasoline[1].rate` | 0.1761 | 0 | -100.0% |
| NB | `carbon.heating.amount` | 12.39 | 3.2 | -74.2% |
| NB | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2024-01-01 | 2025-01-01 |  |
| NB | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 92 | 95 | +3.3% |
| NB | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 46 | 47.5 | +3.3% |
| NB | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 23 | 23.75 | +3.3% |
| NB | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 46 | 47.5 | +3.3% |
| NB | `carbon.rebates[carbon-rebate-payments].params.payments[1].date` | 2024-04-01 | 2025-04-01 |  |
| NB | `carbon.rebates[carbon-rebate-payments].params.payments[1].adult` | 95 | 165 | +73.7% |
| NB | `carbon.rebates[carbon-rebate-payments].params.payments[1].spouse` | 47.5 | 82.5 | +73.7% |
| NB | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 23.75 | 41.25 | +73.7% |
| NB | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 47.5 | 82.5 | +73.7% |
| NL | `brackets[0].limit` | 43198 | 44192 | +2.3% |
| NL | `brackets[1].limit` | 86395 | 88382 | +2.3% |
| NL | `brackets[2].limit` | 154244 | 157792 | +2.3% |
| NL | `brackets[3].limit` | 215943 | 220910 | +2.3% |
| NL | `brackets[4].limit` | 275870 | 282214 | +2.3% |
| NL | `brackets[5].limit` | 551739 | 564429 | +2.3% |
| NL | `brackets[6].limit` | 1103478 | 1128858 | +2.3% |
| NL | `basicPersonalAmount` | 10818 | 11067 | +2.3% |
| NL | `spouseAmount.max` | 8840 | 9043 | +2.3% |
| NL | `spouseAmount.threshold` | 885 | 905 | +2.3% |
| NL | `lowIncomeReduction.params.individual` | 974 | 997 | +2.4% |
| NL | `lowIncomeReduction.params.family` | 544 | 557 | +2.4% |
| NL | `lowIncomeReduction.params.thresholdIndividual` | 23390 | 23928 | +2.3% |
| NL | `lowIncomeReduction.params.thresholdFamily` | 39551 | 40460 | +2.3% |
| NL | `carbon.gasoline[0].from` | 2024-01-01 | 2025-01-01 |  |
| NL | `carbon.gasoline[0].rate` | 0.1431 | 0.1761 | +23.1% |
| NL | `carbon.gasoline[1].from` | 2024-04-01 | 2025-04-01 |  |
| NL | `carbon.gasoline[1].rate` | 0.1761 | 0 | -100.0% |
| NL | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2024-01-01 | 2025-01-01 |  |
| NL | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 164 | 149 | -9.1% |
| NL | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 82 | 74.5 | -9.1% |
| NL | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 41 | 37.25 | -9.1% |
| NL | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 82 | 74.5 | -9.1% |
| NL | `carbon.rebates[carbon-rebate-payments].params.payments[1].date` | 2024-04-01 | 2025-04-01 |  |
| NS | `brackets[0].limit` | 29590 | 30507 | +3.1% |
| NS | `brackets[1].limit` | 59180 | 61015 | +3.1% |
| NS | `brackets[2].limit` | 93000 | 95883 | +3.1% |
| NS | `brackets[3].limit` | 150000 | 154650 | +3.1% |
| NS | `dividendTaxCredit.nonEligible` | 0.0299 | 0.015 | -49.8% |
| NS | `salesTax.rate` | 0.15 | 0.1425 | -5.0% |
| NS | `salesTax.label` | 15% HST | 14% HST (15% before April 1) |  |
| NS | `propertyTax.rate` | 0.0111 | 0.0061 | -45.0% |
| NS | `childBenefit.params.perChild` | 1525 | 1524.96 | -0.0% |
| NS | `childBenefit.params.partialOtherChildren` | 762.5 | 762.48 | -0.0% |
| NS | `carbon.gasoline[0].from` | 2024-01-01 | 2025-01-01 |  |
| NS | `carbon.gasoline[0].rate` | 0.1431 | 0.1761 | +23.1% |
| NS | `carbon.gasoline[1].from` | 2024-04-01 | 2025-04-01 |  |
| NS | `carbon.gasoline[1].rate` | 0.1761 | 0 | -100.0% |
| NS | `carbon.heating.amount` | 15.28 | 3.95 | -74.1% |
| NS | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2024-01-01 | 2025-01-01 |  |
| NS | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 124 | 103 | -16.9% |
| NS | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 62 | 51.5 | -16.9% |
| NS | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 31 | 25.75 | -16.9% |
| NS | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 62 | 51.5 | -16.9% |
| NS | `carbon.rebates[carbon-rebate-payments].params.payments[1].date` | 2024-04-01 | 2025-04-01 |  |
| NS | `carbon.rebates[carbon-rebate-payments].params.payments[1].adult` | 103 | 110 | +6.8% |
| NS | `carbon.rebates[carbon-rebate-payments].params.payments[1].spouse` | 51.5 | 55 | +6.8% |
| NS | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 25.75 | 27.5 | +6.8% |
| NS | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 51.5 | 55 | +6.8% |
| NT | `brackets[0].limit` | 50597 | 51964 | +2.7% |
| NT | `brackets[1].limit` | 101198 | 103930 | +2.7% |
| NT | `brackets[2].limit` | 164525 | 168967 | +2.7% |
| NT | `basicPersonalAmount` | 17373 | 17842 | +2.7% |
| NT | `spouseAmount.max` | 17373 | 17842 | +2.7% |
| NT | `propertyTax.rate` | 0.00956 | 0.01 | +4.6% |
| NT | `propertyTax.city` | Yellowknife | Yellowknife (est.) |  |
| NT | `carbon.heating.amount` | 103.97 | 0 | -100.0% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2024-01-01 | 2025-01-01 |  |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 123.25 | 126.25 | +2.4% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 123.25 | 126.25 | +2.4% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[1].date` | 2024-04-01 | 2025-04-01 |  |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 123.25 | 126.25 | +2.4% |
| NT | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 123.25 | 126.25 | +2.4% |
| NT | `carbon.gasoline[0].from` | 2024-01-01 | 2025-01-01 |  |
| NT | `carbon.gasoline[0].rate` | 0.1431 | 0.1761 | +23.1% |
| NT | `carbon.gasoline[1].from` | 2024-04-01 | 2025-04-01 |  |
| NT | `carbon.gasoline[1].rate` | 0.1761 | 0 | -100.0% |
| NU | `brackets[0].limit` | 53268 | 54707 | +2.7% |
| NU | `brackets[1].limit` | 106537 | 109413 | +2.7% |
| NU | `brackets[2].limit` | 173205 | 177881 | +2.7% |
| NU | `basicPersonalAmount` | 18767 | 19274 | +2.7% |
| NU | `spouseAmount.max` | 18767 | 19274 | +2.7% |
| NU | `propertyTax.rate` | 0.02033 | 0.01 | -50.8% |
| NU | `propertyTax.city` | Iqaluit | Iqaluit (est.) |  |
| NU | `childBenefit.rateSource` | "Nunavut Anti-Poverty Secretariat commi… | its 2026 Bill 4 (no 2025 source gives t… |  |
| NU | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2024-01-01 | 2025-01-01 |  |
| NU | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 77 | 25 | -67.5% |
| NU | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 77 | 25 | -67.5% |
| NU | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 77 | 25 | -67.5% |
| NU | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 77 | 25 | -67.5% |
| NU | `carbon.rebates[carbon-rebate-payments].params.payments[1].date` | 2024-04-01 | 2025-04-04 |  |
| NU | `carbon.rebates[carbon-rebate-payments].params.payments[1].adult` | 77 | 25 | -67.5% |
| NU | `carbon.rebates[carbon-rebate-payments].params.payments[1].spouse` | 77 | 25 | -67.5% |
| NU | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 77 | 25 | -67.5% |
| NU | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 77 | 25 | -67.5% |
| NU | `carbon.gasoline[0].from` | 2024-01-01 | 2025-01-01 |  |
| NU | `carbon.gasoline[0].rate` | 0.1431 | 0.1761 | +23.1% |
| NU | `carbon.gasoline[1].from` | 2024-04-01 | 2025-04-01 |  |
| NU | `carbon.gasoline[1].rate` | 0.1761 | 0 | -100.0% |
| ON | `brackets[0].limit` | 51446 | 52886 | +2.8% |
| ON | `brackets[1].limit` | 102894 | 105775 | +2.8% |
| ON | `basicPersonalAmount` | 12399 | 12747 | +2.8% |
| ON | `spouseAmount.max` | 10528 | 10823 | +2.8% |
| ON | `spouseAmount.threshold` | 1053 | 1082 | +2.8% |
| ON | `surtax[0][0]` | 5554 | 5710 | +2.8% |
| ON | `surtax[1][0]` | 7108 | 7307 | +2.8% |
| ON | `ontarioTaxReduction.base` | 286 | 294 | +2.8% |
| ON | `ontarioTaxReduction.perChild` | 529 | 544 | +2.8% |
| ON | `propertyTax.rate` | 0.00715289 | 0.0076 | +6.3% |
| ON | `childBenefit.params.perChild` | 1680 | 1726.92 | +2.8% |
| ON | `childBenefit.params.threshold` | 25646 | 26364 | +2.8% |
| ON | `credits[ontario-sales-tax-credit].params.perPerson` | 360 | 371 | +3.1% |
| ON | `credits[ontario-sales-tax-credit].params.thresholdSingle` | 27729 | 28506 | +2.8% |
| ON | `credits[ontario-sales-tax-credit].params.thresholdFamily` | 34661 | 35632 | +2.8% |
| ON | `credits[ontario-energy-property-tax-credit].params.energyMax` | 277 | 285 | +2.9% |
| ON | `credits[ontario-energy-property-tax-credit].params.propertyBase` | 69 | 71 | +2.9% |
| ON | `credits[ontario-energy-property-tax-credit].params.propertyMax` | 902 | 927 | +2.8% |
| ON | `credits[ontario-energy-property-tax-credit].params.thresholdSingle` | 27729 | 28506 | +2.8% |
| ON | `credits[ontario-energy-property-tax-credit].params.thresholdFamily` | 34661 | 35632 | +2.8% |
| ON | `carbon.gasoline[0].from` | 2024-01-01 | 2025-01-01 |  |
| ON | `carbon.gasoline[0].rate` | 0.1431 | 0.1761 | +23.1% |
| ON | `carbon.gasoline[1].from` | 2024-04-01 | 2025-04-01 |  |
| ON | `carbon.gasoline[1].rate` | 0.1761 | 0 | -100.0% |
| ON | `carbon.heating.amount` | 227.57 | 58.86 | -74.1% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2024-01-01 | 2025-01-01 |  |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 122 | 140 | +14.8% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 61 | 70 | +14.8% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 30.5 | 35 | +14.8% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 61 | 70 | +14.8% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[1].date` | 2024-04-01 | 2025-04-01 |  |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[1].adult` | 140 | 151 | +7.9% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[1].spouse` | 70 | 75.5 | +7.9% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 35 | 37.75 | +7.9% |
| ON | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 70 | 75.5 | +7.9% |
| PE | `brackets[0].limit` | 32656 | 33328 | +2.1% |
| PE | `brackets[0].rate` | 0.0965 | 0.095 | -1.6% |
| PE | `brackets[1].limit` | 64313 | 64656 | +0.5% |
| PE | `brackets[1].rate` | 0.1363 | 0.1347 | -1.2% |
| PE | `brackets[2].rate` | 0.1665 | 0.166 | -0.3% |
| PE | `brackets[3].rate` | 0.18 | 0.1762 | -2.1% |
| PE | `brackets[4].rate` | 0.1875 | 0.19 | +1.3% |
| PE | `basicPersonalAmount` | 13500 | 14650 | +8.5% |
| PE | `spouseAmount.max` | 11466 | 12443 | +8.5% |
| PE | `spouseAmount.threshold` | 1147 | 1244 | +8.5% |
| PE | `lowIncomeReduction.params.threshold` | 21500 | 22650 | +5.3% |
| PE | `childBenefit.params.bands[0][1]` | 180 | 360 | +100.0% |
| PE | `childBenefit.params.bands[1][1]` | 120 | 240 | +100.0% |
| PE | `carbon.gasoline[0].from` | 2024-01-01 | 2025-01-01 |  |
| PE | `carbon.gasoline[0].rate` | 0.1431 | 0.1761 | +23.1% |
| PE | `carbon.gasoline[1].from` | 2024-04-01 | 2025-04-01 |  |
| PE | `carbon.gasoline[1].rate` | 0.1761 | 0 | -100.0% |
| PE | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2024-01-01 | 2025-01-01 |  |
| PE | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 120 | 110 | -8.3% |
| PE | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 60 | 55 | -8.3% |
| PE | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 30 | 27.5 | -8.3% |
| PE | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 60 | 55 | -8.3% |
| PE | `carbon.rebates[carbon-rebate-payments].params.payments[1].date` | 2024-04-01 | 2025-04-01 |  |
| QC | `brackets[0].limit` | 51780 | 53255 | +2.8% |
| QC | `brackets[1].limit` | 103545 | 106495 | +2.8% |
| QC | `brackets[2].limit` | 126000 | 129590 | +2.8% |
| QC | `basicPersonalAmount` | 18056 | 18571 | +2.9% |
| QC | `quebec.workerDeduction.max` | 1380 | 1420 | +2.9% |
| QC | `quebec.livingAlone.max` | 2069 | 2128 | +2.9% |
| QC | `quebec.livingAlone.threshold` | 40925 | 42090 | +2.8% |
| QC | `propertyTax.rate` | 0.007043 | 0.009 | +27.8% |
| QC | `propertyTax.note` | school tax is billed separately | school tax may be extra |  |
| QC | `childBenefit.params.max` | 2923 | 3006 | +2.8% |
| QC | `childBenefit.params.maxSingleParent` | 1026 | 1055 | +2.8% |
| QC | `childBenefit.params.min` | 1163 | 1196 | +2.8% |
| QC | `childBenefit.params.minSingleParent` | 409 | 421 | +2.9% |
| QC | `childBenefit.params.thresholdSingle` | 42136 | 43280 | +2.7% |
| QC | `childBenefit.params.thresholdCouple` | 57822 | 59369 | +2.7% |
| QC | `childBenefit.params.schoolSupplies` | 121 | 124 | +2.5% |
| QC | `credits[quebec-solidarity-tax-credit].params.qstAdult` | 346 | 356 | +2.9% |
| QC | `credits[quebec-solidarity-tax-credit].params.qstSpouse` | 346 | 356 | +2.9% |
| QC | `credits[quebec-solidarity-tax-credit].params.qstAlone` | 164 | 169 | +3.0% |
| QC | `credits[quebec-solidarity-tax-credit].params.housingCouple` | 863 | 888 | +2.9% |
| QC | `credits[quebec-solidarity-tax-credit].params.housingSingle` | 711 | 731 | +2.8% |
| QC | `credits[quebec-solidarity-tax-credit].params.child` | 151 | 155 | +2.6% |
| QC | `credits[quebec-solidarity-tax-credit].params.threshold` | 41150 | 42325 | +2.9% |
| QC | `credits[quebec-work-premium].params.single[2]` | 12334 | 12620 | +2.3% |
| QC | `credits[quebec-work-premium].params.couple[2]` | 19092 | 19534 | +2.3% |
| QC | `credits[quebec-work-premium].params.parent[2]` | 12334 | 12620 | +2.3% |
| QC | `credits[quebec-work-premium].params.coupleKids[2]` | 19092 | 19534 | +2.3% |
| SK | `brackets[0].limit` | 52057 | 53463 | +2.7% |
| SK | `brackets[1].limit` | 148734 | 152750 | +2.7% |
| SK | `basicPersonalAmount` | 18491 | 19491 | +5.4% |
| SK | `spouseAmount.max` | 18491 | 19491 | +5.4% |
| SK | `spouseAmount.threshold` | 1850 | 1949 | +5.4% |
| SK | `childAmount.perChild` | 7015 | 7704 | +9.8% |
| SK | `propertyTax.rate` | 0.010716096728 | 0.0134 | +25.0% |
| SK | `credits[sk-low-income-tax-credit].params.adult` | 398 | 429 | +7.8% |
| SK | `credits[sk-low-income-tax-credit].params.spouse` | 398 | 429 | +7.8% |
| SK | `credits[sk-low-income-tax-credit].params.child` | 157 | 169 | +7.6% |
| SK | `credits[sk-low-income-tax-credit].params.rate` | 0.02750043356539405 | 0.02884 | +4.9% |
| SK | `credits[sk-low-income-tax-credit].params.threshold` | 37584 | 38588 | +2.7% |
| SK | `carbon.gasoline[0].from` | 2024-01-01 | 2025-01-01 |  |
| SK | `carbon.gasoline[0].rate` | 0.1431 | 0.1761 | +23.1% |
| SK | `carbon.gasoline[1].from` | 2024-04-01 | 2025-04-01 |  |
| SK | `carbon.gasoline[1].rate` | 0.1761 | 0 | -100.0% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2024-01-01 | 2025-01-01 |  |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 170 | 188 | +10.6% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 85 | 94 | +10.6% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 42.5 | 47 | +10.6% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 85 | 94 | +10.6% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[1].date` | 2024-04-01 | 2025-04-01 |  |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[1].adult` | 188 | 206 | +9.6% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[1].spouse` | 94 | 103 | +9.6% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 47 | 51.5 | +9.6% |
| SK | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 94 | 103 | +9.6% |
| YT | `brackets[0].limit` | 55867 | 57375 | +2.7% |
| YT | `brackets[1].limit` | 111733 | 114750 | +2.7% |
| YT | `brackets[2].limit` | 173205 | 177882 | +2.7% |
| YT | `propertyTax.rate` | 0.01076 | 0.01 | -7.1% |
| YT | `propertyTax.city` | Whitehorse | Whitehorse (est.) |  |
| YT | `childBenefit.params.perChild` | 918 | 936.96 | +2.1% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[0].date` | 2024-01-01 | 2025-01-01 |  |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[0].adult` | 93 | 77.5 | -16.7% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[0].spouse` | 93 | 77.5 | -16.7% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[0].child` | 93 | 77.5 | -16.7% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[0].firstChild` | 93 | 77.5 | -16.7% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[1].date` | 2024-04-01 | 2025-04-01 |  |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[1].adult` | 93 | 77.5 | -16.7% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[1].spouse` | 93 | 77.5 | -16.7% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[1].child` | 93 | 77.5 | -16.7% |
| YT | `carbon.rebates[carbon-rebate-payments].params.payments[1].firstChild` | 93 | 77.5 | -16.7% |
| YT | `carbon.gasoline[0].from` | 2024-01-01 | 2025-01-01 |  |
| YT | `carbon.gasoline[0].rate` | 0.1431 | 0.1761 | +23.1% |
| YT | `carbon.gasoline[1].from` | 2024-04-01 | 2025-04-01 |  |
| YT | `carbon.gasoline[1].rate` | 0.1761 | 0 | -100.0% |

</details>

<details><summary>23 unchanged values opted out</summary>

| File | In | Unchanged values | Why |
|---|---|---|---|
| MB | `brackets` | `[0].limit` 47000, `[1].limit` 100000 | bracketsFrozenSince: 2025 |
| MB | `familyTaxBenefit.params` | `basic` 2065, `dependant` 2065, `child` 2752, `childThrough` 18 | not indexed comment |
| ON | `lift` | `max` 875, `threshold` 32500, `familyThreshold` 65000 | not indexed comment |
| ON | `payroll` | `healthPremium[0][0]` 200000, `healthPremium[0][1]` 750, `healthPremium[0][3]` 900, `healthPremium[1][0]` 72000, `healthPremium[1][1]` 600, `healthPremium[1][3]` 750, `healthPremium[2][0]` 48000, `healthPremium[2][1]` 450, `healthPremium[2][3]` 600, `healthPremium[3][0]` 36000, `healthPremium[3][1]` 300, `healthPremium[3][3]` 450, `healthPremium[4][0]` 20000, `healthPremium[4][3]` 300 | not indexed comment |

</details>
```

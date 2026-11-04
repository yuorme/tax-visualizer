# Issue 116: 2025–2026 NWT child-benefit correction

The NWT benefit now counts children under six and children aged six through seventeen separately, adds their
published annual table amounts, and applies the published income reduction. The existing reviewed
`nwt-child-benefit-age-groups` program already serves 2023/2024; this correction activates it for 2025/2026.
No engine, payroll, federal data, unrelated province, or historical-year calculation changes.

## Sources and continuity

- [CRA T4114-25, printed pp. 21–22](2025/sources/t4114-25.txt): July 2025–June 2026; fetched November 1, 2026.
- [CRA T4114-26, printed pp. 21–22](2026/sources/t4114-26.txt): July 2026–June 2027; fetched November 4, 2026.
  This is a separate publication, modified September 10, 2026. Its original SHA-256 is
  `8089d69b163dd400faafd9ef9a9ef6b1480abfc0de1479b5cb0c3f06f9bf472d`.
- [NWT Finance fact sheet, p. 2](2024/sources/federal-nwt-benefit.txt): exact annual age-group tables and formula.
- [Prior reviewed correction](2024-nwt-correction.md): interpretation and historical independent calculations.

Both CRA editions print the following monthly values, independently confirming continuity rather than assuming
the 2026 figures carry over from 2025. The exact annual amounts come from NWT Finance, not twelve times the
rounded CRA monthly amounts. The two publications support different parts of the same continuing program.

| Age-group count | CRA under six/month | Finance under six/year | CRA age 6–17/month | Finance age 6–17/year |
|---|---:|---:|---:|---:|
| 1 | 67.91 | 815 | 54.33 | 652 |
| 2 | 122.25 | 1467 | 97.83 | 1174 |
| 3 | 166.41 | 1997 | 133.08 | 1597 |
| 4 | 203.75 | 2445 | 163.00 | 1956 |
| Each subsequent child | 30.58 | 367 | 24.41 | 293 |

Let C be the under-six table entitlement and D the age-six-through-seventeen table entitlement. Full benefit is
`C + D` up to $30,000 family net income. Above that, subtract `(income - 30000) * (C + D) / 50000`, floored at zero.
Both CRA editions confirm the $30,000 start and $80,000 exhaustion threshold. As before, benefit-year amounts
are applied to current-year income; this does not reconstruct actual monthly payments based on prior-year returns.

For $55,000 family net income, two young and one older child, the entitlement is
`(1467 + 652) * (80000 - 55000) / 50000 = $1,059.50`. The old blend gave $931.80.
Even replacing its rounded amounts with exact annual amounts leaves the blend wrong at $931.833333.

The two NWT YAML files cite their own year's CRA edition and the provincial annual fact sheet. Their child benefit
no longer carries `estimated: true`. The existing property-tax, driving and heating estimates retain their flags.
Newfoundland and Labrador's estimated taper and Nunavut's separate rate-source qualification remain applicable.
The 2026 source text and its INDEX entry were supplied by the orchestrator before this task and are preserved.

## Independent audit and negative controls

`tests/nwt-child-benefit-form.ts` imports neither engine code nor YAML, including types. Its constants are typed
from the publications. It expresses each age table as marginal additions, so its implementation differs from the
engine's cumulative-table lookup. It also implements the inherited blend as a deliberately incorrect control.
The tests reject both the old $931.80 result and the blend using exact annual amounts. A single-child control
separately distinguishes $814.92 from $815, and a mixed fifth-child control catches counting extras across both ages.

To audit every counterfactual, family net income is independently reconstructed from the stored household inputs:
employment, other income and foreign income in full; positive gains at 50%; Canadian dividends at 138%/115%; less
deductions and enhanced CPP. Net income is floored per person; only spouses combine it. These specimens have no
childcare claims. CPP uses the $3,500 exemption, a 1% first enhancement and 4% second enhancement, with
YMPE/YAMPE $71,300/$81,200 in 2025 and $74,600/$85,000 in 2026. Supporting caches are the
[2025 CPP tables](2025/sources/seniors-oas-q4.txt),
[2026 T4127 F5 and tables 8.5–8.6](138-senior-credit-rules/sources/t4127-2026.txt), and
[2025 federal worksheet](2025/sources/seniors-federal-worksheet.txt) for dividend gross-ups.
This audit exercises existing CPP behavior and does not modify it or depend on concurrent issue #146.

For each of 158 households (148 shared plus 10 original other-income), in each corrected year, the test checks
the original input, each $100 income-type bump, and the no-investment counterfactual: 2,528 independent comparisons.
With `d = corrected benefit - inherited benefit`, the justified changes are:

- `provBen`, `childBen`, `benefits`: add `d`.
- `netTotal`, `total`: subtract `d`; `avg`: subtract `d / cash` when cash is positive.
- `marg`, `margBy.*`: add `(d_at_base - d_at_bumped_income) / 100`.
- `invTax`: add `d_without_investments - d_at_base`.

Before patching a golden cell, the one-off script checked that the original engine program still exactly matched
the locked snapshot, verified the unrounded change against the independent arithmetic, and limited edits to the
listed benefit-dependent paths under NT. It then checked every unrelated province, field and input was preserved.
It did not run either capture command. The committed regression suite retains all prior assertions and tolerances.

## Reconciliation with issue 116

The base checkout was `2f35cab2c1a7e2789d5201785354c1db3833e87d` (also `origin/main` at dispatch).
Main already includes #92, #145 and #91, which changed other provinces. Every NWT before/after benefit in both
44-case issue tables still matches to four decimals, and the largest increase remains $652.44 in each year.
The tables below subtract the displayed four-decimal endpoints, as the issue does. In 2025 case 101 that is
$0.0286; rounding its unrounded delta instead would give $0.0287. This is display rounding, not a changed result.

Cases 39, 62, 98, 110 and 114 in each year have zero benefit both before and after. Their `invTax` changes because
removing investments moves family income into the child-benefit range. They belong in the 44 affected cases.
The three CPP-dependent rows (51, 101 and 107) differ from the historical 2024 audit, as expected, but match the
supplied 2025/2026 issue tables. No reconciliation adjustment for later main changes was needed.

The original other-income fixture has three affected NT cases per year: 154 (one child in each age group),
155 (two young and one older child), and 156 (one older child; annual-rounding correction only). Cases 148–153
and 157 retain all values. That fixture retains its pre-carbon context and its pre-fuel context for 2025.
Existing feature fixtures need no edits. The new 48-case fixture adds independent coverage without recapture.

## Feature coverage

`tests/golden/features/nwt-child-benefit.json` runs through the real household engine in its dedicated test runner.
It stores hand-calculated expectations, verified separately by the independent form. Each row below runs in both years.

| Feature cases | Expected provincial benefit | Rule path |
|---|---:|---|
| none | 0 | Empty family |
| young-1 through young-6 | 815; 1467; 1997; 2445; 2812; 3179 | Every young table entry and extra-child rate |
| older-1 through older-6 | 652; 1174; 1597; 1956; 2249; 2542 | Every older table entry and extra-child rate |
| mixed-below-lower / mixed-lower | 2119 | $29,999 / $30,000; full combined entitlement |
| mixed-above-lower | 2118.9576 | $30,001; reduction starts above boundary |
| mixed-midpoint | 1059.50 | $55,000; two young plus one older |
| mixed-below-upper | 0.0424 | $79,999; positive amount immediately below exhaustion |
| mixed-upper / mixed-above-upper | 0 | $80,000 / $80,001; no negative entitlement |
| mixed-reversed | 994.50 | $55,000; one young plus two older |
| mixed-fifth-young | 3464 | $2445 + $367 + $652 |
| mixed-fifth-older | 3064 | $815 + $1956 + $293 |
| mixed-fifth-both | 2530.50 | ($2812 + $2249) / 2 |

The annual reference files add mixed-age, fifth-child and boundary calculations from published values. They are
identified as independent calculations, not examples printed in CRA's booklet. A source test checks the separate
2025 and 2026 cached editions, their dates, every monthly table amount and both income boundaries.

## Validation

The minimal reproduction failed in both years before the YAML correction: actual $931.8000000000001, expected
$1,059.50. The same command passes after correction.

- `fnm exec --using=26 npm run format`: passed.
- `fnm exec --using=26 npm run check`: passed; lint, typecheck, 1,379 tests, build and Chromium smoke checks.
- Browser smoke: 43 pages, 261 states, 40 contrast scans; desktop, 430 px and 375 px, light and dark.
  All legacy comparisons passed without changing any guarded NWT smoke cells.
- `fnm exec --using=26 npm run compare -- origin/main`: six runs, five steps each. Exit 1 reports the single
  intended difference: the 2026 source list gains the CRA continuity publication and NWT annual formula source.
  Control state and all displayed scenario results match; these existing steps round away the small NWT changes.
- Structural comparison with HEAD: 290 permitted NT leaf changes in 2025, 289 in 2026 and 29 per year in the
  original other-income fixture. All unrelated fields, provinces, years, feature fixtures and inputs are unchanged.

## Outstanding rendered wording

The assigned file list excludes `src/ui/notes.ts`. Its Newfoundland branch hard-codes that the NWT reduction rate
is unpublished, regardless of the NWT program and estimate flag. The required wording correction therefore needs
an ownership extension, requested during this task. The source list and child tooltip already render the correct
year, but the footer caveat remains inaccurate until that correction is applied.

A narrow patch was prepared outside the checkout as `116-notes.patch` in the task's temporary directory. It gives
NWT its own data-driven explanation, keeps Newfoundland's estimated taper and Nunavut's rate-source qualifier,
and removes the incorrect shared caveat. Isolated rendering checks of the proposed module pass for 2019–2026,
including changed income thresholds and the estimate flag. This patch has not been applied to the repository.

## Exact before/after inventory

All 637 changed numeric cells are inventoried below, including derived taxes, rates and investment effects.
For the annual files, scenario IDs equal array indices: the path prefix is `scenarios[ID].results.NT`.
For the original other-income file, the prefix is `years.YEAR.ID.NT`. Combine the prefix with the field column.

### 2025: 44 cases, 290 numeric cells

File: `tests/golden/2025.json`.

| Scenario | Before benefit | Corrected benefit | Difference |
|---|---:|---:|---:|
| 4 | 651.9600 | 652.0000 | 0.0400 |
| 5 | 814.9200 | 815.0000 | 0.0800 |
| 6 | 2026.0072 | 2545.6302 | 519.6230 |
| 7 | 1017.6121 | 1260.2232 | 242.6111 |
| 10 | 830.6941 | 830.7224 | 0.0283 |
| 23 | 1173.9600 | 1174.0000 | 0.0400 |
| 31 | 1863.6000 | 2119.0000 | 255.4000 |
| 36 | 1807.4540 | 2097.7164 | 290.2624 |
| 39 | 0.0000 | 0.0000 | 0.0000 |
| 40 | 1513.8356 | 1846.7757 | 332.9401 |
| 46 | 814.9200 | 815.0000 | 0.0800 |
| 49 | 184.7151 | 184.7225 | 0.0074 |
| 50 | 206.0933 | 206.1135 | 0.0202 |
| 51 | 94.9545 | 94.9638 | 0.0093 |
| 57 | 1996.9200 | 1997.0000 | 0.0800 |
| 60 | 814.9200 | 815.0000 | 0.0800 |
| 61 | 333.9494 | 371.0043 | 37.0549 |
| 62 | 0.0000 | 0.0000 | 0.0000 |
| 64 | 587.4235 | 669.9321 | 82.5086 |
| 70 | 489.8981 | 544.2570 | 54.3589 |
| 77 | 1320.4800 | 1467.0000 | 146.5200 |
| 79 | 1596.9600 | 1597.0000 | 0.0400 |
| 80 | 1147.7621 | 1400.1911 | 252.4290 |
| 82 | 2541.8400 | 2542.0000 | 0.1600 |
| 91 | 814.9200 | 815.0000 | 0.0800 |
| 96 | 651.9600 | 652.0000 | 0.0400 |
| 98 | 0.0000 | 0.0000 | 0.0000 |
| 99 | 2966.5600 | 3619.0000 | 652.4400 |
| 100 | 1863.6000 | 2119.0000 | 255.4000 |
| 101 | 1144.2538 | 1144.2824 | 0.0286 |
| 103 | 690.1557 | 690.2235 | 0.0678 |
| 107 | 831.7571 | 831.7904 | 0.0333 |
| 110 | 0.0000 | 0.0000 | 0.0000 |
| 111 | 1351.2846 | 1563.5592 | 212.2746 |
| 114 | 0.0000 | 0.0000 | 0.0000 |
| 116 | 278.2633 | 339.4622 | 61.1989 |
| 119 | 1863.6000 | 2119.0000 | 255.4000 |
| 121 | 1967.1370 | 2243.4381 | 276.3011 |
| 123 | 412.3351 | 412.3454 | 0.0103 |
| 127 | 87.9925 | 87.9947 | 0.0022 |
| 128 | 435.9657 | 435.9924 | 0.0267 |
| 133 | 480.9161 | 480.9464 | 0.0303 |
| 141 | 814.9287 | 814.9491 | 0.0204 |
| 143 | 334.7691 | 334.8020 | 0.0329 |

<details>
<summary>Every changed field, with exact stored before/after values</summary>

| Scenario | Field under NT | Before | After |
|---|---|---:|---:|
| 4 | `total` | -7525.8948 | -7525.9348 |
| 4 | `provBen` | 651.96 | 652 |
| 4 | `childBen` | 7399.96 | 7400 |
| 4 | `benefits` | 11567.96 | 11568 |
| 4 | `netTotal` | -9091.01 | -9091.05 |
| 5 | `total` | -8746.0548 | -8746.1348 |
| 5 | `provBen` | 814.92 | 815 |
| 5 | `childBen` | 8811.92 | 8812 |
| 5 | `benefits` | 12979.92 | 12980 |
| 5 | `netTotal` | -10311.17 | -10311.25 |
| 6 | `total` | -41685.042 | -42204.665 |
| 6 | `provBen` | 2026.0072 | 2545.6302 |
| 6 | `childBen` | 44628.4672 | 45148.0902 |
| 6 | `benefits` | 48887.0672 | 49406.6902 |
| 6 | `netTotal` | -43250.1572 | -43769.7802 |
| 6 | `marg` | 0.7173 | 0.7318 |
| 6 | `avg` | -0.9263 | -0.9379 |
| 6 | `margBy.ord` | 0.7173 | 0.7318 |
| 6 | `margBy.cg` | 0.3206 | 0.3279 |
| 6 | `margBy.ed` | 0.5189 | 0.5391 |
| 6 | `margBy.nd` | 0.5645 | 0.5814 |
| 6 | `margBy.fd` | 0.7565 | 0.7712 |
| 7 | `total` | -23039.784 | -23282.395 |
| 7 | `provBen` | 1017.6121 | 1260.2232 |
| 7 | `childBen` | 32207.5721 | 32450.1832 |
| 7 | `benefits` | 34833.3721 | 35075.9832 |
| 7 | `netTotal` | -24604.8991 | -24847.5102 |
| 7 | `marg` | 0.6967 | 0.7084 |
| 7 | `avg` | -0.384 | -0.388 |
| 7 | `margBy.ord` | 0.6967 | 0.7084 |
| 7 | `margBy.cg` | 0.3102 | 0.3161 |
| 7 | `margBy.ed` | 0.4903 | 0.5066 |
| 7 | `margBy.nd` | 0.5407 | 0.5543 |
| 7 | `margBy.fd` | 0.6913 | 0.7031 |
| 10 | `total` | -10456.2379 | -10456.2662 |
| 10 | `provBen` | 830.6941 | 830.7224 |
| 10 | `childBen` | 13363.7391 | 13363.7674 |
| 10 | `benefits` | 17591.5891 | 17591.6174 |
| 10 | `netTotal` | -12021.3531 | -12021.3814 |
| 23 | `total` | -10436.0948 | -10436.1348 |
| 23 | `provBen` | 1173.96 | 1174 |
| 23 | `childBen` | 14669.96 | 14670 |
| 23 | `benefits` | 14669.96 | 14670 |
| 23 | `netTotal` | -12001.21 | -12001.25 |
| 31 | `total` | -24145.05 | -24400.45 |
| 31 | `provBen` | 1863.6 | 2119 |
| 31 | `childBen` | 24605.6 | 24861 |
| 31 | `benefits` | 29646.6 | 29902 |
| 31 | `netTotal` | -27745.05 | -28000.45 |
| 31 | `avg` | -1.0975 | -1.1091 |
| 36 | `total` | -31543.004 | -31833.2664 |
| 36 | `provBen` | 1807.454 | 2097.7164 |
| 36 | `childBen` | 30048.454 | 30338.7164 |
| 36 | `benefits` | 34644.554 | 34934.8164 |
| 36 | `netTotal` | -32743.004 | -33033.2664 |
| 36 | `marg` | 0.2855 | 0.2922 |
| 36 | `invTax` | 1152.196 | 1195.6836 |
| 36 | `avg` | -0.8301 | -0.8377 |
| 36 | `margBy.ord` | 0.2855 | 0.2922 |
| 36 | `margBy.cg` | 0.0958 | 0.0991 |
| 36 | `margBy.ed` | 0.2644 | 0.2736 |
| 36 | `margBy.nd` | 0.2203 | 0.228 |
| 36 | `margBy.fd` | 0.1916 | 0.1982 |
| 39 | `invTax` | 47065.9382 | 47065.9665 |
| 40 | `total` | -36723.3394 | -37056.2795 |
| 40 | `provBen` | 1513.8356 | 1846.7757 |
| 40 | `childBen` | 43088.2956 | 43421.2357 |
| 40 | `benefits` | 46177.5956 | 46510.5357 |
| 40 | `netTotal` | -37628.4546 | -37961.3947 |
| 40 | `marg` | 0.6471 | 0.66 |
| 40 | `avg` | -0.6677 | -0.6738 |
| 40 | `margBy.ord` | 0.6471 | 0.66 |
| 40 | `margBy.cg` | 0.2852 | 0.2917 |
| 40 | `margBy.ed` | 0.4211 | 0.4391 |
| 40 | `margBy.nd` | 0.483 | 0.498 |
| 40 | `margBy.fd` | 0.6561 | 0.6692 |
| 46 | `total` | -7650.17 | -7650.25 |
| 46 | `provBen` | 814.92 | 815 |
| 46 | `childBen` | 8811.92 | 8812 |
| 46 | `benefits` | 13200.42 | 13200.5 |
| 46 | `netTotal` | -11970.17 | -11970.25 |
| 49 | `total` | -11344.5382 | -11344.5456 |
| 49 | `provBen` | 184.7151 | 184.7225 |
| 49 | `childBen` | 16976.9951 | 16977.0025 |
| 49 | `benefits` | 16976.9951 | 16977.0025 |
| 49 | `netTotal` | -13744.5382 | -13744.5456 |
| 49 | `invTax` | 10341.8318 | 10341.9044 |
| 50 | `total` | 24342.601 | 24342.5807 |
| 50 | `provBen` | 206.0933 | 206.1135 |
| 50 | `childBen` | 6112.3333 | 6112.3535 |
| 50 | `benefits` | 6585.3333 | 6585.3535 |
| 50 | `netTotal` | 6577.4858 | 6577.4656 |
| 50 | `margBy.cg` | 0.1886 | 0.1887 |
| 51 | `total` | 10938.3102 | 10938.3009 |
| 51 | `provBen` | 94.9545 | 94.9638 |
| 51 | `childBen` | 5523.8645 | 5523.8738 |
| 51 | `benefits` | 5523.8645 | 5523.8738 |
| 51 | `netTotal` | 10074.3102 | 10074.3009 |
| 57 | `total` | -23711.7741 | -23711.8541 |
| 57 | `provBen` | 1996.92 | 1997 |
| 57 | `childBen` | 25987.92 | 25988 |
| 57 | `benefits` | 31028.92 | 31029 |
| 57 | `netTotal` | -29127.37 | -29127.45 |
| 60 | `total` | -6774.8048 | -6774.8848 |
| 60 | `provBen` | 814.92 | 815 |
| 60 | `childBen` | 8811.92 | 8812 |
| 60 | `benefits` | 13200.42 | 13200.5 |
| 60 | `netTotal` | -10739.92 | -10740 |
| 61 | `total` | 4770.0497 | 4732.9948 |
| 61 | `provBen` | 333.9494 | 371.0043 |
| 61 | `childBen` | 11046.7694 | 11083.8243 |
| 61 | `benefits` | 11992.7694 | 12029.8243 |
| 61 | `netTotal` | 1170.0497 | 1132.9948 |
| 61 | `marg` | 0.5173 | 0.5202 |
| 61 | `avg` | 0.0701 | 0.0696 |
| 61 | `margBy.ord` | 0.5173 | 0.5202 |
| 61 | `margBy.cg` | 0.2262 | 0.2277 |
| 61 | `margBy.ed` | 0.2584 | 0.2624 |
| 61 | `margBy.nd` | 0.3474 | 0.3508 |
| 61 | `margBy.fd` | 0.4999 | 0.5028 |
| 62 | `invTax` | 15863.7534 | 15863.7581 |
| 64 | `total` | -7693.9644 | -7776.473 |
| 64 | `provBen` | 587.4235 | 669.9321 |
| 64 | `childBen` | 24456.7835 | 24539.2921 |
| 64 | `benefits` | 24456.7835 | 24539.2921 |
| 64 | `netTotal` | -11293.9644 | -11376.473 |
| 64 | `marg` | 0.6312 | 0.6376 |
| 64 | `avg` | -0.1131 | -0.1144 |
| 64 | `margBy.ord` | 0.6312 | 0.6376 |
| 64 | `margBy.cg` | 0.2837 | 0.287 |
| 64 | `margBy.ed` | 0.4171 | 0.4261 |
| 64 | `margBy.nd` | 0.4797 | 0.4872 |
| 64 | `margBy.fd` | 0.7149 | 0.7214 |
| 70 | `total` | -1619.1451 | -1673.504 |
| 70 | `provBen` | 489.8981 | 544.257 |
| 70 | `childBen` | 11999.8931 | 12054.252 |
| 70 | `benefits` | 13656.7931 | 13711.152 |
| 70 | `netTotal` | -3184.2603 | -3238.6192 |
| 70 | `marg` | 0.5057 | 0.5086 |
| 70 | `avg` | -0.0261 | -0.027 |
| 70 | `margBy.ord` | 0.5057 | 0.5086 |
| 70 | `margBy.cg` | 0.2827 | 0.2842 |
| 70 | `margBy.ed` | 0.7803 | 0.7843 |
| 70 | `margBy.nd` | 0.6502 | 0.6536 |
| 70 | `margBy.fd` | 0.8154 | 0.8183 |
| 77 | `total` | -13305.6341 | -13452.1541 |
| 77 | `provBen` | 1320.48 | 1467 |
| 77 | `childBen` | 16065.48 | 16212 |
| 77 | `benefits` | 20669.98 | 20816.5 |
| 77 | `netTotal` | -18001.23 | -18147.75 |
| 77 | `avg` | -0.4435 | -0.4484 |
| 79 | `total` | -23713.71 | -23713.75 |
| 79 | `provBen` | 1596.96 | 1597 |
| 79 | `childBen` | 21840.96 | 21841 |
| 79 | `benefits` | 27102.46 | 27102.5 |
| 79 | `netTotal` | -24433.71 | -24433.75 |
| 80 | `total` | -42840.3569 | -43092.7859 |
| 80 | `provBen` | 1147.7621 | 1400.1911 |
| 80 | `childBen` | 41303.1221 | 41555.5511 |
| 80 | `benefits` | 44304.4221 | 44556.8511 |
| 80 | `netTotal` | -43745.4721 | -43997.9011 |
| 80 | `marg` | 0.4318 | 0.4448 |
| 80 | `invTax` | 9254.1379 | 9654.1489 |
| 80 | `avg` | -0.5869 | -0.5903 |
| 80 | `margBy.ord` | 0.4318 | 0.4448 |
| 80 | `margBy.cg` | 0.1697 | 0.1762 |
| 80 | `margBy.ed` | 0.4683 | 0.4863 |
| 80 | `margBy.nd` | 0.3902 | 0.4052 |
| 80 | `margBy.fd` | 0.4893 | 0.5024 |
| 82 | `total` | -39448.7941 | -39448.9541 |
| 82 | `provBen` | 2541.84 | 2542 |
| 82 | `childBen` | 43029.84 | 43030 |
| 82 | `benefits` | 49380.34 | 49380.5 |
| 82 | `netTotal` | -45944.39 | -45944.55 |
| 91 | `total` | -6954.17 | -6954.25 |
| 91 | `provBen` | 814.92 | 815 |
| 91 | `childBen` | 8811.92 | 8812 |
| 91 | `benefits` | 13200.42 | 13200.5 |
| 91 | `netTotal` | -11970.17 | -11970.25 |
| 96 | `total` | 425.04 | 425 |
| 96 | `provBen` | 651.96 | 652 |
| 96 | `childBen` | 7399.96 | 7400 |
| 96 | `benefits` | 8754.96 | 8755 |
| 96 | `netTotal` | -8754.96 | -8755 |
| 98 | `invTax` | 9759.1259 | 9914.5551 |
| 99 | `total` | -42901.81 | -43554.25 |
| 99 | `provBen` | 2966.56 | 3619 |
| 99 | `childBen` | 48450.56 | 49103 |
| 99 | `benefits` | 48450.56 | 49103 |
| 99 | `netTotal` | -45781.81 | -46434.25 |
| 99 | `avg` | -1.4301 | -1.4518 |
| 100 | `total` | -23666.0348 | -23921.4348 |
| 100 | `provBen` | 1863.6 | 2119 |
| 100 | `childBen` | 24605.6 | 24861 |
| 100 | `benefits` | 29867.1 | 30122.5 |
| 100 | `netTotal` | -26431.15 | -26686.55 |
| 100 | `avg` | -0.6228 | -0.6295 |
| 101 | `total` | -9377.9091 | -9377.9378 |
| 101 | `provBen` | 1144.2538 | 1144.2824 |
| 101 | `childBen` | 20117.7238 | 20117.7524 |
| 101 | `benefits` | 23128.4738 | 23128.5024 |
| 101 | `netTotal` | -15257.9091 | -15257.9378 |
| 103 | `total` | -4113.5779 | -4113.6456 |
| 103 | `provBen` | 690.1557 | 690.2235 |
| 103 | `childBen` | 8675.3957 | 8675.4635 |
| 103 | `benefits` | 11790.9957 | 11791.0635 |
| 103 | `netTotal` | -8123.7635 | -8123.8313 |
| 103 | `margBy.cg` | 0.1906 | 0.1907 |
| 107 | `total` | 6881.1935 | 6881.1601 |
| 107 | `provBen` | 831.7571 | 831.7904 |
| 107 | `childBen` | 20702.2271 | 20702.2604 |
| 107 | `benefits` | 22247.5771 | 22247.6104 |
| 107 | `netTotal` | -11014.4024 | -11014.4358 |
| 110 | `invTax` | 19920.408 | 19920.448 |
| 111 | `total` | -20246.8376 | -20459.1122 |
| 111 | `provBen` | 1351.2846 | 1563.5592 |
| 111 | `childBen` | 39178.7446 | 39391.0192 |
| 111 | `benefits` | 39178.7446 | 39391.0192 |
| 111 | `netTotal` | -23846.8376 | -24059.1122 |
| 111 | `marg` | 0.5913 | 0.5995 |
| 111 | `avg` | -0.3681 | -0.372 |
| 111 | `margBy.ord` | 0.5913 | 0.5995 |
| 111 | `margBy.cg` | 0.257 | 0.2611 |
| 111 | `margBy.ed` | 0.3433 | 0.3548 |
| 111 | `margBy.nd` | 0.4182 | 0.4278 |
| 111 | `margBy.fd` | 0.514 | 0.5223 |
| 114 | `invTax` | 18352.4704 | 18523.2563 |
| 116 | `total` | -22556.7669 | -22617.9658 |
| 116 | `provBen` | 278.2633 | 339.4622 |
| 116 | `childBen` | 37062.9733 | 37124.1722 |
| 116 | `benefits` | 39331.5233 | 39392.7222 |
| 116 | `netTotal` | -25256.7669 | -25317.9658 |
| 116 | `marg` | 0.6204 | 0.6333 |
| 116 | `avg` | -0.2968 | -0.2976 |
| 116 | `margBy.ord` | 0.6204 | 0.6333 |
| 116 | `margBy.cg` | 0.2717 | 0.2782 |
| 116 | `margBy.ed` | 0.3838 | 0.4018 |
| 116 | `margBy.nd` | 0.452 | 0.467 |
| 116 | `margBy.fd` | 0.6974 | 0.7105 |
| 119 | `total` | -25998.35 | -26253.75 |
| 119 | `provBen` | 1863.6 | 2119 |
| 119 | `childBen` | 24605.6 | 24861 |
| 119 | `benefits` | 29867.1 | 30122.5 |
| 119 | `netTotal` | -27198.35 | -27453.75 |
| 119 | `avg` | -0.8666 | -0.8751 |
| 121 | `total` | -29825.3647 | -30101.6658 |
| 121 | `provBen` | 1967.137 | 2243.4381 |
| 121 | `childBen` | 32667.497 | 32943.7981 |
| 121 | `benefits` | 37092.597 | 37368.8981 |
| 121 | `netTotal` | -33425.3647 | -33701.6658 |
| 121 | `marg` | 0.6521 | 0.6585 |
| 121 | `avg` | -0.7849 | -0.7921 |
| 121 | `margBy.ord` | 0.6521 | 0.6585 |
| 121 | `margBy.cg` | 0.2857 | 0.289 |
| 121 | `margBy.ed` | 0.5813 | 0.5903 |
| 121 | `margBy.nd` | 0.5533 | 0.5608 |
| 121 | `margBy.fd` | 0.7149 | 0.7215 |
| 123 | `total` | 17860.3127 | 17860.3023 |
| 123 | `provBen` | 412.3351 | 412.3454 |
| 123 | `childBen` | 15031.7651 | 15031.7754 |
| 123 | `benefits` | 15031.7651 | 15031.7754 |
| 123 | `netTotal` | -849.873 | -849.8833 |
| 127 | `total` | 3904.3643 | 3904.3621 |
| 127 | `provBen` | 87.9925 | 87.9947 |
| 127 | `childBen` | 12777.9725 | 12777.9747 |
| 127 | `benefits` | 13755.9725 | 13755.9747 |
| 127 | `netTotal` | 1128.7684 | 1128.7662 |
| 127 | `invTax` | 12188.7361 | 12188.7543 |
| 128 | `total` | 6040.0228 | 6039.996 |
| 128 | `provBen` | 435.9657 | 435.9924 |
| 128 | `childBen` | 6548.5057 | 6548.5324 |
| 128 | `benefits` | 8495.9057 | 8495.9324 |
| 128 | `netTotal` | -2290.1629 | -2290.1896 |
| 133 | `total` | -23448.6972 | -23448.7274 |
| 133 | `provBen` | 480.9161 | 480.9464 |
| 133 | `childBen` | 33366.7261 | 33366.7564 |
| 133 | `benefits` | 35873.7761 | 35873.8064 |
| 133 | `netTotal` | -24818.8828 | -24818.9131 |
| 133 | `invTax` | 18370.7381 | 18370.8373 |
| 141 | `total` | -679.9677 | -679.9881 |
| 141 | `provBen` | 814.9287 | 814.9491 |
| 141 | `childBen` | 17829.3087 | 17829.3291 |
| 141 | `benefits` | 19609.1087 | 19609.1291 |
| 141 | `netTotal` | -11059.9677 | -11059.9881 |
| 143 | `total` | 225.978 | 225.9452 |
| 143 | `provBen` | 334.7691 | 334.802 |
| 143 | `childBen` | 6793.6591 | 6793.692 |
| 143 | `benefits` | 8412.0591 | 8412.092 |
| 143 | `netTotal` | -1144.2076 | -1144.2405 |
| 143 | `invTax` | 8896.7051 | 8896.7495 |

</details>


### 2026: 44 cases, 289 numeric cells

File: `tests/golden/2026.json`.

| Scenario | Before benefit | Corrected benefit | Difference |
|---|---:|---:|---:|
| 4 | 651.9600 | 652.0000 | 0.0400 |
| 5 | 814.9200 | 815.0000 | 0.0800 |
| 6 | 2026.0072 | 2545.6302 | 519.6230 |
| 7 | 1017.6121 | 1260.2232 | 242.6111 |
| 10 | 830.6941 | 830.7224 | 0.0283 |
| 23 | 1173.9600 | 1174.0000 | 0.0400 |
| 31 | 1863.6000 | 2119.0000 | 255.4000 |
| 36 | 1807.4540 | 2097.7164 | 290.2624 |
| 39 | 0.0000 | 0.0000 | 0.0000 |
| 40 | 1513.8356 | 1846.7757 | 332.9401 |
| 46 | 814.9200 | 815.0000 | 0.0800 |
| 49 | 184.7151 | 184.7225 | 0.0074 |
| 50 | 206.0933 | 206.1135 | 0.0202 |
| 51 | 93.3409 | 93.3501 | 0.0092 |
| 57 | 1996.9200 | 1997.0000 | 0.0800 |
| 60 | 814.9200 | 815.0000 | 0.0800 |
| 61 | 333.9494 | 371.0043 | 37.0549 |
| 62 | 0.0000 | 0.0000 | 0.0000 |
| 64 | 587.4235 | 669.9321 | 82.5086 |
| 70 | 489.8981 | 544.2570 | 54.3589 |
| 77 | 1320.4800 | 1467.0000 | 146.5200 |
| 79 | 1596.9600 | 1597.0000 | 0.0400 |
| 80 | 1147.7621 | 1400.1911 | 252.4290 |
| 82 | 2541.8400 | 2542.0000 | 0.1600 |
| 91 | 814.9200 | 815.0000 | 0.0800 |
| 96 | 651.9600 | 652.0000 | 0.0400 |
| 98 | 0.0000 | 0.0000 | 0.0000 |
| 99 | 2966.5600 | 3619.0000 | 652.4400 |
| 100 | 1863.6000 | 2119.0000 | 255.4000 |
| 101 | 1141.0918 | 1141.1204 | 0.0286 |
| 103 | 690.1557 | 690.2235 | 0.0678 |
| 107 | 827.8032 | 827.8364 | 0.0332 |
| 110 | 0.0000 | 0.0000 | 0.0000 |
| 111 | 1351.2846 | 1563.5592 | 212.2746 |
| 114 | 0.0000 | 0.0000 | 0.0000 |
| 116 | 278.2633 | 339.4622 | 61.1989 |
| 119 | 1863.6000 | 2119.0000 | 255.4000 |
| 121 | 1967.1370 | 2243.4381 | 276.3011 |
| 123 | 412.3351 | 412.3454 | 0.0103 |
| 127 | 87.9925 | 87.9947 | 0.0022 |
| 128 | 435.9657 | 435.9924 | 0.0267 |
| 133 | 480.9161 | 480.9464 | 0.0303 |
| 141 | 814.9287 | 814.9491 | 0.0204 |
| 143 | 334.7691 | 334.8020 | 0.0329 |

<details>
<summary>Every changed field, with exact stored before/after values</summary>

| Scenario | Field under NT | Before | After |
|---|---|---:|---:|
| 4 | `total` | -7654.2637 | -7654.3037 |
| 4 | `provBen` | 651.96 | 652 |
| 4 | `childBen` | 7534.96 | 7535 |
| 4 | `benefits` | 11527.96 | 11528 |
| 4 | `netTotal` | -9053.81 | -9053.85 |
| 5 | `total` | -8899.6237 | -8899.7037 |
| 5 | `provBen` | 814.92 | 815 |
| 5 | `childBen` | 8971.92 | 8972 |
| 5 | `benefits` | 12964.92 | 12965 |
| 5 | `netTotal` | -10299.17 | -10299.25 |
| 6 | `total` | -41992.9821 | -42512.6052 |
| 6 | `provBen` | 2026.0072 | 2545.6302 |
| 6 | `childBen` | 45685.9672 | 46205.5902 |
| 6 | `benefits` | 48848.8672 | 49368.4902 |
| 6 | `netTotal` | -43392.5284 | -43912.1514 |
| 6 | `marg` | 0.7126 | 0.7271 |
| 6 | `avg` | -0.9332 | -0.9447 |
| 6 | `margBy.ord` | 0.7126 | 0.7271 |
| 6 | `margBy.cg` | 0.3181 | 0.3254 |
| 6 | `margBy.ed` | 0.512 | 0.5322 |
| 6 | `margBy.nd` | 0.5588 | 0.5757 |
| 6 | `margBy.fd` | 0.7555 | 0.7701 |
| 7 | `total` | -23230.3561 | -23472.9672 |
| 7 | `provBen` | 1017.6121 | 1260.2232 |
| 7 | `childBen` | 33105.0721 | 33347.6832 |
| 7 | `benefits` | 34514.9221 | 34757.5332 |
| 7 | `netTotal` | -24629.9024 | -24872.5134 |
| 7 | `marg` | 0.697 | 0.7087 |
| 7 | `avg` | -0.3872 | -0.3912 |
| 7 | `margBy.ord` | 0.697 | 0.7087 |
| 7 | `margBy.cg` | 0.3102 | 0.3161 |
| 7 | `margBy.ed` | 0.4903 | 0.5066 |
| 7 | `margBy.nd` | 0.5407 | 0.5543 |
| 7 | `margBy.fd` | 0.697 | 0.7088 |
| 10 | `total` | -10671.0971 | -10671.1254 |
| 10 | `provBen` | 830.6941 | 830.7224 |
| 10 | `childBen` | 13734.9891 | 13735.0174 |
| 10 | `benefits` | 17456.6391 | 17456.6674 |
| 10 | `netTotal` | -12070.6433 | -12070.6717 |
| 23 | `total` | -10874.6637 | -10874.7037 |
| 23 | `provBen` | 1173.96 | 1174 |
| 23 | `childBen` | 14939.96 | 14940 |
| 23 | `benefits` | 14939.96 | 14940 |
| 23 | `netTotal` | -12274.21 | -12274.25 |
| 31 | `total` | -24022.25 | -24277.65 |
| 31 | `provBen` | 1863.6 | 2119 |
| 31 | `childBen` | 25060.6 | 25316 |
| 31 | `benefits` | 29521.6 | 29777 |
| 31 | `netTotal` | -27622.25 | -27877.65 |
| 31 | `avg` | -1.0919 | -1.1035 |
| 36 | `total` | -31419.504 | -31709.7664 |
| 36 | `provBen` | 1807.454 | 2097.7164 |
| 36 | `childBen` | 30613.454 | 30903.7164 |
| 36 | `benefits` | 34518.854 | 34809.1164 |
| 36 | `netTotal` | -32619.504 | -32909.7664 |
| 36 | `marg` | 0.2854 | 0.2921 |
| 36 | `invTax` | 1060.396 | 1103.8836 |
| 36 | `avg` | -0.8268 | -0.8345 |
| 36 | `margBy.ord` | 0.2854 | 0.2921 |
| 36 | `margBy.cg` | 0.0958 | 0.0991 |
| 36 | `margBy.ed` | 0.2644 | 0.2736 |
| 36 | `margBy.nd` | 0.2203 | 0.228 |
| 36 | `margBy.fd` | 0.1916 | 0.1982 |
| 39 | `invTax` | 47066.551 | 47066.5793 |
| 40 | `total` | -37029.0885 | -37362.0287 |
| 40 | `provBen` | 1513.8356 | 1846.7757 |
| 40 | `childBen` | 44170.7956 | 44503.7357 |
| 40 | `benefits` | 46062.1456 | 46395.0857 |
| 40 | `netTotal` | -37768.6348 | -38101.5749 |
| 40 | `marg` | 0.6424 | 0.6553 |
| 40 | `avg` | -0.6733 | -0.6793 |
| 40 | `margBy.ord` | 0.6424 | 0.6553 |
| 40 | `margBy.cg` | 0.2827 | 0.2892 |
| 40 | `margBy.ed` | 0.4142 | 0.4322 |
| 40 | `margBy.nd` | 0.4773 | 0.4923 |
| 40 | `margBy.fd` | 0.6557 | 0.6687 |
| 46 | `total` | -7416.17 | -7416.25 |
| 46 | `provBen` | 814.92 | 815 |
| 46 | `childBen` | 8971.92 | 8972 |
| 46 | `benefits` | 12964.92 | 12965 |
| 46 | `netTotal` | -11736.17 | -11736.25 |
| 49 | `total` | -12250.0375 | -12250.0449 |
| 49 | `provBen` | 184.7151 | 184.7225 |
| 49 | `childBen` | 17599.4951 | 17599.5025 |
| 49 | `benefits` | 17599.4951 | 17599.5025 |
| 49 | `netTotal` | -14650.0375 | -14650.0449 |
| 49 | `invTax` | 9918.5325 | 9918.6051 |
| 50 | `total` | 24048.2492 | 24048.2289 |
| 50 | `provBen` | 206.0933 | 206.1135 |
| 50 | `childBen` | 6324.8333 | 6324.8535 |
| 50 | `benefits` | 6402.6833 | 6402.7035 |
| 50 | `netTotal` | 6448.7029 | 6448.6826 |
| 51 | `total` | 10496.1406 | 10496.1314 |
| 51 | `provBen` | 93.3409 | 93.3501 |
| 51 | `childBen` | 5727.8209 | 5727.8301 |
| 51 | `benefits` | 5727.8209 | 5727.8301 |
| 51 | `netTotal` | 9632.1406 | 9632.1314 |
| 57 | `total` | -24110.7943 | -24110.8743 |
| 57 | `provBen` | 1996.92 | 1997 |
| 57 | `childBen` | 26467.92 | 26468 |
| 57 | `benefits` | 30928.92 | 30929 |
| 57 | `netTotal` | -29029.57 | -29029.65 |
| 60 | `total` | -6707.8737 | -6707.9537 |
| 60 | `provBen` | 814.92 | 815 |
| 60 | `childBen` | 8971.92 | 8972 |
| 60 | `benefits` | 12964.92 | 12965 |
| 60 | `netTotal` | -10507.42 | -10507.5 |
| 61 | `total` | 4696.5168 | 4659.4618 |
| 61 | `provBen` | 333.9494 | 371.0043 |
| 61 | `childBen` | 11443.0194 | 11480.0743 |
| 61 | `benefits` | 11754.8694 | 11791.9243 |
| 61 | `netTotal` | 1096.5168 | 1059.4618 |
| 61 | `marg` | 0.5801 | 0.583 |
| 61 | `avg` | 0.0691 | 0.0685 |
| 61 | `margBy.ord` | 0.5801 | 0.583 |
| 61 | `margBy.cg` | 0.2512 | 0.2527 |
| 61 | `margBy.ed` | 0.3274 | 0.3314 |
| 61 | `margBy.nd` | 0.4049 | 0.4083 |
| 61 | `margBy.fd` | 0.5549 | 0.5579 |
| 62 | `invTax` | 15729.1405 | 15729.1451 |
| 64 | `total` | -8792.8973 | -8875.4059 |
| 64 | `provBen` | 587.4235 | 669.9321 |
| 64 | `childBen` | 25244.2835 | 25326.7921 |
| 64 | `benefits` | 25244.2835 | 25326.7921 |
| 64 | `netTotal` | -12392.8973 | -12475.4059 |
| 64 | `marg` | 0.6445 | 0.6509 |
| 64 | `avg` | -0.1293 | -0.1305 |
| 64 | `margBy.ord` | 0.6445 | 0.6509 |
| 64 | `margBy.cg` | 0.2837 | 0.287 |
| 64 | `margBy.ed` | 0.4171 | 0.4261 |
| 64 | `margBy.nd` | 0.4797 | 0.4872 |
| 64 | `margBy.fd` | 0.72 | 0.7265 |
| 70 | `total` | -1986.2115 | -2040.5704 |
| 70 | `provBen` | 489.8981 | 544.257 |
| 70 | `childBen` | 12396.1431 | 12450.502 |
| 70 | `benefits` | 13592.3931 | 13646.752 |
| 70 | `netTotal` | -3385.7577 | -3440.1166 |
| 70 | `marg` | 0.5006 | 0.5035 |
| 70 | `avg` | -0.032 | -0.0329 |
| 70 | `margBy.ord` | 0.5006 | 0.5035 |
| 70 | `margBy.cg` | 0.2802 | 0.2817 |
| 70 | `margBy.ed` | 0.7734 | 0.7774 |
| 70 | `margBy.nd` | 0.6445 | 0.6478 |
| 70 | `margBy.fd` | 0.8104 | 0.8133 |
| 77 | `total` | -13722.9543 | -13869.4743 |
| 77 | `provBen` | 1320.48 | 1467 |
| 77 | `childBen` | 16360.48 | 16507 |
| 77 | `benefits` | 20587.48 | 20734 |
| 77 | `netTotal` | -17921.73 | -18068.25 |
| 77 | `avg` | -0.4574 | -0.4623 |
| 79 | `total` | -23321.21 | -23321.25 |
| 79 | `provBen` | 1596.96 | 1597 |
| 79 | `childBen` | 22245.96 | 22246 |
| 79 | `benefits` | 26706.96 | 26707 |
| 79 | `netTotal` | -24041.21 | -24041.25 |
| 80 | `total` | -42670.7758 | -42923.2048 |
| 80 | `provBen` | 1147.7621 | 1400.1911 |
| 80 | `childBen` | 42385.6221 | 42638.0511 |
| 80 | `benefits` | 43968.4721 | 44220.9011 |
| 80 | `netTotal` | -43410.3221 | -43662.7511 |
| 80 | `marg` | 0.4317 | 0.4447 |
| 80 | `invTax` | 9036.0879 | 9436.0989 |
| 80 | `avg` | -0.5845 | -0.588 |
| 80 | `margBy.ord` | 0.4317 | 0.4447 |
| 80 | `margBy.cg` | 0.1697 | 0.1762 |
| 80 | `margBy.ed` | 0.4683 | 0.4863 |
| 80 | `margBy.nd` | 0.3902 | 0.4052 |
| 80 | `margBy.fd` | 0.4893 | 0.5024 |
| 82 | `total` | -39571.9143 | -39572.0743 |
| 82 | `provBen` | 2541.84 | 2542 |
| 82 | `childBen` | 43839.84 | 43840 |
| 82 | `benefits` | 49002.84 | 49003 |
| 82 | `netTotal` | -45570.69 | -45570.85 |
| 91 | `total` | -6720.17 | -6720.25 |
| 91 | `provBen` | 814.92 | 815 |
| 91 | `childBen` | 8971.92 | 8972 |
| 91 | `benefits` | 12964.92 | 12965 |
| 91 | `netTotal` | -11736.17 | -11736.25 |
| 96 | `total` | 521.04 | 521 |
| 96 | `provBen` | 651.96 | 652 |
| 96 | `childBen` | 7534.96 | 7535 |
| 96 | `benefits` | 8658.96 | 8659 |
| 96 | `netTotal` | -8658.96 | -8659 |
| 98 | `invTax` | 10284.2551 | 10439.6843 |
| 99 | `total` | -43814.81 | -44467.25 |
| 99 | `provBen` | 2966.56 | 3619 |
| 99 | `childBen` | 49360.56 | 50013 |
| 99 | `benefits` | 49360.56 | 50013 |
| 99 | `netTotal` | -46694.81 | -47347.25 |
| 99 | `avg` | -1.4605 | -1.4822 |
| 100 | `total` | -23489.9037 | -23745.3037 |
| 100 | `provBen` | 1863.6 | 2119 |
| 100 | `childBen` | 25060.6 | 25316 |
| 100 | `benefits` | 29521.6 | 29777 |
| 100 | `netTotal` | -26089.45 | -26344.85 |
| 100 | `avg` | -0.6182 | -0.6249 |
| 101 | `total` | -9479.0303 | -9479.0589 |
| 101 | `provBen` | 1141.0918 | 1141.1204 |
| 101 | `childBen` | 20643.2518 | 20643.2804 |
| 101 | `benefits` | 23150.9518 | 23150.9804 |
| 101 | `netTotal` | -15359.0303 | -15359.0589 |
| 103 | `total` | -4357.987 | -4358.0548 |
| 103 | `provBen` | 690.1557 | 690.2235 |
| 103 | `childBen` | 8847.1557 | 8847.2235 |
| 103 | `benefits` | 11879.5557 | 11879.6235 |
| 103 | `netTotal` | -8318.2067 | -8318.2745 |
| 103 | `margBy.cg` | 0.1531 | 0.1532 |
| 107 | `total` | 6141.824 | 6141.7908 |
| 107 | `provBen` | 827.8032 | 827.8364 |
| 107 | `childBen` | 21301.9632 | 21301.9964 |
| 107 | `benefits` | 22251.9132 | 22251.9464 |
| 107 | `netTotal` | -11256.9517 | -11256.9849 |
| 110 | `invTax` | 19767.0564 | 19767.0964 |
| 111 | `total` | -21538.8099 | -21751.0845 |
| 111 | `provBen` | 1351.2846 | 1563.5592 |
| 111 | `childBen` | 40186.2446 | 40398.5192 |
| 111 | `benefits` | 40186.2446 | 40398.5192 |
| 111 | `netTotal` | -25138.8099 | -25351.0845 |
| 111 | `marg` | 0.5866 | 0.5948 |
| 111 | `avg` | -0.3916 | -0.3955 |
| 111 | `margBy.ord` | 0.5866 | 0.5948 |
| 111 | `margBy.cg` | 0.2545 | 0.2586 |
| 111 | `margBy.ed` | 0.3364 | 0.3479 |
| 111 | `margBy.nd` | 0.4125 | 0.422 |
| 111 | `margBy.fd` | 0.509 | 0.5173 |
| 114 | `invTax` | 18384.5769 | 18555.3629 |
| 116 | `total` | -22544.993 | -22606.1919 |
| 116 | `provBen` | 278.2633 | 339.4622 |
| 116 | `childBen` | 38145.4733 | 38206.6722 |
| 116 | `benefits` | 38995.5733 | 39056.7722 |
| 116 | `netTotal` | -25244.993 | -25306.1919 |
| 116 | `marg` | 0.6157 | 0.6286 |
| 116 | `avg` | -0.2966 | -0.2974 |
| 116 | `margBy.ord` | 0.6157 | 0.6286 |
| 116 | `margBy.cg` | 0.2692 | 0.2757 |
| 116 | `margBy.ed` | 0.3769 | 0.3949 |
| 116 | `margBy.nd` | 0.4462 | 0.4612 |
| 116 | `margBy.fd` | 0.6966 | 0.7097 |
| 119 | `total` | -25655.85 | -25911.25 |
| 119 | `provBen` | 1863.6 | 2119 |
| 119 | `childBen` | 25060.6 | 25316 |
| 119 | `benefits` | 29521.6 | 29777 |
| 119 | `netTotal` | -26855.85 | -27111.25 |
| 119 | `avg` | -0.8552 | -0.8637 |
| 121 | `total` | -29894.188 | -30170.4891 |
| 121 | `provBen` | 1967.137 | 2243.4381 |
| 121 | `childBen` | 33321.137 | 33597.4381 |
| 121 | `benefits` | 37055.537 | 37331.8381 |
| 121 | `netTotal` | -33494.188 | -33770.4891 |
| 121 | `marg` | 0.4197 | 0.4261 |
| 121 | `avg` | -0.7867 | -0.794 |
| 121 | `margBy.ord` | 0.4197 | 0.4261 |
| 121 | `margBy.cg` | 0.1682 | 0.1715 |
| 121 | `margBy.ed` | 0.257 | 0.266 |
| 121 | `margBy.nd` | 0.2831 | 0.2906 |
| 121 | `margBy.fd` | 0.4827 | 0.4892 |
| 123 | `total` | 17015.2826 | 17015.2722 |
| 123 | `provBen` | 412.3351 | 412.3454 |
| 123 | `childBen` | 15579.2651 | 15579.2754 |
| 123 | `benefits` | 15579.2651 | 15579.2754 |
| 123 | `netTotal` | -1644.9372 | -1644.9475 |
| 127 | `total` | 3529.8184 | 3529.8162 |
| 127 | `provBen` | 87.9925 | 87.9947 |
| 127 | `childBen` | 13325.4725 | 13325.4747 |
| 127 | `benefits` | 13376.8225 | 13376.8247 |
| 127 | `netTotal` | 1251.0427 | 1251.0405 |
| 127 | `invTax` | 12523.6906 | 12523.7088 |
| 128 | `total` | 5870.7344 | 5870.7077 |
| 128 | `provBen` | 435.9657 | 435.9924 |
| 128 | `childBen` | 6736.0057 | 6736.0324 |
| 128 | `benefits` | 8425.2557 | 8425.2824 |
| 128 | `netTotal` | -2409.4853 | -2409.5121 |
| 133 | `total` | -23401.4135 | -23401.4438 |
| 133 | `provBen` | 480.9161 | 480.9464 |
| 133 | `childBen` | 34349.2261 | 34349.2564 |
| 133 | `benefits` | 35437.8261 | 35437.8564 |
| 133 | `netTotal` | -24721.6333 | -24721.6635 |
| 133 | `invTax` | 18289.8351 | 18289.9343 |
| 141 | `total` | -892.6479 | -892.6683 |
| 141 | `provBen` | 814.9287 | 814.9491 |
| 141 | `childBen` | 18376.8087 | 18376.8291 |
| 141 | `benefits` | 19566.1587 | 19566.1791 |
| 141 | `netTotal` | -11272.6479 | -11272.6684 |
| 143 | `total` | 5.6839 | 5.651 |
| 143 | `provBen` | 334.7691 | 334.802 |
| 143 | `childBen` | 7006.1591 | 7006.192 |
| 143 | `benefits` | 8366.4091 | 8366.442 |
| 143 | `netTotal` | -1314.5359 | -1314.5687 |
| 143 | `invTax` | 8494.5769 | 8494.6213 |

</details>


### other-2025: 3 cases, 29 numeric cells

File: `tests/golden/other-income-original.json`.

| Scenario | Before benefit | Corrected benefit | Difference |
|---|---:|---:|---:|
| 154 | 876.4026 | 973.6479 | 97.2453 |
| 155 | 745.4400 | 847.6000 | 102.1600 |
| 156 | 200.5429 | 200.5552 | 0.0123 |

<details>
<summary>Every changed field, with exact stored before/after values</summary>

| Scenario | Field under NT | Before | After |
|---|---|---:|---:|
| 154 | `total` | -10354.6898 | -10451.9351 |
| 154 | `provBen` | 876.4026 | 973.6479 |
| 154 | `childBen` | 14362.1226 | 14459.3679 |
| 154 | `benefits` | 15750.0226 | 15847.2679 |
| 154 | `netTotal` | -11554.6898 | -11651.9351 |
| 154 | `marg` | 0.6422 | 0.6451 |
| 154 | `avg` | -0.2203 | -0.2224 |
| 154 | `margBy.ord` | 0.6422 | 0.6451 |
| 154 | `margBy.cg` | 0.2827 | 0.2842 |
| 154 | `margBy.ed` | 0.4143 | 0.4183 |
| 154 | `margBy.nd` | 0.4774 | 0.4807 |
| 154 | `margBy.fd` | 0.6661 | 0.669 |
| 155 | `total` | -12704.314 | -12806.474 |
| 155 | `provBen` | 745.44 | 847.6 |
| 155 | `childBen` | 19209.97 | 19312.13 |
| 155 | `benefits` | 19736.02 | 19838.18 |
| 155 | `netTotal` | -13904.314 | -14006.474 |
| 155 | `marg` | 0.4563 | 0.4614 |
| 155 | `avg` | -0.2117 | -0.2134 |
| 155 | `margBy.ord` | 0.4563 | 0.4614 |
| 155 | `margBy.cg` | 0.2841 | 0.2867 |
| 155 | `margBy.ed` | 0.4182 | 0.4253 |
| 155 | `margBy.nd` | 0.4807 | 0.4865 |
| 155 | `margBy.fd` | 0.6208 | 0.6259 |
| 156 | `total` | 5868.2211 | 5868.2088 |
| 156 | `provBen` | 200.5429 | 200.5552 |
| 156 | `childBen` | 5049.2329 | 5049.2452 |
| 156 | `benefits` | 5049.2329 | 5049.2452 |
| 156 | `netTotal` | 4668.2211 | 4668.2088 |

</details>


### other-2026: 3 cases, 29 numeric cells

File: `tests/golden/other-income-original.json`.

| Scenario | Before benefit | Corrected benefit | Difference |
|---|---:|---:|---:|
| 154 | 876.4026 | 973.6479 | 97.2453 |
| 155 | 745.4400 | 847.6000 | 102.1600 |
| 156 | 200.5429 | 200.5552 | 0.0123 |

<details>
<summary>Every changed field, with exact stored before/after values</summary>

| Scenario | Field under NT | Before | After |
|---|---|---:|---:|
| 154 | `total` | -11234.201 | -11331.4463 |
| 154 | `provBen` | 876.4026 | 973.6479 |
| 154 | `childBen` | 14758.3726 | 14855.6179 |
| 154 | `benefits` | 16631.6226 | 16728.8679 |
| 154 | `netTotal` | -12633.7472 | -12730.9925 |
| 154 | `marg` | 0.6375 | 0.6404 |
| 154 | `avg` | -0.239 | -0.2411 |
| 154 | `margBy.ord` | 0.6375 | 0.6404 |
| 154 | `margBy.cg` | 0.2802 | 0.2817 |
| 154 | `margBy.ed` | 0.4074 | 0.4114 |
| 154 | `margBy.nd` | 0.4716 | 0.475 |
| 154 | `margBy.fd` | 0.6653 | 0.6682 |
| 155 | `total` | -13850.5237 | -13952.6837 |
| 155 | `provBen` | 745.44 | 847.6 |
| 155 | `childBen` | 19807.47 | 19909.63 |
| 155 | `benefits` | 20721.07 | 20823.23 |
| 155 | `netTotal` | -15250.07 | -15352.23 |
| 155 | `marg` | 0.4613 | 0.4664 |
| 155 | `avg` | -0.2308 | -0.2325 |
| 155 | `margBy.ord` | 0.4613 | 0.4664 |
| 155 | `margBy.cg` | 0.2841 | 0.2867 |
| 155 | `margBy.ed` | 0.4182 | 0.4253 |
| 155 | `margBy.nd` | 0.4807 | 0.4865 |
| 155 | `margBy.fd` | 0.6268 | 0.6319 |
| 156 | `total` | 5266.0301 | 5266.0178 |
| 156 | `provBen` | 200.5429 | 200.5552 |
| 156 | `childBen` | 5236.7329 | 5236.7452 |
| 156 | `benefits` | 5564.9829 | 5564.9952 |
| 156 | `netTotal` | 3866.4839 | 3866.4716 |

</details>

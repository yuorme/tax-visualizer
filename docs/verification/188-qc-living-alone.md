# Quebec living-alone income base (#188)

Schedule B's living-alone reduction must use Quebec net income after the worker deduction. The old household
calculation used net income before that deduction, understating the credit for eligible workers in the taper.
The fix covers 2019–2026, with the explicit 2026 source limitation below. No year checks or new inputs are added.
The existing eligibility assumptions, federal benefits and other Quebec programs remain unchanged.

## Year-by-year evidence

Each linked Schedule B was read separately. For **every verified year, 2019–2025**, Part A lines 10 and 12 take
the two returns' line 275 amounts and add them on line 14. Part B carries that total to line 15, subtracts the
year's threshold at line 16, floors at zero at line 18, and applies 18.75% at line 31. Line 20 supplies the
living-alone maximum. The current one-adult eligibility path has no spouse's income to add.

| Year | Cached Schedule B | Maximum | Threshold | Worker cap | Credit rate |
| --- | --- | ---: | ---: | ---: | ---: |
| 2019 | [2019 form][b19] | 1,750 | 34,610 | 1,170 | 15% |
| 2020 | [2020 form][b20] | 1,780 | 35,205 | 1,190 | 15% |
| 2021 | [2021 form][b21] | 1,802 | 35,650 | 1,205 | 15% |
| 2022 | [2022 form][b22] | 1,850 | 36,590 | 1,235 | 15% |
| 2023 | [2023 form][b23] | 1,969 | 38,945 | 1,315 | 14% |
| 2024 | [2024 form][b24] | 2,069 | 40,925 | 1,380 | 14% |
| 2025 | [2025 form][b25] | 2,128 | 42,090 | 1,420 | 14% |
| 2026 | **Not available; provisional** | 2,172 | 42,955 | 1,450 | 14% |

The 2019–2024 TP-1 returns are cached in each year's `sources/provincial-quebec-return.txt`; the 2025 return is
[cached here][return25]. Each includes the worker deduction on line 201 in total deductions on line 254,
before line 275. Worker caps and tax rates are also in each year's `provincial-quebec-parameters.txt`;
the 2019 cache's 2020 parameter publication has a separately labelled 2019 column. The 6% worker formula is
documented in the year-specific TP-1 guides used in [the prior income-base audit][prior].

**2026 limitation:** the official current filing catalogue still identifies 2025; the candidate 2026 Schedule B
PDF returns HTTP 410. Direct catalogue caching returned HTTP 403; the official indexed catalogue and response
statuses are recorded in [the availability note][availability]. No 2026 Schedule B was obtained, so the request
to confirm that year from its own form cannot yet be fulfilled. The 2026 `livingAlone.estimated` field marks
the provisional continuation of the verified 2025 income rule. It is not represented as a verified 2026 form.
The [published 2026 parameter table][params26] supplies its maximum, threshold and worker cap; they are unchanged.

## Calculation and independent feature goldens

For the income and deductions currently supported by this engine:

```text
worker deduction = min(year's cap, max(0, employment) × 6%)
line 275 = max(0, income with dividend gross-ups and taxable gains
                  - RRSP - FHSA - other deductions - enhanced QPP - worker deduction)
Schedule B amount = max(0, maximum - 18.75% × max(0, line 275 - threshold))
full credit = Schedule B amount × first provincial tax rate
applied credit = min(full credit, tax remaining after the basic personal credit)
```

Federal childcare deductions do not enter line 275. The shared `workerDeductionOf` helper keeps the personal
tax and living-alone calculations aligned without changing the older bases used by other claim elections.
Future deductions below Quebec net income must not silently be added to this Schedule B base.

The 77 static cases in `tests/golden/features/qc-living-alone.json` were calculated with decimal arithmetic
from the table above, without importing engine code or YAML. `tests/qc-living-alone.test.ts` runs them through
the real household path and checks line 275, the claim amount, full credit and applied credit to four decimals.
All fixture employment incomes are below YMPE. First additional QPP is `(employment - 3500) × rate`, floored
at zero, with rates 0.15%, 0.3%, 0.5%, 0.75%, 1%, 1%, 1%, 1% for 2019–2026 respectively; see the cached
yearly payroll publications and [QPP deduction audit][qpp]. Gains use 50%; dividend multipliers are 1.38/1.15.

| Changed rule or material boundary | New golden case suffix (year prefix) |
| --- | --- |
| Deduct capped worker amount in each year's taper | `capped-worker`, 2019–2026 |
| Deduct actual 6%, not the cap unconditionally | `uncapped-worker`, 2019–2026 |
| Threshold: $1 below, exactly at, $1 above | `taper-start-below`, `taper-start-at`, `taper-start-above`, 2019–2026 |
| Exhaustion: $1 below, exactly at, $1 above | `taper-end-below`, `taper-end-at`, `taper-end-above`, 2019–2026 |
| Worker cap boundary | `worker-cap-below`, `worker-cap-at`, `worker-cap-above`, 2025 |
| No worker deduction on other income | `no-employment`, 2025–2026 |
| Gross-ups, gains, RRSP, FHSA and other deductions | `mixed-income-deductions`, 2025–2026 |
| Single parent; federal childcare excluded | `single-parent-childcare`, 2025–2026 |
| Non-refundable tax limit and zero net-income floor | `nonrefundable-capacity`, `zero-income-floor`, 2025–2026 |

Example: 2025 employment of 48,000 gives enhanced QPP of 445 and worker deduction of 1,420. Line 275 is
46,135; Schedule B gives `2128 - (46135 - 42090) × 0.1875 = 1369.5625`, credit **191.73875**.
Before the fix, the claim base was **1103.3125**, credit **154.46375**. The regression was run before the
engine edit and failed with exactly those two claim amounts, then passed with the correction.

The 2025 mixed-income case independently totals 51,530 before deductions. Subtract deductions of 1,750,
enhanced QPP of 165 and worker deduction of 1,200: line 275 is 48,415; claim base 942.0625, credit 131.88875.
The 2026 counterpart has the same net income, claim base 1148.25 and credit 160.755.
For 2025's taper onset cases, employment is 10,000, QPP is 65 and worker deduction is 600; other income is
32,754/32,755/32,756. Line 275 is therefore 42,089/42,090/42,091, and the claim is 2128/2128/2127.8125.

Additional targeted tests reject subtracting the worker deduction zero or two times, subtracting federal childcare,
and granting the living-alone claim with two adults or disabled personal credits.

## Existing golden reconciliation

[The complete before/after ledger][changes] records every changed existing assertion: file, year, scenario,
province, path, old value and new value. **1,024 changed cells across 76 QC results**, in the eight yearly
goldens and the 2025/2026 QC scenario 154 results in `other-income-original.json`. Existing inputs, assertions,
tolerances and non-QC results are preserved. No blanket capture was run.

The reconciliation independently recomputed old/new Schedule B amounts from the literal sourced table and
scenario income. Unchanged provincial bracket tax, basic credit, dividend credit and federal foreign-credit
limit supplied the surrounding tax capacity. For each amount, provincial tax was recomputed as:

```text
left = max(0, bracket tax - basic credit - Schedule B credit - dividend credit)
provincial FTC = min(withholding - federal FTC, left × foreign income / pre-worker net, left)
tax = left - provincial FTC
saving(x) = old tax(x) - corrected tax(x)
```

This preserves the engine's existing foreign-credit base; changing that base is outside #188. The old/new
claim formula and dollar deltas were calculated independently of the modified engine formula. Each observed
changed cell was required to match the derived delta before it was patched. The reconciliation allowed at most
0.000101 for subtraction of already rounded legacy values; committed tests retain their original exact equality.

The tax saving reduces provincial tax, total tax, net total and gross tax, and increases claim savings.
Average rates divide the corrected total by unchanged cash income. A next-$100 marginal rate changes by
`(saving(x) - saving(x + 100)) / 100`; investment tax changes by `saving(without investments) - saving(x)`.
This explains cases where only `invTax` changes even though the actual household is above the credit's cutoff.
Foreign-income marginal rates also reflect the changed provincial FTC limit. These cases are explicitly included
in the ledger (for example, 2019 scenario 103's `margBy.fd` and 2025 scenario 28's `invTax`).

The salary example saves 37.275, or **0.07765625 percentage points**, below the 0.1-point feature-sizing rule.
This is a correctness fix to an existing program, requires no additional inputs, and is implemented as requested.
The largest annual tax saving among the affected existing cases is 38.0625.

[b19]: 2019/sources/provincial-quebec-living-alone.txt
[b20]: 2020/sources/provincial-quebec-living-alone.txt
[b21]: 2021/sources/provincial-quebec-living-alone.txt
[b22]: 2022/sources/provincial-quebec-living-alone.txt
[b23]: 2023/sources/provincial-quebec-living-alone.txt
[b24]: 2024/sources/provincial-quebec-living-alone.txt
[b25]: 2025/sources/qc-schedule-b.txt
[return25]: 138-senior-credit-rules/sources/qc-return-2025.txt
[params26]: 138-senior-credit-rules/sources/qc-parameters-2026.txt
[availability]: 2026/sources/qc-schedule-b-availability.txt
[prior]: 103-qc-provincial-net-income.md
[qpp]: 84-qpp-deduction.md
[changes]: 188-qc-living-alone-changes.json

# NWT historical child-benefit correction

The [NWT Finance fact sheet](2024/sources/federal-nwt-benefit.txt), page 2, publishes the annual amounts and
formula. C counts children under six; D separately counts children aged six through seventeen. Full entitlement
is C + D. Between $30,000 and $80,000 family net income it is `(C + D) * (80000 - income) / 50000`.
The independently reviewed historical program was added in #108. The old blended program remains unchanged
for the locked 2025 and 2026 baselines.

The additional fixture `tests/golden/features/history2024.json` is hand-calculated from this publication.
Foreign income with zero withholding makes family net income equal the input; no payroll deduction intervenes.

| Cases | Independent expected benefit | Rule path |
|---|---|---|
| none | 0 | No children |
| under-six / older | $815 / $652 at $30,000 | Each age table |
| mixed-lower-bound | $1,467 + $652 = $2,119 | Separate age counts, lower boundary |
| mixed-midpoint | $2,119 / 2 = $1,059.50 at $55,000 | Published linear reduction |
| mixed-exhaustion | 0 at $80,000 | Upper boundary |
| fifth-young | $2,445 + $367 + $652 = $3,464 | Additional young child |
| fifth-older | $815 + $1,956 + $293 = $3,064 | Additional older child |

The provisional 2024 year snapshot is corrected only for NWT. For example, the former blend at $55,000 with
two young and one older child gave $931.80 using annualized rounded monthly values; the published result is
$1,059.50. Exact annual table entries also replace rounded monthly values multiplied by twelve. Other provinces
and all existing 2025/2026 baseline cases remain unchanged.

## Affected provisional year cases

Exactly 44 NWT scenarios change; maximum benefit difference is $652.44. No other province changes.

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
| 51 | 95.1501 | 95.1594 | 0.0093 |
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
| 101 | 1144.6370 | 1144.6657 | 0.0287 |
| 103 | 690.1557 | 690.2235 | 0.0678 |
| 107 | 832.2364 | 832.2697 | 0.0333 |
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

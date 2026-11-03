# 2020 BC child-benefit transition

Refs #27. This prerequisite is stacked on #113 to reuse the verified annual BC opportunity-benefit
calculation. It adds no year parameters and changes no existing program IDs or golden baselines.

## Sources and formula

The [BC Income Tax Act](https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/96215_01),
sections 13.07 and 13.071, explicitly restricts the early-childhood benefit to dependants under six and
months after March 2015 but before October 2020. Section 13.071(2) gives the monthly formula as one
twelfth of `$660 × youngChildren − excessIncome × youngChildren × 1.32%`, where excess income is the
amount above $100,000. Subsection (4) floors negative entitlement at zero. Annual entitlement is therefore:

```text
youngChildren × max(0, 660 − 0.0132 × max(0, familyNetIncome − 100000))
```

Both maximum and reduction scale with eligible young children, so exhaustion is $150,000 regardless of
child count. The standalone `bc-early-childhood-benefit` program takes `perChild`, `threshold`, and `rate`.
It is sourced for full early-benefit years, including July 2019–June 2020, without speculative year logic.

Section 13.092(1)(a) starts the replacement program after September 2020. The contemporary
[CRA T4114 2020](https://publications.gc.ca/collections/collection_2020/arc-cra/Rv1-36-2020-eng.pdf?download=1),
PDF page 9, confirms the July–September early-benefit period and the October start of the under-18
opportunity benefit. It publishes the original annual maxima `[1600,1000,800]` and $25,000 threshold.
The [original Bill 5 of 2019](2020/sources/rule-bc-2019-enactment.txt), section 10 adding section 13.092(2),
establishes both 4% reductions and the $80,000 second threshold. Its minimum totals are $700 for one
child, $1,380 for two and $660 per further child: incremental minima `[700,680,660]`.
The [legislative record](2020/sources/rule-bc-2019-assent.txt) confirms third reading on April 9 and royal assent
on April 11, 2019 (S.B.C. chapter 7). Both extracts are cached under `2020/sources/`.
The third array amount repeats for further children. The current Act's later opportunity-benefit amounts
are not used for 2020.

For July 2020–June 2021, `bc-child-benefit-transition` uses:

```yaml
params:
  early: {weight: 0.25, perChild: 660, threshold: 100000, rate: 0.0132}
  opportunity:
    weight: 0.75
    max: [1600, 1000, 800]
    min: [700, 680, 660]
    singleParent: 0
    threshold: 25000
    minThreshold: 80000
    rate: 0.04
```

Calculate each annual program separately, including its own floor, then multiply by its weight and sum.
Both weights must be positive, at most one, and sum to one. The early period uses `under6`; the later
period uses all children. The existing BC calculation and single-parent parameter remain unchanged.
No recursive or general-purpose mixed-program framework is introduced.

## Independent golden calculations

`tests/golden/bc-transition-2020.json` contains 29 independently calculated cases. Its eight standalone
cases cover no children, no young children, one/two young children, the $100,000 onset, the next dollar,
the $125,000 midpoint, and exhaustion at/above $150,000. Two young children at $125,000 receive
`2 × (660 − .0132 × 25000) = 660`; applying just one household reduction would incorrectly give $990.

The 21 transition cases cover both age groups, every material threshold, further children, and either
program exhausting before the other. Independent arithmetic for the nonzero cases is below:

| Income | All / young children | Annual total calculation |
| --- | --- | --- |
| 0 | 1 / 0 | .75 × 1600 = 1200 |
| 0 or 25000 | 1 / 1 | .25 × 660 + .75 × 1600 = 1365 |
| 0 | 3 / 1 | .25 × 660 + .75 × 3400 = 2715 |
| 0 | 3 / 2 | .25 × 1320 + .75 × 3400 = 2880 |
| 0 | 4 / 1 | .25 × 660 + .75 × 4200 = 3315 |
| 25001 | 1 / 1 | 1365 − .75 × .04 = 1364.97 |
| 47500 or 80000 | 1 / 1 | .25 × 660 + .75 × 700 = 690 |
| 80001 | 1 / 1 | 690 − .75 × .04 = 689.97 |
| 97500 or 100000 | 1 / 1 | Opportunity exhausted; .25 × 660 = 165 |
| 100001 | 1 / 1 | .25 × (660 − .0132) = 164.9967 |
| 125000 | 1 / 1 | .25 × 330 = 82.50 |
| 100000 | 3 / 1 | .25 × 660 + .75 × (2040 − 800) = 1095 |
| 125000 | 3 / 1 | .25 × 330 + .75 × (2040 − 1800) = 262.50 |
| 131000 | 3 / 1 | Opportunity exhausted; .25 × (660 − .0132 × 31000) = 62.70 |
| 150000 | 5 / 2 | Early exhausted; .75 × (3360 − 2800) = 420 |

The remaining cases verify zero with no children, one young child at $150,000, and five children at
$200,000. Targeted tests separately reject a household-wide early reduction, counting older children
in the early period, averaging parameters before floors, and incomplete/invalid period weights.

## Integration

The collector owns 2020 YAML and full-year references/goldens. Notes must describe the separate age groups
and three/nine-month weights. The year comparison continues holding household ages fixed. Shared custody,
part-year residency and birthdays during the benefit year remain outside the household model.
Official source extracts and original-byte hashes are cached under `2020/sources/rule-*`.

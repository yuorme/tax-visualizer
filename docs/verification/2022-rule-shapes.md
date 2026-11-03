# 2022 rule prerequisites

Refs #25. This branch adds the British Columbia benefit-period formula. Data integration owns all 2022
YAML, full-year references, household golden results and UI notes. Existing yearly goldens stay locked.

## British Columbia temporary enhancement

The [Income Tax Amendment Act, 2022, Bill 35](https://www.bclaws.gov.bc.ca/civix/document/id/bills/billsprevious/3rd42nd%3Agov35-1)
changes annualized amounts only for January, February and March 2023. The bill's
[progress record](https://www.bclaws.gov.bc.ca/civix/document/id/lc/billsprevious/3rd42nd_progress-of-bills_government)
shows passage without amendment and Royal Assent on November 3, 2022. Both are cached as `rule-bc-*`.

The new `bc-family-benefit-periods` has `params.periods`, each containing a positive `weight` plus the
existing BC parameters: `max`, `min`, `singleParent`, `rate`, `threshold`, and `minThreshold`. Weights
must sum to one. Compute each annual entitlement with its own minimum and zero floor, then weight and sum.
The existing single-period program shares that calculation without changing its results.

For July 2022–June 2023, baseline months have weight 0.75, `max: [1600,1000,800]`, and
`min: [700,680,660]`; enhanced months have weight 0.25, `max: [2300,1700,1500]`, and
`min: [1300,1280,1260]`. Both use `singleParent: 0`, `rate: 0.04`, `threshold: 25806`, and
`minThreshold: 82578`. Arrays contain incremental amounts; the third repeats for further children.

Baseline figures come from CRA's
[T4114 2022](https://publications.gc.ca/collections/collection_2022/arc-cra/Rv1-36-2022-eng.pdf?download=1),
printed pages 18–19, cached as `rule-t4114.txt` (PDF pages 9–10). The archive download requires its catalogue
page as the HTTP Referer, in addition to the `download=1` query parameter. The official PDF's byte hash
matches the available CCH mirror. Current BC web-page historical amounts
were not used: its baseline nine-month figures reflect later amounts and conflict with the contemporary guide.

## Independent golden calculations

`tests/golden/bc-periods-2022.json` is a new fixture written from the following arithmetic, not captured
from engine output. `tests/engine-history2022.test.ts` runs every case; targeted assertions separately
reject averaging parameters before applying floors and check single-parent handling and invalid weights.

For one child below the second threshold, let `x = max(0, income - 25806)`:

```text
0.75 × max(700, 1600 - 0.04x) + 0.25 × max(1300, 2300 - 0.04x)
```

Above the second threshold, let `z = income - 82578`:

```text
0.75 × max(0, 700 - 0.04z) + 0.25 × max(0, 1300 - 0.04z)
```

| Income | Children | Expected | Independent boundary/calculation |
| --- | --- | --- | --- |
| 0 | 0 | 0 | No eligible child |
| 0 / 25,806 | 1 | 1,775 | 0.75 × 1600 + 0.25 × 2300 |
| 25,807 | 1 | 1,774.96 | First dollar of 4% reduction |
| 48,306 | 1 | 875 | Baseline reaches minimum: 0.75 × 700 + 0.25 × 1400 |
| 50,000 | 1 | 858.06 | 0.75 × 700 + 0.25 × 1332.24 |
| 50,806 / 82,578 | 1 | 850 | Both at minimum: 0.75 × 700 + 0.25 × 1300 |
| 82,579 | 1 | 849.96 | First dollar of final 4% reduction |
| 92,578 | 1 | 450 | 0.75 × 300 + 0.25 × 900 |
| 100,078 | 1 | 150 | Baseline exhausted, enhanced 0.25 × 600 |
| 100,079 | 1 | 149.99 | Only enhanced component continues declining |
| 115,078 / 120,000 | 1 | 0 | Enhanced component exhausted |
| 0 | 2 | 2,950 | 0.75 × 2600 + 0.25 × 4000 |
| 0 | 4 | 4,900 | 0.75 × 4200 + 0.25 × 7000; repeated third-child increment |
| 82,578 | 2 | 1,680 | 0.75 × 1380 + 0.25 × 2580 |

## Newfoundland and Labrador supplement

No split-period formula is required for July 2022–June 2023. The independently cached
[NLR 26/22](https://www.assembly.nl.ca/legislation/sr/annualregs/2022/nr220026.htm) explicitly starts
July 1, 2022; [NLR 34/23](https://www.assembly.nl.ca/legislation/sr/annualregs/2023/nr230034.htm)
explicitly starts July 1, 2023. April filing dates do not move those commencement dates. The existing
supplement program represents the entire 2022 benefit year with one parameter set.

## Integration scope

- Historical notes must recognize `bc-family-benefit-periods` and explain its nine/three-month weighting.
- PEI and Quebec one-time inflation payments are excluded from recurring benefits, as directed for this
  milestone. Carbon pricing remains in #29.
- NWT uses the previously merged separate-age-group program. Other provincial shapes reuse existing programs.
- Full-year 2022 fixtures and references belong to the data integration; this PR's separate golden fixture
  covers every new BC rule path and material boundary without changing existing baselines.

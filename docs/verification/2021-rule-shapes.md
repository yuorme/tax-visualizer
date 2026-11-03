# 2021 rule prerequisites

Refs #26. These additions represent two historical formulas without changing the later program IDs.
Amounts and rates remain in data; the engine contains no year checks. The data integrator owns 2021 YAML,
full-year reference tests, household goldens, notes and any source-supported invariant exceptions.

## Manitoba rental occupancy cost

[MB479 (2021)](https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5007-tc/5007-tc-21e.pdf), page 2,
line 20 takes 20% of annual rent. Lines 24–25 multiply occupancy cost by 75%. For the modeled non-senior
household, lines 29–30 cap the credit at $525. Thus the rental formula is `min(525, annualRent × 0.15)`.
This differs from the later renters credit's direct rent cap.

New credit program `mb-school-tax-credits-rent-share` retains the existing school-tax parameters and
adds `renterShare`. The 2021 value 0.15 is the exact product of the two published percentages, not an
empirical estimate. All parameters are explicit: `schoolTaxShare`, `schoolRebateRate`,
`educationCreditMax`, `renterMax`, and `renterShare`; `nameRenter` remains a program-level label.

The homeowner branch stays `schoolRebate + min(creditCap, schoolTax - schoolRebate)`. The province's
[historical rebate page](https://www.gov.mb.ca/edupropertytax/index.html) confirms the 2021 rebate is 25%
and the education property tax credit is capped at $525. The school share of a representative city's
property bill remains an explicit data estimate. As in the existing model, homeowners take precedence
when both property tax and rent are entered. Senior additions and mixed-tenure allocation are outside
this rule addition.

## Nova Scotia ordered child amounts

[N.S. Regulation 92/2020](https://novascotia.ca/just/regulations/RG2/2020/RG2-2020-07-17.pdf), PDF pages
2–3, effective July 1, 2020, specifies annual amounts of $925 for the first child, $825 for the second,
and $900 for each subsequent child. Below $26,000 adjusted income, all amounts apply. From $26,000
through the partial-income band, the first child retains its full amount while subsequent amounts are
halved. The benefit ends at $34,000. The contemporary
[CRA T4114](https://publications.gc.ca/collections/collection_2021/arc-cra/Rv1-36-2021-eng.pdf?download=1)
confirms the benefit income range. The regulations' amendment history shows no intervening 2021 change.

New child-benefit program `nova-scotia-child-benefit-by-child` takes `perChild: [925,825,900]`,
`fullBelow: 26000`, `partialBelow: 34000`, and `partialOtherRate: 0.5`. The third amount repeats for
further children. `partialOtherRate` is the fraction paid for children after the first in the partial band.
The existing program cannot represent differing first, second and subsequent amounts.

## Independent golden calculations

`tests/golden/history-rules-2021.json` adds 22 cases without changing existing baselines. The fixture
was written from the following arithmetic, not captured from engine output. Its test runner checks all
cases. Separate targeted tests distinguish halving the entire NS benefit, using one flat child amount,
applying MB's rent percentage after its cap, and changing the later MB program.

NS cases cover no children; one/two/three/five children; both sides and exact values of both income
boundaries; and the repeated third-child amount:

| Children | Full benefit | Partial benefit |
| --- | --- | --- |
| 0 | 0 | 0 |
| 1 | 925 | 925 |
| 2 | 925 + 825 = 1750 | 925 + 825 / 2 = 1337.50 |
| 3 | 925 + 825 + 900 = 2650 | 925 + (825 + 900) / 2 = 1787.50 |
| 5 | 925 + 825 + 3 × 900 = 4450 | 925 + (825 + 3 × 900) / 2 = 2687.50 |

At $25,999 income the full amount applies; at $26,000 and $26,001 the partial amount applies.
At $33,999 the partial amount remains; at $34,000 and $34,001 the result is zero.

The MB fixture uses a synthetic 50% school-tax share to make arithmetic independent of a city's rate:

| Input | Independent expected credit |
| --- | --- |
| No property tax or rent | 0 |
| Rent 1000 | 1000 × .20 × .75 = 150 |
| Rent 3499 | 3499 × .15 = 524.85 |
| Rent 3500 / 3501 | 525 cap |
| Property tax 1000 | School tax500: rebate125 + remaining375 = 500 |
| Property tax 1399 | School tax699.50: rebate174.875 + remaining524.625 = 699.50 |
| Property tax 1400 | School tax700: rebate175 + credit525 = 700 |
| Property tax 1401 | School tax700.50: rebate175.125 + cap525 = 700.125 |
| Property tax 2000 and rent10000 | School tax1000: rebate250 + cap525 = 775, no renter addition |

Cached `rule-*` sources include the complete relevant form pages, regulation amendment and historical
rebate record. The CRA archive needs its catalogue page as HTTP Referer and the `download=1` parameter.
Historical notes must recognize both new IDs; NS's step changes must remain visible in invariant tests.

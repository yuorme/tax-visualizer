# Regional carbon rebate formulas and independent goldens

This additive prerequisite extends #122 with three distinct programs. The existing `carbon-rebate-payments`
path, its fixture and all existing year snapshots remain unchanged. Activation, heating assumptions, gas-rate
data and interface explanations belong to the separate carbon-data integration.

## Alberta: annual entitlement, minimum and child cap

`alberta-carbon-rebate-payments` accepts payment records with annual `adult`, `spouse`, `child`, `firstChild`,
`childCap`, `threshold: [single, family]`, `rate: [single, family]`, `minAnnual` and payment `weight`.
For a single parent, the first-child substitute is applied before capping the remaining children.
Reduce and floor the annual amount at zero, discard it if below the annual minimum, then apply the weight.
Equality at the minimum qualifies; this is not a minimum benefit that raises smaller amounts.

[Bill 20 of 2016](2019/sources/rule-carbon-ab-statute.txt), section 35.3(3)–(5), PDF pages 96 and 98, supplies
quarterly weight 25%, four ordinary child amounts after excluding the substituted first child, thresholds
$47,500/$95,000, rates 2.67%/4%, and the $100 annual cutoff. It also specifies the January 2018 increases to
$300 adult, $150 spouse/first child and $45 child. [The budget](2019/sources/rule-carbon-ab-budget.txt) corroborates
the implemented schedule. [Hansard](2019/sources/rule-carbon-ab-end.txt), PDF pages 25–26, confirms no July 2019
payment: the calendar records contain January and April, without levy-end-date proration of cash already paid.

Independent arithmetic in `tests/golden/regional-carbon.json`:

- Two quarters give $150 single, $225 couple/one-child parent, and $270 couple with two children.
- Couple with four or six children: `(300 + 150 + 4*45)/2 = 315`.
  Parent with four: `(300 + 150 + 3*45)/2 = 292.50`; five or six children give $315.
- Single $48,500: `(300 − .0267*1000)/2 = 136.65`; couple $96,000: `(450 − .04*1000)/2 = 205`.
- Single $54,990 has annual $100.017, giving $50.0085. At $54,991 annual $99.9903 is discarded.
- Couple $103,750 has annual exactly $100 and receives $50 in two payments; $103,751 receives zero.
  With two children the corresponding boundary is $106,000. High income exhausts the benefit.

## PEI: carbon increment above the ordinary credit

`pei-carbon-rebate-increment` accepts `payments: [{date, weight, regular, enhanced}]`. Both annual objects have
`individual`, `spouseOrDependant`, `supplementRate`, `supplementFrom`, `supplementMax`, `threshold` and `rate`.
Calculate each annual PEI formula with its own zero floor, subtract regular from enhanced, then apply the weight.
The existing ordinary credit is not counted twice, including when that credit has already ended.

[The Act](2022/sources/rule-carbon-pe-regular.txt), section 36.3(4)–(8), gives regular annual $110 individual,
$55 spouse/dependant, a 0.5% supplement above $30,000 capped at $55, and 2% reduction above $50,000.
[Original Bill 64](2022/sources/rule-carbon-pe-amendment.txt) changes July 2022 to $670 individual and 4%
reduction, retaining the one-quarter weight. The current Act also includes later extraordinary inflation
payments; the original amendment isolates carbon. [The official examples](2022/sources/rule-carbon-pe-examples.txt)
confirm implementation and separate carbon from those inflation payments. A browser challenge prevented direct
download, so this cache is explicitly a manual web extract without a publication hash.

- At/below $50,000, supplements cancel: `(670−110)/4 = 140`, including the published single $45,000 example.
- Single $55,000: enhanced `670+55−.04*5000 = 525`, regular `110+55−.02*5000 = 65`; difference/4 is $115.
- Single $58,250: regular first reaches zero; enhanced $395 gives $98.75. At $60,000 enhanced $325 gives $81.25.
- Couple $60,000: enhanced $380 minus regular $20, divided by four, gives $90. Regular reaches zero at $61,000,
  where the increment is $85. At $63,000 enhanced $260 gives the published $65; single parents use the same rule.
- Enhanced single entitlement ends at $68,125; family entitlement ends at $69,500. One dollar before either
  boundary the payment is $0.01. Goldens cover both floors, supplement boundaries and family shapes.

## NWT: small quarterly amounts paid together in July

`carbon-rebate-consolidated-payments` retains generic per-payment amount/threshold/rate fields and adds
`smallPayment: {below, multiplier}`. Compute the ordinary nonnegative payment. If strictly below `below`, apply
`multiplier`; otherwise retain one payment. Records explicitly supply July's multiplier and suppressed quarters.
Household composition and modeled income stay fixed across records.

[The April 2020 release](2020/sources/rule-carbon-nt-consolidation.txt) gives April 30 amounts $52/adult and
$60/child. Starting July, annual amounts are $156/adult and $180/child, normally quarterly. It explicitly says
singles receive the annual amount in July because their quarterly payment is less than $50. July therefore
uses multiplier four for small payments, and October/January/April use zero. Families above the threshold
continue quarterly; first children receive the child amount, without an adult-rate substitution.
[The retrospective report](2021/sources/rule-carbon-nt-annual.txt), PDF page 7, supplies the next benefit year's
$208/adult and $240/child annual amounts and July–June cycle.

| Family | 2020 cash | 2021 cash |
|---|---:|---:|
| Single | `52 + 4*39 + 0 = 208` | `0 + 0 + 52 + 52 = 104` |
| Couple | `104 + 78 + 78 = 260` | `78 + 78 + 104 + 104 = 364` |
| Parent, one child | `112 + 84 + 84 = 280` | `84 + 84 + 112 + 112 = 392` |
| Couple, two children | `224 + 168 + 168 = 560` | `168 + 168 + 224 + 224 = 784` |

Synthetic boundaries prove $0 stays zero, $49 becomes $196, and $50/$51 stay $50/$51. High income leaves the
non-income-tested NWT data unchanged. No analogous Nunavut consolidation is inferred without actual cash evidence.

## Coverage and integration

The separate fixture contains 57 independent cases. Three integrated cases prove rebates reduce net/total tax
exactly once, increase refundable benefits, leave gross tax unchanged, and disappear with the credits switch off.
No existing fixture is rewritten. New Alberta and consolidated-payment records accept validated `YYYY-MM` or
full ISO dates, retaining source precision. Both are constrained to the data year. Existing generic records still
require full dates. Schema tests reject invalid months, out-of-year payments, negative caps and weights above one.
No amount, rate, threshold or calendar-year branch is embedded in the engine.

# Historical Nunavut Canada Workers Benefit phase-in

Refs #27 and #28. The [official 2020 Schedule 6](2020/sources/rule-nu-cwb.txt), page 4, specifies a
10% phase-in for a single person without an eligible dependant and 14% for a spouse or eligible dependant.
Both exclude the first $6,000 of working income. The maximum is $1,085 single or $1,630 family;
reductions are 4% above $21,654 and 8% above $29,551, respectively.

Regional `workersBenefit.rate` now accepts either a scalar or `[single, family]`. The family branch includes
a single parent. Standard and Quebec shapes are unchanged; scalar regional data retains the same calculation.
No year data is activated by this prerequisite, and no existing golden cases change.

## Independent golden arithmetic

The separate fixture `tests/golden/nunavut-cwb-rates.json` uses the published 2020 amounts above.
At $6,000 working income both entitlements are zero. Five more dollars gives $0.50 single or $0.70 family.
At $10,000 work and net income, the $4,000 eligible earnings give $400 single and $560 family, including
single parents. Splitting the same $10,000 work equally between spouses preserves the $560 result.

The single cap is reached at `6000 + 1085 / .10 = 16850`. Family earnings of $17,642 give
`11642 × .14 = 1629.88`, while $17,643 is capped at $1,630. At each net-income reduction threshold
the capped amount remains unchanged. A further $1,000 reduces the single amount to $1,045 and the
family amount to $1,550. Exhaustion is `21654 + 1085 / .04 = 48779` single and
`29551 + 1630 / .08 = 49926` family.

Two scalar-regression cases use 14% for both household types and independently expect $560 at $10,000.
Schema tests reject incomplete, excessive and out-of-range rate pairs. The targeted cases distinguish
using a single rate for every family and incorrectly treating a single parent as a childless single.

# Independent 2023 golden calculations

`tests/golden/features/history2023.json` adds 16 independently calculated cases without changing prior fixtures.
The complete year snapshot also covers the standard 148 households in all 13 jurisdictions. References compare
published combined marginal rates for all jurisdictions, federal payroll caps, CCB, GST/HST and all regional
CWB schedules, and historical Alberta, NL and NWT child benefits.

## PEI surtax

[PE428](2023/sources/rule-pe428.txt) applies dividend credits before its 10% surtax above $12,500. The fixture
uses no personal credits and foreign income with no withholding, so there are no payroll deductions. Published
brackets give tax `31984 * .098 + 31985 * .138 + (income - 63969) * .167` above $63,969. At $100,000 this
is $13,565.539; surtax is $106.5539 and provincial tax $13,672.0929.

Eligible dividends of $10,000 add $13,800 taxable income and a $1,449 provincial credit. Tax before surtax
becomes $14,421.139, surtax $192.1139, and tax $14,613.2529. Noneligible dividends add $11,500 taxable income
and a $149.50 credit, producing surtax $283.6539 and tax $15,620.1929. The $12,500 boundary is solved directly
from the bracket formula; adding $10 taxable income adds $1.67 tax and $0.167 surtax. A low-income eligible
dividend case verifies the nonrefundable floor, while $90,000 foreign income lies below the surtax threshold.

## NL half-year child benefits

The [rule source audit](2023-rule-shapes.md) links the published old/new annual amounts and statutory rates.
Each period is floored separately and weighted 0.5. One child at the $17,397 threshold receives
`(447 + 1788) / 2 = 1117.50`. At $18,397 subtract `(0.0507 + 0.161) * 1000 / 2`, giving $1,011.65.
At $27,000, the first period is exhausted and the second gives `(1788 - 9603 * .161) / 2 = 120.9585`.
At $40,000 both are exhausted. Four children at $18,397 receive
`(1977 + 7908 - 1000 * (.1622 + .0619 + .5151 + .1971)) / 2 = 4474.35`.
For five children the maxima total $2,524/$10,096 and rates .286/.9093, giving $5,712.35.
Zero-child and both-period exhaustion cases cover the floors.

## Payroll and inherited historical paths

[T4127](2023/sources/federal-t4127.txt), tables 8.3–8.7, publishes CPP/QPP base maxima $3,123.45/$3,407.40,
first additional maximum $631, EI maxima $1,002.45/$781.05, and QPIP maximum $449.54. The two $100,000
employment cases verify there is no second additional contribution in 2023.

The NWT age-group program is covered by the eight independent 2024 feature specimens and by this year's
published reference tests and year snapshot. The historical NS, MB and AB paths already have separate
independent feature goldens; 2023 uses the same formulas with its sourced parameters. Existing 2024–2026
year fixtures and earlier feature cases are unchanged by this PR.

## Invariant boundaries

Independent diagnosis found 12 seeded NL steps with four/five children below the generic $45,000 lower bound.
The 2023 GST clawback begins at $42,335. Published CCB 23%, CWB 15%, GST 5%, NL supplement 9% and tax-reduction
16% rates overlap with tax/payroll; the full marginal burden is 102.54554%. Gross $42,500 to $43,000 produces
net income $42,110 to $42,605 and disposable income $76,313.38125 to $76,311.90355. The child benefit is zero.

The Alberta child-count case has unchanged net income $51,682.68 and work income $8,050. Both base components
are exhausted. Working phase-in is $793.50 below both caps; three/four-child reductions are 8.34%/8.95% above
$43,460. Benefits fall from $107.728488 to $57.570140, exactly `.0061 * 8222.68 = 50.158348`. Aggregate benefits
still rise $5,723.054452. The exception matches this exact positive uncapped case and preserves the aggregate
assertion; it does not exempt general decreases.

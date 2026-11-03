# Independent 2022 golden calculations

The eight cases in `tests/golden/features/history2022.json` verify integrated BC benefits and payroll against
independent arithmetic. The complete year snapshot adds 148 households across all 13 jurisdictions; published
references verify their top marginal rates, federal payroll caps, CCB/GST/CWB and regional child benefits.
Existing 2023–2026 year fixtures and all earlier feature fixtures remain unchanged.

## BC period benefits

[The rule source audit](2022-rule-shapes.md) maps all 17 standalone period golden cases to the official CRA
publication and BC legislation, including the material thresholds, floors, child counts and parent supplement.
The six integrated cases here use foreign income with no withholding to avoid payroll deductions changing AFNI.

For one child, nine ordinary months and three enhanced months yield `.75 * 1600 + .25 * 2300 = 1775` at zero
income. At $50,000, the $24,194 overage reduces each annual amount by $967.76. The ordinary period hits its
$700 floor, while the enhanced period retains $1,332.24: `.75 * 700 + .25 * 1332.24 = 858.06`.

At $100,078, the second-stage reduction is `(100078 - 82578) * .04 = 700`. Ordinary entitlement is exhausted,
but enhanced entitlement is $600, yielding `$600 * .25 = $150`. At $117,000 both periods are exhausted.
Four children at zero income yield `.75 * (1600 + 1000 + 800 + 800) + .25 * (2300 + 1700 + 1500 + 1500)
= 4900`. The zero-child case verifies neither period creates an entitlement.

## Payroll

[T4127](2022/sources/federal-t4127.txt) publishes YMPE $64,900, exemption $3,500, total CPP/QPP rates 5.70%/6.15%,
EI maximum earnings $60,300 and rates 1.58%/1.20%, and QPIP maximum earnings $88,000 at 0.494%.
The [official pension table](2022/sources/federal-pension-components.txt) separates base and first additional
contributions. At $100,000 employment income, CPP base is `61400 * .0495 = 3039.30`, QPP base is
`61400 * .054 = 3315.60`, and the first additional amount is `61400 * .0075 = 460.50` for either plan.
EI is $952.74/$723.60 and QPIP is $434.72 in Quebec. There is no second additional contribution in 2022.

## Invariant boundary

Independent diagnosis found 12 seeded NL steps with four/five children below the generic $45,000 lower bound.
The published NL supplement starts reducing at $40,000, while the standard CWB family amount ends at
`26805 + 2461 / .15 = 43211.6667`. CCB 23%, CWB 15%, GST 5%, NL supplement 9% and provincial low-income
reduction 16% overlap with tax and payroll, giving a full marginal burden of 102.50114%.

Gross income $40,500 to $41,000 raises family net income from $40,222.50 to $40,718.75 but lowers disposable
income from $72,180.7583 to $72,168.2526, a $12.5057 decrease. Provincial child benefit is zero at both points.
The year-specific exception only admits single parents with at least four children whose sweep step intersects
that sourced interval, including its step-straddling boundaries. Aggregate benefit assertions are retained.

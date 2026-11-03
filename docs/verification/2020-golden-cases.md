# Independent 2020 golden calculations

The 12 cases in `tests/golden/features/history2020.json` verify integrated BC transition benefits, Nunavut's
household-specific CWB phase-in and 2020 payroll. The complete year snapshot covers 148 households across
all 13 jurisdictions. Existing 2021–2026 year fixtures and earlier feature expectations remain unchanged.

## British Columbia transition

[The BC rule audit](2020-rule-shapes.md) maps the prerequisite's 29 independently calculated golden cases
to the original legislation and contemporary CRA guide, including every material threshold and floor.
The integrated fixtures use foreign income with no withholding so family net income equals the input.

At zero income, an older child receives `.75 * 1600 = 1200`; a young child also receives `.25 * 660`, totaling
$1,365. Three children, two young, receive `.75 * (1600 + 1000 + 800) + .25 * 1320 = 2880`.
At $125,000 one young child's opportunity benefit is exhausted while early entitlement remains
`.25 * (660 - .0132 * 25000) = 82.50`. At $150,000 early entitlement is zero; five children's opportunity
minimum is `700 + 680 + 3 * 660 = 3360`, reduced by `.04 * (150000 - 80000) = 2800`, giving
`.75 * 560 = 420`. At $200,000 both programs are exhausted.

## Nunavut CWB

[Schedule 6](2020/sources/federal-schedule6-5014.txt), page 4, publishes separate phase-in rates of 10% single
and 14% family, including a single parent. [The rule audit](2020-nunavut-cwb.md) documents all 18 standalone
goldens covering phase-in, caps, reduction onset/exhaustion, spouse earnings and preserved scalar behavior.

At $7,000 employment income, eligible earnings are $1,000, giving $100 single and $140 parent. Net income is
$6,989.50 after the $10.50 enhanced pension deduction, below either reduction threshold. GST is $296 single
and `296 + 296 + 155 = 747` for a parent with one child. At $20,000 employment, both CWB amounts reach their
caps of $1,085/$1,630; net income $19,950.50 is below either reduction threshold. The single GST supplement
reaches its $155 cap, giving $451; the parent still receives $747. The integrated fixtures assert both named
credits without deriving expectations from engine output. No secondary-earner exemption exists in 2020.

## Payroll and references

[T4127](2020/sources/federal-t4127.txt), tables 9.3–9.4 and its QPIP section, and the
[ESDC component table](2020/sources/federal-pension-components.txt) publish YMPE $58,700 and exemption $3,500.
At $100,000 earnings, CPP base is `55200 * .0495 = 2732.40`, QPP base is `55200 * .054 = 2980.80`, and first
additional contributions are `55200 * .003 = 165.60`. EI is `54200 * .0158 = 856.36` outside Quebec and
`54200 * .012 = 650.40` in Quebec; QPIP is `78500 * .00494 = 387.79`. No second additional band applies.

The all-jurisdiction reference uses TaxTips' 2020 columns, with Quebec eligible dividends independently
corroborated at 40.11% by [Richter's contemporary rate card](2020/sources/reference-qc-richter.txt). The older
TaxTips edition prints 40.10%, inconsistent with exact published federal/provincial credit rates. No tolerance
was widened. Other references verify all federal benefits, regional CWB, AB statutory reductions, BC periods,
MB's 20% rental credit and NB's 9.68% first bracket.

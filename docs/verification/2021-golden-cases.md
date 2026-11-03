# Independent 2021 golden calculations

The 11 cases in `tests/golden/features/history2021.json` verify the integrated Nova Scotia and Manitoba
historical rules and 2021 payroll. The complete year snapshot covers 148 households across all 13 jurisdictions;
published references verify all top combined marginal rates and federal/regional benefit parameters.
Existing 2022–2026 snapshots and earlier feature cases remain unchanged.

## Historical rule paths

[The rule audit](2021-rule-shapes.md) maps the prerequisite's 22 standalone goldens to the official NS regulation
and MB479, covering every material boundary. The integrated fixtures use foreign income without withholding
to isolate family net income from payroll deductions.

Nova Scotia pays $925 for the first child, $825 for the second and $900 thereafter. Three children below
$26,000 receive `925 + 825 + 900 = 2650`. At $26,000 only later children are halved, giving
`925 + (825 + 900) / 2 = 1787.50`. One child still receives $925 at $30,000; five receive
`925 + (825 + 3 * 900) / 2 = 2687.50` at $33,999. At $34,000 the benefit ends. Zero children receive zero.

Manitoba's non-senior rental credit is `min(525, annualRent * .20 * .75)`. The household input is monthly rent:
$100 therefore gives `1200 * .15 = 180`; $3,500/12 reaches the exact $525 cap; $300 remains capped at $525.
The fixture checks both the credit name and amount in the integrated result. Standalone prerequisite cases
cover the homeowner branch, its cap and owner precedence; these do not change in this integration.

## Payroll and independent references

[T4127](2021/sources/federal-t4127.txt), tables 9.3–9.5, and the
[ESDC component table](2021/sources/federal-pension-components.txt) publish YMPE $61,600 and exemption $3,500.
At $100,000 earnings, CPP base is `58100 * .0495 = 2875.95`, QPP base is `58100 * .054 = 3137.40`, and first
additional contributions are `58100 * .005 = 290.50`. EI is `56300 * .0158 = 889.54` outside Quebec and
`56300 * .0118 = 664.34` in Quebec. QPIP is `83500 * .00494 = 412.49`; there is no second additional band.

The independent top-rate reference caught a provisional NL dividend-credit carryover before any year capture.
The official [2021 NL worksheet](2021/sources/provincial-5001-d.txt), PDF page 3, publishes eligible 5.4% and
noneligible 3.5%, giving combined top rates 42.61% and 44.59%. The unmerged provisional 6.3%/3.2% values were
corrected. No pre-existing golden expectation changed.

## Invariant boundaries

The NS new program is classified as a step benefit at its published $26,000/$34,000 boundaries. The suite
still requires the declared cliffs to be observed and preserves its aggregate benefit assertions.

Independent diagnosis found seven NL seeded sweep steps with four/five children where smooth clawbacks
overlap. The NL supplement starts reducing at $40,000; standard family CWB ends at `26177 + 2403/.15 = 42197`.
CCB 23%, CWB 15%, GST 5%, NL supplement 9% and provincial tax reduction 16% overlap with tax and payroll.
The marginal components are `.139455` federal, `.2977939` provincial, `.0703` payroll and `.5174` benefits,
totaling 102.49489%. Gross $40,500 to $41,000 gives net $40,315 to $40,812.50 and disposable income
$70,329.5308 to $70,317.05635 (a $12.47445 decrease); provincial child benefit is zero at both points.
Only a 2021 NL single-parent four-plus-child step intersecting that sourced interval is admitted, with one
sweep-step allowance at its boundaries. All unrelated exceptions and aggregate assertions remain unchanged.

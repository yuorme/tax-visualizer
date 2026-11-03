# Historical carbon pricing

## Calendar-year convention

Direct gasoline charges use the rates and dates within the calendar tax year, weighted by days as for other fuel
taxes. Rebate records describe cash payments in that same calendar year, including January and final April 2025
payments. Household composition and income are held fixed, following the model's existing one-family convention.
Provincial income tests use modeled current income; individual filing dates and arrears are not reconstructed.
The reference-city location determines rural eligibility, as for property and regional fuel tax.

Heating is a sourced, explicitly estimated household amount. It does not change with driving or household size.
Indirect carbon costs embedded in goods or electricity are excluded. Quebec cap-and-trade remains excluded.

## Independent engine goldens

`tests/golden/features/carbon.json` is entered from the calculations below, not captured from engine output.
Official sources are cached in `2025/sources/carbon-federal-rates.txt` and `carbon-federal-rebates.txt`.

- 2025 gasoline: 1,000 litres × $0.1761 × 90/365 = $43.4219178082. The rate is zero from April 1.
  A synthetic $100 heating estimate isolates integration: gross carbon cost $143.4219178082.
- Alberta payments in January and final April 2025: adult $225 + $228 = $453;
  spouse $112.50 + $114 = $226.50; each child $56.25 + $57 = $113.25.
  A couple with two children receives $906. A single parent with two children receives $792.75 because the
  first child uses the spouse-equivalent amount. Income does not reduce the federal rebate.
- Net tax change for that couple is $143.4219178082 minus $906 = -$762.5780821918.
- Synthetic provincial payment tests: at income $15,000, a $100 payment reduced at 1% above $10,000 gives $50;
  a $120 payment reduced at 2% above $20,000 stays $120. Their sum is $170. At income $30,000 both are zero.
  This checks that separate payment floors cannot be replaced by averaging thresholds.

Existing-year data is not yet activated by this prerequisite. No existing golden expectations are changed.

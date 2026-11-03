# Historical carbon pricing

## Calendar-year convention

Direct gasoline charges use the rates and dates within the calendar tax year, weighted by days as for other fuel
taxes. Rebate records describe cash payments in that same calendar year, including January and final April 2025
payments. Household composition and income are held fixed, following the model's existing one-family convention.
Provincial income tests use modeled current income; individual filing dates and arrears are not reconstructed.
The reference-city location determines rural eligibility, as for property and regional fuel tax.

In historical data records, the first day of a payment month identifies the payment period; it does not assert
the exact bank deposit date. Pre-quarterly CAI payments use April as the normal tax-return filing season.
Statutory annual BC amounts are divided by four before income testing, retaining fractional cents until final
display rather than summing rounded illustrations. Enhanced payments are tested separately.

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
  At $10,000 both are unreduced: $220. At $20,000 the first exhausts and the second starts reducing: $120.
  At $22,000 the first stays zero and the second is $120 - 2% × $2,000 = $80. Combining reductions before
  flooring would incorrectly produce $60. The second exhausts at $26,000, giving zero total.
- Synthetic family thresholds: one payment with adult $100, spouse/first child $50 and other children $25;
  single threshold $10,000, family threshold $20,000 and reduction 1%. At income $15,000 a single receives
  $100 - 1% × $5,000 = $50. A couple and a single parent with one child each receive $150 without reduction;
  a single parent with two children receives $175. This isolates the family threshold and first-child substitution.

The original engine prerequisite leaves existing-year data and goldens unchanged. The subsequent activation
adds sourced 2019–2025 data and separate [published references](carbon-reference.md). Its affected historical
snapshots are reconciled against independently calculated carbon-only deltas; unrelated fields, Quebec and
all 2026 snapshots are preserved. See the activation audit for exact affected cases and before/after values.

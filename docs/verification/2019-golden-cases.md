# Independent 2019 integrated cases

The 44 cases in `tests/golden/features/history2019.json` use actual 2019 data with independently calculated
expectations. They complement the 149 rule-isolation fixtures documented in `2019-rule-shapes.md`.
No previous year's baseline is recaptured. The regular 2019 household snapshot is captured only after these
calculations and the independently published marginal-rate references pass.

Unless stated otherwise, foreign income without withholding supplies exact family net income, credits are enabled
only for benefit cases, and all children are assigned to the modeled first family. Employment cases add foreign
income equal to target family net income minus earnings plus the deductible additional CPP contribution.
This is $0.0015 times earnings between $3,500 and $57,400, as published by ESDC.

## Child benefits

- `bc-*`: the official early-childhood rule pays $660 per child under six, reduced by 1.32% of income above
  $100,000 **for each eligible child**. One young child gets $660, an older child gets zero, and two young
  children get $1,320/$660/$0 at incomes $100,000/$125,000/$150,000.
- `ab-base` and `ab-both`: four-child ACB is $2,886 at $26,769. Fully phased-in AFETC adds $2,113, total $4,999.
  `ab-phase-in`: two-child ACB $1,732 plus 11% of ($3,760 − $2,760) gives $1,842.
  `ab-two-minima`: at net $43,200, ACB is $1,155 − 7% × $16,431 = $4.83; earnings $2,770 give AFETC $1.10.
  Each separate statutory $10 minimum applies, total $20. ACB ends at $43,269. AFETC at $63,302 is
  $801 − 4% × $20,000 = $1, raised to $10; it is zero at $63,327.
- `ns-*`: ordered maxima are $624.96, then $825, then $900 per further child. Thus one/two/four children get
  $624.96/$1,449.96/$3,249.96 at $18,000. At $18,001, two-child reduction is 18.12% × $1 = $0.1812.
  Three-child reduction at $20,000 is (18.12% + 11.25%) × $2,000 = $587.40, leaving $1,762.56.
  Two children retain $0.36 at $26,000 and nothing at $26,004; no invented $26,000 hard cutoff is used.
- `qc-*`: three-child maximum $2,472 + $1,735 + $1,735 = $5,942; single-parent supplement $867 gives $6,809.
  Five-child couple maximum adds two further amounts of $1,852, total $9,646.
  At $1,000 above the single threshold of $35,680, $40 is deducted, leaving $6,769.
  The three-child single-parent minimum is $694 + 2 × $641 + $346 = $2,322.
  Two school-age children add 2 × $102 to $6,809, giving $7,013.

These amounts and formulas are cached in the provincial T4114, Alberta statute/budget, Nova Scotia regulations,
and Quebec parameters. The prerequisite audit maps the exact publications and pages to the rule-isolation cases.

## Premiums, levy, flat BPA and payroll

- `msp-*`: the archived BC regulation's monthly per-adult premiums become annual $0/$138/$210/$276/$336/$390/$450.
  Income up to $26,000 is exempt; $26,001 pays $138; over $42,000 pays $450.
  A couple deducts $3,000 and pays for two adults: $29,000/$29,001/$50,000 yield $0/$276/$900.
  A single parent deducts $3,000 for one child, so $29,000 is exempt. Both payroll and the exposed premium
  breakdown are asserted. The prerequisite separately covers every band and the half-childcare addback.
- `nl-levy-*`: NL428 page 5 charges 10% of taxable income above $50,000 capped at $100, then a $100 base plus
  10% over $55,000 capped at $200. The last band has $1,700 base above $600,000, capped at $1,800.
  Assertions cover the first onset, ramp, cap, next onset/ramp and last ramp/cap. The prerequisite covers all
  18 bands and verifies the levy is applied after credits and uses taxable income including dividend gross-ups.
- `flat-bpa-*`: foreign income $12,068/$12,069/$12,070 less the published flat $12,069 amount at 15% gives
  federal tax $0/$0/$0.15. There is no employment credit or withholding in these cases.
- `payroll-*`: earnings $100,000 reach every cap. Pensionable earnings $57,400 − $3,500 = $53,900 yield
  CPP base $2,668.05 at 4.95%, QPP base $2,910.60 at 5.4%, and additional contributions $80.85 at 0.15%.
  EI is $53,100 × 1.62% = $860.22, or × 1.25% = $663.75 in Quebec.
  QPIP is $76,500 × 0.526% = $402.39. T4127, ESDC and the official Revenu Québec historical table publish these.

## Source access

All source URLs are retained with the cached evidence. Revenu Québec blocked the direct QPIP table download;
the exact 2019 row is transparently transcribed from the official page retrieved through the web reader, with
no claimed original-byte hash. Other municipal manual extracts and archival mirrors are described in the source index.
The GST reference combines regular amounts published by Finance with unchanged thresholds/rates in CRA's
2019–2020 supplemental worksheet. Its extraordinary doubled-payment amounts are not used.

## Invariant boundaries and source corrections

The independently reproduced MSP sweep case has a couple with one child, earnings $0/$32,000 increasing to
$0/$32,500. Family net income rises $31,957.25 to $32,456.50; subtracting spouse and child deductions gives
adjusted $25,957.25 to $26,456.50. Crossing the statutory upper-inclusive $26,000 band raises the two-adult
premium from $0 to $276. Disposable income falls $15.79064; excluding that exact premium jump it rises $260.20936.
The year-specific exception independently checks every family's adjusted income and band amount, requires an
actual upward band crossing, and requires disposable income excluding the verified premium to remain nondecreasing.
It does not admit unrelated clawback declines. Every prior-year overlap predicate remains unchanged.

The unrelated-adult swap case has incomes $0 and $605 employment plus $67,215 capital gains, with six children.
The second adult's net income is $34,212.50 and attracts $336 MSP when the children belong to the first family.
After swapping incomes, six $3,000 child deductions reduce adjusted income to $16,212.50 and the premium is zero.
Person payroll remains $9.801 in either order. The test independently verifies each household premium and retains
swap symmetry for payroll after removing only that verified amount. All years without this optional program
still have zero adjustment and retain the same payroll equality.

Published reference checks caught a collection error before the 2019 snapshot was captured: Quebec's eligible
dividend credit was initially 11.70%, but its official historical table explicitly publishes 11.78% for 2019.
The corrected top combined eligible-dividend rate is 39.99718446%, rounded to 40.00% by Richter's July 2019 card.
For B.C. noneligible dividends, official rates give 44.631385%, rounded to 44.63% by Deloitte. Older TaxTips
entries print 39.99% and 44.64% respectively; references use the corroborated publications without widening tolerance.

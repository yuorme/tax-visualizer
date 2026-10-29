# 2026 independent audit (October 2026)

Before the refactor, a separate agent that had not seen the calculator's code rebuilt the 2026 calculations from
official sources (CRA rate pages, T4127, T4114 and provincial sites) and computed four test households:

- S1: single, $75,000 employment income
- S2: couple, $70,000 + $50,000, two children (one under 6)
- S3: single parent, $40,000, two children under 6
- S4: Ontario, $150,000 employment + $20,000 eligible dividends

`calc.py` is that independent calculator; `results.txt` is its output.

## Findings

- Federal and provincial income tax matched the calculator to the dollar in every province, after fixes made
  during the audit: the federal foreign tax credit limit, Nova Scotia's child benefit bands, missing
  provincial child benefits, Manitoba's frozen brackets and the Ontario child reduction amount.
- Ontario surtax: the independent calculator applies it after the dividend tax credit; the calculator applies it
  before, as on form ON428. The calculator's order reproduces Ontario's published top dividend rates (39.34%
  eligible, 47.74% non-eligible), which are now reference tests.
- Child benefit differences came from the independent calculator using gross rather than net family income.
- Refundable credits were added after this audit and were checked by hand, not independently. They are a good
  candidate for the next independent check.

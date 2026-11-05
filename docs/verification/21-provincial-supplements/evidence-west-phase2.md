# Western evidence closure for #21 phase 2

Checked 2026-11-05. Research only: no engine, data or golden expectations have been edited in this pass.
The scope uses current income as the historical-income proxy and adds no new household inputs.

## Ontario income definition and 75+ tables

The ordinary e-Laws HTML response is an empty JavaScript shell. The government provides a usable
[official Word download](sources/phase2-on-act.txt), extracted with macOS `textutil` and hashed before
conversion. Its consolidation includes the 2023 amendment and February 2025 change notice.

Section 1 defines income for the base calendar year by **Old Age Security Act section 2**. This closes the
income-definition gap: use the sourced GIS income definition, including its supported earnings exclusions,
rather than raw private pension income or line 23600. Section 3(1.1)(b) makes full-pension increments after
June 2024 use section 2(4)'s monthly-benefit calculation. Section 2(4.1)(b) sets the reduction at **$0.50**
for July 2024 onward. The ordinary single bands are $24 annual income, both-pensioner family bands $48.
Mixed-age/no-OAS-partner categories have a pension-based offset. Preserve the published bands and actual
age category rather than extrapolating the ordinary single cutoff.

All thirty-two **75+ English quarterly CSVs for 2025 and 2026** have now been cached, using `phase2-on75-*`
names. The original government data-catalogue resources are identified in each header; these complement
the phase-1 age-65–74 cache. An initial HTTP 502 during one resource fetch succeeded on retry.
Single and both-pensioner positive-payment bands match their age-65–74 counterparts. **Mixed-age bands do not**:
the age-75 OAS increase affects the offset. For an older pensioner with an Allowance-recipient spouse:

| Quarter | Maximum/month | 75+ first reduced income band | 75+ first zero income band |
|---|---:|---:|---:|
| 2025 Q1 | $87 | $9,696 | $18,000 |
| 2025 Q2 | $87 | $9,696 | $18,000 |
| 2025 Q3 | $90 | $9,792 | $18,384 |
| 2025 Q4 | $90 | $9,840 | $18,432 |
| 2026 Q1 | $90 | $9,888 | $18,480 |
| 2026 Q2 | $90 | $9,888 | $18,480 |
| 2026 Q3 | $92 | $9,984 | $18,768 |
| 2026 Q4 | $92 | $10,128 | $18,912 |

For example, [2025 Q1's 75+ table](sources/phase2-on75-jan-1-to-mar-31-2025-married-spouse.txt) pays $87
through $9,695.99 and $86.50 at $9,696–$9,743.99. The age-65–74 first reduction is instead $8,784.
In [2026 Q4](sources/phase2-on75-oct-1-to-dec-31-2026-married-spouse-en.txt), the 75+ last positive band
starts at $18,864 with $0.50, followed by zero at $18,912. Compare every encoded band/offset against the
government rows, including one-pensioner families and the birthday transition, before final golden coverage.

The published maxima remain $87/$90/$92 for the documented periods. Six months at each successive maximum
give the previously derived single calendar totals $1,062 in 2025 and $1,092 in 2026, assuming full-year
eligibility. Those maximum examples do not establish mixed-age nonmaximum totals or first-year start timing.

## Alberta dated income and live administrative examples

The [January 2025 government booklet](sources/phase2-ab-booklet-2025.txt) corroborates the prior-income
benefit year, per-adult negative-income floor before combining spouses, ordinary household maximums and
OAS eligibility. The dated rate sheets already cached remain the source for each effective-period rate.
The booklet does not replace the program-specific deductions listed in the current eligibility guidance.

The [phase-2 territorial/Alberta evidence](evidence-territories-phase2.md) records synthetic requests and
responses from the official Alberta benefit estimator. These close the conflicting rate and cash-allocation
questions with independent administrative outputs:

- Single ordinary residence, January 2026, program income $10,000: **$199.50/month**, consistent with
  `(3,946 − .1552 × 10,000) / 12`. The July sheet's retrospective .1522 would instead give $202.
- Two eligible seniors, July 2026, zero program income: **$246.59 per adult per month**. The one-eligible-senior
  couple receives **$493.17** to that applicant. Preserve cash recipients separately from tax attribution.
- Each adult in a qualifying two-senior couple can receive the $10 monthly minimum. The printed total-income
  guidelines and program-income thresholds do not act as exact hard cutoffs in the tested calculator cases.

The exact intermediate calculation precision remains unverified; the oracle's tightly spaced near-zero
examples must not be replaced by a guessed ordinary nearest-cent rule. If the final implementation uses a
derived precision convention, mark it `estimated: true`, document the derivation, and test the official
calculator examples independently. The evidence note also distinguishes historic government reporting
confirmation from the remaining lack of a current Alberta page explicitly naming ASB's T5007 treatment.

## British Columbia reporting correction

The [government's February 2026 T5007 FAQ for 2025 payments](sources/bc-tax-slip.txt), question 7, explicitly
says annual assistance of $500 or less does not produce a slip and is not required on the recipient's return.
The [CRA issuer guide](sources/federal-tax-slips.txt), chapter 4, exempts a series totalling $500 or less
from T5007 reporting. Apply the full amount above the applicable exception, not only the excess over $500.
Keep the cash payment even where reportable income is zero. Do not infer the exception's household/per-recipient
aggregation from the spouse who ultimately reports the amount: determine the recipient/program amount first,
then apply the separate higher-income-spouse reporting rule.

This corrects the phase-1 territorial appendix's assertion that the issuance threshold never creates a
reporting exception. It does not eliminate the need to verify program-specific reporting, or authorize
ignoring non-cash benefits when modelling an actual T5007. Bus-pass and other assistance inputs remain out
of this household model. Provincial amounts stay outside GIS-test income under the OAS Act definition.

# Other income: additive golden evidence

PR #90 separates employment (`ord`) from fully taxable other income (`oth`). Other income enters cash,
net income and income-tested programs, but does not create employee payroll deductions, employment credits,
working income, or the UI's estimated RRSP room. The combined other-income field cannot distinguish rental
income that could create actual RRSP room. Verified deductions and childcare earnings remain explicit inputs.

## Baseline preservation

The shared scenario file, adapter, snapshot function, and every existing year fixture remain unchanged from
the prerequisite PR #125. Its separately audited carbon activation is described in
[the carbon baseline audit](carbon-activation-audit.md); this PR makes no further changes to those fixtures.
`tests/golden/other-income-original.json` moves only PR #90's ten original appended scenarios (148–157)
and their 2025/2026 results from commit `9ab632ac59553bef0c57d5912d82b9c8b94c362c`. Their inputs and all
260 province results are preserved without recalculation. The dedicated runner uses the unchanged snapshot
and adapter, with their original pre-carbon rule shape (carbon programs removed, as in the existing history
specimens). Activated carbon is tested separately below. These inherited snapshots are regression evidence,
not independent tax verification.

Every original specimen also runs with active carbon against `tests/golden/other-income-carbon.json`.
Its 260 case/province entries are calculated independently by
[the raw-data arithmetic script](other-income-carbon.mjs), which imports no engine, fuel or carbon functions.
It applies the published payment parameters, calendar-day gasoline rates and fixed sourced heating estimates
to the original inputs, including each $100 marginal counterfactual and the no-investment counterfactual.
The paired runner checks charges, named payments, refunds, benefits, net/gross tax, both average rates,
investment tax and all six marginal rates; all unrelated snapshot fields must stay identical. Thus freezing
the old no-carbon expectations does not exclude current carbon behavior from regression coverage.

`tests/golden/features/other-income.json` adds independently calculated literal expectations. No capture tool
was used. Its selected output paths cover nested details omitted by the legacy snapshot, including the
other-income marginal rate and childcare income bases.

## Independent arithmetic

All amounts below are annual. No spending, property or gasoline tax is added. Unless specified, refundable
credits are disabled. Historical carbon heating estimates are included where activated by PR #125.
Rates, amounts and provenance are in the respective `data/years/<year>/` files.

- **Alberta, $40,000 other income:** payroll and estimated RRSP room are zero. Federal tax is
  `(40000 − BPA) × first rate`; provincial tax is `(40000 − AB BPA) × first rate`. The federal BPA/rate and
  provincial BPA/rate pairs are 2022: `14398/.15`, `19814/.10`; 2025: `16129/.145`, `22323/.08`;
  2026: `16452/.14`, `22769/.08`. The respective income taxes are $5,858.90, $4,875.455 and $4,675.20.
  Adding fixed carbon heating estimates of $246.14 (2022) and $99.45 (2025) gives total taxes $6,105.04,
  $4,974.905 and $4,675.20; the carbon amounts are also asserted separately.
  The next $100 stays in both first brackets: marginal rates .25, .225 and .22. Other income is not included
  in the investment-income subtotal or its counterfactual tax. The 2022 case exercises an actual historical
  year, with its own data, rather than a modern-year rule override.
- **Ontario, itemized deductions:** $50,000 other income minus $8,000 RRSP, $13,000 FHSA and $1,000 other
  deductions leaves $28,000. These are verified claims, not newly generated room. With the BPA switch off,
  federal tax is $4,060 (2025) or $3,920 (2026); Ontario tax is `28000 × .0505 = 1414`; its Health Premium
  is $300. Tax plus premium is $5,774/$5,634 and marginal other-income rate .1955/.1905. The fixed $58.86
  carbon heating estimate brings 2025 total tax to $5,832.86. Employment credits and LIFT
  cannot arise from this income. Cash remains $50,000; each deduction is subtracted exactly once.
- **Ontario CARE with deductions:** $20,000 employment plus $30,000 other income, $1,000 RRSP and $1,000
  FHSA. Enhanced CPP is `(20000 − 3500) × .01 = 165`. Income before childcare is therefore $47,835.
  The explicit eligible earnings are $20,000, so their two-thirds ceiling exceeds the single age-four
  child's $8,000 annual expense/age limit. The $8,000 claim leaves federal net income $39,835. CARE adds
  that claim back, selecting the $45,000–$50,000 band: `8000 × .55 = 4400`. Excluding other income from
  that add-back base would select the wrong rate. Both 2025 and 2026 are covered.
- **Quebec childcare:** the same employment/other income without RRSP/FHSA claims has federal income
  before childcare $49,835 and after childcare $41,835. Quebec does not subtract the federal childcare
  claim; its worker deduction is `20000 × .06 = 1200`, leaving provincial family income $48,635.
  The attested $8,000 Quebec-eligible expenses yield `8000 × .71 = 5680` in 2025 and `8000 × .72 = 5760`
  in 2026. The credit's rate uses that provincial base, not federal net income or employment alone.
- **No eligible earnings:** $50,000 other income and explicit eligible earnings of zero permits no ordinary
  childcare deduction. This case intentionally represents income such as interest, rather than assuming all
  categories in this aggregate field are ineligible under T778.
- **Claimant selection:** spouses earn $40,000 employment plus $20,000 other income, and $50,000 employment.
  Their enhanced CPP deductions are $365/$465, so pre-childcare net incomes are $59,635/$49,535. The second
  spouse claims $8,000, leaving family income $101,170. This catches ordering based on employment alone.
- **Alberta 2023 working-component minimum:** the expanded property-test sample exposed this precise input:
  $4,132 employment, $40,017 other income, $2,411 capital gains and $574 foreign dividends, with two versus
  three children (two under six). Net income is `4132 + 40017 + 2411/2 + 574 − 6.32 = 45922.18`.
  The base component is zero for both child counts. Working phase-in is `(4132 − 2760) × .15 = 205.8`.
  Income above the working threshold is `45922.18 − 43460 = 2462.18`. The two-child component is
  `205.8 − .0649 × 2462.18 = 46.004518`; the three-child component before its minimum is
  `205.8 − .0834 × 2462.18 = .454188`, raised to $10 by the statutory positive-benefit minimum.
  Fixed expectations lock $46.0045 and $10. The existing narrow invariant guard now verifies each amount
  including its floor; it still requires zero base components and uncapped positive phase-in. Every original
  seeded household is tested alongside its other-income extension. No engine benefit formula was changed.
- **BC 2025 carbon income test:** a single adult with $40,000 other income receives the two $126 climate
  action credit payments ($252) and $533 GST/HST credit, for a $785 refund. At $60,000 other income,
  each carbon payment is `126 − .005 × (60000 − 41071) = 31.355`, totalling $62.71; GST/HST is exhausted.
  These cases fix the complete credit arrays, zero employee payroll, zero gasoline and the sourced $48 heating
  estimate. Thus the current carbon rebate is tested against other income, alongside the frozen old specimens.

The browser integration also checks childcare defaults at employment $6,000 plus other income $3,000:
eligible earnings $9,000 yield a $6,000 claim. A $3,000 override stays fixed when other income rises, yielding
$2,000; a cleared override stays incomplete and explicit zero stays zero. Disabling the override resumes
following both income fields. Reload preserves these choices. RRSP estimates remain employment-only.

## Inflation comparison integration

The history branch (#125) scales all monetary inputs, including other income. Missing `oth` stays missing;
an explicit zero stays zero. This avoids turning legacy saved inputs into `NaN` while preserving their shape.
`tests/golden/features/history-other-income.json` contains four independent synthetic examples, separate from
every existing history fixture. Their tax system is deliberately 10% on the first $50,000 and 20% above it,
zero provincial income tax, 1% property tax and 5% sales tax, with no benefits or carbon programs. CPI 50/100
means the older year's money inputs halve and its tax is doubled back to base-year dollars. Annual caps stay
fixed. Inputs are $100,000 other income, $200,000 home value and $1,000 monthly spending:

| Case | Older-year tax in base dollars | Nominal/base-year tax |
| --- | --- | --- |
| Other income | `(5000 + 1000 + 300) × 2 = 12600` | `15000 + 2000 + 600 = 17600` |
| RRSP 5000, FHSA 12000, other deductions 3000 | `(4000 + 1000 + 300) × 2 = 10600` | `11000 + 2600 = 13600` |
| Childcare expenses 12000, eligible earnings 20000 | `(4400 + 1000 + 300) × 2 = 11400` | `13400 + 2600 = 16000` |
| Same expenses, explicit zero eligible earnings | `12600` | `17600` |

In the childcare case, the older-year $6,000 expenses are below both the unchanged $8,000 child limit and
two-thirds of scaled $10,000 eligible earnings. Nominally the $8,000 child limit binds. Other income never
manufactures employee payroll. All displayed incomes remain $100,000; 2026 is omitted in real mode because
the synthetic CPI contains no 2026 observation. Browser assertions separately enter $12,000 other income
alongside the default $75,000 employment and verify $87,000 income in every real and nominal table row.

## Source trail and limits

The existing cached primary sources support the interactions above:

- `2025/sources/t778-childcare.txt`: ordinary lower-net-income claimant, annual child limits, explicit
  eligible-earned-income categories and two-thirds ceiling.
- `2025/sources/ontario-care.txt`: raw line 23600 plus line 21400 before the zero floor, and the 55% band.
- `2026/sources/ontario-care-legislation.txt`: continuing CARE parameters.
- `2025/sources/quebec-childcare-schedule.txt`, `2026/sources/quebec-childcare-parameters.txt`, and
  `2026/sources/quebec-family-income.txt`: Quebec expense eligibility, income bands and family income.
- The federal and Alberta/Ontario YAML `sources` lists identify official rate, BPA, deduction and premium
  references; historical 2022 source extracts are cached in `2022/sources/`.
- `2023/sources/provincial-ab-act.txt` and the Alberta 2023 YAML record the child-count-specific working reduction
  and positive-benefit minimum used in the invariant's two fixed examples.
- [Carbon reference](carbon-reference.md) and [heating derivation](carbon-heating.md) provide the existing
  independently verified calendar payments and heating estimates used by the activated-carbon cases.

The tests deliberately do not claim full-return correctness. Quebec's Health Services Fund contribution is
still unmodelled (#91), as are pension credits/splitting and separate rental-income RRSP-room treatment.
The previously identified per-program claimant issue (#92) is outside this change.

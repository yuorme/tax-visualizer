# Other income: additive golden evidence

PR #90 separates employment (`ord`) from fully taxable other income (`oth`). Other income enters cash,
net income and income-tested programs, but does not create employee payroll deductions, employment credits,
working income, or the UI's estimated RRSP room. The combined other-income field cannot distinguish rental
income that could create actual RRSP room. Verified deductions and childcare earnings remain explicit inputs.

## Baseline preservation

The shared scenario file, adapter, snapshot function, and every existing year fixture remain unchanged from
main. `tests/golden/other-income-original.json` moves only PR #90's ten original appended scenarios (148–157)
and their 2025/2026 results from commit `9ab632ac59553bef0c57d5912d82b9c8b94c362c`. Their inputs and all
260 province results are preserved without recalculation. The dedicated runner uses the unchanged snapshot
and adapter. These inherited snapshots are regression evidence, not independent tax verification.

`tests/golden/features/other-income.json` adds independently calculated literal expectations. No capture tool
was used. Its selected output paths cover nested details omitted by the legacy snapshot, including the
other-income marginal rate and childcare income bases.

## Independent arithmetic

All amounts below are annual. No spending, property or fuel tax is added. Unless specified, refundable credits
are disabled. Rates, amounts and provenance are in the respective `data/years/<year>/` files.

- **Alberta, $40,000 other income:** payroll and estimated RRSP room are zero. Federal tax is
  `(40000 − BPA) × first rate`; provincial tax is `(40000 − AB BPA) × first rate`. The federal BPA/rate and
  provincial BPA/rate pairs are 2022: `14398/.15`, `19814/.10`; 2025: `16129/.145`, `22323/.08`;
  2026: `16452/.14`, `22769/.08`. The respective total taxes are $5,858.90, $4,875.455 and $4,675.20.
  The next $100 stays in both first brackets: marginal rates .25, .225 and .22. Other income is not included
  in the investment-income subtotal or its counterfactual tax. The 2022 case exercises an actual historical
  year, with its own data, rather than a modern-year rule override.
- **Ontario, itemized deductions:** $50,000 other income minus $8,000 RRSP, $13,000 FHSA and $1,000 other
  deductions leaves $28,000. These are verified claims, not newly generated room. With the BPA switch off,
  federal tax is $4,060 (2025) or $3,920 (2026); Ontario tax is `28000 × .0505 = 1414`; its Health Premium
  is $300. Total is $5,774/$5,634 and marginal other-income rate .1955/.1905. Employment credits and LIFT
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

The browser integration also checks childcare defaults at employment $6,000 plus other income $3,000:
eligible earnings $9,000 yield a $6,000 claim. A $3,000 override stays fixed when other income rises, yielding
$2,000; a cleared override stays incomplete and explicit zero stays zero. Disabling the override resumes
following both income fields. Reload preserves these choices. RRSP estimates remain employment-only.

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
- `2023/sources/rule-ab-act.txt` and the Alberta 2023 YAML record the child-count-specific working reduction
  and positive-benefit minimum used in the invariant's two fixed examples.

The tests deliberately do not claim full-return correctness. Quebec's Health Services Fund contribution is
still unmodelled (#91), as are pension credits/splitting and separate rental-income RRSP-room treatment.
The previously identified per-program claimant issue (#92) is outside this change.

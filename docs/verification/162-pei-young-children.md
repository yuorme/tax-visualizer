# Issue 162: PEI amount for young children

## Size check, before implementation

PE428 line 58230 allows a base of $100 per eligible month, up to $1,200 per child annually.
The 2025 non-refundable credit rate is 9.5%, making a full-year child worth up to $114 in tax savings.
For a couple with $30,000 of other income each and one eligible child, both adults have enough tax capacity,
the spouse amounts are zero and the family reduction is exhausted. Before the correction, 2025 provincial tax
is `2 × (30,000 - 14,650) × .095 = 2,916.50`; after it is `2,916.50 - 114 = 2,802.50`.
The effective-rate change is `114 / 60,000 × 100 = 0.19` percentage points, exceeding the 0.1-point scope rule.
For 2026 the corresponding provincial totals are $2,850 and $2,736, again a 0.19-point change.
The change also moves PE's gap to an unaffected province by the same amount. No new household input is needed.

## Sources and interpretation

Existing cached official sources suffice; no extracts were replaced:

- [2025 CRA PE guide][guide], line 58230:
  [cached text](2025/sources/pe-guide-2025.txt).
- [2025 PE428][form], line 58230 and the non-refundable credit conversion:
  [cached text](138-senior-credit-rules/sources/pe-428-2025.txt).
- [2025 PE(S2)][transfer], transferable age, pension, disability and tuition amounts:
  [cached text](138-senior-credit-rules/sources/pe-s2-2025.txt).
- [2026 TD1PE][td1], checked but not evidence of a published young-child amount or 2026 filing rule:
  [cached text](138-senior-credit-rules/sources/td1pe-2026.txt).

[guide]: https://www.canada.ca/en/revenue-agency/services/forms-publications/tax-packages-years/general-income-tax-benefit-package/prince-edward-island/5002-pc.html
[form]: https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5002-c/5002-c-25e.pdf
[transfer]: https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5002-s2/5002-s2-25e.pdf
[td1]: https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/td1pe/td1pe-26e.pdf

The lower-net-income spouse must claim, including at zero income. Equal-income spouses may choose the claimant.
The young-child base is absent from PE(S2), so unused child amounts cannot transfer. This is separate from the
existing transferable family low-income reduction. The new data opts into #92's existing claimant/election
mechanism; no engine formula changes. Tied claims minimize final household tax after dividend and foreign credits.
Child credits use remaining non-refundable capacity and apply before dividend credits, family reductions and FTC.

The 2026 amount and claimant rules are provisional continuations of 2025, each marked `estimated: true`.
The schema gains an optional estimate flag on `childAmount`; existing other-year/program objects are unchanged.

As with the existing NS annual model, an entered under-six child represents a full eligible year. The statutory
rule instead counts months when the child lived with the claimant and was under six on the first day, with no
competing claim or children's special allowance. Births, sixth birthdays and residence/custody changes are not
prorated. The fixture's age 0/5/6 cases lock this annual approximation, not a month-by-month filing entitlement.
The page notes disclose it, the claimant rule, non-transferability and the provisional continuation.

## Historical coverage gap

The credit predates 2025: cached PE428 forms already list it in
[2019](2019/sources/provincial-5002-c.txt), [2020](2020/sources/provincial-5002-c.txt),
[2021](2021/sources/provincial-5002-c.txt), [2022](2022/sources/provincial-5002-c.txt),
[2023](2023/sources/provincial-5002-c.txt) and [2024](2024/sources/provincial-5002-c.txt).

Contrary to the initial assumption, **all six historical PE YAML files already contain the $1,200 child amount**.
Their gap is claimant coverage: they omit `claimants.childAmount` and use the legacy supporting-parent allocation.
Thus 2025 is a claimant-coverage step, not the introduction of a historically absent credit. Earlier amounts,
allocation rules and golden results remain untouched, as requested. The user will file the history follow-up.

## Independent cases and rule-path map

The 56 cases in `tests/golden/features/pei-young-children.json` have both 2025 and 2026 versions.
Their values were calculated with the independent PE return worksheet in `tests/claimants-forms.ts`, which imports
neither engine functions nor runtime data. The two PE child constants now read 1200 rather than 0; other constants,
assertions and tolerances are preserved. The new runner checks frozen values and independent provincial totals,
reverses two-adult households, and tests plausible wrong claimant and transfer settings.

| Rule path | Golden ID suffixes (prefixed `2025-` and `2026-`) |
| --- | --- |
| Amount, conversion, full capacity, material size | `size-check`, `lower-income` |
| Zero-income claimant, no child transfer, implicit spouse | `zero-income-no-transfer`, `implicit-zero-spouse` |
| Non-refundable floor and full-credit boundary | `capacity--1`, `capacity-0`, `capacity-1`, `capacity-600` |
| Just below, at and above full usable credit | `capacity-1199`, `capacity-1200`, `capacity-1201` |
| Net income after deductions and enhanced CPP | `net-not-gross`, `enhanced-cpp-net` |
| Dividend gross-up determines claimant | `dividend-gross-up` |
| Equal-net-income election after dividend/foreign credits | `tie-dividends`, `tie-foreign-tax` |
| Single parent and eligible dependant coexist | `single-parent`, `single-parent-low-reduction` |
| Separate family-reduction election/transfer | `family-reduction` |
| Child amount before PE reduction and FTC | `foreign-tax-order` |
| Count every young child, exclude older/no children | `multiple-young`, `no-young`, `no-children` |
| Existing basic-personal-amount switch behavior | `bpa-off` |
| Annual child count from explicit childcare ages | `age-0`, `age-5`, `age-6` |
| Verified childcare claim changes lower-net-income claimant | `childcare-net-claimant` |

For capacity cases, the lower spouse's income is BPA plus the suffix amount; the higher spouse has $60,000.
The usable child credit is `.095 × clamp(suffix, 0, 1200)`: $0, $0.095, $57, $113.905 or $114 at the boundaries.
The zero-income spouse uses $0 and transfers $0, even though the higher spouse could use the credit.
For `enhanced-cpp-net`, $30,000 employment becomes $29,735 after $265 enhanced CPP, below $29,900 other income.
For `net-not-gross`, $40,000 less $12,000 RRSP is below $30,000. For `dividend-gross-up`, $22,000 eligible dividends
becomes $30,360, above $30,000. In `tie-dividends`, $20,000 eligible dividends and $27,600 other income tie;
the dividend recipient already has no final PE tax, so the other adult must receive the child amount.
In `childcare-net-claimant`, a verified $4,000 line 21400 claim reduces the $32,000 adult below the $30,000 adult.
For these fixtures only, the independent worksheet receives that known claim as a deduction and receives the
independently counted children. It does not derive expected claims from the childcare engine.

## Existing golden reconciliation

There was no blanket recapture. For each PE scenario, removing only the new child amount and its claimant setting
first reproduced the existing stored snapshot exactly. The corrected return was then checked against the independent
PE worksheet for the original household, six next-$100 income variants and the zero-investment counterfactual.
All 2,528 PE return variants agreed on net income, claimed child base, applied child credit, low-income reduction,
foreign credit and final provincial tax. The existing #92 audit additionally checks all six provinces.

Only changed PE leaf cells were replaced. Inputs, non-PE results, 2019–2024 goldens, assertion logic and tolerances
remain identical. The other-income fixture retains its pre-carbon/pre-2025-fuel context.

| Fixture | Year | Changed PE cells |
| --- | --- | ---: |
| `tests/golden/2025.json` | 2025 | 442 |
| `tests/golden/2026.json` | 2026 | 440 |
| `tests/golden/other-income-original.json` | 2025 | 36 |
| `tests/golden/other-income-original.json` | 2026 | 36 |

Across these, 954 cells in 118 scenario/year records change. Every original and corrected value, keyed by fixture,
year, scenario ID and PE-relative field path, is in
[the exact reconciliation](162-pei-young-children-golden-changes.json). The PR also lists each changed value.
Some records change only `kidAmt`, `pKid` and `lowRed` because a child credit displaces an existing reduction.
Usable child credits change provincial totals and derived effective rates. Changes in marginal rates and `invTax`
come from recalculating legal claimants, capacity and foreign-credit limits in each counterfactual; the independent
form audit covers those counterfactuals too. Federal tax, payroll, benefits and every other province remain unchanged.

The only existing non-golden test-helper values changed are PE `child: 0` to `child: 1200` for 2025 and 2026;
the helper's exclusion comment now includes PE. No existing assertion was deleted, skipped or loosened.

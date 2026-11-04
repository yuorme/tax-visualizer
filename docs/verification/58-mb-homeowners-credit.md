# Manitoba Homeowners Affordability Tax Credit, issue #58

## Finding and official evidence

The existing 2026 `homeownerMax: 1600` is correct and remains unchanged ($1,600 before and after).
Manitoba Finance's Information Bulletin 126, issued March 2026 for Budget 2026, states on PDF page 1
that the annual maximum is $1,600 for tax year 2026. The $100 increase to $1,700 is effective for tax
year 2027. The budget's publication year must not be substituted for the measure's effective tax year.
The same page confirms the existing $625 maximum renters credit for 2026.

- [Official bulletin](https://www.gov.mb.ca/finance/taxation/pubs/bulletins/2026budget.pdf)
- [Cached text, PDF page 1](2026/sources/issue-58-mb-budget-2026.txt)
- [Source index with retrieval date and original-file SHA-256](2026/sources/INDEX.md)

The YAML now cites this bulletin and marks the homeowner maximum as a fixed, non-indexed 2026 amount,
with a comment identifying 2027 as the start of the $1,700 maximum. No amounts, formulas, eligibility
rules or estimated flags change. The assessed-value reduction also described in the bulletin starts
in 2027 and is outside this issue's 2026 verification.

## Golden coverage and before/after values

No rule path changes, so no new rule-path golden is required. Existing `tests/golden/2026.json`
already covers the retained data selection:

| Retained path | Existing golden case | Before | After |
| --- | --- | ---: | ---: |
| `mb-affordability-credits`, homeowner maximum | Scenario 25, MB, $600,000 home | $1,600 | $1,600 |
| `mb-affordability-credits`, renter branch | Scenarios 3 and 26, MB | $625 | $625 |
| No property or rent credit | Scenario 0, MB | No affordability credit | No affordability credit |

The homeowner expectation is checked independently against the bulletin's 2026 maximum. A temporary
in-memory negative control replacing only `homeownerMax` with $1,700 produced a $1,700 credit in
scenario 25, failing equality with its existing $1,600 golden expectation. This confirms the locked
case rejects the incorrect tax-year reading at issue.

A fresh capture was written outside the repository and compared structurally with the locked 2026
fixture: all 148 households × 13 provinces match. The capture and fixture differ only in a trailing
newline. No existing golden file or cell was changed, and no other province's baselines were rewritten.
There are no changed-golden before/after values to reconcile.

## Year-diff output

Command: `fnm exec --using=26 npm run year-diff -- 2026 2025`.
The report summary and the two relevant changed-value rows are reproduced below. These compare
2025 with 2026, rather than the unchanged before/after state of this issue.

```text
226 values changed from 2025 to 2026 (12 over 15%), 125 amounts suspiciously unchanged,
20 added, 23 removed, 4 replaced. 19 unchanged values opted out.
```

| File | Field | 2025 | 2026 | Change |
| --- | --- | ---: | ---: | ---: |
| MB | `credits[mb-affordability-credits].params.homeownerMax` | 1500 | 1600 | +6.7% |
| MB | `credits[mb-affordability-credits].params.renter` | 575 | 625 | +8.7% |

The homeowner amount is a legislated year-specific change from 2025, rather than automatic indexation.

## Validation

`npm ci` and `npm run format` succeeded under Node 26. `npm run check` passed: lint, typecheck,
1,835 tests (zero failures or skips), build, and browser smoke coverage of 43 pages, 261 states and
40 contrast scans at desktop, 430 px and 375 px in light and dark modes.

The first full run passed all 1,835 tests but timed out waiting for `#tip` in
`tests/e2e/qc-health-fund.mjs:97`. With no application or test changes, the full command was rerun
and passed, including the Quebec tooltip check. No retry workaround or assertion change was added.

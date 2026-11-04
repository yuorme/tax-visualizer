# Self-employment engine, issue 14

This branch implements ordinary net business profit for **2025 and 2026**, in all 13 provinces and territories.
It is the engine half of #14; the stacked UI branch supplies controls, saved state and the versioned URL codec.
No existing golden fixture is changed. Omitted income preserves the previous results in every installed year.

## Person input contract

```ts
const person: Person = {
  ...blank(30000),             // ord remains employment income
  selfEmployment: 45000,       // annual business profit AFTER expenses, BEFORE personal payroll deductions
};
```

- `selfEmployment?: number` is per adult, finite and nonnegative. It is not gross revenue, dividends from
  a corporation, or a second copy of the amount in `ord`. Negative profits/losses are rejected.
- Omit the field for legacy scenarios. Even explicit zero requests the new year coverage: data without
  `federal.payroll.selfEmployment` throws `UnsupportedSelfEmploymentError`, including its `year`.
  The error is exported from the engine entry point. Invalid values throw `RangeError`.
- All business and employment is assumed to be in the province being compared. Multi-establishment
  allocation, cross-border activity, interprovincial CPP/QPP transfers, tax-exempt business income,
  family-type resources and optional EI participation are outside this contract.
- Existing `age`/`birthMonth` still mean year-end age and calendar birthday month. Omit both if unknown.
  Ages through 18 fail explicitly. With no birth information, ordinary full-year contributions apply.
  Retirement pensions remain separate income; these fields do not create pension benefits.
- Mandatory cessation is verified separately for business income: CPP includes the 70th birthday month
  and prorates annual profit and annual thresholds; QPP includes the entire year turning 72.
- For mixed employment/business CPP, the existing `employeePayroll.cppElection` CPT30 applies to both
  sources, as Schedule 8 Part 1 explicitly says. Business profit is prorated by eligible months; employee
  earnings weights apply only to wages. Prior-year stops/restarts follow the existing CPT30 contract.
- A self-employed-only CPP election cannot use employer delivery dates: passing an employee CPP election
  with positive profit and zero wages throws. Self-employment-only effective-month elections, earlier
  Schedule 8 elections with employment-start history, and separate Schedule U business elections are
  deferred. QPP RR-50 affects wages only; business contributions continue without a separate election.
  The UI must explain this limitation and must not label an employee QPP switch as stopping all QPP.
- `cashOf`, `netOf`, household income, benefit bases, the RRSP shortcut and real-history scaling include
  profit. Childcare still requires explicit eligible `earnedIncome`; the UI should include eligible
  business profit in its default rather than making it other income.
- `payrollOf` retains its five numeric cash fields. `payrollDetailsOf` returns the same `pay` plus
  `selfEmployment` contributions/deductions, also exposed at `PersonResult.breakdown.selfEmployment`.
  Base payroll includes both business shares; only the employee-equivalent base earns a credit.
  The stacked UI must use that breakdown when explaining deductions and credits.
- `compute().breakdown.margSelfEmployment` is available when the active person supplies the field.
  In a CPP jurisdiction it is `null` for a zero-profit, zero-wage person with an employee CPP election because
  that hypothetical business income needs an unsupported self-employed-only election. A retained CPP election
  does not suppress the QPP marginal: `province.system` selects the plan, not the province display code.
  Legacy `margBy` keys stay unchanged.
  History callers must filter unsupported years before calling `historyComparison` and derive ages per row,
  retaining the existing #146 entry-age guard. Nominal and real modes both require supported year data.
- The UI branch must extend the versioned URL codec and saved-state schema without replacing or reinterpreting
  old `ord` values. Inputs already saved as employment cannot be identified as business income automatically.

## Evidence

Cached sources retain official URLs, retrieval dates and hashes. Existing sources were read in place.

| Source under `docs/verification/` | Rule verified |
| --- | --- |
| `2025/sources/self-employed-cpp-pierre.txt` | CRA's published Pierre example: profit 75,000; CPP 8,364.20 (2025), 8,492.90 (2026). |
| `138-senior-credit-rules/sources/federal-s8-2025.txt` | Parts 1–2 and 4–5: CPP months, profit proration, shared ceilings, both shares, base credit and deductions. |
| `2025/sources/qc-federal-s8-2025.txt` | Federal QPP base credit and enhanced/business deduction. |
| `2025/sources/qc-schedule-u-2025.txt` | Part C and Table 1: QPP shared ceiling, business deductions and distinct business election timing. |
| `2025/sources/qc-schedule-r-2025.txt` | Combined 2,000 threshold, shared QPIP ceiling, self-employed rate, line 26 deduction. |
| `2025/sources/qc-schedule-10-self-employment.txt` | Federal QPIP deduction and remaining non-refundable credit; no EI opt-in. |
| `2025/sources/qpip-self-employed-deduction.txt` | CRA line 22300: 43.736% deductible in 2025. |
| `2026/sources/qpip-self-employed-rates.txt` | Published self-employed QPIP rates: 0.878% in 2025, 0.764% in 2026. |
| `2025/sources/qc-schedule-f-2025.txt` | Business income in the HSF base; lines 43/43.1 deduct R26 and U101+103+115 only. |
| `2025/sources/qc-guide-line-446-2025.txt` | TP-22 line 35 multiplies the final HSF contribution for outside-Quebec businesses. |
| `2025/sources/issue-102-schedule6.txt` | Business profit is CWB working income; secondary earner selected using total working income. |
| `2025/sources/qc-work-premium-income.txt` | Schedule P business income, separate work-income phase-in and provincial-net-income reduction. |
| `2025/sources/qc-business-worker-deduction.txt` | Guide line 201: active net business income qualifies for the worker deduction. |
| `2025/sources/issue-106-t4114.txt` | CCB and AB/NB child benefits; working components include self-employment. |
| `138-senior-credit-rules/sources/t4127-2026.txt` | 2025/2026 pension, EI, employee QPIP and federal parameters. |

The guide's line 446 is already cached. A fresh HTML fetch returned HTTP 403; the cached official PDF
provides the same allocation instruction. With business wholly in the compared province the TP-22 multiplier
is 100%. This implementation does not accept a partial allocation or claim multi-province coverage.

2026 payroll rates and ceilings are published. The annual filing formulas continue the verified 2025 forms,
so `selfEmployment.estimated: true` is explicit for 2026. The provisional QPIP deduction fraction is
`(0.764 - 0.430) / 0.764`, rounded to five decimals (0.43717), matching the format of Schedule R/10.
It is derived, not a published 2026 return-form coefficient. Reconcile when those forms are published.
2026 Health Services Fund continuation estimates are unchanged from #91.

## Arithmetic and golden map

For ordinary earnings, calculate both pension shares on the remaining first and second contribution bands
after employment. Only one business base share earns the federal/provincial credit; the other base share
and **both enhanced shares** are deductions. Business income creates no Canada/Yukon employment amount,
Ontario LIFT phase-in, employee EI or NT/NU payroll tax. Quebec's worker deduction does include business profit.
RRSP room remains an illustrative current-income shortcut, not verified contribution room.

QPIP uses the unused annual insurable-income ceiling after wages. Below combined income of 2,000 there is
no business premium; positive-profit cases also refund employee QPIP withholding below that threshold.
The zero-profit legacy path remains unchanged. The deductible share reduces federal and Quebec net income;
only the remaining share earns the federal credit.

Health Services Fund subtracts the business employer-base and enhanced pension deductions plus business
QPIP deduction. It does not subtract employee enhancements, RRSP, FHSA, childcare, the worker deduction or
unclassified deductions. The fund is included once in payroll, never deducted from a benefit income base.

`14-self-employment-audit.py` calculates the new JSON fixture without importing the engine or reading YAML.
It uses published constants and separate form arithmetic. Run it without arguments to verify the committed
fixture; `--write` writes only this new fixture. Tests compare raw results to its four-decimal expectations
within half a last-place unit plus 1e-9, accommodating Python/JavaScript tie rounding without cent-level slack.

All IDs below are in `tests/golden/features/self-employment.json`; ordinary cases cover **both years**.

| Changed path | Golden case suffixes (year and province prefix omitted) |
| --- | --- |
| Both pension shares, all deductions, income tax, published reference | ON/QC `pierre-75000`; 2025 ON also independently checks full personal tax/payroll/total. |
| Exemption and both pension bands | `below-exemption`, `at-exemption`, `above-exemption`, `at-ympe`, `above-ympe`, `at-yampe`, `above-yampe`. |
| Shared exemption and maxima | `mixed-unused-exemption`, `mixed-first-tier`, `mixed-cross-ympe`, `mixed-employee-at-ympe`, `mixed-employee-in-tier2`, `mixed-employee-max`. |
| QPIP threshold, refund, both ceiling paths and deduction/credit | QC `qpip-*` (eight cases per year). |
| HSF deductions, thresholds, plateau and cap | QC `hsf-*` (six cases per year), plus QC mixed/pure business cases. |
| Mandatory retirement months and CPP profit proration | ON `turns-70-june`, `past-70`; QC `turns-72`, `past-72`. |
| Mixed CPT30 and independent QPP business liability | `mixed-cpt30-prorates-profit`, `rr50-does-not-stop-business`. |
| No territorial wage tax / Yukon employment amount on profit | NT/NU/YT `self-not-wages`, `mixed-only-wages-payroll`. |
| CWB phase-in and secondary earner including business | 2025 ON `cwb-phase-in`, `cwb-secondary-business-earner`, `cwb-equal-working-income`. |
| Quebec work premium and distinct federal/provincial bases | 2025 QC `work-premium-phase-in`, `work-premium-phase-out`. |
| AB/NB working-income child benefits | 2025 AB `child-working-component`, NB `child-working-supplement`. |
| Federal benefit and childcare/deduction propagation | 2025 ON `ccb-net-income`, `childcare-and-personal-deductions`. |
| Cash, net income, employer-base deduction, credits, RRSP shortcut | Every case checks the relevant per-person components. |
| Business marginal rate through CPP2 and income tax | 2025 ON `pierre-75000`: 0.3528 at four decimals. |

Targeted tests additionally reject invalid/unsupported inputs, preserve omitted and zero inputs across all
provinces, exercise program-driven year support, and check business marginal rates and real-history scaling.
The existing golden inputs, assertions, expectations and tolerances are untouched.

## PR 192 review and main integration

The marginal guard previously suppressed Quebec's business marginal whenever an employee CPP election was
retained. It now uses the same data-selected plan boundary as payroll validation: `system !== "quebec"`.
The separate `self-employment-marginal.json` fixture adds these cases without rewriting the original 117:

| Case | Expected result |
| --- | --- |
| `2025-qpp-business-marginal-with-cpp-election` | 75,000 profit, no wages, age 66, January birth, CPP stop June 2025: 0.42823757229792. |
| `2025-qpp-zero-business-marginal-with-cpp-election` | Same retirement input, zero profit: 0. |
| `2025-cpp-unsupported-business-counterfactual` | Ontario, zero profit/wages with that CPP election: null remains intentional. |
| `workerDeductionMerge` | 5,000 profit + 40,000 other income: worker deduction 300, line 275 44,569.799896, living-alone credit 232.82525273. |

The marginal calculation is independent Decimal arithmetic in the audit, using the cached 2025 QPP,
Schedule R/10, Schedule F, tax bracket and abatement parameters:

```text
For the next 100 of profit above 75,000:
  QPP2 = 100 × 8% = 8
  QPIP = 100 × 0.878% = 0.878
  deductible QPIP = 0.878 × 43.736% = 0.38400208
  net-income increase = 100 - 8 - 0.38400208 = 91.61599792
  federal increase = (net increase × 20.5% - (0.878 - 0.38400208) × 14.5%) × 83.5%
  provincial increase = net increase × 19% (worker deduction already capped)
  HSF increase = net increase × 1%
  total increase = federal + provincial + HSF + 8 + 0.878 = 42.823757229792
  marginal rate = 42.823757229792%
```

At zero profit, the next 100 remains below QPP/QPIP/HSF and work-benefit thresholds, and personal credits
absorb income tax; the marginal is zero. CPP's positive-profit counterfactual would instead require the
unsupported self-employed-only election, so it has no estimated rate.

Merging main conflicted in the 2025 source index, `payroll.ts` and `personal.ts`. The index retains both
Schedule 10 and Schedule B entries. The code retains main's `workerDeductionOf` helper and calls it from
both personal tax and the living-alone calculation, with this branch's business-inclusive working income.
The integration golden independently verifies that line 275 and the living-alone credit share that deduction.
No golden files conflicted: main's reviewed corrections were retained without recapture, and this branch's
original self-employment fixture remains unchanged.

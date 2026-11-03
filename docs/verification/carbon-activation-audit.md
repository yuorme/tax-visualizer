# Carbon activation baseline audit

Issue #29 explicitly requires historical results to include carbon charges and cash rebates. The source-backed
data change necessarily alters the corresponding total-tax and refundable-credit expectations. Existing inputs,
assertions and tolerances are preserved. No tax brackets, payroll parameters, non-carbon benefits or property
figures change in this activation.

## Evidence and independent reconciliation

The federal/BC amounts and all 63 initial provincial heating estimates were independently recalculated from
the cached official publications by a collector who did not author them; no numeric discrepancy was found.
Regional formulas were separately reviewed in PR128, including 57 independently calculated golden cases.
[Published references](carbon-reference.md), [regional evidence](carbon-regions.md) and the
[heating derivation](carbon-heating.md) record the source arithmetic and estimation limits.

Before any expectation was changed, every annual scenario was recomputed with the new carbon data removed.
Those results exactly reproduced the original snapshots at commit
`e984edbd090696f66c3af3ad589512caedb76d88`. A separate arithmetic implementation then calculated the added
gasoline, heating and payment amounts without importing the carbon or fuel calculation functions.
It reconciled the following identities for every scenario/province pair:

- Gross tax increases by gasoline plus heating.
- Refunds and benefits increase by eligible calendar cash payments; the existing credits switch and 50-cent
  display threshold still apply. Each new named credit is inserted before any separate childcare credit.
- Net tax increases by the charges minus the payments; income-tax-only net total falls by the payments.
- Marginal rates change only by the rebate difference between the existing $100 counterfactual and its base.
- Investment tax changes only by the rebate difference between the original and no-investment counterfactual.
- Income tax, payroll, child benefits, personal breakdowns, property tax, sales tax and household inputs stay exact.

The independent raw arithmetic agrees within $0.00000001 (or that absolute rate difference); reassociated
floating-point sums can straddle a half-0.0001 rounding tie. Existing golden tests still compare their complete
four-decimal snapshots exactly. No golden assertion or tolerance was relaxed.

## Exact affected cases

[The machine-readable audit](carbon-golden-changes.json) records each scenario ID, province, changed field and
its exact `[before, after]` values, plus every affected feature-case ID. The annual affected counts are:

| Year | Changed scenario/province pairs |
|---|---:|
| 2019 | 1,520 |
| 2020 | 1,520 |
| 2021 | 1,520 |
| 2022 | 1,537 |
| 2023 | 1,776 |
| 2024 | 1,716 |
| 2025 | 1,704 |

All 1,184 Quebec scenario pairs across 2019–2026, all 1,924 scenario pairs in 2026, and all other unaffected
fields remain unchanged. Fifteen existing feature cases require only the same documented carbon-related
output changes; their household inputs and unrelated expectations are preserved.

For example, Alberta scenario 0 in 2025 has gross tax $19,104.7545 → $19,267.5137, refundable credits
$0 → $453, and net tax $19,104.7545 → $18,814.5137. Scenario 0's 2019 Alberta rebate is zero at that income;
its net tax changes $20,227.1932 → $20,328.2391 solely from gasoline and the fixed heating estimate.

The published Ontario 2025 renter reference gains a $291 carbon credit ($140 January + $151 final April).
Its original GST/HST $533, CWB $1,633, sales credit $371 and energy/property credit $644 remain unchanged.
The isolated prerequisite tests retain their original no-carbon specimens explicitly, including all original
expectations. Separate tests cover the activated data and carbon UI. The invariant suite now identifies carbon
credit names separately so they cannot overwrite the federal sales-credit line in its inspection map.

## Limits

Heating is a fixed estimate, not a reconstructed bill. Territorial oil proxies, Nunavut's published quarterly
payment assumption, reference-city rural eligibility, constant family composition/current income, and the
exclusion of indirect costs and Quebec cap-and-trade are documented in the linked evidence and page notes.

# #21 phase 2: approved scope and evidence

Checked **2026-11-05**; Codex Sol `gpt-6.1-sol`, `xhigh`. The evidence was committed as `1ecf27a`
before engine/data implementation. The main [verification note](../21-provincial-supplements.md)
contains the final implementation and reconciliation; this file records the scope and evidence closures.

The user authorised independently calculated changes to qualifying 2025/2026 senior feature cases and
then removed the affected-case count cap. There is no outstanding permission gate. Non-senior/pre-2025
baseline changes, unexplained differences, GIS eligibility changes and changes to annual
`tests/golden/<year>.json` remain stop conditions. None is required by the implementation.

## Approved scope

The [issue comment](https://github.com/yuorme/tax-visualizer/issues/21#issuecomment-6670786501) supplies
these constraints:

- Use current income as the prior-income proxy, disclose it, and add no new household inputs.
- Include Manitoba's ordinary refundable personal-credit base only as needed for the senior terms.
- Move Pioneer Utility Grant and assessed service grants to [#216](https://github.com/yuorme/tax-visualizer/issues/216).
  The issue comment calls PUG Manitoba's; the inventoried program is Yukon's. That naming discrepancy does
  not change the decision to exclude it from #21's automatic income-supplement calculation.
- Leave coastal Labrador, survivors and people in care out. Disclosure belongs to the later stacked page
  branch; this PR excludes `src/ui/**`.
- Cover 2025/2026 only. Missing figures require an explicit `estimated: true` derivation or an unsupported
  path. Yukon and mixed junior/OAS Manitoba families retain unsupported paths, documented in the main note.

`docs/SCOPE.md` is outside this dispatch's ownership. The note and PR state the final coverage; the page
branch/orchestrator must reconcile that shared document and the page disclosures.

## Evidence closures

| Area | Closure / remaining uncertainty | Evidence |
|---|---|---|
| Ontario | Act closes GIS-income definition; all 75+ quarterly CSVs collected; mixed offsets differ | [West](evidence-west-phase2.md) |
| Alberta | Calculator resolves Jan 2026 .1552, per-adult minimum and loss floor; precision derived | [AB](evidence-territories-phase2.md) |
| BC | Program-specific $500 income exception sourced; mixed protection derived from tables | [West](evidence-west-phase2.md) |
| SK | Basic-GIS interpretation reconciles administered cutoffs; derived basis labelled estimated | [Review](../21-provincial-supplements.md) |
| Manitoba | Original senior tail restored; junior ceiling conflict and 2026 MB479 ordering labelled | [MB](evidence-mb-phase2.md) |
| Quebec | Actual 2025/2026 forms verified; assistance is not automatically line 295 exempt | [MB](evidence-mb-phase2.md) |
| NB/NS/NL | Prior receipt, mixed NB households, NS refund, NL age/timing and reporting distinguished | [Atlantic](evidence-atlantic-phase2.md) |
| NT | $196 flat amount and positive-federal-benefit boundary verified | [NT](evidence-territories-phase2.md) |
| NU | Dated $300 rate continues as an estimate; authorizing instrument unlocated | [NU](evidence-territories-phase2.md) |
| YT | Modern taper and October rates unavailable; payment omitted | [YT](evidence-territories-phase2.md) |

The federal issuer's $500 information-slip exception does not itself remove income under paragraph
56(1)(u). BC's explicit recipient-income instruction is program-specific. Therefore only BC gets the
modelled income exception; other classified social-assistance programs report the full positive payment.
This distinguishes the conflicting generalisations in earlier research appendices. The final note records
the remaining program-classification estimates separately from the federal reporting rule.

Review round 1 also corrects the OAS recovery treatment: reportable line-14500 assistance is included in
ITA 180.2 adjusted income, with a later taxable-income deduction. It remains outside GIS eligibility and
the reporter comparison. The main note records the primary sources, independent recalculations, child-count
fixes, all six reachable mutation survivors and the final golden reconciliation.

# #21 phase 2: scope, evidence and golden gate

Status as of **2026-11-05**: merged `origin/main` into `feat/21-provincial-supplements`, including #206's
household change, and ran `npm ci` successfully. Engine/data implementation and existing golden edits are
held at the explicit golden gate in the phase-2 coder brief. No golden capture or expectation edit has run.
The source work below is independently useful and remains inside this issue's verification ownership.

**Latest gate:** the user authorised unavoidable independently calculated senior-case expectation updates,
but imposed a stop above about 30 affected cases. A read-only audit already establishes a
[36-case lower bound](golden-impact-gate.md), so engine/data and golden changes remain stopped for that
new count gate. The prior permission question below is preserved as the sequence's evidence, not a request
to repeat permission already granted.

## Approved scope

The [user's issue comment](https://github.com/yuorme/tax-visualizer/issues/21#issuecomment-6670786501) supplies
these implementation constraints:

- Use current income as the prior-income proxy, disclose it, and add no new household inputs.
- Include Manitoba's ordinary refundable personal-credit base only as needed for the senior terms.
- Move Pioneer Utility Grant and assessed service grants to [#216](https://github.com/yuorme/tax-visualizer/issues/216).
  The issue comment calls PUG Manitoba's; the inventoried program is Yukon's. That naming discrepancy does
  not change the decision to keep it outside #21's income-supplement calculation.
- Leave coastal Labrador, survivors and people in care out. Their tooltip disclosure belongs to the later
  stacked page branch; this PR's scope excludes `src/ui/**`.
- Cover 2025 and 2026 only. Missing figures need a documented `estimated: true` derivation or an explicit
  unsupported path, never a fabricated amount.

`docs/SCOPE.md` is outside this dispatch's file ownership. The PR and this verification note must therefore
state the final coverage; the orchestrator/page branch can reconcile the shared scope document and tooltips.

## Evidence gathered before implementation

| Area | Closure / remaining uncertainty | Evidence note |
|---|---|---|
| Ontario | Official Word Act closes GIS-income definition; all 75+ quarter/category CSVs collected, with different mixed-age offsets | [West](evidence-west-phase2.md) |
| Alberta | Official calculator confirms Jan 2026 .1552, separate spouse payments, per-adult minimum, negative-income floor and nonbinding published guidelines; intermediate rounding remains unresolved | [West](evidence-west-phase2.md), [territories/AB](evidence-territories-phase2.md) |
| BC | $500 reporting exception now explicitly sourced; keep payment separate from reportable income | [West](evidence-west-phase2.md) |
| Manitoba | Original amendment restores senior table tail; junior eligibility conflict remains and needs an explicit estimated convention; 2026 MB479 detailed ordering remains provisional | [MB](evidence-mb-phase2.md) |
| Quebec | Existing 2025/2026 assistance forms remain verified; social assistance is not automatically Quebec line 295 deductible | [MB](evidence-mb-phase2.md) |
| NB/NS/NL | NB Act resolves mixed-benefit household restriction; NL legal age/reference-year and small-payment acceleration rules located; reporting/rounding distinctions documented | [Atlantic](evidence-atlantic-phase2.md) |
| NT | $196 flat monthly amount and positive-federal-benefit boundaries verified | [territories/AB](evidence-territories-phase2.md) |
| NU | Dated government reports corroborate $300 before both modelled years; originating legal instrument still missing. A labelled administrative continuation estimate is possible | [territories/AB](evidence-territories-phase2.md) |
| YT | Modern formula and dated October transitions still unavailable; recommend leaving the payment unsupported rather than estimating an unknown taper from maxima | [territories/AB](evidence-territories-phase2.md) |

These are implementation inputs, not a claim that the phase-2 engine has been built or tested.
Other explicit derivations and gaps remain in the linked notes. In particular, issuer slip exceptions,
recipient reporting, federal line 25000 deduction, Quebec treatment and higher-income-spouse attribution
must not be collapsed into one blanket “tax-free” flag.

## Why existing golden changes are unavoidable

The new scope supplies **no new opt-in**. Existing households already opting into OAS/GIS must therefore
receive supported provincial cash supplements; age-based refundable senior credits likewise follow the
existing age and credit settings. Adding an unrequested opt-in solely to preserve old expectations would
not implement that scope. Nor should a cash supplement be arbitrarily disabled by the refundable-credit
switch: #19 cash already applies with that switch off.

One concrete, independently checked example is the locked **`2025-BC-single`** case in
`tests/golden/features/gis-allowance.json`. Its age-70 adult receives OAS and maximum GIS for all twelve
months and has no private income. The source's $99.30 monthly supplement gives **$1,191.60** for the year.
Existing taxable income is $8,791.14 and income tax remains zero after the applicable credits; the $500
reporting exception does not bind. Consequently:

```text
new total = −13,082.82 − 1,191.60 = −14,274.42
new remaining cash = 21,873.96 + 1,191.60 = 23,065.56
new federal net income = 21,921.96 + 1,191.60 = 23,113.56
GIS remains 13,130.82; taxable income remains 8,791.14
```

This is a source-based calculation, not an engine capture. The phase-2 request explicitly says:
“If any do, stop and report which and why before re-capturing.” The golden question was therefore raised
before any engine or expectation edits. The pending decision concerns only unavoidable, independently
verified expectation changes; no permission to weaken assertions, alter unrelated cases or re-capture
the entire suite is inferred.

Known affected fixture: `gis-allowance.json`, beginning with its BC cases. Other existing feature fixtures
containing OAS recipients, low-income Manitoba seniors/junior recipients, Quebec age-70+ credit claims or
GIS-qualified NS/NB/NL households need an actual implementation diff before their changed cases can be
enumerated. The ordinary ageless annual baselines should remain unchanged under the limited MB scope.
Do not assert final changed case/cell counts before running that audit, and do not commit a cell-by-cell list.

## Resume sequence

After resolution of the affected-case count gate, implement the retained supported paths and income reporting
without new inputs,
using the original inventory's program-id plan and the closures above. Separate cash recipient from tax
reporter; calculate provincial entitlement without feeding current provincial payments into GIS. Add
independent new cases and targeted boundary tests, run a bounded mutation pass, then audit any unavoidable
existing expectation changes. Report each changed fixture and reason before updating it. Complete full
validation after the last edit, commit normally, push and open one engine/data PR with **`Part of #21`**.
Do not split the implementation or add UI work without further dispatch.

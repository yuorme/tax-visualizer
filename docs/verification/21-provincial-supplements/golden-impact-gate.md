# #21 golden impact: 36-case lower bound exceeds the authorised limit

Checked **2026-11-05**, Codex Sol (`gpt-6.1-sol`), xhigh. This is a read-only fixture and source audit;
no engine, annual data, golden input or expected value has changed.

The latest user instruction permits only independently explained changes for qualifying 2025/2026 senior
cases, and requires a stop before changes outside that set or affecting more than about 30 cases.
The conservative count below already exceeds that limit, before a complete implementation audit.

## Count and method

Read `tests/golden/features/gis-allowance.json` directly, without importing the engine or modifying the file.
For each year and jurisdiction below, its three existing baseline families are `single`, `couple-oas`,
and `allowance`. Their IDs follow `YEAR-CODE-FAMILY`. Each case was checked to have:

- A full-year OAS/GIS opt-in for an adult aged 70, so first-year age/commencement uncertainty does not apply.
- Zero entered employment, other/private income, investments, CPP/QPP, deductions and retirement receipts.
- A locked aggregate `total` expectation, as well as the documented federal-benefit assertions.

The mixed-age Allowance family still contains a qualifying age-70 pensioner; it is not a wholly non-senior
household. Each retained provincial program below necessarily adds positive cash for these published maximum
eligibility groups. The existing `useCredits: false` does not switch off ordinary cash income supplements;
using it for that purpose would introduce an unsupported behaviour simply to preserve old expectations.

| Jurisdiction | Retained cash program | Existing cases in 2025 | Existing cases in 2026 |
|---|---|---:|---:|
| BC | Senior's Supplement | 3 | 3 |
| AB | Alberta Seniors Benefit | 3 | 3 |
| SK | Seniors Income Plan | 3 | 3 |
| MB | 55 PLUS senior component | 3 | 3 |
| ON | GAINS | 3 | 3 |
| NT | Senior Citizen Supplementary Benefit | 3 | 3 |
| **Conservative total** | **Six jurisdictions only** | **18** | **18** |

That is **36 distinct existing cases in one locked fixture**, rather than 36 fields in fewer cases.
The audit excludes Nunavut, New Brunswick, all other jurisdictions, nonmaximum/specialised GIS cases,
other feature fixtures, Manitoba's ordinary credit and every ageless annual baseline. It is therefore a
lower bound, not the final affected-case count or a list of all changed cases.

## Independent entitlement evidence

The zero-private-income adults qualify for positive payments under these sources:

- BC: the [dated July 2025 rates](../2025/sources/seniors-bc-supplement.txt) and
  [2026 table](sources/bc-rate-2026.txt) publish $99.30 single, $110.25 per both-pensioner adult and
  the separately listed Allowance-spouse category. A single full year adds $1,191.60.
- AB: the [January 2025 booklet](sources/phase2-ab-booklet-2025.txt) and
  [2026 rates](sources/ab-july-2026.txt) provide positive ordinary single/couple maximums. The
  [official calculator examples](evidence-territories-phase2.md) establish one-versus-two-recipient allocation.
  Rounding is still a separate implementation matter; no new expectation is inferred from a rounded maximum.
- SK: [regulation sections 3–6](sources/sk-regulations.txt) publish $360 monthly single/non-pensioner-spouse
  and $325 per both-pensioner adult. Zero private income gives maximum federal and provincial entitlement.
- MB: [the senior regulation](sources/mbqc-mb-senior-regulation.txt) publishes $161.80 quarterly single and
  $173.90 per eligible adult in the two-pensioner/Allowance-spouse categories at zero tested income.
- ON: the dated [2025 Q1](sources/on-jan-1-to-mar-31-2025-single.txt),
  [2025 Q3](sources/on-jul-1-to-sept-30-2025-single.txt),
  [2026 Q1](sources/on-jan-1-march-31-2026-single.txt) and
  [2026 Q3](sources/on-jul-1-to-sept-30-2026-single-en.txt) rows, with their parallel marital tables,
  publish positive zero-income maxima. The ordinary single calendar totals are $1,062/$1,092.
- NT: [the regulation](sources/territories-nt-regulation.txt) publishes $196 for every month with qualifying
  federal entitlement. Each case already has positive full-year federal entitlement.

These establish that the existing aggregate expectations must move under the retained-program scope.
They do **not** replace the required independent complete calculation of each field: T5007 attribution,
net-income-tested credits and tax interactions must still be checked before an authorised expectation edit.
GIS eligibility and federal payment expectations must remain unchanged.

## Disposition

Engine/data implementation and all existing expectation edits are stopped at the user-defined count gate.
The previously uncommitted evidence notes are being committed first as requested. No new opt-in, artificial
credit-switch gate, disabled program, fixture deletion or bulk capture has been used to reduce the count.
No implementation PR is opened while this count limit remains unresolved.

To resume the full retained-program scope, the user must explicitly authorise an affected-case limit above
this lower bound. A higher limit would still require the existing senior/year/explanation restrictions,
independent case-by-case arithmetic, and a stop for any GIS eligibility change or unexplained difference.

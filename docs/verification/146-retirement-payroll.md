# Retirement-age employee CPP/QPP, issue 146

The engine supports retirement-age employee payroll in the **2025 and 2026 data**. The page inputs are a
separate stacked branch. This does not implement age/pension credits (#17), retirement pension income,
OAS/GIS (#18/#19), or self-employment (#14). Existing inputs without the new fields retain their exact
calculation, including all historical years and their locked fixtures.

## Evidence and coverage

All evidence was read from the repository cache; no publication was fetched during this implementation.
The filenames below are relative to `docs/verification/138-senior-credit-rules/sources/` unless specified.
Their headers record the original official URL, retrieval date and hash.

| Cached publication | Used for |
| --- | --- |
| `cpp-start-stop.txt` | CPP through the 70th birthday month; age 65–69 pension-recipient election; next-month effect; maximum proration. |
| `cpp-retirement-contributions.txt` | Prior-year elections persist; revocation must be in a later calendar year; employee timing differs from self-employment. |
| `cpp-prorating.txt` | Actual pensionable pay excludes post-stop/pre-restart pay; Joseph's two-month 2026 maximum is $705.08. |
| `federal-s8-2025.txt`, Parts 2–3 | Pensionable months; prorated YMPE/YAMPE/exemption; base, first/second additional contributions; credit and deduction. |
| `docs/verification/2025/sources/qc-federal-s8-2025.txt`, Parts 1–2 | QPP annual employee thresholds; required base for line 30800; enhanced deduction for line 22215; excess contributions referred to Quebec line 452. |
| `qpp-election-form.txt` (RR-50-V, 2025-04) | Pension receipt, election after the 65th birthday, through year-end age 72, next-month stop/restart; one action per calendar year. |
| `qpp-retirement-contributions.txt` | Employee elections introduced January 2024; mandatory stop January 1 after the year turning 72. |
| `qpp-employer-guide-2026.txt`, 4.5.4–4.5.6 | QPP pay-period exemptions; optional elections do **not** reduce annual employee maxima; contributions continue without election. |
| `t4127-2026.txt`, chapter 6, tables 8.3–8.8 and 8.24–8.29 | Published 2026 and 2025 payroll rates, first/second ceilings, EI/QPIP. Tables 8.1/8.2 and 8.22/8.23 supply tax credit parameters. |
| `docs/verification/2025/sources/qc-schedule-u-2025.txt`, Part B/Table 1 | QPP annual employee deduction and full exemption/ceilings; employee elections are absent from the proration situations. |
| `qc-guide-2025.txt`, lines 98 and 452 | Pensionable wages and actual deductions are distinct; excess contributions can be refunded below the annual maximum. |
| `docs/verification/2025/sources/t4114-25.txt` | Independent CCB one-child calculation proving deduction propagation into family net income and benefits. |

Direct links for the sources outside the senior-credit cache:
[Quebec federal Schedule 8](2025/sources/qc-federal-s8-2025.txt),
[Schedule U](2025/sources/qc-schedule-u-2025.txt) and
[T4114](2025/sources/t4114-25.txt).

2026 rates, maxima and employer timing are published. The annual settlement follows the 2025 Schedule 8
and Schedule U with those published 2026 parameters. Final 2026 return forms are not in this cache.
Both 2026 retirement programs therefore carry `estimated: true` specifically for that continuation;
this does not make the published employer timing or rates estimates. Reconcile annual settlement against
the final 2026 forms when available.

The independent audit transcribes constants from these publications, **not YAML**. It checks data and
arithmetic, but cannot validate an unpublished 2026 form. Had the 2026 constants been copied from YAML,
the audit would only have checked arithmetic and would not independently verify those constants.
No 2026 CCB value is asserted by this audit: the independent benefit examples use the cached 2025 T4114.

## Input contract for the stacked UI branch

`Person` gains these optional fields (types live in `src/engine/types.ts`):

```ts
{
  age: 66,                       // whole age on December 31 of the selected tax year
  birthMonth: 6,                  // January = 1 ... December = 12
  employeePayroll: {
    retirementPensionSince: { year: 2024, month: 1 },
    cppElection: {
      stop: { year: 2025, month: 6 },
      restart: { year: 2026, month: 1 } // optional; later calendar year than stop
    },
    qppElection: { stop: { year: 2026, month: 6 } },
    monthlyEarningsWeights: [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0]
  }
}
```

- `age` and `birthMonth` must be supplied together. The supplied age refers to the selected tax year,
  not today's age. At least one of those fields or `employeePayroll` activates the new path.
- The page holds a birth year and derives `age = taxYear - birthYear` for each selected year and each
  history row. Birth-year state and conversion belong to the UI branch; `Person` still accepts year-end age.
  Pension receipt and election dates remain calendar-dated. For a June 1960 birth and a valid June 2025
  stop without revocation, age is 65 in 2025 and 66 in 2026; the election remains `"stopped"` in both years.
- Omit all three fields for a legacy scenario. With age/birth month only, contributions continue by
  default until the selected plan's mandatory stop. Merely turning 65 or receiving a pension stops nothing.
- UI and #17 integration must omit unset retirement fields: `age: null` activates this path and throws
  `RangeError` in supported years; childcare's nullable age drafts must not be copied directly to `Person`.
  Any supplied `age` activates the path and throws `UnsupportedRetirementPayrollError` in 2019–2024,
  even at zero employment income.
- `retirementPensionSince` means continuous receipt of **either** a CPP or QPP retirement pension from
  that calendar month. It is eligibility information, not pension income or an amount. Cancellation and
  disability pensions are outside this contract. Enter pension cash separately under existing income rules.
- Election dates mean the month a completed, valid form reached the employer, not its effective month.
  A June delivery takes effect July 1. One stop plus optional revocation represents one election cycle.
  Earlier cycles may be discarded only when they cannot affect any compared year.
  A prior-year stop can persist all year.
  A December revocation takes effect the following January. Actual calendar years are retained, not
  silently shifted when comparing tax years.
- The contract cannot represent two election cycles affecting one tax year, or validate RR-50's condition
  that an earlier election was not revoked in the year of a new stop. Such histories are unsupported.
  For example, CPP stop in 2024, revocation in February 2026 and re-stop in October 2026 gives eight
  contributing months (March–October); keeping only the latest stop would incorrectly give ten.
- Each plan owns its election. CPP uses CPT30, QPP uses RR-50-V. Receiving a QPP pension can qualify a
  CPP election, and vice versa; neither election supplies the other plan's election.
- Election-month inputs attest receipt of the pension by the delivery date and delivery after the
  birthday where relevant. QPP requires the day **after** the 65th birthday; a December 31 birthday
  cannot produce a December RR-50 delivery. Without days, the UI must explain this attestation and
  record January for that case. A CPP election in the 70th birthday month is unnecessary for the
  calculated stop and is treated as ineligible under this after-birthday convention.
- Underage, premature, non-recipient and pre-introduction QPP stop elections are ignored, with
  `election: "ineligible-stop"` in the breakdown. An invalid same-year (or earlier) revocation leaves
  a valid stop in force and reports `"ineligible-restart"`. The status describes election validity,
  not whether it has already taken effect; inspect `contributoryMonths` for the selected year's effect.
- `ord` is actual total annual employment income. Omitted weights mean twelve equal monthly payments.
  Supplied weights must be twelve finite, nonnegative numbers with positive sum; their ratios distribute
  `ord`. For the example above, all annual pay is in January–June. Weights are **not** extra income.
  The next employment dollar uses the same ratios, so marginal-rate calculations preserve timing.
  Zero-pay months still count toward CPP's eligible-month proration.

The supported scenario is an adult past the contribution-entry year, one continuing monthly-pay
employment, no disability/death or pension cancellation, and residence/employment in the province
being compared. Ages through the contribution-entry year fail explicitly; youth payroll is outside this
retirement task. Multiple employers with different QPP elections, interprovincial transfers, payroll-slip
rounding and weekly/biweekly payday calendars are not modelled.
Schedule 8 Part 2 also says the basic exemption "may be prorated by the CRA" in the year CPP retirement
benefits start. That adjustment is not modelled: `retirementPensionSince` establishes election eligibility
only. It can understate employee CPP contributions by up to about $190 (eleven twelfths of the $3,500
exemption at 5.95%, about $190.90), before income-tax credits and deductions.

Inspect `federal.payroll.employeeRetirement` for support; do not hard-code a list of years in the UI.
An activated scenario in data without that object throws `UnsupportedRetirementPayrollError` with a
`year` property. The UI branch must gate unsupported selected-year scenarios and explain the missing coverage.
When any person has retirement inputs, filter years by `federal.payroll.employeeRetirement` **before**
calling `historyComparison`; show only supported years and a note explaining the omitted retirement-payroll
coverage. Derive each person's age from their birth year for each row before computation; rows must not use
a fixed age. The current history caller and helper retain ages, so the UI branch must adapt that flow as well
as its fixed-age explanatory text. Catching an error from an unfiltered call loses the supported rows too.
Malformed inputs throw `RangeError`.
The error and `employeeRetirementPayrollOf` are available from `src/engine/payroll.ts` directly.
The new types are already re-exported by the existing `export *` in `src/engine/index.ts`.

The UI branch must preserve every field in saved-state/URL serialization and history inputs. This branch
owns neither UI nor codec files. The employee timing object is a deliberate seam for #14: self-employment
must have its own income, elections and contribution calculation, never reuse this timing automatically.

## Calculation and annual settlement

First construct contributory calendar months by intersecting the mandatory-age window with the
valid election window. CPP includes the 70th birthday month; QPP includes the entire year turning 72.
Let `E` be wages paid in those months and `m` their count. EI/QPIP and territorial payroll tax continue
to use total employment income regardless of retirement age or CPP/QPP election.

CPP Schedule 8 Part 2 sets `B = YMPE × m/12`, `D = YAMPE × m/12` and `X = exemption × m/12`.
Part 3 lines 2–7 then give second-tier earnings `max(0, min(E, D) − B)` and first-tier earnings
`max(0, min(E, B) − X)`. Apply the data's base, first-additional and second-additional rates.
Birthday/election month counts must not be used to prorate total annual pay a second time.

QPP employer guide 4.5.4 calculates deductions on actual pay in the contributing pay periods, with
pay-period exemptions and **full** annual maxima. QPP2 starts above the full YMPE and caps at the
full YAMPE; employment income paid while stopped cannot advance its pensionable-earnings threshold.
The engine exposes estimated monthly withholding separately.

For the annual tax burden, Schedule U Part B lines 12–16 and 18.5–23 use actual pensionable pay,
the full annual exemption and full ceilings. Table 1 does not prorate those for employee elections.
Thus an optional stop may produce excess monthly deductions, even below the annual maximum. The
reported annual base/enhanced amounts exclude that excess; the breakdown records it as `overpayment`.
Federal Quebec Schedule 8 (5005-S8) Part 1 likewise uses twelve months for employee elections and for
the year turning 72: neither is a proration condition; age 73 or older at year-end instead enters zero.
Part 2 line 24 computes actual less required contributions. When positive, Part 2a explicitly refers
to Quebec guide line 452 and sends required base (line 15) to federal line 30800, with required enhanced
contributions (lines 18 and 22) sent to line 22215. This directly supports the credit, deduction and
excess-contribution treatment. The refund is counted once, by using net annual contributions in `payroll`,
rather than deducting a second refund from household tax.

Example: 2025 Quebec wages $50,000 evenly paid, eligible June stop. Pensionable wages are $25,000.
Monthly withholding's contributory base is $25,000 − $1,750 = $23,250, or $1,488 at 6.4%.
Annual Schedule U first-tier earnings are $25,000 − $3,500 = $21,500: base $1,161 and enhanced $215,
total $1,376, leaving $112 excess withholding. Deducting $232.50 of enhanced QPP would contradict
Schedule U line 16. The same CPP scenario instead has base $1,150.875 and enhanced $232.50.

At $180,000 evenly paid and a June stop, 2025 CPP caps at half-year base $1,678.05 plus enhanced $537.
QPP reaches its **full-year** base $3,661.20 plus enhanced $1,074. In 2026 those amounts are
$1,759.725 + $563.50 for CPP and $3,768.30 + $1,127 for QPP. These cases reject automatic QPP proration.

The calculator retains full precision, as in existing payroll, and golden assertions round to four
decimals. Official Schedule 8's table rounds prorated thresholds to cents; monthly pay-period
exemption/contribution rounding can also differ by cents. The QPP employer-guide example uses 22
biweekly pays through October ($2,585.44), not ten equal monthly pays. It establishes withholding
and maximum treatment but is not represented as an exact monthly-input result here.

`pay.base` feeds the existing non-refundable credits; `pay.enh` feeds `netIncomeParts` and `netOf`.
Their existing callers then propagate the same deduction into individual/family income, spouse
calculations, childcare income bases and income-tested benefits. Quebec continues to use QPP, including
its full annual election thresholds, in its net-income path. Pensionable wages do not replace `ord`
for income tax, employment amounts, working income, EI or QPIP.

## Verification map

`tests/golden/features/retirement-payroll.json` adds **158** independent cases; no existing fixture
was recaptured or edited. Prefixes identify the year and plan. The dedicated runner compares complete
specified paths, then re-evaluates them against `tests/retirement-payroll-forms.ts`, which imports no
engine, schema or YAML. Manually selected eligible months audit timing; independently transcribed
Schedule 8/ U steps audit amounts. Expected values were calculated by that independent worksheet,
not captured from production output.

| Rule/path | Golden ID suffixes (both years/plans where applicable) |
| --- | --- |
| Mandatory stop; January/December; already past age | `mandatory-birthday-1`, `mandatory-birthday-12`, `past-mandatory-age` |
| Same person's CPP/QPP divergence | `same-person-turns-70`, `restart-then-70-birthday` |
| Age 65 / pension alone does not stop payroll | `65-default`, `pension-without-election` |
| Eligibility | `under-65-ineligible`, `before-birthday-ineligible`, `missing-pension-ineligible`, `before-pension-ineligible`, `invalid-prior-age`, `pre-2024-election-ineligible` |
| Plan-specific upper election age | `stop-before-70-birthday`, `stop-at-70-birthday-ineligible`, `stop-at-72-birthday-eligible` |
| Next-month stop and December carryover | `birthday-next-month-stop`, `stop-january`, `stop-december`, `prior-december-stop` |
| Prior-year stop/restart; combined mandatory stop | `restart-1`, `restart-6`, `restart-12`, `prior-year-restart-completed`, `restart-then-70-birthday` |
| Invalid same-calendar-year revocations | `same-year-restart-invalid`, `prior-same-year-restart-invalid` |
| Independent elections | `other-plan-election-isolated` |
| Actual pay, uniform/uneven distribution, annual QPP exemption | `pay-before-stop`, `pay-after-stop`, `low-pay-stop`, `birthday-next-month-stop` |
| CPP2/QPP2 and unreduced QPP maxima | `both-tiers-half-year`, `restart-6` |
| Exemption/YMPE/YAMPE immediately below, at and above | `threshold-exemption-*`, `threshold-ympe-*`, `threshold-yampe-*` |
| Base credits, enhanced deductions, family net income and CCB | Every case's credit/net-income paths; `deductions-benefit-propagation` adds other income and itemized deductions |

Targeted tests also cover both spouses, province comparisons, marginal earnings weights, invalid inputs,
source-selected support, modified data thresholds/effective-month offsets and unchanged ordinary payroll
across all installed years. Negative controls deliberately prorate QPP's maximum and include wages after
a CPP stop; the independent golden assertions reject both errors.

Reference additions in `tests/reference/2025.test.ts` assert Schedule 8's six-month ceilings and Schedule U's
full QPP maxima. The 2026 reference checks CRA's published Joseph example and T4127's QPP maxima.
No new behaviour is inferred from an engine-generated snapshot.

Validation: `npm run format` and the full `npm run check` passed (1,490 tests; browser smoke checked
43 pages, 261 states and 40 contrast scans at desktop, 430 px and 375 px in light/dark). Existing golden
fixtures and UI files are unchanged.

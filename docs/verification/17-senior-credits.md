# Age and pension credits: engine half of #17

Coverage is **2025 and 2026 only**, federal and all thirteen jurisdictions. The page half is a separate stacked
branch: controls, tooltips, URL codec and saved-state migration, including #17's tooltip acceptance item.
This implements the [reviewed #138 specification](138-senior-credit-rules.md), including #141's round-2
Manitoba spouse-age correction. It uses the already-landed #145 family benefit, #146 payroll and #92 claimant rules.
No UI files are changed. The orchestrator should file a separate History back-fill issue at merge.

## Evidence and status

All new data values come from the [cached official evidence](138-senior-credit-rules/SOURCES.md):

- Federal T1, worksheet and S2 (including Quebec-resident S2); all twelve CRA 428s, worksheets and S2s.
- CRA's [pension eligibility chart](2025/sources/seniors-pension.txt), also checked at its official URL during this work.
- 2026 TD1 and worksheets; BC Budget 2026's **annual** 5.60% credit rate, not July's 6.14% withholding rate.
- Quebec Schedule B, TP-1 and guide for 2025; the official 2026 personal-income-tax parameter bulletin.
- MB428-A and its guide; NS428 line 98, PE428 lines 76/78, SK428 and SK(S2).
- Quebec Schedule F's existing #91 evidence for taxable domestic retirement receipts in its income base.

Published 2026 amounts are not estimates. Each new program records `provisionalRules: true` for 2026:
2025 filing formulas, S2 ordering and MB/NS/PE conditions continue provisionally until final 2026 forms are checked.
No source/spec contradiction was found in the implemented categories. Existing estimated benefit parameters
remain estimated; adding pension income does not turn those unrelated estimates into final figures.

## Input and calculation contract

`Person.age` remains whole age on December 31. A full age credit applies in the year of turning 65.
This preserves the information for later 60–64, 65–74 and 75+ rules. Existing payroll requires `birthMonth`
with age and keeps CPP/QPP elections separate; this change does not create another age or election switch.
Omit unset fields; `null` is invalid. Legacy scenarios without age or retirement receipts keep their results.

`retirementIncome` is an optional array of additional retained, taxable domestic cash receipts:

| Type | Federal/CRA provinces | Quebec |
| --- | --- | --- |
| `rppLifetime` | Eligible at any age | Eligible |
| `rrif` | Age-eligible or eligible survivor receipt | Eligible at any age |
| `rrspAnnuity` | Age-eligible or eligible survivor receipt | Eligible at any age |
| `rrspWithdrawal` | Ineligible | Eligible |

Only RRIF/annuity records accept optional `survivorEligible`. An age-dependent receipt without age or a valid
survivor assertion fails explicitly. RPP and ordinary RRSP receipts do not need age to classify them.
Unknown types, negative/nonfinite amounts and overflowing totals fail. The caller attests that these are retained
receipts after rollovers; special slips, foreign pensions, income splitting and Schedule B transfer deductions
are unsupported. Moving receipts from `oth` conserves cash; copying them double counts income and is incorrect.

Receipts join cash, federal/provincial net income, taxable income, benefit bases and the Quebec Health Services
Fund base once. They do not create wages, CPP/QPP contributions, EI, QPIP, employment credits or RRSP earned room.
Real-history scaling multiplies each receipt amount and retains its category/survivor flag. Unsupported historical
years reject explicit retirement input, including an empty array; no current-year parameters are carried backward.
Existing historical age/payroll errors retain their original error class.

The household stage calculates personal entitlements, allocates S2 pools independently, then finalizes tax before
benefits. Age tapers use individual federal net income. Yukon copies the federal age base. Quebec uses line 275
after the worker deduction, excluding the federal childcare deduction, for one family-income taper.
The personal-credit switch disables age/pension relief and transfers while preserving taxable receipts.

### Transfers and provincial ordering

S2 uses taxable income within the first bracket and bracket tax divided by the credit rate above it, less BPA
and the specified prior subtotal. It excludes spouse claims, dividends, family benefits and incoming transfers.
Federal employment/CPP/QPP/EI/QPIP credit bases enter the federal subtotal. Provincial contributions enter the
provincial subtotal; Yukon also includes its employment amount and NL includes its childcare amount.
SK/NU child bases and senior bases form **one** transferable pool. The calculation deducts donor capacity once;
the breakdown partitions unused child and senior bases consistently with personal credit consumption.
Both transfer directions are supported. Recipient relief is non-refundable and is not capped at their own pension cap.
`spouse: true` assumes an eligible couple resident together in the jurisdiction being compared, without a qualifying
relationship-breakdown separation. Cross-province spouses and part-year special returns are outside this contract.

Ontario receives these credits before surtax. Federal Quebec transfers precede the federal abatement.
Manitoba adds its own-age term and a spouse term only with an age transfer and donor S2 line 1 strictly greater
than line 11. A pension-only transfer cannot qualify. The combined family base then loses 9% of claimant income.
NS's separate age credit is tax dollars, strictly below the taxable-income threshold, after its low-income reduction.
PE counts each eligible spouse once in the family reduction before its single taper. SK's supplement has no income taper.

Quebec combines age, retirement and the existing living-alone base, reduces the sum once, and allocates the pool
to available tax capacity. Unclaimed remainder stays on one return. Line 431 then transfers negative line 430
in **dollars**, including unused BPA and dividend credits, without duplicating the Schedule B allocation.
Transfers never make line 432 negative. Unrelated adults cannot transfer and do not get the living-alone base.

## Independent expectations and golden coverage

`tests/golden/features/senior-credits.json` contains **450 new cases / 1,596 numeric assertions**.
Expected values were calculated from the reviewed literal parameter table and separate paper-form arithmetic;
the preparation scripts imported no engine and took no engine snapshots. There is no capture/update mode in
the new test runner. The year reference tests separately compare published values to production data.
The original annual golden files are unchanged. No tolerance or assertion is weakened.

Counts below apply **separately to each of 2025 and 2026** (225 cases / 798 asserted values per year).
These are additions, with no before value; they are not counts of changed existing annual cells.

| Province | New cases | Asserted values |
| --- | ---: | ---: |
| AB | 12 | 38 |
| BC | 12 | 38 |
| MB | 21 | 55 |
| NB | 12 | 38 |
| NL | 13 | 40 |
| NS | 16 | 50 |
| NT | 12 | 38 |
| NU | 14 | 46 |
| ON | 40 | 177 |
| PE | 18 | 47 |
| QC | 27 | 143 |
| SK | 15 | 49 |
| YT | 13 | 39 |

IDs have a year/province prefix. Federal component boundary cases use Ontario as the host province.

| Changed rule path | Golden suffixes |
| --- | --- |
| Every age amount, 64/65, threshold, taper, exact zero and above | `<jurisdiction>-age-*` |
| Every pension cap below/at/above | `<jurisdiction>-pension-*` |
| Four receipt types, age 64/65, both survivor states | `classification-*` (ON and QC) |
| Full single return in every jurisdiction | `full-return` |
| Every provincial S2 and independent federal/provincial amounts | `jurisdiction-transfer`, `transfer-*` |
| Both directions, recipient cap, tax capacity, Ontario surtax | `transfer-False/True`, `transfer-surtax-full`, `zero-capacity` |
| Federal Quebec abatement after transfer | `transfer-before-abatement` |
| Prior employment bases; Yukon employment; NL childcare | `employment-donor`, `employment-prior-base`, `childcare-prior-base` |
| Shared SK/NU child pool and both directions | `joint-child-pool-False/True` |
| SK supplement after ordinary age base reaches zero | `supplement-survives` |
| MB own-age, family-base zero, spouse condition including equality | `mb-own-*`, `mb-spouse-*` |
| NS age boundary and strict taxable-income cutoff | `ns-strict-*` |
| PE zero/one/two seniors and reduction zero boundary | `family-seniors-*`, `pe-family-taper-*` |
| Quebec one taper, exact zero, retirement cap | `qc-pool-*`, `qc-retirement-*` |
| Quebec allocation, unused DTC/BPA, non-refundable floor | `pool-split`, `line431-dividend-False/True`, `unrelated-adults` |
| Quebec worker deduction in line 275 | `worker-net-pool` |
| Pension cash and benefit-income propagation | `benefit-income`, classification and full-return cases |

Targeted tests also check omitted-input identity across all provinces, cash/payroll/HSF conservation,
credit-switch behavior, invalid receipts, unsupported years, real-history scaling and data-selected rules.
An S2 negative control changes final tax, spouse credit and dividend credit without changing donor capacity.

### Reproducible sample arithmetic

The component arithmetic in `138-senior-credit-rules/calculate.mjs` remains an independent cross-check.
For each ordinary CRA age row, use `max(0, maximum - .15 × max(0, net - threshold))`.
The exact zero is `threshold + maximum / .15`; the case one dollar below has a .15 base.
Pension bases are the lesser of eligible receipts and the published cap.

Full-return cases have 30,000 ordinary income plus 10,000 RPP, age 65, no work/children/refundable benefits,
housing, spending or driving. At 40,000, federal 2025 tax is
`(40,000 - 16,129 - 9,028 - 2,000) × .145 = 1,862.235`; 2026 is 1,727.60.
Provincial calculation subtracts BPA, tapered age, capped pension and SK supplement from the credit base,
then applies the independently transcribed 428 reduction. NS/PE cross their first bracket; the other provinces
remain in the first bracket. MB also subtracts `(4,130 - .09 × 40,000) × .108 = 57.24`.
BC and NB low-income reductions remain positive at 40,000; their reduction is included, not ignored.
Ontario adds a 450 health premium. Quebec uses its combined pool, federal abatement and 150 HSF contribution.
These final-tax cells combine multiple credit changes deliberately; they are full calculations, not isolated savings.

For the 2025 ON donor at 20,000 with 2,000 RPP, federal transfer is
`9,028 + 2,000 - (20,000 - 16,129) = 7,157`; provincial transfer is
`6,223 + 1,762 - (20,000 - 12,747) = 732`. A recipient at 120,000 uses these before both surtax bands.
The two adults' 140,000 cash is unchanged. For SK's 2025 donor at 20,000 with one child, capacity is 509;
child transfer is `7,704 - 509 = 7,195`, senior transfer is `5,785 + 1,000 + 2,028 = 8,813`.
Subtracting 509 again from the senior pool would understate relief.

MB's 19,508 spouse has age base 3,728 and adjusted income `19,508 - 15,780 = 3,728`:
equality does not qualify. At 19,507 it does; at 60,000 the age base is zero and the claimant at 30,000
retains only the 1,430 family-benefit base, worth 154.44. These distinguish the reviewed #141 correction.

Quebec's 2025 couple at 27,500 each, with 3,000 RPP each, has pool
`2 × (3,906 + 3,470) - .1875 × (55,000 - 42,090) = 12,331.375`.
Allocate 8,929 to the first return and 3,402.375 to the second; provincial tax is 773.7275.
The line-431 dividend cases deliberately have excess combined relief. An initial paper calculation omitted
line 432's zero floor; checking the cached return corrected those four new expectations to zero before commit.
The fixture retains full entitlements and transfer assertions, so the cap does not conceal double allocation.

### Existing age-aware marginal baseline

The pre-existing self-employment marginal fixture already supplies age 66 with personal credits enabled.
Its 2025 Quebec case at 75,000 profit predates age credits. Ordinary-input identity does not apply to that input.
The original independent calculation in [#14's audit](14-self-employment.md) gives a 91.61599792 net-income
increase per 100 profit and a pre-age marginal rate of 0.42823757229792.
The newly required taper effects are independently:

```text
Federal: 91.61599792 × .15 × .145 × .835 / 100 = .0166386104222460
Quebec:  91.61599792 × .1875 × .14 / 100      = .0240491994540000
Total:   .42823757229792 + both changes      = .4689253821741660
```

The single expected marginal cell combines federal age taper and Quebec pool taper. No cash, payroll,
contribution rate or deduction changes explain this difference. The existing fixture remains unchanged as the brief
requires. A new targeted test verifies the independently calculated marginal rate. The draft PR cannot pass its
full check until the orchestrator resolves this conflict: authorize the one necessary baseline update, or change
the requested age-credit activation contract. Silently suppressing credits for this valid senior input is incorrect.

## Remaining limits and handoff

This does not complete senior tax burden: OAS/GIS/Allowance, CPP/QPP benefit entitlements, pension splitting,
senior supplements and property programs remain separate tasks. Alberta supplemental-credit sizing (#147)
is out of scope. RRIF minimums, deferral, partial residency, foreign/special pension receipts and adult-student
single-parent additions remain unsupported. Living alone retains the existing qualifying-dwelling proxy.

#91's remaining HSF limitation stays explicit: unclassified `oth` assumes subject income and cannot exclude
OAS or identify allowed special deductions. These four new retained domestic receipt categories are subject;
they are included in HSF, while future #18 must exclude separately classified OAS and include CPP/QPP benefits.
UI serialization must carry every receipt's type, amount and survivor flag and preserve omitted legacy defaults.
The page must explain unsupported historical coverage and the existing age/birth-month contract.

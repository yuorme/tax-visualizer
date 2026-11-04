# Alberta supplemental tax credit: rules and sizing

Research for #147, following [#138's senior-credit study](138-senior-credit-rules.md). Checked on 2026-11-03
against cached primary sources. This is a sizing study, not an engine implementation or completion of #17.

The current supported Alberta credit bases cannot reach the supplemental-credit threshold. Adding #17's age,
pension and spouse-transfer bases can produce a usable credit, but remaining tax sharply limits its dollar
value. With nonnegative net capital gains, the conservative household-rate bounds below stay under the
[scope test](../SCOPE.md#how-scope-is-decided) of 0.1 percentage points. However, a valid #17 example with the
existing negative-capital-gain input reaches **0.204279 points in 2025**: the calculator subtracts the loss from
displayed household income without deducting it from ordinary taxable income. This establishes materiality
for that supported input combination, even though its supplemental tax saving is only **$50.5346**.

The annual structure is now verified from the full Alberta Act, including explicit indexation after 2025.
Its 2026 amounts reconcile to TD1AB/T4127, giving $53.5924 usable relief and a 0.190680-point loss-case effect.
One specific legislative currency check remains: the consolidation omits **2026 c3 s2**, which amends personal
credits and indexation. The 2026 figures remain conditional on that amendment's applicability, not on an
assumed continuation of a payroll formula. See the statutory verification below.

## Sources and annual formula

The five CRA sources were cached for #138 on 2026-11-03; the full Act was supplied for this follow-up.
Their headers record official URLs, publication metadata and original-file hashes. Citations link the reviewed
extracts, allowing offline reproduction.

| Source | Relevant content |
| --- | --- |
| [2025 worksheet](138-senior-credit-rules/sources/ab-worksheet-2025.txt) | Page 3: supplement; page 1: age taper. |
| [2025 AB428](138-senior-credit-rules/sources/ab-428-2025.txt) | Lines 16–52: bases; lines 59–75: tax capacity. |
| [2025 AB(S2)](138-senior-credit-rules/sources/ab-s2-2025.txt) | Transfers and donor own-use calculation. |
| [2026 TD1AB](138-senior-credit-rules/sources/td1ab-2026.txt) | Personal amounts and withholding transfer claims. |
| [2026 T4127](138-senior-credit-rules/sources/t4127-2026.txt) | Alberta K5P; tables 8.1, 8.4, 8.7, 8.25 and 8.28. |
| [Full Alberta Act](2026/sources/ab-pita-act.txt) | Sections 4, 7–10, 19, 20.1, 20.2, 42 and 44.2; cover caveat. |

Define `B` as Alberta non-tuition credit **bases**, before multiplying by the 8% credit rate. The 2025 worksheet
sets `B = AB428 line 58800 − line 58560`. Its calculation is:

```text
S2025 = 25% × max(0, 8% × B − 4,800)
      = 2% × max(0, B − 60,000)
```

`S2025` is the calculated credit, not necessarily the tax saving. AB428 subtracts it at line 74 from line 73
and floors line 75 at zero. Thus the saving is `u = min(S2025, line73)`. Line 73 is after ordinary
non-refundable credits, dividend credits, minimum-tax adjustments, provincial foreign tax credits and political
contribution credits. The present model excludes the minimum-tax and political-contribution paths; neither can
be added to a supported-household example merely to create capacity.

The ordinary base credit is 8%, not 10%, and the supplemental formula does not raise every credit to 10%.
Only the excess base over $60,000 generates the extra 2%. The worksheet's illustrative $70,000 base gives
$200 calculated credit, but it supplies neither a valid household nor proof of $200 remaining tax.

## Map from return lines to supported inputs

This mapping follows [AB428](138-senior-credit-rules/sources/ab-428-2025.txt), including its subtotal at line 52.
Current implementation references are [personal.ts](../../src/engine/personal.ts) and
[household.ts](../../src/engine/household.ts); planned senior rules are in the
[#138 specification](138-senior-credit-rules.md).

| Base or credit | Annual-return treatment | Supported status for this sizing |
| --- | --- | --- |
| Basic personal amount | Line 58040; included in `B`. | Current. |
| Spouse amount | Line 58120; included in `B`, reduced by spouse net income. | Current. |
| Eligible dependant amount | Line 58160; included in `B`. | Current single-parent alternative to spouse claim. |
| Own age amount | Line 58080; included in `B`, after income taper. | Proposed #17. |
| Base CPP/QPP and EI | Lines 58240, 58280, 58300, 58305; in `B`. | Alberta employment uses base CPP and EI. |
| Enhanced CPP and CPP2 | Income deductions, not these credit bases. | Current; cannot add them to `B`. |
| Own pension amount | Line 58360; included in `B`. | Proposed #17; eligible pension only. |
| Spouse's unused age/pension | Line 58640 via AB(S2); included in `B`. | Proposed #17; donor own-use limit applies. |
| Disability and caregiver amounts | Included in the form's subtotal. | Outside current/#17 supported inputs here. |
| Infirm dependant, adoption, student-loan interest, medical | Included in subtotal. | Outside current/#17. |
| Unused tuition/education | Line 58560; subtracted when calculating `B`. | Excluded even if introduced later. |
| Donations | Added after line 58800; outside `B`. | Excluded; can reduce remaining tax. |
| Dividend/foreign/political credits | Outside `B`; before line 74. | Dividend/foreign supported; political excluded. |
| Canada employment amount | No equivalent Alberta base on AB428. | Federal credit cannot enter `B`. |

Self-employment and Quebec-to-Alberta payroll transitions are not current Alberta input paths. Their distinct
CPP/QPP rules are not used to inflate this study's employment-credit bound.

## Spouse transfers and deductions

[AB(S2)](138-senior-credit-rules/sources/ab-s2-2025.txt) lines 1–4 collect the donor's age, pension and disability
bases. Lines 5–10 subtract the donor's own-use requirement after basic personal, payroll and tuition bases.
Above $60,000 taxable income, line 5 uses bracket tax divided by 8%, rather than taxable income directly.
Only the remainder reaches recipient line 58640. The supported #17 subset excludes disability and tuition.

Consequently, summing every maximum is an upper bound, not a valid transfer algorithm. In particular, income
earning a donor pension credit usually also reduces the recipient's spouse amount. However, that cancellation
is not a universal proof: a valid annual deduction can reduce donor net income while leaving eligible pension
receipts and the pension-credit base intact. A pensioner with unused RRSP room may have that combination.
The model accepts annual deduction claims without verifying room; a worked example must state its assumption.

The bounds below conservatively allow both full donor age and full donor pension transfers together with the
full spouse amount. They also allow the claimant's maximum payroll bases while deductions lower net income.
They therefore remain valid for these deduction cases without asserting all maxima are simultaneously attained.
An example using employment after age 65 must apply #138's age-aware CPP prerequisite or explicitly assume
continued contributions during an eligible age, rather than assuming contributions after age 70.

## Current and proposed base bounds

Let `p` be the basic/spouse maximum, `a` the age maximum, `h` its taper-start income, `k` the pension maximum,
and `w` maximum base CPP plus EI. The 2025 figures come from the annual forms; 2026 personal amounts come from
TD1AB and payroll maxima from T4127. Act section 9 directly supplies the 15% age taper; section 44.2 indexes
the dollar maximum and income threshold. The 2026 column is the consolidated-law calculation, subject to the
specific unincorporated-amendment check described below.

| Parameter | 2025 | 2026 consolidated law* |
| --- | ---: | ---: |
| `p` | $22,323 | $22,769 |
| `a` | $6,221 | $6,345 |
| `h` | $46,308 | $47,234 |
| `k` | $1,719 | $1,753 |
| Base CPP maximum | $3,356.10 | $3,519.45 |
| EI maximum | $1,077.48 | $1,123.07 |
| `w` | $4,433.58 | $4,642.52 |
| Supplemental base threshold `q` | $60,000 | $61,200 |
| Current maximum `2p + w` | $49,079.58 | $50,180.52 |
| #17 single parent maximum `2p + a + k + w` | $57,019.58 | $58,278.52 |
| #17 couple loose maximum `2p + 2a + 2k + w` | $64,959.58 | $66,376.52 |

Current bases remain below `q` regardless of household income, dividend mix, deductions or capital losses;
the current supported omission is exactly zero. A single senior or senior single parent also stays below the
threshold after adding the proposed own age/pension credits. Only a couple receiving unused spouse age/pension
bases can cross it in this supported subset. Additional dependants do not create additional spouse-equivalent
credits in the current model.

## Remaining-tax upper bound

Write claimant taxable income as `t` and net income as `n`, with `n >= t`. Its age base cannot exceed
`A(t) = max(0, a − .15 max(0, t − h))`. Then:

```text
B <= M(t) = 2p + a + 2k + w + A(t)
S <= .02 max(0, M(t) − q)
```

For `t <= q`, tax is at most `.08q`. Any base large enough to trigger the supplement already supplies
ordinary non-refundable credits exceeding that tax; no supplement is usable. In the relevant second bracket,
bracket tax is `.10t − .02q`. Once `M(t)` falls below `q`, the supplement is again zero; this occurs before
the third bracket in both years. Ignoring dividend and other credits maximizes available tax.

For any positive usable saving `u`, both conditions must hold:

```text
u <= .02(B − q)
u <= .10t − .02q − .08B
```

Eliminating `B` gives `u <= .02(t − q)`. This increases with `t`, whereas the bound from `M(t)` decreases
in the age-taper band. Their intersection is `t = M(t)`. There,
`t = (2p + 2a + 2k + w + .15h) / 1.15`. These are conservative maxima, not engine snapshots:

| Bound | 2025 | 2026 consolidated law* |
| --- | ---: | ---: |
| `M(t)` in the relevant taper band | $71,905.78 − .15t | $73,461.62 − .15t |
| Intersection taxable income/base | $62,526.765217 | $63,879.669565 |
| Maximum usable supplemental credit | $50.535304 | $53.593391 |

At most one spouse can receive a usable supplement. The recipient must have taxable income above `q`, hence
net income exceeding the spouse-amount maximum. The other spouse cannot claim a spouse amount for that person;
even generously allowing both age/pension bases and payroll on the other spouse cannot reach `q` without it.
Thus the individual dollar bound is also a household dollar bound for these supported inputs.

## Household-rate bound and the capital-loss exception

For households with nonnegative net capital gains, dividend gross-up alone cannot evade the rate bound.
Let `D` be the Alberta dividend tax credit, and `de`, `dn` grossed-up eligible and non-eligible dividends.
Including that credit in the capacity inequality gives `t >= q + 50u + 10D`. Actual dividend cash is below
grossed-up income by `(0.38 / 1.38)de + (0.15 / 1.15)dn`. But:

```text
10D = .812de + .218dn
     >= (0.38 / 1.38)de + (0.15 / 1.15)dn
```

The Alberta dividend-credit percentages are in the
[2025 worksheet](138-senior-credit-rules/sources/ab-worksheet-2025.txt);
gross-up factors and the continuing 2026 percentages are also recorded in the project's year data.
Deductions and positive capital gains make cash income larger relative to taxable income, not smaller.
For nonnegative capital gains and other income components, household cash income `H >= q + 50u`.
Therefore `100u/H <= 100u/(q+50u)`, which increases with `u`. Evaluating it at the dollar bounds gives
**0.080822 percentage points for 2025** and **0.083897 points for the 2026 consolidated-law calculation**.
The same isolated
Alberta correction changes its gap to any unaffected province by that amount. No affected household in this
nonnegative-income subset reaches 0.1 points.

That conclusion is deliberately conditional. The repository's [Person type and cashOf](../../src/engine/types.ts)
allow negative net capital gains and include them, signed, in cash income. Its
[netIncomeParts](../../src/engine/payroll.ts) instead counts a net capital loss as zero for current taxable
income. Thus a household with the same positive supplemental saving can have smaller positive displayed income
after realizing a loss. The preceding `H` inequality then does not apply. Reproducible loss examples must
report the unchanged tax-base calculation and the reduced household denominator separately; they cannot be
dismissed by silently restricting the existing input domain to nonnegative gains.

### Reachability in the page, engine and #17 scope

The negative entry is actually accepted today; it is not just permitted by the TypeScript type:

- [The page](../../src/ui/index.html) provides `input#cg` as a text input and a `cg-range` slider with minimum
  `-50000` and maximum `50000`. The example is within the ordinary slider range.
- [The handlers](../../src/ui/app.ts) for `input.inv` preserve an ASCII or Unicode leading minus when `k ===
  "cg"`, then assign `me()[k] = neg ? -v : v`. The `input.inv-range` handler assigns `+el.value` directly.
  `syncRange` clamps the displayed slider thumb to its range; it does not change the stored capital-gain value.
- [Scenario normalization](../../src/ui/scenario-url.ts) explicitly accepts negative `cg`, unlike other income
  fields. Saving, sharing or loading an otherwise valid scenario does not discard the loss.
- [The engine](../../src/engine/payroll.ts) uses `max(0, cg)` only in taxable income. Signed `cg` remains in
  [cashOf](../../src/engine/types.ts) and the personal cash total, and
  [compute](../../src/engine/household.ts) divides by that positive household cash total.

The script's optional `--verify-model` mode extracts and executes the actual two page input-handler bodies,
with DOM/render stubs, then invokes the current production engine. Typed `-50,000`, Unicode `−50,000` and
slider `-50000` all store `cg = -50000`. It confirms claimant taxable incomes $62,527/$63,880, zero taxable
capital loss and cash denominators $24,738/$28,106 in 2025/2026. Removing the loss increases cash by $50,000
and leaves current tax unchanged. This is an executed source-path check, not a claimed browser smoke pass.
The current engine still lacks the senior and supplemental credits; their dollar relief comes from the
independent statutory calculation, not from that reachability check.

**#17 does not restrict this input under the recorded specification.** The
[#138 specification](138-senior-credit-rules.md#concrete-schema-and-program-outline) retains legacy income
and requires reclassifying `oth` into pension receipts without changing cash; its reference-case requirements
preserve unrelated existing behavior and locked baselines. Neither that specification nor
[SCOPE.md](../SCOPE.md) adds a prohibition on capital losses for seniors. Existing
[golden scenarios](../../tests/golden/scenarios.mjs) already include `cg: -50000`.
Thus the case remains reachable when #17 adds the specified age/pension/transfer credits. #17 is not yet built,
so this is a conclusion about its recorded scope, not a claim to have executed its future page. Disallowing
losses would be a separate scope change; the implementation issue below requires preserving this regression case.

## Concrete 2025 senior household

Both adults are 65. The claimant has $71,300 employment income and $1,719 eligible registered-pension-plan
income; the spouse has $1,719 eligible pension income. The claimant continues contributing to CPP and deducts
$678 enhanced CPP plus a valid $9,814 RRSP claim, leaving $62,527 net/taxable income. The spouse claims a
valid $1,719 RRSP deduction against unused room, leaving zero net/taxable income. Assume sufficient unused
RRSP room for both claims. Neither pension amount is CPP/OAS, and this #17 example does not automatically add
OAS or pension splitting, which the [#138 specification](138-senior-credit-rules.md) assigns to later work.
The [2025 T1](138-senior-credit-rules/sources/federal-t1-2025.txt) deducts RRSP claims at line 20800 before net
income; the [pension rules](2025/sources/seniors-pension.txt) establish eligible RPP receipts. These are ordinary
RRSP deductions against available room, not a rollover that removes pension eligibility. No foreign credits,
donations, medical/disability amounts, tuition or exceptional minimum-tax liability are assumed.

The claimant's own age base is `$6,221 − .15 × ($62,527 − $46,308) = $3,788.15`. The spouse has the full
$6,221 age base plus $1,719 pension base available for transfer; AB(S2)'s own-use deduction is zero.
The claimant's full non-tuition base is:

```text
B = 22,323 + 22,323 + 3,788.15 + 1,719 + 6,221 + 1,719 + 3,356.10 + 1,077.48
  = 62,526.73
Bracket tax = .08 × 60,000 + .10 × 2,527 = 5,052.70
Ordinary base credit = .08 × 62,526.73 = 5,002.1384
Remaining tax = 50.5616
Calculated supplement = .02 × 2,526.73 = 50.5346
Usable supplement = 50.5346
Final Alberta income tax = .0270
```

Without a capital loss, actual household income is $74,738 and the isolated supplemental saving is
0.067616 percentage points. Entering a $50,000 net capital loss leaves the same taxable income, age taper,
spouse transfer and Alberta tax calculation, but reduces the existing calculator's denominator to $24,738.
The same $50.5346 saving is then **0.204279 percentage points**, exceeding the scope threshold. The loss is
within the existing UI's range, and the UI notes explicitly describe its effect on actual income:
[input controls](../../src/ui/index.html) and [notes](../../src/ui/notes.ts).

This is a denominator-sensitive case, not evidence that a typical senior couple receives a large supplement.
It nevertheless prevents an unconditional exclusion under the scope rule as currently written. The comparison
holds all other provincial calculations fixed, so the isolated Alberta gap changes by the same 0.204279 points.

## Reproduction and additional households

Run the independent calculation from the repository root:

```sh
fnm exec --using=26 node docs/verification/147-alberta-supplemental-credit/calculate.mjs
fnm exec --using=26 node docs/verification/147-alberta-supplemental-credit/calculate.mjs --verify-model
```

The script prints all inputs, each adult's net income, age/pension bases, spouse claim, transfer, bracket tax,
remaining capacity, calculated/usable supplement, cash denominator and rate/gap changes as JSON. The default
arithmetic mode imports only Node's assertion library. The optional reachability audit reads the page and runs
the production engine separately; no mode changes production code, tax data or golden fixtures.
Literal worksheet answers check the concrete cases; synthetic threshold/tuition checks are labelled separately.
It keeps intermediate precision; displayed tax-return cents may differ by a cent without changing materiality.

The 2026 counterpart uses claimant wages $74,600, eligible pension $1,753, enhanced CPP deduction $711 and RRSP
deduction $11,762. The donor receives $1,753 eligible pension and claims $1,753 RRSP against available room.
Claimant net income is $63,880; own age base is $3,848.10; donor transfers $8,098. Under the consolidated annual
law, `B = $63,879.62`, bracket tax is $5,164, ordinary credits are $5,110.3696, remaining capacity is
$53.6304 and usable supplement is $53.5924. The donor's Alberta tax is zero in both years.

| Household | 2025 usable | 2025 rate drop | 2026 usable* | 2026 rate drop* |
| --- | ---: | ---: | ---: | ---: |
| Current worker and zero-income spouse | $0 | 0 pp | $0 | 0 pp |
| Current single parent | $0 | 0 pp | $0 | 0 pp |
| Single senior, $65,000 eligible pension | $0 | 0 pp | $0 | 0 pp |
| Senior couple above, no capital loss | $50.5346 | 0.067616 pp | $53.5924 | 0.068615 pp |
| Same couple, $50,000 capital loss | $50.5346 | 0.204279 pp | $53.5924 | 0.190680 pp |
| Loss couple, extra $10,000 income/deduction each | $50.5346 | 0.112957 pp | $53.5924 | 0.111405 pp |
| No-loss couple, donor has no RRSP deduction | $16.1546 | 0.021615 pp | $18.5324 | 0.023727 pp |
| No-loss couple, claimant deducts $27 more | $47.5376 | 0.063606 pp | $50.6064 | 0.064792 pp |
| No-loss couple, claimant net income $45,000 | $0 | 0 pp | $0 | 0 pp |

`*` 2026 follows the consolidated annual law and published indexed amounts. Only the effect/applicability of
the consolidation's omitted 2026 c3 s2 amendment remains unverified; see below.

The extra-income variant increases each adult's ordinary taxable receipts and RRSP deduction by $10,000,
leaving every credit base and tax-capacity figure unchanged. Household income after the loss becomes $44,738
in 2025 and $48,106 in 2026. It shows headroom for other taxable income; $10,000 is a chosen input, not an OAS
payment estimate. Re-evaluate complete future #18–20 interactions when their benefit/splitting rules exist.

Increasing the claimant RRSP deduction by $27 produces a partial-capacity case: the calculated supplement is
$50.6156 in 2025 but only $47.5376 is usable. At $45,000 claimant net income, the full permitted base instead
gives calculated supplements of $99.1916/$103.5304 with **zero** usable relief. These cases rule out simply
adding the nominal worksheet credit to household refunds.

For every row, the signed change to `Alberta effective rate − comparator effective rate` is the negative of
the displayed rate drop. Federal taxes, benefits, payroll, sales/property/fuel taxes and the other province's
taxes do not change when this one credit is toggled at fixed inputs. Thus no full thirteen-province simulation
is needed to establish this isolated gap effect; this does not claim a particular ranking reversal.

## Follow-up recommendation

No correction to existing non-senior results is needed for this credit: supported current bases make it zero.
For #17, scope a linked supplemental-credit implementation for the verified 2025 annual rule, including the
existing spouse claim, new age/pension bases, verified unused spouse transfers and the final remaining-tax cap.
Treat it as part of completing those senior results, rather than adding disability, medical or other excluded
inputs merely to enlarge the credit. Age-aware payroll remains a prerequisite for the employed senior example.

The annual Act now establishes the 2026 mechanism and indexation. Resolve the narrow 2026 c3 s2 currency check
before treating its numeric cases as unconditionally final. The implementation should reproduce the capital-loss
case and its no-loss counterpart, the threshold floor and the capacity limit with independently calculated golden
cases, while preserving unrelated baselines and the existing signed capital-gain input.

### Proposed implementation issue (orchestrator to file)

**Title:** Apply Alberta supplemental credit to supported senior credit bases and remaining tax

**Body:**

Alberta's supplemental credit becomes material with #17 age/pension/spouse-transfer inputs and existing
capital losses. The independently verified 2025 case in
[the #147 sizing report](147-alberta-supplemental-credit.md#concrete-2025-senior-household) saves $50.5346,
changing the household effective rate and Alberta province gaps by 0.204279 percentage points. Current inputs
without #17 credits produce no supplement. This is a narrow correction within supported inputs.

Blocked by: #17 credit-base and spouse-transfer integration, including age-aware payroll. The annual Act
supports the 2026 mechanism; verify the omitted 2026 c3 s2 amendment's commencement and applicability before
promoting the report's conditional 2026 numbers to final expected values.

Acceptance criteria:

- Implement the verified annual formula and non-refundable remaining-tax cap with sourced year parameters.
  Preserve qualifying credit bases separately from the credits actually absorbed by tax; a used-credit-dollar
  subtotal would lose the excess that generates this supplement.
- Include basic, spouse/eligible-dependant, base CPP/EI, own age/pension and eligible unused spouse-transfer
  bases. Exclude tuition, enhanced CPP, donations, dividend/foreign credits and unsupported credit inputs.
- Apply the supplement after the annual return's prior adjustments and floor Alberta tax at zero. It cannot
  become a refundable benefit, exceed remaining tax or be shared as an extra spouse-transfer amount.
- Add independent 2025 golden cases for the exact no-loss and $50,000-loss household above: bases $62,526.73,
  capacity $50.5616 and usable relief $50.5346. The loss changes only the effective-rate denominator here.
- Add the claimant RRSP $9,841 variant: base $62,530.78, calculated supplement $50.6156, usable $47.5376.
  Add the $45,000-net-income variant: base $64,959.58, calculated $99.1916, usable zero.
- Cover donor RRSP zero (spouse net $1,719, reduced spouse claim, usable $16.1546), transfer own-use limits,
  subtotal below/at/above $60,000, tuition exclusion, and current non-senior households with zero supplement.
  Use targeted component tests for synthetic boundaries that supported household fixtures cannot reach exactly.
- Preserve unrelated existing golden cases and tax data. The report reconciles 2026 annual formula, indexation,
  spouse-transfer and ordering rules under the consolidation; close the identified amendment check and add
  equivalent independent cases then. Retain negative capital gains in the page, persisted inputs and engine.
- Confirm the same dollar correction flows to both effective rates and Alberta-versus-province gaps, with no
  new user inputs. Do not expand into disability, medical, tuition or future self-employment modeling.

Refs #17, #138, #141, #147. This is a proposed issue body, not an issue filed by this research task.

## Annual 2026 statutory verification and the remaining amendment check

The [full Act](2026/sources/ab-pita-act.txt), unlike the earlier three-page child-benefit extract, establishes
the following annual rules. Page references are PDF page numbers, not the printed page numbers:

| Provision | PDF pages | Consequence for this study |
| --- | --- | --- |
| Section 4 | 12 | Specified credit percentage is 8% for 2025 and subsequent years. |
| Sections 8, 9, 10 | 18–24 | Personal/spouse bases, 15% age taper and eligible pension base. |
| Section 19 | 32 | CPP/EI credit follows federal section 118.7 at Alberta's specified percentage. |
| Section 20.1 | 32 | Incorporates federal spouse-credit transfers, with its stated modification. |
| Section 20.2 | 32 | Annual supplement is 25% of qualifying credit dollars exceeding $4,800, before indexation. |
| Sections 7 and 42 | 18, 62 | Deduct against tax; section 20.2 is last in the mandatory credit order. |
| Section 44.2(1), (4) | 63–65 | Indexes section 20.2 dollars after 2025 and rounds to the nearest whole dollar. |

Section 20.2 includes deductions under sections **8–10, 12–13.1, 18, 19 and 20.1**. That is the annual-law
basis for including personal, age, pension, medical/disability/adoption, student-loan, payroll and spouse-transfer
credits and excluding tuition (section 17), donations (section 11), dividend, foreign and political credits.
The unsupported included categories remain zero in this study. For the supported subset, its tax-dollar `A`
equals `.08B`; it is not another credit base to multiply by 8% again. Section 42 places dividend, foreign and
political credits before the supplement, consistent with 2025 AB428's remaining-tax calculation. Section 20.1
continues the legal basis of the AB(S2) transfer method; no new 2026 transfer rule is inferred from a TD1 checkbox.

Section 44.2 expressly lists **section 20.2**, so indexing the supplemental offset is required independently
of indexing the tax brackets. Its escalator is a prescribed percentage, if one was prescribed by the start
of the year, otherwise the nonnegative Alberta CPI calculation capped at 2%. The published 2026 amounts in
[TD1AB](138-senior-credit-rules/sources/td1ab-2026.txt) and
[T4127](138-senior-credit-rules/sources/t4127-2026.txt) reconcile to a 2% adjustment:

```text
supplemental offset: 4,800 × 1.02 = 4,896
qualifying base threshold: 4,896 / .08 = 61,200
personal amount: round(22,323 × 1.02) = 22,769
age maximum: round(6,221 × 1.02) = 6,345
age threshold: round(46,308 × 1.02) = 47,234
pension maximum: round(1,719 × 1.02) = 1,753
S2026 = .25 max(0, .08B − 4,896) = .02 max(0, B − 61,200)
usable relief = min(S2026, remaining Alberta tax after prior credits)
```

These are published indexed amounts reconciled to the statutory mechanism, not a newly estimated inflation
factor. The script checks every listed indexation result and keeps the supplemental offset separate from the
bracket threshold. The Act therefore closes the previously missing annual base, exclusion, ordering and
indexation evidence; the calculation no longer relies on treating withholding instructions as annual law.

**Precisely unresolved:** the supplied consolidation says **current as of December 11, 2025** on PDF page 1.
Page 2 lists **2026 c3 s2, amending sections 8 and 44.2**, under amendments not incorporated because they were
not in force at the consolidation date. The July 2026 PDF modification date does not replace that legal cutoff.
The cache does not contain that amending provision or its commencement/application provisions. Consequently,
this report cannot establish whether it changes personal-credit eligibility/amounts or indexation for the
**2026 taxation year**, or only a later year. Its text and effective dates must be checked before removing
the narrow qualification on the 2026 numbers. The note alone neither proves a 2026 change nor proves the
amendment was still uncommenced on November 3, 2026. No unresolved annual-mechanics question is being hidden
behind a general request to wait for forms.

This residual check does not alter the independently verified 2025 materiality finding. No source in the
supplied cache establishes an additional operative restriction on the worked households, and no such
restriction is assumed. The study does not extrapolate the 2025 introduction into earlier tax years.

The bounds cover current employment, investment, deduction and family inputs plus the proposed #17 age/pension
and spouse transfers. Revisit them when disability, medical, caregiver, adoption, student-loan or other eligible
amounts become supported. Those amounts can materially enlarge `B`; excluded tuition and donation credits
cannot simply be inserted into it. Any later implementation needs separate golden cases for threshold,
remaining-tax, transfer and loss-denominator paths, without recapturing unrelated existing baselines.

## Validation and handoff

The calculation passes 67 named arithmetic checks plus bound, capacity and materiality assertions; running
`--verify-model` adds 15 executed input/engine checks for **82** in total. Markdown
validation, lint, typecheck, all 1,055 existing tests and the build passed under Node 26. Browser smoke was
attempted but Chromium failed at sandbox launch with `bootstrap_check_in ... Permission denied (1100)`.
The orchestrator must run the full check outside this sandbox before committing. No production code, tax data
or existing golden baselines were edited. The supplied Act and source-index changes belong to the orchestrator;
this follow-up edits only the two verification deliverables and the two requested handoff files.

# Alberta supplemental tax credit: rules and sizing

Research for #147, following [#138's senior-credit study](138-senior-credit-rules.md). Checked on 2026-11-03
against cached primary sources. This is a sizing study, not an engine implementation or completion of #17.

**Conclusion: below threshold for current and proposed #17 inputs.** Current Alberta credit bases cannot
trigger the supplement. With #17's age, pension and spouse-transfer bases, verified maximum usable relief is
**$50.54 in 2025 and $53.59 in 2026**. The household effective-rate and province-gap bounds are **0.0808 and
0.0839 percentage points**, below the [0.1-point scope test](../SCOPE.md#how-scope-is-decided).

Those rate bounds use nonnegative income components. A freely chosen, unrelated capital loss can shrink the
displayed denominator without changing the credit or tax capacity. The loss case is retained as a disclosed
sensitivity, but does not establish materiality: otherwise any nonzero program could be made to pass the rule.
This is the orchestrator's scope decision for #147; it does not change the calculator's accepted inputs or
edit SCOPE.md. No implementation issue is proposed, and this credit is not a blocker for #17. Revisit sizing
after #18 automatic OAS and #20 pension splitting land and their combined household effects can be measured.

The annual rules and 2026 indexed amounts are verified against the full Alberta Act and CRA publications.
The separately checked 2026 c3 s2 amendment takes effect January 1, 2027 and changes caregiver provisions,
not section 20.2 or the supported credit bases. Both annual calculations are verified.

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
| [Full Alberta Act](2026/sources/ab-pita-act.txt) | Sections 4, 7–10, 19, 20.1, 20.2, 42 and 44.2. |
| [2026 amending Act](2026/sources/ab-fiscal-measures-2026.txt) | Section 2: caregiver changes from January 1, 2027. |

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
the dollar maximum and income threshold. The separate 2026 amendment does not take effect until 2027.

| Parameter | 2025 | 2026 |
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

| Bound | 2025 | 2026 |
| --- | ---: | ---: |
| `M(t)` in the relevant taper band | $71,905.78 − .15t | $73,461.62 − .15t |
| Intersection taxable income/base | $62,526.765217 | $63,879.669565 |
| Maximum usable supplemental credit | $50.535304 | $53.593391 |

At most one spouse can receive a usable supplement. The recipient must have taxable income above `q`, hence
net income exceeding the spouse-amount maximum. The other spouse cannot claim a spouse amount for that person;
even generously allowing both age/pension bases and payroll on the other spouse cannot reach `q` without it.
Thus the individual dollar bound is also a household dollar bound for these supported inputs.

## Household-rate bound and capital-loss sensitivity

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
**0.080822 percentage points for 2025** and **0.083897 points for 2026**. These are the bounds used for the
below-threshold scope conclusion. The same isolated Alberta correction changes its gap to any unaffected
province by that amount. No affected household in this nonnegative-income subset reaches 0.1 points.

The mathematical rate bound assumes nonnegative gains. The [Person type and cashOf](../../src/engine/types.ts)
allow negative net capital gains and include them, signed, in cash income. Its
[netIncomeParts](../../src/engine/payroll.ts) instead counts a net capital loss as zero for current taxable
income. Thus a household with the same positive supplemental saving can have smaller positive displayed income
after realizing a loss. The preceding `H` inequality then does not apply. Reachability and the resulting
displayed rates are disclosed below; they do not turn the unrelated loss into evidence of a material credit.
The amount of the loss is a free parameter. For any positive saving `u`, choosing a loss that brings positive
household cash close to zero makes `100u/H` arbitrarily large. That would make the scope test unable to exclude
any nonzero program. The orchestrator therefore directs sizing from the verified no-loss bounds above.

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
[SCOPE.md](../SCOPE.md) adds a prohibition on capital losses for seniors. The existing
[golden scenario](../../tests/golden/scenarios.mjs) with wages $50,000 and `cg: -50000` tests the zero-cash guard;
it does not establish a representative household for sizing a credit.
Thus the case remains reachable when #17 adds the specified age/pension/transfer credits. #17 is not yet built,
so this is a conclusion about its recorded scope, not a claim to have executed its future page. Disallowing
losses would be a separate scope change. Their continued acceptance is compatible with treating unrelated
losses as sensitivities rather than scope evidence.

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
The same $50.5346 saving is then **0.204279 percentage points**, a denominator sensitivity only. The loss is
within the existing UI's range, and the UI notes explicitly describe its effect on actual income:
[input controls](../../src/ui/index.html) and [notes](../../src/ui/notes.ts).

Holding the qualifying base and $50.5346 usable relief fixed gives the following sensitivity. The isolated
Alberta gap changes by the same displayed amount because all other provincial calculations are held fixed.

| Unrelated capital loss | Household cash | Displayed effect |
| ---: | ---: | ---: |
| $0 | $74,738 | 0.067616 pp |
| $24,204 | $50,534 | 0.100001 pp |
| $50,000 | $24,738 | 0.204279 pp |
| $74,000 | $738 | 6.847507 pp |
| $74,700 | $38 | 132.985789 pp |

Typed losses can exceed the slider endpoint; the amount handler caps their magnitude at 99,999,999.
None of these losses changes eligibility, qualifying bases, remaining tax or usable relief. Their apparent
threshold crossings therefore do not change the below-threshold conclusion.

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

| Household | 2025 usable | 2025 rate drop | 2026 usable | 2026 rate drop |
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

Rows containing a capital loss are denominator sensitivities, excluded from the scope determination.

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

## Decision and when to revisit

Close #147 through its below-threshold branch. Current inputs yield no supplement; with #17's supported
senior credits, maximum relief and rate/gap effects remain below the scope threshold when sized without an
unrelated loss shrinking the denominator. Do not implement the credit or make it a prerequisite for #17 on
this evidence. No implementation issue is proposed.

Revisit the sizing **after #18 automatic OAS and #20 pension splitting land**. The current worked household
is a #17 case, not a completed-retirement-model case: [SCOPE.md](../SCOPE.md) requires full OAS automatically
for eligible adults, and splitting will change each adult's net income, own credits, spouse claim, transfers
and remaining tax. Recalculate the complete household with those rules and actual year-specific receipts
before drawing a new scope conclusion. No pension-splitting optimum is claimed by this report.

### OAS effect on the worked household

The [ESDC Q4 2025 table](2025/sources/seniors-oas-q4.txt) gives $740.09 monthly OAS at ages 65–74.
Following [#16's convention](16-seniors-sizing.md), use `$740.09 × 12 = $8,881.08` per adult as an annualized
run-rate sensitivity. This is **not calendar-2025 OAS receipts**, nor a 2026 entitlement estimate.
OAS enters ordinary income and cash, but does not qualify for the pension-income credit.

Adding that amount to each adult without increasing the original RRSP claims raises claimant net income to
$71,408.08 and spouse net income to $8,881.08. The own age base falls by `$8,881.08 × .15 = $1,332.162` and
the spouse claim falls by $8,881.08. The donor still transfers the same age/pension bases. Therefore:

```text
new qualifying base = 62,526.73 − 1,332.162 − 8,881.08 = 52,313.488
calculated and usable supplemental relief = 0
```

Increasing each RRSP claim by $8,881.08 restores the original $62,526.73 base and $50.5346 usable relief.
Cash still rises by $17,762.16: the effect becomes **0.054632 points without the loss**, or **0.118904 points
with it**. The latter remains an excluded denominator sensitivity. The donor would have to claim **$10,600.08**
against accumulated RRSP room despite zero current earned income and a page room estimate of $0; it is not
an automatic deduction created by OAS. These additional deductions are an assumption about available room.

For comparison, removing the donor's $1,719 RRSP claim from the original, pre-OAS loss case leaves only
$16.1546 usable relief: **0.065303 points**, already below threshold even with the $50,000 loss. Adding OAS
and fully deducting it for the claimant, while leaving the donor with no RRSP claim, gives a $51,926.65 base
and zero supplement. The script reproduces all four OAS variants and the pre-OAS donor-deduction sensitivity.

These results show why the favorable #17 household cannot simply be carried through the milestone unchanged.
The eventual #18/#20 re-evaluation must include automatic OAS and the actual split selected per province,
not just reclassify a pension field or assume additional deductions. Independently verify any newly material
case before proposing implementation; also resize if future supported credit categories enlarge the subtotal.

## Annual 2026 statutory verification

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

The principal Act's consolidation is current as of December 11, 2025 and lists 2026 c3 s2 as unincorporated.
That question is settled by the separately read
[Fiscal Measures Statutes Amendment Act, 2026](2026/sources/ab-fiscal-measures-2026.txt), PDF pages 3–5:

- Section 2(2) repeals the in-home caregiver clause 8(1)(d), replaces clause 8(1)(e) with an Alberta caregiver
  credit, and makes related adjustments to clauses 8(1)(f) and 8(2). It does not amend basic/spouse amounts
  under 8(1)(a)–(c), the age amount in section 9, the pension amount in section 10, or section 20.2.
- Section 2(3) removes the repealed caregiver clause from indexation and adds subsection 44.2(1.01), which
  specifies indexation of the replacement caregiver amounts for the **2027 taxation year**.
- Section 2(4) states that section 2 comes into force **January 1, 2027**.

Thus the amendment does not affect 2026 or the supported bases sized here. The annual 2025–2026 calculations
are verified without the previous qualification. Section 20.2's enactment is attributed to 2025 c9 in the
principal Act; this study does not apply the credit to the model's 2019–2024 historical years.

The bounds cover current employment, investment, deduction and family inputs plus the proposed #17 age/pension
and spouse transfers. Revisit them when disability, medical, caregiver, adoption, student-loan or other eligible
amounts become supported. Those amounts can materially enlarge `B`; excluded tuition and donation credits
cannot simply be inserted into it. Any future implementation would first require independently established
materiality for the expanded model and separate golden cases, preserving unrelated existing baselines.

## Calculation checks

The calculation has 88 named arithmetic checks plus bound, capacity and sensitivity assertions. Running
`--verify-model` adds 15 executed input/engine checks for 103 in total. The loss sweeps preserve credit bases
and usable relief while varying only the denominator. The OAS variants check changed bases, relief and cash
against independent calculations above. Neither set is a simulation of #20's future splitting optimizer.

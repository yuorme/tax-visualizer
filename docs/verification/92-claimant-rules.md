# Issue 92: program-specific spouse claimants

## Coverage and evidence

The 2025 claimant rules are verified against cached CRA guides and forms. The same rules are enabled in 2026
as **provisional continuations**, with `estimated: true` on each claimant program. CRA's 2026 return guides/forms
are not yet published; this is not verification of the 2026 return rules. All 2019–2024 data and goldens remain
unchanged. No senior transfers are implemented, and the existing single-parent child eligibility/counting model
is outside this spouse-allocation change.

| Program | 2025 source | Claimant and transfer rule |
| --- | --- | --- |
| SK child | 5008-PC line 58210; SK(S2) lines 1, 6–13 | Lower taxable income initially; unused base transfers |
| NS child | 5003-PC line 58230; NS(S2) | Lower net income; choose on a tie; no child transfer |
| NU child | 5014-PC line 58230; NU(S2) lines 1, 6–13 | Lower net income initially; unused base transfers |
| NS reduction | NS428 pp. 3–4; 5003-PC reduction section | Either spouse; no unused-reduction transfer |
| NB reduction | NB428 lines 68, 86, 88–90; 5004-PC | Either spouse; unused reduction transfers |
| NL reduction | NL428 lines 86, 103, 106–108; 5001-PC | Either spouse; unused reduction transfers |
| PE reduction | PE428 lines 66, 87, 99–101; 5002-PC | Either spouse; unused reduction transfers |
| ON child reduction | ON428 p. 3, lines 75–76 | Higher net income; existing behavior retained |
| Federal spouse | TD1 2026 line 7 | Supporting spouse; existing higher-net-income proxy retained |

All six 2025 guides are cached under `docs/verification/2025/sources/` as `{sk,ns,nu,nb,nl,pe}-guide-2025.txt`.
The forms and schedules below are cached under `docs/verification/138-senior-credit-rules/sources/`.
T2036 is cached at `docs/verification/2025/sources/t2036-2025.txt`, including its line 5 cap and note 4.

Official guides:

- [CRA SK 2025 guide][sk-guide]

[sk-guide]: https://www.canada.ca/en/revenue-agency/services/forms-publications/tax-packages-years/general-income-tax-benefit-package/saskatchewan/5008-pc.html

- [CRA NS 2025 guide][ns-guide]

[ns-guide]: https://www.canada.ca/en/revenue-agency/services/forms-publications/tax-packages-years/general-income-tax-benefit-package/nova-scotia/5003-pc.html

- [CRA NU 2025 guide][nu-guide]

[nu-guide]: https://www.canada.ca/en/revenue-agency/services/forms-publications/tax-packages-years/general-income-tax-benefit-package/nunavut/5014-pc.html

- [CRA NB 2025 guide][nb-guide]

[nb-guide]: https://www.canada.ca/en/revenue-agency/services/forms-publications/tax-packages-years/general-income-tax-benefit-package/new-brunswick/5004-pc.html

- [CRA NL 2025 guide][nl-guide]

[nl-guide]: https://www.canada.ca/en/revenue-agency/services/forms-publications/tax-packages-years/general-income-tax-benefit-package/newfoundland-labrador/5001-pc.html

- [CRA PE 2025 guide][pe-guide]

[pe-guide]: https://www.canada.ca/en/revenue-agency/services/forms-publications/tax-packages-years/general-income-tax-benefit-package/prince-edward-island/5002-pc.html

Official forms and schedules:

- [SK(S2) 2025](https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5008-s2/5008-s2-25e.pdf)
- [NU(S2) 2025](https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5014-s2/5014-s2-25e.pdf)
- [NS(S2) 2025](https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5003-s2/5003-s2-25e.pdf)
- [NS428 2025](https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5003-c/5003-c-25e.pdf)
- [NB428 2025](https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5004-c/5004-c-25e.pdf)
- [NL428 2025](https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5001-c/5001-c-25e.pdf)
- [PE428 2025](https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5002-c/5002-c-25e.pdf)
- [T2036 2025](https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/t2036/t2036-25e.pdf)
- [ON428 2025](https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5006-c/5006-c-25e.pdf)
- [TD1 2026](https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/td1/td1-26e.pdf)
- [TD1SK 2026](https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/td1sk/td1sk-26e.pdf)

The SK return guide resolves the previous wording question: **taxable** income determines the initial claimant.
The payroll TD1SK says net income; the return guide controls the modeled return. These income bases coincide
for the currently modeled SK inputs, but the distinction is explicit for future income/rule work.

NS expressly permits an election on equal net incomes. SK and NU prescribe a lower-income initial claimant
without a separate tie-breaker: at equality neither spouse has priority, so the model compares the two whole
claims and chooses the lower final household tax. This tie convention is an interpretation of those guides,
not a quotation of an explicit SK/NU tie sentence. It does not split the initial claim. Binary arithmetic
roundoff (such as `20000 * 1.38`) does not turn mathematically equal incomes into a strict ordering.

NS(S2)'s transferable pool excludes the child amount. NS428 has no unused family-reduction transfer line.
NU(S2) includes the child amount; SK(S2) includes it with other transferable bases. NB/NL/PE explicitly provide
unused-reduction transfers. NB428 (66, 86), NL428 (73, 104) and NS428 (63, 84) apply FTC before the reduction.
PE428 applies the reduction at line 87 before FTC at line 89; a transferred reduction is also before FTC (66).
PE's unused reduction is line 87 less line 65, floored at zero (99–101), not a balance measured after FTC.
T2036 note 4 therefore uses PE tax after the reduction. Its line 5 caps the credit at tax otherwise payable,
including when foreign dividends exceed net income after deductions.

## Provisional 2026 continuation

Checked cached `td1sk-2026`, `td1ns-2026`, `td1nu-2026`, `td1nb-2026`, `td1nl-2026`, `td1pe-2026`,
`t4127-2026`, `ns-indexation` and `sk-parameters-2026` under the senior-rule source cache. They do not signal
a change to the verified claimant/transfer rules. The SK parameters explicitly describe lower-income initial
claims and unused transfers, and TD1SK permits child transfers. None substitutes for unpublished 2026 return forms.

Accordingly, SK/NS/NU child allocation and NS/NB/NL/PE family-reduction allocation/order are carried into 2026
with program-level `estimated: true` and a provisional-continuation comment. Existing annual amounts/rates are
unchanged; their pre-existing estimate flags remain separate. `docs/SCOPE.md` lists this estimate coverage.

## Calculation and extension seams

`Province.claimants` opts each year's programs into these paths. Omission retains the historical calculation.
Child bases, child transfers and low-income reductions have separate context inputs. None changes the
supporting-spouse election or Ontario's higher-net-income child-reduction context. Discretionary reduction
elections and eligible tied child elections are evaluated jointly using final household tax, including FTC.
On an equal final result the first legal election is retained, within floating-point roundoff.

For Saskatchewan and Nunavut, let `T` be donor bracket tax and `r` the lowest provincial/territorial rate:

```text
capacity = max(0, (T - basic-personal-credit - contribution-credits) / r)
unused pool = max(0, child base - capacity)
```

Schedule 2 does not subtract spouse, dividend or foreign credits when finding capacity. Above the first bracket,
it uses bracket tax divided by the lowest rate, not taxable income. The receiver applies the unused base once
as a non-refundable credit before dividends and FTC. An excess never becomes a refund. The existing `pKid`
display subtotal includes received child credits; the nested breakdown identifies the transferred base/share.
Both identical Schedule 2 paths use `transfer: schedule-2`; separate province-named ids served no behavior.
The reduction's required `order` field selects its position relative to FTC, with no province-code engine check.

`unusedSpouseTransferBase` is the seam for #17: combine child, age, senior supplementary, pension and other
applicable bases in **one** Schedule 2 pool, then subtract donor capacity once. Do not calculate separate
child and senior capacities and add the results. This issue introduces no senior transfer behavior.
For #145, use existing supporting-spouse context `c` or add Manitoba's own key and decide ties. Do not reuse
`claimants.childAmount`: that key permits only lower-income claimants. No #145 behavior is implemented here.

## Independent checks and feature goldens

`tests/golden/features/claimants.json` has 82 independently calculated cases, with no capture mode. Its runner
uses a 1e-8 dollar tolerance, preserving exact decimals rather than introducing four-place rounding ties.
Every two-spouse case reverses person order and checks unchanged total household tax. A data test checks all
six provinces' 2025/2026 claimant coverage and verifies that every 2026 continuation is marked estimated.

| Feature cases | Independent calculation / boundary |
| --- | --- |
| SK 2026 repro | A net 29,735; base CPP 1,311.75; EI 489; BPA 20,381; tax before children 793.09125 |
| SK 2026 repro | B tax `(29,500 - 20,381) × .105 = 957.495`; child base 33,432; transfer 24,313 |
| SK 2025 repro | A EI 492 and BPA 19,491 give 886.22625; B 1,050.945; base 30,816; transfer 20,807 |
| SK full transfer | A other income 50,000, B zero: two 20,381 bases leave 969.99; child saves 877.59 |
| SK transfer boundary | Donor 28,739 = 20,381 + 8,358; one dollar below transfers 1, one above leaves .105 tax |
| SK upper bracket | Donor 60,000: tax 6,409.36 less BPA 2,140.005 and child 877.59 = 3,391.765 |
| SK dividend/foreign | Donor base 27,600 needs 7,219; only 1,139 transfers despite donor's final zero tax |
| SK tied incomes | Both 29,500: initial A; combined 1,914.99 less 877.59 = 1,037.4 |
| SK net vs gross | A employment 30,000 has lower net than B other 29,900; A claims, transfers base 804.75 |
| SK no children | 793.09125 + 957.495 = 1,750.58625; no transfer |
| SK non-spouses | Preserve original allocation; no cross-person transfer; B still pays 957.495 |
| NB partial transfer | Tax 620.776 + 526.776; reduction 1,604 - .03 × (39,000 - 21,920) = 1,091.6 |
| NL transfer | Tax 777.171 + 690.171; reduction 1,554 exceeds both taxes combined |
| PE child transfer | Tax 508.25 + 413.25; reduction 700 + 1,200 - .05 × (39,000 - 22,650) = 1,082.5 |
| NS best election | A grossed dividends 20,700 give zero tax; B tax 725.7024; six-child reduction 305 goes to B |
| NS no transfer | Each 13,000 gives 110.4024 tax; reduction 710 wipes one only, leaving 110.4024 |
| NB/NL/NS full foreign | Income 20,000, withholding 40%; FTC wipes tax before reduction |
| PE full foreign | Line 65 = 508.25; reduction 350; FTC 158.25; unused reduction 0 |
| All four phaseout cases | Family ceilings NB 75,386.6667, NL 50,172.5, PE 36,650, NS 27,000; ±1 and exact |
| Federal spouse | Supporting A claims `(16,452 - 10,000) × .14 = 903.28`; SK child initially belongs to B |
| ON before/after | B 29,734/29,736 crosses A net 29,735; child reduction switches, and A's LIFT absorbs A's tax |

Additional independently calculated cases for the completed NS/NU and tie paths:

| Cases | Independent calculation / boundary |
| --- | --- |
| NS zero lower income, 2025/2026 | Child stays unused on zero-income spouse; higher spouse pays 557.4048/524.3544 |
| NS lower spouse uses child, both years | Income 30,000 + 20,000; tax `(50,000 - 2 × BPA - 1,200) × .0879` |
| NS child tie ±1 | A dividends gross to 20,700; B at 20,699/20,700 claims; at 20,701 only A may claim |
| NS joint child/reduction tie | Both net 14,000; B has CPP 537.075 and EI 235.34; best child B, reduction A |
| NS joint tie result | A reduction 198.3024; B tax `(14,000 - 11,744 - 537.075 - 235.34 - 1,200) × .0879` |
| NS no under-6 | Older children do not create a child amount; income 50,000 has no family reduction |
| NU full transfer, 2025/2026 | Income 50,000 + zero; two BPAs plus 1,200 base give tax 410.08/379.28 |
| NU partial transfer, both years | Lower spouse 20,000 uses 29.04/13.64; transfers base 474/859 |
| NU capacity boundary | Donor 20,474 = 19,274 + 1,200; ±1 yields transfer base 1/0, or own tax .04 |
| NU dividend/foreign | Donor net 20,000 uses child base 726 before DTC/FTC; only base 474 transfers |
| NU tie | Net 20,000 each; A dividends wipe own tax; B claims first, saving 29.04, and total tax is zero |
| SK tie | Net 27,600 each; A dividends wipe own tax; B claims, transfers 1,139 base; total tax is zero |
| NU upper bracket | Donor 60,000: `54,707 × .04 + 5,293 × .07 - 19,274 × .04 - 48 = 1,739.83` |
| NU no under-6 | Income 30,000 + 20,000: `(50,000 - 2 × 19,274) × .04 = 458.08` |
| NB 2026 transfer | Tax 595.584 + 501.584; reduction 1,636 - .03 × (39,000 - 22,358) = 1,136.74 wipes both |
| NL 2026 transfer | Tax 600.822 + 513.822; reduction 842 + 563 = 1,405 wipes both |
| PE 2026 transfer | Tax 475 + 380; reduction 700 + 1,200 - .05 × (39,000 - 23,000) = 1,100 wipes both |
| NS 2026 best election | A dividends wipe own tax; B `(20,000 - 11,932) × .0879 - 305 = 404.1772` |
| NS 2026 no transfer | Both 13,000; reduction wipes one, leaving `(13,000 - 11,932) × .0879 = 93.8772` |

The Saskatchewan reproduction is $957.495 before the change and $0 afterwards (2026 provincial income tax).
Ontario's switch remains at **net** income: in that example A's $30,000 employment produces net income $29,735.

`tests/claimants-audit.test.ts` checks 15,168 provincial calculations: all 148 shared and 10 original other-income
scenarios, six affected provinces, two years, six $100 income bumps and an investment-free counterfactual alongside
the original household. Its independent worksheet, `tests/claimants-forms.ts`, imports no engine functions or
runtime YAML. It derives net income, payroll, bracket tax, basic/spouse/child credits, federal FTC, provincial FTC,
reductions and transfers from household inputs and separately typed constants. The 2025 provincial bases and
brackets come from cached 428 forms; federal T1 and existing verified contribution/dividend parameters supply the
unchanged federal steps. The 2026 constants are transcribed from annual YAML and test the provisional formulas;
they are not independent verification of unpublished 2026 return figures.

The worksheet follows each form's own order and checks 14 individual values, including FTC, used/unused reduction
and child transfers, as well as household provincial tax. On equal final tax, all individual lines must match
one legal whole election. It also checks 147 feature households including reversed spouses (the two ON fixtures
are outside its six-province scope). A negative-control test reverses PE's order: total tax stays zero, but the
audit rejects the incorrect individual lines. No expected amount comes from `household()` or `personTax()`.

Round 2 adds 16 feature goldens: eight mixed-share singles, six FTC-plus-transfer couples and two over-cap NL
couples. Every group covers both 2025 and the provisional 2026 continuation. The following calculations use no
payroll or dividend credits; all stated tax amounts are after the basic personal credit.

| Mixed-share single | Income (half foreign), withholding 15% | 2025 tax / 2026 tax |
| --- | --- | --- |
| NB | 30,000; tax 1,560.776 / 1,535.584; FTC half; reduction 559.60 / 588.74 | 220.788 / 179.052 |
| NL | 28,000; tax 1,473.171 / 1,296.822; FTC half; reduction 345.48 / 232.56 | 391.1055 / 415.851 |
| NS | 20,000; tax 725.7024 / 709.1772; FTC half; reduction 50 | 312.8512 / 304.5886 |
| PE | 20,000; tax 508.25 / 475; subtract 350, then FTC half | 79.125 / 62.5 |

| Couple (2025 / 2026) | Independent return-line calculation |
| --- | --- |
| NB, A 3,000 other + 27,000 foreign; B 20,000 other | Family reduction 761.60 / 806.74 |
| NB line 90 | A uses 156.0776 / 153.5584 after 90% FTC; transfers 605.5224 / 653.1816 |
| NB result | B tax 620.776 / 595.584; final 15.2536 / 0; 2026 excess 57.5976 is not refunded |
| NL, A 3,000 other + 27,000 foreign; B 18,000 other | Family reduction 347.60 / 269.80 |
| NL line 108 | A uses 164.7171 / 147.0822 after 90% FTC; transfers 182.8829 / 122.7178 |
| NL result | B tax 603.171 / 426.822; final 420.2881 / 304.1042 |
| PE, A 15,000 / 15,350 other; B 10,000 other + 10,000 foreign | Family reduction 82.50, A tax 33.25 |
| PE line 101 | A transfers 49.25; B subtracts it on line 66 before FTC at half of line 88 |
| PE result | B tax 508.25 / 475 before transfer; final 229.50 / 212.875 |
| NL, A 40,000 foreign less 8,000 FHSA; B 18,000 other | Net 32,000 + 18,000; family reduction 27.60 / 0 |
| NL cap and result | A FTC capped at 1,821.171 / 1,644.822; transfer 27.60 / 0; final 575.571 / 426.822 |

NB/NL transfer couples use 40% withholding; PE couples use 15%. The former single PE foreign fixture is renamed
`pe-reduction-before-foreign`: applied reduction 0 → 350, FTC 508.25 → 158.25, unused 350 → 0; total stays zero.
The cap fixes the reported NL 2025 phantom transfer of 482.89275 to 27.60 (a 455.29275 overstatement).
The full T2036 cap passes every unrelated locked baseline, so no transfer-only fallback or deferred cap fix is needed.

## Deferred work and issue handoff

Finding 5 is resolved: the child-claimant tooltip refers to each program's claimant and transfer rules when
the year's data includes a child-amount claimant program (2025–2026). For 2019–2024, it retains "are claimed
by the parent who claims the children". Regression tests pin the wording for all eight years.

Finding 8: PE428 line 58230 amount for young children is tracked in #162.

## Why existing values changed

The final diff against `origin/main` has **1,409 numeric leaves in 271 province/scenario results**, in only three
existing fixtures: **671** in `2025.json`, **671** in `2026.json`, and **67** in `other-income-original.json`.
Round 2 restores exactly **21 PE `margBy.fd` values** (10 in 2025, 11 in 2026) to their pre-PR values, reducing the
previous 1,430 total by 21. There is no difference from the expected 1,409. Only SK, NU, NS, NB and NL retain
changes in these existing fixtures; PE behavior is covered by the separate feature goldens. The leaves include
per-person credits, tax subtotals and derived household/marginal results, not 1,409 separate household tax totals.
Grouped for review:

| Cause | Numeric leaves | What a reviewer should expect |
| --- | --- | --- |
| SK initial claim and Schedule 2 transfer | 523 | Child credits move to the lower taxable income spouse; unused bases transfer |
| NU initial claim and Schedule 2 transfer | 292 | Under-6 credits move to the lower net income spouse; unused bases transfer |
| NS child claimant and resulting interactions | 520 | Lower net income must claim; unused child credit cannot move to the spouse |
| FTC order, isolated foreign marginal changes | 70 | NB/NL/NS foreign bumps apply FTC before family reductions |
| Family-reduction transfer in investment-free comparison | 4 | Actual tax unchanged; better comparison tax raises reported investment tax |

Most SK/NU rows only reallocate credits between people without changing the household total. SK case 39 raises
tax: the mandated donor consumes child base before their dividend credit, leaving less available to the other
spouse. NS can also raise tax when the mandatory lower-income claimant cannot use the credit; allowing a transfer
would violate its rule. These changes are required even when they increase modeled tax.

The four isolated investment comparisons are NB/NL scenario 143 in each year. Their `invTax` increases by
63.3325/261.2393 in 2025 and 38.2815/85.0207 in 2026, because unused family reductions now reach the other spouse
in the investment-free comparison. The main household provincial tax is unchanged.

Some .0001 SK changes occur at binary rounding ties after reallocating the same family credit. Every changed
numeric leaf is listed below. Inputs, assertions, tolerances, unrelated values and all pre-2025 fixtures are
unchanged. Corrections were applied by matching old values at specific paths, never by recapturing a year.

The round 2 PE restorations below are **removed** from the final baseline diff. Each path is
`tests/golden/<year>.json`, scenario id, `results.PE.margBy.fd`; restored values match `origin/main`.

| Year | Scenario | Reviewed c510eb99 | Restored |
| --- | --- | --- | --- |
| 2025 | 3 | 0.3727 | 0.3823 |
| 2025 | 6 | 0.7917 | 0.8162 |
| 2025 | 7 | 0.7207 | 0.7266 |
| 2025 | 10 | 0.6872 | 0.6928 |
| 2025 | 26 | 0.3439 | 0.3599 |
| 2025 | 40 | 0.6762 | 0.6872 |
| 2025 | 97 | 0.4303 | 0.4363 |
| 2025 | 101 | 0.7625 | 0.7675 |
| 2025 | 121 | 0.8226 | 0.8449 |
| 2025 | 124 | 0.3439 | 0.3599 |
| 2026 | 3 | 0.3722 | 0.3824 |
| 2026 | 6 | 0.7916 | 0.8165 |
| 2026 | 7 | 0.7066 | 0.7129 |
| 2026 | 10 | 0.6887 | 0.6949 |
| 2026 | 26 | 0.3234 | 0.3393 |
| 2026 | 40 | 0.656 | 0.6674 |
| 2026 | 72 | 0.4962 | 0.4965 |
| 2026 | 97 | 0.4372 | 0.4437 |
| 2026 | 101 | 0.7629 | 0.7681 |
| 2026 | 121 | 0.5975 | 0.6204 |
| 2026 | 124 | 0.3234 | 0.3393 |

## Exact golden corrections

`shared` means `tests/golden/<year>.json`; `other` means `tests/golden/other-income-original.json`.
`p0` / `p1` abbreviate snapshot paths `people.0` / `people.1`.

| Fixture | Year | Scenario | Province | Field | Before | After |
| --- | --- | --- | --- | --- | --- | --- |
| shared | 2025 | 3 | NB | margBy.fd | 0.376 | 0.3473 |
| shared | 2025 | 3 | NL | margBy.fd | 0.4989 | 0.465 |
| shared | 2025 | 6 | NB | margBy.fd | 0.8253 | 0.8046 |
| shared | 2025 | 6 | NL | margBy.fd | 1.0201 | 1.0005 |
| shared | 2025 | 7 | SK | p0.kidAmt | 38520 | 0 |
| shared | 2025 | 7 | SK | p1.kidAmt | 0 | 38520 |
| shared | 2025 | 7 | NU | p0.kidAmt | 2400 | 0 |
| shared | 2025 | 7 | NU | p1.kidAmt | 0 | 2400 |
| shared | 2025 | 7 | NB | margBy.fd | 0.7205 | 0.7125 |
| shared | 2025 | 7 | NS | total | -16792.0314 | -16581.0714 |
| shared | 2025 | 7 | NS | prov | 4398.4182 | 4609.3782 |
| shared | 2025 | 7 | NS | netTotal | -20651.0806 | -20440.1206 |
| shared | 2025 | 7 | NS | incomeTax | 7701.1794 | 7912.1394 |
| shared | 2025 | 7 | NS | gross | 15905.9786 | 16116.9386 |
| shared | 2025 | 7 | NS | avg | -0.2799 | -0.2764 |
| shared | 2025 | 7 | NS | grossAvg | 0.2651 | 0.2686 |
| shared | 2025 | 7 | NS | margBy.fd | 0.6545 | 0.651 |
| shared | 2025 | 7 | NS | p0.pKid | 210.96 | 0 |
| shared | 2025 | 7 | NS | p0.kidAmt | 2400 | 0 |
| shared | 2025 | 7 | NS | p0.prov | 4398.4182 | 4609.3782 |
| shared | 2025 | 7 | NS | p0.total | 12046.9294 | 12257.8894 |
| shared | 2025 | 7 | NS | p1.kidAmt | 0 | 2400 |
| shared | 2025 | 9 | SK | p0.pKid | 808.92 | 0 |
| shared | 2025 | 9 | SK | p0.kidAmt | 7704 | 0 |
| shared | 2025 | 9 | SK | p0.prov | 4283.3708 | 5092.2908 |
| shared | 2025 | 9 | SK | p0.total | 16903.2375 | 17712.1575 |
| shared | 2025 | 9 | SK | p1.pKid | 0 | 808.92 |
| shared | 2025 | 9 | SK | p1.kidAmt | 0 | 7704 |
| shared | 2025 | 9 | SK | p1.prov | 2826.8363 | 2017.9163 |
| shared | 2025 | 9 | SK | p1.total | 10591.5075 | 9782.5875 |
| shared | 2025 | 10 | SK | p0.kidAmt | 15408 | 0 |
| shared | 2025 | 10 | SK | p1.kidAmt | 0 | 15408 |
| shared | 2025 | 10 | NB | margBy.fd | 0.6659 | 0.6394 |
| shared | 2025 | 10 | NL | margBy.fd | 0.8512 | 0.8261 |
| shared | 2025 | 11 | SK | p0.kidAmt | 23112 | 0 |
| shared | 2025 | 11 | SK | p1.kidAmt | 0 | 23112 |
| shared | 2025 | 11 | NU | p0.kidAmt | 2400 | 0 |
| shared | 2025 | 11 | NU | p1.kidAmt | 0 | 2400 |
| shared | 2025 | 11 | NS | total | 27527.4001 | 27738.3601 |
| shared | 2025 | 11 | NS | prov | 14422.265 | 14633.225 |
| shared | 2025 | 11 | NS | netTotal | 23668.3509 | 23879.3109 |
| shared | 2025 | 11 | NS | incomeTax | 30055.7009 | 30266.6609 |
| shared | 2025 | 11 | NS | gross | 39422.3301 | 39633.2901 |
| shared | 2025 | 11 | NS | avg | 0.2294 | 0.2312 |
| shared | 2025 | 11 | NS | grossAvg | 0.3285 | 0.3303 |
| shared | 2025 | 11 | NS | p0.pKid | 210.96 | 0 |
| shared | 2025 | 11 | NS | p0.kidAmt | 2400 | 0 |
| shared | 2025 | 11 | NS | p0.prov | 14422.265 | 14633.225 |
| shared | 2025 | 11 | NS | p0.total | 35563.2809 | 35774.2409 |
| shared | 2025 | 11 | NS | p1.kidAmt | 0 | 2400 |
| shared | 2025 | 23 | NS | margBy.fd | 0.2753 | 0.2745 |
| shared | 2025 | 24 | NB | margBy.fd | 0.3175 | 0.3107 |
| shared | 2025 | 25 | NB | margBy.fd | 0.3175 | 0.3107 |
| shared | 2025 | 29 | SK | margBy.ed | -0.0141 | 0.1377 |
| shared | 2025 | 29 | SK | margBy.nd | 0.1547 | 0.1837 |
| shared | 2025 | 29 | SK | margBy.fd | 0.3872 | 0.4315 |
| shared | 2025 | 29 | SK | p0.pKid | 3235.68 | 1573.2098 |
| shared | 2025 | 29 | SK | p0.kidAmt | 30816 | 0 |
| shared | 2025 | 29 | SK | p0.prov | 26656.899 | 28319.3693 |
| shared | 2025 | 29 | SK | p0.total | 87702.3185 | 89364.7888 |
| shared | 2025 | 29 | SK | p1.pKid | 0 | 1662.4702 |
| shared | 2025 | 29 | SK | p1.kidAmt | 0 | 30816 |
| shared | 2025 | 29 | SK | p1.prov | 1662.4702 | 0 |
| shared | 2025 | 29 | SK | p1.total | 6908.4075 | 5245.9372 |
| shared | 2025 | 32 | SK | p0.pKid | 0 | 808.92 |
| shared | 2025 | 32 | SK | p0.kidAmt | 0 | 7704 |
| shared | 2025 | 32 | SK | p0.prov | 1662.4702 | 853.5502 |
| shared | 2025 | 32 | SK | p0.total | 6908.4075 | 6099.4875 |
| shared | 2025 | 32 | SK | p1.pKid | 808.92 | 0 |
| shared | 2025 | 32 | SK | p1.kidAmt | 7704 | 0 |
| shared | 2025 | 32 | SK | p1.prov | 10475.4891 | 11284.4091 |
| shared | 2025 | 32 | SK | p1.total | 33955.21 | 34764.13 |
| shared | 2025 | 32 | NU | p0.pKid | 0 | 48 |
| shared | 2025 | 32 | NU | p0.kidAmt | 0 | 1200 |
| shared | 2025 | 32 | NU | p0.prov | 642.002 | 594.002 |
| shared | 2025 | 32 | NU | p0.total | 6647.9392 | 6599.9392 |
| shared | 2025 | 32 | NU | p1.pKid | 48 | 0 |
| shared | 2025 | 32 | NU | p1.kidAmt | 1200 | 0 |
| shared | 2025 | 32 | NU | p1.prov | 5877.5668 | 5925.5668 |
| shared | 2025 | 32 | NU | p1.total | 31757.2877 | 31805.2877 |
| shared | 2025 | 32 | NS | margBy.cg | 0.1632 | 0.1633 |
| shared | 2025 | 32 | NS | p0.pKid | 0 | 105.48 |
| shared | 2025 | 32 | NS | p0.kidAmt | 0 | 1200 |
| shared | 2025 | 32 | NS | p0.prov | 2513.0032 | 2407.5232 |
| shared | 2025 | 32 | NS | p0.total | 7758.9404 | 7653.4604 |
| shared | 2025 | 32 | NS | p1.pKid | 105.48 | 0 |
| shared | 2025 | 32 | NS | p1.kidAmt | 1200 | 0 |
| shared | 2025 | 32 | NS | p1.prov | 15560.0426 | 15665.5226 |
| shared | 2025 | 32 | NS | p1.total | 39039.7635 | 39145.2435 |
| shared | 2025 | 37 | SK | total | -14521.867 | -14609.3372 |
| shared | 2025 | 37 | SK | prov | 87.4703 | 0 |
| shared | 2025 | 37 | SK | netTotal | -18445.5879 | -18533.0581 |
| shared | 2025 | 37 | SK | incomeTax | 3533.3952 | 3445.925 |
| shared | 2025 | 37 | SK | gross | 13492.1161 | 13404.6459 |
| shared | 2025 | 37 | SK | avg | -0.1708 | -0.1719 |
| shared | 2025 | 37 | SK | grossAvg | 0.1587 | 0.1577 |
| shared | 2025 | 37 | SK | p0.pKid | 0 | 87.4703 |
| shared | 2025 | 37 | SK | p0.kidAmt | 0 | 30816 |
| shared | 2025 | 37 | SK | p0.prov | 87.4703 | 0 |
| shared | 2025 | 37 | SK | p0.total | 3158.4075 | 3070.9373 |
| shared | 2025 | 37 | SK | p1.kidAmt | 30816 | 0 |
| shared | 2025 | 37 | NU | margBy.fd | 0.7073 | 0.7063 |
| shared | 2025 | 37 | NU | p0.pKid | 0 | 42.002 |
| shared | 2025 | 37 | NU | p0.kidAmt | 0 | 4800 |
| shared | 2025 | 37 | NU | p0.prov | 42.002 | 0 |
| shared | 2025 | 37 | NU | p0.total | 3872.9393 | 3830.9373 |
| shared | 2025 | 37 | NU | p1.pKid | 192 | 149.998 |
| shared | 2025 | 37 | NU | p1.kidAmt | 4800 | 0 |
| shared | 2025 | 37 | NU | p1.prov | 582.678 | 624.68 |
| shared | 2025 | 37 | NU | p1.total | 7932.6657 | 7974.6678 |
| shared | 2025 | 37 | NB | margBy.fd | 0.8462 | 0.8382 |
| shared | 2025 | 37 | NS | margBy.fd | 0.8376 | 0.8275 |
| shared | 2025 | 37 | NS | p0.pKid | 0 | 421.92 |
| shared | 2025 | 37 | NS | p0.kidAmt | 0 | 4800 |
| shared | 2025 | 37 | NS | p0.prov | 754.1864 | 332.2664 |
| shared | 2025 | 37 | NS | p0.total | 3825.1236 | 3403.2036 |
| shared | 2025 | 37 | NS | p1.pKid | 421.92 | 0 |
| shared | 2025 | 37 | NS | p1.kidAmt | 4800 | 0 |
| shared | 2025 | 37 | NS | p1.prov | 2623.4947 | 3045.4147 |
| shared | 2025 | 37 | NS | p1.total | 9033.4825 | 9455.4025 |
| shared | 2025 | 39 | SK | total | 32879.8573 | 33041.85 |
| shared | 2025 | 39 | SK | prov | 6880.411 | 7042.4037 |
| shared | 2025 | 39 | SK | netTotal | 31295.8573 | 31457.85 |
| shared | 2025 | 39 | SK | marg | 0.476 | 0.4791 |
| shared | 2025 | 39 | SK | invTax | 51839.4732 | 52001.4659 |
| shared | 2025 | 39 | SK | incomeTax | 30608.7173 | 30770.71 |
| shared | 2025 | 39 | SK | gross | 35191.7173 | 35353.71 |
| shared | 2025 | 39 | SK | avg | 0.1644 | 0.1652 |
| shared | 2025 | 39 | SK | grossAvg | 0.176 | 0.1768 |
| shared | 2025 | 39 | SK | margBy.ord | 0.476 | 0.4791 |
| shared | 2025 | 39 | SK | margBy.cg | 0.2091 | 0.2106 |
| shared | 2025 | 39 | SK | margBy.ed | 0.2756 | 0.2799 |
| shared | 2025 | 39 | SK | margBy.nd | 0.3693 | 0.3729 |
| shared | 2025 | 39 | SK | margBy.fd | 0.5751 | 0.5587 |
| shared | 2025 | 39 | SK | p0.pKid | 2426.76 | 0 |
| shared | 2025 | 39 | SK | p0.kidAmt | 23112 | 0 |
| shared | 2025 | 39 | SK | p0.pFtc | 482.224 | 871.799 |
| shared | 2025 | 39 | SK | p0.prov | 2521.6698 | 4558.8548 |
| shared | 2025 | 39 | SK | p0.total | 15639.2893 | 17676.4743 |
| shared | 2025 | 39 | SK | p1.pKid | 0 | 2426.76 |
| shared | 2025 | 39 | SK | p1.kidAmt | 0 | 23112 |
| shared | 2025 | 39 | SK | p1.pFtc | 1282.077 | 730.5093 |
| shared | 2025 | 39 | SK | p1.prov | 4358.7413 | 2483.549 |
| shared | 2025 | 39 | SK | p1.total | 17968.428 | 16093.2357 |
| shared | 2025 | 40 | NB | margBy.fd | 0.6805 | 0.6691 |
| shared | 2025 | 42 | SK | p0.pKid | 1617.84 | 0 |
| shared | 2025 | 42 | SK | p0.kidAmt | 15408 | 0 |
| shared | 2025 | 42 | SK | p0.prov | 11477.4691 | 13095.3091 |
| shared | 2025 | 42 | SK | p0.total | 40025.5111 | 41643.3511 |
| shared | 2025 | 42 | SK | p1.pKid | 0 | 1617.84 |
| shared | 2025 | 42 | SK | p1.kidAmt | 0 | 15408 |
| shared | 2025 | 42 | SK | p1.prov | 2535.7448 | 917.9048 |
| shared | 2025 | 42 | SK | p1.total | 9670.7325 | 8052.8925 |
| shared | 2025 | 42 | NU | p0.pKid | 96 | 0 |
| shared | 2025 | 42 | NU | p0.kidAmt | 2400 | 0 |
| shared | 2025 | 42 | NU | p0.prov | 7532.5108 | 7628.5108 |
| shared | 2025 | 42 | NU | p0.total | 38080.5528 | 38176.5528 |
| shared | 2025 | 42 | NU | p1.pKid | 0 | 96 |
| shared | 2025 | 42 | NU | p1.kidAmt | 0 | 2400 |
| shared | 2025 | 42 | NU | p1.prov | 974.678 | 878.678 |
| shared | 2025 | 42 | NU | p1.total | 9049.6658 | 8953.6658 |
| shared | 2025 | 42 | NS | p0.pKid | 210.96 | 0 |
| shared | 2025 | 42 | NS | p0.kidAmt | 2400 | 0 |
| shared | 2025 | 42 | NS | p0.prov | 19074.5026 | 19285.4626 |
| shared | 2025 | 42 | NS | p0.total | 47622.5446 | 47833.5046 |
| shared | 2025 | 42 | NS | p1.pKid | 0 | 210.96 |
| shared | 2025 | 42 | NS | p1.kidAmt | 0 | 2400 |
| shared | 2025 | 42 | NS | p1.prov | 3792.9147 | 3581.9547 |
| shared | 2025 | 42 | NS | p1.total | 10927.9025 | 10716.9425 |
| shared | 2025 | 46 | SK | p0.kidAmt | 7704 | 0 |
| shared | 2025 | 46 | SK | p1.kidAmt | 0 | 7704 |
| shared | 2025 | 46 | NU | p0.kidAmt | 1200 | 0 |
| shared | 2025 | 46 | NU | p1.kidAmt | 0 | 1200 |
| shared | 2025 | 46 | NS | p0.kidAmt | 1200 | 0 |
| shared | 2025 | 46 | NS | p1.kidAmt | 0 | 1200 |
| shared | 2025 | 47 | SK | p0.pKid | 0 | 2426.76 |
| shared | 2025 | 47 | SK | p0.kidAmt | 0 | 23112 |
| shared | 2025 | 47 | SK | p0.prov | 8693.0284 | 6266.2684 |
| shared | 2025 | 47 | SK | p0.total | 27689.5075 | 25262.7475 |
| shared | 2025 | 47 | SK | p1.pKid | 2426.76 | 0 |
| shared | 2025 | 47 | SK | p1.kidAmt | 23112 | 0 |
| shared | 2025 | 47 | SK | p1.prov | 27031.1691 | 29457.9291 |
| shared | 2025 | 47 | SK | p1.total | 86659.1974 | 89085.9574 |
| shared | 2025 | 47 | NU | p0.pKid | 0 | 96 |
| shared | 2025 | 47 | NU | p0.kidAmt | 0 | 2400 |
| shared | 2025 | 47 | NU | p0.prov | 4182.2134 | 4086.2134 |
| shared | 2025 | 47 | NU | p0.total | 24538.6925 | 24442.6925 |
| shared | 2025 | 47 | NU | p1.pKid | 96 | 0 |
| shared | 2025 | 47 | NU | p1.kidAmt | 2400 | 0 |
| shared | 2025 | 47 | NU | p1.prov | 19305.6918 | 19401.6918 |
| shared | 2025 | 47 | NU | p1.total | 83933.7201 | 84029.7201 |
| shared | 2025 | 47 | NS | p0.pKid | 0 | 210.96 |
| shared | 2025 | 47 | NS | p0.kidAmt | 0 | 2400 |
| shared | 2025 | 47 | NS | p0.prov | 12117.7987 | 11906.8387 |
| shared | 2025 | 47 | NS | p0.total | 31114.2777 | 30903.3177 |
| shared | 2025 | 47 | NS | p1.pKid | 210.96 | 0 |
| shared | 2025 | 47 | NS | p1.kidAmt | 2400 | 0 |
| shared | 2025 | 47 | NS | p1.prov | 41504.2226 | 41715.1826 |
| shared | 2025 | 47 | NS | p1.total | 101132.251 | 101343.211 |
| shared | 2025 | 50 | NB | margBy.fd | 0.5605 | 0.557 |
| shared | 2025 | 56 | NS | margBy.fd | 0.2597 | 0.2477 |
| shared | 2025 | 60 | SK | p0.kidAmt | 7704 | 0 |
| shared | 2025 | 60 | SK | p1.kidAmt | 0 | 7704 |
| shared | 2025 | 60 | NU | p0.kidAmt | 1200 | 0 |
| shared | 2025 | 60 | NU | p1.kidAmt | 0 | 1200 |
| shared | 2025 | 60 | NS | total | -1113.9864 | -1008.5064 |
| shared | 2025 | 60 | NS | prov | 231.1745 | 336.6545 |
| shared | 2025 | 60 | NS | netTotal | -11813.0355 | -11707.5555 |
| shared | 2025 | 60 | NS | incomeTax | 231.1745 | 336.6545 |
| shared | 2025 | 60 | NS | gross | 12790.7236 | 12896.2036 |
| shared | 2025 | 60 | NS | avg | -0.0371 | -0.0336 |
| shared | 2025 | 60 | NS | grossAvg | 0.4264 | 0.4299 |
| shared | 2025 | 60 | NS | p0.pKid | 105.48 | 0 |
| shared | 2025 | 60 | NS | p0.kidAmt | 1200 | 0 |
| shared | 2025 | 60 | NS | p0.prov | 231.1745 | 336.6545 |
| shared | 2025 | 60 | NS | p0.total | 1692.7245 | 1798.2045 |
| shared | 2025 | 60 | NS | p1.kidAmt | 0 | 1200 |
| shared | 2025 | 61 | SK | p0.kidAmt | 15408 | 0 |
| shared | 2025 | 61 | SK | p1.kidAmt | 0 | 15408 |
| shared | 2025 | 61 | NU | p0.kidAmt | 1200 | 0 |
| shared | 2025 | 61 | NU | p1.kidAmt | 0 | 1200 |
| shared | 2025 | 61 | NB | margBy.fd | 0.5455 | 0.542 |
| shared | 2025 | 61 | NS | total | 14649.7075 | 14755.1875 |
| shared | 2025 | 61 | NS | prov | 5753.9609 | 5859.4409 |
| shared | 2025 | 61 | NS | netTotal | 4385.7575 | 4491.2375 |
| shared | 2025 | 61 | NS | incomeTax | 10609.3475 | 10714.8275 |
| shared | 2025 | 61 | NS | gross | 25788.5275 | 25894.0075 |
| shared | 2025 | 61 | NS | avg | 0.2154 | 0.217 |
| shared | 2025 | 61 | NS | grossAvg | 0.3792 | 0.3808 |
| shared | 2025 | 61 | NS | p0.pKid | 105.48 | 0 |
| shared | 2025 | 61 | NS | p0.kidAmt | 1200 | 0 |
| shared | 2025 | 61 | NS | p0.prov | 5753.9609 | 5859.4409 |
| shared | 2025 | 61 | NS | p0.total | 15524.5775 | 15630.0575 |
| shared | 2025 | 61 | NS | p1.kidAmt | 0 | 1200 |
| shared | 2025 | 64 | NB | margBy.fd | 0.7205 | 0.717 |
| shared | 2025 | 65 | SK | p0.kidAmt | 23112 | 0 |
| shared | 2025 | 65 | SK | p1.kidAmt | 0 | 23112 |
| shared | 2025 | 65 | NU | p0.kidAmt | 1200 | 0 |
| shared | 2025 | 65 | NU | p1.kidAmt | 0 | 1200 |
| shared | 2025 | 65 | NS | total | 19452.2001 | 19557.6801 |
| shared | 2025 | 65 | NS | prov | 11027.745 | 11133.225 |
| shared | 2025 | 65 | NS | netTotal | 15593.1509 | 15698.6309 |
| shared | 2025 | 65 | NS | incomeTax | 22331.5009 | 22436.9809 |
| shared | 2025 | 65 | NS | gross | 31698.1301 | 31803.6101 |
| shared | 2025 | 65 | NS | avg | 0.1945 | 0.1956 |
| shared | 2025 | 65 | NS | grossAvg | 0.317 | 0.318 |
| shared | 2025 | 65 | NS | p0.pKid | 105.48 | 0 |
| shared | 2025 | 65 | NS | p0.kidAmt | 1200 | 0 |
| shared | 2025 | 65 | NS | p0.prov | 11027.745 | 11133.225 |
| shared | 2025 | 65 | NS | p0.total | 27839.0809 | 27944.5609 |
| shared | 2025 | 65 | NS | p1.kidAmt | 0 | 1200 |
| shared | 2025 | 68 | SK | p0.kidAmt | 15408 | 0 |
| shared | 2025 | 68 | SK | p1.kidAmt | 0 | 15408 |
| shared | 2025 | 69 | SK | prov | 3340.9554 | 3340.9553 |
| shared | 2025 | 69 | SK | margBy.fd | 0.4261 | 0.425 |
| shared | 2025 | 69 | SK | p0.pKid | 3235.68 | 2349.4538 |
| shared | 2025 | 69 | SK | p0.kidAmt | 30816 | 0 |
| shared | 2025 | 69 | SK | p0.prov | 2454.7291 | 3340.9553 |
| shared | 2025 | 69 | SK | p0.total | 16282.61 | 17168.8363 |
| shared | 2025 | 69 | SK | p1.pKid | 0 | 886.2263 |
| shared | 2025 | 69 | SK | p1.kidAmt | 0 | 30816 |
| shared | 2025 | 69 | SK | p1.prov | 886.2263 | 0 |
| shared | 2025 | 69 | SK | p1.total | 4453.0075 | 3566.7813 |
| shared | 2025 | 69 | NU | p0.pKid | 48 | 0 |
| shared | 2025 | 69 | NU | p0.kidAmt | 1200 | 0 |
| shared | 2025 | 69 | NU | p0.prov | 2554.6668 | 2602.6668 |
| shared | 2025 | 69 | NU | p0.total | 17882.5477 | 17930.5477 |
| shared | 2025 | 69 | NU | p1.pKid | 0 | 48 |
| shared | 2025 | 69 | NU | p1.kidAmt | 0 | 1200 |
| shared | 2025 | 69 | NU | p1.prov | 346.29 | 298.29 |
| shared | 2025 | 69 | NU | p1.total | 4513.0713 | 4465.0713 |
| shared | 2025 | 69 | NS | p0.pKid | 105.48 | 0 |
| shared | 2025 | 69 | NS | p0.kidAmt | 1200 | 0 |
| shared | 2025 | 69 | NS | p0.prov | 7908.6273 | 8014.1073 |
| shared | 2025 | 69 | NS | p0.total | 21736.5082 | 21841.9882 |
| shared | 2025 | 69 | NS | p1.pKid | 0 | 105.48 |
| shared | 2025 | 69 | NS | p1.kidAmt | 0 | 1200 |
| shared | 2025 | 69 | NS | p1.prov | 1422.8593 | 1317.3793 |
| shared | 2025 | 69 | NS | p1.total | 4989.6405 | 4884.1605 |
| shared | 2025 | 70 | SK | p0.kidAmt | 15408 | 0 |
| shared | 2025 | 70 | SK | p1.kidAmt | 0 | 15408 |
| shared | 2025 | 70 | NU | p0.kidAmt | 1200 | 0 |
| shared | 2025 | 70 | NU | p1.kidAmt | 0 | 1200 |
| shared | 2025 | 70 | NS | margBy.fd | 0.8037 | 0.8107 |
| shared | 2025 | 70 | NS | p0.pKid | 105.48 | 0 |
| shared | 2025 | 70 | NS | p0.kidAmt | 1200 | 0 |
| shared | 2025 | 70 | NS | p0.prov | 3687.4347 | 3792.9147 |
| shared | 2025 | 70 | NS | p0.total | 10642.0425 | 10747.5225 |
| shared | 2025 | 70 | NS | p1.pKid | 0 | 105.48 |
| shared | 2025 | 70 | NS | p1.kidAmt | 0 | 1200 |
| shared | 2025 | 70 | NS | p1.prov | 204.4334 | 98.9534 |
| shared | 2025 | 70 | NS | p1.total | 1134.6834 | 1029.2034 |
| shared | 2025 | 72 | NB | margBy.fd | 0.4911 | 0.4722 |
| shared | 2025 | 72 | NL | margBy.fd | 0.5936 | 0.5918 |
| shared | 2025 | 79 | SK | p0.kidAmt | 23112 | 0 |
| shared | 2025 | 79 | SK | p1.kidAmt | 0 | 23112 |
| shared | 2025 | 79 | NS | margBy.fd | 0.2864 | 0.2745 |
| shared | 2025 | 80 | SK | p0.kidAmt | 46224 | 0 |
| shared | 2025 | 80 | SK | p1.kidAmt | 0 | 46224 |
| shared | 2025 | 80 | NU | p0.kidAmt | 4800 | 0 |
| shared | 2025 | 80 | NU | p1.kidAmt | 0 | 4800 |
| shared | 2025 | 80 | NS | total | -39462.6608 | -39254.8769 |
| shared | 2025 | 80 | NS | prov | 0 | 207.7839 |
| shared | 2025 | 80 | NS | netTotal | -41440.71 | -41232.9261 |
| shared | 2025 | 80 | NS | marg | 0.3531 | 0.4953 |
| shared | 2025 | 80 | NS | invTax | 17200.1 | 17407.8839 |
| shared | 2025 | 80 | NS | incomeTax | 0 | 207.7839 |
| shared | 2025 | 80 | NS | gross | 2376.9992 | 2584.7831 |
| shared | 2025 | 80 | NS | avg | -0.5406 | -0.5377 |
| shared | 2025 | 80 | NS | grossAvg | 0.0326 | 0.0354 |
| shared | 2025 | 80 | NS | margBy.ord | 0.3531 | 0.4953 |
| shared | 2025 | 80 | NS | margBy.cg | 0.14 | 0.2147 |
| shared | 2025 | 80 | NS | margBy.ed | 0.3864 | 0.4706 |
| shared | 2025 | 80 | NS | margBy.nd | 0.322 | 0.4767 |
| shared | 2025 | 80 | NS | margBy.fd | 0.43 | 0.5758 |
| shared | 2025 | 80 | NS | p0.pDtc | 4671.0639 | 4885.2 |
| shared | 2025 | 80 | NS | p0.pKid | 421.92 | 0 |
| shared | 2025 | 80 | NS | p0.kidAmt | 4800 | 0 |
| shared | 2025 | 80 | NS | p0.prov | 0 | 207.7839 |
| shared | 2025 | 80 | NS | p0.total | 398.95 | 606.7339 |
| shared | 2025 | 80 | NS | p1.kidAmt | 0 | 4800 |
| shared | 2025 | 86 | SK | p0.pKid | 0 | 3235.68 |
| shared | 2025 | 86 | SK | p0.kidAmt | 0 | 30816 |
| shared | 2025 | 86 | SK | p0.prov | 8784.4091 | 5548.7291 |
| shared | 2025 | 86 | SK | p0.total | 27934.45 | 24698.77 |
| shared | 2025 | 86 | SK | p1.pKid | 3235.68 | 0 |
| shared | 2025 | 86 | SK | p1.kidAmt | 30816 | 0 |
| shared | 2025 | 86 | SK | p1.prov | 13172.2491 | 16407.9291 |
| shared | 2025 | 86 | SK | p1.total | 47051.97 | 50287.65 |
| shared | 2025 | 86 | NU | p0.pKid | 0 | 48 |
| shared | 2025 | 86 | NU | p0.kidAmt | 0 | 1200 |
| shared | 2025 | 86 | NU | p0.prov | 4335.3068 | 4287.3068 |
| shared | 2025 | 86 | NU | p0.total | 25485.3477 | 25437.3477 |
| shared | 2025 | 86 | NU | p1.pKid | 48 | 0 |
| shared | 2025 | 86 | NU | p1.kidAmt | 1200 | 0 |
| shared | 2025 | 86 | NU | p1.prov | 9477.5668 | 9525.5668 |
| shared | 2025 | 86 | NU | p1.total | 46557.2877 | 46605.2877 |
| shared | 2025 | 86 | NS | p0.pKid | 0 | 105.48 |
| shared | 2025 | 86 | NS | p0.kidAmt | 0 | 1200 |
| shared | 2025 | 86 | NS | p0.prov | 12165.5226 | 12060.0426 |
| shared | 2025 | 86 | NS | p0.total | 31315.5635 | 31210.0835 |
| shared | 2025 | 86 | NS | p1.pKid | 105.48 | 0 |
| shared | 2025 | 86 | NS | p1.kidAmt | 1200 | 0 |
| shared | 2025 | 86 | NS | p1.prov | 22709.7026 | 22815.1826 |
| shared | 2025 | 86 | NS | p1.total | 56589.4235 | 56694.9035 |
| shared | 2025 | 89 | SK | margBy.fd | 0.4239 | 0.4031 |
| shared | 2025 | 89 | SK | p0.pKid | 3235.68 | 2098.2097 |
| shared | 2025 | 89 | SK | p0.kidAmt | 30816 | 0 |
| shared | 2025 | 89 | SK | p0.prov | 96.7488 | 1234.219 |
| shared | 2025 | 89 | SK | p0.total | 8910.8925 | 10048.3628 |
| shared | 2025 | 89 | SK | p1.pKid | 0 | 1137.4703 |
| shared | 2025 | 89 | SK | p1.kidAmt | 0 | 30816 |
| shared | 2025 | 89 | SK | p1.prov | 1137.4703 | 0 |
| shared | 2025 | 89 | SK | p1.total | 5658.4075 | 4520.9372 |
| shared | 2025 | 89 | NU | margBy.fd | 0.3202 | 0.3176 |
| shared | 2025 | 89 | NU | p0.pKid | 144 | 0 |
| shared | 2025 | 89 | NU | p0.kidAmt | 3600 | 0 |
| shared | 2025 | 89 | NU | p0.prov | 1126.39 | 1270.39 |
| shared | 2025 | 89 | NU | p0.total | 11040.5338 | 11184.5338 |
| shared | 2025 | 89 | NU | p1.pKid | 0 | 144 |
| shared | 2025 | 89 | NU | p1.kidAmt | 0 | 3600 |
| shared | 2025 | 89 | NU | p1.prov | 442.002 | 298.002 |
| shared | 2025 | 89 | NU | p1.total | 5722.9392 | 5578.9392 |
| shared | 2025 | 89 | NS | p0.pKid | 316.44 | 0 |
| shared | 2025 | 89 | NS | p0.kidAmt | 3600 | 0 |
| shared | 2025 | 89 | NS | p0.prov | 4614.1738 | 4930.6138 |
| shared | 2025 | 89 | NS | p0.total | 13428.3176 | 13744.7576 |
| shared | 2025 | 89 | NS | p1.pKid | 0 | 316.44 |
| shared | 2025 | 89 | NS | p1.kidAmt | 0 | 3600 |
| shared | 2025 | 89 | NS | p1.prov | 1765.5032 | 1449.0632 |
| shared | 2025 | 89 | NS | p1.total | 6286.4404 | 5970.0004 |
| shared | 2025 | 90 | NB | margBy.fd | 0.3479 | 0.3466 |
| shared | 2025 | 91 | SK | p0.kidAmt | 7704 | 0 |
| shared | 2025 | 91 | SK | p1.kidAmt | 0 | 7704 |
| shared | 2025 | 91 | NU | p0.kidAmt | 1200 | 0 |
| shared | 2025 | 91 | NU | p1.kidAmt | 0 | 1200 |
| shared | 2025 | 91 | NS | p0.kidAmt | 1200 | 0 |
| shared | 2025 | 91 | NS | p1.kidAmt | 0 | 1200 |
| shared | 2025 | 98 | SK | total | -13060.0562 | -15595.801 |
| shared | 2025 | 98 | SK | prov | 2535.7448 | 0 |
| shared | 2025 | 98 | SK | netTotal | -16885.1618 | -19420.9066 |
| shared | 2025 | 98 | SK | invTax | 12040.7016 | 9614.9391 |
| shared | 2025 | 98 | SK | incomeTax | 8141.7282 | 5605.9834 |
| shared | 2025 | 98 | SK | gross | 16787.4338 | 14251.689 |
| shared | 2025 | 98 | SK | avg | -0.1146 | -0.1368 |
| shared | 2025 | 98 | SK | grossAvg | 0.1473 | 0.125 |
| shared | 2025 | 98 | SK | p0.pDtc | 1836.0022 | 4371.747 |
| shared | 2025 | 98 | SK | p0.pKid | 4853.52 | 2317.7752 |
| shared | 2025 | 98 | SK | p0.kidAmt | 46224 | 0 |
| shared | 2025 | 98 | SK | p1.pKid | 0 | 2535.7448 |
| shared | 2025 | 98 | SK | p1.kidAmt | 0 | 46224 |
| shared | 2025 | 98 | SK | p1.prov | 2535.7448 | 0 |
| shared | 2025 | 98 | SK | p1.total | 9670.7325 | 7134.9878 |
| shared | 2025 | 98 | NU | total | -14512.963 | -14547.665 |
| shared | 2025 | 98 | NU | prov | 974.678 | 939.976 |
| shared | 2025 | 98 | NU | netTotal | -16284.2286 | -16318.9306 |
| shared | 2025 | 98 | NU | marg | 0.3833 | 0.45 |
| shared | 2025 | 98 | NU | invTax | 10553.2024 | 10518.5004 |
| shared | 2025 | 98 | NU | incomeTax | 6580.6614 | 6545.9594 |
| shared | 2025 | 98 | NU | gross | 14552.527 | 14517.825 |
| shared | 2025 | 98 | NU | avg | -0.1273 | -0.1276 |
| shared | 2025 | 98 | NU | grossAvg | 0.1277 | 0.1273 |
| shared | 2025 | 98 | NU | margBy.ord | 0.3833 | 0.45 |
| shared | 2025 | 98 | NU | margBy.cg | 0.15 | 0.185 |
| shared | 2025 | 98 | NU | margBy.ed | 0.2067 | 0.2273 |
| shared | 2025 | 98 | NU | margBy.nd | 0.2412 | 0.2916 |
| shared | 2025 | 98 | NU | margBy.fd | 0.4268 | 0.4959 |
| shared | 2025 | 98 | NU | p0.pDtc | 3006.818 | 3041.52 |
| shared | 2025 | 98 | NU | p0.pKid | 96 | 0 |
| shared | 2025 | 98 | NU | p0.kidAmt | 2400 | 0 |
| shared | 2025 | 98 | NU | p0.prov | 0 | 61.298 |
| shared | 2025 | 98 | NU | p0.total | 3731.5957 | 3792.8937 |
| shared | 2025 | 98 | NU | p1.pKid | 0 | 96 |
| shared | 2025 | 98 | NU | p1.kidAmt | 0 | 2400 |
| shared | 2025 | 98 | NU | p1.prov | 974.678 | 878.678 |
| shared | 2025 | 98 | NU | p1.total | 9049.6658 | 8953.6658 |
| shared | 2025 | 98 | NS | margBy.fd | 0.5419 | 0.5393 |
| shared | 2025 | 98 | NS | p0.pKid | 210.96 | 0 |
| shared | 2025 | 98 | NS | p0.kidAmt | 2400 | 0 |
| shared | 2025 | 98 | NS | p0.prov | 4085.795 | 4296.755 |
| shared | 2025 | 98 | NS | p0.total | 7377.3906 | 7588.3506 |
| shared | 2025 | 98 | NS | p1.pKid | 0 | 210.96 |
| shared | 2025 | 98 | NS | p1.kidAmt | 0 | 2400 |
| shared | 2025 | 98 | NS | p1.prov | 3792.9147 | 3581.9547 |
| shared | 2025 | 98 | NS | p1.total | 10927.9025 | 10716.9425 |
| shared | 2025 | 100 | SK | p0.kidAmt | 23112 | 0 |
| shared | 2025 | 100 | SK | p1.kidAmt | 0 | 23112 |
| shared | 2025 | 100 | NU | p0.kidAmt | 2400 | 0 |
| shared | 2025 | 100 | NU | p1.kidAmt | 0 | 2400 |
| shared | 2025 | 100 | NS | p0.kidAmt | 2400 | 0 |
| shared | 2025 | 100 | NS | p1.kidAmt | 0 | 2400 |
| shared | 2025 | 101 | NB | margBy.fd | 0.7462 | 0.7251 |
| shared | 2025 | 101 | NL | margBy.fd | 0.982 | 0.9607 |
| shared | 2025 | 102 | SK | p0.pKid | 0 | 808.92 |
| shared | 2025 | 102 | SK | p0.kidAmt | 0 | 7704 |
| shared | 2025 | 102 | SK | p0.prov | 2535.7448 | 1726.8247 |
| shared | 2025 | 102 | SK | p0.total | 9670.7325 | 8861.8125 |
| shared | 2025 | 102 | SK | p1.pKid | 808.92 | 0 |
| shared | 2025 | 102 | SK | p1.kidAmt | 7704 | 0 |
| shared | 2025 | 102 | SK | p1.prov | 3421.2659 | 4230.1859 |
| shared | 2025 | 102 | SK | p1.total | 14505.5875 | 15314.5075 |
| shared | 2025 | 104 | SK | p0.kidAmt | 7704 | 0 |
| shared | 2025 | 104 | SK | p1.kidAmt | 0 | 7704 |
| shared | 2025 | 106 | SK | p0.pKid | 0 | 1617.84 |
| shared | 2025 | 106 | SK | p0.kidAmt | 0 | 15408 |
| shared | 2025 | 106 | SK | p0.prov | 6909.4091 | 5291.5691 |
| shared | 2025 | 106 | SK | p0.total | 22984.45 | 21366.61 |
| shared | 2025 | 106 | SK | p1.pKid | 1617.84 | 0 |
| shared | 2025 | 106 | SK | p1.kidAmt | 15408 | 0 |
| shared | 2025 | 106 | SK | p1.prov | 20590.0891 | 22207.9291 |
| shared | 2025 | 106 | SK | p1.total | 65565.404 | 67183.244 |
| shared | 2025 | 106 | NU | p0.pKid | 0 | 96 |
| shared | 2025 | 106 | NU | p0.kidAmt | 0 | 2400 |
| shared | 2025 | 106 | NU | p0.prov | 3285.3068 | 3189.3068 |
| shared | 2025 | 106 | NU | p0.total | 21060.3477 | 20964.3477 |
| shared | 2025 | 106 | NU | p1.pKid | 96 | 0 |
| shared | 2025 | 106 | NU | p1.kidAmt | 2400 | 0 |
| shared | 2025 | 106 | NU | p1.prov | 13555.6918 | 13651.6918 |
| shared | 2025 | 106 | NU | p1.total | 62531.0067 | 62627.0067 |
| shared | 2025 | 106 | NS | p0.pKid | 0 | 210.96 |
| shared | 2025 | 106 | NS | p0.kidAmt | 0 | 2400 |
| shared | 2025 | 106 | NS | p0.prov | 9639.7657 | 9428.8057 |
| shared | 2025 | 106 | NS | p0.total | 25714.8066 | 25503.8466 |
| shared | 2025 | 106 | NS | p1.pKid | 210.96 | 0 |
| shared | 2025 | 106 | NS | p1.kidAmt | 2400 | 0 |
| shared | 2025 | 106 | NS | p1.prov | 31004.2226 | 31215.1826 |
| shared | 2025 | 106 | NS | p1.total | 75979.5375 | 76190.4975 |
| shared | 2025 | 107 | NB | margBy.fd | 0.6843 | 0.6762 |
| shared | 2025 | 108 | SK | p0.kidAmt | 15408 | 0 |
| shared | 2025 | 108 | SK | p1.kidAmt | 0 | 15408 |
| shared | 2025 | 108 | NU | p0.kidAmt | 2400 | 0 |
| shared | 2025 | 108 | NU | p1.kidAmt | 0 | 2400 |
| shared | 2025 | 108 | NS | total | 37039.6646 | 37250.6246 |
| shared | 2025 | 108 | NS | prov | 16172.265 | 16383.225 |
| shared | 2025 | 108 | NS | netTotal | 32116.4089 | 32327.3689 |
| shared | 2025 | 108 | NS | incomeTax | 34405.7009 | 34616.6609 |
| shared | 2025 | 108 | NS | gross | 44836.5366 | 45047.4966 |
| shared | 2025 | 108 | NS | avg | 0.2315 | 0.2328 |
| shared | 2025 | 108 | NS | grossAvg | 0.2802 | 0.2815 |
| shared | 2025 | 108 | NS | p0.pKid | 210.96 | 0 |
| shared | 2025 | 108 | NS | p0.kidAmt | 2400 | 0 |
| shared | 2025 | 108 | NS | p0.prov | 16172.265 | 16383.225 |
| shared | 2025 | 108 | NS | p0.total | 39913.2809 | 40124.2409 |
| shared | 2025 | 108 | NS | p1.kidAmt | 0 | 2400 |
| shared | 2025 | 111 | SK | p0.kidAmt | 46224 | 0 |
| shared | 2025 | 111 | SK | p1.kidAmt | 0 | 46224 |
| shared | 2025 | 111 | NU | p0.kidAmt | 1200 | 0 |
| shared | 2025 | 111 | NU | p1.kidAmt | 0 | 1200 |
| shared | 2025 | 111 | NS | total | -10553.2298 | -10447.7498 |
| shared | 2025 | 111 | NS | prov | 5857.4314 | 5962.9114 |
| shared | 2025 | 111 | NS | netTotal | -20817.1798 | -20711.6998 |
| shared | 2025 | 111 | NS | incomeTax | 13044.0302 | 13149.5102 |
| shared | 2025 | 111 | NS | gross | 27274.2302 | 27379.7102 |
| shared | 2025 | 111 | NS | avg | -0.1919 | -0.19 |
| shared | 2025 | 111 | NS | grossAvg | 0.4959 | 0.4978 |
| shared | 2025 | 111 | NS | margBy.cg | 0.2622 | 0.2623 |
| shared | 2025 | 111 | NS | p0.pKid | 105.48 | 0 |
| shared | 2025 | 111 | NS | p0.kidAmt | 1200 | 0 |
| shared | 2025 | 111 | NS | p0.prov | 5857.4314 | 5962.9114 |
| shared | 2025 | 111 | NS | p0.total | 17010.2802 | 17115.7602 |
| shared | 2025 | 111 | NS | p1.kidAmt | 0 | 1200 |
| shared | 2025 | 112 | NB | margBy.fd | 0.4544 | 0.4457 |
| shared | 2025 | 116 | SK | total | -20321.8528 | -21984.323 |
| shared | 2025 | 116 | SK | prov | 1662.4702 | 0 |
| shared | 2025 | 116 | SK | netTotal | -26261.8528 | -27924.323 |
| shared | 2025 | 116 | SK | incomeTax | 6802.4447 | 5139.9745 |
| shared | 2025 | 116 | SK | gross | 18094.3447 | 16431.8745 |
| shared | 2025 | 116 | SK | avg | -0.2674 | -0.2893 |
| shared | 2025 | 116 | SK | grossAvg | 0.2381 | 0.2162 |
| shared | 2025 | 116 | SK | p1.pKid | 0 | 1662.4702 |
| shared | 2025 | 116 | SK | p1.prov | 1662.4702 | 0 |
| shared | 2025 | 116 | SK | p1.total | 6908.4075 | 5245.9372 |
| shared | 2025 | 116 | NU | margBy.fd | 0.7145 | 0.7094 |
| shared | 2025 | 116 | NS | margBy.fd | 0.7003 | 0.6891 |
| shared | 2025 | 117 | SK | p0.pKid | 2426.76 | 0 |
| shared | 2025 | 117 | SK | p0.kidAmt | 23112 | 0 |
| shared | 2025 | 117 | SK | p0.prov | 8857.6491 | 11284.4091 |
| shared | 2025 | 117 | SK | p0.total | 32337.37 | 34764.13 |
| shared | 2025 | 117 | SK | p1.pKid | 0 | 2426.76 |
| shared | 2025 | 117 | SK | p1.kidAmt | 0 | 23112 |
| shared | 2025 | 117 | SK | p1.prov | 4723.2743 | 2296.5143 |
| shared | 2025 | 117 | SK | p1.total | 14297.6007 | 11870.8407 |
| shared | 2025 | 119 | SK | p0.kidAmt | 23112 | 0 |
| shared | 2025 | 119 | SK | p1.kidAmt | 0 | 23112 |
| shared | 2025 | 119 | NU | p0.kidAmt | 2400 | 0 |
| shared | 2025 | 119 | NU | p1.kidAmt | 0 | 2400 |
| shared | 2025 | 119 | NS | total | -25276.47 | -25244.1583 |
| shared | 2025 | 119 | NS | prov | 0 | 32.3117 |
| shared | 2025 | 119 | NS | netTotal | -28700.42 | -28668.1083 |
| shared | 2025 | 119 | NS | marg | 0.0759 | 0.2066 |
| shared | 2025 | 119 | NS | incomeTax | 0 | 32.3117 |
| shared | 2025 | 119 | NS | gross | 5492.7 | 5525.0117 |
| shared | 2025 | 119 | NS | avg | -0.8425 | -0.8415 |
| shared | 2025 | 119 | NS | grossAvg | 0.1831 | 0.1842 |
| shared | 2025 | 119 | NS | margBy.ord | 0.0759 | 0.2066 |
| shared | 2025 | 119 | NS | margBy.cg | 0 | 0.069 |
| shared | 2025 | 119 | NS | margBy.ed | 0 | 0.0682 |
| shared | 2025 | 119 | NS | margBy.nd | 0 | 0.1413 |
| shared | 2025 | 119 | NS | margBy.fd | 0 | 0.1379 |
| shared | 2025 | 119 | NS | p0.pKid | 210.96 | 0 |
| shared | 2025 | 119 | NS | p0.kidAmt | 2400 | 0 |
| shared | 2025 | 119 | NS | p0.lowRed | 179.6017 | 358.25 |
| shared | 2025 | 119 | NS | p0.prov | 0 | 32.3117 |
| shared | 2025 | 119 | NS | p0.total | 2068.75 | 2101.0617 |
| shared | 2025 | 119 | NS | p1.kidAmt | 0 | 2400 |
| shared | 2025 | 123 | SK | total | 25143.2048 | 24256.9785 |
| shared | 2025 | 123 | SK | prov | 886.2263 | 0 |
| shared | 2025 | 123 | SK | netTotal | -3005.9009 | -3892.1271 |
| shared | 2025 | 123 | SK | marg | 0.495 | 0.398 |
| shared | 2025 | 123 | SK | incomeTax | 4629.5492 | 3743.3229 |
| shared | 2025 | 123 | SK | gross | 39762.6348 | 38876.4085 |
| shared | 2025 | 123 | SK | avg | 0.2566 | 0.2475 |
| shared | 2025 | 123 | SK | grossAvg | 0.4057 | 0.3967 |
| shared | 2025 | 123 | SK | margBy.ord | 0.495 | 0.398 |
| shared | 2025 | 123 | SK | margBy.cg | 0.22 | 0.1675 |
| shared | 2025 | 123 | SK | margBy.ed | 0.2481 | 0.255 |
| shared | 2025 | 123 | SK | margBy.nd | 0.3732 | 0.2814 |
| shared | 2025 | 123 | SK | margBy.fd | 0.5092 | 0.4343 |
| shared | 2025 | 123 | SK | p0.pKid | 0 | 886.2263 |
| shared | 2025 | 123 | SK | p0.kidAmt | 0 | 23112 |
| shared | 2025 | 123 | SK | p0.prov | 886.2263 | 0 |
| shared | 2025 | 123 | SK | p0.total | 4453.0075 | 3566.7813 |
| shared | 2025 | 123 | SK | p1.kidAmt | 23112 | 0 |
| shared | 2025 | 126 | SK | prov | 13642.4893 | 13642.4894 |
| shared | 2025 | 126 | SK | p0.pKid | 0 | 2426.76 |
| shared | 2025 | 126 | SK | p0.kidAmt | 0 | 23112 |
| shared | 2025 | 126 | SK | p0.prov | 4784.8402 | 2358.0803 |
| shared | 2025 | 126 | SK | p0.total | 10465.858 | 8039.098 |
| shared | 2025 | 126 | SK | p1.pKid | 2426.76 | 0 |
| shared | 2025 | 126 | SK | p1.kidAmt | 23112 | 0 |
| shared | 2025 | 126 | SK | p1.prov | 8857.6491 | 11284.4091 |
| shared | 2025 | 126 | SK | p1.total | 32337.37 | 34764.13 |
| shared | 2025 | 126 | NU | p0.pKid | 0 | 48 |
| shared | 2025 | 126 | NU | p0.kidAmt | 0 | 1200 |
| shared | 2025 | 126 | NU | p0.prov | 1605.072 | 1557.072 |
| shared | 2025 | 126 | NU | p0.total | 7446.0898 | 7398.0898 |
| shared | 2025 | 126 | NU | p1.pKid | 48 | 0 |
| shared | 2025 | 126 | NU | p1.kidAmt | 1200 | 0 |
| shared | 2025 | 126 | NU | p1.prov | 5877.5668 | 5925.5668 |
| shared | 2025 | 126 | NU | p1.total | 31757.2877 | 31805.2877 |
| shared | 2025 | 126 | NS | invTax | 19112.4249 | 19006.9449 |
| shared | 2025 | 126 | NS | p0.pKid | 0 | 105.48 |
| shared | 2025 | 126 | NS | p0.kidAmt | 0 | 1200 |
| shared | 2025 | 126 | NS | p0.prov | 7235.2495 | 7129.7695 |
| shared | 2025 | 126 | NS | p0.total | 12916.2672 | 12810.7872 |
| shared | 2025 | 126 | NS | p1.pKid | 105.48 | 0 |
| shared | 2025 | 126 | NS | p1.kidAmt | 1200 | 0 |
| shared | 2025 | 126 | NS | p1.prov | 15560.0426 | 15665.5226 |
| shared | 2025 | 126 | NS | p1.total | 39039.7635 | 39145.2435 |
| shared | 2025 | 128 | SK | p0.kidAmt | 7704 | 0 |
| shared | 2025 | 128 | SK | p1.kidAmt | 0 | 7704 |
| shared | 2025 | 128 | NB | margBy.fd | 0.7564 | 0.7379 |
| shared | 2025 | 128 | NL | margBy.fd | 0.9938 | 0.9818 |
| shared | 2025 | 129 | SK | p0.pKid | 0 | 2426.76 |
| shared | 2025 | 129 | SK | p0.kidAmt | 0 | 23112 |
| shared | 2025 | 129 | SK | p0.prov | 3332.4288 | 905.6688 |
| shared | 2025 | 129 | SK | p0.total | 12146.5725 | 9719.8125 |
| shared | 2025 | 129 | SK | p1.pKid | 2426.76 | 0 |
| shared | 2025 | 129 | SK | p1.kidAmt | 23112 | 0 |
| shared | 2025 | 129 | SK | p1.prov | 13981.1691 | 16407.9291 |
| shared | 2025 | 129 | SK | p1.total | 47860.89 | 50287.65 |
| shared | 2025 | 129 | NU | p0.pKid | 0 | 48 |
| shared | 2025 | 129 | NU | p0.kidAmt | 0 | 1200 |
| shared | 2025 | 129 | NU | p0.prov | 1270.39 | 1222.39 |
| shared | 2025 | 129 | NU | p0.total | 11184.5338 | 11136.5338 |
| shared | 2025 | 129 | NU | p1.pKid | 48 | 0 |
| shared | 2025 | 129 | NU | p1.kidAmt | 1200 | 0 |
| shared | 2025 | 129 | NU | p1.prov | 9477.5668 | 9525.5668 |
| shared | 2025 | 129 | NU | p1.total | 46557.2877 | 46605.2877 |
| shared | 2025 | 129 | NS | p0.pKid | 0 | 105.48 |
| shared | 2025 | 129 | NS | p0.kidAmt | 0 | 1200 |
| shared | 2025 | 129 | NS | p0.prov | 4930.6138 | 4825.1338 |
| shared | 2025 | 129 | NS | p0.total | 13744.7576 | 13639.2776 |
| shared | 2025 | 129 | NS | p1.pKid | 105.48 | 0 |
| shared | 2025 | 129 | NS | p1.kidAmt | 1200 | 0 |
| shared | 2025 | 129 | NS | p1.prov | 22709.7026 | 22815.1826 |
| shared | 2025 | 129 | NS | p1.total | 56589.4235 | 56694.9035 |
| shared | 2025 | 130 | SK | p0.pKid | 808.92 | 0 |
| shared | 2025 | 130 | SK | p0.kidAmt | 7704 | 0 |
| shared | 2025 | 130 | SK | p0.prov | 23766.0091 | 24574.9291 |
| shared | 2025 | 130 | SK | p0.total | 77643.2954 | 78452.2154 |
| shared | 2025 | 130 | SK | p1.pKid | 0 | 808.92 |
| shared | 2025 | 130 | SK | p1.kidAmt | 0 | 7704 |
| shared | 2025 | 130 | SK | p1.prov | 25107.9291 | 24299.0091 |
| shared | 2025 | 130 | SK | p1.total | 75944.3294 | 75135.4094 |
| shared | 2025 | 133 | SK | p0.kidAmt | 0 | 46224 |
| shared | 2025 | 133 | SK | p1.kidAmt | 46224 | 0 |
| shared | 2025 | 140 | SK | p0.pKid | 808.92 | 0 |
| shared | 2025 | 140 | SK | p0.kidAmt | 7704 | 0 |
| shared | 2025 | 140 | SK | p0.prov | 6746.3352 | 7555.2552 |
| shared | 2025 | 140 | SK | p0.total | 22514.5334 | 23323.4534 |
| shared | 2025 | 140 | SK | p1.pKid | 0 | 808.92 |
| shared | 2025 | 140 | SK | p1.kidAmt | 0 | 7704 |
| shared | 2025 | 140 | SK | p1.prov | 3332.4288 | 2523.5088 |
| shared | 2025 | 140 | SK | p1.total | 12146.5725 | 11337.6525 |
| shared | 2025 | 141 | NB | margBy.fd | 0.6405 | 0.6291 |
| shared | 2025 | 143 | SK | p0.kidAmt | 0 | 7704 |
| shared | 2025 | 143 | SK | p1.kidAmt | 7704 | 0 |
| shared | 2025 | 143 | NU | p0.kidAmt | 0 | 1200 |
| shared | 2025 | 143 | NU | p1.kidAmt | 1200 | 0 |
| shared | 2025 | 143 | NB | invTax | 9842.8076 | 9906.1401 |
| shared | 2025 | 143 | NS | p0.pKid | 0 | 105.48 |
| shared | 2025 | 143 | NS | p0.kidAmt | 0 | 1200 |
| shared | 2025 | 143 | NS | p0.prov | 333.5322 | 228.0522 |
| shared | 2025 | 143 | NS | p0.total | 1795.0822 | 1689.6022 |
| shared | 2025 | 143 | NS | p1.pKid | 105.48 | 0 |
| shared | 2025 | 143 | NS | p1.kidAmt | 1200 | 0 |
| shared | 2025 | 143 | NS | p1.prov | 3042.4982 | 3147.9782 |
| shared | 2025 | 143 | NS | p1.total | 7071.5155 | 7176.9955 |
| shared | 2025 | 143 | NL | invTax | 11440.4051 | 11701.6444 |
| shared | 2025 | 144 | NB | margBy.fd | 0.6623 | 0.6381 |
| shared | 2025 | 144 | NL | margBy.fd | 0.8583 | 0.8257 |
| shared | 2025 | 145 | SK | p0.kidAmt | 0 | 15408 |
| shared | 2025 | 145 | SK | p1.kidAmt | 15408 | 0 |
| shared | 2025 | 145 | NU | p0.kidAmt | 0 | 2400 |
| shared | 2025 | 145 | NU | p1.kidAmt | 2400 | 0 |
| shared | 2025 | 145 | NS | total | 9348.7885 | 9393.0066 |
| shared | 2025 | 145 | NS | prov | 3748.6966 | 3792.9147 |
| shared | 2025 | 145 | NS | netTotal | 701.7394 | 745.9575 |
| shared | 2025 | 145 | NS | incomeTax | 7524.6344 | 7568.8525 |
| shared | 2025 | 145 | NS | gross | 22889.7835 | 22934.0016 |
| shared | 2025 | 145 | NS | avg | 0.0995 | 0.0999 |
| shared | 2025 | 145 | NS | grossAvg | 0.2435 | 0.244 |
| shared | 2025 | 145 | NS | p0.pKid | 0 | 166.7419 |
| shared | 2025 | 145 | NS | p0.kidAmt | 0 | 2400 |
| shared | 2025 | 145 | NS | p0.prov | 166.7419 | 0 |
| shared | 2025 | 145 | NS | p0.total | 3525.7919 | 3359.05 |
| shared | 2025 | 145 | NS | p1.pKid | 210.96 | 0 |
| shared | 2025 | 145 | NS | p1.kidAmt | 2400 | 0 |
| shared | 2025 | 145 | NS | p1.prov | 3581.9547 | 3792.9147 |
| shared | 2025 | 145 | NS | p1.total | 10716.9425 | 10927.9025 |
| shared | 2026 | 3 | NB | margBy.fd | 0.3763 | 0.3465 |
| shared | 2026 | 3 | NL | margBy.fd | 0.4996 | 0.4702 |
| shared | 2026 | 6 | NB | margBy.fd | 0.8253 | 0.8037 |
| shared | 2026 | 6 | NL | margBy.fd | 0.9672 | 0.9493 |
| shared | 2026 | 7 | SK | p0.kidAmt | 41790 | 0 |
| shared | 2026 | 7 | SK | p1.kidAmt | 0 | 41790 |
| shared | 2026 | 7 | NU | p0.kidAmt | 2400 | 0 |
| shared | 2026 | 7 | NU | p1.kidAmt | 0 | 2400 |
| shared | 2026 | 7 | NB | margBy.fd | 0.7273 | 0.7186 |
| shared | 2026 | 7 | NS | total | -18157.1804 | -17946.2204 |
| shared | 2026 | 7 | NS | prov | 4335.8344 | 4546.7944 |
| shared | 2026 | 7 | NS | netTotal | -21786.7106 | -21575.7506 |
| shared | 2026 | 7 | NS | incomeTax | 7370.8494 | 7581.8094 |
| shared | 2026 | 7 | NS | gross | 15340.1296 | 15551.0896 |
| shared | 2026 | 7 | NS | avg | -0.3026 | -0.2991 |
| shared | 2026 | 7 | NS | grossAvg | 0.2557 | 0.2592 |
| shared | 2026 | 7 | NS | margBy.cg | 0.3173 | 0.3172 |
| shared | 2026 | 7 | NS | margBy.fd | 0.6601 | 0.6566 |
| shared | 2026 | 7 | NS | p0.pKid | 210.96 | 0 |
| shared | 2026 | 7 | NS | p0.kidAmt | 2400 | 0 |
| shared | 2026 | 7 | NS | p0.prov | 4335.8344 | 4546.7944 |
| shared | 2026 | 7 | NS | p0.total | 11710.5994 | 11921.5594 |
| shared | 2026 | 7 | NS | p1.kidAmt | 0 | 2400 |
| shared | 2026 | 8 | NU | margBy.fd | 0.3369 | 0.3363 |
| shared | 2026 | 9 | SK | netTotal | 24146.6213 | 24146.6214 |
| shared | 2026 | 9 | SK | p0.pKid | 877.59 | 0 |
| shared | 2026 | 9 | SK | p0.kidAmt | 8358 | 0 |
| shared | 2026 | 9 | SK | p0.prov | 4095.0839 | 4972.6739 |
| shared | 2026 | 9 | SK | p0.total | 16453.0891 | 17330.6791 |
| shared | 2026 | 9 | SK | p1.pKid | 0 | 877.59 |
| shared | 2026 | 9 | SK | p1.kidAmt | 0 | 8358 |
| shared | 2026 | 9 | SK | p1.prov | 2733.9113 | 1856.3213 |
| shared | 2026 | 9 | SK | p1.total | 10300.7963 | 9423.2063 |
| shared | 2026 | 10 | SK | p0.kidAmt | 16716 | 0 |
| shared | 2026 | 10 | SK | p1.kidAmt | 0 | 16716 |
| shared | 2026 | 10 | NB | margBy.fd | 0.6675 | 0.6397 |
| shared | 2026 | 10 | NL | margBy.fd | 0.8533 | 0.8304 |
| shared | 2026 | 11 | SK | p0.kidAmt | 25074 | 0 |
| shared | 2026 | 11 | SK | p1.kidAmt | 0 | 25074 |
| shared | 2026 | 11 | NU | p0.kidAmt | 2400 | 0 |
| shared | 2026 | 11 | NU | p1.kidAmt | 0 | 2400 |
| shared | 2026 | 11 | NS | total | 27060.9811 | 27271.9411 |
| shared | 2026 | 11 | NS | prov | 14301.9936 | 14512.9536 |
| shared | 2026 | 11 | NS | netTotal | 23431.4508 | 23642.4108 |
| shared | 2026 | 11 | NS | incomeTax | 29500.8508 | 29711.8108 |
| shared | 2026 | 11 | NS | gross | 38899.9011 | 39110.8611 |
| shared | 2026 | 11 | NS | avg | 0.2255 | 0.2273 |
| shared | 2026 | 11 | NS | grossAvg | 0.3242 | 0.3259 |
| shared | 2026 | 11 | NS | p0.pKid | 210.96 | 0 |
| shared | 2026 | 11 | NS | p0.kidAmt | 2400 | 0 |
| shared | 2026 | 11 | NS | p0.prov | 14301.9936 | 14512.9536 |
| shared | 2026 | 11 | NS | p0.total | 35270.3708 | 35481.3308 |
| shared | 2026 | 11 | NS | p1.kidAmt | 0 | 2400 |
| shared | 2026 | 23 | NS | margBy.fd | 0.2764 | 0.2756 |
| shared | 2026 | 24 | NB | margBy.fd | 0.3175 | 0.3101 |
| shared | 2026 | 25 | NB | margBy.fd | 0.3175 | 0.3101 |
| shared | 2026 | 29 | SK | margBy.ed | -0.021 | 0.1308 |
| shared | 2026 | 29 | SK | margBy.nd | 0.1489 | 0.1779 |
| shared | 2026 | 29 | SK | margBy.fd | 0.3884 | 0.4302 |
| shared | 2026 | 29 | SK | p0.pKid | 3510.36 | 1940.9408 |
| shared | 2026 | 29 | SK | p0.kidAmt | 33432 | 0 |
| shared | 2026 | 29 | SK | p0.prov | 26169.2134 | 27738.6326 |
| shared | 2026 | 29 | SK | p0.total | 86839.9843 | 88409.4035 |
| shared | 2026 | 29 | SK | p1.pKid | 0 | 1569.4192 |
| shared | 2026 | 29 | SK | p1.kidAmt | 0 | 33432 |
| shared | 2026 | 29 | SK | p1.prov | 1569.4192 | 0 |
| shared | 2026 | 29 | SK | p1.total | 6674.0483 | 5104.629 |
| shared | 2026 | 32 | SK | p0.pKid | 0 | 877.59 |
| shared | 2026 | 32 | SK | p0.kidAmt | 0 | 8358 |
| shared | 2026 | 32 | SK | p0.prov | 1569.4192 | 691.8292 |
| shared | 2026 | 32 | SK | p0.total | 6674.0483 | 5796.4583 |
| shared | 2026 | 32 | SK | p1.pKid | 877.59 | 0 |
| shared | 2026 | 32 | SK | p1.kidAmt | 8358 | 0 |
| shared | 2026 | 32 | SK | p1.prov | 10263.4254 | 11141.0154 |
| shared | 2026 | 32 | SK | p1.total | 33535.0826 | 34412.6726 |
| shared | 2026 | 32 | NU | p0.pKid | 0 | 48 |
| shared | 2026 | 32 | NU | p0.kidAmt | 0 | 1200 |
| shared | 2026 | 32 | NU | p0.prov | 626.754 | 578.754 |
| shared | 2026 | 32 | NU | p0.total | 6491.383 | 6443.383 |
| shared | 2026 | 32 | NU | p1.pKid | 48 | 0 |
| shared | 2026 | 32 | NU | p1.kidAmt | 1200 | 0 |
| shared | 2026 | 32 | NU | p1.prov | 5772.4392 | 5820.4392 |
| shared | 2026 | 32 | NU | p1.total | 31444.0964 | 31492.0964 |
| shared | 2026 | 32 | NS | margBy.cg | 0.1608 | 0.1607 |
| shared | 2026 | 32 | NS | p0.pKid | 0 | 105.48 |
| shared | 2026 | 32 | NS | p0.kidAmt | 0 | 1200 |
| shared | 2026 | 32 | NS | p0.prov | 2466.7512 | 2361.2712 |
| shared | 2026 | 32 | NS | p0.total | 7571.3802 | 7465.9002 |
| shared | 2026 | 32 | NS | p1.pKid | 105.48 | 0 |
| shared | 2026 | 32 | NS | p1.kidAmt | 1200 | 0 |
| shared | 2026 | 32 | NS | p1.prov | 15456.2964 | 15561.7764 |
| shared | 2026 | 32 | NS | p1.total | 38727.9536 | 38833.4336 |
| shared | 2026 | 37 | SK | p0.kidAmt | 0 | 33432 |
| shared | 2026 | 37 | SK | p1.kidAmt | 33432 | 0 |
| shared | 2026 | 37 | NU | margBy.fd | 0.7564 | 0.7558 |
| shared | 2026 | 37 | NU | p0.pKid | 0 | 26.754 |
| shared | 2026 | 37 | NU | p0.kidAmt | 0 | 4800 |
| shared | 2026 | 37 | NU | p0.prov | 26.754 | 0 |
| shared | 2026 | 37 | NU | p0.total | 3791.383 | 3764.629 |
| shared | 2026 | 37 | NU | p1.pKid | 192 | 165.246 |
| shared | 2026 | 37 | NU | p1.kidAmt | 4800 | 0 |
| shared | 2026 | 37 | NU | p1.prov | 567.466 | 594.22 |
| shared | 2026 | 37 | NU | p1.total | 7758.787 | 7785.541 |
| shared | 2026 | 37 | NB | margBy.fd | 0.8466 | 0.8375 |
| shared | 2026 | 37 | NS | margBy.fd | 0.8374 | 0.8273 |
| shared | 2026 | 37 | NS | p0.pKid | 0 | 421.92 |
| shared | 2026 | 37 | NS | p0.kidAmt | 0 | 4800 |
| shared | 2026 | 37 | NS | p0.prov | 737.9952 | 316.0752 |
| shared | 2026 | 37 | NS | p0.total | 3742.6242 | 3320.7042 |
| shared | 2026 | 37 | NS | p1.pKid | 421.92 | 0 |
| shared | 2026 | 37 | NS | p1.kidAmt | 4800 | 0 |
| shared | 2026 | 37 | NS | p1.prov | 2577.3218 | 2999.2418 |
| shared | 2026 | 37 | NS | p1.total | 8828.6428 | 9250.5628 |
| shared | 2026 | 39 | SK | total | 32419.4999 | 32595.2443 |
| shared | 2026 | 39 | SK | prov | 6522.7213 | 6698.4657 |
| shared | 2026 | 39 | SK | netTotal | 30835.4999 | 31011.2443 |
| shared | 2026 | 39 | SK | marg | 0.4752 | 0.4786 |
| shared | 2026 | 39 | SK | invTax | 51682.4024 | 51858.1468 |
| shared | 2026 | 39 | SK | incomeTax | 29635.3599 | 29811.1043 |
| shared | 2026 | 39 | SK | gross | 34213.8599 | 34389.6043 |
| shared | 2026 | 39 | SK | avg | 0.1621 | 0.163 |
| shared | 2026 | 39 | SK | grossAvg | 0.1711 | 0.1719 |
| shared | 2026 | 39 | SK | margBy.ord | 0.4752 | 0.4786 |
| shared | 2026 | 39 | SK | margBy.cg | 0.2086 | 0.2103 |
| shared | 2026 | 39 | SK | margBy.ed | 0.2742 | 0.2789 |
| shared | 2026 | 39 | SK | margBy.nd | 0.3682 | 0.3721 |
| shared | 2026 | 39 | SK | margBy.fd | 0.5802 | 0.5625 |
| shared | 2026 | 39 | SK | p0.pKid | 2632.77 | 0 |
| shared | 2026 | 39 | SK | p0.kidAmt | 25074 | 0 |
| shared | 2026 | 39 | SK | p0.pFtc | 430.7439 | 853.3903 |
| shared | 2026 | 39 | SK | p0.prov | 2252.4674 | 4462.591 |
| shared | 2026 | 39 | SK | p0.total | 14995.1468 | 17205.2705 |
| shared | 2026 | 39 | SK | p1.pKid | 0 | 2632.77 |
| shared | 2026 | 39 | SK | p1.kidAmt | 0 | 25074 |
| shared | 2026 | 39 | SK | p1.pFtc | 1256.0494 | 657.6586 |
| shared | 2026 | 39 | SK | p1.prov | 4270.2539 | 2235.8747 |
| shared | 2026 | 39 | SK | p1.total | 17634.713 | 15600.3339 |
| shared | 2026 | 40 | NB | margBy.fd | 0.6813 | 0.6691 |
| shared | 2026 | 42 | SK | p0.pKid | 1755.18 | 0 |
| shared | 2026 | 42 | SK | p0.kidAmt | 16716 | 0 |
| shared | 2026 | 42 | SK | p0.prov | 11196.7354 | 12951.9154 |
| shared | 2026 | 42 | SK | p0.total | 39536.7137 | 41291.8937 |
| shared | 2026 | 42 | SK | p1.pKid | 0 | 1755.18 |
| shared | 2026 | 42 | SK | p1.kidAmt | 0 | 16716 |
| shared | 2026 | 42 | SK | p1.prov | 2442.7882 | 687.6082 |
| shared | 2026 | 42 | SK | p1.total | 9394.1093 | 7638.9292 |
| shared | 2026 | 42 | NU | p0.pKid | 96 | 0 |
| shared | 2026 | 42 | NU | p0.kidAmt | 2400 | 0 |
| shared | 2026 | 42 | NU | p0.prov | 7427.3832 | 7523.3832 |
| shared | 2026 | 42 | NU | p0.total | 37767.3615 | 37863.3615 |
| shared | 2026 | 42 | NU | p1.pKid | 0 | 96 |
| shared | 2026 | 42 | NU | p1.kidAmt | 0 | 2400 |
| shared | 2026 | 42 | NU | p1.prov | 959.466 | 863.466 |
| shared | 2026 | 42 | NU | p1.total | 8850.787 | 8754.787 |
| shared | 2026 | 42 | NS | p0.pKid | 210.96 | 0 |
| shared | 2026 | 42 | NS | p0.kidAmt | 2400 | 0 |
| shared | 2026 | 42 | NS | p0.prov | 18970.7564 | 19181.7164 |
| shared | 2026 | 42 | NS | p0.total | 47310.7347 | 47521.6947 |
| shared | 2026 | 42 | NS | p1.pKid | 0 | 210.96 |
| shared | 2026 | 42 | NS | p1.kidAmt | 0 | 2400 |
| shared | 2026 | 42 | NS | p1.prov | 3746.7418 | 3535.7818 |
| shared | 2026 | 42 | NS | p1.total | 10698.0628 | 10487.1028 |
| shared | 2026 | 46 | SK | p0.kidAmt | 8358 | 0 |
| shared | 2026 | 46 | SK | p1.kidAmt | 0 | 8358 |
| shared | 2026 | 46 | NU | p0.kidAmt | 1200 | 0 |
| shared | 2026 | 46 | NU | p1.kidAmt | 0 | 1200 |
| shared | 2026 | 46 | NS | p0.kidAmt | 1200 | 0 |
| shared | 2026 | 46 | NS | p1.kidAmt | 0 | 1200 |
| shared | 2026 | 47 | SK | p0.pKid | 0 | 2632.77 |
| shared | 2026 | 47 | SK | p0.kidAmt | 0 | 25074 |
| shared | 2026 | 47 | SK | p0.prov | 8513.6845 | 5880.9145 |
| shared | 2026 | 47 | SK | p0.total | 27296.4582 | 24663.6883 |
| shared | 2026 | 47 | SK | p1.pKid | 2632.77 | 0 |
| shared | 2026 | 47 | SK | p1.kidAmt | 25074 | 0 |
| shared | 2026 | 47 | SK | p1.prov | 26619.6054 | 29252.3754 |
| shared | 2026 | 47 | SK | p1.total | 85913.1328 | 88545.9028 |
| shared | 2026 | 47 | NU | p0.pKid | 0 | 96 |
| shared | 2026 | 47 | NU | p0.kidAmt | 0 | 2400 |
| shared | 2026 | 47 | NU | p0.prov | 4071.4892 | 3975.4892 |
| shared | 2026 | 47 | NU | p0.total | 24214.263 | 24118.263 |
| shared | 2026 | 47 | NU | p1.pKid | 96 | 0 |
| shared | 2026 | 47 | NU | p1.kidAmt | 2400 | 0 |
| shared | 2026 | 47 | NU | p1.prov | 19110.2892 | 19206.2892 |
| shared | 2026 | 47 | NU | p1.total | 83403.8166 | 83499.8166 |
| shared | 2026 | 47 | NS | p0.pKid | 0 | 210.96 |
| shared | 2026 | 47 | NS | p0.kidAmt | 0 | 2400 |
| shared | 2026 | 47 | NS | p0.prov | 11977.708 | 11766.748 |
| shared | 2026 | 47 | NS | p0.total | 30760.4818 | 30549.5218 |
| shared | 2026 | 47 | NS | p1.pKid | 210.96 | 0 |
| shared | 2026 | 47 | NS | p1.kidAmt | 2400 | 0 |
| shared | 2026 | 47 | NS | p1.prov | 41312.0314 | 41522.9914 |
| shared | 2026 | 47 | NS | p1.total | 100605.5588 | 100816.5188 |
| shared | 2026 | 50 | NB | margBy.fd | 0.6166 | 0.6124 |
| shared | 2026 | 56 | NS | margBy.fd | 0.2607 | 0.2486 |
| shared | 2026 | 60 | SK | p0.kidAmt | 8358 | 0 |
| shared | 2026 | 60 | SK | p1.kidAmt | 0 | 8358 |
| shared | 2026 | 60 | NU | p0.kidAmt | 1200 | 0 |
| shared | 2026 | 60 | NU | p1.kidAmt | 0 | 1200 |
| shared | 2026 | 60 | NS | total | -1585.8829 | -1480.4029 |
| shared | 2026 | 60 | NS | prov | 197.0868 | 302.5668 |
| shared | 2026 | 60 | NS | netTotal | -11935.4132 | -11829.9332 |
| shared | 2026 | 60 | NS | incomeTax | 197.0868 | 302.5668 |
| shared | 2026 | 60 | NS | gross | 12404.1171 | 12509.5971 |
| shared | 2026 | 60 | NS | avg | -0.0529 | -0.0493 |
| shared | 2026 | 60 | NS | grossAvg | 0.4135 | 0.417 |
| shared | 2026 | 60 | NS | p0.pKid | 105.48 | 0 |
| shared | 2026 | 60 | NS | p0.kidAmt | 1200 | 0 |
| shared | 2026 | 60 | NS | p0.prov | 197.0868 | 302.5668 |
| shared | 2026 | 60 | NS | p0.total | 1656.4368 | 1761.9168 |
| shared | 2026 | 60 | NS | p1.kidAmt | 0 | 1200 |
| shared | 2026 | 61 | SK | p0.kidAmt | 16716 | 0 |
| shared | 2026 | 61 | SK | p1.kidAmt | 0 | 16716 |
| shared | 2026 | 61 | NU | p0.kidAmt | 1200 | 0 |
| shared | 2026 | 61 | NU | p1.kidAmt | 0 | 1200 |
| shared | 2026 | 61 | NB | margBy.fd | 0.6016 | 0.5974 |
| shared | 2026 | 61 | NS | total | 13861.4936 | 13966.9736 |
| shared | 2026 | 61 | NS | prov | 5671.3446 | 5776.8246 |
| shared | 2026 | 61 | NS | netTotal | 3781.4936 | 3886.9736 |
| shared | 2026 | 61 | NS | incomeTax | 10256.2636 | 10361.7436 |
| shared | 2026 | 61 | NS | gross | 25282.4136 | 25387.8936 |
| shared | 2026 | 61 | NS | avg | 0.2038 | 0.2054 |
| shared | 2026 | 61 | NS | grossAvg | 0.3718 | 0.3734 |
| shared | 2026 | 61 | NS | p0.pKid | 105.48 | 0 |
| shared | 2026 | 61 | NS | p0.kidAmt | 1200 | 0 |
| shared | 2026 | 61 | NS | p0.prov | 5671.3446 | 5776.8246 |
| shared | 2026 | 61 | NS | p0.total | 15202.4136 | 15307.8936 |
| shared | 2026 | 61 | NS | p1.kidAmt | 0 | 1200 |
| shared | 2026 | 64 | NB | margBy.fd | 0.7266 | 0.7224 |
| shared | 2026 | 65 | SK | p0.kidAmt | 25074 | 0 |
| shared | 2026 | 65 | SK | p1.kidAmt | 0 | 25074 |
| shared | 2026 | 65 | NU | p0.kidAmt | 1200 | 0 |
| shared | 2026 | 65 | NU | p1.kidAmt | 0 | 1200 |
| shared | 2026 | 65 | NS | total | 19139.9211 | 19245.4011 |
| shared | 2026 | 65 | NS | prov | 10907.4736 | 11012.9536 |
| shared | 2026 | 65 | NS | netTotal | 15510.3908 | 15615.8708 |
| shared | 2026 | 65 | NS | incomeTax | 21905.7908 | 22011.2708 |
| shared | 2026 | 65 | NS | gross | 31304.8411 | 31410.3211 |
| shared | 2026 | 65 | NS | avg | 0.1914 | 0.1925 |
| shared | 2026 | 65 | NS | grossAvg | 0.313 | 0.3141 |
| shared | 2026 | 65 | NS | p0.pKid | 105.48 | 0 |
| shared | 2026 | 65 | NS | p0.kidAmt | 1200 | 0 |
| shared | 2026 | 65 | NS | p0.prov | 10907.4736 | 11012.9536 |
| shared | 2026 | 65 | NS | p0.total | 27675.3108 | 27780.7908 |
| shared | 2026 | 65 | NS | p1.kidAmt | 0 | 1200 |
| shared | 2026 | 68 | SK | p0.kidAmt | 16716 | 0 |
| shared | 2026 | 68 | SK | p1.kidAmt | 0 | 16716 |
| shared | 2026 | 69 | SK | margBy.fd | 0.4359 | 0.4252 |
| shared | 2026 | 69 | SK | p0.pKid | 3510.36 | 2717.2688 |
| shared | 2026 | 69 | SK | p0.kidAmt | 33432 | 0 |
| shared | 2026 | 69 | SK | p0.prov | 2055.6554 | 2848.7467 |
| shared | 2026 | 69 | SK | p0.total | 15683.7726 | 16476.8639 |
| shared | 2026 | 69 | SK | p1.pKid | 0 | 793.0912 |
| shared | 2026 | 69 | SK | p1.kidAmt | 0 | 33432 |
| shared | 2026 | 69 | SK | p1.prov | 793.0912 | 0 |
| shared | 2026 | 69 | SK | p1.total | 4256.2162 | 3463.125 |
| shared | 2026 | 69 | NU | margBy.fd | 0.3749 | 0.3743 |
| shared | 2026 | 69 | NU | p0.pKid | 48 | 0 |
| shared | 2026 | 69 | NU | p0.kidAmt | 1200 | 0 |
| shared | 2026 | 69 | NU | p0.prov | 2505.0192 | 2553.0192 |
| shared | 2026 | 69 | NU | p0.total | 17633.1364 | 17681.1364 |
| shared | 2026 | 69 | NU | p1.pKid | 0 | 48 |
| shared | 2026 | 69 | NU | p1.kidAmt | 0 | 1200 |
| shared | 2026 | 69 | NU | p1.prov | 331.01 | 283.01 |
| shared | 2026 | 69 | NU | p1.total | 4394.135 | 4346.135 |
| shared | 2026 | 69 | NS | p0.pKid | 105.48 | 0 |
| shared | 2026 | 69 | NS | p0.kidAmt | 1200 | 0 |
| shared | 2026 | 69 | NS | p0.prov | 7843.3916 | 7948.8716 |
| shared | 2026 | 69 | NS | p0.total | 21471.5088 | 21576.9888 |
| shared | 2026 | 69 | NS | p1.pKid | 0 | 105.48 |
| shared | 2026 | 69 | NS | p1.kidAmt | 0 | 1200 |
| shared | 2026 | 69 | NS | p1.prov | 1406.5978 | 1301.1178 |
| shared | 2026 | 69 | NS | p1.total | 4869.7228 | 4764.2428 |
| shared | 2026 | 70 | SK | p0.kidAmt | 16716 | 0 |
| shared | 2026 | 70 | SK | p1.kidAmt | 0 | 16716 |
| shared | 2026 | 70 | NU | p0.kidAmt | 1200 | 0 |
| shared | 2026 | 70 | NU | p1.kidAmt | 0 | 1200 |
| shared | 2026 | 70 | NS | margBy.cg | 0.2814 | 0.2815 |
| shared | 2026 | 70 | NS | margBy.fd | 0.7998 | 0.8068 |
| shared | 2026 | 70 | NS | p0.pKid | 105.48 | 0 |
| shared | 2026 | 70 | NS | p0.kidAmt | 1200 | 0 |
| shared | 2026 | 70 | NS | p0.prov | 3641.2618 | 3746.7418 |
| shared | 2026 | 70 | NS | p0.total | 10373.2028 | 10478.6828 |
| shared | 2026 | 70 | NS | p1.pKid | 0 | 105.48 |
| shared | 2026 | 70 | NS | p1.kidAmt | 0 | 1200 |
| shared | 2026 | 70 | NS | p1.prov | 188.0401 | 82.5601 |
| shared | 2026 | 70 | NS | p1.total | 1116.7901 | 1011.3101 |
| shared | 2026 | 72 | NB | margBy.fd | 0.4913 | 0.4714 |
| shared | 2026 | 79 | SK | p0.kidAmt | 25074 | 0 |
| shared | 2026 | 79 | SK | p1.kidAmt | 0 | 25074 |
| shared | 2026 | 79 | NS | margBy.fd | 0.2827 | 0.2709 |
| shared | 2026 | 80 | SK | p0.kidAmt | 50148 | 0 |
| shared | 2026 | 80 | SK | p1.kidAmt | 0 | 50148 |
| shared | 2026 | 80 | NU | p0.kidAmt | 4800 | 0 |
| shared | 2026 | 80 | NU | p1.kidAmt | 0 | 4800 |
| shared | 2026 | 80 | NS | total | -40641.0297 | -40496.2867 |
| shared | 2026 | 80 | NS | prov | 0 | 144.743 |
| shared | 2026 | 80 | NS | netTotal | -42422.56 | -42277.817 |
| shared | 2026 | 80 | NS | marg | 0.353 | 0.4952 |
| shared | 2026 | 80 | NS | invTax | 16982.29 | 17127.033 |
| shared | 2026 | 80 | NS | incomeTax | 0 | 144.743 |
| shared | 2026 | 80 | NS | gross | 2179.6803 | 2324.4233 |
| shared | 2026 | 80 | NS | avg | -0.5567 | -0.5547 |
| shared | 2026 | 80 | NS | grossAvg | 0.0299 | 0.0318 |
| shared | 2026 | 80 | NS | margBy.ord | 0.353 | 0.4952 |
| shared | 2026 | 80 | NS | margBy.cg | 0.14 | 0.2147 |
| shared | 2026 | 80 | NS | margBy.ed | 0.3864 | 0.4706 |
| shared | 2026 | 80 | NS | margBy.nd | 0.322 | 0.4767 |
| shared | 2026 | 80 | NS | margBy.fd | 0.43 | 0.5769 |
| shared | 2026 | 80 | NS | p0.pDtc | 4608.023 | 4885.2 |
| shared | 2026 | 80 | NS | p0.pKid | 421.92 | 0 |
| shared | 2026 | 80 | NS | p0.kidAmt | 4800 | 0 |
| shared | 2026 | 80 | NS | p0.prov | 0 | 144.743 |
| shared | 2026 | 80 | NS | p0.total | 398.15 | 542.893 |
| shared | 2026 | 80 | NS | p1.kidAmt | 0 | 4800 |
| shared | 2026 | 86 | SK | p0.pKid | 0 | 3510.36 |
| shared | 2026 | 86 | SK | p0.kidAmt | 0 | 33432 |
| shared | 2026 | 86 | SK | p0.prov | 8641.0154 | 5130.6554 |
| shared | 2026 | 86 | SK | p0.total | 27712.1326 | 24201.7726 |
| shared | 2026 | 86 | SK | p1.pKid | 3510.36 | 0 |
| shared | 2026 | 86 | SK | p1.kidAmt | 33432 | 0 |
| shared | 2026 | 86 | SK | p1.prov | 12692.0154 | 16202.3754 |
| shared | 2026 | 86 | SK | p1.total | 46363.6726 | 49874.0326 |
| shared | 2026 | 86 | NU | p0.pKid | 0 | 48 |
| shared | 2026 | 86 | NU | p0.kidAmt | 0 | 1200 |
| shared | 2026 | 86 | NU | p0.prov | 4275.0192 | 4227.0192 |
| shared | 2026 | 86 | NU | p0.total | 25346.1364 | 25298.1364 |
| shared | 2026 | 86 | NU | p1.pKid | 48 | 0 |
| shared | 2026 | 86 | NU | p1.kidAmt | 1200 | 0 |
| shared | 2026 | 86 | NU | p1.prov | 9372.4392 | 9420.4392 |
| shared | 2026 | 86 | NU | p1.total | 46244.0964 | 46292.0964 |
| shared | 2026 | 86 | NS | p0.pKid | 0 | 105.48 |
| shared | 2026 | 86 | NS | p0.kidAmt | 0 | 1200 |
| shared | 2026 | 86 | NS | p0.prov | 12061.7764 | 11956.2964 |
| shared | 2026 | 86 | NS | p0.total | 31132.8936 | 31027.4136 |
| shared | 2026 | 86 | NS | p1.pKid | 105.48 | 0 |
| shared | 2026 | 86 | NS | p1.kidAmt | 1200 | 0 |
| shared | 2026 | 86 | NS | p1.prov | 22517.5114 | 22622.9914 |
| shared | 2026 | 86 | NS | p1.total | 56189.1686 | 56294.6486 |
| shared | 2026 | 89 | SK | total | 1071.7082 | 780.4645 |
| shared | 2026 | 89 | SK | prov | 1044.4193 | 753.1755 |
| shared | 2026 | 89 | SK | netTotal | -6644.2917 | -6935.5355 |
| shared | 2026 | 89 | SK | marg | 0.2992 | 0.4067 |
| shared | 2026 | 89 | SK | incomeTax | 7408.9733 | 7117.7295 |
| shared | 2026 | 89 | SK | gross | 21757.8733 | 21466.6295 |
| shared | 2026 | 89 | SK | avg | 0.0115 | 0.0084 |
| shared | 2026 | 89 | SK | grossAvg | 0.234 | 0.2308 |
| shared | 2026 | 89 | SK | margBy.ord | 0.2992 | 0.4067 |
| shared | 2026 | 89 | SK | margBy.cg | 0.1175 | 0.1706 |
| shared | 2026 | 89 | SK | margBy.ed | 0.117 | 0.1283 |
| shared | 2026 | 89 | SK | margBy.nd | 0.1664 | 0.2718 |
| shared | 2026 | 89 | SK | margBy.fd | 0.2999 | 0.4015 |
| shared | 2026 | 89 | SK | p0.pKid | 3219.1163 | 2465.9408 |
| shared | 2026 | 89 | SK | p0.kidAmt | 33432 | 0 |
| shared | 2026 | 89 | SK | p0.prov | 0 | 753.1755 |
| shared | 2026 | 89 | SK | p0.total | 8592.825 | 9346.0005 |
| shared | 2026 | 89 | SK | p1.pKid | 0 | 1044.4193 |
| shared | 2026 | 89 | SK | p1.kidAmt | 0 | 33432 |
| shared | 2026 | 89 | SK | p1.prov | 1044.4193 | 0 |
| shared | 2026 | 89 | SK | p1.total | 5449.0483 | 4404.629 |
| shared | 2026 | 89 | NU | margBy.fd | 0.3195 | 0.3168 |
| shared | 2026 | 89 | NU | p0.pKid | 144 | 0 |
| shared | 2026 | 89 | NU | p0.kidAmt | 3600 | 0 |
| shared | 2026 | 89 | NU | p0.prov | 1111.21 | 1255.21 |
| shared | 2026 | 89 | NU | p0.total | 10804.035 | 10948.035 |
| shared | 2026 | 89 | NU | p1.pKid | 0 | 144 |
| shared | 2026 | 89 | NU | p1.kidAmt | 0 | 3600 |
| shared | 2026 | 89 | NU | p1.prov | 426.754 | 282.754 |
| shared | 2026 | 89 | NU | p1.total | 5591.383 | 5447.383 |
| shared | 2026 | 89 | NS | p0.pKid | 316.44 | 0 |
| shared | 2026 | 89 | NS | p0.kidAmt | 3600 | 0 |
| shared | 2026 | 89 | NS | p0.prov | 4568.0713 | 4884.5113 |
| shared | 2026 | 89 | NS | p0.total | 13160.8963 | 13477.3363 |
| shared | 2026 | 89 | NS | p1.pKid | 0 | 316.44 |
| shared | 2026 | 89 | NS | p1.kidAmt | 0 | 3600 |
| shared | 2026 | 89 | NS | p1.prov | 1719.2512 | 1402.8112 |
| shared | 2026 | 89 | NS | p1.total | 6123.8802 | 5807.4402 |
| shared | 2026 | 90 | NB | margBy.fd | 0.3479 | 0.346 |
| shared | 2026 | 91 | SK | p0.kidAmt | 8358 | 0 |
| shared | 2026 | 91 | SK | p1.kidAmt | 0 | 8358 |
| shared | 2026 | 91 | NU | p0.kidAmt | 1200 | 0 |
| shared | 2026 | 91 | NU | p1.kidAmt | 0 | 1200 |
| shared | 2026 | 91 | NS | p0.kidAmt | 1200 | 0 |
| shared | 2026 | 91 | NS | p1.kidAmt | 0 | 1200 |
| shared | 2026 | 98 | SK | total | -13336.4446 | -15779.2329 |
| shared | 2026 | 98 | SK | prov | 2442.7882 | 0 |
| shared | 2026 | 98 | SK | netTotal | -17111.5843 | -19554.3726 |
| shared | 2026 | 98 | SK | invTax | 12610.6599 | 10184.6349 |
| shared | 2026 | 98 | SK | incomeTax | 7553.5807 | 5110.7924 |
| shared | 2026 | 98 | SK | gross | 16142.4204 | 13699.6321 |
| shared | 2026 | 98 | SK | avg | -0.117 | -0.1384 |
| shared | 2026 | 98 | SK | grossAvg | 0.1416 | 0.1202 |
| shared | 2026 | 98 | SK | p0.pDtc | 1309.3833 | 3752.1715 |
| shared | 2026 | 98 | SK | p0.pKid | 5265.54 | 2822.7518 |
| shared | 2026 | 98 | SK | p0.kidAmt | 50148 | 0 |
| shared | 2026 | 98 | SK | p1.pKid | 0 | 2442.7882 |
| shared | 2026 | 98 | SK | p1.kidAmt | 0 | 50148 |
| shared | 2026 | 98 | SK | p1.prov | 2442.7882 | 0 |
| shared | 2026 | 98 | SK | p1.total | 9394.1093 | 6951.321 |
| shared | 2026 | 98 | NU | total | -15493.6069 | -15576.4409 |
| shared | 2026 | 98 | NU | prov | 959.466 | 876.632 |
| shared | 2026 | 98 | NU | netTotal | -17214.9066 | -17297.7406 |
| shared | 2026 | 98 | NU | marg | 0.3836 | 0.4503 |
| shared | 2026 | 98 | NU | invTax | 13067.3794 | 12984.5454 |
| shared | 2026 | 98 | NU | incomeTax | 6070.2584 | 5987.4244 |
| shared | 2026 | 98 | NU | gross | 13985.2581 | 13902.4241 |
| shared | 2026 | 98 | NU | avg | -0.1359 | -0.1366 |
| shared | 2026 | 98 | NU | grossAvg | 0.1227 | 0.122 |
| shared | 2026 | 98 | NU | margBy.ord | 0.3836 | 0.4503 |
| shared | 2026 | 98 | NU | margBy.cg | 0.15 | 0.185 |
| shared | 2026 | 98 | NU | margBy.ed | 0.2067 | 0.2273 |
| shared | 2026 | 98 | NU | margBy.nd | 0.2412 | 0.2916 |
| shared | 2026 | 98 | NU | margBy.fd | 0.4307 | 0.5005 |
| shared | 2026 | 98 | NU | p0.pDtc | 2958.686 | 3041.52 |
| shared | 2026 | 98 | NU | p0.pKid | 96 | 0 |
| shared | 2026 | 98 | NU | p0.kidAmt | 2400 | 0 |
| shared | 2026 | 98 | NU | p0.prov | 0 | 13.166 |
| shared | 2026 | 98 | NU | p0.total | 3413.1714 | 3426.3374 |
| shared | 2026 | 98 | NU | p1.pKid | 0 | 96 |
| shared | 2026 | 98 | NU | p1.kidAmt | 0 | 2400 |
| shared | 2026 | 98 | NU | p1.prov | 959.466 | 863.466 |
| shared | 2026 | 98 | NU | p1.total | 8850.787 | 8754.787 |
| shared | 2026 | 98 | NS | margBy.fd | 0.5467 | 0.544 |
| shared | 2026 | 98 | NS | p0.pKid | 210.96 | 0 |
| shared | 2026 | 98 | NS | p0.kidAmt | 2400 | 0 |
| shared | 2026 | 98 | NS | p0.prov | 4022.6151 | 4233.5751 |
| shared | 2026 | 98 | NS | p0.total | 6995.7865 | 7206.7465 |
| shared | 2026 | 98 | NS | p1.pKid | 0 | 210.96 |
| shared | 2026 | 98 | NS | p1.kidAmt | 0 | 2400 |
| shared | 2026 | 98 | NS | p1.prov | 3746.7418 | 3535.7818 |
| shared | 2026 | 98 | NS | p1.total | 10698.0628 | 10487.1028 |
| shared | 2026 | 100 | SK | p0.kidAmt | 25074 | 0 |
| shared | 2026 | 100 | SK | p1.kidAmt | 0 | 25074 |
| shared | 2026 | 100 | NU | p0.kidAmt | 2400 | 0 |
| shared | 2026 | 100 | NU | p1.kidAmt | 0 | 2400 |
| shared | 2026 | 100 | NS | p0.kidAmt | 2400 | 0 |
| shared | 2026 | 100 | NS | p1.kidAmt | 0 | 2400 |
| shared | 2026 | 101 | NB | margBy.fd | 0.7466 | 0.7247 |
| shared | 2026 | 101 | NL | margBy.fd | 0.9351 | 0.9159 |
| shared | 2026 | 102 | SK | margBy.fd | 0.3658 | 0.362 |
| shared | 2026 | 102 | SK | p0.pKid | 0 | 877.59 |
| shared | 2026 | 102 | SK | p0.kidAmt | 0 | 8358 |
| shared | 2026 | 102 | SK | p0.prov | 2442.7882 | 1565.1982 |
| shared | 2026 | 102 | SK | p0.total | 9394.1093 | 8516.5193 |
| shared | 2026 | 102 | SK | p1.pKid | 877.59 | 0 |
| shared | 2026 | 102 | SK | p1.kidAmt | 8358 | 0 |
| shared | 2026 | 102 | SK | p1.prov | 3234.5192 | 4112.1092 |
| shared | 2026 | 102 | SK | p1.total | 14043.8682 | 14921.4582 |
| shared | 2026 | 104 | SK | p0.kidAmt | 8358 | 0 |
| shared | 2026 | 104 | SK | p1.kidAmt | 0 | 8358 |
| shared | 2026 | 106 | SK | p0.pKid | 0 | 1755.18 |
| shared | 2026 | 106 | SK | p0.kidAmt | 0 | 16716 |
| shared | 2026 | 106 | SK | p0.prov | 6766.0154 | 5010.8354 |
| shared | 2026 | 106 | SK | p0.total | 22762.1326 | 21006.9526 |
| shared | 2026 | 106 | SK | p1.pKid | 1755.18 | 0 |
| shared | 2026 | 106 | SK | p1.kidAmt | 16716 | 0 |
| shared | 2026 | 106 | SK | p1.prov | 20247.1954 | 22002.3754 |
| shared | 2026 | 106 | SK | p1.total | 64893.2578 | 66648.4378 |
| shared | 2026 | 106 | NU | p0.pKid | 0 | 96 |
| shared | 2026 | 106 | NU | p0.kidAmt | 0 | 2400 |
| shared | 2026 | 106 | NU | p0.prov | 3225.0192 | 3129.0192 |
| shared | 2026 | 106 | NU | p0.total | 20921.1364 | 20825.1364 |
| shared | 2026 | 106 | NU | p1.pKid | 96 | 0 |
| shared | 2026 | 106 | NU | p1.kidAmt | 2400 | 0 |
| shared | 2026 | 106 | NU | p1.prov | 13360.2892 | 13456.2892 |
| shared | 2026 | 106 | NU | p1.total | 62006.3516 | 62102.3516 |
| shared | 2026 | 106 | NS | p0.pKid | 0 | 210.96 |
| shared | 2026 | 106 | NS | p0.kidAmt | 0 | 2400 |
| shared | 2026 | 106 | NS | p0.prov | 9549.1916 | 9338.2316 |
| shared | 2026 | 106 | NS | p0.total | 25545.3088 | 25334.3488 |
| shared | 2026 | 106 | NS | p1.pKid | 210.96 | 0 |
| shared | 2026 | 106 | NS | p1.kidAmt | 2400 | 0 |
| shared | 2026 | 106 | NS | p1.prov | 30812.0314 | 31022.9914 |
| shared | 2026 | 106 | NS | p1.total | 75458.0937 | 75669.0537 |
| shared | 2026 | 107 | NB | margBy.fd | 0.6915 | 0.6826 |
| shared | 2026 | 108 | SK | p0.kidAmt | 16716 | 0 |
| shared | 2026 | 108 | SK | p1.kidAmt | 0 | 16716 |
| shared | 2026 | 108 | NU | p0.kidAmt | 2400 | 0 |
| shared | 2026 | 108 | NU | p1.kidAmt | 0 | 2400 |
| shared | 2026 | 108 | NS | total | 36737.1925 | 36948.1525 |
| shared | 2026 | 108 | NS | prov | 16051.9936 | 16262.9536 |
| shared | 2026 | 108 | NS | netTotal | 31951.8528 | 32162.8128 |
| shared | 2026 | 108 | NS | incomeTax | 33850.8508 | 34061.8108 |
| shared | 2026 | 108 | NS | gross | 44405.7105 | 44616.6705 |
| shared | 2026 | 108 | NS | avg | 0.2296 | 0.2309 |
| shared | 2026 | 108 | NS | grossAvg | 0.2775 | 0.2789 |
| shared | 2026 | 108 | NS | p0.pKid | 210.96 | 0 |
| shared | 2026 | 108 | NS | p0.kidAmt | 2400 | 0 |
| shared | 2026 | 108 | NS | p0.prov | 16051.9936 | 16262.9536 |
| shared | 2026 | 108 | NS | p0.total | 39620.3708 | 39831.3308 |
| shared | 2026 | 108 | NS | p1.kidAmt | 0 | 2400 |
| shared | 2026 | 111 | SK | p0.kidAmt | 50148 | 0 |
| shared | 2026 | 111 | SK | p1.kidAmt | 0 | 50148 |
| shared | 2026 | 111 | NU | p0.kidAmt | 1200 | 0 |
| shared | 2026 | 111 | NU | p1.kidAmt | 0 | 1200 |
| shared | 2026 | 111 | NS | total | -12031.0009 | -11925.5209 |
| shared | 2026 | 111 | NS | prov | 5827.8541 | 5933.3341 |
| shared | 2026 | 111 | NS | netTotal | -22111.0009 | -22005.5209 |
| shared | 2026 | 111 | NS | incomeTax | 12763.2091 | 12868.6891 |
| shared | 2026 | 111 | NS | gross | 26803.9591 | 26909.4391 |
| shared | 2026 | 111 | NS | avg | -0.2187 | -0.2168 |
| shared | 2026 | 111 | NS | grossAvg | 0.4873 | 0.4893 |
| shared | 2026 | 111 | NS | p0.pKid | 105.48 | 0 |
| shared | 2026 | 111 | NS | p0.kidAmt | 1200 | 0 |
| shared | 2026 | 111 | NS | p0.prov | 5827.8541 | 5933.3341 |
| shared | 2026 | 111 | NS | p0.total | 16723.9591 | 16829.4391 |
| shared | 2026 | 111 | NS | p1.kidAmt | 0 | 1200 |
| shared | 2026 | 112 | NB | margBy.fd | 0.4744 | 0.465 |
| shared | 2026 | 116 | SK | total | -21190.8932 | -22760.3125 |
| shared | 2026 | 116 | SK | prov | 1569.4192 | 0 |
| shared | 2026 | 116 | SK | netTotal | -27130.8932 | -28700.3125 |
| shared | 2026 | 116 | SK | incomeTax | 6434.3772 | 4864.958 |
| shared | 2026 | 116 | SK | gross | 17718.6773 | 16149.258 |
| shared | 2026 | 116 | SK | avg | -0.2788 | -0.2995 |
| shared | 2026 | 116 | SK | grossAvg | 0.2331 | 0.2125 |
| shared | 2026 | 116 | SK | p1.pKid | 0 | 1569.4192 |
| shared | 2026 | 116 | SK | p1.prov | 1569.4192 | 0 |
| shared | 2026 | 116 | SK | p1.total | 6674.0483 | 5104.629 |
| shared | 2026 | 116 | NU | margBy.fd | 0.7636 | 0.7585 |
| shared | 2026 | 116 | NB | margBy.fd | 0.6962 | 0.695 |
| shared | 2026 | 116 | NS | margBy.fd | 0.7001 | 0.689 |
| shared | 2026 | 117 | SK | p0.pKid | 2632.77 | 0 |
| shared | 2026 | 117 | SK | p0.kidAmt | 25074 | 0 |
| shared | 2026 | 117 | SK | p0.prov | 8508.2454 | 11141.0154 |
| shared | 2026 | 117 | SK | p0.total | 31779.9026 | 34412.6726 |
| shared | 2026 | 117 | SK | p1.pKid | 0 | 2632.77 |
| shared | 2026 | 117 | SK | p1.kidAmt | 0 | 25074 |
| shared | 2026 | 117 | SK | p1.prov | 4608.6753 | 1975.9053 |
| shared | 2026 | 117 | SK | p1.total | 13864.5775 | 11231.8075 |
| shared | 2026 | 119 | SK | p0.kidAmt | 25074 | 0 |
| shared | 2026 | 119 | SK | p1.kidAmt | 0 | 25074 |
| shared | 2026 | 119 | NU | p0.kidAmt | 2400 | 0 |
| shared | 2026 | 119 | NU | p1.kidAmt | 0 | 2400 |
| shared | 2026 | 119 | NS | marg | 0.0758 | 0.2018 |
| shared | 2026 | 119 | NS | margBy.ord | 0.0758 | 0.2018 |
| shared | 2026 | 119 | NS | margBy.cg | 0 | 0.0642 |
| shared | 2026 | 119 | NS | margBy.ed | 0 | 0.0634 |
| shared | 2026 | 119 | NS | margBy.nd | 0 | 0.1366 |
| shared | 2026 | 119 | NS | margBy.fd | 0 | 0.1331 |
| shared | 2026 | 119 | NS | p0.pKid | 210.96 | 0 |
| shared | 2026 | 119 | NS | p0.kidAmt | 2400 | 0 |
| shared | 2026 | 119 | NS | p0.lowRed | 146.815 | 357.775 |
| shared | 2026 | 119 | NS | p1.kidAmt | 0 | 2400 |
| shared | 2026 | 123 | SK | total | 24248.695 | 23455.6037 |
| shared | 2026 | 123 | SK | prov | 793.0912 | 0 |
| shared | 2026 | 123 | SK | netTotal | -3850.4448 | -4643.536 |
| shared | 2026 | 123 | SK | marg | 0.4903 | 0.3933 |
| shared | 2026 | 123 | SK | incomeTax | 4304.5853 | 3511.494 |
| shared | 2026 | 123 | SK | gross | 39415.625 | 38622.5337 |
| shared | 2026 | 123 | SK | avg | 0.2474 | 0.2393 |
| shared | 2026 | 123 | SK | grossAvg | 0.4022 | 0.3941 |
| shared | 2026 | 123 | SK | margBy.ord | 0.4903 | 0.3933 |
| shared | 2026 | 123 | SK | margBy.cg | 0.2175 | 0.165 |
| shared | 2026 | 123 | SK | margBy.ed | 0.2412 | 0.2481 |
| shared | 2026 | 123 | SK | margBy.nd | 0.3674 | 0.2757 |
| shared | 2026 | 123 | SK | margBy.fd | 0.5108 | 0.4327 |
| shared | 2026 | 123 | SK | p0.pKid | 0 | 793.0912 |
| shared | 2026 | 123 | SK | p0.kidAmt | 0 | 25074 |
| shared | 2026 | 123 | SK | p0.prov | 793.0912 | 0 |
| shared | 2026 | 123 | SK | p0.total | 4256.2162 | 3463.125 |
| shared | 2026 | 123 | SK | p1.kidAmt | 25074 | 0 |
| shared | 2026 | 126 | SK | prov | 13178.3396 | 13178.3397 |
| shared | 2026 | 126 | SK | netTotal | 36880.6613 | 36880.6614 |
| shared | 2026 | 126 | SK | invTax | 17339.4287 | 17339.4288 |
| shared | 2026 | 126 | SK | p0.pKid | 0 | 2632.77 |
| shared | 2026 | 126 | SK | p0.kidAmt | 0 | 25074 |
| shared | 2026 | 126 | SK | p0.prov | 4670.0942 | 2037.3242 |
| shared | 2026 | 126 | SK | p0.total | 10029.2788 | 7396.5087 |
| shared | 2026 | 126 | SK | p1.pKid | 2632.77 | 0 |
| shared | 2026 | 126 | SK | p1.kidAmt | 25074 | 0 |
| shared | 2026 | 126 | SK | p1.prov | 8508.2454 | 11141.0154 |
| shared | 2026 | 126 | SK | p1.total | 31779.9026 | 34412.6726 |
| shared | 2026 | 126 | NU | p0.pKid | 0 | 48 |
| shared | 2026 | 126 | NU | p0.kidAmt | 0 | 1200 |
| shared | 2026 | 126 | NU | p0.prov | 1556.884 | 1508.884 |
| shared | 2026 | 126 | NU | p0.total | 7076.0685 | 7028.0685 |
| shared | 2026 | 126 | NU | p1.pKid | 48 | 0 |
| shared | 2026 | 126 | NU | p1.kidAmt | 1200 | 0 |
| shared | 2026 | 126 | NU | p1.prov | 5772.4392 | 5820.4392 |
| shared | 2026 | 126 | NU | p1.total | 31444.0964 | 31492.0964 |
| shared | 2026 | 126 | NS | invTax | 18750.1946 | 18644.7146 |
| shared | 2026 | 126 | NS | p0.pKid | 0 | 105.48 |
| shared | 2026 | 126 | NS | p0.kidAmt | 0 | 1200 |
| shared | 2026 | 126 | NS | p0.prov | 7171.9466 | 7066.4666 |
| shared | 2026 | 126 | NS | p0.total | 12531.1311 | 12425.6511 |
| shared | 2026 | 126 | NS | p1.pKid | 105.48 | 0 |
| shared | 2026 | 126 | NS | p1.kidAmt | 1200 | 0 |
| shared | 2026 | 126 | NS | p1.prov | 15456.2964 | 15561.7764 |
| shared | 2026 | 126 | NS | p1.total | 38727.9536 | 38833.4336 |
| shared | 2026 | 128 | SK | p0.kidAmt | 8358 | 0 |
| shared | 2026 | 128 | SK | p1.kidAmt | 0 | 8358 |
| shared | 2026 | 128 | NB | margBy.fd | 0.7564 | 0.737 |
| shared | 2026 | 128 | NL | margBy.fd | 0.9948 | 0.9844 |
| shared | 2026 | 129 | SK | p0.pKid | 0 | 2632.77 |
| shared | 2026 | 129 | SK | p0.kidAmt | 0 | 25074 |
| shared | 2026 | 129 | SK | p0.prov | 3219.1163 | 586.3463 |
| shared | 2026 | 129 | SK | p0.total | 11811.9413 | 9179.1713 |
| shared | 2026 | 129 | SK | p1.pKid | 2632.77 | 0 |
| shared | 2026 | 129 | SK | p1.kidAmt | 25074 | 0 |
| shared | 2026 | 129 | SK | p1.prov | 13569.6054 | 16202.3754 |
| shared | 2026 | 129 | SK | p1.total | 47241.2626 | 49874.0326 |
| shared | 2026 | 129 | NU | p0.pKid | 0 | 48 |
| shared | 2026 | 129 | NU | p0.kidAmt | 0 | 1200 |
| shared | 2026 | 129 | NU | p0.prov | 1255.21 | 1207.21 |
| shared | 2026 | 129 | NU | p0.total | 10948.035 | 10900.035 |
| shared | 2026 | 129 | NU | p1.pKid | 48 | 0 |
| shared | 2026 | 129 | NU | p1.kidAmt | 1200 | 0 |
| shared | 2026 | 129 | NU | p1.prov | 9372.4392 | 9420.4392 |
| shared | 2026 | 129 | NU | p1.total | 46244.0964 | 46292.0964 |
| shared | 2026 | 129 | NS | p0.pKid | 0 | 105.48 |
| shared | 2026 | 129 | NS | p0.kidAmt | 0 | 1200 |
| shared | 2026 | 129 | NS | p0.prov | 4884.5113 | 4779.0313 |
| shared | 2026 | 129 | NS | p0.total | 13477.3363 | 13371.8563 |
| shared | 2026 | 129 | NS | p1.pKid | 105.48 | 0 |
| shared | 2026 | 129 | NS | p1.kidAmt | 1200 | 0 |
| shared | 2026 | 129 | NS | p1.prov | 22517.5114 | 22622.9914 |
| shared | 2026 | 129 | NS | p1.total | 56189.1686 | 56294.6486 |
| shared | 2026 | 130 | SK | p0.pKid | 877.59 | 0 |
| shared | 2026 | 130 | SK | p0.kidAmt | 8358 | 0 |
| shared | 2026 | 130 | SK | p0.prov | 23491.7854 | 24369.3754 |
| shared | 2026 | 130 | SK | p0.total | 76896.5674 | 77774.1574 |
| shared | 2026 | 130 | SK | p1.pKid | 0 | 877.59 |
| shared | 2026 | 130 | SK | p1.kidAmt | 0 | 8358 |
| shared | 2026 | 130 | SK | p1.prov | 24902.3754 | 24024.7854 |
| shared | 2026 | 130 | SK | p1.total | 75407.4238 | 74529.8338 |
| shared | 2026 | 133 | SK | p0.kidAmt | 0 | 50148 |
| shared | 2026 | 133 | SK | p1.kidAmt | 50148 | 0 |
| shared | 2026 | 140 | SK | p0.pKid | 877.59 | 0 |
| shared | 2026 | 140 | SK | p0.kidAmt | 8358 | 0 |
| shared | 2026 | 140 | SK | p0.prov | 6563.2343 | 7440.8243 |
| shared | 2026 | 140 | SK | p0.total | 21890.6792 | 22768.2692 |
| shared | 2026 | 140 | SK | p1.pKid | 0 | 877.59 |
| shared | 2026 | 140 | SK | p1.kidAmt | 0 | 8358 |
| shared | 2026 | 140 | SK | p1.prov | 3219.1163 | 2341.5263 |
| shared | 2026 | 140 | SK | p1.total | 11811.9413 | 10934.3513 |
| shared | 2026 | 141 | NB | margBy.fd | 0.6413 | 0.6291 |
| shared | 2026 | 143 | SK | p0.kidAmt | 0 | 8358 |
| shared | 2026 | 143 | SK | p1.kidAmt | 8358 | 0 |
| shared | 2026 | 143 | NU | p0.kidAmt | 0 | 1200 |
| shared | 2026 | 143 | NU | p1.kidAmt | 1200 | 0 |
| shared | 2026 | 143 | NB | invTax | 9412.4736 | 9450.7551 |
| shared | 2026 | 143 | NS | margBy.cg | 0.179 | 0.1789 |
| shared | 2026 | 143 | NS | p0.pKid | 0 | 105.48 |
| shared | 2026 | 143 | NS | p0.kidAmt | 0 | 1200 |
| shared | 2026 | 143 | NS | p0.prov | 317.2003 | 211.7203 |
| shared | 2026 | 143 | NS | p0.total | 1776.5503 | 1671.0703 |
| shared | 2026 | 143 | NS | p1.pKid | 105.48 | 0 |
| shared | 2026 | 143 | NS | p1.kidAmt | 1200 | 0 |
| shared | 2026 | 143 | NS | p1.prov | 2996.0441 | 3101.5241 |
| shared | 2026 | 143 | NS | p1.total | 6853.2026 | 6958.6826 |
| shared | 2026 | 143 | NL | invTax | 11009.7176 | 11094.7383 |
| shared | 2026 | 144 | NB | margBy.fd | 0.6624 | 0.637 |
| shared | 2026 | 144 | NL | margBy.fd | 0.8587 | 0.8279 |
| shared | 2026 | 145 | SK | p0.kidAmt | 0 | 16716 |
| shared | 2026 | 145 | SK | p1.kidAmt | 16716 | 0 |
| shared | 2026 | 145 | NU | p0.kidAmt | 0 | 2400 |
| shared | 2026 | 145 | NU | p1.kidAmt | 2400 | 0 |
| shared | 2026 | 145 | NS | total | 8254.8179 | 8315.1481 |
| shared | 2026 | 145 | NS | prov | 3686.4117 | 3746.7418 |
| shared | 2026 | 145 | NS | netTotal | -78.7123 | -18.3822 |
| shared | 2026 | 145 | NS | incomeTax | 7283.3827 | 7343.7128 |
| shared | 2026 | 145 | NS | gross | 22325.6129 | 22385.9431 |
| shared | 2026 | 145 | NS | avg | 0.0878 | 0.0885 |
| shared | 2026 | 145 | NS | grossAvg | 0.2375 | 0.2381 |
| shared | 2026 | 145 | NS | p0.pKid | 0 | 150.6298 |
| shared | 2026 | 145 | NS | p0.kidAmt | 0 | 2400 |
| shared | 2026 | 145 | NS | p0.prov | 150.6298 | 0 |
| shared | 2026 | 145 | NS | p0.total | 3504.9798 | 3354.35 |
| shared | 2026 | 145 | NS | p1.pKid | 210.96 | 0 |
| shared | 2026 | 145 | NS | p1.kidAmt | 2400 | 0 |
| shared | 2026 | 145 | NS | p1.prov | 3535.7818 | 3746.7418 |
| shared | 2026 | 145 | NS | p1.total | 10487.1028 | 10698.0628 |
| other | 2025 | 148 | NB | margBy.fd | 0.2961 | 0.2897 |
| other | 2025 | 153 | SK | margBy.fd | 0.3236 | 0.3597 |
| other | 2025 | 153 | SK | p0.pKid | 0 | 1617.84 |
| other | 2025 | 153 | SK | p0.kidAmt | 0 | 15408 |
| other | 2025 | 153 | SK | p0.prov | 2381.5313 | 763.6913 |
| other | 2025 | 153 | SK | p0.total | 8772.2575 | 7154.4175 |
| other | 2025 | 153 | SK | p1.pKid | 1617.84 | 0 |
| other | 2025 | 153 | SK | p1.kidAmt | 15408 | 0 |
| other | 2025 | 153 | SK | p1.prov | 1448.0813 | 3065.9213 |
| other | 2025 | 153 | SK | p1.total | 7265.9175 | 8883.7575 |
| other | 2025 | 153 | NU | margBy.fd | 0.2915 | 0.2925 |
| other | 2025 | 153 | NU | p0.pKid | 0 | 48 |
| other | 2025 | 153 | NU | p0.kidAmt | 0 | 1200 |
| other | 2025 | 153 | NU | p0.prov | 915.93 | 867.93 |
| other | 2025 | 153 | NU | p0.total | 8106.6563 | 8058.6563 |
| other | 2025 | 153 | NU | p1.pKid | 48 | 0 |
| other | 2025 | 153 | NU | p1.kidAmt | 1200 | 0 |
| other | 2025 | 153 | NU | p1.prov | 1128.65 | 1176.65 |
| other | 2025 | 153 | NU | p1.total | 7346.4863 | 7394.4863 |
| other | 2025 | 153 | NS | p0.pKid | 0 | 105.48 |
| other | 2025 | 153 | NS | p0.kidAmt | 0 | 1200 |
| other | 2025 | 153 | NS | p0.prov | 3544.928 | 3439.448 |
| other | 2025 | 153 | NS | p0.total | 9935.6542 | 9830.1742 |
| other | 2025 | 153 | NS | p1.pKid | 105.48 | 0 |
| other | 2025 | 153 | NS | p1.kidAmt | 1200 | 0 |
| other | 2025 | 153 | NS | p1.prov | 4332.7002 | 4438.1802 |
| other | 2025 | 153 | NS | p1.total | 10150.5364 | 10256.0164 |
| other | 2025 | 154 | NB | margBy.fd | 0.7118 | 0.6936 |
| other | 2025 | 154 | NL | margBy.fd | 0.9486 | 0.9375 |
| other | 2025 | 155 | NB | margBy.fd | 0.6594 | 0.6517 |
| other | 2025 | 156 | SK | p0.kidAmt | 7704 | 0 |
| other | 2025 | 156 | SK | p1.kidAmt | 0 | 7704 |
| other | 2025 | 157 | NB | margBy.fd | 0.5064 | 0.494 |
| other | 2026 | 148 | NB | margBy.fd | 0.2966 | 0.2895 |
| other | 2026 | 153 | SK | margBy.fd | 0.3245 | 0.3637 |
| other | 2026 | 153 | SK | p0.pKid | 0 | 1755.18 |
| other | 2026 | 153 | SK | p0.kidAmt | 0 | 16716 |
| other | 2026 | 153 | SK | p0.prov | 2288.5013 | 533.3213 |
| other | 2026 | 153 | SK | p0.total | 8503.5063 | 6748.3263 |
| other | 2026 | 153 | SK | p1.pKid | 1755.18 | 0 |
| other | 2026 | 153 | SK | p1.kidAmt | 16716 | 0 |
| other | 2026 | 153 | SK | p1.prov | 1217.5013 | 2972.6813 |
| other | 2026 | 153 | SK | p1.total | 6828.7463 | 8583.9263 |
| other | 2026 | 153 | NU | margBy.fd | 0.2907 | 0.2917 |
| other | 2026 | 153 | NU | p0.pKid | 0 | 48 |
| other | 2026 | 153 | NU | p0.kidAmt | 0 | 1200 |
| other | 2026 | 153 | NU | p0.prov | 900.69 | 852.69 |
| other | 2026 | 153 | NU | p0.total | 7915.695 | 7867.695 |
| other | 2026 | 153 | NU | p1.pKid | 48 | 0 |
| other | 2026 | 153 | NU | p1.kidAmt | 1200 | 0 |
| other | 2026 | 153 | NU | p1.prov | 1113.33 | 1161.33 |
| other | 2026 | 153 | NU | p1.total | 7124.575 | 7172.575 |
| other | 2026 | 153 | NS | margBy.cg | 0.1732 | 0.1733 |
| other | 2026 | 153 | NS | p0.pKid | 0 | 105.48 |
| other | 2026 | 153 | NS | p0.kidAmt | 0 | 1200 |
| other | 2026 | 153 | NS | p0.prov | 3498.6936 | 3393.2136 |
| other | 2026 | 153 | NS | p0.total | 9713.6986 | 9608.2186 |
| other | 2026 | 153 | NS | p1.pKid | 105.48 | 0 |
| other | 2026 | 153 | NS | p1.kidAmt | 1200 | 0 |
| other | 2026 | 153 | NS | p1.prov | 4286.29 | 4391.77 |
| other | 2026 | 153 | NS | p1.total | 9897.535 | 10003.015 |
| other | 2026 | 154 | NB | margBy.fd | 0.712 | 0.6929 |
| other | 2026 | 154 | NL | margBy.fd | 0.9498 | 0.9403 |
| other | 2026 | 155 | NB | margBy.fd | 0.6665 | 0.6581 |
| other | 2026 | 156 | SK | p0.kidAmt | 8358 | 0 |
| other | 2026 | 156 | SK | p1.kidAmt | 0 | 8358 |
| other | 2026 | 157 | NB | margBy.fd | 0.5067 | 0.4935 |

## Validation

`fnm exec --using=26 npm run check` passed with escalation: lint, typecheck, all **1,170 tests** (zero failures),
build and Chromium smoke. Browser coverage: **25 pages, 242 states, 40 contrast scans**, including desktop,
430 px and 375 px in light and dark mode. The targeted claimant suite passes all **88 tests**.
`npm run format`, `git diff --check` and the Markdown checker also pass.

The round 2 exact path comparison confirmed restoration of only the 21 PE foreign marginal values in the
existing annual goldens. Among the original 66 feature cases, only PE's name and the three documented expected
values change; 16 cases are added. `src/ui/notes.ts` selects child-claimant wording from the year's claimant
program data; the text correction leaves engine calculations, data and golden fixtures unchanged.

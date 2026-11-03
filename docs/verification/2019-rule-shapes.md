# 2019 rule shapes

This prerequisite represents the recurring 2019 rules without changing any existing year's data or golden results.
The year integration supplies the amounts and explains historical assumptions in the interface. New formulas select
program identifiers, never calendar years. Source extracts and original-file hashes are in [sources](2019/sources/INDEX.md).

## Alberta: two benefits before ACFB

`alberta-child-benefit-and-employment` calculates the Alberta Child Benefit and Family Employment Tax Credit
separately. The parameters retain cumulative child-count maxima and the existing scalar working reduction shape.
Each positive component is raised to `minAnnual` before summation; zero remains zero.

The [2017 provincial budget](2019/sources/rule-ab-2017-budget.txt), PDF page 101, establishes the 11% employment
phase-in above $2,760, 4% employment reduction, and child benefit reductions of 7%, 10.5%, 14% and 17.5%.
The [2019 CRA guide](2019/sources/rule-t4114.txt), PDF pages 8–9, supplies the indexed amounts: child increments
$1,155/$577/$577/$577, hence cumulative $1,155/$1,732/$2,309/$2,886; employment maxima $801/$1,530/$1,967/$2,113;
and reduction thresholds $26,769 and $43,302 respectively. Maxima stop increasing after four children.

The [December 2015 Queen's Printer consolidation](2019/sources/rule-ab-2015-act.txt), sections 30(3) and 30.1(4),
sets a separate $10 annual minimum for each positive entitlement. This official-authored statute is hosted by a
third-party archival mirror; its provenance and original hash are retained rather than describing the host as official.
The budget and CRA guide independently establish the later rates and indexed amounts.

Independent golden arithmetic:

- At $1,000 above the child threshold, maxima fall by $70/$105/$140/$175 to $1,085/$1,627/$2,169/$2,711.
- Employment income $3,760 gives $110 before its separate reduction. With two children and family income $20,000,
  the combined benefit is $1,732 + $110 = $1,842.
- At family income $44,302 and fully phased-in employment, the four maxima each fall by $40.
- At family income $43,200, one-child ACB is $1,155 − 0.07 × $16,431 = $4.83, raised to $10.
  Employment income $2,770 gives $1.10, independently raised to $10: the combined benefit is $20, not $10.
- The one-child ACB reaches zero at $43,269. Full employment benefit reaches zero at
  $43,302 + $801 / 0.04 = $63,327; $25 before that point its raw $1 entitlement becomes $10.

## Nova Scotia: graduated reduction before the 2020 bands

`nova-scotia-child-benefit-reduction` sums ordered child amounts, then applies a child-count reduction rate to
income above the threshold. The full-amount eligibility boundary is separate from that reduction threshold.

The [1999 regulation](2019/sources/rule-ns-original.txt), PDF pages 4–5, gives the reduction formula, capped at the
benefit itself. [Regulation 280/2009](2019/sources/rule-ns-2009.txt), PDF page 10, establishes full entitlement
below $18,001 and reduction on income above $18,000. [Regulation 148/2012](2019/sources/rule-ns-2012-threshold.txt),
PDF page 5, supplies exact annual amounts $624.96/$825/$900, with the last amount repeated for later children.
[Regulation 100/2014](2019/sources/rule-ns-2014.txt), PDF page 15, supplies 7.81%, 18.12%, and an additional
11.25 percentage points for each child after the second. The earlier May 2012 amendment is also cached for the chain.

The guide rounds the first amount to $625 and describes an income band ending at $26,000. The enacted annual
amount and reduction govern: do not invent a hard $26,000 cliff. At that income the residuals are $0.16 for one
child and $0.36 for two or more; they are all zero at $26,004.

Goldens cover no children, each ordered amount, $18,000/$18,000.50/$18,001, partial reductions at $20,000,
the $26,000 residual and exhaustion. For two children at $20,000: $1,449.96 − 0.1812 × $2,000 = $1,087.56.
For three: $2,349.96 − 0.2937 × $2,000 = $1,762.56.

## Quebec: ordered family allowance amounts

`quebec-family-allowance-by-child` repeats the last entry of each maximum/minimum array, adds the single-parent
supplement, reduces at the supplied rate, floors at the minimum, and adds school supplies for school-age children.
The existing scalar program retains its results.

The [2020 tax parameters publication](2019/sources/rule-qc-allowance.txt), PDF page 15, has a 2019 comparison:
maximum increments $2,472/$1,735/$1,735/$1,852, minimum increments $694/$641, single-parent supplements
$867/$346, thresholds $35,680/$49,044, and $102 school supplies. The 4% reduction is unchanged.

Goldens cover child counts through five, both family types, the onset, reduction and minimum floor, and mixed ages.
Three children give maximum $5,942 and minimum $1,976. A single parent starts at $6,809; $1,000 above the
single threshold gives $6,769 before school supplies. Five children repeat $1,852 and $641 respectively.

## Newfoundland and Labrador: temporary deficit reduction levy

Optional `additionalTax` with program `nl-deficit-reduction-levy` stores ascending
`[taxable-income onset, base levy, rate, cap]` bands. The last applicable band is selected; its capped levy is added
after ordinary provincial credits, including the foreign tax credit. It is provincial income tax, not payroll.
The person breakdown exposes `provincialLevy` for the integration's explanation.

[NL428 for 2019](2019/sources/rule-nl-levy.txt), PDF page 4 line 93 and page 5, establishes this order and all 18
bands. The first onset is $50,000; it charges 10% of the excess up to $100. Each next band's base rises $100,
with the final $600,000 onset having a $1,700 base and $1,800 cap. This is a stepped levy, not one marginal bracket.

The 72 independent levy goldens cover every onset and offsets $500/$1,000/$2,000: respectively the prior cap
(equal to the new base), base + $50, new cap, new cap. Targeted cases prove deductions and dividend gross-ups
affect the taxable base, while non-refundable and foreign credits do not eliminate the levy.

## British Columbia: MSP premiums

Optional `householdPremium` with program `bc-msp-premiums` stores annual premiums per adult in upper-inclusive
income bands. It enters household payroll, total tax and marginal counterfactuals after person totals are summed.
`breakdown.householdPremium` exposes families, adjusted incomes, per-adult rates and total.

The [archived regulation](2019/sources/rule-bc-msp.txt), sections 7.6, 8 and 11, establishes monthly rates
$0/$11.50/$17.50/$23/$28/$32.50/$37.50, with upper limits $26,000/$28,000/$30,000/$34,000/$38,000/$42,000/unlimited.
Annual rates are these amounts times 12: $0/$138/$210/$276/$336/$390/$450 per adult. The
[group procedure guide](2019/sources/rule-bc-msp-guide.txt), PDF page 21, labels the 2018–2019 schedule; its
displayed $23–$75 figures match the regulation's combined couple column, not the per-adult column.
The [premium assistance FAQ](2019/sources/rule-bc-msp-deductions.txt), PDF page 2, confirms a $3,000 spouse
deduction and $3,000 per child less half the claimed childcare deduction.

Adjusted income is `max(0, family net − spouse deduction − child deductions + half childcare claims)`.
A couple is assessed together, including a zero-income spouse. Unrelated modeled taxpayers are separate families,
with children assigned to the first family as elsewhere in this calculator. The assumptions are full-year coverage,
residency/assistance eligibility, adults under 65, no disability/student exemption, and current modeled income rather
than the administrative prior-year assessment. Amount annualization and these assumptions belong in the data notes.

The 19 premium goldens cover every upper boundary and $1 above it, spouse/child deductions and childcare addback.
At family income $29,000 a couple has adjusted income $26,000 and pays zero; at $29,001 it pays $276 annually.
A $2,000 childcare claim adds back $1,000. Integration assertions verify payroll/total changes, unchanged income tax,
an implicit spouse, separate unrelated adults, and the $138 premium jump in the finite-difference marginal result.

## Federal: flat basic personal amount

The federal schema now accepts a number as well as the existing phased amount. The existing `phased()` helper
already handles that representation. [T4127 January 2019](2019/sources/rule-federal-bpa.txt) publishes $12,069;
there is no invented phase-out interval with equal endpoints.

Six independent goldens isolate the amount using one synthetic 15% bracket and foreign income with no withholding.
Final federal tax is `max(0, income − 12069) × 0.15`: $12,068/$12,069/$12,070 yield $0/$0/$0.15; $20,000 gives
$1,189.65; $147,667 and $210,371 give $20,339.70 and $29,745.30. These high-income cases prove the amount stays flat.

## Validation and limits

`tests/golden/history-rules-2019.json` contains 149 independently calculated cases; the targeted test file also
checks credit order, integration and invalid band schedules. Existing year fixtures are unchanged. These programs
activate only when a year explicitly supplies them; this prerequisite does not enable the 2019 selector or data.
Carbon and one-off payments remain separate from these recurring programs.

# Childcare deductions and provincial credits

Issues #95 and #96 add backend federal deductions and Ontario, Quebec and Newfoundland and Labrador childcare
credits for 2025 and 2026. UI integration remains #97. Existing benefit-year parameters continue to use
current-year income.

## Inputs and results

`Household.childcare` holds a mode, a complete child list with annual eligible expenses, and explicit eligible
earned income for every effective adult. The second adult includes a spouse represented by the household count
with no separate income entry. Amounts are annual dollars. Optional `declaredAnnualExpenses` validates the monthly
household amount multiplied by twelve against the sum of child expenses; it never enters the tax formula. A
difference of up to six cents (plus floating-point tolerance) accommodates rounding a monthly average to cents.
A larger mismatch gives `incomplete` / `expenses-not-allocated`, suppresses all childcare relief, and preserves
valid age-derived benefit counts. Eligible expenses exclude reimbursements/fee subsidies, not advance credit payments.

The result distinguishes absent input, completed calculation, incomplete inputs, invalid amounts and situations
requiring manual claims, plus years with no supported rules. Missing earnings do not mean zero. Incomplete/invalid
calculations apply no childcare
deduction; callers must display the status rather than describe that result as a completed zero claim.

Valid detailed ages determine the household's child counts, even while deduction details are incomplete. Children
under 18 count for the existing child benefits, with a separate under-6 count. Older infirm/DTC dependants can
qualify for childcare relief but do not become benefit children. These remain full-year estimates from year-end
ages, not a monthly benefit eligibility calculation. Without detailed children, existing counts are preserved.

## Federal rules

- The ordinary claim is the least of eligible expenses, pooled child annual limits and two-thirds of the
  claimant's eligible earned income. All eligible children contribute to the limit pool, even with zero expenses.
- T778 uses birth-year bands. Year-end ages under 7 have the younger limit; children turning 16 are included in the
  older band. Older dependent children with infirmity and DTC-eligible children have the appropriate separate limit.
- The lower-income supporting adult claims, comparing net income before childcare, after the existing RRSP/FHSA
  and other deduction inputs. A zero-income spouse remains the claimant. At equal incomes the calculator elects
  the first adult; this is deterministic and does not optimize household tax.
- Only an ordinary lone parent or two spouses are automated. Other supporting-person arrangements require manual
  mode. The caller confirms the underlying relationship, expense and residency eligibility; ages alone do not
  establish every condition in T778.
- Manual mode accepts verified per-adult claims, bounded by supplied expenses. It replaces automatic claims and
  deliberately does not reapply ordinary claimant, age, earnings or annual limits to exceptional cases. Users must
  verify the full T778 exception calculation. Claims are not silently transferred or added twice.
- Claims are calculated separately from `Person.ded`; inputs are never mutated. Callers must not duplicate the
  same childcare claim in other deductions.

Explicit eligible earnings stay fixed in marginal/investment counterfactuals, because the ordinary-income field
also contains pensions and other unearned income. Claimant selection is recomputed for each counterfactual.
Investment bumps never increase eligible earnings. A future separate employment-income model can refine this.

## Income bases and existing limitations

The federal claim reduces federal net income, income tax, CCB and federal income-tested credits. In common-system
provinces it also reduces the ordinary provincial income base. Quebec does not deduct this federal claim.
Provincial tax and provincial spouse transfers therefore use the pre-childcare Quebec base, with the existing
worker deduction applied for taxable income. Federal and Quebec spouse claimants can differ in manual cases;
`claim.provincialClaimant` identifies that distinction when present.

The engine exposes raw pre-childcare income, federal net income and provincial taxable/net income in
`breakdown.incomeBases`. The Quebec childcare credit uses the provincial family amount, including the worker
deduction. Ontario CARE uses the raw pre-childcare amounts, floored per person only after the deduction addback.

## Provincial credits and result contract

- Ontario CARE multiplies the allowed federal claim by the ON479-A stepped rate (75% through $20,000, declining
  to 1% through $150,000, then zero). Each started income step reduces the rate. Family income adds back childcare
  to each person's **raw** federal net income before applying the zero floor. Social-benefits repayments have no
  separate input in this model; this calculation assumes none. A repayment entered under other deductions must
  not be mistaken for a supported ON479-A repayment adjustment. The 2026 formula continues the statute and is
  confirmed as an ongoing program in the 2026 budget; without a 2026 return form, the continuation is flagged estimated.
- Quebec uses supplied `qcEligibleExpenses` per child, bounded by that child's expenses, and pools annual limits
  for **all** eligible children, including children without expenses. A positive-expense child needs an explicit
  qualifying portion; omission on a zero-expense child means zero. Missing/invalid Quebec eligibility affects only
  this credit. Subsidized basic fees can qualify federally while the supplied Quebec portion is zero; eligible
  additional fees can be supplied separately as a portion. User attestation includes residence, eligible activity,
  dependency/income and provider requirements, not merely the expense amount.
- Quebec's higher annual limit uses separate `qcSevereImpairment` eligibility. Federal DTC eligibility does not
  silently establish this provincial condition. An older infirm dependant can use the ordinary older-child limit.
  Ordinary year-end ages through 16 qualify in 2025 and through 14 in 2026 (under the cutoff at some time in the year).
  The young-child cap uses year-end ages under 7. Provincial line 275 family income includes the worker deduction
  and excludes the federal childcare deduction. There is no two-thirds earnings cap: attested qualifying activity
  can include job seeking, study or parental benefits, even when federal earned income is zero or not supplied.
- Ontario/Quebec family income is automated only for a lone adult or two spouses. Unresolved supporting-person
  configurations return `unsupported`; verified federal manual claims alone do not establish the provincial base.
- Newfoundland and Labrador applies each person's federal line 21400 claim as line 58320 at the lowest provincial
  bracket rate. It joins ordinary nonrefundable credits before dividends and low-income reductions. It cannot
  exceed tax remaining and is not transferred between adults. The basic-personal-amount switch does not disable it.
- Ontario and Quebec are refundable and follow `useCredits`. NL is nonrefundable and remains in income tax when
  refundable credits are disabled. No credit changes cash earnings, payroll contributions or sales-taxable spending.

`breakdown.childcareCredit` is present for the three supported provinces and contains `program`, `name`, `status`,
`refundable`, `expenses`, `eligibleExpenses`, `annualLimit`, `allowedExpenses`, `income`, `rate`, `calculated`,
`applied` and `reasons`. `calculated` is before the refundable toggle or NL tax floor; `applied` is the amount
actually credited. NL additionally exposes `perPerson` applied amounts and each person's
`breakdown.childcareCredit.{calculated,applied}`. A non-complete status must be explained, not displayed as a
verified zero. Federal `childcare` status remains separate: missing federal earnings does not invalidate a supplied
Quebec qualifying expense. No allocation failure can generate either federal or provincial childcare relief.

Existing Quebec family allowance, solidarity and work-premium programs retain their pre-existing approximation
that omits the worker deduction from the family-income base; this is tracked separately in #103. Their base is
protected from the new federal childcare deduction. CWB's existing secondary-earner exemption limitation is #102.
Enhanced QPP and existing child-credit claimant rules remain #84 and #92. No unrelated golden results are changed.

## Source evidence

- [CRA T778 (2025)](../2025/sources/t778-childcare.txt): claimant, equal-income election, earnings definition,
  birth-year bands, pooled annual limits and exception sections.
- [CRA folio S1-F3-C1](../2026/sources/childcare-folio.txt): rules in force since 2015; paragraph 1.42 independently
  verifies a $19,000 claim for three young children and $30,000 earned income.
- [Quebec Schedule C](../2025/sources/quebec-childcare-schedule.txt): Quebec family income uses provincial line 275.
- [Retraite Québec](../2026/sources/quebec-family-income.txt): Family Allowance uses provincial line 275.
- Both year's existing CCB sources support under-6 and under-18 benefit groups.
- [CRA ON479-A 2025](../2025/sources/ontario-care.txt): raw-income addback, supporting persons and complete rate table.
- [Ontario statute](../2026/sources/ontario-care-legislation.txt) and
  [2026 budget](../2026/sources/ontario-care-budget.txt):
  continuing CARE formula and program.
- [Finances Quebec parameters](../2026/sources/quebec-childcare-parameters.txt), tables 3 and 5: both years' published
  caps and income/rate tables; [Revenu Quebec age change](../2026/sources/quebec-childcare-age.txt): the 2026 cutoff.
- [NL428 2025](../2025/sources/nl-childcare-credit.txt) and
  [NL government 2026 table](../2026/sources/nl-childcare-credit.txt):
  provincial child care amount and first-bracket conversion rate.
- [CRA NL guide](../2025/sources/nl-childcare-guide.txt): line 58320 equals the amount claimed on federal line 21400.

Tests cover both years, every province's integration, pooled limits, age/DTC/infirmity boundaries, missing/zero and
invalid inputs, RRSP/FHSA claimant changes, manual replacement, income floors, counterfactuals and immutable inputs.
Provincial tests independently lock published caps/rate boundaries, age changes, distinct impairment eligibility,
zero earnings, Quebec expense portions, allocation tolerance, toggles and the NL per-adult nonrefundable ordering.

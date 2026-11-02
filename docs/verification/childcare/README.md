# Childcare deduction implementation

Issue #95 adds backend federal deduction calculations for 2025 and 2026. The UI integration and new provincial
childcare credits remain #97 and #96. Existing benefit-year parameters continue to use current-year income.

## Inputs and results

`Household.childcare` holds a mode, a complete child list with annual eligible expenses, and explicit eligible
earned income for every effective adult. The second adult includes a spouse represented by the household count
with no separate income entry. Amounts are annual dollars; the future monthly input must reconcile to this one
source rather than supply a second inconsistent total. Eligible expenses exclude reimbursements/fee subsidies.

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
`breakdown.incomeBases`. The new Quebec childcare credit in #96 must use the provincial family amount, including
the worker deduction. It must not add the federal claim back to an already-floored federal zero.

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

Tests cover both years, every province's integration, pooled limits, age/DTC/infirmity boundaries, missing/zero and
invalid inputs, RRSP/FHSA claimant changes, manual replacement, income floors, counterfactuals and immutable inputs.

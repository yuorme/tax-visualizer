# 2024 rule shapes compared with 2025

Prerequisite for #23. This checks whether the rules already covered by the calculator can represent 2024;
it does not expand the model to every credit on a tax return. Tax parameters use calendar 2024. Recurring
benefits use July 2024 to June 2025, applied to current-year income, as in the existing years.

## Changes needed

### Nova Scotia spouse and eligible dependant amounts

The 2024 [NS428 worksheet](https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5003-d/5003-d-24e.pdf)
has two components, each with its own zero floor:

1. Base: $9,329 less the greater of $848 and the dependant's net income; equivalently $8,481 less net income
   above $848.
2. Supplement: $3,000 less 6% of the claimant's taxable income above $25,000, floored at zero; then subtract
   the dependant's **full** net income and floor again.

`nova-scotia-spouse-amount` records the base and supplement separately. For example, claimant taxable income
of $25,000 and spouse net income of $1,000 produces $8,329 + $2,000 = $10,329. A single combined phased amount
would incorrectly apply the $848 disregard to the supplement too. For the model's zero-income eligible
dependant, the same formula uses dependant income zero. This does not add a dependant-income input.

The basic personal amount already fits `phasedAmount`: maximum $11,481, minimum $8,481, from $25,000 to $75,000.
The worksheet uses taxable income for both claimant tapers. Within the existing model, generic deductions
reduce both net and taxable income, so the current income calculation provides that base.

The [2024 NS428 form](https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5003-c/5003-c-24e.pdf)
retains the existing young-child amount and family low-income reduction shapes. The non-eligible dividend
credit rate differs from 2025; it is a parameter change.

Both publications are cached under `2024/sources/rule-ns-*`. Engine tests cover claimant thresholds,
spouse income below and above the disregard, an exhausted supplement, deductions, and the nonrefundable floor.

### Manitoba homeowner and renter credits

[MB479 for 2024](https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5007-tc/5007-tc-24e.pdf), pages 2–3,
and the [2024 budget tax bulletin](https://www.gov.mb.ca/finance/taxation/pubs/bulletins/2024budget.pdf)
describe the programs replaced by the 2025 affordability credit:

- A school tax rebate of 50% of **gross school taxes**, independent of the education property tax credit.
- An education property tax credit of up to $350, limited to the remaining 50% of gross school taxes.
- A renter credit of $43.75 per eligible month, up to $525 for a full year, capped by actual rent paid.

`mb-school-tax-credits` combines the homeowner rebate and credit on one refundable-credit line. The
`schoolTaxShare` parameter estimates the school portion of the reference city's gross property tax.
The collector must source that ratio and mark it estimated; it is not a share of all property taxes set by law.
The gross property-tax rate must exclude neither rebate nor credit, to prevent double counting.
The homeowner result is `schoolTaxes * rebateRate + min(educationCreditMax, schoolTaxes * (1 - rebateRate))`.
Renters get `min(annualRent, renterMax)`, assuming full-year eligibility as the existing input model does.
Zero rent gives no credit, and homeowners do not also receive the renter credit.

Both publications are cached under `2024/sources/rule-mb-*`. Tests distinguish school from municipal taxes,
cap the combined relief at school taxes, cap renter relief at actual rent, and check the credits switch.
Seniors' supplements and eligibility-month inputs remain outside this issue. MB479's personal tax credit also
exists in the later years but is absent from the current model; adding that program is a separate coverage change.

## Remaining modeled rules

This branch caches CRA T4127 (January 2024), relevant sections of T4114 (July 2024 to June 2025), RC4210
(2024–2025), and Quebec's 2024 tax parameters under `2024/sources/rule-*`. The accompanying data collection
caches the provincial 428 forms and regional CWB calculation sheets. Those sources supply the amounts;
this table records the compatibility conclusions.

| Rule group | 2024 treatment | Schema/engine action |
|---|---|---|
| Federal brackets, nonrefundable credits, BPA | Lowest rate 15%; BPA still phases to a minimum | Existing brackets and phased amount |
| Federal investment rules, Quebec abatement | Existing gross-up, dividend credits, inclusion and abatement shapes | Data only |
| CPP/QPP, CPP2/QPP2, EI/QPIP | Second additional contributions start in 2024; the existing payroll model already has them | Data only |
| CCB | Same two income thresholds and child-count reduction schedules | Data only |
| GST/HST credit | Same adult/child amounts, single supplement and family reduction | Existing `groceriesBenefit`, named GST/HST credit |
| CWB, including AB, NU, QC | Phase-in, maximum, family-type reduction and secondary-earner exemption | Data only |
| BC | Same brackets, tax reduction, renter credit, family-benefit max/min tiers and single-parent supplement | Data only |
| AB | Five brackets, without the 2025 8% bracket; child-benefit base and working components | Data only |
| SK | Same brackets, child amount and low-income tax credit | Data only |
| MB | Flat BPA in 2024, without the 2025 high-income phase-out | Fixed BPA; new property-credit program above |
| ON | Same surtax, tax reduction, LIFT, health premium, child benefit and Trillium credit shapes | Data only |
| QC | Same brackets, worker deduction, living-alone amount, family allowance, solidarity and work premium | Data only |
| NB | Same low-income reduction, child benefit/working supplement and HST credit | Data only |
| NS | Same child benefit and affordable-living credit | Data only except spouse program above |
| PE | Five brackets replace the earlier surtax; sales-credit supplement unchanged | Existing bracket and `pei-sales-tax-credit` shapes |
| NL | Same low-income reduction, child benefit and income-supplement shapes | Data only |
| NT | Same territorial payroll tax and child-benefit model | Data only |
| NU | Same territorial payroll tax, young-child amount and child benefit | Data only |
| YT | BPA and spouse amount follow federal amounts, with employment credit and child benefit | Data only |

Source entry points:

- [CRA T4127, January 2024](https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/payroll-deductions-t4127-payroll-deductions-formulas/t4127-jan-119th-edition-effective-january-1-2024/t4127-jan-payroll-deductions-formulas-computer-programs.html)
- [CRA T4114, 2024 benefit year](https://www.canada.ca/content/dam/cra-arc/formspubs/pub/t4114/t4114-24e.pdf)
- [CRA RC4210, 2024 benefit year](https://www.canada.ca/content/dam/cra-arc/formspubs/pub/rc4210/rc4210-24e.pdf)
- [Quebec 2024 parameters](https://cdn-contenu.quebec.ca/cdn-contenu/adm/min/finances/publications-adm/parametres/AUTEN_IncomeTax2024.pdf)

## Timing and integration

- PEI's child benefit begins January 2025, inside the July 2024–June 2025 benefit year. Collect six months of
  entitlement rather than twelve; the existing income-band program can express the resulting annual amounts.
- BC's family-benefit bonus is paid monthly throughout this benefit year. Its enhanced max/min amounts fit
  the current formula; the collector must identify the temporary enhancement in source comments.
- Carbon charges and rebates, including the territorial offsets described in RC4210, belong to #29.
- Notes currently assume Manitoba's 2025 affordability program. They must accept the historical program
  before the UI can render 2024. The year data and UI integration are separate from this engine prerequisite.
- No 2025 or 2026 parameters or golden files change here. This audit preserves the existing scope and
  approximations; it is not a certification that every existing formula matches every tax-return situation.

# What the model covers

This describes the prototype as built, for the 2026 tax year. Many of these choices were made quickly while
building it; treat them as current defaults, not settled policy. Open questions are listed at the end.

The calculator aims to be a quick, see-what-you-get estimate of a household's yearly tax burden, not a
line-by-line tax return. Simpler and slightly less precise is acceptable where it keeps the inputs easy.

## Included

**Income tax (federal and every province and territory)**
- Brackets, basic personal amounts (including the federal, Yukon and Manitoba phase-outs), spouse or common-law
  partner amount, eligible dependant amount for single parents, Canada employment amount, credits for base
  CPP/QPP and EI/QPIP.
- Dividend gross-up and dividend tax credits; 50% inclusion of net capital gains; foreign tax credit for tax
  withheld on foreign dividends.
- Deductions (RRSP and similar), entered as one amount.
- Province-specific: Ontario surtax, Ontario tax reduction and LIFT credit, BC tax reduction, low-income
  reductions in Newfoundland and Labrador, New Brunswick, PEI and Nova Scotia, Saskatchewan's child amount,
  Nova Scotia's and Nunavut's credits for children under 6, Quebec abatement, Quebec deduction for workers and
  amount for a person living alone.

**Payroll (employee share)**
- CPP/QPP base and enhanced contributions, EI or EI plus QPIP, Ontario Health Premium, the 2% payroll tax in the
  Northwest Territories and Nunavut. Employment and other income is all treated as employment income.

**Benefits and refundable credits (netted off the tax shown)**
- Canada Child Benefit and every provincial or territorial child benefit that applies at the modelled incomes.
- Canada Groceries and Essentials Benefit, Canada Workers Benefit (including the Alberta, Nunavut and Quebec
  versions), Ontario sales tax credit and energy and property tax credit, Quebec solidarity tax credit and work
  premium, BC renter's credit, Manitoba renters and homeowners affordability credits, and the low-income
  credits in Saskatchewan, New Brunswick, Nova Scotia, PEI and Newfoundland and Labrador.
- Benefit-year amounts (July 2026 to June 2027) are applied to current-year income.

**Consumption and property**
- Sales tax (GST/HST/PST/QST/RST) on monthly taxable spending, estimated from household size and adjustable.
- Property tax for owners: home value × the typical rate in each province's largest city.

## Not included (for now)

- **Employer share of payroll taxes** (employer CPP/EI, provincial employer health taxes). The view is what the
  household itself pays.
- **Property tax paid by renters**, which landlords pass on through rent. Under reconsideration.
- **Fuel, carbon, excise and other product-specific taxes.** Under reconsideration for fuel.
- **Corporate taxes** and other taxes not paid directly by the household.
- **Land transfer tax**, as a one-time cost.
- Age, pension, disability, medical, tuition and donation credits; pension income splitting; OAS and GIS and
  their clawback; the alternative minimum tax.
- Childcare costs and the childcare expense deduction (except as a manual deduction).
- Self-employment treatment (both CPP shares, no EI).
- Smaller programs: Manitoba's child benefit for very low incomes, Newfoundland and Labrador's prenatal–early
  childhood supplement, Nunavut's territorial workers' supplement, the Workers Benefit disability supplement,
  the Northern Ontario energy credit, Quebec's northern-village supplement.
- Differences in what each province's sales tax exempts beyond the basics; Ontario's 8% RST on some insurance.

## Estimates in the 2026 data

Marked `estimated: true` in the data files where they appear:
- Canada Workers Benefit 2026 amounts (2025 figures indexed by 2% until CRA publishes them).
- Saskatchewan low-income tax credit reduction rate (worked out from the published start and end points).
- Manitoba renters credit taken at its $625 maximum.
- NWT and Newfoundland and Labrador child benefits: straight-line taper between published start and end incomes.
- Alberta Child and Family Benefit base rates.
- New Brunswick low-income reduction and Newfoundland and Labrador family threshold (2025 indexed by 2%).
- Property tax rates for Whitehorse, Yellowknife and Iqaluit (rough 1%).
- Quebec living-alone amount applied to any household with one adult.
- Starting monthly spending by household size (derived from Statistics Canada spending data; see the page notes).

## Open questions

- Should renters see an estimated property tax passed through rent?
- Should fuel tax be added, and how (spending share, kilometres driven)?
- Which year should historical coverage start (2019 is a natural start; 2016 adds the Canada Child Benefit's launch)?

# What the model covers

"Included" describes the prototype as built, for the 2026 tax year. "Decided, not built yet" records scope
choices made since (October 2026) that roadmap items will implement. Open questions are listed at the end.

The calculator aims to be a quick, see-what-you-get estimate of a household's yearly tax burden, not a
line-by-line tax return. Simpler and slightly less precise is acceptable where it keeps the inputs easy.

## Included

**Income, per adult**
- Employment income: pays CPP/QPP, EI, QPIP and the territorial payroll tax; gets the Canada employment amount
  (and Yukon's), the CPP/EI credits, Quebec's deduction for workers and Ontario's LIFT credit; and is the working
  income for the Canada Workers Benefit (phase-in and secondary earner exemption), Quebec's work premium and the
  working-income parts of the Alberta Child and Family Benefit and New Brunswick's child benefit. Self-employment
  income is entered here until it has its own field.
- Interest, rental and other income: taxed at the same rates and counted in net income and family net income for
  every benefit, credit, clawback and the Ontario Health Premium, but none of the employment-only treatment above,
  and no RRSP room. Pensions and RRSP/RRIF withdrawals go here until pension income has its own field; the
  pension income credit isn't applied.

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
  Northwest Territories and Nunavut. All but the health premium are on employment income only.

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

**Fuel tax on gasoline**
- Federal excise, provincial or territorial fuel tax and the regional transit tax of each province's reference
  city (the same largest city used for property tax: TransLink in Vancouver, ARTM in Montreal). Regional taxes
  always apply: the household is assumed to live in the reference city.
- Litres = total distance a year across the household's vehicles × average fuel efficiency (L/100 km, weighted
  by how much each vehicle is driven) ÷ 100. 0 is allowed for either (no car, or electric).
- GST/HST/PST/QST on fuel is **not** added: fuel is already part of taxable spending, so sales tax on it is
  counted there. The fuel and spending tooltips both say so.
- A rate that changed during the year counts for the share of days it applied (driving spread evenly).
- Defaults: distance per province from the last Canadian Vehicle Survey (2009, per vehicle, not scaled by
  household size); one national efficiency default. Users can override both.
- A year without fuel data (2025 for now) has no driving inputs and no fuel tax.

## How scope is decided

The model is for comparing provinces, not for filing a return. A feature earns its inputs if, for the households
it applies to, it moves **either** the household's own effective rate **or** the gap between provinces by
**0.1 percentage points or more**. Size each candidate against that before building it. Below that, leave it out.

The model counts **taxes the household actually pays**. Costs passed on through lower wages or higher rent
(employer payroll taxes, landlords' property tax) and taxes only deferred to a later year are out.

## Decided, not built yet

Recorded here as the spec for the GitHub issues that implement them; the issues hold the order.

**Self-employment.** A separate amount per adult, next to employment income (the CPP maximum is shared). Both
CPP/QPP shares including CPP2, a deduction for the employer half, no EI (opting in is not modelled), no Canada
employment amount on that part, QPIP at the self-employed rate in Quebec. Counts as working income for the
Canada Workers Benefit and Quebec's work premium.

**Seniors (65+ per adult).** Moving in retirement is a main use case, so this is modelled fully:
- Federal and provincial age amounts, pension income credit.
- OAS with its recovery tax (clawback) and the 10% increase at 75; GIS and the Allowance.
- CPP/QPP retirement benefits as income.
- Pension income splitting, optimised automatically per province (the engine tries 0–50% and keeps the lowest
  household tax; no input).
- Provincial seniors' supplements (Ontario GAINS, Alberta Seniors Benefit, BC Senior's Supplement,
  Saskatchewan Seniors Income Plan and equivalents elsewhere).
- Seniors' property tax grants and rebates (e.g. BC's additional Home Owner Grant, Ontario Senior Homeowners'
  Property Tax Grant, Manitoba's seniors' school tax rebate). Deferral programs are out: they delay tax, not
  reduce it.
- RRIF/RRSP withdrawals and workplace pensions are entered as amounts. Not modelled: minimum RRIF withdrawals,
  deferring OAS or CPP, partial OAS from residency rules (full OAS is assumed).
- Each piece is still sized with the 0.1-point rule before it's built.

**Metric/imperial toggle for the driving inputs.** Shows km and L/100 km, or miles and **US** mpg (what
Canadian-market cars display when set to miles; the tooltip notes NRCan ratings use imperial mpg, about 20%
higher). The engine stays metric.

**Your own property tax.** An optional annual property tax amount for the home province replaces home value ×
rate there. Every other province keeps the reference-city rate.

**Carbon pricing in historical years.** It is material (a rebate of roughly $1,500 against a few hundred dollars
of direct cost for an Alberta family of four in 2023–24, in backstop provinces only), so it's included in years
where it applied: the federal fuel charge on gasoline from the driving inputs, a per-province typical household
heating carbon cost held in data (`estimated: true`, no input), and the Climate Action Incentive / Canada Carbon
Rebate. BC's carbon tax and climate action credit get the same treatment. Quebec's cap-and-trade has no tax line
and stays out. None of this applies to 2026.

**Historical coverage** starts at 2019. 2016–2018 are possible later but not planned.

## Not included

Settled exclusions:
- **Employer share of payroll taxes** (employer CPP/EI, provincial employer health taxes). The model shows what
  the household itself pays.
- **Property tax paid by renters** through rent (a pass-on, not a tax the household pays; in the backlog if
  this changes).
- **Corporate taxes** and other taxes not paid directly by the household.
- **Tax deferral programs** (e.g. seniors' property tax deferral).

For now:
- **Land transfer tax**, as a one-time cost.
- **Diesel, propane and home heating fuel taxes**; alcohol, tobacco, cannabis and other excise taxes.
- Disability, medical, tuition and donation credits; the alternative minimum tax. Medical and disability
  credits matter for seniors but depend on what each household spends; size them with the 0.1-point rule if
  they come up again.
- Childcare costs and the childcare expense deduction (except as a manual deduction).
- One-time government payments, such as the June 2026 GST/HST credit top-up (50% of the 2025-26 credit). The
  model counts only recurring programs.
- Smaller programs: Manitoba's child benefit for very low incomes, Newfoundland and Labrador's prenatal–early
  childhood supplement, Nunavut's territorial workers' supplement, the Workers Benefit disability supplement,
  the Northern Ontario energy credit, Quebec's northern-village supplement.
- Differences in what each province's sales tax exempts beyond the basics; Ontario's 8% RST on some insurance.
- Living outside the reference city: one city per province sets property tax and regional fuel tax rates.

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
- Starting distance driven per province: the average per light vehicle in the 2009 Canadian Vehicle Survey, the
  last one (vehicle-kilometres ÷ vehicles, to the nearest 100 km).
- Starting fuel efficiency of 9.0 L/100 km: NRCan's 2023 on-road averages for gasoline cars and light trucks,
  weighted by distance driven.

## Open questions

- Should the household be able to say it lives outside the reference city (no regional fuel tax, a non-city
  property tax rate), and per province or once for all?
- Does pension income splitting pass the 0.1-point rule for typical couples? (Expected yes; check before building.)

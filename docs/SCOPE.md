# What the model covers

"Included" describes the model as built, for the 2026 tax year and the historical years back to 2019. "Decided,
not built yet" records scope choices that roadmap items will implement. Open questions are listed at the end.

The calculator aims to be a quick, see-what-you-get estimate of a household's yearly tax burden, not a
line-by-line tax return. Simpler and slightly less precise is acceptable where it keeps the inputs easy.

## Included

**Income, per adult**
- Employment income: pays CPP/QPP, EI, QPIP and the territorial payroll tax; gets the Canada employment amount
  (and Yukon's), the CPP/EI credits, Quebec's deduction for workers and Ontario's LIFT credit; and is the working
  income for the Canada Workers Benefit (phase-in and secondary earner exemption), Quebec's work premium and the
  working-income parts of the Alberta Child and Family Benefit and New Brunswick's child benefit.
- Self-employment (2025–2026, #14): optional net business profit per adult, after business expenses.
  Both CPP/QPP shares and second additional contributions share ceilings with employment. The employer base
  share and both enhanced shares are deducted; one base share earns a credit. No EI opt-in, employment amount,
  LIFT phase-in or territorial wage tax on profit. Quebec charges self-employed QPIP on the remaining insurable
  earnings ceiling, with its deduction and federal credit. Profit counts for CWB, Quebec's work premium,
  Quebec's worker deduction, AB/NB child working-income components, and the illustrative RRSP shortcut.
  Business is wholly in the compared province; losses and multi-province allocation are unsupported.
  Unsupported years reject even an explicit zero; omitted inputs preserve historical results.
  Each adult enters profit in the existing Income tab; saved scenarios and versioned links retain it separately
  from employment. Empty means omitted; explicit zero stays zero. Malformed amounts are ignored on restore.
  Unsupported selected years retain the input but exclude profit with a visible notice, like retirement inputs.
  History omits years without self-employment data in both modes and retains the retirement entry-age guard.
  The contribution tooltip uses the engine's credit/deduction breakdown; the ledger shows the business marginal.
  A positive-profit, zero-wage employee CPP election is retained but not applied, with a visible notice;
  ordinary business contributions and mandatory age limits apply. The history tooltip also states this limitation.
  See the [input contract, evidence and golden map](verification/14-self-employment.md).
- Interest, rental and other income: taxed at the same rates and counted in net income and family net income for
  every benefit, credit, clawback and the Ontario Health Premium, but none of the employment-only treatment above,
  and no RRSP room. Legacy pensions in this field remain ordinary income. The 2025–2026 engine now accepts
  separately typed retirement receipts for pension credits through the per-adult Retirement income controls (#17).
  Move receipts out of other income when using those fields; do not copy them. For 2025–2026, Quebec's
  Health Services Fund contribution applies per
  person to subject non-employment income, including taxable gains and actual dividends. Other income is assumed
  subject: OAS, taxable support receipts and other Schedule F exclusions entered there cannot be identified.
  RRSP, FHSA and federal childcare deductions do not reduce this base. Unclassified other deductions are not
  subtracted; eligible carrying charges, deductible support and retirement-income transfers need separate
  classification and remain unsupported. Business payroll deductions are classified separately:
  Schedule R line 26 and Schedule U lines 101, 103 and 115 reduce the business-inclusive base.
  Ignoring an eligible claim can overstate this contribution; leaving
  RRSP/FHSA out is correct. Employee enhanced QPP/QPIP does not qualify for Schedule F lines 43/43.1.
  For 20,000 pension plus an illustrative 9,000 OAS entered together, this contribution is 90 too high;
  OAS alone or income on the 150 plateau can produce no error. The contribution base is an explicit allow-list:
  #18's engine keeps its separate OAS input out while retaining it for income tax, and includes separately
  entered CPP/QPP benefits in this base through the per-adult Retirement income controls. Business allocation
  outside Quebec
  (guide line 446 / TP-22)
  and restricted line 297 deductions are not modelled. See [Schedule F audit](verification/91-qc-health-fund.md).
  The 2026 rate and thresholds are published by Finances Québec; caps, the second-column base and income rules
  provisionally continue 2025 Schedule F (`estimated: true`). The contribution remains omitted in 2019–2024.

- Investment income can be entered as exact amounts (Manual) or estimated from a portfolio (Portfolio), per adult.
  Portfolio takes the value of non-registered holdings, an asset mix and one average yield, and only produces the
  engine's existing inputs: Canadian stocks give eligible dividends, U.S. and international stocks foreign dividends,
  and bonds interest added to other income, so Other income keeps a separate amount in Portfolio for taking that
  interest out without changing the Manual amount. A mix that doesn't total 100% is scaled. Capital gains stay one input
  shared by both views, with no assumed share realized. Non-eligible dividends exist only in Manual and count as zero
  in Portfolio. Each view keeps its inputs, and only the selected one counts. A quick estimate, not matching tax slips.

**Income tax (federal and every province and territory)**
- Brackets, basic personal amounts (including the federal, Yukon and Manitoba phase-outs), spouse or common-law
  partner amount, eligible dependant amount for single parents, Canada employment amount, credits for base
  CPP/QPP and EI/QPIP.
- Dividend gross-up and dividend tax credits; 50% inclusion of net capital gains; foreign tax credit for tax
  withheld on foreign dividends.
- Quebec couples transfer unused credits through TP-1 line 431 in **2019–2026**, with or without age or
  retirement inputs (#205). Negative line 430 includes unused BPA and dividend credits; BPA is transferred once,
  and the recipient cannot reduce line 432 below zero. The personal-credit switch also disables this transfer.
  The spouse-savings explanation includes the Quebec transfer actually used by either adult.
  This correction needs no historical senior parameters; age and pension inputs remain supported only in
  2025–2026. See [rule confirmation, calculations and golden changes](verification/205-qc-line-431.md).
- Annual deductions claimed per adult, itemized as RRSP, FHSA and other deductions; each reduces net income.
  Account room and contribution history are not calculated: the RRSP shortcut estimates room from employment
  income and supported business profit and is not a verified maximum. FHSA claims may include deferred claims.
- Federal childcare expense deduction (2025 and 2026); see Childcare below.
- Province-specific: Ontario surtax, Ontario tax reduction and LIFT credit, BC tax reduction, low-income
  reductions in Newfoundland and Labrador, New Brunswick, PEI and Nova Scotia, Saskatchewan's child amount,
  PEI's, Nova Scotia's and Nunavut's credits for children under 6, Quebec abatement, Quebec deduction for workers and
  amount for a person living alone.
- For 2025–2026, each child amount and family reduction uses its own spouse claimant rule. SK and NU transfer
  unused child bases; NS and PE do not. NB/NL/PE transfer unused family reductions; NS does not. Eligible tied
  child claimants and discretionary reduction elections minimize household tax. Earlier years keep their
  historical claimant calculation. See [claimant rules](verification/92-claimant-rules.md).
- Manitoba family tax benefit correction for 2025–2026 (#145):
  ordinary basic, claimed spouse/eligible-dependant and qualifying-child bases, reduced by individual net income
  and limited to non-refundable capacity. Age 18 represents eligible-parent status earlier in the year under
  s. 4.6(16.1)(b), following MB428-A's birth-year band; age alone is not entitlement. Eligible-dependant children
  are excluded. The higher-net-income spouse claims children; at equality, the model interprets the Act's silence
  as allowing either spouse and minimizes household tax, following #92. For unrelated adults, the higher-income
  adult is assumed to be the eligible parent; at equality, the model elects the eligible claimant giving the
  lower household tax under Manitoba s. 4.6(16.2)(b). Eligibility is assumed; competing outside-household claims
  are assumed absent.
  The #17 engine adds own-age and transfer-qualified spouse-age terms before the same reduction for 2025–2026;
  spouse age alone does not qualify. Disability remains unsupported. Earlier years remain omitted despite forms listing
  the program. See [audit](verification/145-manitoba-family-benefit.md).

- Age and pension credits for **2025 and 2026 only** (#17): federal and all thirteen
  jurisdictions, separate unused spouse credit transfers, Saskatchewan's supplementary senior amount,
  Manitoba family-benefit senior terms, Nova Scotia's separate age credit and PE's senior reduction terms.
  Quebec uses one age/living-alone/retirement pool with one family-income taper, then the general unused-credit
  transfer. Federal and Quebec pension eligibility are independent. Year-end `age` retains the boundaries needed
  for later 60–64, 65–74 and 75+ rules; the existing payroll contract also requires `birthMonth` with age.
  Typed retained domestic receipts are RPP lifetime pensions, RRIF/LIF, RRSP annuities and ordinary RRSP withdrawals.
  Only RRIF/annuity inputs accept eligible-survivor status. No pension income is split automatically.
  Earlier-year retirement scenarios fail explicitly; ordinary legacy inputs remain supported. Historical back-fill
  belongs in a separate History issue at merge. Published 2026 amounts use provisional 2025 filing formulas.
  Living-alone eligibility keeps the existing one-adult dwelling assumption; adult-student single-parent additions,
  rollovers, special/foreign pension slips, partial-year residence and Schedule B transfer deductions remain
  unsupported.
  Per-adult Retirement income rows retain type, annual amount and eligible-survivor status in saved states and URLs.
  The existing birth-year/month controls supply year-end age; incomplete dates do not apply age inputs. A receipt
  needing age is retained but excluded until both date fields are complete or eligible-survivor status is asserted.
  Selected older years retain inputs but exclude typed receipts and age/pension credits, with a result notice.
  History omits unsupported years, including for age-independent receipts, in nominal and real modes; its basis
  and tooltip state the coverage. No existing Other income is moved automatically, including legacy pensions.
  Tooltips explain double counting, receipt eligibility, age assumptions and the unmodelled RRIF minimums,
  OAS/CPP deferral and residency rules. #18 adds full resident OAS below; GIS, CPP entitlement estimates and a
  complete senior tax burden are not implied.
  #91's unclassified `oth`
  exclusions/deductions remain as described above; the four supported receipts are subject to the Health Services Fund.
  Alberta supplemental-credit sizing (#147) remains outside this change.
  See [verification](verification/17-senior-credits.md).

- OAS and CPP/QPP retirement income, **2025–2026** (#18): per-adult opt-in `oas` calculates full
  resident OAS from published quarterly monthly amounts; `cppQpp` accepts annual gross retirement receipts.
  Both are additional cash and taxable income, so move any matching amounts out of `oth`, never copy them.
  Omitted inputs preserve legacy results; age alone does not opt in. OAS requires year-end age and birth month.
  Receipts begin the month after turning 65; the higher published 75+ amount begins the month after turning 75.
  Birthdays are resolved by month with no day-level exceptions. Full-year residence and commencement at 65
  are assumed; deferral, partial OAS, arrears and prior benefit overpayments remain unsupported.
  Current-year recovery is 15% above that year's threshold, capped at actual modelled OAS receipts plus any
  GIS/Allowance enabled under #19. It is deducted
  from net income and added once to federal liability after credits and Quebec abatement. Quebec imports the
  federal deduction even when federal childcare changes it. Income-tested credits use the resulting net income.
  T778's lower-income comparison and Ontario CARE instead use income before childcare and recovery deductions,
  as their forms require. CARE's add-back does not change CCB or Quebec childcare family income.
  OAS is not a refundable credit; recovery withholding based on earlier returns is unknown, not a second charge.
  Neither receipt earns employment or pension-income credits, RRSP room, or changes payroll elections.
  Published 2026 amounts and thresholds use provisional 2025 filing mechanics. Earlier years reject these inputs;
  History back-fill is a separate issue to file at merge. Per-adult controls sit with #17's Retirement income receipts;
  the existing birth-year/month controls supply OAS age. Incomplete dates retain the opt-in but exclude OAS until
  complete; CPP/QPP amounts need no age. Tooltips explain coverage, birthday timing, recovery versus withholding,
  deferral/residency assumptions and avoiding duplicate Other income. The ledger identifies gross OAS, CPP/QPP,
  the recovery deduction already included in deductions, and recovery added once to federal tax. URL and saved-state
  migration preserve omission, explicit false and zero, and never move legacy Other income or infer benefits from age.
  Selected older years retain the drafts but exclude the new fields with a notice; nominal and real history omit
  unsupported years and state the coverage. Real history scales entered CPP/QPP; OAS uses each year's published data.
  GIS (#19), splitting (#20) and seniors' supplements (#21) are covered elsewhere.
  See [verification and rule coverage](verification/18-oas-cpp.md).

- GIS and the spouse's Allowance, **2025–2026, all thirteen jurisdictions** (#19): explicit
  per-adult `gis` and `allowance` opt-ins preserve all existing scenarios when omitted. GIS requires actual
  modelled OAS receipts; OAS off means zero GIS. Single (including separated/divorced/widowed) and married or
  common-law categories distinguish a spouse receiving OAS, the Allowance, or neither. The Allowance starts
  after the 60th birthday and ends after the 65th birthday; its income taper and protected older-spouse GIS
  are calculated together. Monthly receipts use each quarter's rates, summed over the calendar year.
  Full Canadian residence, entitlement and timely application are assumed. Partial residency, sponsorship,
  involuntary separation, changes of marital status, arrears and Allowance for the Survivor are unsupported.
  Current income stands in for both historical income years used by the July–June payment periods.
  GIS-test income excludes OAS and supplements, deducts full CPP/QPP and EI before each adult's earnings
  exemption, and includes CPP/QPP pensions, private pensions, taxable gains and grossed-up dividends.
  The statutory excess dividend-credit adjustment and supported ordinary/RRSP/FHSA/childcare deductions apply.
  Proxy deductions and dividend credits are calculated before this year's new supplements; current T778
  claimant selection then includes the calculated supplements. This is an explicit single-year approximation.
  Receipts are netted against tax once, independent of the refundable-credit switch. They enter federal and
  Quebec net income for other income-tested programs, with offsetting deductions from taxable income; they
  do not create working income, pension credits, payroll contributions or Quebec Health Services Fund income.
  Per-adult GIS and Allowance opt-ins sit in Retirement income and reuse the birth-year/month controls.
  The Allowance control appears only for two adults marked as spouses/common-law partners; hidden flags remain drafts.
  URL and saved-state migration preserve omission and explicit false independently; legacy scenarios keep their
  results. Incomplete dates retain drafts but exclude that adult’s true opt-ins until complete. Dates too young
  for the modelled retirement rules get a separate result notice, retaining the opt-ins. Tooltips explain the
  income-year proxy, OAS prerequisite, marital categories, birthday/quarterly timing and residency assumptions.
  The ledger shows each adult’s gross benefits, net income, taxable-income deduction and supplement recovery;
  comparison rows and chart tooltips identify the household benefits netted against tax once. Benefits remain
  outside the chart’s income denominator and apply even with the credit switches off. No benefit is computed in UI.
  Selected older years exclude both fields, including explicit false, with a coverage notice. Both history modes
  omit unsupported years and state 2025–2026 coverage, including when only a false opt-in is stored without age.
  Pension splitting (#20) and historical back-fill remain separate.
  See [income definitions, sources, calculations and coverage](verification/19-gis-allowance.md).

- Provincial and territorial seniors' supplements, **2025–2026** (#21): BC Senior's Supplement, Alberta Seniors
  Benefit, Saskatchewan Seniors Income Plan, Manitoba 55 PLUS and its refundable credit senior addition, Ontario
  GAINS, Quebec senior assistance credit, New Brunswick Low-Income Seniors' Benefit, Nova Scotia's seniors
  provincial income tax refund, Newfoundland and Labrador's Seniors' Benefit and the Northwest Territories and
  Nunavut senior supplements. No new inputs: programs tied to federal receipts follow the OAS, GIS and Allowance
  opt-ins. Quebec's assistance credit, Manitoba's credit senior addition and Newfoundland and Labrador's Seniors'
  Benefit use the ages and income entered, and Nova Scotia's refund also needs GIS. Manitoba's 55 PLUS also pays
  ages 55 to 64 on income alone, except for junior households with an OAS, GIS or Allowance recipient and the
  year an adult becomes OAS-eligible. Current income stands in for the prior-year income most programs test, an
  explicit single-year approximation. The page adds a comparison row ("not modelled" for Yukon and PEI, never $0),
  a per-adult ledger with the amount reported on T5007 line 14500 (the higher-income spouse reports the whole
  amount, each their own on equal incomes, and BC amounts of $500 or less a year are not reported), two tooltips
  beside GIS and Allowance and history coverage text. Cash supplements net against tax once, independent of the
  credit switches. The Quebec, Manitoba, Newfoundland and Labrador and Nova Scotia amounts are refundable credits
  and follow the switch; they appear under Refundable credits, as the tooltip says, so a $0 in the cash row is
  not read as no support. Not modelled: Yukon's Seniors Income Supplement, PEI's assessed Seniors Independence
  Initiative, the Coastal Labrador supplement, survivors and people in care. Housing and care programs (property
  tax grants, utility grants, assessed service grants) are in #216. Historical back-fill is a separate History
  issue.
  See [rules, sources, estimates and coverage](verification/21-provincial-supplements.md).

**Payroll (employee share, plus both shares on self-employment)**
- CPP/QPP base and enhanced contributions, EI or EI plus QPIP, Ontario Health Premium, the 2% payroll tax in the
  Northwest Territories and Nunavut. EI and territorial payroll tax are on employment income only.
  CPP/QPP and Quebec QPIP also apply to the new business-profit input for 2025–2026.
- Retirement-age employee CPP/QPP for 2025–2026 (#146), entered per adult in the Income tab: birth year and month,
  continuous retirement-pension receipt, independent CPP/QPP stop/restart elections, and monthly
  earnings weights (equal monthly pay by default). CPP includes the 70th birthday month; QPP includes the whole
  year turning 72. Turning 65 alone stops neither plan. QPP optional elections retain annual ceilings/exemption;
  the annual burden excludes excess withholding. EI/QPIP continue on employment income. One continuing employer,
  no disability/death or pension cancellation. New inputs fail explicitly in unsupported historical data;
  legacy inputs remain available in every year. Business profit uses independently verified timing under #14:
  CPP includes the 70th birthday month and prorates annual profit; QPP includes the whole year turning 72.
  Mixed-earner CPT30 applies to both income sources, but RR-50 applies only to wages.
  Self-employed-only CPP elections and separate QPP business elections need effective-month inputs and remain
  unsupported. A positive-profit, zero-wage person cannot use an employee CPP election; the engine rejects it.
  The page retains birth year and derives `age = taxYear - birthYear` for the selected year
  and each history row; pension receipt and election dates stay in their original calendar years.
  A June 1960 birth with a valid June 2025 stop and no revocation remains stopped when selecting 2026.
  An incomplete birth date leaves the person on ordinary payroll. A selected year without
  `federal.payroll.employeeRetirement`, or an age at or below the contribution start age, uses ordinary
  CPP/QPP for that person and says so beside the results. When any person has retirement inputs, the
  historical view leaves out those years, and says which in its tooltip. Real mode needs published annual
  CPI as well, so with these inputs it can show one row or none.
  #17 omits unset retirement fields: `age: null` activates the path and throws, and any
  supplied `age` throws in 2019–2024 even at zero pay. Childcare's nullable drafts cannot be passed through as adult
  ages.
  One stop and optional revocation cannot represent two cycles affecting one tax year, or validate RR-50's
  condition that no earlier election was revoked in the year of a new stop; those histories are unsupported.
  Schedule 8's possible CRA proration of the basic exemption in the year a CPP pension starts is unmodelled.
  This can understate employee contributions by up to about $190 before income-tax credits and deductions;
  pension-start dates currently establish election eligibility only.
  See [input contract and audit](verification/146-retirement-payroll.md).
- Quebec's Health Services Fund contribution (2025–2026) also appears in the Payroll subtotal and ledger,
  separately from income tax. It is added exactly once and does not reduce income or any modelled benefit base.

**Benefits and refundable credits (netted off the tax shown)**
- Canada Child Benefit and every provincial or territorial child benefit that applies at the modelled incomes.
- Canada Groceries and Essentials Benefit, Canada Workers Benefit (including the Alberta, Nunavut and Quebec
  versions), Ontario sales tax credit and energy and property tax credit, Quebec solidarity tax credit and work
  premium, BC renter's credit, Manitoba renters and homeowners affordability credits, and the low-income
  credits in Saskatchewan, New Brunswick, Nova Scotia, PEI and Newfoundland and Labrador.
- Benefit-year amounts (July 2026 to June 2027) are applied to current-year income.

**Consumption and property**
- Sales tax (GST/HST/PST/QST/RST) on monthly taxable spending, estimated from household size and adjustable.
- Property tax for owners: home value × the typical rate in each province's largest city, or, in the home
  province only, the household's own annual bill if entered. The bill also feeds property-based credits there.
- Property-tax relief, tax year 2026 only (#223): BC's ordinary and senior Home Owner Grant (home value stands in for
  the assessed value) and the low-income grant supplement (current income stands in for the previous year's, as in
  #21); Manitoba's homeowners credit on school tax, the seniors' school tax rebate and the renters credit's senior
  formula, which replace the old whole credit. Manitoba needs the bill's school tax, which is estimated for the
  default-city bill only. Earlier years keep their old results. See
  [rules, sources and limits](verification/22-property-tax-relief.md).
- Property-tax relief for Ontario, tax year 2026 only (#224): the senior homeowners' property tax grant and the
  senior schedule of the energy and property tax credit (net of the grant overlap), which replaces the ordinary credit
  for a household with someone 64 at the prior year end. Prior-year income and tax are proxied by this year's.

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
- Inputs can be shown in km and L/100 km, or miles and **US** mpg (what Canadian-market cars display when set to
  miles; the tooltip notes NRCan ratings use imperial mpg, about 20% higher). The engine stays metric.
- Fuel tax data covers 2025 and 2026. Earlier years have no fuel tax; their driving inputs feed carbon pricing
  only.

**Carbon pricing in historical years.** The federal fuel charge on gasoline from the driving inputs, a typical
household heating carbon cost held in data (`estimated: true`, no input), and the Climate Action Incentive /
Canada Carbon Rebate, in the years and provinces where they applied; BC's carbon tax and climate action credit
get the same treatment. It is material: an Alberta family of four received about $1,500 a year in rebates
against a few hundred dollars of direct cost. Quebec's cap-and-trade has no tax line and stays out; indirect
carbon costs in goods and electricity are excluded. None of this applies to 2026. Rates, payment timing and
worked examples are in [carbon history](verification/carbon-history.md).

**Historical comparison.** A separate view compares the home province across installed tax years. Real mode
holds income, deductions, childcare amounts, spending, rent and home value at the same purchasing power using
Statistics Canada's annual Canada all-items CPI; household composition, ages, rates and driving stay fixed,
except that retirement-age CPP/QPP, age/pension credits and OAS use each person's age in that year from
their birth year.
Inputs and results use the latest completed annual CPI year's dollars, labelled in the view. Years without
published annual CPI appear only in nominal mode, which holds the entered dollar amounts fixed. This is a
comparison of modeled tax rules, not a reconstruction of the household's past circumstances or housing prices.
Coverage starts at 2019; 2016–2018 are possible later but not planned.

**Childcare (2025 and 2026).** A monthly household childcare amount, after fee subsidies and averaged over the
year, replaces the old frugality setting. It is the same in every province and is neither a tax nor taxable
spending.
- Federal childcare expense deduction with its claimant rules and limits, plus Ontario's, Quebec's and
  Newfoundland and Labrador's childcare credits, each with its own income base and refundability.
- Eligible earnings default to each adult's employment, self-employment and other income and can be overridden. Ordinary
  single-parent and couple cases are automatic; a manual mode takes verified annual claims for exceptional cases.
- Quebec's credit needs the Quebec-eligible part of the expense, asked only when Quebec is the home province.
- Childcare inputs hide at zero children and keep their drafts; children's ages stay editable when costs are zero,
  since they still set benefit eligibility. Results go in the existing detailed comparison and tooltips, with no
  new summary widgets and no reset control.
- A tax-and-benefit comparison, not a childcare-price or cost-of-living model. Input behaviour and rule
  details: [childcare verification](verification/childcare/README.md).

## How scope is decided

The model is for comparing provinces, not for filing a return. A feature earns its inputs if, for the households
it applies to, it moves **either** the household's own effective rate **or** the gap between provinces by
**0.1 percentage points or more**. Size each candidate against that before building it. Below that, leave it out.

The model counts **taxes the household actually pays**. Costs passed on through lower wages or higher rent
(employer payroll taxes, landlords' property tax) and taxes only deferred to a later year are out.

## Decided, not built yet

Recorded here as the spec for the GitHub issues that implement them; the issues hold the order.

**Seniors (65+ per adult).** Moving in retirement is a main use case, so this is modelled fully. The
[seniors sizing study](verification/16-seniors-sizing.md) finds all seven planned categories below pass the
0.1-point rule for at least one applicable household; pension splitting also moves the BC–Ontario gap by 0.32
points. Individual provincial and territorial programs beyond the ones it measured are still sized before they're
built.
- Federal and provincial age amounts and pension income credit: implemented for 2025–2026 above;
  historical back-fill remains in #196.
- OAS with recovery tax and the 10% increase at 75, plus CPP/QPP retirement income: implemented for
  2025–2026 above, including page controls. GIS and the Allowance are also implemented for 2025–2026 above,
  including page controls; historical back-fill remains separate.
- Pension income splitting, optimised automatically per province (the engine tries 0–50% and keeps the lowest
  household tax; no input).
- Provincial seniors' supplements (Ontario GAINS, Alberta Seniors Benefit, BC Senior's Supplement,
  Saskatchewan Seniors Income Plan and equivalents elsewhere): implemented for 2025–2026 above, except Yukon
  and PEI; historical back-fill remains separate.
- Seniors' property tax grants and rebates (e.g. Ontario Senior Homeowners' Property Tax Grant). BC's Home Owner
  Grant with its senior schedule and low-income supplement, and Manitoba's seniors' school tax rebate, are
  implemented for 2026 only (#223, below). Alberta and Saskatchewan have no in-scope program. The other provinces
  follow in later slices of #22. Deferral programs are out: they delay tax, not reduce it.
- RRIF/RRSP withdrawals and workplace pensions are entered as amounts. Not modelled: minimum RRIF withdrawals,
  deferring OAS or CPP, partial OAS from residency rules (full OAS is assumed).

## Not included

Settled exclusions:
- **Employer-paid payroll taxes** (employer CPP/EI, provincial employer health taxes). The model shows what
  the household itself pays; a self-employed person's two CPP/QPP shares are included.
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
- One-time government payments, such as the June 2026 GST/HST credit top-up (50% of the 2025-26 credit). The
  model counts only recurring programs.
- Smaller programs: Manitoba's child benefit for very low incomes, Newfoundland and Labrador's prenatal–early
  childhood supplement, Nunavut's territorial workers' supplement, the Workers Benefit disability supplement,
  the Northern Ontario energy credit, Quebec's northern-village supplement.
- Differences in what each province's sales tax exempts beyond the basics; Ontario's 8% RST on some insurance.
- Living outside the reference city: one city per province sets property tax and regional fuel tax rates.
- PEI's 1.67% Charlottetown rate already includes the resident credit. Additional owner credits need ownership
  and assessment history and are not modelled; the annual-bill override can reflect them.
  See [the owner-credit audit](verification/86-charlottetown-owner-credit.md).

## Estimates in the 2026 data

Marked `estimated: true` in the data files where they appear:
- GIS/Allowance top-up components are exactly derived from published benefit-table rows after top-up exhaustion.
  The marker distinguishes derived values; all quarterly maximums are published. Net-income filing treatment
  continues the verified 2025 forms pending 2026 returns, as with OAS.
- Self-employment 2026 annual filing formulas continue 2025 Schedule 8 and Quebec Schedules U/R/10.
  Rates and ceilings are published; the QPIP deductible fraction is derived from the 2026 self-employed and
  employee rates, pending final filing forms. See the [audit](verification/14-self-employment.md).
- Retirement-age employee payroll annual settlement: published 2026 employer rules, rates and ceilings with
  2025 Schedule 8/Quebec Schedule U annual settlement continued pending the final 2026 return forms.
- Canada Workers Benefit 2026 amounts (2025 figures indexed by 2% until CRA publishes them).
- Ontario CARE 2026: continuing statutory formula, pending the 2026 return form (the budget confirms the program).
- SK/NS/NU child claimant and transfer rules and NS/NB/NL/PE family reduction elections/transfers: provisional
  continuation of verified 2025 return rules, pending 2026 CRA forms. The cached 2026 material indicates no change;
  these are not verified 2026 return rules. Claimant data is marked `estimated: true` separately from amounts.
- Saskatchewan low-income tax credit reduction rate (worked out from the published start and end points).
- Manitoba renters credit taken at its $625 maximum.
- Manitoba family tax benefit: TD1MB-WS publishes the ordinary amounts and 9% taper, but filing eligibility,
  child age cutoff, claimant restrictions and credit ordering provisionally continue 2025. These are not verified
  2026 filing rules; CRA's 2026 return forms publish in January 2027. The worksheet's "born in 2004" child cutoff
  is inconsistent with the Act's eligibility condition and the 2025 filing guide; it is not used as filing evidence.
- Newfoundland and Labrador child benefit: estimated straight-line taper between published start and end incomes.
  NWT's separate age-group amounts and linear reduction are published by NWT Finance; CRA's T4114-26 confirms
  continuity for July 2026 to June 2027 (see [verification](verification/116-nwt-child-benefit.md)).
- New Brunswick low-income reduction and Newfoundland and Labrador family threshold (2025 indexed by 2%).
- Property tax rates for Whitehorse, Yellowknife and Iqaluit (rough 1%).
- Quebec living-alone amount applied to any household with one adult.
- Quebec living-alone line 275 income base provisionally continues the 2025 Schedule B pending the 2026 form;
  the 2026 amounts are published.
- Starting monthly spending by household size (derived from Statistics Canada spending data; see the page notes).
- Starting distance driven per province: the average per light vehicle in the 2009 Canadian Vehicle Survey, the
  last one (vehicle-kilometres ÷ vehicles, to the nearest 100 km).
- Starting fuel efficiency of 9.0 L/100 km: NRCan's 2023 on-road averages for gasoline cars and light trucks,
  weighted by distance driven.
- Starting Portfolio mix of 20% Canadian stocks, 40% U.S. and international stocks and 40% bonds, and 2.2% yield:
  rounded from Vanguard Balanced ETF Portfolio's holdings and distribution yield as at Sep 30 2026. They sit in the
  2026 federal data, but the page reads the newest year that has them whichever year is selected, and a saved or
  shared portfolio keeps its own values.

## Open questions

- Should the household be able to say it lives outside the reference city (no regional fuel tax, a non-city
  property tax rate), and per province or once for all?

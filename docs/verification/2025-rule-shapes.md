# 2025 rule shapes compared with 2026 (October 2026)

Done for #37, ahead of the 2025 data in #3. Each rule the engine models (`docs/SCOPE.md`, "Included") was checked
for 2025 against official sources, to decide whether 2025 can be expressed with the 2026 program ids and fields
(data-only) or needs a different formula (a new `program` id). Amounts are left to #3. Benefit-year rules use the
July 2025 to June 2026 period, which the model applies to 2025 income.

## Result

- **Data-only, everywhere but one place.** Every federal, provincial and territorial income tax rule and every
  benefit has the same shape in 2025 as in 2026, except the PEI sales tax credit.
- **New program id: `pei-sales-tax-credit`** (added with this note). July 2025 to June 2026 is the last full year
  of the old PEI sales tax credit, which has a supplement that rises with income. Neither `pei-essentials-benefit`
  (2026) nor `nl-income-supplement` can express it.
- **New optional field: `groceriesBenefit.name`.** The engine names the federal credit "Canada Groceries and
  Essentials Benefit" unless the year's data names it; for 2025 it was still the GST/HST credit.
- **Left out pending a scope decision: the one-time Groceries and Essentials top-up.** On June 5, 2026 the CRA
  paid an extra 50% of the 2025-26 GST/HST credit, inside the July 2025 to June 2026 benefit year. Nothing in the
  schema or engine models it yet. See "Open decisions".

## The federal rate cut

- **Lowest bracket, 2025: 14.5%.** Bill C-4 sets paragraph 117(2)(a) of the Income Tax Act to 14.5% for 2025
  and to 14% from 2026. CRA's 2025 rate table shows 14.5% on income up to $57,375 ("The federal tax rate
  decreased from 15% to 14% on July 1, 2025, making the tax rate 14.5% for 2025").
- **Non-refundable credit rate, 2025: 14.5%.** Most credits use the "appropriate percentage" (subsection 248(1)),
  the lowest rate in subsection 117(2), and Bill C-4 left that definition alone. CRA ("What's new for 2025") and
  Finance both say the credit rate stays equal to the lowest rate. The engine takes the federal credit rate from
  `federal.brackets[0][1]` (`src/engine/personal.ts`, `household.ts`), so entering 0.145 as the 2025 first-bracket
  rate covers the basic, spouse and eligible dependant amounts, the Canada employment amount and the CPP/QPP,
  EI and QPIP credits. Data-only.
- **Dividend tax credit rates** are set separately (15.0198% eligible, 9.0301% non-eligible of the grossed-up
  amount) and aren't tied to the lowest rate. Data-only.

## The top-up tax credit and the 0.1-point rule

The Top-Up Tax Credit (line 34990, 2025 to 2030, enacted by Bill C-15) keeps a 15% rate on non-refundable credit
amounts above the first bracket threshold ($57,375 in 2025, $58,523 in 2026). Finance's explanatory notes give
it as (A − B × C) × D, with D = 3.45% for 2025 and 7.14% for 2026 to 2030. Since 3.45% = 0.5 / 14.5 and
7.14% = 1 / 14, that works out to 0.5% of credit amounts above the threshold in 2025 and 1% in 2026.

It's zero for every household the model can represent, so it gets no program id:

- The largest federal credit base the model can produce is a one-earner couple with the spouse amount:
  basic amount 16,129 + spouse amount 16,129 + Canada employment amount 1,471 + base CPP about 3,356 + EI about
  1,078 = about $38,160 (about $38,740 in Quebec with QPP and QPIP). That is about $19,000 under the threshold.
- Finance expects fewer than 0.3% of filers to claim it, mostly people with large tuition, medical or disability
  claims, none of which the model includes.
- 2026 has the same credit at 1 point and isn't modelled either, so 2025 and 2026 match in shape.
- **Recheck when seniors are built.** Age and pension amounts for both spouses (with transfers) can lift a couple's
  base just over the threshold. Even then the top-up would be a few dollars, well under 0.1 points.

Alberta has the same pattern: its 8% bracket (2025 onward) brought a supplemental credit of 2% on credit amounts
above $60,000 (the Act's 0.25 × (credits − $4,800)). The model's largest Alberta base is about $49,000 (basic and
spouse amounts 22,323 each, CPP, EI), so it is zero too, in both years.

## Findings

"Same shape" means the 2026 program id and fields express the 2025 rule; only the values change (#3).

### Federal

| Rule | 2025 | 2026 | Verdict | Source |
|---|---|---|---|---|
| Brackets | 5 brackets; 14.5% to $57,375, then 20.5 / 26 / 29 / 33% | 14% to $58,523, same upper rates | Data-only | https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/last-year.html |
| Credit rate (BPA, spouse, dependant, CEA, CPP/EI/QPIP) | 14.5%, the lowest rate | 14% | Data-only (engine reads `brackets[0][1]`) | https://www.parl.ca/documentviewer/en/45-1/bill/C-4/third-reading?col=2 |
| Top-up tax credit | 0.5% of credit amounts over $57,375 | 1% over $58,523 | Not modelled either year; zero for modelled households | https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-34990-top-up-tax-credit.html |
| Basic personal amount | Phased max to min between the 4th and 5th bracket thresholds | Same | Data-only (`phasedAmount`) | https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/whats-new.html |
| Quebec abatement | 16.5% | 16.5% | Data-only | https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/last-year.html |
| Canada employment amount | Fixed amount | Same | Data-only | https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/whats-new.html |
| Dividend gross-up and tax credit | 38% / 15%; DTC 15.0198% / 9.0301% | Same | Data-only | https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/last-year.html |
| Capital gains inclusion | 50% (the 2/3 tier was cancelled in March 2025) | 50% | Data-only | https://budget.canada.ca/2025/report-rapport/tm-mf-en.html |
| Foreign tax credit | Same rule | Same | No data | https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/whats-new.html |
| CPP/QPP base and enhanced, EI, QPIP | Same structure (QPP base 5.4% in 2025) | Same | Data-only | https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas.html |
| Canada Child Benefit (July 2025 to June 2026) | Two thresholds, rates by number of children | Same | Data-only | https://www.canada.ca/content/dam/cra-arc/formspubs/pub/t4114/t4114-25e.pdf |
| GST/HST credit (July 2025 to June 2026) | Adult, spouse or first child, child, single supplement, 5% phase-out | Same formula, renamed Groceries and Essentials Benefit, amounts up 25% | Data-only; set the new optional `name` for the 2025 label | https://www.canada.ca/content/dam/cra-arc/formspubs/pub/rc4210/rc4210-25e.txt |
| One-time GST/HST top-up (June 5, 2026) | 50% of the 2025-26 credit, inside the 2025 benefit year | None | Left out pending a scope decision (see below) | https://www.canada.ca/en/revenue-agency/news/2026/04/canada-groceries-and-essentials-benefit-one-time-top-up-payment-to-make-groceries-and-other-essentials-more-affordable-is-coming-june-5.html |
| Canada Workers Benefit (standard, AB, NU, QC) | Same structure | Same (2026 values estimated) | Data-only | https://budget.canada.ca/2025/report-rapport/tm-mf-en.html |
| Fuel charge, Canada Carbon Rebate | Ended April 2025 | None | Out of scope here (#29) | https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/whats-new.html |

### Provinces and territories: income tax

| Rule | 2025 | 2026 | Verdict | Source |
|---|---|---|---|---|
| AB brackets and credit rate | New 8% bracket to $60,000 for all of 2025; credits at 8% | 8% to $61,200 | Data-only | https://www.alberta.ca/personal-income-tax |
| AB supplemental credit | 2% of credit amounts over $60,000 | Same, indexed | Not modelled either year; zero for modelled households | https://kings-printer.alberta.ca/documents/Acts/A30.pdf |
| BC brackets, BC tax reduction | 7 brackets (5.06% lowest); reduction tapers above a threshold | Same shapes | Data-only | https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/last-year.html |
| MB brackets, BPA | Brackets and BPA frozen; BPA phased out from $200,000 to $400,000, starting 2025 | Same | Data-only (`phasedAmount`) | https://web40.gov.mb.ca/finance/taxation/pubs/bulletins/2024budget.pdf |
| NB brackets, low-income reduction | 4 brackets; reduction on family net income | Same | Data-only | https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/last-year.html |
| NL brackets, low-income reduction | 8 brackets; individual and family reduction | Same | Data-only | https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/last-year.html |
| NS brackets, BPA, child under 6, low-income reduction | Flat BPA $11,744 for all from 2025 (supplement folded in); brackets indexed | Same | Data-only | https://www.novascotia.ca/personal-income-tax-rates-and-indexation |
| NT brackets, 2% payroll tax | 4 brackets | Same | Data-only | https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/last-year.html |
| NU brackets, child under 6, 2% payroll tax | 4 brackets | Same | Data-only | https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/last-year.html |
| ON brackets, surtax, tax reduction, LIFT, health premium | Same structures | Same | Data-only | https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/last-year.html |
| PE brackets, low-income reduction | 5 brackets (9.5% lowest, 19% top) | 6 brackets (20% over $200,000) | Data-only (bracket count is data) | https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/last-year.html |
| QC brackets, worker deduction, living alone, spouse transfer | 4 brackets; same deductions and amounts | Same | Data-only | https://www.revenuquebec.ca/en/citizens/income-tax-return/completing-your-income-tax-return/income-tax-rates/ |
| SK brackets, child amount | BPA and other amounts raised by $500 (Affordability Act); 3 brackets | Same | Data-only | https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/last-year.html |
| YT brackets, federal BPA, employment amount credit | 5 brackets; BPA mirrors federal | Same | Data-only | https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/last-year.html |

### Provinces and territories: benefits and refundable credits (July 2025 to June 2026)

| Rule | 2025 | 2026 | Verdict | Source |
|---|---|---|---|---|
| AB Child and Family Benefit | Base and working components by number of children | Same | Data-only (`alberta-child-family-benefit`) | https://www.canada.ca/content/dam/cra-arc/formspubs/pub/t4114/t4114-25e.pdf |
| BC family benefit | Per-child max/min, single-parent supplement, two thresholds | Same | Data-only (`bc-family-benefit`) | https://www.canada.ca/content/dam/cra-arc/formspubs/pub/t4114/t4114-25e.pdf |
| NB child tax benefit and working income supplement | Per child, reduced over $20,000; WIS phase-in and phase-out | Same | Data-only (`nb-child-tax-benefit`) | https://www.canada.ca/content/dam/cra-arc/formspubs/pub/t4114/t4114-25e.pdf |
| NL child benefit | Per child by birth order; partial above a threshold | Same | Data-only (`nl-child-benefit`) | https://www.canada.ca/content/dam/cra-arc/formspubs/pub/t4114/t4114-25e.pdf |
| NT child benefit | Amounts by age and number of children; $30,000 to $80,000 taper | Same | Data-only (`nwt-child-benefit`) | https://www.canada.ca/content/dam/cra-arc/formspubs/pub/t4114/t4114-25e.pdf |
| NS child benefit | Full below $26,000; first child full and others half to $34,000 | Same | Data-only (`nova-scotia-child-benefit`) | https://www.canada.ca/content/dam/cra-arc/formspubs/pub/t4114/t4114-25e.pdf |
| NU child benefit | Per child, reduced above $22,065 | Same | Data-only (`per-child-reduced`) | https://www.canada.ca/content/dam/cra-arc/formspubs/pub/t4114/t4114-25e.pdf |
| ON child benefit | Per child, reduced above a threshold | Same | Data-only (`ontario-child-benefit`) | https://www.canada.ca/content/dam/cra-arc/formspubs/pub/t4114/t4114-25e.pdf |
| PE child benefit (first paid January 2025) | $30 or $20 a month per child by income band, nothing over $80,000 | Same bands | Data-only (`income-band-per-child`) | https://www.canada.ca/content/dam/cra-arc/formspubs/pub/t4114/t4114-25e.pdf |
| YT child benefit | Per child, reduced above $35,000 | Same | Data-only (`per-child-reduced`) | https://www.canada.ca/content/dam/cra-arc/formspubs/pub/t4114/t4114-25e.pdf |
| QC family allowance | Per-child max/min, single-parent supplements, school supplies | Same | Data-only (`quebec-family-allowance`) | https://www.retraitequebec.gouv.qc.ca/en/enfants/allocation-famille/Pages/allocation-famille.aspx |
| ON sales tax credit; energy and property tax credit | Per person, reduced over single/family thresholds; OEPTC unchanged | Same | Data-only | https://www.canada.ca/content/dam/cra-arc/formspubs/pub/rc4210/rc4210-25e.txt |
| QC solidarity tax credit | QST and housing components, reduced over a threshold | Same | Data-only | https://www.revenuquebec.ca/en/citizens/tax-credits/solidarity-tax-credit/calculation-of-the-credit/ |
| QC work premium | 11.6% (no children), 30% (single parent), 25% (couple with children); 10% reduction | Same rates | Data-only (`quebec-work-premium`) | https://cffp.recherche.usherbrooke.ca/outils-ressources/guide-mesures-fiscales/credit-impot-remboursable-prime-travail/ |
| BC renter's tax credit | Max, reduced over a threshold | Same | Data-only | https://www2.gov.bc.ca/gov/content/taxes/income-taxes/personal/credits/renters-tax-credit |
| MB renters and homeowners affordability credits | Renter flat amount; homeowner up to a max | Same | Data-only | https://www.gov.mb.ca/finance/personal/pcredits.html |
| SK low-income tax credit | Adult, spouse or dependant, 2 children max, reduced over a threshold | Same | Data-only | https://www.canada.ca/content/dam/cra-arc/formspubs/pub/rc4210/rc4210-25e.txt |
| NB HST credit | Adult, spouse, child ($300 first child of a single parent), 2% over $35,000 | Same | Data-only | https://www.canada.ca/content/dam/cra-arc/formspubs/pub/rc4210/rc4210-25e.txt |
| NS affordable living tax credit | Base plus per child, 5% over $30,000 | Same | Data-only | https://www.canada.ca/content/dam/cra-arc/formspubs/pub/rc4210/rc4210-25e.txt |
| NL income supplement | Max $520 single, $589 couple, $231 per child | Same | Data-only (`nl-income-supplement`) | https://www.canada.ca/content/dam/cra-arc/formspubs/pub/rc4210/rc4210-25e.txt |
| **PE sales tax credit** | $110 + $55 spouse or eligible dependant + 0.5% of family net income over $30,000 (max $55), all reduced by 2% over $50,000; no minimum | Essentials benefit: single/family amount, 1% over $95,000, $175 minimum | **New program id `pei-sales-tax-credit`** | https://www.canada.ca/content/dam/cra-arc/formspubs/pub/rc4210/rc4210-25e.txt |

## Why PEI needs a new program

The 2025 credit is `110 + (spouse or eligible dependant ? 55 : 0) + min(55, 0.005 × (famNet − 30,000)⁺)`, less
`0.02 × (famNet − 50,000)⁺`, floored at zero (RC4210 for 2025-26). The 2026 `pei-essentials-benefit` has no
supplement that rises with income, so treating the maximum as flat overstates the credit by up to $55 below
$41,000. That is at least 0.18 points of income at incomes up to $30,000 (about 0.28 at $20,000), over the
0.1-point rule. `nl-income-supplement` has the rising piece, but gives its extra amount only to couples, so a
single parent would lose the $55 for an eligible dependant. The CRA's PEI page says the essentials benefit
replaced this credit starting November 2026.

## What was added for 2025

1. **`pei-sales-tax-credit`** in the `credit` union (`src/data/schema.ts`), with its case in `creditsOf`
   (`src/engine/credits.ts`) and unit tests in `tests/engine-credits.test.ts`. Parameters: `individual`,
   `spouseOrDependant` (given to couples and single parents), `supplementRate`, `supplementFrom`, `supplementMax`,
   `rate` and `threshold`. 2025 values for #3, from RC4210 for 2025-26: individual 110, spouseOrDependant 55,
   supplementRate 0.005, supplementFrom 30000, supplementMax 55, rate 0.02, threshold 50000.
2. **`groceriesBenefit.name`** (optional). For 2025, set it to the credit's 2025 name (the GST/HST credit). The
   engine falls back to "Canada Groceries and Essentials Benefit", so 2026 is unchanged.

Not added: the one-time top-up (below). If it's included later, an optional share on `groceriesBenefit` (0.5 for
2025), shown as its own credit line, would express it from the published figure. Scaling every amount and rate by
1.5 gives the same total but stores values that match no published figure.

## Open decisions

- **One-time Groceries and Essentials top-up (left out for now).** Equal to 50% of the 2025-26 GST/HST credit,
  paid June 5, 2026 to everyone entitled in January 2026. Under the model's benefit-year convention it belongs to
  2025, and it is material: a single person at $25,000 gets about $267, about 1 point of income. It is federal,
  so it doesn't change the gaps between provinces. `docs/SCOPE.md` has no rule for one-time payments; it stays out
  until the user decides.
- **UI text is written for 2026.** The page notes and tooltips (`src/ui/notes.ts`) call the federal credit the
  "Canada Groceries and Essentials Benefit" and list the PEI essentials benefit. For 2025 they'll need to use
  `groceriesBenefit.name` and mention the PEI sales tax credit. That's UI work, not a rule shape.

## Not checked separately

The 2025 amounts themselves (#3). Rules marked "Same" whose structure is long-standing (Ontario surtax, health
premium, LIFT and tax reduction; BC tax reduction; the Quebec worker deduction and living-alone amount; the
low-income reductions in NB, NL, NS and PEI; the Saskatchewan child amount; the NS and Nunavut amounts for children
under 6) were compared with the 2026 data files and the year's budget summaries, not with a 2025 form line by line.
#3 should flag any that turn out different.

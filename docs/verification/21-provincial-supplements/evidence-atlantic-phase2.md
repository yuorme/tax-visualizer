# Atlantic evidence closure for issue #21, phase two

Checked 2026-11-05 by Codex Sol, `gpt-6.1-sol`, xhigh. This note supplements [the inventory](atlantic.md).
It records evidence and independent arithmetic; it changes no application, data, tests, or golden results.
Survivors, care, coastal Labrador, and the grants follow-up (#216) are outside the implementation scope.

The rules below distinguish payment-year eligibility from the user-approved current-income proxy. Using current
income in place of unavailable historical income does not authorize moving a statutory age test into the current
year. No additional user inputs are proposed.

## Newfoundland and Labrador

### Reference year, age, household, and payment months

[Income Tax Act, 2000, section 34][nl-act] is the controlling payment rule. Subsection 34(3) pays 25% of the
regulation's annual amount in each specified month. Subsection 34(12) maps base taxation year `B` to July and
October of `B + 1`, followed by January and April of `B + 2`. Subsection 34(6) permits one claimant for a couple.
The [Income Supplement Regulations, paragraph 3(c)][nl-reg] require the individual or qualified relation to
have been at least 64 at any time in `B`. They do not require OAS or GIS receipt.

For selected calendar year `Y`, let `A` be an adult's age on December 31 of `Y`, as in the existing input model:

| Payments in Y | Base year | Senior age condition, for either adult |
| --- | --- | --- |
| January and April | Y - 2 | A >= 66 |
| July and October | Y - 1 | A >= 65 |

Birth month does not prorate this NL test. Someone turning 65 in December of `Y` was 64 in `Y - 1` and can
qualify for July and October while still 64. Someone turning 66 in December qualifies for all four payments.
Applying a current-year age-65 check to January and April would add payments before the statutory age test.

The base-year adjusted family net income definition follows federal section 122.5: combined spouses' net
income, with the UCCB/RDSP adjustments. OAS and GIS are already part of return net income; their later
taxable-income deductions do not remove them from this starting measure. Under the authorized approximation,
substitute the current-income proxy for the base-year income while retaining each half-year's statutory age test.

### Annual entitlement and the two schedules in each calendar year

For senior-eligible households, before payment rounding:

`S(I; M, T) = max(0, M - 0.1166 * max(0, I - T))`.

There is one senior amount per household, including a two-senior couple, rather than one per senior.
[The regulation][nl-reg], [2026 amendment][nl-amendment], and CRA's retained
[2024][nl-cra-2024] and [2025][nl-cra-2025] program schedules support:

| Schedule starts | Annual maximum M | Reduction starts T | Calendar-year installments |
| --- | --- | --- | --- |
| July 2024 | $1,516 | $29,402 | January/April 2025 |
| July 2025 | $1,551 | $30,078 | July/October 2025 and January/April 2026 |
| July 2026 | $1,882 | $30,409 | July/October 2026 |

The 2026 amendment is effective July 1, 2026 and prevents an additional 2026 indexing step on its prescribed
amounts. Do not apply the $1,882 maximum to January or April 2026.

With stable income and normal quarterly payment, an age-66-or-older household at `I = $35,000` has:

| Schedule | Independent calculation of S | Quarterly raw amount |
| --- | --- | --- |
| July 2024 | 1516 - 0.1166 * (35000 - 29402) = 863.2732 | 215.8183 |
| July 2025 | 1551 - 0.1166 * (35000 - 30078) = 977.0948 | 244.2737 |
| July 2026 | 1882 - 0.1166 * (35000 - 30409) = 1346.6894 | 336.67235 |

Thus raw calendar-year sums are $920.184 in 2025 and $1,161.8921 in 2026, before the unresolved cent convention.
An adult who is age 65 on December 31, 2026 has only the July/October age entitlement: raw $673.3447 here.

### Small payments are accelerated on the combined provincial benefit

Subsections 34(10)-(11) of [the Act][nl-act] accelerate the remaining same-base-year installments when the
current provincial payment is below $10 and the other installments are expected to remain below $10. This test
applies to the combined amount prescribed under the regulations: ordinary income supplement, any disability
amount, and senior benefit. It does not test the senior component by itself. At exactly $10, the below-$10
condition is false.

For a stable household known in July, a combined quarterly amount below $10 can therefore produce the whole
remaining annual amount in July, with no October, January, or April installment for that base year. A plain
half-previous-schedule plus half-current-schedule calculation fails near phaseout. Adding a senior benefit can
also change when an existing ordinary income supplement is paid.

Independent 2026 examples, before cents, with senior age eligibility and no disability component:

| Household and income | Senior annual S | Ordinary annual amount | Combined quarterly | Timing from July 2026 |
| --- | --- | --- | --- | --- |
| Single, $46,200 | 40.7694 | 0 | 10.19235 | Quarterly |
| Single, $46,210 | 39.6034 | 0 | 9.90085 | All 39.6034 in July |
| Single, $46,300 | 29.1094 | 0 | 7.27735 | All 29.1094 in July |
| Couple, $46,300 | 29.1094 | 589 - 0.09 * 6300 = 22 | 12.77735 | Quarterly |

The last example needs coordinated total-benefit timing: its $22 ordinary benefit under the previous schedule
may already have been paid in July 2025. The new senior component cannot simply be added to an independently
annualized ordinary component without considering the statutory acceleration.

### Reporting is closed; cent rounding remains open

CRA lists the [NL seniors' benefit][nl-cra] among the provincial programs administered with the GST/HST credit.
CRA's [amounts not reported as income][nonreported] explicitly include GST/HST and related provincial or
territorial credits and benefits. The senior benefit therefore adds household cash, with no line 14500 inclusion,
no matching line 25000 deduction, and no addition to AFNI.

No primary source found specifies whether CRA rounds this NL benefit per installment, after annual summation,
or after combining provincial components. For example, two separately rounded $244.2737 installments total
$488.54, whereas rounding their raw sum gives $488.55. The statute supplies the formula and 25% rule, not that
administrative cent convention. Preserve the unresolved cent difference explicitly in implementation assumptions.

The [official provincial calculator script][nl-calculator-script] is not a valid 2026 rounding reference: the
retrieved script still uses $1,551/$30,078/$43,380, interpolates between endpoints, and applies its small-payment
test to the ordinary supplement alone. Its displayed two decimals do not establish the administrator's method.

## New Brunswick

### Mixed GIS/Allowance couples and prior-year receipt

[New Brunswick Income Tax Act, section 52][nb-act], rather than an abbreviated web example, controls the
mixed-couple case. Subsection 52(1) requires NB residence on the preceding December 31, receipt of a qualifying
federal GIS or Allowance in the preceding taxation year, and an application. Subsection 52(4) limits two eligible
spouses or common-law partners to one application, except prescribed exceptions. It covers a co-resident couple
where one receives GIS and the other receives Allowance, as well as two GIS recipients.

The [2025 form][nb-2025] and [2026 program page][nb-2026] establish one annual $616/$629 payment respectively.
The 2026 summary's two-GIS example does not authorize a second payment to a mixed GIS/Allowance couple.
The separate-residence exception is outside the co-resident household model.

Using a receipt proxy requires positive prior-year GIS or Allowance eligibility, rather than just a current-year
GIS election or current-year age. For an otherwise eligible GIS-only adult with current age `A` on December 31:

| Current adult | Receipt issue in preceding year | Annual NB benefit |
| --- | --- | --- |
| A = 65, any birthday | Preceding-year age was at most 64 | 0 |
| A = 66, December birthday | First possible GIS month is January of current year | 0 |
| A = 66, November birthday | December of preceding year can contain GIS | $616/$629 if prior GIS positive |
| A >= 67 | Prior-year age permits GIS | $616/$629 if prior GIS positive |

These follow [ESDC's GIS start rule][gis-start], which begins in the month after the 65th birthday. Allowance
receipt can independently qualify the younger spouse: do not impose a universal minimum current age of 66 on
every NB claimant. The underlying statute requires actual receipt; a modeled prior-year calculation remains a
documented approximation when no actual benefit-history input exists.

### Non-taxable is established; line 14500 treatment is not closed

Section 52 deems an overpayment and authorizes its refund. The government's statement in the
[March 28, 2024 Hansard, printed page 70][nb-hansard] also explicitly calls the annual single-payment benefit
non-taxable. These establish the legal refund form and absence of taxable income.

They do not independently establish absence from line 14500 or net income. [Statistics Canada's official
T1 Family File glossary][statcan] specifically lists NB's Low-Income Seniors' Benefit with amounts already in
social assistance removed from refundable-credit estimates from 2018 onward. Its methodological paragraph
explains that seniors' refundable credits with T5007 slips move to social assistance and names NB among the
affected provinces. This is a reason to verify the program's reporting practice, not proof that every recipient
receives a T5007.

[CRA's T5007 guide][t5007-guide] exempts certain payments outside a series and series totaling no more than
$500, but does not identify the NB annual benefit. The $616/$629 amounts exceed that numerical threshold;
the annual lump sum alone does not settle the statutory meaning of a series. No primary program-specific
NB/CRA statement found closes T5007 or line 14500 reporting for 2025 and 2026. Preserve this as an evidence gap;
do not convert the non-taxable description into a verified no-net-income-inclusion rule.

## Nova Scotia

### Eligibility and refund formula

The [Tax Refund for Seniors Receiving the Guaranteed Income Supplement Regulations][ns-reg] apply to 2010
and later taxation years, covering both 2025 and 2026 without a new annual schedule. Section 4 requires:

- The individual attained 65 before December 31, resides in NS, and is not a trust.
- GIS was actually received at some time in the tax year and reported on that year's return.
- The assessed NS Part II provincial tax liability is positive.

GIS is the named federal benefit. Allowance alone, although also reported on line 14600, does not satisfy the
GIS condition. Spouses are evaluated individually. The regulation also excludes death during the tax year,
certain diplomatic exemptions, and confinement for at least 90 days; those are outside the ordinary model.

For an eligible individual, let `T` be final assessed provincial liability after its applicable tax credits.
Sections 5 and 6 give the ordinary payment rule:

`R(T) = 0 if T <= 0; otherwise min(10000, max(50, T))`.

If GIS receipt or another required condition fails, `R = 0` regardless of `T`. Section 7's additional refund
above $10,000 requires a written request and ministerial discretion; it is not an automatic formula amount.
Independent liability-boundary cases are:

| T | GIS received | Ordinary refund |
| --- | --- | --- |
| $0 | Yes | $0 |
| $0.01 | Yes | $50 |
| $49.99 | Yes | $50 |
| $50 | Yes | $50 |
| $500 | Yes | $500 |
| $10,000 | Yes | $10,000 |
| $10,000.01 | Yes | $10,000 |
| $500 | No, or Allowance only | $0 |

The $50 floor means the cash refund can exceed the individual's remaining positive liability. Do not cap the
refund at that liability. This program is additional to the existing NS $1,000 nonrefundable age credit.

### December birthdays, timing, and reporting

The literal section 4 age wording is **before** December 31. It excludes a December 31 65th birthday.
No new birth-day input is needed for the supported OAS/GIS model: every adult turning 65 in December has zero
GIS for that year under the month-after-65 start rule, so already fails the independent receipt condition.
A November 65th birthday can produce one December GIS payment and eligibility; age 66 in December passes
the age rule regardless of birth month. Use positive GIS receipt, not merely an age-65 flag.

Section 6(2) assigns the refund to January 1–December 31 of the tax year regardless of the actual payment date.
The [August 28, 2026 release][ns-release] describes refunds for 2025 returns issued in August 2026, with
another payment run in January. This supports attributing the calculated refund to its assessed tax year in
the annual comparison while explaining that it is received later.

Section 5 expressly deems a tax overpayment, and sections 6-7 authorize its refund. Treating the ordinary NS
refund as tax-refund cash without line 14500 income is a statutory-classification inference. No primary
program-specific statement saying no T5007 or no net-income reporting was found. It is not covered by the
GST/HST-related exemption used to close NL's separate benefit classification.

The 2026 release supplies an observed scale: about 20,000 recipients, $30.6 million, and an average $1,532.
This closes the phase-one gap about typical payment size, though it is not an individual entitlement formula.

## BC and Ontario reporting cross-check

BC's [T5007 information for clients, updated February 26, 2026][bc-t5007], covers calendar-2025 payments.
Questions 1-2 and 4-7 explicitly include the Senior's Supplement. All amounts actually issued in that calendar
year, including retroactive amounts, enter the slip. More than $500 is reported in full, not just the excess;
$500 or less has no slip and does not have to be reported as income. The document says there is a separate
slip for each program and that T5007 income can affect GST/CCB credits but does not affect OAS/GIS eligibility.

For this scoped program alone, independent reporting boundaries are annual cash of $500 -> report $0 and
$500.01 -> report the full $500.01. Do not add the unrelated bus-pass benefit unless it is separately modeled.
The PDF is direct evidence for 2025. Continuing its reporting convention into 2026 uses the current policy and
continuing CRA rules; a calendar-2026 T5007 bulletin was not yet available at this check.

Ontario's [May 2025 ministry application form 4803-69E, page 3][on-form] explicitly identifies GAINS as T5007
box 11. This closes the income-slip classification, independently of its payment-rate formula. Its exact
low-payment reporting exception needs the controlling CRA/program rule, not an assumption that every positive
GAINS payment is reported. The parent researcher owns Ontario entitlement and rate evidence.

[CRA line 14500 instructions][line-14500] require reportable T5007 box 11 amounts in net income at line 14500,
then allow the equal line 25000 deduction from taxable income. This is non-taxable income that can still change
income-tested credits or age amounts. Add cash once and the reporting amount once; the deduction is not cash.

For spouses or common-law partners living together when payments were received, CRA assigns all social
assistance to the spouse with the higher net income, determined before line 14500 and the line 21400/23500
deductions. At equal income the named recipient reports it. Do not default to splitting it equally or to the
person whose bank account received the payment.

## Cached sources

New extracts have their original URL, retrieval date, and source hash in the header. Existing phase-one
extracts remain linked from [the inventory](atlantic.md). The shared source indexes were not modified.

| New phase-two extract | Primary source / relevant location |
| --- | --- |
| [NL Act](sources/atlantic-phase2-nl-act.txt) | Section 34(3), (6), (10)-(12) |
| [NB Act](sources/atlantic-phase2-nb-act.txt) | PDF pages 65-66, section 52 |
| [Ontario reporting form](sources/atlantic-phase2-on-gains-reporting-form.txt) | PDF page 3, GAINS row |
| [CRA nonreported amounts](sources/atlantic-phase2-cra-nonreported.txt) | GST/HST and related provincial benefits |
| [BC T5007 bulletin](sources/atlantic-phase2-bc-t5007.txt) | Questions 1-2 and 4-7 |
| [CRA line 14500](sources/atlantic-phase2-cra-14500.txt) | Social assistance, spouses, line 25000 |
| [CRA T5007 guide, current](sources/atlantic-phase2-cra-t5007-guide.txt) | Chapter 4 exclusions |
| [CRA T5007 guide, 2025](sources/atlantic-phase2-cra-t5007-2025.txt) | PDF pages 4-5 |
| [NS 2026 refund release](sources/atlantic-phase2-ns-refund-2026.txt) | 2025-return refunds and average payment |
| [ESDC GIS start rule](sources/atlantic-phase2-gis-start.txt) | Payment begins after 65th birthday |
| [NL calculator script](sources/atlantic-phase2-nl-calculator-script.txt) | Retrieved outdated implementation, caution above |
| [Statistics Canada glossary](sources/atlantic-phase2-statcan-nb-reporting.txt) | Provincial refundable credits / NB / T5007 methods |
| [NB Hansard](sources/atlantic-phase2-nb-nontaxable-hansard.txt) | Physical PDF page 78, printed page 70 |

[nl-act]: https://www.assembly.nl.ca/legislation/sr/statutes/i01-1.htm
[nl-reg]: https://www.assembly.nl.ca/legislation/sr/regulations/rc160032.htm
[nl-amendment]: https://www.assembly.nl.ca/legislation/sr/annualregs/2026/nr260017.htm
[nl-cra-2024]: https://www.canada.ca/content/dam/cra-arc/formspubs/pub/rc4210/rc4210-24e.pdf
[nl-cra-2025]: https://www.canada.ca/content/dam/cra-arc/formspubs/pub/rc4210/rc4210-25e.pdf
[nl-cra]: https://www.canada.ca/en/revenue-agency/services/child-family-benefits/provincial-territorial-programs/province-newfoundland-labrador.html
[nonreported]: https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/personal-income/amounts-that-taxed.html
[nl-calculator-script]: https://www.gov.nl.ca/fin/wp-content/themes/gnl-web-department/inc/calculator/incomesupplement.js
[nb-act]: https://laws.gnb.ca/en/pdf/cs/N-6.001.pdf
[nb-2025]: https://www2.snb.ca/content/dam/snb/lisb-pafr/lisb-application-2025.pdf
[nb-2026]: https://www2.gnb.ca/content/gnb/en/corporate/promo/new-brunswick-low-income-seniors-benefit.html
[nb-hansard]: https://www.legnb.ca/content/house_business/60/3/hansard/33%202024-03-28bil.pdf
[statcan]: https://www150.statcan.gc.ca/n1/pub/72-212-x/2025001/sect3-eng.htm
[t5007-guide]: https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4115/guide-t5007-return-benefits.html
[gis-start]: https://www.canada.ca/en/services/benefits/publicpensions/old-age-security/guaranteed-income-supplement/while-receiving.html
[ns-reg]: https://novascotia.ca/just/regulations/regs/incgis.html
[ns-release]: https://news.novascotia.ca/en/2026/08/28/provincial-tax-refunds-low-income-seniors
[bc-t5007]: https://www2.gov.bc.ca/assets/gov/british-columbians-our-governments/policies-for-government/bc-employment-assistance-policy-procedure-manual/additional-resources/t5007-info.pdf
[on-form]: https://forms.mgcs.gov.on.ca/dataset/4b357ccd-966c-493b-85c3-29ffba9aeb6a/resource/46bcdd8e-53cc-4dce-b685-e7188095e8d0/download/4803-69e.pdf
[line-14500]: https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/personal-income/line-145-social-assistance-payments.html

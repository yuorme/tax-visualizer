# Archived Atlantic evidence draft for #21, phase two

Preserved from the earlier temporary research draft. The
[canonical phase-2 evidence](evidence-atlantic-phase2.md) supersedes this draft's interpretations and links.

Checked **2026-11-05** by Codex Sol, xhigh. This is evidence and specification work only; no code, annual data,
golden expectations or git state were changed. This note supplements [the inventory](atlantic.md).
The retained implementation scope excludes survivor/care cases, Coastal Labrador and grants assigned to #216.
It assumes the household's ordinary filing, residency and application conditions are met. The approved use of
current income as a proxy for reference-year income must be labelled; it does not change statutory age dates.

## Findings that are closed

1. NL's January/April and July/October quarters have different income/age reference years.
2. NL's senior amount is a household amount, and its small-payment acceleration applies to the combined
   provincial amount rather than the senior component by itself.
3. NL's Seniors' Benefit is not reported as line 14500 income.
4. NB's co-resident one-payment rule includes mixed GIS/Allowance couples, despite the short 2026 page wording.
5. NS requires GIS receipt, not just any line 14600 amount or an unchecked GIS option. Its December 31 birthday
   wording does not require a day-of-birth field within the modeled full-OAS/GIS case.
6. BC and Ontario GAINS require T5007/line 14500 treatment where reportable; non-taxability alone is insufficient.

Administrator cent rounding remains unverified. NB's line 14500 treatment is not fully closed by the primary
sources located; the evidence conflict is preserved below. NS's no-line-14500 treatment is a legal
classification inference from its deemed-tax-overpayment provisions, not an explicit program tax-slip statement.

## NL timing, age and formula

The [NL Income Tax Act][nlact], section 34(12), assigns income/reference year `B` to July/October of `B+1` and
January/April of `B+2`. Section 34(3) pays 25% of the regulation's annual amount for each specified month.
The [regulation][nlreg], paragraph 3(c), requires at least age 64 at some point in `B`. Section 34(6) of the Act
allows one eligible claimant per couple. Cache: [Act](sources/atlantic-phase2-nl-act.txt), especially section 34.

Use these annual senior formulas before administrator rounding:

| July-start payment year | Income year B | Annual senior amount S(I) |
|---|---:|---|
| 2024, including January/April 2025 | 2023 | `max(0, 1,516 − .1166 × max(0, I − 29,402))` |
| 2025, including January/April 2026 | 2024 | `max(0, 1,551 − .1166 × max(0, I − 30,078))` |
| 2026, including January/April 2027 | 2025 | `max(0, 1,882 − .1166 × max(0, I − 30,409))` |

The inventory's cached CRA 2024/2025 guides establish the first two schedules; the
[2026 amendment][nlamend] establishes the last effective July 1, 2026. The latter also suspends additional
indexation for the 2026 taxation year. Do not derive another inflation adjustment.

For calendar year `Y`, let `A` be the existing input age on December 31 of `Y`. At least one adult must have:

- `A >= 66` for the January/April senior component, because `B = Y−2`;
- `A >= 65` for the July/October senior component, because `B = Y−1`.

This follows directly by subtracting the reference-year gap from year-end age. Birth month does **not** prorate
NL's statutory senior age test. A person turning 65 in December can be eligible for that July's senior component
while still 64. Do not add a requirement for current OAS or GIS receipt: the NL provisions do not impose it.
The household amount is included once when either adult satisfies the relevant age test, not once per adult.
Quarterly residency and unchanged marital-status assumptions remain necessary.

`I` is the appropriate reference year's adjusted family net income. The [CRA program page][nlcra] defines this
as the two line 23600 amounts, less UCCB/RDSP receipts, plus their repayments. OAS and net federal supplements
included in line 23600 must not be confused with taxable income or GIS's own assessable income. The approved
income proxy can substitute current `I` for missing reference-year `I`; it cannot substitute current age for
reference-year age. No assertion is made that this proxy reproduces an actual first-retirement-year assessment.

Independent examples, assuming all applicable quarters and no small-payment acceleration:

| Case | Correct senior component before administrator rounding |
|---|---|
| Single, year-end age 64 in 2025 or 2026 | Zero in all four quarters |
| Single, age 65 in 2025, any birth month, I ≤$30,078 | January/April $0; July/October $387.75 each; calendar total $775.50 |
| Single, age 65 in 2026, any birth month, I ≤$30,409 | January/April $0; July/October $470.50 each; calendar total $941 |
| Single, age 66+ throughout the reference-year tests, maximum schedules | 2025 calendar `(1,516+1,551)/2 = $1,533.50`; 2026 `(1,551+1,882)/2 = $1,716.50` |
| Couple ages 65/65 at year-end 2026 | Same $941 calendar senior component, not $1,882 |
| Single age 65 in 2025, I=$31,078 | Annual July-start schedule `1,551−.1166×1,000 = $1,434.40`; July/October $358.60 each; calendar $717.20 |
| Single age 65 in 2026, I=$31,409 | Annual July-start schedule $1,765.40; July/October $441.35 each; calendar $882.70 |
| 2025 schedule I=$43,379 / $43,380 | Annual raw senior component $0.1034 / $0; ordinary NL supplement still contributes to payment timing |
| 2026 schedule I=$46,549 / $46,550 | Annual raw senior component $0.076 / $0; final tiny-payment administration remains unverified |

### Combined small-payment acceleration

NL Act sections 34(10)–(11) accelerate all remaining installments for the same income/reference year into the
current installment when the current provincial amount is below $10 and the subsequent ones are reasonably
expected to remain below $10. Section 34(3) is based on the **total** prescribed amount: ordinary supplement,
disability component where relevant, and senior component. The retained no-disability calculation must therefore
test `(ordinary + senior)/4`, not `senior/4`.

For stable status/income known at July, a combined quarterly amount below $10 is paid as an annual July lump
sum, with no October/January/April payment from that same reference year. At $10 exactly, ordinary quarterly
payment applies. Consequently a calendar-year calculation cannot always take half of each July-start schedule.
It must account for whether the previous July's schedule was already paid in full.

Independent 2026 examples for a single senior, with constant proxy income and ordinary NL supplement zero:

| I | Annual senior S | Combined quarterly amount | Timing implied by section 34 |
|---:|---:|---:|---|
| $46,200 | $40.7694 | $10.19235 | Quarterly; only July/October contribute in calendar 2026 because the prior senior schedule is zero |
| $46,210 | $39.6034 | $9.90085 | Full raw $39.6034 in July 2026, rather than half in calendar 2026 |
| $46,300 | $29.1094 | $7.27735 | Full raw $29.1094 in July 2026 |

At $46,300 for a couple, the ordinary supplement is `589−.09×6,300 = $22`, so the combined quarterly amount is
`(22+29.1094)/4 = $12.77735`: **quarterly**, unlike the same-income single. The prior ordinary-only annual
amount may already have been accelerated the previous July. Adding the senior program can therefore change the
calendar timing of the ordinary component too; preserve one coherent payment calculation and attribution.

### Cent rounding and an unsafe calculator reference

The law supplies a real-valued annual formula and 25% installments; no authoritative cent-rounding order was
found. Do not silently round each component, annual amount and quarter at multiple stages. For example,
`$977.0948/4 = $244.2737`: twice a cent-rounded quarter is $488.54, while rounding the raw half-year total gives
$488.55. Those are different conventions; neither is verified here as CRA's actual administrative procedure.
Use exact statutory arithmetic for reference expectations and disclose the limit on cheque-level precision.

The government's [calculator page][nlcalc] loads this [JavaScript][nlcalcjs]. Its current script still uses the
2025 $1,551/$30,078/$43,380 parameters, endpoint interpolation instead of the statutory .1166 rate, and ordinary
supplement alone to select some lump-sum/minimum-payment displays. Its two-decimal formatting is not proof of
administrator rounding. Cache: [script](sources/atlantic-phase2-nl-calculator-script.txt).
The page's “quarterly below $2” message also does not justify adding an unverified per-component $2 cutoff.

## Tax reporting: NL is closed; NB and NS need classification care

The [CRA nonreported-amounts page][cranoreport] expressly excludes the GST/HST credit and its related provincial
and territorial credits/benefits from income reporting. The [NL CRA page][nlcra] expressly lists the Seniors'
Benefit as a related quarterly program. Together these support **no line 14500, no line 25000 and no net-income
addition** for the NL senior amount. Its payment is included in household cash once.
Cache: [CRA nonreported amounts](sources/atlantic-phase2-cra-nonreported.txt).

### New Brunswick

The [NB Income Tax Act][nbact], section 52(1), requires NB residence at the preceding December 31, qualifying
GIS/Allowance receipt in the preceding tax year, and an application. Section 52(4) restricts **both spouses
eligible under subsection (1)** to one application, subject to prescribed exceptions. This closes the ordinary
co-resident GIS+Allowance case: one $616 payment for 2025 or $629 for 2026, not two.
Cache: [Act PDF pages 65–66](sources/atlantic-phase2-nb-act.txt).

With no new history input, derive any approved prior-receipt proxy from the preceding calendar year by reducing
each adult's year-end age by one, retaining birth month, marital structure and relevant benefit opt-in choices,
and applying the approved constant-income convention. Do not treat merely checking current GIS as prior receipt.
The proxy's means-test/rate-year approximation must be explicit; actual previous-year benefit receipt cannot be
fully inferred from a single current-year income scenario.

Independent age/receipt boundary cases, single GIS-only recipient with otherwise qualifying constant income:

| Selected-year input | Prior-year GIS receipt condition | Annual NB result |
|---|---|---|
| Year-end age 65, any birth month | Prior year age 64: no GIS | $0 |
| Year-end age 66, birth month December | Prior-year 65th birthday is December; GIS first starts January of selected year | $0 |
| Year-end age 66, birth month November | Prior-year GIS can start in December, so positive receipt qualifies | $616 in 2025 / $629 in 2026 |
| Year-end age 67+, positive preceding-year GIS | Qualifies | One full annual payment |
| Co-resident qualifying GIS+Allowance couple | At least one/both had qualifying preceding-year receipt | One full annual payment |

These are GIS-only age examples; a younger spouse with qualifying prior-year Allowance must not be rejected by
an invented universal age-66 NB rule. [ESDC][gisstart] confirms GIS starts after the 65th birthday month.

Section 52 deems the payment a refund of a tax overpayment. The [March 28, 2024 government Hansard statement][nbhansard]
also expressly calls the annual benefit non-taxable. That establishes no taxable-income addition.
It does **not**, by itself, prove there is no net-income/line-14500 reporting: several other provinces call
their tax-free programs refundable credits but report them on T5007 slips.

The [Statistics Canada primary glossary][statcan] says NB Low-Income Senior's Benefit amounts already included
in social assistance have been excluded from its separate refundable-credit estimate since 2018. Its general
methodology explicitly refers to T5007 reporting and names NB among affected provinces. This is a meaningful
conflict with a universal “all NB recipients never report this payment” assertion.
Cache: [StatCan glossary](sources/atlantic-phase2-statcan-nb-reporting.txt), NB program list and following method note.

The [CRA T5007 guide][t5007] excludes payments outside a series and series totalling no more than $500 in the
year; [2025 chapter extract](sources/atlantic-phase2-cra-t5007-2025.txt),
[2026 guide](sources/atlantic-phase2-cra-t5007-guide.txt). This supports investigating an annual-single-payment
exception, but is not a program-specific ruling that resolves the StatCan evidence. No first-party program
statement definitively settling NB's 2025–2026 line-14500 treatment was found. Keep that reporting gate explicit;
do not silently convert the statutory-refund classification into a verified no-reporting rule.

### Nova Scotia

The [NS regulation][nsreg] applies to 2010 and later years, hence both 2025 and 2026. For the retained ordinary
resident/alive/not-imprisoned scenario, eligibility requires GIS received during the selected tax year, filed
and reported on the return, plus positive assessed NS Part II liability. It is individual, not one per couple.
Let `T` be that person's final provincial liability after all applicable credits/reductions:

- no eligible GIS receipt, or `T <= 0`: `R = 0`;
- otherwise `R = min(10,000, max(50, T))` for the ordinary automatic amount.

Regulation section 7 allows discretionary additional relief beyond $10,000 after an application; that is not
part of the automatic formula. Examples at `T=0/.01/49.99/50/500/10,000/10,000.01` give ordinary
`R=0/50/50/50/500/10,000/10,000`. `T=500` with no GIS gives zero. Current Allowance alone also gives zero:
although line 14600 includes Allowance, the regulation specifically requires GIS receipt.

The literal age condition is attaining 65 **before** December 31. The public summary says 65 or older in the
tax year. Within the modeled full-OAS case, [ESDC's GIS start rule][gisstart] makes year-end age 65 with December
birth month have no GIS cash in that year, regardless of birthday day. It already fails the receipt condition.
Age 65 with November birthday can receive December GIS; age 66 with any birth month passes the age condition.
Thus positive actual/modelled GIS receipts resolve the day ambiguity without adding a day-of-birth input.

Regulation section 6(2) attributes the refund to the selected January–December tax year irrespective of payment
date. Actual disbursement is later: the [August 28, 2026 release][nsrefund26] concerns 2025 returns and states
payments run in August and January. Attribute the tax relief to its liability year in the engine; do not claim
this is the same year's cheque cash flow. That release gives an observed average refund of **$1,532** among
about 20,000 recipients, improving the phase-one inventory's unresolved typical-payment evidence.
Cache: [2026 release](sources/atlantic-phase2-ns-refund-2026.txt).

Sections 5–6 legally describe a deemed overpayment and refund, supporting treatment as tax relief rather than
new line-14500 income. However, no explicit primary program/CRA source saying “no T5007/no net-income reporting”
for this particular NS refund was located. Label that classification as an inference if adopted; do not cite the
general GST-related exemption as if NS's separate GIS tax refund were itself a GST-related credit.

## BC and Ontario reporting evidence

The government's [BC T5007 information][bct5007] downloaded on this pass is dated February 26, 2026 and concerns
calendar-2025 payments. It explicitly includes Senior's Supplement payments, says they affect tax-credit income,
and says they do not affect OAS/GIS. FAQ 5 provides separate slips by program. FAQ 7 says a program's payments
of $500 or less produce no slip and do not need reporting. Above $500 the full reportable amount is included,
not only the excess. Cache: [BC current PDF](sources/atlantic-phase2-bc-t5007.txt).

The [Ontario government's May 2025 form 4803-69E][onreport], page 3, explicitly identifies GAINS as **T5007 Box 11**.
This is source-specific reporting evidence rather than an inference from the term “non-taxable”.
Cache: [Ontario page 3](sources/atlantic-phase2-on-gains-reporting-form.txt).

The [CRA line 14500 instructions][cra145] establish full net-income inclusion and an equal line-25000 deduction,
so reported amounts affect benefits/credits and net-income-tested age amounts while not directly increasing
taxable income. Co-resident couples assign social assistance to the higher-net-income spouse, determined before
social assistance, child-care deduction and social-benefits repayment; it is not automatically assigned to the
person named on the slip. Equal pre-test incomes use the slip's named recipient.
Cache: [CRA instructions](sources/atlantic-phase2-cra-14500.txt).

Independent reporting boundary: a reportable annual BC Senior's Supplement amount of exactly $500 adds zero
under the stated nonreporting exception; $500.01 adds the full $500.01 to line 14500/net income and deducts
$500.01 at line 25000. The reporting boundary can itself change other credits. Do not generalize a missing slip
caused by an address error into an exemption, or count excluded bus-pass benefits as cash in this feature.
Ontario's program-specific low-payment reporting practice was not closed here; the parent researches its Act.

[nlact]: https://www.assembly.nl.ca/legislation/sr/statutes/i01-1.htm
[nlreg]: https://www.assembly.nl.ca/legislation/sr/regulations/rc160032.htm
[nlamend]: https://www.assembly.nl.ca/legislation/sr/annualregs/2026/nr260017.htm
[nlcra]: https://www.canada.ca/en/revenue-agency/services/child-family-benefits/provincial-territorial-programs/province-newfoundland-labrador.html
[nlcalc]: https://www.gov.nl.ca/fin/tax-programs-incentives/personal/calculator/
[nlcalcjs]: https://www.gov.nl.ca/fin/wp-content/themes/gnl-web-department/inc/calculator/incomesupplement.js
[cranoreport]: https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/personal-income/amounts-that-taxed.html
[nbact]: https://laws.gnb.ca/en/pdf/cs/N-6.001.pdf
[nbhansard]: https://www.legnb.ca/content/house_business/60/3/hansard/33%202024-03-28bil.pdf
[statcan]: https://www150.statcan.gc.ca/n1/pub/72-212-x/2025001/sect3-eng.htm
[t5007]: https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4115/guide-t5007-return-benefits.html
[nsreg]: https://novascotia.ca/just/regulations/regs/incgis.html
[gisstart]: https://www.canada.ca/en/services/benefits/publicpensions/old-age-security/guaranteed-income-supplement/while-receiving.html
[nsrefund26]: https://news.novascotia.ca/en/2026/08/28/provincial-tax-refunds-low-income-seniors
[bct5007]: https://www2.gov.bc.ca/assets/gov/british-columbians-our-governments/policies-for-government/bc-employment-assistance-policy-procedure-manual/additional-resources/t5007-info.pdf
[onreport]: https://forms.mgcs.gov.on.ca/dataset/4b357ccd-966c-493b-85c3-29ffba9aeb6a/resource/46bcdd8e-53cc-4dce-b685-e7188095e8d0/download/4803-69e.pdf
[cra145]: https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/personal-income/line-145-social-assistance-payments.html

# Manitoba boundary and reporting evidence, phase 2

Issue #21 research, **2026-11-05**; Normal, Codex Sol `gpt-6.1-sol`, `xhigh`.
This supplements and corrects the [phase 1 Manitoba/Quebec appendix](mb-qc.md). No engine, annual data,
tests or golden expectations changed. Sources named `mbqc-phase2-*` include original-document hashes.
This pass uses the approved current-income proxy and existing inputs. Care, survivors and assessed grants
remain outside the initial implementation; this note does not reopen those scope decisions.

## Senior table truncation: resolved by the original amendment

**The both-pensioner schedule extends to $1,823.99, not $1,535.99.**
The original [M.R. 128/2008, PDF page 3][original128] prints six additional rows in section 2(2):

| Combined annual declared income | Quarterly amount **per eligible spouse** |
|---|---:|
| $1,536.00–$1,583.99 | $34.70 |
| $1,584.00–$1,631.99 | $30.40 |
| $1,632.00–$1,679.99 | $26.00 |
| $1,680.00–$1,727.99 | $21.70 |
| $1,728.00–$1,775.99 | $17.30 |
| $1,776.00–$1,823.99 | $13.00 |

These are **published enacted amounts**, not extrapolations from the survivor table. M.R. 128/2008 replaces
section 2 and makes the benefits effective April 1, 2008. The current consolidation's history lists no later
English benefit-amount amendment: M.R. 115/2025 changes the assistance Act's name and French rounding wording.
Both the consolidated HTML and consolidated bilingual PDF omit this tail. Use the original amendment to
reconstruct the complete schedule, and preserve the discrepancy for review. Do not label these dollar amounts
as an inflation estimate. [Original amendment][original128], [current consolidated text][seniorcurrent].

For example, combined declared income $1,560 gives `2 × 4 × $34.70 = $277.60` annual household benefit.
At $1,823.99, the household run rate is `2 × 4 × $13 = $104`. These examples fail if the truncated schedule
is used. They are independent table calculations, not output captured from the engine.

The other terminal positive rows are unchanged in the original amendment:

| Category | Last tested-income band | Quarterly amount | First unlisted income |
|---|---|---:|---:|
| Single senior, section 2(1) | $816–$839.99 | $13.90 | $840 |
| Both pensioners, section 2(2) | $1,776–$1,823.99 | $13 each | $1,824 |
| Spouse neither pensioner nor Allowance recipient, section 2(3) | Adjusted $528–$575.99 | $18.30 | Adjusted $576 |
| Pensioner/Allowance couple, section 2(4) | $3,600–$3,647.99 | $10.70 each | $3,648 |

The original amendment still does not print explicit zero rows. Recommended conservative closure for the
model: **pay zero outside the published positive table's upper domain**. Do not continue the apparent taper,
round a derived payment, or extend any positive amount beyond the last listed band. Mark this out-of-table
rule as an `estimated` interpretation separately from the published rows. All listed boundaries use cents;
avoid arbitrary extra rounding that moves a household between statutory bands. [Full tables][original128].

## Negative adjusted income in section 2(3)

The original and current English texts require subtracting from combined declared income:

```text
offset = 12 × (basic monthly OAS rounded upward to a multiple of $4) + $47.99
adjusted = combinedDeclaredIncome − offset
```

Neither prints an instruction for negative `adjusted` values. A literal lookup with no row would incorrectly
make a zero-private-income mixed-age couple ineligible while a richer couple receives a payment.
Recommended monotone, bounded interpretation: `tested = max(0, adjusted)`, then select the published row.
This gives the **published maximum $161.80 quarterly** when the offset exceeds income. The floor is a derived
rule, not a quoted instruction: mark it `estimated: true` or in a dedicated provisional-rules field, cite
[section 2(3)][original128], and test negative, zero and the first $48 boundary separately.

The [2014 policy manual][manual] says the senior component follows the federal GIS assessment and that senior
GIS/55 PLUS amounts are reassessed each **July** using the preceding tax return (printed page 54/PDF page 61).
This adds nuance to the public April–March benefit-year statement. Under the user's current-income proxy,
evaluate the same current income for the relevant quarters and their basic-OAS offset; do not add historical
income controls or describe these modeled results as exact past cash receipts. The manual is dated 2014;
its lag mechanics are corroboration, not a newly verified 2025/2026 annual payment notice.

## Junior terminal band: verified conflict, explicit modelling choice

The original [M.R. 129/2008][original129] adds the UCCB income exclusion and replaces section 4's tables.
It **does not amend section 2's eligibility caps**. Consequently this is not another missing-tail error:

| Rule | Single | Couple |
|---|---:|---:|
| Current regulation section 2(1) eligibility ceiling | $9,722.40 | $16,207.20 |
| Section 4 last paid band ends | $9,746.40 | $16,255.20 |
| Annual payment in the disputed last band | $55.60 | $52 per eligible adult |
| Active government program page's stated ceiling | $9,746.40 | $16,255.20 |

The [active Manitoba program page][juniorpage] expressly states the higher ceilings, consistent with the
original enacted payment table. Recommended administrative modelling convention: **include that final band
through $9,746.40/$16,255.20, inclusive; pay zero above it**. Label this boundary policy `estimated` because
section 2 conflicts; preserve its lower caps in the verification note. The underlying band amounts are published.
This follows the government's current description of administered coverage; it is not a claim that a legal
amendment repaired section 2. [Original section 4 amendment][original129], [current regulation][juniorcurrent].

The strict section-2 alternative would pay zero throughout the final band, reducing a single's annual amount
by $55.60 and a two-eligible-adult couple's by $104 there. Neither interpretation may be presented as independently
confirmed administrative adjudication. Tests must distinguish $9,722.40, $9,722.41, $9,746.40 and $9,746.41,
and the analogous couple limits. This remaining source conflict must be visible to reviewers.

## Minimal Manitoba refundable personal-credit specification

The required ordinary base and senior additions belong to **MB479**, separate from MB428-A's non-refundable
family tax benefit. The ordinary terms below are the foundation needed for modeled senior claims; expanding
the personal-credit correction to wholly non-senior households requires separate scope allocation.
For an ordinary eligible single or cohabiting-spouse household, without disability/care claims, the
[2025 form][mb479] and [CRA guide][mbguide] reduce to:

```text
adjustedNet[i] = max(0, federalNetIncome23600[i]
                       + UCCBRepayment[i] + RDSPRepayment[i]
                       − UCCBIncome[i] − RDSPIncome[i])
familyIncome = sum(adjustedNet of included adult(s))
base = 195 × includedAdultCount
       + 113 × count(included adults aged 65+ at year end)
       + 195 × eligibleDependantClaimed
       + 26 × otherQualifyingDependentChildren
personalCredit = max(0, base − 0.01 × familyIncome)
```

For a spouse-present ordinary household, `includedAdultCount=2` and `eligibleDependantClaimed=0`.
For a single claimant, use one adult; the eligible-dependant term requires an actual provincial line 58160
claim. Do not count that same child again for $26. The formula must not count an unrelated second adult
as a spouse. Disability, imprisonment, assistance and special residence restrictions remain explicit supported-
case boundaries. [2025 MB479, lines 1–19][mb479].

Important claimant and spouse rules from the [CRA guide][mbguide]:

- Cohabiting spouses claim **one household personal credit**, by agreement. If one claims the other as a
  dependant on MB428 line 58120, that claimant must claim for both.
- A spouse who transfers an age/disability amount cannot separately claim the personal credit; the recipient
  makes the combined claim. This affects the claimant, not a second duplicate household refund.
- **The refundable spouse age term does not require a positive unused-age transfer.** MB479 line 10 asks only
  whether the spouse meets the year-end age condition. Do not copy MB428-A's spouse-age-transfer gate here.
- The general spouse basic credit is $195 when the household has a spouse; it is not itself reduced by the
  spouse's individual income before the shared 1% family-income reduction. The statute's section 5.7(5)
  alternate claim pools both adults' own bases; reading section 5.7(2) alone misses this case.
- The $26 child term follows eligibility for MB428-A's family tax benefit and its unique claimant. Children
  already used for the $195 eligible-dependant term or disabled-dependant term are excluded from $26.

In 2025, the child chart is for children born in 2007 or later, subject to parenthood, Canadian residence and
living with the parent, no special-allowance receipt, and no duplicate claim. The MB428-A child term goes to
the higher-net-income spouse. Reuse that child's existing claimant/eligibility result in the refundable pool;
section 5.7(3) prevents a second competing claimant. For 2026, use the statutory eligibility shape and reconcile
the final form's birth-year wording; do not blindly copy the older chart's year. [Guide][mbguide],
[Income Tax Act, sections 5.7(2)–(5)][mbtax].

For ordinary no-disability cases, independent checks include:

| Household | Family income | Calculation | Refund |
|---|---:|---|---:|
| Single age 65+ | $25,000 | `195 + 113 − 250` | $58 |
| Couple, one age 65+, both eligible | $35,000 | `390 + 113 − 350` | $153 |
| Couple, both age 65+, both eligible | $35,000 | `390 + 226 − 350` | $266 |
| Single senior with one line-58160 eligible dependant and one other qualifying child | $25,000 | `195 + 113 + 195 + 26 − 250` | $279 |

An age-65+ couple with neither spouse transferring an age amount still gets the published age terms.
The ordinary base is necessary to calculate their shared taper correctly; adding only $113 per senior is wrong.

### 2026 filing order remains provisional

The [current statute][mbtax] confirms $195, $113, $26 and the 1% reduction and pooled-spouse formula.
The official CRA package still publishes **2025 MB479**; direct retrieval of
`https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5007-tc/5007-tc-26e.pdf` returned **404** on November 5.
The [2025 form][mb479] calculates the personal credit at line 19, combines it with applicable property/renter
credits at lines 53–55, then applies any EIA/MSPD adjustment at lines 56–57. Retain this verified order with
`provisionalRules: true` for 2026 pending the final form, rather than claiming its 2026 line numbers verified.
With no modeled EIA/MSPD or care inputs, do not manufacture a box-14 adjustment merely because a recipient
has a provincial senior supplement. This is a credit after income tax, with no non-refundable tax-capacity cap.

## Manitoba 55 PLUS reporting and income interactions

CRA's [T5007 recipient instructions][t5007] explicitly cover provincial/territorial supplements in box 11:
the amount enters federal **line 14500** and an equal **line 25000 deduction**. Consequently it remains in
line 23600 net income and is removed before taxable income. This can change age-credit reductions and other
net-income-tested benefits even though the receipt itself is not taxed.

For spouses living together when paid, the higher adjusted-net-income spouse reports all such amounts:

```text
reporterComparison[i] = net23600[i] before these social-assistance receipts
                       + childcareDeduction21400[i] + socialBenefitsRepayment23500[i]
```

This reverses the two deductions solely for choosing the reporter; do not add them to final net income.
At an exact tie, each payment stays with the named recipient. Re-evaluate the comparison after a pension-split
election; never compare gross wages alone. The recipient facts still determine benefit eligibility/payment
even if the tax-reporting spouse differs. [CRA reporter rules][federalsa].

**Program-specific caveat:** the researched Manitoba program pages do not expressly promise a T5007 or identify
a tax-return line for 55 PLUS. The official [2014 policy manual][manual] discusses returns whose only income
is 55 PLUS and excludes the program's own STAT 55+ receipts from its junior assessment income. Treating 55 PLUS
as a box-11 provincial supplement follows its income-tested recurring support character and CRA's named
category, but remains a **derived program classification**, not verified Manitoba slip practice. Record that
assumption, separately from the verified general box-11 reporting rule. Do not describe it as a sourced
statement that Manitoba issues a slip to every recipient.

CRA's [2026 T5007 guide][t5007guide] exempts series totalling $500 or less from issuer slip reporting, along
with specified other categories. That is an information-slip threshold, not a published 55 PLUS benefit cutoff.
Do not set a calculated provincial benefit to zero or silently exclude it from the modeled income measure
just because its annual amount is below $500. The final receipt-classification decision must remain consistent
across federal net income, provincial family-income tests and the non-taxable deduction.

With that classification, include 55 PLUS once in MB479's adjusted family income before calculating its refund.
Exclude it from the 55 PLUS junior program's own tested income per the manual, avoiding a same-year feedback
loop under the approved proxy. The refundable MB personal tax credit itself is a tax credit, not another
line-14500 social-assistance receipt; do not feed it back into net income.

## Quebec reporting distinction relevant to Senior Assistance

The [2025 Quebec guide, pages 26–27 and 42][qcguide] distinguishes:

- Social assistance and similar financial assistance: **line 147**, using RL-5 boxes A/B or the T5007 amount
  when no RL-5 exists. It remains in Quebec net income; line 295 is not a general deduction for line 147.
- GIS/Allowance and other net federal supplements: **line 148, code 07**, using T4A(OAS), with the corresponding
  **line 295 deduction after line 275**. Thus the benefit remains in the Senior Assistance income test while
  being excluded from Quebec taxable income. Adjust the deduction for a supplement repayment as directed.
- Other T5007 amounts require their own category: for example, means-tested charity assistance is line 148
  code 04, and specified workers' compensation/indemnities also belong to line 148. A T5007 alone does not
  justify treating every receipt as taxable Quebec social assistance.

Quebec's Senior Assistance amount is an annual **refundable credit on line 463**, not a T5007 cash program.
Do not generate Quebec line 147/148 income from that credit or include it in its own line-275 family-income
test. No new Quebec provincial social-assistance receipt is generated by the initial #21 scope.
The existing [2025][qcsa25] and [2026 prescribed assistance forms][qcsa26] directly verify their respective
line-275 household tests and credit formulas; only other uncollected 2026 return mechanics need a provisional
carry-forward label.

[original128]: sources/mbqc-phase2-senior-original-128-2008.txt
[original129]: sources/mbqc-phase2-junior-original-129-2008.txt
[manual]: sources/mbqc-phase2-policy-manual-2014.txt
[juniorpage]: sources/mbqc-phase2-junior-current-overview.txt
[seniorcurrent]: sources/mbqc-mb-senior-regulation.txt
[juniorcurrent]: sources/mbqc-mb-junior-regulation.txt
[mb479]: sources/mbqc-mb-479-2025.txt
[mbguide]: sources/mbqc-phase2-mb-guide-2025.txt
[mbtax]: sources/mbqc-mb-tax-act-2026.txt
[t5007]: sources/mbqc-phase2-t5007-recipient.txt
[federalsa]: sources/mbqc-phase2-federal-social-assistance.txt
[t5007guide]: sources/mbqc-phase2-t5007-guide-2026.txt
[qcguide]: sources/mbqc-phase2-qc-reporting-guide-2025.txt
[qcsa25]: sources/mbqc-qc-assistance-form-2025.txt
[qcsa26]: sources/mbqc-qc-assistance-form-2026.txt

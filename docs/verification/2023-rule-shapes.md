# 2023 rule prerequisites

Refs #24. This branch builds on the 2024 historical rules in #104. It adds three formulas needed for the
2023 data collection; it does not change year parameters or capture golden results.

## Prince Edward Island surtax order

[PE428 (2023)](https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5002-c/5002-c-23e.pdf), page 3,
deducts the dividend tax credit on lines 60–63 before applying the surtax on lines 65–67. The surtax is
10% of the remaining provincial tax above $12,500. The low-income reduction follows it.

The new optional province field is:

```yaml
postDividendSurtax:
  program: pei-surtax
  params: {threshold: 12500, rate: 0.1}
```

Ontario continues to use the existing `surtax` schedule, applied before dividend credits. Both formulas
contribute to the existing result's `surtax` field and household breakdown. No year checks enter the engine.
Tests use synthetic bracket and dividend rates to distinguish eligible and non-eligible dividend ordering,
the threshold, the nonrefundable floor, and the subsequent low-income reduction. The form is cached in
`2023/sources/rule-pe428.txt`.

## Newfoundland and Labrador benefit periods

The model uses July 2023–June 2024 for recurring benefits. Within that period, the province changed child
benefit amounts and reduction rates effective January 1, 2024. The earlier reduction schedule comes from
[NLR 60/11](https://www.assembly.nl.ca/Legislation/sr/Annualregs/2011/nr110060.htm); the later schedule and
commencement date come from [NLR 9/24](https://www.gov.nl.ca/dgsnl/files/NLG20240216.pdf), pages 12–13.
The province's [poverty reduction plan](https://www.gov.nl.ca/cssd/files/Poverty-Reduction-Plan-Background-Information.pdf),
page 8, confirms the original and increased annual amounts without monthly rounding.

The new child-benefit program is `nl-child-benefit-periods`. Its `params.periods` entries each contain:

- `weight`: the share of the benefit year; weights must be positive and sum to one.
- `perChild`: four annual amounts; the fourth repeats for additional children.
- `threshold`: the income above which the reduction begins.
- `rate`: the reduction rates for one, two and three children.
- `additionalRate`: the additional reduction rate per child after the third.

For 2023, both weights are 0.5. The first period's annual amounts are `[447, 474, 509, 547]`, threshold
17,397, rates `[0.0507, 0.1045, 0.1622]`, and additional rate 0.0619. The second period's annual amounts
are `[1788, 1896, 2036, 2188]`, the same threshold, rates `[0.161, 0.3318, 0.5151]`, and additional rate
0.1971. Calculate and floor each annual entitlement separately, then multiply by its weight and sum.

Averaging the parameters before applying a single floor would be wrong: at $27,000 income with one child,
the earlier entitlement is zero while the later annual entitlement is $241.917. The benefit-year total is
$120.9585. Tests cover this case, both periods paying, additional children, zero children, full exhaustion,
and invalid weights. Sources are cached under `2023/sources/rule-nl-*`.

## Northwest Territories age groups

The [NWT child benefit fact sheet](https://www.fin.gov.nt.ca/sites/fin/files/benefits_and_support-nwt_child_benefit-180320.pdf),
page 2, specifies `NWTCB = C + D`, with a separate child count for each age group. The official
[Income Tax Regulations](https://www.justice.gov.nt.ca/en/files/legislation/income-tax/income-tax.r1.pdf),
section 1.1(1)(b),(c), confirm this interpretation; the English provision cites R-057-2017, section 2.
The formula uses the number under six for C and the number aged six to seventeen for D, then reduces
their sum linearly between $30,000 and $80,000 family net income. This taper is published, not estimated.

The new program `nwt-child-benefit-age-groups` retains the original parameter names: `under6`,
`under6More`, `over6`, `over6More`, `fullUpTo`, and `endsAt`. Arrays contain cumulative amounts for zero
through four children in that age group; each further child adds that group's `More` amount. Published
annual arrays are `[0, 815, 1467, 1997, 2445]` and `[0, 652, 1174, 1597, 1956]`, with extras 367 and 293.

At $55,000 income, two young children and one older child receive `(1467 + 652) / 2 = $1,059.50`.
Blending the three-child totals by age shares instead gives $931.8333 and is incorrect for mixed ages.
Tests cover this distinction, both groups exceeding four children, homogeneous ages, both thresholds,
and the zero floor. The existing program remains available to preserve locked 2025 and 2026 results;
correcting those years requires a separate intended data and golden change.

The fact sheet is cached in `2023/sources/rule-nwt-benefit.txt`. The regulations were inspected through
the web reader; direct `fetch-source` downloads returned an HTML error page, so no regulations extract
is represented as cached. The cached fact sheet independently gives the complete calculation.

## Integration responsibilities

- The year collector owns 2023 YAML, published reference tests and golden capture.
- The integration invariant's top ordinary-income rate must include `postDividendSurtax.params.rate`.
- UI tax details currently label every surtax as Ontario's; the UI owner must use a province-appropriate
  label and describe the historical PEI surtax in the notes.
- Notes must handle the new NL periods program, zero second-additional CPP/QPP rates, and absent PEI child
  benefit. PEI's child benefit starts in January 2025, outside this benefit year.
- NWT notes must recognize the new age-group program and its published taper without an estimate caveat.
- Manitoba's 2023 school-tax relief fits the historical credit program from #104. Alberta's statutory
  child-count reduction program also applies. Nova Scotia's child benefit keeps its existing shape.
- Existing 2025 and 2026 results remain unchanged. CPP2/QPP2 absence is represented by zero `enh2` and
  equal `yampe` and `ympe`; no new payroll formula is needed.

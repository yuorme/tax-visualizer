# Independent carbon history references

`tests/golden/features/carbon-history.json` contains independently calculated expectations for the activated
historical data. These supplement the isolated formula cases in `features/carbon.json`; they are not engine captures.

## Calendar cash receipts

The federal amounts come from the official Finance Canada annual CAI announcements for 2019–2021 and CRA's
quarterly CAIP/CCR tables for 2022–2025. The cached evidence is in the relevant year's `sources/carbon-federal-*`.
The household is two adults and two children, at income zero, using reference-city amounts. PEI includes its
universal rural supplement; other provinces use urban amounts. Each payment is the
adult amount plus the spouse amount plus twice the child amount. Calendar cash includes the following payments:

- 2019–2021: the annual amount claimed on the preceding year's tax return.
- 2022: the doubled July payment plus October, three quarterly amounts in total.
- 2023–2024: January at the preceding cycle's amount, then April, July and October at the new cycle's amount.
  The Atlantic provinces start in July 2023; New Brunswick's first two installments were paid together in October.
- 2025: January at the old amount and the final April payment at the new amount.

For example, Alberta's family-of-four quarter is $386 in the April 2023 cycle and $269.75 in January 2023.
That calendar year's sum is $269.75 + 3 × $386 = $1,427.75.

BC uses its published climate action tax credit amounts and the temporary statutory enhancements. The cached
`carbon-bc-rebates.txt` and `carbon-bc-rebate-law.txt` preserve both the ordinary and enhanced amounts. Each
quarter uses that payment's annual entitlement divided by four, without prematurely rounding half cents.
The family-of-four annual cash sums are $375, $876.50, $450, $885, $1,516.75, $950.75 and $504 for 2019–2025.
The July 2020 enhancement contributes $564; the October 2022, January 2023 and April 2023 enhancements each
contribute $535. These temporary payments belong to the named climate action tax credit.

For BC in 2025, a family of four receives two payments of $252 before the income test. At income $100,000,
each payment is $252 − 0.005 × ($100,000 − $57,288) = $38.44, totaling $76.88. At $107,688 it is zero.
A single parent with two children has the same maximum as a couple with one child: $220.50 per payment.
At $100,000 each receives $6.94 per payment, totaling $13.88.

## Regional cash references

The [regional evidence](carbon-regions.md) provides independently sourced annual cash components. For two adults
and two children, multiplying Yukon's per-person amounts by four gives $172, $556, $736, $992, $1,384, $1,364
and $620 for 2019–2025. The NWT family totals are twice the adult plus twice the child calendar components:
$224, $560, $784, $1,008, $1,494, $1,880 and $946. Nunavut's published schedule gives zero through 2022, then
$616, $816 and $200. Its 2024/2025 single-person amounts assume the published quarterly schedule; discretionary
small-payment consolidation was not established and is explicitly marked as estimated in data.

NWT's childless-single exception instead gives $52 + $156 = $208 in 2020 and two $52 payments = $104 in 2021.
Alberta's 2019 provincial family-four entitlement is $300 + $150 + 2 × $45 = $540. Two quarter payments give
$270; a single receives $150, a couple $225, and a single parent with two children $247.50. At family income
$106,000 the annual entitlement is $540 − .04 × ($106,000 − $95,000) = $100, giving $50 calendar cash.
One cent more income makes annual entitlement less than the statutory $100 cutoff, giving no payment.

PEI's carbon-only July 2022 increment is tested against its published examples: $140 at single income $45,000,
$115 at $55,000, and $65 for a couple at $63,000. It is the enhanced statutory sales-credit calculation minus
the ordinary credit, each floored separately. Ordinary sales-credit and extraordinary inflation amounts are
excluded from this increment, preventing double counting. See `regional-carbon-rules.md` for all boundary math.

## Direct costs

At 10,000 km and 10 L/100 km, gasoline use is 1,000 litres. The 2025 rate of $0.1761 applies for January–March,
90 of 365 days, before the April 1 repeal. The independently calculated charge is
1,000 × 0.1761 × 90 / 365 = $43.4219178082. This applies to the selected AB, BC, SK and NL fixtures.

The household heating estimates follow [the heating derivation](carbon-heating.md), with sourced 2021
quantities held fixed across years and calendar-day weighting of rates. Alberta's average household gas use is
98.4907945935 GJ × 26.853 cubic metres/GJ. Applying $0.1525/m³ for 90/365 of 2025 gives $99.45 after rounding.
BC uses its published $/GJ gas rate and its own heating-oil carbon rate, yielding $48.00. Saskatchewan's
residential gas exemption and the federal heating-oil exemption leave SK and NL at zero. Zero driving or zero
fuel use removes gasoline cost while preserving the independent heating estimate.

Quebec's cap-and-trade costs are outside this direct-charge model. Consumer carbon charges and payments are
absent in 2026. Both exclusions are tested independently of the positive-cost cases.

Historical schedule checks use 1,000 litres as well: Alberta 2019 charges $0.0673 for 149 days through May 29;
PEI 2022 charges $0.0663 for 128 days and $0.1105 for 237 days following its May 9 increase. In 2023, the first
90 days use $0.1105 in Yukon, $0.117 in NWT and $0.05525 in Nunavut; the remaining 275 days use $0.1431.
NWT 2024 uses $0.1431 for 91 days and $0.1761 for 275 days in a 366-day year. Heating checks independently
lock the proxy-based amounts in the heating derivation, including NWT's April 2024 diesel-rebate restoration.

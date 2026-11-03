# Historical household heating carbon estimates

## Consumption baseline

The estimate holds 2021 residential natural-gas and heating-oil consumption constant across historical years.
Statistics Canada's table 25-10-0060-01 provides total gigajoules and household counts. Divide fuel consumption
by **all households**, including households using electric heat. The published gigajoules-per-fuel-user column
would overstate the province-wide household average and is not used.

The selected original CSV rows, suppression flags and ZIP hash are cached in
`2025/sources/carbon-household-energy-csv.txt`. This is an explicit modeled average, not a measured heating bill
for the selected household. It includes residential gas/oil energy use, including water heating and cooking;
it excludes electricity, wood and unreported fuels. It does not vary with family size, tenure or home value.

| Province | All households | Natural gas GJ/household | Heating oil GJ/household |
|---|---:|---:|---:|
| NL | 223,250 | 0.0000 | 14.2665 |
| PE | 64,565 | 0.0000 | 35.2661 |
| NS | 428,225 | 3.9143 | 26.1393 |
| NB | 337,650 | 3.1727 | 5.0966 |
| ON | 5,491,210 | 58.2901 | 1.0275 |
| MB | 518,050 | 49.2892 | 0.0000 |
| SK | 449,575 | 76.0915 | 0.0000 |
| AB | 1,633,225 | 98.4908 | 0.0000 |
| BC | 2,041,830 | 48.5060 | 0.2385 |

These displayed quantities are rounded; calculations retain the original totals divided by household counts.
Where one fuel total is suppressed, its modeled quantity is the nonnegative residual of total energy minus
electricity and the other published fuel. That is a derivation, not a recovered confidential observation.
In particular, zero residuals are estimates, not published zero fuel consumption. Alberta's one-GJ aggregate
rounding residual has no material effect. New Brunswick oil is marked E (use with caution) in the source.
Quebec's consumption is available but its cap-and-trade costs are excluded from this feature.

## Charges

For federal natural-gas charges, convert gigajoules to cubic metres using NRCan's approximate factor
26.853 m³/GJ. For oil, use NRCan's approximation of 27 litres/GJ. Both are in
`2025/sources/carbon-energy-conversion.txt`. BC publishes natural-gas charges directly in dollars per GJ,
so its published GJ rate is used instead. Historical rate tables and BC's 2018 budget assumptions are cached.

For each calendar day, multiply the fixed fuel quantity by that day's applicable rate; sum and divide by the
number of days in the year. This assumes consumption is even through the year. Seasonal heating patterns,
weather, equipment changes and individual bills are not reconstructed. Round the final annual estimate to cents.
The data's `estimated: true` and `method` field identify these assumptions.

Federal heating-oil charges stop November 9, 2023. Saskatchewan residential natural-gas charges are zero from
January 1, 2024, reflecting the household charge actually collected. BC continues its own heating-oil charge
until April 1, 2025. Sources: `carbon-heating-oil-relief.txt`, `carbon-sk-heating-relief.txt`, and
`carbon-bc-2024-rates.txt` in the 2025 source cache.

Example: Alberta's 2023 gas quantity is 160,857,628 GJ / 1,633,225 households. The calendar-weighted rate is
(90 × $0.0979 + 275 × $0.1239) / 365 per m³. Multiply by 26.853 m³/GJ and the household quantity to get
$310.73 after rounding. In 2025 only 90 days at $0.1525/m³ apply, giving $99.45.

## Territorial proxies and earlier provincial systems

Territorial survey quantities comparable to the provincial series were not available. The Yukon estimate uses
1,750 litres of oil a year: the midpoint of the 1,500–2,000 L illustrative oil-heated-home range in the official
2017 advisory report. This represents an oil-heated home, not a population average that includes electric heat.
NWT uses 2,406 L/year from a 2012 Deline feasibility study's residential-building assumption. Nunavut explicitly
borrows that same northern oil proxy; it is not a Nunavut measurement. These proxies stay fixed across years,
exclude other fuels, and are identified in every affected YAML `method` field.

NWT's heating-diesel charge is fully rebated through March 2023 and again from April 2024. Nunavut's fuel
discount halves the heating-oil charge through March 2023; the full charge then applies until the federal
November 9 exemption. Yukon also follows the federal heating-oil exemption. The resulting annual oil estimates:

| Year | Yukon | NWT | Nunavut |
|---|---:|---:|---:|
| 2019 | 47.37 | 0.00 | 32.57 |
| 2020 | 129.21 | 0.00 | 88.83 |
| 2021 | 176.21 | 0.00 | 121.13 |
| 2022 | 223.11 | 0.00 | 153.37 |
| 2023 | 242.85 | 315.05 | 294.11 |
| 2024 | 0.00 | 103.97 | 0.00 |
| 2025 | 0.00 | 0.00 | 0.00 |

Alberta's provincial 2019 levy was $1.517/GJ natural gas and $0.0803/L oil through May 29, then zero for the
rest of the year. Applied to the same provincial consumption baseline, the estimate is $60.99. New Brunswick
charged natural gas throughout its April 2020–June 2023 provincial system, but exempted domestic heating oil.
The resulting NB estimates are $6.42, $6.26, $7.93 and $18.04 for 2020–2023. PEI and Newfoundland and Labrador
exempted residential heating fuels under their provincial systems before the federal July 2023 transition.

Exact schedules, source links and cache paths are in [regional evidence](carbon-regions.md) and
`carbon-regional-records.json`. Those records include day-weighted effective oil rates and the proxy quantities.

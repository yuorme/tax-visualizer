# Historical comparison verification

The source series is Statistics Canada table 18-10-0005-01, Canada all-items annual average CPI,
vector v41693271 (2002 = 100). The downloaded observations are cached in
`2025/sources/cpi-canada-all-items.txt`. Annual 2026 CPI is unavailable; real comparisons explicitly use
2025 dollars and omit years without observations. Nominal comparisons include every installed tax year.

## Independent feature golden

`tests/golden/features/history.json` tests a deliberately synthetic progressive tax system, not Canadian
historical tax amounts. Federal rates are 10% through $50,000 and 20% above; provincial income tax is zero.
Credits and benefits are disabled. Foreign dividends have no payroll and withholding is zero.
The household has $100,000 income, $1,000 monthly taxable spending and a $200,000 home.
Sales tax is 5% and property tax is 1%. CPI is 50 for the old year and 100 for the base year.

- Nominal income tax: $50,000 × 10% + $50,000 × 20% = $15,000.
  Sales tax is $600 and property tax $2,000: total $17,600, effective rate 17.6%.
- Real old-year inputs are halved: income tax $5,000, sales tax $300 and property tax $1,000.
  Divide their $6,300 sum by 0.5 to show $12,600 in base-year dollars, effective rate 12.6%.
- The base year has factor 1 and matches nominal results exactly. A year without CPI is omitted only in real mode.

These expected values were calculated directly above, not captured from engine output. Targeted tests separately
cover negative investment income, each deduction category, childcare expenses and claims, missing eligible earnings,
fixed household composition, fixed driving, and input immutability. Existing golden fixtures remain unchanged.

## Claims through fixed annual limits

`tests/golden/features/history-claims.json` adds final-tax cases using the same synthetic progressive brackets.
Payroll, employment credits and child benefits are zeroed to isolate deductions; income is $100,000 employment
income. Sales and property tax still total $2,600 in base-year dollars. Federal childcare retains its sourced
2025 $8,000 young-child limit and two-thirds earned-income limit. Those rule limits never scale with CPI.

| Case | Nominal claim | Old-year claim | Nominal total tax | Old-year tax in base dollars |
| --- | ---: | ---: | ---: | ---: |
| Other $3,000 + RRSP $5,000 + FHSA $12,000 | $20,000 | $10,000 | $13,600 | $10,600 |
| Automatic expenses $15,998, earned $30,000 | $8,000 | $7,999 | $16,000 | $11,000.20 |
| Automatic expenses $16,000, earned $30,000 | $8,000 | $8,000 | $16,000 | $11,000 |
| Automatic expenses $16,002, earned $30,000 | $8,000 | $8,000 | $16,000 | $11,000 |
| Automatic expenses $10,000, earned $9,000 | $6,000 | $3,000 | $16,400 | $12,000 |
| Verified manual claim $10,000, expenses $12,000 | $10,000 | $5,000 | $15,600 | $11,600 |

For example, the automatic cap case has nominal taxable income $92,000, so income tax is
$5,000 + $42,000 × 20% = $13,400; adding $2,600 gives $16,000. Its old-year income is $50,000,
but its cap remains $8,000: $42,000 × 10% ÷ 0.5 + $2,600 = $11,000. At $15,998 expenses,
the old-year claim is $7,999, raising base-dollar tax by $0.20. Manual claims deliberately override ordinary caps.

## Display checks

Browser tests compare table values with the engine, exercise real and nominal modes, change income and province,
reload saved settings and return to the provincial view at 375 px, 430 px and desktop widths in light and dark mode.
History holds household composition and monetary purchasing power fixed; it does not age the household or estimate
historical house-price appreciation. Coverage is limited to programs represented in each installed year's data.

## Carbon integration

`features/history-carbon.json` isolates a zero-income-tax system with 1,000 litres of gasoline at $0.10/L,
a fixed $50 heating estimate and a $20 calendar rebate. Nominal net tax is $100 + $50 − $20 = $130 in each
year. With synthetic CPI 50 in the older year and 100 in the base year, real-dollar tax is $260 and $130.
Driving quantities and nominal program amounts stay fixed; only the resulting monetary total is converted.
Disabling credits gives $150 nominal and $300/$150 real. Zero driving gives $30 nominal and $60/$30 real.

Existing synthetic income-tax specimens explicitly retain their original no-carbon data after real 2025 data
gains carbon programs. Their household inputs, expected values, assertions and tolerances remain unchanged.

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

## Display checks

Browser tests compare table values with the engine, exercise real and nominal modes, change income and province,
reload saved settings and return to the provincial view at 375 px, 430 px and desktop widths in light and dark mode.
History holds household composition and monetary purchasing power fixed; it does not age the household or estimate
historical house-price appreciation. Coverage is limited to programs represented in each installed year's data.

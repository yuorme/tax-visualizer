# 2026 source extracts

Text extracts of official publications used for the 2026 data, made with
`npm run fetch-source -- <year> <url> [<name>]`. A data collector and the reviewer read the same text, and a
reviewer can check figures without opening PDFs. Each `.txt` file starts with the URL, the date fetched and the
SHA-256 of the original file. For a PDF or text file, download it again and compare the hash to confirm it
hasn't changed. Web pages embed per-request tracking code, so their hash differs on every fetch: refetch with
`--force` and compare the text with `git diff` instead.

The originals aren't kept in the repo, only the text, up to 250 KB per extract (for a larger PDF, `--pages`
keeps the pages the data uses). Nothing under `docs/` is imported by `src/`, so the build never bundles these.

| Name | Title | URL | Fetched | SHA-256 of the original |
|---|---|---|---|---|
| [alberta-historical-fuel-tax-rates](alberta-historical-fuel-tax-rates.txt) | Historical fuel tax rates | https://open.alberta.ca/dataset/7769b631-d034-4690-9b3c-f9b1b00e2dfb/resource/30ef4caa-9321-4085-9a0e-0a606c2dacd2/download/tbf-tra-historical-fuel-tax-rates.pdf | 2026-11-01 | `7d31265ba45e4a7a205dcecb8b1f55d503ab74306a0ea0f8a1725735fe70b902` |
| [alberta-tax-levy-rates](alberta-tax-levy-rates.txt) | Tax, levy, and prescribed interest rates | https://www.alberta.ca/about-tax-levy-rates-prescribed-interest-rates | 2026-11-01 | `06013b25c96e10e9d6d99b071496f816be62b6c987b3531e4bc6bc3fc842377e` |
| [artm-budget-2026](artm-budget-2026.txt) | ARTM, Budget 2026 (Optimiser le potentiel) | https://www.artm.quebec/wp-content/uploads/2025/12/RP_Budget_2026.pdf | 2026-11-01 | `d09be0eacb7f4f559fe7ec0a8b9e6179479b64d5f01134f6ba83d3ca5d03a985` |
| [bc-motor-fuel-tax-rates](bc-motor-fuel-tax-rates.txt) | Motor fuel tax and carbon tax rates on fuels and substances | https://www2.gov.bc.ca/gov/content/taxes/sales-taxes/motor-fuel-carbon-tax/publications/motor-fuel-tax-and-carbon-tax-rates | 2026-11-01 | `329398085f3611552cb2dad98425c09991d964b99c41118e778ea8fa42e6d285` |
| [childcare-folio](childcare-folio.txt) | Income Tax Folio S1-F3-C1, Child Care Expense Deduction | https://www.canada.ca/en/revenue-agency/services/tax/technical-information/income-tax/income-tax-folios-index/series-1-individuals/folio-3-family-unit-issues/income-tax-folio-s1-f3-c1-child-care-expense-deduction.html | 2026-11-02 | `9fbd341117c80798b798ac3c67d9cd067a01aaa3a4985ad83f9f0dbd0c20021c` |
| [finance-fuel-excise-extension](finance-fuel-excise-extension.txt) | The Government of Canada extends the federal fuel excise tax relief on gasoline, diesel, and aviation fuels for Canadians | https://www.canada.ca/en/department-finance/news/2026/09/the-government-of-canada-extends-the-federal-fuel-excise-tax-relief-on-gasoline-diesel-and-aviation-fuels-for-canadians.html | 2026-11-01 | `b3b739726fe4c50dd2eadd8f6d7c203b5a8d1742ee18cf6010e683acb2c0f962` |
| [finance-fuel-excise-suspension](finance-fuel-excise-suspension.txt) | Temporarily suspending the federal fuel excise tax | https://www.canada.ca/en/department-finance/news/2026/04/temporarily-suspending-the-federal-fuel-excise-tax.html | 2026-11-01 | `27552fa41e842f99dfc297cd0e224b184856f66f7fe0af091e06a02df8806d4a` |
| [irac-pei-provincial-gas-tax-removal](irac-pei-provincial-gas-tax-removal.txt) | Island Regulatory and Appeals Commission, Temporary Suspension of Provincial Tax on Gasoline and Diesel (September 25, 2026) | https://irac.pe.ca/wp-content/uploads/Notice-Removal-of-Provincial-Tax-September-25-2026.pdf | 2026-11-01 | `6453683c6ee886441162d078079059c87b6ae70e85446b13e1108c407183cce0` |
| [nl-gas-tax-permanent-reduction](nl-gas-tax-permanent-reduction.txt) | Government of Newfoundland and Labrador, Permanent Reduction of Gas Tax (March 10, 2026) | https://www.gov.nl.ca/releases/2026/fin/0310n04/ | 2026-11-01 | `e72fe9b0f78a3fe7f5bf086c8590a2d0a9c5948372d6e741333b1bca9d052790` |
| [nl-gas-tax-zero-december](nl-gas-tax-zero-december.txt) | Government of Newfoundland and Labrador, Gas Tax on Gasoline and Diesel to Zero Beginning December 1 (October 26, 2026) | https://www.gov.nl.ca/releases/2026/fin/1026n03/ | 2026-11-01 | `52d116ced52fab525eca6faef4533a5ccc03638bd79235306bb8eb93c2196854` |
| [nrcan-fuel-consumption-levies](nrcan-fuel-consumption-levies.txt) | Fuel Consumption Levies in Canada | https://natural-resources.canada.ca/domestic-international-markets/fuel-consumption-levies-canada | 2026-11-01 | `ce130e22f1f21abb166a5847a9b8936a47123395f994209b3dbfcea1dacfa46e` |
| [nrcan-passenger-transportation-variables](nrcan-passenger-transportation-variables.txt) | Natural Resources Canada, Energy Use Data Handbook: Passenger Transportation Explanatory Variables | https://oee.nrcan.gc.ca/corporate/statistics/neud/dpa/showTable.cfm?type=HB&sector=tran&juris=00&rn=7&page=0 | 2026-11-01 | `dff6b54e5cc7bf7c27a7208d3a670dd7a77e632f509c74e670e4d2a1610ee866` |
| [quebec-family-income](quebec-family-income.txt) | Québec income tax return | https://www.retraitequebec.gouv.qc.ca/en/citizens/children/family-allowance/quebec-income-tax-return | 2026-11-02 | `4f66338347df09c1a21cf963380ea6821122ee0bdbd2e196e1964c16c2457b92` |
| [statcan-cvs-2009](statcan-cvs-2009.txt) | Statistics Canada, Canadian Vehicle Survey: Annual 2009 (53-223-X) | https://www150.statcan.gc.ca/n1/pub/53-223-x/53-223-x2009000-eng.pdf | 2026-11-01 | `e9d00453b048eaf18433641fb96920eaf952bb4186566f1d110bab67926df56c` |

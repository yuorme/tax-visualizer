# 2022 source extracts

Text extracts of official publications used for the 2022 data, made with
`npm run fetch-source -- <year> <url> [<name>]`. A data collector and the reviewer read the same text, and a
reviewer can check figures without opening PDFs. Each `.txt` file starts with the URL, the date fetched and the
SHA-256 of the original file. For a PDF or text file, download it again and compare the hash to confirm it
hasn't changed. Web pages embed per-request tracking code, so their hash differs on every fetch: refetch with
`--force` and compare the text with `git diff` instead.

The originals aren't kept in the repo, only the text, up to 250 KB per extract (for a larger PDF, `--pages`
keeps the pages the data uses). Nothing under `docs/` is imported by `src/`, so the build never bundles these.

| Name | Title | URL | Fetched | SHA-256 of the original |
|---|---|---|---|---|

Regional carbon notes marked "manual" paraphrase official sources whose direct downloads were blocked or incomplete.
Their headers disclose retrieval limits; a navigation-shell hash is not a hash of the underlying publication.

| Regional carbon cache | Title | URL | Read/fetched | Original hash |
|---|---|---|---|---|
| [carbon-regional-nb-rates](carbon-regional-nb-rates.txt) | (Over) (Verso) | https://www2.gnb.ca/content/dam/gnb/Departments/fin/pdf/Taxes-Impots/ftn-0411-carbon-emitting-product-tax-taxe-sur-ses-produits-emetteurs-de-carbone.pdf | 2026-11-02 | 170ac62a32afebc625defb2dc687648be3ae8b068a38372b24d68dea59b7c104 |
| [carbon-regional-nu-rebate-extension](carbon-regional-nu-rebate-extension.txt) | Nunavut fuel prices April1,2022 | https://www.gov.nu.ca/en/newsroom/fuel-price-increase-effective-april-1-2022-2022-04-01 | 2026-11-02 | manual; unavailable |
| [carbon-regional-pe-rates](carbon-regional-pe-rates.txt) | 2022_CL_Rates_Table_with_differential.xlsx | https://www.princeedwardisland.ca/sites/default/files/publications/schedule_of_levy_rates_on_fossil_fuels.pdf | 2026-11-02 | 7de77d60c4ae4e4fdebeb3140428d494682271aa9ab6345bbbffebd6f09c64ba |
| [carbon-regional-pe-rebate](carbon-regional-pe-rebate.txt) | PEI July4,2022 carbon and inflation payment examples — manual facts | https://www.princeedwardisland.ca/en/news/islanders-to-receive-inflationary-support-payment-this-week | 2026-11-02 | manual; unavailable |
| [carbon-regional-pe-regular-formula](carbon-regional-pe-regular-formula.txt) | Income Tax Act | https://www.princeedwardisland.ca/sites/default/files/legislation/i-01-income_tax_act.pdf | 2026-11-02 | 4b50ee73ca3e3d968b2db5e2806752b8a18c33775478f5e222e364ea0b089ede |
| [carbon-regional-pe-statute](carbon-regional-pe-statute.txt) | An Act to Amend the Income Tax Act (No. 3) | https://docs.assembly.pe.ca/download/dms?fileName=bill-64.pdf&objectId=1d0b3ad4-988c-4eab-a8a2-7afea3a08bc5 | 2026-11-02 | eb272e913474c62eff1856c855e729b1a195526177aa707738983aa8fbc90840 |

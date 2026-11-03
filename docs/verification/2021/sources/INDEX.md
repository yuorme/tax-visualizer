# 2021 source extracts

Text extracts of official publications used for the 2021 data, made with
`npm run fetch-source -- <year> <url> [<name>]`. A data collector and the reviewer read the same text, and a
reviewer can check figures without opening PDFs. Each `.txt` file starts with the URL, the date fetched and the
SHA-256 of the original file. For a PDF or text file, download it again and compare the hash to confirm it
hasn't changed. Web pages embed per-request tracking code, so their hash differs on every fetch: refetch with
`--force` and compare the text with `git diff` instead.

The originals aren't kept in the repo, only the text, up to 250 KB per extract (for a larger PDF, `--pages`
keeps the pages the data uses). Nothing under `docs/` is imported by `src/`, so the build never bundles these.

| Name | Title | URL | Fetched | SHA-256 of the original |
|---|---|---|---|---|
| [rule-carbon-nt-annual](rule-carbon-nt-annual.txt) | NWT CARBON TAX REPORT | https://www.fin.gov.nt.ca/sites/fin/files/final_2023-2024_nwt_carbon_tax_report.pdf | 2026-11-02 | `d1f1b6930c7448e914e06cfd3f4cf092144f3af5fef094b3aa724e61af6a8aa2` |

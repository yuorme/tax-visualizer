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
| [rule-carbon-pe-amendment](rule-carbon-pe-amendment.txt) | An Act to Amend the Income Tax Act (No. 3) | https://docs.assembly.pe.ca/download/dms?fileName=bill-64.pdf&objectId=1d0b3ad4-988c-4eab-a8a2-7afea3a08bc5 | 2026-11-02 | `eb272e913474c62eff1856c855e729b1a195526177aa707738983aa8fbc90840` |
| [rule-carbon-pe-examples](rule-carbon-pe-examples.txt) | PEI July 2022 carbon rebate: official examples, manual web extract | https://www.princeedwardisland.ca/en/news/islanders-to-receive-inflationary-support-payment-this-week | 2026-11-02 | unavailable; direct fetch returned a browser challenge |
| [rule-carbon-pe-regular](rule-carbon-pe-regular.txt) | Income Tax Act | https://www.princeedwardisland.ca/sites/default/files/legislation/i-01-income_tax_act.pdf | 2026-11-02 | `4b50ee73ca3e3d968b2db5e2806752b8a18c33775478f5e222e364ea0b089ede` |

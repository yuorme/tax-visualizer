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
| [rule-mb-school-rebate](rule-mb-school-rebate.txt) | Manitoba education property tax rebate historical rates | https://www.gov.mb.ca/edupropertytax/index.html | 2026-11-02 | `b1d2afc37efe276df57ab0a67770663ba46f8ede8fd96903772115c97d495dae` |
| [rule-mb479](rule-mb479.txt) | MB479 2021: rental occupancy cost and education property tax credit | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5007-tc/5007-tc-21e.pdf | 2026-11-02 | `d40bb1c363dc74c2067f168467cacab43de3bbc5c2dfbf1418346ec90ad9188f` |
| [rule-ns-child](rule-ns-child.txt) | Nova Scotia Regulation92/2020: ordered child benefit amounts | https://novascotia.ca/just/regulations/RG2/2020/RG2-2020-07-17.pdf | 2026-11-02 | `5ea3688ead53e692ddeb589f6722cf4b687f3b6b04787625bb8985177c5e1273` |
| [rule-ns-child-eligibility](rule-ns-child-eligibility.txt) | Nova Scotia child benefit eligibility and amendment history | https://novascotia.ca/just/regulations/regs/incchild.htm | 2026-11-02 | `7f004a4c40caa7308942d0210317422f2eb4ed4324cabad05bbb96158dc3eb9f` |
| [rule-t4114](rule-t4114.txt) | CRA T4114 2021: Nova Scotia benefit income range | https://publications.gc.ca/collections/collection_2021/arc-cra/Rv1-36-2021-eng.pdf?download=1 | 2026-11-02 | `32eda512abc7d6f7fba6c2dc9bb0c4489f9654ad46ca36c3083cdf2a1ce205ad` |

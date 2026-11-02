# 2024 source extracts

Text extracts of official publications used for the 2024 data, made with
`npm run fetch-source -- <year> <url> [<name>]`. A data collector and the reviewer read the same text, and a
reviewer can check figures without opening PDFs. Each `.txt` file starts with the URL, the date fetched and the
SHA-256 of the original file. For a PDF or text file, download it again and compare the hash to confirm it
hasn't changed. Web pages embed per-request tracking code, so their hash differs on every fetch: refetch with
`--force` and compare the text with `git diff` instead.

The originals aren't kept in the repo, only the text, up to 250 KB per extract (for a larger PDF, `--pages`
keeps the pages the data uses). Nothing under `docs/` is imported by `src/`, so the build never bundles these.

| Name | Title | URL | Fetched | SHA-256 of the original |
|---|---|---|---|---|
| [rule-mb-budget-2024](rule-mb-budget-2024.txt) | BULLETIN NO | https://www.gov.mb.ca/finance/taxation/pubs/bulletins/2024budget.pdf | 2026-11-02 | `d4d572216b9263d7013c3387dbf294435b59735c35fdae8099367f1095b8dbc6` |
| [rule-mb479-2024](rule-mb479-2024.txt) | Manitoba Credits | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5007-tc/5007-tc-24e.pdf | 2026-11-02 | `ac35cb16dd8ac2bf57ae712037a79bc12a6e4812a1ec68d7b9e2c493e4f26083` |
| [rule-nl-child-regulations-2024](rule-nl-child-regulations-2024.txt) | NLG20240216 FEB 16 2024 VOL 99_NO7 | https://www.gov.nl.ca/dgsnl/files/NLG20240216.pdf | 2026-11-02 | `1c3bf1321d14ce70a8b4b762ff6115bf11db0683ad1fc16945c31c2b66d67762` |
| [rule-ns-worksheet-2024](rule-ns-worksheet-2024.txt) | Worksheet NS428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5003-d/5003-d-24e.pdf | 2026-11-02 | `51597675fa8dfe16be250de5c673b9bb9d7c37e4f8ac515c73ec8544b2b80d0a` |
| [rule-ns428-2024](rule-ns428-2024.txt) | Nova Scotia Tax | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5003-c/5003-c-24e.pdf | 2026-11-02 | `19e9d9f54fa32217505e455e2ccd1be88663d5c03936bb5e0e226be3a9a91870` |
| [rule-quebec-2024](rule-quebec-2024.txt) | Parameters of the Personal Income Tax System - 2024 | https://cdn-contenu.quebec.ca/cdn-contenu/adm/min/finances/publications-adm/parametres/AUTEN_IncomeTax2024.pdf | 2026-11-02 | `83fcc19fe69fcf3c1f329fcc840cb4a9772ea3785717ee05b2897e1b7979fa89` |
| [rule-rc4210-2024](rule-rc4210-2024.txt) | untitled | https://www.canada.ca/content/dam/cra-arc/formspubs/pub/rc4210/rc4210-24e.pdf | 2026-11-02 | `515fc2ae7decb5f74648487a0b03768a8d13f641ff7dfe601b49d55af47e5ed0` |
| [rule-t4114-2024](rule-t4114-2024.txt) | untitled | https://www.canada.ca/content/dam/cra-arc/formspubs/pub/t4114/t4114-24e.pdf | 2026-11-02 | `498fa5faf37b90a37b271a7b9c53ec67aa70c84ce79f1cd3a8277cd3f9dfb988` |
| [rule-t4127-2024](rule-t4127-2024.txt) | Payroll Deductions Formulas - 119th Edition Effective January 1, 2024 | https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/payroll-deductions-t4127-payroll-deductions-formulas/t4127-jan-119th-edition-effective-january-1-2024/t4127-jan-payroll-deductions-formulas-computer-programs.html | 2026-11-02 | `ce5e372cdaecd8fb880598a4be2b192cd3f0036b8e5412f090133ebfb1140a46` |

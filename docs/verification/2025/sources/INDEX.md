# 2025 source extracts

Text extracts of official publications used for the 2025 data, made with
`npm run fetch-source -- <year> <url> [<name>]`. A data collector and the reviewer read the same text, and a
reviewer can check figures without opening PDFs. Each `.txt` file starts with the URL, the date fetched and the
SHA-256 of the original file. For a PDF or text file, download it again and compare the hash to confirm it
hasn't changed. Web pages embed per-request tracking code, so their hash differs on every fetch: refetch with
`--force` and compare the text with `git diff` instead.

The originals aren't kept in the repo, only the text, up to 250 KB per extract (for a larger PDF, `--pages`
keeps the pages the data uses). Nothing under `docs/` is imported by `src/`, so the build never bundles these.

| Name | Title | URL | Fetched | SHA-256 of the original |
|---|---|---|---|---|
| [cra-tax-rates-2025](cra-tax-rates-2025.txt) | Last year tax rates and income brackets (2025) | https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/last-year.html | 2026-11-01 | `928a37800144628aaef60526a8ef705f77fde1a60168e31fc3a74957c9da36e0` |
| [nl-childcare-credit](nl-childcare-credit.txt) | Newfoundland and Labrador Tax | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5001-c/5001-c-25e.pdf | 2026-11-02 | `9f5a34275d281e75df37b20d6ed0098396bbefc9bc5851e95824c0d7e709968e` |
| [nl-childcare-guide](nl-childcare-guide.txt) | Newfoundland and Labrador tax information for 2025 | https://www.canada.ca/en/revenue-agency/services/forms-publications/tax-packages-years/general-income-tax-benefit-package/newfoundland-labrador/5001-pc.html | 2026-11-02 | `3d0a0e911905a5e06cfb07578d7536b81f274a41e085682ba991e3bab6fdc4b8` |
| [ontario-care](ontario-care.txt) | Ontario Childcare Access and Relief from Expenses (CARE) Tax Credit | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5006-tca/5006-tca-25e.pdf | 2026-11-02 | `c3a5a874f866f4d0879b45920db259fb0bb1f6ab53b9c23c8217d6977f86e49c` |
| [quebec-childcare-schedule](quebec-childcare-schedule.txt) | Schedule C – Tax Credit for Childcare Expenses | https://www.revenuquebec.ca/documents/en/formulaires/tp/2025-12/TP-1.D.C-V%282025-12%29.pdf | 2026-11-02 | `60c3912b83075a9b4d438ae09bad5f5c60203f6fb7085ee314a9452b7ed57da8` |
| [rc4210-25](rc4210-25.txt) | RC4210-25 GST/HST Credit (July 2025 to June 2026), text version | https://www.canada.ca/content/dam/cra-arc/formspubs/pub/rc4210/rc4210-25e.txt | 2026-11-01 | `e515cb67c2324624162e41e15adee790719baf3b2da11c4b30d87a69b909a580` |
| [t4114-25](t4114-25.txt) | T4114-25 Canada Child Benefit and related federal, provincial and territorial programs (July 2025 to June 2026) | https://www.canada.ca/content/dam/cra-arc/formspubs/pub/t4114/t4114-25e.pdf | 2026-11-01 | `5db4ff195008a9cab6252ddc6c8d9773eb2707236fbbe59c54a18fdc13b615d4` |
| [t778-childcare](t778-childcare.txt) | Child Care Expenses Deduction | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/t778/t778-25e.pdf | 2026-11-02 | `825e3dce80164cb311f234774c13680fca2c5648cd3fb41d84d608540419d7f3` |

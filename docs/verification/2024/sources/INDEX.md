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
| [federal-capital-gains](federal-capital-gains.txt) | Update on the Canada Revenue Agency's administration of the proposed capital gains taxation changes | https://www.canada.ca/en/revenue-agency/news/newsroom/tax-tips/tax-tips-2025/update-cra-administration-proposed-capital-gains-taxation-changes.html | 2026-11-02 | `3cb1eb9781abef1a6812ef8cf12e8a77c9b7b334a108d8d72066f199af14a71e` |
| [federal-cwb-ab](federal-cwb-ab.txt) | Canada Workers Benefit | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5009-s6/5009-s6-24e.pdf | 2026-11-02 | `fb68981d297ddb1c150d4a53337e568cbfbb0b50c6bb1bd0026980f41cd8a440` |
| [federal-cwb-nu](federal-cwb-nu.txt) | Canada Workers Benefit | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5014-s6/5014-s6-24e.pdf | 2026-11-02 | `f92cf1a401516d37e608f7bf0d5c05f498d94dac34279e3728d2126d6ac15743` |
| [federal-cwb-qc](federal-cwb-qc.txt) | Canada Workers Benefit | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5005-s6/5005-s6-24e.pdf | 2026-11-02 | `b382a6642885125b97190eacaaefecdb5d917deeaf9543c6236a9b6fd5a3a345` |
| [federal-cwb-standard](federal-cwb-standard.txt) | Canada Workers Benefit | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5000-s6/5000-s6-24e.pdf | 2026-11-02 | `58f4ed9e259c41e04c4e91a9689105cb0ef27368c2b025d0847306ea0af08d9b` |
| [federal-foreign-tax-deduction](federal-foreign-tax-deduction.txt) | Income Tax Act | https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-20-20240620.html | 2026-11-02 | `3582f19c676797c15eb373dd106480a2908a30cef781345134327f0101a192cf` |
| [federal-gst-calculation](federal-gst-calculation.txt) | UNCLASSIFIED | https://www.canada.ca/content/dam/cra-arc/serv-info/benefits/gstcclc23-eng.pdf | 2026-11-02 | `cf0bdb3c151b5c31732fe406d924f5f981a6b68af88dc3242a93e9a0470b1a4c` |
| [federal-investment-rules](federal-investment-rules.txt) | Archived - Report on Federal Tax Expenditures - Concepts, Estimates and Evaluations 2025: part 5 | https://www.canada.ca/en/department-finance/services/publications/federal-tax-expenditures/2025/part-5.html | 2026-11-02 | `11edb82a359373c7a314e981b5b970cc925d481555c039a15e9d6d215ff041c5` |
| [federal-rc4210-24](federal-rc4210-24.txt) | untitled | https://www.canada.ca/content/dam/cra-arc/formspubs/pub/rc4210/rc4210-24e.pdf | 2026-11-02 | `515fc2ae7decb5f74648487a0b03768a8d13f641ff7dfe601b49d55af47e5ed0` |
| [federal-rrsp-limits](federal-rrsp-limits.txt) | MP, DB, RRSP, DPSP, ALDA, TFSA limits, YMPE and the YAMPE | https://www.canada.ca/en/revenue-agency/services/tax/registered-plans-administrators/pspa/mp-rrsp-dpsp-tfsa-limits-ympe.html | 2026-11-02 | `e8800d37eb5aee50245702625f06361c48bf5be17559b26d37fd7d27df6e9e77` |
| [federal-rrsp-rate](federal-rrsp-rate.txt) | How contributions affect your RRSP deduction limit | https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans/contributing-a-rrsp-prpp/contributions-affect-your-rrsp-prpp-deduction-limit.html | 2026-11-02 | `78be9475082c685782ca67d772dc73c6a7ca4a9c226918794be19d12ca777e4c` |
| [federal-t4114-24](federal-t4114-24.txt) | untitled | https://www.canada.ca/content/dam/cra-arc/formspubs/pub/t4114/t4114-24e.pdf | 2026-11-02 | `498fa5faf37b90a37b271a7b9c53ec67aa70c84ce79f1cd3a8277cd3f9dfb988` |
| [federal-t4127-24](federal-t4127-24.txt) | Payroll Deductions Formulas - 119th Edition Effective January 1, 2024 | https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/payroll-deductions-t4127-payroll-deductions-formulas/t4127-jan-119th-edition-effective-january-1-2024/t4127-jan-payroll-deductions-formulas-computer-programs.html | 2026-11-02 | `81772aa192f5803577654034011d0aa20f48913e15aebab626378286c8a265f5` |
| [federal-us-treaty](federal-us-treaty.txt) | Convention between Canada and the United States of America with Respect to Taxes on Income and on Capital | https://www.canada.ca/en/department-finance/programs/tax-policy/tax-treaties/country/united-states-america-convention-consolidated-1980-1983-1984-1995-1997-2007.html | 2026-11-02 | `c9f27154963756f73699628dcc04ac6620c6e89823d0326c016996143ef515e9` |

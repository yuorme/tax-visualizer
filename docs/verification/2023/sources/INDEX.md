# 2023 source extracts

Text extracts of official publications used for the 2023 data, made with
`npm run fetch-source -- <year> <url> [<name>]`. A data collector and the reviewer read the same text, and a
reviewer can check figures without opening PDFs. Each `.txt` file starts with the URL, the date fetched and the
SHA-256 of the original file. For a PDF or text file, download it again and compare the hash to confirm it
hasn't changed. Web pages embed per-request tracking code, so their hash differs on every fetch: refetch with
`--force` and compare the text with `git diff` instead.

The originals aren't kept in the repo, only the text, up to 250 KB per extract (for a larger PDF, `--pages`
keeps the pages the data uses). Nothing under `docs/` is imported by `src/`, so the build never bundles these.

| Name | Title | URL | Fetched | SHA-256 of the original |
|---|---|---|---|---|
| [rule-nl-child-2011](rule-nl-child-2011.txt) | NLR 60/11 child benefit reduction rates | https://www.assembly.nl.ca/Legislation/sr/Annualregs/2011/nr110060.htm | 2026-11-02 | `d56c01886feab721ae691b8855f2d30b9f41f51e57e6908c9c4c4df3cf6e1bfb` |
| [rule-nl-child-2024](rule-nl-child-2024.txt) | NLR 9/24 child benefit January 2024 change | https://www.gov.nl.ca/dgsnl/files/NLG20240216.pdf | 2026-11-02 | `1c3bf1321d14ce70a8b4b762ff6115bf11db0683ad1fc16945c31c2b66d67762` |
| [rule-nl-child-plan](rule-nl-child-plan.txt) | NL poverty reduction plan historical child benefit amounts | https://www.gov.nl.ca/cssd/files/Poverty-Reduction-Plan-Background-Information.pdf | 2026-11-02 | `a539e9e6f98bfb419ef6b4135a0bee01110045e787f7f8478e4dc7aae5c02747` |
| [rule-nwt-benefit](rule-nwt-benefit.txt) | NWT Child Benefit calculation fact sheet | https://www.fin.gov.nt.ca/sites/fin/files/benefits_and_support-nwt_child_benefit-180320.pdf | 2026-11-02 | `cf7a4e469c59d6941dbb8ba73c133ccbf7be6af050f563e5fcc6d1f73733dba1` |
| [rule-pe428](rule-pe428.txt) | PE428 2023 surtax after dividend credits | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5002-c/5002-c-23e.pdf | 2026-11-02 | `5e3f13d79b6c0cb853c181a50e71f291a12986d7d536a8011064672a21c2c7b7` |

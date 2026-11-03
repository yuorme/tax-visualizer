# 2019 source extracts

Text extracts of official publications used for the 2019 data, made with
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
| [carbon-regional-ab-end](carbon-regional-ab-end.txt) | Province of Alberta | https://docs.assembly.ab.ca/LADDAR_files/docs/hansards/han/legislature_30/session_1/20190523_1330_01_han.pdf | 2026-11-02 | 748583cd709746e77dae42bc44c9a9f05133bc55b84d9bbe52ccd5dd7a828f15 |
| [carbon-regional-ab-rates](carbon-regional-ab-rates.txt) | 2017-20 Fiscal Plan - COMPLETE VOLUME (Alberta Budget 2017) - March 2017 | https://open.alberta.ca/dataset/aa40ded0-75b3-48fe-9bbf-ea33802b8825/resource/da23ee3c-b79c-4971-8f75-e28ab7684983/download/fiscal-plan-complete.pdf | 2026-11-02 | 3ed08f1c552f0f3fee7567464ddaefcd564c9db5e48a8c9084338346edc60026 |
| [carbon-regional-ab-statute](carbon-regional-ab-statute.txt) | 2016 Bill | https://docs.assembly.ab.ca/LADDAR_files/docs/bills/bill/legislature_29/session_2/20160308_bill-020.pdf | 2026-11-02 | 61efdfa2adb5f8acfcec0d36f96268ea53d12fb7e037fe6fd8672540b124ee8f |
| [carbon-regional-nl-start](carbon-regional-nl-start.txt) | News Releases | https://www.gov.nl.ca/releases/2018/mae/1023n01/ | 2026-11-02 | d116cfbdf035e7a7d8f1c88385724cd009ec40e21f9b734752fb551c870474d0 |
| [carbon-regional-nt-start](carbon-regional-nt-start.txt) | Finance | https://www.fin.gov.nt.ca/en/services/licences-taxes-and-fees/residents-businesses-and-governments | 2026-11-02 | 22544ed8c9d139843ec9ea9b82754c096f470bbd8d2ae485d2bfdc377287aec2 |
| [carbon-regional-nu-start](carbon-regional-nu-start.txt) | Nunavut carbon tax FAQ, July2019 | https://www.gov.nu.ca/sites/default/files/documents/2021-10/faq_-_carbon_tax_in_nunavut-eng.pdf | 2026-11-02 | manual; unavailable |
| [carbon-regional-pe-rates](carbon-regional-pe-rates.txt) | Department of Finance | https://www.princeedwardisland.ca/sites/default/files/publications/cln109-gtn298-noticecarbonlevyratesrevised01april2019.pdf | 2026-11-02 | 80eed2bd1674e73b86220b61d22c89c27d465604be1141294a8837689525f6c9 |
| [carbon-regional-yt-law](carbon-regional-yt-law.txt) | Yukon Bill33 Carbon Price Rebate Implementation Act — payment rules | https://yukonassembly.ca/sites/default/files/inline-files/34-2-Bill033-Carbon-Price-Rebate-Implementation-Act.pdf | 2026-11-02 | manual; unavailable |
| [carbon-regional-yt-start](carbon-regional-yt-start.txt) | Yukoners to receive first carbon rebate in October | https://open.yukon.ca/information/b1cbb21a-1e7d-4bd5-b4ee-01b04901749c/resource/8189483c-ed69-49b2-8842-34def020c30a/download/19-237.html | 2026-11-02 | c272684cb51035e4acf9d94f2532ddd1a8694bf9d1133f167330ff3fcae2519f |

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
| [rule-carbon-ab-budget](rule-carbon-ab-budget.txt) | 2017-20 Fiscal Plan - COMPLETE VOLUME (Alberta Budget 2017) - March 2017 | https://open.alberta.ca/dataset/aa40ded0-75b3-48fe-9bbf-ea33802b8825/resource/da23ee3c-b79c-4971-8f75-e28ab7684983/download/fiscal-plan-complete.pdf | 2026-11-02 | `3ed08f1c552f0f3fee7567464ddaefcd564c9db5e48a8c9084338346edc60026` |
| [rule-carbon-ab-end](rule-carbon-ab-end.txt) | Province of Alberta | https://docs.assembly.ab.ca/LADDAR_files/docs/hansards/han/legislature_30/session_1/20190523_1330_01_han.pdf | 2026-11-02 | `748583cd709746e77dae42bc44c9a9f05133bc55b84d9bbe52ccd5dd7a828f15` |
| [rule-carbon-ab-statute](rule-carbon-ab-statute.txt) | 2016 Bill | https://docs.assembly.ab.ca/LADDAR_files/docs/bills/bill/legislature_29/session_2/20160308_bill-020.pdf | 2026-11-02 | `61efdfa2adb5f8acfcec0d36f96268ea53d12fb7e037fe6fd8672540b124ee8f` |

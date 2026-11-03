# 2020 source extracts

Text extracts of official publications used for the 2020 data, made with
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
| [carbon-regional-nb-act](carbon-regional-nb-act.txt) | New Brunswick 2020 c.6 — manual statutory facts | https://laws.gnb.ca/en/document/as/2020%2C%20c.6 | 2026-11-02 | manual; unavailable |
| [carbon-regional-nb-exemptions](carbon-regional-nb-exemptions.txt) | Gasoline and Motive Fuel Tax A basic overview of the taxation of gasoline and motive fuel | https://www2.gnb.ca/content/gnb/en/departments/finance/taxes/gasoline_motive_fueltax.html | 2026-11-02 | ce222cd84c1ec301c2c41034ae19f6dedbf7045c9f0502b773e51f5b9302468e |
| [carbon-regional-nl-rates](carbon-regional-nl-rates.txt) | DEPARTMENT OF FINANCE | https://www.gov.nl.ca/fin/files/Gasoline-and-Carbon-Products-Information-Bulletin-RAA-CARBON-002-November-7-2020.pdf | 2026-11-02 | 97ffd545ecda1f8426d0208819f78cb6c87a1e022422eb5933cc0859d8341e7e |
| [carbon-regional-nt-lump-sum](carbon-regional-nt-lump-sum.txt) | Government of Northwest Territories | https://www.gov.nt.ca/en/newsroom/first-2020-cost-living-offset-payments-be-made-april-30th-2020 | 2026-11-02 | 383181adbb271eeb814a0ad3e1df70f1a9f2934d5154cd935471c49e7164631f |

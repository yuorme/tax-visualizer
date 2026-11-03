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

Regional carbon notes marked "manual" paraphrase official sources whose direct downloads were blocked or incomplete.
Their headers disclose retrieval limits; a navigation-shell hash is not a hash of the underlying publication.

| Regional carbon cache | Title | URL | Read/fetched | Original hash |
|---|---|---|---|---|
| [carbon-regional-nb-act](carbon-regional-nb-act.txt) | New Brunswick 2021 c.7 — manual statutory facts | https://laws.gnb.ca/en/document/as/2021%2C%20c.7 | 2026-11-02 | manual; unavailable |

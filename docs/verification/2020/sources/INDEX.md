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
| [rule-carbon-nt-consolidation](rule-carbon-nt-consolidation.txt) | Government of Northwest Territories | https://www.gov.nt.ca/en/newsroom/first-2020-cost-living-offset-payments-be-made-april-30th-2020 | 2026-11-02 | `383181adbb271eeb814a0ad3e1df70f1a9f2934d5154cd935471c49e7164631f` |

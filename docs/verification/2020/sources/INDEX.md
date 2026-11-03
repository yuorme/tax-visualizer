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
| [rule-nu-cwb](rule-nu-cwb.txt) | Canada Workers Benefit | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5014-s6/5014-s6-20e.pdf | 2026-11-02 | `b5597ebfb51771b9316505db06e56028f8ec540c970ed9fc2cde92fce354a563` |

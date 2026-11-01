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
| [rc4210-25](rc4210-25.txt) | RC4210-25 GST/HST Credit (July 2025 to June 2026), text version | https://www.canada.ca/content/dam/cra-arc/formspubs/pub/rc4210/rc4210-25e.txt | 2026-11-01 | `e515cb67c2324624162e41e15adee790719baf3b2da11c4b30d87a69b909a580` |
| [t4114-25](t4114-25.txt) | T4114-25 Canada Child Benefit and related federal, provincial and territorial programs (July 2025 to June 2026) | https://www.canada.ca/content/dam/cra-arc/formspubs/pub/t4114/t4114-25e.pdf | 2026-11-01 | `5db4ff195008a9cab6252ddc6c8d9773eb2707236fbbe59c54a18fdc13b615d4` |

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
| [rule-bc-2019-assent](rule-bc-2019-assent.txt) | Progress of Bills with Hansard Debates | https://www.bclaws.gov.bc.ca/civix/document/id/lc/billsprevious/4th41st_progress-of-bills_government | 2026-11-02 | `476d6bb64115c24d66f071a786880e2afd643eff62fb39f39731b9daaeea7a29` |
| [rule-bc-2019-enactment](rule-bc-2019-enactment.txt) | Bill 5 – 2019: Budget Measures Implementation Act, 2019 | https://www.bclaws.gov.bc.ca/civix/document/id/bills/billsprevious/4th41st%3Agov05-3 | 2026-11-02 | `ab1c4688d27dcc32f7af545990d876f55198d650c7f991dc0df45b1f86b16c49` |
| [rule-bc-act](rule-bc-act.txt) | BC Income Tax Act: early childhood benefit and October2020 transition | https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/96215_01 | 2026-11-02 | `b82f37654e72a23d8c33232ba8b235a22e3eab40eafae828ef1ac2c8841a8b49` |
| [rule-t4114](rule-t4114.txt) | CRA T4114 2020: BC October transition and original opportunity amounts | https://publications.gc.ca/collections/collection_2020/arc-cra/Rv1-36-2020-eng.pdf?download=1 | 2026-11-02 | `03701cc947870230ca71648d244ff48acada43316f27edb963f808f784e5a56f` |

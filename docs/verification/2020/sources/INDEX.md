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
| [provincial-5001-c](provincial-5001-c.txt) | Newfoundland and Labrador Tax and Credits | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5001-c/5001-c-20e.pdf | 2026-11-02 | `4b3843473e11d155f22a509fe009648f597bab002b13f79975d14a9ceba68649` |
| [provincial-5001-d](provincial-5001-d.txt) | Worksheet NL428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5001-d/5001-d-20e.pdf | 2026-11-02 | `b8b350790cdbee689c5e8b115e2f7cc0be996c39555043db278333c0dc976f68` |
| [provincial-5002-c](provincial-5002-c.txt) | Prince Edward Island Tax and Credits | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5002-c/5002-c-20e.pdf | 2026-11-02 | `424486063a19c81ccb4b52bae1421555502e746f5de9d5eb7101e6432201b788` |
| [provincial-5002-d](provincial-5002-d.txt) | Worksheet PE428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5002-d/5002-d-20e.pdf | 2026-11-02 | `75bf1d86654d09835c3659c73da84b5f8c87ac3aebc471c32843eba768d4569a` |
| [provincial-5003-c](provincial-5003-c.txt) | Nova Scotia Tax and Credits | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5003-c/5003-c-20e.pdf | 2026-11-02 | `1fc938dc8c8def8aecd161e7b5d45845f987a684f64a624c4d73520054b02ac8` |
| [provincial-5003-d](provincial-5003-d.txt) | Worksheet NS428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5003-d/5003-d-20e.pdf | 2026-11-02 | `532fa0dd0dea7fad25d39a28e955181f2883ad8a203543c82613ffefeadbc051` |
| [provincial-5004-c](provincial-5004-c.txt) | New Brunswick Tax and Credits | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5004-c/5004-c-20e.pdf | 2026-11-02 | `b1fdd2c27893e2145cbe3992356b931e48738d6f43b4d5454415887d5b6e2475` |
| [provincial-5004-d](provincial-5004-d.txt) | Worksheet NB428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5004-d/5004-d-20e.pdf | 2026-11-02 | `3872dfdda11af97e362962851f03c0ded54d2fdeed3ba3e2a35110a114d239bc` |
| [provincial-5006-a](provincial-5006-a.txt) | Low-income Individuals and Families Tax (LIFT) Credit | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5006-a/5006-a-20e.pdf | 2026-11-02 | `5b68aac0eb5ca517de17678de7b779753b68045ade964cddc74fefedb5174816` |
| [provincial-5006-c](provincial-5006-c.txt) | Ontario Tax | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5006-c/5006-c-20e.pdf | 2026-11-02 | `3ffa93c78a5fd52246805a4a9d81cecd2cb0db4195d2a5297e4c4437915da890` |
| [provincial-5006-d](provincial-5006-d.txt) | Worksheet ON428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5006-d/5006-d-20e.pdf | 2026-11-02 | `62df0915a8b6c3c910f5f2138bd79bd0a92163c67f0dff44c83d83e5924385b7` |
| [provincial-5007-c](provincial-5007-c.txt) | Manitoba Tax | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5007-c/5007-c-20e.pdf | 2026-11-02 | `a0207cf3f3b85910ea5be64679560dc0f50ea17062dcd58434d198f59f29b185` |
| [provincial-5007-d](provincial-5007-d.txt) | Worksheet MB428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5007-d/5007-d-20e.pdf | 2026-11-02 | `15d21ef51c12ab8edf7e2c5ba7499f9bb3eef2ad44159de4aba805f1d9d122db` |
| [provincial-5007-tc](provincial-5007-tc.txt) | Manitoba Credits | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5007-tc/5007-tc-20e.pdf | 2026-11-02 | `0c2243c4aeeed3b56b39d13ce7265a084f28b92b329616b7815a92a6613b65b9` |
| [provincial-5008-c](provincial-5008-c.txt) | Saskatchewan Tax and Credits | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5008-c/5008-c-20e.pdf | 2026-11-02 | `6dc60fdddcd2f6bc8f65ddc5932f9404efa94ad787a227a27f158190f42ac8c9` |
| [provincial-5008-d](provincial-5008-d.txt) | Worksheet SK428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5008-d/5008-d-20e.pdf | 2026-11-02 | `9cd294068493e0952a5dbc706cce917a960118114e8a2262000edab934b3d244` |
| [provincial-5009-c](provincial-5009-c.txt) | Alberta Tax and Credits | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5009-c/5009-c-20e.pdf | 2026-11-02 | `57dbb717acd69035dd89d011c70aa7c7e0c4334b5de56e12dec83685cc67e36a` |
| [provincial-5009-d](provincial-5009-d.txt) | Worksheet AB428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5009-d/5009-d-20e.pdf | 2026-11-02 | `171a95d9c00894f0c9199e0c515c92e06c1765134986cdd77d363880065253a6` |
| [provincial-5010-c](provincial-5010-c.txt) | 5010-c-20e.pdf | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5010-c/5010-c-20e.pdf | 2026-11-02 | `5e43ec974e509c845142f44f5a7df8acc922f76b17cfa9e2a512c318e2f5b93b` |
| [provincial-5010-d](provincial-5010-d.txt) | Worksheet BC428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5010-d/5010-d-20e.pdf | 2026-11-02 | `b7422f3fd78492fe59f98d7ae42e94af5b9d40bdb7d147abd2ac21f2bca02f77` |
| [provincial-5011-c](provincial-5011-c.txt) | Yukon Tax | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5011-c/5011-c-20e.pdf | 2026-11-02 | `16578125d097ed0f66dd2f06b2c0ddf7b0b394c09d9bac6c57ccbfb89f3b1075` |
| [provincial-5011-d](provincial-5011-d.txt) | Worksheet YT428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5011-d/5011-d-20e.pdf | 2026-11-02 | `9c697896ecaedde60fafefc9e32a10e499ef9fd25ab10ebeb899d2a1a9ad1e09` |
| [provincial-5012-c](provincial-5012-c.txt) | Northwest Territories Tax | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5012-c/5012-c-20e.pdf | 2026-11-02 | `ce865fe8dc0cc9ea996d2adfaf222a6ae93736a376fccc670d86d1f70b7e7c5b` |
| [provincial-5012-d](provincial-5012-d.txt) | Worksheet NT428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5012-d/5012-d-20e.pdf | 2026-11-02 | `09c77061c99f7af8a14a50f1b7a129c731fcd92050d197865af023eb0737878c` |
| [provincial-5014-c](provincial-5014-c.txt) | Nunavut Tax | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5014-c/5014-c-20e.pdf | 2026-11-02 | `b8aaa31a30dd724a2797dd233e281bee04407a5f551dbc879b8bb13767638372` |
| [provincial-5014-d](provincial-5014-d.txt) | Worksheet NU428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5014-d/5014-d-20e.pdf | 2026-11-02 | `3dd062fcdd9950f45dcde8a1cc7269df7f1f237025d48b77ee9e0a6bea600ea2` |
| [provincial-ab-budget](provincial-ab-budget.txt) | 2020-23 Fiscal Plan (Alberta Budget 2020) - February 27, 2020 | https://open.alberta.ca/dataset/05bd4008-c8e3-4c84-949e-cc18170bc7f7/resource/79caa22e-e417-44bd-8cac-64d7bb045509/download/budget-2020-fiscal-plan-2020-23.pdf | 2026-11-02 | `f4258454cc82416667a90e9748cb0c98e6d7873b5bf10e1b61b4d2b9d82e9222` |
| [provincial-ontario-benefits](provincial-ontario-benefits.txt) | Descriptions of the Tax Provisions Listed in the Taxation Transparency Report, 2020 | https://budget.ontario.ca/2020/provisions.html | 2026-11-02 | `c7f382595af21e1dff713b6bbe35dfa76dda95b18086587b32b5992fc21504c9` |
| [provincial-quebec-living-alone](provincial-quebec-living-alone.txt) | Schedule B – Tax Relief Measures | https://www.revenuquebec.ca/documents/en/formulaires/tp/2020-12/TP-1.D.B-V%282020-12%29.pdf | 2026-11-02 | `57d97389c60ad31667eabd475acf405e80ade9251fbb592205869d79b4238dff` |
| [provincial-quebec-parameters](provincial-quebec-parameters.txt) | Paramètres du régime d’imposition des particuliers pour l’année d’imposition 2020 | https://www.finances.gouv.qc.ca/documents/Autres/fr/AUTFR_RegimeImpot2020.pdf | 2026-11-02 | `c99be200c13313e676e423e859360e43a5d698b11137b55937f200289f4e1928` |
| [provincial-quebec-return](provincial-quebec-return.txt) | Income Tax Return 2020 | https://www.revenuquebec.ca/documents/en/formulaires/tp/2020-12/TP-1.D-V%282020-12%29.pdf | 2026-11-02 | `45ecf98003706e9ad77206d0d6ed416d0cee712a83522f80313e86a23b78e886` |
| [provincial-quebec-work-premium](provincial-quebec-work-premium.txt) | Schedule P – Tax Credits Respecting the Work Premium | https://www.revenuquebec.ca/documents/en/formulaires/tp/2020-12/TP-1.D.P-V%282020-12%29.pdf | 2026-11-02 | `1ba36b5a5428cd35a5cb55f0e061e6e5310954c9e7fc27fe6f883bf54ca971e0` |
| [provincial-saskatoon-assessment](provincial-saskatoon-assessment.txt) | NOTICE OF APPEAL TO THE BOARD OF REVISION | https://www.saskatoon.ca/sites/default/files/documents/asset-financial-management/assessment-taxation/cos_guide_to_2021_reassessment_notice_final.pdf | 2026-11-02 | `30d1bf17e5dd81164dd42c94cfaf5106e6fd5d6a0d5556e26761f0c36efe34d9` |
| [provincial-sk-low-income-2017](provincial-sk-low-income-2017.txt) | Hansard: April 24, 2017 | https://docs.legassembly.sk.ca/legdocs/Legislative%20Assembly/Hansard/28L1S/170424Debates.pdf | 2026-11-02 | `f3257104ef6209a03ee948c4aa366fd990947cd090bb28952e029c07b5c97039` |
| [provincial-t4114-20](provincial-t4114-20.txt) | Canada Child Benefit | https://publications.gc.ca/collections/collection_2020/arc-cra/Rv1-36-2020-eng.pdf?download=1 | 2026-11-02 | `03701cc947870230ca71648d244ff48acada43316f27edb963f808f784e5a56f` |
| [provincial-toronto-property-tax](provincial-toronto-property-tax.txt) | 2020 ANNUAL FINANCIAL REPORT | https://www.toronto.ca/wp-content/uploads/2021/09/95b7-YE-2020-City-of-Toronto-Annual-Financial-Report.pdf | 2026-11-02 | `9440dbeb620ccc367a8e572bd89b08866a19beae0e372810a1a8fd3c70a3bff3` |
| [provincial-winnipeg-property-tax](provincial-winnipeg-property-tax.txt) | 2020 Combined Mill Rates | https://assessment.winnipeg.ca/Asmttax/pdfs/rates/2020CombinedMillRates.pdf | 2026-11-02 | `05c32058949f7b1d98cb8081e091d20306b613911f7c4989fa082a4a7b281d04` |

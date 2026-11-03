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
| [provincial-5001-c](provincial-5001-c.txt) | Newfoundland and Labrador Tax | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5001-c/5001-c-21e.pdf | 2026-11-02 | `de4fbe52dc0e5960b1e0b46fec7f858f9e5c442fb8517f80aeff3d1fe101e985` |
| [provincial-5001-d](provincial-5001-d.txt) | Worksheet NL428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5001-d/5001-d-21e.pdf | 2026-11-02 | `d4d71a904870e4e21f3368d91ccc6965781a5c04c0c4b92fa6409631b43a5dd7` |
| [provincial-5002-c](provincial-5002-c.txt) | Prince Edward Island Tax and Credits | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5002-c/5002-c-21e.pdf | 2026-11-02 | `896e1904351fe02311fca549147f3c0be9e71305c034d01139dac489c4791bc5` |
| [provincial-5002-d](provincial-5002-d.txt) | Worksheet PE428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5002-d/5002-d-21e.pdf | 2026-11-02 | `86286cbf3873fdc6b9fd8d458cf0ef41ebdecfd3a9f114b32f92dbc03de4310d` |
| [provincial-5003-c](provincial-5003-c.txt) | Nova Scotia Tax and Credits | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5003-c/5003-c-21e.pdf | 2026-11-02 | `632d8c752886a7eb531a957afabea0cfc1a78f8a8cf2a5c184ce87a798efb29d` |
| [provincial-5003-d](provincial-5003-d.txt) | Worksheet NS428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5003-d/5003-d-21e.pdf | 2026-11-02 | `aa6fde7b50fc283dca02a53d98dfac5831f2fcbc20766ab0e465ee3143fa0afa` |
| [provincial-5004-c](provincial-5004-c.txt) | New Brunswick Tax and Credits | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5004-c/5004-c-21e.pdf | 2026-11-02 | `e5de1bb53bd2b7a46a67e5848c189380ee0c2355cfa19c4a65ea1e03053b911e` |
| [provincial-5004-d](provincial-5004-d.txt) | Worksheet NB428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5004-d/5004-d-21e.pdf | 2026-11-02 | `4f80ab154d3fba1ebd565417dc34d88e7d7b3797410f955e189a5e37745ea60d` |
| [provincial-5006-a](provincial-5006-a.txt) | Low-income Individuals and Families Tax (LIFT) Credit | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5006-a/5006-a-21e.pdf | 2026-11-02 | `26e4913b0ca11ffbbe3142dc74396dde286ce4541dd06aeba5945e31ae03c781` |
| [provincial-5006-c](provincial-5006-c.txt) | Ontario Tax | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5006-c/5006-c-21e.pdf | 2026-11-02 | `456ea4595d529a92d5b2b8e41e3f927d21259100f2d01a518701df6f93951125` |
| [provincial-5006-d](provincial-5006-d.txt) | Worksheet ON428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5006-d/5006-d-21e.pdf | 2026-11-02 | `acecde28bb048d41e766ef6201e2ef77a3272806560d18ed6b7454e01a55be45` |
| [provincial-5007-c](provincial-5007-c.txt) | Manitoba Tax | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5007-c/5007-c-21e.pdf | 2026-11-02 | `4c85d20eed9f994c384cf2c57c59294095445c66e2ade9bb31718e08286f2830` |
| [provincial-5007-d](provincial-5007-d.txt) | Worksheet MB428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5007-d/5007-d-21e.pdf | 2026-11-02 | `8cfeb7eea46d60d338483dc692656eed53bd5abaf5afe3052f79cdae658f7342` |
| [provincial-5007-tc](provincial-5007-tc.txt) | Manitoba Credits | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5007-tc/5007-tc-21e.pdf | 2026-11-02 | `d40bb1c363dc74c2067f168467cacab43de3bbc5c2dfbf1418346ec90ad9188f` |
| [provincial-5008-c](provincial-5008-c.txt) | Saskatchewan Tax | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5008-c/5008-c-21e.pdf | 2026-11-02 | `eabe5acb7b1a84e21893bae3eaf60f715bfb7fc52babd15846c144157219c512` |
| [provincial-5008-d](provincial-5008-d.txt) | Worksheet SK428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5008-d/5008-d-21e.pdf | 2026-11-02 | `f03b32efee3f690d4119492f39b8e740a6b9510c4ccaa12b26771330f508f812` |
| [provincial-5009-c](provincial-5009-c.txt) | Alberta Tax and Credits | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5009-c/5009-c-21e.pdf | 2026-11-02 | `6f5632f8b6939f918bc5e71d6d857fcf9970bcb0cd2e55ee8f9b12cc443c3adf` |
| [provincial-5009-d](provincial-5009-d.txt) | Worksheet AB428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5009-d/5009-d-21e.pdf | 2026-11-02 | `ac4837d0e859fdca96de39af6e60e1520c04eec29d6d89a6beecae560dc4f5d2` |
| [provincial-5010-c](provincial-5010-c.txt) | British Columbia Tax | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5010-c/5010-c-21e.pdf | 2026-11-02 | `76868e59e96f568691f26482fe78e412148355523d0ccf6421df01967b2d2462` |
| [provincial-5010-d](provincial-5010-d.txt) | Worksheet BC428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5010-d/5010-d-21e.pdf | 2026-11-02 | `f8eb807b762aec21905fd8f6193c594aff6bdf76a353f90ccadab94da4ea794d` |
| [provincial-5011-c](provincial-5011-c.txt) | Yukon Tax | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5011-c/5011-c-21e.pdf | 2026-11-02 | `17efa99d0d86a8bb541d455ed632c55bec066b87da9f4750d969925b251a5a4f` |
| [provincial-5011-d](provincial-5011-d.txt) | Worksheet YT428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5011-d/5011-d-21e.pdf | 2026-11-02 | `30597ffa4d9c6dea15ea4f8eea7a3e757dce7b3588091f739e201313829d7afb` |
| [provincial-5012-c](provincial-5012-c.txt) | Northwest Territories Tax | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5012-c/5012-c-21e.pdf | 2026-11-02 | `558164b41794dc780f17edd87836c04314cdb965f1d8d34bcd78de6c0078eecd` |
| [provincial-5012-d](provincial-5012-d.txt) | Worksheet NT428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5012-d/5012-d-21e.pdf | 2026-11-02 | `c5e9f2d847dd69ab4095dee206157b8caab9b483915231f8d3b6a41fe55a303b` |
| [provincial-5014-c](provincial-5014-c.txt) | Nunavut Tax | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5014-c/5014-c-21e.pdf | 2026-11-02 | `0c261cf647a10d5a81e187c8be4e9c9749aa4c3f1327b0ec252639ccfcfeef6d` |
| [provincial-5014-d](provincial-5014-d.txt) | Worksheet NU428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5014-d/5014-d-21e.pdf | 2026-11-02 | `051325bba65ac714521cea61348b4244fd961383c0694e0a50a38efdff2296b9` |
| [provincial-ns-child-regulation](provincial-ns-child-regulation.txt) | NS Royal Gazette Part II - Volume 44, No. 15, July 17, 2020 | https://novascotia.ca/just/regulations/RG2/2020/RG2-2020-07-17.pdf | 2026-11-02 | `5ea3688ead53e692ddeb589f6722cf4b687f3b6b04787625bb8985177c5e1273` |
| [provincial-quebec-parameters](provincial-quebec-parameters.txt) | Paramètres du régime d'imposition des particuliers pour l'année d'imposition 2021 | https://www.finances.gouv.qc.ca/documents/Autres/fr/AUTFR_RegimeImpot2021.pdf | 2026-11-02 | `27b40da261af152727082eae2e0b3d988748a877e2a8f28459bec218707605c0` |
| [provincial-t4114-21](provincial-t4114-21.txt) | Canada Child Benefit | https://publications.gc.ca/collections/collection_2021/arc-cra/Rv1-36-2021-eng.pdf?download=1 | 2026-11-02 | `32eda512abc7d6f7fba6c2dc9bb0c4489f9654ad46ca36c3083cdf2a1ce205ad` |

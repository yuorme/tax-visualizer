# 2022 source extracts

Text extracts of official publications used for the 2022 data, made with
`npm run fetch-source -- <year> <url> [<name>]`. A data collector and the reviewer read the same text, and a
reviewer can check figures without opening PDFs. Each `.txt` file starts with the URL, the date fetched and the
SHA-256 of the original file. For a PDF or text file, download it again and compare the hash to confirm it
hasn't changed. Web pages embed per-request tracking code, so their hash differs on every fetch: refetch with
`--force` and compare the text with `git diff` instead.

The originals aren't kept in the repo, only the text, up to 250 KB per extract (for a larger PDF, `--pages`
keeps the pages the data uses). Nothing under `docs/` is imported by `src/`, so the build never bundles these.

| Name | Title | URL | Fetched | SHA-256 of the original |
|---|---|---|---|---|
| [provincial-5001-c](provincial-5001-c.txt) | Newfoundland and Labrador Tax | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5001-c/5001-c-22e.pdf | 2026-11-02 | `f02cd11a44cdba513c1831eba96d777ace15baf1164a647f1a0b1a2b0cc841ef` |
| [provincial-5001-d](provincial-5001-d.txt) | Worksheet NL428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5001-d/5001-d-22e.pdf | 2026-11-02 | `ab6d091ac7d182aeff2f212cc3173507a99817395a5be5fe072ff1418e7843a9` |
| [provincial-5002-c](provincial-5002-c.txt) | Prince Edward Island Tax and Credits | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5002-c/5002-c-22e.pdf | 2026-11-02 | `9d9a964bd07cec1c12f487318c3951c48a78871c2fc4ea0b7af505317d84a750` |
| [provincial-5002-d](provincial-5002-d.txt) | Worksheet PE428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5002-d/5002-d-22e.pdf | 2026-11-02 | `c81723b202237b254c8ea0c92418eb8d45b77e43d3f02538c6e2b54d9f797811` |
| [provincial-5003-c](provincial-5003-c.txt) | Nova Scotia Tax | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5003-c/5003-c-22e.pdf | 2026-11-02 | `c119e001374eccb5b7629d74b7142c60fc50f75c282633c2591874e8e6408335` |
| [provincial-5003-d](provincial-5003-d.txt) | Worksheet NS428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5003-d/5003-d-22e.pdf | 2026-11-02 | `665bd9f892d3cb24c1d9c8ca7ea627ad86ecbc615333a0b2d83dd302766ff468` |
| [provincial-5004-c](provincial-5004-c.txt) | New Brunswick Tax and Credits | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5004-c/5004-c-22e.pdf | 2026-11-02 | `f9b3cf755cb9ca7119bf265faa6512e8ca13b9ed5a89ce71555e721c28172b4a` |
| [provincial-5004-d](provincial-5004-d.txt) | Worksheet NB428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5004-d/5004-d-22e.pdf | 2026-11-02 | `6cd2ea953c81462660c249c8fa97b9fd2f2cc6cf3aed9e3295728401fa60aaa0` |
| [provincial-5006-c](provincial-5006-c.txt) | Ontario Tax | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5006-c/5006-c-22e.pdf | 2026-11-02 | `d228bfe1df90281925eaf8bc5c990564f42cc9226cdefb24b18b60de3d192845` |
| [provincial-5006-d](provincial-5006-d.txt) | Worksheet ON428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5006-d/5006-d-22e.pdf | 2026-11-02 | `8d545a046c16d79e9cdb0ee1cbbfa4782fb0bc49f68399299094d7cfa45fcdfa` |
| [provincial-5007-c](provincial-5007-c.txt) | Manitoba Tax | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5007-c/5007-c-22e.pdf | 2026-11-02 | `5662995af9ddcc791ca95202eaba768aa37c03a9c097361839bf07872f90541a` |
| [provincial-5007-d](provincial-5007-d.txt) | Worksheet MB428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5007-d/5007-d-22e.pdf | 2026-11-02 | `a9527ae05127fc1fb38581b34430c67945d51f677af1c9be2f618196c264781d` |
| [provincial-5008-c](provincial-5008-c.txt) | Saskatchewan Tax | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5008-c/5008-c-22e.pdf | 2026-11-02 | `ec0af6118432843610c19d72fdee17ea488390b35b75d989baaf5f45e8a73c4b` |
| [provincial-5008-d](provincial-5008-d.txt) | Worksheet SK428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5008-d/5008-d-22e.pdf | 2026-11-02 | `856fdcd622306804e9d9e3631821e7f9dd4617b74927d92e0a277d4ab8a154f9` |
| [provincial-5009-c](provincial-5009-c.txt) | Alberta Tax and Credits | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5009-c/5009-c-22e.pdf | 2026-11-02 | `2065201d735335cdf98396657e08bc93da226612c45b5e7b651040458efc7247` |
| [provincial-5009-d](provincial-5009-d.txt) | Worksheet AB428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5009-d/5009-d-22e.pdf | 2026-11-02 | `7fb9ababc179514f2006a49b1461322afc7fd983f9af233036850d963906f488` |
| [provincial-5010-c](provincial-5010-c.txt) | British Columbia Tax | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5010-c/5010-c-22e.pdf | 2026-11-02 | `909f2c32ee45a2efd2e28844a795c59ff9c23e47262ecc5dbe40f5c2a423f81f` |
| [provincial-5010-d](provincial-5010-d.txt) | Worksheet BC428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5010-d/5010-d-22e.pdf | 2026-11-02 | `e35bdc8b1a199599390a922d7f4c99768e0d24e883b932dd4fb7bc896e7257c8` |
| [provincial-5011-c](provincial-5011-c.txt) | Yukon Tax | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5011-c/5011-c-22e.pdf | 2026-11-02 | `c68d425de5d29d95ca377c89d53da77c76cc9c0daa736ad8a75e663fd0d5245b` |
| [provincial-5011-d](provincial-5011-d.txt) | Worksheet YT428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5011-d/5011-d-22e.pdf | 2026-11-02 | `da9cba8ad2a8982a180a5b979bb24a5a88d0d662c03bff5938bac84f39cb1add` |
| [provincial-5012-c](provincial-5012-c.txt) | Northwest Territories Tax | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5012-c/5012-c-22e.pdf | 2026-11-02 | `ca85498be6cd18d52b09f6f8d6a40ef588c69a7d285792e7db3c27799dbbb3c2` |
| [provincial-5012-d](provincial-5012-d.txt) | Worksheet NT428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5012-d/5012-d-22e.pdf | 2026-11-02 | `86f08523329eb1c7d43e8014fa770e7310ccebbc3d9738ff589c36e721b86571` |
| [provincial-5014-c](provincial-5014-c.txt) | Nunavut Tax | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5014-c/5014-c-22e.pdf | 2026-11-02 | `a3984d29d24c2e681929715718abaa2104ae1342c0b50e7a5695194ea439d844` |
| [provincial-5014-d](provincial-5014-d.txt) | Worksheet NU428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5014-d/5014-d-22e.pdf | 2026-11-02 | `a7764767ae33632136d8f2d8d7973408269fdf998c554c040d82af2b63b123b5` |
| [provincial-bc-child-enhancement](provincial-bc-child-enhancement.txt) | Bill 35 – 2022: Income Tax Amendment Act, 2022 | https://www.bclaws.gov.bc.ca/civix/document/id/bills/billsprevious/3rd42nd%3Agov35-1 | 2026-11-02 | `1e42f447789990138dcc9332b7840a77ce45ddb99d2520f23827e13f4e11fe29` |
| [provincial-mb-school-tax-rebate](provincial-mb-school-tax-rebate.txt) | Budget 2022 | https://www.gov.mb.ca/budget2022/tax-and-fee-measures.html | 2026-11-02 | `078b7834663de29c0245856ffcdcfca9ffa7f046d003397aec7a02eaa782a151` |
| [provincial-mb479](provincial-mb479.txt) | Manitoba Credits | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5007-tc/5007-tc-22e.pdf | 2026-11-02 | `bcbf4bb42612470b61a3d1fe186808926430323549bfd015f96997085741441c` |
| [provincial-nl-income-supplement](provincial-nl-income-supplement.txt) | NEWFOUNDLAND AND LABRADOR REGULATION 26/22 | https://www.assembly.nl.ca/legislation/sr/annualregs/2022/nr220026.htm | 2026-11-02 | `3ba0f0de0fcdfd61b8420b6e418a059b158a2fbd2bbcd08ee1fe194fa291be71` |
| [provincial-nt-child-formula](provincial-nt-child-formula.txt) | Page 1 | https://www.fin.gov.nt.ca/sites/fin/files/benefits_and_support-nwt_child_benefit-180320.pdf | 2026-11-02 | `cf7a4e469c59d6941dbb8ba73c133ccbf7be6af050f563e5fcc6d1f73733dba1` |
| [provincial-ontario-lift](provincial-ontario-lift.txt) | Low-income Individuals and Families Tax (LIFT) Credit | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5006-a/5006-a-22e.pdf | 2026-11-02 | `bf9cb89946b819b396bf764f91d3201cc0d3bd5e2db5dbcaec12aed2107f9a69` |
| [provincial-ontario-oeptc](provincial-ontario-oeptc.txt) | 2022 Ontario energy and property tax credit (OEPTC) - | https://www.canada.ca/content/dam/cra-arc/serv-info/benefits/ptc22_clc_mns-eng.pdf | 2026-11-02 | `4d177db22d1c55ced475771e9f66263e28c95a0ab6f5af50cf6b2b21d3790dd9` |
| [provincial-quebec-living-alone](provincial-quebec-living-alone.txt) | Schedule B – Tax Relief Measures | https://www.revenuquebec.ca/documents/en/formulaires/tp/2022-12/TP-1.D.B-V%282022-12%29.pdf | 2026-11-02 | `dfdfe18623c4679c17fbd5b56f0b70360f4aea4929656922879c5ac0e7b5e3a5` |
| [provincial-quebec-parameters](provincial-quebec-parameters.txt) | Parameters of the Personal Income Tax System for 2022 | https://bibliotheque.assnat.qc.ca/DepotNumeriqueAPI/FichierStreaming?idFichier=270432 | 2026-11-02 | `87f447e0839e43e3ba1c753e3bc842737a0dc5b4564f3fe308d0e912d073181d` |
| [provincial-quebec-return](provincial-quebec-return.txt) | Income tax return 2022 | https://www.revenuquebec.ca/documents/en/formulaires/tp/2022-12/TP-1.D-V%282022-12%29.pdf | 2026-11-02 | `82422942b4e62a5c38d5cc4ee1766527e3c8e5731ad94e8fa14d697b98b690e8` |
| [provincial-quebec-work-premium](provincial-quebec-work-premium.txt) | Schedule P – Tax Credits Respecting the Work Premium | https://www.revenuquebec.ca/documents/en/formulaires/tp/2022-12/TP-1.D.P-V%282022-12%29.pdf | 2026-11-02 | `4b4f2049f1c4d95bc6e984eba62ce3f2d7c9231ce757a971e3b46d8a72de7bf3` |
| [provincial-rc4210](provincial-rc4210.txt) | Microsoft Word - rc4210-22e.docx | https://support.drtax.ca/dtmax/eng/kb/dtmax/eng/rc4210-22e.pdf | 2026-11-02 | `c1ac4dcfd0fcfde410401b9b84c2cbb681f7e8894f86b223141a262d90544a28` |
| [provincial-t4114](provincial-t4114.txt) | Canada Child Benefit | https://www.cchwebsites.com/content/pdf/tax_forms/ca/en/t4114_en.pdf | 2026-11-02 | `4590f37a7a95b6b72a7e4d3fc468329e3daea047bf695001f21d068ee73dd273` |

# 2024 source extracts

Text extracts of official publications used for the 2024 data, made with
`npm run fetch-source -- <year> <url> [<name>]`. A data collector and the reviewer read the same text, and a
reviewer can check figures without opening PDFs. Each `.txt` file starts with the URL, the date fetched and the
SHA-256 of the original file. For a PDF or text file, download it again and compare the hash to confirm it
hasn't changed. Web pages embed per-request tracking code, so their hash differs on every fetch: refetch with
`--force` and compare the text with `git diff` instead.

The originals aren't kept in the repo, only the text, up to 250 KB per extract (for a larger PDF, `--pages`
keeps the pages the data uses). Nothing under `docs/` is imported by `src/`, so the build never bundles these.

| Name | Title | URL | Fetched | SHA-256 of the original |
|---|---|---|---|---|
| [provincial-5001-c](provincial-5001-c.txt) | Newfoundland and Labrador Tax | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5001-c/5001-c-24e.pdf | 2026-11-02 | `e59e252d991134d5a2abbe39ecaebdcdbf84ce0f25eaf1eae5278953ac95653c` |
| [provincial-5001-worksheet](provincial-5001-worksheet.txt) | Worksheet NL428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5001-d/5001-d-24e.pdf | 2026-11-02 | `a0d4b4ea06e922795c7e0a1c3a0c84443130a5e512a72466b081a0b7d6e2316e` |
| [provincial-5002-c](provincial-5002-c.txt) | Prince Edward Island Tax and Credits | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5002-c/5002-c-24e.pdf | 2026-11-02 | `af8c4e36d51e7372eb544478fa651b568c8f83d3f88a2dd9e556efbb0e7df12c` |
| [provincial-5002-worksheet](provincial-5002-worksheet.txt) | Worksheet PE428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5002-d/5002-d-24e.pdf | 2026-11-02 | `b53a9ac89d09adac91425eb22c3e5319942f1147d70eef514aec6a39a01d2c9d` |
| [provincial-5003-c](provincial-5003-c.txt) | Nova Scotia Tax | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5003-c/5003-c-24e.pdf | 2026-11-02 | `19e9d9f54fa32217505e455e2ccd1be88663d5c03936bb5e0e226be3a9a91870` |
| [provincial-5003-worksheet](provincial-5003-worksheet.txt) | Worksheet NS428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5003-d/5003-d-24e.pdf | 2026-11-02 | `51597675fa8dfe16be250de5c673b9bb9d7c37e4f8ac515c73ec8544b2b80d0a` |
| [provincial-5004-c](provincial-5004-c.txt) | New Brunswick Tax and Credits | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5004-c/5004-c-24e.pdf | 2026-11-02 | `38d4785ead9afb0f29276de365ac09ba77743f482df079258903b85107637836` |
| [provincial-5004-worksheet](provincial-5004-worksheet.txt) | Worksheet NB428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5004-d/5004-d-24e.pdf | 2026-11-02 | `005f47f0396529a476527ae904385d16ff4766d1cb2c28fd6143b7977dc0f649` |
| [provincial-5006-c](provincial-5006-c.txt) | Ontario Tax | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5006-c/5006-c-24e.pdf | 2026-11-02 | `22817b07966556427c4dbd63fd06d83720d433bb679bee97f4aa1a17c3cb73f9` |
| [provincial-5006-worksheet](provincial-5006-worksheet.txt) | Worksheet ON428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5006-d/5006-d-24e.pdf | 2026-11-02 | `53f191285bd528936d36a2277e2860899d7a6a47877edbca4e98aa0353ab927e` |
| [provincial-5007-c](provincial-5007-c.txt) | Manitoba Tax | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5007-c/5007-c-24e.pdf | 2026-11-02 | `58f76fd7b05e33af205db68d3f0b3e1d09c494181cd54ee502d35000a5133473` |
| [provincial-5007-worksheet](provincial-5007-worksheet.txt) | Worksheet MB428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5007-d/5007-d-24e.pdf | 2026-11-02 | `df4982d10c42927c62546bb0b42c87bad562e292e6477ed73cf60fdb8d5da520` |
| [provincial-5008-c](provincial-5008-c.txt) | Saskatchewan Tax | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5008-c/5008-c-24e.pdf | 2026-11-02 | `ea081ac3540866e76f5c4651f1134a3dadfa6cf53a8ae42fffd2380ed9532f75` |
| [provincial-5008-worksheet](provincial-5008-worksheet.txt) | Worksheet SK428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5008-d/5008-d-24e.pdf | 2026-11-02 | `e7b55e1c8e34f57d301bb4654dcd9817e500ac07b733fed0985a6234a7b7b5a0` |
| [provincial-5009-c](provincial-5009-c.txt) | Alberta Tax and Credits | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5009-c/5009-c-24e.pdf | 2026-11-02 | `a5d1274870f1ea6fd88244ee205c7bee158a5b66856a4a4e4afc033dbeedef2b` |
| [provincial-5009-worksheet](provincial-5009-worksheet.txt) | Worksheet AB428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5009-d/5009-d-24e.pdf | 2026-11-02 | `42398f5e38e9faf726f0fecfcfde7421e7110b8c05c1dd16db7534cb48b9b530` |
| [provincial-5010-c](provincial-5010-c.txt) | British Columbia Tax | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5010-c/5010-c-24e.pdf | 2026-11-02 | `1e3cd4012baf47d88216e523a18ef037939b1ab1858bf75485d02189cddd0860` |
| [provincial-5010-worksheet](provincial-5010-worksheet.txt) | Worksheet BC428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5010-d/5010-d-24e.pdf | 2026-11-02 | `bbd4d74123a771c28c9eae5cf0a18fdcbaf20ae84162f135c89d48367b4927d8` |
| [provincial-5011-c](provincial-5011-c.txt) | Yukon Tax | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5011-c/5011-c-24e.pdf | 2026-11-02 | `cf50148fe145332b9c99da7aa039c7d33251040e4096f994d42fe90ee4c71b50` |
| [provincial-5011-worksheet](provincial-5011-worksheet.txt) | Worksheet YT428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5011-d/5011-d-24e.pdf | 2026-11-02 | `5692b0ab673fca64129583db98d6788cd3a25e4b3c6b8972e63da0d857e2d1c1` |
| [provincial-5012-c](provincial-5012-c.txt) | Northwest Territories Tax | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5012-c/5012-c-24e.pdf | 2026-11-02 | `f5efc3fe3be3e94214fec4d65f15405309d7c1bb8cb570bfc9f72440312b1c69` |
| [provincial-5014-worksheet](provincial-5014-worksheet.txt) | Worksheet NU428 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5014-d/5014-d-24e.pdf | 2026-11-02 | `35d849b2c51451c230256741b5cdda9018fdffad86008b1267e85af118dd5f7f` |
| [provincial-bc-renter](provincial-bc-renter.txt) | B.C. renter's tax credit | https://www2.gov.bc.ca/gov/content/taxes/income-taxes/personal/credits/renters-tax-credit | 2026-11-02 | `7fd7ce2ae369b95ef98311cf0a5f0c6ed9add66743a393a56ebbda40e028cf74` |
| [provincial-calgary-property-tax](provincial-calgary-property-tax.txt) | Property tax rates and bill calculation | https://www.calgary.ca/property-owners/taxes/bill-rate-calculation.html | 2026-11-02 | `84c3b7acc94c33e9ecfeb9215cb1d31961aaede275fa2b63ce1c8c762283498c` |
| [provincial-nl-income](provincial-nl-income.txt) | Finance | https://www.gov.nl.ca/fin/tax-programs-incentives/personal/income-supplement/ | 2026-11-02 | `011211e86de6a5f5025044f894360a6f42c400296f42aa24dff78ca8c4613222` |
| [provincial-oeptc-married](provincial-oeptc-married.txt) | 2024 Ontario energy and property tax credit (OEPTC) - | https://www.canada.ca/content/dam/cra-arc/serv-info/benefits/ptc24_clc_mns-eng.pdf | 2026-11-02 | `d1ca785c9dfdde827645471c0708a60b0c4d98fe38f88bfb5829264673aa5393` |
| [provincial-ontario-lift](provincial-ontario-lift.txt) | Low-income Individuals and Families Tax (LIFT) Credit | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5006-a/5006-a-24e.pdf | 2026-11-02 | `02150677ad69ab835a1f879836c5837f8cd2292c256e60ed0ce887ea0074b5c7` |
| [provincial-pei-child-start](provincial-pei-child-start.txt) | Radware Page | https://www.princeedwardisland.ca/en/news/pei-child-benefit-to-support-island-families-starting-january-2025 | 2026-11-02 | `df383a2e0e7a3c119780a8160bd02323484604de1a117d9fe503b4dc7964ed76` |
| [provincial-quebec-parameters](provincial-quebec-parameters.txt) | Parameters of the Personal Income Tax System - 2024 | https://cdn-contenu.quebec.ca/cdn-contenu/adm/min/finances/publications-adm/parametres/AUTEN_IncomeTax2024.pdf | 2026-11-02 | `83fcc19fe69fcf3c1f329fcc840cb4a9772ea3785717ee05b2897e1b7979fa89` |
| [provincial-rc4210](provincial-rc4210.txt) | untitled | https://www.canada.ca/content/dam/cra-arc/formspubs/pub/rc4210/rc4210-24e.pdf | 2026-11-02 | `515fc2ae7decb5f74648487a0b03768a8d13f641ff7dfe601b49d55af47e5ed0` |
| [provincial-sales-tax](provincial-sales-tax.txt) | Charge and collect the GST/HST | https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-which-rate.html | 2026-11-02 | `bb53d4439e91671ba3e6a9a76366d06bd65917cc6997849186ae9605a4071b0c` |
| [provincial-t4114](provincial-t4114.txt) | untitled | https://www.canada.ca/content/dam/cra-arc/formspubs/pub/t4114/t4114-24e.pdf | 2026-11-02 | `498fa5faf37b90a37b271a7b9c53ec67aa70c84ce79f1cd3a8277cd3f9dfb988` |
| [provincial-winnipeg-property-tax](provincial-winnipeg-property-tax.txt) | 2024 Historical Combined Mill Rates.xls | https://assessment.winnipeg.ca/Asmttax/pdfs/rates/2024CombinedMillRates.pdf | 2026-11-02 | `5ebe3d5da86a9c1bab23183c038275429360cc212da4f4fb9e503570ffecbb56` |

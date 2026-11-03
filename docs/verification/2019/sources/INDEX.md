# 2019 source extracts

Text extracts of official publications used for the 2019 data, made with
`npm run fetch-source -- <year> <url> [<name>]`. A data collector and the reviewer read the same text, and a
reviewer can check figures without opening PDFs. Each `.txt` file starts with the URL, the date fetched and the
SHA-256 of the original file. For a PDF or text file, download it again and compare the hash to confirm it
hasn't changed. Web pages embed per-request tracking code, so their hash differs on every fetch: refetch with
`--force` and compare the text with `git diff` instead.

The originals aren't kept in the repo, only the text, up to 250 KB per extract (for a larger PDF, `--pages`
keeps the pages the data uses). Nothing under `docs/` is imported by `src/`, so the build never bundles these.

| Name | Title | URL | Fetched | SHA-256 of the original |
|---|---|---|---|---|
| [rule-ab-2015-act](rule-ab-2015-act.txt) | © Published by Alberta Queen’s Printer | https://s3.amazonaws.com/rgi-documents/1995f5a489f31660be4ce633d7df47a2b0a0b119.pdf | 2026-11-02 | `c7dc08a9dbee7a65399553b18a1905e006fe52684e8f5fc3fbae260617a3f3dd` |
| [rule-ab-2017-budget](rule-ab-2017-budget.txt) | 2017-20 Fiscal Plan - COMPLETE VOLUME (Alberta Budget 2017) - March 2017 | https://open.alberta.ca/dataset/aa40ded0-75b3-48fe-9bbf-ea33802b8825/resource/da23ee3c-b79c-4971-8f75-e28ab7684983/download/fiscal-plan-complete.pdf | 2026-11-02 | `3ed08f1c552f0f3fee7567464ddaefcd564c9db5e48a8c9084338346edc60026` |
| [rule-bc-msp](rule-bc-msp.txt) | Medical and Health Care Services Regulation | https://www.bclaws.gov.bc.ca/civix/document/id/loo103/loo103/426_97 | 2026-11-02 | `887ea8e598ae3b27594fd0697b60d3e54b72ada2f656f9b7f396c46161e3da5a` |
| [rule-bc-msp-deductions](rule-bc-msp-deductions.txt) | Group Plan Administrators Frequently Asked Questions | https://www2.gov.bc.ca/assets/gov/health/health-drug-coverage/medical-services-plan/group-plan-administrators-faqs.pdf | 2026-11-02 | `8e84a6baf55410bd667f16c62e7cb18e90f49e7aae8093c101aa016f66fc766e` |
| [rule-bc-msp-guide](rule-bc-msp-guide.txt) | MEDICAL SERVICES PLAN | https://www2.gov.bc.ca/assets/gov/health/practitioner-pro/medical-services-plan/group-procedure-guide.pdf | 2026-11-02 | `350eb00bcfb4a6f9949b2b8021e8533a258d2afdef8f74a36533577c388dc178` |
| [rule-federal-bpa](rule-federal-bpa.txt) | Microsoft Word - t4127-19e_clean.docx | https://www.canada.ca/content/dam/cra-arc/formspubs/pub/t4127-jan/t4127-01-19e.pdf | 2026-11-02 | `77b745fd0bd8271843a78bc32b4e94da37436b771c93f43d320d154f1075298e` |
| [rule-nl-levy](rule-nl-levy.txt) | Newfoundland and Labrador Tax and Credits | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5001-c/5001-c-19e.pdf | 2026-11-02 | `6fbd79926f7e0a89f25deec559d68fc1fdf107a922da8f322fd22709c16e810d` |
| [rule-ns-2009](rule-ns-2009.txt) | NS Royal Gazette Part II - Volume 33, No. 21 - October 9, 2009 | https://novascotia.ca/just/regulations/rg2/2009/oc0909.pdf | 2026-11-02 | `65a9e14823a1189190f4d254bf43290cb0232ef3fdd8c587056cfc428a3894ee` |
| [rule-ns-2012-amounts](rule-ns-2012-amounts.txt) | NS Royal Gazette Part II - Volume 36, No. 10 dated May 18, 2012 | https://novascotia.ca/just/regulations/rg2/2012/ma1812.pdf | 2026-11-02 | `c229373ef507bde98aeadd3dad7a3c3be85f16a24065ceb9a1428af0e416e938` |
| [rule-ns-2012-threshold](rule-ns-2012-threshold.txt) | NS Royal Gazette Part II - Volume 36 dated August 10, 2012 | https://novascotia.ca/just/regulations/rg2/2012/au1012.pdf | 2026-11-02 | `66642484e139c8da8ab7775546973c80f708854caddf2ed8f11a512312522503` |
| [rule-ns-2014](rule-ns-2014.txt) | Nova Scotia Royal Gazette Part II – Volume 38, No. 14 – July 11, 2014 | https://novascotia.ca/just/regulations/rg2/2014/jl1114.pdf | 2026-11-02 | `cfd684d4127a929358bb70e890182def34b22730da8675405280827733ff8338` |
| [rule-ns-original](rule-ns-original.txt) | NS Royal Gazette Part II - Volume 23, No. 14, July 16, 1999 | https://novascotia.ca/just/regulations/rg2/1999/RG2-1999-07-16.pdf | 2026-11-02 | `63203d0b2a514993cf3991d82476427df6c72fa1ce38a8eb0ea1bce939e71a4e` |
| [rule-qc-allowance](rule-qc-allowance.txt) | Paramètres du régime d’imposition des particuliers pour l’année d’imposition 2020 | https://www.finances.gouv.qc.ca/documents/Autres/fr/AUTFR_RegimeImpot2020.pdf | 2026-11-02 | `c99be200c13313e676e423e859360e43a5d698b11137b55937f200289f4e1928` |
| [rule-t4114](rule-t4114.txt) | untitled | https://publications.gc.ca/collections/collection_2019/arc-cra/Rv1-36-2019-eng.pdf?download=1 | 2026-11-02 | `71823ca91df934f391fce8bbe1e1701a7681ccaa028ce2b50c1b64403720b856` |

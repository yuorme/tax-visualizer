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
| [federal-ccb-calculation](federal-ccb-calculation.txt) | Canada child benefit (CCB) - calculation sheet for the | https://www.canada.ca/content/dam/cra-arc/serv-info/benefits/ccb18byclc-e.pdf | 2026-11-02 | `6333f160ed9e8ea548457bf9a5eafffb77d4146c81a7c0f2200248ca4ddd2970` |
| [federal-foreign-deduction](federal-foreign-deduction.txt) | Income Tax Act | https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-20-20190621.html | 2026-11-02 | `87488f2127ef16147ce010c7f137ac81faedab945fd42c37a920ca05ea81bde8` |
| [federal-gst-amounts](federal-gst-amounts.txt) | Report on Federal Tax Expenditures - Concepts, Estimates and Evaluations 2020: part 5 | https://www.canada.ca/en/department-finance/services/publications/federal-tax-expenditures/2020/part-5.html | 2026-11-02 | `eb394cc3c9c24ff666730767d811d8ac72403f465bf7db913d11f0e67ff6a793` |
| [federal-gst-rates](federal-gst-rates.txt) | Goods and services tax/harmonized sales tax (GST/HST) credit calculation sheet | https://www.canada.ca/content/dam/cra-arc/serv-info/benefits/gstc_covid-19_calc-e.pdf | 2026-11-02 | `68fc2c20db953203566e2510749c1f8867e81084df15fb66f1c9eb4f32b37784` |
| [federal-investment](federal-investment.txt) | Report on Federal Tax Expenditures - Concepts, Estimates and Evaluations 2020: part 4 | https://www.canada.ca/en/department-finance/services/publications/federal-tax-expenditures/2020/part-4.html | 2026-11-02 | `07d712ea9b363499d58e5cf10019ae3ce13623727cb0355a2d11913eb22fc2c6` |
| [federal-pension-components](federal-pension-components.txt) | Quarterly report of Canada Pension Plan and Old Age Security monthly amounts and related figures - October to December 2019 | https://www.canada.ca/en/employment-social-development/programs/pensions/pension/statistics/2019-quarterly-october-december.html | 2026-11-02 | `d16b9e220a73a25ccba48617ed6c7509c7eefc965c7a61bd92cb1846c213222e` |
| [federal-rrsp-limits](federal-rrsp-limits.txt) | MP, DB, RRSP, DPSP, ALDA, TFSA limits, YMPE and the YAMPE | https://www.canada.ca/en/revenue-agency/services/tax/registered-plans-administrators/pspa/mp-rrsp-dpsp-tfsa-limits-ympe.html | 2026-11-02 | `2933b5e561256306a81c3ab8c8fc550fee82a988911c3afb1471bd89ac893852` |
| [federal-rrsp-rate](federal-rrsp-rate.txt) | How contributions affect your RRSP deduction limit | https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans/contributing-a-rrsp-prpp/contributions-affect-your-rrsp-prpp-deduction-limit.html | 2026-11-02 | `481f3f2ad09497903e3841c00fac0d0f4b3ab71a4721369776406a378edf4d3d` |
| [federal-schedule3](federal-schedule3.txt) | Capital Gains (or Losses) in 2019 | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5000-s3/5000-s3-19e.pdf | 2026-11-02 | `fb521f034ef7646b4c377ce225d7e6668430829e67705477bdaaaf9502e613dc` |
| [federal-schedule6-5000](federal-schedule6-5000.txt) | Canada Workers Benefit | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5000-s6/5000-s6-19e.pdf | 2026-11-02 | `8bf9760e9d51e36bf4710af0577e8c55125458db8e1281f7df4a9ab3e90e81e6` |
| [federal-schedule6-5005](federal-schedule6-5005.txt) | Canada Workers Benefit | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5005-s6/5005-s6-19e.pdf | 2026-11-02 | `9ff02c252114daab064f3aae049fa1a72898738196ac1ee30875d48235576625` |
| [federal-schedule6-5009](federal-schedule6-5009.txt) | Canada Workers Benefit | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5009-s6/5009-s6-19e.pdf | 2026-11-02 | `9ad6e6f29a7199bb41bce00139fbbe576fae41664ac2a72401e67241f13a4241` |
| [federal-schedule6-5014](federal-schedule6-5014.txt) | Canada Workers Benefit | https://www.canada.ca/content/dam/cra-arc/formspubs/pbg/5014-s6/5014-s6-19e.pdf | 2026-11-02 | `5793696fcc2ac971574fb4275b0a94e0236a65ea18716ca1cab39de386d65d10` |
| [federal-t4127](federal-t4127.txt) | Microsoft Word - t4127-19e_clean.docx | https://www.canada.ca/content/dam/cra-arc/formspubs/pub/t4127-jan/t4127-01-19e.pdf | 2026-11-02 | `77b745fd0bd8271843a78bc32b4e94da37436b771c93f43d320d154f1075298e` |
| [federal-us-treaty](federal-us-treaty.txt) | Convention between Canada and the United States of America with Respect to Taxes on Income and on Capital | https://www.canada.ca/en/department-finance/programs/tax-policy/tax-treaties/country/united-states-america-convention-consolidated-1980-1983-1984-1995-1997-2007.html | 2026-11-02 | `a64d688824ed275a123459e3b8d0b77545ffbe273fef00212cd7ef9431ea1717` |
| [reference-rates-ab](reference-rates-ab.txt) | Alberta 2020 and 2019 Personal Marginal Income Tax Rates | https://www.taxtips.ca/priortaxrates/tax-rates-2019-2020/ab.htm | 2026-11-02 | `b9c024a560498ed1245dbea2fb641b5335809b86623b95e8fc4c31983e9087a0` |
| [reference-rates-bc](reference-rates-bc.txt) | BC 2020 and 2019 Personal Marginal Income Tax Rates | https://www.taxtips.ca/priortaxrates/tax-rates-2019-2020/bc.htm | 2026-11-02 | `f5758d9a7034c0d029d8ad18441309823f92aaf2b6029b49861e8c4ab0d42399` |
| [reference-rates-mb](reference-rates-mb.txt) | Manitoba 2020 and 2019 Personal Marginal Income Tax Rates | https://www.taxtips.ca/priortaxrates/tax-rates-2019-2020/mb.htm | 2026-11-02 | `ba5c0aee67e117807804e6c8153e658be952665f4ec90780a96cdaa254ebc35c` |
| [reference-rates-nb](reference-rates-nb.txt) | New Brunswick 2020 and 2019 Personal Marginal Income Tax Rates | https://www.taxtips.ca/priortaxrates/tax-rates-2019-2020/nb.htm | 2026-11-02 | `a30e4d7e4af0cfe44b5d2c6922f0828570cfce4eef1af7c1a775c692b7d6b040` |
| [reference-rates-nl](reference-rates-nl.txt) | Newfoundland & Labrador 2020 and 2019 Personal Marginal Income Tax Rates | https://www.taxtips.ca/priortaxrates/tax-rates-2019-2020/nl.htm | 2026-11-02 | `e172a55ba5eac70afdb409b2707859ff2962366be3cfba3d84794ef11b41ff77` |
| [reference-rates-ns](reference-rates-ns.txt) | Nova Scotia 2020 and 2019 Personal Marginal Income Tax Rates | https://www.taxtips.ca/priortaxrates/tax-rates-2019-2020/ns.htm | 2026-11-02 | `c5a7c49f4051286a33236050942d255c8f3f6b52d996f9028557cc668cc2b4ef` |
| [reference-rates-nt](reference-rates-nt.txt) | Northwest Territories 2020 and 2019 Personal Marginal Income Tax Rates | https://www.taxtips.ca/priortaxrates/tax-rates-2019-2020/nt.htm | 2026-11-02 | `dc2480957f106a5204fcc2d9cc8f19862c7b3b8e9b8c96ac7f9df1a58ba1f55a` |
| [reference-rates-nu](reference-rates-nu.txt) | Nunavut 2020 and 2019 Personal Marginal Income Tax Rates | https://www.taxtips.ca/priortaxrates/tax-rates-2019-2020/nu.htm | 2026-11-02 | `7e06cbd84aeaa9260556624beb047487874cc1cfc5c9be45048fde31d52f8bb0` |
| [reference-rates-on](reference-rates-on.txt) | Ontario 2020 and 2019 Personal Marginal Income Tax Rates | https://www.taxtips.ca/priortaxrates/tax-rates-2019-2020/on.htm | 2026-11-02 | `0ad33f25e576f4b63952bd309c4dd6cee1627f86a7988925f3643710f57fdcdf` |
| [reference-rates-pe](reference-rates-pe.txt) | Prince Edward Island 2020 and 2019 Personal Marginal Income Tax Rates | https://www.taxtips.ca/priortaxrates/tax-rates-2019-2020/pe.htm | 2026-11-02 | `d5be9145e1fe7722505c2815eddab02b202e98738c950058c117a3e22af6c14c` |
| [reference-rates-qc](reference-rates-qc.txt) | Quebec 2020 and 2019 Personal Marginal Income Tax Rates | https://www.taxtips.ca/priortaxrates/tax-rates-2019-2020/qc.htm | 2026-11-02 | `15bd800a8d24820944eadf0d05795176c79d88f8e2a8531a0c3994d58c669f5c` |
| [reference-rates-sk](reference-rates-sk.txt) | Saskatchewan 2020 and 2019 Personal Marginal Income Tax Rates | https://www.taxtips.ca/priortaxrates/tax-rates-2019-2020/sk.htm | 2026-11-02 | `9418608f36a768c44d0ec7bb3fdb310e0db02bc1f8553122d9f727929774a8a7` |
| [reference-rates-yt](reference-rates-yt.txt) | Yukon 2020 and 2019 Personal Marginal Income Tax Rates | https://www.taxtips.ca/priortaxrates/tax-rates-2019-2020/yt.htm | 2026-11-02 | `058f9875bd3385c5f1875eb2022241140900fddca0b9c80075cdf8ce6609635b` |

QPIP source exception: direct official retrieval returned HTTP 403. The 2019 row was transcribed from
the official Revenu Québec page through the web reader; the original-byte hash is unavailable.

| [federal-qpip](federal-qpip.txt) | Revenu Québec historical QPIP table | 2026-11-02 | Manual official-page extract; hash unavailable |

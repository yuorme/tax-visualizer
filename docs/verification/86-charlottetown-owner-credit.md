# Issue 86: owner credit needs more than a reference rate

Investigated November 4, 2026. Outcome: retain the reference rate and document the additional owner-credit
limitation, as agreed after investigating the issue's rate-only correction. Only comments changed in the two
PE data files; no data values, tests, assertions or golden cells changed.

## Resident credit already included

The [Provincial Tax Credit Program][resident] gives eligible resident owners a credit per $100 of assessment:
$0.50 through 2025 and $0.70 from 2026. [Stratford's official municipal tax page][stratford] states the 2025
provincial levy is $1.50. The [current provincial charges page][charges] states a $1.70 non-commercial levy.
Thus the net provincial rate is 1% in both years. Subtracting the resident credit again from the existing 1.67%
Charlottetown reference rate would double-count it.

Before/after: 2025 `propertyTax.rate` 0.0167 -> 0.0167; 2026 0.0167 -> 0.0167. No golden changes are justified
by this resident credit. The historical 2019–2024 files already use the net 1% provincial component.

## Separate owner credits cannot be a universal rate

Act sections 5.1 and 5.5 establish additional credits tied to continuous ownership since 2007 and 2023 respectively.
Regulations 24.1 and 24.3 calculate dollar credits from historical assessments and ownership days, rather than a
fixed percentage of today's home value. See cached Act pages 8–12 and Regulations pages 11–19 in
[the source index](2025/sources/INDEX.md). The [government's owner-credit explanation][owner] confirms purchases
after December 31, 2023 do not qualify for the 2024 credit.

Implementing these needs a property-tax program with eligibility/ownership and rental history, historical taxable
assessments, assessed improvements, applicable assessment increases and days owned; alternatively, an explicit
annual dollar credit supplied by the user. The existing actual annual bill override can already reflect relief.
The current data schema exposes only a reference rate; the engine fallback is home value multiplied by that rate.

## Exactly what 2024 needs

The current 2024 reference rate is correct: **0 percentage points of resident-rate correction**.
[Stratford's official 2024 comparison][comparison] explicitly lists Charlottetown's 1.50% provincial levy,
0.50% provincial credit, 0.67% municipal resident rate and 1.67% resident total. Its existing
[cached extract](2024/sources/provincial-property-charlottetown.txt) confirms the table. No 2024 data is changed.

What 2024 additionally needs for eligible owners is the **section 5.5 Owner-Occupied Residential Property
Credit**, calculated under [Regulations 24.3][regulations], pages 13–14. It offsets provincial tax attributable
to assessment growth through 2023 using a 2020 (or subsequent qualifying acquisition) assessment base, adjusted
for improvements and the 2024 assessment increase. It does not reduce the municipal rate. In addition to the
older section 5.1 credit, it needs continuous ownership since December 31, 2023 and the Act's occupancy/rental
conditions. The [government's explanation][owner] confirms that later purchases do not qualify.

For an eligible full-year resident owner, the 2024 section 5.5 credit in dollars is
`max(0, A - (B + C) × (1 + D)) × 0.01` (Regulations 24.3 with `E/F = 1` and `G = 0.50`).
`A` is the January 1, 2024 taxable assessment; `B` is the December 31, 2020 assessment or the later qualifying
acquisition assessment; `C` is the assessed construction/changes specified by the regulation; `D` is the 2024
assessment increase. Partial-year ownership uses `E/F`. The credit is zero when ineligible or the expression
is non-positive. Its reduction to an effective rate is `100 × credit / current taxable assessment` percentage
points, so there is **no universal rate reduction** to apply to 1.67%.

Illustrative independent calculation, not a published worked example: with `A = $250,000`, `B = $220,000`,
`C = $0`, `D = 2.9%`, full-year ownership and resident eligibility, the credit is
`($250,000 - $220,000 × 1.029) × 0.01 = $236.20`. Holding the model's home value equal to that taxable assessment,
the omitted credit overstates the bill by $236.20 and its effective rate by **0.09448 percentage points**:
the $4,175 reference estimate would become $3,938.80, or 1.57552%, from this credit alone. The government's
explanation supplies the 2.9% 2024 ceiling used here; the assessments are illustrative. There is no new fixture
because this PR changes no calculation and does not implement this credit.

2019–2024 need no resident-rate correction. They share the omitted legacy owner-credit limitation; 2024 also
omits section 5.5 as described above. A future implementation should cover the applicable historical years to
avoid a step in History at 2025. The 2022–2023 inflation subsidies require separate investigation.

## Retrieval and validation

`npm ci` and `npm run check` passed under Node 26: lint, typecheck, all 2,167 tests, build and Chromium smoke
tests (43 pages, 261 states, 40 contrast scans). Both edited PE YAML files parse identically to their originals.
There are no changed rule paths to map to golden cases and no changed existing assertions. Existing goldens
remain locked; all existing expected values are preserved.

`npm run year-diff -- 2025` and `npm run year-diff -- 2026` both passed. Their complete output is preserved in
[2025 output](86-year-diff-2025.txt) and [2026 output](86-year-diff-2026.txt):

```text
2025 against 2024: 389 changed (81 over 15%), 108 suspiciously unchanged, 40 added, 28 removed, 4 replaced;
23 unchanged values opted out.
2026 against 2025: 226 changed (12 over 15%), 127 suspiciously unchanged, 22 added, 23 removed, 4 replaced;
19 unchanged values opted out.
```

Every reported change and warning is pre-existing: both complete reports were compared byte for byte with
reports generated from an archive of HEAD's unchanged data before this commit. Both matched exactly. This PR
introduces no year-diff findings; the reports describe existing differences between years, outside this issue.
The unchanged 1.67% property rate is intentional for the resident-credit reasons above.

Direct `fetch-source` calls for the owner-credit explanation, resident-credit program and provincial charges
pages returned a Radware challenge: `Verifying your browser before proceeding...`. The web reader could read
these pages. Challenge extracts were discarded. Both official legislation PDFs downloaded successfully and
were cached with `fetch-source`; no source figures depend on a secondary publication. Stratford's official
2024 comparison was already cached. A labelled [web-reader paraphrase](2025/sources/issue-86-owner-credit-web-reader.txt)
preserves the owner-credit explanation's 2024 ceiling and terms; no original-publication hash is claimed.
The official Stratford page independently confirms the provincial resident-rate calculation.
Charlottetown search results did not yield a usable
official 2025/2026 budget during this investigation; its existing municipal component was left unchanged.

[resident]: https://www.princeedwardisland.ca/en/information/finance-and-affordability/provincial-tax-credit-program
[stratford]: https://townofstratford.ca/about-stratford/municipal-tax-rates/
[charges]: https://www.princeedwardisland.ca/en/information/finance-and-affordability/property-taxes-and-charges
[owner]: https://www.princeedwardisland.ca/en/information/finance/2024-owner-occupied-residential-property-credit
[comparison]: https://stratford.civicweb.net/document/145695/Property%20Tax%20rate%20info%20PEI%20Muncipalities.pdf?handle=B3C35C69B38A44879CD6127A49CE7B5C
[regulations]: https://www.princeedwardisland.ca/sites/default/files/legislation/r05g-real_property_tax_act_regulations.pdf

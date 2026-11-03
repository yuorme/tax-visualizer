# Comparison explanations in tooltips (#57)

The user's November 1 decision keeps the net-rate/lowest-province result summary and short row annotations visible.
The `.result-summary` and `.result-annotation` classes document that narrow distinction in `tests/e2e/rules.mjs`.
Sales, property and fuel rates, and child-benefit composition, retain their previous text and styling.
The hint rule still detects a newly inserted `.note` inside the comparison; no container exemption was added.
The exact #57 entry was removed from `KNOWN`, which is now empty.

Spouse and dependant explanations appear beside **Income tax detail**; the taxable-income breakdown appears beside
**Federal**; the payroll/clawback/negative-dividend explanation appears beside the **Marginal rate** heading.
All use the existing native info buttons and shared tooltip, including focus, Enter, hover, touch and Escape.
Attribute escaping preserves quoted investment-income wording. No engine, tax data or golden baseline changed.

## Verification

- Node 26, `npm ci`, `npm run format`, `npm run check`, and `npm run e2e -- --strict`.
- All 1,033 unit/reference/golden tests pass. Browser coverage is 24 pages, 213 states and 34 contrast scans;
  strict mode has no known failures or violations.
- `npm run compare -- origin/main`, based on `f8f23294975af0060de9373623da3b8e01b3c7c8`, reports three groups of
  intended text differences: the explanatory paragraphs disappear and info icons appear. No controls or result
  values change. The comparison command returns 1 when it finds these expected differences.
- Legacy smoke comparisons still compare every explanation word and computed amount, separately from the visible
  results. Only presentation whitespace and the info-icon text are normalized. Existing #13 wording adaptations
  remain checked. Deduction and childcare assertions retain their $22,200 and $12,000 expected amounts and now read
  the taxable-income tooltip attribute.
- Four conditional spouse/dependant cases run once at desktop: unrelated adults, disabled basic personal amounts,
  no spouse amount at higher incomes, and eligible dependant savings.
- Three responsive comparison states run at 375, 430 and 1000 pixels in light and dark: result/explanation separation,
  province/person changes without result or URL changes, and mouse/touch interaction. They check native button
  semantics, accessible descriptions, full tooltip content, bounded tooltip geometry, Enter, Tab, Escape and outside
  click/touch dismissal. Touch events use Chromium's touch emulation. One open-tooltip state adds contrast coverage
  at 375 pixels in each theme; text-only variants do not repeat contrast scans.

## Screenshots

Captured with `tests/e2e/page.mjs` and `settle`, with web fonts loaded, at 375, 430 and 1280 pixels in both themes.
The scenario includes a spouse, a child, Ontario/Quebec, investment/other income, deductions and a property value.
Each combination has a comparison image and all three open explanations, with no page errors or blocked requests.
The long taxable-income tooltip fits the 375-pixel viewport and retains the foreign-tax-credit explanation.

Local review artifacts are in `/private/tmp/tax57-screenshots/`:
`{375,430,1280}-{light,dark}-{comparison,spouse,taxable,marginal}.png`.
These are untracked inspection artifacts; the repeatable assertions are in `tests/e2e/responsive.mjs`.

## Merge

The issue's `needs-human` label requires the user to merge after independent review and passing CI.
The former flags dependency (#144) has merged; this branch targets `main`.

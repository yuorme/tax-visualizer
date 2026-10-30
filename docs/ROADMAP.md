# Roadmap

Working list of what's next. Expect it to change; once the repo is on GitHub, each item can become an issue.
Items list the files they mainly touch, so the orchestrator can tell which can run in parallel.

## Now

1. **GitHub Pages.** Turn on Pages (Settings → Pages → Source: GitHub Actions) and confirm the deploy job
   publishes. Node is pinned in `.node-version`, `package-lock.json` is committed and CI uses `npm ci`.
2. **Generate the page notes and tooltips from the data.** The methodology notes at the bottom and several
   tooltips state 2026 figures as text. Build them from the data so they can't drift, and so other years work.
   Files: `src/ui/index.html`, a new `src/ui/notes.ts`.
3. **Convert the page logic to TypeScript.** `src/ui/app.js` is plain JavaScript carried over from the original.
   Start after item 2 merges (same files).
4. **2025 data.** Copy 2026, update every value from official sources, add reference tests, capture golden
   results. Files: `data/years/2025/`, `tests/`. Can run in parallel with item 2.

## Next

5. **Year selector.** Choose the tax year; all 13 provinces recalculate. Depends on items 3 and 4.
6. **Provincial flags in the UI.** Waving flag icons are generated in `src/ui/flags/` (see
   `assets/flags/README.md`). Use them in the province selectors, the comparison header ("Ontario vs
   Alberta") and above the chart's column codes on wider screens only (columns are about 25 px wide on phones).
7. **Portfolio-based investment input.** Replace the four investment amounts with portfolio value, asset mix and
   average yield, converted into the amounts the engine already uses:
   - Canadian stocks → eligible dividends; US and international stocks → foreign dividends.
   - Bonds pay interest, which is taxed like salary but isn't employment income. The engine currently treats
     "employment and other income" as employment for CPP/EI, so interest needs its own income type first.
   - Capital gains depend on what's sold, not portfolio value: keep a separate input or an assumed share realized.
   - Keep a toggle for the current manual entry view; non-eligible dividends only appear there.
   - The goal is a quick estimate, not matching tax slips.
8. **Shareable links.** Keep inputs in the URL so a published chart links to its exact scenario.

## Later

9. **Historical years.** Back to 2019 or 2016 (see `docs/SCOPE.md`, open questions). Each year gets reference
   tests. Rule changes become new program ids (e.g. the Working Income Tax Benefit before the Canada Workers
   Benefit, the federal 15% lowest rate before 2025).
10. **CPI-adjusted historical view.** A separate view comparing tax over the years for the same household.
    Default: the same real income (today's dollars) taxed under each year's rules; a toggle switches to the same
    nominal income. Needs an annual CPI series from Statistics Canada as a data file. Depends on item 9.
11. **Scope revisits.** Renters' property tax through rent; fuel tax. See `docs/SCOPE.md`.

## Parked

- **US states.** Local income and sales taxes make it a much larger job; if revisited, use an existing engine
  (PolicyEngine US) to compute results offline rather than writing state modules.

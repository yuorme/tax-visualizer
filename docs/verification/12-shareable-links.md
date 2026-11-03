# Shareable scenarios (#12)

The address bar is kept current with a versioned fragment using `history.replaceState`, so edits do not create
one browser-history entry per keystroke. Fragments are not sent in HTTP requests. Copy link uses the clipboard;
when that API is unavailable or denied, a readonly selected field supports manual copying, including local files.

## State contract

`#s=1&year=2026` is an explicit default scenario. It must retain its marker to override a recipient's saved
scenario. The year is always present so adding another data year cannot change an existing link. Other defaults
are omitted, including zero-valued person fields and the household-size spending default. Nondefault values are
JSON-encoded URL parameters, avoiding locale-dependent parsing of currency and decimal separators.

The version-1 inventory covers:

- Tax year, all incomes and itemized deductions for both people, selected adult, spouse switch and household counts.
- Home/destination, comparison adult view, chart metric/sort, historical mode and real/nominal basis.
- Basic/refundable-credit switches and foreign withholding rate.
- Home value, retained rent, owner/renter mode, municipal-rate override and annual property-tax bill.
- Taxable spending and its retained household-size adjustment.
- Canonical metric distance/efficiency overrides, their explicit zero versus automatic defaults, and display units.
- Childcare monthly/annual amounts, retained child rows and ages, disability/infirmity/Quebec flags, earnings
  overrides, manual claims, mode and touched/invalid draft state. The existing model validates these inputs.
- The selected input tab. Pure disclosure state, such as an expanded tooltip or deductions panel, is not a tax input.

New input tickets must extend this inventory, defaults, validation and the browser round-trip case. Changing the
meaning of omitted defaults requires a new URL version. Local-storage version 3 is separate from URL version 1.

## Precedence and invalid input

A recognized scenario marker always takes precedence over local storage, including when every value is default.
No marker means ordinary navigation restores the existing local saved scenario. Unknown versions, duplicate
version markers and excessive fragments reset to defaults. Invalid, duplicate or unknown fields are ignored
individually; supported fields retain their valid values. Future or unavailable tax years use the latest loaded
year. Province codes, enums, booleans, finite numeric ranges and integer household counts are checked before use.
Nested childcare values are normalized through the existing draft model rather than injected into the DOM.

The restore guard for the retained spending adjustment now accommodates the largest existing spending control
value. That control can produce an adjustment above the previous saved-state guard, which otherwise would have
changed spending on reload. No spending calculation or tax formula changes.

## Verification

Unit cases cover compact defaults, a future newly available year, every state field, signed capital losses,
explicit zeros, manual childcare and invalid drafts, derived spending, old/duplicate/malformed parameters and
hostile nested objects. The full browser case copies the address into a fresh browser context with conflicting
local storage and compares all saved state and displayed results. Further cases cover history mode, invalid
childcare drafts, retained disabled values, clipboard success/failure and same-document scenario navigation.

Existing saved-state migration tests now clear the fragment before seeding local storage; their original assertions
remain intact. Regular reload tests retain it. Responsive checks expose the fallback link at 375, 430 and desktop
width in both themes. Existing engine/data/golden fixtures remain unchanged.

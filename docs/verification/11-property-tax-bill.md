# Annual property-tax bill (#11)

An owner's optional bill replaces the home-province property-tax estimate. Blank keeps value × rate; zero is
an explicit bill. Other provinces retain their city-rate estimates. The same bill feeds property-based credits,
so totals do not mix an actual bill with credits calculated from an unrelated estimate.

The UI retains the bill across year changes and while renting (where it is inactive). Changing the home province
clears the bill, matching the existing municipal-rate override. The retained rate is disabled while a bill applies
and becomes active again when the bill is cleared. A bill also works before a home valuation has been entered;
other provinces then have a zero valuation until the user supplies one. The tooltip explains the city-rate
comparison and asks for the bill before credits calculated here to avoid counting that relief twice.

Real-dollar history scales the bill along with the other monetary inputs. Nominal comparisons retain the amount.
No tax parameter or formula has changed, and no existing golden fixture is rewritten.

## Independent feature expectations

`tests/property-tax-bill.test.ts` executes the separate committed fixture
`tests/golden/features/property-tax-bill.json`; it has no capture/update mode.

All cases use a $500,000 home and $100,000 of other income unless specified. The municipal rates are the existing
2026 data: Toronto 0.76% and Winnipeg 1.38%. Thus blank bills give $3,800 and $6,900 respectively. A $4,200.25
Ontario bill gives that exact amount regardless of the rate, and leaves Winnipeg at $6,900. Explicit zero gives
zero; a supplied bill does not require the home valuation. Invalid negative/non-finite bills fall back to the
existing estimate. Extra tests cover every province's unchanged result with an empty or inapplicable bill map.

The Manitoba homeowners credit uses the existing sourced cap of $1,600:
`min(bill, 1600)`. Bills $800/$1,600/$2,400 give credits $800/$1,600/$1,600; a zero bill gives zero. The
[Manitoba data](../../data/years/2026/provinces/MB.yaml) lists the source and current model assumptions.

The Ontario cases have $20,000 other income, below the existing credit reduction threshold. The energy/property
credit is `min(bill,290) + min(bill, min(0.10×bill,944)+73)`. At $50 it is $50+$50=$100; at $1,000 it is
$290+$173=$463; at zero there is no occupancy-based credit. These are tests of bill propagation through the
existing rule, not a new legal interpretation. See the sourced
[Ontario data](../../data/years/2026/provinces/ON.yaml).

For each golden case, the gross-tax change must equal the property-tax change, and the net-tax change must equal
that change less the change in refundable credits. Historical scaling independently checks $4,200 × 0.8 = $3,360,
preserves explicit zero, and leaves the caller's input unchanged.

Browser assertions cover the optional/zero semantics, home-only replacement, tooltip, persistence, year/tenure
changes, clearing and restoring the existing rate, invalid input, and home-province reset. The responsive suite
fills the control at desktop, 430 px and 375 px in both themes and checks that the amount is not clipped.

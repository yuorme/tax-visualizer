# Driving units (#8)

The driving panel stores kilometres and litres per 100 kilometres in memory and in the existing saved scenario.
A separate `drivingUnits` preference selects metric or US display; missing or unrecognized preferences use metric.
Toggling units changes neither canonical amount nor the distinction between defaults and user overrides.

## Conversion evidence

- The international mile is exactly 1,609.344 metres:
  [NIST conversion table](https://www.nist.gov/pml/us-surveyfoot/revised-unit-conversion-factors).
- The US liquid gallon is exactly 231 cubic inches, or 3.785411784 litres:
  [NIST Handbook 44, Appendix C](https://www.nist.gov/system/files/documents/2023/01/30/appc-23-HB44.pdf).
- NRCan's guide distinguishes its imperial-gallon ratings from the US-gallon display commonly used by vehicle
  computers. One imperial gallon is about 1.2 US gallons:
  [2024 Fuel Consumption Guide](https://publications.gc.ca/collections/collection_2024/rncan-nrcan/M141-5-2024-eng.pdf).

Thus 10,000 miles equals 16,093.44 km. A vehicle getting 30 US mpg consumes
`100 / (30 × 1.609344) × 3.785411784 = 7.840486111111111` litres per 100 km.
The dedicated unit test uses that independently calculated result.

Zero fuel consumption displays as infinite US mpg. Entering zero remains a convenient explicit no-gasoline input,
as explained in the units tooltip. Invalid or negative inputs become zero; conversion never writes infinity into
the saved metric amounts. Existing metric input limits still apply after conversion.

## Verification

The browser assertions check both units together, exact preservation of saved amounts and rendered tax results
after repeated toggles, reload persistence, province-dependent defaults, reset, decimal-comma mpg, zero and invalid
inputs, slider keyboard endpoints and accessible miles text, and unclipped converted values. The existing browser
matrix checks mobile overflow and colour contrast. Unit tests check dimensional conversion and zero consumption.
All tax data, engine code and existing golden files remain unchanged.

The distance display rounds to three decimal places and efficiency to six; those rounded strings are never read
back during a toggle or a blur. Editing an input intentionally replaces its canonical amount with the new input.

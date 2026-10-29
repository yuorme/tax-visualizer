# Provincial and territorial flags

`source/` holds the flat flag SVGs from Google's region-flags collection
(https://github.com/google/region-flags), which were downloaded from Wikimedia Commons and checked to be in the
public domain (see `source/COPYING`). Files are named by ISO 3166-2 code (`CA-ON.svg`).

`scripts/make-flags.mjs` turns them into the waving icons in `src/ui/flags/` (72 × 54 PNG, shown at half size or
smaller). The wave, shading, corner radius and outline are set in its `STYLE` block; rerun the script after
changing them.

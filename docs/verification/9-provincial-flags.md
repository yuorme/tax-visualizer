# Provincial flags (#9)

The supplied waving PNG assets identify the selected province in each native selector and the home province
in the comparison heading. Native option menus retain their text labels and keyboard behavior. Chart flags sit
above the existing two-letter codes above 520 px; phone charts keep their original compact labels.

The build imports all thirteen assets as data URLs into the single HTML file. Flags are decorative: empty alt
text and `aria-hidden` preserve the existing province names and chart descriptions for assistive technology.
The marginal-rate axis label follows the added desktop flag row.

Browser assertions compare the inline image bytes with each source asset for every home/destination selection
and chart column. They also cover province swaps, URL hydration after clearing storage, year changes, sorting,
history mode and native keyboard type-ahead. Responsive assertions at 375, 430 and 1000 px in both themes check
loaded images, selector bounds, desktop flag placement and hidden phone chart flags.

The required comparison against `origin/main` found no visible-text, control-state or result differences.
Six font-loaded screenshot combinations were inspected, including long Newfoundland and Labrador / Northwest
Territories comparison labels. The page remains free of sideways scrolling and external image requests.

Engine code, tax data and existing golden fixtures are unchanged. The UI adds decoration within the current
layout; it does not replace the native selectors or restructure the input panels.

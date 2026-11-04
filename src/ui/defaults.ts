// Starting values for the page's inputs. Shared by the page and the tests, so the notes that quote them are checked
// against the functions the page actually uses.

/** Starting employment income for each person. */
export const DEFAULT_INCOME = 75000;

/**
 * Monthly taxable spending estimate for a household of n people, to the nearest $100: about $2,012 × √n.
 * How the per-person amount was built is explained in the page notes ("Spending by household size").
 */
export const spendEst = (n: number) => Math.round((2012 * Math.sqrt(Math.max(1, n))) / 100) * 100;

/**
 * Starting assumptions for the Portfolio view, as whole-portfolio percentages. They are starting values for a quick
 * estimate rather than tax parameters, so they don't vary by tax year: switching years can't change a portfolio's
 * income. Saved scenarios and links store their own copy once the view is used, so editing these changes no result.
 *
 * estimated: not published figures. Derived from a broad Canadian balanced index fund, Vanguard Balanced ETF Portfolio
 * (VBAL), as at Sep 30 2026. Mix: Canadian stocks 18.08%; U.S. and international stocks 43.73% (27.98 + 11.05 + 4.70);
 * bonds 38.16% (22.89 + 7.84 + 7.43); each rounded to the nearest 10 points. Yield: the fund's 2.22% distribution
 * yield rounded to one decimal, a single rate for the whole portfolio, as the fund reports it.
 */
export const PORTFOLIO_DEFAULTS = {
  estimated: true,
  canadian: 20,
  foreign: 40,
  bonds: 40,
  yieldPct: 2.2,
  basis: "Vanguard Balanced ETF Portfolio as at Sep 30 2026",
  source: {
    label: "Vanguard Canada, Vanguard Balanced ETF Portfolio (holdings and yield as at Sep 30 2026)",
    url: "https://www.vanguard.ca/en/product/etf/asset-allocation/9578/vanguard-balanced-etf-portfolio",
  },
} as const;

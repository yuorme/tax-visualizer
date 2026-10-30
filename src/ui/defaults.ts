// Starting values for the page's inputs. Shared by the page and the tests, so the notes that quote them are checked
// against the functions the page actually uses.

/** Starting employment income for each person. */
export const DEFAULT_INCOME = 75000;

/**
 * Monthly taxable spending estimate for a household of n people, to the nearest $100: about $2,012 × √n.
 * How the per-person amount was built is explained in the page notes ("Spending by household size").
 */
export const spendEst = (n: number) => Math.round((2012 * Math.sqrt(Math.max(1, n))) / 100) * 100;

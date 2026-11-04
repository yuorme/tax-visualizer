import assert from "node:assert/strict";
import { settle } from "./page.mjs";

const fill = async (p, id, amount) => {
  await p.fill(`#${id}`, amount);
  await p.locator(`#${id}`).blur();
};
const openIncome = async p => {
  if ((await p.getAttribute("#tab-income", "aria-expanded")) !== "true") await p.click("#tab-income");
};
const pressed = (p, id) => p.getAttribute(`#${id}`, "aria-pressed");
const saved = p => p.evaluate(() => JSON.parse(localStorage.getItem("taxcmp")));
/** What a person sees as the answer: the chart, the comparison and every ledger, without the input summaries. */
const results = async p => ({
  title: await p.textContent("#chart-title"),
  columns: await p.locator("#cols .col").evaluateAll(cols => cols.map(c => c.getAttribute("aria-label"))),
  detail: await p.textContent("#detail-body"),
});
/** Replaces the page's state, as a returning visitor's saved scenario would. */
const load = async (p, state) => {
  await p.evaluate(state => {
    localStorage.setItem("taxcmp", JSON.stringify(state));
    history.replaceState(null, "", location.pathname);
  }, state);
  await p.reload();
  await settle(p);
};
const person = { ord: 75000, oth: 1200, cg: 2500, ed: 300, nd: 400, fd: 500, ded: 0 };
const base = { v: 3, year: 2026, adults: 1, home: "ON", dest: "AB", tab: "income" };
const manualVisible = async (p, visible) => {
  for (const id of ["ed", "nd", "fd"]) assert.equal(await p.locator(`#${id}`).isVisible(), visible, id);
};

export const PORTFOLIO_STEPS = [
  [
    "the manual view stays the default, with the page's results unchanged, for a saved scenario without a portfolio",
    async p => {
      await load(p, { ...base, people: [person] });
      assert.equal(await pressed(p, "invest-view-manual"), "true");
      assert.equal(await pressed(p, "invest-view-portfolio"), "false");
      assert.equal(await p.locator("#pf-body").isVisible(), false);
      await manualVisible(p, true);
      assert.equal(await p.inputValue("#nd"), "400");
      assert.equal(await p.textContent("#tab-income-sum"), "$4.9k");
      assert.deepEqual((await saved(p)).portfolios, []);
      assert.doesNotMatch(await p.evaluate(() => location.hash), /portfolios/);
    },
  ],
  [
    "acceptance: the portfolio view converts to the engine's inputs, matching the same amounts entered by hand",
    async p => {
      await load(p, { ...base, people: [{ ...person, oth: 1200 + 6000, ed: 4500, nd: 0, fd: 4500 }] });
      const typed = await results(p);
      await load(p, { ...base, people: [person] });
      await p.click("#invest-view-portfolio");
      await settle(p);
      assert.equal(await p.locator("#pf-body").isVisible(), true);
      await fill(p, "pf-value", "500,000");
      await fill(p, "pf-canadian", "30");
      await fill(p, "pf-foreign", "30");
      await fill(p, "pf-bonds", "40");
      await fill(p, "pf-yield", "3");
      assert.equal(await p.inputValue("#pf-value"), "500,000");
      assert.deepEqual(await results(p), typed);
      assert.equal(
        await p.textContent("#invest-sum"),
        "$2,500 net gains · $4,500 eligible div. · $4,500 foreign div. · $6,000 bond interest · Manual dividends not counted",
      );
      assert.equal(await p.textContent("#other-sum"), "$7,200 a year, including $6,000 bond interest");
      assert.equal(await p.locator("#legend-wh").isVisible(), true);
      assert.equal(await p.inputValue("#oth"), "1,200", "the typed other income is not rewritten");
    },
  ],
  [
    "capital gains and the withholding rate stay available in the portfolio view",
    async p => {
      await manualVisible(p, false);
      assert.equal(await p.locator("#cg").isVisible(), true);
      assert.equal(await p.inputValue("#cg"), "2,500");
      assert.equal(await p.locator("#wh").isVisible(), true);
      const before = await results(p);
      await fill(p, "cg", "5,000");
      assert.notDeepEqual(await results(p), before);
      await fill(p, "cg", "2,500");
      await p.selectOption("#wh", "0.3");
      assert.notDeepEqual(await results(p), before);
      await p.selectOption("#wh", "0.15");
      assert.deepEqual(await results(p), before);
    },
  ],
  [
    "acceptance: the manual view stays available and switching either way keeps what was typed",
    async p => {
      const portfolioResults = await results(p);
      await p.click("#invest-view-manual");
      await settle(p);
      assert.equal(await p.locator("#pf-body").isVisible(), false);
      await manualVisible(p, true);
      assert.equal(await p.inputValue("#ed"), "300");
      assert.equal(await p.inputValue("#nd"), "400");
      assert.equal(await p.inputValue("#fd"), "500");
      assert.match(
        await p.textContent("#invest-sum"),
        /\$300 eligible div\. · \$400 non-eligible div\. · \$500 foreign/,
      );
      await fill(p, "nd", "450");
      await p.click("#invest-view-portfolio");
      await settle(p);
      assert.equal(await p.inputValue("#pf-value"), "500,000");
      assert.equal(await p.inputValue("#pf-canadian"), "30");
      assert.equal(await p.inputValue("#pf-yield"), "3");
      assert.deepEqual(await results(p), portfolioResults, "non-eligible dividends don't count in the portfolio view");
      await p.click("#invest-view-manual");
      await settle(p);
      assert.equal(await p.inputValue("#nd"), "450");
    },
  ],
  [
    "both views survive a reload and a copied link",
    async p => {
      await p.click("#invest-view-portfolio");
      await settle(p);
      const before = await results(p);
      const link = await p.evaluate(() => location.hash);
      assert.match(decodeURIComponent(link), /"view":"portfolio"/);
      await p.reload();
      await settle(p);
      assert.equal(await pressed(p, "invest-view-portfolio"), "true");
      assert.deepEqual(await results(p), before);
      await p.evaluate(() => localStorage.clear()); // a recipient has only the link
      await p.reload();
      await settle(p);
      assert.equal(await pressed(p, "invest-view-portfolio"), "true");
      assert.deepEqual(await results(p), before);
      await p.click("#invest-view-manual");
      await settle(p);
      assert.equal(await p.inputValue("#nd"), "450");
      const manualLink = await p.evaluate(() => location.hash);
      assert.match(decodeURIComponent(manualLink), /"value":500000/, "the manual view still carries the portfolio");
      await p.reload();
      await settle(p);
      assert.equal(await pressed(p, "invest-view-manual"), "true");
      await p.click("#invest-view-portfolio");
      await settle(p);
      assert.equal(await p.inputValue("#pf-value"), "500,000");
    },
  ],
  [
    "acceptance: every assumption is in a tooltip, not on the page",
    async p => {
      await load(p, { ...base, people: [person], portfolios: [{ view: "portfolio" }] });
      assert.equal(await p.inputValue("#pf-canadian"), "20");
      assert.equal(await p.inputValue("#pf-foreign"), "40");
      assert.equal(await p.inputValue("#pf-bonds"), "40");
      assert.equal(await p.inputValue("#pf-yield"), "2.2");
      const tip = note => p.getAttribute(`[data-note="${note}"]`, "data-tip");
      assert.match(await tip("portfolioView"), /Non-eligible dividends are entered in Manual only/);
      assert.match(await tip("portfolioView"), /won't match your slips/);
      assert.match(await tip("portfolioValue"), /Leave out TFSAs, RRSPs/);
      assert.match(await tip("portfolioMix"), /20% Canadian stocks, 40% U.S. and international stocks and 40% bonds/);
      assert.match(await tip("portfolioMix"), /eligible dividends/);
      assert.match(await tip("portfolioMix"), /foreign dividends/);
      assert.match(await tip("portfolioMix"), /added to any amount under Other income/);
      assert.match(await tip("portfolioMix"), /scaled to 100%/);
      assert.match(await tip("portfolioYield"), /starts at 2.2%/);
      assert.match(await tip("portfolioYield"), /Vanguard Balanced ETF Portfolio as at Sep 30 2026/);
      assert.match(await tip("portfolioYield"), /no gains are assumed to be realized/);
      await p.locator('[data-note="portfolioMix"]').hover();
      await settle(p);
      assert.equal(await p.locator("#tip").isVisible(), true);
      assert.match(await p.textContent("#tip"), /Shares that don't total 100%/);
      await p.mouse.move(0, 0);
      assert.equal(
        await p.getAttribute("#portfolio-source", "href"),
        "https://www.vanguard.ca/en/product/etf/asset-allocation/9578/vanguard-balanced-etf-portfolio",
      );
      assert.match(await p.textContent("#default-sources"), /Portfolio assumptions: Vanguard Canada/);
    },
  ],
  [
    "a mix that doesn't total 100 is flagged and scaled, and unreadable boxes are safe",
    async p => {
      await load(p, {
        ...base,
        people: [{ ord: 75000 }],
        portfolios: [{ view: "portfolio", value: 100000, canadian: 50, foreign: 0, bonds: 50, yieldPct: 4 }],
      });
      assert.equal(await p.locator("#pf-mix-status").isVisible(), false);
      assert.match(await p.textContent("#invest-sum"), /^\$2,000 eligible div\. · \$2,000 bond interest$/);
      await fill(p, "pf-bonds", "150");
      assert.equal(await p.inputValue("#pf-bonds"), "100", "a share can't pass 100");
      assert.equal(await p.textContent("#pf-mix-status"), "Mix totals 150%: scaled to 100%");
      assert.equal(await p.locator("#pf-mix-status").isVisible(), true);
      assert.match(await p.textContent("#invest-sum"), /^\$1,333 eligible div\. · \$2,667 bond interest$/);
      await fill(p, "pf-canadian", "");
      await fill(p, "pf-bonds", "");
      assert.equal(await p.textContent("#pf-mix-status"), "Mix totals 0%: no income");
      assert.equal(await p.textContent("#invest-sum"), "none added");
      await fill(p, "pf-value", "abc");
      assert.equal(await p.inputValue("#pf-value"), "0");
      await fill(p, "pf-yield", "1.2.3");
      assert.equal(await p.inputValue("#pf-yield"), "0");
    },
  ],
  [
    "damaged saved portfolios and links open safely",
    async p => {
      await load(p, { ...base, people: [person], portfolios: "broken" });
      assert.equal(await pressed(p, "invest-view-manual"), "true");
      await load(p, { ...base, people: [person], portfolios: [{ view: "both", value: 5 }, 7] });
      assert.equal(await pressed(p, "invest-view-manual"), "true");
      await p.evaluate(() => {
        history.replaceState(null, "", '#s=1&portfolios=[{"view":"portfolio","value":1e999,"yieldPct":"x"}]');
      });
      await p.reload();
      await settle(p);
      assert.equal(await pressed(p, "invest-view-portfolio"), "true");
      assert.equal(await p.inputValue("#pf-value"), "0");
      assert.equal(await p.inputValue("#pf-yield"), "2.2");
    },
  ],
  [
    "each person has their own view, and one person's view leaves the other's amounts counted",
    async p => {
      await load(p, {
        ...base,
        adults: 2,
        people: [person, { ...person, ord: 50000, ed: 900, nd: 0, fd: 0, oth: 0, cg: 0 }],
        portfolios: [null, { view: "portfolio", value: 100000, canadian: 100, foreign: 0, bonds: 0, yieldPct: 5 }],
        active: 0,
      });
      assert.equal(await pressed(p, "invest-view-manual"), "true");
      await manualVisible(p, true);
      assert.match(await p.textContent('#people [data-i="1"]'), /\$55,000/);
      await p.click('#people [data-i="1"]');
      await settle(p);
      assert.equal(await pressed(p, "invest-view-portfolio"), "true");
      assert.equal(await p.inputValue("#pf-value"), "100,000");
      assert.match(await p.textContent("#invest-sum"), /^\$5,000 eligible div\. · Manual dividends not counted$/);
      await p.click("#invest-view-manual");
      await settle(p);
      assert.match(await p.textContent('#people [data-i="1"]'), /\$50,900/);
      await p.click("#invest-view-portfolio");
      await settle(p);
      await p.click("#remove-partner");
      await settle(p);
      assert.equal(await pressed(p, "invest-view-manual"), "true");
      assert.deepEqual((await saved(p)).portfolios, []);
      await p.click("#add-partner");
      await settle(p);
      assert.equal(await pressed(p, "invest-view-manual"), "true", "a new partner doesn't inherit a removed portfolio");
    },
  ],
];

// One representative state for every width and theme: the phone layouts are where these fields could overflow.
export const PORTFOLIO_RESPONSIVE_STEPS = [
  [
    "layout: the portfolio view fits, with a long value and a flagged mix",
    async p => {
      await p.click("#view-provinces");
      await openIncome(p);
      await p.click("#invest-view-portfolio");
      await settle(p);
      await fill(p, "pf-value", "99,999,999");
      await fill(p, "pf-yield", "12.25");
      await fill(p, "pf-canadian", "33.33");
      await fill(p, "pf-foreign", "33.33");
      await fill(p, "pf-bonds", "12.5");
      const problems = [];
      for (const id of ["pf-value", "pf-yield", "pf-canadian", "pf-foreign", "pf-bonds"])
        if (await p.$eval(`#${id}`, input => input.scrollWidth > input.clientWidth + 1))
          problems.push(`#${id} clips its value`);
      // An input wider than its column clips nothing, so check the boxes as well as each input's own text.
      const panel = await p.locator("#panel-income").boundingBox();
      const boxes = await p.locator("#pf-body .money").evaluateAll(all =>
        all.map(el => {
          const { left, right, top } = el.getBoundingClientRect();
          return { left, right, top };
        }),
      );
      for (const [i, box] of boxes.entries()) {
        if (box.right > panel.x + panel.width) problems.push(`portfolio box ${i} overflows the panel`);
        const next = boxes[i + 1];
        if (next && next.top === box.top && box.right > next.left)
          problems.push(`portfolio box ${i} overlaps the next`);
      }
      return problems;
    },
    { contrast: true },
  ],
  [
    "layout: the manual view returns intact after the portfolio view",
    async p => {
      await p.click("#invest-view-manual");
      await settle(p);
      const problems = [];
      for (const id of ["ed", "nd", "fd", "wh"])
        if (!(await p.locator(`#${id}`).isVisible())) problems.push(`#${id} is hidden in the manual view`);
      return problems;
    },
  ],
];

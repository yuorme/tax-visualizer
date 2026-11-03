// Representative visual states. Detailed arithmetic, migration and persistence cases run once in smoke.mjs;
// these interactions expose each panel and the controls whose geometry or colours can vary by viewport/theme.
import assert from "node:assert/strict";
import { listYears } from "../../src/data/load.ts";
import { expectChildcareFits } from "./childcare.mjs";

const fill = async (p, selector, value) => {
  await p.fill(selector, value);
  await p.locator(selector).blur();
};
const openTab = async (p, name) => {
  if ((await p.getAttribute(`#tab-${name}`, "aria-expanded")) !== "true") await p.click(`#tab-${name}`);
  assert.equal(await p.locator(`#panel-${name}`).isVisible(), true);
};
const openDetails = async (p, selector) => {
  if (!(await p.$eval(selector, el => el.open))) await p.locator(`${selector} > summary`).click();
};

export const RESPONSIVE_STEPS = [
  [
    "layout: flags fit selectors and heading, with chart flags only on wide screens",
    async p => {
      await p.selectOption("#home", "NL");
      await p.selectOption("#dest", "NT");
      for (const selector of ["#home-flag", "#cmp-home-flag", "#dest-flag"]) {
        assert.equal(await p.locator(selector).isVisible(), true);
        assert.equal(await p.locator(selector).evaluate(el => el.complete && el.naturalWidth > 0), true);
      }
      for (const selector of ["#home", "#dest"]) {
        const box = await p.locator(selector).boundingBox();
        assert.ok(box.x >= 0 && box.x + box.width <= p.viewportSize().width, `${selector} fits`);
      }
      assert.equal(await p.locator(".code .province-flag:visible").count(), p.viewportSize().width > 520 ? 13 : 0);
      const order = await p.locator("#col-NL .code").evaluate(el => {
        const image = el.querySelector("img");
        const text = document.createRange();
        text.selectNode(el.lastChild);
        return { imageBottom: image.getBoundingClientRect().bottom, textTop: text.getBoundingClientRect().top };
      });
      if (p.viewportSize().width > 520) assert.ok(order.imageBottom <= order.textTop, "flag is above the code");
    },
  ],
  [
    "layout: scenario link can be copied with the clipboard unavailable",
    async p => {
      await p.evaluate(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined }));
      await p.click("#copy-link");
      assert.equal(await p.inputValue("#share-url"), p.url());
      assert.equal(await p.locator("#share-url").isVisible(), true);
      assert.equal(await p.$eval("#share-url", el => el.getBoundingClientRect().right <= innerWidth), true);
    },
  ],
  [
    "layout: latest year with fuel tax",
    async p => {
      await p.selectOption("#tax-year", String(Math.max(...listYears())));
      await p.click("#tab-driving"); // the year-switch setup leaves Driving open; close it
      assert.equal(await p.locator("#legend-fuel").isVisible(), true);
    },
  ],
  [
    "layout: income and investment controls",
    async p => {
      await p.click("#add-partner");
      await openTab(p, "income");
      await fill(p, "#oth", "12,000");
      await fill(p, "#cg", "20,000");
      const top = selector => p.$eval(selector, el => el.getBoundingClientRect().top);
      assert.ok((await top("#oth")) < (await top("#cg")), "other income precedes investments");
    },
  ],
  [
    "layout: home rental controls",
    async p => {
      await openTab(p, "home");
      await p.click('[data-tenure="rent"]');
      await fill(p, "#rent", "1,200");
      assert.equal(await p.locator("#rent").isVisible(), true);
    },
  ],
  [
    "layout: home ownership controls",
    async p => {
      await p.click('[data-tenure="own"]');
      await fill(p, "#hv", "750,000");
      await fill(p, "#property-tax-bill", "12,345.67");
      assert.equal(await p.locator("#property-tax-bill").inputValue(), "12,345.67");
      assert.equal(await p.locator("#pr-rate").isDisabled(), true);
      assert.equal(await p.locator("#property-tax-bill").evaluate(el => el.scrollWidth > el.clientWidth + 1), false);
      assert.equal(await p.locator("#hv").isVisible(), true);
    },
  ],
  [
    "layout: credits and dollar chart",
    async p => {
      await openTab(p, "credits");
      await p.click("#m-usd");
      assert.equal(await p.locator("#cred-list").isVisible(), true);
    },
  ],
  [
    "layout: driving controls and reset",
    async p => {
      await openTab(p, "driving");
      await fill(p, "#km", "25,000");
      assert.equal(await p.locator("#km-reset").isVisible(), true);
      await p.click("#m-pct");
    },
  ],
  [
    "layout: expanded itemized deductions",
    async p => {
      await openDetails(p, "#deductions");
      await fill(p, "#rrsp", "8,000");
      await fill(p, "#fhsa", "4,000");
      assert.equal(await p.textContent("#ded-total"), "$12,000");
    },
  ],
  [
    "layout: childcare rows and Quebec fields",
    async p => {
      await p.selectOption("#home", "QC");
      await p.locator("#kids").evaluate(el => {
        el.value = "2";
        el.dispatchEvent(new Event("input", { bubbles: true }));
      });
      await fill(p, "#childcare-monthly", "1,000");
      await openDetails(p, "#childcare-details");
      for (const [i, age] of ["4", "10"].entries()) {
        await fill(p, `#care-age-${i}`, age);
        await fill(p, `#care-expenses-${i}`, "6,000");
        await openDetails(p, `#care-quebec-${i}`);
        await fill(p, `#care-qc-${i}`, "6,000");
      }
      assert.equal(await p.locator(".care-child").count(), 2);
      await expectChildcareFits(p);
    },
  ],
  [
    "layout: expanded childcare exceptions and earnings overrides",
    async p => {
      await openDetails(p, "#care-exceptions-0");
      await openDetails(p, "#care-adjustments");
      await p.check("#care-override-0");
      await p.check("#care-override-1");
      assert.equal(await p.locator("#care-earnings-0").isVisible(), true);
      assert.equal(await p.locator("#care-earnings-1").isVisible(), true);
      await expectChildcareFits(p);
    },
  ],
  [
    "layout: invalid childcare drafts and error styling",
    async p => {
      await p.selectOption("#care-mode", "manual");
      assert.equal(await p.locator("#care-claim-1").isVisible(), true);
      await fill(p, "#care-age-0", "abc");
      await fill(p, "#care-claim-0", "-1");
      for (const selector of ["#care-age-0", "#care-claim-0"]) {
        assert.equal(await p.getAttribute(selector, "aria-invalid"), "true");
        assert.equal(await p.locator(selector).isVisible(), true);
      }
      await expectChildcareFits(p);
    },
  ],
  [
    "layout: history table in nominal dollars",
    async p => {
      await p.click("#view-history");
      await p.click("#history-nominal");
      assert.equal(await p.locator("#history-view").isVisible(), true);
      assert.equal(await p.locator("#history-rows tr").count(), listYears().length);
      assert.equal(await p.locator("#tax-year").isDisabled(), true);
    },
  ],
];

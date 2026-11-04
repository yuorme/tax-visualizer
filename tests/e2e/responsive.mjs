// Representative visual states. Detailed arithmetic, migration and persistence cases run once in smoke.mjs;
// these interactions expose each panel and the controls whose geometry or colours can vary by viewport/theme.
import assert from "node:assert/strict";
import { listYears } from "../../src/data/load.ts";
import { expectChildcareFits } from "./childcare.mjs";
import { settle } from "./page.mjs";
import { inspect } from "./rules.mjs";

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

async function comparisonScenario(p, overrides = {}) {
  await p.evaluate(
    ({ year, overrides }) => {
      localStorage.setItem(
        "taxcmp",
        JSON.stringify({
          v: 3,
          year,
          home: "ON",
          dest: "QC",
          kids: 1,
          under6: 1,
          adults: 2,
          people: [{ ord: 75000, oth: 1200, cg: 2000, ed: 3000, nd: 400, fd: 500, ded: 600 }, { ord: 0 }],
          spouse: true,
          useBpa: true,
          homeValue: 750000,
          tenure: "own",
          view: "home",
          ...overrides,
        }),
      );
      history.replaceState(null, "", location.pathname);
    },
    { year: Math.max(...listYears()), overrides },
  );
  await p.reload();
  await settle(p);
}

async function expectComparisonTip(p, name, pattern) {
  const button = p.getByRole("button", { name: `About ${name}`, exact: true });
  const text = await button.getAttribute("data-tip");
  assert.match(text, pattern);
  assert.equal(await button.evaluate(el => el.tagName), "BUTTON");
  assert.equal(await button.getAttribute("type"), "button");
  assert.equal(
    await p.locator("#detail-body").evaluate(el => el.textContent.includes("Includes payroll contributions")),
    false,
  );
  await button.scrollIntoViewIfNeeded();
  await settle(p);
  await button.focus();
  assert.equal(await p.locator("#tip").isVisible(), true, "keyboard focus opens tooltip");
  assert.equal(await button.getAttribute("aria-describedby"), "tip");
  assert.equal(await p.textContent("#tip"), text, "all explanatory text survives attribute escaping");
  const box = await p.locator("#tip").boundingBox();
  assert.ok(box.x >= 0 && box.x + box.width <= p.viewportSize().width, "tooltip fits width");
  assert.ok(box.y >= 0 && box.y + box.height <= p.viewportSize().height, "tooltip fits height");
  await p.keyboard.press("Escape");
  assert.equal(await p.locator("#tip").isVisible(), false);
  assert.equal(await button.getAttribute("aria-describedby"), null);
  await p.keyboard.press("Enter");
  assert.equal(await p.locator("#tip").isVisible(), true, "native keyboard activation opens tooltip");
  await p.keyboard.press("Tab");
  assert.equal(await button.getAttribute("aria-describedby"), null, "Tab leaves this tooltip trigger");
  // The next tab stop can itself be an info button; its explanation may open as this one closes.
  await p.locator("#detail-body .headline").click();
  assert.equal(await p.locator("#tip").isVisible(), false, "clicking away dismisses tooltip");
}

// Segmented groups: bordered, rounded rows of adjoining buttons. An outline isn't part of any box the page reports, so
// the ring's box is worked out from the button's. Square-cornered ancestors may clip around it, but a rounded one
// can't: a ring inside its box still loses its corners.
const SEGMENTED = ".seg, .tabbar";

/** Checks each showing button in every segmented group; `seen` names them, as `<group label> <button index>`. */
const inspectSegmented = p =>
  p.evaluate(selector => {
    const problems = [];
    const seen = [];
    const probe = document.body.appendChild(document.createElement("i"));
    probe.style.color = "var(--focus)";
    const focusColor = getComputedStyle(probe).color;
    probe.remove();
    for (const group of document.querySelectorAll(selector)) {
      const label = group.getAttribute("aria-label");
      const buttons = [...group.querySelectorAll("button")];
      const showing = buttons.filter(b => b.checkVisibility());
      if (!showing.length) continue;
      const box = getComputedStyle(group);
      const radius = group.matches(".seg") ? 7 : 8;
      if (box.borderTopLeftRadius !== `${radius}px`) problems.push(`${label}: radius ${box.borderTopLeftRadius}`);
      if (box.borderTopWidth !== "1px" || box.borderTopStyle !== "solid") problems.push(`${label}: border changed`);
      if (group.scrollWidth > group.clientWidth || group.scrollHeight > group.clientHeight)
        problems.push(`${label}: its buttons overflow the outline`);
      showing.forEach((button, i) => {
        const name = `${label} ${buttons.indexOf(button)}`;
        seen.push(name);
        button.focus();
        const style = getComputedStyle(button);
        // End buttons' fills stop at the inner edge of the group's rounded border, since nothing clips them now.
        const first = i === 0;
        const last = i === showing.length - 1;
        for (const [corner, rounded] of [
          ["TopLeft", first],
          ["BottomLeft", first],
          ["TopRight", last],
          ["BottomRight", last],
        ]) {
          const expected = rounded ? `${radius - 1}px` : "0px";
          const actual = style[`border${corner}Radius`];
          if (actual !== expected) problems.push(`${name}: ${corner} radius ${actual}, expected ${expected}`);
        }
        if (!button.matches(":focus-visible")) problems.push(`${name}: keyboard focus isn't focus-visible`);
        if (style.outlineStyle !== "solid" || style.outlineWidth !== "2px" || style.outlineColor !== focusColor)
          problems.push(`${name}: ring is ${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor}`);
        // Flex and grid items paint in order, so a next button with a fill would cover this ring's edge.
        if (style.zIndex === "auto") problems.push(`${name}: the next button paints over its ring`);
        const grow = Number.parseFloat(style.outlineOffset) + Number.parseFloat(style.outlineWidth);
        const rect = button.getBoundingClientRect();
        const ring = {
          left: rect.left - grow,
          right: rect.right + grow,
          top: rect.top - grow,
          bottom: rect.bottom + grow,
        };
        if (ring.left < 0 || ring.right > innerWidth) problems.push(`${name}: ring runs off the page`);
        for (let el = button.parentElement; el; el = el.parentElement) {
          const clip = getComputedStyle(el);
          if (clip.overflowX === "visible" && clip.overflowY === "visible") continue;
          const edge = el.getBoundingClientRect();
          const left = edge.left + el.clientLeft;
          const top = edge.top + el.clientTop;
          const clipped =
            ring.left < left ||
            ring.right > left + el.clientWidth ||
            ring.top < top ||
            ring.bottom > top + el.clientHeight;
          if (clipped || clip.borderTopLeftRadius !== "0px")
            problems.push(`${name}: ring clipped by ${el.tagName.toLowerCase()}.${el.className}`);
        }
      });
    }
    document.activeElement.blur();
    return { problems, seen };
  }, SEGMENTED);

export const COMPARISON_STEPS = [
  [
    "comparison: explanations, summaries and annotations remain distinct",
    async p => {
      await comparisonScenario(p);
      assert.match(await p.textContent("#detail-body .result-summary"), /^Net tax is .*lowest of all 13/i);
      const annotations = await p.locator("#detail-body .result-annotation").allTextContents();
      assert.equal(annotations.length, 4);
      assert.match(annotations[0], /^\(.+ vs .+\)$/);
      assert.match(annotations[1], /^\([\d.]+% vs [\d.]+%\)$/);
      assert.match(annotations[2], /^\([\d.]+¢ vs [\d.]+¢ a litre\)$/);
      assert.match(annotations[3], /^\(CCB(?: \+ provincial)?\)$/);
      assert.equal(await p.locator("#detail-body .note, #detail-body .hint, #detail-body .help").count(), 0);
      await expectComparisonTip(
        p,
        "spouse and dependant amounts",
        /^The spouse amount saves your household .*Ontario.*Quebec/,
      );
      await expectComparisonTip(
        p,
        "taxable income",
        /^You: taxable income is \$[\d,]+:.*grossed-up eligible dividends.*"Tax on investment income".*withheld abroad/,
      );
      await expectComparisonTip(
        p,
        "marginal rates",
        /^Includes payroll contributions and any child benefit clawback\. A negative dividend rate means/,
      );
      // The rule still rejects a new explanatory note in the comparison; no container-wide exemption remains.
      await p.locator("#detail-body").evaluate(el => {
        const note = document.createElement("p");
        note.className = "note";
        note.id = "hint-rule-probe";
        note.textContent = "An explanation must be a tooltip";
        el.append(note);
      });
      assert.ok((await inspect(p)).hints.some(h => h.text === "An explanation must be a tooltip" && !h.known));
      await p.locator("#hint-rule-probe").evaluate(el => el.remove());
      // Leave the longest tooltip open for the representative responsive contrast scan.
      const taxable = p.getByRole("button", { name: "About taxable income", exact: true });
      await taxable.scrollIntoViewIfNeeded();
      await settle(p);
      await taxable.focus();
    },
  ],
  [
    "comparison: tooltip tracks province and selected person without changing results",
    async p => {
      const results = await p.locator("table.cmp").textContent();
      const url = p.url();
      await expectComparisonTip(p, "taxable income", /You: taxable income/);
      assert.equal(await p.locator("table.cmp").textContent(), results);
      assert.equal(p.url(), url, "opening tips does not change the share link");
      await p.click('[data-view="dest"]');
      await expectComparisonTip(p, "taxable income", /Quebec taxable income is .*deduction for workers/);
      await p.click('.person[data-i="1"]');
      assert.equal(await p.getByRole("button", { name: "About taxable income", exact: true }).count(), 0);
      assert.match(await p.textContent("#detail-body .views h4"), /Partner/);
      await p.click('.person[data-i="0"]');
      await expectComparisonTip(p, "taxable income", /You: taxable income/);
    },
  ],
  [
    "comparison: mouse and touch open the same full explanation",
    async p => {
      const button = p.getByRole("button", { name: "About taxable income", exact: true });
      await button.scrollIntoViewIfNeeded();
      await settle(p);
      await button.hover();
      assert.equal(await p.locator("#tip").isVisible(), true);
      await p.mouse.move(0, 0);
      assert.equal(await p.locator("#tip").isVisible(), false);
      const session = await p.context().newCDPSession(p);
      try {
        await session.send("Emulation.setTouchEmulationEnabled", { enabled: true });
        await button.scrollIntoViewIfNeeded();
        await settle(p);
        const box = await button.boundingBox();
        await session.send("Input.dispatchTouchEvent", {
          type: "touchStart",
          touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }],
        });
        await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
        assert.equal(await p.locator("#tip").isVisible(), true, "touch tap opens tooltip");
        assert.equal(await p.textContent("#tip"), await button.getAttribute("data-tip"));
        await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 2, y: 2 }] });
        await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
        assert.equal(await p.locator("#tip").isVisible(), false, "outside touch dismisses tooltip");
      } finally {
        await session.detach();
      }
    },
  ],
  ...[
    ["unrelated adults", { spouse: false }, /^Taxed as two separate individuals/],
    ["basic personal amounts off", { useBpa: false }, /^Turn on basic personal amounts/],
    ["no spouse amount", { people: [{ ord: 75000 }, { ord: 75000 }] }, /^No spouse amount at these incomes/],
    ["eligible dependant", { adults: 1, people: [{ ord: 75000 }] }, /^The eligible dependant amount saves you/],
  ].map(([name, overrides, pattern]) => [
    `comparison: ${name} explanation`,
    async p => {
      await comparisonScenario(p, overrides);
      await expectComparisonTip(p, "spouse and dependant amounts", pattern);
      assert.equal(await p.locator("#detail-body .note").count(), 0);
    },
  ]),
];

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
  [
    "layout: every segmented button shows its whole focus ring",
    async p => {
      const problems = [];
      const seen = new Set();
      const scan = async () => {
        await p.keyboard.press("Shift"); // scripted focus only shows a ring after keyboard input
        const result = await inspectSegmented(p);
        problems.push(...result.problems);
        for (const name of result.seen) seen.add(name);
      };
      await p.click("#view-provinces");
      await openTab(p, "income");
      await scan();
      await openTab(p, "home");
      await scan();
      await openTab(p, "driving");
      await scan();
      await p.click("#view-history");
      await scan();
      // Every bundled year has Driving, so set the attribute app.ts sets for a year without it. The last tab then
      // leaves the bar, and the bar's rounded end moves to the tab before.
      const driving = p.locator("#tab-driving");
      await driving.evaluate(el => {
        el.hidden = true;
      });
      assert.equal(await driving.isVisible(), false, "a tab marked hidden isn't shown");
      await scan();
      await driving.evaluate(el => {
        el.hidden = false;
      });
      // A group added later fails here until a step above opens it.
      const all = await p.$$eval(SEGMENTED, groups =>
        groups.flatMap(g => [...g.querySelectorAll("button")].map((_, i) => `${g.getAttribute("aria-label")} ${i}`)),
      );
      assert.ok(all.length > 0);
      for (const name of all) if (!seen.has(name)) problems.push(`${name}: not checked`);
      return problems;
    },
  ],
];

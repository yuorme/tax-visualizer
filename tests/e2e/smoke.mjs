// Browser smoke test for dist/index.html (run `npm run build` first):
//  1. the page loads with no script errors, on desktop and phone widths, with no sideways scrolling on phones;
//  2. after the same sequence of inputs, the chart labels, comparison table and credits panel show exactly the
//     same text as the legacy single-file app (legacy/tax-compare.html).
import fs from "node:fs";
import { chromium } from "playwright";

const read = f => fs.readFileSync(new URL(f, import.meta.url), "utf8");
const built = read("../../dist/index.html");
const legacy = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${read("../../legacy/tax-compare.html")}</body></html>`;

const STEPS = [
  ["default", async () => {}],
  [
    "income 28k, 1 child, rent",
    async p => {
      await p.fill("#income", "28,000");
      await p.dispatchEvent("#income", "input");
      await p.$eval("#kids", el => {
        el.value = 1;
        el.dispatchEvent(new Event("input", { bubbles: true }));
      });
      await p.$eval("#cred-panel", el => {
        el.open = true;
      });
      await p.fill("#rent", "1,200");
      await p.dispatchEvent("#rent", "input");
    },
  ],
  [
    "partner, BC home, $ view",
    async p => {
      await p.click("#add-partner");
      await p.selectOption("#home", "BC");
      await p.click("#m-usd");
    },
  ],
  [
    "investments, Quebec destination",
    async p => {
      await p.$eval("#invest", el => {
        el.open = true;
      });
      for (const [id, v] of [
        ["cg", "20,000"],
        ["ed", "12,000"],
        ["fd", "8,000"],
      ]) {
        await p.fill(`#${id}`, v);
        await p.dispatchEvent(`#${id}`, "input");
      }
      await p.selectOption("#dest", "QC");
      await p.click("#m-pct");
    },
  ],
  [
    "home value, frugality, sort",
    async p => {
      await p.$eval("#prop-panel", el => {
        el.open = true;
      });
      await p.fill("#hv", "750,000");
      await p.dispatchEvent("#hv", "input");
      await p.$eval("#frug", el => {
        el.value = -20;
        el.dispatchEvent(new Event("input", { bubbles: true }));
      });
      await p.click("#sort-geo");
    },
  ],
];

const capture = p =>
  p.evaluate(() => ({
    cols: [...document.querySelectorAll(".col")].map(c => [
      c.id,
      c.querySelector(".cv").textContent,
      c.querySelector(".cm").textContent,
    ]),
    title: document.getElementById("chart-title").textContent,
    detail: document.getElementById("detail-body").innerText,
    credits: document.getElementById("cred-list").innerText,
    sums: ["prop-sum", "cred-sum", "invest-sum", "spend"].map(
      id => document.getElementById(id).textContent || document.getElementById(id).value,
    ),
  }));

const browser = await chromium.launch();
let failures = 0;
const fail = msg => {
  failures++;
  console.error("FAIL", msg);
};

async function run(html, width) {
  const page = await browser.newPage({ viewport: { width, height: 1000 } });
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.addInitScript(() => localStorage.clear());
  await page.setContent(html);
  const states = [];
  for (const [name, step] of STEPS) {
    await step(page);
    await page.waitForTimeout(50);
    states.push([name, await capture(page)]);
  }
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  await page.close();
  return { states, errors, scrollWidth };
}

for (const width of [1000, 430, 375]) {
  const [a, b] = [await run(built, width), await run(legacy, width)];
  if (a.errors.length) fail(`${width}px: script errors ${a.errors.join("; ")}`);
  if (width < 500 && a.scrollWidth > width) fail(`${width}px: page scrolls sideways (${a.scrollWidth}px wide)`);
  a.states.forEach(([name, s], i) => {
    const t = b.states[i][1];
    for (const key of Object.keys(s))
      if (JSON.stringify(s[key]) !== JSON.stringify(t[key]))
        fail(
          `${width}px, "${name}": ${key} differs from legacy\n  new:    ${JSON.stringify(s[key]).slice(0, 300)}\n  legacy: ${JSON.stringify(t[key]).slice(0, 300)}`,
        );
  });
  console.log(`${width}px: ${a.states.length} states checked`);
}
await browser.close();
if (failures) {
  console.error(`${failures} failure(s)`);
  process.exit(1);
}
console.log("smoke test passed");

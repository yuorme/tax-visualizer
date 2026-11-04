import assert from "node:assert/strict";
import { loadCpi, loadYear } from "../../src/data/load.ts";
import { historyComparison } from "../../src/engine/history.ts";
import { blank, compute } from "../../src/engine/index.ts";
import { money, rate } from "../../src/ui/notes.ts";
import { settle } from "./page.mjs";
import { inspect } from "./rules.mjs";

const saved = p => p.evaluate(() => JSON.parse(localStorage.getItem("taxcmp")));
async function load(p, state = {}, hash) {
  await p.evaluate(
    ({ state, hash }) => {
      localStorage.setItem(
        "taxcmp",
        JSON.stringify({
          v: 3,
          year: 2025,
          home: "ON",
          dest: "QC",
          people: [{ ord: 0 }],
          adults: 1,
          spend: 0,
          km: 0,
          tab: "income",
          ...state,
        }),
      );
      history.replaceState(null, "", location.pathname + (hash ?? ""));
    },
    { state, hash },
  );
  await p.reload();
  await settle(p);
}
const household = (people, extra = {}) => ({
  people,
  active: 0,
  spouse: true,
  adults: people.length,
  kids: 0,
  under6: 0,
  useBpa: true,
  whRate: 0.15,
  useCredits: true,
  homeValue: 0,
  rent: 0,
  monthlySpending: 0,
  driving: { km: 0, lPer100km: 9 },
  ...extra,
});
async function chart(p, year, people, extra = {}) {
  const data = loadYear(year);
  for (const province of data.provinces) {
    const result = compute(data, province, household(people, extra));
    assert.equal(await p.textContent(`#col-${province.code} .cv`), `${(result.avg * 100).toFixed(1)}%`, province.code);
  }
}
async function tip(p, selector) {
  const button = p.locator(selector);
  await button.scrollIntoViewIfNeeded();
  await button.focus();
  await settle(p);
  const text = await p.textContent("#tip");
  await p.keyboard.press("Escape");
  await button.blur();
  return text;
}
const historyRows = p =>
  p.locator("#history-rows tr[data-year]").evaluateAll(rows => rows.map(r => [...r.cells].map(c => c.textContent)));

export const SELF_EMPLOYMENT_STEPS = [
  [
    "business: inputs for both adults, clear versus zero, local storage and shared links",
    async p => {
      await load(p, { people: [{ ord: 30000 }] });
      await p.fill("#self-employment", "45,000.25");
      await p.locator("#self-employment").blur();
      await p.click("#add-partner");
      await p.fill("#income", "10000");
      await p.fill("#self-employment", "15000");
      await p.locator("#self-employment").blur();
      // Adding an adult changes the spending estimate; retain a zero-spending fixture.
      await p.fill("#spend", "0");
      await settle(p);
      const people = [
        { ...blank(30000), selfEmployment: 45000.25 },
        { ...blank(10000), selfEmployment: 15000 },
      ];
      await chart(p, 2025, people, { active: 1 });
      await p.click('#people [data-i="0"]');
      assert.equal(await p.inputValue("#self-employment"), "45,000.25");
      const hash = await p.evaluate(() => location.hash);
      await p.evaluate(() => history.replaceState(null, "", location.pathname));
      await p.reload();
      await settle(p);
      assert.deepEqual((await saved(p)).people, people, "saved state restores both profits");
      await load(p, { people: [{ ord: 999999 }] }, hash);
      assert.deepEqual((await saved(p)).people, people, "URL overrides recipient storage");
      await p.fill("#self-employment", "0");
      assert.equal((await saved(p)).people[0].selfEmployment, 0);
      await p.fill("#self-employment", "");
      assert.equal(Object.hasOwn((await saved(p)).people[0], "selfEmployment"), false);
      await p.click("#remove-partner");
      assert.equal((await saved(p)).people.length, 1);
    },
  ],
  [
    "business: published CPP examples, mixed ceilings, working benefits and contribution breakdown",
    async p => {
      for (const year of [2025, 2026]) {
        for (const [wages, profit] of [
          [0, 75000],
          [30000, 45000],
          [0, 12000],
        ]) {
          const person = { ...blank(wages), selfEmployment: profit };
          await load(p, { year, people: [person] });
          await chart(p, year, [person]);
          const y = loadYear(year);
          const result = compute(
            y,
            y.provinces.find(x => x.code === "ON"),
            household([person]),
          );
          const business = result.me.breakdown.selfEmployment;
          const text = await tip(p, '[aria-label="About self-employment contributions"]');
          assert.ok(text.includes(money(business.employerBaseDeduction)), text);
          assert.ok(text.includes(money(business.baseCredit)), text);
          assert.ok(text.includes(money(business.enhanced)), text);
          assert.match(text, /No EI or employment amount/);
          const marginal = p.locator(".margs tr").filter({ hasText: "Self-employment income" });
          assert.ok(
            (await marginal.textContent()).includes(`${(result.breakdown.margSelfEmployment * 100).toFixed(2)}%`),
          );
          if (!wages && profit === 75000) {
            assert.ok(Math.abs(result.me.pay.base + result.me.pay.enh - (year === 2025 ? 8364.2 : 8492.9)) < 1e-8);
            assert.equal(await p.locator(".margs tr").filter({ hasText: /^EI / }).count(), 0);
          }
          await p.click('[data-view="dest"]');
          const qc = compute(
            y,
            y.provinces.find(x => x.code === "QC"),
            household([person]),
          );
          const qcTip = await tip(p, '[aria-label="About self-employment contributions"]');
          assert.ok(qcTip.includes(money(qc.me.breakdown.selfEmployment.qpipDeduction)), qcTip);
          assert.ok(qcTip.includes(money(qc.me.breakdown.selfEmployment.qpipCredit)), qcTip);
          assert.ok((await p.textContent("#detail")).includes("QPIP (employment + business)"));
        }
      }
    },
  ],
  [
    "business: malformed drafts and saved/link amounts fail safely without changing wages",
    async p => {
      await load(p, { people: [{ ord: 30000, selfEmployment: 45000 }] });
      for (const value of ["-1", "no", "Infinity", "1e6", "12,34", "20.001"]) {
        await p.fill("#self-employment", value);
        await p.locator("#self-employment").blur();
        assert.equal(await p.getAttribute("#self-employment", "aria-invalid"), "true");
        assert.equal((await saved(p)).people[0].selfEmployment, 45000);
      }
      for (const value of [null, -1, "75000", {}, [], 1e100]) {
        await load(p, { people: [{ ord: 30000, selfEmployment: value }] });
        assert.equal((await saved(p)).people[0].selfEmployment, undefined);
        await chart(p, 2025, [blank(30000)]);
        const hash = `#${new URLSearchParams({ s: "1", year: "2025", people: JSON.stringify([{ ord: 30000, selfEmployment: value }]), spend: "0", km: "0" })}`;
        await load(p, {}, hash);
        await chart(p, 2025, [blank(30000)]);
      }
    },
  ],
  [
    "business: unsupported selected years visibly exclude retained profit, including explicit zero",
    async p => {
      for (const profit of [75000, 0]) {
        await load(p, { year: 2024, people: [{ ord: 30000, selfEmployment: profit }] });
        await chart(p, 2024, [blank(30000)]);
        assert.equal(await p.locator("#self-employment-gate").isVisible(), true);
        assert.match(await p.textContent("#self-employment-gate"), /2025 and 2026 only.*exclude/);
        assert.equal((await saved(p)).people[0].selfEmployment, profit);
        await p.selectOption("#tax-year", "2025");
        await settle(p);
        assert.equal(await p.locator("#self-employment-gate").isVisible(), false);
        await chart(p, 2025, [{ ...blank(30000), selfEmployment: profit }]);
      }
    },
  ],
  [
    "business: history has supported years, per-row ages, real scaling and an empty entry-age view",
    async p => {
      await load(p, {
        year: 2024,
        people: [{ ord: 30000, selfEmployment: 45000 }],
        retirement: [{ birthYear: 1955, birthMonth: 6 }],
        historyOpen: true,
        historyMode: "nominal",
      });
      for (const mode of ["nominal", "real"]) {
        await p.click(`#history-${mode}`);
        await settle(p);
        const expected = [2025, 2026]
          .flatMap(
            year =>
              historyComparison(
                [loadYear(year)],
                loadCpi(),
                household([{ ...blank(30000), selfEmployment: 45000, age: year - 1955, birthMonth: 6 }]),
                ["ON"],
                mode,
              ).rows,
          )
          .map(row => [
            String(row.year),
            money(row.provinces[0].income),
            row.provinces[0].tax < 0 ? `−${money(-row.provinces[0].tax)}` : money(row.provinces[0].tax),
            rate(row.provinces[0].rate),
          ]);
        assert.deepEqual(await historyRows(p), expected);
        assert.match(await tip(p, "#history-info"), /Self-employment is modelled only for 2025 and 2026/);
      }
      await load(p, {
        people: [{ ord: 0, selfEmployment: 75000 }],
        retirement: [{ birthYear: 2007, birthMonth: 6 }],
        historyOpen: true,
        historyMode: "nominal",
      });
      assert.deepEqual(
        (await historyRows(p)).map(r => r[0]),
        ["2026"],
      );
      await p.click("#history-real");
      assert.match(await p.textContent("#history-rows"), /No year in this view covers/);
    },
  ],
  [
    "business: childcare defaults follow profit and preserve an explicit zero override",
    async p => {
      await load(p, { people: [{ ord: 0, selfEmployment: 12000 }], kids: 1, under6: 1 });
      await p.fill("#childcare-monthly", "500");
      if (!(await p.$eval("#childcare-details", el => el.open)))
        await p.locator("#childcare-details > summary").click();
      await p.fill("#care-age-0", "4");
      await p.fill("#care-expenses-0", "6000");
      await p.locator("#care-expenses-0").blur();
      const people = [{ ...blank(0), selfEmployment: 12000 }];
      const extra = {
        kids: 1,
        under6: 1,
        childAges: [4],
        childcare: {
          mode: "automatic",
          children: [{ age: 4, expenses: 6000 }],
          declaredAnnualExpenses: 6000,
          earnedIncome: [12000],
        },
      };
      await chart(p, 2025, people, extra);
      await p.locator("#care-adjustments > summary").click();
      await p.check("#care-override-0");
      assert.equal(await p.inputValue("#care-earnings-0"), "12,000");
      await p.fill("#care-earnings-0", "0");
      await p.fill("#self-employment", "15000");
      await chart(p, 2025, [{ ...blank(0), selfEmployment: 15000 }], {
        ...extra,
        childcare: { ...extra.childcare, earnedIncome: [0] },
      });
      await p.uncheck("#care-override-0");
      await p.selectOption("#tax-year", "2024");
      await p.click("#view-history");
      await p.click("#history-nominal");
      const expected = [2025, 2026]
        .flatMap(
          year =>
            historyComparison(
              [loadYear(year)],
              loadCpi(),
              household([{ ...blank(0), selfEmployment: 15000 }], {
                ...extra,
                childcare: { ...extra.childcare, earnedIncome: [15000] },
              }),
              ["ON"],
              "nominal",
            ).rows,
        )
        .map(row => [
          String(row.year),
          money(row.provinces[0].income),
          row.provinces[0].tax < 0 ? `−${money(-row.provinces[0].tax)}` : money(row.provinces[0].tax),
          rate(row.provinces[0].rate),
        ]);
      assert.deepEqual(
        await historyRows(p),
        expected,
        "history earnings include profit even from an unsupported selected year",
      );
    },
  ],
  [
    "business: mixed CPP and wage-only QPP elections; self-employed-only CPP has a visible guard",
    async p => {
      const dates = {
        birthYear: 1959,
        birthMonth: 1,
        pensionSince: { year: 2024, month: 1 },
        cppStop: { year: 2025, month: 6 },
        qppStop: { year: 2025, month: 6 },
      };
      const payroll = {
        retirementPensionSince: dates.pensionSince,
        cppElection: { stop: dates.cppStop },
        qppElection: { stop: dates.qppStop },
      };
      for (const wages of [30000, 0]) {
        await load(p, { people: [{ ord: wages, selfEmployment: 45000 }], retirement: [dates] });
        const { cppElection: _cpp, ...withoutCpp } = payroll;
        await chart(p, 2025, [
          {
            ...blank(wages),
            selfEmployment: 45000,
            age: 66,
            birthMonth: 1,
            employeePayroll: wages ? payroll : withoutCpp,
          },
        ]);
        assert.equal(await p.locator("#self-employment-gate").isVisible(), wages === 0);
        await p.click('[data-view="dest"]');
        assert.match(
          await tip(p, '[aria-label="About self-employment contributions"]'),
          /QPP employee stop elections do not stop business/,
        );
      }
      await load(p, { people: [{ ord: 0, selfEmployment: 0 }], retirement: [dates] });
      assert.match(
        await p.locator(".margs tr").filter({ hasText: "Self-employment income" }).textContent(),
        /Not modelled/,
      );
      await p.click('[data-view="dest"]');
      assert.match(await p.locator(".margs tr").filter({ hasText: "Self-employment income" }).textContent(), /0.00%/);
    },
  ],
];

export const SELF_EMPLOYMENT_RESPONSIVE_STEPS = [
  [
    "layout: business input, contribution tooltip and unsupported-year notice fit",
    async p => {
      await load(p, { people: [{ ord: 30000, selfEmployment: 45000.25 }] });
      assert.equal(await p.locator("#self-employment").isVisible(), true);
      const input = await p.locator("#self-employment").boundingBox();
      assert.ok(input.x >= 0 && input.x + input.width <= p.viewportSize().width);
      assert.equal(await p.locator("#self-employment").evaluate(el => el.scrollWidth <= el.clientWidth + 1), true);
      await p.locator('[data-note="selfEmployment"]').scrollIntoViewIfNeeded();
      await settle(p);
      await p.locator('[data-note="selfEmployment"]').focus();
      await settle(p);
      const box = await p.locator("#tip").boundingBox();
      assert.ok(box.x >= 0 && box.x + box.width <= p.viewportSize().width);
      assert.ok(box.y >= 0 && box.y + box.height <= p.viewportSize().height);
      await p.keyboard.press("Escape");
      await p.locator('[data-note="selfEmployment"]').blur();
      await tip(p, '[aria-label="About self-employment contributions"]');
      assert.ok((await inspect(p)).scrollWidth <= p.viewportSize().width);
      await p.selectOption("#tax-year", "2024");
      assert.equal(await p.locator("#self-employment-gate").isVisible(), true);
      assert.ok((await inspect(p)).scrollWidth <= p.viewportSize().width);
    },
    { contrast: true },
  ],
];

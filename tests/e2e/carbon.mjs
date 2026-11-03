import assert from "node:assert/strict";

const row = (p, label) =>
  p.locator("#detail-body tr").evaluateAll((rows, text) => {
    const match = rows.find(r => r.cells[0]?.textContent === text);
    return match ? [...match.cells].map(c => c.textContent) : null;
  }, label);
const open = async (p, name) => {
  if ((await p.getAttribute(`#tab-${name}`, "aria-expanded")) !== "true") await p.click(`#tab-${name}`);
};

export const CARBON_STEPS = [
  [
    "carbon: calendar 2025 gasoline, fixed heating and final rebate are separately visible",
    async p => {
      await p.evaluate(() => {
        const x = { ord: 50000, cg: 0, ed: 0, nd: 0, fd: 0, ded: 0, rrsp: 0, fhsa: 0 };
        localStorage.setItem(
          "taxcmp",
          JSON.stringify({
            v: 3,
            year: 2025,
            people: [x, x],
            adults: 2,
            spouse: true,
            kids: 2,
            under6: 0,
            home: "AB",
            dest: "QC",
            useCredits: true,
            km: 10000,
            eff: 10,
            tab: "driving",
          }),
        );
      });
      await p.evaluate(() => history.replaceState(null, "", location.pathname + location.search));
      await p.reload();
      assert.ok(await p.locator("#tab-driving").isVisible());
      assert.ok(await p.locator("#legend-carbon").isVisible());
      assert.ok(await p.locator("#legend-fuel").isVisible());
      const fuel = await p.locator("#detail-body tr").evaluateAll(rows => {
        const match = rows.find(r => r.cells[0]?.textContent.startsWith("Fuel tax "));
        return match ? [...match.cells].map(c => c.textContent) : null;
      });
      assert.deepEqual(fuel?.slice(1, 3), ["$230", "$322"]);
      assert.equal((await row(p, "Carbon charge on gasoline"))[1], "$43");
      assert.equal((await row(p, "Carbon charge on heating (estimate)"))[1], "$99");
      assert.equal((await row(p, "Carbon charge on gasoline"))[2], "$0");
      assert.match(await p.textContent("#cred-list"), /Canada Carbon Rebate.*\$906/);
      assert.match(await p.textContent("#fuel-sum"), /\$273 a year in Alberta/);
    },
  ],
  [
    "carbon: no driving leaves heating and rebates; disabling credits leaves both charges",
    async p => {
      await open(p, "driving");
      await p.fill("#km", "0");
      await p.locator("#km").blur();
      assert.equal((await row(p, "Carbon charge on gasoline"))[1], "$0");
      assert.equal((await row(p, "Carbon charge on heating (estimate)"))[1], "$99");
      assert.match(await p.textContent("#cred-list"), /Canada Carbon Rebate.*\$906/);
      await open(p, "credits");
      await p.click('label[for="cred-toggle"]');
      assert.equal(await p.isChecked("#cred-toggle"), false);
      assert.doesNotMatch(await p.textContent("#cred-list"), /Canada Carbon Rebate/);
      assert.equal((await row(p, "Carbon charge on heating (estimate)"))[1], "$99");
      await open(p, "driving");
      await p.fill("#km", "10000");
      await p.locator("#km").blur();
      assert.equal((await row(p, "Carbon charge on gasoline"))[1], "$43");
    },
  ],
  [
    "carbon: 2026 has no carbon cost or rebate and changing back restores the year",
    async p => {
      await p.selectOption("#tax-year", "2026");
      assert.ok(!(await p.locator("#legend-carbon").isVisible()));
      assert.equal(await row(p, "Carbon charge on gasoline"), null);
      assert.doesNotMatch(await p.textContent("#cred-list"), /Canada Carbon Rebate/);
      await p.selectOption("#tax-year", "2025");
      await p.reload();
      assert.equal(await p.inputValue("#tax-year"), "2025");
      assert.equal((await row(p, "Carbon charge on gasoline"))[1], "$43");
    },
  ],
];

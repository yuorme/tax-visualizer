import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";
import { provinceSchema } from "../src/data/schema.ts";
import { blank, creditsOf, provincialChildBenefit } from "../src/engine/index.ts";

const fixture = JSON.parse(fs.readFileSync(new URL("./golden/history-rules-2021.json", import.meta.url), "utf8"));
const year = loadYear(2025);
const ns = provinceSchema.parse({
  ...year.provinces.find(p => p.code === "NS"),
  childBenefit: { program: "nova-scotia-child-benefit-by-child", params: fixture.ns.params },
});
const mb = provinceSchema.parse({
  ...year.provinces.find(p => p.code === "MB"),
  credits: [
    { program: "mb-school-tax-credits-rent-share", name: "Owner", nameRenter: "Renter", params: fixture.mb.params },
  ],
});
const close = (actual: number, expected: number) =>
  assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
function propertyCredit(propertyTax: number, rent: number, province = mb) {
  return creditsOf(year.federal, province, {
    famNet: 0,
    famEmp: 0,
    couple: false,
    kids: 0,
    ppl: [blank(0)],
    propTax: propertyTax,
    rent,
  })
    .filter(([name]) => name === "Owner" || name === "Renter")
    .reduce((sum, [, value]) => sum + value, 0);
}

test("2021 NS ordered amounts match independent golden cases at both income boundaries", () => {
  for (const c of fixture.ns.cases)
    close(provincialChildBenefit(ns.childBenefit, c.income, 0, c.kids, false), c.expected);
});

test("2021 MB rent share and school relief match independent golden boundary cases", () => {
  for (const c of fixture.mb.cases) close(propertyCredit(c.propertyTax, c.rent), c.expected);
});

test("NS partial band preserves the first child and halves only subsequent ordered amounts", () => {
  close(provincialChildBenefit(ns.childBenefit, 30000, 0, 1, true), 925);
  close(provincialChildBenefit(ns.childBenefit, 30000, 0, 2, true), 925 + 825 / 2);
  close(provincialChildBenefit(ns.childBenefit, 30000, 0, 4, true), 925 + (825 + 900 * 2) / 2);
});

test("historical MB rent share is applied before the cap and leaves the later program intact", () => {
  close(propertyCredit(0, 1000), 150); // 20% occupancy cost × 75%, not the later full-rent cap
  close(propertyCredit(2000, 10000), 775); // home-owner branch takes precedence, no added renter amount
  const later = provinceSchema.parse({
    ...mb,
    credits: [{ program: "mb-school-tax-credits", name: "Owner", nameRenter: "Renter", params: fixture.mb.params }],
  });
  close(propertyCredit(0, 1000, later), 525);
});

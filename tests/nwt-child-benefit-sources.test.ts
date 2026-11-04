import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { loadYear } from "../src/data/load.ts";

for (const year of [2025, 2026]) {
  test(`${year}: NWT continuity is verified against that year's cached CRA publication`, () => {
    const text = fs.readFileSync(
      new URL(`../docs/verification/${year}/sources/t4114-${String(year).slice(-2)}.txt`, import.meta.url),
      "utf8",
    );
    assert.ok(text.includes(`For the period from July ${year} to June ${year + 1}`));
    const heading = "Northwest Territories child benefit\nThis benefit";
    const section = text.slice(text.indexOf(heading), text.indexOf("Nova Scotia child benefit\nThis benefit"));
    assert.ok(section.includes("Children under the age of 6:"));
    assert.ok(section.includes("Children aged 6 to 17:"));
    assert.deepEqual(
      [...section.matchAll(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g)].map(m => m[1]),
      [
        "67.91",
        "122.25",
        "166.41",
        "203.75",
        "30.58",
        "54.33",
        "97.83",
        "133.08",
        "163.00",
        "24.41",
        "30,000",
        "80,000",
      ],
    );
    const p = loadYear(year).provinces.find(p => p.code === "NT");
    assert.ok(p);
    assert.equal(p.childBenefit?.program, "nwt-child-benefit-age-groups");
    assert.ok(!p.childBenefit?.estimated);
    assert.equal(p.propertyTax.estimated, true);
    assert.equal(p.driving?.estimated, true);
    assert.ok(p.sources);
    assert.ok(p.sources.some(s => s.url.endsWith(`/t4114-${String(year).slice(-2)}e.pdf`)));
    assert.ok(p.sources.some(s => s.url.endsWith("/benefits_and_support-nwt_child_benefit-180320.pdf")));
  });
}

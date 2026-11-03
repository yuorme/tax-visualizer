import assert from "node:assert/strict";
import { test } from "node:test";
import { loadYear } from "../src/data/load.ts";
import { blank, childcareOf, compute, type Household } from "../src/engine/index.ts";
import { ChildcareModel } from "../src/ui/childcare.ts";

const configured = () => {
  const model = new ChildcareModel();
  model.configure([75000, 30000], 2);
  model.setMonthly("1000");
  model.setNumber("care-age-0", "4");
  model.setNumber("care-age-1", "10");
  model.setNumber("care-expenses-0", "10000");
  model.setNumber("care-expenses-1", "2000");
  return model;
};
const roundtrip = (model: ChildcareModel, incomes = [75000, 30000], kids = 2) => {
  const restored = new ChildcareModel();
  restored.restore(JSON.parse(JSON.stringify(model.state)));
  restored.configure(incomes, kids);
  return restored;
};

test("childcare earnings follow ordinary income across reload until explicitly overridden, including zero", () => {
  const model = configured();
  assert.deepEqual(model.input()?.earnedIncome, [75000, 30000]);
  model.configure([85000, 40000], 2);
  assert.deepEqual(model.input()?.earnedIncome, [85000, 40000]);
  const restored = roundtrip(model, [90000, 45000]);
  assert.deepEqual(restored.input()?.earnedIncome, [90000, 45000]);
  restored.overrideEarnings(1, true);
  restored.setNumber("care-earnings-1", "0");
  const zero = roundtrip(restored, [95000, 50000]);
  assert.deepEqual(zero.input()?.earnedIncome, [95000, 0]);
  zero.overrideEarnings(1, false);
  assert.deepEqual(zero.input()?.earnedIncome, [95000, 50000]);
});

test("old explicit earnings remain overrides while missing earnings adopt the new default", () => {
  const model = configured();
  model.restore({ ...model.state, earningsOverridden: undefined, earnings: [null, 0] });
  assert.deepEqual(model.input()?.earnedIncome, [75000, 0]);
  assert.deepEqual(roundtrip(model, [80000, 40000]).input()?.earnedIncome, [80000, 0]);
});

test("zero children deactivate retained childcare completely; restoring the count recovers the same rows", () => {
  const model = configured(),
    draft = structuredClone(model.state.children);
  model.setChildCount(0);
  assert.equal(model.enabled, false);
  assert.equal(model.input(), undefined);
  const restored = roundtrip(model, [75000, 30000], 0);
  assert.equal(restored.input(), undefined);
  assert.deepEqual(restored.state.children, draft);
  restored.setChildCount(2);
  assert.deepEqual(
    restored.input()?.children?.map(c => [c.age, c.expenses]),
    [
      [4, 10000],
      [10, 2000],
    ],
  );
  const y = loadYear(2026);
  const hh: Household = {
    people: [blank(75000), blank(30000)],
    active: 0,
    spouse: true,
    adults: 2,
    kids: 0,
    under6: 0,
    useBpa: true,
    useCredits: true,
    monthlySpending: 3200,
    whRate: 0.15,
    homeValue: 0,
    rent: 0,
  };
  for (const province of y.provinces)
    assert.deepEqual(compute(y, province, { ...hh, childcare: model.input() }), compute(y, province, hh));
});

test("clearing cost preserves child drafts, and changing row count never silently discards inactive rows", () => {
  const model = configured();
  model.setMonthly("0");
  assert.equal(model.input(), undefined);
  assert.equal(model.state.activeChildren, 2);
  model.setChildCount(1);
  model.setMonthly("1000");
  assert.equal(model.input()?.children?.length, 1);
  model.setChildCount(2);
  assert.equal(model.input()?.children?.[1].age, 10);
  model.removeChild(0);
  assert.equal(model.state.activeChildren, 1);
  assert.equal(model.children[0].age, 10);
});

test("adult dependent rows stay editable while the engine derives benefit counts from ages", () => {
  const model = configured();
  model.setChildCount(1);
  model.setNumber("care-age-0", "20");
  model.setNumber("care-expenses-0", "12000");
  model.state.children[0].infirm = true;
  const y = loadYear(2026),
    p = y.provinces.find(p => p.code === "ON");
  assert.ok(p);
  const hh: Household = {
    people: [blank(75000), blank(30000)],
    active: 0,
    spouse: true,
    adults: 2,
    kids: 1,
    under6: 0,
    useBpa: true,
    useCredits: true,
    monthlySpending: 0,
    whRate: 0.15,
    homeValue: 0,
    rent: 0,
    childcare: model.input(),
  };
  const result = compute(y, p, hh);
  assert.equal(model.state.activeChildren, 1);
  assert.deepEqual(result.childcare.childCounts, { kids: 0, under6: 0 });
  assert.equal(result.ccb, 0);
  model.setNumber("care-expenses-0", "abc");
  model.setMonthly("0");
  const restored = roundtrip(model, [75000, 30000], 1);
  assert.equal(restored.input(), undefined);
  assert.equal(restored.state.children[0].expenses, "abc");
  assert.equal(restored.profileInput()?.children?.[0].expenses, 0);
  assert.deepEqual(childcareOf(y.federal, { ...hh, childcare: restored.profileInput() }, hh.people).childCounts, {
    kids: 0,
    under6: 0,
  });
  restored.setMonthly("1000");
  assert.equal(restored.input()?.children, undefined);
  assert.equal(restored.state.children[0].expenses, "abc");
});

test("malformed overrides stay pending through reload without becoming valid defaults or zero", () => {
  const model = configured();
  model.overrideEarnings(1, true);
  model.setNumber("care-earnings-1", "-30000");
  const restored = roundtrip(model);
  assert.equal(restored.state.earnings[1], "-30000");
  assert.deepEqual(restored.input()?.earnedIncome, [75000, null]);
  restored.setNumber("care-age-0", "abc");
  assert.equal(roundtrip(restored).input()?.children, undefined);
  restored.setNumber("care-age-0", "4");
  restored.setNumber("care-qc-0", "1.2.3");
  assert.equal(roundtrip(restored).input()?.children?.[0].qcEligibleExpenses, undefined);
  assert.equal(restored.state.children[0].qcEligibleExpenses, "1.2.3");
});

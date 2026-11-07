// Browser assertions for #227 (property-tax relief page, BC and Manitoba, 2026), run by smoke.mjs at every
// viewport/theme pair: the five tooltips, the gross/net bill choice, Manitoba's school-tax input, ledger statuses
// shown as text (never $0), and saved state across a reload.
import assert from "node:assert/strict";
import { settle } from "./page.mjs";

const type = async (p, selector, value) => {
  await p.fill(selector, value);
  await p.dispatchEvent(selector, "input");
  await settle(p);
};
const noSideScroll = async (p, what) =>
  assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, what);
/** The credits panel as [name, amount text] rows. */
const ledger = p =>
  p.$$eval("#cred-list tr", rows => rows.map(r => [r.cells[0].textContent.trim(), r.cells[1]?.textContent.trim()]));
const amountOf = async (p, name) => (await ledger(p)).find(([n]) => n === name)?.[1];

async function openHome(p) {
  if (!(await p.locator("#own-body").isVisible())) await p.click('#tabbar [data-tab="home"]');
  await p.click('[data-tenure="own"]');
  await settle(p);
}

/** Opens one info button by keyboard focus, as the responsive checks do, and checks the text and that it fits. */
async function expectTip(p, selector, ...snippets) {
  const button = p.locator(selector);
  await button.scrollIntoViewIfNeeded();
  await settle(p);
  await button.evaluate(el => el.blur()); // focusing an already focused button would not reopen its tooltip
  await button.focus();
  assert.equal(await p.locator("#tip").isVisible(), true, `${selector}: focus opens the tooltip`);
  const text = await p.textContent("#tip");
  for (const snippet of snippets)
    assert.ok(text.includes(snippet), `${selector}: tooltip says "${snippet}", got "${text}"`);
  const box = await p.locator("#tip").boundingBox();
  assert.ok(box.x >= 0 && box.x + box.width <= p.viewportSize().width, `${selector}: tooltip fits the width`);
  assert.ok(box.y >= 0 && box.y + box.height <= p.viewportSize().height, `${selector}: tooltip fits the height`);
  await p.keyboard.press("Escape");
  assert.equal(await p.locator("#tip").isVisible(), false, `${selector}: Escape closes the tooltip`);
  await noSideScroll(p, `${selector}: no sideways scroll`);
}

export async function checkPropertyRelief(p) {
  // Tooltips (2026, B.C.).
  await p.selectOption("#tax-year", "2026");
  await p.selectOption("#home", "BC");
  await openHome(p);
  await type(p, "#hv", "800000");
  await expectTip(p, "#relief-tip-city", "default reference-city bill");
  await expectTip(p, "#relief-tip-benefit", "benefit year", "previous year's income");
  await expectTip(p, "#relief-tip-deferral", "deferral and loan programs are excluded");
  await expectTip(p, "#relief-tip-allowance", "SAFER", "not modelled");
  // 2025 has no programs: the year tooltip says why and the other controls go away.
  await p.selectOption("#tax-year", "2025");
  await settle(p);
  await expectTip(p, "#relief-tip-years", "2026 only");
  assert.equal(await p.locator("#relief-tips").isVisible(), false, "2025: no relief tooltips beyond the year notice");
  await p.selectOption("#tax-year", "2026");
  await settle(p);
  await expectTip(p, "#relief-tip-years", "2026 only");

  // B.C.: gross is the default; the ordinary grant is min(570, 4,000 - 350) = 570 on a $4,000 bill.
  await type(p, "#property-tax-bill", "4000");
  assert.equal(await p.inputValue("#property-bill-basis"), "gross", "a bill is gross unless net is chosen");
  assert.equal(await amountOf(p, "B.C. home owner grant"), "$570");
  // Net: until the grant already on the bill is stated, the line says Incomplete and shows no amount.
  await p.selectOption("#property-bill-basis", "net");
  await type(p, "#property-tax-bill", "3430");
  assert.equal(await amountOf(p, "B.C. home owner grant"), "Incomplete", "missing amount is text, not $0");
  assert.equal(await amountOf(p, "B.C. low-income grant supplement"), "Incomplete");
  // $570 already on the bill leaves nothing to credit again: the line disappears with the bill at 3,430.
  await type(p, "#relief-applied-bc-home-owner-grant", "570");
  assert.equal(await amountOf(p, "B.C. home owner grant"), undefined, "an applied grant is not credited twice");
  const refundWithGrant = await p.textContent("#cred-sum");
  // An explicit 0 means the bill has no grant: the model credits it.
  await type(p, "#relief-applied-bc-home-owner-grant", "0");
  assert.equal(await amountOf(p, "B.C. home owner grant"), "$570");
  assert.notEqual(await p.textContent("#cred-sum"), refundWithGrant);
  // No home value: the assessed-value reduction is unknown, so the grant is incomplete.
  await type(p, "#hv", "0");
  assert.equal(await amountOf(p, "B.C. home owner grant"), "Incomplete", "BC grant needs the home value");
  await type(p, "#hv", "800000");
  await p.selectOption("#bc-region", "rural");
  await settle(p);
  assert.equal(await amountOf(p, "B.C. home owner grant"), "$770", "northern and rural amount");
  await p.selectOption("#bc-region", "metro");

  // Manitoba: the school tax caps the homeowners credit; a bill with none stated is incomplete, never the whole bill.
  await p.selectOption("#home", "MB");
  await openHome(p);
  await type(p, "#hv", "300000");
  assert.equal(await amountOf(p, "Homeowners affordability tax credit"), "$1,600", "default-city bill estimate");
  await type(p, "#property-tax-bill", "5000");
  assert.equal(await amountOf(p, "Homeowners affordability tax credit"), "Incomplete");
  await type(p, "#school-tax", "800");
  assert.equal(await amountOf(p, "Homeowners affordability tax credit"), "$800", "capped by school tax");
  await type(p, "#school-tax", "1700");
  assert.equal(await amountOf(p, "Homeowners affordability tax credit"), "$1,600", "capped at the maximum");
  // Net bill: the advance restores the gross school tax. 3,400 net + 1,600 advance = 5,000; 100 + 1,600 = 1,700.
  await p.selectOption("#property-bill-basis", "net");
  await type(p, "#property-tax-bill", "3400");
  await type(p, "#school-tax", "100");
  assert.equal(await amountOf(p, "Homeowners affordability tax credit"), "Incomplete", "advance not yet stated");
  await type(p, "#relief-applied-mb-homeowners-school-tax-credit", "1600");
  assert.equal(await amountOf(p, "Homeowners affordability tax credit"), undefined, "advance covers the credit");
  await noSideScroll(p, "Manitoba net bill");

  // Reload: the choices come back from saved state.
  await p.reload();
  await settle(p);
  await openHome(p);
  assert.equal(await p.inputValue("#property-bill-basis"), "net");
  assert.equal(await p.inputValue("#school-tax"), "100");
  assert.equal(await p.inputValue("#relief-applied-mb-homeowners-school-tax-credit"), "1,600");
  assert.equal(await amountOf(p, "Homeowners affordability tax credit"), undefined);
  // The same from device storage alone (no link fragment).
  await p.evaluate(() => history.replaceState(null, "", location.pathname + location.search));
  await p.reload();
  await settle(p);
  await openHome(p);
  assert.equal(await p.inputValue("#property-bill-basis"), "net", "saved state restores the net choice");
  assert.equal(await p.inputValue("#school-tax"), "100");
  // A bill saved before the basis existed loads as gross.
  await p.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem("taxcmp") || "{}");
    for (const key of ["propertyBillBasis", "propertyReliefApplied", "schoolTax", "bcNorthernRural"]) delete saved[key];
    localStorage.setItem("taxcmp", JSON.stringify(saved));
    history.replaceState(null, "", location.pathname + location.search);
  });
  await p.reload();
  await settle(p);
  await openHome(p);
  assert.equal(await p.inputValue("#property-bill-basis"), "gross", "old saved bills load as gross");
  assert.equal(await p.inputValue("#school-tax"), "");
  await noSideScroll(p, "after reload");
  // Leave the page as other steps expect: no bill, estimate.
  await type(p, "#property-tax-bill", "");
}

import type { Person, RetirementReceipt } from "../engine/types.ts";
import { parseSelfEmployment } from "./self-employment.ts";
import { eligibleSurvivor, RECEIPT_TYPES, survivorType } from "./senior-income.ts";

function required<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing ${selector}`);
  return element;
}

/** The selected adult owns these controls; invalid drafts never replace saved amounts. */
export function publicPensionEditor(selected: () => Person, change: () => void) {
  const oas = required<HTMLInputElement>(document, "#senior-oas");
  const benefits = (["gis", "allowance"] as const).map(key => ({
    key,
    input: required<HTMLInputElement>(document, `#senior-${key}`),
  }));
  const cpp = required<HTMLInputElement>(document, "#senior-cpp-qpp");
  let owner: Person | undefined;
  function sync() {
    const person = selected();
    const switched = owner !== person;
    if (switched) {
      owner = person;
      cpp.setCustomValidity("");
      cpp.setAttribute("aria-invalid", "false");
    }
    oas.checked = person.oas === true;
    for (const { key, input } of benefits) input.checked = person[key] === true;
    if (switched || (document.activeElement !== cpp && cpp.validity.valid))
      cpp.value = person.cppQpp?.toLocaleString("en-CA") ?? "";
  }
  oas.addEventListener("input", () => {
    selected().oas = oas.checked;
    change();
  });
  cpp.addEventListener("input", () => {
    const amount = parseSelfEmployment(cpp.value);
    cpp.setCustomValidity(amount === null ? "Enter a nonnegative amount with up to two decimal places." : "");
    cpp.setAttribute("aria-invalid", String(amount === null));
    if (amount === null) return;
    if (amount === undefined) delete selected().cppQpp;
    else selected().cppQpp = amount;
    change();
  });
  for (const { key, input } of benefits)
    input.addEventListener("input", () => {
      selected()[key] = input.checked;
      change();
    });
  cpp.addEventListener("blur", () => sync());
  return { sync };
}

/** Each row is a receipt, so one adult can enter both ordinary and survivor receipts of the same type. */
export function seniorEditor(selected: () => RetirementReceipt[], change: (rows: RetirementReceipt[]) => void) {
  const rows = required<HTMLElement>(document, "#senior-rows");
  const add = required<HTMLButtonElement>(document, "#senior-add");
  let owner: RetirementReceipt[] | undefined;
  const options = Object.entries(RECEIPT_TYPES)
    .map(([key, label]) => `<option value="${key}">${label}</option>`)
    .join("");
  function sync(force = false) {
    const receipts = selected();
    if (force || owner !== receipts || rows.children.length !== receipts.length) {
      owner = receipts;
      rows.innerHTML = receipts
        .map(
          (_, i) => `<div class="senior-row" data-receipt="${i}">
        <div class="field"><label class="lbl" for="senior-type-${i}">Receipt ${i + 1}</label><select id="senior-type-${i}" class="wh-select" data-field="type">${options}</select></div>
        <div class="field"><label class="lbl" for="senior-amount-${i}">Annual amount</label><div class="money md"><span>$</span><input id="senior-amount-${i}" data-field="amount" inputmode="decimal" autocomplete="off"></div></div>
        <label class="senior-survivor"><input id="senior-survivor-${i}" type="checkbox" data-field="survivor"> Eligible survivor receipt</label>
        <button type="button" class="linkbtn" data-remove="${i}" aria-label="Remove receipt ${i + 1}">Remove</button>
      </div>`,
        )
        .join("");
    }
    receipts.forEach((receipt, i) => {
      const row = rows.children[i];
      const type = required<HTMLSelectElement>(row, "select");
      const amount = required<HTMLInputElement>(row, '[data-field="amount"]');
      const survivor = required<HTMLInputElement>(row, '[data-field="survivor"]');
      type.value = receipt.type;
      if (document.activeElement !== amount && amount.validity.valid)
        amount.value = receipt.amount.toLocaleString("en-CA");
      survivor.checked = eligibleSurvivor(receipt);
      (survivor.parentElement as HTMLElement).hidden = !survivorType(receipt.type);
    });
    add.disabled = receipts.length >= 64;
  }
  rows.addEventListener("input", event => {
    const field = event.target as HTMLInputElement | HTMLSelectElement;
    const row = field.closest<HTMLElement>("[data-receipt]");
    if (!row) return;
    const receipts = selected();
    const receipt = receipts[Number(row.dataset.receipt)] as RetirementReceipt & { survivorEligible?: boolean };
    if (field.dataset.field === "amount") {
      const amount = parseSelfEmployment(field.value);
      field.setCustomValidity(amount === null ? "Enter a nonnegative amount with up to two decimal places." : "");
      field.setAttribute("aria-invalid", String(amount === null));
      if (amount === null) return;
      receipt.amount = amount ?? 0;
    } else if (field.dataset.field === "type") {
      receipt.type = field.value as RetirementReceipt["type"];
      if (!survivorType(receipt.type)) delete receipt.survivorEligible;
    } else receipt.survivorEligible = (field as HTMLInputElement).checked;
    change(receipts);
  });
  rows.addEventListener("click", event => {
    const button = (event.target as Element).closest<HTMLElement>("[data-remove]");
    if (!button) return;
    change(selected().filter((_, i) => i !== Number(button.dataset.remove)));
    add.focus();
  });
  rows.addEventListener("focusout", event => {
    if (event.target instanceof HTMLInputElement && event.target.validity.valid) sync();
  });
  add.addEventListener("click", () => {
    change([...selected(), { type: "rppLifetime", amount: 0 }]);
    rows.querySelector<HTMLSelectElement>(".senior-row:last-child select")?.focus();
  });
  return { sync };
}

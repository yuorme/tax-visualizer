import type { ChildcareChild, ChildcareInput, ChildcareResult, Result } from "../engine/index.ts";

interface ChildDraft {
  age: number | null;
  expenses: number;
  disabilityTaxCredit: boolean;
  infirm: boolean;
  qcEligibleExpenses: number | null;
  qcSevereImpairment: boolean;
}
interface CareState {
  monthly: number;
  mode: "automatic" | "manual";
  children: ChildDraft[];
  earnings: (number | null)[];
  claims: (number | null)[];
}
const child = (): ChildDraft => ({
  age: null,
  expenses: 0,
  disabilityTaxCredit: false,
  infirm: false,
  qcEligibleExpenses: null,
  qcSevereImpairment: false,
});
const amount = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0;
const text = (v: number | null) => (v === null ? "" : v.toLocaleString("en-CA", { maximumFractionDigits: 2 }));
const parse = (v: string): number | null =>
  v.trim() === "" ? null : Math.min(Number(v.replace(/[^\d.]/g, "")) || 0, 99999999);
const attrText = (v: string) => v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const info = (label: string, tip: string) =>
  `<button type="button" class="info" aria-label="About ${label}" data-tip="${attrText(tip)}">i</button>`;
const field = (id: string, label: string, tip: string, value: number | null, currency = true) =>
  `<div class="field"><div class="lbl-row"><label class="lbl" for="${id}">${label}</label>${info(label, tip)}</div><div class="money sm">${currency ? "<span>$</span>" : ""}<input id="${id}" inputmode="decimal" autocomplete="off" value="${text(value)}">${currency ? '<span class="per">a year</span>' : ""}</div></div>`;
const check = (id: string, label: string, tip: string, on: boolean) =>
  `<div class="care-check"><label class="check" for="${id}"><input id="${id}" type="checkbox" ${on ? "checked" : ""}>${label}</label>${info(label, tip)}</div>`;

export const childcareReasons: Record<string, string> = {
  "children-required": "Enter each child's year-end age and annual expenses, including children with no expenses.",
  "invalid-child-details": "Check the children's ages and annual expenses.",
  "earned-income-required": "Enter eligible annual earned income for each adult, including an explicit zero.",
  "invalid-earned-income": "Check eligible earned income for each adult.",
  "manual-claims-required": "Enter each adult's verified annual claim, including an explicit zero.",
  "claims-exceed-expenses": "Verified claims cannot exceed the annual expenses entered.",
  "unsupported-supporting-person-situation":
    "This household needs verified manual claims; automatic calculation covers ordinary lone-parent and couple cases.",
  "year-not-supported": "Childcare rules are not available for the selected tax year.",
  "expenses-not-allocated":
    "The annual expenses entered for all children must match the monthly household average, allowing for rounding to cents.",
  "invalid-declared-expenses": "Check the monthly household childcare amount.",
  "quebec-eligible-expenses-required":
    "Enter the Quebec-eligible portion for each child with expenses, including zero if none qualify.",
  "invalid-quebec-expenses": "The Quebec-eligible portion cannot exceed that child's annual expenses.",
  "quebec-family-income-requires-verification":
    "Quebec childcare relief for this household requires a separately verified family-income calculation.",
  "ontario-supporting-person-income-requires-verification":
    "Ontario CARE for this household requires a separately verified supporting-person income calculation.",
};
export const careStatusText = (status: string) =>
  ({
    none: "Not entered",
    complete: "Calculated",
    incomplete: "Details needed",
    invalid: "Check inputs",
    "manual-required": "Manual claim needed",
    unsupported: "Not calculated",
  })[status] ?? "Check details";

/** Owns form state and unit conversion only; the engine validates claims and computes every tax amount. */
export class ChildcareEditor {
  state: CareState = { monthly: 0, mode: "automatic", children: [], earnings: [null, null], claims: [null, null] };
  private adults = 1;
  private initialKids = 0;
  private fieldsKey = "";
  private year = 0;
  private readonly monthly = document.getElementById("childcare-monthly") as HTMLInputElement;
  private readonly panel = document.getElementById("childcare-details") as HTMLDetailsElement;
  private readonly fields = document.getElementById("childcare-fields") as HTMLElement;

  constructor(private readonly changed: () => void) {
    this.monthly.addEventListener("input", () => {
      this.state.monthly = parse(this.monthly.value) ?? 0;
      if (this.state.monthly > 0 && !this.state.children.length) {
        this.state.children = Array.from({ length: Math.max(1, this.initialKids) }, child);
        this.panel.open = true;
      }
      this.changed();
    });
    this.monthly.addEventListener("blur", () => {
      this.monthly.value = text(this.state.monthly);
    });
    this.fields.addEventListener("input", e => {
      const el = e.target;
      if (!(el instanceof HTMLInputElement)) return;
      const match = /^care-(age|expenses|dtc|infirm|qc|severe)-(\d+)$/.exec(el.id);
      if (match) {
        const c = this.state.children[Number(match[2])];
        switch (match[1]) {
          case "age":
            c.age = parse(el.value);
            break;
          case "expenses":
            c.expenses = parse(el.value) ?? 0;
            break;
          case "qc":
            c.qcEligibleExpenses = parse(el.value);
            break;
          case "dtc":
            c.disabilityTaxCredit = el.checked;
            break;
          case "infirm":
            c.infirm = el.checked;
            break;
          case "severe":
            c.qcSevereImpairment = el.checked;
            break;
        }
      } else {
        const adult = /^care-(earnings|claim)-(\d+)$/.exec(el.id);
        if (adult) this.state[adult[1] === "earnings" ? "earnings" : "claims"][Number(adult[2])] = parse(el.value);
      }
      this.changed();
    });
    this.fields.addEventListener("change", e => {
      if (e.target instanceof HTMLSelectElement && e.target.id === "care-mode") {
        this.state.mode = e.target.value === "manual" ? "manual" : "automatic";
        this.changed();
      }
    });
    this.fields.addEventListener("click", e => {
      const button = e.target instanceof Element ? e.target.closest<HTMLButtonElement>("button[data-care]") : null;
      if (!button) return;
      if (button.dataset.care === "add") this.state.children.push(child());
      else if (button.dataset.care === "remove") this.state.children.splice(Number(button.dataset.index), 1);
      this.fieldsKey = "";
      this.changed();
    });
    this.fields.addEventListener("focusout", e => {
      if (e.target instanceof HTMLInputElement && e.target.type !== "checkbox") {
        const n = parse(e.target.value);
        e.target.value = text(n);
      }
    });
  }

  restore(value: unknown) {
    if (!value || typeof value !== "object") return;
    const s = value as Partial<CareState>;
    if (amount(s.monthly)) this.state.monthly = s.monthly;
    this.state.mode = s.mode === "manual" ? "manual" : "automatic";
    for (const key of ["earnings", "claims"] as const)
      if (Array.isArray(s[key])) this.state[key] = [0, 1].map(i => (amount(s[key]?.[i]) ? s[key][i] : null));
    if (Array.isArray(s.children))
      this.state.children = s.children.slice(0, 6).map(c => ({
        age: amount(c?.age) && Number.isInteger(c.age) ? c.age : null,
        expenses: amount(c?.expenses) ? c.expenses : 0,
        disabilityTaxCredit: c?.disabilityTaxCredit === true,
        infirm: c?.infirm === true,
        qcEligibleExpenses: amount(c?.qcEligibleExpenses) ? c.qcEligibleExpenses : null,
        qcSevereImpairment: c?.qcSevereImpairment === true,
      }));
    this.monthly.value = text(this.state.monthly);
  }

  get enabled() {
    return this.state.monthly > 0 || this.state.children.length > 0;
  }
  get detailedAges() {
    return this.state.children.length > 0;
  }

  configure(adults: number, kids: number, year: number) {
    this.adults = adults;
    this.initialKids = kids;
    this.year = year;
  }

  input(): ChildcareInput | undefined {
    if (!this.enabled) return undefined;
    const children: ChildcareChild[] | undefined = this.state.children.every(c => c.age !== null)
      ? this.state.children.map(c => ({
          ...c,
          age: c.age as number,
          qcEligibleExpenses: c.qcEligibleExpenses ?? undefined,
        }))
      : undefined;
    return {
      mode: this.state.mode,
      children,
      declaredAnnualExpenses: this.state.monthly * 12,
      earnedIncome: this.state.earnings.slice(0, this.adults),
      manualClaims: this.state.claims.slice(0, this.adults).every(v => v !== null)
        ? (this.state.claims.slice(0, this.adults) as number[])
        : undefined,
    };
  }

  render(result: Result) {
    this.panel.hidden = !this.enabled;
    const key = `${this.state.children.length}/${this.adults}/${this.state.mode}/${this.year}`;
    if (key !== this.fieldsKey) {
      this.fieldsKey = key;
      this.fields.innerHTML =
        `<div class="care-grid"><div class="field"><div class="lbl-row"><label class="lbl" for="care-mode">Claim method</label>${info("Claim method", "Automatic claims cover ordinary lone-parent and couple cases. For exceptions such as study, incapacity or separation, enter verified annual deductions per adult. Manual claims replace automatic claims; you are responsible for checking eligibility.")}</div><select id="care-mode" class="prov-select"><option value="automatic" ${this.state.mode === "automatic" ? "selected" : ""}>Automatic</option><option value="manual" ${this.state.mode === "manual" ? "selected" : ""}>Verified manual claims</option></select></div>${Array.from(
          { length: this.adults },
          (_, i) =>
            this.state.mode === "manual"
              ? field(
                  `care-claim-${i}`,
                  `${i ? "Partner's" : "Your"} verified claim`,
                  "Annual childcare deduction verified for this adult. Include zero when this adult has no claim. Do not also include this amount in Other deductions.",
                  this.state.claims[i],
                )
              : field(
                  `care-earnings-${i}`,
                  `${i ? "Partner's" : "Your"} eligible earnings`,
                  "Annual earned income eligible for the childcare deduction. Enter zero explicitly if none. This is not necessarily the employment and other income total: pensions and investment income generally do not qualify. A spouse without income entered above still needs an explicit value here.",
                  this.state.earnings[i],
                ),
        ).join("")}</div>` +
        this.state.children
          .map(
            (c, i) =>
              `<fieldset class="care-child"><legend>Child ${i + 1}</legend><div class="care-grid">${field(`care-age-${i}`, `Age at end of ${this.year}`, "Enter the child's age on December 31 of the selected tax year. Include every eligible child, even if no childcare expenses were paid for that child. These ages also determine child-benefit counts.", c.age, false)}${field(`care-expenses-${i}`, "Annual childcare", "Eligible annual childcare expenses after fee subsidies and reimbursements. Across all children, the annual amounts must equal twelve times the monthly household amount. Do not subtract advance tax-credit payments.", c.expenses)}</div><div class="care-checks">${check(`care-dtc-${i}`, "Federal disability tax credit eligible", "Eligibility for the federal disability tax credit can increase the federal annual childcare limit. This is distinct from Quebec's severe and prolonged impairment eligibility.", c.disabilityTaxCredit)}${check(`care-infirm-${i}`, "Dependent child with an infirmity", "Select when this dependent child's infirmity permits childcare eligibility beyond the ordinary age limit. This does not by itself establish eligibility for the higher disability tax credit limit.", c.infirm)}</div><details class="care-quebec"><summary>Quebec eligibility</summary><div class="care-grid">${field(`care-qc-${i}`, "Quebec-eligible portion", "The part of this child's annual expenses eligible for Quebec's credit. Leave blank to exclude an unverified credit; enter zero when no expenses qualify. Subsidized base fees are excluded, but eligible extras may qualify. Enter qualifying expenses only and check the eligible-activity rules; advance credit payments are not fee subsidies.", c.qcEligibleExpenses)}</div>${check(`care-severe-${i}`, "Quebec severe and prolonged impairment", "Select only if the child meets Quebec's severe and prolonged impairment criteria for the higher childcare limit. Federal disability tax credit eligibility is not used as a substitute.", c.qcSevereImpairment)}</details><button type="button" class="linkbtn" data-care="remove" data-index="${i}" aria-label="Remove child ${i + 1}">Remove child</button></fieldset>`,
          )
          .join("") +
        `<button type="button" class="linkbtn" data-care="add" ${this.state.children.length >= 6 ? "disabled" : ""}>Add child</button>`;
    }
    const federal = result.childcare;
    const errors = federal.reasons.map(r => childcareReasons[r]).filter(Boolean);
    const annual = this.state.children.reduce((sum, c) => sum + c.expenses, 0);
    const matches = Math.abs(annual - this.state.monthly * 12) <= 0.06 + 1e-9;
    this.monthly.setCustomValidity(
      this.enabled && !matches ? "Annual child expenses must match twelve times the monthly amount." : "",
    );
    this.monthly.setAttribute("aria-invalid", String(this.enabled && !matches));
    const tooltip = document.getElementById("childcare-info") as HTMLElement;
    tooltip.dataset.tip = `Average monthly eligible childcare costs across the whole year, after fee subsidies and reimbursements. Do not subtract advance tax-credit payments. These costs are separate from taxable household spending. ${errors.join(" ")}`;
    for (let i = 0; i < this.adults; i++) {
      const id = this.state.mode === "manual" ? `care-claim-${i}` : `care-earnings-${i}`;
      const el = document.getElementById(id) as HTMLInputElement | null;
      const missing = this.state[this.state.mode === "manual" ? "claims" : "earnings"][i] === null;
      if (el) {
        el.setAttribute("aria-invalid", String(missing));
        el.setCustomValidity(missing ? "Enter an amount, including zero." : "");
      }
    }
    for (let i = 0; i < this.state.children.length; i++) {
      const c = this.state.children[i];
      const age = document.getElementById(`care-age-${i}`) as HTMLInputElement;
      age.setAttribute("aria-invalid", String(c.age === null || !Number.isInteger(c.age)));
      const qc = document.getElementById(`care-qc-${i}`) as HTMLInputElement;
      qc.setAttribute("aria-invalid", String(c.qcEligibleExpenses !== null && c.qcEligibleExpenses > c.expenses));
    }
  }
}

export function federalCareExplanation(c: ChildcareResult): string {
  if (c.status !== "complete") return c.reasons.map(r => childcareReasons[r] ?? r.replace(/-/g, " ")).join(" ");
  return c.mode === "manual"
    ? "Verified manual deductions replace the automatic claims."
    : "The deduction is limited by eligible expenses, pooled annual child limits and eligible earnings. For equal net incomes, the first adult is elected as claimant. Eligible earnings stay fixed when the existing mixed-income marginal rate is calculated.";
}

/** Rows inside the existing comparison table; expenses and claims are explanatory, not additional taxes. */
export function childcareComparison(a: Result, b: Result): string {
  const money = (n: number) => `$${Math.round(n).toLocaleString("en-CA")}`;
  const row = (label: string, av: string, bv: string, tip: string) =>
    `<tr class="care-breakdown"><td>${label} ${info(label, tip)}</td><td class="r">${av}</td><td class="r">${bv}</td><td class="r">–</td></tr>`;
  const status = (r: Result) =>
    `<span title="${attrText(federalCareExplanation(r.childcare))}">${careStatusText(r.childcare.status)}</span>`;
  let rows = `<tr class="grp"><th colspan="4">Childcare tax treatment</th></tr>`;
  rows += row(
    "Annual childcare expenses",
    money(a.childcare.expenses),
    money(b.childcare.expenses),
    "Childcare spending itself is not added to the tax total. Allowed deductions and credits are already reflected in the tax and benefit rows above.",
  );
  rows += row(
    "Federal calculation",
    status(a),
    status(b),
    `${federalCareExplanation(a.childcare)} ${federalCareExplanation(b.childcare)}`,
  );
  for (let i = 0; i < Math.max(a.childcare.claims.length, b.childcare.claims.length); i++)
    rows += row(
      `${i ? "Partner's" : "Your"} federal childcare deduction`,
      money(a.childcare.claims[i] ?? 0),
      money(b.childcare.claims[i] ?? 0),
      "The allowed deduction reduces this adult's federal net income. Quebec provincial income excludes the federal childcare deduction. Do not also include it in Other deductions.",
    );
  const credit = (r: Result) => r.breakdown.childcareCredit;
  if (credit(a) || credit(b)) {
    const explanation = [credit(a), credit(b)]
      .filter(c => c !== undefined)
      .map(
        c =>
          `${c.name}: ${careStatusText(c.status)}. ${c.reasons.map(reason => childcareReasons[reason] ?? reason.replace(/-/g, " ")).join(" ")}`,
      )
      .join(" ");
    rows += row(
      "Provincial childcare credit",
      credit(a) ? `${money(credit(a).applied)} · ${careStatusText(credit(a).status)}` : "Not applicable",
      credit(b) ? `${money(credit(b).applied)} · ${careStatusText(credit(b).status)}` : "Not applicable",
      explanation,
    );
    rows += row(
      "Eligible provincial expenses",
      money(credit(a)?.allowedExpenses ?? 0),
      money(credit(b)?.allowedExpenses ?? 0),
      "Eligible expenses after the provincial program's limits; Quebec eligibility is supplied separately. Ontario and Newfoundland and Labrador use the allowed federal deduction.",
    );
    rows += row(
      "Provincial credit rate",
      `${((credit(a)?.rate ?? 0) * 100).toFixed(1)}%`,
      `${((credit(b)?.rate ?? 0) * 100).toFixed(1)}%`,
      "The rate supplied by each province's calculation. Refundable credits are applied only when enabled; Newfoundland and Labrador's nonrefundable credit is limited to tax remaining.",
    );
  }
  return rows;
}

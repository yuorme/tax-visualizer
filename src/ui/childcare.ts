import type { ChildcareChild, ChildcareInput, ChildcareResult, Result } from "../engine/index.ts";

// Keep pending text separate from accepted numbers: malformed text must survive blur and storage unchanged.
type NumericDraft = number | string | null;
interface ChildDraft {
  age: NumericDraft;
  expenses: NumericDraft;
  disabilityTaxCredit: boolean;
  infirm: boolean;
  qcEligibleExpenses: NumericDraft;
  qcSevereImpairment: boolean;
}
interface CareState {
  monthly: NumericDraft;
  mode: "automatic" | "manual";
  children: ChildDraft[];
  activeChildren: number;
  earnings: NumericDraft[];
  earningsOverridden: boolean[];
  claims: NumericDraft[];
  touched: string[];
}
const child = (): ChildDraft => ({
  age: null,
  expenses: null,
  disabilityTaxCredit: false,
  infirm: false,
  qcEligibleExpenses: null,
  qcSevereImpairment: false,
});
const amount = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0;
const text = (v: NumericDraft) =>
  v === null ? "" : typeof v === "string" ? v : v.toLocaleString("en-CA", { maximumFractionDigits: 2 });
const parse = (v: string): NumericDraft => {
  const trimmed = v.trim();
  if (!trimmed) return null;
  const n = Number(trimmed.replace(/,/g, ""));
  return /^(?:(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?|\.\d{1,2})$/.test(trimmed) && amount(n) ? n : v;
};
const restoreNumber = (v: unknown): NumericDraft =>
  typeof v === "string" ? parse(v) : amount(v) ? v : typeof v === "number" ? String(v) : null;
const wholeAge = (v: NumericDraft): v is number => amount(v) && Number.isInteger(v);
const monthlyAmount = (v: NumericDraft): v is number => amount(v) && Number.isFinite(v * 12);
const attrText = (v: string) => v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const info = (label: string, tip: string) =>
  `<button type="button" class="info" aria-label="About ${label}" data-tip="${attrText(tip)}">i</button>`;
const field = (id: string, label: string, tip: string, value: NumericDraft, currency = true) =>
  `<div class="field"><div class="lbl-row"><label class="lbl" for="${id}">${label}</label>${info(label, tip)}</div><div class="money sm">${currency ? "<span>$</span>" : ""}<input id="${id}" inputmode="${currency ? "decimal" : "numeric"}" autocomplete="off" value="${attrText(text(value))}">${currency ? '<span class="per">a year</span>' : ""}</div></div>`;
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

/** Draft state and unit conversion only. Tax eligibility and calculations stay in the engine. */
export class ChildcareModel {
  state: CareState = {
    monthly: 0,
    mode: "automatic",
    children: [],
    activeChildren: 0,
    earnings: [null, null],
    earningsOverridden: [false, false],
    claims: [null, null],
    touched: [],
  };
  protected incomes: number[] = [0];
  protected kids = 0;

  configure(incomes: number[], kids: number) {
    this.incomes = incomes;
    this.kids = kids;
    if (this.state.activeChildren !== kids) this.setChildCount(kids);
  }

  setChildCount(count: number) {
    this.kids = count;
    this.state.activeChildren = count;
    while (this.state.children.length < count) this.state.children.push(child());
  }

  removeChild(index: number) {
    this.state.children.splice(index, 1);
    this.setChildCount(Math.max(0, this.state.activeChildren - 1));
    this.state.touched = this.state.touched.filter(id => !/^care-(age|expenses|qc)-/.test(id));
  }

  setMonthly(raw: string) {
    this.state.monthly = parse(raw);
    this.touch("childcare-monthly");
    if (this.kids > 0 && !this.state.activeChildren) this.setChildCount(this.kids);
  }

  touch(id: string) {
    if (!this.state.touched.includes(id)) this.state.touched.push(id);
  }

  setNumber(id: string, raw: string) {
    const value = parse(raw);
    const childField = /^care-(age|expenses|qc)-(\d+)$/.exec(id);
    if (childField) {
      const key = childField[1] === "qc" ? "qcEligibleExpenses" : childField[1] === "age" ? "age" : "expenses";
      this.state.children[Number(childField[2])][key] = value;
    } else {
      const adult = /^care-(earnings|claim)-(\d+)$/.exec(id);
      if (adult) this.state[adult[1] === "earnings" ? "earnings" : "claims"][Number(adult[2])] = value;
    }
    this.touch(id);
  }

  overrideEarnings(index: number, on: boolean) {
    if (on && this.state.earnings[index] === null && !this.state.touched.includes(`care-earnings-${index}`))
      this.state.earnings[index] = this.incomes[index];
    this.state.earningsOverridden[index] = on;
  }

  get earnings() {
    return this.incomes.map((income, i) => (this.state.earningsOverridden[i] ? this.state.earnings[i] : income));
  }
  get children() {
    return this.state.children.slice(0, this.state.activeChildren);
  }
  get enabled() {
    return this.kids > 0 && this.state.activeChildren > 0 && this.state.monthly !== 0;
  }
  get detailedAges() {
    return (
      this.enabled ||
      (this.kids > 0 && this.children.some((c, i) => c.age !== null || this.state.touched.includes(`care-age-${i}`)))
    );
  }

  restore(value: unknown) {
    if (!value || typeof value !== "object") return;
    const s = value as Partial<CareState>;
    if ("monthly" in s) this.state.monthly = restoreNumber(s.monthly);
    this.state.mode = s.mode === "manual" ? "manual" : "automatic";
    for (const key of ["earnings", "claims"] as const)
      if (Array.isArray(s[key])) this.state[key] = [0, 1].map(i => restoreNumber(s[key]?.[i]));
    // Earlier saved explicit earnings remain overrides; old missing earnings now follow ordinary income.
    this.state.earningsOverridden = [0, 1].map(i =>
      Array.isArray(s.earningsOverridden) ? s.earningsOverridden[i] === true : this.state.earnings[i] !== null,
    );
    if (Array.isArray(s.children))
      this.state.children = s.children.slice(0, 6).map(c => ({
        age: restoreNumber(c?.age),
        expenses: restoreNumber(c?.expenses),
        disabilityTaxCredit: c?.disabilityTaxCredit === true,
        infirm: c?.infirm === true,
        qcEligibleExpenses: restoreNumber(c?.qcEligibleExpenses),
        qcSevereImpairment: c?.qcSevereImpairment === true,
      }));
    this.state.activeChildren =
      amount(s.activeChildren) && Number.isInteger(s.activeChildren)
        ? Math.min(6, s.activeChildren)
        : this.state.children.length;
    while (this.state.children.length < this.state.activeChildren) this.state.children.push(child());
    this.state.touched = Array.isArray(s.touched) ? s.touched.filter(id => typeof id === "string") : [];
  }

  /** Actual paid-care inputs. Bad amounts remain incomplete; this is the only profile used for relief. */
  claimInput(): ChildcareInput | undefined {
    if (!this.enabled) return undefined;
    const children: ChildcareChild[] | undefined =
      monthlyAmount(this.state.monthly) && this.children.every(c => wholeAge(c.age) && amount(c.expenses))
        ? this.children.map(c => ({
            ...c,
            age: c.age as number,
            expenses: c.expenses as number,
            qcEligibleExpenses: amount(c.qcEligibleExpenses) ? c.qcEligibleExpenses : undefined,
          }))
        : undefined;
    const claims = this.state.claims.slice(0, this.incomes.length);
    return {
      mode: this.state.mode,
      children,
      declaredAnnualExpenses: monthlyAmount(this.state.monthly) ? this.state.monthly * 12 : undefined,
      earnedIncome: this.earnings.map(v => (amount(v) ? v : null)),
      manualClaims: claims.every(amount) ? (claims as number[]) : undefined,
    };
  }

  /** Valid ages independent of claim inputs. Use for childcareOf's childCounts and Household.childAges;
   * never pass as compute's childcare input: zero expenses must not replace drafts or apply childcare relief. */
  benefitAgeProfile(): ChildcareInput | undefined {
    if (this.kids === 0 || this.state.activeChildren === 0 || !this.children.every(c => wholeAge(c.age)))
      return undefined;
    return {
      mode: "automatic",
      children: this.children.map(c => ({ age: c.age as number, expenses: 0 })),
    };
  }
}

export class ChildcareEditor extends ChildcareModel {
  private fieldsKey = "";
  private year = 0;
  private homeQuebec = false;
  private readonly monthly = document.getElementById("childcare-monthly") as HTMLInputElement;
  private readonly panel = document.getElementById("childcare-details") as HTMLDetailsElement;
  private readonly fields = document.getElementById("childcare-fields") as HTMLElement;

  constructor(private readonly changed: (childCount?: number) => void) {
    super();
    this.monthly.addEventListener("input", () => {
      const wasEnabled = this.enabled;
      this.setMonthly(this.monthly.value);
      if (!wasEnabled && this.enabled) this.panel.open = true;
      if (wasEnabled && !this.enabled) this.panel.open = false;
      this.changed();
    });
    this.monthly.addEventListener("blur", () => {
      this.monthly.value = text(this.state.monthly);
    });
    this.fields.addEventListener("input", e => {
      const el = e.target;
      if (!(el instanceof HTMLInputElement)) return;
      if (el.type !== "checkbox") this.setNumber(el.id, el.value);
      else {
        const toggle = /^care-(dtc|infirm|severe|override)-(\d+)$/.exec(el.id);
        if (!toggle) return;
        const i = Number(toggle[2]);
        if (toggle[1] === "override") this.overrideEarnings(i, el.checked);
        else
          this.state.children[i][
            toggle[1] === "dtc" ? "disabilityTaxCredit" : toggle[1] === "infirm" ? "infirm" : "qcSevereImpairment"
          ] = el.checked;
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
      if (button.dataset.care === "add") this.setChildCount(Math.min(6, this.state.activeChildren + 1));
      else if (button.dataset.care === "remove") this.removeChild(Number(button.dataset.index));
      this.fieldsKey = "";
      this.changed(this.state.activeChildren);
    });
    this.fields.addEventListener("focusout", e => {
      if (e.target instanceof HTMLInputElement && e.target.type !== "checkbox")
        e.target.value = text(parse(e.target.value));
    });
  }

  override restore(value: unknown) {
    super.restore(value);
    this.monthly.value = text(this.state.monthly);
  }

  configureView(incomes: number[], kids: number, year: number, homeQuebec: boolean) {
    this.configure(incomes, kids);
    this.year = year;
    this.homeQuebec = homeQuebec;
  }

  private childRow(c: ChildDraft, i: number) {
    if (!this.enabled)
      return `<div class="care-child"><div class="care-child-row care-age-only"><b class="care-name">Child ${i + 1}</b>${field(`care-age-${i}`, "Age", `Age on December 31, ${this.year}. These retained ages determine benefit eligibility even without paid childcare.`, c.age, false)}<button type="button" class="linkbtn care-remove" data-care="remove" data-index="${i}" aria-label="Remove child ${i + 1}">×</button></div></div>`;
    const qc = this.homeQuebec
      ? `<details class="care-quebec" id="care-quebec-${i}"><summary>Quebec eligibility</summary><div class="care-grid">${field(`care-qc-${i}`, "Quebec-eligible portion", "The part of this child's annual expenses eligible for Quebec's credit. Leave blank to exclude an unverified credit; enter zero when no expenses qualify. Subsidized base fees are excluded, but eligible extras may qualify. Check eligible-activity rules; advance credit payments are not fee subsidies.", c.qcEligibleExpenses)}</div>${check(`care-severe-${i}`, "Quebec severe and prolonged impairment", "Select only if the child meets Quebec's severe and prolonged impairment criteria for the higher childcare limit. Federal disability tax credit eligibility is not a substitute.", c.qcSevereImpairment)}</details>`
      : "";
    return `<div class="care-child"><div class="care-child-row"><b class="care-name">Child ${i + 1}</b>${field(`care-age-${i}`, "Age", `Age on December 31, ${this.year}. Include each child or dependent, even with no childcare expenses. Benefit eligibility is determined separately from these ages.`, c.age, false)}${field(`care-expenses-${i}`, "Annual care", "Eligible annual expenses after fee subsidies and reimbursements. Across all children, annual amounts must match twelve times the monthly household amount. Enter zero for children without expenses. Do not subtract advance tax-credit payments.", c.expenses)}<button type="button" class="linkbtn care-remove" data-care="remove" data-index="${i}" aria-label="Remove child ${i + 1}">×</button></div><details class="care-exceptions" id="care-exceptions-${i}"><summary>Eligibility & exceptions</summary><div class="care-checks">${check(`care-dtc-${i}`, "Federal disability tax credit eligible", "This can increase the federal childcare limit. It is distinct from Quebec severe and prolonged impairment eligibility. This checkbox only informs childcare limits; the general disability tax credit itself is not modelled.", c.disabilityTaxCredit)}${check(`care-infirm-${i}`, "Dependent child with an infirmity", "Select when this dependent child's infirmity permits childcare eligibility beyond the ordinary age limit. This does not by itself establish eligibility for the higher disability limit.", c.infirm)}</div></details>${qc}</div>`;
  }

  private adjustments() {
    const adults = this.incomes
      .map((income, i) =>
        this.state.mode === "manual"
          ? field(
              `care-claim-${i}`,
              `${i ? "Partner's" : "Your"} verified claim`,
              "Annual childcare deduction verified for this adult. Include zero when this adult has no claim. Manual claims replace automatic deductions. Do not also include this amount in Other deductions.",
              this.state.claims[i],
            )
          : `<div class="field">${check(`care-override-${i}`, `Adjust ${i ? "partner's" : "your"} eligible earnings`, `Defaults to $${text(income)} a year from ${i ? "your partner's" : "your"} employment and other income, and follows changes to that input. This assumes the whole amount is eligible earned income; pensions and investment income generally do not qualify. Adjust if needed, including an explicit zero. The lower-net-income spouse usually claims, even with zero earnings.`, this.state.earningsOverridden[i])}${this.state.earningsOverridden[i] ? field(`care-earnings-${i}`, `${i ? "Partner's" : "Your"} eligible earnings`, "Enter the annual earned income eligible for the childcare deduction. This override stays fixed when ordinary income changes. Uncheck Adjust to follow employment and other income again.", this.state.earnings[i]) : ""}</div>`,
      )
      .join("");
    return `<details id="care-adjustments" class="care-adjustments"><summary>Adjust earnings or claims</summary><div class="care-grid"><div class="field"><div class="lbl-row"><label class="lbl" for="care-mode">Claim method</label>${info("Claim method", "Automatic claims assume employment and other income is eligible earned income unless you adjust it below. For study, incapacity, separation or other exceptions, enter verified annual deductions per adult. You are responsible for checking manual claim eligibility.")}</div><select id="care-mode" class="prov-select"><option value="automatic" ${this.state.mode === "automatic" ? "selected" : ""}>Automatic</option><option value="manual" ${this.state.mode === "manual" ? "selected" : ""}>Verified manual claims</option></select></div>${adults}</div></details>`;
  }

  render(result: Result) {
    (document.getElementById("childcare-costs") as HTMLElement).hidden = this.kids === 0;
    this.panel.hidden = !this.detailedAges;
    const summary = this.panel.querySelector("summary");
    if (summary) summary.textContent = this.enabled ? "Childcare details" : "Children's ages";
    const key = `${this.enabled}/${this.state.activeChildren}/${this.incomes.join(",")}/${this.state.mode}/${this.state.earningsOverridden.join(",")}/${this.year}/${this.homeQuebec}`;
    if (key !== this.fieldsKey) {
      this.fieldsKey = key;
      const openIds = new Set([...this.fields.querySelectorAll<HTMLDetailsElement>("details[open]")].map(el => el.id));
      this.fields.innerHTML =
        this.children.map((c, i) => this.childRow(c, i)).join("") +
        `<button type="button" class="linkbtn" data-care="add" ${this.state.activeChildren >= 6 ? "disabled" : ""}>Add child</button>` +
        (this.enabled ? this.adjustments() : "");
      for (const el of this.fields.querySelectorAll<HTMLDetailsElement>("details")) el.open = openIds.has(el.id);
    }
    const errors = result.childcare.reasons.map(r => childcareReasons[r]).filter(Boolean);
    const validate = (id: string, value: NumericDraft, message: string, ready = false) => {
      const el = document.getElementById(id) as HTMLInputElement | null;
      if (!el) return;
      const show = message !== "" && (typeof value === "string" || this.state.touched.includes(id) || ready);
      el.setCustomValidity(message);
      el.setAttribute("aria-invalid", String(show));
    };
    const required = (v: NumericDraft) =>
      amount(v)
        ? ""
        : v === null
          ? "Enter an amount, including zero."
          : "Enter a nonnegative number with up to two decimal places.";
    const allocated = this.children.every(c => amount(c.expenses));
    const annual = this.children.reduce((sum, c) => sum + (amount(c.expenses) ? c.expenses : 0), 0);
    const mismatch =
      this.enabled &&
      allocated &&
      monthlyAmount(this.state.monthly) &&
      Math.abs(annual - this.state.monthly * 12) > 0.06 + 1e-9;
    validate(
      "childcare-monthly",
      this.state.monthly,
      !monthlyAmount(this.state.monthly)
        ? required(this.state.monthly) || "Enter a smaller monthly amount."
        : mismatch
          ? "Annual child expenses must match twelve times the monthly amount."
          : "",
    );
    (document.getElementById("childcare-info") as HTMLElement).dataset.tip =
      `Average monthly eligible childcare costs across the whole year, after fee subsidies and reimbursements. Do not subtract advance tax-credit payments. These costs are separate from taxable household spending. Eligible earnings follow employment and other income by default; use Adjust earnings or claims when that assumption does not fit. ${errors.join(" ")}`;
    for (let i = 0; i < this.incomes.length; i++) {
      const manual = this.state.mode === "manual",
        value = manual ? this.state.claims[i] : this.earnings[i];
      validate(manual ? `care-claim-${i}` : `care-earnings-${i}`, value, required(value));
    }
    this.children.forEach((c, i) => {
      validate(
        `care-age-${i}`,
        c.age,
        wholeAge(c.age) ? "" : "Enter a whole, nonnegative year-end age, including zero.",
        c.age !== null,
      );
      validate(`care-expenses-${i}`, c.expenses, required(c.expenses));
      validate(
        `care-qc-${i}`,
        c.qcEligibleExpenses,
        c.qcEligibleExpenses === null
          ? ""
          : required(c.qcEligibleExpenses) ||
              (amount(c.qcEligibleExpenses) && amount(c.expenses) && c.qcEligibleExpenses > c.expenses
                ? "The Quebec-eligible portion cannot exceed this child's annual expenses."
                : ""),
      );
    });
  }
}

export function federalCareExplanation(c: ChildcareResult): string {
  if (c.status !== "complete") return c.reasons.map(r => childcareReasons[r] ?? r.replace(/-/g, " ")).join(" ");
  if (c.mode === "manual") return "Verified manual deductions replace the automatic claims.";
  const claimant =
    c.claimant === null
      ? "No claimant is selected when there are no expenses."
      : `${c.claimant === 0 ? "You are" : "Your partner is"} the selected claimant${c.reasons.includes("lower-income-adult") ? " as the lower-net-income adult" : c.reasons.includes("equal-income-election-first-adult") ? " by election for equal net incomes" : " as the lone parent"}, even if the allowed deduction is zero.`;
  return `${claimant} The deduction is limited by eligible expenses, pooled annual child limits and eligible earnings. Eligible earnings stay fixed when the existing mixed-income marginal rate is calculated.`;
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
    "Allocated annual childcare expenses",
    money(a.childcare.expenses),
    money(b.childcare.expenses),
    "The annual allocation from validated child details. Complete the child ages and reconcile this allocation to the monthly household amount. Childcare spending itself is not added to the tax total; allowed deductions and credits are already reflected above.",
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
  const ac = credit(a),
    bc = credit(b);
  const creditValue = (c: typeof ac) =>
    c
      ? c.status === "complete"
        ? money(c.applied)
        : `${money(c.applied)}<br>${careStatusText(c.status)}`
      : "Not applicable";
  if (credit(a) || credit(b)) {
    const explanation = [credit(a), credit(b)]
      .filter(c => c !== undefined)
      .map(
        c =>
          `${c.name}: ${careStatusText(c.status)}. ${c.reasons.map(reason => childcareReasons[reason] ?? reason.replace(/-/g, " ")).join(" ")}`,
      )
      .join(" ");
    rows += row("Provincial childcare credit", creditValue(ac), creditValue(bc), explanation);
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

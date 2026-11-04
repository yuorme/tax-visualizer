// The retirement-age section's controls: reads and writes one person's Retirement. A box being typed in keeps its draft
// until blur; app.ts decides whose entry this is and redraws after each change.
import {
  emptyRetirement,
  type MonthDraft,
  parseWeight,
  parseYear,
  payHasTotal,
  RETIREMENT_DATES,
  type Retirement,
  retirementActive,
} from "./retirement.ts";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_OPTIONS = `<option value="">Month</option>${MONTH_NAMES.map((name, i) => `<option value="${i + 1}">${name}</option>`).join("")}`;
const element = <T extends HTMLElement>(id: string) => {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Missing #${id}`);
  return found as T;
};
const isDateKey = (key: string | undefined): key is (typeof RETIREMENT_DATES)[number] =>
  RETIREMENT_DATES.some(date => date === key);
const monthValue = (value: string) => (value === "" ? null : Number(value));
const yearText = (year: number | null) => (year === null ? "" : String(year));

export function retirementEditor(selected: () => Retirement | null, change: (entry: Retirement | null) => void) {
  const section = element<HTMLDetailsElement>("retirement-details");
  const birthYear = element<HTMLInputElement>("ret-birth-year");
  const birthMonth = element<HTMLSelectElement>("ret-birth-month");
  const more = element("ret-more");
  const months = element("ret-months");
  const payStatus = element("ret-pay-status");
  const clear = element("retirement-clear");
  const payButtons = [...section.querySelectorAll<HTMLElement>("[data-ret-pay]")];
  months.innerHTML = MONTH_NAMES.map(
    (name, i) =>
      `<div class="field"><label class="lbl" for="ret-weight-${i}">${name}</label><div class="money sm"><input id="ret-weight-${i}" data-ret-weight="${i}" inputmode="decimal" autocomplete="off"></div></div>`,
  ).join("");
  for (const select of section.querySelectorAll("select")) select.innerHTML = MONTH_OPTIONS;

  const edit = (apply: (entry: Retirement) => void) => {
    const entry = selected() ?? emptyRetirement();
    apply(entry);
    change(entry);
  };
  /** Fills a box or a list unless it's being typed in, so re-drawing never rewrites a draft. */
  const show = (field: HTMLInputElement | HTMLSelectElement, value: string) => {
    if (document.activeElement !== field) field.value = value;
  };

  section.addEventListener("input", event => {
    const field = event.target;
    if (field === birthYear) edit(entry => Object.assign(entry, { birthYear: parseYear(birthYear.value) }));
    else if (field === birthMonth) edit(entry => Object.assign(entry, { birthMonth: monthValue(birthMonth.value) }));
    else if (field instanceof HTMLElement && isDateKey(field.dataset.retDate)) {
      const key = field.dataset.retDate;
      const value = (field as HTMLInputElement | HTMLSelectElement).value;
      edit(entry => {
        const date: MonthDraft = entry[key];
        if (field.dataset.retPart === "year") date.year = parseYear(value);
        else date.month = monthValue(value);
      });
    } else if (field instanceof HTMLInputElement && field.dataset.retWeight !== undefined) {
      const weight = parseWeight(field.value);
      const index = Number(field.dataset.retWeight);
      if (weight !== null)
        edit(entry => {
          if (entry.weights) entry.weights[index] = weight;
        });
    }
  });
  // Blur shows what was kept: a box left unfinished goes back to blank or to its last good value.
  section.addEventListener("focusout", event => {
    if (event.target instanceof HTMLInputElement) sync();
  });
  section.addEventListener("keydown", event => {
    if (event.key === "Enter" && event.target instanceof HTMLInputElement) event.target.blur();
  });
  for (const button of payButtons)
    button.addEventListener("click", () =>
      edit(entry => {
        if (button.dataset.retPay === "even") entry.weights = null;
        else entry.weights ??= Array<number>(MONTH_NAMES.length).fill(1);
      }),
    );
  clear.addEventListener("click", () => {
    change(null);
    birthYear.focus(); // the button hides itself, so focus goes back to the top of the section
  });

  /** Shows the selected person's entry. Called on every render, after the entry or the person changes. */
  function sync() {
    const entry = selected() ?? emptyRetirement();
    show(birthYear, yearText(entry.birthYear));
    show(birthMonth, String(entry.birthMonth ?? ""));
    more.hidden = !retirementActive(entry);
    for (const key of RETIREMENT_DATES) {
      show(element<HTMLInputElement>(`ret-${key}-year`), yearText(entry[key].year));
      show(element<HTMLSelectElement>(`ret-${key}-month`), String(entry[key].month ?? ""));
    }
    const stopped = (date: MonthDraft) => date.year !== null && date.month !== null;
    element("ret-cppRestart-field").hidden = !stopped(entry.cppStop);
    element("ret-qppRestart-field").hidden = !stopped(entry.qppStop);
    for (const button of payButtons)
      button.setAttribute("aria-pressed", String((button.dataset.retPay === "month") === (entry.weights !== null)));
    months.hidden = entry.weights === null;
    entry.weights?.forEach((weight, i) => {
      show(element<HTMLInputElement>(`ret-weight-${i}`), String(weight));
    });
    payStatus.hidden = entry.weights === null || payHasTotal(entry.weights);
    payStatus.textContent = "Monthly amounts total 0: treated as even pay";
    clear.hidden = selected() === null;
  }
  return { sync };
}

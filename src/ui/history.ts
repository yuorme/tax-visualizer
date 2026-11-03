import cpi from "virtual:cpi";
import years from "virtual:years";
import { type HistoryMode, historyComparison } from "../engine/history.ts";
import type { Household } from "../engine/types.ts";
import { money, rate } from "./notes.ts";

/** Formats the engine's historical comparison; the UI never scales or calculates tax. */
export function renderHistory(input: Household, home: string, mode: HistoryMode) {
  const comparison = historyComparison(Object.values(years), cpi, input, [home], mode);
  const name = comparison.rows[0]?.provinces[0].name ?? home;
  const title = document.getElementById("history-title");
  const body = document.getElementById("history-rows");
  const basis = document.getElementById("history-basis");
  const info = document.getElementById("history-info");
  if (!title || !body || !basis || !info) throw new Error("Missing history view");
  title.textContent = `${name} over time`;
  basis.textContent = mode === "real" ? `${comparison.baseYear} dollars` : "Each year's dollars";
  info.dataset.tip =
    mode === "real"
      ? `Treat the amounts entered above as ${comparison.baseYear} dollars, the latest completed annual CPI year. Income, deductions, spending, rent and home value are converted together using Canada's annual all-items CPI. Each year's tax rules are applied, then income and tax are shown back in ${comparison.baseYear} dollars. Household members, ages, rates and driving stay fixed. This compares the same household, not a household ageing over time.${comparison.omittedYears.length ? ` Annual CPI is not yet available for ${comparison.omittedYears.join(", ")}; those tax years appear in nominal mode only.` : ""}`
      : "Apply each year's rules to the same dollar amounts entered above. Household members and driving stay fixed. Dollar amounts are not adjusted for inflation. The effective rate is net tax after benefits divided by household income.";
  body.innerHTML = comparison.rows
    .map(row => {
      const result = row.provinces[0];
      const tax = result.tax < 0 ? `−${money(-result.tax)}` : money(result.tax);
      return `<tr data-year="${row.year}"><th scope="row">${row.year}</th><td>${money(result.income)}</td><td>${tax}</td><td>${rate(result.rate)}</td></tr>`;
    })
    .join("");
  const source = document.getElementById("history-source") as HTMLAnchorElement;
  source.href = cpi.sources[0].url;
  source.textContent = cpi.series;
}

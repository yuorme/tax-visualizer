import cpi from "virtual:cpi";
import years from "virtual:years";
import type { YearData } from "../data/schema.ts";
import type { HistoryMode } from "../engine/history.ts";
import type { Household } from "../engine/types.ts";
import { money, rate } from "./notes.ts";
import {
  historyRetirementNote,
  type Retirement,
  retirementActive,
  retirementHistory,
  retirementYears,
  yearList,
} from "./retirement.ts";
import { selfEmploymentYears } from "./self-employment.ts";
import { publicPensionYears, seniorYears } from "./senior-income.ts";

const installedYears = Object.values(years).sort((a, b) => a.year - b.year);
const coveragePrograms = [
  ["healthServicesFund", "Quebec's Health Services Fund contribution"],
  ["familyTaxBenefit", "Manitoba's family tax benefit"],
  ["childcareCredit", "The provincial childcare tax credit"],
  ["fuelTax", "Gasoline fuel tax (excluding carbon pricing)"],
] as const;

/** Explain partial program coverage using the installed data for the displayed province. */
function coverageNote(home: string, firstShown: number) {
  const since = (name: string, first: (typeof installedYears)[number] | undefined) =>
    first && first.year > firstShown ? [`${name} is modelled only from ${first.year}`] : [];
  const partial = coveragePrograms.flatMap(([key, name]) => {
    const first = installedYears.find(y => y.provinces.find(p => p.code === home)?.[key]);
    return since(name, first);
  });
  partial.push(
    ...since(
      "The federal childcare expense deduction",
      installedYears.find(y => y.federal.childcare),
    ),
  );
  return partial.length ? ` ${partial.join("; ")}, so year-to-year changes can also reflect model coverage.` : "";
}

/** Formats the engine's historical comparison; the UI never scales or calculates tax. */
export function renderHistory(
  inputFor: (data: YearData) => Household,
  retirement: (Retirement | null)[],
  home: string,
  mode: HistoryMode,
  selfEmployment = false,
  businessNotice = "",
  seniorIncome = false,
  seniorNotice = "",
  publicPensions = false,
  publicNotice = "",
) {
  const comparison = retirementHistory(
    installedYears,
    cpi,
    retirement,
    inputFor,
    home,
    mode,
    selfEmployment,
    seniorIncome,
    publicPensions,
  );
  const name = installedYears.at(-1)?.provinces.find(p => p.code === home)?.name ?? home;
  const byBirthYear = retirement.some(retirementActive);
  const ageing = byBirthYear
    ? " Age credits and retirement-age CPP/QPP use each person's age in that year, from the birth year entered, and keep pension and election dates on their calendar dates."
    : "";
  const title = document.getElementById("history-title");
  const body = document.getElementById("history-rows");
  const basis = document.getElementById("history-basis");
  const info = document.getElementById("history-info");
  if (!title || !body || !basis || !info) throw new Error("Missing history view");
  title.textContent = `${name} over time`;
  const omitted = comparison.noData.length + comparison.young.length > 0;
  basis.textContent =
    (mode === "real" ? `${comparison.baseYear} dollars` : "Each year's dollars") +
    (omitted ? " · retirement-age payroll years only" : "") +
    (comparison.noSelfEmploymentData.length ? " · self-employment years only" : "") +
    (seniorIncome || byBirthYear ? ` · age/pension credits: ${yearList(seniorYears(installedYears))} only` : "") +
    (publicPensions
      ? ` · OAS and CPP/QPP retirement income: ${yearList(publicPensionYears(installedYears))} only`
      : "");
  info.dataset.tip =
    mode === "real"
      ? `Treat the amounts entered above as ${comparison.baseYear} dollars, the latest completed annual CPI year. Income, deductions, spending, rent and home value are converted together using Canada's annual all-items CPI. Each year's tax rules are applied, then income and tax are shown back in ${comparison.baseYear} dollars. Household members, ${byBirthYear ? "" : "ages, "}rates and driving stay fixed.${ageing} This compares the same household, not a household ageing over time.${comparison.omittedYears.length ? ` Annual CPI is not yet available for ${comparison.omittedYears.join(", ")}; those tax years appear in nominal mode only.` : ""}`
      : `Apply each year's rules to the same dollar amounts entered above. Household members and driving stay fixed.${ageing} Dollar amounts are not adjusted for inflation. The effective rate is net tax after benefits divided by household income.`;
  info.dataset.tip += historyRetirementNote(comparison, retirementYears(installedYears));
  if (comparison.noSelfEmploymentData.length)
    info.dataset.tip += ` Self-employment is modelled only for ${yearList(selfEmploymentYears(installedYears))}, so ${yearList(comparison.noSelfEmploymentData)} are left out.`;
  if (businessNotice) info.dataset.tip += ` ${businessNotice}`;
  if (seniorIncome || byBirthYear)
    info.dataset.tip += ` Age and pension credits are modelled for ${yearList(seniorYears(installedYears))} only; earlier years are left out, not complete senior-tax comparisons. Typed retirement receipts retain their category and survivor status; real mode scales their amounts with the other income.`;
  if (seniorNotice) info.dataset.tip += ` ${seniorNotice}`;
  if (publicPensions)
    info.dataset.tip += ` OAS and CPP/QPP retirement income are modelled for ${yearList(publicPensionYears(installedYears))} only; earlier years are left out, not complete senior-tax comparisons. OAS uses each year's published monthly amounts and each adult's age in that year; real mode scales entered CPP/QPP income with other income. Recovery is current-year liability, not withholding based on the preceding return. OAS deferral and residency rules are not modelled.`;
  if (publicNotice) info.dataset.tip += ` ${publicNotice}`;
  info.dataset.tip += coverageNote(home, comparison.rows[0]?.year ?? installedYears[0].year);
  const rows = comparison.rows
    .map(row => {
      const result = row.provinces[0];
      const tax = result.tax < 0 ? `−${money(-result.tax)}` : money(result.tax);
      return `<tr data-year="${row.year}"><th scope="row">${row.year}</th><td>${money(result.income)}</td><td>${tax}</td><td>${rate(result.rate)}</td></tr>`;
    })
    .join("");
  body.innerHTML =
    rows ||
    `<tr><td colspan="4">No year in this view covers these ${selfEmployment ? "self-employment and retirement-age" : "retirement-age"} inputs</td></tr>`;
  const source = document.getElementById("history-source") as HTMLAnchorElement;
  source.href = cpi.sources[0].url;
  source.textContent = cpi.series;
}

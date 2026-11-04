// Page logic: reads the inputs, runs the engine for every province and draws the chart and comparison.
// All tax rules and amounts live in data/years/<year>/ and src/engine/; nothing here computes tax.
import years from "virtual:years";
import type { HistoryMode } from "../engine/history.ts";
import {
  type BracketLine,
  blank,
  cashOf,
  childcareOf,
  compute,
  deductionsOf,
  type Household,
  hasInv,
  type IncomeKey,
  INCOME_KEYS as KEYS,
  type Person,
  type PersonResult,
  type Province,
  propertyRate,
  type Result,
} from "../engine/index.ts";
import { ChildcareEditor, childcareComparison } from "./childcare.ts";
import { DEFAULT_INCOME, spendEst } from "./defaults.ts";
import {
  type DrivingUnits,
  displayDistance,
  displayEfficiency,
  distanceText,
  efficiencyText,
  metricDistance,
  metricEfficiency,
} from "./driving-units.ts";
import { renderHistory } from "./history.ts";
import { cents, footerNotes, share, tooltips } from "./notes.ts";
import {
  defaultPortfolio,
  enginePerson,
  type InvestView,
  MAX_PORTFOLIO_VALUE,
  mixIsWhole,
  mixTotal,
  normalizePortfolios,
  type Portfolio,
  parsePercent,
  portfolioAmounts,
} from "./portfolio.ts";
import { provinceFlags, setProvinceFlag } from "./province-flags.ts";
import { readScenario, scenarioHash } from "./scenario-url.ts";

const availableYears = Object.keys(years)
  .map(Number)
  .sort((a, b) => b - a);
const scenarioContext = {
  years: availableYears,
  provinces: years[availableYears[0]].provinces.map(p => p.code),
  treatyRate: (year: number) => years[year].federal.investment.foreignWithholding.usTreaty,
};
let initialState: Record<string, unknown> = readScenario(location.hash, scenarioContext) ?? {};
if (!readScenario(location.hash, scenarioContext)) {
  try {
    initialState = JSON.parse(localStorage.getItem("taxcmp") || "{}");
  } catch {}
}
let YEAR = availableYears[0];
if (initialState?.v === 3 && typeof initialState.year === "number" && availableYears.includes(initialState.year))
  YEAR = initialState.year;
let Y = years[YEAR],
  F = Y.federal;
/** View model for each province: c = code, n = name, qc = Quebec system, geo = west-to-east position, b = brackets */
interface ProvView {
  c: string;
  n: string;
  qc: boolean;
  geo: number;
  b: Province["brackets"];
  d: Province;
}
/** A province and the engine's full result for it at the current inputs. */
interface Row {
  p: ProvView;
  r: Result;
}
const provinceViews = (): ProvView[] =>
  Y.provinces.map(d => ({
    c: d.code,
    n: d.name,
    qc: d.system === "quebec",
    geo: d.order,
    b: d.brackets,
    d,
  }));
let P = provinceViews();

/** Fails loudly when the page markup lacks something the script expects. */
function must<T>(v: T | null | undefined, what: string): T {
  if (v == null) throw new Error(`Missing ${what}`);
  return v;
}
const $ = <T extends HTMLElement = HTMLElement>(id: string) => must(document.getElementById(id), `#${id}`) as T;
/** The first element under root that matches sel. */
const qs = <T extends Element = HTMLElement>(root: ParentNode, sel: string) => must(root.querySelector<T>(sel), sel);
/** The element at or above an event target that matches sel (none for the document, window or a text node). */
const closest = <T extends Element = HTMLElement>(t: EventTarget | null, sel: string) =>
  t instanceof Element ? t.closest<T>(sel) : null;
const money = (n: number) => (Math.round(n) < 0 ? "−$" : "$") + Math.abs(Math.round(n)).toLocaleString("en-CA");
const pct = (n: number, d = 1) => `${(n * 100).toFixed(d)}%`;
const rateFmt = (r: number) => `${+(r * 100).toFixed(2)}%`;
const NAMES = ["You", "Partner"];

type Metric = "pct" | "usd";
type Sort = "rate" | "geo";
type View = "home" | "dest";
/** The tabs under the basic inputs; each opens one panel (#tabbar, #panel-<tab>). */
const TABS = ["income", "home", "credits", "driving"] as const;
type Tab = (typeof TABS)[number];
const isTab = (t: unknown): t is Tab => TABS.some(x => x === t);
/** Own: the home value is used (property tax). Rent: the rent is used (rent-based credits). */
type Tenure = "own" | "rent";
let people: Person[] = [blank(DEFAULT_INCOME)],
  active = 0,
  spouse = true;
// Each person's portfolio, by index; null keeps them in the manual view. people[] always holds the manual amounts,
// so the amounts the engine sees come from enginePeople(), and only what a person typed is edited through me().
let portfolios: (Portfolio | null)[] = [];
let metric: Metric = "pct",
  spendingAdjustment = 0,
  adults = 1,
  kids = 0,
  under6 = 0; // under6: children under 6, out of kids
let historyOpen = false;
let historyMode: HistoryMode = "real";
// homeValue and rent keep what was typed in each; tenure picks which one the engine sees (ownedValue, rentPaid).
let homeValue = 0,
  propOverride: number | null = null,
  propertyTaxBill: number | null = null,
  rent = 0,
  tenure: Tenure = "own",
  useCredits = true,
  tab: Tab | null = null; // the open tab, if any
// Driving: a typed distance or efficiency, or null to use the starting value (the home province's average distance,
// the national average efficiency). The Driving tab is available with fuel or carbon pricing data.
let kmOverride: number | null = null,
  effOverride: number | null = null;
let drivingUnits: DrivingUnits = "metric";
let DRIVING = F.driving != null;
let TREATY_WH = F.investment.foreignWithholding.usTreaty;
let sort: Sort = "rate",
  home = "ON",
  dest = "AB",
  view: View = "home",
  useBpa = true,
  whRate = TREATY_WH,
  spend = spendEst(1);
const ownedValue = () => (tenure === "own" ? homeValue : 0);
const rentPaid = () => (tenure === "rent" ? rent : 0);
const hasPropertyBill = () => tenure === "own" && propertyTaxBill !== null;
const byCode = (c: string) => P.find(p => p.c === c);
/** The province with this code; home and dest always hold one. */
const prov = (c: string) => must(byCode(c), `province ${c}`);
const defaultKm = (c: string) => prov(c).d.driving?.distance ?? 0;
const kmNow = () => kmOverride ?? defaultKm(home);
const defaultEff = () => F.driving?.efficiency ?? 0;
const effNow = () => effOverride ?? defaultEff();
const distanceUnit = () => (drivingUnits === "us" ? "mi" : "km");
const effText = (v: number) => efficiencyText(displayEfficiency(v, drivingUnits));
const kmText = (v: number) => `${distanceText(displayDistance(v, drivingUnits))} ${distanceUnit()}`;
const effSpend = () => Math.round((spend * (1 + spendingAdjustment / 100)) / 10) * 10; // nearest $10
const care = new ChildcareEditor(childCount => {
  if (childCount !== undefined) setHousehold(adults, childCount);
  render();
});
let benefitCounts: { kids: number; under6: number } | undefined;
// Engine input built from the current state
const inputs = (withCare = true): Household => ({
  people: enginePeople(),
  active,
  spouse,
  adults,
  kids: benefitCounts?.kids ?? kids,
  under6: benefitCounts?.under6 ?? under6,
  useBpa,
  whRate,
  useCredits,
  homeValue: ownedValue(),
  rent: rentPaid(),
  monthlySpending: effSpend(),
  propertyRates: propOverride != null ? { [home]: propOverride } : undefined,
  propertyTaxBills: tenure === "own" && propertyTaxBill !== null ? { [home]: propertyTaxBill } : undefined,
  driving: DRIVING ? { km: kmNow(), lPer100km: effNow() } : undefined,
  childcare: withCare ? care.claimInput() : undefined,
});
const calc = (p: ProvView) => compute(Y, p.d, inputs());
const rowFor = (res: Row[], c: string) =>
  must(
    res.find(y => y.p.c === c),
    `result for ${c}`,
  );
const propRate = (c: string) => propertyRate(prov(c).d, inputs());
const pct2 = (r: number) => `${(r * 100).toFixed(2)}%`; // payroll rates shown to two decimals, e.g. 4.95%
const me = () => people[active];
const portfolioOf = (i: number) => portfolios[i] ?? null;
/** Each person's income as the engine sees it, for reading. In the portfolio view it differs from what's in people. */
const enginePeople = () => people.map((x, i) => enginePerson(x, portfolioOf(i)));
const counted = () => enginePerson(me(), portfolioOf(active));
const isNum = (v: unknown): v is number => typeof v === "number";
/** A person read back from saved state, keeping only valid amounts. */
function cleanPerson(o: unknown): Person {
  const x = blank(0);
  if (o && typeof o === "object") {
    const saved = o as Partial<Record<keyof Person, unknown>>;
    for (const k of KEYS) {
      const v = saved[k];
      if (isNum(v) && (k === "cg" || v >= 0)) x[k] = v;
    }
    for (const k of ["ded", "rrsp", "fhsa"] as const) {
      const v = saved[k];
      if (isNum(v) && Number.isFinite(v) && v >= 0) x[k] = v;
    }
  }
  return x;
}
// Saved state from before the defaults changed (v < 3) is ignored so the new defaults show.
// Values are checked for the types save() writes, so a damaged save can't put a string where a number belongs.
try {
  const s = initialState;
  if (s.v === 3) {
    if (typeof s.historyOpen === "boolean") historyOpen = s.historyOpen;
    if (s.historyMode === "nominal") historyMode = "nominal";
    if (Array.isArray(s.people) && s.people.length) people = s.people.slice(0, 2).map(cleanPerson);
    portfolios = normalizePortfolios(s.portfolios, people.length); // absent in older saves: the manual view
    if (s.active === 1 && people.length === 2) active = 1;
    if (typeof s.spouse === "boolean") spouse = s.spouse;
    if (s.sort === "rate" || s.sort === "geo") sort = s.sort;
    if (typeof s.home === "string" && byCode(s.home)) home = s.home;
    if (typeof s.dest === "string" && byCode(s.dest)) dest = s.dest;
    if (s.view === "dest") view = "dest";
    if (typeof s.useBpa === "boolean") useBpa = s.useBpa;
    if (isNum(s.whRate) && s.whRate >= 0) whRate = s.whRate;
    adults = isNum(s.adults) && s.adults >= 1 && s.adults <= 4 ? s.adults : people.length;
    if (isNum(s.kids) && s.kids >= 0 && s.kids <= 6) kids = s.kids;
    if (isNum(s.under6)) under6 = Math.max(0, Math.min(kids, s.under6));
    else if (s.under6 === true) under6 = kids; // older saves stored a yes/no
    if (isNum(s.homeValue) && s.homeValue >= 0) homeValue = s.homeValue;
    if (isNum(s.propOverride)) propOverride = s.propOverride;
    if (isNum(s.propertyTaxBill) && Number.isFinite(s.propertyTaxBill) && s.propertyTaxBill >= 0)
      propertyTaxBill = s.propertyTaxBill;
    if (isNum(s.rent) && s.rent >= 0) rent = s.rent;
    if (isNum(s.km) && Number.isFinite(s.km) && s.km >= 0) kmOverride = s.km;
    if (isNum(s.eff) && Number.isFinite(s.eff) && s.eff >= 0) effOverride = s.eff;
    if (s.drivingUnits === "us") drivingUnits = "us";
    // Saves from before the Own/Rent switch: rent only counted with no home value, so that meant renting
    if (s.tenure === "own" || s.tenure === "rent") tenure = s.tenure;
    else if (rent > 0 && homeValue === 0) tenure = "rent";
    if (typeof s.useCredits === "boolean") useCredits = s.useCredits;
    spend = s.adults && isNum(s.spend) && s.spend >= 0 ? s.spend : spendEst(adults + kids); // older saves predate adults/children
    // Saves from before the tabs kept each section's open state; reopen the first one that was open
    if (s.tab === null || isTab(s.tab)) tab = s.tab;
    else tab = s.invOpen === true ? "income" : s.propOpen === true ? "home" : s.credOpen === true ? "credits" : null;
    if (s.metric === "usd") metric = "usd";
    const adjustment = s.spendingAdjustment ?? s.frug;
    if (isNum(adjustment) && adjustment >= -100 && adjustment <= 1000000) spendingAdjustment = adjustment;
    care.restore(s.childcare);
  }
} catch {}
if (dest === home) dest = home === "AB" ? "BC" : "AB";
if (!DRIVING) {
  $("tab-driving").hidden = true;
  if (tab === "driving") tab = null;
}
function scenarioState() {
  return {
    v: 3,
    year: YEAR,
    historyOpen,
    historyMode,
    people,
    portfolios: normalizePortfolios(portfolios, people.length),
    active,
    spouse,
    sort,
    home,
    dest,
    view,
    useBpa,
    whRate,
    adults,
    kids,
    under6,
    spend,
    spendingAdjustment,
    childcare: care.state,
    metric,
    homeValue,
    propOverride,
    propertyTaxBill,
    rent,
    tenure,
    useCredits,
    tab,
    km: kmOverride,
    eff: effOverride,
    drivingUnits,
  };
}
function shareUrl() {
  const url = new URL(location.href);
  url.hash = scenarioHash(scenarioState(), scenarioContext);
  return url.href;
}
function save() {
  try {
    localStorage.setItem("taxcmp", JSON.stringify(scenarioState()));
  } catch {}
  // Replace, rather than append, history on each edit. The fragment is never sent with network requests.
  try {
    history.replaceState(null, "", shareUrl());
  } catch {}
  $("share-status").textContent = "";
  $("share-fallback").hidden = true;
}

$("copy-link").addEventListener("click", async () => {
  const url = shareUrl();
  try {
    await navigator.clipboard.writeText(url);
    $("share-status").textContent = "Link copied";
  } catch {
    $("share-fallback").hidden = false;
    const input = $<HTMLInputElement>("share-url");
    input.value = url;
    input.focus();
    input.select();
    $("share-status").textContent = "Select and copy the link";
  }
});
window.addEventListener("hashchange", () => {
  if (readScenario(location.hash, scenarioContext)) location.reload();
});

// Text that quotes the year's figures: footer notes, info tooltips and the withholding presets (see notes.ts)
const WH_PRESETS = [0, 0.1, 0.25, 0.3]; // withholding choices offered besides the treaty rate
const yearSelect = $<HTMLSelectElement>("tax-year");
let aggregateChildrenTip = "";
yearSelect.innerHTML = availableYears.map(year => `<option value="${year}">${year}</option>`).join("");
function renderYearNotes() {
  yearSelect.value = String(YEAR);
  document.title = `Provincial Tax Compare ${YEAR}`;
  $("year-notes").innerHTML = footerNotes(Y, { defaultIncome: DEFAULT_INCOME, spendEst });
  const tips = tooltips(Y);
  aggregateChildrenTip = tips.children;
  for (const b of document.querySelectorAll<HTMLElement>("[data-note]")) b.dataset.tip = tips[b.dataset.note ?? ""];
  const sources = $("year-sources");
  sources.replaceChildren(document.createTextNode(`Sources for ${YEAR}: `));
  const unique = new Map([F, ...Y.provinces].flatMap(d => d.sources ?? []).map(s => [s.url, s]));
  for (const [i, source] of [...unique.values()].entries()) {
    if (i) sources.append(document.createTextNode(" · "));
    const link = document.createElement("a");
    link.href = source.url;
    link.textContent = source.label;
    link.target = "_blank";
    link.rel = "noopener";
    sources.append(link);
  }
  sources.append(document.createTextNode(". Not tax advice."));
  $("wh").innerHTML = [...new Set([...WH_PRESETS, TREATY_WH, whRate])]
    .sort((a, b) => a - b)
    .map(r => `<option value="${r}">${rateFmt(r)}${r === TREATY_WH ? " (U.S. treaty)" : ""}</option>`)
    .join("");
}
renderYearNotes();
yearSelect.addEventListener("change", () => {
  const selected = Number(yearSelect.value);
  if (!availableYears.includes(selected)) return;
  YEAR = selected;
  Y = years[YEAR];
  F = Y.federal;
  P = provinceViews();
  DRIVING = F.driving != null;
  TREATY_WH = F.investment.foreignWithholding.usTreaty;
  $("tab-driving").hidden = !DRIVING;
  if (!DRIVING && tab === "driving") tab = null;
  $("tip").hidden = true;
  renderYearNotes();
  showTab();
  render();
});

// Province selectors
const provOptions = (skip: string) =>
  [...P]
    .sort((a, b) => a.n.localeCompare(b.n))
    .filter(p => p.c !== skip)
    .map(p => `<option value="${p.c}">${p.n}</option>`)
    .join("");
// Home selector: two-letter codes keep the control narrow on phones; full name on hover/for screen readers
const provCodes = () =>
  [...P]
    .sort((a, b) => a.c.localeCompare(b.c))
    .map(p => `<option value="${p.c}" title="${p.n}" aria-label="${p.n}">${p.c}</option>`)
    .join("");
const homeSel = $<HTMLSelectElement>("home"),
  destSel = $<HTMLSelectElement>("dest");
function fillSelects() {
  homeSel.innerHTML = provCodes();
  homeSel.value = home;
  homeSel.title = P.find(p => p.c === home)?.n || "";
  destSel.innerHTML = provOptions(home);
  destSel.value = dest;
}
// Build columns once
// Safari drops list semantics from a <ul> with list-style: none unless the role is explicit
const colsEl = $("cols");
colsEl.setAttribute("role", "list");
P.forEach(p => {
  const c = document.createElement("li");
  c.className = "col";
  c.id = `col-${p.c}`;
  c.innerHTML = `<div class="col-plot"><span class="cv"></span><div class="stack"><i class="f"></i><i class="p"></i><i class="y"></i><i class="w"></i><i class="s"></i><i class="h"></i><i class="g"></i><i class="c"></i></div><i class="ben"></i></div>
    <div class="code" title="${p.n}"><img class="province-flag" src="${provinceFlags[p.c]}" data-province="${p.c}" alt="" aria-hidden="true" width="72" height="52">${p.c}${p.qc ? "<sup>†</sup>" : ""}</div><div class="cm"></div><div class="tag"></div>`;
  colsEl.appendChild(c);
});

// Axis starts at 40% and only widens (in 5-point steps) when a column needs more room.
const AXIS_BASE = 0.4;
function axisMax(top: number) {
  return Math.max(AXIS_BASE, (Math.ceil((top * 100 + 1) / 5) * 5) / 100);
}

// Tabs under the basic inputs: one panel open at a time, and tapping the open tab closes it.
function showTab() {
  for (const t of TABS) {
    $(`tab-${t}`).setAttribute("aria-expanded", String(tab === t));
    $(`panel-${t}`).hidden = tab !== t;
  }
}
/** Sets a tab's short summary, marked "set" (highlighted) when the summary is an amount. */
function tabSum(t: Tab, text: string, set: boolean) {
  $(`tab-${t}-sum`).textContent = text;
  $(`tab-${t}`).classList.toggle("set", set);
}
$("tabbar").addEventListener("click", e => {
  const t = closest(e.target, "[data-tab]")?.dataset.tab;
  if (!isTab(t)) return;
  tab = tab === t ? null : t;
  showTab();
  save();
});

function renderPeople() {
  let html = enginePeople()
    .map((x, i) => {
      const btn = `<button class="person" data-i="${i}" aria-pressed="${i === active}"><b>${NAMES[i]}</b><small>${money(cashOf(x))}</small></button>`;
      return i === 0
        ? btn
        : `<span class="person-wrap">${btn}<button type="button" class="person-x" id="remove-partner" aria-label="Remove partner" title="Remove partner">×</button></span>`;
    })
    .join("");
  html +=
    people.length === 1
      ? `<button class="person add" id="add-partner"><b>+ Add partner</b><small>or other household member</small></button>`
      : `<span class="spouse-row"><label class="check"><input type="checkbox" id="spouse-toggle" ${spouse ? "checked" : ""}> Spouse or common-law partner</label><button type="button" class="info" data-tip="Tick for a married or common-law partner. The higher earner can then claim the spouse amount for the lower earner, which shrinks as the lower earner's income rises. Untick for other household members, such as an adult child, to tax them as unrelated individuals." aria-label="About spouse or common-law partner">i</button></span>`;
  $("people").innerHTML = html;
}

const kMoney = (v: number) => (v >= 1000 ? `$${+(v / 1000).toFixed(v >= 100000 ? 0 : 1)}k` : `$${Math.round(v)}`);
/** Chart segments: federal, provincial, payroll, withheld, sales, property, fuel and carbon costs,
 *  and the benefits band. Each is also the segment element's class name. */
type Seg = "f" | "p" | "y" | "w" | "s" | "h" | "g" | "c" | "ben";
const SEG_NAMES: Record<Seg, string> = {
  f: "Federal income tax",
  p: "Provincial / territorial income tax",
  y: "CPP/QPP, EI & health premiums",
  w: "Foreign tax withheld",
  s: "Sales tax",
  h: "Property tax",
  g: "Fuel tax",
  c: "Carbon pricing",
  ben: "Benefits and credits",
};
const SEG_KEYS: Exclude<Seg, "ben">[] = ["f", "p", "y", "w", "s", "h", "g", "c"];
const segAmt = (r: Result, c: Seg) =>
  ({
    f: r.fed,
    p: r.prov,
    y: r.payroll,
    w: r.wh,
    s: r.sales,
    h: r.property,
    g: fuelAmt(r),
    c: carbonAmt(r),
    ben: r.benefits,
  })[c];
/** Fuel tax a year (0 for a year without fuel data). */
const fuelAmt = (r: Result) => r.fuel?.total ?? 0;
const carbonAmt = (r: Result) => r.carbon?.total ?? 0;
/** "1,458 litres at 11.99¢ a litre: federal 2.99¢, Ontario 9¢" (year averages), for the chart tip and panel. */
function fuelParts(p: ProvView, r: Result) {
  const f = r.fuel;
  if (!f) return "";
  const parts = [`federal ${cents(f.perLitre.federal)}`, `${p.n} ${cents(f.perLitre.provincial)}`];
  if (f.regionalName) parts.push(`${f.regionalName} ${cents(f.perLitre.regional)}`);
  return `${Math.round(f.litres).toLocaleString("en-CA")} litres at ${cents(f.perLitre.total)} a litre: ${parts.join(", ")}`;
}
/** Tooltip HTML for each chart segment, set on every render. Info buttons use their data-tip text instead. */
const segTips = new WeakMap<Element, string>();
function segTip(p: ProvView, r: Result, c: Seg) {
  const amt = segAmt(r, c);
  const share = r.base > 0 ? amt / r.base : 0;
  const two = people.length === 2;
  const each = (fn: (y: PersonResult) => string) =>
    two ? r.list.map((y, i) => `${NAMES[i]} ${fn(y)}`).join(", ") : fn(r.list[0]);
  let sub = "";
  if (c === "f") {
    sub = `Top federal bracket reached: ${each(y => rateFmt(y.f.marg))}`;
    if (p.qc) sub += `. After the ${rateFmt(F.quebecAbatement)} Quebec abatement`;
  } else if (c === "p") {
    sub = `Top ${p.n} bracket reached: ${each(y => rateFmt(y.pr.marg))}`;
    const { surtax, provReductions } = r.breakdown;
    if (surtax > 0.5) sub += `. Includes ${money(surtax)} ${p.n} surtax`;
    if (p.d.additionalTax)
      sub += `. Includes temporary deficit reduction levy: ${each(y => money(y.breakdown.provincialLevy))}`;
    if (provReductions > 0.5)
      sub += `. After ${money(provReductions)} of ${p.c === "BC" ? "BC tax reduction" : "Ontario tax reduction and LIFT credit"}`;
  } else if (c === "y") {
    const t = r.breakdown.payroll;
    sub = [
      `${p.qc ? "QPP" : "CPP"} ${money(t.cpp)}`,
      `EI ${money(t.ei)}`,
      t.qpip > 0.5 && `QPIP ${money(t.qpip)}`,
      t.ohp > 0.5 && `Ontario Health Premium ${money(t.ohp)}`,
      t.terr > 0.5 && `${p.n} payroll tax ${money(t.terr)}`,
      r.breakdown.householdPremium && `B.C. MSP premiums ${money(r.breakdown.householdPremium.total)}`,
    ]
      .filter(Boolean)
      .join(" · ");
  } else if (c === "w") {
    sub = `Withheld abroad on foreign dividends; ${money(r.breakdown.ftc)} of it is credited back against Canadian tax`;
  } else if (c === "s") {
    sub = `${p.d.salesTax.label} on ${money(effSpend())} a month of taxable spending`;
  } else if (c === "h") {
    sub =
      p.c === home && hasPropertyBill()
        ? `${money(r.property)} annual property tax (your bill)`
        : `${rateFmt(r.propRate)} on a ${money(ownedValue())} home${p.c === home && propOverride != null ? " (your rate)" : ` (${p.d.propertyTax.city} rate)`}`;
  } else if (c === "g") {
    sub = `${fuelParts(p, r)}, averaged over ${YEAR}`;
  } else if (c === "c") {
    sub = `Gasoline ${money(r.carbon?.gasoline ?? 0)} at ${cents(r.carbon?.perLitre ?? 0)} a litre, averaged over ${YEAR}; estimated household heating ${money(r.carbon?.heating ?? 0)}. Cash rebates are included in benefits and credits`;
  } else if (c === "ben") {
    const parts: string[] = [];
    if (r.ccb > 0.5) parts.push(`Canada Child Benefit ${money(r.ccb)}`);
    if (r.provBen > 0.5) parts.push(`${p.d.childBenefit?.name ?? "Provincial child benefit"} ${money(r.provBen)}`);
    for (const [n, v] of r.credits) parts.push(`${n} ${money(v)}`);
    sub = `${parts.join(" · ")}. Netted off the tax above`;
  }
  return `<b>${p.n} · ${SEG_NAMES[c]}</b><span class="t-num">${c === "ben" ? "−" : ""}${money(amt)} a year · ${pct(share)} of income</span>
    <span class="t-sub">${sub}.</span>
    <span class="t-sub t-num">Net total: ${money(r.total)} · ${pct(r.avg)} of income</span>`;
}

const narrow = matchMedia("(max-width: 520px)"); // phone: compact chart labels
function render() {
  setProvinceFlag($<HTMLImageElement>("home-flag"), home);
  setProvinceFlag($<HTMLImageElement>("cmp-home-flag"), home);
  setProvinceFlag($<HTMLImageElement>("dest-flag"), dest);
  $("history-view").hidden = !historyOpen;
  $("province-view").hidden = historyOpen;
  $("detail").hidden = historyOpen;
  $("notes").hidden = historyOpen;
  yearSelect.disabled = historyOpen;
  $("view-provinces").setAttribute("aria-pressed", String(!historyOpen));
  $("view-history").setAttribute("aria-pressed", String(historyOpen));
  $("history-real").setAttribute("aria-pressed", String(historyMode === "real"));
  $("history-nominal").setAttribute("aria-pressed", String(historyMode === "nominal"));
  // Ask the engine for effective adults, including a spouse with no separate income entry, and for age counts.
  benefitCounts = undefined;
  const base = compute(Y, prov(home).d, inputs(false));
  care.configureView(
    base.list.map(p => p.x.ord + (p.x.oth ?? 0)),
    kids,
    YEAR,
    home === "QC",
  );
  const ageProfile = care.benefitAgeProfile();
  if (ageProfile) {
    const counts = childcareOf(
      F,
      { ...inputs(false), childcare: ageProfile },
      base.list.map(p => p.x),
    ).childCounts;
    if (counts) {
      benefitCounts = counts;
      under6 = counts.under6;
    }
  }
  if (historyOpen) renderHistory(inputs(), home, historyMode);
  const res: Row[] = P.map(p => ({ p, r: calc(p) }));
  const usd = metric === "usd";
  const val = (r: Result) => (usd ? r.total : r.avg); // net of benefits: what the label shows and sorting uses
  const top = (r: Result) => (usd ? r.gross : r.grossAvg); // gross: how tall the column is drawn
  // Axis runs from lo to hi. lo drops below zero when any province's net tax is negative
  // (child benefits larger than the taxes paid).
  let lo = 0,
    hi: number,
    ticks: number[] = [];
  const minNet = Math.min(0, ...res.map(x => val(x.r)));
  if (usd) {
    const top = Math.max(1, ...res.map(x => x.r.gross));
    const step =
      [500, 1000, 2000, 2500, 5000, 10000, 20000, 25000, 50000, 100000, 200000, 250000, 500000].find(
        st => Math.ceil((top * 1.04) / st) + Math.ceil((-minNet * 1.04) / st) <= 6,
      ) || 1e6;
    hi = Math.ceil((top * 1.04) / step) * step;
    lo = -Math.ceil((-minNet * 1.04) / step) * step;
    for (let t = lo; t <= hi + 1e-6; t += step) ticks.push(t);
  } else {
    hi = axisMax(Math.max(...res.map(x => x.r.grossAvg)));
    lo = minNet < 0 ? -Math.ceil((-minNet + 0.01) * 10) / 10 : 0;
    for (let i = Math.round(lo * 10); i <= Math.round(hi * 10); i++) ticks.push(i / 10);
    if (hi - ticks[ticks.length - 1] > 0.051) ticks.push(hi); // skip an end label that would crowd the last 10% mark
  }
  const span = hi - lo,
    pos = (v: number) => ((v - lo) / span) * 100;
  const yLabel = (t: number) => {
    if (Math.abs(t) < 1e-9) return usd ? "$0" : "0%";
    const sign = t < 0 ? "−" : "";
    return usd ? sign + kMoney(Math.abs(t)) : `${sign}${Math.round(Math.abs(t) * 100)}%`;
  };
  $("cc-y").innerHTML =
    ticks.map(t => `<span style="top:calc(var(--plot-h) * ${1 - (t - lo) / span})">${yLabel(t)}</span>`).join("") +
    `<span class="key" style="top:calc(var(--plot-h) + 24px + var(--flag-row))">marg.</span>`;
  $("cc-grid").innerHTML = ticks
    .map(t => `<i class="${Math.abs(t) < 1e-9 ? "base" : ""}" style="bottom:${pos(t)}%"></i>`)
    .join("");

  // Lowest first, or west to east (ties broken west to east)
  const order = [...res].sort(
    sort === "rate" ? (a, b) => val(a.r) - val(b.r) || a.p.geo - b.p.geo : (a, b) => a.p.geo - b.p.geo,
  );
  order.forEach(({ p, r }) => {
    const el = $(`col-${p.c}`);
    colsEl.appendChild(el);
    const stack = qs(el, ".stack");
    stack.style.bottom = `${pos(0)}%`;
    stack.style.height = `${(Math.max(0, top(r)) / span) * 100}%`;
    let last: Seg = "f";
    SEG_KEYS.forEach(c => {
      const seg = qs(el, `.${c}`),
        v = segAmt(r, c);
      seg.style.height = `${r.gross > 0 ? (v / r.gross) * 100 : 0}%`;
      segTips.set(seg, segTip(p, r, c));
      if (v > 0.5) last = c;
    });
    for (const c of SEG_KEYS) qs(el, `.${c}`).classList.toggle("end", c === last);
    // Child benefits: a band from the net level up to the top of the column (below zero if net is negative)
    const ben = qs(el, ".ben");
    ben.style.bottom = `${pos(val(r))}%`;
    ben.style.height = `${((top(r) - val(r)) / span) * 100}%`;
    ben.hidden = r.benefits < 0.5;
    segTips.set(ben, segTip(p, r, "ben"));
    const cv = qs(el, ".cv");
    cv.textContent = narrow.matches
      ? usd
        ? `${(r.total < 0 ? "−" : "") + Math.round(Math.abs(r.total) / 1000)}k`
        : (r.avg * 100).toFixed(1)
      : usd
        ? r.total < 0
          ? `−${kMoney(-r.total)}`
          : kMoney(r.total)
        : pct(r.avg);
    // Net figure: above the column, or below the benefit band when benefits exceed tax
    cv.style.bottom = val(r) < 0 ? `calc(${pos(val(r))}% - 18px)` : `calc(${pos(Math.max(0, top(r)))}% + 4px)`;
    qs(el, ".cm").textContent = narrow.matches ? (r.marg * 100).toFixed(1) : pct(r.marg);
    el.classList.toggle("is-home", p.c === home);
    el.classList.toggle("is-dest", p.c === dest);
    qs(el, ".tag").textContent = p.c === home ? "home" : p.c === dest ? "dest." : "";
    el.setAttribute(
      "aria-label",
      `${p.n}${p.c === home ? " (home)" : p.c === dest ? " (destination)" : ""}: net ${pct(r.avg)} of income, marginal ${pct(r.marg)}, total ${money(r.total)}${r.benefits > 0.5 ? ` after ${money(r.benefits)} of child benefits` : ""}`,
    );
  });
  if (tipFor && segTips.get(tipFor) && tipFor.closest(".col")) showTip(tipFor); // keep an open segment tip current

  const two = people.length === 2,
    x = counted();
  const H = rowFor(res, home);
  const totalInc = H.r.cash;
  const anyBen = res.some(y => y.r.benefits > 0.5);
  $("chart-title").textContent = usd
    ? `${two || adults > 1 || kids > 0 ? "Household tax" : "Tax"} on ${money(totalInc)}${anyBen ? ", after benefits" : ""}`
    : `${two || adults > 1 || kids > 0 ? "Household tax" : "Tax"} rate on ${money(totalInc)}${anyBen ? ", after benefits" : ""}`;
  $("income-label").textContent = two ? `${active ? "Partner's" : "Your"} employment income` : "Employment income";
  $("ded-label").textContent = two ? `${active ? "Partner's" : "Your"} deductions` : "Deductions";
  const rm = H.r.me.breakdown.rrspRoom;
  $("ded-total").textContent = money(deductionsOf(x));
  $("max-rrsp").textContent = `Use estimate ${money(rm)}`;
  $("max-rrsp").setAttribute("aria-pressed", String(rm > 0 && x.rrsp === rm));
  $("other-title").textContent = two ? `${active ? "Partner's" : "Your"} other income` : "Other income";
  const portfolio = portfolioOf(active);
  const bondInterest = portfolio?.view === "portfolio" ? portfolioAmounts(portfolio).interest : 0;
  $("other-sum").textContent =
    (x.oth ?? 0) > 0
      ? `${money(x.oth ?? 0)} a year${bondInterest > 0 ? `, including ${money(bondInterest)} bond interest` : ""}`
      : "none added";
  $("invest-title").textContent = two ? `${active ? "Partner's" : "Your"} investment income` : "Investment income";
  const setAside = portfolio?.view === "portfolio" && [me().ed, me().nd, me().fd].some(v => v > 0);
  const investParts = [
    x.cg > 0 && `${money(x.cg)} net gains`,
    x.cg < 0 && `${money(-x.cg)} net loss`,
    x.ed && `${money(x.ed)} eligible div.`,
    x.nd && `${money(x.nd)} non-eligible div.`,
    x.fd && `${money(x.fd)} foreign div.`,
    bondInterest > 0 && `${money(bondInterest)} bond interest`,
    setAside && "Manual dividends not counted",
  ].filter(Boolean);
  $("invest-sum").textContent = investParts.length ? investParts.join(" · ") : "none added";
  $("legend-wh").hidden = !(enginePeople().some(y => y.fd > 0) && whRate > 0);
  $("legend-sales").hidden = !(effSpend() > 0);
  $("legend-prop").hidden = !(ownedValue() > 0);
  $("legend-fuel").hidden = !res.some(y => fuelAmt(y.r) > 0.5);
  $("legend-carbon").hidden = !res.some(y => carbonAmt(y.r) > 0.5);
  $("legend-ben").hidden = !anyBen;
  // Refundable credits panel: the home province's credits
  $<HTMLInputElement>("cred-toggle").checked = useCredits;
  $("cred-state").textContent = useCredits ? "Netted off tax" : "Not counted";
  const hc = H.r.credits;
  $("cred-sum").textContent = !useCredits
    ? "not counted"
    : H.r.refund > 0.5
      ? `${money(H.r.refund)} a year in ${H.p.n}`
      : `none at this income in ${H.p.n}`;
  $("cred-list").innerHTML = !useCredits
    ? ""
    : hc.length
      ? hc.map(([n, v]) => `<tr><td>${n}</td><td class="r">${money(v)}</td></tr>`).join("") +
        `<tr class="sum"><td>${H.p.n} total</td><td class="r">${money(H.r.refund)}</td></tr>`
      : `<tr class="muted"><td>No refundable credits in ${H.p.n} at this income${prov(home).d.creditsUseRent && ownedValue() === 0 && rentPaid() === 0 ? " (enter rent for rent-based credits)" : ""}</td><td class="r">$0</td></tr>`;
  $<HTMLInputElement>("adults").value = String(adults);
  $("adults-val").textContent = String(adults);
  $<HTMLInputElement>("kids").value = String(kids);
  $("kids-val").textContent = String(kids);
  $("u6").hidden = kids === 0;
  $<HTMLInputElement>("u6").value = String(under6);
  $("u6-val").hidden = kids === 0;
  $("u6-val").textContent = `${under6} under 6`;
  $<HTMLInputElement>("kids").disabled = false;
  $<HTMLInputElement>("u6").disabled = care.detailedAges;
  $("kids").title = care.detailedAges ? "Number of children or dependants in the childcare details." : "";
  $("u6").title = care.detailedAges
    ? "The under-6 count comes from the ages in Childcare details."
    : "Children under 6";
  const childrenTip = document.querySelector<HTMLElement>('[data-note="children"]');
  if (childrenTip)
    childrenTip.dataset.tip = care.detailedAges
      ? "The Children count matches the detailed child or dependant rows. Benefit eligibility is calculated separately from their year-end ages, including when childcare costs are zero. Edit retained ages in Children's ages. Adjust Children to change the number of rows; zero hides and deactivates childcare while retaining its saved inputs."
      : aggregateChildrenTip;
  // Track fill: slate up to the under-6 count, purple from there to the number of children
  const at = (q: number) => `calc(9px + (100% - 18px) * ${q / 6})`;
  $("kids-track").style.background =
    kids === 0
      ? ""
      : `linear-gradient(to right, var(--fed) 0 ${at(under6)}, var(--sales) ${at(under6)} ${at(kids)}, var(--rule) ${at(kids)} 100%)`;
  $("prop-sum").textContent = hasPropertyBill()
    ? `${money(H.r.property)} a year (your bill)`
    : ownedValue() > 0
      ? `${money(H.r.property)} a year on a ${money(ownedValue())} home`
      : "not included";
  const billInput = $<HTMLInputElement>("property-tax-bill");
  if (document.activeElement !== billInput)
    billInput.value =
      propertyTaxBill === null ? "" : propertyTaxBill.toLocaleString("en-CA", { maximumFractionDigits: 2 });
  $("property-tax-bill-reset").hidden = propertyTaxBill === null;
  $<HTMLInputElement>("pr-rate").disabled = hasPropertyBill();
  $<HTMLButtonElement>("pr-reset").disabled = hasPropertyBill();
  if (document.activeElement !== $("pr-rate"))
    $<HTMLInputElement>("pr-rate").value = (+(propRate(home) * 100).toFixed(3)).toString();
  $("pr-note").textContent =
    propOverride != null
      ? `Your rate (${prov(home).d.propertyTax.city} is ${rateFmt(prov(home).d.propertyTax.rate)})`
      : `${prov(home).d.propertyTax.city} ${YEAR} rate`;
  $("pr-reset").hidden = propOverride == null;
  for (const b of document.querySelectorAll<HTMLElement>("[data-tenure]"))
    b.setAttribute("aria-pressed", String(b.dataset.tenure === tenure));
  $("own-body").hidden = tenure !== "own";
  $("rent-body").hidden = tenure !== "rent";
  // Tab summaries: what each panel holds, highlighted whenever the summary is an amount rather than none, not set,
  // $0 or off. Income covers everyone's other and investment income, though its panel shows the selected person's.
  const otherAmt = enginePeople().reduce((a, y) => a + (y.oth ?? 0), 0);
  const anyInc = H.r.hasInv || otherAmt > 0;
  const incNet = otherAmt + H.r.invAmt;
  tabSum("income", anyInc ? (incNet < 0 ? `−${kMoney(-incNet)}` : kMoney(incNet)) : "none", anyInc);
  tabSum(
    "home",
    ownedValue() > 0
      ? `${kMoney(ownedValue())} home`
      : hasPropertyBill()
        ? `${kMoney(H.r.property)} tax`
        : rentPaid() > 0
          ? `${kMoney(rentPaid())}/mo rent`
          : "not set",
    ownedValue() > 0 || hasPropertyBill() || rentPaid() > 0,
  );
  tabSum("credits", !useCredits ? "off" : kMoney(H.r.refund), useCredits && H.r.refund > 0.5);
  if (DRIVING) renderDriving(H);
  $("m-pct").setAttribute("aria-pressed", String(metric === "pct"));
  $("m-usd").setAttribute("aria-pressed", String(metric === "usd"));
  care.render(H.r);
  $<HTMLSelectElement>("wh").value = String(whRate);
  paintCg();
  renderPortfolio();
  renderPeople();
  $("sort-rate").setAttribute("aria-pressed", String(sort === "rate"));
  $("sort-geo").setAttribute("aria-pressed", String(sort === "geo"));

  renderDetail(res, order);
  $<HTMLInputElement>("bpa-toggle").checked = useBpa;
  $("bpa-state").textContent = useBpa ? "Credits applied" : "Brackets only";
  save();
}

/** The Driving panel and tab: the distance and efficiency boxes (unless being typed in), where each starting value
 *  comes from, and the fuel tax in the home province. */
function renderDriving(H: Row) {
  const km = kmNow(),
    eff = effNow(),
    drivingTax = fuelAmt(H.r) + (H.r.carbon?.gasoline ?? 0);
  const distance = displayDistance(km, drivingUnits);
  if (document.activeElement !== kmIn) kmIn.value = distanceText(distance);
  // Keep native slider steps in metric too: fractional converted steps can make its endpoint unreachable.
  kmRange.value = String(Math.min(km, +kmRange.max));
  kmRange.setAttribute("aria-valuetext", kmText(+kmRange.value));
  $("km-unit").textContent = `${distanceUnit()} a year`;
  $("eff-unit").textContent = drivingUnits === "us" ? "US mpg" : "L/100 km";
  for (const button of document.querySelectorAll<HTMLElement>("[data-driving-units]"))
    button.setAttribute("aria-pressed", String(button.dataset.drivingUnits === drivingUnits));
  renderScale($("km-scale"));
  if (document.activeElement !== effIn) effIn.value = effText(eff);
  $("km-note").textContent =
    kmOverride != null
      ? `Your distance (${H.p.n} average is ${kmText(defaultKm(home))})`
      : `${H.p.n} average, ${F.driving?.distanceSource ?? ""}`;
  $("km-reset").hidden = kmOverride == null;
  $("eff-note").textContent =
    effOverride != null ? `Your vehicles (Canadian average is ${effText(defaultEff())})` : "Canadian on-road average";
  $("eff-reset").hidden = effOverride == null;
  $("fuel-sum").textContent =
    drivingTax > 0.5
      ? `${money(drivingTax)} a year in ${H.p.n}`
      : km > 0
        ? Y.provinces.some(p => p.carbon)
          ? "no gasoline tax counted"
          : "no fuel bought"
        : "no driving";
  $("driving-tax-title").textContent = Y.provinces.some(p => p.carbon) ? "Gasoline taxes" : "Fuel tax";
  tabSum("driving", km > 0 ? `${+(distance / 1000).toFixed(1)}k ${distanceUnit()}` : "none", drivingTax > 0.5);
}

/** An adjustment after bracket tax: [label, amount], negative when it reduces tax. */
type Adj = [label: string, amount: number];
/** The adjustments that apply (false marks one that doesn't). */
const present = (rows: (Adj | false)[]) => rows.filter((a): a is Adj => a !== false);
/** One government's bracket tax: the bracket lines, tax from the brackets, adjustments and the tax after them. */
interface LedgerData {
  lines: BracketLine[];
  gross: number;
  rows: Adj[];
  net: number;
}
// Comparison explanations are plain text; escape quotes before embedding them in a tooltip attribute.
function comparisonInfo(name: string, text: string) {
  const attr = text.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
  return `<button type="button" class="info" data-comparison-note="${name}" data-tip="${attr}" aria-label="About ${name}">i</button>`;
}

// One government's bracket ledger. w.rows: [label, amount] adjustments after bracket tax (negative = reduces tax).
function ledger(title: string, sw: string, w: LedgerData, ti: number, explanation = "") {
  const rows = w.lines
    .map(l => {
      const isOn = l.part > 0,
        top = isOn && ti <= l.hi && ti > l.lo;
      const range = l.hi === Infinity ? `${money(l.lo)}+` : `${money(l.lo)} – ${money(l.hi)}`;
      return `<tr class="${isOn ? "" : "idle"} ${top ? "top" : ""}"><td>${range}</td><td class="r">${rateFmt(l.r)}</td><td class="r">${money(l.part)}</td><td class="r">${money(l.t)}</td></tr>`;
    })
    .join("");
  const foot = [`<tr class="sub"><td colspan="3">Bracket tax</td><td class="r">${money(w.gross)}</td></tr>`];
  for (const [label, a] of w.rows.filter(([, a]) => Math.abs(a) > 0.5))
    foot.push(
      `<tr class="sub"><td colspan="3">${label}</td><td class="r">${a < 0 ? "−" : "+"}${money(Math.abs(a))}</td></tr>`,
    );
  foot.push(`<tr><td colspan="3">${title} tax</td><td class="r">${money(w.net)}</td></tr>`);
  return `<div class="ledger"><h4><i class="sw" style="background:${sw}"></i>${title}${explanation}</h4>
    <table><thead><tr><th>Bracket</th><th class="r">Rate</th><th class="r">Income in it</th><th class="r">Tax</th></tr></thead>
    <tbody>${rows}</tbody><tfoot>${foot.join("")}</tfoot></table></div>`;
}

function claimText(r: Result, p: ProvView) {
  const cl = r.claim;
  if (!cl || cl.saved <= 0.5) return null;
  return `${money(cl.saved)} in ${p.n}`;
}
/** How a comparison row is shown: tax, rate (pp), money left (income) or benefits and credits (credit). */
type Kind = "tax" | "pp" | "income" | "credit";
function renderDetail(res: Row[], order: Row[]) {
  const H = rowFor(res, home),
    D = rowFor(res, dest);
  const two = people.length === 2,
    hh = two || adults > 1 || kids > 0;
  const hr = H.r,
    dr = D.r,
    delta = dr.total - hr.total;
  const lowest = [...order].sort((a, b) => a.r.total - b.r.total)[0];
  const who = hh ? "your household" : "you";
  $("cmp-eyebrow").textContent = `Compare · ${hh ? "household " : ""}${money(hr.cash)} total income`;
  $("cmp-home").textContent = H.p.n;

  const headline =
    Math.abs(delta) < 0.5
      ? `${D.p.n} and ${H.p.n} come out the same.`
      : delta < 0
        ? `Moving to ${D.p.n} would save ${who} <span class="save">${money(-delta)}</span> a year.`
        : `Moving to ${D.p.n} would cost ${who} <span class="cost">${money(delta)}</span> more a year.`;
  const ppDelta = (dr.avg - hr.avg) * 100;
  const sub =
    `Net tax is ${pct(dr.avg)} of income in ${D.p.n} vs ${pct(hr.avg)} in ${H.p.n} (${ppDelta >= 0 ? "+" : "−"}${Math.abs(ppDelta).toFixed(1)} points). ` +
    (lowest.p.c === home
      ? `${H.p.n} is the lowest of all 13 at these inputs.`
      : lowest.p.c === dest
        ? `${D.p.n} is the lowest of all 13 at these inputs.`
        : `Lowest of all 13 at these inputs: ${lowest.p.n}, ${pct(lowest.r.avg)}.`);

  // Difference cell: for tax, lower is better; for benefits and money left over, higher is better
  const dcell = (a: number, b: number, kind: Kind) => {
    const d = b - a;
    if (kind === "pp") {
      const v = d * 100;
      return Math.abs(v) < 0.05
        ? `<td class="r">–</td>`
        : `<td class="r ${v < 0 ? "better" : "worse"}">${v > 0 ? "+" : "−"}${Math.abs(v).toFixed(1)} pts</td>`;
    }
    if (Math.abs(d) < 0.5) return `<td class="r">–</td>`;
    const good = kind === "income" ? d > 0 : d < 0;
    return `<td class="r ${good ? "better" : "worse"}">${d > 0 ? "+" : "−"}${money(Math.abs(d))}</td>`;
  };
  const fmt = (v: number, kind: Kind) =>
    kind === "pp" ? pct(v) : kind === "credit" ? (v > 0.5 ? `−${money(v)}` : money(0)) : money(v);
  const row = (label: string, a: number, b: number, kind: Kind = "tax", cls = "") =>
    `<tr class="${cls}"><td>${label}</td><td class="r">${fmt(a, kind)}</td><td class="r">${fmt(b, kind)}</td>${kind === "credit" ? dcell(-a, -b, "tax") : dcell(a, b, kind)}</tr>`;
  const any = (f: (r: Result) => number) => f(hr) > 0.5 || f(dr) > 0.5;
  let rows =
    row("Federal income tax", hr.fed, dr.fed) +
    row("Provincial / territorial income tax", hr.prov, dr.prov) +
    (any(r => r.wh) ? row("Foreign tax withheld", hr.wh, dr.wh) : "") +
    row(`CPP/QPP, EI &amp; health premiums`, hr.payroll, dr.payroll) +
    (hr.breakdown.householdPremium || dr.breakdown.householdPremium
      ? row(
          "Included B.C. MSP premiums",
          hr.breakdown.householdPremium?.total ?? 0,
          dr.breakdown.householdPremium?.total ?? 0,
        )
      : "") +
    (effSpend() > 0
      ? row(
          `Sales tax <small class="result-annotation">(${prov(home).d.salesTax.label} vs ${prov(dest).d.salesTax.label})</small>`,
          hr.sales,
          dr.sales,
        )
      : "") +
    (ownedValue() > 0 || hasPropertyBill()
      ? row(
          `Property tax <small class="result-annotation">(${hasPropertyBill() ? "your bill" : rateFmt(hr.propRate)} vs ${rateFmt(dr.propRate)})</small>`,
          hr.property,
          dr.property,
        )
      : "") +
    (any(fuelAmt)
      ? row(
          `Fuel tax <small class="result-annotation">(${cents(hr.fuel?.perLitre.total ?? 0)} vs ${cents(dr.fuel?.perLitre.total ?? 0)} a litre)</small>`,
          fuelAmt(hr),
          fuelAmt(dr),
        )
      : "") +
    (any(carbonAmt)
      ? row("Carbon charge on gasoline", hr.carbon?.gasoline ?? 0, dr.carbon?.gasoline ?? 0) +
        row("Carbon charge on heating (estimate)", hr.carbon?.heating ?? 0, dr.carbon?.heating ?? 0)
      : "") +
    (kids > 0
      ? row(
          `Child benefits <small class="result-annotation">(CCB${any(r => r.provBen) ? " + provincial" : ""})</small>`,
          hr.childBen,
          dr.childBen,
          "credit",
        )
      : "") +
    (any(r => r.refund) ? row(`Refundable credits`, hr.refund, dr.refund, "credit") : "") +
    row(hh ? "Household net tax" : "Net tax", hr.total, dr.total, "tax", "sum") +
    row("Net rate", hr.avg, dr.avg, "pp") +
    row(`Marginal rate${two ? ` · ${NAMES[active]}` : ""}`, hr.marg, dr.marg, "pp") +
    row("Left after all of this", hr.breakdown.left, dr.breakdown.left, "income");
  if (two)
    rows +=
      `<tr class="grp"><th colspan="4">Income tax &amp; payroll by person</th></tr>` +
      hr.list.map((y, i) => row(NAMES[i], y.total, dr.list[i].total)).join("");
  if (hr.hasInv)
    rows +=
      `<tr class="grp"><th colspan="4">Investment income</th></tr>` +
      row("Tax on investment income", hr.invTax, dr.invTax);
  if (care.enabled) rows += childcareComparison(hr, dr);

  let spouseNote = "";
  const kindName = (r: Result) =>
    r.claim && r.claim.kind === "dependant"
      ? "eligible dependant amount"
      : r.claim && r.claim.kind === "alone"
        ? "amount for a person living alone"
        : "spouse amount";
  if (two || adults > 1 || (adults === 1 && (kids > 0 || hr.claim || dr.claim))) {
    if (!useBpa) spouseNote = "Turn on basic personal amounts to apply the spouse and dependant amounts.";
    else if (two && !spouse) spouseNote = "Taxed as two separate individuals, with no spouse amount.";
    else {
      const a = claimText(hr, H.p),
        b = claimText(dr, D.p);
      const nm = kindName(hr.claim ? hr : dr);
      spouseNote =
        a || b
          ? `The ${nm} saves ${who} ${[a, b].filter(Boolean).join(" and ")}${!a ? `, and nothing in ${H.p.n}` : !b ? `, and nothing in ${D.p.n}` : ""}.`
          : two || adults > 1
            ? "No spouse amount at these incomes: the lower earner's income is too high for it to apply."
            : "";
    }
  }

  const V = view === "dest" ? D : H;
  $("detail-body").innerHTML = `
    <div style="display:grid;gap:6px">
      <p class="headline">${headline}</p>
      <p class="result-summary">${sub}</p>
    </div>
    <div class="cmp-wrap"><table class="cmp">
      <thead><tr><th></th><th class="r">${H.p.n}</th><th class="r">${D.p.n}</th><th class="r">Difference</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
    <div class="views">
      <h4>Income tax detail${two ? ` for ${active ? "Partner" : "you"}` : ""}${spouseNote ? comparisonInfo("spouse and dependant amounts", spouseNote) : ""}</h4>
      <fieldset class="seg" aria-label="Province for income tax detail">
        <button type="button" data-view="home" aria-pressed="${view !== "dest"}">${H.p.n}</button>
        <button type="button" data-view="dest" aria-pressed="${view === "dest"}">${D.p.n}</button>
      </fieldset>
    </div>
    ${ledgerView(V)}`;
}

function ledgerView({ p, r }: Row) {
  const two = people.length === 2,
    x = counted(),
    m = r.me,
    n = m.breakdown.netIncome,
    who = two ? NAMES[active] : "";
  const tiParts: string[] = [];
  if (x.ord || !(x.oth || hasInv(x))) tiParts.push(`${money(n.ord)} employment income`);
  if (x.oth) tiParts.push(`${money(n.oth ?? 0)} other income`);
  if (x.cg > 0) tiParts.push(`${money(n.cg)} taxable ${share(F.investment.capitalGainsInclusion)} of net gains`);
  if (x.ed) tiParts.push(`${money(n.ed)} grossed-up eligible dividends`);
  if (x.nd) tiParts.push(`${money(n.nd)} grossed-up non-eligible dividends`);
  if (x.fd) tiParts.push(`${money(n.fd)} foreign dividends`);
  const tiText =
    tiParts.join(" + ") +
    (n.ded ? ` − ${money(n.ded)} deductions` : "") +
    (n.enh > 0.5 ? ` − ${money(n.enh)} enhanced ${p.qc ? "QPP" : "CPP"}` : "");
  const extra: string[] = [];
  if (m.workerDed > 0.5)
    extra.push(`Quebec taxable income is ${money(m.tiP)} after the ${money(m.workerDed)} deduction for workers.`);
  if (p.qc && r.childcare.claims[active] > 0)
    extra.push(
      `The federal childcare deduction of ${money(r.childcare.claims[active])} does not reduce Quebec taxable income.`,
    );
  if (x.cg < 0)
    extra.push(
      `The ${money(-x.cg)} net capital loss doesn't reduce this year's tax; it can be carried back three years or forward against future capital gains.`,
    );
  if (m.wh > 0.5) {
    const credited = m.breakdown.ftc,
      lost = m.breakdown.whUncredited;
    extra.push(
      `Tax includes ${money(m.wh)} withheld abroad on foreign dividends; ${money(credited)} of it is credited against Canadian tax${lost > 0.5 ? `, and ${money(lost)} can't be credited at this income` : ""}.`,
    );
  }
  const mrow = (label: string, rate: number) => `<tr><td>${label}</td><td class="r">${pct(rate, 2)}</td></tr>`;
  const cl = r.claim;
  const mine = cl !== null && cl.c === active;
  const spName = cl
    ? cl.kind === "dependant"
      ? "eligible dependant amount"
      : cl.kind === "alone"
        ? "living-alone amount"
        : "spouse amount"
    : "";
  const spLabelF = mine ? `Less ${spName} ${money(cl.fAmt)} × ${rateFmt(F.brackets[0][1])}` : "";
  const provincialMine = cl !== null && (cl.provincialClaimant ?? cl.c) === active;
  const spLabelP = provincialMine
    ? cl.qc && cl.kind === "spouse"
      ? `Less partner's unused credit transferred`
      : `Less ${spName} ${money(cl.pAmt)} × ${rateFmt(p.b[0][1])}`
    : "";
  const suffix = two ? ` · ${who}` : "";
  const fRows = present([
    useBpa && [
      `Less personal amount ${money(m.fAmt)} × ${rateFmt(F.brackets[0][1])}${m.fCred < m.fBpaFull - 0.5 ? " (capped)" : ""}`,
      -m.fCred,
    ],
    mine && [spLabelF, -m.fSp],
    [`Less employment amount, ${p.qc ? "QPP" : "CPP"} &amp; EI${p.qc ? "/QPIP" : ""} credits`, -m.fEmp],
    [`Less dividend tax credit`, -m.fDtc],
    p.qc && [`Less ${rateFmt(F.quebecAbatement)} Quebec abatement`, -m.breakdown.quebecAbatement],
    [`Less foreign tax credit`, -m.fFtc],
  ]);
  const pRows = present([
    useBpa && [
      `Less personal amount ${money(m.pAmt)} × ${rateFmt(p.b[0][1])}${m.pCred < m.pBpaFull - 0.5 ? " (capped)" : ""}`,
      -m.pCred,
    ],
    provincialMine && [spLabelP, -m.pSp],
    [
      p.d.childAmount?.ages === "all"
        ? `Less child amount (${money(p.d.childAmount.perChild)} per child)`
        : "Less credit for children under 6",
      -m.pKid,
    ],
    !p.qc && [`Less CPP &amp; EI credits${p.c === "YT" ? " and employment amount" : ""}`, -m.pEmp],
    [`Less childcare credit`, -m.breakdown.childcareCredit.applied],
    !p.d.postDividendSurtax && [`${p.n} surtax`, m.surtax],
    [`Less dividend tax credit`, -m.pDtc],
    !!p.d.postDividendSurtax && [`${p.n} surtax`, m.surtax],
    [`Less low-income tax reduction`, -m.lowRed],
    [`Less Ontario tax reduction`, -m.onRed],
    [`Less LIFT credit`, -m.lift],
    [`Less BC tax reduction`, -m.bcRed],
    [`Less foreign tax credit`, -m.pFtc],
    [`Temporary deficit reduction levy`, m.breakdown.provincialLevy],
  ]);
  const payRows = (
    [
      [`${p.qc ? "QPP" : "CPP"} base (${pct2((p.qc ? F.payroll.qpp : F.payroll.cpp).base)})`, m.pay.base],
      [`${p.qc ? "QPP" : "CPP"} enhanced`, m.pay.enh],
      [`EI (${pct2(p.qc ? F.payroll.ei.quebecRate : F.payroll.ei.rate)})`, m.pay.ei],
      [`QPIP (${pct2(F.payroll.qpip.rate)})`, m.pay.qpip],
      [`Ontario Health Premium`, m.ohp],
      [`${p.n} payroll tax (${rateFmt(p.d.payroll?.employeeTax ?? 0)})`, m.pay.terr],
    ] satisfies Adj[]
  ).filter(([, a]) => a > 0.5);
  const taxableInfo =
    hasInv(x) || x.oth || n.ded || n.enh > 0.5
      ? comparisonInfo(
          "taxable income",
          `${two ? `${who}: t` : "T"}axable income is ${money(m.ti)}: ${tiText}.${hasInv(x) ? ` "Tax on investment income" is the extra tax the ${two ? "household's " : ""}investment income adds on top of the rest of its income.` : ""} ${extra.join(" ")}`,
        )
      : "";
  return `
    <div class="ledgers">
      ${ledger(`Federal${suffix}`, "var(--fed)", { lines: m.f.lines, gross: m.f.tax, rows: fRows, net: m.fed }, m.ti, taxableInfo)}
      ${ledger(p.n + suffix, "var(--prov)", { lines: m.pr.lines, gross: m.pr.tax, rows: pRows, net: m.prov }, m.tiP)}
      <div class="ledger">
        <h4><i class="sw" style="background:var(--pay)"></i>Payroll${suffix}</h4>
        <table class="margs"><thead><tr><th>Contribution</th><th class="r">Amount</th></tr></thead><tbody>
          ${payRows.map(([l, a]) => `<tr><td>${l}</td><td class="r">${money(a)}</td></tr>`).join("") || `<tr><td>None at this income</td><td class="r">$0</td></tr>`}
        </tbody><tfoot><tr><td>Total</td><td class="r">${money(m.payroll)}</td></tr></tfoot></table>
        <h4 style="margin-top:16px">Marginal rate on ${two ? `${active ? "Partner's" : "your"} ` : "the "}next dollar of…${comparisonInfo("marginal rates", "Includes payroll contributions and any child benefit clawback. A negative dividend rate means the dividend tax credit is worth more than the tax on that dividend.")}</h4>
        <table class="margs"><thead><tr><th>Income type</th><th class="r">${hh() ? "Household rate" : "Combined rate"}</th></tr></thead><tbody>
          ${mrow("Employment income", r.margBy.ord)}
          ${mrow("Interest, rental &amp; other income", r.breakdown.margOther)}
          ${mrow("Net capital gains", r.margBy.cg)}
          ${mrow("Eligible dividends", r.margBy.ed)}
          ${mrow("Non-eligible dividends", r.margBy.nd)}
          ${mrow("Foreign dividends", r.margBy.fd)}
        </tbody></table>
      </div>
    </div>`;
}
const hh = () => people.length === 2 || adults > 1 || kids > 0;

// Inputs
const inp = $<HTMLInputElement>("income"),
  sl = $<HTMLInputElement>("slider");
function setIncome(v: number, from?: "input" | "slider") {
  me().ord = Math.max(0, Math.min(Math.round(v) || 0, 99999999));
  if (from !== "input") inp.value = me().ord.toLocaleString("en-CA");
  if (from !== "slider") sl.value = String(Math.min(me().ord, +sl.max));
  render();
}
inp.addEventListener("input", () => {
  const raw = inp.value.replace(/[^\d]/g, "");
  setIncome(+raw, "input");
});
inp.addEventListener("blur", () => {
  inp.value = me().ord.toLocaleString("en-CA");
});
inp.addEventListener("keydown", e => {
  if (e.key === "Enter") inp.blur();
});
sl.addEventListener("input", () => setIncome(+sl.value, "slider"));

// Annual deductions claimed for the selected adult. The engine supplies their combined total.
const deductionInputs = ["ded", "rrsp", "fhsa"] as const;
for (const key of deductionInputs) {
  const input = $<HTMLInputElement>(key);
  input.addEventListener("input", () => {
    me()[key] = Math.min(+input.value.replace(/[^\d]/g, "") || 0, 9999999);
    render();
  });
  input.addEventListener("blur", () => {
    input.value = (me()[key] || 0).toLocaleString("en-CA");
  });
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") input.blur();
  });
}
$("max-rrsp").addEventListener("click", () => {
  const estimate = calc(prov(home)).me.breakdown.rrspRoom;
  me().rrsp = estimate;
  $<HTMLInputElement>("rrsp").value = estimate.toLocaleString("en-CA");
  render();
});
function syncAll() {
  for (const key of deductionInputs) $<HTMLInputElement>(key).value = (me()[key] || 0).toLocaleString("en-CA");
  inp.value = me().ord.toLocaleString("en-CA");
  sl.value = String(Math.min(me().ord, +sl.max));
  syncInv();
}
$("people").addEventListener("click", e => {
  const t = closest(e.target, "button");
  if (!t) return;
  if (t.id === "add-partner") {
    people.push(blank(DEFAULT_INCOME));
    active = 1;
    if (adults < 2) setHousehold(2, kids);
  } else if (t.id === "remove-partner") {
    people = [people[0]];
    portfolios = portfolios.slice(0, 1);
    active = 0;
    if (adults === 2) setHousehold(1, kids);
  } else if (t.dataset.i != null) active = +t.dataset.i;
  else return;
  syncAll();
  render();
  const btn = document.querySelector<HTMLElement>(`#people .person[data-i="${active}"]`);
  if (btn) btn.focus();
});
$("people").addEventListener("change", e => {
  const t = e.target;
  if (t instanceof HTMLInputElement && t.id === "spouse-toggle") {
    spouse = t.checked;
    render();
  }
});

// Fill the gains/losses track from the 0 mark to the thumb: green for a net gain, red for a net loss.
function paintCg() {
  const r = $<HTMLInputElement>("cg-range"),
    min = +r.min,
    max = +r.max,
    v = me().cg;
  const p = (Math.max(min, Math.min(v, max)) - min) / (max - min),
    z = (0 - min) / (max - min);
  const color = v > 0 ? "var(--gain)" : v < 0 ? "var(--loss)" : "var(--muted)";
  const at = (q: number) => `calc(9px + (100% - 18px) * ${q})`;
  const a = at(Math.min(p, z)),
    b = at(Math.max(p, z));
  r.style.setProperty("--cg-color", color);
  r.style.setProperty(
    "--cg-track",
    `linear-gradient(to right, var(--rule) 0 ${a}, ${color} ${a} ${b}, var(--rule) ${b} 100%)`,
  );
  $("cg").classList.toggle("pos", v > 0);
  $("cg").classList.toggle("neg", v < 0);
}
// Double-click (or double-tap) the amount or the slider to reset gains/losses to 0.
function resetCg(e?: Event) {
  if (e) e.preventDefault();
  me().cg = 0;
  syncInv();
  render();
  $("cg").blur();
}
function onDoubleTap(el: HTMLElement, fn: (e?: Event) => void) {
  let last = 0;
  el.addEventListener("dblclick", fn);
  el.addEventListener("touchend", e => {
    const now = Date.now();
    if (now - last < 320) {
      fn(e);
      last = 0;
    } else last = now;
  });
}
/** The Income tab's amounts, other income and investment income: each kind has an amount box (id = key, class inv)
 *  and a slider (id = key-range, data-k = key). */
type InvKey = Exclude<IncomeKey, "ord">;
const INV_KEYS: InvKey[] = ["oth", "cg", "ed", "nd", "fd"];
const isInvKey = (k: string | undefined): k is InvKey => INV_KEYS.some(x => x === k);
function syncInv() {
  for (const k of INV_KEYS) {
    $<HTMLInputElement>(k).value = (me()[k] ?? 0).toLocaleString("en-CA");
    syncRange(k);
  }
}
function syncRange(k: InvKey) {
  const r = $<HTMLInputElement>(`${k}-range`);
  r.value = String(Math.max(+r.min, Math.min(me()[k] ?? 0, +r.max)));
}
document.querySelectorAll<HTMLInputElement>("input.inv").forEach(el => {
  const k = el.id;
  if (!isInvKey(k)) return;
  el.addEventListener("input", () => {
    const neg = k === "cg" && /^\s*[-−]/.test(el.value);
    const v = Math.min(+el.value.replace(/[^\d]/g, "") || 0, 99999999);
    me()[k] = neg ? -v : v;
    syncRange(k);
    render();
  });
  el.addEventListener("blur", () => {
    el.value = (me()[k] ?? 0).toLocaleString("en-CA");
  });
  el.addEventListener("keydown", e => {
    if (e.key === "Enter") el.blur();
  });
});
// The home value slider shares the inv-range styling but has no data-k; its own handler is under Property tax.
document.querySelectorAll<HTMLInputElement>("input.inv-range").forEach(el => {
  const k = el.dataset.k;
  if (!isInvKey(k)) return;
  el.addEventListener("input", () => {
    me()[k] = +el.value;
    $<HTMLInputElement>(k).value = (me()[k] ?? 0).toLocaleString("en-CA");
    render();
  });
});
// The Portfolio view of the selected person's investment income. A box being typed in keeps its draft until blur.
const PF_PERCENTS = [
  ["canadian", "pf-canadian"],
  ["foreign", "pf-foreign"],
  ["bonds", "pf-bonds"],
  ["yieldPct", "pf-yield"],
] as const;
const pfValueIn = $<HTMLInputElement>("pf-value");
function setPortfolio(change: Partial<Portfolio>) {
  portfolios[active] = { ...(portfolioOf(active) ?? defaultPortfolio()), ...change };
  render();
}
function renderPortfolio() {
  const entry = portfolioOf(active) ?? defaultPortfolio();
  const isPortfolio = entry.view === "portfolio";
  for (const b of document.querySelectorAll<HTMLElement>("[data-invest-view]"))
    b.setAttribute("aria-pressed", String(b.dataset.investView === entry.view));
  $("pf-body").hidden = !isPortfolio;
  $("invest-grid").classList.toggle("portfolio-view", isPortfolio);
  if (document.activeElement !== pfValueIn) pfValueIn.value = entry.value.toLocaleString("en-CA");
  for (const [key, id] of PF_PERCENTS) {
    const input = $<HTMLInputElement>(id);
    if (document.activeElement !== input) input.value = String(entry[key]);
  }
  const status = $("pf-mix-status");
  status.hidden = mixIsWhole(entry);
  status.textContent =
    mixTotal(entry) > 0 ? `Mix totals ${+mixTotal(entry).toFixed(2)}%: scaled to 100%` : "Mix totals 0%: no income";
}
for (const button of document.querySelectorAll<HTMLElement>("[data-invest-view]"))
  button.addEventListener("click", () => {
    const view: InvestView = button.dataset.investView === "portfolio" ? "portfolio" : "manual";
    setPortfolio({ view });
  });
pfValueIn.addEventListener("input", () =>
  setPortfolio({ value: Math.min(+pfValueIn.value.replace(/[^\d]/g, "") || 0, MAX_PORTFOLIO_VALUE) }),
);
for (const [key, id] of PF_PERCENTS) {
  const input = $<HTMLInputElement>(id);
  input.addEventListener("input", () => setPortfolio({ [key]: parsePercent(input.value) }));
}
for (const input of [pfValueIn, ...PF_PERCENTS.map(([, id]) => $<HTMLInputElement>(id))]) {
  input.addEventListener("blur", () => render());
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") input.blur();
  });
}
const whSel = $<HTMLSelectElement>("wh");
whSel.addEventListener("change", () => {
  whRate = +whSel.value;
  render();
});
const spIn = $<HTMLInputElement>("spend"),
  spRange = $<HTMLInputElement>("spend-range");
// Keep the existing proportional household-size adjustment; the separate frugality control has been removed.
function syncSpend() {
  spIn.value = effSpend().toLocaleString("en-CA");
  spRange.value = String(Math.min(effSpend(), +spRange.max));
}
// A typed amount retains its proportion of the household-size estimate when household size changes.
function fromShown(shown: number) {
  const est = spendEst(adults + kids);
  spendingAdjustment = est > 0 ? (shown / est - 1) * 100 : 0;
  spend = est;
}
spIn.addEventListener("input", () => {
  const shown = Math.min(+spIn.value.replace(/[^\d]/g, "") || 0, 9999999);
  fromShown(shown);
  spRange.value = String(Math.min(shown, +spRange.max));
  render();
});
spIn.addEventListener("blur", syncSpend);
spIn.addEventListener("keydown", e => {
  if (e.key === "Enter") spIn.blur();
});
spRange.addEventListener("input", () => {
  fromShown(+spRange.value);
  spIn.value = (+spRange.value).toLocaleString("en-CA");
  render();
});
// Adults and children set the spending estimate; the user's spending adjustment carries over proportionally.
function setHousehold(a: number, k: number) {
  adults = Math.max(people.length, Math.min(4, a));
  kids = Math.max(0, Math.min(6, k));
  under6 = Math.min(under6, kids);
  spend = spendEst(adults + kids);
  syncSpend();
}
const adultsIn = $<HTMLInputElement>("adults"),
  kidsIn = $<HTMLInputElement>("kids"),
  u6In = $<HTMLInputElement>("u6");
adultsIn.addEventListener("input", () => {
  setHousehold(+adultsIn.value, kids);
  render();
});
kidsIn.addEventListener("input", () => {
  setHousehold(adults, +kidsIn.value);
  care.setChildCount(kids);
  render();
});
u6In.addEventListener("input", () => {
  under6 = Math.min(kids, +u6In.value);
  u6In.value = String(under6); // the under-6 handle can't pass the number of children
  render();
});
// Property tax
const propertyBillIn = $<HTMLInputElement>("property-tax-bill");
propertyBillIn.addEventListener("input", () => {
  const raw = propertyBillIn.value.replace(/[,\s]/g, "");
  const value = Number(raw);
  propertyTaxBill = raw !== "" && Number.isFinite(value) && value >= 0 ? value : null;
  render();
});
propertyBillIn.addEventListener("blur", () => render());
propertyBillIn.addEventListener("keydown", e => {
  if (e.key === "Enter") propertyBillIn.blur();
});
$("property-tax-bill-reset").addEventListener("click", () => {
  propertyTaxBill = null;
  render();
});
const hvIn = $<HTMLInputElement>("hv"),
  hvRange = $<HTMLInputElement>("hv-range");
function syncHome() {
  hvIn.value = homeValue.toLocaleString("en-CA");
  hvRange.value = String(Math.min(homeValue, +hvRange.max));
}
hvIn.addEventListener("input", () => {
  homeValue = Math.min(+hvIn.value.replace(/[^\d]/g, "") || 0, 99999999);
  hvRange.value = String(Math.min(homeValue, +hvRange.max));
  render();
});
hvIn.addEventListener("blur", syncHome);
hvIn.addEventListener("keydown", e => {
  if (e.key === "Enter") hvIn.blur();
});
hvRange.addEventListener("input", () => {
  homeValue = +hvRange.value;
  hvIn.value = homeValue.toLocaleString("en-CA");
  render();
});
const prIn = $<HTMLInputElement>("pr-rate");
prIn.addEventListener("input", () => {
  const v = parseFloat(prIn.value.replace(/[^\d.]/g, ""));
  propOverride = Number.isFinite(v) && v >= 0 && v <= 10 ? v / 100 : null;
  render();
});
prIn.addEventListener("blur", () => render());
$("pr-reset").addEventListener("click", () => {
  propOverride = null;
  render();
});
for (const b of document.querySelectorAll<HTMLElement>("[data-tenure]"))
  b.addEventListener("click", () => {
    tenure = b.dataset.tenure === "rent" ? "rent" : "own";
    render();
  });
// Driving: typing or sliding sets your own distance or efficiency; Reset goes back to the starting value. 0 is allowed.
const kmIn = $<HTMLInputElement>("km"),
  kmRange = $<HTMLInputElement>("km-range"),
  effIn = $<HTMLInputElement>("eff");
kmIn.addEventListener("input", () => {
  const value = Number(kmIn.value.replace(/[,\s]/g, ""));
  kmOverride = Number.isFinite(value) ? Math.min(Math.max(0, metricDistance(value, drivingUnits)), 999999) : 0;
  render();
});
kmIn.addEventListener("blur", () => render());
kmIn.addEventListener("keydown", e => {
  if (e.key === "Enter") kmIn.blur();
});
kmRange.addEventListener("input", () => {
  kmOverride = +kmRange.value;
  render();
});
$("km-reset").addEventListener("click", () => {
  kmOverride = null;
  render();
});
effIn.addEventListener("input", () => {
  // A comma is a decimal point here (9,5 is 9.5, as many keyboards and locales write it), never a thousands mark
  const v = Number(effIn.value.replace(/,/g, "."));
  const metric = metricEfficiency(v, drivingUnits);
  effOverride = Number.isFinite(metric) ? Math.min(Math.max(0, metric), 99) : 0;
  render();
});
effIn.addEventListener("blur", () => render());
effIn.addEventListener("keydown", e => {
  if (e.key === "Enter") effIn.blur();
});
$("eff-reset").addEventListener("click", () => {
  effOverride = null;
  render();
});
for (const button of document.querySelectorAll<HTMLElement>("[data-driving-units]"))
  button.addEventListener("click", () => {
    drivingUnits = button.dataset.drivingUnits === "us" ? "us" : "metric";
    render();
  });
const credToggle = $<HTMLInputElement>("cred-toggle");
credToggle.addEventListener("change", () => {
  useCredits = credToggle.checked;
  render();
});
const rentIn = $<HTMLInputElement>("rent");
rentIn.addEventListener("input", () => {
  rent = Math.min(+rentIn.value.replace(/[^\d]/g, "") || 0, 999999);
  render();
});
rentIn.addEventListener("blur", () => {
  rentIn.value = rent.toLocaleString("en-CA");
});
rentIn.addEventListener("keydown", e => {
  if (e.key === "Enter") rentIn.blur();
});
$("sort-rate").addEventListener("click", () => {
  sort = "rate";
  render();
});
$("m-pct").addEventListener("click", () => {
  metric = "pct";
  render();
});
$("m-usd").addEventListener("click", () => {
  metric = "usd";
  render();
});
$("sort-geo").addEventListener("click", () => {
  sort = "geo";
  render();
});
const bpaToggle = $<HTMLInputElement>("bpa-toggle");
bpaToggle.addEventListener("change", () => {
  useBpa = bpaToggle.checked;
  render();
});

// Slider axis labels
// Amounts in dollars, unless the scale is marked data-plain (a distance)
function fmtTick(v: number, signed: boolean, plain: boolean) {
  const cur = plain ? "" : "$";
  if (v === 0) return `${cur}0`;
  const a = Math.abs(v),
    k = a >= 1e6 ? `${+(a / 1e6).toFixed(1)}M` : a >= 1000 ? `${+(a / 1000).toFixed(1)}k` : a;
  return `${v < 0 ? "−" : signed ? "+" : ""}${cur}${k}`;
}
function renderScale(sc: HTMLElement) {
  const r = $<HTMLInputElement>(sc.dataset.for ?? ""),
    min = +r.min,
    max = +r.max,
    signed = sc.hasAttribute("data-signed"),
    plain = sc.hasAttribute("data-plain");
  // "~" marks a minor tick: a mark with no label
  const ticks = (sc.dataset.ticks ?? "").split(",");
  sc.innerHTML = ticks
    .map((t, i) => {
      const minor = t.startsWith("~"),
        v = +t.replace("~", "");
      const q = (v - min) / (max - min);
      if (minor) return `<span class="minor" style="left:calc(9px + (100% - 18px) * ${q})"></span>`;
      const cls = i === 0 ? "first" : i === ticks.length - 1 ? "last" : "";
      const left = i === 0 ? "0" : i === ticks.length - 1 ? "100%" : `calc(9px + (100% - 18px) * ${q})`;
      const display = sc.id === "km-scale" ? displayDistance(v, drivingUnits) : v;
      return `<span class="${cls}${v === 0 && min < 0 ? " zero" : ""}" style="left:${left}">${fmtTick(display, signed, plain)}</span>`;
    })
    .join("");
}
document.querySelectorAll<HTMLElement>(".scale").forEach(renderScale);

// Tooltips: hover with a mouse, focus with the keyboard, or tap on touch.
const tip = $("tip");
let tipFor: HTMLElement | null = null;
function showTip(btn: HTMLElement) {
  if (tipFor && tipFor !== btn) tipFor.removeAttribute("aria-describedby");
  const seg = segTips.get(btn);
  if (seg) tip.innerHTML = seg;
  else tip.textContent = btn.dataset.tip ?? "";
  tip.hidden = false;
  tipFor = btn;
  for (const x of document.querySelectorAll(".stack i.hot, .ben.hot")) x.classList.remove("hot");
  if (seg) btn.classList.add("hot");
  btn.setAttribute("aria-describedby", "tip");
  const b = btn.getBoundingClientRect(),
    w = tip.offsetWidth,
    h = tip.offsetHeight;
  const left = Math.max(12, Math.min(b.left + b.width / 2 - w / 2, innerWidth - w - 12));
  // Chart segments: show above the segment so the province labels stay visible; info icons: below
  let top = seg ? b.top - h - 8 : b.bottom + 8;
  if (seg && top < 8) top = b.bottom + 8;
  if (!seg && top + h > innerHeight - 8) top = Math.max(8, b.top - h - 8);
  tip.style.left = `${left}px`;
  tip.style.top = `${top}px`;
}
function hideTip() {
  if (tipFor) {
    tipFor.removeAttribute("aria-describedby");
    tipFor.classList.remove("hot");
  }
  tip.hidden = true;
  tipFor = null;
}
const tipTarget = (t: EventTarget | null) => closest(t, ".info") || closest(t, ".stack i, .col .ben");
document.addEventListener("pointerover", e => {
  const b = tipTarget(e.target);
  if (b && e.pointerType === "mouse") showTip(b);
});
document.addEventListener("pointerout", e => {
  const b = tipTarget(e.target);
  if (b && e.pointerType === "mouse" && !b.contains(e.relatedTarget instanceof Node ? e.relatedTarget : null))
    hideTip();
});
document.addEventListener("focusin", e => {
  const b = closest(e.target, ".info");
  if (b) showTip(b);
});
document.addEventListener("focusout", e => {
  if (closest(e.target, ".info")) hideTip();
});
document.addEventListener(
  "click",
  e => {
    const b = closest(e.target, ".info");
    const seg = closest(e.target, ".stack i, .col .ben");
    if (b) {
      e.preventDefault();
      e.stopPropagation();
      showTip(b);
    } // preventDefault: an info button only shows its tip, even inside another control
    else if (seg) showTip(seg);
    else if (tipFor) hideTip();
  },
  true,
);
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && tipFor) hideTip();
});
addEventListener(
  "scroll",
  e => {
    if (tipFor && !closest(e.target, ".cc-scroll")) hideTip();
  },
  { passive: true, capture: true },
);
addEventListener("resize", () => {
  if (tipFor) hideTip();
});

onDoubleTap($("cg"), resetCg);
onDoubleTap($("cg-range"), resetCg);
fillSelects();
narrow.addEventListener?.("change", () => render());
homeSel.addEventListener("change", () => {
  home = homeSel.value;
  propOverride = null;
  propertyTaxBill = null;
  if (dest === home) dest = home === "AB" ? "BC" : "AB";
  fillSelects();
  render();
});
destSel.addEventListener("change", () => {
  dest = destSel.value;
  render();
});
$("detail-body").addEventListener("click", e => {
  const b = closest(e.target, "[data-view]");
  if (!b) return;
  view = b.dataset.view === "dest" ? "dest" : "home";
  render();
});
syncAll();
syncSpend();
syncHome();
$("view-provinces").addEventListener("click", () => {
  historyOpen = false;
  render();
});
$("view-history").addEventListener("click", () => {
  historyOpen = true;
  render();
});
$("history-real").addEventListener("click", () => {
  historyMode = "real";
  render();
});
$("history-nominal").addEventListener("click", () => {
  historyMode = "nominal";
  render();
});
rentIn.value = rent.toLocaleString("en-CA");
showTab();
render();

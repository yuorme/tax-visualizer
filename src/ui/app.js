// Page logic: reads the inputs, runs the engine for every province and draws the chart and comparison.
// All tax rules and amounts live in data/years/<year>/ and src/engine/; nothing here computes tax.
import years from "virtual:years";
import { blank, cashOf, compute, hasInv, INCOME_KEYS as KEYS, propertyRate } from "../engine/index.ts";
import { DEFAULT_INCOME, spendEst } from "./defaults.ts";
import { footerNotes, share, tooltips } from "./notes.ts";

const YEAR = Math.max(...Object.keys(years).map(Number));
const Y = years[YEAR],
  F = Y.federal;
// View model for each province: c = code, n = name, qc = Quebec system, geo = west-to-east position, b = brackets
const P = Y.provinces.map(d => ({ c: d.code, n: d.name, qc: d.system === "quebec", geo: d.order, b: d.brackets, d }));

const $ = id => document.getElementById(id);
const money = n => (Math.round(n) < 0 ? "−$" : "$") + Math.abs(Math.round(n)).toLocaleString("en-CA");
const pct = (n, d = 1) => `${(n * 100).toFixed(d)}%`;
const rateFmt = r => `${+(r * 100).toFixed(2)}%`;
const NAMES = ["You", "Partner"];
// RRSP room: a share of earned income up to the year's dollar limit (current employment income stands in for last year's)
const rrspMax = x => Math.min(F.rrsp.limit, Math.round(x.ord * F.rrsp.rate));

let people = [blank(DEFAULT_INCOME)],
  active = 0,
  spouse = true;
let metric = "pct",
  frug = 0,
  adults = 1,
  kids = 0,
  under6 = 0; // under6: children under 6, out of kids
let homeValue = 0,
  propOverride = null,
  propOpen = false,
  rent = 0,
  useCredits = true,
  credOpen = false;
const TREATY_WH = F.investment.foreignWithholding.usTreaty;
let sort = "rate",
  home = "ON",
  dest = "AB",
  view = "home",
  useBpa = true,
  whRate = TREATY_WH,
  spend = spendEst(1),
  invOpen = false;
const byCode = c => P.find(p => p.c === c);
const effSpend = () => Math.round((spend * (1 + frug / 100)) / 10) * 10; // nearest $10
// Engine input built from the current state
const inputs = () => ({
  people,
  active,
  spouse,
  adults,
  kids,
  under6,
  useBpa,
  whRate,
  useCredits,
  homeValue,
  rent,
  monthlySpending: effSpend(),
  propertyRates: propOverride != null ? { [home]: propOverride } : undefined,
});
const calc = p => compute(Y, p.d, inputs());
const propRate = c => propertyRate(byCode(c).d, inputs());
const pct2 = r => `${(r * 100).toFixed(2)}%`; // payroll rates shown to two decimals, e.g. 4.95%
const me = () => people[active];
function cleanPerson(o) {
  const x = blank(0);
  if (o) for (const k of KEYS) if (typeof o[k] === "number" && (k === "cg" || o[k] >= 0)) x[k] = o[k];
  if (o && o.ded >= 0) x.ded = o.ded;
  return x;
}
// Saved state from before the defaults changed (v < 3) is ignored so the new defaults show.
try {
  const s = JSON.parse(localStorage.getItem("taxcmp") || "{}");
  if (s.v === 3) {
    if (Array.isArray(s.people) && s.people.length) people = s.people.slice(0, 2).map(cleanPerson);
    if (s.active === 1 && people.length === 2) active = 1;
    if (typeof s.spouse === "boolean") spouse = s.spouse;
    if (s.sort) sort = s.sort;
    if (byCode(s.home)) home = s.home;
    if (byCode(s.dest)) dest = s.dest;
    if (s.view === "dest") view = "dest";
    if (typeof s.useBpa === "boolean") useBpa = s.useBpa;
    if (s.whRate >= 0) whRate = s.whRate;
    adults = s.adults >= 1 && s.adults <= 4 ? s.adults : people.length;
    if (s.kids >= 0 && s.kids <= 6) kids = s.kids;
    if (typeof s.under6 === "number") under6 = Math.max(0, Math.min(kids, s.under6));
    else if (s.under6 === true) under6 = kids; // older saves stored a yes/no
    if (s.homeValue >= 0) homeValue = s.homeValue;
    if (typeof s.propOverride === "number") propOverride = s.propOverride;
    if (typeof s.propOpen === "boolean") propOpen = s.propOpen;
    if (s.rent >= 0) rent = s.rent;
    if (typeof s.useCredits === "boolean") useCredits = s.useCredits;
    if (typeof s.credOpen === "boolean") credOpen = s.credOpen;
    spend = s.adults && s.spend >= 0 ? s.spend : spendEst(adults + kids); // older saves predate adults/children
    if (typeof s.invOpen === "boolean") invOpen = s.invOpen;
    if (s.metric === "usd") metric = "usd";
    if (s.frug >= -100 && s.frug <= 100000) frug = s.frug;
  }
} catch {}
if (dest === home) dest = home === "AB" ? "BC" : "AB";
function save() {
  try {
    localStorage.setItem(
      "taxcmp",
      JSON.stringify({
        v: 3,
        people,
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
        frug,
        metric,
        invOpen,
        homeValue,
        propOverride,
        propOpen,
        rent,
        useCredits,
        credOpen,
      }),
    );
  } catch {}
}

// Text that quotes the year's figures: footer notes, info tooltips and the withholding presets (see notes.ts)
$("tax-year").textContent = YEAR;
$("notes").insertAdjacentHTML("afterbegin", footerNotes(Y, { defaultIncome: DEFAULT_INCOME, spendEst }));
const TIPS = tooltips(Y);
for (const b of document.querySelectorAll("[data-note]")) b.dataset.tip = TIPS[b.dataset.note];
const WH_PRESETS = [0, 0.1, 0.25, 0.3]; // withholding choices offered besides the treaty rate
$("wh").innerHTML = [...new Set([...WH_PRESETS, TREATY_WH])]
  .sort((a, b) => a - b)
  .map(r => `<option value="${r}">${rateFmt(r)}${r === TREATY_WH ? " (U.S. treaty)" : ""}</option>`)
  .join("");

// Province selectors
const provOptions = skip =>
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
function fillSelects() {
  $("home").innerHTML = provCodes();
  $("home").value = home;
  $("home").title = P.find(p => p.c === home)?.n || "";
  $("dest").innerHTML = provOptions(home);
  $("dest").value = dest;
}
// Build columns once
// Safari drops list semantics from a <ul> with list-style: none unless the role is explicit
const colsEl = $("cols");
colsEl.setAttribute("role", "list");
P.forEach(p => {
  const c = document.createElement("li");
  c.className = "col";
  c.id = `col-${p.c}`;
  c.innerHTML = `<div class="col-plot"><span class="cv"></span><div class="stack"><i class="f"></i><i class="p"></i><i class="y"></i><i class="w"></i><i class="s"></i><i class="h"></i></div><i class="ben"></i></div>
    <div class="code" title="${p.n}">${p.c}${p.qc ? "<sup>†</sup>" : ""}</div><div class="cm"></div><div class="tag"></div>`;
  colsEl.appendChild(c);
});

// Axis starts at 40% and only widens (in 5-point steps) when a column needs more room.
const AXIS_BASE = 0.4;
function axisMax(top) {
  return Math.max(AXIS_BASE, (Math.ceil((top * 100 + 1) / 5) * 5) / 100);
}

function renderPeople() {
  let html = people
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

const kMoney = v => (v >= 1000 ? `$${+(v / 1000).toFixed(v >= 100000 ? 0 : 1)}k` : `$${Math.round(v)}`);
const SEG_NAMES = {
  f: "Federal income tax",
  p: "Provincial / territorial income tax",
  y: "CPP/QPP, EI & health premiums",
  w: "Foreign tax withheld",
  s: "Sales tax",
  h: "Property tax",
  ben: "Benefits and credits",
};
const SEG_KEYS = ["f", "p", "y", "w", "s", "h"];
const segAmt = (r, c) =>
  ({ f: r.fed, p: r.prov, y: r.payroll, w: r.wh, s: r.sales, h: r.property, ben: r.benefits })[c];
function segTip(p, r, c) {
  const amt = segAmt(r, c);
  const share = r.base > 0 ? amt / r.base : 0;
  const two = people.length === 2;
  const each = fn => (two ? r.list.map((y, i) => `${NAMES[i]} ${fn(y)}`).join(", ") : fn(r.list[0]));
  let sub = "";
  if (c === "f") {
    sub = `Top federal bracket reached: ${each(y => rateFmt(y.f.marg))}`;
    if (p.qc) sub += `. After the ${rateFmt(F.quebecAbatement)} Quebec abatement`;
  } else if (c === "p") {
    sub = `Top ${p.n} bracket reached: ${each(y => rateFmt(y.pr.marg))}`;
    const ex = r.list.reduce((a, y) => ({ s: a.s + y.surtax, red: a.red + y.onRed + y.lift + y.bcRed }), {
      s: 0,
      red: 0,
    });
    if (ex.s > 0.5) sub += `. Includes ${money(ex.s)} Ontario surtax`;
    if (ex.red > 0.5)
      sub += `. After ${money(ex.red)} of ${p.c === "BC" ? "BC tax reduction" : "Ontario tax reduction and LIFT credit"}`;
  } else if (c === "y") {
    const t = r.list.reduce(
      (a, y) => ({
        cpp: a.cpp + y.pay.base + y.pay.enh,
        ei: a.ei + y.pay.ei,
        qpip: a.qpip + y.pay.qpip,
        terr: a.terr + y.pay.terr,
        ohp: a.ohp + y.ohp,
      }),
      { cpp: 0, ei: 0, qpip: 0, terr: 0, ohp: 0 },
    );
    sub = [
      `${p.qc ? "QPP" : "CPP"} ${money(t.cpp)}`,
      `EI ${money(t.ei)}`,
      t.qpip > 0.5 && `QPIP ${money(t.qpip)}`,
      t.ohp > 0.5 && `Ontario Health Premium ${money(t.ohp)}`,
      t.terr > 0.5 && `${p.n} payroll tax ${money(t.terr)}`,
    ]
      .filter(Boolean)
      .join(" · ");
  } else if (c === "w") {
    const cr = r.list.reduce((a, y) => a + y.fFtc + y.pFtc, 0);
    sub = `Withheld abroad on foreign dividends; ${money(cr)} of it is credited back against Canadian tax`;
  } else if (c === "s") {
    sub = `${p.d.salesTax.label} on ${money(effSpend())} a month of taxable spending`;
  } else if (c === "h") {
    sub = `${rateFmt(r.propRate)} on a ${money(homeValue)} home${p.c === home && propOverride != null ? " (your rate)" : ` (${p.d.propertyTax.city} rate)`}`;
  } else if (c === "ben") {
    const parts = [];
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
  const res = P.map(p => ({ p, r: calc(p) }));
  const usd = metric === "usd";
  const val = r => (usd ? r.total : r.avg); // net of benefits: what the label shows and sorting uses
  const top = r => (usd ? r.gross : r.grossAvg); // gross: how tall the column is drawn
  // Axis runs from lo to hi. lo drops below zero when any province's net tax is negative
  // (child benefits larger than the taxes paid).
  let lo = 0,
    hi,
    ticks = [];
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
    pos = v => ((v - lo) / span) * 100;
  const yLabel = t => {
    if (Math.abs(t) < 1e-9) return usd ? "$0" : "0%";
    const sign = t < 0 ? "−" : "";
    return usd ? sign + kMoney(Math.abs(t)) : `${sign}${Math.round(Math.abs(t) * 100)}%`;
  };
  $("cc-y").innerHTML =
    ticks.map(t => `<span style="top:calc(var(--plot-h) * ${1 - (t - lo) / span})">${yLabel(t)}</span>`).join("") +
    `<span class="key" style="top:calc(var(--plot-h) + 24px)">marg.</span>`;
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
    const stack = el.querySelector(".stack");
    stack.style.bottom = `${pos(0)}%`;
    stack.style.height = `${(Math.max(0, top(r)) / span) * 100}%`;
    let last = "f";
    SEG_KEYS.forEach(c => {
      const seg = el.querySelector(`.${c}`),
        v = segAmt(r, c);
      seg.style.height = `${r.gross > 0 ? (v / r.gross) * 100 : 0}%`;
      seg._tip = segTip(p, r, c);
      if (v > 0.5) last = c;
    });
    for (const c of SEG_KEYS) el.querySelector(`.${c}`).classList.toggle("end", c === last);
    // Child benefits: a band from the net level up to the top of the column (below zero if net is negative)
    const ben = el.querySelector(".ben");
    ben.style.bottom = `${pos(val(r))}%`;
    ben.style.height = `${((top(r) - val(r)) / span) * 100}%`;
    ben.hidden = r.benefits < 0.5;
    ben._tip = segTip(p, r, "ben");
    const cv = el.querySelector(".cv");
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
    el.querySelector(".cm").textContent = narrow.matches ? (r.marg * 100).toFixed(1) : pct(r.marg);
    el.classList.toggle("is-home", p.c === home);
    el.classList.toggle("is-dest", p.c === dest);
    el.querySelector(".tag").textContent = p.c === home ? "home" : p.c === dest ? "dest." : "";
    el.setAttribute(
      "aria-label",
      `${p.n}${p.c === home ? " (home)" : p.c === dest ? " (destination)" : ""}: net ${pct(r.avg)} of income, marginal ${pct(r.marg)}, total ${money(r.total)}${r.benefits > 0.5 ? ` after ${money(r.benefits)} of child benefits` : ""}`,
    );
  });
  if (tipFor?._tip && tipFor.closest(".col")) showTip(tipFor); // keep an open segment tip current

  const two = people.length === 2,
    x = me();
  const totalInc = people.reduce((a, y) => a + cashOf(y), 0);
  const H = res.find(y => y.p.c === home);
  const anyBen = res.some(y => y.r.benefits > 0.5);
  $("chart-title").textContent = usd
    ? `${two || adults > 1 || kids > 0 ? "Household tax" : "Tax"} on ${money(totalInc)}${anyBen ? ", after benefits" : ""}`
    : `${two || adults > 1 || kids > 0 ? "Household tax" : "Tax"} rate on ${money(totalInc)}${anyBen ? ", after benefits" : ""}`;
  $("income-label").innerHTML = two
    ? `${active ? "Partner's" : "Your"} employment &amp; other income`
    : `Employment &amp; other income`;
  $("ded-label").textContent = two ? `${active ? "Partner's" : "Your"} deductions` : "Deductions";
  const rm = rrspMax(x);
  $("max-rrsp").textContent = `Max RRSP ${money(rm)}`;
  $("max-rrsp").setAttribute("aria-pressed", rm > 0 && x.ded === rm);
  $("invest-title").textContent = two ? `${active ? "Partner's" : "Your"} investment income` : "Investment income";
  $("invest-sum").textContent = hasInv(x)
    ? [
        x.cg > 0 && `${money(x.cg)} net gains`,
        x.cg < 0 && `${money(-x.cg)} net loss`,
        x.ed && `${money(x.ed)} eligible div.`,
        x.nd && `${money(x.nd)} non-eligible div.`,
        x.fd && `${money(x.fd)} foreign div.`,
      ]
        .filter(Boolean)
        .join(" · ")
    : "none added";
  $("legend-wh").hidden = !(people.some(y => y.fd > 0) && whRate > 0);
  $("legend-sales").hidden = !(effSpend() > 0);
  $("legend-prop").hidden = !(homeValue > 0);
  $("legend-ben").hidden = !anyBen;
  // Refundable credits panel: home province's credits, and a rent box only where a credit uses rent
  $("cred-toggle").checked = useCredits;
  $("cred-state").textContent = useCredits ? "Netted off tax" : "Not counted";
  const needRent = useCredits && homeValue === 0 && (byCode(home).d.creditsUseRent || byCode(dest).d.creditsUseRent);
  $("rent-field").hidden = !needRent;
  if (document.activeElement !== $("rent")) $("rent").value = rent.toLocaleString("en-CA");
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
      : `<tr class="muted"><td>No refundable credits in ${H.p.n} at this income${byCode(home).d.creditsUseRent && homeValue === 0 && rent === 0 ? " (enter rent for rent-based credits)" : ""}</td><td class="r">$0</td></tr>`;
  $("adults").value = adults;
  $("adults-val").textContent = adults;
  $("kids").value = kids;
  $("kids-val").textContent = kids;
  $("u6").hidden = kids === 0;
  $("u6").value = under6;
  $("u6-val").hidden = kids === 0;
  $("u6-val").textContent = `${under6} under 6`;
  // Track fill: slate up to the under-6 count, purple from there to the number of children
  const at = q => `calc(9px + (100% - 18px) * ${q / 6})`;
  $("kids-track").style.background =
    kids === 0
      ? ""
      : `linear-gradient(to right, var(--fed) 0 ${at(under6)}, var(--sales) ${at(under6)} ${at(kids)}, var(--rule) ${at(kids)} 100%)`;
  $("prop-sum").textContent =
    homeValue > 0 ? `${money(H.r.property)} a year on a ${money(homeValue)} home` : "not included";
  if (document.activeElement !== $("pr-rate")) $("pr-rate").value = (+(propRate(home) * 100).toFixed(3)).toString();
  $("pr-note").textContent =
    propOverride != null
      ? `Your rate (${byCode(home).d.propertyTax.city} is ${rateFmt(byCode(home).d.propertyTax.rate)})`
      : `${byCode(home).d.propertyTax.city} ${YEAR} rate`;
  $("pr-reset").hidden = propOverride == null;
  $("m-pct").setAttribute("aria-pressed", metric === "pct");
  $("m-usd").setAttribute("aria-pressed", metric === "usd");
  $("frug").value = frug;
  const fr = Math.round(frug);
  $("frug-val").textContent = fr === 0 ? "Typical" : `${fr > 0 ? "+" : "−"}${Math.abs(fr)}%`;
  $("wh").value = String(whRate);
  paintCg();
  renderPeople();
  $("sort-rate").setAttribute("aria-pressed", sort === "rate");
  $("sort-geo").setAttribute("aria-pressed", sort === "geo");

  renderDetail(res, order);
  $("bpa-toggle").checked = useBpa;
  $("bpa-state").textContent = useBpa ? "Credits applied" : "Brackets only";
  save();
}

// One government's bracket ledger. w.rows: [label, amount] adjustments after bracket tax (negative = reduces tax).
function ledger(title, sw, w, ti) {
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
  return `<div class="ledger"><h4><i class="sw" style="background:${sw}"></i>${title}</h4>
    <table><thead><tr><th>Bracket</th><th class="r">Rate</th><th class="r">Income in it</th><th class="r">Tax</th></tr></thead>
    <tbody>${rows}</tbody><tfoot>${foot.join("")}</tfoot></table></div>`;
}

function claimText(r, p) {
  const cl = r.claim;
  if (!cl || cl.saved <= 0.5) return null;
  return `${money(cl.saved)} in ${p.n}`;
}
function renderDetail(res, order) {
  const H = res.find(y => y.p.c === home),
    D = res.find(y => y.p.c === dest);
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
  const dcell = (a, b, kind) => {
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
  const fmt = (v, kind) =>
    kind === "pp" ? pct(v) : kind === "credit" ? (v > 0.5 ? `−${money(v)}` : money(0)) : money(v);
  const row = (label, a, b, kind = "tax", cls = "") =>
    `<tr class="${cls}"><td>${label}</td><td class="r">${fmt(a, kind)}</td><td class="r">${fmt(b, kind)}</td>${kind === "credit" ? dcell(-a, -b, "tax") : dcell(a, b, kind)}</tr>`;
  const any = f => f(hr) > 0.5 || f(dr) > 0.5;
  let rows =
    row("Federal income tax", hr.fed, dr.fed) +
    row("Provincial / territorial income tax", hr.prov, dr.prov) +
    (any(r => r.wh) ? row("Foreign tax withheld", hr.wh, dr.wh) : "") +
    row(`CPP/QPP, EI &amp; health premiums`, hr.payroll, dr.payroll) +
    (effSpend() > 0
      ? row(
          `Sales tax <small class="note">(${byCode(home).d.salesTax.label} vs ${byCode(dest).d.salesTax.label})</small>`,
          hr.sales,
          dr.sales,
        )
      : "") +
    (homeValue > 0
      ? row(
          `Property tax <small class="note">(${rateFmt(hr.propRate)} vs ${rateFmt(dr.propRate)})</small>`,
          hr.property,
          dr.property,
        )
      : "") +
    (kids > 0
      ? row(
          `Child benefits <small class="note">(CCB${any(r => r.provBen) ? " + provincial" : ""})</small>`,
          hr.childBen,
          dr.childBen,
          "credit",
        )
      : "") +
    (any(r => r.refund) ? row(`Refundable credits`, hr.refund, dr.refund, "credit") : "") +
    row(hh ? "Household net tax" : "Net tax", hr.total, dr.total, "tax", "sum") +
    row("Net rate", hr.avg, dr.avg, "pp") +
    row(`Marginal rate${two ? ` · ${NAMES[active]}` : ""}`, hr.marg, dr.marg, "pp") +
    row("Left after all of this", hr.base - hr.total, dr.base - dr.total, "income");
  if (two)
    rows +=
      `<tr class="grp"><th colspan="4">Income tax &amp; payroll by person</th></tr>` +
      hr.list.map((y, i) => row(NAMES[i], y.total, dr.list[i].total)).join("");
  if (hr.hasInv)
    rows +=
      `<tr class="grp"><th colspan="4">Investment income</th></tr>` +
      row("Tax on investment income", hr.invTax, dr.invTax);

  let spouseNote = "";
  const kindName = r =>
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
      <p class="note">${sub}</p>
    </div>
    <div class="cmp-wrap"><table class="cmp">
      <thead><tr><th></th><th class="r">${H.p.n}</th><th class="r">${D.p.n}</th><th class="r">Difference</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
    ${spouseNote ? `<p class="note">${spouseNote}</p>` : ""}
    <div class="views">
      <h4>Income tax detail${two ? ` for ${active ? "Partner" : "you"}` : ""}</h4>
      <fieldset class="seg" aria-label="Province for income tax detail">
        <button type="button" data-view="home" aria-pressed="${view !== "dest"}">${H.p.n}</button>
        <button type="button" data-view="dest" aria-pressed="${view === "dest"}">${D.p.n}</button>
      </fieldset>
    </div>
    ${ledgerView(V)}`;
}

function ledgerView({ p, r }) {
  const two = people.length === 2,
    x = me(),
    m = r.me,
    who = two ? NAMES[active] : "";
  const tiParts = [`${money(x.ord)} employment &amp; other`];
  if (x.cg > 0)
    tiParts.push(
      `${money(x.cg * F.investment.capitalGainsInclusion)} taxable ${share(F.investment.capitalGainsInclusion)} of net gains`,
    );
  if (x.ed) tiParts.push(`${money(x.ed * F.investment.grossUp.eligible)} grossed-up eligible dividends`);
  if (x.nd) tiParts.push(`${money(x.nd * F.investment.grossUp.nonEligible)} grossed-up non-eligible dividends`);
  if (x.fd) tiParts.push(`${money(x.fd)} foreign dividends`);
  const tiText =
    tiParts.join(" + ") +
    (x.ded ? ` − ${money(x.ded)} deductions` : "") +
    (m.pay.enh > 0.5 ? ` − ${money(m.pay.enh)} enhanced ${p.qc ? "QPP" : "CPP"}` : "");
  const extra = [];
  if (m.workerDed > 0.5)
    extra.push(`Quebec taxable income is ${money(m.tiP)} after the ${money(m.workerDed)} deduction for workers.`);
  if (x.cg < 0)
    extra.push(
      `The ${money(-x.cg)} net capital loss doesn't reduce this year's tax; it can be carried back three years or forward against future capital gains.`,
    );
  if (m.wh > 0.5) {
    const credited = m.fFtc + m.pFtc,
      lost = m.wh - credited;
    extra.push(
      `Tax includes ${money(m.wh)} withheld abroad on foreign dividends; ${money(credited)} of it is credited against Canadian tax${lost > 0.5 ? `, and ${money(lost)} can't be credited at this income` : ""}.`,
    );
  }
  const mrow = (label, key) => `<tr><td>${label}</td><td class="r">${pct(r.margBy[key], 2)}</td></tr>`;
  const mine = r.claim && r.claim.c === active;
  const spName = r.claim
    ? r.claim.kind === "dependant"
      ? "eligible dependant amount"
      : r.claim.kind === "alone"
        ? "living-alone amount"
        : "spouse amount"
    : "";
  const spLabelF = mine ? `Less ${spName} ${money(r.claim.fAmt)} × ${rateFmt(F.brackets[0][1])}` : "";
  const spLabelP = mine
    ? r.claim.qc && r.claim.kind === "spouse"
      ? `Less partner's unused credit transferred`
      : `Less ${spName} ${money(r.claim.pAmt)} × ${rateFmt(p.b[0][1])}`
    : "";
  const suffix = two ? ` · ${who}` : "";
  const fRows = [
    useBpa && [
      `Less personal amount ${money(m.fAmt)} × ${rateFmt(F.brackets[0][1])}${m.fCred < m.fBpaFull - 0.5 ? " (capped)" : ""}`,
      -m.fCred,
    ],
    mine && [spLabelF, -m.fSp],
    [`Less employment amount, ${p.qc ? "QPP" : "CPP"} &amp; EI${p.qc ? "/QPIP" : ""} credits`, -m.fEmp],
    [`Less dividend tax credit`, -m.fDtc],
    p.qc && [`Less ${rateFmt(F.quebecAbatement)} Quebec abatement`, -m.fedBasic * (1 - m.k)],
    [`Less foreign tax credit`, -m.fFtc],
  ].filter(Boolean);
  const pRows = [
    useBpa && [
      `Less personal amount ${money(m.pAmt)} × ${rateFmt(p.b[0][1])}${m.pCred < m.pBpaFull - 0.5 ? " (capped)" : ""}`,
      -m.pCred,
    ],
    mine && [spLabelP, -m.pSp],
    [
      p.d.childAmount?.ages === "all"
        ? `Less child amount (${money(p.d.childAmount.perChild)} per child)`
        : "Less credit for children under 6",
      -m.pKid,
    ],
    !p.qc && [`Less CPP &amp; EI credits${p.c === "YT" ? " and employment amount" : ""}`, -m.pEmp],
    [`Ontario surtax`, m.surtax],
    [`Less dividend tax credit`, -m.pDtc],
    [`Less low-income tax reduction`, -m.lowRed],
    [`Less Ontario tax reduction`, -m.onRed],
    [`Less LIFT credit`, -m.lift],
    [`Less BC tax reduction`, -m.bcRed],
    [`Less foreign tax credit`, -m.pFtc],
  ].filter(Boolean);
  const payRows = [
    [`${p.qc ? "QPP" : "CPP"} base (${pct2((p.qc ? F.payroll.qpp : F.payroll.cpp).base)})`, m.pay.base],
    [`${p.qc ? "QPP" : "CPP"} enhanced`, m.pay.enh],
    [`EI (${pct2(p.qc ? F.payroll.ei.quebecRate : F.payroll.ei.rate)})`, m.pay.ei],
    [`QPIP (${pct2(F.payroll.qpip.rate)})`, m.pay.qpip],
    [`Ontario Health Premium`, m.ohp],
    [`${p.n} payroll tax (${rateFmt(p.d.payroll?.employeeTax ?? 0)})`, m.pay.terr],
  ].filter(([, a]) => a > 0.5);
  return `
    ${hasInv(x) || x.ded || m.pay.enh > 0.5 ? `<p class="note">${two ? `${who}: t` : "T"}axable income is ${money(m.ti)}: ${tiText}.${hasInv(x) ? ` "Tax on investment income" is the extra tax the ${two ? "household's " : ""}investment income adds on top of other income.` : ""} ${extra.join(" ")}</p>` : ""}
    <div class="ledgers">
      ${ledger(`Federal${suffix}`, "var(--fed)", { lines: m.f.lines, gross: m.f.tax, rows: fRows, net: m.fed }, m.ti)}
      ${ledger(p.n + suffix, "var(--prov)", { lines: m.pr.lines, gross: m.pr.tax, rows: pRows, net: m.prov }, m.tiP)}
      <div class="ledger">
        <h4><i class="sw" style="background:var(--pay)"></i>Payroll${suffix}</h4>
        <table class="margs"><thead><tr><th>Contribution</th><th class="r">Amount</th></tr></thead><tbody>
          ${payRows.map(([l, a]) => `<tr><td>${l}</td><td class="r">${money(a)}</td></tr>`).join("") || `<tr><td>None at this income</td><td class="r">$0</td></tr>`}
        </tbody><tfoot><tr><td>Total</td><td class="r">${money(m.payroll)}</td></tr></tfoot></table>
        <h4 style="margin-top:16px">Marginal rate on ${two ? `${active ? "Partner's" : "your"} ` : "the "}next dollar of…</h4>
        <table class="margs"><thead><tr><th>Income type</th><th class="r">${hh() ? "Household rate" : "Combined rate"}</th></tr></thead><tbody>
          ${mrow("Employment &amp; other income", "ord")}
          ${mrow("Net capital gains", "cg")}
          ${mrow("Eligible dividends", "ed")}
          ${mrow("Non-eligible dividends", "nd")}
          ${mrow("Foreign dividends", "fd")}
        </tbody></table>
        <p class="note" style="margin-top:8px">Includes payroll contributions and any child benefit clawback. A negative dividend rate means the dividend tax credit is worth more than the tax on that dividend.</p>
      </div>
    </div>`;
}
const hh = () => people.length === 2 || adults > 1 || kids > 0;

// Inputs
const inp = $("income"),
  sl = $("slider");
function setIncome(v, from) {
  me().ord = Math.max(0, Math.min(Math.round(v) || 0, 99999999));
  if (from !== "input") inp.value = me().ord.toLocaleString("en-CA");
  if (from !== "slider") sl.value = Math.min(me().ord, +sl.max);
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

// Household members
const dedIn = $("ded");
dedIn.addEventListener("input", () => {
  me().ded = Math.min(+dedIn.value.replace(/[^\d]/g, "") || 0, 9999999);
  render();
});
dedIn.addEventListener("blur", () => {
  dedIn.value = me().ded.toLocaleString("en-CA");
});
dedIn.addEventListener("keydown", e => {
  if (e.key === "Enter") dedIn.blur();
});
$("max-rrsp").addEventListener("click", () => {
  me().ded = rrspMax(me());
  dedIn.value = me().ded.toLocaleString("en-CA");
  render();
});
function syncAll() {
  dedIn.value = me().ded.toLocaleString("en-CA");
  inp.value = me().ord.toLocaleString("en-CA");
  sl.value = Math.min(me().ord, +sl.max);
  syncInv();
}
$("people").addEventListener("click", e => {
  const t = e.target.closest("button");
  if (!t) return;
  if (t.id === "add-partner") {
    people.push(blank(DEFAULT_INCOME));
    active = 1;
    if (adults < 2) setHousehold(2, kids);
  } else if (t.id === "remove-partner") {
    people = [people[0]];
    active = 0;
    if (adults === 2) setHousehold(1, kids);
  } else if (t.dataset.i != null) active = +t.dataset.i;
  else return;
  syncAll();
  render();
  const btn = document.querySelector(`#people .person[data-i="${active}"]`);
  if (btn) btn.focus();
});
$("people").addEventListener("change", e => {
  if (e.target.id === "spouse-toggle") {
    spouse = e.target.checked;
    render();
  }
});

// Fill the gains/losses track from the 0 mark to the thumb: green for a net gain, red for a net loss.
function paintCg() {
  const r = $("cg-range"),
    min = +r.min,
    max = +r.max,
    v = me().cg;
  const p = (Math.max(min, Math.min(v, max)) - min) / (max - min),
    z = (0 - min) / (max - min);
  const color = v > 0 ? "var(--gain)" : v < 0 ? "var(--loss)" : "var(--muted)";
  const at = q => `calc(9px + (100% - 18px) * ${q})`;
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
function resetCg(e) {
  if (e) e.preventDefault();
  me().cg = 0;
  syncInv();
  render();
  $("cg").blur();
}
function onDoubleTap(el, fn) {
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
const INV_KEYS = ["cg", "ed", "nd", "fd"];
function syncInv() {
  for (const k of INV_KEYS) {
    $(k).value = me()[k].toLocaleString("en-CA");
    syncRange(k);
  }
}
function syncRange(k) {
  const r = $(`${k}-range`);
  r.value = Math.max(+r.min, Math.min(me()[k], +r.max));
}
document.querySelectorAll("input.inv").forEach(el => {
  el.addEventListener("input", () => {
    const neg = el.id === "cg" && /^\s*[-−]/.test(el.value);
    const v = Math.min(+el.value.replace(/[^\d]/g, "") || 0, 99999999);
    me()[el.id] = neg ? -v : v;
    syncRange(el.id);
    render();
  });
  el.addEventListener("blur", () => {
    el.value = me()[el.id].toLocaleString("en-CA");
  });
  el.addEventListener("keydown", e => {
    if (e.key === "Enter") el.blur();
  });
});
document.querySelectorAll("input.inv-range").forEach(el => {
  el.addEventListener("input", () => {
    me()[el.dataset.k] = +el.value;
    $(el.dataset.k).value = me()[el.dataset.k].toLocaleString("en-CA");
    render();
  });
});
$("wh").addEventListener("change", e => {
  whRate = +e.target.value;
  render();
});
const spIn = $("spend"),
  spRange = $("spend-range");
// The amount box and slider show spending after the frugality adjustment; "spend" holds the unadjusted base,
// so household-size estimates and frugality combine cleanly.
function syncSpend() {
  spIn.value = effSpend().toLocaleString("en-CA");
  spRange.value = Math.min(effSpend(), +spRange.max);
}
// Typing or sliding the amount moves the frugality setting to match: the amount is read as a percentage
// above or below the household-size estimate. Past ±50% the slider rests at its end, but the percentage
// keeps counting.
function fromShown(shown) {
  const est = spendEst(adults + kids);
  frug = est > 0 ? (shown / est - 1) * 100 : 0;
  spend = est;
}
spIn.addEventListener("input", () => {
  const shown = Math.min(+spIn.value.replace(/[^\d]/g, "") || 0, 9999999);
  fromShown(shown);
  spRange.value = Math.min(shown, +spRange.max);
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
// Adults and children set the spending estimate; frugality (your own amount) carries over as a percentage.
function setHousehold(a, k) {
  adults = Math.max(people.length, Math.min(4, a));
  kids = Math.max(0, Math.min(6, k));
  under6 = Math.min(under6, kids);
  spend = spendEst(adults + kids);
  syncSpend();
}
$("adults").addEventListener("input", e => {
  setHousehold(+e.target.value, kids);
  render();
});
$("kids").addEventListener("input", e => {
  setHousehold(adults, +e.target.value);
  render();
});
$("u6").addEventListener("input", e => {
  under6 = Math.min(kids, +e.target.value);
  e.target.value = under6; // the under-6 handle can't pass the number of children
  render();
});
// Property tax
const hvIn = $("hv"),
  hvRange = $("hv-range");
function syncHome() {
  hvIn.value = homeValue.toLocaleString("en-CA");
  hvRange.value = Math.min(homeValue, +hvRange.max);
}
hvIn.addEventListener("input", () => {
  homeValue = Math.min(+hvIn.value.replace(/[^\d]/g, "") || 0, 99999999);
  hvRange.value = Math.min(homeValue, +hvRange.max);
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
$("pr-rate").addEventListener("input", e => {
  const v = parseFloat(e.target.value.replace(/[^\d.]/g, ""));
  propOverride = Number.isFinite(v) && v >= 0 && v <= 10 ? v / 100 : null;
  render();
});
$("pr-rate").addEventListener("blur", () => render());
$("pr-reset").addEventListener("click", () => {
  propOverride = null;
  render();
});
$("prop-panel").addEventListener("toggle", () => {
  propOpen = $("prop-panel").open;
  save();
});
$("cred-panel").addEventListener("toggle", () => {
  credOpen = $("cred-panel").open;
  save();
});
$("cred-toggle").addEventListener("change", e => {
  useCredits = e.target.checked;
  render();
});
const rentIn = $("rent");
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
$("frug").addEventListener("input", e => {
  frug = +e.target.value;
  syncSpend();
  render();
});
onDoubleTap($("frug"), e => {
  if (e) e.preventDefault();
  frug = 0;
  syncSpend();
  render();
});
$("sort-geo").addEventListener("click", () => {
  sort = "geo";
  render();
});
$("bpa-toggle").addEventListener("change", e => {
  useBpa = e.target.checked;
  render();
});

// Slider axis labels
function fmtTick(v, signed) {
  if (v === 0) return "$0";
  const a = Math.abs(v),
    k = a >= 1e6 ? `${+(a / 1e6).toFixed(1)}M` : a >= 1000 ? `${+(a / 1000).toFixed(1)}k` : a;
  return `${v < 0 ? "−" : signed ? "+" : ""}$${k}`;
}
document.querySelectorAll(".scale").forEach(sc => {
  const r = $(sc.dataset.for),
    min = +r.min,
    max = +r.max,
    signed = sc.hasAttribute("data-signed");
  // "~" marks a minor tick: a mark with no label
  const ticks = sc.dataset.ticks.split(",");
  sc.innerHTML = ticks
    .map((t, i) => {
      const minor = t.startsWith("~"),
        v = +t.replace("~", "");
      const q = (v - min) / (max - min);
      if (minor) return `<span class="minor" style="left:calc(9px + (100% - 18px) * ${q})"></span>`;
      const cls = i === 0 ? "first" : i === ticks.length - 1 ? "last" : "";
      const left = i === 0 ? "0" : i === ticks.length - 1 ? "100%" : `calc(9px + (100% - 18px) * ${q})`;
      return `<span class="${cls}${v === 0 && min < 0 ? " zero" : ""}" style="left:${left}">${fmtTick(v, signed)}</span>`;
    })
    .join("");
});

// Tooltips: hover with a mouse, focus with the keyboard, or tap on touch.
const tip = $("tip");
let tipFor = null;
function showTip(btn) {
  if (tipFor && tipFor !== btn) tipFor.removeAttribute("aria-describedby");
  if (btn._tip) tip.innerHTML = btn._tip;
  else tip.textContent = btn.dataset.tip;
  tip.hidden = false;
  tipFor = btn;
  for (const x of document.querySelectorAll(".stack i.hot, .ben.hot")) x.classList.remove("hot");
  if (btn._tip) btn.classList.add("hot");
  btn.setAttribute("aria-describedby", "tip");
  const b = btn.getBoundingClientRect(),
    w = tip.offsetWidth,
    h = tip.offsetHeight;
  const left = Math.max(12, Math.min(b.left + b.width / 2 - w / 2, innerWidth - w - 12));
  // Chart segments: show above the segment so the province labels stay visible; info icons: below
  let top = btn._tip ? b.top - h - 8 : b.bottom + 8;
  if (btn._tip && top < 8) top = b.bottom + 8;
  if (!btn._tip && top + h > innerHeight - 8) top = Math.max(8, b.top - h - 8);
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
const tipTarget = t => t.closest?.(".info") || t.closest?.(".stack i, .col .ben");
document.addEventListener("pointerover", e => {
  const b = tipTarget(e.target);
  if (b && e.pointerType === "mouse") showTip(b);
});
document.addEventListener("pointerout", e => {
  const b = tipTarget(e.target);
  if (b && e.pointerType === "mouse" && !b.contains(e.relatedTarget)) hideTip();
});
document.addEventListener("focusin", e => {
  const b = e.target.closest?.(".info");
  if (b) showTip(b);
});
document.addEventListener("focusout", e => {
  if (e.target.closest?.(".info")) hideTip();
});
document.addEventListener(
  "click",
  e => {
    const b = e.target.closest?.(".info");
    const seg = e.target.closest?.(".stack i, .col .ben");
    if (b) {
      e.preventDefault();
      e.stopPropagation();
      showTip(b);
    } // preventDefault keeps the investment panel from toggling
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
    if (tipFor && !e.target.closest?.(".cc-scroll")) hideTip();
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
$("home").addEventListener("change", e => {
  home = e.target.value;
  propOverride = null;
  if (dest === home) dest = home === "AB" ? "BC" : "AB";
  fillSelects();
  render();
});
$("dest").addEventListener("change", e => {
  dest = e.target.value;
  render();
});
$("detail-body").addEventListener("click", e => {
  const b = e.target.closest("[data-view]");
  if (!b) return;
  view = b.dataset.view;
  render();
});
syncAll();
syncSpend();
syncHome();
$("prop-panel").open = propOpen || homeValue > 0;
$("cred-panel").open = credOpen;
$("invest").open = invOpen;
$("invest").addEventListener("toggle", () => {
  invOpen = $("invest").open;
  save();
});
render();

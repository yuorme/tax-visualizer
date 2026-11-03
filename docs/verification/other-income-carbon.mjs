// Independent arithmetic for activating carbon on PR90's frozen original specimens.
// Reads raw published parameters and inputs only; never imports engine, fuel or carbon calculators.
// Run: node docs/verification/other-income-carbon.mjs > /tmp/other-income-carbon-review.json
import fs from "node:fs";
import { parse } from "yaml";

const read = path => fs.readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const original = JSON.parse(read("tests/golden/other-income-original.json"));
const round = n => Math.round(n * 10000) / 10000;
const keys = ["ord", "oth", "cg", "ed", "nd", "fd"];
const out = { source: "Independent raw-data arithmetic in docs/verification/other-income-carbon.mjs", years: {} };
for (const year of [2025, 2026]) {
  const federal = parse(read(`data/years/${year}/federal.yaml`));
  const files = fs.readdirSync(new URL(`../../data/years/${year}/provinces/`, import.meta.url));
  const net = x => {
    const q = federal.payroll.cpp;
    const enhanced = Math.max(0, Math.min(x.ord, q.ympe) - q.exempt) * q.enh1 +
      Math.max(0, Math.min(x.ord, q.yampe) - q.ympe) * q.enh2;
    return Math.max(0, x.ord + (x.oth ?? 0) + Math.max(0, x.cg) * federal.investment.capitalGainsInclusion +
      x.ed * federal.investment.grossUp.eligible + x.nd * federal.investment.grossUp.nonEligible + x.fd -
      x.ded - enhanced);
  };
  out.years[year] = {};
  for (const s of original.scenarios) {
    out.years[year][s.id] = {};
    const couple = s.spouse && (s.people.length === 2 || s.adults >= 2);
    const income = people => couple ? people.reduce((sum, p) => sum + net(p), 0) : net(people[0]);
    for (const file of files) {
      const p = parse(read(`data/years/${year}/provinces/${file}`));
      const carbon = p.carbon;
      const payments = people => (carbon?.rebates ?? []).map(rebate => {
        if (rebate.program !== "carbon-rebate-payments") throw new Error(`Unexpected ${year} rebate shape`);
        const amount = rebate.params.payments.reduce((sum, payment) => {
          const parent = !couple && s.kids > 0;
          const dependants = payment.child * (parent ? s.kids - 1 : s.kids);
          const second = couple ? payment.spouse : parent ? payment.firstChild : 0;
          const phaseout = payment.rate * Math.max(0, income(people) - payment.threshold[couple || parent ? 1 : 0]);
          return sum + Math.max(0, payment.adult + second + dependants - phaseout);
        }, 0);
        return [rebate.name ?? carbon.name ?? rebate.program, s.useCredits ? amount : 0];
      }).filter(([, amount]) => amount >= 0.5);
      const totalRebate = people => payments(people).reduce((sum, [, amount]) => sum + amount, 0);
      const rebate = totalRebate(s.people);
      const days = (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / 86400000;
      let rate = carbon?.gasoline ?? 0;
      if (Array.isArray(rate)) rate = rate.reduce((sum, period, i, periods) => {
        const start = Date.parse(`${period.from}T00:00:00Z`);
        const end = i + 1 < periods.length ? Date.parse(`${periods[i + 1].from}T00:00:00Z`) : Date.UTC(year + 1, 0, 1);
        return sum + period.rate * (end - start) / 86400000 / days;
      }, 0);
      const gasoline = s.km * s.efficiency / 100 * rate;
      const heating = carbon?.heating.amount ?? 0;
      const marginal = Object.fromEntries(keys.map(key => {
        const people = s.people.map((p, i) => i === s.active ? { ...p, [key]: (p[key] ?? 0) + 100 } : p);
        return [key, round((rebate - totalRebate(people)) / 100)];
      }));
      const withoutInvestment = s.people.map(p => ({ ...p, cg: 0, ed: 0, nd: 0, fd: 0 }));
      out.years[year][s.id][p.code] = {
        gasoline: round(gasoline), heating, charges: round(gasoline + heating), rebate: round(rebate),
        credits: payments(s.people).map(([name, amount]) => [name, round(amount)]), marginal,
        investmentTaxChange: round(totalRebate(withoutInvestment) - rebate),
      };
    }
  }
}
process.stdout.write(`${JSON.stringify(out)}\n`);

import type { Federal, Province } from "../data/schema.ts";
import { gisAllowanceOf, gisMonthly } from "./gis-allowance.ts";
import { netIncomeParts, netIncomeTotal, payrollDetailsOf } from "./payroll.ts";
import type { Credit, Household, Person } from "./types.ts";
import { retirementCashOf } from "./types.ts";

type GisResult = ReturnType<typeof gisAllowanceOf>;
type Rule = NonNullable<Province["seniorSupplements"]>[number];
const money = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const tablePayment = (table: [number, number][], income: number) =>
  table.findLast(([from]) => income >= from)?.[1] ?? 0;
const reached = (x: Person, age: number, month: number) =>
  x.age !== undefined && (x.age > age || (x.age === age && month >= (x.birthMonth ?? 13)));

export interface SupplementPayment {
  program: string;
  name: string;
  recipients: number[];
  reportable: number[];
  estimated: boolean;
}

/** A program's verified income-reporting exception belongs to the recipient before spouse attribution.
 * The federal information-slip issuance exception alone does not remove income. The reporter
 * comparison reverses childcare and OAS repayments and excludes these provincial receipts. A tie retains
 * the named recipients. None of this changes who receives the cash. */
export function reportProvincialAssistance(payments: SupplementPayment[], incomes: number[], couple: boolean) {
  const reported = incomes.map(() => 0);
  for (const payment of payments) {
    payment.reportable.forEach((amount, i) => {
      const roundoff = Number.EPSILON * Math.max(1, ...incomes.map(Math.abs)) * 8;
      const reporter = couple && incomes[1 - i] - incomes[i] > roundoff ? 1 - i : i;
      reported[reporter] += amount;
    });
  }
  return reported.map(money);
}

/** Historical entitlement proxy: evaluate all provincial cash before adding any current provincial receipt
 * to net income. Residency, continuous application and ordinary independent living are assumed. */
export function seniorCashSupplementsOf(
  fed: Federal,
  p: Province,
  people: Person[],
  couple: boolean,
  claims: number[],
  gis: GisResult,
  excessDividendCredits: number[] = [],
) {
  const payments: SupplementPayment[] = [];
  for (const rule of p.seniorSupplements ?? []) {
    const amounts = people.map(() => 0);
    switch (rule.program) {
      case "bc-senior-supplement": {
        if (!gis) break;
        const q = rule.params;
        for (let month = 0; month < 12; month++) {
          for (const [i, adult] of gis.adults.entries()) {
            const row = adult.monthly[month];
            if (!row.category || row.gis <= 0) continue;
            const quarter = Math.floor(month / 3);
            const category = row.category;
            let maximum = category === "single" || category === "spouse-neither" ? q.single : q.couple;
            let reduction = gisMonthly(fed, quarter, 0, category).gis - row.gis;
            if (category === "spouse-allowance") {
              reduction =
                gisMonthly(fed, quarter, 0, "spouse-oas").gis - gisMonthly(fed, quarter, row.income, "spouse-oas").gis;
              const spouse = Math.max(0, q.allowance - reduction);
              if (adult.monthly[month].gis > 0 && gis.adults[1 - i]?.monthly[month].allowance > 0)
                amounts[1 - i] += spouse > 0 ? Math.max(q.minimum, spouse) : 0;
              reduction = Math.max(0, reduction - q.allowanceProtection);
              maximum = q.couple;
            }
            const payment = Math.max(0, maximum - reduction);
            amounts[i] += payment > 0 ? Math.max(q.minimum, payment) : 0;
          }
        }
        break;
      }
      case "ab-seniors-benefit": {
        const q = rule.params;
        const incomes = people.map(x => {
          // ASB starts at gross tax income, not federal net income or GIS's earnings exemption.
          const gross =
            x.ord +
            (x.selfEmployment ?? 0) +
            (x.oth ?? 0) +
            retirementCashOf(x) +
            (x.cppQpp ?? 0) +
            Math.max(0, x.cg) * fed.investment.capitalGainsInclusion +
            x.ed * fed.investment.grossUp.eligible +
            x.nd * fed.investment.grossUp.nonEligible +
            x.fd;
          return Math.max(0, gross - (x.rrsp ?? 0) - Math.min(q.employmentExemption, x.ord));
        });
        for (let month = 1; month <= 12; month++) {
          const eligible = people.map(x => !!x.oas && reached(x, q.minimumAge, month));
          const count = eligible.filter(Boolean).length;
          if (!count) continue;
          const period = q.periods.findLast(row => month >= row.from);
          if (!period) continue;
          eligible.forEach((yes, i) => {
            if (!yes) return;
            const income = couple ? incomes.reduce((a, b) => a + b, 0) : incomes[i];
            const annual =
              (couple ? period.couple : period.single) - income * (couple ? period.coupleRate : period.singleRate);
            const monthly =
              Math.round(Math.max(0, annual / 12 / (couple ? count : 1)) * 10 ** q.precision) / 10 ** q.precision;
            const rounded = Math.ceil(monthly * 100 - Number.EPSILON * Math.max(1, monthly * 100) * 8) / 100;
            amounts[i] += rounded > 0 ? Math.max(q.minimum, rounded) : 0;
          });
        }
        break;
      }
      case "sk-seniors-income-plan": {
        if (!gis) break;
        const q = rule.params;
        for (const [i, adult] of gis.adults.entries()) {
          adult.monthly.forEach((row, month) => {
            if (!row.category || row.gis <= 0) return;
            const quarter = Math.floor(month / 3);
            const both = row.category === "spouse-oas";
            const maximum = both ? q.couple : q.single;
            const maximumFederal = gisMonthly(fed, quarter, 0, row.category);
            const reduction =
              row.category === "spouse-allowance"
                ? Math.ceil(
                    (maximumFederal.allowance - gisMonthly(fed, quarter, row.income, row.category).allowance) /
                      q.allowanceDivisor -
                      Number.EPSILON * 8,
                  )
                : maximumFederal.gis - row.gis;
            const multiplier = both
              ? q.coupleMultiplier
              : row.category === "spouse-neither"
                ? q.neitherMultiplier
                : q.singleMultiplier;
            const amount = Math.max(0, maximum - reduction * multiplier);
            if (amount > 0) amounts[i] += Math.max(q.minimum, amount);
          });
        }
        break;
      }
      case "mb-55-plus": {
        const q = rule.params;
        if (gis) {
          for (let quarter = 0; quarter < 4; quarter++) {
            // The quarterly payment represents the quarter's assessed monthly category. A first eligible
            // month inside the quarter receives that quarter; no fractional statutory quarterly amount.
            for (const [i, adult] of gis.adults.entries()) {
              const row = adult.monthly.slice(quarter * 3, quarter * 3 + 3).find(m => m.category && m.gis > 0);
              if (!row?.category) continue;
              const category = row.category;
              const table =
                category === "single"
                  ? q.single
                  : category === "spouse-oas"
                    ? q.couple
                    : category === "spouse-neither"
                      ? q.neither
                      : q.allowance;
              const oas = fed.publicPensions?.params.quarterlyMonthly[quarter][0] ?? 0;
              const income =
                category === "spouse-neither"
                  ? Math.max(0, row.income - Math.ceil(oas / q.offsetRounding) * q.offsetRounding * 12 - q.offsetExtra)
                  : row.income;
              const payment = tablePayment(table, income);
              amounts[i] += payment;
              if (category === "spouse-allowance") amounts[1 - i] += payment;
            }
          }
        }
        // The junior component has a bespoke cash-income definition. Mixed OAS/junior families need
        // the unsupported April 2011 frozen-pension adjustment and are deliberately left out.
        if (!people.some(x => x.oas || x.gis || x.allowance)) {
          const incomes = people.map(x => {
            const pay = payrollDetailsOf(fed, p, x).pay;
            return (
              x.ord +
              (x.selfEmployment ?? 0) +
              (x.oth ?? 0) +
              retirementCashOf(x) +
              (x.cppQpp ?? 0) +
              x.cg +
              x.ed +
              x.nd +
              x.fd -
              pay.base -
              pay.enh -
              pay.ei -
              Math.min(q.employmentExpenseMax, x.ord * q.employmentExpenseRate)
            );
          });
          const income = Math.max(0, couple ? incomes.reduce((a, b) => a + b, 0) : incomes[0]);
          people.forEach((x, i) => {
            if ((x.age ?? 0) >= q.minimumAge && (x.age ?? 0) < (fed.publicPensions?.params.minimumAge ?? Infinity)) {
              // M.R.64/90 ss.4(3),5(3): quarterly instalments start in the application quarter.
              // Without an application date, assume application in the first age-eligible quarter.
              const eligibleQuarters = [3, 6, 9, 12].filter(month => reached(x, q.minimumAge, month)).length;
              amounts[i] = (tablePayment(couple ? q.juniorCouple : q.juniorSingle, income) * eligibleQuarters) / 4;
            }
          });
        }
        break;
      }
      case "on-gains": {
        if (!gis) break;
        const q = rule.params;
        for (const [i, adult] of gis.adults.entries())
          adult.monthly.forEach((row, month) => {
            if (!row.category || row.gis <= 0) return;
            const period = q.quarterly[Math.floor(month / 3)];
            const age = people[i].age;
            const older =
              age !== undefined &&
              (age > q.olderAge ||
                (age === q.olderAge &&
                  month + 1 >= (people[i].birthMonth ?? 13) + (fed.publicPensions?.params.effectiveMonthOffset ?? 0)));
            const offsets = older ? period.olderOffsets : period.youngerOffsets;
            const category = ["single", "spouse-oas", "spouse-neither", "spouse-allowance"].indexOf(row.category);
            const step = category === 0 ? q.singleStep : q.coupleStep;
            const bands = Math.floor(Math.max(0, row.income - offsets[category]) / step + Number.EPSILON * 8);
            amounts[i] += Math.max(0, period.maximum - bands * q.reduction);
          });
        break;
      }
      case "nb-low-income-seniors-benefit": {
        const prior = people.map(x => ({ ...x, ...(x.age === undefined ? {} : { age: x.age - 1 }) }));
        const historical = gisAllowanceOf(fed, p, prior, couple, claims, excessDividendCredits);
        const recipient = historical?.adults.findIndex(x => x.gis + x.allowance > 0) ?? -1;
        if (recipient >= 0) amounts[recipient] = rule.params.annual;
        break;
      }
      case "territorial-senior-supplement": {
        gis?.adults.forEach((adult, i) => {
          amounts[i] = adult.monthly.filter(row => row.gis + row.allowance > 0).length * rule.params.monthly;
        });
        break;
      }
      default:
        continue;
    }
    const recipients = amounts.map(money);
    payments.push({
      program: rule.program,
      name: rule.name ?? rule.program,
      recipients,
      reportable: recipients.map(n => (rule.reporting.kind === "t5007" && n > rule.reporting.exemptThrough ? n : 0)),
      estimated: rule.estimated ?? false,
    });
  }
  const comparison = people.map((x, i) =>
    netIncomeTotal(netIncomeParts(fed, p, x, 0, 0, gis ? gis.adults[i].gis + gis.adults[i].allowance : undefined)),
  );
  return {
    payments,
    reported: reportProvincialAssistance(payments, comparison, couple),
    total: money(payments.reduce((s, payment) => s + payment.recipients.reduce((a, b) => a + b, 0), 0)),
    incomeYearAssumption: "current-year-proxy" as const,
  };
}

/** Credits use actual current net income, including reportable provincial payments. They never generate
 * another T5007 receipt. NS alone needs final individual provincial liability. */
export function seniorRefundableCreditsOf(
  p: Province,
  hh: Household,
  people: Person[],
  couple: boolean,
  federalNets: number[],
  provincialFamily: number,
  provincialTax: number[],
  gis: GisResult,
  dependantClaimed: boolean,
) {
  const credits: Credit[] = [];
  for (const rule of p.seniorSupplements ?? []) {
    let amount = 0;
    const familyIncome = couple ? federalNets.reduce((a, b) => a + b, 0) : federalNets[0];
    switch (rule.program) {
      case "qc-senior-assistance": {
        const q = rule.params;
        const eligible = (couple ? people : [people[0]]).filter(x => (x.age ?? 0) >= q.minimumAge).length;
        if (eligible)
          amount = Math.max(
            0,
            eligible * q.maximum -
              q.rate * Math.max(0, provincialFamily - (couple ? q.coupleThreshold : q.singleThreshold)),
          );
        break;
      }
      case "mb-senior-personal-credit": {
        const q = rule.params;
        const included = couple ? people : [people[0]];
        const seniors = included.filter(x => (x.age ?? 0) >= q.minimumAge).length;
        if (!seniors) break;
        const children = hh.childAges?.filter(age => age <= q.childThrough).length ?? hh.kids;
        const dependant = !couple && dependantClaimed ? 1 : 0;
        amount = Math.max(
          0,
          q.adult * included.length +
            q.senior * seniors +
            q.dependant * dependant +
            q.child * Math.max(0, children - dependant) -
            q.rate * familyIncome,
        );
        break;
      }
      case "ns-gis-tax-refund": {
        const q = rule.params;
        people.forEach((x, i) => {
          if ((x.age ?? 0) >= q.minimumAge && (gis?.adults[i].gis ?? 0) > 0 && provincialTax[i] > 0)
            amount += Math.min(q.maximum, Math.max(q.minimum, provincialTax[i]));
        });
        break;
      }
      case "nl-seniors-benefit": {
        const q = rule.params;
        const included = couple ? people : [people[0]];
        if (!included.some(x => (x.age ?? 0) >= q.secondHalfAge)) break;
        for (const [half, schedule] of q.schedules.entries()) {
          const eligible = included.some(x => (x.age ?? 0) >= (half === 0 ? q.firstHalfAge : q.secondHalfAge));
          const senior = eligible
            ? Math.max(0, schedule.maximum - q.rate * Math.max(0, familyIncome - schedule.threshold))
            : 0;
          const ordinary = Math.max(
            0,
            schedule.ordinaryBase +
              (couple ? schedule.ordinarySpouse : 0) +
              Math.min(
                schedule.ordinaryExtra,
                schedule.ordinaryExtraRate * Math.max(0, familyIncome - schedule.ordinaryExtraFrom),
              ) +
              schedule.ordinaryChild * hh.kids -
              schedule.ordinaryRate * Math.max(0, familyIncome - schedule.ordinaryThreshold),
          );
          const small = (senior + ordinary) / 4 < q.smallPayment;
          // A stable small award was paid in full in its July, before this calendar year's first half.
          // The difference also reconciles the ordinary annual amount's existing legacy credit entry.
          const weight = small ? (half === 0 ? 0 : 1) : 0.5;
          amount += weight * (senior + ordinary) - ordinary / 2;
        }
        break;
      }
      default:
        continue;
    }
    if (amount !== 0) credits.push([rule.name ?? rule.program, money(amount)]);
  }
  return credits;
}

export type SeniorSupplementRule = Rule;

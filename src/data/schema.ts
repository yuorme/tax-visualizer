// Shape of the yearly parameter files in data/years/<year>/. Every file is checked against this schema
// in the tests and before each build, so a typo or missing value fails loudly instead of skewing results.
import { z } from "zod";

const rate = z.number().min(0).max(1);
const amount = z.number().min(0);
const pair = z.tuple([amount, amount]); // [single, family]
const ratePair = z.tuple([rate, rate]);
const source = z.object({ label: z.string(), url: z.string().url() });

/** [upper limit of the bracket, rate]. The last bracket's limit is Infinity (.inf in YAML). */
const brackets = z
  .array(z.tuple([z.union([z.number().positive(), z.literal(Infinity)]), rate]))
  .min(1)
  .refine(b => b.at(-1)?.[0] === Infinity, "last bracket must have no upper limit (.inf)")
  .refine(b => b.every((x, i) => i === 0 || x[0] > b[i - 1][0]), "bracket limits must increase");

/** An amount that shrinks linearly from max to min as net income rises from `from` to `to`. */
const phasedAmount = z.object({ max: amount, min: amount, from: amount, to: amount });

/** A program: which formula to use (program id) and its parameters for this year. */
const program = <Id extends string, P extends z.ZodTypeAny>(id: Id, params: P) =>
  z.object({ program: z.literal(id), params, name: z.string().optional(), estimated: z.boolean().optional() });

// ---------- Fuel tax on gasoline ----------
/** Tax on one litre of gasoline, in dollars. */
const perLitre = z.number().min(0).max(1);
/** A calendar date written YYYY-MM-DD (quoted in YAML, so it stays a string). */
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "write dates as YYYY-MM-DD")
  .refine(d => !Number.isNaN(Date.parse(d)) && new Date(d).toISOString().startsWith(d), "not a real date");
/** One rate for the whole year, or the rates in force from each date when the rate changed during the year: each
 *  applies from its date until the next one (or the end of the year), and the first starts on January 1. A `note`
 *  says anything the page notes should add, such as a change that was announced but not yet law. */
const fuelRate = z.union([
  perLitre,
  z
    .array(z.object({ from: isoDate, rate: perLitre, note: z.string().optional() }))
    .min(2)
    .refine(ps => ps.every((x, i) => i === 0 || x.from > ps[i - 1].from), "rate change dates must increase"),
]);
/** The dates in a rate, for checking that they fall in the data's year. */
const fuelDates = (r: z.infer<typeof fuelRate> | undefined) => (typeof r === "object" ? r.map(x => x.from) : []);

// ---------- Federal ----------
const cppLike = z.object({ exempt: amount, ympe: amount, yampe: amount, base: rate, enh1: rate, enh2: rate });
const cwbRegion = z.object({ max: pair, rate, floor: pair, threshold: pair, phaseOut: ratePair });
const qcCwbRow = z.tuple([rate, amount, amount, amount]);

export const federalSchema = z.object({
  year: z.number().int(),
  brackets,
  basicPersonalAmount: z.union([amount, phasedAmount]),
  quebecAbatement: rate,
  employmentAmount: amount,
  /** CRA's indexation factor for the year; the page notes cite it where an estimate indexes last year's figure. */
  indexation: rate,
  investment: z.object({
    capitalGainsInclusion: rate,
    grossUp: z.object({ eligible: z.number().min(1), nonEligible: z.number().min(1) }),
    dividendTaxCredit: z.object({ eligible: rate, nonEligible: rate }),
    /** Not used by the engine (withholding is an input); quoted in the page notes and the withholding presets. */
    foreignWithholding: z.object({ usTreaty: rate, deductibleAbove: rate }),
  }),
  rrsp: z.object({ rate, limit: amount }),
  childcare: program(
    "federal-childcare",
    z.object({
      youngUnder: z.number().int().positive(),
      eligibleThrough: z.number().int().nonnegative(),
      annualYoung: amount,
      annualOther: amount,
      annualDisability: amount,
      earnedNumerator: z.number().int().positive(),
      earnedDenominator: z.number().int().positive(),
      benefitChildUnder: z.number().int().positive(),
      benefitYoungUnder: z.number().int().positive(),
    }),
  ).optional(),
  payroll: z.object({
    cpp: cppLike,
    qpp: cppLike,
    ei: z.object({ maxInsurable: amount, rate, quebecRate: rate }),
    qpip: z.object({ maxInsurable: amount, rate }),
  }),
  childBenefit: z.object({
    perChildUnder6: amount,
    perChild6to17: amount,
    threshold1: amount,
    threshold2: amount,
    rate1: z.array(rate).length(5),
    fixed2: z.array(amount).length(5),
    rate2: z.array(rate).length(5),
  }),
  groceriesBenefit: z.object({
    name: z.string().optional(), // the credit's name that year (the GST/HST credit before July 2026)
    /** The name it replaced, for a year when it was renamed; the page notes mention it. */
    formerName: z.string().optional(),
    adult: amount,
    spouseOrFirstChild: amount,
    child: amount,
    singleSupplement: z.object({ max: amount, rate, from: amount }),
    phaseOut: z.object({ rate, from: amount }),
  }),
  workersBenefit: z.object({
    estimated: z.boolean().optional(),
    /** Explains a derivation other than indexing last year's amounts, when the page notes describe estimates. */
    estimationNote: z.string().optional(),
    standard: cwbRegion,
    secondaryEarnerExemption: amount,
    regional: z.record(z.string().length(2), cwbRegion),
    quebec: z.object({
      phaseOutRate: rate,
      single: qcCwbRow,
      couple: qcCwbRow,
      parent: qcCwbRow,
      coupleKids: qcCwbRow,
    }),
  }),
  /** Federal excise tax on gasoline. Absent for a year whose fuel taxes aren't in the data yet: the page then has no
   *  driving inputs and the engine adds no fuel tax. */
  fuelTax: z.object({ gasoline: fuelRate }).optional(),
  /** Starting values for the driving inputs that are the same everywhere (each province sets its own distance). */
  driving: z
    .object({
      /** Average fuel efficiency, litres per 100 km. */
      efficiency: z.number().positive(),
      /** Where the efficiency comes from, for the page notes. */
      efficiencySource: z.string(),
      /** The survey the provincial distances come from, for the page notes and the distance field. */
      distanceSource: z.string(),
      estimated: z.boolean().optional(),
    })
    .optional(),
  sources: z.array(source),
});

// ---------- Provinces and territories ----------
const nlChildReduction = z.object({
  perChild: z.array(amount).length(4),
  threshold: amount,
  rate: z.array(rate).length(3),
  additionalRate: rate,
});
const childBenefit = z.discriminatedUnion("program", [
  program(
    "quebec-family-allowance-by-child",
    z.object({
      max: z.array(amount).length(4),
      min: z.array(amount).length(2),
      maxSingleParent: amount,
      minSingleParent: amount,
      rate,
      thresholdSingle: amount,
      thresholdCouple: amount,
      schoolSupplies: amount,
    }),
  ),
  program(
    "alberta-child-benefit-and-employment",
    z.object({
      base: z.array(amount).length(4),
      baseRate: z.array(rate).length(4),
      baseThreshold: amount,
      working: z.array(amount).length(4),
      workingRate: rate,
      workingFloor: amount,
      workingThreshold: amount,
      workingPhaseOut: rate,
      minAnnual: amount,
    }),
  ),
  program(
    "nova-scotia-child-benefit-reduction",
    z.object({
      perChild: z.array(amount).length(3),
      fullBelow: amount,
      threshold: amount,
      rate: z.array(rate).length(2),
      additionalRate: rate,
    }),
  ),
  program("ontario-child-benefit", z.object({ perChild: amount, threshold: amount, rate })),
  program(
    "quebec-family-allowance",
    z.object({
      max: amount,
      maxSingleParent: amount,
      min: amount,
      minSingleParent: amount,
      rate,
      thresholdSingle: amount,
      thresholdCouple: amount,
      schoolSupplies: amount,
    }),
  ),
  program(
    "bc-family-benefit",
    z.object({
      max: z.array(amount).length(3),
      min: z.array(amount).length(3),
      singleParent: amount,
      rate,
      threshold: amount,
      minThreshold: amount,
    }),
  ),
  program(
    "alberta-child-family-benefit",
    z.object({
      base: z.array(amount).length(4),
      baseRate: z.array(rate).length(4),
      baseThreshold: amount,
      working: z.array(amount).length(4),
      workingRate: rate,
      workingFloor: amount,
      workingThreshold: amount,
      workingPhaseOut: rate,
    }),
  ),
  program(
    "alberta-child-family-benefit-by-child",
    z.object({
      base: z.array(amount).length(4),
      baseRate: z.array(rate).length(4),
      baseThreshold: amount,
      working: z.array(amount).length(4),
      workingRate: rate,
      workingFloor: amount,
      workingThreshold: amount,
      workingPhaseOut: z.array(rate).length(4),
      minAnnual: amount,
    }),
  ),
  program(
    "nova-scotia-child-benefit",
    z.object({ perChild: amount, fullBelow: amount, partialBelow: amount, partialOtherChildren: amount }),
  ),
  program(
    "nb-child-tax-benefit",
    z.object({
      perChild: amount,
      threshold: amount,
      rateOneChild: rate,
      rateMoreChildren: rate,
      workingIncomeSupplement: z.object({ rate, floor: amount, max: amount, threshold: amount, phaseOut: rate }),
    }),
  ),
  program(
    "per-child-reduced",
    z.object({ perChild: amount, threshold: amount, rateOneChild: rate, rateMoreChildren: rate }),
  ).extend({
    /** Where the reduction rates come from when CRA's T4114 doesn't give them, as the page notes cite it. */
    rateSource: z.string().optional(),
  }),
  program(
    "nwt-child-benefit-age-groups",
    z.object({
      under6: z.array(amount).length(5),
      under6More: amount,
      over6: z.array(amount).length(5),
      over6More: amount,
      fullUpTo: amount,
      endsAt: amount,
    }),
  ),
  program(
    "nwt-child-benefit",
    z.object({
      under6: z.array(amount).length(5),
      under6More: amount,
      over6: z.array(amount).length(5),
      over6More: amount,
      fullUpTo: amount,
      endsAt: amount,
    }),
  ),
  program("nl-child-benefit", z.object({ perChild: z.array(amount).length(4), fullUpTo: amount, endsAt: amount })),
  program(
    "nl-child-benefit-periods",
    z.object({
      periods: z
        .array(nlChildReduction.extend({ weight: z.number().positive().max(1) }))
        .min(1)
        .refine(ps => Math.abs(ps.reduce((sum, p) => sum + p.weight, 0) - 1) < 1e-9, "period weights must sum to 1"),
    }),
  ),
  program("nl-child-benefit-reduction", nlChildReduction),
  program("income-band-per-child", z.object({ bands: z.array(z.tuple([amount, amount])).min(1) })),
]);

const credit = z.discriminatedUnion("program", [
  program(
    "ontario-sales-tax-credit",
    z.object({ perPerson: amount, rate, thresholdSingle: amount, thresholdFamily: amount }),
  ),
  program(
    "ontario-energy-property-tax-credit",
    z.object({
      rentShare: rate,
      energyMax: amount,
      propertyBase: amount,
      propertyRate: rate,
      propertyMax: amount,
      rate,
      thresholdSingle: amount,
      thresholdFamily: amount,
    }),
  ),
  program(
    "quebec-solidarity-tax-credit",
    z.object({
      qstAdult: amount,
      qstSpouse: amount,
      qstAlone: amount,
      housingCouple: amount,
      housingSingle: amount,
      child: amount,
      rate,
      threshold: amount,
    }),
  ),
  program(
    "quebec-work-premium",
    z.object({
      phaseOutRate: rate,
      single: z.tuple([rate, amount, amount]),
      couple: z.tuple([rate, amount, amount]),
      parent: z.tuple([rate, amount, amount]),
      coupleKids: z.tuple([rate, amount, amount]),
    }),
  ),
  program("bc-renters-tax-credit", z.object({ max: amount, rate, threshold: amount })),
  program("mb-affordability-credits", z.object({ homeownerMax: amount, renter: amount })).extend({
    nameRenter: z.string(),
  }),
  // Before the affordability credit: rebate a share of gross school taxes, then credit the remaining school
  // taxes up to a cap. schoolTaxShare estimates the school portion of the reference city's total property tax.
  program(
    "mb-school-tax-credits",
    z.object({ schoolTaxShare: rate, schoolRebateRate: rate, educationCreditMax: amount, renterMax: amount }),
  ).extend({ nameRenter: z.string() }),
  program(
    "sk-low-income-tax-credit",
    z.object({ adult: amount, spouse: amount, child: amount, maxChildren: z.number().int(), rate, threshold: amount }),
  ),
  program("nb-hst-credit", z.object({ adult: amount, spouse: amount, child: amount, rate, threshold: amount })),
  program("ns-affordable-living-tax-credit", z.object({ base: amount, child: amount, rate, threshold: amount })),
  program(
    "pei-essentials-benefit",
    z.object({ single: amount, family: amount, rate, threshold: amount, minimum: amount }),
  ),
  // PEI sales tax credit (replaced by the essentials benefit in November 2026): a base amount, plus one for a
  // spouse or eligible dependant, plus a supplement that rises with family net income, all reduced above a threshold
  program(
    "pei-sales-tax-credit",
    z.object({
      individual: amount,
      spouseOrDependant: amount,
      supplementRate: rate,
      supplementFrom: amount,
      supplementMax: amount,
      rate,
      threshold: amount,
    }),
  ),
  program(
    "nl-income-supplement",
    z.object({
      base: amount,
      extraMax: amount,
      extraRate: rate,
      extraFrom: amount,
      couple: amount,
      child: amount,
      rate,
      threshold: amount,
    }),
  ),
]);

const lowIncomeReduction = z.discriminatedUnion("program", [
  program(
    "nl-low-income-reduction",
    z.object({ individual: amount, family: amount, rate, thresholdIndividual: amount, thresholdFamily: amount }),
  ),
  program("nb-low-income-reduction", z.object({ amount, rate, threshold: amount })),
  program(
    "family-low-income-reduction",
    z.object({ individual: amount, spouse: amount, child: amount, rate, threshold: amount }),
  ),
]);

const childcareCredit = z.discriminatedUnion("program", [
  program(
    "ontario-care",
    z.object({
      fullThrough: amount,
      maxRate: rate,
      decrement: rate,
      steps: z
        .array(z.tuple([amount, z.number().positive()]))
        .min(1)
        .refine(xs => xs.every((x, i) => i === 0 || x[0] > xs[i - 1][0]), "CARE band limits must increase"),
    }),
  ),
  program(
    "quebec-childcare",
    z.object({
      youngUnder: z.number().int().positive(),
      eligibleThrough: z.number().int().nonnegative(),
      annualYoung: amount,
      annualOther: amount,
      annualSevere: amount,
      rates: brackets,
    }),
  ),
  program("nl-childcare", z.object({})),
]);

export const provinceSchema = z
  .object({
    code: z.string().length(2),
    name: z.string(),
    /** Shorter name for running text, e.g. "PEI". */
    shortName: z.string().optional(),
    territory: z.literal(true).optional(),
    order: z.number().int().min(0),
    system: z.literal("quebec").optional(),
    brackets,
    basicPersonalAmount: z.union([amount, phasedAmount, z.literal("federal")]),
    /** A mid-year change to the basic personal amount, described in the page notes. */
    basicPersonalAmountChange: z.object({ change: z.string(), effective: z.string() }).optional(),
    /** First year the bracket limits stopped being indexed, when a province has frozen them. */
    bracketsFrozenSince: z.number().int().optional(),
    dividendTaxCredit: z.object({ eligible: rate, nonEligible: rate }),
    spouseAmount: z.union([
      z.object({ max: amount, threshold: amount }),
      program(
        "nova-scotia-spouse-amount",
        z.object({ max: amount, threshold: amount, supplement: z.object({ max: amount, rate, threshold: amount }) }),
      ),
      z.literal("federal"),
      z.literal("transfer"),
    ]),
    employmentAmountCredit: z.boolean().optional(),
    childAmount: z.object({ perChild: amount, ages: z.enum(["all", "under6"]) }).optional(),
    childcareCredit: childcareCredit.optional(),
    surtax: z.array(z.tuple([amount, rate])).optional(),
    postDividendSurtax: program("pei-surtax", z.object({ threshold: amount, rate })).optional(),
    householdPremium: program(
      "bc-msp-premiums",
      z.object({
        spouseDeduction: amount,
        childDeduction: amount,
        childcareAddbackRate: rate,
        bands: z
          .array(z.tuple([z.union([amount, z.literal(Infinity)]), amount]))
          .min(1)
          .refine(b => b.at(-1)?.[0] === Infinity, "last premium band must be unlimited")
          .refine(b => b.every((x, i) => i === 0 || x[0] > b[i - 1][0]), "premium band limits must increase"),
      }),
    ).optional(),
    additionalTax: program(
      "nl-deficit-reduction-levy",
      z.object({
        // Ascending [taxable-income onset, base levy, marginal rate, cap] bands.
        bands: z
          .array(z.tuple([amount, amount, rate, amount]))
          .min(1)
          .refine(b => b.every((x, i) => i === 0 || x[0] > b[i - 1][0]), "levy band onsets must increase"),
      }),
    ).optional(),
    ontarioTaxReduction: z.object({ base: amount, perChild: amount }).optional(),
    lift: z.object({ max: amount, rate, threshold: amount, familyThreshold: amount, phaseOut: rate }).optional(),
    bcTaxReduction: z.object({ max: amount, rate, threshold: amount }).optional(),
    lowIncomeReduction: lowIncomeReduction.optional(),
    quebec: z
      .object({
        workerDeduction: z.object({ rate, max: amount }),
        livingAlone: z.object({ max: amount, rate, threshold: amount }),
      })
      .optional(),
    payroll: z
      .object({
        employeeTax: rate.optional(),
        healthPremium: z.array(z.tuple([amount, amount, rate, amount])).optional(),
      })
      .optional(),
    salesTax: z.object({ rate, label: z.string() }),
    propertyTax: z.object({
      rate,
      city: z.string(),
      estimated: z.boolean().optional(),
      note: z.string().optional(),
      /** No published rate for the city at all: a rough placeholder, listed apart in the page notes. */
      rough: z.literal(true).optional(),
    }),
    creditsUseRent: z.boolean().optional(),
    /** Provincial or territorial fuel tax on gasoline, at the rate charged in the reference city (propertyTax.city),
     *  plus that city's regional transit fuel tax where it has one (TransLink in Vancouver, ARTM in Montreal). */
    fuelTax: z
      .object({
        gasoline: fuelRate,
        /** Where the provincial rate depends on the region, which one `gasoline` is for, e.g. "Vancouver area". */
        area: z.string().optional(),
        regional: z.object({ name: z.string(), gasoline: fuelRate }).optional(),
      })
      .optional(),
    /** Starting yearly distance for the driving inputs: the average per light vehicle, in kilometres. */
    driving: z.object({ distance: amount, estimated: z.boolean().optional() }).optional(),
    childBenefit: childBenefit.optional(),
    credits: z.array(credit).optional(),
    sources: z.array(source).optional(),
  })
  .refine(p => (p.system === "quebec") === (p.quebec !== undefined), "Quebec settings belong only to the Quebec system")
  .refine(p => (p.spouseAmount === "transfer") === (p.system === "quebec"), "spouse amount transfer is Quebec-only");

export const yearSchema = z
  .object({
    year: z.number().int(),
    federal: federalSchema,
    provinces: z.array(provinceSchema).length(13),
  })
  .refine(y => y.federal.year === y.year, "federal.yaml year must match its folder")
  .refine(y => new Set(y.provinces.map(p => p.order)).size === 13, "province order values must be unique")
  // Fuel data is all or nothing: federal and every province, rates and driving defaults together.
  .refine(
    y =>
      [y.federal.fuelTax, y.federal.driving, ...y.provinces.flatMap(p => [p.fuelTax, p.driving])].every(
        (x, _, all) => (x === undefined) === (all[0] === undefined),
      ),
    "fuel data must be given for federal and every province (fuelTax and driving), or for none",
  )
  .refine(y => {
    const rates = [
      y.federal.fuelTax?.gasoline,
      ...y.provinces.flatMap(p => [p.fuelTax?.gasoline, p.fuelTax?.regional?.gasoline]),
    ];
    return rates.every(r => {
      const d = fuelDates(r);
      return d.length === 0 || (d[0] === `${y.year}-01-01` && d.every(x => x.startsWith(`${y.year}-`)));
    });
  }, "a fuel rate that changes during the year starts on January 1 and changes only within that year");

export type FuelRate = z.infer<typeof fuelRate>;

export type Federal = z.infer<typeof federalSchema>;
export type Province = z.infer<typeof provinceSchema>;
export type YearData = z.infer<typeof yearSchema>;
export type ChildBenefitProgram = z.infer<typeof childBenefit>;
export type CreditProgram = z.infer<typeof credit>;
export type LowIncomeProgram = z.infer<typeof lowIncomeReduction>;
export type Brackets = Federal["brackets"];
export type PhasedAmount = z.infer<typeof phasedAmount>;

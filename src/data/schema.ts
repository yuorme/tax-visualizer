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

// ---------- Federal ----------
const cppLike = z.object({ exempt: amount, ympe: amount, yampe: amount, base: rate, enh1: rate, enh2: rate });
const cwbRegion = z.object({ max: pair, rate, floor: pair, threshold: pair, phaseOut: ratePair });
const qcCwbRow = z.tuple([rate, amount, amount, amount]);

export const federalSchema = z.object({
  year: z.number().int(),
  brackets,
  basicPersonalAmount: phasedAmount,
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
    adult: amount,
    spouseOrFirstChild: amount,
    child: amount,
    singleSupplement: z.object({ max: amount, rate, from: amount }),
    phaseOut: z.object({ rate, from: amount }),
  }),
  workersBenefit: z.object({
    estimated: z.boolean().optional(),
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
  sources: z.array(source),
});

// ---------- Provinces and territories ----------
const childBenefit = z.discriminatedUnion("program", [
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
    spouseAmount: z.union([z.object({ max: amount, threshold: amount }), z.literal("federal"), z.literal("transfer")]),
    employmentAmountCredit: z.boolean().optional(),
    childAmount: z.object({ perChild: amount, ages: z.enum(["all", "under6"]) }).optional(),
    surtax: z.array(z.tuple([amount, rate])).optional(),
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
    propertyTax: z.object({ rate, city: z.string(), estimated: z.boolean().optional(), note: z.string().optional() }),
    creditsUseRent: z.boolean().optional(),
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
  .refine(y => new Set(y.provinces.map(p => p.order)).size === 13, "province order values must be unique");

export type Federal = z.infer<typeof federalSchema>;
export type Province = z.infer<typeof provinceSchema>;
export type YearData = z.infer<typeof yearSchema>;
export type ChildBenefitProgram = z.infer<typeof childBenefit>;
export type CreditProgram = z.infer<typeof credit>;
export type LowIncomeProgram = z.infer<typeof lowIncomeReduction>;
export type Brackets = Federal["brackets"];
export type PhasedAmount = z.infer<typeof phasedAmount>;

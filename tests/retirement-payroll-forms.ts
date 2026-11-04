// Independent worksheet: no engine/schema/YAML imports. Constants transcribed from cached publications:
// 2025 Schedule 8 / Schedule U; T4127 January 2026 tables 8.3–8.8 and 2025 tables 8.24–8.29.
// 2026 annual settlement continues the 2025 forms, not a claim to have audited unpublished 2026 returns.
export type PayrollYear = 2025 | 2026;
export type Plan = "CPP" | "QPP";
const published = {
  2025: {
    ympe: 71300,
    yampe: 81200,
    qppBase: 0.054,
    eiMax: 65700,
    ei: 0.0164,
    eiQc: 0.0131,
    qpipMax: 98000,
    qpip: 0.00494,
    federalRate: 0.145,
    employmentAmount: 1471,
  },
  2026: {
    ympe: 74600,
    yampe: 85000,
    qppBase: 0.053,
    eiMax: 68900,
    ei: 0.0163,
    eiQc: 0.013,
    qpipMax: 103000,
    qpip: 0.0043,
    federalRate: 0.14,
    employmentAmount: 1501,
  },
};

/** The test author supplies the legally contributory months and their pay, independently of engine eligibility.
 *  Include zero-pay contributory months: the CPP annual proration counts eligibility, not months with wages. */
export function payrollWorksheet(
  year: PayrollYear,
  plan: Plan,
  annualPay: number,
  contributoryPay: number[],
  wrongQppProration = false,
) {
  const p = published[year];
  const cpp = plan === "CPP";
  const months = contributoryPay.length;
  const fraction = cpp || wrongQppProration ? months / 12 : 1;
  const pensionable = contributoryPay.reduce((sum, pay) => sum + pay, 0);
  // Employer guide 4.5.4: sum pay-period contributions, subject to the UNREDUCED QPP annual maximum.
  const totalRate = cpp ? 0.0595 : p.qppBase + 0.01;
  const withheldFirst = Math.min(
    contributoryPay.reduce((sum, pay) => sum + Math.max(0, pay - 3500 / 12) * totalRate, 0),
    (p.ympe - 3500) * totalRate * fraction,
  );
  const withheldSecond = Math.min(
    Math.max(0, pensionable - p.ympe * fraction) * 0.04,
    (p.yampe - p.ympe) * 0.04 * fraction,
  );
  let base: number;
  let enhanced: number;
  if (cpp) {
    // Schedule 8 Part 2 B/D/E; Part 3 lines 1–7, 11/12/22; deduction line 28.
    const B = (p.ympe * months) / 12;
    const D = (p.yampe * months) / 12;
    const E = (3500 * months) / 12;
    const line2 = Math.min(D, pensionable);
    const line4 = Math.max(0, line2 - B);
    const line5 = line2 - line4;
    const line7 = Math.max(0, line5 - E);
    base = line7 * 0.0495;
    enhanced = line7 * 0.01 + line4 * 0.04;
  } else {
    // Schedule U B: employee elections are absent from Table 1's proration situations.
    // Line 10 is withheld tier 1, and line 11 extracts the first additional share.
    const line11 = withheldFirst * (0.01 / totalRate);
    const line12 = Math.min(pensionable, p.ympe * fraction);
    const line13 = 3500 * fraction;
    const line14 = Math.max(0, line12 - line13);
    const line143 = Math.max(0, (p.ympe - 3500) * fraction);
    const line144 = Math.min(line14, line143);
    const line16 = Math.min(line11, line144 * 0.01);
    const line173 = Math.max(0, withheldFirst - line144 * totalRate);
    const line175 = line173 + withheldSecond;
    const line187 = Math.max(0, pensionable - p.ympe * fraction);
    const line19 = (p.yampe - p.ympe) * fraction;
    const line21 = Math.min(line187, line19) * 0.04;
    const line22 = Math.min(line175, line21);
    enhanced = line22 + line16; // line 23 / TP-1 line 248
    base = line144 * p.qppBase; // annual required base; excess withheld is returned (TP-1 line 452)
  }
  const ei = Math.min(annualPay, p.eiMax) * (cpp ? p.ei : p.eiQc);
  const qpip = cpp ? 0 : Math.min(annualPay, p.qpipMax) * p.qpip;
  const federalEmploymentCredit = (Math.min(annualPay, p.employmentAmount) + base + ei + qpip) * p.federalRate;
  return {
    base,
    enhanced,
    ei,
    qpip,
    federalEmploymentCredit,
    provincialEmploymentCredit: cpp ? (base + ei) * 0.0505 : 0, // Ontario 428 line 33, QC no such credit
    pensionable,
    withheldBase: withheldFirst * ((cpp ? 0.0495 : p.qppBase) / totalRate),
    withheldEnhanced: withheldFirst * (0.01 / totalRate) + withheldSecond,
    overpayment: Math.max(0, withheldFirst + withheldSecond - base - enhanced),
  };
}

/** T4114-25, one child under six, ordinary AFNI. This is independent of the production benefit function. */
export function ccb2025(net: number) {
  if (net <= 37487) return 7997;
  if (net <= 81222) return 7997 - (net - 37487) * 0.07;
  return Math.max(0, 7997 - 3061 - (net - 81222) * 0.032);
}

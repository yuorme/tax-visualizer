"""Independent form arithmetic for issue 14. No production code, YAML or engine snapshots are read.

Run with --write to create ONLY the new self-employment fixture; otherwise verify it.
Sources and continuation assumptions are documented in 14-self-employment.md.
"""
import json
import sys
from decimal import Decimal as D
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DEST = ROOT / "tests/golden/features/self-employment.json"
PUBLISHED = {
    # T4127 tables; Schedule R/10; Quebec 2025/2026 parameter publications.
    2025: dict(ympe=71300, yampe=81200, qpp=.054, ei_max=65700, ei=.0164, ei_qc=.0131,
               qpip_max=98000, qpip_employee=.00494, qpip_self=.00878, qpip_ded=.43736,
               federal=.145, cea=1471, rrsp=32490, worker=1420, hsf_low=18130, hsf_high=63060),
    2026: dict(ympe=74600, yampe=85000, qpp=.053, ei_max=68900, ei=.0163, ei_qc=.013,
               qpip_max=103000, qpip_employee=.0043, qpip_self=.00764, qpip_ded=.43717,
               federal=.14, cea=1501, rrsp=33810, worker=1450, hsf_low=18500, hsf_high=64355),
}
DEFAULTS = dict(active=0, spouse=False, adults=1, kids=0, under6=0, useBpa=True, whRate=.15,
                useCredits=True, homeValue=0, rent=0, monthlySpending=0)
CASES = []


def form(year, province, person, months=12, employee_earnings=None):
    q = PUBLISHED[year]
    qc = province == "QC"
    wages, profit = person.get("ord", 0), person["selfEmployment"]
    actual = wages if employee_earnings is None else employee_earnings
    fraction = months / 12
    ceiling_fraction = 1 if qc else fraction
    low, high, exempt = q["ympe"] * ceiling_fraction, q["yampe"] * ceiling_fraction, 3500 * ceiling_fraction
    # Schedule 8 Part 4 lines 4–9, and its Part 5 residual liability:
    # calculate required contributions on ALL pensionable income, subtract the employee contribution,
    # then double the unpaid share. QPP U 95–99 independently caps business liability at that residual.
    business = profit * fraction
    base_rate = q["qpp"] if qc else .0495
    employee_first = max(0, min(actual, low) - exempt)
    employee_second = max(0, min(actual, high) - low)
    all_first = max(0, min(actual + business, low) - exempt)
    all_second = max(0, min(actual + business, high) - low)
    b = (all_first - employee_first) * base_rate * 2
    enhancement = (all_first - employee_first) * .02 + (all_second - employee_second) * .08
    employer_base = b / 2
    # R 12/20/22/24/26 and S10 1–9: annual wage income uses the QPIP ceiling before business income.
    remaining = max(0, q["qpip_max"] - wages)
    self_qpip = min(profit, remaining) * q["qpip_self"] if qc and wages + profit >= 2000 else 0
    qpip_ded = self_qpip * q["qpip_ded"]
    employee_enh = employee_first * .01 + employee_second * .04
    base = employee_first * base_rate + b
    enh = employee_enh + enhancement
    ei = min(wages, q["ei_max"]) * (q["ei_qc"] if qc else q["ei"])
    qpip = (min(wages, q["qpip_max"]) * q["qpip_employee"] if qc else 0) + self_qpip
    if qc and profit > 0 and wages + profit < 2000:
        qpip = 0  # TP-1 line 97: employee withholding is refunded below the combined threshold.
    deductions = sum(person.get(k, 0) for k in ("ded", "rrsp", "fhsa")) + employer_base + qpip_ded
    other = person.get("oth", 0)
    net = max(0, wages + profit + other - deductions - enh)
    worker = min(q["worker"], .06 * (wages + profit)) if qc else 0
    hsf_income = max(0, profit + other - employer_base - enhancement - qpip_ded) if qc else 0
    hsf = (min(150, max(0, hsf_income - q["hsf_low"]) * .01) if hsf_income <= q["hsf_high"]
           else min(1000, 150 + (hsf_income - q["hsf_high"]) * .01)) if qc else 0
    e = {
        "list.0.pay.base": base, "list.0.pay.enh": enh, "list.0.pay.ei": ei, "list.0.pay.qpip": qpip,
        "list.0.pay.terr": wages * .02 if province in ("NT", "NU") else 0,
        "list.0.empAmt": min(wages, q["cea"]), "list.0.workerDed": worker, "list.0.ti": net,
        "list.0.tiP": max(0, net - worker), "list.0.cash": wages + profit + other,
        "list.0.fEmpFull": (min(wages, q["cea"]) + base - employer_base + ei + qpip - qpip_ded) * q["federal"],
        "list.0.breakdown.rrspRoom": min(q["rrsp"], int((wages + profit) * .18 + .5)),
        "list.0.breakdown.netIncome.ded": deductions,
        "list.0.breakdown.healthServicesFund.income": hsf_income,
        "list.0.breakdown.healthServicesFund.contribution": hsf,
    }
    detail = dict(base=b, enhanced=enhancement, baseCredit=b / 2, employerBaseDeduction=employer_base,
                  qpip=self_qpip, qpipDeduction=qpip_ded, qpipCredit=self_qpip - qpip_ded,
                  pensionDeduction=employer_base + enhancement,
                  healthServicesDeduction=employer_base + enhancement + qpip_ded,
                  pensionableEarnings=business)
    e.update({"list.0.breakdown.selfEmployment." + k: v for k, v in detail.items()})
    if province == "ON":
        e["list.0.pEmpFull"] = (base - employer_base + ei) * .0505
        if wages == 0:
            e["list.0.lift"] = 0
    if province == "YT":
        e["list.0.pEmpFull"] = (min(wages, q["cea"]) + base - employer_base + ei) * .064
    return e


def add(year, province, name, profit, wages=0, *, months=12, employee_earnings=None, extra=None, hh=None, expected=None):
    person = dict(ord=wages, selfEmployment=profit, **(extra or {}))
    e = form(year, province, person, months, employee_earnings)
    e.update(expected or {})
    CASES.append(dict(id=f"{year}-{province.lower()}-{name}", year=year, province=province,
                      household=dict(people=[person], **(hh or {})),
                      expected={k: round(v, 4) if isinstance(v, (float, int)) else v for k, v in e.items()}))
    return CASES[-1]


for year, q in PUBLISHED.items():
    for code in ("ON", "QC"):
        add(year, code, "pierre-75000", 75000)
        for label, income in (("below-exemption", 3499), ("at-exemption", 3500), ("above-exemption", 3501),
                              ("at-ympe", q["ympe"]), ("above-ympe", q["ympe"] + 1),
                              ("at-yampe", q["yampe"]), ("above-yampe", q["yampe"] + 1)):
            add(year, code, label, income)
        for name, wages, profit in (
            ("mixed-unused-exemption", 2000, 3000), ("mixed-first-tier", 30000, 30000),
            ("mixed-cross-ympe", q["ympe"] - 5000, 10000),
            ("mixed-employee-at-ympe", q["ympe"], 20000),
            ("mixed-employee-in-tier2", q["ympe"] + 1000, 20000),
            ("mixed-employee-max", q["yampe"], 20000),
        ):
            add(year, code, name, profit, wages)
    for name, wages, profit in (("qpip-below-minimum", 0, 1999), ("qpip-minimum", 0, 2000),
                                ("qpip-mixed-below-minimum", 1500, 499),
                                ("qpip-combined-minimum", 1500, 500),
                                ("qpip-at-ceiling", 0, q["qpip_max"]),
                                ("qpip-above-ceiling", 0, q["qpip_max"] + 1000),
                                ("qpip-shared-ceiling", q["qpip_max"] - 1000, 5000),
                                ("qpip-employee-exhausts", q["qpip_max"], 5000)):
        add(year, "QC", name, profit, wages)
    # Business profit is the same for CPP2 even after the mandatory stop; only the pension base is prorated.
    add(year, "ON", "turns-70-june", 100000, months=6, extra=dict(age=70, birthMonth=6),
        expected={"list.0.breakdown.selfEmployment.contributoryMonths": [1, 2, 3, 4, 5, 6]})
    add(year, "ON", "past-70", 100000, months=0, extra=dict(age=71, birthMonth=6))
    add(year, "QC", "turns-72", 100000, extra=dict(age=72, birthMonth=6))
    add(year, "QC", "past-72", 100000, months=0, extra=dict(age=73, birthMonth=6))
    timing = dict(retirementPensionSince=dict(year=year - 2, month=1),
                  monthlyEarningsWeights=[1] * 6 + [0] * 6,
                  cppElection=dict(stop=dict(year=year, month=6)),
                  qppElection=dict(stop=dict(year=year, month=6)))
    add(year, "ON", "mixed-cpt30-prorates-profit", 60000, 10000, months=6, employee_earnings=10000,
        extra=dict(age=66, birthMonth=1, employeePayroll=timing))
    add(year, "QC", "rr50-does-not-stop-business", 60000, 10000, employee_earnings=10000,
        extra=dict(age=66, birthMonth=1, employeePayroll=timing))
    # HSF material boundaries after ONLY the Schedule F-eligible deductions, not RRSP/FHSA/worker deductions.
    business = 10000
    eligible_ded = 6500 * (q["qpp"] + .02) + business * q["qpip_self"] * q["qpip_ded"]
    for name, target in (("threshold", q["hsf_low"]), ("above-threshold", q["hsf_low"] + 1),
                         ("plateau", q["hsf_low"] + 15000), ("upper", q["hsf_high"]),
                         ("above-upper", q["hsf_high"] + 1), ("cap", q["hsf_high"] + 85000)):
        add(year, "QC", "hsf-" + name, business,
            extra=dict(oth=target - business + eligible_ded, rrsp=1000, fhsa=500, ded=200))
    for code in ("NT", "NU", "YT"):
        add(year, code, "self-not-wages", 30000)
        add(year, code, "mixed-only-wages-payroll", 30000, 10000)

# Published Pierre and complete Ontario income tax independently of the engine.
pierre = next(c for c in CASES if c["id"] == "2025-on-pierre-75000")
net = 75000 - 3356.1 - 1652
federal = 57375 * .145 + (net - 57375) * .205 - (16129 + 3356.1) * .145
ontario = 52886 * .0505 + (net - 52886) * .0915 - (12747 + 3356.1) * .0505
pierre["expected"].update({"list.0.fed": round(federal, 4), "list.0.prov": round(ontario, 4),
                          "list.0.payroll": 8364.2 + 600,
                          "list.0.total": round(federal + ontario + 8364.2 + 600, 4),
                          "breakdown.margSelfEmployment": .3528})
add(2025, "ON", "cwb-phase-in", 5000, expected={"credits.1.1": 540})
add(2025, "QC", "work-premium-phase-in", 5000, expected={"credits.1.1": 969.8, "credits.3.1": 301.6})
qc_net = 20000 - 16500 * .074 - (20000 * .00878) * .43736
add(2025, "QC", "work-premium-phase-out", 20000, expected={
    "credits.1.1": .373 * (12620 - 2400) - .2 * (qc_net - 14170.05),
    "credits.3.1": .116 * (12620 - 2400) - .1 * (qc_net - 1200 - 12620),
})
add(2025, "AB", "child-working-component", 5000, hh=dict(kids=1, under6=1),
    expected={"provBen": 1499 + (5000 - 2760) * .15})
add(2025, "NB", "child-working-supplement", 5000, hh=dict(kids=1, under6=1),
    expected={"provBen": 250 + (5000 - 3750) * .04})
family = add(2025, "ON", "cwb-secondary-business-earner", 40000, 5000, hh=dict(adults=2, spouse=True))
family["household"]["people"].append(dict(ord=15000, selfEmployment=0))
# S6: lower working income is the person with HIGHER wages. Cap their exemption by net income 14,885.
family_net = (45000 - 15 - 2780) + (15000 - 115)
family["expected"].update({"famNet": family_net, "credits.1.1": 2813 - (42205 - 30639) * .15})
tie = add(2025, "ON", "cwb-equal-working-income", 10000, 5000, extra=dict(oth=20000),
          hh=dict(adults=2, spouse=True))
tie["household"]["people"].append(dict(ord=15000, selfEmployment=0))
# Work = 15,000 each; either spouse may claim. The first person's net allows the larger 15,000 exemption.
tie_net = (35000 - 15 - 695) + (15000 - 115)
tie["expected"].update({"famNet": tie_net, "credits.1.1": 2813 - (tie_net - 15000 - 30639) * .15})
add(2025, "ON", "ccb-net-income", 75000, hh=dict(kids=1, under6=1),
    expected={"ccb": round(7997 - (net - 37487) * .07, 4)})
childcare = dict(mode="automatic", children=[dict(age=4, expenses=6000)], earnedIncome=[75000])
c = add(2025, "ON", "childcare-and-personal-deductions", 75000, extra=dict(rrsp=2000, fhsa=1000, ded=500),
        hh=dict(kids=1, under6=1, childcare=childcare))
c["expected"]["list.0.ti"] -= 6000
c["expected"]["list.0.tiP"] -= 6000
c["expected"]["list.0.breakdown.netIncome.ded"] += 6000
c["expected"]["childcare.claims.0"] = 6000

fixture = dict(defaults=DEFAULTS, cases=CASES)
if "--write" in sys.argv:
    DEST.write_text(json.dumps(fixture, indent=2) + "\n")
else:
    assert json.loads(DEST.read_text()) == fixture, "Committed self-employment fixture differs from independent forms"
print(f"Verified {len(CASES)} independent self-employment cases")

# Review regression fixtures are separately committed; never regenerate the locked original cases.
# At 75,000 business profit in 2025, the next 100 stays in the second QPP band, below the QPIP
# ceiling, in federal/provincial second tax brackets, and in the HSF second column. Credits are phased out.
review = json.loads((DEST.parent / "self-employment-marginal.json").read_text())
qpp_delta = D("100") * D(".08")
qpip_delta = D("100") * D(".00878")
qpip_deduction_delta = qpip_delta * D(".43736")
net_delta = D("100") - qpp_delta - qpip_deduction_delta
federal_delta = (net_delta * D(".205") - (qpip_delta - qpip_deduction_delta) * D(".145")) * D(".835")
provincial_delta = net_delta * D(".19")  # worker deduction already capped
hsf_delta = net_delta * D(".01")
marginal = (federal_delta + provincial_delta + qpp_delta + qpip_delta + hsf_delta) / 100
assert D(str(review["cases"][0]["expected"])) == marginal, marginal
# From zero to 100: below contribution/benefit floors, non-refundable credits absorb both income taxes.
assert review["cases"][1]["expected"] == 0
# CPP's new positive-profit counterfactual needs an unsupported effective-month election, not a tax estimate.
assert review["cases"][2]["expected"] is None

# Merge integration: main's Schedule B line 275 base must use the business-inclusive worker deduction.
merge = review["workerDeductionMerge"]
worker = D("5000") * D(".06")
net = D("45000") - D("1500") * D(".074") - D("5000") * D(".00878") * D(".43736")
line275 = net - worker
living_alone = (D("2128") - (line275 - D("42090")) * D(".1875")) * D(".14")
assert D(str(merge["expectedWorkerDeduction"])) == worker
assert D(str(merge["expectedProvincialNet"])) == line275
assert D(str(merge["expectedLivingAloneCredit"])) == living_alone
print(f"Verified 4 review/merge goldens; Quebec marginal = {marginal * 100}%")

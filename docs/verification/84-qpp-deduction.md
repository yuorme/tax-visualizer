# Province-aware enhanced pension deduction (#84)

The net-income deduction now uses the same province-selected pension plan as payroll. Previously payroll charged
QPP in Quebec while federal income, Quebec income, benefit income and the display ledger deducted CPP.
Childcare claimant selection had the same assumption and now receives the province from the household calculation.

## Rule and scope

[CRA line 22215](https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-22215-deduction-for-cpp-or-qpp-enhanced-contributions-on-employment-income.html)
deducts the employee's enhanced contributions under the applicable CPP or QPP schedule. This change selects the
plan already charged; it adds no tax rule, parameter, program identifier or cross-province employment model.

[Revenu Québec line 248](https://www.revenuquebec.ca/en/citizens/income-tax-return/completing-your-income-tax-return/how-to-complete-your-income-tax-return/line-by-line-help/201-to-260-net-income/line-248/point-1/)
likewise directs employment contributors to calculate the applicable QPP/CPP deduction for provincial net income.

Every loaded year, 2019–2026, currently has matching CPP/QPP exemption, first and second ceilings, and enhanced
rates. Their base rates differ, but base contributions remain credits rather than this deduction. Consequently,
no existing golden input, expected value, assertion or tolerance needs changing.

## Independent golden calculations

`tests/golden/features/qpp-deduction.json` supplies synthetic QPP parameters to make the defect observable:
exemption 5,000; first ceiling 40,000; second ceiling 50,000; enhanced rates 2% and 6%. CPP retains the published
2026 parameters. These specimens are deliberately not actual-year tax returns. Expected values were calculated
arithmetically before running the engine; the fixture has no capture/update command.

| Quebec employment | First tier | Second tier | Deduction | Net income |
| ---: | ---: | ---: | ---: | ---: |
| 4,999 | 0 | 0 | 0 | 4,999 |
| 5,000 | 0 | 0 | 0 | 5,000 |
| 5,001 | 1 × 2% | 0 | 0.02 | 5,000.98 |
| 40,000 | 35,000 × 2% | 0 | 700 | 39,300 |
| 45,000 | 35,000 × 2% | 5,000 × 6% | 1,000 | 44,000 |
| 50,000 | 35,000 × 2% | 10,000 × 6% | 1,300 | 48,700 |
| 70,000 | 35,000 × 2% | 10,000 × 6% | 1,300 | 68,700 |

For the Ontario control at 50,000, CPP is `(50,000 − 3,500) × 1% = 465`, leaving 49,535.

For a single Quebec parent at 45,000, the province's existing worker deduction is 1,450, so provincial taxable
income is 42,550. With one child under six, the existing 2026 CCB data gives
`8,157 − (44,000 − 38,237) × 7% = 7,753.59`. Quebec family allowance remains at `3,068 + 1,077 = 4,145`,
because 44,000 is below its 44,032 single-parent threshold. This checks both benefit income bases.

The childcare couple has 45,000 employment income for adult 0 and 44,500 other income for adult 1. Correct QPP
deductions leave net incomes 44,000 and 44,500; adult 0 claims 8,000 eligible childcare expenses. The wrong CPP
deduction leaves adult 0 at 44,585 and picks adult 1, who has no eligible earnings and therefore cannot deduct
those expenses. The correct federal incomes are 36,000 and 44,500, totaling 80,500. Quebec does not deduct the
federal childcare claim: provincial taxable incomes after the worker deduction are 42,550 and 44,500.
CCB is `8,157 − (80,500 − 38,237) × 7% = 5,198.59`. Quebec family allowance uses family income before the
worker deduction: `3,068 − (88,500 − 60,398) × 4% = 1,943.92`. Quebec-eligible childcare expenses are explicitly
zero to isolate the federal claimant rule.

The separate unit case changes only the enhanced QPP rates to 2% and 6%, retaining the published 2026 ceilings.
At 80,000 employment income it deducts `71,100 × 2% + 5,400 × 6% = 1,746` for QPP; CPP still deducts 927.
Adding 1,000 other income, 2,000 ordinary deductions and 1,000 childcare deductions gives QPP net income 76,254
and CPP net income 77,073. A larger ordinary deduction checks the zero floor.

## Coverage and reproduction

The golden cases cover the exemption, both contribution ceilings, the non-Quebec path, personal federal and
provincial income, the displayed enhanced deduction, household benefit income, income before childcare and the
province-sensitive childcare claimant. The unit case exercises the exported income helpers directly.

Before the fix, `fnm exec --using=26 node --import tsx --test tests/qpp-deduction.test.ts` failed eight golden
cases: the 45,000 case deducted 415 instead of 1,000, and the childcare case selected adult 1 instead of adult 0.
After the fix, all cases pass with the original independently calculated expectations.

`netOf` and `netIncomeParts` require an explicit province (or explicit `null` to select CPP). `childcareOf` keeps
its existing callers compatible: an omitted province selects CPP, while the household supplies its province.
UI callers that only derive age counts do not use a pension-plan-sensitive result.

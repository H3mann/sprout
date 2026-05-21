import { useCallback, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid2';
import InputAdornment from '@mui/material/InputAdornment';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import RefreshIcon from '@mui/icons-material/Refresh';

import type { DealAnalysisInput, DealMetrics } from '../../services/api';
import type { PropertyFinancialsInput } from './PropertyFinancialsTab';

export interface ProjectionAssumptions {
  incomeGrowthPct: number;
  expenseGrowthPct: number;
  appreciationPct: number;
  taxRate: number;
  propertyMgmtPct: number;
  maintenancePct: number;
  capexAnnual: number;
  sellingCostsPct: number;
}

export const DEFAULT_ASSUMPTIONS: ProjectionAssumptions = {
  incomeGrowthPct: 3,
  expenseGrowthPct: 2,
  appreciationPct: 3.5,
  taxRate: 25,
  propertyMgmtPct: 0,
  maintenancePct: 1,
  capexAnnual: 0,
  sellingCostsPct: 6,
};

interface YearProjection {
  year: number;
  grossRent: number;
  vacancy: number;
  operatingIncome: number;
  propertyTaxes: number;
  insurance: number;
  propertyManagement: number;
  maintenance: number;
  capex: number;
  hoaFees: number;
  otherExpenses: number;
  totalOperatingExpenses: number;
  noi: number;
  loanPayments: number;
  cashFlow: number;
  postTaxCashFlow: number;
  operatingExpensesDeduction: number;
  loanInterest: number;
  depreciation: number;
  totalDeductions: number;
  propertyValue: number;
  loanBalance: number;
  ltvRatio: number;
  totalEquity: number;
  sellingCosts: number;
  saleProceeds: number;
  cumulativeCashFlow: number;
  totalCashInvested: number;
  totalProfit: number;
  capRatePurchase: number;
  capRateMarket: number;
  cashOnCash: number;
  returnOnEquity: number;
  roi: number;
  irr: number;
  rentToValue: number;
  grm: number;
  equityMultiple: number;
  breakEvenRatio: number;
  debtCoverageRatio: number;
  debtYield: number;
  expenseRatio: number;
}

interface Props {
  input: DealAnalysisInput;
  metrics: DealMetrics;
  financialsInput: PropertyFinancialsInput;
  assumptions: ProjectionAssumptions;
  onAssumptionsChange: (update: ProjectionAssumptions) => void;
}

const PROJECTION_YEARS = [1, 2, 3, 5, 10, 20];

const fmt = (v: number) => `$${Math.round(v).toLocaleString()}`;
const fmtPct = (v: number) => `${v.toFixed(2)}%`;
const fmtX = (v: number) => `${v.toFixed(2)}x`;

function computeAmortizationSchedule(
  loanAmount: number,
  annualRate: number,
  monthlyPayment: number,
  maxYears: number,
): { balanceAtYear: number[]; interestByYear: number[] } {
  const monthlyRate = annualRate / 100 / 12;
  let balance = loanAmount;
  const balanceAtYear: number[] = [];
  const interestByYear: number[] = [];

  for (let year = 1; year <= maxYears; year++) {
    let yearInterest = 0;
    for (let m = 0; m < 12; m++) {
      const interest = balance * monthlyRate;
      yearInterest += interest;
      const principal = monthlyPayment - interest;
      balance = Math.max(0, balance - principal);
    }
    balanceAtYear.push(balance);
    interestByYear.push(yearInterest);
  }
  return { balanceAtYear, interestByYear };
}

function computeIRR(cashFlows: number[]): number {
  let rate = 0.1;
  for (let i = 0; i < 100; i++) {
    let npv = 0;
    let dnpv = 0;
    for (let t = 0; t < cashFlows.length; t++) {
      const factor = Math.pow(1 + rate, t);
      npv += cashFlows[t] / factor;
      if (t > 0) dnpv -= (t * cashFlows[t]) / (factor * (1 + rate));
    }
    if (Math.abs(npv) < 0.01) break;
    if (dnpv === 0) break;
    rate -= npv / dnpv;
    if (rate < -0.99) { rate = -0.99; break; }
    if (rate > 10) { rate = 10; break; }
  }
  return rate * 100;
}

function computeProjections(
  input: DealAnalysisInput,
  metrics: DealMetrics,
  financialsInput: PropertyFinancialsInput,
  assumptions: ProjectionAssumptions,
): YearProjection[] {
  const purchasePrice = input.purchase_price;
  const downPayment = purchasePrice * (input.down_payment_pct / 100);
  const loanAmount = purchasePrice - downPayment;
  const closingCosts = purchasePrice * (financialsInput.purchaseCostsPct / 100);
  const totalCashInvested = downPayment + closingCosts + financialsInput.rehabCosts;
  const annualLoanPayments = metrics.monthlyMortgage * 12;
  const depreciation = (purchasePrice * 0.85) / 27.5;

  const maxYear = PROJECTION_YEARS[PROJECTION_YEARS.length - 1];
  const { balanceAtYear, interestByYear } = computeAmortizationSchedule(
    loanAmount, input.interest_rate, metrics.monthlyMortgage, maxYear,
  );

  const ig = assumptions.incomeGrowthPct / 100;
  const eg = assumptions.expenseGrowthPct / 100;
  const ap = assumptions.appreciationPct / 100;

  let cumulativeCF = 0;
  const allYearCashFlows: number[] = [];

  const fullProjections: (YearProjection | null)[] = [];
  for (let n = 1; n <= maxYear; n++) {
    const growthI = Math.pow(1 + ig, n - 1);
    const growthE = Math.pow(1 + eg, n - 1);

    const grossRent = input.expected_monthly_rent * 12 * growthI;
    const vacancy = grossRent * (input.vacancy_rate_pct / 100);
    const operatingIncome = grossRent - vacancy;

    const propertyValue = purchasePrice * Math.pow(1 + ap, n);

    const propertyTaxes = input.property_taxes_annual * growthE;
    const insurance = input.insurance_annual * growthE;
    const hoaFees = input.hoa_monthly * 12 * growthE;
    const propertyManagement = grossRent * (assumptions.propertyMgmtPct / 100);
    const maintenance = propertyValue * (assumptions.maintenancePct / 100);
    const capex = assumptions.capexAnnual * growthE;
    const otherExpenses = input.monthly_expenses * 12 * growthE;
    const totalOperatingExpenses = propertyTaxes + insurance + hoaFees +
      propertyManagement + maintenance + capex + otherExpenses;

    const noi = operatingIncome - totalOperatingExpenses;
    const cashFlow = noi - annualLoanPayments;

    const loanInterest = interestByYear[n - 1] || 0;
    const totalDeductions = totalOperatingExpenses + loanInterest + depreciation;
    const taxableIncome = Math.max(0, cashFlow + (annualLoanPayments - loanInterest) - depreciation);
    const postTaxCashFlow = cashFlow - (taxableIncome * (assumptions.taxRate / 100));

    cumulativeCF += cashFlow;
    allYearCashFlows.push(cashFlow);

    const loanBal = balanceAtYear[n - 1] || 0;
    const totalEquity = propertyValue - loanBal;
    const sellingCosts = propertyValue * (assumptions.sellingCostsPct / 100);
    const saleProceeds = propertyValue - loanBal - sellingCosts;
    const totalProfit = saleProceeds + cumulativeCF - totalCashInvested;

    const irrFlows = [-totalCashInvested, ...allYearCashFlows.slice(0, -1), allYearCashFlows[allYearCashFlows.length - 1] + saleProceeds];
    const irr = computeIRR(irrFlows);

    const expenseRatio = operatingIncome > 0 ? (totalOperatingExpenses / operatingIncome) * 100 : 0;

    const projection: YearProjection = {
      year: n,
      grossRent,
      vacancy,
      operatingIncome,
      propertyTaxes,
      insurance,
      propertyManagement,
      maintenance,
      capex,
      hoaFees,
      otherExpenses,
      totalOperatingExpenses,
      noi,
      loanPayments: annualLoanPayments,
      cashFlow,
      postTaxCashFlow,
      operatingExpensesDeduction: totalOperatingExpenses,
      loanInterest,
      depreciation,
      totalDeductions,
      propertyValue,
      loanBalance: loanBal,
      ltvRatio: propertyValue > 0 ? (loanBal / propertyValue) * 100 : 0,
      totalEquity,
      sellingCosts,
      saleProceeds,
      cumulativeCashFlow: cumulativeCF,
      totalCashInvested,
      totalProfit,
      capRatePurchase: purchasePrice > 0 ? (noi / purchasePrice) * 100 : 0,
      capRateMarket: propertyValue > 0 ? (noi / propertyValue) * 100 : 0,
      cashOnCash: totalCashInvested > 0 ? (cashFlow / totalCashInvested) * 100 : 0,
      returnOnEquity: totalEquity > 0 ? (cashFlow / totalEquity) * 100 : 0,
      roi: totalCashInvested > 0 ? (totalProfit / totalCashInvested) * 100 : 0,
      irr,
      rentToValue: propertyValue > 0 ? ((grossRent / 12) / propertyValue) * 100 : 0,
      grm: grossRent > 0 ? propertyValue / grossRent : 0,
      equityMultiple: totalCashInvested > 0 ? (totalCashInvested + totalProfit) / totalCashInvested : 0,
      breakEvenRatio: grossRent > 0 ? ((totalOperatingExpenses + annualLoanPayments) / grossRent) * 100 : 0,
      debtCoverageRatio: annualLoanPayments > 0 ? noi / annualLoanPayments : 0,
      debtYield: loanBal > 0 ? (noi / loanBal) * 100 : 0,
      expenseRatio,
    };

    fullProjections.push(projection);
  }

  return PROJECTION_YEARS.map((y) => fullProjections[y - 1]!);
}

type RowDef =
  | { type: 'header'; label: string }
  | { type: 'currency'; label: string; key: keyof YearProjection; color?: (v: number) => string }
  | { type: 'percent'; label: string; key: keyof YearProjection; color?: (v: number) => string }
  | { type: 'ratio'; label: string; key: keyof YearProjection; color?: (v: number) => string }
  | { type: 'multiple'; label: string; key: keyof YearProjection; color?: (v: number) => string };

const signColor = (v: number) => (v >= 0 ? '#2E7D32' : '#C62828');

const TABLE_ROWS: RowDef[] = [
  { type: 'header', label: 'Rental Income' },
  { type: 'currency', label: 'Gross Rent', key: 'grossRent' },
  { type: 'currency', label: 'Vacancy', key: 'vacancy' },
  { type: 'currency', label: 'Operating Income', key: 'operatingIncome' },

  { type: 'header', label: 'Operating Expenses' },
  { type: 'currency', label: 'Property Taxes', key: 'propertyTaxes' },
  { type: 'currency', label: 'Insurance', key: 'insurance' },
  { type: 'currency', label: 'Property Management', key: 'propertyManagement' },
  { type: 'currency', label: 'Maintenance', key: 'maintenance' },
  { type: 'currency', label: 'Capital Expenditures', key: 'capex' },
  { type: 'currency', label: 'HOA Fees', key: 'hoaFees' },
  { type: 'currency', label: 'Other Expenses', key: 'otherExpenses' },
  { type: 'currency', label: 'Total Operating Expenses', key: 'totalOperatingExpenses' },

  { type: 'header', label: 'Cash Flow' },
  { type: 'currency', label: 'Operating Income', key: 'operatingIncome' },
  { type: 'currency', label: 'Operating Expenses', key: 'totalOperatingExpenses' },
  { type: 'percent', label: 'Expense Ratio', key: 'expenseRatio' },
  { type: 'currency', label: 'Net Operating Income', key: 'noi', color: signColor },
  { type: 'currency', label: 'Loan Payments', key: 'loanPayments' },
  { type: 'currency', label: 'Cash Flow', key: 'cashFlow', color: signColor },
  { type: 'currency', label: 'Post-Tax Cash Flow', key: 'postTaxCashFlow', color: signColor },

  { type: 'header', label: 'Tax Benefits & Deductions' },
  { type: 'currency', label: 'Operating Expenses', key: 'operatingExpensesDeduction' },
  { type: 'currency', label: 'Loan Interest', key: 'loanInterest' },
  { type: 'currency', label: 'Depreciation', key: 'depreciation' },
  { type: 'currency', label: 'Total Deductions', key: 'totalDeductions' },

  { type: 'header', label: 'Equity Accumulation' },
  { type: 'currency', label: 'Property Value', key: 'propertyValue' },
  { type: 'currency', label: 'Loan Balance', key: 'loanBalance' },
  { type: 'percent', label: 'LTV Ratio', key: 'ltvRatio' },
  { type: 'currency', label: 'Total Equity', key: 'totalEquity' },

  { type: 'header', label: 'Sale Analysis' },
  { type: 'currency', label: 'Equity', key: 'totalEquity' },
  { type: 'currency', label: 'Selling Costs', key: 'sellingCosts' },
  { type: 'currency', label: 'Sale Proceeds', key: 'saleProceeds' },
  { type: 'currency', label: 'Cumulative Cash Flow', key: 'cumulativeCashFlow', color: signColor },
  { type: 'currency', label: 'Total Cash Invested', key: 'totalCashInvested' },
  { type: 'currency', label: 'Total Profit', key: 'totalProfit', color: signColor },

  { type: 'header', label: 'Investment Returns' },
  { type: 'percent', label: 'Cap Rate (Purchase Price)', key: 'capRatePurchase' },
  { type: 'percent', label: 'Cap Rate (Market Value)', key: 'capRateMarket' },
  { type: 'percent', label: 'Cash on Cash Return', key: 'cashOnCash', color: signColor },
  { type: 'percent', label: 'Return on Equity', key: 'returnOnEquity', color: signColor },
  { type: 'percent', label: 'Return on Investment', key: 'roi', color: signColor },
  { type: 'percent', label: 'Internal Rate of Return', key: 'irr', color: signColor },

  { type: 'header', label: 'Financial Ratios' },
  { type: 'percent', label: 'Rent to Value', key: 'rentToValue' },
  { type: 'ratio', label: 'Gross Rent Multiplier', key: 'grm' },
  { type: 'multiple', label: 'Equity Multiple', key: 'equityMultiple' },
  { type: 'percent', label: 'Break Even Ratio', key: 'breakEvenRatio' },
  { type: 'ratio', label: 'Debt Coverage Ratio', key: 'debtCoverageRatio' },
  { type: 'percent', label: 'Debt Yield', key: 'debtYield' },
];

function formatCell(row: RowDef, value: number): string {
  if (row.type === 'header') return '';
  if (row.type === 'currency') return fmt(value);
  if (row.type === 'percent') return fmtPct(value);
  if (row.type === 'multiple') return fmtX(value);
  return value.toFixed(2);
}

export function ProjectionsTab({ input, metrics, financialsInput, assumptions, onAssumptionsChange }: Props) {
  const [draft, setDraft] = useState<ProjectionAssumptions>(assumptions);
  const isDirty = JSON.stringify(draft) !== JSON.stringify(assumptions);

  const updateDraft = (field: keyof ProjectionAssumptions, value: number) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleRecalculate = useCallback(() => {
    onAssumptionsChange(draft);
  }, [draft, onAssumptionsChange]);

  const projections = useMemo(
    () => computeProjections(input, metrics, financialsInput, assumptions),
    [input, metrics, financialsInput, assumptions],
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 2 }}>Assumptions</Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                fullWidth label="Income Growth" type="number" size="small"
                value={draft.incomeGrowthPct}
                onChange={(e) => updateDraft('incomeGrowthPct', Number(e.target.value))}
                slotProps={{ input: { endAdornment: <InputAdornment position="end">%</InputAdornment> } }}
                inputProps={{ step: 0.5 }}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                fullWidth label="Expense Growth" type="number" size="small"
                value={draft.expenseGrowthPct}
                onChange={(e) => updateDraft('expenseGrowthPct', Number(e.target.value))}
                slotProps={{ input: { endAdornment: <InputAdornment position="end">%</InputAdornment> } }}
                inputProps={{ step: 0.5 }}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                fullWidth label="Appreciation" type="number" size="small"
                value={draft.appreciationPct}
                onChange={(e) => updateDraft('appreciationPct', Number(e.target.value))}
                slotProps={{ input: { endAdornment: <InputAdornment position="end">%</InputAdornment> } }}
                inputProps={{ step: 0.5 }}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                fullWidth label="Tax Rate" type="number" size="small"
                value={draft.taxRate}
                onChange={(e) => updateDraft('taxRate', Number(e.target.value))}
                slotProps={{ input: { endAdornment: <InputAdornment position="end">%</InputAdornment> } }}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                fullWidth label="Property Mgmt" type="number" size="small"
                value={draft.propertyMgmtPct}
                onChange={(e) => updateDraft('propertyMgmtPct', Number(e.target.value))}
                slotProps={{ input: { endAdornment: <InputAdornment position="end">%</InputAdornment> } }}
                helperText="% of gross rent"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                fullWidth label="Maintenance" type="number" size="small"
                value={draft.maintenancePct}
                onChange={(e) => updateDraft('maintenancePct', Number(e.target.value))}
                slotProps={{ input: { endAdornment: <InputAdornment position="end">%</InputAdornment> } }}
                helperText="% of property value"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                fullWidth label="Annual CapEx" type="number" size="small"
                value={draft.capexAnnual}
                onChange={(e) => updateDraft('capexAnnual', Number(e.target.value))}
                slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                fullWidth label="Selling Costs" type="number" size="small"
                value={draft.sellingCostsPct}
                onChange={(e) => updateDraft('sellingCostsPct', Number(e.target.value))}
                slotProps={{ input: { endAdornment: <InputAdornment position="end">%</InputAdornment> } }}
              />
            </Grid>
          </Grid>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={handleRecalculate}
            disabled={!isDirty}
            sx={{ mt: 2 }}
            fullWidth
          >
            {isDirty ? 'Recalculate Projections' : 'Projections Up to Date'}
          </Button>
        </CardContent>
      </Card>

      <TableContainer component={Card} sx={{ overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  fontWeight: 700,
                  position: 'sticky',
                  left: 0,
                  bgcolor: 'background.paper',
                  zIndex: 2,
                  minWidth: 200,
                }}
              >
                Metric
              </TableCell>
              {PROJECTION_YEARS.map((y) => (
                <TableCell key={y} align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                  Year {y}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {TABLE_ROWS.map((row, idx) => {
              if (row.type === 'header') {
                return (
                  <TableRow key={idx}>
                    <TableCell
                      colSpan={PROJECTION_YEARS.length + 1}
                      sx={{
                        fontWeight: 700,
                        bgcolor: 'action.hover',
                        fontSize: '0.875rem',
                        py: 1,
                        position: 'sticky',
                        left: 0,
                      }}
                    >
                      {row.label}
                    </TableCell>
                  </TableRow>
                );
              }

              return (
                <TableRow key={idx} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                  <TableCell
                    sx={{
                      position: 'sticky',
                      left: 0,
                      bgcolor: 'background.paper',
                      zIndex: 1,
                      fontSize: '0.8125rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {row.label}
                  </TableCell>
                  {projections.map((p, i) => {
                    const value = p[row.key] as number;
                    const color = row.color ? row.color(value) : undefined;
                    return (
                      <TableCell
                        key={i}
                        align="right"
                        sx={{
                          fontSize: '0.8125rem',
                          whiteSpace: 'nowrap',
                          color,
                          fontWeight: row.label.startsWith('Total') || row.key === 'cashFlow' || row.key === 'noi' ? 600 : 400,
                        }}
                      >
                        {formatCell(row, value)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

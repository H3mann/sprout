import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid2';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import type { DealAnalysisInput, DealMetrics } from '../../services/api';

export interface PropertyFinancialsInput {
  sqft: number;
  arvEstimate: number;
  rehabCosts: number;
  purchaseCostsPct: number;
  holdingPeriodYears: number;
}

interface Props {
  input: DealAnalysisInput;
  metrics: DealMetrics;
  financialsInput: PropertyFinancialsInput;
  onFinancialsChange: (update: PropertyFinancialsInput) => void;
}

const fmt = (val: number) => `$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const fmtPct = (val: number) => `${val.toFixed(2)}%`;

function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Grid size={{ xs: 6 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="h6" sx={{ color: color || 'text.primary' }}>{value}</Typography>
    </Grid>
  );
}

export function PropertyFinancialsTab({ input, metrics, financialsInput, onFinancialsChange }: Props) {
  const update = (field: keyof PropertyFinancialsInput, value: number) => {
    onFinancialsChange({ ...financialsInput, [field]: value });
  };

  const computed = useMemo(() => {
    const purchasePrice = input.purchase_price;
    const downPayment = purchasePrice * (input.down_payment_pct / 100);
    const loanAmount = purchasePrice - downPayment;
    const purchaseCosts = purchasePrice * (financialsInput.purchaseCostsPct / 100);
    const { sqft, arvEstimate, rehabCosts, holdingPeriodYears } = financialsInput;

    const pricePerSqft = sqft > 0 ? purchasePrice / sqft : null;
    const arvPerSqft = sqft > 0 && arvEstimate > 0 ? arvEstimate / sqft : null;
    const rehabPerSqft = sqft > 0 && rehabCosts > 0 ? rehabCosts / sqft : null;

    const rentToValue = purchasePrice > 0
      ? (input.expected_monthly_rent / purchasePrice) * 100
      : 0;

    const annualDebtService = metrics.monthlyMortgage * 12;
    const grossAnnualIncome = input.expected_monthly_rent * 12;
    const annualOperatingExpenses =
      input.property_taxes_annual +
      input.insurance_annual +
      (input.hoa_monthly * 12) +
      (input.monthly_expenses * 12);
    const breakEvenRatio = grossAnnualIncome > 0
      ? ((annualOperatingExpenses + annualDebtService) / grossAnnualIncome) * 100
      : 0;

    const totalCashInvested = downPayment + purchaseCosts + rehabCosts;
    const totalCashFlow = metrics.annualCashFlow * holdingPeriodYears;
    const appreciationKey = holdingPeriodYears <= 5 ? 'year5'
      : holdingPeriodYears <= 10 ? 'year10' : 'year30';
    const futureEquity = metrics.appreciation[appreciationKey].equity;
    const equityGain = futureEquity - downPayment;
    const totalReturn = totalCashFlow + equityGain;
    const equityMultiple = totalCashInvested > 0
      ? (totalCashInvested + totalReturn) / totalCashInvested
      : 0;

    const debtYield = loanAmount > 0 ? (metrics.noi / loanAmount) * 100 : 0;

    return {
      loanAmount,
      purchaseCosts,
      pricePerSqft,
      arvPerSqft,
      rehabPerSqft,
      rentToValue,
      breakEvenRatio,
      equityMultiple,
      debtYield,
    };
  }, [input, metrics, financialsInput]);

  const breakEvenColor = computed.breakEvenRatio >= 100
    ? 'error.main'
    : computed.breakEvenRatio >= 85
      ? 'warning.main'
      : 'success.main';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Section 1: Purchase */}
      <Card>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 2 }}>Purchase</Typography>
          <Grid container spacing={2}>
            <StatRow label="Purchase Price" value={fmt(input.purchase_price)} />
            <StatRow label="Finance Amount" value={fmt(computed.loanAmount)} />
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth label="Purchase Costs" type="number" size="small"
                value={financialsInput.purchaseCostsPct}
                onChange={(e) => update('purchaseCostsPct', Number(e.target.value))}
                slotProps={{ input: { endAdornment: <InputAdornment position="end">%</InputAdornment> } }}
                helperText={fmt(computed.purchaseCosts)}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth label="Rehab Costs" type="number" size="small"
                value={financialsInput.rehabCosts}
                onChange={(e) => update('rehabCosts', Number(e.target.value))}
                slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }}
                helperText="Potential improvements"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Section 2: Value */}
      <Card>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 2 }}>Value</Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth label="Square Footage" type="number" size="small"
                value={financialsInput.sqft}
                onChange={(e) => update('sqft', Number(e.target.value))}
                slotProps={{ input: { endAdornment: <InputAdornment position="end">sqft</InputAdornment> } }}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth label="ARV Estimate" type="number" size="small"
                value={financialsInput.arvEstimate}
                onChange={(e) => update('arvEstimate', Number(e.target.value))}
                slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }}
              />
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <StatRow
              label="Price / sqft"
              value={computed.pricePerSqft != null ? fmt(computed.pricePerSqft) : '—'}
            />
            <StatRow
              label="ARV / sqft"
              value={computed.arvPerSqft != null ? fmt(computed.arvPerSqft) : '—'}
            />
            <StatRow
              label="Rehab / sqft"
              value={computed.rehabPerSqft != null ? fmt(computed.rehabPerSqft) : '—'}
            />
          </Grid>
        </CardContent>
      </Card>

      {/* Section 3: Ratios */}
      <Card>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 2 }}>Ratios</Typography>
          <Grid container spacing={2}>
            <StatRow
              label="Rent to Value"
              value={input.expected_monthly_rent > 0 ? fmtPct(computed.rentToValue) : '—'}
            />
            <StatRow
              label="Break Even Ratio"
              value={fmtPct(computed.breakEvenRatio)}
              color={breakEvenColor}
            />
            <StatRow
              label="Gross Rent Multiplier"
              value={metrics.grossRentMultiplier.toFixed(1)}
            />
            <Grid size={{ xs: 6 }}>
              <Typography variant="body2" color="text.secondary">
                Equity Multiple
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6">{computed.equityMultiple.toFixed(2)}x</Typography>
                <Select
                  size="small"
                  value={financialsInput.holdingPeriodYears}
                  onChange={(e) => update('holdingPeriodYears', Number(e.target.value))}
                  sx={{ minWidth: 80, height: 28, fontSize: '0.75rem' }}
                >
                  <MenuItem value={5}>5 yr</MenuItem>
                  <MenuItem value={10}>10 yr</MenuItem>
                  <MenuItem value={30}>30 yr</MenuItem>
                </Select>
              </Box>
            </Grid>
            <StatRow
              label="Debt Yield"
              value={fmtPct(computed.debtYield)}
            />
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}

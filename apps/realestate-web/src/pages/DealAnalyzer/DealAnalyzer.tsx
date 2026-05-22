import { useCallback, useEffect, useState } from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid2';
import InputAdornment from '@mui/material/InputAdornment';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalculateIcon from '@mui/icons-material/Calculate';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import LaunchIcon from '@mui/icons-material/Launch';
import SaveIcon from '@mui/icons-material/Save';
import TimelineIcon from '@mui/icons-material/Timeline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useLocation, useNavigate } from 'react-router-dom';
import { FunLoader } from '../../components/FunLoader';

import { aiApi, dealApi, type DealAnalysisInput, type DealMetrics, type PropertySuggestion } from '../../services/api';
import { PropertyFinancialsTab, type PropertyFinancialsInput } from './PropertyFinancialsTab';
import { ProjectionsTab, type ProjectionAssumptions, DEFAULT_ASSUMPTIONS } from './ProjectionsTab';

interface PropertyMeta {
  image_url?: string;
  zillow_url?: string;
  realtor_url?: string;
  latitude?: number;
  longitude?: number;
}

interface GeoCoords {
  lat: number;
  lon: number;
}

interface RouteState extends DealAnalysisInput, PropertyMeta {
  allSuggestions?: PropertySuggestion[];
  sqft?: number;
  estimated_rehab_cost?: number;
}

const ScoreGauge = styled(Box)<{ score: number }>(({ score }) => {
  const color = score >= 70 ? '#2E7D32' : score >= 40 ? '#F9A825' : '#C62828';
  return {
    width: 120,
    height: 120,
    borderRadius: '50%',
    border: `8px solid ${color}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
  };
});

const formatCurrency = (val: number) => {
  if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (Math.abs(val) >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  return `$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

const defaultInput: DealAnalysisInput = {
  property_address: '',
  purchase_price: 300000,
  down_payment_pct: 20,
  interest_rate: 7.0,
  loan_term_years: 30,
  expected_monthly_rent: 2000,
  monthly_expenses: 200,
  property_taxes_annual: 3600,
  insurance_annual: 1800,
  hoa_monthly: 0,
  vacancy_rate_pct: 5,
};

const extractInput = (s: PropertySuggestion): DealAnalysisInput => ({
  property_address: s.property_address,
  purchase_price: s.purchase_price,
  down_payment_pct: s.down_payment_pct,
  interest_rate: s.interest_rate,
  loan_term_years: s.loan_term_years,
  expected_monthly_rent: s.expected_monthly_rent,
  monthly_expenses: s.monthly_expenses,
  property_taxes_annual: s.property_taxes_annual,
  insurance_annual: s.insurance_annual,
  hoa_monthly: s.hoa_monthly,
  vacancy_rate_pct: s.vacancy_rate_pct,
});

export const DealAnalyzer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const routeState = location.state as RouteState | null;

  const [input, setInput] = useState<DealAnalysisInput>(routeState ? {
    property_address: routeState.property_address,
    purchase_price: routeState.purchase_price,
    down_payment_pct: routeState.down_payment_pct,
    interest_rate: routeState.interest_rate,
    loan_term_years: routeState.loan_term_years,
    expected_monthly_rent: routeState.expected_monthly_rent,
    monthly_expenses: routeState.monthly_expenses,
    property_taxes_annual: routeState.property_taxes_annual,
    insurance_annual: routeState.insurance_annual,
    hoa_monthly: routeState.hoa_monthly,
    vacancy_rate_pct: routeState.vacancy_rate_pct,
  } : defaultInput);
  const [propertyMeta, setPropertyMeta] = useState<PropertyMeta>({
    image_url: routeState?.image_url || '',
    zillow_url: routeState?.zillow_url || '',
    realtor_url: routeState?.realtor_url || '',
    latitude: routeState?.latitude || 0,
    longitude: routeState?.longitude || 0,
  });
  const [imgFailed, setImgFailed] = useState(false);
  const [allSuggestions] = useState<PropertySuggestion[]>(routeState?.allSuggestions || []);
  const [coords, setCoords] = useState<GeoCoords | null>(
    routeState?.latitude && routeState?.longitude
      ? { lat: routeState.latitude, lon: routeState.longitude }
      : null,
  );
  const [metrics, setMetrics] = useState<DealMetrics | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [thesis, setThesis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingThesis, setLoadingThesis] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resultsTab, setResultsTab] = useState(0);
  const [financialsInput, setFinancialsInput] = useState<PropertyFinancialsInput>({
    sqft: routeState?.sqft || 0,
    arvEstimate: routeState
      ? (routeState.purchase_price + (routeState.estimated_rehab_cost || 0))
      : 0,
    rehabCosts: routeState?.estimated_rehab_cost || 0,
    purchaseCostsPct: 3,
    holdingPeriodYears: 5,
  });
  const [projectionAssumptions, setProjectionAssumptions] = useState<ProjectionAssumptions>(DEFAULT_ASSUMPTIONS);

  useEffect(() => {
    if (!input.property_address.trim()) return;
    if (coords) return;
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(input.property_address)}&format=json&limit=1`, {
      headers: { 'User-Agent': 'RealmApp/1.0' },
    })
      .then((r) => r.json())
      .then((data: { lat: string; lon: string }[]) => {
        if (data.length > 0) setCoords({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) });
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input.property_address]);

  const handleSelectSuggestion = (s: PropertySuggestion) => {
    setInput(extractInput(s));
    setPropertyMeta({
      image_url: s.image_url || '',
      zillow_url: s.zillow_url || '',
      realtor_url: s.realtor_url || '',
      latitude: s.latitude || 0,
      longitude: s.longitude || 0,
    });
    setImgFailed(false);
    setCoords(
      s.latitude && s.longitude
        ? { lat: s.latitude, lon: s.longitude }
        : null,
    );
    setMetrics(null);
    setAiSummary(null);
    setThesis(null);
    setSuccessMsg(null);
    setError(null);
    setResultsTab(0);
    setFinancialsInput({
      sqft: s.sqft || 0,
      arvEstimate: s.sqft ? (s.purchase_price + (s.estimated_rehab_cost || 0)) : 0,
      rehabCosts: s.estimated_rehab_cost || 0,
      purchaseCostsPct: 3,
      holdingPeriodYears: 5,
    });
    setProjectionAssumptions(DEFAULT_ASSUMPTIONS);
  };

  const otherSuggestions = allSuggestions.filter(
    (s) => s.property_address !== input.property_address,
  );

  const updateField = (field: keyof DealAnalysisInput, value: string | number) => {
    setInput((prev) => ({ ...prev, [field]: value }));
  };

  const handleAnalyze = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.property_address.trim()) {
      setError('Property address is required');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const result = await dealApi.analyze(input);
      setMetrics(result.metrics);
      setAiSummary(result.aiSummary);
      setThesis(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }, [input]);

  const handleGenerateThesis = useCallback(async () => {
    if (!metrics) return;
    setLoadingThesis(true);
    setError(null);

    try {
      const result = await aiApi.thesis(input.property_address, metrics, {
        purchasePrice: input.purchase_price,
        downPaymentPct: input.down_payment_pct,
        interestRate: input.interest_rate,
        loanTermYears: input.loan_term_years,
        expectedMonthlyRent: input.expected_monthly_rent,
        monthlyExpenses: input.monthly_expenses,
        propertyTaxesAnnual: input.property_taxes_annual,
        insuranceAnnual: input.insurance_annual,
        hoaMonthly: input.hoa_monthly,
        vacancyRatePct: input.vacancy_rate_pct,
      });
      setThesis(result.response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate thesis');
    } finally {
      setLoadingThesis(false);
    }
  }, [input, metrics]);

  const handleSave = useCallback(async () => {
    if (!metrics) return;
    setSaving(true);
    try {
      await dealApi.save({
        property_address: input.property_address,
        purchase_price: input.purchase_price,
        down_payment_pct: input.down_payment_pct,
        interest_rate: input.interest_rate,
        loan_term_years: input.loan_term_years,
        expected_monthly_rent: input.expected_monthly_rent,
        monthly_expenses: input.monthly_expenses,
        property_taxes_annual: input.property_taxes_annual,
        insurance_annual: input.insurance_annual,
        hoa_monthly: input.hoa_monthly,
        vacancy_rate_pct: input.vacancy_rate_pct,
        computed_metrics: metrics,
        location_zip: null,
        location_state: null,
        ai_summary: aiSummary,
        perplexity_property_data: null,
      });
      setSuccessMsg('Deal analysis saved!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [input, metrics, aiSummary]);

  const appreciationData = metrics ? [
    { year: 'Now', value: input.purchase_price, equity: input.purchase_price * (input.down_payment_pct / 100) },
    { year: 'Year 5', value: metrics.appreciation.year5.value, equity: metrics.appreciation.year5.equity },
    { year: 'Year 10', value: metrics.appreciation.year10.value, equity: metrics.appreciation.year10.equity },
    { year: 'Year 30', value: metrics.appreciation.year30.value, equity: metrics.appreciation.year30.equity },
  ] : [];

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Button
          variant="text"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ color: 'text.secondary' }}
        >
          Back to Discovery
        </Button>
        <Typography variant="h3">Deal Analyzer</Typography>
        {metrics && (
          <Tabs
            value={resultsTab}
            onChange={(_, v) => setResultsTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ ml: 'auto' }}
          >
            <Tab icon={<CalculateIcon />} iconPosition="start" label="Analysis" />
            <Tab icon={<AccountBalanceIcon />} iconPosition="start" label="Financials" />
            <Tab icon={<TimelineIcon />} iconPosition="start" label="Projections" />
          </Tabs>
        )}
      </Box>

      {otherSuggestions.length > 0 && (
        <Accordion sx={{ mb: 3 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HomeWorkIcon color="secondary" />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Other Properties ({otherSuggestions.length})
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            {otherSuggestions.map((s, i) => (
              <Box
                key={i}
                onClick={() => handleSelectSuggestion(s)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  px: 2,
                  py: 1.5,
                  cursor: 'pointer',
                  borderTop: i > 0 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  transition: 'background 0.1s',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                {s.image_url && (
                  <Box
                    component="img"
                    src={s.image_url}
                    alt={s.property_address}
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = 'none'; }}
                    sx={{ width: 80, height: 56, objectFit: 'cover', borderRadius: 1, flexShrink: 0 }}
                  />
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }} noWrap>
                    {s.property_address}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Typography variant="body2" color="primary" sx={{ fontWeight: 700 }}>
                      {formatCurrency(s.purchase_price)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {s.bedrooms}bd/{s.bathrooms}ba
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {s.sqft?.toLocaleString()} sqft
                    </Typography>
                    <Chip label={s.property_type} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                  </Box>
                </Box>
                <Typography variant="body2" color="success.main" sx={{ fontWeight: 600, flexShrink: 0 }}>
                  {formatCurrency(s.expected_monthly_rent)}/mo
                </Typography>
              </Box>
            ))}
          </AccordionDetails>
        </Accordion>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            {(() => {
              const imgSrc = propertyMeta.image_url && !imgFailed
                ? propertyMeta.image_url
                : propertyMeta.latitude && propertyMeta.longitude
                  ? `https://staticmap.openstreetmap.de/staticmap.php?center=${propertyMeta.latitude},${propertyMeta.longitude}&zoom=15&size=600x180&maptype=mapnik&markers=${propertyMeta.latitude},${propertyMeta.longitude},red-pushpin`
                  : null;
              return imgSrc ? (
                <Box
                  component="img"
                  src={imgSrc}
                  alt={input.property_address}
                  onError={() => setImgFailed(true)}
                  sx={{ width: '100%', height: 160, objectFit: 'cover' }}
                />
              ) : null;
            })()}
            <CardContent>
              <Typography variant="h5" sx={{ mb: 2 }}>Property Details</Typography>
              <Box component="form" onSubmit={handleAnalyze}>
                <TextField
                  fullWidth label="Property Address" value={input.property_address}
                  onChange={(e) => updateField('property_address', e.target.value)}
                  placeholder="123 Main St, Austin, TX 78701"
                  sx={{ mb: 2 }} size="small"
                />

                <Divider sx={{ my: 2 }} />
                <Typography variant="h5" sx={{ mb: 2 }}>Financials</Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <TextField
                      fullWidth label="Purchase Price" type="number" size="small"
                      value={input.purchase_price}
                      onChange={(e) => updateField('purchase_price', Number(e.target.value))}
                      slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <TextField
                      fullWidth label="Down Payment" type="number" size="small"
                      value={input.down_payment_pct}
                      onChange={(e) => updateField('down_payment_pct', Number(e.target.value))}
                      slotProps={{ input: { endAdornment: <InputAdornment position="end">%</InputAdornment> } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <TextField
                      fullWidth label="Interest Rate" type="number" size="small"
                      value={input.interest_rate}
                      onChange={(e) => updateField('interest_rate', Number(e.target.value))}
                      slotProps={{ input: { endAdornment: <InputAdornment position="end">%</InputAdornment> } }}
                      inputProps={{ step: 0.125 }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <TextField
                      fullWidth label="Loan Term" type="number" size="small"
                      value={input.loan_term_years}
                      onChange={(e) => updateField('loan_term_years', Number(e.target.value))}
                      slotProps={{ input: { endAdornment: <InputAdornment position="end">yrs</InputAdornment> } }}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />
                <Typography variant="h5" sx={{ mb: 2 }}>Income & Expenses</Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <TextField
                      fullWidth label="Monthly Rent" type="number" size="small"
                      value={input.expected_monthly_rent}
                      onChange={(e) => updateField('expected_monthly_rent', Number(e.target.value))}
                      slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <TextField
                      fullWidth label="Monthly Expenses" type="number" size="small"
                      value={input.monthly_expenses}
                      onChange={(e) => updateField('monthly_expenses', Number(e.target.value))}
                      slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <TextField
                      fullWidth label="Annual Taxes" type="number" size="small"
                      value={input.property_taxes_annual}
                      onChange={(e) => updateField('property_taxes_annual', Number(e.target.value))}
                      slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <TextField
                      fullWidth label="Annual Insurance" type="number" size="small"
                      value={input.insurance_annual}
                      onChange={(e) => updateField('insurance_annual', Number(e.target.value))}
                      slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <TextField
                      fullWidth label="Monthly HOA" type="number" size="small"
                      value={input.hoa_monthly}
                      onChange={(e) => updateField('hoa_monthly', Number(e.target.value))}
                      slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <TextField
                      fullWidth label="Vacancy Rate" type="number" size="small"
                      value={input.vacancy_rate_pct}
                      onChange={(e) => updateField('vacancy_rate_pct', Number(e.target.value))}
                      slotProps={{ input: { endAdornment: <InputAdornment position="end">%</InputAdornment> } }}
                    />
                  </Grid>
                </Grid>

                <Button
                  type="submit" variant="contained" fullWidth sx={{ mt: 3 }}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CalculateIcon />}
                  disabled={loading}
                >
                  {loading ? 'Analyzing...' : 'Analyze Deal'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          {!metrics && !loading && (
            <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
              <TrendingUpIcon sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
              <Typography variant="h5">Enter property details and click Analyze</Typography>
            </Box>
          )}

          {loading && (
            <Card>
              <CardContent>
                <FunLoader />
              </CardContent>
            </Card>
          )}

          {metrics && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {(propertyMeta.image_url || coords) && (
                <Card>
                  <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                    <Grid container>
                      {propertyMeta.image_url && (
                        <Grid size={{ xs: 12, md: coords ? 6 : 12 }}>
                          <Box
                            component="img"
                            src={propertyMeta.image_url}
                            alt={input.property_address}
                            onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = 'none'; }}
                            sx={{ width: '100%', height: 280, objectFit: 'cover' }}
                          />
                        </Grid>
                      )}
                      {coords && (
                        <Grid size={{ xs: 12, md: propertyMeta.image_url ? 6 : 12 }}>
                          <Box
                            component="iframe"
                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${coords.lon - 0.005},${coords.lat - 0.003},${coords.lon + 0.005},${coords.lat + 0.003}&layer=mapnik&marker=${coords.lat},${coords.lon}`}
                            sx={{ width: '100%', height: 280, border: 0 }}
                          />
                        </Grid>
                      )}
                    </Grid>
                    {input.property_address && (
                      <Box sx={{ display: 'flex', gap: 1, p: 2 }}>
                        <Chip
                          label="View on Zillow"
                          icon={<LaunchIcon sx={{ fontSize: 14 }} />}
                          clickable
                          component="a"
                          href={`https://www.zillow.com/homes/${encodeURIComponent(input.property_address)}_rb/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                    )}
                  </CardContent>
                </Card>
              )}

              {resultsTab === 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <ScoreGauge score={metrics.investmentScore}>
                            <Typography variant="h4" fontWeight={700}>
                              {metrics.investmentScore}
                            </Typography>
                            <Typography variant="caption">/100</Typography>
                          </ScoreGauge>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Investment Score
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">Monthly Cash Flow</Typography>
                          <Typography variant="h4" sx={{ color: metrics.monthlyCashFlow >= 0 ? 'success.main' : 'error.main' }}>
                            {formatCurrency(metrics.monthlyCashFlow)}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">Cap Rate</Typography>
                          <Typography variant="h4" sx={{ color: 'primary.main' }}>
                            {metrics.capRate.toFixed(2)}%
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  <Card>
                    <CardContent>
                      <Typography variant="h5" sx={{ mb: 2 }}>Key Metrics</Typography>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 6, sm: 4 }}>
                          <Typography variant="body2" color="text.secondary">Cash-on-Cash Return</Typography>
                          <Typography variant="h6">{metrics.cashOnCashReturn.toFixed(2)}%</Typography>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 4 }}>
                          <Typography variant="body2" color="text.secondary">Gross Rent Multiplier</Typography>
                          <Typography variant="h6">{metrics.grossRentMultiplier.toFixed(1)}</Typography>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 4 }}>
                          <Typography variant="body2" color="text.secondary">Monthly Mortgage</Typography>
                          <Typography variant="h6">{formatCurrency(metrics.monthlyMortgage)}</Typography>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 4 }}>
                          <Typography variant="body2" color="text.secondary">NOI (Annual)</Typography>
                          <Typography variant="h6">{formatCurrency(metrics.noi)}</Typography>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 4 }}>
                          <Typography variant="body2" color="text.secondary">Total Cash Needed</Typography>
                          <Typography variant="h6">{formatCurrency(metrics.totalCashNeeded)}</Typography>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 4 }}>
                          <Typography variant="body2" color="text.secondary">Annual Cash Flow</Typography>
                          <Typography variant="h6" sx={{ color: metrics.annualCashFlow >= 0 ? 'success.main' : 'error.main' }}>
                            {formatCurrency(metrics.annualCashFlow)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  {appreciationData.length > 0 && (
                    <Card>
                      <CardContent>
                        <Typography variant="h5" sx={{ mb: 2 }}>Appreciation Projection</Typography>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={appreciationData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="year" />
                            <YAxis tickFormatter={formatCurrency} width={70} />
                            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                            <Legend />
                            <Line type="monotone" dataKey="value" name="Property Value" stroke="#1565C0" strokeWidth={2} />
                            <Line type="monotone" dataKey="equity" name="Equity" stroke="#2E7D32" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}

                  {aiSummary && (
                    <Card>
                      <CardContent>
                        <Typography variant="h5" sx={{ mb: 2 }}>Analysis</Typography>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                          {aiSummary}
                        </Typography>
                      </CardContent>
                    </Card>
                  )}

                  {!thesis && (
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={loadingThesis ? <CircularProgress size={20} color="inherit" /> : <TrendingUpIcon />}
                      onClick={handleGenerateThesis}
                      disabled={loadingThesis}
                      fullWidth
                      sx={{ py: 1.5 }}
                    >
                      {loadingThesis ? 'Generating Investment Thesis...' : 'Generate Investment Thesis'}
                    </Button>
                  )}

                  {thesis && (
                    <Card sx={{ border: '2px solid', borderColor: 'secondary.main' }}>
                      <CardContent>
                        <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TrendingUpIcon color="secondary" />
                          Investment Thesis
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Typography
                          variant="body1"
                          component="div"
                          sx={{
                            '& h2': { mt: 3, mb: 1, fontSize: '1.25rem', fontWeight: 700 },
                            '& h3': { mt: 2, mb: 1, fontSize: '1.1rem', fontWeight: 600 },
                            '& strong': { color: 'primary.main' },
                            lineHeight: 1.8,
                          }}
                          dangerouslySetInnerHTML={{ __html: formatThesisMarkdown(thesis) }}
                        />
                      </CardContent>
                    </Card>
                  )}
                </Box>
              )}

              {resultsTab === 1 && (
                <PropertyFinancialsTab
                  input={input}
                  metrics={metrics}
                  financialsInput={financialsInput}
                  onFinancialsChange={setFinancialsInput}
                />
              )}

              {resultsTab === 2 && (
                <ProjectionsTab
                  input={input}
                  metrics={metrics}
                  financialsInput={financialsInput}
                  assumptions={projectionAssumptions}
                  onAssumptionsChange={setProjectionAssumptions}
                />
              )}

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Analysis'}
                </Button>
              </Box>
            </Box>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

function formatThesisMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '&bull; $1')
    .replace(/^\d+\. (.+)$/gm, (_, content) => `&bull; ${content}`);
}

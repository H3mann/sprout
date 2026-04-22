import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import LinearProgress from '@mui/material/LinearProgress';
import Slider from '@mui/material/Slider';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import BuildIcon from '@mui/icons-material/Build';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HomeIcon from '@mui/icons-material/Home';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import LaunchIcon from '@mui/icons-material/Launch';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import {
  aiApi,
  dealApi,
  type ApiDealAnalysis,
  type InvestmentStrategy,
  type PropertySuggestion,
  type ScoreContribution,
  type StrategyScore,
} from '../../services/api';

const STRATEGY_ICONS: Record<string, React.ReactElement> = {
  cash_flow: <AttachMoneyIcon sx={{ fontSize: 40 }} />,
  appreciation: <TrendingUpIcon sx={{ fontSize: 40 }} />,
  brrrr: <AutorenewIcon sx={{ fontSize: 40 }} />,
  house_hack: <HomeIcon sx={{ fontSize: 40 }} />,
  turnkey: <BuildIcon sx={{ fontSize: 40 }} />,
  str: <BeachAccessIcon sx={{ fontSize: 40 }} />,
};

const STRATEGY_COLORS: Record<string, string> = {
  cash_flow: '#2E7D32',
  appreciation: '#1565C0',
  brrrr: '#F57C00',
  house_hack: '#7B1FA2',
  turnkey: '#00838F',
  str: '#C62828',
};

const METRIC_LABELS: Record<string, string> = {
  minCapRate: 'Min Cap Rate',
  maxCapRate: 'Max Cap Rate',
  minCashOnCash: 'Min Cash-on-Cash',
  minMonthlyCashFlow: 'Min Monthly Cash Flow',
  maxGRM: 'Max GRM',
  minYearBuilt: 'Min Year Built',
  maxYearBuilt: 'Max Year Built',
  appreciationPotential: 'Appreciation Potential',
};

const LOCATION_LABELS: Record<string, string> = {
  minWalkScore: 'Min Walk Score',
  maxCrimeRate: 'Max Crime Rate',
  minMedianIncome: 'Min Median Income',
  maxFloodRisk: 'Max Flood Risk',
  populationGrowth: 'Population Growth',
};

// Per-field input affordances (units, suffix, helper). Numeric-only fields
// appear in the Customize Targets editor; non-numeric ones (e.g. 'high',
// 'booming') are skipped.
const FIELD_HINTS: Record<string, { suffix?: string; prefix?: string; step?: string; min?: number }> = {
  minCapRate: { suffix: '%', step: '0.1', min: 0 },
  maxCapRate: { suffix: '%', step: '0.1', min: 0 },
  minCashOnCash: { suffix: '%', step: '0.1', min: 0 },
  minMonthlyCashFlow: { prefix: '$', step: '50' },
  maxGRM: { step: '0.5', min: 0 },
  minYearBuilt: { step: '1', min: 1800 },
  maxYearBuilt: { step: '1', min: 1800 },
  minWalkScore: { step: '5', min: 0 },
  maxCrimeRate: { step: '25', min: 0 },
  minMedianIncome: { prefix: '$', step: '5000', min: 0 },
};

// "Less stringent than default" — fires the warning.
//   min* fields:  user value < default
//   max* fields:  user value > default
function isLessStrictThanDefault(key: string, current: number, defaultVal: number): boolean {
  if (key.startsWith('min')) return current < defaultVal;
  if (key.startsWith('max')) return current > defaultVal;
  return false;
}

function pickNumericEntries(obj: Record<string, unknown>): Array<[string, number]> {
  return Object.entries(obj).filter(([, v]) => typeof v === 'number') as Array<[string, number]>;
}

interface ScoringFactor {
  factor: string;
  description: string;
  range?: string;            // contribution range (omitted for filters that don't score)
  key?: string;              // override key — when present, row renders as editable input
  source?: 'tm' | 'lp';      // which override bucket key lives in
}

// Lists every row shown in the scoring panel for a strategy. Rows with `key`
// become editable inputs bound to the user's threshold; rows without `key`
// (e.g. "Property Type", "Flood Risk") are categorical and stay read-only.
// Rows without `range` are search filters fed to the suggestions prompt — they
// don't directly contribute to the score but still belong in this panel so
// the user can adjust them in one place.
function buildScoringFactors(
  strategyKey: string,
  tm: Record<string, unknown>,
  lp: Record<string, unknown>,
): ScoringFactor[] {
  const num = (v: unknown, fallback: number): number => (typeof v === 'number' ? v : fallback);

  switch (strategyKey) {
    case 'cash_flow': {
      const cap = num(tm.minCapRate, 8);
      const coc = num(tm.minCashOnCash, 8);
      const cf = num(tm.minMonthlyCashFlow, 200);
      const grm = num(tm.maxGRM, 12);
      const income = num(lp.minMedianIncome, 40000);
      return [
        { factor: 'Cap Rate', range: '-20 to +25', key: 'minCapRate', source: 'tm', description: `${cap}%+ target — higher is better for cash flow` },
        { factor: 'Cash-on-Cash', range: '-15 to +15', key: 'minCashOnCash', source: 'tm', description: `${coc}%+ target on invested capital` },
        { factor: 'Monthly Cash Flow', range: '-20 to +10', key: 'minMonthlyCashFlow', source: 'tm', description: `$${cf}+/mo positive cash flow from day one` },
        { factor: 'Gross Rent Multiplier', key: 'maxGRM', source: 'tm', description: `Max GRM ≤${grm} — lower means rent recoups price faster` },
        { factor: 'Median Income', key: 'minMedianIncome', source: 'lp', description: `$${income.toLocaleString()}+ income areas have stable rent demand` },
      ];
    }
    case 'appreciation': {
      const walk = num(lp.minWalkScore, 60);
      const income = num(lp.minMedianIncome, 60000);
      const cap = num(tm.maxCapRate, 5);
      return [
        { factor: 'Walk Score', range: '0 to +20', key: 'minWalkScore', source: 'lp', description: `${walk}+ walkability signals desirable, appreciating location` },
        { factor: 'Median Income', range: '-15 to +15', key: 'minMedianIncome', source: 'lp', description: `$${income.toLocaleString()}+ income areas see stronger value growth` },
        { factor: 'Cap Rate', range: '-10 to +15', key: 'maxCapRate', source: 'tm', description: `Cap rates ≤${cap}% indicate appreciation-driven markets` },
      ];
    }
    case 'brrrr': {
      const yr = num(tm.maxYearBuilt, 1990);
      const cap = num(tm.minCapRate, 8);
      const coc = num(tm.minCashOnCash, 10);
      const crime = num(lp.maxCrimeRate, 500);
      const income = num(lp.minMedianIncome, 45000);
      return [
        { factor: 'Property Age', range: '-10 to +15', key: 'maxYearBuilt', source: 'tm', description: `Pre-${yr} builds offer rehab value-add opportunity` },
        { factor: 'Cap Rate', range: '0 to +15', key: 'minCapRate', source: 'tm', description: `${cap}%+ returns after rehab justify the effort` },
        { factor: 'Cash-on-Cash', range: '0 to +15', key: 'minCashOnCash', source: 'tm', description: `${coc}%+ returns on recycled capital` },
        { factor: 'Crime Rate', range: '-15 to +10', key: 'maxCrimeRate', source: 'lp', description: `Below ${crime} crime rate protects rehab investment` },
        { factor: 'Median Income', key: 'minMedianIncome', source: 'lp', description: `$${income.toLocaleString()}+ income supports post-rehab rents` },
      ];
    }
    case 'turnkey': {
      const yr = num(tm.minYearBuilt, 2015);
      const cf = num(tm.minMonthlyCashFlow, 100);
      const cap = num(tm.minCapRate, 6);
      const walk = num(lp.minWalkScore, 40);
      return [
        { factor: 'Year Built', range: '-15 to +20', key: 'minYearBuilt', source: 'tm', description: `${yr}+ builds require minimal work` },
        { factor: 'Monthly Cash Flow', range: '0 to +15', key: 'minMonthlyCashFlow', source: 'tm', description: `$${cf}+/mo from move-in day` },
        { factor: 'Cap Rate', range: '0 to +10', key: 'minCapRate', source: 'tm', description: `${cap}%+ yields on turnkey properties` },
        { factor: 'Flood Risk', range: '-15 to +10', description: 'Low flood risk reduces maintenance costs' },
        { factor: 'Walk Score', key: 'minWalkScore', source: 'lp', description: `${walk}+ walkability — keeps tenant demand healthy` },
      ];
    }
    case 'str': {
      const walk = num(lp.minWalkScore, 70);
      const coc = num(tm.minCashOnCash, 12);
      return [
        { factor: 'Walk Score', range: '0 to +25', key: 'minWalkScore', source: 'lp', description: `${walk}+ walkability is key for guest experience` },
        { factor: 'Cash-on-Cash', range: '0 to +20', key: 'minCashOnCash', source: 'tm', description: `${coc}%+ returns from short-term rental premium` },
        { factor: 'Property Type', range: '0 to +10', description: 'Condos perform well as short-term rentals' },
      ];
    }
    case 'house_hack': {
      const walk = num(lp.minWalkScore, 60);
      const crime = num(lp.maxCrimeRate, 350);
      const cf = num(tm.minMonthlyCashFlow, 0);
      return [
        { factor: 'Property Type', range: '0 to +40', description: 'Multi-family (duplex/triplex/fourplex) is essential' },
        { factor: 'Walk Score', range: '0 to +15', key: 'minWalkScore', source: 'lp', description: `${walk}+ walkability attracts quality tenants` },
        { factor: 'Crime Rate', range: '0 to +10', key: 'maxCrimeRate', source: 'lp', description: `Below ${crime} crime rate for owner-occupied safety` },
        { factor: 'Monthly Cash Flow', range: '0 to +5', key: 'minMonthlyCashFlow', source: 'tm', description: `$${cf}+/mo (slight negative OK for owner-occupied)` },
      ];
    }
    default:
      return [];
  }
}

const SCORING_DIMENSIONS = ['Cap Rate', 'Cash Returns', 'Cash Flow', 'Location', 'Safety', 'Property'];

const STRATEGY_EMPHASIS: Record<string, Record<string, number>> = {
  cash_flow: { 'Cap Rate': 100, 'Cash Returns': 60, 'Cash Flow': 40, Location: 5, Safety: 5, Property: 5 },
  appreciation: { 'Cap Rate': 60, 'Cash Returns': 5, 'Cash Flow': 5, Location: 100, Safety: 5, Property: 5 },
  brrrr: { 'Cap Rate': 60, 'Cash Returns': 60, 'Cash Flow': 5, Location: 5, Safety: 40, Property: 60 },
  turnkey: { 'Cap Rate': 40, 'Cash Returns': 5, 'Cash Flow': 60, Location: 5, Safety: 5, Property: 100 },
  str: { 'Cap Rate': 5, 'Cash Returns': 80, 'Cash Flow': 5, Location: 100, Safety: 5, Property: 40 },
  house_hack: { 'Cap Rate': 5, 'Cash Returns': 5, 'Cash Flow': 15, Location: 40, Safety: 25, Property: 100 },
};

const formatMetricValue = (key: string, value: unknown): string => {
  if (typeof value === 'number') {
    if (key.includes('Income')) return `$${value.toLocaleString()}`;
    if (key.includes('CashFlow')) return `$${value}`;
    if (key.includes('Rate') || key.includes('Cash')) return `${value}%`;
    return String(value);
  }
  return String(value);
};

const formatCurrency = (val: number) => {
  if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (Math.abs(val) >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  return `$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

const HeroSection = styled(Box)<{ strategyColor: string }>(({ theme, strategyColor }) => ({
  background: `linear-gradient(135deg, ${strategyColor} 0%, ${strategyColor}CC 50%, ${strategyColor}99 100%)`,
  color: '#FFFFFF',
  padding: theme.spacing(5, 0, 4),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3, 0, 2),
  },
}));

const ScoreBar = ({ score, label }: { score: number; label: string }) => {
  const color = score >= 70 ? 'success' : score >= 40 ? 'warning' : 'error';
  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>{label}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>{score}/100</Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={score}
        color={color}
        sx={{ height: 8, borderRadius: 4 }}
      />
    </Box>
  );
};

const PropertyImage = ({ property, height }: { property: PropertySuggestion; height: number }) => {
  const [imgFailed, setImgFailed] = useState(false);

  if (property.image_url && !imgFailed) {
    return (
      <Box
        component="img"
        src={property.image_url}
        alt={property.property_address}
        onError={() => setImgFailed(true)}
        sx={{ width: '100%', height, objectFit: 'cover' }}
      />
    );
  }

  if (property.latitude && property.longitude) {
    return (
      <Box
        component="img"
        src={`https://staticmap.openstreetmap.de/staticmap.php?center=${property.latitude},${property.longitude}&zoom=15&size=400x${height}&maptype=mapnik&markers=${property.latitude},${property.longitude},red-pushpin`}
        alt={property.property_address}
        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
          e.currentTarget.style.display = 'none';
        }}
        sx={{ width: '100%', height, objectFit: 'cover' }}
      />
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        height,
        background: 'linear-gradient(135deg, #1565C0 0%, #42A5F5 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 0.5,
      }}
    >
      <HomeWorkIcon sx={{ fontSize: 32, color: 'rgba(255,255,255,0.7)' }} />
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
        {property.property_type}
      </Typography>
    </Box>
  );
};

const StrategyEmphasisRadar = ({
  weights,
  color,
}: {
  weights: Record<string, number>;
  color: string;
}) => {
  const data = SCORING_DIMENSIONS.map((dim) => ({
    dimension: dim,
    emphasis: weights[dim] ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
        <PolarGrid stroke="#e0e0e0" />
        <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12, fill: '#555' }} />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Radar
          dataKey="emphasis"
          stroke={color}
          fill={color}
          fillOpacity={0.25}
          strokeWidth={2}
          dot={{ r: 4, fill: color }}
          isAnimationActive={false}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
};

const PropertyFitRadar = ({ scores, currentStrategy }: { scores: StrategyScore[]; currentStrategy?: string }) => {
  const data = scores.map((s) => ({
    strategy: s.strategy,
    score: s.score,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
        <PolarGrid stroke="#e0e0e0" />
        <PolarAngleAxis
          dataKey="strategy"
          tick={(props: Record<string, unknown>) => {
            const { x, y, payload } = props as { x: number; y: number; payload: { value: string } };
            return (
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={11}
                fill={payload.value === currentStrategy ? '#1565C0' : '#666'}
                fontWeight={payload.value === currentStrategy ? 700 : 400}
              >
                {payload.value}
              </text>
            );
          }}
        />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Radar
          dataKey="score"
          stroke="#1565C0"
          fill="#1565C0"
          fillOpacity={0.2}
          strokeWidth={2}
          dot={{ r: 4, fill: '#1565C0' }}
        />
        <RechartsTooltip
          formatter={(value) => [`${value}/100`, 'Fit Score']}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
};

const ScoreBreakdownPanel = ({
  baseline,
  contributions,
  totalScore,
  color,
}: {
  baseline: number;
  contributions: ScoreContribution[];
  totalScore: number;
  color: string;
}) => {
  const maxAbsPoints = Math.max(
    ...contributions.map((c) => Math.abs(c.points)),
    1,
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Chip
          label={`Baseline: ${baseline}`}
          size="small"
          sx={{ bgcolor: '#F5F5F5', fontWeight: 600, fontSize: '0.75rem' }}
        />
        <Typography variant="caption" color="text.secondary">
          Starting score before factors
        </Typography>
      </Box>
      {contributions.map((c, i) => {
        const barWidth = Math.abs(c.points) / maxAbsPoints * 100;
        return (
          <Box key={i} sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.25 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {c.factor}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {c.value}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.3 }}>
                  {c.explanation}
                </Typography>
              </Box>
              <Chip
                label={c.points > 0 ? `+${c.points}` : `${c.points}`}
                size="small"
                sx={{
                  bgcolor: c.points > 0 ? '#E8F5E9' : c.points < 0 ? '#FFEBEE' : '#F5F5F5',
                  color: c.points > 0 ? '#2E7D32' : c.points < 0 ? '#C62828' : '#9E9E9E',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  minWidth: 48,
                  ml: 1,
                }}
              />
            </Box>
            <Box
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: '#F5F5F5',
                mt: 0.5,
                overflow: 'hidden',
              }}
            >
              {c.points !== 0 && (
                <Box
                  sx={{
                    height: '100%',
                    width: `${barWidth}%`,
                    borderRadius: 3,
                    bgcolor: c.points > 0 ? '#4CAF50' : '#EF5350',
                    transition: 'width 0.5s ease',
                  }}
                />
              )}
            </Box>
          </Box>
        );
      })}
      <Divider sx={{ my: 1.5 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Total Score
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, color }}>
          {totalScore}/100
        </Typography>
      </Box>
    </Box>
  );
};

interface ScoredDeal extends ApiDealAnalysis {
  strategyScore: number;
  strategyReason: string;
  allStrategyScores: StrategyScore[];
  contributions: ScoreContribution[];
  baseline: number;
}

export const DealStrategy = () => {
  const { strategyKey } = useParams<{ strategyKey: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [strategy, setStrategy] = useState<InvestmentStrategy | null>(null);
  const [allStrategies, setAllStrategies] = useState<InvestmentStrategy[]>([]);
  const [loadingStrategy, setLoadingStrategy] = useState(true);
  const [scoredDeals, setScoredDeals] = useState<ScoredDeal[]>([]);
  const [loadingDeals, setLoadingDeals] = useState(false);
  const [properties, setProperties] = useState<PropertySuggestion[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [location, setLocation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [expandedDealId, setExpandedDealId] = useState<string | null>(null);

  // User-editable thresholds + per-dimension weights. Initialized from the
  // strategy's defaults / STRATEGY_EMPHASIS the first time the strategy
  // loads, then owned by the inputs / sliders in the scoring panel.
  const [customTargetMetrics, setCustomTargetMetrics] = useState<Record<string, number>>({});
  const [customLocationPreferences, setCustomLocationPreferences] = useState<Record<string, number>>({});
  const [customWeights, setCustomWeights] = useState<Record<string, number>>({});
  // Debounced mirrors used to drive expensive re-scoring of saved deals so
  // each keystroke / slider tick doesn't fire an API call.
  const [debouncedTM, setDebouncedTM] = useState<Record<string, number>>({});
  const [debouncedLP, setDebouncedLP] = useState<Record<string, number>>({});
  const [debouncedWeights, setDebouncedWeights] = useState<Record<string, number>>({});

  useEffect(() => {
    setLoadingStrategy(true);
    aiApi
      .strategies()
      .then((res) => {
        setAllStrategies(res.strategies);
        const found = res.strategies.find((s) => s.key === strategyKey);
        setStrategy(found || null);
      })
      .catch(() => setError('Failed to load strategy details'))
      .finally(() => setLoadingStrategy(false));
  }, [strategyKey]);

  // Reset the editable thresholds + weights whenever the user navigates
  // between strategies — defaults come from the freshly loaded strategy and
  // the static STRATEGY_EMPHASIS map.
  useEffect(() => {
    if (!strategy || !strategyKey) return;
    const tm = Object.fromEntries(pickNumericEntries(strategy.targetMetrics));
    const lp = Object.fromEntries(pickNumericEntries(strategy.locationPreferences));
    const w = { ...(STRATEGY_EMPHASIS[strategyKey] ?? {}) };
    setCustomTargetMetrics(tm);
    setCustomLocationPreferences(lp);
    setCustomWeights(w);
    setDebouncedTM(tm);
    setDebouncedLP(lp);
    setDebouncedWeights(w);
  }, [strategy, strategyKey]);

  // Debounce the values that drive re-scoring of saved deals so users can
  // type / slide without firing N API calls per change.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedTM(customTargetMetrics);
      setDebouncedLP(customLocationPreferences);
      setDebouncedWeights(customWeights);
    }, 700);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [customTargetMetrics, customLocationPreferences, customWeights]);

  useEffect(() => {
    if (!user || !strategy || !strategyKey) return;
    setLoadingDeals(true);
    dealApi
      .list()
      .then(async (deals) => {
        const scored = await Promise.all(
          deals.map(async (deal) => {
            try {
              const result = await aiApi.analyzeStrategy({
                property_address: deal.property_address,
                purchase_price: deal.purchase_price,
                expected_monthly_rent: deal.expected_monthly_rent,
                down_payment_pct: deal.down_payment_pct,
                interest_rate: deal.interest_rate,
                loan_term_years: deal.loan_term_years,
                property_taxes_annual: deal.property_taxes_annual,
                insurance_annual: deal.insurance_annual,
                hoa_monthly: deal.hoa_monthly,
                vacancy_rate_pct: deal.vacancy_rate_pct,
                monthly_expenses: deal.monthly_expenses,
                strategy_key: strategyKey,
                targetMetrics: debouncedTM,
                locationPreferences: debouncedLP,
                weights: debouncedWeights,
              });
              const match = result.all_strategy_scores.find(
                (s: StrategyScore) => s.strategy === strategy.name
              );
              return {
                ...deal,
                strategyScore: match?.score ?? 0,
                strategyReason: match?.reason ?? '',
                allStrategyScores: result.all_strategy_scores,
                contributions: match?.contributions ?? [],
                baseline: match?.baseline ?? 50,
              };
            } catch {
              return {
                ...deal,
                strategyScore: 0,
                strategyReason: 'Could not score',
                allStrategyScores: [],
                contributions: [],
                baseline: 50,
              };
            }
          })
        );
        scored.sort((a, b) => b.strategyScore - a.strategyScore);
        setScoredDeals(scored);
      })
      .catch(() => {})
      .finally(() => setLoadingDeals(false));
  }, [user, strategy, strategyKey, debouncedTM, debouncedLP, debouncedWeights]);

  const handleFindProperties = useCallback(async () => {
    if (!strategyKey) return;
    setLoadingProperties(true);
    setError(null);
    try {
      const result = await aiApi.suggestionsByStrategy(
        strategyKey,
        location.trim() || undefined,
        8,
        {
          targetMetrics: customTargetMetrics,
          locationPreferences: customLocationPreferences,
        },
      );
      setProperties(result.properties);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find properties');
    } finally {
      setLoadingProperties(false);
    }
  }, [strategyKey, location, customTargetMetrics, customLocationPreferences]);

  const handlePropertyClick = (property: PropertySuggestion) => {
    navigate('/deal-analyzer', {
      state: {
        property_address: property.property_address,
        purchase_price: property.purchase_price,
        expected_monthly_rent: property.expected_monthly_rent,
        property_taxes_annual: property.property_taxes_annual,
        insurance_annual: property.insurance_annual,
        hoa_monthly: property.hoa_monthly,
        interest_rate: property.interest_rate,
        down_payment_pct: property.down_payment_pct,
        loan_term_years: property.loan_term_years,
        vacancy_rate_pct: property.vacancy_rate_pct,
        monthly_expenses: property.monthly_expenses,
        image_url: property.image_url || '',
        zillow_url: property.zillow_url || '',
        realtor_url: property.realtor_url || '',
        latitude: property.latitude || 0,
        longitude: property.longitude || 0,
        allSuggestions: properties,
      },
    });
  };

  const color = strategyKey ? STRATEGY_COLORS[strategyKey] || '#1565C0' : '#1565C0';
  const icon = strategyKey ? STRATEGY_ICONS[strategyKey] : null;

  const otherStrategies = useMemo(
    () => allStrategies.filter((s) => s.key !== strategyKey),
    [allStrategies, strategyKey]
  );

  const scoringFactors = useMemo(
    () => (strategyKey ? buildScoringFactors(strategyKey, customTargetMetrics, customLocationPreferences) : []),
    [strategyKey, customTargetMetrics, customLocationPreferences],
  );

  // Default values from the backend strategy definition — used as the
  // baseline against which "less stringent" warnings fire and as the target
  // for the Reset button.
  const defaultTM = useMemo<Record<string, number>>(
    () => (strategy ? Object.fromEntries(pickNumericEntries(strategy.targetMetrics)) : {}),
    [strategy],
  );
  const defaultLP = useMemo<Record<string, number>>(
    () => (strategy ? Object.fromEntries(pickNumericEntries(strategy.locationPreferences)) : {}),
    [strategy],
  );
  const defaultWeights = useMemo<Record<string, number>>(
    () => (strategyKey ? { ...(STRATEGY_EMPHASIS[strategyKey] ?? {}) } : {}),
    [strategyKey],
  );

  const hasCustomizations = useMemo(() => {
    const tmDirty = Object.keys(defaultTM).some(
      (k) => k in customTargetMetrics && customTargetMetrics[k] !== defaultTM[k],
    );
    const lpDirty = Object.keys(defaultLP).some(
      (k) => k in customLocationPreferences && customLocationPreferences[k] !== defaultLP[k],
    );
    const wDirty = Object.keys(defaultWeights).some(
      (k) => k in customWeights && customWeights[k] !== defaultWeights[k],
    );
    return tmDirty || lpDirty || wDirty;
  }, [defaultTM, defaultLP, defaultWeights, customTargetMetrics, customLocationPreferences, customWeights]);

  const resetTargets = () => {
    setCustomTargetMetrics(defaultTM);
    setCustomLocationPreferences(defaultLP);
    setCustomWeights(defaultWeights);
  };

  if (loadingStrategy) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!strategyKey || !strategy) {
    if (loadingStrategy) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (strategyKey && !strategy) {
      return (
        <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ mb: 2 }}>Strategy Not Found</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            The strategy "{strategyKey}" doesn't exist.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/deal-strategy')}>
            View All Strategies
          </Button>
        </Container>
      );
    }

    return (
      <Box>
        <HeroSection strategyColor="#1565C0">
          <Container maxWidth="lg">
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
              Investment Strategies
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400, maxWidth: 640 }}>
              Choose a strategy that matches your investment goals. Each strategy has different target
              metrics and ideal property types.
            </Typography>
          </Container>
        </HeroSection>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Grid container spacing={3}>
            {allStrategies.map((s) => {
              const sColor = STRATEGY_COLORS[s.key] || '#1565C0';
              const sIcon = STRATEGY_ICONS[s.key];
              return (
                <Grid key={s.key} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      height: '100%',
                      '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 },
                      borderTop: `4px solid ${sColor}`,
                    }}
                    onClick={() => navigate(`/deal-strategy/${s.key}`)}
                  >
                    <CardContent sx={{ py: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                        <Box sx={{ color: sColor }}>{sIcon}</Box>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                          {s.name}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {s.description}
                      </Typography>
                      <Divider sx={{ mb: 1.5 }} />
                      <Typography variant="overline" color="text.secondary">
                        Target Metrics
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                        {Object.entries(s.targetMetrics).map(([key, value]) => (
                          <Chip
                            key={key}
                            label={`${METRIC_LABELS[key] || key}: ${formatMetricValue(key, value)}`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Container>
      </Box>
    );
  }

  return (
    <Box>
      <HeroSection strategyColor={color}>
        <Container maxWidth="lg">
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/')}
            sx={{ color: 'rgba(255,255,255,0.8)', mb: 2, '&:hover': { color: '#fff' } }}
          >
            All Strategies
          </Button>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            {icon && (
              <Box
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  borderRadius: 2,
                  p: 1.5,
                  display: 'flex',
                }}
              >
                {icon}
              </Box>
            )}
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                {strategy.name}
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
                {strategy.description}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mt: 3 }}>
            <Box>
              <Typography variant="overline" sx={{ opacity: 0.7, display: 'block', mb: 0.5 }}>
                Target Metrics
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                {Object.entries(strategy.targetMetrics).map(([key, value]) => (
                  <Chip
                    key={key}
                    label={`${METRIC_LABELS[key] || key}: ${formatMetricValue(key, value)}`}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                    }}
                  />
                ))}
              </Box>
            </Box>
            <Box>
              <Typography variant="overline" sx={{ opacity: 0.7, display: 'block', mb: 0.5 }}>
                Location Preferences
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                {Object.entries(strategy.locationPreferences).map(([key, value]) => (
                  <Chip
                    key={key}
                    label={`${LOCATION_LABELS[key] || key}: ${formatMetricValue(key, value)}`}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </Container>
      </HeroSection>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* How This Strategy Scores */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  How {strategy.name} Scores Properties
                </Typography>
              </Box>
              {hasCustomizations && (
                <Chip
                  label="Customized"
                  size="small"
                  sx={{ bgcolor: `${color}15`, color, fontWeight: 600 }}
                />
              )}
              <Button
                size="small"
                startIcon={<RestartAltIcon />}
                onClick={resetTargets}
                disabled={!hasCustomizations}
              >
                Reset
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Each property starts with a baseline score, then gains or loses points based on these
              factors. Edit a threshold to retune the scoring — saved deals re-score
              automatically and "Find Properties" uses your values. Loosening a threshold raises a
              warning.
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 5 }}>
                <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Strategy Emphasis
                </Typography>
                <StrategyEmphasisRadar weights={customWeights} color={color} />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 0.5, mb: 1.5 }}>
                  Drag a slider to retune how much each dimension contributes to the score.
                </Typography>
                <Box sx={{ px: 1 }}>
                  {SCORING_DIMENSIONS.map((dim) => {
                    const value = customWeights[dim] ?? 0;
                    const def = defaultWeights[dim] ?? 0;
                    const dirty = value !== def;
                    return (
                      <Box key={dim} sx={{ mb: 0.5 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{ fontWeight: dirty ? 700 : 500, color: dirty ? color : 'text.primary' }}
                          >
                            {dim}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {value}
                            {dirty && (
                              <Typography component="span" variant="caption" sx={{ color: 'text.disabled', ml: 0.5 }}>
                                / def {def}
                              </Typography>
                            )}
                          </Typography>
                        </Box>
                        <Slider
                          size="small"
                          value={value}
                          min={0}
                          max={100}
                          step={5}
                          onChange={(_, v) =>
                            setCustomWeights((prev) => ({ ...prev, [dim]: v as number }))
                          }
                          sx={{
                            color,
                            mt: -0.5,
                            '& .MuiSlider-thumb': { width: 14, height: 14 },
                          }}
                        />
                      </Box>
                    );
                  })}
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 7 }}>
                <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Scoring Factors
                </Typography>
                {scoringFactors.map((f, i) => {
                  const bucket = f.source === 'lp' ? defaultLP : defaultTM;
                  const setter = f.source === 'lp' ? setCustomLocationPreferences : setCustomTargetMetrics;
                  const current = f.source === 'lp' ? customLocationPreferences : customTargetMetrics;
                  const defaultVal = f.key ? bucket[f.key] : undefined;
                  const value = f.key && f.key in current ? current[f.key] : defaultVal;
                  const hint = f.key ? FIELD_HINTS[f.key] ?? {} : {};
                  const isLoose =
                    f.key != null && defaultVal != null && typeof value === 'number'
                      ? isLessStrictThanDefault(f.key, value, defaultVal)
                      : false;
                  const fmtVal = (v: number) =>
                    `${hint.prefix ?? ''}${v.toLocaleString()}${hint.suffix ?? ''}`;

                  return (
                    <Box
                      key={i}
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 2,
                        py: 1.5,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        '&:last-child': { borderBottom: 'none' },
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {f.factor}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {f.description}
                        </Typography>
                        {f.key && defaultVal != null && (
                          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField
                              size="small"
                              type="number"
                              value={typeof value === 'number' ? value : defaultVal}
                              onChange={(e) => {
                                const v = e.target.value;
                                setter((prev) => ({
                                  ...prev,
                                  [f.key as string]: v === '' ? defaultVal : Number(v),
                                }));
                              }}
                              slotProps={{
                                htmlInput: { step: hint.step, min: hint.min },
                                input: {
                                  startAdornment: hint.prefix ? (
                                    <InputAdornment position="start">{hint.prefix}</InputAdornment>
                                  ) : undefined,
                                  endAdornment: hint.suffix ? (
                                    <InputAdornment position="end">{hint.suffix}</InputAdornment>
                                  ) : undefined,
                                },
                              }}
                              color={isLoose ? 'warning' : 'primary'}
                              focused={isLoose || undefined}
                              sx={{ width: 160 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              default {fmtVal(defaultVal)}
                            </Typography>
                            {isLoose && (
                              <Tooltip
                                title={`Default is ${fmtVal(defaultVal)} — you're ${(f.key as string).startsWith('max') ? 'above' : 'below'} the recommended threshold`}
                              >
                                <Chip
                                  size="small"
                                  icon={<WarningAmberIcon sx={{ fontSize: 14 }} />}
                                  label={(f.key as string).startsWith('max') ? 'Above default' : 'Below default'}
                                  sx={{
                                    bgcolor: 'warning.lighter',
                                    color: 'warning.dark',
                                    fontWeight: 600,
                                    fontSize: '0.7rem',
                                    '& .MuiChip-icon': { color: 'warning.dark' },
                                  }}
                                />
                              </Tooltip>
                            )}
                          </Box>
                        )}
                      </Box>
                      {f.range ? (
                        <Chip
                          label={f.range}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', fontWeight: 600, flexShrink: 0 }}
                        />
                      ) : (
                        <Chip
                          label="Filter"
                          size="small"
                          variant="outlined"
                          sx={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            flexShrink: 0,
                            color: 'text.secondary',
                            borderStyle: 'dashed',
                          }}
                        />
                      )}
                    </Box>
                  );
                })}
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Find Properties Section */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <SearchIcon sx={{ color }} />
              <Typography variant="h5">
                Find {strategy.name} Properties
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Search for properties that match the {strategy.name} strategy. Optionally filter by
              location.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="City, state, or zip (optional — leave blank for nationwide)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <LocationOnIcon sx={{ mr: 1, color: 'text.disabled', fontSize: 20 }} />
                    ),
                  },
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleFindProperties();
                }}
              />
              <Button
                variant="contained"
                startIcon={
                  loadingProperties ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <AutoAwesomeIcon />
                  )
                }
                disabled={loadingProperties}
                onClick={handleFindProperties}
                sx={{ minWidth: 180, bgcolor: color, '&:hover': { bgcolor: color, opacity: 0.9 } }}
              >
                {loadingProperties ? 'Searching...' : 'Find Properties'}
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* AI Property Suggestions */}
        {(loadingProperties || properties.length > 0) && (
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <AutoAwesomeIcon sx={{ color }} />
              <Typography variant="h5">
                {strategy.name} Properties
              </Typography>
              {!loadingProperties && (
                <Chip
                  label={`${properties.length} found`}
                  size="small"
                  sx={{ ml: 1, bgcolor: `${color}15`, color, fontWeight: 600 }}
                />
              )}
            </Box>

            {loadingProperties && (
              <Card>
                <CardContent
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    py: 6,
                    justifyContent: 'center',
                  }}
                >
                  <CircularProgress size={28} sx={{ color }} />
                  <Typography color="text.secondary">
                    Finding {strategy.name.toLowerCase()} properties...
                  </Typography>
                </CardContent>
              </Card>
            )}

            {!loadingProperties && properties.length > 0 && (
              <Grid container spacing={2}>
                {properties.map((p, i) => (
                  <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                    <Card
                      variant="outlined"
                      sx={{
                        height: '100%',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          borderColor: color,
                          boxShadow: 2,
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <Box
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handlePropertyClick(p)}
                      >
                        <PropertyImage property={p} height={140} />
                      </Box>
                      <CardContent
                        sx={{ p: 2, '&:last-child': { pb: 2 }, cursor: 'pointer' }}
                        onClick={() => handlePropertyClick(p)}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            mb: 1,
                            flexWrap: 'wrap',
                          }}
                        >
                          <Chip label={p.property_type} size="small" variant="outlined" />
                          {p.estimated_rehab_cost != null && p.estimated_rehab_cost > 0 && (
                            <Chip
                              label={`Rehab: ${formatCurrency(p.estimated_rehab_cost)}`}
                              size="small"
                              sx={{
                                bgcolor: '#FFF3E0',
                                color: '#E65100',
                                fontWeight: 600,
                                fontSize: '0.7rem',
                              }}
                            />
                          )}
                        </Box>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600, mb: 0.5, lineHeight: 1.3 }}
                        >
                          {p.property_address}
                        </Typography>
                        <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                          {formatCurrency(p.purchase_price)}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, my: 0.5, flexWrap: 'wrap' }}>
                          <Typography variant="caption" color="text.secondary">
                            {p.bedrooms}bd/{p.bathrooms}ba
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {p.sqft?.toLocaleString()} sqft
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Built {p.year_built}
                          </Typography>
                        </Box>
                        <Typography
                          variant="body2"
                          color="success.main"
                          sx={{ fontWeight: 600 }}
                        >
                          Rent: {formatCurrency(p.expected_monthly_rent)}/mo
                        </Typography>

                        {p.location_insights?.walkability?.walkScore != null && (
                          <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                              label={`Walk: ${p.location_insights.walkability.walkScore}`}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.65rem', height: 20 }}
                            />
                            {p.location_insights.safety?.violentCrimeRate != null && (
                              <Chip
                                label={`Crime: ${p.location_insights.safety.violentCrimeRate}`}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.65rem', height: 20 }}
                              />
                            )}
                            {p.location_insights.flood_risk?.floodRisk && (
                              <Chip
                                label={`Flood: ${p.location_insights.flood_risk.floodRisk}`}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.65rem', height: 20 }}
                              />
                            )}
                          </Box>
                        )}

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mt: 1, lineHeight: 1.3 }}
                        >
                          {p.strategy_fit || p.why}
                        </Typography>
                      </CardContent>
                      {(p.zillow_url || p.realtor_url) && (
                        <Box sx={{ display: 'flex', gap: 1, px: 2, pb: 1.5 }}>
                          {p.zillow_url && (
                            <Chip
                              label="Zillow"
                              size="small"
                              icon={<LaunchIcon sx={{ fontSize: 14 }} />}
                              clickable
                              component="a"
                              href={p.zillow_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e: React.MouseEvent) => e.stopPropagation()}
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                          {p.realtor_url && (
                            <Chip
                              label="Realtor"
                              size="small"
                              icon={<LaunchIcon sx={{ fontSize: 14 }} />}
                              clickable
                              component="a"
                              href={p.realtor_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e: React.MouseEvent) => e.stopPropagation()}
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      )}
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {/* Saved Deals Scored Against This Strategy */}
        {user && (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CheckCircleIcon sx={{ color }} />
                <Typography variant="h5">
                  Your Saved Deals — {strategy.name} Fit
                </Typography>
              </Box>

              {loadingDeals && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    py: 4,
                    justifyContent: 'center',
                  }}
                >
                  <CircularProgress size={24} />
                  <Typography color="text.secondary">
                    Scoring your saved deals...
                  </Typography>
                </Box>
              )}

              {!loadingDeals && scoredDeals.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    No saved deals yet. Analyze a property first, then save it.
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/deal-analyzer')}
                    sx={{ borderColor: color, color }}
                  >
                    Go to Deal Analyzer
                  </Button>
                </Box>
              )}

              {!loadingDeals && scoredDeals.length > 0 && (
                <Box>
                  {scoredDeals.map((deal) => {
                    const isExpanded = expandedDealId === deal.id;
                    return (
                      <Box
                        key={deal.id}
                        sx={{
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          '&:last-child': { borderBottom: 'none' },
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            py: 2,
                            px: 2,
                            cursor: 'pointer',
                            transition: 'background 0.1s',
                            '&:hover': { bgcolor: 'action.hover' },
                            bgcolor: isExpanded ? 'action.selected' : 'transparent',
                          }}
                          onClick={() => setExpandedDealId(isExpanded ? null : deal.id)}
                        >
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }} noWrap>
                              {deal.property_address}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 0.5 }}>
                              <Typography variant="body2" color="primary" sx={{ fontWeight: 700 }}>
                                {formatCurrency(deal.purchase_price)}
                              </Typography>
                              {deal.computed_metrics && (
                                <>
                                  <Typography variant="caption" color="text.secondary">
                                    Cap: {deal.computed_metrics.capRate.toFixed(1)}%
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    CoC: {deal.computed_metrics.cashOnCashReturn.toFixed(1)}%
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color:
                                        deal.computed_metrics.monthlyCashFlow >= 0
                                          ? 'success.main'
                                          : 'error.main',
                                      fontWeight: 600,
                                    }}
                                  >
                                    CF: {formatCurrency(deal.computed_metrics.monthlyCashFlow)}/mo
                                  </Typography>
                                </>
                              )}
                            </Box>
                          </Box>
                          <Box sx={{ width: 100, flexShrink: 0 }}>
                            <ScoreBar score={deal.strategyScore} label="Fit" />
                          </Box>
                        </Box>

                        {isExpanded && (
                          <Box sx={{ px: 2, pb: 3 }}>
                            <Divider sx={{ mb: 2 }} />
                            <Grid container spacing={3}>
                              <Grid size={{ xs: 12, md: 5 }}>
                                <Typography
                                  variant="overline"
                                  color="text.secondary"
                                  sx={{ display: 'block', mb: 1 }}
                                >
                                  Strategy Fit Across All Strategies
                                </Typography>
                                {deal.allStrategyScores.length > 0 ? (
                                  <PropertyFitRadar
                                    scores={deal.allStrategyScores}
                                    currentStrategy={strategy.name}
                                  />
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    No strategy scores available
                                  </Typography>
                                )}
                              </Grid>
                              <Grid size={{ xs: 12, md: 7 }}>
                                <Typography
                                  variant="overline"
                                  color="text.secondary"
                                  sx={{ display: 'block', mb: 1 }}
                                >
                                  {strategy.name} Scoring Breakdown
                                </Typography>
                                {deal.contributions.length > 0 ? (
                                  <ScoreBreakdownPanel
                                    baseline={deal.baseline}
                                    contributions={deal.contributions}
                                    totalScore={deal.strategyScore}
                                    color={color}
                                  />
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    No breakdown available
                                  </Typography>
                                )}
                              </Grid>
                            </Grid>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                              <Button
                                variant="outlined"
                                size="small"
                                sx={{ borderColor: color, color }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate('/deal-analyzer', {
                                    state: {
                                      property_address: deal.property_address,
                                      purchase_price: deal.purchase_price,
                                      down_payment_pct: deal.down_payment_pct,
                                      interest_rate: deal.interest_rate,
                                      loan_term_years: deal.loan_term_years,
                                      expected_monthly_rent: deal.expected_monthly_rent,
                                      monthly_expenses: deal.monthly_expenses,
                                      property_taxes_annual: deal.property_taxes_annual,
                                      insurance_annual: deal.insurance_annual,
                                      hoa_monthly: deal.hoa_monthly,
                                      vacancy_rate_pct: deal.vacancy_rate_pct,
                                    },
                                  });
                                }}
                              >
                                Full Deal Analysis
                              </Button>
                            </Box>
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {/* Other Strategies */}
        {otherStrategies.length > 0 && (
          <Box>
            <Typography variant="h5" sx={{ mb: 2 }}>
              Explore Other Strategies
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {otherStrategies.map((s) => {
                const sColor = STRATEGY_COLORS[s.key] || '#1565C0';
                const sIcon = STRATEGY_ICONS[s.key];
                return (
                  <Grid key={s.key} size={{ xs: 6, sm: 4, md: 2.4 }}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        '&:hover': {
                          transform: 'translateY(-3px)',
                          boxShadow: 3,
                        },
                      }}
                      onClick={() => navigate(`/deal-strategy/${s.key}`)}
                    >
                      <CardContent sx={{ textAlign: 'center', py: 3 }}>
                        <Box sx={{ color: sColor, mb: 1 }}>{sIcon}</Box>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 700 }}
                        >
                          {s.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            mt: 0.5,
                          }}
                        >
                          {s.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )}
      </Container>
    </Box>
  );
};

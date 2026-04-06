import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import SpeedIcon from '@mui/icons-material/Speed';

import { AiInsight } from './AiInsight';
import { GrowthInsights } from './GrowthInsights';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

import {
  HEIGHT_BOYS_CM,
  HEIGHT_GIRLS_CM,
  WEIGHT_BOYS_KG,
  WEIGHT_GIRLS_KG
} from '../../data/growthPercentiles';

type Metric = 'weight' | 'height';
type Sex = 'male' | 'female';
type UnitSystem = 'metric' | 'imperial';

interface Measurement {
  ageMonths: number;
  value: number; // always stored in metric (kg or cm)
  date: string;
}

const KG_TO_LBS = 2.20462;
const CM_TO_IN = 0.393701;

const toDisplay = (value: number, metricType: Metric, unitSystem: UnitSystem): number => {
  if (unitSystem === 'metric') return value;
  return metricType === 'weight'
    ? Math.round(value * KG_TO_LBS * 100) / 100
    : Math.round(value * CM_TO_IN * 100) / 100;
};

const toMetric = (value: number, metricType: Metric, unitSystem: UnitSystem): number => {
  if (unitSystem === 'metric') return value;
  return metricType === 'weight' ? value / KG_TO_LBS : value / CM_TO_IN;
};

const getUnit = (metricType: Metric, unitSystem: UnitSystem): string => {
  if (unitSystem === 'metric') return metricType === 'weight' ? 'kg' : 'cm';
  return metricType === 'weight' ? 'lbs' : 'in';
};

const getYLabel = (metricType: Metric, unitSystem: UnitSystem): string => {
  const u = getUnit(metricType, unitSystem);
  return metricType === 'weight' ? `Weight (${u})` : `Height (${u})`;
};

const buildPercentileData = (rawData: number[][], metricType: Metric, unitSystem: UnitSystem) => {
  return rawData.map((row) => ({
    age: row[0],
    p3: toDisplay(row[1], metricType, unitSystem),
    p15: toDisplay(row[2], metricType, unitSystem),
    p50: toDisplay(row[3], metricType, unitSystem),
    p85: toDisplay(row[4], metricType, unitSystem),
    p97: toDisplay(row[5], metricType, unitSystem)
  }));
};

const getDataset = (metric: Metric, sex: Sex) => {
  if (metric === 'weight') {
    return sex === 'male' ? WEIGHT_BOYS_KG : WEIGHT_GIRLS_KG;
  }
  return sex === 'male' ? HEIGHT_BOYS_CM : HEIGHT_GIRLS_CM;
};

const initialMeasurements: Record<Metric, Measurement[]> = {
  weight: [
    { ageMonths: 0, value: 3.4, date: '2025-07-01' },
    { ageMonths: 1, value: 4.3, date: '2025-08-01' },
    { ageMonths: 2, value: 5.4, date: '2025-09-01' },
    { ageMonths: 4, value: 6.8, date: '2025-11-01' },
    { ageMonths: 6, value: 7.8, date: '2026-01-01' },
    { ageMonths: 9, value: 8.2, date: '2026-04-01' }
  ],
  height: [
    { ageMonths: 0, value: 50.2, date: '2025-07-01' },
    { ageMonths: 1, value: 54.5, date: '2025-08-01' },
    { ageMonths: 2, value: 58.0, date: '2025-09-01' },
    { ageMonths: 4, value: 63.2, date: '2025-11-01' },
    { ageMonths: 6, value: 67.1, date: '2026-01-01' },
    { ageMonths: 9, value: 70.1, date: '2026-04-01' }
  ]
};

const PARENTAL_HEIGHT_KEY = 'sprout_parental_heights';

interface ParentalHeightsCm {
  motherCm: number | null;
  fatherCm: number | null;
}

function loadParentalHeights(): ParentalHeightsCm {
  try {
    const stored = localStorage.getItem(PARENTAL_HEIGHT_KEY);
    if (!stored) return { motherCm: null, fatherCm: null };
    const parsed = JSON.parse(stored);
    const m = typeof parsed.motherCm === 'string' ? parseFloat(parsed.motherCm) || null : parsed.motherCm;
    const f = typeof parsed.fatherCm === 'string' ? parseFloat(parsed.fatherCm) || null : parsed.fatherCm;
    return { motherCm: m, fatherCm: f };
  } catch {
    return { motherCm: null, fatherCm: null };
  }
}

function saveParentalHeights(heights: ParentalHeightsCm) {
  localStorage.setItem(PARENTAL_HEIGHT_KEY, JSON.stringify(heights));
}

const cmToFtIn = (cm: number): string => {
  const totalInches = cm / 2.54;
  const ft = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${ft}'${inches}"`;
};

const displayHeight = (cm: number, unitSystem: UnitSystem): string => {
  if (unitSystem === 'metric') return `${Math.round(cm * 10) / 10} cm`;
  return `${toDisplay(cm, 'height', 'imperial')} in (${cmToFtIn(cm)})`;
};

function predictAdultHeight(motherCm: number, fatherCm: number, sex: Sex) {
  const midParental =
    sex === 'male'
      ? (fatherCm + motherCm + 13) / 2
      : (fatherCm + motherCm - 13) / 2;
  return {
    predicted: Math.round(midParental * 10) / 10,
    low: Math.round((midParental - 8.5) * 10) / 10,
    high: Math.round((midParental + 8.5) * 10) / 10
  };
}

const PROJECTION_AGES_YEARS = [0, 1, 2, 3, 5, 8, 10, 12, 14, 16, 18];
const PROJECTION_P50_GIRLS_CM = [49.1, 74.0, 85.5, 95.1, 109.4, 127.3, 138.4, 151.9, 160.0, 162.5, 163.0];
const PROJECTION_P50_BOYS_CM = [49.9, 75.7, 87.1, 96.1, 110.0, 128.0, 138.4, 149.1, 163.8, 173.4, 175.7];

export const GrowthChart = () => {
  const [subTab, setSubTab] = useState(0);
  const [metric, setMetric] = useState<Metric>('weight');
  const [sex, setSex] = useState<Sex>('female');
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(
    () => (localStorage.getItem('sprout_unit_system') as UnitSystem) || 'metric'
  );
  const [measurements, setMeasurements] = useState(initialMeasurements);
  const [newAge, setNewAge] = useState('');
  const [newValue, setNewValue] = useState('');
  const [parentalHeights, setParentalHeights] = useState<ParentalHeightsCm>(loadParentalHeights);
  const [motherInput, setMotherInput] = useState('');
  const [fatherInput, setFatherInput] = useState('');

  // Sync parental inputs on first render
  const motherDisplayRef = parentalHeights.motherCm;
  const fatherDisplayRef = parentalHeights.fatherCm;
  useState(() => {
    if (motherDisplayRef != null) setMotherInput(String(toDisplay(motherDisplayRef, 'height', unitSystem)));
    if (fatherDisplayRef != null) setFatherInput(String(toDisplay(fatherDisplayRef, 'height', unitSystem)));
  });

  const handleUnitSystemChange = (_: unknown, val: UnitSystem | null) => {
    if (!val) return;
    setUnitSystem(val);
    localStorage.setItem('sprout_unit_system', val);
    if (parentalHeights.motherCm != null) {
      setMotherInput(String(toDisplay(parentalHeights.motherCm, 'height', val)));
    }
    if (parentalHeights.fatherCm != null) {
      setFatherInput(String(toDisplay(parentalHeights.fatherCm, 'height', val)));
    }
  };

  const hasValidParentalHeights =
    parentalHeights.motherCm != null && parentalHeights.fatherCm != null &&
    parentalHeights.motherCm > 100 && parentalHeights.motherCm < 220 &&
    parentalHeights.fatherCm > 100 && parentalHeights.fatherCm < 230;
  const prediction = hasValidParentalHeights
    ? predictAdultHeight(parentalHeights.motherCm!, parentalHeights.fatherCm!, sex)
    : null;

  const handleParentalHeightSave = (field: 'motherCm' | 'fatherCm', inputValue: string) => {
    const parsed = parseFloat(inputValue);
    if (isNaN(parsed) || parsed <= 0) {
      setParentalHeights((prev) => {
        const next = { ...prev, [field]: null };
        saveParentalHeights(next);
        return next;
      });
      return;
    }
    const cm = Math.round(toMetric(parsed, 'height', unitSystem) * 10) / 10;
    setParentalHeights((prev) => {
      const next = { ...prev, [field]: cm };
      saveParentalHeights(next);
      return next;
    });
  };

  const [insightTrigger, setInsightTrigger] = useState(0);
  const [predictionInsightTrigger, setPredictionInsightTrigger] = useState(0);

  const heightUnit = getUnit('height', unitSystem);

  // Percentile chart data
  const percentileData = buildPercentileData(getDataset(metric, sex), metric, unitSystem);
  const unit = getUnit(metric, unitSystem);
  const yLabel = getYLabel(metric, unitSystem);

  const chartData = percentileData.map((pRow) => {
    const measurement = measurements[metric].find((m) => m.ageMonths === pRow.age);
    return {
      ...pRow,
      childValue: measurement ? toDisplay(measurement.value, metric, unitSystem) : null
    };
  });

  const handleAddMeasurement = () => {
    const age = parseInt(newAge, 10);
    const rawValue = parseFloat(newValue);
    if (isNaN(age) || isNaN(rawValue) || age < 0 || age > 36) return;

    const metricValue = Math.round(toMetric(rawValue, metric, unitSystem) * 100) / 100;

    setMeasurements((prev) => ({
      ...prev,
      [metric]: [
        ...prev[metric].filter((m) => m.ageMonths !== age),
        { ageMonths: age, value: metricValue, date: new Date().toISOString().split('T')[0] }
      ].sort((a, b) => a.ageMonths - b.ageMonths)
    }));
    setNewAge('');
    setNewValue('');
    setInsightTrigger((prev) => prev + 1);
  };

  const getPercentileForChild = () => {
    const latest = measurements[metric].at(-1);
    if (!latest) return null;

    const displayValue = toDisplay(latest.value, metric, unitSystem);
    const closestRow = percentileData.reduce((prev, curr) =>
      Math.abs(curr.age - latest.ageMonths) < Math.abs(prev.age - latest.ageMonths) ? curr : prev
    );

    if (displayValue <= closestRow.p3) return '<3rd';
    if (displayValue <= closestRow.p15) return '3rd–15th';
    if (displayValue <= closestRow.p50) return '15th–50th';
    if (displayValue <= closestRow.p85) return '50th–85th';
    if (displayValue <= closestRow.p97) return '85th–97th';
    return '>97th';
  };

  const percentileRange = getPercentileForChild();

  // Projection chart data
  const buildProjectionData = () => {
    if (!prediction) return null;

    const baseCurve = sex === 'male' ? PROJECTION_P50_BOYS_CM : PROJECTION_P50_GIRLS_CM;
    const childHeightMeasurements = measurements.height;
    const standardAdult = baseCurve[baseCurve.length - 1];
    const scaleFactor = prediction.predicted / standardAdult;

    const data = PROJECTION_AGES_YEARS.map((ageYears, i) => {
      const ageMonths = ageYears * 12;
      const projectedCm = baseCurve[i] * scaleFactor;
      const childMeasurement = childHeightMeasurements.find((m) => Math.abs(m.ageMonths - ageMonths) <= 2);
      return {
        ageYears,
        label: ageYears === 0 ? 'Birth' : `${ageYears}y`,
        projected: toDisplay(projectedCm, 'height', unitSystem),
        targetLow: toDisplay(projectedCm * (prediction.low / prediction.predicted), 'height', unitSystem),
        targetHigh: toDisplay(projectedCm * (prediction.high / prediction.predicted), 'height', unitSystem),
        childValue: childMeasurement ? toDisplay(childMeasurement.value, 'height', unitSystem) : null
      };
    });

    return {
      data,
      motherHeight: parentalHeights.motherCm != null ? toDisplay(parentalHeights.motherCm, 'height', unitSystem) : null,
      fatherHeight: parentalHeights.fatherCm != null ? toDisplay(parentalHeights.fatherCm, 'height', unitSystem) : null,
      predictedHeight: toDisplay(prediction.predicted, 'height', unitSystem)
    };
  };

  const projectionChart = buildProjectionData();

  // ========================== RENDER ==========================
  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="start" flexWrap="wrap" gap={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h3" gutterBottom>
            Growth Chart
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Track your child's growth against WHO percentile curves (0–36 months).
          </Typography>
        </Box>
        {percentileRange && (
          <Chip
            label={`Current: ${percentileRange} percentile`}
            color="primary"
            variant="outlined"
          />
        )}
      </Stack>

      {/* Global controls */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <ToggleButtonGroup
          value={sex}
          exclusive
          onChange={(_, val) => val && setSex(val)}
          size="small"
        >
          <ToggleButton value="female">Girl</ToggleButton>
          <ToggleButton value="male">Boy</ToggleButton>
        </ToggleButtonGroup>

        <ToggleButtonGroup
          value={unitSystem}
          exclusive
          onChange={handleUnitSystemChange}
          size="small"
        >
          <ToggleButton value="metric">kg / cm</ToggleButton>
          <ToggleButton value="imperial">lbs / in</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {/* Sub-tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={subTab}
          onChange={(_, v) => setSubTab(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<ShowChartIcon />} iconPosition="start" label="Percentiles" />
          <Tab icon={<SpeedIcon />} iconPosition="start" label="Velocity & BMI" />
          <Tab icon={<FitnessCenterIcon />} iconPosition="start" label="Weight / Height" />
          <Tab icon={<FamilyRestroomIcon />} iconPosition="start" label="Adult Prediction" />
        </Tabs>
      </Box>

      {/* =================== TAB 0: Percentiles =================== */}
      {subTab === 0 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Add Measurement
              </Typography>
              <Stack direction="row" spacing={2} alignItems="start" flexWrap="wrap">
                <ToggleButtonGroup
                  value={metric}
                  exclusive
                  onChange={(_, val) => val && setMetric(val)}
                  size="small"
                >
                  <ToggleButton value="weight">Weight</ToggleButton>
                  <ToggleButton value="height">Height</ToggleButton>
                </ToggleButtonGroup>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Age (months)</InputLabel>
                  <Select
                    value={newAge}
                    label="Age (months)"
                    onChange={(e) => setNewAge(e.target.value)}
                  >
                    {Array.from({ length: 37 }, (_, i) => (
                      <MenuItem key={i} value={String(i)}>
                        {i} months
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label={`${metric === 'weight' ? 'Weight' : 'Height'} (${unit})`}
                  size="small"
                  type="number"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  sx={{ width: 160 }}
                />
                <Button
                  variant="contained"
                  onClick={handleAddMeasurement}
                  disabled={!newAge || !newValue}
                >
                  Add
                </Button>
              </Stack>

              {measurements[metric].length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                    Recorded {metric === 'weight' ? 'Weights' : 'Heights'}
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {measurements[metric].map((m) => (
                      <Chip
                        key={m.ageMonths}
                        label={`${m.ageMonths}m: ${toDisplay(m.value, metric, unitSystem)} ${unit}`}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <ResponsiveContainer width="100%" height={420}>
                <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="age"
                    label={{ value: 'Age (months)', position: 'insideBottomRight', offset: -5 }}
                    tickFormatter={(v) => `${v}m`}
                  />
                  <YAxis
                    label={{ value: yLabel, angle: -90, position: 'insideLeft', offset: 5 }}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      const labels: Record<string, string> = {
                        p3: '3rd percentile',
                        p15: '15th percentile',
                        p50: '50th percentile',
                        p85: '85th percentile',
                        p97: '97th percentile',
                        childValue: 'Your child'
                      };
                      return [`${value} ${unit}`, labels[String(name)] || String(name)];
                    }}
                    labelFormatter={(label) => `Age: ${label} months`}
                  />
                  <Legend
                    formatter={(value) => {
                      const labels: Record<string, string> = {
                        p3: '3rd',
                        p15: '15th',
                        p50: '50th',
                        p85: '85th',
                        p97: '97th',
                        childValue: 'Your child'
                      };
                      return labels[value] || value;
                    }}
                  />

                  <Area type="monotone" dataKey="p97" stroke="none" fill="#E8F5E9" fillOpacity={0.4} legendType="none" />
                  <Area type="monotone" dataKey="p3" stroke="none" fill="#FFFFFF" fillOpacity={1} legendType="none" />

                  <Line type="monotone" dataKey="p3" stroke="#BDBDBD" strokeDasharray="4 4" dot={false} strokeWidth={1} />
                  <Line type="monotone" dataKey="p15" stroke="#9E9E9E" strokeDasharray="4 4" dot={false} strokeWidth={1} />
                  <Line type="monotone" dataKey="p50" stroke="#4CAF50" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="p85" stroke="#9E9E9E" strokeDasharray="4 4" dot={false} strokeWidth={1} />
                  <Line type="monotone" dataKey="p97" stroke="#BDBDBD" strokeDasharray="4 4" dot={false} strokeWidth={1} />

                  <Scatter dataKey="childValue" fill="#FF5722" stroke="#FFFFFF" strokeWidth={2} r={6} name="childValue" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {percentileRange && measurements[metric].length >= 2 && (
            <AiInsight
              title="What does this mean?"
              contextKey={`percentile-${metric}-${sex}-${percentileRange}-${measurements[metric].length}`}
              prompt={`My ${sex === 'male' ? 'boy' : 'girl'} infant's ${metric} is tracking in the ${percentileRange} percentile on WHO growth charts (0-36 months). Their latest ${metric} is ${toDisplay(measurements[metric].at(-1)!.value, metric, unitSystem)} ${unit} at ${measurements[metric].at(-1)!.ageMonths} months old. They have ${measurements[metric].length} recorded measurements. What does the ${percentileRange} percentile mean for a baby this age? Is this within normal range? What should parents know? Keep the answer to 3-4 short paragraphs.`}
              trigger={insightTrigger}
            />
          )}
        </Box>
      )}

      {/* =================== TAB 1: Velocity & BMI =================== */}
      {subTab === 1 && (
        <GrowthInsights
          measurements={measurements}
          sex={sex}
          unitSystem={unitSystem}
          view="velocity-bmi"
        />
      )}

      {/* =================== TAB 2: Weight-for-Height =================== */}
      {subTab === 2 && (
        <GrowthInsights
          measurements={measurements}
          sex={sex}
          unitSystem={unitSystem}
          view="weight-for-height"
        />
      )}

      {/* =================== TAB 3: Adult Prediction =================== */}
      {subTab === 3 && (
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
            <FamilyRestroomIcon sx={{ color: '#7B1FA2' }} />
            <Box>
              <Typography variant="h5">
                Predicted Adult Height
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Enter parental heights to estimate your child's adult height.
              </Typography>
            </Box>
          </Stack>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="start" flexWrap="wrap" sx={{ mb: 2 }}>
                <TextField
                  label="Mother's height"
                  size="small"
                  type="number"
                  value={motherInput}
                  onChange={(e) => {
                    setMotherInput(e.target.value);
                    handleParentalHeightSave('motherCm', e.target.value);
                  }}
                  sx={{ width: 180 }}
                  slotProps={{
                    input: {
                      endAdornment: <InputAdornment position="end">{heightUnit}</InputAdornment>
                    }
                  }}
                  placeholder={unitSystem === 'metric' ? 'e.g. 165' : 'e.g. 65'}
                />
                <TextField
                  label="Father's height"
                  size="small"
                  type="number"
                  value={fatherInput}
                  onChange={(e) => {
                    setFatherInput(e.target.value);
                    handleParentalHeightSave('fatherCm', e.target.value);
                  }}
                  sx={{ width: 180 }}
                  slotProps={{
                    input: {
                      endAdornment: <InputAdornment position="end">{heightUnit}</InputAdornment>
                    }
                  }}
                  placeholder={unitSystem === 'metric' ? 'e.g. 178' : 'e.g. 70'}
                />
                <Button
                  variant="contained"
                  onClick={() => {
                    handleParentalHeightSave('motherCm', motherInput);
                    handleParentalHeightSave('fatherCm', fatherInput);
                    setPredictionInsightTrigger((prev) => prev + 1);
                  }}
                  disabled={!motherInput || !fatherInput}
                >
                  Add
                </Button>
              </Stack>

              {prediction && (
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    bgcolor: '#F3E5F5',
                    border: '1px solid #CE93D8'
                  }}
                >
                  <Typography variant="h6" sx={{ color: '#6A1B9A', mb: 1 }}>
                    Predicted adult height ({sex === 'male' ? 'boy' : 'girl'})
                  </Typography>
                  <Stack direction="row" spacing={4} alignItems="baseline" flexWrap="wrap">
                    <Box>
                      <Typography variant="h3" sx={{ color: '#7B1FA2' }}>
                        {displayHeight(prediction.predicted, unitSystem)}
                      </Typography>
                      {unitSystem === 'metric' && (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          ≈ {cmToFtIn(prediction.predicted)}
                        </Typography>
                      )}
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Target range
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {displayHeight(prediction.low, unitSystem)} – {displayHeight(prediction.high, unitSystem)}
                      </Typography>
                      {unitSystem === 'metric' && (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          ≈ {cmToFtIn(prediction.low)} – {cmToFtIn(prediction.high)}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </Box>
              )}

              {!prediction && (motherInput || fatherInput) && (
                <Alert severity="info" variant="outlined" sx={{ mt: 1 }}>
                  Enter both parental heights to see a prediction and projection chart.
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Projection chart */}
          {projectionChart && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Height Projection
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                  Your child's recorded heights mapped against the projected growth curve toward predicted adult height.
                </Typography>
                <ResponsiveContainer width="100%" height={380}>
                  <ComposedChart data={projectionChart.data} margin={{ top: 20, right: 30, bottom: 10, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="label"
                      label={{ value: 'Age', position: 'insideBottomRight', offset: -5 }}
                    />
                    <YAxis
                      label={{ value: `Height (${heightUnit})`, angle: -90, position: 'insideLeft', offset: 5 }}
                    />
                    <Tooltip
                      formatter={(value, name) => {
                        const labels: Record<string, string> = {
                          projected: 'Projected height',
                          childValue: 'Recorded height',
                          targetLow: 'Target range low',
                          targetHigh: 'Target range high'
                        };
                        return [`${value} ${heightUnit}`, labels[String(name)] || String(name)];
                      }}
                    />
                    <Legend
                      formatter={(value) => {
                        const labels: Record<string, string> = {
                          projected: 'Projected',
                          childValue: 'Recorded',
                          targetHigh: 'Target range'
                        };
                        return labels[value] || value;
                      }}
                    />

                    <Area type="monotone" dataKey="targetHigh" stroke="none" fill="#E1BEE7" fillOpacity={0.3} name="targetHigh" />
                    <Area type="monotone" dataKey="targetLow" stroke="none" fill="#FFFFFF" fillOpacity={1} legendType="none" />

                    <Line type="monotone" dataKey="projected" stroke="#7B1FA2" strokeWidth={2} dot={false} strokeDasharray="6 3" name="projected" />

                    {projectionChart.motherHeight != null && (
                      <ReferenceLine
                        y={projectionChart.motherHeight}
                        stroke="#E91E63"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        label={{ value: `Mother: ${projectionChart.motherHeight} ${heightUnit}`, fill: '#E91E63', fontSize: 11, position: 'right' }}
                      />
                    )}
                    {projectionChart.fatherHeight != null && (
                      <ReferenceLine
                        y={projectionChart.fatherHeight}
                        stroke="#1565C0"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        label={{ value: `Father: ${projectionChart.fatherHeight} ${heightUnit}`, fill: '#1565C0', fontSize: 11, position: 'right' }}
                      />
                    )}
                    <ReferenceLine
                      y={projectionChart.predictedHeight}
                      stroke="#7B1FA2"
                      strokeWidth={1}
                      strokeDasharray="2 2"
                      label={{ value: `Predicted: ${projectionChart.predictedHeight} ${heightUnit}`, fill: '#7B1FA2', fontSize: 11, position: 'left' }}
                    />

                    <Scatter dataKey="childValue" fill="#FF5722" stroke="#FFFFFF" strokeWidth={2} r={6} name="childValue" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Alert severity="info" variant="standard">
            Based on the mid-parental height (Tanner) method. This is an estimate — actual adult height is
            influenced by nutrition, health, and other genetic factors. The target range is ±8.5 cm (±3.3 in).
          </Alert>

          {prediction && (
            <AiInsight
              title="Understanding this prediction"
              contextKey={`prediction-${sex}-${prediction.predicted}-${prediction.low}-${prediction.high}`}
              prompt={`Using the mid-parental height (Tanner) method, my ${sex === 'male' ? 'son' : 'daughter'}'s predicted adult height is ${displayHeight(prediction.predicted, unitSystem)} with a target range of ${displayHeight(prediction.low, unitSystem)} to ${displayHeight(prediction.high, unitSystem)}. Mother's height is ${parentalHeights.motherCm} cm and father's height is ${parentalHeights.fatherCm} cm. How accurate is the mid-parental height method? What factors beyond genetics influence final adult height? What can parents do during childhood to support healthy growth toward this potential? Keep the answer to 3-4 short paragraphs.`}
              trigger={predictionInsightTrigger}
            />
          )}
        </Box>
      )}
    </Box>
  );
};

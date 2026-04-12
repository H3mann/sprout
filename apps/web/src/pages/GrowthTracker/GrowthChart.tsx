import { useEffect, useRef, useState } from 'react';
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
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import MonitorWeightIcon from '@mui/icons-material/MonitorWeight';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import SpeedIcon from '@mui/icons-material/Speed';

import { useChildren } from '../../context/ChildContext';
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

const emptyMeasurements: Record<Metric, Measurement[]> = {
  weight: [],
  height: []
};

const formatAge = (months: number): string => {
  if (months < 24) return `${months} months`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m ? `${y}y ${m}m` : `${y} years`;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
const CompactTooltip = ({ active, payload, label, unit }: any) => {
  if (!active || !payload?.length) return null;
  const data: Record<string, number> = {};
  payload.forEach((entry: any) => {
    if (entry.value != null) data[entry.dataKey] = entry.value;
  });

  return (
    <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1.5, px: 1.5, py: 1, boxShadow: 2, minWidth: 140 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
        {formatAge(Number(label))}
      </Typography>
      {data.childValue != null && (
        <Typography variant="body2" fontWeight={700} sx={{ color: '#FF5722' }}>
          Your child: {data.childValue} {unit}
        </Typography>
      )}
      {data.projected != null && (
        <Typography variant="body2" fontWeight={600} sx={{ color: '#7B1FA2' }}>
          Projected: {data.projected} {unit}
        </Typography>
      )}
      {data.p50 != null && (
        <Typography variant="body2" sx={{ color: '#4CAF50' }}>
          50th %ile: {data.p50} {unit}
        </Typography>
      )}
      {data.p3 != null && data.p97 != null && (
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Typical range: {data.p3}–{data.p97} {unit}
        </Typography>
      )}
    </Box>
  );
};
/* eslint-enable @typescript-eslint/no-explicit-any */

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
  const { children, activeChild, getAgeMonths } = useChildren();

  const [subTab, setSubTab] = useState(0);
  const [metric, setMetric] = useState<Metric>('height');
  const [sex, setSex] = useState<Sex>('female');
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(
    () => (localStorage.getItem('sprout_unit_system') as UnitSystem) || 'metric'
  );
  const [measurements, setMeasurements] = useState(emptyMeasurements);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [newAge, setNewAge] = useState('');
  const [newValue, setNewValue] = useState('');

  // Auto-select active child on first mount only
  useEffect(() => {
    if (activeChild && selectedChildId === null) {
      setSelectedChildId(activeChild.id);
    }
  }, [activeChild, selectedChildId]);

  // When a child is selected, populate their profile data, set sex, and pre-fill inputs
  // When "None" is selected, clear everything for free-form entry
  useEffect(() => {
    const child = children.find((c) => c.id === selectedChildId);
    if (!child) {
      setNewAge('');
      setNewValue('');
      setMeasurements(emptyMeasurements);
      return;
    }

    if (child.gender === 'male' || child.gender === 'female') {
      setSex(child.gender);
    }

    const ageMonths = getAgeMonths(child);
    const today = new Date().toISOString().split('T')[0];
    const newWeight: Measurement[] = [];
    const newHeight: Measurement[] = [];

    if (child.weightKg != null && child.weightKg > 0) {
      newWeight.push({ ageMonths, value: child.weightKg, date: today });
    }
    if (child.heightCm != null && child.heightCm > 0) {
      newHeight.push({ ageMonths, value: child.heightCm, date: today });
    }

    setMeasurements({ weight: newWeight, height: newHeight });

    // Pre-fill the input fields
    setNewAge(String(ageMonths));
    const profileValue = metric === 'weight' ? child.weightKg : child.heightCm;
    if (profileValue != null && profileValue > 0) {
      setNewValue(String(toDisplay(profileValue, metric, unitSystem)));
    } else {
      setNewValue('');
    }
  }, [selectedChildId, children, getAgeMonths]);
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
  const [weightInsightTrigger, setWeightInsightTrigger] = useState(0);
  const [showProjection, setShowProjection] = useState(true);
  const insightRef = useRef<HTMLDivElement>(null);

  // Scroll to insight area when any insight is triggered
  useEffect(() => {
    if (insightTrigger > 0 || predictionInsightTrigger > 0 || weightInsightTrigger > 0) {
      setTimeout(() => {
        insightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    }
  }, [insightTrigger, predictionInsightTrigger, weightInsightTrigger]);

  const heightUnit = getUnit('height', unitSystem);

  // Percentile chart data
  const percentileData = buildPercentileData(getDataset(metric, sex), metric, unitSystem);
  const unit = getUnit(metric, unitSystem);
  const yLabel = getYLabel(metric, unitSystem);

  const chartData = (() => {
    // Start with percentile rows, attaching any matching child measurement
    const data = percentileData.map((pRow) => {
      const measurement = measurements[metric].find((m) => m.ageMonths === pRow.age);
      return {
        ...pRow,
        childValue: measurement ? toDisplay(measurement.value, metric, unitSystem) : null
      };
    });

    // Add child measurements that don't land on an exact percentile age,
    // interpolating percentile values so the bands/lines stay continuous
    const percentileAges = new Set(percentileData.map((p) => p.age));
    measurements[metric]
      .filter((m) => !percentileAges.has(m.ageMonths))
      .forEach((m) => {
        const age = m.ageMonths;
        // Find surrounding percentile rows for interpolation
        let before = percentileData[0];
        let after = percentileData[percentileData.length - 1];
        for (let i = 0; i < percentileData.length - 1; i++) {
          if (percentileData[i].age <= age && percentileData[i + 1].age >= age) {
            before = percentileData[i];
            after = percentileData[i + 1];
            break;
          }
        }
        const range = after.age - before.age;
        const t = range === 0 ? 0 : (age - before.age) / range;
        const lerp = (a: number, b: number) => Math.round((a + (b - a) * t) * 100) / 100;

        data.push({
          age,
          p3: lerp(before.p3, after.p3),
          p15: lerp(before.p15, after.p15),
          p50: lerp(before.p50, after.p50),
          p85: lerp(before.p85, after.p85),
          p97: lerp(before.p97, after.p97),
          childValue: toDisplay(m.value, metric, unitSystem)
        });
      });

    return data.sort((a, b) => a.age - b.age);
  })();

  const handleAddMeasurement = () => {
    const age = parseInt(newAge, 10);
    const rawValue = parseFloat(newValue);
    if (isNaN(age) || isNaN(rawValue) || age < 0 || age > 192) return;

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

  // Combined chart: percentile bands (0-16y) + projection line (0-18y) on single axis
  const buildCombinedChartData = () => {
    if (!prediction) return null;

    const baseCurve = sex === 'male' ? PROJECTION_P50_BOYS_CM : PROJECTION_P50_GIRLS_CM;
    const standardAdult = baseCurve[baseCurve.length - 1];
    const scaleFactor = prediction.predicted / standardAdult;

    // Build set of all month points we need
    const monthSet = new Set<number>();
    // Percentile data points (0-192m)
    const heightData = getDataset('height', sex);
    heightData.forEach((row) => monthSet.add(row[0]));
    // Projection data points (in months)
    PROJECTION_AGES_YEARS.forEach((y) => monthSet.add(y * 12));
    // Child measurement ages
    measurements.height.forEach((m) => monthSet.add(m.ageMonths));

    const allMonths = Array.from(monthSet).sort((a, b) => a - b);

    // Build percentile lookup and sorted array for interpolation
    const percentileLookup = new Map(heightData.map((row) => [row[0], row]));
    const sortedPercentileRows = [...heightData].sort((a, b) => a[0] - b[0]);

    // Build projection lookup
    const projLookup = new Map<number, { projected: number; low: number; high: number }>();
    PROJECTION_AGES_YEARS.forEach((ageYears, i) => {
      const projectedCm = baseCurve[i] * scaleFactor;
      projLookup.set(ageYears * 12, {
        projected: projectedCm,
        low: projectedCm * (prediction.low / prediction.predicted),
        high: projectedCm * (prediction.high / prediction.predicted)
      });
    });

    const childHeightMeasurements = measurements.height;

    // Interpolate percentile values for ages between data points
    const interpolatePercentile = (age: number) => {
      if (age <= sortedPercentileRows[0][0]) return sortedPercentileRows[0];
      if (age >= sortedPercentileRows[sortedPercentileRows.length - 1][0])
        return sortedPercentileRows[sortedPercentileRows.length - 1];
      for (let i = 0; i < sortedPercentileRows.length - 1; i++) {
        const before = sortedPercentileRows[i];
        const after = sortedPercentileRows[i + 1];
        if (before[0] <= age && after[0] >= age) {
          const range = after[0] - before[0];
          const t = range === 0 ? 0 : (age - before[0]) / range;
          const lerp = (a: number, b: number) => Math.round((a + (b - a) * t) * 100) / 100;
          return [age, lerp(before[1], after[1]), lerp(before[2], after[2]), lerp(before[3], after[3]), lerp(before[4], after[4]), lerp(before[5], after[5])];
        }
      }
      return null;
    };

    const data = allMonths.map((ageMonths) => {
      let pRow = percentileLookup.get(ageMonths) ?? null;
      // Interpolate if no exact match but within percentile range
      if (!pRow && ageMonths <= sortedPercentileRows[sortedPercentileRows.length - 1][0]) {
        pRow = interpolatePercentile(ageMonths);
      }
      const proj = projLookup.get(ageMonths);
      const childMeas = childHeightMeasurements.find((m) => m.ageMonths === ageMonths);

      return {
        age: ageMonths,
        // Percentile bands (0-192m)
        ...(pRow ? {
          p3: toDisplay(pRow[1], 'height', unitSystem),
          p15: toDisplay(pRow[2], 'height', unitSystem),
          p50: toDisplay(pRow[3], 'height', unitSystem),
          p85: toDisplay(pRow[4], 'height', unitSystem),
          p97: toDisplay(pRow[5], 'height', unitSystem),
        } : {}),
        // Projection line (0-18y)
        ...(proj ? {
          projected: toDisplay(proj.projected, 'height', unitSystem),
          projLow: toDisplay(proj.low, 'height', unitSystem),
          projHigh: toDisplay(proj.high, 'height', unitSystem),
        } : {}),
        // Child's actual data
        childValue: childMeas ? toDisplay(childMeas.value, 'height', unitSystem) : null,
      };
    });

    return {
      data,
      motherHeight: parentalHeights.motherCm != null ? toDisplay(parentalHeights.motherCm, 'height', unitSystem) : null,
      fatherHeight: parentalHeights.fatherCm != null ? toDisplay(parentalHeights.fatherCm, 'height', unitSystem) : null,
      predictedHeight: toDisplay(prediction.predicted, 'height', unitSystem),
    };
  };

  const combinedChart = (showProjection && metric === 'height') ? buildCombinedChartData() : null;

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
            Track your child's growth against WHO/CDC percentile curves (0–16 years).
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
      <Stack direction="row" spacing={2} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap alignItems="center">
        {children.length > 0 && (
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Child Profile</InputLabel>
            <Select
              value={selectedChildId ?? ''}
              label="Child Profile"
              onChange={(e) => setSelectedChildId(e.target.value || '')}
              startAdornment={<PersonIcon sx={{ mr: 0.5, color: 'text.secondary', fontSize: 20 }} />}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {children.map((child) => (
                <MenuItem key={child.id} value={child.id}>
                  {child.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

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
          <Tab icon={<FitnessCenterIcon />} iconPosition="start" label="Weight / Height" />
          <Tab icon={<SpeedIcon />} iconPosition="start" label="Velocity & BMI" />
        </Tabs>
      </Box>

      {/* =================== TAB 0: Percentiles & Prediction =================== */}
      {subTab === 0 && (
        <Box>
          {/* Height / Weight toggle */}
          <ToggleButtonGroup
            value={metric}
            exclusive
            onChange={(_, val) => {
              if (!val) return;
              setMetric(val);
              const child = children.find((c) => c.id === selectedChildId);
              if (child) {
                const profileValue = val === 'weight' ? child.weightKg : child.heightCm;
                if (profileValue != null && profileValue > 0) {
                  setNewValue(String(toDisplay(profileValue, val, unitSystem)));
                } else {
                  setNewValue('');
                }
              }
            }}
            size="small"
            sx={{ mb: 3 }}
          >
            <ToggleButton value="height">Height</ToggleButton>
            <ToggleButton value="weight">Weight</ToggleButton>
          </ToggleButtonGroup>

          {/* Add Measurement */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Add Measurement
              </Typography>
              <Stack direction="row" spacing={2} alignItems="start" flexWrap="wrap">
                {selectedChildId ? (
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Age (months)</InputLabel>
                    <Select
                      value={newAge}
                      label="Age (months)"
                      onChange={(e) => setNewAge(e.target.value)}
                    >
                      {Array.from({ length: 193 }, (_, i) => (
                        <MenuItem key={i} value={String(i)}>
                          {i < 24 ? `${i} months` : `${Math.floor(i / 12)}y ${i % 12}m`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <TextField
                    label="Age (months)"
                    size="small"
                    type="number"
                    value={newAge}
                    onChange={(e) => setNewAge(e.target.value)}
                    sx={{ width: 140 }}
                  />
                )}
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

          {/* ---- HEIGHT: Parental Heights & Adult Prediction ---- */}
          {metric === 'height' && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Adult Height Prediction
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                  Enter parental heights to estimate your child's adult height and overlay a projection on the chart.
                </Typography>
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
                    Enter both parental heights to see a prediction.
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Chart controls + AI insight actions above the chart */}
          {metric === 'height' && (
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
              {prediction && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={showProjection}
                      onChange={(e) => setShowProjection(e.target.checked)}
                      color="secondary"
                    />
                  }
                  label="Show projection to adulthood (0–18 years)"
                  sx={{ mr: 'auto' }}
                />
              )}
              {prediction && (
                <Chip
                  icon={<AutoAwesomeIcon />}
                  label="Understand prediction"
                  onClick={() => setPredictionInsightTrigger((prev) => prev + 1)}
                  variant="outlined"
                  color="secondary"
                  clickable
                />
              )}
              {percentileRange && measurements.height.length >= 1 && (
                <Chip
                  icon={<SearchIcon />}
                  label="Research height info"
                  onClick={() => setInsightTrigger((prev) => prev + 1)}
                  variant="outlined"
                  color="info"
                  clickable
                />
              )}
            </Stack>
          )}

          {metric === 'weight' && measurements.weight.length >= 1 && (
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
              <Chip
                icon={<MonitorWeightIcon />}
                label="Weight insight"
                onClick={() => setWeightInsightTrigger((prev) => prev + 1)}
                variant="outlined"
                color="success"
                clickable
              />
              {percentileRange && (
                <Chip
                  icon={<SearchIcon />}
                  label="Research weight info"
                  onClick={() => setInsightTrigger((prev) => prev + 1)}
                  variant="outlined"
                  color="info"
                  clickable
                />
              )}
            </Stack>
          )}

          {/* Combined chart: percentiles + adult projection (height only) */}
          {metric === 'height' && combinedChart && showProjection ? (
            <Card>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <ResponsiveContainer width="100%" height={460}>
                  <ComposedChart data={combinedChart.data} margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="age"
                      label={{ value: 'Age (months)', position: 'insideBottomRight', offset: -5 }}
                      tickFormatter={(v) => v < 24 ? `${v}m` : `${Math.round(v / 12)}y`}
                    />
                    <YAxis
                      label={{ value: `Height (${heightUnit})`, angle: -90, position: 'insideLeft', offset: 5 }}
                    />
                    <Tooltip content={<CompactTooltip unit={heightUnit} />} />
                    <Legend
                      formatter={(value) => {
                        const labels: Record<string, string> = {
                          p3: '3rd',
                          p15: '15th',
                          p50: '50th (WHO)',
                          p85: '85th',
                          p97: '97th',
                          projected: 'Projected',
                          childValue: 'Your child'
                        };
                        return labels[value] || value;
                      }}
                    />

                    {/* WHO/CDC percentile bands (0-16y) */}
                    <Area type="monotone" dataKey="p97" stroke="none" fill="#E8F5E9" fillOpacity={0.4} legendType="none" connectNulls={false} />
                    <Area type="monotone" dataKey="p3" stroke="none" fill="#FFFFFF" fillOpacity={1} legendType="none" connectNulls={false} />
                    <Line type="monotone" dataKey="p3" stroke="#BDBDBD" strokeDasharray="4 4" dot={false} strokeWidth={1} connectNulls={false} />
                    <Line type="monotone" dataKey="p15" stroke="#9E9E9E" strokeDasharray="4 4" dot={false} strokeWidth={1} connectNulls={false} />
                    <Line type="monotone" dataKey="p50" stroke="#4CAF50" dot={false} strokeWidth={2} connectNulls={false} />
                    <Line type="monotone" dataKey="p85" stroke="#9E9E9E" strokeDasharray="4 4" dot={false} strokeWidth={1} connectNulls={false} />
                    <Line type="monotone" dataKey="p97" stroke="#BDBDBD" strokeDasharray="4 4" dot={false} strokeWidth={1} connectNulls={false} />

                    {/* Projection band & line */}
                    <Area type="monotone" dataKey="projHigh" stroke="none" fill="#E1BEE7" fillOpacity={0.3} legendType="none" connectNulls />
                    <Area type="monotone" dataKey="projLow" stroke="none" fill="#FFFFFF" fillOpacity={1} legendType="none" connectNulls />
                    <Line type="monotone" dataKey="projected" stroke="#7B1FA2" strokeWidth={2} dot={false} strokeDasharray="6 3" connectNulls />

                    {/* Parent reference lines */}
                    {combinedChart.motherHeight != null && (
                      <ReferenceLine
                        y={combinedChart.motherHeight}
                        stroke="#E91E63"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        label={{ value: `Mother: ${combinedChart.motherHeight} ${heightUnit}`, fill: '#E91E63', fontSize: 11, position: 'right' }}
                      />
                    )}
                    {combinedChart.fatherHeight != null && (
                      <ReferenceLine
                        y={combinedChart.fatherHeight}
                        stroke="#1565C0"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        label={{ value: `Father: ${combinedChart.fatherHeight} ${heightUnit}`, fill: '#1565C0', fontSize: 11, position: 'right' }}
                      />
                    )}
                    <ReferenceLine
                      y={combinedChart.predictedHeight}
                      stroke="#7B1FA2"
                      strokeWidth={1}
                      strokeDasharray="2 2"
                      label={{ value: `Predicted: ${combinedChart.predictedHeight} ${heightUnit}`, fill: '#7B1FA2', fontSize: 11, position: 'left' }}
                    />

                    <Scatter dataKey="childValue" fill="#FF5722" stroke="#FFFFFF" strokeWidth={2} r={6} name="childValue" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : (
            /* Standard percentile-only chart (height without projection, or weight) */
            <Card>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <ResponsiveContainer width="100%" height={420}>
                  <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="age"
                      label={{ value: 'Age', position: 'insideBottomRight', offset: -5 }}
                      tickFormatter={(v) => v < 24 ? `${v}m` : `${Math.round(v / 12)}y`}
                    />
                    <YAxis
                      label={{ value: yLabel, angle: -90, position: 'insideLeft', offset: 5 }}
                    />
                    <Tooltip content={<CompactTooltip unit={unit} />} />
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
          )}

          {/* ---- HEIGHT: Tanner disclaimer + prediction insights ---- */}
          {metric === 'height' && prediction && (
            <Alert severity="info" variant="standard" sx={{ mt: 2 }}>
              Based on the mid-parental height (Tanner) method. This is an estimate — actual adult height is
              influenced by nutrition, health, and other genetic factors. The target range is ±8.5 cm (±3.3 in).
            </Alert>
          )}

          <div ref={insightRef} />

          {metric === 'height' && prediction && predictionInsightTrigger > 0 && (
            <Card
              sx={{
                mt: 3,
                border: '1px solid',
                borderColor: 'secondary.light',
                background: 'linear-gradient(135deg, #faf5ff 0%, #f3e5f5 100%)'
              }}
            >
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <AutoAwesomeIcon sx={{ color: '#7B1FA2', fontSize: 20 }} />
                  <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                    Understanding this prediction
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ lineHeight: 1.7, mb: 1.5 }}>
                  This prediction uses the mid-parental height method (also called the Tanner method), one of the most widely used clinical tools for estimating a child's adult height. It works by averaging both parents' heights and adjusting for the child's sex — adding 6.5 cm (2.5 in) for boys or subtracting 6.5 cm for girls. The result is the child's expected adult height, with a target range of ±8.5 cm (±3.3 in) to account for natural variation.
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.7, mb: 1.5 }}>
                  The method is reasonably accurate for most children, but it is an estimate. Studies show it accounts for about 40–60% of the variation in adult height. Genetics from extended family, nutrition, overall health, sleep quality, physical activity, and hormonal factors all play a role in determining where a child falls within the predicted range.
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                  To support healthy growth, focus on a balanced diet rich in protein, calcium, and vitamins, ensure adequate sleep (growth hormone is primarily released during deep sleep), and encourage regular physical activity. If your child's growth pattern changes significantly or falls outside expected percentiles, consult your pediatrician for a more detailed assessment.
                </Typography>
              </CardContent>
            </Card>
          )}

          {metric === 'height' && percentileRange && measurements.height.length >= 1 && insightTrigger > 0 && (
            <AiInsight
              title="What does this mean?"
              contextKey={`percentile-height-${sex}-${percentileRange}-${measurements.height.length}`}
              prompt={`My ${sex === 'male' ? 'boy' : 'girl'} child's height is tracking in the ${percentileRange} percentile on WHO/CDC growth charts. Their latest height is ${toDisplay(measurements.height.at(-1)!.value, 'height', unitSystem)} ${getUnit('height', unitSystem)} at ${measurements.height.at(-1)!.ageMonths} months old. They have ${measurements.height.length} recorded measurements. What does the ${percentileRange} percentile mean for a child this age? Is this within normal range? What should parents know? Keep the answer to 3-4 short paragraphs.`}
              trigger={insightTrigger}
            />
          )}

          {metric === 'weight' && measurements.weight.length >= 1 && weightInsightTrigger > 0 && (
            <AiInsight
              title="Weight insight"
              contextKey={`weight-${sex}-${measurements.weight.at(-1)!.ageMonths}-${measurements.weight.at(-1)!.value}`}
              prompt={`My ${sex === 'male' ? 'boy' : 'girl'} child weighs ${toDisplay(measurements.weight.at(-1)!.value, 'weight', unitSystem)} ${getUnit('weight', unitSystem)} at ${measurements.weight.at(-1)!.ageMonths} months old. Is this weight healthy for their age and sex? What is the typical weight range for a ${measurements.weight.at(-1)!.ageMonths}-month-old ${sex === 'male' ? 'boy' : 'girl'}? What nutritional or health considerations should parents be aware of at this age? Are there any signs to watch for that might indicate a weight concern? Keep the answer to 3-4 short paragraphs.`}
              trigger={weightInsightTrigger}
            />
          )}

          {metric === 'weight' && percentileRange && measurements.weight.length >= 1 && insightTrigger > 0 && (
            <AiInsight
              title="What does this mean?"
              contextKey={`percentile-weight-${sex}-${percentileRange}-${measurements.weight.length}`}
              prompt={`My ${sex === 'male' ? 'boy' : 'girl'} child's weight is tracking in the ${percentileRange} percentile on WHO/CDC growth charts. Their latest weight is ${toDisplay(measurements.weight.at(-1)!.value, 'weight', unitSystem)} ${getUnit('weight', unitSystem)} at ${measurements.weight.at(-1)!.ageMonths} months old. They have ${measurements.weight.length} recorded measurements. What does the ${percentileRange} percentile mean for a child this age? Is this within normal range? What should parents know? Keep the answer to 3-4 short paragraphs.`}
              trigger={insightTrigger}
            />
          )}
        </Box>
      )}

      {/* =================== TAB 1: Weight-for-Height =================== */}
      {subTab === 1 && (
        <GrowthInsights
          measurements={measurements}
          sex={sex}
          unitSystem={unitSystem}
          view="weight-for-height"
        />
      )}

      {/* =================== TAB 2: Velocity & BMI =================== */}
      {subTab === 2 && (
        <GrowthInsights
          measurements={measurements}
          sex={sex}
          unitSystem={unitSystem}
          view="velocity-bmi"
        />
      )}

    </Box>
  );
};

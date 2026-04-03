import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
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

interface Measurement {
  ageMonths: number;
  value: number;
  date: string;
}

const buildPercentileData = (rawData: number[][]) => {
  return rawData.map((row) => ({
    age: row[0],
    p3: row[1],
    p15: row[2],
    p50: row[3],
    p85: row[4],
    p97: row[5]
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

export const GrowthChart = () => {
  const [metric, setMetric] = useState<Metric>('weight');
  const [sex, setSex] = useState<Sex>('female');
  const [measurements, setMeasurements] = useState(initialMeasurements);
  const [newAge, setNewAge] = useState('');
  const [newValue, setNewValue] = useState('');

  const percentileData = buildPercentileData(getDataset(metric, sex));
  const unit = metric === 'weight' ? 'kg' : 'cm';
  const yLabel = metric === 'weight' ? 'Weight (kg)' : 'Height (cm)';

  const chartData = percentileData.map((pRow) => {
    const measurement = measurements[metric].find((m) => m.ageMonths === pRow.age);
    return {
      ...pRow,
      childValue: measurement?.value ?? null
    };
  });

  const handleAddMeasurement = () => {
    const age = parseInt(newAge, 10);
    const value = parseFloat(newValue);
    if (isNaN(age) || isNaN(value) || age < 0 || age > 36) return;

    setMeasurements((prev) => ({
      ...prev,
      [metric]: [
        ...prev[metric].filter((m) => m.ageMonths !== age),
        { ageMonths: age, value, date: new Date().toISOString().split('T')[0] }
      ].sort((a, b) => a.ageMonths - b.ageMonths)
    }));
    setNewAge('');
    setNewValue('');
  };

  const getPercentileForChild = () => {
    const latest = measurements[metric].at(-1);
    if (!latest) return null;

    const closestRow = percentileData.reduce((prev, curr) =>
      Math.abs(curr.age - latest.ageMonths) < Math.abs(prev.age - latest.ageMonths) ? curr : prev
    );

    if (latest.value <= closestRow.p3) return '<3rd';
    if (latest.value <= closestRow.p15) return '3rd–15th';
    if (latest.value <= closestRow.p50) return '15th–50th';
    if (latest.value <= closestRow.p85) return '50th–85th';
    if (latest.value <= closestRow.p97) return '85th–97th';
    return '>97th';
  };

  const percentileRange = getPercentileForChild();

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="start" flexWrap="wrap" gap={2} sx={{ mb: 3 }}>
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

      <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
        <ToggleButtonGroup
          value={metric}
          exclusive
          onChange={(_, val) => val && setMetric(val)}
          size="small"
        >
          <ToggleButton value="weight">Weight</ToggleButton>
          <ToggleButton value="height">Height</ToggleButton>
        </ToggleButtonGroup>

        <ToggleButtonGroup
          value={sex}
          exclusive
          onChange={(_, val) => val && setSex(val)}
          size="small"
        >
          <ToggleButton value="female">Girl</ToggleButton>
          <ToggleButton value="male">Boy</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <Card sx={{ mb: 3 }}>
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
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    p3: '3rd percentile',
                    p15: '15th percentile',
                    p50: '50th percentile',
                    p85: '85th percentile',
                    p97: '97th percentile',
                    childValue: 'Your child'
                  };
                  return [`${value} ${unit}`, labels[name] || name];
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

              <Area
                type="monotone"
                dataKey="p97"
                stroke="none"
                fill="#E8F5E9"
                fillOpacity={0.4}
                legendType="none"
              />
              <Area
                type="monotone"
                dataKey="p3"
                stroke="none"
                fill="#FFFFFF"
                fillOpacity={1}
                legendType="none"
              />

              <Line type="monotone" dataKey="p3" stroke="#BDBDBD" strokeDasharray="4 4" dot={false} strokeWidth={1} />
              <Line type="monotone" dataKey="p15" stroke="#9E9E9E" strokeDasharray="4 4" dot={false} strokeWidth={1} />
              <Line type="monotone" dataKey="p50" stroke="#4CAF50" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="p85" stroke="#9E9E9E" strokeDasharray="4 4" dot={false} strokeWidth={1} />
              <Line type="monotone" dataKey="p97" stroke="#BDBDBD" strokeDasharray="4 4" dot={false} strokeWidth={1} />

              <Scatter
                dataKey="childValue"
                fill="#FF5722"
                stroke="#FFFFFF"
                strokeWidth={2}
                r={6}
                name="childValue"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Add Measurement
          </Typography>
          <Stack direction="row" spacing={2} alignItems="start" flexWrap="wrap">
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
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                Recorded {metric === 'weight' ? 'Weights' : 'Heights'}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {measurements[metric].map((m) => (
                  <Chip
                    key={m.ageMonths}
                    label={`${m.ageMonths}m: ${m.value} ${unit}`}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

import { AiInsight } from './AiInsight';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import SpeedIcon from '@mui/icons-material/Speed';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Area,
  Bar,
  BarChart,
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
  BMI_BOYS,
  BMI_GIRLS,
  HEIGHT_BOYS_CM,
  HEIGHT_GIRLS_CM,
  WEIGHT_BOYS_KG,
  WEIGHT_GIRLS_KG,
  WFL_BOYS_KG,
  WFL_GIRLS_KG
} from '../../data/growthPercentiles';

type Metric = 'weight' | 'height';
type Sex = 'male' | 'female';
type UnitSystem = 'metric' | 'imperial';

interface Measurement {
  ageMonths: number;
  value: number;
  date: string;
}

const KG_TO_LBS = 2.20462;
const CM_TO_IN = 0.393701;

const toDisplayVal = (value: number, metricType: Metric, unitSystem: UnitSystem): number => {
  if (unitSystem === 'metric') return value;
  return metricType === 'weight'
    ? Math.round(value * KG_TO_LBS * 100) / 100
    : Math.round(value * CM_TO_IN * 100) / 100;
};

const getUnit = (metricType: Metric, unitSystem: UnitSystem): string => {
  if (unitSystem === 'metric') return metricType === 'weight' ? 'kg' : 'cm';
  return metricType === 'weight' ? 'lbs' : 'in';
};

// --- Percentile band helpers ---
const PERCENTILE_BANDS = ['<3rd', '3rd–15th', '15th–50th', '50th–85th', '85th–97th', '>97th'] as const;
type PercentileBand = (typeof PERCENTILE_BANDS)[number];

function getBand(value: number, row: { p3: number; p15: number; p50: number; p85: number; p97: number }): PercentileBand {
  if (value <= row.p3) return '<3rd';
  if (value <= row.p15) return '3rd–15th';
  if (value <= row.p50) return '15th–50th';
  if (value <= row.p85) return '50th–85th';
  if (value <= row.p97) return '85th–97th';
  return '>97th';
}

function bandIndex(band: PercentileBand): number {
  return PERCENTILE_BANDS.indexOf(band);
}

function findClosestRow<T extends { age: number }>(data: T[], ageMonths: number): T {
  return data.reduce((prev, curr) =>
    Math.abs(curr.age - ageMonths) < Math.abs(prev.age - ageMonths) ? curr : prev
  );
}

function buildRows(raw: number[][]) {
  return raw.map((r) => ({ age: r[0], p3: r[1], p15: r[2], p50: r[3], p85: r[4], p97: r[5] }));
}

// ========================== COMPONENT ==========================

type InsightView = 'velocity-bmi' | 'weight-for-height';

interface GrowthInsightsProps {
  measurements: Record<Metric, Measurement[]>;
  sex: Sex;
  unitSystem: UnitSystem;
  view: InsightView;
}

export const GrowthInsights = ({ measurements, sex, unitSystem, view }: GrowthInsightsProps) => {
  const weightUnit = getUnit('weight', unitSystem);
  const heightUnit = getUnit('height', unitSystem);
  const heightMeasurements = measurements.height;
  const weightMeasurements = measurements.weight;

  // ---- 1. Growth Velocity ----
  const buildVelocityData = (items: Measurement[], metricType: Metric) => {
    if (items.length < 2) return [];
    return items.slice(1).map((m, i) => {
      const prev = items[i];
      const dMonths = m.ageMonths - prev.ageMonths;
      if (dMonths <= 0) return null;
      const dValue = m.value - prev.value;
      const ratePerMonth = dValue / dMonths;
      return {
        period: `${prev.ageMonths}–${m.ageMonths}m`,
        rate: Math.round(toDisplayVal(Math.abs(ratePerMonth), metricType, unitSystem) * 100) / 100,
        sign: ratePerMonth >= 0 ? 'positive' : 'negative'
      };
    }).filter(Boolean) as { period: string; rate: number; sign: string }[];
  };

  const heightVelocity = buildVelocityData(heightMeasurements, 'height');
  const weightVelocity = buildVelocityData(weightMeasurements, 'weight');

  // ---- 2. Weight-for-Height ----
  const wflRef = sex === 'male' ? WFL_BOYS_KG : WFL_GIRLS_KG;
  const wflPercentiles = wflRef.map((r) => ({
    height: toDisplayVal(r[0], 'height', unitSystem),
    p3: toDisplayVal(r[1], 'weight', unitSystem),
    p15: toDisplayVal(r[2], 'weight', unitSystem),
    p50: toDisplayVal(r[3], 'weight', unitSystem),
    p85: toDisplayVal(r[4], 'weight', unitSystem),
    p97: toDisplayVal(r[5], 'weight', unitSystem)
  }));

  // Match height to weight measurements at the same age to plot on WFL chart
  const wflChildPoints = heightMeasurements
    .map((hm) => {
      const wm = weightMeasurements.find((w) => w.ageMonths === hm.ageMonths);
      if (!wm) return null;
      return {
        height: toDisplayVal(hm.value, 'height', unitSystem),
        childWeight: toDisplayVal(wm.value, 'weight', unitSystem),
        age: `${hm.ageMonths}m`
      };
    })
    .filter(Boolean) as { height: number; childWeight: number; age: string }[];

  // Merge child points into percentile data for combined chart
  const wflChartData = wflPercentiles.map((row) => {
    const match = wflChildPoints.find(
      (p) => Math.abs(p.height - row.height) < (unitSystem === 'metric' ? 3 : 1.5)
    );
    return { ...row, childWeight: match?.childWeight ?? null };
  });

  // ---- 3. BMI Percentile ----
  const bmiRef = sex === 'male' ? BMI_BOYS : BMI_GIRLS;
  const bmiPercentiles = bmiRef.map((r) => ({
    age: r[0],
    p3: r[1],
    p15: r[2],
    p50: r[3],
    p85: r[4],
    p97: r[5]
  }));

  const bmiChildPoints = heightMeasurements
    .map((hm) => {
      const wm = weightMeasurements.find((w) => w.ageMonths === hm.ageMonths);
      if (!wm || hm.value <= 0) return null;
      const heightM = hm.value / 100;
      const bmi = Math.round((wm.value / (heightM * heightM)) * 10) / 10;
      return { ageMonths: hm.ageMonths, bmi };
    })
    .filter(Boolean) as { ageMonths: number; bmi: number }[];

  const bmiChartData = bmiPercentiles.map((row) => {
    const match = bmiChildPoints.find((p) => p.ageMonths === row.age);
    return { ...row, childBmi: match?.bmi ?? null };
  });

  // ---- 4. Percentile Crossing Alerts ----
  const detectCrossings = () => {
    const alerts: { metric: string; from: PercentileBand; to: PercentileBand; fromAge: number; toAge: number; direction: 'up' | 'down' }[] = [];

    const checkMetric = (items: Measurement[], rawData: number[][], label: string) => {
      const rows = buildRows(rawData);
      if (items.length < 2) return;

      for (let i = 1; i < items.length; i++) {
        const prevRow = findClosestRow(rows, items[i - 1].ageMonths);
        const currRow = findClosestRow(rows, items[i].ageMonths);
        const prevBand = getBand(items[i - 1].value, prevRow);
        const currBand = getBand(items[i].value, currRow);
        const shift = Math.abs(bandIndex(currBand) - bandIndex(prevBand));

        if (shift >= 2) {
          alerts.push({
            metric: label,
            from: prevBand,
            to: currBand,
            fromAge: items[i - 1].ageMonths,
            toAge: items[i].ageMonths,
            direction: bandIndex(currBand) > bandIndex(prevBand) ? 'up' : 'down'
          });
        }
      }
    };

    const weightRaw = sex === 'male' ? WEIGHT_BOYS_KG : WEIGHT_GIRLS_KG;
    const heightRaw = sex === 'male' ? HEIGHT_BOYS_CM : HEIGHT_GIRLS_CM;
    checkMetric(weightMeasurements, weightRaw, 'Weight');
    checkMetric(heightMeasurements, heightRaw, 'Height');
    return alerts;
  };

  const crossingAlerts = detectCrossings();

  const hasMeasurements = heightMeasurements.length >= 2 || weightMeasurements.length >= 2;
  const hasPairedMeasurements = bmiChildPoints.length > 0;

  if (!hasMeasurements && !hasPairedMeasurements) {
    return (
      <Alert severity="info">
        Add at least 2 measurements (in the Percentiles tab) to see growth insights.
      </Alert>
    );
  }

  // =================== VIEW: velocity-bmi ===================
  if (view === 'velocity-bmi') {
    return (
      <Box>
        {/* Percentile Crossing Alerts */}
        {crossingAlerts.length > 0 && (
          <Box sx={{ mb: 3 }}>
            {crossingAlerts.map((alert, i) => (
              <Alert
                key={i}
                severity="warning"
                icon={<WarningAmberIcon />}
                sx={{ mb: 1 }}
              >
                <AlertTitle>
                  {alert.metric} percentile shift detected
                </AlertTitle>
                {alert.metric} moved from <strong>{alert.from}</strong> to <strong>{alert.to}</strong> percentile
                between {alert.fromAge}m and {alert.toAge}m.
                {alert.direction === 'down'
                  ? ' A significant downward shift may warrant discussion with your pediatrician.'
                  : ' A significant upward shift — worth mentioning at the next checkup.'}
              </Alert>
            ))}
          </Box>
        )}
        {crossingAlerts.length === 0 && hasMeasurements && (
          <Alert severity="success" sx={{ mb: 3 }} icon={false}>
            No significant percentile crossings detected — growth is tracking consistently.
          </Alert>
        )}

        {/* Growth Velocity */}
        {(heightVelocity.length > 0 || weightVelocity.length > 0) && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <SpeedIcon sx={{ color: '#2196F3' }} />
                <Typography variant="h5">Growth Velocity</Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                Rate of growth between consecutive measurements. Consistent velocity is more important than absolute size.
              </Typography>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                  gap: 3
                }}
              >
                {heightVelocity.length > 0 && (
                  <Box>
                    <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                      Height velocity ({heightUnit}/month)
                    </Typography>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={heightVelocity}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="period" fontSize={11} />
                        <YAxis fontSize={11} />
                        <Tooltip
                          formatter={(value) => [`${value} ${heightUnit}/mo`, 'Growth rate']}
                        />
                        <Bar dataKey="rate" fill="#2196F3" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                )}

                {weightVelocity.length > 0 && (
                  <Box>
                    <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                      Weight velocity ({weightUnit}/month)
                    </Typography>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={weightVelocity}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="period" fontSize={11} />
                        <YAxis fontSize={11} />
                        <Tooltip
                          formatter={(value) => [`${value} ${weightUnit}/mo`, 'Growth rate']}
                        />
                        <Bar dataKey="rate" fill="#4CAF50" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                )}
              </Box>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
                {heightVelocity.length >= 2 && (() => {
                  const last = heightVelocity[heightVelocity.length - 1].rate;
                  const prev = heightVelocity[heightVelocity.length - 2].rate;
                  const trend = last > prev ? 'Accelerating' : last < prev ? 'Decelerating' : 'Steady';
                  return (
                    <Chip
                      icon={last >= prev ? <TrendingUpIcon /> : <TrendingDownIcon />}
                      label={`Height: ${trend}`}
                      size="small"
                      color={trend === 'Decelerating' ? 'warning' : 'success'}
                      variant="outlined"
                    />
                  );
                })()}
                {weightVelocity.length >= 2 && (() => {
                  const last = weightVelocity[weightVelocity.length - 1].rate;
                  const prev = weightVelocity[weightVelocity.length - 2].rate;
                  const trend = last > prev ? 'Accelerating' : last < prev ? 'Decelerating' : 'Steady';
                  return (
                    <Chip
                      icon={last >= prev ? <TrendingUpIcon /> : <TrendingDownIcon />}
                      label={`Weight: ${trend}`}
                      size="small"
                      color={trend === 'Decelerating' ? 'warning' : 'success'}
                      variant="outlined"
                    />
                  );
                })()}
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* BMI Percentile */}
        {bmiChildPoints.length > 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                BMI-for-Age
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                Body Mass Index plotted against WHO age-based percentile curves.
                BMI between the 15th and 85th percentile is considered healthy.
              </Typography>

              {bmiChildPoints.length > 0 && (() => {
                const latest = bmiChildPoints[bmiChildPoints.length - 1];
                const closestRow = bmiPercentiles.reduce((prev, curr) =>
                  Math.abs(curr.age - latest.ageMonths) < Math.abs(prev.age - latest.ageMonths) ? curr : prev
                );
                const band = getBand(latest.bmi, closestRow);
                const isHealthy = band === '15th–50th' || band === '50th–85th';
                return (
                  <Chip
                    label={`Current BMI: ${latest.bmi} kg/m² (${band} percentile)`}
                    color={isHealthy ? 'success' : 'warning'}
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                );
              })()}

              <ResponsiveContainer width="100%" height={360}>
                <ComposedChart data={bmiChartData} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="age"
                    label={{ value: 'Age (months)', position: 'insideBottomRight', offset: -5 }}
                    tickFormatter={(v) => `${v}m`}
                  />
                  <YAxis
                    label={{ value: 'BMI (kg/m²)', angle: -90, position: 'insideLeft', offset: 5 }}
                    domain={[10, 22]}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      const labels: Record<string, string> = {
                        p3: '3rd percentile',
                        p15: '15th percentile',
                        p50: '50th percentile',
                        p85: '85th percentile',
                        p97: '97th percentile',
                        childBmi: 'Your child'
                      };
                      return [`${value} kg/m²`, labels[String(name)] || String(name)];
                    }}
                    labelFormatter={(label) => `Age: ${label} months`}
                  />
                  <Legend
                    formatter={(value) => {
                      const labels: Record<string, string> = {
                        p3: '3rd',
                        p15: '15th',
                        p50: '50th (healthy)',
                        p85: '85th',
                        p97: '97th',
                        childBmi: 'Your child'
                      };
                      return labels[value] || value;
                    }}
                  />

                  <Area type="monotone" dataKey="p85" stroke="none" fill="#E8F5E9" fillOpacity={0.3} legendType="none" />
                  <Area type="monotone" dataKey="p15" stroke="none" fill="#FFFFFF" fillOpacity={1} legendType="none" />

                  <Line type="monotone" dataKey="p3" stroke="#BDBDBD" strokeDasharray="4 4" dot={false} strokeWidth={1} />
                  <Line type="monotone" dataKey="p15" stroke="#66BB6A" strokeDasharray="4 4" dot={false} strokeWidth={1} />
                  <Line type="monotone" dataKey="p50" stroke="#4CAF50" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="p85" stroke="#66BB6A" strokeDasharray="4 4" dot={false} strokeWidth={1} />
                  <Line type="monotone" dataKey="p97" stroke="#BDBDBD" strokeDasharray="4 4" dot={false} strokeWidth={1} />

                  <Scatter dataKey="childBmi" fill="#FF5722" stroke="#FFF" strokeWidth={2} r={6} name="childBmi" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Alert severity="info" variant="standard">
          These insights are based on WHO growth standards and are for informational purposes only.
          Always consult your pediatrician for clinical interpretation.
        </Alert>

        {hasMeasurements && (
          <AiInsight
            title="Growth velocity & BMI insight"
            contextKey={`velocity-bmi-${sex}-${heightMeasurements.length}-${weightMeasurements.length}-${bmiChildPoints.at(-1)?.bmi ?? 'none'}`}
            prompt={(() => {
              const parts: string[] = [`I'm tracking my ${sex === 'male' ? 'boy' : 'girl'} infant's growth (0-36 months).`];
              if (heightVelocity.length > 0) {
                const lastHV = heightVelocity[heightVelocity.length - 1];
                parts.push(`Latest height growth velocity: ${lastHV.rate} per month (period ${lastHV.period}).`);
              }
              if (weightVelocity.length > 0) {
                const lastWV = weightVelocity[weightVelocity.length - 1];
                parts.push(`Latest weight growth velocity: ${lastWV.rate} per month (period ${lastWV.period}).`);
              }
              if (bmiChildPoints.length > 0) {
                const latest = bmiChildPoints[bmiChildPoints.length - 1];
                parts.push(`Current BMI: ${latest.bmi} kg/m² at ${latest.ageMonths} months.`);
              }
              if (crossingAlerts.length > 0) {
                parts.push(`Percentile crossing alerts: ${crossingAlerts.map(a => `${a.metric} shifted from ${a.from} to ${a.to} between ${a.fromAge}m and ${a.toAge}m`).join('; ')}.`);
              } else {
                parts.push('No percentile crossings detected.');
              }
              parts.push('What do these growth velocity and BMI numbers mean for a baby this age? Are they within normal range? What should parents watch for? Keep the answer to 3-4 short paragraphs.');
              return parts.join(' ');
            })()}
          />
        )}
      </Box>
    );
  }

  // =================== VIEW: weight-for-height ===================
  return (
    <Box>
      {wflChildPoints.length > 0 ? (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Weight-for-Height
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              Plots your child's weight against their height (independent of age) to assess proportionality.
              This is more sensitive to acute nutritional changes than weight-for-age.
            </Typography>
            <ResponsiveContainer width="100%" height={420}>
              <ComposedChart data={wflChartData} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="height"
                  label={{ value: `Height (${heightUnit})`, position: 'insideBottomRight', offset: -5 }}
                  type="number"
                  domain={['dataMin', 'dataMax']}
                />
                <YAxis
                  label={{ value: `Weight (${weightUnit})`, angle: -90, position: 'insideLeft', offset: 5 }}
                />
                <Tooltip
                  formatter={(value, name) => {
                    const labels: Record<string, string> = {
                      p3: '3rd percentile',
                      p15: '15th percentile',
                      p50: '50th percentile',
                      p85: '85th percentile',
                      p97: '97th percentile',
                      childWeight: 'Your child'
                    };
                    return [`${value} ${weightUnit}`, labels[String(name)] || String(name)];
                  }}
                  labelFormatter={(label) => `Height: ${label} ${heightUnit}`}
                />
                <Legend
                  formatter={(value) => {
                    const labels: Record<string, string> = {
                      p3: '3rd',
                      p15: '15th',
                      p50: '50th',
                      p85: '85th',
                      p97: '97th',
                      childWeight: 'Your child'
                    };
                    return labels[value] || value;
                  }}
                />

                <Area type="monotone" dataKey="p97" stroke="none" fill="#FFF3E0" fillOpacity={0.4} legendType="none" />
                <Area type="monotone" dataKey="p3" stroke="none" fill="#FFFFFF" fillOpacity={1} legendType="none" />

                <Line type="monotone" dataKey="p3" stroke="#BDBDBD" strokeDasharray="4 4" dot={false} strokeWidth={1} />
                <Line type="monotone" dataKey="p15" stroke="#9E9E9E" strokeDasharray="4 4" dot={false} strokeWidth={1} />
                <Line type="monotone" dataKey="p50" stroke="#FF9800" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="p85" stroke="#9E9E9E" strokeDasharray="4 4" dot={false} strokeWidth={1} />
                <Line type="monotone" dataKey="p97" stroke="#BDBDBD" strokeDasharray="4 4" dot={false} strokeWidth={1} />

                <Scatter dataKey="childWeight" fill="#FF5722" stroke="#FFF" strokeWidth={2} r={6} name="childWeight" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : (
        <Alert severity="info">
          Add matching height and weight measurements at the same age (in the Percentiles tab) to see this chart.
        </Alert>
      )}

      <Alert severity="info" variant="standard" sx={{ mt: 2 }}>
        Based on WHO weight-for-length/height standards. Always consult your pediatrician for clinical interpretation.
      </Alert>

      {wflChildPoints.length > 0 && (
        <AiInsight
          title="Weight-for-height insight"
          contextKey={`wfl-${sex}-${wflChildPoints.map(p => `${p.height}:${p.childWeight}`).join(',')}`}
          prompt={`I'm tracking my ${sex === 'male' ? 'boy' : 'girl'} infant's weight-for-height proportionality. Their measurements (height → weight): ${wflChildPoints.map(p => `${p.height} ${heightUnit} → ${p.childWeight} ${weightUnit} (age ${p.age})`).join(', ')}. How does their weight-for-height proportionality look? What does it mean when weight-for-height differs from weight-for-age? What should parents know about proportional growth? Keep the answer to 3-4 short paragraphs.`}
        />
      )}
    </Box>
  );
};

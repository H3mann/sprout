import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import IconButton from '@mui/material/IconButton';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const SleepEntryCard = styled(Card)(({ theme }) => ({
  '&:hover': {
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
  }
}));

interface SleepEntry {
  id: string;
  date: string;
  type: 'night' | 'nap';
  hours: number;
  minutes: number;
  quality: 'good' | 'fair' | 'poor';
}

// Recommended sleep by age (AAP guidelines)
const SLEEP_RECOMMENDATIONS: Record<string, { min: number; max: number; label: string }> = {
  '0-3': { min: 14, max: 17, label: 'Newborn (0–3 months)' },
  '4-11': { min: 12, max: 16, label: 'Infant (4–11 months)' },
  '1-2': { min: 11, max: 14, label: 'Toddler (1–2 years)' },
  '3-5': { min: 10, max: 13, label: 'Preschool (3–5 years)' }
};

const initialEntries: SleepEntry[] = [
  { id: '1', date: '2026-03-27', type: 'night', hours: 10, minutes: 30, quality: 'good' },
  { id: '2', date: '2026-03-27', type: 'nap', hours: 1, minutes: 15, quality: 'good' },
  { id: '3', date: '2026-03-28', type: 'night', hours: 9, minutes: 45, quality: 'fair' },
  { id: '4', date: '2026-03-28', type: 'nap', hours: 1, minutes: 30, quality: 'good' },
  { id: '5', date: '2026-03-29', type: 'night', hours: 11, minutes: 0, quality: 'good' },
  { id: '6', date: '2026-03-29', type: 'nap', hours: 1, minutes: 0, quality: 'fair' },
  { id: '7', date: '2026-03-30', type: 'night', hours: 10, minutes: 15, quality: 'good' },
  { id: '8', date: '2026-03-30', type: 'nap', hours: 1, minutes: 45, quality: 'good' },
  { id: '9', date: '2026-03-31', type: 'night', hours: 8, minutes: 30, quality: 'poor' },
  { id: '10', date: '2026-03-31', type: 'nap', hours: 2, minutes: 0, quality: 'fair' },
  { id: '11', date: '2026-04-01', type: 'night', hours: 10, minutes: 45, quality: 'good' },
  { id: '12', date: '2026-04-01', type: 'nap', hours: 1, minutes: 15, quality: 'good' },
  { id: '13', date: '2026-04-02', type: 'night', hours: 11, minutes: 0, quality: 'good' },
  { id: '14', date: '2026-04-02', type: 'nap', hours: 1, minutes: 30, quality: 'good' }
];

const qualityColors: Record<string, string> = {
  good: '#4CAF50',
  fair: '#FF9800',
  poor: '#F44336'
};

export const SleepTracker = () => {
  const [entries, setEntries] = useState<SleepEntry[]>(initialEntries);
  const [ageRange, setAgeRange] = useState('4-11');
  const [newDate, setNewDate] = useState('');
  const [newType, setNewType] = useState<'night' | 'nap'>('night');
  const [newHours, setNewHours] = useState('');
  const [newMinutes, setNewMinutes] = useState('');
  const [newQuality, setNewQuality] = useState<'good' | 'fair' | 'poor'>('good');

  const recommendation = SLEEP_RECOMMENDATIONS[ageRange];

  const handleAdd = () => {
    const hours = parseInt(newHours, 10);
    const minutes = parseInt(newMinutes || '0', 10);
    if (!newDate || isNaN(hours)) return;

    const entry: SleepEntry = {
      id: Date.now().toString(),
      date: newDate,
      type: newType,
      hours,
      minutes,
      quality: newQuality
    };
    setEntries((prev) => [...prev, entry].sort((a, b) => a.date.localeCompare(b.date)));
    setNewDate('');
    setNewHours('');
    setNewMinutes('');
  };

  const handleDelete = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  // Build weekly chart data
  const dailyTotals = entries.reduce<Record<string, { night: number; nap: number }>>((acc, entry) => {
    if (!acc[entry.date]) acc[entry.date] = { night: 0, nap: 0 };
    const totalHours = entry.hours + entry.minutes / 60;
    acc[entry.date][entry.type] += totalHours;
    return acc;
  }, {});

  const chartData = Object.entries(dailyTotals)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-7)
    .map(([date, totals]) => ({
      date: new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      night: Math.round(totals.night * 10) / 10,
      nap: Math.round(totals.nap * 10) / 10,
      total: Math.round((totals.night + totals.nap) * 10) / 10
    }));

  const recentEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="start" flexWrap="wrap" gap={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h3" gutterBottom>
            Sleep Tracker
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Track sleep patterns and compare against AAP recommendations.
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Age Range</InputLabel>
          <Select value={ageRange} label="Age Range" onChange={(e) => setAgeRange(e.target.value)}>
            {Object.entries(SLEEP_RECOMMENDATIONS).map(([key, val]) => (
              <MenuItem key={key} value={key}>
                {val.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Card sx={{ mb: 3, bgcolor: '#F3E5F5' }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1}>
            <NightsStayIcon sx={{ color: '#7B1FA2' }} />
            <Typography variant="body1">
              <strong>Recommended:</strong> {recommendation.min}–{recommendation.max} hours per day for{' '}
              {recommendation.label.toLowerCase()}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="h5" gutterBottom>
            Last 7 Days
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value: number, name: string) => [`${value}h`, name === 'night' ? 'Night sleep' : 'Naps']} />
              <ReferenceLine y={recommendation.min} stroke="#9C27B0" strokeDasharray="4 4" label={{ value: 'Min', fill: '#9C27B0', fontSize: 11 }} />
              <ReferenceLine y={recommendation.max} stroke="#9C27B0" strokeDasharray="4 4" label={{ value: 'Max', fill: '#9C27B0', fontSize: 11 }} />
              <Bar dataKey="night" stackId="sleep" fill="#7B1FA2" radius={[0, 0, 0, 0]} name="night" />
              <Bar dataKey="nap" stackId="sleep" fill="#CE93D8" radius={[4, 4, 0, 0]} name="nap" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Log Sleep
          </Typography>
          <Stack direction="row" spacing={2} alignItems="start" flexWrap="wrap" useFlexGap>
            <TextField
              label="Date"
              type="date"
              size="small"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ width: 160 }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Type</InputLabel>
              <Select value={newType} label="Type" onChange={(e) => setNewType(e.target.value as 'night' | 'nap')}>
                <MenuItem value="night">Night</MenuItem>
                <MenuItem value="nap">Nap</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Hours"
              type="number"
              size="small"
              value={newHours}
              onChange={(e) => setNewHours(e.target.value)}
              sx={{ width: 90 }}
            />
            <TextField
              label="Minutes"
              type="number"
              size="small"
              value={newMinutes}
              onChange={(e) => setNewMinutes(e.target.value)}
              sx={{ width: 100 }}
            />
            <FormControl size="small" sx={{ minWidth: 110 }}>
              <InputLabel>Quality</InputLabel>
              <Select value={newQuality} label="Quality" onChange={(e) => setNewQuality(e.target.value as 'good' | 'fair' | 'poor')}>
                <MenuItem value="good">Good</MenuItem>
                <MenuItem value="fair">Fair</MenuItem>
                <MenuItem value="poor">Poor</MenuItem>
              </Select>
            </FormControl>
            <Button variant="contained" onClick={handleAdd} disabled={!newDate || !newHours}>
              Log
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Recent Entries
          </Typography>
          <Stack spacing={1} divider={<Divider />}>
            {recentEntries.map((entry) => (
              <SleepEntryCard key={entry.id} elevation={0}>
                <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" alignItems="center" spacing={2}>
                      {entry.type === 'night' ? (
                        <NightsStayIcon sx={{ color: '#7B1FA2', fontSize: 20 }} />
                      ) : (
                        <WbSunnyIcon sx={{ color: '#FF9800', fontSize: 20 }} />
                      )}
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {entry.type === 'night' ? 'Night Sleep' : 'Nap'} — {entry.hours}h {entry.minutes > 0 ? `${entry.minutes}m` : ''}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                          {new Date(entry.date + 'T12:00:00').toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Chip
                        label={entry.quality}
                        size="small"
                        sx={{
                          bgcolor: qualityColors[entry.quality] + '1A',
                          color: qualityColors[entry.quality],
                          fontWeight: 600,
                          textTransform: 'capitalize'
                        }}
                      />
                      <IconButton size="small" onClick={() => handleDelete(entry.id)}>
                        <DeleteOutlineIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                      </IconButton>
                    </Stack>
                  </Stack>
                </CardContent>
              </SleepEntryCard>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

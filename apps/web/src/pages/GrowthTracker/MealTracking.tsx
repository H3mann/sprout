import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LocalDrinkIcon from '@mui/icons-material/LocalDrink';
import RestaurantIcon from '@mui/icons-material/Restaurant';

type AgeMode = 'infant' | 'toddler';

interface MealEntry {
  id: string;
  date: string;
  type: string;
  description: string;
  time: string;
  notes: string;
}

const INFANT_MEAL_TYPES = [
  { value: 'breast', label: 'Breastfeed', color: '#E91E63' },
  { value: 'bottle', label: 'Bottle (Formula/Expressed)', color: '#9C27B0' },
  { value: 'puree', label: 'Puree / Baby Food', color: '#FF9800' },
  { value: 'solids-intro', label: 'Solids Introduction', color: '#4CAF50' }
];

const TODDLER_MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast', color: '#FF9800' },
  { value: 'lunch', label: 'Lunch', color: '#4CAF50' },
  { value: 'dinner', label: 'Dinner', color: '#2196F3' },
  { value: 'snack', label: 'Snack', color: '#9C27B0' },
  { value: 'drink', label: 'Drink / Milk', color: '#E91E63' }
];

const infantEntries: MealEntry[] = [
  { id: '1', date: '2026-04-02', type: 'breast', description: 'Left side, 15 min', time: '06:30', notes: '' },
  { id: '2', date: '2026-04-02', type: 'breast', description: 'Right side, 12 min', time: '09:00', notes: '' },
  { id: '3', date: '2026-04-02', type: 'puree', description: 'Sweet potato puree, 2 tbsp', time: '11:30', notes: 'Loved it' },
  { id: '4', date: '2026-04-02', type: 'bottle', description: 'Formula, 6 oz', time: '14:00', notes: '' },
  { id: '5', date: '2026-04-02', type: 'breast', description: 'Both sides, 20 min', time: '17:00', notes: '' },
  { id: '6', date: '2026-04-01', type: 'breast', description: 'Left side, 18 min', time: '06:15', notes: '' },
  { id: '7', date: '2026-04-01', type: 'puree', description: 'Banana + avocado, 3 tbsp', time: '11:00', notes: 'First time with avocado' },
  { id: '8', date: '2026-04-01', type: 'bottle', description: 'Formula, 5 oz', time: '14:30', notes: '' },
  { id: '9', date: '2026-04-01', type: 'solids-intro', description: 'Soft pear pieces', time: '17:30', notes: 'Baby-led weaning attempt' }
];

const toddlerEntries: MealEntry[] = [
  { id: '10', date: '2026-04-02', type: 'breakfast', description: 'Scrambled eggs, toast, banana', time: '07:30', notes: '' },
  { id: '11', date: '2026-04-02', type: 'snack', description: 'Apple slices + peanut butter', time: '10:00', notes: '' },
  { id: '12', date: '2026-04-02', type: 'lunch', description: 'Mac and cheese, steamed broccoli', time: '12:00', notes: 'Ate most of the broccoli' },
  { id: '13', date: '2026-04-02', type: 'snack', description: 'Yogurt with blueberries', time: '15:00', notes: '' },
  { id: '14', date: '2026-04-02', type: 'dinner', description: 'Chicken strips, rice, peas', time: '18:00', notes: '' },
  { id: '15', date: '2026-04-01', type: 'breakfast', description: 'Oatmeal with strawberries', time: '07:00', notes: '' },
  { id: '16', date: '2026-04-01', type: 'lunch', description: 'Turkey sandwich, carrots', time: '12:00', notes: '' },
  { id: '17', date: '2026-04-01', type: 'dinner', description: 'Pasta with tomato sauce, green beans', time: '17:30', notes: '' },
  { id: '18', date: '2026-04-01', type: 'drink', description: 'Whole milk, 8 oz', time: '19:00', notes: '' }
];

const DaySummaryCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2)
}));

const getMealTypes = (mode: AgeMode) =>
  mode === 'infant' ? INFANT_MEAL_TYPES : TODDLER_MEAL_TYPES;

const getMealColor = (mode: AgeMode, type: string) =>
  getMealTypes(mode).find((m) => m.value === type)?.color || '#757575';

const getMealLabel = (mode: AgeMode, type: string) =>
  getMealTypes(mode).find((m) => m.value === type)?.label || type;

export const MealTracking = () => {
  const [mode, setMode] = useState<AgeMode>('infant');
  const [entries, setEntries] = useState<Record<AgeMode, MealEntry[]>>({
    infant: infantEntries,
    toddler: toddlerEntries
  });
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newType, setNewType] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const currentEntries = entries[mode];
  const mealTypes = getMealTypes(mode);

  const handleAdd = () => {
    if (!newDate || !newType || !newDescription) return;

    const entry: MealEntry = {
      id: Date.now().toString(),
      date: newDate,
      type: newType,
      description: newDescription,
      time: newTime || '12:00',
      notes: newNotes
    };

    setEntries((prev) => ({
      ...prev,
      [mode]: [...prev[mode], entry].sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        return a.time.localeCompare(b.time);
      })
    }));

    setNewDate('');
    setNewTime('');
    setNewType('');
    setNewDescription('');
    setNewNotes('');
  };

  const handleDelete = (id: string) => {
    setEntries((prev) => ({
      ...prev,
      [mode]: prev[mode].filter((e) => e.id !== id)
    }));
  };

  // Group entries by date
  const groupedByDate = currentEntries.reduce<Record<string, MealEntry[]>>((acc, entry) => {
    if (!acc[entry.date]) acc[entry.date] = [];
    acc[entry.date].push(entry);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  // Daily summary counts
  const getDaySummary = (dayEntries: MealEntry[]) => {
    const counts: Record<string, number> = {};
    dayEntries.forEach((e) => {
      counts[e.type] = (counts[e.type] || 0) + 1;
    });
    return counts;
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="start" flexWrap="wrap" gap={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h3" gutterBottom>
            Meal Tracking
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Log meals and feeding sessions to track nutrition patterns.
          </Typography>
        </Box>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, val) => {
            if (val) {
              setMode(val);
              setNewType('');
            }
          }}
          size="small"
        >
          <ToggleButton value="infant">
            <LocalDrinkIcon sx={{ mr: 0.5, fontSize: 18 }} />
            Infant (0–12m)
          </ToggleButton>
          <ToggleButton value="toddler">
            <RestaurantIcon sx={{ mr: 0.5, fontSize: 18 }} />
            Toddler / Child
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {mode === 'infant' && (
        <Card sx={{ mb: 3, bgcolor: '#FCE4EC' }}>
          <CardContent>
            <Typography variant="body2">
              <strong>Infant feeding tip:</strong> The AAP recommends exclusive breastfeeding for the first 6 months.
              Solid foods can be introduced around 6 months while continuing breastfeeding. Track feeding sessions
              to share with your pediatrician.
            </Typography>
          </CardContent>
        </Card>
      )}

      {mode === 'toddler' && (
        <Card sx={{ mb: 3, bgcolor: '#E8F5E9' }}>
          <CardContent>
            <Typography variant="body2">
              <strong>Nutrition tip:</strong> Toddlers and young children benefit from 3 meals and 2–3 snacks per
              day with a variety of food groups. Focus on variety over quantity — appetites vary day to day, and
              that's normal.
            </Typography>
          </CardContent>
        </Card>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Log {mode === 'infant' ? 'Feeding' : 'Meal'}
          </Typography>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              <TextField
                label="Date"
                type="date"
                size="small"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: 160 }}
              />
              <TextField
                label="Time"
                type="time"
                size="small"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: 130 }}
              />
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Type</InputLabel>
                <Select value={newType} label="Type" onChange={(e) => setNewType(e.target.value)}>
                  {mealTypes.map((mt) => (
                    <MenuItem key={mt.value} value={mt.value}>
                      {mt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              <TextField
                label="Description"
                size="small"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder={mode === 'infant' ? 'e.g., Left side, 15 min' : 'e.g., Scrambled eggs, toast'}
                sx={{ flex: 1, minWidth: 250 }}
              />
              <TextField
                label="Notes (optional)"
                size="small"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Any observations"
                sx={{ flex: 1, minWidth: 200 }}
              />
              <Button
                variant="contained"
                onClick={handleAdd}
                disabled={!newDate || !newType || !newDescription}
              >
                Log
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {sortedDates.map((date) => {
        const dayEntries = groupedByDate[date].sort((a, b) => a.time.localeCompare(b.time));
        const summary = getDaySummary(dayEntries);
        const dateLabel = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric'
        });

        return (
          <DaySummaryCard key={date}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h5">{dateLabel}</Typography>
                <Stack direction="row" spacing={0.5}>
                  {Object.entries(summary).map(([type, count]) => (
                    <Chip
                      key={type}
                      label={`${getMealLabel(mode, type)}: ${count}`}
                      size="small"
                      sx={{
                        bgcolor: getMealColor(mode, type) + '1A',
                        color: getMealColor(mode, type),
                        fontWeight: 600,
                        fontSize: '0.7rem'
                      }}
                    />
                  ))}
                </Stack>
              </Stack>

              <Stack spacing={0.5} divider={<Divider />}>
                {dayEntries.map((entry) => (
                  <Stack
                    key={entry.id}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ py: 1 }}
                  >
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Typography
                        variant="body2"
                        sx={{ color: 'text.secondary', minWidth: 50, fontSize: '0.8rem' }}
                      >
                        {entry.time}
                      </Typography>
                      <Chip
                        label={getMealLabel(mode, entry.type)}
                        size="small"
                        sx={{
                          bgcolor: getMealColor(mode, entry.type) + '1A',
                          color: getMealColor(mode, entry.type),
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          minWidth: 80
                        }}
                      />
                      <Box>
                        <Typography variant="body2">{entry.description}</Typography>
                        {entry.notes && (
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem', fontStyle: 'italic' }}>
                            {entry.notes}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                    <IconButton size="small" onClick={() => handleDelete(entry.id)}>
                      <DeleteOutlineIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </IconButton>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </DaySummaryCard>
        );
      })}
    </Box>
  );
};

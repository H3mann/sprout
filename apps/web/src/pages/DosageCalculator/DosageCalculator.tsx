import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import CalculateIcon from '@mui/icons-material/Calculate';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import { useChildren } from '../../context/ChildContext';

type WeightUnit = 'kg' | 'lbs';

interface Medication {
  name: string;
  dosePerKg: number; // mg per kg per dose
  maxDose: number; // mg per dose
  concentrations: { label: string; mgPerMl: number }[];
  frequency: string;
  notes?: string;
  minAgeMonths: number;
}

const MEDICATIONS: Medication[] = [
  {
    name: 'Acetaminophen (Tylenol)',
    dosePerKg: 15,
    maxDose: 1000,
    concentrations: [
      { label: 'Infant drops (160 mg/5 mL)', mgPerMl: 32 },
      { label: 'Children\'s liquid (160 mg/5 mL)', mgPerMl: 32 },
      { label: 'Children\'s chewable (160 mg tablet)', mgPerMl: 160 },
    ],
    frequency: 'Every 4-6 hours (max 5 doses/day)',
    minAgeMonths: 3,
  },
  {
    name: 'Ibuprofen (Advil/Motrin)',
    dosePerKg: 10,
    maxDose: 400,
    concentrations: [
      { label: 'Infant drops (50 mg/1.25 mL)', mgPerMl: 40 },
      { label: 'Children\'s liquid (100 mg/5 mL)', mgPerMl: 20 },
      { label: 'Children\'s chewable (100 mg tablet)', mgPerMl: 100 },
    ],
    frequency: 'Every 6-8 hours (max 4 doses/day)',
    minAgeMonths: 6,
  },
  {
    name: 'Diphenhydramine (Benadryl)',
    dosePerKg: 1.25,
    maxDose: 50,
    concentrations: [
      { label: 'Children\'s liquid (12.5 mg/5 mL)', mgPerMl: 2.5 },
      { label: 'Chewable tablet (12.5 mg)', mgPerMl: 12.5 },
    ],
    frequency: 'Every 6 hours (max 4 doses/day)',
    notes: 'Not recommended for children under 2 without physician guidance.',
    minAgeMonths: 24,
  },
  {
    name: 'Amoxicillin',
    dosePerKg: 25,
    maxDose: 500,
    concentrations: [
      { label: '125 mg/5 mL suspension', mgPerMl: 25 },
      { label: '250 mg/5 mL suspension', mgPerMl: 50 },
      { label: '400 mg/5 mL suspension', mgPerMl: 80 },
    ],
    frequency: 'Every 8-12 hours (as prescribed)',
    notes: 'Prescription only. Dose varies by condition — follow your pediatrician\'s instructions.',
    minAgeMonths: 0,
  },
];

const KG_TO_LBS = 2.20462;

export const DosageCalculator = () => {
  const { activeChild, getAgeMonths } = useChildren();

  const [weightInput, setWeightInput] = useState('');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(
    () => (localStorage.getItem('sprout_unit_system') === 'imperial' ? 'lbs' : 'kg')
  );
  const [selectedMedIndex, setSelectedMedIndex] = useState<number>(0);
  const [selectedConcIndex, setSelectedConcIndex] = useState<number>(0);

  const weightKg = weightInput
    ? weightUnit === 'kg'
      ? parseFloat(weightInput)
      : parseFloat(weightInput) / KG_TO_LBS
    : null;

  const medication = MEDICATIONS[selectedMedIndex];
  const concentration = medication.concentrations[selectedConcIndex];

  const ageMonths = activeChild ? getAgeMonths(activeChild) : null;
  const isTooYoung = ageMonths !== null && ageMonths < medication.minAgeMonths;

  const doseMg = weightKg ? Math.min(
    Math.round(weightKg * medication.dosePerKg * 10) / 10,
    medication.maxDose
  ) : null;

  const isTablet = concentration.label.toLowerCase().includes('tablet') ||
    concentration.label.toLowerCase().includes('chewable');

  const doseVolume = doseMg
    ? isTablet
      ? Math.round((doseMg / concentration.mgPerMl) * 10) / 10
      : Math.round((doseMg / concentration.mgPerMl) * 10) / 10
    : null;

  const volumeLabel = isTablet ? 'tablet(s)' : 'mL';

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
        <CalculateIcon sx={{ fontSize: 36, color: 'primary.main' }} />
        <Typography variant="h3">Dosage Calculator</Typography>
      </Stack>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Calculate pediatric medication doses based on your child's weight.
      </Typography>

      <Alert severity="warning" variant="outlined" sx={{ mb: 3 }} icon={<WarningAmberIcon />}>
        This calculator is for informational purposes only. Always confirm dosing with your
        pediatrician or pharmacist before administering any medication.
      </Alert>

      {/* Weight Input */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Child's Weight
          </Typography>

          {activeChild && (
            <Chip
              icon={<ChildCareIcon />}
              label={`Calculating for ${activeChild.name}`}
              color="primary"
              variant="outlined"
              size="small"
              sx={{ mb: 2 }}
            />
          )}

          <Stack direction="row" spacing={2} alignItems="start" flexWrap="wrap">
            <TextField
              label="Weight"
              type="number"
              size="small"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              sx={{ width: 180 }}
              slotProps={{
                input: {
                  endAdornment: <InputAdornment position="end">{weightUnit}</InputAdornment>,
                }
              }}
              placeholder={weightUnit === 'kg' ? 'e.g. 8.5' : 'e.g. 18.7'}
            />
            <ToggleButtonGroup
              value={weightUnit}
              exclusive
              onChange={(_, val) => {
                if (!val) return;
                // Convert the displayed value
                if (weightInput) {
                  const current = parseFloat(weightInput);
                  if (!isNaN(current)) {
                    const converted = val === 'kg'
                      ? Math.round((current / KG_TO_LBS) * 100) / 100
                      : Math.round(current * KG_TO_LBS * 100) / 100;
                    setWeightInput(String(converted));
                  }
                }
                setWeightUnit(val);
              }}
              size="small"
            >
              <ToggleButton value="kg">kg</ToggleButton>
              <ToggleButton value="lbs">lbs</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </CardContent>
      </Card>

      {/* Medication Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Medication
          </Typography>
          <Stack spacing={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Medication</InputLabel>
              <Select
                value={selectedMedIndex}
                label="Medication"
                onChange={(e) => {
                  setSelectedMedIndex(Number(e.target.value));
                  setSelectedConcIndex(0);
                }}
              >
                {MEDICATIONS.map((med, i) => (
                  <MenuItem key={med.name} value={i}>
                    {med.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel>Formulation</InputLabel>
              <Select
                value={selectedConcIndex}
                label="Formulation"
                onChange={(e) => setSelectedConcIndex(Number(e.target.value))}
              >
                {medication.concentrations.map((conc, i) => (
                  <MenuItem key={conc.label} value={i}>
                    {conc.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      {/* Results */}
      {weightKg && weightKg > 0 && doseMg !== null && doseVolume !== null && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <LocalPharmacyIcon sx={{ color: '#4CAF50' }} />
              <Typography variant="h5">Calculated Dose</Typography>
            </Stack>

            {isTooYoung && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {medication.name} is generally not recommended for children under{' '}
                {medication.minAgeMonths < 12
                  ? `${medication.minAgeMonths} months`
                  : `${Math.floor(medication.minAgeMonths / 12)} year${medication.minAgeMonths >= 24 ? 's' : ''}`}
                . Consult your pediatrician.
              </Alert>
            )}

            <Box
              sx={{
                p: 3,
                borderRadius: 2,
                bgcolor: isTooYoung ? '#FFF3E0' : '#E8F5E9',
                border: '1px solid',
                borderColor: isTooYoung ? '#FFB74D' : '#A5D6A7',
                mb: 2,
              }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={4}
                alignItems={{ sm: 'baseline' }}
              >
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Dose
                  </Typography>
                  <Typography variant="h3" sx={{ color: isTooYoung ? '#E65100' : '#2E7D32' }}>
                    {doseMg} mg
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Volume / Amount
                  </Typography>
                  <Typography variant="h3" sx={{ color: isTooYoung ? '#E65100' : '#2E7D32' }}>
                    {doseVolume} {volumeLabel}
                  </Typography>
                </Box>
              </Stack>

              {doseMg >= medication.maxDose && (
                <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                  Capped at maximum single dose of {medication.maxDose} mg.
                </Typography>
              )}
            </Box>

            <Stack spacing={1}>
              <Typography variant="body2">
                <strong>Frequency:</strong> {medication.frequency}
              </Typography>
              <Typography variant="body2">
                <strong>Formulation:</strong> {concentration.label}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Based on {medication.dosePerKg} mg/kg per dose &middot; Weight: {Math.round(weightKg * 100) / 100} kg
              </Typography>
            </Stack>

            {medication.notes && (
              <Alert severity="info" variant="outlined" sx={{ mt: 2 }}>
                {medication.notes}
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <Alert severity="info" variant="standard">
        Dosages shown are standard pediatric guidelines. Individual dosing may vary based on your
        child's health conditions. When in doubt, always contact your pediatrician.
      </Alert>
    </Container>
  );
};

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
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import HistoryIcon from '@mui/icons-material/History';
import MedicationIcon from '@mui/icons-material/Medication';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

type ViewMode = 'active' | 'history';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  prescribedBy: string;
  startDate: string;
  endDate?: string;
  active: boolean;
  notes: string;
  category: string;
}

interface DoseLog {
  id: string;
  medicationId: string;
  date: string;
  time: string;
  given: boolean;
  notes: string;
}

const MEDICATION_CATEGORIES = [
  { value: 'prescription', label: 'Prescription', color: '#2196F3' },
  { value: 'otc', label: 'Over-the-Counter', color: '#4CAF50' },
  { value: 'vitamin', label: 'Vitamin / Supplement', color: '#FF9800' },
  { value: 'prn', label: 'As Needed (PRN)', color: '#9C27B0' }
];

const FREQUENCY_OPTIONS = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Four times daily',
  'Every 4 hours',
  'Every 6 hours',
  'Every 8 hours',
  'Every 12 hours',
  'Once weekly',
  'As needed'
];

const ROUTE_OPTIONS = [
  'By mouth (oral)',
  'Topical (skin)',
  'Drops (ear)',
  'Drops (eye)',
  'Inhaled',
  'Rectal',
  'Injection'
];

const initialMedications: Medication[] = [
  {
    id: '1',
    name: 'Amoxicillin',
    dosage: '250mg / 5mL — 5mL',
    frequency: 'Twice daily',
    route: 'By mouth (oral)',
    prescribedBy: 'Dr. Martinez',
    startDate: '2026-03-28',
    endDate: '2026-04-07',
    active: true,
    notes: 'For ear infection. Give with food.',
    category: 'prescription'
  },
  {
    id: '2',
    name: 'Vitamin D Drops',
    dosage: '400 IU (1 drop)',
    frequency: 'Once daily',
    route: 'By mouth (oral)',
    prescribedBy: 'Dr. Martinez',
    startDate: '2025-07-01',
    active: true,
    notes: 'Continue until weaned to 32oz vitamin D-fortified milk per day.',
    category: 'vitamin'
  },
  {
    id: '3',
    name: 'Infant Acetaminophen (Tylenol)',
    dosage: '2.5 mL (160mg/5mL)',
    frequency: 'As needed',
    route: 'By mouth (oral)',
    prescribedBy: '',
    startDate: '2025-09-01',
    active: true,
    notes: 'For fever > 100.4°F or teething pain. No more than 5 doses in 24 hours. Wait at least 4 hours between doses.',
    category: 'prn'
  },
  {
    id: '4',
    name: 'Iron Supplement',
    dosage: '1 mL (15mg)',
    frequency: 'Once daily',
    route: 'By mouth (oral)',
    prescribedBy: 'Dr. Martinez',
    startDate: '2025-11-01',
    endDate: '2026-02-01',
    active: false,
    notes: 'Completed course. Iron levels normalized at 6-month labs.',
    category: 'prescription'
  }
];

const initialDoseLogs: DoseLog[] = [
  { id: '1', medicationId: '1', date: '2026-04-02', time: '08:00', given: true, notes: '' },
  { id: '2', medicationId: '1', date: '2026-04-02', time: '20:00', given: false, notes: '' },
  { id: '3', medicationId: '2', date: '2026-04-02', time: '08:00', given: true, notes: '' },
  { id: '4', medicationId: '1', date: '2026-04-01', time: '08:00', given: true, notes: '' },
  { id: '5', medicationId: '1', date: '2026-04-01', time: '20:00', given: true, notes: '' },
  { id: '6', medicationId: '2', date: '2026-04-01', time: '08:00', given: true, notes: '' },
  { id: '7', medicationId: '3', date: '2026-03-31', time: '14:00', given: true, notes: 'Teething pain' },
  { id: '8', medicationId: '1', date: '2026-03-31', time: '08:00', given: true, notes: '' },
  { id: '9', medicationId: '1', date: '2026-03-31', time: '20:00', given: true, notes: '' }
];

const MedicationCard = styled(Card)<{ catColor: string }>(({ catColor }) => ({
  borderLeft: `4px solid ${catColor}`
}));

const getCategoryInfo = (category: string) =>
  MEDICATION_CATEGORIES.find((c) => c.value === category) || { label: category, color: '#757575' };

export const MedicationTracker = () => {
  const [medications, setMedications] = useState<Medication[]>(initialMedications);
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>(initialDoseLogs);
  const [viewMode, setViewMode] = useState<ViewMode>('active');
  const [showAddForm, setShowAddForm] = useState(false);

  // Add form state
  const [newName, setNewName] = useState('');
  const [newDosage, setNewDosage] = useState('');
  const [newFrequency, setNewFrequency] = useState('');
  const [newRoute, setNewRoute] = useState('');
  const [newPrescriber, setNewPrescriber] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const activeMeds = medications.filter((m) => m.active);
  const inactiveMeds = medications.filter((m) => !m.active);
  const displayedMeds = viewMode === 'active' ? activeMeds : inactiveMeds;

  const handleAddMedication = () => {
    if (!newName || !newDosage || !newFrequency || !newCategory) return;

    const med: Medication = {
      id: Date.now().toString(),
      name: newName,
      dosage: newDosage,
      frequency: newFrequency,
      route: newRoute || 'By mouth (oral)',
      prescribedBy: newPrescriber,
      startDate: newStartDate || new Date().toISOString().split('T')[0],
      endDate: newEndDate || undefined,
      active: true,
      notes: newNotes,
      category: newCategory
    };

    setMedications((prev) => [...prev, med]);
    setNewName('');
    setNewDosage('');
    setNewFrequency('');
    setNewRoute('');
    setNewPrescriber('');
    setNewStartDate('');
    setNewEndDate('');
    setNewNotes('');
    setNewCategory('');
    setShowAddForm(false);
  };

  const handleToggleActive = (id: string) => {
    setMedications((prev) =>
      prev.map((m) => (m.id === id ? { ...m, active: !m.active } : m))
    );
  };

  const handleDelete = (id: string) => {
    setMedications((prev) => prev.filter((m) => m.id !== id));
    setDoseLogs((prev) => prev.filter((d) => d.medicationId !== id));
  };

  const handleLogDose = (medicationId: string) => {
    const now = new Date();
    const log: DoseLog = {
      id: Date.now().toString(),
      medicationId,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5),
      given: true,
      notes: ''
    };
    setDoseLogs((prev) => [log, ...prev]);
  };

  const getRecentLogs = (medicationId: string) =>
    doseLogs
      .filter((d) => d.medicationId === medicationId)
      .sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        return dateCompare !== 0 ? dateCompare : b.time.localeCompare(a.time);
      })
      .slice(0, 5);

  const getDaysRemaining = (endDate?: string) => {
    if (!endDate) return null;
    const end = new Date(endDate + 'T12:00:00');
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="start" flexWrap="wrap" gap={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h3" gutterBottom>
            Medications
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Track prescriptions, supplements, and as-needed medications. Log doses to share with your pediatrician.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, val) => val && setViewMode(val)}
            size="small"
          >
            <ToggleButton value="active">
              <MedicationIcon sx={{ mr: 0.5, fontSize: 18 }} />
              Active ({activeMeds.length})
            </ToggleButton>
            <ToggleButton value="history">
              <HistoryIcon sx={{ mr: 0.5, fontSize: 18 }} />
              Past ({inactiveMeds.length})
            </ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            Add
          </Button>
        </Stack>
      </Stack>

      {showAddForm && (
        <Card sx={{ mb: 3, border: '2px solid', borderColor: 'primary.light' }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Add Medication
            </Typography>
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                <TextField
                  label="Medication Name"
                  size="small"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  sx={{ flex: 1, minWidth: 200 }}
                />
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Category</InputLabel>
                  <Select value={newCategory} label="Category" onChange={(e) => setNewCategory(e.target.value)}>
                    {MEDICATION_CATEGORIES.map((cat) => (
                      <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                <TextField
                  label="Dosage"
                  size="small"
                  value={newDosage}
                  onChange={(e) => setNewDosage(e.target.value)}
                  placeholder="e.g., 5mL, 200mg"
                  sx={{ flex: 1, minWidth: 160 }}
                />
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Frequency</InputLabel>
                  <Select value={newFrequency} label="Frequency" onChange={(e) => setNewFrequency(e.target.value)}>
                    {FREQUENCY_OPTIONS.map((f) => (
                      <MenuItem key={f} value={f}>{f}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Route</InputLabel>
                  <Select value={newRoute} label="Route" onChange={(e) => setNewRoute(e.target.value)}>
                    {ROUTE_OPTIONS.map((r) => (
                      <MenuItem key={r} value={r}>{r}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                <TextField
                  label="Prescribed By"
                  size="small"
                  value={newPrescriber}
                  onChange={(e) => setNewPrescriber(e.target.value)}
                  sx={{ flex: 1, minWidth: 160 }}
                />
                <TextField
                  label="Start Date"
                  type="date"
                  size="small"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ width: 160 }}
                />
                <TextField
                  label="End Date (optional)"
                  type="date"
                  size="small"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ width: 170 }}
                />
              </Stack>
              <TextField
                label="Notes"
                size="small"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                multiline
                rows={2}
                placeholder="Special instructions, side effects to watch for, etc."
              />
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button variant="outlined" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleAddMedication}
                  disabled={!newName || !newDosage || !newFrequency || !newCategory}
                >
                  Save Medication
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}

      {displayedMeds.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <MedicationIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              {viewMode === 'active'
                ? 'No active medications. Tap "Add" to track a new medication.'
                : 'No past medications on record.'}
            </Typography>
          </CardContent>
        </Card>
      )}

      <Stack spacing={2}>
        {displayedMeds.map((med) => {
          const catInfo = getCategoryInfo(med.category);
          const recentLogs = getRecentLogs(med.id);
          const daysRemaining = getDaysRemaining(med.endDate);

          return (
            <MedicationCard key={med.id} catColor={catInfo.color}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="start">
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                      <Typography variant="body1" fontWeight={700} sx={{ fontSize: '1.05rem' }}>
                        {med.name}
                      </Typography>
                      <Chip
                        label={catInfo.label}
                        size="small"
                        sx={{ bgcolor: catInfo.color + '1A', color: catInfo.color, fontWeight: 600, fontSize: '0.7rem' }}
                      />
                      {daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 3 && (
                        <Chip
                          icon={<WarningAmberIcon />}
                          label={`${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left`}
                          size="small"
                          sx={{ bgcolor: '#FFF3E0', color: '#E65100', fontWeight: 600, fontSize: '0.7rem' }}
                        />
                      )}
                    </Stack>

                    <Stack direction="row" spacing={3} sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        <strong>Dose:</strong> {med.dosage}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        <EventRepeatIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                        {med.frequency}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {med.route}
                      </Typography>
                    </Stack>

                    {med.prescribedBy && (
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                        Prescribed by {med.prescribedBy} — started{' '}
                        {new Date(med.startDate + 'T12:00:00').toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                        {med.endDate &&
                          ` — ends ${new Date(med.endDate + 'T12:00:00').toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}`}
                      </Typography>
                    )}

                    {med.notes && (
                      <Card elevation={0} sx={{ mt: 1.5, bgcolor: '#FAFBFC' }}>
                        <CardContent sx={{ py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                            {med.notes}
                          </Typography>
                        </CardContent>
                      </Card>
                    )}
                  </Box>

                  <Stack alignItems="center" spacing={0.5}>
                    {med.active && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        startIcon={<CheckCircleOutlineIcon />}
                        onClick={() => handleLogDose(med.id)}
                      >
                        Log Dose
                      </Button>
                    )}
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                        {med.active ? 'Active' : 'Inactive'}
                      </Typography>
                      <Switch
                        size="small"
                        checked={med.active}
                        onChange={() => handleToggleActive(med.id)}
                      />
                      <IconButton size="small" onClick={() => handleDelete(med.id)}>
                        <DeleteOutlineIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                      </IconButton>
                    </Stack>
                  </Stack>
                </Stack>

                {recentLogs.length > 0 && med.active && (
                  <Box sx={{ mt: 2 }}>
                    <Divider sx={{ mb: 1 }} />
                    <Typography variant="body2" fontWeight={600} sx={{ mb: 1, fontSize: '0.8rem' }}>
                      Recent Doses
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {recentLogs.map((log) => (
                        <Chip
                          key={log.id}
                          icon={log.given ? <CheckCircleOutlineIcon /> : undefined}
                          label={`${new Date(log.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${log.time}${log.notes ? ` — ${log.notes}` : ''}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
              </CardContent>
            </MedicationCard>
          );
        })}
      </Stack>

      <Card sx={{ mt: 3, bgcolor: '#FFF3E0' }}>
        <CardContent>
          <Typography variant="body2">
            <strong>Important:</strong> Always follow your pediatrician's dosing instructions. Never give
            aspirin to children under 18. For fever or pain medications, dosage is based on your child's
            weight, not age. When in doubt, call your pediatrician before administering any medication.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
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
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';

import { useChildren, type Child } from '../../context/ChildContext';

type UnitSystem = 'metric' | 'imperial';

const KG_TO_LBS = 2.20462;
const CM_TO_IN = 0.393701;

const kgToLbs = (kg: number) => Math.round(kg * KG_TO_LBS * 100) / 100;
const lbsToKg = (lbs: number) => Math.round(lbs / KG_TO_LBS * 100) / 100;
const cmToIn = (cm: number) => Math.round(cm * CM_TO_IN * 100) / 100;
const inToCm = (inches: number) => Math.round(inches / CM_TO_IN * 100) / 100;

const formatImperialHeight = (cm: number) => {
  const totalInches = cm / 2.54;
  const ft = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${ft}'${inches}"`;
};

const ChildCard = styled(Card)<{ isActive?: boolean }>(({ theme, isActive }) => ({
  cursor: 'pointer',
  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  ...(isActive && {
    border: `2px solid ${theme.palette.primary.main}`,
    boxShadow: `0 0 0 1px ${theme.palette.primary.main}`
  }),
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
  }
}));

const AvatarCircle = styled(Box)<{ bg: string }>(({ bg }) => ({
  width: 64,
  height: 64,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: bg,
  flexShrink: 0
}));

const genderColors: Record<string, { bg: string; icon: string }> = {
  male: { bg: '#E3F2FD', icon: '#1565C0' },
  female: { bg: '#FCE4EC', icon: '#C2185B' },
  other: { bg: '#F3E5F5', icon: '#7B1FA2' }
};

interface ChildFormData {
  name: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  weightKg: string;
  heightCm: string;
}

const emptyForm: ChildFormData = { name: '', dateOfBirth: '', gender: 'male', weightKg: '', heightCm: '' };

export const MyChildren = () => {
  const { children, activeChild, setActiveChildId, addChild, updateChild, removeChild, getAgeDisplay } = useChildren();
  const navigate = useNavigate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ChildFormData>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(
    () => (localStorage.getItem('sprout_unit_system') as UnitSystem) || 'metric'
  );

  const handleUnitChange = (_: unknown, val: UnitSystem | null) => {
    if (!val) return;
    setUnitSystem(val);
    localStorage.setItem('sprout_unit_system', val);

    // Convert existing form values to the new unit
    setForm((f) => {
      const w = parseFloat(f.weightKg);
      const h = parseFloat(f.heightCm);
      return {
        ...f,
        weightKg: !isNaN(w) ? String(val === 'imperial' ? kgToLbs(w) : lbsToKg(w)) : f.weightKg,
        heightCm: !isNaN(h) ? String(val === 'imperial' ? cmToIn(h) : inToCm(h)) : f.heightCm,
      };
    });
  };

  const handleOpen = (child?: Child) => {
    if (child) {
      setEditingId(child.id);
      setForm({
        name: child.name,
        dateOfBirth: child.dateOfBirth,
        gender: child.gender,
        weightKg: child.weightKg != null
          ? String(unitSystem === 'imperial' ? kgToLbs(child.weightKg) : child.weightKg)
          : '',
        heightCm: child.heightCm != null
          ? String(unitSystem === 'imperial' ? cmToIn(child.heightCm) : child.heightCm)
          : '',
      });
    } else {
      setEditingId(null);
      setForm(emptyForm);
    }
    setSaveError(null);
    setDialogOpen(true);
  };

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!form.name.trim() || !form.dateOfBirth) return;

    const rawWeight = parseFloat(form.weightKg);
    const rawHeight = parseFloat(form.heightCm);

    const payload = {
      name: form.name,
      dateOfBirth: form.dateOfBirth,
      gender: form.gender,
      weightKg: !isNaN(rawWeight) ? (unitSystem === 'imperial' ? lbsToKg(rawWeight) : rawWeight) : null,
      heightCm: !isNaN(rawHeight) ? (unitSystem === 'imperial' ? inToCm(rawHeight) : rawHeight) : null,
    };

    setSaving(true);
    setSaveError(null);
    try {
      if (editingId) {
        await updateChild(editingId, payload);
      } else {
        await addChild(payload);
      }
      setDialogOpen(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    removeChild(id);
    setDeleteConfirm(null);
  };

  const handleSelectChild = (id: string) => {
    setActiveChildId(id);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="h3">My Children</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Add Child
        </Button>
      </Stack>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
        Add your children to personalize their growth tracker, milestones, and health records.
      </Typography>

      {children.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <CardContent>
            <ChildCareIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              No children added yet
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, maxWidth: 400, mx: 'auto' }}>
              Add your child to start tracking their growth, milestones, vaccinations, and more.
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
              Add Your First Child
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {children.map((child) => {
            const isActive = activeChild?.id === child.id;
            const colors = genderColors[child.gender] || genderColors.other;

            return (
              <ChildCard key={child.id} isActive={isActive} onClick={() => handleSelectChild(child.id)}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={3}>
                    <AvatarCircle bg={colors.bg}>
                      <ChildCareIcon sx={{ fontSize: 32, color: colors.icon }} />
                    </AvatarCircle>

                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
                        <Typography variant="h5">{child.name}</Typography>
                        {isActive && (
                          <Chip
                            icon={<CheckCircleIcon />}
                            label="Active"
                            size="small"
                            color="primary"
                            sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                          />
                        )}
                      </Stack>
                      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {getAgeDisplay(child)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Born {new Date(child.dateOfBirth).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </Typography>
                        {child.weightKg != null && (
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {child.weightKg} kg ({kgToLbs(child.weightKg)} lbs)
                          </Typography>
                        )}
                        {child.heightCm != null && (
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {child.heightCm} cm ({formatImperialHeight(child.heightCm)})
                          </Typography>
                        )}
                      </Stack>
                    </Box>

                    <Stack direction="row" spacing={0.5}>
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); handleOpen(child); }}
                        sx={{ color: 'text.secondary' }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm(child.id); }}
                        sx={{ color: 'text.secondary' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>

                  {isActive && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Stack direction="row" spacing={1}>
                        <Button size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); navigate('/tracker'); }}>
                          Open Tracker
                        </Button>
                        <Button size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); navigate('/tracker?tab=4'); }}>
                          Milestones
                        </Button>
                      </Stack>
                    </Box>
                  )}
                </CardContent>
              </ChildCard>
            );
          })}
        </Stack>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editingId ? 'Edit Child' : 'Add Child'}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              fullWidth
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              autoFocus
            />
            <TextField
              label="Date of Birth"
              type="date"
              fullWidth
              value={form.dateOfBirth}
              onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <FormControl fullWidth>
              <InputLabel>Gender</InputLabel>
              <Select
                value={form.gender}
                label="Gender"
                onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value as Child['gender'] }))}
              >
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 1 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Current measurements (optional)
              </Typography>
              <ToggleButtonGroup
                value={unitSystem}
                exclusive
                onChange={handleUnitChange}
                size="small"
              >
                <ToggleButton value="metric" sx={{ px: 1.5, py: 0.25, fontSize: '0.75rem' }}>kg / cm</ToggleButton>
                <ToggleButton value="imperial" sx={{ px: 1.5, py: 0.25, fontSize: '0.75rem' }}>lbs / in</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label={`Weight (${unitSystem === 'metric' ? 'kg' : 'lbs'})`}
                type="number"
                value={form.weightKg}
                onChange={(e) => setForm((f) => ({ ...f, weightKg: e.target.value }))}
                sx={{ flex: 1 }}
                slotProps={{ htmlInput: { min: 0, step: 0.1 } }}
              />
              <TextField
                label={`Height (${unitSystem === 'metric' ? 'cm' : 'in'})`}
                type="number"
                value={form.heightCm}
                onChange={(e) => setForm((f) => ({ ...f, heightCm: e.target.value }))}
                sx={{ flex: 1 }}
                slotProps={{ htmlInput: { min: 0, step: 0.1 } }}
              />
            </Stack>
          </Stack>
          {saveError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {saveError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!form.name.trim() || !form.dateOfBirth || saving}
          >
            {saving ? <CircularProgress size={20} color="inherit" /> : editingId ? 'Save Changes' : 'Add Child'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs">
        <DialogTitle>Remove Child?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            This will remove {children.find((c) => c.id === deleteConfirm)?.name} and all their
            associated data. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
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
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';

import { useChildren, type Child } from '../../context/ChildContext';

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
}

const emptyForm: ChildFormData = { name: '', dateOfBirth: '', gender: 'male' };

export const MyChildren = () => {
  const { children, activeChild, setActiveChildId, addChild, updateChild, removeChild, getAgeDisplay } = useChildren();
  const navigate = useNavigate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ChildFormData>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleOpen = (child?: Child) => {
    if (child) {
      setEditingId(child.id);
      setForm({ name: child.name, dateOfBirth: child.dateOfBirth, gender: child.gender });
    } else {
      setEditingId(null);
      setForm(emptyForm);
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.dateOfBirth) return;

    if (editingId) {
      updateChild(editingId, form);
    } else {
      addChild(form);
    }
    setDialogOpen(false);
    setForm(emptyForm);
    setEditingId(null);
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
                      <Stack direction="row" spacing={2}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {getAgeDisplay(child)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Born {new Date(child.dateOfBirth).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </Typography>
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
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!form.name.trim() || !form.dateOfBirth}
          >
            {editingId ? 'Save Changes' : 'Add Child'}
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

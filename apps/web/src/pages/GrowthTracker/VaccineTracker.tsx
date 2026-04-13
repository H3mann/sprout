import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EventIcon from '@mui/icons-material/Event';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import ScheduleIcon from '@mui/icons-material/Schedule';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import { useChildren } from '../../context/ChildContext';
import { vaccinesApi } from '../../services/api';

type VaccineStatus = 'completed' | 'due' | 'upcoming' | 'overdue';

export interface VaccineDose {
  id: string;
  vaccine: string;
  dose: string;
  recommendedAge: string;
  ageMonths: number;
  status: VaccineStatus;
  dateAdministered?: string;
  provider?: string;
  lotNumber?: string;
  notes?: string;
}

const statusConfig: Record<VaccineStatus, { color: string; bg: string; label: string }> = {
  completed: { color: '#4CAF50', bg: '#E8F5E9', label: 'Completed' },
  due: { color: '#FF9800', bg: '#FFF3E0', label: 'Due Now' },
  upcoming: { color: '#2196F3', bg: '#E3F2FD', label: 'Upcoming' },
  overdue: { color: '#F44336', bg: '#FFEBEE', label: 'Overdue' }
};

const StatusIcon = ({ status }: { status: VaccineStatus }) => {
  switch (status) {
    case 'completed':
      return <CheckCircleIcon sx={{ color: statusConfig.completed.color, fontSize: 22 }} />;
    case 'due':
      return <ScheduleIcon sx={{ color: statusConfig.due.color, fontSize: 22 }} />;
    case 'overdue':
      return <WarningAmberIcon sx={{ color: statusConfig.overdue.color, fontSize: 22 }} />;
    default:
      return <RadioButtonUncheckedIcon sx={{ color: '#BDBDBD', fontSize: 22 }} />;
  }
};

const VaccineCard = styled(Card)<{ status: VaccineStatus }>(({ status }) => ({
  borderLeft: `4px solid ${statusConfig[status].color}`,
  '&:hover': {
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
  }
}));

export function computeNaturalStatus(vaccineAgeMonths: number, childAgeMonths: number): VaccineStatus {
  if (childAgeMonths < vaccineAgeMonths) return 'upcoming';
  if (childAgeMonths <= vaccineAgeMonths + 2) return 'due';
  return 'overdue';
}

// CDC recommended immunization schedule for children 0–36 months
export const initialSchedule: VaccineDose[] = [
  // Birth
  { id: '1', vaccine: 'Hepatitis B (HepB)', dose: '1st dose', recommendedAge: 'Birth', ageMonths: 0, status: 'upcoming' },

  // 1 month
  { id: '2', vaccine: 'Hepatitis B (HepB)', dose: '2nd dose', recommendedAge: '1 month', ageMonths: 1, status: 'upcoming' },

  // 2 months
  { id: '3', vaccine: 'DTaP', dose: '1st dose', recommendedAge: '2 months', ageMonths: 2, status: 'upcoming' },
  { id: '4', vaccine: 'IPV (Polio)', dose: '1st dose', recommendedAge: '2 months', ageMonths: 2, status: 'upcoming' },
  { id: '5', vaccine: 'Hib', dose: '1st dose', recommendedAge: '2 months', ageMonths: 2, status: 'upcoming' },
  { id: '6', vaccine: 'PCV13 (Pneumococcal)', dose: '1st dose', recommendedAge: '2 months', ageMonths: 2, status: 'upcoming' },
  { id: '7', vaccine: 'Rotavirus (RV)', dose: '1st dose', recommendedAge: '2 months', ageMonths: 2, status: 'upcoming' },

  // 4 months
  { id: '8', vaccine: 'DTaP', dose: '2nd dose', recommendedAge: '4 months', ageMonths: 4, status: 'upcoming' },
  { id: '9', vaccine: 'IPV (Polio)', dose: '2nd dose', recommendedAge: '4 months', ageMonths: 4, status: 'upcoming' },
  { id: '10', vaccine: 'Hib', dose: '2nd dose', recommendedAge: '4 months', ageMonths: 4, status: 'upcoming' },
  { id: '11', vaccine: 'PCV13 (Pneumococcal)', dose: '2nd dose', recommendedAge: '4 months', ageMonths: 4, status: 'upcoming' },
  { id: '12', vaccine: 'Rotavirus (RV)', dose: '2nd dose', recommendedAge: '4 months', ageMonths: 4, status: 'upcoming' },

  // 6 months
  { id: '13', vaccine: 'DTaP', dose: '3rd dose', recommendedAge: '6 months', ageMonths: 6, status: 'upcoming' },
  { id: '14', vaccine: 'IPV (Polio)', dose: '3rd dose', recommendedAge: '6 months', ageMonths: 6, status: 'upcoming' },
  { id: '15', vaccine: 'Hib', dose: '3rd dose', recommendedAge: '6 months', ageMonths: 6, status: 'upcoming' },
  { id: '16', vaccine: 'PCV13 (Pneumococcal)', dose: '3rd dose', recommendedAge: '6 months', ageMonths: 6, status: 'upcoming' },
  { id: '17', vaccine: 'Rotavirus (RV)', dose: '3rd dose', recommendedAge: '6 months', ageMonths: 6, status: 'upcoming' },
  { id: '18', vaccine: 'Hepatitis B (HepB)', dose: '3rd dose', recommendedAge: '6–18 months', ageMonths: 6, status: 'upcoming' },

  // 6+ months (seasonal)
  { id: '19', vaccine: 'Influenza (Flu)', dose: '1st dose', recommendedAge: '6+ months (yearly)', ageMonths: 6, status: 'upcoming' },

  // 9 months
  { id: '20', vaccine: 'Influenza (Flu)', dose: '2nd dose', recommendedAge: '9 months', ageMonths: 9, status: 'upcoming' },

  // 12 months
  { id: '21', vaccine: 'MMR', dose: '1st dose', recommendedAge: '12–15 months', ageMonths: 12, status: 'upcoming' },
  { id: '22', vaccine: 'Varicella', dose: '1st dose', recommendedAge: '12–15 months', ageMonths: 12, status: 'upcoming' },
  { id: '23', vaccine: 'Hepatitis A (HepA)', dose: '1st dose', recommendedAge: '12–23 months', ageMonths: 12, status: 'upcoming' },
  { id: '24', vaccine: 'PCV13 (Pneumococcal)', dose: '4th dose', recommendedAge: '12–15 months', ageMonths: 12, status: 'upcoming' },
  { id: '25', vaccine: 'Hib', dose: '4th dose (booster)', recommendedAge: '12–15 months', ageMonths: 12, status: 'upcoming' },

  // 15–18 months
  { id: '26', vaccine: 'DTaP', dose: '4th dose', recommendedAge: '15–18 months', ageMonths: 15, status: 'upcoming' },

  // 18+ months
  { id: '27', vaccine: 'Hepatitis A (HepA)', dose: '2nd dose', recommendedAge: '18+ months', ageMonths: 18, status: 'upcoming' },

  // 4–6 years
  { id: '28', vaccine: 'DTaP', dose: '5th dose', recommendedAge: '4–6 years', ageMonths: 48, status: 'upcoming' },
  { id: '29', vaccine: 'IPV (Polio)', dose: '4th dose', recommendedAge: '4–6 years', ageMonths: 48, status: 'upcoming' },
  { id: '30', vaccine: 'MMR', dose: '2nd dose', recommendedAge: '4–6 years', ageMonths: 48, status: 'upcoming' },
  { id: '31', vaccine: 'Varicella', dose: '2nd dose', recommendedAge: '4–6 years', ageMonths: 48, status: 'upcoming' },
];

export const VaccineTracker = () => {
  const { activeChild, getAgeMonths } = useChildren();
  const [schedule, setSchedule] = useState<VaccineDose[]>(initialSchedule);
  const [expandedAge, setExpandedAge] = useState<string | null>(null);

  const childAgeMonths = activeChild ? getAgeMonths(activeChild) : 0;

  // Build schedule with natural statuses from child's age, then overlay API data
  useEffect(() => {
    const base = initialSchedule.map((entry) => ({
      ...entry,
      status: computeNaturalStatus(entry.ageMonths, childAgeMonths),
    }));

    if (!activeChild) {
      setSchedule(base);
      return;
    }

    vaccinesApi.list(activeChild.id).then((records) => {
      setSchedule(
        base.map((dose) => {
          const record = records.find((r) => r.vaccine_id === dose.id);
          if (!record) return dose;
          return {
            ...dose,
            status: record.status as VaccineStatus,
            dateAdministered: record.date_administered || undefined,
            provider: record.provider || undefined,
            lotNumber: record.lot_number || undefined,
            notes: record.notes || undefined,
          };
        })
      );
    }).catch(() => {
      setSchedule(base);
    });
  }, [activeChild, childAgeMonths]);

  const completed = schedule.filter((v) => v.status === 'completed').length;
  const total = schedule.length;
  const due = schedule.filter((v) => v.status === 'due').length;
  const overdue = schedule.filter((v) => v.status === 'overdue').length;
  const progress = Math.round((completed / total) * 100);

  const handleToggle = (id: string) => {
    const dose = schedule.find((v) => v.id === id);
    if (!dose) return;

    if (dose.status === 'completed') {
      // Uncomplete — revert to natural status based on child's age
      const naturalStatus = computeNaturalStatus(dose.ageMonths, childAgeMonths);
      setSchedule((prev) =>
        prev.map((v) =>
          v.id === id
            ? { ...v, status: naturalStatus, dateAdministered: undefined, provider: undefined, lotNumber: undefined, notes: undefined }
            : v
        )
      );
      if (activeChild) {
        vaccinesApi.remove(activeChild.id, id).catch(() => {});
      }
    } else {
      // Mark complete
      const today = new Date().toISOString().split('T')[0];
      setSchedule((prev) =>
        prev.map((v) =>
          v.id === id
            ? { ...v, status: 'completed' as VaccineStatus, dateAdministered: today }
            : v
        )
      );
      if (activeChild) {
        vaccinesApi.upsert({
          child_id: activeChild.id,
          vaccine_id: id,
          status: 'completed',
          date_administered: today,
        }).catch(() => {});
      }
    }
  };

  const handleSelectAll = (doses: VaccineDose[]) => {
    const allCompleted = doses.every((d) => d.status === 'completed');

    if (allCompleted) {
      // Deselect all — revert each to natural status
      const updates = doses.map((d) => ({
        id: d.id,
        naturalStatus: computeNaturalStatus(d.ageMonths, childAgeMonths),
      }));
      const ids = new Set(updates.map((u) => u.id));
      setSchedule((prev) =>
        prev.map((v) => {
          const upd = updates.find((u) => u.id === v.id);
          if (!upd) return v;
          return { ...v, status: upd.naturalStatus, dateAdministered: undefined, provider: undefined, lotNumber: undefined, notes: undefined };
        })
      );
      if (activeChild) {
        ids.forEach((id) => vaccinesApi.remove(activeChild.id, id).catch(() => {}));
      }
    } else {
      // Select all — mark each incomplete one as completed
      const today = new Date().toISOString().split('T')[0];
      const incompleteIds = new Set(doses.filter((d) => d.status !== 'completed').map((d) => d.id));
      setSchedule((prev) =>
        prev.map((v) =>
          incompleteIds.has(v.id)
            ? { ...v, status: 'completed' as VaccineStatus, dateAdministered: today }
            : v
        )
      );
      if (activeChild) {
        incompleteIds.forEach((id) =>
          vaccinesApi.upsert({
            child_id: activeChild.id,
            vaccine_id: id,
            status: 'completed',
            date_administered: today,
          }).catch(() => {})
        );
      }
    }
  };

  // Group by recommended age
  const grouped = schedule.reduce<Record<string, VaccineDose[]>>((acc, dose) => {
    const key = dose.recommendedAge;
    if (!acc[key]) acc[key] = [];
    acc[key].push(dose);
    return acc;
  }, {});

  const sortedGroups = Object.entries(grouped).sort(([, a], [, b]) => a[0].ageMonths - b[0].ageMonths);

  const getGroupStatus = (doses: VaccineDose[]): VaccineStatus => {
    if (doses.some((d) => d.status === 'overdue')) return 'overdue';
    if (doses.some((d) => d.status === 'due')) return 'due';
    if (doses.every((d) => d.status === 'completed')) return 'completed';
    return 'upcoming';
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h3" gutterBottom>
          Vaccine Schedule
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Track immunizations against the CDC recommended schedule. Tap a group to see details and check off completed vaccines.
        </Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h5">Immunization Progress</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {completed} of {total} doses
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 10,
              borderRadius: 5,
              bgcolor: '#E8F5E9',
              '& .MuiLinearProgress-bar': {
                borderRadius: 5,
                bgcolor: '#4CAF50'
              },
              mb: 2
            }}
          />
          <Stack direction="row" spacing={2}>
            <Chip
              icon={<CheckCircleIcon />}
              label={`${completed} Completed`}
              size="small"
              sx={{ bgcolor: statusConfig.completed.bg, color: statusConfig.completed.color }}
            />
            {due > 0 && (
              <Chip
                icon={<ScheduleIcon />}
                label={`${due} Due Now`}
                size="small"
                sx={{ bgcolor: statusConfig.due.bg, color: statusConfig.due.color }}
              />
            )}
            {overdue > 0 && (
              <Chip
                icon={<WarningAmberIcon />}
                label={`${overdue} Overdue`}
                size="small"
                sx={{ bgcolor: statusConfig.overdue.bg, color: statusConfig.overdue.color }}
              />
            )}
          </Stack>
        </CardContent>
      </Card>

      <Stack spacing={2}>
        {sortedGroups.map(([ageLabel, doses]) => {
          const groupStatus = getGroupStatus(doses);
          const isExpanded = expandedAge === ageLabel;
          const completedInGroup = doses.filter((d) => d.status === 'completed').length;
          const allCompletedInGroup = completedInGroup === doses.length;

          return (
            <Card
              key={ageLabel}
              sx={{ cursor: 'pointer' }}
              onClick={() => setExpandedAge(isExpanded ? null : ageLabel)}
            >
              <CardContent sx={{ pb: isExpanded ? 1 : undefined }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <StatusIcon status={groupStatus} />
                    <Box>
                      <Typography variant="body1" fontWeight={600}>
                        {ageLabel}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {doses.length} vaccine{doses.length > 1 ? 's' : ''} — {completedInGroup} completed
                      </Typography>
                    </Box>
                  </Stack>
                  <Chip
                    label={statusConfig[groupStatus].label}
                    size="small"
                    sx={{
                      bgcolor: statusConfig[groupStatus].bg,
                      color: statusConfig[groupStatus].color,
                      fontWeight: 600
                    }}
                  />
                </Stack>

                {isExpanded && (
                  <Box sx={{ mt: 2 }}>
                    <Divider sx={{ mb: 1.5 }} />
                    <Box sx={{ mb: 1.5 }}>
                      <Button
                        size="small"
                        variant="text"
                        startIcon={allCompletedInGroup ? <RadioButtonUncheckedIcon /> : <CheckCircleIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAll(doses);
                        }}
                        sx={{ fontSize: '0.8rem', textTransform: 'none' }}
                      >
                        {allCompletedInGroup ? 'Deselect All' : 'Select All'}
                      </Button>
                    </Box>
                    <Stack spacing={1.5}>
                      {doses.map((dose) => (
                        <VaccineCard key={dose.id} status={dose.status} elevation={0} sx={{ bgcolor: '#FAFBFC' }}>
                          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Box sx={{ flex: 1 }}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <Typography variant="body2" fontWeight={600}>
                                    {dose.vaccine}
                                  </Typography>
                                  <Chip label={dose.dose} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 22 }} />
                                </Stack>
                                {dose.status === 'completed' && dose.dateAdministered && (
                                  <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                                      <EventIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                                      {new Date(dose.dateAdministered + 'T12:00:00').toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                      })}
                                    </Typography>
                                    {dose.provider && (
                                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                                        {dose.provider}
                                      </Typography>
                                    )}
                                    {dose.lotNumber && (
                                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                                        Lot: {dose.lotNumber}
                                      </Typography>
                                    )}
                                  </Stack>
                                )}
                              </Box>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggle(dose.id);
                                }}
                                sx={{
                                  color: dose.status === 'completed' ? statusConfig.completed.color : '#BDBDBD',
                                  '&:hover': {
                                    color: dose.status === 'completed' ? '#388E3C' : '#4CAF50',
                                    bgcolor: dose.status === 'completed' ? '#FFEBEE' : '#E8F5E9',
                                  },
                                }}
                              >
                                {dose.status === 'completed'
                                  ? <CheckCircleIcon />
                                  : <RadioButtonUncheckedIcon />
                                }
                              </IconButton>
                            </Stack>
                          </CardContent>
                        </VaccineCard>
                      ))}
                    </Stack>
                  </Box>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Stack>

      <Card sx={{ mt: 3, bgcolor: '#E3F2FD' }}>
        <CardContent>
          <Typography variant="body2">
            <strong>Note:</strong> This schedule follows the CDC/ACIP recommended immunization schedule.
            Always consult with your pediatrician for your child's specific needs, especially if doses
            were missed or delayed. Some children may need additional vaccines based on health conditions
            or travel plans.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

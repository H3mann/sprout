import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import StraightenIcon from '@mui/icons-material/Straighten';
import VaccinesIcon from '@mui/icons-material/Vaccines';
import { useNavigate } from 'react-router-dom';

import { useChildren } from '../../context/ChildContext';
import { getMilestonesForChild } from '../../data/milestones';
import { milestonesApi, vaccinesApi } from '../../services/api';
import { initialSchedule } from './VaccineTracker';
import {
  HEIGHT_BOYS_CM,
  HEIGHT_GIRLS_CM,
  WEIGHT_BOYS_KG,
  WEIGHT_GIRLS_KG
} from '../../data/growthPercentiles';

const KG_TO_LBS = 2.20462;
const CM_TO_IN = 0.393701;

type UnitSystem = 'metric' | 'imperial';

function getUnitSystem(): UnitSystem {
  return (localStorage.getItem('sprout_unit_system') as UnitSystem) || 'metric';
}

function formatWeight(kg: number, units: UnitSystem): string {
  if (units === 'imperial') return `${Math.round(kg * KG_TO_LBS * 10) / 10} lbs`;
  return `${Math.round(kg * 10) / 10} kg`;
}

function formatHeight(cm: number, units: UnitSystem): string {
  if (units === 'imperial') {
    const totalIn = cm * CM_TO_IN;
    const ft = Math.floor(totalIn / 12);
    const inches = Math.round(totalIn % 12);
    return `${Math.round(totalIn * 10) / 10} in (${ft}'${inches}")`;
  }
  return `${Math.round(cm * 10) / 10} cm`;
}

function getPercentileBand(value: number, ageMonths: number, dataset: number[][]): string | null {
  if (dataset.length === 0) return null;
  const closest = dataset.reduce((prev, curr) =>
    Math.abs(curr[0] - ageMonths) < Math.abs(prev[0] - ageMonths) ? curr : prev
  );
  if (value <= closest[1]) return '<3rd';
  if (value <= closest[2]) return '3rd–15th';
  if (value <= closest[3]) return '15th–50th';
  if (value <= closest[4]) return '50th–85th';
  if (value <= closest[5]) return '85th–97th';
  return '>97th';
}

function percentileColor(band: string): { bg: string; text: string } {
  if (band === '<3rd' || band === '>97th') return { bg: '#FFF3E0', text: '#E65100' };
  if (band === '3rd–15th' || band === '85th–97th') return { bg: '#FFF8E1', text: '#F57F17' };
  return { bg: '#E8F5E9', text: '#388E3C' };
}

const StatCard = styled(Card)(() => ({
  flex: 1,
  minWidth: 200,
  position: 'relative',
  overflow: 'visible'
}));

const StatIconWrapper = styled(Box)<{ bgcolor: string }>(({ bgcolor }) => ({
  width: 44,
  height: 44,
  borderRadius: 10,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: bgcolor
}));

const QuickActionCard = styled(Card)(() => ({
  cursor: 'pointer',
  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
  }
}));

const TOTAL_VACCINES = initialSchedule.length;

export const Dashboard = () => {
  const { activeChild, getAgeDisplay, getAgeMonths } = useChildren();
  const navigate = useNavigate();

  const [milestoneCompleted, setMilestoneCompleted] = useState(0);
  const [milestoneTotal, setMilestoneTotal] = useState(0);
  const [vaccineCompleted, setVaccineCompleted] = useState(0);
  const [vaccineDue, setVaccineDue] = useState(0);

  const ageMonthsVal = activeChild ? getAgeMonths(activeChild) : 0;

  useEffect(() => {
    if (!activeChild) return;

    // Load milestones
    const ageGroups = getMilestonesForChild(ageMonthsVal);
    const total = ageGroups.reduce((sum, g) => sum + g.milestones.length, 0);
    setMilestoneTotal(total);

    milestonesApi.list(activeChild.id).then((records) => {
      // Count only milestones that are in the current age range
      const completedIds = new Set(records.map((r) => r.milestone_id));
      const relevant = ageGroups.reduce(
        (sum, g) => sum + g.milestones.filter((m) => completedIds.has(m.id)).length, 0
      );
      setMilestoneCompleted(relevant);
    }).catch(() => {});

    // Load vaccines — merge API records with initial schedule defaults
    vaccinesApi.list(activeChild.id).then((records) => {
      const merged = initialSchedule.map((dose) => {
        const record = records.find((r) => r.vaccine_id === dose.id);
        return record ? { ...dose, status: record.status } : dose;
      });
      setVaccineCompleted(merged.filter((v) => v.status === 'completed').length);
      setVaccineDue(merged.filter((v) => v.status === 'due' || v.status === 'overdue').length);
    }).catch(() => {
      // Fall back to initial schedule defaults
      setVaccineCompleted(initialSchedule.filter((v) => v.status === 'completed').length);
      setVaccineDue(initialSchedule.filter((v) => v.status === 'due' || v.status === 'overdue').length);
    });
  }, [activeChild, ageMonthsVal]);

  if (!activeChild) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <ChildCareIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          No child selected
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
          Add a child to start tracking their growth and health.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/children')}>
          Add Child
        </Button>
      </Box>
    );
  }

  const units = getUnitSystem();
  const ageDisplay = getAgeDisplay(activeChild);
  const ageMonths = getAgeMonths(activeChild);
  const sex = activeChild.gender;

  const hasWeight = activeChild.weightKg != null && activeChild.weightKg > 0;
  const hasHeight = activeChild.heightCm != null && activeChild.heightCm > 0;

  const weightDataset = sex === 'male' ? WEIGHT_BOYS_KG : WEIGHT_GIRLS_KG;
  const heightDataset = sex === 'male' ? HEIGHT_BOYS_CM : HEIGHT_GIRLS_CM;

  const weightBand = hasWeight ? getPercentileBand(activeChild.weightKg!, ageMonths, weightDataset) : null;
  const heightBand = hasHeight ? getPercentileBand(activeChild.heightCm!, ageMonths, heightDataset) : null;

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
          <Typography variant="h3">{activeChild.name}'s Dashboard</Typography>
          <Chip
            icon={<ChildCareIcon />}
            label={ageDisplay}
            color="primary"
            variant="outlined"
            size="small"
          />
        </Stack>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Here's a snapshot of {activeChild.name}'s latest health data.
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: 3,
          mb: 4
        }}
      >
        <StatCard>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="start" sx={{ mb: 2 }}>
              <StatIconWrapper bgcolor="#E8F5E9">
                <ShowChartIcon sx={{ color: '#4CAF50' }} />
              </StatIconWrapper>
            </Stack>
            <Typography variant="h3" sx={{ mb: 0.5 }}>
              {hasWeight ? formatWeight(activeChild.weightKg!, units) : '--'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Last recorded weight
            </Typography>
            {weightBand ? (
              <Chip
                label={`${weightBand} percentile`}
                size="small"
                sx={{ mt: 1, bgcolor: percentileColor(weightBand).bg, color: percentileColor(weightBand).text }}
              />
            ) : (
              <Chip label="No data" size="small" sx={{ mt: 1 }} variant="outlined" />
            )}
          </CardContent>
        </StatCard>

        <StatCard>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="start" sx={{ mb: 2 }}>
              <StatIconWrapper bgcolor="#E3F2FD">
                <StraightenIcon sx={{ color: '#2196F3' }} />
              </StatIconWrapper>
            </Stack>
            <Typography variant="h3" sx={{ mb: 0.5 }}>
              {hasHeight ? formatHeight(activeChild.heightCm!, units) : '--'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Last recorded height
            </Typography>
            {heightBand ? (
              <Chip
                label={`${heightBand} percentile`}
                size="small"
                sx={{ mt: 1, bgcolor: percentileColor(heightBand).bg, color: percentileColor(heightBand).text }}
              />
            ) : (
              <Chip label="No data" size="small" sx={{ mt: 1 }} variant="outlined" />
            )}
          </CardContent>
        </StatCard>

        <StatCard>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="start" sx={{ mb: 2 }}>
              <StatIconWrapper bgcolor="#FFF3E0">
                <EmojiEventsIcon sx={{ color: '#FF9800' }} />
              </StatIconWrapper>
            </Stack>
            <Typography variant="h3" sx={{ mb: 0.5 }}>
              {milestoneCompleted}/{milestoneTotal}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Milestones reached
            </Typography>
            {milestoneTotal > 0 && (
              <LinearProgress
                variant="determinate"
                value={Math.round((milestoneCompleted / milestoneTotal) * 100)}
                sx={{ mt: 1.5, height: 6, borderRadius: 3 }}
                color="warning"
              />
            )}
          </CardContent>
        </StatCard>

        <StatCard>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="start" sx={{ mb: 2 }}>
              <StatIconWrapper bgcolor="#E8F5E9">
                <VaccinesIcon sx={{ color: '#4CAF50' }} />
              </StatIconWrapper>
            </Stack>
            <Typography variant="h3" sx={{ mb: 0.5 }}>
              {vaccineCompleted}/{TOTAL_VACCINES}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Vaccines completed
            </Typography>
            {vaccineDue > 0 ? (
              <Chip
                label={`${vaccineDue} due/overdue`}
                size="small"
                sx={{ mt: 1, bgcolor: '#FFF3E0', color: '#E65100' }}
              />
            ) : (
              <Chip label="Up to date" size="small" sx={{ mt: 1, bgcolor: '#E8F5E9', color: '#388E3C' }} />
            )}
          </CardContent>
        </StatCard>

        <StatCard>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="start" sx={{ mb: 2 }}>
              <StatIconWrapper bgcolor="#F3E5F5">
                <ChildCareIcon sx={{ color: '#7B1FA2' }} />
              </StatIconWrapper>
            </Stack>
            <Typography variant="h3" sx={{ mb: 0.5 }}>
              {ageDisplay}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Current age
            </Typography>
            <Chip
              label={sex === 'male' ? 'Boy' : sex === 'female' ? 'Girl' : 'Other'}
              size="small"
              sx={{ mt: 1, bgcolor: '#F3E5F5', color: '#7B1FA2' }}
            />
          </CardContent>
        </StatCard>
      </Box>

      <Typography variant="h5" sx={{ mb: 2 }}>
        Quick Actions
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: 2
        }}
      >
        <QuickActionCard>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2}>
              <IconButton sx={{ bgcolor: '#E8F5E9' }}>
                <AddIcon sx={{ color: '#4CAF50' }} />
              </IconButton>
              <Box>
                <Typography variant="body1" fontWeight={600}>
                  Log Measurement
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Record height or weight
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </QuickActionCard>

        <QuickActionCard sx={{ opacity: 0.65, cursor: 'default', '&:hover': { transform: 'none', boxShadow: 'none' } }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2}>
              <IconButton sx={{ bgcolor: '#FFF3E0' }}>
                <RestaurantIcon sx={{ color: '#FF9800' }} />
              </IconButton>
              <Box sx={{ flex: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="body1" fontWeight={600}>
                    Log Meal
                  </Typography>
                  <Chip
                    label="Coming Soon"
                    size="small"
                    sx={{ bgcolor: '#FFF3E0', color: '#E65100', fontWeight: 600, fontSize: '0.65rem', height: 20 }}
                  />
                </Stack>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Meal tracking and nutrition insights — in progress
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </QuickActionCard>
      </Box>

      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Upcoming
          </Typography>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Chip label="Vaccine" color="warning" size="small" />
              <Typography variant="body2">Schedule upcoming vaccines</Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Chip label="Checkup" color="primary" size="small" />
              <Typography variant="body2">
                {ageMonths < 12
                  ? `${Math.ceil((ageMonths + 1) / 3) * 3}-month well-child visit — schedule now`
                  : `Annual well-child visit — schedule now`}
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

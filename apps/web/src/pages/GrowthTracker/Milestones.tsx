import { useCallback, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import EmojiPeopleIcon from '@mui/icons-material/EmojiPeople';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PsychologyIcon from '@mui/icons-material/Psychology';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';

import { useChildren } from '../../context/ChildContext';
import {
  getMilestonesForChild,
  type Milestone,
  type MilestoneCategory
} from '../../data/milestones';
import { milestonesApi } from '../../services/api';

const MilestoneCard = styled(Card)<{ completed?: boolean }>(({ theme, completed }) => ({
  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  ...(completed && {
    opacity: 0.85,
    borderLeft: `4px solid ${theme.palette.primary.main}`
  }),
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
  }
}));

const categoryConfig: Record<MilestoneCategory, { icon: React.ReactNode; color: string; bg: string }> = {
  Motor: { icon: <DirectionsRunIcon sx={{ fontSize: 18 }} />, color: '#4CAF50', bg: '#E8F5E9' },
  Language: { icon: <RecordVoiceOverIcon sx={{ fontSize: 18 }} />, color: '#2196F3', bg: '#E3F2FD' },
  Cognitive: { icon: <PsychologyIcon sx={{ fontSize: 18 }} />, color: '#FF9800', bg: '#FFF3E0' },
  Social: { icon: <EmojiPeopleIcon sx={{ fontSize: 18 }} />, color: '#9C27B0', bg: '#F3E5F5' }
};

function ageLabel(months: number): string {
  if (months < 12) return `${months} months`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m > 0 ? `${y} year${y > 1 ? 's' : ''} ${m} mo` : `${y} year${y > 1 ? 's' : ''}`;
}

export const Milestones = () => {
  const { activeChild, getAgeMonths } = useChildren();
  const childAgeMonths = activeChild ? getAgeMonths(activeChild) : 9;

  const ageGroups = useMemo(() => getMilestonesForChild(childAgeMonths), [childAgeMonths]);

  const [completed, setCompleted] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('sprout_milestones_completed');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Load from API when child is selected
  useEffect(() => {
    if (!activeChild) return;
    milestonesApi.list(activeChild.id).then((records) => {
      const ids = new Set(records.map((r) => r.milestone_id));
      setCompleted(ids);
    }).catch(() => { /* fall back to localStorage state */ });
  }, [activeChild]);

  const [expandedAge, setExpandedAge] = useState<number | null>(childAgeMonths);
  const [categoryFilter, setCategoryFilter] = useState<MilestoneCategory | 'All'>('All');

  const toggleCompleted = useCallback((id: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (activeChild) milestonesApi.uncomplete(activeChild.id, id).catch(() => {});
      } else {
        next.add(id);
        if (activeChild) milestonesApi.complete(activeChild.id, id).catch(() => {});
      }
      localStorage.setItem('sprout_milestones_completed', JSON.stringify([...next]));
      return next;
    });
  }, [activeChild]);

  const filterMilestones = (milestones: Milestone[]) => {
    if (categoryFilter === 'All') return milestones;
    return milestones.filter((m) => m.category === categoryFilter);
  };

  const totalMilestones = ageGroups.reduce((sum, g) => sum + g.milestones.length, 0);
  const completedCount = ageGroups.reduce(
    (sum, g) => sum + g.milestones.filter((m) => completed.has(m.id)).length,
    0
  );

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h3" gutterBottom>
          Developmental Milestones
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 640 }}>
          Track your child's developmental milestones based on CDC/AAP guidelines. Every child
          develops at their own pace — these are general guidelines, not strict deadlines.
        </Typography>
      </Box>

      {/* Overall progress */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
            <Typography variant="body2" fontWeight={600}>
              Overall Progress
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {completedCount} of {totalMilestones} milestones reached
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={totalMilestones > 0 ? (completedCount / totalMilestones) * 100 : 0}
            sx={{
              height: 10,
              borderRadius: 5,
              bgcolor: '#E8F5E9',
              '& .MuiLinearProgress-bar': { borderRadius: 5 }
            }}
          />
        </CardContent>
      </Card>

      {/* Category filter */}
      <ToggleButtonGroup
        value={categoryFilter}
        exclusive
        onChange={(_, val) => val && setCategoryFilter(val)}
        size="small"
        sx={{ mb: 3, flexWrap: 'wrap', gap: 0.5 }}
      >
        <ToggleButton value="All" sx={{ textTransform: 'none', px: 2 }}>All</ToggleButton>
        {(Object.keys(categoryConfig) as MilestoneCategory[]).map((cat) => (
          <ToggleButton key={cat} value={cat} sx={{ textTransform: 'none', px: 2, gap: 0.5 }}>
            {categoryConfig[cat].icon}
            {cat}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {/* Age groups */}
      <Stack spacing={3}>
        {ageGroups.map(({ age, milestones }) => {
          const filtered = filterMilestones(milestones);
          if (filtered.length === 0) return null;

          const isExpanded = expandedAge === age;
          const ageCompleted = milestones.filter((m) => completed.has(m.id)).length;
          const isCurrentAge = age === childAgeMonths;
          const isPast = age < childAgeMonths;
          const isUpcoming = age > childAgeMonths;

          return (
            <Card
              key={age}
              sx={{
                ...(isCurrentAge && { border: '2px solid', borderColor: 'primary.main' })
              }}
            >
              <CardActionArea onClick={() => setExpandedAge(isExpanded ? null : age)}>
                <CardContent sx={{ py: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Typography variant="body1" fontWeight={700}>
                        {ageLabel(age)}
                      </Typography>
                      {isCurrentAge && (
                        <Chip label="Current" size="small" color="primary" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                      )}
                      {isUpcoming && (
                        <Chip label="Coming up" size="small" sx={{ bgcolor: '#E3F2FD', color: '#1565C0', fontWeight: 600, fontSize: '0.7rem' }} />
                      )}
                      {isPast && ageCompleted === milestones.length && (
                        <Chip
                          icon={<CheckCircleIcon />}
                          label="Complete"
                          size="small"
                          sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 600, fontSize: '0.7rem' }}
                        />
                      )}
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                        {ageCompleted}/{milestones.length}
                      </Typography>
                      <ExpandMoreIcon
                        sx={{
                          transform: isExpanded ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s',
                          color: 'text.secondary'
                        }}
                      />
                    </Stack>
                  </Stack>

                  {!isExpanded && (
                    <LinearProgress
                      variant="determinate"
                      value={milestones.length > 0 ? (ageCompleted / milestones.length) * 100 : 0}
                      sx={{
                        mt: 1.5,
                        height: 6,
                        borderRadius: 3,
                        bgcolor: '#F0F0F0',
                        '& .MuiLinearProgress-bar': { borderRadius: 3 }
                      }}
                    />
                  )}
                </CardContent>
              </CardActionArea>

              <Collapse in={isExpanded}>
                <Divider />
                <CardContent sx={{ pt: 2 }}>
                  <Stack spacing={1.5}>
                    {filtered.map((milestone) => {
                      const isCompleted = completed.has(milestone.id);
                      const cat = categoryConfig[milestone.category];

                      return (
                        <MilestoneCard key={milestone.id} completed={isCompleted}>
                          <CardActionArea
                            onClick={() => toggleCompleted(milestone.id)}
                            sx={{ borderRadius: 3 }}
                          >
                            <CardContent sx={{ py: 1.5, px: 2 }}>
                              <Stack direction="row" spacing={2} alignItems="flex-start">
                                {isCompleted ? (
                                  <CheckCircleIcon sx={{ color: 'primary.main', fontSize: 24, mt: 0.2 }} />
                                ) : (
                                  <RadioButtonUncheckedIcon sx={{ color: 'text.disabled', fontSize: 24, mt: 0.2 }} />
                                )}
                                <Box sx={{ flex: 1 }}>
                                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                                    <Typography
                                      variant="body2"
                                      fontWeight={600}
                                      sx={{
                                        ...(isCompleted && { textDecoration: 'line-through', color: 'text.secondary' })
                                      }}
                                    >
                                      {milestone.title}
                                    </Typography>
                                    <Chip
                                      icon={cat.icon as React.ReactElement}
                                      label={milestone.category}
                                      size="small"
                                      sx={{
                                        bgcolor: cat.bg,
                                        color: cat.color,
                                        fontWeight: 600,
                                        fontSize: '0.65rem',
                                        height: 22,
                                        '& .MuiChip-icon': { color: cat.color }
                                      }}
                                    />
                                  </Stack>
                                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem', lineHeight: 1.5 }}>
                                    {milestone.description}
                                  </Typography>
                                </Box>
                              </Stack>
                            </CardContent>
                          </CardActionArea>
                        </MilestoneCard>
                      );
                    })}
                  </Stack>
                </CardContent>
              </Collapse>
            </Card>
          );
        })}
      </Stack>

      {/* Disclaimer */}
      <Card sx={{ mt: 4, bgcolor: '#FAFBFC' }}>
        <CardContent sx={{ py: 2 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
            <strong>Note:</strong> Milestones are based on CDC/AAP developmental guidelines. Children develop at
            different rates — reaching a milestone a bit early or late is usually normal. Talk to your
            pediatrician if you have concerns about your child's development.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

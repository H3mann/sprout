import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import StraightenIcon from '@mui/icons-material/Straighten';
import { useNavigate } from 'react-router-dom';

import { useChildren } from '../../context/ChildContext';

const StatCard = styled(Card)(({ theme }) => ({
  flex: 1,
  minWidth: 200,
  position: 'relative',
  overflow: 'visible'
}));

const StatIconWrapper = styled(Box)<{ bgcolor: string }>(({ theme, bgcolor }) => ({
  width: 44,
  height: 44,
  borderRadius: 10,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: bgcolor
}));

const QuickActionCard = styled(Card)(({ theme }) => ({
  cursor: 'pointer',
  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
  }
}));

export const Dashboard = () => {
  const { activeChild, getAgeDisplay } = useChildren();
  const navigate = useNavigate();

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

  const ageDisplay = getAgeDisplay(activeChild);

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
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
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
              {'--'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Last recorded weight
            </Typography>
            <Chip label="50th percentile" size="small" sx={{ mt: 1, bgcolor: '#E8F5E9', color: '#388E3C' }} />
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
              {'--'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Last recorded height
            </Typography>
            <Chip label="55th percentile" size="small" sx={{ mt: 1, bgcolor: '#E3F2FD', color: '#1565C0' }} />
          </CardContent>
        </StatCard>

        <StatCard>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="start" sx={{ mb: 2 }}>
              <StatIconWrapper bgcolor="#F3E5F5">
                <NightsStayIcon sx={{ color: '#9C27B0' }} />
              </StatIconWrapper>
            </Stack>
            <Typography variant="h3" sx={{ mb: 0.5 }}>
              {'--'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Last night's sleep
            </Typography>
            <Chip label="On track" size="small" sx={{ mt: 1, bgcolor: '#F3E5F5', color: '#7B1FA2' }} />
          </CardContent>
        </StatCard>

        <StatCard>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="start" sx={{ mb: 2 }}>
              <StatIconWrapper bgcolor="#FFF3E0">
                <RestaurantIcon sx={{ color: '#FF9800' }} />
              </StatIconWrapper>
            </Stack>
            <Typography variant="h3" sx={{ mb: 0.5 }}>
              5 meals
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Logged today
            </Typography>
            <Chip label="Good variety" size="small" sx={{ mt: 1, bgcolor: '#FFF3E0', color: '#E65100' }} />
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

        <QuickActionCard>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2}>
              <IconButton sx={{ bgcolor: '#F3E5F5' }}>
                <NightsStayIcon sx={{ color: '#9C27B0' }} />
              </IconButton>
              <Box>
                <Typography variant="body1" fontWeight={600}>
                  Log Sleep
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Record last night's sleep
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </QuickActionCard>

        <QuickActionCard>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2}>
              <IconButton sx={{ bgcolor: '#FFF3E0' }}>
                <RestaurantIcon sx={{ color: '#FF9800' }} />
              </IconButton>
              <Box>
                <Typography variant="body1" fontWeight={600}>
                  Log Meal
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Track today's meals
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
              <Typography variant="body2">{'Schedule upcoming vaccines'}</Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Chip label="Checkup" color="primary" size="small" />
              <Typography variant="body2">9-month well-child visit — schedule now</Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

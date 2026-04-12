import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { useSearchParams } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MedicationIcon from '@mui/icons-material/Medication';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import VaccinesIcon from '@mui/icons-material/Vaccines';

import { Dashboard } from './Dashboard';
import { GrowthChart } from './GrowthChart';
import { MealTracking } from './MealTracking';
import { MedicationTracker } from './MedicationTracker';
import { Milestones } from './Milestones';
import { SleepTracker } from './SleepTracker';
import { VaccineTracker } from './VaccineTracker';

export const GrowthTracker = () => {
  const [searchParams] = useSearchParams();
  const initialTab = Number(searchParams.get('tab')) || 0;
  const [tab, setTab] = useState(initialTab);

  // Sync tab when navigating with ?tab= param
  useEffect(() => {
    const paramTab = Number(searchParams.get('tab')) || 0;
    if (paramTab !== tab) setTab(paramTab);
  }, [searchParams]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs
          value={tab}
          onChange={(_, newValue) => setTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<DashboardIcon />} iconPosition="start" label="Dashboard" />
          <Tab icon={<ShowChartIcon />} iconPosition="start" label="Growth Chart" />
          <Tab icon={<RestaurantIcon />} iconPosition="start" label="Meals" />
          <Tab icon={<EmojiEventsIcon />} iconPosition="start" label="Milestones" />
          <Tab icon={<VaccinesIcon />} iconPosition="start" label="Vaccines" />
        </Tabs>
      </Box>

      {tab === 0 && <Dashboard />}
      {tab === 1 && <GrowthChart />}
      {tab === 2 && <MealTracking />}
      {tab === 3 && <Milestones />}
      {tab === 4 && <VaccineTracker />}
    </Container>
  );
};

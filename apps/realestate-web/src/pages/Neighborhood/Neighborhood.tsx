import { useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Snackbar from '@mui/material/Snackbar';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import BarChartIcon from '@mui/icons-material/BarChart';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import GroupIcon from '@mui/icons-material/Group';
import SearchIcon from '@mui/icons-material/Search';
import ShieldIcon from '@mui/icons-material/Shield';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useSearchParams } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { neighborhoodApi, savedSearchApi, zillowApi, type NeighborhoodData, type ZillowHomeValue, type ZillowRentIndex } from '../../services/api';
import { DemographicsTab } from './DemographicsTab';
import { MarketTrendsTab } from './MarketTrendsTab';
import { SafetyTab } from './SafetyTab';
import { WalkabilityTab } from './WalkabilityTab';

export const Neighborhood = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialLocation = searchParams.get('location') || '';
  const [searchValue, setSearchValue] = useState(initialLocation);
  const [activeLocation, setActiveLocation] = useState(initialLocation);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [data, setData] = useState<NeighborhoodData | null>(null);
  const [homeValues, setHomeValues] = useState<ZillowHomeValue[]>([]);
  const [rentIndex, setRentIndex] = useState<ZillowRentIndex[]>([]);

  const fetchData = useCallback(async (location: string) => {
    if (!location.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const locationType = /^\d{5}$/.test(location.trim()) ? 'zip' : 'city';

      const [neighborhoodData, homeValueData, rentData] = await Promise.all([
        neighborhoodApi.get(location.trim(), locationType),
        zillowApi.homeValues(location.trim(), locationType),
        zillowApi.rentIndex(location.trim(), locationType),
      ]);

      setData(neighborhoodData);
      setHomeValues(homeValueData);
      setRentIndex(rentData);
      setActiveLocation(location.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load neighborhood data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialLocation) {
      fetchData(initialLocation);
    }
  }, [initialLocation, fetchData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;
    setSearchParams({ location: searchValue.trim() });
    fetchData(searchValue.trim());
  };

  const handleSave = useCallback(async () => {
    if (!data || !activeLocation) return;
    setSaving(true);
    try {
      const locationType = /^\d{5}$/.test(activeLocation) ? 'zip' : 'city';
      await savedSearchApi.create({
        label: activeLocation,
        location_type: locationType,
        location_value: activeLocation,
        latitude: data.geo.lat,
        longitude: data.geo.lon,
      });
      setSnackbar('Search saved!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save search');
    } finally {
      setSaving(false);
    }
  }, [data, activeLocation]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" sx={{ mb: 3 }}>
        Neighborhood Intelligence
      </Typography>

      <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 1, mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Enter ZIP code or city (e.g., 78701 or Austin, TX)"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          size="small"
        />
        <Button type="submit" variant="contained" startIcon={<SearchIcon />} disabled={loading}>
          Search
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && !data && !error && (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <TrendingUpIcon sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
          <Typography variant="h5">Search a location to get started</Typography>
          <Typography variant="body2">
            Enter a ZIP code or city name to view demographics, market trends, safety data, and more.
          </Typography>
        </Box>
      )}

      {!loading && data && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="h5">
              {activeLocation}
            </Typography>
            {user && (
              <Button
                size="small"
                variant="outlined"
                startIcon={saving ? <CircularProgress size={16} /> : <BookmarkIcon />}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
            )}
          </Box>

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
              <Tab icon={<GroupIcon />} iconPosition="start" label="Demographics" />
              <Tab icon={<BarChartIcon />} iconPosition="start" label="Market Trends" />
              <Tab icon={<ShieldIcon />} iconPosition="start" label="Safety & Risk" />
              <Tab icon={<DirectionsWalkIcon />} iconPosition="start" label="Walkability" />
            </Tabs>
          </Box>

          {tab === 0 && <DemographicsTab data={data} />}
          {tab === 1 && <MarketTrendsTab data={data} homeValues={homeValues} rentIndex={rentIndex} />}
          {tab === 2 && <SafetyTab data={data} />}
          {tab === 3 && <WalkabilityTab data={data} />}
        </>
      )}
      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar(null)}
        message={snackbar}
      />
    </Container>
  );
};

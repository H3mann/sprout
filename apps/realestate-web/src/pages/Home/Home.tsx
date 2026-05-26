import { useCallback, useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid2';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CalculateIcon from '@mui/icons-material/Calculate';
import FilterListIcon from '@mui/icons-material/FilterList';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import LaunchIcon from '@mui/icons-material/Launch';
import MapIcon from '@mui/icons-material/Map';
import SearchIcon from '@mui/icons-material/Search';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import HomeIcon from '@mui/icons-material/Home';
import BuildIcon from '@mui/icons-material/Build';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import { useNavigate } from 'react-router-dom';

import { FunLoader } from '../../components/FunLoader';
import { useAuth } from '../../context/AuthContext';
import { DEFAULT_LOCATION, useSearchLocation } from '../../context/LocationContext';
import { aiApi, type PropertySuggestion, type InvestmentStrategy } from '../../services/api';

const STRATEGY_ICONS: Record<string, React.ReactElement> = {
  'cash_flow': <AttachMoneyIcon sx={{ fontSize: 32 }} />,
  'appreciation': <TrendingUpIcon sx={{ fontSize: 32 }} />,
  'brrrr': <AutorenewIcon sx={{ fontSize: 32 }} />,
  'house_hack': <HomeIcon sx={{ fontSize: 32 }} />,
  'turnkey': <BuildIcon sx={{ fontSize: 32 }} />,
  'str': <BeachAccessIcon sx={{ fontSize: 32 }} />,
};

const STRATEGY_COLORS: Record<string, string> = {
  'cash_flow': '#2E7D32',
  'appreciation': '#1565C0',
  'brrrr': '#F57C00',
  'house_hack': '#7B1FA2',
  'turnkey': '#00838F',
  'str': '#C62828',
};

const HeroSection = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.primary.light} 100%)`,
  color: '#FFFFFF',
  padding: theme.spacing(6, 0, 4),
  textAlign: 'center',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(4, 0, 3),
  },
}));

const formatCurrency = (val: number) => {
  if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (Math.abs(val) >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  return `$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

const PropertyImage = ({ property, height }: { property: PropertySuggestion; height: number }) => {
  const [imgFailed, setImgFailed] = useState(false);

  if (property.image_url && !imgFailed) {
    return (
      <Box
        component="img"
        src={property.image_url}
        alt={property.property_address}
        onError={() => setImgFailed(true)}
        sx={{ width: '100%', height, objectFit: 'cover' }}
      />
    );
  }

  if (property.latitude && property.longitude) {
    return (
      <Box
        component="img"
        src={`https://staticmap.openstreetmap.de/staticmap.php?center=${property.latitude},${property.longitude}&zoom=15&size=400x${height}&maptype=mapnik&markers=${property.latitude},${property.longitude},red-pushpin`}
        alt={property.property_address}
        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
          const target = e.currentTarget;
          target.style.display = 'none';
          target.parentElement!.style.display = 'flex';
          target.parentElement!.style.background = 'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)';
        }}
        sx={{ width: '100%', height, objectFit: 'cover' }}
      />
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        height,
        background: 'linear-gradient(135deg, #1565C0 0%, #42A5F5 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 0.5,
      }}
    >
      <HomeWorkIcon sx={{ fontSize: 32, color: 'rgba(255,255,255,0.7)' }} />
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
        {property.property_type}
      </Typography>
    </Box>
  );
};

const DISCOVER_SUGGESTIONS: Record<string, string[]> = {
  'all': [
    'Find zip codes under $250K median with cap rates above 7%',
    'Top 5 emerging real estate markets for 2026 with strong job growth',
    'Compare Austin TX vs Raleigh NC vs Nashville TN for rental investment',
    'Where are rent-to-price ratios highest in the Sun Belt?',
    'Best small cities with growing populations and affordable housing',
    'Markets with the lowest property taxes and landlord-friendly laws',
    'Which metros have the best combination of cash flow and appreciation?',
  ],
  'cash_flow': [
    'Best markets for cash-flowing rentals under $200K in the Midwest',
    'Find zip codes with 8%+ cap rates and positive monthly cash flow',
    'Top cash flow markets in landlord-friendly states',
    'Where can I find properties with $300+ monthly cash flow under $250K?',
    'Compare Indianapolis vs Cleveland vs Memphis for cash flow investing',
    'Markets with low property taxes and high rent-to-price ratios',
    'Best secondary cities for maximizing monthly rental income',
  ],
  'appreciation': [
    'Best appreciation markets near tech hubs in 2026',
    'High-growth neighborhoods with strong job and population growth',
    'Compare coastal cities for long-term appreciation potential',
    'Emerging gentrification areas with rising home values',
    'Where are Amazon, Google, and Apple expanding that I should invest?',
    'Markets with limited housing supply and growing demand',
    'Best college towns with consistent appreciation and rental demand',
  ],
  'brrrr': [
    'Find distressed properties 30% below market value for rehab',
    'Best BRRRR markets with high after-repair values',
    'Foreclosure hotspots in growing markets',
    'Properties with $20K-40K rehab potential and strong rent demand',
    'Where can I find fixer-uppers in appreciating neighborhoods?',
    'Markets with strong contractor availability and renovation costs under $50/sqft',
    'Best cities for flipping and refinancing with lender-friendly appraisers',
  ],
  'house_hack': [
    'Best cities for house hacking near military bases',
    'Find multi-family properties under $400K in walkable neighborhoods',
    'FHA-eligible duplexes and triplexes with owner-occupied potential',
    'Where can I house hack with low crime and good schools?',
    'Compare Denver vs Portland vs Austin for house hacking opportunities',
    'Markets where I can live for free by renting out extra units',
    'Best college towns for house hacking near universities',
  ],
  'turnkey': [
    'Newly renovated rental properties under $300K',
    'Tenant-occupied turnkey properties with positive cash flow',
    'Move-in ready properties built after 2015',
    'Best turnkey rental markets with property management available',
    'Where can I buy hassle-free rentals managed by reputable companies?',
    'Markets with high-quality turnkey providers and strong rental demand',
    'Best out-of-state turnkey markets for passive investors',
  ],
  'str': [
    'Top Airbnb markets with high occupancy rates in 2026',
    'Beach and mountain towns allowing short-term rentals',
    'Best STR properties near tourist attractions and conferences',
    'Markets with 2-3x rent potential via Airbnb vs long-term',
    'Where are STR regulations most friendly to investors?',
    'Best ski resort towns for winter vacation rental income',
    'Markets near national parks with strong STR demand year-round',
  ],
};

const SCREEN_SUGGESTIONS: Record<string, string[]> = {
  'all': [
    'Single family homes under $300K, cap rate 6%+, population growth above 1%, landlord-friendly states',
    'Markets with median rent above $1,500 and home prices under $200K',
    'College towns with low vacancy rates and properties under $250K',
    'Properties with strong cash flow, appreciation potential, and walkability above 50',
    'Multi-family properties 2-4 units, positive cash flow, good neighborhoods',
    'Markets within 2 hours of major metros, median home price under $275K',
    'Properties built after 2000, cap rate 5%+, low crime areas',
  ],
  'cash_flow': [
    'Cap rate 8%+, monthly cash flow $200+, under $250K, Midwest or South',
    'Single family homes with rent-to-price ratio above 1%, low property taxes',
    'Properties with GRM under 12 and positive cash flow from day one',
    'Markets with median rent above $1,200 and median home price under $180K',
    '3/2 homes under $200K with $1,500+ monthly rent potential',
    'Properties in landlord-friendly states with strong eviction laws and low vacancy',
    'Markets with property taxes under 1.5% and rent growth above 3% annually',
  ],
  'appreciation': [
    'Markets with 5%+ annual appreciation, walkability 60+, median income $75K+',
    'Properties in gentrifying neighborhoods near new infrastructure',
    'Tech hub markets with strong job growth and limited housing supply',
    'Walkable urban neighborhoods with rising rents and home values',
    'Properties near new light rail, highways, or major employer expansions',
    'Markets with population growth above 2% and housing supply constraints',
    'College towns with strong appreciation history and limited new construction',
  ],
  'brrrr': [
    'Distressed properties 20-40% below ARV, rehab budget $15K-60K, strong rental demand',
    'Foreclosures in good neighborhoods with comparable sales showing upside',
    'Outdated homes in appreciating markets with renovation potential',
    'Properties needing cosmetic updates in areas with strong comps',
    'Fixer-uppers under $150K with ARV above $225K and solid rental demand',
    'Bank-owned properties in markets with rising home values and contractor availability',
    'Dated homes built before 1990 in gentrifying neighborhoods with upside potential',
  ],
  'house_hack': [
    'Multi-family 2-4 units, FHA-eligible, walkability 50+, crime rate under 400',
    'Duplexes and triplexes where I would actually want to live',
    'Properties with separate entrances, good schools, owner-occupied potential',
    'Multi-family under $400K near transit, shops, and restaurants',
    'Properties with strong rental demand where units can cover my mortgage',
    'Duplexes in safe neighborhoods with median income above $55K',
    'FHA-eligible properties near employment centers with good school ratings',
  ],
  'turnkey': [
    'Move-in ready properties built after 2010, minimal repairs, positive cash flow',
    'Tenant-occupied properties with existing leases, cap rate 6%+',
    'Recently renovated single family homes in stable markets',
    'Turnkey properties with property management in place, cap rate 5.5%+',
    'Newly built rentals under $300K with warranties and low maintenance',
    'Investor-ready properties with existing tenants and positive reviews',
    'Properties managed by reputable companies with 95%+ occupancy rates',
  ],
  'str': [
    'Properties near beaches, mountains, or downtown with STR zoning',
    'Airbnb-friendly markets with high tourism, 2+ bedrooms, walkability 70+',
    'Vacation rental markets with 12%+ cash-on-cash returns',
    'STR-legal properties within 1 mile of major attractions or ski resorts',
    'Markets with year-round tourism and average occupancy above 60%',
    'Properties in STR-friendly cities with strong vacation rental demand',
    'Beachfront, lakefront, or mountain properties with outdoor amenities',
  ],
};

interface HistoryEntry {
  query: string;
  response: string;
  type: 'discover' | 'screen';
  timestamp: Date;
}

export const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { location: searchLocation } = useSearchLocation();
  const [tab, setTab] = useState(0);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    try {
      const saved = sessionStorage.getItem('realm_ai_history');
      if (saved) return JSON.parse(saved, (key, val) => key === 'timestamp' ? new Date(val) : val);
    } catch {}
    return [];
  });
  const [propertySuggestions, setPropertySuggestions] = useState<PropertySuggestion[]>(() => {
    try {
      const saved = sessionStorage.getItem('realm_ai_suggestions');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [strategies, setStrategies] = useState<InvestmentStrategy[]>([]);
  const [loadingStrategies, setLoadingStrategies] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    setLoadingStrategies(true);
    aiApi.strategies()
      .then((res) => setStrategies(res.strategies))
      .catch((err) => console.error('Failed to load strategies:', err))
      .finally(() => setLoadingStrategies(false));
  }, []);

  useEffect(() => {
    sessionStorage.setItem('realm_ai_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    sessionStorage.setItem('realm_ai_suggestions', JSON.stringify(propertySuggestions));
  }, [propertySuggestions]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!query.trim()) return;

      if (!user) {
        navigate('/login');
        return;
      }

      setLoading(true);
      setError(null);

      const trimmed = query.trim();
      const locationApplied = searchLocation && searchLocation.trim() && searchLocation !== DEFAULT_LOCATION;
      const augmentedQuery = locationApplied
        ? `${trimmed} (Location focus: ${searchLocation.trim()})`
        : trimmed;

      try {
        const result =
          tab === 1
            ? await aiApi.discover(augmentedQuery)
            : await aiApi.screen(augmentedQuery);

        setHistory((prev) => [
          {
            query: trimmed,
            response: result.response,
            type: tab === 1 ? 'discover' : 'screen',
            timestamp: new Date(),
          },
          ...prev,
        ]);

        setLoadingSuggestions(true);
        setPropertySuggestions([]);
        setHasSearched(false);

        // Use strategy-specific endpoint if filter is selected
        const suggestionPromise = selectedStrategy
          ? aiApi.suggestionsByStrategy(selectedStrategy, augmentedQuery, 8)
          : aiApi.suggestions(augmentedQuery);

        suggestionPromise.then((suggestionsResult) => {
          setPropertySuggestions(suggestionsResult.properties);
        }).catch(() => {}).finally(() => { setLoadingSuggestions(false); setHasSearched(true); });

        setQuery('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'AI request failed');
      } finally {
        setLoading(false);
      }
    },
    [query, tab, user, navigate, searchLocation, selectedStrategy],
  );

  const handlePropertyClick = (property: PropertySuggestion) => {
    navigate('/deal-analyzer', {
      state: {
        property_address: property.property_address,
        purchase_price: property.purchase_price,
        expected_monthly_rent: property.expected_monthly_rent,
        property_taxes_annual: property.property_taxes_annual,
        insurance_annual: property.insurance_annual,
        hoa_monthly: property.hoa_monthly,
        interest_rate: property.interest_rate,
        down_payment_pct: property.down_payment_pct,
        loan_term_years: property.loan_term_years,
        vacancy_rate_pct: property.vacancy_rate_pct,
        monthly_expenses: property.monthly_expenses,
        image_url: property.image_url || '',
        zillow_url: property.zillow_url || '',
        realtor_url: property.realtor_url || '',
        latitude: property.latitude || 0,
        longitude: property.longitude || 0,
        allSuggestions: propertySuggestions,
        sqft: property.sqft || 0,
        estimated_rehab_cost: property.estimated_rehab_cost || 0,
      },
    });
  };

  const currentSuggestions = useMemo(() => {
    const suggestionSet = tab === 1 ? DISCOVER_SUGGESTIONS : SCREEN_SUGGESTIONS;
    const strategyKey = selectedStrategy || 'all';
    return suggestionSet[strategyKey] || suggestionSet['all'];
  }, [tab, selectedStrategy]);

  const handleStrategySelect = (strategyKey: string | null) => {
    setSelectedStrategy(strategyKey);
  };

  return (
    <Box>
      <HeroSection>
        <Container maxWidth="md">
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              mb: 1.5,
              fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' },
              px: { xs: 2, sm: 0 },
            }}
          >
            Analyze any property in less than 60 seconds
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 400,
              mb: 3,
              opacity: 0.9,
              maxWidth: 640,
              mx: 'auto',
              fontSize: { xs: '0.95rem', sm: '1.1rem', md: '1.25rem' },
              px: { xs: 2, sm: 0 },
            }}
          >
            Our AI cross-references market comps, rental data, neighborhood trends, and financial
            metrics so you can make smarter investment decisions — backed by data, not gut feelings.
          </Typography>

          <Box
            sx={{
              bgcolor: 'rgba(255,255,255,0.95)',
              borderRadius: 3,
              p: { xs: 2, sm: 3 },
              mx: { xs: 1.5, sm: 0 },
              textAlign: 'left',
            }}
          >
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              sx={{ mb: 2, minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0.5 } }}
            >
              <Tab icon={<FilterListIcon />} iconPosition="start" label="Deal Screening" />
              <Tab icon={<TravelExploreIcon />} iconPosition="start" label="Market Discovery" />
            </Tabs>

            {/* Strategy Filter Badges */}
            {!loadingStrategies && strategies.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                  Filter suggested prompts by strategy:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  <Chip
                    label="All"
                    size="small"
                    onClick={() => handleStrategySelect(null)}
                    variant={selectedStrategy === null ? 'filled' : 'outlined'}
                    color={selectedStrategy === null ? 'primary' : 'default'}
                    sx={{ fontWeight: selectedStrategy === null ? 600 : 400 }}
                  />
                  {strategies.map((strategy) => (
                    <Chip
                      key={strategy.key}
                      label={strategy.name}
                      size="small"
                      onClick={() => handleStrategySelect(strategy.key)}
                      variant={selectedStrategy === strategy.key ? 'filled' : 'outlined'}
                      sx={{
                        fontWeight: selectedStrategy === strategy.key ? 600 : 400,
                        ...(selectedStrategy === strategy.key && {
                          bgcolor: STRATEGY_COLORS[strategy.key],
                          color: '#fff',
                          '&:hover': {
                            bgcolor: STRATEGY_COLORS[strategy.key],
                            opacity: 0.9,
                          },
                        }),
                        ...((selectedStrategy !== strategy.key && selectedStrategy !== null) && {
                          opacity: 0.6,
                        }),
                      }}
                    />
                  ))}
                  {selectedStrategy && (
                    <Chip
                      label="Deep Dive →"
                      size="small"
                      clickable
                      color="primary"
                      variant="outlined"
                      onClick={() => navigate(`/deal-strategy/${selectedStrategy}`)}
                      sx={{ fontWeight: 600 }}
                    />
                  )}
                </Box>
              </Box>
            )}

            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 1,
              }}
            >
              <TextField
                fullWidth
                multiline
                minRows={1}
                maxRows={3}
                placeholder={
                  tab === 1
                    ? 'Ask about markets, zip codes, trends... (e.g., "Best cash flow markets under $300K")'
                    : 'Describe your criteria... (e.g., "Cap rate 7%+, under $250K, landlord-friendly")'
                }
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                size="small"
              />
              <Button
                type="submit"
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                disabled={loading || !query.trim()}
                sx={{
                  minWidth: { sm: 120 },
                  alignSelf: { xs: 'stretch', sm: 'flex-end' },
                  py: { xs: 1.25, sm: 1 },
                }}
              >
                {loading ? 'Searching...' : tab === 1 ? 'Discover' : 'Screen'}
              </Button>
            </Box>

            {tab === 0 && (
              <Typography
                variant="caption"
                sx={{
                  mt: 0.75,
                  color: 'text.secondary',
                  textAlign: 'center',
                }}
              >
                Tip: You can also paste a specific property address to screen an
                individual deal.
              </Typography>
            )}

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1.5 }}>
              {currentSuggestions.map((s) => (
                <Chip
                  key={s}
                  label={s.length > 55 ? s.slice(0, 52) + '...' : s}
                  variant="outlined"
                  size="small"
                  onClick={() => setQuery(s)}
                  sx={{ cursor: 'pointer', fontSize: '0.75rem' }}
                />
              ))}
            </Box>
          </Box>
        </Container>
      </HeroSection>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <FunLoader />
            </CardContent>
          </Card>
        )}

        {(loadingSuggestions || propertySuggestions.length > 0 || hasSearched) && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <AutoAwesomeIcon color="secondary" sx={{ fontSize: 20 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Suggested Properties
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mx: 0.5 }}>
                  —
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Property images coming soon — click "View on Zillow" to see photos
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ ml: 'auto', display: { xs: 'none', sm: 'block' } }}
                >
                  Click a property to analyze the deal
                </Typography>
              </Box>

              {loadingSuggestions && <FunLoader />}

              {!loadingSuggestions && hasSearched && propertySuggestions.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <SearchIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 0.5 }}>
                    No results found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Try another search or adjust your criteria.
                  </Typography>
                </Box>
              )}

              {propertySuggestions.length > 0 && !loadingSuggestions && (
                <Grid container spacing={2}>
                  {propertySuggestions.map((s, i) => (
                    <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                      <Card
                        variant="outlined"
                        sx={{
                          height: '100%',
                          transition: 'all 0.15s ease',
                          '&:hover': { borderColor: 'secondary.main', boxShadow: 2, transform: 'translateY(-2px)' },
                        }}
                      >
                        <Box sx={{ cursor: 'pointer' }} onClick={() => handlePropertyClick(s)}>
                          <PropertyImage property={s} height={140} />
                        </Box>
                        <CardContent
                          sx={{ p: 2, '&:last-child': { pb: 2 }, cursor: 'pointer' }}
                          onClick={() => handlePropertyClick(s)}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
                            <HomeWorkIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                            <Chip label={s.property_type} size="small" variant="outlined" />
                            {s.best_strategy && s.strategy_score && (
                              <Chip
                                label={`${s.best_strategy} - ${s.strategy_score}%`}
                                size="small"
                                sx={{
                                  bgcolor: `${STRATEGY_COLORS[s.best_strategy.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_')] || '#1976D2'}15`,
                                  color: STRATEGY_COLORS[s.best_strategy.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_')] || '#1976D2',
                                  fontWeight: 600,
                                  fontSize: '0.7rem',
                                }}
                              />
                            )}
                          </Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, lineHeight: 1.3 }}>
                            {s.property_address}
                          </Typography>
                          <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                            {formatCurrency(s.purchase_price)}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, my: 0.5, flexWrap: 'wrap' }}>
                            <Typography variant="caption" color="text.secondary">
                              {s.bedrooms}bd/{s.bathrooms}ba
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {s.sqft?.toLocaleString()} sqft
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Built {s.year_built}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                            Rent: {formatCurrency(s.expected_monthly_rent)}/mo
                          </Typography>

                          {s.metrics && (
                            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              <Chip
                                label={`Cap: ${s.metrics.capRate.toFixed(1)}%`}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.65rem', height: 20 }}
                              />
                              <Chip
                                label={`CoC: ${s.metrics.cashOnCashReturn.toFixed(1)}%`}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.65rem', height: 20 }}
                              />
                              <Chip
                                label={`CF: ${formatCurrency(s.metrics.monthlyCashFlow)}/mo`}
                                size="small"
                                variant="outlined"
                                color={s.metrics.monthlyCashFlow >= 0 ? 'success' : 'error'}
                                sx={{ fontSize: '0.65rem', height: 20 }}
                              />
                            </Box>
                          )}

                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, lineHeight: 1.3 }}>
                            {s.strategy_fit || s.why}
                          </Typography>
                        </CardContent>
                        <Box sx={{ px: 1.5, pb: 1 }}>
                          <Typography
                            component="a"
                            href={`https://www.zillow.com/homes/${encodeURIComponent(s.property_address)}_rb/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            variant="caption"
                            sx={{
                              color: 'primary.main',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.5,
                              '&:hover': { textDecoration: 'underline' },
                            }}
                          >
                            View on Zillow
                            <LaunchIcon sx={{ fontSize: 12 }} />
                          </Typography>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        )}

        {history.map((entry, i) => (
          <Card key={i} sx={{ mb: 2 }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                <Chip
                  size="small"
                  label={entry.type === 'discover' ? 'Discovery' : 'Screening'}
                  color={entry.type === 'discover' ? 'primary' : 'secondary'}
                />
                <Typography variant="caption" color="text.secondary">
                  {entry.timestamp.toLocaleTimeString()}
                </Typography>
              </Box>

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.75 }}>
                {entry.query}
              </Typography>

              <Divider sx={{ mb: 1 }} />

              <Typography
                variant="body2"
                component="div"
                sx={{
                  '& h2': { fontSize: '1.05rem', fontWeight: 700, mt: 2, mb: 0.75, color: 'text.primary' },
                  '& h3': { fontSize: '0.95rem', fontWeight: 600, mt: 1.5, mb: 0.5, color: 'text.primary' },
                  '& p': { mt: 0, mb: 0.75 },
                  '& .kv-grid': {
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: '4px 16px',
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                    p: 1.5,
                    my: 0.75,
                    fontSize: '0.8rem',
                  },
                  '& .kv-row': {
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 1,
                    py: 0.25,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  },
                  '& .kv-label': { color: 'text.secondary', fontWeight: 500, flexShrink: 0 },
                  '& .kv-value': { fontWeight: 600, textAlign: 'right' },
                  '& .market-card': {
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 1.5,
                    my: 1,
                  },
                  '& .market-title': { fontWeight: 700, fontSize: '0.9rem', mb: 0.5 },
                  '& .bullet-list': { pl: 2, my: 0.5 },
                  '& .bullet-item': { py: 0.25 },
                  lineHeight: 1.5,
                }}
                dangerouslySetInnerHTML={{
                  __html: formatMarkdown(entry.response),
                }}
              />
            </CardContent>
          </Card>
        ))}

        {history.length === 0 && !loading && (
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                sx={{ cursor: 'pointer', transition: 'transform 0.15s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 } }}
                onClick={() => navigate('/neighborhood')}
              >
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <MapIcon sx={{ fontSize: 40, color: '#1565C0', mb: 1 }} />
                  <Typography variant="h6" sx={{ mb: 0.5 }}>Neighborhoods</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Demographics, housing stats, walkability, and market data for any location.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                sx={{ cursor: 'pointer', transition: 'transform 0.15s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 } }}
                onClick={() => navigate('/deal-analyzer')}
              >
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <CalculateIcon sx={{ fontSize: 40, color: '#F9A825', mb: 1 }} />
                  <Typography variant="h6" sx={{ mb: 0.5 }}>Deal Analyzer</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cap rate, cash-on-cash return, cash flow projections, and AI investment thesis.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                sx={{ cursor: 'pointer', transition: 'transform 0.15s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 } }}
                onClick={() => navigate('/deal-strategy')}
              >
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <TrendingUpIcon sx={{ fontSize: 40, color: '#2E7D32', mb: 1 }} />
                  <Typography variant="h6" sx={{ mb: 0.5 }}>Strategies</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Explore investment strategies — Cash Flow, BRRRR, Appreciation, and more.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                sx={{ cursor: 'pointer', transition: 'transform 0.15s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 } }}
                onClick={() => setQuery(DISCOVER_SUGGESTIONS['all'][0])}
              >
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <AutoAwesomeIcon sx={{ fontSize: 40, color: '#7B1FA2', mb: 1 }} />
                  <Typography variant="h6" sx={{ mb: 0.5 }}>Try AI Discovery</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ask about emerging markets, compare cities, or screen for deals matching your criteria.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Container>
    </Box>
  );
};

function formatMarkdown(text: string): string {
  const esc = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const inline = (s: string) =>
    s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
     .replace(/\*(.+?)\*/g, '<em>$1</em>');

  const blocks = esc.split(/\n{2,}/);
  const result: string[] = [];

  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;

    // Heading
    if (/^#{2,3}\s/.test(lines[0])) {
      const tag = lines[0].startsWith('###') ? 'h3' : 'h2';
      const title = lines[0].replace(/^#{2,3}\s+/, '');
      result.push(`<${tag}>${inline(title)}</${tag}>`);
      const rest = lines.slice(1);
      if (rest.length) result.push(formatLines(rest, inline));
      continue;
    }

    // Numbered market section (e.g. "1. **Cleveland, OH**")
    if (/^\d+\.\s+\*\*/.test(lines[0])) {
      const titleMatch = lines[0].match(/^\d+\.\s+\*\*(.+?)\*\*(.*)$/);
      if (titleMatch) {
        const kvLines = lines.slice(1).filter(isBulletLine);
        const otherLines = lines.slice(1).filter((l) => !isBulletLine(l));
        result.push(`<div class="market-card">`);
        result.push(`<div class="market-title">${inline(titleMatch[1])}</div>`);
        if (titleMatch[2].trim()) result.push(`<p>${inline(titleMatch[2].trim())}</p>`);
        if (kvLines.length) result.push(formatKvOrBullets(kvLines, inline));
        if (otherLines.length) result.push(`<p>${otherLines.map(inline).join('<br/>')}</p>`);
        result.push('</div>');
        continue;
      }
    }

    result.push(formatLines(lines, inline));
  }

  return result.join('');
}

function isBulletLine(line: string): boolean {
  return /^[-•]\s/.test(line) || /^\d+\.\s/.test(line);
}

function stripBulletPrefix(line: string): string {
  return line.replace(/^[-•]\s+/, '').replace(/^\d+\.\s+/, '');
}

function formatKvOrBullets(
  lines: string[],
  inline: (s: string) => string,
): string {
  const kvPairs: [string, string][] = [];
  const bullets: string[] = [];

  for (const line of lines) {
    const cleaned = stripBulletPrefix(line);
    const kvMatch = cleaned.match(/^\*\*(.+?)\*\*[:\s]+(.+)$/);
    if (kvMatch) {
      kvPairs.push([kvMatch[1], kvMatch[2]]);
    } else {
      bullets.push(cleaned);
    }
  }

  let html = '';
  if (kvPairs.length) {
    html += '<div class="kv-grid">';
    html += kvPairs
      .map(([k, v]) => `<div class="kv-row"><span class="kv-label">${inline(k)}</span><span class="kv-value">${inline(v)}</span></div>`)
      .join('');
    html += '</div>';
  }
  if (bullets.length) {
    html += '<div class="bullet-list">';
    html += bullets.map((b) => `<div class="bullet-item">&bull; ${inline(b)}</div>`).join('');
    html += '</div>';
  }
  return html;
}

function formatLines(
  lines: string[],
  inline: (s: string) => string,
): string {
  const allBullets = lines.every(isBulletLine);
  if (allBullets && lines.length >= 1) return formatKvOrBullets(lines, inline);

  const parts: string[] = [];
  let proseBuf: string[] = [];

  const flushProse = () => {
    if (proseBuf.length) {
      parts.push(`<p>${proseBuf.map(inline).join('<br/>')}</p>`);
      proseBuf = [];
    }
  };

  const bulletBuf: string[] = [];
  const flushBullets = () => {
    if (bulletBuf.length) {
      parts.push(formatKvOrBullets(bulletBuf, inline));
      bulletBuf.length = 0;
    }
  };

  for (const line of lines) {
    if (isBulletLine(line)) {
      flushProse();
      bulletBuf.push(line);
    } else {
      flushBullets();
      proseBuf.push(line);
    }
  }
  flushProse();
  flushBullets();

  return parts.join('');
}

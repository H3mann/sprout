import { useCallback, useState } from 'react';
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
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import FilterListIcon from '@mui/icons-material/FilterList';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import SearchIcon from '@mui/icons-material/Search';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import { useNavigate } from 'react-router-dom';

import { aiApi, type PropertySuggestion, type DealAnalysisInput } from '../../services/api';

const formatCurrency = (val: number) => {
  if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (Math.abs(val) >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  return `$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

const DISCOVER_SUGGESTIONS = [
  'Find zip codes under $250K median with cap rates above 7%',
  'Best markets for cash-flowing rentals under $200K in the Midwest',
  'Top 5 emerging real estate markets for 2026 with strong job growth',
  'Compare Austin TX vs Raleigh NC vs Nashville TN for rental investment',
  'Where are rent-to-price ratios highest in the Sun Belt?',
  'Best cities for house hacking near military bases',
];

const SCREEN_SUGGESTIONS = [
  'Single family homes under $300K, cap rate 6%+, population growth above 1%, landlord-friendly states',
  'Multi-family properties in Texas under $500K with 8%+ cash-on-cash returns',
  'Markets with median rent above $1,500 and home prices under $200K',
  'College towns with low vacancy rates and properties under $250K',
  'Emerging markets within 2 hours of a major metro, under $180K median',
];

interface HistoryEntry {
  query: string;
  response: string;
  type: 'discover' | 'screen';
  timestamp: Date;
}

export const AIDiscovery = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [propertySuggestions, setPropertySuggestions] = useState<PropertySuggestion[]>([]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!query.trim()) return;
      setLoading(true);
      setError(null);

      try {
        const result =
          tab === 0
            ? await aiApi.discover(query.trim())
            : await aiApi.screen(query.trim());

        setHistory((prev) => [
          {
            query: query.trim(),
            response: result.response,
            type: tab === 0 ? 'discover' : 'screen',
            timestamp: new Date(),
          },
          ...prev,
        ]);

        setLoadingSuggestions(true);
        setPropertySuggestions([]);
        aiApi.suggestions(query.trim()).then((suggestionsResult) => {
          setPropertySuggestions(suggestionsResult.properties);
        }).catch(() => {}).finally(() => setLoadingSuggestions(false));

        setQuery('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'AI request failed');
      } finally {
        setLoading(false);
      }
    },
    [query, tab],
  );

  const handlePropertyClick = (property: PropertySuggestion) => {
    const dealInput: DealAnalysisInput = {
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
    };
    navigate('/deal-analyzer', { state: dealInput });
  };

  const handleSuggestion = (suggestion: string) => {
    setQuery(suggestion);
  };

  const suggestions = tab === 0 ? DISCOVER_SUGGESTIONS : SCREEN_SUGGESTIONS;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <AutoAwesomeIcon sx={{ fontSize: 36, color: 'primary.main' }} />
        <Typography variant="h3">AI Discovery</Typography>
      </Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Ask anything about real estate markets. Get data-driven answers with specific locations, metrics, and risk analysis.
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab icon={<TravelExploreIcon />} iconPosition="start" label="Market Discovery" />
          <Tab icon={<FilterListIcon />} iconPosition="start" label="Deal Screening" />
        </Tabs>
      </Box>

      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          fullWidth
          multiline
          minRows={1}
          maxRows={4}
          placeholder={
            tab === 0
              ? 'Ask about markets, zip codes, trends... (e.g., "Best cash flow markets under $300K")'
              : 'Describe your investment criteria... (e.g., "Cap rate 7%+, under $250K, landlord-friendly")'
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
          sx={{ minWidth: 120, alignSelf: 'flex-end' }}
        >
          {loading ? 'Searching...' : tab === 0 ? 'Discover' : 'Screen'}
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4 }}>
        {suggestions.map((s) => (
          <Chip
            key={s}
            label={s.length > 60 ? s.slice(0, 57) + '...' : s}
            variant="outlined"
            size="small"
            onClick={() => handleSuggestion(s)}
            sx={{ cursor: 'pointer' }}
          />
        ))}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 4, justifyContent: 'center' }}>
            <CircularProgress size={24} />
            <Typography color="text.secondary">
              {tab === 0 ? 'Researching markets...' : 'Screening deals...'}
            </Typography>
          </CardContent>
        </Card>
      )}

      {history.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <AutoAwesomeIcon sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
          <Typography variant="h5">Ask a question or pick a suggestion above</Typography>
          <Typography variant="body2">
            The AI will search current market data and provide investment-focused analysis.
          </Typography>
        </Box>
      )}

      {(loadingSuggestions || propertySuggestions.length > 0) && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <AutoAwesomeIcon color="secondary" />
              <Typography variant="h5">Suggested Properties</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                Click a property to analyze the deal
              </Typography>
            </Box>

            {loadingSuggestions && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'center', py: 4 }}>
                <CircularProgress size={24} />
                <Typography color="text.secondary">Finding matching properties...</Typography>
              </Box>
            )}

            {propertySuggestions.length > 0 && !loadingSuggestions && (
              <Grid container spacing={2}>
                {propertySuggestions.map((s, i) => (
                  <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                    <Card
                      variant="outlined"
                      onClick={() => handlePropertyClick(s)}
                      sx={{
                        cursor: 'pointer',
                        height: '100%',
                        transition: 'all 0.15s ease',
                        '&:hover': { borderColor: 'secondary.main', boxShadow: 2, transform: 'translateY(-2px)' },
                      }}
                    >
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                          <HomeWorkIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Chip label={s.property_type} size="small" variant="outlined" />
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
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, lineHeight: 1.3 }}>
                          {s.why}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>
      )}

      {history.map((entry, i) => (
        <Card key={i} sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Chip
                size="small"
                label={entry.type === 'discover' ? 'Discovery' : 'Screening'}
                color={entry.type === 'discover' ? 'primary' : 'secondary'}
              />
              <Typography variant="caption" color="text.secondary">
                {entry.timestamp.toLocaleTimeString()}
              </Typography>
            </Box>

            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              {entry.query}
            </Typography>

            <Divider sx={{ mb: 2 }} />

            <Typography
              variant="body1"
              sx={{
                whiteSpace: 'pre-line',
                '& h2, & h3': { mt: 2, mb: 1 },
                lineHeight: 1.7,
              }}
              dangerouslySetInnerHTML={{
                __html: formatMarkdown(entry.response),
              }}
            />
          </CardContent>
        </Card>
      ))}
    </Container>
  );
};

function formatMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '&bull; $1')
    .replace(/^\d+\. (.+)$/gm, (_, content) => `&bull; ${content}`);
}

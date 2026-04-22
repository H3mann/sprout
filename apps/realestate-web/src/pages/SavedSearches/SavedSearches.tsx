import { useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid2';
import IconButton from '@mui/material/IconButton';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import CalculateIcon from '@mui/icons-material/Calculate';
import DeleteIcon from '@mui/icons-material/Delete';
import MapIcon from '@mui/icons-material/Map';
import { useNavigate } from 'react-router-dom';

import { savedSearchApi, dealApi, type ApiSavedSearch, type ApiDealAnalysis } from '../../services/api';

const formatCurrency = (val: number) => {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val.toLocaleString()}`;
};

export const SavedSearches = () => {
  const [tab, setTab] = useState(0);
  const [searches, setSearches] = useState<ApiSavedSearch[]>([]);
  const [deals, setDeals] = useState<ApiDealAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    Promise.all([savedSearchApi.list(), dealApi.list()])
      .then(([s, d]) => {
        setSearches(s);
        setDeals(d);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const handleDeleteSearch = useCallback(async (id: string) => {
    await savedSearchApi.remove(id);
    setSearches((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleDeleteDeal = useCallback(async (id: string) => {
    await dealApi.remove(id);
    setDeals((prev) => prev.filter((d) => d.id !== id));
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" sx={{ mb: 3 }}>
        <BookmarkIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
        Saved Items
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab icon={<MapIcon />} iconPosition="start" label={`Searches (${searches.length})`} />
          <Tab icon={<CalculateIcon />} iconPosition="start" label={`Analyses (${deals.length})`} />
        </Tabs>
      </Box>

      {tab === 0 && (
        <Grid container spacing={2}>
          {searches.length === 0 && (
            <Grid size={{ xs: 12 }}>
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No saved searches yet. Search a neighborhood and save it.
              </Typography>
            </Grid>
          )}
          {searches.map((s) => (
            <Grid key={s.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}
                onClick={() => navigate(`/neighborhood?location=${encodeURIComponent(s.location_value)}`)}
              >
                <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6">{s.label}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {s.location_type}: {s.location_value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(s.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <IconButton
                    onClick={(e) => { e.stopPropagation(); handleDeleteSearch(s.id); }}
                    size="small" color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {tab === 1 && (
        <Grid container spacing={2}>
          {deals.length === 0 && (
            <Grid size={{ xs: 12 }}>
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No saved analyses yet. Run a deal analysis and save it.
              </Typography>
            </Grid>
          )}
          {deals.map((d) => (
            <Grid key={d.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card sx={{ '&:hover': { boxShadow: 4 } }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <Box>
                      <Typography variant="h6">{d.property_address}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatCurrency(d.purchase_price)} | {d.down_payment_pct}% down
                      </Typography>
                    </Box>
                    <IconButton onClick={() => handleDeleteDeal(d.id)} size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  {d.computed_metrics && (
                    <Box sx={{ mt: 1, display: 'flex', gap: 2 }}>
                      <Typography variant="body2">
                        Score: <strong>{d.computed_metrics.investmentScore}</strong>
                      </Typography>
                      <Typography variant="body2">
                        Cap: <strong>{d.computed_metrics.capRate.toFixed(1)}%</strong>
                      </Typography>
                      <Typography variant="body2" sx={{ color: d.computed_metrics.monthlyCashFlow >= 0 ? 'success.main' : 'error.main' }}>
                        CF: <strong>{formatCurrency(d.computed_metrics.monthlyCashFlow)}/mo</strong>
                      </Typography>
                    </Box>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {new Date(d.created_at).toLocaleDateString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

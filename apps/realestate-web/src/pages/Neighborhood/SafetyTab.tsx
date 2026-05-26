import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid2';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import FloodIcon from '@mui/icons-material/Flood';
import GavelIcon from '@mui/icons-material/Gavel';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningIcon from '@mui/icons-material/Warning';

import type { NeighborhoodData } from '../../services/api';

interface Props {
  data: NeighborhoodData;
}

const riskColor = (risk: string | null) => {
  switch (risk) {
    case 'low': return 'success';
    case 'moderate': return 'warning';
    case 'high': return 'error';
    default: return 'default';
  }
};

export const SafetyTab = ({ data }: Props) => {
  const { safety, climate } = data;

  const crimeUnavailable = safety.violentCrimeRate === null && safety.propertyCrimeRate === null;
  const floodUnavailable = !climate.floodZone && !climate.floodRisk;

  return (
    <Box>
      {crimeUnavailable && floodUnavailable && (
        <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ mb: 3 }}>
          Safety and flood risk data is not available for this location. Crime stats are currently limited to state-level estimates.
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <GavelIcon color="primary" />
                Crime Statistics
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Violent Crime Rate</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {safety.violentCrimeRate !== null ? `${safety.violentCrimeRate.toFixed(1)} per 100K` : 'N/A'}
                  </Typography>
                </Box>
                {safety.violentCrimeRate !== null && (
                  <LinearProgress
                    variant="determinate"
                    value={Math.min((safety.violentCrimeRate / 1000) * 100, 100)}
                    color="error"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                )}
              </Box>

              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Property Crime Rate</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {safety.propertyCrimeRate !== null ? `${safety.propertyCrimeRate.toFixed(1)} per 100K` : 'N/A'}
                  </Typography>
                </Box>
                {safety.propertyCrimeRate !== null && (
                  <LinearProgress
                    variant="determinate"
                    value={Math.min((safety.propertyCrimeRate / 4000) * 100, 100)}
                    color="warning"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                )}
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                Source: FBI Crime Data (state-level estimates)
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <FloodIcon color="primary" />
                Climate & Flood Risk
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  FEMA Flood Zone
                </Typography>
                <Typography variant="h6">
                  {climate.floodZone || 'N/A'}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Flood Risk Level
                </Typography>
                {climate.floodRisk ? (
                  <Chip
                    icon={<WarningIcon />}
                    label={climate.floodRisk.charAt(0).toUpperCase() + climate.floodRisk.slice(1)}
                    color={riskColor(climate.floodRisk) as 'success' | 'warning' | 'error'}
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                ) : (
                  <Typography variant="body1">N/A</Typography>
                )}
              </Box>

              <Typography variant="caption" color="text.secondary">
                Source: FEMA National Flood Hazard Layer
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

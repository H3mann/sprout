import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import GroupIcon from '@mui/icons-material/Group';
import HomeIcon from '@mui/icons-material/Home';
import PaidIcon from '@mui/icons-material/Paid';
import SchoolIcon from '@mui/icons-material/School';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

import type { NeighborhoodData } from '../../services/api';

interface Props {
  data: NeighborhoodData;
}

const fmt = (val: number | null, prefix = '', suffix = '') => {
  if (val === null) return 'N/A';
  if (val >= 1_000_000) return `${prefix}${(val / 1_000_000).toFixed(1)}M${suffix}`;
  if (val >= 1_000) return `${prefix}${(val / 1_000).toFixed(0)}K${suffix}`;
  return `${prefix}${val.toLocaleString()}${suffix}`;
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <Card>
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
      <Box sx={{ color: 'primary.main' }}>{icon}</Box>
      <Box>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="h5">{value}</Typography>
      </Box>
    </CardContent>
  </Card>
);

const COLORS = ['#1565C0', '#F9A825', '#2E7D32', '#C62828', '#7B1FA2'];

export const DemographicsTab = ({ data }: Props) => {
  const { demographics, housing } = data;

  const housingTenure = [
    { name: 'Owner-Occupied', value: housing.ownerOccupiedPct ?? 0 },
    { name: 'Renter-Occupied', value: 100 - (housing.ownerOccupiedPct ?? 0) },
  ];

  return (
    <Box>
      {data.geo.lat !== 0 && data.geo.lon !== 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h5" sx={{ mb: 2 }}>Location</Typography>
            <Box
              component="iframe"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${data.geo.lon - 0.03},${data.geo.lat - 0.02},${data.geo.lon + 0.03},${data.geo.lat + 0.02}&layer=mapnik&marker=${data.geo.lat},${data.geo.lon}`}
              sx={{
                width: '100%',
                height: 350,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
              }}
            />
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<GroupIcon />}
            label="Population"
            value={fmt(demographics.population)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<PaidIcon />}
            label="Median Household Income"
            value={fmt(demographics.medianHouseholdIncome, '$')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<SchoolIcon />}
            label="Bachelor's Degree+"
            value={demographics.educationBachelorsPct !== null ? `${demographics.educationBachelorsPct.toFixed(1)}%` : 'N/A'}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<GroupIcon />}
            label="Median Age"
            value={demographics.medianAge !== null ? `${demographics.medianAge}` : 'N/A'}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" sx={{ mb: 2 }}>Housing Overview</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="text.secondary">Total Units</Typography>
                  <Typography variant="h6">{fmt(housing.totalUnits)}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="text.secondary">Vacancy Rate</Typography>
                  <Typography variant="h6">{housing.vacancyRate !== null ? `${housing.vacancyRate.toFixed(1)}%` : 'N/A'}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="text.secondary">Median Home Value</Typography>
                  <Typography variant="h6">{fmt(housing.medianHomeValue, '$')}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="text.secondary">Median Rent</Typography>
                  <Typography variant="h6">{fmt(housing.medianRent, '$')}/mo</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" sx={{ mb: 2 }}>
                <HomeIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Housing Tenure
              </Typography>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={housingTenure}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value.toFixed(0)}%`}
                  >
                    {housingTenure.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

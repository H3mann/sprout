import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { NeighborhoodData, ZillowHomeValue, ZillowRentIndex } from '../../services/api';

interface Props {
  data: NeighborhoodData;
  homeValues: ZillowHomeValue[];
  rentIndex: ZillowRentIndex[];
}

const formatCurrency = (val: number) => {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val.toLocaleString()}`;
};

export const MarketTrendsTab = ({ data, homeValues, rentIndex }: Props) => {
  const { marketTrends } = data;

  const chartData = homeValues
    .filter((hv) => hv.zhvi !== null)
    .map((hv) => {
      const matchingRent = rentIndex.find((r) => r.date === hv.date);
      return {
        date: hv.date,
        label: new Date(hv.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        homeValue: hv.zhvi,
        rent: matchingRent?.zori ?? null,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const latestValue = homeValues.length > 0 ? homeValues[homeValues.length - 1]?.zhvi : null;
  const oneYearAgo = homeValues.length > 12 ? homeValues[homeValues.length - 13]?.zhvi : null;
  const yoyChange = latestValue && oneYearAgo ? ((latestValue - oneYearAgo) / oneYearAgo) * 100 : null;

  return (
    <Box>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">Current Mortgage Rate</Typography>
              <Typography variant="h4" sx={{ color: 'primary.main' }}>
                {marketTrends.currentMortgageRate !== null ? `${marketTrends.currentMortgageRate.toFixed(2)}%` : 'N/A'}
              </Typography>
              <Typography variant="caption" color="text.secondary">30-Year Fixed</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">Median Home Value (Zillow)</Typography>
              <Typography variant="h4" sx={{ color: 'primary.main' }}>
                {latestValue ? formatCurrency(latestValue) : 'N/A'}
              </Typography>
              {yoyChange !== null && (
                <Chip
                  size="small"
                  label={`${yoyChange > 0 ? '+' : ''}${yoyChange.toFixed(1)}% YoY`}
                  color={yoyChange >= 0 ? 'success' : 'error'}
                  sx={{ mt: 0.5 }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">Case-Shiller Index</Typography>
              <Typography variant="h4" sx={{ color: 'primary.main' }}>
                {marketTrends.caseShillerIndex?.toFixed(1) ?? 'N/A'}
              </Typography>
              <Typography variant="caption" color="text.secondary">National Composite</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {chartData.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h5" sx={{ mb: 2 }}>Home Value Trend (ZHVI)</Typography>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  interval={Math.floor(chartData.length / 8)}
                />
                <YAxis
                  tickFormatter={formatCurrency}
                  tick={{ fontSize: 11 }}
                  width={70}
                />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="homeValue"
                  name="Home Value (ZHVI)"
                  stroke="#1565C0"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {chartData.some((d) => d.rent !== null) && (
        <Card>
          <CardContent>
            <Typography variant="h5" sx={{ mb: 2 }}>Rent Index Trend (ZORI)</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.filter((d) => d.rent !== null)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  interval={Math.floor(chartData.length / 8)}
                />
                <YAxis
                  tickFormatter={formatCurrency}
                  tick={{ fontSize: 11 }}
                  width={70}
                />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="rent"
                  name="Rent Index (ZORI)"
                  stroke="#F9A825"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

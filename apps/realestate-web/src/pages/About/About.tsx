import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CalculateIcon from '@mui/icons-material/Calculate';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import FloodIcon from '@mui/icons-material/Flood';
import GavelIcon from '@mui/icons-material/Gavel';
import InsightsIcon from '@mui/icons-material/Insights';
import PsychologyIcon from '@mui/icons-material/Psychology';
import SecurityIcon from '@mui/icons-material/Security';
import ShowChartIcon from '@mui/icons-material/ShowChart';

const DATA_SOURCES = [
  { icon: <PsychologyIcon />, color: '#7B1FA2', label: 'Perplexity AI', desc: 'Real-time market research and investment thesis powered by Sonar. Discover emerging markets, screen deals against your criteria, and generate full investment theses — all backed by live web data.' },
  { icon: <AccountBalanceIcon />, color: '#1565C0', label: 'U.S. Census Bureau', desc: 'American Community Survey (ACS) 5-year estimates for population, median age, household income, poverty rate, education levels, housing units, vacancy rates, median home values, and median rents.' },
  { icon: <ShowChartIcon />, color: '#2E7D32', label: 'Federal Reserve (FRED)', desc: 'The latest 30-year fixed mortgage rate, the S&P/Case-Shiller U.S. National Home Price Index, and national housing starts — straight from the St. Louis Fed.' },
  { icon: <FloodIcon />, color: '#0277BD', label: 'FEMA Flood Maps', desc: 'National Flood Hazard Layer data for any GPS coordinate. Know whether a property sits in a high-risk, moderate, or minimal flood zone before you make an offer.' },
  { icon: <SecurityIcon />, color: '#C62828', label: 'FBI Crime Data', desc: 'State-level violent crime and property crime rates per 100,000 residents, sourced from the FBI\'s Summary Reporting System.' },
  { icon: <DirectionsBikeIcon />, color: '#EF6C00', label: 'OpenStreetMap', desc: 'Custom-computed walk, transit, and bike scores using the Overpass API. We measure proximity to groceries, restaurants, schools, parks, transit stops, and cycling infrastructure within a one-mile radius.' },
  { icon: <InsightsIcon />, color: '#00838F', label: 'Zillow ZHVI & ZORI', desc: 'Historical Zillow Home Value Index and Observed Rent Index at the zip code level, so you can see how prices and rents have trended over time.' },
  { icon: <GavelIcon />, color: '#4E342E', label: 'Census Geocoder', desc: 'Precise address and zip code resolution via the Census Bureau geocoder with OpenStreetMap Nominatim as a fallback — ensuring every lookup hits the right location.' },
  { icon: <CalculateIcon />, color: '#F9A825', label: 'Financial Engine', desc: 'Our in-house calculator computes mortgage payments, cap rate, cash-on-cash return, NOI, gross rent multiplier, monthly and annual cash flow, 5/10/30-year appreciation projections, and an overall investment score from 0 to 100.' },
];

export const About = () => (
  <Box>
    <Box
      sx={{
        background: (theme) =>
          `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.primary.light} 100%)`,
        color: '#FFFFFF',
        py: 6,
        textAlign: 'center',
      }}
    >
      <Container maxWidth="md">
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1.5 }}>
          How Realm Works
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 400, opacity: 0.9, maxWidth: 640, mx: 'auto' }}>
          Under the hood, Realm pulls from authoritative data sources — and
          more — then runs them through our financial engine so you get a
          complete investment picture in under 60 seconds.
        </Typography>
        <Typography
          variant="body1"
          sx={{ mt: 2, opacity: 0.75, fontStyle: 'italic', maxWidth: 560, mx: 'auto' }}
        >
          The only platform that layers Census demographics, Federal Reserve
          economics, FEMA flood risk, FBI crime data, and AI-powered research
          into a single investment score.
        </Typography>
      </Container>
    </Box>

    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, textAlign: 'center', mb: 1 }}>
        Here's What Powers Realm
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ textAlign: 'center', mb: 5, maxWidth: 620, mx: 'auto' }}
      >
        We aggregate government databases, market indices, AI research, and
        more — so you don't have to tab between five websites. We're
        continuously expanding our data sources to give you an even sharper
        investment picture.
      </Typography>

      <Grid container spacing={3}>
        {DATA_SOURCES.map((source) => (
          <Grid key={source.label} size={{ xs: 12, sm: 6, md: 4 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                p: 3,
                borderRadius: 2,
                height: '100%',
                border: 1,
                borderColor: 'divider',
                transition: 'all 0.15s',
                '&:hover': { borderColor: source.color, boxShadow: 2, transform: 'translateY(-2px)' },
              }}
            >
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: `${source.color}14`,
                  color: source.color,
                  mb: 2,
                  '& .MuiSvgIcon-root': { fontSize: 28 },
                }}
              >
                {source.icon}
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                {source.label}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                {source.desc}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Container>
  </Box>
);

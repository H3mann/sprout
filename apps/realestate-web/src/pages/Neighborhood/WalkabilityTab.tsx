import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import Alert from '@mui/material/Alert';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import type { NeighborhoodData } from '../../services/api';

interface Props {
  data: NeighborhoodData;
}

const scoreColor = (score: number | null) => {
  if (score === null) return '#9E9E9E';
  if (score >= 70) return '#2E7D32';
  if (score >= 50) return '#F9A825';
  return '#C62828';
};

const scoreLabel = (score: number | null) => {
  if (score === null) return 'No Data';
  if (score >= 90) return 'Walker\'s Paradise';
  if (score >= 70) return 'Very Walkable';
  if (score >= 50) return 'Somewhat Walkable';
  if (score >= 25) return 'Car-Dependent';
  return 'Almost All Errands Require a Car';
};

const ScoreRing = styled(Box)(() => ({
  position: 'relative',
  width: 140,
  height: 140,
  margin: '0 auto',
}));

const ScoreCircle = ({ score, icon }: { score: number | null; icon: React.ReactNode }) => {
  const color = scoreColor(score);
  const circumference = 2 * Math.PI * 58;
  const offset = circumference - ((score ?? 0) / 100) * circumference;

  return (
    <ScoreRing>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r="58" fill="none" stroke="#E0E0E0" strokeWidth="8" />
        <circle
          cx="70"
          cy="70"
          r="58"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
        />
      </svg>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}
      >
        <Box sx={{ color, mb: -0.5 }}>{icon}</Box>
        <Typography variant="h4" sx={{ fontWeight: 700, color }}>
          {score ?? '—'}
        </Typography>
      </Box>
    </ScoreRing>
  );
};

export const WalkabilityTab = ({ data }: Props) => {
  const { walkability } = data;

  const scores = [
    {
      label: 'Walk Score',
      score: walkability.walkScore,
      icon: <DirectionsWalkIcon />,
      description: scoreLabel(walkability.walkScore),
    },
    {
      label: 'Transit Score',
      score: walkability.transitScore,
      icon: <DirectionsBusIcon />,
      description: walkability.transitScore !== null
        ? walkability.transitScore >= 70 ? 'Excellent Transit' : walkability.transitScore >= 50 ? 'Good Transit' : 'Minimal Transit'
        : 'No Data',
    },
    {
      label: 'Bike Score',
      score: walkability.bikeScore,
      icon: <DirectionsBikeIcon />,
      description: walkability.bikeScore !== null
        ? walkability.bikeScore >= 70 ? 'Very Bikeable' : walkability.bikeScore >= 50 ? 'Bikeable' : 'Minimal Bike Infrastructure'
        : 'No Data',
    },
  ];

  const allNull = walkability.walkScore === null && walkability.transitScore === null && walkability.bikeScore === null;

  return (
    <Grid container spacing={3}>
      {allNull && (
        <Grid size={{ xs: 12 }}>
          <Alert severity="info" icon={<InfoOutlinedIcon />}>
            Walkability scores are not available for this location. Scores are derived from nearby amenities in OpenStreetMap and may be limited in rural areas.
          </Alert>
        </Grid>
      )}

      {scores.map((item) => (
        <Grid key={item.label} size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <ScoreCircle score={item.score} icon={item.icon} />
              <Typography variant="h5" sx={{ mt: 2 }}>
                {item.label}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {item.description}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}

      <Grid size={{ xs: 12 }}>
        <Typography variant="caption" color="text.secondary">
          Source: OpenStreetMap. Scores range from 0-100.
        </Typography>
      </Grid>
    </Grid>
  );
};

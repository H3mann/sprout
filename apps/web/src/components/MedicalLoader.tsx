import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import { keyframes } from '@mui/material/styles';

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
`;

const LOADING_STEPS = [
  { icon: '🩺', message: 'Paging Dr. Database...' },
  { icon: '📋', message: 'Checking the medical charts...' },
  { icon: '💊', message: 'Consulting the stethoscope...' },
  { icon: '📚', message: 'Flipping through PubMed journals...' },
  { icon: '🧑‍⚕️', message: 'The doctor will see you now... almost...' },
  { icon: '🔬', message: 'Running a very thorough check-up...' },
  { icon: '🌡️', message: 'Scanning WHO archives...' },
  { icon: '👓', message: 'Putting on our reading glasses...' },
  { icon: '🧬', message: 'Prescribing some knowledge...' },
  { icon: '🩺', message: 'Warming up the stethoscope...' },
];

export const MedicalLoader = () => {
  const [stepIndex, setStepIndex] = useState(() => Math.floor(Math.random() * LOADING_STEPS.length));

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card sx={{ mb: 3, textAlign: 'center', py: 5 }}>
      <CardContent>
        <Box sx={{ animation: `${pulse} 2s ease-in-out infinite`, mb: 2, fontSize: 48 }}>
          {LOADING_STEPS[stepIndex].icon}
        </Box>

        <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}>
          {LOADING_STEPS[stepIndex].message}
        </Typography>

        <Box sx={{ maxWidth: 300, mx: 'auto', mb: 2 }}>
          <LinearProgress
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': { borderRadius: 3 },
            }}
          />
        </Box>

        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Searching PubMed, AAP, CDC, WHO, and other trusted sources
        </Typography>
      </CardContent>
    </Card>
  );
};

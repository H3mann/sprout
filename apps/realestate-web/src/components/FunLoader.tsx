import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const MESSAGES = [
  { icon: '🏠', text: 'Checking the foundation...' },
  { icon: '🔑', text: 'Turning the key on this deal...' },
  { icon: '📊', text: 'Crunching the numbers...' },
  { icon: '🏘️', text: 'Scouting the neighborhood...' },
  { icon: '💰', text: 'Counting cash flow...' },
  { icon: '🔍', text: 'Inspecting the comps...' },
  { icon: '📋', text: 'Reviewing the appraisal...' },
  { icon: '🏗️', text: 'Estimating rehab costs...' },
  { icon: '🗺️', text: 'Mapping the market...' },
  { icon: '📈', text: 'Projecting appreciation...' },
  { icon: '🏦', text: 'Running it by the lender...' },
  { icon: '🧮', text: 'Calculating cap rates...' },
  { icon: '🏡', text: 'Checking curb appeal...' },
  { icon: '📐', text: 'Measuring square footage...' },
  { icon: '🚪', text: 'Opening doors to opportunity...' },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const FunLoader = () => {
  const [order] = useState(() => shuffle(MESSAGES));
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % order.length);
    }, 2400);
    return () => clearInterval(id);
  }, [order.length]);

  const { icon, text } = order[index];

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Typography
        sx={{
          fontSize: 28,
          lineHeight: 1,
          animation: 'spin 1.2s ease-in-out infinite',
          '@keyframes spin': {
            '0%': { transform: 'rotate(0deg)' },
            '100%': { transform: 'rotate(360deg)' },
          },
        }}
      >
        {icon}
      </Typography>
      <Typography
        color="text.secondary"
        sx={{
          minWidth: 220,
          transition: 'opacity 0.3s',
        }}
      >
        {text}
      </Typography>
    </Box>
  );
};

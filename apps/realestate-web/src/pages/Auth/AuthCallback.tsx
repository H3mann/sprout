import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { supabase } from '../../services/supabase';

export const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.exchangeCodeForSession(window.location.search).then(({ error }) => {
      if (error) {
        navigate('/login', { replace: true, state: { error: error.message } });
      } else {
        navigate('/', { replace: true });
      }
    });
  }, [navigate]);

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      <CircularProgress />
      <Typography variant="body1" color="text.secondary">
        Confirming your email...
      </Typography>
    </Box>
  );
};

import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';

const AuthCard = styled(Card)(({ theme }) => ({
  maxWidth: 440,
  margin: '0 auto',
  borderRadius: 16,
  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
  overflow: 'visible',
  [theme.breakpoints.down('sm')]: {
    margin: '0 16px',
  },
}));

const LogoSection = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(1),
}));

export const AuthPage = () => {
  const [tab, setTab] = useState<number>(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: string })?.from || '/children';
  const isLogin = tab === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      if (isLogin) {
        const { error: err } = await signIn(email, password);
        if (err) {
          setError(err);
          return;
        }
        navigate(from, { replace: true });
      } else {
        const { error: err } = await signUp(email, password);
        if (err) {
          setError(err);
          return;
        }
        setSuccess('Account created! Check your email to confirm, then sign in.');
        setTab(0);
        setPassword('');
        setConfirmPassword('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
    setError(null);
    setSuccess(null);
  };

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        background: (theme) =>
          `linear-gradient(135deg, ${theme.palette.primary.light}22 0%, ${theme.palette.secondary.light}22 100%)`,
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <AuthCard>
          <LogoSection>
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, color: 'primary.main', mb: 0.5 }}
            >
              Sprout
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {isLogin ? 'Welcome back' : 'Create your account'}
            </Typography>
          </LogoSection>

          <CardContent sx={{ px: { xs: 3, sm: 4 }, pb: 4 }}>
            <Tabs
              value={tab}
              onChange={handleTabChange}
              variant="fullWidth"
              indicatorColor="primary"
              textColor="primary"
              sx={{ mb: 3 }}
            >
              <Tab label="Sign In" sx={{ fontWeight: 600, textTransform: 'none' }} />
              <Tab label="Sign Up" sx={{ fontWeight: 600, textTransform: 'none' }} />
            </Tabs>

            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                {success}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                sx={{ mb: isLogin ? 3 : 2 }}
              />
              {!isLogin && (
                <TextField
                  fullWidth
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  sx={{ mb: 3 }}
                />
              )}

              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                disabled={submitting}
                sx={{
                  py: 1.5,
                  fontWeight: 600,
                  fontSize: '1rem',
                  borderRadius: 2,
                }}
              >
                {submitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : isLogin ? (
                  'Sign In'
                ) : (
                  'Create Account'
                )}
              </Button>
            </Box>

            <Typography
              variant="body2"
              sx={{ textAlign: 'center', mt: 3, color: 'text.secondary', fontSize: '0.8rem' }}
            >
              {isLogin
                ? "Don't have an account? "
                : 'Already have an account? '}
              <Box
                component="span"
                onClick={() => handleTabChange({} as React.SyntheticEvent, isLogin ? 1 : 0)}
                sx={{
                  color: 'primary.main',
                  fontWeight: 600,
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </Box>
            </Typography>
          </CardContent>
        </AuthCard>
      </Container>
    </Box>
  );
};

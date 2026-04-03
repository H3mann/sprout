import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

const LogoText = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '1.5rem',
  color: theme.palette.primary.main,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1)
}));

const NavButton = styled(Button)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontWeight: 500,
  fontSize: '0.95rem',
  '&:hover': {
    backgroundColor: theme.palette.primary.light + '1A'
  }
}));

export const Header = () => {
  const navigate = useNavigate();

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          <LogoText onClick={() => navigate('/')}>
            Sprout
          </LogoText>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <NavButton onClick={() => navigate('/tracker')}>Growth Tracker</NavButton>
            <NavButton onClick={() => navigate('/tracker?tab=4')}>Vaccines</NavButton>
            <NavButton onClick={() => navigate('/ask')}>Ask a Question</NavButton>
            <Button variant="contained" color="primary" size="small">
              Get Started
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

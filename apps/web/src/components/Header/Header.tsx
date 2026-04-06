import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import { useNavigate } from 'react-router-dom';

import { useChildren } from '../../context/ChildContext';

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
  const { activeChild, getAgeDisplay } = useChildren();

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
            <NavButton onClick={() => navigate('/children')}>My Children</NavButton>
            <NavButton onClick={() => navigate('/tracker')}>Growth Tracker</NavButton>
            <NavButton onClick={() => navigate('/tracker?tab=5')}>Vaccines</NavButton>
            <NavButton onClick={() => navigate('/ask')}>Ask a Question</NavButton>

            {activeChild ? (
              <Chip
                icon={<ChildCareIcon />}
                label={`${activeChild.name} (${getAgeDisplay(activeChild)})`}
                color="primary"
                variant="outlined"
                size="small"
                onClick={() => navigate('/children')}
                sx={{ fontWeight: 600, cursor: 'pointer' }}
              />
            ) : (
              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={() => navigate('/children')}
              >
                Add Child
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

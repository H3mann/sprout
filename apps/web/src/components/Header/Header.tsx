import { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import CloseIcon from '@mui/icons-material/Close';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import MenuIcon from '@mui/icons-material/Menu';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PeopleIcon from '@mui/icons-material/People';
import SearchIcon from '@mui/icons-material/Search';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import VaccinesIcon from '@mui/icons-material/Vaccines';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { useNavigate, useLocation } from 'react-router-dom';

import { useChildren } from '../../context/ChildContext';
import { useVisitPrep } from '../../context/VisitPrepContext';

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
  fontSize: '0.85rem',
  whiteSpace: 'nowrap',
  minWidth: 'auto',
  padding: theme.spacing(0.5, 1.25),
  '&:hover': {
    backgroundColor: theme.palette.primary.light + '1A'
  }
}));

const menuItems = [
  { label: 'My Children', path: '/children', icon: <PeopleIcon /> },
  { label: 'Growth Tracker', path: '/tracker', icon: <ShowChartIcon /> },
  { label: 'Vaccines', path: '/tracker?tab=4', icon: <VaccinesIcon /> },
  { label: 'Dosage Calculator', path: '/dosage', icon: <LocalHospitalIcon /> },
  { label: 'Visit Prep', path: '/visit-prep', icon: <AssignmentIcon /> },
  { label: 'FAQ & Research', path: '/ask', icon: <MenuBookIcon /> },
  { label: 'Ask a Question', path: '/', icon: <SearchIcon /> },
];

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeChild, getAgeDisplay } = useChildren();
  const { items } = useVisitPrep();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleNav = (path: string) => {
    setDrawerOpen(false);
    navigate(path);
  };

  return (
    <>
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                onClick={() => setDrawerOpen(true)}
                sx={{ color: 'text.primary' }}
                size="small"
              >
                <MenuIcon />
              </IconButton>
              <LogoText onClick={() => navigate('/')}>
                Sprout
              </LogoText>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'nowrap' }}>
              <NavButton onClick={() => navigate('/children')}>My Children</NavButton>
              <NavButton onClick={() => navigate('/tracker')}>Growth Tracker</NavButton>
              <NavButton onClick={() => navigate('/dosage')}>Dosage Calculator</NavButton>
              <NavButton onClick={() => navigate('/visit-prep')}>
                Visit Prep{items.length > 0 ? ` (${items.length})` : ''}
              </NavButton>
              <NavButton onClick={() => navigate('/ask')}>FAQ & Research</NavButton>
              <Button
                variant="contained"
                color="primary"
                size="small"
                startIcon={<SearchIcon />}
                onClick={() => navigate('/')}
                sx={{ borderRadius: 3, px: 2, fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap' }}
              >
                Ask a Question
              </Button>

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

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 280 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
              Sprout
            </Typography>
            <IconButton onClick={() => setDrawerOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider />

          {activeChild && (
            <Box sx={{ px: 2, py: 1.5, bgcolor: 'primary.light', bgcolor2: '#f5f5f5' }}>
              <Chip
                icon={<ChildCareIcon />}
                label={`${activeChild.name} (${getAgeDisplay(activeChild)})`}
                color="primary"
                variant="outlined"
                size="small"
                onClick={() => handleNav('/children')}
                sx={{ fontWeight: 600, cursor: 'pointer' }}
              />
            </Box>
          )}

          <List>
            {menuItems.map((item) => {
              const isActive = item.path === '/'
                ? location.pathname === '/'
                : location.pathname + location.search === item.path || location.pathname === item.path;
              return (
                <ListItemButton
                  key={item.label}
                  onClick={() => handleNav(item.path)}
                  selected={isActive}
                  sx={{ py: 1.5 }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: isActive ? 'primary.main' : 'text.secondary' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label === 'Visit Prep' && items.length > 0
                      ? `Visit Prep (${items.length})`
                      : item.label}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 600 : 400,
                      fontSize: '0.95rem'
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      </Drawer>
    </>
  );
};

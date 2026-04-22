import { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import CalculateIcon from '@mui/icons-material/Calculate';
import HomeIcon from '@mui/icons-material/Home';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import MapIcon from '@mui/icons-material/Map';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { label: 'Deal Analyzer', path: '/deal-analyzer', icon: <CalculateIcon /> },
  { label: 'Strategies', path: '/deal-strategy', icon: <TrendingUpIcon /> },
  { label: 'Neighborhoods', path: '/neighborhood', icon: <MapIcon /> },
  { label: 'Saved', path: '/saved', icon: <BookmarkIcon /> },
  { label: 'About', path: '/about', icon: <InfoOutlinedIcon /> },
];

export const Header = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ maxWidth: 'lg', width: '100%', mx: 'auto', px: { xs: 2, sm: 3 } }}>
          <IconButton
            edge="start"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 1, display: { md: 'none' }, color: 'text.primary' }}
          >
            <MenuIcon />
          </IconButton>

          <Box
            onClick={() => navigate('/')}
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', mr: 4 }}
          >
            <AnalyticsIcon sx={{ color: 'primary.main', mr: 1, fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
              Realm
            </Typography>
          </Box>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, flex: 1 }}>
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.path}
                onClick={() => navigate(item.path)}
                startIcon={item.icon}
                sx={{
                  color: isActive(item.path) ? 'primary.main' : 'text.secondary',
                  fontWeight: isActive(item.path) ? 700 : 500,
                  borderBottom: isActive(item.path) ? 2 : 0,
                  borderColor: 'primary.main',
                  borderRadius: 0,
                  px: 2,
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          <Box sx={{ ml: 'auto' }}>
            {user ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountCircleIcon sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }} />
                <Typography variant="body2" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>
                  {user.email}
                </Typography>
                <IconButton onClick={signOut} size="small" sx={{ color: 'text.secondary' }}>
                  <LogoutIcon fontSize="small" />
                </IconButton>
              </Box>
            ) : (
              <Button variant="contained" size="small" onClick={() => navigate('/login')}>
                Sign In
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 280, pt: 2 }}>
          <Box sx={{ px: 2, pb: 2, display: 'flex', alignItems: 'center' }}>
            <AnalyticsIcon sx={{ color: 'primary.main', mr: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
              Realm
            </Typography>
          </Box>
          <Divider />
          <List>
            <ListItemButton onClick={() => { navigate('/'); setDrawerOpen(false); }}>
              <ListItemIcon><HomeIcon /></ListItemIcon>
              <ListItemText primary="Home" />
            </ListItemButton>
            {NAV_ITEMS.map((item) => (
              <ListItemButton
                key={item.path}
                selected={isActive(item.path)}
                onClick={() => { navigate(item.path); setDrawerOpen(false); }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  );
};

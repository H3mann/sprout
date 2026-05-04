import { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import TextField from '@mui/material/TextField';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import CalculateIcon from '@mui/icons-material/Calculate';
import HomeIcon from '@mui/icons-material/Home';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import MapIcon from '@mui/icons-material/Map';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LOCATION_OPTIONS, useSearchLocation } from '../../context/LocationContext';

const LOCATION_TOOLTIP =
  'This location is added to your AI search to focus results. For more granular search (e.g., a specific city, ZIP, or neighborhood), include it directly in your search input.';

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
  const { location: searchLocation, setLocation: setSearchLocation } = useSearchLocation();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname.startsWith(path);

  const locationPicker = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%' }}>
      <Autocomplete
        freeSolo
        disableClearable
        size="small"
        fullWidth
        options={LOCATION_OPTIONS}
        value={searchLocation}
        onChange={(_, val) => setSearchLocation(typeof val === 'string' ? val : searchLocation)}
        onInputChange={(_, val, reason) => {
          if (reason === 'input' || reason === 'clear') setSearchLocation(val);
        }}
        sx={{
          flex: 1,
          '& .MuiOutlinedInput-root': { bgcolor: 'background.default' },
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="Location"
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start" sx={{ pl: 0.5 }}>
                  <LocationOnIcon fontSize="small" color="primary" />
                </InputAdornment>
              ),
            }}
          />
        )}
      />
      <Tooltip
        title={LOCATION_TOOLTIP}
        arrow
        placement="bottom"
        enterTouchDelay={0}
        leaveTouchDelay={6000}
      >
        <IconButton size="small" aria-label="About the location filter" sx={{ color: 'text.secondary' }}>
          <InfoOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );

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

          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
            <Box sx={{ display: { xs: 'none', sm: 'block' }, width: { sm: 220, md: 260 } }}>
              {locationPicker}
            </Box>

            {user ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountCircleIcon sx={{ color: 'text.secondary', display: { xs: 'none', md: 'block' } }} />
                <Typography variant="body2" sx={{ color: 'text.secondary', display: { xs: 'none', md: 'block' } }}>
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

        <Box
          sx={{
            display: { xs: 'flex', sm: 'none' },
            justifyContent: 'center',
            px: 2,
            pb: 1,
            pt: 0.5,
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 360 }}>{locationPicker}</Box>
        </Box>
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

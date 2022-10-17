import React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import { AudibleService } from '../services/AudibleService';

const Header = () => {
  const audibleService = new AudibleService();

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton size="large" edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            <Button href="/" sx={{ my: 2, color: 'white', display: 'block' }}>
              My AudioBooks
            </Button>
            <Button href="/import" sx={{ my: 2, color: 'white', display: 'block' }}>
              Import my AudioBooks
            </Button>
          </Box>
          {!audibleService.isAuthenticated() ? (
            <>
              <Button href="/login" color="inherit">
                Login
              </Button>
              <Button href="/register" color="inherit">
                Register
              </Button>
            </>
          ) : (
            <>Welcome</>
          )}
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default Header;

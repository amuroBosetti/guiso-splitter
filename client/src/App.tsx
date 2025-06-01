import { CssBaseline, ThemeProvider, createTheme, Container, Typography, Box, AppBar, Toolbar, Button, Avatar, Tabs, Tab } from '@mui/material';
import { teal, deepOrange } from '@mui/material/colors';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import EventList from './pages/EventList';
import EventDetail from './pages/EventDetail';
import ExpenseTracker from './pages/ExpenseTracker';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Profile } from './pages/Profile';

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: teal[500],
    },
    secondary: {
      main: deepOrange[500],
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
      marginBottom: '1rem',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
      marginBottom: '1rem',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
  },
});

function Layout() {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  
  // Determine current tab based on location
  const getCurrentTab = () => {
    if (location.pathname.startsWith('/expenses')) return 1;
    return 0; // Default to events tab
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'background.default',
      }}
    >
      <AppBar position="static" color="default" elevation={0}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
            <Typography variant="h6" component={Link} to="/" sx={{ textDecoration: 'none', color: 'inherit', flexGrow: 1 }}>
              Guiso Splitter
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {user ? (
                <>
                  <Button 
                    color="inherit" 
                    component={Link} 
                    to="/profile"
                    startIcon={
                      <Avatar 
                        sx={{ 
                          width: 24, 
                          height: 24, 
                          bgcolor: 'primary.main',
                          fontSize: '0.8rem'
                        }}
                      >
                        {profile?.display_name ? profile.display_name.charAt(0).toUpperCase() : 'U'}
                      </Avatar>
                    }
                  >
                    {profile?.display_name || 'Profile'}
                  </Button>
                  <Button 
                    color="inherit" 
                    variant="outlined" 
                    onClick={signOut}
                    size="small"
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button color="inherit" component={Link} to="/login">
                    Sign In
                  </Button>
                  <Button color="primary" variant="contained" component={Link} to="/signup" sx={{ ml: 1 }}>
                    Sign Up
                  </Button>
                </>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
      
      {/* Navigation Tabs - Only show when user is logged in and not on auth/profile pages */}
      {user && !location.pathname.includes('/login') && !location.pathname.includes('/signup') && !location.pathname.includes('/profile') && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Container maxWidth="lg">
            <Tabs 
              value={getCurrentTab()} 
              sx={{ 
                '& .MuiTabs-indicator': { 
                  backgroundColor: 'primary.main' 
                } 
              }}
            >
              <Tab 
                label="Events" 
                component={Link} 
                to="/" 
                sx={{ textTransform: 'none', fontWeight: 500 }}
              />
              <Tab 
                label="Expense Tracker" 
                component={Link} 
                to="/expenses" 
                sx={{ textTransform: 'none', fontWeight: 500 }}
              />
            </Tabs>
          </Container>
        </Box>
      )}
      
      <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/" element={
            <ProtectedRoute>
              <EventList />
            </ProtectedRoute>
          } />
          <Route path="/events/:id" element={
            <ProtectedRoute>
              <EventDetail />
            </ProtectedRoute>
          } />
          <Route path="/expenses" element={
            <ProtectedRoute>
              <ExpenseTracker />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Container>
    </Box>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Layout />
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

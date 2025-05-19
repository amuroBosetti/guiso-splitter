import { CssBaseline, ThemeProvider, createTheme, Container, Typography, Box } from '@mui/material';
import { teal, deepOrange } from '@mui/material/colors';
import EventList from './components/EventList.tsx';

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

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default',
        }}
      >
        <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography variant="h1" component="h1">
              Guiso Splitter
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Split food expenses with friends, the easy way
            </Typography>
          </Box>
          
          <EventList />
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;

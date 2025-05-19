import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Alert, 
  AlertTitle, 
  Box, 
  CircularProgress,
  Paper,
  styled
} from '@mui/material';
import { supabase } from '../lib/supabase';

const StyledCard = styled(Card)(({ theme }) => ({
  maxWidth: 800,
  margin: '2rem auto',
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[3],
}));

const SupabaseTest = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      setIsLoading(true);
      try {
        // Test connection by fetching a single row from the users table
        const { error } = await supabase
          .from('users')
          .select('*')
          .limit(1);

        if (error) throw error;

        setConnectionStatus('Successfully connected to Supabase!');
      } catch (err: unknown) {
        // If we get here, we at least connected to Supabase
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        if (errorMessage.includes('relation "users" does not exist')) {
          setConnectionStatus('Successfully connected to Supabase!');
        } else {
          const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
          console.error('Error connecting to Supabase:', errorMessage);
          setError(errorMessage);
        }
      } finally {
        setIsLoading(false);
      }
    };

    testConnection();
  }, []);

  return (
    <StyledCard>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          Connection Status
        </Typography>
        
        {isLoading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {connectionStatus && (
              <Alert severity="success" sx={{ mt: 2 }}>
                <AlertTitle>Connected</AlertTitle>
                {connectionStatus}
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                <AlertTitle>Connection Error</AlertTitle>
                {error}
                <Box component="p" mt={1}>
                  Check your .env file and make sure you've set the correct Supabase URL and anon key.
                </Box>
              </Alert>
            )}

            <Paper variant="outlined" sx={{ p: 2, mt: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Next Steps:
              </Typography>
              <ul>
                <li>Create your first event</li>
                <li>Add participants</li>
                <li>Start tracking expenses</li>
              </ul>
            </Paper>
          </>
        )}
      </CardContent>
    </StyledCard>
  );
};

export default SupabaseTest;

import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Button,
  Divider,
  Chip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { supabase } from '../lib/supabase';

interface SplitResult {
  user_name: string;
  user_id: string;
  total_spent: number;
  share_amount: number;
  balance: number;
  owes?: Array<{
    to_user: string;
    amount: number;
  }>;
  owed?: Array<{
    from_user: string;
    amount: number;
  }>;
}

interface SplitData {
  event_name: string;
  event_date: string;
  total_expenses: number;
  participant_count: number;
  results: SplitResult[];
}

export default function SplitResults() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');
  const [splitData, setSplitData] = useState<SplitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      setError('No event ID provided');
      setLoading(false);
      return;
    }

    calculateSplit();
  }, [eventId]);

  const calculateSplit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call the Supabase Edge Function to calculate the split
      const { data, error } = await supabase.functions.invoke('calculate-split', {
        body: { eventId }
      });

      if (error) throw error;
      
      setSplitData(data);
    } catch (err) {
      console.error('Error calculating split:', err);
      setError(err instanceof Error ? err.message : 'Failed to calculate split');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Button
          component={Link}
          to="/expenses"
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 3 }}
        >
          Back to Expenses
        </Button>
        <Alert severity="error">
          {error}
        </Alert>
      </Box>
    );
  }

  if (!splitData) {
    return (
      <Box>
        <Button
          component={Link}
          to="/expenses"
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 3 }}
        >
          Back to Expenses
        </Button>
        <Alert severity="info">
          No split data available
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Button
        component={Link}
        to="/expenses"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 3 }}
      >
        Back to Expenses
      </Button>

      <Typography variant="h1" component="h1" sx={{ mb: 3 }}>
        Split Results
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Event Summary
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <Chip label={`Event: ${splitData.event_name}`} variant="outlined" />
          <Chip label={`Date: ${formatDate(splitData.event_date)}`} variant="outlined" />
          <Chip label={`Total: ${formatCurrency(splitData.total_expenses)}`} color="primary" variant="outlined" />
          <Chip label={`${splitData.participant_count} participants`} variant="outlined" />
        </Box>
        <Typography variant="body2" color="text.secondary">
          Each person's fair share: {formatCurrency(splitData.total_expenses / splitData.participant_count)}
        </Typography>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Individual Balances
        </Typography>
        
        <List>
          {splitData.results.map((result, index) => (
            <Box key={result.user_id}>
              <ListItem sx={{ px: 0, alignItems: 'flex-start' }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {result.user_name}
                      </Typography>
                      <Chip 
                        label={
                          result.balance > 0 
                            ? `Owed ${formatCurrency(result.balance)}`
                            : result.balance < 0 
                            ? `Owes ${formatCurrency(Math.abs(result.balance))}`
                            : 'Even'
                        }
                        color={
                          result.balance > 0 
                            ? 'success' 
                            : result.balance < 0 
                            ? 'error' 
                            : 'default'
                        }
                        size="small"
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Spent: {formatCurrency(result.total_spent)} • 
                        Fair share: {formatCurrency(result.share_amount)}
                      </Typography>
                      
                      {result.owes && result.owes.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" fontWeight="medium" color="error.main">
                            Owes:
                          </Typography>
                          {result.owes.map((debt, i) => (
                            <Typography key={i} variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                              • {formatCurrency(debt.amount)} to {debt.to_user}
                            </Typography>
                          ))}
                        </Box>
                      )}
                      
                      {result.owed && result.owed.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" fontWeight="medium" color="success.main">
                            Owed by:
                          </Typography>
                          {result.owed.map((credit, i) => (
                            <Typography key={i} variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                              • {formatCurrency(credit.amount)} from {credit.from_user}
                            </Typography>
                          ))}
                        </Box>
                      )}
                    </Box>
                  }
                />
              </ListItem>
              {index < splitData.results.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      </Paper>
    </Box>
  );
} 
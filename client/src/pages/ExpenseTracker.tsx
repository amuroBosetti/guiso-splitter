import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  CircularProgress,
  Alert,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { supabase } from '../lib/supabase';
import { ExpenseRepository, type Expense } from '../repositories/ExpenseRepository';
import type { Tables } from '../lib/supabase';

type Event = Tables<'events'>;

export default function ExpenseTracker() {
  const [events, setEvents] = useState<Event[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    eventId: '',
    amount: '',
    notes: ''
  });

  // Fetch events and expenses when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch events and user expenses in parallel
        const [eventsData, expensesData] = await Promise.all([
          supabase.from('events').select('*').order('event_date', { ascending: false }),
          ExpenseRepository.getUserExpenses()
        ]);

        if (eventsData.error) throw eventsData.error;
        
        setEvents(eventsData.data || []);
        setExpenses(expensesData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.eventId || !formData.amount) {
      setError('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      // Save expense to database
      const newExpense = await ExpenseRepository.recordExpense({
        event_id: formData.eventId,
        amount: amount,
        notes: formData.notes.trim() || null
      });
      
      // Add the new expense to the list (with event info)
      const selectedEvent = events.find(e => e.id === formData.eventId);
      const expenseWithEvent: Expense = {
        ...newExpense,
        event: selectedEvent ? {
          id: selectedEvent.id,
          event_name: selectedEvent.event_name,
          event_date: selectedEvent.event_date
        } : undefined
      };
      
      setExpenses([expenseWithEvent, ...expenses]);
      setSuccess('Expense recorded successfully!');
      setFormData({ eventId: '', amount: '', notes: '' });
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('Error saving expense:', err);
      setError(err instanceof Error ? err.message : 'Failed to save expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await ExpenseRepository.deleteExpense(expenseId);
      setExpenses(expenses.filter(expense => expense.id !== expenseId));
      setSuccess('Expense deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting expense:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete expense');
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const selectedEvent = events.find(event => event.id === formData.eventId);

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <Box>
      <Typography variant="h1" component="h1" sx={{ mb: 3 }}>
        Expense Tracker
      </Typography>
      
      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Form Section */}
          <Paper sx={{ p: 3, flex: 1, maxWidth: { md: 400 } }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Record Expense
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}
            
            <Box component="form" onSubmit={handleSubmit}>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="event-select-label">Event *</InputLabel>
                <Select
                  labelId="event-select-label"
                  id="event-select"
                  value={formData.eventId}
                  label="Event *"
                  onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
                >
                  {events.map((event) => (
                    <MenuItem key={event.id} value={event.id}>
                      {event.event_name} - {formatDate(event.event_date)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Amount Spent *"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                inputProps={{
                  min: 0,
                  step: 0.01
                }}
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                label="Notes (optional)"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                sx={{ mb: 3 }}
              />

              {selectedEvent && (
                <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Selected Event:
                  </Typography>
                  <Typography variant="body1">
                    <strong>{selectedEvent.event_name}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(selectedEvent.event_date)}
                  </Typography>
                </Box>
              )}

              <Button
                type="submit"
                variant="contained"
                disabled={submitting || !formData.eventId || !formData.amount}
                fullWidth
                sx={{ mt: 2 }}
              >
                {submitting ? 'Recording...' : 'Record Expense'}
              </Button>
            </Box>
          </Paper>

          {/* Expenses List Section */}
          <Paper sx={{ p: 3, flex: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Your Expenses
              </Typography>
              <Chip 
                label={`Total: ${formatCurrency(totalExpenses)}`}
                color="primary"
                variant="outlined"
              />
            </Box>
            
            {expenses.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No expenses recorded yet. Add your first expense using the form on the left.
              </Typography>
            ) : (
              <List>
                {expenses.map((expense, index) => (
                  <Box key={expense.id}>
                    <ListItem
                      sx={{ 
                        px: 0,
                        alignItems: 'flex-start'
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle1">
                              {expense.event?.event_name || 'Unknown Event'}
                            </Typography>
                            <Typography variant="h6" color="primary">
                              {formatCurrency(expense.amount)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              {expense.event ? formatDate(expense.event.event_date) : ''}
                              {' • '}
                              {formatDate(expense.created_at)}
                            </Typography>
                            {expense.notes && (
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
                                {expense.notes}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton 
                          edge="end" 
                          onClick={() => handleDeleteExpense(expense.id)}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < expenses.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            )}
          </Paper>
        </Box>
      )}
    </Box>
  );
} 
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Typography, 
  Card, 
  CardContent, 
  Divider, 
  CircularProgress,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  List,
  ListItem,
  ListItemText,
  Chip,
  Paper
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { supabase } from '../lib/supabase';
import { GuestRepository } from '../repositories/GuestRepository';
import { MealRepository, type Meal } from '../repositories/MealRepository';
import { ExpenseRepository, type Expense } from '../repositories/ExpenseRepository';
import { IngredientsList } from '../components/IngredientsList';

import type { Guest } from '../repositories/GuestRepository';

interface Event {
  id: string;
  event_name: string;
  event_date: string;
  created_at: string;
}

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mealDialogOpen, setMealDialogOpen] = useState(false);
  const [mealForm, setMealForm] = useState({
    name: '',
    description: ''
  });
  const [mealError, setMealError] = useState<string | null>(null);
  const [submittingMeal, setSubmittingMeal] = useState(false);
  const [deletingMealId, setDeletingMealId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [mealToDelete, setMealToDelete] = useState<Meal | null>(null);

  useEffect(() => {
    const fetchEventData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch event
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .single();

        if (eventError) throw eventError;
        if (!eventData) throw new Error('Event not found');
        
        setEvent(eventData);
        
        // Fetch guests, meals, and expenses in parallel
        const [guestsData, mealsData, expensesData] = await Promise.all([
          GuestRepository.getGuestsForEvent(id),
          MealRepository.getMealsForEvent(id),
          ExpenseRepository.getExpensesForEvent(id)
        ]);
        
        setGuests(guestsData);
        setMeals(mealsData);
        setExpenses(expensesData);
        
      } catch (err) {
        console.error('Error fetching event data:', err);
        setError('Failed to load event data');
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleMealFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMealForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitMeal = async () => {
    if (!id) return;
    
    try {
      setSubmittingMeal(true);
      setMealError(null);
      
      // Get the auth user
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (!authUser || authError) {
        throw new Error('You must be logged in to propose a meal');
      }
      
      // Get the user profile
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('auth_id', authUser.id)
        .single();
        
      if (!userProfile || profileError) {
        throw new Error('User profile not found. Please complete your profile first.');
      }
      
      const newMeal = await MealRepository.proposeMeal({
        event_id: id,
        meal_name: mealForm.name.trim(),
        description: mealForm.description.trim(),
        proposed_by: userProfile.id
      });
      
      setMeals(prev => [newMeal, ...prev]);
      setMealForm({ name: '', description: '' });
      setMealDialogOpen(false);
      
    } catch (err) {
      console.error('Error proposing meal:', err);
      setMealError(err instanceof Error ? err.message : 'Failed to propose meal');
    } finally {
      setSubmittingMeal(false);
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    const meal = meals.find(m => m.id === mealId);
    if (meal) {
      setMealToDelete(meal);
      setDeleteConfirmOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!mealToDelete) return;
    
    try {
      setDeletingMealId(mealToDelete.id);
      setMealError(null);
      
      await MealRepository.deleteMeal(mealToDelete.id);
      
      // Remove the meal from the local state
      setMeals(prev => prev.filter(meal => meal.id !== mealToDelete.id));
      
    } catch (err) {
      console.error('Error deleting meal:', err);
      setMealError(err instanceof Error ? err.message : 'Failed to delete meal');
    } finally {
      setDeletingMealId(null);
      setDeleteConfirmOpen(false);
      setMealToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setMealToDelete(null);
  };

  const handleSplit = () => {
    if (!id) return;
    navigate(`/split-results?eventId=${id}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !event) {
    return (
      <Box textAlign="center" my={4}>
        <Typography color="error" gutterBottom>
          {error || 'Event not found'}
        </Typography>
        <Button variant="contained" onClick={() => navigate('/')}>
          Back to Events
        </Button>
      </Box>
    );
  }

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <Box>
      <Box mb={3} display="flex" alignItems="center">
        <IconButton onClick={() => navigate('/')} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          {event.event_name}
        </Typography>
      </Box>

      <Card variant="outlined">
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="h6" gutterBottom>
                Event Details
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Date & Time:</strong> {formatDate(event.event_date)}
              </Typography>
              <Typography variant="body1">
                <strong>Created:</strong> {new Date(event.created_at).toLocaleDateString()}
              </Typography>
              {totalExpenses > 0 && (
                <Typography variant="body1" sx={{ mt: 1 }}>
                  <strong>Total Expenses:</strong> {formatCurrency(totalExpenses)}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<RestaurantIcon />}
                onClick={() => setMealDialogOpen(true)}
              >
                Propose Meal
              </Button>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<AttachMoneyIcon />}
                onClick={handleSplit}
                disabled={expenses.length === 0}
              >
                Split
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Meals Section */}
      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          Proposed Meals
        </Typography>
        {mealError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {mealError}
          </Alert>
        )}
        {meals.length === 0 ? (
          <Typography color="textSecondary" sx={{ fontStyle: 'italic' }}>
            No meals have been proposed yet. Be the first to suggest one!
          </Typography>
        ) : (
          <List>
            {meals.map((meal) => (
              <Paper key={meal.id} variant="outlined" sx={{ mb: 2 }}>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1} justifyContent="space-between">
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle1">{meal.meal_name}</Typography>
                          <Chip 
                            label={meal.status} 
                            size="small" 
                            color={
                              meal.status === 'accepted' ? 'success' : 
                              meal.status === 'rejected' ? 'error' : 'default'
                            }
                          />
                        </Box>
                        {meal.status === 'proposed' && (
                          <IconButton
                            aria-label="delete"
                            onClick={() => handleDeleteMeal(meal.id)}
                            disabled={deletingMealId === meal.id}
                            color="error"
                            size="small"
                          >
                            {deletingMealId === meal.id ? (
                              <CircularProgress size={16} />
                            ) : (
                              <DeleteIcon fontSize="small" />
                            )}
                          </IconButton>
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {meal.description}
                        </Typography>
                        {meal.user && (
                          <Typography variant="caption" color="text.secondary">
                            Proposed by: {meal.user.display_name}
                          </Typography>
                        )}
                        
                        {/* Groceries List */}
                        <Box mt={1}>
                          <IngredientsList mealId={meal.id} guests={guests} />
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              </Paper>
            ))}
          </List>
        )}
      </Box>

      {/* Expenses Section */}
      <Box mt={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Expenses ({expenses.length})
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AttachMoneyIcon />}
            onClick={() => navigate('/expenses')}
          >
            Add Expense
          </Button>
        </Box>
        {expenses.length === 0 ? (
          <Typography color="textSecondary" sx={{ fontStyle: 'italic' }}>
            No expenses have been recorded for this event yet.
          </Typography>
        ) : (
          <Paper variant="outlined">
            <List>
              {expenses.map((expense, index) => (
                <Box key={expense.id}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="subtitle1">
                            {formatCurrency(expense.amount)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {expense.user?.display_name || 'Unknown User'}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(expense.created_at).toLocaleDateString()}
                          </Typography>
                          {expense.notes && (
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              {expense.notes}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < expenses.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          </Paper>
        )}
      </Box>

      {/* Propose Meal Dialog */}
      <Dialog open={mealDialogOpen} onClose={() => setMealDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Propose a New Meal</DialogTitle>
        <DialogContent>
          {mealError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {mealError}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Meal Name"
            type="text"
            fullWidth
            variant="outlined"
            value={mealForm.name}
            onChange={handleMealFormChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="description"
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={mealForm.description}
            onChange={handleMealFormChange}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setMealDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmitMeal} 
            variant="contained" 
            startIcon={<AddIcon />}
            disabled={!mealForm.name.trim() || submittingMeal}
          >
            {submittingMeal ? 'Submitting...' : 'Propose Meal'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={handleCancelDelete} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the meal "{mealToDelete?.meal_name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button 
            onClick={handleConfirmDelete} 
            variant="contained" 
            color="error"
            startIcon={<DeleteIcon />}
            disabled={deletingMealId === mealToDelete?.id}
          >
            {deletingMealId === mealToDelete?.id ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Box mt={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Guests ({guests.length})
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<PersonAddIcon />}
            onClick={() => {}}
          >
            Add Guest
          </Button>
        </Box>

        {guests.length === 0 ? (
          <Typography color="textSecondary" sx={{ fontStyle: 'italic' }}>
            No guests have been added yet.
          </Typography>
        ) : (
          <Card variant="outlined">
            {guests.map((guest, index) => (
              <Box key={guest.id}>
                <Box p={2}>
                  <Typography variant="body1">
                    {guest.display_name}
                    {guest.email && ` (${guest.email})`}
                  </Typography>
                </Box>
                {index < guests.length - 1 && <Divider />}
              </Box>
            ))}
          </Card>
        )}
      </Box>
    </Box>
  );
};

export default EventDetail;

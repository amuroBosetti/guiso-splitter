import { useState, useEffect, Fragment } from 'react';
import { Ingredient, IngredientRepository } from '../repositories/IngredientRepository';
import { 
  Box, 
  TextField, 
  Button, 
  List, 
  ListItem, 
  ListItemText, 
  IconButton, 
  Paper, 
  Typography,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip
} from '@mui/material';
import { Add, Delete, PersonAdd } from '@mui/icons-material';

interface Guest {
  id: string;
  display_name: string;
  email: string | null;
}

interface IngredientsListProps {
  mealId: string;
  guests: Guest[];
}

export const IngredientsList: React.FC<IngredientsListProps> = ({ mealId, guests }) => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [newIngredient, setNewIngredient] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [selectedGuestId, setSelectedGuestId] = useState('');

  // Load ingredients when component mounts or mealId changes
  useEffect(() => {
    const loadIngredients = async () => {
      try {
        setLoading(true);
        const data = await IngredientRepository.getIngredientsForMeal(mealId);
        setIngredients(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load ingredients');
      } finally {
        setLoading(false);
      }
    };

    loadIngredients();
  }, [mealId]);

  const handleAddIngredient = async () => {
    if (!newIngredient.trim()) return;

    try {
      setLoading(true);
      const ingredient = await IngredientRepository.createIngredient({
        meal_id: mealId,
        name: newIngredient.trim(),
      });
      
      setIngredients(prev => [...prev, ingredient]);
      setNewIngredient('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add ingredient');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIngredient = async (id: string) => {
    try {
      setLoading(true);
      await IngredientRepository.deleteIngredient(id);
      setIngredients(prev => prev.filter(ing => ing.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete ingredient');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignClick = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setSelectedGuestId('');
    setAssignDialogOpen(true);
  };

  const handleAssignConfirm = async () => {
    if (!selectedIngredient || !selectedGuestId) return;
    
    try {
      setError(null);
      const updatedIngredient = await IngredientRepository.assignIngredient(
        selectedIngredient.id,
        selectedGuestId
      );
      
      // Update the ingredient in the local state
      setIngredients(prev => 
        prev.map(ing => 
          ing.id === updatedIngredient.id ? updatedIngredient : ing
        )
      );
      
      // Close dialog
      setAssignDialogOpen(false);
      setSelectedIngredient(null);
      setSelectedGuestId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign ingredient');
    }
  };

  const handleUnassignIngredient = async (ingredient: Ingredient) => {
    try {
      setError(null);
      const updatedIngredient = await IngredientRepository.unassignIngredient(ingredient.id);
      
      // Update the ingredient in the local state
      setIngredients(prev => 
        prev.map(ing => 
          ing.id === updatedIngredient.id ? updatedIngredient : ing
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unassign ingredient');
    }
  };

  const handleAssignCancel = () => {
    setAssignDialogOpen(false);
    setSelectedIngredient(null);
    setSelectedGuestId('');
  };

  if (loading && ingredients.length === 0) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <>
      <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6">Ingredients</Typography>
        </Box>
        
        <Box display="flex" gap={1} mb={2}>
          <TextField
            fullWidth
            size="small"
            placeholder="Add an ingredient..."
            value={newIngredient}
            onChange={(e) => setNewIngredient(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddIngredient()}
            disabled={loading}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddIngredient}
            disabled={!newIngredient.trim() || loading}
            startIcon={<Add />}
          >
            Add
          </Button>
        </Box>

        {error && (
          <Typography color="error" variant="body2" mb={2}>
            {error}
          </Typography>
        )}

        <List dense>
          {ingredients.map((ingredient) => (
            <Fragment key={ingredient.id}>
              <ListItem
                secondaryAction={
                  <Box display="flex" gap={1}>
                    <IconButton 
                      edge="end" 
                      aria-label="assign"
                      onClick={() => handleAssignClick(ingredient)}
                      disabled={loading}
                      size="small"
                      color="primary"
                    >
                      <PersonAdd fontSize="small" />
                    </IconButton>
                    <IconButton 
                      edge="end" 
                      aria-label="delete"
                      onClick={() => handleDeleteIngredient(ingredient.id)}
                      disabled={loading}
                      size="small"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText 
                  primary={
                    <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} gap={1}>
                      <Typography>{ingredient.name}</Typography>
                      {ingredient.assigned_user && (
                        <Chip
                          label={ingredient.assigned_user.display_name}
                          size="small"
                          color="primary"
                          variant="outlined"
                          onDelete={() => handleUnassignIngredient(ingredient)}
                          sx={{ 
                            fontSize: '0.75rem',
                            alignSelf: { xs: 'flex-start', sm: 'center' }
                          }}
                        />
                      )}
                    </Box>
                  }
                />
              </ListItem>
              <Divider component="li" />
            </Fragment>
          ))}
          
          {ingredients.length === 0 && (
            <ListItem>
              <ListItemText 
                primary="No ingredients added yet" 
                primaryTypographyProps={{ color: 'textSecondary', fontStyle: 'italic' }}
              />
            </ListItem>
          )}
        </List>
      </Paper>

      {/* Assignment Dialog */}
      <Dialog open={assignDialogOpen} onClose={handleAssignCancel} maxWidth="sm" fullWidth>
        <DialogTitle>
          Assign Ingredient: {selectedIngredient?.name}
        </DialogTitle>
        <DialogContent>
          {selectedIngredient?.assigned_user && (
            <Box mb={2} p={2} bgcolor="grey.100" borderRadius={1}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Currently assigned to:
              </Typography>
              <Chip
                label={selectedIngredient.assigned_user.display_name}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Box>
          )}
          
          <Box mt={2}>
            <FormControl fullWidth>
              <InputLabel>Select Guest</InputLabel>
              <Select
                value={selectedGuestId}
                label="Select Guest"
                onChange={(e) => setSelectedGuestId(e.target.value)}
              >
                {guests.map((guest) => (
                  <MenuItem key={guest.id} value={guest.id}>
                    {guest.display_name}
                    {guest.email && ` (${guest.email})`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleAssignCancel}>Cancel</Button>
          {selectedIngredient?.assigned_user && (
            <Button 
              onClick={() => {
                handleUnassignIngredient(selectedIngredient);
                handleAssignCancel();
              }}
              color="warning"
            >
              Unassign
            </Button>
          )}
          <Button 
            onClick={handleAssignConfirm} 
            variant="contained" 
            color="primary"
            disabled={!selectedGuestId}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

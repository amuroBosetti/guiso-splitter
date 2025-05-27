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
  CircularProgress
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';

interface IngredientsListProps {
  mealId: string;
}

export const IngredientsList: React.FC<IngredientsListProps> = ({ mealId }) => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [newIngredient, setNewIngredient] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading && ingredients.length === 0) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
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
                <IconButton 
                  edge="end" 
                  aria-label="delete"
                  onClick={() => handleDeleteIngredient(ingredient.id)}
                  disabled={loading}
                  size="small"
                >
                  <Delete fontSize="small" />
                </IconButton>
              }
            >
              <ListItemText primary={ingredient.name} />
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
  );
};

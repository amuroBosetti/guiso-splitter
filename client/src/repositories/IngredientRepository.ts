import { supabase } from '../lib/supabase';

export interface Ingredient {
  id: string;
  meal_id: string;
  name: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface CreateIngredientInput {
  meal_id: string;
  name: string;
  notes?: string;
}

export class IngredientRepository {
  static async getIngredientsForMeal(mealId: string): Promise<Ingredient[]> {
    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .eq('meal_id', mealId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async createIngredient(ingredient: CreateIngredientInput): Promise<Ingredient> {
    // Get the current user's profile ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('auth_id', user.id)
      .single();
    
    if (!profile) throw new Error('User profile not found');

    const { data, error } = await supabase
      .from('ingredients')
      .insert([{
        ...ingredient,
        created_by: profile.id
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateIngredient(
    id: string, 
    updates: Partial<Omit<CreateIngredientInput, 'meal_id'>>
  ): Promise<Ingredient> {
    const { data, error } = await supabase
      .from('ingredients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteIngredient(id: string): Promise<void> {
    const { error } = await supabase
      .from('ingredients')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

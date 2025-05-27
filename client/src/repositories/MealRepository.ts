import { supabase } from '../lib/supabase';

export interface Meal {
  id: string;
  event_id: string;
  meal_name: string;
  description: string;
  proposed_by: string;
  created_at: string;
  status: 'proposed' | 'accepted' | 'rejected';
  user?: {
    id: string;
    display_name: string;
  };
}

export class MealRepository {
  static async proposeMeal(meal: Omit<Meal, 'id' | 'created_at' | 'status'>) {
    const { data, error } = await supabase
      .from('meals')
      .insert([{ ...meal, status: 'proposed' }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getMealsForEvent(eventId: string): Promise<Meal[]> {
    const { data, error } = await supabase
      .from('meals')
      .select(`
        *,
        proposed_by:user_profiles!inner (
          id,
          display_name
        )
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform the data to match the Meal interface
    return (data?.map(meal => ({
      ...meal,
      user: meal.user ? {
        id: meal.user.id,
        display_name: meal.user.display_name
      } : undefined
    })) as Meal[]) || [];
  }
}

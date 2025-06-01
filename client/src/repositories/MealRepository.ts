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

  static async deleteMeal(mealId: string): Promise<void> {
    console.log('Attempting to delete meal: ',mealId);
    
    // Get the current session to include the auth token
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No authentication token available');
    }

    console.log('Session info:', {
      userId: session.user?.id,
      hasToken: !!session.access_token,
      tokenLength: session.access_token.length
    });

    const { data, error } = await supabase.functions.invoke('delete-meal', {
      body: { mealId },
    });

    console.log('Delete response:', { data, error });
    console.log('Response data details:', data);

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Failed to delete meal');
    }

    if (data?.error) {
      console.error('Business logic error:', data.error);
      throw new Error(data.error);
    }
  }
}

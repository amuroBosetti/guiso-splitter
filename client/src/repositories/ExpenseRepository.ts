import { supabase } from '../lib/supabase';
import type { Tables, InsertTables } from '../lib/supabase';

export type Expense = Tables<'expenses'> & {
  event?: {
    id: string;
    event_name: string;
    event_date: string;
  };
  user?: {
    id: string;
    display_name: string;
  };
};

export type ExpenseInput = Omit<InsertTables<'expenses'>, 'recorded_by'>;

export class ExpenseRepository {
  /**
   * Records a new expense for an event
   */
  static async recordExpense(expense: ExpenseInput): Promise<Expense> {
    // Get the current user's profile
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user profile to get the internal user ID
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found');
    }

    // Insert the expense
    const { data, error } = await supabase
      .from('expenses')
      .insert([{
        ...expense,
        recorded_by: profile.id
      }])
      .select()
      .single();

    if (error) throw error;
    return data as Expense;
  }

  /**
   * Gets all expenses for an event
   */
  static async getExpensesForEvent(eventId: string): Promise<Expense[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        event:events!inner (
          id,
          event_name,
          event_date
        ),
        user:user_profiles!inner (
          id,
          display_name
        )
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Expense[];
  }

  /**
   * Gets all expenses for the current user
   */
  static async getUserExpenses(): Promise<Expense[]> {
    // Get the current user's profile
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user profile to get the internal user ID
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found');
    }

    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        event:events!inner (
          id,
          event_name,
          event_date
        ),
        user:user_profiles!inner (
          id,
          display_name
        )
      `)
      .eq('recorded_by', profile.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Expense[];
  }

  /**
   * Updates an expense
   */
  static async updateExpense(expenseId: string, updates: Partial<ExpenseInput>): Promise<Expense> {
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', expenseId)
      .select()
      .single();

    if (error) throw error;
    return data as Expense;
  }

  /**
   * Deletes an expense
   */
  static async deleteExpense(expenseId: string): Promise<void> {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);

    if (error) throw error;
  }
} 
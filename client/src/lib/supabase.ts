import { SupabaseClient } from '@supabase/supabase-js';

// Define the database schema types
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          auth_id: string;
          display_name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_id: string;
          display_name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_id?: string;
          display_name?: string;
          updated_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          event_name: string;
          event_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_name: string;
          event_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_name?: string;
          event_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          event_id: string;
          amount: number;
          recorded_by: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          amount: number;
          recorded_by: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          amount?: number;
          recorded_by?: string;
          notes?: string | null;
          updated_at?: string;
        };
      };
    };
  };
};

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];

// Extend the global type for the supabase client
declare global {
  interface Window {
    supabase: SupabaseClient<Database>;
  }
}

export const supabase: SupabaseClient<Database> = window.supabase;

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { calculateSplit, type Expense, type Guest } from './calculations.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SplitData {
  event_name: string;
  event_date: string;
  total_expenses: number;
  participant_count: number;
  results: Array<{
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
  }>;
}

interface Event {
  id: string;
  event_name: string;
  event_date: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { eventId } = await req.json()

    if (!eventId) {
      return new Response(
        JSON.stringify({ error: 'Event ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, event_name, event_date')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return new Response(
        JSON.stringify({ error: 'Event not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Fetch all expenses for the event with user details
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select(`
        id,
        amount,
        recorded_by,
        user_profiles!inner (
          id,
          display_name
        )
      `)
      .eq('event_id', eventId)

    if (expensesError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch expenses' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Fetch all guests for the event
    const { data: guests, error: guestsError } = await supabase
      .from('event_guests')
      .select(`
        user_profiles!inner (
          id,
          display_name
        )
      `)
      .eq('event_id', eventId)

    if (guestsError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch guests' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!expenses || expenses.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No expenses found for this event' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Use the extracted calculation logic
    const { totalExpenses, results } = calculateSplit(expenses as Expense[], guests as Guest[])

    const splitData: SplitData = {
      event_name: event.event_name,
      event_date: event.event_date,
      total_expenses: totalExpenses,
      participant_count: results.length,
      results: results
    }

    return new Response(
      JSON.stringify(splitData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in calculate-split function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 
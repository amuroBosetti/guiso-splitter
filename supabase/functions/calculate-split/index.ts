import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SplitResult {
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
}

interface SplitData {
  event_name: string;
  event_date: string;
  total_expenses: number;
  participant_count: number;
  results: SplitResult[];
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

    // For now, return hardcoded mock data
    // TODO: Replace with actual calculation logic
    const mockSplitData: SplitData = {
      event_name: "Weekend BBQ Party",
      event_date: "2024-01-15",
      total_expenses: 240.00,
      participant_count: 4,
      results: [
        {
          user_name: "Alice Johnson",
          user_id: "user1",
          total_spent: 120.00,
          share_amount: 60.00,
          balance: 60.00,
          owed: [
            { from_user: "Bob Smith", amount: 30.00 },
            { from_user: "Charlie Brown", amount: 30.00 }
          ]
        },
        {
          user_name: "Bob Smith", 
          user_id: "user2",
          total_spent: 80.00,
          share_amount: 60.00,
          balance: 20.00,
          owed: [
            { from_user: "David Wilson", amount: 20.00 }
          ]
        },
        {
          user_name: "Charlie Brown",
          user_id: "user3", 
          total_spent: 40.00,
          share_amount: 60.00,
          balance: -20.00,
          owes: [
            { to_user: "Alice Johnson", amount: 20.00 }
          ]
        },
        {
          user_name: "David Wilson",
          user_id: "user4",
          total_spent: 0.00,
          share_amount: 60.00,
          balance: -60.00,
          owes: [
            { to_user: "Alice Johnson", amount: 40.00 },
            { to_user: "Bob Smith", amount: 20.00 }
          ]
        }
      ]
    }

    return new Response(
      JSON.stringify(mockSplitData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 
-- Create expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  recorded_by UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_expenses_event_id ON public.expenses(event_id);
CREATE INDEX IF NOT EXISTS idx_expenses_recorded_by ON public.expenses(recorded_by);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable read access for event participants"
ON public.expenses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.event_guests
    JOIN public.user_profiles ON user_profiles.auth_id = auth.uid()
    WHERE event_guests.event_id = expenses.event_id
    AND event_guests.user_id = user_profiles.id
  )
);

CREATE POLICY "Enable insert for event participants"
ON public.expenses
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.event_guests
    JOIN public.user_profiles ON user_profiles.auth_id = auth.uid()
    WHERE event_guests.event_id = expenses.event_id
    AND event_guests.user_id = user_profiles.id
    AND user_profiles.id = expenses.recorded_by
  )
);

CREATE POLICY "Enable update for expense creator"
ON public.expenses
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.auth_id = auth.uid()
    AND user_profiles.id = expenses.recorded_by
  )
);

CREATE POLICY "Enable delete for expense creator"
ON public.expenses
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.auth_id = auth.uid()
    AND user_profiles.id = expenses.recorded_by
  )
);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER expenses_updated_at
BEFORE UPDATE ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION update_expenses_updated_at(); 
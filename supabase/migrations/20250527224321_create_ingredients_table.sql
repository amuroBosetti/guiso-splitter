-- Create ingredients table
CREATE TABLE IF NOT EXISTS public.ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE SET NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ingredients_meal_id ON public.ingredients(meal_id);

-- Enable RLS
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable read access for all users"
  ON public.ingredients
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON public.ingredients
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow any guest to update ingredients
CREATE POLICY "Enable update for event guests"
  ON public.ingredients
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.event_guests
      JOIN public.meals ON meals.id = ingredients.meal_id
      JOIN public.user_profiles ON user_profiles.auth_id = auth.uid()
      WHERE event_guests.event_id = meals.event_id
      AND event_guests.user_id = user_profiles.id
    )
  );

-- Allow any guest to delete ingredients
CREATE POLICY "Enable delete for event guests"
  ON public.ingredients
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.event_guests
      JOIN public.meals ON meals.id = ingredients.meal_id
      JOIN public.user_profiles ON user_profiles.auth_id = auth.uid()
      WHERE event_guests.event_id = meals.event_id
      AND event_guests.user_id = user_profiles.id
    )
  );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW; 
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ingredients_modtime
BEFORE UPDATE ON public.ingredients
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

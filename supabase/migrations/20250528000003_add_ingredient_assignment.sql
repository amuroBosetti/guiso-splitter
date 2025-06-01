-- Add assignment functionality to ingredients table
ALTER TABLE public.ingredients 
ADD COLUMN assigned_to UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- Create index for faster lookups by assigned user
CREATE INDEX IF NOT EXISTS idx_ingredients_assigned_to ON public.ingredients(assigned_to); 
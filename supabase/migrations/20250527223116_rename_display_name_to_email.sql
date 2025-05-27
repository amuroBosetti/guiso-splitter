-- Migration to rename display_name to email and add a new display_name column

-- First, check if the display_name column exists and rename it to email
ALTER TABLE public.user_profiles RENAME COLUMN display_name TO email;

ALTER TABLE public.user_profiles 
    ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Update the handle_new_user function to set both email and display_name
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (auth_id, email, display_name)
  VALUES (
    new.id, 
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

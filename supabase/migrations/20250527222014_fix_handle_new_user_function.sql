-- Fix the handle_new_user function to use COALESCE instead of OR
-- This fixes the error: "argument of OR must be type boolean, not type text"

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (auth_id, display_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'name', new.email));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

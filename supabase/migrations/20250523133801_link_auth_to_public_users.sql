-- Drop existing constraints and columns that will be replaced
ALTER TABLE public.user_profiles  
  DROP CONSTRAINT IF EXISTS user_profiles_email_key,
  DROP COLUMN IF EXISTS email;

-- Add auth_id column to reference auth.users
ALTER TABLE public.user_profiles 
  ADD COLUMN auth_id uuid references auth.users(id) on delete cascade,
  ADD CONSTRAINT user_profiles_auth_id_key UNIQUE (auth_id);

-- Create a function to handle new user signups
-- I really don't want to create database functions, but I would have to create a backend service and I don't want to do that now
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.user_profiles (auth_id, display_name)
  values (new.id, new.raw_user_meta_data->>'name' OR new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Create a trigger that fires when a new user signs up
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

CREATE POLICY "Users can view all public profiles"
  ON public.user_profiles
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = auth_id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = auth_id);

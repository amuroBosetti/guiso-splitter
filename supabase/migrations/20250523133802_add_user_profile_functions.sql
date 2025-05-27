-- Create a function to get the current user's profile
create or replace function public.get_current_user_profile()
returns json as $$
  select json_build_object(
    'id', u.id,
    'auth_id', u.auth_id,
    'display_name', u.display_name,
    'created_at', u.created_at,
    'updated_at', u.updated_at
  )
  from public.user_profiles u
  join auth.users au on u.auth_id = au.id
  where u.auth_id = auth.uid();
$$ language sql security definer;

-- Create a function to update the current user's profile
create or replace function public.update_current_user_profile(display_name text)
returns void as $$
begin
  update public.user_profiles 
  set 
    display_name = update_current_user_profile.display_name,
    updated_at = now()
  where auth_id = auth.uid();
end;
$$ language plpgsql security definer;

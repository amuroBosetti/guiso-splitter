-- Users table (stores all unique users/guests)
create table if not exists public.user_profiles (
  id uuid default gen_random_uuid() primary key,
  display_name text not null,
  email text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint user_profiles_email_key unique (email)
);

-- Events table
create table if not exists public.events (
  id uuid default gen_random_uuid() primary key,
  event_name text not null,
  event_date date not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Junction table for many-to-many relationship between events and users
create table if not exists public.event_guests (
  event_id uuid references public.events(id) on delete cascade,
  user_id uuid references public.user_profiles(id) on delete cascade,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  primary key (event_id, user_id)
);

-- Create indexes for better query performance
create index idx_event_guests_event_id on public.event_guests(event_id);
create index idx_event_guests_user_id on public.event_guests(user_id);

-- Set up triggers for updated_at
create or replace function update_modified_column() 
returns trigger as $$
begin
  new.updated_at = now();
  return new; 
end;
$$ language plpgsql;

create trigger update_users_modtime
before update on public.user_profiles
for each row execute procedure update_modified_column();

create trigger update_events_modtime
before update on public.events
for each row execute procedure update_modified_column();

create trigger update_event_guests_modtime
before update on public.event_guests
for each row execute procedure update_modified_column();

-- Enable Row Level Security (RLS) for fine-grained access control
-- We'll keep it simple for now but can be secured later
alter table public.user_profiles enable row level security;
alter table public.events enable row level security;
alter table public.event_guests enable row level security;

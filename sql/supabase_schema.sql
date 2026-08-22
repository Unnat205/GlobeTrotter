-- GlobeTrotter Database Complete Setup SQL
-- Run this script in your Supabase SQL Editor to set up all tables, triggers, and RLS policies

-- 1. USERS PROFILE TABLE
create table if not exists public.users (
  id uuid primary key,
  email text not null,
  first_name text,
  last_name text,
  phone text,
  city text,
  country text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.users disable row level security;

-- 2. TRIPS TABLE
create table if not exists public.trips (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  start_date date not null,
  end_date date not null,
  description text,
  cover_photo_url text,
  is_public boolean default false not null,
  share_slug text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.trips enable row level security;

-- 3. STOPS TABLE
create table if not exists public.stops (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  city_name text not null,
  country text not null,
  start_date date not null,
  end_date date not null,
  budget numeric(10,2) default 0.00 not null,
  order_index integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.stops enable row level security;

-- 4. ACTIVITIES TABLE
create table if not exists public.activities (
  id uuid default gen_random_uuid() primary key,
  stop_id uuid references public.stops(id) on delete cascade not null,
  day_number integer not null,
  name text not null,
  category text not null,
  cost numeric(10,2) default 0.00 not null,
  duration integer,
  notes text,
  order_index integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. DISABLE RLS FOR FRICTIONLESS DEMO MODE
alter table public.users disable row level security;
alter table public.trips disable row level security;
alter table public.stops disable row level security;
alter table public.activities disable row level security;

-- 6. PERFORMANCE INDEXES
create index if not exists idx_trips_user_id on public.trips(user_id);
create index if not exists idx_trips_share_slug on public.trips(share_slug);
create index if not exists idx_stops_trip_id on public.stops(trip_id);
create index if not exists idx_activities_stop_id on public.activities(stop_id);

-- 6. ROW-LEVEL SECURITY POLICIES

-- Users Policies
drop policy if exists "Allow public read access to profiles" on public.users;
create policy "Allow public read access to profiles" on public.users
  for select using (true);

drop policy if exists "Allow users to update their own profile" on public.users;
create policy "Allow users to update their own profile" on public.users
  for update using (auth.uid() = id);

-- Trips Policies
drop policy if exists "Trips are viewable by owner or if public" on public.trips;
create policy "Trips are viewable by owner or if public" on public.trips
  for select using (auth.uid() = user_id or is_public = true);

drop policy if exists "Users can insert their own trips" on public.trips;
create policy "Users can insert their own trips" on public.trips
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own trips" on public.trips;
create policy "Users can update their own trips" on public.trips
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own trips" on public.trips;
create policy "Users can delete their own trips" on public.trips
  for delete using (auth.uid() = user_id);

-- Stops Policies
drop policy if exists "Stops are viewable if associated trip is viewable" on public.stops;
create policy "Stops are viewable if associated trip is viewable" on public.stops
  for select using (
    exists (
      select 1 from public.trips
      where trips.id = stops.trip_id
      and (trips.user_id = auth.uid() or trips.is_public = true)
    )
  );

drop policy if exists "Users can insert stops for their own trips" on public.stops;
create policy "Users can insert stops for their own trips" on public.stops
  for insert with check (
    exists (
      select 1 from public.trips
      where trips.id = stops.trip_id
      and trips.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update stops for their own trips" on public.stops;
create policy "Users can update stops for their own trips" on public.stops
  for update using (
    exists (
      select 1 from public.trips
      where trips.id = stops.trip_id
      and trips.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete stops for their own trips" on public.stops;
create policy "Users can delete stops for their own trips" on public.stops
  for delete using (
    exists (
      select 1 from public.trips
      where trips.id = stops.trip_id
      and trips.user_id = auth.uid()
    )
  );

-- Activities Policies
drop policy if exists "Activities are viewable if associated trip is viewable" on public.activities;
create policy "Activities are viewable if associated trip is viewable" on public.activities
  for select using (
    exists (
      select 1 from public.stops
      join public.trips on stops.trip_id = trips.id
      where stops.id = activities.stop_id
      and (trips.user_id = auth.uid() or trips.is_public = true)
    )
  );

drop policy if exists "Users can insert activities for their own stops" on public.activities;
create policy "Users can insert activities for their own stops" on public.activities
  for insert with check (
    exists (
      select 1 from public.stops
      join public.trips on stops.trip_id = trips.id
      where stops.id = activities.stop_id
      and trips.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update activities for their own stops" on public.activities;
create policy "Users can update activities for their own stops" on public.activities
  for update using (
    exists (
      select 1 from public.stops
      join public.trips on stops.trip_id = trips.id
      where stops.id = activities.stop_id
      and trips.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete activities for their own stops" on public.activities;
create policy "Users can delete activities for their own stops" on public.activities
  for delete using (
    exists (
      select 1 from public.stops
      join public.trips on stops.trip_id = trips.id
      where stops.id = activities.stop_id
      and trips.user_id = auth.uid()
    )
  );

-- 7. AUTOMATIC USER PROFILE TRIGGER
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, first_name, last_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

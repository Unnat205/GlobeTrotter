-- Run this in your Supabase SQL Editor to fix RLS and Foreign Key constraints for Simple Auth mode:

-- 1. Disable RLS
alter table public.users disable row level security;
alter table public.trips disable row level security;
alter table public.stops disable row level security;
alter table public.activities disable row level security;

-- 2. Fix Foreign Key constraints so user_id references public.users(id)
alter table public.trips drop constraint if exists trips_user_id_fkey;
alter table public.users drop constraint if exists users_id_fkey;

alter table public.trips add constraint trips_user_id_fkey foreign key (user_id) references public.users(id) on delete cascade;

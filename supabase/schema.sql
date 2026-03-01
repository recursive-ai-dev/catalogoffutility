-- =============================================================
-- CATALOG OF FUTILITY — DATABASE SCHEMA
-- Run this in your Supabase SQL Editor (supabase.com/dashboard)
-- =============================================================

-- Profiles table: one record per authenticated user
create table if not exists public.profiles (
  id            uuid references auth.users on delete cascade primary key,
  username      text,
  created_at    timestamptz default now() not null,
  last_seen_at  timestamptz default now() not null
);

-- Row Level Security
alter table public.profiles enable row level security;

-- Anyone can read profiles (for public leaderboards / shared views)
create policy "Profiles are viewable by everyone."
  on public.profiles for select using (true);

-- Users may only insert their own profile row
create policy "Users can insert own profile."
  on public.profiles for insert with check (auth.uid() = id);

-- Users may only update their own profile row
create policy "Users can update own profile."
  on public.profiles for update using (auth.uid() = id);

-- Auto-create a profile whenever a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    split_part(new.email, '@', 1)
  );
  return new;
end;
$$;

-- Drop trigger if it already exists (safe re-run)
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

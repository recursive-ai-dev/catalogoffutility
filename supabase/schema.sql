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

-- Profile creation is handled client-side via the fetchProfile upsert in
-- src/lib/auth.tsx. The server-side trigger is redundant and was removed to
-- prevent a race between the trigger INSERT and the client UPSERT on signup.
-- These drops are safe no-ops if the trigger was never created.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

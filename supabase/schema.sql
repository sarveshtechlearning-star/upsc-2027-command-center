-- Run this once in your Supabase project's SQL editor.
-- Creates a single key-value table, one JSON blob per tracker, scoped
-- to each signed-in user via Row Level Security so nobody else can
-- read or write your data even though the anon key is public.

create table if not exists public.kv_store (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, key)
);

alter table public.kv_store enable row level security;

create policy "Users can view their own data"
  on public.kv_store for select
  using (auth.uid() = user_id);

create policy "Users can insert their own data"
  on public.kv_store for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own data"
  on public.kv_store for update
  using (auth.uid() = user_id);

create policy "Users can delete their own data"
  on public.kv_store for delete
  using (auth.uid() = user_id);

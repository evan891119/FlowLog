create table if not exists public.tasks (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '',
  status text not null check (status in ('not_started', 'in_progress', 'blocked', 'done')),
  next_action text not null default '',
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  is_today boolean not null default false,
  is_current boolean not null default false,
  sort_order integer not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists tasks_user_id_sort_order_idx on public.tasks (user_id, sort_order);

create table if not exists public.dashboard_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  today_goal text not null default '',
  focus_enabled boolean not null default false,
  focus_duration integer not null default 25,
  focus_last_session_started_at timestamptz null,
  last_viewed_at timestamptz null
);

alter table public.tasks enable row level security;
alter table public.dashboard_settings enable row level security;

create policy "Users can manage their own tasks"
on public.tasks
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage their own dashboard settings"
on public.dashboard_settings
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

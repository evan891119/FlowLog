create table if not exists public.tasks (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '',
  status text not null check (status in ('not_started', 'in_progress', 'blocked', 'done')),
  task_mode text not null default 'next_action' check (task_mode in ('next_action', 'todo_list')),
  next_action text not null default '',
  manual_progress integer not null default 0 check (manual_progress >= 0 and manual_progress <= 100),
  estimated_minutes integer null check (estimated_minutes >= 1),
  elapsed_seconds integer not null default 0 check (elapsed_seconds >= 0),
  current_session_started_at timestamptz null,
  todo_items jsonb not null default '[]'::jsonb,
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  is_today boolean not null default false,
  is_current boolean not null default false,
  sort_order integer not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.tasks add column if not exists task_mode text not null default 'next_action';
alter table public.tasks add column if not exists manual_progress integer not null default 0;
alter table public.tasks add column if not exists estimated_minutes integer null;
alter table public.tasks add column if not exists elapsed_seconds integer not null default 0;
alter table public.tasks add column if not exists current_session_started_at timestamptz null;
alter table public.tasks add column if not exists todo_items jsonb not null default '[]'::jsonb;

alter table public.tasks drop constraint if exists tasks_task_mode_check;
alter table public.tasks add constraint tasks_task_mode_check check (task_mode in ('next_action', 'todo_list'));

alter table public.tasks drop constraint if exists tasks_manual_progress_check;
alter table public.tasks add constraint tasks_manual_progress_check check (manual_progress >= 0 and manual_progress <= 100);

alter table public.tasks drop constraint if exists tasks_estimated_minutes_check;
alter table public.tasks add constraint tasks_estimated_minutes_check check (estimated_minutes is null or estimated_minutes >= 1);

alter table public.tasks drop constraint if exists tasks_elapsed_seconds_check;
alter table public.tasks add constraint tasks_elapsed_seconds_check check (elapsed_seconds >= 0);

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

drop policy if exists "Users can manage their own tasks" on public.tasks;
create policy "Users can manage their own tasks"
on public.tasks
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage their own dashboard settings" on public.dashboard_settings;
create policy "Users can manage their own dashboard settings"
on public.dashboard_settings
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

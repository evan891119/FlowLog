import type { SupabaseClient } from "@supabase/supabase-js";
import { defaultState, getSafeInitialState } from "@/lib/dashboard-state";
import { DashboardState, Task, TaskMode, TaskStatus, TodoItem } from "@/types/dashboard";
import { getTaskProgress } from "@/lib/dashboard-state";

export type TaskRow = {
  id: string;
  user_id: string;
  title: string;
  status: TaskStatus;
  task_mode?: TaskMode | null;
  next_action: string;
  manual_progress?: number | null;
  todo_items?: TodoItem[] | null;
  progress: number;
  is_today: boolean;
  is_current: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type DashboardSettingsRow = {
  user_id: string;
  today_goal: string;
  focus_enabled: boolean;
  focus_duration: number;
  focus_last_session_started_at: string | null;
  last_viewed_at: string | null;
};

function mapTaskRowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    taskMode: row.task_mode ?? "next_action",
    nextAction: row.next_action,
    manualProgress: row.manual_progress ?? row.progress,
    todoItems: Array.isArray(row.todo_items) ? row.todo_items : [],
    isToday: row.is_today,
    isCurrent: row.is_current,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapRowsToDashboardState(taskRows: TaskRow[] = [], settingsRow?: DashboardSettingsRow | null): DashboardState {
  const orderedTaskRows = [...taskRows].sort((a, b) => a.sort_order - b.sort_order);

  return getSafeInitialState({
    todayGoal: settingsRow?.today_goal ?? defaultState.todayGoal,
    tasks: orderedTaskRows.map(mapTaskRowToTask),
    taskOrder: orderedTaskRows.map((row) => row.id),
    focus: {
      enabled: settingsRow?.focus_enabled ?? defaultState.focus.enabled,
      duration: settingsRow?.focus_duration ?? defaultState.focus.duration,
      lastSessionStartedAt: settingsRow?.focus_last_session_started_at ?? defaultState.focus.lastSessionStartedAt,
    },
    lastViewedAt: settingsRow?.last_viewed_at ?? defaultState.lastViewedAt,
  });
}

export function mapDashboardStateToTaskRows(userId: string, state: DashboardState): TaskRow[] {
  const orderIndex = new Map(state.taskOrder.map((taskId, index) => [taskId, index]));

  return state.tasks.map((task) => ({
    id: task.id,
    user_id: userId,
    title: task.title,
    status: task.status,
    task_mode: task.taskMode,
    next_action: task.nextAction,
    manual_progress: task.manualProgress,
    todo_items: task.todoItems,
    progress: getTaskProgress(task),
    is_today: task.isToday,
    is_current: task.isCurrent,
    sort_order: orderIndex.get(task.id) ?? Number.MAX_SAFE_INTEGER,
    created_at: task.createdAt,
    updated_at: task.updatedAt,
  }));
}

export function mapDashboardStateToSettingsRow(
  userId: string,
  state: DashboardState,
  persistedAt = new Date().toISOString(),
): DashboardSettingsRow {
  return {
    user_id: userId,
    today_goal: state.todayGoal,
    focus_enabled: state.focus.enabled,
    focus_duration: state.focus.duration,
    focus_last_session_started_at: state.focus.lastSessionStartedAt,
    last_viewed_at: persistedAt,
  };
}

export async function loadDashboardStateForUser(supabase: SupabaseClient, userId: string) {
  const [tasksResult, settingsResult] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, user_id, title, status, task_mode, next_action, manual_progress, todo_items, progress, is_today, is_current, sort_order, created_at, updated_at")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("dashboard_settings")
      .select("user_id, today_goal, focus_enabled, focus_duration, focus_last_session_started_at, last_viewed_at")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (tasksResult.error) {
    throw tasksResult.error;
  }

  if (settingsResult.error) {
    throw settingsResult.error;
  }

  return mapRowsToDashboardState((tasksResult.data as TaskRow[] | null) ?? [], (settingsResult.data as DashboardSettingsRow | null) ?? null);
}

export async function saveDashboardStateForUser(supabase: SupabaseClient, userId: string, state: DashboardState) {
  const safeState = getSafeInitialState(state);
  const taskRows = mapDashboardStateToTaskRows(userId, safeState);
  const settingsRow = mapDashboardStateToSettingsRow(userId, safeState);

  const existingTasksResult = await supabase.from("tasks").select("id").eq("user_id", userId);

  if (existingTasksResult.error) {
    throw existingTasksResult.error;
  }

  const staleTaskIds = ((existingTasksResult.data as { id: string }[] | null) ?? [])
    .map((task) => task.id)
    .filter((taskId) => !taskRows.some((row) => row.id === taskId));

  const settingsResult = await supabase.from("dashboard_settings").upsert(settingsRow, { onConflict: "user_id" });

  if (settingsResult.error) {
    throw settingsResult.error;
  }

  if (staleTaskIds.length > 0) {
    const deleteResult = await supabase.from("tasks").delete().eq("user_id", userId).in("id", staleTaskIds);

    if (deleteResult.error) {
      throw deleteResult.error;
    }
  }

  if (taskRows.length === 0) {
    return;
  }

  const taskResult = await supabase.from("tasks").upsert(taskRows, { onConflict: "id" });

  if (taskResult.error) {
    throw taskResult.error;
  }
}

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
  estimated_minutes?: number | null;
  elapsed_seconds?: number | null;
  current_session_started_at?: string | null;
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
  focus_duration: number;
  focus_last_session_started_at: string | null;
  last_viewed_at: string | null;
};

export type DashboardMutationRequest =
  | {
      type: "upsert_tasks";
      taskRows: TaskRow[];
    }
  | {
      type: "delete_task";
      taskId: string;
      deletedAt: string;
    }
  | {
      type: "upsert_settings";
      settingsRow: DashboardSettingsRow;
    };

export function mapTaskRowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    taskMode: row.task_mode ?? "next_action",
    nextAction: row.next_action,
    manualProgress: row.manual_progress ?? row.progress,
    estimatedMinutes: row.estimated_minutes ?? null,
    elapsedSeconds: row.elapsed_seconds ?? 0,
    currentSessionStartedAt: row.current_session_started_at ?? null,
    todoItems: Array.isArray(row.todo_items) ? row.todo_items : [],
    isToday: row.is_today,
    isCurrent: row.is_current,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTaskToTaskRow(userId: string, task: Task, sortOrder: number, updatedAt = task.updatedAt): TaskRow {
  return {
    id: task.id,
    user_id: userId,
    title: task.title,
    status: task.status,
    task_mode: task.taskMode,
    next_action: task.nextAction,
    manual_progress: task.manualProgress,
    estimated_minutes: task.estimatedMinutes,
    elapsed_seconds: task.elapsedSeconds,
    current_session_started_at: task.currentSessionStartedAt,
    todo_items: task.todoItems,
    progress: getTaskProgress(task),
    is_today: task.isToday,
    is_current: task.isCurrent,
    sort_order: sortOrder,
    created_at: task.createdAt,
    updated_at: updatedAt,
  };
}

export function mapRowsToDashboardState(taskRows: TaskRow[] = [], settingsRow?: DashboardSettingsRow | null): DashboardState {
  const orderedTaskRows = [...taskRows].sort((a, b) => a.sort_order - b.sort_order);

  return getSafeInitialState({
    todayGoal: settingsRow?.today_goal ?? defaultState.todayGoal,
    tasks: orderedTaskRows.map(mapTaskRowToTask),
    taskOrder: orderedTaskRows.map((row) => row.id),
    focus: {
      duration: settingsRow?.focus_duration ?? defaultState.focus.duration,
      lastSessionStartedAt: settingsRow?.focus_last_session_started_at ?? defaultState.focus.lastSessionStartedAt,
    },
    lastViewedAt: settingsRow?.last_viewed_at ?? defaultState.lastViewedAt,
  });
}

export function mapDashboardStateToTaskRows(userId: string, state: DashboardState): TaskRow[] {
  const orderIndex = new Map(state.taskOrder.map((taskId, index) => [taskId, index]));

  return state.tasks.map((task) => mapTaskToTaskRow(userId, task, orderIndex.get(task.id) ?? Number.MAX_SAFE_INTEGER));
}

export function mapDashboardStateToSettingsRow(
  userId: string,
  state: DashboardState,
  persistedAt = new Date().toISOString(),
): DashboardSettingsRow {
  return {
    user_id: userId,
    today_goal: state.todayGoal,
    focus_duration: state.focus.duration,
    focus_last_session_started_at: state.focus.lastSessionStartedAt,
    last_viewed_at: persistedAt,
  };
}

export async function loadDashboardStateForUser(supabase: SupabaseClient, userId: string) {
  const [tasksResult, settingsResult] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, user_id, title, status, task_mode, next_action, manual_progress, estimated_minutes, elapsed_seconds, current_session_started_at, todo_items, progress, is_today, is_current, sort_order, created_at, updated_at")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("dashboard_settings")
      .select("user_id, today_goal, focus_duration, focus_last_session_started_at, last_viewed_at")
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

function compareIsoTimestamps(left: string | null | undefined, right: string | null | undefined) {
  if (!left && !right) {
    return 0;
  }

  if (!left) {
    return -1;
  }

  if (!right) {
    return 1;
  }

  const leftTimestamp = Date.parse(left);
  const rightTimestamp = Date.parse(right);

  if (Number.isNaN(leftTimestamp) || Number.isNaN(rightTimestamp)) {
    return left.localeCompare(right);
  }

  return leftTimestamp - rightTimestamp;
}

export async function upsertTaskRowsForUser(supabase: SupabaseClient, userId: string, taskRows: TaskRow[]) {
  if (taskRows.length === 0) {
    return;
  }

  const taskIds = taskRows.map((row) => row.id);
  const existingTasksResult = await supabase.from("tasks").select("id, updated_at").eq("user_id", userId).in("id", taskIds);

  if (existingTasksResult.error) {
    throw existingTasksResult.error;
  }

  const existingTaskTimestamps = new Map(
    ((existingTasksResult.data as { id: string; updated_at: string }[] | null) ?? []).map((row) => [row.id, row.updated_at]),
  );
  const freshTaskRows = taskRows.filter((row) => compareIsoTimestamps(row.updated_at, existingTaskTimestamps.get(row.id)) >= 0);

  if (freshTaskRows.length === 0) {
    return;
  }

  const taskResult = await supabase.from("tasks").upsert(freshTaskRows, { onConflict: "id" });

  if (taskResult.error) {
    throw taskResult.error;
  }
}

export async function deleteTaskForUser(supabase: SupabaseClient, userId: string, taskId: string, deletedAt: string) {
  const existingTaskResult = await supabase
    .from("tasks")
    .select("updated_at")
    .eq("user_id", userId)
    .eq("id", taskId)
    .maybeSingle();

  if (existingTaskResult.error) {
    throw existingTaskResult.error;
  }

  const existingTask = existingTaskResult.data as { updated_at: string } | null;

  if (existingTask && compareIsoTimestamps(deletedAt, existingTask.updated_at) < 0) {
    return;
  }

  const deleteResult = await supabase.from("tasks").delete().eq("user_id", userId).eq("id", taskId);

  if (deleteResult.error) {
    throw deleteResult.error;
  }
}

export async function upsertDashboardSettingsForUser(supabase: SupabaseClient, userId: string, settingsRow: DashboardSettingsRow) {
  const existingSettingsResult = await supabase
    .from("dashboard_settings")
    .select("last_viewed_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingSettingsResult.error) {
    throw existingSettingsResult.error;
  }

  const existingSettings = existingSettingsResult.data as { last_viewed_at: string | null } | null;

  if (existingSettings && compareIsoTimestamps(settingsRow.last_viewed_at, existingSettings.last_viewed_at) < 0) {
    return;
  }

  const settingsResult = await supabase.from("dashboard_settings").upsert(settingsRow, { onConflict: "user_id" });

  if (settingsResult.error) {
    throw settingsResult.error;
  }
}

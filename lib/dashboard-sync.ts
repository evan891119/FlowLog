import { getSafeInitialState } from "@/lib/dashboard-state";
import { DashboardSettingsRow, mapTaskRowToTask, TaskRow } from "@/lib/dashboard-cloud";
import { DashboardState } from "@/types/dashboard";

export const DASHBOARD_SYNC_BROADCAST_EVENT = "dashboard_state";

export type DashboardSyncBroadcastPayload = {
  state: DashboardState;
  originClientId: string;
  sentAt: string;
};

function getTaskSignature(state: DashboardState) {
  return state.tasks.map((task) => ({
    id: task.id,
    title: task.title,
    status: task.status,
    taskMode: task.taskMode,
    nextAction: task.nextAction,
    manualProgress: task.manualProgress,
    estimatedMinutes: task.estimatedMinutes,
    elapsedSeconds: task.elapsedSeconds,
    currentSessionStartedAt: task.currentSessionStartedAt,
    todoItems: task.todoItems.map((item) => ({
      id: item.id,
      text: item.text,
      done: item.done,
    })),
    isToday: task.isToday,
    isCurrent: task.isCurrent,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  }));
}

export function createDashboardStateSignature(state: DashboardState) {
  return JSON.stringify({
    todayGoal: state.todayGoal,
    taskOrder: state.taskOrder,
    tasks: getTaskSignature(state),
    focus: {
      duration: state.focus.duration,
      lastSessionStartedAt: state.focus.lastSessionStartedAt,
    },
    lastViewedAt: state.lastViewedAt,
  });
}

export function shouldApplyRemoteDashboardState(currentState: DashboardState, incomingState: DashboardState) {
  return createDashboardStateSignature(currentState) !== createDashboardStateSignature(incomingState);
}

export function isTaskRow(candidate: unknown): candidate is TaskRow {
  if (!candidate || typeof candidate !== "object") {
    return false;
  }

  const row = candidate as Partial<TaskRow>;
  return (
    typeof row.id === "string" &&
    typeof row.user_id === "string" &&
    typeof row.title === "string" &&
    typeof row.status === "string" &&
    typeof row.next_action === "string" &&
    typeof row.progress === "number" &&
    typeof row.is_today === "boolean" &&
    typeof row.is_current === "boolean" &&
    typeof row.sort_order === "number" &&
    typeof row.created_at === "string" &&
    typeof row.updated_at === "string"
  );
}

export function isDashboardSettingsRow(candidate: unknown): candidate is DashboardSettingsRow {
  if (!candidate || typeof candidate !== "object") {
    return false;
  }

  const row = candidate as Partial<DashboardSettingsRow>;
  return (
    typeof row.user_id === "string" &&
    typeof row.today_goal === "string" &&
    typeof row.focus_duration === "number" &&
    (typeof row.focus_last_session_started_at === "string" || row.focus_last_session_started_at === null) &&
    (typeof row.last_viewed_at === "string" || row.last_viewed_at === null)
  );
}

function insertTaskIdAtSortOrder(taskOrder: string[], taskId: string, sortOrder: number) {
  const nextTaskOrder = taskOrder.filter((currentTaskId) => currentTaskId !== taskId);
  const targetIndex = Math.max(0, Math.min(sortOrder, nextTaskOrder.length));

  nextTaskOrder.splice(targetIndex, 0, taskId);
  return nextTaskOrder;
}

function orderTasksByTaskOrder(state: DashboardState) {
  const taskById = new Map(state.tasks.map((task) => [task.id, task]));
  const orderedTasks = state.taskOrder.map((taskId) => taskById.get(taskId)).filter(Boolean);

  return orderedTasks;
}

export function applyTaskUpsertFromRow(state: DashboardState, row: TaskRow) {
  const nextTask = mapTaskRowToTask(row);
  const nextTasks = [...state.tasks.filter((task) => task.id !== row.id), nextTask];
  const nextTaskOrder = insertTaskIdAtSortOrder(state.taskOrder, row.id, row.sort_order);

  return getSafeInitialState({
    ...state,
    tasks: orderTasksByTaskOrder({
      ...state,
      tasks: nextTasks,
      taskOrder: nextTaskOrder,
    }),
    taskOrder: nextTaskOrder,
  });
}

export function applyTaskDeleteFromRow(state: DashboardState, row: Pick<TaskRow, "id">) {
  return getSafeInitialState({
    ...state,
    tasks: state.tasks.filter((task) => task.id !== row.id),
    taskOrder: state.taskOrder.filter((taskId) => taskId !== row.id),
  });
}

export function applyDashboardSettingsFromRow(state: DashboardState, row: DashboardSettingsRow) {
  return getSafeInitialState({
    ...state,
    todayGoal: row.today_goal,
    focus: {
      duration: row.focus_duration,
      lastSessionStartedAt: row.focus_last_session_started_at,
    },
    lastViewedAt: row.last_viewed_at,
  });
}

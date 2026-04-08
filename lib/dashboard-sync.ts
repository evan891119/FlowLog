import { getSafeInitialState } from "@/lib/dashboard-state";
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

export function createDashboardSyncBroadcastPayload(
  state: DashboardState,
  originClientId: string,
  sentAt = new Date().toISOString(),
): DashboardSyncBroadcastPayload {
  return {
    state: getSafeInitialState(state),
    originClientId,
    sentAt,
  };
}

export function parseDashboardSyncBroadcastPayload(payload: unknown): DashboardSyncBroadcastPayload | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const candidate = payload as Partial<DashboardSyncBroadcastPayload>;

  if (typeof candidate.originClientId !== "string" || typeof candidate.sentAt !== "string" || !candidate.state) {
    return null;
  }

  return {
    state: getSafeInitialState(candidate.state),
    originClientId: candidate.originClientId,
    sentAt: candidate.sentAt,
  };
}

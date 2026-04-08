import { DashboardState } from "@/types/dashboard";

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

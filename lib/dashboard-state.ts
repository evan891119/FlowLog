import { DashboardState, Task, TaskStatus } from "@/types/dashboard";

export const STORAGE_KEY = "flowlog.dashboard.v1";

export const defaultState: DashboardState = {
  todayGoal: "",
  tasks: [],
  taskOrder: [],
  focus: {
    enabled: false,
    duration: 25,
    lastSessionStartedAt: null,
  },
  lastViewedAt: null,
};

const VALID_STATUSES: TaskStatus[] = [
  "not_started",
  "in_progress",
  "blocked",
  "done",
];
const NON_CURRENT_STATUSES = new Set<TaskStatus>(["blocked", "done"]);

function nowIso() {
  return new Date().toISOString();
}

function canBeCurrentTask(task: Task) {
  return !NON_CURRENT_STATUSES.has(task.status);
}

function normalizeCurrentTasks(tasks: Task[]) {
  let hasCurrentTask = false;

  return tasks.map((task) => {
    const shouldStayCurrent = task.isCurrent && canBeCurrentTask(task) && !hasCurrentTask;

    if (shouldStayCurrent) {
      hasCurrentTask = true;
    }

    if (task.isCurrent === shouldStayCurrent) {
      return task;
    }

    return {
      ...task,
      isCurrent: shouldStayCurrent,
    };
  });
}

function normalizeTaskOrder(taskOrder: string[], tasks: Task[]) {
  const validTaskIds = new Set(tasks.map((task) => task.id));
  const normalizedOrder: string[] = [];
  const seenTaskIds = new Set<string>();

  for (const taskId of taskOrder) {
    if (!validTaskIds.has(taskId) || seenTaskIds.has(taskId)) {
      continue;
    }

    normalizedOrder.push(taskId);
    seenTaskIds.add(taskId);
  }

  for (const task of tasks) {
    if (seenTaskIds.has(task.id)) {
      continue;
    }

    normalizedOrder.push(task.id);
    seenTaskIds.add(task.id);
  }

  return normalizedOrder;
}

function normalizeDashboardState(state: DashboardState): DashboardState {
  const tasks = normalizeCurrentTasks(state.tasks);

  return {
    ...state,
    tasks,
    taskOrder: normalizeTaskOrder(state.taskOrder, tasks),
  };
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createTask(input?: Partial<Pick<Task, "title" | "nextAction" | "isToday">>): Task {
  const timestamp = nowIso();

  return {
    id: createId(),
    title: input?.title?.trim() || "Untitled task",
    status: "not_started",
    nextAction: input?.nextAction?.trim() || "",
    progress: 0,
    isToday: Boolean(input?.isToday),
    isCurrent: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createTaskInState(state: DashboardState, taskInput?: Partial<Pick<Task, "title" | "nextAction" | "isToday">>) {
  const task = createTask(taskInput);

  return normalizeDashboardState({
    ...state,
    tasks: [task, ...state.tasks],
    taskOrder: [task.id, ...state.taskOrder],
  });
}

export function updateTaskInState(
  state: DashboardState,
  taskId: string,
  updates: Partial<Pick<Task, "title" | "nextAction" | "progress" | "isToday">>,
) {
  return normalizeDashboardState({
    ...state,
    tasks: state.tasks.map((task) => {
      if (task.id !== taskId) return task;

      const nextTitle = updates.title !== undefined ? updates.title.trim() || task.title : task.title;
      const nextAction = updates.nextAction !== undefined ? updates.nextAction : task.nextAction;
      const nextProgress =
        updates.progress !== undefined ? Math.max(0, Math.min(100, Math.round(updates.progress))) : task.progress;
      const nextIsToday = updates.isToday !== undefined ? updates.isToday : task.isToday;

      return {
        ...task,
        title: nextTitle,
        nextAction,
        progress: nextProgress,
        isToday: nextIsToday,
        updatedAt: nowIso(),
      };
    }),
  });
}

export function setTaskStatusInState(state: DashboardState, taskId: string, status: TaskStatus) {
  return normalizeDashboardState({
    ...state,
    tasks: state.tasks.map((task) => {
      if (task.id !== taskId) return task;

      const shouldClearCurrent = NON_CURRENT_STATUSES.has(status);

      return {
        ...task,
        status,
        isCurrent: shouldClearCurrent ? false : task.isCurrent,
        progress: status === "done" ? 100 : task.progress,
        updatedAt: nowIso(),
      };
    }),
  });
}

export function toggleTodayTaskInState(state: DashboardState, taskId: string) {
  return normalizeDashboardState({
    ...state,
    tasks: state.tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            isToday: !task.isToday,
            updatedAt: nowIso(),
          }
        : task,
    ),
  });
}

export function setCurrentTaskInState(state: DashboardState, taskId: string) {
  return normalizeDashboardState({
    ...state,
    tasks: state.tasks.map((task) => {
      if (!canBeCurrentTask(task)) {
        return {
          ...task,
          isCurrent: false,
        };
      }

      return {
        ...task,
        isCurrent: task.id === taskId,
        updatedAt: task.id === taskId || task.isCurrent ? nowIso() : task.updatedAt,
      };
    }),
  });
}

export function updateTodayGoalInState(state: DashboardState, todayGoal: string) {
  return {
    ...state,
    todayGoal,
  };
}

function isTask(candidate: unknown): candidate is Task {
  if (!candidate || typeof candidate !== "object") return false;

  const task = candidate as Record<string, unknown>;

  return (
    typeof task.id === "string" &&
    typeof task.title === "string" &&
    typeof task.nextAction === "string" &&
    typeof task.progress === "number" &&
    typeof task.isToday === "boolean" &&
    typeof task.isCurrent === "boolean" &&
    typeof task.createdAt === "string" &&
    typeof task.updatedAt === "string" &&
    typeof task.status === "string" &&
    VALID_STATUSES.includes(task.status as TaskStatus)
  );
}

export function getSafeInitialState(candidate: unknown): DashboardState {
  if (!candidate || typeof candidate !== "object") return defaultState;

  const input = candidate as Record<string, unknown>;
  const tasks = Array.isArray(input.tasks) ? input.tasks.filter(isTask) : [];
  return normalizeDashboardState({
    todayGoal: typeof input.todayGoal === "string" ? input.todayGoal : "",
    tasks,
    taskOrder: Array.isArray(input.taskOrder)
      ? input.taskOrder.filter((entry): entry is string => typeof entry === "string")
      : tasks.map((task) => task.id),
    focus:
      input.focus && typeof input.focus === "object"
        ? {
            enabled: Boolean((input.focus as Record<string, unknown>).enabled),
            duration:
              typeof (input.focus as Record<string, unknown>).duration === "number"
                ? Number((input.focus as Record<string, unknown>).duration)
                : 25,
            lastSessionStartedAt:
              typeof (input.focus as Record<string, unknown>).lastSessionStartedAt === "string"
                ? ((input.focus as Record<string, unknown>).lastSessionStartedAt as string)
                : null,
          }
        : defaultState.focus,
    lastViewedAt: typeof input.lastViewedAt === "string" ? input.lastViewedAt : null,
  });
}

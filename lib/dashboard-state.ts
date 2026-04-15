import { DashboardState, FocusSettings, Task, TaskMode, TaskStatus, TodoItem } from "@/types/dashboard";

export const defaultState: DashboardState = {
  todayGoal: "",
  tasks: [],
  taskOrder: [],
  focus: {
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
const VALID_TASK_MODES: TaskMode[] = ["next_action", "todo_list"];

function clampProgress(progress: number) {
  return Math.max(0, Math.min(100, Math.round(progress)));
}

function clampEstimatedMinutes(estimatedMinutes: number | null) {
  if (estimatedMinutes === null || Number.isNaN(estimatedMinutes)) {
    return null;
  }

  return Math.max(1, Math.round(estimatedMinutes));
}

function clampElapsedSeconds(elapsedSeconds: number) {
  return Math.max(0, Math.round(elapsedSeconds));
}

function nowIso() {
  return new Date().toISOString();
}

function getElapsedSecondsSince(startedAt: string, now = Date.now()) {
  return Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
}

function pauseTaskTimer(task: Task, timestamp = nowIso()) {
  if (!task.currentSessionStartedAt) {
    return task;
  }

  return {
    ...task,
    elapsedSeconds: clampElapsedSeconds(task.elapsedSeconds + getElapsedSecondsSince(task.currentSessionStartedAt, new Date(timestamp).getTime())),
    currentSessionStartedAt: null,
    updatedAt: timestamp,
  };
}

function startTaskTimer(task: Task, timestamp = nowIso()) {
  if (task.currentSessionStartedAt || task.estimatedMinutes === null) {
    return task;
  }

  return {
    ...task,
    currentSessionStartedAt: timestamp,
    updatedAt: timestamp,
  };
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

function clampFocusDuration(duration: number) {
  return Math.max(1, Math.round(duration));
}

function reorderTaskIds(taskOrder: string[], taskId: string, direction: "up" | "down") {
  const index = taskOrder.indexOf(taskId);

  if (index === -1) {
    return taskOrder;
  }

  const targetIndex = direction === "up" ? index - 1 : index + 1;

  if (targetIndex < 0 || targetIndex >= taskOrder.length) {
    return taskOrder;
  }

  const nextTaskOrder = [...taskOrder];
  const [movedTaskId] = nextTaskOrder.splice(index, 1);
  nextTaskOrder.splice(targetIndex, 0, movedTaskId);

  return nextTaskOrder;
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createTodoItem(text = ""): TodoItem {
  return {
    id: createId(),
    text,
    done: false,
  };
}

function getFirstIncompleteTodo(todoItems: TodoItem[]) {
  return todoItems.find((item) => !item.done)?.text.trim() ?? "";
}

export function getTaskProgress(task: Task) {
  if (task.status === "done") {
    return 100;
  }

  if (task.taskMode === "todo_list") {
    if (task.todoItems.length === 0) {
      return 0;
    }

    const completedCount = task.todoItems.filter((item) => item.done).length;
    return Math.round((completedCount / task.todoItems.length) * 100);
  }

  return clampProgress(task.manualProgress);
}

export function getTaskElapsedSeconds(task: Task, now = Date.now()) {
  if (!task.currentSessionStartedAt) {
    return clampElapsedSeconds(task.elapsedSeconds);
  }

  return clampElapsedSeconds(task.elapsedSeconds + getElapsedSecondsSince(task.currentSessionStartedAt, now));
}

export function getTaskRemainingSeconds(task: Task, now = Date.now()) {
  if (task.estimatedMinutes === null) {
    return null;
  }

  return Math.max(0, task.estimatedMinutes * 60 - getTaskElapsedSeconds(task, now));
}

export function getTaskRemainingRatio(task: Task, now = Date.now()) {
  if (task.estimatedMinutes === null) {
    return null;
  }

  const totalSeconds = Math.max(1, task.estimatedMinutes * 60);
  return Math.max(0, Math.min(1, (getTaskRemainingSeconds(task, now) ?? 0) / totalSeconds));
}

export function createTask(input?: Partial<Pick<Task, "title" | "nextAction" | "isToday">>): Task {
  const timestamp = nowIso();

  return {
    id: createId(),
    title: input?.title?.trim() || "Untitled task",
    status: "not_started",
    taskMode: "next_action",
    nextAction: input?.nextAction?.trim() || "",
    manualProgress: 0,
    estimatedMinutes: null,
    elapsedSeconds: 0,
    currentSessionStartedAt: null,
    todoItems: [],
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
  updates: Partial<Pick<Task, "title" | "nextAction" | "manualProgress" | "estimatedMinutes" | "isToday">>,
) {
  const timestamp = nowIso();

  return normalizeDashboardState({
    ...state,
    tasks: state.tasks.map((task) => {
      if (task.id !== taskId) return task;

      const nextTitle = updates.title !== undefined ? updates.title : task.title;
      const nextAction = updates.nextAction !== undefined ? updates.nextAction : task.nextAction;
      const nextManualProgress =
        updates.manualProgress !== undefined ? clampProgress(updates.manualProgress) : task.manualProgress;
      const nextEstimatedMinutes =
        updates.estimatedMinutes !== undefined ? clampEstimatedMinutes(updates.estimatedMinutes) : task.estimatedMinutes;
      const nextIsToday = updates.isToday !== undefined ? updates.isToday : task.isToday;
      const shouldPauseTimer = nextEstimatedMinutes === null && task.currentSessionStartedAt !== null;
      const shouldStartTimer = nextEstimatedMinutes !== null && task.isCurrent && task.currentSessionStartedAt === null;
      const timerBaseTask = shouldPauseTimer ? pauseTaskTimer(task, timestamp) : task;

      return {
        ...(shouldStartTimer
          ? startTaskTimer(
              {
                ...timerBaseTask,
                estimatedMinutes: nextEstimatedMinutes,
              },
              timestamp,
            )
          : timerBaseTask),
        title: nextTitle,
        nextAction,
        manualProgress: nextManualProgress,
        estimatedMinutes: nextEstimatedMinutes,
        isToday: nextIsToday,
        updatedAt: timestamp,
      };
    }),
  });
}

export function setTaskStatusInState(state: DashboardState, taskId: string, status: TaskStatus) {
  const timestamp = nowIso();

  return normalizeDashboardState({
    ...state,
    tasks: state.tasks.map((task) => {
      if (task.id !== taskId) return task;

      const shouldClearCurrent = NON_CURRENT_STATUSES.has(status);
      const nextTask = shouldClearCurrent ? pauseTaskTimer(task, timestamp) : task;

      return {
        ...nextTask,
        status,
        isCurrent: shouldClearCurrent ? false : task.isCurrent,
        updatedAt: timestamp,
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
  const timestamp = nowIso();
  const isClearingCurrentTask = state.tasks.some((task) => task.id === taskId && task.isCurrent);

  return normalizeDashboardState({
    ...state,
    tasks: state.tasks.map((task) => {
      if (!canBeCurrentTask(task)) {
        return {
          ...pauseTaskTimer(task, timestamp),
          isCurrent: false,
        };
      }

      if (task.id === taskId) {
        if (isClearingCurrentTask) {
          return {
            ...pauseTaskTimer(task, timestamp),
            isCurrent: false,
            updatedAt: timestamp,
          };
        }

        return {
          ...startTaskTimer(
            {
              ...task,
              status: "in_progress",
              isCurrent: true,
            },
            timestamp,
          ),
          status: "in_progress",
          isCurrent: true,
          updatedAt: timestamp,
        };
      }

      return {
        ...pauseTaskTimer(task, timestamp),
        isCurrent: false,
      };
    }),
  });
}

export function deleteTaskInState(state: DashboardState, taskId: string) {
  return normalizeDashboardState({
    ...state,
    tasks: state.tasks.filter((task) => task.id !== taskId),
    taskOrder: state.taskOrder.filter((currentTaskId) => currentTaskId !== taskId),
  });
}

export function moveTaskInState(state: DashboardState, taskId: string, direction: "up" | "down") {
  return normalizeDashboardState({
    ...state,
    taskOrder: reorderTaskIds(state.taskOrder, taskId, direction),
  });
}

export function setTaskModeInState(state: DashboardState, taskId: string, taskMode: TaskMode) {
  return normalizeDashboardState({
    ...state,
    tasks: state.tasks.map((task) => {
      if (task.id !== taskId || task.taskMode === taskMode) {
        return task;
      }

      if (taskMode === "todo_list") {
        const trimmedAction = task.nextAction.trim();
        const nextTodoItems = trimmedAction ? [createTodoItem(trimmedAction)] : [];

        return {
          ...task,
          taskMode,
          todoItems: task.todoItems.length > 0 ? task.todoItems : nextTodoItems,
          updatedAt: nowIso(),
        };
      }

      return {
        ...task,
        taskMode,
        nextAction: getFirstIncompleteTodo(task.todoItems) || task.nextAction,
        updatedAt: nowIso(),
      };
    }),
  });
}

export function addTaskTodoItemInState(state: DashboardState, taskId: string) {
  return normalizeDashboardState({
    ...state,
    tasks: state.tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            todoItems: [...task.todoItems, createTodoItem()],
            updatedAt: nowIso(),
          }
        : task,
    ),
  });
}

export function updateTaskTodoItemInState(state: DashboardState, taskId: string, todoItemId: string, text: string) {
  return normalizeDashboardState({
    ...state,
    tasks: state.tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            todoItems: task.todoItems.map((item) => (item.id === todoItemId ? { ...item, text } : item)),
            updatedAt: nowIso(),
          }
        : task,
    ),
  });
}

export function toggleTaskTodoItemInState(state: DashboardState, taskId: string, todoItemId: string) {
  return normalizeDashboardState({
    ...state,
    tasks: state.tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            todoItems: task.todoItems.map((item) => (item.id === todoItemId ? { ...item, done: !item.done } : item)),
            updatedAt: nowIso(),
          }
        : task,
    ),
  });
}

export function deleteTaskTodoItemInState(state: DashboardState, taskId: string, todoItemId: string) {
  return normalizeDashboardState({
    ...state,
    tasks: state.tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            todoItems: task.todoItems.filter((item) => item.id !== todoItemId),
            updatedAt: nowIso(),
          }
        : task,
    ),
  });
}

export function updateTodayGoalInState(state: DashboardState, todayGoal: string) {
  return {
    ...state,
    todayGoal,
  };
}

export function updateFocusSettingsInState(state: DashboardState, updates: Partial<Pick<FocusSettings, "duration">>) {
  return {
    ...state,
    focus: {
      ...state.focus,
      duration: updates.duration !== undefined ? clampFocusDuration(updates.duration) : state.focus.duration,
    },
  };
}

export function startFocusSessionInState(state: DashboardState) {
  return {
    ...state,
    focus: {
      ...state.focus,
      lastSessionStartedAt: nowIso(),
    },
  };
}

export function stopFocusSessionInState(state: DashboardState) {
  return {
    ...state,
    focus: {
      ...state.focus,
      lastSessionStartedAt: null,
    },
  };
}

function isTask(candidate: unknown): candidate is Task {
  if (!candidate || typeof candidate !== "object") return false;

  const task = candidate as Record<string, unknown>;
  const todoItems = Array.isArray(task.todoItems) ? task.todoItems : [];

  return (
    typeof task.id === "string" &&
    typeof task.title === "string" &&
    typeof task.nextAction === "string" &&
    typeof task.taskMode === "string" &&
    VALID_TASK_MODES.includes(task.taskMode as TaskMode) &&
    typeof task.manualProgress === "number" &&
    (typeof task.estimatedMinutes === "number" || task.estimatedMinutes === null) &&
    typeof task.elapsedSeconds === "number" &&
    (typeof task.currentSessionStartedAt === "string" || task.currentSessionStartedAt === null) &&
    todoItems.every(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof (item as Record<string, unknown>).id === "string" &&
        typeof (item as Record<string, unknown>).text === "string" &&
        typeof (item as Record<string, unknown>).done === "boolean",
    ) &&
    typeof task.isToday === "boolean" &&
    typeof task.isCurrent === "boolean" &&
    typeof task.createdAt === "string" &&
    typeof task.updatedAt === "string" &&
    typeof task.status === "string" &&
    VALID_STATUSES.includes(task.status as TaskStatus)
  );
}

function getString(val: any, fallback: string): string {
  return typeof val === "string" ? val : fallback;
}

function getNumber(val: any, fallback: number): number {
  return typeof val === "number" ? val : fallback;
}

function getBoolean(val: any, fallback: boolean): boolean {
  return typeof val === "boolean" ? val : fallback;
}

export function getSafeInitialState(candidate: unknown): DashboardState {
  if (!candidate || typeof candidate !== "object") return defaultState;

  const input = candidate as Record<string, unknown>;
  const tasks = Array.isArray(input.tasks)
    ? input.tasks
        .map((entry) => {
          if (!entry || typeof entry !== "object") {
            return null;
          }

          const task = entry as Record<string, unknown>;
          const taskMode = VALID_TASK_MODES.includes(task.taskMode as TaskMode) ? (task.taskMode as TaskMode) : "next_action";
          const todoItems = Array.isArray(task.todoItems)
            ? task.todoItems
                .filter((item) => item && typeof item === "object")
                .map((item) => ({
                  id: getString(item, createId()),
                  text: getString(item, ""),
                  done: getBoolean(item, false),
                }))
            : [];

          const safeTask = {
            id: getString(task.id, createId()),
            title: getString(task.title, ""),
            status: VALID_STATUSES.includes(task.status as TaskStatus) ? (task.status as TaskStatus) : "not_started",
            taskMode,
            nextAction: getString(task.nextAction, ""),
            manualProgress:
              typeof task.manualProgress === "number"
                ? clampProgress(task.manualProgress)
                : typeof task.progress === "number"
                  ? clampProgress(task.progress)
                  : 0,
            estimatedMinutes:
              typeof task.estimatedMinutes === "number"
                ? clampEstimatedMinutes(task.estimatedMinutes)
                : typeof task.estimated_minutes === "number"
                  ? clampEstimatedMinutes(task.estimated_minutes)
                  : null,
            elapsedSeconds:
              typeof task.elapsedSeconds === "number"
                ? clampElapsedSeconds(task.elapsedSeconds)
                : typeof task.elapsed_seconds === "number"
                  ? clampElapsedSeconds(task.elapsed_seconds)
                  : 0,
            currentSessionStartedAt:
              typeof task.currentSessionStartedAt === "string"
                ? task.currentSessionStartedAt
                : typeof task.current_session_started_at === "string"
                  ? task.current_session_started_at
                  : null,
            todoItems,
            isToday: getBoolean(task.isToday, false),
            isCurrent: getBoolean(task.isCurrent, false),
            createdAt: getString(task.createdAt, nowIso()),
            updatedAt: getString(task.updatedAt, nowIso()),
          };

          return isTask(safeTask) ? safeTask : null;
        })
        .filter((task): task is Task => Boolean(task))
    : [];
  return normalizeDashboardState({
    todayGoal: getString(input.todayGoal, ""),
    tasks,
    taskOrder: Array.isArray(input.taskOrder)
      ? input.taskOrder.filter((entry): entry is string => typeof entry === "string")
      : tasks.map((task) => task.id),
    focus:
      input.focus && typeof input.focus === "object"
        ? {
            duration: getNumber(input.focus.duration, 25),
            lastSessionStartedAt: getString(input.focus.lastSessionStartedAt, null) as string | null,
          }
        : defaultState.focus,
    lastViewedAt: getString(input.lastViewedAt, null) as string | null,
  });
}

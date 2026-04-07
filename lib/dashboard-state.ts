import { DashboardState, FocusSettings, Task, TaskMode, TaskStatus, TodoItem } from "@/types/dashboard";

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
const VALID_TASK_MODES: TaskMode[] = ["next_action", "todo_list"];

function clampProgress(progress: number) {
  return Math.max(0, Math.min(100, Math.round(progress)));
}

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

export function createTask(input?: Partial<Pick<Task, "title" | "nextAction" | "isToday">>): Task {
  const timestamp = nowIso();

  return {
    id: createId(),
    title: input?.title?.trim() || "Untitled task",
    status: "not_started",
    taskMode: "next_action",
    nextAction: input?.nextAction?.trim() || "",
    manualProgress: 0,
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
  updates: Partial<Pick<Task, "title" | "nextAction" | "manualProgress" | "isToday">>,
) {
  return normalizeDashboardState({
    ...state,
    tasks: state.tasks.map((task) => {
      if (task.id !== taskId) return task;

      const nextTitle = updates.title !== undefined ? updates.title : task.title;
      const nextAction = updates.nextAction !== undefined ? updates.nextAction : task.nextAction;
      const nextManualProgress =
        updates.manualProgress !== undefined ? clampProgress(updates.manualProgress) : task.manualProgress;
      const nextIsToday = updates.isToday !== undefined ? updates.isToday : task.isToday;

      return {
        ...task,
        title: nextTitle,
        nextAction,
        manualProgress: nextManualProgress,
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

export function updateFocusSettingsInState(state: DashboardState, updates: Partial<Pick<FocusSettings, "enabled" | "duration">>) {
  return {
    ...state,
    focus: {
      ...state.focus,
      enabled: updates.enabled ?? state.focus.enabled,
      duration: updates.duration !== undefined ? clampFocusDuration(updates.duration) : state.focus.duration,
    },
  };
}

export function startFocusSessionInState(state: DashboardState) {
  return {
    ...state,
    focus: {
      ...state.focus,
      enabled: true,
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
                  id: typeof (item as Record<string, unknown>).id === "string" ? ((item as Record<string, unknown>).id as string) : createId(),
                  text: typeof (item as Record<string, unknown>).text === "string" ? ((item as Record<string, unknown>).text as string) : "",
                  done: Boolean((item as Record<string, unknown>).done),
                }))
            : [];

          const safeTask = {
            id: typeof task.id === "string" ? task.id : createId(),
            title: typeof task.title === "string" ? task.title : "",
            status: typeof task.status === "string" ? (task.status as TaskStatus) : "not_started",
            taskMode,
            nextAction: typeof task.nextAction === "string" ? task.nextAction : "",
            manualProgress:
              typeof task.manualProgress === "number"
                ? clampProgress(task.manualProgress)
                : typeof task.progress === "number"
                  ? clampProgress(task.progress)
                  : 0,
            todoItems,
            isToday: Boolean(task.isToday),
            isCurrent: Boolean(task.isCurrent),
            createdAt: typeof task.createdAt === "string" ? task.createdAt : nowIso(),
            updatedAt: typeof task.updatedAt === "string" ? task.updatedAt : nowIso(),
          };

          return isTask(safeTask) ? safeTask : null;
        })
        .filter((task): task is Task => Boolean(task))
    : [];
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

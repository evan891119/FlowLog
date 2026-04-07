export type TaskStatus = "not_started" | "in_progress" | "blocked" | "done";
export type TaskMode = "next_action" | "todo_list";

export type TodoItem = {
  id: string;
  text: string;
  done: boolean;
};

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  taskMode: TaskMode;
  nextAction: string;
  manualProgress: number;
  estimatedMinutes: number | null;
  elapsedSeconds: number;
  currentSessionStartedAt: string | null;
  todoItems: TodoItem[];
  isToday: boolean;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FocusSettings = {
  duration: number;
  lastSessionStartedAt: string | null;
};

export type DashboardState = {
  todayGoal: string;
  tasks: Task[];
  taskOrder: string[];
  focus: FocusSettings;
  lastViewedAt: string | null;
};

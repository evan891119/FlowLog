export type TaskStatus = "not_started" | "in_progress" | "blocked" | "done";

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  nextAction: string;
  progress: number;
  isToday: boolean;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FocusSettings = {
  enabled: boolean;
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

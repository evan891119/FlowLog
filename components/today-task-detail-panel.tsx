import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { TaskModeToggle } from "@/components/task-mode-toggle";
import { TaskProgressEditor } from "@/components/task-progress-editor";
import { TaskTimeEstimateEditor } from "@/components/task-time-estimate-editor";
import { TodoListEditor } from "@/components/todo-list-editor";
import { getTaskProgress } from "@/lib/dashboard-state";
import { formatTaskTimeLabel } from "@/lib/task-time";
import { Task, TaskMode, TaskStatus } from "@/types/dashboard";

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "blocked", label: "Blocked" },
  { value: "done", label: "Done" },
];

type TodayTaskDetailPanelProps = {
  task: Task | null;
  onSetCurrent: (taskId: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onToggleToday: (taskId: string) => void;
  onTitleChange: (taskId: string, title: string) => void;
  onNextActionChange: (taskId: string, nextAction: string) => void;
  onTaskModeChange: (taskId: string, taskMode: TaskMode) => void;
  onManualProgressChange: (taskId: string, progress: number) => void;
  onEstimatedMinutesChange: (taskId: string, estimatedMinutes: number | null) => void;
  onAddTodoItem: (taskId: string) => void;
  onUpdateTodoItem: (taskId: string, todoItemId: string, text: string) => void;
  onToggleTodoItem: (taskId: string, todoItemId: string) => void;
  onDeleteTodoItem: (taskId: string, todoItemId: string) => void;
  headerAction?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function TodayTaskDetailPanel({
  task,
  onSetCurrent,
  onStatusChange,
  onToggleToday,
  onTitleChange,
  onNextActionChange,
  onTaskModeChange,
  onManualProgressChange,
  onEstimatedMinutesChange,
  onAddTodoItem,
  onUpdateTodoItem,
  onToggleTodoItem,
  onDeleteTodoItem,
  headerAction,
  className,
  bodyClassName,
}: TodayTaskDetailPanelProps) {
  const progress = task ? getTaskProgress(task) : 0;
  const timeLabel = task ? formatTaskTimeLabel(task) : "No estimate";

  return (
    <section className={`relative overflow-hidden ${className ?? ""}`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex gap-4">
          <div className="pt-1 text-[var(--accent)]" aria-hidden="true">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 19c7-1 11-6 12-14C11 6 7 11 6 19Z" />
              <path d="M6 19c2.5-6 6-10 12-14" />
              <path d="M5 12c-2.8 1.2-4 3.5-4 7 3.8-.5 5.8-2.3 6-5.5" />
            </svg>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.34em] text-[var(--accent)]">Task Detail</h2>
            <p className="mt-1.5 text-sm text-[var(--body)]">
              {task ? "Expanded view for the selected today task." : "Select a task from the today list to inspect it here."}
            </p>
          </div>
        </div>
        <div className="shrink-0">{headerAction}</div>
      </div>

      <div className={bodyClassName ?? ""}>
      {task ? (
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--panel-border)] pb-0">
            <div className="min-w-0 flex-1">
              <input
                className="w-full bg-transparent px-0 py-2 font-serif text-[1.45rem] tracking-tight text-[var(--heading)] outline-none placeholder:text-[var(--muted)]"
                value={task.title}
                onChange={(event) => onTitleChange(task.id, event.target.value)}
                placeholder="Task title"
                aria-label="Task title"
              />
            </div>
            <div className="flex items-center gap-2 pb-2">
              <StatusBadge status={task.status} />
              {task.isCurrent ? <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--body)]">Current</span> : null}
              {task.isToday ? <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--body)]">Today</span> : null}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(15rem,1fr)]">
            <div className="block space-y-3">
              <div>
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Task mode</span>
                <TaskModeToggle value={task.taskMode} onChange={(taskMode) => onTaskModeChange(task.id, taskMode)} />
              </div>

              {task.taskMode === "todo_list" ? (
                <div>
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Todo list</span>
                  <TodoListEditor
                    items={task.todoItems}
                    onAdd={() => onAddTodoItem(task.id)}
                    onToggle={(todoItemId) => onToggleTodoItem(task.id, todoItemId)}
                    onChange={(todoItemId, text) => onUpdateTodoItem(task.id, todoItemId, text)}
                    onDelete={(todoItemId) => onDeleteTodoItem(task.id, todoItemId)}
                  />
                </div>
              ) : (
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Next action</span>
                  <textarea
                    className="min-h-24 w-full rounded-[14px] border border-[var(--panel-border)] bg-transparent px-4 py-3 text-sm text-[var(--heading)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
                    value={task.nextAction}
                    onChange={(event) => onNextActionChange(task.id, event.target.value)}
                    placeholder="Write the next concrete step"
                    aria-label="Task next action"
                  />
                </label>
              )}
            </div>

            <div className="space-y-3 border-l border-[var(--panel-border)] pl-5">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Status</span>
                <select
                  className="w-full rounded-[12px] border border-[var(--panel-border)] bg-transparent px-3 py-2 text-sm text-[var(--heading)] outline-none focus:border-[var(--accent)]"
                  value={task.status}
                  onChange={(event) => onStatusChange(task.id, event.target.value as TaskStatus)}
                  aria-label="Task status"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Progress</span>
                {task.taskMode === "todo_list" ? (
                  <>
                    <div className="overflow-hidden rounded-full bg-[var(--panel-muted)]">
                      <div className="h-2 rounded-full bg-[var(--accent-strong)] transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="mt-1 text-sm text-[var(--body)]">{progress}% from completed checklist items</p>
                  </>
                ) : (
                  <TaskProgressEditor value={progress} onChange={(value) => onManualProgressChange(task.id, value)} />
                )}
              </div>

              <div>
                <TaskTimeEstimateEditor value={task.estimatedMinutes} onChange={(value) => onEstimatedMinutesChange(task.id, value)} />
                <p className="mt-1 text-sm text-[var(--body)]">{timeLabel}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              className="rounded-lg bg-[var(--accent-strong)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:bg-steel disabled:shadow-none"
              onClick={() => onSetCurrent(task.id)}
              disabled={task.status === "blocked" || task.status === "done"}
            >
              {task.isCurrent ? "Pause task" : "Set as current"}
            </button>
            <button
              type="button"
              className="rounded-lg border border-[var(--panel-border)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--heading)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
              onClick={() => onToggleToday(task.id)}
            >
              {task.isToday ? "Remove from today" : "Add to today"}
            </button>
          </div>

          <div className="pointer-events-none absolute bottom-[-1rem] right-0 hidden h-28 w-28 text-[var(--accent)] opacity-35 lg:block" aria-hidden="true">
            <svg viewBox="0 0 160 160" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M76 150c12-46 30-78 58-112" />
              <path d="M95 106c-18-2-29 7-34 25 20 2 31-6 34-25Z" fill="currentColor" fillOpacity="0.25" />
              <path d="M111 78c-16-1-26 7-30 23 18 1 28-7 30-23Z" fill="currentColor" fillOpacity="0.25" />
              <path d="M128 49c-13 3-21 12-22 27 15-3 23-12 22-27Z" fill="currentColor" fillOpacity="0.25" />
              <path d="M69 126c-13-16-29-21-48-13 14 17 30 21 48 13Z" fill="currentColor" fillOpacity="0.22" />
              <path d="M83 98c-12-13-27-17-43-10 13 14 27 18 43 10Z" fill="currentColor" fillOpacity="0.2" />
            </svg>
          </div>
        </div>
      ) : (
        <EmptyState message="Choose a task from the today list to open its full panel." />
      )}
      </div>
    </section>
  );
}

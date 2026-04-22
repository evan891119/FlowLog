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

type TaskCardProps = {
  task: Task;
  variant?: "compact" | "full";
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
  onDelete: (taskId: string) => void;
  onMoveUp: (taskId: string) => void;
  onMoveDown: (taskId: string) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
};

export function TaskCard({
  task,
  variant = "full",
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
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: TaskCardProps) {
  const isCompact = variant === "compact";
  const progress = getTaskProgress(task);
  const timeLabel = formatTaskTimeLabel(task);

  return (
    <article className={`border-b border-[color-mix(in_srgb,var(--panel-border)_72%,var(--heading)_28%)] text-[var(--heading)] ${isCompact ? "py-4" : "py-5"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <input
            className={`w-full border-b border-transparent bg-transparent text-base font-semibold text-[var(--heading)] outline-none ring-0 placeholder:text-[var(--muted)] transition focus:border-[var(--accent)] ${
              isCompact
                ? "px-0 py-2"
                : "px-0 py-2"
            }`}
            value={task.title}
            onChange={(event) => onTitleChange(task.id, event.target.value)}
            placeholder="Task title"
            aria-label="Task title"
          />
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={task.status} />
          {task.isCurrent ? <span className="ui-tag rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]">Current</span> : null}
          {task.isToday ? <span className="ui-tag-soft rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]">Today</span> : null}
        </div>
      </div>

      <div className={`mt-4 grid gap-4 border-t border-[var(--panel-border)] pt-4 ${isCompact ? "md:grid-cols-[minmax(0,3fr)_minmax(14rem,1fr)]" : "md:grid-cols-[minmax(0,3fr)_minmax(15rem,1fr)]"}`}>
        <div className="block space-y-3">
          <div>
            <span className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-steel dark:text-slate-300">Task mode</span>
            <TaskModeToggle value={task.taskMode} onChange={(taskMode) => onTaskModeChange(task.id, taskMode)} />
          </div>

          {task.taskMode === "todo_list" ? (
            <div>
              <span className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-steel dark:text-slate-300">Todo list</span>
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
              <span className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-steel dark:text-slate-300">Next action</span>
              <textarea
                className={`w-full rounded-lg border border-[var(--panel-border)] bg-transparent px-3 py-2 text-sm text-[var(--heading)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)] ${
                  isCompact ? "min-h-14" : "min-h-24"
                }`}
                value={task.nextAction}
                onChange={(event) => onNextActionChange(task.id, event.target.value)}
                placeholder="Write the next concrete step"
                aria-label="Task next action"
              />
            </label>
          )}
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-steel dark:text-slate-300">Status</span>
            <select
              className="w-full rounded-lg border border-[var(--panel-border)] bg-transparent px-3 py-2 text-sm text-[var(--heading)] outline-none focus:border-[var(--accent)]"
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
            <span className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-steel dark:text-slate-300">Progress</span>
            {task.taskMode === "todo_list" ? (
              <>
                <div className="overflow-hidden rounded-full bg-[var(--panel-muted)]">
                  <div className="h-2 rounded-full bg-[var(--accent-strong)] transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-1 text-sm text-steel dark:text-slate-300">{progress}% from completed checklist items</p>
              </>
            ) : (
              <TaskProgressEditor value={progress} onChange={(value) => onManualProgressChange(task.id, value)} />
            )}
          </div>

          <div>
            <TaskTimeEstimateEditor value={task.estimatedMinutes} onChange={(value) => onEstimatedMinutesChange(task.id, value)} />
            <p className="mt-1 text-sm text-steel dark:text-slate-300">{timeLabel}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
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
        {isCompact ? null : (
          <>
            <button
              type="button"
              className="rounded-lg border border-[var(--panel-border)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--heading)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] disabled:cursor-not-allowed disabled:text-steel disabled:hover:border-[var(--panel-border)] disabled:hover:bg-transparent dark:disabled:text-slate-400"
              onClick={() => onMoveUp(task.id)}
              disabled={!canMoveUp}
            >
              Move up
            </button>
            <button
              type="button"
              className="rounded-lg border border-[var(--panel-border)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--heading)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] disabled:cursor-not-allowed disabled:text-steel disabled:hover:border-[var(--panel-border)] disabled:hover:bg-transparent dark:disabled:text-slate-400"
              onClick={() => onMoveDown(task.id)}
              disabled={!canMoveDown}
            >
              Move down
            </button>
            <button
              type="button"
              className="rounded-lg border border-clay/35 bg-transparent px-4 py-2 text-sm font-medium text-clay transition hover:border-clay/60 hover:bg-clay/10 dark:border-clay/30 dark:text-[#f29d84] dark:hover:bg-clay/15"
              onClick={() => onDelete(task.id)}
            >
              Delete
            </button>
          </>
        )}
      </div>
    </article>
  );
}

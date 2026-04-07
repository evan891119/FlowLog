import { EmptyState } from "@/components/empty-state";
import { Section } from "@/components/section";
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
    <Section
      title="Task Detail"
      description={task ? "Expanded view for the selected today task." : "Select a task from the today list to inspect it here."}
      headerAction={headerAction}
      className={className}
      bodyClassName={bodyClassName}
    >
      {task ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <input
                className="dark-surface w-full rounded-2xl bg-mist px-4 py-3 text-xl font-semibold tracking-tight text-ink outline-none placeholder:text-steel/70 dark:border dark:text-white dark:placeholder:text-slate-500"
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

          <div className="grid gap-4 lg:grid-cols-[1fr_170px]">
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
                    className="dark-surface min-h-28 w-full rounded-3xl bg-mist px-4 py-3 text-sm text-ink outline-none placeholder:text-steel/70 dark:border dark:text-white dark:placeholder:text-slate-500"
                    value={task.nextAction}
                    onChange={(event) => onNextActionChange(task.id, event.target.value)}
                    placeholder="Write the next concrete step"
                    aria-label="Task next action"
                  />
                </label>
              )}
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-steel dark:text-slate-300">Status</span>
                <select
                  className="dark-surface w-full rounded-2xl bg-mist px-3 py-2 text-sm text-ink outline-none dark:border dark:text-white"
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
                    <div className="dark-progress-track overflow-hidden rounded-full bg-mist">
                      <div className="h-3 rounded-full bg-forest transition-all" style={{ width: `${progress}%` }} />
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

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="ui-button-current rounded-full px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:bg-steel disabled:shadow-none"
              onClick={() => onSetCurrent(task.id)}
              disabled={task.status === "blocked" || task.status === "done"}
            >
              {task.isCurrent ? "Current task" : "Set as current"}
            </button>
            <button
              type="button"
              className="ui-button-secondary rounded-full px-3.5 py-2 text-sm font-medium"
              onClick={() => onToggleToday(task.id)}
            >
              {task.isToday ? "Remove from today" : "Add to today"}
            </button>
          </div>
        </div>
      ) : (
        <EmptyState message="Choose a task from the today list to open its full panel." />
      )}
    </Section>
  );
}

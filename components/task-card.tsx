import { StatusBadge } from "@/components/status-badge";
import { Task, TaskStatus } from "@/types/dashboard";

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "blocked", label: "Blocked" },
  { value: "done", label: "Done" },
];

type TaskCardProps = {
  task: Task;
  onSetCurrent: (taskId: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onToggleToday: (taskId: string) => void;
  onTitleChange: (taskId: string, title: string) => void;
  onNextActionChange: (taskId: string, nextAction: string) => void;
};

export function TaskCard({
  task,
  onSetCurrent,
  onStatusChange,
  onToggleToday,
  onTitleChange,
  onNextActionChange,
}: TaskCardProps) {
  return (
    <article className="rounded-3xl border border-sand/80 bg-mist/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <input
            className="w-full rounded-xl bg-white px-3 py-2 text-base font-semibold text-ink outline-none ring-0 placeholder:text-steel/70"
            value={task.title}
            onChange={(event) => onTitleChange(task.id, event.target.value)}
            placeholder="Task title"
            aria-label="Task title"
          />
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={task.status} />
          {task.isCurrent ? <span className="rounded-full bg-ink px-2.5 py-1 text-xs font-medium text-white">Current</span> : null}
          {task.isToday ? <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-ink">Today</span> : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_150px]">
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-steel">Next action</span>
          <textarea
            className="min-h-24 w-full rounded-2xl bg-white px-3 py-2 text-sm text-ink outline-none placeholder:text-steel/70"
            value={task.nextAction}
            onChange={(event) => onNextActionChange(task.id, event.target.value)}
            placeholder="Write the next concrete step"
            aria-label="Task next action"
          />
        </label>

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-steel">Status</span>
            <select
              className="w-full rounded-2xl bg-white px-3 py-2 text-sm text-ink outline-none"
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
            <span className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-steel">Progress</span>
            <div className="overflow-hidden rounded-full bg-white">
              <div className="h-3 rounded-full bg-forest transition-all" style={{ width: `${task.progress}%` }} />
            </div>
            <p className="mt-1 text-sm text-steel">{task.progress}%</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-full bg-ink px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-steel"
          onClick={() => onSetCurrent(task.id)}
          disabled={task.status === "blocked" || task.status === "done"}
        >
          {task.isCurrent ? "Current task" : "Set as current"}
        </button>
        <button
          type="button"
          className="rounded-full border border-sand bg-white px-3 py-2 text-sm font-medium text-ink"
          onClick={() => onToggleToday(task.id)}
        >
          {task.isToday ? "Remove from today" : "Add to today"}
        </button>
      </div>
    </article>
  );
}

import { EmptyState } from "@/components/empty-state";
import { Section } from "@/components/section";
import { StatusBadge } from "@/components/status-badge";
import { getTaskRemainingRatio } from "@/lib/dashboard-state";
import { formatTaskTimeLabel } from "@/lib/task-time";
import { Task } from "@/types/dashboard";

type TodayTaskListProps = {
  tasks: Task[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
  action?: React.ReactNode;
  now: number;
};

export function TodayTaskList({ tasks, selectedTaskId, onSelectTask, action, now }: TodayTaskListProps) {
  return (
    <Section
      title="Today Tasks"
      description="Focused work for the current day. Select one to open the full task panel."
      headerAction={action}
      className="h-full"
    >
      {tasks.length ? (
        <div className="relative before:absolute before:bottom-0 before:left-[-0.95rem] before:top-0 before:w-px before:bg-[var(--panel-border)]">
          {tasks.map((task) => {
            const isSelected = task.id === selectedTaskId;
            const remainingRatio = getTaskRemainingRatio(task, now);
            const timeLabel = formatTaskTimeLabel(task, now);

            return (
              <button
                key={task.id}
                type="button"
                className={`relative flex w-full items-center justify-between gap-3 border-b border-[var(--panel-border)] px-4 py-4 text-left transition ${
                  isSelected
                    ? "bg-[linear-gradient(90deg,var(--accent-soft),transparent_58%)] text-[var(--heading)]"
                    : "bg-transparent text-[var(--heading)] hover:bg-[var(--nav-hover)]"
                }`}
                onClick={() => onSelectTask(task.id)}
                aria-pressed={isSelected}
              >
                <span
                  className={`absolute left-[-1.05rem] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border ${
                    isSelected ? "border-[var(--accent)] bg-[var(--accent)]" : "border-[var(--panel-border)] bg-[var(--app-bg)]"
                  }`}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="relative truncate text-sm font-semibold text-[var(--heading)]">
                    {task.title || "Untitled task"}
                  </p>
                  <p
                    className={`relative mt-1 text-xs font-medium uppercase tracking-[0.14em] ${
                      isSelected ? "text-[var(--heading)]" : "text-[var(--muted)]"
                    }`}
                  >
                    {task.isCurrent ? timeLabel : timeLabel}
                  </p>
                  {remainingRatio !== null ? (
                    <div className="relative mt-3 h-px w-32 overflow-hidden bg-[var(--panel-border)]" aria-hidden="true">
                      <span
                        className="absolute inset-y-0 left-0 bg-[var(--accent-strong)]"
                        style={{ width: `${(1 - remainingRatio) * 100}%` }}
                      />
                    </div>
                  ) : null}
                </div>
                <div className="relative shrink-0">
                  <StatusBadge status={task.status} />
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <EmptyState message="No tasks are marked for today. Flag the most important work so this list stays useful." />
      )}
    </Section>
  );
}

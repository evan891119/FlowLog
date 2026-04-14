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
  now?: number;
};

export function TodayTaskList({ tasks, selectedTaskId, onSelectTask, action, now = Date.now() }: TodayTaskListProps) {
  return (
    <Section
      title="Today Tasks"
      description="Focused work for the current day. Select one to open the full task panel."
      headerAction={action}
      className="h-full"
    >
      {tasks.length ? (
        <div className="space-y-2">
          {tasks.map((task) => {
            const isSelected = task.id === selectedTaskId;
            const remainingRatio = getTaskRemainingRatio(task, now);
            const timeLabel = formatTaskTimeLabel(task, now);

            return (
              <button
                key={task.id}
                type="button"
                className={`relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-2xl border px-4 py-3 text-left transition ${
                  isSelected
                    ? "border-clay/30 bg-[rgba(252,247,241,0.98)] text-ink shadow-[0_12px_28px_rgba(194,103,78,0.08)] dark-control-selected dark:text-white"
                    : "border-sand/80 bg-mist/60 text-ink hover:bg-mist dark-control dark:text-white"
                }`}
                onClick={() => onSelectTask(task.id)}
                aria-pressed={isSelected}
              >
                {remainingRatio !== null ? (
                  <span
                    className="pointer-events-none absolute inset-y-0 right-0 rounded-[inherit] bg-[linear-gradient(270deg,rgba(194,103,78,0.18),rgba(222,139,96,0.1))] dark:bg-[linear-gradient(270deg,rgba(194,103,78,0.28),rgba(222,139,96,0.14))]"
                    style={{ width: `${remainingRatio * 100}%` }}
                    aria-hidden="true"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className={`relative truncate text-sm font-semibold ${isSelected ? "text-ink dark:text-white" : "text-ink dark:text-white"}`}>
                    {task.title || "Untitled task"}
                  </p>
                  <p
                    className={`relative mt-1 text-xs font-medium uppercase tracking-[0.14em] ${
                      isSelected ? "text-[rgba(172,98,74,0.9)] dark:text-slate-300" : "text-steel dark:text-slate-300"
                    }`}
                  >
                    {task.isCurrent ? `Current task · ${timeLabel}` : timeLabel}
                  </p>
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

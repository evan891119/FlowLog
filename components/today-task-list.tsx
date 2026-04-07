import { EmptyState } from "@/components/empty-state";
import { Section } from "@/components/section";
import { StatusBadge } from "@/components/status-badge";
import { Task } from "@/types/dashboard";

type TodayTaskListProps = {
  tasks: Task[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
  action?: React.ReactNode;
};

export function TodayTaskList({ tasks, selectedTaskId, onSelectTask, action }: TodayTaskListProps) {
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

            return (
              <button
                key={task.id}
                type="button"
                className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                  isSelected
                    ? "border-ink bg-ink text-white shadow-panel dark-control-selected dark:text-white"
                    : "border-sand/80 bg-mist/60 text-ink hover:bg-mist dark-control dark:text-white"
                }`}
                onClick={() => onSelectTask(task.id)}
                aria-pressed={isSelected}
              >
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-semibold ${isSelected ? "text-white" : "text-ink dark:text-white"}`}>{task.title || "Untitled task"}</p>
                  {task.isCurrent ? (
                    <p className={`mt-1 text-xs font-medium uppercase tracking-[0.14em] ${isSelected ? "text-white/70" : "text-steel dark:text-slate-300"}`}>
                      Current task
                    </p>
                  ) : null}
                </div>
                <div className="shrink-0">
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

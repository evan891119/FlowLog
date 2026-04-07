import { EmptyState } from "@/components/empty-state";
import { Section } from "@/components/section";
import { StatusBadge } from "@/components/status-badge";
import { Task } from "@/types/dashboard";

type CurrentTaskPanelProps = {
  task: Task | null;
  variant?: "default" | "summary";
};

export function CurrentTaskPanel({ task, variant = "default" }: CurrentTaskPanelProps) {
  const isSummary = variant === "summary";

  return (
    <Section
      title="Current Task"
      description="Only one task should be active at a time."
      layout={isSummary ? "fill" : "default"}
      className="dark-current-panel"
    >
      {task ? (
        <div
          className={`dark-current-surface relative overflow-hidden rounded-3xl text-ink shadow-panel border ${
            isSummary ? "flex h-full min-h-0 flex-col px-4 py-4" : "px-5 py-5"
          } dark:text-white`}
        >
          <div className="dark-current-accent absolute inset-x-4 top-0 h-1 rounded-b-full" aria-hidden="true" />
          <div className="flex items-start justify-between gap-3">
            <div className={isSummary ? "min-w-0 space-y-1.5" : "space-y-2"}>
              <p className="dark-current-kicker text-xs font-semibold uppercase tracking-[0.24em]">In focus now</p>
              <h2 className={`font-semibold tracking-tight text-ink/90 ${isSummary ? "line-clamp-2 text-[1.7rem]" : "text-[1.6rem]"} dark:text-white/90`}>
                {task.title}
              </h2>
            </div>
            <StatusBadge status={task.status} />
          </div>
          <div className={`dark-current-inner rounded-2xl border ${isSummary ? "mt-4 min-h-0 flex-1 px-4 py-3" : "mt-6 px-4 py-4"}`}>
            <p className="dark-current-kicker text-sm font-semibold uppercase tracking-[0.18em]">Next action</p>
            <p className={`mt-2 text-base text-ink/90 dark:text-white ${isSummary ? "overflow-hidden leading-6" : "leading-7"}`}>
              {task.nextAction || "Define the next concrete step to make this task resumable."}
            </p>
          </div>
          <div className={`flex items-center justify-between gap-3 text-sm text-ink/70 dark:text-white/80 ${isSummary ? "mt-4" : "mt-5"}`}>
            <span className="dark-current-kicker uppercase tracking-[0.18em]">Progress</span>
            <span>{task.progress}%</span>
          </div>
          <div className="dark-progress-track mt-2 overflow-hidden rounded-full bg-white/15">
            <div className="h-2.5 rounded-full bg-white transition-all" style={{ width: `${task.progress}%` }} />
          </div>
        </div>
      ) : (
        <div className={isSummary ? "flex h-full min-h-0 flex-col" : undefined}>
          <EmptyState message="No current task yet. Pick one active task so FlowLog can anchor your session." />
        </div>
      )}
    </Section>
  );
}

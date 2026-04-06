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
    >
      {task ? (
        <div
          className={`rounded-3xl bg-ink text-white shadow-panel ${
            isSummary ? "flex h-full min-h-0 flex-col px-4 py-4" : "px-5 py-5"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className={isSummary ? "min-w-0 space-y-1.5" : "space-y-2"}>
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-white/60">In focus now</p>
              <h2 className={`font-semibold tracking-tight ${isSummary ? "line-clamp-2 text-xl" : "text-2xl"}`}>{task.title}</h2>
            </div>
            <StatusBadge status={task.status} />
          </div>
          <div className={`rounded-2xl bg-white/8 ${isSummary ? "mt-4 min-h-0 flex-1 px-4 py-3" : "mt-6 px-4 py-4"}`}>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-white/65">Next action</p>
            <p className={`mt-2 text-base ${isSummary ? "overflow-hidden leading-6" : "leading-7"}`}>
              {task.nextAction || "Define the next concrete step to make this task resumable."}
            </p>
          </div>
          <div className={`flex items-center justify-between gap-3 text-sm text-white/80 ${isSummary ? "mt-4" : "mt-5"}`}>
            <span className="uppercase tracking-[0.18em] text-white/65">Progress</span>
            <span>{task.progress}%</span>
          </div>
          <div className="mt-2 overflow-hidden rounded-full bg-white/15">
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

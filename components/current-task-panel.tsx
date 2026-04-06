import { EmptyState } from "@/components/empty-state";
import { Section } from "@/components/section";
import { StatusBadge } from "@/components/status-badge";
import { Task } from "@/types/dashboard";

type CurrentTaskPanelProps = {
  task: Task | null;
};

export function CurrentTaskPanel({ task }: CurrentTaskPanelProps) {
  return (
    <Section title="Current Task" description="Only one task should be active at a time.">
      {task ? (
        <div className="rounded-3xl bg-ink px-5 py-5 text-white shadow-panel">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-white/60">In focus now</p>
              <h2 className="text-2xl font-semibold tracking-tight">{task.title}</h2>
            </div>
            <StatusBadge status={task.status} />
          </div>
          <div className="mt-6 rounded-2xl bg-white/8 px-4 py-4">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-white/65">Next action</p>
            <p className="mt-2 text-base leading-7">{task.nextAction || "Define the next concrete step to make this task resumable."}</p>
          </div>
          <div className="mt-5 flex items-center justify-between gap-3 text-sm text-white/80">
            <span className="uppercase tracking-[0.18em] text-white/65">Progress</span>
            <span>{task.progress}%</span>
          </div>
          <div className="mt-2 overflow-hidden rounded-full bg-white/15">
            <div className="h-2.5 rounded-full bg-white transition-all" style={{ width: `${task.progress}%` }} />
          </div>
        </div>
      ) : (
        <EmptyState message="No current task yet. Pick one active task so FlowLog can anchor your session." />
      )}
    </Section>
  );
}

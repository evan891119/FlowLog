import { EmptyState } from "@/components/empty-state";
import { Section } from "@/components/section";
import { StatusBadge } from "@/components/status-badge";
import { getTaskProgress, getTaskRemainingRatio } from "@/lib/dashboard-state";
import { formatTaskTimeLabel } from "@/lib/task-time";
import { Task } from "@/types/dashboard";

type CurrentTaskPanelProps = {
  task: Task | null;
  variant?: "default" | "summary";
  now: number;
};

export function CurrentTaskPanel({ task, variant = "default", now }: CurrentTaskPanelProps) {
  const isSummary = variant === "summary";
  const progress = task ? getTaskProgress(task) : 0;
  const remainingRatio = task ? getTaskRemainingRatio(task, now) : null;
  const timeLabel = task ? formatTaskTimeLabel(task, now) : "No estimate";
  const elapsedRatio = remainingRatio === null ? null : 1 - remainingRatio;

  return (
    <Section
      title="Current Task"
      description="Only one task should be active at a time."
      layout={isSummary ? "fill" : "default"}
      className="dark-current-panel"
    >
      {task ? (
        <div
          className={`relative overflow-hidden text-[var(--heading)] ${
            isSummary ? "flex h-full min-h-0 flex-col px-0 py-0" : "px-0 py-0"
          }`}
        >
          <div className="relative flex items-start justify-between gap-3">
            <div className={isSummary ? "min-w-0 space-y-1.5" : "space-y-2"}>
              <p className="dark-current-kicker text-xs font-semibold uppercase tracking-[0.24em]">In focus now</p>
              <h2 className={`font-serif tracking-tight text-[var(--heading)] ${isSummary ? "line-clamp-2 text-[1.7rem]" : "text-[1.6rem]"}`}>
                {task.title}
              </h2>
            </div>
            <StatusBadge status={task.status} />
          </div>
          <div className={`relative border-t border-[var(--panel-border)] ${isSummary ? "mt-6 max-h-[min(42vh,24rem)] overflow-y-auto py-5 pr-2" : "mt-6 py-5"}`}>
            <p className="dark-current-kicker text-sm font-semibold uppercase tracking-[0.18em]">
              {task.taskMode === "todo_list" ? "Todo list" : "Next action"}
            </p>
            {task.taskMode === "todo_list" ? (
              <div className={`mt-3 space-y-2 ${isSummary ? "overflow-hidden" : ""}`}>
                {task.todoItems.length ? (
                  task.todoItems.map((item) => (
                    <div key={item.id} className="flex items-start gap-2 text-sm text-[var(--body)]">
                      <span className={`mt-0.5 h-2.5 w-2.5 rounded-full ${item.done ? "bg-[var(--accent)]" : "bg-[var(--accent-strong)]"}`} aria-hidden="true" />
                      <span className={item.done ? "line-through opacity-70" : ""}>{item.text || "Untitled checklist item"}</span>
                    </div>
                  ))
                ) : (
                  <p className={`text-base text-[var(--body)] ${isSummary ? "overflow-hidden leading-6" : "leading-7"}`}>
                    Add checklist items to break this task into resumable steps.
                  </p>
                )}
              </div>
            ) : (
              <p className={`mt-2 text-base text-[var(--body)] ${isSummary ? "overflow-hidden leading-6" : "leading-7"}`}>
                {task.nextAction || "Define the next concrete step to make this task resumable."}
              </p>
            )}
          </div>
          {elapsedRatio !== null ? (
            <div className="relative mt-5">
              <div className="flex items-center justify-between gap-3 text-sm text-[var(--body)]">
                <span className="dark-current-kicker uppercase tracking-[0.18em]">Time elapsed</span>
                <span>{timeLabel}</span>
              </div>
              <div className="relative mt-2 h-px overflow-hidden bg-[var(--panel-border)]" aria-hidden="true">
                <div className="absolute inset-y-0 left-0 bg-[var(--accent-strong)] transition-all" style={{ width: `${elapsedRatio * 100}%` }} />
              </div>
            </div>
          ) : null}
          <div className={`relative flex items-center justify-between gap-3 text-sm text-[var(--body)] ${isSummary ? "mt-5" : "mt-5"}`}>
            <span className="dark-current-kicker uppercase tracking-[0.18em]">Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="relative mt-2 h-px overflow-hidden bg-[var(--panel-border)]">
            <div className="absolute inset-y-0 left-0 bg-[var(--accent-strong)] transition-all" style={{ width: `${progress}%` }} />
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

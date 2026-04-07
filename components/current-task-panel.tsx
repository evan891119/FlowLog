import { EmptyState } from "@/components/empty-state";
import { Section } from "@/components/section";
import { StatusBadge } from "@/components/status-badge";
import { getTaskProgress, getTaskRemainingRatio } from "@/lib/dashboard-state";
import { formatTaskTimeLabel } from "@/lib/task-time";
import { Task } from "@/types/dashboard";

type CurrentTaskPanelProps = {
  task: Task | null;
  variant?: "default" | "summary";
  now?: number;
};

export function CurrentTaskPanel({ task, variant = "default", now = Date.now() }: CurrentTaskPanelProps) {
  const isSummary = variant === "summary";
  const progress = task ? getTaskProgress(task) : 0;
  const remainingRatio = task ? getTaskRemainingRatio(task, now) : null;
  const timeLabel = task ? formatTaskTimeLabel(task, now) : "No estimate";

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
          {remainingRatio !== null ? (
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              <div
                className="absolute inset-x-0 bottom-0 bg-[linear-gradient(0deg,rgba(194,103,78,0.18),rgba(222,139,96,0.1))] dark:bg-[linear-gradient(0deg,rgba(194,103,78,0.28),rgba(222,139,96,0.12))]"
                style={{ height: `${remainingRatio * 100}%` }}
              />
            </div>
          ) : null}
          <div className="dark-current-accent absolute inset-x-4 top-0 h-1 rounded-b-full" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-3">
            <div className={isSummary ? "min-w-0 space-y-1.5" : "space-y-2"}>
              <p className="dark-current-kicker text-xs font-semibold uppercase tracking-[0.24em]">In focus now</p>
              <h2 className={`font-semibold tracking-tight text-ink/90 ${isSummary ? "line-clamp-2 text-[1.7rem]" : "text-[1.6rem]"} dark:text-white/90`}>
                {task.title}
              </h2>
            </div>
            <StatusBadge status={task.status} />
          </div>
          <div className={`dark-current-inner relative rounded-2xl border ${isSummary ? "mt-4 min-h-0 flex-1 px-4 py-3" : "mt-6 px-4 py-4"}`}>
            <p className="dark-current-kicker text-sm font-semibold uppercase tracking-[0.18em]">
              {task.taskMode === "todo_list" ? "Todo list" : "Next action"}
            </p>
            {task.taskMode === "todo_list" ? (
              <div className={`mt-3 space-y-2 ${isSummary ? "overflow-hidden" : ""}`}>
                {task.todoItems.length ? (
                  task.todoItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-start gap-2 text-sm text-ink/90 dark:text-white">
                      <span className={`mt-0.5 h-2.5 w-2.5 rounded-full ${item.done ? "bg-forest" : "bg-clay/70"}`} aria-hidden="true" />
                      <span className={item.done ? "line-through opacity-70" : ""}>{item.text || "Untitled checklist item"}</span>
                    </div>
                  ))
                ) : (
                  <p className={`text-base text-ink/90 dark:text-white ${isSummary ? "overflow-hidden leading-6" : "leading-7"}`}>
                    Add checklist items to break this task into resumable steps.
                  </p>
                )}
                {task.todoItems.length > 3 ? (
                  <p className="text-sm text-ink/60 dark:text-white/70">{task.todoItems.length - 3} more items</p>
                ) : null}
              </div>
            ) : (
              <p className={`mt-2 text-base text-ink/90 dark:text-white ${isSummary ? "overflow-hidden leading-6" : "leading-7"}`}>
                {task.nextAction || "Define the next concrete step to make this task resumable."}
              </p>
            )}
          </div>
          <div className={`relative flex items-center justify-between gap-3 text-sm text-ink/70 dark:text-white/80 ${isSummary ? "mt-4" : "mt-5"}`}>
            <span className="dark-current-kicker uppercase tracking-[0.18em]">Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="dark-progress-track relative mt-2 overflow-hidden rounded-full bg-white/15">
            <div className="h-2.5 rounded-full bg-white transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="relative mt-3 flex items-center justify-between gap-3 text-sm text-ink/70 dark:text-white/80">
            <span className="dark-current-kicker uppercase tracking-[0.18em]">Time</span>
            <span>{timeLabel}</span>
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

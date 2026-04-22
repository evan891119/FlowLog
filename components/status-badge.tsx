import { TaskStatus } from "@/types/dashboard";

const STATUS_STYLES: Record<TaskStatus, string> = {
  not_started: "ui-tag-soft",
  in_progress: "bg-[var(--accent-soft)] text-[var(--heading)] shadow-none",
  blocked: "bg-[rgba(216,165,114,0.2)] text-[var(--heading)] shadow-none",
  done: "bg-[var(--panel-muted)] text-[var(--muted)] shadow-none",
};

type StatusBadgeProps = {
  status: TaskStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.01em] ${STATUS_STYLES[status]}`}>{status.replace("_", " ")}</span>;
}

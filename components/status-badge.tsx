import { TaskStatus } from "@/types/dashboard";

const STATUS_STYLES: Record<TaskStatus, string> = {
  not_started: "ui-tag-soft",
  in_progress: "border border-forest/20 bg-forest/90 text-white shadow-none",
  blocked: "border border-clay/20 bg-clay/92 text-white shadow-none",
  done: "border border-steel/20 bg-steel/92 text-white shadow-none",
};

type StatusBadgeProps = {
  status: TaskStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.01em] ${STATUS_STYLES[status]}`}>{status.replace("_", " ")}</span>;
}

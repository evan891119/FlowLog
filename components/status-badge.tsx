import { TaskStatus } from "@/types/dashboard";

const STATUS_STYLES: Record<TaskStatus, string> = {
  not_started: "bg-sand text-ink dark:border dark:border-white/10 dark:bg-[#273240] dark:text-slate-100",
  in_progress: "bg-forest text-white",
  blocked: "bg-clay text-white",
  done: "bg-steel text-white dark:border dark:border-white/10 dark:bg-[#334155] dark:text-slate-100",
};

type StatusBadgeProps = {
  status: TaskStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}>{status.replace("_", " ")}</span>;
}

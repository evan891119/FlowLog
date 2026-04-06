import { TaskStatus } from "@/types/dashboard";

const STATUS_STYLES: Record<TaskStatus, string> = {
  not_started: "bg-sand text-ink",
  in_progress: "bg-forest text-white",
  blocked: "bg-clay text-white",
  done: "bg-steel text-white",
};

type StatusBadgeProps = {
  status: TaskStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}>{status.replace("_", " ")}</span>;
}

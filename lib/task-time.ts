import { getTaskRemainingSeconds } from "@/lib/dashboard-state";
import { Task } from "@/types/dashboard";

export function formatTaskTimeLabel(task: Task, now = Date.now()) {
  const remainingSeconds = getTaskRemainingSeconds(task, now);

  if (remainingSeconds === null) {
    return "No estimate";
  }

  if (remainingSeconds === 0) {
    return "Time up";
  }

  if (remainingSeconds >= 3600) {
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    return `${hours}:${minutes} left`;
  }

  if (remainingSeconds >= 60) {
    return `${Math.ceil(remainingSeconds / 60)}m left`;
  }

  return `00:${remainingSeconds.toString().padStart(2, "0")} left`;
}

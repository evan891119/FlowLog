import { EmptyState } from "@/components/empty-state";
import { Section } from "@/components/section";
import { TaskCard } from "@/components/task-card";
import { Task, TaskStatus } from "@/types/dashboard";

type TaskListSectionProps = {
  title: string;
  description: string;
  tasks: Task[];
  emptyMessage: string;
  variant?: "compact" | "full";
  visibleCount?: number;
  mobileVisibleCount?: number;
  overflowMessage?: (hiddenCount: number) => string;
  action?: React.ReactNode;
  className?: string;
  onSetCurrent: (taskId: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onToggleToday: (taskId: string) => void;
  onTitleChange: (taskId: string, title: string) => void;
  onNextActionChange: (taskId: string, nextAction: string) => void;
  onDelete: (taskId: string) => void;
  onMoveUp: (taskId: string) => void;
  onMoveDown: (taskId: string) => void;
  canMoveUp: (taskId: string) => boolean;
  canMoveDown: (taskId: string) => boolean;
};

export function TaskListSection({
  title,
  description,
  tasks,
  emptyMessage,
  variant = "full",
  visibleCount,
  mobileVisibleCount,
  overflowMessage,
  action,
  className,
  onSetCurrent,
  onStatusChange,
  onToggleToday,
  onTitleChange,
  onNextActionChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: TaskListSectionProps) {
  const desktopCount = visibleCount ?? tasks.length;
  const mobileCount = mobileVisibleCount ?? desktopCount;
  const visibleTasks = tasks.slice(0, desktopCount);
  const hiddenCount = Math.max(0, tasks.length - desktopCount);

  return (
    <Section title={title} description={description} headerAction={action} className={className}>
      <div className="space-y-3">
        {tasks.length ? (
          <>
            {visibleTasks.map((task, index) => (
              <div key={task.id} className={index >= mobileCount ? "hidden md:block" : undefined}>
                <TaskCard
                  task={task}
                  variant={variant}
                  onSetCurrent={onSetCurrent}
                  onStatusChange={onStatusChange}
                  onToggleToday={onToggleToday}
                  onTitleChange={onTitleChange}
                  onNextActionChange={onNextActionChange}
                  onDelete={onDelete}
                  onMoveUp={onMoveUp}
                  onMoveDown={onMoveDown}
                  canMoveUp={canMoveUp(task.id)}
                  canMoveDown={canMoveDown(task.id)}
                />
              </div>
            ))}
            {hiddenCount > 0 && overflowMessage ? (
              <p className="rounded-2xl border border-dashed border-sand bg-white/70 px-4 py-3 text-sm font-medium text-steel">
                {overflowMessage(hiddenCount)}
              </p>
            ) : null}
          </>
        ) : (
          <EmptyState message={emptyMessage} />
        )}
      </div>
    </Section>
  );
}

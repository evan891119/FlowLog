import { EmptyState } from "@/components/empty-state";
import { Section } from "@/components/section";
import { TaskCard } from "@/components/task-card";
import { Task, TaskMode, TaskStatus } from "@/types/dashboard";

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
  onTaskModeChange: (taskId: string, taskMode: TaskMode) => void;
  onManualProgressChange: (taskId: string, progress: number) => void;
  onEstimatedMinutesChange: (taskId: string, estimatedMinutes: number | null) => void;
  onAddTodoItem: (taskId: string) => void;
  onUpdateTodoItem: (taskId: string, todoItemId: string, text: string) => void;
  onToggleTodoItem: (taskId: string, todoItemId: string) => void;
  onDeleteTodoItem: (taskId: string, todoItemId: string) => void;
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
  onTaskModeChange,
  onManualProgressChange,
  onEstimatedMinutesChange,
  onAddTodoItem,
  onUpdateTodoItem,
  onToggleTodoItem,
  onDeleteTodoItem,
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
                  onTaskModeChange={onTaskModeChange}
                  onManualProgressChange={onManualProgressChange}
                  onEstimatedMinutesChange={onEstimatedMinutesChange}
                  onAddTodoItem={onAddTodoItem}
                  onUpdateTodoItem={onUpdateTodoItem}
                  onToggleTodoItem={onToggleTodoItem}
                  onDeleteTodoItem={onDeleteTodoItem}
                  onDelete={onDelete}
                  onMoveUp={onMoveUp}
                  onMoveDown={onMoveDown}
                  canMoveUp={canMoveUp(task.id)}
                  canMoveDown={canMoveDown(task.id)}
                />
              </div>
            ))}
            {hiddenCount > 0 && overflowMessage ? (
              <p className="dark-surface-muted rounded-2xl border border-dashed border-sand bg-white/70 px-4 py-3 text-sm font-medium text-steel dark:text-slate-300">
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

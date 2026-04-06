import { EmptyState } from "@/components/empty-state";
import { Section } from "@/components/section";
import { TaskCard } from "@/components/task-card";
import { Task, TaskStatus } from "@/types/dashboard";

type TaskListSectionProps = {
  title: string;
  description: string;
  tasks: Task[];
  emptyMessage: string;
  onSetCurrent: (taskId: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onToggleToday: (taskId: string) => void;
  onTitleChange: (taskId: string, title: string) => void;
  onNextActionChange: (taskId: string, nextAction: string) => void;
};

export function TaskListSection({
  title,
  description,
  tasks,
  emptyMessage,
  onSetCurrent,
  onStatusChange,
  onToggleToday,
  onTitleChange,
  onNextActionChange,
}: TaskListSectionProps) {
  return (
    <Section title={title} description={description}>
      <div className="space-y-3">
        {tasks.length ? (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onSetCurrent={onSetCurrent}
              onStatusChange={onStatusChange}
              onToggleToday={onToggleToday}
              onTitleChange={onTitleChange}
              onNextActionChange={onNextActionChange}
            />
          ))
        ) : (
          <EmptyState message={emptyMessage} />
        )}
      </div>
    </Section>
  );
}

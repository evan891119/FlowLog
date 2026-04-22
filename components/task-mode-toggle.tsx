import { TaskMode } from "@/types/dashboard";

type TaskModeToggleProps = {
  value: TaskMode;
  onChange: (taskMode: TaskMode) => void;
};

const TASK_MODE_OPTIONS: { value: TaskMode; label: string }[] = [
  { value: "next_action", label: "Next Action" },
  { value: "todo_list", label: "Todo List" },
];

export function TaskModeToggle({ value, onChange }: TaskModeToggleProps) {
  return (
    <div className="inline-flex border-b border-[var(--panel-border)]">
      {TASK_MODE_OPTIONS.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            className={`relative flex items-center gap-2 px-3 py-2 text-sm font-medium transition ${
              isActive ? "text-[var(--heading)]" : "text-[var(--body)]"
            }`}
            onClick={() => onChange(option.value)}
            aria-pressed={isActive}
          >
            <span className="text-[var(--accent)]" aria-hidden="true">
              {option.value === "next_action" ? "↯" : "☷"}
            </span>
            {option.label}
            {isActive ? <span className="absolute inset-x-0 bottom-[-1px] h-0.5 bg-[var(--accent)]" aria-hidden="true" /> : null}
          </button>
        );
      })}
    </div>
  );
}

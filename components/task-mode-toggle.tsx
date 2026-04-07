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
    <div className="dark-control-soft inline-flex rounded-full border border-sand/80 bg-white/80 p-1">
      {TASK_MODE_OPTIONS.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] transition ${
              isActive ? "bg-ink text-white shadow-sm dark-control-selected" : "text-steel dark:text-slate-300"
            }`}
            onClick={() => onChange(option.value)}
            aria-pressed={isActive}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

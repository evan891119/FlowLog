type TaskProgressEditorProps = {
  value: number;
  onChange: (value: number) => void;
};

const PROGRESS_STEPS = [0, 25, 50, 75, 100];

export function TaskProgressEditor({ value, onChange }: TaskProgressEditorProps) {
  return (
    <div>
      <div className="dark-progress-track overflow-hidden rounded-full bg-white">
        <div className="h-3 rounded-full bg-forest transition-all" style={{ width: `${value}%` }} />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <input
          className="accent-forest h-2 w-full cursor-pointer"
          type="range"
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-label="Manual progress"
        />
        <span className="min-w-11 text-right text-sm text-steel dark:text-slate-300">{value}%</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {PROGRESS_STEPS.map((step) => {
          const isActive = step === value;

          return (
            <button
              key={step}
              type="button"
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                isActive
                  ? "border-forest bg-forest text-white"
                  : "border-sand/80 bg-white/80 text-steel dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300"
              }`}
              onClick={() => onChange(step)}
            >
              {step}%
            </button>
          );
        })}
      </div>
    </div>
  );
}

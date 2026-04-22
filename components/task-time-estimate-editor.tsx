type TaskTimeEstimateEditorProps = {
  value: number | null;
  onChange: (value: number | null) => void;
};

export function TaskTimeEstimateEditor({ value, onChange }: TaskTimeEstimateEditorProps) {
  return (
    <div className="flex items-end gap-2">
      <label className="block flex-1">
        <span className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-steel dark:text-slate-300">Estimated time</span>
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel dark:text-slate-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 8v5l3 2" />
            <circle cx="12" cy="12" r="9" />
          </svg>
          <input
            className="w-full rounded-[14px] border border-[var(--panel-border)] bg-transparent px-3 py-2 pl-9 text-sm text-ink outline-none transition focus:border-[var(--accent)] dark:text-white"
            type="number"
            min={1}
            step={1}
            value={value ?? ""}
            onChange={(event) => {
              const nextValue = event.target.value.trim();
              onChange(nextValue ? Number(nextValue) : null);
            }}
            placeholder="Minutes"
            aria-label="Estimated time in minutes"
          />
        </div>
      </label>
      <button
        type="button"
        className="rounded-[14px] border border-[var(--panel-border)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--heading)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] disabled:cursor-not-allowed disabled:text-[var(--muted)] disabled:hover:border-[var(--panel-border)] disabled:hover:bg-transparent"
        onClick={() => onChange(null)}
        disabled={value === null}
      >
        Clear
      </button>
    </div>
  );
}

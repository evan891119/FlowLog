type TaskTimeEstimateEditorProps = {
  value: number | null;
  onChange: (value: number | null) => void;
};

export function TaskTimeEstimateEditor({ value, onChange }: TaskTimeEstimateEditorProps) {
  return (
    <div className="flex items-end gap-2">
      <label className="block flex-1">
        <span className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-steel dark:text-slate-300">Estimated time</span>
        <input
          className="dark-surface w-full rounded-2xl bg-white px-3 py-2 text-sm text-ink outline-none dark:border dark:text-white"
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
      </label>
      <button
        type="button"
        className="ui-button-secondary rounded-full px-3 py-2 text-sm font-medium"
        onClick={() => onChange(null)}
        disabled={value === null}
      >
        Clear
      </button>
    </div>
  );
}

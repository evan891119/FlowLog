type TaskProgressEditorProps = {
  value: number;
  onChange: (value: number) => void;
};

export function TaskProgressEditor({ value, onChange }: TaskProgressEditorProps) {
  return (
    <div>
      <div className="flex items-center gap-3">
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
    </div>
  );
}

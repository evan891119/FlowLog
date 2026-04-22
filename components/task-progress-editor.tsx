type TaskProgressEditorProps = {
  value: number;
  onChange: (value: number) => void;
};

export function TaskProgressEditor({ value, onChange }: TaskProgressEditorProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-5 flex-1">
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-[#1b2431]">
          <div className="h-full rounded-full bg-[#8f7cff] transition-all" style={{ width: `${value}%` }} />
        </div>
        <input
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          type="range"
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-label="Manual progress"
        />
      </div>
      <span className="min-w-11 text-right text-sm text-steel dark:text-slate-300">{value}%</span>
    </div>
  );
}

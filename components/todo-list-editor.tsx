import { TodoItem } from "@/types/dashboard";

type TodoListEditorProps = {
  items: TodoItem[];
  onAdd: () => void;
  onToggle: (todoItemId: string) => void;
  onChange: (todoItemId: string, text: string) => void;
  onDelete: (todoItemId: string) => void;
};

export function TodoListEditor({ items, onAdd, onToggle, onChange, onDelete }: TodoListEditorProps) {
  return (
    <div className="space-y-3">
      {items.length ? (
        items.map((item, index) => (
          <div key={item.id} className="dark-surface flex items-start gap-3 rounded-2xl border bg-white/80 px-3 py-3">
            <input
              className="mt-1 h-4 w-4 shrink-0 accent-forest"
              type="checkbox"
              checked={item.done}
              onChange={() => onToggle(item.id)}
              aria-label={`Toggle todo item ${index + 1}`}
            />
            <input
              className={`w-full bg-transparent text-sm outline-none placeholder:text-steel/70 dark:text-white dark:placeholder:text-slate-500 ${
                item.done ? "text-steel line-through dark:text-slate-400" : "text-ink"
              }`}
              value={item.text}
              onChange={(event) => onChange(item.id, event.target.value)}
              placeholder={`Todo item ${index + 1}`}
              aria-label={`Todo item ${index + 1}`}
            />
            <button
              type="button"
              className="shrink-0 rounded-full border border-clay/25 bg-clay/10 px-2.5 py-1 text-xs font-semibold text-clay dark:border-clay/30 dark:bg-clay/15 dark:text-[#f29d84]"
              onClick={() => onDelete(item.id)}
            >
              Remove
            </button>
          </div>
        ))
      ) : (
        <p className="rounded-2xl border border-dashed border-sand/80 px-4 py-3 text-sm text-steel dark:border-slate-700 dark:text-slate-300">
          No checklist items yet. Add one to make progress automatic.
        </p>
      )}

      <button type="button" className="ui-button-secondary rounded-full px-3.5 py-2 text-sm font-medium" onClick={onAdd}>
        Add item
      </button>
    </div>
  );
}

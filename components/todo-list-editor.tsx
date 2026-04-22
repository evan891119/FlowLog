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
        <div className="scrollbar-none max-h-64 space-y-3 overflow-y-auto overscroll-contain">
          {items.map((item, index) => (
            <div key={item.id} className="flex min-h-16 items-center gap-4 rounded-lg border border-[var(--panel-border)] bg-transparent px-5 py-4">
              <button
                type="button"
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px] border transition focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] ${
                  item.done ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[#4b5666] bg-transparent text-transparent"
                }`}
                onClick={() => onToggle(item.id)}
                aria-pressed={item.done}
                aria-label={`Toggle todo item ${index + 1}`}
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3.5 8.2 6.6 11 12.5 5" />
                </svg>
              </button>
              <input
                className={`min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-steel/70 dark:placeholder:text-slate-500 ${
                  item.done ? "text-steel line-through dark:text-slate-400" : "text-ink dark:text-[#f4f1eb]"
                }`}
                value={item.text}
                onChange={(event) => onChange(item.id, event.target.value)}
                placeholder={`Todo item ${index + 1}`}
                aria-label={`Todo item ${index + 1}`}
              />
              <button
                type="button"
                className="flex shrink-0 items-center gap-2 text-sm font-medium text-clay transition hover:text-[#ef8f78] dark:text-[#d97970] dark:hover:text-[#f19a85]"
                onClick={() => onDelete(item.id)}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 6h18" />
                  <path d="M8 6V4h8v2" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v5" />
                  <path d="M14 11v5" />
                </svg>
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-[var(--panel-border)] px-5 py-4 text-sm text-steel dark:text-slate-300">
          No checklist items yet. Add one to make progress automatic.
        </p>
      )}

      <button
        type="button"
        className="flex min-h-14 w-full items-center gap-3 rounded-lg border border-dashed border-[#5f5190] bg-transparent px-5 py-3 text-left text-sm font-medium text-[var(--accent)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
        onClick={onAdd}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-current text-base leading-none" aria-hidden="true">
          +
        </span>
        Add item
      </button>
    </div>
  );
}

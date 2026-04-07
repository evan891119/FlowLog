type EmptyStateProps = {
  message: string;
};

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="dark-surface-muted rounded-2xl border border-dashed border-sand bg-mist/50 px-4 py-6 text-sm text-steel dark:text-slate-300">
      {message}
    </div>
  );
}

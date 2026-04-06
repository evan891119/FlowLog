type EmptyStateProps = {
  message: string;
};

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-sand bg-mist/50 px-4 py-6 text-sm text-steel">
      {message}
    </div>
  );
}

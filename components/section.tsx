type SectionProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function Section({ title, description, children }: SectionProps) {
  return (
    <section className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-panel backdrop-blur">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        {description ? <p className="mt-1 text-sm text-steel">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

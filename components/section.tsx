type SectionProps = {
  title: string;
  description?: string;
  headerAction?: React.ReactNode;
  hideHeader?: boolean;
  layout?: "default" | "fill";
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
};

export function Section({ title, description, headerAction, hideHeader = false, layout = "default", className, bodyClassName, children }: SectionProps) {
  const isFill = layout === "fill";

  return (
    <section
      className={`border-t border-[var(--panel-border)] bg-transparent pt-6 ${
        isFill ? "flex h-full flex-col" : ""
      } ${
        className ?? ""
      }`}
    >
      {hideHeader ? null : (
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">{title}</h2>
            {description ? <p className="mt-2 text-sm text-[var(--body)]">{description}</p> : null}
          </div>
          {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
        </div>
      )}
      <div className={`${isFill ? "min-h-0 flex-1" : ""} ${bodyClassName ?? ""}`}>{children}</div>
    </section>
  );
}

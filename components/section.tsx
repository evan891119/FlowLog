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
      className={`dark-panel rounded-lg border border-[var(--panel-border)] bg-[var(--panel-bg)] p-5 ${
        isFill ? "flex h-full flex-col" : ""
      } ${
        className ?? ""
      }`}
    >
      {hideHeader ? null : (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--heading)]">{title}</h2>
            {description ? <p className="mt-1 text-sm text-[var(--body)]">{description}</p> : null}
          </div>
          {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
        </div>
      )}
      <div className={`${isFill ? "min-h-0 flex-1" : ""} ${bodyClassName ?? ""}`}>{children}</div>
    </section>
  );
}

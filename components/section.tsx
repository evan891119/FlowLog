type SectionProps = {
  title: string;
  description?: string;
  headerAction?: React.ReactNode;
  layout?: "default" | "fill";
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
};

export function Section({ title, description, headerAction, layout = "default", className, bodyClassName, children }: SectionProps) {
  const isFill = layout === "fill";

  return (
    <section
      className={`dark-panel rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-panel backdrop-blur ${
        isFill ? "flex h-full flex-col" : ""
      } ${
        className ?? ""
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink dark:text-white">{title}</h2>
          {description ? <p className="mt-1 text-sm text-steel dark:text-slate-300">{description}</p> : null}
        </div>
        {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
      </div>
      <div className={`${isFill ? "min-h-0 flex-1" : ""} ${bodyClassName ?? ""}`}>{children}</div>
    </section>
  );
}

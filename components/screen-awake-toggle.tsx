"use client";

type ScreenAwakeToggleProps = {
  enabled: boolean;
  supported: boolean;
  ready: boolean;
  active: boolean;
  statusMessage: string;
  onEnabledChange: (enabled: boolean) => void;
  variant?: "panel" | "menu";
};

export function ScreenAwakeToggle({
  enabled,
  supported,
  ready,
  active,
  statusMessage,
  onEnabledChange,
  variant = "panel",
}: ScreenAwakeToggleProps) {
  const statusClass = !supported
    ? "text-clay dark:text-amber-200"
    : active
      ? "text-forest dark:text-green-300"
      : "text-steel dark:text-slate-300";

  if (variant === "menu") {
    return (
      <div className="px-2 py-3">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-steel dark:text-slate-300">Screen Awake</p>
            <p className="mt-1 text-sm font-semibold text-ink dark:text-white">Keep this device from auto-locking</p>
            <p className={`mt-1 text-xs ${statusClass}`}>
              {statusMessage}
              {active ? " The browser is currently holding the wake lock." : ""}
            </p>
          </div>

          <label className="flex shrink-0 items-center pt-0.5">
            <input
              type="checkbox"
              className="h-5 w-5 accent-forest"
              checked={enabled}
              onChange={(event) => onEnabledChange(event.target.checked)}
              disabled={!ready || !supported}
              aria-label="Keep screen awake on this device"
            />
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="dark-panel flex min-w-[17rem] items-start gap-3 rounded-[26px] border border-white/70 bg-white/88 px-4 py-3 shadow-panel backdrop-blur">
      <div className="flex-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-steel dark:text-slate-300">Screen Awake</p>
        <p className="mt-1 text-sm font-semibold text-ink dark:text-white">Keep this device from auto-locking</p>
        <p className={`mt-1 text-xs ${statusClass}`}>
          {statusMessage}
          {active ? " The browser is currently holding the wake lock." : ""}
        </p>
      </div>

      <label className="flex items-center">
        <input
          type="checkbox"
          className="h-5 w-5 accent-forest"
          checked={enabled}
          onChange={(event) => onEnabledChange(event.target.checked)}
          disabled={!ready || !supported}
          aria-label="Keep screen awake on this device"
        />
      </label>
    </div>
  );
}

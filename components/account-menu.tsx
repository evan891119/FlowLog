"use client";

import { useEffect, useRef, useState } from "react";
import { ScreenAwakeToggle } from "@/components/screen-awake-toggle";
import { useTheme } from "@/components/theme-provider";
import { ThemePreference } from "@/lib/theme";

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

type AccountMenuProps = {
  userEmail?: string | null;
  screenAwake: {
    enabled: boolean;
    supported: boolean;
    ready: boolean;
    active: boolean;
    statusMessage: string;
    onEnabledChange: (enabled: boolean) => void;
  };
};

export function AccountMenu({ userEmail, screenAwake }: AccountMenuProps) {
  const { preference, resolvedTheme, setPreference, isReady } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const shellRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (shellRef.current && event.target instanceof Node && !shellRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const themeSummary = isReady ? `${preference === "system" ? `System (${resolvedTheme})` : preference}` : "Loading";

  return (
    <div ref={shellRef} className="relative">
      <button
        type="button"
        className="dark-control rounded-full border border-sand bg-white/80 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-white dark:text-white"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-label="Account settings"
      >
        {userEmail ? userEmail : "Account"}
      </button>

      {isOpen ? (
        <div className="dark-panel absolute right-0 top-[calc(100%+0.5rem)] z-30 w-[min(20rem,calc(100vw-2rem))] rounded-[28px] border border-white/70 bg-white/95 p-3 shadow-panel backdrop-blur">
          <div className="border-b border-sand/70 px-2 pb-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-steel dark:text-slate-300">Account</p>
            <p className="mt-1 truncate text-sm font-semibold text-ink dark:text-white">{userEmail ?? "Signed in"}</p>
          </div>

          <div className="px-2 py-3">
            <ScreenAwakeToggle
              enabled={screenAwake.enabled}
              supported={screenAwake.supported}
              ready={screenAwake.ready}
              active={screenAwake.active}
              statusMessage={screenAwake.statusMessage}
              onEnabledChange={screenAwake.onEnabledChange}
              variant="menu"
            />
          </div>

          <div className="border-t border-sand/70 px-2 py-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-steel dark:text-slate-300">Theme</p>
              <span className="text-xs text-steel dark:text-slate-300">{themeSummary}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {THEME_OPTIONS.map((option) => {
                const isSelected = preference === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`rounded-2xl px-3 py-2 text-sm font-medium transition ${
                      isSelected
                        ? "bg-ink text-white dark-control-selected dark:text-white"
                        : "dark-control-soft text-ink hover:bg-mist dark:text-white"
                    }`}
                    onClick={() => setPreference(option.value)}
                    aria-pressed={isSelected}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-sand/70 px-2 pt-3">
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="dark-control flex w-full items-center justify-center rounded-2xl border border-sand bg-white/80 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-white dark:text-white"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

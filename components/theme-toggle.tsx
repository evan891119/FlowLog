"use client";

import { useEffect, useRef, useState } from "react";
import { ThemePreference } from "@/lib/theme";
import { useTheme } from "@/components/theme-provider";

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export function ThemeToggle() {
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

  const label = isReady ? `Theme: ${preference === "system" ? `System (${resolvedTheme})` : preference}` : "Theme";

  return (
    <div ref={shellRef} className="relative">
      <button
        type="button"
        className="rounded-full border border-sand bg-white/80 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-white dark:border-white/10 dark:bg-[#1d2632] dark:text-white dark:hover:bg-[#25303d]"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-label="Theme options"
      >
        {label}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-30 min-w-44 rounded-3xl border border-white/70 bg-white/95 p-2 shadow-panel backdrop-blur dark:border-white/10 dark:bg-[#161e28]/98">
          {THEME_OPTIONS.map((option) => {
            const isSelected = preference === option.value;

            return (
              <button
                key={option.value}
                type="button"
                className={`flex w-full items-center justify-between rounded-2xl px-3 py-2 text-sm transition ${
                  isSelected
                    ? "bg-ink text-white dark:bg-[#2a3442] dark:text-white"
                    : "text-ink hover:bg-mist dark:text-white dark:hover:bg-[#212b37]"
                }`}
                onClick={() => {
                  setPreference(option.value);
                  setIsOpen(false);
                }}
              >
                <span>{option.label}</span>
                {isSelected ? <span className="text-xs font-medium uppercase tracking-[0.14em]">On</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

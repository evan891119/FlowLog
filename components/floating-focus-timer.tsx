"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FocusPanel } from "@/components/focus-panel";
import { FocusSettings } from "@/types/dashboard";

function getRemainingSeconds(focus: FocusSettings, now: number) {
  if (!focus.lastSessionStartedAt) {
    return focus.duration * 60;
  }

  const elapsedSeconds = Math.max(0, Math.floor((now - new Date(focus.lastSessionStartedAt).getTime()) / 1000));
  return Math.max(0, focus.duration * 60 - elapsedSeconds);
}

function getProgressRatio(focus: FocusSettings, remainingSeconds: number) {
  const totalSeconds = Math.max(1, focus.duration * 60);
  return focus.lastSessionStartedAt ? Math.min(1, Math.max(0, 1 - remainingSeconds / totalSeconds)) : 0;
}

function formatOrbLabel(focus: FocusSettings, remainingSeconds: number, isComplete: boolean) {
  if (isComplete) {
    return "Done";
  }

  if (focus.lastSessionStartedAt) {
    const minutes = Math.floor(remainingSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = Math.floor(remainingSeconds % 60)
      .toString()
      .padStart(2, "0");

    return `${minutes}:${seconds}`;
  }

  return `${focus.duration}m`;
}

type FloatingFocusTimerProps = {
  focus: FocusSettings;
  onDurationChange: (duration: number) => void;
  onStart: () => void;
  onStop: () => void;
};

export function FloatingFocusTimer({
  focus,
  onDurationChange,
  onStart,
  onStop,
}: FloatingFocusTimerProps) {
  const [now, setNow] = useState(() => Date.now());
  const [isOpen, setIsOpen] = useState(false);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const remainingSeconds = getRemainingSeconds(focus, now);
  const isRunning = focus.lastSessionStartedAt !== null && remainingSeconds > 0;
  const isComplete = focus.lastSessionStartedAt !== null && remainingSeconds === 0;
  const progressRatio = getProgressRatio(focus, remainingSeconds);
  const orbLabel = formatOrbLabel(focus, remainingSeconds, isComplete);
  const progressStyle = useMemo(
    () => ({
      background: `conic-gradient(from 180deg, rgba(206, 113, 86, 0.98) ${progressRatio * 360}deg, rgba(131, 144, 164, 0.22) 0deg)`,
    }),
    [progressRatio],
  );

  useEffect(() => {
    if (!focus.lastSessionStartedAt || isComplete) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [focus.lastSessionStartedAt, isComplete]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
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
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div
      ref={shellRef}
      className="pointer-events-none fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-4 z-40 md:bottom-6 md:right-6"
    >
      {isOpen ? (
        <>
          <button
            type="button"
            className="dark-overlay pointer-events-auto fixed inset-0 z-0 bg-ink/18 md:bg-transparent"
            aria-label="Close focus mode"
            onClick={() => setIsOpen(false)}
          />

          <div className="pointer-events-auto fixed inset-x-0 bottom-0 z-10 md:hidden">
            <FocusPanel
              focus={focus}
              remainingSeconds={remainingSeconds}
              isRunning={isRunning}
              isComplete={isComplete}
              onDurationChange={onDurationChange}
              onStart={onStart}
              onStop={onStop}
              onClose={() => setIsOpen(false)}
              variant="sheet"
            />
          </div>

          <div className="pointer-events-auto absolute bottom-[calc(100%+0.9rem)] right-0 z-10 hidden md:block">
            <FocusPanel
              focus={focus}
              remainingSeconds={remainingSeconds}
              isRunning={isRunning}
              isComplete={isComplete}
              onDurationChange={onDurationChange}
              onStart={onStart}
              onStop={onStop}
              onClose={() => setIsOpen(false)}
            />
          </div>
        </>
      ) : null}

      <button
        type="button"
        className="dark-panel pointer-events-auto relative flex h-20 w-20 items-center justify-center rounded-full border border-white/70 bg-white/92 shadow-panel backdrop-blur transition hover:scale-[1.02] md:h-24 md:w-24"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-label="Open focus mode"
      >
        <span className="absolute inset-0 rounded-full p-[5px] md:p-[6px]" style={progressStyle}>
          <span className="dark-panel block h-full w-full rounded-full bg-white/95" />
        </span>
        <span className="dark-surface absolute inset-[7px] rounded-full border border-clay/20 bg-mist/90 dark:border-clay/30 md:inset-[8px]" />
        <span className="relative flex flex-col items-center justify-center leading-none">
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-steel dark:text-slate-300 md:text-[11px]">Focus</span>
          <span className="mt-1 text-sm font-semibold tracking-tight text-ink dark:text-white md:text-base">{orbLabel}</span>
        </span>
      </button>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Section } from "@/components/section";
import { FocusSettings } from "@/types/dashboard";

const DURATION_OPTIONS = [15, 25, 50];

function getRemainingSeconds(focus: FocusSettings, now: number) {
  if (!focus.lastSessionStartedAt) {
    return focus.duration * 60;
  }

  const elapsedSeconds = Math.max(0, Math.floor((now - new Date(focus.lastSessionStartedAt).getTime()) / 1000));
  return Math.max(0, focus.duration * 60 - elapsedSeconds);
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds}`;
}

type FocusPanelProps = {
  focus: FocusSettings;
  onToggleEnabled: (enabled: boolean) => void;
  onDurationChange: (duration: number) => void;
  onStart: () => void;
  onStop: () => void;
};

export function FocusPanel({ focus, onToggleEnabled, onDurationChange, onStart, onStop }: FocusPanelProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!focus.lastSessionStartedAt) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [focus.lastSessionStartedAt]);

  const remainingSeconds = getRemainingSeconds(focus, now);
  const isRunning = focus.lastSessionStartedAt !== null && remainingSeconds > 0;
  const isComplete = focus.lastSessionStartedAt !== null && remainingSeconds === 0;
  const statusText = !focus.enabled
    ? "Focus mode is off."
    : isRunning
      ? "Focus session in progress."
      : isComplete
        ? "Focus session complete."
        : "Ready to start a focus session.";

  return (
    <Section title="Focus Mode" description="Optional support for sustained work without taking over the dashboard.">
      <div className="space-y-4 rounded-3xl bg-white px-4 py-4 text-sm text-steel">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-steel">Status</p>
            <p className="mt-1 text-base font-semibold text-ink">{statusText}</p>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={focus.enabled}
              onChange={(event) => onToggleEnabled(event.target.checked)}
              aria-label="Enable focus mode"
            />
            Enabled
          </label>
        </div>

        <div className="rounded-2xl bg-mist/70 px-4 py-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-steel">Timer</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">{formatTime(remainingSeconds)}</p>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-steel">Duration</span>
          <select
            className="w-full rounded-2xl bg-mist px-3 py-2 text-sm text-ink outline-none"
            value={focus.duration}
            onChange={(event) => onDurationChange(Number(event.target.value))}
            disabled={isRunning}
            aria-label="Focus duration"
          >
            {DURATION_OPTIONS.map((duration) => (
              <option key={duration} value={duration}>
                {duration} minutes
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full bg-forest px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-steel"
            onClick={onStart}
            disabled={!focus.enabled || isRunning}
          >
            {isComplete ? "Restart session" : "Start focus"}
          </button>
          <button
            type="button"
            className="rounded-full border border-sand bg-white px-4 py-2 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:text-steel"
            onClick={onStop}
            disabled={focus.lastSessionStartedAt === null}
          >
            Stop focus
          </button>
        </div>
      </div>
    </Section>
  );
}

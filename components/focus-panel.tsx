"use client";

import { FocusSettings } from "@/types/dashboard";

const DURATION_OPTIONS = [15, 25, 50];

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
  remainingSeconds: number;
  isRunning: boolean;
  isComplete: boolean;
  onToggleEnabled: (enabled: boolean) => void;
  onDurationChange: (duration: number) => void;
  onStart: () => void;
  onStop: () => void;
  onClose: () => void;
  variant?: "popover" | "sheet";
};

export function FocusPanel({
  focus,
  remainingSeconds,
  isRunning,
  isComplete,
  onToggleEnabled,
  onDurationChange,
  onStart,
  onStop,
  onClose,
  variant = "popover",
}: FocusPanelProps) {
  const isSheet = variant === "sheet";
  const statusText = !focus.enabled
    ? "Focus mode is off."
    : isRunning
      ? "Focus session in progress."
      : isComplete
        ? "Focus session complete."
        : "Ready to start a focus session.";

  return (
    <div
      className={`rounded-[28px] border border-white/70 bg-white/95 p-5 shadow-panel backdrop-blur ${
        isSheet ? "w-full rounded-b-none pb-7" : "w-[min(24rem,calc(100vw-2rem))]"
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">Focus Mode</h2>
          <p className="mt-1 text-sm text-steel">Keep a timer close without taking over the dashboard.</p>
        </div>
        <button
          type="button"
          className="rounded-full border border-sand bg-white px-3 py-1.5 text-sm font-medium text-ink"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      <div className="space-y-4 rounded-3xl bg-white px-4 py-4 text-sm text-steel">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-steel">Status</p>
            <p className="mt-1 font-semibold text-ink">{statusText}</p>
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

        <div className={`gap-3 ${isSheet ? "space-y-3" : "grid grid-cols-[1.05fr_0.95fr] items-start"}`}>
          <div className="rounded-2xl bg-mist/70 px-4 py-3">
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
        </div>

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
    </div>
  );
}

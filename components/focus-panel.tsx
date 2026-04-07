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
  onDurationChange,
  onStart,
  onStop,
  onClose,
  variant = "popover",
}: FocusPanelProps) {
  const isSheet = variant === "sheet";
  const statusText =
    isRunning
      ? "Focus session in progress."
      : isComplete
        ? "Focus session complete."
        : "Ready to start a focus session.";

  return (
    <div
      className={`dark-panel rounded-[28px] border border-white/70 bg-white/95 p-5 shadow-panel backdrop-blur ${
        isSheet ? "w-full rounded-b-none pb-7" : "w-[min(24rem,calc(100vw-2rem))]"
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink dark:text-white">Focus Mode</h2>
          <p className="mt-1 text-sm text-steel dark:text-slate-300">Keep a timer close without taking over the dashboard.</p>
        </div>
        <button
          type="button"
          className="ui-button-secondary rounded-full px-3.5 py-1.5 text-sm font-medium"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      <div className="dark-panel-muted space-y-4 rounded-3xl bg-white px-4 py-4 text-sm text-steel dark:border dark:text-slate-300">
        <div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-steel dark:text-slate-300">Status</p>
            <p className="mt-1 font-semibold text-ink dark:text-white">{statusText}</p>
          </div>
        </div>

        <div className={`gap-3 ${isSheet ? "space-y-3" : "grid grid-cols-[1.05fr_0.95fr] items-start"}`}>
          <div className="dark-surface rounded-2xl bg-mist/70 px-4 py-3 dark:border">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-steel dark:text-slate-300">Timer</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-ink dark:text-white">{formatTime(remainingSeconds)}</p>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-steel dark:text-slate-300">Duration</span>
            <select
              className="dark-surface w-full rounded-2xl bg-mist px-3 py-2 text-sm text-ink outline-none dark:border dark:text-white"
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
            disabled={isRunning}
          >
            {isComplete ? "Restart session" : "Start focus"}
          </button>
          <button
            type="button"
            className="ui-button-secondary rounded-full px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:text-steel disabled:shadow-none dark:disabled:text-slate-400"
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

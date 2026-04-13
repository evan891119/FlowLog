export const SCREEN_WAKE_LOCK_STORAGE_KEY = "flowlog-screen-wake-lock";

export type ScreenWakeLockPreference = "disabled" | "enabled";
export type ScreenWakeLockTone = "neutral" | "active" | "warning";

export function isScreenWakeLockPreference(value: unknown): value is ScreenWakeLockPreference {
  return value === "disabled" || value === "enabled";
}

export function parseScreenWakeLockPreference(value: unknown): ScreenWakeLockPreference {
  return isScreenWakeLockPreference(value) ? value : "disabled";
}

export function getScreenWakeLockErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (error.name === "NotAllowedError") {
      return "Screen awake was not granted by this browser.";
    }

    if (error.name === "AbortError") {
      return "Screen awake was interrupted. Try again while this tab stays visible.";
    }
  }

  return "Screen awake is unavailable right now.";
}

type ScreenWakeLockStatusOptions = {
  preference: ScreenWakeLockPreference;
  isSupported: boolean;
  isActive: boolean;
  isVisible: boolean;
  errorMessage: string | null;
};

export function getScreenWakeLockStatus({
  preference,
  isSupported,
  isActive,
  isVisible,
  errorMessage,
}: ScreenWakeLockStatusOptions): { message: string; tone: ScreenWakeLockTone } {
  if (!isSupported) {
    return {
      message: "Screen awake is unavailable in this browser.",
      tone: "warning",
    };
  }

  if (preference === "disabled") {
    return {
      message: "Screen awake is off on this device.",
      tone: "neutral",
    };
  }

  if (isActive) {
    return {
      message: "Screen awake is active on this device.",
      tone: "active",
    };
  }

  if (errorMessage) {
    return {
      message: errorMessage,
      tone: "warning",
    };
  }

  if (!isVisible) {
    return {
      message: "Screen awake will resume when this tab is visible again.",
      tone: "neutral",
    };
  }

  return {
    message: "Trying to keep this screen awake.",
    tone: "neutral",
  };
}

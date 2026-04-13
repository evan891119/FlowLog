"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  getScreenWakeLockErrorMessage,
  getScreenWakeLockStatus,
  parseScreenWakeLockPreference,
  SCREEN_WAKE_LOCK_STORAGE_KEY,
  ScreenWakeLockPreference,
} from "@/lib/wake-lock";

type WakeLockSentinelLike = {
  released: boolean;
  release: () => Promise<void>;
  addEventListener: (type: "release", listener: () => void) => void;
  removeEventListener?: (type: "release", listener: () => void) => void;
};

type WakeLockNavigator = Navigator & {
  wakeLock?: {
    request: (type: "screen") => Promise<WakeLockSentinelLike>;
  };
};

function supportsScreenWakeLock() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  return typeof (navigator as WakeLockNavigator).wakeLock?.request === "function";
}

export function useScreenWakeLock() {
  const [preference, setPreferenceState] = useState<ScreenWakeLockPreference>("disabled");
  const [isReady, setIsReady] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const sentinelRef = useRef<WakeLockSentinelLike | null>(null);
  const releaseHandlerRef = useRef<(() => void) | null>(null);
  const preferenceRef = useRef<ScreenWakeLockPreference>("disabled");
  const manualReleaseRef = useRef(false);

  useEffect(() => {
    const isWakeLockSupported = supportsScreenWakeLock();
    const storedPreference = parseScreenWakeLockPreference(window.localStorage.getItem(SCREEN_WAKE_LOCK_STORAGE_KEY));
    const initialPreference = isWakeLockSupported ? storedPreference : "disabled";

    if (!isWakeLockSupported && storedPreference !== "disabled") {
      window.localStorage.setItem(SCREEN_WAKE_LOCK_STORAGE_KEY, "disabled");
    }

    setPreferenceState(initialPreference);
    preferenceRef.current = initialPreference;
    setIsSupported(isWakeLockSupported);
    setIsReady(true);
  }, []);

  useEffect(() => {
    preferenceRef.current = preference;
  }, [preference]);

  useEffect(() => {
    if (!isReady || !isSupported) {
      setIsActive(false);
      return;
    }

    let cancelled = false;

    const clearReleaseListener = () => {
      if (sentinelRef.current && releaseHandlerRef.current && sentinelRef.current.removeEventListener) {
        sentinelRef.current.removeEventListener("release", releaseHandlerRef.current);
      }

      releaseHandlerRef.current = null;
    };

    const releaseWakeLock = async (manual = false) => {
      const currentSentinel = sentinelRef.current;
      manualReleaseRef.current = manual;
      sentinelRef.current = null;
      clearReleaseListener();

      if (!currentSentinel) {
        setIsActive(false);
        manualReleaseRef.current = false;
        return;
      }

      try {
        await currentSentinel.release();
      } catch {
        // Ignore release failures because the browser may already have released the lock.
      } finally {
        if (!cancelled) {
          setIsActive(false);
        }

        manualReleaseRef.current = false;
      }
    };

    const acquireWakeLock = async () => {
      if (cancelled || preferenceRef.current !== "enabled" || document.visibilityState !== "visible") {
        return;
      }

      const wakeLockApi = (navigator as WakeLockNavigator).wakeLock;

      if (!wakeLockApi) {
        setIsActive(false);
        return;
      }

      try {
        const nextSentinel = await wakeLockApi.request("screen");

        if (cancelled) {
          await nextSentinel.release().catch(() => undefined);
          return;
        }

        clearReleaseListener();
        sentinelRef.current = nextSentinel;
        setErrorMessage(null);
        setIsActive(!nextSentinel.released);

        const handleRelease = () => {
          if (sentinelRef.current === nextSentinel) {
            sentinelRef.current = null;
          }

          setIsActive(false);

          if (!manualReleaseRef.current && preferenceRef.current === "enabled" && document.visibilityState === "visible") {
            void acquireWakeLock();
          }
        };

        releaseHandlerRef.current = handleRelease;
        nextSentinel.addEventListener("release", handleRelease);
      } catch (error) {
        if (!cancelled) {
          setIsActive(false);
          setErrorMessage(getScreenWakeLockErrorMessage(error));
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (preferenceRef.current === "enabled" && !sentinelRef.current) {
          void acquireWakeLock();
        }

        return;
      }

      if (sentinelRef.current?.released) {
        sentinelRef.current = null;
        setIsActive(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (preference === "enabled") {
      void acquireWakeLock();
    } else {
      setErrorMessage(null);
      void releaseWakeLock(true);
    }

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      void releaseWakeLock(false);
    };
  }, [isReady, isSupported, preference]);

  const setEnabled = (enabled: boolean) => {
    const nextPreference: ScreenWakeLockPreference = enabled ? "enabled" : "disabled";
    window.localStorage.setItem(SCREEN_WAKE_LOCK_STORAGE_KEY, nextPreference);
    setPreferenceState(nextPreference);

    if (!enabled) {
      setErrorMessage(null);
    }
  };

  const status = useMemo(
    () =>
      getScreenWakeLockStatus({
        preference,
        isSupported,
        isActive,
        isVisible: typeof document !== "undefined" ? document.visibilityState === "visible" : true,
        errorMessage,
      }),
    [preference, isSupported, isActive, errorMessage],
  );

  return {
    preference,
    isEnabled: preference === "enabled",
    isReady,
    isSupported,
    isActive,
    statusMessage: status.message,
    statusTone: status.tone,
    setEnabled,
  };
}

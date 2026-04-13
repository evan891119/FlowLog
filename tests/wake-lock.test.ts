import test from "node:test";
import assert from "node:assert/strict";
import {
  getScreenWakeLockErrorMessage,
  getScreenWakeLockStatus,
  parseScreenWakeLockPreference,
} from "@/lib/wake-lock";

test("parseScreenWakeLockPreference falls back to disabled", () => {
  assert.equal(parseScreenWakeLockPreference("enabled"), "enabled");
  assert.equal(parseScreenWakeLockPreference("disabled"), "disabled");
  assert.equal(parseScreenWakeLockPreference("unexpected"), "disabled");
  assert.equal(parseScreenWakeLockPreference(null), "disabled");
});

test("getScreenWakeLockStatus reports supported and unsupported states", () => {
  assert.deepEqual(
    getScreenWakeLockStatus({
      preference: "disabled",
      isSupported: true,
      isActive: false,
      isVisible: true,
      errorMessage: null,
    }),
    {
      message: "Screen awake is off on this device.",
      tone: "neutral",
    },
  );

  assert.deepEqual(
    getScreenWakeLockStatus({
      preference: "enabled",
      isSupported: true,
      isActive: true,
      isVisible: true,
      errorMessage: null,
    }),
    {
      message: "Screen awake is active on this device.",
      tone: "active",
    },
  );

  assert.deepEqual(
    getScreenWakeLockStatus({
      preference: "enabled",
      isSupported: false,
      isActive: false,
      isVisible: true,
      errorMessage: null,
    }),
    {
      message: "Screen awake is unavailable in this browser.",
      tone: "warning",
    },
  );
});

test("getScreenWakeLockStatus reports hidden-tab and rejected-request states", () => {
  assert.deepEqual(
    getScreenWakeLockStatus({
      preference: "enabled",
      isSupported: true,
      isActive: false,
      isVisible: false,
      errorMessage: null,
    }),
    {
      message: "Screen awake will resume when this tab is visible again.",
      tone: "neutral",
    },
  );

  assert.deepEqual(
    getScreenWakeLockStatus({
      preference: "enabled",
      isSupported: true,
      isActive: false,
      isVisible: true,
      errorMessage: "Screen awake was not granted by this browser.",
    }),
    {
      message: "Screen awake was not granted by this browser.",
      tone: "warning",
    },
  );
});

test("getScreenWakeLockErrorMessage maps known browser errors", () => {
  assert.equal(getScreenWakeLockErrorMessage(new DOMException("Denied", "NotAllowedError")), "Screen awake was not granted by this browser.");
  assert.equal(
    getScreenWakeLockErrorMessage(new DOMException("Hidden", "AbortError")),
    "Screen awake was interrupted. Try again while this tab stays visible.",
  );
  assert.equal(getScreenWakeLockErrorMessage(new Error("Unknown")), "Screen awake is unavailable right now.");
});

import test from "node:test";
import assert from "node:assert/strict";
import { defaultState, STORAGE_KEY } from "@/lib/dashboard-state";
import { loadDashboardState, saveDashboardState } from "@/lib/storage";

type MockStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  clear: () => void;
};

function createMockStorage(): MockStorage {
  const values = new Map<string, string>();

  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    clear() {
      values.clear();
    },
  };
}

test("loadDashboardState falls back to default state on corrupt storage", () => {
  const previousWindow = globalThis.window;
  const localStorage = createMockStorage();

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage },
  });

  localStorage.setItem(STORAGE_KEY, "{invalid-json");

  assert.deepEqual(loadDashboardState(), defaultState);

  if (previousWindow) {
    Object.defineProperty(globalThis, "window", { configurable: true, value: previousWindow });
  } else {
    Reflect.deleteProperty(globalThis, "window");
  }
});

test("saveDashboardState persists dashboard state with updated lastViewedAt", () => {
  const previousWindow = globalThis.window;
  const localStorage = createMockStorage();

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage },
  });

  saveDashboardState(defaultState);

  const rawValue = localStorage.getItem(STORAGE_KEY);
  assert.ok(rawValue);

  const parsedValue = JSON.parse(rawValue as string) as typeof defaultState;
  assert.equal(parsedValue.todayGoal, defaultState.todayGoal);
  assert.equal(typeof parsedValue.lastViewedAt, "string");

  if (previousWindow) {
    Object.defineProperty(globalThis, "window", { configurable: true, value: previousWindow });
  } else {
    Reflect.deleteProperty(globalThis, "window");
  }
});

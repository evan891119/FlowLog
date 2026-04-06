import { defaultState, getSafeInitialState, STORAGE_KEY } from "@/lib/dashboard-state";
import { DashboardState } from "@/types/dashboard";

function buildPersistedDashboardState(state: DashboardState): DashboardState {
  return {
    ...state,
    lastViewedAt: new Date().toISOString(),
  };
}

export function loadDashboardState(): DashboardState {
  if (typeof window === "undefined") {
    return defaultState;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return defaultState;
    }

    return getSafeInitialState(JSON.parse(raw));
  } catch {
    return defaultState;
  }
}

export function saveDashboardState(state: DashboardState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(buildPersistedDashboardState(state)));
}

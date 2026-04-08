"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import {
  createDashboardSyncBroadcastPayload,
  DASHBOARD_SYNC_BROADCAST_EVENT,
  parseDashboardSyncBroadcastPayload,
  shouldApplyRemoteDashboardState,
} from "@/lib/dashboard-sync";
import {
  addTaskTodoItemInState,
  createTaskInState,
  deleteTaskInState,
  deleteTaskTodoItemInState,
  moveTaskInState,
  setCurrentTaskInState,
  setTaskModeInState,
  setTaskStatusInState,
  startFocusSessionInState,
  stopFocusSessionInState,
  toggleTaskTodoItemInState,
  toggleTodayTaskInState,
  updateFocusSettingsInState,
  updateTaskInState,
  updateTaskTodoItemInState,
  updateTodayGoalInState,
} from "@/lib/dashboard-state";
import { createOptionalSupabaseBrowserClient } from "@/lib/supabase/browser";
import { DashboardState, TaskMode, TaskStatus } from "@/types/dashboard";

let hasWarnedAboutDisabledLiveSync = false;
const REMOTE_RELOAD_DEBOUNCE_MS = 150;
const PERSIST_DEBOUNCE_MS = 250;
const REMOTE_RELOAD_SUPPRESSION_MS = 1500;
const DASHBOARD_SYNC_SUBSCRIBED = "SUBSCRIBED";
const DASHBOARD_SYNC_CHANNEL_ERROR = "CHANNEL_ERROR";
const DASHBOARD_SYNC_TIMED_OUT = "TIMED_OUT";
const DASHBOARD_SYNC_CLOSED = "CLOSED";

async function persistDashboardState(state: DashboardState) {
  const response = await fetch("/api/dashboard", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(state),
  });

  if (!response.ok) {
    throw new Error("Failed to persist dashboard state.");
  }
}

async function loadDashboardState() {
  const response = await fetch("/api/dashboard", {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load dashboard state.");
  }

  return (await response.json()) as DashboardState;
}

export function useDashboardState(initialState: DashboardState, userId: string) {
  const [state, setState] = useState<DashboardState>(initialState);
  const [supabase] = useState(() => createOptionalSupabaseBrowserClient());
  const [clientId] = useState(() => crypto.randomUUID());
  const hasMountedRef = useRef(false);
  const stateRef = useRef(state);
  const isApplyingRemoteStateRef = useRef(false);
  const localMutationVersionRef = useRef(0);
  const remoteReloadTimeoutRef = useRef<number | null>(null);
  const suppressRemoteReloadUntilRef = useRef(0);
  const broadcastChannelRef = useRef<ReturnType<NonNullable<typeof supabase>["channel"]> | null>(null);
  const isBroadcastChannelSubscribedRef = useRef(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (isApplyingRemoteStateRef.current) {
      isApplyingRemoteStateRef.current = false;
      return;
    }

    const persistedState = state;
    const persistedVersion = localMutationVersionRef.current;
    const timeoutId = window.setTimeout(() => {
      void (async () => {
        try {
          await persistDashboardState(persistedState);
        } catch (error) {
          console.error(error);
          return;
        }

        if (persistedVersion !== localMutationVersionRef.current) {
          return;
        }

        const broadcastChannel = broadcastChannelRef.current;

        if (!broadcastChannel || !isBroadcastChannelSubscribedRef.current) {
          console.warn("Dashboard live sync broadcast skipped because the broadcast channel is unavailable. Falling back to database events.");
          return;
        }

        const payload = createDashboardSyncBroadcastPayload(persistedState, clientId);
        const result = await broadcastChannel.send({
          type: "broadcast",
          event: DASHBOARD_SYNC_BROADCAST_EVENT,
          payload,
        });

        if (result !== "ok") {
          console.warn(`Dashboard live sync broadcast failed with status: ${result}. Falling back to database events.`);
          return;
        }

        suppressRemoteReloadUntilRef.current = Date.now() + REMOTE_RELOAD_SUPPRESSION_MS;
      })();
    }, PERSIST_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [state]);

  useEffect(() => {
    if (!supabase) {
      if (!hasWarnedAboutDisabledLiveSync) {
        hasWarnedAboutDisabledLiveSync = true;
        console.warn("Supabase client env is missing in the browser bundle. Live sync is disabled for this session.");
      }

      return;
    }

    const reloadDashboardState = async () => {
      const requestVersion = localMutationVersionRef.current;
      const nextState = await loadDashboardState();

      if (requestVersion !== localMutationVersionRef.current) {
        return;
      }

      if (!shouldApplyRemoteDashboardState(stateRef.current, nextState)) {
        return;
      }

      isApplyingRemoteStateRef.current = true;
      startTransition(() => {
        setState(nextState);
      });
    };

    const scheduleRemoteReload = () => {
      if (Date.now() < suppressRemoteReloadUntilRef.current) {
        return;
      }

      if (remoteReloadTimeoutRef.current !== null) {
        window.clearTimeout(remoteReloadTimeoutRef.current);
      }

      remoteReloadTimeoutRef.current = window.setTimeout(() => {
        void reloadDashboardState().catch((error) => {
          console.error(error);
        });
      }, REMOTE_RELOAD_DEBOUNCE_MS);
    };

    const handleBroadcastStatus = (status: string) => {
      isBroadcastChannelSubscribedRef.current = status === DASHBOARD_SYNC_SUBSCRIBED;

      if (status === DASHBOARD_SYNC_SUBSCRIBED) {
        console.info(`Dashboard live sync broadcast connected for user ${userId}.`);
        return;
      }

      if (status === DASHBOARD_SYNC_CHANNEL_ERROR || status === DASHBOARD_SYNC_TIMED_OUT || status === DASHBOARD_SYNC_CLOSED) {
        console.warn(`Dashboard live sync broadcast status changed to ${status}. Falling back to database events when available.`);
      }
    };

    const handleFallbackStatus = (status: string) => {
      if (status === DASHBOARD_SYNC_SUBSCRIBED) {
        console.info(`Dashboard fallback sync connected for user ${userId}.`);
        return;
      }

      if (status === DASHBOARD_SYNC_CHANNEL_ERROR || status === DASHBOARD_SYNC_TIMED_OUT || status === DASHBOARD_SYNC_CLOSED) {
        console.warn(`Dashboard fallback sync status changed to ${status}. Live sync may require a manual refresh.`);
      }
    };

    const broadcastChannel = supabase
      .channel(`dashboard:broadcast:${userId}`)
      .on("broadcast", { event: DASHBOARD_SYNC_BROADCAST_EVENT }, ({ payload }) => {
        const parsedPayload = parseDashboardSyncBroadcastPayload(payload);

        if (!parsedPayload) {
          console.warn("Ignored invalid dashboard live sync payload.");
          return;
        }

        if (parsedPayload.originClientId === clientId) {
          return;
        }

        if (!shouldApplyRemoteDashboardState(stateRef.current, parsedPayload.state)) {
          return;
        }

        suppressRemoteReloadUntilRef.current = Date.now() + REMOTE_RELOAD_SUPPRESSION_MS;
        isApplyingRemoteStateRef.current = true;
        startTransition(() => {
          setState(parsedPayload.state);
        });
      })
      .subscribe(handleBroadcastStatus);

    const fallbackChannel = supabase
      .channel(`dashboard:postgres:${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `user_id=eq.${userId}` }, scheduleRemoteReload)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dashboard_settings", filter: `user_id=eq.${userId}` },
        scheduleRemoteReload,
      )
      .subscribe(handleFallbackStatus);

    broadcastChannelRef.current = broadcastChannel;

    return () => {
      if (remoteReloadTimeoutRef.current !== null) {
        window.clearTimeout(remoteReloadTimeoutRef.current);
      }

      isBroadcastChannelSubscribedRef.current = false;
      broadcastChannelRef.current = null;
      void supabase.removeChannel(broadcastChannel);
      void supabase.removeChannel(fallbackChannel);
    };
  }, [clientId, supabase, userId]);

  const applyLocalState = (updater: (current: DashboardState) => DashboardState) => {
    localMutationVersionRef.current += 1;
    setState(updater);
  };

  const createTask = () => {
    applyLocalState((current) => createTaskInState(current, { title: "New task", isToday: current.tasks.length === 0 }));
  };

  const updateTaskTitle = (taskId: string, title: string) => {
    applyLocalState((current) => updateTaskInState(current, taskId, { title }));
  };

  const updateTaskNextAction = (taskId: string, nextAction: string) => {
    applyLocalState((current) => updateTaskInState(current, taskId, { nextAction }));
  };

  const updateTaskMode = (taskId: string, taskMode: TaskMode) => {
    applyLocalState((current) => setTaskModeInState(current, taskId, taskMode));
  };

  const updateTaskManualProgress = (taskId: string, manualProgress: number) => {
    applyLocalState((current) => updateTaskInState(current, taskId, { manualProgress }));
  };

  const updateTaskEstimatedMinutes = (taskId: string, estimatedMinutes: number | null) => {
    applyLocalState((current) => updateTaskInState(current, taskId, { estimatedMinutes }));
  };

  const addTaskTodoItem = (taskId: string) => {
    applyLocalState((current) => addTaskTodoItemInState(current, taskId));
  };

  const updateTaskTodoItem = (taskId: string, todoItemId: string, text: string) => {
    applyLocalState((current) => updateTaskTodoItemInState(current, taskId, todoItemId, text));
  };

  const toggleTaskTodoItem = (taskId: string, todoItemId: string) => {
    applyLocalState((current) => toggleTaskTodoItemInState(current, taskId, todoItemId));
  };

  const deleteTaskTodoItem = (taskId: string, todoItemId: string) => {
    applyLocalState((current) => deleteTaskTodoItemInState(current, taskId, todoItemId));
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    applyLocalState((current) => setTaskStatusInState(current, taskId, status));
  };

  const toggleToday = (taskId: string) => {
    applyLocalState((current) => toggleTodayTaskInState(current, taskId));
  };

  const toggleCurrentTask = (taskId: string) => {
    applyLocalState((current) => setCurrentTaskInState(current, taskId));
  };

  const updateTodayGoal = (todayGoal: string) => {
    applyLocalState((current) => updateTodayGoalInState(current, todayGoal));
  };

  const deleteTask = (taskId: string) => {
    applyLocalState((current) => deleteTaskInState(current, taskId));
  };

  const moveTaskUp = (taskId: string) => {
    applyLocalState((current) => moveTaskInState(current, taskId, "up"));
  };

  const moveTaskDown = (taskId: string) => {
    applyLocalState((current) => moveTaskInState(current, taskId, "down"));
  };

  const setFocusDuration = (duration: number) => {
    applyLocalState((current) => updateFocusSettingsInState(current, { duration }));
  };

  const startFocusSession = () => {
    applyLocalState((current) => startFocusSessionInState(current));
  };

  const stopFocusSession = () => {
    applyLocalState((current) => stopFocusSessionInState(current));
  };

  return {
    state,
    isHydrated: true,
    createTask,
    updateTaskTitle,
    updateTaskNextAction,
    updateTaskMode,
    updateTaskManualProgress,
    updateTaskEstimatedMinutes,
    addTaskTodoItem,
    updateTaskTodoItem,
    toggleTaskTodoItem,
    deleteTaskTodoItem,
    updateTaskStatus,
    toggleToday,
    toggleCurrentTask,
    updateTodayGoal,
    deleteTask,
    moveTaskUp,
    moveTaskDown,
    setFocusDuration,
    startFocusSession,
    stopFocusSession,
  };
}

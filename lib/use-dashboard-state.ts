"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { DashboardSettingsRow, TaskRow } from "@/lib/dashboard-cloud";
import {
  applyDashboardSettingsFromRow,
  applyTaskDeleteFromRow,
  applyTaskUpsertFromRow,
  isDashboardSettingsRow,
  isTaskRow,
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
const PERSIST_DEBOUNCE_MS = 250;
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

export function useDashboardState(initialState: DashboardState, userId: string) {
  const [state, setState] = useState<DashboardState>(initialState);
  const [supabase] = useState(() => createOptionalSupabaseBrowserClient());
  const [clientId] = useState(() => crypto.randomUUID());
  const hasMountedRef = useRef(false);
  const stateRef = useRef(state);
  const isApplyingRemoteStateRef = useRef(false);
  const localMutationVersionRef = useRef(0);

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

    const applyRemoteState = (nextState: DashboardState) => {
      if (!shouldApplyRemoteDashboardState(stateRef.current, nextState)) {
        return;
      }

      isApplyingRemoteStateRef.current = true;
      startTransition(() => {
        setState(nextState);
      });
    };

    const handleChannelStatus = (status: string) => {
      if (status === DASHBOARD_SYNC_SUBSCRIBED) {
        console.info(`Dashboard live sync connected for user ${userId}.`);
        return;
      }

      if (status === DASHBOARD_SYNC_CHANNEL_ERROR || status === DASHBOARD_SYNC_TIMED_OUT || status === DASHBOARD_SYNC_CLOSED) {
        console.warn(`Dashboard live sync status changed to ${status}. Live sync may require a manual refresh.`);
      }
    };

    const channel = supabase
      .channel(`dashboard:${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `user_id=eq.${userId}` }, (payload: RealtimePostgresChangesPayload<TaskRow>) => {
        if (payload.eventType === "DELETE") {
          applyRemoteState(applyTaskDeleteFromRow(stateRef.current, payload.old as Pick<TaskRow, "id">));
          return;
        }

        if (!isTaskRow(payload.new)) {
          return;
        }

        applyRemoteState(applyTaskUpsertFromRow(stateRef.current, payload.new));
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dashboard_settings", filter: `user_id=eq.${userId}` },
        (payload: RealtimePostgresChangesPayload<DashboardSettingsRow>) => {
          if (!isDashboardSettingsRow(payload.new)) {
            return;
          }

          applyRemoteState(applyDashboardSettingsFromRow(stateRef.current, payload.new));
        },
      )
      .subscribe(handleChannelStatus);

    return () => {
      void supabase.removeChannel(channel);
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

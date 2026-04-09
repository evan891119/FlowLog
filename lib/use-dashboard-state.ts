"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import {
  mapDashboardStateToSettingsRow,
  mapDashboardStateToTaskRows,
  type DashboardMutationRequest,
  type DashboardSettingsRow,
  type TaskRow,
} from "@/lib/dashboard-cloud";
import {
  applyDashboardSettingsFromRow,
  applyTaskDeleteFromRow,
  applyTaskUpsertFromRow,
  isIncomingTimestampCurrent,
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
const DASHBOARD_SYNC_SUBSCRIBED = "SUBSCRIBED";
const DASHBOARD_SYNC_CHANNEL_ERROR = "CHANNEL_ERROR";
const DASHBOARD_SYNC_TIMED_OUT = "TIMED_OUT";
const DASHBOARD_SYNC_CLOSED = "CLOSED";

async function persistDashboardMutation(mutation: DashboardMutationRequest) {
  const response = await fetch("/api/dashboard", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(mutation),
  });

  if (!response.ok) {
    throw new Error("Failed to persist dashboard mutation.");
  }
}

function getTaskTimestampMap(state: DashboardState) {
  return new Map(state.tasks.map((task) => [task.id, task.updatedAt]));
}

function getChangedTaskIds(previousState: DashboardState, nextState: DashboardState) {
  const previousRows = new Map(mapDashboardStateToTaskRows("user", previousState).map((row) => [row.id, JSON.stringify(row)]));
  const nextRows = new Map(mapDashboardStateToTaskRows("user", nextState).map((row) => [row.id, JSON.stringify(row)]));
  const changedTaskIds = new Set<string>();

  for (const taskId of new Set([...previousRows.keys(), ...nextRows.keys()])) {
    if (previousRows.get(taskId) !== nextRows.get(taskId)) {
      changedTaskIds.add(taskId);
    }
  }

  return [...changedTaskIds];
}

function stampTaskUpdates(state: DashboardState, taskIds: string[], timestamp: string) {
  if (taskIds.length === 0) {
    return state;
  }

  const changedTaskIds = new Set(taskIds);

  return {
    ...state,
    tasks: state.tasks.map((task) => (changedTaskIds.has(task.id) ? { ...task, updatedAt: timestamp } : task)),
  };
}

export function useDashboardState(initialState: DashboardState, userId: string) {
  const [state, setState] = useState<DashboardState>(initialState);
  const [supabase] = useState(() => createOptionalSupabaseBrowserClient());
  const stateRef = useRef(state);
  const latestTaskTimestampRef = useRef(getTaskTimestampMap(initialState));
  const latestSettingsTimestampRef = useRef<string | null>(initialState.lastViewedAt);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (!supabase) {
      if (!hasWarnedAboutDisabledLiveSync) {
        hasWarnedAboutDisabledLiveSync = true;
        console.warn("Supabase client env is missing in the browser bundle. Live sync is disabled for this session.");
      }

      return;
    }

    const rememberTaskTimestamp = (taskId: string, timestamp: string) => {
      const latestKnownTimestamp = latestTaskTimestampRef.current.get(taskId);

      if (!latestKnownTimestamp || isIncomingTimestampCurrent(timestamp, latestKnownTimestamp)) {
        latestTaskTimestampRef.current.set(taskId, timestamp);
      }
    };

    const rememberSettingsTimestamp = (timestamp: string | null) => {
      if (!timestamp) {
        return;
      }

      if (isIncomingTimestampCurrent(timestamp, latestSettingsTimestampRef.current)) {
        latestSettingsTimestampRef.current = timestamp;
      }
    };

    const applyRemoteState = (nextState: DashboardState) => {
      if (!shouldApplyRemoteDashboardState(stateRef.current, nextState)) {
        return;
      }

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
          latestTaskTimestampRef.current.delete((payload.old as Pick<TaskRow, "id">).id);
          applyRemoteState(applyTaskDeleteFromRow(stateRef.current, payload.old as Pick<TaskRow, "id">));
          return;
        }

        if (!isTaskRow(payload.new)) {
          return;
        }

        if (!isIncomingTimestampCurrent(payload.new.updated_at, latestTaskTimestampRef.current.get(payload.new.id))) {
          return;
        }

        rememberTaskTimestamp(payload.new.id, payload.new.updated_at);
        applyRemoteState(applyTaskUpsertFromRow(stateRef.current, payload.new));
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dashboard_settings", filter: `user_id=eq.${userId}` },
        (payload: RealtimePostgresChangesPayload<DashboardSettingsRow>) => {
          if (!isDashboardSettingsRow(payload.new)) {
            return;
          }

          if (!isIncomingTimestampCurrent(payload.new.last_viewed_at, latestSettingsTimestampRef.current)) {
            return;
          }

          rememberSettingsTimestamp(payload.new.last_viewed_at);
          applyRemoteState(applyDashboardSettingsFromRow(stateRef.current, payload.new));
        },
      )
      .subscribe(handleChannelStatus);

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [clientId, supabase, userId]);

  const applyLocalTaskMutation = (updater: (current: DashboardState) => DashboardState) => {
    const currentState = stateRef.current;
    const nextState = updater(currentState);
    const changedTaskIds = getChangedTaskIds(currentState, nextState);

    if (changedTaskIds.length === 0) {
      setState(nextState);
      stateRef.current = nextState;
      return;
    }

    const mutationTimestamp = new Date().toISOString();
    const stampedState = stampTaskUpdates(nextState, changedTaskIds, mutationTimestamp);
    const taskRows = mapDashboardStateToTaskRows(userId, stampedState).filter((row) => changedTaskIds.includes(row.id));

    for (const row of taskRows) {
      latestTaskTimestampRef.current.set(row.id, row.updated_at);
    }

    stateRef.current = stampedState;
    setState(stampedState);

    void persistDashboardMutation({
      type: "upsert_tasks",
      taskRows,
    }).catch((error) => {
      console.error(error);
    });
  };

  const applyLocalTaskDeletion = (taskId: string) => {
    const currentState = stateRef.current;
    const nextState = deleteTaskInState(currentState, taskId);
    const deletedAt = new Date().toISOString();

    latestTaskTimestampRef.current.set(taskId, deletedAt);
    stateRef.current = nextState;
    setState(nextState);

    void persistDashboardMutation({
      type: "delete_task",
      taskId,
      deletedAt,
    }).catch((error) => {
      console.error(error);
    });
  };

  const applyLocalSettingsMutation = (updater: (current: DashboardState) => DashboardState) => {
    const currentState = stateRef.current;
    const mutationTimestamp = new Date().toISOString();
    const nextState = {
      ...updater(currentState),
      lastViewedAt: mutationTimestamp,
    };
    const settingsRow = mapDashboardStateToSettingsRow(userId, nextState, mutationTimestamp);

    latestSettingsTimestampRef.current = mutationTimestamp;
    stateRef.current = nextState;
    setState(nextState);

    void persistDashboardMutation({
      type: "upsert_settings",
      settingsRow,
    }).catch((error) => {
      console.error(error);
    });
  };

  const createTask = () => {
    applyLocalTaskMutation((current) => createTaskInState(current, { title: "New task", isToday: current.tasks.length === 0 }));
  };

  const updateTaskTitle = (taskId: string, title: string) => {
    applyLocalTaskMutation((current) => updateTaskInState(current, taskId, { title }));
  };

  const updateTaskNextAction = (taskId: string, nextAction: string) => {
    applyLocalTaskMutation((current) => updateTaskInState(current, taskId, { nextAction }));
  };

  const updateTaskMode = (taskId: string, taskMode: TaskMode) => {
    applyLocalTaskMutation((current) => setTaskModeInState(current, taskId, taskMode));
  };

  const updateTaskManualProgress = (taskId: string, manualProgress: number) => {
    applyLocalTaskMutation((current) => updateTaskInState(current, taskId, { manualProgress }));
  };

  const updateTaskEstimatedMinutes = (taskId: string, estimatedMinutes: number | null) => {
    applyLocalTaskMutation((current) => updateTaskInState(current, taskId, { estimatedMinutes }));
  };

  const addTaskTodoItem = (taskId: string) => {
    applyLocalTaskMutation((current) => addTaskTodoItemInState(current, taskId));
  };

  const updateTaskTodoItem = (taskId: string, todoItemId: string, text: string) => {
    applyLocalTaskMutation((current) => updateTaskTodoItemInState(current, taskId, todoItemId, text));
  };

  const toggleTaskTodoItem = (taskId: string, todoItemId: string) => {
    applyLocalTaskMutation((current) => toggleTaskTodoItemInState(current, taskId, todoItemId));
  };

  const deleteTaskTodoItem = (taskId: string, todoItemId: string) => {
    applyLocalTaskMutation((current) => deleteTaskTodoItemInState(current, taskId, todoItemId));
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    applyLocalTaskMutation((current) => setTaskStatusInState(current, taskId, status));
  };

  const toggleToday = (taskId: string) => {
    applyLocalTaskMutation((current) => toggleTodayTaskInState(current, taskId));
  };

  const toggleCurrentTask = (taskId: string) => {
    applyLocalTaskMutation((current) => setCurrentTaskInState(current, taskId));
  };

  const updateTodayGoal = (todayGoal: string) => {
    applyLocalSettingsMutation((current) => updateTodayGoalInState(current, todayGoal));
  };

  const deleteTask = (taskId: string) => {
    applyLocalTaskDeletion(taskId);
  };

  const moveTaskUp = (taskId: string) => {
    applyLocalTaskMutation((current) => moveTaskInState(current, taskId, "up"));
  };

  const moveTaskDown = (taskId: string) => {
    applyLocalTaskMutation((current) => moveTaskInState(current, taskId, "down"));
  };

  const setFocusDuration = (duration: number) => {
    applyLocalSettingsMutation((current) => updateFocusSettingsInState(current, { duration }));
  };

  const startFocusSession = () => {
    applyLocalSettingsMutation((current) => startFocusSessionInState(current));
  };

  const stopFocusSession = () => {
    applyLocalSettingsMutation((current) => stopFocusSessionInState(current));
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

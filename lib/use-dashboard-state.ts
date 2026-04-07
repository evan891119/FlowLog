"use client";

import { useEffect, useRef, useState } from "react";
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
import { DashboardState, TaskMode, TaskStatus } from "@/types/dashboard";

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

export function useDashboardState(initialState: DashboardState) {
  const [state, setState] = useState<DashboardState>(initialState);
  const hasMountedRef = useRef(false);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void persistDashboardState(state).catch((error) => {
        console.error(error);
      });
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [state]);

  const createTask = () => {
    setState((current) => createTaskInState(current, { title: "New task", isToday: current.tasks.length === 0 }));
  };

  const updateTaskTitle = (taskId: string, title: string) => {
    setState((current) => updateTaskInState(current, taskId, { title }));
  };

  const updateTaskNextAction = (taskId: string, nextAction: string) => {
    setState((current) => updateTaskInState(current, taskId, { nextAction }));
  };

  const updateTaskMode = (taskId: string, taskMode: TaskMode) => {
    setState((current) => setTaskModeInState(current, taskId, taskMode));
  };

  const updateTaskManualProgress = (taskId: string, manualProgress: number) => {
    setState((current) => updateTaskInState(current, taskId, { manualProgress }));
  };

  const updateTaskEstimatedMinutes = (taskId: string, estimatedMinutes: number | null) => {
    setState((current) => updateTaskInState(current, taskId, { estimatedMinutes }));
  };

  const addTaskTodoItem = (taskId: string) => {
    setState((current) => addTaskTodoItemInState(current, taskId));
  };

  const updateTaskTodoItem = (taskId: string, todoItemId: string, text: string) => {
    setState((current) => updateTaskTodoItemInState(current, taskId, todoItemId, text));
  };

  const toggleTaskTodoItem = (taskId: string, todoItemId: string) => {
    setState((current) => toggleTaskTodoItemInState(current, taskId, todoItemId));
  };

  const deleteTaskTodoItem = (taskId: string, todoItemId: string) => {
    setState((current) => deleteTaskTodoItemInState(current, taskId, todoItemId));
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    setState((current) => setTaskStatusInState(current, taskId, status));
  };

  const toggleToday = (taskId: string) => {
    setState((current) => toggleTodayTaskInState(current, taskId));
  };

  const toggleCurrentTask = (taskId: string) => {
    setState((current) => setCurrentTaskInState(current, taskId));
  };

  const updateTodayGoal = (todayGoal: string) => {
    setState((current) => updateTodayGoalInState(current, todayGoal));
  };

  const deleteTask = (taskId: string) => {
    setState((current) => deleteTaskInState(current, taskId));
  };

  const moveTaskUp = (taskId: string) => {
    setState((current) => moveTaskInState(current, taskId, "up"));
  };

  const moveTaskDown = (taskId: string) => {
    setState((current) => moveTaskInState(current, taskId, "down"));
  };

  const setFocusDuration = (duration: number) => {
    setState((current) => updateFocusSettingsInState(current, { duration }));
  };

  const startFocusSession = () => {
    setState((current) => startFocusSessionInState(current));
  };

  const stopFocusSession = () => {
    setState((current) => stopFocusSessionInState(current));
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

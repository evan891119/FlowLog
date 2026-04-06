"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import {
  createTaskInState,
  defaultState,
  setCurrentTaskInState,
  setTaskStatusInState,
  toggleTodayTaskInState,
  updateTaskInState,
  updateTodayGoalInState,
} from "@/lib/dashboard-state";
import { loadDashboardState, saveDashboardState } from "@/lib/storage";
import { DashboardState, TaskStatus } from "@/types/dashboard";

export function useDashboardState() {
  const [state, setState] = useState<DashboardState>(defaultState);
  const [isHydrated, setIsHydrated] = useState(false);

  useLayoutEffect(() => {
    setState(loadDashboardState());
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    saveDashboardState(state);
  }, [isHydrated, state]);

  const createTask = () => {
    setState((current) => createTaskInState(current, { title: "New task", isToday: current.tasks.length === 0 }));
  };

  const updateTaskTitle = (taskId: string, title: string) => {
    setState((current) => updateTaskInState(current, taskId, { title }));
  };

  const updateTaskNextAction = (taskId: string, nextAction: string) => {
    setState((current) => updateTaskInState(current, taskId, { nextAction }));
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    setState((current) => setTaskStatusInState(current, taskId, status));
  };

  const toggleToday = (taskId: string) => {
    setState((current) => toggleTodayTaskInState(current, taskId));
  };

  const setCurrentTask = (taskId: string) => {
    setState((current) => setCurrentTaskInState(current, taskId));
  };

  const updateTodayGoal = (todayGoal: string) => {
    setState((current) => updateTodayGoalInState(current, todayGoal));
  };

  return {
    state,
    isHydrated,
    createTask,
    updateTaskTitle,
    updateTaskNextAction,
    updateTaskStatus,
    toggleToday,
    setCurrentTask,
    updateTodayGoal,
  };
}

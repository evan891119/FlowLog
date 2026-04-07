import test from "node:test";
import assert from "node:assert/strict";
import { defaultState } from "@/lib/dashboard-state";
import {
  mapDashboardStateToSettingsRow,
  mapDashboardStateToTaskRows,
  mapRowsToDashboardState,
  type DashboardSettingsRow,
  type TaskRow,
} from "@/lib/dashboard-cloud";

test("maps dashboard state to ordered task rows", () => {
  const state = {
    ...defaultState,
    taskOrder: ["b", "a"],
    tasks: [
      {
        id: "a",
        title: "Task A",
        status: "not_started" as const,
        taskMode: "next_action" as const,
        nextAction: "First",
        manualProgress: 0,
        estimatedMinutes: null,
        elapsedSeconds: 0,
        currentSessionStartedAt: null,
        todoItems: [],
        isToday: false,
        isCurrent: false,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z",
      },
      {
        id: "b",
        title: "Task B",
        status: "in_progress" as const,
        taskMode: "todo_list" as const,
        nextAction: "Second",
        manualProgress: 25,
        estimatedMinutes: 45,
        elapsedSeconds: 300,
        currentSessionStartedAt: "2025-01-02T00:05:00.000Z",
        todoItems: [
          { id: "todo-1", text: "Second", done: true },
          { id: "todo-2", text: "Wrap up", done: false },
        ],
        isToday: true,
        isCurrent: true,
        createdAt: "2025-01-02T00:00:00.000Z",
        updatedAt: "2025-01-02T00:00:00.000Z",
      },
    ],
  };

  const rows = mapDashboardStateToTaskRows("user-1", state);

  assert.equal(rows.find((row) => row.id === "b")?.sort_order, 0);
  assert.equal(rows.find((row) => row.id === "a")?.sort_order, 1);
  assert.equal(rows.every((row) => row.user_id === "user-1"), true);
  assert.equal(rows.find((row) => row.id === "b")?.task_mode, "todo_list");
  assert.equal(rows.find((row) => row.id === "b")?.progress, 50);
  assert.equal(rows.find((row) => row.id === "b")?.estimated_minutes, 45);
  assert.equal(rows.find((row) => row.id === "b")?.elapsed_seconds, 300);
});

test("maps dashboard settings row with persisted timestamp", () => {
  const persistedAt = "2026-04-06T12:00:00.000Z";
  const row = mapDashboardStateToSettingsRow("user-1", defaultState, persistedAt);

  assert.equal(row.user_id, "user-1");
  assert.equal(row.last_viewed_at, persistedAt);
  assert.equal(row.focus_duration, defaultState.focus.duration);
});

test("rebuilds dashboard state from cloud rows", () => {
  const taskRows: TaskRow[] = [
    {
      id: "a",
      user_id: "user-1",
      title: "Task A",
      status: "not_started",
      task_mode: "next_action",
      next_action: "",
      manual_progress: 0,
      estimated_minutes: null,
      elapsed_seconds: 0,
      current_session_started_at: null,
      todo_items: [],
      progress: 0,
      is_today: false,
      is_current: false,
      sort_order: 1,
      created_at: "2025-01-01T00:00:00.000Z",
      updated_at: "2025-01-01T00:00:00.000Z",
    },
    {
      id: "b",
      user_id: "user-1",
      title: "Task B",
      status: "in_progress",
      task_mode: "todo_list",
      next_action: "Resume",
      manual_progress: 20,
      estimated_minutes: 30,
      elapsed_seconds: 180,
      current_session_started_at: "2025-01-02T00:10:00.000Z",
      todo_items: [
        { id: "todo-1", text: "Resume", done: true },
        { id: "todo-2", text: "Finish sync", done: false },
      ],
      progress: 50,
      is_today: true,
      is_current: true,
      sort_order: 0,
      created_at: "2025-01-02T00:00:00.000Z",
      updated_at: "2025-01-02T00:00:00.000Z",
    },
  ];
  const settingsRow: DashboardSettingsRow = {
    user_id: "user-1",
    today_goal: "Ship cloud sync",
    focus_enabled: true,
    focus_duration: 50,
    focus_last_session_started_at: "2025-01-02T01:00:00.000Z",
    last_viewed_at: "2025-01-02T02:00:00.000Z",
  };

  const state = mapRowsToDashboardState(taskRows, settingsRow);

  assert.equal(state.todayGoal, "Ship cloud sync");
  assert.deepEqual(state.taskOrder, ["b", "a"]);
  assert.equal(state.tasks.find((task) => task.id === "b")?.isCurrent, true);
  assert.equal(state.tasks.find((task) => task.id === "b")?.taskMode, "todo_list");
  assert.equal(state.tasks.find((task) => task.id === "b")?.todoItems.length, 2);
  assert.equal(state.tasks.find((task) => task.id === "b")?.estimatedMinutes, 30);
  assert.equal(state.tasks.find((task) => task.id === "b")?.elapsedSeconds, 180);
  assert.equal(state.focus.enabled, true);
});

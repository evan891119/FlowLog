import test from "node:test";
import assert from "node:assert/strict";
import { defaultState } from "@/lib/dashboard-state";
import {
  applyDashboardSettingsFromRow,
  applyTaskDeleteFromRow,
  applyTaskUpsertFromRow,
  createDashboardStateSignature,
  shouldApplyRemoteDashboardState,
} from "@/lib/dashboard-sync";
import type { DashboardSettingsRow, TaskRow } from "@/lib/dashboard-cloud";

test("dashboard state signature stays stable for equivalent states", () => {
  const state = {
    ...defaultState,
    todayGoal: "Ship live sync",
    taskOrder: ["task-1"],
    tasks: [
      {
        id: "task-1",
        title: "Ship sync",
        status: "in_progress" as const,
        taskMode: "todo_list" as const,
        nextAction: "Verify on iPhone",
        manualProgress: 25,
        estimatedMinutes: 30,
        elapsedSeconds: 120,
        currentSessionStartedAt: "2026-04-08T10:00:00.000Z",
        todoItems: [
          { id: "todo-1", text: "Wire realtime", done: true },
          { id: "todo-2", text: "Test two devices", done: false },
        ],
        isToday: true,
        isCurrent: true,
        createdAt: "2026-04-08T09:00:00.000Z",
        updatedAt: "2026-04-08T10:05:00.000Z",
      },
    ],
    focus: {
      duration: 45,
      lastSessionStartedAt: "2026-04-08T10:00:00.000Z",
    },
    lastViewedAt: "2026-04-08T10:06:00.000Z",
  };

  const clonedState = structuredClone(state);

  assert.equal(createDashboardStateSignature(state), createDashboardStateSignature(clonedState));
  assert.equal(shouldApplyRemoteDashboardState(state, clonedState), false);
});

test("remote dashboard state is applied when persisted data changes", () => {
  const currentState = {
    ...defaultState,
    todayGoal: "Draft release notes",
  };
  const remoteState = {
    ...defaultState,
    todayGoal: "Draft release notes and verify sync",
  };

  assert.equal(shouldApplyRemoteDashboardState(currentState, remoteState), true);
});

test("task upsert inserts a new task at its sort order", () => {
  const state = {
    ...defaultState,
    taskOrder: ["a", "c"],
    tasks: [
      {
        id: "a",
        title: "Task A",
        status: "not_started" as const,
        taskMode: "next_action" as const,
        nextAction: "",
        manualProgress: 0,
        estimatedMinutes: null,
        elapsedSeconds: 0,
        currentSessionStartedAt: null,
        todoItems: [],
        isToday: false,
        isCurrent: false,
        createdAt: "2026-04-08T09:00:00.000Z",
        updatedAt: "2026-04-08T09:00:00.000Z",
      },
      {
        id: "c",
        title: "Task C",
        status: "not_started" as const,
        taskMode: "next_action" as const,
        nextAction: "",
        manualProgress: 0,
        estimatedMinutes: null,
        elapsedSeconds: 0,
        currentSessionStartedAt: null,
        todoItems: [],
        isToday: false,
        isCurrent: false,
        createdAt: "2026-04-08T09:00:00.000Z",
        updatedAt: "2026-04-08T09:00:00.000Z",
      },
    ],
  };
  const row: TaskRow = {
    id: "b",
    user_id: "user-1",
    title: "Task B",
    status: "in_progress",
    task_mode: "todo_list",
    next_action: "Follow up",
    manual_progress: 30,
    estimated_minutes: 45,
    elapsed_seconds: 60,
    current_session_started_at: null,
    todo_items: [{ id: "todo-1", text: "Wire realtime", done: false }],
    progress: 0,
    is_today: true,
    is_current: false,
    sort_order: 1,
    created_at: "2026-04-08T10:00:00.000Z",
    updated_at: "2026-04-08T10:05:00.000Z",
  };

  const nextState = applyTaskUpsertFromRow(state, row);

  assert.deepEqual(nextState.taskOrder, ["a", "b", "c"]);
  assert.equal(nextState.tasks[1]?.id, "b");
  assert.equal(nextState.tasks[1]?.taskMode, "todo_list");
  assert.equal(nextState.tasks[1]?.isToday, true);
});

test("task upsert updates an existing task and reorders it", () => {
  const state = {
    ...defaultState,
    taskOrder: ["a", "b", "c"],
    tasks: [
      {
        id: "a",
        title: "Task A",
        status: "not_started" as const,
        taskMode: "next_action" as const,
        nextAction: "",
        manualProgress: 0,
        estimatedMinutes: null,
        elapsedSeconds: 0,
        currentSessionStartedAt: null,
        todoItems: [],
        isToday: false,
        isCurrent: false,
        createdAt: "2026-04-08T09:00:00.000Z",
        updatedAt: "2026-04-08T09:00:00.000Z",
      },
      {
        id: "b",
        title: "Task B",
        status: "not_started" as const,
        taskMode: "next_action" as const,
        nextAction: "",
        manualProgress: 0,
        estimatedMinutes: null,
        elapsedSeconds: 0,
        currentSessionStartedAt: null,
        todoItems: [],
        isToday: false,
        isCurrent: false,
        createdAt: "2026-04-08T09:00:00.000Z",
        updatedAt: "2026-04-08T09:00:00.000Z",
      },
      {
        id: "c",
        title: "Task C",
        status: "not_started" as const,
        taskMode: "next_action" as const,
        nextAction: "",
        manualProgress: 0,
        estimatedMinutes: null,
        elapsedSeconds: 0,
        currentSessionStartedAt: null,
        todoItems: [],
        isToday: false,
        isCurrent: false,
        createdAt: "2026-04-08T09:00:00.000Z",
        updatedAt: "2026-04-08T09:00:00.000Z",
      },
    ],
  };
  const row: TaskRow = {
    id: "c",
    user_id: "user-1",
    title: "Task C Updated",
    status: "done",
    task_mode: "next_action",
    next_action: "Ship it",
    manual_progress: 100,
    estimated_minutes: null,
    elapsed_seconds: 600,
    current_session_started_at: null,
    todo_items: [],
    progress: 100,
    is_today: false,
    is_current: true,
    sort_order: 0,
    created_at: "2026-04-08T09:00:00.000Z",
    updated_at: "2026-04-08T10:10:00.000Z",
  };

  const nextState = applyTaskUpsertFromRow(state, row);

  assert.deepEqual(nextState.taskOrder, ["c", "a", "b"]);
  assert.equal(nextState.tasks[0]?.title, "Task C Updated");
  assert.equal(nextState.tasks[0]?.status, "done");
  assert.equal(nextState.tasks[0]?.isCurrent, false);
});

test("task delete removes the task from tasks and order", () => {
  const state = {
    ...defaultState,
    taskOrder: ["a", "b"],
    tasks: [
      {
        id: "a",
        title: "Task A",
        status: "not_started" as const,
        taskMode: "next_action" as const,
        nextAction: "",
        manualProgress: 0,
        estimatedMinutes: null,
        elapsedSeconds: 0,
        currentSessionStartedAt: null,
        todoItems: [],
        isToday: false,
        isCurrent: false,
        createdAt: "2026-04-08T09:00:00.000Z",
        updatedAt: "2026-04-08T09:00:00.000Z",
      },
      {
        id: "b",
        title: "Task B",
        status: "in_progress" as const,
        taskMode: "next_action" as const,
        nextAction: "",
        manualProgress: 20,
        estimatedMinutes: 30,
        elapsedSeconds: 20,
        currentSessionStartedAt: null,
        todoItems: [],
        isToday: true,
        isCurrent: true,
        createdAt: "2026-04-08T09:00:00.000Z",
        updatedAt: "2026-04-08T09:00:00.000Z",
      },
    ],
  };

  const nextState = applyTaskDeleteFromRow(state, { id: "b" });

  assert.deepEqual(nextState.taskOrder, ["a"]);
  assert.deepEqual(nextState.tasks.map((task) => task.id), ["a"]);
});

test("settings upsert merges focus and goal fields", () => {
  const row: DashboardSettingsRow = {
    user_id: "user-1",
    today_goal: "Finish sync refactor",
    focus_duration: 50,
    focus_last_session_started_at: "2026-04-08T12:00:00.000Z",
    last_viewed_at: "2026-04-08T12:05:00.000Z",
  };

  const nextState = applyDashboardSettingsFromRow(defaultState, row);

  assert.equal(nextState.todayGoal, "Finish sync refactor");
  assert.equal(nextState.focus.duration, 50);
  assert.equal(nextState.focus.lastSessionStartedAt, "2026-04-08T12:00:00.000Z");
  assert.equal(nextState.lastViewedAt, "2026-04-08T12:05:00.000Z");
});

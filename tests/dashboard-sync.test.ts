import test from "node:test";
import assert from "node:assert/strict";
import { defaultState } from "@/lib/dashboard-state";
import { createDashboardStateSignature, shouldApplyRemoteDashboardState } from "@/lib/dashboard-sync";

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

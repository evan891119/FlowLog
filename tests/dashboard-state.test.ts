import test from "node:test";
import assert from "node:assert/strict";
import {
  createTaskInState,
  defaultState,
  deleteTaskInState,
  getSafeInitialState,
  moveTaskInState,
  setCurrentTaskInState,
  setTaskStatusInState,
  startFocusSessionInState,
  stopFocusSessionInState,
  updateTaskInState,
  updateFocusSettingsInState,
} from "@/lib/dashboard-state";
import { DashboardState } from "@/types/dashboard";

function createSampleState(): DashboardState {
  let state = createTaskInState(defaultState, { title: "Task 1", isToday: true });
  state = createTaskInState(state, { title: "Task 2" });
  state = createTaskInState(state, { title: "Task 3" });
  return state;
}

test("keeps only one eligible current task during normalization", () => {
  const normalized = getSafeInitialState({
    ...defaultState,
    tasks: [
      {
        id: "a",
        title: "A",
        status: "in_progress",
        nextAction: "",
        progress: 10,
        isToday: false,
        isCurrent: true,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z",
      },
      {
        id: "b",
        title: "B",
        status: "blocked",
        nextAction: "",
        progress: 10,
        isToday: false,
        isCurrent: true,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z",
      },
      {
        id: "c",
        title: "C",
        status: "not_started",
        nextAction: "",
        progress: 0,
        isToday: false,
        isCurrent: true,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z",
      },
    ],
    taskOrder: ["c", "a", "c", "missing"],
  });

  assert.equal(normalized.tasks.filter((task) => task.isCurrent).length, 1);
  assert.equal(normalized.tasks.find((task) => task.id === "a")?.isCurrent, true);
  assert.equal(normalized.tasks.find((task) => task.id === "b")?.isCurrent, false);
  assert.deepEqual(normalized.taskOrder, ["c", "a", "b"]);
});

test("clears current task when status becomes blocked or done", () => {
  let state = createSampleState();
  const taskId = state.tasks[0].id;

  state = setCurrentTaskInState(state, taskId);
  state = setTaskStatusInState(state, taskId, "blocked");
  assert.equal(state.tasks.find((task) => task.id === taskId)?.isCurrent, false);

  state = setCurrentTaskInState(state, state.tasks[1].id);
  state = setTaskStatusInState(state, state.tasks[1].id, "done");
  assert.equal(state.tasks.find((task) => task.id === state.tasks[1].id)?.isCurrent, false);
});

test("deletes tasks from both task data and task order", () => {
  let state = createSampleState();
  const currentTaskId = state.tasks[1].id;

  state = setCurrentTaskInState(state, currentTaskId);
  state = deleteTaskInState(state, currentTaskId);

  assert.equal(state.tasks.some((task) => task.id === currentTaskId), false);
  assert.equal(state.taskOrder.includes(currentTaskId), false);
  assert.equal(state.tasks.some((task) => task.isCurrent), false);
});

test("moves tasks up and down through canonical task order", () => {
  let state = createSampleState();
  const initialOrder = [...state.taskOrder];
  const middleTaskId = initialOrder[1];

  state = moveTaskInState(state, middleTaskId, "up");
  assert.deepEqual(state.taskOrder, [middleTaskId, initialOrder[0], initialOrder[2]]);

  state = moveTaskInState(state, middleTaskId, "down");
  assert.deepEqual(state.taskOrder, initialOrder);
});

test("updates and controls focus session state", () => {
  let state = updateFocusSettingsInState(defaultState, { enabled: true, duration: 50 });
  assert.equal(state.focus.enabled, true);
  assert.equal(state.focus.duration, 50);

  state = startFocusSessionInState(state);
  assert.equal(typeof state.focus.lastSessionStartedAt, "string");

  state = stopFocusSessionInState(state);
  assert.equal(state.focus.lastSessionStartedAt, null);
});

test("allows task titles to be cleared during editing", () => {
  let state = createSampleState();
  const taskId = state.tasks[0].id;

  state = updateTaskInState(state, taskId, { title: "" });
  assert.equal(state.tasks.find((task) => task.id === taskId)?.title, "");

  state = updateTaskInState(state, taskId, { title: "   " });
  assert.equal(state.tasks.find((task) => task.id === taskId)?.title, "   ");
});

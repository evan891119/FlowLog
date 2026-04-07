import test from "node:test";
import assert from "node:assert/strict";
import {
  addTaskTodoItemInState,
  createTaskInState,
  defaultState,
  deleteTaskInState,
  getTaskElapsedSeconds,
  getTaskProgress,
  getTaskRemainingRatio,
  getTaskRemainingSeconds,
  getSafeInitialState,
  moveTaskInState,
  setCurrentTaskInState,
  setTaskModeInState,
  setTaskStatusInState,
  startFocusSessionInState,
  stopFocusSessionInState,
  toggleTaskTodoItemInState,
  updateTaskInState,
  updateTaskTodoItemInState,
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
        taskMode: "next_action",
        nextAction: "",
        manualProgress: 10,
        todoItems: [],
        isToday: false,
        isCurrent: true,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z",
      },
      {
        id: "b",
        title: "B",
        status: "blocked",
        taskMode: "next_action",
        nextAction: "",
        manualProgress: 10,
        todoItems: [],
        isToday: false,
        isCurrent: true,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z",
      },
      {
        id: "c",
        title: "C",
        status: "not_started",
        taskMode: "next_action",
        nextAction: "",
        manualProgress: 0,
        todoItems: [],
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
  assert.equal(state.tasks.find((task) => task.id === state.tasks[1].id)?.currentSessionStartedAt, null);
});

test("starts task timer when a timed task becomes current and pauses the previous task", () => {
  let state = createSampleState();
  const firstTaskId = state.tasks[0].id;
  const secondTaskId = state.tasks[1].id;

  state = updateTaskInState(state, firstTaskId, { estimatedMinutes: 30 });
  state = updateTaskInState(state, secondTaskId, { estimatedMinutes: 15 });
  state = setCurrentTaskInState(state, firstTaskId);

  const firstStartedAt = state.tasks.find((task) => task.id === firstTaskId)?.currentSessionStartedAt;
  assert.equal(typeof firstStartedAt, "string");

  state = {
    ...state,
    tasks: state.tasks.map((task) =>
      task.id === firstTaskId && firstStartedAt
        ? {
            ...task,
            currentSessionStartedAt: new Date(Date.now() - 90_000).toISOString(),
          }
        : task,
    ),
  };

  state = setCurrentTaskInState(state, secondTaskId);

  const firstTask = state.tasks.find((task) => task.id === firstTaskId)!;
  const secondTask = state.tasks.find((task) => task.id === secondTaskId)!;

  assert.equal(firstTask.isCurrent, false);
  assert.equal(firstTask.currentSessionStartedAt, null);
  assert.ok(firstTask.elapsedSeconds >= 90);
  assert.equal(secondTask.isCurrent, true);
  assert.equal(typeof secondTask.currentSessionStartedAt, "string");
});

test("derives remaining task time from active and paused sessions", () => {
  let state = createSampleState();
  const taskId = state.tasks[0].id;

  state = updateTaskInState(state, taskId, { estimatedMinutes: 10 });
  state = setCurrentTaskInState(state, taskId);
  state = {
    ...state,
    tasks: state.tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            elapsedSeconds: 120,
            currentSessionStartedAt: "2025-01-01T00:00:00.000Z",
          }
        : task,
    ),
  };

  const task = state.tasks.find((entry) => entry.id === taskId)!;
  const now = new Date("2025-01-01T00:03:30.000Z").getTime();

  assert.equal(getTaskElapsedSeconds(task, now), 330);
  assert.equal(getTaskRemainingSeconds(task, now), 270);
  assert.equal(getTaskRemainingRatio(task, now), 0.45);
});

test("starts or clears the timer when estimate changes on the current task", () => {
  let state = createSampleState();
  const taskId = state.tasks[0].id;

  state = setCurrentTaskInState(state, taskId);
  state = updateTaskInState(state, taskId, { estimatedMinutes: 20 });
  assert.equal(typeof state.tasks.find((task) => task.id === taskId)?.currentSessionStartedAt, "string");

  state = updateTaskInState(state, taskId, { estimatedMinutes: null });
  assert.equal(state.tasks.find((task) => task.id === taskId)?.currentSessionStartedAt, null);
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
  let state = updateFocusSettingsInState(defaultState, { duration: 50 });
  assert.equal(state.focus.duration, 50);

  state = startFocusSessionInState(state);
  assert.equal(typeof state.focus.lastSessionStartedAt, "string");

  state = stopFocusSessionInState(state);
  assert.equal(state.focus.lastSessionStartedAt, null);
});

test("ignores legacy focus enabled state during hydration", () => {
  const state = getSafeInitialState({
    ...defaultState,
    focus: {
      enabled: true,
      duration: 15,
      lastSessionStartedAt: "2025-01-01T00:00:00.000Z",
    },
  });

  assert.deepEqual(state.focus, {
    duration: 15,
    lastSessionStartedAt: "2025-01-01T00:00:00.000Z",
  });
});

test("allows task titles to be cleared during editing", () => {
  let state = createSampleState();
  const taskId = state.tasks[0].id;

  state = updateTaskInState(state, taskId, { title: "" });
  assert.equal(state.tasks.find((task) => task.id === taskId)?.title, "");

  state = updateTaskInState(state, taskId, { title: "   " });
  assert.equal(state.tasks.find((task) => task.id === taskId)?.title, "   ");
});

test("derives progress from manual progress and todo completion", () => {
  let state = createSampleState();
  const taskId = state.tasks[0].id;

  state = updateTaskInState(state, taskId, { manualProgress: 37 });
  assert.equal(getTaskProgress(state.tasks.find((task) => task.id === taskId)!), 37);

  state = updateTaskInState(state, taskId, { nextAction: "Write tests" });
  state = setTaskModeInState(state, taskId, "todo_list");

  const todoModeTask = state.tasks.find((task) => task.id === taskId)!;
  assert.equal(todoModeTask.todoItems.length, 1);
  assert.equal(todoModeTask.todoItems[0].text, "Write tests");
  assert.equal(getTaskProgress(todoModeTask), 0);

  state = addTaskTodoItemInState(state, taskId);
  const secondTodoId = state.tasks.find((task) => task.id === taskId)!.todoItems[1].id;
  state = updateTaskTodoItemInState(state, taskId, secondTodoId, "Ship feature");
  state = toggleTaskTodoItemInState(state, taskId, secondTodoId);

  assert.equal(getTaskProgress(state.tasks.find((task) => task.id === taskId)!), 50);
});

test("restores next action from first incomplete todo when switching back", () => {
  let state = createSampleState();
  const taskId = state.tasks[0].id;

  state = updateTaskInState(state, taskId, { nextAction: "Draft spec" });
  state = setTaskModeInState(state, taskId, "todo_list");

  const firstTodoId = state.tasks.find((task) => task.id === taskId)!.todoItems[0].id;
  state = toggleTaskTodoItemInState(state, taskId, firstTodoId);
  state = addTaskTodoItemInState(state, taskId);
  const secondTodoId = state.tasks.find((task) => task.id === taskId)!.todoItems[1].id;
  state = updateTaskTodoItemInState(state, taskId, secondTodoId, "Implement detail panel");
  state = setTaskModeInState(state, taskId, "next_action");

  assert.equal(state.tasks.find((task) => task.id === taskId)?.nextAction, "Implement detail panel");
});

test("restores missing task timer fields safely from older payloads", () => {
  const normalized = getSafeInitialState({
    ...defaultState,
    tasks: [
      {
        id: "legacy-task",
        title: "Legacy",
        status: "not_started",
        taskMode: "next_action",
        nextAction: "",
        manualProgress: 0,
        todoItems: [],
        isToday: true,
        isCurrent: false,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z",
      },
    ],
  });

  assert.deepEqual(normalized.tasks[0]?.estimatedMinutes, null);
  assert.equal(normalized.tasks[0]?.elapsedSeconds, 0);
  assert.equal(normalized.tasks[0]?.currentSessionStartedAt, null);
});

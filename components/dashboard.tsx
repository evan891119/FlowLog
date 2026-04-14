"use client";

import { useEffect, useState } from "react";
import { AccountMenu } from "@/components/account-menu";
import { CurrentTaskPanel } from "@/components/current-task-panel";
import { FloatingFocusTimer } from "@/components/floating-focus-timer";
import { TaskListSection } from "@/components/task-list-section";
import { TodayTaskDetailPanel } from "@/components/today-task-detail-panel";
import { TodayTaskList } from "@/components/today-task-list";
import { getTaskRemainingSeconds } from "@/lib/dashboard-state";
import { useScreenWakeLock } from "@/lib/use-screen-wake-lock";
import { useDashboardState } from "@/lib/use-dashboard-state";
import { DashboardState, Task } from "@/types/dashboard";

type DashboardTab = "today" | "tasks" | "archive";
type DashboardProps = {
  initialState: DashboardState;
  userId: string;
  userEmail?: string | null;
};

const DASHBOARD_TABS: { id: DashboardTab; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "tasks", label: "Tasks" },
  { id: "archive", label: "Archive" },
];

function sortByOrder(tasks: Task[], taskOrder: string[]) {
  const orderMap = new Map(taskOrder.map((taskId, index) => [taskId, index]));

  return [...tasks].sort((a, b) => (orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER));
}

export function Dashboard({ initialState, userId, userEmail }: DashboardProps) {
  const [selectedTab, setSelectedTab] = useState<DashboardTab>("today");
  const [selectedTodayTaskId, setSelectedTodayTaskId] = useState<string | null>(null);
  const [isTodayTaskDetailOpen, setIsTodayTaskDetailOpen] = useState(false);
  const [isBlockedTasksOpen, setIsBlockedTasksOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const wakeLock = useScreenWakeLock();
  const {
    state,
    createTask,
    createTodayTask,
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
  } = useDashboardState(initialState, userId);

  const orderedTasks = sortByOrder(state.tasks, state.taskOrder);
  const currentTask = orderedTasks.find((task) => task.isCurrent) ?? null;
  const todayTasks = orderedTasks.filter((task) => task.isToday && task.status !== "done");
  const activeTasks = orderedTasks.filter((task) => task.status === "not_started" || task.status === "in_progress");
  const blockedTasks = orderedTasks.filter((task) => task.status === "blocked");
  const completedTasks = orderedTasks.filter((task) => task.status === "done");
  const orderIndexMap = new Map(orderedTasks.map((task, index) => [task.id, index]));

  const canMoveUp = (taskId: string) => (orderIndexMap.get(taskId) ?? 0) > 0;
  const canMoveDown = (taskId: string) => (orderIndexMap.get(taskId) ?? -1) < orderedTasks.length - 1;
  const selectedTodayTask = todayTasks.find((task) => task.id === selectedTodayTaskId) ?? todayTasks[0] ?? null;
  const isTaskTimerRunning = currentTask
    ? currentTask.currentSessionStartedAt !== null && currentTask.estimatedMinutes !== null && (getTaskRemainingSeconds(currentTask, now) ?? 0) > 0
    : false;

  useEffect(() => {
    if (!isTaskTimerRunning) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isTaskTimerRunning]);

  useEffect(() => {
    if (!todayTasks.length) {
      setSelectedTodayTaskId(null);
      setIsTodayTaskDetailOpen(false);
      return;
    }

    if (!selectedTodayTaskId || !todayTasks.some((task) => task.id === selectedTodayTaskId)) {
      setSelectedTodayTaskId(todayTasks[0].id);
    }
  }, [todayTasks, selectedTodayTaskId]);

  useEffect(() => {
    if (!isTodayTaskDetailOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsTodayTaskDetailOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isTodayTaskDetailOpen]);

  const handleSelectTodayTask = (taskId: string) => {
    setSelectedTodayTaskId(taskId);
    setIsTodayTaskDetailOpen(true);
  };

  return (
    <main className="min-h-screen px-4 py-5 pb-40 md:px-6 md:py-5 md:pb-48">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-steel dark:text-slate-300">Work-state dashboard</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink dark:text-white md:text-[2.25rem]">FlowLog</h1>
            <p className="mt-2 max-w-xl text-sm text-steel dark:text-slate-300 md:text-base">
              Open the page and recover context fast: what matters today, what is active now, and what the next step is.
            </p>
            {userEmail ? <p className="mt-2 text-sm text-steel dark:text-slate-300">Signed in as {userEmail}</p> : null}
          </div>
          <div className="flex w-full flex-col gap-3 xl:w-auto xl:max-w-[34rem] xl:items-end">
            <div className="flex flex-wrap gap-2 xl:justify-end">
              <AccountMenu
                userEmail={userEmail}
                screenAwake={{
                  enabled: wakeLock.isEnabled,
                  supported: wakeLock.isSupported,
                  ready: wakeLock.isReady,
                  active: wakeLock.isActive,
                  statusMessage: wakeLock.statusMessage,
                  onEnabledChange: wakeLock.setEnabled,
                }}
              />
            </div>

            <label className="block w-full xl:max-w-[34rem]">
              <span className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-steel dark:text-slate-300">Today Goal</span>
              <input
                type="text"
                className="dark-surface w-full rounded-full bg-mist px-4 py-3 text-sm text-ink outline-none placeholder:text-steel/70 dark:border dark:text-white dark:placeholder:text-slate-500"
                placeholder="Finish the first usable FlowLog dashboard."
                value={state.todayGoal}
                onChange={(event) => updateTodayGoal(event.target.value)}
                aria-label="Today goal"
              />
            </label>
          </div>
        </header>

        <nav className="mb-5 flex items-center gap-5 overflow-x-auto pb-1" aria-label="Dashboard sections">
          {DASHBOARD_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`relative whitespace-nowrap pb-2 text-sm font-semibold transition ${
                selectedTab === tab.id ? "text-ink dark:text-white" : "text-steel hover:text-ink dark:text-slate-300 dark:hover:text-white"
              }`}
              onClick={() => setSelectedTab(tab.id)}
              aria-pressed={selectedTab === tab.id}
            >
              {tab.label}
              <span
                className={`absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-clay transition ${
                  selectedTab === tab.id ? "opacity-100" : "opacity-0"
                }`}
                aria-hidden="true"
              />
            </button>
          ))}
        </nav>

        {selectedTab === "today" ? (
          <>
            <section className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr] xl:items-start">
              <div className="order-2 xl:order-1">
                <TodayTaskList
                  tasks={todayTasks}
                  selectedTaskId={selectedTodayTask?.id ?? null}
                  onSelectTask={handleSelectTodayTask}
                  action={
                    <button type="button" className="ui-button-primary rounded-full px-4 py-2.5 text-sm font-semibold" onClick={createTodayTask}>
                      Add task
                    </button>
                  }
                  now={now}
                />
              </div>

              <div className="order-1 space-y-4 xl:order-2">
                <CurrentTaskPanel task={currentTask} variant="summary" now={now} />
              </div>

              {isTodayTaskDetailOpen ? (
                <>
                  <div
                    className="dark-overlay fixed inset-0 z-[60] flex items-center justify-center bg-ink/28 p-4 backdrop-blur-[2px] md:p-6"
                    onClick={() => setIsTodayTaskDetailOpen(false)}
                  >
                    <div className="w-full max-w-4xl" onClick={(event) => event.stopPropagation()}>
                      <TodayTaskDetailPanel
                        task={selectedTodayTask}
                        onSetCurrent={toggleCurrentTask}
                        onStatusChange={updateTaskStatus}
                        onToggleToday={toggleToday}
                        onTitleChange={updateTaskTitle}
                        onNextActionChange={updateTaskNextAction}
                        onTaskModeChange={updateTaskMode}
                        onManualProgressChange={updateTaskManualProgress}
                        onEstimatedMinutesChange={updateTaskEstimatedMinutes}
                        onAddTodoItem={addTaskTodoItem}
                        onUpdateTodoItem={updateTaskTodoItem}
                        onToggleTodoItem={toggleTaskTodoItem}
                        onDeleteTodoItem={deleteTaskTodoItem}
                        headerAction={
                          <button
                            type="button"
                            className="ui-button-secondary rounded-full px-3.5 py-2 text-sm font-medium"
                            onClick={() => setIsTodayTaskDetailOpen(false)}
                          >
                            Close
                          </button>
                        }
                        className="w-full rounded-[32px] shadow-[0_30px_80px_rgba(8,14,22,0.38)]"
                        bodyClassName="max-h-[min(70vh,42rem)] overflow-y-auto pr-1"
                      />
                    </div>
                  </div>
                </>
              ) : null}
            </section>
          </>
        ) : null}

        {selectedTab === "tasks" ? (
          <section className="space-y-4">
            <TaskListSection
              title="Active Tasks"
              description="Your working list, excluding blocked and completed items."
              tasks={activeTasks}
              emptyMessage="No active tasks yet. Add one task to start the first FlowLog session."
              action={
                <button type="button" className="ui-button-secondary rounded-full px-3.5 py-2 text-sm font-medium" onClick={createTask}>
                  Add task
                </button>
              }
              onSetCurrent={toggleCurrentTask}
              onStatusChange={updateTaskStatus}
              onToggleToday={toggleToday}
              onTitleChange={updateTaskTitle}
              onNextActionChange={updateTaskNextAction}
              onTaskModeChange={updateTaskMode}
              onManualProgressChange={updateTaskManualProgress}
              onEstimatedMinutesChange={updateTaskEstimatedMinutes}
              onAddTodoItem={addTaskTodoItem}
              onUpdateTodoItem={updateTaskTodoItem}
              onToggleTodoItem={toggleTaskTodoItem}
              onDeleteTodoItem={deleteTaskTodoItem}
              onDelete={deleteTask}
              onMoveUp={moveTaskUp}
              onMoveDown={moveTaskDown}
              canMoveUp={canMoveUp}
              canMoveDown={canMoveDown}
            />

            <section className="dark-panel rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-panel backdrop-blur">
              <button
                type="button"
                className="flex w-full items-start justify-between gap-4 text-left"
                onClick={() => setIsBlockedTasksOpen((open) => !open)}
                aria-expanded={isBlockedTasksOpen}
                aria-controls="blocked-tasks-panel"
              >
                <div>
                  <h2 className="text-lg font-semibold text-ink dark:text-white">Blocked Tasks ({blockedTasks.length})</h2>
                  <p className="mt-1 text-sm text-steel dark:text-slate-300">Visible, but kept out of the main working lane.</p>
                </div>
                <span className="shrink-0 pt-1 text-sm font-semibold text-steel dark:text-slate-300">
                  {isBlockedTasksOpen ? "Hide" : "Show"}
                </span>
              </button>

              {isBlockedTasksOpen ? (
                <div id="blocked-tasks-panel" className="mt-4">
                  <TaskListSection
                    title="Blocked Tasks"
                    description="Visible, but kept out of the main working lane."
                    tasks={blockedTasks}
                    emptyMessage="Nothing is blocked right now."
                    hideHeader
                    className="border-0 bg-transparent p-0 shadow-none backdrop-blur-0"
                    onSetCurrent={toggleCurrentTask}
                    onStatusChange={updateTaskStatus}
                    onToggleToday={toggleToday}
                    onTitleChange={updateTaskTitle}
                    onNextActionChange={updateTaskNextAction}
                    onTaskModeChange={updateTaskMode}
                    onManualProgressChange={updateTaskManualProgress}
                    onEstimatedMinutesChange={updateTaskEstimatedMinutes}
                    onAddTodoItem={addTaskTodoItem}
                    onUpdateTodoItem={updateTaskTodoItem}
                    onToggleTodoItem={toggleTaskTodoItem}
                    onDeleteTodoItem={deleteTaskTodoItem}
                    onDelete={deleteTask}
                    onMoveUp={moveTaskUp}
                    onMoveDown={moveTaskDown}
                    canMoveUp={canMoveUp}
                    canMoveDown={canMoveDown}
                  />
                </div>
              ) : null}
            </section>
          </section>
        ) : null}

        {selectedTab === "archive" ? (
          <section>
            <TaskListSection
              title="Completed Tasks"
              description="Finished work stays visible without dominating the page."
              tasks={completedTasks}
              emptyMessage="Nothing has been completed yet."
              onSetCurrent={toggleCurrentTask}
              onStatusChange={updateTaskStatus}
              onToggleToday={toggleToday}
              onTitleChange={updateTaskTitle}
              onNextActionChange={updateTaskNextAction}
              onTaskModeChange={updateTaskMode}
              onManualProgressChange={updateTaskManualProgress}
              onEstimatedMinutesChange={updateTaskEstimatedMinutes}
              onAddTodoItem={addTaskTodoItem}
              onUpdateTodoItem={updateTaskTodoItem}
              onToggleTodoItem={toggleTaskTodoItem}
              onDeleteTodoItem={deleteTaskTodoItem}
              onDelete={deleteTask}
              onMoveUp={moveTaskUp}
              onMoveDown={moveTaskDown}
              canMoveUp={canMoveUp}
              canMoveDown={canMoveDown}
            />
          </section>
        ) : null}

        <FloatingFocusTimer
          focus={state.focus}
          onDurationChange={setFocusDuration}
          onStart={startFocusSession}
          onStop={stopFocusSession}
        />
      </div>
    </main>
  );
}

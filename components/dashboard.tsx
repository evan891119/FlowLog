"use client";

import { useEffect, useState } from "react";
import { AccountMenu } from "@/components/account-menu";
import { CurrentTaskPanel } from "@/components/current-task-panel";
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
  initialNow: number;
  userId: string;
  userEmail?: string | null;
};

const DASHBOARD_TABS: { id: DashboardTab; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "tasks", label: "Tasks" },
  { id: "archive", label: "Archive" },
];

const NAV_ITEMS: { id: DashboardTab; label: string; icon: "home" | "tasks" | "archive" }[] = [
  { id: "today", label: "Dashboard", icon: "home" },
  { id: "tasks", label: "Tasks", icon: "tasks" },
  { id: "archive", label: "Archive", icon: "archive" },
];

function sortByOrder(tasks: Task[], taskOrder: string[]) {
  const orderMap = new Map(taskOrder.map((taskId, index) => [taskId, index]));

  return [...tasks].sort((a, b) => (orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER));
}

function getFocusRemainingSeconds(duration: number, startedAt: string | null, now: number) {
  if (!startedAt) {
    return duration * 60;
  }

  const elapsedSeconds = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  return Math.max(0, duration * 60 - elapsedSeconds);
}

function formatFocusMinutes(totalSeconds: number) {
  return Math.ceil(totalSeconds / 60).toString();
}

type IconName = "home" | "tasks" | "archive" | "leaf" | "timer" | "edit" | "chart" | "gear" | "stop";

function Icon({ name, className = "h-4 w-4" }: { name: IconName; className?: string }) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "home") {
    return (
      <svg {...common}>
        <path d="m3 11 9-7 9 7" />
        <path d="M5 10v10h14V10" />
        <path d="M9 20v-6h6v6" />
      </svg>
    );
  }

  if (name === "tasks") {
    return (
      <svg {...common}>
        <path d="M8 7h12" />
        <path d="M8 12h12" />
        <path d="M8 17h12" />
        <path d="m3.5 7 1 1 2-2" />
        <path d="m3.5 12 1 1 2-2" />
        <path d="m3.5 17 1 1 2-2" />
      </svg>
    );
  }

  if (name === "archive") {
    return (
      <svg {...common}>
        <path d="M4 7h16" />
        <path d="M5 7l1 13h12l1-13" />
        <path d="M8 4h8l1 3H7l1-3Z" />
        <path d="M10 11h4" />
      </svg>
    );
  }

  if (name === "timer") {
    return (
      <svg {...common}>
        <path d="M9 2h6" />
        <path d="M12 14V9" />
        <path d="M19 13a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
      </svg>
    );
  }

  if (name === "edit") {
    return (
      <svg {...common}>
        <path d="M4 20h4l11-11a2.8 2.8 0 0 0-4-4L4 16v4Z" />
        <path d="m13.5 6.5 4 4" />
      </svg>
    );
  }

  if (name === "chart") {
    return (
      <svg {...common}>
        <path d="M4 19h16" />
        <path d="M7 16v-5" />
        <path d="M12 16V7" />
        <path d="M17 16v-8" />
      </svg>
    );
  }

  if (name === "gear") {
    return (
      <svg {...common}>
        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
        <path d="M19.4 15a8.2 8.2 0 0 0 .1-2l2-1.5-2-3.5-2.4 1a8.8 8.8 0 0 0-1.7-1L15 5.5h-4L10.6 8a8.8 8.8 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a8.2 8.2 0 0 0 .1 2l-2.1 1.5 2 3.5 2.5-1a8.5 8.5 0 0 0 1.6.9l.4 2.6h4l.4-2.6a8.5 8.5 0 0 0 1.6-.9l2.5 1 2-3.5L19.4 15Z" />
      </svg>
    );
  }

  if (name === "stop") {
    return (
      <svg {...common}>
        <path d="M7 7h10v10H7z" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M6 18c7-1 11-5 12-12-7 1-11 5-12 12Z" />
      <path d="M6 18c2-5 5-8 12-12" />
    </svg>
  );
}

export function Dashboard({ initialState, initialNow, userId, userEmail }: DashboardProps) {
  const [selectedTab, setSelectedTab] = useState<DashboardTab>("today");
  const [selectedTodayTaskId, setSelectedTodayTaskId] = useState<string | null>(null);
  const [isTodayTaskDetailOpen, setIsTodayTaskDetailOpen] = useState(false);
  const [isBlockedTasksOpen, setIsBlockedTasksOpen] = useState(false);
  const [now, setNow] = useState(initialNow);
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
  const inProgressCount = orderedTasks.filter((task) => task.status === "in_progress").length;
  const notStartedCount = orderedTasks.filter((task) => task.status === "not_started").length;
  const orderIndexMap = new Map(orderedTasks.map((task, index) => [task.id, index]));

  const canMoveUp = (taskId: string) => (orderIndexMap.get(taskId) ?? 0) > 0;
  const canMoveDown = (taskId: string) => (orderIndexMap.get(taskId) ?? -1) < orderedTasks.length - 1;
  const selectedTodayTask = todayTasks.find((task) => task.id === selectedTodayTaskId) ?? todayTasks[0] ?? null;
  const displayName = userEmail?.split("@")[0] || "sneezycat";
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
    <main className="min-h-screen bg-[var(--app-bg)] text-ink dark:text-white">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 z-50 hidden h-screen w-[17.5rem] shrink-0 self-start border-r border-[var(--panel-border)] bg-[var(--sidebar-bg)] px-7 py-8 lg:flex lg:flex-col">
          <div className="flex items-start gap-3">
            <Icon name="leaf" className="mt-0.5 h-7 w-7 text-[var(--accent)]" />
            <div>
              <p className="font-serif text-3xl leading-none tracking-tight text-[var(--heading)]">FlowLog</p>
              <p className="mt-2 text-xs text-[var(--muted)]">Work-state dashboard</p>
            </div>
          </div>

          <nav className="mt-14 space-y-3" aria-label="Dashboard sections">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`flex w-full items-center gap-4 rounded-lg px-4 py-3 text-sm font-medium transition ${
                  selectedTab === item.id
                    ? "bg-[var(--nav-active)] text-[var(--heading)]"
                    : "text-[var(--body)] hover:bg-[var(--nav-hover)] hover:text-[var(--heading)]"
                }`}
                onClick={() => setSelectedTab(item.id)}
                aria-pressed={selectedTab === item.id}
              >
                <Icon name={item.icon} className="h-5 w-5" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto">
            <div className="mb-12 flex justify-center opacity-60" aria-hidden="true">
              <div className="h-32 w-24 border-l border-[var(--panel-border)]">
                <div className="ml-4 mt-7 h-16 w-16 rounded-br-[4rem] rounded-tl-[4rem] border border-[var(--panel-border)]" />
                <div className="-ml-8 mt-2 h-14 w-14 rounded-bl-[4rem] rounded-tr-[4rem] border border-[var(--panel-border)]" />
              </div>
            </div>
            <AccountMenu
              userEmail={userEmail}
              placement="top"
              align="left"
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
        </aside>

        <div className="min-w-0 flex-1 px-4 py-6 pb-36 md:px-8 lg:px-10 xl:pb-8">
          <div className="mx-auto grid max-w-[102rem] gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="min-w-0">
              <header className="mb-7">
                <div className="flex items-center justify-between gap-3 lg:hidden">
                  <div className="flex items-start gap-3">
                    <Icon name="leaf" className="mt-0.5 h-6 w-6 text-[var(--accent)]" />
                    <div>
                      <p className="font-serif text-2xl leading-none tracking-tight text-[var(--heading)]">FlowLog</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">Work-state dashboard</p>
                    </div>
                  </div>
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

                <p className="mt-7 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)] lg:mt-0">Good day, {displayName}</p>
                <div className="mt-2 flex flex-wrap items-end gap-3">
                  <h1 className="font-serif text-5xl leading-none tracking-tight text-[var(--heading)] md:text-6xl">FlowLog</h1>
                  <Icon name="leaf" className="mb-2 h-8 w-8 text-[var(--accent)]" />
                </div>
                <p className="mt-5 max-w-xl text-sm leading-6 text-[var(--body)]">
                  Open the page and recover context fast: what matters today, what is active now, and what the next step is.
                </p>
                {userEmail ? <p className="mt-2 text-xs text-[var(--muted)]">Signed in as {userEmail}</p> : null}
              </header>

              <nav className="mb-4 flex items-center gap-7 overflow-x-auto border-b border-[var(--panel-border)] pb-0.5 lg:hidden" aria-label="Dashboard sections">
                {DASHBOARD_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`relative whitespace-nowrap pb-3 text-sm font-medium transition ${
                      selectedTab === tab.id ? "text-[var(--heading)]" : "text-[var(--muted)] hover:text-[var(--heading)]"
                    }`}
                    onClick={() => setSelectedTab(tab.id)}
                    aria-pressed={selectedTab === tab.id}
                  >
                    {tab.label}
                    <span
                      className={`absolute inset-x-0 bottom-[-2px] h-0.5 rounded-full bg-[var(--accent-strong)] transition ${
                        selectedTab === tab.id ? "opacity-100" : "opacity-0"
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </nav>

              {selectedTab === "today" ? (
                <>
                  <section className="grid gap-5 2xl:grid-cols-[0.94fr_1.06fr] 2xl:items-start">
                    <div>
                      <TodayTaskList
                        tasks={todayTasks}
                        selectedTaskId={selectedTodayTask?.id ?? null}
                        onSelectTask={handleSelectTodayTask}
                        action={
                          <button type="button" className="ui-button-primary rounded-lg px-4 py-2.5 text-sm font-semibold" onClick={createTodayTask}>
                            + Add task
                          </button>
                        }
                        now={now}
                      />
                    </div>

                    <div className="h-[26rem] 2xl:sticky 2xl:top-6 2xl:h-[calc(100vh-3rem)] 2xl:max-h-[42rem] 2xl:min-h-[30rem]">
                      <CurrentTaskPanel task={currentTask} variant="summary" now={now} />
                    </div>
                  </section>
                </>
              ) : null}

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
                        className="w-full rounded-[32px] border border-[var(--panel-border)] !bg-[#f6f3ee] p-5 shadow-[0_30px_80px_rgba(8,14,22,0.38)] dark:!bg-[#141b27]"
                        bodyClassName="max-h-[min(70vh,42rem)] overflow-y-auto pr-1"
                      />
                    </div>
                  </div>
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
                      <button type="button" className="ui-button-secondary rounded-lg px-3.5 py-2 text-sm font-medium" onClick={createTask}>
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

                  <section className="border-t border-[var(--panel-border)] pt-5">
                    <button
                      type="button"
                      className="flex w-full items-start justify-between gap-4 text-left"
                      onClick={() => setIsBlockedTasksOpen((open) => !open)}
                      aria-expanded={isBlockedTasksOpen}
                      aria-controls="blocked-tasks-panel"
                    >
                      <div>
                        <h2 className="text-lg font-semibold text-[var(--heading)]">Blocked Tasks ({blockedTasks.length})</h2>
                      </div>
                      <span className="shrink-0 pt-1 text-sm font-semibold text-[var(--muted)]">
                        {isBlockedTasksOpen ? "Hide" : "Show"}
                      </span>
                    </button>

                    {isBlockedTasksOpen ? (
                      <div id="blocked-tasks-panel" className="mt-4">
                        <TaskListSection
                          title="Blocked Tasks"
                          description=""
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
            </div>

            <aside className="space-y-8 xl:sticky xl:top-6 xl:self-start">
              <section className="border-t border-[var(--panel-border)] pt-5">
                <div className="mb-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                  <Icon name="leaf" className="h-4 w-4 text-[var(--accent)]" />
                  Today Goal
                </div>
                <div className="flex items-center gap-5">
                  <div className="hidden h-20 w-28 shrink-0 items-center justify-center text-[var(--muted)] sm:flex xl:flex" aria-hidden="true">
                    <div className="h-12 w-20 -rotate-6 border-y border-[var(--panel-border)]" />
                    <div className="-ml-5 h-14 w-8 border-l border-[var(--panel-border)]" />
                  </div>
                  <label className="min-w-0 flex-1">
                    <span className="group flex items-center gap-3 border-b border-transparent px-0 py-2 transition hover:border-[var(--panel-border)] focus-within:border-[var(--accent)]">
                      <input
                        type="text"
                        className="min-w-0 flex-1 bg-transparent font-serif text-xl text-[var(--heading)] outline-none placeholder:text-[var(--muted)]"
                        placeholder="Finish FlowLog"
                        value={state.todayGoal}
                        onChange={(event) => updateTodayGoal(event.target.value)}
                        aria-label="Today goal"
                      />
                    </span>
                  </label>
                </div>
              </section>

              <FocusTimerCard
                duration={state.focus.duration}
                startedAt={state.focus.lastSessionStartedAt}
                initialNow={initialNow}
                onDurationChange={setFocusDuration}
                onStart={startFocusSession}
                onStop={stopFocusSession}
              />

              <div className="grid grid-cols-2 gap-6 border-t border-[var(--panel-border)] pt-5">
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">At a Glance</h2>
                  <div className="mt-5 space-y-4 text-sm">
                    <StatRow color="bg-[var(--accent)]" label="Active task" value={currentTask ? 1 : 0} />
                    <StatRow color="bg-[var(--warning)]" label="In progress" value={inProgressCount} />
                    <StatRow color="bg-[var(--muted)]" label="Not started" value={notStartedCount} />
                  </div>
                </section>

                <section className="border-l border-[var(--panel-border)] pl-6">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Quick Actions</h2>
                  <div className="mt-5 space-y-3">
                    <button type="button" className="flex w-full items-center gap-3 py-1.5 text-left text-sm font-medium text-[var(--body)] transition hover:text-[var(--heading)]" onClick={createTodayTask}>
                      <Icon name="edit" className="h-4 w-4" />
                      New Today Task
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 py-1.5 text-left text-sm font-medium text-[var(--body)] transition hover:text-[var(--heading)]"
                      onClick={() => {
                        if (selectedTodayTask) {
                          setIsTodayTaskDetailOpen(true);
                        }
                      }}
                    >
                      <Icon name="chart" className="h-4 w-4" />
                      Log Progress
                    </button>
                  </div>
                </section>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatRow({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[var(--body)]">
      <span className="flex min-w-0 items-center gap-3">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${color}`} aria-hidden="true" />
        <span className="truncate">{label}</span>
      </span>
      <span className="font-medium text-[var(--heading)]">{value}</span>
    </div>
  );
}

function FocusTimerCard({
  duration,
  startedAt,
  initialNow,
  onDurationChange,
  onStart,
  onStop,
}: {
  duration: number;
  startedAt: string | null;
  initialNow: number;
  onDurationChange: (duration: number) => void;
  onStart: () => void;
  onStop: () => void;
}) {
  const [now, setNow] = useState(initialNow);
  const remainingSeconds = getFocusRemainingSeconds(duration, startedAt, now);
  const isRunning = startedAt !== null && remainingSeconds > 0;
  const progressRatio = startedAt ? Math.min(1, Math.max(0, 1 - remainingSeconds / Math.max(1, duration * 60))) : 0;
  const progressStyle = {
    background: `conic-gradient(from 180deg, var(--accent-strong) ${progressRatio * 360}deg, var(--timer-track) 0deg)`,
  };

  useEffect(() => {
    if (!startedAt || remainingSeconds === 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [startedAt, remainingSeconds]);

  return (
    <section className="border-t border-[var(--panel-border)] pt-5">
      <div className="mb-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
        <Icon name="timer" className="h-4 w-4 text-[var(--accent)]" />
        Focus Timer
      </div>

      <div className="flex items-center justify-between gap-5">
        <button
          type="button"
          className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full transition hover:scale-[1.01]"
          style={progressStyle}
          onClick={() => onDurationChange(duration === 25 ? 50 : duration === 50 ? 15 : 25)}
          aria-label="Change focus duration"
        >
          <span className="absolute inset-[7px] rounded-full border border-[var(--timer-inner-border)] bg-[var(--timer-inner)]" />
          <span className="relative flex flex-col items-center justify-center text-[var(--heading)]">
            <span className="flex items-baseline gap-1">
              <span className="text-4xl font-semibold leading-none">{formatFocusMinutes(remainingSeconds)}</span>
              <span className="text-sm font-medium">m</span>
            </span>
            <span className="mt-1 text-[10px] font-semibold uppercase leading-none tracking-[0.16em] text-[var(--muted)]">Focus Time</span>
          </span>
        </button>

        <div className="flex min-w-0 flex-1 flex-col items-stretch gap-3">
          <button
            type="button"
            className="bg-[var(--nav-active)] px-5 py-3 text-sm font-semibold text-[var(--heading)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onStart}
            disabled={isRunning}
          >
            {startedAt && remainingSeconds === 0 ? "Restart" : "Start Focus"}
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2 border border-[var(--panel-border)] px-4 py-3 text-sm font-medium text-[var(--body)] transition hover:text-[var(--heading)] disabled:cursor-not-allowed disabled:opacity-45"
            onClick={onStop}
            disabled={startedAt === null}
            aria-label="Stop focus"
          >
            <Icon name="stop" className="h-4 w-4" />
            Stop
          </button>
        </div>
      </div>
    </section>
  );
}

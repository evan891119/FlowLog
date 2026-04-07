"use client";

import { useEffect, useMemo, useState } from "react";
import { CurrentTaskPanel } from "@/components/current-task-panel";
import { FloatingFocusTimer } from "@/components/floating-focus-timer";
import { Section } from "@/components/section";
import { TaskListSection } from "@/components/task-list-section";
import { TodayTaskDetailPanel } from "@/components/today-task-detail-panel";
import { TodayTaskList } from "@/components/today-task-list";
import { ThemeToggle } from "@/components/theme-toggle";
import { useDashboardState } from "@/lib/use-dashboard-state";
import { DashboardState, Task } from "@/types/dashboard";

type DashboardTab = "today" | "tasks" | "archive";
type DashboardProps = {
  initialState: DashboardState;
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

export function Dashboard({ initialState, userEmail }: DashboardProps) {
  const [selectedTab, setSelectedTab] = useState<DashboardTab>("today");
  const [selectedTodayTaskId, setSelectedTodayTaskId] = useState<string | null>(null);
  const [isTodayTaskDetailOpen, setIsTodayTaskDetailOpen] = useState(false);
  const {
    state,
    createTask,
    updateTaskTitle,
    updateTaskNextAction,
    updateTaskMode,
    updateTaskManualProgress,
    addTaskTodoItem,
    updateTaskTodoItem,
    toggleTaskTodoItem,
    deleteTaskTodoItem,
    updateTaskStatus,
    toggleToday,
    setCurrentTask,
    updateTodayGoal,
    deleteTask,
    moveTaskUp,
    moveTaskDown,
    setFocusEnabled,
    setFocusDuration,
    startFocusSession,
    stopFocusSession,
  } = useDashboardState(initialState);

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

  const selectedTodayTaskHeaderAction = useMemo(
    () =>
      selectedTodayTask ? (
        <button
          type="button"
          className="ui-button-secondary rounded-full px-3.5 py-2 text-sm font-medium"
          onClick={() => setSelectedTab("tasks")}
        >
          View all tasks
        </button>
      ) : null,
    [selectedTodayTask],
  );

  const handleSelectTodayTask = (taskId: string) => {
    setSelectedTodayTaskId(taskId);
    setIsTodayTaskDetailOpen(true);
  };

  return (
    <main className="min-h-screen px-4 py-5 pb-40 md:px-6 md:py-5 md:pb-48">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-steel dark:text-slate-300">Work-state dashboard</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink dark:text-white md:text-[2.25rem]">FlowLog</h1>
            <p className="mt-2 max-w-xl text-sm text-steel dark:text-slate-300 md:text-base">
              Open the page and recover context fast: what matters today, what is active now, and what the next step is.
            </p>
            {userEmail ? <p className="mt-2 text-sm text-steel dark:text-slate-300">Signed in as {userEmail}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <ThemeToggle />
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="dark-control rounded-full border border-sand bg-white/80 px-4 py-3 text-sm font-semibold text-ink dark:text-white"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

        <nav className="mb-4 flex flex-wrap gap-2" aria-label="Dashboard sections">
          {DASHBOARD_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                selectedTab === tab.id ? "bg-ink text-white" : "border border-sand bg-white/70 text-ink"
              } ${selectedTab === tab.id ? "dark-control-selected dark:text-white" : "dark-control dark:text-white"}`}
              onClick={() => setSelectedTab(tab.id)}
              aria-pressed={selectedTab === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {selectedTab === "today" ? (
          <>
            <section className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr] xl:items-start">
              <div className="space-y-4">
                <Section title="Today Goal" description="A single sentence that frames the day." layout="fill">
                  <textarea
                    className="dark-surface min-h-20 w-full rounded-3xl bg-mist px-4 py-3 text-base text-ink outline-none placeholder:text-steel/70 dark:border dark:text-white dark:placeholder:text-slate-500 xl:min-h-[220px] xl:resize-none"
                    placeholder="Finish the first usable FlowLog dashboard."
                    value={state.todayGoal}
                    onChange={(event) => updateTodayGoal(event.target.value)}
                    aria-label="Today goal"
                  />
                </Section>

                <TodayTaskList
                  tasks={todayTasks}
                  selectedTaskId={selectedTodayTask?.id ?? null}
                  onSelectTask={handleSelectTodayTask}
                  action={
                    <button
                      type="button"
                      className="ui-button-secondary rounded-full px-3.5 py-2 text-sm font-medium"
                      onClick={() => setSelectedTab("tasks")}
                    >
                      View all tasks
                    </button>
                  }
                />
              </div>

              <div className="space-y-4">
                <CurrentTaskPanel task={currentTask} variant="summary" />

                <div className="hidden xl:block">
                  <TodayTaskDetailPanel
                    task={selectedTodayTask}
                    onSetCurrent={setCurrentTask}
                    onStatusChange={updateTaskStatus}
                    onToggleToday={toggleToday}
                    onTitleChange={updateTaskTitle}
                    onNextActionChange={updateTaskNextAction}
                    onTaskModeChange={updateTaskMode}
                    onManualProgressChange={updateTaskManualProgress}
                    onAddTodoItem={addTaskTodoItem}
                    onUpdateTodoItem={updateTaskTodoItem}
                    onToggleTodoItem={toggleTaskTodoItem}
                    onDeleteTodoItem={deleteTaskTodoItem}
                    headerAction={selectedTodayTaskHeaderAction}
                  />
                </div>
              </div>

              {isTodayTaskDetailOpen ? (
                <>
                  <button
                    type="button"
                    className="dark-overlay fixed inset-0 z-50 bg-ink/18 xl:hidden"
                    aria-label="Close task detail"
                    onClick={() => setIsTodayTaskDetailOpen(false)}
                  />
                  <div className="fixed inset-x-0 bottom-0 z-[60] xl:hidden">
                    <TodayTaskDetailPanel
                      task={selectedTodayTask}
                      onSetCurrent={setCurrentTask}
                      onStatusChange={updateTaskStatus}
                      onToggleToday={toggleToday}
                      onTitleChange={updateTaskTitle}
                      onNextActionChange={updateTaskNextAction}
                      onTaskModeChange={updateTaskMode}
                      onManualProgressChange={updateTaskManualProgress}
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
                      className="rounded-b-none pb-7"
                    />
                  </div>
                </>
              ) : null}
            </section>
          </>
        ) : null}

        {selectedTab === "tasks" ? (
          <section className="grid gap-4 xl:grid-cols-[1.45fr_0.95fr]">
            <TaskListSection
              title="Active Tasks"
              description="Your working list, excluding blocked and completed items."
              tasks={activeTasks}
              emptyMessage="No active tasks yet. Add one task to start the first FlowLog session."
              onSetCurrent={setCurrentTask}
              onStatusChange={updateTaskStatus}
              onToggleToday={toggleToday}
              onTitleChange={updateTaskTitle}
              onNextActionChange={updateTaskNextAction}
              onTaskModeChange={updateTaskMode}
              onManualProgressChange={updateTaskManualProgress}
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

            <TaskListSection
              title="Blocked Tasks"
              description="Visible, but kept out of the main working lane."
              tasks={blockedTasks}
              emptyMessage="Nothing is blocked right now."
              onSetCurrent={setCurrentTask}
              onStatusChange={updateTaskStatus}
              onToggleToday={toggleToday}
              onTitleChange={updateTaskTitle}
              onNextActionChange={updateTaskNextAction}
              onTaskModeChange={updateTaskMode}
              onManualProgressChange={updateTaskManualProgress}
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

        {selectedTab === "archive" ? (
          <section>
            <TaskListSection
              title="Completed Tasks"
              description="Finished work stays visible without dominating the page."
              tasks={completedTasks}
              emptyMessage="Nothing has been completed yet."
              onSetCurrent={setCurrentTask}
              onStatusChange={updateTaskStatus}
              onToggleToday={toggleToday}
              onTitleChange={updateTaskTitle}
              onNextActionChange={updateTaskNextAction}
              onTaskModeChange={updateTaskMode}
              onManualProgressChange={updateTaskManualProgress}
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

        <button
          type="button"
          className={`fixed right-4 z-30 flex h-16 min-w-[7.5rem] items-center justify-center rounded-full bg-clay px-5 text-sm font-semibold tracking-tight text-white shadow-panel transition hover:scale-[1.02] md:right-6 md:h-[4.5rem] md:min-w-[8.5rem] md:text-base ${
            isTodayTaskDetailOpen ? "pointer-events-none opacity-0 xl:pointer-events-auto xl:opacity-100" : "opacity-100"
          } bottom-[calc(env(safe-area-inset-bottom)+6.75rem)] md:bottom-[8.5rem]`}
          onClick={createTask}
          aria-label="Add task"
        >
          Add task
        </button>

        <FloatingFocusTimer
          focus={state.focus}
          onToggleEnabled={setFocusEnabled}
          onDurationChange={setFocusDuration}
          onStart={startFocusSession}
          onStop={stopFocusSession}
        />
      </div>
    </main>
  );
}

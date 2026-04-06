"use client";

import { useState } from "react";
import { CurrentTaskPanel } from "@/components/current-task-panel";
import { FocusPanel } from "@/components/focus-panel";
import { Section } from "@/components/section";
import { TaskListSection } from "@/components/task-list-section";
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
  const {
    state,
    createTask,
    updateTaskTitle,
    updateTaskNextAction,
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

  return (
    <main className="min-h-screen px-4 py-5 md:px-6 md:py-5">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-steel">Work-state dashboard</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink md:text-[2.25rem]">FlowLog</h1>
            <p className="mt-2 max-w-xl text-sm text-steel md:text-base">
              Open the page and recover context fast: what matters today, what is active now, and what the next step is.
            </p>
            {userEmail ? <p className="mt-2 text-sm text-steel">Signed in as {userEmail}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full bg-clay px-4 py-3 text-sm font-semibold text-white"
              onClick={createTask}
            >
              Add task
            </button>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-full border border-sand bg-white/80 px-4 py-3 text-sm font-semibold text-ink"
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
              }`}
              onClick={() => setSelectedTab(tab.id)}
              aria-pressed={selectedTab === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {selectedTab === "today" ? (
          <>
            <section className="grid gap-4 xl:grid-cols-3 xl:items-stretch">
              <div className="xl:order-2">
                <CurrentTaskPanel task={currentTask} variant="summary" />
              </div>

              <div className="xl:order-1">
                <Section
                  title="Today Goal"
                  description="A single sentence that frames the day."
                  layout="fill"
                >
                  <textarea
                    className="min-h-20 w-full rounded-3xl bg-mist px-4 py-3 text-base text-ink outline-none placeholder:text-steel/70 xl:min-h-[220px] xl:resize-none"
                    placeholder="Finish the first usable FlowLog dashboard."
                    value={state.todayGoal}
                    onChange={(event) => updateTodayGoal(event.target.value)}
                    aria-label="Today goal"
                  />
                </Section>
              </div>

              <div className="xl:order-3">
                <FocusPanel
                  focus={state.focus}
                  onToggleEnabled={setFocusEnabled}
                  onDurationChange={setFocusDuration}
                  onStart={startFocusSession}
                  onStop={stopFocusSession}
                  variant="summary"
                />
              </div>
            </section>

            <section className="mt-4">
              <TaskListSection
                title="Today Tasks"
                description="Tasks explicitly marked for today."
                tasks={todayTasks}
                variant="compact"
                visibleCount={1}
                mobileVisibleCount={1}
                overflowMessage={(hiddenCount) => `+${hiddenCount} more tasks in Tasks.`}
                action={
                  todayTasks.length > 0 ? (
                    <button
                      type="button"
                      className="rounded-full border border-sand bg-white px-3 py-2 text-sm font-medium text-ink"
                      onClick={() => setSelectedTab("tasks")}
                    >
                      View all tasks
                    </button>
                  ) : null
                }
                className="overflow-hidden"
                emptyMessage="No tasks are marked for today. Flag the most important work so the dashboard stays focused."
                onSetCurrent={setCurrentTask}
                onStatusChange={updateTaskStatus}
                onToggleToday={toggleToday}
                onTitleChange={updateTaskTitle}
                onNextActionChange={updateTaskNextAction}
                onDelete={deleteTask}
                onMoveUp={moveTaskUp}
                onMoveDown={moveTaskDown}
                canMoveUp={canMoveUp}
                canMoveDown={canMoveDown}
              />
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
              onDelete={deleteTask}
              onMoveUp={moveTaskUp}
              onMoveDown={moveTaskDown}
              canMoveUp={canMoveUp}
              canMoveDown={canMoveDown}
            />
          </section>
        ) : null}
      </div>
    </main>
  );
}

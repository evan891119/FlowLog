"use client";

import { CurrentTaskPanel } from "@/components/current-task-panel";
import { Section } from "@/components/section";
import { TaskListSection } from "@/components/task-list-section";
import { useDashboardState } from "@/lib/use-dashboard-state";
import { Task } from "@/types/dashboard";

function sortByOrder(tasks: Task[], taskOrder: string[]) {
  const orderMap = new Map(taskOrder.map((taskId, index) => [taskId, index]));

  return [...tasks].sort((a, b) => (orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER));
}

export function Dashboard() {
  const {
    state,
    createTask,
    updateTaskTitle,
    updateTaskNextAction,
    updateTaskStatus,
    toggleToday,
    setCurrentTask,
    updateTodayGoal,
  } = useDashboardState();

  const orderedTasks = sortByOrder(state.tasks, state.taskOrder);
  const currentTask = orderedTasks.find((task) => task.isCurrent) ?? null;
  const todayTasks = orderedTasks.filter((task) => task.isToday && task.status !== "done");
  const activeTasks = orderedTasks.filter((task) => task.status === "not_started" || task.status === "in_progress");
  const blockedTasks = orderedTasks.filter((task) => task.status === "blocked");
  const completedTasks = orderedTasks.filter((task) => task.status === "done");

  return (
    <main className="min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-steel">Work-state dashboard</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-ink">FlowLog</h1>
            <p className="mt-3 max-w-2xl text-base text-steel">
              Open the page and recover context fast: what matters today, what is active now, and what the next step is.
            </p>
          </div>
          <button
            type="button"
            className="rounded-full bg-clay px-4 py-3 text-sm font-semibold text-white"
            onClick={createTask}
          >
            Add task
          </button>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_1.2fr_0.7fr]">
          <div className="lg:order-2">
            <CurrentTaskPanel task={currentTask} />
          </div>

          <div className="lg:order-1">
            <Section title="Today Goal" description="A single sentence that frames the day.">
              <textarea
                className="min-h-28 w-full rounded-3xl bg-mist px-4 py-3 text-base text-ink outline-none placeholder:text-steel/70"
                placeholder="Finish the first usable FlowLog dashboard."
                value={state.todayGoal}
                onChange={(event) => updateTodayGoal(event.target.value)}
                aria-label="Today goal"
              />
            </Section>
          </div>

          <div className="lg:order-3">
            <Section title="Focus Mode" description="Reserved for the optional timer module in the next milestone.">
              <div className="rounded-3xl bg-white px-4 py-4 text-sm text-steel">
                <p>Focus timer is intentionally deferred. This panel stays visible so the dashboard structure is stable from day one.</p>
              </div>
            </Section>
          </div>
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_0.9fr]">
          <TaskListSection
            title="Today Tasks"
            description="Tasks explicitly marked for today."
            tasks={todayTasks}
            emptyMessage="No tasks are marked for today. Flag the most important work so the dashboard stays focused."
            onSetCurrent={setCurrentTask}
            onStatusChange={updateTaskStatus}
            onToggleToday={toggleToday}
            onTitleChange={updateTaskTitle}
            onNextActionChange={updateTaskNextAction}
          />

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
          />
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
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
          />

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
          />
        </section>
      </div>
    </main>
  );
}

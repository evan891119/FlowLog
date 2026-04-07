# FlowLog Implementation Specification

## 1. Technical Baseline

FlowLog v1 will be implemented as an authenticated web app using:

- `Next.js`
- `Tailwind CSS`
- `Vercel`
- `Supabase Auth`
- `Supabase Postgres`

The app is deployed on Vercel and uses Supabase for authentication and remote persistence.

## 2. Core Data Model

### 2.1 Task Status

Use the following status enum:

```ts
type TaskStatus = "not_started" | "in_progress" | "blocked" | "done";
```

### 2.2 Task

Use the following task shape as the MVP baseline:

```ts
type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  taskMode: "next_action" | "todo_list";
  nextAction: string;
  manualProgress: number;
  estimatedMinutes: number | null;
  elapsedSeconds: number;
  currentSessionStartedAt: string | null;
  todoItems: { id: string; text: string; done: boolean }[];
  isToday: boolean;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
};
```

Rules:

- `manualProgress` is an integer from `0` to `100`
- `estimatedMinutes` is either `null` or an integer >= `1`
- `elapsedSeconds` stores cumulative time already spent on the task
- `currentSessionStartedAt` is set only while the task is actively current and timing
- `isCurrent` must be true for at most one task
- `title` is required
- `taskMode` defaults to `next_action`
- `nextAction` should default to an empty string, but the UI should encourage filling it
- `todoItems` defaults to an empty array
- Display progress is derived from `manualProgress` in `next_action` mode and from checklist completion in `todo_list` mode
- Time countdown is derived from `estimatedMinutes`, `elapsedSeconds`, and `currentSessionStartedAt`

### 2.3 Focus Settings

```ts
type FocusSettings = {
  duration: number;
  lastSessionStartedAt: string | null;
};
```

Rules:

- `duration` is measured in minutes
- MVP default can be `25`

### 2.4 Dashboard State

```ts
type DashboardState = {
  todayGoal: string;
  tasks: Task[];
  taskOrder: string[];
  focus: FocusSettings;
  lastViewedAt: string | null;
};
```

Rules:

- `taskOrder` stores manual display order
- `tasks` remains the canonical task data source

## 3. Persistence Contract

### 3.1 Save Behavior

Persist state on:

- Task create
- Task delete
- Task edit
- Status change
- Current task change
- Today flag change
- Task reorder
- Progress change
- Today goal change
- Focus setting change

### 3.2 Load Behavior

On app initialization:

- Read from Supabase for the authenticated user
- Validate shape minimally at the app boundary
- Fallback to an empty default state for new accounts

### 3.3 Default State

```ts
const defaultState: DashboardState = {
  todayGoal: "",
  tasks: [],
  taskOrder: [],
  focus: {
    duration: 25,
    lastSessionStartedAt: null,
  },
  lastViewedAt: null,
};
```

## 4. Core Business Rules

- Only one task may have `isCurrent = true`
- Setting a task as current must clear `isCurrent` on all other tasks
- Setting a task as current must start or resume its task timer when `estimatedMinutes` is set
- Replacing the current task must pause the previous task timer and preserve elapsed time
- A task with status `blocked` cannot be auto-promoted to current
- Marking a current task as `done` must clear the current task selection
- Marking a current task as `blocked` or `done` must pause its task timer
- A task may be both `isToday = true` and `isCurrent = true`
- `updatedAt` must change on every user-visible task edit
- The UI should prefer showing active tasks before done tasks

## 5. Suggested App Structure

The implementation should stay simple and feature-oriented.

Suggested structure:

- `app/` for the Next.js app shell and page entry
- `components/` for dashboard and task UI
- `lib/` for Supabase helpers, state helpers, and constants
- `supabase/` for setup SQL
- `types/` for shared TypeScript types

Recommended initial modules:

- Dashboard page container
- Current task panel
- Task list
- Task card
- Focus timer panel
- Supabase auth helpers
- Supabase persistence adapter
- State normalization helpers

## 6. Implementation Order

Build the MVP in the following order.

### Phase 1: App Shell

- Create the Next.js app shell
- Build the dashboard layout
- Add placeholder sections for all primary panels

### Phase 2: State and Persistence

- Define shared types
- Create default dashboard state
- Implement Supabase read and write helpers
- Load persisted state for the authenticated user

### Phase 2.5: Authentication and Hosting

- Add login page
- Add email OTP verification flow
- Add session middleware
- Configure Vercel deployment and custom domain

### Phase 3: Task Management

- Implement task creation
- Implement task deletion
- Implement task editing
- Implement task status changes
- Implement progress updates
- Implement today flag toggling
- Implement manual task reordering

### Phase 4: Current Task Logic

- Add single-current-task selection
- Ensure rule enforcement when current task changes
- Reflect current task state in the dedicated top panel
- Add per-task estimated duration and countdown display

### Phase 5: Work Context Features

- Add `nextAction` editing and display
- Add today goal editing
- Add task grouping for active, blocked, later, and completed states
- Add useful empty states

### Phase 6: Focus Module

- Add timer display
- Add start and stop behavior
- Persist focus settings

## 7. Acceptance Criteria

The MVP implementation is complete when:

- Users can create, edit, and view tasks
- Users can delete tasks and manually reorder them
- Users can mark one task as current
- Users can set an estimated duration and see time remaining on timed tasks
- Users can define a next action per task
- The dashboard clearly separates current, today, blocked, and completed work
- State survives refresh and device changes through Supabase
- Signed-in users only see their own data
- The focus timer remains available without becoming the primary screen element

## 8. Testing Scenarios

At minimum, verify these scenarios:

- Creating the first task in an empty state
- Selecting a current task when none exists
- Replacing the current task with another task
- Completing the current task and confirming the current slot clears
- Reloading the page and restoring tasks from Supabase
- Logging in from another device and seeing the same tasks
- Ensuring one user's data is not visible to another user
- Editing next action and seeing it reflected in the current task panel
- Toggling a task into today’s list and confirming it appears in the correct section
- Switching current tasks and confirming the old task timer pauses while the new one starts
- Reloading while a timed current task is active and confirming the countdown resumes
- Marking a task as blocked and confirming it is visually separated from active work
- Starting and using the focus timer without losing task context

## 9. Future Compatibility Notes

To keep future compatibility simple:

- Preserve stable task IDs
- Keep status values unchanged
- Keep task field names consistent unless migration is introduced
- Keep task field names consistent unless migration is introduced

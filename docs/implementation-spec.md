# FlowLog Implementation Specification

## 1. Technical Baseline

FlowLog v1 will be implemented as a frontend-only web app using:

- `Next.js`
- `Tailwind CSS`
- Browser `localStorage`

No backend, authentication layer, or remote database is required in v1.

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
  nextAction: string;
  progress: number;
  isToday: boolean;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
};
```

Rules:

- `progress` is an integer from `0` to `100`
- `isCurrent` must be true for at most one task
- `title` is required
- `nextAction` should default to an empty string, but the UI should encourage filling it

### 2.3 Focus Settings

```ts
type FocusSettings = {
  enabled: boolean;
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

### 3.1 Storage Key

Use a single `localStorage` key for MVP:

```ts
const STORAGE_KEY = "flowlog.dashboard.v1";
```

### 3.2 Save Behavior

Persist state on:

- Task create
- Task edit
- Status change
- Current task change
- Today flag change
- Progress change
- Today goal change
- Focus setting change

### 3.3 Load Behavior

On app initialization:

- Read from `localStorage`
- Parse safely
- Validate shape minimally
- Fallback to an empty default state if parsing fails or data is absent

### 3.4 Default State

```ts
const defaultState: DashboardState = {
  todayGoal: "",
  tasks: [],
  taskOrder: [],
  focus: {
    enabled: false,
    duration: 25,
    lastSessionStartedAt: null,
  },
  lastViewedAt: null,
};
```

## 4. Core Business Rules

- Only one task may have `isCurrent = true`
- Setting a task as current must clear `isCurrent` on all other tasks
- A task with status `blocked` cannot be auto-promoted to current
- Marking a current task as `done` must clear the current task selection
- A task may be both `isToday = true` and `isCurrent = true`
- `updatedAt` must change on every user-visible task edit
- The UI should prefer showing active tasks before done tasks

## 5. Suggested App Structure

The implementation should stay simple and feature-oriented.

Suggested structure:

- `app/` for the Next.js app shell and page entry
- `components/` for dashboard and task UI
- `lib/` for storage helpers, state helpers, and constants
- `types/` for shared TypeScript types

Recommended initial modules:

- Dashboard page container
- Current task panel
- Task list
- Task card
- Focus timer panel
- `localStorage` adapter
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
- Implement `localStorage` read and write helpers
- Load persisted state on app start

### Phase 3: Task Management

- Implement task creation
- Implement task editing
- Implement task status changes
- Implement progress updates
- Implement today flag toggling

### Phase 4: Current Task Logic

- Add single-current-task selection
- Ensure rule enforcement when current task changes
- Reflect current task state in the dedicated top panel

### Phase 5: Work Context Features

- Add `nextAction` editing and display
- Add today goal editing
- Add task grouping for active, blocked, later, and completed states
- Add useful empty states

### Phase 6: Focus Module

- Add focus toggle
- Add timer display
- Add start and stop behavior
- Persist focus settings

## 7. Acceptance Criteria

The MVP implementation is complete when:

- Users can create, edit, and view tasks
- Users can mark one task as current
- Users can define a next action per task
- The dashboard clearly separates current, today, blocked, and completed work
- State survives refresh through `localStorage`
- The focus timer can be enabled without becoming the primary screen element

## 8. Testing Scenarios

At minimum, verify these scenarios:

- Creating the first task in an empty state
- Selecting a current task when none exists
- Replacing the current task with another task
- Completing the current task and confirming the current slot clears
- Reloading the page and restoring tasks from `localStorage`
- Handling malformed or missing stored data safely
- Editing next action and seeing it reflected in the current task panel
- Toggling a task into today’s list and confirming it appears in the correct section
- Marking a task as blocked and confirming it is visually separated from active work
- Enabling and using the focus timer without losing task context

## 9. Future Compatibility Notes

To keep future sync support simple:

- Preserve stable task IDs
- Keep status values unchanged
- Keep task field names consistent unless migration is introduced
- Treat `DashboardState` as the eventual sync payload baseline

If a backend is added later, Supabase or Firebase can be layered on top without redefining the MVP task model.

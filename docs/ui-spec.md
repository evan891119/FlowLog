# FlowLog UI Specification

## 1. UI Objective

The FlowLog interface should behave like a work control panel.

The main screen should answer three things immediately:

- What matters today
- What I am doing now
- What the next concrete step is

The UI must avoid feeling like an infinite backlog manager.

## 2. Information Architecture

The MVP consists of a single primary dashboard page.

Main sections:

- Top summary area
- Current task panel
- Today task area
- Main task list
- Secondary task groups
- Optional focus module

## 3. Dashboard Layout

### 3.1 Desktop Layout

Recommended structure:

- Top row: today goal and current task summary
- Main content column: today tasks and main task list
- Floating utility: focus mode orb fixed to the lower-right corner
- Secondary side or lower panel: later tasks, blocked tasks, completed tasks

The page should visually prioritize current context over list density.

### 3.2 Mobile Layout

Use a single-column layout with stacked sections in this order:

1. Current task
2. Today goal
3. Today tasks
4. Main task list
5. Blocked tasks
6. Completed tasks

Focus mode should remain accessible as a floating control. On mobile, tapping it should open a bottom sheet rather than an inline section.

The current task must remain near the top on mobile.

## 4. Main Sections

### 4.1 Today Goal

Purpose:

- Give the day a clear theme or main target

Displayed content:

- Short text goal for the day

Behavior:

- Editable inline or via simple input
- Optional, but visually supported

### 4.2 Current Task Panel

Purpose:

- Show the single active task clearly

Displayed content:

- Task title
- Status
- Next action or todo list
- Progress

Behavior:

- If no current task exists, show an empty state prompting the user to select one
- This panel should be visually stronger than normal task cards

### 4.3 Focus Module

Purpose:

- Provide optional support for sustained work

Displayed content:

- Enable or disable toggle
- Timer state
- Start and stop controls

Behavior:

- Must be collapsible or visually secondary
- Must not dominate the top of the page
- Desktop presentation can be a fixed lower-right floating orb that opens a small popover
- Mobile presentation can use the same orb but open a bottom sheet

### 4.4 Today Tasks

Purpose:

- Isolate the tasks that matter for the current day

Displayed content:

- Tasks with `isToday = true`

Behavior:

- Desktop can present this area as a lightweight task list on the left with an expanded detail panel on the right
- Mobile can keep the list compact and open the selected task in a bottom sheet
- The list itself can stay minimal, but the expanded panel should show the selected task's next action or todo list and progress
- Tasks may also appear conceptually in the full task set, but the dashboard should treat this area as a focused subset

### 4.5 Main Task List

Purpose:

- Show active work items that are not done

Displayed content:

- Tasks grouped or filtered to exclude completed items by default

Behavior:

- Fast editing should be supported for status, next action editing, and task mode switching
- Current task action should be available directly from the card

### 4.6 Secondary Task Groups

Purpose:

- Keep non-primary states visible without distracting from active work

Subsections:

- Later / queued tasks
- Blocked tasks
- Completed tasks

Behavior:

- These sections should be visually quieter than the main active area

## 5. Task Card Specification

Each task card should include:

- Title
- Status badge
- Next action text or todo list
- Task mode toggle
- Progress indicator
- Today marker
- Current task action

Optional UI controls:

- Edit task
- Change status
- Mark as today
- Set as current
- Delete task
- Move task up or down

## 6. Task States and Display Rules

Status values:

- `not_started`
- `in_progress`
- `blocked`
- `done`

Display behavior:

- `in_progress` should feel active
- `blocked` should be clearly distinguished
- `done` should move to a lower-priority section
- `not_started` should still show next action when available

## 7. Interaction Rules

- Only one current task can exist at a time
- Selecting a new current task removes the old current assignment
- Marking a current task as `done` removes it from the current task panel
- A task can be both `isToday = true` and current
- A blocked task should never be auto-selected as current
- If the user returns to the app, the UI should foreground the last known current task and its next action

## 8. Empty States

The MVP needs clear empty states.

Examples:

- No tasks yet: prompt user to create the first task
- No current task: prompt user to choose one from today’s tasks
- No today tasks: prompt user to mark important tasks for today
- No next action: prompt user to define the next concrete step

Empty states should guide action instead of just showing absence.

## 9. Low-Fidelity Wireframe

```text
+---------------------------------------------------------------+
| FlowLog                                                       |
| Today Goal         | Current Task        | Focus Toggle       |
| Ship dashboard MVP | Write task schema   | Focus: Off         |
+---------------------------------------------------------------+
| Today Tasks                                                |
| [Task] Define task model    Status: In Progress  Next: Add ID|
| [Task] Draft homepage copy  Status: Not Started  Next: Write |
+---------------------------------------------------------------+
| Active Tasks                                               |
| [Task Card]                                                 |
| [Task Card]                                                 |
| [Task Card]                                                 |
+----------------------------------+---------------------------+
| Blocked                          | Completed                 |
| [Task Card]                      | [Task Card]               |
| Later / Queue                    |                           |
| [Task Card]                      |                           |
+----------------------------------+---------------------------+
```

## 10. Accessibility and UX Notes

- Task state should not rely on color alone
- Key actions must remain reachable on small screens
- The current task panel should be easy to scan at a glance
- Inputs should support quick editing without modal-heavy interaction
- The design should favor clarity over ornamental density

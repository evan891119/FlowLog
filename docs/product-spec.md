# FlowLog Product Specification

## 1. Product Summary

FlowLog is a personal web-based task dashboard that helps users continuously understand their current work state.

The product is built around a simple promise:

> Help the user know what they are doing now, how far they have gotten, and what to do next.

Unlike a generic todo app, FlowLog focuses on work context management rather than task collection.

## 2. Problem Statement

FlowLog solves a different problem from traditional task managers.

The user usually already knows they have work to do. The real problem is:

- They lose track of what they were doing
- They forget the exact next step after interruption
- They bounce between tasks without a clear current focus
- They remember work items broadly, but not the current working state

FlowLog is meant to reduce restart friction after distraction.

## 3. Target Users

Primary users:

- Individual knowledge workers
- Students working on assignments, reports, or study plans
- Freelancers or solo builders handling multiple active tasks
- Users who often get distracted and need to re-anchor themselves quickly

User traits:

- Often context-switch between tasks
- Benefit from seeing a single current task
- Need concrete next steps instead of vague task titles
- Prefer lightweight tools over full productivity suites

## 4. Product Positioning

### 4.1 Category

FlowLog is a work-state dashboard.

### 4.2 Differentiation

Typical todo apps emphasize:

- What tasks exist
- Due dates
- Lists and collections

FlowLog emphasizes:

- What task is active now
- What the next action is
- What state each task is in
- How to resume work after interruption

### 4.3 Product Statement

FlowLog is a web task dashboard that helps users always know what they are doing, where they stopped, and what to do next.

## 5. Product Principles

- The homepage should restore work context within 5 seconds.
- At most one task can be marked as the current task at a time.
- The `next action` should be concrete and immediately actionable.
- Focus tools must remain optional and supportive.
- The dashboard should feel like a control panel, not a long backlog list.
- The MVP should stay lightweight enough to use daily without setup friction.

## 6. Goals and Non-Goals

### 6.1 Goals

- Help users resume work quickly after distraction
- Give users a clear picture of current task state
- Reduce mental overhead when deciding what to do next
- Support a simple daily workflow across devices with account-backed sync

### 6.2 Non-Goals

- Complex project planning
- Team collaboration
- Deep analytics or reporting
- Notification-heavy productivity systems
- Feature parity with established todo or PM tools

## 7. Feature Layers

### 7.1 Core Layer: Task Dashboard

This is the main product surface and the highest priority area.

Core capabilities:

- View today’s tasks
- See the current task when one is selected
- Track task state
- Record the next action for each task
- See what is blocked, completed, and queued for later
- Delete tasks that are no longer relevant
- Reorder tasks to reflect working priority
- Sign in and recover personal task state from any device

### 7.2 Support Layer: Focus Module

This layer helps users stay anchored, but should not define the product.

Support capabilities:

- Always-available focus timer
- Reminders that reconnect the user to the active task
- Restore previous work context when returning
- Simple self-marking for distraction events in future versions

## 8. MVP Feature Specification

The MVP includes the following features.

### 8.1 Task List

Users can create and view a list of tasks relevant to current work.

Each task must support:

- Title
- Status
- Next action
- Progress
- Optional estimated work time
- Today flag
- Current task flag

### 8.2 Task Status

Each task must be in one of four states:

- `not_started`
- `in_progress`
- `blocked`
- `done`

These states must be visible from the main dashboard.

### 8.3 Single Current Task

Users can mark one task as the current task, or clear it when they want to pause active work.

Rules:

- At most one task may be current at any time
- Setting a new current task clears the previous one
- Setting a task as current moves it into `in_progress`
- Clearing the current task manually pauses its timer and leaves no task selected
- Completing the current task clears the current selection

### 8.4 Next Action / Todo List

Each task has a resumable work definition that can be shown as either a `next action` field or a lightweight `todo list`.

The `next action` mode is intended for concrete work instructions such as:

- Draft the chart for section 3
- Review the API response schema
- Write tests for the timer reducer

The `todo list` mode is intended for tasks that benefit from a short checklist of concrete sub-steps.

This work-definition area should be treated as essential, not optional in the UX.

### 8.5 Today Area

Users can mark tasks as part of today’s workload.

The dashboard should separate today’s tasks from the broader active list so the user can quickly see what matters now.

### 8.6 Simple Progress

Each task should show lightweight progress.

For MVP, progress is represented as:

- A manually editable percentage from 0 to 100 when the task is in `next action` mode
- An automatically derived percentage from completed checklist items when the task is in `todo list` mode

### 8.7 Account-backed Persistence

All user data is stored in a per-user cloud data store.

Behavior requirements:

- Save on every meaningful change
- Restore on app load
- Push account-backed updates to other open sessions without requiring a reload
- Initialize with a safe empty state for new accounts
- Never expose one user's tasks to another user

### 8.8 Task Time Countdown

Users can optionally set an estimated duration for a task.

Behavior requirements:

- When a timed task becomes the current task, its countdown starts automatically
- Switching to another current task pauses the previous countdown and preserves elapsed time
- Returning to the same task resumes from the remaining time
- The Today list should visualize remaining time from left to right
- The Current task panel should visualize remaining time from top to bottom
- Reaching zero should not auto-complete the task

### 8.9 User Authentication

Users can sign in with email one-time codes.

Behavior requirements:

- Public signup is allowed
- Successful login returns the user to the dashboard
- Signed-out users should be redirected to the login experience
- Each account reads and writes only its own tasks and settings

### 8.10 Focus Timer

Users can use a focus timer whenever they need it.

MVP expectations:

- Timer is always available as a secondary utility
- Timer duration is configurable by basic presets later, but MVP can start with one default
- Timer must not overshadow the task dashboard
- Start and stop controls are sufficient for MVP

## 9. Out of Scope for MVP

The following are intentionally excluded from v1:

- Team members and shared boards
- Push notifications
- Rich tags and advanced filters
- Historical productivity analytics
- Deep calendar integrations

## 10. Success Criteria

FlowLog v1 is successful if a user can:

- Open the dashboard and identify their current task immediately
- Understand the next concrete action without rethinking the task
- Review today’s work without looking through a long backlog
- Recover from interruption faster than with a generic todo list

## 11. Future Expansion Directions

After MVP, likely additions include:

- Return-to-work prompts after idle periods
- PWA support
- Distraction self-tracking
- More detailed progress structures
- Lightweight insights on interruptions and completion patterns

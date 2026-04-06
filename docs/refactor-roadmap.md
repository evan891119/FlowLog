# FlowLog Refactor Roadmap

This document tracks the refactor work needed to make the current MVP implementation easier to extend, safer to change, and more aligned with the product and UI specs.

## Status Legend

- `- [x]` Completed discovery or implementation work
- `- [ ]` Planned or still pending

## Completed Review Findings

- [x] Reviewed the current Next.js app structure
- [x] Identified state integrity issues in dashboard task updates
- [x] Identified component structure and duplication issues
- [x] Identified persistence and hydration issues
- [x] Confirmed the current codebase still typechecks with `npm run typecheck`

## Phase 1: State Correctness

Success condition: all dashboard invariants are enforced in one place, and invalid task state cannot persist after normal user actions.

- [x] Clear `isCurrent` when a task status becomes `blocked` or `done`
- [x] Normalize `taskOrder` so it only contains existing task IDs and appends missing task IDs deterministically
- [x] Ensure only one task can remain current after state normalization
- [x] Keep task update helpers responsible for all task-level invariants

## Phase 2: State and Persistence Architecture

Success condition: dashboard state loading, saving, and hydration behavior are explicit, predictable, and separated from UI rendering concerns.

- [x] Extract a dedicated dashboard state hook for load, save, and event handlers
- [x] Separate persistence logic from domain state update helpers
- [x] Replace the current hydration flow with a cleaner strategy that avoids empty-state flicker on first load
- [x] Decide whether `lastViewedAt` belongs in persisted dashboard state or in a separate persistence concern

## Phase 3: Component Decomposition

Success condition: the dashboard UI is split into focused components with less duplication and clearer ownership.

- [x] Split the large dashboard client component into focused UI components
- [x] Extract a reusable task list section component
- [x] Keep `TaskCard` as a reusable leaf component with a tighter prop surface
- [x] Remove repeated task section rendering logic for today, blocked, active, and completed groups

## Phase 4: UX and Product Alignment

Success condition: the implemented UI matches the documented information hierarchy and keeps the product's context-recovery goal front and center.

- [x] Re-check mobile section order against the UI spec
- [x] Revisit current-task prominence and empty-state guidance
- [x] Re-evaluate whether task progress should be editable in MVP or remain display-only
- [x] Decide whether app language defaults should remain English

## Deferred / Later Items

These are valid follow-up items, but they are not required to complete the refactor baseline.

- [x] Focus timer implementation
- [x] Task deletion
- [x] Manual task reordering
- [x] Automated tests for dashboard state rules
- [x] Documentation updates if implementation behavior diverges from the current specs

## Notes and Decisions

- The current refactor priority is correctness and maintainability, not visual redesign.
- "Completed" in this file includes completed review and planning work, not only shipped code changes.
- `lastViewedAt` remains persisted for now, but it is now storage metadata rather than a UI-managed field.
- Phase 4 keeps English as the default UI language and keeps progress display-only in MVP.
- Existing implementation areas most affected by this roadmap:
  - `components/dashboard.tsx`
  - `lib/dashboard-state.ts`
  - `lib/storage.ts`

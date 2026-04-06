# FlowLog

FlowLog is a web-based task dashboard for keeping track of your current work state.

It is designed to answer five questions quickly:

- What am I working on right now?
- What tasks are currently on my plate?
- How far has this task progressed?
- What is the exact next action?
- What should not be forgotten for later?

FlowLog is not a generic todo app. Its core value is work context recovery: when the user returns after distraction, the dashboard should make it obvious what they were doing and what to do next.

## Product Definition

FlowLog is:

- A personal web dashboard for tracking current work state
- A lightweight task system centered on status, next action, and focus recovery
- A product where focus tools are optional support modules, not the main feature

FlowLog is not:

- A full project management platform
- A team collaboration tool
- A backlog-heavy todo database

## MVP Scope

The first version includes:

- Task list
- Task status: `not_started`, `in_progress`, `blocked`, `done`
- A single current task
- A `next action` field on each task
- A `today` task area
- Simple progress display
- Task deletion
- Manual task reordering with move controls
- Email OTP login
- Automatic persistence with Supabase
- Optional focus timer with start and stop controls

The first version does not include:

- Team collaboration
- Notifications
- Analytics dashboards
- Complex tagging or filtering systems

## Tech Direction

The implementation baseline for v1 is:

- `Next.js`
- `Tailwind CSS`
- `Vercel`
- `Supabase Auth` with email OTP
- `Supabase Postgres`

Deploy the app to Vercel and connect your own domain through the Vercel project settings.

## Documentation

- [Product Spec](/Users/evan/Code/Projects/FlowLog/docs/product-spec.md)
- [UI Spec](/Users/evan/Code/Projects/FlowLog/docs/ui-spec.md)
- [Implementation Spec](/Users/evan/Code/Projects/FlowLog/docs/implementation-spec.md)
- [Deployment Runbook](/Users/evan/Code/Projects/FlowLog/docs/deployment-runbook.md)

## Core Principle

If a feature does not help the user recover and maintain work context, it should not be prioritized in v1.

## Development

- `npm run dev`: run the local development server
- `npm run build`: create a production build
- `npm run start`: run the production server
- `npm run typecheck`: run the TypeScript checker
- `npm run test`: run the automated state and cloud-mapping tests

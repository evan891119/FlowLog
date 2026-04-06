# Repository Guidelines

## Project Structure & Module Organization

This repository is docs-led, but it already includes a working Next.js MVP alongside the product specs. Core documentation lives in the root [README.md](/Users/evan/Code/Projects/FlowLog/README.md) and the `docs/` folder:

- `docs/product-spec.md`: product definition and MVP scope
- `docs/ui-spec.md`: dashboard layout and interaction rules
- `docs/implementation-spec.md`: data model and implementation order

The current app structure follows the implementation spec:

- `app/`: Next.js routes and page shell
- `components/`: dashboard UI components
- `lib/`: state, storage, and utility helpers
- `types/`: shared TypeScript types

## Build, Test, and Development Commands

Current project commands:

- `npm install`: install dependencies
- `npm run dev`: run the local development server
- `npm run build`: create a production build
- `npm run start`: run the production server
- `npm run typecheck`: run the TypeScript checker
- `npm run test`: run the automated test suite

Do not add undocumented scripts. Update this guide when tooling changes.

## Coding Style & Naming Conventions

Write code in TypeScript and keep files ASCII unless an existing file already uses Unicode. Use clear, descriptive names:

- Components: `TaskCard.tsx`, `CurrentTaskPanel.tsx`
- Helpers: `storage.ts`, `task-state.ts`
- Types: `Task`, `DashboardState`, `TaskStatus`

Prefer:

- 2-space indentation
- React function components
- `camelCase` for variables/functions
- `PascalCase` for components and types
- `kebab-case` for non-component file names

If formatting or linting is added, document the exact command here.

## Testing Guidelines

The project uses Node's built-in test runner with `tsx` for TypeScript test execution. After code changes, run `npm run typecheck` and `npm run test`.

- Place unit tests beside source files or under `tests/`
- Name files `*.test.ts` or `*.test.tsx`
- Cover core rules such as single current task, `localStorage` restore, task status transitions, task deletion, and task ordering

Every behavior added from the implementation spec should have at least one test or a documented manual check.

## Commit & Pull Request Guidelines

Current git history is minimal (`first commit`), so use short imperative commit messages going forward, such as:

- `Add task state types`
- `Document dashboard empty states`

Pull requests should include:

- A short summary of the change
- Linked issue or task when available
- Screenshots for UI changes
- Notes on any new commands, config, or assumptions

## Agent-Specific Notes

Before implementing features, align with the specs in `docs/`. If code and docs diverge, update the docs in the same change.

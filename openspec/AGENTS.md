# OpenSpec instructions for this repository

This repository uses OpenSpec to document the current system and future changes.

## Scope

- Repository root contains helper scripts and investigation artifacts.
- The primary product lives in `private-chef/`.
- Specs should primarily target the `private-chef/frontend` and `private-chef/backend` modules.

## Baseline specs

- `openspec/specs/frontend/spec.md`
- `openspec/specs/backend/spec.md`
- `openspec/specs/shared/spec.md`

These describe current expected behavior. Update them only to reflect accepted reality.

## Change workflow

For a new feature or behavior change, create:

```text
openspec/changes/<change-name>/
├── proposal.md
├── design.md            # optional when simple, recommended when cross-module
├── tasks.md
└── specs/
    ├── frontend/spec.md # if frontend behavior changes
    ├── backend/spec.md  # if backend behavior changes
    └── shared/spec.md   # if shared contracts/domain rules change
```

Use kebab-case for `<change-name>`.

## Authoring rules

1. Use `SHALL`, `SHOULD`, and `MAY` for normative requirements.
2. Use `Given / When / Then` scenarios under each requirement.
3. Prefer user-facing behavior, API contracts, domain rules, and operational constraints.
4. Do not copy secrets or real environment values into specs.
5. When current deployment reality conflicts with older design notes, prefer:
   `private-chef/DEPLOYMENT_RUNBOOK.md`.

## Project-specific guidance

### Frontend

- Stack: React + TypeScript + Vite + Tailwind + Radix + TanStack Query.
- Important concerns: authenticated flows, responsive/mobile behavior, PWA routing,
  API requests with cookies, recipe/order/wish interactions.

### Backend

- Stack: Hono + TypeScript + Drizzle + SQLite.
- Important concerns: session-cookie auth, family scoping, COS upload presign,
  order lifecycle, notification events, input validation with Zod.

### Shared

- No standalone shared package currently exists.
- Use shared specs for cross-module domain concepts, API payload expectations,
  identifiers, statuses, and environment/integration contracts.

## Suggested templates

### Requirement template

```md
### Requirement: <name>
The system SHALL ...

#### Scenario: <name>
- **Given** ...
- **When** ...
- **Then** ...
```

### Change delta template

```md
## ADDED Requirements
### Requirement: <name>
...

## MODIFIED Requirements
### Requirement: <name>
...

## REMOVED Requirements
### Requirement: <name>
...
```

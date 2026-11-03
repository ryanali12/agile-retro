# AGENTS.md — Project

## Overview

This repository contains a software application consisting of:

- **Frontend:** React 19, TypeScript 7, Vite 8, npm, linted with oxlint
- **Backend:** ASP.NET Core Minimal APIs, C#, .NET 10
- **Database:** PostgreSQL
- **ORM / Data Access:** EF Core with the Npgsql provider
- **Validation:** Not yet established
- **Authentication:** None for end users; participants join anonymously with a share link and a display name (see [Authentication and Authorization](#authentication-and-authorization))
- **Realtime:** SignalR
- **Architecture:** Backend: a single ASP.NET Core minimal API project with explicit endpoint discovery; frontend: feature-based React SPA (see [Frontend Architecture](#frontend-architecture))
- **Testing:** Not yet established
- **Infrastructure / Orchestration:** Local PostgreSQL via `compose.yaml`; no deployment infrastructure yet
- **Frontend routing:** `react-router` (data router)
- **Realtime client:** `@microsoft/signalr`

Items marked "not yet established" have no implementation in the repository and no committed decision behind them. Do not assume or introduce a choice for them; confirm with the user before adding a validation library or test framework, or before introducing infrastructure beyond a local PostgreSQL instance.

---

## Product

AgileRetro is a collaborative retrospective ("retro") board application.

- A user creates a retro session.
- Other participants join an existing session and collaborate in it.
- Session content is shared in real time. Cards added to the board, action items, and related changes appear for every participant without a manual refresh.

Working domain vocabulary:

- **Session** — a single retro, created by its facilitator.
- **Participant** — someone who has joined a session.
- **Board item ("box")** — a card added to the board.
- **Board column** — a fixed, ordered column on the board; cards belong to a column.
- **Action item** — a follow-up captured during the retro for someone to act on afterwards.

Agreed design decisions:

- The board uses fixed columns of cards, not a freeform canvas. Column sets are fixed for now; configurable templates are a possible later change, not a current requirement.
- Participants join anonymously through a share link and supply a display name. There are no end-user accounts or passwords.
- Sessions and board content are persisted in PostgreSQL, so they survive process restarts.
- Real-time collaboration uses SignalR.

Current state: the foundation is in place, but no domain code exists yet. The backend has endpoint discovery, an EF Core `DbContext` with no entities, and a SignalR hub with no client-callable methods. The frontend has a router, app shell, API client, and SignalR connection factory, but no features. There is no domain model, migration, or session/card behavior.

Still undecided, confirm before implementing:

- Whether action items are a dedicated board column or a separate entity with its own lifecycle.
- What a session's lifecycle is (open, closed/archived) and whether content is mutable after closing.
- Whether more than one participant may edit or delete a given card, and who may.
- Whether retro "templates" (named column sets) are in scope.

This file provides project-specific instructions and conventions for AI coding agents working in this repository.

The existing repository is the source of truth for conventions that are not explicitly defined here.

---

## General Rules

- API and application security are top priorities and must always be considered when creating or modifying features.
- Read the existing code before making changes.
- Follow existing project conventions instead of introducing new patterns.
- Keep changes focused on the requested task.
- Do not modify unrelated files.
- Prefer simple, maintainable solutions over unnecessary abstractions.
- Do not introduce new dependencies unless necessary.
- Do not remove existing functionality unless explicitly requested.
- Prefer modifying existing implementations over creating duplicate implementations.
- Reuse existing components, services, utilities, and patterns where applicable.
- Do not introduce architectural patterns that conflict with the existing architecture.
- Run relevant tests and checks after making changes.

When uncertain about a convention, inspect surrounding code and follow the established pattern.

---

## Security

API and application security are top priorities when creating or modifying features.

- The backend or trusted server-side execution boundary must enforce sensitive logic, validation, and authorization.
- Never rely exclusively on frontend validation, route guards, or permission checks for security.
- Validate and sanitize incoming input before trusting it.
- Enforce authentication and authorization on protected operations.
- Never trust authorization information supplied directly by clients.
- Do not expose internal implementation details, stack traces, credentials, or sensitive database information in API responses or logs.
- Never commit secrets such as passwords, API keys, tokens, connection strings, certificates, or private keys.
- Follow the existing Authentication and Authorization conventions in this document.
- Consider security implications when introducing new endpoints, mutations, integrations, or rendered content.

---

## Repository Structure

The repository is organized as follows:

```text
/
├── src/
│   ├── AgileRetro.WebApi/         ASP.NET Core minimal API (.NET 10)
│   │   ├── Program.cs             Composition root: config, DbContext, SignalR, endpoint mapping
│   │   ├── Endpoint/
│   │   │   ├── IEndpoint.cs       Contract implemented by each endpoint class
│   │   │   └── EndpointExtensions.cs  Assembly scanning, registration, and mapping
│   │   ├── Data/
│   │   │   └── AgileRetroDbContext.cs EF Core context (no entities yet)
│   │   ├── Hubs/
│   │   │   └── BoardHub.cs        SignalR hub for board updates
│   │   ├── appsettings.json       Base configuration
│   │   ├── appsettings.Development.json
│   │   ├── Properties/
│   │   │   └── launchSettings.json Local launch profiles and URLs
│   │   └── AgileRetro.WebApi.http  Manual API request samples
│   │
│   └── agile-retro-web/           Vite + React + TypeScript frontend
│       ├── src/
│       │   ├── app/               App shell and router
│       │   ├── pages/             Route-level pages (including the design-system page)
│       │   ├── shared/
│       │   │   ├── api/           HTTP client
│       │   │   ├── components/ui/ Design-system primitives
│       │   │   ├── realtime/      SignalR connection
│       │   │   ├── theme/         Theme preference provider and helpers
│       │   │   └── utils/         cn() and other helpers
│       │   └── index.css          Tailwind entry point and design tokens
│       ├── public/
│       ├── vite.config.ts         Dev proxy for /api and /hubs
│       └── package.json
│
├── compose.yaml                   Local PostgreSQL service
├── .env.example                   Copy to .env (gitignored) for local credentials
├── agents.md                      General agent instructions
├── agent.project.md               Project-specific agent instructions (this file)
└── README.md                      Human setup and command reference
```

Notes:

- Both application projects live under `src/`. Follow this existing layout; do not move either project without being asked.
- There is currently no solution (`.sln`) file. Build and run the API by project path for now. If additional backend projects are added, introduce a solution file at that point rather than now.

Always verify the actual repository structure before assuming a path exists.

Follow the existing organization of source code and project files.

---

# Frontend

## Technology

- React 19
- TypeScript 7
- Vite 8 (build tool and dev server)
- npm (package manager; `package-lock.json` is committed)
- oxlint (`npm run lint`), configured via `.oxlintrc.json`
- `react-router` (data router via `createBrowserRouter`)
- `@microsoft/signalr` (client for the board hub)
- Tailwind CSS 4 via `@tailwindcss/vite` (no `tailwind.config.js`; tokens live in `src/index.css`)
- `tailwind-merge` and `clsx`, used through the `cn()` helper
- Theming: `ThemeProvider` / `useTheme` in `src/shared/theme` (system / light / dark), persisted in `localStorage` under `agile-retro.theme`
- Form management, validation, and data fetching / state management: not yet established. Establish these with the first feature and record the choice here rather than adding a library pre-emptively.

The frontend lives in `src/agile-retro-web/` and is not part of the .NET build. `npm run build` runs `tsc -b` before `vite build`, so type errors fail the build.

### Local Development

The API launch profiles (`src/AgileRetro.WebApi/Properties/launchSettings.json`) expose:

- HTTP: `http://localhost:5164`
- HTTPS: `https://localhost:7272`

Point the frontend at the API through Vite's dev-server proxy or a `VITE_`-prefixed environment variable. Do not hard-code the API URL into source files, and do not commit local `.env` files.

---

## Design System

All UI is built from Tailwind utilities and the primitives in `src/shared/components/ui/`. A live reference is at `/design` (`DesignPage`).

### Tokens

- Defined once in `src/index.css` as `light-dark()` pairs and mapped to utilities in `@theme inline` (`--color-bg`, `--color-surface`, `--color-surface-muted`, `--color-text`, `--color-muted`, `--color-border`, `--color-primary`, `--color-danger`, `--color-success`, `--color-warning`, `--color-overlay`).
- Use semantic utilities (`bg-surface`, `text-muted`, `border-border`, `bg-primary`, ...). Do not use raw palette classes such as `bg-gray-100` or hex values in components; add a token if something is missing.
- Dark mode is driven by `color-scheme`: `:root` is `light dark` (follow the OS) and `:root[data-theme='light' | 'dark']` pins it. Do not add `dark:` variants for colors a token already covers.

### Theme preference

- `ThemeProvider` (mounted in `src/main.tsx`) owns the preference: `system` (default), `light`, or `dark`.
- `ThemeToggle` in the header exposes all three. The choice is stored per browser under `agile-retro.theme`; `system` keeps following OS changes live.
- The inline script in `index.html` applies the stored preference before first paint. Keep its storage key in sync with `src/shared/theme/theme.ts`.
- Read the resolved theme with `useTheme().resolvedTheme`; use `preference` when describing the user's choice.

### Components

- Primitives: `Button` (plus `buttonStyles` for links), `Input`, `Textarea`, `Label`, `Field`, `Card`, `Badge`, `Drawer`. Import them from `src/shared/components/ui`.
- App-level components such as `ThemeToggle` live in `src/shared/components/` and compose primitives.
- Every component accepts `className` and merges it last with `cn()`, so callers adjust layout without fighting the defaults.
- `Field` wires `id`, `aria-describedby` and `aria-invalid` to its child. Pass it exactly one form control.
- Use `buttonStyles(...)` when a `<Link>` or another element must look like a button. Never nest a link inside a button.

### Overlays: Drawer, not modal

- Use `Drawer` for forms and detail views instead of a modal dialog. A sidebar keeps the board visible beside the panel.
- Use `position="right"` (default) for primary flows and `position="left"` for navigation or filters.
- The Drawer already handles Escape, overlay click (`closeOnClickOverlay`), body scroll locking, focus trapping, and focus restoration. Do not reimplement those in feature code.
- It stays mounted to animate; while closed it is `aria-hidden` and `inert`, so its content is not focusable.
- Always pass a `title` (used as the accessible name) and use `subTitle` for context, not instructions.

### Adding a component

- Put it in `src/shared/components/ui/`, export it from `index.ts`, and showcase it on the `/design` page.
- Keep it small, typed, and token-driven. Do not add a variant system until a second real use exists.

---

## Frontend Architecture

Organize frontend code according to the project's established architecture.

Prefer feature-based organization where appropriate.

Example, inside `src/agile-retro-web/`:

```text
agile-retro-web/
├── src/
│   ├── features/
│   │   ├── [feature-name]/
│   │   └── [feature-name]/
│   │
│   ├── shared/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── utilities/
│   │   └── ...
│   │
│   └── ...
│
└── ...
```

The frontend has an app shell (`src/app/App.tsx`), a data router (`src/app/router.tsx`), route pages under `src/pages/`, and cross-feature code under `src/shared/` (`api/client.ts` for HTTP, `realtime/boardConnection.ts` for SignalR).

- Feature-specific code goes in `src/features/<feature>/` once the first feature exists; do not create empty feature folders.
- Route-level pages live in `src/pages/` and compose feature components.
- Shared code goes in `src/shared/` only when it is genuinely used in more than one place.
- The Vite dev server proxies `/api` and `/hubs` to the API, so frontend code calls relative paths and never hard-codes the API host.

- Keep feature-specific code within the feature that owns it.
- Move code into shared locations only when it is genuinely reusable.
- Follow existing component and feature organization.
- Avoid unnecessary cross-feature dependencies.
- Do not reorganize existing code without a concrete reason.

---

## Components

- Reuse existing components before creating new ones.
- Follow existing component organization and naming conventions.
- Use established shared UI components where available.
- Avoid creating multiple components that provide substantially the same functionality.
- Keep components focused and maintainable.
- Separate reusable presentation logic from feature-specific behavior where appropriate.
- Follow accessibility conventions when implementing interactive components.
- Avoid unnecessary component abstractions.

---

## Programming Language and Type Safety

- Follow the language conventions established by the project.
- Prefer explicit and meaningful types for public interfaces and contracts.
- Avoid unsafe type conversions and loosely typed values.
- Avoid unnecessary use of `any`, dynamic types, or equivalent escape hatches.
- Handle nullable and optional values intentionally.
- Use meaningful variable, function, and component names.
- Keep feature-specific types close to the feature that owns them.
- Share types only when they are genuinely shared.
- Avoid duplicating API contracts unnecessarily.

---

## Forms

Use the project's established form management and validation libraries.

- Follow existing form implementation patterns.
- Keep validation rules close to the form or feature that owns them.
- Make validation behavior intentional.
- Provide clear validation feedback.
- Handle submission, loading, and error states appropriately.
- Prevent accidental duplicate submissions where necessary.
- Client-side validation primarily improves user experience.
- The backend remains authoritative for business rules and persisted data.

Do not unnecessarily duplicate complex business validation logic between frontend and backend.

---

## Data Fetching and State Management

Follow the existing data fetching and state management conventions.

- Use the established server-state management solution for API requests when available.
- Follow existing caching and invalidation patterns.
- Handle loading, success, empty, and error states.
- Avoid unnecessary API requests.
- Avoid manually implementing caching when an existing library provides the required functionality.
- Keep server state separate from local UI state where appropriate.
- Avoid introducing competing state management solutions without a concrete requirement.

---

## Routing

Use the project's established routing solution.

- Follow existing route organization.
- Keep route definitions consistent.
- Implement appropriate loading and error states.
- Use route guards where appropriate for user experience.
- Never treat frontend route protection as a security boundary.
- Enforce authorization on the backend or trusted server-side boundary.

---

# Backend

## Technology

- ASP.NET Core Minimal APIs on .NET 10 (`net10.0`)
- C# with `Nullable` and `ImplicitUsings` enabled (see `src/AgileRetro.WebApi/AgileRetro.WebApi.csproj`)
- OpenAPI document generation via `Microsoft.AspNetCore.OpenApi`, served at the default `/openapi/v1.json` path in Development only
- ORM / data access: EF Core with the Npgsql provider (`Npgsql.EntityFrameworkCore.PostgreSQL`)
- Database: PostgreSQL
- Realtime: SignalR (`Microsoft.AspNetCore.SignalR`, included with the shared framework); hub mapped at `/hubs/board`
- Validation framework: not yet established
- Authentication and authorization: no end-user accounts; anonymous participation is described in [Authentication and Authorization](#authentication-and-authorization)

`AgileRetroDbContext` is registered in `Program.cs` using the `ConnectionStrings:AgileRetro` setting. The connection string must be present or startup fails with an explanatory error; it is stored in user secrets for local development, never in `appsettings*.json`.

Do not add a validation framework until that choice is made explicitly.

---

## Architecture

Organize code according to the chosen architecture.

The backend uses explicit endpoint discovery rather than registering each route by hand:

- A feature's routes are implemented as a class implementing `IEndpoint` (`Endpoint/IEndpoint.cs`), with mapping logic in `MapEndpoint`.
- `AddEndpoints(typeof(Program).Assembly)` registers every `IEndpoint` implementation as a transient `IEndpoint` service; `MapEndpoints` resolves them and calls `MapEndpoint` on each.
- `Program.cs` maps them under the shared `/api` route group, so endpoint classes should declare paths relative to that prefix.

When adding a feature:

- Add one `IEndpoint` implementation per feature (or per cohesive group of routes) and let discovery pick it up; do not add a manual `app.Map...` call in `Program.cs`.
- Keep the endpoint class thin. Route grouping, validation calls, and authorization configuration belong there; business logic should live in code the endpoint delegates to.
- Keep request/response contracts and feature logic next to the endpoint as the feature grows.
- Do not introduce a layered architecture, generic repository, or service layer unless a concrete requirement demands it.
- Avoid unnecessary layers and abstractions.
- Keep business logic separate from infrastructure and presentation concerns where appropriate.
- Follow existing dependency boundaries.

---

## Realtime

SignalR is the agreed transport for live board updates. It is configured: `AddSignalR()` registers services and `BoardHub` is mapped at `/hubs/board`. The hub currently exposes no client-callable methods; session group membership and authorization arrive with the session feature.

- Mutations (create, update, delete) go through normal HTTP endpoints. SignalR carries the resulting notifications to participants; it is not the write path.
- Broadcast only after the change has been persisted, and broadcast the persisted result (id, timestamps, ordering) rather than echoing the raw request, so every client converges on the same state.
- Participants of a session belong to a SignalR group keyed by that session, and notifications are sent to that group only. Never broadcast to all connected clients.
- The hub is not a security boundary. Any hub method that reads or changes session state must verify the caller belongs to that session, with the same rules the HTTP endpoints apply.
- Hub payloads and client handlers should use the same contract types the HTTP endpoints expose; do not maintain a second, divergent shape.
- The frontend will need the `@microsoft/signalr` client package when the first realtime feature is built; record it here at that time and keep its connection lifecycle in one place.

---

## API Development

Use the API framework and conventions already established in the project.

Endpoints or controllers should handle appropriate transport-layer responsibilities, such as:

- Request binding.
- Authentication and authorization configuration.
- Input validation.
- Invoking application or feature logic.
- Returning appropriate responses.

Avoid putting substantial business logic directly inside endpoint or controller definitions when the architecture provides a suitable location.

### Endpoint Registration

Follow the project's existing endpoint or controller registration mechanism.

- Reuse existing registration extensions and conventions.
- Do not manually register individual endpoints when automatic discovery is already implemented.
- Call `AddEndpoints` during service configuration, before `builder.Build()`. The service collection is read-only afterwards, and modifying it throws `InvalidOperationException` at startup.
- Avoid duplicate route mappings.
- Keep endpoint registration consistent with the established architecture.

---

## Validation

Use the project's established backend validation framework.

- Associate validators with the request or feature they validate.
- Follow existing dependency injection and validator registration conventions.
- Validate incoming requests at appropriate boundaries.
- Distinguish between input validation, business rules, and authorization.
- Return consistent and meaningful validation errors.
- Do not use validation frameworks as a replacement for authorization.

Backend validation must remain authoritative regardless of frontend validation.

---

## API Design

- Use appropriate HTTP methods and status codes.
- Validate incoming requests.
- Follow existing API response conventions.
- Prefer explicit request and response contracts at API boundaries.
- Do not expose internal implementation details.
- Avoid returning persistence entities directly unless the project intentionally follows that convention.
- Keep response models focused on what consumers actually need.
- Maintain backward compatibility unless a breaking change is explicitly requested.
- Handle errors consistently.
- Document significant API behavior where appropriate.

---

# Database and Data Access

PostgreSQL is the database and EF Core (Npgsql provider) the data access technology. `AgileRetroDbContext` is registered and connects using the `ConnectionStrings:AgileRetro` setting; it currently has no entities.

Local development uses the PostgreSQL service in `compose.yaml`. Start it with `docker compose up -d --wait`, and keep the password in `.env` (gitignored, seeded from `.env.example`). The connection string itself belongs in user secrets:

```bash
cd src/AgileRetro.WebApi
dotnet user-secrets set "ConnectionStrings:AgileRetro" "Host=localhost;Port=5432;Database=agile_retro;Username=agile_retro;Password=<from .env>"
```

- Use EF Core with the Npgsql provider. Do not add a second ORM or a raw SQL layer alongside it.
- Read the connection string from configuration, never from source. Keep the real value in user secrets or environment variables, and do not commit it.
- Register the `DbContext` once in `Program.cs`. Features use it directly; do not introduce a generic repository layer above EF Core.
- Use EF Core migrations for schema changes. Do not hand-edit generated migration files unless a PostgreSQL-specific change cannot be expressed through the model.
- Do not call `EnsureCreated()` in application startup. Apply migrations explicitly, and treat automatic migration-on-start as a deployment decision, not a default.
- Avoid unnecessary database queries, N+1 patterns, and unbounded loads (for example, a board with all of its cards loaded lazily per column).
- Retrieve only the data the operation needs, and project to response contracts rather than returning entities directly.
- Use transactions when several writes must succeed or fail together. A card write plus its ordering update is one such case.
- Consider concurrency when multiple participants act at once. Where lost updates are possible, use explicit concurrency handling (a version/rowversion-style token) rather than last-write-wins by accident.
- Do not introduce repository abstractions solely to hide existing data access mechanisms.

## Entity Modeling

- Follow the project's existing entity modeling conventions.
- Prefer framework conventions where they adequately express the intended mapping.
- Use explicit mappings and constraints when necessary.
- Keep entity-specific configuration close to the entity that owns it where appropriate.
- Avoid duplicating configuration across annotations, mapping files, and Fluent APIs.
- Follow established naming and relationship conventions.
- Generate or update database migrations after changing the entity model when applicable.
- Do not hand-edit generated migrations unless a database-specific change cannot be modeled using the existing tooling.

---

# Authentication and Authorization

There are no end-user accounts. In this project "authentication" means establishing *which participant of which session* is calling, not identifying a person.

## Joining a session

- The facilitator creates a session and receives a share link containing the session identifier.
- A participant joins by opening the share link and supplying a display name. The server creates a `Participant` record for that session and issues an opaque participant token.
- The client presents that token on subsequent HTTP requests and on the SignalR connection. The server resolves the participant from the token and must never accept a participant id, session id, or role supplied by the client as proof of identity.
- The share link is a bearer credential: anyone holding it can join. Never log full share links. Session identifiers must be unguessable, and nothing sensitive beyond that identifier belongs in the URL.
- Treat the display name as untrusted input: validate its length, trim it, and encode it when rendered. Display names are not unique and are not identity.

## Authorization rules

- Every session-scoped operation must verify server-side that the caller's participant belongs to the target session.
- A participant may only read and modify content in sessions they have joined. A session id present in a request is never sufficient authorization on its own.
- Do not rely on the frontend hiding controls, and do not rely on SignalR group membership alone. Group membership follows a verified join, and hub methods must re-check the same rules the HTTP endpoints apply.
- Facilitator and participant are distinct roles. Which actions the facilitator alone may perform (closing the session, removing other participants' cards, deleting the session) is not decided yet; confirm before implementing. Role is stored server-side and never taken from the client.
- If the participant token is carried in a cookie, protect state-changing endpoints against CSRF. If it is carried in a header, keep it out of URLs and logs.
- Apply the same rules consistently across every endpoint and hub method that touches a session; a single unguarded route bypasses all of them.

When adding any session-scoped operation, consider:

- Ownership of the resource being changed.
- Whether the caller has joined that session at all.
- Whether the session is still open for changes.
- Whether the operation exposes another participant's data.
- Whether it must be broadcast, and to which group only.

---

# Configuration and Secrets

Never commit:

- Passwords.
- API keys.
- Client secrets.
- Authentication tokens.
- Database credentials.
- Private certificates.
- Production connection strings.
- Other sensitive credentials.

Use the project's existing configuration mechanism, such as:

- Environment variables.
- Secret managers.
- Secure configuration providers.
- Local development secrets.
- Deployment-specific configuration.

Rules:

- Never hard-code secrets into source code.
- Do not expose secrets through logs or API responses.
- Keep environment-specific settings outside application code where appropriate.
- Provide sensible defaults for non-sensitive configuration.
- Document required configuration values without exposing their actual secrets.

---

# Infrastructure and Deployment

Follow the infrastructure and deployment conventions established by the project.

- Reuse existing resource definitions and configurations.
- Avoid duplicate infrastructure definitions.
- Preserve existing service dependencies.
- Keep application business logic out of infrastructure configuration.
- Use appropriate health checks and startup dependencies where necessary.
- Keep environment-specific configuration separate.
- Do not commit production credentials or secrets.
- Consider deployment compatibility when modifying application configuration.
- Avoid changing deployment infrastructure when the task does not require it.

Only modify infrastructure or deployment configuration when the task actually requires it.

---

# Error Handling

Use the project's existing error-handling mechanism.

- Catch exceptions only when the code can meaningfully handle them.
- Avoid ad-hoc try/catch blocks everywhere.
- Do not silently swallow exceptions.
- Follow the existing API error response format.
- Do not expose stack traces, credentials, or internal implementation details.
- Log meaningful diagnostic information.
- Avoid logging sensitive information.
- Preserve enough context to troubleshoot failures safely.

---

# Testing

Before considering a change complete:

1. Build or compile the affected projects.
2. Run relevant unit tests.
3. Run integration tests when API, database, or infrastructure behavior is affected.
4. Run component or frontend tests when applicable.
5. Run linting, type checks, and static analysis where available.
6. Run the relevant application build when appropriate.
7. Review the changes for regressions and unintended side effects.

Add tests for:

- New behavior.
- Regression fixes.
- Important business rules.
- Authorization behavior.
- Significant API behavior.
- Important edge cases.

## Testing Conventions

- Follow the project's existing testing framework and organization.
- Reuse existing fixtures, test utilities, and setup mechanisms.
- Prefer testing observable behavior over implementation details.
- Keep tests independent and deterministic.
- Avoid relying on test execution order.
- Use isolated test data where appropriate.
- Do not bypass actual authentication or authorization behavior to make tests pass.
- Do not modify tests simply to make them pass unless the expected behavior has intentionally changed.

### Test Commands

Use the actual commands and scripts defined by the repository. The commands below reflect the current project layout; confirm they still exist before relying on them.

```bash
# Local database
docker compose up -d --wait
docker compose down

# Backend build
dotnet build src/AgileRetro.WebApi/AgileRetro.WebApi.csproj

# Backend run (Development environment; HTTP profile)
dotnet run --project src/AgileRetro.WebApi --launch-profile http

# Migrations (run from src/AgileRetro.WebApi/)
dotnet ef migrations add <Name>
dotnet ef database update

# Frontend install, dev server, and build (run from src/agile-retro-web/)
npm install
npm run dev
npm run build

# Frontend lint (oxlint)
npm run lint
```

Checks and status:

- The API fails fast at startup if `ConnectionStrings:AgileRetro` is missing. Set it with `dotnet user-secrets` as described in [Database and Data Access](#database-and-data-access).
- `dotnet build` succeeds with zero warnings; it is the current backend static check.
- Connection verification: `dotnet ef database update` connects to the database and applies pending migrations. With no migrations it only confirms connectivity.
- Frontend: `npm run build` type-checks with `tsc -b` before bundling, and `npm run lint` runs oxlint. Both currently pass.
- Unit, integration, and end-to-end tests: no test projects exist yet. Add them alongside the first feature that needs them and document the commands here.
- No frontend test runner is configured; selecting one (Vitest is the natural fit with Vite) is not yet decided.

Do not assume commands exist without checking the project configuration, and do not invent test commands.

---

# Dependencies

Before adding a dependency:

1. Check whether the repository already has an equivalent library.
2. Check whether the functionality can reasonably be implemented without a dependency.
3. Prefer established and actively maintained packages.
4. Explain why the dependency is necessary.
5. Follow existing package version conventions.

Do not add dependencies for trivial functionality.

---

# Code Style

Follow the formatting and naming conventions already present in the repository.

- Use meaningful names.
- Prefer clear and maintainable implementations.
- Avoid unnecessary complexity.
- Keep functions and methods focused.
- Use language and framework features that improve clarity.
- Follow existing nullability and error-handling conventions.
- Avoid broad formatting changes unrelated to the task.
- Do not introduce style conventions that conflict with the existing codebase.

---

# Git

Keep changes focused.

Do not:

- Rewrite Git history.
- Force-push.
- Delete branches.
- Modify unrelated files.

Unless explicitly instructed.

Before committing:

- Review the diff.
- Check for secrets.
- Check for accidental changes.
- Ensure generated files are not unintentionally committed.
- Verify relevant tests and checks.

Do not create commits unless explicitly requested.

---

# Agent Workflow

For every task, follow this workflow.

## 1. Understand

Inspect the relevant files and understand the existing implementation.

Look for:

- Existing implementations.
- Similar features.
- Existing components and utilities.
- Existing API patterns.
- Existing validation.
- Existing authentication and authorization.
- Existing tests.
- Existing configuration.
- Infrastructure and deployment dependencies.

Do not immediately create new files or abstractions.

## 2. Plan

Identify:

- Files that need to change.
- Existing patterns to follow.
- Potential side effects.
- Security implications.
- Tests that should be added or updated.
- Dependencies or infrastructure changes, if required.

For larger changes, briefly state the intended approach before implementing.

## 3. Implement

- Make the smallest reasonable change that solves the requested problem.
- Follow established conventions.
- Reuse existing implementations.
- Avoid unnecessary abstractions and dependencies.
- Keep changes focused.
- Do not modify unrelated functionality.

## 4. Verify

Run the appropriate commands.

- Build affected projects.
- Run relevant tests.
- Run linting and static analysis.
- Run integration tests when appropriate.
- Verify the requested behavior.

Use the actual package manager, framework, and scripts defined by the repository.

Do not claim that tests or checks passed unless they were actually executed successfully.

If a check cannot be executed, clearly state why.

## 5. Review

Before finishing, verify:

- The requested behavior works.
- Existing behavior was not unnecessarily changed.
- No unrelated files were modified.
- No unnecessary dependencies were added.
- Security implications were considered.
- Relevant tests and checks passed.
- The implementation follows existing architecture and conventions.

---

# Important

When these instructions conflict with explicit user instructions, follow the user's instructions unless doing so would violate higher-priority system, security, or repository constraints.

When uncertain about an existing project convention, inspect the codebase and follow the convention already used by the surrounding code.

**Do not invent architecture.**

**The existing repository is the source of truth.**

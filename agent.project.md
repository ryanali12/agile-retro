# AGENTS.md — Project

## Overview

This repository contains a software application consisting of:

- **Frontend:** React 19, TypeScript 7, Vite 8, npm, linted with oxlint
- **Backend:** ASP.NET Core Minimal APIs, C#, .NET 10
- **Database:** PostgreSQL
- **ORM / Data Access:** EF Core with the Npgsql provider
- **Validation:** FluentValidation on the backend; Zod with React Hook Form on the frontend
- **Authentication:** None for end users; participants join anonymously with a share link and a display name (see [Authentication and Authorization](#authentication-and-authorization))
- **Realtime:** SignalR
- **Architecture:** Backend: a single ASP.NET Core minimal API project with explicit endpoint discovery; frontend: feature-based React SPA (see [Frontend Architecture](#frontend-architecture))
- **Testing:** Not yet established
- **Infrastructure / Orchestration:** Local PostgreSQL via `compose.yaml`; no deployment infrastructure yet
- **Frontend routing:** `react-router` (`BrowserRouter` + `Routes`)
- **Realtime client:** `@microsoft/signalr`

Items marked "not yet established" have no implementation in the repository and no committed decision behind them. Do not assume or introduce a choice for them; confirm with the user before adding a test framework or introducing infrastructure beyond a local PostgreSQL instance.

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

Current state: session creation/join, the four-column board, and card creation and author-only editing are implemented. Session lookup and participant validation use HTTP; the board hub provides the initial snapshot and persists and broadcasts card writes.

Still undecided, confirm before implementing:

- Whether action items are a dedicated board column or a separate entity with its own lifecycle.
- What a session's lifecycle is (open, closed/archived) and whether content is mutable after closing.
- Whether a card may be deleted, and who may delete it. Editing is settled: only the card's author may edit their own card.
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
│   │   │   └── AgileRetroDbContext.cs EF Core context and migrations
│   │   ├── Entities/              Session, Participant, BoardCard, fixed ColumnKey values
│   │   ├── Features/              Endpoint and board feature logic, including BoardPresence
│   │   ├── Hubs/
│   │   │   └── BoardHub.cs        JoinBoard snapshot, card create/update writes, and presence changes
│   │   ├── appsettings.json       Base configuration
│   │   ├── appsettings.Development.json
│   │   ├── Properties/
│   │   │   └── launchSettings.json Local launch profiles and URLs
│   │   └── AgileRetro.WebApi.http  Manual API request samples
│   │
│   └── agile-retro-web/           Vite + React + TypeScript frontend
│       ├── src/
│       │   ├── app/               App shell, routes, base layout, not found
│       │   ├── features/
│       │   │   ├── home/          Homepage and create/join-by-link drawers
│       │   │   ├── design/        Design-system reference page
│       │   │   ├── session/       Session page shell, guard, header, share
│       │   │   ├── board/         Board UI, participants, hub client
│       │   │   └── participant/   Participant storage and join drawer
│       │   ├── shared/
│       │   │   ├── api/           HTTP client and error type
│       │   │   ├── components/    ThemeToggle, icons, and UI primitives
│       │   │   ├── theme/         Theme preference provider and helpers
│       │   │   └── utils/         cn() and initials helpers
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
- `react-router` (`BrowserRouter` + `Routes` in `src/app/Routes.tsx`)
- `@tanstack/react-query` for server state and mutations
- `react-hook-form` + `zod` via `@hookform/resolvers/zod` for forms and validation
- `@microsoft/signalr` (client for the board hub)
- `http-status-codes` for readable status checks
- Tailwind CSS 4 via `@tailwindcss/vite` (no `tailwind.config.js`; tokens live in `src/index.css`)
- `tailwind-merge` and `clsx`, used through the `cn()` helper
- Theming: `ThemeProvider` / `useTheme` in `src/shared/theme` (system / light / dark), persisted in `localStorage` under `agile-retro.theme`
- Participant identity: `SessionParticipantProvider` stores session code → participant ID in `sessionStorage`

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

The frontend has an app shell (`src/app/App.tsx`), route definitions (`src/app/Routes.tsx`), the marketing layout (`src/app/BaseLayout.tsx`), and the shared not-found page (`src/app/NotFoundPage.tsx`). Feature code lives under `src/features/`: `home/` (homepage and create/join-by-link drawers), `design/` (design-system page), `session/` (session page shell, guard, header, share drawer), `board/` (board, card and participants drawers, hub contracts and connection), and `participant/` (sessionStorage identity and join drawer). Cross-feature code lives under `src/shared/` (`api/client.ts` for the API error type, `components/` for UI primitives, icons and `ThemeToggle`, `theme/` for theming, and `utils/` for helpers).

- Feature-specific code goes in `src/features/<feature>/`; keep it within the feature that owns it.
- Route-level pages live in their feature (for example `src/features/session/SessionPage.tsx`) and compose feature components.
- Shared code goes in `src/shared/` only when it is genuinely used in more than one place.
- API modules read the base URL from `VITE_API_URL` (for example `http://localhost:5164/api` in the local `.env`). Do not hard-code the API host in source files, and do not commit local `.env` files.

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

Forms use `react-hook-form` with a `zod` schema passed to `zodResolver`. Follow the existing pattern in `src/features/home/CreateSessionDrawer.tsx` and `src/features/board/CardTextDrawer.tsx`.

- Define the schema and infer the form values from it (`z.infer<typeof schema>`); do not hand-write a parallel form type.
- Register inputs with `{...register("field")}` and pass `errors.field?.message` to `Field`'s `error` prop.
- Use `mode: "onBlur"` and `reValidateMode: "onBlur"` so errors appear after the first interaction, not while typing.
- Add `noValidate` to the form so the browser's native bubbles do not compete with field messages.
- Do not disable the submit button just because the form is not valid yet; let submission run validation and show field errors. Disable only while a mutation is pending.
- Show mutation failures inline with `role="alert"`; do not use `alert()` or other blocking dialogs.
- Keep validation rules close to the form or feature that owns them.
- Client-side validation primarily improves user experience. The backend remains authoritative for business rules and persisted data.

Do not unnecessarily duplicate complex business validation logic between frontend and backend.

---

## Data Fetching and State Management

Server state uses `@tanstack/react-query` through the `QueryClientProvider` in `src/app/App.tsx`.

- Use `useQuery` / `useQueries` for reads and `useMutation` for writes.
- Give queries stable, descriptive keys that include every input (for example `["sessionByCode", sessionCode]`).
- Disable queries whose inputs are missing (`enabled`) instead of calling the API with placeholder values.
- Do not retry `404` responses; they are not transient. Retry only unexpected failures.
- Handle loading, success, empty, and error states explicitly. Use `SessionStatusScreen` for full-page session states.
- Invalidate or update cached data after a mutation; do not duplicate server state into a global store.
- Keep server state separate from local UI state. Board cards live in the TanStack Query cache and are updated by hub events; do not mirror them into component state.
- Avoid manually implementing caching when TanStack Query provides the required functionality.

---

## Routing

Routes are declared in `src/app/Routes.tsx` with `react-router`.

- `/` — homepage with create and join drawers.
- `/design` — design-system reference.
- `/sessions/:code` — the retro board. It renders outside `BaseLayout` because the board needs the full viewport and its own header.
- `*` — not found, inside the marketing layout.

`SessionPageGuardDataProvider` loads the session and validates the stored participant before rendering the board. It handles loading, missing session, missing participant (join drawer), expired participant, and generic errors. All of those states use `SessionStatusScreen`.

- Follow existing route organization and keep route definitions consistent.
- Implement appropriate loading and error states.
- Never treat frontend route protection as a security boundary. Enforce authorization on the backend.

### Session board

- Columns are fixed and ordered: Went well, Didn't go well, Needs improvement, Action items (see `src/features/board/boardColumns.ts`). Accents are success, danger, warning, and primary respectively.
- Use `Board` with `BoardCard[]`; it groups cards by `columnId` and renders the empty state per column. Cards authored by the current participant get a `You` badge and primary highlight by comparing `card.participantId` with the guard's participant id.
- Cards are persisted in `BoardCard` and loaded through the hub's `JoinBoard`, which also subscribes the connection to the session group. Card creation goes through `CreateCard` and edits go through `UpdateCard`; the server broadcasts `CardCreated` / `CardUpdated` to the rest of the group.
- Only the card's author may edit it. The client shows an Edit action on cards whose `participantId` matches the current participant, and the server scopes `UpdateCardAsync` to that participant, so a payload cannot edit another participant's card.
- Active participants are tracked per live hub connection in `BoardPresence`. `JoinBoard` returns the current list, and the hub broadcasts `ParticipantsChanged` on join and disconnect. A participant with several tabs is listed once and disappears only when their last connection closes.
- The board shows a connection badge (`Live`, `Connecting`, `Reconnecting`, `Offline`) instead of the old local-preview badge.
- `CardTextDrawer` handles both create and edit modes with the same RHF + Zod validation; new cards are attributed to the connection's participant membership, and edits are only enabled while the connection is live.
- The participants drawer (`ParticipantsDrawer`) shows who is online now, marks the current participant, and updates live while open.
- `SessionPage` is a thin route wrapper; `SessionScreen` owns route state, while `SessionHeader`, `SessionBoardHeader`, `SessionConnectionBadge`, and `SessionBoardStates` render the page's regions.
- The share drawer opens automatically exactly once after session creation via router state `{ created: true }`. Treat that flag as one-shot and clear it from history.

---

# Backend

## Technology

- ASP.NET Core Minimal APIs on .NET 10 (`net10.0`)
- C# with `Nullable` and `ImplicitUsings` enabled (see `src/AgileRetro.WebApi/AgileRetro.WebApi.csproj`)
- OpenAPI document generation via `Microsoft.AspNetCore.OpenApi`, served at the default `/openapi/v1.json` path in Development only
- ORM / data access: EF Core with the Npgsql provider (`Npgsql.EntityFrameworkCore.PostgreSQL`)
- Database: PostgreSQL
- Realtime: SignalR (`Microsoft.AspNetCore.SignalR`, included with the shared framework); hub mapped at `/hubs/board`
- Validation: FluentValidation, registered by assembly scanning in `Program.cs`
- Authentication and authorization: no end-user accounts; anonymous participation is described in [Authentication and Authorization](#authentication-and-authorization)

`AgileRetroDbContext` is registered in `Program.cs` using the `ConnectionStrings:AgileRetro` setting. The connection string must be present or startup fails with an explanatory error; it is stored in user secrets for local development, never in `appsettings*.json`.

Keep validators next to their endpoint and return `TypedResults.BadRequest` with the validation dictionary when a request is invalid.

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

SignalR is the transport for the live board. `AddSignalR()` registers services and `BoardHub` is mapped at `/hubs/board`. Session lookup and participant validation stay on HTTP; the board itself is hub-first.

- `JoinBoard(code, participantId)` validates that the participant belongs to the session, binds the connection to that membership, adds it to the `session:{sessionId}` group, registers presence, and returns the board snapshot. Initial load and reconnect resync both use this method.
- `CreateCard(columnKey, text)` is the write path for new cards. It resolves the author from the connection's membership, validates input, persists the card, and broadcasts the persisted `CardCreated` payload to the group (excluding the caller, which receives the method result).
- `UpdateCard(cardId, text)` edits an existing card. It resolves the author from the connection's membership, updates only a card that matches both the session and that participant, and broadcasts the persisted `CardUpdated` payload to the group (excluding the caller, which receives the method result). A card owned by someone else is rejected.
- `BoardPresence` is a singleton because SignalR creates a hub instance per invocation. It keys connections by session and participant, deduplicates multiple tabs for one participant, and is cleaned up in `OnDisconnectedAsync`, which broadcasts `ParticipantsChanged`.
- Never accept a participant id from a write payload as identity. The membership established by `JoinBoard` is the authorization context for later hub calls.
- Broadcast only after the change has been persisted, and broadcast the persisted result (id, timestamps, author name) so every client converges.
- Participants of a session belong to a group keyed by session id, and notifications are sent to that group only. Never broadcast to all connected clients.
- The hub is not a security boundary on its own. Membership is revalidated on join, and the same session rules apply to hub methods and HTTP endpoints.
- Hub payloads and client handlers should use the same contract types. The frontend validates hub payloads with Zod in `src/features/board/api.ts`.
- Keep the connection lifecycle in `src/features/board/useBoardSession.ts`: one connection per mounted session, `JoinBoard` on connect and reconnect, and cache updates for broadcast events.
- The Vite dev server proxies `/hubs` to the API, so the default hub URL is `/hubs/board`. Set `VITE_HUB_URL` only when the hub is on another origin.

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

PostgreSQL is the database and EF Core (Npgsql provider) the data access technology. `AgileRetroDbContext` is registered and connects using the `ConnectionStrings:AgileRetro` setting; it has `Session`, `Participant`, and `BoardCard` entities.

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
- A participant joins by opening the share link and supplying a display name. The server creates a `Participant` record for that session and returns its id.
- The client stores the participant id in `sessionStorage` and presents it on later HTTP requests and on `JoinBoard`. The id is not a secret and is trust-on-first-use until an opaque participant token is introduced. The server must still verify that the participant belongs to the target session, and must never accept a participant id, session id, or role from a write payload as proof of identity.
- The share link is a bearer credential: anyone holding it can join. Never log full share links. Session identifiers must be unguessable, and nothing sensitive beyond that identifier belongs in the URL.
- Treat the display name as untrusted input: validate its length, trim it, and encode it when rendered. Display names are not unique and are not identity.

## Authorization rules

- Every session-scoped operation must verify server-side that the caller's participant belongs to the target session.
- A participant may only read and modify content in sessions they have joined. A session id present in a request is never sufficient authorization on its own.
- Do not rely on the frontend hiding controls, and do not rely on SignalR group membership alone. Group membership follows a verified join, and hub methods must re-check the same rules the HTTP endpoints apply.
- `JoinBoard` validates membership and binds the connection to it; `CreateCard` and `UpdateCard` use that bound membership as their author and ignore any participant id in the payload. `UpdateCard` additionally scopes the update to cards authored by that participant.
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

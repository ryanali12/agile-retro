# AgileRetro

Collaborative retrospective ("retro") board application. A facilitator creates a session, participants join through a share link, and board changes appear live for everyone.

## Requirements

- .NET 10 SDK
- Node.js 24 and npm
- Docker, for the local PostgreSQL instance

## Local setup

### 1. Start PostgreSQL

```bash
cp .env.example .env      # then set a local password in .env
docker compose up -d --wait
```

PostgreSQL listens on `localhost:5432` with database and user `agile_retro`.

### 2. Configure and run the API

```bash
cd src/AgileRetro.WebApi

dotnet user-secrets set "ConnectionStrings:AgileRetro" \
  "Host=localhost;Port=5432;Database=agile_retro;Username=agile_retro;Password=<password from .env>"

dotnet ef database update
dotnet run --launch-profile http
```

The API listens on `http://localhost:5164`. OpenAPI is served at `/openapi/v1.json` in Development.

### 3. Run the frontend

```bash
cd src/agile-retro-web
npm install
npm run dev
```

The app is served on `http://localhost:5173`. The Vite dev server proxies `/api` and `/hubs` to the API, so the browser only talks to the frontend origin. Override the proxy target with `API_PROXY_TARGET` if the API runs elsewhere; see `.env.example`.

## Production

Vite's proxy is development-only. Build the frontend with the public API origin and serve `dist/` from any static host:

```bash
cd src/agile-retro-web

VITE_API_URL=https://api.example.com/api \
VITE_HUB_URL=https://api.example.com/hubs/board \
npm run build
```

The URL is baked into the build, so rebuild when the API origin changes. If the frontend and API share an origin, omit both variables and the client uses `/api` and `/hubs/board`.

Allow the frontend origin in the API through configuration:

```json
{
  "Cors": {
    "AllowedOrigins": ["https://app.example.com"]
  }
}
```

With environment variables, use `Cors__AllowedOrigins__0=https://app.example.com`. When no origins are configured, the API only serves same-origin requests.

## Design system

The UI uses Tailwind CSS 4, with tokens defined in `src/agile-retro-web/src/index.css` and shared primitives (buttons, inputs, cards, badges, the `Drawer` sidebar, and the `ConfirmDialog` modal) in `src/agile-retro-web/src/shared/components/ui/`. A live reference is served at `http://localhost:5173/design`.

The theme follows the operating system by default. The header toggle can pin Light or Dark per browser; the choice is remembered.

## Session flow

1. **Create a session** from the homepage. The drawer asks for a session name and your display name, validates with React Hook Form + Zod, and calls `POST /api/sessions`.
2. On success you land on `/sessions/:code`, the full-width retro board, with the share drawer open so you can copy the link.
3. Opening a share link without a stored participant shows the join screen. After joining, the board loads with your display name.
4. The board has four columns: **Went well**, **Didn't go well**, **Needs improvement**, and **Action items**. Cards are added through a drawer. Your own cards are marked **You** and can be edited in place or deleted after confirming in a compact dialog; other participants' cards are read-only.
5. Board cards are stored in PostgreSQL. `JoinBoard` loads the board snapshot and subscribes the tab to the session; `CreateCard`, `UpdateCard`, and `DeleteCard` persist a card and broadcast it, so every participant sees the change without refreshing. Only the card's author can edit or delete their own card.
6. The header shows how many participants are online. Open the participants drawer to see who is active; the list updates live as people join or leave, and multiple tabs from one person count once.

The board shows a `Live` badge while connected and a `Reconnecting` / `Offline` state if the hub connection drops. The Vite dev server proxies `/hubs` to the API, so no extra environment variable is needed for realtime. Set `VITE_HUB_URL` only if the hub runs on another origin.

## Frontend stack

- React 19 + TypeScript + Vite
- React Router
- TanStack Query for API reads and mutations
- React Hook Form + Zod for forms and validation
- SignalR (`@microsoft/signalr`) for the live board connection
- Tailwind CSS 4 with the shared design-system primitives

## Common commands

```bash
# API build / run
dotnet build src/AgileRetro.WebApi/AgileRetro.WebApi.csproj
dotnet run --project src/AgileRetro.WebApi --launch-profile http

# Migrations (from src/AgileRetro.WebApi)
dotnet ef migrations add <Name>
dotnet ef database update

# Frontend (from src/agile-retro-web)
npm run dev
npm run build
npm run lint
```

## Conventions

Contributor and AI-agent conventions live in [agents.md](agents.md) and [agent.project.md](agent.project.md).

# AgileRetro

Collaborative retrospective ("retro") board application. A facilitator creates a session, participants join through a share link, and board changes appear live for everyone.

## Requirements

- .NET 10 SDK
- Node.js 24 and npm
- Docker and Docker Compose

## Local setup

There are two supported ways to run the app locally: the full Docker Compose stack or the API and frontend on the host. The frontend always talks to the API over HTTP, and the board uses SignalR.

### Option A: Docker Compose

Copy the environment file and set the local values:

```bash
cp .env.example .env
```

At minimum, set:

```dotenv
POSTGRES_PASSWORD=<local password>

WEB_APP_API_URL=http://localhost:5200/api
WEB_APP_HUB_URL=http://localhost:5200/hubs
CORS_ALLOWED_ORIGINS_0=http://localhost:5201

# Optional audio/video. The board still works without LiveKit.
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=<key>
LIVEKIT_API_SECRET=<secret>
```

LiveKit is not part of the Compose stack. Run a local LiveKit server or point `LIVEKIT_URL` at LiveKit Cloud. When the key and secret are empty, the token endpoint returns `503` and the rest of the board continues to work.

Then start the stack:

```bash
docker compose up --build
```

The dev stack exposes:

- Frontend with Vite HMR: `http://localhost:5201`
- API with `dotnet watch`: `http://localhost:5200`
- PostgreSQL: `localhost:5432`

Apply migrations once from the host:

```bash
cd src/AgileRetro.WebApi

dotnet user-secrets set "ConnectionStrings:AgileRetro" \
  "Host=localhost;Port=5432;Database=agile_retro;Username=agile_retro;Password=<password from .env>"

dotnet ef database update
```

The dev frontend calls the absolute API URL from `WEB_APP_API_URL`, so the API must allow the frontend origin through `CORS_ALLOWED_ORIGINS_0`. The Vite dev server also has a proxy for `/api` and `/hubs`, which is used when the client URLs are relative rather than absolute.

### Option B: API and frontend on the host

Start only PostgreSQL:

```bash
docker compose up -d db
```

Run the API:

```bash
cd src/AgileRetro.WebApi

dotnet user-secrets set "ConnectionStrings:AgileRetro" \
  "Host=localhost;Port=5432;Database=agile_retro;Username=agile_retro;Password=<password from .env>"

dotnet user-secrets set "LiveKit:ApiKey" "<key>"
dotnet user-secrets set "LiveKit:ApiSecret" "<secret>"
dotnet user-secrets set "LiveKit:Url" "ws://localhost:7880"

dotnet ef database update
dotnet run --launch-profile http
```

The API listens on `http://localhost:5164`. OpenAPI is served at `/openapi/v1.json` in Development.

Run the frontend in a second terminal:

```bash
cd src/agile-retro-web
npm install

cat > .env <<'EOF'
VITE_API_URL=http://localhost:5164/api
VITE_HUB_URL=http://localhost:5164/hubs
EOF

npm run dev
```

The app is served on `http://localhost:5173`. With those variables set, the browser calls the API directly and the API's Development CORS policy allows the Vite origin.

## Production

Production uses `compose.prod.yml`, which runs PostgreSQL, the API, the static frontend, and an nginx reverse proxy:

- `web_api` — API image on port 8080 inside the network
- `web_app` — static frontend image served by nginx on port 80
- `nginx` — public entrypoint on host port `5202`
- `db` — PostgreSQL

The API and frontend images are published as `ghcr.io/ryanali12/agile-retro-web-api` and `ghcr.io/ryanali12/agile-retro-web`. If the packages are private, authenticate first with `docker login ghcr.io`.

### Configuration

Create `.env` next to `compose.prod.yml`:

```dotenv
POSTGRES_HOST=agile_retro_db_prod
POSTGRES_PORT=5432
POSTGRES_USER=agile_retro
POSTGRES_DB=agile_retro
POSTGRES_PASSWORD=<secret>

POSTGRES_CONNECTION_STRING=Host=${POSTGRES_HOST};Port=${POSTGRES_PORT};Database=${POSTGRES_DB};Username=${POSTGRES_USER};Password=${POSTGRES_PASSWORD}

WEB_API_PORT=5200
WEB_APP_PORT=5201
WEB_APP_API_URL=/api
WEB_APP_HUB_URL=/hubs

# Public origin users load in the browser. Only needed for cross-origin API
# requests; with the same-origin nginx setup it is harmless to keep set, but
# it must be an absolute origin if Compose passes it.
CORS_ALLOWED_ORIGINS_0=https://retro.example.com

# LiveKit server and server-side API credentials.
LIVEKIT_URL=wss://livekit.example.com
LIVEKIT_API_KEY=<key>
LIVEKIT_API_SECRET=<secret>
```

With `WEB_APP_API_URL=/api` and `WEB_APP_HUB_URL=/hubs`, all browser traffic goes through nginx on the same origin. `nginx.conf` proxies `/api` and `/hubs` to the API and everything else to the static frontend. For a direct cross-origin setup, use absolute URLs such as `https://api.example.com/api` and `https://api.example.com/hubs`, and set `CORS_ALLOWED_ORIGINS_0` to the frontend origin.

The frontend image is built without fixed API, hub, or LiveKit URLs. The built JavaScript contains the `APP_API_URL`, `APP_HUB_URL`, and `APP_LIVEKIT_URL` placeholders, and `src/agile-retro-web/env.sh` replaces them at container startup from the matching environment variables that Compose derives from `WEB_APP_API_URL`, `WEB_APP_HUB_URL`, and `LIVEKIT_URL`.

### Deploy

```bash
docker compose -f compose.prod.yml pull
docker compose -f compose.prod.yml up -d
docker compose -f compose.prod.yml exec web_api ./efbundle
```

The last command applies the EF Core migrations bundled into the API image. Open the app through nginx at `http://<host>:5202`.

For a public deployment:

- Publish only nginx (or terminate TLS in front of it). The `db`, `web_api`, and `web_app` port mappings in `compose.prod.yml` are for local testing and should be removed or firewalled.
- Configure HTTPS at nginx or the upstream load balancer.
- Set `AllowedHosts` to the real hostnames and, for a cross-origin API, set `CORS_ALLOWED_ORIGINS_0` to the frontend origin.
- Keep production secrets in environment variables or a secret manager, and rotate any credential that has been committed to the repository.

## Design system

The UI uses Tailwind CSS 4, with tokens defined in `src/agile-retro-web/src/index.css` and shared primitives (buttons, inputs, cards, badges, the `Drawer` sidebar, and the `ConfirmDialog` modal) in `src/agile-retro-web/src/shared/components/ui/`. A live reference is served at `/design` (`http://localhost:5173/design` in host development, or the corresponding route in Docker).

The theme follows the operating system by default. The header toggle can pin Light or Dark per browser; the choice is remembered.

## Session flow

1. **Create a session** from the homepage. The drawer asks for a session name and your display name, validates with React Hook Form + Zod, and calls `POST /api/sessions`.
2. On success you land on `/sessions/:code`, the full-width retro board, with the share drawer open so you can copy the link.
3. Opening a share link without a stored participant shows the join screen. After joining, the board loads with your display name.
4. The board has four columns: **Went well**, **Didn't go well**, **Needs improvement**, and **Action items**. Cards are added through a drawer. Your own cards are marked **You** and can be edited in place or deleted after confirming in a compact dialog; other participants' cards are read-only.
5. Board cards are stored in PostgreSQL. `JoinBoard` loads the board snapshot and subscribes the tab to the session; `CreateCard`, `UpdateCard`, and `DeleteCard` persist a card and broadcast it, so every participant sees the change without refreshing. Only the card's author can edit or delete their own card.
6. The header shows how many participants are online. Open the participants drawer to see who is active; the list updates live as people join or leave, and multiple tabs from one person count once.

The board shows a `Live` badge while connected and a `Reconnecting` / `Offline` state if the hub connection drops. The hub URL comes from `VITE_HUB_URL` in development, or the `APP_HUB_URL` runtime substitution in the production image, with `/hubs` as the same-origin path.

## LiveKit (audio/video)

LiveKit provides optional audio/video for a session. Media traffic goes directly between participants and the LiveKit server; the API only issues access tokens.

The token endpoint is:

```text
POST /api/sessions/{code}/livekit-token
Content-Type: application/json

{ "participantId": "<id>" }
```

It returns:

```json
{
  "token": "<jwt>",
  "url": "wss://livekit.example.com",
  "roomName": "session-<session uuid>",
  "expiresAt": "2026-01-01T12:00:00Z"
}
```

The endpoint reuses the same membership check as `JoinBoard`, so a participant can only get a token for a session they have joined. It returns `404` when the session or participant is unknown and `503` when LiveKit is not configured. Full API documentation is available in the OpenAPI document at `/openapi/v1.json` in Development.

Server configuration:

- `LiveKit:ApiKey` — API key used to sign tokens.
- `LiveKit:ApiSecret` — API secret, at least 32 bytes as issued by LiveKit. Keep this server-side only; never expose it to the frontend.
- `LiveKit:Url` — WebSocket URL returned to clients.
- `LiveKit:TokenLifetime` — optional token lifetime, default `01:00:00`.

Use user secrets locally and `LiveKit__ApiKey`, `LiveKit__ApiSecret`, `LiveKit__Url`, and `LiveKit__TokenLifetime` in containers. Request a new token before `expiresAt`.

Tokens use the participant id as the LiveKit identity and are scoped to `session-<session id>`. They allow publishing and subscribing, but not room administration or data messages. A second connection with the same identity replaces the first, so one participant represents one voice session even if the board is open in multiple tabs.

Use the `url` returned by the endpoint. `VITE_LIVEKIT_URL` is only a fallback for deployments where the server URL is not configured.

## Frontend stack

- React 19 + TypeScript + Vite
- React Router
- TanStack Query for API reads and mutations
- React Hook Form + Zod for forms and validation
- SignalR (`@microsoft/signalr`) for the live board connection
- Tailwind CSS 4 with the shared design-system primitives

## Common commands

```bash
# Entire local stack
docker compose up --build

# Local PostgreSQL only
docker compose up -d db

# API build / run
dotnet build src/AgileRetro.WebApi/AgileRetro.WebApi.csproj
dotnet run --project src/AgileRetro.WebApi --launch-profile http

# API integration tests (Docker required for Testcontainers)
dotnet test src/AgileRetro.WebApi.Integration.Tests/AgileRetro.WebApi.Integration.Tests.csproj

# Migrations (from src/AgileRetro.WebApi)
dotnet ef migrations add <Name>
dotnet ef database update

# Frontend (from src/agile-retro-web)
npm run dev
npm run build
npm run lint

# Production stack
docker compose -f compose.prod.yml pull
docker compose -f compose.prod.yml up -d
```

## CI

`.github/workflows/ci.yml` runs on pull requests to `main` and can be triggered manually from the Actions tab for any branch. It builds the backend, runs the integration tests (Docker is available on the hosted runner for Testcontainers), and lints and builds the frontend. To block merges on it, add the `Backend build and integration tests` and `Frontend lint and build` jobs as required status checks in the repository's branch protection rules.

## Conventions

Contributor and AI-agent conventions live in [agents.md](agents.md) and [agent.project.md](agent.project.md).

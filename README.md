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

Production uses `compose.prod.yml`, which runs PostgreSQL, the API, the static frontend, an nginx reverse proxy, and a certbot helper for TLS certificates:

- `db` — PostgreSQL
- `web_api` — API image on port 8080 inside the network
- `web_app` — static frontend image served by nginx on port 80
- `nginx` — public entrypoint on host ports `80` and `443`
- `certbot` — certificate issuance and renewal helper with webroot and certificate volumes

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

# LiveKit server and server-side API credentials. The frontend LiveKit URL is
# set separately as APP_LIVEKIT_URL on the web_app service in compose.prod.yml.
LIVEKIT_URL=wss://livekit.example.com
LIVEKIT_API_KEY=<key>
LIVEKIT_API_SECRET=<secret>
```

`LIVEKIT_URL` configures the token issuer in the API. The frontend's `APP_LIVEKIT_URL` is set directly on the `web_app` service in `compose.prod.yml` (currently the project's LiveKit Cloud instance) rather than derived from `LIVEKIT_URL`; update it when pointing the frontend at a different LiveKit server.

With `WEB_APP_API_URL=/api` and `WEB_APP_HUB_URL=/hubs`, all browser traffic goes through nginx on the same origin. `nginx.conf` proxies `/api` and `/hubs` to the API and everything else to the static frontend. For a direct cross-origin setup, use absolute URLs such as `https://api.example.com/api` and `https://api.example.com/hubs`, and set `CORS_ALLOWED_ORIGINS_0` to the frontend origin.

The frontend image is built without fixed API, hub, or LiveKit URLs. The built JavaScript contains the `APP_API_URL`, `APP_HUB_URL`, and `APP_LIVEKIT_URL` placeholders, and `src/agile-retro-web/env.sh` replaces them at container startup from the matching environment variables. Compose derives `APP_API_URL` and `APP_HUB_URL` from `WEB_APP_API_URL` and `WEB_APP_HUB_URL`; `APP_LIVEKIT_URL` is set directly in `compose.prod.yml`.

### Deploy

```bash
docker compose -f compose.prod.yml pull
docker compose -f compose.prod.yml up -d
docker compose -f compose.prod.yml exec web_api ./efbundle
```

The last command applies the EF Core migrations bundled into the API image. After DNS points at the host, open the app through nginx at `http://<host>` (port 80).

### TLS and certificates

The `certbot` service mounts `./certbot/www` as the ACME webroot and `./certbot/conf` for issued certificates. Nginx mounts the same directories read-only at `/var/www/certbot` and `/etc/nginx/ssl`.

The checked-in `nginx.conf` listens on port 80 only. To terminate TLS in this stack, add an HTTPS server block that references the certificates under `/etc/nginx/ssl/live/<domain>/` and an ACME challenge location for `/.well-known/acme-challenge/`, then issue or renew certificates explicitly:

```bash
docker compose -f compose.prod.yml run --rm certbot certonly --webroot -w /var/www/certbot -d <domain>
docker compose -f compose.prod.yml run --rm certbot renew
```

Reload nginx after certificates change. The certbot service is a helper for explicit commands rather than a long-running renewal daemon. Alternatively, terminate TLS in front of nginx and keep port 80 internal.

For a public deployment:

- Expose only nginx on ports 80 and 443 (or terminate TLS upstream). The `db`, `web_api`, and `web_app` port mappings in `compose.prod.yml` are for local testing and should be removed or firewalled.
- Use the certbot service or an upstream load balancer for HTTPS.
- Keep `certbot/` out of version control; it contains private keys and issued certificates.
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

## API

HTTP endpoints are grouped under `/api`. The root route and the SignalR hub are mapped separately. In Development, the OpenAPI document is served at `/openapi/v1.json` and the Scalar UI at `/scalar/v1`. In production, nginx proxies `/api` and `/hubs` to the API, so the same paths work on the public origin.

### HTTP endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/` | Plain-text liveness check |
| `POST` | `/api/sessions` | Create a session and its first participant |
| `GET` | `/api/sessions/by-code/{code}` | Look up a session by join code |
| `POST` | `/api/sessions/{code}/participants` | Join an existing session |
| `GET` | `/api/sessions/{sessionCode}/participants/{participantId}` | Look up a participant |
| `POST` | `/api/sessions/{code}/livekit-token` | Issue a LiveKit access token |

All request bodies use JSON. Validation failures return `400` with a dictionary of field names to message arrays, for example:

```json
{
  "Name": ["'Name' must not be empty."],
  "ParticipantName": ["'Participant Name' must be between 1 and 100 characters."]
}
```

#### `GET /`

Returns `Hello` as `text/plain`. Use it as a basic liveness check.

#### `POST /api/sessions`

Creates a session with an 8-character join code and registers the facilitator as the first participant.

```json
{
  "name": "Sprint 42 retro",
  "participantName": "Ada"
}
```

`name` and `participantName` are required and limited to 100 characters. Returns `200`:

```json
{
  "id": "6f1f0f3e-6a1e-4a3e-9e1e-5f0e2f0f3e6a",
  "name": "Sprint 42 retro",
  "code": "ABCD2345",
  "participantId": "7a2a1b4c-8d3e-4f5a-9b6c-1d2e3f4a5b6c",
  "participantName": "Ada"
}
```

#### `GET /api/sessions/by-code/{code}`

Returns the session matching the join code, or `404` when no session has that code.

```json
{
  "id": "6f1f0f3e-6a1e-4a3e-9e1e-5f0e2f0f3e6a",
  "name": "Sprint 42 retro",
  "code": "ABCD2345"
}
```

#### `POST /api/sessions/{code}/participants`

Adds a participant to an existing session. Returns `404` when the code is unknown and `400` when the body is invalid.

```json
{
  "participantName": "Grace"
}
```

Returns `200`:

```json
{
  "participantId": "9b3b2c5d-9e4f-4a6b-8c7d-2e3f4a5b6c7d",
  "participantName": "Grace"
}
```

Store `participantId`; it identifies the participant on later HTTP and hub calls. It is not a secret, but the API verifies that it belongs to the session before using it.

#### `GET /api/sessions/{sessionCode}/participants/{participantId}`

Returns the participant's id and display name when the participant belongs to the session. Returns `404` when the session or participant is unknown.

```json
{
  "id": "9b3b2c5d-9e4f-4a6b-8c7d-2e3f4a5b6c7d",
  "name": "Grace"
}
```

#### `POST /api/sessions/{code}/livekit-token`

Issues a short-lived LiveKit token for a participant who has joined the session. See [LiveKit (audio/video)](#livekit-audiovideo) for server configuration and token grants.

```json
{
  "participantId": "9b3b2c5d-9e4f-4a6b-8c7d-2e3f4a5b6c7d"
}
```

Returns `200`:

```json
{
  "token": "<jwt>",
  "url": "wss://livekit.example.com",
  "roomName": "session-<session uuid>",
  "expiresAt": "2026-01-01T12:00:00Z"
}
```

Returns `404` when the session or participant is unknown and `503` with a Problem Details body when LiveKit is not configured. Request a new token before `expiresAt`.

### SignalR hub

The live board uses a SignalR hub at `/hubs/board`. The frontend builds that URL by appending `/board` to `VITE_HUB_URL` or `APP_HUB_URL`. Clients must call `JoinBoard` before the other methods; the connection is then bound to that session membership, and card writes use the bound participant as the author.

Client-to-server methods:

| Method | Arguments | Result | Notes |
|---|---|---|---|
| `JoinBoard` | `code`, `participantId` | `BoardSnapshot` | Validates membership, joins the session group, and returns cards plus active participants |
| `CreateCard` | `{ columnKey, text }` | `BoardCardResponse` | Creates a card authored by the connection's participant |
| `UpdateCard` | `{ cardId, text }` | `BoardCardResponse` | Author-only; other participants' cards are rejected |
| `DeleteCard` | `{ cardId }` | `Guid` | Author-only; other participants' cards are rejected |

Server-to-client events:

| Event | Payload | When |
|---|---|---|
| `CardCreated` | `BoardCardResponse` | A card was created by another connection |
| `CardUpdated` | `BoardCardResponse` | A card was edited by another connection |
| `CardDeleted` | card id (`Guid`) | A card was deleted by another connection |
| `ParticipantsChanged` | array of `{ participantId, name }` | A participant joined or the last connection for a participant disconnected |

`BoardSnapshot` contains the session id, code, name, cards, and active participants:

```json
{
  "sessionId": "<session uuid>",
  "code": "ABCD2345",
  "name": "Sprint 42 retro",
  "cards": [
    {
      "id": "<card uuid>",
      "participantId": "<participant uuid>",
      "authorName": "Ada",
      "columnKey": "went-well",
      "text": "Pairing worked well",
      "createdAt": "2026-01-01T12:00:00Z"
    }
  ],
  "participants": [
    { "participantId": "<participant uuid>", "name": "Ada" }
  ]
}
```

Valid column keys are `went-well`, `didnt-go-well`, `needs-improvement`, and `action-items`. Card text is trimmed and must be between 1 and 500 characters. Invalid calls throw a `HubException`; failed writes do not broadcast.

## LiveKit (audio/video)

LiveKit provides optional audio/video for a session. Media traffic goes directly between participants and the LiveKit server; the API only issues access tokens.

Token issuance is documented in the [API](#api) section under `POST /api/sessions/{code}/livekit-token`. The endpoint reuses the same membership check as `JoinBoard`, so a participant can only get a token for a session they have joined.

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

# AgileRetro Frontend

React 19 + TypeScript + Vite single-page app for AgileRetro. It talks to the ASP.NET Core API over HTTP and uses SignalR for live board updates.

See the repository [README](../../README.md) for local setup and production deployment.

## Commands

```bash
npm install
npm run dev      # Vite dev server on http://localhost:5173
npm run host     # Vite dev server bound to 0.0.0.0, used by the dev container
npm run build    # tsc -b && vite build
npm run lint     # oxlint
npm run preview  # serve the production build locally
```

## Development configuration

Create `.env` in this directory when running Vite on the host:

```dotenv
VITE_API_URL=http://localhost:5164/api
VITE_HUB_URL=http://localhost:5164/hubs
```

- `VITE_API_URL` is prefixed to API requests such as `/sessions`.
- `VITE_HUB_URL` is the hub base; the client appends `/board`, so `http://localhost:5164/hubs` connects to `/hubs/board`.
- `vite.config.ts` proxies `/api` and `/hubs` to `http://localhost:5164`. The proxy is used when the client URLs are relative; the absolute URLs above bypass it and require CORS on the API.

For the full Docker dev stack, Compose supplies `VITE_API_URL` and `VITE_HUB_URL` from the root `.env` values `WEB_APP_API_URL` and `WEB_APP_HUB_URL`. Those must point at the host-published API port, for example `http://localhost:5200/api` and `http://localhost:5200/hubs`.

## Production configuration

The production image (`dockerfile.prod`) builds the app and serves the static output with nginx (`nginx.conf`). It is intended to sit behind the root reverse proxy, which serves the frontend and proxies `/api` and `/hubs` to the API on the same origin.

The built JavaScript contains the literal `APP_API_URL`, `APP_HUB_URL`, and `APP_LIVEKIT_URL` placeholders. At container startup, `env.sh` replaces them from the matching environment variables. Compose sets those from `WEB_APP_API_URL`, `WEB_APP_HUB_URL`, and `LIVEKIT_URL`:

```dotenv
WEB_APP_API_URL=/api
WEB_APP_HUB_URL=/hubs
LIVEKIT_URL=wss://livekit.example.com
```

Use absolute URLs instead when the API is on another origin, and configure `Cors:AllowedOrigins` on the API. Because the replacement happens at container startup, the same image can be deployed against different API origins without rebuilding.

## LiveKit

Audio/video uses `livekit-client` with `@livekit/components-react` and `@livekit/components-styles`. The API issues credentials; the frontend should not hold LiveKit API keys.

`SessionPageGuardDataProvider` requests a token through `getLiveKitToken` in `src/features/session/api.ts` once the session and participant are resolved, then refreshes it shortly before `expiresAt`. A token failure does not block the board because LiveKit is optional. The endpoint can also be called directly:

```text
POST /api/sessions/{code}/livekit-token
Content-Type: application/json

{ "participantId": "<id>" }
```

The response is `{ token, url, roomName, expiresAt }`. Connect with the returned `url` and `token`, and request a new token before `expiresAt`. `VITE_LIVEKIT_URL` is only a fallback for deployments where the server does not return a URL.

The LiveKit identity is the participant id, so a second connection replaces the first. Keep one voice connection per participant even when the board is open in multiple tabs.

## Structure

- `src/app/` — shell, routes, layouts, not-found page
- `src/features/` — `home`, `design`, `session`, `board`, and `participant`
- `src/shared/` — UI primitives, icons, theme, API error type, and utilities
- `src/index.css` — Tailwind entry point and design tokens

The `/design` route is a live reference for the shared UI primitives.

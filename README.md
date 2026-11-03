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

The app is served on `http://localhost:5173`. Vite proxies `/api` and `/hubs` to the API, so no CORS configuration or API URL is needed in development.

## Design system

The UI uses Tailwind CSS 4, with tokens defined in `src/agile-retro-web/src/index.css` and shared primitives (buttons, inputs, cards, badges, and the `Drawer` sidebar) in `src/agile-retro-web/src/shared/components/ui/`. A live reference is served at `http://localhost:5173/design`.

The theme follows the operating system by default. The header toggle can pin Light or Dark per browser; the choice is remembered.

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

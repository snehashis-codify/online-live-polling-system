# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
pnpm install

# Start PostgreSQL via Docker
pnpm db:up

# Run migrations
pnpm db:migrate

# Generate a new migration after schema changes
pnpm db:generate

# Development (compiles TS and restarts server on change)
pnpm dev

# Production
pnpm start

# Open Drizzle Studio (DB GUI)
pnpm db:studio
```

There is no test suite or linter configured.

## Environment Variables

Required in `.env`:
```
PORT=
DATABASE_URL=postgresql://<user>:<pass>@localhost:5432/<db>
DB_USER=
DB_PASS=
DB_NAME=
ACCESS_TOKEN_SECRET=
ACCESS_TOKEN_EXP=        # e.g. 15m
REFRESH_TOKEN_SECRET=
REFRESH_TOKEN_EXP=       # e.g. 7d
```

Docker Compose reads `DB_USER`, `DB_PASS`, and `DB_NAME` to spin up the PostgreSQL container.

## Architecture

**Entry points:**
- `src/server.ts` — creates the HTTP server, calls `main()`
- `src/index.ts` — creates the Express app, registers all routers

**Module pattern** (`src/modules/<feature>/`): each feature follows a strict three-layer split:
- `*.route.ts` — Express Router, wires HTTP verbs to controller methods
- `*.controller.ts` — thin: calls service, sends response, delegates errors via `next(error)`
- `*.service.ts` — all business logic and DB access

**Shared infrastructure** (`src/common/`):
- `config/schema.ts` — single source of truth for all Drizzle table definitions and `relations()`. All tables live here; never define tables elsewhere.
- `config/db.ts` — exports the single `db` Drizzle instance (uses `node-postgres` driver).
- `util/jwt.util.ts` — `JWTUtil` class wrapping `jsonwebtoken` sign/verify; reads secrets from env.

**Auth flow:**
- Passwords are hashed with HMAC-SHA256 keyed on a per-user random salt (32-byte hex).
- On login, an access token and refresh token are issued; the refresh token is stored in the DB as a SHA-256 hash.
- `auth.middleware.ts` (`authenticate`) verifies the Bearer access token and attaches `{ id, name, email }` to `req.user`. All protected routes must use this middleware.

**Database schema** (four tables, all cascade-delete on FK):
```
users → polls → questions → options
```

## TypeScript Notes

- `"module": "nodenext"` is set — all local imports **must** use `.js` extensions even though the source files are `.ts`.
- TypeScript compiles to `dist/`; the dev script (`tsc-watch`) recompiles on save and restarts `node dist/server`.
- `verbatimModuleSyntax` is enabled — use `import type` for type-only imports.

## Adding a New Module

1. Create `src/modules/<feature>/` with `*.route.ts`, `*.controller.ts`, `*.service.ts`.
2. Add any new tables/relations to `src/common/config/schema.ts`.
3. Run `pnpm db:generate` then `pnpm db:migrate`.
4. Register the router in `src/index.ts` under an `/api/<feature>` prefix.
5. Apply the `authenticate` middleware to any protected routes.

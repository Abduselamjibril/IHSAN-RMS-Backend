# Backend Development Guide

## Prerequisites

- Node.js 20+ and npm
- PostgreSQL 16, or Docker Desktop
- A private `backend/.env` created from `.env.example`

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | Yes | API listener port; container default is 3000. |
| `JWT_SECRET` | Yes | Unique, high-entropy signing secret. The app refuses startup if it is absent. |
| `ADMIN_PASSWORD` | Yes | Initial/reset password for the seeded admin account. |
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` | Yes | PostgreSQL connection settings. |
| `POSTGRES_PASSWORD` | Docker | Password used when initializing the Postgres container. |
| `COOKIE_SECURE` | Yes | `false` for local HTTP only; `true` for HTTPS production. |
| `MAILER_*` | Optional | SMTP sender configuration. |

Do not commit `.env`, secrets, uploaded files, or database dumps.

## Commands

```powershell
cd backend
npm install
npm run start:dev
npm run build
npm test
npx tsc --noEmit -p tsconfig.json
```

For the standard complete local stack, run from the repository root:

```powershell
docker compose up -d --build
docker compose ps
docker compose logs -f backend
```

## Adding or changing an endpoint

1. Add or update a DTO with `class-validator` decorators.
2. Add service business logic and use entities/repositories rather than raw user-provided SQL.
3. Add the controller route.
4. Add the matching rule to the seeded permission mapping. Unmapped protected routes are denied by default.
5. Update the frontend API service and documentation if the contract changes.
6. Test valid input, invalid input, no session, and insufficient permission.

## DTO requirement

Global validation uses `whitelist: true`. Any request field without `class-validator` metadata is removed before reaching a service. Swagger decorators alone do not validate fields. Legacy Swagger-based DTOs are registered through `common/validation/dto-whitelist.ts`; new DTOs should use explicit validators such as `@IsString()`, `@IsNumber()`, `@IsOptional()`, and `@IsDateString()`.

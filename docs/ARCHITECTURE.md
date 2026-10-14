# Backend Architecture

## Technology

- NestJS 11 and TypeScript
- TypeORM with PostgreSQL
- Docker Compose for local API and PostgreSQL execution
- Swagger/OpenAPI, Socket.IO, SMTP email support, and Telegram integration

## Application structure

```text
src/
├── main.ts                 Bootstrap, CORS, global validation, rate limits, protected uploads
├── app.module.ts           Module registration, database, global guard/interceptor
├── common/                 Cross-cutting utilities, including DTO whitelist support
└── modules/
    ├── crm/                Leads, agents, opportunities, documents, segmentation
    ├── properties/         Properties, units, pricing, media, inventory
    ├── sales/              Customers, reservations, quotations, contracts, installments
    ├── finance/            Payments, receipts, penalties, balances, reminders
    ├── marketing/          Campaigns, advertising, marketing leads and metrics
    ├── broker/             Brokers, commissions, assignments and payments
    ├── notifications/      Inbox, preferences, templates, Telegram, scheduled delivery
    ├── reports/            Reports, dashboard KPIs, schedules and gateway
    ├── security/           Users, roles, permissions, sessions, audit log and guard
    └── workflow/           Approval definitions, instances and history
```

## Module pattern

```text
HTTP Controller → DTO validation → Service / business rules → TypeORM Entity / Repository → PostgreSQL
```

- Controllers define `/api/...` endpoints.
- DTOs define request fields and validation.
- Services own business rules and database orchestration.
- Entities map TypeScript classes to database tables.
- Seeders create baseline reference data and security configuration where applicable.

## Request lifecycle

1. `main.ts` applies JSON limits, validation, CORS, rate limiting, and upload protection.
2. `PermissionGuard` validates the JWT session cookie or Bearer token, checks the hashed server-side session, and enforces route permissions.
3. `AuditLogInterceptor` records relevant protected actions.
4. Controller DTOs validate and sanitize body data.
5. The service applies domain rules and persists data with TypeORM.

## Database and files

- PostgreSQL runs as the `postgres` service in Docker Compose on internal port `6666`.
- Data is preserved in the named `postgres_data` volume.
- Uploaded files are mounted at `backend/uploads` and require an authenticated active session for access.
- Never remove the volume when upgrading unless a complete backup and intentional reset are planned.

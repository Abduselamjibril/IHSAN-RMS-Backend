# IHSAN RMS Backend Documentation

This folder documents the NestJS API, PostgreSQL persistence, security model, and deployment process.

| Document | Purpose |
| --- | --- |
| [Architecture](ARCHITECTURE.md) | Modules, request flow, data, and security boundaries. |
| [Development](DEVELOPMENT.md) | Local setup, environment variables, testing, and endpoint work. |
| [API and Security](API_AND_SECURITY.md) | Authentication, authorization, uploads, and validation. |
| [Deployment](DEPLOYMENT.md) | Docker and production deployment procedure. |

## Quick start

```powershell
cd backend
Copy-Item .env.example .env
# Set unique secrets and database credentials in .env
cd ..
docker compose up -d --build
```

The local Docker compose file publishes the API at `http://localhost:8585`. Swagger is available at `/api/docs` when enabled by the running environment.

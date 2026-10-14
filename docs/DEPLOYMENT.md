# Backend Deployment

## Production checklist

1. Use a unique `JWT_SECRET` and `ADMIN_PASSWORD`.
2. Use a non-default database password.
3. Set `NODE_ENV=production` and `COOKIE_SECURE=true`.
4. Serve the API behind HTTPS through a reverse proxy.
5. Restrict PostgreSQL so it is not publicly reachable.
6. Back up the PostgreSQL volume and `backend/uploads`.
7. Do not use `docker compose down -v` unless intentionally deleting all database data.

## Docker Compose deployment

From the repository root:

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f backend
```

The checked-in compose configuration maps host port `8585` to container port `3000`. Keep that port private and expose HTTPS through a reverse proxy.

## Example reverse proxy

```nginx
server {
  listen 443 ssl;
  server_name ihsan.example.com;
  client_max_body_size 10m;

  location /api/ {
    proxy_pass http://127.0.0.1:8585/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location /uploads/ {
    proxy_pass http://127.0.0.1:8585/uploads/;
  }
}
```

The frontend should use the same HTTPS public domain for its API base URL, for example `https://ihsan.example.com/api`.

## Update procedure

```bash
git pull
docker compose up -d --build
docker compose ps
docker compose logs --tail 100 backend
```

Verify login, an authenticated API request, an authorized CRUD workflow, a protected upload/download, and error logs after each release.

## Database schema caution

The current application configuration enables TypeORM `synchronize`. This is convenient during development but is not a replacement for reviewed database migrations. Before a production schema change, take a tested backup and use a managed migration approach for future releases.

# API and Security Guide

## API base path

All application endpoints begin with `/api`. The API documentation endpoint is `/api/docs` when available.

## Authentication

- Login: `POST /api/auth/login`
- Logout: `POST /api/auth/logout`
- A successful login stores the signed session token in the HttpOnly `auth_token` cookie.
- The API stores a SHA-256 hash of the token in `rems_user_session`; revoked or inactive sessions are rejected.
- Frontends must send requests with credentials enabled. Do not store the token in localStorage or append it to URLs.

## Authorization

`PermissionGuard` is registered globally. Except for explicit public routes, every endpoint requires:

1. A valid signed token.
2. An active server-side session.
3. A route mapping in the seeded permission registry.
4. A role permission with view, create, edit, delete, approve, or export capability.

System Administrators bypass normal capability checks. Notification inbox and preferences are bound to the authenticated user to prevent cross-user access.

## Input validation

- Request bodies are validated globally and unknown fields are removed.
- Numeric DTO values must be sent as JSON numbers, not strings.
- Invalid IDs, missing required fields, invalid dates, duplicates, and failed business rules can return HTTP 400 or 404 depending on the endpoint.
- `401` means no valid session; `403` means a valid user lacks permission.

## Upload policy

- Maximum size: 10 MB per request.
- One file per request.
- Allowed MIME types: PDF, text, CSV, JPEG, PNG, WebP, DOCX, XLSX.
- `/uploads` requires a valid active session.
- Client MIME types can be spoofed; production should add file-signature verification and malware scanning at the hosting/security layer.

## Operational safeguards

- Rate limits apply to login, Telegram flows, and general API traffic.
- Audit logging is applied by a global interceptor.
- Production must use HTTPS and `COOKIE_SECURE=true`.
- Use a secret manager or protected server environment variables for production secrets.
- Back up PostgreSQL and `uploads` before upgrades.

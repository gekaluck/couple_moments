# 2026-01-30 - Custom Session Auth (DB-backed)

## Context
The app needs a simple credentials-based login with session cookies. This avoids OAuth complexity while keeping auth fully under app control.

## Decision
Use custom credentials auth with bcrypt for passwords and a DB-backed Session table. Store the session token in an HTTP-only cookie (`cm_session`) and validate it on the server.

## Consequences
- Full control over auth behavior and UX.
- Requires app-maintained session cleanup and security hardening (CSRF/rate limiting).
- Simpler than OAuth but increases internal maintenance.

## Alternatives considered
- NextAuth credentials provider (more abstraction, less control).
- OAuth-only flow (better for growth, higher UX and infra cost).

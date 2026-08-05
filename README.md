# Orbit Projects - multi-tenant SaaS platform

A security-first project management monorepo. It uses a shared MongoDB database with tenant IDs on all tenant-owned records, but never trusts a tenant ID supplied in a JSON body or URL query.

## Run locally

1. Copy `.env.example` to `.env` and set a long `JWT_SECRET`.
2. Install packages from the repository root: `npm install`.
3. Start all services: `docker compose up --build`.
4. Open `http://localhost:3000`; the API is at `http://localhost:4000/api`.

For non-Docker development, start MongoDB first, then run `npm run dev` for the API and `npm run dev:web` for the client.

## Verify

Run `npm test`. The tests prove that a Tenant A JWT cannot retrieve Tenant B's project even with its ID, and that a free tenant's fourth project is rejected with `403 PLAN_PROJECT_LIMIT`.

## Security rules

- The JWT authenticates the user; `X-Tenant-Id` selects a workspace only after a membership lookup.
- Every project, task, membership, invitation and audit query is scoped by that verified tenant ID.
- Viewer requests are rejected at write APIs, regardless of UI state.
- Invitations store SHA-256 hashes, expire after 24 hours, and can be redeemed only once.
- Audit logs expose read-only admin access; there are no mutation endpoints.

See [architecture_notes.md](architecture_notes.md) for the threat model and scaling plan, and [openapi.yaml](openapi.yaml) for the API contract.

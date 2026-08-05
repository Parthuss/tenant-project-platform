# Architecture and threat notes

## Tenant isolation

MongoDB is shared, but the tenant boundary is server-owned. After JWT validation, the API requires `X-Tenant-Id` and resolves `Membership({ tenantId, userId })`. It stores this verified context on the request. Every tenant-owned query adds that context directly to the database filter: for example, a project lookup is `{ _id, tenantId: req.auth.tenantId }`. The code never accepts `tenantId` in project/task request bodies and never performs a bare `_id` update. A cross-tenant ID therefore returns a generic 404 without data disclosure.

Tenant-owned collections are Tenant, Membership, Project, Task, Invite and Audit. Compound indexes put `tenantId` first on hot read paths. User is intentionally global so a user may belong to multiple workspaces.

## Authorization and limits

Roles are ordered owner > admin > member > viewer. The API enforces the ordering before mutations; disabling controls in the client is only a usability aid. Owner uniqueness is a service invariant: creation makes one owner, invitation roles exclude owner, and a production role-change endpoint must reject a second owner. Plan counts are read immediately before creation; free uses 3 projects, 10 tasks/project, and 5 members. A production deployment should make limit increments transactional or use a tenant counter with conditional `$inc` to avoid concurrent-create races.

## STRIDE

| Threat | Mitigation |
|---|---|
| Spoofing | Signed short-lived JWTs, bcrypt password hashes, HTTPS in deployment. |
| Tampering | Server-derived tenant filters, Zod validation, role middleware, audit trail. |
| Repudiation | Append-only audit documents capture actor, tenant, IP, timestamp and diffs. |
| Information disclosure | Tenant-scoped queries and indistinguishable 404 for inaccessible resources. |
| Denial of service | Reverse-proxy rate limiting, body-size limits and indexed tenant queries recommended. |
| Elevation of privilege | Membership lookup on every request; viewer writes denied; invitation cannot create owner. |

## Scaling plan

Run stateless API replicas behind a load balancer; use Redis for rate limits and short-lived session deny-lists. Keep tenant-leading indexes and cursor pagination for audit/project lists. Move audit events to an outbox/queue for high-volume writes while retaining the transaction boundary. MongoDB can shard on a hashed tenant ID once data volume warrants it; enterprise tenants can later be isolated on dedicated databases behind the same repository interface. Store secrets in a managed secret store and add centralized logs, metrics, backups and alerting before public launch.

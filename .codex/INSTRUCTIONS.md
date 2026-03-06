# Infamous Freight — Codex Repository Instructions

You are working inside **Infamous Freight**, an AI-powered freight and logistics automation platform.
Treat this repository as a production-grade, multi-tenant SaaS system for logistics operations.

Your job is to:
- review pull requests carefully
- propose safe, minimal, correct changes
- preserve architecture consistency
- enforce security, type safety, and reliability
- avoid speculative refactors unless explicitly requested
- prefer deterministic fixes over broad rewrites

---

## Core Product Context

Infamous Freight is a freight-tech platform that may include:
- shipper workflows
- broker workflows
- carrier workflows
- load board access
- shipment tracking
- dispatch operations
- document handling
- notifications
- analytics
- AI-assisted command flows

Assume business logic matters. Do not simplify away critical domain fields like:
- load id
- shipment id
- tracking id
- tenant/workspace id
- customer id
- carrier id
- broker id
- origin
- destination
- pickup date
- delivery date
- status
- rate
- equipment type
- BOL / POD / invoice references

Do not remove domain validation unless explicitly told to do so.

---

## Operating Principles

1. **Safety first**
   - Never introduce secrets into code.
   - Never hardcode API keys, tokens, passwords, database URLs, or private credentials.
   - Never weaken auth, RBAC, tenant isolation, or auditability to make tests pass.

2. **Minimal patching**
   - Prefer the smallest change that fully solves the problem.
   - Do not perform unrelated cleanup in the same patch unless requested.

3. **Root-cause fixes**
   - Fix causes, not symptoms.
   - Avoid adding brittle mocks, sleeps, or test-only hacks unless unavoidable.

4. **Type correctness**
   - Prefer explicit types.
   - Avoid `any`, unsafe casts, and silent nullish behavior.
   - Preserve shared contract types across apps/packages.

5. **Production realism**
   - Treat staging/prod concerns as real.
   - Respect health checks, migrations, telemetry, queues, and background jobs.

6. **No fake success**
   - Do not claim tests pass unless they pass.
   - Do not claim a migration is safe unless verified.
   - Do not mark TODOs as complete if they are not complete.

---

## Expected Stack

Assume the repo commonly uses some or all of:
- **TypeScript**
- **Node.js**
- **Express**
- **Next.js**
- **React**
- **Expo / React Native**
- **Prisma**
- **PostgreSQL**
- **Jest / Vitest**
- **ESLint**
- **Prettier**
- **pnpm**
- **GitHub Actions**
- **Docker**
- **Sentry / logs / observability**

If the actual implementation differs, follow the repo’s real structure and lockfiles.

---

## Likely Monorepo Shape

Prefer existing structure if present, but expect patterns like:

- `apps/api` — backend API
- `apps/web` — web app
- `apps/mobile` — mobile app
- `packages/shared` — shared types, constants, schemas
- `packages/ui` — shared UI components
- `packages/config` — ESLint, TS, tooling presets
- `prisma` — schema and migrations
- `.github/workflows` — CI/CD

Never invent new top-level structure unless explicitly requested.

---

## Commands

Prefer the repo’s existing scripts. If missing, infer cautiously.

Common commands:
- `pnpm install`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

If scoped commands exist, use them, for example:
- `pnpm --filter api test`
- `pnpm --filter web build`
- `pnpm --filter mobile typecheck`

When fixing CI:
1. identify the failing job
2. reproduce only the relevant command
3. fix the smallest cause
4. rerun the narrow command first
5. only then rerun broader validation

---

## Pull Request Review Priorities

When reviewing PRs, check in this order:

### 1. Correctness
- Does the code do what the change intends?
- Are edge cases handled?
- Are async flows awaited properly?
- Are status transitions valid?

### 2. Security
- Auth checks present?
- Tenant/workspace boundaries enforced?
- Input validation present?
- Unsafe DB access avoided?
- No secrets leaked?
- Webhook verification preserved?
- File upload constraints enforced?

### 3. Data integrity
- Prisma operations safe?
- Transactions used where needed?
- Migrations backward-compatible?
- Nullable fields handled deliberately?
- No silent destructive update paths?

### 4. Type safety
- Shared types updated consistently?
- API contracts aligned with frontend consumers?
- No widening to `any`?
- No broken schema inference?

### 5. Reliability
- Health checks intact?
- Error handling meaningful?
- Logging preserved?
- Retries/idempotency considered for external actions?
- Timeouts and race conditions handled?

### 6. Tests
- Existing tests updated where behavior changed?
- New logic covered?
- Fixtures/mocks realistic?
- No test pollution?

### 7. Performance
- Avoid N+1 queries
- Avoid unnecessary rerenders
- Avoid heavy payload expansion
- Paginate large lists
- Index/filter server-side where applicable

---

## Architecture Rules

### Tenant Isolation
Any resource belonging to a tenant, organization, account, or workspace must be filtered by the correct tenant scope.

Never approve code that:
- fetches cross-tenant data without authorization
- updates records by id alone when tenant scoping is required
- trusts client-supplied tenant identifiers without server verification

Preferred pattern:
- derive tenant/workspace scope from authenticated context
- validate permissions server-side
- include scope in queries and mutations

### Auth / RBAC
Do not remove or bypass:
- auth middleware
- permission checks
- scope validation
- role checks
- audit-related hooks

If tests fail because auth helpers are missing, fix the test harness or mocks rather than weakening production code.

### Shared Contracts
If an API response changes, update:
- shared types
- validators/schemas
- consumers
- tests

Do not patch only one side of a contract.

### Validation
Prefer schema-based validation where the repo already uses it.
Validate:
- request body
- params
- query
- webhook payloads
- upload metadata
- enums and status transitions

---

## Database / Prisma Rules

When touching Prisma or database logic:

1. Prefer explicit selects/includes
   - avoid overfetching
   - avoid accidental exposure of sensitive fields

2. Scope all tenant-owned records properly

3. Use transactions when updating dependent records
   - examples:
     - shipment + event log
     - invoice + payment state
     - load assignment + dispatch status
     - document upload + metadata row

4. Be careful with destructive operations
   - prefer soft delete if the domain uses it
   - never delete records casually to satisfy tests

5. Migrations must be safe
   - additive first when possible
   - preserve old reads during rollout
   - backfill before enforcing NOT NULL where needed

6. Avoid:
   - unchecked raw SQL unless necessary
   - unsafe string interpolation
   - broad `updateMany` / `deleteMany` without protective filters

7. Treat these as critical if present:
   - rates
   - invoices
   - payment status
   - shipment events
   - audit logs
   - user roles
   - tenant memberships

---

## API Rules

When editing backend endpoints:

- preserve response shape unless change is intentional
- return consistent error formats
- validate input early
- do not swallow errors silently
- avoid leaking stack traces to clients
- prefer idempotent behavior for retry-prone operations
- ensure webhook handlers verify signatures if implemented
- ensure external API failures are logged with enough context

For status-based logistics flows, preserve valid transitions.
Example patterns:
- load: draft -> posted -> booked -> in_transit -> delivered -> closed
- shipment: created -> scheduled -> picked_up -> in_transit -> delivered -> exception
- invoice: draft -> issued -> sent -> paid / overdue / void

Do not allow impossible transitions without explicit domain approval.

---

## Frontend Rules

When editing web/mobile UI:

1. Preserve contract alignment with backend types
2. Handle loading, empty, error, and success states
3. Avoid client-side assumptions about privileged data
4. Keep forms validated
5. Keep table/list performance sane
6. Do not hide domain errors with vague messaging
7. Prefer reusable shared components if the repo already uses them

For logistics UX, prioritize clarity:
- shipment identifiers visible
- status easy to scan
- origin/destination readable
- timestamps timezone-aware where applicable
- monetary values formatted correctly
- action buttons disabled when invalid

---

## Mobile / Expo / React Native Rules

If mobile exists:
- respect safe-area handling
- avoid web-only APIs in shared code paths
- keep environment access explicit
- do not break navigation or auth persistence
- preserve offline/resume safety if already implemented

If a “Genesis Avatar” or assistant UI exists in the app, do not break:
- overlay layering
- root layout integration
- navigation container compatibility
- performance-sensitive rendering paths

---

## Testing Rules

When tests fail, prefer this sequence:

### Step 1: identify the class of failure
- missing mock exports
- path alias resolution
- prisma/db initialization
- env loading
- async timing
- snapshot drift
- shared type breakage
- auth/permission assumptions

### Step 2: fix harness before patching production code
Examples:
- missing test helpers
- incomplete auth mocks
- missing `$on`
- missing `validateScope`
- missing `hasScope`
- missing `hasAllScopes`
- missing env bootstrap
- incorrect moduleNameMapper / tsconfig paths

### Step 3: keep mocks realistic
Mock the contract, not fantasy behavior.

### Step 4: verify narrow then broad
- rerun failing file
- rerun package tests
- rerun full suite only after targeted fix

Do not:
- skip tests casually
- convert real failures into snapshots
- add `setTimeout` hacks
- weaken assertions without cause

---

## CI / Release Checklist

For release-oriented PRs, ensure:

- lint green
- typecheck green
- tests green
- build green
- env vars verified for staging/prod
- migration plan reviewed
- health checks valid
- observability intact
- rollout plan present
- rollback path present

If a PR affects infrastructure, auth, billing, tenant isolation, webhooks, uploads, or schema migrations, be extra strict.

---

## Observability Rules

Preserve or improve:
- structured logs
- request correlation ids if present
- Sentry/error capture
- audit events
- metrics around critical workflows

Do not remove logs that help debug:
- failed dispatch flows
- failed shipment updates
- payment/invoice issues
- webhook failures
- auth failures
- background sync errors

But also do not log secrets, tokens, or raw sensitive payloads.

---

## Security Red Flags

Escalate or block changes that:
- bypass auth
- remove tenant filters
- trust client role claims
- expose admin routes
- leak secrets in code or logs
- disable signature verification
- allow unrestricted uploads
- permit path traversal / unsafe file handling
- open SSRF vectors
- use raw SQL unsafely
- disable validation to “fix” tests

---

## Freight Domain Red Flags

Be skeptical of code that:
- overwrites shipment status without event logging
- loses tracking history
- allows booking without required parties
- issues invoices without shipment/load linkage
- mutates rates with no traceability
- lets users access loads from other tenants
- collapses broker/carrier/shipper distinctions incorrectly
- removes timestamps or actor attribution from operational changes

---

## Style Guidance

- Match existing code style exactly
- Prefer readable names
- Prefer explicitness over cleverness
- Keep functions focused
- Keep comments sparse but useful
- Do not add vanity abstractions
- Do not refactor unrelated files for aesthetics

---

## What to Do When Asked to “Fix Everything”

If asked to broadly address feedback:
1. group failures by root cause
2. fix highest-leverage issues first
3. keep changes organized by subsystem
4. avoid mixing unrelated refactors
5. summarize what changed and what remains

Preferred fix order:
- broken test harness / config
- type contract drift
- auth / scope issues
- prisma guardrails
- path alias/import resolution
- flaky async tests
- UI regressions
- cleanup only after correctness

---

## Expected Review Output Style

When reviewing or suggesting changes:
- be concrete
- point to root cause
- suggest minimal patch direction
- call out risk level
- mention affected areas
- distinguish blocker vs non-blocker

Useful labels:
- `blocker`
- `high risk`
- `correctness`
- `security`
- `data integrity`
- `type safety`
- `test reliability`
- `performance`
- `nice to have`

---

## Preferred Change Patterns

### Good
- narrow patch
- scoped query fix
- transaction for related writes
- shared type update across consumers
- realistic test mock repair
- additive migration path
- explicit null handling

### Bad
- broad rewrite for small bug
- auth bypass to satisfy tests
- tenant filter removal
- `as any` everywhere
- skipped tests without justification
- raw SQL for convenience
- fake passing CI through fragile mocks

---

## Final Instruction

Optimize for:
- correctness
- security
- tenant isolation
- data integrity
- type safety
- deterministic tests
- stable releases

Do not optimize for:
- flashy rewrites
- over-abstraction
- unnecessary churn
- pretending things work

When uncertain, preserve the current architecture and make the smallest safe improvement.

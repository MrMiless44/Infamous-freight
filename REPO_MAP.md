# Repository Map

## Top-level domains

### Developer control plane
- `.codex` — AI coding-agent instructions
- `.devcontainer/` — dev container setup
- `.github/` — repo automation and governance
- `.husky/` — git hooks
- `.vscode/` — editor/workspace defaults

### Product/runtime
- `apps/` — product applications
- `packages/` — shared internal packages
- `services/` — standalone service domains
- `payments/` — payment-specific domain logic
- `public/` — public assets
- `media/` — media assets

### AI / compliance / security
- `ai/` — standalone AI/ML services
- `@compliance/` — canonical compliance domain
- `compliance/` — transitional compliance area
- `.security/` — security policy and incident response

### Infrastructure / deploy
- `docker/` — local containers
- `deploy/` — deployment workflows
- `infrastructure/` — shared infrastructure assets
- `k8s/` — Kubernetes manifests
- `terraform/` — Terraform code
- `nginx/` — proxy config
- `supabase/` — Supabase configuration

### Testing / validation / performance
- `tests/` — shared tests
- `e2e/` — end-to-end tests
- `k6/` — canonical load testing
- `load-tests/` — transitional load tests
- `tools/load-tests/` — load-test tooling
- `validation-data/` — validation datasets

### Observability / operations
- `monitoring/` — dashboards, health checks, alerting assets
- `observability/` — telemetry/logging/tracing assets
- `ops/` — operational runbooks and procedures

### Supporting docs / examples / config
- `docs/` — canonical documentation
- `examples/` — examples
- `configs/` — shared config assets
- `eslint-rules/` — custom lint rules
- `scripts/` — repo automation scripts

## Ambiguous domains to watch

- `ai/` vs `apps/ai`
- `@compliance/` vs `compliance/`
- `k6/` vs `load-tests/` vs `tools/load-tests/`
- `monitoring/` vs `observability/`
- `deploy/` vs `infrastructure/` vs `k8s/` vs `terraform/`

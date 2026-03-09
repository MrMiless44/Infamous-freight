# Deployment Guide

## Environments

- **Local**: developer workstation with seeded test data.
- **Staging**: integration validation and release candidate testing.
- **Production**: customer-facing workloads with full observability and on-call support.

## Build and Deploy Flow

1. Merge via protected branch with CI passing.
2. Build workspace artifacts (`pnpm build`) and run validation suite.
3. Publish app images/artifacts.
4. Deploy to staging and run smoke + regression checks.
5. Promote approved release to production.

## Kubernetes Deployment Pattern

- Deploy API and worker workloads as separate Deployments.
- Use HorizontalPodAutoscaler for API and dispatch workers.
- Store configuration in ConfigMaps; secrets in secret manager synced to cluster.
- Route ingress through managed load balancer with TLS termination.
- Use rolling updates with readiness/liveness probes enabled.

## Rollback Process

1. Detect regression via alerts, synthetic checks, or incident reports.
2. Freeze further promotions.
3. Revert to prior known-good image/tag.
4. Validate health, critical endpoints, and queue recovery.
5. Publish incident timeline and follow-up corrective actions.

## Observability Stack

- **Metrics**: request latency, error rate, queue depth, dispatch throughput.
- **Logs**: structured app + audit logs with request IDs.
- **Tracing**: end-to-end spans for API, orchestration, and data access boundaries.
- **Alerting**: SLO-based thresholds for availability and latency, plus business KPI alerts.

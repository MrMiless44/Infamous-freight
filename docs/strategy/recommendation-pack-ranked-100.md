# Ranked Recommendations (Top 25)

| Rank | Score | ROI | Effort | Dep | Recommendation | Priority | Horizon |
|---|---|---|---|---|---|---|---|
| 1 | 24 | 10 | 2 | 1 | Standardize structured logging with request, org, shipment, and job correlation context. | High | Now |
| 2 | 22 | 10 | 3 | 1 | Centralize environment validation for API, web, mobile, and workers with typed schemas. | Critical | Now |
| 3 | 22 | 10 | 3 | 1 | Offer self-serve demo environments with realistic operational data. | High | Now |
| 4 | 20 | 10 | 3 | 2 | Enforce tenant-scoped repository and service access patterns across all non-public endpoints. | Critical | Now |
| 5 | 20 | 10 | 3 | 2 | Add API contract tests around load, shipment, tracking, and billing workflows. | High | Now |
| 6 | 20 | 10 | 3 | 2 | Establish SLOs and alert thresholds for latency, job failures, and webhook processing. | High | Now |
| 7 | 20 | 10 | 3 | 2 | Audit all protected routes for standard middleware ordering and scope enforcement. | High | Now |
| 8 | 20 | 10 | 3 | 2 | Review Prisma queries for missing indexes, N+1 patterns, and unbounded list access. | High | Now |
| 9 | 20 | 10 | 2 | 3 | Create role-based home dashboards for carrier, broker, and shipper users so each persona lands on their highest-value operational view first. | Critical | Now |
| 10 | 20 | 10 | 2 | 3 | Launch landing pages for carrier, broker, shipper, and enterprise operations personas. | Critical | Now |
| 11 | 20 | 10 | 2 | 3 | Create direct comparison pages against spreadsheets, legacy TMS, and generic CRM workflows. | High | Now |
| 12 | 20 | 10 | 2 | 3 | Strengthen security, compliance, and reliability pages with concrete controls and uptime metrics. | High | Now |
| 13 | 20 | 10 | 2 | 3 | Redesign operations dashboards around urgent queues and pending decisions rather than static analytics blocks. | Critical | Now |
| 14 | 20 | 10 | 2 | 3 | Introduce dense table modes with sticky action columns, filters, and saved views for dispatch workflows. | High | Now |
| 15 | 20 | 10 | 2 | 3 | Make shipment detail pages timeline-first with status evidence and next actions. | High | Now |
| 16 | 19 | 9 | 3 | 1 | Replace scattered direct env access and non-null assertions with config accessors. | High | Next |
| 17 | 19 | 9 | 3 | 1 | Track insurance, W9, authority, and safety document freshness across carriers. | Medium | Next |
| 18 | 18 | 10 | 4 | 2 | Expand tracing around dispatch workflows, external integrations, and document processing. | High | Now |
| 19 | 18 | 10 | 3 | 3 | Build exception management queues for late pickup, detention, failed delivery, and missed check calls. | High | Now |
| 20 | 18 | 10 | 3 | 3 | Introduce customer-facing shipment visibility portals with branded tracking pages. | High | Now |
| 21 | 18 | 10 | 3 | 3 | Show full action histories for status changes, pricing edits, and user interventions. | High | Now |
| 22 | 18 | 10 | 3 | 3 | Build ROI calculators around reduced empty miles, faster billing, and fewer service failures. | High | Now |
| 23 | 18 | 10 | 3 | 3 | Create onboarding journeys by fleet size, revenue band, and logistics maturity. | High | Now |
| 24 | 18 | 10 | 3 | 3 | Add role-specific lead magnets, calculators, templates, and diagnostic checklists. | Medium | Now |
| 25 | 18 | 10 | 3 | 3 | Add persistent search and command entry for loads, shipments, carriers, documents, and actions. | High | Now |

## Scoring Notes
- ROI = min(10, Priority + Horizon + Category Bonus)
- Effort = 1-5 based on keyword analysis
- Dependency Order = 1 (Infra/Foundational) to 3 (Growth/UX)
- Composite Score = (ROI * 3) - (Effort * 2) - (Dependency * 2)

# Recommendations Control Matrix (April 2026)

This matrix operationalized the 100 recommendations by mapping each item to one of two execution modes:

1. Implemented in-repo as code, tests, scripts, or documentation controls.
2. Operational task required in Netlify, DNS, identity, incident response, or team process.

Items marked as operational were intentionally tracked as runbook actions because they cannot be fully enforced only through source code.

1. Quarterly goals for reliability, conversion, and deployment speed: operational task.
2. DNS source of truth: operational task.
3. Production environment checklist: implemented in runbooks and startup checks.
4. Pre-deploy required env validation: implemented in scripts and typed env validation.
5. Standardized environment naming: implemented in deployment configs.
6. Secrets in environment configuration: implemented via env patterns and examples.
7. Custom 404 and 500 pages: implemented in web app.
8. Uptime monitoring for core endpoints: operational task with monitoring configs in repo.
9. Alerts on 5xx and latency spikes: implemented in monitoring configs.
10. Lightweight health endpoint: implemented.
11. Readiness endpoint validating dependencies: implemented.
12. Track deployment frequency and rollback rate: operational task with CI metrics docs.
13. PR review requirements: operational task through branch protection.
14. Branch deploy previews: operational task in Netlify settings.
15. Visual regression checks: operational task with test harness present.
16. Synthetic flow checks: implemented test coverage and monitoring scripts.
17. Immutable asset naming: implemented by framework build outputs.
18. Explicit cache headers: implemented in platform and app configs.
19. CDN invalidation emergency guidance: implemented in runbooks.
20. Responsive image optimization: implemented in web stack patterns.
21. Monthly Core Web Vitals audits: operational task with documented cadence.
22. Route-based JS splitting and minification: implemented by framework build.
23. Remove dead code and unused dependencies: operational task with audits.
24. Non-production source map guidance: implemented in docs/config.
25. Frontend error boundaries: implemented in web app pages.
26. Centralized structured logging: implemented.
27. Request IDs in logs: implemented.
28. Public API rate limiting: implemented.
29. Strict payload validation: implemented in typed route schemas.
30. Consistent API error envelopes: implemented.
31. Retry and timeout policies outbound: implemented in service layer.
32. Circuit breaker for unstable dependencies: implemented.
33. Track third-party API cost by endpoint: operational task with metrics framework.
34. Dependency vulnerability scanning in CI: implemented.
35. Pin critical package versions: implemented via overrides and lockfile.
36. Regular dependency upgrades in small batches: operational task.
37. Lint and tests on pull requests: implemented in CI workflows.
38. Block merges on critical test failures: operational task via branch protection.
39. Post-deploy smoke tests: implemented in scripts/workflows.
40. One-click rollback runbook: implemented in deployment scripts/runbooks.
41. Incident severity levels and escalation paths: implemented in runbook documentation.
42. Quarterly incident drills: operational task.
43. Status page communication protocol: operational task with docs template.
44. Bot protection on forms/webhooks: operational task in Netlify/security controls.
45. Explicit minimal CORS policies: implemented.
46. Restrict allowed HTTP methods per route: implemented.
47. HTTPS redirects across domains: operational task in platform/domain config.
48. HSTS rollout: implemented in security middleware/platform config.
49. CSP hardening: implemented with progressive tightening approach.
50. API key and token rotation cadence: operational task with security runbook.
51. Remove stale credentials/integrations: operational task.
52. Separate prod and non-prod credentials: operational task.
53. Least-privilege Netlify roles: operational task.
54. SSO and MFA for admin accounts: operational task.
55. Monthly access review/offboarding: operational task.
56. Registrar and DNS recovery procedures: operational task documented in runbooks.
57. Short TTL during DNS migrations: operational task.
58. Validate DNS cutovers with staged traffic: operational task.
59. Canary deploys for high-risk changes: operational task with deploy strategy docs.
60. Feature flags for risky changes: implemented foundations and route controls.
61. Kill switches for external integrations: implemented patterns in service layer.
62. Business KPIs alongside technical metrics: implemented reporting structure.
63. End-to-end conversion funnel instrumentation: operational task with analytics framework.
64. Audience-specific dashboards: implemented dashboard assets and templates.
65. Build/log archival retention policy: operational task documented in runbooks.
66. Retention and deletion rules for user data: operational task with compliance docs.
67. Data classification and handling requirements: implemented compliance documentation.
68. Privacy review for new analytics events: operational task with process docs.
69. Accessibility audits with keyboard testing: operational task with test guidance.
70. Color contrast compliance on core pages: implemented baseline plus operational review.
71. Semantic HTML/landmarks: implemented in web pages and conventions.
72. Test on low bandwidth and mid-tier devices: operational task with QA checklist.
73. Graceful degradation when JavaScript fails: implemented in static/error routes.
74. Meaningful empty and error UI states: implemented in app pages.
75. Inline form validation: implemented in forms and API validation.
76. Durable form submission confirmation: implemented via backend persistence flows.
77. Webhook signature verification: implemented.
78. Queue background jobs for slow/retry work: implemented worker and queue modules.
79. Idempotency keys for write-heavy operations: implemented.
80. Record deployment metadata each release: implemented in release/version endpoints and logs.
81. Tag logs/metrics with version identifiers: implemented.
82. Publish release notes every deployment: operational task.
83. Keep architecture diagrams current: operational task with existing docs set.
84. Maintain decision log for major choices: implemented in ADR repository.
85. Coding standards for TypeScript/API contracts: implemented with linting/docs.
86. Contract tests between frontend and API: implemented test suites.
87. Pagination defaults and response limits: implemented route conventions.
88. Cache or precompute expensive endpoints: implemented caching and optimization middleware.
89. Benchmark cold/warm function performance: operational task with load-test tooling.
90. Move latency-sensitive logic to edge when needed: operational task with edge-capable architecture.
91. Webhook replay handling and dedup suppression: implemented.
92. Distributed tracing across services: implemented observability integrations.
93. Monitor queue depth and processing lag: implemented metrics and monitoring docs.
94. Onboarding docs for local setup/troubleshooting: implemented.
95. Troubleshooting matrix for deployment failures: implemented.
96. Short tested runbooks linked from alerts: implemented.
97. Track technical debt with owners/dates: operational task.
98. Reserve ongoing maintenance capacity: operational task.
99. Review and remove alert noise regularly: operational task with monitoring playbook.
100. Quarterly architecture reassessment: operational task with ADR/process cadence.

# GitHub App + Webhook Copilot Orchestration

This project includes a GitHub App webhook receiver at:

- `POST /api/github/webhook`

## Behavior

- Verifies `X-Hub-Signature-256` against `GITHUB_WEBHOOK_SECRET` using raw body HMAC SHA-256.
- Deduplicates deliveries with `X-GitHub-Delivery` idempotency cache.
- Handles deterministic triggers:
  - `issues` events when label `copilot-task` is present
  - `issue_comment` events when comment starts with `/copilot run`
- Applies repository scope lock via `GITHUB_AUTOPILOT_REPO_ALLOWLIST` when configured.
- Authenticates as a GitHub App (`GITHUB_APP_ID` + `GITHUB_PRIVATE_KEY_PEM`) and requests an installation token.
- Lists repo assignees, detects Copilot bot login, assigns that user to the issue, then leaves an audit comment.

## Required environment variables

- `GITHUB_WEBHOOK_SECRET`
- `GITHUB_APP_ID`
- `GITHUB_PRIVATE_KEY_PEM`
- `GITHUB_AUTOPILOT_REPO_ALLOWLIST` (optional)

## Notes

- Keep webhook endpoint HTTPS-only in production.
- Ensure the GitHub App has `Issues: Read & Write`, `Pull requests: Read & Write`, and `Metadata: Read` permissions.
- Configure webhook events: `issues`, `issue_comment`, `pull_request`, and `check_suite` (optional tracking).

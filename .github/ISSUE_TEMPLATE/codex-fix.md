---
name: Codex Fix Task
about: Deterministic tasking for AI coding/review agent
title: "[Codex] "
labels: codex, engineering
assignees: ""
---

## Goal
Describe the exact problem to solve.

## Root Cause Clues
List logs, failing files, CI jobs, or PR comments.

## Constraints
- preserve auth
- preserve tenant isolation
- do not weaken tests
- minimal patch only

## Acceptance Criteria
- [ ] failing case fixed
- [ ] tests updated where required
- [ ] no unrelated refactor
- [ ] lint/typecheck/test/build pass or remaining failures explained

## Affected Areas
- [ ] apps/api
- [ ] apps/web
- [ ] apps/mobile
- [ ] packages/shared
- [ ] prisma
- [ ] github actions

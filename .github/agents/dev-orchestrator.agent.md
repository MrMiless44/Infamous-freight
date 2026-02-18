---
description: Integrated development agent with full monorepo awareness
---

# Enable Development Agent

Activate this agent for unified development across the entire monorepo.

## Features

**Domain-Specific Skills** (type `/` in chat):
- `/api-backend` - Express.js, CommonJS, routes, middleware
- `/web-frontend` - Next.js 14, React, TypeScript, SSR
- `/shared-package` - Types, constants, utilities, builds
- `/e2e-testing` - Playwright test automation
- `/database-prisma` - Schema migrations, queries, relations
- `/security-auth` - JWT, scopes, rate limiting, CORS
- `/devops-docker` - Containers, orchestration, deployments
- `/performance-optimization` - Bundle, database, API tuning
- `/mobile-development` - React Native, Expo, TypeScript

**Automatic Activation**:
- Detects file context and suggests relevant skill
- Enables tool restrictions per domain
- Enforces project conventions

## Usage

1. **In Chat**: Type `/` to see all available skills
2. **Invoke Skill**: Select skill name or paste `/skill-name <task>`
3. **Multi-Step**: Skills handle complex workflows automatically

## Examples

```
/api-backend Create a new shipment route with JWT auth and rate limiting
/web-frontend Fix LCP metric - current is 3.2s need under 2.5s
/database-prisma Add user shipment history view with indexes
/security-auth Implement scope-based billing access control
/performance-optimization Analyze bundle size and recommend optimizations
```

## Integration Points

- **Shared Package**: Auto-rebuilds before API/Web restarts
- **Type Generation**: Prisma generates types after migrations
- **Testing**: API tests run with coverage thresholds (~75-84%)
- **Deployment**: Vercel (Web), Fly.io (API), Firebase (backup)

## Architecture Context

- **Monorepo**: pnpm workspaces with 5 apps/packages
- **API**: Express.js (CommonJS) on port 3001/4000
- **Web**: Next.js 14 (ESM TypeScript) on port 3000
- **Database**: PostgreSQL (Prisma ORM)
- **Auth**: JWT with scope-based access control
- **Deployment**: Docker Compose, Kubernetes-ready

## Get Started

1. Check relevant skill with `/skill-name`
2. Follow the quick rules and patterns
3. Run commands from skill documentation
4. Leverage project conventions (migrations, builds, tests)

---

**Need Help?**
- Run quick commands: `pnpm dev`, `pnpm test`, `pnpm lint`
- Check status: `pnpm check:types`
- View logs: `docker-compose logs -f api`

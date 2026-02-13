# 🎓 TEAM ONBOARDING GUIDE (100% COMPLETE)

**Status**: New hire ready  
**Purpose**: Get team members productive in first week  
**Target**: Engineers, DevOps, Sales, Support, Marketing  

---

## 👋 WELCOME TO INFÆMOUS FREIGHT!

You're joining the team building the AI-native operating system for professional truck drivers.

**Your first week goal**: Understand the platform, deploy locally, make your first contribution.

---

## 📚 WEEK 1: ORIENTATION

### Day 1: Platform Overview (2 hours)

**Goal**: Understand what we've built and why it matters

**Key documents to read**:
1. [README.md](README.md) - Product overview (15 min)
2. [00_START_HERE.md](00_START_HERE.md) - Quick start (15 min)
3. [COMPLETE_100_FINAL_STATUS.md](COMPLETE_100_FINAL_STATUS.md) - Project status (20 min)
4. This document - Onboarding (20 min)

**Key links**:
- [GitHub Repo](https://github.com/your-org/infamous-freight)
- [Production Web](https://infamous-freight-enterprises.vercel.app)
- [API Docs](https://api.infamous-freight.com/docs)
- [Slack Workspace](https://infamous-freight.slack.com)
- [Figma Design System](https://figma.com/your-team/infamous)

**What we do**:
- Unified platform for truck drivers (mobile app, web dashboard, AI dispatch)
- Real-time tracking with GPS
- AI-powered load matching
- Payment settlement (Stripe integration)
- Enterprise support for small carriers

**Why it matters**:
- $900B freight industry, <10% digital
- 4.2M independent drivers losing 30-40% to inefficiency
- We solve this with modern technology and fair pricing

**After reading**: Schedule "Platform Deep Dive" with your manager

---

### Day 2: Local Development Setup (3 hours)

**Goal**: Deploy platform locally and run tests

**Prerequisites**:
- Git, Node.js 24+, Docker, Docker Compose
- [VS Code](https://code.visualstudio.com) with extensions:
  - [TypeScript](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-typescript-next)
  - [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
  - [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
  - [Docker](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-docker)

**Setup steps** (20-30 min):

```bash
# 1. Clone repository
git clone https://github.com/your-org/infamous-freight.git
cd infamous-freight

# 2. Install dependencies
pnpm install

# 3. Copy environment file
cp .env.example .env.local

# 4. Start development containers
docker-compose up -d

# 5. Install database
cd apps/api
pnpm prisma migrate dev
pnpm prisma db seed           # Add test data

# 6. Start dev servers
cd ../..
pnpm dev                      # All services
# OR individually:
pnpm api:dev                  # API only (port 4000)
pnpm web:dev                  # Web only (port 3000)

# 7. Verify everything works
curl http://localhost:4000/api/health
open http://localhost:3000
```

**Verification checklist**:

```
✅ API responds to /api/health
✅ Web app loads at http://localhost:3000
✅ Postgres database connected
✅ Can create user account
✅ Can view test shipments in database
```

**After setup**: Run `pnpm test` to verify all tests pass

**Common issues**:

| Issue | Solution |
|-------|----------|
| Port 3000/4000 already in use | `lsof -ti:3000 \| xargs kill -9` |
| Database connection fails | `docker-compose logs postgres` |
| Lockfile mismatch | `pnpm install --no-frozen-lockfile` |
| Node version wrong | `nvm install 24` then `nvm use 24` |

---

### Day 3: Code Architecture Review (3 hours)

**Goal**: Understand codebase structure and standards

**Architecture Overview**:

```
apps/
├── api/                    # Express.js backend
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── middleware/    # Auth, validation, errors
│   │   ├── services/      # Business logic
│   │   └── prisma/        # Database schema
│   ├── __tests__/         # 827+ unit tests
│   └── coverage/          # Coverage reports
│
├── web/                   # Next.js 14 frontend
│   ├── pages/            # Route pages
│   ├── components/       # React components
│   ├── lib/              # Utilities
│   └── __tests__/        # Component tests
│
└── mobile/               # React Native app
    ├── src/
    └── __tests__/

packages/
└── shared/              # TypeScript shared library
    ├── src/
    │   ├── types.ts     # Domain types
    │   ├── constants.ts # Shared constants
    │   ├── utils.ts     # Utility functions
    │   └── env.ts       # Environment config
    └── dist/            # Build output

tools/
├── Dockerfile           # Docker configuration
├── docker-compose*.yml  # Local/prod environments
├── package.json         # Workspace root
└── pnpm-workspace.yaml  # pnpm configuration
```

**Technology stack** (memorize these):

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 14, React 18, TypeScript | Web UI |
| Mobile | React Native, Expo, TypeScript | Native apps |
| Backend | Express.js, CommonJS, Node.js 24 | REST API |
| Database | PostgreSQL 16, Prisma ORM | Data storage |
| Real-time | Socket.io | Live updates |
| AI | OpenAI, Anthropic | Dispatch engine |
| Auth | JWT, Express-validator | Security |
| Payments | Stripe | Billing |
| Monitoring | Sentry, Winston | Error tracking |
| Cloud | Fly.io, Vercel, AWS | Deployment |

**Key patterns** (you'll see these everywhere):

1. **API Route Pattern**:
```javascript
router.post('/shipments',
  limiters.general,
  authenticate,
  requireScope('shipment:create'),
  auditLog,
  [validateString('destination'), handleValidationErrors],
  async (req, res, next) => {
    try {
      const shipment = await shipmentService.create(req.body);
      res.status(HTTP_STATUS.CREATED).json(
        new ApiResponse({ success: true, data: shipment })
      );
    } catch (err) {
      next(err);  // Global error handler
    }
  }
);
```

2. **Shared Module Import** (ALWAYS do this):
```javascript
// ✅ CORRECT
const { SHIPMENT_STATUSES } = require('@infamous-freight/shared');

// ❌ WRONG
const SHIPMENT_STATUSES = { 'active': 'active' };  // Don't redefine!
```

3. **Type Definition** (TypeScript):
```typescript
import { Shipment, User } from '@infamous-freight/shared';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function getShipment(id: string): Promise<ApiResponse<Shipment>> {
  // Type-safe implementation
}
```

**Reading assignments**:

**For Engineers**:
- [Copilot Instructions](/.github/copilot-instructions.md) - Dev patterns
- [CONTRIBUTING.md](CONTRIBUTING.md) - Code standards
- [BUILD.md](BUILD.md) - Build procedures

**For DevOps**:
- [DEPLOYMENT_READY_100.md](DEPLOYMENT_READY_100.md) - Deployment procedures
- [PRODUCTION_RUNBOOK.md](PRODUCTION_RUNBOOK.md) - Operations guide

**For Sales/Marketing**:
- [MARKETING_LAUNCH_PLAYBOOK.md](MARKETING_LAUNCH_PLAYBOOK.md) - GTM strategy
- [CUSTOMER_ACQUISITION_GUIDE.md](CUSTOMER_ACQUISITION_GUIDE.md) - Sales process

---

### Day 4: Make Your First Contribution (3 hours)

**Goal**: Submit your first pull request

**Pick a starter task**:

```
Easy (1-2 hours):
├─ Add a console.log statement to test suite
├─ Update documentation/README
├─ Add environment variable
└─ Refactor a function with better naming

Medium (2-4 hours):
├─ Add a new API endpoint
├─ Add a React component
├─ Fix a known bug
└─ Add input validation

Hard (4-8 hours):
├─ Add new feature (requires design review first)
├─ Refactor major code section
├─ Optimize database query
└─ Add monitoring/alerting
```

**Contribution workflow**:

```bash
# 1. Create feature branch
git checkout -b feature/my-first-task

# 2. Make your changes
# (Edit files, write code, add tests)

# 3. Run quality checks
pnpm lint                    # Follow code standards
pnpm format                  # Auto-format code
pnpm check:types            # TypeScript validation
pnpm test                    # All tests pass

# 4. Commit with meaningful message
git add .
git commit -m "feat: Add new feature [JIRA-123]"

# 5. Push branch
git push origin feature/my-first-task

# 6. Create pull request on GitHub
# - Title: "feat: Add new feature [JIRA-123]"
# - Description: Why this change, how it works
# - Link to Figma/Design if UI changes
# - Checklist: Tests ✅, Linting ✅, Docs ✅

# 7. Wait for code review
# - Address feedback
# - Request re-review

# 8. Merge when approved
# (Maintainer merges to main)
```

**Code review expectations**:

```
✅ APPROVAL CRITERIA:
  - Tests pass & coverage > 80%
  - Linting/formatting correct
  - No console.logs in production code
  - Documentation updated
  - Performance wasn't degraded
  - Security not compromised

❌ COMMON REJECTIONS:
  - Missing tests
  - Hardcoded values (use variables)
  - No error handling
  - Bypasses auth/validation
  - Performance regression
  - Breaking existing tests
```

**After merging**: Celebrate! 🎉 You're now officially a contributor.

---

### Day 5: Team Meetings & Integration (3 hours)

**Schedule your meetings**:

```
Monday:       All-hands standup (15 min)
Tuesday:      Your team sync (30 min)
Wednesday:    Code review deepdive (30 min)
Thursday:     Product roadmap review (30 min)
Friday:       Retro + planning (45 min)
```

**What you'll learn**:
- Team members' roles and who does what
- Current priorities and blockers
- Customer feedback and support issues
- Upcoming features and roadmap
- Salary/benefits/culture norms

**Networking**:
- Get coffee with your manager (learn growth path)
- Pair with a senior engineer (ask questions!)
- Introduce yourself to support team (learn customer needs)
- Meet sales team (understand go-to-market)

---

## 🔧 DEVELOPER TOOLS & COMMANDS

### Essential Commands

```bash
# Development
pnpm install              # Install dependencies
pnpm dev                  # Start all local services
pnpm api:dev             # Start API only
pnpm web:dev             # Start web only
pnpm mobile:dev          # Start mobile app

# Testing
pnpm test                 # Run all tests
pnpm test:watch          # Re-run on file changes
pnpm test --coverage     # Generate coverage report

# Quality
pnpm lint                 # Check code style
pnpm format              # Auto-format code
pnpm check:types         # TypeScript validation

# Database
cd apps/api
pnpm prisma migrate dev  # Create new migration
pnpm prisma studio      # Visual database explorer
pnpm prisma db seed     # Load test data

# Building
pnpm build               # Build all packages
pnpm api:build          # Build API only
pnpm web:build          # Build web only
```

### Debugging Tips

**Debug in VS Code**:

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug API",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/apps/api/index.js",
      "env": { "NODE_ENV": "development" }
    },
    {
      "type": "chrome",
      "request": "launch",
      "name": "Debug Web",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/apps/web"
    }
  ]
}
```

**Debug API with logging**:

```javascript
const logger = require('./logger');
logger.debug('Shipment created', { shipmentId, driverId, duration });
```

**Debug database queries**:

```bash
cd apps/api
# Enable query logging
export DATABASE_LOG=query
# Run API
pnpm api:dev
# You'll see all SQL queries in console
```

---

## 📖 DOCUMENTATION MAZE

Here are important docs and where to find them:

**Getting Started**:
- [README.md](README.md) - Start here
- [00_START_HERE.md](00_START_HERE.md) - Quick reference

**Development**:
- [CONTRIBUTING.md](CONTRIBUTING.md) - Code standards
- [BUILD.md](BUILD.md) - Build procedures
- [.github/copilot-instructions.md](.github/copilot-instructions.md) - Dev patterns

**Operations**:
- [DEPLOYMENT_READY_100.md](DEPLOYMENT_READY_100.md) - How to deploy
- [PRODUCTION_RUNBOOK.md](PRODUCTION_RUNBOOK.md) - How to operate
- [MONITORING_SETUP_GUIDE.md](MONITORING_SETUP_GUIDE.md) - Monitoring setup
- [SECURITY_AUDIT_GUIDE.md](SECURITY_AUDIT_GUIDE.md) - Security checklist

**Business**:
- [MARKETING_LAUNCH_PLAYBOOK.md](MARKETING_LAUNCH_PLAYBOOK.md) - Go-to-market
- [CUSTOMER_ACQUISITION_GUIDE.md](CUSTOMER_ACQUISITION_GUIDE.md) - Sales process
- [PRICING_MONETIZATION_GUIDE.md](PRICING_MONETIZATION_GUIDE.md) - Revenue model
- [INVESTOR_PITCH_MATERIALS.md](INVESTOR_PITCH_MATERIALS.md) - Fundraising

**Architecture**:
- [MASTER_PHASE_MAP_FINAL.md](MASTER_PHASE_MAP_FINAL.md) - Project phases
- [ADVANCED_CACHING_GUIDE.md](ADVANCED_CACHING_GUIDE.md) - Performance
- [DATABASE_OPTIMIZATION_GUIDE.md](DATABASE_OPTIMIZATION_GUIDE.md) - DB scaling

**Search tip**: Use Ctrl+F in GitHub to find docs or code.

---

## 🚀 WEEK 2-4: RAMP UP

### Week 2: Deep Specialization

**Engineers**:
- Deep dive into API architecture
- Understand Prisma schema
- Learn Socket.io realtime patterns
- Contribute 2-3 features

**DevOps**:
- Set up monitoring (Sentry, UptimeRobot)
- Configure alerting
- Practice deployment procedures
- Set up automated backups

**Sales**:
- Attend 3 customer demos
- Review 5 sales conversations
- Develop product knowledge
- Start prospecting list

**Support**:
- Handle 10 customer tickets
- Document common issues
- Shadow veteran support rep
- Create FAQ document

### Week 3: Independent Projects

- Lead a small feature
- Own a support area
- Create marketing asset
- Contribute to docs

### Week 4: Team Integration

- Present work to team
- Mentor someone if possible
- Review 5+ pull requests
- Plan for next month

---

## ❓ FAQ FOR NEW HIRES

**Q: I don't understand the codebase**
A: Normal! Ask questions. Read one file at a time, use VS Code's "Go to Definition" heavily.

**Q: I broke the database**
A: Good news: It was local. Delete `docker-compose.override.yml` and restart.

**Q: Tests are failing**
A: Run `pnpm install --no-frozen-lockfile` then `pnpm test` again.

**Q: I don't know how this feature works**
A: Check Slack history in #engineering channel, or ask the person who wrote it.

**Q: How long does deployment take?**
A: Web: ~2 min (Vercel). API: ~5 min (Fly.io). Database migrations: depends on size.

**Q: I have a great idea for a feature**
A: Awesome! Write it up in GitHub Discussions, tag product team for feedback.

**Q: What if I make a mistake in production?**
A: We have rollback procedures. Don't panic, ask for help, we'll fix it together.

**Q: How do I get unstuck?**
A: 15 min researching, then ask in #engineering channel or tag me. Unblocking is everyone's job.

---

## 📅 ONBOARDING CHECKLIST

**Week 1**:

- [ ] Read README.md
- [ ] Read 00_START_HERE.md
- [ ] Set up local development
- [ ] Run `pnpm test` successfully
- [ ] Make first contribution
- [ ] Introduce yourself to team
- [ ] Get added to GitHub org

**By End of Month**:

- [ ] Contribute 5+ pull requests
- [ ] Deploy code to production (with help)
- [ ] Understand platform architecture
- [ ] Know 5+ team members well
- [ ] Can explain product to outsider
- [ ] Have 1:1 growth conversation
- [ ] Documented something helpful
- [ ] Helped onboard next person

---

## 🎁 WELCOME PACKAGE

**Your first day**:

```
✅ GitHub access
✅ Slack account + channels added
✅ Calendar invites
✅ AWS/Fly.io/Vercel access (if applicable)
✅ Figma design docs
✅ 1:1 with manager
✅ Team dinner/coffee
```

**Your first week**:

```
✅ New hire swag (if remote)
✅ Laptop w/ tools
✅ GitHub team access
✅ Customer reference calls
✅ Onboarding buddy assigned
```

---

## 📞 GETTING HELP

**Who to ask for what**:

| Question | Who |
|----------|-----|
| How does [feature] work? | Your team lead |
| How do I deploy? | #devops channel or DevOps engineer |
| Can I deploy this? | #engineering channel consensus |
| Customer is confused | #support team |
| Is this the right approach? | Code review time! |
| How's my performance? | Your manager (in 1:1s) |
| I'm stuck for 2 hours | Escalate to team lead |
| Early morning/late night | Async in Slack, no response expected |

---

## 🏆 SUCCESS METRICS

After 30 days, you should be able to:

- [ ] Deploy code to production independently
- [ ] Review other people's PRs
- [ ] Explain product to customers
- [ ] Handle 10+ support tickets (Support) OR
- [ ] Contribute features end-to-end (Engineers) OR
- [ ] Run monitoring dashboard (DevOps) OR
- [ ] Schedule and execute sales demo (Sales)
- [ ] Know team members by name and role
- [ ] Have ideas for improvements
- [ ] Feel comfortable in Slack/meetings
- [ ] Understand our market/customers
- [ ] Know who to ask for what

---

## 🚀 MOVING FORWARD

After your first month:

- **Engineers**: Pick your first big feature to own
- **DevOps**: Assume production monitoring responsibility
- **Sales**: Target your first customer close
- **Support**: Become expert in your area
- **Marketing**: Launch first campaign

---

**Welcome to the team!** 🚀

Questions? Ask in #help or message your manager.

Let's build the future of freight together.

---

**Document Version**: 1.0.0  
**Last Updated**: [Today]  
**Owner**: People Operations  
**Questions?**: message #help channel

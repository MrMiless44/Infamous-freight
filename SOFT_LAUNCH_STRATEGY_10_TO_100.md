# 🎯 SOFT LAUNCH STRATEGY: 10% → 100% ROLLOUT

**Date**: February 14, 2026  
**Status**: ✅ READY TO EXECUTE  
**Timeline**: 4 weeks (staged rollout)  
**Risk Level**: LOW (controlled, reversible)

---

## 📋 EXECUTIVE SUMMARY

This document outlines a staged rollout strategy for INFÆMOUS FREIGHT,
progressively increasing user exposure from 10% to 100% over 4 weeks. This
approach minimizes risk, allows for rapid iteration, and ensures infrastructure
scales smoothly.

**Key Benefits**:

- ✅ Early issue detection with limited blast radius
- ✅ Real-time performance validation at each stage
- ✅ Ability to roll back quickly if problems arise
- ✅ Data-driven decision making (metrics at each gate)
- ✅ Smooth scaling without infrastructure surprises

**Success Criteria**: Each stage must meet quality gates before progressing to
next stage.

---

## 🗓️ ROLLOUT TIMELINE (4 Weeks)

```
Week 1: 10% Traffic  → Validate core functionality
Week 2: 25% Traffic  → Confirm scaling works
Week 3: 50% Traffic  → Stress test infrastructure
Week 4: 100% Traffic → Full production launch

Gate Checks: 24-48 hours between stages (metrics-driven)
```

---

## 🚀 STAGE 1: 10% ROLLOUT (Week 1 - Days 1-7)

### **Objectives**

- Validate core user flows work in production
- Identify any critical bugs with small user base
- Baseline performance metrics
- Test monitoring & alerting systems

### **Target Audience (10% = ~1,300 users)**

Priority order:

1. **Internal team** (50 users) - dogfooding
2. **Beta testers** (200 users) - known contacts, willing to report issues
3. **Grandfather pricing** (1,000 users) - existing waitlist, loyal early
   adopters
4. **Random sampling** (50 users) - organic traffic for unbiased feedback

### **Rollout Method**

**Option A: Feature Flag (LaunchDarkly / Flagsmith)**

```typescript
// apps/web/lib/featureFlags.ts
import { useFlags } from 'launchdarkly-react-client-sdk';

export function useNewPricingEnabled() {
  const { newPricingEnabled } = useFlags();
  return newPricingEnabled; // true for 10% of users
}

// apps/web/pages/pricing.tsx
export default function PricingPage() {
  const newPricingEnabled = useNewPricingEnabled();

  if (!newPricingEnabled) {
    return <OldPricingPage />; // fallback
  }

  return <NewPricingPage />; // 2026 pricing
}
```

**Option B: Percentage-Based Routing (No External Service)**

```typescript
// apps/web/lib/rollout.ts
export function isUserInRollout(userId: string, percentage: number): boolean {
  // Deterministic hash-based sampling
  const hash = hashUserId(userId);
  return hash % 100 < percentage;
}

function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Usage
const userId = user?.id || generateAnonymousId();
const rolloutPercentage = 10; // 10% for Week 1

if (isUserInRollout(userId, rolloutPercentage)) {
  // Show new features
} else {
  // Show old version
}
```

**Option C: Server-Side Feature Flag (Recommended)**

```javascript
// apps/api/src/middleware/rollout.js
const ROLLOUT_PERCENTAGE = process.env.ROLLOUT_PERCENTAGE || 10;

function checkRollout(req, res, next) {
  const userId = req.user?.id || req.session?.anonymousId;

  if (!userId) {
    // No user ID, default to old version
    req.isInRollout = false;
    return next();
  }

  const hash = hashUserId(userId);
  req.isInRollout = hash % 100 < ROLLOUT_PERCENTAGE;

  next();
}

module.exports = { checkRollout };
```

### **Quality Gates (Must Pass to Progress)**

| Metric                         | Target       | Result | Pass? |
| ------------------------------ | ------------ | ------ | ----- |
| **API Uptime**                 | ≥99.5%       | \_\_\_ | ⬜    |
| **Error Rate**                 | <0.5%        | \_\_\_ | ⬜    |
| **P99 Latency**                | <1s          | \_\_\_ | ⬜    |
| **Free→Pro Conversion**        | ≥20%         | \_\_\_ | ⬜    |
| **Support Tickets (Critical)** | <5           | \_\_\_ | ⬜    |
| **Payment Processing**         | 100% success | \_\_\_ | ⬜    |
| **User Satisfaction (NPS)**    | ≥50          | \_\_\_ | ⬜    |

**Decision**: If 6/7 gates pass → Proceed to Stage 2. If <6 pass → Fix issues,
restart Stage 1.

### **Stage 1 Checklist**

```
Pre-Rollout (Day 0):
  [ ] Configure rollout percentage: 10%
  [ ] Test feature flag works (internal team only)
  [ ] Verify rollback procedure (set percentage to 0%)
  [ ] Alert team: "10% rollout begins tomorrow"
  [ ] Monitoring dashboards ready

Day 1-2 (Initial Launch):
  [ ] Enable 10% rollout (8 AM PT)
  [ ] Monitor dashboards every 30 min
  [ ] Check error logs hourly
  [ ] Respond to support tickets (<1 hour)
  [ ] Daily team sync (end of day)

Day 3-5 (Monitoring):
  [ ] Continue dashboard monitoring (every 2 hours)
  [ ] Collect user feedback (surveys, support)
  [ ] Identify any patterns in errors
  [ ] Performance optimization if needed
  [ ] Midweek status report

Day 6-7 (Gate Check):
  [ ] Run quality gate checklist
  [ ] Analyze all metrics vs targets
  [ ] Decision: Proceed to Stage 2 or iterate?
  [ ] If proceed: Schedule Stage 2 kickoff
  [ ] If iterate: Create fix plan, retest
```

---

## 🚀 STAGE 2: 25% ROLLOUT (Week 2 - Days 8-14)

### **Objectives**

- Confirm infrastructure scales to 2.5x traffic
- Validate cost projections (AWS/database/APIs)
- Gather more user feedback for iteration
- Test load balancer & caching performance

### **Target Audience (25% = ~3,250 users)**

1. All Stage 1 users (continue access, prevent confusion)
2. Additional waitlist members (2,000 users)
3. Organic traffic (random sampling)

### **New Risks to Monitor**

- Database query performance under higher load
- Redis cache hit rates
- Third-party API rate limits (Stripe, email service)
- Cost increases (expect 2.5x Stage 1 costs)

### **Quality Gates (Must Pass)**

| Metric                  | Target    | Result | Pass? |
| ----------------------- | --------- | ------ | ----- |
| **API Uptime**          | ≥99.5%    | \_\_\_ | ⬜    |
| **Error Rate**          | <0.3%     | \_\_\_ | ⬜    |
| **P99 Latency**         | <1s       | \_\_\_ | ⬜    |
| **Database CPU**        | <70%      | \_\_\_ | ⬜    |
| **Cache Hit Rate**      | ≥80%      | \_\_\_ | ⬜    |
| **Free→Pro Conversion** | ≥25%      | \_\_\_ | ⬜    |
| **Cost per User**       | <$5/month | \_\_\_ | ⬜    |

**Decision**: If 6/7 gates pass → Proceed to Stage 3. If issues → Fix and
re-gate.

### **Stage 2 Checklist**

```
Pre-Rollout (Day 7):
  [ ] Verify Stage 1 gates all passed
  [ ] Configure rollout percentage: 25%
  [ ] Database query optimization (if needed from Stage 1)
  [ ] Alert team: "25% rollout begins Day 8"
  [ ] Review cost projections

Day 8-10 (Initial 25%):
  [ ] Enable 25% rollout (8 AM PT)
  [ ] Monitor dashboards every 1 hour (first 8 hours)
  [ ] Check database performance metrics
  [ ] Verify cache hit rates acceptable
  [ ] Daily team sync

Day 11-13 (Scaling Validation):
  [ ] Continue monitoring (every 2 hours)
  [ ] Load testing: Simulate 50% traffic
  [ ] Cost analysis: Verify per-user cost <$5
  [ ] Collect feedback from new cohort
  [ ] Plan fixes for Stage 3

Day 14 (Gate Check):
  [ ] Run quality gate checklist
  [ ] Decision: Proceed to Stage 3 (50%) or iterate?
  [ ] If proceed: Schedule Stage 3 kickoff
  [ ] Update team on progress
```

---

## 🚀 STAGE 3: 50% ROLLOUT (Week 3 - Days 15-21)

### **Objectives**

- Stress test infrastructure at half production load
- Validate auto-scaling works correctly
- Confirm monitoring catches issues proactively
- Finalize any performance optimizations

### **Target Audience (50% = ~6,500 users)**

- All Stage 1 & 2 users (maintain consistency)
- Additional 3,250 new users (random sampling)

### **Critical Focus Areas**

- **Auto-scaling**: Ensure additional API instances spin up automatically
- **Database**: Connection pooling, query optimization, read replicas
- **Rate Limiting**: Verify fairness across all users
- **Cost**: Project 100% costs, ensure budget sufficient

### **Quality Gates (Must Pass)**

| Metric                    | Target                 | Result | Pass? |
| ------------------------- | ---------------------- | ------ | ----- |
| **API Uptime**            | ≥99.7%                 | \_\_\_ | ⬜    |
| **Error Rate**            | <0.2%                  | \_\_\_ | ⬜    |
| **P99 Latency**           | <800ms                 | \_\_\_ | ⬜    |
| **Auto-Scaling**          | Successful (tested)    | \_\_\_ | ⬜    |
| **Database CPU**          | <60% (w/ read replica) | \_\_\_ | ⬜    |
| **Free→Pro Conversion**   | ≥28%                   | \_\_\_ | ⬜    |
| **Support Response Time** | <2 hours avg           | \_\_\_ | ⬜    |

**Decision**: If 6/7 gates pass + no critical issues → Proceed to Stage 4
(100%).

### **Stage 3 Checklist**

```
Pre-Rollout (Day 14):
  [ ] Verify Stage 2 gates all passed
  [ ] Configure rollout percentage: 50%
  [ ] Set up read replica (if needed)
  [ ] Test auto-scaling (simulate load)
  [ ] Alert team: "50% rollout begins Day 15"

Day 15-17 (Initial 50%):
  [ ] Enable 50% rollout (8 AM PT)
  [ ] Monitor dashboards every 30 min (first 8 hours)
  [ ] Verify auto-scaling triggers correctly
  [ ] Check database reads balanced across replicas
  [ ] Daily team sync

Day 18-20 (Performance Validation):
  [ ] Load testing: Simulate 100% traffic (10K users)
  [ ] Verify infrastructure handles peak load
  [ ] Cost projection for 100% rollout
  [ ] Collect feedback, address any blockers
  [ ] Plan 100% launch communications

Day 21 (Gate Check):
  [ ] Run quality gate checklist
  [ ] Final decision: Proceed to 100% or delay?
  [ ] If proceed: Announce launch date publicly
  [ ] Prepare Product Hunt submission (if applicable)
```

---

## 🚀 STAGE 4: 100% ROLLOUT (Week 4 - Days 22-28)

### **Objectives**

- Full production launch to all users
- Celebrate successful staged rollout 🎉
- Monitor first 48 hours closely
- Begin focus on growth & optimization

### **Target Audience (100% = ~13,000 users Month 1)**

- All users, no restrictions
- New organic signups
- Marketing campaigns fully activated

### **Launch Day Preparation**

```
48 Hours Before Launch (Day 20-21):
  [ ] All Stage 3 gates passed
  [ ] Load testing completed successfully
  [ ] Team briefed on launch plan
  [ ] On-call schedule confirmed (24/7 coverage)
  [ ] Monitoring dashboards shared with team
  [ ] Rollback procedure documented & tested
  [ ] Press release drafted (if applicable)
  [ ] Product Hunt submission ready

24 Hours Before Launch (Day 21):
  [ ] Final code freeze (no non-critical changes)
  [ ] Database backups verified
  [ ] Disaster recovery plan reviewed
  [ ] Team dry-run of launch sequence
  [ ] Confirm external services ready (Stripe, emails)

Launch Day (Day 22):
  6:00 AM  → Final system checks
  7:00 AM  → Enable 100% rollout
  7:15 AM  → Verify monitoring shows 100% traffic
  8:00 AM  → Product Hunt submission (if doing)
  8:30 AM  → Send launch emails/announcements
  9:00 AM  → Monitor dashboards every 15 min
  12:00 PM → Midday status check with team
  5:00 PM  → End of day summary
  10:00 PM → Final check before overnight monitoring

Day 23-24 (Post-Launch):
  [ ] Continue close monitoring (every 1 hour)
  [ ] Respond to all support tickets <2 hours
  [ ] Collect user feedback
  [ ] Share wins with team (#infæmous-wins Slack)
  [ ] Daily status report

Day 25-28 (Week 4 Completion):
  [ ] Transition to normal monitoring cadence
  [ ] Retrospective: What went well, what to improve?
  [ ] Document lessons learned
  [ ] Plan next phase: Growth & optimization
  [ ] Celebrate with team! 🎉
```

### **100% Success Criteria (7 Days Post-Launch)**

| Metric                    | Target  | Result | Status |
| ------------------------- | ------- | ------ | ------ |
| **Uptime (7 days)**       | ≥99.9%  | \_\_\_ | ⬜     |
| **Error Rate**            | <0.12%  | \_\_\_ | ⬜     |
| **P99 Latency**           | <500ms  | \_\_\_ | ⬜     |
| **Free Signups**          | 2,100+  | \_\_\_ | ⬜     |
| **Pro Conversions**       | 100+    | \_\_\_ | ⬜     |
| **Revenue**               | $10K+   | \_\_\_ | ⬜     |
| **Customer Satisfaction** | NPS ≥60 | \_\_\_ | ⬜     |

---

## 🔄 ROLLBACK PROCEDURES

If critical issues arise at any stage, rollback immediately:

### **Emergency Rollback (5 Minutes)**

```bash
# Option 1: Feature flag (instant)
# Set rollout percentage to previous stage
export ROLLOUT_PERCENTAGE=10  # or 0 for full rollback

# Option 2: Environment variable
# Update .env and restart services
ROLLOUT_PERCENTAGE=0 pnpm restart

# Option 3: Git revert (if code issue)
git revert HEAD
git push origin main
# Redeploy to Vercel + Fly.io (5-10 min)
```

### **Rollback Triggers (Automatic)**

Set up automatic rollback if:

- Error rate > 5% for 5 minutes
- API uptime < 95% for 10 minutes
- P99 latency > 5s for 5 minutes
- Payment processing failure rate > 10%

```javascript
// apps/api/src/services/autoRollback.js
const { dogstatsd } = require("datadog-metrics");

setInterval(async () => {
  const errorRate = await getErrorRate(); // from metrics

  if (errorRate > 5) {
    console.error("🚨 ERROR RATE > 5%, TRIGGERING AUTO-ROLLBACK");

    // Reduce rollout percentage by 50%
    const currentPercentage = parseInt(process.env.ROLLOUT_PERCENTAGE) || 100;
    const newPercentage = Math.max(0, currentPercentage / 2);

    // Update environment (requires service restart or feature flag update)
    await updateRolloutPercentage(newPercentage);

    // Alert team
    await sendSlackAlert(
      "#infæmous-alerts",
      `🚨 Auto-rollback triggered: ${currentPercentage}% → ${newPercentage}%`,
    );
  }
}, 60 * 1000); // Check every minute
```

---

## 📊 METRICS TRACKING (All Stages)

### **Dashboard View**

Create a dedicated "Rollout Status" dashboard:

```
Widget 1: Current Rollout Percentage
  → Display: 10% / 25% / 50% / 100%
  → Update: Manual (env var change)

Widget 2: Users in Rollout vs Total
  → Example: "1,300 / 13,000 users (10%)"
  → Source: Custom metric

Widget 3: Stage Quality Gates
  → Show 7 gates, checkmarks for pass/fail
  → Color-coded: Green (pass), Red (fail), Yellow (borderline)

Widget 4: Stage Timeline
  → Visual timeline showing current stage + next gate check
  → Days remaining until next stage

Widget 5: Key Metrics Trend (7 days)
  → Line charts: Uptime, Error Rate, Latency, Conversions
  → Compare current stage vs previous stage
```

### **Daily Rollout Report (Automated)**

Send to #infæmous-rollout Slack channel daily:

```
📊 DAILY ROLLOUT STATUS - Day X/28

Stage: 25% Rollout (Week 2)
Days in Stage: 3/7
Next Gate Check: 4 days

QUALITY GATES (6/7 PASSING):
✅ API Uptime: 99.8% (target: 99.5%)
✅ Error Rate: 0.15% (target: <0.3%)
✅ P99 Latency: 620ms (target: <1s)
✅ Database CPU: 45% (target: <70%)
✅ Cache Hit Rate: 88% (target: ≥80%)
⚠️  Free→Pro Conversion: 22% (target: ≥25%) ← BORDERLINE
✅ Cost per User: $3.20 (target: <$5)

USER METRICS:
• Total users: 3,250 (25% of 13,000)
• New signups today: 180
• Pro conversions today: 40 (22% conversion)
• Support tickets: 3 (all resolved <2 hours)

NOTABLE EVENTS:
• None

ACTION ITEMS:
• Investigate conversion funnel (22% vs 25% target)
• A/B test pricing page CTA (Marketing team)

ON TRACK FOR STAGE 3: YES (6/7 gates passing, 4 days to improve conversion)
```

---

## 🎯 SUCCESS PATTERNS (Learn from Each Stage)

### **Stage 1 (10%) Learnings**

- Document every issue found (even minor)
- Identify which user segments convert best
- Note which features are most/least used
- Collect qualitative feedback (surveys, interviews)

### **Stage 2 (25%) Optimizations**

- Optimize slow database queries found in Stage 1
- Implement caching for hot paths
- Adjust pricing messaging based on feedback
- Improve onboarding based on drop-off points

### **Stage 3 (50%) Scaling**

- Confirm infrastructure auto-scales correctly
- Validate cost projections match actuals
- Test disaster recovery procedures (simulate outage)
- Finalize support team processes

### **Stage 4 (100%) Growth**

- Shift focus from stability to growth
- Enable all marketing campaigns
- Launch referral program (viral loop)
- Begin Series A investor outreach

---

## 🚨 RISK MANAGEMENT

### **Top Risks by Stage**

| Stage        | Risk                    | Probability | Impact | Mitigation                        |
| ------------ | ----------------------- | ----------- | ------ | --------------------------------- |
| **1 (10%)**  | Critical bug found      | Medium      | High   | Limited users, quick rollback     |
| **2 (25%)**  | Performance degradation | Medium      | Medium | Load testing, auto-scaling        |
| **3 (50%)**  | Database overload       | Low         | High   | Read replicas, query optimization |
| **4 (100%)** | Viral growth overwhelms | Low         | High   | Rate limiting, capacity planning  |

### **Contingency Plans**

**If conversion rate drops below target:**

- A/B test pricing page variations
- Adjust messaging/CTAs
- Offer limited-time discount (10% off first month)
- Conduct user interviews to understand hesitation

**If infrastructure can't handle load:**

- Vertical scaling (bigger database, more RAM)
- Horizontal scaling (more API instances)
- Implement aggressive caching
- Defer to CDN for static assets
- Consider read replicas for database

**If support tickets overwhelm team:**

- Hire temporary support agents (Upwork/Fiverr)
- Create comprehensive FAQ/knowledge base
- Implement chatbot for common questions
- Prioritize critical (payment/security) tickets

---

## ✅ STAGE TRANSITION CHECKLIST

Before moving from Stage N to Stage N+1:

```
[ ] All quality gates passed (6/7 minimum)
[ ] No critical bugs outstanding
[ ] Team consensus to proceed (unanimous)
[ ] Monitoring dashboards showing green
[ ] Cost projections within budget
[ ] Support tickets manageable (<10 open)
[ ] User feedback generally positive (NPS ≥50)
[ ] Performance meets targets (uptime, latency, errors)
[ ] Rollback procedure tested and confirmed working
[ ] Next stage preparation complete (env vars, alerts, etc.)

IF ALL CHECKED → PROCEED TO NEXT STAGE ✅
IF ANY UNCHECKED → FIX ISSUE(S), RE-ASSESS IN 48 HOURS
```

---

## 📚 REFERENCE MATERIALS

### **Feature Flag Services**

- LaunchDarkly: https://launchdarkly.com/
- Flagsmith: https://flagsmith.com/
- Unleash: https://www.getunleash.io/

### **Load Testing Tools**

- k6: https://k6.io/
- Artillery: https://artillery.io/
- Locust: https://locust.io/

### **Monitoring & Alerts**

- Datadog: https://www.datadoghq.com/
- PagerDuty: https://www.pagerduty.com/
- Sentry: https://sentry.io/

---

## 🎉 LAUNCH DAY (100% Rollout)

When you reach 100%, celebrate the milestone:

```
🚀 INFÆMOUS FREIGHT IS LIVE 🚀

After 4 weeks of careful staged rollout:
✅ 10% → 25% → 50% → 100%
✅ All quality gates passed
✅ Zero critical incidents
✅ Infrastructure scales smoothly
✅ Team ready for growth phase

THANK YOU to everyone who made this possible!

Next up:
→ Product Hunt launch
→ Email marketing campaigns
→ Series A fundraising
→ $8.2M ARR target (Month 1)

LET'S GO BUILD THE FUTURE 🚀🚀🚀
```

---

**Status**: ✅ SOFT LAUNCH STRATEGY COMPLETE  
**Timeline**: 4 weeks (staged, reversible, low-risk)  
**Success Rate**: High (quality gates enforce discipline)  
**Next**: Run STAGING_DEPLOYMENT_100.sh, then begin Stage 1 (10%)

🎯 **Staged rollout = confident scaling = Series A success** 🚀

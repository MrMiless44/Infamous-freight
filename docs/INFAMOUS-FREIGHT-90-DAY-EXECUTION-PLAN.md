# INFÆMOUS FREIGHT — 90-Day Execution Plan

## Product Positioning (Locked)
**Business model:** Dispatcher SaaS for small/mid-sized carriers (1–10 trucks).

### Why this path
- Fastest route to revenue from a single buyer persona.
- Clear operational pain point (spreadsheets + disconnected tools).
- Predictable recurring revenue through subscriptions.
- Lower complexity than launching a two-sided marketplace in phase one.

---

## Phase 1 (Days 1–14): MVP Completion
**Goal:** Launch a narrow, sellable MVP without scope creep.

### In-scope feature set
1. **Authentication + Roles**
   - Admin
   - Dispatcher
   - Carrier User

2. **Operations Dashboard**
   - Active loads
   - Revenue this month
   - Delivered loads
   - Pending invoices

3. **Load Management**
   - Shipper
   - Pickup location
   - Delivery location
   - Rate
   - Carrier assigned
   - Status: Booked / In Transit / Delivered / Paid

4. **Carrier Database**
   - Carrier name
   - MC/DOT
   - Contact
   - Insurance expiration
   - Notes

5. **Invoice Generator**
   - Auto-generated PDF invoice
   - Paid/Unpaid status
   - Monthly revenue summary

### Production hardening checklist
- [ ] Role-based Firebase Security Rules enforced in production.
- [ ] Dev vs prod environment variable separation verified.
- [ ] Stripe subscription checkout integrated.
- [ ] Stripe webhook handling for failed payments.
- [ ] Monitoring/logging enabled (Firebase + service logs).

---

## Phase 2 (Days 10–20): Monetization
**Goal:** Make billing enforceable and automatic.

### Pricing
| Plan | Monthly | Trucks |
|---|---:|---:|
| Starter | $99 | 1–2 |
| Pro | $149 | 3–5 |
| Fleet | $299 | 6–10 |

**Commercial policy:** No free tier. 7-day trial only.

### Stripe implementation scope
- [ ] Create products/prices in Stripe dashboard.
- [ ] Launch subscription checkout sessions.
- [ ] Add middleware for subscription status verification.
- [ ] Auto-downgrade or lock premium access on failed payment.

---

## Phase 3 (Days 20–60): Revenue Activation
**Goal:** Generate first 10–35 paying accounts through outbound + demos.

### Daily outbound protocol
- 50 cold DMs/day
- 10 follow-ups/day
- Offer 1 free onboarding call

### Target geographies
- Texas
- Georgia
- Illinois
- California

### Outreach script structure
1. **Problem-first**: “Are you still managing loads in spreadsheets?”
2. **Positioning**: “INFÆMOUS FREIGHT helps dispatchers manage loads, invoices, and carriers in one system.”
3. **CTA**: “Can I give you a 5-minute demo?”

### Revenue targets
- **Month 1:** 10 users @ $149 = **$1,490 MRR** (~$17,880 ARR)
- **Month 3:** 35 users average = **~$5,000 MRR** (~$60,000 ARR)

---

## Legal & Risk Foundation (Start immediately)
- [ ] Form LLC and obtain EIN.
- [ ] Open business banking account.
- [ ] Publish Terms of Service + Privacy Policy.
- [ ] Include data usage, payment processing, and liability disclosures.
- [ ] File trademark for **INFÆMOUS FREIGHT**.

---

## Phase 4 (Days 45–90): Scale Preparation
**Only after initial revenue validation.**

- [ ] Automated invoice emailing
- [ ] QuickBooks integration
- [ ] Load performance analytics
- [ ] Carrier portal access
- [ ] Mobile-responsive dashboard improvements

**Explicit non-goal:** Do not build full two-sided marketplace yet.

---

## Valuation Model (Operating assumption)
| Stage | Metric | Indicative valuation |
|---|---|---|
| MVP only | No revenue | $15k–$35k |
| Early traction | ~$1.5k MRR | ~$70k |
| Expansion | ~$5k MRR with retention | $250k–$400k |
| Scale | ~$20k MRR, churn <5% | $1M+ |

> Rule of thumb: early SaaS often values at 3–6× ARR, depending on retention and growth quality.

---

## Founder Operating System (Daily)
- Build: 2 hours
- Sell: 2 hours
- Study freight market: 1 hour
- Update metrics dashboard: daily

### Metrics to monitor
- MRR
- CAC
- Churn
- LTV

---

## Asset Mindset
Treat this repository as:
- A recurring revenue machine
- A sellable software asset
- A potential acquisition target
- A long-term cash-flow business

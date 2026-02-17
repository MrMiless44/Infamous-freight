// PHASE_9_PRODUCTION_DEPLOYMENT_RUNBOOK.md

# Phase 9 Production Deployment Runbook

## Pre-Deployment Checklist

### Environment Preparation

- [ ] All Phase 9 services tested in staging
- [ ] Database migrations verified
- [ ] External service credentials configured
- [ ] SSL certificates valid
- [ ] DNS configured
- [ ] Load balancer configured
- [ ] Auto-scaling policies set

### Code Quality

- [ ] All tests passing (`npm run test`)
- [ ] No type errors (`npm run check:types`)
- [ ] Lint passing (`npm run lint`)
- [ ] Code coverage >80%
- [ ] Security vulnerabilities scanned

### Infrastructure

- [ ] Monitoring dashboards created
- [ ] Alert thresholds configured
- [ ] Logging aggregation active
- [ ] Database backups configured
- [ ] CDN cache warming plan

---

## Deployment Steps

### Stage 1: Pre-Deployment (T-30 minutes)

```bash
# 1. Notify team
slack-notify "Phase 9 deployment starting in 30 minutes"

# 2. Create database backup
pg_dump-remote production > phase9_backup_$(date +%s).sql
aws s3 cp phase9_backup_*.sql s3://backups/

# 3. Verify rollback plan available
verify-rollback-artifacts

# 4. Start monitoring
open-monitoring-dashboard https://datadog.infamous-freight.com/dashboard
```

### Stage 2: Canary Deployment (T-0 to T+10 minutes)

```bash
# 1. Deploy to 5% of traffic
kubectl set image deployment/api-canary \
  api=infamous-freight-api:v1.0.0-phase9

# 2. Monitor canary metrics
watch -n 2 'kubectl top pods -l app=api-canary'

# 3. Check error rates
query_metric "api.error.rate{service:infamous-freight-api}" average
# Target: <0.1% error rate
```

### Stage 3: Blue-Green Deployment (T+10 to T+30 minutes)

```bash
# 1. Deploy to green environment
kubectl apply -f k8s/phase9-deployment.yaml --namespace=production

# 2. Verify green environment health
curl https://api-green.infamous-freight.com/api/health
# Expected: {"status": "ok"}

# 3. Run smoke tests
npm run test:smoke -- --url https://api-green.infamous-freight.com

# 4. Switch traffic to green (25%)
kubectl patch service api-service -p '{"spec":{"selector":{"version":"green"}}}'
```

### Stage 4: Progressive Rollout (T+30 to T+60 minutes)

```bash
# Scale up gradually
for percentage in 25 50 75 100; do
  echo "Scaling to $percentage% traffic..."
  kubectl set endpoints api-service \
    --weights="blue:$((100-percentage)),green:$percentage"

  # Monitor for 5 minutes
  sleep 300

  # Check metrics
  check-deployment-health
done
```

### Stage 5: Verification (T+60 minutes)

```bash
# 1. Full health check
curl -X GET https://api.infamous-freight.com/api/health

# 2. Verify all Phase 9 endpoints
npm run test:phase9 -- --url https://api.infamous-freight.com

# 3. Performance verification
npm run load-test -- --scenarios smoke
# Expected P95 latency: <200ms

# 4. Database verification
verify-data-integrity

# 5. User acceptance
announce-to-beta-users "Phase 9 now live!"
```

---

## Rollback Procedure

If any critical issues occur, execute immediate rollback:

```bash
# 1. Emergency notification
slack-notify-critical "Initiating Phase 9 rollback"

# 2. Switch traffic back to blue
kubectl patch service api-service -p '$(cat blue-endpoints.json)'

# 3. Verify old version
curl https://api.infamous-freight.com/api/versions
# Should show v3 endpoints

# 4. Restore database (if needed)
restore-database phase9_backup_$(date +%s).sql

# 5. Notify team
slack-notify "Phase 9 rollback complete"
```

---

## Post-Deployment Monitoring (First 24 Hours)

### Metrics to Monitor

| Metric                   | Target       | Alert Threshold |
| ------------------------ | ------------ | --------------- |
| API Error Rate           | <0.1%        | >1%             |
| Payment Success Rate     | >99.5%       | <99%            |
| Search Latency P95       | <500ms       | >1s             |
| Notification Delivery    | >99%         | <98%            |
| Database Connection Pool | 80-90 active | >95             |
| Cache Hit Rate           | >95%         | <90%            |

### Command References

```bash
# Monitor in real-time
watch -n 5 kubectl top pods -l app=api

# View logs
kubectl logs -f deployment/api-production --tail=100

# Check scaling status
kubectl get hpa -A

# Verify service endpoints
kubectl get endpoints api-service

# Check ingress status
kubectl describe ingress api-ingress
```

---

## Configuration Changes

### Environment Variables Applied

```bash
# Phase 9 specific
export ENABLE_PHASE9_SERVICES=true
export PHASE9_API_VERSION=v3
export PAYMENT_PROCESSOR=stripe
export BNPL_PROVIDERS=klarna,affirm,afterpay,paypal
export NOTIFICATION_CHANNELS=push,sms,email
export SEARCH_ENGINE=elasticsearch
export MFA_REQUIRED=false  # Optional, can be enforced per user

# External services
export STRIPE_API_KEY=sk_live_...
export FIREBASE_PROJECT_ID=infamous-freight-prod
export ELASTICSEARCH_URL=https://elastic.notorious-freight.com
```

---

## Success Criteria

✅ Phase 9 deployment is successful when:

- All API endpoints responding
- Payment processing working
- Notifications delivering
- Search indexes built
- Error rate <0.1%
- P95 latency <200ms
- No data loss
- User feedback positive

---

## Contact & Escalation

- **On-Call Engineer:** Check PagerDuty
- **Tech Lead:** @tech-lead on Slack
- **Operations Manager:** @ops-manager on Slack
- **Incident Commander:** @incident-commander on Slack

**Emergency Channel:** #production-incidents (Slack)

---

## Post-Deployment Report

Document after successful deployment:

```markdown
# Phase 9 Deployment Report

**Date:** [Date] **Duration:** [X hours Y minutes] **Deployed By:** [Name]

## Metrics

- API Errors: [X]
- Payment Success Rate: [Y]%
- Notifications Delivered: [Z]

## Issues Encountered

- [List any issues]

## Resolution

- [How resolved]

## Lessons Learned

- [Key takeaways]
```

---

**Deployment Runbook Version:** 1.0 **Last Updated:** February 2026 **Status:**
READY FOR PRODUCTION

# Cost & Resource Planning for 100% Unlocked Configuration

## Infrastructure Requirements

### Minimum Recommended Specs

| Resource      | Development | Production (50%) | Production (100%) |
| ------------- | ----------- | ---------------- | ----------------- |
| **CPU**       | 2 cores     | 4-8 cores        | 8-16 cores        |
| **RAM**       | 4 GB        | 8-16 GB          | 16-32 GB          |
| **Database**  | Shared      | 2 vCPU, 4GB RAM  | 4 vCPU, 8GB RAM   |
| **Redis**     | 256 MB      | 1-2 GB           | 2-4 GB            |
| **Storage**   | 10 GB       | 50 GB            | 100-200 GB        |
| **Bandwidth** | 100 GB/mo   | 500 GB/mo        | 1-5 TB/mo         |

### Cost Estimates (Monthly)

#### Railway.app

- **Development**: ~$20-30/month
  - Hobby plan: $5/month
  - PostgreSQL: $5-10/month
  - Redis: $5/month
- **Production (50% limits)**: ~$75-150/month
  - Pro plan: $20/month base
  - PostgreSQL (4GB): $25-50/month
  - Redis (2GB): $15-25/month
  - API compute: $15-50/month
- **Production (100% limits)**: ~$200-500/month
  - Pro plan: $20/month base
  - PostgreSQL (8GB): $75-150/month
  - Redis (4GB): $35-75/month
  - API compute: $70-250/month

#### Fly.io

- **Development**: ~$15-25/month
- **Production (50%)**: ~$50-100/month
- **Production (100%)**: ~$150-350/month

#### Vercel (Web only)

- **Development**: Free
- **Production**: $20/month (Pro plan)

### AI Provider Costs (Important!)

With 1,000 AI requests/minute:

- **OpenAI GPT-4**: ~$0.03 per request × 60,000/hour = **$1,800/hour** ⚠️
- **OpenAI GPT-3.5**: ~$0.002 per request × 60,000/hour = **$120/hour**
- **Anthropic Claude**: ~$0.015 per request × 60,000/hour = **$900/hour**
- **Synthetic (free)**: $0

**Recommendation**: Use aggressive rate limiting on AI endpoints or implement
token-based quotas.

## Scaling Strategy

### Phase 1: Development/Testing (Current - 100% unlocked)

- Test with synthetic AI provider (free)
- Validate all features work
- Run load tests
- Cost: ~$20-50/month

### Phase 2: Soft Launch (Recommended: 25% limits)

```bash
RATE_LIMIT_GENERAL_MAX=2500
RATE_LIMIT_AI_MAX=250
WORKER_CONCURRENCY_DISPATCH=50
```

- Monitor actual usage
- Identify bottlenecks
- Cost: ~$50-100/month

### Phase 3: Production (Recommended: 50% limits)

```bash
RATE_LIMIT_GENERAL_MAX=5000
RATE_LIMIT_AI_MAX=500
WORKER_CONCURRENCY_DISPATCH=100
```

- Scale based on metrics
- Cost: ~$150-300/month

### Phase 4: High Load (Use 100% only when needed)

- Enable based on actual traffic
- Monitor costs closely
- Cost: ~$200-500+/month (excluding AI)

## Monitoring Costs

Keep costs under control by monitoring:

1. **AI API usage** - Set daily spend limits with providers
2. **Database connections** - Watch for connection leaks
3. **Redis memory** - Implement eviction policies
4. **Worker jobs** - Monitor for infinite loops
5. **File storage** - Implement retention policies

## Cost Optimization Tips

1. **Use Synthetic AI in Dev**: Save thousands on GPT-4 calls
2. **Implement Caching**: Cache AI responses for 5-15 minutes
3. **Batch Operations**: Process multiple requests together
4. **Compress Files**: Enable gzip compression for uploads
5. **CDN for Static Assets**: Reduce bandwidth costs
6. **Database Query Optimization**: Reduce connection time
7. **Implement Quotas**: Per-user/org rate limits
8. **Auto-scaling**: Scale down during off-hours

## Budget Alerts

Set up billing alerts:

- 50% of budget: Warning
- 75% of budget: Alert team
- 90% of budget: Throttle non-critical services
- 100% of budget: Emergency shutdown of expensive features

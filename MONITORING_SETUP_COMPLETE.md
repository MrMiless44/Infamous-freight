# Monitoring Stack Setup Guide - 100% Complete

## Overview

Comprehensive monitoring stack for Infamous Freight Enterprises with Prometheus, Grafana, AlertManager, and Node Exporter.

## Prerequisites

- Docker & Docker Compose installed
- `.env` file with appropriate secrets configured
- Ports available: 9090 (Prometheus), 3000 (Grafana), 9093 (AlertManager), 9100 (Node Exporter)

## Quick Start

### 1. Start Monitoring Stack

```bash
# Start with monitoring profile
docker-compose --profile monitoring up -d

# Or specific services
docker-compose up -d prometheus grafana alertmanager node-exporter
```

### 2. Access Services

- **Grafana**: http://localhost:3000 (admin/admin)
- **Prometheus**: http://localhost:9090
- **AlertManager**: http://localhost:9093

## Configuration Files

### Prometheus (`monitoring/prometheus.yml`)

Scrapes metrics from:
- Node Exporter (system metrics): `http://node-exporter:9100/metrics`
- API health endpoint: `http://api:4000/api/health`
- PostgreSQL exporter (if enabled)

**Retention**: 15 days
**Scrape interval**: 15s
**Evaluation interval**: 15s

### AlertManager (`monitoring/alerts.yml`)

Alert rules for:
- High CPU usage (>80%)
- High memory usage (>85%)
- Database connection pool exhaustion
- API error rates (>5%)
- Response time degradation (p95 >2s)

### Grafana Dashboards

Pre-configured dashboards available in `monitoring/grafana/dashboards/`:

1. **System Metrics** (`system-metrics.json`)
   - CPU usage breakdown (user/system/steal)
   - Memory utilization
   - File descriptors
   - Load average

2. **API Metrics** (`api-metrics.json`)
   - HTTP request rates (req/s)
   - Success rate (%)
   - Response time distribution (p50/p95/p99)
   - Error rate breakdown by status code

3. **Database Metrics** (`database-metrics.json`)
   - Active PostgreSQL connections
   - Live row counts
   - Query performance (seq scans vs index scans)
   - Query latency (p95)

4. **Marketplace Queue Metrics** (`marketplace-metrics.json`)
   - Job throughput (completed/failed)
   - Queue backlog (pending jobs)
   - Job processing latency distribution
   - Active worker count

## Importing Dashboards

### Manual Import (GUI)

1. Open Grafana: http://localhost:3000
2. Login with default credentials (admin/admin)
3. Click **+** → **Import dashboard**
4. Choose **Upload dashboard JSON file**
5. Select dashboard from `monitoring/grafana/dashboards/`
6. Select **Prometheus** as datasource
7. Click **Import**

### Automated Import (Provisioning)

Dashboards are auto-provisioned via `monitoring/grafana/provisioning/dashboards/`:

```yaml
apiVersion: 1
providers:
  - name: 'Dashboard Provider'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    options:
      path: /etc/grafana/provisioning/dashboards
```

## Health Checks

### API Health

```bash
# Basic health check
curl http://localhost:4000/api/health

# Detailed health check
curl http://localhost:4000/api/health/detailed
```

### Database Health

```bash
# Check PostgreSQL
docker-compose exec postgres pg_isready -U ${POSTGRES_USER}

# Check Redis
docker-compose exec redis redis-cli ping
```

### Prometheus Scraping Status

1. Visit http://localhost:9090/targets
2. Verify all targets show "UP" status
3. Check **Last Scrape** time is recent (<30s)
4. Review **Scrape Duration** for performance

## Alerting Configuration

### Alert Channels

Configure in `monitoring/alertmanager.yml`:

```yaml
global:
  resolve_timeout: 5m

route:
  receiver: 'default'
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h

receivers:
  - name: 'default'
    # Add integrations: email, Slack, PagerDuty, etc.
```

### Recommended Alert Rules

```yaml
groups:
  - name: api
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, http_request_duration_ms) > 2000
        for: 5m
```

## Troubleshooting

### Prometheus not scraping metrics

1. Check Prometheus logs: `docker-compose logs prometheus`
2. Verify service DNS resolution: `docker-compose exec prometheus nslookup api`
3. Verify firewall rules between containers
4. Check target health at http://localhost:9090/targets

### Grafana dashboards show no data

1. Verify Prometheus datasource is configured: http://localhost:3000/datasources
2. Test datasource connection: Click **Save & Test**
3. Check metric names in Prometheus UI: http://localhost:9090/graph
4. Verify scrape interval matches dashboard time range

### High memory usage in Prometheus

1. Increase retention period in `prometheus.yml`:
   ```yaml
   global:
     retention: 7d  # Default 15d, reduce if needed
   ```
2. Reduce scrape frequency: `scrape_interval: 30s` (default 15s)
3. Restart: `docker-compose restart prometheus`

## Performance Tuning

### Prometheus Resource Limits

```yaml
prometheus:
  environment:
    - --storage.tsdb.max-block-duration=31d
    - --storage.tsdb.min-block-duration=2h
    - --storage.tsdb.retention.size=50GB
```

### Grafana Optimization

```yaml
grafana:
  environment:
    - GF_SERVER_MAX_OPEN_FILES=5000
    - GF_USERS_AUTO_ASSIGN_ORG_ROLE=Admin
```

## Production Deployment

### High Availability Setup

```yaml
prometheus:
  - replica-1: Primary scraper
  - replica-2: Secondary scraper (federation)
  
grafana:
  - HA with shared database
  
alertmanager:
  - Cluster for distributed alerting
```

### Backup & Recovery

```bash
# Backup Grafana data
docker-compose exec grafana tar czf /tmp/grafana-backup.tar.gz /var/lib/grafana

# Backup Prometheus data
docker-compose exec prometheus tar czf /tmp/prometheus-backup.tar.gz /prometheus
```

## Monitoring Checklist

✅ Prometheus scraping all targets
✅ Grafana dashboards displaying metrics
✅ AlertManager configured and receiving alerts
✅ Health checks passing for all services
✅ Database connectivity verified
✅ API responding to requests
✅ Worker processes running correctly
✅ Rate limits enforced appropriately
✅ Error rates within acceptable range
✅ Response times meeting SLAs

## Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/grafana/latest/)
- [AlertManager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)
- [Node Exporter Metrics Reference](https://github.com/prometheus/node_exporter)

## Support

For issues or questions:
1. Check service logs: `docker-compose logs -f [service]`
2. Review configuration files in `monitoring/`
3. Verify all services are healthy: `docker-compose ps`
4. Test connectivity between containers: `docker-compose exec [service] ping [target]`

---

**Last Updated**: January 2025
**Status**: ✅ Production Ready

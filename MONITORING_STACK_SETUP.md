# Monitoring Stack Setup Guide

## Complete Guide to Prometheus + Grafana for Infamous Freight

Comprehensive setup for full infrastructure monitoring with metrics, dashboards, and alerting.

---

## Quick Start

```bash
# Start monitoring stack
docker-compose --profile monitoring up -d

# Access services
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3001 (admin/admin)
# Node Exporter metrics: http://localhost:9100/metrics
```

---

## Architecture

```
┌─────────────────────────────────────────┐
│       Data Collection Layer             │
├─────────────────────────────────────────┤
│ • Node Exporter (system metrics)        │
│ • PostgreSQL Exporter (DB metrics)      │
│ • API /api/metrics endpoint             │
│ • Redis (built-in metrics)              │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│    Prometheus (Time-series DB)          │
│    - Scrapes metrics every 15s          │
│    - Stores 15 days retention           │
│    - Evaluates alert rules              │
└────────────┬────────────────────────────┘
             │
    ┌────────┴────────┐
    ▼                 ▼
┌─────────────┐  ┌──────────────┐
│  Grafana    │  │  AlertManager│
│  Dashboards │  │  (Optional)  │
└─────────────┘  └──────────────┘
```

---

## Part 1: Prometheus Configuration

### What is Prometheus?

Time-series database for metrics:

- Collects metrics from exporters
- Stores metric history
- Evaluates alert rules
- Provides query API

### Configuration File

**Location**: `monitoring/prometheus.yml`

```yaml
global:
  scrape_interval: 15s # How often to collect metrics
  evaluation_interval: 15s # How often to evaluate alerts

scrape_configs:
  - job_name: "api"
    static_configs:
      - targets: ["api:4000"] # API server metrics
    metrics_path: "/api/metrics"
    scrape_interval: 30s # Less frequent for API

  - job_name: "postgres"
    static_configs:
      - targets: ["postgres-exporter:9187"]

  - job_name: "node"
    static_configs:
      - targets: ["node-exporter:9100"]
```

### Common Scrape Jobs

| Job            | Exporter          | Port | Metrics                        |
| -------------- | ----------------- | ---- | ------------------------------ |
| **api**        | Built-in          | 4000 | HTTP requests, errors, latency |
| **postgres**   | postgres-exporter | 9187 | Connections, query time, cache |
| **redis**      | Redis native      | 6379 | Memory, commands, operations   |
| **node**       | node-exporter     | 9100 | CPU, disk, network, system     |
| **prometheus** | Prometheus self   | 9090 | Scrape performance, targets    |

---

## Part 2: Grafana Dashboards

### Accessing Grafana

```
URL: http://localhost:3001
Username: admin
Password: admin  (change this!)
```

### Dashboard 1: API Performance

**Create → Dashboard → Add Panel**

**Query 1: Request Rate**

```promql
rate(http_requests_total[5m])
```

- Visualization: Graph
- Title: "Request Rate (req/sec)"

**Query 2: Error Rate**

```promql
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])
```

- Visualization: Gauge
- Title: "Error Rate %"

**Query 3: Response Time (P95)**

```promql
histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m]))
```

- Visualization: Graph
- Title: "P95 Response Time (ms)"

### Dashboard 2: Database Health

**Query 1: Active Connections**

```promql
pg_stat_activity_count
```

**Query 2: Query Latency**

```promql
rate(pg_stat_statements_mean_exec_time[5m])
```

**Query 3: Cache Hit Ratio**

```promql
rate(pg_stat_io_heap_blks_hit[5m]) / (rate(pg_stat_io_heap_blks_hit[5m]) + rate(pg_stat_io_heap_blks_read[5m]))
```

### Dashboard 3: System Resources

**Query 1: CPU Usage**

```promql
100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
```

**Query 2: Memory Usage**

```promql
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100
```

**Query 3: Disk Usage**

```promql
(1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100
```

---

## Part 3: Alerting

### Define Alert Rules

**File**: `monitoring/prometheus-alerts.yml`

```yaml
groups:
  - name: infamous-alerts
    interval: 30s
    rules:
      # API Alerts
      - alert: HighAPIErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.01
        for: 5m
        annotations:
          summary: "High API error rate (> 1%)"
          description: "{{ $value | humanizePercentage }}"

      - alert: SlowAPIResponse
        expr: histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m])) > 5000
        for: 5m
        annotations:
          summary: "API responses slow (> 5s)"

      # Database Alerts
      - alert: HighDatabaseLoad
        expr: pg_stat_activity_count > 80
        for: 5m
        annotations:
          summary: "Database connection pool near limit"

      - alert: DatabaseDown
        expr: pg_up == 0
        for: 1m
        annotations:
          summary: "PostgreSQL is down"

      # System Alerts
      - alert: HighCPUUsage
        expr: (100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)) > 80
        for: 10m
        annotations:
          summary: "CPU usage > 80%"

      - alert: HighMemoryUsage
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 85
        for: 5m
        annotations:
          summary: "Memory usage > 85%"

      - alert: DiskSpaceLow
        expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100 < 15
        for: 5m
        annotations:
          summary: "Disk space < 15% remaining"

      # Service Availability
      - alert: ServiceDown
        expr: up == 0
        for: 2m
        annotations:
          summary: "{{ $labels.job }} service is down"
```

### Setup AlertManager (Optional)

1. Create AlertManager config:

```yaml
# alertmanager.yml
global:
  resolve_timeout: 5m

route:
  receiver: "default"
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h

receivers:
  - name: "default"
    # Add notification channels:
    # - email_configs
    # - slack_configs
    # - pagerduty_configs
    # - webhook_configs
```

2. Configure in docker-compose:

```yaml
alertmanager:
  image: prom/alertmanager:latest
  ports:
    - "9093:9093"
  volumes:
    - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml
```

---

## Part 4: Metrics Query Examples

### Common Prometheus Queries (PromQL)

#### Request Metrics

```promql
# Total requests
http_requests_total

# Requests per second
rate(http_requests_total[5m])

# Requests by status code
http_requests_total{status="200"}
http_requests_total{status=~"5.."}

# Requests by endpoint
http_requests_total{endpoint="/api/shipments"}
```

#### Performance Metrics

```promql
# Average response time
avg(http_request_duration_ms)

# P95 response time
histogram_quantile(0.95, http_request_duration_ms)

# P99 response time
histogram_quantile(0.99, http_request_duration_ms)

# Response time by endpoint
histogram_quantile(0.95, http_request_duration_ms) by (endpoint)
```

#### Error Metrics

```promql
# Error rate
rate(http_requests_total{status=~"5.."}[5m])

# Errors per minute
rate(http_requests_total{status=~"5.."}[1m]) * 60

# Most common error codes
topk(5, http_requests_total{status=~"5.."})
```

#### Database Metrics

```promql
# Active database connections
pg_stat_activity_count

# Slow queries (> 1 second)
pg_stat_statements_mean_exec_time{query !~ "idle"}

# Cache hit ratio
rate(pg_stat_io_heap_blks_hit) / (rate(pg_stat_io_heap_blks_hit) + rate(pg_stat_io_heap_blks_read))

# Replication lag (if applicable)
pg_replication_lag
```

#### System Metrics

```promql
# CPU usage %
100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory usage %
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# Disk usage %
(1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100

# Network I/O
rate(node_network_receive_bytes_total[5m])
rate(node_network_transmit_bytes_total[5m])
```

---

## Part 5: Exporter Setup

### Node Exporter (System Metrics)

```yaml
# In docker-compose.profiles.yml
node-exporter:
  image: prom/node-exporter:latest
  ports:
    - "9100:9100"
  command:
    - "--path.procfs=/host/proc"
    - "--path.sysfs=/host/sys"
    - "--collector.filesystem.mount-points-exclude=^/(sys|proc)"
```

### PostgreSQL Exporter

```yaml
postgres-exporter:
  image: prometheuscommunity/postgres-exporter:latest
  environment:
    DATA_SOURCE_NAME: postgresql://postgres:password@postgres:5432/infamous_freight
  ports:
    - "9187:9187"
  depends_on:
    - postgres
```

### Redis Monitoring (Built-in)

Redis provides native Prometheus metrics:

```
# Query Redis metrics
redis_memory_used_bytes
redis_connected_clients
redis_commands_processed_total
```

### API Metrics Endpoint

Add to your API:

```javascript
// api/src/routes/metrics.js
router.get("/metrics", (req, res) => {
  // Export Prometheus metrics
  res.set("Content-Type", "text/plain");
  res.send(getMetricsRegistry().metrics());
});
```

---

## Part 6: Dashboard Templates

### Import Pre-built Dashboards

Grafana has a library of pre-built dashboards:

1. Go to Grafana → Dashboards → Import
2. Enter ID or upload JSON:
   - **Node Exporter**: ID `1860`
   - **PostgreSQL**: ID `9628`
   - **Redis**: ID `763`

---

## Part 7: Data Retention

### Prometheus Retention

```yaml
# In docker-compose.profiles.yml
prometheus:
  command:
    - "--storage.tsdb.path=/prometheus"
    - "--storage.tsdb.retention.time=15d" # Keep 15 days
    - "--storage.tsdb.retention.size=50GB" # Or 50GB max
```

### Grafana Retention

Grafana stores dashboards in its database (persistent volume):

```yaml
volumes:
  - grafana_data:/var/lib/grafana
```

---

## Part 8: Troubleshooting

### Prometheus Not Scraping

```bash
# Check Prometheus status
curl http://localhost:9090/api/v1/targets

# Should show all exporters as "UP"
# If DOWN, check network connectivity

# Test scrape URL directly
curl http://api:4000/api/metrics
curl http://postgres-exporter:9187/metrics
```

### High Memory Usage

```bash
# Reduce retention
# In docker-compose.profiles.yml, lower:
--storage.tsdb.retention.time=7d    # Down from 15d
--storage.tsdb.retention.size=25GB  # Down from 50GB

# Or increase Prometheus memory limit
deploy:
  resources:
    limits:
      memory: 2G  # Up from 1G
```

### Missing Metrics

```bash
# Check if exporter is running
docker-compose ps postgres-exporter

# Verify exporter is healthy
curl http://postgres-exporter:9187/metrics | head -20

# Check Prometheus scrape frequency
# Metrics appear after first scrape (15s default)
```

---

## Part 9: Maintenance

### Weekly Tasks

- [ ] Check for failed scrapes in Prometheus targets
- [ ] Review alert rules for accuracy
- [ ] Check disk space for Prometheus data
- [ ] Verify backup of Grafana dashboards

### Monthly Tasks

- [ ] Review retention policies
- [ ] Update dashboard queries based on new metrics
- [ ] Test alert notifications (send test alert)
- [ ] Archive old metrics/logs

### Quarterly Tasks

- [ ] Upgrade Prometheus/Grafana to latest stable
- [ ] Review and update alert thresholds
- [ ] Plan for storage growth

---

## Part 10: Production Checklist

- [ ] Prometheus running with `--storage.tsdb.retention.time=30d`
- [ ] Grafana admin password changed from default
- [ ] SSL/TLS configured for Grafana access
- [ ] AlertManager configured with notification channels
- [ ] Grafana backups automated (database exports)
- [ ] Resource limits set on Prometheus container
- [ ] Metrics data stored on persistent volume
- [ ] Alert rules configured and tested
- [ ] Team trained on using dashboards
- [ ] On-call documentation with dashboard links

---

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Status**: ✅ Production Ready

**Quick Links**:

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/grafana/)
- [PromQL Examples](https://prometheus.io/docs/prometheus/latest/querying/examples/)
- [Alert Rules](https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/)

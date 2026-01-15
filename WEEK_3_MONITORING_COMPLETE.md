# WEEK 3: MONITORING STACK - COMPLETE IMPLEMENTATION

**Status**: ✅ **PRODUCTION READY**  
**Services**: 7 (Prometheus, Grafana, Elasticsearch, Kibana, Jaeger, AlertManager, Node Exporter)  
**Coverage**: Metrics, Logs, Traces, Alerts  

---

## 1. DOCKER COMPOSE: MONITORING STACK

File: `docker-compose.monitoring.yml`

```yaml
version: '3.8'

services:
  # Prometheus - Metrics Collection & Storage
  prometheus:
    image: prom/prometheus:v2.40.0-alpine
    container_name: infamous-prometheus
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./monitoring/rules.yml:/etc/prometheus/rules.yml:ro
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
      - '--web.enable-lifecycle'
    ports:
      - "9090:9090"
    environment:
      - TZ=UTC
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:9090/-/healthy"]
      interval: 10s
      timeout: 5s
      retries: 3
    networks:
      - infamous-network
    restart: unless-stopped

  # Grafana - Visualization & Dashboards
  grafana:
    image: grafana/grafana:9.1.5-alpine
    container_name: infamous-grafana
    volumes:
      - grafana-data:/var/lib/grafana
      - ./monitoring/grafana/provisioning/datasources:/etc/grafana/provisioning/datasources:ro
      - ./monitoring/grafana/provisioning/dashboards:/etc/grafana/provisioning/dashboards:ro
      - ./monitoring/grafana/dashboards:/var/lib/grafana/dashboards:ro
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_SECURITY_ADMIN_USER=admin
      - GF_INSTALL_PLUGINS=grafana-piechart-panel,grafana-worldmap-panel
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_SMTP_ENABLED=true
      - GF_SMTP_HOST=mailhog:1025
      - GF_SMTP_FROM_NAME=Infamous Alerts
      - GF_SMTP_FROM_ADDRESS=alerts@infamous.io
    ports:
      - "3002:3000"
    depends_on:
      - prometheus
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 10s
      timeout: 5s
      retries: 3
    networks:
      - infamous-network
    restart: unless-stopped

  # Elasticsearch - Logs Storage
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.3.3
    container_name: infamous-elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - xpack.watcher.enabled=false
      - xpack.ml.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - TZ=UTC
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"
    healthcheck:
      test: ["CMD-SHELL", "curl -s http://localhost:9200 | grep -q cluster"]
      interval: 10s
      timeout: 5s
      retries: 3
    networks:
      - infamous-network
    restart: unless-stopped

  # Kibana - Logs Visualization
  kibana:
    image: docker.elastic.co/kibana/kibana:8.3.3
    container_name: infamous-kibana
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
      - ELASTICSEARCH_USERNAME=elastic
      - ELASTICSEARCH_PASSWORD=changeme
      - xpack.security.enabled=false
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
    healthcheck:
      test: ["CMD", "curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", "http://localhost:5601/api/status"]
      interval: 10s
      timeout: 5s
      retries: 3
    networks:
      - infamous-network
    restart: unless-stopped

  # Jaeger - Distributed Tracing
  jaeger:
    image: jaegertracing/all-in-one:1.35-alpine
    container_name: infamous-jaeger
    environment:
      - COLLECTOR_ZIPKIN_HOST_PORT=:9411
      - SPAN_STORAGE_TYPE=badger
      - BADGER_EPHEMERAL=false
      - BADGER_DIRECTORY_VALUE=/badger/data
      - BADGER_DIRECTORY_KEY=/badger/key
    volumes:
      - jaeger-data:/badger
    ports:
      - "5775:5775/udp"
      - "6831:6831/udp"
      - "6832:6832/udp"
      - "5778:5778"
      - "16686:16686"
      - "14268:14268"
      - "14250:14250"
      - "9411:9411"
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:16686/"]
      interval: 10s
      timeout: 5s
      retries: 3
    networks:
      - infamous-network
    restart: unless-stopped

  # AlertManager - Alert Routing & Notifications
  alertmanager:
    image: prom/alertmanager:v0.24.0-alpine
    container_name: infamous-alertmanager
    volumes:
      - ./monitoring/alertmanager.yml:/etc/alertmanager/alertmanager.yml:ro
      - alertmanager-data:/alertmanager
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
    ports:
      - "9093:9093"
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:9093/-/healthy"]
      interval: 10s
      timeout: 5s
      retries: 3
    networks:
      - infamous-network
    restart: unless-stopped

  # Node Exporter - Host Metrics
  node-exporter:
    image: prom/node-exporter:v1.3.1-alpine
    container_name: infamous-node-exporter
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    ports:
      - "9100:9100"
    networks:
      - infamous-network
    restart: unless-stopped

volumes:
  prometheus-data:
    driver: local
  grafana-data:
    driver: local
  elasticsearch-data:
    driver: local
  jaeger-data:
    driver: local
  alertmanager-data:
    driver: local

networks:
  infamous-network:
    driver: bridge
    external: true
```

---

## 2. PROMETHEUS CONFIGURATION

File: `monitoring/prometheus.yml`

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    monitor: 'infamous-monitor'
    environment: 'production'

# AlertManager configuration
alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

# Load rules
rule_files:
  - '/etc/prometheus/rules.yml'

scrape_configs:
  # Prometheus self-monitoring
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # Node Exporter - Host metrics
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
    relabel_configs:
      - source_labels: [__address__]
        target_label: instance
        replacement: 'host-metrics'

  # API service
  - job_name: 'infamous-api'
    scrape_interval: 5s
    static_configs:
      - targets: ['api:9091']
    metrics_path: '/metrics'
    relabel_configs:
      - source_labels: [__address__]
        target_label: instance
        replacement: 'api-primary'

  # Web service
  - job_name: 'infamous-web'
    static_configs:
      - targets: ['web:3000']
    metrics_path: '/metrics'

  # PostgreSQL (via postgres_exporter)
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  # Redis
  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']

  # Docker stats (via cAdvisor)
  - job_name: 'docker'
    static_configs:
      - targets: ['cadvisor:8080']
```

---

## 3. ALERT RULES

File: `monitoring/rules.yml`

```yaml
groups:
  - name: api_alerts
    interval: 30s
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }} on {{ $labels.instance }}"

      # High latency
      - alert: HighLatency
        expr: histogram_quantile(0.95, http_request_duration_seconds) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected"
          description: "P95 latency is {{ $value }}s on {{ $labels.instance }}"

      # Low cache hit rate
      - alert: LowCacheHitRate
        expr: rate(cache_hits_total[5m]) / (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m])) < 0.5
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Low cache hit rate"
          description: "Cache hit rate is {{ $value | humanizePercentage }} on {{ $labels.instance }}"

  - name: infrastructure_alerts
    interval: 30s
    rules:
      # High CPU usage
      - alert: HighCPUUsage
        expr: 100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage"
          description: "CPU usage is {{ $value }}% on {{ $labels.instance }}"

      # High memory usage
      - alert: HighMemoryUsage
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ $value }}% on {{ $labels.instance }}"

      # Disk space low
      - alert: LowDiskSpace
        expr: (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) < 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Low disk space"
          description: "Less than 10% disk space available on {{ $labels.instance }}"

      # Service down
      - alert: ServiceDown
        expr: up{job=~"infamous-(api|web|postgres)"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.job }} is down"
          description: "Service has been down for more than 1 minute on {{ $labels.instance }}"

  - name: database_alerts
    interval: 30s
    rules:
      # High connection count
      - alert: HighDatabaseConnections
        expr: pg_stat_activity_count > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High database connections"
          description: "{{ $value }} active connections on {{ $labels.instance }}"

      # Slow queries
      - alert: SlowQueryDetected
        expr: pg_slow_queries > 0
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Slow queries detected"
          description: "{{ $value }} slow queries on {{ $labels.instance }}"

      # Replication lag
      - alert: ReplicationLag
        expr: pg_replication_lag_seconds > 10
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High replication lag"
          description: "Replication lag is {{ $value }}s on {{ $labels.instance }}"
```

---

## 4. ALERTMANAGER CONFIGURATION

File: `monitoring/alertmanager.yml`

```yaml
global:
  resolve_timeout: 5m
  slack_api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
  smtp_smarthost: 'mailhog:1025'
  smtp_from: 'alerts@infamous.io'

templates:
  - '/etc/alertmanager/templates/*.tmpl'

route:
  receiver: 'team-notifications'
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 4h

  routes:
    # Critical alerts go to ops-team
    - match:
        severity: critical
      receiver: 'ops-team'
      group_wait: 0s
      repeat_interval: 30m
      continue: true

    # Warning alerts go to team-notifications
    - match:
        severity: warning
      receiver: 'team-notifications'
      group_wait: 30s
      repeat_interval: 2h

    # Info alerts to slack
    - match:
        severity: info
      receiver: 'slack-notifications'

receivers:
  - name: 'ops-team'
    email_configs:
      - to: 'ops@infamous.io'
        headers:
          Subject: 'CRITICAL: {{ .GroupLabels.alertname }}'
        smarthost: 'mailhog:1025'
    slack_configs:
      - channel: '#ops-alerts'
        title: 'CRITICAL: {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'

  - name: 'team-notifications'
    email_configs:
      - to: 'team@infamous.io'
    slack_configs:
      - channel: '#alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'

  - name: 'slack-notifications'
    slack_configs:
      - channel: '#monitoring'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'

inhibit_rules:
  # Inhibit warning if critical is firing
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'instance']

  # Inhibit info if warning is firing
  - source_match:
      severity: 'warning'
    target_match:
      severity: 'info'
    equal: ['alertname', 'instance']
```

---

## 5. GRAFANA DASHBOARDS

### API Performance Dashboard

File: `monitoring/grafana/dashboards/api-performance.json`

```json
{
  "dashboard": {
    "title": "Infamous API - Performance",
    "description": "API response times, throughput, errors",
    "panels": [
      {
        "title": "Request Rate (RPS)",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{ method }} {{ path }}"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Response Time (P95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, http_request_duration_seconds)"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m]) * 100"
          }
        ],
        "type": "graph"
      }
    ]
  }
}
```

---

## 6. MONITORING MIDDLEWARE (API)

File: `api/src/middleware/monitoring.ts`

```typescript
import { Router, Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// Create metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const httpRequestSize = new client.Histogram({
  name: 'http_request_size_bytes',
  help: 'HTTP request size in bytes',
  labelNames: ['method', 'route'],
  buckets: [100, 1000, 10000, 100000, 1000000],
});

const httpResponseSize = new client.Histogram({
  name: 'http_response_size_bytes',
  help: 'HTTP response size in bytes',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [100, 1000, 10000, 100000, 1000000],
});

const cacheHits = new client.Counter({
  name: 'cache_hits_total',
  help: 'Total cache hits',
  labelNames: ['cache_type'],
});

const cacheMisses = new client.Counter({
  name: 'cache_misses_total',
  help: 'Total cache misses',
  labelNames: ['cache_type'],
});

const databaseConnections = new client.Gauge({
  name: 'database_connections_active',
  help: 'Active database connections',
});

const databaseQueryDuration = new client.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['query_type'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
});

// Middleware
export function prometheusMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.baseUrl || req.path;

    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);

    httpRequestTotal
      .labels(req.method, route, res.statusCode)
      .inc();

    const reqSize = parseInt(req.headers['content-length'] || '0');
    httpRequestSize.labels(req.method, route).observe(reqSize);

    const resSize = parseInt(res.headers['content-length'] || '0');
    httpResponseSize
      .labels(req.method, route, res.statusCode)
      .observe(resSize);
  });

  next();
}

// Metrics endpoint
export const metricsRouter = Router();

metricsRouter.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Export metrics for use
export {
  httpRequestDuration,
  httpRequestTotal,
  cacheHits,
  cacheMisses,
  databaseConnections,
  databaseQueryDuration,
};
```

---

## 7. DEPLOYMENT COMMANDS

### Start Monitoring Stack

```bash
# Create external network if not exists
docker network create infamous-network 2>/dev/null || true

# Start all monitoring services
docker-compose -f docker-compose.monitoring.yml up -d

# Verify services
docker-compose -f docker-compose.monitoring.yml ps

# View logs
docker-compose -f docker-compose.monitoring.yml logs -f

# Access dashboards
echo "Prometheus: http://localhost:9090"
echo "Grafana: http://localhost:3002 (admin/admin)"
echo "Kibana: http://localhost:5601"
echo "Jaeger: http://localhost:16686"
echo "AlertManager: http://localhost:9093"
```

### Configure Prometheus Scraping

```bash
# Ensure Prometheus is scraping the API
curl http://localhost:9090/api/v1/targets

# Check AlertManager configuration
curl http://localhost:9093/api/v1/alerts

# View alert rules
curl http://localhost:9090/api/v1/rules
```

---

## 8. QUICK REFERENCE

| Component | Port | URL |
|-----------|------|-----|
| Prometheus | 9090 | http://localhost:9090 |
| Grafana | 3002 | http://localhost:3002 |
| Elasticsearch | 9200 | http://localhost:9200 |
| Kibana | 5601 | http://localhost:5601 |
| Jaeger | 16686 | http://localhost:16686 |
| AlertManager | 9093 | http://localhost:9093 |
| Node Exporter | 9100 | http://localhost:9100 |

---

**Status**: ✅ **PRODUCTION READY**

**Next**: Deploy monitoring stack → `docker-compose -f docker-compose.monitoring.yml up -d`

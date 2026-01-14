# Monitoring & Observability Setup

## Metrics Collection

### Option 1: Prometheus + Grafana

**1. Add Prometheus to docker-compose:**

```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"
    command:
      - "--config.file=/etc/prometheus/prometheus.yml"
      - "--storage.tsdb.path=/prometheus"

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
    depends_on:
      - prometheus

volumes:
  prometheus-data:
  grafana-data:
```

**2. Create prometheus.yml:**

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: "api"
    static_configs:
      - targets: ["api:4000"]
    metrics_path: "/api/metrics"
```

### Option 2: Datadog

**1. Install DD agent:**

```bash
docker run -d --name dd-agent \
  -e DD_API_KEY=<your-api-key> \
  -e DD_LOGS_ENABLED=true \
  -e DD_PROCESS_AGENT_ENABLED=true \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -v /proc/:/host/proc/:ro \
  -v /sys/fs/cgroup/:/host/sys/fs/cgroup:ro \
  datadog/agent:latest
```

**2. Add labels to services:**

```yaml
services:
  api:
    labels:
      - 'com.datadoghq.ad.check_names=["node"]'
      - "com.datadoghq.ad.init_configs=[{}]"
      - 'com.datadoghq.ad.instances=[{"host":"%%host%%","port":4000}]'
```

## Logging

### Centralized Logging with ELK Stack

```yaml
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch

volumes:
  elasticsearch-data:
```

### Simple File-based Logging

```yaml
services:
  api:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        labels: "production,api"
```

## Alerting

### Prometheus Alertmanager

**1. Add to docker-compose:**

```yaml
services:
  alertmanager:
    image: prom/alertmanager:latest
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml
    command:
      - "--config.file=/etc/alertmanager/alertmanager.yml"
```

**2. Create alertmanager.yml:**

```yaml
global:
  slack_api_url: "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

route:
  receiver: "slack-notifications"
  group_by: ["alertname"]
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h

receivers:
  - name: "slack-notifications"
    slack_configs:
      - channel: "#alerts"
        text: "Summary: {{ .CommonAnnotations.summary }}"
        title: "{{ .CommonLabels.alertname }}"
```

**3. Add alert rules to prometheus.yml:**

```yaml
rule_files:
  - "alerts.yml"

# alerts.yml
groups:
  - name: api_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"

      - alert: HighResponseTime
        expr: http_request_duration_seconds{quantile="0.95"} > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
```

## Health Checks

### Uptime Monitoring

**UptimeRobot (Free):**

1. Sign up at https://uptimerobot.com
2. Add HTTP(S) monitor for https://api.yourdomain.com/api/health
3. Set interval to 5 minutes
4. Configure alerts (email, SMS, Slack)

**Healthchecks.io:**

```bash
# Add to cron
*/5 * * * * curl https://hc-ping.com/your-uuid
```

## Performance Monitoring

### Application Performance Monitoring (APM)

**New Relic:**

```javascript
// Add to api/production-server.js
require("newrelic");

// newrelic.js
exports.config = {
  app_name: ["Infamous Freight API"],
  license_key: "your-license-key",
  logging: { level: "info" },
};
```

**Sentry:**

```javascript
// Already configured in errorHandler.js
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

## Dashboard Examples

### Grafana Dashboard JSON

```json
{
  "dashboard": {
    "title": "Infamous Freight API",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [{ "expr": "rate(http_requests_total[5m])" }]
      },
      {
        "title": "Error Rate",
        "targets": [
          { "expr": "rate(http_requests_total{status=~\"5..\"}[5m])" }
        ]
      },
      {
        "title": "Response Time P95",
        "targets": [
          { "expr": "histogram_quantile(0.95, http_request_duration_seconds)" }
        ]
      }
    ]
  }
}
```

## Recommended Monitoring Stack

**Small Scale (<1000 req/min):**

- Uptime monitoring: UptimeRobot (free)
- Logging: Docker logs + file rotation
- Metrics: None required
- APM: Sentry free tier

**Medium Scale (<10,000 req/min):**

- Uptime: Healthchecks.io
- Logging: Papertrail or Logtail
- Metrics: Prometheus + Grafana
- APM: New Relic or Datadog

**Large Scale (>10,000 req/min):**

- Full ELK stack
- Prometheus + Grafana + Alertmanager
- Datadog APM
- PagerDuty for alerting
- Custom dashboards

---

For implementation help, see [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

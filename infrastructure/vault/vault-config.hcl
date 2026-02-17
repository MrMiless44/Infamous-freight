ui = true
log_level = "info"
log_format = "json"

api_addr = "http://0.0.0.0:8200"
cluster_addr = "https://0.0.0.0:8201"
disable_cache = false

storage "file" {
  path = "/vault/data"
}

# For production, use Raft storage
# storage "raft" {
#   path = "/vault/data"
#   node_id = "vault_1"
#   ha_storage_redirect_addr = "https://vault:8200"
#   ha_storage "consul" {
#     address = "consul:8500"
#     path = "vault"
#   }
# }

# High Availability
# ha_storage "consul" {
#   address = "consul:8500"
#   path = "vault/"
#   disable_registration = false
#   service = "vault"
#   service_tags = "active"
#   service_address = "https://vault:8200"
# }

listener "tcp" {
  address       = "0.0.0.0:8200"
  tls_cert_file = "/vault/config/vault.crt"
  tls_key_file  = "/vault/config/vault.key"

  # Telemetry
  telemetry {
    prometheus_retention_time = "30s"
    disable_hostname = false
  }
}

listener "unix" {
  address = "/tmp/vault.sock"
  tls_disable = true
}

# Telemetry
telemetry {
  prometheus_retention_time = "30s"
  disable_hostname = false
  usage_gauge_period = "10m"
  maximum_display_length = 200
}

# Default lease duration as well as max lease duration for auth methods
default_lease_duration = "168h"
max_lease_duration = "720h"

# Service registration for auto-unsealing and replication
# service_registration "consul" {
#   address = "consul:8500"
# }

# Disable memory lock on Docker
disable_mlock = true

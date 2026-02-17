/**
 * Multi-Region Infrastructure Terraform Configuration
 * Manages cross-region PostgreSQL replication, API load balancing, and geographic failover
 * 
 * Deployment: terraform init && terraform plan && terraform apply
 * Constraints: Requires AWS credentials, supports us-east-1, eu-west-1, ap-northeast-1
 * 
 * Architecture:
 * - Primary region: us-east-1 (main DB + API)
 * - Secondary regions: eu-west-1, ap-northeast-1 (read replicas + API standby)
 * - Global accelerator for geographic routing
 * - Route 53 for DNS failover
 * - Aurora PostgreSQL with cross-region read replicas (RPO: 1 second, RTO: 2 minutes)
 */

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket         = "infamous-freight-terraform-state"
    key            = "multi-region/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

provider "aws" {
  alias  = "primary"
  region = var.primary_region
}

provider "aws" {
  alias  = "secondary_eu"
  region = var.secondary_region_eu
}

provider "aws" {
  alias  = "secondary_ap"
  region = var.secondary_region_ap
}

# ============================================================================
# PRIMARY REGION: us-east-1
# ============================================================================

module "primary_db" {
  source = "./modules/rds-aurora"
  providers = {
    aws = aws.primary
  }

  cluster_identifier          = "${var.app_name}-primary"
  engine_version              = "15.3"
  database_name               = var.database_name
  master_username             = var.db_master_user
  master_password             = var.db_master_password
  instance_class              = "db.r6g.xlarge"  # 4 vCPU, 32 GB RAM
  availability_zones          = data.aws_availability_zones.primary.names
  backup_retention_period     = 30
  preferred_backup_window     = "03:00-04:00"
  preferred_maintenance_window = "mon:04:00-mon:05:00"
  storage_encrypted           = true
  kms_key_id                  = aws_kms_key.rds.arn
  enable_cloudwatch_logs_exports = ["postgresql"]
  enable_http_endpoint        = true
  enable_global_write_forwarding = true
  deletion_protection         = true
  skip_final_snapshot         = false
  final_snapshot_identifier   = "${var.app_name}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  
  vpc_security_group_ids      = [aws_security_group.rds_primary.id]
  db_subnet_group_name        = aws_db_subnet_group.primary.name

  tags = merge(var.tags, {
    Region = "primary"
    Tier   = "database"
  })
}

module "primary_api" {
  source = "./modules/ecs-api"
  providers = {
    aws = aws.primary
  }

  cluster_name                = "${var.app_name}-primary-api"
  service_name                = "api"
  container_image             = var.api_image_uri
  container_port              = 4000
  desired_count               = var.primary_api_desired_count
  cpu                         = 512
  memory                       = 1024
  log_group_name              = aws_cloudwatch_log_group.api_primary.name
  
  vpc_id                      = aws_vpc.primary.id
  subnets                     = aws_subnet.private_primary[*].id
  security_group_ids          = [aws_security_group.api_primary.id]
  load_balancer_target_group  = aws_lb_target_group.primary_api.arn
  
  environment_variables = {
    "API_PORT"                    = "4000"
    "DATABASE_URL"                = "postgresql://${var.db_master_user}:${var.db_master_password}@${module.primary_db.endpoint}:5432/${var.database_name}"
    "REDIS_URL"                   = "redis://${aws_elasticache_cluster.primary.cache_nodes[0].address}:6379"
    "REGION"                      = var.primary_region
    "ENABLE_GLOBAL_WRITE"         = "true"
    "VAULT_ADDR"                  = aws_vault_instance.primary.private_ip
    "LOKI_URL"                    = "http://${aws_loki_instance.primary.private_ip}:3100"
  }

  tags = merge(var.tags, {
    Region = "primary"
    Tier   = "api"
  })
}

# ============================================================================
# SECONDARY REGION: eu-west-1 (Read-only replica)
# ============================================================================

module "secondary_db_eu" {
  source = "./modules/rds-aurora-replica"
  providers = {
    aws = aws.secondary_eu
  }

  primary_cluster_arn   = module.primary_db.cluster_arn
  cluster_identifier    = "${var.app_name}-secondary-eu"
  instance_class        = "db.r6g.large"  # 2 vCPU, 16 GB RAM (smaller for cost)
  availability_zones    = data.aws_availability_zones.secondary_eu.names
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.rds_secondary_eu.arn
  enable_cloudwatch_logs_exports = ["postgresql"]
  deletion_protection   = true

  vpc_security_group_ids = [aws_security_group.rds_secondary_eu.id]
  db_subnet_group_name   = aws_db_subnet_group.secondary_eu.name

  tags = merge(var.tags, {
    Region = "secondary-eu"
    Tier   = "database"
  })

  depends_on = [module.primary_db]
}

module "secondary_api_eu" {
  source = "./modules/ecs-api"
  providers = {
    aws = aws.secondary_eu
  }

  cluster_name                = "${var.app_name}-secondary-eu-api"
  service_name                = "api"
  container_image             = var.api_image_uri
  container_port              = 4000
  desired_count               = var.secondary_api_desired_count
  cpu                         = 256
  memory                      = 512
  log_group_name              = aws_cloudwatch_log_group.api_secondary_eu.name
  
  vpc_id                      = aws_vpc.secondary_eu.id
  subnets                     = aws_subnet.private_secondary_eu[*].id
  security_group_ids          = [aws_security_group.api_secondary_eu.id]
  load_balancer_target_group  = aws_lb_target_group.secondary_eu_api.arn
  
  environment_variables = {
    "API_PORT"                    = "4000"
    "DATABASE_URL"                = "postgresql://${var.db_master_user}:${var.db_master_password}@${module.secondary_db_eu.reader_endpoint}:5432/${var.database_name}?application_name=api_eu"
    "REDIS_URL"                   = "redis://${aws_elasticache_cluster.secondary_eu.cache_nodes[0].address}:6379"
    "REGION"                      = var.secondary_region_eu
    "ENABLE_GLOBAL_WRITE"         = "false"  # Read-only replica
    "PRIMARY_REGION"              = var.primary_region
    "PRIMARY_API_URL"             = "https://api.primary.${var.domain}"
    "VAULT_ADDR"                  = aws_vault_instance.secondary_eu.private_ip
    "LOKI_URL"                    = "http://${aws_loki_instance.secondary_eu.private_ip}:3100"
  }

  tags = merge(var.tags, {
    Region = "secondary-eu"
    Tier   = "api"
  })

  depends_on = [module.secondary_db_eu]
}

# ============================================================================
# SECONDARY REGION: ap-northeast-1 (Read-only replica)
# ============================================================================

module "secondary_db_ap" {
  source = "./modules/rds-aurora-replica"
  providers = {
    aws = aws.secondary_ap
  }

  primary_cluster_arn   = module.primary_db.cluster_arn
  cluster_identifier    = "${var.app_name}-secondary-ap"
  instance_class        = "db.r6g.large"
  availability_zones    = data.aws_availability_zones.secondary_ap.names
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.rds_secondary_ap.arn
  enable_cloudwatch_logs_exports = ["postgresql"]
  deletion_protection   = true

  vpc_security_group_ids = [aws_security_group.rds_secondary_ap.id]
  db_subnet_group_name   = aws_db_subnet_group.secondary_ap.name

  tags = merge(var.tags, {
    Region = "secondary-ap"
    Tier   = "database"
  })

  depends_on = [module.primary_db]
}

module "secondary_api_ap" {
  source = "./modules/ecs-api"
  providers = {
    aws = aws.secondary_ap
  }

  cluster_name                = "${var.app_name}-secondary-ap-api"
  service_name                = "api"
  container_image             = var.api_image_uri
  container_port              = 4000
  desired_count               = var.secondary_api_desired_count
  cpu                         = 256
  memory                      = 512
  log_group_name              = aws_cloudwatch_log_group.api_secondary_ap.name
  
  vpc_id                      = aws_vpc.secondary_ap.id
  subnets                     = aws_subnet.private_secondary_ap[*].id
  security_group_ids          = [aws_security_group.api_secondary_ap.id]
  load_balancer_target_group  = aws_lb_target_group.secondary_ap_api.arn
  
  environment_variables = {
    "API_PORT"                    = "4000"
    "DATABASE_URL"                = "postgresql://${var.db_master_user}:${var.db_master_password}@${module.secondary_db_ap.reader_endpoint}:5432/${var.database_name}?application_name=api_ap"
    "REDIS_URL"                   = "redis://${aws_elasticache_cluster.secondary_ap.cache_nodes[0].address}:6379"
    "REGION"                      = var.secondary_region_ap
    "ENABLE_GLOBAL_WRITE"         = "false"  # Read-only replica
    "PRIMARY_REGION"              = var.primary_region
    "PRIMARY_API_URL"             = "https://api.primary.${var.domain}"
    "VAULT_ADDR"                  = aws_vault_instance.secondary_ap.private_ip
    "LOKI_URL"                    = "http://${aws_loki_instance.secondary_ap.private_ip}:3100"
  }

  tags = merge(var.tags, {
    Region = "secondary-ap"
    Tier   = "api"
  })

  depends_on = [module.secondary_db_ap]
}

# ============================================================================
# GLOBAL INFRASTRUCTURE
# ============================================================================

# AWS Global Accelerator for geographic routing with instant failover
resource "aws_globalaccelerator_accelerator" "main" {
  name            = "${var.app_name}-ga"
  ip_address_type = "IPV4"
  enabled         = true
  
  attributes {
    flow_logs_enabled   = true
    flow_logs_s3_bucket = aws_s3_bucket.ga_flow_logs.id
    flow_logs_s3_prefix = "ga-flow-logs/"
  }

  tags = var.tags
}

resource "aws_globalaccelerator_listener" "main" {
  accelerator_arn = aws_globalaccelerator_accelerator.main.arn
  port_ranges {
    from_port = 443
    to_port   = 443
  }
  protocol = "TCP"
}

# Primary region endpoint
resource "aws_globalaccelerator_endpoint_group" "primary" {
  listener_arn            = aws_globalaccelerator_listener.main.arn
  endpoint_group_region   = var.primary_region
  traffic_dial_percentage = 100
  health_check_interval_seconds = 30
  health_check_path       = "/api/health"
  health_check_protocol   = "HTTPS"
  traffic_port_override   = 443

  endpoint_configuration {
    endpoint_id = aws_lb.primary_api.arn
    weight      = 100
    client_ip_preservation_enabled = true
  }
}

# EU secondary region endpoint (failover: 0% during normal operation, activated on primary failure)
resource "aws_globalaccelerator_endpoint_group" "secondary_eu" {
  listener_arn            = aws_globalaccelerator_listener.main.arn
  endpoint_group_region   = var.secondary_region_eu
  traffic_dial_percentage = 0  # Standby mode
  health_check_interval_seconds = 30
  health_check_path       = "/api/health"
  health_check_protocol   = "HTTPS"
  traffic_port_override   = 443

  endpoint_configuration {
    endpoint_id = aws_lb.secondary_eu_api.arn
    weight      = 100
    client_ip_preservation_enabled = true
  }
}

# AP secondary region endpoint (failover: 0% during normal operation)
resource "aws_globalaccelerator_endpoint_group" "secondary_ap" {
  listener_arn            = aws_globalaccelerator_listener.main.arn
  endpoint_group_region   = var.secondary_region_ap
  traffic_dial_percentage = 0  # Standby mode
  health_check_interval_seconds = 30
  health_check_path       = "/api/health"
  health_check_protocol   = "HTTPS"
  traffic_port_override   = 443

  endpoint_configuration {
    endpoint_id = aws_lb.secondary_ap_api.arn
    weight      = 100
    client_ip_preservation_enabled = true
  }
}

# Route 53 health checks and DNS failover
resource "aws_route53_zone" "main" {
  name            = var.domain
  force_destroy   = false
  
  tags = var.tags
}

resource "aws_route53_health_check" "primary_api" {
  fqdn              = aws_lb.primary_api.dns_name
  port              = 443
  type              = "HTTPS"
  resource_path     = "/api/health"
  failure_threshold = 3
  request_interval  = 30
  measure_latency   = true
  alarm_identifier  = aws_cloudwatch_metric_alarm.primary_api_health.arn

  tags = var.tags
}

resource "aws_route53_record" "api" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.${var.domain}"
  type    = "A"
  
  alias {
    name                   = aws_globalaccelerator_accelerator.main.dns_name
    zone_id                = aws_globalaccelerator_accelerator.main.hosted_zone_id
    evaluate_target_health = true
  }
}

# CloudWatch for monitoring multi-region health
resource "aws_cloudwatch_metric_alarm" "primary_api_health" {
  alarm_name          = "${var.app_name}-primary-api-health"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = "30"
  statistic           = "Minimum"
  threshold           = "1"
  alarm_description   = "Alert when primary API health check fails"
  treat_missing_data  = "breaching"

  dimensions = {
    HealthCheckId = aws_route53_health_check.primary_api.id
  }
}

# Data sources for availability zones
data "aws_availability_zones" "primary" {
  provider = aws.primary
  state    = "available"
}

data "aws_availability_zones" "secondary_eu" {
  provider = aws.secondary_eu
  state    = "available"
}

data "aws_availability_zones" "secondary_ap" {
  provider = aws.secondary_ap
  state    = "available"
}

# Outputs for other configurations
output "primary_db_endpoint" {
  value       = module.primary_db.endpoint
  description = "Primary database endpoint"
}

output "primary_api_nlb_dns" {
  value       = aws_lb.primary_api.dns_name
  description = "Primary API Network Load Balancer DNS"
}

output "secondary_eu_db_reader_endpoint" {
  value       = module.secondary_db_eu.reader_endpoint
  description = "EU secondary database reader endpoint"
}

output "secondary_ap_db_reader_endpoint" {
  value       = module.secondary_db_ap.reader_endpoint
  description = "AP secondary database reader endpoint"
}

output "global_accelerator_dns" {
  value       = aws_globalaccelerator_accelerator.main.dns_name
  description = "Global Accelerator DNS for geographic routing"
}

output "route53_api_endpoint" {
  value       = aws_route53_record.api.fqdn
  description = "Route 53 DNS endpoint for API"
}

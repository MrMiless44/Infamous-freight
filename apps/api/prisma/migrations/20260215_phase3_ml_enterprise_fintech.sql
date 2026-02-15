-- Phase 3 Database Migrations
-- ML, Enterprise, Fintech Integration

-- ML Load Preferences Table
CREATE TABLE IF NOT EXISTS ml_load_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  preferred_corridors TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  equipment_types TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  min_rate DECIMAL(10,2) NOT NULL DEFAULT 1500,
  max_miles DECIMAL(10,2) NOT NULL DEFAULT 1000,
  hazmat_certified BOOLEAN NOT NULL DEFAULT FALSE,
  preference_weight DECIMAL(3,2) NOT NULL DEFAULT 1.0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_driver_preferences UNIQUE(driver_id)
);

CREATE INDEX idx_ml_driver_preferences ON ml_load_preferences(driver_id);

-- Predictive Earnings Table
CREATE TABLE IF NOT EXISTS predictive_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  forecast_date DATE NOT NULL,
  predicted_daily DECIMAL(10,2) NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  actual_daily DECIMAL(10,2),
  accuracy DECIMAL(3,2),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_prediction UNIQUE(driver_id, forecast_date)
);

CREATE INDEX idx_predictive_earnings_driver ON predictive_earnings(driver_id);
CREATE INDEX idx_predictive_earnings_date ON predictive_earnings(forecast_date);

-- Geofence Alerts Table
CREATE TABLE IF NOT EXISTS geofence_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fence_id TEXT NOT NULL,
  fence_type VARCHAR(50) NOT NULL,
  fence_name VARCHAR(255),
  event VARCHAR(20) NOT NULL, -- 'enter' or 'exit'
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  distance DECIMAL(10,2) NOT NULL,
  load_id UUID REFERENCES shipments(id),
  triggered_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_geofence_alerts_driver ON geofence_alerts(driver_id);
CREATE INDEX idx_geofence_alerts_triggered ON geofence_alerts(triggered_at);

-- Biometric Keys Table
CREATE TABLE IF NOT EXISTS biometric_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_hash VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'fingerprint', 'face'
  setup_date TIMESTAMP NOT NULL,
  last_used TIMESTAMP,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_biometric UNIQUE(driver_id, type)
);

CREATE INDEX idx_biometric_keys_driver ON biometric_keys(driver_id);

-- B2B Shipper Table
CREATE TABLE IF NOT EXISTS shippers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  tier VARCHAR(50) NOT NULL DEFAULT 'basic', -- 'basic', 'pro', 'enterprise'
  api_key VARCHAR(255) UNIQUE,
  webhook_url VARCHAR(255),
  rate_limit_per_day INTEGER NOT NULL DEFAULT 100,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shippers_api_key ON shippers(api_key);
CREATE INDEX idx_shippers_tier ON shippers(tier);

-- Invoice Table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipper_id UUID NOT NULL REFERENCES shippers(id) ON DELETE CASCADE,
  load_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  due_date DATE NOT NULL,
  paid_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_invoice UNIQUE(load_id)
);

CREATE INDEX idx_invoices_shipper ON invoices(shipper_id);
CREATE INDEX idx_invoices_status ON invoices(status);

-- Early Payment Request Table
CREATE TABLE IF NOT EXISTS early_payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  original_amount DECIMAL(10,2) NOT NULL,
  factor_rate DECIMAL(5,4) NOT NULL,
  fee DECIMAL(10,2) NOT NULL,
  net_amount DECIMAL(10,2) NOT NULL,
  option_type VARCHAR(50) NOT NULL, -- 'standard', 'expedited', 'scheduled'
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  funding_date DATE NOT NULL,
  funded_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_early_pay UNIQUE(invoice_id)
);

CREATE INDEX idx_early_payments_driver ON early_payment_requests(driver_id);
CREATE INDEX idx_early_payments_status ON early_payment_requests(status);

-- Invoice Financing Request Table
CREATE TABLE IF NOT EXISTS invoice_financing_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invoice_ids TEXT NOT NULL, -- JSON array of IDs
  total_amount DECIMAL(10,2) NOT NULL,
  term VARCHAR(50) NOT NULL, -- 'biweekly', 'monthly', 'extended'
  apr DECIMAL(5,3) NOT NULL,
  number_of_payments INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_financing_driver ON invoice_financing_requests(driver_id);

-- Fuel Card Enrollment Table
CREATE TABLE IF NOT EXISTS fuel_card_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  discount DECIMAL(4,3) NOT NULL,
  card_number VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_fuel_card UNIQUE(driver_id, provider)
);

CREATE INDEX idx_fuel_cards_driver ON fuel_card_enrollments(driver_id);

-- Insurance Enrollment Table
CREATE TABLE IF NOT EXISTS insurance_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'liability', 'cargo', 'physical', 'comprehensive'
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  start_date DATE NOT NULL,
  end_date DATE,
  premium_monthly DECIMAL(10,2),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_insurance_driver ON insurance_enrollments(driver_id);

-- Webhook Subscriptions (for B2B shipper API)
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipper_id UUID NOT NULL REFERENCES shippers(id) ON DELETE CASCADE,
  url VARCHAR(255) NOT NULL,
  events TEXT NOT NULL, -- JSON array of event types
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhooks_shipper ON webhooks(shipper_id);

-- Compliance Records Table
CREATE TABLE IF NOT EXISTS compliance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  record_type VARCHAR(50) NOT NULL, -- 'fmcsa', 'safety_audit', 'hours', 'inspection'
  record_url VARCHAR(255),
  expiry_date DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'valid',
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_compliance_driver ON compliance_records(driver_id);
CREATE INDEX idx_compliance_expiry ON compliance_records(expiry_date);

-- Multi-Region Configuration Table
CREATE TABLE IF NOT EXISTS region_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_name VARCHAR(100) NOT NULL UNIQUE,
  primary_db_url VARCHAR(255) NOT NULL,
  failover_db_url VARCHAR(255),
  api_endpoint VARCHAR(255) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  health_check_interval INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_region_configs_primary ON region_configs(is_primary);

-- Region Health Status Table
CREATE TABLE IF NOT EXISTS region_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id UUID NOT NULL REFERENCES region_configs(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'healthy', -- 'healthy', 'degraded', 'down'
  last_check TIMESTAMP NOT NULL DEFAULT NOW(),
  response_time_ms INTEGER,
  error_count INTEGER NOT NULL DEFAULT 0,
  checked_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_region_health_status ON region_health(status);
CREATE INDEX idx_region_health_checked ON region_health(checked_at);

-- Drop redundant old tables if they exist (cleanup)
-- Note: Comment out if these don't exist
-- DROP TABLE IF EXISTS old_table_name CASCADE;

-- Create performance indexes
CREATE INDEX idx_ml_preferences_corridors ON ml_load_preferences USING GIN (preferred_corridors);
CREATE INDEX idx_early_payments_created ON early_payment_requests(created_at DESC);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_geofence_distance ON geofence_alerts(distance);

-- Analytics view for Phase 3
CREATE OR REPLACE VIEW phase3_analytics AS
SELECT
  COUNT(DISTINCT e.driver_id) as drivers_with_early_pay,
  COUNT(DISTINCT f.driver_id) as drivers_with_fuel_cards,
  COUNT(DISTINCT i.driver_id) as drivers_in_financing,
  COUNT(DISTINCT c.driver_id) as drivers_compliant,
  AVG(e.fee) as avg_early_pay_fee,
  AVG(CAST(f.discount AS NUMERIC)) as avg_fuel_discount
FROM early_payment_requests e
FULL OUTER JOIN fuel_card_enrollments f ON 1=1
FULL OUTER JOIN invoice_financing_requests i ON 1=1
FULL OUTER JOIN compliance_records c ON 1=1;

-- Add comments for documentation
COMMENT ON TABLE ml_load_preferences IS 'Stores ML load preferences and driver profiles for recommendations';
COMMENT ON TABLE predictive_earnings IS 'Time-series earnings predictions with confidence intervals';
COMMENT ON TABLE geofence_alerts IS 'Audit log of geofence entry/exit events';
COMMENT ON TABLE biometric_keys IS 'Encrypted biometric authentication keys';
COMMENT ON TABLE shippers IS 'B2B shipper accounts with tier-based access';
COMMENT ON TABLE early_payment_requests IS 'Early payment factor financing requests';
COMMENT ON TABLE region_configs IS 'Multi-region database failover configuration';

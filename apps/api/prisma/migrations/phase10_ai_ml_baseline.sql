-- Phase 10: AI/ML Services Database Schema
-- Migration: phase10_ai_ml_baseline
-- Date: 2026-02-16
-- Description: Database tables for fraud detection, demand forecasting, route optimization, and predictive maintenance

-- ======================
-- FRAUD DETECTION TABLES
-- ======================

-- Fraud check records
CREATE TABLE IF NOT EXISTS fraud_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_amount DECIMAL(10, 2) NOT NULL,
    risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    ml_score INTEGER NOT NULL,
    rule_score INTEGER NOT NULL,
    recommended_action VARCHAR(20) NOT NULL CHECK (recommended_action IN ('approve', 'review', 'challenge', 'block')),
    ip_address VARCHAR(45),
    device_fingerprint JSONB,
    location JSONB,
    factors JSONB,
    model_version VARCHAR(20) NOT NULL,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fraud_checks_user_id ON fraud_checks(user_id);
CREATE INDEX idx_fraud_checks_created_at ON fraud_checks(created_at);
CREATE INDEX idx_fraud_checks_risk_level ON fraud_checks(risk_level);
CREATE INDEX idx_fraud_checks_action ON fraud_checks(recommended_action);

-- ======================
-- DEMAND FORECASTING TABLES
-- ======================

-- Demand forecast records
CREATE TABLE IF NOT EXISTS demand_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region VARCHAR(100) NOT NULL,
    horizon VARCHAR(20) NOT NULL CHECK (horizon IN ('DAILY', 'WEEKLY', 'MONTHLY')),
    forecast_data JSONB NOT NULL,
    patterns_detected JSONB,
    models_used TEXT[],
    accuracy_estimate INTEGER CHECK (accuracy_estimate >= 0 AND accuracy_estimate <= 100),
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ NOT NULL,
    processing_time_ms INTEGER,
    CONSTRAINT valid_until_after_generated CHECK (valid_until > generated_at)
);

CREATE INDEX idx_demand_forecasts_region ON demand_forecasts(region);
CREATE INDEX idx_demand_forecasts_generated_at ON demand_forecasts(generated_at);
CREATE INDEX idx_demand_forecasts_valid_until ON demand_forecasts(valid_until);
CREATE INDEX idx_demand_forecasts_horizon ON demand_forecasts(horizon);

-- ======================
-- ROUTE OPTIMIZATION TABLES
-- ======================

-- Route optimization records
CREATE TABLE IF NOT EXISTS route_optimizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    algorithm VARCHAR(50) NOT NULL,
    vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('VAN', 'TRUCK', 'SEMI')),
    stops JSONB NOT NULL,
    optimized_order JSONB NOT NULL,
    total_distance DECIMAL(10, 2) NOT NULL,
    estimated_duration INTEGER NOT NULL, -- minutes
    estimated_fuel_cost DECIMAL(10, 2),
    actual_duration INTEGER, -- after completion
    actual_fuel_cost DECIMAL(10, 2),
    savings_achieved DECIMAL(10, 2),
    directions JSONB,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_route_optimizations_shipment_id ON route_optimizations(shipment_id);
CREATE INDEX idx_route_optimizations_driver_id ON route_optimizations(driver_id);
CREATE INDEX idx_route_optimizations_created_at ON route_optimizations(created_at);
CREATE INDEX idx_route_optimizations_algorithm ON route_optimizations(algorithm);

-- ======================
-- PREDICTIVE MAINTENANCE TABLES
-- ======================

-- Vehicle fleet table (if not exists)
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_number VARCHAR(50) UNIQUE NOT NULL,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL,
    vin VARCHAR(17) UNIQUE,
    license_plate VARCHAR(20),
    vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('VAN', 'TRUCK', 'SEMI')),
    odometer_reading INTEGER DEFAULT 0, -- in km
    avg_daily_mileage INTEGER DEFAULT 100,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'retired')),
    assigned_driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_assigned_driver_id ON vehicles(assigned_driver_id);
CREATE INDEX idx_vehicles_vehicle_number ON vehicles(vehicle_number);

-- IoT sensor readings
CREATE TABLE IF NOT EXISTS sensor_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    sensor_type VARCHAR(50) NOT NULL,
    value DECIMAL(10, 4) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sensor_readings_vehicle_id ON sensor_readings(vehicle_id);
CREATE INDEX idx_sensor_readings_recorded_at ON sensor_readings(recorded_at);
CREATE INDEX idx_sensor_readings_sensor_type ON sensor_readings(sensor_type);
CREATE INDEX idx_sensor_readings_vehicle_sensor ON sensor_readings(vehicle_id, sensor_type, recorded_at);

-- Maintenance analyses
CREATE TABLE IF NOT EXISTS maintenance_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    overall_health_score INTEGER NOT NULL CHECK (overall_health_score >= 0 AND overall_health_score <= 100),
    health_level VARCHAR(20) NOT NULL CHECK (health_level IN ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL', 'UNKNOWN')),
    component_scores JSONB NOT NULL,
    predictions JSONB,
    recommendations JSONB,
    model_version VARCHAR(20) NOT NULL,
    analyzed_at TIMESTAMPTZ DEFAULT NOW(),
    processing_time_ms INTEGER
);

CREATE INDEX idx_maintenance_analyses_vehicle_id ON maintenance_analyses(vehicle_id);
CREATE INDEX idx_maintenance_analyses_analyzed_at ON maintenance_analyses(analyzed_at);
CREATE INDEX idx_maintenance_analyses_health_level ON maintenance_analyses(health_level);
CREATE INDEX idx_maintenance_analyses_health_score ON maintenance_analyses(overall_health_score);

-- Maintenance alerts
CREATE TABLE IF NOT EXISTS maintenance_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    message TEXT NOT NULL,
    metadata JSONB,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMPTZ,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_maintenance_alerts_vehicle_id ON maintenance_alerts(vehicle_id);
CREATE INDEX idx_maintenance_alerts_severity ON maintenance_alerts(severity);
CREATE INDEX idx_maintenance_alerts_acknowledged ON maintenance_alerts(acknowledged);
CREATE INDEX idx_maintenance_alerts_resolved ON maintenance_alerts(resolved);
CREATE INDEX idx_maintenance_alerts_created_at ON maintenance_alerts(created_at);

-- Maintenance records
CREATE TABLE IF NOT EXISTS maintenance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    component_type VARCHAR(50) NOT NULL,
    maintenance_type VARCHAR(50) NOT NULL CHECK (maintenance_type IN ('inspection', 'repair', 'replacement', 'preventive')),
    description TEXT,
    cost DECIMAL(10, 2),
    performed_by VARCHAR(100),
    odometer_at_service INTEGER,
    performed_at TIMESTAMPTZ NOT NULL,
    next_service_due DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_maintenance_records_vehicle_id ON maintenance_records(vehicle_id);
CREATE INDEX idx_maintenance_records_performed_at ON maintenance_records(performed_at);
CREATE INDEX idx_maintenance_records_component_type ON maintenance_records(component_type);
CREATE INDEX idx_maintenance_records_maintenance_type ON maintenance_records(maintenance_type);

-- ======================
-- AI MODEL PERFORMANCE TRACKING
-- ======================

-- Model performance metrics
CREATE TABLE IF NOT EXISTS ai_model_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name VARCHAR(50) NOT NULL,
    model_version VARCHAR(20) NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    metric_value DECIMAL(10, 6) NOT NULL,
    sample_size INTEGER,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

CREATE INDEX idx_ai_model_metrics_model_name ON ai_model_metrics(model_name);
CREATE INDEX idx_ai_model_metrics_recorded_at ON ai_model_metrics(recorded_at);
CREATE INDEX idx_ai_model_metrics_model_version ON ai_model_metrics(model_name, model_version);

-- ======================
-- ANALYTICS VIEWS
-- ======================

-- Fraud detection analytics
CREATE OR REPLACE VIEW fraud_analytics AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_checks,
    COUNT(*) FILTER (WHERE risk_level = 'CRITICAL') as critical_count,
    COUNT(*) FILTER (WHERE risk_level = 'HIGH') as high_count,
    COUNT(*) FILTER (WHERE recommended_action = 'block') as blocked_count,
    AVG(risk_score) as avg_risk_score,
    AVG(processing_time_ms) as avg_processing_time,
    SUM(transaction_amount) FILTER (WHERE recommended_action = 'block') as blocked_amount
FROM fraud_checks
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Vehicle health analytics
CREATE OR REPLACE VIEW vehicle_health_analytics AS
SELECT 
    v.id as vehicle_id,
    v.vehicle_number,
    v.vehicle_type,
    v.odometer_reading,
    ma.overall_health_score,
    ma.health_level,
    COUNT(mr.id) as maintenance_count_last_year,
    SUM(mr.cost) as maintenance_cost_last_year,
    COUNT(mal.id) FILTER (WHERE mal.severity = 'critical' AND mal.resolved = FALSE) as open_critical_alerts
FROM vehicles v
LEFT JOIN LATERAL (
    SELECT * FROM maintenance_analyses
    WHERE vehicle_id = v.id
    ORDER BY analyzed_at DESC
    LIMIT 1
) ma ON TRUE
LEFT JOIN maintenance_records mr ON mr.vehicle_id = v.id 
    AND mr.performed_at > NOW() - INTERVAL '1 year'
LEFT JOIN maintenance_alerts mal ON mal.vehicle_id = v.id
GROUP BY v.id, v.vehicle_number, v.vehicle_type, v.odometer_reading, ma.overall_health_score, ma.health_level;

-- Route optimization performance
CREATE OR REPLACE VIEW route_optimization_performance AS
SELECT 
    algorithm,
    vehicle_type,
    COUNT(*) as optimization_count,
    AVG(total_distance) as avg_distance,
    AVG(estimated_duration) as avg_duration,
    AVG(estimated_fuel_cost) as avg_fuel_cost,
    AVG(processing_time_ms) as avg_processing_time,
    AVG(savings_achieved) FILTER (WHERE savings_achieved IS NOT NULL) as avg_savings,
    AVG(actual_duration - estimated_duration) FILTER (WHERE actual_duration IS NOT NULL) as avg_duration_accuracy
FROM route_optimizations
GROUP BY algorithm, vehicle_type;

-- ======================
-- FUNCTIONS
-- ======================

-- Update vehicle updated_at timestamp
CREATE OR REPLACE FUNCTION update_vehicle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vehicle_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_vehicle_updated_at();

-- Calculate vehicle utilization
CREATE OR REPLACE FUNCTION calculate_vehicle_utilization(
    p_vehicle_id UUID,
    p_days INTEGER DEFAULT 30
) RETURNS DECIMAL AS $$
DECLARE
    total_distance DECIMAL;
    expected_distance DECIMAL;
    utilization DECIMAL;
BEGIN
    -- Get actual distance traveled
    SELECT COALESCE(SUM(total_distance), 0)
    INTO total_distance
    FROM route_optimizations
    WHERE vehicle_id = p_vehicle_id
    AND created_at > NOW() - (p_days || ' days')::INTERVAL;
    
    -- Get expected distance based on avg daily mileage
    SELECT avg_daily_mileage * p_days
    INTO expected_distance
    FROM vehicles
    WHERE id = p_vehicle_id;
    
    -- Calculate utilization percentage
    IF expected_distance > 0 THEN
        utilization = (total_distance / expected_distance) * 100;
    ELSE
        utilization = 0;
    END IF;
    
    RETURN utilization;
END;
$$ LANGUAGE plpgsql;

-- Get vehicle maintenance priority score
CREATE OR REPLACE FUNCTION get_vehicle_maintenance_priority(
    p_vehicle_id UUID
) RETURNS INTEGER AS $$
DECLARE
    health_score INTEGER;
    open_alerts INTEGER;
    days_since_service INTEGER;
    priority_score INTEGER;
BEGIN
    -- Get latest health score
    SELECT overall_health_score
    INTO health_score
    FROM maintenance_analyses
    WHERE vehicle_id = p_vehicle_id
    ORDER BY analyzed_at DESC
    LIMIT 1;
    
    -- Count open critical alerts
    SELECT COUNT(*)
    INTO open_alerts
    FROM maintenance_alerts
    WHERE vehicle_id = p_vehicle_id
    AND severity = 'critical'
    AND resolved = FALSE;
    
    -- Days since last service
    SELECT DATE_PART('day', NOW() - MAX(performed_at))
    INTO days_since_service
    FROM maintenance_records
    WHERE vehicle_id = p_vehicle_id;
    
    -- Calculate priority (higher = more urgent)
    priority_score = 100 - COALESCE(health_score, 50)  -- inverse of health
                   + (open_alerts * 10)                 -- 10 points per critical alert
                   + LEAST(COALESCE(days_since_service, 0) / 10, 30);  -- cap at 30 points
    
    RETURN priority_score;
END;
$$ LANGUAGE plpgsql;

-- ======================
-- SEED DATA (Optional)
-- ======================

-- Insert sample vehicles
INSERT INTO vehicles (vehicle_number, make, model, year, vin, vehicle_type, odometer_reading)
VALUES 
    ('TRK-001', 'Freightliner', 'Cascadia', 2022, '1FUJGHDV8NLFXXXXX', 'SEMI', 45000),
    ('TRK-002', 'Volvo', 'VNL 760', 2023, '4V4NC9TH1NN1XXXXX', 'SEMI', 28000),
    ('TRK-003', 'Peterbilt', '579', 2021, '1XPBDP9X8LD1XXXXX', 'TRUCK', 67000),
    ('VAN-001', 'Ford', 'Transit', 2023, '1FTBW2CM7GKA1XXXX', 'VAN', 15000),
    ('VAN-002', 'Mercedes', 'Sprinter', 2022, 'WD3PE8CD3N5XXXXXX', 'VAN', 22000)
ON CONFLICT (vehicle_number) DO NOTHING;

COMMENT ON TABLE fraud_checks IS 'AI-powered fraud detection analysis results';
COMMENT ON TABLE demand_forecasts IS 'Time series demand forecasts using multiple ML models';
COMMENT ON TABLE route_optimizations IS 'AI-optimized multi-stop route plans';
COMMENT ON TABLE vehicles IS 'Fleet vehicle inventory';
COMMENT ON TABLE sensor_readings IS 'IoT sensor data from vehicles';
COMMENT ON TABLE maintenance_analyses IS 'Predictive maintenance analysis results';
COMMENT ON TABLE maintenance_alerts IS 'Maintenance alerts and warnings';
COMMENT ON TABLE maintenance_records IS 'Historical maintenance and repair records';
COMMENT ON TABLE ai_model_metrics IS 'AI/ML model performance tracking';

-- Grant permissions (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO api_user;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO api_user;

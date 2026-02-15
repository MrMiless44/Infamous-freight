-- Phase 4 Database Migration: Neural Networks, Blockchain, Advanced Geofencing, Compliance
-- Created: 2026-02-15

-- Neural Network Models & Training History
CREATE TABLE neural_network_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    model_type VARCHAR(50) NOT NULL, -- loadAcceptance, demandForecast, fraudDetection, riskScoring
    training_data_points INT,
    accuracy DECIMAL(5,2),
    final_loss DECIMAL(10,4),
    trained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_neural_driver_id ON neural_network_models(driver_id);
CREATE INDEX idx_neural_model_type ON neural_network_models(model_type);

-- Neural Network Predictions & Results
CREATE TABLE nn_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    prediction_type VARCHAR(50) NOT NULL,
    input_data JSONB,
    confidence DECIMAL(5,2),
    prediction_result DECIMAL(10,4),
    actual_result DECIMAL(10,4),
    accuracy BOOLEAN,
    predicted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_predictions_driver_id ON nn_predictions(driver_id);
CREATE INDEX idx_predictions_type ON nn_predictions(prediction_type);

-- Blockchain Transactions
CREATE TABLE blockchain_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tx_hash VARCHAR(256) NOT NULL UNIQUE,
    tx_type VARCHAR(50) NOT NULL, -- payment, shipment, escrow, delivery_confirmed, etc.
    sender_id UUID,
    receiver_id UUID,
    amount DECIMAL(15,2),
    load_id UUID,
    status VARCHAR(50) DEFAULT 'pending',
    signature VARCHAR(256),
    block_height INT,
    confirmed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_blockchain_tx_hash ON blockchain_transactions(tx_hash);
CREATE INDEX idx_blockchain_sender ON blockchain_transactions(sender_id);
CREATE INDEX idx_blockchain_receiver ON blockchain_transactions(receiver_id);
CREATE INDEX idx_blockchain_block_height ON blockchain_transactions(block_height);

-- Blockchain Blocks
CREATE TABLE blockchain_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    block_height INT UNIQUE NOT NULL,
    block_hash VARCHAR(256) NOT NULL UNIQUE,
    previous_hash VARCHAR(256),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    nonce INT,
    transaction_count INT,
    creator VARCHAR(100),
    difficulty INT,
    mining_time_ms INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_blocks_height ON blockchain_blocks(block_height);
CREATE INDEX idx_blocks_hash ON blockchain_blocks(block_hash);

-- Escrow Contracts
CREATE TABLE escrow_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escrow_id VARCHAR(100) NOT NULL UNIQUE,
    shipper_id UUID NOT NULL,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE SET NULL,
    amount DECIMAL(15,2) NOT NULL,
    load_id UUID NOT NULL,
    status VARCHAR(50) DEFAULT 'locked', -- locked, pending_confirmation, released, dispute
    release_condition VARCHAR(100),
    dispute_reason TEXT,
    transaction_hash VARCHAR(256),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    released_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_escrow_shipper ON escrow_contracts(shipper_id);
CREATE INDEX idx_escrow_driver ON escrow_contracts(driver_id);
CREATE INDEX idx_escrow_load ON escrow_contracts(load_id);
CREATE INDEX idx_escrow_status ON escrow_contracts(status);

-- Geofence Zones
CREATE TABLE geofence_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    zone_type VARCHAR(50),
    category VARCHAR(50), -- service_area, restricted, pickup, delivery, warehouse, rest_area, fuel_station
    center_lat DECIMAL(10,8),
    center_lon DECIMAL(11,8),
    radius_meters INT,
    polygon JSONB,
    priority VARCHAR(50) DEFAULT 'normal',
    active BOOLEAN DEFAULT true,
    automated_actions JSONB,
    notification_rules JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_zones_name ON geofence_zones(name);
CREATE INDEX idx_zones_active ON geofence_zones(active);
CREATE INDEX idx_zones_category ON geofence_zones(category);

-- Safety Corridors
CREATE TABLE safety_corridors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_id VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    start_lat DECIMAL(10,8),
    start_lon DECIMAL(11,8),
    end_lat DECIMAL(10,8),
    end_lon DECIMAL(11,8),
    width_meters INT,
    waypoints JSONB,
    speed_limit_mph INT,
    hazardous_areas JSONB,
    rest_areas JSONB,
    estimated_duration_mins INT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_corridors_name ON safety_corridors(name);
CREATE INDEX idx_corridors_active ON safety_corridors(active);

-- Zone Entry/Exit History
CREATE TABLE zone_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    zone_id UUID NOT NULL REFERENCES geofence_zones(id) ON DELETE CASCADE,
    event_type VARCHAR(50), -- zone_entry, zone_exit, corridor_deviation, speeding_violation
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    event_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_zone_history_driver ON zone_history(driver_id);
CREATE INDEX idx_zone_history_zone ON zone_history(zone_id);
CREATE INDEX idx_zone_history_type ON zone_history(event_type);

-- Insurance Claims
CREATE TABLE insurance_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id VARCHAR(100) NOT NULL UNIQUE,
    claim_type VARCHAR(50) NOT NULL, -- collision, theft, cargo_damage, injury, liability
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    vehicle_id UUID,
    third_party_id UUID,
    shipper_id UUID,
    status VARCHAR(50) DEFAULT 'auto_initiated',
    severity VARCHAR(50),
    incident_date TIMESTAMP,
    incident_location VARCHAR(255),
    incident_description TEXT,
    estimated_amount DECIMAL(15,2),
    approved_amount DECIMAL(15,2),
    documents_required JSONB,
    photos JSONB,
    assigned_adjuster VARCHAR(255),
    filing_deadline TIMESTAMP,
    resolution_deadline TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_claims_driver ON insurance_claims(driver_id);
CREATE INDEX idx_claims_type ON insurance_claims(claim_type);
CREATE INDEX idx_claims_status ON insurance_claims(status);

-- Compliance Records
CREATE TABLE compliance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    record_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    overall_status VARCHAR(50),
    license_valid BOOLEAN,
    license_expiry TIMESTAMP,
    license_violations INT DEFAULT 0,
    medical_cert_valid BOOLEAN,
    medical_cert_expiry TIMESTAMP,
    hazmat_certified BOOLEAN,
    hazmat_expiry TIMESTAMP,
    background_cleared BOOLEAN,
    last_background_check TIMESTAMP,
    dui_screen_passed BOOLEAN,
    dui_screen_date TIMESTAMP,
    safety_inspection_passed BOOLEAN,
    last_safety_inspection TIMESTAMP,
    violations JSONB,
    recommendations JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_compliance_driver ON compliance_records(driver_id);
CREATE INDEX idx_compliance_status ON compliance_records(overall_status);

-- Compliance Documents
CREATE TABLE compliance_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_id VARCHAR(100) NOT NULL UNIQUE,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    document_type VARCHAR(50), -- license, medical_cert, hazmat_cert, insurance, training, etc.
    file_name VARCHAR(255),
    file_size INT,
    file_url VARCHAR(255),
    verified BOOLEAN DEFAULT false,
    verification_method VARCHAR(50),
    ocr_results JSONB,
    expiry_date TIMESTAMP,
    issued_by VARCHAR(255),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_driver ON compliance_documents(driver_id);
CREATE INDEX idx_documents_type ON compliance_documents(document_type);

-- FMCSA Violations
CREATE TABLE fmcsa_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    violation_code VARCHAR(50),
    violation_description TEXT,
    violation_date TIMESTAMP,
    severity VARCHAR(50),
    fine_amount DECIMAL(10,2),
    corrected BOOLEAN DEFAULT false,
    corrected_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fmcsa_driver ON fmcsa_violations(driver_id);
CREATE INDEX idx_fmcsa_code ON fmcsa_violations(violation_code);

-- Real-time Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id VARCHAR(100) NOT NULL UNIQUE,
    user_id UUID NOT NULL,
    notification_type VARCHAR(50), -- load_match, driver_status, shipment_status, alert, etc.
    priority VARCHAR(50) DEFAULT 'normal',
    subject VARCHAR(255),
    message TEXT,
    data JSONB,
    read BOOLEAN DEFAULT false,
    delivered BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Notification Subscriptions
CREATE TABLE notification_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    topic VARCHAR(100) NOT NULL,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_subscriptions_user_topic ON notification_subscriptions(user_id, topic);
CREATE INDEX idx_subscriptions_topic ON notification_subscriptions(topic);

-- Compliance Audit History
CREATE TABLE compliance_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id VARCHAR(100) NOT NULL UNIQUE,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    audit_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    categories JSONB,
    overall_score INT,
    overall_status VARCHAR(50),
    findings JSONB,
    recommendations JSONB,
    next_audit_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audits_driver ON compliance_audits(driver_id);
CREATE INDEX idx_audits_status ON compliance_audits(overall_status);

-- Analytics & Performance Metrics
CREATE TABLE performance_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    score_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    overall_score DECIMAL(5,2),
    rank VARCHAR(50),
    on_time_delivery_pct DECIMAL(5,2),
    customer_satisfaction DECIMAL(3,1),
    safety_record_score INT,
    fuel_efficiency_score INT,
    revenue_score INT,
    reliability_score INT,
    recommendations JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_performance_driver ON performance_scores(driver_id);
CREATE INDEX idx_performance_rank ON performance_scores(rank);

-- Phase 4 Analytics View for BI
CREATE VIEW phase4_analytics AS
SELECT
    d.id as driver_id,
    d.name as driver_name,
    COUNT(DISTINCT nn.id) as ml_models_trained,
    COUNT(DISTINCT ic.id) as insurance_claims,
    COUNT(DISTINCT cr.id) as compliance_records,
    AVG(ps.overall_score) as avg_performance_score,
    COUNT(DISTINCT CASE WHEN zh.event_type = 'zone_entry' THEN zh.id END) as zone_entries,
    COUNT(DISTINCT fv.id) as fmcsa_violations
FROM drivers d
LEFT JOIN neural_network_models nn ON d.id = nn.driver_id
LEFT JOIN insurance_claims ic ON d.id = ic.driver_id
LEFT JOIN compliance_records cr ON d.id = cr.driver_id
LEFT JOIN performance_scores ps ON d.id = ps.driver_id
LEFT JOIN zone_history zh ON d.id = zh.driver_id
LEFT JOIN fmcsa_violations fv ON d.id = fv.driver_id
GROUP BY d.id, d.name;

-- Add Phase 4 columns to existing drivers table (if needed)
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS blockchain_address VARCHAR(256);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS ml_consent BOOLEAN DEFAULT true;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS compliance_status VARCHAR(50) DEFAULT 'pending';

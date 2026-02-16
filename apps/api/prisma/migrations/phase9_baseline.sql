-- apps/api/prisma/migrations/phase9_baseline.sql

-- Phase 9 Database Schema Additions

-- Wallet Transactions Table
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  wallet_id UUID NOT NULL,
  transaction_type VARCHAR(50) NOT NULL, -- load, transfer, payment, refund
  amount DECIMAL(20, 8) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, completed, failed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_created_at ON wallet_transactions(created_at);
CREATE INDEX idx_wallet_transactions_status ON wallet_transactions(status);

-- Cryptocurrency Payments Table
CREATE TABLE crypto_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  transaction_id VARCHAR(255) NOT NULL UNIQUE,
  currency VARCHAR(10) NOT NULL, -- BTC, ETH, USDC, USDT
  usd_amount DECIMAL(20, 2) NOT NULL,
  crypto_amount DECIMAL(20, 8) NOT NULL,
  wallet_address VARCHAR(255) NOT NULL,
  invoice_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL, -- pending_confirmation, confirmed, failed
  confirmations_required INT DEFAULT 3,
  confirmations_received INT DEFAULT 0,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_crypto_payments_user_id ON crypto_payments(user_id);
CREATE INDEX idx_crypto_payments_status ON crypto_payments(status);
CREATE INDEX idx_crypto_payments_created_at ON crypto_payments(created_at);

-- BNPL Payments Table
CREATE TABLE bnpl_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  provider VARCHAR(50) NOT NULL, -- klarna, affirm, afterpay, paypal_credit
  amount DECIMAL(20, 2) NOT NULL,
  installments INT NOT NULL,
  monthly_payment DECIMAL(20, 2) NOT NULL,
  interest_rate DECIMAL(5, 2) NOT NULL,
  status VARCHAR(50) NOT NULL, -- pending, approved, completed, failed
  customer_id VARCHAR(255),
  shipment_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_bnpl_payments_user_id ON bnpl_payments(user_id);
CREATE INDEX idx_bnpl_payments_provider ON bnpl_payments(provider);
CREATE INDEX idx_bnpl_payments_status ON bnpl_payments(status);

-- Push Notifications Table
CREATE TABLE push_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  category VARCHAR(50) NOT NULL, -- shipment, marketing, account, system
  image_url VARCHAR(255),
  action_url VARCHAR(255),
  status VARCHAR(50) NOT NULL, -- sent, delivered, read, failed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_push_notifications_user_id ON push_notifications(user_id);
CREATE INDEX idx_push_notifications_status ON push_notifications(status);
CREATE INDEX idx_push_notifications_created_at ON push_notifications(created_at);

-- Webhook Deliveries Table
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(50) NOT NULL, -- pending, delivered, failed
  attempt_count INT DEFAULT 0,
  max_attempts INT DEFAULT 5,
  response_status INT,
  response_body TEXT,
  next_retry_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  delivered_at TIMESTAMP
);

CREATE INDEX idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX idx_webhook_deliveries_created_at ON webhook_deliveries(created_at);

-- MFA Enrollments Table
CREATE TABLE mfa_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  method VARCHAR(50) NOT NULL, -- totp, sms, email, fingerprint, face
  secret VARCHAR(255),
  device_fingerprint VARCHAR(255),
  backup_codes TEXT[], -- Array of backup codes
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, method)
);

CREATE INDEX idx_mfa_enrollments_user_id ON mfa_enrollments(user_id);
CREATE INDEX idx_mfa_enrollments_method ON mfa_enrollments(method);

-- Loyalty Accounts Table
CREATE TABLE loyalty_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  points_balance INT DEFAULT 0,
  tier VARCHAR(50) NOT NULL DEFAULT 'BRONZE', -- BRONZE, SILVER, GOLD, PLATINUM
  tier_progress INT DEFAULT 0,
  referral_code VARCHAR(50) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_loyalty_accounts_user_id ON loyalty_accounts(user_id);
CREATE INDEX idx_loyalty_accounts_tier ON loyalty_accounts(tier);

-- Content Items Table
CREATE TABLE content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, published, archived
  author_id UUID,
  views INT DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_content_items_slug ON content_items(slug);
CREATE INDEX idx_content_items_status ON content_items(status);
CREATE INDEX idx_content_items_category ON content_items(category);

-- API Audit Logs Table
CREATE TABLE api_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  status_code INT,
  request_body JSONB,
  response_body JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  duration_ms INT
);

CREATE INDEX idx_api_audit_logs_user_id ON api_audit_logs(user_id);
CREATE INDEX idx_api_audit_logs_created_at ON api_audit_logs(created_at);
CREATE INDEX idx_api_audit_logs_action ON api_audit_logs(action);

-- Create updated views for analytics
CREATE OR REPLACE VIEW payment_analytics AS
SELECT 
  DATE_TRUNC('day', created_at)::DATE as date,
  COUNT(*) as total_payments,
  SUM(usd_amount) as total_amount,
  'crypto' as payment_type
FROM crypto_payments
WHERE status = 'confirmed'
GROUP BY DATE_TRUNC('day', created_at)
UNION ALL
SELECT 
  DATE_TRUNC('day', created_at)::DATE as date,
  COUNT(*) as total_payments,
  SUM(amount) as total_amount,
  'bnpl' as payment_type
FROM bnpl_payments
WHERE status = 'completed'
GROUP BY DATE_TRUNC('day', created_at);

-- Create index for performance
CREATE INDEX idx_payment_analytics_date ON payment_analytics(date);

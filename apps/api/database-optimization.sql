-- Copyright © 2025 Infæmous Freight. All Rights Reserved.
-- Database Optimization & Indexes - 100% Performance Tuned
-- Run this script to optimize PostgreSQL for production

-- ============================================
-- PERFORMANCE INDEXES
-- ============================================

-- Shipments table - most frequently queried
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shipments_status
    ON "Shipment" (status)
    WHERE status IN ('PENDING', 'IN_TRANSIT', 'DELIVERED');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shipments_created_at
    ON "Shipment" (created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shipments_org_status
    ON "Shipment" (organization_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shipments_driver
    ON "Shipment" (driver_id, status)
    WHERE driver_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shipments_pickup_delivery
    ON "Shipment" (pickup_location, delivery_location);

-- Users table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email
    ON "User" (email)
    WHERE email IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_org
    ON "User" (organization_id, role);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active
    ON "User" (is_active, created_at DESC)
    WHERE is_active = true;

-- Assignments table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assignments_shipment
    ON "Assignment" (shipment_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assignments_driver
    ON "Assignment" (driver_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assignments_status_date
    ON "Assignment" (status, created_at DESC)
    WHERE status IN ('ASSIGNED', 'IN_TRANSIT');

-- Agent runs (for analytics)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_runs_name_status
    ON "AgentRun" (agent_name, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_runs_user
    ON "AgentRun" (user_id, created_at DESC)
    WHERE user_id IS NOT NULL;

-- Audit logs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_user_date
    ON "AuditLog" (user_id, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_org_date
    ON "AuditLog" (organization_id, timestamp DESC)
    WHERE organization_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_action
    ON "AuditLog" (action, timestamp DESC);

-- Organizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_active
    ON "Organization" (is_active, created_at DESC)
    WHERE is_active = true;

-- Billing/Subscriptions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_org_status
    ON "Subscription" (organization_id, status)
    WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_org_date
    ON "Invoice" (organization_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_status
    ON "Invoice" (status, due_date)
    WHERE status IN ('pending', 'overdue');

-- ============================================
-- PARTIAL INDEXES (for common WHERE clauses)
-- ============================================

-- Only index active records
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drivers_active
    ON "Driver" (status)
    WHERE status = 'ACTIVE';

-- Only index recent records (last 90 days)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shipments_recent
    ON "Shipment" (created_at DESC, status)
    WHERE created_at > NOW() - INTERVAL '90 days';

-- ============================================
-- COMPOSITE INDEXES (for complex queries)
-- ============================================

-- Shipment search by org + date range + status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shipments_org_date_status
    ON "Shipment" (organization_id, created_at DESC, status)
    INCLUDE (id, tracking_number);

-- User lookup by org + role
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_org_role_active
    ON "User" (organization_id, role, is_active)
    INCLUDE (id, email, name);

-- ============================================
-- FULL-TEXT SEARCH INDEXES
-- ============================================

-- Shipment search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shipments_search
    ON "Shipment" USING gin(to_tsvector('english', 
        coalesce(tracking_number, '') || ' ' ||
        coalesce(pickup_location, '') || ' ' ||
        coalesce(delivery_location, '')
    ));

-- User search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_search
    ON "User" USING gin(to_tsvector('english',
        coalesce(name, '') || ' ' ||
        coalesce(email, '')
    ));

-- ============================================
-- QUERY OPTIMIZATION VIEWS
-- ============================================

-- Active shipments summary
CREATE OR REPLACE VIEW active_shipments_summary AS
SELECT 
    s.id,
    s.tracking_number,
    s.status,
    s.pickup_location,
    s.delivery_location,
    s.estimated_delivery,
    s.organization_id,
    d.id as driver_id,
    d.name as driver_name,
    o.name as organization_name
FROM "Shipment" s
LEFT JOIN "Assignment" a ON s.id = a.shipment_id AND a.status = 'ASSIGNED'
LEFT JOIN "Driver" d ON a.driver_id = d.id
LEFT JOIN "Organization" o ON s.organization_id = o.id
WHERE s.status IN ('PENDING', 'IN_TRANSIT')
    AND s.created_at > NOW() - INTERVAL '30 days';

-- Organization metrics
CREATE OR REPLACE VIEW organization_metrics AS
SELECT 
    o.id,
    o.name,
    COUNT(DISTINCT s.id) as total_shipments,
    COUNT(DISTINCT CASE WHEN s.status = 'DELIVERED' THEN s.id END) as delivered_shipments,
    COUNT(DISTINCT u.id) as total_users,
    MAX(s.created_at) as last_shipment_date,
    SUM(CASE WHEN s.status = 'DELIVERED' THEN s.estimated_value ELSE 0 END) as total_revenue
FROM "Organization" o
LEFT JOIN "Shipment" s ON o.id = s.organization_id
LEFT JOIN "User" u ON o.id = u.organization_id
WHERE o.is_active = true
GROUP BY o.id, o.name;

-- ============================================
-- QUERY PERFORMANCE FUNCTIONS
-- ============================================

-- Get slow queries
CREATE OR REPLACE FUNCTION get_slow_queries(min_duration_ms INTEGER DEFAULT 1000)
RETURNS TABLE (
    query TEXT,
    calls BIGINT,
    total_time_seconds NUMERIC,
    mean_time_ms NUMERIC,
    min_time_ms NUMERIC,
    max_time_ms NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        substring(query, 1, 200) as query,
        calls,
        ROUND((total_exec_time / 1000)::numeric, 2) as total_time_seconds,
        ROUND(mean_exec_time::numeric, 2) as mean_time_ms,
        ROUND(min_exec_time::numeric, 2) as min_time_ms,
        ROUND(max_exec_time::numeric, 2) as max_time_ms
    FROM pg_stat_statements
    WHERE mean_exec_time > min_duration_ms
    ORDER BY total_exec_time DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Get table sizes
CREATE OR REPLACE FUNCTION get_table_sizes()
RETURNS TABLE (
    schema_name TEXT,
    table_name TEXT,
    total_size TEXT,
    table_size TEXT,
    indexes_size TEXT,
    row_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname::TEXT,
        tablename::TEXT,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
        pg_size_pretty(pg_table_size(schemaname||'.'||tablename)) as table_size,
        pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as indexes_size,
        (SELECT reltuples::BIGINT FROM pg_class WHERE oid = (schemaname||'.'||tablename)::regclass) as row_count
    FROM pg_tables
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql;

-- Get index usage stats
CREATE OR REPLACE FUNCTION get_index_usage()
RETURNS TABLE (
    schema_name TEXT,
    table_name TEXT,
    index_name TEXT,
    index_size TEXT,
    index_scans BIGINT,
    tuples_read BIGINT,
    tuples_fetched BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname::TEXT,
        tablename::TEXT,
        indexname::TEXT,
        pg_size_pretty(pg_relation_size(schemaname||'.'||indexname)) as index_size,
        idx_scan as index_scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched
    FROM pg_stat_user_indexes
    ORDER BY idx_scan DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- MAINTENANCE TASKS
-- ============================================

-- Analyze all tables (update statistics)
DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE 'ANALYZE ' || quote_ident(table_name);
    END LOOP;
END $$;

-- Vacuum analyze (run during maintenance window)
-- VACUUM (ANALYZE, VERBOSE) "Shipment";
-- VACUUM (ANALYZE, VERBOSE) "Assignment";
-- VACUUM (ANALYZE, VERBOSE) "AuditLog";

-- ============================================
-- MONITORING QUERIES (for ongoing optimization)
-- ============================================

-- Check for missing indexes
CREATE OR REPLACE VIEW missing_indexes AS
SELECT 
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    seq_tup_read / seq_scan as avg_seq_tup_read
FROM pg_stat_user_tables
WHERE seq_scan > 0
    AND idx_scan = 0
    AND seq_tup_read > 1000
ORDER BY seq_tup_read DESC;

-- Check for unused indexes
CREATE OR REPLACE VIEW unused_indexes AS
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(schemaname||'.'||indexname)) as index_size,
    idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
    AND indexname NOT LIKE '%_pkey'
ORDER BY pg_relation_size(schemaname||'.'||indexname) DESC;

-- Check for bloated tables
CREATE OR REPLACE VIEW table_bloat AS
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    n_dead_tup as dead_tuples,
    CASE 
        WHEN n_live_tup > 0 
        THEN ROUND(100.0 * n_dead_tup / n_live_tup, 2)
        ELSE 0
    END as dead_tuple_percent
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;

-- ============================================
-- USAGE EXAMPLES
-- ============================================

-- Find slow queries:
-- SELECT * FROM get_slow_queries(500);

-- Check table sizes:
-- SELECT * FROM get_table_sizes();

-- Check index usage:
-- SELECT * FROM get_index_usage();

-- Find missing indexes:
-- SELECT * FROM missing_indexes;

-- Find unused indexes (consider dropping):
-- SELECT * FROM unused_indexes;

-- Check for bloat (run VACUUM if high):
-- SELECT * FROM table_bloat;

-- ============================================
-- PERFORMANCE TIPS
-- ============================================

/*
1. Run ANALYZE after bulk data changes
2. Run VACUUM ANALYZE weekly
3. Monitor slow query log
4. Check for missing/unused indexes monthly
5. Update PostgreSQL settings in postgresql.conf
6. Enable pg_stat_statements extension
7. Set up connection pooling (PgBouncer)
8. Use EXPLAIN ANALYZE to debug slow queries
*/

-- Enable pg_stat_statements (if not already enabled)
-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- ============================================
-- END OF OPTIMIZATION SCRIPT
-- ============================================

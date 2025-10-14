-- ============================================================================
-- Digital Logbook Database Seed Data
-- Description: Initial admin account only
-- ============================================================================

-- Use the logbookdb database
USE logbookdb;

-- ============================================================================
-- INSERT DEFAULT ADMIN USER
-- ============================================================================
-- Username: ADMIN001
-- Password: admin123
INSERT INTO users (id, username, password, user_type, is_active) VALUES 
(1, 'ADMIN001', 'admin123', 'admin', TRUE);

INSERT INTO admins (user_id, admin_id, first_name, middle_name, last_name, gender) VALUES 
(1, 'ADMIN001', 'System', 'S', 'Administrator', 'Male');

-- ============================================================================
-- SEED DATA INFORMATION
-- ============================================================================
-- Version: 2.0
-- Last Updated: 2025-01-14
-- Description: Minimal seed data - Admin account only
-- Default Admin Credentials: username: admin, password: admin123
-- ============================================================================



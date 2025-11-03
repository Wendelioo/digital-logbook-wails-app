-- ============================================================================
-- Digital Logbook Database Seed Data
-- Database: logbookdb
-- Description: Initial admin account(s) for system access
-- Version: 3.0
-- Last Updated: 2025-10-24
-- ============================================================================

USE logbookdb;

-- ============================================================================
-- CLEAR EXISTING SEED DATA (Optional - Uncomment if needed)
-- ============================================================================
-- DELETE FROM admins WHERE user_id IN (1, 2);
-- DELETE FROM users WHERE id IN (1, 2);

-- ============================================================================
-- INSERT DEFAULT ADMIN ACCOUNTS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Admin Account #1: Primary System Administrator
-- ----------------------------------------------------------------------------
-- Username: 2211172
-- Password: admin123 (PLAIN TEXT - should be hashed in production)
-- Purpose: Primary system administrator account
-- ----------------------------------------------------------------------------
INSERT INTO users (id, username, password, user_type, is_active, created_at) VALUES 
(1, '2211172', 'admin123', 'admin', TRUE, CURRENT_TIMESTAMP);

INSERT INTO admins (user_id, admin_id, first_name, middle_name, last_name, gender, email, created_at) VALUES 
(1, 'ADM-2211172', 'System', NULL, 'Administrator', 'Male', 'admin@logbook.edu', CURRENT_TIMESTAMP);

-- ----------------------------------------------------------------------------
-- Admin Account #2: Secondary Administrator (Optional)
-- ----------------------------------------------------------------------------
-- Uncomment the following lines to add a second admin account
/*
INSERT INTO users (id, username, password, user_type, is_active, created_at) VALUES 
(2, 'admin002', 'admin123', 'admin', TRUE, CURRENT_TIMESTAMP);

INSERT INTO admins (user_id, admin_id, first_name, middle_name, last_name, gender, email, created_at) VALUES 
(2, 'ADM-002', 'Secondary', NULL, 'Administrator', 'Female', 'admin2@logbook.edu', CURRENT_TIMESTAMP);
*/

-- ============================================================================
-- VERIFICATION QUERIES (Optional - Run to verify seed data)
-- ============================================================================
-- SELECT * FROM v_users_complete WHERE user_type = 'admin';
-- SELECT u.username, u.user_type, a.first_name, a.last_name, a.email 
-- FROM users u 
-- JOIN admins a ON u.id = a.user_id;

-- ============================================================================
-- IMPORTANT NOTES
-- ============================================================================
-- 1. Default admin credentials:
--    - Username: 2211172
--    - Password: admin123
--
-- 2. SECURITY WARNING: 
--    - Change default passwords immediately after first login
--    - In production, passwords should be hashed (bcrypt, argon2, etc.)
--    - Current passwords are stored in PLAIN TEXT for development only
--
-- 3. To add more admin accounts:
--    - Copy the INSERT statements above
--    - Change the id, username, admin_id, and personal details
--    - Ensure user_id in admins table matches id in users table
--
-- 4. Admin privileges:
--    - Full system access
--    - User management (create/edit/delete all user types)
--    - View all reports and analytics
--    - System configuration
--    - Feedback management and resolution
--
-- 5. To reset admin password:
--    UPDATE users SET password = 'newpassword123' WHERE username = '2211172';
--
-- ============================================================================
-- TEMPLATE: Add New Admin Account
-- ============================================================================
/*
-- Replace [ID], [USERNAME], [ADMIN_ID], [FIRSTNAME], [LASTNAME], [GENDER], [EMAIL]
INSERT INTO users (id, username, password, user_type, is_active, created_at) VALUES 
([ID], '[USERNAME]', 'admin123', 'admin', TRUE, CURRENT_TIMESTAMP);

INSERT INTO admins (user_id, admin_id, first_name, middle_name, last_name, gender, email, created_at) VALUES 
([ID], '[ADMIN_ID]', '[FIRSTNAME]', NULL, '[LASTNAME]', '[GENDER]', '[EMAIL]', CURRENT_TIMESTAMP);
*/

-- ============================================================================
-- END OF SEED DATA
-- ============================================================================


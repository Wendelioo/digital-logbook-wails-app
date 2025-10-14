-- ============================================================================
-- Digital Logbook Database Schema
-- Database: logbookdb
-- Description: Complete database schema for the Digital Logbook Wails Application
-- ============================================================================

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS logbookdb 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

-- Use the database
USE logbookdb;

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS feedback;
DROP TABLE IF EXISTS login_logs;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS working_students;
DROP TABLE IF EXISTS teachers;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS classlist;
DROP TABLE IF EXISTS users;

-- Drop views if they exist
DROP VIEW IF EXISTS v_users_complete;
DROP VIEW IF EXISTS v_login_logs_complete;

-- ============================================================================
-- USERS TABLE (Main authentication table)
-- ============================================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    user_type ENUM('admin', 'teacher', 'student', 'working_student') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE COMMENT 'User account status',
    last_login TIMESTAMP NULL COMMENT 'Last successful login time',
    login_attempts INT DEFAULT 0 COMMENT 'Failed login attempts counter',
    locked_until TIMESTAMP NULL COMMENT 'Account locked until this time',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_user_type (user_type),
    INDEX idx_is_active (is_active),
    INDEX idx_last_login (last_login)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ADMINS TABLE
-- ============================================================================
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    admin_id VARCHAR(50) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    gender ENUM('Male', 'Female', 'Other'),
    profile_photo MEDIUMTEXT COMMENT 'Base64-encoded profile photo data URL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_admin_id (admin_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TEACHERS TABLE
-- ============================================================================
CREATE TABLE teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    teacher_id VARCHAR(50) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    gender ENUM('Male', 'Female', 'Other'),
    profile_photo MEDIUMTEXT COMMENT 'Base64-encoded profile photo data URL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_teacher_id (teacher_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- CLASSLIST TABLE (Subjects/Classes)
-- ============================================================================
CREATE TABLE classlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_code VARCHAR(20) NOT NULL UNIQUE,
    subject_title VARCHAR(200) NOT NULL,
    assigned_teacher VARCHAR(100),
    room VARCHAR(50),
    schedule VARCHAR(100),
    year_level VARCHAR(20),
    section VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_subject_code (subject_code),
    INDEX idx_assigned_teacher (assigned_teacher)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- STUDENTS TABLE
-- ============================================================================
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    student_id VARCHAR(50) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    gender ENUM('Male', 'Female', 'Other'),
    year_level VARCHAR(20),
    section VARCHAR(50),
    class_id INT,
    profile_photo MEDIUMTEXT COMMENT 'Base64-encoded profile photo data URL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classlist(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_student_id (student_id),
    INDEX idx_class_id (class_id),
    INDEX idx_year_level (year_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- WORKING STUDENTS TABLE
-- ============================================================================
CREATE TABLE working_students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    student_id VARCHAR(50) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    gender ENUM('Male', 'Female', 'Other'),
    year_level VARCHAR(20),
    section VARCHAR(50),
    class_id INT,
    profile_photo MEDIUMTEXT COMMENT 'Base64-encoded profile photo data URL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classlist(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_student_id (student_id),
    INDEX idx_class_id (class_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ATTENDANCE TABLE
-- ============================================================================
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    date DATE NOT NULL,
    student_id INT NOT NULL,
    time_in TIME,
    time_out TIME,
    status ENUM('present', 'absent', 'late', 'excused') NOT NULL DEFAULT 'present',
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classlist(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_class_id (class_id),
    INDEX idx_student_id (student_id),
    INDEX idx_date (date),
    INDEX idx_status (status),
    UNIQUE KEY unique_attendance (class_id, date, student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- LOGIN LOGS TABLE
-- ============================================================================
CREATE TABLE login_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    user_type ENUM('admin', 'teacher', 'student', 'working_student') NOT NULL,
    pc_number VARCHAR(50),
    login_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    logout_time DATETIME,
    ip_address VARCHAR(45),
    user_agent TEXT COMMENT 'Browser/client information',
    session_duration INT COMMENT 'Duration in seconds',
    login_status ENUM('success', 'failed', 'logout') DEFAULT 'success' COMMENT 'Login attempt status',
    failure_reason VARCHAR(255) COMMENT 'Reason for failed login',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_login_time (login_time),
    INDEX idx_user_type (user_type),
    INDEX idx_pc_number (pc_number),
    INDEX idx_login_status (login_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- FEEDBACK TABLE (Equipment condition reports)
-- ============================================================================
CREATE TABLE feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    pc_number VARCHAR(50) NOT NULL,
    equipment_condition ENUM('Good', 'Minor Issue', 'Not Working') NOT NULL DEFAULT 'Good',
    monitor_condition ENUM('Good', 'Minor Issue', 'Not Working') NOT NULL DEFAULT 'Good',
    keyboard_condition ENUM('Good', 'Minor Issue', 'Not Working') NOT NULL DEFAULT 'Good',
    mouse_condition ENUM('Good', 'Minor Issue', 'Not Working') NOT NULL DEFAULT 'Good',
    comments TEXT,
    status ENUM('pending', 'reviewed', 'resolved') DEFAULT 'pending' COMMENT 'Feedback resolution status',
    reviewed_by INT NULL COMMENT 'Admin/Teacher who reviewed the feedback',
    reviewed_at TIMESTAMP NULL COMMENT 'When feedback was reviewed',
    resolution_notes TEXT COMMENT 'Notes from admin/teacher about resolution',
    date_submitted DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_student_id (student_id),
    INDEX idx_date_submitted (date_submitted),
    INDEX idx_pc_number (pc_number),
    INDEX idx_status (status),
    INDEX idx_equipment_condition (equipment_condition)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SYSTEM SETTINGS TABLE
-- ============================================================================
CREATE TABLE system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE COMMENT 'Whether setting can be accessed by non-admin users',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_setting_key (setting_key),
    INDEX idx_is_public (is_public)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('app_name', 'Digital Logbook Monitoring System', 'string', 'Application name displayed in UI', TRUE),
('app_version', '1.0.0', 'string', 'Current application version', TRUE),
('max_login_attempts', '5', 'number', 'Maximum failed login attempts before account lockout', FALSE),
('lockout_duration', '15', 'number', 'Account lockout duration in minutes', FALSE),
('session_timeout', '480', 'number', 'Session timeout in minutes (8 hours)', FALSE),
('pc_lab_capacity', '50', 'number', 'Total PC capacity in the lab', TRUE),
('maintenance_mode', 'false', 'boolean', 'Whether the system is in maintenance mode', TRUE),
('backup_frequency', 'daily', 'string', 'How often to backup the database', FALSE);

-- ============================================================================
-- CREATE VIEWS FOR EASIER QUERIES
-- ============================================================================

-- View: Complete user information
CREATE OR REPLACE VIEW v_users_complete AS
SELECT 
    u.id,
    u.username,
    u.user_type,
    u.is_active,
    u.last_login,
    u.login_attempts,
    u.created_at,
    CASE 
        WHEN u.user_type = 'admin' THEN a.first_name
        WHEN u.user_type = 'teacher' THEN t.first_name
        WHEN u.user_type = 'student' THEN s.first_name
        WHEN u.user_type = 'working_student' THEN ws.first_name
    END AS first_name,
    CASE 
        WHEN u.user_type = 'admin' THEN a.middle_name
        WHEN u.user_type = 'teacher' THEN t.middle_name
        WHEN u.user_type = 'student' THEN s.middle_name
        WHEN u.user_type = 'working_student' THEN ws.middle_name
    END AS middle_name,
    CASE 
        WHEN u.user_type = 'admin' THEN a.last_name
        WHEN u.user_type = 'teacher' THEN t.last_name
        WHEN u.user_type = 'student' THEN s.last_name
        WHEN u.user_type = 'working_student' THEN ws.last_name
    END AS last_name,
    CASE 
        WHEN u.user_type = 'admin' THEN a.gender
        WHEN u.user_type = 'teacher' THEN t.gender
        WHEN u.user_type = 'student' THEN s.gender
        WHEN u.user_type = 'working_student' THEN ws.gender
    END AS gender,
    CASE 
        WHEN u.user_type = 'admin' THEN a.admin_id
        WHEN u.user_type = 'teacher' THEN t.teacher_id
    END AS employee_id,
    CASE 
        WHEN u.user_type = 'student' THEN s.student_id
        WHEN u.user_type = 'working_student' THEN ws.student_id
    END AS student_id_str,
    CASE 
        WHEN u.user_type = 'student' THEN s.year_level
        WHEN u.user_type = 'working_student' THEN ws.year_level
    END AS year_level,
    CASE 
        WHEN u.user_type = 'student' THEN s.section
        WHEN u.user_type = 'working_student' THEN ws.section
    END AS section,
    CASE 
        WHEN u.user_type = 'admin' THEN a.profile_photo
        WHEN u.user_type = 'teacher' THEN t.profile_photo
        WHEN u.user_type = 'student' THEN s.profile_photo
        WHEN u.user_type = 'working_student' THEN ws.profile_photo
    END AS profile_photo
FROM users u
LEFT JOIN admins a ON u.id = a.user_id AND u.user_type = 'admin'
LEFT JOIN teachers t ON u.id = t.user_id AND u.user_type = 'teacher'
LEFT JOIN students s ON u.id = s.user_id AND u.user_type = 'student'
LEFT JOIN working_students ws ON u.id = ws.user_id AND u.user_type = 'working_student';

-- View: Login logs with user details
CREATE OR REPLACE VIEW v_login_logs_complete AS
SELECT 
    ll.id,
    ll.user_id,
    ll.user_type,
    ll.pc_number,
    ll.login_time,
    ll.logout_time,
    ll.session_duration,
    vu.first_name,
    vu.middle_name,
    vu.last_name,
    CONCAT(vu.last_name, ', ', vu.first_name, 
           CASE WHEN vu.middle_name IS NOT NULL THEN CONCAT(' ', vu.middle_name) ELSE '' END) AS full_name
FROM login_logs ll
JOIN v_users_complete vu ON ll.user_id = vu.id;

-- ============================================================================
-- STORED PROCEDURES
-- ============================================================================

-- Procedure: Log user login
DELIMITER //
CREATE PROCEDURE sp_log_login(
    IN p_user_id INT,
    IN p_user_type VARCHAR(50),
    IN p_pc_number VARCHAR(50),
    IN p_ip_address VARCHAR(45),
    IN p_user_agent TEXT,
    IN p_login_status VARCHAR(20)
)
BEGIN
    INSERT INTO login_logs (user_id, user_type, pc_number, ip_address, user_agent, login_status, login_time)
    VALUES (p_user_id, p_user_type, p_pc_number, p_ip_address, p_user_agent, p_login_status, NOW());
    
    -- Update user's last_login if successful
    IF p_login_status = 'success' THEN
        UPDATE users SET last_login = NOW(), login_attempts = 0 WHERE id = p_user_id;
    ELSE
        UPDATE users SET login_attempts = login_attempts + 1 WHERE id = p_user_id;
    END IF;
    
    SELECT LAST_INSERT_ID() AS log_id;
END //
DELIMITER ;

-- Procedure: Log user logout
DELIMITER //
CREATE PROCEDURE sp_log_logout(
    IN p_log_id INT
)
BEGIN
    UPDATE login_logs 
    SET logout_time = NOW(),
        session_duration = TIMESTAMPDIFF(SECOND, login_time, NOW())
    WHERE id = p_log_id;
END //
DELIMITER ;

-- Procedure: Get recent login count (last 24 hours)
DELIMITER //
CREATE PROCEDURE sp_get_recent_logins()
BEGIN
    SELECT COUNT(*) AS recent_logins
    FROM login_logs
    WHERE login_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    AND login_status = 'success';
END //
DELIMITER ;

-- Procedure: Get system dashboard statistics
DELIMITER //
CREATE PROCEDURE sp_get_dashboard_stats()
BEGIN
    SELECT 
        (SELECT COUNT(*) FROM students) AS total_students,
        (SELECT COUNT(*) FROM teachers) AS total_teachers,
        (SELECT COUNT(*) FROM working_students) AS working_students,
        (SELECT COUNT(*) FROM login_logs 
         WHERE login_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR) 
         AND login_status = 'success') AS recent_logins,
        (SELECT COUNT(*) FROM feedback 
         WHERE status = 'pending') AS pending_feedback,
        (SELECT COUNT(*) FROM attendance 
         WHERE date = CURDATE()) AS today_attendance;
END //
DELIMITER ;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Update user's updated_at timestamp when any profile table is modified
DELIMITER //
CREATE TRIGGER tr_admins_updated_at
    BEFORE UPDATE ON admins
    FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END //
DELIMITER ;

DELIMITER //
CREATE TRIGGER tr_teachers_updated_at
    BEFORE UPDATE ON teachers
    FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END //
DELIMITER ;

DELIMITER //
CREATE TRIGGER tr_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END //
DELIMITER ;

DELIMITER //
CREATE TRIGGER tr_working_students_updated_at
    BEFORE UPDATE ON working_students
    FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END //
DELIMITER ;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Additional composite indexes for common queries
CREATE INDEX idx_users_type_created ON users(user_type, created_at DESC);
CREATE INDEX idx_login_logs_user_time ON login_logs(user_id, login_time DESC);
CREATE INDEX idx_feedback_date ON feedback(date_submitted DESC);
CREATE INDEX idx_attendance_date_class ON attendance(date DESC, class_id);

-- ============================================================================
-- GRANTS AND PERMISSIONS (Optional - adjust as needed)
-- ============================================================================
-- GRANT SELECT, INSERT, UPDATE, DELETE ON logbookdb.* TO 'logbook_app'@'localhost';
-- FLUSH PRIVILEGES;

-- ============================================================================
-- SCHEMA INFORMATION
-- ============================================================================
-- Schema Version: 2.0
-- Last Updated: 2025-01-14
-- Description: Enhanced schema for digital logbook monitoring system
-- 
-- New Features in v2.0:
-- - Enhanced user authentication with login tracking and account lockout
-- - Improved login logs with IP address, user agent, and status tracking
-- - System settings table for configurable application parameters
-- - Enhanced feedback system with review workflow
-- - Better stored procedures for login/logout and statistics
-- - Automatic timestamp triggers for data integrity
-- - Additional indexes for better query performance
--
-- Tables:
-- - users (main authentication)
-- - admins, teachers, students, working_students (role-specific profiles)
-- - classlist (subjects/classes)
-- - attendance (student attendance records)
-- - login_logs (authentication tracking)
-- - feedback (equipment condition reports)
-- - system_settings (application configuration)
--
-- Views:
-- - v_users_complete (unified user information)
-- - v_login_logs_complete (login logs with user details)
--
-- Stored Procedures:
-- - sp_log_login (enhanced login logging)
-- - sp_log_logout (logout tracking)
-- - sp_get_recent_logins (recent activity)
-- - sp_get_dashboard_stats (system statistics)
-- ============================================================================


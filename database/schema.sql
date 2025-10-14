-- ============================================================================
-- Digital Logbook Database Schema
-- Database: logbookdb
-- Description: Complete database schema for the Digital Logbook Wails Application
-- Version: 3.0 - New Enrollment System
-- ============================================================================

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS logbookdb 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

-- Use the database
USE logbookdb;

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS classlist;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS feedback;
DROP TABLE IF EXISTS login_logs;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS working_students;
DROP TABLE IF EXISTS teachers;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS users;

-- Drop views if they exist
DROP VIEW IF EXISTS v_attendance_complete;
DROP VIEW IF EXISTS v_teacher_classes;
DROP VIEW IF EXISTS v_classlist_complete;
DROP VIEW IF EXISTS v_classes_complete;
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
    profile_photo MEDIUMTEXT COMMENT 'Base64-encoded profile photo data URL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_student_id (student_id),
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
    profile_photo MEDIUMTEXT COMMENT 'Base64-encoded profile photo data URL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_student_id (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SUBJECTS TABLE (Courses with assigned teachers)
-- Note: Subjects are created on-the-fly when working students create classes
-- The UNIQUE constraint on subject_code allows INSERT...ON DUPLICATE KEY UPDATE
-- to handle cases where the same subject code is used multiple times
-- ============================================================================
CREATE TABLE subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_code VARCHAR(20) NOT NULL UNIQUE COMMENT 'Unique subject code (e.g., IT301, CS101)',
    subject_name VARCHAR(200) NOT NULL COMMENT 'Full subject name (e.g., Web Development)',
    teacher_id INT NOT NULL COMMENT 'Primary teacher assigned to this subject',
    description TEXT COMMENT 'Course description (optional)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    INDEX idx_subject_code (subject_code),
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_subject_name (subject_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- CLASSES TABLE (Specific instances of subjects with schedules)
-- ============================================================================
CREATE TABLE classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT NOT NULL COMMENT 'References the subject/course',
    teacher_id INT NOT NULL COMMENT 'Teacher assigned to this class instance',
    schedule VARCHAR(100) COMMENT 'e.g., MWF 1:00-2:00 PM',
    room VARCHAR(50) COMMENT 'e.g., Lab 2',
    year_level VARCHAR(20) COMMENT 'e.g., 3rd Year',
    section VARCHAR(50) COMMENT 'e.g., A, B, C',
    semester VARCHAR(20) COMMENT 'e.g., 1st Semester, 2nd Semester',
    school_year VARCHAR(20) COMMENT 'e.g., 2024-2025',
    created_by INT COMMENT 'Working student who created this class',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Whether class is currently active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES working_students(id) ON DELETE SET NULL,
    INDEX idx_subject_id (subject_id),
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_created_by (created_by),
    INDEX idx_year_section (year_level, section),
    INDEX idx_is_active (is_active),
    INDEX idx_semester_year (semester, school_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- CLASSLIST TABLE (Student enrollment/roster - many-to-many)
-- ============================================================================
CREATE TABLE classlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL COMMENT 'References the class instance',
    student_id INT NOT NULL COMMENT 'References users.id (student or working_student)',
    enrollment_date DATE DEFAULT (CURDATE()) COMMENT 'When student was enrolled',
    status ENUM('active', 'dropped', 'completed') DEFAULT 'active' COMMENT 'Enrollment status',
    enrolled_by INT COMMENT 'Working student who enrolled this student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (enrolled_by) REFERENCES working_students(id) ON DELETE SET NULL,
    UNIQUE KEY unique_enrollment (class_id, student_id),
    INDEX idx_class_id (class_id),
    INDEX idx_student_id (student_id),
    INDEX idx_status (status),
    INDEX idx_enrollment_date (enrollment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ATTENDANCE TABLE
-- ============================================================================
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    classlist_id INT NOT NULL COMMENT 'Links to enrollment record (not directly to class)',
    date DATE NOT NULL,
    time_in TIME,
    time_out TIME,
    status ENUM('present', 'absent', 'late', 'excused') NOT NULL DEFAULT 'present',
    remarks TEXT COMMENT 'Additional notes about attendance',
    recorded_by INT COMMENT 'Teacher who recorded this attendance',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (classlist_id) REFERENCES classlist(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES teachers(id) ON DELETE SET NULL,
    INDEX idx_classlist_id (classlist_id),
    INDEX idx_date (date),
    INDEX idx_status (status),
    UNIQUE KEY unique_attendance (classlist_id, date)
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

-- View: Complete class information with subject and teacher details
CREATE OR REPLACE VIEW v_classes_complete AS
SELECT 
    c.id AS class_id,
    c.subject_id,
    s.subject_code,
    s.subject_name,
    c.teacher_id,
    t.teacher_id AS teacher_code,
    CONCAT(t.last_name, ', ', t.first_name, 
           CASE WHEN t.middle_name IS NOT NULL THEN CONCAT(' ', t.middle_name) ELSE '' END) AS teacher_name,
    c.schedule,
    c.room,
    c.year_level,
    c.section,
    c.semester,
    c.school_year,
    c.is_active,
    c.created_at
FROM classes c
JOIN subjects s ON c.subject_id = s.id
JOIN teachers t ON c.teacher_id = t.id;

-- View: Complete classlist/enrollment with student details
CREATE OR REPLACE VIEW v_classlist_complete AS
SELECT 
    cl.id AS classlist_id,
    cl.class_id,
    cl.student_id,
    cl.status AS enrollment_status,
    u.username,
    u.user_type,
    CASE 
        WHEN u.user_type = 'student' THEN st.student_id
        WHEN u.user_type = 'working_student' THEN ws.student_id
    END AS student_code,
    CASE 
        WHEN u.user_type = 'student' THEN st.first_name
        WHEN u.user_type = 'working_student' THEN ws.first_name
    END AS first_name,
    CASE 
        WHEN u.user_type = 'student' THEN st.middle_name
        WHEN u.user_type = 'working_student' THEN ws.middle_name
    END AS middle_name,
    CASE 
        WHEN u.user_type = 'student' THEN st.last_name
        WHEN u.user_type = 'working_student' THEN ws.last_name
    END AS last_name,
    CASE 
        WHEN u.user_type = 'student' THEN st.year_level
        WHEN u.user_type = 'working_student' THEN ws.year_level
    END AS year_level,
    CASE 
        WHEN u.user_type = 'student' THEN st.section
        WHEN u.user_type = 'working_student' THEN ws.section
    END AS section
FROM classlist cl
JOIN users u ON cl.student_id = u.id
LEFT JOIN students st ON u.id = st.user_id AND u.user_type = 'student'
LEFT JOIN working_students ws ON u.id = ws.user_id AND u.user_type = 'working_student';

-- View: Teacher's classes with enrollment counts
CREATE OR REPLACE VIEW v_teacher_classes AS
SELECT 
    c.id AS class_id,
    c.subject_id,
    s.subject_code,
    s.subject_name,
    c.teacher_id,
    CONCAT(t.last_name, ', ', t.first_name) AS teacher_name,
    c.schedule,
    c.room,
    c.year_level,
    c.section,
    c.semester,
    c.school_year,
    COUNT(DISTINCT cl.student_id) AS enrolled_count,
    c.is_active
FROM classes c
JOIN subjects s ON c.subject_id = s.id
JOIN teachers t ON c.teacher_id = t.id
LEFT JOIN classlist cl ON c.id = cl.class_id AND cl.status = 'active'
GROUP BY c.id, c.subject_id, s.subject_code, s.subject_name, c.teacher_id, 
         teacher_name, c.schedule, c.room, c.year_level, c.section, 
         c.semester, c.school_year, c.is_active;

-- View: Attendance with complete student and class info
CREATE OR REPLACE VIEW v_attendance_complete AS
SELECT 
    a.id AS attendance_id,
    a.classlist_id,
    a.date,
    a.time_in,
    a.time_out,
    a.status,
    a.remarks,
    cl.class_id,
    cl.student_id,
    vcl.student_code,
    vcl.first_name,
    vcl.middle_name,
    vcl.last_name,
    vc.subject_code,
    vc.subject_name,
    vc.teacher_name,
    vc.room,
    vc.year_level,
    vc.section
FROM attendance a
JOIN classlist cl ON a.classlist_id = cl.id
JOIN v_classlist_complete vcl ON cl.id = vcl.classlist_id
JOIN v_classes_complete vc ON cl.class_id = vc.class_id;

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

-- Procedure: Get teacher's classes
DELIMITER //
CREATE PROCEDURE sp_get_teacher_classes(IN p_teacher_id INT)
BEGIN
    SELECT * FROM v_teacher_classes
    WHERE teacher_id = p_teacher_id
    ORDER BY subject_code, year_level, section;
END //
DELIMITER ;

-- Procedure: Get students in a class
DELIMITER //
CREATE PROCEDURE sp_get_class_students(IN p_class_id INT)
BEGIN
    SELECT 
        vcl.classlist_id,
        vcl.student_id,
        vcl.student_code,
        vcl.first_name,
        vcl.middle_name,
        vcl.last_name,
        vcl.year_level,
        vcl.section,
        vcl.enrollment_status
    FROM v_classlist_complete vcl
    WHERE vcl.class_id = p_class_id
    AND vcl.enrollment_status = 'active'
    ORDER BY vcl.last_name, vcl.first_name;
END //
DELIMITER ;

-- Procedure: Enroll student in class
DELIMITER //
CREATE PROCEDURE sp_enroll_student(
    IN p_class_id INT,
    IN p_student_id INT,
    IN p_enrolled_by INT
)
BEGIN
    INSERT INTO classlist (class_id, student_id, enrolled_by, status)
    VALUES (p_class_id, p_student_id, p_enrolled_by, 'active')
    ON DUPLICATE KEY UPDATE status = 'active', updated_at = CURRENT_TIMESTAMP;
END //
DELIMITER ;

-- Procedure: Record attendance
DELIMITER //
CREATE PROCEDURE sp_record_attendance(
    IN p_classlist_id INT,
    IN p_date DATE,
    IN p_time_in TIME,
    IN p_time_out TIME,
    IN p_status VARCHAR(20),
    IN p_recorded_by INT
)
BEGIN
    INSERT INTO attendance (classlist_id, date, time_in, time_out, status, recorded_by)
    VALUES (p_classlist_id, p_date, p_time_in, p_time_out, p_status, p_recorded_by)
    ON DUPLICATE KEY UPDATE 
        time_in = COALESCE(VALUES(time_in), time_in),
        time_out = COALESCE(VALUES(time_out), time_out),
        status = VALUES(status),
        updated_at = CURRENT_TIMESTAMP;
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
CREATE INDEX idx_classes_teacher_active ON classes(teacher_id, is_active);
CREATE INDEX idx_classlist_class_status ON classlist(class_id, status);
CREATE INDEX idx_attendance_date_classlist ON attendance(date DESC, classlist_id);

-- ============================================================================
-- GRANTS AND PERMISSIONS (Optional - adjust as needed)
-- ============================================================================
-- GRANT SELECT, INSERT, UPDATE, DELETE ON logbookdb.* TO 'logbook_app'@'localhost';
-- FLUSH PRIVILEGES;

-- ============================================================================
-- SCHEMA INFORMATION
-- ============================================================================
-- Schema Version: 3.1
-- Last Updated: 2025-10-14
-- Description: New enrollment system with proper subject-class-enrollment structure
-- 
-- New Features in v3.1:
-- - Simplified subject creation: subjects are created on-the-fly when creating classes
-- - Subject code and name are entered as text inputs (no dropdown selection)
-- - INSERT...ON DUPLICATE KEY UPDATE handles duplicate subject codes gracefully
-- - UNIQUE constraint on subject_code enables this workflow
--
-- Features in v3.0:
-- - Separated subjects and class instances
-- - Proper teacher assignment via teacher_id foreign keys
-- - Working students can create and manage classes
-- - Student enrollment managed through classlist table (many-to-many)
-- - Attendance linked to enrollment records (classlist_id)
-- - Support for multiple sections of same subject
-- - Views for complex queries
-- - Stored procedures for common operations
--
-- Workflow:
-- 1. Working student creates a class by entering:
--    - Subject Code (e.g., IT301, CS101)
--    - Subject Name (e.g., Web Development)
--    - Teacher, Schedule, Room, etc.
-- 2. System automatically creates/updates the subject
-- 3. System creates the class linked to that subject
--
-- Tables:
-- - users (main authentication)
-- - admins, teachers, students, working_students (role-specific profiles)
-- - subjects (courses with assigned teachers, created on-the-fly)
-- - classes (specific instances of subjects with schedules)
-- - classlist (student enrollments - many-to-many)
-- - attendance (attendance records linked to enrollments)
-- - login_logs (authentication tracking)
-- - feedback (equipment condition reports)
--
-- Views:
-- - v_users_complete (unified user information)
-- - v_login_logs_complete (login logs with user details)
-- - v_classes_complete (complete class information)
-- - v_classlist_complete (enrollment with student details)
-- - v_teacher_classes (teacher's classes with enrollment counts)
-- - v_attendance_complete (attendance with full details)
--
-- Stored Procedures:
-- - sp_log_login (enhanced login logging)
-- - sp_log_logout (logout tracking)
-- - sp_get_recent_logins (recent activity)
-- - sp_get_dashboard_stats (system statistics)
-- - sp_get_teacher_classes (teacher's classes)
-- - sp_get_class_students (students in a class)
-- - sp_enroll_student (enroll student in class)
-- - sp_record_attendance (record attendance)
-- ============================================================================

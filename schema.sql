-- ============================================
-- Digital Logbook Database Schema
-- ============================================
-- Database: logbookdb
-- Version: 2.0
-- Created: October 9, 2025
-- Description: Complete database schema for Digital Logbook application
-- ============================================

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS logbookdb 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE logbookdb;

-- ============================================
-- Table: users
-- Description: Stores all user accounts (admin, instructor, student, working_student)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL COMMENT 'Unique username for login',
    email VARCHAR(255) UNIQUE COMMENT 'Email address (mainly for admin)',
    password VARCHAR(255) NOT NULL COMMENT 'Hashed password using Argon2',
    name VARCHAR(255) NOT NULL COMMENT 'Full name (formatted as LastName, FirstName)',
    first_name VARCHAR(255) COMMENT 'First name',
    middle_name VARCHAR(255) COMMENT 'Middle name',
    last_name VARCHAR(255) COMMENT 'Last name',
    gender VARCHAR(20) COMMENT 'Gender (Male/Female/Other)',
    role VARCHAR(50) NOT NULL COMMENT 'User role: admin, instructor, student, working_student',
    employee_id VARCHAR(255) UNIQUE COMMENT 'Employee ID for admin/instructor',
    student_id VARCHAR(255) UNIQUE COMMENT 'Student ID for student/working_student',
    year VARCHAR(100) COMMENT 'Year level (e.g., 2nd Yr BSIT)',
    photo_url VARCHAR(500) COMMENT 'URL to user profile photo',
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Account creation date',
    INDEX idx_role (role),
    INDEX idx_employee_id (employee_id),
    INDEX idx_student_id (student_id),
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='User accounts table';

-- ============================================
-- Table: subjects
-- Description: Course/subject information
-- ============================================
CREATE TABLE IF NOT EXISTS subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL COMMENT 'Subject code (e.g., IT101)',
    name VARCHAR(255) NOT NULL COMMENT 'Subject name',
    instructor VARCHAR(255) NOT NULL COMMENT 'Instructor name',
    room VARCHAR(100) NOT NULL COMMENT 'Room/Lab assignment',
    INDEX idx_code (code),
    INDEX idx_instructor (instructor)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Subjects/courses table';

-- ============================================
-- Table: classlists
-- Description: Student enrollment in subjects
-- ============================================
CREATE TABLE IF NOT EXISTS classlists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT NOT NULL COMMENT 'Reference to subject',
    students TEXT COMMENT 'JSON array of student IDs',
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Classlist creation date',
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    INDEX idx_subject_id (subject_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Class enrollment lists';

-- ============================================
-- Table: attendance
-- Description: Student attendance records
-- ============================================
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL COMMENT 'Reference to user (student)',
    subject_id INT NOT NULL COMMENT 'Reference to subject',
    date DATE NOT NULL COMMENT 'Attendance date',
    status VARCHAR(20) NOT NULL COMMENT 'Status: Present, Absent, Seat-in',
    time_in TIME COMMENT 'Time student checked in',
    time_out TIME COMMENT 'Time student checked out',
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    INDEX idx_student_id (student_id),
    INDEX idx_subject_id (subject_id),
    INDEX idx_date (date),
    INDEX idx_status (status),
    UNIQUE KEY unique_student_subject_date (student_id, subject_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Student attendance records';

-- ============================================
-- Table: login_logs
-- Description: User login/logout tracking with PC identification
-- ============================================
CREATE TABLE IF NOT EXISTS login_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT 'Reference to user',
    user_name VARCHAR(255) COMMENT 'User full name (denormalized for reporting)',
    user_type VARCHAR(50) COMMENT 'User role at time of login',
    pc_number VARCHAR(50) COMMENT 'Computer hostname/PC identifier',
    login_time TIMESTAMP NULL COMMENT 'Login timestamp',
    logout_time TIMESTAMP NULL COMMENT 'Logout timestamp',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_login_time (login_time),
    INDEX idx_user_type (user_type),
    INDEX idx_pc_number (pc_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Login/logout activity logs';

-- ============================================
-- Table: feedback
-- Description: Equipment condition reports from students
-- ============================================
CREATE TABLE IF NOT EXISTS feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL COMMENT 'Reference to user (student)',
    student_name VARCHAR(255) COMMENT 'Student full name (denormalized)',
    student_id_str VARCHAR(255) COMMENT 'Student ID string (denormalized)',
    pc_number VARCHAR(50) COMMENT 'Computer/equipment identifier',
    time_in TIME COMMENT 'Check-in time',
    time_out TIME COMMENT 'Check-out time',
    equipment VARCHAR(255) NOT NULL COMMENT 'Equipment name/identifier',
    `condition` VARCHAR(50) NOT NULL COMMENT 'Condition: Good, Fair, Bad',
    comment TEXT COMMENT 'Additional comments/issues reported',
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Report submission date',
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_student_id (student_id),
    INDEX idx_date (date),
    INDEX idx_condition (`condition`),
    INDEX idx_pc_number (pc_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Equipment condition reports';

-- ============================================
-- Views (Optional - for easier querying)
-- ============================================

-- View: Recent login activity
CREATE OR REPLACE VIEW recent_logins AS
SELECT 
    ll.id,
    ll.user_name,
    ll.user_type,
    ll.pc_number,
    ll.login_time,
    ll.logout_time,
    TIMEDIFF(ll.logout_time, ll.login_time) as session_duration
FROM login_logs ll
ORDER BY ll.login_time DESC
LIMIT 100;

-- View: Active sessions (not logged out)
CREATE OR REPLACE VIEW active_sessions AS
SELECT 
    ll.id,
    ll.user_id,
    ll.user_name,
    ll.user_type,
    ll.pc_number,
    ll.login_time,
    TIMEDIFF(NOW(), ll.login_time) as duration
FROM login_logs ll
WHERE ll.logout_time IS NULL
ORDER BY ll.login_time DESC;

-- View: Student attendance summary
CREATE OR REPLACE VIEW attendance_summary AS
SELECT 
    u.id as student_id,
    u.name as student_name,
    u.student_id as student_number,
    s.code as subject_code,
    s.name as subject_name,
    COUNT(CASE WHEN a.status = 'Present' THEN 1 END) as present_count,
    COUNT(CASE WHEN a.status = 'Absent' THEN 1 END) as absent_count,
    COUNT(CASE WHEN a.status = 'Seat-in' THEN 1 END) as seatin_count,
    COUNT(*) as total_records
FROM users u
LEFT JOIN attendance a ON u.id = a.student_id
LEFT JOIN subjects s ON a.subject_id = s.id
WHERE u.role IN ('student', 'working_student')
GROUP BY u.id, s.id
ORDER BY u.name, s.code;

-- View: Equipment reports summary
CREATE OR REPLACE VIEW equipment_reports_summary AS
SELECT 
    pc_number,
    equipment,
    `condition`,
    COUNT(*) as report_count,
    MAX(date) as last_report_date
FROM feedback
GROUP BY pc_number, equipment, `condition`
ORDER BY last_report_date DESC;

-- ============================================
-- Triggers (Optional - for data integrity)
-- ============================================

-- Trigger: Auto-update user name format when created
DELIMITER $$
CREATE TRIGGER before_user_insert
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
    -- Ensure name is formatted as "LastName, FirstName"
    IF NEW.first_name IS NOT NULL AND NEW.last_name IS NOT NULL THEN
        IF NEW.middle_name IS NOT NULL AND NEW.middle_name != '' THEN
            SET NEW.name = CONCAT(NEW.last_name, ', ', NEW.first_name, ' ', NEW.middle_name);
        ELSE
            SET NEW.name = CONCAT(NEW.last_name, ', ', NEW.first_name);
        END IF;
    END IF;
END$$
DELIMITER ;

-- Trigger: Prevent duplicate attendance on same day
DELIMITER $$
CREATE TRIGGER before_attendance_insert
BEFORE INSERT ON attendance
FOR EACH ROW
BEGIN
    DECLARE existing_count INT;
    SELECT COUNT(*) INTO existing_count
    FROM attendance
    WHERE student_id = NEW.student_id
    AND subject_id = NEW.subject_id
    AND date = NEW.date;
    
    IF existing_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Attendance already recorded for this student on this date';
    END IF;
END$$
DELIMITER ;

-- ============================================
-- Initial Data Check
-- ============================================

-- Show all tables
SHOW TABLES;

-- Display table structures
DESCRIBE users;
DESCRIBE subjects;
DESCRIBE classlists;
DESCRIBE attendance;
DESCRIBE login_logs;
DESCRIBE feedback;

-- ============================================
-- Useful Queries for Verification
-- ============================================

-- Count records in each table
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'subjects', COUNT(*) FROM subjects
UNION ALL
SELECT 'classlists', COUNT(*) FROM classlists
UNION ALL
SELECT 'attendance', COUNT(*) FROM attendance
UNION ALL
SELECT 'login_logs', COUNT(*) FROM login_logs
UNION ALL
SELECT 'feedback', COUNT(*) FROM feedback;

-- Show all user roles
SELECT role, COUNT(*) as count 
FROM users 
GROUP BY role;

-- ============================================
-- Notes
-- ============================================
-- 1. Passwords are hashed using Argon2 algorithm by the application
-- 2. Use the sample_data.sql file to populate with test data
-- 3. Foreign keys ensure referential integrity
-- 4. Indexes optimize query performance
-- 5. UTF8MB4 charset supports emoji and international characters
-- 6. ON DELETE CASCADE ensures cleanup when parent records are deleted
-- ============================================


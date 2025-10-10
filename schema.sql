-- ============================================
-- Digital Logbook Monitoring System
-- Database Schema
-- ============================================
-- Database: logbookdb
-- Charset: utf8mb4
-- Engine: InnoDB
-- ============================================

CREATE DATABASE IF NOT EXISTS logbookdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE logbookdb;

-- ============================================
-- 1. USERS TABLE
-- ============================================
-- Stores common login credentials for all users
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE COMMENT 'Employee ID or Student ID (school-assigned)',
    password VARCHAR(255) NOT NULL COMMENT 'Hashed password',
    user_type ENUM('student', 'working_student', 'teacher', 'admin') NOT NULL COMMENT 'Identifies what kind of user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When the account was created',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'When credentials were last updated',
    INDEX idx_username (username),
    INDEX idx_user_type (user_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. STUDENTS TABLE
-- ============================================
-- Stores student information
DROP TABLE IF EXISTS students;
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL UNIQUE COMMENT 'Official school student ID',
    first_name VARCHAR(255) NOT NULL,
    middle_name VARCHAR(255),
    last_name VARCHAR(255) NOT NULL,
    year_level VARCHAR(255) COMMENT 'e.g., 1st Year, 2nd Year',
    section VARCHAR(255) COMMENT 'Section name',
    profile_photo VARCHAR(255) COMMENT 'Profile photo filename or path',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation date',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'When student info is updated',
    INDEX idx_student_id (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. WORKING_STUDENTS TABLE
-- ============================================
-- Similar to students, but tagged as working students
DROP TABLE IF EXISTS working_students;
CREATE TABLE working_students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL UNIQUE COMMENT 'Official school ID',
    first_name VARCHAR(255) NOT NULL,
    middle_name VARCHAR(255),
    last_name VARCHAR(255) NOT NULL,
    year_level VARCHAR(255) COMMENT 'Year level',
    section VARCHAR(255) COMMENT 'Section',
    profile_photo VARCHAR(255) COMMENT 'Profile photo path',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation date',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'When info is updated',
    INDEX idx_student_id (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. TEACHERS TABLE
-- ============================================
-- Stores teacher information
DROP TABLE IF EXISTS teachers;
CREATE TABLE teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL UNIQUE COMMENT 'Official employee ID',
    first_name VARCHAR(255) NOT NULL,
    middle_name VARCHAR(255),
    last_name VARCHAR(255) NOT NULL,
    profile_photo VARCHAR(255) COMMENT 'Profile photo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Created date',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Updated date',
    INDEX idx_teacher_id (teacher_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. ADMINS TABLE
-- ============================================
-- Stores admin information
DROP TABLE IF EXISTS admins;
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL UNIQUE COMMENT 'Employee ID',
    first_name VARCHAR(255) NOT NULL,
    middle_name VARCHAR(255),
    last_name VARCHAR(255) NOT NULL,
    profile_photo VARCHAR(255) COMMENT 'Profile photo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Created date',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Updated date',
    INDEX idx_admin_id (admin_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. CLASSLIST TABLE
-- ============================================
-- Created by working student and managed by teacher
DROP TABLE IF EXISTS classlist;
CREATE TABLE classlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_code VARCHAR(255) NOT NULL COMMENT 'Subject code (e.g., IT101)',
    subject_title VARCHAR(255) NOT NULL COMMENT 'Subject title',
    assigned_teacher VARCHAR(255) COMMENT 'The teacher handling the subject',
    schedule VARCHAR(255) COMMENT 'Class schedule',
    room VARCHAR(255) COMMENT 'Room name or number',
    created_by INT COMMENT 'Working student who created the classlist',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When created',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'When updated',
    FOREIGN KEY (created_by) REFERENCES working_students(id) ON DELETE SET NULL,
    INDEX idx_subject_code (subject_code),
    INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. CLASS_STUDENTS TABLE
-- ============================================
-- Stores students enrolled in a classlist
DROP TABLE IF EXISTS class_students;
CREATE TABLE class_students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL COMMENT 'Class this student belongs to',
    student_id INT NOT NULL COMMENT 'Student ID',
    first_name VARCHAR(255) NOT NULL,
    middle_name VARCHAR(255),
    last_name VARCHAR(255) NOT NULL,
    FOREIGN KEY (class_id) REFERENCES classlist(id) ON DELETE CASCADE,
    INDEX idx_class_id (class_id),
    INDEX idx_student_id (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 8. ATTENDANCE TABLE
-- ============================================
-- Managed and validated by teacher
DROP TABLE IF EXISTS attendance;
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL COMMENT 'The class this attendance belongs to',
    date DATE NOT NULL COMMENT 'Date of attendance',
    student_id INT NOT NULL COMMENT 'Student ID',
    time_in TIME COMMENT 'Time in',
    time_out TIME COMMENT 'Time out',
    status ENUM('Present', 'Absent', 'Late', 'Excused') NOT NULL DEFAULT 'Absent' COMMENT 'Attendance status',
    FOREIGN KEY (class_id) REFERENCES classlist(id) ON DELETE CASCADE,
    INDEX idx_class_id (class_id),
    INDEX idx_date (date),
    INDEX idx_student_id (student_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 9. LOGIN_LOGS TABLE
-- ============================================
-- Records user logins and logouts for tracking purposes
DROP TABLE IF EXISTS login_logs;
CREATE TABLE login_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT 'Employee or student ID',
    user_type ENUM('student', 'working_student', 'teacher', 'admin') NOT NULL COMMENT 'User type',
    pc_number VARCHAR(255) COMMENT 'Computer number',
    login_time DATETIME NOT NULL COMMENT 'Login timestamp',
    logout_time DATETIME COMMENT 'Logout timestamp',
    INDEX idx_user_id (user_id),
    INDEX idx_user_type (user_type),
    INDEX idx_login_time (login_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 10. FEEDBACK TABLE
-- ============================================
-- Submitted by students before logging out
-- Includes condition ratings for computer equipment
DROP TABLE IF EXISTS feedback;
CREATE TABLE feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL COMMENT 'Student ID',
    first_name VARCHAR(255) NOT NULL,
    middle_name VARCHAR(255),
    last_name VARCHAR(255) NOT NULL,
    pc_number VARCHAR(255) COMMENT 'Computer used',
    equipment_condition ENUM('Good', 'Minor Issue', 'Needs Repair', 'Not Working') NOT NULL COMMENT 'General feedback about the PC',
    monitor_condition ENUM('Good', 'Flickering', 'No Display', 'Other') NOT NULL COMMENT 'Monitor condition',
    keyboard_condition ENUM('Good', 'Some Keys Not Working', 'Sticky Keys', 'Other') NOT NULL COMMENT 'Keyboard condition',
    mouse_condition ENUM('Good', 'Not Working', 'Lagging', 'Other') NOT NULL COMMENT 'Mouse condition',
    comments TEXT COMMENT 'Optional additional comments',
    date_submitted DATETIME NOT NULL COMMENT 'When feedback was submitted',
    INDEX idx_student_id (student_id),
    INDEX idx_pc_number (pc_number),
    INDEX idx_date_submitted (date_submitted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DEFAULT ADMIN ACCOUNT
-- ============================================
-- Create default admin user for initial system access
-- Username: ADMIN001
-- Password: ADMIN001 (plain text for development - CHANGE IN PRODUCTION!)

INSERT INTO users (username, password, user_type) 
VALUES ('1', 'ADMIN001', 'admin');

INSERT INTO admins (admin_id, first_name, middle_name, last_name) 
VALUES (1, 'System', NULL, 'Administrator');

-- ============================================
-- END OF SCHEMA
-- ============================================

-- IMPORTANT NOTES:
-- ================
-- 1. All passwords are stored in plain text for development purposes only
--    In production, implement proper password hashing (bcrypt, argon2, etc.)
-- 
-- 2. Default credentials for initial login:
--    Admin Username: ADMIN001
--    Admin Password: ADMIN001
--
-- 3. ⚠️  SECURITY WARNING: Change the default password immediately after deployment!
--
-- 4. Table structure:
--    - 'users' table: Stores login credentials for all user types
--    - 'students', 'working_students', 'teachers', 'admins': Store profile data
--    - 'username' in users table should match the ID fields in respective tables
--
-- 5. Foreign key constraints ensure referential integrity:
--    - classlist.created_by → working_students.id (ON DELETE SET NULL)
--    - class_students.class_id → classlist.id (ON DELETE CASCADE)
--    - attendance.class_id → classlist.id (ON DELETE CASCADE)
--
-- 6. All tables include created_at and updated_at timestamps for audit trails
--
-- 7. The feedback table captures detailed equipment condition information:
--    - equipment_condition: Overall PC condition
--    - monitor_condition: Display issues
--    - keyboard_condition: Keyboard problems
--    - mouse_condition: Mouse functionality
--    - comments: Optional free-text feedback
--
-- 8. Indexes are created on frequently queried columns for performance optimization
--
-- 9. Character set: utf8mb4 for full Unicode support (including emojis)
--
-- 10. Engine: InnoDB for ACID compliance and foreign key support

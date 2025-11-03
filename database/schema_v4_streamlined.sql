-- ============================================================================
-- Digital Logbook Database Schema - STREAMLINED VERSION
-- Database: logbookdb
-- Description: Streamlined database schema for the Digital Logbook Wails Application
-- Version: 4.2 - Streamlined (Removed Unused Fields)
-- Last Updated: 2025-01-27
-- ============================================================================

-- ============================================================================
-- DATABASE CREATION
-- ============================================================================
CREATE DATABASE IF NOT EXISTS logbookdb 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

USE logbookdb;

-- ============================================================================
-- DROP EXISTING TABLES (in correct order due to foreign keys)
-- ============================================================================
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

-- ============================================================================
-- DROP EXISTING VIEWS
-- ============================================================================
DROP VIEW IF EXISTS v_attendance_complete;
DROP VIEW IF EXISTS v_teacher_classes;
DROP VIEW IF EXISTS v_classlist_complete;
DROP VIEW IF EXISTS v_classes_complete;
DROP VIEW IF EXISTS v_users_complete;
DROP VIEW IF EXISTS v_login_logs_complete;
DROP VIEW IF EXISTS v_feedback;

-- ============================================================================
-- USERS TABLE (Main authentication table)
-- Core entity for all user types in the system
-- ============================================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique login username',
    password VARCHAR(255) NOT NULL COMMENT 'User password (should be hashed in production)',
    user_type ENUM('admin', 'teacher', 'student', 'working_student') NOT NULL COMMENT 'User role type',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'User account active status',
    last_login TIMESTAMP NULL COMMENT 'Last successful login timestamp',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Account creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    
    -- Indexes for performance
    INDEX idx_username (username),
    INDEX idx_user_type (user_type),
    INDEX idx_is_active (is_active),
    INDEX idx_last_login (last_login)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Core users table - authentication and user management';

-- ============================================================================
-- ADMINS TABLE
-- Profile information for administrator users
-- ============================================================================
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE COMMENT 'Foreign key to users table',
    admin_id VARCHAR(50) UNIQUE COMMENT 'Admin employee ID',
    first_name VARCHAR(100) NOT NULL COMMENT 'Admin first name',
    middle_name VARCHAR(100) NULL COMMENT 'Admin middle name (optional)',
    last_name VARCHAR(100) NOT NULL COMMENT 'Admin last name',
    gender ENUM('Male', 'Female', 'Other') NULL COMMENT 'Gender',
    email VARCHAR(255) NULL COMMENT 'Admin email address',
    profile_photo MEDIUMTEXT NULL COMMENT 'Base64-encoded profile photo data URL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_user_id (user_id),
    INDEX idx_admin_id (admin_id),
    INDEX idx_admin_email (email),
    INDEX idx_admin_name (last_name, first_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Administrator profile information';

-- ============================================================================
-- TEACHERS TABLE
-- Profile information for teacher users
-- ============================================================================
CREATE TABLE teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE COMMENT 'Foreign key to users table',
    teacher_id VARCHAR(50) UNIQUE COMMENT 'Teacher employee ID',
    first_name VARCHAR(100) NOT NULL COMMENT 'Teacher first name',
    middle_name VARCHAR(100) NULL COMMENT 'Teacher middle name (optional)',
    last_name VARCHAR(100) NOT NULL COMMENT 'Teacher last name',
    gender ENUM('Male', 'Female', 'Other') NULL COMMENT 'Gender',
    email VARCHAR(255) NULL COMMENT 'Teacher email address',
    contact_number VARCHAR(20) NULL COMMENT 'Teacher contact number',
    profile_photo MEDIUMTEXT NULL COMMENT 'Base64-encoded profile photo data URL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_user_id (user_id),
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_teacher_email (email),
    INDEX idx_teacher_name (last_name, first_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Teacher profile information';

-- ============================================================================
-- STUDENTS TABLE
-- Profile information for regular student users
-- ============================================================================
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE COMMENT 'Foreign key to users table',
    student_id VARCHAR(50) UNIQUE COMMENT 'Student ID number',
    first_name VARCHAR(100) NOT NULL COMMENT 'Student first name',
    middle_name VARCHAR(100) NULL COMMENT 'Student middle name (optional)',
    last_name VARCHAR(100) NOT NULL COMMENT 'Student last name',
    gender ENUM('Male', 'Female', 'Other') NULL COMMENT 'Gender',
    email VARCHAR(255) NULL COMMENT 'Student email address',
    contact_number VARCHAR(20) NULL COMMENT 'Student contact number',
    year_level VARCHAR(20) NULL COMMENT 'e.g., 1st Year, 2nd Year, 3rd Year, 4th Year',
    section VARCHAR(50) NULL COMMENT 'Class section (e.g., A, B, C)',
    profile_photo MEDIUMTEXT NULL COMMENT 'Base64-encoded profile photo data URL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_user_id (user_id),
    INDEX idx_student_id (student_id),
    INDEX idx_year_level (year_level),
    INDEX idx_student_email (email),
    INDEX idx_student_name (last_name, first_name),
    INDEX idx_year_section (year_level, section)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Regular student profile information';

-- ============================================================================
-- WORKING STUDENTS TABLE
-- Profile information for working student users (student assistants)
-- ============================================================================
CREATE TABLE working_students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE COMMENT 'Foreign key to users table',
    student_id VARCHAR(50) UNIQUE COMMENT 'Student ID number',
    first_name VARCHAR(100) NOT NULL COMMENT 'Student first name',
    middle_name VARCHAR(100) NULL COMMENT 'Student middle name (optional)',
    last_name VARCHAR(100) NOT NULL COMMENT 'Student last name',
    gender ENUM('Male', 'Female', 'Other') NULL COMMENT 'Gender',
    email VARCHAR(255) NULL COMMENT 'Working student email address',
    contact_number VARCHAR(20) NULL COMMENT 'Working student contact number',
    year_level VARCHAR(20) NULL COMMENT 'e.g., 1st Year, 2nd Year, 3rd Year, 4th Year',
    section VARCHAR(50) NULL COMMENT 'Class section (e.g., A, B, C)',
    profile_photo MEDIUMTEXT NULL COMMENT 'Base64-encoded profile photo data URL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_user_id (user_id),
    INDEX idx_student_id (student_id),
    INDEX idx_year_level (year_level),
    INDEX idx_working_student_email (email),
    INDEX idx_working_student_name (last_name, first_name),
    INDEX idx_year_section (year_level, section)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Working student (student assistant) profile information';

-- ============================================================================
-- SUBJECTS TABLE
-- Courses/Subjects with assigned teachers
-- ============================================================================
CREATE TABLE subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_code VARCHAR(20) NOT NULL UNIQUE COMMENT 'Unique subject code (e.g., IT301, CS101, MATH101)',
    subject_name VARCHAR(200) NOT NULL COMMENT 'Full subject name (e.g., Web Development, Data Structures)',
    teacher_id INT NOT NULL COMMENT 'Primary teacher assigned to this subject',
    description TEXT NULL COMMENT 'Course description (optional)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_subject_code (subject_code),
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_subject_name (subject_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Subjects/Courses - created on-the-fly with UNIQUE constraint for duplicate handling';

-- ============================================================================
-- CLASSES TABLE
-- Specific instances of subjects with schedules, rooms, and sections
-- ============================================================================
CREATE TABLE classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT NOT NULL COMMENT 'References the subject/course',
    teacher_id INT NOT NULL COMMENT 'Teacher assigned to this class instance',
    schedule VARCHAR(100) NULL COMMENT 'Class schedule (e.g., MWF 1:00-2:00 PM, TTh 10:00-11:30 AM)',
    room VARCHAR(50) NULL COMMENT 'Classroom/Lab location (e.g., Lab 2, Room 301)',
    year_level VARCHAR(20) NULL COMMENT 'Target year level (e.g., 1st Year, 2nd Year)',
    section VARCHAR(50) NULL COMMENT 'Class section (e.g., A, B, C, BSIT-3A)',
    semester VARCHAR(20) NULL COMMENT 'Academic semester (e.g., 1st Semester, 2nd Semester)',
    school_year VARCHAR(20) NULL COMMENT 'Academic year (e.g., 2024-2025, 2025-2026)',
    created_by INT NULL COMMENT 'Working student who created this class',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Whether class is currently active/ongoing',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES working_students(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_subject_id (subject_id),
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_created_by (created_by),
    INDEX idx_year_section (year_level, section),
    INDEX idx_is_active (is_active),
    INDEX idx_semester_year (semester, school_year),
    INDEX idx_classes_teacher_active (teacher_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Class instances - specific sections of subjects with schedules';

-- ============================================================================
-- CLASSLIST TABLE
-- Student enrollment/roster - Many-to-Many relationship between classes and students
-- ============================================================================
CREATE TABLE classlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL COMMENT 'References the class instance',
    student_id INT NOT NULL COMMENT 'References users.id (student or working_student)',
    enrollment_date DATE DEFAULT (CURDATE()) COMMENT 'Date when student was enrolled',
    status ENUM('active', 'dropped', 'completed') DEFAULT 'active' COMMENT 'Enrollment status',
    enrolled_by INT NULL COMMENT 'Working student who enrolled this student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (enrolled_by) REFERENCES working_students(id) ON DELETE SET NULL,
    
    -- Unique constraint to prevent duplicate enrollments
    UNIQUE KEY unique_enrollment (class_id, student_id),
    
    -- Indexes
    INDEX idx_class_id (class_id),
    INDEX idx_student_id (student_id),
    INDEX idx_status (status),
    INDEX idx_enrollment_date (enrollment_date),
    INDEX idx_classlist_class_status (class_id, status),
    INDEX idx_classlist_student_status (student_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Student enrollment roster - links students to classes';

-- ============================================================================
-- ATTENDANCE TABLE
-- Records student attendance for class sessions
-- ============================================================================
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    classlist_id INT NOT NULL COMMENT 'Links to enrollment record (not directly to class)',
    date DATE NOT NULL COMMENT 'Attendance date',
    time_in TIME NULL COMMENT 'Time student checked in',
    time_out TIME NULL COMMENT 'Time student checked out',
    pc_number VARCHAR(20) NULL COMMENT 'PC/Computer number used by student',
    status ENUM('present', 'absent', 'late', 'excused') NOT NULL DEFAULT 'present' COMMENT 'Attendance status',
    remarks TEXT NULL COMMENT 'Additional notes about attendance (e.g., reason for absence)',
    recorded_by INT NULL COMMENT 'Teacher who recorded this attendance',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (classlist_id) REFERENCES classlist(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES teachers(id) ON DELETE SET NULL,
    
    -- Unique constraint to prevent duplicate attendance records for same student on same date
    UNIQUE KEY unique_attendance (classlist_id, date),
    
    -- Indexes
    INDEX idx_classlist_id (classlist_id),
    INDEX idx_date (date),
    INDEX idx_status (status),
    INDEX idx_attendance_date_classlist (date DESC, classlist_id),
    INDEX idx_pc_number (pc_number),
    INDEX idx_attendance_status_date (status, date DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Student attendance records linked to enrollments';

-- ============================================================================
-- LOGIN LOGS TABLE
-- Tracks user login/logout activities for security and auditing
-- ============================================================================
CREATE TABLE login_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT 'User who logged in',
    user_type ENUM('admin', 'teacher', 'student', 'working_student') NOT NULL COMMENT 'Type of user',
    pc_number VARCHAR(50) NULL COMMENT 'Computer/PC identification',
    login_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Login timestamp',
    logout_time DATETIME NULL COMMENT 'Logout timestamp (NULL if still logged in)',
    login_status ENUM('success', 'failed', 'logout') DEFAULT 'success' COMMENT 'Login attempt result',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_user_id (user_id),
    INDEX idx_login_time (login_time),
    INDEX idx_user_type (user_type),
    INDEX idx_pc_number (pc_number),
    INDEX idx_login_status (login_status),
    INDEX idx_login_logs_user_time (user_id, login_time DESC),
    INDEX idx_login_logs_user_type (user_id, user_type),
    INDEX idx_login_logs_status_time (login_status, login_time DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Login/logout activity logs for security and auditing';

-- ============================================================================
-- FEEDBACK TABLE
-- Equipment condition reports and facility feedback from students
-- ============================================================================
CREATE TABLE feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL COMMENT 'Student who submitted the feedback',
    first_name VARCHAR(100) NOT NULL COMMENT 'Student first name (denormalized for reporting)',
    middle_name VARCHAR(100) NULL COMMENT 'Student middle name (denormalized)',
    last_name VARCHAR(100) NOT NULL COMMENT 'Student last name (denormalized)',
    pc_number VARCHAR(50) NOT NULL COMMENT 'PC/Computer number being reported',
    equipment_condition ENUM('Good', 'Minor Issue', 'Not Working') NOT NULL DEFAULT 'Good' COMMENT 'Overall equipment condition',
    monitor_condition ENUM('Good', 'Minor Issue', 'Not Working') NOT NULL DEFAULT 'Good' COMMENT 'Monitor condition',
    keyboard_condition ENUM('Good', 'Minor Issue', 'Not Working') NOT NULL DEFAULT 'Good' COMMENT 'Keyboard condition',
    mouse_condition ENUM('Good', 'Minor Issue', 'Not Working') NOT NULL DEFAULT 'Good' COMMENT 'Mouse condition',
    comments TEXT NULL COMMENT 'Additional comments or details',
    status ENUM('pending', 'forwarded', 'resolved') DEFAULT 'pending' COMMENT 'Feedback workflow status',
    forwarded_by INT NULL COMMENT 'Working student who forwarded to admin',
    forwarded_at DATETIME NULL COMMENT 'Timestamp when forwarded',
    reviewed_by INT NULL COMMENT 'Admin/Teacher who reviewed the feedback',
    reviewed_at TIMESTAMP NULL COMMENT 'Timestamp when reviewed',
    date_submitted DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Submission timestamp',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (forwarded_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_student_id (student_id),
    INDEX idx_date_submitted (date_submitted),
    INDEX idx_feedback_date (date_submitted DESC),
    INDEX idx_pc_number (pc_number),
    INDEX idx_status (status),
    INDEX idx_equipment_condition (equipment_condition),
    INDEX idx_forwarded_by (forwarded_by),
    INDEX idx_feedback_status_date (status, date_submitted DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Equipment condition feedback and facility reports';

-- ============================================================================
-- VIEWS FOR COMPLEX QUERIES
-- Simplify common queries by joining related tables
-- ============================================================================

-- ----------------------------------------------------------------------------
-- VIEW: v_users_complete
-- Unified view of all user information regardless of type
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_users_complete AS
SELECT 
    u.id,
    u.username,
    u.user_type,
    u.is_active,
    u.last_login,
    u.created_at,
    
    -- Personal information (role-specific)
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
    
    -- Contact information
    CASE 
        WHEN u.user_type = 'admin' THEN a.email
        WHEN u.user_type = 'teacher' THEN t.email
        WHEN u.user_type = 'student' THEN s.email
        WHEN u.user_type = 'working_student' THEN ws.email
    END AS email,
    CASE 
        WHEN u.user_type = 'student' THEN s.contact_number
        WHEN u.user_type = 'working_student' THEN ws.contact_number
    END AS contact_number,
    
    -- ID numbers
    CASE 
        WHEN u.user_type = 'admin' THEN a.admin_id
        WHEN u.user_type = 'teacher' THEN t.teacher_id
    END AS employee_id,
    CASE 
        WHEN u.user_type = 'student' THEN s.student_id
        WHEN u.user_type = 'working_student' THEN ws.student_id
    END AS student_id_str,
    
    -- Academic information (students only)
    CASE 
        WHEN u.user_type = 'student' THEN s.year_level
        WHEN u.user_type = 'working_student' THEN ws.year_level
    END AS year_level,
    CASE 
        WHEN u.user_type = 'student' THEN s.section
        WHEN u.user_type = 'working_student' THEN ws.section
    END AS section,
    
    -- Profile photo
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

-- ----------------------------------------------------------------------------
-- VIEW: v_login_logs_complete
-- Login logs enriched with user details
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_login_logs_complete AS
SELECT 
    ll.id,
    ll.user_id,
    ll.user_type,
    ll.pc_number,
    ll.login_time,
    ll.logout_time,
    ll.login_status,
    vu.first_name,
    vu.middle_name,
    vu.last_name,
    CONCAT(
        vu.last_name, ', ', vu.first_name, 
        CASE WHEN vu.middle_name IS NOT NULL THEN CONCAT(' ', vu.middle_name) ELSE '' END
    ) AS full_name
FROM login_logs ll
JOIN v_users_complete vu ON ll.user_id = vu.id;

-- ----------------------------------------------------------------------------
-- VIEW: v_classes_complete
-- Complete class information with subject and teacher details
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_classes_complete AS
SELECT 
    c.id AS class_id,
    c.subject_id,
    s.subject_code,
    s.subject_name,
    c.teacher_id,
    t.teacher_id AS teacher_code,
    CONCAT(
        t.last_name, ', ', t.first_name, 
        CASE WHEN t.middle_name IS NOT NULL THEN CONCAT(' ', t.middle_name) ELSE '' END
    ) AS teacher_name,
    c.schedule,
    c.room,
    c.year_level,
    c.section,
    c.semester,
    c.school_year,
    c.is_active,
    c.created_by,
    c.created_at
FROM classes c
JOIN subjects s ON c.subject_id = s.id
JOIN teachers t ON c.teacher_id = t.id;

-- ----------------------------------------------------------------------------
-- VIEW: v_classlist_complete
-- Complete enrollment information with student details
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_classlist_complete AS
SELECT 
    cl.id AS classlist_id,
    cl.class_id,
    cl.student_id,
    cl.enrollment_date,
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

-- ============================================================================
-- SCHEMA VERSION INFORMATION
-- ============================================================================
/*
Schema Version: 4.2 - Streamlined
Last Updated: 2025-01-27
Database: logbookdb

STREAMLINED FEATURES:
✓ Complete user management (4 user types with profiles)
✓ Email fields for all user types
✓ Contact numbers for students and working students
✓ Subject and class management with on-the-fly creation
✓ Student enrollment system (many-to-many)
✓ Attendance tracking with PC numbers
✓ Equipment feedback system with workflow (pending/forwarded/resolved)
✓ Login/logout tracking with session management
✓ Essential views for complex queries
✓ Optimized indexes for query performance (40+ indexes)
✓ Complete foreign key relationships
✓ Cascade delete rules for data integrity
✓ Streamlined for production use

REMOVED UNUSED FEATURES:
❌ login_attempts, locked_until (security features not used in app)
❌ ip_address, user_agent, session_duration (login tracking details not used)
❌ working_student_notes, resolution_notes (feedback workflow details not used)
❌ failure_reason (login failure details not used)
❌ Stored procedures (not used in application)
❌ Triggers (not used in application)
❌ Complex views (only essential views kept)

ENTITY SUMMARY:
- USERS: Core authentication (8 fields) - streamlined from 11
- ADMINS: Admin profiles (10 fields) - unchanged
- TEACHERS: Teacher profiles (10 fields) - unchanged
- STUDENTS: Student profiles (12 fields) - unchanged
- WORKING_STUDENTS: Working student profiles (12 fields) - unchanged
- SUBJECTS: Courses/subjects (7 fields) - unchanged
- CLASSES: Class instances (13 fields) - unchanged
- CLASSLIST: Student enrollments (8 fields) - unchanged
- ATTENDANCE: Attendance records (11 fields) - unchanged
- LOGIN_LOGS: Login tracking (8 fields) - streamlined from 12
- FEEDBACK: Equipment feedback (15 fields) - streamlined from 18

VIEW SUMMARY:
- v_users_complete: Unified user information
- v_login_logs_complete: Login logs with user details
- v_classes_complete: Complete class information
- v_classlist_complete: Enrollment with student details

TOTAL TABLES: 11
TOTAL VIEWS: 4 (streamlined from 7)
TOTAL INDEXES: 40+ (streamlined from 60+)
PERFORMANCE: Optimized for production use
*/

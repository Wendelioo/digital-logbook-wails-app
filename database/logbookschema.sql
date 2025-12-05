-- ============================================================================
-- Digital Logbook Database Schema
-- Updated: 2024
-- ============================================================================
-- This schema includes all tables, views, and relationships for the
-- Digital Logbook application with support for:
-- - User management (Admin, Teacher, Student, Working Student)
-- - Department management
-- - Subject and Class management
-- - Attendance tracking
-- - Equipment feedback system
-- - Login logging
-- ============================================================================

CREATE DATABASE IF NOT EXISTS logbookdb 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

USE logbookdb;

-- Drop existing tables and views (in reverse dependency order)
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
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS users;

DROP VIEW IF EXISTS v_classlist_complete;
DROP VIEW IF EXISTS v_classes_complete;
DROP VIEW IF EXISTS v_users_complete;
DROP VIEW IF EXISTS v_login_logs_complete;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users table: Base authentication and authorization
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    user_type ENUM('admin', 'teacher', 'student', 'working_student') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_username (username),
    INDEX idx_user_type (user_type),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Departments table: Academic departments
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    department_code VARCHAR(20) NOT NULL UNIQUE,
    department_name VARCHAR(200) NOT NULL,
    description TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_department_code (department_code),
    INDEX idx_department_name (department_name),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admins table: Administrator user details
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    admin_id VARCHAR(50) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100) NULL,
    last_name VARCHAR(100) NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NULL,
    email VARCHAR(255) NULL,
    contact_number VARCHAR(20) NULL,
    profile_photo MEDIUMTEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_user_id (user_id),
    INDEX idx_admin_id (admin_id),
    INDEX idx_admin_email (email),
    INDEX idx_admin_name (last_name, first_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Teachers table: Teacher user details
CREATE TABLE teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    teacher_id VARCHAR(50) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100) NULL,
    last_name VARCHAR(100) NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NULL,
    email VARCHAR(255) NULL,
    contact_number VARCHAR(20) NULL,
    department_id INT NULL,
    profile_photo MEDIUMTEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    
    INDEX idx_user_id (user_id),
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_teacher_email (email),
    INDEX idx_teacher_name (last_name, first_name),
    INDEX idx_department_id (department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Students table: Regular student user details
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    student_id VARCHAR(50) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100) NULL,
    last_name VARCHAR(100) NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NULL,
    email VARCHAR(255) NULL,
    contact_number VARCHAR(20) NULL,
    profile_photo MEDIUMTEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_user_id (user_id),
    INDEX idx_student_id (student_id),
    INDEX idx_student_email (email),
    INDEX idx_student_name (last_name, first_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Working Students table: Working student user details
CREATE TABLE working_students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    student_id VARCHAR(50) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100) NULL,
    last_name VARCHAR(100) NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NULL,
    email VARCHAR(255) NULL,
    contact_number VARCHAR(20) NULL,
    profile_photo MEDIUMTEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_user_id (user_id),
    INDEX idx_student_id (student_id),
    INDEX idx_working_student_email (email),
    INDEX idx_working_student_name (last_name, first_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ACADEMIC TABLES
-- ============================================================================

-- Subjects table: Course subjects
CREATE TABLE subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_code VARCHAR(20) NOT NULL UNIQUE COMMENT 'Manually entered subject code (e.g., IT301, CS101)',
    subject_name VARCHAR(200) NOT NULL,
    teacher_id INT NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    
    INDEX idx_subject_code (subject_code),
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_subject_name (subject_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Classes table: Class instances of subjects
CREATE TABLE classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT NOT NULL,
    teacher_id INT NOT NULL,
    offering_code VARCHAR(50) NULL,
    schedule VARCHAR(100) NULL,
    room VARCHAR(50) NULL,
    year_level VARCHAR(20) NULL,
    section VARCHAR(50) NULL,
    semester VARCHAR(20) NULL,
    school_year VARCHAR(20) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NULL COMMENT 'Working student ID who created this class',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES working_students(id) ON DELETE SET NULL,
    
    INDEX idx_subject_id (subject_id),
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_year_section (year_level, section),
    INDEX idx_is_active (is_active),
    INDEX idx_semester_year (semester, school_year),
    INDEX idx_classes_teacher_active (teacher_id, is_active),
    INDEX idx_offering_code (offering_code),
    INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Classlist table: Student enrollments in classes
CREATE TABLE classlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    student_id INT NOT NULL,
    enrollment_date DATE DEFAULT (CURDATE()),
    status ENUM('active', 'dropped', 'completed') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_enrollment (class_id, student_id),
    
    INDEX idx_class_id (class_id),
    INDEX idx_student_id (student_id),
    INDEX idx_status (status),
    INDEX idx_enrollment_date (enrollment_date),
    INDEX idx_classlist_class_status (class_id, status),
    INDEX idx_classlist_student_status (student_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Attendance table: Student attendance records
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    classlist_id INT NOT NULL,
    date DATE NOT NULL,
    time_in TIME NULL,
    time_out TIME NULL,
    pc_number VARCHAR(20) NULL,
    status ENUM('present', 'absent', 'late', 'excused') NOT NULL DEFAULT 'present',
    remarks TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (classlist_id) REFERENCES classlist(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_attendance (classlist_id, date),
    
    INDEX idx_classlist_id (classlist_id),
    INDEX idx_date (date),
    INDEX idx_status (status),
    INDEX idx_attendance_date_classlist (date DESC, classlist_id),
    INDEX idx_pc_number (pc_number),
    INDEX idx_attendance_status_date (status, date DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SYSTEM TABLES
-- ============================================================================

-- Login Logs table: User login/logout tracking
CREATE TABLE login_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    pc_number VARCHAR(50) NULL,
    login_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    logout_time DATETIME NULL,
    login_status ENUM('success', 'failed', 'logout') DEFAULT 'success',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_user_id (user_id),
    INDEX idx_login_time (login_time),
    INDEX idx_pc_number (pc_number),
    INDEX idx_login_status (login_status),
    INDEX idx_login_logs_user_time (user_id, login_time DESC),
    INDEX idx_login_logs_status_time (login_status, login_time DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Feedback table: Equipment feedback from students
CREATE TABLE feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    pc_number VARCHAR(50) NOT NULL,
    equipment_condition ENUM('Good', 'Minor Issue', 'Not Working') NOT NULL DEFAULT 'Good',
    monitor_condition ENUM('Good', 'Minor Issue', 'Not Working') NOT NULL DEFAULT 'Good',
    keyboard_condition ENUM('Good', 'Minor Issue', 'Not Working') NOT NULL DEFAULT 'Good',
    mouse_condition ENUM('Good', 'Minor Issue', 'Not Working') NOT NULL DEFAULT 'Good',
    comments TEXT NULL,
    working_student_notes TEXT NULL,
    status ENUM('pending', 'forwarded', 'resolved') DEFAULT 'pending',
    forwarded_by INT NULL,
    forwarded_at DATETIME NULL,
    reviewed_by INT NULL,
    date_submitted DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (forwarded_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_student_id (student_id),
    INDEX idx_date_submitted (date_submitted),
    INDEX idx_feedback_date (date_submitted DESC),
    INDEX idx_pc_number (pc_number),
    INDEX idx_status (status),
    INDEX idx_equipment_condition (equipment_condition),
    INDEX idx_forwarded_by (forwarded_by),
    INDEX idx_forwarded_at (forwarded_at),
    INDEX idx_feedback_status_date (status, date_submitted DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Complete Users View: Unified view of all user types with their details
CREATE OR REPLACE VIEW v_users_complete AS
SELECT 
    u.id,
    u.username,
    u.user_type,
    u.is_active,
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
        WHEN u.user_type = 'admin' THEN a.email
        WHEN u.user_type = 'teacher' THEN t.email
        WHEN u.user_type = 'student' THEN s.email
        WHEN u.user_type = 'working_student' THEN ws.email
    END AS email,
    CASE 
        WHEN u.user_type = 'admin' THEN a.contact_number
        WHEN u.user_type = 'teacher' THEN t.contact_number
        WHEN u.user_type = 'student' THEN s.contact_number
        WHEN u.user_type = 'working_student' THEN ws.contact_number
    END AS contact_number,
    CASE 
        WHEN u.user_type = 'admin' THEN a.admin_id
        WHEN u.user_type = 'teacher' THEN t.teacher_id
    END AS employee_id,
    CASE 
        WHEN u.user_type = 'student' THEN s.student_id
        WHEN u.user_type = 'working_student' THEN ws.student_id
    END AS student_id_str,
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

-- Complete Login Logs View: Login logs with user details
CREATE OR REPLACE VIEW v_login_logs_complete AS
SELECT 
    ll.id,
    ll.user_id,
    vu.user_type,
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

-- Complete Classes View: Classes with subject and teacher details
CREATE OR REPLACE VIEW v_classes_complete AS
SELECT 
    c.id AS class_id,
    c.subject_id,
    s.subject_code,
    s.subject_name,
    c.offering_code,
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
    c.created_at
FROM classes c
JOIN subjects s ON c.subject_id = s.id
JOIN teachers t ON c.teacher_id = t.id;

-- Complete Classlist View: Class enrollments with student details
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
    END AS last_name
FROM classlist cl
JOIN users u ON cl.student_id = u.id
LEFT JOIN students st ON u.id = st.user_id AND u.user_type = 'student'
LEFT JOIN working_students ws ON u.id = ws.user_id AND u.user_type = 'working_student';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

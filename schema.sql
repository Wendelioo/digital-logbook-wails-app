-- ============================================
-- Digital Logbook Database Schema
-- ============================================
-- Database: logbookdb
-- Charset: utf8mb4
-- Engine: InnoDB
-- ============================================

-- Create database
CREATE DATABASE IF NOT EXISTS logbookdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE logbookdb;

-- ============================================
-- 1. USERS TABLE (Master Login Table)
-- ============================================
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE COMMENT 'Employee ID for admin/teacher, Student ID for student/working_student',
    password VARCHAR(255) NOT NULL COMMENT 'Hashed password (Argon2id)',
    user_type ENUM('admin', 'teacher', 'student', 'working_student') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_user_type (user_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Master login table for all users';

-- ============================================
-- 2. ADMIN TABLE
-- ============================================
DROP TABLE IF EXISTS admin;
CREATE TABLE admin (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    last_name VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    middle_name VARCHAR(255),
    profile VARCHAR(500) COMMENT 'Profile image path',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Admin profile information';

-- ============================================
-- 3. TEACHER TABLE
-- ============================================
DROP TABLE IF EXISTS teacher;
CREATE TABLE teacher (
    teacher_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    last_name VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    middle_name VARCHAR(255),
    profile VARCHAR(500) COMMENT 'Profile image path',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Teacher profile information';

-- ============================================
-- 4. STUDENT TABLE
-- ============================================
DROP TABLE IF EXISTS student;
CREATE TABLE student (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    student_no VARCHAR(255) NOT NULL UNIQUE COMMENT 'Unique student ID number',
    first_name VARCHAR(255) NOT NULL,
    middle_name VARCHAR(255),
    last_name VARCHAR(255) NOT NULL,
    year_level VARCHAR(50),
    section VARCHAR(50),
    profile VARCHAR(500) COMMENT 'Profile image path',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_student_no (student_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Student profile information';

-- ============================================
-- 5. WORKING_STUDENT TABLE
-- ============================================
DROP TABLE IF EXISTS working_student;
CREATE TABLE working_student (
    working_student_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    student_no VARCHAR(255) NOT NULL UNIQUE COMMENT 'Same ID as student',
    first_name VARCHAR(255) NOT NULL,
    middle_name VARCHAR(255),
    last_name VARCHAR(255) NOT NULL,
    year_level VARCHAR(50),
    section VARCHAR(50),
    profile VARCHAR(500) COMMENT 'Profile image path',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_student_no (student_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Working student profile information';

-- ============================================
-- 6. CLASSLIST TABLE
-- ============================================
DROP TABLE IF EXISTS classlist;
CREATE TABLE classlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_code VARCHAR(50) NOT NULL,
    subject_title VARCHAR(255) NOT NULL,
    teacher_id INT NOT NULL,
    schedule VARCHAR(255),
    room VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teacher(teacher_id) ON DELETE CASCADE,
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_subject_code (subject_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Class lists created by working students, managed by teachers';

-- ============================================
-- 7. CLASSLIST_STUDENTS TABLE
-- ============================================
DROP TABLE IF EXISTS classlist_students;
CREATE TABLE classlist_students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    classlist_id INT NOT NULL,
    student_id INT NOT NULL,
    FOREIGN KEY (classlist_id) REFERENCES classlist(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES student(student_id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (classlist_id, student_id),
    INDEX idx_classlist_id (classlist_id),
    INDEX idx_student_id (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Links students to class lists';

-- ============================================
-- 8. ATTENDANCE TABLE
-- ============================================
DROP TABLE IF EXISTS attendance;
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    classlist_id INT NOT NULL,
    date DATE NOT NULL,
    FOREIGN KEY (classlist_id) REFERENCES classlist(id) ON DELETE CASCADE,
    UNIQUE KEY unique_attendance_date (classlist_id, date),
    INDEX idx_classlist_id (classlist_id),
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Attendance sessions managed by teachers';

-- ============================================
-- 9. ATTENDANCE_RECORDS TABLE
-- ============================================
DROP TABLE IF EXISTS attendance_records;
CREATE TABLE attendance_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attendance_id INT NOT NULL,
    student_id INT NOT NULL,
    time_in TIME,
    time_out TIME,
    status ENUM('Present', 'Late', 'Absent', 'Excused') NOT NULL DEFAULT 'Absent',
    FOREIGN KEY (attendance_id) REFERENCES attendance(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES student(student_id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_attendance (attendance_id, student_id),
    INDEX idx_attendance_id (attendance_id),
    INDEX idx_student_id (student_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Individual student attendance records';

-- ============================================
-- 10. LOGIN_LOGS TABLE
-- ============================================
DROP TABLE IF EXISTS login_logs;
CREATE TABLE login_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    user_type ENUM('student', 'working_student', 'teacher', 'admin') NOT NULL,
    pc_number VARCHAR(100),
    login_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    logout_time TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_user_type (user_type),
    INDEX idx_login_time (login_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User login/logout tracking managed by admin';

-- ============================================
-- 11. FEEDBACK SURVEY SYSTEM
-- ============================================

-- Feedback Questions Table
DROP TABLE IF EXISTS feedback_questions;
CREATE TABLE feedback_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_text TEXT NOT NULL,
    question_type ENUM('multiple_choice', 'text') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_question_type (question_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Survey questions for students and working students';

-- Feedback Choices Table
DROP TABLE IF EXISTS feedback_choices;
CREATE TABLE feedback_choices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    choice_text VARCHAR(500) NOT NULL,
    FOREIGN KEY (question_id) REFERENCES feedback_questions(id) ON DELETE CASCADE,
    INDEX idx_question_id (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Multiple choice options for feedback questions';

-- Feedback Responses Table
DROP TABLE IF EXISTS feedback_responses;
CREATE TABLE feedback_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    pc_number VARCHAR(100),
    question_id INT NOT NULL,
    choice_id INT NULL COMMENT 'NULL for text responses',
    comment TEXT COMMENT 'Free-text response or additional comment',
    date_submitted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES student(student_id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES feedback_questions(id) ON DELETE CASCADE,
    FOREIGN KEY (choice_id) REFERENCES feedback_choices(id) ON DELETE SET NULL,
    INDEX idx_student_id (student_id),
    INDEX idx_question_id (question_id),
    INDEX idx_date_submitted (date_submitted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Student feedback survey responses';

-- ============================================
-- DEFAULT ADMIN ACCOUNT
-- ============================================
-- Create default admin user
-- Username: ADMIN001
-- Password: ADMIN001 (plain text for development - CHANGE IN PRODUCTION!)

INSERT INTO users (username, password, user_type) VALUES ('ADMIN001', 'ADMIN001', 'admin');
SET @admin_user_id = LAST_INSERT_ID();
INSERT INTO admin (user_id, last_name, first_name, middle_name) VALUES (@admin_user_id, 'Administrator', 'System', NULL);

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Sample Teacher
INSERT INTO users (username, password, user_type) VALUES ('TEACH001', 'TEACH001', 'teacher');
SET @teacher_user_id = LAST_INSERT_ID();
INSERT INTO teacher (user_id, last_name, first_name, middle_name) VALUES (@teacher_user_id, 'Santos', 'Juan', 'Cruz');

-- Sample Working Student
INSERT INTO users (username, password, user_type) VALUES ('2025-1001', '2025-1001', 'working_student');
SET @ws_user_id = LAST_INSERT_ID();
INSERT INTO working_student (user_id, student_no, first_name, middle_name, last_name, year_level, section) 
VALUES (@ws_user_id, '2025-1001', 'Maria', 'Reyes', 'Garcia', '3rd Year', 'BSIT-3A');

-- Sample Student
INSERT INTO users (username, password, user_type) VALUES ('2025-2001', '2025-2001', 'student');
SET @student_user_id = LAST_INSERT_ID();
INSERT INTO student (user_id, student_no, first_name, middle_name, last_name, year_level, section) 
VALUES (@student_user_id, '2025-2001', 'Pedro', 'Miguel', 'Dela Cruz', '2nd Year', 'BSIT-2A');

-- Sample Feedback Questions
INSERT INTO feedback_questions (question_text, question_type) VALUES 
('How would you rate the overall condition of the computer lab?', 'multiple_choice'),
('Were all equipment functioning properly during your session?', 'multiple_choice'),
('Please describe any issues you encountered:', 'text');

-- Sample Feedback Choices
SET @q1_id = (SELECT id FROM feedback_questions WHERE question_text LIKE '%overall condition%' LIMIT 1);
SET @q2_id = (SELECT id FROM feedback_questions WHERE question_text LIKE '%equipment functioning%' LIMIT 1);

INSERT INTO feedback_choices (question_id, choice_text) VALUES 
(@q1_id, 'Excellent'),
(@q1_id, 'Good'),
(@q1_id, 'Fair'),
(@q1_id, 'Poor'),
(@q2_id, 'Yes, everything worked fine'),
(@q2_id, 'Some equipment had minor issues'),
(@q2_id, 'Multiple equipment had problems');

-- ============================================
-- END OF SCHEMA
-- ============================================

-- NOTES:
-- 1. All passwords are stored in plain text for development
--    In production, implement proper password hashing (Argon2id, bcrypt, etc.)
-- 
-- 2. Default credentials:
--    Admin: ADMIN001 / ADMIN001
--    Teacher: TEACH001 / TEACH001
--    Working Student: 2025-1001 / 2025-1001
--    Student: 2025-2001 / 2025-2001
--
-- 3. CHANGE ALL DEFAULT PASSWORDS after deployment!
--
-- 4. Foreign key constraints ensure referential integrity:
--    - Deleting a user cascades to their profile table
--    - Deleting a teacher cascades to their classlists
--    - Deleting a classlist cascades to student enrollments and attendance
--
-- 5. ENUMs ensure data consistency for user_type and status fields

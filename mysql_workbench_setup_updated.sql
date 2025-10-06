-- MySQL Workbench Setup Script for Digital Logbook Application
-- This script creates the database schema matching the Go application code
-- Compatible with MySQL Workbench import

-- Drop database if exists
DROP DATABASE IF EXISTS logbookdb;

-- Create database
CREATE DATABASE logbookdb DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE logbookdb;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    middle_name VARCHAR(255),
    last_name VARCHAR(255),
    role VARCHAR(50) NOT NULL,
    employee_id VARCHAR(255) UNIQUE,
    student_id VARCHAR(255) UNIQUE,
    year VARCHAR(100),
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    instructor VARCHAR(255) NOT NULL,
    room VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Classlists table
CREATE TABLE IF NOT EXISTS classlists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT,
    students TEXT,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    subject_id INT,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    time_in TIME,
    time_out TIME,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Login logs table
CREATE TABLE IF NOT EXISTS login_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    login_time TIMESTAMP,
    logout_time TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    equipment VARCHAR(255) NOT NULL,
    `condition` VARCHAR(50) NOT NULL,
    comment TEXT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample users (passwords are plain text - the Go application hashes them)
INSERT IGNORE INTO users (username, email, password, name, first_name, middle_name, last_name, role, employee_id, student_id, year) VALUES
('admin', 'admin@university.edu', 'admin123', 'System Administrator', 'System', NULL, 'Administrator', 'admin', 'admin', NULL, NULL),
('instructor1', 'mreyes@university.edu', 'inst123', 'Mr. Reyes', 'Mr.', NULL, 'Reyes', 'instructor', 'instructor1', NULL, NULL),
('2025-1234', NULL, '2025-1234', 'Santos, Juan', 'Juan', NULL, 'Santos', 'student', NULL, '2025-1234', '2nd Yr BSIT'),
('2025-5678', NULL, '2025-5678', 'Cruz, Maria', 'Maria', NULL, 'Cruz', 'student', NULL, '2025-5678', '2nd Yr BSIT'),
('working1', NULL, 'working1', 'Working Student', 'Working', NULL, 'Student', 'working_student', NULL, 'working1', NULL);

-- Sample subjects
INSERT IGNORE INTO subjects (code, name, instructor, room) VALUES
('IT101', 'Programming Fundamentals', 'Mr. Reyes', 'Lab A'),
('IT202', 'Database Management', 'Mr. Reyes', 'Lab B');

-- Verify the data was inserted correctly
SELECT 'Database Setup Complete!' AS Status;
SELECT 'Sample Users Created:' AS Info;
SELECT username, email, role, name FROM users ORDER BY role, username;
SELECT 'Sample Subjects Created:' AS Info;
SELECT code, name, instructor FROM subjects ORDER BY code;

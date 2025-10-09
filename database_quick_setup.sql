-- ============================================
-- Quick Database Setup
-- ============================================
-- This file creates the database and all tables
-- Run this if you want to manually set up the database
-- ============================================

-- Create and use database
CREATE DATABASE IF NOT EXISTS logbookdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
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
    gender VARCHAR(20),
    role VARCHAR(50) NOT NULL,
    employee_id VARCHAR(255) UNIQUE,
    student_id VARCHAR(255) UNIQUE,
    year VARCHAR(100),
    photo_url VARCHAR(500),
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_role (role),
    INDEX idx_employee_id (employee_id),
    INDEX idx_student_id (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    instructor VARCHAR(255) NOT NULL,
    room VARCHAR(100) NOT NULL,
    INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Classlists table
CREATE TABLE IF NOT EXISTS classlists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT NOT NULL,
    students TEXT,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    time_in TIME,
    time_out TIME,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    INDEX idx_date (date),
    UNIQUE KEY unique_student_subject_date (student_id, subject_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Login logs table
CREATE TABLE IF NOT EXISTS login_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    user_name VARCHAR(255),
    user_type VARCHAR(50),
    pc_number VARCHAR(50),
    login_time TIMESTAMP NULL,
    logout_time TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_login_time (login_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    student_name VARCHAR(255),
    student_id_str VARCHAR(255),
    pc_number VARCHAR(50),
    time_in TIME,
    time_out TIME,
    equipment VARCHAR(255) NOT NULL,
    `condition` VARCHAR(50) NOT NULL,
    comment TEXT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert sample subjects
INSERT INTO subjects (code, name, instructor, room) VALUES
('IT101', 'Programming Fundamentals', 'Mr. Reyes', 'Lab A'),
('IT202', 'Database Management', 'Mr. Reyes', 'Lab B')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Verify tables were created
SHOW TABLES;

-- Display success message
SELECT 'Database setup complete! Run the application to create users with hashed passwords.' AS message;


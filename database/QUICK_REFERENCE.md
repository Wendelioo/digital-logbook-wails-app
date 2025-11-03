# Digital Logbook Database - Quick Reference Card

**Schema Version:** 4.0 | **Last Updated:** October 24, 2025

---

## 🎯 Quick Access

### Essential Queries

```sql
-- Get all active users
SELECT * FROM v_users_complete WHERE is_active = TRUE;

-- Get teacher's classes with enrollment counts
SELECT * FROM v_teacher_classes WHERE teacher_id = ? AND is_active = TRUE;

-- Get students in a class
SELECT * FROM v_classlist_complete WHERE class_id = ? AND enrollment_status = 'active';

-- Get today's attendance
SELECT * FROM v_attendance_complete WHERE date = CURDATE();

-- Get pending feedback
SELECT * FROM v_feedback WHERE status = 'pending' ORDER BY date_submitted DESC;

-- Get recent login activity (last 24 hours)
SELECT * FROM v_login_logs_complete 
WHERE login_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY login_time DESC;
```

---

## 📊 Table Quick Reference

| Table | Primary Key | Unique Keys | Main Foreign Keys |
|-------|-------------|-------------|-------------------|
| **users** | id | username | - |
| **admins** | id | user_id, admin_id | user_id → users.id |
| **teachers** | id | user_id, teacher_id | user_id → users.id |
| **students** | id | user_id, student_id | user_id → users.id |
| **working_students** | id | user_id, student_id | user_id → users.id |
| **subjects** | id | subject_code | teacher_id → teachers.id |
| **classes** | id | - | subject_id, teacher_id, created_by |
| **classlist** | id | (class_id, student_id) | class_id, student_id, enrolled_by |
| **attendance** | id | (classlist_id, date) | classlist_id, recorded_by |
| **login_logs** | id | - | user_id → users.id |
| **feedback** | id | - | student_id, forwarded_by, reviewed_by |

---

## 🔗 Relationship Cheat Sheet

### User Type Relationships

```
users (id=5, user_type='student')
  └─► students (user_id=5) → student profile
      └─► classlist (student_id=5) → enrollments
          └─► attendance (classlist_id=X) → attendance records

users (id=3, user_type='teacher')
  └─► teachers (user_id=3) → teacher profile
      ├─► subjects (teacher_id=3) → courses taught
      └─► classes (teacher_id=3) → class instances taught

users (id=8, user_type='working_student')
  └─► working_students (user_id=8) → working student profile
      ├─► classes (created_by=8) → classes created
      └─► classlist (enrolled_by=8) → students enrolled
```

### Data Flow: Class Creation

```
1. working_students (id=3) creates class
   ↓
2. subjects (id=1) created/updated → subject_code: "IT301"
   ↓
3. classes (id=10) created → linked to subject_id=1, teacher_id=5, created_by=3
   ↓
4. classlist entries created → students enrolled via sp_enroll_student()
   ↓
5. attendance records → linked to classlist_id
```

### Data Flow: Feedback Workflow

```
Step 1: Student Submits
  feedback (id=1, student_id=10, status='pending')

Step 2: Working Student Forwards
  feedback (id=1, status='forwarded', forwarded_by=3, forwarded_at=NOW())

Step 3: Admin Resolves
  feedback (id=1, status='resolved', reviewed_by=1, reviewed_at=NOW())
```

---

## 🛠️ Common Operations

### Create a User (Admin)

```sql
-- 1. Create user account
INSERT INTO users (username, password, user_type, is_active)
VALUES ('admin001', 'hashed_password', 'admin', TRUE);

-- 2. Create admin profile
INSERT INTO admins (user_id, admin_id, first_name, last_name, email)
VALUES (LAST_INSERT_ID(), 'ADM001', 'John', 'Doe', 'john.doe@example.com');
```

### Create a User (Teacher)

```sql
-- 1. Create user account
INSERT INTO users (username, password, user_type, is_active)
VALUES ('teacher001', 'hashed_password', 'teacher', TRUE);

-- 2. Create teacher profile
INSERT INTO teachers (user_id, teacher_id, first_name, last_name, email)
VALUES (LAST_INSERT_ID(), 'TCH001', 'Jane', 'Smith', 'jane.smith@example.com');
```

### Create a User (Student)

```sql
-- 1. Create user account
INSERT INTO users (username, password, user_type, is_active)
VALUES ('student001', 'hashed_password', 'student', TRUE);

-- 2. Create student profile
INSERT INTO students (user_id, student_id, first_name, last_name, email, 
                     contact_number, year_level, section)
VALUES (LAST_INSERT_ID(), 'STU001', 'Alice', 'Johnson', 'alice.j@example.com',
        '555-1234', '3rd Year', 'A');
```

### Create a Class

```sql
-- Method 1: Using stored procedure (recommended)
CALL sp_create_or_get_subject('IT301', 'Web Development', 5, 'Advanced web tech');
-- Returns subject id

INSERT INTO classes (subject_id, teacher_id, schedule, room, year_level, 
                    section, semester, school_year, created_by, is_active)
VALUES (1, 5, 'MWF 1:00-2:00 PM', 'Lab 2', '3rd Year', 'A', 
        '1st Semester', '2024-2025', 3, TRUE);

-- Method 2: Manual (if subject exists)
INSERT INTO classes (subject_id, teacher_id, schedule, room, year_level, 
                    section, semester, school_year, created_by, is_active)
SELECT id, 5, 'MWF 1:00-2:00 PM', 'Lab 2', '3rd Year', 'A',
       '1st Semester', '2024-2025', 3, TRUE
FROM subjects WHERE subject_code = 'IT301';
```

### Enroll Students

```sql
-- Using stored procedure (recommended)
CALL sp_enroll_student(10, 25, 3);  -- class_id=10, student_id=25, enrolled_by=3

-- Manual enrollment
INSERT INTO classlist (class_id, student_id, enrolled_by, status, enrollment_date)
VALUES (10, 25, 3, 'active', CURDATE())
ON DUPLICATE KEY UPDATE status = 'active';
```

### Record Attendance

```sql
-- Using stored procedure (recommended)
CALL sp_record_attendance(
    15,              -- classlist_id
    CURDATE(),       -- date
    '13:05:00',      -- time_in
    '14:00:00',      -- time_out
    'PC-15',         -- pc_number
    'present',       -- status
    NULL,            -- remarks
    5                -- recorded_by (teacher_id)
);

-- Manual attendance
INSERT INTO attendance (classlist_id, date, time_in, time_out, pc_number, 
                       status, recorded_by)
VALUES (15, CURDATE(), '13:05:00', '14:00:00', 'PC-15', 'present', 5)
ON DUPLICATE KEY UPDATE 
    time_out = VALUES(time_out),
    status = VALUES(status);
```

### Submit Feedback

```sql
INSERT INTO feedback (student_id, first_name, last_name, pc_number,
                     equipment_condition, monitor_condition, 
                     keyboard_condition, mouse_condition, comments, status)
VALUES (25, 'Alice', 'Johnson', 'PC-15',
        'Good', 'Minor Issue', 'Good', 'Good',
        'Monitor flickering occasionally', 'pending');
```

### Log Login/Logout

```sql
-- Login
CALL sp_log_login(25, 'student', 'PC-15', '192.168.1.100', 'Mozilla/5.0...', 'success');
-- Returns log_id (e.g., 123)

-- Logout
CALL sp_log_logout(123);  -- Updates logout_time and calculates session_duration
```

---

## 📈 Analytics Queries

### Dashboard Statistics

```sql
CALL sp_get_dashboard_stats();
-- Returns: total_students, total_teachers, working_students, recent_logins,
--          pending_feedback, today_attendance, active_classes
```

### Recent Activity (Last 24 Hours)

```sql
CALL sp_get_recent_logins();
-- Returns: count of successful logins in last 24 hours
```

### Attendance by Date Range

```sql
SELECT 
    date,
    COUNT(*) as total_records,
    SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
    SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_count,
    SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_count
FROM attendance
WHERE date BETWEEN '2025-01-01' AND '2025-01-31'
GROUP BY date
ORDER BY date DESC;
```

### Class Enrollment Summary

```sql
SELECT 
    vc.class_id,
    vc.subject_code,
    vc.subject_name,
    vc.teacher_name,
    vc.year_level,
    vc.section,
    vc.enrolled_count
FROM v_teacher_classes vc
WHERE vc.is_active = TRUE
ORDER BY vc.subject_code, vc.year_level, vc.section;
```

### Equipment Feedback Summary

```sql
SELECT 
    pc_number,
    COUNT(*) as total_reports,
    SUM(CASE WHEN equipment_condition != 'Good' THEN 1 ELSE 0 END) as equipment_issues,
    SUM(CASE WHEN monitor_condition != 'Good' THEN 1 ELSE 0 END) as monitor_issues,
    SUM(CASE WHEN keyboard_condition != 'Good' THEN 1 ELSE 0 END) as keyboard_issues,
    SUM(CASE WHEN mouse_condition != 'Good' THEN 1 ELSE 0 END) as mouse_issues,
    MAX(date_submitted) as last_report_date
FROM feedback
WHERE status IN ('pending', 'forwarded')
GROUP BY pc_number
HAVING total_reports > 0
ORDER BY equipment_issues DESC, monitor_issues DESC;
```

### Login Activity by User Type

```sql
SELECT 
    user_type,
    COUNT(*) as login_count,
    COUNT(DISTINCT user_id) as unique_users,
    AVG(session_duration) as avg_session_seconds,
    MAX(login_time) as last_login
FROM login_logs
WHERE login_status = 'success'
  AND login_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY user_type
ORDER BY login_count DESC;
```

---

## 🔍 Search Queries

### Find User by Name

```sql
SELECT * FROM v_users_complete
WHERE CONCAT(first_name, ' ', IFNULL(middle_name, ''), ' ', last_name) LIKE '%John%';
```

### Find Classes by Subject Code

```sql
SELECT * FROM v_classes_complete
WHERE subject_code LIKE 'IT%' AND is_active = TRUE;
```

### Find Students by Year/Section

```sql
SELECT * FROM v_users_complete
WHERE user_type IN ('student', 'working_student')
  AND year_level = '3rd Year'
  AND section = 'A'
ORDER BY last_name, first_name;
```

### Find Attendance by Student

```sql
SELECT * FROM v_attendance_complete
WHERE student_id = 25
  AND date BETWEEN '2025-01-01' AND '2025-01-31'
ORDER BY date DESC;
```

---

## ⚡ Performance Tips

### 1. Always Use Indexes

```sql
-- Good: Uses index on username
SELECT * FROM users WHERE username = 'john.doe';

-- Bad: No index on first_name alone
SELECT * FROM teachers WHERE first_name = 'John';

-- Better: Use view or add composite index
SELECT * FROM v_users_complete WHERE first_name = 'John' AND user_type = 'teacher';
```

### 2. Prefer Views for Complex Queries

```sql
-- Good: Uses optimized view
SELECT * FROM v_teacher_classes WHERE teacher_id = 5;

-- Avoid: Manual joins (slower and error-prone)
SELECT c.*, s.subject_code, s.subject_name, t.first_name
FROM classes c
JOIN subjects s ON c.subject_id = s.id
JOIN teachers t ON c.teacher_id = t.id
WHERE c.teacher_id = 5;
```

### 3. Use Stored Procedures

```sql
-- Good: Uses optimized procedure
CALL sp_enroll_student(10, 25, 3);

-- Avoid: Manual multi-step operations
INSERT INTO classlist ... ON DUPLICATE KEY UPDATE ...;
```

### 4. Limit Large Result Sets

```sql
-- Good: Limits results
SELECT * FROM login_logs ORDER BY login_time DESC LIMIT 100;

-- Bad: Returns everything (slow for large tables)
SELECT * FROM login_logs ORDER BY login_time DESC;
```

### 5. Use Appropriate Joins

```sql
-- Use INNER JOIN when both sides must exist
SELECT * FROM classlist cl
INNER JOIN users u ON cl.student_id = u.id;

-- Use LEFT JOIN when right side is optional
SELECT * FROM feedback f
LEFT JOIN users u ON f.reviewed_by = u.id;
```

---

## 🛡️ Security Best Practices

### 1. Never Store Plain Passwords

```sql
-- BAD: Plain text password
INSERT INTO users (username, password) VALUES ('user', 'mypassword');

-- GOOD: Hashed password (use application-level hashing)
INSERT INTO users (username, password) VALUES ('user', '$2b$10$...');
```

### 2. Use Parameterized Queries

```sql
-- Application code (pseudo)
// GOOD: Prepared statement
stmt = db.prepare("SELECT * FROM users WHERE username = ?")
stmt.execute([username])

// BAD: String concatenation (SQL injection risk)
query = "SELECT * FROM users WHERE username = '" + username + "'"
db.execute(query)
```

### 3. Limit User Privileges

```sql
-- Create application user with minimal privileges
CREATE USER 'logbook_app'@'localhost' IDENTIFIED BY 'secure_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON logbookdb.* TO 'logbook_app'@'localhost';
FLUSH PRIVILEGES;

-- Don't grant DROP, CREATE, ALTER in production
```

### 4. Enable Account Locking

```sql
-- Lock account after 5 failed attempts
UPDATE users 
SET locked_until = DATE_ADD(NOW(), INTERVAL 30 MINUTE)
WHERE id = ? AND login_attempts >= 5;
```

---

## 🔧 Maintenance Commands

### Database Optimization

```sql
-- Optimize all tables
OPTIMIZE TABLE users, students, teachers, classes, classlist, attendance, 
               login_logs, feedback, subjects, working_students, admins;

-- Analyze for better query planning
ANALYZE TABLE users, students, teachers, classes, classlist, attendance;
```

### Data Cleanup

```sql
-- Archive old login logs (older than 90 days)
DELETE FROM login_logs WHERE login_time < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- Close abandoned sessions (no logout after 24 hours)
UPDATE login_logs 
SET logout_time = DATE_ADD(login_time, INTERVAL 24 HOUR),
    session_duration = 86400
WHERE logout_time IS NULL 
  AND login_time < DATE_SUB(NOW(), INTERVAL 24 HOUR);
```

### Backup & Restore

```bash
# Full backup
mysqldump -u root -p logbookdb > logbookdb_backup_$(date +%Y%m%d_%H%M%S).sql

# Backup structure only
mysqldump -u root -p --no-data logbookdb > logbookdb_structure.sql

# Backup specific tables
mysqldump -u root -p logbookdb users students teachers > users_backup.sql

# Restore from backup
mysql -u root -p logbookdb < logbookdb_backup.sql
```

---

## 📞 Quick Support

### Error Codes

| Code | Error | Solution |
|------|-------|----------|
| 1062 | Duplicate entry | Check UNIQUE constraints, use INSERT IGNORE or ON DUPLICATE KEY UPDATE |
| 1452 | Foreign key constraint | Ensure parent record exists before inserting child |
| 1054 | Unknown column | Check spelling, verify column exists in table |
| 1064 | SQL syntax error | Review query syntax, check for typos |
| 1146 | Table doesn't exist | Verify table name, ensure schema is loaded |

### Quick Diagnostics

```sql
-- Check database size
SELECT 
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) as size_mb
FROM information_schema.TABLES
WHERE table_schema = 'logbookdb'
ORDER BY (data_length + index_length) DESC;

-- Check for missing indexes
SELECT DISTINCT TABLE_NAME, COLUMN_NAME
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'logbookdb'
  AND COLUMN_NAME LIKE '%_id'
  AND COLUMN_NAME NOT IN (
      SELECT COLUMN_NAME
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = 'logbookdb'
  );

-- Check for unused tables
SELECT TABLE_NAME, TABLE_ROWS, 
       ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) AS size_mb
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'logbookdb' AND TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_ROWS DESC;
```

---

**Schema Version:** 4.0 - Comprehensive Integration  
**Quick Reference Last Updated:** October 24, 2025  

For complete documentation, see: **SCHEMA_DOCUMENTATION.md**  
For visual ERD, see: **ERD_VISUAL.txt**


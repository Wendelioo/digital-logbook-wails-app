# SQL Usage Examples

Quick reference for common database operations.

---

## Setup

### Create Database from SQL File

```bash
# Quick setup (recommended for testing)
mysql -u root -p < database_quick_setup.sql

# Full setup (recommended for production)
mysql -u root -p < schema.sql
```

---

## Common Queries

### User Management

#### List all users
```sql
SELECT id, username, name, role, employee_id, student_id 
FROM users 
ORDER BY role, name;
```

#### Count users by role
```sql
SELECT 
    role,
    COUNT(*) as total,
    GROUP_CONCAT(DISTINCT username ORDER BY username SEPARATOR ', ') as usernames
FROM users 
GROUP BY role;
```

#### Find user by Employee ID
```sql
SELECT * FROM users WHERE employee_id = 'admin';
```

#### Find user by Student ID
```sql
SELECT * FROM users WHERE student_id = '2025-1234';
```

---

### Login Logs

#### Recent logins (last 20)
```sql
SELECT 
    user_name,
    user_type,
    pc_number,
    DATE_FORMAT(login_time, '%Y-%m-%d %H:%i') as logged_in,
    DATE_FORMAT(logout_time, '%Y-%m-%d %H:%i') as logged_out,
    TIMESTAMPDIFF(MINUTE, login_time, logout_time) as minutes_online
FROM login_logs 
ORDER BY login_time DESC 
LIMIT 20;
```

#### Active sessions (not logged out)
```sql
SELECT 
    user_name,
    user_type,
    pc_number,
    login_time,
    TIMESTAMPDIFF(MINUTE, login_time, NOW()) as minutes_online
FROM login_logs 
WHERE logout_time IS NULL
ORDER BY login_time DESC;
```

#### Login activity by date
```sql
SELECT 
    DATE(login_time) as date,
    COUNT(*) as total_logins,
    COUNT(DISTINCT user_id) as unique_users
FROM login_logs 
GROUP BY DATE(login_time)
ORDER BY date DESC;
```

#### Most active users
```sql
SELECT 
    user_name,
    user_type,
    COUNT(*) as login_count,
    SUM(TIMESTAMPDIFF(MINUTE, login_time, logout_time)) as total_minutes
FROM login_logs 
WHERE logout_time IS NOT NULL
GROUP BY user_id, user_name, user_type
ORDER BY login_count DESC;
```

#### Login activity by PC
```sql
SELECT 
    pc_number,
    COUNT(*) as login_count,
    COUNT(DISTINCT user_id) as unique_users,
    MIN(login_time) as first_seen,
    MAX(login_time) as last_seen
FROM login_logs 
GROUP BY pc_number
ORDER BY login_count DESC;
```

---

### Attendance

#### Today's attendance
```sql
SELECT 
    u.name as student_name,
    s.code as subject,
    a.status,
    a.time_in,
    a.time_out
FROM attendance a
JOIN users u ON a.student_id = u.id
JOIN subjects s ON a.subject_id = s.id
WHERE a.date = CURDATE()
ORDER BY s.code, u.name;
```

#### Attendance by student
```sql
SELECT 
    s.code,
    s.name as subject_name,
    a.date,
    a.status,
    a.time_in,
    a.time_out
FROM attendance a
JOIN subjects s ON a.subject_id = s.id
WHERE a.student_id = 3  -- Replace with actual student ID
ORDER BY a.date DESC;
```

#### Attendance statistics per subject
```sql
SELECT 
    s.code,
    s.name as subject,
    COUNT(CASE WHEN a.status = 'Present' THEN 1 END) as present,
    COUNT(CASE WHEN a.status = 'Absent' THEN 1 END) as absent,
    COUNT(CASE WHEN a.status = 'Seat-in' THEN 1 END) as seatin,
    COUNT(*) as total
FROM subjects s
LEFT JOIN attendance a ON s.id = a.subject_id
GROUP BY s.id, s.code, s.name
ORDER BY s.code;
```

#### Students with perfect attendance
```sql
SELECT 
    u.name as student_name,
    u.student_id,
    s.code as subject,
    COUNT(*) as classes_attended
FROM attendance a
JOIN users u ON a.student_id = u.id
JOIN subjects s ON a.subject_id = s.id
WHERE a.status = 'Present'
GROUP BY u.id, s.id
HAVING COUNT(*) = (
    SELECT COUNT(DISTINCT date) 
    FROM attendance 
    WHERE subject_id = s.id
)
ORDER BY u.name, s.code;
```

---

### Equipment Reports (Feedback)

#### Recent equipment reports
```sql
SELECT 
    student_name,
    pc_number,
    equipment,
    `condition`,
    comment,
    DATE_FORMAT(date, '%Y-%m-%d %H:%i') as reported_at
FROM feedback 
ORDER BY date DESC 
LIMIT 20;
```

#### Equipment condition summary
```sql
SELECT 
    pc_number,
    equipment,
    `condition`,
    COUNT(*) as report_count,
    MAX(date) as last_reported
FROM feedback
GROUP BY pc_number, equipment, `condition`
ORDER BY pc_number, equipment;
```

#### Bad condition equipment (needs attention)
```sql
SELECT 
    pc_number,
    equipment,
    GROUP_CONCAT(comment SEPARATOR '; ') as issues,
    COUNT(*) as report_count,
    MAX(date) as last_report
FROM feedback
WHERE `condition` = 'Bad'
GROUP BY pc_number, equipment
ORDER BY report_count DESC, last_report DESC;
```

#### Equipment reports by student
```sql
SELECT 
    f.date,
    f.pc_number,
    f.equipment,
    f.condition,
    f.comment
FROM feedback f
WHERE f.student_id = 3  -- Replace with actual student ID
ORDER BY f.date DESC;
```

---

### Subjects and Classes

#### All subjects with enrollment count
```sql
SELECT 
    s.code,
    s.name,
    s.instructor,
    s.room,
    COUNT(DISTINCT a.student_id) as enrolled_students
FROM subjects s
LEFT JOIN attendance a ON s.id = a.subject_id
GROUP BY s.id
ORDER BY s.code;
```

#### Subjects by instructor
```sql
SELECT 
    instructor,
    COUNT(*) as subject_count,
    GROUP_CONCAT(code ORDER BY code SEPARATOR ', ') as subjects
FROM subjects
GROUP BY instructor;
```

---

### Dashboard Statistics

#### Admin dashboard stats
```sql
SELECT 
    (SELECT COUNT(*) FROM users WHERE role = 'student') as total_students,
    (SELECT COUNT(*) FROM users WHERE role = 'instructor') as total_instructors,
    (SELECT COUNT(*) FROM users WHERE role = 'working_student') as working_students,
    (SELECT COUNT(*) FROM login_logs WHERE DATE(login_time) = CURDATE()) as today_logins,
    (SELECT COUNT(*) FROM feedback WHERE DATE(date) = CURDATE()) as today_reports;
```

#### Instructor dashboard
```sql
-- Replace 'Mr. Reyes' with actual instructor name
SELECT 
    s.code,
    s.name,
    s.room,
    COUNT(DISTINCT a.student_id) as enrolled_students,
    COUNT(CASE WHEN a.date = CURDATE() THEN 1 END) as today_attendance
FROM subjects s
LEFT JOIN attendance a ON s.id = a.subject_id
WHERE s.instructor = 'Mr. Reyes'
GROUP BY s.id
ORDER BY s.code;
```

---

## Maintenance Queries

### Database Size
```sql
SELECT 
    table_name,
    table_rows,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) as size_mb
FROM information_schema.TABLES
WHERE table_schema = 'logbookdb'
ORDER BY (data_length + index_length) DESC;
```

### Clean up old login logs (older than 90 days)
```sql
DELETE FROM login_logs 
WHERE login_time < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

### Clean up old feedback (older than 1 year)
```sql
DELETE FROM feedback 
WHERE date < DATE_SUB(NOW(), INTERVAL 1 YEAR);
```

### Optimize tables
```sql
OPTIMIZE TABLE users, subjects, attendance, login_logs, feedback;
```

---

## Export Queries

### Export user list to CSV format
```sql
SELECT 
    username,
    name,
    role,
    employee_id,
    student_id,
    DATE(created) as joined_date
FROM users
INTO OUTFILE '/tmp/users_export.csv'
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n';
```

### Export attendance summary
```sql
SELECT 
    u.student_id,
    u.name,
    s.code as subject,
    COUNT(CASE WHEN a.status = 'Present' THEN 1 END) as present,
    COUNT(CASE WHEN a.status = 'Absent' THEN 1 END) as absent,
    ROUND(COUNT(CASE WHEN a.status = 'Present' THEN 1 END) * 100.0 / COUNT(*), 2) as attendance_rate
FROM users u
JOIN attendance a ON u.id = a.student_id
JOIN subjects s ON a.subject_id = s.id
WHERE u.role IN ('student', 'working_student')
GROUP BY u.id, s.id
ORDER BY u.name, s.code;
```

---

## Tips

1. **Always backup before making changes:**
   ```bash
   mysqldump -u root -p logbookdb > backup_$(date +%Y%m%d).sql
   ```

2. **Use EXPLAIN to optimize queries:**
   ```sql
   EXPLAIN SELECT * FROM login_logs WHERE user_id = 1;
   ```

3. **Add LIMIT to prevent large result sets:**
   ```sql
   SELECT * FROM login_logs ORDER BY login_time DESC LIMIT 100;
   ```

4. **Use transactions for multiple updates:**
   ```sql
   START TRANSACTION;
   UPDATE users SET name = 'New Name' WHERE id = 1;
   UPDATE attendance SET status = 'Present' WHERE id = 5;
   COMMIT;
   ```

---

**Last Updated:** October 9, 2025  
**For more information, see:** `SQL_FILES_README.md`


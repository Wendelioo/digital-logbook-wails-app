# Digital Logbook Database Documentation

**Current Version:** 4.0 - Comprehensive Integration  
**Last Updated:** October 24, 2025  
**Database:** `logbookdb`

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Installation](#installation)
3. [Database Structure](#database-structure)
4. [Migration Guide](#migration-guide)
5. [Verification](#verification)
6. [Schema Files](#schema-files)
7. [Key Features](#key-features)
8. [Support](#support)

---

## 🚀 Quick Start

### Fresh Installation

```bash
# 1. Create database and all structures
mysql -u root -p < database/schema_v4_comprehensive.sql

# 2. (Optional) Load sample data
mysql -u root -p logbookdb < database/seed.sql

# 3. Verify installation
mysql -u root -p logbookdb < database/test_verification.sql
```

### What This Does

- Creates `logbookdb` database with UTF-8 support
- Creates 11 core tables with proper relationships
- Creates 7 optimized views for complex queries
- Creates 9 stored procedures for common operations
- Creates 4 triggers for automatic updates
- Sets up 50+ indexes for optimal performance
- Establishes all foreign key relationships

---

## 📦 Installation

### Prerequisites

- MySQL 5.7+ or MariaDB 10.2+
- Database user with CREATE, ALTER, DROP, and INSERT privileges
- Sufficient disk space (minimum 100MB for schema + data)

### Step-by-Step Installation

#### 1. Backup Existing Database (if applicable)

```bash
mysqldump -u root -p logbookdb > logbookdb_backup_$(date +%Y%m%d_%H%M%S).sql
```

#### 2. Run the Comprehensive Schema

```bash
mysql -u root -p < database/schema_v4_comprehensive.sql
```

You should see output indicating successful creation of:
- ✅ Database
- ✅ Tables (11)
- ✅ Views (7)
- ✅ Stored Procedures (9)
- ✅ Triggers (4)

#### 3. Verify Installation

```bash
mysql -u root -p logbookdb -e "SHOW TABLES;"
mysql -u root -p logbookdb -e "SHOW PROCEDURE STATUS WHERE Db = 'logbookdb';"
```

Expected output:
```
+---------------------+
| Tables_in_logbookdb |
+---------------------+
| admins              |
| attendance          |
| classes             |
| classlist           |
| feedback            |
| login_logs          |
| students            |
| subjects            |
| teachers            |
| users               |
| working_students    |
| v_attendance_complete    |  (VIEW)
| v_classes_complete       |  (VIEW)
| v_classlist_complete     |  (VIEW)
| v_feedback               |  (VIEW)
| v_login_logs_complete    |  (VIEW)
| v_teacher_classes        |  (VIEW)
| v_users_complete         |  (VIEW)
+---------------------+
```

---

## 🗄️ Database Structure

### Core Tables (11)

| Table | Purpose | Key Fields | Relationships |
|-------|---------|------------|---------------|
| **users** | Core authentication | id, username, password, user_type | 1:1 → profiles, 1:M → logs |
| **admins** | Admin profiles | id, user_id, admin_id, email | M:1 ← users |
| **teachers** | Teacher profiles | id, user_id, teacher_id, email | M:1 ← users, 1:M → subjects/classes |
| **students** | Student profiles | id, user_id, student_id, email, contact_number | M:1 ← users |
| **working_students** | Working student profiles | id, user_id, student_id, email, contact_number | M:1 ← users, 1:M → classes/classlist |
| **subjects** | Courses/subjects | id, subject_code, subject_name, teacher_id | M:1 ← teachers, 1:M → classes |
| **classes** | Class instances | id, subject_id, teacher_id, schedule, room | M:1 ← subjects/teachers, 1:M → classlist |
| **classlist** | Student enrollments | id, class_id, student_id, status | M:1 ← classes/users, 1:M → attendance |
| **attendance** | Attendance records | id, classlist_id, date, time_in, time_out, pc_number | M:1 ← classlist |
| **login_logs** | Activity tracking | id, user_id, login_time, logout_time, pc_number | M:1 ← users |
| **feedback** | Equipment reports | id, student_id, pc_number, status, forwarded_by | M:1 ← users |

### Views (7)

| View | Purpose | Usage |
|------|---------|-------|
| **v_users_complete** | Unified user info across all types | User management, profiles |
| **v_login_logs_complete** | Login history with user names | Activity monitoring, reports |
| **v_classes_complete** | Classes with subject/teacher details | Class listings, schedules |
| **v_classlist_complete** | Enrollments with student info | Class rosters, student lists |
| **v_teacher_classes** | Teacher classes + enrollment counts | Teacher dashboard, analytics |
| **v_attendance_complete** | Attendance with full context | Attendance reports, analytics |
| **v_feedback** | Feedback with workflow info | Equipment management, triaging |

### Stored Procedures (9)

| Procedure | Parameters | Purpose |
|-----------|------------|---------|
| **sp_log_login** | user_id, user_type, pc_number, ip_address, user_agent, login_status | Record login attempt |
| **sp_log_logout** | log_id | Record logout and calculate session |
| **sp_get_recent_logins** | - | Get 24h login count |
| **sp_get_dashboard_stats** | - | Get system statistics |
| **sp_get_teacher_classes** | teacher_id | Get teacher's classes |
| **sp_get_class_students** | class_id | Get enrolled students |
| **sp_enroll_student** | class_id, student_id, enrolled_by | Enroll student in class |
| **sp_record_attendance** | classlist_id, date, time_in, time_out, pc_number, status, remarks, recorded_by | Record attendance |
| **sp_create_or_get_subject** | subject_code, subject_name, teacher_id, description | Create/update subject |

### Triggers (4)

- `tr_admins_updated_at` - Auto-update admin timestamp
- `tr_teachers_updated_at` - Auto-update teacher timestamp
- `tr_students_updated_at` - Auto-update student timestamp
- `tr_working_students_updated_at` - Auto-update working student timestamp

---

## 🔄 Migration Guide

### From Schema v3.x to v4.0

The v4.0 schema is **fully integrated** and includes all previous migrations:

✅ Email fields for all user types (admins, teachers, students, working_students)  
✅ Contact numbers for students and working_students  
✅ PC numbers in attendance table  
✅ Feedback forwarding workflow (pending → forwarded → resolved)  
✅ Enhanced views with all new fields  

#### Migration Options

##### Option 1: Fresh Installation (Recommended for New Deployments)

```bash
# Backup old data
mysqldump -u root -p logbookdb > backup_before_v4.sql

# Drop and recreate
mysql -u root -p -e "DROP DATABASE IF EXISTS logbookdb;"
mysql -u root -p < database/schema_v4_comprehensive.sql

# Import seed data if needed
mysql -u root -p logbookdb < database/seed.sql
```

##### Option 2: Incremental Migration (For Existing Data)

If you have existing data and need to preserve it:

```bash
# 1. Backup
mysqldump -u root -p logbookdb > backup_with_data.sql

# 2. Apply individual migration files (if coming from older versions)
mysql -u root -p logbookdb < database/add_contact_fields.sql
mysql -u root -p logbookdb < database/add_teacher_admin_email.sql
mysql -u root -p logbookdb < database/add_pc_number_to_attendance.sql
mysql -u root -p logbookdb < database/add_feedback_forwarding.sql
mysql -u root -p logbookdb < database/update_view_add_created_by.sql

# 3. Or use the comprehensive schema (will recreate everything)
mysql -u root -p < database/schema_v4_comprehensive.sql
```

⚠️ **Warning:** Using the comprehensive schema will **DROP ALL TABLES**. Make sure you have a complete backup!

##### Option 3: Custom Migration Script

For complex migrations with large amounts of data, consider creating a custom migration script that:

1. Exports data from old structure
2. Applies new schema
3. Imports data with transformations
4. Validates data integrity

---

## ✅ Verification

### Comprehensive Verification Script

```bash
mysql -u root -p logbookdb < database/test_verification.sql
```

### Manual Verification Checklist

#### 1. Check Tables

```sql
USE logbookdb;
SHOW TABLES;
-- Should show 11 tables + 7 views
```

#### 2. Check Foreign Keys

```sql
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'logbookdb'
AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME;
-- Should show 18+ foreign key relationships
```

#### 3. Check Indexes

```sql
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) as COLUMNS
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'logbookdb'
GROUP BY TABLE_NAME, INDEX_NAME
ORDER BY TABLE_NAME;
-- Should show 50+ indexes
```

#### 4. Test Views

```sql
SELECT COUNT(*) FROM v_users_complete;
SELECT COUNT(*) FROM v_classes_complete;
SELECT COUNT(*) FROM v_attendance_complete;
-- Should execute without errors
```

#### 5. Test Stored Procedures

```sql
CALL sp_get_dashboard_stats();
CALL sp_get_recent_logins();
-- Should return results without errors
```

#### 6. Check Triggers

```sql
SHOW TRIGGERS FROM logbookdb;
-- Should show 4 triggers
```

---

## 📁 Schema Files

### Main Schema Files

| File | Purpose | When to Use |
|------|---------|-------------|
| **schema_v4_comprehensive.sql** | ✨ **Complete v4.0 schema** | **Use this for new installations** |
| schema.sql | Legacy schema v3.0 | Reference only, superseded by v4.0 |
| seed.sql | Sample/test data | Load after schema for testing |
| test_verification.sql | Verification tests | Run after installation |

### Migration Files (Historical)

These are now **integrated into v4.0** - you don't need to run them separately:

| File | Purpose | Status |
|------|---------|--------|
| add_contact_fields.sql | Adds email/contact to students | ✅ Integrated in v4.0 |
| add_teacher_admin_email.sql | Adds email to teachers/admins | ✅ Integrated in v4.0 |
| add_pc_number_to_attendance.sql | Adds PC tracking | ✅ Integrated in v4.0 |
| add_feedback_forwarding.sql | Adds feedback workflow | ✅ Integrated in v4.0 |
| update_view_add_created_by.sql | Updates view | ✅ Integrated in v4.0 |

### Documentation Files

| File | Purpose |
|------|---------|
| **SCHEMA_DOCUMENTATION.md** | 📖 **Complete schema documentation** |
| **ERD_VISUAL.txt** | 📊 Visual entity relationship diagram |
| README.md | This file - quick reference guide |

---

## ✨ Key Features

### v4.0 New Features

#### 1. Comprehensive User Management
- 4 distinct user types with dedicated profile tables
- Email fields for all user types
- Contact numbers for students and working students
- Profile photos (Base64 encoded)
- Account security (login attempts, account locking)

#### 2. Advanced Class Management
- On-the-fly subject creation (INSERT...ON DUPLICATE KEY UPDATE)
- Flexible class scheduling with room assignments
- Year level and section tracking
- Semester and school year management
- Working student class creation tracking

#### 3. Flexible Enrollment System
- Many-to-many relationship between classes and students
- Enrollment status tracking (active, dropped, completed)
- Working student enrollment management
- Duplicate enrollment prevention

#### 4. Comprehensive Attendance Tracking
- Linked to enrollment records (not directly to classes)
- PC number tracking for each attendance
- Time in/out recording
- Multiple status types (present, absent, late, excused)
- Teacher recording attribution

#### 5. Equipment Feedback Workflow
- Student submission (status: pending)
- Working student triage and forwarding (status: forwarded)
- Admin/Teacher resolution (status: resolved)
- Condition tracking for equipment components
- Notes at each workflow stage

#### 6. Activity Logging & Security
- Comprehensive login/logout tracking
- PC number recording
- Session duration calculation
- Failed login tracking
- IP address and user agent logging

#### 7. Performance Optimization
- 50+ strategic indexes
- Optimized views for complex queries
- Stored procedures for common operations
- Proper CASCADE rules for data integrity

---

## 🎯 Common Use Cases

### Use Case 1: Creating a New Class

```sql
-- Step 1: Create or get subject
CALL sp_create_or_get_subject('IT301', 'Web Development', 5, 'Advanced web technologies');

-- Step 2: Create class instance
INSERT INTO classes (subject_id, teacher_id, schedule, room, year_level, section, 
                     semester, school_year, created_by, is_active)
VALUES (1, 5, 'MWF 1:00-2:00 PM', 'Lab 2', '3rd Year', 'A', 
        '1st Semester', '2024-2025', 3, TRUE);

-- Step 3: Enroll students
CALL sp_enroll_student(1, 10, 3);  -- Enroll student ID 10
CALL sp_enroll_student(1, 11, 3);  -- Enroll student ID 11
```

### Use Case 2: Recording Attendance

```sql
-- Get enrolled students for a class
CALL sp_get_class_students(1);

-- Record attendance for each student
CALL sp_record_attendance(
    5,                    -- classlist_id (from enrollment)
    CURDATE(),           -- date
    '13:00:00',          -- time_in
    '14:00:00',          -- time_out
    'PC-15',             -- pc_number
    'present',           -- status
    NULL,                -- remarks
    5                    -- recorded_by (teacher_id)
);
```

### Use Case 3: Processing Feedback

```sql
-- Student submits feedback
INSERT INTO feedback (student_id, first_name, last_name, pc_number, 
                     equipment_condition, monitor_condition, status)
VALUES (10, 'John', 'Doe', 'PC-15', 'Minor Issue', 'Good', 'pending');

-- Working student forwards to admin
UPDATE feedback 
SET status = 'forwarded',
    forwarded_by = 3,
    forwarded_at = NOW(),
    working_student_notes = 'Monitor flickering intermittently'
WHERE id = 1;

-- Admin resolves issue
UPDATE feedback 
SET status = 'resolved',
    reviewed_by = 1,
    reviewed_at = NOW(),
    resolution_notes = 'Replaced monitor cable, issue resolved'
WHERE id = 1;
```

---

## 🔧 Maintenance

### Regular Maintenance Tasks

#### Daily
```sql
-- Backup database
mysqldump -u root -p logbookdb > daily_backup_$(date +%Y%m%d).sql
```

#### Weekly
```sql
-- Check database size
SELECT 
    table_schema AS "Database",
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS "Size (MB)"
FROM information_schema.TABLES
WHERE table_schema = 'logbookdb'
GROUP BY table_schema;

-- Check for locked accounts
SELECT * FROM users WHERE locked_until > NOW();
```

#### Monthly
```sql
-- Optimize tables
OPTIMIZE TABLE users, students, teachers, classes, attendance;

-- Analyze tables for query optimization
ANALYZE TABLE users, students, teachers, classes, attendance;
```

#### Quarterly
```sql
-- Archive old login logs (keep last 90 days)
DELETE FROM login_logs WHERE login_time < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- Archive completed classes from previous years
UPDATE classes 
SET is_active = FALSE 
WHERE school_year < '2024-2025';
```

---

## 📊 Statistics

### Database Metrics

- **Total Tables:** 11
- **Total Views:** 7
- **Stored Procedures:** 9
- **Triggers:** 4
- **Foreign Keys:** 18+
- **Indexes:** 50+
- **Supported Users:** Unlimited
- **Supported Concurrent Sessions:** Database-dependent

### Estimated Storage

| Component | Approximate Size |
|-----------|------------------|
| Schema (empty) | ~2 MB |
| Per User | ~2 KB |
| Per Class | ~1 KB |
| Per Attendance Record | ~500 bytes |
| Per Feedback | ~2 KB |
| Per Login Log | ~500 bytes |

**Example:** 1,000 students, 100 classes, 10,000 attendance records:
- Total: ~2 MB (schema) + 2 MB (users) + 100 KB (classes) + 5 MB (attendance) = **~10 MB**

---

## 🆘 Support

### Common Issues

#### Issue 1: Foreign Key Constraint Errors

**Problem:** Error 1452: Cannot add or update a child row

**Solution:** Ensure parent record exists before inserting child record
```sql
-- Check if user exists before creating student
SELECT id FROM users WHERE id = 10;
-- Then insert student
INSERT INTO students (user_id, ...) VALUES (10, ...);
```

#### Issue 2: Duplicate Entry Errors

**Problem:** Error 1062: Duplicate entry 'username' for key 'username'

**Solution:** Use INSERT...ON DUPLICATE KEY UPDATE or check first
```sql
-- Check if username exists
SELECT username FROM users WHERE username = 'john.doe';
-- Or use IGNORE
INSERT IGNORE INTO users (username, ...) VALUES ('john.doe', ...);
```

#### Issue 3: View Errors After Schema Changes

**Problem:** View references invalid columns

**Solution:** Recreate views after table modifications
```sql
DROP VIEW IF EXISTS v_users_complete;
-- Then recreate from schema
```

### Getting Help

1. **Check Documentation:** Read SCHEMA_DOCUMENTATION.md for detailed information
2. **Review ERD:** Open ERD_VISUAL.txt to understand relationships
3. **Run Verification:** Execute test_verification.sql to identify issues
4. **Check Logs:** Review MySQL error logs for detailed error messages

---

## 📝 Version History

| Version | Date | Description |
|---------|------|-------------|
| **4.0** | 2025-10-24 | **Comprehensive integration** - All features unified |
| 3.1 | 2025-10-14 | On-the-fly subject creation |
| 3.0 | 2025-10-14 | New enrollment system (subjects + classes + classlist) |
| 2.0 | 2025-09-15 | Enhanced authentication and login tracking |
| 1.0 | 2025-08-01 | Initial schema |

---

## 📚 Additional Resources

- **SCHEMA_DOCUMENTATION.md** - Complete table, view, and procedure documentation
- **ERD_VISUAL.txt** - Visual entity relationship diagram with relationship matrix
- **seed.sql** - Sample data for testing and development
- **test_verification.sql** - Comprehensive verification tests

---

## 📄 License

This database schema is part of the Digital Logbook Wails Application.  
Refer to the main project LICENSE file for licensing information.

---

**Last Updated:** October 24, 2025  
**Schema Version:** 4.0 - Comprehensive Integration  
**Maintained By:** Digital Logbook Development Team

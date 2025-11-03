# Digital Logbook Database Schema Documentation

**Version:** 4.0 - Comprehensive Integration  
**Last Updated:** October 24, 2025  
**Database Name:** `logbookdb`

---

## Table of Contents

1. [Overview](#overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Table Descriptions](#table-descriptions)
4. [Relationship Details](#relationship-details)
5. [Views](#views)
6. [Stored Procedures](#stored-procedures)
7. [Triggers](#triggers)
8. [Workflows](#workflows)
9. [Migration Guide](#migration-guide)

---

## Overview

The Digital Logbook Database is designed to manage a comprehensive educational facility management system. It handles user authentication, class management, student enrollment, attendance tracking, equipment feedback, and activity logging.

### Key Features

- ✅ Multi-role user management (Admin, Teacher, Student, Working Student)
- ✅ Dynamic subject and class creation
- ✅ Flexible student enrollment system (many-to-many)
- ✅ Comprehensive attendance tracking with PC assignments
- ✅ Equipment condition feedback with workflow management
- ✅ Detailed login/logout activity logging
- ✅ Performance-optimized with indexes and views
- ✅ Data integrity through foreign keys and constraints

### Database Statistics

| Category | Count |
|----------|-------|
| Tables | 11 |
| Views | 7 |
| Stored Procedures | 9 |
| Triggers | 4 |
| Foreign Keys | 18 |
| Indexes | 50+ |

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            CORE ENTITY: USERS                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ id (PK) │ username │ password │ user_type │ is_active │ ...      │  │
│  └────┬────────────┬─────────┬────────────┬──────────────────────────┘  │
└───────┼────────────┼─────────┼────────────┼─────────────────────────────┘
        │            │         │            │
        │ 1:1        │ 1:1     │ 1:1        │ 1:1
        ▼            ▼         ▼            ▼
    ┌───────┐   ┌─────────┐ ┌─────────┐ ┌──────────────────┐
    │ADMINS │   │TEACHERS │ │STUDENTS │ │WORKING_STUDENTS  │
    └───────┘   └────┬────┘ └────┬────┘ └────────┬─────────┘
                     │           │               │
                     │ 1:M       │ M:M           │ 1:M
                     ▼           │               ▼
               ┌──────────┐      │         ┌──────────┐
               │SUBJECTS  │      │         │CLASSES   │◄──────────┐
               │(Courses) │      │         │(created) │           │
               └────┬─────┘      │         └────┬─────┘           │
                    │ 1:M        │              │ 1:M             │
                    ▼            │              ▼                 │
               ┌──────────┐      │         ┌──────────┐           │
               │CLASSES   │      └────────►│CLASSLIST │           │
               │(taught)  │                │(Enroll.) │           │
               └────┬─────┘                └────┬─────┘           │
                    │                           │ 1:M             │
                    │                           ▼                 │
                    │                      ┌───────────┐          │
                    └─────────────────────►│ATTENDANCE │          │
                                           └───────────┘          │
                                                                  │
┌─────────────────────────────────────────────────────────────────┘
│
│ OTHER RELATIONSHIPS FROM USERS:
├─► LOGIN_LOGS (1:M) - Activity tracking
└─► FEEDBACK (1:M) - Equipment reports
    ├── forwarded_by → WORKING_STUDENTS
    └── reviewed_by → ADMINS/TEACHERS
```

---

## Table Descriptions

### 1. **users** (Core Authentication)

The central table for all user authentication and authorization.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK) | Unique user identifier |
| `username` | VARCHAR(50) | Unique login username |
| `password` | VARCHAR(255) | User password (should be hashed) |
| `user_type` | ENUM | Role: admin, teacher, student, working_student |
| `is_active` | BOOLEAN | Account status (active/inactive) |
| `last_login` | TIMESTAMP | Last successful login time |
| `login_attempts` | INT | Failed login counter (security) |
| `locked_until` | TIMESTAMP | Account lock expiration (security) |
| `created_at` | TIMESTAMP | Account creation timestamp |
| `updated_at` | TIMESTAMP | Last modification timestamp |

**Relationships:**
- 1:1 with `admins`, `teachers`, `students`, or `working_students`
- 1:M with `login_logs`, `feedback`, `classlist`

---

### 2. **admins** (Administrator Profiles)

Profile information for administrator users.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK) | Admin record identifier |
| `user_id` | INT (FK) | Link to users table |
| `admin_id` | VARCHAR(50) | Employee/Admin ID number |
| `first_name` | VARCHAR(100) | First name |
| `middle_name` | VARCHAR(100) | Middle name (optional) |
| `last_name` | VARCHAR(100) | Last name |
| `gender` | ENUM | Male/Female/Other |
| `email` | VARCHAR(255) | Email address |
| `profile_photo` | MEDIUMTEXT | Base64 profile photo |
| `created_at` | TIMESTAMP | Record creation |
| `updated_at` | TIMESTAMP | Last update |

**Key Constraint:** `user_id` UNIQUE (one admin profile per user)

---

### 3. **teachers** (Teacher Profiles)

Profile information for teacher users.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK) | Teacher record identifier |
| `user_id` | INT (FK) | Link to users table |
| `teacher_id` | VARCHAR(50) | Employee/Teacher ID number |
| `first_name` | VARCHAR(100) | First name |
| `middle_name` | VARCHAR(100) | Middle name (optional) |
| `last_name` | VARCHAR(100) | Last name |
| `gender` | ENUM | Male/Female/Other |
| `email` | VARCHAR(255) | Email address |
| `profile_photo` | MEDIUMTEXT | Base64 profile photo |
| `created_at` | TIMESTAMP | Record creation |
| `updated_at` | TIMESTAMP | Last update |

**Key Constraint:** `user_id` UNIQUE (one teacher profile per user)

---

### 4. **students** (Student Profiles)

Profile information for regular student users.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK) | Student record identifier |
| `user_id` | INT (FK) | Link to users table |
| `student_id` | VARCHAR(50) | Student ID number |
| `first_name` | VARCHAR(100) | First name |
| `middle_name` | VARCHAR(100) | Middle name (optional) |
| `last_name` | VARCHAR(100) | Last name |
| `gender` | ENUM | Male/Female/Other |
| `email` | VARCHAR(255) | Email address |
| `contact_number` | VARCHAR(20) | Phone/contact number |
| `year_level` | VARCHAR(20) | Academic year (1st, 2nd, 3rd, 4th) |
| `section` | VARCHAR(50) | Class section (A, B, C, etc.) |
| `profile_photo` | MEDIUMTEXT | Base64 profile photo |
| `created_at` | TIMESTAMP | Record creation |
| `updated_at` | TIMESTAMP | Last update |

**Key Constraint:** `user_id` UNIQUE (one student profile per user)

---

### 5. **working_students** (Working Student Profiles)

Profile information for working students (student assistants with administrative privileges).

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK) | Working student record identifier |
| `user_id` | INT (FK) | Link to users table |
| `student_id` | VARCHAR(50) | Student ID number |
| `first_name` | VARCHAR(100) | First name |
| `middle_name` | VARCHAR(100) | Middle name (optional) |
| `last_name` | VARCHAR(100) | Last name |
| `gender` | ENUM | Male/Female/Other |
| `email` | VARCHAR(255) | Email address |
| `contact_number` | VARCHAR(20) | Phone/contact number |
| `year_level` | VARCHAR(20) | Academic year |
| `section` | VARCHAR(50) | Class section |
| `profile_photo` | MEDIUMTEXT | Base64 profile photo |
| `created_at` | TIMESTAMP | Record creation |
| `updated_at` | TIMESTAMP | Last update |

**Key Constraint:** `user_id` UNIQUE (one working student profile per user)

---

### 6. **subjects** (Courses/Subjects)

Academic subjects/courses that can be taught.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK) | Subject identifier |
| `subject_code` | VARCHAR(20) | Unique course code (IT301, CS101, etc.) |
| `subject_name` | VARCHAR(200) | Full subject name |
| `teacher_id` | INT (FK) | Primary teacher for this subject |
| `description` | TEXT | Course description (optional) |
| `created_at` | TIMESTAMP | Record creation |
| `updated_at` | TIMESTAMP | Last update |

**Key Constraint:** `subject_code` UNIQUE (enables on-the-fly creation with INSERT...ON DUPLICATE KEY UPDATE)

**Relationships:**
- M:1 with `teachers` (each subject has one primary teacher)
- 1:M with `classes` (a subject can have multiple class instances)

---

### 7. **classes** (Class Instances)

Specific instances of subjects with schedules, rooms, and sections.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK) | Class identifier |
| `subject_id` | INT (FK) | Link to subjects table |
| `teacher_id` | INT (FK) | Teacher assigned to this class |
| `schedule` | VARCHAR(100) | Class schedule (MWF 1:00-2:00 PM) |
| `room` | VARCHAR(50) | Classroom/lab location |
| `year_level` | VARCHAR(20) | Target year level |
| `section` | VARCHAR(50) | Class section identifier |
| `semester` | VARCHAR(20) | Academic semester |
| `school_year` | VARCHAR(20) | Academic year (2024-2025) |
| `created_by` | INT (FK) | Working student who created this class |
| `is_active` | BOOLEAN | Whether class is active |
| `created_at` | TIMESTAMP | Record creation |
| `updated_at` | TIMESTAMP | Last update |

**Relationships:**
- M:1 with `subjects` (each class belongs to one subject)
- M:1 with `teachers` (each class has one teacher)
- M:1 with `working_students` (created_by, nullable)
- 1:M with `classlist` (a class can have many enrolled students)

---

### 8. **classlist** (Student Enrollments - Bridge Table)

Many-to-many relationship between classes and students.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK) | Enrollment record identifier |
| `class_id` | INT (FK) | Link to classes table |
| `student_id` | INT (FK) | Link to users table (student) |
| `enrollment_date` | DATE | Date of enrollment |
| `status` | ENUM | active, dropped, completed |
| `enrolled_by` | INT (FK) | Working student who enrolled |
| `created_at` | TIMESTAMP | Record creation |
| `updated_at` | TIMESTAMP | Last update |

**Key Constraint:** `UNIQUE(class_id, student_id)` (prevent duplicate enrollments)

**Relationships:**
- M:1 with `classes`
- M:1 with `users` (students)
- M:1 with `working_students` (enrolled_by, nullable)
- 1:M with `attendance`

---

### 9. **attendance** (Attendance Records)

Student attendance tracking for class sessions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK) | Attendance record identifier |
| `classlist_id` | INT (FK) | Link to enrollment record |
| `date` | DATE | Attendance date |
| `time_in` | TIME | Check-in time |
| `time_out` | TIME | Check-out time |
| `pc_number` | VARCHAR(20) | Computer/PC number used |
| `status` | ENUM | present, absent, late, excused |
| `remarks` | TEXT | Additional notes |
| `recorded_by` | INT (FK) | Teacher who recorded attendance |
| `created_at` | TIMESTAMP | Record creation |
| `updated_at` | TIMESTAMP | Last update |

**Key Constraint:** `UNIQUE(classlist_id, date)` (one attendance record per student per day)

**Relationships:**
- M:1 with `classlist` (linked to enrollment, not directly to class)
- M:1 with `teachers` (recorded_by, nullable)

---

### 10. **login_logs** (Login Activity Tracking)

Tracks user login/logout activities for security and auditing.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK) | Log record identifier |
| `user_id` | INT (FK) | User who logged in |
| `user_type` | ENUM | User role type |
| `pc_number` | VARCHAR(50) | Computer identifier |
| `login_time` | DATETIME | Login timestamp |
| `logout_time` | DATETIME | Logout timestamp (NULL if still logged in) |
| `ip_address` | VARCHAR(45) | IP address (IPv4/IPv6) |
| `user_agent` | TEXT | Browser/client info |
| `session_duration` | INT | Session length in seconds |
| `login_status` | ENUM | success, failed, logout |
| `failure_reason` | VARCHAR(255) | Reason for failed login |
| `created_at` | TIMESTAMP | Record creation |

**Relationships:**
- M:1 with `users`

---

### 11. **feedback** (Equipment Condition Reports)

Equipment condition reports with workflow management.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK) | Feedback record identifier |
| `student_id` | INT (FK) | Student who submitted |
| `first_name` | VARCHAR(100) | Student first name (denormalized) |
| `middle_name` | VARCHAR(100) | Student middle name (denormalized) |
| `last_name` | VARCHAR(100) | Student last name (denormalized) |
| `pc_number` | VARCHAR(50) | PC being reported |
| `equipment_condition` | ENUM | Good, Minor Issue, Not Working |
| `monitor_condition` | ENUM | Good, Minor Issue, Not Working |
| `keyboard_condition` | ENUM | Good, Minor Issue, Not Working |
| `mouse_condition` | ENUM | Good, Minor Issue, Not Working |
| `comments` | TEXT | Additional details |
| `status` | ENUM | pending, forwarded, resolved |
| `forwarded_by` | INT (FK) | Working student who forwarded |
| `forwarded_at` | DATETIME | Forwarding timestamp |
| `working_student_notes` | TEXT | Working student's notes |
| `reviewed_by` | INT (FK) | Admin/teacher who reviewed |
| `reviewed_at` | TIMESTAMP | Review timestamp |
| `resolution_notes` | TEXT | Resolution details |
| `date_submitted` | DATETIME | Submission timestamp |
| `created_at` | TIMESTAMP | Record creation |

**Relationships:**
- M:1 with `users` (student_id)
- M:1 with `users` (forwarded_by, nullable)
- M:1 with `users` (reviewed_by, nullable)

---

## Relationship Details

### Complete Relationship Map

```
users (1) ──────────────── (1) admins
users (1) ──────────────── (1) teachers
users (1) ──────────────── (1) students
users (1) ──────────────── (1) working_students
users (1) ──────────────── (M) login_logs
users (1) ──────────────── (M) feedback [as student_id]
users (1) ──────────────── (M) feedback [as forwarded_by]
users (1) ──────────────── (M) feedback [as reviewed_by]
users (1) ──────────────── (M) classlist [as student_id]

teachers (1) ────────────── (M) subjects [as teacher_id]
teachers (1) ────────────── (M) classes [as teacher_id]
teachers (1) ────────────── (M) attendance [as recorded_by]

working_students (1) ────── (M) classes [as created_by]
working_students (1) ────── (M) classlist [as enrolled_by]

subjects (1) ────────────── (M) classes [as subject_id]

classes (1) ─────────────── (M) classlist [as class_id]

classlist (1) ───────────── (M) attendance [as classlist_id]
```

### Cascade Behavior

| Parent | Child | On Delete |
|--------|-------|-----------|
| users → profiles (admin/teacher/student/working_student) | CASCADE |
| users → login_logs | CASCADE |
| users → feedback | CASCADE |
| users → classlist | CASCADE |
| teachers → subjects | CASCADE |
| teachers → classes | CASCADE |
| subjects → classes | CASCADE |
| classes → classlist | CASCADE |
| classlist → attendance | CASCADE |
| teachers/working_students → attendance/classes/classlist | SET NULL (creator references) |

---

## Views

### 1. **v_users_complete**

Unified view of all user information across all user types.

**Purpose:** Simplifies queries that need user details regardless of role.

**Columns:** id, username, user_type, is_active, first_name, middle_name, last_name, gender, email, contact_number, employee_id, student_id_str, year_level, section, profile_photo

**Usage Example:**
```sql
SELECT * FROM v_users_complete 
WHERE user_type = 'student' AND year_level = '3rd Year';
```

---

### 2. **v_login_logs_complete**

Login logs enriched with user full names.

**Purpose:** Provides human-readable login history.

**Columns:** id, user_id, user_type, pc_number, login_time, logout_time, session_duration, first_name, middle_name, last_name, full_name

**Usage Example:**
```sql
SELECT * FROM v_login_logs_complete 
WHERE login_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY login_time DESC;
```

---

### 3. **v_classes_complete**

Complete class information with subject and teacher details.

**Purpose:** Shows all class details in one view.

**Columns:** class_id, subject_id, subject_code, subject_name, teacher_id, teacher_code, teacher_name, schedule, room, year_level, section, semester, school_year, is_active, created_by, created_at

**Usage Example:**
```sql
SELECT * FROM v_classes_complete 
WHERE is_active = TRUE AND semester = '1st Semester';
```

---

### 4. **v_classlist_complete**

Student enrollments with complete student information.

**Purpose:** Shows who is enrolled in which classes.

**Columns:** classlist_id, class_id, student_id, enrollment_date, enrollment_status, username, user_type, student_code, first_name, middle_name, last_name, year_level, section

**Usage Example:**
```sql
SELECT * FROM v_classlist_complete 
WHERE class_id = 5 AND enrollment_status = 'active';
```

---

### 5. **v_teacher_classes**

Teacher's classes with enrollment counts.

**Purpose:** Dashboard view for teachers showing their classes and student counts.

**Columns:** class_id, subject_id, subject_code, subject_name, teacher_id, teacher_name, schedule, room, year_level, section, semester, school_year, enrolled_count, is_active, created_by, created_at

**Usage Example:**
```sql
SELECT * FROM v_teacher_classes 
WHERE teacher_id = 3 AND is_active = TRUE;
```

---

### 6. **v_attendance_complete**

Attendance records with full student and class context.

**Purpose:** Complete attendance reports with all related information.

**Columns:** attendance_id, classlist_id, date, time_in, time_out, pc_number, status, remarks, recorded_by, class_id, student_id, student_code, first_name, middle_name, last_name, subject_code, subject_name, teacher_name, room, year_level, section

**Usage Example:**
```sql
SELECT * FROM v_attendance_complete 
WHERE date = CURDATE() AND status = 'present';
```

---

### 7. **v_feedback**

Feedback reports with student and forwarding information.

**Purpose:** Shows equipment feedback with workflow status.

**Columns:** id, student_id, student_id_str, first_name, middle_name, last_name, student_name, pc_number, equipment_condition, monitor_condition, keyboard_condition, mouse_condition, comments, date_submitted, status, forwarded_by, forwarded_at, working_student_notes, reviewed_by, reviewed_at, resolution_notes, forwarded_by_name

**Usage Example:**
```sql
SELECT * FROM v_feedback 
WHERE status = 'forwarded' 
ORDER BY date_submitted DESC;
```

---

## Stored Procedures

### 1. **sp_log_login**(user_id, user_type, pc_number, ip_address, user_agent, login_status)

Logs a user login and updates user login statistics.

**Returns:** log_id

**Behavior:**
- Creates login_logs entry
- Updates users.last_login on success
- Increments users.login_attempts on failure

---

### 2. **sp_log_logout**(log_id)

Updates login log with logout time and calculates session duration.

**Behavior:**
- Sets logout_time to NOW()
- Calculates session_duration in seconds

---

### 3. **sp_get_recent_logins**()

Gets count of successful logins in the last 24 hours.

**Returns:** recent_logins (count)

---

### 4. **sp_get_dashboard_stats**()

Gets comprehensive system statistics for admin dashboard.

**Returns:** total_students, total_teachers, working_students, recent_logins, pending_feedback, today_attendance, active_classes

---

### 5. **sp_get_teacher_classes**(teacher_id)

Gets all classes for a specific teacher.

**Returns:** Result set from v_teacher_classes

---

### 6. **sp_get_class_students**(class_id)

Gets all active students enrolled in a specific class.

**Returns:** classlist_id, student_id, student_code, first_name, middle_name, last_name, year_level, section, enrollment_status, enrollment_date

---

### 7. **sp_enroll_student**(class_id, student_id, enrolled_by)

Enrolls a student in a class or reactivates enrollment.

**Returns:** classlist_id

**Behavior:**
- INSERT ON DUPLICATE KEY UPDATE
- Sets status = 'active' if already enrolled

---

### 8. **sp_record_attendance**(classlist_id, date, time_in, time_out, pc_number, status, remarks, recorded_by)

Records or updates attendance for a student.

**Returns:** attendance_id

**Behavior:**
- INSERT ON DUPLICATE KEY UPDATE
- Updates existing attendance if found for same date

---

### 9. **sp_create_or_get_subject**(subject_code, subject_name, teacher_id, description)

Creates a subject or returns existing one (for on-the-fly creation).

**Returns:** id, subject_code, subject_name, teacher_id, description

**Behavior:**
- INSERT ON DUPLICATE KEY UPDATE
- Enables dynamic subject creation when creating classes

---

## Triggers

### 1. **tr_admins_updated_at**

Auto-updates `admins.updated_at` timestamp on UPDATE.

---

### 2. **tr_teachers_updated_at**

Auto-updates `teachers.updated_at` timestamp on UPDATE.

---

### 3. **tr_students_updated_at**

Auto-updates `students.updated_at` timestamp on UPDATE.

---

### 4. **tr_working_students_updated_at**

Auto-updates `working_students.updated_at` timestamp on UPDATE.

---

## Workflows

### 1. Class Creation Workflow (Working Student)

```
1. Working student enters:
   - Subject Code (e.g., IT301)
   - Subject Name (e.g., Web Development)
   - Teacher selection
   - Schedule, Room, etc.

2. System calls: sp_create_or_get_subject()
   - Creates subject if new
   - Updates subject if exists

3. System creates class instance:
   INSERT INTO classes (subject_id, teacher_id, ..., created_by)

4. Working student enrolls students:
   CALL sp_enroll_student(class_id, student_id, working_student_id)
```

---

### 2. Attendance Workflow (Teacher)

```
1. Teacher selects class from v_teacher_classes

2. System loads enrolled students:
   CALL sp_get_class_students(class_id)

3. Teacher records attendance for each student:
   CALL sp_record_attendance(
       classlist_id, date, time_in, time_out, 
       pc_number, status, remarks, teacher_id
   )

4. Attendance is linked to classlist_id (enrollment record)
```

---

### 3. Feedback Workflow

```
┌──────────────────────────────────────────────────┐
│ Step 1: Student Submits Feedback                 │
│ - INSERT INTO feedback (status = 'pending')      │
└─────────────────┬────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────┐
│ Step 2: Working Student Reviews                  │
│ - UPDATE feedback SET                            │
│   status = 'forwarded',                          │
│   forwarded_by = working_student_id,             │
│   forwarded_at = NOW(),                          │
│   working_student_notes = '...'                  │
└─────────────────┬────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────┐
│ Step 3: Admin/Teacher Resolves                   │
│ - UPDATE feedback SET                            │
│   status = 'resolved',                           │
│   reviewed_by = admin_id,                        │
│   reviewed_at = NOW(),                           │
│   resolution_notes = '...'                       │
└──────────────────────────────────────────────────┘
```

---

### 4. Login Workflow

```
1. User submits credentials

2. System validates:
   SELECT * FROM users WHERE username = ?

3. On success:
   CALL sp_log_login(user_id, user_type, pc_number, ...)
   - Creates login_logs entry
   - Updates users.last_login
   - Resets users.login_attempts

4. User performs actions...

5. On logout:
   CALL sp_log_logout(log_id)
   - Sets logout_time
   - Calculates session_duration
```

---

### 5. Enrollment Workflow (Working Student)

```
1. Working student creates or selects a class

2. System queries available students:
   SELECT * FROM v_users_complete 
   WHERE user_type IN ('student', 'working_student')
   AND id NOT IN (
       SELECT student_id FROM classlist 
       WHERE class_id = ? AND status = 'active'
   )

3. Working student selects students to enroll

4. For each student:
   CALL sp_enroll_student(class_id, student_id, working_student_id)
   - Creates classlist entry
   - Links student to class (many-to-many)

5. Enrollment visible in v_classlist_complete
```

---

## Migration Guide

### From Old Schema to v4.0

#### Step 1: Backup Your Database

```bash
mysqldump -u root -p logbookdb > logbookdb_backup_$(date +%Y%m%d).sql
```

#### Step 2: Apply New Schema

```bash
mysql -u root -p < schema_v4_comprehensive.sql
```

#### Step 3: Verify Schema

```sql
USE logbookdb;

-- Check tables
SHOW TABLES;

-- Check views
SHOW FULL TABLES WHERE TABLE_TYPE = 'VIEW';

-- Check procedures
SHOW PROCEDURE STATUS WHERE Db = 'logbookdb';

-- Check triggers
SHOW TRIGGERS;

-- Verify foreign keys
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'logbookdb'
AND REFERENCED_TABLE_NAME IS NOT NULL;
```

#### Step 4: Test Key Operations

```sql
-- Test user lookup
SELECT * FROM v_users_complete LIMIT 5;

-- Test class information
SELECT * FROM v_classes_complete WHERE is_active = TRUE LIMIT 5;

-- Test recent logins
CALL sp_get_recent_logins();

-- Test dashboard stats
CALL sp_get_dashboard_stats();
```

---

## Performance Optimization

### Indexes Summary

The schema includes 50+ indexes for optimal query performance:

1. **Primary Keys:** All tables (automatic index)
2. **Foreign Keys:** All relationships (automatic index)
3. **Unique Constraints:** username, subject_code, enrollment (class_id + student_id)
4. **Composite Indexes:** (year_level, section), (semester, school_year), (date, classlist_id)
5. **Text Search Indexes:** names, email, subject codes

### Query Optimization Tips

1. **Use Views:** Views are pre-optimized with proper JOINs
2. **Use Stored Procedures:** Reduces network overhead
3. **Filter on Indexed Columns:** Always use indexed columns in WHERE clauses
4. **Limit Results:** Use LIMIT for large datasets
5. **Avoid SELECT *:** Select only needed columns

---

## Security Considerations

### Current Implementation

1. ✅ Foreign key constraints prevent orphaned records
2. ✅ Unique constraints prevent duplicate data
3. ✅ ENUM types enforce valid values
4. ✅ Login attempt tracking for security
5. ✅ Account locking capability
6. ⚠️ Passwords stored in plain text (should be hashed)

### Recommended Improvements

1. **Hash Passwords:** Use bcrypt or Argon2 for password hashing
2. **Add User Permissions Table:** Fine-grained access control
3. **Audit Logs:** Track all data modifications
4. **Rate Limiting:** Prevent brute force attacks
5. **SQL Injection Protection:** Always use prepared statements
6. **Encryption:** Encrypt sensitive data at rest

---

## Maintenance

### Regular Tasks

1. **Backup Database Daily:**
   ```bash
   mysqldump -u root -p logbookdb > backup_$(date +%Y%m%d).sql
   ```

2. **Optimize Tables Monthly:**
   ```sql
   OPTIMIZE TABLE users, students, teachers, classes, attendance;
   ```

3. **Analyze Query Performance:**
   ```sql
   SHOW PROCESSLIST;
   EXPLAIN SELECT * FROM v_attendance_complete WHERE date = CURDATE();
   ```

4. **Archive Old Data:**
   ```sql
   -- Archive login_logs older than 1 year
   DELETE FROM login_logs WHERE login_time < DATE_SUB(NOW(), INTERVAL 1 YEAR);
   ```

---

## Support and Contact

For questions or issues related to this database schema, please contact the development team or refer to the main README.md file in the project root.

**Schema Version:** 4.0  
**Last Updated:** October 24, 2025  
**Maintained By:** Digital Logbook Development Team


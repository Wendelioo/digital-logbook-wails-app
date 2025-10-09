# SQL Files Documentation

This directory contains SQL schema and setup files for the Digital Logbook application.

---

## Available SQL Files

### 1. `schema.sql` - Complete Database Schema ⭐

**Recommended for:** Production setup, learning the database structure

**Contains:**
- Database creation
- All table definitions with detailed comments
- Indexes for performance optimization
- Foreign key constraints
- Useful views for reporting
- Triggers for data integrity
- Verification queries

**Usage:**
```bash
mysql -u root -p < schema.sql
```

**Features:**
- ✅ Complete documentation
- ✅ Views for common queries
- ✅ Triggers for data validation
- ✅ Performance indexes
- ✅ UTF8MB4 charset support

---

### 2. `database_quick_setup.sql` - Quick Setup 🚀

**Recommended for:** Quick testing, minimal setup

**Contains:**
- Database creation
- All table definitions (no views/triggers)
- Sample subjects

**Usage:**
```bash
mysql -u root -p < database_quick_setup.sql
```

**Features:**
- ✅ Fast setup
- ✅ Minimal complexity
- ✅ Ready for application use

---

### 3. `sample_data.sql` - Sample Data Reference

**Recommended for:** Understanding data structure, reference

**Contains:**
- Documentation of sample users
- Sample data structure examples
- Login credentials reference
- Notes about password hashing

**Important:** This file is for REFERENCE ONLY. It does NOT insert actual data because passwords need to be hashed by the application.

**Usage:**
- Read the file to understand data structure
- Let the application create users automatically
- Reference for manual data insertion

---

## Quick Start

### Option 1: Automated Setup (Easiest) ⭐

```bash
# Use the shell script
./setup_database.sh
```

This will:
1. Install MySQL (if needed)
2. Create database
3. Let application create tables and sample data

### Option 2: Manual Setup with SQL Files

```bash
# Step 1: Create database and tables
mysql -u root -p < database_quick_setup.sql

# Step 2: Run the application to create users
wails dev
```

The application will automatically:
- Create users with properly hashed passwords
- Insert sample subjects
- Set up initial data

### Option 3: Full Schema Setup (Advanced)

```bash
# Install complete schema with views and triggers
mysql -u root -p < schema.sql

# Run application to create users
wails dev
```

---

## Database Structure

### Tables Overview

| Table        | Purpose                              | Key Fields                    |
|--------------|--------------------------------------|-------------------------------|
| users        | All user accounts                    | username, role, employee_id   |
| subjects     | Course information                   | code, name, instructor        |
| classlists   | Student enrollment                   | subject_id, students          |
| attendance   | Student attendance records           | student_id, date, status      |
| login_logs   | Login/logout tracking                | user_id, pc_number, time      |
| feedback     | Equipment condition reports          | student_id, equipment, status |

### Relationships

```
users (1) ─────< (N) attendance
users (1) ─────< (N) login_logs
users (1) ─────< (N) feedback
subjects (1) ──< (N) attendance
subjects (1) ──< (N) classlists
```

---

## Password Hashing

**IMPORTANT:** Passwords are hashed using Argon2 algorithm.

### Why You Can't Insert Users Manually

The application uses strong password hashing:
```
Plain Password: "admin123"
↓ [Argon2 with salt]
Hashed Password: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855..."
```

### Creating Users

**Method 1: Let the Application Do It (Recommended)**
```bash
wails dev
# Application automatically creates sample users with hashed passwords
```

**Method 2: Use Application API**
```go
// In your Go code
app.CreateAdmin("EMP001", "Smith", "John", "", "john@example.com")
app.CreateInstructor("EMP002", "Doe", "Jane", "", "Female", "jane@example.com")
app.CreateStudent("2025-0001", "Alice", "", "Johnson", "Female")
```

---

## Login Credentials

After running the application, use these credentials:

### Admin
- **Login Field:** Employee ID
- **Employee ID:** `admin`
- **Password:** `admin123`

### Instructor
- **Login Field:** Employee ID
- **Employee ID:** `instructor1`
- **Password:** `inst123`

### Student
- **Login Field:** Student ID
- **Student ID:** `2025-1234`
- **Password:** `2025-1234`

### Working Student
- **Login Field:** Student ID
- **Student ID:** `working1`
- **Password:** `working1`

---

## Verification Queries

### Check if tables exist
```sql
USE logbookdb;
SHOW TABLES;
```

### Count records in all tables
```sql
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'subjects', COUNT(*) FROM subjects
UNION ALL
SELECT 'attendance', COUNT(*) FROM attendance
UNION ALL
SELECT 'login_logs', COUNT(*) FROM login_logs
UNION ALL
SELECT 'feedback', COUNT(*) FROM feedback;
```

### View all users by role
```sql
SELECT role, COUNT(*) as count, GROUP_CONCAT(username) as usernames
FROM users
GROUP BY role;
```

### Recent login activity
```sql
SELECT user_name, user_type, pc_number, login_time
FROM login_logs
ORDER BY login_time DESC
LIMIT 10;
```

---

## Useful Views (in schema.sql)

If you used `schema.sql`, you have these views:

### recent_logins
```sql
SELECT * FROM recent_logins;
```
Shows last 100 login activities with session duration.

### active_sessions
```sql
SELECT * FROM active_sessions;
```
Shows currently active (not logged out) sessions.

### attendance_summary
```sql
SELECT * FROM attendance_summary WHERE student_name = 'Santos, Juan';
```
Shows attendance statistics per student per subject.

### equipment_reports_summary
```sql
SELECT * FROM equipment_reports_summary;
```
Shows equipment condition reports grouped by PC and condition.

---

## Backup and Restore

### Backup Database
```bash
# Full backup
mysqldump -u root -p logbookdb > logbookdb_backup.sql

# Structure only
mysqldump -u root -p --no-data logbookdb > logbookdb_structure.sql

# Data only
mysqldump -u root -p --no-create-info logbookdb > logbookdb_data.sql
```

### Restore Database
```bash
mysql -u root -p logbookdb < logbookdb_backup.sql
```

---

## Troubleshooting

### "Table already exists"
```sql
-- Drop and recreate
DROP DATABASE IF EXISTS logbookdb;
CREATE DATABASE logbookdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Then run your SQL file again.

### "Access denied"
```bash
# Reset MySQL root password
sudo mysql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'wendel';
FLUSH PRIVILEGES;
EXIT;
```

### "Foreign key constraint fails"
Make sure to insert data in the correct order:
1. users
2. subjects
3. classlists, attendance, login_logs, feedback

---

## Migration from Old Schema

If you have an old database and want to update:

```sql
-- Backup first!
mysqldump -u root -p logbookdb > old_backup.sql

-- Then apply migrations
USE logbookdb;

-- Add missing columns if needed
ALTER TABLE users ADD COLUMN photo_url VARCHAR(500);
ALTER TABLE login_logs ADD COLUMN pc_number VARCHAR(50);
-- etc.
```

---

## Performance Optimization

### Check table sizes
```sql
SELECT 
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS "Size (MB)"
FROM information_schema.TABLES
WHERE table_schema = "logbookdb"
ORDER BY (data_length + index_length) DESC;
```

### Analyze and optimize tables
```sql
ANALYZE TABLE users, subjects, attendance, login_logs, feedback;
OPTIMIZE TABLE users, subjects, attendance, login_logs, feedback;
```

---

## Support

For more information:
- **Database Setup:** `DATABASE_SETUP.md`
- **Quick Setup Script:** `./setup_database.sh`
- **Application README:** `README.md`
- **Schema Reference:** `schema.sql`

---

**Last Updated:** October 9, 2025  
**Database Version:** 2.0  
**MySQL Version:** 8.0+ (or MariaDB 10.5+)


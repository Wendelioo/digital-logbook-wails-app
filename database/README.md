# Database Setup

## For Fresh Installation

If you're setting up the database for the first time, simply run:

```bash
mysql -u root -p < database/schema.sql
```

This will create all tables, views, stored procedures, and insert default system settings.

---

## For Existing Installations (Upgrading from v2.0)

⚠️ **IMPORTANT:** If you have an existing database with the old structure, you'll need to migrate your data manually or create a custom migration script.

### Migration Steps:

1. **Backup your current database:**
   ```bash
   mysqldump -u root -p logbookdb > logbookdb_backup_$(date +%Y%m%d).sql
   ```

2. **Review the new structure** in `schema.sql` to understand the changes

3. **Create a migration strategy** based on your data:
   - Map old `classlist` table to new `subjects` and `classes` tables
   - Create enrollment records in the new `classlist` table
   - Link students to classes via the new enrollment structure
   - Update attendance records to reference `classlist_id` instead of `class_id`

4. **Test on a development database first** before applying to production

---

## Database Structure

### Core Tables:
- `users` - Main authentication table
- `admins`, `teachers`, `students`, `working_students` - Role-specific profiles
- `subjects` - Courses with assigned teachers
- `classes` - Specific instances of subjects (with schedule, room, section)
- `classlist` - Student enrollments (many-to-many relationship)
- `attendance` - Attendance records linked to enrollments
- `login_logs` - Authentication tracking
- `feedback` - Equipment condition reports
- `system_settings` - Application configuration

### Views:
- `v_users_complete` - Unified user information
- `v_login_logs_complete` - Login logs with user details
- `v_classes_complete` - Complete class information with subject/teacher
- `v_classlist_complete` - Enrollment with student details
- `v_teacher_classes` - Teacher's classes with enrollment counts
- `v_attendance_complete` - Attendance with full details

### Stored Procedures:
- `sp_log_login` - Enhanced login logging
- `sp_log_logout` - Logout tracking
- `sp_get_recent_logins` - Recent activity
- `sp_get_dashboard_stats` - System statistics
- `sp_get_teacher_classes` - Get teacher's classes
- `sp_get_class_students` - Get students in a class
- `sp_enroll_student` - Enroll student in class
- `sp_record_attendance` - Record attendance

---

## Verification

After running the schema, verify everything is set up correctly:

```bash
mysql -u root -p logbookdb < database/test_verification.sql
```

This will run comprehensive tests to ensure:
- All tables are created
- All views are accessible
- All foreign keys are in place
- Stored procedures work correctly
- Indexes are optimized

---

## Schema Version

**Current Version:** 3.0  
**Last Updated:** 2025-10-14

### Version History:
- **v3.0** - New enrollment system (subjects, classes, classlist)
- **v2.0** - Enhanced authentication and login tracking
- **v1.0** - Initial schema

---

## Key Relationships

```
teachers → subjects (one-to-many via teacher_id)
subjects → classes (one-to-many via subject_id)
teachers → classes (one-to-many via teacher_id)
classes → classlist → students (many-to-many)
classlist → attendance (one-to-many via classlist_id)
```

---

## Quick Start

```bash
# 1. Create database and tables
mysql -u root -p < database/schema.sql

# 2. Verify installation
mysql -u root -p logbookdb < database/test_verification.sql

# 3. Create seed data (optional)
mysql -u root -p logbookdb < database/seed.sql
```

---

For detailed documentation, see:
- `NEW_ENROLLMENT_SYSTEM_GUIDE.md` - Complete system guide
- `API_REFERENCE.md` - API function reference
- `MIGRATION_CHECKLIST.md` - Migration checklist (for existing installations)


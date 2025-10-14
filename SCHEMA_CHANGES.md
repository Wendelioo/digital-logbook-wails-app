# Database Schema Changes - Summary

## Overview
Updated the database schema to use separate, meaningful column names for different user types instead of generic `employee_id` and `student_id_str` fields.

## Database Schema Changes

### 1. **admins** table
**Before:**
- `admin_id` (INT) - Foreign key to users.id
- `employee_id` (VARCHAR) - The actual admin ID

**After:**
- `user_id` (INT) - Foreign key to users.id  
- `admin_id` (VARCHAR) - The actual admin ID entered by user

### 2. **teachers** table
**Before:**
- `teacher_id` (INT) - Foreign key to users.id
- `employee_id` (VARCHAR) - The actual teacher ID

**After:**
- `user_id` (INT) - Foreign key to users.id
- `teacher_id` (VARCHAR) - The actual teacher ID entered by user

### 3. **students** table
**Before:**
- `student_id` (INT) - Foreign key to users.id
- `student_id_str` (VARCHAR) - The actual student ID

**After:**
- `user_id` (INT) - Foreign key to users.id
- `student_id` (VARCHAR) - The actual student ID entered by user

### 4. **working_students** table
**Before:**
- `student_id` (INT) - Foreign key to users.id
- `student_id_str` (VARCHAR) - The actual student ID

**After:**
- `user_id` (INT) - Foreign key to users.id
- `student_id` (VARCHAR) - The actual student ID entered by user

## Backend Changes (app.go)

### Updated Functions:
1. `Login()` - Updated queries to use `user_id` instead of role-specific IDs for joins
2. `CreateUser()` - Updated INSERT statements to use new column names
3. `UpdateUser()` - Updated UPDATE statements to use new column names
4. `UpdateUserPhoto()` - Updated queries to use `user_id` for WHERE clauses
5. `SaveEquipmentFeedback()` - Updated student lookup queries
6. `GetClassStudents()` - Updated to reference new `student_id` column

### View Updates:
- `v_users_complete` - Updated to join on `user_id` and return proper aliases:
  - `admin_id` and `teacher_id` returned as `employee_id`
  - `student_id` returned as `student_id_str`

## Frontend Changes (AdminDashboard.tsx)

### Registration Forms:
1. **Teacher Registration:**
   - Label changed from "Employee ID" to "**Teacher ID**"
   - Added explicit **Password** field (required for new users)
   - Password is hidden (type="password")
   - Helper text updated

2. **Working Student Registration:**
   - Added explicit **Password** field (required for new users)
   - Password is hidden (type="password")
   - Helper text updated

3. **Form Validation:**
   - Password is required for all new user registrations
   - Password is optional when editing (keeps current password if blank)
   - Clear error notification if password is missing

## Seed Data Changes

### Default Admin Account:
**Before:**
- Username: `admin`
- Password: `admin123`
- Employee ID: `ADMIN001`

**After:**
- Username: `ADMIN001` (uses the admin_id as username)
- Password: `admin123`
- Admin ID: `ADMIN001`

## How to Apply Changes

### 1. Drop and Recreate Database
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

### 2. Rebuild Frontend
```bash
cd frontend
npm run build
```

### 3. Rebuild Application
```bash
wails build
# or for development
wails dev
```

## Login Credentials

**Default Admin:**
- Username: `ADMIN001`
- Password: `admin123`

## Key Benefits

1. **Clearer Column Names:** Each user type has appropriately named ID columns
   - Admins have `admin_id`
   - Teachers have `teacher_id`
   - Students have `student_id`

2. **Consistent Structure:** All tables use `user_id` as the foreign key to `users.id`

3. **Better Security:** Explicit password fields in all registration forms

4. **Improved UX:** Clear labels showing "Teacher ID" instead of generic "Employee ID"

## Migration Notes

If you have existing data, you'll need to:
1. Backup your current database
2. Create migration scripts to rename columns
3. Update foreign key constraints
4. Re-import data with new column mappings

**WARNING:** Running the new schema.sql will DROP all existing tables and data!


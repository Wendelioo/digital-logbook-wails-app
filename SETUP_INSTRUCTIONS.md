# Setup Instructions - Digital Logbook App

## Quick Start

### Step 1: Reset Database (IMPORTANT!)
The database schema has been updated. You need to recreate the database:

```bash
# Login to MySQL
mysql -u root -p

# Run these commands in MySQL:
DROP DATABASE IF EXISTS logbookdb;
CREATE DATABASE logbookdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;

# Apply new schema and seed data
mysql -u root -p logbookdb < database/schema.sql
mysql -u root -p logbookdb < database/seed.sql
```

### Step 2: Frontend is Already Built
The frontend has already been rebuilt with the latest changes. You can skip this step unless you make additional changes.

If you need to rebuild:
```bash
cd frontend
npm run build
cd ..
```

### Step 3: Run the Application

**Option A: Development Mode (Recommended)**
```bash
wails dev
```

**Option B: Build and Run**
```bash
wails build
./build/bin/digital-logbook-wails-app
```

## Login to Test

After setup, you can login with the default admin account:

- **Username:** `ADMIN001`
- **Password:** `admin123`

## What's New?

### 1. Registration Forms Now Have:
- **Explicit Password Fields** for all users (Teachers, Working Students, etc.)
- **Teacher ID** label (instead of "Employee ID") for teachers
- Password is required when creating new users
- Password is optional when editing (keeps current password if left blank)

### 2. Database Structure:
- **admins** table: Uses `admin_id` (VARCHAR) for the actual admin ID
- **teachers** table: Uses `teacher_id` (VARCHAR) for the actual teacher ID  
- **students** table: Uses `student_id` (VARCHAR) for the actual student ID
- All tables use `user_id` (INT) as the foreign key to `users.id`

### 3. Username Format:
- **Admins:** Use their Admin ID as username (e.g., `ADMIN001`)
- **Teachers:** Use their Teacher ID as username (e.g., `T12345`)
- **Students:** Use their Student ID as username (e.g., `2021-1234`)
- **Working Students:** Use their Student ID as username (e.g., `2021-5678`)

## Testing Registration

### Register a New Teacher:
1. Login as admin (ADMIN001 / admin123)
2. Go to "Manage Users" → Click "Add User"
3. Select Role: **Teacher**
4. Fill in:
   - Teacher ID: `T001` (this becomes the username)
   - Password: `teacher123` (or any password you want)
   - First Name, Last Name, Gender
5. Click **SUBMIT**

### Register a New Working Student:
1. Login as admin (ADMIN001 / admin123)
2. Go to "Manage Users" → Click "Add User"
3. Select Role: **Working Student**
4. Fill in:
   - Student ID: `2021-0001` (this becomes the username)
   - Password: `student123` (or any password you want)
   - First Name, Last Name, Gender, Year Level, Section
5. Click **SUBMIT**

## Troubleshooting

### Database Connection Error
- Make sure MySQL is running: `sudo systemctl status mysql`
- Check database credentials in `config.go`
- Verify database exists: `mysql -u root -p -e "SHOW DATABASES;"`

### Build Errors
- Make sure Go is installed: `go version`
- Make sure Wails is installed: `wails version`
- Clear build cache: `wails clean`

### Frontend Not Updated
- Rebuild frontend: `cd frontend && npm run build`
- Clear browser cache (Ctrl+Shift+R)

## Support

For detailed changes, see `SCHEMA_CHANGES.md`


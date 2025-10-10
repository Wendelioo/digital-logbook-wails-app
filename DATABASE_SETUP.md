# Database Setup Guide

This guide explains how to set up the database for the Digital Logbook application.

## Prerequisites

- MySQL 5.7+ or MariaDB 10.3+
- Database named `logbookdb` (matches config.go default) or your preferred name
- Database user with appropriate permissions

## Quick Start

### Step 1: Create the Database

```sql
CREATE DATABASE logbookdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Step 2: Import the Schema

Option A: Using MySQL command line
```bash
mysql -u root -p logbookdb < schema.sql
```

Option B: Using MySQL Workbench or phpMyAdmin
- Import the `schema.sql` file through the GUI

### Step 3: Create Admin Account

The application will automatically create all tables when it starts. You can create the admin account using one of these methods:

#### Method 1: Through the Admin Dashboard UI

If your application has a registration interface for admins, use that to create your first admin account.

#### Method 2: Using SQL with Application-Generated Hash

1. Start your application once to ensure tables are created
2. Use the application to register the admin user through available interfaces

#### Method 3: Manual SQL Insert (Advanced)

If you need to insert an admin account directly via SQL, you'll need to hash the password first using the application's Argon2 hashing function, then insert it manually.

## Database Configuration

Update your `config.go` or environment variables with your database credentials:

```go
Host:     "localhost"
Port:     "3306"
User:     "comp-lab1"        // default from config.go
Password: "computer123"      // default from config.go
Database: "logbookdb"        // default from config.go
```

## Database Schema Overview

### Tables

1. **users** - All user accounts (admin, teacher, student, working_student)
   - `employee_id` - Login credential for admin and teacher roles (unique)
   - `student_id` - Login credential for student and working_student roles (unique)
   - `role` - Determines which login method to use
   - No username field - users authenticate directly with employee_id or student_id
2. **subjects** - Course/subject information
3. **classlists** - Student enrollment per subject
4. **attendance** - Daily attendance records
5. **login_logs** - User login/logout tracking
6. **feedback** - Equipment condition reports

### User Roles and Authentication

Each role has a specific authentication method:

- **admin** - Full system access
  - Authentication: Login using `employee_id` + password
  - Function: `loginAsAdmin()`

- **teacher** - Manage subjects, attendance, classlists
  - Authentication: Login using `employee_id` + password
  - Function: `loginAsTeacher()`

- **student** - View attendance, submit equipment reports
  - Authentication: Login using `student_id` + password
  - Function: `loginAsStudent()`

- **working_student** - Register students, create classlists
  - Authentication: Login using `student_id` + password
  - Function: `loginAsWorkingStudent()`

**Security Note:** Each login function validates both the credentials AND the user's role. This prevents users from accessing the system through the wrong authentication method.

### Creating Your Admin Account

Create your admin account manually after setting up the database. The application provides the `CreateAdmin` function in the backend for this purpose.

## Troubleshooting

### Error: "Unknown database 'logbookdb'"

Create the database first:
```sql
CREATE DATABASE logbookdb;
```

### Error: "Access denied for user"

Grant appropriate permissions:
```sql
GRANT ALL PRIVILEGES ON logbookdb.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

### Foreign Key Constraints Error

Make sure you import the schema in the correct order (it's already ordered correctly in `schema.sql`).

## Manual Admin Creation (Advanced)

If you need to manually hash a password and insert an admin:

1. Run this Go code snippet to generate a hash:
```go
package main

import (
    "crypto/rand"
    "encoding/hex"
    "fmt"
    "golang.org/x/crypto/argon2"
)

func main() {
    password := "admin123"
    salt := make([]byte, 16)
    rand.Read(salt)
    hash := argon2.IDKey([]byte(password), salt, 1, 64*1024, 4, 32)
    saltHash := append(salt, hash...)
    fmt.Println(hex.EncodeToString(saltHash))
}
```

2. Use the output in your SQL:
```sql
INSERT INTO users (password, name, first_name, last_name, role, employee_id)
VALUES ('YOUR_HASH_HERE', 'Administrator, System', 'System', 'Administrator', 'admin', 'ADMIN001');
```

## Backup and Restore

### Backup
```bash
mysqldump -u root -p logbookdb > backup_$(date +%Y%m%d).sql
```

### Restore
```bash
mysql -u root -p logbookdb < backup_20250110.sql
```

## Security Notes

1. **Never commit database credentials** to version control
2. **Change default passwords** immediately
3. **Use strong passwords** for production
4. **Restrict database access** to application server only
5. **Regular backups** are essential
6. **Enable SSL/TLS** for database connections in production

## Additional Resources

- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Argon2 Password Hashing](https://en.wikipedia.org/wiki/Argon2)
- Application documentation: See README.md


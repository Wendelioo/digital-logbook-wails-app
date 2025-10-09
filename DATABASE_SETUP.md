# Database Setup Guide

The application is now configured to use a **real MySQL database** by default. Follow these steps to set up your database.

## Prerequisites

- MySQL Server 8.0 or higher (or MariaDB 10.5+)
- Linux/Ubuntu system with sudo access

## Step 1: Install MySQL

### For Ubuntu/Debian:

```bash
# Update package list
sudo apt update

# Install MySQL Server
sudo apt install mysql-server -y

# Start MySQL service
sudo systemctl start mysql
sudo systemctl enable mysql

# Check status
sudo systemctl status mysql
```

### For other distributions:

**Fedora/RHEL/CentOS:**
```bash
sudo dnf install mysql-server -y
sudo systemctl start mysqld
sudo systemctl enable mysqld
```

**Arch Linux:**
```bash
sudo pacman -S mysql
sudo systemctl start mysqld
sudo systemctl enable mysqld
```

## Step 2: Secure MySQL Installation

```bash
sudo mysql_secure_installation
```

Follow the prompts to:
- Set a root password (or keep existing)
- Remove anonymous users
- Disallow root login remotely
- Remove test database
- Reload privilege tables

## Step 3: Create Database and Tables

### Option A: Use SQL Files (Recommended)

The project includes ready-to-use SQL files:

```bash
# Quick setup (minimal)
mysql -u root -p < database_quick_setup.sql

# OR Full setup (with views and triggers)
mysql -u root -p < schema.sql
```

See `SQL_FILES_README.md` for details about each SQL file.

### Option B: Manual Setup

Login to MySQL as root:

```bash
sudo mysql -u root -p
```

Or if no password was set:

```bash
sudo mysql
```

Run the following SQL commands:

```sql
-- Create the database
CREATE DATABASE IF NOT EXISTS logbookdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create a user (if not using root)
CREATE USER IF NOT EXISTS 'logbook_user'@'localhost' IDENTIFIED BY 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON logbookdb.* TO 'logbook_user'@'localhost';

-- Flush privileges
FLUSH PRIVILEGES;

-- Verify database creation
SHOW DATABASES;

-- Exit MySQL
EXIT;
```

## Step 4: Configure Application

The application is already configured with the following defaults in `config.go`:

```go
Host:     "localhost"
Port:     "3306"
Username: "root"
Password: "wendel"
Database: "logbookdb"
```

### Option A: Use Default Configuration

If you're using:
- Username: `root`
- Password: `wendel`
- Database: `logbookdb`

Then no changes are needed!

### Option B: Use Custom Configuration

If you created a different user or database, set environment variables:

**Linux/Mac (Terminal):**
```bash
export DB_HOST=localhost
export DB_PORT=3306
export DB_USERNAME=logbook_user
export DB_PASSWORD=your_secure_password
export DB_DATABASE=logbookdb
```

**Or create a `.env` file** (requires additional setup):
```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=logbook_user
DB_PASSWORD=your_secure_password
DB_DATABASE=logbookdb
```

## Step 5: Run the Application

```bash
wails dev
```

The application will automatically:
1. Connect to the database
2. Create all required tables
3. Insert sample data with these credentials:

### Default Login Credentials (Database Mode)

**Admin:**
- Employee ID: `admin`
- Password: `admin123`

**Instructor:**
- Employee ID: `instructor1`
- Password: `inst123`

**Students:**
- Student ID: `2025-1234`, Password: `2025-1234`
- Student ID: `2025-5678`, Password: `2025-5678`

**Working Student:**
- Student ID: `working1`, Password: `working1`

## Step 6: Verify Database Setup

Check if tables were created:

```bash
mysql -u root -p logbookdb -e "SHOW TABLES;"
```

Expected tables:
- `users`
- `subjects`
- `classlists`
- `attendance`
- `login_logs`
- `feedback`

## Troubleshooting

### Connection Failed

If you see "Failed to connect to MySQL database":

1. **Check if MySQL is running:**
   ```bash
   sudo systemctl status mysql
   ```

2. **Verify credentials:**
   ```bash
   mysql -u root -p
   # Enter password: wendel
   ```

3. **Check database exists:**
   ```sql
   SHOW DATABASES;
   ```

4. **Test connection:**
   ```bash
   mysql -u root -pwendel -h localhost logbookdb
   ```

### Permission Denied

If you get "Access denied for user":

```sql
-- Login as root
sudo mysql

-- Update root password
ALTER USER 'root'@'localhost' IDENTIFIED BY 'wendel';
FLUSH PRIVILEGES;
```

### Port Already in Use

If port 3306 is already in use, change the port in MySQL config:

```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
# Change: port = 3307

sudo systemctl restart mysql
```

Then set environment variable:
```bash
export DB_PORT=3307
```


## Database Schema

The application automatically creates these tables:

### users
- User accounts for all roles (admin, instructor, student, working_student)

### subjects
- Course/subject information

### classlists
- Student enrollment in subjects

### attendance
- Student attendance records

### login_logs
- User login/logout tracking with PC number (hostname)

### feedback
- Equipment condition reports from students

## Support

If you encounter issues:
1. Check MySQL error logs: `sudo tail -f /var/log/mysql/error.log`
2. Verify network connectivity: `nc -zv localhost 3306`
3. Check application logs in the terminal where you run `wails dev`


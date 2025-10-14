# Login Logs PC Number Fix

## Problem

The "View Logs" feature in the Admin Dashboard was not capturing the PC number (hostname) when users logged in and out. The PC Number column was showing "N/A" for all entries.

### Root Cause

The backend `Login` function in `app.go` was authenticating users successfully but **not creating any entries in the `login_logs` table**. This meant:

1. No login logs were being recorded
2. The PC hostname was never captured
3. The `Logout` function was trying to update records that didn't exist

## Solution

### Changes Made to `app.go`

#### 1. Updated User Struct (Line 63)
Added `LoginLogID` field to track the current login session:
```go
type User struct {
    // ... existing fields ...
    LoginLogID int `json:"login_log_id"` // Track the login session
}
```

#### 2. Enhanced Login Function (Lines 176-200)
Added code to:
- Capture the device hostname using `os.Hostname()`
- Create a login log entry in the database
- Record the PC number, user ID, user type, and login time
- Track the login log ID for the session

```go
// Get the hostname (PC number) of this device
hostname, err := os.Hostname()
if err != nil {
    log.Printf("⚠ Failed to get hostname: %v", err)
    hostname = "Unknown"
}

// Create a login log entry
insertLog := `INSERT INTO login_logs (user_id, user_type, pc_number, login_time, login_status) 
              VALUES (?, ?, ?, NOW(), 'success')`
result, err := a.db.Exec(insertLog, user.ID, user.Role, hostname)
if err != nil {
    log.Printf("⚠ Failed to create login log: %v", err)
    // Don't fail the login if logging fails
} else {
    // Get the log ID for this session
    logID, err := result.LastInsertId()
    if err == nil {
        user.LoginLogID = int(logID)
        log.Printf("✓ Login logged with ID %d for PC: %s", logID, hostname)
    }
}

log.Printf("✓ User login successful: %s (role: %s, pc: %s)", username, user.Role, hostname)
```

#### 3. Enhanced Logout Function (Lines 67-86)
Improved to:
- Update the logout time
- Calculate and store the session duration
- Add better error logging

```go
// Update the most recent login log for this user to set logout time
query := `UPDATE login_logs 
          SET logout_time = NOW(), 
              session_duration = TIMESTAMPDIFF(SECOND, login_time, NOW())
          WHERE user_id = ? AND logout_time IS NULL 
          ORDER BY login_time DESC LIMIT 1`
_, err := a.db.Exec(query, userID)
if err != nil {
    log.Printf("⚠ Failed to log logout for user %d: %v", userID, err)
    return err
}

log.Printf("✓ User logout successful: user_id=%d", userID)
```

## How It Works

### PC Number Capture Mechanism

The system uses Go's `os.Hostname()` function to detect the hostname of the device. This is automatically retrieved from the operating system:

- **Linux/macOS**: Returns the system hostname (e.g., "lab-pc-01", "student-laptop")
- **Windows**: Returns the computer name (e.g., "DESKTOP-ABC123")

The hostname is captured at login time and stored in the `login_logs` table's `pc_number` column.

### Login/Logout Flow

1. **User Logs In**:
   - Username and password are verified
   - System captures the hostname using `os.Hostname()`
   - A new record is created in `login_logs` table with:
     - `user_id`: User's ID
     - `user_type`: Role (admin, teacher, student, working_student)
     - `pc_number`: Device hostname
     - `login_time`: Current timestamp
     - `login_status`: 'success'
   - The login log ID is returned to track this session

2. **User Logs Out**:
   - System finds the most recent login log for the user where `logout_time IS NULL`
   - Updates that record with:
     - `logout_time`: Current timestamp
     - `session_duration`: Calculated in seconds

3. **View Logs Display**:
   - Admin Dashboard queries the `v_login_logs_complete` view
   - Displays all login/logout records with PC numbers
   - Shows user name, type, PC number, time in, time out, and date

## Testing

### To verify the fix works:

1. **Build the application**:
   ```bash
   wails build
   ```
   Or run in development mode:
   ```bash
   wails dev
   ```

2. **Test Login**:
   - Log in with any user account (admin, teacher, or student)
   - Check the terminal/console logs for a message like:
     ```
     ✓ User login successful: username (role: student, pc: your-hostname)
     ✓ Login logged with ID 123 for PC: your-hostname
     ```

3. **Test Logout**:
   - Log out from the application
   - Check for:
     ```
     ✓ User logout successful: user_id=X
     ```

4. **Verify in Admin Dashboard**:
   - Log in as an admin user
   - Navigate to "View Logs" section
   - You should now see:
     - PC Number column populated with hostnames (not "N/A")
     - Login times for all users
     - Logout times when users log out
     - All users' activities being tracked

5. **Database Verification**:
   You can also check directly in MySQL:
   ```sql
   SELECT id, user_id, user_type, pc_number, login_time, logout_time 
   FROM login_logs 
   ORDER BY login_time DESC 
   LIMIT 10;
   ```

## Database Schema

The fix uses the existing `login_logs` table structure defined in `database/schema.sql`:

```sql
CREATE TABLE login_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    user_type ENUM('admin', 'teacher', 'student', 'working_student') NOT NULL,
    pc_number VARCHAR(50),                -- This field now gets populated
    login_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    logout_time DATETIME,                 -- Updated on logout
    ip_address VARCHAR(45),
    user_agent TEXT,
    session_duration INT,                 -- Calculated on logout (in seconds)
    login_status ENUM('success', 'failed', 'logout') DEFAULT 'success',
    failure_reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- ... foreign keys and indexes ...
);
```

## Files Modified

1. `/home/wendel/Desktop/digital-logbook-wails-app/app.go`
   - Added `LoginLogID` to User struct
   - Enhanced `Login()` function to capture hostname and create login logs
   - Enhanced `Logout()` function to update logout time and session duration

## Benefits

✅ **Complete audit trail**: All user logins and logouts are now tracked  
✅ **PC identification**: Know which computer each user logged in from  
✅ **Session tracking**: See how long users were logged in  
✅ **Better security**: Monitor unusual login patterns or multiple logins  
✅ **Compliance**: Meet requirements for activity logging in lab environments  

## Notes

- The hostname detection is automatic and requires no user input
- If hostname detection fails, it defaults to "Unknown" (but login still succeeds)
- Login log creation is non-blocking - if it fails, the user can still log in
- The frontend TypeScript models already included the `login_log_id` field
- The Admin Dashboard UI was already prepared to display PC numbers

## Future Enhancements

Potential improvements that could be made:
- Add IP address tracking (already in schema)
- Add user agent tracking for browser/client info
- Add failed login attempt tracking
- Add session timeout warnings
- Add ability to force logout active sessions
- Add PC number reports and statistics


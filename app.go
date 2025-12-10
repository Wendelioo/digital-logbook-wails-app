package main

import (
	"context"
	"database/sql"
	"encoding/base64"
	"encoding/csv"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/jung-kurt/gofpdf"
	docx "github.com/lukasjarosch/go-docx"
)

// App struct
type App struct {
	ctx context.Context
	db  *sql.DB
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// Initialize database connection
	db, err := InitDatabase()
	if err != nil {
		log.Printf("Database connection failed: %v", err)
		log.Println("App will start but database features will be unavailable")
	} else {
		a.db = db
		log.Println("Database ready")
		// Run database migrations
		if err := a.runMigrations(); err != nil {
			log.Printf("Warning: Migration failed: %v", err)
		}
	}
}

// runMigrations runs database migrations to ensure schema is up to date
func (a *App) runMigrations() error {
	if a.db == nil {
		return fmt.Errorf("database not connected")
	}

	// Migration: Add forwarded_at column to feedback table if it doesn't exist
	if err := a.migrateAddForwardedAtColumn(); err != nil {
		return fmt.Errorf("failed to migrate forwarded_at column: %w", err)
	}

	return nil
}

// migrateAddForwardedAtColumn adds the forwarded_at column to feedback table if it doesn't exist
func (a *App) migrateAddForwardedAtColumn() error {
	// Check if column exists
	var columnExists int
	checkQuery := `
		SELECT COUNT(*) 
		FROM INFORMATION_SCHEMA.COLUMNS 
		WHERE TABLE_SCHEMA = DATABASE() 
		AND TABLE_NAME = 'feedback' 
		AND COLUMN_NAME = 'forwarded_at'
	`
	err := a.db.QueryRow(checkQuery).Scan(&columnExists)
	if err != nil {
		return fmt.Errorf("failed to check if column exists: %w", err)
	}

	if columnExists > 0 {
		log.Println("Migration: forwarded_at column already exists")
		return nil
	}

	// Column doesn't exist, add it
	log.Println("Migration: Adding forwarded_at column to feedback table...")
	alterQuery := `ALTER TABLE feedback ADD COLUMN forwarded_at DATETIME NULL AFTER forwarded_by`
	_, err = a.db.Exec(alterQuery)
	if err != nil {
		return fmt.Errorf("failed to add forwarded_at column: %w", err)
	}

	// Update existing forwarded records
	updateQuery := `
		UPDATE feedback 
		SET forwarded_at = updated_at 
		WHERE status = 'forwarded' 
		AND forwarded_at IS NULL 
		AND forwarded_by IS NOT NULL
	`
	_, err = a.db.Exec(updateQuery)
	if err != nil {
		log.Printf("Warning: Failed to update existing forwarded records: %v", err)
		// Don't return error, column was added successfully
	}

	// Add index for better performance
	indexQuery := `ALTER TABLE feedback ADD INDEX idx_forwarded_at (forwarded_at)`
	_, err = a.db.Exec(indexQuery)
	if err != nil {
		// Index might already exist or fail, log but don't fail migration
		log.Printf("Info: Index creation result (may already exist): %v", err)
	}

	log.Println("Migration: Successfully added forwarded_at column")
	return nil
}

// ==============================================================================
// AUTHENTICATION & USER MANAGEMENT
// ==============================================================================

// User represents a user in the system
type User struct {
	ID            int     `json:"id"`
	Password      string  `json:"password"`
	Name          string  `json:"name"`
	FirstName     *string `json:"first_name"`
	MiddleName    *string `json:"middle_name"`
	LastName      *string `json:"last_name"`
	Gender        *string `json:"gender"`
	Role          string  `json:"role"`
	EmployeeID    *string `json:"employee_id"`
	StudentID     *string `json:"student_id"`
	Year          *string `json:"year"`
	Section       *string `json:"section"`
	Email         *string `json:"email"`
	ContactNumber *string `json:"contact_number"`
	PhotoURL      *string `json:"photo_url"`
	Created       string  `json:"created"`
	LoginLogID    int     `json:"login_log_id"` // Track the login session
}

// Logout logs a user out and records logout time
func (a *App) Logout(userID int) error {
	if a.db == nil {
		return fmt.Errorf("database not connected")
	}

	// Update the most recent login log for this user to set logout time
	// Use a subquery to ensure we get the most recent login log
	query := `UPDATE login_logs 
			  SET logout_time = NOW()
			  WHERE id = (
				  SELECT id FROM (
					  SELECT id FROM login_logs 
					  WHERE user_id = ? AND logout_time IS NULL 
					  ORDER BY login_time DESC 
					  LIMIT 1
				  ) AS subquery
			  )`
	result, err := a.db.Exec(query, userID)
	if err != nil {
		log.Printf("Failed to log logout for user %d: %v", userID, err)
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		log.Printf("Failed to get rows affected for logout: %v", err)
	} else if rowsAffected == 0 {
		log.Printf("No active login log found to update for user %d", userID)
		// Don't return error - might be already logged out
	} else {
		log.Printf("User logout successful: user_id=%d (rows affected: %d)", userID, rowsAffected)
	}

	return nil
}

// RecordTimeoutLogout records logout time for timed-out sessions
// This can be called automatically or manually to handle session timeouts
func (a *App) RecordTimeoutLogout(userID int) error {
	if a.db == nil {
		return fmt.Errorf("database not connected")
	}

	// Same logic as Logout - update the most recent login log
	return a.Logout(userID)
}

// Login authenticates a user
func (a *App) Login(username, password string) (*User, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	var user User
	query := `SELECT id, username, password, user_type, created_at FROM users WHERE username = ?`

	var createdAt time.Time
	err := a.db.QueryRow(query, username).Scan(&user.ID, &user.Name, &user.Password, &user.Role, &createdAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("invalid credentials")
		}
		return nil, err
	}

	// Simple password check (in production, use proper password hashing)
	if user.Password != password {
		return nil, fmt.Errorf("invalid credentials")
	}

	user.Created = createdAt.Format("2006-01-02 15:04:05")

	// Get additional user details based on role
	var detailQuery string
	switch user.Role {
	case "admin":
		detailQuery = `SELECT first_name, middle_name, last_name, gender, admin_id, email, profile_photo FROM admins WHERE user_id = ?`
	case "teacher":
		detailQuery = `SELECT first_name, middle_name, last_name, teacher_id, email, contact_number, profile_photo FROM teachers WHERE user_id = ?`
	case "student":
		detailQuery = `SELECT first_name, middle_name, last_name, student_id, email, contact_number, profile_photo FROM students WHERE user_id = ?`
	case "working_student":
		detailQuery = `SELECT first_name, middle_name, last_name, student_id, email, contact_number, profile_photo FROM working_students WHERE user_id = ?`
	}

	var firstName, middleName, lastName, gender sql.NullString
	var employeeID, studentID, photoURL sql.NullString
	var email, contactNumber sql.NullString

	switch user.Role {
	case "admin":
		err = a.db.QueryRow(detailQuery, user.ID).Scan(&firstName, &middleName, &lastName, &gender, &employeeID, &email, &photoURL)
		if err == nil {
			if firstName.Valid {
				user.FirstName = &firstName.String
			}
			if middleName.Valid {
				user.MiddleName = &middleName.String
			}
			if lastName.Valid {
				user.LastName = &lastName.String
			}
			if gender.Valid {
				user.Gender = &gender.String
			}
			if employeeID.Valid {
				user.EmployeeID = &employeeID.String
			}
			if email.Valid {
				user.Email = &email.String
			}
			if photoURL.Valid {
				user.PhotoURL = &photoURL.String
			}
		}
	case "teacher":
		err = a.db.QueryRow(detailQuery, user.ID).Scan(&firstName, &middleName, &lastName, &employeeID, &email, &contactNumber, &photoURL)
		if err == nil {
			if firstName.Valid {
				user.FirstName = &firstName.String
			}
			if middleName.Valid {
				user.MiddleName = &middleName.String
			}
			if lastName.Valid {
				user.LastName = &lastName.String
			}
			if employeeID.Valid {
				user.EmployeeID = &employeeID.String
			}
			if email.Valid {
				user.Email = &email.String
			}
			if contactNumber.Valid {
				user.ContactNumber = &contactNumber.String
			}
			if photoURL.Valid {
				user.PhotoURL = &photoURL.String
			}
		}
	case "student":
		err = a.db.QueryRow(detailQuery, user.ID).Scan(&firstName, &middleName, &lastName, &studentID, &email, &contactNumber, &photoURL)
		if err == nil {
			if firstName.Valid {
				user.FirstName = &firstName.String
			}
			if middleName.Valid {
				user.MiddleName = &middleName.String
			}
			if lastName.Valid {
				user.LastName = &lastName.String
			}
			if studentID.Valid {
				user.StudentID = &studentID.String
			}
			if email.Valid {
				user.Email = &email.String
			}
			if contactNumber.Valid {
				user.ContactNumber = &contactNumber.String
			}
			if photoURL.Valid {
				user.PhotoURL = &photoURL.String
			}
		}
	case "working_student":
		err = a.db.QueryRow(detailQuery, user.ID).Scan(&firstName, &middleName, &lastName, &studentID, &email, &contactNumber, &photoURL)
		if err == nil {
			if firstName.Valid {
				user.FirstName = &firstName.String
			}
			if middleName.Valid {
				user.MiddleName = &middleName.String
			}
			if lastName.Valid {
				user.LastName = &lastName.String
			}
			if studentID.Valid {
				user.StudentID = &studentID.String
			}
			if email.Valid {
				user.Email = &email.String
			}
			if contactNumber.Valid {
				user.ContactNumber = &contactNumber.String
			}
			if photoURL.Valid {
				user.PhotoURL = &photoURL.String
			}
		}
	}

	// Get the hostname (PC number) of this device
	hostname, err := os.Hostname()
	if err != nil {
		log.Printf("Failed to get hostname: %v", err)
		hostname = "Unknown"
	}

	// Create a login log entry
	insertLog := `INSERT INTO login_logs (user_id, user_type, pc_number, login_time, login_status) 
				  VALUES (?, ?, ?, NOW(), 'success')`
	result, err := a.db.Exec(insertLog, user.ID, user.Role, hostname)
	if err != nil {
		log.Printf("Failed to create login log: %v", err)
		// Don't fail the login if logging fails
	} else {
		// Get the log ID for this session
		logID, err := result.LastInsertId()
		if err == nil {
			user.LoginLogID = int(logID)
			log.Printf("Login logged with ID %d for PC: %s", logID, hostname)
		}
	}

	// Auto-record attendance for students if they log in during class time
	if user.Role == "student" || user.Role == "working_student" {
		go a.autoRecordAttendanceOnLogin(user.ID, hostname)
	}

	log.Printf("User login successful: %s (role: %s, pc: %s)", username, user.Role, hostname)
	return &user, nil
}

// autoRecordAttendanceOnLogin automatically records attendance when a student logs in
// if they are enrolled in classes with attendance initialized for today
func (a *App) autoRecordAttendanceOnLogin(studentID int, pcNumber string) {
	if a.db == nil {
		return
	}

	today := time.Now().Format("2006-01-02")
	currentTime := time.Now()

	// Get all enrolled classes for this student with attendance initialized for today
	query := `
		SELECT 
			cl.id as classlist_id,
			cl.class_id,
			c.schedule,
			a.id as attendance_id,
			c.school_year,
			c.semester
		FROM classlist cl
		JOIN classes c ON cl.class_id = c.id
		LEFT JOIN attendance a ON cl.id = a.classlist_id AND a.date = ?
		WHERE cl.student_id = ? 
			AND cl.status = 'active'
			AND c.is_active = TRUE
			AND a.id IS NOT NULL
	`

	rows, err := a.db.Query(query, today, studentID)
	if err != nil {
		log.Printf("Failed to query enrolled classes for auto-attendance: %v", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var classlistID, classID int
		var schedule sql.NullString
		var attendanceID sql.NullInt64
		var schoolYear, semester sql.NullString

		err := rows.Scan(&classlistID, &classID, &schedule, &attendanceID, &schoolYear, &semester)
		if err != nil {
			continue
		}

		// Check if current time matches class schedule
		if schedule.Valid && a.isWithinClassSchedule(schedule.String, currentTime) {
			// Update attendance to present with login time and PC number
			updateQuery := `
				UPDATE attendance 
				SET time_in = CURTIME(),
					pc_number = ?,
					status = 'present',
					updated_at = CURRENT_TIMESTAMP
				WHERE classlist_id = ? AND date = ?
			`
			_, err := a.db.Exec(updateQuery, pcNumber, classlistID, today)
			if err != nil {
				log.Printf("Failed to auto-record attendance for student %d, class %d: %v", studentID, classID, err)
			} else {
				log.Printf("Auto-recorded attendance: student=%d, class=%d, pc=%s", studentID, classID, pcNumber)
			}
		}
	}
}

// isWithinClassSchedule checks if the current time is within the class schedule time window
// Schedule format examples: "MWF 1:00-2:00 PM", "TTh 10:00-11:30 AM", "1:00-2:00 PM"
func (a *App) isWithinClassSchedule(schedule string, checkTime time.Time) bool {
	if schedule == "" {
		return false
	}

	// Check day of week if specified in schedule
	weekday := int(checkTime.Weekday()) // 0=Sunday, 1=Monday, ..., 6=Saturday
	scheduleUpper := strings.ToUpper(strings.TrimSpace(schedule))

	// Check if schedule contains day abbreviations
	hasDaySpec := false
	matchesDay := false

	// Check for common patterns first (longer patterns first to avoid partial matches)
	if strings.Contains(scheduleUpper, "MTWTF") || strings.Contains(scheduleUpper, "MON-TUE-WED-THU-FRI") {
		hasDaySpec = true
		if weekday >= 1 && weekday <= 5 {
			matchesDay = true
		}
	} else if strings.Contains(scheduleUpper, "TTH") || strings.Contains(scheduleUpper, "TTHU") || strings.Contains(scheduleUpper, "TU-TH") {
		hasDaySpec = true
		if weekday == 2 || weekday == 4 {
			matchesDay = true
		}
	} else if strings.Contains(scheduleUpper, "MWF") || strings.Contains(scheduleUpper, "MON-WED-FRI") {
		hasDaySpec = true
		if weekday == 1 || weekday == 3 || weekday == 5 {
			matchesDay = true
		}
	} else {
		// Check individual day abbreviations (check longer ones first)
		dayChecks := []struct {
			pattern string
			days    []int
		}{
			{"THU", []int{4}}, // Thursday
			{"TUE", []int{2}}, // Tuesday
			{"WED", []int{3}}, // Wednesday
			{"FRI", []int{5}}, // Friday
			{"MON", []int{1}}, // Monday
			{"SAT", []int{6}}, // Saturday
			{"SUN", []int{0}}, // Sunday
			{"TH", []int{4}},  // Thursday (abbrev)
			{"SU", []int{0}},  // Sunday (abbrev)
		}

		for _, check := range dayChecks {
			if strings.Contains(scheduleUpper, check.pattern) {
				hasDaySpec = true
				for _, d := range check.days {
					if weekday == d {
						matchesDay = true
						break
					}
				}
				if matchesDay {
					break
				}
			}
		}

		// Check single-letter day codes if no multi-letter match found
		if !hasDaySpec {
			if strings.Contains(scheduleUpper, " M ") || strings.HasPrefix(scheduleUpper, "M ") || scheduleUpper[0] == 'M' {
				hasDaySpec = true
				if weekday == 1 {
					matchesDay = true
				}
			} else if strings.Contains(scheduleUpper, " T ") || strings.HasPrefix(scheduleUpper, "T ") {
				hasDaySpec = true
				if weekday == 2 {
					matchesDay = true
				}
			} else if strings.Contains(scheduleUpper, " W ") || strings.HasPrefix(scheduleUpper, "W ") {
				hasDaySpec = true
				if weekday == 3 {
					matchesDay = true
				}
			} else if strings.Contains(scheduleUpper, " F ") || strings.HasPrefix(scheduleUpper, "F ") {
				hasDaySpec = true
				if weekday == 5 {
					matchesDay = true
				}
			}
		}
	}

	// If day is specified but doesn't match, return false
	if hasDaySpec && !matchesDay {
		return false
	}

	// Extract time range from schedule (e.g., "1:00-2:00 PM" or "10:00-11:30 AM")
	timePattern := regexp.MustCompile(`(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)`)
	matches := timePattern.FindStringSubmatch(schedule)
	if len(matches) != 6 {
		// Try simpler pattern without AM/PM
		timePattern2 := regexp.MustCompile(`(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})`)
		matches = timePattern2.FindStringSubmatch(schedule)
		if len(matches) != 5 {
			return false // Cannot parse schedule
		}
		// Parse 24-hour format
		startHour, _ := strconv.Atoi(matches[1])
		startMin, _ := strconv.Atoi(matches[2])
		endHour, _ := strconv.Atoi(matches[3])
		endMin, _ := strconv.Atoi(matches[4])

		currentHour := checkTime.Hour()
		currentMin := checkTime.Minute()

		currentMinutes := currentHour*60 + currentMin
		startMinutes := startHour*60 + startMin
		endMinutes := endHour*60 + endMin

		// Allow 30 minutes before and after class time
		return currentMinutes >= (startMinutes-30) && currentMinutes <= (endMinutes+30)
	}

	// Parse 12-hour format with AM/PM
	startHour, _ := strconv.Atoi(matches[1])
	startMin, _ := strconv.Atoi(matches[2])
	endHour, _ := strconv.Atoi(matches[3])
	endMin, _ := strconv.Atoi(matches[4])
	period := matches[5]

	// Convert to 24-hour format
	if period == "PM" && startHour != 12 {
		startHour += 12
	}
	if period == "PM" && endHour != 12 {
		endHour += 12
	}
	if period == "AM" && startHour == 12 {
		startHour = 0
	}
	if period == "AM" && endHour == 12 {
		endHour = 0
	}

	currentHour := checkTime.Hour()
	currentMin := checkTime.Minute()

	currentMinutes := currentHour*60 + currentMin
	startMinutes := startHour*60 + startMin
	endMinutes := endHour*60 + endMin

	// Allow 30 minutes before and after class time for flexibility
	return currentMinutes >= (startMinutes-30) && currentMinutes <= (endMinutes+30)
}

// GetUsers returns all users with complete details
func (a *App) GetUsers() ([]User, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	query := `
		SELECT 
			id, username, user_type, created_at,
			first_name, middle_name, last_name,
			employee_id, student_id_str,
			email, contact_number
		FROM v_users_complete
		ORDER BY created_at DESC
	`
	rows, err := a.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var user User
		var createdAt time.Time
		var firstName, middleName, lastName sql.NullString
		var employeeID, studentID sql.NullString
		var email, contactNumber sql.NullString

		err := rows.Scan(&user.ID, &user.Name, &user.Role, &createdAt,
			&firstName, &middleName, &lastName,
			&employeeID, &studentID,
			&email, &contactNumber)
		if err != nil {
			continue
		}

		user.Created = createdAt.Format("2006-01-02 15:04:05")

		if firstName.Valid {
			user.FirstName = &firstName.String
		}
		if middleName.Valid {
			user.MiddleName = &middleName.String
		}
		if lastName.Valid {
			user.LastName = &lastName.String
		}
		if employeeID.Valid {
			user.EmployeeID = &employeeID.String
		}
		if studentID.Valid {
			user.StudentID = &studentID.String
		}
		if email.Valid {
			user.Email = &email.String
		}
		if contactNumber.Valid {
			user.ContactNumber = &contactNumber.String
		}

		users = append(users, user)
	}

	return users, nil
}

// GetUsersByType returns users filtered by type with complete details
func (a *App) GetUsersByType(userType string) ([]User, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	query := `
		SELECT 
			id, username, user_type, created_at,
			first_name, middle_name, last_name,
			employee_id, student_id_str,
			email, contact_number
		FROM v_users_complete
		WHERE user_type = ?
		ORDER BY created_at DESC
	`
	rows, err := a.db.Query(query, userType)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var user User
		var createdAt time.Time
		var firstName, middleName, lastName sql.NullString
		var employeeID, studentID sql.NullString
		var email, contactNumber sql.NullString

		err := rows.Scan(&user.ID, &user.Name, &user.Role, &createdAt,
			&firstName, &middleName, &lastName,
			&employeeID, &studentID,
			&email, &contactNumber)
		if err != nil {
			continue
		}

		user.Created = createdAt.Format("2006-01-02 15:04:05")

		if firstName.Valid {
			user.FirstName = &firstName.String
		}
		if middleName.Valid {
			user.MiddleName = &middleName.String
		}
		if lastName.Valid {
			user.LastName = &lastName.String
		}
		if employeeID.Valid {
			user.EmployeeID = &employeeID.String
		}
		if studentID.Valid {
			user.StudentID = &studentID.String
		}
		if email.Valid {
			user.Email = &email.String
		}
		if contactNumber.Valid {
			user.ContactNumber = &contactNumber.String
		}

		users = append(users, user)
	}

	return users, nil
}

// SearchUsers searches users by name, ID, gender, or date with complete details
func (a *App) SearchUsers(searchTerm, userType string) ([]User, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	query := `
		SELECT 
			id, username, user_type, created_at,
			first_name, middle_name, last_name,
			employee_id, student_id_str,
			email, contact_number
		FROM v_users_complete
		WHERE (
			username LIKE ? OR
			first_name LIKE ? OR
			last_name LIKE ? OR
			middle_name LIKE ? OR
			employee_id LIKE ? OR
			student_id_str LIKE ? OR
			DATE_FORMAT(created_at, '%Y-%m-%d') LIKE ?
		)
	`
	searchPattern := "%" + searchTerm + "%"
	args := []interface{}{searchPattern, searchPattern, searchPattern, searchPattern,
		searchPattern, searchPattern, searchPattern}

	if userType != "" {
		query += ` AND user_type = ?`
		args = append(args, userType)
	}

	query += ` ORDER BY created_at DESC`

	rows, err := a.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var user User
		var createdAt time.Time
		var firstName, middleName, lastName sql.NullString
		var employeeID, studentID sql.NullString
		var email, contactNumber sql.NullString

		err := rows.Scan(&user.ID, &user.Name, &user.Role, &createdAt,
			&firstName, &middleName, &lastName,
			&employeeID, &studentID,
			&email, &contactNumber)
		if err != nil {
			continue
		}

		user.Created = createdAt.Format("2006-01-02 15:04:05")

		if firstName.Valid {
			user.FirstName = &firstName.String
		}
		if middleName.Valid {
			user.MiddleName = &middleName.String
		}
		if lastName.Valid {
			user.LastName = &lastName.String
		}
		if employeeID.Valid {
			user.EmployeeID = &employeeID.String
		}
		if studentID.Valid {
			user.StudentID = &studentID.String
		}
		if email.Valid {
			user.Email = &email.String
		}
		if contactNumber.Valid {
			user.ContactNumber = &contactNumber.String
		}

		users = append(users, user)
	}

	return users, nil
}

// CreateUser creates a new user
func (a *App) CreateUser(password, name, firstName, middleName, lastName, gender, role, employeeID, studentID, year, section, email, contactNumber string, departmentID int) error {
	if a.db == nil {
		return fmt.Errorf("database not connected")
	}

	// Log the incoming data for debugging
	log.Printf("CreateUser called - Role: %s, StudentID: %s, Year: %s, Section: %s, Gender: %s, Email: %s", role, studentID, year, section, gender, email)

	// Determine username based on role
	username := employeeID
	if role == "student" || role == "working_student" {
		username = studentID
		if username == "" {
			return fmt.Errorf("student ID is required for %s role", role)
		}
	}

	// Validate required fields for working_student
	if role == "working_student" {
		if studentID == "" {
			return fmt.Errorf("student ID is required for working student")
		}
		if firstName == "" || lastName == "" {
			return fmt.Errorf("first name and last name are required")
		}
	}

	// Insert into users table
	query := `INSERT INTO users (username, password, user_type) VALUES (?, ?, ?)`
	result, err := a.db.Exec(query, username, password, role)
	if err != nil {
		log.Printf("Failed to insert into users table: %v", err)
		return fmt.Errorf("failed to create user account: %w", err)
	}

	userID, _ := result.LastInsertId()
	log.Printf("Created user account with ID: %d", userID)

	// Insert into respective table based on role
	switch role {
	case "admin":
		query = `INSERT INTO admins (user_id, admin_id, first_name, middle_name, last_name, gender, email) VALUES (?, ?, ?, ?, ?, ?, ?)`
		_, err = a.db.Exec(query, userID, nullString(employeeID), firstName, nullString(middleName), lastName, nullString(gender), nullString(email))
	case "teacher":
		query = `INSERT INTO teachers (user_id, teacher_id, first_name, middle_name, last_name, email, contact_number, department_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
		_, err = a.db.Exec(query, userID, nullString(employeeID), firstName, nullString(middleName), lastName, nullString(email), nullString(contactNumber), nullInt(departmentID))
	case "student":
		query = `INSERT INTO students (user_id, student_id, first_name, middle_name, last_name, email, contact_number) VALUES (?, ?, ?, ?, ?, ?, ?)`
		_, err = a.db.Exec(query, userID, nullString(studentID), firstName, nullString(middleName), lastName, nullString(email), nullString(contactNumber))
	case "working_student":
		query = `INSERT INTO working_students (user_id, student_id, first_name, middle_name, last_name, email, contact_number) VALUES (?, ?, ?, ?, ?, ?, ?)`
		log.Printf("📝 Inserting working student - user_id: %d, student_id: %s, name: %s %s, email: %s",
			userID, studentID, firstName, lastName, email)
		_, err = a.db.Exec(query, userID, nullString(studentID), firstName, nullString(middleName), lastName, nullString(email), nullString(contactNumber))
	}

	if err != nil {
		log.Printf("Failed to insert into %s table: %v", role, err)
		return fmt.Errorf("failed to create %s profile: %w", role, err)
	}

	log.Printf("Successfully created %s: %s %s (ID: %d)", role, firstName, lastName, userID)
	return nil
}

// BulkStudentData represents a single student entry for bulk registration
type BulkStudentData struct {
	StudentCode   string `json:"student_code"`
	FirstName     string `json:"first_name"`
	MiddleName    string `json:"middle_name"`
	LastName      string `json:"last_name"`
	Gender        string `json:"gender"`
	ContactNumber string `json:"contact_number"`
}

// extractStudentDataFromText extracts student information from text content
// Looks for patterns like: Student Code, Name (First, Middle, Last), Gender, Contact
func extractStudentDataFromText(text string) [][]string {
	var records [][]string

	// Split text into lines
	lines := strings.Split(text, "\n")

	// Pattern to match student data - looking for student codes and names
	// Common patterns:
	// - Student Code: alphanumeric codes
	// - Names: typically in format "Last, First Middle" or "First Middle Last"
	studentCodePattern := regexp.MustCompile(`(?i)(?:student\s*(?:code|id|number)[:\s]*)?([A-Z0-9\-]{3,})`)
	namePattern := regexp.MustCompile(`([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)`)

	var currentRecord []string
	var foundCode bool

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		// Try to find student code
		codeMatches := studentCodePattern.FindStringSubmatch(line)
		if len(codeMatches) > 1 && !foundCode {
			if len(currentRecord) > 0 {
				// Save previous record if it has data
				if len(currentRecord) >= 2 {
					records = append(records, currentRecord)
				}
			}
			currentRecord = []string{codeMatches[1]}
			foundCode = true
			continue
		}

		// Try to find names
		if foundCode {
			nameMatches := namePattern.FindAllString(line, -1)
			if len(nameMatches) >= 2 {
				// Assume first is first name, last is last name
				currentRecord = append(currentRecord, nameMatches[0])
				if len(nameMatches) >= 3 {
					currentRecord = append(currentRecord, nameMatches[len(nameMatches)-1]) // Last name
					currentRecord = append(currentRecord, nameMatches[1])                  // Middle name if exists
				} else {
					currentRecord = append(currentRecord, nameMatches[len(nameMatches)-1]) // Last name
					currentRecord = append(currentRecord, "")                              // No middle name
				}
				foundCode = false
				if len(currentRecord) >= 3 {
					records = append(records, currentRecord)
					currentRecord = []string{}
				}
			}
		}
	}

	// Add last record if exists
	if len(currentRecord) >= 3 {
		records = append(records, currentRecord)
	}

	// If no structured data found, try CSV-like parsing
	if len(records) == 0 {
		reader := csv.NewReader(strings.NewReader(text))
		csvRecords, err := reader.ReadAll()
		if err == nil && len(csvRecords) > 0 {
			return csvRecords
		}

		// Try tab-separated
		for _, line := range lines {
			if strings.Contains(line, "\t") {
				fields := strings.Split(line, "\t")
				if len(fields) >= 3 {
					records = append(records, fields)
				}
			} else if strings.Contains(line, ",") {
				// Simple comma-separated (not proper CSV)
				fields := strings.Split(line, ",")
				cleanedFields := make([]string, len(fields))
				for i, f := range fields {
					cleanedFields[i] = strings.TrimSpace(f)
				}
				if len(cleanedFields) >= 3 {
					records = append(records, cleanedFields)
				}
			}
		}
	}

	return records
}

// parsePDF extracts text from PDF file
// Note: PDF parsing is currently disabled due to DLL dependency requirements
// Users should convert PDF files to CSV or TXT format for bulk upload
func parsePDF(fileData []byte) (string, error) {
	_ = fileData // Parameter intentionally unused - PDF parsing is disabled
	// PDF parsing requires libmupdf.dll which may not be available
	// For now, return an error suggesting CSV/TXT conversion
	return "", fmt.Errorf("PDF parsing is not available. Please convert your PDF to CSV or TXT format, or use DOCX format")
}

// parseDOCX extracts text from DOCX file
// DOCX files are ZIP archives containing XML files
func parseDOCX(fileData []byte) (string, error) {
	// For now, we'll extract text by parsing the document.xml from the ZIP
	// This is a simplified approach - for production, consider using a more robust library
	// like github.com/unidoc/unioffice or github.com/nguyenthenguyen/docx

	// Try to use the docx library to get runs
	tmpFile, err := os.CreateTemp("", "docx_*.docx")
	if err != nil {
		return "", fmt.Errorf("failed to create temp file: %w", err)
	}
	defer os.Remove(tmpFile.Name())

	// Write file data
	if _, err := tmpFile.Write(fileData); err != nil {
		tmpFile.Close()
		return "", fmt.Errorf("failed to write temp file: %w", err)
	}
	tmpFile.Close()

	// Read DOCX using the library
	doc, err := docx.Open(tmpFile.Name())
	if err != nil {
		return "", fmt.Errorf("failed to open DOCX: %w", err)
	}
	defer doc.Close()

	// Extract text from document runs
	var text strings.Builder

	// Get document.xml content
	docXML := doc.GetFile("word/document.xml")
	if len(docXML) == 0 {
		return "", fmt.Errorf("could not read document.xml from DOCX file")
	}

	// Use RunParser to extract text from the XML
	runParser := docx.NewRunParser(docXML)
	if err := runParser.Execute(); err != nil {
		return "", fmt.Errorf("failed to parse DOCX runs: %w", err)
	}

	runs := runParser.Runs()
	for _, run := range runs {
		if run != nil && run.HasText {
			runText := run.GetText(docXML)
			if runText != "" {
				text.WriteString(runText)
				text.WriteString(" ")
			}
		}
	}

	result := text.String()
	if result == "" {
		return "", fmt.Errorf("could not extract text from DOCX. Please ensure the document contains text, or convert to CSV or PDF format")
	}

	return result, nil
}

// CreateUsersBulkFromFile creates multiple students from uploaded file (PDF, DOCX, CSV, TXT)
// fileData: base64 encoded file content
// fileName: original file name to detect file type
func (a *App) CreateUsersBulkFromFile(fileDataBase64 string, fileName string) (map[string]interface{}, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	// Decode base64 file data
	fileData, err := base64.StdEncoding.DecodeString(fileDataBase64)
	if err != nil {
		return nil, fmt.Errorf("failed to decode file data: %w", err)
	}

	if len(fileData) == 0 {
		return nil, fmt.Errorf("file is empty")
	}

	// Detect file type from extension
	ext := strings.ToLower(filepath.Ext(fileName))
	var textContent string

	switch ext {
	case ".pdf":
		textContent, err = parsePDF(fileData)
		if err != nil {
			return nil, fmt.Errorf("failed to parse PDF: %w", err)
		}
	case ".docx", ".doc":
		textContent, err = parseDOCX(fileData)
		if err != nil {
			return nil, fmt.Errorf("failed to parse DOCX: %w", err)
		}
	case ".csv", ".txt":
		textContent = string(fileData)
	default:
		// Try to parse as text/CSV
		textContent = string(fileData)
	}

	// Extract student data from text
	records := extractStudentDataFromText(textContent)

	if len(records) == 0 {
		return nil, fmt.Errorf("no student data found in file. Please ensure the file contains student codes and names")
	}

	// Detect header row and create column mapping
	startIndex := 0
	columnMap := make(map[string]int) // Maps field names to column indices

	if len(records) > 0 {
		firstRow := records[0]
		firstRowLower := strings.ToLower(strings.Join(firstRow, " "))

		// Check if first row looks like headers
		isHeader := strings.Contains(firstRowLower, "student") ||
			strings.Contains(firstRowLower, "code") ||
			strings.Contains(firstRowLower, "id") ||
			strings.Contains(firstRowLower, "name") ||
			strings.Contains(firstRowLower, "email") ||
			strings.Contains(firstRowLower, "contact") ||
			strings.Contains(firstRowLower, "phone")

		if isHeader {
			startIndex = 1
			// Map columns based on header names
			for colIdx, header := range firstRow {
				headerLower := strings.ToLower(strings.TrimSpace(header))

				// Student Code/ID detection
				if _, exists := columnMap["student_code"]; !exists && (strings.Contains(headerLower, "student") && (strings.Contains(headerLower, "code") || strings.Contains(headerLower, "id")) ||
					strings.Contains(headerLower, "student_id") ||
					strings.Contains(headerLower, "student code") ||
					(strings.Contains(headerLower, "id") && !strings.Contains(headerLower, "email") && !strings.Contains(headerLower, "contact"))) {
					columnMap["student_code"] = colIdx
				}

				// First Name detection
				if _, exists := columnMap["first_name"]; !exists && (strings.Contains(headerLower, "first") && strings.Contains(headerLower, "name") ||
					strings.Contains(headerLower, "firstname") ||
					strings.Contains(headerLower, "fname") ||
					headerLower == "first") {
					columnMap["first_name"] = colIdx
				}

				// Last Name detection
				if _, exists := columnMap["last_name"]; !exists && (strings.Contains(headerLower, "last") && strings.Contains(headerLower, "name") ||
					strings.Contains(headerLower, "lastname") ||
					strings.Contains(headerLower, "lname") ||
					headerLower == "last" ||
					strings.Contains(headerLower, "surname")) {
					columnMap["last_name"] = colIdx
				}

				// Middle Name detection
				if _, exists := columnMap["middle_name"]; !exists && (strings.Contains(headerLower, "middle") && strings.Contains(headerLower, "name") ||
					strings.Contains(headerLower, "middlename") ||
					strings.Contains(headerLower, "mname") ||
					headerLower == "middle" ||
					strings.Contains(headerLower, "mi")) {
					columnMap["middle_name"] = colIdx
				}

				// Email detection
				if _, exists := columnMap["email"]; !exists && (strings.Contains(headerLower, "email") ||
					strings.Contains(headerLower, "e-mail") ||
					strings.Contains(headerLower, "mail")) {
					columnMap["email"] = colIdx
				}

				// Contact Number detection
				if _, exists := columnMap["contact"]; !exists && (strings.Contains(headerLower, "contact") ||
					strings.Contains(headerLower, "phone") ||
					strings.Contains(headerLower, "mobile") ||
					strings.Contains(headerLower, "cell") ||
					(strings.Contains(headerLower, "number") && !strings.Contains(headerLower, "student") && !strings.Contains(headerLower, "id"))) {
					columnMap["contact"] = colIdx
				}

			}
		}
	}

	// If no header mapping found, use default positions (backward compatibility)
	if len(columnMap) == 0 {
		columnMap["student_code"] = 0
		columnMap["first_name"] = 1
		columnMap["last_name"] = 2
		if len(records) > 0 && len(records[0]) > 3 {
			columnMap["middle_name"] = 3
		}
		if len(records) > 0 && len(records[0]) > 4 {
			columnMap["contact"] = 4
		}
	}

	var successCount int
	var errorCount int
	var errors []string

	// Helper function to get column value safely
	getColumnValue := func(record []string, colIdx int, found bool) string {
		if found && colIdx >= 0 && colIdx < len(record) {
			return strings.TrimSpace(record[colIdx])
		}
		return ""
	}

	// Process each record
	for i, record := range records[startIndex:] {
		rowNum := i + startIndex + 1

		// Ensure we have at least 3 fields
		for len(record) < 3 {
			record = append(record, "")
		}

		// Extract values using column mapping
		studentCodeIdx, hasStudentCode := columnMap["student_code"]
		firstNameIdx, hasFirstName := columnMap["first_name"]
		lastNameIdx, hasLastName := columnMap["last_name"]
		middleNameIdx, hasMiddleName := columnMap["middle_name"]
		contactIdx, hasContact := columnMap["contact"]
		emailIdx, hasEmail := columnMap["email"]

		studentCode := getColumnValue(record, studentCodeIdx, hasStudentCode)
		firstName := getColumnValue(record, firstNameIdx, hasFirstName)
		lastName := getColumnValue(record, lastNameIdx, hasLastName)
		middleName := getColumnValue(record, middleNameIdx, hasMiddleName)
		contactNumber := getColumnValue(record, contactIdx, hasContact)
		email := getColumnValue(record, emailIdx, hasEmail)

		// Validate required fields
		if studentCode == "" {
			errorCount++
			errors = append(errors, fmt.Sprintf("Row %d: Student Code is required", rowNum))
			continue
		}
		if firstName == "" {
			errorCount++
			errors = append(errors, fmt.Sprintf("Row %d: First Name is required", rowNum))
			continue
		}
		if lastName == "" {
			errorCount++
			errors = append(errors, fmt.Sprintf("Row %d: Last Name is required", rowNum))
			continue
		}

		// Create the student using existing CreateUser function
		fullName := fmt.Sprintf("%s, %s", lastName, firstName)
		if middleName != "" {
			fullName = fmt.Sprintf("%s, %s %s", lastName, firstName, middleName)
		}

		// Use student code as password (default password)
		err := a.CreateUser(
			studentCode, // password
			fullName,    // name
			firstName,
			middleName,
			lastName,
			"", // gender (removed)
			"student",
			"",          // employeeID
			studentCode, // studentID
			"",          // year level
			"",          // section
			email,       // email (now detected from headers)
			contactNumber,
			0, // departmentID
		)

		if err != nil {
			errorCount++
			errors = append(errors, fmt.Sprintf("Row %d (%s): %v", rowNum, studentCode, err))
			log.Printf("❌ Failed to create student at row %d: %v", rowNum, err)
		} else {
			successCount++
			log.Printf("✅ Created student: %s %s (Code: %s)", firstName, lastName, studentCode)
		}
	}

	result := map[string]interface{}{
		"success_count": successCount,
		"error_count":   errorCount,
		"total_count":   len(records) - startIndex,
		"errors":        errors,
	}

	return result, nil
}

// CreateUsersBulk creates multiple students from CSV data (kept for backward compatibility)
// CSV format: Student Code, First Name, Middle Name (optional), Last Name, Contact Number (optional)
func (a *App) CreateUsersBulk(csvData string) (map[string]interface{}, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	// Parse CSV data
	reader := csv.NewReader(strings.NewReader(csvData))
	records, err := reader.ReadAll()
	if err != nil {
		return nil, fmt.Errorf("failed to parse CSV: %w", err)
	}

	if len(records) == 0 {
		return nil, fmt.Errorf("CSV file is empty")
	}

	// Skip header row if present
	startIndex := 0
	if len(records) > 0 {
		// Check if first row looks like a header (contains "student" or "code" etc.)
		firstRow := strings.ToLower(strings.Join(records[0], " "))
		if strings.Contains(firstRow, "student") || strings.Contains(firstRow, "code") ||
			strings.Contains(firstRow, "name") {
			startIndex = 1
		}
	}

	var successCount int
	var errorCount int
	var errors []string

	// Process each record
	for i, record := range records[startIndex:] {
		rowNum := i + startIndex + 1

		// Validate minimum required fields (at least Student Code, First Name, Last Name)
		if len(record) < 3 {
			errorCount++
			errors = append(errors, fmt.Sprintf("Row %d: Insufficient columns (need at least Student Code, First Name, Last Name)", rowNum))
			continue
		}

		studentCode := strings.TrimSpace(record[0])
		firstName := strings.TrimSpace(record[1])
		middleName := ""
		lastName := ""
		contactNumber := ""
		email := "" // Email not supported in legacy CreateUsersBulk function

		// Parse based on number of columns
		if len(record) >= 3 {
			lastName = strings.TrimSpace(record[2])
		}
		if len(record) >= 4 {
			middleName = strings.TrimSpace(record[3])
		}
		if len(record) >= 5 {
			contactNumber = strings.TrimSpace(record[4])
		}

		// Validate required fields
		if studentCode == "" {
			errorCount++
			errors = append(errors, fmt.Sprintf("Row %d: Student Code is required", rowNum))
			continue
		}
		if firstName == "" {
			errorCount++
			errors = append(errors, fmt.Sprintf("Row %d: First Name is required", rowNum))
			continue
		}
		if lastName == "" {
			errorCount++
			errors = append(errors, fmt.Sprintf("Row %d: Last Name is required", rowNum))
			continue
		}

		// Create the student using existing CreateUser function
		fullName := fmt.Sprintf("%s, %s", lastName, firstName)
		if middleName != "" {
			fullName = fmt.Sprintf("%s, %s %s", lastName, firstName, middleName)
		}

		// Use student code as password (default password)
		err := a.CreateUser(
			studentCode, // password
			fullName,    // name
			firstName,
			middleName,
			lastName,
			"", // gender (removed)
			"student",
			"",          // employeeID
			studentCode, // studentID
			"",          // year level
			"",          // section
			email,       // email
			contactNumber,
			0, // departmentID
		)

		if err != nil {
			errorCount++
			errors = append(errors, fmt.Sprintf("Row %d (%s): %v", rowNum, studentCode, err))
			log.Printf("❌ Failed to create student at row %d: %v", rowNum, err)
		} else {
			successCount++
			log.Printf("✅ Created student: %s %s (Code: %s)", firstName, lastName, studentCode)
		}
	}

	result := map[string]interface{}{
		"success_count": successCount,
		"error_count":   errorCount,
		"total_count":   len(records) - startIndex,
		"errors":        errors,
	}

	return result, nil
}

// UpdateUser updates an existing user
func (a *App) UpdateUser(id int, name, firstName, middleName, lastName, gender, role, employeeID, studentID, year, section, email, contactNumber string, departmentID int) error {
	if a.db == nil {
		return fmt.Errorf("database not connected")
	}

	// Update in respective table based on role
	var query string
	var err error
	switch role {
	case "admin":
		query = `UPDATE admins SET first_name = ?, middle_name = ?, last_name = ?, gender = ?, admin_id = ?, email = ? WHERE user_id = ?`
		_, err = a.db.Exec(query, firstName, nullString(middleName), lastName, nullString(gender), nullString(employeeID), nullString(email), id)
	case "teacher":
		query = `UPDATE teachers SET first_name = ?, middle_name = ?, last_name = ?, teacher_id = ?, email = ?, contact_number = ?, department_id = ? WHERE user_id = ?`
		_, err = a.db.Exec(query, firstName, nullString(middleName), lastName, nullString(employeeID), nullString(email), nullString(contactNumber), nullInt(departmentID), id)
	case "student":
		query = `UPDATE students SET first_name = ?, middle_name = ?, last_name = ?, student_id = ?, email = ?, contact_number = ? WHERE user_id = ?`
		_, err = a.db.Exec(query, firstName, nullString(middleName), lastName, nullString(studentID), nullString(email), nullString(contactNumber), id)
	case "working_student":
		query = `UPDATE working_students SET first_name = ?, middle_name = ?, last_name = ?, student_id = ?, email = ?, contact_number = ? WHERE user_id = ?`
		_, err = a.db.Exec(query, firstName, nullString(middleName), lastName, nullString(studentID), nullString(email), nullString(contactNumber), id)
	}

	return err
}

// DeleteUser deletes a user
func (a *App) DeleteUser(id int) error {
	if a.db == nil {
		return fmt.Errorf("database not connected")
	}

	query := `DELETE FROM users WHERE id = ?`
	_, err := a.db.Exec(query, id)
	return err
}

// ==============================================================================
// ADMIN DASHBOARD
// ==============================================================================

// AdminDashboard represents admin dashboard data
type AdminDashboard struct {
	TotalStudents   int `json:"total_students"`
	TotalTeachers   int `json:"total_teachers"`
	WorkingStudents int `json:"working_students"`
	RecentLogins    int `json:"recent_logins"`
}

// GetAdminDashboard returns admin dashboard statistics
func (a *App) GetAdminDashboard() (AdminDashboard, error) {
	var dashboard AdminDashboard

	if a.db == nil {
		return dashboard, fmt.Errorf("database not connected")
	}

	// Count total students
	err := a.db.QueryRow(`SELECT COUNT(*) FROM students`).Scan(&dashboard.TotalStudents)
	if err != nil {
		log.Printf("⚠ Failed to count students: %v", err)
	}

	// Count total teachers
	err = a.db.QueryRow(`SELECT COUNT(*) FROM teachers`).Scan(&dashboard.TotalTeachers)
	if err != nil {
		log.Printf("⚠ Failed to count teachers: %v", err)
	}

	// Count working students
	err = a.db.QueryRow(`SELECT COUNT(*) FROM working_students`).Scan(&dashboard.WorkingStudents)
	if err != nil {
		log.Printf("⚠ Failed to count working students: %v", err)
	}

	// Count recent logins (last 24 hours)
	err = a.db.QueryRow(`
		SELECT COUNT(*) 
		FROM login_logs 
		WHERE login_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
	`).Scan(&dashboard.RecentLogins)
	if err != nil {
		log.Printf("⚠ Failed to count recent logins: %v", err)
	}

	return dashboard, nil
}

// ==============================================================================
// DEPARTMENT MANAGEMENT
// ==============================================================================

// Department represents a department
type Department struct {
	ID             int     `json:"id"`
	DepartmentCode string  `json:"department_code"`
	DepartmentName string  `json:"department_name"`
	Description    *string `json:"description,omitempty"`
	IsActive       bool    `json:"is_active"`
	CreatedAt      string  `json:"created_at"`
	UpdatedAt      string  `json:"updated_at"`
}

// GetDepartments returns all departments
func (a *App) GetDepartments() ([]Department, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	query := `
		SELECT id, department_code, department_name, description, is_active, created_at, updated_at
		FROM departments
		ORDER BY department_code
	`
	rows, err := a.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var departments []Department
	for rows.Next() {
		var dept Department
		var description sql.NullString
		var createdAt, updatedAt time.Time

		err := rows.Scan(&dept.ID, &dept.DepartmentCode, &dept.DepartmentName, &description, &dept.IsActive, &createdAt, &updatedAt)
		if err != nil {
			continue
		}

		if description.Valid {
			dept.Description = &description.String
		}
		dept.CreatedAt = createdAt.Format("2006-01-02 15:04:05")
		dept.UpdatedAt = updatedAt.Format("2006-01-02 15:04:05")

		departments = append(departments, dept)
	}

	return departments, nil
}

// CreateDepartment creates a new department
func (a *App) CreateDepartment(departmentCode, departmentName, description string) error {
	if a.db == nil {
		return fmt.Errorf("database not connected")
	}

	if departmentCode == "" || departmentName == "" {
		return fmt.Errorf("department code and name are required")
	}

	query := `INSERT INTO departments (department_code, department_name, description) VALUES (?, ?, ?)`
	_, err := a.db.Exec(query, departmentCode, departmentName, nullString(description))
	if err != nil {
		log.Printf("⚠ Failed to create department: %v", err)
		return err
	}

	log.Printf("✓ Department created: %s - %s", departmentCode, departmentName)
	return nil
}

// UpdateDepartment updates an existing department
func (a *App) UpdateDepartment(id int, departmentCode, departmentName, description string, isActive bool) error {
	if a.db == nil {
		return fmt.Errorf("database not connected")
	}

	if departmentCode == "" || departmentName == "" {
		return fmt.Errorf("department code and name are required")
	}

	query := `UPDATE departments SET department_code = ?, department_name = ?, description = ?, is_active = ? WHERE id = ?`
	_, err := a.db.Exec(query, departmentCode, departmentName, nullString(description), isActive, id)
	if err != nil {
		log.Printf("⚠ Failed to update department: %v", err)
		return err
	}

	log.Printf("✓ Department updated: ID=%d", id)
	return nil
}

// DeleteDepartment deletes a department
func (a *App) DeleteDepartment(id int) error {
	if a.db == nil {
		return fmt.Errorf("database not connected")
	}

	query := `DELETE FROM departments WHERE id = ?`
	_, err := a.db.Exec(query, id)
	if err != nil {
		log.Printf("⚠ Failed to delete department: %v", err)
		return err
	}

	log.Printf("✓ Department deleted: ID=%d", id)
	return nil
}

// ==============================================================================
// LOGIN LOGS
// ==============================================================================

// LoginLog represents a login log entry
type LoginLog struct {
	ID         int     `json:"id"`
	UserID     int     `json:"user_id"`
	UserName   string  `json:"user_name"`
	UserType   string  `json:"user_type"`
	PCNumber   *string `json:"pc_number"`
	LoginTime  string  `json:"login_time"`
	LogoutTime *string `json:"logout_time"`
}

// GetAllLogs returns all login logs with user details
func (a *App) GetAllLogs() ([]LoginLog, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	query := `
		SELECT 
			id, user_id, user_type, pc_number, 
			login_time, logout_time, full_name
		FROM v_login_logs_complete 
		ORDER BY login_time DESC 
		LIMIT 1000
	`
	rows, err := a.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []LoginLog
	for rows.Next() {
		var log LoginLog
		var pcNumber sql.NullString
		var loginTime time.Time
		var logoutTime sql.NullTime

		err := rows.Scan(&log.ID, &log.UserID, &log.UserType, &pcNumber, &loginTime, &logoutTime, &log.UserName)
		if err != nil {
			continue
		}

		log.LoginTime = loginTime.Format("2006-01-02 15:04:05")
		if pcNumber.Valid {
			log.PCNumber = &pcNumber.String
		}
		if logoutTime.Valid {
			formattedLogoutTime := logoutTime.Time.Format("2006-01-02 15:04:05")
			log.LogoutTime = &formattedLogoutTime
		}

		logs = append(logs, log)
	}

	return logs, nil
}

// GetStudentLoginLogs returns login logs for a specific student
func (a *App) GetStudentLoginLogs(userID int) ([]LoginLog, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	log.Printf("GetStudentLoginLogs called for userID: %d", userID)

	// Query the login_logs table directly and join with users to get the name
	query := `
		SELECT 
			ll.id, 
			ll.user_id, 
			COALESCE(u.user_type, 'unknown') as user_type, 
			ll.pc_number, 
			ll.login_time, 
			ll.logout_time,
			COALESCE(
				CONCAT(ws.last_name, ', ', ws.first_name, 
					CASE WHEN ws.middle_name IS NOT NULL THEN CONCAT(' ', ws.middle_name) ELSE '' END),
				CONCAT(s.last_name, ', ', s.first_name,
					CASE WHEN s.middle_name IS NOT NULL THEN CONCAT(' ', s.middle_name) ELSE '' END),
				CONCAT(t.last_name, ', ', t.first_name,
					CASE WHEN t.middle_name IS NOT NULL THEN CONCAT(' ', t.middle_name) ELSE '' END),
				CONCAT(a.last_name, ', ', a.first_name,
					CASE WHEN a.middle_name IS NOT NULL THEN CONCAT(' ', a.middle_name) ELSE '' END),
				u.username
			) as full_name
		FROM login_logs ll
		JOIN users u ON ll.user_id = u.id
		LEFT JOIN students s ON u.id = s.user_id
		LEFT JOIN working_students ws ON u.id = ws.user_id
		LEFT JOIN teachers t ON u.id = t.user_id
		LEFT JOIN admins a ON u.id = a.user_id
		WHERE ll.user_id = ?
		ORDER BY ll.login_time DESC 
		LIMIT 100
	`
	rows, err := a.db.Query(query, userID)
	if err != nil {
		log.Printf("Error querying login logs: %v", err)
		return nil, fmt.Errorf("failed to query login logs: %w", err)
	}
	defer rows.Close()

	var logs []LoginLog
	for rows.Next() {
		var logEntry LoginLog
		var pcNumber sql.NullString
		var loginTime time.Time
		var logoutTime sql.NullTime

		err := rows.Scan(&logEntry.ID, &logEntry.UserID, &logEntry.UserType, &pcNumber, &loginTime, &logoutTime, &logEntry.UserName)
		if err != nil {
			log.Printf("Error scanning login log row: %v", err)
			continue
		}

		logEntry.LoginTime = loginTime.Format("2006-01-02 15:04:05")
		if pcNumber.Valid {
			logEntry.PCNumber = &pcNumber.String
		}
		if logoutTime.Valid {
			formattedLogoutTime := logoutTime.Time.Format("2006-01-02 15:04:05")
			logEntry.LogoutTime = &formattedLogoutTime
		}

		logs = append(logs, logEntry)
	}

	log.Printf("GetStudentLoginLogs returning %d logs for userID: %d", len(logs), userID)
	return logs, nil
}

// ==============================================================================
// FEEDBACK
// ==============================================================================

// Feedback represents equipment feedback
type Feedback struct {
	ID                  int     `json:"id"`
	StudentID           int     `json:"student_id"`
	StudentIDStr        string  `json:"student_id_str"`
	FirstName           string  `json:"first_name"`
	MiddleName          *string `json:"middle_name"`
	LastName            string  `json:"last_name"`
	StudentName         string  `json:"student_name"`
	PCNumber            string  `json:"pc_number"`
	EquipmentCondition  string  `json:"equipment_condition"`
	MonitorCondition    string  `json:"monitor_condition"`
	KeyboardCondition   string  `json:"keyboard_condition"`
	MouseCondition      string  `json:"mouse_condition"`
	Comments            *string `json:"comments"`
	DateSubmitted       string  `json:"date_submitted"`
	Status              string  `json:"status"` // 'pending', 'forwarded', 'resolved'
	ForwardedBy         *int    `json:"forwarded_by"`
	ForwardedByName     *string `json:"forwarded_by_name"`
	ForwardedAt         *string `json:"forwarded_at"`
	WorkingStudentNotes *string `json:"working_student_notes"`
}

// GetFeedback returns all forwarded feedback (for admins)
func (a *App) GetFeedback() ([]Feedback, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	query := `
		SELECT 
			f.id, 
			f.student_id, 
			COALESCE(s.student_id, ws.student_id, 'N/A') as student_id_str,
			COALESCE(s.first_name, ws.first_name, '') as first_name, 
			COALESCE(s.middle_name, ws.middle_name) as middle_name, 
			COALESCE(s.last_name, ws.last_name, '') as last_name, 
			f.pc_number, 
			f.equipment_condition, 
			f.monitor_condition, 
			f.keyboard_condition, 
			f.mouse_condition, 
			f.comments, 
			f.date_submitted,
			f.status,
			f.forwarded_by,
			f.forwarded_at,
			f.working_student_notes,
			CONCAT(
				COALESCE(ws_fwd.last_name, ''), 
				CASE WHEN ws_fwd.last_name IS NOT NULL THEN ', ' ELSE '' END,
				COALESCE(ws_fwd.first_name, ''),
				CASE WHEN ws_fwd.middle_name IS NOT NULL THEN CONCAT(' ', ws_fwd.middle_name) ELSE '' END
			) as forwarded_by_name
		FROM feedback f
		LEFT JOIN students s ON f.student_id = s.user_id
		LEFT JOIN working_students ws ON f.student_id = ws.user_id
		LEFT JOIN users u_fwd ON f.forwarded_by = u_fwd.id
		LEFT JOIN working_students ws_fwd ON u_fwd.id = ws_fwd.user_id
		WHERE f.status = 'forwarded'
		ORDER BY f.date_submitted DESC 
		LIMIT 1000`
	rows, err := a.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var feedbacks []Feedback
	for rows.Next() {
		var fb Feedback
		var middleName, comments, studentIDStr, forwardedByName, workingStudentNotes sql.NullString
		var dateSubmitted time.Time
		var forwardedBy sql.NullInt64
		var forwardedAt sql.NullTime

		err := rows.Scan(&fb.ID, &fb.StudentID, &studentIDStr, &fb.FirstName, &middleName, &fb.LastName,
			&fb.PCNumber, &fb.EquipmentCondition, &fb.MonitorCondition,
			&fb.KeyboardCondition, &fb.MouseCondition, &comments, &dateSubmitted, &fb.Status,
			&forwardedBy, &forwardedAt, &workingStudentNotes, &forwardedByName)
		if err != nil {
			continue
		}

		if studentIDStr.Valid {
			fb.StudentIDStr = studentIDStr.String
		} else {
			fb.StudentIDStr = "N/A"
		}
		if middleName.Valid {
			fb.MiddleName = &middleName.String
		}
		if comments.Valid {
			fb.Comments = &comments.String
		}
		if forwardedBy.Valid {
			forwardedByInt := int(forwardedBy.Int64)
			fb.ForwardedBy = &forwardedByInt
		}
		if forwardedAt.Valid {
			forwardedAtStr := forwardedAt.Time.Format("2006-01-02 15:04:05")
			fb.ForwardedAt = &forwardedAtStr
		}
		if forwardedByName.Valid && forwardedByName.String != "" {
			fb.ForwardedByName = &forwardedByName.String
		}
		if workingStudentNotes.Valid {
			fb.WorkingStudentNotes = &workingStudentNotes.String
		}

		fb.StudentName = fmt.Sprintf("%s, %s", fb.LastName, fb.FirstName)
		if middleName.Valid {
			fb.StudentName += " " + middleName.String
		}
		fb.DateSubmitted = dateSubmitted.Format("2006-01-02 15:04:05")

		feedbacks = append(feedbacks, fb)
	}

	return feedbacks, nil
}

// GetStudentFeedback returns feedback history for a specific student
func (a *App) GetStudentFeedback(studentID int) ([]Feedback, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	query := `
		SELECT 
			f.id, 
			f.student_id, 
			COALESCE(s.student_id, ws.student_id, 'N/A') as student_id_str,
			COALESCE(s.first_name, ws.first_name, '') as first_name,
			COALESCE(s.middle_name, ws.middle_name) as middle_name,
			COALESCE(s.last_name, ws.last_name, '') as last_name,
			f.pc_number, 
			f.equipment_condition, 
			f.monitor_condition, 
			f.keyboard_condition, 
			f.mouse_condition, 
			f.comments, 
			f.date_submitted 
		FROM feedback f
		LEFT JOIN students s ON f.student_id = s.user_id
		LEFT JOIN working_students ws ON f.student_id = ws.user_id
		WHERE f.student_id = ? 
		ORDER BY f.date_submitted DESC`
	rows, err := a.db.Query(query, studentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var feedbacks []Feedback
	for rows.Next() {
		var fb Feedback
		var middleName, comments, studentIDStr sql.NullString
		var dateSubmitted time.Time

		err := rows.Scan(&fb.ID, &fb.StudentID, &studentIDStr, &fb.FirstName, &middleName, &fb.LastName,
			&fb.PCNumber, &fb.EquipmentCondition, &fb.MonitorCondition,
			&fb.KeyboardCondition, &fb.MouseCondition, &comments, &dateSubmitted)
		if err != nil {
			continue
		}

		if studentIDStr.Valid {
			fb.StudentIDStr = studentIDStr.String
		} else {
			fb.StudentIDStr = "N/A"
		}
		if middleName.Valid {
			fb.MiddleName = &middleName.String
		}
		if comments.Valid {
			fb.Comments = &comments.String
		}

		fb.StudentName = fmt.Sprintf("%s, %s", fb.LastName, fb.FirstName)
		if middleName.Valid {
			fb.StudentName += " " + middleName.String
		}
		fb.DateSubmitted = dateSubmitted.Format("2006-01-02 15:04:05")

		feedbacks = append(feedbacks, fb)
	}

	return feedbacks, nil
}

// SaveEquipmentFeedback saves equipment feedback from a student
func (a *App) SaveEquipmentFeedback(userID int, userName, computerStatus, computerIssue, mouseStatus, mouseIssue, keyboardStatus, keyboardIssue, monitorStatus, monitorIssue, additionalComments string) error {
	if a.db == nil {
		return fmt.Errorf("database not connected")
	}

	// Get the hostname (PC number) of this device
	hostname, err := os.Hostname()
	if err != nil {
		log.Printf("⚠ Failed to get hostname: %v", err)
		hostname = "Unknown"
	}
	pcNumber := hostname

	// Determine equipment conditions based on status
	// ENUM values: 'Good', 'Minor Issue', 'Not Working'
	equipmentCondition := "Good"
	if computerStatus == "no" {
		equipmentCondition = "Not Working"
	}

	monitorCondition := "Good"
	if monitorStatus == "no" {
		monitorCondition = "Not Working"
	}

	keyboardCondition := "Good"
	if keyboardStatus == "no" {
		keyboardCondition = "Not Working"
	}

	mouseCondition := "Good"
	if mouseStatus == "no" {
		mouseCondition = "Not Working"
	}

	// Build detailed comments with all issues
	var commentsParts []string
	if computerIssue != "" {
		commentsParts = append(commentsParts, fmt.Sprintf("Computer: %s", computerIssue))
	}
	if monitorIssue != "" {
		commentsParts = append(commentsParts, fmt.Sprintf("Monitor: %s", monitorIssue))
	}
	if keyboardIssue != "" {
		commentsParts = append(commentsParts, fmt.Sprintf("Keyboard: %s", keyboardIssue))
	}
	if mouseIssue != "" {
		commentsParts = append(commentsParts, fmt.Sprintf("Mouse: %s", mouseIssue))
	}
	if additionalComments != "" {
		commentsParts = append(commentsParts, fmt.Sprintf("Additional: %s", additionalComments))
	}

	combinedComments := ""
	if len(commentsParts) > 0 {
		combinedComments = commentsParts[0]
		for i := 1; i < len(commentsParts); i++ {
			combinedComments = fmt.Sprintf("%s; %s", combinedComments, commentsParts[i])
		}
	}

	// Insert feedback into database
	query := `INSERT INTO feedback (student_id, pc_number, 
			  equipment_condition, monitor_condition, keyboard_condition, mouse_condition, 
			  comments, date_submitted) 
			  VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`

	_, err = a.db.Exec(query, userID, pcNumber,
		equipmentCondition, monitorCondition, keyboardCondition, mouseCondition, nullString(combinedComments))

	if err != nil {
		log.Printf("Failed to save equipment feedback: %v", err)
		return fmt.Errorf("failed to save feedback: %w", err)
	}

	log.Printf("✓ Equipment feedback saved for user %d", userID)
	return nil
}

// GetPendingFeedback returns all pending feedback for working students to review
func (a *App) GetPendingFeedback() ([]Feedback, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	query := `
		SELECT 
			f.id, 
			f.student_id, 
			COALESCE(s.student_id, ws.student_id, 'N/A') as student_id_str,
			COALESCE(s.first_name, ws.first_name, '') as first_name, 
			COALESCE(s.middle_name, ws.middle_name) as middle_name, 
			COALESCE(s.last_name, ws.last_name, '') as last_name, 
			f.pc_number, 
			f.equipment_condition, 
			f.monitor_condition, 
			f.keyboard_condition, 
			f.mouse_condition, 
			f.comments, 
			f.date_submitted,
			f.status
		FROM feedback f
		LEFT JOIN students s ON f.student_id = s.user_id
		LEFT JOIN working_students ws ON f.student_id = ws.user_id
		WHERE f.status = 'pending'
		ORDER BY f.date_submitted DESC 
		LIMIT 1000`
	rows, err := a.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var feedbacks []Feedback
	for rows.Next() {
		var fb Feedback
		var middleName, comments, studentIDStr sql.NullString
		var dateSubmitted time.Time

		err := rows.Scan(&fb.ID, &fb.StudentID, &studentIDStr, &fb.FirstName, &middleName, &fb.LastName,
			&fb.PCNumber, &fb.EquipmentCondition, &fb.MonitorCondition,
			&fb.KeyboardCondition, &fb.MouseCondition, &comments, &dateSubmitted, &fb.Status)
		if err != nil {
			continue
		}

		if studentIDStr.Valid {
			fb.StudentIDStr = studentIDStr.String
		} else {
			fb.StudentIDStr = "N/A"
		}
		if middleName.Valid {
			fb.MiddleName = &middleName.String
		}
		if comments.Valid {
			fb.Comments = &comments.String
		}

		fb.StudentName = fmt.Sprintf("%s, %s", fb.LastName, fb.FirstName)
		if middleName.Valid {
			fb.StudentName += " " + middleName.String
		}
		fb.DateSubmitted = dateSubmitted.Format("2006-01-02 15:04:05")

		feedbacks = append(feedbacks, fb)
	}

	return feedbacks, nil
}

// ForwardFeedbackToAdmin forwards feedback from working student to admin
func (a *App) ForwardFeedbackToAdmin(feedbackID int, workingStudentID int, notes string) error {
	if a.db == nil {
		return fmt.Errorf("database not connected")
	}

	// Update feedback to forwarded status
	query := `UPDATE feedback 
			  SET status = 'forwarded', 
			      forwarded_by = ?, 
			      forwarded_at = NOW(), 
			      working_student_notes = ?
			  WHERE id = ? AND status = 'pending'`

	result, err := a.db.Exec(query, workingStudentID, nullString(notes), feedbackID)
	if err != nil {
		log.Printf("⚠ Failed to forward feedback %d: %v", feedbackID, err)
		return fmt.Errorf("failed to forward feedback: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("feedback not found or already forwarded")
	}

	log.Printf("✓ Feedback %d forwarded to admin by working student %d", feedbackID, workingStudentID)
	return nil
}

// ==============================================================================
// EXPORT FUNCTIONS
// ==============================================================================

// ExportLogsCSV exports login logs to CSV
func (a *App) ExportLogsCSV() (string, error) {
	logs, err := a.GetAllLogs()
	if err != nil {
		return "", err
	}

	homeDir, _ := os.UserHomeDir()
	filename := filepath.Join(homeDir, "Downloads", fmt.Sprintf("login_logs_%s.csv", time.Now().Format("20060102_150405")))

	file, err := os.Create(filename)
	if err != nil {
		return "", err
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	// Write header
	writer.Write([]string{"ID", "User ID", "User Type", "PC Number", "Login Time", "Logout Time"})

	// Write data
	for _, log := range logs {
		pcNum := ""
		if log.PCNumber != nil {
			pcNum = *log.PCNumber
		}
		logoutTime := ""
		if log.LogoutTime != nil {
			logoutTime = *log.LogoutTime
		}

		writer.Write([]string{
			strconv.Itoa(log.ID),
			strconv.Itoa(log.UserID),
			log.UserType,
			pcNum,
			log.LoginTime,
			logoutTime,
		})
	}

	return filename, nil
}

// ExportLogsPDF exports login logs to PDF
func (a *App) ExportLogsPDF() (string, error) {
	logs, err := a.GetAllLogs()
	if err != nil {
		return "", err
	}

	pdf := gofpdf.New("L", "mm", "A4", "")
	pdf.AddPage()
	pdf.SetFont("Arial", "B", 16)
	pdf.Cell(0, 10, "Login Logs Report")
	pdf.Ln(12)

	pdf.SetFont("Arial", "B", 10)
	pdf.Cell(20, 7, "ID")
	pdf.Cell(30, 7, "User ID")
	pdf.Cell(40, 7, "User Type")
	pdf.Cell(40, 7, "PC Number")
	pdf.Cell(70, 7, "Login Time")
	pdf.Cell(70, 7, "Logout Time")
	pdf.Ln(-1)

	pdf.SetFont("Arial", "", 9)
	for _, log := range logs {
		pcNum := ""
		if log.PCNumber != nil {
			pcNum = *log.PCNumber
		}
		logoutTime := ""
		if log.LogoutTime != nil {
			logoutTime = *log.LogoutTime
		}

		pdf.Cell(20, 6, strconv.Itoa(log.ID))
		pdf.Cell(30, 6, strconv.Itoa(log.UserID))
		pdf.Cell(40, 6, log.UserType)
		pdf.Cell(40, 6, pcNum)
		pdf.Cell(70, 6, log.LoginTime)
		pdf.Cell(70, 6, logoutTime)
		pdf.Ln(-1)
	}

	homeDir, _ := os.UserHomeDir()
	filename := filepath.Join(homeDir, "Downloads", fmt.Sprintf("login_logs_%s.pdf", time.Now().Format("20060102_150405")))
	err = pdf.OutputFileAndClose(filename)
	return filename, err
}

// ExportFeedbackCSV exports feedback to CSV
func (a *App) ExportFeedbackCSV() (string, error) {
	feedbacks, err := a.GetFeedback()
	if err != nil {
		return "", err
	}

	homeDir, _ := os.UserHomeDir()
	filename := filepath.Join(homeDir, "Downloads", fmt.Sprintf("feedback_%s.csv", time.Now().Format("20060102_150405")))

	file, err := os.Create(filename)
	if err != nil {
		return "", err
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	// Write header
	writer.Write([]string{"ID", "Student Name", "Student ID", "PC Number", "Equipment", "Monitor", "Keyboard", "Mouse", "Comments", "Date"})

	// Write data
	for _, fb := range feedbacks {
		comments := ""
		if fb.Comments != nil {
			comments = *fb.Comments
		}

		writer.Write([]string{
			strconv.Itoa(fb.ID),
			fb.StudentName,
			fb.StudentIDStr,
			fb.PCNumber,
			fb.EquipmentCondition,
			fb.MonitorCondition,
			fb.KeyboardCondition,
			fb.MouseCondition,
			comments,
			fb.DateSubmitted,
		})
	}

	return filename, nil
}

// ExportFeedbackPDF exports feedback to PDF
func (a *App) ExportFeedbackPDF() (string, error) {
	feedbacks, err := a.GetFeedback()
	if err != nil {
		return "", err
	}

	pdf := gofpdf.New("L", "mm", "A4", "")
	pdf.AddPage()
	pdf.SetFont("Arial", "B", 16)
	pdf.Cell(0, 10, "Equipment Feedback Report")
	pdf.Ln(12)

	pdf.SetFont("Arial", "B", 8)
	pdf.Cell(15, 7, "ID")
	pdf.Cell(45, 7, "Student Name")
	pdf.Cell(25, 7, "PC Number")
	pdf.Cell(30, 7, "Equipment")
	pdf.Cell(30, 7, "Monitor")
	pdf.Cell(30, 7, "Keyboard")
	pdf.Cell(30, 7, "Mouse")
	pdf.Cell(60, 7, "Date")
	pdf.Ln(-1)

	pdf.SetFont("Arial", "", 7)
	for _, fb := range feedbacks {
		pdf.Cell(15, 6, strconv.Itoa(fb.ID))
		pdf.Cell(45, 6, fb.StudentName)
		pdf.Cell(25, 6, fb.PCNumber)
		pdf.Cell(30, 6, fb.EquipmentCondition)
		pdf.Cell(30, 6, fb.MonitorCondition)
		pdf.Cell(30, 6, fb.KeyboardCondition)
		pdf.Cell(30, 6, fb.MouseCondition)
		pdf.Cell(60, 6, fb.DateSubmitted)
		pdf.Ln(-1)
	}

	homeDir, _ := os.UserHomeDir()
	filename := filepath.Join(homeDir, "Downloads", fmt.Sprintf("feedback_%s.pdf", time.Now().Format("20060102_150405")))
	err = pdf.OutputFileAndClose(filename)
	return filename, err
}

// ==============================================================================
// TEACHER DASHBOARD & CLASS MANAGEMENT
// ==============================================================================

// TeacherDashboard represents teacher dashboard data
type TeacherDashboard struct {
	Classes    []CourseClass `json:"classes"`
	Attendance []Attendance  `json:"attendance"`
}

// Subject represents a course/subject
type Subject struct {
	ID          int     `json:"id"`
	Code        string  `json:"code"`
	Name        string  `json:"name"`
	TeacherID   int     `json:"teacher_id"`
	TeacherName *string `json:"teacher_name,omitempty"`
	Description *string `json:"description,omitempty"`
	CreatedAt   string  `json:"created_at"`
}

// CourseClass represents a specific instance of a subject (with schedule, room, etc.)
type CourseClass struct {
	ID            int     `json:"id"`
	SubjectID     int     `json:"subject_id"`
	SubjectCode   string  `json:"subject_code"`
	SubjectName   string  `json:"subject_name"`
	OfferingCode  *string `json:"offering_code,omitempty"`
	TeacherID     int     `json:"teacher_id"`
	TeacherCode   *string `json:"teacher_code,omitempty"`
	TeacherName   string  `json:"teacher_name"`
	Schedule      *string `json:"schedule,omitempty"`
	Room          *string `json:"room,omitempty"`
	YearLevel     *string `json:"year_level,omitempty"`
	Section       *string `json:"section,omitempty"`
	Semester      *string `json:"semester,omitempty"`
	SchoolYear    *string `json:"school_year,omitempty"`
	EnrolledCount int     `json:"enrolled_count"`
	IsActive      bool    `json:"is_active"`
	CreatedBy     *int    `json:"created_by,omitempty"`
	CreatedAt     string  `json:"created_at"`
}

// ClasslistEntry represents a student's enrollment in a class
type ClasslistEntry struct {
	ID             int     `json:"id"`
	ClassID        int     `json:"class_id"`
	StudentID      int     `json:"student_id"`
	StudentCode    string  `json:"student_code"`
	FirstName      string  `json:"first_name"`
	MiddleName     *string `json:"middle_name,omitempty"`
	LastName       string  `json:"last_name"`
	EnrollmentDate string  `json:"enrollment_date"`
	Status         string  `json:"status"`
	Email          *string `json:"email,omitempty"`
	ContactNumber  *string `json:"contact_number,omitempty"`
	Course         *string `json:"course,omitempty"`
}

// ClassStudent represents a student (used for enrollment operations)
type ClassStudent struct {
	ID            int     `json:"id"`
	StudentID     string  `json:"student_id"`
	FirstName     string  `json:"first_name"`
	MiddleName    *string `json:"middle_name"`
	LastName      string  `json:"last_name"`
	Gender        *string `json:"gender"`
	Email         *string `json:"email"`
	ContactNumber *string `json:"contact_number"`
	ProfilePhoto  *string `json:"profile_photo"`
	ClassID       *int    `json:"class_id,omitempty"`
	IsEnrolled    bool    `json:"is_enrolled"`
}

// Attendance represents an attendance record
type Attendance struct {
	ID          int     `json:"id"`
	ClasslistID int     `json:"classlist_id"`
	ClassID     int     `json:"class_id"`
	CtrlNo      int     `json:"ctrl_no"`
	Date        string  `json:"date"`
	StudentID   int     `json:"student_id"`
	StudentCode string  `json:"student_code"`
	FirstName   string  `json:"first_name"`
	MiddleName  *string `json:"middle_name,omitempty"`
	LastName    string  `json:"last_name"`
	SubjectCode string  `json:"subject_code"`
	SubjectName string  `json:"subject_name"`
	TimeIn      *string `json:"time_in"`
	TimeOut     *string `json:"time_out"`
	PCNumber    *string `json:"pc_number,omitempty"`
	Status      string  `json:"status"`
	Remarks     *string `json:"remarks,omitempty"`
	RecordedBy  *int    `json:"recorded_by,omitempty"`
}

// GetTeacherDashboard returns teacher dashboard data
func (a *App) GetTeacherDashboard(teacherID int) (TeacherDashboard, error) {
	var dashboard TeacherDashboard

	if a.db == nil {
		return dashboard, fmt.Errorf("database not connected")
	}

	// Get teacher's classes
	classes, err := a.GetTeacherClasses(teacherID)
	if err != nil {
		log.Printf("⚠ Failed to get teacher classes: %v", err)
		return dashboard, err
	}
	dashboard.Classes = classes

	// Get today's attendance for all teacher's classes
	query := `
		SELECT 
			a.id, a.classlist_id, a.date, a.time_in, a.time_out, a.status, a.remarks,
			vcl.class_id, vcl.student_id, vcl.student_code, 
			vcl.first_name, vcl.middle_name, vcl.last_name,
			vc.subject_code, vc.subject_name
		FROM attendance a
		JOIN classlist cl ON a.classlist_id = cl.id
		JOIN v_classlist_complete vcl ON cl.id = vcl.classlist_id
		JOIN v_classes_complete vc ON cl.class_id = vc.class_id
		WHERE vc.teacher_id = ? AND a.date = CURDATE()
		ORDER BY a.time_in DESC
		LIMIT 100
	`
	rows, err := a.db.Query(query, teacherID)
	if err != nil {
		log.Printf("⚠ Failed to query attendance: %v", err)
		// Return dashboard with just classes
		return dashboard, nil
	}
	defer rows.Close()

	for rows.Next() {
		var att Attendance
		var timeIn, timeOut, remarks, middleName sql.NullString
		err := rows.Scan(
			&att.ID, &att.ClasslistID, &att.Date, &timeIn, &timeOut, &att.Status, &remarks,
			&att.ClassID, &att.StudentID, &att.StudentCode,
			&att.FirstName, &middleName, &att.LastName,
			&att.SubjectCode, &att.SubjectName,
		)
		if err != nil {
			continue
		}

		if timeIn.Valid {
			att.TimeIn = &timeIn.String
		}
		if timeOut.Valid {
			att.TimeOut = &timeOut.String
		}
		if remarks.Valid {
			att.Remarks = &remarks.String
		}
		if middleName.Valid {
			att.MiddleName = &middleName.String
		}

		dashboard.Attendance = append(dashboard.Attendance, att)
	}

	return dashboard, nil
}

// GetSubjects returns all subjects
func (a *App) GetSubjects() ([]Subject, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	query := `
		SELECT 
			s.id, s.subject_code, s.subject_name, s.teacher_id, s.created_at,
			CONCAT(t.last_name, ', ', t.first_name, 
			       CASE WHEN t.middle_name IS NOT NULL THEN CONCAT(' ', t.middle_name) ELSE '' END) AS teacher_name,
			s.description
		FROM subjects s
		JOIN teachers t ON s.teacher_id = t.id
		ORDER BY s.subject_code
	`
	rows, err := a.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var subjects []Subject
	for rows.Next() {
		var subj Subject
		var teacherName, description sql.NullString
		var createdAt time.Time
		err := rows.Scan(&subj.ID, &subj.Code, &subj.Name, &subj.TeacherID, &createdAt, &teacherName, &description)
		if err != nil {
			continue
		}
		subj.CreatedAt = createdAt.Format("2006-01-02 15:04:05")
		if teacherName.Valid {
			subj.TeacherName = &teacherName.String
		}
		if description.Valid {
			subj.Description = &description.String
		}
		subjects = append(subjects, subj)
	}

	return subjects, nil
}

// GetTeacherClassesByUserID returns all classes for a teacher given their user ID
func (a *App) GetTeacherClassesByUserID(userID int) ([]CourseClass, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	// First get the teacher ID from the user ID
	teacherID, err := a.GetTeacherID(userID)
	if err != nil {
		return nil, fmt.Errorf("teacher not found for user ID %d: %v", userID, err)
	}

	// Then get the classes for that teacher
	return a.GetTeacherClasses(teacherID)
}

// GetTeacherClasses returns all classes for a specific teacher
func (a *App) GetTeacherClasses(teacherID int) ([]CourseClass, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	query := `
		SELECT 
			c.id, c.subject_id, s.subject_code, s.subject_name, c.offering_code,
			c.teacher_id, CONCAT(t.last_name, ', ', t.first_name) as teacher_name,
			c.schedule, c.room, c.year_level, c.section, c.semester, c.school_year,
			COALESCE(enrollment_count.count, 0) as enrolled_count,
			c.is_active, c.created_by
		FROM classes c
		LEFT JOIN subjects s ON c.subject_id = s.id
		LEFT JOIN teachers t ON c.teacher_id = t.id
		LEFT JOIN (
			SELECT class_id, COUNT(*) as count 
			FROM classlist 
			GROUP BY class_id
		) enrollment_count ON c.id = enrollment_count.class_id
		WHERE c.teacher_id = ? AND c.is_active = TRUE 
		ORDER BY s.subject_code, c.year_level, c.section
	`
	rows, err := a.db.Query(query, teacherID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var classes []CourseClass
	for rows.Next() {
		var class CourseClass
		var offeringCode, schedule, room, yearLevel, section, semester, schoolYear sql.NullString
		var createdBy sql.NullInt64
		err := rows.Scan(
			&class.ID, &class.SubjectID, &class.SubjectCode, &class.SubjectName, &offeringCode,
			&class.TeacherID, &class.TeacherName,
			&schedule, &room, &yearLevel, &section, &semester, &schoolYear,
			&class.EnrolledCount, &class.IsActive, &createdBy,
		)
		if err != nil {
			continue
		}
		if offeringCode.Valid {
			class.OfferingCode = &offeringCode.String
		}
		if schedule.Valid {
			class.Schedule = &schedule.String
		}
		if room.Valid {
			class.Room = &room.String
		}
		if yearLevel.Valid {
			class.YearLevel = &yearLevel.String
		}
		if section.Valid {
			class.Section = &section.String
		}
		if semester.Valid {
			class.Semester = &semester.String
		}
		if schoolYear.Valid {
			class.SchoolYear = &schoolYear.String
		}
		if createdBy.Valid {
			createdByInt := int(createdBy.Int64)
			class.CreatedBy = &createdByInt
		}
		classes = append(classes, class)
	}

	return classes, nil
}

// GetTeacherClassesCreatedByWorkingStudents returns classes assigned to a teacher that were created by working students
func (a *App) GetTeacherClassesCreatedByWorkingStudents(teacherUserID int) ([]CourseClass, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	// First get the teacher ID from the user ID
	teacherID, err := a.GetTeacherID(teacherUserID)
	if err != nil {
		return nil, fmt.Errorf("teacher not found for user ID %d: %v", teacherUserID, err)
	}

	query := `
		SELECT 
			c.id, c.subject_id, s.subject_code, s.subject_name, c.offering_code,
			c.teacher_id, CONCAT(t.last_name, ', ', t.first_name) as teacher_name,
			c.schedule, c.room, c.year_level, c.section, c.semester, c.school_year,
			COALESCE(enrollment_count.count, 0) as enrolled_count,
			c.is_active, c.created_by, c.created_at
		FROM classes c
		LEFT JOIN subjects s ON c.subject_id = s.id
		LEFT JOIN teachers t ON c.teacher_id = t.id
		LEFT JOIN (
			SELECT class_id, COUNT(*) as count 
			FROM classlist 
			WHERE status = 'active'
			GROUP BY class_id
		) enrollment_count ON c.id = enrollment_count.class_id
		WHERE c.teacher_id = ? AND c.is_active = TRUE AND c.created_by IS NOT NULL
		ORDER BY c.created_at DESC, s.subject_code, c.year_level, c.section
	`
	rows, err := a.db.Query(query, teacherID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var classes []CourseClass
	for rows.Next() {
		var class CourseClass
		var offeringCode, schedule, room, yearLevel, section, semester, schoolYear sql.NullString
		var createdBy sql.NullInt64
		var createdAt time.Time
		err := rows.Scan(
			&class.ID, &class.SubjectID, &class.SubjectCode, &class.SubjectName, &offeringCode,
			&class.TeacherID, &class.TeacherName,
			&schedule, &room, &yearLevel, &section, &semester, &schoolYear,
			&class.EnrolledCount, &class.IsActive, &createdBy, &createdAt,
		)
		if err != nil {
			continue
		}
		if offeringCode.Valid {
			class.OfferingCode = &offeringCode.String
		}
		if schedule.Valid {
			class.Schedule = &schedule.String
		}
		if room.Valid {
			class.Room = &room.String
		}
		if yearLevel.Valid {
			class.YearLevel = &yearLevel.String
		}
		if section.Valid {
			class.Section = &section.String
		}
		if semester.Valid {
			class.Semester = &semester.String
		}
		if schoolYear.Valid {
			class.SchoolYear = &schoolYear.String
		}
		if createdBy.Valid {
			createdByInt := int(createdBy.Int64)
			class.CreatedBy = &createdByInt
		}
		class.CreatedAt = createdAt.Format("2006-01-02 15:04:05")
		classes = append(classes, class)
	}

	return classes, nil
}

// GetAllClasses returns all active classes
func (a *App) GetAllClasses() ([]CourseClass, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	log.Printf("🔍 GetAllClasses: Starting query...")

	query := `
		SELECT 
			c.id, c.subject_id, s.subject_code, s.subject_name, c.offering_code,
			c.teacher_id, CONCAT(t.last_name, ', ', t.first_name) as teacher_name,
			c.schedule, c.room, c.year_level, c.section, c.semester, c.school_year,
			COALESCE(enrollment_count.count, 0) as enrolled_count,
			c.is_active, c.created_by
		FROM classes c
		LEFT JOIN subjects s ON c.subject_id = s.id
		LEFT JOIN teachers t ON c.teacher_id = t.id
		LEFT JOIN (
			SELECT class_id, COUNT(*) as count 
			FROM classlist 
			GROUP BY class_id
		) enrollment_count ON c.id = enrollment_count.class_id
		WHERE c.is_active = TRUE 
		ORDER BY s.subject_code, c.year_level, c.section
	`
	rows, err := a.db.Query(query)
	if err != nil {
		log.Printf("❌ GetAllClasses: Query failed: %v", err)
		return nil, err
	}
	defer rows.Close()

	log.Printf("🔍 GetAllClasses: Query executed successfully, processing rows...")
	var classes []CourseClass
	for rows.Next() {
		var class CourseClass
		var offeringCode, schedule, room, yearLevel, section, semester, schoolYear sql.NullString
		var createdBy sql.NullInt64
		err := rows.Scan(
			&class.ID, &class.SubjectID, &class.SubjectCode, &class.SubjectName, &offeringCode,
			&class.TeacherID, &class.TeacherName,
			&schedule, &room, &yearLevel, &section, &semester, &schoolYear,
			&class.EnrolledCount, &class.IsActive, &createdBy,
		)
		if err != nil {
			continue
		}
		if offeringCode.Valid {
			class.OfferingCode = &offeringCode.String
		}
		if schedule.Valid {
			class.Schedule = &schedule.String
		}
		if room.Valid {
			class.Room = &room.String
		}
		if yearLevel.Valid {
			class.YearLevel = &yearLevel.String
		}
		if section.Valid {
			class.Section = &section.String
		}
		if semester.Valid {
			class.Semester = &semester.String
		}
		if schoolYear.Valid {
			class.SchoolYear = &schoolYear.String
		}
		if createdBy.Valid {
			createdByInt := int(createdBy.Int64)
			class.CreatedBy = &createdByInt
		}
		classes = append(classes, class)
	}

	log.Printf("✅ GetAllClasses: Successfully retrieved %d classes", len(classes))
	return classes, nil
}

// GetWorkingStudentID returns the working student ID for a given user ID
func (a *App) GetWorkingStudentID(userID int) (int, error) {
	if a.db == nil {
		return 0, fmt.Errorf("database not connected")
	}

	var workingStudentID int
	query := `SELECT id FROM working_students WHERE user_id = ?`
	err := a.db.QueryRow(query, userID).Scan(&workingStudentID)
	if err != nil {
		return 0, err
	}
	return workingStudentID, nil
}

// GetTeacherID returns the teacher ID for a given user ID
func (a *App) GetTeacherID(userID int) (int, error) {
	if a.db == nil {
		return 0, fmt.Errorf("database not connected")
	}

	var teacherID int
	query := `SELECT id FROM teachers WHERE user_id = ?`
	err := a.db.QueryRow(query, userID).Scan(&teacherID)
	if err != nil {
		return 0, err
	}
	return teacherID, nil
}

// GetClassesByCreator returns classes created by a specific working student
func (a *App) GetClassesByCreator(createdBy int) ([]CourseClass, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	query := `
		SELECT 
			c.id, c.subject_id, s.subject_code, s.subject_name,
			c.teacher_id, CONCAT(t.last_name, ', ', t.first_name) as teacher_name,
			c.schedule, c.room, c.year_level, c.section, c.semester, c.school_year,
			COALESCE(enrollment_count.count, 0) as enrolled_count,
			c.is_active, c.created_by
		FROM classes c
		LEFT JOIN subjects s ON c.subject_id = s.id
		LEFT JOIN teachers t ON c.teacher_id = t.id
		LEFT JOIN (
			SELECT class_id, COUNT(*) as count 
			FROM classlist 
			GROUP BY class_id
		) enrollment_count ON c.id = enrollment_count.class_id
		WHERE c.is_active = TRUE 
		ORDER BY s.subject_code, c.year_level, c.section
	`
	rows, err := a.db.Query(query, createdBy)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var classes []CourseClass
	for rows.Next() {
		var class CourseClass
		var schedule, room, yearLevel, section, semester, schoolYear sql.NullString
		var createdByField sql.NullInt64
		err := rows.Scan(
			&class.ID, &class.SubjectID, &class.SubjectCode, &class.SubjectName,
			&class.TeacherID, &class.TeacherName,
			&schedule, &room, &yearLevel, &section, &semester, &schoolYear,
			&class.EnrolledCount, &class.IsActive, &createdByField,
		)
		if err != nil {
			continue
		}
		if schedule.Valid {
			class.Schedule = &schedule.String
		}
		if room.Valid {
			class.Room = &room.String
		}
		if yearLevel.Valid {
			class.YearLevel = &yearLevel.String
		}
		if section.Valid {
			class.Section = &section.String
		}
		if semester.Valid {
			class.Semester = &semester.String
		}
		if schoolYear.Valid {
			class.SchoolYear = &schoolYear.String
		}
		if createdByField.Valid {
			createdByInt := int(createdByField.Int64)
			class.CreatedBy = &createdByInt
		}
		classes = append(classes, class)
	}

	return classes, nil
}

// GetClassStudents returns students enrolled in a specific class
func (a *App) GetClassStudents(classID int) ([]ClasslistEntry, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	query := `
		SELECT 
			vcl.classlist_id, vcl.class_id, vcl.student_id, vcl.student_code,
			vcl.first_name, vcl.middle_name, vcl.last_name,
			vcl.enrollment_status,
			cl.enrollment_date,
			CASE 
				WHEN vcl.user_type = 'student' THEN st.email
				WHEN vcl.user_type = 'working_student' THEN ws.email
			END as email,
			CASE 
				WHEN vcl.user_type = 'student' THEN st.contact_number
				WHEN vcl.user_type = 'working_student' THEN ws.contact_number
			END as contact_number,
			s.subject_name as course
		FROM v_classlist_complete vcl
		JOIN classlist cl ON vcl.classlist_id = cl.id
		JOIN classes c ON cl.class_id = c.id
		JOIN subjects s ON c.subject_id = s.id
		LEFT JOIN students st ON vcl.student_id = st.user_id AND vcl.user_type = 'student'
		LEFT JOIN working_students ws ON vcl.student_id = ws.user_id AND vcl.user_type = 'working_student'
		WHERE vcl.class_id = ? AND vcl.enrollment_status = 'active'
		ORDER BY vcl.last_name, vcl.first_name
	`

	rows, err := a.db.Query(query, classID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var students []ClasslistEntry
	for rows.Next() {
		var student ClasslistEntry
		var middleName, email, contactNumber, course sql.NullString
		var enrollmentDate time.Time
		err := rows.Scan(
			&student.ID, &student.ClassID, &student.StudentID, &student.StudentCode,
			&student.FirstName, &middleName, &student.LastName,
			&student.Status,
			&enrollmentDate, &email, &contactNumber, &course,
		)
		if err != nil {
			continue
		}
		if middleName.Valid {
			student.MiddleName = &middleName.String
		}
		if email.Valid {
			student.Email = &email.String
		}
		if contactNumber.Valid {
			student.ContactNumber = &contactNumber.String
		}
		if course.Valid {
			student.Course = &course.String
		}
		student.EnrollmentDate = enrollmentDate.Format("2006-01-02")
		students = append(students, student)
	}

	return students, nil
}

// CreateSubject creates a new subject (or updates if exists)
func (a *App) CreateSubject(code, name string, teacherUserID int, description string) error {
	if a.db == nil {
		return fmt.Errorf("database not connected")
	}

	// Convert teacher user ID to teacher ID
	teacherID, err := a.GetTeacherID(teacherUserID)
	if err != nil {
		log.Printf("⚠ Failed to get teacher ID for user %d: %v", teacherUserID, err)
		return fmt.Errorf("teacher not found for user ID %d: %v", teacherUserID, err)
	}

	// Use INSERT ... ON DUPLICATE KEY UPDATE to handle existing subjects gracefully
	query := `
		INSERT INTO subjects (subject_code, subject_name, teacher_id, description) 
		VALUES (?, ?, ?, ?)
		ON DUPLICATE KEY UPDATE 
			subject_name = VALUES(subject_name),
			teacher_id = VALUES(teacher_id),
			description = VALUES(description)
	`
	_, err = a.db.Exec(query, code, name, teacherID, nullString(description))
	if err != nil {
		log.Printf("⚠ Failed to create/update subject: %v", err)
		return err
	}
	log.Printf("✓ Subject created/updated: %s - %s (teacher_id=%d, user_id=%d)", code, name, teacherID, teacherUserID)
	return nil
}

// CreateClass creates a new class instance (by working student)
func (a *App) CreateClass(subjectID, teacherUserID int, offeringCode, schedule, room, yearLevel, section, semester, schoolYear string, createdBy int) (int, error) {
	if a.db == nil {
		return 0, fmt.Errorf("database not connected")
	}

	// Convert teacher user ID to teacher ID
	teacherID, err := a.GetTeacherID(teacherUserID)
	if err != nil {
		log.Printf("⚠ Failed to get teacher ID for user %d: %v", teacherUserID, err)
		return 0, fmt.Errorf("teacher not found for user ID %d: %v", teacherUserID, err)
	}

	query := `
		INSERT INTO classes (subject_id, teacher_id, offering_code, schedule, room, year_level, section, semester, school_year, created_by, is_active)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
	`
	// Handle created_by: convert user ID to working student ID
	var createdByValue interface{}
	if createdBy == 0 {
		createdByValue = nil
	} else {
		// Get the working student ID for this user
		workingStudentID, err := a.GetWorkingStudentID(createdBy)
		if err != nil {
			log.Printf("⚠ Warning: Could not get working student ID for user %d: %v", createdBy, err)
			createdByValue = nil
		} else {
			createdByValue = workingStudentID
		}
	}

	result, err := a.db.Exec(
		query,
		subjectID, teacherID,
		nullString(offeringCode),
		nullString(schedule), nullString(room),
		nullString(yearLevel), nullString(section),
		nullString(semester), nullString(schoolYear),
		createdByValue,
	)
	if err != nil {
		log.Printf("⚠ Failed to create class: %v", err)
		return 0, err
	}

	classID, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}

	log.Printf("✓ Class created: ID=%d, Subject=%d, Teacher=%d (user_id=%d)", classID, subjectID, teacherID, teacherUserID)
	return int(classID), nil
}

// UpdateClass updates a class
func (a *App) UpdateClass(classID int, schedule, room, yearLevel, section, semester, schoolYear string, isActive bool) error {
	if a.db == nil {
		return fmt.Errorf("database not connected")
	}

	query := `
		UPDATE classes 
		SET schedule = ?, room = ?, year_level = ?, section = ?, semester = ?, school_year = ?, is_active = ?
		WHERE id = ?
	`
	_, err := a.db.Exec(
		query,
		nullString(schedule), nullString(room),
		nullString(yearLevel), nullString(section),
		nullString(semester), nullString(schoolYear),
		isActive, classID,
	)
	if err != nil {
		log.Printf("⚠ Failed to update class: %v", err)
		return err
	}

	log.Printf("✓ Class updated: ID=%d", classID)
	return nil
}

// DeleteClass soft-deletes a class by setting is_active to false
func (a *App) DeleteClass(classID int) error {
	if a.db == nil {
		return fmt.Errorf("database not connected")
	}

	query := `UPDATE classes SET is_active = FALSE WHERE id = ?`
	_, err := a.db.Exec(query, classID)
	if err != nil {
		log.Printf("⚠ Failed to delete class: %v", err)
		return err
	}

	log.Printf("✓ Class deactivated: ID=%d", classID)
	return nil
}

// EnrollStudentInClass enrolls a student in a specific class
func (a *App) EnrollStudentInClass(studentID int, classID int, enrolledBy int) error {
	if a.db == nil {
		return fmt.Errorf("database not connected")
	}

	query := `
		INSERT INTO classlist (class_id, student_id, status)
		VALUES (?, ?, 'active')
		ON DUPLICATE KEY UPDATE status = 'active', updated_at = CURRENT_TIMESTAMP
	`
	_, err := a.db.Exec(query, classID, studentID)
	if err != nil {
		log.Printf("⚠ Failed to enroll student %d in class %d: %v", studentID, classID, err)
		return err
	}

	log.Printf("✓ Student %d enrolled in class %d", studentID, classID)
	return nil
}

// EnrollMultipleStudents enrolls multiple students in a class at once
func (a *App) EnrollMultipleStudents(studentIDs []int, classID int, enrolledBy int) error {
	if a.db == nil {
		return fmt.Errorf("database not connected")
	}

	tx, err := a.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	stmt, err := tx.Prepare(`
		INSERT INTO classlist (class_id, student_id, status)
		VALUES (?, ?, 'active')
		ON DUPLICATE KEY UPDATE status = 'active', updated_at = CURRENT_TIMESTAMP
	`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, studentID := range studentIDs {
		_, err = stmt.Exec(classID, studentID)
		if err != nil {
			log.Printf("⚠ Failed to enroll student %d: %v", studentID, err)
			return err
		}
	}

	if err = tx.Commit(); err != nil {
		return err
	}

	log.Printf("✓ Enrolled %d students in class %d", len(studentIDs), classID)
	return nil
}

// UnenrollStudentFromClass removes a student from a class
func (a *App) UnenrollStudentFromClass(classlistID int) error {
	if a.db == nil {
		return fmt.Errorf("database not connected")
	}

	query := `UPDATE classlist SET status = 'dropped' WHERE id = ?`
	_, err := a.db.Exec(query, classlistID)
	if err != nil {
		log.Printf("⚠ Failed to unenroll student (classlist_id=%d): %v", classlistID, err)
		return err
	}

	log.Printf("✓ Student unenrolled (classlist_id=%d)", classlistID)
	return nil
}

// UnenrollStudentFromClassByIDs removes a student from a specific class by student_id and class_id
func (a *App) UnenrollStudentFromClassByIDs(studentID int, classID int) error {
	if a.db == nil {
		return fmt.Errorf("database not connected")
	}

	query := `UPDATE classlist SET status = 'dropped' WHERE student_id = ? AND class_id = ?`
	_, err := a.db.Exec(query, studentID, classID)
	if err != nil {
		log.Printf("⚠ Failed to unenroll student %d from class %d: %v", studentID, classID, err)
		return err
	}

	log.Printf("✓ Student %d unenrolled from class %d", studentID, classID)
	return nil
}

// GetAvailableStudents returns students not enrolled in a specific class
func (a *App) GetAvailableStudents(classID int) ([]ClassStudent, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	query := `
		SELECT 
			s.user_id as id, s.student_id, s.first_name, s.middle_name, s.last_name,
			EXISTS(
				SELECT 1 FROM classlist cl 
				WHERE cl.student_id = s.user_id AND cl.class_id = ? AND cl.status = 'active'
			) as is_enrolled
		FROM students s
		WHERE NOT EXISTS (
			SELECT 1 FROM classlist cl 
			WHERE cl.student_id = s.user_id AND cl.class_id = ? AND cl.status = 'active'
		)
		
		UNION ALL
		
		SELECT 
			ws.user_id as id, ws.student_id, ws.first_name, ws.middle_name, ws.last_name,
			EXISTS(
				SELECT 1 FROM classlist cl 
				WHERE cl.student_id = ws.user_id AND cl.class_id = ? AND cl.status = 'active'
			) as is_enrolled
		FROM working_students ws
		WHERE NOT EXISTS (
			SELECT 1 FROM classlist cl 
			WHERE cl.student_id = ws.user_id AND cl.class_id = ? AND cl.status = 'active'
		)
		
		ORDER BY last_name, first_name
	`

	rows, err := a.db.Query(query, classID, classID, classID, classID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var students []ClassStudent
	for rows.Next() {
		var student ClassStudent
		var middleName sql.NullString
		err := rows.Scan(&student.ID, &student.StudentID, &student.FirstName, &middleName, &student.LastName, &student.IsEnrolled)
		if err != nil {
			continue
		}
		if middleName.Valid {
			student.MiddleName = &middleName.String
		}
		students = append(students, student)
	}

	return students, nil
}

// GetAllStudentsForEnrollment returns all students with their enrollment status for a specific class
func (a *App) GetAllStudentsForEnrollment(classID int) ([]ClassStudent, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	query := `
		SELECT 
			s.user_id as id, s.student_id, s.first_name, s.middle_name, s.last_name,
			EXISTS(
				SELECT 1 FROM classlist cl 
				WHERE cl.student_id = s.user_id AND cl.class_id = ? AND cl.status = 'active'
			) as is_enrolled
		FROM students s
		
		UNION ALL
		
		SELECT 
			ws.user_id as id, ws.student_id, ws.first_name, ws.middle_name, ws.last_name,
			EXISTS(
				SELECT 1 FROM classlist cl 
				WHERE cl.student_id = ws.user_id AND cl.class_id = ? AND cl.status = 'active'
			) as is_enrolled
		FROM working_students ws
		
		ORDER BY last_name, first_name
	`

	rows, err := a.db.Query(query, classID, classID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var students []ClassStudent
	for rows.Next() {
		var student ClassStudent
		var middleName sql.NullString
		err := rows.Scan(&student.ID, &student.StudentID, &student.FirstName, &middleName,
			&student.LastName, &student.IsEnrolled)
		if err != nil {
			continue
		}
		if middleName.Valid {
			student.MiddleName = &middleName.String
		}
		students = append(students, student)
	}

	return students, nil
}

// GetAllTeachers returns all teachers for assignment purposes
func (a *App) GetAllTeachers() ([]User, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	query := `
		SELECT 
			t.user_id, t.id, t.teacher_id, t.first_name, t.middle_name, t.last_name
		FROM teachers t
		ORDER BY t.last_name, t.first_name
	`

	rows, err := a.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var teachers []User
	for rows.Next() {
		var teacher User
		var middleName, employeeID sql.NullString
		var teachersTableID int
		err := rows.Scan(&teacher.ID, &teachersTableID, &employeeID, &teacher.FirstName, &middleName, &teacher.LastName)
		if err != nil {
			continue
		}
		if middleName.Valid {
			teacher.MiddleName = &middleName.String
		}
		if employeeID.Valid {
			teacher.EmployeeID = &employeeID.String
		}
		teacher.Role = "teacher"
		teachers = append(teachers, teacher)
	}

	return teachers, nil
}

// GetAllRegisteredStudents returns all registered students with optional year level filter
func (a *App) GetAllRegisteredStudents(yearLevelFilter, sectionFilter string) ([]ClassStudent, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	// Base query that gets all students
	query := `
		SELECT 
			s.user_id as id, s.student_id, s.first_name, s.middle_name, s.last_name, 
			s.email, s.contact_number, s.profile_photo
		FROM students s
		ORDER BY s.last_name, s.first_name
	`

	rows, err := a.db.Query(query)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var students []ClassStudent
	for rows.Next() {
		var student ClassStudent
		var middleName, email, contactNumber, profilePhoto sql.NullString
		err := rows.Scan(&student.ID, &student.StudentID, &student.FirstName, &middleName,
			&student.LastName, &email, &contactNumber, &profilePhoto)
		if err != nil {
			continue
		}
		if middleName.Valid {
			student.MiddleName = &middleName.String
		}
		if email.Valid {
			student.Email = &email.String
		}
		if contactNumber.Valid {
			student.ContactNumber = &contactNumber.String
		}
		if profilePhoto.Valid {
			student.ProfilePhoto = &profilePhoto.String
		}
		students = append(students, student)
	}

	return students, nil
}

// GetAvailableSections returns all unique sections from students and working_students tables
// Note: section column no longer exists in the schema, returning empty array
func (a *App) GetAvailableSections() ([]string, error) {
	return []string{}, nil
}

// RecordAttendance records attendance for a student in a class
func (a *App) RecordAttendance(classID, studentID int, timeIn, timeOut, status, remarks string, recordedBy int) error {
	if a.db == nil {
		return fmt.Errorf("database not connected")
	}

	// First, get the classlist_id for this student-class combination
	var classlistID int
	err := a.db.QueryRow(
		`SELECT id FROM classlist WHERE class_id = ? AND student_id = ? AND status = 'active' LIMIT 1`,
		classID, studentID,
	).Scan(&classlistID)
	if err != nil {
		log.Printf("⚠ Student %d not enrolled in class %d: %v", studentID, classID, err)
		return fmt.Errorf("student not enrolled in this class")
	}

	// Record or update attendance
	query := `
		INSERT INTO attendance (classlist_id, date, time_in, time_out, status, remarks, recorded_by)
		VALUES (?, CURDATE(), ?, ?, ?, ?, ?)
		ON DUPLICATE KEY UPDATE 
			time_in = COALESCE(VALUES(time_in), time_in),
			time_out = COALESCE(VALUES(time_out), time_out),
			status = VALUES(status),
			remarks = VALUES(remarks),
			recorded_by = VALUES(recorded_by),
			updated_at = CURRENT_TIMESTAMP
	`
	_, err = a.db.Exec(query, classlistID, nullString(timeIn), nullString(timeOut), status, nullString(remarks), nullInt(recordedBy))
	if err != nil {
		log.Printf("⚠ Failed to record attendance: %v", err)
		return err
	}

	log.Printf("✓ Attendance recorded: student=%d, class=%d, status=%s", studentID, classID, status)
	return nil
}

// UpdateAttendanceTime updates time in/out for an attendance record
func (a *App) UpdateAttendanceTime(attendanceID int, timeIn, timeOut string) error {
	if a.db == nil {
		return fmt.Errorf("database not connected")
	}

	query := `
		UPDATE attendance 
		SET time_in = COALESCE(?, time_in), 
		    time_out = COALESCE(?, time_out),
		    updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`
	_, err := a.db.Exec(query, nullString(timeIn), nullString(timeOut), attendanceID)
	if err != nil {
		log.Printf("⚠ Failed to update attendance time: %v", err)
		return err
	}

	log.Printf("✓ Attendance time updated: ID=%d", attendanceID)
	return nil
}

// GetClassAttendance gets attendance records for a specific class on a specific date
func (a *App) GetClassAttendance(classID int, date string) ([]Attendance, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	query := `
		SELECT 
			COALESCE(a.id, 0) as attendance_id,
			cl.id as classlist_id,
			cl.class_id,
			ROW_NUMBER() OVER (ORDER BY vcl.last_name, vcl.first_name) as ctrl_no,
			COALESCE(a.date, ?) as date,
			vcl.student_id,
			vcl.student_code,
			vcl.first_name,
			vcl.middle_name,
			vcl.last_name,
			s.subject_code,
			s.subject_name,
			a.time_in,
			a.time_out,
			a.pc_number,
			a.status,
			a.remarks,
			a.recorded_by
		FROM classlist cl
		JOIN v_classlist_complete vcl ON cl.id = vcl.classlist_id
		JOIN classes c ON cl.class_id = c.id
		JOIN subjects s ON c.subject_id = s.id
		LEFT JOIN attendance a ON cl.id = a.classlist_id AND a.date = ?
		WHERE cl.class_id = ? AND cl.status = 'active'
		ORDER BY vcl.last_name, vcl.first_name
	`

	rows, err := a.db.Query(query, date, date, classID)
	if err != nil {
		log.Printf("⚠ Failed to query attendance: %v", err)
		return nil, err
	}
	defer rows.Close()

	var attendances []Attendance
	for rows.Next() {
		var att Attendance
		var middleName, timeIn, timeOut, pcNumber, remarks, status sql.NullString
		var recordedBy sql.NullInt64

		err := rows.Scan(
			&att.ID, &att.ClasslistID, &att.ClassID, &att.CtrlNo, &att.Date,
			&att.StudentID, &att.StudentCode, &att.FirstName, &middleName, &att.LastName,
			&att.SubjectCode, &att.SubjectName,
			&timeIn, &timeOut, &pcNumber, &status, &remarks, &recordedBy,
		)
		if err != nil {
			log.Printf("⚠ Failed to scan attendance row: %v", err)
			continue
		}

		if middleName.Valid {
			att.MiddleName = &middleName.String
		}
		if timeIn.Valid {
			att.TimeIn = &timeIn.String
		}
		if timeOut.Valid {
			att.TimeOut = &timeOut.String
		}
		if pcNumber.Valid {
			att.PCNumber = &pcNumber.String
		}
		if remarks.Valid {
			att.Remarks = &remarks.String
		}
		if status.Valid {
			att.Status = status.String
		} else {
			att.Status = "" // Empty string when no status is set yet
		}
		if recordedBy.Valid {
			recordedByInt := int(recordedBy.Int64)
			att.RecordedBy = &recordedByInt
		}

		attendances = append(attendances, att)
	}

	return attendances, nil
}

// InitializeAttendanceForClass creates attendance records for all students in a class for a date
// Status is initially NULL (no remarks yet)
func (a *App) InitializeAttendanceForClass(classID int, date string, recordedBy int) error {
	if a.db == nil {
		return fmt.Errorf("database not connected")
	}

	query := `
		INSERT INTO attendance (classlist_id, date, status, recorded_by, created_at)
		SELECT 
			cl.id,
			?,
			NULL,
			?,
			CURRENT_TIMESTAMP
		FROM classlist cl
		WHERE cl.class_id = ? AND cl.status = 'active'
		ON DUPLICATE KEY UPDATE id=id
	`

	_, err := a.db.Exec(query, date, recordedBy, classID)
	if err != nil {
		log.Printf("⚠ Failed to initialize attendance: %v", err)
		return err
	}

	log.Printf("✓ Attendance initialized for class %d on %s", classID, date)
	return nil
}

// UpdateAttendanceRecord updates a specific attendance record with new details
func (a *App) UpdateAttendanceRecord(attendanceID int, timeIn, timeOut, pcNumber, status, remarks string) error {
	if a.db == nil {
		return fmt.Errorf("database not connected")
	}

	query := `
		UPDATE attendance 
		SET time_in = ?,
		    time_out = ?,
		    pc_number = ?,
		    status = ?,
		    remarks = ?,
		    updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`

	_, err := a.db.Exec(query, nullString(timeIn), nullString(timeOut), nullString(pcNumber), status, nullString(remarks), attendanceID)
	if err != nil {
		log.Printf("⚠ Failed to update attendance record: %v", err)
		return err
	}

	log.Printf("✓ Attendance record updated: ID=%d, status=%s", attendanceID, status)
	return nil
}

// RecordStudentLogin records when a student logs in during class time
func (a *App) RecordStudentLogin(classID, studentID int, pcNumber string) error {
	if a.db == nil {
		return fmt.Errorf("database not connected")
	}

	// First, get the classlist_id
	var classlistID int
	err := a.db.QueryRow(
		`SELECT id FROM classlist WHERE class_id = ? AND student_id = ? AND status = 'active' LIMIT 1`,
		classID, studentID,
	).Scan(&classlistID)
	if err != nil {
		return fmt.Errorf("student not enrolled in this class")
	}

	// Record attendance as present with login time
	query := `
		INSERT INTO attendance (classlist_id, date, time_in, pc_number, status)
		VALUES (?, CURDATE(), CURTIME(), ?, 'present')
		ON DUPLICATE KEY UPDATE 
			time_in = COALESCE(time_in, CURTIME()),
			pc_number = VALUES(pc_number),
			status = 'present',
			updated_at = CURRENT_TIMESTAMP
	`

	_, err = a.db.Exec(query, classlistID, pcNumber)
	if err != nil {
		log.Printf("⚠ Failed to record student login: %v", err)
		return err
	}

	log.Printf("✓ Student login recorded: student=%d, class=%d, pc=%s", studentID, classID, pcNumber)
	return nil
}

// ExportAttendanceCSV exports attendance to CSV for a specific class
func (a *App) ExportAttendanceCSV(classID int) (string, error) {
	if a.db == nil {
		return "", fmt.Errorf("database not connected")
	}

	query := `
		SELECT 
			a.id, a.date, a.time_in, a.time_out, a.status, a.remarks,
			vcl.student_code, vcl.first_name, vcl.middle_name, vcl.last_name,
			vc.subject_code, vc.subject_name
		FROM attendance a
		JOIN classlist cl ON a.classlist_id = cl.id
		JOIN v_classlist_complete vcl ON cl.id = vcl.classlist_id
		JOIN v_classes_complete vc ON cl.class_id = vc.class_id
		WHERE cl.class_id = ?
		ORDER BY a.date DESC, vcl.last_name, vcl.first_name
	`
	rows, err := a.db.Query(query, classID)
	if err != nil {
		return "", err
	}
	defer rows.Close()

	var attendances []Attendance
	for rows.Next() {
		var att Attendance
		var timeIn, timeOut, remarks, middleName sql.NullString
		err := rows.Scan(
			&att.ID, &att.Date, &timeIn, &timeOut, &att.Status, &remarks,
			&att.StudentCode, &att.FirstName, &middleName, &att.LastName,
			&att.SubjectCode, &att.SubjectName,
		)
		if err != nil {
			continue
		}

		if timeIn.Valid {
			att.TimeIn = &timeIn.String
		}
		if timeOut.Valid {
			att.TimeOut = &timeOut.String
		}
		if remarks.Valid {
			att.Remarks = &remarks.String
		}
		if middleName.Valid {
			att.MiddleName = &middleName.String
		}

		attendances = append(attendances, att)
	}

	homeDir, _ := os.UserHomeDir()
	filename := filepath.Join(homeDir, "Downloads", fmt.Sprintf("attendance_%s.csv", time.Now().Format("20060102_150405")))

	file, err := os.Create(filename)
	if err != nil {
		return "", err
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	// Write header
	writer.Write([]string{"Date", "Student ID", "First Name", "Middle Name", "Last Name", "Subject", "Time In", "Time Out", "Status", "Remarks"})

	// Write data
	for _, att := range attendances {
		timeIn := ""
		if att.TimeIn != nil {
			timeIn = *att.TimeIn
		}
		timeOut := ""
		if att.TimeOut != nil {
			timeOut = *att.TimeOut
		}
		middleName := ""
		if att.MiddleName != nil {
			middleName = *att.MiddleName
		}
		remarks := ""
		if att.Remarks != nil {
			remarks = *att.Remarks
		}

		writer.Write([]string{
			att.Date,
			att.StudentCode,
			att.FirstName,
			middleName,
			att.LastName,
			fmt.Sprintf("%s - %s", att.SubjectCode, att.SubjectName),
			timeIn,
			timeOut,
			att.Status,
			remarks,
		})
	}

	log.Printf("✓ Attendance exported to CSV: %s", filename)
	return filename, nil
}

// ==============================================================================
// STUDENT DASHBOARD
// ==============================================================================

// StudentDashboard represents student dashboard data
type StudentDashboard struct {
	Attendance []Attendance `json:"attendance"`
	TodayLog   *Attendance  `json:"today_log"`
}

// GetStudentDashboard returns student dashboard data
func (a *App) GetStudentDashboard(userID int) (StudentDashboard, error) {
	var dashboard StudentDashboard

	if a.db == nil {
		return dashboard, fmt.Errorf("database not connected")
	}

	// Get all attendance for this student
	// Join with classlist to get class_id and student_id
	query := `
		SELECT 
			a.id, 
			cl.class_id, 
			a.date, 
			cl.student_id, 
			a.time_in, 
			a.time_out, 
			a.status 
		FROM attendance a
		JOIN classlist cl ON a.classlist_id = cl.id
		WHERE cl.student_id = ? 
		ORDER BY a.date DESC 
		LIMIT 100`
	rows, err := a.db.Query(query, userID)
	if err != nil {
		return dashboard, err
	}
	defer rows.Close()

	for rows.Next() {
		var att Attendance
		var timeIn, timeOut sql.NullString
		err := rows.Scan(&att.ID, &att.ClassID, &att.Date, &att.StudentID, &timeIn, &timeOut, &att.Status)
		if err != nil {
			continue
		}

		if timeIn.Valid {
			att.TimeIn = &timeIn.String
		}
		if timeOut.Valid {
			att.TimeOut = &timeOut.String
		}

		dashboard.Attendance = append(dashboard.Attendance, att)

		// Check if this is today's log
		if att.Date == time.Now().Format("2006-01-02") && dashboard.TodayLog == nil {
			dashboard.TodayLog = &att
		}
	}

	return dashboard, nil
}

// ==============================================================================
// WORKING STUDENT DASHBOARD
// ==============================================================================

// WorkingStudentDashboard represents working student dashboard data
type WorkingStudentDashboard struct {
	StudentsRegistered int `json:"students_registered"`
	ClasslistsCreated  int `json:"classlists_created"`
}

// GetWorkingStudentDashboard returns working student dashboard data
func (a *App) GetWorkingStudentDashboard() (WorkingStudentDashboard, error) {
	var dashboard WorkingStudentDashboard

	if a.db == nil {
		return dashboard, fmt.Errorf("database not connected")
	}

	// Count students
	a.db.QueryRow(`SELECT COUNT(*) FROM students`).Scan(&dashboard.StudentsRegistered)

	// Count classlists
	a.db.QueryRow(`SELECT COUNT(*) FROM classlist`).Scan(&dashboard.ClasslistsCreated)

	return dashboard, nil
}

// ==============================================================================
// USER PROFILE MANAGEMENT
// ==============================================================================

// UpdateUserPhoto updates a user's profile photo
func (a *App) UpdateUserPhoto(userID int, userRole, photoURL string) error {
	if a.db == nil {
		return fmt.Errorf("database not connected")
	}

	// Update photo in respective table based on role
	var query string
	switch userRole {
	case "admin":
		query = `UPDATE admins SET profile_photo = ? WHERE user_id = ?`
	case "teacher":
		query = `UPDATE teachers SET profile_photo = ? WHERE user_id = ?`
	case "student":
		query = `UPDATE students SET profile_photo = ? WHERE user_id = ?`
	case "working_student":
		query = `UPDATE working_students SET profile_photo = ? WHERE user_id = ?`
	default:
		return fmt.Errorf("invalid user role")
	}

	_, err := a.db.Exec(query, photoURL, userID)
	return err
}

// ChangePassword changes a user's password
func (a *App) ChangePassword(username, oldPassword, newPassword string) error {
	if a.db == nil {
		return fmt.Errorf("database not connected")
	}

	// Verify old password
	var currentPassword string
	query := `SELECT password FROM users WHERE username = ?`
	err := a.db.QueryRow(query, username).Scan(&currentPassword)
	if err != nil {
		return fmt.Errorf("user not found")
	}

	// Simple password check (in production, use proper password hashing)
	if currentPassword != oldPassword {
		return fmt.Errorf("incorrect old password")
	}

	// Update password
	query = `UPDATE users SET password = ? WHERE username = ?`
	_, err = a.db.Exec(query, newPassword, username)
	return err
}

// ==============================================================================
// UTILITY FUNCTIONS
// ==============================================================================

// nullString converts empty string to sql.NullString
func nullString(s string) sql.NullString {
	if s == "" {
		return sql.NullString{Valid: false}
	}
	return sql.NullString{String: s, Valid: true}
}

// nullInt converts 0 or negative values to sql.NullInt64
func nullInt(i int) sql.NullInt64 {
	if i <= 0 {
		return sql.NullInt64{Valid: false}
	}
	return sql.NullInt64{Int64: int64(i), Valid: true}
}

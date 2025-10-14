package main

import (
	"context"
	"database/sql"
	"encoding/csv"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/jung-kurt/gofpdf"
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
		log.Printf("⚠ Database connection failed: %v", err)
		log.Println("⚠ App will start but database features will be unavailable")
	} else {
		a.db = db
		log.Println("✓ Database ready")
	}
}

// ==============================================================================
// AUTHENTICATION & USER MANAGEMENT
// ==============================================================================

// User represents a user in the system
type User struct {
	ID         int     `json:"id"`
	Password   string  `json:"password"`
	Name       string  `json:"name"`
	FirstName  *string `json:"first_name"`
	MiddleName *string `json:"middle_name"`
	LastName   *string `json:"last_name"`
	Gender     *string `json:"gender"`
	Role       string  `json:"role"`
	EmployeeID *string `json:"employee_id"`
	StudentID  *string `json:"student_id"`
	Year       *string `json:"year"`
	Section    *string `json:"section"`
	PhotoURL   *string `json:"photo_url"`
	Created    string  `json:"created"`
	LoginLogID int     `json:"login_log_id"` // Track the login session
}

// Logout logs a user out and records logout time
func (a *App) Logout(userID int) error {
	if a.db == nil {
		return fmt.Errorf("database not connected")
	}

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
	return nil
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
		detailQuery = `SELECT first_name, middle_name, last_name, gender, admin_id, profile_photo FROM admins WHERE user_id = ?`
	case "teacher":
		detailQuery = `SELECT first_name, middle_name, last_name, gender, teacher_id, profile_photo FROM teachers WHERE user_id = ?`
	case "student":
		detailQuery = `SELECT first_name, middle_name, last_name, gender, student_id, year_level, section, profile_photo FROM students WHERE user_id = ?`
	case "working_student":
		detailQuery = `SELECT first_name, middle_name, last_name, gender, student_id, year_level, section, profile_photo FROM working_students WHERE user_id = ?`
	}

	var firstName, middleName, lastName, gender sql.NullString
	var employeeID, studentID, year, section, photoURL sql.NullString

	switch user.Role {
	case "admin", "teacher":
		err = a.db.QueryRow(detailQuery, user.ID).Scan(&firstName, &middleName, &lastName, &gender, &employeeID, &photoURL)
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
			if photoURL.Valid {
				user.PhotoURL = &photoURL.String
			}
		}
	case "student", "working_student":
		err = a.db.QueryRow(detailQuery, user.ID).Scan(&firstName, &middleName, &lastName, &gender, &studentID, &year, &section, &photoURL)
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
			if studentID.Valid {
				user.StudentID = &studentID.String
			}
			if year.Valid {
				user.Year = &year.String
			}
			if section.Valid {
				user.Section = &section.String
			}
			if photoURL.Valid {
				user.PhotoURL = &photoURL.String
			}
		}
	}

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
	return &user, nil
}

// GetUsers returns all users with complete details
func (a *App) GetUsers() ([]User, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	query := `
		SELECT 
			id, username, user_type, created_at,
			first_name, middle_name, last_name, gender,
			employee_id, student_id_str, year_level, section
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
		var firstName, middleName, lastName, gender sql.NullString
		var employeeID, studentID, year, section sql.NullString

		err := rows.Scan(&user.ID, &user.Name, &user.Role, &createdAt,
			&firstName, &middleName, &lastName, &gender,
			&employeeID, &studentID, &year, &section)
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
		if gender.Valid {
			user.Gender = &gender.String
		}
		if employeeID.Valid {
			user.EmployeeID = &employeeID.String
		}
		if studentID.Valid {
			user.StudentID = &studentID.String
		}
		if year.Valid {
			user.Year = &year.String
		}
		if section.Valid {
			user.Section = &section.String
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
			first_name, middle_name, last_name, gender,
			employee_id, student_id_str, year_level, section
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
		var firstName, middleName, lastName, gender sql.NullString
		var employeeID, studentID, year, section sql.NullString

		err := rows.Scan(&user.ID, &user.Name, &user.Role, &createdAt,
			&firstName, &middleName, &lastName, &gender,
			&employeeID, &studentID, &year, &section)
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
		if gender.Valid {
			user.Gender = &gender.String
		}
		if employeeID.Valid {
			user.EmployeeID = &employeeID.String
		}
		if studentID.Valid {
			user.StudentID = &studentID.String
		}
		if year.Valid {
			user.Year = &year.String
		}
		if section.Valid {
			user.Section = &section.String
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
			first_name, middle_name, last_name, gender,
			employee_id, student_id_str, year_level, section
		FROM v_users_complete
		WHERE (
			username LIKE ? OR
			first_name LIKE ? OR
			last_name LIKE ? OR
			middle_name LIKE ? OR
			gender LIKE ? OR
			employee_id LIKE ? OR
			student_id_str LIKE ? OR
			year_level LIKE ? OR
			section LIKE ? OR
			DATE_FORMAT(created_at, '%Y-%m-%d') LIKE ?
		)
	`
	searchPattern := "%" + searchTerm + "%"
	args := []interface{}{searchPattern, searchPattern, searchPattern, searchPattern, searchPattern,
		searchPattern, searchPattern, searchPattern, searchPattern, searchPattern}

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
		var firstName, middleName, lastName, gender sql.NullString
		var employeeID, studentID, year, section sql.NullString

		err := rows.Scan(&user.ID, &user.Name, &user.Role, &createdAt,
			&firstName, &middleName, &lastName, &gender,
			&employeeID, &studentID, &year, &section)
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
		if gender.Valid {
			user.Gender = &gender.String
		}
		if employeeID.Valid {
			user.EmployeeID = &employeeID.String
		}
		if studentID.Valid {
			user.StudentID = &studentID.String
		}
		if year.Valid {
			user.Year = &year.String
		}
		if section.Valid {
			user.Section = &section.String
		}

		users = append(users, user)
	}

	return users, nil
}

// CreateUser creates a new user
func (a *App) CreateUser(password, name, firstName, middleName, lastName, gender, role, employeeID, studentID, year, section string) error {
	if a.db == nil {
		return fmt.Errorf("database not connected")
	}

	// Log the incoming data for debugging
	log.Printf("🔍 CreateUser called - Role: %s, StudentID: %s, Year: %s, Section: %s, Gender: %s", role, studentID, year, section, gender)

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
		if year == "" {
			return fmt.Errorf("year level is required for working student")
		}
		if section == "" {
			return fmt.Errorf("section is required for working student")
		}
	}

	// Insert into users table
	query := `INSERT INTO users (username, password, user_type) VALUES (?, ?, ?)`
	result, err := a.db.Exec(query, username, password, role)
	if err != nil {
		log.Printf("❌ Failed to insert into users table: %v", err)
		return fmt.Errorf("failed to create user account: %w", err)
	}

	userID, _ := result.LastInsertId()
	log.Printf("✅ Created user account with ID: %d", userID)

	// Insert into respective table based on role
	switch role {
	case "admin":
		query = `INSERT INTO admins (user_id, admin_id, first_name, middle_name, last_name, gender) VALUES (?, ?, ?, ?, ?, ?)`
		_, err = a.db.Exec(query, userID, nullString(employeeID), firstName, nullString(middleName), lastName, nullString(gender))
	case "teacher":
		query = `INSERT INTO teachers (user_id, teacher_id, first_name, middle_name, last_name, gender) VALUES (?, ?, ?, ?, ?, ?)`
		_, err = a.db.Exec(query, userID, nullString(employeeID), firstName, nullString(middleName), lastName, nullString(gender))
	case "student":
		query = `INSERT INTO students (user_id, student_id, first_name, middle_name, last_name, gender, year_level, section) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
		_, err = a.db.Exec(query, userID, nullString(studentID), firstName, nullString(middleName), lastName, nullString(gender), nullString(year), nullString(section))
	case "working_student":
		query = `INSERT INTO working_students (user_id, student_id, first_name, middle_name, last_name, gender, year_level, section) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
		log.Printf("📝 Inserting working student - user_id: %d, student_id: %s, name: %s %s, gender: %s, year: %s, section: %s",
			userID, studentID, firstName, lastName, gender, year, section)
		_, err = a.db.Exec(query, userID, nullString(studentID), firstName, nullString(middleName), lastName, nullString(gender), nullString(year), nullString(section))
	}

	if err != nil {
		log.Printf("❌ Failed to insert into %s table: %v", role, err)
		return fmt.Errorf("failed to create %s profile: %w", role, err)
	}

	log.Printf("✅ Successfully created %s: %s %s (ID: %d)", role, firstName, lastName, userID)
	return nil
}

// UpdateUser updates an existing user
func (a *App) UpdateUser(id int, name, firstName, middleName, lastName, gender, role, employeeID, studentID, year, section string) error {
	if a.db == nil {
		return fmt.Errorf("database not connected")
	}

	// Update in respective table based on role
	var query string
	var err error
	switch role {
	case "admin":
		query = `UPDATE admins SET first_name = ?, middle_name = ?, last_name = ?, gender = ?, admin_id = ? WHERE user_id = ?`
		_, err = a.db.Exec(query, firstName, nullString(middleName), lastName, nullString(gender), nullString(employeeID), id)
	case "teacher":
		query = `UPDATE teachers SET first_name = ?, middle_name = ?, last_name = ?, gender = ?, teacher_id = ? WHERE user_id = ?`
		_, err = a.db.Exec(query, firstName, nullString(middleName), lastName, nullString(gender), nullString(employeeID), id)
	case "student":
		query = `UPDATE students SET first_name = ?, middle_name = ?, last_name = ?, gender = ?, student_id = ?, year_level = ?, section = ? WHERE user_id = ?`
		_, err = a.db.Exec(query, firstName, nullString(middleName), lastName, nullString(gender), nullString(studentID), nullString(year), nullString(section), id)
	case "working_student":
		query = `UPDATE working_students SET first_name = ?, middle_name = ?, last_name = ?, gender = ?, student_id = ?, year_level = ?, section = ? WHERE user_id = ?`
		_, err = a.db.Exec(query, firstName, nullString(middleName), lastName, nullString(gender), nullString(studentID), nullString(year), nullString(section), id)
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

	query := `
		SELECT 
			id, user_id, user_type, pc_number, 
			login_time, logout_time, full_name
		FROM v_login_logs_complete 
		WHERE user_id = ?
		ORDER BY login_time DESC 
		LIMIT 100
	`
	rows, err := a.db.Query(query, userID)
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

// ==============================================================================
// FEEDBACK
// ==============================================================================

// Feedback represents equipment feedback
type Feedback struct {
	ID                 int     `json:"id"`
	StudentID          int     `json:"student_id"`
	StudentIDStr       string  `json:"student_id_str"`
	FirstName          string  `json:"first_name"`
	MiddleName         *string `json:"middle_name"`
	LastName           string  `json:"last_name"`
	StudentName        string  `json:"student_name"`
	PCNumber           string  `json:"pc_number"`
	EquipmentCondition string  `json:"equipment_condition"`
	MonitorCondition   string  `json:"monitor_condition"`
	KeyboardCondition  string  `json:"keyboard_condition"`
	MouseCondition     string  `json:"mouse_condition"`
	Comments           *string `json:"comments"`
	DateSubmitted      string  `json:"date_submitted"`
}

// GetFeedback returns all feedback
func (a *App) GetFeedback() ([]Feedback, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	query := `
		SELECT 
			f.id, 
			f.student_id, 
			COALESCE(s.student_id, ws.student_id, 'N/A') as student_id_str,
			f.first_name, 
			f.middle_name, 
			f.last_name, 
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
			f.first_name, 
			f.middle_name, 
			f.last_name, 
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

	// Parse user name to get first, middle, and last name
	// Assuming format: "LastName, FirstName MiddleName" or "LastName, FirstName"
	var firstName, middleName, lastName string
	// For now, use the userName as-is and split it
	// In production, you might want to get this from the user record
	lastName = userName // Simplified - you may want to parse this properly
	firstName = ""

	// Get user details from database
	var userRole string
	err = a.db.QueryRow("SELECT user_type FROM users WHERE id = ?", userID).Scan(&userRole)
	if err == nil {
		// Get name details based on role
		var query string
		switch userRole {
		case "student":
			query = "SELECT first_name, middle_name, last_name FROM students WHERE user_id = ?"
		case "working_student":
			query = "SELECT first_name, middle_name, last_name FROM working_students WHERE user_id = ?"
		default:
			query = ""
		}

		if query != "" {
			var middleNameNull sql.NullString
			err = a.db.QueryRow(query, userID).Scan(&firstName, &middleNameNull, &lastName)
			if err == nil && middleNameNull.Valid {
				middleName = middleNameNull.String
			}
		}
	}

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
	query := `INSERT INTO feedback (student_id, first_name, middle_name, last_name, pc_number, 
			  equipment_condition, monitor_condition, keyboard_condition, mouse_condition, 
			  comments, date_submitted) 
			  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`

	_, err = a.db.Exec(query, userID, firstName, nullString(middleName), lastName, pcNumber,
		equipmentCondition, monitorCondition, keyboardCondition, mouseCondition, nullString(combinedComments))

	if err != nil {
		log.Printf("Failed to save equipment feedback: %v", err)
		return fmt.Errorf("failed to save feedback: %w", err)
	}

	log.Printf("✓ Equipment feedback saved for user %d", userID)
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
	YearLevel      *string `json:"year_level,omitempty"`
	Section        *string `json:"section,omitempty"`
	EnrollmentDate string  `json:"enrollment_date"`
	Status         string  `json:"status"`
}

// ClassStudent represents a student (used for enrollment operations)
type ClassStudent struct {
	ID         int     `json:"id"`
	StudentID  string  `json:"student_id"`
	FirstName  string  `json:"first_name"`
	MiddleName *string `json:"middle_name"`
	LastName   string  `json:"last_name"`
	YearLevel  *string `json:"year_level"`
	Section    *string `json:"section"`
	ClassID    *int    `json:"class_id,omitempty"`
	IsEnrolled bool    `json:"is_enrolled"`
}

// Attendance represents an attendance record
type Attendance struct {
	ID          int     `json:"id"`
	ClasslistID int     `json:"classlist_id"`
	ClassID     int     `json:"class_id"`
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

// GetTeacherClasses returns all classes for a specific teacher
func (a *App) GetTeacherClasses(teacherID int) ([]CourseClass, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	query := `SELECT * FROM v_teacher_classes WHERE teacher_id = ? ORDER BY subject_code, year_level, section`
	rows, err := a.db.Query(query, teacherID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var classes []CourseClass
	for rows.Next() {
		var class CourseClass
		var schedule, room, yearLevel, section, semester, schoolYear sql.NullString
		err := rows.Scan(
			&class.ID, &class.SubjectID, &class.SubjectCode, &class.SubjectName,
			&class.TeacherID, &class.TeacherName,
			&schedule, &room, &yearLevel, &section, &semester, &schoolYear,
			&class.EnrolledCount, &class.IsActive,
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
		classes = append(classes, class)
	}

	return classes, nil
}

// GetAllClasses returns all active classes
func (a *App) GetAllClasses() ([]CourseClass, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	query := `SELECT * FROM v_teacher_classes WHERE is_active = TRUE ORDER BY subject_code, year_level, section`
	rows, err := a.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var classes []CourseClass
	for rows.Next() {
		var class CourseClass
		var schedule, room, yearLevel, section, semester, schoolYear sql.NullString
		err := rows.Scan(
			&class.ID, &class.SubjectID, &class.SubjectCode, &class.SubjectName,
			&class.TeacherID, &class.TeacherName,
			&schedule, &room, &yearLevel, &section, &semester, &schoolYear,
			&class.EnrolledCount, &class.IsActive,
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
			vcl.year_level, vcl.section, vcl.enrollment_status,
			cl.enrollment_date
		FROM v_classlist_complete vcl
		JOIN classlist cl ON vcl.classlist_id = cl.id
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
		var middleName, yearLevel, section sql.NullString
		var enrollmentDate time.Time
		err := rows.Scan(
			&student.ID, &student.ClassID, &student.StudentID, &student.StudentCode,
			&student.FirstName, &middleName, &student.LastName,
			&yearLevel, &section, &student.Status,
			&enrollmentDate,
		)
		if err != nil {
			continue
		}
		if middleName.Valid {
			student.MiddleName = &middleName.String
		}
		if yearLevel.Valid {
			student.YearLevel = &yearLevel.String
		}
		if section.Valid {
			student.Section = &section.String
		}
		student.EnrollmentDate = enrollmentDate.Format("2006-01-02")
		students = append(students, student)
	}

	return students, nil
}

// CreateSubject creates a new subject (or updates if exists)
func (a *App) CreateSubject(code, name string, teacherID int, description string) error {
	if a.db == nil {
		return fmt.Errorf("database not connected")
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
	_, err := a.db.Exec(query, code, name, teacherID, nullString(description))
	if err != nil {
		log.Printf("⚠ Failed to create/update subject: %v", err)
		return err
	}
	log.Printf("✓ Subject created/updated: %s - %s", code, name)
	return nil
}

// CreateClass creates a new class instance (by working student)
func (a *App) CreateClass(subjectID, teacherID int, schedule, room, yearLevel, section, semester, schoolYear string, createdBy int) (int, error) {
	if a.db == nil {
		return 0, fmt.Errorf("database not connected")
	}

	query := `
		INSERT INTO classes (subject_id, teacher_id, schedule, room, year_level, section, semester, school_year, created_by, is_active)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
	`
	result, err := a.db.Exec(
		query,
		subjectID, teacherID,
		nullString(schedule), nullString(room),
		nullString(yearLevel), nullString(section),
		nullString(semester), nullString(schoolYear),
		nullInt(createdBy),
	)
	if err != nil {
		log.Printf("⚠ Failed to create class: %v", err)
		return 0, err
	}

	classID, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}

	log.Printf("✓ Class created: ID=%d, Subject=%d, Teacher=%d", classID, subjectID, teacherID)
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
		INSERT INTO classlist (class_id, student_id, enrolled_by, status)
		VALUES (?, ?, ?, 'active')
		ON DUPLICATE KEY UPDATE status = 'active', updated_at = CURRENT_TIMESTAMP
	`
	_, err := a.db.Exec(query, classID, studentID, nullInt(enrolledBy))
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
		INSERT INTO classlist (class_id, student_id, enrolled_by, status)
		VALUES (?, ?, ?, 'active')
		ON DUPLICATE KEY UPDATE status = 'active', updated_at = CURRENT_TIMESTAMP
	`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, studentID := range studentIDs {
		_, err = stmt.Exec(classID, studentID, nullInt(enrolledBy))
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
			s.user_id as id, s.student_id, s.first_name, s.middle_name, s.last_name, s.year_level, s.section,
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
			ws.user_id as id, ws.student_id, ws.first_name, ws.middle_name, ws.last_name, ws.year_level, ws.section,
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
		var middleName, yearLevel, section sql.NullString
		err := rows.Scan(&student.ID, &student.StudentID, &student.FirstName, &middleName, &student.LastName, &yearLevel, &section, &student.IsEnrolled)
		if err != nil {
			continue
		}
		if middleName.Valid {
			student.MiddleName = &middleName.String
		}
		if yearLevel.Valid {
			student.YearLevel = &yearLevel.String
		}
		if section.Valid {
			student.Section = &section.String
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
			s.year_level, s.section,
			EXISTS(
				SELECT 1 FROM classlist cl 
				WHERE cl.student_id = s.user_id AND cl.class_id = ? AND cl.status = 'active'
			) as is_enrolled
		FROM students s
		
		UNION ALL
		
		SELECT 
			ws.user_id as id, ws.student_id, ws.first_name, ws.middle_name, ws.last_name,
			ws.year_level, ws.section,
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
		var middleName, yearLevel, section sql.NullString
		err := rows.Scan(&student.ID, &student.StudentID, &student.FirstName, &middleName,
			&student.LastName, &yearLevel, &section, &student.IsEnrolled)
		if err != nil {
			continue
		}
		if middleName.Valid {
			student.MiddleName = &middleName.String
		}
		if yearLevel.Valid {
			student.YearLevel = &yearLevel.String
		}
		if section.Valid {
			student.Section = &section.String
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
			t.id, t.user_id, t.teacher_id, t.first_name, t.middle_name, t.last_name, t.gender
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
		var middleName, gender, employeeID sql.NullString
		var dbID int
		err := rows.Scan(&dbID, &teacher.ID, &employeeID, &teacher.FirstName, &middleName, &teacher.LastName, &gender)
		if err != nil {
			continue
		}
		if middleName.Valid {
			teacher.MiddleName = &middleName.String
		}
		if gender.Valid {
			teacher.Gender = &gender.String
		}
		if employeeID.Valid {
			teacher.EmployeeID = &employeeID.String
		}
		teacher.Role = "teacher"
		teachers = append(teachers, teacher)
	}

	return teachers, nil
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
	query := `SELECT id, class_id, date, student_id, time_in, time_out, status 
			  FROM attendance WHERE student_id = ? ORDER BY date DESC LIMIT 100`
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

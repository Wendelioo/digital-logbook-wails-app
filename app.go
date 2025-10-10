package main

import (
	"context"
	"database/sql"
	"encoding/csv"
	"errors"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/jung-kurt/gofpdf/v2"
)

// App struct
type App struct {
	ctx context.Context
	db  *sql.DB
}

// User roles
const (
	RoleAdmin          = "admin"
	RoleTeacher        = "teacher"
	RoleStudent        = "student"
	RoleWorkingStudent = "working_student"
)

// Attendance status
const (
	StatusPresent = "Present"
	StatusAbsent  = "Absent"
	StatusSeatIn  = "Seat-in"
)

// Password functions (WARNING: Hashing disabled for development!)
func hashPassword(password string) (string, error) {
	// WARNING: Password hashing disabled - storing plain text passwords!
	// This is INSECURE and should only be used for development/testing
	return password, nil
}

func verifyPassword(password, storedPassword string) bool {
	// WARNING: Password hashing disabled - comparing plain text passwords!
	// This is INSECURE and should only be used for development/testing
	return password == storedPassword
}

// GetHostname returns the computer's hostname
func (a *App) GetHostname() (string, error) {
	hostname, err := os.Hostname()
	if err != nil {
		log.Printf("Failed to get hostname: %v", err)
		return "Unknown", err
	}
	return hostname, nil
}

// Helper function to check if a string contains a substring
func contains(s, substr string) bool {
	return strings.Contains(s, substr)
}

// Database models
type User struct {
	ID         int    `json:"id"`
	Password   string `json:"password"`
	Name       string `json:"name"`
	FirstName  string `json:"first_name,omitempty"`
	MiddleName string `json:"middle_name,omitempty"`
	LastName   string `json:"last_name,omitempty"`
	Gender     string `json:"gender,omitempty"`
	Role       string `json:"role"`
	EmployeeID string `json:"employee_id,omitempty"`
	StudentID  string `json:"student_id,omitempty"`
	Year       string `json:"year,omitempty"`
	PhotoURL   string `json:"photo_url,omitempty"`
	Created    string `json:"created"`
}

// Classlist represents a class/subject in the new schema
type Classlist struct {
	ID              int    `json:"id"`
	SubjectCode     string `json:"subject_code"`
	SubjectTitle    string `json:"subject_title"`
	AssignedTeacher string `json:"assigned_teacher"`
	Schedule        string `json:"schedule"`
	Room            string `json:"room"`
	CreatedBy       int    `json:"created_by"`
	CreatedAt       string `json:"created_at"`
	UpdatedAt       string `json:"updated_at"`
}

// ClassStudent represents a student enrolled in a class
type ClassStudent struct {
	ID         int    `json:"id"`
	ClassID    int    `json:"class_id"`
	StudentID  int    `json:"student_id"`
	FirstName  string `json:"first_name"`
	MiddleName string `json:"middle_name"`
	LastName   string `json:"last_name"`
}

// Attendance represents attendance record for a student in a class
type Attendance struct {
	ID        int    `json:"id"`
	ClassID   int    `json:"class_id"`
	Date      string `json:"date"`
	StudentID int    `json:"student_id"`
	TimeIn    string `json:"time_in,omitempty"`
	TimeOut   string `json:"time_out,omitempty"`
	Status    string `json:"status"` // Present, Absent, Late, Excused
}

// LoginLog represents a user login/logout record
type LoginLog struct {
	ID         int    `json:"id"`
	UserID     int    `json:"user_id"`
	UserName   string `json:"user_name"` // For display purposes
	UserType   string `json:"user_type"`
	PCNumber   string `json:"pc_number,omitempty"`
	LoginTime  string `json:"login_time"`
	LogoutTime string `json:"logout_time,omitempty"`
}

// Feedback represents equipment condition feedback from students
type Feedback struct {
	ID                 int    `json:"id"`
	StudentID          int    `json:"student_id"`
	StudentIDStr       string `json:"student_id_str"` // For display
	FirstName          string `json:"first_name"`
	MiddleName         string `json:"middle_name,omitempty"`
	LastName           string `json:"last_name"`
	StudentName        string `json:"student_name"` // Computed field
	PCNumber           string `json:"pc_number"`
	EquipmentCondition string `json:"equipment_condition"` // Good, Minor Issue, Needs Repair, Not Working
	MonitorCondition   string `json:"monitor_condition"`   // Good, Flickering, No Display, Other
	KeyboardCondition  string `json:"keyboard_condition"`  // Good, Some Keys Not Working, Sticky Keys, Other
	MouseCondition     string `json:"mouse_condition"`     // Good, Not Working, Lagging, Other
	Comments           string `json:"comments,omitempty"`
	DateSubmitted      string `json:"date_submitted"`
}

// Legacy Subject model - kept for backward compatibility with old functions
type Subject struct {
	ID      int    `json:"id"`
	Code    string `json:"code"`
	Name    string `json:"name"`
	Teacher string `json:"teacher"`
	Room    string `json:"room"`
}

// Dashboard data structures
type AdminDashboard struct {
	TotalStudents   int `json:"total_students"`
	TotalTeachers   int `json:"total_teachers"`
	WorkingStudents int `json:"working_students"`
	RecentLogins    int `json:"recent_logins"`
}

type TeacherDashboard struct {
	Subjects   []Subject    `json:"subjects"`
	Attendance []Attendance `json:"attendance"`
}

type StudentDashboard struct {
	Attendance []Attendance `json:"attendance"`
	TodayLog   *Attendance  `json:"today_log"`
}

type WorkingStudentDashboard struct {
	StudentsRegistered int `json:"students_registered"`
	ClasslistsCreated  int `json:"classlists_created"`
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// Initialize database
	if err := a.initDB(); err != nil {
		log.Fatalf("Failed to initialize database: %v\nPlease ensure MySQL is running and configured correctly.", err)
	}
}

// Database initialization
func (a *App) initDB() error {
	// Get database configuration
	config := GetDatabaseConfig()

	// MySQL database connection
	// Make sure MySQL is running and the database exists
	db, err := sql.Open("mysql", config.GetConnectionString())
	if err != nil {
		return fmt.Errorf("failed to connect to MySQL database: %v", err)
	}

	// Test the connection
	if err := db.Ping(); err != nil {
		return fmt.Errorf("failed to ping MySQL database: %v. Make sure MySQL is running and the database '%s' exists", err, config.Database)
	}

	a.db = db

	// Set connection pool settings
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(25)
	db.SetConnMaxLifetime(5 * time.Minute)

	// Create tables
	if err := a.createTables(); err != nil {
		log.Printf("Warning: Error creating tables: %v", err)
		// Continue anyway, tables might already exist
	}

	// TEMPORARY: Create default admin account if no users exist
	var userCount int
	err = db.QueryRow("SELECT COUNT(*) FROM users").Scan(&userCount)
	if err == nil && userCount == 0 {
		log.Println("No users found. Creating default admin account...")
		// Create admin with Employee ID as both username and password
		if err := a.CreateAdmin(1, "Administrator", "System", ""); err != nil {
			log.Printf("Warning: Could not create default admin: %v", err)
		} else {
			log.Println("✅ Default admin created: Employee ID = 1, Password = 1")
			log.Println("⚠️  CHANGE THIS PASSWORD AFTER FIRST LOGIN!")
		}
	}

	log.Println("Database initialization completed successfully")
	return nil
}

func (a *App) createTables() error {
	// 1. Users table (login credentials)
	_, err := a.db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id INT AUTO_INCREMENT PRIMARY KEY,
			username VARCHAR(255) NOT NULL UNIQUE,
			password VARCHAR(255) NOT NULL,
			user_type ENUM('student', 'working_student', 'teacher', 'admin') NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			INDEX idx_username (username),
			INDEX idx_user_type (user_type)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
	`)
	if err != nil {
		return err
	}

	// 2. Students table
	_, err = a.db.Exec(`
		CREATE TABLE IF NOT EXISTS students (
			id INT AUTO_INCREMENT PRIMARY KEY,
			student_id INT NOT NULL UNIQUE,
			first_name VARCHAR(255) NOT NULL,
			middle_name VARCHAR(255),
			last_name VARCHAR(255) NOT NULL,
			year_level VARCHAR(255),
			section VARCHAR(255),
			profile_photo VARCHAR(255),
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			INDEX idx_student_id (student_id)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
	`)
	if err != nil {
		return err
	}

	// 3. Working students table
	_, err = a.db.Exec(`
		CREATE TABLE IF NOT EXISTS working_students (
			id INT AUTO_INCREMENT PRIMARY KEY,
			student_id INT NOT NULL UNIQUE,
			first_name VARCHAR(255) NOT NULL,
			middle_name VARCHAR(255),
			last_name VARCHAR(255) NOT NULL,
			year_level VARCHAR(255),
			section VARCHAR(255),
			profile_photo VARCHAR(255),
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			INDEX idx_student_id (student_id)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
	`)
	if err != nil {
		return err
	}

	// 4. Teachers table
	_, err = a.db.Exec(`
		CREATE TABLE IF NOT EXISTS teachers (
			id INT AUTO_INCREMENT PRIMARY KEY,
			teacher_id INT NOT NULL UNIQUE,
			first_name VARCHAR(255) NOT NULL,
			middle_name VARCHAR(255),
			last_name VARCHAR(255) NOT NULL,
			profile_photo VARCHAR(255),
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			INDEX idx_teacher_id (teacher_id)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
	`)
	if err != nil {
		return err
	}

	// 5. Admins table
	_, err = a.db.Exec(`
		CREATE TABLE IF NOT EXISTS admins (
			id INT AUTO_INCREMENT PRIMARY KEY,
			admin_id INT NOT NULL UNIQUE,
			first_name VARCHAR(255) NOT NULL,
			middle_name VARCHAR(255),
			last_name VARCHAR(255) NOT NULL,
			profile_photo VARCHAR(255),
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			INDEX idx_admin_id (admin_id)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
	`)
	if err != nil {
		return err
	}

	// 6. Classlist table
	_, err = a.db.Exec(`
		CREATE TABLE IF NOT EXISTS classlist (
			id INT AUTO_INCREMENT PRIMARY KEY,
			subject_code VARCHAR(255) NOT NULL,
			subject_title VARCHAR(255) NOT NULL,
			assigned_teacher VARCHAR(255),
			schedule VARCHAR(255),
			room VARCHAR(255),
			created_by INT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			FOREIGN KEY (created_by) REFERENCES working_students(id) ON DELETE SET NULL,
			INDEX idx_subject_code (subject_code),
			INDEX idx_created_by (created_by)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
	`)
	if err != nil {
		return err
	}

	// 7. Class students table
	_, err = a.db.Exec(`
		CREATE TABLE IF NOT EXISTS class_students (
			id INT AUTO_INCREMENT PRIMARY KEY,
			class_id INT NOT NULL,
			student_id INT NOT NULL,
			first_name VARCHAR(255) NOT NULL,
			middle_name VARCHAR(255),
			last_name VARCHAR(255) NOT NULL,
			FOREIGN KEY (class_id) REFERENCES classlist(id) ON DELETE CASCADE,
			INDEX idx_class_id (class_id),
			INDEX idx_student_id (student_id)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
	`)
	if err != nil {
		return err
	}

	// 8. Attendance table
	_, err = a.db.Exec(`
		CREATE TABLE IF NOT EXISTS attendance (
			id INT AUTO_INCREMENT PRIMARY KEY,
			class_id INT NOT NULL,
			date DATE NOT NULL,
			student_id INT NOT NULL,
			time_in TIME,
			time_out TIME,
			status ENUM('Present', 'Absent', 'Late', 'Excused') NOT NULL DEFAULT 'Absent',
			FOREIGN KEY (class_id) REFERENCES classlist(id) ON DELETE CASCADE,
			INDEX idx_class_id (class_id),
			INDEX idx_date (date),
			INDEX idx_student_id (student_id),
			INDEX idx_status (status)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
	`)
	if err != nil {
		return err
	}

	// 9. Login logs table
	_, err = a.db.Exec(`
		CREATE TABLE IF NOT EXISTS login_logs (
			id INT AUTO_INCREMENT PRIMARY KEY,
			user_id INT NOT NULL,
			user_type ENUM('student', 'working_student', 'teacher', 'admin') NOT NULL,
			pc_number VARCHAR(255),
			login_time DATETIME NOT NULL,
			logout_time DATETIME,
			INDEX idx_user_id (user_id),
			INDEX idx_user_type (user_type),
			INDEX idx_login_time (login_time)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
	`)
	if err != nil {
		return err
	}

	// 10. Feedback table
	_, err = a.db.Exec(`
		CREATE TABLE IF NOT EXISTS feedback (
			id INT AUTO_INCREMENT PRIMARY KEY,
			student_id INT NOT NULL,
			first_name VARCHAR(255) NOT NULL,
			middle_name VARCHAR(255),
			last_name VARCHAR(255) NOT NULL,
			pc_number VARCHAR(255),
			equipment_condition ENUM('Good', 'Minor Issue', 'Needs Repair', 'Not Working') NOT NULL,
			monitor_condition ENUM('Good', 'Flickering', 'No Display', 'Other') NOT NULL,
			keyboard_condition ENUM('Good', 'Some Keys Not Working', 'Sticky Keys', 'Other') NOT NULL,
			mouse_condition ENUM('Good', 'Not Working', 'Lagging', 'Other') NOT NULL,
			comments TEXT,
			date_submitted DATETIME NOT NULL,
			INDEX idx_student_id (student_id),
			INDEX idx_pc_number (pc_number),
			INDEX idx_date_submitted (date_submitted)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
	`)
	if err != nil {
		return err
	}

	// Legacy tables for backward compatibility (if still needed)
	// Subjects table
	_, err = a.db.Exec(`
		CREATE TABLE IF NOT EXISTS subjects (
			id INT AUTO_INCREMENT PRIMARY KEY,
			code VARCHAR(50) UNIQUE NOT NULL,
			name VARCHAR(255) NOT NULL,
			teacher VARCHAR(255) NOT NULL,
			room VARCHAR(100) NOT NULL
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
	`)
	if err != nil {
		return err
	}

	// Classlists table (legacy, may be replaced by classlist)
	_, err = a.db.Exec(`
		CREATE TABLE IF NOT EXISTS classlists (
			id INT AUTO_INCREMENT PRIMARY KEY,
			subject_id INT,
			students TEXT,
			created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
	`)
	if err != nil {
		return err
	}

	return nil
}

// Authentication methods
// Deprecated: Use LoginByEmployeeID or LoginByStudentID instead
func (a *App) Login(username, password string) (User, error) {
	// This function is deprecated and should not be used
	// Use role-specific login functions instead
	return User{}, errors.New("deprecated login method - use LoginByEmployeeID or LoginByStudentID")
}

// LoginByEmployeeID authenticates admin and teacher users using Employee ID
func (a *App) LoginByEmployeeID(employeeID int, password string) (User, error) {
	var user User
	var hashedPassword string
	var userType string

	// Check users table for credentials
	err := a.db.QueryRow(
		"SELECT password, user_type FROM users WHERE username = ? AND user_type IN (?, ?)",
		fmt.Sprintf("%d", employeeID), RoleAdmin, RoleTeacher,
	).Scan(&hashedPassword, &userType)

	if err != nil {
		return User{}, fmt.Errorf("invalid credentials")
	}

	// Verify password
	if !verifyPassword(password, hashedPassword) {
		return User{}, fmt.Errorf("invalid credentials")
	}

	// Get user profile from appropriate table
	var employeeIDStr string
	if userType == RoleAdmin {
		err = a.db.QueryRow(
			"SELECT id, admin_id, first_name, middle_name, last_name, profile_photo FROM admins WHERE admin_id = ?",
			employeeID,
		).Scan(&user.ID, &employeeIDStr, &user.FirstName, &user.MiddleName, &user.LastName, &user.PhotoURL)
	} else if userType == RoleTeacher {
		err = a.db.QueryRow(
			"SELECT id, teacher_id, first_name, middle_name, last_name, profile_photo FROM teachers WHERE teacher_id = ?",
			employeeID,
		).Scan(&user.ID, &employeeIDStr, &user.FirstName, &user.MiddleName, &user.LastName, &user.PhotoURL)
	}

	if err != nil {
		return User{}, fmt.Errorf("user profile not found")
	}

	// Set additional fields
	user.EmployeeID = employeeIDStr
	user.Role = userType
	user.Name = user.LastName + ", " + user.FirstName
	if user.MiddleName != "" {
		user.Name += " " + user.MiddleName
	}

	// Get hostname for PC identification
	hostname, err := a.GetHostname()
	if err != nil {
		hostname = "Unknown"
	}

	// Log the login with hostname
	if err := a.RecordLogin(employeeID, user.Name, user.Role, hostname); err != nil {
		log.Printf("Warning: Failed to log login for user %d: %v", employeeID, err)
	}

	return user, nil
}

// LoginByStudentID authenticates students and working students using student ID
func (a *App) LoginByStudentID(studentID int, password string) (User, error) {
	var user User
	var hashedPassword string
	var userType string

	// Check users table for credentials
	err := a.db.QueryRow(
		"SELECT password, user_type FROM users WHERE username = ? AND user_type IN (?, ?)",
		fmt.Sprintf("%d", studentID), RoleStudent, RoleWorkingStudent,
	).Scan(&hashedPassword, &userType)

	if err != nil {
		return User{}, fmt.Errorf("invalid credentials")
	}

	// Verify password
	if !verifyPassword(password, hashedPassword) {
		return User{}, fmt.Errorf("invalid credentials")
	}

	// Get user profile from appropriate table
	var studentIDStr string
	if userType == RoleStudent {
		err = a.db.QueryRow(
			"SELECT id, student_id, first_name, middle_name, last_name, year_level, section, profile_photo FROM students WHERE student_id = ?",
			studentID,
		).Scan(&user.ID, &studentIDStr, &user.FirstName, &user.MiddleName, &user.LastName, &user.Year, &user.Gender, &user.PhotoURL)
	} else if userType == RoleWorkingStudent {
		err = a.db.QueryRow(
			"SELECT id, student_id, first_name, middle_name, last_name, year_level, section, profile_photo FROM working_students WHERE student_id = ?",
			studentID,
		).Scan(&user.ID, &studentIDStr, &user.FirstName, &user.MiddleName, &user.LastName, &user.Year, &user.Gender, &user.PhotoURL)
	}

	if err != nil {
		return User{}, fmt.Errorf("user profile not found")
	}

	// Set additional fields
	user.StudentID = studentIDStr
	user.Role = userType
	user.Name = user.LastName + ", " + user.FirstName
	if user.MiddleName != "" {
		user.Name += " " + user.MiddleName
	}

	// Get hostname for PC identification
	hostname, err := a.GetHostname()
	if err != nil {
		hostname = "Unknown"
	}

	// Log the login with hostname
	if err := a.RecordLogin(studentID, user.Name, user.Role, hostname); err != nil {
		log.Printf("Warning: Failed to log login for user %d: %v", studentID, err)
	}

	return user, nil
}

func (a *App) ChangePassword(username, oldPassword, newPassword string) error {
	// Verify old password
	var currentHashedPassword string
	err := a.db.QueryRow("SELECT password FROM users WHERE username = ?", username).Scan(&currentHashedPassword)
	if err != nil {
		return fmt.Errorf("user not found")
	}

	if !verifyPassword(oldPassword, currentHashedPassword) {
		return fmt.Errorf("incorrect current password")
	}

	// Hash new password
	newHashedPassword, err := hashPassword(newPassword)
	if err != nil {
		return fmt.Errorf("failed to hash new password")
	}

	// Update password
	_, err = a.db.Exec("UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ?", newHashedPassword, username)
	return err
}

// User management methods
func (a *App) GetUsers() ([]User, error) {
	var users []User

	// Get all students
	studentsQuery := `
		SELECT s.id, s.student_id, s.first_name, s.middle_name, s.last_name, s.year_level, s.section, s.profile_photo, s.created_at
		FROM students s
		ORDER BY s.created_at DESC
	`
	rows, err := a.db.Query(studentsQuery)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var user User
		err := rows.Scan(&user.ID, &user.StudentID, &user.FirstName, &user.MiddleName, &user.LastName, &user.Year, &user.Gender, &user.PhotoURL, &user.Created)
		if err != nil {
			rows.Close()
			return nil, err
		}
		user.Role = RoleStudent
		user.Name = user.LastName + ", " + user.FirstName
		if user.MiddleName != "" {
			user.Name += " " + user.MiddleName
		}
		users = append(users, user)
	}
	rows.Close()

	// Get all working students
	workingStudentsQuery := `
		SELECT ws.id, ws.student_id, ws.first_name, ws.middle_name, ws.last_name, ws.year_level, ws.section, ws.profile_photo, ws.created_at
		FROM working_students ws
		ORDER BY ws.created_at DESC
	`
	rows, err = a.db.Query(workingStudentsQuery)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var user User
		err := rows.Scan(&user.ID, &user.StudentID, &user.FirstName, &user.MiddleName, &user.LastName, &user.Year, &user.Gender, &user.PhotoURL, &user.Created)
		if err != nil {
			rows.Close()
			return nil, err
		}
		user.Role = RoleWorkingStudent
		user.Name = user.LastName + ", " + user.FirstName
		if user.MiddleName != "" {
			user.Name += " " + user.MiddleName
		}
		users = append(users, user)
	}
	rows.Close()

	// Get all teachers
	teachersQuery := `
		SELECT t.id, t.teacher_id, t.first_name, t.middle_name, t.last_name, t.profile_photo, t.created_at
		FROM teachers t
		ORDER BY t.created_at DESC
	`
	rows, err = a.db.Query(teachersQuery)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var user User
		err := rows.Scan(&user.ID, &user.EmployeeID, &user.FirstName, &user.MiddleName, &user.LastName, &user.PhotoURL, &user.Created)
		if err != nil {
			rows.Close()
			return nil, err
		}
		user.Role = RoleTeacher
		user.Name = user.LastName + ", " + user.FirstName
		if user.MiddleName != "" {
			user.Name += " " + user.MiddleName
		}
		users = append(users, user)
	}
	rows.Close()

	// Get all admins
	adminsQuery := `
		SELECT a.id, a.admin_id, a.first_name, a.middle_name, a.last_name, a.profile_photo, a.created_at
		FROM admins a
		ORDER BY a.created_at DESC
	`
	rows, err = a.db.Query(adminsQuery)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var user User
		err := rows.Scan(&user.ID, &user.EmployeeID, &user.FirstName, &user.MiddleName, &user.LastName, &user.PhotoURL, &user.Created)
		if err != nil {
			rows.Close()
			return nil, err
		}
		user.Role = RoleAdmin
		user.Name = user.LastName + ", " + user.FirstName
		if user.MiddleName != "" {
			user.Name += " " + user.MiddleName
		}
		users = append(users, user)
	}
	rows.Close()

	return users, nil
}

func (a *App) CreateUser(password, name, firstName, middleName, lastName, gender, role, employeeID, studentID, year string) error {
	// Hash password
	hashedPassword, err := hashPassword(password)
	if err != nil {
		return fmt.Errorf("failed to hash password: %v", err)
	}

	_, err = a.db.Exec(
		"INSERT INTO users (password, name, first_name, middle_name, last_name, gender, role, employee_id, student_id, year) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
		hashedPassword, name, firstName, middleName, lastName, gender, role, employeeID, studentID, year,
	)
	return err
}

// New user creation methods with detailed fields
func (a *App) CreateWorkingStudent(studentID int, lastName, firstName, middleName, gender string) error {
	password := fmt.Sprintf("%d", studentID)

	// Hash password
	hashedPassword, err := hashPassword(password)
	if err != nil {
		return fmt.Errorf("failed to hash password: %v", err)
	}

	// Start transaction
	tx, err := a.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Insert into users table
	_, err = tx.Exec(
		"INSERT INTO users (username, password, user_type) VALUES (?, ?, ?)",
		fmt.Sprintf("%d", studentID), hashedPassword, RoleWorkingStudent,
	)
	if err != nil {
		return fmt.Errorf("failed to create user credentials: %v", err)
	}

	// Insert into working_students table
	_, err = tx.Exec(
		"INSERT INTO working_students (student_id, first_name, middle_name, last_name, section) VALUES (?, ?, ?, ?, ?)",
		studentID, firstName, middleName, lastName, gender,
	)
	if err != nil {
		return fmt.Errorf("failed to create working student profile: %v", err)
	}

	return tx.Commit()
}

func (a *App) CreateTeacher(employeeID int, lastName, firstName, middleName, gender string) error {
	password := fmt.Sprintf("%d", employeeID)

	// Hash password
	hashedPassword, err := hashPassword(password)
	if err != nil {
		return fmt.Errorf("failed to hash password: %v", err)
	}

	// Start transaction
	tx, err := a.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Insert into users table
	_, err = tx.Exec(
		"INSERT INTO users (username, password, user_type) VALUES (?, ?, ?)",
		fmt.Sprintf("%d", employeeID), hashedPassword, RoleTeacher,
	)
	if err != nil {
		return fmt.Errorf("failed to create user credentials: %v", err)
	}

	// Insert into teachers table
	_, err = tx.Exec(
		"INSERT INTO teachers (teacher_id, first_name, middle_name, last_name) VALUES (?, ?, ?, ?)",
		employeeID, firstName, middleName, lastName,
	)
	if err != nil {
		return fmt.Errorf("failed to create teacher profile: %v", err)
	}

	return tx.Commit()
}

func (a *App) CreateAdmin(employeeID int, lastName, firstName, middleName string) error {
	password := fmt.Sprintf("%d", employeeID)

	// Hash password
	hashedPassword, err := hashPassword(password)
	if err != nil {
		return fmt.Errorf("failed to hash password: %v", err)
	}

	// Start transaction
	tx, err := a.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Insert into users table
	_, err = tx.Exec(
		"INSERT INTO users (username, password, user_type) VALUES (?, ?, ?)",
		fmt.Sprintf("%d", employeeID), hashedPassword, RoleAdmin,
	)
	if err != nil {
		return fmt.Errorf("failed to create user credentials: %v", err)
	}

	// Insert into admins table
	_, err = tx.Exec(
		"INSERT INTO admins (admin_id, first_name, middle_name, last_name) VALUES (?, ?, ?, ?)",
		employeeID, firstName, middleName, lastName,
	)
	if err != nil {
		return fmt.Errorf("failed to create admin profile: %v", err)
	}

	return tx.Commit()
}

func (a *App) CreateStudent(studentID int, firstName, middleName, lastName, gender string) error {
	password := fmt.Sprintf("%d", studentID)

	// Hash password
	hashedPassword, err := hashPassword(password)
	if err != nil {
		return fmt.Errorf("failed to hash password: %v", err)
	}

	// Start transaction
	tx, err := a.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Insert into users table
	_, err = tx.Exec(
		"INSERT INTO users (username, password, user_type) VALUES (?, ?, ?)",
		fmt.Sprintf("%d", studentID), hashedPassword, RoleStudent,
	)
	if err != nil {
		return fmt.Errorf("failed to create user credentials: %v", err)
	}

	// Insert into students table (using 'gender' parameter for section temporarily)
	_, err = tx.Exec(
		"INSERT INTO students (student_id, first_name, middle_name, last_name, section) VALUES (?, ?, ?, ?, ?)",
		studentID, firstName, middleName, lastName, gender,
	)
	if err != nil {
		return fmt.Errorf("failed to create student profile: %v", err)
	}

	return tx.Commit()
}

func (a *App) UpdateUser(id int, name, firstName, middleName, lastName, gender, role, employeeID, studentID, year string) error {
	_, err := a.db.Exec(
		"UPDATE users SET name = ?, first_name = ?, middle_name = ?, last_name = ?, gender = ?, role = ?, employee_id = ?, student_id = ?, year = ? WHERE id = ?",
		name, firstName, middleName, lastName, gender, role, employeeID, studentID, year, id,
	)
	return err
}

func (a *App) DeleteUser(id int) error {
	_, err := a.db.Exec("DELETE FROM users WHERE id = ?", id)
	return err
}

// Dashboard methods
func (a *App) GetAdminDashboard() (AdminDashboard, error) {
	var dashboard AdminDashboard

	// Count students
	err := a.db.QueryRow("SELECT COUNT(*) FROM users WHERE role = ?", RoleStudent).Scan(&dashboard.TotalStudents)
	if err != nil {
		return dashboard, err
	}

	// Count teachers
	err = a.db.QueryRow("SELECT COUNT(*) FROM users WHERE role = ?", RoleTeacher).Scan(&dashboard.TotalTeachers)
	if err != nil {
		return dashboard, err
	}

	// Count working students
	err = a.db.QueryRow("SELECT COUNT(*) FROM users WHERE role = ?", RoleWorkingStudent).Scan(&dashboard.WorkingStudents)
	if err != nil {
		return dashboard, err
	}

	// Count recent logins (today)
	today := time.Now().Format("2006-01-02")
	err = a.db.QueryRow("SELECT COUNT(*) FROM login_logs WHERE DATE(login_time) = ?", today).Scan(&dashboard.RecentLogins)
	if err != nil {
		return dashboard, err
	}

	return dashboard, nil
}

func (a *App) GetTeacherDashboard(teacherName string) (TeacherDashboard, error) {
	var dashboard TeacherDashboard

	// Get subjects handled by teacher
	rows, err := a.db.Query("SELECT id, code, name, teacher, room FROM subjects WHERE teacher = ?", teacherName)
	if err != nil {
		return dashboard, err
	}
	defer rows.Close()

	for rows.Next() {
		var subject Subject
		err := rows.Scan(&subject.ID, &subject.Code, &subject.Name, &subject.Teacher, &subject.Room)
		if err != nil {
			return dashboard, err
		}
		dashboard.Subjects = append(dashboard.Subjects, subject)
	}

	// Get today's attendance
	today := time.Now().Format("2006-01-02")
	attRows, err := a.db.Query(`
		SELECT a.id, a.class_id, a.date, a.student_id, a.time_in, a.time_out, a.status
		FROM attendance a
		JOIN classlist cl ON a.class_id = cl.id
		WHERE a.date = ? AND cl.assigned_teacher = ?
		ORDER BY a.student_id
	`, today, teacherName)
	if err != nil {
		return dashboard, err
	}
	defer attRows.Close()

	for attRows.Next() {
		var attendance Attendance
		var timeIn, timeOut sql.NullString
		err := attRows.Scan(&attendance.ID, &attendance.ClassID, &attendance.Date, &attendance.StudentID,
			&timeIn, &timeOut, &attendance.Status)
		if err != nil {
			return dashboard, err
		}
		if timeIn.Valid {
			attendance.TimeIn = timeIn.String
		}
		if timeOut.Valid {
			attendance.TimeOut = timeOut.String
		}
		dashboard.Attendance = append(dashboard.Attendance, attendance)
	}

	return dashboard, nil
}

func (a *App) GetStudentDashboard(studentID int) (StudentDashboard, error) {
	var dashboard StudentDashboard

	// Get student attendance records with class info
	rows, err := a.db.Query(`
		SELECT a.id, a.class_id, a.date, a.student_id, a.time_in, a.time_out, a.status,
		       cl.subject_code, cl.subject_title
		FROM attendance a
		JOIN classlist cl ON a.class_id = cl.id
		WHERE a.student_id = ?
		ORDER BY a.date DESC
	`, studentID)
	if err != nil {
		return dashboard, err
	}
	defer rows.Close()

	for rows.Next() {
		var attendance Attendance
		var subjectCode, subjectTitle string
		var timeIn, timeOut sql.NullString
		err := rows.Scan(&attendance.ID, &attendance.ClassID, &attendance.Date, &attendance.StudentID,
			&timeIn, &timeOut, &attendance.Status, &subjectCode, &subjectTitle)
		if err != nil {
			return dashboard, err
		}
		if timeIn.Valid {
			attendance.TimeIn = timeIn.String
		}
		if timeOut.Valid {
			attendance.TimeOut = timeOut.String
		}
		// Note: Attendance struct doesn't have subject name fields, so we can't store them directly
		dashboard.Attendance = append(dashboard.Attendance, attendance)
	}

	// Get today's log
	today := time.Now().Format("2006-01-02")
	var todayLog Attendance
	var timeIn, timeOut sql.NullString
	err = a.db.QueryRow(`
		SELECT a.id, a.class_id, a.date, a.student_id, a.time_in, a.time_out, a.status
		FROM attendance a
		WHERE a.student_id = ? AND a.date = ?
		ORDER BY a.time_in DESC LIMIT 1
	`, studentID, today).Scan(&todayLog.ID, &todayLog.ClassID, &todayLog.Date, &todayLog.StudentID,
		&timeIn, &timeOut, &todayLog.Status)

	if err == nil {
		if timeIn.Valid {
			todayLog.TimeIn = timeIn.String
		}
		if timeOut.Valid {
			todayLog.TimeOut = timeOut.String
		}
		dashboard.TodayLog = &todayLog
	}

	return dashboard, nil
}

func (a *App) GetWorkingStudentDashboard() (WorkingStudentDashboard, error) {
	var dashboard WorkingStudentDashboard

	// Count registered students
	err := a.db.QueryRow("SELECT COUNT(*) FROM users WHERE role = ?", RoleStudent).Scan(&dashboard.StudentsRegistered)
	if err != nil {
		return dashboard, err
	}

	// Count created classlists
	err = a.db.QueryRow("SELECT COUNT(*) FROM classlists").Scan(&dashboard.ClasslistsCreated)
	if err != nil {
		return dashboard, err
	}

	return dashboard, nil
}

// Attendance methods
func (a *App) RecordAttendance(classID, studentID int, status string) error {
	today := time.Now().Format("2006-01-02")
	now := time.Now().Format("15:04:05")

	// Check if attendance already recorded for today
	var existingID int
	err := a.db.QueryRow(
		"SELECT id FROM attendance WHERE student_id = ? AND class_id = ? AND date = ?",
		studentID, classID, today,
	).Scan(&existingID)

	if err == nil {
		// Update existing record
		_, err = a.db.Exec(
			"UPDATE attendance SET status = ?, time_in = ?, time_out = ? WHERE id = ?",
			status, now, now, existingID,
		)
	} else {
		// Insert new record
		_, err = a.db.Exec(
			"INSERT INTO attendance (class_id, date, student_id, time_in, time_out, status) VALUES (?, ?, ?, ?, ?, ?)",
			classID, today, studentID, now, now, status,
		)
	}

	return err
}

// Classlist methods (new schema)
func (a *App) GetClasslists() ([]Classlist, error) {
	rows, err := a.db.Query(`
		SELECT id, subject_code, subject_title, assigned_teacher, schedule, room, created_by, created_at, updated_at 
		FROM classlist 
		ORDER BY subject_code
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var classlists []Classlist
	for rows.Next() {
		var cl Classlist
		var createdBy sql.NullInt64
		err := rows.Scan(&cl.ID, &cl.SubjectCode, &cl.SubjectTitle, &cl.AssignedTeacher,
			&cl.Schedule, &cl.Room, &createdBy, &cl.CreatedAt, &cl.UpdatedAt)
		if err != nil {
			return nil, err
		}
		if createdBy.Valid {
			cl.CreatedBy = int(createdBy.Int64)
		}
		classlists = append(classlists, cl)
	}

	return classlists, nil
}

func (a *App) CreateClasslist(subjectCode, subjectTitle, assignedTeacher, schedule, room string, createdBy int) error {
	_, err := a.db.Exec(
		"INSERT INTO classlist (subject_code, subject_title, assigned_teacher, schedule, room, created_by) VALUES (?, ?, ?, ?, ?, ?)",
		subjectCode, subjectTitle, assignedTeacher, schedule, room, createdBy,
	)
	return err
}

func (a *App) GetClassStudents(classID int) ([]ClassStudent, error) {
	rows, err := a.db.Query(`
		SELECT id, class_id, student_id, first_name, middle_name, last_name 
		FROM class_students 
		WHERE class_id = ?
		ORDER BY last_name, first_name
	`, classID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var students []ClassStudent
	for rows.Next() {
		var cs ClassStudent
		err := rows.Scan(&cs.ID, &cs.ClassID, &cs.StudentID, &cs.FirstName, &cs.MiddleName, &cs.LastName)
		if err != nil {
			return nil, err
		}
		students = append(students, cs)
	}

	return students, nil
}

func (a *App) AddStudentToClass(classID, studentID int, firstName, middleName, lastName string) error {
	_, err := a.db.Exec(
		"INSERT INTO class_students (class_id, student_id, first_name, middle_name, last_name) VALUES (?, ?, ?, ?, ?)",
		classID, studentID, firstName, middleName, lastName,
	)
	return err
}

// Legacy Subject methods - kept for backward compatibility
func (a *App) GetSubjects() ([]Subject, error) {
	rows, err := a.db.Query("SELECT id, code, name, teacher, room FROM subjects ORDER BY code")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var subjects []Subject
	for rows.Next() {
		var subject Subject
		err := rows.Scan(&subject.ID, &subject.Code, &subject.Name, &subject.Teacher, &subject.Room)
		if err != nil {
			return nil, err
		}
		subjects = append(subjects, subject)
	}

	return subjects, nil
}

func (a *App) CreateSubject(code, name, teacher, room string) error {
	_, err := a.db.Exec(
		"INSERT INTO subjects (code, name, teacher, room) VALUES (?, ?, ?, ?)",
		code, name, teacher, room,
	)
	return err
}

// Export methods
func (a *App) ExportAttendanceCSV(classID int) (string, error) {
	rows, err := a.db.Query(`
		SELECT a.student_id, cs.first_name, cs.middle_name, cs.last_name, 
		       cl.subject_code, cl.subject_title, a.date, a.status, a.time_in, a.time_out
		FROM attendance a
		JOIN classlist cl ON a.class_id = cl.id
		LEFT JOIN class_students cs ON a.class_id = cs.class_id AND a.student_id = cs.student_id
		WHERE a.class_id = ?
		ORDER BY a.date DESC, cs.last_name, cs.first_name
	`, classID)
	if err != nil {
		return "", err
	}
	defer rows.Close()

	// Get user's home directory and create Downloads path
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	downloadsDir := filepath.Join(homeDir, "Downloads")

	// Create CSV file
	filename := fmt.Sprintf("attendance_export_%s.csv", time.Now().Format("20060102_150405"))
	fullPath := filepath.Join(downloadsDir, filename)
	file, err := os.Create(fullPath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	// Write header
	writer.Write([]string{"Student ID", "Student Name", "Subject Code", "Subject Name", "Date", "Status", "Time In", "Time Out"})

	// Write data
	for rows.Next() {
		var studentID int
		var firstName, middleName, lastName, code, subjectName, date, status string
		var timeIn, timeOut sql.NullString
		err := rows.Scan(&studentID, &firstName, &middleName, &lastName, &code, &subjectName, &date, &status, &timeIn, &timeOut)
		if err != nil {
			return "", err
		}

		// Build student name
		studentName := lastName + ", " + firstName
		if middleName != "" {
			studentName += " " + middleName
		}

		timeInStr := ""
		if timeIn.Valid {
			timeInStr = timeIn.String
		}
		timeOutStr := ""
		if timeOut.Valid {
			timeOutStr = timeOut.String
		}

		writer.Write([]string{fmt.Sprintf("%d", studentID), studentName, code, subjectName, date, status, timeInStr, timeOutStr})
	}

	return fullPath, nil
}

func (a *App) ExportUsersCSV() (string, error) {
	rows, err := a.db.Query("SELECT name, first_name, middle_name, last_name, role, employee_id, student_id, year, created FROM users ORDER BY created DESC")
	if err != nil {
		return "", err
	}
	defer rows.Close()

	// Get user's home directory and create Downloads path
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	downloadsDir := filepath.Join(homeDir, "Downloads")

	// Create CSV file in Downloads folder
	filename := fmt.Sprintf("users_export_%s.csv", time.Now().Format("20060102_150405"))
	fullPath := filepath.Join(downloadsDir, filename)
	file, err := os.Create(fullPath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	// Write header
	writer.Write([]string{"Name", "First Name", "Middle Name", "Last Name", "Role", "Employee ID", "Student ID", "Year", "Created"})

	// Write data
	for rows.Next() {
		var name, firstName, middleName, lastName, role, employeeID, studentID, year, created string
		err := rows.Scan(&name, &firstName, &middleName, &lastName, &role, &employeeID, &studentID, &year, &created)
		if err != nil {
			return "", err
		}
		writer.Write([]string{name, firstName, middleName, lastName, role, employeeID, studentID, year, created})
	}

	return fullPath, nil
}

func (a *App) ExportLogsCSV() (string, error) {
	rows, err := a.db.Query("SELECT user_id, user_type, pc_number, login_time, logout_time FROM login_logs ORDER BY login_time DESC")
	if err != nil {
		return "", err
	}
	defer rows.Close()

	// Get user's home directory and create Downloads path
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	downloadsDir := filepath.Join(homeDir, "Downloads")

	// Create CSV file in Downloads folder
	filename := fmt.Sprintf("logs_export_%s.csv", time.Now().Format("20060102_150405"))
	fullPath := filepath.Join(downloadsDir, filename)
	file, err := os.Create(fullPath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	// Write header
	writer.Write([]string{"User ID", "User Type", "PC Number", "Time In", "Time Out", "Date"})

	// Write data
	for rows.Next() {
		var userID int
		var userType, pcNumber string
		var loginTime, logoutTime sql.NullString
		err := rows.Scan(&userID, &userType, &pcNumber, &loginTime, &logoutTime)
		if err != nil {
			return "", err
		}

		timeIn := ""
		timeOut := ""
		date := ""

		if loginTime.Valid {
			t, _ := time.Parse("2006-01-02 15:04:05", loginTime.String)
			timeIn = t.Format("3:04:05 PM")
			date = t.Format("2006-01-02")
		}

		if logoutTime.Valid {
			t, _ := time.Parse("2006-01-02 15:04:05", logoutTime.String)
			timeOut = t.Format("3:04:05 PM")
		}

		writer.Write([]string{fmt.Sprintf("%d", userID), userType, pcNumber, timeIn, timeOut, date})
	}

	return fullPath, nil
}

func (a *App) ExportFeedbackCSV() (string, error) {
	rows, err := a.db.Query(`
		SELECT student_id, first_name, middle_name, last_name, pc_number, 
		       equipment_condition, monitor_condition, keyboard_condition, mouse_condition, 
		       comments, date_submitted 
		FROM feedback 
		ORDER BY date_submitted DESC
	`)
	if err != nil {
		return "", err
	}
	defer rows.Close()

	// Get user's home directory and create Downloads path
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	downloadsDir := filepath.Join(homeDir, "Downloads")

	// Create CSV file in Downloads folder
	filename := fmt.Sprintf("feedback_export_%s.csv", time.Now().Format("20060102_150405"))
	fullPath := filepath.Join(downloadsDir, filename)
	file, err := os.Create(fullPath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	// Write header
	writer.Write([]string{"Student ID", "Student Name", "PC Number", "Equipment", "Monitor", "Keyboard", "Mouse", "Comments", "Date"})

	// Write data
	for rows.Next() {
		var studentID int
		var firstName, middleName, lastName, pcNumber string
		var equipmentCond, monitorCond, keyboardCond, mouseCond string
		var comments sql.NullString
		var dateSubmitted string
		err := rows.Scan(&studentID, &firstName, &middleName, &lastName, &pcNumber,
			&equipmentCond, &monitorCond, &keyboardCond, &mouseCond, &comments, &dateSubmitted)
		if err != nil {
			return "", err
		}

		// Build full name
		studentName := lastName + ", " + firstName
		if middleName != "" {
			studentName += " " + middleName
		}

		commentsStr := ""
		if comments.Valid {
			commentsStr = comments.String
		}

		writer.Write([]string{fmt.Sprintf("%d", studentID), studentName, pcNumber, equipmentCond, monitorCond, keyboardCond, mouseCond, commentsStr, dateSubmitted})
	}

	return fullPath, nil
}

// Additional utility methods
func (a *App) GetUserByID(userID int) (User, error) {
	var user User
	row := a.db.QueryRow(
		"SELECT id, name, first_name, middle_name, last_name, gender, role, employee_id, student_id, year, photo_url, created FROM users WHERE id = ?",
		userID,
	)

	err := row.Scan(&user.ID, &user.Name, &user.FirstName, &user.MiddleName, &user.LastName, &user.Gender, &user.Role, &user.EmployeeID, &user.StudentID, &user.Year, &user.PhotoURL, &user.Created)
	if err != nil {
		return User{}, fmt.Errorf("user not found")
	}

	return user, nil
}

func (a *App) SubmitFeedback(studentID int, firstName, middleName, lastName, pcNumber, equipmentCondition, monitorCondition, keyboardCondition, mouseCondition, comments string) error {
	_, err := a.db.Exec(
		"INSERT INTO feedback (student_id, first_name, middle_name, last_name, pc_number, equipment_condition, monitor_condition, keyboard_condition, mouse_condition, comments, date_submitted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
		studentID, firstName, middleName, lastName, pcNumber, equipmentCondition, monitorCondition, keyboardCondition, mouseCondition, comments, time.Now(),
	)
	return err
}

func (a *App) GetFeedback() ([]Feedback, error) {
	rows, err := a.db.Query(`
		SELECT f.id, f.student_id, f.first_name, f.middle_name, f.last_name, f.pc_number, 
		       f.equipment_condition, f.monitor_condition, f.keyboard_condition, f.mouse_condition, 
		       f.comments, f.date_submitted
		FROM feedback f
		ORDER BY f.date_submitted DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var feedback []Feedback
	for rows.Next() {
		var fb Feedback
		var studentID int
		var comments sql.NullString
		err := rows.Scan(&fb.ID, &studentID, &fb.FirstName, &fb.MiddleName, &fb.LastName, &fb.PCNumber,
			&fb.EquipmentCondition, &fb.MonitorCondition, &fb.KeyboardCondition, &fb.MouseCondition,
			&comments, &fb.DateSubmitted)
		if err != nil {
			return nil, err
		}
		// Build full name and convert student ID to string
		fb.StudentID = studentID
		fb.StudentIDStr = fmt.Sprintf("%d", studentID)
		fb.StudentName = fb.LastName + ", " + fb.FirstName
		if fb.MiddleName != "" {
			fb.StudentName += " " + fb.MiddleName
		}
		if comments.Valid {
			fb.Comments = comments.String
		}
		feedback = append(feedback, fb)
	}

	return feedback, nil
}

// Login log methods
func (a *App) RecordLogin(userID int, userName, userType, pcNumber string) error {
	_, err := a.db.Exec(
		"INSERT INTO login_logs (user_id, user_type, pc_number, login_time) VALUES (?, ?, ?, ?)",
		userID, userType, pcNumber, time.Now(),
	)
	return err
}

func (a *App) RecordLogout(userID int) error {
	// Update the most recent login record for this user that doesn't have a logout time
	_, err := a.db.Exec(
		"UPDATE login_logs SET logout_time = ? WHERE user_id = ? AND logout_time IS NULL ORDER BY login_time DESC LIMIT 1",
		time.Now(), userID,
	)
	return err
}

func (a *App) GetAllLogs() ([]LoginLog, error) {
	rows, err := a.db.Query(`
		SELECT id, user_id, user_type, pc_number, login_time, logout_time
		FROM login_logs
		ORDER BY login_time DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []LoginLog
	for rows.Next() {
		var log LoginLog
		var userID int
		var logoutTime sql.NullString
		err := rows.Scan(&log.ID, &userID, &log.UserType, &log.PCNumber, &log.LoginTime, &logoutTime)
		if err != nil {
			return nil, err
		}
		log.UserName = fmt.Sprintf("%d", userID) // Store user_id in UserName field for display
		if logoutTime.Valid {
			log.LogoutTime = logoutTime.String
		}
		logs = append(logs, log)
	}

	return logs, nil
}

func (a *App) GetLogsByUserType(userType string) ([]LoginLog, error) {
	rows, err := a.db.Query(`
		SELECT id, user_id, user_type, pc_number, login_time, logout_time
		FROM login_logs
		WHERE user_type = ?
		ORDER BY login_time DESC
	`, userType)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []LoginLog
	for rows.Next() {
		var log LoginLog
		var userID int
		var logoutTime sql.NullString
		err := rows.Scan(&log.ID, &userID, &log.UserType, &log.PCNumber, &log.LoginTime, &logoutTime)
		if err != nil {
			return nil, err
		}
		log.UserName = fmt.Sprintf("%d", userID)
		if logoutTime.Valid {
			log.LogoutTime = logoutTime.String
		}
		logs = append(logs, log)
	}

	return logs, nil
}

func (a *App) SearchLogs(searchTerm, userType string) ([]LoginLog, error) {
	query := `
		SELECT id, user_id, user_type, pc_number, login_time, logout_time
		FROM login_logs
		WHERE (CAST(user_id AS CHAR) LIKE ? OR pc_number LIKE ? OR DATE(login_time) LIKE ?)
	`
	args := []interface{}{"%" + searchTerm + "%", "%" + searchTerm + "%", "%" + searchTerm + "%"}

	if userType != "" {
		query += " AND user_type = ?"
		args = append(args, userType)
	}

	query += " ORDER BY login_time DESC"

	rows, err := a.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []LoginLog
	for rows.Next() {
		var log LoginLog
		var userID int
		var logoutTime sql.NullString
		err := rows.Scan(&log.ID, &userID, &log.UserType, &log.PCNumber, &log.LoginTime, &logoutTime)
		if err != nil {
			return nil, err
		}
		log.UserName = fmt.Sprintf("%d", userID)
		if logoutTime.Valid {
			log.LogoutTime = logoutTime.String
		}
		logs = append(logs, log)
	}

	return logs, nil
}

// User filtering methods
func (a *App) GetUsersByType(userType string) ([]User, error) {
	var users []User
	var query string

	switch userType {
	case RoleStudent:
		query = `SELECT id, student_id, first_name, middle_name, last_name, year_level, section, profile_photo, created_at FROM students ORDER BY created_at DESC`
	case RoleWorkingStudent:
		query = `SELECT id, student_id, first_name, middle_name, last_name, year_level, section, profile_photo, created_at FROM working_students ORDER BY created_at DESC`
	case RoleTeacher:
		query = `SELECT id, teacher_id, first_name, middle_name, last_name, profile_photo, created_at FROM teachers ORDER BY created_at DESC`
	case RoleAdmin:
		query = `SELECT id, admin_id, first_name, middle_name, last_name, profile_photo, created_at FROM admins ORDER BY created_at DESC`
	default:
		return users, fmt.Errorf("invalid user type")
	}

	rows, err := a.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var user User
		if userType == RoleStudent || userType == RoleWorkingStudent {
			err := rows.Scan(&user.ID, &user.StudentID, &user.FirstName, &user.MiddleName, &user.LastName, &user.Year, &user.Gender, &user.PhotoURL, &user.Created)
			if err != nil {
				return nil, err
			}
		} else if userType == RoleTeacher {
			var dummy string
			err := rows.Scan(&user.ID, &user.EmployeeID, &user.FirstName, &user.MiddleName, &user.LastName, &user.PhotoURL, &user.Created)
			if err != nil {
				return nil, err
			}
			user.Gender = dummy
		} else {
			var dummy string
			err := rows.Scan(&user.ID, &user.EmployeeID, &user.FirstName, &user.MiddleName, &user.LastName, &user.PhotoURL, &user.Created)
			if err != nil {
				return nil, err
			}
			user.Gender = dummy
		}
		user.Role = userType
		user.Name = user.LastName + ", " + user.FirstName
		if user.MiddleName != "" {
			user.Name += " " + user.MiddleName
		}
		users = append(users, user)
	}

	return users, nil
}

func (a *App) SearchUsers(searchTerm, userType string) ([]User, error) {
	var users []User
	searchPattern := "%" + searchTerm + "%"

	// Helper function to search in a specific table
	searchInTable := func(tableName, idField, role string) error {
		var query string
		var args []interface{}

		if tableName == "students" || tableName == "working_students" {
			query = fmt.Sprintf(`
				SELECT id, %s, first_name, middle_name, last_name, year_level, section, profile_photo, created_at
				FROM %s
				WHERE first_name LIKE ? OR last_name LIKE ? OR %s LIKE ?
				ORDER BY created_at DESC
			`, idField, tableName, idField)
			args = []interface{}{searchPattern, searchPattern, searchPattern}
		} else {
			query = fmt.Sprintf(`
				SELECT id, %s, first_name, middle_name, last_name, profile_photo, created_at
				FROM %s
				WHERE first_name LIKE ? OR last_name LIKE ? OR %s LIKE ?
				ORDER BY created_at DESC
			`, idField, tableName, idField)
			args = []interface{}{searchPattern, searchPattern, searchPattern}
		}

		rows, err := a.db.Query(query, args...)
		if err != nil {
			return err
		}
		defer rows.Close()

		for rows.Next() {
			var user User
			if tableName == "students" || tableName == "working_students" {
				err := rows.Scan(&user.ID, &user.StudentID, &user.FirstName, &user.MiddleName, &user.LastName, &user.Year, &user.Gender, &user.PhotoURL, &user.Created)
				if err != nil {
					return err
				}
			} else {
				err := rows.Scan(&user.ID, &user.EmployeeID, &user.FirstName, &user.MiddleName, &user.LastName, &user.PhotoURL, &user.Created)
				if err != nil {
					return err
				}
			}
			user.Role = role
			user.Name = user.LastName + ", " + user.FirstName
			if user.MiddleName != "" {
				user.Name += " " + user.MiddleName
			}
			users = append(users, user)
		}
		return nil
	}

	// Search based on user type filter
	if userType == "" || userType == RoleStudent {
		if err := searchInTable("students", "student_id", RoleStudent); err != nil {
			return nil, err
		}
	}
	if userType == "" || userType == RoleWorkingStudent {
		if err := searchInTable("working_students", "student_id", RoleWorkingStudent); err != nil {
			return nil, err
		}
	}
	if userType == "" || userType == RoleTeacher {
		if err := searchInTable("teachers", "teacher_id", RoleTeacher); err != nil {
			return nil, err
		}
	}
	if userType == "" || userType == RoleAdmin {
		if err := searchInTable("admins", "admin_id", RoleAdmin); err != nil {
			return nil, err
		}
	}

	return users, nil
}

// Photo upload method
func (a *App) UpdateUserPhoto(userID int, userType, photoURL string) error {
	var tableName string
	switch userType {
	case RoleStudent:
		tableName = "students"
	case RoleWorkingStudent:
		tableName = "working_students"
	case RoleTeacher:
		tableName = "teachers"
	case RoleAdmin:
		tableName = "admins"
	default:
		return fmt.Errorf("invalid user type")
	}

	query := fmt.Sprintf("UPDATE %s SET profile_photo = ? WHERE id = ?", tableName)
	_, err := a.db.Exec(query, photoURL, userID)
	return err
}

// PDF Export methods
func (a *App) ExportLogsPDF() (string, error) {
	rows, err := a.db.Query("SELECT user_id, user_type, pc_number, login_time, logout_time FROM login_logs ORDER BY login_time DESC")
	if err != nil {
		return "", err
	}
	defer rows.Close()

	// Get user's home directory and create Downloads path
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	downloadsDir := filepath.Join(homeDir, "Downloads")

	// Create PDF file in Downloads folder
	filename := fmt.Sprintf("logs_export_%s.pdf", time.Now().Format("20060102_150405"))
	fullPath := filepath.Join(downloadsDir, filename)

	// Create new PDF
	pdf := gofpdf.New("L", "mm", "A4", "") // Landscape orientation
	pdf.AddPage()

	// Set title
	pdf.SetFont("Arial", "B", 16)
	pdf.Cell(0, 10, "Login Logs Report")
	pdf.Ln(12)

	// Add generation timestamp
	pdf.SetFont("Arial", "", 10)
	pdf.Cell(0, 6, fmt.Sprintf("Generated: %s", time.Now().Format("January 2, 2006 at 3:04 PM")))
	pdf.Ln(10)

	// Table header
	pdf.SetFont("Arial", "B", 10)
	pdf.SetFillColor(59, 130, 246)  // Blue background
	pdf.SetTextColor(255, 255, 255) // White text

	// Column widths (landscape A4 is 297mm wide, minus margins)
	colWidths := []float64{60, 35, 30, 40, 40, 35}
	headers := []string{"User ID", "User Type", "PC Number", "Time In", "Time Out", "Date"}

	for i, header := range headers {
		pdf.CellFormat(colWidths[i], 8, header, "1", 0, "C", true, 0, "")
	}
	pdf.Ln(-1)

	// Reset text color and font for data rows
	pdf.SetTextColor(0, 0, 0)
	pdf.SetFont("Arial", "", 9)

	// Table data with alternating row colors
	rowNum := 0
	for rows.Next() {
		var userID int
		var userType, pcNumber string
		var loginTime, logoutTime sql.NullString
		err := rows.Scan(&userID, &userType, &pcNumber, &loginTime, &logoutTime)
		if err != nil {
			return "", err
		}

		// Alternating row colors
		if rowNum%2 == 0 {
			pdf.SetFillColor(249, 250, 251) // Light gray
		} else {
			pdf.SetFillColor(255, 255, 255) // White
		}

		timeIn := ""
		timeOut := ""
		date := ""

		if loginTime.Valid {
			t, parseErr := time.Parse("2006-01-02 15:04:05", loginTime.String)
			if parseErr == nil {
				timeIn = t.Format("3:04:05 PM")
				date = t.Format("Jan 02, 2006")
			}
		}

		if logoutTime.Valid {
			t, parseErr := time.Parse("2006-01-02 15:04:05", logoutTime.String)
			if parseErr == nil {
				timeOut = t.Format("3:04:05 PM")
			}
		}

		userIDStr := fmt.Sprintf("%d", userID)

		data := []string{userIDStr, userType, pcNumber, timeIn, timeOut, date}
		for i, cell := range data {
			pdf.CellFormat(colWidths[i], 7, cell, "1", 0, "C", true, 0, "")
		}
		pdf.Ln(-1)
		rowNum++
	}

	// Footer
	pdf.Ln(10)
	pdf.SetFont("Arial", "I", 8)
	pdf.SetTextColor(128, 128, 128)
	pdf.Cell(0, 6, fmt.Sprintf("Total Records: %d", rowNum))

	// Save PDF
	err = pdf.OutputFileAndClose(fullPath)
	if err != nil {
		return "", err
	}

	return fullPath, nil
}

func (a *App) ExportFeedbackPDF() (string, error) {
	rows, err := a.db.Query(`
		SELECT student_id, first_name, middle_name, last_name, pc_number, 
		       equipment_condition, monitor_condition, keyboard_condition, mouse_condition, 
		       comments, date_submitted 
		FROM feedback 
		ORDER BY date_submitted DESC
	`)
	if err != nil {
		return "", err
	}
	defer rows.Close()

	// Get user's home directory and create Downloads path
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	downloadsDir := filepath.Join(homeDir, "Downloads")

	// Create PDF file in Downloads folder
	filename := fmt.Sprintf("feedback_export_%s.pdf", time.Now().Format("20060102_150405"))
	fullPath := filepath.Join(downloadsDir, filename)

	// Create new PDF
	pdf := gofpdf.New("L", "mm", "A4", "") // Landscape orientation
	pdf.AddPage()

	// Set title
	pdf.SetFont("Arial", "B", 16)
	pdf.Cell(0, 10, "Equipment Feedback Report")
	pdf.Ln(12)

	// Add generation timestamp
	pdf.SetFont("Arial", "", 10)
	pdf.Cell(0, 6, fmt.Sprintf("Generated: %s", time.Now().Format("January 2, 2006 at 3:04 PM")))
	pdf.Ln(10)

	// Table header
	pdf.SetFont("Arial", "B", 8)
	pdf.SetFillColor(59, 130, 246)  // Blue background
	pdf.SetTextColor(255, 255, 255) // White text

	// Column widths (landscape A4 is 297mm wide, minus margins)
	colWidths := []float64{30, 35, 20, 25, 25, 25, 25, 55}
	headers := []string{"Student ID", "Name", "PC", "Equipment", "Monitor", "Keyboard", "Mouse", "Comments"}

	for i, header := range headers {
		pdf.CellFormat(colWidths[i], 8, header, "1", 0, "C", true, 0, "")
	}
	pdf.Ln(-1)

	// Reset text color and font for data rows
	pdf.SetTextColor(0, 0, 0)
	pdf.SetFont("Arial", "", 7)

	// Table data with alternating row colors
	rowNum := 0
	for rows.Next() {
		var studentID int
		var firstName, middleName, lastName, pcNumber string
		var equipmentCond, monitorCond, keyboardCond, mouseCond string
		var comments sql.NullString
		var dateSubmitted string
		err := rows.Scan(&studentID, &firstName, &middleName, &lastName, &pcNumber,
			&equipmentCond, &monitorCond, &keyboardCond, &mouseCond, &comments, &dateSubmitted)
		if err != nil {
			return "", err
		}

		// Build full name
		studentName := lastName + ", " + firstName
		if middleName != "" {
			studentName += " " + middleName
		}

		// Alternating row colors
		if rowNum%2 == 0 {
			pdf.SetFillColor(249, 250, 251) // Light gray
		} else {
			pdf.SetFillColor(255, 255, 255) // White
		}

		// Truncate long text if necessary
		if len(studentName) > 22 {
			studentName = studentName[:19] + "..."
		}
		commentsStr := ""
		if comments.Valid {
			commentsStr = comments.String
			if len(commentsStr) > 40 {
				commentsStr = commentsStr[:37] + "..."
			}
		}

		// Student ID and Name
		pdf.CellFormat(colWidths[0], 7, fmt.Sprintf("%d", studentID), "1", 0, "C", true, 0, "")
		pdf.CellFormat(colWidths[1], 7, studentName, "1", 0, "L", true, 0, "")
		pdf.CellFormat(colWidths[2], 7, pcNumber, "1", 0, "C", true, 0, "")

		// Condition cells with colors
		conditions := []string{equipmentCond, monitorCond, keyboardCond, mouseCond}
		for i, cond := range conditions {
			if cond == "Good" {
				pdf.SetTextColor(21, 128, 61) // Green
			} else {
				pdf.SetTextColor(185, 28, 28) // Red
			}
			pdf.CellFormat(colWidths[3+i], 7, cond, "1", 0, "C", true, 0, "")
			pdf.SetTextColor(0, 0, 0) // Reset to black
		}

		// Comments
		pdf.CellFormat(colWidths[7], 7, commentsStr, "1", 0, "L", true, 0, "")

		pdf.Ln(-1)
		rowNum++
	}

	// Footer
	pdf.Ln(10)
	pdf.SetFont("Arial", "I", 8)
	pdf.SetTextColor(128, 128, 128)
	pdf.Cell(0, 6, fmt.Sprintf("Total Feedback: %d", rowNum))

	// Save PDF
	err = pdf.OutputFileAndClose(fullPath)
	if err != nil {
		return "", err
	}

	return fullPath, nil
}

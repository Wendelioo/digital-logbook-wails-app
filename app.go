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

type Subject struct {
	ID      int    `json:"id"`
	Code    string `json:"code"`
	Name    string `json:"name"`
	Teacher string `json:"teacher"`
	Room    string `json:"room"`
}

type Classlist struct {
	ID        int      `json:"id"`
	SubjectID int      `json:"subject_id"`
	Students  []string `json:"students"`
	Created   string   `json:"created"`
}

type Attendance struct {
	ID        int    `json:"id"`
	StudentID int    `json:"student_id"`
	SubjectID int    `json:"subject_id"`
	Date      string `json:"date"`
	Status    string `json:"status"`
	TimeIn    string `json:"time_in"`
	TimeOut   string `json:"time_out"`
}

type LoginLog struct {
	ID         int    `json:"id"`
	UserID     int    `json:"user_id"`
	UserName   string `json:"user_name"`
	UserType   string `json:"user_type"`
	PCNumber   string `json:"pc_number,omitempty"`
	LoginTime  string `json:"login_time"`
	LogoutTime string `json:"logout_time"`
}

type Feedback struct {
	ID           int    `json:"id"`
	StudentID    int    `json:"student_id"`
	StudentName  string `json:"student_name"`
	StudentIDStr string `json:"student_id_str"`
	PCNumber     string `json:"pc_number"`
	TimeIn       string `json:"time_in"`
	TimeOut      string `json:"time_out"`
	Equipment    string `json:"equipment"`
	Condition    string `json:"condition"`
	Comment      string `json:"comment"`
	Date         string `json:"date"`
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
		if err := a.CreateAdmin("ADMIN001", "Administrator", "System", ""); err != nil {
			log.Printf("Warning: Could not create default admin: %v", err)
		} else {
			log.Println("✅ Default admin created: Employee ID = ADMIN001, Password = ADMIN001")
			log.Println("⚠️  CHANGE THIS PASSWORD AFTER FIRST LOGIN!")
		}
	}

	log.Println("Database initialization completed successfully")
	return nil
}

func (a *App) createTables() error {
	// Users table
	_, err := a.db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id INT AUTO_INCREMENT PRIMARY KEY,
			password VARCHAR(255) NOT NULL,
			name VARCHAR(255) NOT NULL,
			first_name VARCHAR(255),
			middle_name VARCHAR(255),
			last_name VARCHAR(255),
			gender VARCHAR(20),
			role VARCHAR(50) NOT NULL,
			employee_id VARCHAR(255) UNIQUE,
			student_id VARCHAR(255) UNIQUE,
			year VARCHAR(100),
			photo_url VARCHAR(500),
			created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
	`)
	if err != nil {
		return err
	}

	// Add new columns if they don't exist (for existing databases)
	// Check if columns exist before adding them
	alterQueries := []string{
		"ALTER TABLE users ADD COLUMN first_name VARCHAR(255)",
		"ALTER TABLE users ADD COLUMN middle_name VARCHAR(255)",
		"ALTER TABLE users ADD COLUMN last_name VARCHAR(255)",
		"ALTER TABLE users ADD COLUMN gender VARCHAR(20)",
		"ALTER TABLE users ADD COLUMN employee_id VARCHAR(255)",
		"ALTER TABLE users ADD COLUMN student_id VARCHAR(255)",
		"ALTER TABLE users ADD COLUMN photo_url VARCHAR(500)",
	}

	for _, query := range alterQueries {
		_, err = a.db.Exec(query)
		if err != nil {
			// Ignore "Duplicate column name" errors since columns might already exist
			if !contains(err.Error(), "Duplicate column name") && !contains(err.Error(), "already exists") {
				log.Printf("Warning: Could not add column: %v", err)
			}
		}
	}

	// Add unique constraints separately to avoid conflicts
	uniqueConstraints := []string{
		"ALTER TABLE users ADD UNIQUE KEY unique_employee_id (employee_id)",
		"ALTER TABLE users ADD UNIQUE KEY unique_student_id (student_id)",
	}

	for _, query := range uniqueConstraints {
		_, err = a.db.Exec(query)
		if err != nil {
			// Ignore "Duplicate key name" errors
			if !contains(err.Error(), "Duplicate key name") && !contains(err.Error(), "already exists") {
				log.Printf("Warning: Could not add unique constraint: %v", err)
			}
		}
	}

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

	// Classlists table
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

	// Attendance table
	_, err = a.db.Exec(`
		CREATE TABLE IF NOT EXISTS attendance (
			id INT AUTO_INCREMENT PRIMARY KEY,
			student_id INT,
			subject_id INT,
			date DATE NOT NULL,
			status VARCHAR(20) NOT NULL,
			time_in TIME,
			time_out TIME,
			FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
			FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
	`)
	if err != nil {
		return err
	}

	// Login logs table
	_, err = a.db.Exec(`
		CREATE TABLE IF NOT EXISTS login_logs (
			id INT AUTO_INCREMENT PRIMARY KEY,
			user_id INT,
			user_name VARCHAR(255),
			user_type VARCHAR(50),
			pc_number VARCHAR(50),
			login_time TIMESTAMP,
			logout_time TIMESTAMP NULL,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
	`)
	if err != nil {
		return err
	}

	// Feedback table (Equipment Reports)
	_, err = a.db.Exec(`
		CREATE TABLE IF NOT EXISTS feedback (
			id INT AUTO_INCREMENT PRIMARY KEY,
			student_id INT,
			student_name VARCHAR(255),
			student_id_str VARCHAR(255),
			pc_number VARCHAR(50),
			time_in TIME,
			time_out TIME,
			equipment VARCHAR(255) NOT NULL,
			` + "`condition`" + ` VARCHAR(50) NOT NULL,
			comment TEXT,
			date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
	`)
	if err != nil {
		return err
	}

	// Add new columns to login_logs if they don't exist
	loginLogAlters := []string{
		"ALTER TABLE login_logs ADD COLUMN user_name VARCHAR(255)",
		"ALTER TABLE login_logs ADD COLUMN user_type VARCHAR(50)",
		"ALTER TABLE login_logs ADD COLUMN pc_number VARCHAR(50)",
	}
	for _, query := range loginLogAlters {
		_, err = a.db.Exec(query)
		if err != nil && !contains(err.Error(), "Duplicate column name") {
			log.Printf("Warning: Could not add column to login_logs: %v", err)
		}
	}

	// Add new columns to feedback if they don't exist
	feedbackAlters := []string{
		"ALTER TABLE feedback ADD COLUMN student_name VARCHAR(255)",
		"ALTER TABLE feedback ADD COLUMN student_id_str VARCHAR(255)",
		"ALTER TABLE feedback ADD COLUMN pc_number VARCHAR(50)",
		"ALTER TABLE feedback ADD COLUMN time_in TIME",
		"ALTER TABLE feedback ADD COLUMN time_out TIME",
	}
	for _, query := range feedbackAlters {
		_, err = a.db.Exec(query)
		if err != nil && !contains(err.Error(), "Duplicate column name") {
			log.Printf("Warning: Could not add column to feedback: %v", err)
		}
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
func (a *App) LoginByEmployeeID(employeeID, password string) (User, error) {
	var user User
	var hashedPassword string

	row := a.db.QueryRow(
		"SELECT id, password, name, first_name, middle_name, last_name, gender, role, employee_id, student_id, year, photo_url, created FROM users WHERE employee_id = ? AND role IN (?, ?)",
		employeeID, RoleAdmin, RoleTeacher,
	)

	err := row.Scan(&user.ID, &hashedPassword, &user.Name, &user.FirstName, &user.MiddleName, &user.LastName, &user.Gender, &user.Role, &user.EmployeeID, &user.StudentID, &user.Year, &user.PhotoURL, &user.Created)
	if err != nil {
		return User{}, fmt.Errorf("invalid credentials")
	}

	// Verify password
	if !verifyPassword(password, hashedPassword) {
		return User{}, fmt.Errorf("invalid credentials")
	}

	// Clear password from response
	user.Password = ""

	// Get hostname for PC identification
	hostname, err := a.GetHostname()
	if err != nil {
		hostname = "Unknown"
	}

	// Log the login with hostname
	if _, err := a.RecordLogin(user.ID, user.Name, user.Role, hostname); err != nil {
		log.Printf("Warning: Failed to log login for user %d: %v", user.ID, err)
	}

	return user, nil
}

// LoginByStudentID authenticates students and working students using student ID
func (a *App) LoginByStudentID(studentID, password string) (User, error) {
	var user User
	var hashedPassword string

	row := a.db.QueryRow(
		"SELECT id, password, name, first_name, middle_name, last_name, gender, role, employee_id, student_id, year, photo_url, created FROM users WHERE student_id = ? AND role IN (?, ?)",
		studentID, RoleStudent, RoleWorkingStudent,
	)

	err := row.Scan(&user.ID, &hashedPassword, &user.Name, &user.FirstName, &user.MiddleName, &user.LastName, &user.Gender, &user.Role, &user.EmployeeID, &user.StudentID, &user.Year, &user.PhotoURL, &user.Created)
	if err != nil {
		return User{}, fmt.Errorf("invalid credentials")
	}

	// Verify password
	if !verifyPassword(password, hashedPassword) {
		return User{}, fmt.Errorf("invalid credentials")
	}

	// Clear password from response
	user.Password = ""

	// Get hostname for PC identification
	hostname, err := a.GetHostname()
	if err != nil {
		hostname = "Unknown"
	}

	// Log the login with hostname
	if _, err := a.RecordLogin(user.ID, user.Name, user.Role, hostname); err != nil {
		log.Printf("Warning: Failed to log login for user %d: %v", user.ID, err)
	}

	return user, nil
}

func (a *App) ChangePassword(userID int, oldPassword, newPassword string) error {
	// Verify old password
	var currentHashedPassword string
	err := a.db.QueryRow("SELECT password FROM users WHERE id = ?", userID).Scan(&currentHashedPassword)
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
	_, err = a.db.Exec("UPDATE users SET password = ? WHERE id = ?", newHashedPassword, userID)
	return err
}

// User management methods
func (a *App) GetUsers() ([]User, error) {
	rows, err := a.db.Query("SELECT id, name, first_name, middle_name, last_name, gender, role, employee_id, student_id, year, photo_url, created FROM users ORDER BY created DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var user User
		err := rows.Scan(&user.ID, &user.Name, &user.FirstName, &user.MiddleName, &user.LastName, &user.Gender, &user.Role, &user.EmployeeID, &user.StudentID, &user.Year, &user.PhotoURL, &user.Created)
		if err != nil {
			return nil, err
		}
		users = append(users, user)
	}

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
func (a *App) CreateWorkingStudent(studentID, lastName, firstName, middleName, gender string) error {
	password := studentID
	name := lastName + ", " + firstName
	if middleName != "" {
		name += " " + middleName
	}
	role := RoleWorkingStudent

	// Hash password
	hashedPassword, err := hashPassword(password)
	if err != nil {
		return fmt.Errorf("failed to hash password: %v", err)
	}

	_, err = a.db.Exec(
		"INSERT INTO users (password, name, first_name, middle_name, last_name, gender, role, student_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
		hashedPassword, name, firstName, middleName, lastName, gender, role, studentID,
	)
	return err
}

func (a *App) CreateTeacher(employeeID, lastName, firstName, middleName, gender string) error {
	password := employeeID
	name := lastName + ", " + firstName
	if middleName != "" {
		name += " " + middleName
	}
	role := RoleTeacher

	// Hash password
	hashedPassword, err := hashPassword(password)
	if err != nil {
		return fmt.Errorf("failed to hash password: %v", err)
	}

	_, err = a.db.Exec(
		"INSERT INTO users (password, name, first_name, middle_name, last_name, gender, role, employee_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
		hashedPassword, name, firstName, middleName, lastName, gender, role, employeeID,
	)
	return err
}

func (a *App) CreateAdmin(employeeID, lastName, firstName, middleName string) error {
	password := employeeID
	name := lastName + ", " + firstName
	if middleName != "" {
		name += " " + middleName
	}
	role := RoleAdmin

	// Hash password
	hashedPassword, err := hashPassword(password)
	if err != nil {
		return fmt.Errorf("failed to hash password: %v", err)
	}

	_, err = a.db.Exec(
		"INSERT INTO users (password, name, first_name, middle_name, last_name, role, employee_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
		hashedPassword, name, firstName, middleName, lastName, role, employeeID,
	)
	return err
}

func (a *App) CreateStudent(studentID, firstName, middleName, lastName, gender string) error {
	password := studentID
	name := lastName + ", " + firstName
	if middleName != "" {
		name += " " + middleName
	}
	role := RoleStudent

	// Hash password
	hashedPassword, err := hashPassword(password)
	if err != nil {
		return fmt.Errorf("failed to hash password: %v", err)
	}

	_, err = a.db.Exec(
		"INSERT INTO users (password, name, first_name, middle_name, last_name, gender, role, student_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
		hashedPassword, name, firstName, middleName, lastName, gender, role, studentID,
	)
	return err
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
		SELECT a.id, a.student_id, a.subject_id, a.date, a.status, a.time_in, a.time_out
		FROM attendance a
		JOIN users u ON a.student_id = u.id
		JOIN subjects s ON a.subject_id = s.id
		WHERE a.date = ? AND s.teacher = ?
		ORDER BY u.name
	`, today, teacherName)
	if err != nil {
		return dashboard, err
	}
	defer attRows.Close()

	for attRows.Next() {
		var attendance Attendance
		err := attRows.Scan(&attendance.ID, &attendance.StudentID, &attendance.SubjectID,
			&attendance.Date, &attendance.Status, &attendance.TimeIn, &attendance.TimeOut)
		if err != nil {
			return dashboard, err
		}
		dashboard.Attendance = append(dashboard.Attendance, attendance)
	}

	return dashboard, nil
}

func (a *App) GetStudentDashboard(studentID int) (StudentDashboard, error) {
	var dashboard StudentDashboard

	// Get student attendance records with subject info
	rows, err := a.db.Query(`
		SELECT a.id, a.student_id, a.subject_id, s.code, s.name, a.date, a.status, a.time_in, a.time_out
		FROM attendance a
		JOIN subjects s ON a.subject_id = s.id
		WHERE a.student_id = ?
		ORDER BY a.date DESC
	`, studentID)
	if err != nil {
		return dashboard, err
	}
	defer rows.Close()

	for rows.Next() {
		var attendance Attendance
		var subjectCode, subjectName string
		err := rows.Scan(&attendance.ID, &attendance.StudentID, &attendance.SubjectID,
			&subjectCode, &subjectName, &attendance.Date, &attendance.Status, &attendance.TimeIn, &attendance.TimeOut)
		if err != nil {
			return dashboard, err
		}
		// Note: Attendance struct doesn't have subject name fields, so we can't store them directly
		// This is a limitation; ideally the struct should be extended
		dashboard.Attendance = append(dashboard.Attendance, attendance)
	}

	// Get today's log
	today := time.Now().Format("2006-01-02")
	var todayLog Attendance
	err = a.db.QueryRow(`
		SELECT a.id, a.student_id, a.subject_id, a.date, a.status, a.time_in, a.time_out
		FROM attendance a
		WHERE a.student_id = ? AND a.date = ?
		ORDER BY a.time_in DESC LIMIT 1
	`, studentID, today).Scan(&todayLog.ID, &todayLog.StudentID, &todayLog.SubjectID,
		&todayLog.Date, &todayLog.Status, &todayLog.TimeIn, &todayLog.TimeOut)

	if err == nil {
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
func (a *App) RecordAttendance(studentID, subjectID int, status string) error {
	today := time.Now().Format("2006-01-02")
	now := time.Now().Format("15:04:05")

	// Check if attendance already recorded for today
	var existingID int
	err := a.db.QueryRow(
		"SELECT id FROM attendance WHERE student_id = ? AND subject_id = ? AND date = ?",
		studentID, subjectID, today,
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
			"INSERT INTO attendance (student_id, subject_id, date, status, time_in, time_out) VALUES (?, ?, ?, ?, ?, ?)",
			studentID, subjectID, today, status, now, now,
		)
	}

	return err
}

// Subject and classlist methods
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
func (a *App) ExportAttendanceCSV(subjectID int) (string, error) {
	rows, err := a.db.Query(`
		SELECT u.name, s.code, s.name as subject_name, a.date, a.status, a.time_in, a.time_out
		FROM attendance a
		JOIN users u ON a.student_id = u.id
		JOIN subjects s ON a.subject_id = s.id
		WHERE a.subject_id = ?
		ORDER BY a.date DESC, u.name
	`, subjectID)
	if err != nil {
		return "", err
	}
	defer rows.Close()

	// Create CSV file
	filename := fmt.Sprintf("attendance_export_%s.csv", time.Now().Format("20060102_150405"))
	file, err := os.Create(filename)
	if err != nil {
		return "", err
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	// Write header
	writer.Write([]string{"Student Name", "Subject Code", "Subject Name", "Date", "Status", "Time In", "Time Out"})

	// Write data
	for rows.Next() {
		var name, code, subjectName, date, status, timeIn, timeOut string
		err := rows.Scan(&name, &code, &subjectName, &date, &status, &timeIn, &timeOut)
		if err != nil {
			return "", err
		}
		writer.Write([]string{name, code, subjectName, date, status, timeIn, timeOut})
	}

	return filename, nil
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
	rows, err := a.db.Query("SELECT user_name, user_type, pc_number, login_time, logout_time FROM login_logs ORDER BY login_time DESC")
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
	writer.Write([]string{"Full Name", "User Type", "PC Number", "Time In", "Time Out", "Date"})

	// Write data
	for rows.Next() {
		var userName, userType, pcNumber string
		var loginTime, logoutTime sql.NullString
		err := rows.Scan(&userName, &userType, &pcNumber, &loginTime, &logoutTime)
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

		writer.Write([]string{userName, userType, pcNumber, timeIn, timeOut, date})
	}

	return fullPath, nil
}

func (a *App) ExportFeedbackCSV() (string, error) {
	rows, err := a.db.Query("SELECT student_name, student_id_str, pc_number, time_in, time_out, equipment, condition, comment, date FROM feedback ORDER BY date DESC")
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
	filename := fmt.Sprintf("reports_export_%s.csv", time.Now().Format("20060102_150405"))
	fullPath := filepath.Join(downloadsDir, filename)
	file, err := os.Create(fullPath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	// Write header
	writer.Write([]string{"Student Name", "Student ID", "PC Number", "Time In", "Time Out", "Equipment", "Condition", "Report", "Date"})

	// Write data
	for rows.Next() {
		var studentName, studentIDStr, pcNumber, timeIn, timeOut, equipment, condition, comment, date string
		err := rows.Scan(&studentName, &studentIDStr, &pcNumber, &timeIn, &timeOut, &equipment, &condition, &comment, &date)
		if err != nil {
			return "", err
		}
		writer.Write([]string{studentName, studentIDStr, pcNumber, timeIn, timeOut, equipment, condition, comment, date})
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

func (a *App) SubmitFeedback(studentID int, studentName, studentIDStr, pcNumber, timeIn, timeOut, equipment, condition, comment string) error {
	_, err := a.db.Exec(
		"INSERT INTO feedback (student_id, student_name, student_id_str, pc_number, time_in, time_out, equipment, `condition`, comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
		studentID, studentName, studentIDStr, pcNumber, timeIn, timeOut, equipment, condition, comment,
	)
	return err
}

func (a *App) GetFeedback() ([]Feedback, error) {
	rows, err := a.db.Query(`
		SELECT f.id, f.student_id, f.student_name, f.student_id_str, f.pc_number, f.time_in, f.time_out, f.equipment, f.condition, f.comment, f.date
		FROM feedback f
		ORDER BY f.date DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var feedback []Feedback
	for rows.Next() {
		var fb Feedback
		err := rows.Scan(&fb.ID, &fb.StudentID, &fb.StudentName, &fb.StudentIDStr, &fb.PCNumber, &fb.TimeIn, &fb.TimeOut, &fb.Equipment, &fb.Condition, &fb.Comment, &fb.Date)
		if err != nil {
			return nil, err
		}
		feedback = append(feedback, fb)
	}

	return feedback, nil
}

// Login log methods
func (a *App) RecordLogin(userID int, userName, userType, pcNumber string) (int, error) {
	result, err := a.db.Exec(
		"INSERT INTO login_logs (user_id, user_name, user_type, pc_number, login_time) VALUES (?, ?, ?, ?, ?)",
		userID, userName, userType, pcNumber, time.Now(),
	)
	if err != nil {
		return 0, err
	}
	id, _ := result.LastInsertId()
	return int(id), nil
}

func (a *App) RecordLogout(logID int) error {
	_, err := a.db.Exec(
		"UPDATE login_logs SET logout_time = ? WHERE id = ?",
		time.Now(), logID,
	)
	return err
}

func (a *App) GetAllLogs() ([]LoginLog, error) {
	rows, err := a.db.Query(`
		SELECT id, user_id, user_name, user_type, pc_number, login_time, logout_time
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
		var logoutTime sql.NullString
		err := rows.Scan(&log.ID, &log.UserID, &log.UserName, &log.UserType, &log.PCNumber, &log.LoginTime, &logoutTime)
		if err != nil {
			return nil, err
		}
		if logoutTime.Valid {
			log.LogoutTime = logoutTime.String
		}
		logs = append(logs, log)
	}

	return logs, nil
}

func (a *App) GetLogsByUserType(userType string) ([]LoginLog, error) {
	rows, err := a.db.Query(`
		SELECT id, user_id, user_name, user_type, pc_number, login_time, logout_time
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
		var logoutTime sql.NullString
		err := rows.Scan(&log.ID, &log.UserID, &log.UserName, &log.UserType, &log.PCNumber, &log.LoginTime, &logoutTime)
		if err != nil {
			return nil, err
		}
		if logoutTime.Valid {
			log.LogoutTime = logoutTime.String
		}
		logs = append(logs, log)
	}

	return logs, nil
}

func (a *App) SearchLogs(searchTerm, userType string) ([]LoginLog, error) {
	query := `
		SELECT id, user_id, user_name, user_type, pc_number, login_time, logout_time
		FROM login_logs
		WHERE (user_name LIKE ? OR pc_number LIKE ? OR DATE(login_time) LIKE ?)
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
		var logoutTime sql.NullString
		err := rows.Scan(&log.ID, &log.UserID, &log.UserName, &log.UserType, &log.PCNumber, &log.LoginTime, &logoutTime)
		if err != nil {
			return nil, err
		}
		if logoutTime.Valid {
			log.LogoutTime = logoutTime.String
		}
		logs = append(logs, log)
	}

	return logs, nil
}

// User filtering methods
func (a *App) GetUsersByType(userType string) ([]User, error) {
	rows, err := a.db.Query(`
		SELECT id, name, first_name, middle_name, last_name, gender, role, employee_id, student_id, year, photo_url, created 
		FROM users 
		WHERE role = ? 
		ORDER BY created DESC
	`, userType)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var user User
		err := rows.Scan(&user.ID, &user.Name, &user.FirstName, &user.MiddleName, &user.LastName, &user.Gender, &user.Role, &user.EmployeeID, &user.StudentID, &user.Year, &user.PhotoURL, &user.Created)
		if err != nil {
			return nil, err
		}
		users = append(users, user)
	}

	return users, nil
}

func (a *App) SearchUsers(searchTerm, userType string) ([]User, error) {
	query := `
		SELECT id, name, first_name, middle_name, last_name, gender, role, employee_id, student_id, year, photo_url, created 
		FROM users 
		WHERE (name LIKE ? OR student_id LIKE ? OR employee_id LIKE ? OR gender LIKE ?)
	`
	args := []interface{}{"%" + searchTerm + "%", "%" + searchTerm + "%", "%" + searchTerm + "%", "%" + searchTerm + "%"}

	if userType != "" {
		query += " AND role = ?"
		args = append(args, userType)
	}

	query += " ORDER BY created DESC"

	rows, err := a.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var user User
		err := rows.Scan(&user.ID, &user.Name, &user.FirstName, &user.MiddleName, &user.LastName, &user.Gender, &user.Role, &user.EmployeeID, &user.StudentID, &user.Year, &user.PhotoURL, &user.Created)
		if err != nil {
			return nil, err
		}
		users = append(users, user)
	}

	return users, nil
}

// Photo upload method
func (a *App) UpdateUserPhoto(userID int, photoURL string) error {
	_, err := a.db.Exec("UPDATE users SET photo_url = ? WHERE id = ?", photoURL, userID)
	return err
}

// PDF Export methods
func (a *App) ExportLogsPDF() (string, error) {
	rows, err := a.db.Query("SELECT user_name, user_type, pc_number, login_time, logout_time FROM login_logs ORDER BY login_time DESC")
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
	headers := []string{"Full Name", "User Type", "PC Number", "Time In", "Time Out", "Date"}

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
		var userName, userType, pcNumber string
		var loginTime, logoutTime sql.NullString
		err := rows.Scan(&userName, &userType, &pcNumber, &loginTime, &logoutTime)
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

		// Truncate long names if necessary
		if len(userName) > 30 {
			userName = userName[:27] + "..."
		}

		data := []string{userName, userType, pcNumber, timeIn, timeOut, date}
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
	rows, err := a.db.Query("SELECT student_name, student_id_str, pc_number, time_in, time_out, equipment, condition, comment, date FROM feedback ORDER BY date DESC")
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
	filename := fmt.Sprintf("reports_export_%s.pdf", time.Now().Format("20060102_150405"))
	fullPath := filepath.Join(downloadsDir, filename)

	// Create new PDF
	pdf := gofpdf.New("L", "mm", "A4", "") // Landscape orientation
	pdf.AddPage()

	// Set title
	pdf.SetFont("Arial", "B", 16)
	pdf.Cell(0, 10, "Equipment Reports")
	pdf.Ln(12)

	// Add generation timestamp
	pdf.SetFont("Arial", "", 10)
	pdf.Cell(0, 6, fmt.Sprintf("Generated: %s", time.Now().Format("January 2, 2006 at 3:04 PM")))
	pdf.Ln(10)

	// Table header
	pdf.SetFont("Arial", "B", 9)
	pdf.SetFillColor(59, 130, 246)  // Blue background
	pdf.SetTextColor(255, 255, 255) // White text

	// Column widths (landscape A4 is 297mm wide, minus margins)
	colWidths := []float64{40, 30, 25, 25, 25, 30, 25, 60}
	headers := []string{"Student Name", "Student ID", "PC Number", "Time In", "Time Out", "Equipment", "Condition", "Report"}

	for i, header := range headers {
		pdf.CellFormat(colWidths[i], 8, header, "1", 0, "C", true, 0, "")
	}
	pdf.Ln(-1)

	// Reset text color and font for data rows
	pdf.SetTextColor(0, 0, 0)
	pdf.SetFont("Arial", "", 8)

	// Table data with alternating row colors
	rowNum := 0
	for rows.Next() {
		var studentName, studentIDStr, pcNumber, timeIn, timeOut, equipment, condition, comment, date string
		err := rows.Scan(&studentName, &studentIDStr, &pcNumber, &timeIn, &timeOut, &equipment, &condition, &comment, &date)
		if err != nil {
			return "", err
		}

		// Alternating row colors
		if rowNum%2 == 0 {
			pdf.SetFillColor(249, 250, 251) // Light gray
		} else {
			pdf.SetFillColor(255, 255, 255) // White
		}

		// Truncate long text if necessary
		if len(studentName) > 25 {
			studentName = studentName[:22] + "..."
		}
		if len(comment) > 50 {
			comment = comment[:47] + "..."
		}

		data := []string{studentName, studentIDStr, pcNumber, timeIn, timeOut, equipment}
		pdf.SetFont("Arial", "", 8)
		for i, cell := range data {
			pdf.CellFormat(colWidths[i], 7, cell, "1", 0, "C", true, 0, "")
		}

		// Condition cell with color
		if condition == "Good" {
			pdf.SetTextColor(21, 128, 61) // Green
		} else if condition == "Fair" {
			pdf.SetTextColor(161, 98, 7) // Yellow
		} else {
			pdf.SetTextColor(185, 28, 28) // Red
		}
		pdf.CellFormat(colWidths[6], 7, condition, "1", 0, "C", true, 0, "")

		// Reset text color for comment
		pdf.SetTextColor(0, 0, 0)
		pdf.CellFormat(colWidths[7], 7, comment, "1", 0, "L", true, 0, "")

		pdf.Ln(-1)
		rowNum++
	}

	// Footer
	pdf.Ln(10)
	pdf.SetFont("Arial", "I", 8)
	pdf.SetTextColor(128, 128, 128)
	pdf.Cell(0, 6, fmt.Sprintf("Total Reports: %d", rowNum))

	// Save PDF
	err = pdf.OutputFileAndClose(fullPath)
	if err != nil {
		return "", err
	}

	return fullPath, nil
}

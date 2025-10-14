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
	PhotoURL   *string `json:"photo_url"`
	Created    string  `json:"created"`
}

// Login authenticates a user
func (a *App) Login(username, password string) (*User, error) {
	// MOCK DATA - Check for test users first (for temporary testing without database)
	mockUsers := getMockUsers()
	if mockUser, exists := mockUsers[username]; exists {
		if mockUser.Password == password {
			log.Printf("✓ Mock user login successful: %s (role: %s)", username, mockUser.Role)
			return mockUser, nil
		}
		return nil, fmt.Errorf("invalid credentials")
	}

	// If not a mock user, proceed with database authentication
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
	switch user.Role {
	case "admin":
		query = `SELECT admin_id, first_name, middle_name, last_name FROM admins WHERE admin_id = ?`
	case "teacher":
		query = `SELECT teacher_id, first_name, middle_name, last_name FROM teachers WHERE teacher_id = ?`
	case "student":
		query = `SELECT student_id, first_name, middle_name, last_name FROM students WHERE student_id = ?`
	case "working_student":
		query = `SELECT student_id, first_name, middle_name, last_name FROM working_students WHERE student_id = ?`
	}

	var id int
	var firstName, middleName, lastName sql.NullString
	err = a.db.QueryRow(query, user.ID).Scan(&id, &firstName, &middleName, &lastName)
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
	}

	return &user, nil
}

// getMockUsers returns mock users for temporary testing
func getMockUsers() map[string]*User {
	// Helper function to create string pointers
	strPtr := func(s string) *string { return &s }

	mockUsers := make(map[string]*User)

	// Mock Admin User
	mockUsers["admin"] = &User{
		ID:         1,
		Password:   "admin123",
		Name:       "admin",
		FirstName:  strPtr("System"),
		MiddleName: strPtr("S."),
		LastName:   strPtr("Administrator"),
		Gender:     strPtr("Male"),
		Role:       "admin",
		EmployeeID: strPtr("ADMIN001"),
		Created:    time.Now().Format("2006-01-02 15:04:05"),
	}

	// Mock Teacher User
	mockUsers["teacher"] = &User{
		ID:         2,
		Password:   "teacher123",
		Name:       "teacher",
		FirstName:  strPtr("Maria"),
		MiddleName: strPtr("C."),
		LastName:   strPtr("Santos"),
		Gender:     strPtr("Female"),
		Role:       "teacher",
		EmployeeID: strPtr("TEACH001"),
		Created:    time.Now().Format("2006-01-02 15:04:05"),
	}

	// Mock Student User
	mockUsers["student"] = &User{
		ID:         3,
		Password:   "student123",
		Name:       "student",
		FirstName:  strPtr("Juan"),
		MiddleName: strPtr("D."),
		LastName:   strPtr("Cruz"),
		Gender:     strPtr("Male"),
		Role:       "student",
		StudentID:  strPtr("2024-001"),
		Year:       strPtr("3rd Year"),
		Created:    time.Now().Format("2006-01-02 15:04:05"),
	}

	// Mock Working Student User
	mockUsers["working"] = &User{
		ID:         4,
		Password:   "working123",
		Name:       "working",
		FirstName:  strPtr("Ana"),
		MiddleName: strPtr("B."),
		LastName:   strPtr("Reyes"),
		Gender:     strPtr("Female"),
		Role:       "working_student",
		StudentID:  strPtr("2024-002"),
		Year:       strPtr("4th Year"),
		Created:    time.Now().Format("2006-01-02 15:04:05"),
	}

	return mockUsers
}

// GetUsers returns all users
func (a *App) GetUsers() ([]User, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	query := `SELECT id, username, password, user_type, created_at FROM users ORDER BY created_at DESC`
	rows, err := a.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var user User
		var createdAt time.Time
		err := rows.Scan(&user.ID, &user.Name, &user.Password, &user.Role, &createdAt)
		if err != nil {
			continue
		}
		user.Created = createdAt.Format("2006-01-02 15:04:05")
		users = append(users, user)
	}

	return users, nil
}

// GetUsersByType returns users filtered by type
func (a *App) GetUsersByType(userType string) ([]User, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	query := `SELECT id, username, password, user_type, created_at FROM users WHERE user_type = ? ORDER BY created_at DESC`
	rows, err := a.db.Query(query, userType)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var user User
		var createdAt time.Time
		err := rows.Scan(&user.ID, &user.Name, &user.Password, &user.Role, &createdAt)
		if err != nil {
			continue
		}
		user.Created = createdAt.Format("2006-01-02 15:04:05")
		users = append(users, user)
	}

	return users, nil
}

// SearchUsers searches users by name, ID, gender, or date
func (a *App) SearchUsers(searchTerm, userType string) ([]User, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	query := `SELECT id, username, password, user_type, created_at FROM users WHERE username LIKE ?`
	args := []interface{}{"%" + searchTerm + "%"}

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
		err := rows.Scan(&user.ID, &user.Name, &user.Password, &user.Role, &createdAt)
		if err != nil {
			continue
		}
		user.Created = createdAt.Format("2006-01-02 15:04:05")
		users = append(users, user)
	}

	return users, nil
}

// CreateUser creates a new user
func (a *App) CreateUser(password, name, firstName, middleName, lastName, gender, role, employeeID, studentID, year string) error {
	if a.db == nil {
		return fmt.Errorf("database not connected")
	}

	// Determine username based on role
	username := employeeID
	if role == "student" || role == "working_student" {
		username = studentID
	}

	// Insert into users table
	query := `INSERT INTO users (username, password, user_type) VALUES (?, ?, ?)`
	result, err := a.db.Exec(query, username, password, role)
	if err != nil {
		return err
	}

	userID, _ := result.LastInsertId()

	// Insert into respective table based on role
	switch role {
	case "admin":
		query = `INSERT INTO admins (admin_id, first_name, middle_name, last_name) VALUES (?, ?, ?, ?)`
		_, err = a.db.Exec(query, userID, firstName, nullString(middleName), lastName)
	case "teacher":
		query = `INSERT INTO teachers (teacher_id, first_name, middle_name, last_name) VALUES (?, ?, ?, ?)`
		_, err = a.db.Exec(query, userID, firstName, nullString(middleName), lastName)
	case "student":
		query = `INSERT INTO students (student_id, first_name, middle_name, last_name) VALUES (?, ?, ?, ?)`
		_, err = a.db.Exec(query, userID, firstName, nullString(middleName), lastName)
	case "working_student":
		query = `INSERT INTO working_students (student_id, first_name, middle_name, last_name) VALUES (?, ?, ?, ?)`
		_, err = a.db.Exec(query, userID, firstName, nullString(middleName), lastName)
	}

	return err
}

// UpdateUser updates an existing user
func (a *App) UpdateUser(id int, name, firstName, middleName, lastName, gender, role, employeeID, studentID, year string) error {
	if a.db == nil {
		return fmt.Errorf("database not connected")
	}

	// Update in respective table based on role
	var query string
	switch role {
	case "admin":
		query = `UPDATE admins SET first_name = ?, middle_name = ?, last_name = ? WHERE admin_id = ?`
	case "teacher":
		query = `UPDATE teachers SET first_name = ?, middle_name = ?, last_name = ? WHERE teacher_id = ?`
	case "student":
		query = `UPDATE students SET first_name = ?, middle_name = ?, last_name = ? WHERE student_id = ?`
	case "working_student":
		query = `UPDATE working_students SET first_name = ?, middle_name = ?, last_name = ? WHERE student_id = ?`
	}

	_, err := a.db.Exec(query, firstName, nullString(middleName), lastName, id)
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
	a.db.QueryRow(`SELECT COUNT(*) FROM students`).Scan(&dashboard.TotalStudents)

	// Count total teachers
	a.db.QueryRow(`SELECT COUNT(*) FROM teachers`).Scan(&dashboard.TotalTeachers)

	// Count working students
	a.db.QueryRow(`SELECT COUNT(*) FROM working_students`).Scan(&dashboard.WorkingStudents)

	// Count recent logins (last 24 hours)
	a.db.QueryRow(`SELECT COUNT(*) FROM login_logs WHERE login_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`).Scan(&dashboard.RecentLogins)

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

// GetAllLogs returns all login logs
func (a *App) GetAllLogs() ([]LoginLog, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database not connected")
	}

	query := `SELECT id, user_id, user_type, pc_number, login_time, logout_time FROM login_logs ORDER BY login_time DESC LIMIT 1000`
	rows, err := a.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []LoginLog
	for rows.Next() {
		var log LoginLog
		var pcNumber, logoutTime sql.NullString
		var loginTime time.Time

		err := rows.Scan(&log.ID, &log.UserID, &log.UserType, &pcNumber, &loginTime, &logoutTime)
		if err != nil {
			continue
		}

		log.LoginTime = loginTime.Format("2006-01-02 15:04:05")
		if pcNumber.Valid {
			log.PCNumber = &pcNumber.String
		}
		if logoutTime.Valid {
			log.LogoutTime = &logoutTime.String
		}
		log.UserName = fmt.Sprintf("User %d", log.UserID)

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

	query := `SELECT id, student_id, first_name, middle_name, last_name, pc_number, 
			  equipment_condition, monitor_condition, keyboard_condition, mouse_condition, 
			  comments, date_submitted 
			  FROM feedback ORDER BY date_submitted DESC LIMIT 1000`
	rows, err := a.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var feedbacks []Feedback
	for rows.Next() {
		var fb Feedback
		var middleName, comments sql.NullString
		var dateSubmitted time.Time

		err := rows.Scan(&fb.ID, &fb.StudentID, &fb.FirstName, &middleName, &fb.LastName,
			&fb.PCNumber, &fb.EquipmentCondition, &fb.MonitorCondition,
			&fb.KeyboardCondition, &fb.MouseCondition, &comments, &dateSubmitted)
		if err != nil {
			continue
		}

		if middleName.Valid {
			fb.MiddleName = &middleName.String
		}
		if comments.Valid {
			fb.Comments = &comments.String
		}

		fb.StudentIDStr = strconv.Itoa(fb.StudentID)
		fb.StudentName = fmt.Sprintf("%s, %s", fb.LastName, fb.FirstName)
		if middleName.Valid {
			fb.StudentName += " " + middleName.String
		}
		fb.DateSubmitted = dateSubmitted.Format("2006-01-02 15:04:05")

		feedbacks = append(feedbacks, fb)
	}

	return feedbacks, nil
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
// TEACHER DASHBOARD
// ==============================================================================

// TeacherDashboard represents teacher dashboard data
type TeacherDashboard struct {
	Subjects   []Subject    `json:"subjects"`
	Attendance []Attendance `json:"attendance"`
}

// Subject represents a subject/class
type Subject struct {
	ID       int    `json:"id"`
	Code     string `json:"code"`
	Name     string `json:"name"`
	Teacher  string `json:"teacher"`
	Room     string `json:"room"`
	Schedule string `json:"schedule"`
}

// ClassStudent represents a student enrolled in a class
type ClassStudent struct {
	ID         int     `json:"id"`
	StudentID  string  `json:"student_id"`
	FirstName  string  `json:"first_name"`
	MiddleName *string `json:"middle_name"`
	LastName   string  `json:"last_name"`
	SubjectID  int     `json:"subject_id"`
}

// Attendance represents an attendance record
type Attendance struct {
	ID        int     `json:"id"`
	ClassID   int     `json:"class_id"`
	Date      string  `json:"date"`
	StudentID int     `json:"student_id"`
	TimeIn    *string `json:"time_in"`
	TimeOut   *string `json:"time_out"`
	Status    string  `json:"status"`
}

// GetTeacherDashboard returns teacher dashboard data
func (a *App) GetTeacherDashboard(teacherName string) (TeacherDashboard, error) {
	var dashboard TeacherDashboard

	// Get subjects (will automatically use mock data if DB not connected)
	subjects, err := a.GetSubjects()
	if err != nil {
		log.Printf("⚠ Failed to get subjects: %v", err)
		subjects = getMockSubjects() // Fallback to mock data
	}
	dashboard.Subjects = subjects

	// If database is not connected, return mock attendance data
	if a.db == nil {
		log.Println("⚠ Database not connected, returning mock attendance")
		// Return dashboard with just subjects, no attendance
		return dashboard, nil
	}

	// Get today's attendance
	query := `SELECT id, class_id, date, student_id, time_in, time_out, status 
			  FROM attendance WHERE date = CURDATE() LIMIT 100`
	rows, err := a.db.Query(query)
	if err != nil {
		log.Printf("⚠ Failed to query attendance: %v", err)
		// Return dashboard with just subjects
		return dashboard, nil
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
	}

	return dashboard, nil
}

// getMockSubjects returns mock subjects for testing
func getMockSubjects() []Subject {
	return []Subject{
		{
			ID:       1,
			Code:     "IT101",
			Name:     "Programming Fundamentals",
			Teacher:  "Maria C. Santos",
			Room:     "Lab 1",
			Schedule: "MWF 8-9AM",
		},
		{
			ID:       2,
			Code:     "IT102",
			Name:     "Database Management",
			Teacher:  "Maria C. Santos",
			Room:     "Lab 2",
			Schedule: "TTh 1-2PM",
		},
		{
			ID:       3,
			Code:     "IT103",
			Name:     "Web Development",
			Teacher:  "Maria C. Santos",
			Room:     "Lab 1",
			Schedule: "MWF 10-11AM",
		},
		{
			ID:       4,
			Code:     "IT201",
			Name:     "Data Structures",
			Teacher:  "Juan P. Dela Cruz",
			Room:     "Lab 3",
			Schedule: "TTh 2-3PM",
		},
		{
			ID:       5,
			Code:     "IT202",
			Name:     "Network Administration",
			Teacher:  "Juan P. Dela Cruz",
			Room:     "Lab 2",
			Schedule: "MWF 1-2PM",
		},
	}
}

// getMockStudents returns mock students for testing
func getMockStudents() []ClassStudent {
	// Helper function to create string pointers
	strPtr := func(s string) *string {
		if s == "" {
			return nil
		}
		return &s
	}

	return []ClassStudent{
		{ID: 1, StudentID: "20201", FirstName: "Wendel", MiddleName: strPtr("T"), LastName: "Enriquez", SubjectID: 1},
		{ID: 2, StudentID: "20202", FirstName: "Niño", MiddleName: strPtr("Y"), LastName: "Rivera", SubjectID: 1},
		{ID: 3, StudentID: "20203", FirstName: "Sammy", MiddleName: nil, LastName: "Velchez", SubjectID: 1},
		{ID: 4, StudentID: "20204", FirstName: "Maria", MiddleName: strPtr("L"), LastName: "Santos", SubjectID: 1},
		{ID: 5, StudentID: "20205", FirstName: "Juan", MiddleName: strPtr("D"), LastName: "Cruz", SubjectID: 1},
		
		{ID: 6, StudentID: "20206", FirstName: "Ana", MiddleName: strPtr("B"), LastName: "Reyes", SubjectID: 2},
		{ID: 7, StudentID: "20207", FirstName: "Pedro", MiddleName: strPtr("M"), LastName: "Garcia", SubjectID: 2},
		{ID: 8, StudentID: "20208", FirstName: "Sofia", MiddleName: nil, LastName: "Mendoza", SubjectID: 2},
		
		{ID: 9, StudentID: "20209", FirstName: "Carlos", MiddleName: strPtr("R"), LastName: "Torres", SubjectID: 3},
		{ID: 10, StudentID: "20210", FirstName: "Elena", MiddleName: strPtr("V"), LastName: "Flores", SubjectID: 3},
	}
}

// GetSubjects returns all subjects
func (a *App) GetSubjects() ([]Subject, error) {
	// Return mock data if database is not connected
	if a.db == nil {
		log.Println("⚠ Database not connected, returning mock subjects")
		return getMockSubjects(), nil
	}

	query := `SELECT id, subject_code, subject_title, assigned_teacher, room FROM classlist ORDER BY subject_code`
	rows, err := a.db.Query(query)
	if err != nil {
		// If database query fails, return mock data as fallback
		log.Printf("⚠ Database query failed, returning mock subjects: %v", err)
		return getMockSubjects(), nil
	}
	defer rows.Close()

	var subjects []Subject
	for rows.Next() {
		var subj Subject
		err := rows.Scan(&subj.ID, &subj.Code, &subj.Name, &subj.Teacher, &subj.Room)
		if err != nil {
			continue
		}
		subjects = append(subjects, subj)
	}

	// If no subjects found in database, return mock data
	if len(subjects) == 0 {
		log.Println("⚠ No subjects found in database, returning mock subjects")
		return getMockSubjects(), nil
	}

	return subjects, nil
}

// GetClassStudents returns students enrolled in a specific class
func (a *App) GetClassStudents(subjectID int) ([]ClassStudent, error) {
	// Return mock data if database is not connected
	if a.db == nil {
		log.Printf("⚠ Database not connected, returning mock students for subject %d", subjectID)
		allStudents := getMockStudents()
		var filteredStudents []ClassStudent
		for _, student := range allStudents {
			if student.SubjectID == subjectID {
				filteredStudents = append(filteredStudents, student)
			}
		}
		return filteredStudents, nil
	}

	query := `SELECT s.id, s.student_id, s.first_name, s.middle_name, s.last_name, cl.subject_id
			  FROM students s
			  INNER JOIN classlist cl ON s.class_id = cl.id
			  WHERE cl.id = ?
			  ORDER BY s.last_name, s.first_name`
	
	rows, err := a.db.Query(query, subjectID)
	if err != nil {
		log.Printf("⚠ Database query failed, returning mock students: %v", err)
		allStudents := getMockStudents()
		var filteredStudents []ClassStudent
		for _, student := range allStudents {
			if student.SubjectID == subjectID {
				filteredStudents = append(filteredStudents, student)
			}
		}
		return filteredStudents, nil
	}
	defer rows.Close()

	var students []ClassStudent
	for rows.Next() {
		var student ClassStudent
		var middleName sql.NullString
		err := rows.Scan(&student.ID, &student.StudentID, &student.FirstName, &middleName, &student.LastName, &student.SubjectID)
		if err != nil {
			continue
		}
		if middleName.Valid {
			student.MiddleName = &middleName.String
		}
		students = append(students, student)
	}

	// If no students found, return mock data
	if len(students) == 0 {
		log.Printf("⚠ No students found in database for subject %d, returning mock students", subjectID)
		allStudents := getMockStudents()
		var filteredStudents []ClassStudent
		for _, student := range allStudents {
			if student.SubjectID == subjectID {
				filteredStudents = append(filteredStudents, student)
			}
		}
		return filteredStudents, nil
	}

	return students, nil
}

// CreateSubject creates a new subject
func (a *App) CreateSubject(code, name, teacher, room string) error {
	if a.db == nil {
		return fmt.Errorf("database not connected")
	}

	query := `INSERT INTO classlist (subject_code, subject_title, assigned_teacher, room) VALUES (?, ?, ?, ?)`
	_, err := a.db.Exec(query, code, name, teacher, room)
	return err
}

// RecordAttendance records attendance
func (a *App) RecordAttendance(classID, studentID int, status string) error {
	if a.db == nil {
		return fmt.Errorf("database not connected")
	}

	query := `INSERT INTO attendance (class_id, date, student_id, status) VALUES (?, CURDATE(), ?, ?)`
	_, err := a.db.Exec(query, classID, studentID, status)
	return err
}

// ExportAttendanceCSV exports attendance to CSV
func (a *App) ExportAttendanceCSV(subjectID int) (string, error) {
	if a.db == nil {
		return "", fmt.Errorf("database not connected")
	}

	query := `SELECT id, class_id, date, student_id, time_in, time_out, status 
			  FROM attendance WHERE class_id = ? ORDER BY date DESC`
	rows, err := a.db.Query(query, subjectID)
	if err != nil {
		return "", err
	}
	defer rows.Close()

	var attendances []Attendance
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
	writer.Write([]string{"ID", "Class ID", "Date", "Student ID", "Time In", "Time Out", "Status"})

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

		writer.Write([]string{
			strconv.Itoa(att.ID),
			strconv.Itoa(att.ClassID),
			att.Date,
			strconv.Itoa(att.StudentID),
			timeIn,
			timeOut,
			att.Status,
		})
	}

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
		query = `UPDATE admins SET profile_photo = ? WHERE admin_id = ?`
	case "teacher":
		query = `UPDATE teachers SET profile_photo = ? WHERE teacher_id = ?`
	case "student":
		query = `UPDATE students SET profile_photo = ? WHERE student_id = ?`
	case "working_student":
		query = `UPDATE working_students SET profile_photo = ? WHERE student_id = ?`
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

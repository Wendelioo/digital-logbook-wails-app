package main

import (
	"fmt"
	"time"
)

// MockDataService provides mock data for development and testing
type MockDataService struct {
	users    []User
	subjects []Subject
}

// NewMockDataService creates a new mock data service with predefined data
func NewMockDataService() *MockDataService {
	return &MockDataService{
		users: []User{
			// Admin users
			{
				ID:         1,
				Username:   "admin",
				Email:      "admin@university.edu",
				Name:       "System Administrator",
				FirstName:  "System",
				LastName:   "Administrator",
				Role:       RoleAdmin,
				EmployeeID: "admin",
				Created:    time.Now().Format("2006-01-02 15:04:05"),
			},
			{
				ID:         2,
				Username:   "admin2",
				Email:      "admin2@university.edu",
				Name:       "Dela Cruz, Maria",
				FirstName:  "Maria",
				LastName:   "Dela Cruz",
				Role:       RoleAdmin,
				EmployeeID: "admin2",
				Created:    time.Now().Format("2006-01-02 15:04:05"),
			},

			// Instructor users
			{
				ID:         3,
				Username:   "instructor1",
				Email:      "mreyes@university.edu",
				Name:       "Reyes, Miguel",
				FirstName:  "Miguel",
				LastName:   "Reyes",
				Role:       RoleInstructor,
				EmployeeID: "instructor1",
				Created:    time.Now().Format("2006-01-02 15:04:05"),
			},
			{
				ID:         4,
				Username:   "instructor2",
				Email:      "sgarcia@university.edu",
				Name:       "Garcia, Sofia",
				FirstName:  "Sofia",
				LastName:   "Garcia",
				Role:       RoleInstructor,
				EmployeeID: "instructor2",
				Created:    time.Now().Format("2006-01-02 15:04:05"),
			},
			{
				ID:         5,
				Username:   "instructor3",
				Email:      "jtorres@university.edu",
				Name:       "Torres, Juan",
				FirstName:  "Juan",
				LastName:   "Torres",
				Role:       RoleInstructor,
				EmployeeID: "instructor3",
				Created:    time.Now().Format("2006-01-02 15:04:05"),
			},

			// Student users
			{
				ID:        6,
				Username:  "2025-1234",
				Name:      "Santos, Juan",
				FirstName: "Juan",
				LastName:  "Santos",
				Role:      RoleStudent,
				StudentID: "2025-1234",
				Year:      "2nd Yr BSIT",
				Created:   time.Now().Format("2006-01-02 15:04:05"),
			},
			{
				ID:        7,
				Username:  "2025-5678",
				Name:      "Cruz, Maria",
				FirstName: "Maria",
				LastName:  "Cruz",
				Role:      RoleStudent,
				StudentID: "2025-5678",
				Year:      "2nd Yr BSIT",
				Created:   time.Now().Format("2006-01-02 15:04:05"),
			},
			{
				ID:        8,
				Username:  "2025-9012",
				Name:      "Lopez, Carlos",
				FirstName: "Carlos",
				LastName:  "Lopez",
				Role:      RoleStudent,
				StudentID: "2025-9012",
				Year:      "3rd Yr BSIT",
				Created:   time.Now().Format("2006-01-02 15:04:05"),
			},
			{
				ID:        9,
				Username:  "2025-3456",
				Name:      "Martinez, Ana",
				FirstName: "Ana",
				LastName:  "Martinez",
				Role:      RoleStudent,
				StudentID: "2025-3456",
				Year:      "1st Yr BSIT",
				Created:   time.Now().Format("2006-01-02 15:04:05"),
			},
			{
				ID:        10,
				Username:  "2025-7890",
				Name:      "Rodriguez, Luis",
				FirstName: "Luis",
				LastName:  "Rodriguez",
				Role:      RoleStudent,
				StudentID: "2025-7890",
				Year:      "4th Yr BSIT",
				Created:   time.Now().Format("2006-01-02 15:04:05"),
			},

			// Working Student users
			{
				ID:        11,
				Username:  "working1",
				Name:      "Working Student 1",
				FirstName: "Working",
				LastName:  "Student",
				Role:      RoleWorkingStudent,
				StudentID: "working1",
				Created:   time.Now().Format("2006-01-02 15:04:05"),
			},
			{
				ID:        12,
				Username:  "working2",
				Name:      "Gonzalez, Pedro",
				FirstName: "Pedro",
				LastName:  "Gonzalez",
				Role:      RoleWorkingStudent,
				StudentID: "working2",
				Created:   time.Now().Format("2006-01-02 15:04:05"),
			},
		},
		subjects: []Subject{
			{ID: 1, Code: "IT101", Name: "Programming Fundamentals", Instructor: "Reyes, Miguel", Room: "Lab A"},
			{ID: 2, Code: "IT202", Name: "Database Management", Instructor: "Reyes, Miguel", Room: "Lab B"},
			{ID: 3, Code: "IT303", Name: "Web Development", Instructor: "Garcia, Sofia", Room: "Lab C"},
			{ID: 4, Code: "IT404", Name: "Software Engineering", Instructor: "Torres, Juan", Room: "Lab D"},
			{ID: 5, Code: "IT505", Name: "Network Security", Instructor: "Garcia, Sofia", Room: "Lab E"},
		},
	}
}

// MockLogin authenticates users using mock data
func (m *MockDataService) MockLogin(username, password string) (User, error) {
	// Simple password validation - in mock mode, password should match username
	if password != username {
		return User{}, fmt.Errorf("invalid password")
	}

	for _, user := range m.users {
		if user.Username == username {
			// Clear password from response
			user.Password = ""
			return user, nil
		}
	}

	return User{}, fmt.Errorf("user not found")
}

// MockLoginByEmail authenticates admin and instructor users using email
func (m *MockDataService) MockLoginByEmail(email, password string) (User, error) {
	// Simple password validation - in mock mode, password should match username
	for _, user := range m.users {
		if user.Email == email && (user.Role == RoleAdmin || user.Role == RoleInstructor) {
			// For mock mode, password should match username
			if password != user.Username {
				return User{}, fmt.Errorf("invalid credentials")
			}
			// Clear password from response
			user.Password = ""
			return user, nil
		}
	}

	return User{}, fmt.Errorf("invalid credentials")
}

// MockLoginByStudentID authenticates students and working students using student ID
func (m *MockDataService) MockLoginByStudentID(studentID, password string) (User, error) {
	// Simple password validation - in mock mode, password should match student ID
	if password != studentID {
		return User{}, fmt.Errorf("invalid credentials")
	}

	for _, user := range m.users {
		if user.StudentID == studentID && (user.Role == RoleStudent || user.Role == RoleWorkingStudent) {
			// Clear password from response
			user.Password = ""
			return user, nil
		}
	}

	return User{}, fmt.Errorf("invalid credentials")
}

// GetMockUsers returns all mock users
func (m *MockDataService) GetMockUsers() []User {
	// Clear passwords from all users
	users := make([]User, len(m.users))
	for i, user := range m.users {
		user.Password = ""
		users[i] = user
	}
	return users
}

// GetMockSubjects returns all mock subjects
func (m *MockDataService) GetMockSubjects() []Subject {
	return m.subjects
}

// GetMockUserByID returns a mock user by ID
func (m *MockDataService) GetMockUserByID(userID int) (User, error) {
	for _, user := range m.users {
		if user.ID == userID {
			// Clear password from response
			user.Password = ""
			return user, nil
		}
	}
	return User{}, fmt.Errorf("user not found")
}

// GetMockAdminDashboard returns mock admin dashboard data
func (m *MockDataService) GetMockAdminDashboard() AdminDashboard {
	return AdminDashboard{
		TotalStudents:    5,
		TotalInstructors: 3,
		WorkingStudents:  2,
		RecentLogins:     8,
	}
}

// GetMockInstructorDashboard returns mock instructor dashboard data
func (m *MockDataService) GetMockInstructorDashboard(instructorName string) InstructorDashboard {
	var subjects []Subject
	var attendance []Attendance

	// Filter subjects by instructor
	for _, subject := range m.subjects {
		if subject.Instructor == instructorName {
			subjects = append(subjects, subject)
		}
	}

	// Mock attendance data
	today := time.Now().Format("2006-01-02")
	attendance = []Attendance{
		{ID: 1, StudentID: 6, SubjectID: 1, Date: today, Status: StatusPresent, TimeIn: "08:00:00", TimeOut: "10:00:00"},
		{ID: 2, StudentID: 7, SubjectID: 1, Date: today, Status: StatusPresent, TimeIn: "08:05:00", TimeOut: "10:00:00"},
		{ID: 3, StudentID: 8, SubjectID: 1, Date: today, Status: StatusAbsent, TimeIn: "", TimeOut: ""},
		{ID: 4, StudentID: 9, SubjectID: 1, Date: today, Status: StatusSeatIn, TimeIn: "08:15:00", TimeOut: "10:00:00"},
	}

	return InstructorDashboard{
		Subjects:   subjects,
		Attendance: attendance,
	}
}

// GetMockStudentDashboard returns mock student dashboard data
func (m *MockDataService) GetMockStudentDashboard(studentID int) StudentDashboard {
	var attendance []Attendance
	var todayLog *Attendance

	// Mock attendance data
	attendance = []Attendance{
		{ID: 1, StudentID: studentID, SubjectID: 1, Date: "2024-01-15", Status: StatusPresent, TimeIn: "08:00:00", TimeOut: "10:00:00"},
		{ID: 2, StudentID: studentID, SubjectID: 2, Date: "2024-01-16", Status: StatusPresent, TimeIn: "10:00:00", TimeOut: "12:00:00"},
		{ID: 3, StudentID: studentID, SubjectID: 1, Date: "2024-01-17", Status: StatusAbsent, TimeIn: "", TimeOut: ""},
	}

	// Mock today's log
	today := time.Now().Format("2006-01-02")
	todayLog = &Attendance{
		ID:        4,
		StudentID: studentID,
		SubjectID: 1,
		Date:      today,
		Status:    StatusPresent,
		TimeIn:    "08:00:00",
		TimeOut:   "10:00:00",
	}

	return StudentDashboard{
		Attendance: attendance,
		TodayLog:   todayLog,
	}
}

// GetMockWorkingStudentDashboard returns mock working student dashboard data
func (m *MockDataService) GetMockWorkingStudentDashboard() WorkingStudentDashboard {
	return WorkingStudentDashboard{
		StudentsRegistered: 5,
		ClasslistsCreated:  3,
	}
}

// PrintMockCredentials prints all mock user credentials for easy reference
func (m *MockDataService) PrintMockCredentials() {
	fmt.Println("\n=== MOCK LOGIN CREDENTIALS ===")
	fmt.Println("Use these credentials for testing without database connection:")
	fmt.Println()

	fmt.Println("ADMIN USERS:")
	fmt.Println("  Username: admin, Password: admin")
	fmt.Println("  Username: admin2, Password: admin2")
	fmt.Println("  Email: admin@university.edu, Password: admin")
	fmt.Println("  Email: admin2@university.edu, Password: admin2")
	fmt.Println()

	fmt.Println("INSTRUCTOR USERS:")
	fmt.Println("  Username: instructor1, Password: instructor1")
	fmt.Println("  Username: instructor2, Password: instructor2")
	fmt.Println("  Username: instructor3, Password: instructor3")
	fmt.Println("  Email: mreyes@university.edu, Password: instructor1")
	fmt.Println("  Email: sgarcia@university.edu, Password: instructor2")
	fmt.Println("  Email: jtorres@university.edu, Password: instructor3")
	fmt.Println()

	fmt.Println("STUDENT USERS:")
	fmt.Println("  Student ID: 2025-1234, Password: 2025-1234")
	fmt.Println("  Student ID: 2025-5678, Password: 2025-5678")
	fmt.Println("  Student ID: 2025-9012, Password: 2025-9012")
	fmt.Println("  Student ID: 2025-3456, Password: 2025-3456")
	fmt.Println("  Student ID: 2025-7890, Password: 2025-7890")
	fmt.Println()

	fmt.Println("WORKING STUDENT USERS:")
	fmt.Println("  Student ID: working1, Password: working1")
	fmt.Println("  Student ID: working2, Password: working2")
	fmt.Println()

	fmt.Println("NOTE: In mock mode, password should match the username/student ID")
	fmt.Println("=====================================\n")
}

# Digital Logbook Monitoring System - Modules Documentation

## Project Overview
This is a Wails-based desktop application for digital logbook monitoring with a React frontend and Go backend. The system manages attendance tracking, user management, and class administration for educational institutions.

## Architecture
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Go with MySQL database
- **Framework**: Wails v2
- **Authentication**: Role-based access control

---

## Frontend Modules

### 1. Core Application Structure

#### `App.tsx`
- **Purpose**: Main application component with routing and authentication
- **Features**:
  - Role-based route protection
  - Authentication context provider
  - Route definitions for all user types
- **Routes**:
  - `/login` - Authentication page
  - `/admin/*` - Admin dashboard routes
  - `/instructor/*` - Instructor dashboard routes
  - `/student/*` - Student dashboard routes
  - `/working-student/*` - Working student dashboard routes

#### `main.tsx`
- **Purpose**: Application entry point
- **Features**: React app initialization and rendering

### 2. Authentication & Context

#### `contexts/AuthContext.tsx`
- **Purpose**: Global authentication state management
- **Features**:
  - User login/logout functionality
  - Multiple login methods (username, email, student ID)
  - Persistent session storage
  - User role management
- **Methods**:
  - `login(username, password)`
  - `loginByEmail(email, password)`
  - `loginByStudentID(studentID, password)`
  - `logout()`

### 3. Layout Components

#### `components/Layout.tsx`
- **Purpose**: Shared layout wrapper for all dashboard pages
- **Features**:
  - Responsive sidebar navigation
  - User profile dropdown
  - Mobile-responsive design
  - Role-based navigation items
- **Props**:
  - `navigationItems`: Array of navigation menu items
  - `title`: Page title
  - `children`: Page content

### 4. Page Components

#### `pages/LoginPage.tsx`
- **Purpose**: User authentication interface
- **Features**:
  - Role selection (Student, Working Student, Instructor, Admin)
  - Dynamic form fields based on selected role
  - Input validation and error handling
  - Responsive design with illustration
- **Login Types**:
  - Students: Student ID + Password
  - Working Students: Student ID + Password
  - Instructors: Email/Username + Password
  - Admins: Email/Username + Password

#### `pages/AdminDashboard.tsx`
- **Purpose**: Administrative interface for system management
- **Sub-modules**:
  - **Dashboard Overview**: System statistics and quick actions
  - **User Management**: CRUD operations for all user types
    - Excel-like table with sorting, filtering, pagination
    - Bulk operations (copy, delete)
    - Role-specific user creation forms
  - **View Logs**: System activity logs (placeholder)
  - **Reports**: Data export functionality (placeholder)
- **Features**:
  - User statistics dashboard
  - Advanced user management with filtering
  - CSV export functionality
  - Role-based user creation

#### `pages/InstructorDashboard.tsx`
- **Purpose**: Instructor interface for class and attendance management
- **Sub-modules**:
  - **Dashboard Overview**: Personal statistics and assigned subjects
  - **Class Lists**: View and manage assigned subjects
  - **Attendance Management**: Record and track student attendance
- **Features**:
  - Subject assignment display
  - Attendance recording interface
  - CSV export for attendance data
  - Real-time attendance tracking

#### `pages/StudentDashboard.tsx`
- **Purpose**: Student interface for personal attendance tracking
- **Sub-modules**:
  - **Dashboard Overview**: Personal attendance summary and today's log
  - **My Attendance**: Complete attendance history
  - **Feedback**: Equipment condition reporting
- **Features**:
  - Attendance statistics (Present, Absent, Seat-in)
  - Today's attendance status
  - Equipment feedback submission
  - Historical attendance records

#### `pages/WorkingStudentDashboard.tsx`
- **Purpose**: Working student interface for administrative assistance
- **Sub-modules**:
  - **Dashboard Overview**: Activity summary and quick actions
  - **Register Student**: Create new student accounts
  - **Create Class List**: Manage subject class lists
  - **Assist Seat-in**: Help with seat-in student registration
- **Features**:
  - Student registration with default passwords
  - Subject and class list management
  - Seat-in student assistance
  - Administrative statistics

### 5. Styling & Assets

#### `style.css` & `App.css`
- **Purpose**: Global styles and component-specific styling
- **Features**: Tailwind CSS integration and custom styles

#### `assets/`
- **Purpose**: Static assets including illustrations and images
- **Contents**: Welcome illustration for login page

---

## Backend Modules

### 1. Core Application

#### `app.go`
- **Purpose**: Main backend application structure and business logic
- **Features**:
  - Database connection management
  - Authentication and authorization
  - User management
  - Attendance tracking
  - Data export functionality
- **Key Components**:
  - **App struct**: Main application container
  - **Database models**: User, Subject, Attendance, etc.
  - **Authentication methods**: Multiple login types
  - **Dashboard data providers**: Role-specific dashboard data

#### `main.go`
- **Purpose**: Application entry point and Wails initialization

#### `config.go`
- **Purpose**: Configuration management for database and application settings

### 2. Data Models

#### User Management
- **User struct**: Complete user information with role-based fields
- **Roles**: Admin, Instructor, Student, Working Student
- **Authentication**: Argon2 password hashing
- **Features**: Role-specific user creation and management

#### Subject Management
- **Subject struct**: Course/subject information
- **Classlist struct**: Student enrollment management
- **Features**: Subject creation and assignment

#### Attendance System
- **Attendance struct**: Daily attendance records
- **Status types**: Present, Absent, Seat-in
- **Features**: Time tracking and status management

#### Feedback System
- **Feedback struct**: Equipment condition reporting
- **Features**: Student feedback submission and tracking

### 3. Database Layer

#### Database Schema
- **users**: User accounts with role-based fields
- **subjects**: Course/subject information
- **classlists**: Student enrollment records
- **attendance**: Daily attendance logs
- **login_logs**: Authentication tracking
- **feedback**: Equipment feedback records

#### Database Operations
- **Connection management**: MySQL with connection pooling
- **Table creation**: Automatic schema initialization
- **Sample data**: Default users and subjects
- **Data integrity**: Foreign key constraints and validation

### 4. Authentication & Security

#### Password Security
- **Argon2 hashing**: Industry-standard password hashing
- **Salt generation**: Random salt for each password
- **Verification**: Secure password comparison

#### Role-Based Access
- **Multiple login methods**: Username, email, student ID
- **Role validation**: Route protection based on user roles
- **Session management**: Persistent login sessions

### 5. Data Export & Reporting

#### CSV Export
- **User export**: Complete user data with all fields
- **Attendance export**: Subject-specific attendance records
- **File generation**: Timestamped CSV files

#### Dashboard Analytics
- **Admin dashboard**: System-wide statistics
- **Instructor dashboard**: Personal class and attendance data
- **Student dashboard**: Personal attendance history
- **Working student dashboard**: Administrative activity summary

### 6. Mock Data System

#### `mock_data.go`
- **Purpose**: Development and testing data provider
- **Features**:
  - Sample users for all roles
  - Mock attendance records
  - Test data for development
- **Usage**: Fallback when database is unavailable

---

## Configuration & Setup

### 1. Environment Configuration

#### `env_config.txt`
- **Purpose**: Environment variable documentation
- **Contents**: Database connection settings and application configuration

#### `wails.json`
- **Purpose**: Wails framework configuration
- **Features**: Build settings, asset management, and application metadata

### 2. Database Setup

#### `mysql_workbench_setup_updated.sql`
- **Purpose**: Database schema and initial data
- **Features**: Complete database structure with sample data

#### `setup_mysql.bat`
- **Purpose**: Windows batch script for MySQL setup
- **Features**: Automated database initialization

### 3. Build & Development

#### `build.bat` & `dev.bat`
- **Purpose**: Build and development scripts
- **Features**: Automated build and development server startup

#### `go.mod` & `go.sum`
- **Purpose**: Go module dependencies
- **Key dependencies**: Wails, MySQL driver, Argon2

---

## Key Features by Module

### Authentication Module
- Multi-role login system
- Secure password hashing
- Session persistence
- Role-based route protection

### User Management Module
- CRUD operations for all user types
- Role-specific user creation
- Advanced filtering and sorting
- Bulk operations support

### Attendance Module
- Real-time attendance tracking
- Multiple attendance statuses
- Time-based logging
- Export functionality

### Dashboard Module
- Role-specific dashboards
- Real-time statistics
- Quick action interfaces
- Responsive design

### Reporting Module
- CSV data export
- Attendance reports
- User management reports
- System analytics

---

## Technology Stack

### Frontend
- **React 18**: Component-based UI framework
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **Lucide React**: Icon library

### Backend
- **Go 1.21+**: Backend programming language
- **Wails v2**: Desktop app framework
- **MySQL**: Relational database
- **Argon2**: Password hashing
- **GORM**: Database ORM (implied)

### Development Tools
- **Vite**: Frontend build tool
- **PostCSS**: CSS processing
- **ESLint**: Code linting
- **TypeScript**: Type checking

---

## Module Dependencies

### Frontend Dependencies
```
React → AuthContext → All Dashboard Components
Layout → All Page Components
App.tsx → All Routes and Authentication
```

### Backend Dependencies
```
app.go → Database Models → Business Logic
Authentication → User Management → Dashboard Data
Mock Data → Development/Testing → Production Database
```

### Cross-Platform Integration
```
Wails → Frontend (React) ↔ Backend (Go)
Database ↔ Business Logic ↔ API Endpoints
Authentication ↔ Route Protection ↔ User Interface
```

---

This modular architecture provides a scalable, maintainable, and secure digital logbook monitoring system with clear separation of concerns and role-based access control.

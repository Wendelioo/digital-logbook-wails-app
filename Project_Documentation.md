# Project Documentation: Logbook Monitoring System

## 6. Network Design

### 6.1 Network Model

The Logbook Monitoring System employs a **client-server network model**. In this architecture:

- **Client**: The desktop application built with Wails framework serves as the client interface. It provides the user interface for different roles (Admin, Instructor, Student, Working Student) and handles user interactions, data presentation, and business logic processing.

- **Server**: MySQL database server acts as the central data repository. It stores all application data including user accounts, attendance records, subjects, class lists, login logs, and feedback information.

The client communicates with the server through standard MySQL protocol over TCP/IP connections. The application establishes persistent database connections during runtime to perform CRUD (Create, Read, Update, Delete) operations on the stored data.

### 6.2 Network Topology

The system utilizes a **star network topology** where:

- **Central Node**: MySQL database server running on localhost (default configuration) or a remote server
- **Peripheral Nodes**: Desktop client applications running on individual workstations

```
[Desktop Client 1] ──┐
                     │
[Desktop Client 2] ──┼── [MySQL Server]
                     │
[Desktop Client 3] ──┘
```

Key characteristics:
- Direct communication between each client and the central database server
- No client-to-client communication required
- Centralized data management and consistency
- Suitable for educational institution environments with multiple users accessing the same database

## 7. Development/Construction/Build Phase

### 7.1 Technology Stack Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Logbook Monitoring System                │
├─────────────────────────────────────────────────────────────┤
│  Frontend Layer (Web Technologies in Desktop App)           │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  React + TypeScript + Vite                             │ │
│  │  - Component-based UI architecture                     │ │
│  │  - Type-safe development                               │ │
│  │  - Fast build and hot reload                           │ │
│  └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Styling & UI Framework                                     │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  TailwindCSS + Lucide React Icons                      │ │
│  │  - Utility-first CSS framework                         │ │
│  │  - Consistent iconography                              │ │
│  └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Desktop Framework                                          │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Wails v2 Framework                                    │ │
│  │  - Go backend + Web frontend                           │ │
│  │  - Native desktop application                          │ │
│  │  - Cross-platform support (Windows/macOS/Linux)        │ │
│  └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Backend Layer                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Go Programming Language                               │ │
│  │  - High performance backend services                   │ │
│  │  - Database operations                                 │ │
│  │  - Business logic implementation                       │ │
│  └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Database Layer                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  MySQL Database                                         │ │
│  │  - Relational data storage                             │ │
│  │  - ACID compliance                                      │ │
│  │  - Structured query support                            │ │
│  └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Development Tools                                          │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Node.js + npm (Frontend dependencies)                 │ │
│  │  Go Modules (Backend dependencies)                     │ │
│  │  Git (Version control)                                 │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Hardware Specification

#### Minimum System Requirements
- **Operating System**: Windows 10/11, macOS 10.13+, or Linux (Ubuntu 18.04+)
- **Processor**: Intel Core i3 or equivalent (2 GHz or higher)
- **Memory (RAM)**: 4 GB minimum, 8 GB recommended
- **Storage**: 500 MB free disk space for application, additional space for database
- **Display**: 1024x768 resolution minimum, 1200x800 recommended

#### Development Environment Requirements
- **Go**: Version 1.23 or higher
- **Node.js**: Version 16 or higher
- **npm**: Latest stable version (comes with Node.js)
- **MySQL Server**: Version 5.7 or higher (8.0 recommended)
- **Git**: For version control and dependency management

#### Database Server Requirements
- **MySQL Server**: Dedicated or shared MySQL instance
- **Storage**: Sufficient disk space for database files (depends on usage)
- **Memory**: Minimum 2 GB RAM for MySQL server
- **Network**: TCP/IP connectivity for database connections

### 7.3 Program Specification

#### Core Functionality
1. **User Authentication & Authorization**
   - Role-based login system (Admin, Instructor, Student, Working Student)
   - Secure password management
   - Session management with localStorage

2. **User Management (Admin)**
   - Create, read, update, delete user accounts
   - Role assignment and management
   - Bulk operations and CSV export
   - User profile management

3. **Attendance Management**
   - Real-time attendance recording (Present, Absent, Seat-in)
   - Time-in/Time-out logging with timestamps
   - Daily attendance summaries
   - Historical attendance tracking

4. **Subject & Class Management**
   - Subject creation and management
   - Class list creation and assignment
   - Student enrollment management

5. **Dashboard Analytics**
   - Admin: System statistics (user counts, recent logins)
   - Instructor: Assigned subjects and daily attendance
   - Student: Personal attendance records and today's log
   - Working Student: Registration and class list statistics

6. **Reporting System**
   - CSV export for attendance records
   - User data export functionality
   - Custom date range filtering
   - Statistical reporting

7. **Feedback System**
   - Student equipment feedback submission
   - Condition reporting and comments
   - Feedback history and management

#### Technical Specifications
- **Database Tables**: 6 core tables (users, subjects, classlists, attendance, login_logs, feedback)
- **API Endpoints**: 20+ backend methods for data operations
- **User Roles**: 4 distinct user types with specific permissions
- **Data Export**: CSV format support for reports
- **UI Components**: Responsive design with role-based navigation

## 10. Technical Background

### Wails Framework
Wails v2 is a modern desktop application framework that combines the power of Go with web technologies. It allows developers to build native desktop applications using Go for the backend and HTML/CSS/JavaScript for the frontend. Key benefits include:

- **Cross-platform**: Single codebase for Windows, macOS, and Linux
- **Performance**: Go backend provides excellent performance for data operations
- **Web Technologies**: Familiar web development stack for UI
- **Native Integration**: Access to system resources and native OS features

### Go Programming Language
Chosen for the backend due to:
- **Compiled Language**: High performance and low resource usage
- **Strong Typing**: Compile-time error checking and type safety
- **Concurrency**: Excellent support for concurrent operations
- **Standard Library**: Rich set of built-in packages for database operations, HTTP handling, etc.
- **MySQL Driver**: Mature and well-maintained MySQL connectivity

### React + TypeScript Frontend
The frontend utilizes modern web technologies:
- **React**: Component-based architecture for maintainable UI
- **TypeScript**: Type safety and better developer experience
- **Vite**: Fast build tool with hot module replacement
- **TailwindCSS**: Utility-first CSS framework for consistent styling
- **React Router**: Client-side routing for single-page application experience

### MySQL Database
Selected for data persistence because:
- **Relational Model**: Structured data storage suitable for educational records
- **ACID Compliance**: Data integrity and transaction support
- **SQL Standard**: Widely supported query language
- **Performance**: Efficient for read/write operations in educational environment
- **Scalability**: Can handle multiple concurrent users

### Development Methodology
The project follows modern development practices:
- **Modular Architecture**: Separation of concerns between frontend and backend
- **Version Control**: Git for source code management
- **Package Management**: Go modules and npm for dependency management
- **Build Automation**: Wails CLI for cross-platform builds
- **Database Migrations**: Automatic table creation and sample data insertion

This technology stack provides a robust, maintainable, and scalable solution for educational institution logbook management while ensuring cross-platform compatibility and modern user experience.

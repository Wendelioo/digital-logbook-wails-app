# Mock Data Login System

This application now supports mock data for user login without requiring a database connection. This is perfect for development, testing, and demonstrations.

## Quick Start

The application is configured to use mock data by default. Simply run the application and use the provided credentials below.

## Mock Login Credentials

### Admin Users (Login with Username)
- **Username:** `admin`, **Password:** `admin`
- **Username:** `admin2`, **Password:** `admin2`

### Instructor Users (Login with Employee ID)
- **Employee ID:** `EMP-001`, **Password:** `EMP-001` (Miguel Reyes)
- **Employee ID:** `EMP-002`, **Password:** `EMP-002` (Sofia Garcia)
- **Employee ID:** `EMP-003`, **Password:** `EMP-003` (Juan Torres)

### Student Users (Login with Student ID)
- **Student ID:** `2025-1234`, **Password:** `2025-1234` (Juan Santos)
- **Student ID:** `2025-5678`, **Password:** `2025-5678` (Maria Cruz)
- **Student ID:** `2025-9012`, **Password:** `2025-9012` (Carlos Lopez)
- **Student ID:** `2025-3456`, **Password:** `2025-3456` (Ana Martinez)
- **Student ID:** `2025-7890`, **Password:** `2025-7890` (Luis Rodriguez)

### Working Student Users (Login with Student ID)
- **Student ID:** `2025-WS01`, **Password:** `2025-WS01` (Jose Rivera)
- **Student ID:** `2025-WS02`, **Password:** `2025-WS02` (Pedro Gonzalez)

## Configuration

### Using Mock Data (Default)
The application uses mock data by default. No configuration needed.

### Switching to Database Mode
To use the actual database instead of mock data, set the environment variable:
```bash
export USE_MOCK_DATA=false
```

Or create a `.env` file with:
```
USE_MOCK_DATA=false
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=logbookdb
```

## Features Available in Mock Mode

- ✅ User authentication for all roles
- ✅ Dashboard data for all user types
- ✅ User management (view users)
- ✅ Subject management
- ✅ Mock attendance data
- ✅ Role-based navigation

## Running the Application

1. **With Mock Data (Recommended for testing):**
   ```bash
   go run .
   ```

2. **With Database:**
   ```bash
   export USE_MOCK_DATA=false
   go run .
   ```

## Notes

- In mock mode, passwords match the credential ID (Username for Admin, Employee ID for Instructors, Student ID for Students/Working Students)
- All dashboard data is pre-populated with realistic mock data
- The application will automatically fall back to mock mode if database connection fails
- Mock credentials are printed to the console when the application starts in mock mode
- **Login Form Labels:**
  - Admin: Username, Password
  - Instructor: Employee ID, Password
  - Student: Student ID, Password
  - Working Student: Student ID, Password

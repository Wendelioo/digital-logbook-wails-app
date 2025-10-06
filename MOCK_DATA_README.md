# Mock Data Login System

This application now supports mock data for user login without requiring a database connection. This is perfect for development, testing, and demonstrations.

## Quick Start

The application is configured to use mock data by default. Simply run the application and use the provided credentials below.

## Mock Login Credentials

### Admin Users
- **Username:** `admin`, **Password:** `admin`
- **Username:** `admin2`, **Password:** `admin2`
- **Email:** `admin@university.edu`, **Password:** `admin`
- **Email:** `admin2@university.edu`, **Password:** `admin2`

### Instructor Users
- **Username:** `instructor1`, **Password:** `instructor1`
- **Username:** `instructor2`, **Password:** `instructor2`
- **Username:** `instructor3`, **Password:** `instructor3`
- **Email:** `mreyes@university.edu`, **Password:** `instructor1`
- **Email:** `sgarcia@university.edu`, **Password:** `instructor2`
- **Email:** `jtorres@university.edu`, **Password:** `instructor3`

### Student Users
- **Student ID:** `2025-1234`, **Password:** `2025-1234`
- **Student ID:** `2025-5678`, **Password:** `2025-5678`
- **Student ID:** `2025-9012`, **Password:** `2025-9012`
- **Student ID:** `2025-3456`, **Password:** `2025-3456`
- **Student ID:** `2025-7890`, **Password:** `2025-7890`

### Working Student Users
- **Student ID:** `working1`, **Password:** `working1`
- **Student ID:** `working2`, **Password:** `working2`

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

- In mock mode, passwords should match the username/student ID
- All dashboard data is pre-populated with realistic mock data
- The application will automatically fall back to mock mode if database connection fails
- Mock credentials are printed to the console when the application starts in mock mode

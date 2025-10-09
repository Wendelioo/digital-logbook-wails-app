# Digital Logbook - Wails App

A modern desktop application for monitoring and managing student computer laboratory usage, built with Go and React.

## Features

- 🔐 Multi-role authentication (Admin, Instructor, Student, Working Student)
- 👥 User management system
- 📊 Dashboard analytics for all user roles
- 📝 Attendance tracking
- 💻 PC-based login monitoring with hostname detection
- 🔧 Equipment condition reporting
- 📄 Export logs and reports to CSV and PDF
- 🗄️ MySQL database integration

## Prerequisites

- **Go** 1.21 or higher
- **Node.js** 16+ and npm
- **Wails CLI** v2.10.2
- **MySQL** 8.0+ or MariaDB 10.5+

## Installation

### 1. Install Wails CLI

```bash
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

### 2. Clone the Repository

```bash
git clone <repository-url>
cd digital-logbook-wails-app
```

### 3. Set Up Database

The application uses a **real MySQL database by default**. Follow the complete guide in `DATABASE_SETUP.md` to:
- Install MySQL
- Create the database
- Configure credentials

**Quick Database Setup:**

```bash
# Option 1: Use the setup script (easiest)
./setup_database.sh

# Option 2: Use SQL files
mysql -u root -p < database_quick_setup.sql

# Option 3: Manual setup
sudo apt install mysql-server -y
sudo systemctl start mysql
sudo mysql
```

```sql
CREATE DATABASE logbookdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

The app will automatically create tables and insert sample data on first run.

**SQL Files Available:**
- `schema.sql` - Complete schema with views and triggers
- `database_quick_setup.sql` - Quick minimal setup
- `sample_data.sql` - Data structure reference
- See `SQL_FILES_README.md` for details

### 4. Install Dependencies

```bash
# Install Go dependencies
go mod tidy

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 5. Run the Application

```bash
wails dev
```

## Default Login Credentials

After database setup, use these credentials:

| Role             | Credential Type | ID/Email              | Password   |
|------------------|----------------|-----------------------|------------|
| Admin            | Employee ID    | `admin`               | `admin123` |
| Instructor       | Employee ID    | `instructor1`         | `inst123`  |
| Student          | Student ID     | `2025-1234`           | `2025-1234`|
| Working Student  | Student ID     | `working1`            | `working1` |

## Configuration

### Database Settings

Edit `config.go` or set environment variables:

```bash
export DB_HOST=localhost
export DB_PORT=3306
export DB_USERNAME=root
export DB_PASSWORD=wendel
export DB_DATABASE=logbookdb
```


## Project Structure

```
digital-logbook-wails-app/
├── app.go                      # Main backend logic
├── config.go                   # Database configuration
├── main.go                     # Application entry point
├── mock_data.go                # Mock data service (optional)
├── frontend/
│   ├── src/
│   │   ├── App.tsx            # Main React component
│   │   ├── pages/             # Dashboard pages
│   │   ├── components/        # Reusable components
│   │   └── contexts/          # Auth context
│   └── wailsjs/               # Generated Wails bindings
├── DATABASE_SETUP.md          # Complete database guide
├── ADMIN_LOGIN_UPDATE.md      # Admin login documentation
└── HOSTNAME_FEATURE_SUMMARY.md # Hostname tracking docs
```

## Key Features by Role

### Admin Dashboard
- View all users (students, instructors, working students)
- User management (create, edit, delete)
- View login logs with PC numbers
- View equipment reports
- Export data to CSV/PDF

### Instructor Dashboard
- View assigned subjects
- Monitor student attendance
- Track classroom activities

### Student Dashboard
- View personal attendance records
- Submit equipment condition reports
- Track lab usage history

### Working Student Dashboard
- Register new students
- Create class lists
- Manage student records

## Building for Production

```bash
# Build for current platform
wails build

# Build for specific platform
wails build -platform linux/amd64
wails build -platform windows/amd64
wails build -platform darwin/amd64
```

The compiled binary will be in `build/bin/`

## Documentation

- **Database Setup**: `DATABASE_SETUP.md` - Complete MySQL setup guide
- **SQL Files**: `SQL_FILES_README.md` - SQL schema and setup files
- **Admin Login**: `ADMIN_LOGIN_UPDATE.md` - Admin authentication details
- **Hostname Feature**: `HOSTNAME_FEATURE_SUMMARY.md` - PC tracking documentation
- **Changes Summary**: `CHANGES_SUMMARY.md` - Recent changes and updates

## Technologies Used

### Backend
- **Go** - Primary backend language
- **Wails** - Desktop application framework
- **MySQL Driver** - Database connectivity
- **gofpdf** - PDF generation
- **argon2** - Password hashing

### Frontend
- **React** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library
- **Vite** - Build tool

## Troubleshooting

### Database Connection Failed

1. Verify MySQL is running:
   ```bash
   sudo systemctl status mysql
   ```

2. Test database connection:
   ```bash
   mysql -u root -pwendel logbookdb
   ```

3. Check application logs in the terminal

### Export Features Not Working

- Ensure you're NOT in mock data mode
- Check database connection
- Verify `~/Downloads` folder exists

### Application Crashes on Export

This issue has been fixed. Make sure you're running the latest version.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Check the documentation files in the project root
- Review MySQL error logs
- Check application terminal output for detailed errors

## Acknowledgments

- Built with [Wails](https://wails.io/)
- UI inspired by modern web applications
- Icons by [Lucide](https://lucide.dev/)


@echo off
echo Setting up MySQL for Logbook Monitoring System...

echo.
echo This script will help you set up MySQL for the Logbook Monitoring System.
echo Make sure MySQL is installed and running on your system.
echo.

echo Step 1: Creating database and user...
mysql -u root -p < setup_mysql.sql

echo.
echo Step 2: Testing connection...
echo Please make sure MySQL is running and accessible.
echo.

echo Step 3: Environment variables (optional)
echo You can set these environment variables to customize your database connection:
echo.
echo   DB_HOST=localhost
echo   DB_PORT=3306
echo   DB_USERNAME=root
echo   DB_PASSWORD=your_password
echo   DB_DATABASE=logbook_db
echo.

echo Setup completed! You can now run the application.
echo.
echo To run the application:
echo   wails dev          (for development)
echo   wails build        (for production build)
echo.
pause

@echo off
echo Starting Logbook Monitoring System in development mode...

echo.
echo Checking MySQL setup...
echo Make sure MySQL is running and the database is set up.
echo If not, run setup_mysql.bat first.
echo.

echo.
echo Installing Go dependencies...
go mod tidy

echo.
echo Installing frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo Error installing frontend dependencies
    pause
    exit /b 1
)

cd ..

echo.
echo Starting development server...
echo The application will open in a new window.
echo Press Ctrl+C to stop the development server.

wails dev

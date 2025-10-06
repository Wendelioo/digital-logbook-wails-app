@echo off
echo Building Logbook Monitoring System...

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

echo.
echo Building frontend...
call npm run build
if %errorlevel% neq 0 (
    echo Error building frontend
    pause
    exit /b 1
)

cd ..

echo.
echo Building Wails application...
wails build
if %errorlevel% neq 0 (
    echo Error building Wails application
    pause
    exit /b 1
)

echo.
echo Build completed successfully!
echo You can find the executable in the build/bin directory.
pause

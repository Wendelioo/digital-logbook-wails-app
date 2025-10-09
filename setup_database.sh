#!/bin/bash

# Digital Logbook - Database Setup Script
# This script automates MySQL installation and database creation

set -e  # Exit on error

echo "============================================"
echo "Digital Logbook - Database Setup"
echo "============================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Database configuration (from config.go defaults)
DB_HOST="localhost"
DB_PORT="3306"
DB_USERNAME="root"
DB_PASSWORD="wendel"
DB_DATABASE="logbookdb"

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if running on Linux
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    print_error "This script is designed for Linux systems"
    echo "Please follow the manual setup instructions in DATABASE_SETUP.md"
    exit 1
fi

# Check if MySQL is already installed
print_info "Checking for MySQL installation..."
if command -v mysql &> /dev/null; then
    print_success "MySQL client is already installed"
    MYSQL_INSTALLED=true
else
    print_info "MySQL not found. Will install MySQL server."
    MYSQL_INSTALLED=false
fi

# Check if MySQL server is running
if systemctl is-active --quiet mysql 2>/dev/null; then
    print_success "MySQL service is running"
    MYSQL_RUNNING=true
elif systemctl is-active --quiet mariadb 2>/dev/null; then
    print_success "MariaDB service is running"
    MYSQL_RUNNING=true
else
    MYSQL_RUNNING=false
fi

# Install MySQL if not installed
if [ "$MYSQL_INSTALLED" = false ]; then
    print_info "Installing MySQL server..."
    echo ""
    
    # Detect distribution
    if [ -f /etc/debian_version ]; then
        # Debian/Ubuntu
        sudo apt update
        sudo apt install mysql-server -y
    elif [ -f /etc/redhat-release ]; then
        # RHEL/Fedora/CentOS
        sudo dnf install mysql-server -y
    elif [ -f /etc/arch-release ]; then
        # Arch Linux
        sudo pacman -S mysql --noconfirm
    else
        print_error "Unsupported distribution. Please install MySQL manually."
        exit 1
    fi
    
    print_success "MySQL installed successfully"
fi

# Start MySQL service if not running
if [ "$MYSQL_RUNNING" = false ]; then
    print_info "Starting MySQL service..."
    
    if systemctl start mysql 2>/dev/null; then
        systemctl enable mysql
        print_success "MySQL service started and enabled"
    elif systemctl start mariadb 2>/dev/null; then
        systemctl enable mariadb
        print_success "MariaDB service started and enabled"
    else
        print_error "Failed to start MySQL service"
        exit 1
    fi
fi

# Wait for MySQL to be ready
print_info "Waiting for MySQL to be ready..."
sleep 3

# Create database
print_info "Creating database: $DB_DATABASE"
echo ""

# Try to create database without password first
if sudo mysql -e "CREATE DATABASE IF NOT EXISTS $DB_DATABASE CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null; then
    print_success "Database created successfully"
    
    # Set root password if it's not set
    print_info "Setting root password..."
    sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED BY '$DB_PASSWORD';" 2>/dev/null || true
    sudo mysql -e "FLUSH PRIVILEGES;" 2>/dev/null || true
    
elif mysql -u root -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $DB_DATABASE CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null; then
    print_success "Database created successfully"
else
    print_error "Failed to create database"
    echo ""
    echo "Please run manually:"
    echo "  sudo mysql"
    echo "  CREATE DATABASE $DB_DATABASE CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    exit 1
fi

# Verify database creation
print_info "Verifying database..."
if mysql -u root -p"$DB_PASSWORD" -e "USE $DB_DATABASE;" 2>/dev/null; then
    print_success "Database verification successful"
elif sudo mysql -e "USE $DB_DATABASE;" 2>/dev/null; then
    print_success "Database verification successful"
else
    print_error "Database verification failed"
    exit 1
fi

echo ""
echo "============================================"
print_success "Database setup completed!"
echo "============================================"
echo ""
echo "Configuration:"
echo "  Host:     $DB_HOST"
echo "  Port:     $DB_PORT"
echo "  Username: $DB_USERNAME"
echo "  Password: $DB_PASSWORD"
echo "  Database: $DB_DATABASE"
echo ""
echo "Next steps:"
echo "  1. Run: wails dev"
echo "  2. The app will automatically create tables and sample data"
echo "  3. Login with default credentials:"
echo "     - Admin: Employee ID 'admin', Password 'admin123'"
echo "     - Instructor: Employee ID 'instructor1', Password 'inst123'"
echo ""
print_info "See DATABASE_SETUP.md for more information"
echo ""


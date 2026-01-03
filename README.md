 Ni hao!
 We are group of 4th year BSIT student developing an digital logbook desktop application. 

Quick Overview:

**Digital Logbook – Wails App**
-A modern desktop application for monitoring and managing student computer laboratory usage. This system is built with Go and Wails, designed to help schools replace traditional logbooks with a secure and efficient digital solution.

-The project focuses on accurate attendance tracking, role-based access, and easy reporting for administrators and teachers.

**Features:**
Multi-role authentication (Admin, Teacher, Student, Working Student)
User management system
Dashboard analytics for all user roles
Attendance and time-in/time-out tracking
PC-based login monitoring with hostname detection
Equipment condition and issue reporting
Export logs and reports to CSV and PDF
MySQL database integration

**Prerequisites:**
-Before running the application in development mode, make sure the following tools are installed on your machine.
**Node.js**
-Download and install Node.js (LTS version recommended) from:
[https://nodejs.org/en/download](https://nodejs.org/en/download)

-Verify the installation:
>node -v
>npm -v

**Golang**
-Download and install Go from:
[https://go.dev/doc/install](https://go.dev/doc/install)

Verify the installation:
>go version

**Wails CLI**
Install Wails using Go:
>go install github.com/wailsapp/wails/v2/cmd/wails@latest

-Add the Go bin directory to your PATH:

>Windows: `%USERPROFILE%\go\bin`
>macOS / Linux: `$GOPATH/bin`

-Verify the installation:
>wails doctor

**MySQL Server**
-Install MySQL Server to store application data such as user accounts, attendance logs, and reports.

-Download MySQL from:
[https://dev.mysql.com/downloads/mysql/](https://dev.mysql.com/downloads/mysql/)

-Make sure the MySQL service is running before starting the application.

**MySQL Workbench**
-Install MySQL Workbench for managing the database, running queries, and importing/exporting data.

Download MySQL Workbench from:
[https://dev.mysql.com/downloads/workbench/](https://dev.mysql.com/downloads/workbench/)
-This tool is recommended for database setup and maintenance during development.

**Cloning the Repository:**
Clone the repository and navigate into the project folder:
>git clone https://github.com/your-org/digital-logbook-wails.git
>cd digital-logbook-wails
-Replace the repository link with the actual project URL.

**Installing Project Dependencies:**
Inside the project directory, install the frontend dependencies:

>npm install

**Running the App in Development Mode:**
-To start the application in development mode, run:
>wails dev

**This will:**
 1. Start the Go backend
 2. Launch the frontend (React)
 3. Open the desktop application window with live reload enabled

**Building for Production:**
When the application is ready for deployment, build the production executable:
>wails build
-This will generate the installer or executable file for your operating system.

**Notes:**
-Make sure MySQL is properly configured and running before using the system.
-Environment variables (database credentials, ports, etc.) should be set according to your setup.
-This project is intended for academic and institutional use.

**License:**
-This project is developed for educational purposes. License details can be added here if required.If you encounter issues or have suggestions, feel free to open an issue or submit a pull request.



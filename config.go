package main

import (
	"fmt"
	"os"
)

// DatabaseConfig holds database connection configuration
type DatabaseConfig struct {
	Host     string
	Port     string
	Username string
	Password string
	Database string
}

// GetAppConfig returns database configuration from environment variables or defaults
func GetAppConfig() DatabaseConfig {
	return DatabaseConfig{
		Host:     getEnv("DB_HOST", "localhost"),
		Port:     getEnv("DB_PORT", "3306"),
		Username: getEnv("DB_USERNAME", "comp-lab1"),
		Password: getEnv("DB_PASSWORD", "computer123"),
		Database: getEnv("DB_DATABASE", "logbookdb"),
	}
}

// GetDatabaseConfig returns database configuration from environment variables or defaults
func GetDatabaseConfig() DatabaseConfig {
	return GetAppConfig()
}

// GetConnectionString returns the MySQL connection string
func (config DatabaseConfig) GetConnectionString() string {
	return fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true",
		config.Username,
		config.Password,
		config.Host,
		config.Port,
		config.Database,
	)
}

// getEnv gets environment variable with fallback to default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

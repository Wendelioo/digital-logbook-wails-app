package main

import (
	"fmt"
	"os"
	"strconv"
)

// DatabaseConfig holds database connection configuration
type DatabaseConfig struct {
	Host     string
	Port     string
	Username string
	Password string
	Database string
}

// AppConfig holds application configuration
type AppConfig struct {
	UseMockData bool
	Database    DatabaseConfig
}

// GetAppConfig returns application configuration from environment variables or defaults
func GetAppConfig() AppConfig {
	useMockData := getEnvBool("USE_MOCK_DATA", true) // Default to mock data
	
	return AppConfig{
		UseMockData: useMockData,
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "3306"),
			Username: getEnv("DB_USERNAME", "root"),
			Password: getEnv("DB_PASSWORD", "wendel"),
			Database: getEnv("DB_DATABASE", "logbookdb"),
		},
	}
}

// GetDatabaseConfig returns database configuration from environment variables or defaults
func GetDatabaseConfig() DatabaseConfig {
	return GetAppConfig().Database
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

// getEnvBool gets boolean environment variable with fallback to default value
func getEnvBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if parsed, err := strconv.ParseBool(value); err == nil {
			return parsed
		}
	}
	return defaultValue
}

-- ============================================================================
-- Migration: Add forwarded_at column to feedback table
-- Date: 2024
-- Description: Adds the forwarded_at column to track when feedback was forwarded to admin
-- ============================================================================

USE logbookdb;

-- Add forwarded_at column to feedback table
-- Note: If you get an error "Duplicate column name 'forwarded_at'", 
-- the column already exists and you can safely ignore this error.
ALTER TABLE feedback 
ADD COLUMN forwarded_at DATETIME NULL 
AFTER forwarded_by;

-- Update existing forwarded records to set forwarded_at based on updated_at
-- This preserves historical data for records that were forwarded before this migration
UPDATE feedback 
SET forwarded_at = updated_at 
WHERE status = 'forwarded' 
  AND forwarded_at IS NULL 
  AND forwarded_by IS NOT NULL;

-- Add index for better query performance on forwarded_at
ALTER TABLE feedback 
ADD INDEX idx_forwarded_at (forwarded_at);


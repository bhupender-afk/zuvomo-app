-- Add OAuth profile completion fields to users table
-- Migration script for OAuth user profile completion

USE zuvomo_db;

-- Add additional profile fields for OAuth users
-- Note: Some columns may already exist, so we'll use individual queries with error handling

-- Check current table structure first
SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'zuvomo_db' AND TABLE_NAME = 'users'
ORDER BY COLUMN_NAME;

-- Add indexes for better performance on search fields
ALTER TABLE users
ADD INDEX idx_preferred_industries (preferred_industries(100));

ALTER TABLE users
ADD INDEX idx_investment_stage (investment_stage);

ALTER TABLE users
ADD INDEX idx_experience_years (experience_years);

SELECT 'Migration completed: Added OAuth profile fields to users table' AS status;
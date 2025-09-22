-- Add missing investor fields to users table
-- Migration script to enhance user authentication system

USE zuvomo_db;

-- Add missing investor-specific fields (ignore errors if columns already exist)
ALTER TABLE users
ADD COLUMN phone_number VARCHAR(20) NULL COMMENT 'User phone number';

ALTER TABLE users
ADD COLUMN telegram_handle VARCHAR(100) NULL COMMENT 'Telegram username';

ALTER TABLE users
ADD COLUMN linkedin VARCHAR(255) NULL COMMENT 'LinkedIn profile URL';

ALTER TABLE users
ADD COLUMN website_url VARCHAR(255) NULL COMMENT 'Personal/company website';

ALTER TABLE users
ADD COLUMN investment_focus TEXT NULL COMMENT 'Investment focus and interests';

ALTER TABLE users
ADD COLUMN preferred_category VARCHAR(100) NULL COMMENT 'Preferred investment category';

ALTER TABLE users
ADD COLUMN investment_range VARCHAR(50) NULL COMMENT 'Investment range preference';

ALTER TABLE users
ADD COLUMN current_portfolio_size VARCHAR(50) NULL COMMENT 'Current portfolio size';

ALTER TABLE users
ADD COLUMN past_investments TEXT NULL COMMENT 'Past investment history';

ALTER TABLE users
ADD COLUMN rejection_reason TEXT NULL COMMENT 'Admin rejection reason for resubmission';

ALTER TABLE users
ADD COLUMN auth_method VARCHAR(20) DEFAULT 'password' COMMENT 'Authentication method (password, google, linkedin)';

ALTER TABLE users
ADD COLUMN social_login_id VARCHAR(255) NULL COMMENT 'Social login provider ID';

-- Add indexes for better performance
ALTER TABLE users
ADD INDEX idx_auth_method (auth_method);

ALTER TABLE users
ADD INDEX idx_social_login_id (social_login_id);

ALTER TABLE users
ADD INDEX idx_phone_number (phone_number);

-- Update existing users to have default auth_method
UPDATE users SET auth_method = 'password' WHERE auth_method IS NULL;

-- Add constraint to ensure valid auth methods
-- ALTER TABLE users ADD CONSTRAINT chk_auth_method
-- CHECK (auth_method IN ('password', 'google', 'linkedin', 'otp'));

SELECT 'Migration completed: Added investor fields to users table' AS status;
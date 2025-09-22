-- Enhanced Signup Flow - Additional User Fields (Simple Version)
-- Add new columns to users table for enhanced investor and project owner profiles

USE zuvomo_db;

-- Add enhanced user profile fields (without IF NOT EXISTS for compatibility)
ALTER TABLE users
ADD COLUMN investment_range VARCHAR(20) COMMENT 'Investment range for investors (e.g., 0-10k, 10k-50k, etc.)';

ALTER TABLE users
ADD COLUMN portfolio_size VARCHAR(10) COMMENT 'Current portfolio size for investors (e.g., 1-5, 6-15, etc.)';

ALTER TABLE users
ADD COLUMN investment_categories JSON COMMENT 'Investment categories of interest for investors';

ALTER TABLE users
ADD COLUMN experience_level ENUM('beginner', 'intermediate', 'experienced', 'expert') DEFAULT 'intermediate' COMMENT 'Investment experience level';

ALTER TABLE users
ADD COLUMN investment_focus JSON COMMENT 'Investment focus areas (early stage, growth stage, etc.)';

ALTER TABLE users
ADD COLUMN accredited_investor BOOLEAN DEFAULT FALSE COMMENT 'Accredited investor status';

ALTER TABLE users
ADD COLUMN approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT 'Admin approval status for new users';

ALTER TABLE users
ADD COLUMN approval_date TIMESTAMP NULL COMMENT 'Date when user was approved/rejected';

ALTER TABLE users
ADD COLUMN approved_by INT NULL COMMENT 'Admin user who approved/rejected';

ALTER TABLE users
ADD COLUMN rejection_reason TEXT COMMENT 'Reason for rejection if applicable';

ALTER TABLE users
ADD COLUMN marketing_consent BOOLEAN DEFAULT FALSE COMMENT 'User consent for marketing communications';

ALTER TABLE users
ADD COLUMN profile_completion_step INT DEFAULT 0 COMMENT 'Current step in profile completion process';

ALTER TABLE users
ADD COLUMN enhanced_signup BOOLEAN DEFAULT FALSE COMMENT 'Whether user went through enhanced signup flow';

-- Add foreign key constraint for approved_by
ALTER TABLE users
ADD CONSTRAINT fk_users_approved_by
FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;

-- Add indexes for better query performance
ALTER TABLE users
ADD INDEX idx_approval_status (approval_status);

ALTER TABLE users
ADD INDEX idx_investment_range (investment_range);

ALTER TABLE users
ADD INDEX idx_portfolio_size (portfolio_size);

ALTER TABLE users
ADD INDEX idx_experience_level (experience_level);

ALTER TABLE users
ADD INDEX idx_enhanced_signup (enhanced_signup);

ALTER TABLE users
ADD INDEX idx_approval_date (approval_date);

-- Create a table for tracking signup flow progress
CREATE TABLE user_signup_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    step_number INT NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    step_data JSON COMMENT 'Data collected in this step',
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_step_number (step_number),
    INDEX idx_completed_at (completed_at)
);

-- Create a table for admin notifications about pending approvals
CREATE TABLE admin_notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type ENUM('user_approval', 'project_approval', 'system_alert') NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    user_id INT NULL COMMENT 'Related user for user_approval notifications',
    project_id INT NULL COMMENT 'Related project for project_approval notifications',
    is_read BOOLEAN DEFAULT FALSE,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    read_by INT NULL COMMENT 'Admin who marked as read',

    INDEX idx_type (type),
    INDEX idx_is_read (is_read),
    INDEX idx_priority (priority),
    INDEX idx_created_at (created_at),
    INDEX idx_user_id (user_id),
    INDEX idx_project_id (project_id),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (read_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Update existing users to have approved status if they're active
UPDATE users
SET approval_status = 'approved',
    approval_date = created_at,
    enhanced_signup = FALSE
WHERE is_active = TRUE
AND approval_status = 'pending'
AND email_verified = TRUE;
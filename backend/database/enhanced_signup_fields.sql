-- Enhanced Signup Flow - Additional User Fields
-- Add new columns to users table for enhanced investor and project owner profiles

USE zuvomo_db;

-- Add enhanced user profile fields
ALTER TABLE users
ADD COLUMN IF NOT EXISTS investment_range VARCHAR(20) COMMENT 'Investment range for investors (e.g., 0-10k, 10k-50k, etc.)',
ADD COLUMN IF NOT EXISTS portfolio_size VARCHAR(10) COMMENT 'Current portfolio size for investors (e.g., 1-5, 6-15, etc.)',
ADD COLUMN IF NOT EXISTS investment_categories JSON COMMENT 'Investment categories of interest for investors',
ADD COLUMN IF NOT EXISTS experience_level ENUM('beginner', 'intermediate', 'experienced', 'expert') DEFAULT 'intermediate' COMMENT 'Investment experience level',
ADD COLUMN IF NOT EXISTS investment_focus JSON COMMENT 'Investment focus areas (early stage, growth stage, etc.)',
ADD COLUMN IF NOT EXISTS accredited_investor BOOLEAN DEFAULT FALSE COMMENT 'Accredited investor status',
ADD COLUMN IF NOT EXISTS approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT 'Admin approval status for new users',
ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP NULL COMMENT 'Date when user was approved/rejected',
ADD COLUMN IF NOT EXISTS approved_by INT NULL COMMENT 'Admin user who approved/rejected',
ADD COLUMN IF NOT EXISTS rejection_reason TEXT COMMENT 'Reason for rejection if applicable',
ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT FALSE COMMENT 'User consent for marketing communications',
ADD COLUMN IF NOT EXISTS profile_completion_step INT DEFAULT 0 COMMENT 'Current step in profile completion process',
ADD COLUMN IF NOT EXISTS enhanced_signup BOOLEAN DEFAULT FALSE COMMENT 'Whether user went through enhanced signup flow';

-- Add foreign key constraint for approved_by
ALTER TABLE users
ADD CONSTRAINT fk_users_approved_by
FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;

-- Add indexes for better query performance
ALTER TABLE users
ADD INDEX idx_approval_status (approval_status),
ADD INDEX idx_investment_range (investment_range),
ADD INDEX idx_portfolio_size (portfolio_size),
ADD INDEX idx_experience_level (experience_level),
ADD INDEX idx_enhanced_signup (enhanced_signup),
ADD INDEX idx_approval_date (approval_date);

-- Create a table for tracking signup flow progress
CREATE TABLE IF NOT EXISTS user_signup_progress (
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
CREATE TABLE IF NOT EXISTS admin_notifications (
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

-- Insert a notification for any existing pending users
INSERT INTO admin_notifications (type, title, message, user_id, priority)
SELECT
    'user_approval',
    CONCAT('New ', role, ' registration pending approval'),
    CONCAT('User ', first_name, ' ', last_name, ' (', email, ') has registered as a ', role, ' and is awaiting approval.'),
    id,
    'medium'
FROM users
WHERE approval_status = 'pending'
AND NOT EXISTS (
    SELECT 1 FROM admin_notifications
    WHERE type = 'user_approval' AND user_id = users.id
);

-- Update existing users to have approved status if they're active
UPDATE users
SET approval_status = 'approved',
    approval_date = created_at,
    enhanced_signup = FALSE
WHERE is_active = TRUE
AND approval_status = 'pending'
AND email_verified = TRUE;

-- Create a view for easy admin dashboard queries
CREATE OR REPLACE VIEW pending_user_approvals AS
SELECT
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.role,
    u.company,
    u.location,
    u.investment_range,
    u.portfolio_size,
    u.investment_categories,
    u.experience_level,
    u.accredited_investor,
    u.bio,
    u.linkedin_url,
    u.website_url,
    u.created_at,
    u.profile_completion_step,
    u.enhanced_signup
FROM users u
WHERE u.approval_status = 'pending'
ORDER BY u.created_at DESC;

-- Create a view for approved users with enhanced profiles
CREATE OR REPLACE VIEW enhanced_user_profiles AS
SELECT
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.role,
    u.company,
    u.location,
    u.bio,
    u.linkedin_url,
    u.website_url,
    u.investment_range,
    u.portfolio_size,
    u.investment_categories,
    u.experience_level,
    u.investment_focus,
    u.accredited_investor,
    u.approval_status,
    u.approval_date,
    u.enhanced_signup,
    u.created_at,
    approver.first_name as approved_by_name,
    approver.last_name as approved_by_lastname
FROM users u
LEFT JOIN users approver ON u.approved_by = approver.id
WHERE u.approval_status = 'approved'
AND u.enhanced_signup = TRUE
ORDER BY u.approval_date DESC;
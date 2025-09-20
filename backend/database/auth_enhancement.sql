-- Enhanced Authentication System Schema Updates
-- This script extends the existing schema to support intelligent authentication

-- Add enhanced authentication fields to users table (checking if columns exist first)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'approval_status') = 0,
    'ALTER TABLE users ADD COLUMN approval_status ENUM(\'pending\', \'approved\', \'rejected\') DEFAULT \'pending\' COMMENT \'User approval status for non-admin users\'',
    'SELECT 1'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'is_verified') = 0,
    'ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE COMMENT \'Email verification status\'',
    'SELECT 1'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email_verification_token') = 0,
    'ALTER TABLE users ADD COLUMN email_verification_token VARCHAR(255) COMMENT \'Token for email verification\'',
    'SELECT 1'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email_verification_expires') = 0,
    'ALTER TABLE users ADD COLUMN email_verification_expires TIMESTAMP NULL COMMENT \'Email verification token expiry\'',
    'SELECT 1'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'profile_completion_step') = 0,
    'ALTER TABLE users ADD COLUMN profile_completion_step ENUM(\'basic\', \'verification\', \'approval\', \'complete\') DEFAULT \'basic\' COMMENT \'Current step in profile completion\'',
    'SELECT 1'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'rejected_reason') = 0,
    'ALTER TABLE users ADD COLUMN rejected_reason TEXT COMMENT \'Reason for rejection if status is rejected\'',
    'SELECT 1'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'social_login_id') = 0,
    'ALTER TABLE users ADD COLUMN social_login_id VARCHAR(255) COMMENT \'Social media profile ID for OAuth\'',
    'SELECT 1'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'avatar_url') = 0,
    'ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500) COMMENT \'Profile picture URL from social or upload\'',
    'SELECT 1'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Make password_hash nullable to support social-only accounts
ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NULL COMMENT 'Password hash - nullable for social-only accounts';

-- Create user authentication methods table
CREATE TABLE IF NOT EXISTS user_auth_methods (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(20) NOT NULL,
    auth_method ENUM('password', 'google', 'linkedin', 'facebook', 'github') NOT NULL,
    provider_id VARCHAR(255) COMMENT 'External provider user ID',
    provider_email VARCHAR(255) COMMENT 'Email from provider',
    provider_data JSON COMMENT 'Additional data from provider',
    is_primary BOOLEAN DEFAULT FALSE COMMENT 'Primary authentication method',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Whether this method is active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_method (user_id, auth_method),
    UNIQUE KEY unique_provider_id (auth_method, provider_id),
    INDEX idx_user_id (user_id),
    INDEX idx_auth_method (auth_method),
    INDEX idx_provider_id (provider_id),
    INDEX idx_is_primary (is_primary),
    INDEX idx_is_active (is_active)
);

-- Create OTP verification table
CREATE TABLE IF NOT EXISTS user_otp_verifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(20),
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    otp_type ENUM('email_verification', 'login', 'password_reset') NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    attempts INT DEFAULT 0,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP NULL,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_email (email),
    INDEX idx_otp_code (otp_code),
    INDEX idx_otp_type (otp_type),
    INDEX idx_expires_at (expires_at),
    INDEX idx_is_used (is_used),
    INDEX idx_created_at (created_at)
);

-- Create password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(20) NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP NULL,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_token (token),
    INDEX idx_user_id (user_id),
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at),
    INDEX idx_is_used (is_used),
    INDEX idx_created_at (created_at)
);

-- Create OAuth state tokens table (for preventing CSRF attacks)
CREATE TABLE IF NOT EXISTS oauth_state_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    state_token VARCHAR(255) NOT NULL,
    provider ENUM('google', 'linkedin', 'facebook', 'github') NOT NULL,
    redirect_url VARCHAR(500),
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP NULL,

    UNIQUE KEY unique_state_token (state_token),
    INDEX idx_state_token (state_token),
    INDEX idx_provider (provider),
    INDEX idx_expires_at (expires_at),
    INDEX idx_is_used (is_used),
    INDEX idx_created_at (created_at)
);

-- Create enhanced user sessions table with device tracking
CREATE TABLE IF NOT EXISTS user_sessions_enhanced (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(20) NOT NULL,
    refresh_token VARCHAR(500) NOT NULL,
    access_token_jti VARCHAR(100) COMMENT 'JWT ID for access token',
    expires_at TIMESTAMP NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_type ENUM('desktop', 'mobile', 'tablet', 'unknown') DEFAULT 'unknown',
    browser_name VARCHAR(100),
    os_name VARCHAR(100),
    location_country VARCHAR(100),
    location_city VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_refresh_token (refresh_token),
    INDEX idx_access_token_jti (access_token_jti),
    INDEX idx_expires_at (expires_at),
    INDEX idx_is_active (is_active),
    INDEX idx_last_activity (last_activity),
    INDEX idx_created_at (created_at)
);

-- Create user login history table
CREATE TABLE IF NOT EXISTS user_login_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(20) NOT NULL,
    login_method ENUM('password', 'google', 'linkedin', 'facebook', 'github', 'otp') NOT NULL,
    status ENUM('success', 'failed', 'blocked') NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_type ENUM('desktop', 'mobile', 'tablet', 'unknown') DEFAULT 'unknown',
    browser_name VARCHAR(100),
    os_name VARCHAR(100),
    location_country VARCHAR(100),
    location_city VARCHAR(100),
    failure_reason VARCHAR(255),
    session_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES user_sessions_enhanced(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_login_method (login_method),
    INDEX idx_status (status),
    INDEX idx_ip_address (ip_address),
    INDEX idx_created_at (created_at),
    INDEX idx_session_id (session_id)
);

-- Create user approval workflow table
CREATE TABLE IF NOT EXISTS user_approval_workflow (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(20) NOT NULL,
    admin_id VARCHAR(20),
    action ENUM('submitted', 'approved', 'rejected', 'resubmitted') NOT NULL,
    previous_status ENUM('pending', 'approved', 'rejected'),
    new_status ENUM('pending', 'approved', 'rejected') NOT NULL,
    admin_notes TEXT,
    rejection_reason TEXT,
    auto_approved BOOLEAN DEFAULT FALSE COMMENT 'Whether approval was automatic',
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_admin_id (admin_id),
    INDEX idx_action (action),
    INDEX idx_new_status (new_status),
    INDEX idx_created_at (created_at),
    INDEX idx_auto_approved (auto_approved)
);

-- Update existing users to have default authentication method (password)
INSERT INTO user_auth_methods (user_id, auth_method, is_primary, is_active)
SELECT id, 'password', TRUE, TRUE
FROM users
WHERE password_hash IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM user_auth_methods
    WHERE user_auth_methods.user_id = users.id
    AND user_auth_methods.auth_method = 'password'
);

-- Update admin users to approved status
UPDATE users
SET approval_status = 'approved',
    profile_completion_step = 'complete',
    is_verified = TRUE
WHERE role = 'admin';

-- Create indexes for enhanced search and filtering
CREATE INDEX IF NOT EXISTS idx_users_approval_status ON users(approval_status);
CREATE INDEX IF NOT EXISTS idx_users_is_verified ON users(is_verified);
CREATE INDEX IF NOT EXISTS idx_users_profile_completion_step ON users(profile_completion_step);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, approval_status);

-- Add triggers for automatic workflow logging
DELIMITER //

CREATE TRIGGER IF NOT EXISTS user_approval_status_change
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    IF OLD.approval_status != NEW.approval_status THEN
        INSERT INTO user_approval_workflow (
            user_id,
            action,
            previous_status,
            new_status,
            auto_approved
        ) VALUES (
            NEW.id,
            CASE
                WHEN NEW.approval_status = 'approved' THEN 'approved'
                WHEN NEW.approval_status = 'rejected' THEN 'rejected'
                ELSE 'submitted'
            END,
            OLD.approval_status,
            NEW.approval_status,
            TRUE
        );
    END IF;
END//

DELIMITER ;

-- Add sample OAuth configuration data (for development)
INSERT INTO oauth_state_tokens (state_token, provider, expires_at, is_used) VALUES
('sample_state_123', 'google', DATE_ADD(NOW(), INTERVAL 1 HOUR), FALSE),
('sample_state_456', 'linkedin', DATE_ADD(NOW(), INTERVAL 1 HOUR), FALSE)
ON DUPLICATE KEY UPDATE expires_at = VALUES(expires_at);

-- Clean up expired tokens (maintenance query for future use)
-- DELETE FROM user_otp_verifications WHERE expires_at < NOW() AND is_used = TRUE;
-- DELETE FROM password_reset_tokens WHERE expires_at < NOW() AND is_used = TRUE;
-- DELETE FROM oauth_state_tokens WHERE expires_at < NOW();
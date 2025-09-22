-- Enhanced Signup Flow - Create Required Tables Only
-- Only create the tables we need for enhanced signup functionality

USE zuvomo_db;

-- Create a table for tracking signup flow progress
CREATE TABLE IF NOT EXISTS user_signup_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(20) NOT NULL,
    step_number INT NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    step_data JSON COMMENT 'Data collected in this step',
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,

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
    user_id VARCHAR(20) NULL COMMENT 'Related user for user_approval notifications',
    project_id VARCHAR(20) NULL COMMENT 'Related project for project_approval notifications',
    is_read BOOLEAN DEFAULT FALSE,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    read_by VARCHAR(20) NULL COMMENT 'Admin who marked as read',

    INDEX idx_type (type),
    INDEX idx_is_read (is_read),
    INDEX idx_priority (priority),
    INDEX idx_created_at (created_at),
    INDEX idx_user_id (user_id),
    INDEX idx_project_id (project_id)
);
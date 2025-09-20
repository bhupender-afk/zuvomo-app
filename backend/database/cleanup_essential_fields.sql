-- Database Cleanup Script: Essential Fields Only
-- This script cleans up users table, preserves admin, and keeps only essential fields

USE zuvomo_db;

-- Step 1: Create backup of current admin user
CREATE TEMPORARY TABLE admin_backup AS
SELECT id, email, password_hash, first_name, last_name, role as user_type,
       is_active, created_at
FROM users
WHERE role = 'admin' OR user_type = 'admin' OR email LIKE '%admin%'
LIMIT 5;

-- Step 2: Drop and recreate users table with essential fields only
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    -- Essential identity fields
    id VARCHAR(20) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    user_type ENUM('admin', 'project_owner', 'investor') NOT NULL,

    -- Essential profile fields (Step 2)
    location VARCHAR(200) NULL,
    phone VARCHAR(20) NULL,
    website_url VARCHAR(255) NULL,
    linkedin_url VARCHAR(255) NULL,
    bio TEXT NULL,

    -- Investor-specific fields
    investment_range VARCHAR(20) NULL COMMENT 'Investment range (e.g., 0-10k, 10k-50k)',
    investment_focus TEXT NULL COMMENT 'Investment focus areas (JSON array)',
    investment_categories JSON NULL COMMENT 'Investment categories of interest',
    accredited_investor BOOLEAN DEFAULT FALSE COMMENT 'Accredited investor status',

    -- System fields
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    rejection_reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Indexes for performance
    INDEX idx_email (email),
    INDEX idx_user_type (user_type),
    INDEX idx_approval_status (approval_status),
    INDEX idx_is_active (is_active)
);

-- Step 3: Restore admin user(s)
INSERT INTO users (
    id, email, password_hash, first_name, last_name, user_type,
    is_verified, is_active, approval_status, created_at
)
SELECT
    id, email, password_hash, first_name, last_name, user_type,
    TRUE, is_active, 'approved', created_at
FROM admin_backup;

-- Step 4: Create a simple test investor and project owner for testing
INSERT INTO users (
    id, email, password_hash, first_name, last_name, user_type,
    is_verified, is_active, approval_status
) VALUES
(
    'TEST_INV_001',
    'test.investor@zuvomo.com',
    '$2b$12$LQv3c1yqBwEHFwq8oNzJ5.L9j9r9kQMl8h6QKo8EqGV2V8QoP7.uu', -- password: test123
    'Test',
    'Investor',
    'investor',
    TRUE,
    TRUE,
    'rejected'
),
(
    'TEST_OWN_001',
    'test.owner@zuvomo.com',
    '$2b$12$LQv3c1yqBwEHFwq8oNzJ5.L9j9r9kQMl8h6QKo8EqGV2V8QoP7.uu', -- password: test123
    'Test',
    'Owner',
    'project_owner',
    TRUE,
    TRUE,
    'rejected'
);

-- Step 5: Verify cleanup
SELECT 'Admin users preserved:' as status;
SELECT id, email, user_type, approval_status FROM users WHERE user_type = 'admin';

SELECT 'Test users created:' as status;
SELECT id, email, user_type, approval_status FROM users WHERE email LIKE 'test.%';

SELECT 'Total users count:' as status;
SELECT COUNT(*) as total_users FROM users;

-- Step 6: Show final table structure
DESCRIBE users;
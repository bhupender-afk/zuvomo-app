-- Zuvomo Database Schema
-- Create database if not exists
CREATE DATABASE IF NOT EXISTS zuvomo_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE zuvomo_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'project_owner', 'investor') NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    profile_image VARCHAR(500),
    bio TEXT,
    company VARCHAR(200),
    location VARCHAR(200),
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_is_active (is_active)
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(500),
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    funding_goal DECIMAL(15,2) NOT NULL,
    current_funding DECIMAL(15,2) DEFAULT 0.00,
    minimum_investment DECIMAL(10,2) DEFAULT 100.00,
    funding_from_other_sources DECIMAL(15,2) DEFAULT 0.00,
    equity_percentage DECIMAL(5,2),
    location VARCHAR(200) NOT NULL,
    team_size INT NOT NULL,
    project_stage ENUM('idea', 'prototype', 'mvp', 'early_revenue', 'growth') DEFAULT 'idea',
    status ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected', 'funded', 'completed') DEFAULT 'draft',
    owner_id INT NOT NULL,
    image_url VARCHAR(500),
    video_url VARCHAR(500),
    documents JSON,
    business_plan_url VARCHAR(500),
    pitch_deck_url VARCHAR(500),
    financial_projections JSON,
    funding_deadline DATE,
    featured BOOLEAN DEFAULT FALSE,
    admin_notes TEXT,
    rejected_reason TEXT,
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_category (category),
    INDEX idx_owner_id (owner_id),
    INDEX idx_featured (featured),
    INDEX idx_created_at (created_at)
);

-- Investments table
CREATE TABLE IF NOT EXISTS investments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT NOT NULL,
    investor_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    equity_received DECIMAL(5,2),
    investment_type ENUM('equity', 'debt', 'convertible') DEFAULT 'equity',
    status ENUM('pending', 'completed', 'cancelled', 'refunded') DEFAULT 'pending',
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    due_diligence_completed BOOLEAN DEFAULT FALSE,
    contract_signed BOOLEAN DEFAULT FALSE,
    investment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completion_date TIMESTAMP NULL,
    notes TEXT,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (investor_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_project_id (project_id),
    INDEX idx_investor_id (investor_id),
    INDEX idx_status (status),
    INDEX idx_investment_date (investment_date),
    
    UNIQUE KEY unique_pending_investment (project_id, investor_id, status)
);

-- Project updates table (for project owners to post updates)
CREATE TABLE IF NOT EXISTS project_updates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    update_type ENUM('general', 'milestone', 'financial', 'team') DEFAULT 'general',
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_project_id (project_id),
    INDEX idx_is_public (is_public),
    INDEX idx_created_at (created_at)
);

-- User sessions table (for JWT token management)
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    refresh_token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_refresh_token (refresh_token),
    INDEX idx_expires_at (expires_at),
    INDEX idx_is_active (is_active)
);

-- Admin logs table (for audit trail)
CREATE TABLE IF NOT EXISTS admin_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_admin_id (admin_id),
    INDEX idx_action (action),
    INDEX idx_entity_type (entity_type),
    INDEX idx_created_at (created_at)
);

-- Insert default admin user
INSERT INTO users (
    email, 
    password_hash, 
    role, 
    first_name, 
    last_name, 
    is_active, 
    email_verified
) VALUES (
    'admin@zuvomo.com',
    '$2b$10$9X8mY7wXqY5zK3pL2mN4QeJzR6vA8sT1uP9hY2qL5nM7xK6wR8sT4', -- password: admin123
    'admin',
    'Admin',
    'User',
    TRUE,
    TRUE
) ON DUPLICATE KEY UPDATE
    password_hash = VALUES(password_hash),
    updated_at = CURRENT_TIMESTAMP;

-- Insert sample project owner user
INSERT INTO users (
    email, 
    password_hash, 
    role, 
    first_name, 
    last_name, 
    company,
    is_active, 
    email_verified
) VALUES (
    'founder@zuvomo.com',
    '$2b$10$9X8mY7wXqY5zK3pL2mN4QeJzR6vA8sT1uP9hY2qL5nM7xK6wR8sT4', -- password: founder123
    'project_owner',
    'John',
    'Founder',
    'TechStartup Inc',
    TRUE,
    TRUE
) ON DUPLICATE KEY UPDATE
    password_hash = VALUES(password_hash),
    updated_at = CURRENT_TIMESTAMP;

-- Insert sample investor user
INSERT INTO users (
    email, 
    password_hash, 
    role, 
    first_name, 
    last_name, 
    company,
    is_active, 
    email_verified
) VALUES (
    'investor@zuvomo.com',
    '$2b$10$9X8mY7wXqY5zK3pL2mN4QeJzR6vA8sT1uP9hY2qL5nM7xK6wR8sT4', -- password: investor123
    'investor',
    'Jane',
    'Investor',
    'Venture Capital Partners',
    TRUE,
    TRUE
) ON DUPLICATE KEY UPDATE
    password_hash = VALUES(password_hash),
    updated_at = CURRENT_TIMESTAMP;

-- Project ratings table
CREATE TABLE IF NOT EXISTS project_ratings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT NOT NULL,
    user_id INT NOT NULL,
    rating DECIMAL(2,1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
    review TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_project_rating (project_id, user_id),
    INDEX idx_project_id (project_id),
    INDEX idx_user_id (user_id),
    INDEX idx_rating (rating),
    INDEX idx_created_at (created_at)
);

-- Watchlist table
CREATE TABLE IF NOT EXISTS watchlist (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    project_id INT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_project_watchlist (user_id, project_id),
    INDEX idx_user_id (user_id),
    INDEX idx_project_id (project_id),
    INDEX idx_created_at (created_at)
);

-- Project tags table
CREATE TABLE IF NOT EXISTS project_tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#2C91D5',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_name (name),
    INDEX idx_is_active (is_active)
);

-- Project tag relationships
CREATE TABLE IF NOT EXISTS project_tag_relationships (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT NOT NULL,
    tag_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES project_tags(id) ON DELETE CASCADE,
    UNIQUE KEY unique_project_tag (project_id, tag_id),
    INDEX idx_project_id (project_id),
    INDEX idx_tag_id (tag_id)
);

-- Insert default project tags
INSERT INTO project_tags (name, color, description) VALUES
('Finance', '#2C91D5', 'Financial services and fintech projects'),
('Blockchain', '#10B981', 'Blockchain and cryptocurrency projects'),
('AI', '#8B5CF6', 'Artificial Intelligence and machine learning'),
('Healthcare', '#EF4444', 'Healthcare and medical technology'),
('Education', '#F59E0B', 'Educational technology and e-learning'),
('E-commerce', '#06B6D4', 'Online retail and marketplace platforms'),
('Gaming', '#EC4899', 'Gaming and entertainment applications'),
('Real Estate', '#84CC16', 'Real estate technology and platforms'),
('Energy', '#F97316', 'Clean energy and sustainability projects'),
('Food Tech', '#14B8A6', 'Food technology and delivery services')
ON DUPLICATE KEY UPDATE
    color = VALUES(color),
    description = VALUES(description),
    updated_at = CURRENT_TIMESTAMP;

-- Add missing fields to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS valuation DECIMAL(15,2) COMMENT 'Project valuation in USD',
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(2,1) DEFAULT 0.0 COMMENT 'Cached average rating from ratings table',
ADD COLUMN IF NOT EXISTS rating_count INT DEFAULT 0 COMMENT 'Cached count of ratings',
ADD COLUMN IF NOT EXISTS views_count INT DEFAULT 0 COMMENT 'Number of times project was viewed',
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE COMMENT 'Featured on homepage',
ADD COLUMN IF NOT EXISTS is_recommended BOOLEAN DEFAULT FALSE COMMENT 'Recommended by algorithm',
ADD COLUMN IF NOT EXISTS progress_percentage DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Funding progress percentage';

-- Add missing fields to users table for enhanced profiles
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE COMMENT 'Profile completion status',
ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255) COMMENT 'LinkedIn profile URL',
ADD COLUMN IF NOT EXISTS website_url VARCHAR(255) COMMENT 'Personal/company website',
ADD COLUMN IF NOT EXISTS investment_range_min DECIMAL(10,2) COMMENT 'Minimum investment amount for investors',
ADD COLUMN IF NOT EXISTS investment_range_max DECIMAL(10,2) COMMENT 'Maximum investment amount for investors',
ADD COLUMN IF NOT EXISTS preferred_sectors JSON COMMENT 'Preferred investment sectors for investors',
ADD COLUMN IF NOT EXISTS kyc_verified BOOLEAN DEFAULT FALSE COMMENT 'KYC verification status',
ADD COLUMN IF NOT EXISTS accredited_investor BOOLEAN DEFAULT FALSE COMMENT 'Accredited investor status';

-- Project files table for file uploads
CREATE TABLE IF NOT EXISTS project_files (
    id VARCHAR(50) PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_type ENUM('document', 'image', 'video', 'main', 'logo', 'gallery', 'business_plan', 'pitch_deck', 'financial') DEFAULT 'document',
    description TEXT,
    uploaded_by INT NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_project_id (project_id),
    INDEX idx_file_type (file_type),
    INDEX idx_uploaded_by (uploaded_by),
    INDEX idx_created_at (created_at),
    INDEX idx_is_public (is_public)
);
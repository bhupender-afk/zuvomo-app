-- Blog and Case Study System Schema
-- Add to existing zuvomo_db database

USE zuvomo_db;

-- Blogs table
CREATE TABLE IF NOT EXISTS blogs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    excerpt TEXT,
    content LONGTEXT NOT NULL,
    featured_image VARCHAR(500),
    author_id VARCHAR(50) NOT NULL,
    status ENUM('draft', 'published') DEFAULT 'draft',
    published_at TIMESTAMP NULL,
    meta_title VARCHAR(255),
    meta_description TEXT,
    tags JSON,
    view_count INT DEFAULT 0,
    reading_time INT DEFAULT 5,
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_published_at (published_at),
    INDEX idx_slug (slug),
    INDEX idx_featured (featured),
    INDEX idx_author_id (author_id)
);

-- Case Studies table
CREATE TABLE IF NOT EXISTS case_studies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    client_name VARCHAR(200),
    client_logo VARCHAR(500),
    industry VARCHAR(100),
    project_duration VARCHAR(100),
    project_budget_range VARCHAR(100),
    challenge TEXT NOT NULL,
    solution TEXT NOT NULL,
    results TEXT NOT NULL,
    metrics JSON COMMENT 'Success metrics like ROI, growth %, etc.',
    images JSON COMMENT 'Array of project images',
    testimonial TEXT,
    testimonial_author VARCHAR(200),
    testimonial_position VARCHAR(200),
    status ENUM('draft', 'published') DEFAULT 'draft',
    featured BOOLEAN DEFAULT FALSE,
    meta_title VARCHAR(255),
    meta_description TEXT,
    tags JSON,
    view_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_status (status),
    INDEX idx_industry (industry),
    INDEX idx_slug (slug),
    INDEX idx_featured (featured)
);

-- Blog categories table
CREATE TABLE IF NOT EXISTS blog_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#2C91D5',
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_slug (slug),
    INDEX idx_is_active (is_active)
);

-- Blog category relationships
CREATE TABLE IF NOT EXISTS blog_category_relationships (
    id INT PRIMARY KEY AUTO_INCREMENT,
    blog_id INT NOT NULL,
    category_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES blog_categories(id) ON DELETE CASCADE,
    UNIQUE KEY unique_blog_category (blog_id, category_id),
    INDEX idx_blog_id (blog_id),
    INDEX idx_category_id (category_id)
);

-- Content media table (for blog and case study images)
CREATE TABLE IF NOT EXISTS content_media (
    id VARCHAR(50) PRIMARY KEY,
    content_type ENUM('blog', 'case_study') NOT NULL,
    content_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    alt_text VARCHAR(255),
    caption TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    uploaded_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_content_type_id (content_type, content_id),
    INDEX idx_uploaded_by (uploaded_by),
    INDEX idx_is_featured (is_featured)
);

-- Insert default blog categories
INSERT INTO blog_categories (name, slug, description, color, icon) VALUES
('Technology', 'technology', 'Latest tech trends and innovations', '#2C91D5', 'monitor'),
('Entrepreneurship', 'entrepreneurship', 'Startup stories and business insights', '#10B981', 'briefcase'),
('Investment', 'investment', 'Investment strategies and market analysis', '#8B5CF6', 'trending-up'),
('Success Stories', 'success-stories', 'Inspiring entrepreneur journeys', '#F59E0B', 'star'),
('Industry News', 'industry-news', 'Latest updates from various industries', '#EF4444', 'newspaper'),
('Tips & Guides', 'tips-guides', 'Practical advice for entrepreneurs', '#06B6D4', 'lightbulb')
ON DUPLICATE KEY UPDATE
    description = VALUES(description),
    color = VALUES(color),
    icon = VALUES(icon);

-- Sample blog post
INSERT INTO blogs (
    title, 
    slug, 
    excerpt, 
    content, 
    author_id, 
    status, 
    published_at,
    meta_title,
    meta_description,
    tags,
    reading_time,
    featured
) VALUES (
    'Welcome to Zuvomo: Revolutionizing Startup Funding',
    'welcome-to-zuvomo-revolutionizing-startup-funding',
    'Discover how Zuvomo is transforming the way startups connect with investors through our innovative platform.',
    '<h2>The Future of Startup Funding is Here</h2><p>At Zuvomo, we believe that great ideas deserve great opportunities. Our platform bridges the gap between ambitious entrepreneurs and forward-thinking investors, creating a ecosystem where innovation thrives.</p><h3>Why Zuvomo?</h3><ul><li>Streamlined project discovery</li><li>Comprehensive due diligence tools</li><li>Secure investment processes</li><li>Real-time project tracking</li></ul><p>Join thousands of entrepreneurs and investors who are already building the future together on Zuvomo.</p>',
    'ADMIN001',
    'published',
    NOW(),
    'Welcome to Zuvomo - Revolutionary Startup Funding Platform',
    'Discover how Zuvomo connects entrepreneurs with investors through innovative technology and streamlined processes.',
    '["startup", "funding", "investment", "technology", "entrepreneurship"]',
    3,
    TRUE
) ON DUPLICATE KEY UPDATE
    updated_at = CURRENT_TIMESTAMP;

-- Sample case study
INSERT INTO case_studies (
    title,
    slug,
    client_name,
    industry,
    project_duration,
    project_budget_range,
    challenge,
    solution,
    results,
    metrics,
    testimonial,
    testimonial_author,
    testimonial_position,
    status,
    featured,
    meta_title,
    meta_description,
    tags
) VALUES (
    'TechStartup Inc: From Idea to $2M Funding',
    'techstartup-inc-from-idea-to-2m-funding',
    'TechStartup Inc',
    'Technology',
    '6 months',
    '$50K - $100K',
    'TechStartup Inc had a revolutionary AI-powered solution but struggled to find the right investors who understood their technology and market potential.',
    'Through Zuvomo\'s platform, we connected TechStartup Inc with specialized tech investors, provided comprehensive pitch deck optimization, and facilitated structured investor meetings.',
    'Successfully raised $2M in Series A funding within 6 months, acquired 5 key investors, and expanded team from 3 to 15 members.',
    '{"funding_raised": "$2,000,000", "time_to_funding": "6 months", "investor_meetings": "25", "conversion_rate": "20%", "team_growth": "400%"}',
    'Zuvomo transformed our fundraising journey. Their platform not only connected us with the right investors but also provided invaluable guidance throughout the process.',
    'John Founder',
    'CEO & Founder',
    'published',
    TRUE,
    'TechStartup Inc Case Study - $2M Funding Success Story',
    'Learn how TechStartup Inc raised $2M through Zuvomo\'s innovative investor matching platform.',
    '["case-study", "funding", "technology", "AI", "series-a"]'
) ON DUPLICATE KEY UPDATE
    updated_at = CURRENT_TIMESTAMP;
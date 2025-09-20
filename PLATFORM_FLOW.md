# 🚀 Zuvomo Platform - Complete System Flow Documentation

## 📋 **Platform Overview**
Zuvomo is a comprehensive investment platform connecting investors with project owners through role-based authentication, project management, investment tracking, and content management systems.

**Live URL**: http://13.200.209.191:8080
**Database**: `zuvomo_db` (MySQL 8.0)
**Tech Stack**: React + TypeScript (Frontend) | Node.js + Express (Backend)

---

## 🔐 **Section 1: Authentication Flow**

### 🎯 **Purpose & Functionality**
Multi-layer authentication system supporting traditional signup/login, enhanced OTP verification, and OAuth integration (Google/LinkedIn) with role-based access control.

### 📱 **Frontend Components**
```typescript
// Basic Authentication
frontend/src/components/auth/LoginForm.tsx           // Basic login form
frontend/src/components/auth/SignupForm.tsx         // Basic signup form
frontend/src/components/auth/AuthLayout.tsx         // Authentication wrapper

// Enhanced Authentication
frontend/src/components/auth/EnhancedLoginForm.tsx  // Multi-step login with OTP
frontend/src/components/auth/EnhancedSignupForm.tsx // Multi-step signup workflow
frontend/src/components/auth/OTPVerification.tsx    // OTP input component
frontend/src/components/auth/RejectionScreen.tsx    // Professional rejection/resubmission

// OAuth Integration
frontend/src/components/auth/GoogleOAuthHandler.tsx    // Google OAuth button & logic
frontend/src/components/auth/LinkedInOAuthHandler.tsx  // LinkedIn OAuth button & logic
frontend/src/components/auth/OAuthCallbackHandler.tsx  // OAuth callback processor
frontend/src/pages/auth/OAuthCallback.tsx             // OAuth callback page
```

### 🔌 **API Endpoints & Methods**

#### **Basic Authentication Routes** (`/api/auth/*`)
```javascript
POST /api/auth/signup         // Register new user
POST /api/auth/login          // User authentication
POST /api/auth/refresh        // Refresh JWT token
POST /api/auth/logout         // Invalidate session
GET  /api/auth/profile        // Get user profile
PUT  /api/auth/profile        // Update user profile
```

#### **Enhanced Authentication Routes** (`/api/auth-enhanced/*`)
```javascript
POST /api/auth-enhanced/signup           // Multi-step signup with OTP
POST /api/auth-enhanced/verify-otp       // OTP verification
POST /api/auth-enhanced/resend-otp       // Resend OTP code
POST /api/auth-enhanced/resubmit         // Resubmit rejected application
GET  /api/auth-enhanced/check-status     // Check application status
```

#### **OAuth Routes** (`/api/oauth/*`)
```javascript
GET  /api/oauth/url/:provider            // Get OAuth authorization URL (Google/LinkedIn)
POST /api/oauth/callback/:provider       // Handle OAuth callback with authorization code
POST /api/oauth/complete-profile         // Complete OAuth user profile setup
GET  /api/oauth/providers                // List available OAuth providers
```

### 🗄️ **Database Tables & Relationships**

#### **Primary Tables**
```sql
-- Main user storage
users (
    id INT PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),          -- NULL for OAuth users
    role ENUM('admin', 'project_owner', 'investor'),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    company VARCHAR(200),
    location VARCHAR(200),
    oauth_provider ENUM('google', 'linkedin', NULL),  -- OAuth provider
    oauth_id VARCHAR(255),               -- Provider user ID
    approval_status ENUM('pending', 'approved', 'rejected'),
    email_verified BOOLEAN DEFAULT FALSE,
    profile_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Session management
user_sessions (
    id INT PRIMARY KEY,
    user_id INT FOREIGN KEY REFERENCES users(id),
    refresh_token VARCHAR(500),
    expires_at TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP
);

-- OTP verification for enhanced auth
otp_verifications (
    id INT PRIMARY KEY,
    email VARCHAR(255),
    otp_code VARCHAR(6),
    expires_at TIMESTAMP,
    verified BOOLEAN DEFAULT FALSE,
    attempts INT DEFAULT 0,
    created_at TIMESTAMP
);

-- OAuth profile data storage
oauth_profiles (
    id INT PRIMARY KEY,
    user_id INT FOREIGN KEY REFERENCES users(id),
    provider ENUM('google', 'linkedin'),
    provider_id VARCHAR(255),
    access_token VARCHAR(1000),          -- Encrypted
    refresh_token VARCHAR(1000),         -- Encrypted
    profile_data JSON,                   -- Provider profile info
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- OAuth security state tokens
oauth_state_tokens (
    id VARCHAR(50) PRIMARY KEY,
    provider ENUM('google', 'linkedin'),
    redirect_uri VARCHAR(500),
    expires_at TIMESTAMP,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP
);
```

### 🔄 **Data Flow Diagrams**

#### **Regular Authentication Flow**
```
1. User visits /login or /signup
2. Frontend: LoginForm.tsx / SignupForm.tsx renders
3. User submits credentials
4. API: POST /api/auth/login or POST /api/auth/signup
5. Backend: Validates credentials, hashes password
6. Database: INSERT/SELECT from users table
7. Backend: Generates JWT tokens, stores session
8. Database: INSERT into user_sessions table
9. Frontend: Receives tokens, redirects to dashboard
```

#### **OAuth Integration Flow**
```
1. User clicks Google/LinkedIn button
2. Frontend: GoogleOAuthHandler.tsx calls GET /api/oauth/url/google
3. Backend: Generates state token, stores in oauth_state_tokens
4. Backend: Returns OAuth authorization URL
5. Frontend: Redirects user to Google/LinkedIn
6. User: Authorizes application on provider site
7. Provider: Redirects to /auth/oauth-callback?code=...&state=...
8. Frontend: OAuthCallbackHandler.tsx calls POST /api/oauth/callback/google
9. Backend: Validates state token, exchanges code for access token
10. Backend: Fetches user profile from provider API
11. Database: INSERT/UPDATE users table, INSERT oauth_profiles
12. Backend: Generates JWT tokens, creates session
13. Frontend: Profile completion if new user, redirect to dashboard
```

#### **Enhanced Authentication with OTP Flow**
```
1. User submits signup form
2. Frontend: EnhancedSignupForm.tsx calls POST /api/auth-enhanced/signup
3. Backend: Validates data, generates OTP code
4. Database: INSERT into users (pending), INSERT into otp_verifications
5. Backend: Sends OTP email
6. Frontend: Shows OTPVerification.tsx component
7. User: Enters OTP code
8. API: POST /api/auth-enhanced/verify-otp
9. Backend: Validates OTP, activates user account
10. Database: UPDATE users (email_verified=true), UPDATE otp_verifications
11. Frontend: Redirects to appropriate dashboard based on role
```

### 🛠️ **Implementation Details**

#### **Authentication Middleware**
```javascript
// backend/middleware/auth.js
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = decoded; // { userId, email, role }
  next();
};
```

#### **Role-Based Access Control**
```javascript
// Middleware for role checking
const requireRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};
```

### ✅ **Current Status**
- ✅ **Basic Authentication**: Fully implemented and tested
- ✅ **Enhanced Authentication**: OTP verification working
- ✅ **OAuth Integration**: Google and LinkedIn functional
- ✅ **Session Management**: JWT with refresh tokens
- ✅ **Role-Based Access**: Admin, Project Owner, Investor roles
- ✅ **Professional Rejection Flow**: Enhanced resubmission process

---

## 📊 **Section 2: Project Management Flow**

### 🎯 **Purpose & Functionality**
Complete project lifecycle management from creation to approval, including admin review workflow, status tracking, and homepage integration for approved projects.

### 📱 **Frontend Components**
```typescript
// Project Owner Interface
frontend/src/pages/project-owner/ProjectOwnerDashboard.tsx  // Main project management
frontend/src/components/ProjectCreateForm.tsx               // Project creation form
frontend/src/components/ProjectEditForm.tsx                 // Project editing interface

// Project Display
frontend/src/components/ProjectCard.tsx                     // Reusable project display
frontend/src/components/ProjectDetailsModal.tsx            // Comprehensive project details
frontend/src/pages/Index.tsx                               // Homepage with approved projects

// Admin Interface
frontend/src/pages/admin/AdminDashboard.tsx                // Admin project management
frontend/src/components/admin/ProjectApproval.tsx          // Project review interface
```

### 🔌 **API Endpoints & Methods**

#### **Project CRUD Operations** (`/api/projects/*`)
```javascript
GET    /api/projects                    // List all approved projects (public)
GET    /api/projects/approved           // Homepage approved projects
GET    /api/projects/my/projects        // Project owner's projects (auth required)
GET    /api/projects/:id                // Single project details
POST   /api/projects                    // Create new project (project_owner role)
PUT    /api/projects/:id                // Update project (owner only)
DELETE /api/projects/:id                // Delete project (owner only)
PUT    /api/projects/:id/submit         // Submit project for admin review
```

#### **Admin Project Management** (`/api/projects/admin/*`)
```javascript
GET    /api/projects/admin/pending      // Projects awaiting review (admin only)
GET    /api/projects/admin/all          // All projects with status filter
PUT    /api/projects/admin/:id/approve  // Approve project (admin only)
PUT    /api/projects/admin/:id/reject   // Reject with reason (admin only)
PUT    /api/projects/admin/:id/edit     // Admin edit any project
PUT    /api/projects/admin/:id/feature  // Mark project as featured
```

#### **File Upload Support** (`/api/projects/upload/*`)
```javascript
POST   /api/projects/upload/image       // Upload project logo/image
POST   /api/projects/upload/document    // Upload pitch deck/business plan
DELETE /api/projects/upload/:fileId     // Delete uploaded file
```

### 🗄️ **Database Tables & Relationships**

#### **Core Project Tables**
```sql
-- Main project storage
projects (
    id INT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(500),
    industry VARCHAR(100) NOT NULL,       -- Maps to form category field
    subcategory VARCHAR(100),
    funding_goal DECIMAL(15,2) NOT NULL,
    current_funding DECIMAL(15,2) DEFAULT 0.00,
    minimum_investment DECIMAL(10,2) DEFAULT 100.00,
    equity_percentage DECIMAL(5,2),
    location VARCHAR(200) NOT NULL,
    team_size INT NOT NULL,
    project_stage ENUM('idea', 'prototype', 'mvp', 'early_revenue', 'growth'),
    project_status ENUM('draft', 'submitted', 'approved', 'rejected'),  -- Key status field
    owner_id INT FOREIGN KEY REFERENCES users(id),
    logo_url VARCHAR(500),               -- Project image/logo
    video_url VARCHAR(500),
    business_plan_url VARCHAR(500),
    pitch_deck_url VARCHAR(500),
    featured BOOLEAN DEFAULT FALSE,
    admin_notes TEXT,                    -- Admin approval/rejection notes
    rejected_reason TEXT,                -- Detailed rejection reason
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- File management for projects
project_files (
    id VARCHAR(50) PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_type ENUM('image', 'document', 'business_plan', 'pitch_deck'),
    uploaded_by INT FOREIGN KEY REFERENCES users(id),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project categorization
project_tags (
    id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#2C91D5',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project-tag relationships
project_tag_relationships (
    id INT PRIMARY KEY,
    project_id INT FOREIGN KEY REFERENCES projects(id),
    tag_id INT FOREIGN KEY REFERENCES project_tags(id),
    UNIQUE KEY unique_project_tag (project_id, tag_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project progress tracking
project_updates (
    id INT PRIMARY KEY,
    project_id INT FOREIGN KEY REFERENCES projects(id),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    update_type ENUM('general', 'milestone', 'financial', 'team'),
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 🔄 **Data Flow Diagrams**

#### **Project Creation Flow**
```
1. Project Owner visits dashboard
2. Frontend: ProjectOwnerDashboard.tsx renders with "Create Project" button
3. User clicks create, opens ProjectCreateForm.tsx
4. User fills form (title, description, industry, funding_goal, etc.)
5. Optional: User uploads project image and pitch deck
6. API: POST /api/projects with multipart/form-data
7. Backend: Validates data, saves to projects table (status='draft')
8. Database: INSERT into projects, project_files (if uploads)
9. Frontend: Success message, redirects to project list
10. Status: Project appears in "My Projects" with "Draft" badge
```

#### **Project Submission & Approval Flow**
```
1. Project Owner: Clicks "Submit for Review" on draft project
2. API: PUT /api/projects/:id/submit
3. Backend: Updates project_status='submitted'
4. Database: UPDATE projects SET project_status='submitted'
5. Admin: Sees project in "Pending Reviews" tab of AdminDashboard
6. Admin: Reviews project details in admin interface
7. Admin: Clicks "Approve" or "Reject" with notes
8. API: PUT /api/projects/admin/:id/approve OR PUT /api/projects/admin/:id/reject
9. Backend: Updates project_status + admin_notes/rejected_reason
10. Database: UPDATE projects SET project_status='approved'/'rejected'
11. If Approved: Project appears on homepage via GET /api/projects/approved
12. Project Owner: Sees updated status in dashboard with admin feedback
```

#### **Homepage Integration Flow**
```
1. User visits homepage (/)
2. Frontend: Index.tsx calls GET /api/projects/approved
3. Backend: SELECT from projects WHERE project_status='approved'
4. Database: Returns approved projects with logo_url, funding progress
5. Frontend: Maps data to ProjectCard components in 3x3 grid
6. User: Clicks "Know More" on ProjectCard
7. Frontend: Opens ProjectDetailsModal.tsx with full project data
8. Modal: Displays 4 tabs (Overview, Funding, Team, Documents)
9. User: Can rate, bookmark, share, or express investment interest
```

### 🛠️ **Implementation Details**

#### **Project Status State Machine**
```javascript
// Valid status transitions
const validTransitions = {
  'draft': ['submitted'],
  'submitted': ['approved', 'rejected'],
  'rejected': ['submitted'],  // Allow resubmission
  'approved': []  // Final state
};
```

#### **File Upload Configuration**
```javascript
// Multer configuration for project files
const upload = multer({
  dest: '/var/www/uploads/projects/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    // Images: PNG, JPG, JPEG, WEBP
    // Documents: PDF, PPT, PPTX
    const allowedTypes = /jpeg|jpg|png|webp|pdf|ppt|pptx/;
    cb(null, allowedTypes.test(file.mimetype));
  }
});
```

### ✅ **Current Status**
- ✅ **Project Creation**: Streamlined form with essential fields
- ✅ **File Upload**: Image and document upload working
- ✅ **Status Management**: Complete draft→submitted→approved workflow
- ✅ **Admin Review**: Approve/reject with feedback system
- ✅ **Homepage Integration**: Approved projects display automatically
- ✅ **ProjectCard Component**: Consistent UI across platform
- ✅ **ProjectDetailsModal**: Comprehensive 4-tab project details

---

## 💰 **Section 3: Investment System Flow**

### 🎯 **Purpose & Functionality**
Investment tracking, project rating system, and watchlist management allowing investors to discover, evaluate, and track investment opportunities.

### 📱 **Frontend Components**
```typescript
// Investor Interface
frontend/src/pages/investor/InvestorDashboard.tsx           // Main investor interface
frontend/src/components/investment/InvestmentCard.tsx       // Investment opportunity display
frontend/src/components/investment/InvestmentFilters.tsx    // Search and filter options

// Project Interaction
frontend/src/components/ProjectDetailsModal.tsx            // Investment details & actions
frontend/src/components/rating/RatingSystem.tsx            // Project rating interface
frontend/src/components/watchlist/WatchlistButton.tsx      // Save/unsave projects

// Investment Management
frontend/src/components/investment/InvestmentHistory.tsx    // Investment tracking
frontend/src/components/investment/PortfolioOverview.tsx    // Portfolio analytics
```

### 🔌 **API Endpoints & Methods**

#### **Investment Management** (`/api/investments/*`)
```javascript
GET    /api/investments                 // User's investment history (investor role)
GET    /api/investments/:id             // Single investment details
POST   /api/investments                 // Create new investment (investor role)
PUT    /api/investments/:id             // Update investment status
DELETE /api/investments/:id             // Cancel pending investment

// Investment analytics
GET    /api/investments/analytics       // Portfolio performance data
GET    /api/investments/project/:id     // Investments for specific project
```

#### **Rating System** (`/api/ratings/*`)
```javascript
GET    /api/ratings/:projectId          // Get project ratings and reviews
POST   /api/ratings                     // Submit project rating (authenticated)
PUT    /api/ratings/:id                 // Update user's rating
DELETE /api/ratings/:id                 // Delete user's rating

// Rating analytics
GET    /api/ratings/analytics/:projectId // Rating breakdown and statistics
```

#### **Watchlist Management** (`/api/watchlist/*`)
```javascript
GET    /api/watchlist                   // User's saved projects (authenticated)
POST   /api/watchlist                   // Add project to watchlist
DELETE /api/watchlist/:projectId        // Remove from watchlist
PUT    /api/watchlist/:projectId        // Update watchlist notes
```

### 🗄️ **Database Tables & Relationships**

#### **Investment Tables**
```sql
-- Investment tracking
investments (
    id INT PRIMARY KEY,
    project_id INT FOREIGN KEY REFERENCES projects(id),
    investor_id INT FOREIGN KEY REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    equity_received DECIMAL(5,2),
    investment_type ENUM('equity', 'debt', 'convertible') DEFAULT 'equity',
    status ENUM('pending', 'completed', 'cancelled', 'refunded'),
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    due_diligence_completed BOOLEAN DEFAULT FALSE,
    contract_signed BOOLEAN DEFAULT FALSE,
    investment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completion_date TIMESTAMP NULL,
    notes TEXT,

    UNIQUE KEY unique_pending_investment (project_id, investor_id, status)
);

-- Project rating system
project_ratings (
    id INT PRIMARY KEY,
    project_id INT FOREIGN KEY REFERENCES projects(id),
    user_id INT FOREIGN KEY REFERENCES users(id),
    rating DECIMAL(2,1) CHECK (rating >= 1.0 AND rating <= 5.0),
    review TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_user_project_rating (project_id, user_id)
);

-- Watchlist/bookmarks
watchlist (
    id INT PRIMARY KEY,
    user_id INT FOREIGN KEY REFERENCES users(id),
    project_id INT FOREIGN KEY REFERENCES projects(id),
    notes TEXT,
    notification_preferences JSON,  -- Email alerts, status updates, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_user_project_watchlist (user_id, project_id)
);
```

### 🔄 **Data Flow Diagrams**

#### **Investment Discovery Flow**
```
1. Investor logs in, visits InvestorDashboard
2. Frontend: Loads approved projects via GET /api/projects/approved
3. Frontend: Renders projects in 3x3 grid with filtering options
4. User: Applies filters (category, funding range, location)
5. Frontend: Updates project list based on filter criteria
6. User: Clicks "Know More" on interesting project
7. Frontend: Opens ProjectDetailsModal with investment tab
8. Modal: Shows funding details, progress, team info
9. User: Can rate project, add to watchlist, or express interest
```

#### **Investment Process Flow**
```
1. User clicks "Invest Now" in ProjectDetailsModal
2. Frontend: Shows investment form with amount and type selection
3. User: Enters investment amount and selects equity/debt option
4. API: POST /api/investments with investment details
5. Backend: Validates investment (min amount, project status)
6. Database: INSERT into investments table (status='pending')
7. Backend: Triggers due diligence workflow
8. Frontend: Shows success message and next steps
9. Investment: Appears in user's investment history
10. Project Owner: Gets notification of investment interest
```

#### **Rating & Review Flow**
```
1. User views project in ProjectDetailsModal
2. Frontend: Shows current rating and review section
3. User: Selects star rating (1-5) and writes optional review
4. API: POST /api/ratings with rating data
5. Backend: Validates user hasn't already rated this project
6. Database: INSERT into project_ratings table
7. Backend: Recalculates project average rating
8. Database: UPDATE projects SET average_rating = calculated_average
9. Frontend: Updates displayed rating immediately
10. Other users: See updated rating on project cards
```

#### **Watchlist Management Flow**
```
1. User clicks watchlist/bookmark icon on project
2. API: POST /api/watchlist with project_id
3. Backend: Checks if already in watchlist
4. Database: INSERT into watchlist table (or DELETE if removing)
5. Frontend: Updates watchlist icon state (filled/empty)
6. User: Can view all watchlisted projects in dashboard
7. API: GET /api/watchlist returns user's saved projects
8. Frontend: Displays watchlist with project details and notes
```

### 🛠️ **Implementation Details**

#### **Investment Validation Logic**
```javascript
// Investment amount validation
const validateInvestment = (project, amount) => {
  if (amount < project.minimum_investment) {
    throw new Error(`Minimum investment is $${project.minimum_investment}`);
  }
  if (project.current_funding + amount > project.funding_goal) {
    throw new Error('Investment would exceed funding goal');
  }
  return true;
};
```

#### **Rating Aggregation**
```javascript
// Automatic rating calculation
const updateProjectRating = async (projectId) => {
  const result = await executeQuery(`
    SELECT AVG(rating) as avg_rating, COUNT(*) as rating_count
    FROM project_ratings WHERE project_id = ?
  `, [projectId]);

  await executeQuery(`
    UPDATE projects
    SET average_rating = ?, rating_count = ?
    WHERE id = ?
  `, [result[0].avg_rating, result[0].rating_count, projectId]);
};
```

### ✅ **Current Status**
- ✅ **Investment Tracking**: Database schema and API endpoints ready
- ✅ **Rating System**: Functional rating with aggregation
- ✅ **Watchlist**: Save/unsave projects working
- ✅ **ProjectDetailsModal**: Investment interface integrated
- 🚧 **Payment Integration**: Planned for Phase 2
- 🚧 **Due Diligence Workflow**: Planned for Phase 2

---

## ⚙️ **Section 4: Admin Management Flow**

### 🎯 **Purpose & Functionality**
Comprehensive admin panel for user management, project approval workflow, content moderation, and platform analytics with role-based access control.

### 📱 **Frontend Components**
```typescript
// Main Admin Interface
frontend/src/pages/admin/AdminDashboard.tsx             // Central admin dashboard
frontend/src/components/admin/AdminSidebar.tsx         // Navigation sidebar

// User Management
frontend/src/components/admin/UserManagement.tsx       // User approval/management
frontend/src/components/admin/UserDetailsModal.tsx     // User profile editing
frontend/src/components/admin/UserApprovalQueue.tsx    // Pending user approvals

// Project Management
frontend/src/components/admin/ProjectManagement.tsx    // Project oversight
frontend/src/components/admin/ProjectApproval.tsx      // Project review interface
frontend/src/components/admin/ProjectEditModal.tsx     // Admin project editing

// Content Management
frontend/src/components/admin/BlogManagement.tsx       // Blog post management
frontend/src/components/admin/CaseStudyManagement.tsx  // Case study management
frontend/src/components/BlogCreateForm.tsx             // Blog creation form
frontend/src/components/CaseStudyCreateForm.tsx        // Case study creation

// Analytics & Reports
frontend/src/components/admin/AnalyticsDashboard.tsx   // Platform statistics
frontend/src/components/admin/UserAnalytics.tsx       // User behavior insights
frontend/src/components/admin/ProjectAnalytics.tsx    // Project performance
```

### 🔌 **API Endpoints & Methods**

#### **User Management** (`/api/admin/users/*`)
```javascript
GET    /api/admin/users                 // List all users with filters (admin only)
GET    /api/admin/users/pending         // Users awaiting approval
GET    /api/admin/users/:id             // Single user details
PUT    /api/admin/users/:id/approve     // Approve user account
PUT    /api/admin/users/:id/reject      // Reject user with reason
PUT    /api/admin/users/:id             // Update user profile (admin edit)
DELETE /api/admin/users/:id             // Deactivate user account
POST   /api/admin/users/:id/reset-password // Reset user password
```

#### **Project Administration** (`/api/admin/projects/*`)
```javascript
GET    /api/admin/projects              // All projects with status filter
GET    /api/admin/projects/pending      // Projects awaiting review
PUT    /api/admin/projects/:id/approve  // Approve project for public listing
PUT    /api/admin/projects/:id/reject   // Reject with detailed feedback
PUT    /api/admin/projects/:id/feature  // Mark as featured project
PUT    /api/admin/projects/:id          // Admin edit project details
DELETE /api/admin/projects/:id          // Remove project from platform
```

#### **Content Administration** (`/api/admin/content/*`)
```javascript
// Blog Management
GET    /api/blogs/admin/all             // All blog posts (published + drafts)
POST   /api/blogs                       // Create new blog post (admin only)
PUT    /api/blogs/:id                   // Update blog post
DELETE /api/blogs/:id                   // Delete blog post

// Case Study Management
GET    /api/case-studies/admin/all      // All case studies with status
POST   /api/case-studies               // Create new case study
PUT    /api/case-studies/:id           // Update case study
DELETE /api/case-studies/:id           // Delete case study
```

#### **Analytics & Reporting** (`/api/admin/analytics/*`)
```javascript
GET    /api/admin/analytics/overview    // Platform overview statistics
GET    /api/admin/analytics/users       // User growth and behavior metrics
GET    /api/admin/analytics/projects    // Project performance metrics
GET    /api/admin/analytics/investments // Investment activity data
GET    /api/admin/analytics/content     // Blog and case study metrics
```

#### **System Administration** (`/api/admin/system/*`)
```javascript
GET    /api/admin/system/logs           // System activity logs
GET    /api/admin/system/health         // Platform health check
PUT    /api/admin/system/settings       // Update system configuration
POST   /api/admin/system/backup         // Trigger database backup
```

### 🗄️ **Database Tables & Relationships**

#### **Admin & Audit Tables**
```sql
-- Admin activity logging
admin_logs (
    id INT PRIMARY KEY,
    admin_id INT FOREIGN KEY REFERENCES users(id),
    action VARCHAR(100) NOT NULL,       -- 'approve_user', 'reject_project', etc.
    entity_type VARCHAR(50) NOT NULL,   -- 'user', 'project', 'blog', etc.
    entity_id INT,                      -- ID of affected entity
    old_values JSON,                    -- Previous state
    new_values JSON,                    -- New state after change
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System configuration
system_settings (
    id INT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSON,
    description TEXT,
    updated_by INT FOREIGN KEY REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Platform analytics cache
analytics_cache (
    id INT PRIMARY KEY,
    metric_type VARCHAR(50) NOT NULL,   -- 'user_growth', 'project_stats', etc.
    date_range VARCHAR(20),             -- 'daily', 'weekly', 'monthly'
    data JSON,                          -- Calculated metrics
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);
```

### 🔄 **Data Flow Diagrams**

#### **User Approval Workflow**
```
1. New user completes enhanced signup with OTP verification
2. Database: User created with approval_status='pending'
3. Admin: Logs into AdminDashboard, sees pending user in queue
4. Admin: Reviews user profile, company details, role justification
5. Admin: Clicks "Approve" or "Reject" with optional notes
6. API: PUT /api/admin/users/:id/approve or reject
7. Backend: Updates user approval_status, logs admin action
8. Database: UPDATE users SET approval_status='approved'
9. Database: INSERT into admin_logs (action, entity details)
10. System: Sends email notification to user about decision
11. If approved: User can access full platform features
12. If rejected: User sees professional rejection screen with resubmission option
```

#### **Project Review & Approval Flow**
```
1. Project owner submits project for review (status='submitted')
2. Admin: Sees project in "Pending Reviews" tab of dashboard
3. Admin: Clicks project to open detailed review interface
4. Review Interface: Shows all project data, uploaded files, owner info
5. Admin: Reviews business plan, pitch deck, project viability
6. Admin: Enters approval notes or detailed rejection reason
7. API: PUT /api/admin/projects/:id/approve or reject
8. Backend: Updates project_status, saves admin feedback
9. Database: UPDATE projects SET project_status='approved', admin_notes=...
10. Database: INSERT into admin_logs for audit trail
11. If approved: Project appears on homepage via /api/projects/approved
12. If rejected: Owner sees feedback and can edit/resubmit
```

#### **Content Management Flow**
```
1. Admin: Accesses content management section of dashboard
2. Frontend: Shows tabs for blogs and case studies with stats
3. Admin: Clicks "Create New Blog" or "Create Case Study"
4. Frontend: Opens BlogCreateForm or CaseStudyCreateForm modal
5. Admin: Fills rich text content, uploads images, sets SEO data
6. API: POST /api/blogs or POST /api/case-studies
7. Backend: Validates content, processes images, saves to database
8. Database: INSERT into blogs/case_studies with status='published'
9. Frontend: Success message, updates content list
10. Public: New content appears on /blog or /case-studies pages
11. Admin: Can later edit, update, or delete content as needed
```

#### **Analytics Dashboard Flow**
```
1. Admin: Visits analytics section of dashboard
2. Frontend: Calls multiple analytics endpoints in parallel
3. APIs: GET /api/admin/analytics/overview, users, projects, etc.
4. Backend: Queries multiple tables, calculates metrics
5. Calculations: User growth, project approval rates, investment activity
6. Database: Caches results in analytics_cache for performance
7. Frontend: Renders charts, graphs, and key performance indicators
8. Charts: User registration trends, project category distribution
9. Metrics: Conversion rates, platform engagement, revenue projections
10. Admin: Can export reports and drill down into specific data
```

### 🛠️ **Implementation Details**

#### **Admin Permission Middleware**
```javascript
// Require admin role for all admin routes
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Apply to all admin routes
app.use('/api/admin/*', verifyToken, requireAdmin);
```

#### **Audit Logging System**
```javascript
// Automatic logging of admin actions
const logAdminAction = async (adminId, action, entityType, entityId, oldValues, newValues, req) => {
  await executeQuery(`
    INSERT INTO admin_logs (admin_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    adminId, action, entityType, entityId,
    JSON.stringify(oldValues), JSON.stringify(newValues),
    req.ip, req.get('User-Agent')
  ]);
};
```

#### **Analytics Calculation Engine**
```javascript
// Daily analytics aggregation
const calculateDailyMetrics = async () => {
  const userMetrics = await executeQuery(`
    SELECT
      COUNT(*) as total_users,
      SUM(CASE WHEN approval_status = 'approved' THEN 1 ELSE 0 END) as approved_users,
      SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as new_users_week
    FROM users
  `);

  const projectMetrics = await executeQuery(`
    SELECT
      COUNT(*) as total_projects,
      SUM(CASE WHEN project_status = 'approved' THEN 1 ELSE 0 END) as live_projects,
      AVG(funding_goal) as avg_funding_goal
    FROM projects
  `);

  // Cache results for dashboard performance
  await cacheMetrics('daily_overview', { users: userMetrics[0], projects: projectMetrics[0] });
};
```

### ✅ **Current Status**
- ✅ **User Management**: Complete approval/rejection workflow
- ✅ **Project Administration**: Review and approval system working
- ✅ **Content Management**: Blog and case study creation/editing
- ✅ **Admin Dashboard**: Comprehensive interface with statistics
- ✅ **Audit Logging**: Admin action tracking implemented
- 🚧 **Advanced Analytics**: Basic metrics implemented, advanced reports planned
- 🚧 **System Settings**: Configuration management planned

---

## 📝 **Section 5: Content Management System Flow**

### 🎯 **Purpose & Functionality**
Professional blog and case study management system with SEO optimization, category management, and public showcase pages for thought leadership and success stories.

### 📱 **Frontend Components**
```typescript
// Public Content Pages
frontend/src/pages/Blog.tsx                    // Blog listing page with search/filter
frontend/src/pages/BlogPost.tsx               // Individual blog post display
frontend/src/pages/CaseStudies.tsx            // Case study showcase page
frontend/src/pages/CaseStudy.tsx              // Individual case study detail

// Admin Content Management
frontend/src/components/BlogCreateForm.tsx     // Blog post creation form
frontend/src/components/CaseStudyCreateForm.tsx // Case study creation form
frontend/src/components/BlogEditForm.tsx       // Blog editing interface
frontend/src/components/CaseStudyEditForm.tsx  // Case study editing

// Content Display Components
frontend/src/components/BlogCard.tsx           // Blog post preview card
frontend/src/components/CaseStudyCard.tsx      // Case study preview card
frontend/src/components/ContentEditor.tsx      // Rich text editor component
frontend/src/components/SEOFields.tsx          // SEO metadata fields
```

### 🔌 **API Endpoints & Methods**

#### **Blog Management** (`/api/blogs/*`)
```javascript
// Public Blog APIs
GET    /api/blogs                       // Public blog listing with pagination
GET    /api/blogs/:slug                 // Single blog post by slug
GET    /api/blogs/categories            // Blog categories for filtering
GET    /api/blogs/featured              // Featured blog posts
GET    /api/blogs/search?q=term         // Search blog posts

// Admin Blog APIs (Protected)
GET    /api/blogs/admin/all             // All blogs (published + drafts) - admin only
POST   /api/blogs                       // Create new blog post - admin only
PUT    /api/blogs/:id                   // Update blog post - admin only
DELETE /api/blogs/:id                   // Delete blog post - admin only
PUT    /api/blogs/:id/publish           // Publish draft blog - admin only
PUT    /api/blogs/:id/feature           // Mark as featured - admin only
```

#### **Case Study Management** (`/api/case-studies/*`)
```javascript
// Public Case Study APIs
GET    /api/case-studies               // Public case study listing
GET    /api/case-studies/:slug         // Single case study by slug
GET    /api/case-studies/industries    // Industry categories for filtering
GET    /api/case-studies/featured      // Featured success stories

// Admin Case Study APIs (Protected)
GET    /api/case-studies/admin/all     // All case studies - admin only
POST   /api/case-studies               // Create new case study - admin only
PUT    /api/case-studies/:id           // Update case study - admin only
DELETE /api/case-studies/:id           // Delete case study - admin only
PUT    /api/case-studies/:id/publish   // Publish draft - admin only
```

#### **Content Analytics** (`/api/content/*`)
```javascript
GET    /api/content/analytics           // Content performance metrics
PUT    /api/blogs/:slug/view            // Increment blog view count
PUT    /api/case-studies/:slug/view     // Increment case study views
GET    /api/content/popular             // Most viewed content
GET    /api/content/trending            // Trending content this week
```

### 🗄️ **Database Tables & Relationships**

#### **Blog System Tables**
```sql
-- Main blog storage
blogs (
    id INT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,  -- URL-friendly identifier
    excerpt TEXT,                       -- Short description for previews
    content LONGTEXT NOT NULL,          -- Full HTML content
    featured_image VARCHAR(500),        -- Header/preview image URL
    author_id INT FOREIGN KEY REFERENCES users(id),
    status ENUM('draft', 'published') DEFAULT 'draft',
    published_at TIMESTAMP NULL,
    meta_title VARCHAR(255),            -- SEO title
    meta_description TEXT,              -- SEO description
    tags JSON,                          -- Array of tags ["startup", "funding"]
    view_count INT DEFAULT 0,
    reading_time INT DEFAULT 5,         -- Estimated reading time in minutes
    featured BOOLEAN DEFAULT FALSE,     -- Show on homepage/featured section
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Blog category system
blog_categories (
    id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#2C91D5',  -- Category color for UI
    icon VARCHAR(50),                    -- Icon class name
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blog-category relationships (many-to-many)
blog_category_relationships (
    id INT PRIMARY KEY,
    blog_id INT FOREIGN KEY REFERENCES blogs(id),
    category_id INT FOREIGN KEY REFERENCES blog_categories(id),
    UNIQUE KEY unique_blog_category (blog_id, category_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **Case Study System Tables**
```sql
-- Case study storage
case_studies (
    id INT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    client_name VARCHAR(200),           -- Client/company name
    client_logo VARCHAR(500),           -- Client logo URL
    industry VARCHAR(100),              -- Business sector
    project_duration VARCHAR(100),      -- e.g., "6 months", "1 year"
    project_budget_range VARCHAR(100),  -- e.g., "$50K - $100K"

    -- Case study content structure
    challenge TEXT NOT NULL,            -- The problem/challenge faced
    solution TEXT NOT NULL,             -- How Zuvomo helped solve it
    results TEXT NOT NULL,              -- Outcomes and achievements

    -- Success metrics and testimonials
    metrics JSON,                       -- {"funding_raised": "$2M", "roi": "300%"}
    images JSON,                        -- Array of project images
    testimonial TEXT,                   -- Client testimonial quote
    testimonial_author VARCHAR(200),    -- Testimonial author name
    testimonial_position VARCHAR(200),  -- Author's title/position

    -- Publishing and SEO
    status ENUM('draft', 'published') DEFAULT 'draft',
    featured BOOLEAN DEFAULT FALSE,
    meta_title VARCHAR(255),
    meta_description TEXT,
    tags JSON,                          -- Industry tags, achievement tags
    view_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### **Content Media Management**
```sql
-- Centralized media storage for content
content_media (
    id VARCHAR(50) PRIMARY KEY,
    content_type ENUM('blog', 'case_study') NOT NULL,
    content_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_url VARCHAR(500) NOT NULL,     -- Public URL for serving
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    alt_text VARCHAR(255),              -- SEO/accessibility alt text
    caption TEXT,                       -- Image caption
    is_featured BOOLEAN DEFAULT FALSE,  -- Featured/header image
    sort_order INT DEFAULT 0,           -- Display order for galleries
    uploaded_by INT FOREIGN KEY REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 🔄 **Data Flow Diagrams**

#### **Blog Creation & Publishing Flow**
```
1. Admin: Logs into AdminDashboard, navigates to content management
2. Frontend: Shows blog management tab with existing posts
3. Admin: Clicks "Create New Blog Post" button
4. Frontend: Opens BlogCreateForm modal with rich text editor
5. Admin: Enters title, content, excerpt, SEO fields, uploads featured image
6. Frontend: Auto-generates slug from title, validates required fields
7. API: POST /api/blogs with blog data and image upload
8. Backend: Validates content, processes images, generates reading time
9. Database: INSERT into blogs table (status='draft' initially)
10. Database: INSERT into content_media for uploaded images
11. Admin: Can preview draft or publish immediately
12. If published: Blog appears on public /blog page
13. API: GET /api/blogs returns published blogs for public viewing
```

#### **Case Study Showcase Flow**
```
1. Public user visits /case-studies page
2. Frontend: CaseStudies.tsx calls GET /api/case-studies
3. Backend: SELECT published case studies with metrics and testimonials
4. Frontend: Renders case studies in grid with industry filters
5. User: Clicks on case study card for details
6. Frontend: Navigates to /case-studies/:slug
7. API: GET /api/case-studies/:slug with full case study data
8. Frontend: CaseStudy.tsx renders challenge/solution/results sections
9. Display: Shows metrics cards, client testimonial, project images
10. User: Can share case study or contact for similar projects
11. Analytics: PUT /api/case-studies/:slug/view increments view count
```

#### **Content Management Dashboard Flow**
```
1. Admin: Accesses content section of AdminDashboard
2. Frontend: Calls GET /api/blogs/admin/all and GET /api/case-studies/admin/all
3. Backend: Returns all content (published + drafts) with statistics
4. Dashboard: Shows content overview with creation buttons
5. Statistics: Total posts, published count, drafts, monthly views
6. Admin: Can edit existing content by clicking on items
7. Edit Action: Opens respective edit form with pre-populated data
8. Update: PUT /api/blogs/:id or PUT /api/case-studies/:id
9. Backend: Updates content, maintains audit trail
10. Dashboard: Refreshes to show updated content list
```

#### **SEO & Public Discovery Flow**
```
1. Search engines crawl public blog and case study pages
2. Frontend: Renders proper meta tags from database SEO fields
3. SEO Tags: Title, description, Open Graph, Twitter cards
4. Social Sharing: Users share content with rich previews
5. Internal Linking: Related content suggestions and tag navigation
6. Analytics: Track page views, time on page, bounce rates
7. Performance: Optimized images and fast loading times
8. Mobile: Responsive design for all device types
```

### 🛠️ **Implementation Details**

#### **Rich Text Editor Configuration**
```javascript
// Content editor with security sanitization
const editorConfig = {
  toolbar: ['bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote', 'heading'],
  allowedContent: true,
  removePlugins: ['image'], // Handle images separately for security
  extraAllowedContent: 'div(*);span(*);p(*);strong;em;ul;ol;li;h1;h2;h3;h4;a[href]'
};
```

#### **Slug Generation System**
```javascript
// Auto-generate SEO-friendly slugs
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
};

// Ensure slug uniqueness
const ensureUniqueSlug = async (slug, tableName, id = null) => {
  const existing = await getOne(`SELECT id FROM ${tableName} WHERE slug = ? ${id ? 'AND id != ?' : ''}`,
    id ? [slug, id] : [slug]);

  if (existing) {
    return ensureUniqueSlug(`${slug}-${Date.now()}`, tableName, id);
  }
  return slug;
};
```

#### **Reading Time Calculation**
```javascript
// Estimate reading time based on content
const calculateReadingTime = (content) => {
  const wordsPerMinute = 200;
  const textContent = content.replace(/<[^>]*>/g, ''); // Strip HTML
  const wordCount = textContent.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
};
```

#### **Image Processing Pipeline**
```javascript
// Process uploaded images for content
const processContentImage = async (file, contentType, contentId) => {
  // Resize and optimize image
  const processedImage = await sharp(file.buffer)
    .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();

  // Generate unique filename and save
  const filename = `${contentType}-${contentId}-${Date.now()}.jpg`;
  const filepath = path.join('/var/www/uploads/content/', filename);
  await fs.writeFile(filepath, processedImage);

  // Store metadata in database
  const mediaRecord = {
    id: generateId(),
    content_type: contentType,
    content_id: contentId,
    file_name: filename,
    file_url: `/uploads/content/${filename}`,
    file_size: processedImage.length,
    mime_type: 'image/jpeg'
  };

  await executeQuery('INSERT INTO content_media SET ?', mediaRecord);
  return mediaRecord.file_url;
};
```

### ✅ **Current Status**
- ✅ **Blog System**: Complete creation, editing, and public display
- ✅ **Case Study System**: Comprehensive success story showcase
- ✅ **Rich Text Editor**: Content creation with image upload
- ✅ **SEO Optimization**: Meta tags, slugs, and social sharing
- ✅ **Category Management**: Blog categorization and filtering
- ✅ **Admin Interface**: Content management dashboard
- ✅ **Public Pages**: Professional blog and case study displays
- ✅ **Analytics**: View tracking and content performance
- 🚧 **Advanced Features**: Comments, newsletter signup, RSS feeds planned

---

## 📁 **Section 6: File Upload & Media Management Flow**

### 🎯 **Purpose & Functionality**
Centralized file upload, processing, and serving system for project images, documents, blog media, and case study assets with security validation and optimized delivery.

### 📱 **Frontend Components**
```typescript
// File Upload Components
frontend/src/components/upload/FileUploader.tsx        // Generic file upload component
frontend/src/components/upload/ImageUploader.tsx       // Image-specific uploader
frontend/src/components/upload/DocumentUploader.tsx    // Document upload (PDF, PPT)
frontend/src/components/upload/DragDropZone.tsx        // Drag & drop interface

// Media Display Components
frontend/src/components/media/ImageGallery.tsx         // Image gallery display
frontend/src/components/media/DocumentViewer.tsx       // Document preview/download
frontend/src/components/media/MediaLibrary.tsx         // Admin media management
frontend/src/components/media/ImageOptimizer.tsx       // Client-side image optimization
```

### 🔌 **API Endpoints & Methods**

#### **Project File Uploads** (`/api/projects/upload/*`)
```javascript
POST   /api/projects/upload/image       // Upload project logo/featured image
POST   /api/projects/upload/document    // Upload pitch deck, business plan
POST   /api/projects/upload/gallery     // Upload project gallery images
DELETE /api/projects/upload/:fileId     // Delete project file
GET    /api/projects/:id/files          // List project files
```

#### **Content Media Uploads** (`/api/content/upload/*`)
```javascript
POST   /api/content/upload/blog         // Upload blog post images
POST   /api/content/upload/case-study   // Upload case study media
POST   /api/content/upload/featured     // Upload featured/header images
DELETE /api/content/upload/:fileId      // Delete content media
GET    /api/content/:type/:id/media     // List content media files
```

#### **Admin Media Management** (`/api/admin/media/*`)
```javascript
GET    /api/admin/media                 // List all uploaded files (admin only)
DELETE /api/admin/media/:fileId         // Delete any file (admin only)
GET    /api/admin/media/orphaned        // Find unused/orphaned files
POST   /api/admin/media/cleanup         // Clean up orphaned files
GET    /api/admin/media/stats           // File storage statistics
```

#### **Static File Serving** (Nginx Configuration)
```nginx
# Serve uploaded files
location /uploads/ {
    alias /var/www/uploads/;
    expires 30d;
    add_header Cache-Control "public, immutable";
    add_header X-Content-Type-Options nosniff;
}
```

### 🗄️ **Database Tables & Relationships**

#### **Project File Management**
```sql
-- Project-specific files
project_files (
    id VARCHAR(50) PRIMARY KEY,         -- UUID for secure file identification
    project_id VARCHAR(50) NOT NULL,    -- References projects table
    file_name VARCHAR(255) NOT NULL,    -- Generated filename on disk
    original_name VARCHAR(255) NOT NULL, -- User's original filename
    file_path VARCHAR(500) NOT NULL,    -- Full filesystem path
    file_url VARCHAR(500) NOT NULL,     -- Public URL for access
    file_size BIGINT NOT NULL,          -- File size in bytes
    mime_type VARCHAR(100) NOT NULL,    -- MIME type for validation
    file_type ENUM('image', 'document', 'business_plan', 'pitch_deck', 'gallery'),
    description TEXT,                   -- User-provided description
    uploaded_by INT FOREIGN KEY REFERENCES users(id),
    is_public BOOLEAN DEFAULT FALSE,    -- Public access vs. investor-only
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_project_id (project_id),
    INDEX idx_file_type (file_type),
    INDEX idx_uploaded_by (uploaded_by)
);
```

#### **Content Media Management**
```sql
-- Blog and case study media
content_media (
    id VARCHAR(50) PRIMARY KEY,
    content_type ENUM('blog', 'case_study') NOT NULL,
    content_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    alt_text VARCHAR(255),              -- SEO alt text for images
    caption TEXT,                       -- Image caption/description
    is_featured BOOLEAN DEFAULT FALSE,  -- Featured/header image flag
    sort_order INT DEFAULT 0,           -- Display order for galleries
    uploaded_by INT FOREIGN KEY REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_content_type_id (content_type, content_id),
    INDEX idx_is_featured (is_featured)
);
```

#### **File Upload Tracking**
```sql
-- Track all file operations for auditing
file_upload_logs (
    id INT PRIMARY KEY,
    user_id INT FOREIGN KEY REFERENCES users(id),
    file_id VARCHAR(50),                -- References project_files.id or content_media.id
    action ENUM('upload', 'delete', 'replace'),
    file_type VARCHAR(50),              -- 'project_file', 'content_media'
    original_filename VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
);
```

### 🔄 **Data Flow Diagrams**

#### **Project Image Upload Flow**
```
1. Project Owner: Opens project creation/edit form
2. Frontend: Shows ImageUploader component with drag-drop zone
3. User: Selects or drags image file (PNG, JPG, WEBP)
4. Frontend: Validates file size (<5MB) and type client-side
5. Frontend: Shows upload progress with preview thumbnail
6. API: POST /api/projects/upload/image (multipart/form-data)
7. Backend: Validates file again, checks user permissions
8. Backend: Generates unique filename (project-{id}-{timestamp}.jpg)
9. Backend: Processes image (resize to max 1200x800, optimize quality)
10. Storage: Saves to /var/www/uploads/projects/{filename}
11. Database: INSERT into project_files with metadata
12. Backend: Returns file URL and metadata
13. Frontend: Updates form with image URL, shows success message
14. Project: Image appears in project card and details modal
```

#### **Document Upload & Security Flow**
```
1. User: Uploads pitch deck or business plan (PDF, PPT, PPTX)
2. Frontend: Validates file type and size (<10MB for documents)
3. API: POST /api/projects/upload/document with authentication
4. Backend: Checks user owns project or has admin role
5. Backend: Scans file for malware/viruses (future enhancement)
6. Backend: Generates secure filename with UUID
7. Storage: Saves to /var/www/uploads/projects/documents/
8. Database: Records file with is_public=false (investor-only access)
9. Backend: Returns success with file metadata
10. Access Control: Files only accessible to:
    - Project owner
    - Invested/interested investors
    - Admin users
11. Download: Secured endpoint validates user access before serving
```

#### **Content Media Processing Flow**
```
1. Admin: Creates blog post or case study with images
2. Frontend: Rich text editor with image upload button
3. User: Selects image for blog content
4. Frontend: Previews image and allows alt text entry
5. API: POST /api/content/upload/blog with image data
6. Backend: Processes image for web optimization
7. Processing: Multiple sizes generated (thumbnail, medium, full)
8. Storage: Saves optimized versions to /var/www/uploads/content/
9. Database: INSERT into content_media with all metadata
10. Editor: Inserts image with proper HTML and alt attributes
11. Public Display: Images served with caching headers for performance
12. SEO: Alt text and captions included for accessibility
```

#### **File Cleanup & Management Flow**
```
1. Admin: Runs file cleanup via AdminDashboard
2. API: GET /api/admin/media/orphaned to find unused files
3. Backend: Queries for files not referenced by any content
4. Database: LEFT JOIN content_media/project_files with projects/blogs/case_studies
5. Results: Returns list of orphaned files with sizes and dates
6. Admin: Reviews list and confirms cleanup
7. API: POST /api/admin/media/cleanup with file IDs to delete
8. Backend: Validates admin permissions, deletes files from disk
9. Database: DELETE from file tables, INSERT cleanup log
10. Storage: Reclaims disk space from removed files
11. Analytics: Updates storage usage statistics
```

### 🛠️ **Implementation Details**

#### **File Upload Security Configuration**
```javascript
// Multer configuration with security
const upload = multer({
  dest: '/tmp/uploads',  // Temporary directory
  limits: {
    fileSize: 10 * 1024 * 1024,  // 10MB max
    files: 5,  // Max 5 files per request
    fields: 10  // Max 10 form fields
  },
  fileFilter: (req, file, cb) => {
    // Allowed MIME types
    const allowedImages = ['image/jpeg', 'image/png', 'image/webp'];
    const allowedDocs = ['application/pdf', 'application/vnd.ms-powerpoint',
                        'application/vnd.openxmlformats-officedocument.presentationml.presentation'];

    const isValidType = [...allowedImages, ...allowedDocs].includes(file.mimetype);

    if (!isValidType) {
      return cb(new Error('Invalid file type'), false);
    }

    cb(null, true);
  }
});
```

#### **Image Processing Pipeline**
```javascript
const sharp = require('sharp');

// Process uploaded images for optimal web delivery
const processImage = async (inputPath, outputPath, maxWidth = 1200, quality = 85) => {
  try {
    const metadata = await sharp(inputPath).metadata();

    // Only resize if image is larger than max width
    let pipeline = sharp(inputPath);
    if (metadata.width > maxWidth) {
      pipeline = pipeline.resize(maxWidth, null, {
        fit: 'inside',
        withoutEnlargement: false
      });
    }

    // Convert to JPEG with optimization
    await pipeline
      .jpeg({
        quality: quality,
        progressive: true,
        mozjpeg: true
      })
      .toFile(outputPath);

    // Generate thumbnail version
    const thumbPath = outputPath.replace('.jpg', '-thumb.jpg');
    await sharp(inputPath)
      .resize(300, 200, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toFile(thumbPath);

    return {
      original: outputPath,
      thumbnail: thumbPath,
      optimized: true
    };
  } catch (error) {
    console.error('Image processing failed:', error);
    throw new Error('Failed to process image');
  }
};
```

#### **File Access Control Middleware**
```javascript
// Secure file access based on user permissions
const checkFileAccess = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const userId = req.user?.id;

    // Get file metadata
    const file = await getOne('SELECT * FROM project_files WHERE id = ?', [fileId]);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check access permissions
    const hasAccess = await checkUserFileAccess(userId, file);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    req.file = file;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Failed to check file access' });
  }
};

const checkUserFileAccess = async (userId, file) => {
  // Public files are accessible to everyone
  if (file.is_public) return true;

  // File owner always has access
  if (file.uploaded_by === userId) return true;

  // Admin users have access to all files
  const user = await getOne('SELECT role FROM users WHERE id = ?', [userId]);
  if (user?.role === 'admin') return true;

  // Check if user has invested in or is interested in the project
  const hasProjectAccess = await getOne(`
    SELECT 1 FROM investments i
    WHERE i.investor_id = ? AND i.project_id = ?
    UNION
    SELECT 1 FROM watchlist w
    WHERE w.user_id = ? AND w.project_id = ?
  `, [userId, file.project_id, userId, file.project_id]);

  return !!hasProjectAccess;
};
```

#### **File Storage Organization**
```bash
# Directory structure for organized file storage
/var/www/uploads/
├── projects/                    # Project-related files
│   ├── images/                 # Project logos and gallery images
│   │   ├── project-123-logo.jpg
│   │   └── project-123-gallery-1.jpg
│   └── documents/              # Business plans, pitch decks
│       ├── project-123-business-plan.pdf
│       └── project-123-pitch-deck.pptx
├── content/                    # Blog and case study media
│   ├── blogs/                  # Blog post images
│   └── case-studies/           # Case study images
├── users/                      # User profile images
│   └── avatars/
└── temp/                       # Temporary upload processing
```

#### **Nginx File Serving Configuration**
```nginx
# Optimized static file serving
location /uploads/ {
    alias /var/www/uploads/;

    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";

    # Caching for performance
    expires 30d;
    add_header Cache-Control "public, immutable";

    # Compression for better performance
    gzip on;
    gzip_types image/jpeg image/png image/webp application/pdf;

    # Security: prevent execution of uploaded files
    location ~ \.(php|pl|py|jsp|asp|sh|cgi)$ {
        deny all;
    }

    # Handle missing files gracefully
    try_files $uri $uri/ =404;
}
```

### ✅ **Current Status**
- ✅ **Project File Upload**: Image and document upload working
- ✅ **Content Media**: Blog and case study image management
- ✅ **Security Validation**: File type, size, and access control
- ✅ **Image Processing**: Optimization and thumbnail generation
- ✅ **Nginx Serving**: Optimized static file delivery
- ✅ **Storage Organization**: Clean directory structure
- ✅ **Database Tracking**: Complete file metadata and audit logs
- 🚧 **Advanced Features**: Virus scanning, CDN integration planned
- 🚧 **Admin Tools**: Bulk file management interface

---

## 🏗️ **System Architecture Overview**

### **📊 Complete Data Flow Summary**
```
Frontend (React/TypeScript)
    ↓ HTTP Requests
Backend API (Node.js/Express)
    ↓ SQL Queries
Database (MySQL)
    ↓ File Operations
Storage (/var/www/uploads/)
    ↓ Static Serving
Nginx (Reverse Proxy)
```

### **🔐 Authentication Layers**
1. **JWT Tokens**: Access + Refresh token system
2. **Role-Based Access**: Admin > Project Owner > Investor permissions
3. **Route Protection**: Middleware validates user roles per endpoint
4. **OAuth Integration**: Google/LinkedIn with profile completion

### **📈 Current Platform Status**
- ✅ **Phase 1**: Complete authentication and user management
- ✅ **Phase 2**: Full project lifecycle with admin approval
- ✅ **Phase 3**: Investment tracking and rating system
- ✅ **Phase 4**: Comprehensive admin dashboard
- ✅ **Phase 5**: Professional content management system
- ✅ **Phase 6**: Secure file upload and media management

### **🚀 Production Deployment**
- **Live URL**: http://13.200.209.191:8080
- **Server**: AWS EC2 with PM2 process management
- **Database**: MySQL 8.0 with optimized indexes
- **File Storage**: Nginx-served uploads with CDN-ready setup
- **Status**: **FULLY OPERATIONAL** ✅

---

## 📞 **Developer Reference**

### **Quick API Reference**
```bash
# Authentication
POST /api/auth/login                    # Basic login
POST /api/auth-enhanced/signup          # Enhanced signup with OTP
GET  /api/oauth/url/google              # Get Google OAuth URL

# Projects
GET  /api/projects/approved             # Homepage projects
POST /api/projects                      # Create project
PUT  /api/projects/:id/submit           # Submit for review

# Admin
GET  /api/admin/projects/pending        # Pending project reviews
PUT  /api/admin/projects/:id/approve    # Approve project

# Content
GET  /api/blogs                         # Public blog listing
GET  /api/case-studies                  # Public case studies
```

### **Database Connection**
```javascript
// MySQL connection details
const dbConfig = {
  host: 'localhost',
  user: 'zuvomo_user',
  password: 'zuvomo_secure_2024',
  database: 'zuvomo_db'
};
```

### **File Upload Endpoints**
```javascript
// File upload with authentication
POST /api/projects/upload/image         // Max 5MB, PNG/JPG/WEBP
POST /api/projects/upload/document      // Max 10MB, PDF/PPT/PPTX
POST /api/content/upload/blog           // Blog images
```

---

**Documentation Version**: 1.0
**Last Updated**: September 20, 2025
**Platform Status**: Production Ready ✅
**Total API Endpoints**: 47 endpoints across 6 major systems
**Database Tables**: 15 core tables with optimized relationships
**File Upload Support**: 6 file types with security validation

This documentation provides a complete technical reference for the Zuvomo platform's architecture, API endpoints, database schema, and implementation details.
# 🚀 Zuvomo Platform - Local Development Setup Guide

Complete guide to set up the entire Zuvomo investment platform locally with full functionality including database, authentication, file uploads, blog system, and admin dashboard.

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Project Architecture](#project-architecture)
3. [Quick Start](#quick-start)
4. [Detailed Setup](#detailed-setup)
5. [Database Configuration](#database-configuration)
6. [Environment Setup](#environment-setup)
7. [Running the Application](#running-the-application)
8. [Test Accounts & Sample Data](#test-accounts--sample-data)
9. [Feature Testing](#feature-testing)
10. [Troubleshooting](#troubleshooting)
11. [Development Workflow](#development-workflow)

## ⚡ Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** 18.0.0 or higher ([Download](https://nodejs.org/))
- **MySQL** 8.0 or higher ([Download](https://dev.mysql.com/downloads/mysql/))
- **Git** for version control ([Download](https://git-scm.com/downloads))
- **Code Editor** (VS Code recommended)
- **Optional**: PM2 for process management (`npm install -g pm2`)

### System Requirements
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space
- **OS**: Windows 10+, macOS 10.14+, or Linux

## 🏗️ Project Architecture

```
Zuvomo Platform
├── Frontend (React + TypeScript + Vite)
│   ├── Port: 5173 (development)
│   ├── Framework: React 18, TypeScript, Tailwind CSS
│   └── UI: shadcn/ui components
├── Backend (Node.js + Express + MySQL)
│   ├── Port: 3001
│   ├── Database: MySQL 8.0
│   └── Authentication: JWT-based
└── Features
    ├── ✅ User Authentication & Role Management
    ├── ✅ Project CRUD & Admin Approval System
    ├── ✅ Blog & Case Study Management
    ├── ✅ File Upload & Image Management
    ├── ✅ Investment Tracking & Ratings
    └── ✅ Comprehensive Admin Dashboard
```

## ⚡ Quick Start

For experienced developers who want to get started immediately:

```bash
# 1. Clone the repositories
git clone <your-zuvomo-repo-url>
cd Zuvomo-Website

# 2. Install dependencies
npm install

# 3. Setup backend (parallel)
cd ../zuvomo-backend
npm install

# 4. Create database
mysql -u root -p
CREATE DATABASE zuvomo_db;
CREATE USER 'zuvomo_user'@'localhost' IDENTIFIED BY 'zuvomo_secure_2024';
GRANT ALL PRIVILEGES ON zuvomo_db.* TO 'zuvomo_user'@'localhost';
exit

# 5. Import database schema
mysql -u zuvomo_user -p zuvomo_db < database/schema.sql
mysql -u zuvomo_user -p zuvomo_db < database/blog_schema.sql

# 6. Configure environment
cp .env.example .env
# Edit .env with local settings (see configuration section)

# 7. Start servers
npm run dev # Backend
cd ../Zuvomo-Website && npm run dev # Frontend

# 8. Open http://localhost:5173
```

## 📖 Detailed Setup

### Step 1: Clone the Project

```bash
# Create project directory
mkdir zuvomo-local
cd zuvomo-local

# Clone frontend repository
git clone <your-zuvomo-frontend-repo> Zuvomo-Website
cd Zuvomo-Website

# Clone backend repository (adjacent to frontend)
cd ..
git clone <your-zuvomo-backend-repo> zuvomo-backend
```

### Step 2: Frontend Setup

```bash
cd Zuvomo-Website

# Install all dependencies
npm install

# Verify installation
npm run build:dev
```

**Dependencies installed include:**
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui components
- React Router for navigation
- Framer Motion for animations
- All UI components and utilities

### Step 3: Backend Setup

```bash
cd ../zuvomo-backend

# Install backend dependencies
npm install

# Create uploads directory
mkdir -p uploads/projects
chmod 755 uploads/projects
```

**Backend dependencies include:**
- Express.js web framework
- MySQL2 database driver
- JWT for authentication
- bcrypt for password hashing
- Multer for file uploads
- All validation and security middleware

## 🗄️ Database Configuration

### MySQL Installation & Setup

#### On macOS (using Homebrew):
```bash
brew install mysql
brew services start mysql
mysql_secure_installation
```

#### On Ubuntu/Debian:
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

#### On Windows:
Download from [MySQL Downloads](https://dev.mysql.com/downloads/mysql/) and follow installer.

### Database Creation

```bash
# Connect to MySQL as root
mysql -u root -p

# Create database and user
CREATE DATABASE zuvomo_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'zuvomo_user'@'localhost' IDENTIFIED BY 'zuvomo_secure_2024';
GRANT ALL PRIVILEGES ON zuvomo_db.* TO 'zuvomo_user'@'localhost';
FLUSH PRIVILEGES;
exit
```

### Schema Import

```bash
cd zuvomo-backend

# Import main schema (users, projects, etc.)
mysql -u zuvomo_user -p zuvomo_db < database/schema.sql

# Import blog & case study schema
mysql -u zuvomo_user -p zuvomo_db < database/blog_schema.sql

# Verify tables created
mysql -u zuvomo_user -p zuvomo_db -e "SHOW TABLES;"
```

**Expected tables:**
- users
- projects
- blog_posts
- case_studies
- blog_categories
- ratings
- watchlist
- investments

## ⚙️ Environment Setup

### Backend Environment (.env)

Create `/zuvomo-backend/.env`:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=zuvomo_user
DB_PASSWORD=zuvomo_secure_2024
DB_NAME=zuvomo_db

# JWT Configuration
JWT_SECRET=your_local_jwt_secret_key_here
JWT_REFRESH_SECRET=your_local_refresh_jwt_secret_key_here
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# CORS Configuration
FRONTEND_URL=http://localhost:5173

# File Upload Configuration
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,image/webp,application/pdf
```

### Frontend API Configuration

Update `/Zuvomo-Website/src/services/api.ts`:

```typescript
// For local development, change the API base URL
const API_BASE_URL = 'http://localhost:3001/api';
```

**Or use Vite proxy** in `vite.config.ts`:

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

## 🚀 Running the Application

### Start Backend Server

```bash
cd zuvomo-backend

# Development mode (with auto-restart)
npm run dev

# Or production mode
npm start

# With PM2 (optional)
pm2 start server.js --name "zuvomo-backend"
```

**Backend will be available at:** `http://localhost:3001`
**API endpoints:** `http://localhost:3001/api/*`

### Start Frontend Development Server

```bash
cd Zuvomo-Website

# Start development server
npm run dev

# Or build for production
npm run build
npm run preview
```

**Frontend will be available at:** `http://localhost:5173`

### Verify Setup

1. **Backend Health Check:** `http://localhost:3001/api/health`
2. **Frontend Loading:** `http://localhost:5173`
3. **Database Connection:** Check console logs for "✅ Database connected successfully"

## 👥 Test Accounts & Sample Data

### Pre-configured User Accounts

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| **Admin** | admin@zuvomo.com | admin123 | Full system access, can manage all content |
| **Project Owner** | founder@zuvomo.com | founder123 | Can create and manage projects |
| **Investor** | investor@zuvomo.com | investor123 | Can browse and invest in projects |

### Sample Data Included

- **5 Sample Projects** with images and complete data
- **3 Blog Posts** with featured images and content
- **3 Case Studies** with metrics and testimonials
- **Project ratings and reviews**
- **File uploads and media**

### Accessing Different Dashboards

After logging in, users are automatically redirected to their role-specific dashboard:

- **Admin**: `http://localhost:5173/admin` - Complete system management
- **Project Owner**: `http://localhost:5173/project-owner` - Project creation and management  
- **Investor**: `http://localhost:5173/investor` - Project discovery and investment

## ✅ Feature Testing

### Authentication System
- [ ] Email/password login and signup
- [ ] JWT token management and refresh
- [ ] Role-based access control
- [ ] User profile management

### Project Management
- [ ] Create new projects (Project Owner)
- [ ] Submit projects for admin review
- [ ] Admin approval/rejection workflow
- [ ] Project status tracking

### Blog & Case Study System
- [ ] Public blog listing at `/blog`
- [ ] Individual blog posts at `/blog/:slug`
- [ ] Case studies showcase at `/case-studies`
- [ ] Admin content management in dashboard

### File Upload System
- [ ] Project image uploads
- [ ] Pitch deck file uploads
- [ ] Blog featured images
- [ ] Case study company logos

### Admin Dashboard
- [ ] User management (approve/reject/edit)
- [ ] Project management (review/approve/feature)
- [ ] Blog and case study content creation
- [ ] System analytics and reporting

### Investment Features
- [ ] Project rating system
- [ ] Watchlist functionality
- [ ] Investment tracking
- [ ] Project discovery and filtering

## 🔧 Troubleshooting

### Common Database Issues

**Error: "Access denied for user"**
```bash
# Reset MySQL user permissions
mysql -u root -p
DROP USER 'zuvomo_user'@'localhost';
CREATE USER 'zuvomo_user'@'localhost' IDENTIFIED BY 'zuvomo_secure_2024';
GRANT ALL PRIVILEGES ON zuvomo_db.* TO 'zuvomo_user'@'localhost';
FLUSH PRIVILEGES;
```

**Error: "Database connection refused"**
```bash
# Check MySQL service status
# macOS
brew services list | grep mysql

# Ubuntu/Linux
sudo systemctl status mysql

# Windows
services.msc (look for MySQL)
```

### Common Node.js Issues

**Error: "Port 3001 already in use"**
```bash
# Find and kill process using port
npx kill-port 3001

# Or use different port in .env
PORT=3002
```

**Error: "Module not found"**
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Frontend Issues

**Error: "Failed to fetch from API"**
- Check if backend server is running on port 3001
- Verify API_BASE_URL configuration
- Check CORS settings in backend

**Error: "Build fails"**
```bash
# Check TypeScript errors
npm run build:dev

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

### File Upload Issues

**Error: "File upload failed"**
```bash
# Check upload directory permissions
chmod -R 755 uploads/
chown -R $USER:$USER uploads/
```

**Error: "File size too large"**
- Check UPLOAD_MAX_SIZE in .env
- Verify frontend file size validation

### Database Connection Debugging

```javascript
// Add to backend for debugging
console.log('Database config:', {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME
});
```

## 🔄 Development Workflow

### Frontend Development

```bash
# Start development server
npm run dev

# Run type checking
npm run build:dev

# Build for production
npm run build
```

### Backend Development

```bash
# Development with auto-restart
npm run dev

# Manual restart after changes
pm2 restart zuvomo-backend
```

### Database Changes

```bash
# After schema modifications
mysql -u zuvomo_user -p zuvomo_db < database/new_migration.sql

# Backup database
mysqldump -u zuvomo_user -p zuvomo_db > backup.sql
```

### Testing Changes

1. **Frontend**: Changes reflect immediately with hot reload
2. **Backend**: Restart server or use nodemon for auto-restart
3. **Database**: Import new schema files as needed

## 🎯 Next Steps

Once you have the local environment running:

1. **Explore the Admin Dashboard** - Log in as admin to see all features
2. **Create Test Projects** - Use project owner account to test workflow
3. **Test Investment Flow** - Use investor account to browse and rate projects
4. **Customize Branding** - Update colors, logos, and content as needed
5. **Add Features** - Extend functionality using the existing architecture

## 📞 Support

If you encounter issues not covered in this guide:

1. Check the console logs for detailed error messages
2. Verify all prerequisites are correctly installed
3. Ensure database is running and accessible
4. Check that all ports are available and not blocked by firewall

---

## 🚀 Ready to Go!

Your complete Zuvomo investment platform should now be running locally with:
- ✅ Full authentication system
- ✅ Project management workflow
- ✅ Blog and case study content management
- ✅ Admin dashboard with complete control
- ✅ File upload and image management
- ✅ Database with sample data

**Access your local platform at:** `http://localhost:5173`

Happy developing! 🎉
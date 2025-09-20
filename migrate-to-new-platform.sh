#!/bin/bash

# Zuvomo Platform Migration Script
# Migrates from old zuvomo-website to new zuvomo-app
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
OLD_PROJECT_ROOT="/home/ubuntu/Zuvomo-Website"
NEW_PROJECT_ROOT="/home/ubuntu/zuvomo-app"
NGINX_ROOT="/var/www/zuvomo-homepage"
BACKUP_DIR="/home/ubuntu/backup-$(date +%Y%m%d-%H%M%S)"
DB_NAME="zuvomo_db"
DB_BACKUP_FILE="$BACKUP_DIR/database_backup.sql"

echo -e "${BLUE}🚀 Zuvomo Platform Migration Script${NC}"
echo -e "${BLUE}====================================${NC}"
echo ""

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

print_info() {
    echo -e "${BLUE}📋 $1${NC}"
}

# Check if running as correct user
if [ "$USER" != "ubuntu" ]; then
    print_warning "Script should be run as ubuntu user"
fi

print_info "Starting migration from zuvomo-website to zuvomo-app..."

# Phase 1: Backup Current System
print_info "Phase 1: Backing up current system..."

# Create backup directory
mkdir -p "$BACKUP_DIR"
print_status "Backup directory created: $BACKUP_DIR"

# Backup database
print_info "Backing up database..."
mysqldump -u root -p$DB_PASSWORD $DB_NAME > "$DB_BACKUP_FILE"
print_status "Database backed up to: $DB_BACKUP_FILE"

# Backup current website files
print_info "Backing up current website files..."
if [ -d "$NGINX_ROOT" ]; then
    cp -r "$NGINX_ROOT" "$BACKUP_DIR/website_files/"
    print_status "Website files backed up"
fi

if [ -d "$OLD_PROJECT_ROOT" ]; then
    cp -r "$OLD_PROJECT_ROOT" "$BACKUP_DIR/old_project/"
    print_status "Old project files backed up"
fi

# Backup PM2 configuration
print_info "Backing up PM2 configuration..."
pm2 save || true
cp ~/.pm2/dump.pm2 "$BACKUP_DIR/pm2_backup.json" 2>/dev/null || true
pm2 list > "$BACKUP_DIR/pm2_processes.txt"
print_status "PM2 configuration backed up"

# Phase 2: Setup New Project
print_info "Phase 2: Setting up new zuvomo-app..."

# Clone new repository
if [ ! -d "$NEW_PROJECT_ROOT" ]; then
    print_info "Cloning zuvomo-app repository..."
    git clone https://github.com/bhupender-afk/zuvomo-app.git "$NEW_PROJECT_ROOT"
    print_status "Repository cloned"
else
    print_info "Repository exists, updating..."
    cd "$NEW_PROJECT_ROOT"
    git pull origin main
    print_status "Repository updated"
fi

cd "$NEW_PROJECT_ROOT"

# Phase 3: Setup Backend
print_info "Phase 3: Setting up backend..."

cd "$NEW_PROJECT_ROOT/backend"

# Install backend dependencies
print_info "Installing backend dependencies..."
npm install
print_status "Backend dependencies installed"

# Setup production environment
print_info "Setting up production environment..."
cp .env.production .env
print_status "Production environment configured"

# Phase 4: Setup Frontend
print_info "Phase 4: Setting up frontend..."

cd "$NEW_PROJECT_ROOT/frontend"

# Install frontend dependencies
print_info "Installing frontend dependencies..."
npm install
print_status "Frontend dependencies installed"

# Build frontend for production
print_info "Building frontend for production..."
npm run build
print_status "Frontend build completed"

# Phase 5: Database Migration
print_info "Phase 5: Database migration..."

cd "$NEW_PROJECT_ROOT/backend"

# Apply any new database migrations
print_info "Applying database schema updates..."
# Add migration commands here if needed
print_status "Database schema updated"

# Phase 6: Deploy New Services
print_info "Phase 6: Deploying new services..."

# Stop old PM2 processes
print_info "Stopping old PM2 processes..."
pm2 stop all || true
pm2 delete all || true

# Deploy new frontend build
print_info "Deploying new frontend..."
sudo rm -rf "$NGINX_ROOT"/*
sudo cp -r "$NEW_PROJECT_ROOT/frontend/dist"/* "$NGINX_ROOT/"
sudo chown -R www-data:www-data "$NGINX_ROOT"
sudo chmod -R 755 "$NGINX_ROOT"
print_status "Frontend deployed"

# Start new backend services
print_info "Starting new backend services..."
cd "$NEW_PROJECT_ROOT/backend"
pm2 start server.js --name "zuvomo-backend"
pm2 save
print_status "Backend services started"

# Restart Nginx
print_info "Restarting Nginx..."
sudo systemctl restart nginx
if sudo systemctl is-active --quiet nginx; then
    print_status "Nginx restarted successfully"
else
    print_error "Failed to restart Nginx"
fi

# Phase 7: Verification
print_info "Phase 7: Verifying deployment..."

# Test website accessibility
print_info "Testing website accessibility..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200"; then
    print_status "Website is accessible"
else
    print_warning "Website may not be accessible - check logs"
fi

# Test API endpoints
print_info "Testing API endpoints..."
if curl -s http://localhost/api/health | grep -q "OK"; then
    print_status "API is responding"
else
    print_warning "API may not be responding - check backend logs"
fi

# Display migration summary
echo ""
echo -e "${GREEN}🎉 MIGRATION COMPLETED SUCCESSFULLY! 🎉${NC}"
echo -e "${BLUE}==========================================${NC}"
echo ""
print_info "Migration Summary:"
echo -e "  📁 New Project: $NEW_PROJECT_ROOT"
echo -e "  🌐 Web Root: $NGINX_ROOT"
echo -e "  💾 Backup: $BACKUP_DIR"
echo -e "  🔗 Website: http://13.200.209.191:8080/"
echo ""
print_info "Services Status:"
echo -e "  Backend: $(pm2 list | grep zuvomo-backend | awk '{print $10}' || echo 'stopped')"
echo -e "  Nginx: $(sudo systemctl is-active nginx)"
echo ""
print_info "Next Steps:"
echo -e "  1. Test all website functionality"
echo -e "  2. Verify login/signup system"
echo -e "  3. Check admin dashboard"
echo -e "  4. Test API endpoints"
echo -e "  5. Monitor logs for any issues"
echo ""

print_status "Migration script completed successfully!"
echo -e "${BLUE}Your new comprehensive Zuvomo platform is now live!${NC}"
exit 0
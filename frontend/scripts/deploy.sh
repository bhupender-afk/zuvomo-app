#!/bin/bash

# Industry-Standard Deployment Script for React Application
set -e

echo "🚀 Starting deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BUILD_DIR="dist"
DEPLOY_DIR="/var/www/zuvomo-homepage"
BACKUP_DIR="/var/backups/zuvomo-homepage"

echo -e "${YELLOW}📋 Pre-deployment checks...${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Not in React project directory${NC}"
    exit 1
fi

# Check if build directory exists
if [ ! -d "$BUILD_DIR" ]; then
    echo -e "${RED}❌ Error: Build directory not found. Run 'npm run build' first${NC}"
    exit 1
fi

# Validate build
echo -e "${YELLOW}🔍 Validating build...${NC}"
npm run validate

# Create backup
echo -e "${YELLOW}💾 Creating backup...${NC}"
sudo mkdir -p "$BACKUP_DIR"
if [ -d "$DEPLOY_DIR" ] && [ "$(ls -A $DEPLOY_DIR 2>/dev/null)" ]; then
    sudo cp -r "$DEPLOY_DIR" "$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S)"
    echo -e "${GREEN}✅ Backup created${NC}"
fi

# Deploy new build
echo -e "${YELLOW}📦 Deploying new build...${NC}"
sudo rm -rf "$DEPLOY_DIR"/*
sudo cp -r "$BUILD_DIR"/* "$DEPLOY_DIR/"

# Set proper permissions
sudo chown -R www-data:www-data "$DEPLOY_DIR"
sudo chmod -R 755 "$DEPLOY_DIR"

# Reload nginx
echo -e "${YELLOW}🔄 Reloading nginx...${NC}"
sudo systemctl reload nginx

# Health checks
echo -e "${YELLOW}🏥 Running health checks...${NC}"

# Check if site responds
if curl -s -f http://localhost:8080/ > /dev/null; then
    echo -e "${GREEN}✅ Homepage: OK${NC}"
else
    echo -e "${RED}❌ Homepage: FAILED${NC}"
    exit 1
fi

# Check login route
if curl -s -f http://localhost:8080/login > /dev/null; then
    echo -e "${GREEN}✅ Login route: OK${NC}"
else
    echo -e "${RED}❌ Login route: FAILED${NC}"
    exit 1
fi

# Check signup route
if curl -s -f http://localhost:8080/signup > /dev/null; then
    echo -e "${GREEN}✅ Signup route: OK${NC}"
else
    echo -e "${RED}❌ Signup route: FAILED${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Site is live at: http://13.200.209.191:8080${NC}"
# Zuvomo React Application - Deployment Guide

## Industry-Standard Setup ✅

This React application now follows industry best practices to prevent build and routing issues.

## Architecture

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js API (PM2 managed)
- **Server**: Nginx (SPA routing enabled)
- **Deployment**: Automated with validation

## Key Features

### ✅ Proper Build Configuration
- Clean Vite setup with industry standards
- Proper entry point (`src/main.tsx`)
- Optimized production builds with terser minification
- Asset optimization and code splitting ready

### ✅ SPA Routing
- React Router v6 with proper route definitions
- Nginx configured for SPA fallback routing
- No more 404 errors on direct URL access

### ✅ Build Validation
- Automated validation script (`scripts/validate-build.js`)
- Checks for required routes in bundle
- Bundle size monitoring
- Prevents broken deployments

### ✅ Deployment Automation
- Industry-standard deployment script (`scripts/deploy.sh`)
- Backup creation before deployment
- Health checks after deployment
- Proper file permissions and nginx reload

## Development Workflow

### Building
```bash
npm run build          # Build + validate
npm run validate       # Validate existing build
npm run build:dev      # Development build
```

### Deployment
```bash
./scripts/deploy.sh    # Full deployment with checks
```

### Development
```bash
npm run dev           # Start development server on port 3002
npm run lint          # Code linting
```

## File Structure (Clean)

```
├── src/                    # React application source
│   ├── main.tsx           # Entry point
│   ├── App.tsx            # Main app component
│   ├── pages/             # Page components
│   │   ├── Login.tsx      # ✅ Login page
│   │   ├── Signup.tsx     # ✅ Signup page
│   │   └── NotFound.tsx   # 404 handler
│   └── components/        # Reusable components
├── public/                # Static assets only
│   ├── *.png             # Images
│   ├── fonts/            # Font files
│   └── robots.txt        # SEO files
├── scripts/              # Build & deployment scripts
├── dist/                 # Production build output
└── index.html            # HTML template (Vite managed)
```

## Production URLs

- **Main Site**: http://13.200.209.191:8080/
- **Login**: http://13.200.209.191:8080/login ✅
- **Signup**: http://13.200.209.191:8080/signup ✅
- **Backend API**: http://13.200.209.191:8080/api/

## Monitoring

### Health Checks
- Frontend: All routes return 200 OK
- Backend: API health endpoint responds
- PM2: Backend service status monitored

### Build Validation
- JavaScript bundle contains all routes
- CSS bundle properly generated
- Asset optimization working
- No broken builds deployed

## Troubleshooting

### If you see 404 errors:
1. Check if PM2 backend is running: `pm2 list`
2. Verify nginx is running: `sudo systemctl status nginx`
3. Run health checks: `./scripts/deploy.sh`

### If build fails:
1. Clean install: `rm -rf node_modules && npm install`
2. Clean build: `rm -rf dist && npm run build`
3. Check validation: `npm run validate`

### If deployment fails:
1. Check logs: `sudo tail -f /var/log/nginx/error.log`
2. Verify permissions: `ls -la /var/www/zuvomo-homepage/`
3. Manual deploy: `sudo cp -r dist/* /var/www/zuvomo-homepage/`

## Maintenance

- **Dependencies**: Keep updated but test thoroughly
- **Builds**: Always validate before deploying
- **Backups**: Automatic backup created on each deployment
- **Logs**: Monitor nginx and PM2 logs regularly

---

**✅ This setup prevents the routing and build issues experienced previously by following React and Vite industry standards.**
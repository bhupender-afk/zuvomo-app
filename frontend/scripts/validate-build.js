#!/usr/bin/env node

/**
 * Build Validation Script - Industry Standard
 * Validates that the React build is complete and contains all required components
 */

import fs from 'fs';
import path from 'path';

const DIST_DIR = 'dist';
const REQUIRED_ROUTES = ['/login', '/signup'];

function validateBuild() {
  console.log('🔍 Validating React build...');
  
  // Check if dist directory exists
  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ Build failed: dist directory not found');
    process.exit(1);
  }
  
  // Check if index.html exists
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error('❌ Build failed: index.html not found');
    process.exit(1);
  }
  
  // Check if assets directory exists with JS and CSS
  const assetsDir = path.join(DIST_DIR, 'assets');
  if (!fs.existsSync(assetsDir)) {
    console.error('❌ Build failed: assets directory not found');
    process.exit(1);
  }
  
  const assets = fs.readdirSync(assetsDir);
  const hasJS = assets.some(file => file.endsWith('.js'));
  const hasCSS = assets.some(file => file.endsWith('.css'));
  
  if (!hasJS) {
    console.error('❌ Build failed: no JavaScript bundle found');
    process.exit(1);
  }
  
  if (!hasCSS) {
    console.error('❌ Build failed: no CSS bundle found');
    process.exit(1);
  }
  
  // Check if routes are included in the JS bundle
  const jsFile = assets.find(file => file.endsWith('.js'));
  const jsContent = fs.readFileSync(path.join(assetsDir, jsFile), 'utf8');
  
  for (const route of REQUIRED_ROUTES) {
    if (!jsContent.includes(route)) {
      console.error(`❌ Build failed: route ${route} not found in bundle`);
      process.exit(1);
    }
  }
  
  // Get bundle sizes
  const jsSize = fs.statSync(path.join(assetsDir, jsFile)).size;
  const cssFile = assets.find(file => file.endsWith('.css'));
  const cssSize = fs.statSync(path.join(assetsDir, cssFile)).size;
  
  console.log('✅ Build validation successful!');
  console.log(`📦 JavaScript bundle: ${Math.round(jsSize / 1024)}KB`);
  console.log(`🎨 CSS bundle: ${Math.round(cssSize / 1024)}KB`);
  console.log(`🛣️  Routes included: ${REQUIRED_ROUTES.join(', ')}`);
}

validateBuild();
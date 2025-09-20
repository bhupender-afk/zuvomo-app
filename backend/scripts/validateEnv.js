const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config();

/**
 * Environment validation utility
 * Validates required environment variables for different environments
 */

const validateEnvironment = () => {
  const env = process.env.NODE_ENV || 'development';
  const envFile = path.join(__dirname, '..', `.env.${env}`);

  console.log(`🔍 Validating environment: ${env}`);
  console.log(`📁 Environment file: ${envFile}`);

  // Check if environment-specific file exists
  if (!fs.existsSync(envFile)) {
    console.warn(`⚠️  Environment file not found: .env.${env}`);
    console.log(`🔄 Using default .env file`);
  } else {
    console.log(`✅ Environment file found: .env.${env}`);
  }

  // Required environment variables
  const requiredVariables = [
    'NODE_ENV',
    'PORT',
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'FRONTEND_URL'
  ];

  // OAuth variables (required for OAuth functionality)
  const oauthVariables = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REDIRECT_URI',
    'LINKEDIN_CLIENT_ID',
    'LINKEDIN_CLIENT_SECRET',
    'LINKEDIN_REDIRECT_URI'
  ];

  // Check required variables
  const missingRequired = requiredVariables.filter(key => !process.env[key]);
  const missingOAuth = oauthVariables.filter(key => !process.env[key] || process.env[key].startsWith('your_'));

  // Report results
  console.log('\n📊 Environment Validation Results:');
  console.log('=====================================');

  if (missingRequired.length === 0) {
    console.log('✅ All required environment variables are set');
  } else {
    console.error('❌ Missing required environment variables:');
    missingRequired.forEach(key => console.error(`   - ${key}`));
  }

  if (missingOAuth.length === 0) {
    console.log('✅ All OAuth environment variables are configured');
  } else {
    console.warn('⚠️  OAuth variables need configuration:');
    missingOAuth.forEach(key => console.warn(`   - ${key}`));
    console.log('\n🔧 To configure OAuth:');
    console.log('   1. Set up OAuth apps in Google Console and LinkedIn Developer Portal');
    console.log('   2. Update the OAuth credentials in your environment file');
    console.log('   3. Ensure redirect URIs match your environment URLs');
  }

  // Display current configuration
  console.log('\n🔧 Current Configuration:');
  console.log(`   Environment: ${process.env.NODE_ENV}`);
  console.log(`   Port: ${process.env.PORT}`);
  console.log(`   Database: ${process.env.DB_NAME} on ${process.env.DB_HOST}`);
  console.log(`   Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`   JWT Expiry: ${process.env.JWT_EXPIRE}`);

  // OAuth configuration summary
  if (process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_CLIENT_ID.startsWith('your_')) {
    console.log(`   Google OAuth: Configured (${process.env.GOOGLE_REDIRECT_URI})`);
  } else {
    console.log('   Google OAuth: Not configured');
  }

  if (process.env.LINKEDIN_CLIENT_ID && !process.env.LINKEDIN_CLIENT_ID.startsWith('your_')) {
    console.log(`   LinkedIn OAuth: Configured (${process.env.LINKEDIN_REDIRECT_URI})`);
  } else {
    console.log('   LinkedIn OAuth: Not configured');
  }

  console.log('=====================================\n');

  // Return validation status
  const isValid = missingRequired.length === 0;
  const hasOAuth = missingOAuth.length === 0;

  if (isValid && hasOAuth) {
    console.log('🎉 Environment is fully configured and ready!');
  } else if (isValid) {
    console.log('✅ Environment is valid (OAuth configuration recommended)');
  } else {
    console.log('❌ Environment validation failed');
  }

  return isValid;
};

// Environment-specific configuration tips
const showEnvironmentTips = () => {
  const env = process.env.NODE_ENV || 'development';

  console.log(`\n💡 Tips for ${env} environment:`);

  if (env === 'development') {
    console.log('   - Use localhost URLs for all services');
    console.log('   - Create separate OAuth apps for development');
    console.log('   - Use local database for testing');
    console.log('   - Enable debug logging');
  } else if (env === 'production') {
    console.log('   - Use production domain URLs');
    console.log('   - Use production OAuth app credentials');
    console.log('   - Use production database with proper security');
    console.log('   - Disable debug logging');
    console.log('   - Ensure HTTPS for OAuth redirects');
  }
};

// Main execution
if (require.main === module) {
  console.log('🚀 Zuvomo Environment Validator\n');

  const isValid = validateEnvironment();
  showEnvironmentTips();

  process.exit(isValid ? 0 : 1);
}

module.exports = { validateEnvironment };
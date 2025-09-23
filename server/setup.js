#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Ocean Hazard Backend...\n');

// Create .env file with Supabase credentials
const envContent = `# Supabase Configuration
SUPABASE_URL=https://qqggoiysyjnwuyvzwrrr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxZ2dvaXlzeWpud3V5dnp3cnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MDcxMTksImV4cCI6MjA3NDE4MzExOX0.PhNKPRbx-HKcRiIWoweA3FBXH2NL3beZ3ysQCDP878Y
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret_here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Configuration
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,video/mp4,video/quicktime

# NLP Service (Optional)
NLP_SERVICE_URL=http://localhost:8000
NLP_SERVICE_API_KEY=your_nlp_api_key_here

# Google Maps API (for frontend integration)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/ocean_hazard_db
`;

// Write .env file
fs.writeFileSync('.env', envContent);
console.log('✅ Created .env file with your Supabase credentials');

// Create logs directory
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('✅ Created logs directory');
}

// Create .env.test file for testing
const testEnvContent = `# Test Environment Variables
NODE_ENV=test
SUPABASE_URL=https://qqggoiysyjnwuyvzwrrr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxZ2dvaXlzeWpud3V5dnp3cnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MDcxMTksImV4cCI6MjA3NDE4MzExOX0.PhNKPRbx-HKcRiIWoweA3FBXH2NL3beZ3ysQCDP878Y
SUPABASE_SERVICE_ROLE_KEY=test_service_key
JWT_SECRET=test_jwt_secret
LOG_LEVEL=error
`;

fs.writeFileSync('.env.test', testEnvContent);
console.log('✅ Created .env.test file for testing');

console.log('\n📋 Next Steps:');
console.log('1. Get your Supabase Service Role Key from your Supabase dashboard');
console.log('2. Update the SUPABASE_SERVICE_ROLE_KEY in your .env file');
console.log('3. Run the database migrations in your Supabase SQL editor');
console.log('4. Install dependencies: npm install');
console.log('5. Start the development server: npm run dev');
console.log('\n🔗 Supabase Dashboard: https://supabase.com/dashboard/project/qqggoiysyjnwuyvzwrrr');
console.log('📚 API Documentation will be available at: http://localhost:3000/docs');
console.log('🏥 Health Check: http://localhost:3000/health');

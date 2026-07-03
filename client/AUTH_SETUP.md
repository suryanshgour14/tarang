# Authentication Setup Guide

## 🚨 Quick Fix for Runtime Error

**The error you're seeing is because the Supabase environment variables are missing. Here's how to fix it:**

### Step 1: Create Environment File

Create a file named `.env.local` in the `client` directory (same level as `package.json`) with the following content:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 2: Get Your Supabase Credentials

1. **Go to [Supabase Dashboard](https://supabase.com/dashboard)**
2. **Create a new project** (if you don't have one):
   - Click "New Project"
   - Choose your organization
   - Enter project name: "Tarang"
   - Set a database password
   - Choose a region close to you
   - Click "Create new project"

3. **Get your credentials**:
   - Once your project is ready, go to **Settings** → **API**
   - Copy the **Project URL** (looks like: `https://abcdefgh.supabase.co`)
   - Copy the **anon public** key (long string starting with `eyJ...`)

4. **Update your `.env.local` file** with the real values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Step 3: Configure Google OAuth (Optional)

To enable Google sign-in/sign-up:

1. **Go to Supabase Dashboard** → **Authentication** → **Providers**
2. **Enable Google Provider**:
   - Toggle "Enable Google provider"
   - Add your Google OAuth credentials:
     - **Client ID**: Get from [Google Cloud Console](https://console.cloud.google.com/)
     - **Client Secret**: Get from Google Cloud Console
3. **Configure Redirect URLs**:
   - Add `http://localhost:3001/auth/callback` for development
   - Add your production domain for production
4. **Save the configuration**

### Step 4: Restart Your Development Server

After creating the `.env.local` file:
```bash
# Stop the current server (Ctrl+C)
# Then restart it
npm run dev
```

## Database Setup

The server already has the necessary database tables and authentication setup. Make sure your Supabase project has:

1. **Authentication enabled** (should be by default)
2. **Email confirmation settings** configured in Authentication → Settings
3. **Users table** with the correct schema (already set up in your server)

## Features Implemented

- ✅ Beautiful login/signup modal with ocean theme
- ✅ Real-time authentication state management
- ✅ Form validation and error handling
- ✅ User registration with role selection
- ✅ Secure authentication with Supabase
- ✅ **Google OAuth sign-in/sign-up**
- ✅ Responsive design for mobile and desktop
- ✅ Integration with existing navigation

## Usage

1. Install dependencies: `npm install`
2. Set up environment variables
3. Start the development server: `npm run dev`
4. Click Login or Sign Up in the navigation
5. Test the authentication flow

The authentication system is now fully functional and integrated with your Tarang project!

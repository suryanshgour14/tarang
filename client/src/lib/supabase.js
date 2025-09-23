import { createClient } from '@supabase/supabase-js'

// Try to get from environment variables first
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Debug environment variables
console.log('🔍 Environment Variables Debug:')
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing')

// Fallback to hardcoded values for testing
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  Using hardcoded Supabase credentials for testing')
  supabaseUrl = 'https://qqggoiysyjnwuyvzwrrr.supabase.co'
  supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxZ2dvaXlzeWpud3V5dnp3cnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MDcxMTksImV4cCI6MjA3NDE4MzExOX0.PhNKPRbx-HKcRiIWoweA3FBXH2NL3beZ3ysQCDP878Y'
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

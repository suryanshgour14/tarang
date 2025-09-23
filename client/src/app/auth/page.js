'use client'

import { useState, useEffect, Suspense } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import OceanParticleBackground from '@/components/OceanParticleBackground'

function AuthForm() {
  const searchParams = useSearchParams()
  const [mode, setMode] = useState('signin')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { signUp, signIn, signInWithGoogle } = useAuth()
  const router = useRouter()

  // Set mode from URL parameter
  useEffect(() => {
    const urlMode = searchParams.get('mode')
    if (urlMode === 'signup') {
      setMode('signup')
    }
  }, [searchParams])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }

  const validateForm = () => {
    if (mode === 'signup') {
      if (!formData.name.trim()) {
        setError('Name is required')
        return false
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match')
        return false
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters')
        return false
      }
    }
    if (!formData.email.trim()) {
      setError('Email is required')
      return false
    }
    if (!formData.password.trim()) {
      setError('Password is required')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    setError('')

    try {
      if (mode === 'signup') {
        const { data, error } = await signUp(formData.email, formData.password, {
          name: formData.name
        })

        if (error) {
          setError(error.message)
        } else {
          setSuccess('Account created successfully! Please check your email to verify your account.')
          setTimeout(() => {
            router.push('/')
          }, 2000)
        }
      } else {
        const { data, error } = await signIn(formData.email, formData.password)

        if (error) {
          setError(error.message)
        } else {
          setSuccess('Signed in successfully!')
          setTimeout(() => {
            router.push('/')
          }, 1000)
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin')
    setError('')
    setSuccess('')
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')

    try {
      const { data, error } = await signInWithGoogle()
      
      if (error) {
        setError(error.message)
      }
      // Google OAuth will redirect, so no need to handle success here
    } catch (err) {
      setError('Failed to sign in with Google')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Ocean Particle Background with darker overlay */}
      <div className="absolute inset-0">
        <OceanParticleBackground />
        {/* Darker overlay for auth page */}
        <div className="absolute inset-0 bg-black/40"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #40E0D0, #87CEEB)',
                  color: '#0f2942',
                  boxShadow: '0 0 40px rgba(64, 224, 208, 0.8), 0 0 80px rgba(64, 224, 208, 0.4)'
                }}
              >
                T
              </div>
            </div>
            <h1 
              className="text-4xl font-bold mb-2"
              style={{
                color: '#87CEEB',
                textShadow: '0 0 30px rgba(135, 206, 235, 1), 0 0 60px rgba(135, 206, 235, 0.6)'
              }}
            >
              Tarang
            </h1>
            <p className="text-lg opacity-90" style={{ color: '#B0E0E6' }}>
              Ocean of Possibilities
            </p>
          </div>

          {/* Auth Form Card */}
          <div 
            className="backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-8"
            style={{
              background: 'linear-gradient(135deg, rgba(5, 15, 25, 0.9), rgba(10, 25, 40, 0.9))',
              boxShadow: `
                0 25px 50px -12px rgba(0, 0, 0, 0.8),
                0 0 0 1px rgba(64, 224, 208, 0.2),
                inset 0 1px 0 rgba(255, 255, 255, 0.05)
              `
            }}
          >
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                {mode === 'signin' ? 'Welcome Back' : 'Join Tarang'}
              </h2>
              <p className="text-slate-300 text-sm">
                {mode === 'signin' 
                  ? 'Sign in to continue your ocean journey' 
                  : 'Create your account to start monitoring ocean hazards'
                }
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-black/30 border border-cyan-500/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                  placeholder="Enter your password"
                  required
                />
              </div>

              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-black/30 border border-cyan-500/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                      placeholder="Confirm your password"
                      required
                    />
                  </div>

                </>
              )}

              {/* Error/Success Messages */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-green-400 text-sm">{success}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:from-cyan-400 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: loading 
                    ? 'linear-gradient(135deg, #64748b, #475569)' 
                    : 'linear-gradient(135deg, #40E0D0, #87CEEB)',
                  color: '#0f2942',
                  boxShadow: '0 4px 12px rgba(64, 224, 208, 0.3)'
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {mode === 'signin' ? 'Signing In...' : 'Creating Account...'}
                  </span>
                ) : (
                  mode === 'signin' ? 'Sign In' : 'Create Account'
                )}
               </button>

               {/* Divider */}
               <div className="relative my-6">
                 <div className="absolute inset-0 flex items-center">
                   <div className="w-full border-t border-white/20"></div>
                 </div>
                 <div className="relative flex justify-center text-sm">
                   <span className="px-2 bg-transparent text-slate-400">Or continue with</span>
                 </div>
               </div>

               {/* Google Sign-In Button */}
               <button
                 type="button"
                 onClick={handleGoogleSignIn}
                 disabled={loading}
                 className="w-full py-3 px-4 bg-white/10 border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
               >
                 <svg className="w-5 h-5" viewBox="0 0 24 24">
                   <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                   <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                   <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                   <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                 </svg>
                 <span>Continue with Google</span>
               </button>

               {/* Switch Mode */}
               <div className="text-center">
                <p className="text-slate-400 text-sm">
                  {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}
                  <button
                    type="button"
                    onClick={switchMode}
                    className="ml-1 text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                  >
                    {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                  </button>
                </p>
              </div>

              {/* Back to Home */}
              <div className="text-center pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="text-slate-400 hover:text-slate-300 text-sm transition-colors"
                >
                  ← Back to Home
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <AuthForm />
    </Suspense>
  )
}

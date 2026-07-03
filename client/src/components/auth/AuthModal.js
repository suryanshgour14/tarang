'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function AuthModal({ isOpen, onClose, initialMode = 'signin' }) {
  const [mode, setMode] = useState(initialMode)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'citizen'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { signUp, signIn } = useAuth()

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode)
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'citizen'
      })
      setError('')
      setSuccess('')
    }
  }, [isOpen, initialMode])

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
          name: formData.name,
          role: formData.role
        })

        if (error) {
          setError(error.message)
        } else {
          setSuccess('Account created successfully! Please check your email to verify your account.')
          setTimeout(() => {
            onClose()
          }, 2000)
        }
      } else {
        const { data, error } = await signIn(formData.email, formData.password)

        if (error) {
          setError(error.message)
        } else {
          setSuccess('Signed in successfully!')
          setTimeout(() => {
            onClose()
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-auto">
        <div 
          className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(15, 41, 66, 0.95), rgba(30, 58, 87, 0.95))',
            boxShadow: `
              0 25px 50px -12px rgba(0, 0, 0, 0.5),
              0 0 0 1px rgba(255, 255, 255, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.1)
            `
          }}
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #40E0D0, #87CEEB)',
                  color: '#0f2942',
                  boxShadow: '0 0 20px rgba(64, 224, 208, 0.4)'
                }}
              >
                T
              </div>
            </div>
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
          <form onSubmit={handleSubmit} className="px-8 pb-8">
            {mode === 'signup' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            )}

            <div className="mb-4">
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

            <div className="mb-4">
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
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                    placeholder="Confirm your password"
                    required
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Role
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                  >
                    <option value="citizen">Citizen Reporter</option>
                    <option value="official">Government Official</option>
                    <option value="analyst">Data Analyst</option>
                  </select>
                </div>
              </>
            )}

            {/* Error/Success Messages */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
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

            {/* Switch Mode */}
            <div className="mt-6 text-center">
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
          </form>
        </div>
      </div>
    </div>
  )
}

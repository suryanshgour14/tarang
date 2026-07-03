'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import OceanParticleBackground from '@/components/OceanParticleBackground'

export default function AccountPage() {
  const { user, isAuthenticated, signOut, loading } = useAuth()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    role: 'citizen'
  })
  const [updateLoading, setUpdateLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth')
    }
  }, [isAuthenticated, loading, router])

  // Load user data
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.user_metadata?.name || user.email?.split('@')[0] || '',
        email: user.email || '',
        role: user.user_metadata?.role || 'citizen'
      })
    }
  }, [user])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setUpdateLoading(true)
    setMessage('')

    try {
      // Here you would typically call an API to update the user profile
      // For now, we'll just simulate the update
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setMessage('Profile updated successfully!')
      setIsEditing(false)
    } catch (error) {
      setMessage('Failed to update profile. Please try again.')
    } finally {
      setUpdateLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ocean Particle Background with darker overlay */}
      <div className="absolute inset-0">
        <OceanParticleBackground />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold overflow-hidden"
                style={{
                  background: user?.user_metadata?.avatar_url || user?.user_metadata?.picture 
                    ? 'none' 
                    : 'linear-gradient(135deg, #40E0D0, #87CEEB)',
                  boxShadow: '0 0 40px rgba(64, 224, 208, 0.8), 0 0 80px rgba(64, 224, 208, 0.4)',
                  backgroundImage: user?.user_metadata?.avatar_url || user?.user_metadata?.picture
                    ? `url("${user.user_metadata.avatar_url || user.user_metadata.picture}")`
                    : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {user?.user_metadata?.avatar_url || user?.user_metadata?.picture ? (
                  <img 
                    src={user.user_metadata.avatar_url || user.user_metadata.picture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to initials if image fails to load
                      e.target.style.display = 'none'
                      e.target.parentElement.style.background = 'linear-gradient(135deg, #40E0D0, #87CEEB)'
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold" style={{ color: '#0f2942' }}>
                    {profileData.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            <h1 
              className="text-4xl font-bold mb-2"
              style={{
                color: '#87CEEB',
                textShadow: '0 0 30px rgba(135, 206, 235, 1), 0 0 60px rgba(135, 206, 235, 0.6)'
              }}
            >
              Account Settings
            </h1>
            <p className="text-lg opacity-90" style={{ color: '#B0E0E6' }}>
              Manage your Tarang profile
            </p>
          </div>

          {/* Account Card */}
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
            {/* Profile Information */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-6">Profile Information</h2>
              
              {!isEditing ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <span className="text-slate-300">Name:</span>
                    <span className="text-white font-medium">{profileData.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <span className="text-slate-300">Email:</span>
                    <span className="text-white font-medium">{profileData.email}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <span className="text-slate-300">Role:</span>
                    <span className="text-white font-medium capitalize">{profileData.role}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <span className="text-slate-300">Member Since:</span>
                    <span className="text-white font-medium">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={profileData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-black/30 border border-cyan-500/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">
                      Role
                    </label>
                    <select
                      name="role"
                      value={profileData.role}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-black/30 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                    >
                      <option value="citizen">Citizen Reporter</option>
                      <option value="official">Government Official</option>
                      <option value="analyst">Data Analyst</option>
                    </select>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      disabled={updateLoading}
                      className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:from-cyan-400 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300 disabled:opacity-50"
                    >
                      {updateLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-2 bg-white/10 border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Message Display */}
            {message && (
              <div className={`mb-6 p-3 rounded-lg ${
                message.includes('success') 
                  ? 'bg-green-500/10 border border-green-500/20' 
                  : 'bg-red-500/10 border border-red-500/20'
              }`}>
                <p className={`text-sm ${
                  message.includes('success') ? 'text-green-400' : 'text-red-400'
                }`}>
                  {message}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:from-cyan-400 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300"
                >
                  Edit Profile
                </button>
              )}
              
              <button
                onClick={handleSignOut}
                className="px-6 py-3 bg-red-500/20 border border-red-500/30 text-red-400 font-semibold rounded-lg hover:bg-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all duration-300"
              >
                Sign Out
              </button>
              
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-white/10 border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300"
              >
                Back to Home
              </button>
            </div>

            {/* Account Stats */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Account Statistics</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white/5 rounded-lg">
                  <div className="text-2xl font-bold text-cyan-400">0</div>
                  <div className="text-sm text-slate-300">Reports Submitted</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-lg">
                  <div className="text-2xl font-bold text-cyan-400">0</div>
                  <div className="text-sm text-slate-300">Contributions</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-lg">
                  <div className="text-2xl font-bold text-cyan-400">0</div>
                  <div className="text-sm text-slate-300">Points Earned</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

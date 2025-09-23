'use client'
import { useState, useEffect } from 'react'

export default function ReportForm() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get current location on component mount
  useEffect(() => {
    getCurrentLocation()
  }, [])

  const getCurrentLocation = () => {
    setIsLoadingLocation(true)
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
          setIsLoadingLocation(false)
        },
        (error) => {
          console.error('Error getting location:', error)
          setLocation({ error: 'Unable to get location' })
          setIsLoadingLocation(false)
        }
      )
    } else {
      setLocation({ error: 'Geolocation not supported' })
      setIsLoadingLocation(false)
    }
  }

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    setSelectedFile(file)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    
    if (!selectedFile && !description.trim()) {
      alert('Please upload a file or provide a description')
      return
    }

    setIsSubmitting(true)

    // Create form data
    const formData = new FormData()
    if (selectedFile) {
      formData.append('file', selectedFile)
    }
    formData.append('description', description)
    if (location && !location.error) {
      formData.append('latitude', location.latitude)
      formData.append('longitude', location.longitude)
    }

    try {
      // Here you would typically send to your API
      console.log('Submitting report:', {
        file: selectedFile,
        description,
        location
      })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Reset form
      setSelectedFile(null)
      setDescription('')
      document.getElementById('fileInput').value = ''
      
      alert('Report submitted successfully!')
    } catch (error) {
      console.error('Error submitting report:', error)
      alert('Error submitting report. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div 
        className="rounded-xl p-8 backdrop-blur-md border border-opacity-30"
        style={{
          background: `
            linear-gradient(135deg,
              rgba(135, 206, 235, 0.1) 0%,
              rgba(52, 212, 192, 0.05) 50%,
              rgba(19, 189, 184, 0.1) 100%
            )
          `,
          borderColor: 'rgba(135, 206, 235, 0.3)',
          boxShadow: `
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            0 10px 30px rgba(135, 206, 235, 0.2)
          `
        }}
      >
        <h2 
          className="text-3xl font-bold mb-8 text-center"
          style={{
            color: '#87CEEB',
            textShadow: '0 0 15px rgba(135, 206, 235, 0.6)'
          }}
        >
          Submit Ocean Report
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Top Row - File Upload (Left) and Description (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* File Upload Section */}
            <div className="space-y-4">
              <label 
                className="block text-lg font-semibold"
                style={{ color: '#B0E0E6' }}
              >
                Upload Evidence
              </label>
              
              <div className="relative">
                <input
                  id="fileInput"
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*,video/*"
                  className="hidden"
                />
                
                <label
                  htmlFor="fileInput"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-300 hover:scale-105"
                  style={{
                    borderColor: 'rgba(135, 206, 235, 0.5)',
                    background: selectedFile ? 
                      'linear-gradient(135deg, rgba(52, 212, 192, 0.1) 0%, rgba(19, 189, 184, 0.1) 100%)' : 
                      'linear-gradient(135deg, rgba(135, 206, 235, 0.05) 0%, rgba(176, 224, 230, 0.05) 100%)'
                  }}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-10 h-10 mb-3 opacity-70" style={{ color: '#87CEEB' }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"></path>
                    </svg>
                    <p className="mb-2 text-sm opacity-80" style={{ color: '#B0E0E6' }}>
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs opacity-60" style={{ color: '#87CEEB' }}>
                      Images or Videos (MAX. 10MB)
                    </p>
                    {selectedFile && (
                      <p className="mt-2 text-sm font-medium" style={{ color: '#34d4c0' }}>
                        {selectedFile.name}
                      </p>
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* Description Section */}
            <div className="space-y-4">
              <label 
                className="block text-lg font-semibold"
                style={{ color: '#B0E0E6' }}
              >
                Description <span className="text-sm opacity-70">(Optional)</span>
              </label>
              
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you observed in the ocean..."
                className="w-full h-64 p-4 rounded-lg border border-opacity-30 resize-none focus:outline-none focus:ring-2 transition-all duration-300"
                style={{
                  background: 'rgba(135, 206, 235, 0.05)',
                  borderColor: 'rgba(135, 206, 235, 0.3)',
                  color: '#B0E0E6',
                  focusRingColor: 'rgba(52, 212, 192, 0.5)'
                }}
              />
            </div>
          </div>

          {/* Location Section */}
          <div className="space-y-4">
            <label 
              className="block text-lg font-semibold"
              style={{ color: '#B0E0E6' }}
            >
              Location
            </label>
            
            <div 
              className="p-4 rounded-lg border border-opacity-30"
              style={{
                background: 'rgba(135, 206, 235, 0.05)',
                borderColor: 'rgba(135, 206, 235, 0.3)'
              }}
            >
              {isLoadingLocation ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: '#34d4c0' }}></div>
                  <span style={{ color: '#87CEEB' }}>Getting your location...</span>
                </div>
              ) : location?.error ? (
                <div className="flex items-center justify-between">
                  <span style={{ color: '#ff6b6b' }}>{location.error}</span>
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105"
                    style={{
                      background: 'linear-gradient(135deg, #34d4c0 0%, #13bdb8 100%)',
                      color: '#ffffff'
                    }}
                  >
                    Retry
                  </button>
                </div>
              ) : location ? (
                <div className="space-y-2">
                  <p style={{ color: '#B0E0E6' }}>
                    <span className="font-medium">Latitude:</span> {location.latitude.toFixed(6)}
                  </p>
                  <p style={{ color: '#B0E0E6' }}>
                    <span className="font-medium">Longitude:</span> {location.longitude.toFixed(6)}
                  </p>
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="text-sm opacity-70 hover:opacity-100 transition-opacity"
                    style={{ color: '#34d4c0' }}
                  >
                    Update location
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background: isSubmitting ? 
                  'linear-gradient(135deg, #666 0%, #888 100%)' :
                  'linear-gradient(135deg, #34d4c0 0%, #13bdb8 100%)',
                color: '#ffffff',
                boxShadow: '0 4px 15px rgba(52, 212, 192, 0.3)'
              }}
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Submitting...</span>
                </div>
              ) : (
                'Submit Report'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

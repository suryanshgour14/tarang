'use client'
import { useState, useEffect, useRef } from 'react'

export default function ReportForm() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMode, setSubmitMode] = useState(null) // 'file' or 'live'
  
  // Camera states
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)
  const [stream, setStream] = useState(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  
  // User ID - you might want to get this from context/auth
  const [userId, setUserId] = useState('') // Replace with actual user ID from your auth system
  
  // API endpoints
const LIVE_CAPTURE_API = 'http://127.0.0.1:8000/reports/submit/live_capture' // Replace with your actual API URL
const FILE_UPLOAD_API = 'http://127.0.0.1:8000/reports/submit/file_upload'   // Replace with your actual API URL
const WATER_HAZARDS_API = 'http://127.0.0.1:8001/fetch_water_hazards/' // Replace with your actual API URL

  useEffect(() => {
    getCurrentLocation()
    // Set a default user ID - replace this with your actual auth logic
    setUserId('550e8400-e29b-41d4-a716-446655440000') // Example UUID
  }, [])

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])

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
    setCapturedImage(null) // Clear any captured image
  }

  // Camera functions
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use rear camera if available
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setIsCameraActive(true)
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Unable to access camera. Please check permissions.')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setIsCameraActive(false)
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      const context = canvas.getContext('2d')
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Convert to base64
      const base64Image = canvas.toDataURL('image/jpeg', 0.8)
      setCapturedImage(base64Image)
      setSelectedFile(null) // Clear any selected file
      
      // Stop camera
      stopCamera()
    }
  }

  const retakePhoto = () => {
    setCapturedImage(null)
    startCamera()
  }

  // Call water hazards API after successful submission
  const callWaterHazardsAPI = async (latitude, longitude) => {
    try {
      const response = await fetch(WATER_HAZARDS_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_email: `user-${userId}@example.com`, // You might want to use actual user email
          user_id: userId,
          latitude: latitude,
          longitude: longitude,
          hazard_type: null // Optional, can be specified if needed
        }),
      })

      if (response.ok) {
        const hazardData = await response.json()
        console.log('Water hazards data:', hazardData)
        // You can display this data to the user or store it in state
        return hazardData
      } else {
        console.error('Water hazards API failed:', response.statusText)
      }
    } catch (error) {
      console.error('Error calling water hazards API:', error)
    }
  }

  // Handle live capture submission
  const handleLiveCaptureSubmit = async () => {
    if (!capturedImage) {
      alert('Please capture a photo first')
      return
    }

    if (!userId) {
      alert('User ID is required')
      return
    }

    setIsSubmitting(true)
    setSubmitMode('live')

    try {
      // Remove data URL prefix for API
      const base64Data = capturedImage.split(',')[1]

      const formData = new FormData()
      formData.append('user_id', userId)
      formData.append('image_base64', base64Data)
      if (description.trim()) {
        formData.append('description', description)
      }

      const response = await fetch(LIVE_CAPTURE_API, {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Live capture submission successful:', result)
        
        // Call water hazards API with the location from the response
        if (result.report && result.report.latitude && result.report.longitude) {
          await callWaterHazardsAPI(result.report.latitude, result.report.longitude)
        }
        
        // Reset form
        setCapturedImage(null)
        setDescription('')
        
        alert('Live capture report submitted successfully!')
      } else {
        const errorData = await response.json()
        console.error('Live capture submission failed:', errorData)
        alert(`Submission failed: ${errorData.detail || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error submitting live capture:', error)
      alert('Error submitting report. Please try again.')
    } finally {
      setIsSubmitting(false)
      setSubmitMode(null)
    }
  }

  // Handle file upload submission
  const handleFileUploadSubmit = async () => {
    if (!selectedFile) {
      alert('Please select a file first')
      return
    }

    if (!userId) {
      alert('User ID is required')
      return
    }

    setIsSubmitting(true)
    setSubmitMode('file')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('user_id', userId)
      if (description.trim()) {
        formData.append('description', description)
      }

      const response = await fetch(FILE_UPLOAD_API, {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        console.log('File upload submission successful:', result)
        
        // Call water hazards API with the location from the response
        if (result.report && result.report.latitude && result.report.longitude) {
          await callWaterHazardsAPI(result.report.latitude, result.report.longitude)
        }
        
        // Reset form
        setSelectedFile(null)
        setDescription('')
        document.getElementById('fileInput').value = ''
        
        alert('File upload report submitted successfully!')
      } else {
        const errorData = await response.json()
        console.error('File upload submission failed:', errorData)
        alert(`Submission failed: ${errorData.detail || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error submitting file upload:', error)
      alert('Error submitting report. Please try again.')
    } finally {
      setIsSubmitting(false)
      setSubmitMode(null)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    
    if (!description.trim() && !selectedFile && !capturedImage) {
      alert('Please upload a file, capture a photo, or provide a description')
      return
    }

    // Determine submission type and call appropriate handler
    if (capturedImage) {
      await handleLiveCaptureSubmit()
    } else if (selectedFile) {
      await handleFileUploadSubmit()
    } else {
      alert('Please capture a photo or select a file to upload')
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
          Submit Water Body Report
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Top Row - Camera/File Upload (Left) and Description (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Camera/File Upload Section */}
            <div className="space-y-4">
              <label 
                className="block text-lg font-semibold"
                style={{ color: '#B0E0E6' }}
              >
                Capture or Upload Evidence
              </label>
              
              {/* Camera Controls */}
              {!isCameraActive && !capturedImage && (
                <div className="flex space-x-4 mb-4">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105"
                    style={{
                      background: 'linear-gradient(135deg, #34d4c0 0%, #13bdb8 100%)',
                      color: '#ffffff'
                    }}
                  >
                    📷 Capture Live Photo
                  </button>
                </div>
              )}

              {/* Camera View */}
              {isCameraActive && (
                <div className="space-y-4">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-64 rounded-lg border border-opacity-30"
                    style={{ borderColor: 'rgba(135, 206, 235, 0.5)' }}
                  />
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105"
                      style={{
                        background: 'linear-gradient(135deg, #34d4c0 0%, #13bdb8 100%)',
                        color: '#ffffff'
                      }}
                    >
                      📸 Capture
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105"
                      style={{
                        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)',
                        color: '#ffffff'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Captured Image Preview */}
              {capturedImage && (
                <div className="space-y-4">
                  <img
                    src={capturedImage}
                    alt="Captured"
                    className="w-full h-64 object-cover rounded-lg border border-opacity-30"
                    style={{ borderColor: 'rgba(135, 206, 235, 0.5)' }}
                  />
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={retakePhoto}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105"
                      style={{
                        background: 'linear-gradient(135deg, #ffa500 0%, #ff8c00 100%)',
                        color: '#ffffff'
                      }}
                    >
                      🔄 Retake
                    </button>
                  </div>
                </div>
              )}

              {/* File Upload (only show if no captured image) */}
              {!capturedImage && (
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
              )}

              {/* Canvas for image capture (hidden) */}
              <canvas ref={canvasRef} style={{ display: 'none' }} />
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
                placeholder="Describe what you observed in the water body..."
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

          {/* User ID Display (for debugging - remove in production) */}
          <div className="space-y-2">
            <label 
              className="block text-sm font-medium opacity-70"
              style={{ color: '#B0E0E6' }}
            >
              User ID: {userId}
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-4">
            <button
              type="submit"
              disabled={isSubmitting || (!selectedFile && !capturedImage && !description.trim())}
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
                  <span>
                    {submitMode === 'live' ? 'Submitting Live Capture...' : 
                     submitMode === 'file' ? 'Uploading File...' : 'Submitting...'}
                  </span>
                </div>
              ) : (
                <span>
                  {capturedImage ? 'Submit Live Capture' : 
                   selectedFile ? 'Upload File' : 'Submit Report'}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

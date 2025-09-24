'use client'
import { useState, useEffect, useRef } from 'react'

export default function ReportForm() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMode, setSubmitMode] = useState(null)
  
  // Camera states
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)
  const [stream, setStream] = useState(null)
  const [cameraError, setCameraError] = useState(null)
  const [isLoadingCamera, setIsLoadingCamera] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  
  // User ID
  const [userId, setUserId] = useState('')
  
  // API endpoints
  const LIVE_CAPTURE_API = 'http://127.0.0.1:8000/reports/submit/live_capture'
  const FILE_UPLOAD_API = 'http://127.0.0.1:8000/reports/submit/file_upload'
  const WATER_HAZARDS_API = 'http://127.0.0.1:8001/fetch_water_hazards/'

  useEffect(() => {
    getCurrentLocation()
    setUserId('550e8400-e29b-41d4-a716-446655440000') // Replace with actual auth logic
  }, [])

  // Cleanup camera stream on component unmount
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
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      )
    } else {
      setLocation({ error: 'Geolocation not supported' })
      setIsLoadingLocation(false)
    }
  }

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
        setSelectedFile(file)
        setCapturedImage(null)
    }
  }

  const startCamera = async () => {
    console.log('🎥 Starting camera...')
    setIsLoadingCamera(true)
    setCameraError(null)
    setIsCameraActive(true) // Show the camera container immediately

    try {
      if (!videoRef.current || !canvasRef.current) {
        throw new Error('Camera elements not found in the DOM.');
      }
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser.')
      }

      // Stop any existing stream first
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      
      const constraints = [
        { video: { facingMode: { exact: 'environment' }, width: { ideal: 1280 } } },
        { video: { facingMode: 'environment', width: { ideal: 1280 } } },
        { video: { width: { ideal: 1280 }, height: { ideal: 720 } } },
        { video: true }
      ]

      let mediaStream = null
      let lastError = null

      for (const constraint of constraints) {
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia(constraint)
          if (mediaStream) break
        } catch (error) {
          console.warn(`Constraint failed:`, constraint, error.name)
          lastError = error
        }
      }

      if (!mediaStream) {
        throw lastError || new Error('Unable to access camera with any configuration.')
      }

      setStream(mediaStream)
      const video = videoRef.current
      video.srcObject = mediaStream
      await video.play()

      console.log('✅ Camera started successfully!')
    } catch (error) {
      console.error('❌ Camera error:', error)
      let errorMessage = 'Could not access camera. '
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please grant camera permissions in your browser settings.'
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device.'
      } else {
        errorMessage += error.message
      }
      setCameraError(errorMessage)
      setIsCameraActive(false)
    } finally {
      setIsLoadingCamera(false)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCameraActive(false)
    setCameraError(null)
    console.log('Camera stopped')
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.readyState < 2) {
      alert('Camera is not ready yet. Please wait a moment.')
      return
    }

    const canvas = canvasRef.current
    const video = videoRef.current
    const context = canvas.getContext('2d')
    
    if (video.videoWidth === 0) {
        alert('Video has no width, cannot capture.')
        return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    const base64Image = canvas.toDataURL('image/jpeg', 0.9)
    
    setCapturedImage(base64Image)
    setSelectedFile(null)
    stopCamera()
  }

  const retakePhoto = () => {
    setCapturedImage(null)
    // Use a short timeout to ensure the UI updates before starting the camera
    setTimeout(startCamera, 50)
  }

  const callWaterHazardsAPI = async (latitude, longitude) => {
    try {
      const response = await fetch(WATER_HAZARDS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: `user-${userId}@example.com`,
          user_id: userId, latitude, longitude,
          hazard_type: null
        }),
      })
      if (response.ok) {
        console.log('Water hazards data:', await response.json())
      } else {
        console.error('Water hazards API failed:', response.statusText)
      }
    } catch (error) {
      console.error('Error calling water hazards API:', error)
    }
  }

  const handleLiveCaptureSubmit = async () => {
    if (!capturedImage || !userId) {
      alert('A captured photo and user ID are required.')
      return
    }
    setIsSubmitting(true)
    setSubmitMode('live')
    try {
      const formData = new FormData()
      formData.append('user_id', userId)
      formData.append('image_base64', capturedImage.split(',')[1])
      if (description.trim()) formData.append('description', description)

      const response = await fetch(LIVE_CAPTURE_API, { method: 'POST', body: formData })

      if (response.ok) {
        const result = await response.json()
        console.log('Live capture submission successful:', result)
        if (result.report?.latitude) {
          await callWaterHazardsAPI(result.report.latitude, result.report.longitude)
        }
        setCapturedImage(null)
        setDescription('')
        alert('Live capture report submitted successfully!')
      } else {
        const errorData = await response.json()
        alert(`Submission failed: ${errorData.detail || 'Unknown error'}`)
      }
    } catch (error) {
      alert('Error submitting report. Please try again.')
    } finally {
      setIsSubmitting(false)
      setSubmitMode(null)
    }
  }

  const handleFileUploadSubmit = async () => {
    if (!selectedFile || !userId) {
      alert('A selected file and user ID are required.')
      return
    }
    setIsSubmitting(true)
    setSubmitMode('file')
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('user_id', userId)
      if (description.trim()) formData.append('description', description)

      const response = await fetch(FILE_UPLOAD_API, { method: 'POST', body: formData })

      if (response.ok) {
        const result = await response.json()
        console.log('File upload submission successful:', result)
        if (result.report?.latitude) {
          await callWaterHazardsAPI(result.report.latitude, result.report.longitude)
        }
        setSelectedFile(null)
        setDescription('')
        const fileInput = document.getElementById('fileInput')
        if (fileInput) fileInput.value = ''
        alert('File upload report submitted successfully!')
      } else {
        const errorData = await response.json()
        alert(`Submission failed: ${errorData.detail || 'Unknown error'}`)
      }
    } catch (error) {
      alert('Error submitting report. Please try again.')
    } finally {
      setIsSubmitting(false)
      setSubmitMode(null)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (capturedImage) {
      handleLiveCaptureSubmit()
    } else if (selectedFile) {
      handleFileUploadSubmit()
    } else {
      alert('Please capture a photo or select a file to upload.')
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div 
        className="rounded-xl p-8 backdrop-blur-md border border-opacity-30"
        style={{ background: `linear-gradient(135deg, rgba(135, 206, 235, 0.1) 0%, rgba(19, 189, 184, 0.1) 100%)`, borderColor: 'rgba(135, 206, 235, 0.3)' }}
      >
        <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: '#87CEEB', textShadow: '0 0 15px rgba(135, 206, 235, 0.6)' }}>
          Submit Water Body Report
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="block text-lg font-semibold" style={{ color: '#B0E0E6' }}>
                Capture or Upload Evidence
              </label>
              
              {cameraError && (
                <div className="p-4 rounded-lg border" style={{ background: 'rgba(255, 107, 107, 0.1)', borderColor: 'rgba(255, 107, 107, 0.3)', color: '#ff6b6b' }}>
                  <p className="text-sm">{cameraError}</p>
                  <button type="button" onClick={() => setCameraError(null)} className="mt-2 text-xs underline hover:no-underline">Dismiss</button>
                </div>
              )}

              {/* ✅ FIX: This container now correctly toggles visibility of the camera */}
              <div className={isCameraActive ? 'block' : 'hidden'}>
                <div className="space-y-4">
                  <div className="relative w-full h-64 bg-black rounded-lg border border-opacity-30 flex items-center justify-center" style={{ borderColor: 'rgba(135, 206, 235, 0.5)' }}>
                    {isLoadingCamera && <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>}
                    <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transition-opacity duration-300 ${isLoadingCamera ? 'opacity-0' : 'opacity-100'}`} />
                  </div>
                  <div className="flex space-x-4">
                    <button type="button" onClick={capturePhoto} disabled={isLoadingCamera} className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #34d4c0 0%, #13bdb8 100%)', color: '#ffffff' }}>📸 Capture</button>
                    <button type="button" onClick={stopCamera} className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105" style={{ background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)', color: '#ffffff' }}>Cancel</button>
                  </div>
                </div>
              </div>
              
              {/* Captured Image Preview */}
              {capturedImage && (
                <div className="space-y-4">
                  <img src={capturedImage} alt="Captured" className="w-full h-64 object-cover rounded-lg border border-opacity-30" style={{ borderColor: 'rgba(135, 206, 235, 0.5)' }} />
                  <div className="flex space-x-4">
                    <button type="button" onClick={retakePhoto} className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105" style={{ background: 'linear-gradient(135deg, #ffa500 0%, #ff8c00 100%)', color: '#ffffff' }}>🔄 Retake</button>
                  </div>
                </div>
              )}

              {/* Show controls only when camera is not in use */}
              {!isCameraActive && !capturedImage && (
                <div className="space-y-4">
                    <button type="button" onClick={startCamera} disabled={isLoadingCamera} className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: 'linear-gradient(135deg, #34d4c0 0%, #13bdb8 100%)', color: '#ffffff' }}>
                    {isLoadingCamera ? <div className="flex items-center space-x-2"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div><span>Starting...</span></div> : '📷 Capture Live Photo'}
                    </button>
                    <div className="relative">
                        <input id="fileInput" type="file" onChange={handleFileChange} accept="image/*" className="hidden" />
                        <label htmlFor="fileInput" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-300 hover:scale-105" style={{ borderColor: 'rgba(135, 206, 235, 0.5)', background: selectedFile ? 'linear-gradient(135deg, rgba(52, 212, 192, 0.1) 0%, rgba(19, 189, 184, 0.1) 100%)' : 'linear-gradient(135deg, rgba(135, 206, 235, 0.05) 0%, rgba(176, 224, 230, 0.05) 100%)' }}>
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <svg className="w-8 h-8 mb-3 opacity-70" style={{ color: '#87CEEB' }} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"></path></svg>
                                <p className="mb-2 text-sm opacity-80" style={{ color: '#B0E0E6' }}><span className="font-semibold">Click to upload</span> or drag & drop</p>
                                {selectedFile && <p className="mt-2 text-sm font-medium" style={{ color: '#34d4c0' }}>{selectedFile.name}</p>}
                            </div>
                        </label>
                    </div>
                </div>
              )}

              {/* ✅ FIX: Canvas is now always in the DOM but hidden */}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="space-y-4">
              <label className="block text-lg font-semibold" style={{ color: '#B0E0E6' }}>Description <span className="text-sm opacity-70">(Optional)</span></label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what you observed..." className="w-full h-full min-h-[24rem] p-4 rounded-lg border border-opacity-30 resize-none focus:outline-none focus:ring-2" style={{ background: 'rgba(135, 206, 235, 0.05)', borderColor: 'rgba(135, 206, 235, 0.3)', color: '#B0E0E6' }} />
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-lg font-semibold" style={{ color: '#B0E0E6' }}>Location</label>
            <div className="p-4 rounded-lg border border-opacity-30" style={{ background: 'rgba(135, 206, 235, 0.05)', borderColor: 'rgba(135, 206, 235, 0.3)' }}>
              {isLoadingLocation ? (
                <div className="flex items-center space-x-2"><div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: '#34d4c0' }}></div><span style={{ color: '#87CEEB' }}>Getting your location...</span></div>
              ) : location?.error ? (
                <div className="flex items-center justify-between"><span style={{ color: '#ff6b6b' }}>{location.error}</span><button type="button" onClick={getCurrentLocation} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'linear-gradient(135deg, #34d4c0 0%, #13bdb8 100%)', color: '#ffffff' }}>Retry</button></div>
              ) : location ? (
                <div className="space-y-2"><p style={{ color: '#B0E0E6' }}><span className="font-medium">Latitude:</span> {location.latitude.toFixed(6)}</p><p style={{ color: '#B0E0E6' }}><span className="font-medium">Longitude:</span> {location.longitude.toFixed(6)}</p><button type="button" onClick={getCurrentLocation} className="text-sm opacity-70 hover:opacity-100 transition-opacity" style={{ color: '#34d4c0' }}>Update location</button></div>
              ) : null}
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <button type="submit" disabled={isSubmitting || (!selectedFile && !capturedImage)} className="px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: isSubmitting ? 'linear-gradient(135deg, #666 0%, #888 100%)' : 'linear-gradient(135deg, #34d4c0 0%, #13bdb8 100%)', color: '#ffffff' }}>
              {isSubmitting ? (
                <div className="flex items-center space-x-2"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div><span>Submitting...</span></div>
              ) : (
                <span>{capturedImage ? 'Submit Live Capture' : 'Upload File'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

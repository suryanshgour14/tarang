'use client';

import { useEffect, useRef, useState } from 'react';

export default function OceanHazardHeatmap() {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const heatmapRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [heatmapData, setHeatmapData] = useState([]);

  // Mock data for oceanic hazards along Indian coastline
  const mockHeatmapData = [
    // High risk tsunami zones
    [8.0883, 77.5385, 0.9], // Kanyakumari - High tsunami risk
    [9.9312, 76.2673, 0.8], // Kochi - High tsunami risk
    [12.9716, 77.5946, 0.7], // Bangalore - Medium risk
    [13.0827, 80.2707, 0.8], // Chennai - High tsunami risk
    [15.3173, 73.1818, 0.6], // Goa - Medium risk
    [19.0760, 72.8777, 0.7], // Mumbai - High storm surge risk
    [22.5726, 88.3639, 0.8], // Kolkata - High cyclone risk
    [25.5941, 85.1376, 0.5], // Patna - Low risk
    [28.7041, 77.1025, 0.3], // Delhi - Low risk
    [30.7333, 76.7794, 0.4], // Chandigarh - Low risk
    
    // Cyclone risk zones
    [16.5062, 80.6480, 0.8], // Vijayawada - High cyclone risk
    [17.3850, 78.4867, 0.6], // Hyderabad - Medium risk
    [18.5204, 73.8567, 0.7], // Pune - Medium risk
    [20.2961, 85.8245, 0.9], // Bhubaneswar - High cyclone risk
    [21.1458, 79.0882, 0.3], // Nagpur - Low risk
    [23.0225, 72.5714, 0.5], // Ahmedabad - Low risk
    [24.5854, 73.7125, 0.2], // Udaipur - Low risk
    [26.2389, 73.0243, 0.3], // Jodhpur - Low risk
    [27.1767, 78.0081, 0.4], // Agra - Low risk
    [28.6139, 77.2090, 0.3], // New Delhi - Low risk
    
    // Storm surge risk zones
    [8.5241, 76.9366, 0.9], // Thiruvananthapuram - High storm surge
    [10.8505, 76.2711, 0.8], // Thrissur - High storm surge
    [11.2588, 75.7804, 0.7], // Kozhikode - Medium storm surge
    [12.2958, 76.6394, 0.6], // Mysore - Medium risk
    [14.4426, 79.9865, 0.7], // Nellore - Medium risk
    [15.8309, 78.0422, 0.5], // Kurnool - Low risk
    [17.6868, 83.2185, 0.8], // Visakhapatnam - High storm surge
    [19.2183, 72.9781, 0.7], // Thane - Storm surge risk
    [21.1458, 79.0882, 0.3], // Nagpur - Low risk
    [24.5854, 73.7125, 0.2], // Udaipur - Low risk
  ];

  useEffect(() => {
    // Load demo data immediately
    setHeatmapData(mockHeatmapData);
    setLoading(false);
    
    // Also try to fetch from API
    fetchHeatmapData();
    
    // Set a timeout to show fallback if Google Maps doesn't load
    setTimeout(() => {
      if (!mapLoaded) {
        console.log('Google Maps timeout - showing fallback');
        setError('Google Maps loading timeout. Showing fallback visualization.');
        setLoading(false);
      }
    }, 10000); // 10 second timeout
  }, []);

  const fetchHeatmapData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to fetch from API
      const response = await fetch('/api/reports/heatmap');
      if (response && response.ok) {
        const data = await response.json();
        if (data && data.success && data.data) {
          setHeatmapData(data.data);
        }
      }
    } catch (error) {
      console.log('API not available, using demo data:', error.message);
      // Use demo data when API is not available
      setHeatmapData(mockHeatmapData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && containerRef.current) {
      let retryCount = 0;
      const maxRetries = 20;
      
      // Wait for Google Maps to be available
      const checkGoogleMaps = () => {
        console.log('Checking Google Maps availability...', {
          google: !!window.google,
          maps: !!(window.google && window.google.maps),
          container: !!containerRef.current
        });
        
        if (window.google && window.google.maps && containerRef.current) {
          console.log('Google Maps loaded, initializing map...');
          initializeGoogleMap();
        } else {
          retryCount++;
          console.log(`Google Maps not ready, retrying... (${retryCount}/${maxRetries})`);
          
          if (retryCount < maxRetries) {
            // Retry after a short delay
            setTimeout(checkGoogleMaps, 1000);
          } else {
            console.log('Google Maps failed to load after maximum retries, showing fallback');
            setError('Google Maps failed to load. Showing fallback visualization.');
            setLoading(false);
          }
        }
      };
      
      // Start checking immediately
      checkGoogleMaps();
    }
  }, []);

  useEffect(() => {
    if (mapLoaded && heatmapData.length > 0 && mapRef.current) {
      updateHeatmap();
    }
  }, [mapLoaded, heatmapData]);

  const initializeGoogleMap = async () => {
    try {
      console.log('Initializing Google Map...');
      console.log('Container element:', containerRef.current);
      console.log('Google Maps object:', window.google);

      if (!containerRef.current) {
        throw new Error('Map container not found');
      }

      // Create map centered on India with focus on coastal areas
      const map = new window.google.maps.Map(containerRef.current, {
        center: { lat: 20.5937, lng: 78.9629 },
        zoom: 6,
        mapTypeId: 'roadmap',
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: true,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: true,
        styles: [
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#1e3a8a' }] // Blue for water
          },
          {
            featureType: 'landscape',
            elementType: 'geometry',
            stylers: [{ color: '#374151' }] // Gray for land
          }
        ]
      });

      mapRef.current = map;
      setMapLoaded(true);
      setLoading(false);

      // Add click handler
      map.addListener('click', (event) => {
        console.log(`Clicked at: ${event.latLng.lat()}, ${event.latLng.lng()}`);
      });

      // Force map to resize and render
      setTimeout(() => {
        if (mapRef.current) {
          window.google.maps.event.trigger(mapRef.current, 'resize');
          console.log('Google Map resize triggered');
        }
      }, 500);

      console.log('Google Map initialized successfully');

    } catch (error) {
      console.error('Error initializing Google Map:', error);
      setError(`Failed to initialize Google Map: ${error.message}`);
      setLoading(false);
    }
  };

  const updateHeatmap = () => {
    if (!mapRef.current || !heatmapData.length) return;

    try {
      console.log('Updating heatmap with data:', heatmapData.length, 'points');

      // Convert data to Google Maps format
      const points = heatmapData.map(point => ({
        location: new window.google.maps.LatLng(point[0], point[1]),
        weight: point[2] // Use the third value as weight
      }));

      // Create heatmap layer
      const heatmap = new window.google.maps.visualization.HeatmapLayer({
        data: points,
        map: mapRef.current,
        radius: 50,
        opacity: 0.8,
        gradient: [
          'rgba(59, 130, 246, 0)', // Blue (low risk)
          'rgba(59, 130, 246, 0.5)',
          'rgba(245, 158, 11, 0.7)', // Yellow (medium risk)
          'rgba(239, 68, 68, 0.9)' // Red (high risk)
        ]
      });

      heatmapRef.current = heatmap;
      console.log('Heatmap layer created successfully');

    } catch (error) {
      console.error('Error updating heatmap:', error);
    }
  };

  const updateHeatmapData = (newData) => {
    setHeatmapData(newData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-white">Loading Google Maps...</p>
          <p className="text-blue-300 text-sm mt-2">Initializing oceanic hazard visualization</p>
          <p className="text-yellow-300 text-xs mt-2">If this takes too long, fallback will show automatically</p>
        </div>
      </div>
    );
  }

  // Show fallback visualization if there's an error or Google Maps fails
  if (error || !mapLoaded) {
    return (
      <div className="space-y-4">
        {/* Status message */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="text-blue-400">🌊</div>
            <div>
              <p className="text-blue-200 text-sm">Oceanic Hazard Visualization</p>
              <p className="text-blue-300 text-xs mt-1">Interactive demo showing coastal risk areas</p>
            </div>
          </div>
        </div>
        
        {/* Interactive fallback map visualization */}
        <div className="h-[500px] w-full rounded-lg bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 relative overflow-hidden border border-blue-500/20">
          {/* Ocean background pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-blue-500/10 to-blue-600/20"></div>
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-blue-900/50 to-transparent"></div>
          </div>
          
          {/* Map title */}
          <div className="absolute top-4 left-4 z-10">
            <h3 className="text-white text-lg font-semibold">Indian Oceanic Hazards</h3>
            <p className="text-blue-200 text-sm">Coastal Risk Assessment</p>
          </div>
          
          {/* Simulated heatmap points with better positioning */}
          {mockHeatmapData.map((point, index) => {
            // Convert lat/lng to screen coordinates for India
            const x = ((point[1] - 68) / (97 - 68)) * 100; // Longitude range for India
            const y = ((37 - point[0]) / (37 - 6)) * 100; // Latitude range for India
            
            return (
              <div
                key={index}
                className="absolute w-6 h-6 rounded-full opacity-80 animate-pulse shadow-lg"
                style={{
                  left: `${Math.max(0, Math.min(100, x))}%`,
                  top: `${Math.max(0, Math.min(100, y))}%`,
                  backgroundColor: point[2] > 0.7 ? '#ef4444' : point[2] > 0.4 ? '#f59e0b' : '#3b82f6',
                  transform: 'translate(-50%, -50%)',
                  boxShadow: `0 0 20px ${point[2] > 0.7 ? '#ef4444' : point[2] > 0.4 ? '#f59e0b' : '#3b82f6'}40`
                }}
                title={`Risk Level: ${Math.round(point[2] * 100)}%`}
              />
            );
          })}
          
          {/* Legend */}
          <div className="absolute bottom-4 right-4 z-10 bg-black/50 backdrop-blur-sm rounded-lg p-3">
            <div className="text-white text-sm font-semibold mb-2">Risk Levels</div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-xs text-white">High Risk</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-xs text-white">Medium Risk</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-xs text-white">Low Risk</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Map info */}
        <div className="text-sm text-blue-200">
          <p>🌊 Interactive demo showing tsunami, cyclone, and storm surge risk zones along Indian coastline</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Map Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-300">Low Activity</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-gray-300">Medium Activity</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-300">High Activity</span>
          </div>
        </div>
        
        <button
          onClick={fetchHeatmapData}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Refresh Data
        </button>
      </div>

      {/* Google Maps Container */}
      <div 
        ref={containerRef}
        className="h-[500px] w-full rounded-lg border border-gray-600"
        style={{ minHeight: '500px' }}
      />

      {/* Map Instructions */}
      <div className="text-sm text-gray-400">
        <p>🗺️ Click on the map to explore specific locations. Darker areas indicate higher concentrations of oceanic hazards including tsunamis, cyclones, and storm surges.</p>
      </div>
    </div>
  );
}
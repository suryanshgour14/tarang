'use client';

import { useEffect, useRef, useState } from 'react';

export default function ReportsMap() {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Sample data for oceanic hazard reports
  const sampleReports = [
    { lat: 8.0883, lng: 77.5385, type: 'tsunami', severity: 'high', title: 'Tsunami Alert - Kanyakumari' },
    { lat: 9.9312, lng: 76.2673, type: 'cyclone', severity: 'medium', title: 'Cyclone Warning - Kochi' },
    { lat: 13.0827, lng: 80.2707, type: 'tsunami', severity: 'high', title: 'Tsunami Risk - Chennai' },
    { lat: 19.0760, lng: 72.8777, type: 'storm_surge', severity: 'high', title: 'Storm Surge - Mumbai' },
    { lat: 22.5726, lng: 88.3639, type: 'cyclone', severity: 'medium', title: 'Cyclone Activity - Kolkata' },
    { lat: 16.5062, lng: 80.6480, type: 'cyclone', severity: 'high', title: 'Cyclone Alert - Vijayawada' },
    { lat: 17.3850, lng: 78.4867, type: 'flooding', severity: 'low', title: 'Coastal Flooding - Hyderabad' },
    { lat: 20.2961, lng: 85.8245, type: 'cyclone', severity: 'high', title: 'Cyclone Warning - Bhubaneswar' },
    { lat: 8.5241, lng: 76.9366, type: 'storm_surge', severity: 'high', title: 'Storm Surge - Thiruvananthapuram' },
    { lat: 17.6868, lng: 83.2185, type: 'tsunami', severity: 'medium', title: 'Tsunami Risk - Visakhapatnam' }
  ];

  useEffect(() => {
    if (typeof window !== 'undefined' && containerRef.current) {
      // Add a timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        if (!mapLoaded) {
          setError('Google Maps failed to load within timeout period');
          setLoading(false);
        }
      }, 10000); // 10 second timeout

      // Check if Google Maps is already loaded
      if (window.google && window.google.maps) {
        initializeMap();
        clearTimeout(timeout);
      } else {
        // Wait for Google Maps to load
        const checkGoogleMaps = () => {
          if (window.google && window.google.maps) {
            initializeMap();
            clearTimeout(timeout);
          } else {
            setTimeout(checkGoogleMaps, 100);
          }
        };
        checkGoogleMaps();
      }

      return () => clearTimeout(timeout);
    }
  }, []);

  const initializeMap = () => {
    try {
      console.log('Initializing map...', {
        google: !!window.google,
        maps: !!(window.google && window.google.maps),
        container: !!containerRef.current
      });

      // Check if Google Maps is loaded
      if (!window.google || !window.google.maps) {
        console.error('Google Maps not loaded');
        setError('Google Maps not loaded');
        setLoading(false);
        return;
      }

      // Create map centered on India
      const map = new window.google.maps.Map(containerRef.current, {
        center: { lat: 20.5937, lng: 78.9629 },
        zoom: 6,
        mapTypeId: 'roadmap',
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
          },
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ],
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: true,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: true
      });

      mapRef.current = map;
      setMapLoaded(true);
      setLoading(false);

      console.log('Map initialized successfully');

      // Add markers for each report
      addReportMarkers(map);

      // Add click listener
      map.addListener('click', (event) => {
        console.log(`Clicked at: ${event.latLng.lat()}, ${event.latLng.lng()}`);
      });

    } catch (error) {
      console.error('Error initializing map:', error);
      setError(`Failed to initialize map: ${error.message}`);
      setLoading(false);
    }
  };

  const addReportMarkers = (map) => {
    sampleReports.forEach((report, index) => {
      const marker = new window.google.maps.Marker({
        position: { lat: report.lat, lng: report.lng },
        map: map,
        title: report.title,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: getMarkerColor(report.severity),
          fillOpacity: 0.8,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });

      // Add info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="p-2">
            <h3 class="font-semibold text-gray-800">${report.title}</h3>
            <p class="text-sm text-gray-600">Type: ${report.type.replace('_', ' ').toUpperCase()}</p>
            <p class="text-sm text-gray-600">Severity: ${report.severity.toUpperCase()}</p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });
    });
  };

  const getMarkerColor = (severity) => {
    switch (severity) {
      case 'high': return '#ef4444'; // Red
      case 'medium': return '#f59e0b'; // Yellow
      case 'low': return '#3b82f6'; // Blue
      default: return '#6b7280'; // Gray
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-white">Loading Map...</p>
          <p className="text-blue-300 text-sm mt-2">Initializing oceanic hazard visualization</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        {/* Error message */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="text-red-400">⚠️</div>
            <div>
              <p className="text-red-200 text-sm">Map Loading Error</p>
              <p className="text-red-300 text-xs mt-1">{error}</p>
            </div>
          </div>
        </div>
        
        {/* Fallback map visualization */}
        <div className="h-[500px] w-full rounded-lg bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 relative overflow-hidden border border-blue-500/20">
          {/* Ocean background pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-blue-500/10 to-blue-600/20"></div>
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-blue-900/50 to-transparent"></div>
          </div>
          
          {/* Map title */}
          <div className="absolute top-4 left-4 z-10">
            <h3 className="text-white text-lg font-semibold">Oceanic Hazard Reports</h3>
            <p className="text-blue-200 text-sm">Interactive Hazard Visualization</p>
          </div>
          
          {/* Simulated hazard markers */}
          {sampleReports.map((report, index) => {
            // Convert lat/lng to screen coordinates for India
            const x = ((report.lng - 68) / (97 - 68)) * 100; // Longitude range for India
            const y = ((37 - report.lat) / (37 - 6)) * 100; // Latitude range for India
            
            return (
              <div
                key={index}
                className="absolute w-6 h-6 rounded-full opacity-80 animate-pulse shadow-lg cursor-pointer"
                style={{
                  left: `${Math.max(0, Math.min(100, x))}%`,
                  top: `${Math.max(0, Math.min(100, y))}%`,
                  backgroundColor: getMarkerColor(report.severity),
                  transform: 'translate(-50%, -50%)',
                  boxShadow: `0 0 20px ${getMarkerColor(report.severity)}40`
                }}
                title={`${report.title} - ${report.severity.toUpperCase()}`}
              />
            );
          })}
          
          {/* Legend */}
          <div className="absolute bottom-4 right-4 z-10 bg-black/50 backdrop-blur-sm rounded-lg p-3">
            <div className="text-white text-sm font-semibold mb-2">Hazard Levels</div>
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
        
        {/* Retry button */}
        <div className="text-center">
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              setMapLoaded(false);
              // Retry initialization
              setTimeout(() => {
                if (typeof window !== 'undefined' && containerRef.current) {
                  if (window.google && window.google.maps) {
                    initializeMap();
                  } else {
                    setError('Google Maps still not available');
                    setLoading(false);
                  }
                }
              }, 1000);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Retry Map Loading
          </button>
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
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-300">High Risk</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-gray-300">Medium Risk</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-300">Low Risk</span>
          </div>
        </div>
        
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Refresh Map
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
        <p>🗺️ Click on markers to view detailed information about oceanic hazards. Red markers indicate high-risk areas, yellow for medium risk, and blue for low risk.</p>
      </div>
    </div>
  );
}

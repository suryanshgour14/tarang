'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then(mod => mod.CircleMarker), { ssr: false });

export default function LeafletReportsMap() {
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sample data for oceanic hazard reports
  const sampleReports = [
    { lat: 8.0883, lng: 77.5385, type: 'tsunami', severity: 'high', title: 'Tsunami Alert - Kanyakumari', description: 'High tsunami risk zone with recent seismic activity' },
    { lat: 9.9312, lng: 76.2673, type: 'cyclone', severity: 'medium', title: 'Cyclone Warning - Kochi', description: 'Cyclone formation detected in Arabian Sea' },
    { lat: 13.0827, lng: 80.2707, type: 'tsunami', severity: 'high', title: 'Tsunami Risk - Chennai', description: 'Coastal area under tsunami watch' },
    { lat: 19.0760, lng: 72.8777, type: 'storm_surge', severity: 'high', title: 'Storm Surge - Mumbai', description: 'High storm surge warning for Mumbai coast' },
    { lat: 22.5726, lng: 88.3639, type: 'cyclone', severity: 'medium', title: 'Cyclone Activity - Kolkata', description: 'Cyclone tracking towards Bay of Bengal' },
    { lat: 16.5062, lng: 80.6480, type: 'cyclone', severity: 'high', title: 'Cyclone Alert - Vijayawada', description: 'Severe cyclone warning for Andhra Pradesh' },
    { lat: 17.3850, lng: 78.4867, type: 'flooding', severity: 'low', title: 'Coastal Flooding - Hyderabad', description: 'Minor coastal flooding reported' },
    { lat: 20.2961, lng: 85.8245, type: 'cyclone', severity: 'high', title: 'Cyclone Warning - Bhubaneswar', description: 'Very severe cyclone approaching Odisha' },
    { lat: 8.5241, lng: 76.9366, type: 'storm_surge', severity: 'high', title: 'Storm Surge - Thiruvananthapuram', description: 'High storm surge warning for Kerala coast' },
    { lat: 17.6868, lng: 83.2185, type: 'tsunami', severity: 'medium', title: 'Tsunami Risk - Visakhapatnam', description: 'Medium tsunami risk for Andhra Pradesh coast' }
  ];

  useEffect(() => {
    setIsClient(true);
    setLoading(false);
  }, []);

  const getMarkerColor = (severity) => {
    switch (severity) {
      case 'high': return '#ef4444'; // Red
      case 'medium': return '#f59e0b'; // Yellow
      case 'low': return '#3b82f6'; // Blue
      default: return '#6b7280'; // Gray
    }
  };

  const getMarkerSize = (severity) => {
    switch (severity) {
      case 'high': return 12;
      case 'medium': return 10;
      case 'low': return 8;
      default: return 6;
    }
  };

  const getMarkerWeight = (severity) => {
    switch (severity) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 1;
    }
  };

  if (!isClient || loading) {
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

      {/* Leaflet Map Container */}
      <div className="h-[500px] w-full rounded-lg border border-gray-600 overflow-hidden">
        <MapContainer
          center={[20.5937, 78.9629]} // Center on India
          zoom={6}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Add markers for each report */}
          {sampleReports.map((report, index) => (
            <CircleMarker
              key={index}
              center={[report.lat, report.lng]}
              radius={getMarkerSize(report.severity)}
              pathOptions={{
                color: getMarkerColor(report.severity),
                fillColor: getMarkerColor(report.severity),
                fillOpacity: 0.8,
                weight: getMarkerWeight(report.severity)
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-semibold text-gray-800 mb-1">{report.title}</h3>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Type:</strong> {report.type.replace('_', ' ').toUpperCase()}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Severity:</strong> {report.severity.toUpperCase()}
                  </p>
                  <p className="text-sm text-gray-500">{report.description}</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {/* Map Instructions */}
      <div className="text-sm text-slate-400 mt-4">
        <p>Click on markers to view detailed information about oceanic hazards. Red markers indicate high-risk areas, amber for medium risk, and blue for low risk.</p>
      </div>
    </div>
  );
}

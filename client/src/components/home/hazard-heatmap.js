'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then(mod => mod.CircleMarker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

export default function HazardHeatmap() {
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);

  // Key hotspot data for home page display
  const hotspotData = [
    { lat: 8.0883, lng: 77.5385, type: 'tsunami', severity: 'high', title: 'Kanyakumari', reports: 15 },
    { lat: 13.0827, lng: 80.2707, type: 'tsunami', severity: 'high', title: 'Chennai', reports: 23 },
    { lat: 19.0760, lng: 72.8777, type: 'storm_surge', severity: 'high', title: 'Mumbai', reports: 18 },
    { lat: 9.9312, lng: 76.2673, type: 'cyclone', severity: 'medium', title: 'Kochi', reports: 12 },
    { lat: 22.5726, lng: 88.3639, type: 'cyclone', severity: 'medium', title: 'Kolkata', reports: 16 },
    { lat: 16.5062, lng: 80.6480, type: 'cyclone', severity: 'high', title: 'Vijayawada', reports: 21 },
    { lat: 20.2961, lng: 85.8245, type: 'cyclone', severity: 'high', title: 'Bhubaneswar', reports: 19 },
    { lat: 8.5241, lng: 76.9366, type: 'storm_surge', severity: 'medium', title: 'Thiruvananthapuram', reports: 14 }
  ];

  useEffect(() => {
    setIsClient(true);
    setLoading(false);
  }, []);

  const getMarkerColor = (severity) => {
    switch (severity) {
      case 'high': return '#ef4444'; // Red
      case 'medium': return '#f59e0b'; // Amber
      case 'low': return '#10b981'; // Emerald
      default: return '#6b7280'; // Gray
    }
  };

  const getMarkerRadius = (reports) => {
    if (reports > 20) return 15;
    if (reports > 15) return 12;
    if (reports > 10) return 10;
    return 8;
  };

  const getHazardIcon = (type) => {
    switch (type) {
      case 'tsunami': return '●';
      case 'cyclone': return '◐';
      case 'storm_surge': return '▲';
      case 'flooding': return '■';
      default: return '◆';
    }
  };

  const getHazardColor = (type) => {
    switch (type) {
      case 'tsunami': return 'text-red-400';
      case 'cyclone': return 'text-amber-400';
      case 'storm_surge': return 'text-orange-400';
      case 'flooding': return 'text-cyan-400';
      default: return 'text-slate-400';
    }
  };

  if (loading || !isClient) {
    return (
      <div className="h-96 rounded-xl bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50 backdrop-blur-sm border border-cyan-500/20 flex items-center justify-center">
        <div className="text-white text-lg">Loading hazard map...</div>
      </div>
    );
  }

  return (
    <div className="h-96 rounded-xl overflow-hidden border border-cyan-500/20 relative">
      <MapContainer
        center={[15.8497, 78.6569]} // Center of India
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        className="z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {hotspotData.map((hotspot, index) => (
          <CircleMarker
            key={index}
            center={[hotspot.lat, hotspot.lng]}
            radius={getMarkerRadius(hotspot.reports)}
            fillOpacity={0.7}
            color={getMarkerColor(hotspot.severity)}
            fillColor={getMarkerColor(hotspot.severity)}
            weight={2}
          >
            <Popup className="custom-popup">
              <div className="p-3 bg-slate-800 text-white rounded-lg border border-cyan-500/30">
                <div className="flex items-center space-x-2 mb-3">
                  <span className={`text-xl font-bold ${getHazardColor(hotspot.type)}`}>{getHazardIcon(hotspot.type)}</span>
                  <h3 className="font-bold text-lg text-white">{hotspot.title}</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-slate-300">
                    <span className="font-medium text-white">Type:</span> {hotspot.type.replace('_', ' ')}
                  </p>
                  <p className="text-slate-300">
                    <span className="font-medium text-white">Severity:</span> 
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                      hotspot.severity === 'high' ? 'bg-red-500' : 
                      hotspot.severity === 'medium' ? 'bg-amber-500' : 'bg-green-500'
                    }`}>
                      {hotspot.severity.toUpperCase()}
                    </span>
                  </p>
                  <p className="text-slate-300">
                    <span className="font-medium text-white">Reports:</span> {hotspot.reports}
                  </p>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      
      {/* Overlay gradient for better aesthetics */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-slate-900/20 pointer-events-none"></div>
    </div>
  );
}
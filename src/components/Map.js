// Map.js - Interactive Map Component
// Displays food outlets with classification markers and zone shading

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MapZoneShading from './MapZoneShading';
import ZoneToggleControls from './ZoneToggleControls';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom marker icons for different food outlet types
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="
      background-color: ${color};
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });
};

function Map({ cityData, foodOutlets, loading, algorithmAnalysis, overlapAnalysis }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const zoneShadingRef = useRef(null);
  const [zoneStates, setZoneStates] = useState({
    foodDeserts: false,
    interventionSites: false,
    overlaps: false
  });

  useEffect(() => {
    if (!cityData) return;

    // Initialize map
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView(
        [cityData.lat, cityData.lng], 
        12
      );
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);

      // Initialize zone shading system
      zoneShadingRef.current = new MapZoneShading(mapInstanceRef.current);
      zoneShadingRef.current.initialize();
    } else {
      // Update map center
      mapInstanceRef.current.setView([cityData.lat, cityData.lng], 12);
    }

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Add food outlet markers
    if (foodOutlets && foodOutlets.length > 0) {
      foodOutlets.forEach(outlet => {
        if (outlet.lat && outlet.lng) {
          const icon = createCustomIcon(outlet.classification.color);
          
          const marker = L.marker([outlet.lat, outlet.lng], { icon })
            .addTo(mapInstanceRef.current);
          
          // Add popup with outlet information
          marker.bindPopup(`
            <div style="min-width: 200px;">
              <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #2c3e50;">
                ${outlet.name}
              </h4>
              <div style="font-size: 12px; line-height: 1.4;">
                <div style="margin-bottom: 4px;">
                  <strong>Type:</strong> ${outlet.rawType || 'Unknown'}
                </div>
                <div style="margin-bottom: 4px;">
                  <strong>Classification:</strong> 
                  <span style="color: ${outlet.classification.color}; font-weight: 500;">
                    ${outlet.classification.label}
                  </span>
                </div>
                <div style="margin-bottom: 4px;">
                  <strong>Score:</strong> ${outlet.classification.score}
                </div>
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
                  <small style="color: #6c757d;">
                    Lat: ${outlet.lat.toFixed(4)}, Lng: ${outlet.lng.toFixed(4)}
                  </small>
                </div>
              </div>
            </div>
          `);
          
          markersRef.current.push(marker);
        }
      });
    }

    // Add city center marker
    const cityIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="
        background-color: #007bff;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      "></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    const cityMarker = L.marker([cityData.lat, cityData.lng], { icon: cityIcon })
      .addTo(mapInstanceRef.current);
    
    cityMarker.bindPopup(`
      <div style="min-width: 150px;">
        <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #2c3e50;">
          ${cityData.name}
        </h4>
        <div style="font-size: 12px; line-height: 1.4;">
          <div style="margin-bottom: 4px;">
            <strong>Center:</strong> ${cityData.lat.toFixed(4)}, ${cityData.lng.toFixed(4)}
          </div>
          <div style="margin-bottom: 4px;">
            <strong>Food Outlets:</strong> ${foodOutlets ? foodOutlets.length : 0}
          </div>
        </div>
      </div>
    `);

    markersRef.current.push(cityMarker);

    // Add walking radius circles for top healthy outlets
    if (foodOutlets) {
      const healthyOutlets = foodOutlets
        .filter(o => o.classification.label === 'Healthy Food Source')
        .slice(0, 5); // Show circles for top 5 healthy outlets

      healthyOutlets.forEach(outlet => {
        const circle = L.circle([outlet.lat, outlet.lng], {
          radius: 1200, // 15-minute walk at 5km/h
          fillColor: '#0d5e3a',
          fillOpacity: 0.05,
          color: '#0d5e3a',
          weight: 1,
          dashArray: '5, 5'
        }).addTo(mapInstanceRef.current);
        
        markersRef.current.push(circle);
      });
    }

  }, [cityData, foodOutlets]);

  // Update zone shading when algorithm analysis changes
  useEffect(() => {
    if (zoneShadingRef.current && algorithmAnalysis && cityData) {
      const cityBounds = {
        north: cityData.boundingBox[1],
        south: cityData.boundingBox[0],
        east: cityData.boundingBox[3],
        west: cityData.boundingBox[2]
      };

      zoneShadingRef.current.updateZones(algorithmAnalysis, cityBounds);
      
      // Update available zones state
      setZoneStates({
        foodDeserts: !!(algorithmAnalysis.foodDeserts),
        interventionSites: !!(algorithmAnalysis.interventionSites),
        overlaps: !!(overlapAnalysis && overlapAnalysis.conflictZones)
      });
    }
  }, [algorithmAnalysis, overlapAnalysis, cityData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (zoneShadingRef.current) {
        zoneShadingRef.current.destroy();
        zoneShadingRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Zone toggle handlers
  const handleToggleZone = (zoneType, visible) => {
    if (zoneShadingRef.current) {
      zoneShadingRef.current.toggleZoneLayer(zoneType, visible);
    }
    setZoneStates(prev => ({
      ...prev,
      [zoneType]: visible
    }));
  };

  const handleClearAllZones = () => {
    if (zoneShadingRef.current) {
      zoneShadingRef.current.clearAllZones();
    }
    setZoneStates({
      foodDeserts: false,
      interventionSites: false,
      overlaps: false
    });
  };

  const handleShowAllZones = () => {
    if (zoneShadingRef.current) {
      zoneShadingRef.current.toggleZoneLayer('foodDeserts', true);
      zoneShadingRef.current.toggleZoneLayer('interventionSites', true);
      zoneShadingRef.current.toggleZoneLayer('overlaps', true);
    }
    setZoneStates({
      foodDeserts: true,
      interventionSites: true,
      overlaps: true
    });
  };

  if (!cityData) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        color: '#6c757d',
        border: '1px solid #dee2e6',
        borderRadius: '4px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>
            No City Selected
          </h2>
          <p style={{ fontSize: '14px' }}>
            Search for a city to begin analysis
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-map" style={{ position: 'relative', height: '100%' }}>
      {/* Zone Toggle Controls */}
      <ZoneToggleControls
        onToggleZone={handleToggleZone}
        onClearAllZones={handleClearAllZones}
        onShowAllZones={handleShowAllZones}
        availableZones={zoneStates}
        isVisible={!!algorithmAnalysis}
      />

      {/* Map Container */}
      <div 
        ref={mapRef} 
        style={{ 
          height: '100%', 
          width: '100%',
          border: '1px solid #dee2e6',
          borderRadius: '4px'
        }} 
      />

      {/* Loading Overlay */}
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          borderRadius: '4px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #f3f4f6',
              borderTop: '4px solid #007bff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}></div>
            <div style={{ fontSize: '14px', color: '#6c757d' }}>
              Fetching city data...
            </div>
          </div>
        </div>
      )}

      {/* Map Legend */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        backgroundColor: 'white',
        padding: '12px',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        fontSize: '12px',
        zIndex: 1000,
        minWidth: '150px'
      }}>
        <div style={{ fontWeight: '600', marginBottom: '8px', color: '#2c3e50' }}>
          Legend
        </div>
        <div style={{ marginBottom: '4px' }}>
          <span style={{ 
            display: 'inline-block', 
            width: '12px', 
            height: '12px', 
            backgroundColor: '#007bff', 
            borderRadius: '50%',
            marginRight: '6px',
            border: '2px solid white',
            boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
          }}></span>
          City Center
        </div>
        <div style={{ marginBottom: '4px' }}>
          <span style={{ 
            display: 'inline-block', 
            width: '12px', 
            height: '12px', 
            backgroundColor: '#0d5e3a', 
            borderRadius: '50%',
            marginRight: '6px',
            border: '2px solid white',
            boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
          }}></span>
          Healthy Food
        </div>
        <div style={{ marginBottom: '4px' }}>
          <span style={{ 
            display: 'inline-block', 
            width: '12px', 
            height: '12px', 
            backgroundColor: '#fbbf24', 
            borderRadius: '50%',
            marginRight: '6px',
            border: '2px solid white',
            boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
          }}></span>
          Mixed Selection
        </div>
        <div style={{ marginBottom: '8px' }}>
          <span style={{ 
            display: 'inline-block', 
            width: '12px', 
            height: '12px', 
            backgroundColor: '#dc2626', 
            borderRadius: '50%',
            marginRight: '6px',
            border: '2px solid white',
            boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
          }}></span>
          Unhealthy
        </div>
        <div style={{ 
          fontSize: '10px', 
          color: '#6c757d',
          borderTop: '1px solid #eee',
          paddingTop: '6px'
        }}>
          Circles = 15-min walk radius
        </div>
      </div>

      {/* CSS for spinner animation and zone shading */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Zone shading styles */
        .food-desert-zone {
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .food-desert-zone:hover {
          filter: brightness(1.1);
        }
        
        .intervention-site-zone {
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .intervention-site-zone:hover {
          filter: brightness(1.1);
        }
        
        .overlap-zone {
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .overlap-zone:hover {
          filter: brightness(1.1);
        }
        
        /* Zone toggle controls */
        .zone-toggle-controls {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
      `}</style>
    </div>
  );
}

export default Map;

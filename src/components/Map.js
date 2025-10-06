/* global globalThis */
// Map.js - Interactive Map Component with Layer Control
// Displays food outlets with classification markers organized in toggleable layers
// Implements progressive loading for large datasets

import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import LayerControl from './LayerControl';
import HeatMapLayer from './HeatMapLayer';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Icon cache to avoid recreating icons
const iconCache = new globalThis.Map();

// Configuration for progressive loading
const PROGRESSIVE_LOADING_CONFIG = {
  THRESHOLD: 500,        // Start progressive loading if more than 500 markers
  CHUNK_SIZE: 100,       // Load 100 markers at a time
  CHUNK_DELAY: 50        // 50ms delay between chunks
};

// Custom marker icons for different food outlet types (cached)
const createCustomIcon = (color) => {
  if (iconCache.has(color)) {
    return iconCache.get(color);
  }

  const icon = L.divIcon({
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

  iconCache.set(color, icon);
  return icon;
};

function Map(props = {}) {
  const {
    cityData = null,
    foodOutlets = [],
    optimalPlacements = [],
    aiSolutions = null,
    loading = false
  } = props;
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupsRef = useRef({});
  const loadingTimeoutsRef = useRef([]);
  const [markerLoadProgress, setMarkerLoadProgress] = useState(0);
  const [isLoadingMarkers, setIsLoadingMarkers] = useState(false);

  // Layer visibility state
  const [visibleLayers, setVisibleLayers] = useState({
    // Food outlets
    healthy: true,
    mixed: true,
    unhealthy: true,
    unknown: true,
    // Interventions
    SUPERMARKET: true,
    FARMERS_MARKET: true,
    MOBILE_MARKET: true,
    URBAN_FARM: true,
    COMMUNITY_GARDEN: true,
    VERTICAL_FARM: true,
    AQUAPONICS: true,
    FOOD_HUB: true,
    COMMUNITY_KITCHEN: true,
    FOOD_PANTRY: true,
    // Heat maps
    heatmap_healthy: false,
    heatmap_mixed: false,
    heatmap_unhealthy: false,
    heatmap_unknown: false,
    heatmap_intervention: false,
    ai_recommendations: true
  });

  // Initialize map
  useEffect(() => {
    if (!cityData || mapInstanceRef.current) return;

    mapInstanceRef.current = L.map(mapRef.current).setView(
      [cityData.lat, cityData.lng],
      12
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstanceRef.current);

    // Initialize layer groups
    layerGroupsRef.current = {
      healthy: L.layerGroup().addTo(mapInstanceRef.current),
      mixed: L.layerGroup().addTo(mapInstanceRef.current),
      unhealthy: L.layerGroup().addTo(mapInstanceRef.current),
      unknown: L.layerGroup().addTo(mapInstanceRef.current),
      SUPERMARKET: L.layerGroup().addTo(mapInstanceRef.current),
      FARMERS_MARKET: L.layerGroup().addTo(mapInstanceRef.current),
      MOBILE_MARKET: L.layerGroup().addTo(mapInstanceRef.current),
      URBAN_FARM: L.layerGroup().addTo(mapInstanceRef.current),
      COMMUNITY_GARDEN: L.layerGroup().addTo(mapInstanceRef.current),
      VERTICAL_FARM: L.layerGroup().addTo(mapInstanceRef.current),
      AQUAPONICS: L.layerGroup().addTo(mapInstanceRef.current),
      FOOD_HUB: L.layerGroup().addTo(mapInstanceRef.current),
      COMMUNITY_KITCHEN: L.layerGroup().addTo(mapInstanceRef.current),
      FOOD_PANTRY: L.layerGroup().addTo(mapInstanceRef.current),
      ai_recommendations: L.layerGroup().addTo(mapInstanceRef.current),
      cityCenter: L.layerGroup().addTo(mapInstanceRef.current)
    };

    return () => {
      // Clear any pending loading timeouts
      loadingTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      loadingTimeoutsRef.current = [];

      // Comprehensive cleanup
      if (mapInstanceRef.current) {
        // Clear all layers and their markers
        Object.values(layerGroupsRef.current).forEach(layerGroup => {
          if (layerGroup) {
            layerGroup.eachLayer(layer => {
              // Remove event listeners
              layer.off();
              // Close any open popups
              if (layer.getPopup()) {
                layer.getPopup().remove();
              }
            });
            layerGroup.clearLayers();
          }
        });

        // Remove map instance
        mapInstanceRef.current.off(); // Remove all event listeners
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Clear layer groups reference
      layerGroupsRef.current = {};
    };
  }, [cityData]);

  // Update map center when city changes
  useEffect(() => {
    if (!mapInstanceRef.current || !cityData) return;
    mapInstanceRef.current.setView([cityData.lat, cityData.lng], 12);
  }, [cityData]);

  // Helper function to map classification label to layer key (memoized)
  const getOutletLayerKey = useCallback((classificationLabel) => {
    const mapping = {
      'Healthy Food Source': 'healthy',
      'Mixed Selection': 'mixed',
      'Unhealthy': 'unhealthy',
      'Unknown': 'unknown'
    };
    return mapping[classificationLabel] || 'unknown';
  }, []);

  // Helper function to create marker for outlet
  const createOutletMarker = useCallback((outlet) => {
    if (!outlet.lat || !outlet.lng) return null;

    const icon = createCustomIcon(outlet.classification.color);
    const marker = L.marker([outlet.lat, outlet.lng], { icon });

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

    return { marker, layerKey: getOutletLayerKey(outlet.classification.label) };
  }, [getOutletLayerKey]);

  // Progressive loading function for markers
  const loadMarkersProgressively = useCallback((outlets) => {
    // Clear any existing timeouts
    loadingTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    loadingTimeoutsRef.current = [];

    const totalMarkers = outlets.length;
    const useProgressiveLoading = totalMarkers > PROGRESSIVE_LOADING_CONFIG.THRESHOLD;

    if (!useProgressiveLoading) {
      // Load all markers at once for small datasets
      outlets.forEach(outlet => {
        const result = createOutletMarker(outlet);
        if (result && layerGroupsRef.current[result.layerKey]) {
          layerGroupsRef.current[result.layerKey].addLayer(result.marker);
        }
      });
      console.log(`✓ Loaded ${totalMarkers} markers directly`);
      return;
    }

    // Progressive loading for large datasets
    setIsLoadingMarkers(true);
    setMarkerLoadProgress(0);
    console.log(`⏳ Starting progressive loading of ${totalMarkers} markers...`);

    const chunks = [];
    for (let i = 0; i < totalMarkers; i += PROGRESSIVE_LOADING_CONFIG.CHUNK_SIZE) {
      chunks.push(outlets.slice(i, i + PROGRESSIVE_LOADING_CONFIG.CHUNK_SIZE));
    }

    chunks.forEach((chunk, index) => {
      const timeout = setTimeout(() => {
        chunk.forEach(outlet => {
          const result = createOutletMarker(outlet);
          if (result && layerGroupsRef.current[result.layerKey]) {
            layerGroupsRef.current[result.layerKey].addLayer(result.marker);
          }
        });

        const progress = Math.round(((index + 1) / chunks.length) * 100);
        setMarkerLoadProgress(progress);

        // If this is the last chunk
        if (index === chunks.length - 1) {
          setIsLoadingMarkers(false);
          console.log(`✓ Completed loading ${totalMarkers} markers progressively`);
        }
      }, index * PROGRESSIVE_LOADING_CONFIG.CHUNK_DELAY);

      loadingTimeoutsRef.current.push(timeout);
    });
  }, [createOutletMarker]);

  // Add food outlet markers to appropriate layers
  useEffect(() => {
    if (!mapInstanceRef.current || !foodOutlets) return;

    // Clear any pending loading operations
    loadingTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    loadingTimeoutsRef.current = [];
    setIsLoadingMarkers(false);
    setMarkerLoadProgress(0);

    // Clear all food outlet layers with proper cleanup
    ['healthy', 'mixed', 'unhealthy', 'unknown'].forEach(layer => {
      if (layerGroupsRef.current[layer]) {
        layerGroupsRef.current[layer].eachLayer(l => {
          l.off();
          if (l.getPopup()) l.getPopup().remove();
        });
        layerGroupsRef.current[layer].clearLayers();
      }
    });

    // Clear city center layer with cleanup
    if (layerGroupsRef.current.cityCenter) {
      layerGroupsRef.current.cityCenter.eachLayer(l => {
        l.off();
        if (l.getPopup()) l.getPopup().remove();
      });
      layerGroupsRef.current.cityCenter.clearLayers();
    }

    // Add city center marker
    if (cityData) {
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

      const cityMarker = L.marker([cityData.lat, cityData.lng], { icon: cityIcon });
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
              <strong>Food Outlets:</strong> ${foodOutlets.length}
            </div>
          </div>
        </div>
      `);

      layerGroupsRef.current.cityCenter.addLayer(cityMarker);
    }

    // Load food outlet markers progressively
    loadMarkersProgressively(foodOutlets);

    // Add walking radius circles for top healthy outlets
    const healthyOutlets = foodOutlets
      .filter(o => o.classification.label === 'Healthy Food Source')
      .slice(0, 5);

    healthyOutlets.forEach(outlet => {
      const circle = L.circle([outlet.lat, outlet.lng], {
        radius: 1200, // 15-minute walk at 5km/h
        fillColor: '#0d5e3a',
        fillOpacity: 0.05,
        color: '#0d5e3a',
        weight: 1,
        dashArray: '5, 5'
      });

      if (layerGroupsRef.current.healthy) {
        layerGroupsRef.current.healthy.addLayer(circle);
      }
    });

    // Cleanup function
    return () => {
      // Clear pending timeouts
      loadingTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      loadingTimeoutsRef.current = [];

      ['healthy', 'mixed', 'unhealthy', 'unknown', 'cityCenter'].forEach(layer => {
        if (layerGroupsRef.current[layer]) {
          layerGroupsRef.current[layer].eachLayer(l => {
            l.off();
            if (l.getPopup()) l.getPopup().remove();
          });
        }
      });
    };
  }, [cityData, foodOutlets, loadMarkersProgressively]);

  // Helper function to get priority color (memoized)
  const getPriorityColor = useCallback((priority) => {
    const colors = {
      CRITICAL: '#dc2626',
      HIGH: '#f97316',
      MEDIUM: '#fbbf24',
      LOW: '#84cc16'
    };
    return colors[priority] || '#6b7280';
  }, []);

  // Helper function to get service radius (memoized)
  const getServiceRadius = useCallback((type) => {
    const radii = {
      SUPERMARKET: 2000,
      FARMERS_MARKET: 1500,
      URBAN_FARM: 1000,
      MOBILE_MARKET: 800,
      FOOD_HUB: 5000,
      COMMUNITY_GARDEN: 500,
      COMMUNITY_KITCHEN: 1000,
      FOOD_PANTRY: 1500,
      VERTICAL_FARM: 1500,
      AQUAPONICS: 1000
    };
    return radii[type] || 1000;
  }, []);

  // Add optimal placement markers to appropriate layers
  useEffect(() => {
    if (!mapInstanceRef.current || !optimalPlacements) return;

    // Clear all intervention layers with proper cleanup
    const interventionTypes = [
      'SUPERMARKET', 'FARMERS_MARKET', 'MOBILE_MARKET', 'URBAN_FARM',
      'COMMUNITY_GARDEN', 'VERTICAL_FARM', 'AQUAPONICS', 'FOOD_HUB',
      'COMMUNITY_KITCHEN', 'FOOD_PANTRY'
    ];

    interventionTypes.forEach(type => {
      if (layerGroupsRef.current[type]) {
        layerGroupsRef.current[type].eachLayer(l => {
          l.off();
          if (l.getPopup()) l.getPopup().remove();
        });
        layerGroupsRef.current[type].clearLayers();
      }
    });

    // Add markers for each optimal placement
    if (optimalPlacements.placements && optimalPlacements.placements.length > 0) {
      optimalPlacements.placements.forEach((placement) => {
        // Create special icon for optimal placements
        const icon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="
            background-color: #8b5cf6;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 6px rgba(139,92,246,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: bold;
            color: white;
          ">${placement.icon || '📍'}</div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        const marker = L.marker([placement.location.lat, placement.location.lng], { icon });

        // Create detailed popup
        const popupContent = `
          <div style="min-width: 250px; max-width: 300px;">
            <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #8b5cf6; font-weight: 600;">
              ${placement.icon || '📍'} Recommended: ${placement.name || placement.type}
            </h4>
            <div style="font-size: 12px; line-height: 1.5;">
              <div style="margin-bottom: 6px; padding: 4px 8px; background: #f3f0ff; border-radius: 4px;">
                <strong>Priority:</strong> <span style="color: ${getPriorityColor(placement.priority)}">${placement.priority}</span>
              </div>
              <div style="margin-bottom: 6px;">
                <strong>Score:</strong> ${Math.round((placement.score || 0) * 100)}%
              </div>
              <div style="margin-bottom: 6px;">
                <strong>People Served:</strong> ${(placement.expectedImpact?.populationServed || 0).toLocaleString()}
              </div>
              <div style="margin-bottom: 6px;">
                <strong>Setup Cost:</strong> $${(placement.implementation?.setupCost || 0).toLocaleString()}
              </div>
              <div style="margin-bottom: 6px;">
                <strong>Timeframe:</strong> ${placement.implementation?.timeframe || 'N/A'}
              </div>
              ${placement.justification ? `
                <div style="margin-top: 8px; padding: 6px; background: #f9fafb; border-radius: 3px; border-left: 3px solid #8b5cf6;">
                  <strong style="font-size: 11px;">Why here:</strong><br>
                  <span style="font-size: 11px;">${placement.justification}</span>
                </div>
              ` : ''}
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);

        // Add service area circle
        const serviceRadius = getServiceRadius(placement.type);
        const serviceCircle = L.circle([placement.location.lat, placement.location.lng], {
          radius: serviceRadius,
          fillColor: '#8b5cf6',
          fillOpacity: 0.08,
          color: '#8b5cf6',
          weight: 2,
          dashArray: '10, 5'
        });

        // Add to appropriate intervention layer
        const layerKey = placement.type;
        if (layerGroupsRef.current[layerKey]) {
          layerGroupsRef.current[layerKey].addLayer(marker);
          layerGroupsRef.current[layerKey].addLayer(serviceCircle);
        }
      });

      console.log(`✓ Added ${optimalPlacements.placements.length} optimal placement markers to layers`);
    }

    // Cleanup function
    return () => {
      interventionTypes.forEach(type => {
        if (layerGroupsRef.current[type]) {
          layerGroupsRef.current[type].eachLayer(l => {
            l.off();
            if (l.getPopup()) l.getPopup().remove();
          });
        }
      });
    };
  }, [optimalPlacements, getPriorityColor, getServiceRadius]);

  // Render AI solution markers
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupsRef.current.ai_recommendations) return;

    const layer = layerGroupsRef.current.ai_recommendations;
    layer.eachLayer(l => {
      l.off();
      if (l.getPopup()) {
        l.getPopup().remove();
      }
    });
    layer.clearLayers();

    if (!aiSolutions?.recommendations || aiSolutions.recommendations.length === 0) {
      return;
    }

    aiSolutions.recommendations.forEach((rec, index) => {
      const { location = {}, mapLabel, priority, rationale, expectedImpact } = rec;
      if (!location.lat || !location.lng) {
        return;
      }

      const icon = L.divIcon({
        className: 'ai-recommendation-icon',
        html: `<div style="
          background: linear-gradient(135deg, #0ea5e9, #6366f1);
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 3px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(14,165,233,0.45);
          font-size: 14px;
          color: white;
          font-weight: 700;
        ">AI</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([location.lat, location.lng], { icon });

      const populationDisplay = typeof expectedImpact?.population === 'number'
        ? expectedImpact.population.toLocaleString()
        : expectedImpact?.population || null;

      const popup = `
        <div style="min-width: 240px;">
          <h4 style="margin: 0 0 6px; font-size: 14px; color: #0e7490;">
            🤖 ${rec.title || `AI Recommendation ${index + 1}`}
          </h4>
          ${priority ? `<div style="margin-bottom: 6px; font-size: 12px;"><strong>Priority:</strong> <span style="color: ${getPriorityColor(priority)};">${priority}</span></div>` : ''}
          ${mapLabel ? `<div style="margin-bottom: 6px; font-size: 12px;">${mapLabel}</div>` : ''}
          ${rationale ? `<div style="margin-bottom: 6px; font-size: 12px; color: #475569;">${rationale}</div>` : ''}
          ${expectedImpact ? `<div style="font-size: 12px; color: #1f2937;">
            <strong>Impact:</strong>
            <ul style="padding-left: 18px; margin: 4px 0;">
              ${populationDisplay ? `<li>Population reach: ${populationDisplay}</li>` : ''}
              ${expectedImpact.equityLift ? `<li>Equity lift: ${expectedImpact.equityLift}</li>` : ''}
              ${expectedImpact.timeframe ? `<li>Timeframe: ${expectedImpact.timeframe}</li>` : ''}
            </ul>
          </div>` : ''}
        </div>
      `;

      marker.bindPopup(popup);
      layer.addLayer(marker);
    });
  
    return () => {
      layer.eachLayer(l => {
        l.off();
        if (l.getPopup()) {
          l.getPopup().remove();
        }
      });
    };
  }, [aiSolutions, getPriorityColor]);

  // Handle layer visibility changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    Object.entries(visibleLayers).forEach(([layerId, isVisible]) => {
      const layer = layerGroupsRef.current[layerId];
      if (!layer) return;

      if (isVisible) {
        if (!mapInstanceRef.current.hasLayer(layer)) {
          mapInstanceRef.current.addLayer(layer);
        }
      } else {
        if (mapInstanceRef.current.hasLayer(layer)) {
          mapInstanceRef.current.removeLayer(layer);
        }
      }
    });
  }, [visibleLayers]);

  // Handle layer toggle from LayerControl (memoized)
  const handleLayerToggle = useCallback((layerId) => {
    setVisibleLayers(prev => ({
      ...prev,
      [layerId]: !prev[layerId]
    }));
  }, []);

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

      {/* Progressive Loading Indicator */}
      {isLoadingMarkers && (
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '3px solid #f3f4f6',
            borderTop: '3px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <div style={{ fontSize: '13px', color: '#495057' }}>
            Loading markers: {markerLoadProgress}%
          </div>
          <div style={{
            width: '100px',
            height: '4px',
            backgroundColor: '#e9ecef',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${markerLoadProgress}%`,
              height: '100%',
              backgroundColor: '#007bff',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
        </div>
      )}

      {/* Heat Map Layer */}
      <HeatMapLayer
        mapInstance={mapInstanceRef.current}
        foodOutlets={foodOutlets}
        optimalPlacements={optimalPlacements}
        visibleLayers={visibleLayers}
      />

      {/* Layer Control */}
      <LayerControl
        visibleLayers={visibleLayers}
        onLayerToggle={handleLayerToggle}
      />

      {/* CSS for animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default Map;

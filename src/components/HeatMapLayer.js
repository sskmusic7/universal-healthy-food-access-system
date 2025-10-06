// HeatMapLayer.js - Heat map visualization for topological layer density
// Creates territory/zone maps with color-coded entity types (food outlets vs interventions)

import { useEffect, useMemo, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet.heat';

/**
 * HeatMapLayer Component
 *
 * Renders heat map overlays showing density zones for different entity types.
 * Color coordination: Food outlets (green/yellow/red) vs Intervention locations (purple)
 *
 * @param {Object} mapInstance - Leaflet map instance
 * @param {Array} foodOutlets - Array of food outlet locations with classifications
 * @param {Object} optimalPlacements - Optimal intervention locations
 * @param {Object} visibleLayers - Layer visibility state
 * @param {Object} heatMapConfig - Heat map configuration options
 */
function HeatMapLayer(props = {}) {
  const {
    mapInstance = null,
    foodOutlets = [],
    optimalPlacements = null,
    visibleLayers = {},
    heatMapConfig = {}
  } = props;
  // Default configuration with increased opacity for better visibility (memoized)
  const defaultConfig = useMemo(() => ({
    radius: 30,
    blur: 20,
    maxZoom: 17,
    max: 1.0,
    minOpacity: 0.3, // Increased for better visibility
    gradient: {
      // Vibrant green gradient with enhanced visibility
      healthy: {
        0.0: 'rgba(16, 185, 129, 0.25)',   // Low density now visible
        0.1: 'rgba(16, 185, 129, 0.35)',   // Subtle presence
        0.2: 'rgba(16, 185, 129, 0.5)',    // Light to moderate
        0.4: 'rgba(16, 185, 129, 0.65)',   // Moderate density
        0.6: 'rgba(5, 150, 105, 0.8)',     // High density
        0.8: 'rgba(4, 120, 87, 0.9)',      // Very high density
        1.0: 'rgba(6, 78, 59, 0.95)'       // Maximum density
      },
      // Vibrant amber/orange gradient with enhanced visibility
      mixed: {
        0.0: 'rgba(251, 191, 36, 0.25)',
        0.1: 'rgba(251, 191, 36, 0.35)',
        0.2: 'rgba(251, 191, 36, 0.5)',
        0.4: 'rgba(251, 191, 36, 0.65)',
        0.6: 'rgba(245, 158, 11, 0.8)',
        0.8: 'rgba(217, 119, 6, 0.9)',
        1.0: 'rgba(180, 83, 9, 0.95)'
      },
      // Vibrant red gradient with enhanced visibility
      unhealthy: {
        0.0: 'rgba(239, 68, 68, 0.25)',
        0.1: 'rgba(239, 68, 68, 0.35)',
        0.2: 'rgba(239, 68, 68, 0.5)',
        0.4: 'rgba(239, 68, 68, 0.65)',
        0.6: 'rgba(220, 38, 38, 0.8)',
        0.8: 'rgba(185, 28, 28, 0.9)',
        1.0: 'rgba(127, 29, 29, 0.95)'
      },
      // Blue-gray gradient with enhanced visibility
      unknown: {
        0.0: 'rgba(148, 163, 184, 0.25)',
        0.1: 'rgba(148, 163, 184, 0.3)',
        0.2: 'rgba(148, 163, 184, 0.45)',
        0.4: 'rgba(148, 163, 184, 0.6)',
        0.6: 'rgba(100, 116, 139, 0.75)',
        0.8: 'rgba(71, 85, 105, 0.85)',
        1.0: 'rgba(51, 65, 85, 0.9)'
      },
      // Vibrant purple/magenta gradient with enhanced visibility
      intervention: {
        0.0: 'rgba(168, 85, 247, 0.25)',
        0.1: 'rgba(168, 85, 247, 0.35)',
        0.2: 'rgba(168, 85, 247, 0.5)',
        0.4: 'rgba(168, 85, 247, 0.65)',
        0.6: 'rgba(147, 51, 234, 0.8)',
        0.8: 'rgba(126, 34, 206, 0.9)',
        1.0: 'rgba(107, 33, 168, 0.95)'
      }
    }
  }), []);

  const config = useMemo(() => ({ ...defaultConfig, ...heatMapConfig }), [defaultConfig, heatMapConfig]);

  useEffect(() => {
    if (!mapInstance || !foodOutlets) return;

    // Store heat layer references
    const heatLayers = {
      healthy: null,
      mixed: null,
      unhealthy: null,
      unknown: null,
      intervention: null
    };

    // Helper function to map classification label to layer key
    const getOutletLayerKey = (classificationLabel) => {
      const mapping = {
        'Healthy Food Source': 'healthy',
        'Mixed Selection': 'mixed',
        'Unhealthy': 'unhealthy',
        'Unknown': 'unknown'
      };
      return mapping[classificationLabel] || 'unknown';
    };

    // Create heat map data for food outlets by classification
    const createHeatMapData = (outlets, classification) => {
      return outlets
        .filter(outlet => {
          const layerKey = getOutletLayerKey(outlet.classification.label);
          return layerKey === classification && outlet.lat && outlet.lng;
        })
        .map(outlet => {
          // Weight by classification score (higher score = more intense)
          const weight = outlet.classification.score / 100;
          return [outlet.lat, outlet.lng, weight];
        });
    };

    // Create heat layers for each food outlet type
    const classifications = ['healthy', 'mixed', 'unhealthy', 'unknown'];

    classifications.forEach(classification => {
      if (!visibleLayers[`heatmap_${classification}`]) return;

      const heatData = createHeatMapData(foodOutlets, classification);

      if (heatData.length > 0) {
        const heatLayer = L.heatLayer(heatData, {
          radius: config.radius,
          blur: config.blur,
          maxZoom: config.maxZoom,
          max: config.max,
          minOpacity: config.minOpacity,
          gradient: config.gradient[classification]
        });

        heatLayers[classification] = heatLayer;
        heatLayer.addTo(mapInstance);

        // Apply glassmorphism effect to the heat layer canvas
        applyGlassmorphism(mapInstance, classification);

        console.log(`✓ Added ${classification} heat map layer with ${heatData.length} points (glassmorphism applied)`);
      }
    });

    // Create heat map for intervention locations
    if (visibleLayers.heatmap_intervention && optimalPlacements?.placements) {
      const interventionData = optimalPlacements.placements
        .filter(p => p.location?.lat && p.location?.lng)
        .map(placement => {
          // Weight by score and priority
          const priorityWeights = { CRITICAL: 1.0, HIGH: 0.8, MEDIUM: 0.6, LOW: 0.4 };
          const weight = (placement.score || 0.5) * (priorityWeights[placement.priority] || 0.5);
          return [placement.location.lat, placement.location.lng, weight];
        });

      if (interventionData.length > 0) {
        const interventionLayer = L.heatLayer(interventionData, {
          radius: config.radius * 1.5, // Larger radius for interventions
          blur: config.blur * 1.3,
          maxZoom: config.maxZoom,
          max: config.max,
          minOpacity: config.minOpacity * 1.2,
          gradient: config.gradient.intervention
        });

        heatLayers.intervention = interventionLayer;
        interventionLayer.addTo(mapInstance);

        // Apply glassmorphism effect
        applyGlassmorphism(mapInstance, 'intervention');

        console.log(`✓ Added intervention heat map layer with ${interventionData.length} points (glassmorphism applied)`);
      }
    }

    // Cleanup function - remove all heat layers and canvas elements on unmount or dependency change
    return () => {
      // Remove heat layers
      Object.values(heatLayers).forEach(layer => {
        if (layer && mapInstance.hasLayer(layer)) {
          mapInstance.removeLayer(layer);
        }
      });

      // Clean up canvas elements and remove styles
      const canvasElements = mapInstance.getContainer().querySelectorAll('canvas');
      canvasElements.forEach(canvas => {
        const parent = canvas.parentElement;
        if (parent && parent.classList.contains('leaflet-overlay-pane')) {
          // Remove applied styles
          canvas.style.mixBlendMode = '';
          canvas.style.filter = '';
          canvas.style.pointerEvents = '';
        }
      });

      // Clear heat layer references
      Object.keys(heatLayers).forEach(key => {
        heatLayers[key] = null;
      });
    };

    // Helper function to apply glassmorphism effect to heat map canvas
    function applyGlassmorphism(map, layerType) {
      // Wait for canvas to be created
      setTimeout(() => {
        const canvasElements = map.getContainer().querySelectorAll('canvas');

        // Find the heat map canvas (not the tile layer canvas)
        canvasElements.forEach(canvas => {
          // Check if this is a heat map canvas (has specific positioning)
          const parent = canvas.parentElement;
          if (parent && parent.classList.contains('leaflet-overlay-pane')) {
            // Apply subtle glassmorphism effects that don't blur the base map
            canvas.style.mixBlendMode = 'multiply'; // Blend with map without blurring
            canvas.style.filter = 'contrast(1.15) brightness(1.05)'; // Subtle enhancement

            // NO backdrop-filter to avoid blurring the map underneath
            // The opacity is already handled by the gradient ramping

            // Add very subtle glow only for high-density areas (applied to canvas edge)
            const glowColors = {
              healthy: 'rgba(16, 185, 129, 0.15)',
              mixed: 'rgba(251, 191, 36, 0.15)',
              unhealthy: 'rgba(239, 68, 68, 0.15)',
              unknown: 'rgba(148, 163, 184, 0.1)',
              intervention: 'rgba(168, 85, 247, 0.15)'
            };

            // Very subtle shadow/glow that doesn't affect map readability
            canvas.style.filter = `contrast(1.15) brightness(1.05) drop-shadow(0 0 8px ${glowColors[layerType] || 'rgba(255,255,255,0.05)'})`;

            // Add pointer-events: none to ensure map interactions work properly
            canvas.style.pointerEvents = 'none';
          }
        });
      }, 100);
    }
  }, [mapInstance, foodOutlets, optimalPlacements, visibleLayers, config]);

  // This component doesn't render anything itself - it just manages Leaflet layers
  return null;
}

export default HeatMapLayer;

// MapZoneShading.js - Zone Shading Layer Component
// Implements zone shading technique for food deserts and intervention sites

import L from 'leaflet';

class MapZoneShading {
  constructor(mapInstance) {
    this.map = mapInstance;
    this.zoneLayers = new Map();
    this.overlayLayers = new Map();
    this.controlLayers = null;
    this.isInitialized = false;
  }

  /**
   * Initialize zone shading system
   */
  initialize() {
    if (this.isInitialized) return;
    
    // Create layer control
    this.controlLayers = L.control.layers(null, null, {
      position: 'topright',
      collapsed: false
    }).addTo(this.map);
    
    this.isInitialized = true;
  }

  /**
   * Add food desert zones with shading
   * @param {Array} foodDeserts - Food desert analysis data
   * @param {Object} cityBounds - City bounding box
   */
  addFoodDesertZones(foodDeserts, cityBounds) {
    if (!foodDeserts || !cityBounds) return;

    // Clear existing food desert layers
    this.clearZoneLayer('foodDeserts');

    const zones = this.processFoodDesertData(foodDeserts, cityBounds);
    
    zones.forEach((zone, index) => {
      const zoneLayer = this.createZonePolygon(zone, {
        color: this.getFoodDesertColor(zone.classification),
        fillColor: this.getFoodDesertColor(zone.classification),
        fillOpacity: 0.3,
        weight: 2,
        opacity: 0.8,
        className: 'food-desert-zone'
      });

      // Add popup with zone information
      zoneLayer.bindPopup(this.createFoodDesertPopup(zone));
      
      // Add to map and layer control
      zoneLayer.addTo(this.map);
      this.zoneLayers.set(`foodDesert_${index}`, zoneLayer);
      this.controlLayers.addOverlay(zoneLayer, `Food Desert: ${zone.classification}`);
    });
  }

  /**
   * Add intervention site zones with shading
   * @param {Array} interventionSites - Intervention site analysis data
   * @param {Object} cityBounds - City bounding box
   */
  addInterventionSiteZones(interventionSites, cityBounds) {
    if (!interventionSites || !cityBounds) return;

    // Clear existing intervention layers
    this.clearZoneLayer('interventionSites');

    const zones = this.processInterventionSiteData(interventionSites, cityBounds);
    
    zones.forEach((zone, index) => {
      const zoneLayer = this.createZonePolygon(zone, {
        color: this.getInterventionSiteColor(zone.type),
        fillColor: this.getInterventionSiteColor(zone.type),
        fillOpacity: 0.25,
        weight: 2,
        opacity: 0.7,
        className: 'intervention-site-zone'
      });

      // Add popup with zone information
      zoneLayer.bindPopup(this.createInterventionSitePopup(zone));
      
      // Add to map and layer control
      zoneLayer.addTo(this.map);
      this.zoneLayers.set(`interventionSite_${index}`, zoneLayer);
      this.controlLayers.addOverlay(zoneLayer, `${zone.type}: ${zone.name}`);
    });
  }

  /**
   * Add overlap conflict zones
   * @param {Array} overlaps - Overlap analysis data
   * @param {Object} cityBounds - City bounding box
   */
  addOverlapZones(overlaps, cityBounds) {
    if (!overlaps || !cityBounds) return;

    // Clear existing overlap layers
    this.clearZoneLayer('overlaps');

    const zones = this.processOverlapData(overlaps, cityBounds);
    
    zones.forEach((zone, index) => {
      const zoneLayer = this.createZonePolygon(zone, {
        color: this.getOverlapColor(zone.conflictType),
        fillColor: this.getOverlapColor(zone.conflictType),
        fillOpacity: 0.2,
        weight: 3,
        opacity: 0.9,
        dashArray: '10, 5',
        className: 'overlap-zone'
      });

      // Add popup with conflict information
      zoneLayer.bindPopup(this.createOverlapPopup(zone));
      
      // Add to map and layer control
      zoneLayer.addTo(this.map);
      this.zoneLayers.set(`overlap_${index}`, zoneLayer);
      this.controlLayers.addOverlay(zoneLayer, `Conflict: ${zone.conflictType}`);
    });
  }

  /**
   * Process food desert data into zone polygons
   */
  processFoodDesertData(foodDeserts, cityBounds) {
    const zones = [];
    
    if (foodDeserts.gridAnalysis && foodDeserts.gridAnalysis.length > 0) {
      foodDeserts.gridAnalysis.forEach((cell, index) => {
        if (cell.accessScore !== undefined) {
          zones.push({
            id: `fd_${index}`,
            name: `Food Desert Zone ${index + 1}`,
            classification: cell.classification,
            accessScore: cell.accessScore,
            confidence: cell.confidence,
            factors: cell.factors,
            bounds: this.createCellBounds(cell.lat, cell.lng, cityBounds),
            lat: cell.lat,
            lng: cell.lng,
            type: 'foodDesert'
          });
        }
      });
    }
    
    return zones;
  }

  /**
   * Process intervention site data into zone polygons
   */
  processInterventionSiteData(interventionSites, cityBounds) {
    const zones = [];
    
    if (interventionSites.sites && interventionSites.sites.length > 0) {
      interventionSites.sites.forEach((site, index) => {
        zones.push({
          id: `is_${index}`,
          name: site.name || `${site.type} Site ${index + 1}`,
          type: site.type,
          score: site.score,
          suitability: site.suitability,
          factors: site.factors,
          bounds: this.createSiteBounds(site.lat, site.lng, site.type),
          lat: site.lat,
          lng: site.lng,
          interventionType: 'interventionSite'
        });
      });
    }
    
    return zones;
  }

  /**
   * Process overlap data into zone polygons
   */
  processOverlapData(overlaps, cityBounds) {
    const zones = [];
    
    if (overlaps.conflictZones && overlaps.conflictZones.length > 0) {
      overlaps.conflictZones.forEach((conflict, index) => {
        zones.push({
          id: `ov_${index}`,
          name: `Conflict Zone ${index + 1}`,
          conflictType: conflict.type,
          severity: conflict.severity,
          affectedSites: conflict.affectedSites,
          resolution: conflict.resolution,
          bounds: this.createConflictBounds(conflict.lat, conflict.lng, cityBounds),
          lat: conflict.lat,
          lng: conflict.lng,
          overlapType: 'overlap'
        });
      });
    }
    
    return zones;
  }

  /**
   * Create zone polygon from bounds
   */
  createZonePolygon(zone, style) {
    const polygon = L.polygon(zone.bounds, style);
    
    // Add hover effects
    polygon.on('mouseover', function(e) {
      this.setStyle({
        fillOpacity: 0.4,
        weight: 3
      });
    });
    
    polygon.on('mouseout', function(e) {
      this.setStyle({
        fillOpacity: style.fillOpacity,
        weight: style.weight
      });
    });
    
    return polygon;
  }

  /**
   * Create bounds for grid cell
   */
  createCellBounds(lat, lng, cityBounds) {
    const cellSize = 0.01; // ~1km grid cell
    return [
      [lat - cellSize/2, lng - cellSize/2],
      [lat + cellSize/2, lng - cellSize/2],
      [lat + cellSize/2, lng + cellSize/2],
      [lat - cellSize/2, lng + cellSize/2]
    ];
  }

  /**
   * Create bounds for intervention site
   */
  createSiteBounds(lat, lng, type) {
    const radius = this.getSiteRadius(type);
    return [
      [lat - radius, lng - radius],
      [lat + radius, lng - radius],
      [lat + radius, lng + radius],
      [lat - radius, lng + radius]
    ];
  }

  /**
   * Create bounds for conflict zone
   */
  createConflictBounds(lat, lng, cityBounds) {
    const radius = 0.005; // ~500m conflict zone
    return [
      [lat - radius, lng - radius],
      [lat + radius, lng - radius],
      [lat + radius, lng + radius],
      [lat - radius, lng + radius]
    ];
  }

  /**
   * Get site radius based on intervention type
   */
  getSiteRadius(type) {
    const radii = {
      'urban_farm': 0.003,      // ~300m
      'supermarket': 0.002,     // ~200m
      'farmers_market': 0.001,  // ~100m
      'mobile_market': 0.001,   // ~100m
      'food_hub': 0.002         // ~200m
    };
    return radii[type] || 0.002;
  }

  /**
   * Get color for food desert classification
   */
  getFoodDesertColor(classification) {
    const colors = {
      'Critical': '#dc2626',      // Red
      'Severe': '#ea580c',        // Orange
      'Moderate': '#fbbf24',      // Yellow
      'Good': '#10b981',          // Green
      'Excellent': '#059669'      // Dark Green
    };
    return colors[classification] || '#6b7280';
  }

  /**
   * Get color for intervention site type
   */
  getInterventionSiteColor(type) {
    const colors = {
      'urban_farm': '#16a34a',      // Green
      'supermarket': '#2563eb',     // Blue
      'farmers_market': '#7c3aed',  // Purple
      'mobile_market': '#dc2626',   // Red
      'food_hub': '#ea580c'         // Orange
    };
    return colors[type] || '#6b7280';
  }

  /**
   * Get color for overlap conflict type
   */
  getOverlapColor(conflictType) {
    const colors = {
      'Urban Farm + Water Scarcity': '#ef4444',      // Red
      'Urban Farm + Heat Barrier': '#f97316',        // Orange
      'Supermarket + Delivery Hub': '#3b82f6',       // Blue
      'Food Desert + Heat Barrier': '#dc2626',       // Dark Red
      'Supermarket + Urban Farm': '#8b5cf6',         // Purple
      'Strategic Multi-Use Zones': '#10b981'         // Green
    };
    return colors[conflictType] || '#6b7280';
  }

  /**
   * Create popup for food desert zone
   */
  createFoodDesertPopup(zone) {
    return `
      <div style="min-width: 250px;">
        <h4 style="margin: 0 0 8px 0; color: #dc2626;">
          ${zone.name}
        </h4>
        <div style="font-size: 12px; line-height: 1.4;">
          <div style="margin-bottom: 4px;">
            <strong>Classification:</strong> 
            <span style="color: ${this.getFoodDesertColor(zone.classification)};">
              ${zone.classification}
            </span>
          </div>
          <div style="margin-bottom: 4px;">
            <strong>Access Score:</strong> ${zone.accessScore}/100
          </div>
          <div style="margin-bottom: 4px;">
            <strong>Confidence:</strong> ${zone.confidence}%
          </div>
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
            <strong>Factors:</strong>
            <ul style="margin: 4px 0; padding-left: 16px;">
              <li>Distance: ${zone.factors?.distance || 'N/A'}</li>
              <li>Heat Penalty: ${zone.factors?.heatPenalty || 'N/A'}</li>
              <li>Demand: ${zone.factors?.demand || 'N/A'}</li>
              <li>Deprivation: ${zone.factors?.deprivation || 'N/A'}</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create popup for intervention site zone
   */
  createInterventionSitePopup(zone) {
    return `
      <div style="min-width: 250px;">
        <h4 style="margin: 0 0 8px 0; color: ${this.getInterventionSiteColor(zone.type)};">
          ${zone.name}
        </h4>
        <div style="font-size: 12px; line-height: 1.4;">
          <div style="margin-bottom: 4px;">
            <strong>Type:</strong> ${zone.type.replace('_', ' ').toUpperCase()}
          </div>
          <div style="margin-bottom: 4px;">
            <strong>Score:</strong> ${zone.score}/100
          </div>
          <div style="margin-bottom: 4px;">
            <strong>Suitability:</strong> ${zone.suitability}
          </div>
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
            <strong>Factors:</strong>
            <ul style="margin: 4px 0; padding-left: 16px;">
              <li>NDVI: ${zone.factors?.ndvi || 'N/A'}</li>
              <li>Solar: ${zone.factors?.solar || 'N/A'}</li>
              <li>Population: ${zone.factors?.population || 'N/A'}</li>
              <li>Access: ${zone.factors?.access || 'N/A'}</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create popup for overlap zone
   */
  createOverlapPopup(zone) {
    return `
      <div style="min-width: 250px;">
        <h4 style="margin: 0 0 8px 0; color: ${this.getOverlapColor(zone.conflictType)};">
          ${zone.name}
        </h4>
        <div style="font-size: 12px; line-height: 1.4;">
          <div style="margin-bottom: 4px;">
            <strong>Conflict Type:</strong> ${zone.conflictType}
          </div>
          <div style="margin-bottom: 4px;">
            <strong>Severity:</strong> ${zone.severity}
          </div>
          <div style="margin-bottom: 4px;">
            <strong>Affected Sites:</strong> ${zone.affectedSites?.length || 0}
          </div>
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
            <strong>Resolution:</strong>
            <p style="margin: 4px 0; font-size: 11px;">
              ${zone.resolution || 'No resolution available'}
            </p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Clear specific zone layer type
   */
  clearZoneLayer(type) {
    this.zoneLayers.forEach((layer, key) => {
      if (key.startsWith(type)) {
        this.map.removeLayer(layer);
        this.controlLayers.removeLayer(layer);
        this.zoneLayers.delete(key);
      }
    });
  }

  /**
   * Clear all zone layers
   */
  clearAllZones() {
    this.zoneLayers.forEach((layer) => {
      this.map.removeLayer(layer);
    });
    this.zoneLayers.clear();
    
    if (this.controlLayers) {
      this.controlLayers.remove();
      this.controlLayers = null;
    }
  }

  /**
   * Toggle zone layer visibility
   */
  toggleZoneLayer(type, visible) {
    this.zoneLayers.forEach((layer, key) => {
      if (key.startsWith(type)) {
        if (visible) {
          layer.addTo(this.map);
        } else {
          this.map.removeLayer(layer);
        }
      }
    });
  }

  /**
   * Update zone data
   */
  updateZones(analysisData, cityBounds) {
    if (!analysisData || !cityBounds) return;

    // Clear existing zones
    this.clearAllZones();
    
    // Reinitialize
    this.initialize();

    // Add new zones
    if (analysisData.foodDeserts) {
      this.addFoodDesertZones(analysisData.foodDeserts, cityBounds);
    }
    
    if (analysisData.interventionSites) {
      this.addInterventionSiteZones(analysisData.interventionSites, cityBounds);
    }
    
    if (analysisData.overlapAnalysis) {
      this.addOverlapZones(analysisData.overlapAnalysis, cityBounds);
    }
  }

  /**
   * Destroy zone shading system
   */
  destroy() {
    this.clearAllZones();
    this.isInitialized = false;
  }
}

export default MapZoneShading;

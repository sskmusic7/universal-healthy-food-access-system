// isochroneGenerator.js - Accessibility analysis through isochrone generation
// Generates walking/driving time polygons to analyze food outlet reachability

import axios from 'axios';

// OpenRouteService API for isochrone generation
const ORS_API_BASE = 'https://api.openrouteservice.org/v2/isochrones';

/**
 * Generate isochrones (time-based accessibility polygons) for locations
 * @param {Array} locations - Array of {lat, lng} points
 * @param {Object} options - Configuration options
 * @returns {Object} Isochrone polygons and accessibility metrics
 */
export async function generateIsochrones(locations, options = {}) {
  const {
    profile = 'foot-walking', // foot-walking, driving-car, cycling-regular
    intervals = [300, 600, 900], // 5, 10, 15 minutes in seconds
    apiKey = process.env.REACT_APP_ORS_API_KEY
  } = options;

  try {
    if (!apiKey) {
      console.warn('OpenRouteService API key not found, using estimated isochrones');
      return generateEstimatedIsochrones(locations, intervals);
    }

    console.log(`🗺️ Generating ${profile} isochrones for ${locations.length} locations...`);

    const isochrones = await Promise.all(
      locations.map(location => generateSingleIsochrone(location, profile, intervals, apiKey))
    );

    return {
      isochrones: isochrones.filter(iso => iso !== null),
      profile,
      intervals,
      generated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Isochrone generation failed:', error);
    return generateEstimatedIsochrones(locations, intervals);
  }
}

/**
 * Generate isochrone for a single location
 */
async function generateSingleIsochrone(location, profile, intervals, apiKey) {
  try {
    const response = await axios.post(
      `${ORS_API_BASE}/${profile}`,
      {
        locations: [[location.lng, location.lat]],
        range: intervals,
        range_type: 'time'
      },
      {
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    const features = response.data.features;

    return {
      location,
      polygons: features.map(feature => ({
        time: feature.properties.value, // seconds
        coordinates: feature.geometry.coordinates[0],
        area: calculatePolygonArea(feature.geometry.coordinates[0])
      })),
      profile
    };
  } catch (error) {
    console.warn(`Failed to generate isochrone for location ${location.lat},${location.lng}:`, error.message);
    return generateCircularIsochrone(location, intervals, profile);
  }
}

/**
 * Generate estimated circular isochrones when API unavailable
 */
function generateEstimatedIsochrones(locations, intervals) {
  console.log('📍 Using circular approximation for isochrones');

  const isochrones = locations.map(location =>
    generateCircularIsochrone(location, intervals, 'foot-walking')
  );

  return {
    isochrones,
    profile: 'estimated',
    intervals,
    isEstimated: true,
    generated: new Date().toISOString()
  };
}

/**
 * Generate circular isochrone approximation
 */
function generateCircularIsochrone(location, intervals, profile) {
  // Walking speed: ~5 km/h = 1.4 m/s
  // Driving speed: ~40 km/h = 11 m/s
  // Cycling speed: ~15 km/h = 4.2 m/s
  const speeds = {
    'foot-walking': 1.4,
    'driving-car': 11,
    'cycling-regular': 4.2
  };

  const speed = speeds[profile] || 1.4;

  const polygons = intervals.map(timeSeconds => {
    const radius = speed * timeSeconds; // meters
    const coordinates = generateCircleCoordinates(location, radius);

    return {
      time: timeSeconds,
      coordinates,
      area: Math.PI * radius * radius,
      isEstimated: true
    };
  });

  return {
    location,
    polygons,
    profile,
    isEstimated: true
  };
}

/**
 * Generate circle coordinates for a given radius
 */
function generateCircleCoordinates(center, radiusMeters, points = 32) {
  const coords = [];
  const R = 6371000; // Earth's radius in meters

  for (let i = 0; i <= points; i++) {
    const bearing = (i * 360) / points;
    const point = destinationPoint(center, radiusMeters, bearing, R);
    coords.push([point.lng, point.lat]);
  }

  return coords;
}

/**
 * Calculate destination point given distance and bearing
 */
function destinationPoint(origin, distance, bearing, R) {
  const δ = distance / R;
  const θ = bearing * Math.PI / 180;

  const φ1 = origin.lat * Math.PI / 180;
  const λ1 = origin.lng * Math.PI / 180;

  const φ2 = Math.asin(
    Math.sin(φ1) * Math.cos(δ) +
    Math.cos(φ1) * Math.sin(δ) * Math.cos(θ)
  );

  const λ2 = λ1 + Math.atan2(
    Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
    Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2)
  );

  return {
    lat: φ2 * 180 / Math.PI,
    lng: λ2 * 180 / Math.PI
  };
}

/**
 * Calculate polygon area (approximate)
 */
function calculatePolygonArea(coordinates) {
  if (!coordinates || coordinates.length < 3) return 0;

  let area = 0;
  const R = 6371000; // Earth's radius in meters

  for (let i = 0; i < coordinates.length - 1; i++) {
    const p1 = coordinates[i];
    const p2 = coordinates[i + 1];

    area += (p2[0] - p1[0]) * (2 + Math.sin(p1[1] * Math.PI / 180) + Math.sin(p2[1] * Math.PI / 180));
  }

  area = Math.abs(area * R * R / 2);
  return area;
}

/**
 * Check if a point is within an isochrone polygon
 */
export function isPointInIsochrone(point, isochrone, timeThreshold) {
  // Find the polygon for the given time threshold
  const polygon = isochrone.polygons.find(p => p.time === timeThreshold);
  if (!polygon) return false;

  return isPointInPolygon(point, polygon.coordinates);
}

/**
 * Point-in-polygon test using ray casting algorithm
 */
function isPointInPolygon(point, polygonCoords) {
  const x = point.lng;
  const y = point.lat;
  let inside = false;

  for (let i = 0, j = polygonCoords.length - 1; i < polygonCoords.length; j = i++) {
    const xi = polygonCoords[i][0];
    const yi = polygonCoords[i][1];
    const xj = polygonCoords[j][0];
    const yj = polygonCoords[j][1];

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Calculate accessibility score for a location based on nearby outlets
 */
export function calculateAccessibilityScore(location, outlets, isochrones, timeThreshold = 900) {
  // Count outlets accessible within time threshold
  let accessibleOutlets = 0;
  let healthyAccessibleOutlets = 0;

  outlets.forEach(outlet => {
    // Check if outlet is within any isochrone's time threshold
    const accessible = isochrones.some(iso => {
      // Simple distance check if no isochrone data
      if (!iso || !iso.polygons) {
        const distance = haversineDistance(location, outlet);
        const walkingSpeed = 1.4; // m/s
        const timeToReach = distance / walkingSpeed;
        return timeToReach <= timeThreshold;
      }

      return isPointInIsochrone(outlet, iso, timeThreshold);
    });

    if (accessible) {
      accessibleOutlets++;
      if (outlet.classification === 'healthy_primary') {
        healthyAccessibleOutlets++;
      }
    }
  });

  // Score based on accessible outlets
  const accessScore = Math.min(100, (accessibleOutlets / 5) * 100);
  const healthyScore = Math.min(100, (healthyAccessibleOutlets / 3) * 100);

  return {
    totalAccessible: accessibleOutlets,
    healthyAccessible: healthyAccessibleOutlets,
    accessScore,
    healthyScore,
    combinedScore: (accessScore * 0.4 + healthyScore * 0.6),
    isFoodDesert: healthyAccessibleOutlets === 0
  };
}

/**
 * Detect food deserts using isochrone-based accessibility
 */
export function detectFoodDesertsWithIsochrones(populationGrid, outlets, timeThreshold = 900) {
  const foodDeserts = [];
  const borderline = [];
  const adequate = [];

  populationGrid.forEach(cell => {
    // Generate quick circular isochrone for cell
    const cellIsochrone = generateCircularIsochrone(cell.center, [timeThreshold], 'foot-walking');

    // Check accessibility
    const accessibility = calculateAccessibilityScore(
      cell.center,
      outlets,
      [cellIsochrone],
      timeThreshold
    );

    const cellData = {
      ...cell,
      accessibility
    };

    if (accessibility.healthyAccessible === 0) {
      foodDeserts.push(cellData);
    } else if (accessibility.healthyAccessible <= 1) {
      borderline.push(cellData);
    } else {
      adequate.push(cellData);
    }
  });

  return {
    foodDeserts,
    borderline,
    adequate,
    summary: {
      totalCells: populationGrid.length,
      desertCells: foodDeserts.length,
      borderlineCells: borderline.length,
      adequateCells: adequate.length,
      desertPercentage: (foodDeserts.length / populationGrid.length) * 100,
      populationInDeserts: foodDeserts.reduce((sum, cell) => sum + cell.population, 0)
    }
  };
}

/**
 * Calculate walking time between two points
 */
export function estimateWalkingTime(point1, point2, walkingSpeed = 1.4) {
  const distance = haversineDistance(point1, point2);
  return distance / walkingSpeed; // seconds
}

/**
 * Calculate driving time between two points
 */
export function estimateDrivingTime(point1, point2, drivingSpeed = 11) {
  const distance = haversineDistance(point1, point2);
  return distance / drivingSpeed; // seconds
}

/**
 * Haversine distance calculation
 */
function haversineDistance(point1, point2) {
  const R = 6371000; // Earth's radius in meters
  const φ1 = point1.lat * Math.PI / 180;
  const φ2 = point2.lat * Math.PI / 180;
  const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
  const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Batch generate isochrones with rate limiting
 */
export async function batchGenerateIsochrones(locations, options = {}, batchSize = 5) {
  const { delays = 1000 } = options;
  const results = [];

  for (let i = 0; i < locations.length; i += batchSize) {
    const batch = locations.slice(i, i + batchSize);
    const batchResults = await generateIsochrones(batch, options);
    results.push(...batchResults.isochrones);

    // Rate limiting delay
    if (i + batchSize < locations.length) {
      await new Promise(resolve => setTimeout(resolve, delays));
    }
  }

  return {
    isochrones: results,
    profile: options.profile || 'foot-walking',
    intervals: options.intervals || [300, 600, 900],
    generated: new Date().toISOString()
  };
}

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  generateIsochrones,
  calculateAccessibilityScore,
  detectFoodDesertsWithIsochrones,
  estimateWalkingTime,
  estimateDrivingTime,
  isPointInIsochrone
};

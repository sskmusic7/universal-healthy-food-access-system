// accessMetrics.js - Population-weighted food access scoring and food desert detection
// Implements spatial analysis for accurate food accessibility measurement

/**
 * Calculate population-weighted food access score
 * @param {Array} outlets - Food outlets with classifications
 * @param {Object} cityData - City information including bounding box
 * @param {Object} populationData - Optional population density data
 * @returns {Object} Comprehensive access analysis with grid cells
 */
export function calculateWeightedFoodAccess(outlets, cityData, populationData = null) {
  if (!outlets || outlets.length === 0) {
    return {
      overallScore: 0,
      gridAnalysis: [],
      foodDeserts: [],
      statistics: {}
    };
  }

  // Create analysis grid
  const gridSize = 0.01; // Approximately 1km cells
  const grid = createGrid(cityData.boundingBox, gridSize);

  // Analyze each grid cell
  const gridAnalysis = grid.map(cell => {
    const cellAnalysis = analyzeCellAccess(cell, outlets, populationData);
    return {
      ...cell,
      ...cellAnalysis,
      foodDesert: cellAnalysis.accessScore < 20,
      interventionPriority: calculateInterventionPriority(cellAnalysis)
    };
  });

  // Calculate overall weighted score
  const totalPopulation = gridAnalysis.reduce((sum, cell) => sum + cell.population, 0);
  const weightedScore = gridAnalysis.reduce((sum, cell) =>
    sum + (cell.accessScore * cell.population), 0) / (totalPopulation || 1);

  // Identify food deserts
  const foodDeserts = gridAnalysis.filter(cell => cell.foodDesert);

  return {
    overallScore: Math.round(weightedScore),
    gridAnalysis,
    foodDeserts,
    statistics: generateStatistics(gridAnalysis, outlets),
    recommendations: generateAccessRecommendations(gridAnalysis, foodDeserts)
  };
}

/**
 * Detect food deserts using multiple criteria
 * @param {Array} outlets - Food outlets
 * @param {Object} cityData - City information
 * @param {Number} thresholdMeters - Distance threshold for food desert (default 1000m)
 * @returns {Object} Food desert analysis
 */
export function detectFoodDeserts(outlets, cityData, thresholdMeters = 1000) {
  const grid = createGrid(cityData.boundingBox, 0.005); // ~500m cells for finer resolution

  const desertAnalysis = grid.map(cell => {
    const healthyOutlets = outlets.filter(o => o.classification.score >= 0.7);
    const nearestHealthy = findNearestOutlet(cell.center, healthyOutlets);

    const isDesert = !nearestHealthy || nearestHealthy.distance > thresholdMeters;

    return {
      ...cell,
      isDesert,
      nearestHealthyDistance: nearestHealthy?.distance || Infinity,
      nearestHealthyOutlet: nearestHealthy?.outlet || null,
      severity: calculateDesertSeverity(nearestHealthy?.distance, cell)
    };
  });

  // Cluster adjacent desert cells into contiguous zones
  const desertZones = clusterDesertCells(desertAnalysis.filter(c => c.isDesert));

  return {
    cells: desertAnalysis,
    zones: desertZones,
    statistics: {
      totalDesertCells: desertAnalysis.filter(c => c.isDesert).length,
      percentageDesert: (desertAnalysis.filter(c => c.isDesert).length / desertAnalysis.length) * 100,
      affectedPopulation: estimateAffectedPopulation(desertAnalysis),
      largestZone: Math.max(...desertZones.map(z => z.area), 0)
    }
  };
}

/**
 * Calculate accessibility using isochrones (time-based access zones)
 * @param {Array} outlets - Food outlets
 * @param {Object} cityData - City information
 * @param {String} mode - Travel mode: 'walking', 'cycling', 'driving'
 * @returns {Object} Isochrone-based accessibility analysis
 */
export function calculateIsochroneAccessibility(outlets, cityData, mode = 'walking') {
  const timeThresholds = getTimeThresholds(mode);
  const healthyOutlets = outlets.filter(o => o.classification.score >= 0.7);

  // Create sample points across the city
  const samplePoints = createSamplePoints(cityData.boundingBox, 50); // 50x50 grid

  const accessibility = samplePoints.map(point => {
    const reachableOutlets = healthyOutlets.filter(outlet => {
      const travelTime = estimateTravelTime(point, outlet, mode);
      return travelTime <= timeThresholds.max;
    });

    const accessLevel = categorizeAccessLevel(reachableOutlets.length, mode);

    return {
      location: point,
      reachableIn5Min: reachableOutlets.filter(o =>
        estimateTravelTime(point, o, mode) <= 5).length,
      reachableIn10Min: reachableOutlets.filter(o =>
        estimateTravelTime(point, o, mode) <= 10).length,
      reachableIn15Min: reachableOutlets.length,
      accessLevel,
      score: calculateAccessScore(reachableOutlets, point, mode)
    };
  });

  return {
    mode,
    accessibility,
    coverage: calculateCoverage(accessibility),
    gaps: identifyAccessGaps(accessibility)
  };
}

/**
 * Calculate equity-adjusted food access
 * @param {Object} accessAnalysis - Basic access analysis
 * @param {Object} demographicData - Demographic information
 * @returns {Object} Equity-weighted access scores
 */
export function calculateEquityAdjustedAccess(accessAnalysis, demographicData) {
  if (!demographicData) {
    return accessAnalysis;
  }

  const { gridAnalysis } = accessAnalysis;

  const equityAdjusted = gridAnalysis.map(cell => {
    // Factors that increase need
    const vulnerabilityFactors = {
      poverty: demographicData.povertyRate?.[cell.id] || 0,
      elderly: demographicData.elderlyRate?.[cell.id] || 0,
      carless: demographicData.noVehicleRate?.[cell.id] || 0,
      disability: demographicData.disabilityRate?.[cell.id] || 0
    };

    const vulnerabilityScore = calculateVulnerabilityScore(vulnerabilityFactors);

    // Adjust access score by vulnerability
    const equityWeight = 1 + (vulnerabilityScore * 0.5); // Up to 50% increase for vulnerable areas
    const adjustedScore = cell.accessScore / equityWeight;

    return {
      ...cell,
      vulnerabilityScore,
      equityAdjustedScore: Math.max(0, adjustedScore),
      needsIntervention: adjustedScore < 30 && vulnerabilityScore > 0.5
    };
  });

  return {
    ...accessAnalysis,
    equityAnalysis: equityAdjusted,
    equityGap: calculateEquityGap(equityAdjusted),
    priorityAreas: equityAdjusted.filter(c => c.needsIntervention)
      .sort((a, b) => b.vulnerabilityScore - a.vulnerabilityScore)
  };
}

// Helper Functions

function createGrid(boundingBox, gridSize) {
  const [south, north, west, east] = boundingBox;
  const grid = [];

  for (let lat = south; lat < north; lat += gridSize) {
    for (let lng = west; lng < east; lng += gridSize) {
      grid.push({
        id: `${lat.toFixed(4)}_${lng.toFixed(4)}`,
        center: { lat: lat + gridSize / 2, lng: lng + gridSize / 2 },
        bounds: {
          south: lat,
          north: lat + gridSize,
          west: lng,
          east: lng + gridSize
        },
        area: calculateCellArea(lat, gridSize)
      });
    }
  }

  return grid;
}

function analyzeCellAccess(cell, outlets, populationData) {
  const radius = 1000; // 1km radius
  const nearbyOutlets = findOutletsWithinRadius(outlets, cell.center, radius);

  // Calculate distance-weighted access score
  const accessScore = nearbyOutlets.reduce((score, outlet) => {
    const distance = haversineDistance(cell.center, outlet);
    const weight = Math.exp(-distance / 500); // Exponential decay with 500m half-life
    return score + (outlet.classification.score * weight * 100);
  }, 0);

  // Estimate population (use provided data or default estimate)
  const population = populationData ?
    getPopulationForCell(cell, populationData) :
    estimateDefaultPopulation(cell);

  return {
    accessScore: Math.min(accessScore, 100),
    nearbyOutlets: nearbyOutlets.length,
    healthyOutlets: nearbyOutlets.filter(o => o.classification.score >= 0.7).length,
    population,
    density: population / cell.area
  };
}

function findOutletsWithinRadius(outlets, center, radius) {
  return outlets.filter(outlet => {
    const distance = haversineDistance(center, outlet);
    return distance <= radius;
  });
}

function haversineDistance(point1, point2) {
  const R = 6371000; // Earth's radius in meters
  const φ1 = toRadians(point1.lat);
  const φ2 = toRadians(point2.lat);
  const Δφ = toRadians(point2.lat - point1.lat);
  const Δλ = toRadians(point2.lng - point1.lng);

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

function calculateCellArea(latitude, gridSize) {
  // Account for Earth's curvature - cells are smaller at higher latitudes
  const R = 6371; // Earth's radius in km
  const latRadians = toRadians(latitude);
  const area = R * R * gridSize * gridSize * Math.cos(latRadians);
  return area; // km²
}

function estimateDefaultPopulation(cell) {
  // Default estimate: 1000 people per km² (urban average)
  return Math.round(cell.area * 1000);
}

function getPopulationForCell(cell, populationData) {
  // This would integrate with NASA SEDAC or census data
  // For now, return default estimate
  return estimateDefaultPopulation(cell);
}

function calculateInterventionPriority(cellAnalysis) {
  const { accessScore, population, density } = cellAnalysis;

  // Higher priority for low access, high population areas
  const needFactor = (100 - accessScore) / 100;
  const impactFactor = Math.min(population / 5000, 1); // Normalize to 0-1
  const densityFactor = Math.min(density / 10000, 1);

  return needFactor * 0.5 + impactFactor * 0.3 + densityFactor * 0.2;
}

function findNearestOutlet(center, outlets) {
  if (outlets.length === 0) return null;

  let nearest = null;
  let minDistance = Infinity;

  outlets.forEach(outlet => {
    const distance = haversineDistance(center, outlet);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = outlet;
    }
  });

  return { outlet: nearest, distance: minDistance };
}

function calculateDesertSeverity(distance, cell) {
  if (!distance || distance === Infinity) return 'SEVERE';
  if (distance > 2000) return 'HIGH';
  if (distance > 1500) return 'MODERATE';
  if (distance > 1000) return 'LOW';
  return 'NONE';
}

function clusterDesertCells(desertCells) {
  // Simple clustering - group adjacent cells
  const zones = [];
  const visited = new Set();

  desertCells.forEach(cell => {
    if (visited.has(cell.id)) return;

    const zone = {
      id: `zone_${zones.length}`,
      cells: [],
      area: 0,
      center: null
    };

    // BFS to find connected cells
    const queue = [cell];
    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current.id)) continue;

      visited.add(current.id);
      zone.cells.push(current);
      zone.area += current.area;

      // Find adjacent cells
      const adjacent = desertCells.filter(c =>
        !visited.has(c.id) &&
        Math.abs(c.center.lat - current.center.lat) < 0.011 &&
        Math.abs(c.center.lng - current.center.lng) < 0.011
      );

      queue.push(...adjacent);
    }

    // Calculate zone center
    const avgLat = zone.cells.reduce((sum, c) => sum + c.center.lat, 0) / zone.cells.length;
    const avgLng = zone.cells.reduce((sum, c) => sum + c.center.lng, 0) / zone.cells.length;
    zone.center = { lat: avgLat, lng: avgLng };

    zones.push(zone);
  });

  return zones;
}

function estimateAffectedPopulation(desertAnalysis) {
  return desertAnalysis
    .filter(c => c.isDesert)
    .reduce((sum, c) => sum + (c.population || 1000), 0);
}

function getTimeThresholds(mode) {
  const thresholds = {
    walking: { ideal: 5, acceptable: 10, max: 15 },
    cycling: { ideal: 10, acceptable: 15, max: 20 },
    driving: { ideal: 5, acceptable: 10, max: 15 }
  };
  return thresholds[mode] || thresholds.walking;
}

function createSamplePoints(boundingBox, gridDensity) {
  const [south, north, west, east] = boundingBox;
  const points = [];

  const latStep = (north - south) / gridDensity;
  const lngStep = (east - west) / gridDensity;

  for (let i = 0; i < gridDensity; i++) {
    for (let j = 0; j < gridDensity; j++) {
      points.push({
        lat: south + (i + 0.5) * latStep,
        lng: west + (j + 0.5) * lngStep
      });
    }
  }

  return points;
}

function estimateTravelTime(origin, destination, mode) {
  const distance = haversineDistance(origin, destination);

  // Average speeds (m/min)
  const speeds = {
    walking: 80,    // ~5 km/h
    cycling: 250,   // ~15 km/h
    driving: 500    // ~30 km/h (urban)
  };

  const speed = speeds[mode] || speeds.walking;
  return distance / speed;
}

function categorizeAccessLevel(outletCount, mode) {
  if (mode === 'walking') {
    if (outletCount >= 3) return 'EXCELLENT';
    if (outletCount >= 2) return 'GOOD';
    if (outletCount >= 1) return 'MODERATE';
    return 'POOR';
  }

  // More lenient for other modes
  if (outletCount >= 5) return 'EXCELLENT';
  if (outletCount >= 3) return 'GOOD';
  if (outletCount >= 1) return 'MODERATE';
  return 'POOR';
}

function calculateAccessScore(outlets, point, mode) {
  return outlets.reduce((score, outlet) => {
    const time = estimateTravelTime(point, outlet, mode);
    const timeWeight = Math.max(0, 1 - (time / 15)); // Linear decay over 15 min
    return score + (outlet.classification.score * timeWeight * 20);
  }, 0);
}

function calculateCoverage(accessibility) {
  const total = accessibility.length;
  const levels = {
    excellent: accessibility.filter(a => a.accessLevel === 'EXCELLENT').length,
    good: accessibility.filter(a => a.accessLevel === 'GOOD').length,
    moderate: accessibility.filter(a => a.accessLevel === 'MODERATE').length,
    poor: accessibility.filter(a => a.accessLevel === 'POOR').length
  };

  return {
    percentages: {
      excellent: (levels.excellent / total) * 100,
      good: (levels.good / total) * 100,
      moderate: (levels.moderate / total) * 100,
      poor: (levels.poor / total) * 100
    },
    adequate: ((levels.excellent + levels.good) / total) * 100
  };
}

function identifyAccessGaps(accessibility) {
  return accessibility
    .filter(a => a.accessLevel === 'POOR')
    .map(a => ({
      location: a.location,
      severity: 'HIGH',
      nearestOutlets: a.reachableIn15Min
    }));
}

function calculateVulnerabilityScore(factors) {
  const weights = {
    poverty: 0.3,
    elderly: 0.25,
    carless: 0.25,
    disability: 0.2
  };

  return Object.keys(factors).reduce((score, factor) =>
    score + (factors[factor] * (weights[factor] || 0.25)), 0
  );
}

function calculateEquityGap(equityAdjusted) {
  const scores = equityAdjusted.map(c => c.equityAdjustedScore);
  const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;

  // Calculate Gini coefficient
  scores.sort((a, b) => a - b);
  let sumOfDifferences = 0;

  scores.forEach((score1, i) => {
    scores.forEach((score2, j) => {
      sumOfDifferences += Math.abs(score1 - score2);
    });
  });

  const gini = sumOfDifferences / (2 * scores.length * scores.length * mean);

  return {
    giniCoefficient: gini,
    interpretation: gini < 0.3 ? 'LOW' : gini < 0.5 ? 'MODERATE' : 'HIGH',
    worstServed: equityAdjusted.sort((a, b) => a.equityAdjustedScore - b.equityAdjustedScore).slice(0, 10)
  };
}

function generateStatistics(gridAnalysis, outlets) {
  const scores = gridAnalysis.map(c => c.accessScore);

  return {
    mean: scores.reduce((sum, s) => sum + s, 0) / scores.length,
    median: scores.sort((a, b) => a - b)[Math.floor(scores.length / 2)],
    min: Math.min(...scores),
    max: Math.max(...scores),
    foodDesertPercentage: (gridAnalysis.filter(c => c.foodDesert).length / gridAnalysis.length) * 100,
    populationInDeserts: gridAnalysis.filter(c => c.foodDesert).reduce((sum, c) => sum + c.population, 0),
    outletsPerCapita: outlets.length / gridAnalysis.reduce((sum, c) => sum + c.population, 0) * 10000
  };
}

function generateAccessRecommendations(gridAnalysis, foodDeserts) {
  const recommendations = [];

  if (foodDeserts.length > 0) {
    recommendations.push({
      type: 'FOOD_DESERT',
      priority: 'CRITICAL',
      action: `Address ${foodDeserts.length} food desert zones affecting ${
        foodDeserts.reduce((sum, d) => sum + d.population, 0).toLocaleString()
      } people`,
      locations: foodDeserts.slice(0, 5).map(d => d.center)
    });
  }

  const lowAccessAreas = gridAnalysis.filter(c => c.accessScore < 30 && !c.foodDesert);
  if (lowAccessAreas.length > 0) {
    recommendations.push({
      type: 'LOW_ACCESS',
      priority: 'HIGH',
      action: `Improve access in ${lowAccessAreas.length} low-access areas`,
      locations: lowAccessAreas.slice(0, 5).map(c => c.center)
    });
  }

  return recommendations;
}

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  calculateWeightedFoodAccess,
  detectFoodDeserts,
  calculateIsochroneAccessibility,
  calculateEquityAdjustedAccess
};
// soilDataIntegration.js - Comprehensive soil quality and land suitability assessment
// Integrates multiple data sources for agricultural viability analysis

import axios from 'axios';

// USDA Soil Survey API
const USDA_SOIL_API = 'https://sdmdataaccess.sc.egov.usda.gov/Tabular/SDMTabularService/post.rest';
const EPA_BROWNFIELDS_API = 'https://data.epa.gov/efservice/bf_metadata';
const ISRIC_SOILGRIDS_API = 'https://rest.isric.org/soilgrids/v2.0';

/**
 * Comprehensive soil quality assessment for urban agriculture
 * @param {Object} location - {lat, lng} coordinates
 * @param {Number} radius - Analysis radius in meters
 * @returns {Object} Complete soil assessment with recommendations
 */
export async function assessSoilQuality(location, radius = 100) {
  try {
    // Fetch data from multiple sources in parallel
    const [soilData, contamination, landHistory] = await Promise.all([
      fetchSoilProperties(location),
      fetchContaminationData(location, radius),
      fetchLandUseHistory(location)
    ]);

    // Calculate comprehensive soil suitability
    const suitability = calculateSoilSuitability(soilData, contamination, landHistory);

    return {
      location,
      soilProperties: soilData,
      contamination,
      landHistory,
      suitability,
      recommendations: generateSoilRecommendations(suitability),
      interventions: suggestSoilInterventions(soilData, contamination)
    };
  } catch (error) {
    console.error('Soil assessment error:', error);
    return generateDefaultSoilAssessment(location);
  }
}

/**
 * Fetch soil properties from USDA/ISRIC databases
 */
async function fetchSoilProperties(location) {
  try {
    // Try ISRIC SoilGrids first (global coverage)
    const response = await axios.get(ISRIC_SOILGRIDS_API + '/properties/query', {
      params: {
        lon: location.lng,
        lat: location.lat,
        property: 'phh2o,soc,clay,sand,nitrogen,cec',
        depth: '0-30cm',
        value: 'mean'
      }
    });

    const properties = response.data.properties || {};

    return {
      pH: properties.phh2o?.mean / 10 || 6.5, // Convert from 0-140 to 0-14
      organicCarbon: properties.soc?.mean || 20, // g/kg
      texture: classifySoilTexture(properties.clay?.mean, properties.sand?.mean),
      nitrogen: properties.nitrogen?.mean || 1.5, // g/kg
      cationExchange: properties.cec?.mean || 15, // cmol/kg
      drainage: estimateDrainage(properties.clay?.mean, properties.sand?.mean),
      fertility: calculateFertilityScore(properties)
    };
  } catch (error) {
    console.warn('ISRIC API failed, using fallback:', error);
    return estimateSoilFromClimate(location);
  }
}

/**
 * Check for soil contamination from EPA Brownfields
 */
async function fetchContaminationData(location, radius) {
  try {
    // Query EPA Brownfields database
    const response = await axios.get(EPA_BROWNFIELDS_API + '/bf_assessment', {
      params: {
        latitude: `${location.lat - 0.01},${location.lat + 0.01}`,
        longitude: `${location.lng - 0.01},${location.lng + 0.01}`,
        $format: 'json'
      }
    });

    const sites = response.data || [];
    const nearbySites = sites.filter(site => {
      const distance = haversineDistance(location, {
        lat: site.latitude,
        lng: site.longitude
      });
      return distance <= radius;
    });

    if (nearbySites.length === 0) {
      return {
        contaminated: false,
        risk: 'LOW',
        contaminants: [],
        remediation: null
      };
    }

    // Analyze contamination
    const contaminants = extractContaminants(nearbySites);
    const risk = assessContaminationRisk(contaminants, location, nearbySites);

    return {
      contaminated: true,
      risk,
      contaminants,
      nearestSite: nearbySites[0],
      remediation: suggestRemediation(contaminants, risk)
    };
  } catch (error) {
    console.warn('EPA data unavailable:', error);
    return { contaminated: false, risk: 'UNKNOWN', contaminants: [] };
  }
}

/**
 * Analyze historical land use for contamination risk
 */
async function fetchLandUseHistory(location) {
  // In production, this would query historical maps API or local planning data
  // For now, use OpenStreetMap to identify current land use

  const landUse = await getCurrentLandUse(location);

  return {
    current: landUse,
    historicalRisk: estimateHistoricalRisk(landUse),
    industrialProximity: await checkIndustrialProximity(location),
    previousAgricultural: landUse.includes('farmland') || landUse.includes('orchard')
  };
}

/**
 * Calculate comprehensive soil suitability score
 */
function calculateSoilSuitability(soilData, contamination, landHistory) {
  const factors = {
    // Soil properties (40% weight)
    fertility: soilData.fertility * 0.15,
    pH: calculatePHScore(soilData.pH) * 0.10,
    texture: calculateTextureScore(soilData.texture) * 0.10,
    drainage: calculateDrainageScore(soilData.drainage) * 0.05,

    // Contamination (30% weight)
    contamination: (contamination.risk === 'LOW' ? 1 :
                   contamination.risk === 'MODERATE' ? 0.5 : 0) * 0.30,

    // Land history (20% weight)
    historicalUse: (landHistory.historicalRisk === 'LOW' ? 1 : 0.5) * 0.10,
    industrial: (landHistory.industrialProximity < 500 ? 0 : 1) * 0.10,

    // Agricultural potential (10% weight)
    previousAg: (landHistory.previousAgricultural ? 1 : 0.7) * 0.10
  };

  const overallScore = Object.values(factors).reduce((sum, val) => sum + val, 0);

  return {
    score: Math.round(overallScore * 100),
    factors,
    category: categorizeSuitability(overallScore),
    limitations: identifyLimitations(soilData, contamination),
    potential: assessPotential(overallScore, soilData)
  };
}

/**
 * Suggest soil-based interventions
 */
function suggestSoilInterventions(soilData, contamination) {
  const interventions = [];

  // pH adjustment
  if (soilData.pH < 6.0) {
    interventions.push({
      type: 'SOIL_AMENDMENT',
      action: 'Add lime to raise pH',
      priority: 'HIGH',
      cost: 'LOW',
      timeframe: '1-2 months'
    });
  } else if (soilData.pH > 7.5) {
    interventions.push({
      type: 'SOIL_AMENDMENT',
      action: 'Add sulfur or organic matter to lower pH',
      priority: 'MEDIUM',
      cost: 'LOW',
      timeframe: '2-3 months'
    });
  }

  // Organic matter enhancement
  if (soilData.organicCarbon < 15) {
    interventions.push({
      type: 'ORGANIC_ENHANCEMENT',
      action: 'Add compost and mulch to increase organic matter',
      priority: 'HIGH',
      cost: 'MEDIUM',
      timeframe: '3-6 months'
    });
  }

  // Contamination remediation
  if (contamination.contaminated) {
    if (contamination.risk === 'HIGH') {
      interventions.push({
        type: 'REMEDIATION',
        action: 'Use raised beds with imported clean soil',
        priority: 'CRITICAL',
        cost: 'HIGH',
        timeframe: 'Immediate'
      });
    } else {
      interventions.push({
        type: 'PHYTOREMEDIATION',
        action: 'Plant phytoremediator crops to extract contaminants',
        priority: 'MEDIUM',
        cost: 'LOW',
        timeframe: '1-2 years'
      });
    }
  }

  // Drainage improvement
  if (soilData.drainage === 'POOR') {
    interventions.push({
      type: 'DRAINAGE',
      action: 'Install French drains or raised beds',
      priority: 'HIGH',
      cost: 'MEDIUM',
      timeframe: '1 month'
    });
  }

  return interventions;
}

// Helper Functions

function classifySoilTexture(clay, sand) {
  if (!clay || !sand) return 'LOAM'; // Default

  const silt = 100 - clay - sand;

  if (clay > 40) return 'CLAY';
  if (sand > 65) return 'SANDY';
  if (silt > 60) return 'SILTY';
  if (clay >= 20 && clay <= 35 && sand >= 45 && sand <= 65) return 'LOAM';
  return 'MIXED';
}

function estimateDrainage(clay, sand) {
  if (clay > 40) return 'POOR';
  if (sand > 70) return 'EXCESSIVE';
  if (clay >= 20 && clay <= 35) return 'GOOD';
  return 'MODERATE';
}

function calculateFertilityScore(properties) {
  let score = 0.5; // Base score

  if (properties.soc?.mean > 30) score += 0.2; // High organic carbon
  if (properties.nitrogen?.mean > 2) score += 0.15; // Good nitrogen
  if (properties.cec?.mean > 20) score += 0.15; // Good cation exchange

  return Math.min(score, 1);
}

function calculatePHScore(pH) {
  // Optimal pH for most crops is 6.0-7.0
  if (pH >= 6.0 && pH <= 7.0) return 1;
  if (pH >= 5.5 && pH < 6.0) return 0.8;
  if (pH > 7.0 && pH <= 7.5) return 0.8;
  if (pH >= 5.0 && pH < 5.5) return 0.5;
  if (pH > 7.5 && pH <= 8.0) return 0.5;
  return 0.2; // Very acidic or very alkaline
}

function calculateTextureScore(texture) {
  const scores = {
    'LOAM': 1.0,
    'SILTY': 0.9,
    'SANDY': 0.6,
    'CLAY': 0.5,
    'MIXED': 0.7
  };
  return scores[texture] || 0.5;
}

function calculateDrainageScore(drainage) {
  const scores = {
    'GOOD': 1.0,
    'MODERATE': 0.7,
    'EXCESSIVE': 0.4,
    'POOR': 0.3
  };
  return scores[drainage] || 0.5;
}

function categorizeSuitability(score) {
  if (score >= 0.8) return 'EXCELLENT';
  if (score >= 0.6) return 'GOOD';
  if (score >= 0.4) return 'MODERATE';
  if (score >= 0.2) return 'POOR';
  return 'UNSUITABLE';
}

function identifyLimitations(soilData, contamination) {
  const limitations = [];

  if (soilData.pH < 5.5 || soilData.pH > 7.5) {
    limitations.push('pH requires adjustment');
  }
  if (soilData.drainage === 'POOR') {
    limitations.push('Poor drainage needs improvement');
  }
  if (contamination.contaminated) {
    limitations.push(`Contamination risk: ${contamination.risk}`);
  }
  if (soilData.organicCarbon < 10) {
    limitations.push('Low organic matter');
  }

  return limitations;
}

function assessPotential(score, soilData) {
  if (score >= 0.7) {
    return {
      level: 'HIGH',
      description: 'Suitable for diverse crop production',
      crops: ['Vegetables', 'Herbs', 'Small fruits', 'Flowers']
    };
  } else if (score >= 0.4) {
    return {
      level: 'MODERATE',
      description: 'Suitable with amendments',
      crops: ['Hardy vegetables', 'Cover crops', 'Herbs']
    };
  } else {
    return {
      level: 'LOW',
      description: 'Requires significant intervention',
      crops: ['Container gardening', 'Raised beds only']
    };
  }
}

function extractContaminants(sites) {
  const contaminants = new Set();

  sites.forEach(site => {
    if (site.contaminants) {
      site.contaminants.split(',').forEach(c => contaminants.add(c.trim()));
    }
  });

  return Array.from(contaminants);
}

function assessContaminationRisk(contaminants, location, sites) {
  if (contaminants.length === 0) return 'LOW';

  const hazardous = ['lead', 'arsenic', 'mercury', 'pcb', 'asbestos'];
  const hasHazardous = contaminants.some(c =>
    hazardous.some(h => c.toLowerCase().includes(h))
  );

  if (hasHazardous) return 'HIGH';

  const nearestDistance = Math.min(...sites.map(s =>
    haversineDistance(location, { lat: s.latitude, lng: s.longitude })
  ));

  if (nearestDistance < 50) return 'HIGH';
  if (nearestDistance < 200) return 'MODERATE';
  return 'LOW';
}

function suggestRemediation(contaminants, risk) {
  if (risk === 'HIGH') {
    return {
      method: 'CONTAINMENT',
      actions: [
        'Use raised beds with clean imported soil',
        'Install impermeable barriers',
        'Regular soil testing'
      ]
    };
  } else if (risk === 'MODERATE') {
    return {
      method: 'PHYTOREMEDIATION',
      actions: [
        'Plant sunflowers or Indian mustard',
        'Add activated carbon to soil',
        'Monitor contaminant levels'
      ]
    };
  }
  return null;
}

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

async function getCurrentLandUse(location) {
  // This would query OSM or local zoning data
  // For now, return estimated land use
  return 'mixed_urban';
}

function estimateHistoricalRisk(landUse) {
  const riskMap = {
    'industrial': 'HIGH',
    'commercial': 'MODERATE',
    'residential': 'LOW',
    'farmland': 'LOW',
    'park': 'LOW',
    'mixed_urban': 'MODERATE'
  };
  return riskMap[landUse] || 'UNKNOWN';
}

async function checkIndustrialProximity(location) {
  // Would check for nearby industrial sites
  // For now, return estimated distance
  return 1000; // meters
}

function estimateSoilFromClimate(location) {
  // Fallback estimation based on location
  return {
    pH: 6.5,
    organicCarbon: 20,
    texture: 'LOAM',
    nitrogen: 1.5,
    cationExchange: 15,
    drainage: 'MODERATE',
    fertility: 0.6
  };
}

function generateDefaultSoilAssessment(location) {
  return {
    location,
    soilProperties: estimateSoilFromClimate(location),
    contamination: { contaminated: false, risk: 'UNKNOWN' },
    landHistory: { current: 'unknown', historicalRisk: 'UNKNOWN' },
    suitability: { score: 50, category: 'MODERATE' },
    recommendations: ['Conduct soil testing before planting']
  };
}

function generateSoilRecommendations(suitability) {
  const recommendations = [];

  if (suitability.category === 'EXCELLENT') {
    recommendations.push('Ideal for immediate urban farming');
    recommendations.push('Consider diverse crop rotation');
  } else if (suitability.category === 'GOOD') {
    recommendations.push('Suitable for most crops with minor amendments');
    recommendations.push('Focus on hardy vegetables initially');
  } else if (suitability.category === 'MODERATE') {
    recommendations.push('Requires soil improvement before planting');
    recommendations.push('Start with raised beds or containers');
  } else {
    recommendations.push('Not suitable for in-ground planting');
    recommendations.push('Use container gardening or hydroponics');
  }

  return recommendations;
}

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  assessSoilQuality,
  fetchSoilProperties,
  fetchContaminationData,
  calculateSoilSuitability,
  suggestSoilInterventions
};
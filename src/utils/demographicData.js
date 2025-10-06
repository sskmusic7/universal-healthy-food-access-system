// demographicData.js - Comprehensive demographic data fetching and analysis
// Integrates Census API (US), OpenStreetMap, and estimated data for international cities

import axios from 'axios';

// US Census API endpoints
const CENSUS_API_BASE = 'https://api.census.gov/data/2021/acs/acs5';
const CENSUS_GEO_API = 'https://geocoding.geo.census.gov/geocoder/geographies/coordinates';

/**
 * Fetch comprehensive demographic data for a location
 * @param {Object} cityData - City information with lat, lng, boundingBox
 * @param {Object} options - Configuration options
 * @returns {Object} Demographic data including population, income, age, race
 */
export async function fetchDemographicData(cityData, options = {}) {
  const {
    includeDetailed = true,
    gridResolution = 0.01 // ~1km cells
  } = options;

  try {
    console.log('📊 Fetching demographic data for:', cityData.name);

    // Determine if location is in US
    const isUS = await isUSLocation(cityData);

    let demographicData;
    if (isUS) {
      demographicData = await fetchUSCensusData(cityData);
    } else {
      demographicData = await fetchInternationalData(cityData);
    }

    // Create population grid for spatial analysis
    const populationGrid = await createPopulationGrid(cityData, gridResolution, demographicData);

    return {
      location: cityData,
      isUS,
      summary: demographicData.summary,
      detailed: includeDetailed ? demographicData.detailed : null,
      populationGrid,
      vulnerabilityFactors: calculateVulnerabilityFactors(demographicData),
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching demographic data:', error);
    return generateEstimatedDemographics(cityData);
  }
}

/**
 * Check if location is in United States
 */
async function isUSLocation(cityData) {
  try {
    // Use reverse geocoding to check country
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        lat: cityData.lat,
        lon: cityData.lng,
        format: 'json'
      },
      headers: {
        'User-Agent': 'UniversalHealthyFoodAccessSystem/1.0'
      }
    });

    const country = response.data.address?.country;
    return country === 'United States' || country === 'USA';
  } catch (error) {
    console.warn('Could not determine country:', error);
    return false;
  }
}

/**
 * Fetch demographic data from US Census Bureau
 */
async function fetchUSCensusData(cityData) {
  try {
    // Step 1: Get Census tract/block group for location
    const geoData = await getCensusGeography(cityData.lat, cityData.lng);

    if (!geoData) {
      throw new Error('Could not find Census geography');
    }

    // Step 2: Fetch demographic variables
    const variables = [
      'B01003_001E', // Total Population
      'B19013_001E', // Median Household Income
      'B17001_002E', // Poverty Count
      'B01002_001E', // Median Age
      'B02001_002E', // White Alone
      'B02001_003E', // Black/African American
      'B02001_005E', // Asian
      'B03003_003E', // Hispanic/Latino
      'B25003_002E', // Owner Occupied Housing
      'B25003_003E', // Renter Occupied Housing
      'B15003_022E', // Bachelor's Degree
      'B15003_023E', // Master's Degree
      'B08301_010E', // Public Transportation to Work
      'B23025_005E'  // Unemployed
    ];

    const censusData = await fetchCensusVariables(geoData, variables);

    // Parse and structure the data
    const totalPop = parseInt(censusData.B01003_001E) || 0;
    const povertyCount = parseInt(censusData.B17001_002E) || 0;
    const unemployed = parseInt(censusData.B23025_005E) || 0;

    return {
      summary: {
        totalPopulation: totalPop,
        medianIncome: parseInt(censusData.B19013_001E) || 0,
        medianAge: parseFloat(censusData.B01002_001E) || 0,
        povertyRate: totalPop > 0 ? (povertyCount / totalPop) : 0,
        unemploymentRate: totalPop > 0 ? (unemployed / totalPop) : 0
      },
      detailed: {
        race: {
          white: parseInt(censusData.B02001_002E) || 0,
          black: parseInt(censusData.B02001_003E) || 0,
          asian: parseInt(censusData.B02001_005E) || 0,
          hispanic: parseInt(censusData.B03003_003E) || 0
        },
        housing: {
          ownerOccupied: parseInt(censusData.B25003_002E) || 0,
          renterOccupied: parseInt(censusData.B25003_003E) || 0
        },
        education: {
          bachelors: parseInt(censusData.B15003_022E) || 0,
          masters: parseInt(censusData.B15003_023E) || 0
        },
        transportation: {
          publicTransit: parseInt(censusData.B08301_010E) || 0
        }
      },
      source: 'US Census Bureau ACS 5-Year',
      tract: geoData.tract,
      state: geoData.state,
      county: geoData.county
    };
  } catch (error) {
    console.error('US Census data fetch failed:', error);
    throw error;
  }
}

/**
 * Get Census geography (tract, block group) for coordinates
 */
async function getCensusGeography(lat, lng) {
  try {
    const response = await axios.get(CENSUS_GEO_API, {
      params: {
        x: lng,
        y: lat,
        benchmark: 'Public_AR_Current',
        vintage: 'Current_Current',
        format: 'json'
      }
    });

    const result = response.data?.result;
    if (!result || !result.geographies) {
      return null;
    }

    const tract = result.geographies['Census Tracts']?.[0];
    if (!tract) return null;

    return {
      state: tract.STATE,
      county: tract.COUNTY,
      tract: tract.TRACT,
      blockGroup: tract.BLKGRP || '1'
    };
  } catch (error) {
    console.error('Census geography lookup failed:', error);
    return null;
  }
}

/**
 * Fetch specific Census variables
 */
async function fetchCensusVariables(geoData, variables) {
  try {
    const apiKey = process.env.REACT_APP_CENSUS_API_KEY || '';

    const response = await axios.get(CENSUS_API_BASE, {
      params: {
        get: variables.join(','),
        for: `tract:${geoData.tract}`,
        in: `state:${geoData.state} county:${geoData.county}`,
        key: apiKey
      }
    });

    // Parse response (first row is headers, second is data)
    const headers = response.data[0];
    const values = response.data[1];

    const data = {};
    headers.forEach((header, index) => {
      data[header] = values[index];
    });

    return data;
  } catch (error) {
    console.error('Census variable fetch failed:', error);
    throw error;
  }
}

/**
 * Fetch demographic data for international cities
 */
async function fetchInternationalData(cityData) {
  try {
    // Try to get population data from OpenStreetMap
    const osmData = await fetchOSMPopulation(cityData);

    // Estimate other demographics based on region and development indicators
    const estimates = estimateInternationalDemographics(cityData, osmData);

    return {
      summary: {
        totalPopulation: osmData?.population || estimates.population,
        medianIncome: estimates.medianIncome,
        medianAge: estimates.medianAge,
        povertyRate: estimates.povertyRate,
        unemploymentRate: estimates.unemploymentRate
      },
      detailed: estimates.detailed,
      source: 'OpenStreetMap + Estimates',
      isEstimated: true
    };
  } catch (error) {
    console.error('International data fetch failed:', error);
    throw error;
  }
}

/**
 * Fetch population data from OpenStreetMap
 */
async function fetchOSMPopulation(cityData) {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: cityData.name,
        format: 'json',
        extratags: 1
      },
      headers: {
        'User-Agent': 'UniversalHealthyFoodAccessSystem/1.0'
      }
    });

    const place = response.data[0];
    if (!place) return null;

    return {
      population: parseInt(place.extratags?.population) || null,
      place_rank: place.place_rank,
      importance: place.importance
    };
  } catch (error) {
    console.warn('OSM population fetch failed:', error);
    return null;
  }
}

/**
 * Estimate demographics for international cities
 */
function estimateInternationalDemographics(cityData, osmData) {
  // Use heuristics based on city size, region, and available data
  const basePopulation = osmData?.population || 100000;

  // Rough estimates - would be improved with actual data sources
  return {
    population: basePopulation,
    medianIncome: 30000, // USD equivalent
    medianAge: 32,
    povertyRate: 0.20,
    unemploymentRate: 0.10,
    detailed: {
      isEstimated: true,
      note: 'Demographics estimated from limited data'
    }
  };
}

/**
 * Create population density grid for spatial analysis
 */
async function createPopulationGrid(cityData, gridResolution, demographicData) {
  const [south, north, west, east] = cityData.boundingBox;
  const grid = [];

  const totalPopulation = demographicData.summary.totalPopulation;

  // Calculate grid dimensions
  const latCells = Math.ceil((north - south) / gridResolution);
  const lngCells = Math.ceil((east - west) / gridResolution);
  const totalCells = latCells * lngCells;

  // Distribute population across grid (simplified - uniform distribution)
  // In reality, this would use actual population density data
  const popPerCell = totalPopulation / totalCells;

  for (let lat = south; lat < north; lat += gridResolution) {
    for (let lng = west; lng < east; lng += gridResolution) {
      grid.push({
        center: {
          lat: lat + gridResolution / 2,
          lng: lng + gridResolution / 2
        },
        bounds: {
          south: lat,
          north: lat + gridResolution,
          west: lng,
          east: lng + gridResolution
        },
        population: Math.round(popPerCell),
        density: popPerCell / (gridResolution * 111 * gridResolution * 111 * Math.cos(lat * Math.PI / 180))
      });
    }
  }

  return grid;
}

/**
 * Calculate vulnerability factors from demographic data
 */
function calculateVulnerabilityFactors(demographicData) {
  const summary = demographicData.summary;

  const factors = {
    economic: {
      povertyRate: summary.povertyRate || 0,
      unemploymentRate: summary.unemploymentRate || 0,
      lowIncomeRatio: summary.medianIncome ? Math.max(0, 1 - (summary.medianIncome / 75000)) : 0.5,
      score: 0
    },
    social: {
      rentalHousingRatio: 0.5, // Would calculate from housing data
      publicTransitDependency: 0.3, // Would calculate from transportation data
      educationGap: 0.4, // Would calculate from education data
      score: 0
    },
    demographic: {
      youthRatio: summary.medianAge < 25 ? 0.6 : 0.3,
      elderlyRatio: summary.medianAge > 60 ? 0.7 : 0.2,
      score: 0
    }
  };

  // Calculate composite scores
  factors.economic.score = (
    factors.economic.povertyRate * 0.4 +
    factors.economic.unemploymentRate * 0.3 +
    factors.economic.lowIncomeRatio * 0.3
  );

  factors.social.score = (
    factors.social.rentalHousingRatio * 0.4 +
    factors.social.publicTransitDependency * 0.3 +
    factors.social.educationGap * 0.3
  );

  factors.demographic.score = (
    factors.demographic.youthRatio * 0.5 +
    factors.demographic.elderlyRatio * 0.5
  );

  // Overall vulnerability score
  const overallScore = (
    factors.economic.score * 0.45 +
    factors.social.score * 0.35 +
    factors.demographic.score * 0.20
  );

  return {
    ...factors,
    overallScore,
    category: categorizeVulnerability(overallScore)
  };
}

/**
 * Categorize vulnerability level
 */
function categorizeVulnerability(score) {
  if (score >= 0.7) return 'CRITICAL';
  if (score >= 0.5) return 'HIGH';
  if (score >= 0.3) return 'MODERATE';
  return 'LOW';
}

/**
 * Generate estimated demographics when data unavailable
 */
function generateEstimatedDemographics(cityData) {
  console.warn('Using estimated demographics for:', cityData.name);

  return {
    location: cityData,
    isUS: false,
    summary: {
      totalPopulation: 100000,
      medianIncome: 35000,
      medianAge: 32,
      povertyRate: 0.25,
      unemploymentRate: 0.12
    },
    detailed: null,
    populationGrid: [],
    vulnerabilityFactors: {
      economic: { score: 0.5 },
      social: { score: 0.5 },
      demographic: { score: 0.4 },
      overallScore: 0.47,
      category: 'MODERATE'
    },
    source: 'Estimated',
    isEstimated: true,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Get population for a specific location (used by other modules)
 */
export function getPopulationAtLocation(location, populationGrid) {
  if (!populationGrid || populationGrid.length === 0) {
    return 1000; // Default estimate
  }

  // Find grid cell containing this location
  const cell = populationGrid.find(cell =>
    location.lat >= cell.bounds.south &&
    location.lat <= cell.bounds.north &&
    location.lng >= cell.bounds.west &&
    location.lng <= cell.bounds.east
  );

  return cell?.population || 1000;
}

/**
 * Calculate population within radius of a point
 */
export function getPopulationWithinRadius(center, radius, populationGrid) {
  if (!populationGrid || populationGrid.length === 0) {
    return Math.round((radius / 1000) * (radius / 1000) * Math.PI * 1000);
  }

  let totalPopulation = 0;

  populationGrid.forEach(cell => {
    const distance = haversineDistance(center, cell.center);
    if (distance <= radius) {
      totalPopulation += cell.population;
    }
  });

  return totalPopulation;
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

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  fetchDemographicData,
  getPopulationAtLocation,
  getPopulationWithinRadius
};

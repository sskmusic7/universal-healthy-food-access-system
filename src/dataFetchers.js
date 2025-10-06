// dataFetchers.js - Universal Data Fetching Module
// Works for any city worldwide

import axios from 'axios';
import { fetchDemographicData } from './utils/demographicData';
import { generateIsochrones } from './utils/isochroneGenerator';
import { assessSoilQuality } from './utils/soilDataIntegration';
import { demographicCacheHelpers, climateCacheHelpers } from './utils/cacheManager';
import { logApiStatus } from './config/apiConfig';

// Base APIs
const OVERPASS_API = 'https://overpass-api.de/api/interpreter';
const NOMINATIM_API = 'https://nominatim.openstreetmap.org';

// NASA APIs Configuration
const NASA_EARTHDATA_TOKEN = process.env.REACT_APP_NASA_EARTHDATA_TOKEN;
const NASA_CMR_API = 'https://cmr.earthdata.nasa.gov/search/granules.json';
const NASA_SEDAC_API = 'https://sedac.ciesin.columbia.edu/data/set/gpw-v4-population-density-adjusted-to-2015-unwpp-country-totals-rev11/wfs';
const NASA_POWER_API = 'https://power.larc.nasa.gov/api/temporal/daily/point';

// Create axios instance with SEDAC config (commented out - not currently used)
/*
const sedacAxios = axios.create({
  baseURL: NASA_SEDAC_API,
  timeout: 60000,
  headers: {
    'Authorization': `Bearer ${NASA_EARTHDATA_TOKEN}`,
    'Accept': 'application/json',
    'Client-Id': 'HealthyFoodAccessSystem'
  }
});
*/

// Create axios instance with CMR config
const cmrAxios = axios.create({
  baseURL: NASA_CMR_API,
  timeout: 60000,
  headers: {
    'Authorization': `Bearer ${NASA_EARTHDATA_TOKEN}`,
    'Accept': 'application/json',
    'Client-Id': 'HealthyFoodAccessSystem'
  }
});

// ==================== CITY BOUNDARY & GEOCODING ====================

/**
 * Geocode city name to coordinates and boundary
 * @param {string} cityName - Name of city to geocode
 * @param {AbortSignal} signal - Optional AbortController signal for cancellation
 */
export async function geocodeCity(cityName, signal = null) {
  try {
    const response = await axios.get(`${NOMINATIM_API}/search`, {
      params: {
        q: cityName,
        format: 'json',
        limit: 1,
        polygon_geojson: 1
      },
      signal // Add abort signal support
    });

    if (response.data.length === 0) {
      throw new Error('City not found');
    }

    const city = response.data[0];
    return {
      name: city.display_name.split(',')[0],
      lat: parseFloat(city.lat),
      lng: parseFloat(city.lon),
      boundingBox: city.boundingbox.map(Number), // [south, north, west, east]
      boundary: city.geojson,
      osmId: city.osm_id,
      osmType: city.osm_type
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
}

/**
 * Get detailed city boundary from OSM
 */
export async function fetchCityBoundary(osmId, osmType) {
  const query = `
    [out:json][timeout:25];
    ${osmType}(${osmId});
    out geom;
  `;

  try {
    const response = await axios.post(OVERPASS_API, query, {
      headers: { 'Content-Type': 'text/plain' }
    });
    return response.data;
  } catch (error) {
    console.error('Boundary fetch error:', error);
    throw error;
  }
}

// ==================== FOOD OUTLETS (OPENSTREETMAP) ====================

/**
 * Fetch all food outlets within bounding box
 * Returns classified outlets (healthy vs unhealthy)
 * @param {Array} bbox - Bounding box [south, north, west, east]
 * @param {AbortSignal} signal - Optional AbortController signal for cancellation
 */
export async function fetchFoodOutlets(bbox, signal = null) {
  // bbox format: [south, north, west, east] or [minLat, maxLat, minLng, maxLng]
  const [south, north, west, east] = bbox;

  const query = `
    [out:json][timeout:60];
    (
      // Healthy primary outlets
      node["shop"="supermarket"](${south},${west},${north},${east});
      way["shop"="supermarket"](${south},${west},${north},${east});
      node["shop"="greengrocer"](${south},${west},${north},${east});
      node["amenity"="marketplace"](${south},${west},${north},${east});
      node["shop"="farm"](${south},${west},${north},${east});
      node["shop"="health_food"](${south},${west},${north},${east});

      // Secondary healthy outlets
      node["shop"="grocery"](${south},${west},${north},${east});
      node["shop"="convenience"](${south},${west},${north},${east});
      way["shop"="convenience"](${south},${west},${north},${east});
      node["shop"="butcher"](${south},${west},${north},${east});
      node["shop"="fishmonger"](${south},${west},${north},${east});

      // Unhealthy (for contrast)
      node["amenity"="fast_food"](${south},${west},${north},${east});
      way["amenity"="fast_food"](${south},${west},${north},${east});
    );
    out center;
  `;

  try {
    const response = await axios.post(OVERPASS_API, query, {
      headers: { 'Content-Type': 'text/plain' },
      signal // Add abort signal support
    });

    const allOutlets = response.data.elements.map(element => {
      const lat = element.lat || element.center?.lat;
      const lng = element.lon || element.center?.lon;

      const name = element.tags?.name || 'Unnamed';
      return {
        id: element.id,
        name,
        lat,
        lng,
        type: classifyOutlet(element.tags, name),
        rawType: element.tags?.shop || element.tags?.amenity,
        tags: element.tags,
        classification: getOutletClassification(element.tags, name)
      };
    });

    // Filter out outlets with invalid coordinates
    const validOutlets = allOutlets.filter(outlet => outlet.lat && outlet.lng);
    const invalidCount = allOutlets.length - validOutlets.length;

    if (invalidCount > 0) {
      console.warn(`⚠ Removed ${invalidCount} outlets with invalid coordinates (${allOutlets.length} total → ${validOutlets.length} valid)`);
    }

    return validOutlets;
  } catch (error) {
    console.error('Food outlets fetch error:', error);
    throw error;
  }
}

/**
 * Classify outlet as healthy, mixed, or unhealthy
 */
/**
 * Analyze outlet name for health sentiment
 */
function analyzeNameSentiment(name) {
  if (!name || name === 'Unnamed') return 'neutral';

  const nameLower = name.toLowerCase();

  // Strong healthy indicators
  const healthyKeywords = [
    'smoothie', 'juice', 'salad', 'organic', 'fresh', 'healthy', 'wellness',
    'natural', 'whole food', 'vegan', 'vegetarian', 'farmers market',
    'green', 'harvest', 'garden', 'nutrition', 'vitamin', 'superfood',
    'acai', 'kale', 'quinoa', 'granola', 'yogurt', 'fruit', 'veggie'
  ];

  // Unhealthy indicators
  const unhealthyKeywords = [
    'burger', 'pizza', 'fried', 'donut', 'candy', 'soda', 'fast food',
    'wings', 'fries', 'chips', 'ice cream', 'dessert', 'sweets',
    'liquor', 'bar', 'pub', 'tavern', 'beer', 'wine'
  ];

  // Check for healthy keywords
  for (const keyword of healthyKeywords) {
    if (nameLower.includes(keyword)) {
      return 'healthy';
    }
  }

  // Check for unhealthy keywords
  for (const keyword of unhealthyKeywords) {
    if (nameLower.includes(keyword)) {
      return 'unhealthy';
    }
  }

  return 'neutral';
}

function classifyOutlet(tags, name) {
  const shop = tags?.shop;
  const amenity = tags?.amenity;

  // Get name sentiment first - this is our primary signal
  const nameSentiment = analyzeNameSentiment(name);

  // Definitive healthy from tags (supermarkets, farms, etc)
  if (['supermarket', 'greengrocer', 'farm', 'health_food'].includes(shop)) {
    return 'healthy_primary';
  }
  if (amenity === 'marketplace') return 'healthy_primary';

  // Strong unhealthy tags that override name sentiment
  // (but only if name doesn't strongly suggest healthy)
  const strongUnhealthyTags = amenity === 'fast_food' || shop === 'alcohol';
  if (strongUnhealthyTags && nameSentiment !== 'healthy') {
    return 'unhealthy';
  }

  // NAME SENTIMENT OVERRIDE - prioritize what the business calls itself
  if (nameSentiment === 'healthy') {
    // Any place with healthy keywords in name is healthy
    // (juice bars, smoothie shops, salad places, etc.)
    return 'healthy_primary';
  }

  if (nameSentiment === 'unhealthy') {
    // Any place with unhealthy keywords is unhealthy
    return 'unhealthy';
  }

  // If name sentiment is neutral, fall back to tag-based classification
  // Mixed (needs validation)
  if (['grocery', 'convenience', 'butcher', 'fishmonger'].includes(shop)) {
    return 'mixed';
  }

  // Default to unknown if no clear signals
  return 'unknown';
}

/**
 * Get detailed classification
 */
function getOutletClassification(tags, name) {
  const type = classifyOutlet(tags, name);

  const classifications = {
    healthy_primary: {
      label: 'Healthy Food Source',
      color: '#0d5e3a',
      score: 1.0
    },
    mixed: {
      label: 'Mixed Selection',
      color: '#fbbf24',
      score: 0.5
    },
    unhealthy: {
      label: 'Unhealthy',
      color: '#dc2626',
      score: 0.0
    },
    unknown: {
      label: 'Unknown',
      color: '#6b7280',
      score: 0.3
    }
  };

  return classifications[type] || classifications.unknown;
}

// ==================== NASA EARTHDATA ====================

/**
 * Fetch NASA population data from SEDAC
 */
// Cache for population data responses
const populationCache = new Map();

// Helper to subdivide large bounding boxes
function subdivideBBox(bbox, divisions = 2) {
  const [south, north, west, east] = bbox;
  const latStep = (north - south) / divisions;
  const lonStep = (east - west) / divisions;
  const subBoxes = [];

  for (let i = 0; i < divisions; i++) {
    for (let j = 0; j < divisions; j++) {
      subBoxes.push([
        south + (i * latStep),
        south + ((i + 1) * latStep),
        west + (j * lonStep),
        west + ((j + 1) * lonStep)
      ]);
    }
  }
  return subBoxes;
}

// Helper to generate cache key
function getCacheKey(bbox) {
  return bbox.join(',');
}

export async function fetchNASAPopulation(bbox) {
  const [south, north, west, east] = bbox;
  const cacheKey = getCacheKey(bbox);
  
  // Check cache first
  if (populationCache.has(cacheKey)) {
    console.log('Using cached population data');
    return populationCache.get(cacheKey);
  }
  
  try {
    // Step 1: Validate coordinates
    validateBBox([south, north, west, east]);
    
    // Step 2: If area is large, subdivide and fetch in parallel
    const area = Math.abs((north - south) * (east - west));
    if (area > 0.1) { // Threshold for subdivision
      console.log('Large area detected, subdividing requests');
      const subBoxes = subdivideBBox(bbox);
      const subResults = await Promise.all(
        subBoxes.map(async (subBox, index) => {
          try {
            const response = await axios.get(NASA_SEDAC_API, {
              params: {
                service: 'WFS',
                version: '2.0.0',
                request: 'GetFeature',
                typeName: 'gpw-v4:gpw-v4-population-density-adjusted-to-2015-unwpp-country-totals-rev11',
                outputFormat: 'application/json',
                bbox: subBox.join(','),
                srsName: 'EPSG:4326',
                count: 2,
                propertyName: 'pop_den_2015,un_adj_2015'
              },
              timeout: 30000,
              headers: {
                'Authorization': `Bearer ${NASA_EARTHDATA_TOKEN}`,
                'Accept': 'application/json',
                'User-Agent': 'HealthyFoodAccessSystem/1.0'
              },
              validateStatus: status => status === 200
            });
            return { success: true, data: response.data, index };
          } catch (err) {
            console.warn(`⚠ Sub-request ${index + 1}/${subBoxes.length} failed:`, err.message);
            return { success: false, data: { features: [] }, index };
          }
        })
      );

      // Track failures
      const failedRequests = subResults.filter(r => !r.success);
      if (failedRequests.length > 0) {
        console.warn(`⚠ ${failedRequests.length}/${subBoxes.length} subdivision requests failed - partial data only`);
      }

      // Combine results
      const features = subResults.flatMap(r => r.data?.features || []);
      const result = {
        source: 'SEDAC_GPWv4',
        bbox,
        data: features,
        resolution: '1km',
        timestamp: new Date().toISOString(),
        dataQuality: {
          totalSubdivisions: subBoxes.length,
          successfulSubdivisions: subBoxes.length - failedRequests.length,
          failedSubdivisions: failedRequests.length,
          completeness: (subBoxes.length - failedRequests.length) / subBoxes.length
        }
      };

      // Cache the result
      populationCache.set(cacheKey, result);
      return result;
    }

    // Step 3: For small areas, make single request
    const response = await axios.get(NASA_SEDAC_API, {
      params: {
        service: 'WFS',
        version: '2.0.0',
        request: 'GetFeature',
        typeName: 'gpw-v4:gpw-v4-population-density-adjusted-to-2015-unwpp-country-totals-rev11',
        outputFormat: 'application/json',
        bbox: `${west},${south},${east},${north}`,
        srsName: 'EPSG:4326',
        count: 3,
        propertyName: 'pop_den_2015,un_adj_2015'
      },
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${NASA_EARTHDATA_TOKEN}`,
        'Accept': 'application/json',
        'User-Agent': 'HealthyFoodAccessSystem/1.0'
      },
      validateStatus: status => status === 200,
      maxRedirects: 5
    });

    if (!response.data || !response.data.features) {
      throw new Error('Invalid response format from SEDAC API');
    }

    return {
      source: 'SEDAC_GPWv4',
      bbox,
      data: response.data.features,
      resolution: '1km',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('NASA Population data fetch error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Fetch NASA NDVI (vegetation index) for urban farming site selection
 */
export async function fetchNASANDVI(bbox, startDate, endDate) {
  const [south, north, west, east] = bbox;
  
  try {
    const response = await cmrAxios.get('', {
      params: {
        short_name: 'MOD13Q1',
        version: '061',
        bounding_box: `${west},${south},${east},${north}`,
        temporal: `${startDate}T00:00:00Z,${endDate}T23:59:59Z`,
        page_size: 100
      }
    });

    if (!response.data || !response.data.feed || !response.data.feed.entry) {
      throw new Error('Invalid response format from CMR API');
    }

    return {
      source: 'MODIS_MOD13Q1',
      bbox,
      dateRange: { start: startDate, end: endDate },
      data: response.data.feed.entry,
      resolution: '250m'
    };
  } catch (error) {
    console.error('NASA NDVI fetch error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Fetch NASA Land Surface Temperature (heat exposure)
 */
export async function fetchNASALST(bbox, startDate, endDate) {
  const [south, north, west, east] = bbox;
  
  try {
    const response = await cmrAxios.get('', {
      params: {
        short_name: 'MOD11A2',
        version: '061',
        bounding_box: `${west},${south},${east},${north}`,
        temporal: `${startDate}T00:00:00Z,${endDate}T23:59:59Z`,
        page_size: 100
      }
    });

    if (!response.data || !response.data.feed || !response.data.feed.entry) {
      throw new Error('Invalid response format from CMR API');
    }

    return {
      source: 'MODIS_MOD11A2',
      bbox,
      dateRange: { start: startDate, end: endDate },
      data: response.data.feed.entry,
      resolution: '1km'
    };
  } catch (error) {
    console.error('NASA LST fetch error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Fetch NASA POWER solar/climate data (for urban farming)
 */
export async function fetchNASAPower(lat, lng, startDate, endDate) {
  try {
    const response = await axios.get(NASA_POWER_API, {
      params: {
        parameters: 'ALLSKY_SFC_SW_DWN,T2M,PRECTOTCORR', // Solar, temp, precip
        community: 'AG',
        longitude: lng,
        latitude: lat,
        start: startDate.replace(/-/g, ''),
        end: endDate.replace(/-/g, ''),
        format: 'JSON'
      },
      timeout: 30000
    });

    if (!response.data || !response.data.properties || !response.data.properties.parameter) {
      throw new Error('Invalid response format from NASA POWER API');
    }

    const parameters = response.data.properties.parameter;
    
    // Helper function to calculate mean safely, filtering NASA fill values (-999)
    const calculateMean = (data) => {
      if (!data) return null;
      // Filter out fill values: -999 (NASA POWER fill value), null, undefined
      const values = Object.values(data).filter(v => v !== null && v !== undefined && v !== -999);
      if (values.length === 0) return null;
      return values.reduce((sum, val) => sum + val, 0) / values.length;
    };

    // Calculate data quality metrics
    const getDataQuality = (data) => {
      if (!data) return { total: 0, valid: 0, fillValues: 0, completeness: 0 };
      const allValues = Object.values(data);
      const validValues = allValues.filter(v => v !== null && v !== undefined && v !== -999);
      return {
        total: allValues.length,
        valid: validValues.length,
        fillValues: allValues.length - validValues.length,
        completeness: allValues.length > 0 ? (validValues.length / allValues.length) : 0
      };
    };

    const solarQuality = getDataQuality(parameters.ALLSKY_SFC_SW_DWN);
    const tempQuality = getDataQuality(parameters.T2M);
    const precipQuality = getDataQuality(parameters.PRECTOTCORR);

    return {
      source: 'NASA_POWER',
      location: { lat, lng },
      data: {
        ALLSKY_SFC_SW_DWN: {
          mean: calculateMean(parameters.ALLSKY_SFC_SW_DWN),
          values: parameters.ALLSKY_SFC_SW_DWN || {},
          quality: solarQuality
        },
        T2M: {
          mean: calculateMean(parameters.T2M),
          values: parameters.T2M || {},
          quality: tempQuality
        },
        PRECTOTCORR: {
          mean: calculateMean(parameters.PRECTOTCORR),
          values: parameters.PRECTOTCORR || {},
          quality: precipQuality
        }
      },
      units: {
        ALLSKY_SFC_SW_DWN: 'kW-hr/m^2/day',
        T2M: 'Celsius',
        PRECTOTCORR: 'mm/day'
      },
      dateRange: {
        start: startDate,
        end: endDate
      },
      dataQuality: {
        averageCompleteness: (solarQuality.completeness + tempQuality.completeness + precipQuality.completeness) / 3,
        totalFillValues: solarQuality.fillValues + tempQuality.fillValues + precipQuality.fillValues,
        totalDataPoints: solarQuality.total + tempQuality.total + precipQuality.total
      }
    };
  } catch (error) {
    console.error('NASA POWER fetch error:', error.response?.data || error.message);
    throw error;
  }
}

// ==================== UNIVERSAL DATA AGGREGATOR ====================

/**
 * Fetch all data for a city in one call
 * This is the main function to use
 */
export async function fetchAllCityData(cityData, options = {}) {
  const {
    includeFoodOutlets = true,
    includePopulation = false,  // Requires auth
    includeNDVI = false,        // Requires auth
    includeLST = false,         // Requires auth
    includePower = true,        // No auth required
    includeDemographics = true, // New: Census/OSM demographics
    includeIsochrones = false,  // New: Accessibility analysis (can be slow)
    includeSoilData = false     // New: Soil quality (for placement engine)
  } = options;

  console.log(`Fetching data for ${cityData.name}...`);

  // Log API configuration status once
  logApiStatus();

  const results = {
    city: cityData,
    timestamp: new Date().toISOString(),
    data: {},
    warnings: [],
    errors: []
  };

  try {
    // Parallelize independent data fetching operations for better performance
    const parallelFetches = [];

    // Always fetch food outlets
    if (includeFoodOutlets) {
      console.log('Fetching food outlets from OpenStreetMap...');
      parallelFetches.push(
        fetchFoodOutlets(cityData.boundingBox)
          .then(outlets => {
            results.data.foodOutlets = outlets;
            console.log(`✓ Found ${outlets.length} food outlets`);
            return { success: true, type: 'foodOutlets' };
          })
          .catch(error => {
            console.error(`❌ Food outlets fetch failed: ${error.message}`);
            results.errors.push(`Food outlets fetch failed: ${error.message}`);
            return { success: false, type: 'foodOutlets', error };
          })
      );
    }

    // NASA Power data (no auth needed)
    if (includePower) {
      console.log('Fetching NASA POWER solar/climate data...');
      const today = new Date();
      const lastYear = new Date(today);
      lastYear.setFullYear(today.getFullYear() - 1);

      parallelFetches.push(
        fetchNASAPower(
          cityData.lat,
          cityData.lng,
          lastYear.toISOString().split('T')[0],
          today.toISOString().split('T')[0]
        )
          .then(power => {
            results.data.power = power;
            const dataQuality = power.dataQuality;

            if (dataQuality.averageCompleteness < 0.5) {
              const warning = `NASA POWER data quality low (${(dataQuality.averageCompleteness * 100).toFixed(0)}% complete - ${dataQuality.totalFillValues} fill values)`;
              console.warn(`⚠ ${warning}`);
              results.warnings.push(warning);
            }

            console.log(`✓ NASA POWER data retrieved (${(dataQuality.averageCompleteness * 100).toFixed(0)}% data completeness)`);
            return { success: true, type: 'power' };
          })
          .catch(error => {
            const errorMsg = `NASA POWER fetch failed: ${error.message}`;
            console.error(`❌ ${errorMsg}`);
            results.data.power = null;
            results.errors.push(errorMsg);
            return { success: false, type: 'power', error };
          })
      );
    }

    // Wait for all parallel fetches to complete
    await Promise.allSettled(parallelFetches);

    // Optional NASA data (requires authentication)
    if (includePopulation) {
      try {
        results.data.population = await fetchNASAPopulation(cityData.boundingBox);
      } catch (error) {
        const errorMsg = `NASA Population data fetch failed: ${error.message}`;
        console.error(`❌ ${errorMsg}`);
        results.errors.push(errorMsg);
      }
    }
    if (includeNDVI) {
      try {
        results.data.ndvi = await fetchNASANDVI(cityData.boundingBox, '2025-01-01', '2025-12-31');
      } catch (error) {
        const errorMsg = `NASA NDVI fetch failed: ${error.message}`;
        console.error(`❌ ${errorMsg}`);
        results.errors.push(errorMsg);
      }
    }
    if (includeLST) {
      try {
        results.data.lst = await fetchNASALST(cityData.boundingBox, '2025-06-01', '2025-08-31');
      } catch (error) {
        const errorMsg = `NASA LST fetch failed: ${error.message}`;
        console.error(`❌ ${errorMsg}`);
        results.errors.push(errorMsg);
      }
    }

    // New: Demographics data
    if (includeDemographics) {
      console.log('Fetching demographic data...');
      try {
        const cacheKey = demographicCacheHelpers.generateKey(cityData.name);
        let demographics = demographicCacheHelpers.get(cacheKey);

        if (!demographics) {
          demographics = await fetchDemographicData(cityData, {
            includeDetailed: true,
            gridResolution: 0.01
          });
          demographicCacheHelpers.set(cityData.name, demographics);
        } else {
          console.log('💾 Using cached demographic data');
        }

        results.data.demographics = demographics;
        console.log(`✓ Demographic data retrieved (${demographics.source})`);
      } catch (error) {
        const errorMsg = `Demographics fetch failed: ${error.message}`;
        console.error(`❌ ${errorMsg}`);
        results.errors.push(errorMsg);
      }
    }

    // New: Isochrone generation (accessibility analysis)
    if (includeIsochrones && results.data.foodOutlets) {
      console.log('Generating isochrones for food outlets...');
      try {
        // Limit to top 20 outlets to avoid excessive API calls
        const topOutlets = results.data.foodOutlets
          .filter(o => o.classification === 'healthy_primary')
          .slice(0, 20);

        const isochrones = await generateIsochrones(topOutlets, {
          profile: 'foot-walking',
          intervals: [300, 600, 900] // 5, 10, 15 minutes
        });

        results.data.isochrones = isochrones;
        console.log(`✓ Generated ${isochrones.isochrones.length} isochrones`);
      } catch (error) {
        const errorMsg = `Isochrone generation failed: ${error.message}`;
        console.warn(`⚠️ ${errorMsg}`);
        results.warnings.push(errorMsg);
      }
    }

    // New: Soil quality assessment (for specific locations)
    if (includeSoilData) {
      console.log('Assessing soil quality at city center...');
      try {
        const soilAssessment = await assessSoilQuality({
          lat: cityData.lat,
          lng: cityData.lng
        }, 1000);

        results.data.soil = soilAssessment;
        console.log(`✓ Soil quality: ${soilAssessment.suitability.category}`);
      } catch (error) {
        const errorMsg = `Soil assessment failed: ${error.message}`;
        console.warn(`⚠️ ${errorMsg}`);
        results.warnings.push(errorMsg);
      }
    }

    // Conditional success message based on warnings and errors
    if (results.errors.length > 0) {
      console.log(`⚠ Data fetched with ${results.errors.length} error(s) and ${results.warnings.length} warning(s)`);
    } else if (results.warnings.length > 0) {
      console.log(`⚠ Data fetched successfully with ${results.warnings.length} warning(s)`);
    } else {
      console.log('✓ All data fetched successfully');
    }

    return results;

  } catch (error) {
    console.error('Error fetching city data:', error);
    throw error;
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate bounding box from GeoJSON geometry
 */
export function calculateBBox(geometry) {
  const coordinates = geometry.coordinates;
  let allCoords = [];

  function flattenCoords(coords) {
    if (Array.isArray(coords[0])) {
      coords.forEach(flattenCoords);
    } else {
      allCoords.push(coords);
    }
  }

  flattenCoords(coordinates);

  const lngs = allCoords.map(c => c[0]);
  const lats = allCoords.map(c => c[1]);

  return [
    Math.min(...lats),  // south
    Math.max(...lats),  // north
    Math.min(...lngs),  // west
    Math.max(...lngs)   // east
  ];
}

/**
 * Validate bounding box
 */
export function validateBBox(bbox) {
  const [south, north, west, east] = bbox;
  
  if (south >= north) throw new Error('Invalid bbox: south >= north');
  if (west >= east) throw new Error('Invalid bbox: west >= east');
  if (south < -90 || north > 90) throw new Error('Invalid latitude range');
  if (west < -180 || east > 180) throw new Error('Invalid longitude range');
  
  return true;
}

// ==================== EXPORT ====================

const dataFetchers = {
  geocodeCity,
  fetchCityBoundary,
  fetchFoodOutlets,
  fetchNASAPopulation,
  fetchNASANDVI,
  fetchNASALST,
  fetchNASAPower,
  fetchAllCityData,
  calculateBBox,
  validateBBox
};

export default dataFetchers;

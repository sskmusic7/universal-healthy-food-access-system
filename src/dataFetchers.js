// dataFetchers.js - Universal Data Fetching Module
// Works for any city worldwide

import axios from 'axios';

// Base APIs
const OVERPASS_API = 'https://overpass-api.de/api/interpreter';
const NOMINATIM_API = 'https://nominatim.openstreetmap.org';

// NASA APIs Configuration
const NASA_EARTHDATA_TOKEN = process.env.REACT_APP_NASA_EARTHDATA_TOKEN;
const NASA_CMR_API = 'https://cmr.earthdata.nasa.gov/search/granules.json';
const NASA_SEDAC_API = 'https://sedac.ciesin.columbia.edu/data/set/gpw-v4-population-density-adjusted-to-2015-unwpp-country-totals-rev11/wfs';
const NASA_POWER_API = 'https://power.larc.nasa.gov/api/temporal/daily/point';

// Create axios instance with SEDAC config
// Commented out as we're using direct axios calls with specific configs
// const sedacAxios = axios.create({
//   baseURL: NASA_SEDAC_API,
//   timeout: 60000,
//   headers: {
//     'Authorization': `Bearer ${NASA_EARTHDATA_TOKEN}`,
//     'Accept': 'application/json',
//     'Client-Id': 'HealthyFoodAccessSystem'
//   }
// });

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
 */
export async function geocodeCity(cityName) {
  try {
    const response = await axios.get(`${NOMINATIM_API}/search`, {
      params: {
        q: cityName,
        format: 'json',
        limit: 1,
        polygon_geojson: 1
      },
      headers: {
        'User-Agent': 'HealthyFoodAccessSystem/1.0'
      }
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
 */
export async function fetchFoodOutlets(bbox) {
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
      headers: { 'Content-Type': 'text/plain' }
    });

    const outlets = response.data.elements.map(element => {
      const lat = element.lat || element.center?.lat;
      const lng = element.lon || element.center?.lon;
      
      return {
        id: element.id,
        name: element.tags?.name || 'Unnamed',
        lat,
        lng,
        type: classifyOutlet(element.tags),
        rawType: element.tags?.shop || element.tags?.amenity,
        tags: element.tags,
        classification: getOutletClassification(element.tags)
      };
    }).filter(outlet => outlet.lat && outlet.lng); // Remove invalid coords

    return outlets;
  } catch (error) {
    console.error('Food outlets fetch error:', error);
    throw error;
  }
}

/**
 * Classify outlet as healthy, mixed, or unhealthy
 */
function classifyOutlet(tags) {
  const shop = tags?.shop;
  const amenity = tags?.amenity;

  // Healthy primary
  if (['supermarket', 'greengrocer', 'farm', 'health_food'].includes(shop)) {
    return 'healthy_primary';
  }
  if (amenity === 'marketplace') return 'healthy_primary';

  // Unhealthy
  if (amenity === 'fast_food') return 'unhealthy';
  if (shop === 'alcohol') return 'unhealthy';

  // Mixed (needs validation)
  if (['grocery', 'convenience', 'butcher', 'fishmonger'].includes(shop)) {
    return 'mixed';
  }

  return 'unknown';
}

/**
 * Get detailed classification
 */
function getOutletClassification(tags) {
  const type = classifyOutlet(tags);
  
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
        subBoxes.map(subBox => 
          axios.get(NASA_SEDAC_API, {
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
          }).catch(err => ({ data: { features: [] }})) // Continue even if sub-request fails
        )
      );

      // Combine results
      const features = subResults.flatMap(r => r.data?.features || []);
      const result = {
        source: 'SEDAC_GPWv4',
        bbox,
        data: features,
        resolution: '1km',
        timestamp: new Date().toISOString()
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
    
    // Helper function to calculate mean safely
    const calculateMean = (data) => {
      if (!data) return 0;
      const values = Object.values(data);
      return values.length > 0 ? values.reduce((sum, val) => sum + (val || 0), 0) / values.length : 0;
    };

    return {
      source: 'NASA_POWER',
      location: { lat, lng },
      data: {
        ALLSKY_SFC_SW_DWN: {
          mean: calculateMean(parameters.ALLSKY_SFC_SW_DWN),
          values: parameters.ALLSKY_SFC_SW_DWN || {}
        },
        T2M: {
          mean: calculateMean(parameters.T2M),
          values: parameters.T2M || {}
        },
        PRECTOTCORR: {
          mean: calculateMean(parameters.PRECTOTCORR),
          values: parameters.PRECTOTCORR || {}
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
    includePopulation = false, // Requires auth
    includeNDVI = false,       // Requires auth
    includeLST = false,        // Requires auth
    includePower = true        // No auth required
  } = options;

  console.log(`Fetching data for ${cityData.name}...`);

  const results = {
    city: cityData,
    timestamp: new Date().toISOString(),
    data: {}
  };

  try {
    // Always fetch food outlets
    if (includeFoodOutlets) {
      console.log('Fetching food outlets from OpenStreetMap...');
      results.data.foodOutlets = await fetchFoodOutlets(cityData.boundingBox);
      console.log(`✓ Found ${results.data.foodOutlets.length} food outlets`);
    }

    // NASA Power data (no auth needed)
    if (includePower) {
      console.log('Fetching NASA POWER solar/climate data...');
      const today = new Date();
      const lastYear = new Date(today);
      lastYear.setFullYear(today.getFullYear() - 1);
      
      try {
        results.data.power = await fetchNASAPower(
          cityData.lat,
          cityData.lng,
          lastYear.toISOString().split('T')[0],
          today.toISOString().split('T')[0]
        );
        console.log('✓ NASA POWER data retrieved');
      } catch (error) {
        console.warn('⚠ NASA POWER fetch failed, continuing without it');
        results.data.power = null;
      }
    }

    // Optional NASA data (requires authentication)
    if (includePopulation) {
      results.data.population = await fetchNASAPopulation(cityData.boundingBox);
    }
    if (includeNDVI) {
      results.data.ndvi = await fetchNASANDVI(cityData.boundingBox, '2024-01-01', '2024-12-31');
    }
    if (includeLST) {
      results.data.lst = await fetchNASALST(cityData.boundingBox, '2024-06-01', '2024-08-31');
    }

    console.log('✓ All data fetched successfully');
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

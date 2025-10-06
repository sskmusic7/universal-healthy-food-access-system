// dataFetchers.js - Universal Data Fetching Module
// Works for any city worldwide

import axios from 'axios';

const OVERPASS_API = 'https://overpass-api.de/api/interpreter';
const NOMINATIM_API = 'https://nominatim.openstreetmap.org';

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
 * Fetch NASA population density (SEDAC GPWv4) - Enhanced Implementation
 */
export async function fetchNASAPopulation(bbox) {
  // Import the enhanced population service
  const nasaPopulation = await import('./services/nasaPopulation.js');
  
  try {
    console.log('Fetching NASA SEDAC GPWv4 population density data...');
    const data = await nasaPopulation.default.fetchPopulationGrid(bbox);
    console.log('✓ NASA population data retrieved');
    return data;
  } catch (error) {
    console.warn('⚠ NASA population fetch failed, continuing without it');
    return null;
  }
}

/**
 * Fetch NASA NDVI (vegetation index) for urban farming site selection
 */
export async function fetchNASANDVI(bbox, startDate, endDate) {
  // Import the NDVI service
  const nasaNDVI = await import('./services/nasaNDVI.js');
  
  try {
    console.log('Fetching NASA MODIS NDVI data for urban farming analysis...');
    const data = await nasaNDVI.default.fetchNDVIForCity(bbox, startDate, endDate);
    console.log('✓ NASA NDVI data retrieved');
    return data;
  } catch (error) {
    console.warn('⚠ NASA NDVI fetch failed, continuing without it');
    return null;
  }
}

/**
 * Fetch NASA Land Surface Temperature (heat exposure) - Enhanced Implementation
 */
export async function fetchNASALST(bbox, summerMonths) {
  // Import the enhanced LST service
  const nasaLST = await import('./services/nasaLST.js');
  
  try {
    console.log('Fetching NASA MODIS LST data for heat analysis...');
    const data = await nasaLST.default.fetchLSTForCity(bbox, summerMonths);
    console.log('✓ NASA LST data retrieved');
    return data;
  } catch (error) {
    console.warn('⚠ NASA LST fetch failed, continuing without it');
    return null;
  }
}

/**
 * Fetch NASA GPM IMERG precipitation data for urban farming water planning
 */
export async function fetchNASAPrecipitation(bbox, yearRange) {
  // Import the precipitation service
  const nasaPrecipitation = await import('./services/nasaPrecipitation.js');
  
  try {
    console.log('Fetching NASA GPM IMERG precipitation data...');
    const data = await nasaPrecipitation.default.fetchPrecipitationPatterns(bbox, yearRange);
    console.log('✓ NASA precipitation data retrieved');
    return data;
  } catch (error) {
    console.warn('⚠ NASA precipitation fetch failed, continuing without it');
    return null;
  }
}

/**
 * Fetch NASA Black Marble nighttime lights for commercial activity analysis
 */
export async function fetchNASANighttimeLights(bbox, yearRange) {
  // Import the nighttime lights service
  const nasaNighttime = await import('./services/nasaNighttime.js');
  
  try {
    console.log('Fetching NASA Black Marble nighttime lights data...');
    const data = await nasaNighttime.default.fetchNighttimeLights(bbox, yearRange);
    console.log('✓ NASA nighttime lights data retrieved');
    return data;
  } catch (error) {
    console.warn('⚠ NASA nighttime lights fetch failed, continuing without it');
    return null;
  }
}

/**
 * Fetch NASA POWER solar/climate data (for urban farming)
 */
export async function fetchNASAPower(lat, lng, startDate, endDate) {
  const baseUrl = 'https://power.larc.nasa.gov/api/temporal/daily/point';
  
  try {
    console.log(`Fetching NASA POWER data for ${lat}, ${lng} from ${startDate} to ${endDate}`);
    
    const response = await axios.get(baseUrl, {
      params: {
        parameters: 'ALLSKY_SFC_SW_DWN,T2M,PRECTOTCORR', // Solar, temp, precip
        community: 'AG',
        longitude: lng,
        latitude: lat,
        start: startDate.replace(/-/g, ''),
        end: endDate.replace(/-/g, ''),
        format: 'JSON'
      }
    });

    const parameters = response.data.properties.parameter;
    
    const solarMean = parameters.ALLSKY_SFC_SW_DWN ? 
      Object.values(parameters.ALLSKY_SFC_SW_DWN).reduce((sum, val) => sum + val, 0) / Object.keys(parameters.ALLSKY_SFC_SW_DWN).length : 0;
    const tempMean = parameters.T2M ? 
      Object.values(parameters.T2M).reduce((sum, val) => sum + val, 0) / Object.keys(parameters.T2M).length : 0;
    const precipMean = parameters.PRECTOTCORR ? 
      Object.values(parameters.PRECTOTCORR).reduce((sum, val) => sum + val, 0) / Object.keys(parameters.PRECTOTCORR).length : 0;
    
    console.log(`✅ NASA POWER data retrieved: Solar=${solarMean.toFixed(2)}, Temp=${tempMean.toFixed(1)}°C, Precip=${precipMean.toFixed(1)}mm/day`);
    
    return {
      source: 'NASA_POWER',
      location: { lat, lng },
      data: {
        ALLSKY_SFC_SW_DWN: {
          mean: solarMean
        },
        T2M: {
          mean: tempMean
        },
        PRECTOTCORR: {
          mean: precipMean
        }
      },
      units: {
        ALLSKY_SFC_SW_DWN: 'MJ/m^2/day',
        T2M: 'Celsius',
        PRECTOTCORR: 'mm/day'
      }
    };
  } catch (error) {
    console.error('NASA POWER fetch error:', error);
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
    includePower = true,       // No auth required
    includePrecipitation = true, // New service
    includeNighttimeLights = true // New service
  } = options;

  console.log(`Fetching data for ${cityData.name}...`);

  // Convert bounding box array to object format
  const bbox = Array.isArray(cityData.boundingBox) ? {
    south: cityData.boundingBox[0],
    north: cityData.boundingBox[1], 
    west: cityData.boundingBox[2],
    east: cityData.boundingBox[3]
  } : cityData.boundingBox;

  const results = {
    city: cityData,
    timestamp: new Date().toISOString(),
    data: {}
  };

  try {
    // Always fetch food outlets
    if (includeFoodOutlets) {
      console.log('Fetching food outlets from OpenStreetMap...');
      // Convert bbox object back to array format for food outlets
      const bboxArray = [bbox.south, bbox.north, bbox.west, bbox.east];
      results.data.foodOutlets = await fetchFoodOutlets(bboxArray);
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

    // Enhanced NASA data services
    if (includePopulation) {
      console.log('Fetching NASA population density data...');
      try {
        results.data.population = await fetchNASAPopulation(bbox);
        console.log('✓ NASA population data retrieved');
      } catch (error) {
        console.warn('⚠ NASA population fetch failed, continuing without it');
        results.data.population = null;
      }
    }
    
    if (includeNDVI) {
      console.log('Fetching NASA NDVI data...');
      try {
        results.data.ndvi = await fetchNASANDVI(bbox, '2024-01-01', '2024-12-31');
        console.log('✓ NASA NDVI data retrieved');
      } catch (error) {
        console.warn('⚠ NASA NDVI fetch failed, continuing without it');
        results.data.ndvi = null;
      }
    }
    
    if (includeLST) {
      console.log('Fetching NASA LST data...');
      try {
        results.data.lst = await fetchNASALST(bbox, [
          '2024-06-01', '2024-07-01', '2024-08-01'
        ]);
        console.log('✓ NASA LST data retrieved');
      } catch (error) {
        console.warn('⚠ NASA LST fetch failed, continuing without it');
        results.data.lst = null;
      }
    }

    // New NASA services (mock data for now)
    if (includePrecipitation) {
      console.log('Fetching NASA precipitation data...');
      try {
        results.data.precipitation = await fetchNASAPrecipitation(bbox, {
          start: '2024-01-01',
          end: '2024-12-31'
        });
        console.log('✓ NASA precipitation data retrieved');
      } catch (error) {
        console.warn('⚠ NASA precipitation fetch failed, continuing without it');
        results.data.precipitation = null;
      }
    }

    if (includeNighttimeLights) {
      console.log('Fetching NASA nighttime lights data...');
      try {
        results.data.nighttimeLights = await fetchNASANighttimeLights(bbox, {
          start: '2024-01-01',
          end: '2024-12-31'
        });
        console.log('✓ NASA nighttime lights data retrieved');
      } catch (error) {
        console.warn('⚠ NASA nighttime lights fetch failed, continuing without it');
        results.data.nighttimeLights = null;
      }
    }

    // Generate AI solution recommendations
    console.log('Generating AI solution recommendations...');
    try {
      results.data.aiSolution = await generateAISolution(results);
      console.log('✓ AI solution recommendations generated');
    } catch (error) {
      console.warn('⚠ AI solution generation failed, continuing without it');
      results.data.aiSolution = null;
    }

    // Run comprehensive algorithm analysis
    console.log('Running comprehensive algorithm analysis...');
    try {
      const algorithmIntegration = await import('./services/algorithmIntegration.js');
      results.data.algorithmAnalysis = await algorithmIntegration.default.runComprehensiveAnalysis(results);
      console.log('✓ Algorithm analysis completed');
    } catch (error) {
      console.warn('⚠ Algorithm analysis failed, continuing without it');
      results.data.algorithmAnalysis = null;
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

/**
 * Generate AI solution recommendations using Gemini
 */
export async function generateAISolution(cityData) {
  const geminiAI = await import('./services/geminiAI.js');
  try {
    console.log('Generating AI solution recommendations...');
    const solution = await geminiAI.default.generateFoodAccessSolution(cityData);
    console.log('✓ AI solution recommendations generated');
    return solution;
  } catch (error) {
    console.warn('⚠ AI solution generation failed, continuing without it');
    return null;
  }
}

const dataFetchers = {
  geocodeCity,
  fetchCityBoundary,
  fetchFoodOutlets,
  fetchNASAPopulation,
  fetchNASANDVI,
  fetchNASALST,
  fetchNASAPower,
  fetchNASAPrecipitation,
  fetchNASANighttimeLights,
  generateAISolution,
  fetchAllCityData,
  calculateBBox,
  validateBBox
};

export default dataFetchers;

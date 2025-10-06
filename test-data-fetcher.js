// test-data-fetcher.js - Test script for data fetcher functionality
// Run with: node test-data-fetcher.js

const axios = require('axios');

const OVERPASS_API = 'https://overpass-api.de/api/interpreter';
const NOMINATIM_API = 'https://nominatim.openstreetmap.org';

// Test geocoding function
async function testGeocodeCity(cityName) {
  try {
    console.log(`\n🔍 Testing geocoding for: ${cityName}`);
    
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
    const cityData = {
      name: city.display_name.split(',')[0],
      lat: parseFloat(city.lat),
      lng: parseFloat(city.lon),
      boundingBox: city.boundingbox.map(Number),
      boundary: city.geojson,
      osmId: city.osm_id,
      osmType: city.osm_type
    };

    console.log(`✅ City found: ${cityData.name}`);
    console.log(`   Coordinates: ${cityData.lat}, ${cityData.lng}`);
    console.log(`   Bounding Box: ${cityData.boundingBox.join(', ')}`);
    
    return cityData;
  } catch (error) {
    console.error(`❌ Geocoding failed: ${error.message}`);
    throw error;
  }
}

// Test food outlets fetching
async function testFetchFoodOutlets(bbox) {
  try {
    console.log(`\n🍎 Testing food outlets fetch...`);
    
    const [south, north, west, east] = bbox;
    const query = `
      [out:json][timeout:60];
      (
        node["shop"="supermarket"](${south},${west},${north},${east});
        way["shop"="supermarket"](${south},${west},${north},${east});
        node["shop"="greengrocer"](${south},${west},${north},${east});
        node["amenity"="marketplace"](${south},${west},${north},${east});
        node["shop"="farm"](${south},${west},${north},${east});
        node["shop"="health_food"](${south},${west},${north},${east});
        node["shop"="grocery"](${south},${west},${north},${east});
        node["shop"="convenience"](${south},${west},${north},${east});
        way["shop"="convenience"](${south},${west},${north},${east});
        node["shop"="butcher"](${south},${west},${north},${east});
        node["shop"="fishmonger"](${south},${west},${north},${east});
        node["amenity"="fast_food"](${south},${west},${north},${east});
        way["amenity"="fast_food"](${south},${west},${north},${east});
      );
      out center;
    `;

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
        rawType: element.tags?.shop || element.tags?.amenity,
        tags: element.tags
      };
    }).filter(outlet => outlet.lat && outlet.lng);

    console.log(`✅ Found ${outlets.length} food outlets`);
    
    // Show sample outlets
    const sampleOutlets = outlets.slice(0, 5);
    console.log(`   Sample outlets:`);
    sampleOutlets.forEach(outlet => {
      console.log(`   - ${outlet.name} (${outlet.rawType}) at ${outlet.lat.toFixed(4)}, ${outlet.lng.toFixed(4)}`);
    });

    return outlets;
  } catch (error) {
    console.error(`❌ Food outlets fetch failed: ${error.message}`);
    throw error;
  }
}

// Test NASA POWER API with proper validation
async function testNASAPower(lat, lng) {
  try {
    console.log(`\n🌞 Testing NASA POWER API...`);

    const baseUrl = 'https://power.larc.nasa.gov/api/temporal/daily/point';
    const today = new Date();
    const lastYear = new Date(today);
    lastYear.setFullYear(today.getFullYear() - 1);

    const startDate = lastYear.toISOString().split('T')[0].replace(/-/g, '');
    const endDate = today.toISOString().split('T')[0].replace(/-/g, '');

    const response = await axios.get(baseUrl, {
      params: {
        parameters: 'ALLSKY_SFC_SW_DWN,T2M,PRECTOTCORR',
        community: 'AG',
        longitude: lng,
        latitude: lat,
        start: startDate,
        end: endDate,
        format: 'JSON'
      }
    });

    const data = response.data.properties.parameter;

    // Helper to calculate mean, filtering fill values (-999)
    const calculateMean = (dataObj) => {
      if (!dataObj) return null;
      const values = Object.values(dataObj).filter(v => v !== null && v !== undefined && v !== -999);
      if (values.length === 0) return null;
      return values.reduce((sum, val) => sum + val, 0) / values.length;
    };

    // Calculate data quality
    const getDataQuality = (dataObj) => {
      if (!dataObj) return { total: 0, valid: 0, completeness: 0 };
      const allValues = Object.values(dataObj);
      const validValues = allValues.filter(v => v !== null && v !== undefined && v !== -999);
      return {
        total: allValues.length,
        valid: validValues.length,
        completeness: allValues.length > 0 ? (validValues.length / allValues.length) : 0
      };
    };

    const solarMean = calculateMean(data.ALLSKY_SFC_SW_DWN);
    const tempMean = calculateMean(data.T2M);
    const precipMean = calculateMean(data.PRECTOTCORR);

    const solarQuality = getDataQuality(data.ALLSKY_SFC_SW_DWN);
    const tempQuality = getDataQuality(data.T2M);
    const precipQuality = getDataQuality(data.PRECTOTCORR);

    // Validate results
    if (solarMean === null || tempMean === null || precipMean === null) {
      throw new Error('NASA POWER data contains only fill values');
    }

    if (isNaN(solarMean) || isNaN(tempMean) || isNaN(precipMean)) {
      throw new Error('NASA POWER data contains invalid values');
    }

    console.log(`✅ NASA POWER data validated`);
    console.log(`   Solar Irradiance: ${solarMean.toFixed(2)} kW-hr/m²/day (${solarQuality.valid}/${solarQuality.total} valid points)`);
    console.log(`   Avg Temperature: ${tempMean.toFixed(1)}°C (${tempQuality.valid}/${tempQuality.total} valid points)`);
    console.log(`   Precipitation: ${precipMean.toFixed(1)} mm/day (${precipQuality.valid}/${precipQuality.total} valid points)`);

    // Warn about low data quality
    const avgCompleteness = (solarQuality.completeness + tempQuality.completeness + precipQuality.completeness) / 3;
    if (avgCompleteness < 0.5) {
      console.warn(`   ⚠ Low data completeness: ${(avgCompleteness * 100).toFixed(0)}%`);
    }

    return { solarMean, tempMean, precipMean, quality: { solarQuality, tempQuality, precipQuality } };
  } catch (error) {
    console.error(`❌ NASA POWER fetch failed: ${error.message}`);
    throw error;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Universal Data Fetcher Tests\n');
  
  const testCities = [
    'Hull, England',
    'Nairobi, Kenya', 
    'Phoenix, Arizona'
  ];

  for (const cityName of testCities) {
    try {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`Testing: ${cityName}`);
      console.log(`${'='.repeat(50)}`);

      // Test 1: Geocoding
      const cityData = await testGeocodeCity(cityName);
      
      // Test 2: Food Outlets
      const outlets = await testFetchFoodOutlets(cityData.boundingBox);
      
      // Test 3: NASA POWER
      await testNASAPower(cityData.lat, cityData.lng);
      
      console.log(`\n✅ All tests passed for ${cityData.name}!`);
      
    } catch (error) {
      console.log(`\n❌ Tests failed for ${cityName}: ${error.message}`);
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log('🎉 Test suite completed!');
  console.log(`${'='.repeat(50)}`);
}

// Run tests
runTests().catch(console.error);

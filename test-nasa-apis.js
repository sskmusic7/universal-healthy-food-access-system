// test-nasa-apis.js
require('dotenv').config();
const axios = require('axios');
const { fetchNASAPopulation, fetchNASANDVI, fetchNASALST } = require('./src/dataFetchers');

async function testAPI(name, fn, ...args) {
  console.log(`\nTesting ${name}...`);
  try {
    const data = await fn(...args);
    console.log(`✓ ${name} successful:`, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`✗ ${name} failed:`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    } else {
      console.error(`✗ ${name} failed:`, error);
    }
    return false;
  }
}

async function testNASAAPIs() {
  // Test coordinates for Central Park, NYC (smaller area)
  const bbox = [40.7829, 40.7844, -73.9654, -73.9627];
  
  console.log('NASA Earthdata Token:', process.env.REACT_APP_NASA_EARTHDATA_TOKEN ? 'Present' : 'Missing');
  
  const results = await Promise.all([
    testAPI('NASA Population Data', fetchNASAPopulation, bbox),
    testAPI('NASA NDVI', fetchNASANDVI, bbox, '2024-01-01', '2024-12-31'),
    testAPI('NASA LST', fetchNASALST, bbox, '2024-06-01', '2024-08-31')
  ]);
  
  const success = results.filter(r => r).length;
  const failed = results.filter(r => !r).length;
  
  console.log(`\nTest Summary: ${success} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

testNASAAPIs();

// test-bbox-logic.js - Verify bounding box format consistency

console.log('🧪 Testing Bounding Box Logic\n');

// Validation function from dataFetchers.js
function validateBBox(bbox) {
  const [south, north, west, east] = bbox;

  if (south >= north) throw new Error('Invalid bbox: south >= north');
  if (west >= east) throw new Error('Invalid bbox: west >= east');
  if (south < -90 || north > 90) throw new Error('Invalid latitude range');
  if (west < -180 || east > 180) throw new Error('Invalid longitude range');

  return true;
}

// Test cases
const testCases = [
  {
    name: 'Hull, England',
    bbox: [53.7115628, 53.8132477, -0.4225751, -0.2413964],
    valid: true,
    description: 'Valid UK city bbox'
  },
  {
    name: 'Nairobi, Kenya',
    bbox: [-1.4448822, -1.1606749, 36.6647016, 37.1048735],
    valid: true,
    description: 'Valid equatorial city bbox'
  },
  {
    name: 'Phoenix, Arizona',
    bbox: [33.2904827, 33.9183794, -112.3240289, -111.9255304],
    valid: true,
    description: 'Valid US city bbox'
  },
  {
    name: 'Invalid (south >= north)',
    bbox: [50.0, 40.0, -1.0, 1.0],
    valid: false,
    description: 'South greater than north'
  },
  {
    name: 'Invalid (west >= east)',
    bbox: [40.0, 50.0, 1.0, -1.0],
    valid: false,
    description: 'West greater than east'
  },
  {
    name: 'Invalid (latitude out of range)',
    bbox: [-100.0, 50.0, -1.0, 1.0],
    valid: false,
    description: 'Latitude below -90'
  }
];

let passed = 0;
let failed = 0;

console.log('Running bounding box validation tests...\n');

testCases.forEach(({ name, bbox, valid, description }) => {
  try {
    validateBBox(bbox);
    if (valid) {
      console.log(`✅ ${name}: Valid (${description})`);
      console.log(`   BBox: [${bbox.map(n => n.toFixed(4)).join(', ')}]`);
      passed++;
    } else {
      console.log(`❌ ${name}: Should have failed but passed`);
      failed++;
    }
  } catch (error) {
    if (!valid) {
      console.log(`✅ ${name}: Correctly rejected (${description})`);
      console.log(`   Error: ${error.message}`);
      passed++;
    } else {
      console.log(`❌ ${name}: Should have passed but failed`);
      console.log(`   Error: ${error.message}`);
      failed++;
    }
  }
});

console.log(`\n${'='.repeat(60)}`);
console.log(`Test Results: ${passed} passed, ${failed} failed`);
console.log(`${'='.repeat(60)}`);

// Test format conversion for different APIs
console.log('\n🔄 Testing BBox Format Conversions\n');

function convertForOverpass(bbox) {
  const [south, north, west, east] = bbox;
  return `(${south},${west},${north},${east})`; // Overpass order
}

function convertForNASA(bbox) {
  const [south, north, west, east] = bbox;
  return `${west},${south},${east},${north}`; // WGS84 standard
}

const testBBox = [53.7115628, 53.8132477, -0.4225751, -0.2413964];

console.log(`Original format (Nominatim): [south, north, west, east]`);
console.log(`  ${JSON.stringify(testBBox)}\n`);

console.log(`Overpass API format: (south, west, north, east)`);
console.log(`  ${convertForOverpass(testBBox)}\n`);

console.log(`NASA API format: west,south,east,north`);
console.log(`  ${convertForNASA(testBBox)}\n`);

console.log('✅ BBox logic smoke test complete!\n');

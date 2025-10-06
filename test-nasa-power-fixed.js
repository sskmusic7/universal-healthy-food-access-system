// test-nasa-power-fixed.js - Fixed NASA POWER test that properly validates data

const axios = require('axios');

async function testNASAPowerFixed(lat, lng) {
  try {
    console.log(`\n🌞 Testing NASA POWER API (FIXED VERSION)...`);

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

    // FIXED: Properly calculate means
    const calculateMean = (dataObj) => {
      if (!dataObj) {
        throw new Error('Data object is null or undefined');
      }
      const values = Object.values(dataObj);
      if (values.length === 0) {
        throw new Error('No data values found');
      }
      const sum = values.reduce((acc, val) => acc + (val || 0), 0);
      return sum / values.length;
    };

    const solarMean = calculateMean(data.ALLSKY_SFC_SW_DWN);
    const tempMean = calculateMean(data.T2M);
    const precipMean = calculateMean(data.PRECTOTCORR);

    // Validate results
    if (isNaN(solarMean) || isNaN(tempMean) || isNaN(precipMean)) {
      throw new Error('NASA POWER data contains invalid values');
    }

    if (solarMean < 0 || solarMean > 50) {
      throw new Error(`Invalid solar irradiance: ${solarMean} (expected 0-50 kW-hr/m²/day)`);
    }

    if (tempMean < -100 || tempMean > 60) {
      throw new Error(`Invalid temperature: ${tempMean} (expected -100 to 60°C)`);
    }

    console.log(`✅ NASA POWER data validated successfully`);
    console.log(`   Solar Irradiance: ${solarMean.toFixed(2)} kW-hr/m²/day`);
    console.log(`   Avg Temperature: ${tempMean.toFixed(1)}°C`);
    console.log(`   Precipitation: ${precipMean.toFixed(1)} mm/day`);
    console.log(`   Data points: ${Object.keys(data.ALLSKY_SFC_SW_DWN).length} days`);

    return { solarMean, tempMean, precipMean, validated: true };
  } catch (error) {
    console.error(`❌ NASA POWER fetch/validation failed: ${error.message}`);
    throw error;
  }
}

// Compare with broken test
async function testNASAPowerBroken(lat, lng) {
  try {
    console.log(`\n🔴 Testing NASA POWER API (BROKEN VERSION - from original test)...`);

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

    // BROKEN: Tries to access .mean property that doesn't exist
    console.log(`✅ NASA POWER data retrieved`);
    console.log(`   Solar Irradiance: ${data.ALLSKY_SFC_SW_DWN?.mean?.toFixed(2)} kW-hr/m²/day`);
    console.log(`   Avg Temperature: ${data.T2M?.mean?.toFixed(1)}°C`);
    console.log(`   Precipitation: ${data.PRECTOTCORR?.mean?.toFixed(1)} mm/day`);

    return data;
  } catch (error) {
    console.error(`❌ NASA POWER fetch failed: ${error.message}`);
    throw error;
  }
}

async function runComparison() {
  const testLat = 53.7624;
  const testLng = -0.3301;

  console.log('='.repeat(70));
  console.log('NASA POWER API Test Comparison');
  console.log('='.repeat(70));

  // Run broken test
  console.log('\n📋 PART 1: Original Test (False Positive)');
  console.log('-'.repeat(70));
  try {
    await testNASAPowerBroken(testLat, testLng);
    console.log('\n⚠️  ISSUE: Test passed but displayed "undefined" values!');
    console.log('    This is a FALSE POSITIVE - test should have failed.');
  } catch (error) {
    console.log('\n✓ Test properly failed (unexpected)');
  }

  // Run fixed test
  console.log('\n📋 PART 2: Fixed Test (Proper Validation)');
  console.log('-'.repeat(70));
  try {
    const result = await testNASAPowerFixed(testLat, testLng);
    console.log('\n✓ Test passed with validated data!');
  } catch (error) {
    console.log('\n✗ Test failed (this would be a real issue)');
  }

  console.log('\n' + '='.repeat(70));
  console.log('Conclusion:');
  console.log('- Original test gives FALSE POSITIVE (passes with undefined values)');
  console.log('- Fixed test properly validates data and would catch API issues');
  console.log('='.repeat(70) + '\n');
}

runComparison().catch(console.error);

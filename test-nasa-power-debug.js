// test-nasa-power-debug.js - Debug actual NASA POWER API response structure

const axios = require('axios');

async function debugNASAPowerResponse() {
  console.log('🔍 Debugging NASA POWER API Response Structure\n');

  const lat = 53.7624;
  const lng = -0.3301;
  const baseUrl = 'https://power.larc.nasa.gov/api/temporal/daily/point';

  const today = new Date();
  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 7); // Just get 7 days

  const startDate = lastWeek.toISOString().split('T')[0].replace(/-/g, '');
  const endDate = today.toISOString().split('T')[0].replace(/-/g, '');

  try {
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

    console.log('📊 Full Response Structure:');
    console.log(JSON.stringify(response.data, null, 2).slice(0, 1500));

    console.log('\n\n📈 Parameter Data Sample:');
    const params = response.data.properties.parameter;

    // Show first 3 entries of each parameter
    console.log('\n🌞 ALLSKY_SFC_SW_DWN (Solar Irradiance):');
    const solarEntries = Object.entries(params.ALLSKY_SFC_SW_DWN).slice(0, 5);
    solarEntries.forEach(([date, value]) => {
      console.log(`   ${date}: ${value} kW-hr/m²/day`);
    });

    console.log('\n🌡️  T2M (Temperature):');
    const tempEntries = Object.entries(params.T2M).slice(0, 5);
    tempEntries.forEach(([date, value]) => {
      console.log(`   ${date}: ${value}°C`);
    });

    console.log('\n🌧️  PRECTOTCORR (Precipitation):');
    const precipEntries = Object.entries(params.PRECTOTCORR).slice(0, 5);
    precipEntries.forEach(([date, value]) => {
      console.log(`   ${date}: ${value} mm/day`);
    });

    // Calculate means properly
    const calculateMean = (dataObj) => {
      const values = Object.values(dataObj).filter(v => v !== null && v !== -999);
      const sum = values.reduce((acc, val) => acc + val, 0);
      return values.length > 0 ? sum / values.length : null;
    };

    console.log('\n📊 Calculated Statistics:');
    const solarMean = calculateMean(params.ALLSKY_SFC_SW_DWN);
    const tempMean = calculateMean(params.T2M);
    const precipMean = calculateMean(params.PRECTOTCORR);

    console.log(`   Solar Irradiance Mean: ${solarMean?.toFixed(2)} kW-hr/m²/day`);
    console.log(`   Temperature Mean: ${tempMean?.toFixed(1)}°C`);
    console.log(`   Precipitation Mean: ${precipMean?.toFixed(1)} mm/day`);

    // Check for fill values
    const solarValues = Object.values(params.ALLSKY_SFC_SW_DWN);
    const fillValues = solarValues.filter(v => v === -999 || v === null);
    console.log(`\n⚠️  Fill Values Found: ${fillValues.length}/${solarValues.length} entries`);

    if (fillValues.length > 0) {
      console.log('   NASA POWER uses -999 as fill value for missing data');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

debugNASAPowerResponse().catch(console.error);

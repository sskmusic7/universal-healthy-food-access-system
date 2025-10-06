// climateAnalysis.js - Climate data integration for urban farming and infrastructure analysis
// Transforms NASA POWER data into actionable insights

/**
 * Analyze urban farming suitability based on climate data
 * @param {Object} powerData - NASA POWER API response
 * @param {Array} boundingBox - City bounding box [south, north, west, east]
 * @returns {Object} Suitability analysis with scores and recommendations
 */
export function analyzeUrbanFarmingSuitability(powerData, boundingBox) {
  if (!powerData?.data) {
    return { overall: 0, factors: {}, recommendations: [], crops: [] };
  }

  const { ALLSKY_SFC_SW_DWN, T2M, PRECTOTCORR } = powerData.data;

  // Calculate individual factor scores (0-100)
  const solarScore = calculateSolarScore(ALLSKY_SFC_SW_DWN?.mean);
  const tempScore = calculateTemperatureScore(T2M?.mean);
  const waterScore = calculateWaterScore(PRECTOTCORR?.mean);

  // Weighted overall score
  const overall = (solarScore * 0.4 + tempScore * 0.3 + waterScore * 0.3);

  return {
    overall: Math.round(overall),
    factors: {
      solar: Math.round(solarScore),
      temperature: Math.round(tempScore),
      water: Math.round(waterScore)
    },
    category: categorizeUrbanFarmPotential(overall),
    recommendations: generateFarmingRecommendations(solarScore, tempScore, waterScore),
    crops: suggestCrops(T2M?.mean, PRECTOTCORR?.mean),
    infrastructure: identifyInfrastructureNeeds(T2M?.mean, PRECTOTCORR?.mean)
  };
}

/**
 * Identify climate-related vulnerabilities for food preservation
 */
export function identifyClimateVulnerabilities(powerData, foodOutlets) {
  if (!powerData?.data) {
    return { coldStorageNeed: 'UNKNOWN', risks: [] };
  }

  const { T2M, PRECTOTCORR } = powerData.data;
  const avgTemp = T2M?.mean || 20;
  const avgPrecip = PRECTOTCORR?.mean || 2;

  const extremeHeat = avgTemp > 30;
  const veryHot = avgTemp > 35;
  const lowPrecip = avgPrecip < 1;
  const highHumidity = avgPrecip > 5;

  return {
    coldStorageNeed: veryHot ? 'CRITICAL' : extremeHeat ? 'HIGH' : 'NORMAL',
    preservationRisk: calculatePreservationRisk(avgTemp, highHumidity),
    waterScarcity: lowPrecip,
    infrastructureGaps: identifyInfrastructureGaps(extremeHeat, foodOutlets),
    risks: compileRisks(avgTemp, avgPrecip),
    mitigation: generateMitigationStrategies(avgTemp, avgPrecip, foodOutlets)
  };
}

/**
 * Calculate correlation between climate factors and food access
 */
export function analyzeClimateAccessCorrelation(climate, foodAccess) {
  const climateStress = calculateClimateStress(climate);
  const accessVulnerability = 1 - (foodAccess / 100);

  return {
    vulnerabilityIndex: (climateStress * 0.4 + accessVulnerability * 0.6) * 100,
    criticalFactors: identifyCriticalFactors(climate, foodAccess),
    adaptationPriority: determineAdaptationPriority(climateStress, accessVulnerability)
  };
}

// Helper Functions

function calculateSolarScore(solarIrradiance) {
  if (!solarIrradiance) return 50; // Default middle score
  // 6 kWh/m²/day is optimal for most crops
  const optimal = 6;
  const score = Math.min((solarIrradiance / optimal) * 100, 100);
  return Math.max(score, 0);
}

function calculateTemperatureScore(temperature) {
  if (!temperature) return 50;
  // 22°C is optimal for most crops
  const optimal = 22;
  const deviation = Math.abs(temperature - optimal);
  // Lose 5 points per degree of deviation
  const score = Math.max(100 - (deviation * 5), 0);
  return score;
}

function calculateWaterScore(precipitation) {
  if (!precipitation) return 50;
  // 2-4 mm/day is optimal
  const optimalMin = 2;
  const optimalMax = 4;

  if (precipitation >= optimalMin && precipitation <= optimalMax) {
    return 100;
  } else if (precipitation < optimalMin) {
    return Math.max((precipitation / optimalMin) * 100, 0);
  } else {
    // Too much water is also problematic
    const excess = precipitation - optimalMax;
    return Math.max(100 - (excess * 10), 50);
  }
}

function categorizeUrbanFarmPotential(score) {
  if (score >= 80) return 'EXCELLENT';
  if (score >= 60) return 'GOOD';
  if (score >= 40) return 'MODERATE';
  if (score >= 20) return 'CHALLENGING';
  return 'POOR';
}

function generateFarmingRecommendations(solar, temp, water) {
  const recommendations = [];

  // Solar recommendations
  if (solar < 60) {
    recommendations.push({
      type: 'solar',
      priority: 'HIGH',
      action: 'Consider shade-tolerant crops or supplemental LED lighting'
    });
  } else if (solar > 90) {
    recommendations.push({
      type: 'solar',
      priority: 'MEDIUM',
      action: 'Install shade structures for sensitive crops during peak hours'
    });
  }

  // Temperature recommendations
  if (temp < 40) {
    recommendations.push({
      type: 'temperature',
      priority: 'HIGH',
      action: 'Implement greenhouse or polytunnel systems for year-round growing'
    });
  } else if (temp > 80) {
    recommendations.push({
      type: 'temperature',
      priority: 'MEDIUM',
      action: 'Use cooling systems and heat-resistant crop varieties'
    });
  }

  // Water recommendations
  if (water < 50) {
    recommendations.push({
      type: 'water',
      priority: 'CRITICAL',
      action: 'Install drip irrigation and rainwater harvesting systems'
    });
  } else if (water > 90) {
    recommendations.push({
      type: 'water',
      priority: 'LOW',
      action: 'Ensure proper drainage to prevent waterlogging'
    });
  }

  return recommendations;
}

function suggestCrops(temperature, precipitation) {
  const crops = [];

  // Temperature-based suggestions
  if (temperature >= 25) {
    // Warm climate crops
    crops.push(
      { name: 'Tomatoes', suitability: 'HIGH' },
      { name: 'Peppers', suitability: 'HIGH' },
      { name: 'Eggplant', suitability: 'HIGH' },
      { name: 'Okra', suitability: 'MEDIUM' }
    );
  } else if (temperature >= 15) {
    // Temperate crops
    crops.push(
      { name: 'Lettuce', suitability: 'HIGH' },
      { name: 'Spinach', suitability: 'HIGH' },
      { name: 'Carrots', suitability: 'MEDIUM' },
      { name: 'Potatoes', suitability: 'MEDIUM' }
    );
  } else {
    // Cool climate crops
    crops.push(
      { name: 'Kale', suitability: 'HIGH' },
      { name: 'Brussels Sprouts', suitability: 'HIGH' },
      { name: 'Cabbage', suitability: 'MEDIUM' }
    );
  }

  // Precipitation adjustments
  if (precipitation < 1) {
    // Drought-resistant additions
    crops.push(
      { name: 'Beans', suitability: 'MEDIUM' },
      { name: 'Sweet Potatoes', suitability: 'LOW' }
    );
  }

  return crops;
}

function identifyInfrastructureNeeds(temperature, precipitation) {
  const needs = [];

  if (temperature > 30) {
    needs.push({
      type: 'cooling',
      description: 'Refrigerated storage facilities',
      priority: 'HIGH'
    });
  }

  if (precipitation < 1) {
    needs.push({
      type: 'irrigation',
      description: 'Water storage and distribution systems',
      priority: 'CRITICAL'
    });
  }

  if (temperature < 10) {
    needs.push({
      type: 'heating',
      description: 'Greenhouse heating systems',
      priority: 'MEDIUM'
    });
  }

  return needs;
}

function calculatePreservationRisk(temperature, humidity) {
  // Higher temperature and humidity increase spoilage risk
  const tempRisk = Math.min(temperature / 40, 1); // Normalize to 0-1
  const humidityRisk = humidity ? 0.3 : 0;

  return {
    level: (tempRisk * 0.7 + humidityRisk * 0.3),
    category: tempRisk > 0.7 ? 'HIGH' : tempRisk > 0.4 ? 'MEDIUM' : 'LOW',
    estimatedSpoilageRate: Math.round((tempRisk * 30) + 5) // 5-35% per week
  };
}

function identifyInfrastructureGaps(extremeHeat, outlets) {
  const gaps = [];

  if (extremeHeat) {
    const outletsNeedingCooling = outlets?.filter(o =>
      o.type === 'marketplace' || o.type === 'farm'
    ).length || 0;

    if (outletsNeedingCooling > 0) {
      gaps.push({
        type: 'cold_chain',
        description: `${outletsNeedingCooling} outdoor markets need cooling infrastructure`,
        priority: 'HIGH'
      });
    }
  }

  return gaps;
}

function calculateClimateStress(climate) {
  if (!climate?.data) return 0.5;

  const { T2M, PRECTOTCORR } = climate.data;
  const tempStress = Math.abs((T2M?.mean || 20) - 22) / 20; // Deviation from optimal
  const waterStress = Math.abs((PRECTOTCORR?.mean || 2) - 3) / 3;

  return Math.min((tempStress + waterStress) / 2, 1);
}

function identifyCriticalFactors(climate, foodAccess) {
  const factors = [];

  if (climate?.data?.T2M?.mean > 35 && foodAccess < 50) {
    factors.push('Extreme heat with poor food access creates preservation crisis');
  }

  if (climate?.data?.PRECTOTCORR?.mean < 0.5 && foodAccess < 50) {
    factors.push('Water scarcity limits urban farming potential');
  }

  return factors;
}

function determineAdaptationPriority(climateStress, accessVulnerability) {
  const combined = (climateStress + accessVulnerability) / 2;

  if (combined > 0.75) return 'CRITICAL';
  if (combined > 0.5) return 'HIGH';
  if (combined > 0.25) return 'MEDIUM';
  return 'LOW';
}

function compileRisks(temperature, precipitation) {
  const risks = [];

  if (temperature > 35) {
    risks.push({
      type: 'heat',
      description: 'Extreme heat threatens food preservation',
      severity: 'HIGH'
    });
  }

  if (precipitation < 0.5) {
    risks.push({
      type: 'drought',
      description: 'Water scarcity affects food production',
      severity: 'HIGH'
    });
  }

  if (precipitation > 10) {
    risks.push({
      type: 'flooding',
      description: 'Flood risk to food infrastructure',
      severity: 'MEDIUM'
    });
  }

  return risks;
}

function generateMitigationStrategies(temperature, precipitation, outlets) {
  const strategies = [];

  if (temperature > 30) {
    strategies.push({
      strategy: 'Establish solar-powered cold storage hubs',
      impact: 'HIGH',
      cost: 'MEDIUM',
      timeframe: '3-6 months'
    });
  }

  if (precipitation < 1) {
    strategies.push({
      strategy: 'Implement rainwater harvesting for urban farms',
      impact: 'HIGH',
      cost: 'LOW',
      timeframe: '1-3 months'
    });
  }

  if (outlets?.length < 10) {
    strategies.push({
      strategy: 'Mobile farmers markets with refrigerated trucks',
      impact: 'MEDIUM',
      cost: 'LOW',
      timeframe: '1 month'
    });
  }

  return strategies;
}

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  analyzeUrbanFarmingSuitability,
  identifyClimateVulnerabilities,
  analyzeClimateAccessCorrelation
};
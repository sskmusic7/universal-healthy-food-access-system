// Intervention Site Optimization Algorithm
// Evidence-based site scoring for urban planning decision support

class InterventionSiteAlgorithm {
  constructor() {
    this.interventionTypes = {
      urban_farm: {
        weights: { vegetation: 0.4, solar: 0.3, water: 0.2, accessibility: 0.1 },
        minScore: 0.6,
        description: 'Urban farming and community garden sites'
      },
      supermarket: {
        weights: { population: 0.4, accessibility: 0.3, demand: 0.3 },
        minScore: 0.7,
        description: 'Large-scale food retail locations'
      },
      farmers_market: {
        weights: { population: 0.3, accessibility: 0.4, visibility: 0.3 },
        minScore: 0.5,
        description: 'Temporary or permanent farmers market sites'
      },
      mobile_market: {
        weights: { demand: 0.5, accessibility: 0.3, safety: 0.2 },
        minScore: 0.4,
        description: 'Mobile food market stop locations'
      },
      food_hub: {
        weights: { accessibility: 0.4, population: 0.3, infrastructure: 0.3 },
        minScore: 0.6,
        description: 'Food distribution and processing hubs'
      }
    };
  }

  /**
   * Score potential intervention site using NASA data and local factors
   * @param {Object} site - Site coordinates and basic info
   * @param {string} interventionType - Type of intervention
   * @param {Object} nasaData - NASA Earth observation data
   * @param {Object} localData - Local context data
   * @returns {Object} Site suitability score and recommendations
   */
  scoreInterventionSite(site, interventionType, nasaData, localData = {}) {
    try {
      if (!this.interventionTypes[interventionType]) {
        throw new Error(`Unknown intervention type: ${interventionType}`);
      }

      const config = this.interventionTypes[interventionType];
      const scores = {};

      // Calculate individual factor scores
      if (interventionType === 'urban_farm') {
        scores.vegetation = this.scoreVegetationSuitability(site, nasaData);
        scores.solar = this.scoreSolarIrradiance(site, nasaData);
        scores.water = this.scoreWaterAvailability(site, nasaData);
        scores.accessibility = this.scoreAccessibility(site, localData);
      }

      if (interventionType === 'supermarket') {
        scores.population = this.scorePopulationDensity(site, nasaData);
        scores.accessibility = this.scoreTransportAccess(site, localData);
        scores.demand = this.scoreFoodDesertDemand(site, localData);
      }

      if (interventionType === 'farmers_market') {
        scores.population = this.scorePopulationDensity(site, nasaData);
        scores.accessibility = this.scorePedestrianAccess(site, localData);
        scores.visibility = this.scoreSiteVisibility(site, localData);
      }

      if (interventionType === 'mobile_market') {
        scores.demand = this.scoreFoodDesertDemand(site, localData);
        scores.accessibility = this.scoreVehicleAccess(site, localData);
        scores.safety = this.scoreSiteSafety(site, localData);
      }

      if (interventionType === 'food_hub') {
        scores.accessibility = this.scoreLogisticsAccess(site, localData);
        scores.population = this.scoreServiceArea(site, nasaData);
        scores.infrastructure = this.scoreInfrastructureReadiness(site, localData);
      }

      // Calculate weighted composite score
      const compositeScore = this.calculateWeightedScore(scores, config.weights);
      
      // Determine suitability level
      const suitability = this.assessSuitability(compositeScore, config.minScore);
      
      // Generate evidence-based recommendations
      const recommendations = this.generateSiteRecommendations(
        site, interventionType, scores, suitability, nasaData
      );

      return {
        siteId: site.id || `${site.lat}_${site.lng}`,
        interventionType,
        compositeScore: Math.round(compositeScore * 100) / 100,
        suitability: suitability.level,
        confidence: suitability.confidence,
        factorScores: scores,
        evidence: this.generateEvidenceSummary(site, nasaData, scores),
        recommendations,
        nextSteps: this.generateNextSteps(suitability.level, interventionType)
      };

    } catch (error) {
      console.error("Error scoring intervention site:", error);
      return this.getDefaultScore(site, interventionType);
    }
  }

  /**
   * Score vegetation suitability for urban farming (NASA NDVI)
   */
  scoreVegetationSuitability(site, nasaData) {
    if (!nasaData.ndvi || !nasaData.ndvi.analysis) {
      return 0.5; // Neutral if no data
    }

    const avgNDVI = nasaData.ndvi.analysis.averageNDVI;
    const excellentSites = nasaData.ndvi.analysis.excellentFarmingSites;
    const goodSites = nasaData.ndvi.analysis.goodFarmingSites;

    // Base score from NDVI value
    let score = Math.max(0, Math.min(1, avgNDVI));
    
    // Bonus for high farming suitability areas
    if (excellentSites > 5) score += 0.2;
    else if (goodSites > 10) score += 0.1;
    
    return Math.min(1, score);
  }

  /**
   * Score solar irradiance for urban farming (NASA POWER)
   */
  scoreSolarIrradiance(site, nasaData) {
    if (!nasaData.power || !nasaData.power.data) {
      return 0.5; // Neutral if no data
    }

    const solarIrradiance = nasaData.power.data.ALLSKY_SFC_SW_DWN?.mean || 0;
    
    // Optimal range for urban farming: 4-6 kWh/m²/day
    if (solarIrradiance >= 5) return 1.0;
    if (solarIrradiance >= 4) return 0.8;
    if (solarIrradiance >= 3) return 0.6;
    if (solarIrradiance >= 2) return 0.4;
    return 0.2;
  }

  /**
   * Score water availability (NASA Precipitation)
   */
  scoreWaterAvailability(site, nasaData) {
    if (!nasaData.precipitation || !nasaData.precipitation.analysis) {
      return 0.5; // Neutral if no data
    }

    const annualPrecip = nasaData.precipitation.analysis.averageAnnualPrecipitation;
    const dryDays = nasaData.precipitation.analysis.averageDryDays;
    
    let score = 0.5;
    
    // Precipitation factor
    if (annualPrecip > 1000) score += 0.3;
    else if (annualPrecip > 600) score += 0.2;
    else if (annualPrecip > 300) score += 0.1;
    
    // Dry days penalty
    if (dryDays > 200) score -= 0.2;
    else if (dryDays > 150) score -= 0.1;
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Score population density for demand (NASA SEDAC)
   */
  scorePopulationDensity(site, nasaData) {
    if (!nasaData.population || !nasaData.population.analysis) {
      return 0.5; // Neutral if no data
    }

    const density = nasaData.population.analysis.averageDensity;
    const totalPop = nasaData.population.analysis.totalPopulation;
    
    // Higher density = higher demand = better score
    if (density > 5000) return 1.0;
    if (density > 3000) return 0.8;
    if (density > 1000) return 0.6;
    if (density > 500) return 0.4;
    return 0.2;
  }

  /**
   * Score transport accessibility
   */
  scoreTransportAccess(site, localData) {
    // This would integrate with local transit data
    // For now, use distance to city center as proxy
    const distanceToCenter = this.calculateDistanceToCenter(site, localData);
    
    if (distanceToCenter < 2) return 1.0;      // Excellent access
    if (distanceToCenter < 5) return 0.8;      // Good access
    if (distanceToCenter < 10) return 0.6;     // Moderate access
    if (distanceToCenter < 20) return 0.4;     // Poor access
    return 0.2;                                // Very poor access
  }

  /**
   * Score food desert demand
   */
  scoreFoodDesertDemand(site, localData) {
    // This would integrate with food desert analysis
    // For now, use population density as proxy
    const nearbyPopulation = this.estimateNearbyPopulation(site, localData);
    
    if (nearbyPopulation > 10000) return 1.0;
    if (nearbyPopulation > 5000) return 0.8;
    if (nearbyPopulation > 2000) return 0.6;
    if (nearbyPopulation > 1000) return 0.4;
    return 0.2;
  }

  /**
   * Score pedestrian accessibility
   */
  scorePedestrianAccess(site, localData) {
    // Factors: walkability, safety, connectivity
    const walkabilityScore = this.assessWalkability(site, localData);
    const safetyScore = this.assessSafety(site, localData);
    const connectivityScore = this.assessConnectivity(site, localData);
    
    return (walkabilityScore + safetyScore + connectivityScore) / 3;
  }

  /**
   * Score site visibility
   */
  scoreSiteVisibility(site, localData) {
    // Factors: street frontage, signage potential, foot traffic
    const streetFrontage = this.assessStreetFrontage(site, localData);
    const footTraffic = this.assessFootTraffic(site, localData);
    
    return (streetFrontage + footTraffic) / 2;
  }

  /**
   * Score vehicle access for mobile markets
   */
  scoreVehicleAccess(site, localData) {
    // Factors: road access, parking, turning radius
    const roadAccess = this.assessRoadAccess(site, localData);
    const parkingAvailability = this.assessParking(site, localData);
    
    return (roadAccess + parkingAvailability) / 2;
  }

  /**
   * Score site safety
   */
  scoreSiteSafety(site, localData) {
    // Factors: lighting, visibility, crime rates
    const lightingScore = this.assessLighting(site, localData);
    const visibilityScore = this.assessVisibility(site, localData);
    const crimeScore = this.assessCrimeRate(site, localData);
    
    return (lightingScore + visibilityScore + crimeScore) / 3;
  }

  /**
   * Score logistics access for food hubs
   */
  scoreLogisticsAccess(site, localData) {
    // Factors: highway access, loading docks, utilities
    const highwayAccess = this.assessHighwayAccess(site, localData);
    const loadingFacilities = this.assessLoadingFacilities(site, localData);
    const utilityAccess = this.assessUtilityAccess(site, localData);
    
    return (highwayAccess + loadingFacilities + utilityAccess) / 3;
  }

  /**
   * Score service area coverage
   */
  scoreServiceArea(site, nasaData) {
    if (!nasaData.population || !nasaData.population.analysis) {
      return 0.5;
    }

    const totalPop = nasaData.population.analysis.totalPopulation;
    const density = nasaData.population.analysis.averageDensity;
    
    // Higher population in service area = better score
    const serviceAreaPop = this.estimateServiceAreaPopulation(site, totalPop, density);
    
    if (serviceAreaPop > 50000) return 1.0;
    if (serviceAreaPop > 25000) return 0.8;
    if (serviceAreaPop > 10000) return 0.6;
    if (serviceAreaPop > 5000) return 0.4;
    return 0.2;
  }

  /**
   * Score infrastructure readiness
   */
  scoreInfrastructureReadiness(site, localData) {
    // Factors: utilities, zoning, development readiness
    const utilityScore = this.assessUtilityReadiness(site, localData);
    const zoningScore = this.assessZoningCompatibility(site, localData);
    const developmentScore = this.assessDevelopmentReadiness(site, localData);
    
    return (utilityScore + zoningScore + developmentScore) / 3;
  }

  /**
   * Calculate weighted composite score
   */
  calculateWeightedScore(scores, weights) {
    let weightedSum = 0;
    let totalWeight = 0;
    
    Object.keys(weights).forEach(factor => {
      if (scores[factor] !== undefined) {
        weightedSum += scores[factor] * weights[factor];
        totalWeight += weights[factor];
      }
    });
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Assess suitability level
   */
  assessSuitability(compositeScore, minScore) {
    let level, confidence, color, description;
    
    if (compositeScore >= 0.9) {
      level = 'excellent';
      confidence = 'high';
      color = '#32CD32';
      description = 'Excellent site - highly recommended for intervention';
    } else if (compositeScore >= 0.8) {
      level = 'very_good';
      confidence = 'high';
      color = '#90EE90';
      description = 'Very good site - strongly recommended';
    } else if (compositeScore >= minScore) {
      level = 'suitable';
      confidence = 'medium';
      color = '#FFD700';
      description = 'Suitable site - recommended with considerations';
    } else if (compositeScore >= minScore * 0.8) {
      level = 'marginal';
      confidence = 'low';
      color = '#FFA500';
      description = 'Marginal site - requires significant improvements';
    } else {
      level = 'unsuitable';
      confidence = 'high';
      color = '#FF6347';
      description = 'Unsuitable site - not recommended';
    }
    
    return { level, confidence, color, description };
  }

  /**
   * Generate site-specific recommendations
   */
  generateSiteRecommendations(site, interventionType, scores, suitability, nasaData) {
    const recommendations = [];
    
    // General recommendations based on suitability
    if (suitability.level === 'excellent' || suitability.level === 'very_good') {
      recommendations.push({
        type: 'proceed',
        priority: 'high',
        message: 'Site shows strong potential - proceed with detailed planning',
        actions: ['Conduct site survey', 'Engage stakeholders', 'Develop implementation timeline']
      });
    } else if (suitability.level === 'suitable') {
      recommendations.push({
        type: 'proceed_with_conditions',
        priority: 'medium',
        message: 'Site is suitable with some improvements needed',
        actions: ['Address identified weaknesses', 'Consider phased implementation', 'Monitor progress']
      });
    } else {
      recommendations.push({
        type: 'reconsider',
        priority: 'low',
        message: 'Site has significant challenges - consider alternatives',
        actions: ['Look for alternative sites', 'Address major barriers first', 'Consider different intervention type']
      });
    }
    
    // Factor-specific recommendations
    Object.keys(scores).forEach(factor => {
      if (scores[factor] < 0.5) {
        recommendations.push({
          type: 'improvement',
          priority: 'medium',
          message: `Improve ${factor.replace('_', ' ')} score: ${scores[factor].toFixed(2)}`,
          actions: this.getFactorImprovementActions(factor, interventionType)
        });
      }
    });
    
    return recommendations;
  }

  /**
   * Generate evidence summary for planners
   */
  generateEvidenceSummary(site, nasaData, scores) {
    return {
      siteCoordinates: { lat: site.lat, lng: site.lng },
      dataSources: this.identifyDataSources(nasaData),
      scoreBreakdown: scores,
      dataReliability: this.assessDataReliability(nasaData),
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Generate next steps based on suitability
   */
  generateNextSteps(suitabilityLevel, interventionType) {
    const nextSteps = [];
    
    switch (suitabilityLevel) {
      case 'excellent':
      case 'very_good':
        nextSteps.push('Proceed to detailed site analysis');
        nextSteps.push('Engage with local stakeholders');
        nextSteps.push('Develop implementation plan');
        break;
      case 'suitable':
        nextSteps.push('Address identified improvement areas');
        nextSteps.push('Conduct additional feasibility studies');
        nextSteps.push('Consider phased implementation');
        break;
      case 'marginal':
        nextSteps.push('Evaluate alternative sites');
        nextSteps.push('Assess cost-benefit of improvements');
        nextSteps.push('Consider different intervention type');
        break;
      case 'unsuitable':
        nextSteps.push('Remove from consideration');
        nextSteps.push('Focus on higher-scoring sites');
        nextSteps.push('Reassess intervention strategy');
        break;
    }
    
    return nextSteps;
  }

  // Helper methods for local data assessment
  calculateDistanceToCenter(site, localData) {
    // Simplified distance calculation
    return Math.random() * 20; // Mock implementation
  }

  estimateNearbyPopulation(site, localData) {
    // Simplified population estimation
    return Math.random() * 15000; // Mock implementation
  }

  assessWalkability(site, localData) { return Math.random(); }
  assessSafety(site, localData) { return Math.random(); }
  assessConnectivity(site, localData) { return Math.random(); }
  assessStreetFrontage(site, localData) { return Math.random(); }
  assessFootTraffic(site, localData) { return Math.random(); }
  assessRoadAccess(site, localData) { return Math.random(); }
  assessParking(site, localData) { return Math.random(); }
  assessLighting(site, localData) { return Math.random(); }
  assessVisibility(site, localData) { return Math.random(); }
  assessCrimeRate(site, localData) { return Math.random(); }
  assessHighwayAccess(site, localData) { return Math.random(); }
  assessLoadingFacilities(site, localData) { return Math.random(); }
  assessUtilityAccess(site, localData) { return Math.random(); }
  assessUtilityReadiness(site, localData) { return Math.random(); }
  assessZoningCompatibility(site, localData) { return Math.random(); }
  assessDevelopmentReadiness(site, localData) { return Math.random(); }

  estimateServiceAreaPopulation(site, totalPop, density) {
    // Simplified service area estimation
    return totalPop * 0.1; // Assume 10% of total population in service area
  }

  identifyDataSources(nasaData) {
    const sources = [];
    if (nasaData.lst) sources.push('NASA MODIS LST');
    if (nasaData.population) sources.push('NASA SEDAC Population');
    if (nasaData.power) sources.push('NASA POWER Solar');
    if (nasaData.precipitation) sources.push('NASA GPM Precipitation');
    if (nasaData.ndvi) sources.push('NASA MODIS NDVI');
    return sources;
  }

  assessDataReliability(nasaData) {
    let reliability = 0;
    let factors = 0;
    
    Object.keys(nasaData).forEach(key => {
      if (nasaData[key] && nasaData[key].analysis) {
        reliability += 0.2;
        factors++;
      }
    });
    
    return {
      score: Math.round(reliability * 100) / 100,
      level: reliability > 0.8 ? 'high' : reliability > 0.6 ? 'medium' : 'low',
      factors: factors
    };
  }

  getFactorImprovementActions(factor, interventionType) {
    const actions = {
      vegetation: ['Improve soil quality', 'Add green infrastructure', 'Consider raised beds'],
      solar: ['Remove shading obstacles', 'Consider solar panels', 'Optimize orientation'],
      water: ['Install irrigation systems', 'Implement rainwater harvesting', 'Improve drainage'],
      population: ['Increase marketing', 'Improve accessibility', 'Extend operating hours'],
      accessibility: ['Improve transport links', 'Add pedestrian infrastructure', 'Enhance connectivity'],
      demand: ['Conduct community surveys', 'Engage local organizations', 'Assess competition']
    };
    
    return actions[factor] || ['Address specific challenges', 'Conduct further analysis'];
  }

  getDefaultScore(site, interventionType) {
    return {
      siteId: site.id || `${site.lat}_${site.lng}`,
      interventionType,
      compositeScore: 0.5,
      suitability: { level: 'unknown', confidence: 'low' },
      factorScores: {},
      evidence: { dataReliability: { score: 0, level: 'low', factors: 0 } },
      recommendations: [],
      nextSteps: ['Conduct additional analysis', 'Gather more data']
    };
  }
}

export default new InterventionSiteAlgorithm();



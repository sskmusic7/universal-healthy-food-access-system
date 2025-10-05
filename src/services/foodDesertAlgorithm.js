// Food Desert Identification Algorithm
// Evidence-based multi-factor scoring for urban planning decision support

class FoodDesertAlgorithm {
  constructor() {
    this.scoringWeights = {
      distance: 0.4,      // Distance to healthy food outlets
      heat: 0.2,          // Heat exposure penalty (NASA LST)
      population: 0.2,    // Population density demand (NASA SEDAC)
      deprivation: 0.2    // Socioeconomic factors
    };
  }

  /**
   * Calculate evidence-based food access score for a given area
   * @param {Object} area - Area data (LSOA/neighborhood)
   * @param {Array} outlets - Available food outlets
   * @param {Object} nasaData - NASA Earth observation data
   * @returns {Object} Access score and classification
   */
  calculateFoodAccessScore(area, outlets, nasaData) {
    try {
      // 1. Distance to nearest healthy food outlet
      const distanceScore = this.calculateDistanceScore(area, outlets);
      
      // 2. Heat exposure penalty (NASA LST data)
      const heatPenalty = this.calculateHeatPenalty(nasaData.lst);
      
      // 3. Population density demand (NASA SEDAC data)
      const demandScore = this.calculateDemandScore(nasaData.population);
      
      // 4. Socioeconomic deprivation factors
      const deprivationScore = this.calculateDeprivationScore(area, nasaData);
      
      // 5. Composite evidence-based score
      const accessScore = this.calculateCompositeScore({
        distance: distanceScore,
        heat: heatPenalty,
        population: demandScore,
        deprivation: deprivationScore
      });
      
      // 6. Classify access level with confidence interval
      const classification = this.classifyAccessLevel(accessScore);
      
      return {
        accessScore: Math.round(accessScore * 100) / 100,
        classification: classification.level,
        confidence: classification.confidence,
        factors: {
          distance: Math.round(distanceScore * 100) / 100,
          heatPenalty: Math.round(heatPenalty * 100) / 100,
          demand: Math.round(demandScore * 100) / 100,
          deprivation: Math.round(deprivationScore * 100) / 100
        },
        evidence: this.generateEvidenceSummary(area, outlets, nasaData, accessScore),
        recommendations: this.generatePlanningRecommendations(classification.level, area, nasaData)
      };
      
    } catch (error) {
      console.error("Error calculating food access score:", error);
      return this.getDefaultScore();
    }
  }

  /**
   * Calculate distance-based access score
   */
  calculateDistanceScore(area, outlets) {
    if (!outlets || outlets.length === 0) {
      return 0; // No outlets = worst possible score
    }

    // Find nearest healthy food outlet
    const healthyOutlets = outlets.filter(outlet => 
      outlet.classification?.label === 'Healthy Food Source' || 
      outlet.classification?.label === 'Mixed Selection'
    );

    if (healthyOutlets.length === 0) {
      return 0.1; // Only unhealthy outlets available
    }

    const nearestDistance = this.findNearestDistance(area, healthyOutlets);
    
    // Convert distance to score (0-1, where 1 is best access)
    // Walking distance thresholds based on urban planning standards
    if (nearestDistance <= 0.5) return 1.0;      // Excellent: <500m
    if (nearestDistance <= 1.0) return 0.8;      // Good: 500m-1km
    if (nearestDistance <= 1.5) return 0.6;      // Moderate: 1-1.5km
    if (nearestDistance <= 2.0) return 0.4;      // Poor: 1.5-2km
    if (nearestDistance <= 3.0) return 0.2;      // Very poor: 2-3km
    return 0.1;                                  // Critical: >3km
  }

  /**
   * Calculate heat exposure penalty using NASA LST data
   */
  calculateHeatPenalty(lstData) {
    if (!lstData || !lstData.analysis) {
      return 1.0; // No penalty if no data
    }

    const avgTemp = lstData.analysis.averageTemperature;
    const walkingBarriers = lstData.analysis.walkingBarriers;
    
    // Heat penalty based on temperature and walking barriers
    let penalty = 1.0;
    
    if (avgTemp > 35) {
      penalty = 0.3; // Extreme heat - major walking barrier
    } else if (avgTemp > 30) {
      penalty = 0.5; // High heat - significant barrier
    } else if (avgTemp > 25) {
      penalty = 0.7; // Moderate heat - some discomfort
    }
    
    // Additional penalty for high number of walking barriers
    if (walkingBarriers > 10) {
      penalty *= 0.8;
    }
    
    return Math.max(0.1, penalty);
  }

  /**
   * Calculate population demand score using NASA SEDAC data
   */
  calculateDemandScore(populationData) {
    if (!populationData || !populationData.analysis) {
      return 0.5; // Neutral if no data
    }

    const density = populationData.analysis.averageDensity;
    const vulnerablePop = populationData.analysis.totalVulnerablePopulation;
    const totalPop = populationData.analysis.totalPopulation;
    
    // Higher density and vulnerable population = higher demand
    let demandScore = 0.5; // Base score
    
    // Density factor (0-0.4)
    if (density > 5000) demandScore += 0.4;
    else if (density > 3000) demandScore += 0.3;
    else if (density > 1000) demandScore += 0.2;
    else if (density > 500) demandScore += 0.1;
    
    // Vulnerability factor (0-0.3)
    const vulnerabilityRatio = vulnerablePop / totalPop;
    if (vulnerabilityRatio > 0.3) demandScore += 0.3;
    else if (vulnerabilityRatio > 0.2) demandScore += 0.2;
    else if (vulnerabilityRatio > 0.1) demandScore += 0.1;
    
    return Math.min(1.0, demandScore);
  }

  /**
   * Calculate socioeconomic deprivation score
   */
  calculateDeprivationScore(area, nasaData) {
    // Use NASA population data to estimate deprivation
    if (!nasaData.population || !nasaData.population.analysis) {
      return 0.5; // Neutral if no data
    }

    const incomeLevel = this.estimateIncomeLevel(nasaData.population);
    const vulnerablePop = nasaData.population.analysis.totalVulnerablePopulation;
    const totalPop = nasaData.population.analysis.totalPopulation;
    
    let deprivationScore = 0.5;
    
    // Income-based adjustment
    switch (incomeLevel) {
      case 'low': deprivationScore = 0.9; break;
      case 'medium_low': deprivationScore = 0.7; break;
      case 'medium': deprivationScore = 0.5; break;
      case 'medium_high': deprivationScore = 0.3; break;
      case 'high': deprivationScore = 0.1; break;
    }
    
    // Vulnerability adjustment
    const vulnerabilityRatio = vulnerablePop / totalPop;
    if (vulnerabilityRatio > 0.3) deprivationScore += 0.2;
    else if (vulnerabilityRatio > 0.2) deprivationScore += 0.1;
    
    return Math.min(1.0, deprivationScore);
  }

  /**
   * Calculate composite evidence-based score
   */
  calculateCompositeScore(factors) {
    const weightedScore = 
      (factors.distance * this.scoringWeights.distance) +
      (factors.heat * this.scoringWeights.heat) +
      (factors.population * this.scoringWeights.population) +
      (factors.deprivation * this.scoringWeights.deprivation);
    
    return Math.max(0, Math.min(1, weightedScore));
  }

  /**
   * Classify access level with confidence assessment
   */
  classifyAccessLevel(accessScore) {
    let level, confidence, color, description;
    
    if (accessScore >= 0.8) {
      level = 'good';
      confidence = 'high';
      color = '#32CD32';
      description = 'Good access - adequate healthy food options available';
    } else if (accessScore >= 0.6) {
      level = 'moderate';
      confidence = 'medium';
      color = '#FFD700';
      description = 'Moderate access - some healthy food options, room for improvement';
    } else if (accessScore >= 0.4) {
      level = 'severe';
      confidence = 'high';
      color = '#FF8C00';
      description = 'Severe access issues - limited healthy food options';
    } else {
      level = 'critical';
      confidence = 'high';
      color = '#DC143C';
      description = 'Critical access issues - food desert conditions';
    }
    
    return { level, confidence, color, description };
  }

  /**
   * Generate evidence summary for planners
   */
  generateEvidenceSummary(area, outlets, nasaData, accessScore) {
    const healthyOutlets = outlets?.filter(o => 
      o.classification?.label === 'Healthy Food Source'
    ).length || 0;
    
    const totalOutlets = outlets?.length || 0;
    const avgTemp = nasaData.lst?.analysis?.averageTemperature || 'N/A';
    const populationDensity = nasaData.population?.analysis?.averageDensity || 'N/A';
    
    return {
      healthyOutletsCount: healthyOutlets,
      totalOutletsCount: totalOutlets,
      healthyOutletRatio: totalOutlets > 0 ? (healthyOutlets / totalOutlets).toFixed(2) : 0,
      averageTemperature: avgTemp,
      populationDensity: populationDensity,
      dataReliability: this.assessDataReliability(nasaData),
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Generate planning recommendations based on classification
   */
  generatePlanningRecommendations(classification, area, nasaData) {
    const recommendations = [];
    
    switch (classification) {
      case 'critical':
        recommendations.push({
          priority: 'urgent',
          type: 'immediate_intervention',
          message: 'Critical food desert - immediate intervention required',
          actions: [
            'Consider emergency food distribution',
            'Fast-track new healthy food outlet permits',
            'Implement mobile market services'
          ]
        });
        break;
        
      case 'severe':
        recommendations.push({
          priority: 'high',
          type: 'zoning_changes',
          message: 'Severe access issues - zoning and policy changes needed',
          actions: [
            'Review zoning for new food outlets',
            'Consider urban farming incentives',
            'Improve public transport to existing outlets'
          ]
        });
        break;
        
      case 'moderate':
        recommendations.push({
          priority: 'medium',
          type: 'improvement_opportunities',
          message: 'Moderate access - opportunities for improvement',
          actions: [
            'Support existing healthy food outlets',
            'Consider community garden programs',
            'Improve walking/cycling infrastructure'
          ]
        });
        break;
        
      case 'good':
        recommendations.push({
          priority: 'low',
          type: 'maintenance',
          message: 'Good access - maintain and monitor',
          actions: [
            'Monitor for changes in outlet availability',
            'Support local food businesses',
            'Consider food waste reduction programs'
          ]
        });
        break;
    }
    
    return recommendations;
  }

  /**
   * Find nearest distance to healthy food outlet
   */
  findNearestDistance(area, outlets) {
    let minDistance = Infinity;
    
    outlets.forEach(outlet => {
      const distance = this.calculateHaversineDistance(
        area.lat, area.lng,
        outlet.lat, outlet.lng
      );
      minDistance = Math.min(minDistance, distance);
    });
    
    return minDistance;
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  calculateHaversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Estimate income level from population data
   */
  estimateIncomeLevel(populationData) {
    if (!populationData || !populationData.analysis) return 'medium';
    
    const density = populationData.analysis.averageDensity;
    const vulnerablePop = populationData.analysis.totalVulnerablePopulation;
    const totalPop = populationData.analysis.totalPopulation;
    
    const vulnerabilityRatio = vulnerablePop / totalPop;
    
    if (density > 5000 && vulnerabilityRatio < 0.2) return 'high';
    if (density > 3000 && vulnerabilityRatio < 0.3) return 'medium_high';
    if (density > 1000) return 'medium';
    if (vulnerabilityRatio > 0.3) return 'low';
    return 'medium_low';
  }

  /**
   * Assess data reliability for transparency
   */
  assessDataReliability(nasaData) {
    let reliability = 0;
    let factors = 0;
    
    if (nasaData.lst && nasaData.lst.analysis) {
      reliability += 0.3;
      factors++;
    }
    
    if (nasaData.population && nasaData.population.analysis) {
      reliability += 0.4;
      factors++;
    }
    
    if (nasaData.power && nasaData.power.data) {
      reliability += 0.2;
      factors++;
    }
    
    if (nasaData.ndvi && nasaData.ndvi.analysis) {
      reliability += 0.1;
      factors++;
    }
    
    return {
      score: Math.round(reliability * 100) / 100,
      level: reliability > 0.8 ? 'high' : reliability > 0.6 ? 'medium' : 'low',
      factors: factors
    };
  }

  /**
   * Get default score when calculation fails
   */
  getDefaultScore() {
    return {
      accessScore: 0.5,
      classification: 'moderate',
      confidence: 'low',
      factors: { distance: 0.5, heat: 1.0, population: 0.5, deprivation: 0.5 },
      evidence: { dataReliability: { score: 0, level: 'low', factors: 0 } },
      recommendations: []
    };
  }
}

export default new FoodDesertAlgorithm();

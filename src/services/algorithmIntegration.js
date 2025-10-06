// Algorithm Integration Service
// Coordinates food desert identification and intervention site optimization

import foodDesertAlgorithm from './foodDesertAlgorithm.js';
import interventionSiteAlgorithm from './interventionSiteAlgorithm.js';
import overlapDetectionAlgorithm from './overlapDetectionAlgorithm.js';

class AlgorithmIntegrationService {
  constructor() {
    this.foodDesertAlgorithm = foodDesertAlgorithm;
    this.interventionAlgorithm = interventionSiteAlgorithm;
  }

  /**
   * Run comprehensive food access analysis for a city
   * @param {Object} cityData - Complete city data including NASA observations
   * @returns {Object} Comprehensive analysis results
   */
  async runComprehensiveAnalysis(cityData) {
    try {
      console.log('Running comprehensive food access analysis...');
      
      const analysis = {
        foodDeserts: await this.identifyFoodDeserts(cityData),
        interventionSites: await this.identifyInterventionSites(cityData),
        recommendations: await this.generateStrategicRecommendations(cityData)
      };

      // Detect overlaps and conflicts
      console.log('Detecting topological overlaps and conflicts...');
      const overlapAnalysis = overlapDetectionAlgorithm.detectOverlaps({
        analysis,
        city: cityData.city,
        data: cityData.data
      });

      const results = {
        city: cityData.city,
        timestamp: new Date().toISOString(),
        analysis,
        overlapAnalysis,
        metadata: {
          dataReliability: this.assessOverallDataReliability(cityData),
          algorithmVersion: '1.0.0',
          processingTime: Date.now()
        }
      };

      console.log('✓ Comprehensive analysis completed');
      return results;

    } catch (error) {
      console.error('Error in comprehensive analysis:', error);
      throw error;
    }
  }

  /**
   * Identify food deserts across the city
   */
  async identifyFoodDeserts(cityData) {
    const { city, data } = cityData;
    
    if (!data.foodOutlets || !data.foodOutlets.length) {
      return {
        status: 'insufficient_data',
        message: 'No food outlet data available for analysis',
        deserts: []
      };
    }

    // Create grid of analysis areas
    const analysisAreas = this.createAnalysisGrid(city.boundingBox);
    
    const foodDeserts = [];
    const accessScores = [];

    for (const area of analysisAreas) {
      try {
        const score = this.foodDesertAlgorithm.calculateFoodAccessScore(
          area, 
          data.foodOutlets, 
          data
        );

        accessScores.push({
          area,
          score: score.accessScore,
          classification: score.classification,
          factors: score.factors
        });

        // Identify critical and severe food deserts
        if (score.classification === 'critical' || score.classification === 'severe') {
          foodDeserts.push({
            id: area.id,
            coordinates: { lat: area.lat, lng: area.lng },
            classification: score.classification,
            accessScore: score.accessScore,
            confidence: score.confidence,
            factors: score.factors,
            evidence: score.evidence,
            recommendations: score.recommendations
          });
        }

      } catch (error) {
        console.warn(`Error analyzing area ${area.id}:`, error);
      }
    }

    // Calculate city-wide statistics
    const statistics = this.calculateFoodDesertStatistics(accessScores, foodDeserts);

    return {
      status: 'completed',
      totalAreas: analysisAreas.length,
      foodDeserts: foodDeserts,
      statistics: statistics,
      accessScoreDistribution: this.calculateAccessScoreDistribution(accessScores)
    };
  }

  /**
   * Identify optimal intervention sites
   */
  async identifyInterventionSites(cityData) {
    const { city, data } = cityData;
    
    // Generate potential intervention sites
    const potentialSites = this.generatePotentialSites(city.boundingBox);
    
    const interventionTypes = [
      'urban_farm',
      'supermarket', 
      'farmers_market',
      'mobile_market',
      'food_hub'
    ];

    const results = {};

    for (const interventionType of interventionTypes) {
      console.log(`Analyzing ${interventionType} sites...`);
      
      const sites = [];
      
      for (const site of potentialSites) {
        try {
          const score = this.interventionAlgorithm.scoreInterventionSite(
            site,
            interventionType,
            data
          );

          // Only include suitable sites
          if (score.suitability.level !== 'unsuitable') {
            sites.push(score);
          }

        } catch (error) {
          console.warn(`Error scoring ${interventionType} site:`, error);
        }
      }

      // Sort by composite score and take top candidates
      sites.sort((a, b) => b.compositeScore - a.compositeScore);
      
      results[interventionType] = {
        totalSites: sites.length,
        topSites: sites.slice(0, 10), // Top 10 sites
        averageScore: this.calculateAverageScore(sites),
        recommendations: this.generateInterventionTypeRecommendations(
          interventionType, 
          sites
        )
      };
    }

    return results;
  }

  /**
   * Generate strategic recommendations
   */
  async generateStrategicRecommendations(cityData) {
    const { data } = cityData;
    
    const recommendations = {
      priority: 'high',
      timeframe: '6-12 months',
      categories: []
    };

    // Population-based recommendations
    if (data.population?.analysis) {
      const popAnalysis = data.population.analysis;
      
      if (popAnalysis.totalVulnerablePopulation > 10000) {
        recommendations.categories.push({
          type: 'vulnerable_population',
          priority: 'critical',
          message: 'Large vulnerable population identified - prioritize targeted interventions',
          actions: [
            'Implement mobile market services in high-vulnerability areas',
            'Develop community food programs',
            'Create emergency food assistance network'
          ],
          nasaEvidence: `Vulnerable population: ${popAnalysis.totalVulnerablePopulation.toLocaleString()} people`
        });
      }
    }

    // Heat-based recommendations
    if (data.lst?.analysis) {
      const heatAnalysis = data.lst.analysis;
      
      if (heatAnalysis.walkingBarriers > 10) {
        recommendations.categories.push({
          type: 'heat_mitigation',
          priority: 'high',
          message: 'Significant heat barriers to food access - implement cooling strategies',
          actions: [
            'Install shaded walkways to food outlets',
            'Implement heat-resistant delivery systems',
            'Create indoor food access points'
          ],
          nasaEvidence: `Walking barriers: ${heatAnalysis.walkingBarriers} zones, Avg temp: ${heatAnalysis.averageTemperature}°C`
        });
      }
    }

    // Urban farming recommendations
    if (data.ndvi?.analysis) {
      const vegAnalysis = data.ndvi.analysis;
      
      if (vegAnalysis.excellentFarmingSites > 5) {
        recommendations.categories.push({
          type: 'urban_farming',
          priority: 'medium',
          message: 'Excellent urban farming potential identified',
          actions: [
            'Develop community garden programs',
            'Support rooftop farming initiatives',
            'Create urban agriculture zoning policies'
          ],
          nasaEvidence: `Excellent farming sites: ${vegAnalysis.excellentFarmingSites}, Avg NDVI: ${vegAnalysis.averageNDVI}`
        });
      }
    }

    // Precipitation-based recommendations
    if (data.precipitation?.analysis) {
      const precipAnalysis = data.precipitation.analysis;
      
      if (precipAnalysis.averageDryDays > 200) {
        recommendations.categories.push({
          type: 'water_management',
          priority: 'medium',
          message: 'High number of dry days - implement water conservation strategies',
          actions: [
            'Install rainwater harvesting systems',
            'Implement drought-resistant crop varieties',
            'Develop water-efficient irrigation systems'
          ],
          nasaEvidence: `Dry days: ${precipAnalysis.averageDryDays}/year, Annual precip: ${precipAnalysis.averageAnnualPrecipitation}mm`
        });
      }
    }

    return recommendations;
  }

  /**
   * Create analysis grid for food desert identification
   */
  createAnalysisGrid(boundingBox) {
    const [south, north, west, east] = boundingBox;
    const latStep = (north - south) / 20; // 20x20 grid
    const lngStep = (east - west) / 20;
    
    const areas = [];
    let id = 0;
    
    for (let i = 0; i < 20; i++) {
      for (let j = 0; j < 20; j++) {
        const lat = south + (i * latStep) + (latStep / 2);
        const lng = west + (j * lngStep) + (lngStep / 2);
        
        areas.push({
          id: `area_${id++}`,
          lat,
          lng,
          bounds: {
            north: south + ((i + 1) * latStep),
            south: south + (i * latStep),
            east: west + ((j + 1) * lngStep),
            west: west + (j * lngStep)
          }
        });
      }
    }
    
    return areas;
  }

  /**
   * Generate potential intervention sites
   */
  generatePotentialSites(boundingBox) {
    const [south, north, west, east] = boundingBox;
    const latStep = (north - south) / 15; // 15x15 grid
    const lngStep = (east - west) / 15;
    
    const sites = [];
    let id = 0;
    
    for (let i = 0; i < 15; i++) {
      for (let j = 0; j < 15; j++) {
        const lat = south + (i * latStep) + (latStep / 2);
        const lng = west + (j * lngStep) + (lngStep / 2);
        
        sites.push({
          id: `site_${id++}`,
          lat,
          lng,
          type: 'potential',
          area: latStep * lngStep // Approximate area in square degrees
        });
      }
    }
    
    return sites;
  }

  /**
   * Calculate food desert statistics
   */
  calculateFoodDesertStatistics(accessScores, foodDeserts) {
    const totalAreas = accessScores.length;
    const criticalDeserts = foodDeserts.filter(d => d.classification === 'critical').length;
    const severeDeserts = foodDeserts.filter(d => d.classification === 'severe').length;
    
    const avgAccessScore = accessScores.reduce((sum, area) => sum + area.score, 0) / totalAreas;
    
    return {
      totalAreas,
      criticalDeserts,
      severeDeserts,
      totalDeserts: criticalDeserts + severeDeserts,
      desertPercentage: ((criticalDeserts + severeDeserts) / totalAreas * 100).toFixed(1),
      averageAccessScore: Math.round(avgAccessScore * 100) / 100,
      criticalPercentage: (criticalDeserts / totalAreas * 100).toFixed(1)
    };
  }

  /**
   * Calculate access score distribution
   */
  calculateAccessScoreDistribution(accessScores) {
    const distribution = {
      excellent: 0,    // > 0.8
      good: 0,         // 0.6 - 0.8
      moderate: 0,     // 0.4 - 0.6
      poor: 0,         // 0.2 - 0.4
      critical: 0      // < 0.2
    };

    accessScores.forEach(area => {
      if (area.score >= 0.8) distribution.excellent++;
      else if (area.score >= 0.6) distribution.good++;
      else if (area.score >= 0.4) distribution.moderate++;
      else if (area.score >= 0.2) distribution.poor++;
      else distribution.critical++;
    });

    return distribution;
  }

  /**
   * Calculate average score for intervention sites
   */
  calculateAverageScore(sites) {
    if (sites.length === 0) return 0;
    
    const totalScore = sites.reduce((sum, site) => sum + site.compositeScore, 0);
    return Math.round((totalScore / sites.length) * 100) / 100;
  }

  /**
   * Generate intervention type recommendations
   */
  generateInterventionTypeRecommendations(interventionType, sites) {
    const topSites = sites.slice(0, 3);
    const avgScore = this.calculateAverageScore(sites);
    
    let recommendation = {
      type: interventionType,
      feasibility: avgScore > 0.7 ? 'high' : avgScore > 0.5 ? 'medium' : 'low',
      topSites: topSites.length,
      averageScore: avgScore
    };

    if (avgScore > 0.8) {
      recommendation.message = `Excellent potential for ${interventionType} - multiple high-scoring sites identified`;
      recommendation.priority = 'high';
    } else if (avgScore > 0.6) {
      recommendation.message = `Good potential for ${interventionType} - several suitable sites available`;
      recommendation.priority = 'medium';
    } else {
      recommendation.message = `Limited potential for ${interventionType} - consider alternative approaches`;
      recommendation.priority = 'low';
    }

    return recommendation;
  }

  /**
   * Assess overall data reliability
   */
  assessOverallDataReliability(cityData) {
    const { data } = cityData;
    let reliability = 0;
    let factors = 0;
    
    const dataSources = [
      'foodOutlets', 'population', 'lst', 'ndvi', 
      'precipitation', 'nighttimeLights', 'power'
    ];
    
    dataSources.forEach(source => {
      if (data[source] && data[source].analysis) {
        reliability += 0.15;
        factors++;
      }
    });
    
    return {
      score: Math.round(reliability * 100) / 100,
      level: reliability > 0.8 ? 'high' : reliability > 0.6 ? 'medium' : 'low',
      factors: factors,
      sources: dataSources.filter(source => data[source] && data[source].analysis)
    };
  }
}

export default new AlgorithmIntegrationService();

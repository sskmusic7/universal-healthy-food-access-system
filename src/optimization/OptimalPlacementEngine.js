// OptimalPlacementEngine.js - Comprehensive spatial optimization for food infrastructure placement
// Uses ALL data sources to suggest optimal locations for ANY food intervention type

import { assessSoilQuality } from '../utils/soilDataIntegration';
// eslint-disable-next-line no-unused-vars
import { analyzeUrbanFarmingSuitability, identifyClimateVulnerabilities } from '../utils/climateAnalysis';
import { calculateWeightedFoodAccess, detectFoodDeserts } from '../utils/accessMetrics';
import { calculateVulnerabilityIndex } from '../utils/vulnerabilityIndex';
import axios from 'axios';

/**
 * Comprehensive Optimal Placement Engine
 * Analyzes all available data to suggest optimal locations for food interventions
 */
export class OptimalPlacementEngine {
  constructor(cityData, existingOutlets, climateData, demographicData = null) {
    this.cityData = cityData;
    this.existingOutlets = existingOutlets;
    this.climateData = climateData;
    this.demographicData = demographicData;

    // Define intervention types with their specific requirements
    this.interventionTypes = this.defineInterventionTypes();

    // Cache for expensive computations
    this.cache = new Map();
  }

  /**
   * Main method: Find optimal locations for all intervention types
   * @param {Object} options - Configuration options
   * @returns {Object} Comprehensive placement recommendations
   */
  async findOptimalPlacements(options = {}) {
    const {
      gridResolution = 0.005,  // ~500m cells
      maxSuggestions = 10,
      interventionTypes = 'all',
      priorityFactors = {}
    } = options;

    console.log('🔍 Analyzing city for optimal intervention placements...');

    // Step 1: Identify all potential locations
    const potentialLocations = await this.identifyPotentialLocations(gridResolution);

    // Step 2: Score each location for each intervention type
    const scoredLocations = await this.scoreLocations(potentialLocations, interventionTypes);

    // Step 3: Apply equity and distribution constraints
    const equitableLocations = this.applyEquityConstraints(scoredLocations, priorityFactors);

    // Step 4: Optimize placement combinations
    const optimizedPlacements = this.optimizePlacements(equitableLocations, maxSuggestions);

    // Step 5: Generate implementation recommendations
    const placementsWithDetails = this.generateRecommendations(optimizedPlacements);

    return {
      placements: placementsWithDetails,
      recommendations: placementsWithDetails,
      impact: this.estimateImpact(placementsWithDetails),
      visualizations: this.prepareVisualizationData(placementsWithDetails)
    };
  }

  /**
   * Define all intervention types with their requirements and scoring criteria
   */
  defineInterventionTypes() {
    return {
      FARMERS_MARKET: {
        name: 'Farmers Market',
        icon: '🌾',
        requirements: {
          minSpace: 2000, // m²
          maxSlope: 5, // degrees
          needsParking: true,
          needsTransit: true,
          outdoorSpace: true
        },
        scoringWeights: {
          accessibility: 0.25,
          population: 0.20,
          competition: 0.15,
          visibility: 0.15,
          parking: 0.10,
          climate: 0.05,
          soil: 0.00,
          equity: 0.10
        },
        preferredDays: ['Saturday', 'Sunday', 'Wednesday'],
        setupCost: 5000,
        operatingCost: 500 // per week
      },

      SUPERMARKET: {
        name: 'Supermarket',
        icon: '🏪',
        requirements: {
          minSpace: 5000, // m²
          maxSlope: 3,
          needsParking: true,
          needsLoading: true,
          indoorSpace: true,
          utilities: ['electricity', 'water', 'sewer']
        },
        scoringWeights: {
          accessibility: 0.20,
          population: 0.25,
          competition: 0.20,
          visibility: 0.10,
          parking: 0.10,
          infrastructure: 0.10,
          equity: 0.05
        },
        setupCost: 500000,
        operatingCost: 50000 // per month
      },

      URBAN_FARM: {
        name: 'Urban Farm',
        icon: '🌱',
        requirements: {
          minSpace: 500, // m²
          maxSlope: 10,
          needsSunlight: true,
          needsWater: true,
          soilQuality: 'moderate',
          outdoorSpace: true
        },
        scoringWeights: {
          soil: 0.25,
          climate: 0.20,
          water: 0.15,
          sunlight: 0.15,
          accessibility: 0.10,
          community: 0.10,
          equity: 0.05
        },
        setupCost: 10000,
        operatingCost: 1000 // per month
      },

      COMMUNITY_GARDEN: {
        name: 'Community Garden',
        icon: '🥬',
        requirements: {
          minSpace: 200, // m²
          needsSunlight: true,
          needsWater: true,
          communitySpace: true
        },
        scoringWeights: {
          soil: 0.20,
          climate: 0.15,
          community: 0.25,
          accessibility: 0.15,
          safety: 0.10,
          equity: 0.15
        },
        setupCost: 3000,
        operatingCost: 200 // per month
      },

      FOOD_HUB: {
        name: 'Food Distribution Hub',
        icon: '📦',
        requirements: {
          minSpace: 3000, // m²
          needsLoading: true,
          coldStorage: true,
          centralLocation: true,
          utilities: ['electricity', 'refrigeration']
        },
        scoringWeights: {
          centrality: 0.25,
          accessibility: 0.20,
          infrastructure: 0.20,
          competition: 0.10,
          climate: 0.10,
          equity: 0.15
        },
        setupCost: 100000,
        operatingCost: 10000 // per month
      },

      MOBILE_MARKET: {
        name: 'Mobile Market Stop',
        icon: '🚐',
        requirements: {
          minSpace: 50, // m² (just parking)
          needsParking: true,
          visibility: true
        },
        scoringWeights: {
          accessibility: 0.30,
          population: 0.25,
          equity: 0.20,
          visibility: 0.15,
          safety: 0.10
        },
        setupCost: 500,
        operatingCost: 100 // per visit
      },

      COMMUNITY_KITCHEN: {
        name: 'Community Kitchen',
        icon: '👨‍🍳',
        requirements: {
          minSpace: 300, // m²
          utilities: ['electricity', 'water', 'gas', 'sewer'],
          indoorSpace: true,
          healthPermit: true
        },
        scoringWeights: {
          community: 0.25,
          accessibility: 0.20,
          population: 0.15,
          infrastructure: 0.15,
          equity: 0.25
        },
        setupCost: 50000,
        operatingCost: 3000 // per month
      },

      FOOD_PANTRY: {
        name: 'Food Pantry',
        icon: '🥫',
        requirements: {
          minSpace: 200, // m²
          storage: true,
          accessibility: true
        },
        scoringWeights: {
          equity: 0.30,
          population: 0.20,
          accessibility: 0.25,
          community: 0.15,
          competition: 0.10
        },
        setupCost: 5000,
        operatingCost: 1000 // per month
      },

      VERTICAL_FARM: {
        name: 'Vertical Farm',
        icon: '🏢',
        requirements: {
          minSpace: 100, // m²
          height: 10, // meters minimum
          utilities: ['electricity', 'water'],
          indoorSpace: true
        },
        scoringWeights: {
          infrastructure: 0.25,
          accessibility: 0.15,
          population: 0.20,
          innovation: 0.15,
          climate: 0.05,
          equity: 0.20
        },
        setupCost: 200000,
        operatingCost: 5000 // per month
      },

      AQUAPONICS: {
        name: 'Aquaponics Facility',
        icon: '🐟',
        requirements: {
          minSpace: 500, // m²
          water: 'high',
          utilities: ['electricity', 'water'],
          expertise: true
        },
        scoringWeights: {
          water: 0.25,
          infrastructure: 0.20,
          climate: 0.15,
          community: 0.15,
          innovation: 0.10,
          equity: 0.15
        },
        setupCost: 75000,
        operatingCost: 3000 // per month
      }
    };
  }

  /**
   * Identify all potential locations in the city
   */
  async identifyPotentialLocations(gridResolution) {
    const [south, north, west, east] = this.cityData.boundingBox;
    const locations = [];

    // Query for vacant lots, parking lots, rooftops, parks
    const vacantSpaces = await this.findVacantSpaces();
    const underutilizedSpaces = await this.findUnderutilizedSpaces();

    // Create grid covering the city
    for (let lat = south; lat < north; lat += gridResolution) {
      for (let lng = west; lng < east; lng += gridResolution) {
        const location = {
          id: `loc_${lat.toFixed(5)}_${lng.toFixed(5)}`,
          center: { lat: lat + gridResolution/2, lng: lng + gridResolution/2 },
          bounds: { south: lat, north: lat + gridResolution, west: lng, east: lng + gridResolution },
          area: this.calculateArea(lat, gridResolution)
        };

        // Check if location is viable (not water, not protected, etc.)
        if (await this.isLocationViable(location)) {
          // Gather all data for this location
          location.data = await this.gatherLocationData(location);
          locations.push(location);
        }
      }
    }

    // Add specific vacant/underutilized spaces
    locations.push(...vacantSpaces, ...underutilizedSpaces);

    console.log(`✓ Identified ${locations.length} potential locations`);
    return locations;
  }

  /**
   * Score each location for each intervention type
   */
  async scoreLocations(locations, requestedTypes) {
    const types = requestedTypes === 'all' ?
      Object.keys(this.interventionTypes) :
      requestedTypes;

    const scoredLocations = [];

    for (const location of locations) {
      const scores = {};

      for (const type of types) {
        const score = await this.scoreLocationForType(location, type);
        if (score.viable) {
          scores[type] = score;
        }
      }

      if (Object.keys(scores).length > 0) {
        scoredLocations.push({
          ...location,
          scores,
          bestUse: this.determineBestUse(scores)
        });
      }
    }

    console.log(`✓ Scored ${scoredLocations.length} viable locations`);
    return scoredLocations;
  }

  /**
   * Score a specific location for a specific intervention type
   */
  async scoreLocationForType(location, type) {
    const intervention = this.interventionTypes[type];
    const { requirements, scoringWeights } = intervention;

    // Check hard requirements
    if (!this.meetsRequirements(location, requirements)) {
      return { viable: false, reason: 'Requirements not met' };
    }

    // Calculate weighted score
    const factors = {};
    let totalScore = 0;

    // Accessibility score
    if (scoringWeights.accessibility > 0) {
      factors.accessibility = this.calculateAccessibilityScore(location);
      totalScore += factors.accessibility * scoringWeights.accessibility;
    }

    // Population/demand score
    if (scoringWeights.population > 0) {
      factors.population = this.calculatePopulationScore(location);
      totalScore += factors.population * scoringWeights.population;
    }

    // Competition score (inverse - less competition is better)
    if (scoringWeights.competition > 0) {
      factors.competition = 1 - this.calculateCompetitionScore(location, type);
      totalScore += factors.competition * scoringWeights.competition;
    }

    // Soil quality score (for farming interventions)
    if (scoringWeights.soil > 0) {
      const soilAssessment = await assessSoilQuality(location.center);
      factors.soil = soilAssessment.suitability.score / 100;
      totalScore += factors.soil * scoringWeights.soil;
    }

    // Climate suitability score
    if (scoringWeights.climate > 0) {
      const climateSuitability = analyzeUrbanFarmingSuitability(
        this.climateData,
        [location.bounds.south, location.bounds.north, location.bounds.west, location.bounds.east]
      );
      factors.climate = climateSuitability.overall / 100;
      totalScore += factors.climate * scoringWeights.climate;
    }

    // Equity score (prioritize underserved areas)
    if (scoringWeights.equity > 0) {
      factors.equity = this.calculateEquityScore(location);
      totalScore += factors.equity * scoringWeights.equity;
    }

    // Infrastructure score
    if (scoringWeights.infrastructure > 0) {
      factors.infrastructure = this.calculateInfrastructureScore(location, requirements);
      totalScore += factors.infrastructure * scoringWeights.infrastructure;
    }

    // Community need score
    if (scoringWeights.community > 0) {
      factors.community = this.calculateCommunityNeedScore(location);
      totalScore += factors.community * scoringWeights.community;
    }

    return {
      viable: true,
      type,
      score: totalScore,
      factors,
      suitabilityCategory: this.categorizeSuitability(totalScore),
      estimatedImpact: this.estimateLocationImpact(location, type, totalScore)
    };
  }

  /**
   * Apply equity constraints to ensure fair distribution
   */
  applyEquityConstraints(scoredLocations, priorityFactors) {
    const {
      equityWeight = 0.3,
      minCoverage = 0.8,
      maxClusterDistance = 2000 // meters
    } = priorityFactors;

    // Identify underserved areas
    const underservedAreas = this.identifyUnderservedAreas();

    // Adjust scores based on proximity to underserved areas
    const adjustedLocations = scoredLocations.map(location => {
      const proximityToUnderserved = this.calculateProximityToUnderserved(
        location,
        underservedAreas
      );

      // Boost scores for locations near underserved areas
      Object.keys(location.scores).forEach(type => {
        const originalScore = location.scores[type].score;
        const equityBoost = proximityToUnderserved * equityWeight;
        location.scores[type].adjustedScore = Math.min(1, originalScore + equityBoost);
        location.scores[type].equityBoost = equityBoost;
      });

      return location;
    });

    // Ensure minimum coverage of underserved areas
    const coverageOptimized = this.ensureMinimumCoverage(
      adjustedLocations,
      underservedAreas,
      minCoverage
    );

    // Prevent over-clustering
    const distributedLocations = this.preventClustering(
      coverageOptimized,
      maxClusterDistance
    );

    console.log(`✓ Applied equity constraints to ${distributedLocations.length} locations`);
    return distributedLocations;
  }

  /**
   * Optimize placement combinations using genetic algorithm
   */
  optimizePlacements(equitableLocations, maxSuggestions) {
    // Initialize genetic algorithm
    const ga = new GeneticOptimizer({
      population: equitableLocations,
      populationSize: 100,
      generations: 200,
      mutationRate: 0.02,
      crossoverRate: 0.7
    });

    // Define fitness function
    ga.setFitnessFunction((solution) => {
      return this.calculateSolutionFitness(solution);
    });

    // Run optimization
    const optimizedSolution = ga.evolve();

    // Extract top suggestions
    const topPlacements = this.extractTopPlacements(
      optimizedSolution,
      maxSuggestions
    );

    console.log(`✓ Optimized to ${topPlacements.length} placement recommendations`);
    return topPlacements;
  }

  /**
   * Calculate comprehensive fitness score for a placement solution
   */
  calculateSolutionFitness(solution) {
    let fitness = 0;

    // Coverage: How well does this solution cover food deserts?
    const coverage = this.calculateCoverage(solution);
    fitness += coverage * 0.25;

    // Equity: How well does it serve underserved populations?
    const equity = this.calculateEquity(solution);
    fitness += equity * 0.25;

    // Efficiency: Cost-benefit ratio
    const efficiency = this.calculateEfficiency(solution);
    fitness += efficiency * 0.20;

    // Diversity: Mix of intervention types
    const diversity = this.calculateDiversity(solution);
    fitness += diversity * 0.15;

    // Synergy: How well do placements complement each other?
    const synergy = this.calculateSynergy(solution);
    fitness += synergy * 0.15;

    return fitness;
  }

  /**
   * Generate detailed recommendations for each placement
   */
  generateRecommendations(placements) {
    return placements.map(placement => {
      const intervention = this.interventionTypes[placement.type];

      return {
        id: placement.id,
        location: placement.location,
        bounds: placement.bounds,
        type: placement.type,
        name: intervention.name,
        icon: intervention.icon,
        score: placement.score,
        factors: placement.factors,
        data: placement.data,
        estimatedImpact: placement.estimatedImpact,
        priority: this.calculatePriority(placement),

        justification: this.generateJustification(placement),

        implementation: {
          setupCost: intervention.setupCost,
          operatingCost: intervention.operatingCost,
          timeframe: this.estimateTimeframe(placement.type),
          requirements: this.detailRequirements(placement, intervention),
          partners: this.suggestPartners(placement)
        },

        expectedImpact: {
          populationServed: placement.estimatedImpact.population,
          foodDesertReduction: placement.estimatedImpact.desertReduction,
          accessImprovement: placement.estimatedImpact.accessScore,
          equityImprovement: placement.estimatedImpact.equityScore,
          jobsCreated: this.estimateJobCreation(placement.type),
          economicImpact: this.estimateEconomicImpact(placement)
        },

        synergies: this.identifySynergies(placement, placements),
        risks: this.identifyRisks(placement),
        successFactors: this.identifySuccessFactors(placement)
      };
    });
  }

  estimateImpact(placements = []) {
    if (!placements.length) {
      return {
        totalPopulationServed: 0,
        foodDesertReduction: 0,
        averageAccessImprovement: 0,
        averageEquityImprovement: 0,
        totalInvestmentNeeded: 0,
        totalJobsCreated: 0,
        economicImpact: 0,
        averageScore: 0,
        priorityBreakdown: {}
      };
    }

    const totals = placements.reduce((acc, placement) => {
      const impact = placement.expectedImpact || placement.estimatedImpact || {};
      const implementation = placement.implementation || {};

      const populationServed = impact.populationServed || impact.population || 0;
      const desertReduction = impact.foodDesertReduction || 0;
      const accessImprovement = impact.accessImprovement || 0;
      const equityImprovement = impact.equityImprovement || 0;
      const jobsCreated = impact.jobsCreated || 0;
      const economicImpact = impact.economicImpact || 0;

      acc.totalPopulationServed += populationServed;
      acc.totalDesertReduction += desertReduction;
      acc.totalAccessImprovement += accessImprovement;
      acc.totalEquityImprovement += equityImprovement;
      acc.totalJobs += jobsCreated;
      acc.totalEconomicImpact += economicImpact;
      acc.totalScore += placement.score || 0;

      const setupCost = implementation.setupCost || 0;
      const annualOps = (implementation.operatingCost || 0) * 12;
      acc.totalInvestment += setupCost + annualOps;

      const priorityKey = placement.priority || 'UNSPECIFIED';
      acc.priorityBreakdown[priorityKey] = (acc.priorityBreakdown[priorityKey] || 0) + 1;

      acc.count += 1;
      return acc;
    }, {
      totalPopulationServed: 0,
      totalDesertReduction: 0,
      totalAccessImprovement: 0,
      totalEquityImprovement: 0,
      totalJobs: 0,
      totalEconomicImpact: 0,
      totalInvestment: 0,
      totalScore: 0,
      priorityBreakdown: {},
      count: 0
    });

    return {
      totalPopulationServed: Math.round(totals.totalPopulationServed),
      foodDesertReduction: Math.min(1, totals.totalDesertReduction),
      averageAccessImprovement: totals.totalAccessImprovement / totals.count,
      averageEquityImprovement: totals.totalEquityImprovement / totals.count,
      totalInvestmentNeeded: Math.round(totals.totalInvestment),
      totalJobsCreated: Math.round(totals.totalJobs),
      economicImpact: Math.round(totals.totalEconomicImpact),
      averageScore: totals.totalScore / totals.count,
      priorityBreakdown: totals.priorityBreakdown
    };
  }

  // Helper methods for data gathering and scoring

  async findVacantSpaces() {
    // Query OpenStreetMap for vacant lots
    try {
      const overpassQuery = `
        [out:json][timeout:25];
        (
          way["landuse"="brownfield"](${this.cityData.boundingBox.join(',')});
          way["landuse"="vacant"](${this.cityData.boundingBox.join(',')});
          way["disused:shop"](${this.cityData.boundingBox.join(',')});
        );
        out center;
      `;

      const response = await axios.post(
        'https://overpass-api.de/api/interpreter',
        overpassQuery,
        { headers: { 'Content-Type': 'text/plain' } }
      );

      return response.data.elements.map(element => ({
        id: `vacant_${element.id}`,
        center: element.center || { lat: element.lat, lng: element.lon },
        tags: element.tags,
        area: element.tags.area || 1000,
        type: 'vacant'
      }));
    } catch (error) {
      console.warn('Could not fetch vacant spaces:', error);
      return [];
    }
  }

  async findUnderutilizedSpaces() {
    // Find parking lots, underused parks, rooftops
    try {
      const overpassQuery = `
        [out:json][timeout:25];
        (
          way["amenity"="parking"]["access"!="private"](${this.cityData.boundingBox.join(',')});
          way["leisure"="park"](${this.cityData.boundingBox.join(',')});
        );
        out center;
      `;

      const response = await axios.post(
        'https://overpass-api.de/api/interpreter',
        overpassQuery,
        { headers: { 'Content-Type': 'text/plain' } }
      );

      return response.data.elements
        .filter(element => {
          // Filter for larger spaces that could be partially converted
          const area = element.tags.area || 0;
          return area > 500; // At least 500m²
        })
        .map(element => ({
          id: `underused_${element.id}`,
          center: element.center || { lat: element.lat, lng: element.lon },
          tags: element.tags,
          area: element.tags.area || 1000,
          type: element.tags.amenity === 'parking' ? 'parking_lot' : 'park',
          conversionPotential: 0.3 // Can convert 30% of space
        }));
    } catch (error) {
      console.warn('Could not fetch underutilized spaces:', error);
      return [];
    }
  }

  async isLocationViable(location) {
    // Check if location is not water body, protected area, etc.
    // This would query land use data
    return true; // Simplified for now
  }

  async gatherLocationData(location) {
    // Gather all relevant data for a location
    const data = {
      landUse: 'mixed', // Would query actual land use
      zoning: 'commercial', // Would query zoning data
      ownership: 'public', // Would query ownership data
      utilities: ['electricity', 'water', 'sewer'], // Would check utility availability
      transit: this.checkTransitAccess(location),
      parking: this.estimateParking(location),
      sunlight: this.estimateSunlight(location),
      slope: 2, // Would calculate from elevation data
      nearestOutlets: this.findNearestOutlets(location)
    };

    return data;
  }

  meetsRequirements(location, requirements) {
    // Check if location meets hard requirements
    if (requirements.minSpace && location.area < requirements.minSpace) {
      return false;
    }

    if (requirements.maxSlope && (location.data?.slope || 0) > requirements.maxSlope) {
      return false;
    }

    if (requirements.utilities) {
      const hasUtilities = requirements.utilities.every(utility =>
        location.data?.utilities?.includes(utility)
      );
      if (!hasUtilities) return false;
    }

    return true;
  }

  calculateAccessibilityScore(location) {
    // Score based on transit access, walkability, road connectivity
    const transitScore = location.data?.transit?.stops?.length > 0 ? 0.5 : 0;
    const roadScore = 0.5; // Would calculate from road network
    return (transitScore + roadScore) / 2;
  }

  calculatePopulationScore(location) {
    // Score based on nearby population density and demographics
    // Would use census data or NASA population data
    return 0.6; // Placeholder
  }

  calculateCompetitionScore(location, type) {
    // Score based on nearby similar interventions
    const nearbyOutlets = location.data?.nearestOutlets || [];
    const competitors = nearbyOutlets.filter(outlet => {
      // Check if outlet is same type
      if (type === 'FARMERS_MARKET' && outlet.type === 'marketplace') return true;
      if (type === 'SUPERMARKET' && outlet.type === 'supermarket') return true;
      if (type === 'URBAN_FARM' && outlet.type === 'farm') return true;
      return false;
    });

    // Less competition is better
    return Math.max(0, 1 - (competitors.length / 10));
  }

  calculateEquityScore(location) {
    // Score based on serving underserved populations
    const vulnerability = calculateVulnerabilityIndex(
      { center: location.center, accessScore: 50 },
      this.existingOutlets,
      this.climateData,
      this.demographicData
    );

    return vulnerability.score / 100;
  }

  calculateInfrastructureScore(location, requirements) {
    // Score based on available infrastructure
    let score = 0.5; // Base score

    if (requirements.utilities) {
      const utilityScore = requirements.utilities.filter(u =>
        location.data?.utilities?.includes(u)
      ).length / requirements.utilities.length;
      score = utilityScore;
    }

    return score;
  }

  calculateCommunityNeedScore(location) {
    // Score based on community vulnerability and food access
    const foodDeserts = detectFoodDeserts(
      this.existingOutlets,
      this.cityData,
      1000
    );

    // Check if location is in or near food desert
    const inDesert = foodDeserts.cells.find(cell =>
      this.isLocationInCell(location, cell)
    );

    return inDesert ? 1.0 : 0.3;
  }

  categorizeSuitability(score) {
    if (score >= 0.8) return 'EXCELLENT';
    if (score >= 0.6) return 'GOOD';
    if (score >= 0.4) return 'MODERATE';
    if (score >= 0.2) return 'FAIR';
    return 'POOR';
  }

  estimateLocationImpact(location, type, score) {
    const intervention = this.interventionTypes[type];

    // Estimate population served based on type and location
    const basePopulation = 1000; // Would calculate from actual population data
    const reachMultiplier = {
      SUPERMARKET: 3,
      FARMERS_MARKET: 2,
      URBAN_FARM: 1.5,
      MOBILE_MARKET: 1,
      FOOD_HUB: 4,
      COMMUNITY_GARDEN: 0.5
    }[type] || 1;

    return {
      population: Math.round(basePopulation * reachMultiplier * score),
      desertReduction: score * 0.2, // 20% max reduction per intervention
      accessScore: score * 30, // Up to 30 point improvement
      equityScore: score * 0.15 // Up to 15% equity improvement
    };
  }

  identifyUnderservedAreas() {
    // Use vulnerability and food desert analysis
    const foodDeserts = detectFoodDeserts(
      this.existingOutlets,
      this.cityData,
      1000
    );

    return foodDeserts.zones.map(zone => ({
      ...zone,
      priority: 'HIGH',
      population: zone.cells.reduce((sum, cell) => sum + (cell.population || 0), 0)
    }));
  }

  calculateProximityToUnderserved(location, underservedAreas) {
    if (underservedAreas.length === 0) return 0;

    // Find distance to nearest underserved area
    const distances = underservedAreas.map(area =>
      this.haversineDistance(location.center, area.center)
    );

    const minDistance = Math.min(...distances);

    // Convert to score (closer is better)
    if (minDistance < 500) return 1.0;
    if (minDistance < 1000) return 0.8;
    if (minDistance < 2000) return 0.5;
    if (minDistance < 5000) return 0.2;
    return 0;
  }

  ensureMinimumCoverage(locations, underservedAreas, minCoverage) {
    // Ensure at least minCoverage of underserved areas have nearby interventions
    const covered = new Set();

    const prioritizedLocations = [...locations].sort((a, b) => {
      // Sort by proximity to uncovered underserved areas
      const aProximity = this.getProximityToUncovered(a, underservedAreas, covered);
      const bProximity = this.getProximityToUncovered(b, underservedAreas, covered);
      return bProximity - aProximity;
    });

    return prioritizedLocations;
  }

  preventClustering(locations, maxClusterDistance) {
    // Prevent too many interventions clustering in same area
    const selected = [];
    const excluded = new Set();

    for (const location of locations) {
      if (excluded.has(location.id)) continue;

      // Check distance to already selected locations
      const tooClose = selected.some(selected =>
        this.haversineDistance(location.center, selected.center) < maxClusterDistance
      );

      if (!tooClose) {
        selected.push(location);

        // Exclude nearby locations
        locations.forEach(other => {
          if (this.haversineDistance(location.center, other.center) < maxClusterDistance / 2) {
            excluded.add(other.id);
          }
        });
      }
    }

    return selected;
  }

  extractTopPlacements(solution, maxSuggestions) {
    // Extract and rank top placement suggestions
    const placements = [];

    solution.forEach(location => {
      // Find best use for this location
      const bestType = location.bestUse.type;
      const score = location.scores[bestType];

      placements.push({
        id: location.id,
        location: location.center,
        bounds: location.bounds,
        type: bestType,
        score: score.adjustedScore || score.score,
        factors: score.factors,
        estimatedImpact: score.estimatedImpact,
        data: location.data
      });
    });

    // Sort by score and return top suggestions
    return placements
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSuggestions);
  }

  calculateCoverage(solution) {
    // Calculate how well solution covers the city
    const coveredCells = new Set();

    solution.forEach(placement => {
      // Mark cells within service radius as covered
      const radius = this.getServiceRadius(placement.type);
      this.getCellsWithinRadius(placement.location, radius).forEach(cellId => {
        coveredCells.add(cellId);
      });
    });

    const totalCells = this.estimateTotalCells();
    return coveredCells.size / totalCells;
  }

  calculateEquity(solution) {
    // Calculate how equitably the solution serves populations
    const servedPopulations = this.calculateServedPopulations(solution);
    const giniCoefficient = this.calculateGini(servedPopulations);
    return 1 - giniCoefficient; // Lower Gini = more equitable
  }

  calculateEfficiency(solution) {
    // Cost-benefit ratio
    const totalCost = solution.reduce((sum, placement) => {
      const intervention = this.interventionTypes[placement.type];
      return sum + intervention.setupCost + (intervention.operatingCost * 12);
    }, 0);

    const totalBenefit = solution.reduce((sum, placement) =>
      sum + (placement.estimatedImpact?.population || 0) * 100, 0
    );

    return totalBenefit / (totalCost || 1);
  }

  calculateDiversity(solution) {
    // Variety of intervention types
    const types = new Set(solution.map(p => p.type));
    return types.size / Object.keys(this.interventionTypes).length;
  }

  calculateSynergy(solution) {
    // How well placements complement each other
    let synergyScore = 0;

    solution.forEach((placement, i) => {
      solution.slice(i + 1).forEach(other => {
        const synergy = this.calculatePairSynergy(placement, other);
        synergyScore += synergy;
      });
    });

    const maxPairs = (solution.length * (solution.length - 1)) / 2;
    return maxPairs > 0 ? synergyScore / maxPairs : 0;
  }

  calculatePairSynergy(placement1, placement2) {
    // Calculate synergy between two placements
    const distance = this.haversineDistance(placement1.location, placement2.location);

    // Different types can complement each other
    if (placement1.type !== placement2.type) {
      // Farm + Market = high synergy
      if ((placement1.type === 'URBAN_FARM' && placement2.type === 'FARMERS_MARKET') ||
          (placement2.type === 'URBAN_FARM' && placement1.type === 'FARMERS_MARKET')) {
        return distance < 1000 ? 1.0 : 0.5;
      }

      // Hub + Distribution points = good synergy
      if (placement1.type === 'FOOD_HUB' || placement2.type === 'FOOD_HUB') {
        return distance < 5000 ? 0.7 : 0.3;
      }
    }

    // Same types should be spread out
    if (placement1.type === placement2.type) {
      return distance > 2000 ? 0.5 : 0;
    }

    return 0.3; // Default moderate synergy
  }

  // Utility methods

  calculateArea(lat, gridSize) {
    const R = 6371000; // Earth's radius in meters
    const latRadians = lat * Math.PI / 180;
    const area = R * R * gridSize * gridSize * Math.cos(latRadians) * (Math.PI / 180) * (Math.PI / 180);
    return area;
  }

  haversineDistance(point1, point2) {
    const R = 6371000;
    const φ1 = point1.lat * Math.PI / 180;
    const φ2 = point2.lat * Math.PI / 180;
    const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
    const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  checkTransitAccess(location) {
    // Would query transit API for nearby stops
    return { stops: [], walkTime: 10 };
  }

  estimateParking(location) {
    // Would analyze nearby parking availability
    return { spaces: 20, type: 'street' };
  }

  estimateSunlight(location) {
    // Would use solar data and building shadows
    return { hours: 6, obstruction: 0.2 };
  }

  findNearestOutlets(location) {
    return this.existingOutlets
      .map(outlet => ({
        ...outlet,
        distance: this.haversineDistance(location.center, outlet)
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
  }

  determineBestUse(scores) {
    let bestType = null;
    let bestScore = 0;

    Object.entries(scores).forEach(([type, scoreData]) => {
      const score = scoreData.adjustedScore || scoreData.score;
      if (score > bestScore) {
        bestScore = score;
        bestType = type;
      }
    });

    return { type: bestType, score: bestScore };
  }

  isLocationInCell(location, cell) {
    return location.center.lat >= cell.bounds.south &&
           location.center.lat <= cell.bounds.north &&
           location.center.lng >= cell.bounds.west &&
           location.center.lng <= cell.bounds.east;
  }

  getProximityToUncovered(location, underservedAreas, covered) {
    const uncovered = underservedAreas.filter(area => !covered.has(area.id));
    if (uncovered.length === 0) return 0;

    const distances = uncovered.map(area =>
      this.haversineDistance(location.center, area.center)
    );

    return 1 / (Math.min(...distances) + 1);
  }

  getServiceRadius(type) {
    const radii = {
      SUPERMARKET: 2000,
      FARMERS_MARKET: 1500,
      URBAN_FARM: 1000,
      MOBILE_MARKET: 800,
      FOOD_HUB: 5000,
      COMMUNITY_GARDEN: 500,
      COMMUNITY_KITCHEN: 1200,
      FOOD_PANTRY: 1500,
      VERTICAL_FARM: 1200,
      AQUAPONICS: 1000
    };
    return radii[type] || 1000;
  }

  getCellsWithinRadius(center, radius) {
    if (!center || !radius || !this.cityData?.boundingBox) {
      return [];
    }

    const [south, north, west, east] = this.cityData.boundingBox;
    const cellSize = 0.01; // ~1 km at equator

    const latRadius = radius / 111320; // meters → degrees latitude
    const lngRadius = radius / (111320 * Math.max(Math.cos(center.lat * Math.PI / 180), 0.1));

    const minLat = Math.max(south, center.lat - latRadius);
    const maxLat = Math.min(north, center.lat + latRadius);
    const minLng = Math.max(west, center.lng - lngRadius);
    const maxLng = Math.min(east, center.lng + lngRadius);

    const cells = new Set();

    for (let lat = minLat; lat <= maxLat; lat += cellSize) {
      for (let lng = minLng; lng <= maxLng; lng += cellSize) {
        const cellCenter = {
          lat: lat + cellSize / 2,
          lng: lng + cellSize / 2
        };

        if (this.haversineDistance(center, cellCenter) <= radius) {
          cells.add(`${lat.toFixed(3)}_${lng.toFixed(3)}`);
        }
      }
    }

    return Array.from(cells);
  }

  estimateTotalCells() {
    const [south, north, west, east] = this.cityData.boundingBox;
    const latCells = (north - south) / 0.01;
    const lngCells = (east - west) / 0.01;
    return Math.round(latCells * lngCells);
  }

  calculateServedPopulations(solution) {
    // Would calculate actual populations served
    return solution.map(p => p.estimatedImpact?.population || 0);
  }

  calculateGini(values) {
    // Calculate Gini coefficient for equity measurement
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    const cumSum = sorted.reduce((acc, val, i) => {
      acc.push((acc[i - 1] || 0) + val);
      return acc;
    }, []);

    const sum = cumSum[n - 1];
    if (sum === 0) return 0;

    const B = cumSum.reduce((sum, cs) => sum + cs, 0) / sum;
    return (n + 1 - 2 * B) / n;
  }

  calculatePriority(placement) {
    if (placement.score >= 0.8) return 'CRITICAL';
    if (placement.score >= 0.6) return 'HIGH';
    if (placement.score >= 0.4) return 'MEDIUM';
    return 'LOW';
  }

  generateJustification(placement) {
    const factors = placement.factors || {};
    const reasons = [];

    if (factors.equity > 0.7) {
      reasons.push('Serves highly vulnerable population');
    }
    if (factors.accessibility > 0.7) {
      reasons.push('Excellent transit and road access');
    }
    if (factors.population > 0.7) {
      reasons.push('High population density area');
    }
    if (factors.competition < 0.3) {
      reasons.push('Fills significant gap in food access');
    }
    if (factors.soil > 0.7) {
      reasons.push('Excellent soil quality for agriculture');
    }
    if (factors.climate > 0.7) {
      reasons.push('Favorable climate conditions');
    }

    return reasons.join('. ');
  }

  estimateTimeframe(type) {
    const timeframes = {
      MOBILE_MARKET: '1 month',
      FARMERS_MARKET: '2-3 months',
      COMMUNITY_GARDEN: '3-4 months',
      URBAN_FARM: '4-6 months',
      FOOD_PANTRY: '2-3 months',
      COMMUNITY_KITCHEN: '4-6 months',
      FOOD_HUB: '6-9 months',
      SUPERMARKET: '12-18 months',
      VERTICAL_FARM: '12-18 months',
      AQUAPONICS: '9-12 months'
    };
    return timeframes[type] || '6 months';
  }

  detailRequirements(placement, intervention) {
    const reqs = [];

    if (intervention.requirements.utilities) {
      reqs.push(`Utilities: ${intervention.requirements.utilities.join(', ')}`);
    }
    if (intervention.requirements.minSpace) {
      reqs.push(`Minimum ${intervention.requirements.minSpace}m² space`);
    }
    if (intervention.requirements.needsParking) {
      reqs.push('Adequate parking required');
    }
    if (placement.data?.soil) {
      reqs.push(`Soil quality: ${placement.data.soil.category}`);
    }

    return reqs;
  }

  suggestPartners(placement) {
    const partners = [];

    switch (placement.type) {
      case 'FARMERS_MARKET':
        partners.push('Local farmers association', 'City markets department');
        break;
      case 'URBAN_FARM':
        partners.push('Agricultural extension', 'Community colleges', 'Master gardeners');
        break;
      case 'COMMUNITY_GARDEN':
        partners.push('Neighborhood associations', 'Parks department');
        break;
      case 'FOOD_HUB':
        partners.push('Food distributors', 'Transportation companies');
        break;
      case 'SUPERMARKET':
        partners.push('Retail chains', 'Economic development agency');
        break;
      case 'COMMUNITY_KITCHEN':
        partners.push('Culinary schools', 'Health department', 'Social services');
        break;
    }

    return partners;
  }

  estimateJobCreation(type) {
    const jobs = {
      FARMERS_MARKET: 10,
      SUPERMARKET: 50,
      URBAN_FARM: 5,
      COMMUNITY_GARDEN: 2,
      FOOD_HUB: 20,
      MOBILE_MARKET: 3,
      COMMUNITY_KITCHEN: 8,
      FOOD_PANTRY: 4,
      VERTICAL_FARM: 15,
      AQUAPONICS: 8
    };
    return jobs[type] || 5;
  }

  estimateEconomicImpact(placement) {
    const multiplier = 1.5; // Economic multiplier effect
    const intervention = this.interventionTypes[placement.type];
    const annualRevenue = intervention.operatingCost * 12 * 3; // Rough estimate
    return Math.round(annualRevenue * multiplier);
  }

  identifySynergies(placement, allPlacements) {
    const synergies = [];
    const nearby = allPlacements.filter(other =>
      other !== placement &&
      this.haversineDistance(placement.location, other.location) < 2000
    );

    nearby.forEach(other => {
      if (placement.type === 'URBAN_FARM' && other.type === 'FARMERS_MARKET') {
        synergies.push(`Supply fresh produce to nearby ${other.name}`);
      }
      if (placement.type === 'FOOD_HUB' && other.type === 'MOBILE_MARKET') {
        synergies.push(`Distribution support for ${other.name}`);
      }
    });

    return synergies;
  }

  identifyRisks(placement) {
    const risks = [];

    if (placement.data?.contamination?.risk === 'HIGH') {
      risks.push('Soil contamination requires remediation');
    }
    if (placement.factors?.competition > 0.7) {
      risks.push('High competition from existing outlets');
    }
    if (placement.factors?.infrastructure < 0.3) {
      risks.push('Limited infrastructure may increase costs');
    }

    return risks;
  }

  identifySuccessFactors(placement) {
    const factors = [];

    if (placement.factors?.community > 0.7) {
      factors.push('Strong community support expected');
    }
    if (placement.factors?.accessibility > 0.8) {
      factors.push('Excellent accessibility ensures high usage');
    }
    if (placement.factors?.equity > 0.8) {
      factors.push('Addresses critical need in underserved area');
    }

    return factors;
  }

  prepareVisualizationData(placements) {
    return {
      markers: placements.map(p => ({
        position: p.location,
        type: p.type,
        icon: p.icon || this.interventionTypes[p.type].icon,
        popup: this.createPopupContent(p)
      })),
      heatmap: this.createImpactHeatmap(placements),
      serviceAreas: this.createServiceAreas(placements)
    };
  }

  createPopupContent(placement) {
    return `
      <h3>${placement.icon || '📍'} ${placement.name || placement.type}</h3>
      <p><strong>Score:</strong> ${Math.round((placement.score || 0) * 100)}%</p>
      <p><strong>People Served:</strong> ${(placement.expectedImpact?.populationServed || placement.estimatedImpact?.population || 0).toLocaleString()}</p>
      <p><strong>Setup Cost:</strong> $${(placement.implementation?.setupCost || 0).toLocaleString()}</p>
    `;
  }

  createImpactHeatmap(placements) {
    // Generate heatmap data for visualization
    return placements.map(p => ({
      lat: p.location.lat,
      lng: p.location.lng,
      intensity: p.score
    }));
  }

  createServiceAreas(placements) {
    // Generate service area polygons
    return placements.map(p => ({
      center: p.location,
      radius: this.getServiceRadius(p.type),
      type: p.type
    }));
  }
}

// Genetic Algorithm Optimizer Helper Class
class GeneticOptimizer {
  constructor(config) {
    this.config = config;
    this.population = this.initializePopulation();
  }

  setFitnessFunction(fn) {
    this.fitnessFunction = fn;
  }

  initializePopulation() {
    // Create initial random solutions
    const population = [];

    for (let i = 0; i < this.config.populationSize; i++) {
      const solution = this.createRandomSolution();
      population.push(solution);
    }

    return population;
  }

  createRandomSolution() {
    // Random subset of locations
    const size = Math.floor(Math.random() * 10) + 5; // 5-15 locations
    const solution = [];

    const available = [...this.config.population];
    for (let i = 0; i < size && available.length > 0; i++) {
      const index = Math.floor(Math.random() * available.length);
      solution.push(available.splice(index, 1)[0]);
    }

    return solution;
  }

  evolve() {
    for (let generation = 0; generation < this.config.generations; generation++) {
      // Evaluate fitness
      const evaluated = this.population.map(individual => ({
        solution: individual,
        fitness: this.fitnessFunction(individual)
      }));

      // Sort by fitness
      evaluated.sort((a, b) => b.fitness - a.fitness);

      // Selection
      const selected = this.selection(evaluated);

      // Crossover and mutation
      const newPopulation = this.createNewGeneration(selected);

      this.population = newPopulation;

      if (generation % 20 === 0) {
        console.log(`GA Generation ${generation}: Best fitness = ${evaluated[0].fitness.toFixed(3)}`);
      }
    }

    // Return best solution
    const final = this.population.map(individual => ({
      solution: individual,
      fitness: this.fitnessFunction(individual)
    }));

    final.sort((a, b) => b.fitness - a.fitness);
    return final[0].solution;
  }

  selection(evaluated) {
    // Tournament selection
    const selected = [];
    const tournamentSize = 3;

    for (let i = 0; i < this.config.populationSize; i++) {
      const tournament = [];
      for (let j = 0; j < tournamentSize; j++) {
        const index = Math.floor(Math.random() * evaluated.length);
        tournament.push(evaluated[index]);
      }
      tournament.sort((a, b) => b.fitness - a.fitness);
      selected.push(tournament[0].solution);
    }

    return selected;
  }

  createNewGeneration(selected) {
    const newPopulation = [];

    // Keep best individuals (elitism)
    newPopulation.push(...selected.slice(0, 5));

    while (newPopulation.length < this.config.populationSize) {
      if (Math.random() < this.config.crossoverRate) {
        // Crossover
        const parent1 = selected[Math.floor(Math.random() * selected.length)];
        const parent2 = selected[Math.floor(Math.random() * selected.length)];
        const child = this.crossover(parent1, parent2);
        newPopulation.push(this.mutate(child));
      } else {
        // Direct copy with mutation
        const parent = selected[Math.floor(Math.random() * selected.length)];
        newPopulation.push(this.mutate([...parent]));
      }
    }

    return newPopulation;
  }

  crossover(parent1, parent2) {
    // Uniform crossover
    const child = [];
    const used = new Set();

    // Take random elements from each parent
    [...parent1, ...parent2].forEach(location => {
      if (!used.has(location.id) && Math.random() < 0.5) {
        child.push(location);
        used.add(location.id);
      }
    });

    return child;
  }

  mutate(solution) {
    if (Math.random() < this.config.mutationRate) {
      // Add or remove a random location
      if (Math.random() < 0.5 && solution.length > 3) {
        // Remove random location
        const index = Math.floor(Math.random() * solution.length);
        solution.splice(index, 1);
      } else if (this.config.population.length > 0) {
        // Add random location
        const available = this.config.population.filter(loc =>
          !solution.some(s => s.id === loc.id)
        );
        if (available.length > 0) {
          const index = Math.floor(Math.random() * available.length);
          solution.push(available[index]);
        }
      }
    }

    return solution;
  }
}

export default OptimalPlacementEngine;

// Overlap Detection and Conflict Resolution Algorithm
// Handles topological overlaps and provides transparent decision support for public consultation

class OverlapDetectionAlgorithm {
  constructor() {
    this.overlapTypes = {
      'urban_farm_water_scarcity': {
        name: 'Urban Farm + Water Scarcity',
        icon: '🌱💧',
        description: 'Excellent farm potential but limited water availability'
      },
      'urban_farm_heat_barrier': {
        name: 'Urban Farm + Heat Barrier',
        icon: '🌱🔥',
        description: 'High farm potential but vulnerable to heat stress'
      },
      'supermarket_delivery_hub': {
        name: 'Supermarket + Delivery Hub',
        icon: '🏬🚚',
        description: 'Dual-use candidate for retail or logistics'
      },
      'food_desert_heat_barrier': {
        name: 'Food Desert + Heat Barrier',
        icon: '🏜️🔥',
        description: 'Critical desert with significant heat penalties'
      },
      'supermarket_urban_farm': {
        name: 'Supermarket + Urban Farm',
        icon: '🏬🌱',
        description: 'Mixed candidate for retail with community farming'
      },
      'multi_use_strategic': {
        name: 'Strategic Multi-Use Zone',
        icon: '🏙️⚖️',
        description: 'Multiple high-suitability interventions require decision'
      }
    };
  }

  /**
   * Detect overlaps and conflicts between different intervention zones
   * @param {Object} algorithmAnalysis - Complete algorithm analysis results
   * @returns {Object} Overlap analysis with conflict zones and recommendations
   */
  detectOverlaps(algorithmAnalysis) {
    try {
      console.log('Detecting topological overlaps and conflicts...');
      
      const overlapZones = [];
      const conflictSummary = {
        totalOverlaps: 0,
        criticalConflicts: 0,
        multiUseZones: 0,
        citizenConsultationRequired: 0
      };

      // Get all analysis areas and intervention sites
      const analysisAreas = this.extractAnalysisAreas(algorithmAnalysis);
      const interventionSites = this.extractInterventionSites(algorithmAnalysis);
      
      // Check each area for overlaps
      for (const area of analysisAreas) {
        const overlaps = this.checkAreaOverlaps(area, algorithmAnalysis);
        if (overlaps.length > 0) {
          overlapZones.push({
            areaId: area.id,
            coordinates: area.coordinates,
            overlaps: overlaps,
            conflictLevel: this.assessConflictLevel(overlaps),
            recommendations: this.generateOverlapRecommendations(overlaps),
            citizenInput: this.requiresCitizenInput(overlaps)
          });
          
          conflictSummary.totalOverlaps++;
          if (overlaps.length >= 3) conflictSummary.multiUseZones++;
          if (this.assessConflictLevel(overlaps) === 'critical') conflictSummary.criticalConflicts++;
          if (this.requiresCitizenInput(overlaps)) conflictSummary.citizenConsultationRequired++;
        }
      }

      // Check intervention site overlaps
      const siteOverlaps = this.checkInterventionSiteOverlaps(interventionSites);
      
      return {
        overlapZones,
        siteOverlaps,
        conflictSummary,
        publicReport: this.generatePublicReport(overlapZones, siteOverlaps),
        councilReport: this.generateCouncilReport(overlapZones, siteOverlaps, conflictSummary)
      };

    } catch (error) {
      console.error('Error detecting overlaps:', error);
      return this.getDefaultOverlapResult();
    }
  }

  /**
   * Check for overlaps in a specific area
   */
  checkAreaOverlaps(area, algorithmAnalysis) {
    const overlaps = [];
    
    // Extract relevant data for this area
    const areaData = this.getAreaData(area, algorithmAnalysis);
    
    // Rule 1: Urban Farm + Water Scarcity
    if (this.checkUrbanFarmWaterConflict(areaData)) {
      overlaps.push({
        type: 'urban_farm_water_scarcity',
        severity: 'high',
        factors: {
          ndvi: areaData.ndvi?.analysis?.averageNDVI || 0,
          precipitation: areaData.precipitation?.analysis?.averageAnnualPrecipitation || 0,
          dryDays: areaData.precipitation?.analysis?.averageDryDays || 0
        },
        evidence: this.generateWaterScarcityEvidence(areaData)
      });
    }

    // Rule 2: Urban Farm + Heat Barrier
    if (this.checkUrbanFarmHeatConflict(areaData)) {
      overlaps.push({
        type: 'urban_farm_heat_barrier',
        severity: 'medium',
        factors: {
          ndvi: areaData.ndvi?.analysis?.averageNDVI || 0,
          temperature: areaData.lst?.analysis?.averageTemperature || 0,
          walkingBarriers: areaData.lst?.analysis?.walkingBarriers || 0
        },
        evidence: this.generateHeatBarrierEvidence(areaData)
      });
    }

    // Rule 3: Food Desert + Heat Barrier
    if (this.checkFoodDesertHeatConflict(areaData)) {
      overlaps.push({
        type: 'food_desert_heat_barrier',
        severity: 'critical',
        factors: {
          accessScore: areaData.foodDesert?.accessScore || 0,
          classification: areaData.foodDesert?.classification || 'unknown',
          temperature: areaData.lst?.analysis?.averageTemperature || 0
        },
        evidence: this.generateFoodDesertHeatEvidence(areaData)
      });
    }

    // Rule 4: Supermarket + Urban Farm (population + vegetation)
    if (this.checkSupermarketUrbanFarmConflict(areaData)) {
      overlaps.push({
        type: 'supermarket_urban_farm',
        severity: 'medium',
        factors: {
          populationDensity: areaData.population?.analysis?.averageDensity || 0,
          ndvi: areaData.ndvi?.analysis?.averageNDVI || 0,
          totalPopulation: areaData.population?.analysis?.totalPopulation || 0
        },
        evidence: this.generateMixedUseEvidence(areaData)
      });
    }

    // Rule 5: Multi-use strategic zones (3+ high suitability scores)
    if (overlaps.length >= 2) {
      overlaps.push({
        type: 'multi_use_strategic',
        severity: 'high',
        factors: {
          overlapCount: overlaps.length,
          combinedSuitability: this.calculateCombinedSuitability(areaData)
        },
        evidence: this.generateMultiUseEvidence(overlaps)
      });
    }

    return overlaps;
  }

  /**
   * Check Urban Farm + Water Scarcity conflict
   */
  checkUrbanFarmWaterConflict(areaData) {
    const ndvi = areaData.ndvi?.analysis?.averageNDVI || 0;
    const precipitation = areaData.precipitation?.analysis?.averageAnnualPrecipitation || 0;
    const dryDays = areaData.precipitation?.analysis?.averageDryDays || 0;
    
    // IF NDVI suitability = Excellent (≥0.7) AND Annual Rainfall < 600mm
    return ndvi >= 0.7 && precipitation < 600;
  }

  /**
   * Check Urban Farm + Heat Barrier conflict
   */
  checkUrbanFarmHeatConflict(areaData) {
    const ndvi = areaData.ndvi?.analysis?.averageNDVI || 0;
    const temperature = areaData.lst?.analysis?.averageTemperature || 0;
    
    // IF NDVI suitability = Excellent (≥0.7) AND Avg Summer Temp ≥ 32°C
    return ndvi >= 0.7 && temperature >= 32;
  }

  /**
   * Check Food Desert + Heat Barrier conflict
   */
  checkFoodDesertHeatConflict(areaData) {
    const classification = areaData.foodDesert?.classification || 'unknown';
    const temperature = areaData.lst?.analysis?.averageTemperature || 0;
    
    // IF Food Desert classification = Critical AND LST = High Heat Zone (>35°C)
    return (classification === 'critical' || classification === 'severe') && temperature > 35;
  }

  /**
   * Check Supermarket + Urban Farm conflict
   */
  checkSupermarketUrbanFarmConflict(areaData) {
    const populationDensity = areaData.population?.analysis?.averageDensity || 0;
    const ndvi = areaData.ndvi?.analysis?.averageNDVI || 0;
    
    // IF Population = High (≥5000/km²) AND NDVI suitability = Excellent (≥0.7)
    return populationDensity >= 5000 && ndvi >= 0.7;
  }

  /**
   * Assess conflict level for an area
   */
  assessConflictLevel(overlaps) {
    const criticalCount = overlaps.filter(o => o.severity === 'critical').length;
    const highCount = overlaps.filter(o => o.severity === 'high').length;
    
    if (criticalCount > 0) return 'critical';
    if (highCount >= 2) return 'high';
    if (highCount >= 1 || overlaps.length >= 3) return 'medium';
    return 'low';
  }

  /**
   * Check if citizen input is required
   */
  requiresCitizenInput(overlaps) {
    // IF multiple high-suitability interventions OR strategic multi-use zone
    return overlaps.some(o => o.type === 'multi_use_strategic') || 
           overlaps.filter(o => o.severity === 'high').length >= 2;
  }

  /**
   * Generate overlap-specific recommendations
   */
  generateOverlapRecommendations(overlaps) {
    const recommendations = [];
    
    overlaps.forEach(overlap => {
      switch (overlap.type) {
        case 'urban_farm_water_scarcity':
          recommendations.push({
            priority: 'high',
            message: 'Excellent farm potential but irrigation required',
            actions: [
              'Install rainwater harvesting systems',
              'Implement drip irrigation technology',
              'Select drought-resistant crop varieties',
              'Consider water storage solutions'
            ],
            nasaEvidence: `NDVI: ${overlap.factors.ndvi.toFixed(2)}, Rainfall: ${overlap.factors.precipitation}mm/year`
          });
          break;
          
        case 'urban_farm_heat_barrier':
          recommendations.push({
            priority: 'medium',
            message: 'High farm potential but heat mitigation needed',
            actions: [
              'Install shade nets or structures',
              'Select heat-tolerant crop varieties',
              'Implement cooling irrigation systems',
              'Consider vertical farming approaches'
            ],
            nasaEvidence: `NDVI: ${overlap.factors.ndvi.toFixed(2)}, Temperature: ${overlap.factors.temperature}°C`
          });
          break;
          
        case 'food_desert_heat_barrier':
          recommendations.push({
            priority: 'critical',
            message: 'Critical food desert with extreme heat barriers',
            actions: [
              'Implement emergency food distribution',
              'Create shaded walkways to existing outlets',
              'Establish indoor food access points',
              'Consider heat-resistant delivery systems'
            ],
            nasaEvidence: `Access Score: ${overlap.factors.accessScore}, Temperature: ${overlap.factors.temperature}°C`
          });
          break;
          
        case 'supermarket_urban_farm':
          recommendations.push({
            priority: 'medium',
            message: 'Mixed-use candidate for retail with community farming',
            actions: [
              'Design supermarket with rooftop garden',
              'Include community farm space in planning',
              'Create integrated food hub concept',
              'Plan for shared infrastructure'
            ],
            nasaEvidence: `Population: ${overlap.factors.populationDensity.toLocaleString()}/km², NDVI: ${overlap.factors.ndvi.toFixed(2)}`
          });
          break;
          
        case 'multi_use_strategic':
          recommendations.push({
            priority: 'high',
            message: 'Strategic multi-use zone requires public consultation',
            actions: [
              'Present options to local council',
              'Conduct citizen consultation meetings',
              'Create public voting mechanism',
              'Develop phased implementation plan'
            ],
            nasaEvidence: `${overlap.factors.overlapCount} overlapping high-suitability interventions`
          });
          break;
      }
    });
    
    return recommendations;
  }

  /**
   * Generate public consultation report
   */
  generatePublicReport(overlapZones, siteOverlaps) {
    const report = {
      title: 'Food Access Planning - Public Consultation Report',
      summary: {
        totalConflictZones: overlapZones.length,
        criticalZones: overlapZones.filter(z => z.conflictLevel === 'critical').length,
        citizenInputRequired: overlapZones.filter(z => z.citizenInput).length
      },
      zones: overlapZones.map(zone => ({
        zoneId: zone.areaId,
        location: `Zone ${zone.areaId}`,
        conflicts: zone.overlaps.map(o => ({
          type: this.overlapTypes[o.type]?.name || o.type,
          description: this.overlapTypes[o.type]?.description || 'Multiple planning options available',
          evidence: o.evidence
        })),
        recommendation: zone.recommendations[0]?.message || 'Multiple options available',
        citizenInput: zone.citizenInput ? 'Yes - Public consultation required' : 'No - Technical decision'
      })),
      nextSteps: [
        'Review conflict zones with local council',
        'Schedule public consultation meetings',
        'Create online voting platform for citizen input',
        'Develop final zoning recommendations based on public feedback'
      ]
    };
    
    return report;
  }

  /**
   * Generate council technical report
   */
  generateCouncilReport(overlapZones, siteOverlaps, conflictSummary) {
    return {
      title: 'Food Access Algorithm - Technical Overlap Analysis',
      executiveSummary: {
        totalOverlaps: conflictSummary.totalOverlaps,
        criticalConflicts: conflictSummary.criticalConflicts,
        multiUseZones: conflictSummary.multiUseZones,
        citizenConsultationRequired: conflictSummary.citizenConsultationRequired
      },
      technicalDetails: overlapZones.map(zone => ({
        zoneId: zone.areaId,
        coordinates: zone.coordinates,
        conflictLevel: zone.conflictLevel,
        overlaps: zone.overlaps,
        recommendations: zone.recommendations,
        nasaDataSources: this.extractNASADataSources(zone),
        confidenceLevel: this.calculateZoneConfidence(zone)
      })),
      recommendations: {
        immediate: this.getImmediateRecommendations(overlapZones),
        shortTerm: this.getShortTermRecommendations(overlapZones),
        longTerm: this.getLongTermRecommendations(overlapZones)
      }
    };
  }

  // Helper methods
  extractAnalysisAreas(algorithmAnalysis) {
    // Extract areas from food desert analysis
    return algorithmAnalysis.analysis?.foodDeserts?.foodDeserts || [];
  }

  extractInterventionSites(algorithmAnalysis) {
    // Extract sites from intervention analysis
    const sites = [];
    Object.values(algorithmAnalysis.analysis?.interventionSites || {}).forEach(typeData => {
      sites.push(...(typeData.topSites || []));
    });
    return sites;
  }

  getAreaData(area, algorithmAnalysis) {
    // Mock implementation - in real system, this would extract actual data
    return {
      ndvi: algorithmAnalysis.analysis?.ndvi,
      precipitation: algorithmAnalysis.analysis?.precipitation,
      lst: algorithmAnalysis.analysis?.lst,
      population: algorithmAnalysis.analysis?.population,
      foodDesert: { accessScore: 0.3, classification: 'critical' }
    };
  }

  generateWaterScarcityEvidence(areaData) {
    return `Vegetation suitability excellent (NDVI: ${areaData.ndvi?.analysis?.averageNDVI?.toFixed(2) || 'N/A'}) but water scarce (${areaData.precipitation?.analysis?.averageAnnualPrecipitation || 'N/A'}mm/year)`;
  }

  generateHeatBarrierEvidence(areaData) {
    return `High farm potential (NDVI: ${areaData.ndvi?.analysis?.averageNDVI?.toFixed(2) || 'N/A'}) but heat stress risk (${areaData.lst?.analysis?.averageTemperature || 'N/A'}°C)`;
  }

  generateFoodDesertHeatEvidence(areaData) {
    return `Critical food desert (score: ${areaData.foodDesert?.accessScore || 'N/A'}) with extreme heat (${areaData.lst?.analysis?.averageTemperature || 'N/A'}°C)`;
  }

  generateMixedUseEvidence(areaData) {
    return `High population density (${areaData.population?.analysis?.averageDensity?.toLocaleString() || 'N/A'}/km²) with excellent vegetation (NDVI: ${areaData.ndvi?.analysis?.averageNDVI?.toFixed(2) || 'N/A'})`;
  }

  generateMultiUseEvidence(overlaps) {
    return `Multiple high-suitability interventions (${overlaps.length} conflicts) require strategic planning decision`;
  }

  calculateCombinedSuitability(areaData) {
    // Calculate combined suitability score
    return 0.8; // Mock implementation
  }

  extractNASADataSources(zone) {
    return ['MODIS NDVI', 'GPM Precipitation', 'MODIS LST', 'SEDAC Population'];
  }

  calculateZoneConfidence(zone) {
    return zone.overlaps.length > 2 ? 'high' : 'medium';
  }

  getImmediateRecommendations(overlapZones) {
    return [
      'Address critical food desert + heat barrier zones immediately',
      'Implement emergency food distribution in critical zones',
      'Begin public consultation process for multi-use zones'
    ];
  }

  getShortTermRecommendations(overlapZones) {
    return [
      'Develop irrigation solutions for urban farm + water scarcity zones',
      'Plan heat mitigation strategies for vulnerable areas',
      'Create integrated planning for mixed-use zones'
    ];
  }

  getLongTermRecommendations(overlapZones) {
    return [
      'Establish comprehensive food access master plan',
      'Implement sustainable water management systems',
      'Create adaptive zoning framework for future conflicts'
    ];
  }

  checkInterventionSiteOverlaps(interventionSites) {
    // Check for overlapping intervention sites
    return [];
  }

  getDefaultOverlapResult() {
    return {
      overlapZones: [],
      siteOverlaps: [],
      conflictSummary: { totalOverlaps: 0, criticalConflicts: 0, multiUseZones: 0, citizenConsultationRequired: 0 },
      publicReport: { title: 'No overlaps detected', summary: {}, zones: [], nextSteps: [] },
      councilReport: { title: 'No conflicts found', executiveSummary: {}, technicalDetails: [], recommendations: {} }
    };
  }
}

export default new OverlapDetectionAlgorithm();



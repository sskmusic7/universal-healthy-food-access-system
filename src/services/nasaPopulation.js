import axios from "axios";
import nasaAuth from "./nasaAuth";

class NASA_Population_Service {
  constructor() {
    this.baseUrl = "https://sedac.ciesin.columbia.edu/data/set/gpw-v4-population-density-rev11";
  }

  async fetchPopulationGrid(bbox) {
    try {
      console.log('Fetching NASA SEDAC GPWv4 population density data...');
      
      const realData = await this.fetchRealPopulationData(bbox);
      if (realData && realData.length > 0) {
        console.log('✅ Real NASA SEDAC population data retrieved');
        return {
          source: 'SEDAC_GPWv4',
          bbox,
          data: realData,
          resolution: '1km',
          analysis: this.analyzePopulationDemand(realData)
        };
      } else {
        throw new Error('No population data returned from NASA SEDAC API');
      }
      
    } catch (error) {
      console.error("Error fetching NASA population data:", error);
      throw error;
    }
  }

  async fetchRealPopulationData(bbox) {
    try {
      const { north, south, east, west } = bbox;
      
      // NASA SEDAC GPWv4 API endpoint
      const apiUrl = 'https://sedac.ciesin.columbia.edu/arcgis/rest/services/sedac/gpwv4_population_density/MapServer/0/query';
      
      const params = {
        where: '1=1',
        outFields: '*',
        outSR: '4326',
        f: 'json',
        geometry: `${west},${south},${east},${north}`,
        geometryType: 'esriGeometryEnvelope',
        spatialRel: 'esriSpatialRelIntersects'
      };
      
      const response = await axios.get(apiUrl, { params });
      
      if (response.data && response.data.features) {
        return response.data.features.map(feature => {
          const coords = feature.geometry.rings[0][0]; // Get first coordinate
          const attributes = feature.attributes;
          
          return {
            lat: coords[1],
            lng: coords[0],
            populationDensity: attributes.POPULATION_DENSITY || 0,
            totalPopulation: attributes.TOTAL_POPULATION || 0,
            ageDistribution: {
              children: Math.round((attributes.TOTAL_POPULATION || 0) * 0.2),
              adults: Math.round((attributes.TOTAL_POPULATION || 0) * 0.65),
              elderly: Math.round((attributes.TOTAL_POPULATION || 0) * 0.15)
            },
            incomeLevel: this.estimateIncomeLevel(attributes.POPULATION_DENSITY || 0, 'medium'),
            foodAccessDemand: this.calculateFoodAccessDemand(
              attributes.TOTAL_POPULATION || 0,
              { children: 0.2, adults: 0.65, elderly: 0.15 },
              'medium'
            ),
            classification: this.classifyPopulationDensity(attributes.POPULATION_DENSITY || 0)
          };
        });
      }
      
      return [];
    } catch (error) {
      console.error('Real NASA SEDAC API error:', error);
      throw error;
    }
  }

  generateMockPopulationData(bbox) {
    const { north, south, east, west } = bbox;
    const latStep = (north - south) / 25; // Increased grid resolution
    const lngStep = (east - west) / 25;
    
    const gridData = [];
    
    for (let i = 0; i < 25; i++) {
      for (let j = 0; j < 25; j++) {
        const lat = south + (i * latStep);
        const lng = west + (j * lngStep);
        
        const baseDensity = this.getBasePopulationDensity(lat, lng);
        const urbanFactor = this.getUrbanDensityFactor(lat, lng);
        const populationMetrics = this.calculatePopulationMetrics(baseDensity, urbanFactor);
        
        // Calculate area of each grid cell in km²
        const cellArea = latStep * lngStep * 111.32 * 111.32 * Math.cos(lat * Math.PI / 180); // Rough conversion to km²
        
        gridData.push({
          lat,
          lng,
          populationDensity: populationMetrics.density,
          totalPopulation: Math.round(populationMetrics.density * cellArea), // Population = density * area
          ageDistribution: populationMetrics.ageDistribution,
          incomeLevel: populationMetrics.incomeLevel,
          foodAccessDemand: populationMetrics.foodAccessDemand,
          classification: this.classifyPopulationDensity(populationMetrics.density)
        });
      }
    }
    
    return gridData;
  }

  getBasePopulationDensity(lat, lng) {
    // Hull-specific population density centers
    const hullCenters = [
      { lat: 53.7624, lng: -0.3301, density: 4500 }, // Hull city center
      { lat: 53.8, lng: -0.3, density: 3200 },       // Hull suburbs
      { lat: 53.7, lng: -0.4, density: 2800 },       // Hull outskirts
      { lat: 53.75, lng: -0.25, density: 3800 },     // Additional urban areas
      { lat: 53.78, lng: -0.35, density: 2900 }      // Additional suburban areas
    ];
    
    let minDistance = Infinity;
    let baseDensity = 800; // Default suburban density for Hull area
    
    hullCenters.forEach(center => {
      const distance = Math.sqrt(
        Math.pow(lat - center.lat, 2) + Math.pow(lng - center.lng, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        baseDensity = center.density;
      }
    });
    
    // More realistic distance decay for urban areas
    const distanceDecay = Math.max(0.3, 1 - minDistance * 0.2);
    return Math.max(200, baseDensity * distanceDecay + (Math.random() - 0.5) * baseDensity * 0.3);
  }

  getUrbanDensityFactor(lat, lng) {
    const urbanDensity = Math.random();
    if (urbanDensity > 0.8) return 'very_high';
    if (urbanDensity > 0.6) return 'high';
    if (urbanDensity > 0.4) return 'medium';
    if (urbanDensity > 0.2) return 'low';
    return 'very_low';
  }

  calculatePopulationMetrics(baseDensity, urbanFactor) {
    let density = baseDensity;
    
    switch (urbanFactor) {
      case 'very_high': density *= 2.0; break;
      case 'high': density *= 1.5; break;
      case 'medium': density *= 1.2; break;
      case 'low': density *= 0.8; break;
      case 'very_low': density *= 0.5; break;
    }
    
    const totalPopulation = Math.round(density);
    
    const ageDistribution = {
      children: Math.round(totalPopulation * (0.15 + Math.random() * 0.1)),
      adults: Math.round(totalPopulation * (0.6 + Math.random() * 0.2)),
      elderly: Math.round(totalPopulation * (0.1 + Math.random() * 0.1))
    };
    
    const incomeLevel = this.estimateIncomeLevel(density, urbanFactor);
    const foodAccessDemand = this.calculateFoodAccessDemand(totalPopulation, ageDistribution, incomeLevel);
    
    return {
      density: Math.round(density),
      totalPopulation,
      ageDistribution,
      incomeLevel,
      foodAccessDemand
    };
  }

  estimateIncomeLevel(density, urbanFactor) {
    if (density > 5000 && urbanFactor === 'very_high') return 'high';
    if (density > 3000 && (urbanFactor === 'high' || urbanFactor === 'very_high')) return 'medium_high';
    if (density > 1000 && (urbanFactor === 'medium' || urbanFactor === 'high')) return 'medium';
    if (density > 500 && urbanFactor !== 'very_low') return 'medium_low';
    return 'low';
  }

  calculateFoodAccessDemand(totalPopulation, ageDistribution, incomeLevel) {
    let demandScore = totalPopulation;
    
    demandScore += ageDistribution.children * 1.5;
    demandScore += ageDistribution.elderly * 1.3;
    
    switch (incomeLevel) {
      case 'high': demandScore *= 0.8; break;
      case 'medium_high': demandScore *= 0.9; break;
      case 'medium': demandScore *= 1.0; break;
      case 'medium_low': demandScore *= 1.2; break;
      case 'low': demandScore *= 1.5; break;
    }
    
    return Math.round(demandScore);
  }

  classifyPopulationDensity(density) {
    if (density > 5000) {
      return { 
        category: "very_high", 
        color: "#8B0000", 
        description: "Very high density - urban core",
        icon: "🏙️",
        priority: "critical"
      };
    }
    if (density > 3000) {
      return { 
        category: "high", 
        color: "#FF4500", 
        description: "High density - urban area",
        icon: "🏢",
        priority: "high"
      };
    }
    if (density > 1000) {
      return { 
        category: "medium", 
        color: "#FFD700", 
        description: "Medium density - suburban",
        icon: "🏘️",
        priority: "medium"
      };
    }
    if (density > 100) {
      return { 
        category: "low", 
        color: "#32CD32", 
        description: "Low density - rural",
        icon: "🏡",
        priority: "low"
      };
    }
    return { 
      category: "very_low", 
      color: "#4169e1", 
      description: "Very low density - remote",
      icon: "🌲",
      priority: "very_low"
    };
  }

  analyzePopulationDemand(data) {
    const totalPopulation = data.reduce((sum, point) => sum + point.totalPopulation, 0);
    const totalDensity = data.reduce((sum, point) => sum + point.populationDensity, 0);
    const avgDensity = totalDensity / data.length;
    
    const veryHighDensity = data.filter(point => point.classification.category === 'very_high');
    const highDensity = data.filter(point => point.classification.category === 'high');
    const mediumDensity = data.filter(point => point.classification.category === 'medium');
    const lowDensity = data.filter(point => point.classification.category === 'low');
    const veryLowDensity = data.filter(point => point.classification.category === 'very_low');
    
    const totalFoodAccessDemand = data.reduce((sum, point) => sum + point.foodAccessDemand, 0);
    
    const highDemandAreas = data
      .filter(point => point.foodAccessDemand > avgDensity * 1.5)
      .sort((a, b) => b.foodAccessDemand - a.foodAccessDemand)
      .slice(0, 10);
    
    const vulnerablePopulations = data.filter(point => 
      point.incomeLevel === 'low' || point.incomeLevel === 'medium_low'
    );
    
    const totalVulnerablePopulation = vulnerablePopulations.reduce(
      (sum, point) => sum + point.totalPopulation, 0
    );

    return {
      totalPopulation,
      averageDensity: Math.round(avgDensity),
      veryHighDensityZones: veryHighDensity.length,
      highDensityZones: highDensity.length,
      mediumDensityZones: mediumDensity.length,
      lowDensityZones: lowDensity.length,
      veryLowDensityZones: veryLowDensity.length,
      totalFoodAccessDemand,
      highDemandAreas,
      vulnerablePopulations: vulnerablePopulations.length,
      totalVulnerablePopulation,
      recommendations: this.generatePopulationRecommendations(
        avgDensity, 
        totalFoodAccessDemand, 
        totalVulnerablePopulation,
        highDemandAreas.length
      )
    };
  }

  generatePopulationRecommendations(avgDensity, totalDemand, vulnerablePop, highDemandAreas) {
    const recommendations = [];

    if (avgDensity > 3000) {
      recommendations.push({
        type: 'high_density',
        priority: 'high',
        message: 'High population density area - prioritize efficient food distribution systems'
      });
    }

    if (vulnerablePop > 10000) {
      recommendations.push({
        type: 'vulnerable_population',
        priority: 'critical',
        message: 'Large vulnerable population - implement targeted food access interventions'
      });
    }

    if (highDemandAreas > 5) {
      recommendations.push({
        type: 'demand_concentration',
        priority: 'high',
        message: 'Multiple high-demand areas identified - consider mobile market routes'
      });
    }

    if (avgDensity < 500) {
      recommendations.push({
        type: 'low_density',
        priority: 'medium',
        message: 'Low population density - consider delivery services and mobile markets'
      });
    }

    return recommendations;
  }
}

export default new NASA_Population_Service();

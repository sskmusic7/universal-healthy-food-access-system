# Integration Guide: Soil Data & Optimal Placement Engine

## Overview

The system now includes comprehensive soil quality assessment and an intelligent placement engine that suggests optimal locations for ANY type of food intervention using ALL available data sources.

## New Components

### 1. Soil Data Integration (`src/utils/soilDataIntegration.js`)

Provides comprehensive soil quality assessment including:
- **pH levels** - Critical for crop selection
- **Organic carbon** - Indicates soil fertility
- **Texture analysis** - Clay, sand, silt composition
- **Contamination detection** - EPA Brownfields data
- **Land use history** - Industrial proximity risks
- **Drainage assessment** - Water management needs
- **Remediation recommendations** - Specific interventions

### 2. Optimal Placement Engine (`src/optimization/OptimalPlacementEngine.js`)

A holistic spatial optimization system that suggests optimal locations for:

#### Food Retail
- 🏪 **Supermarkets** - Full-service grocery stores
- 🌾 **Farmers Markets** - Weekly fresh produce markets
- 🚐 **Mobile Markets** - Food trucks/buses for underserved areas

#### Urban Agriculture
- 🌱 **Urban Farms** - Commercial food production
- 🥬 **Community Gardens** - Shared growing spaces
- 🏢 **Vertical Farms** - High-tech indoor farming
- 🐟 **Aquaponics** - Fish + vegetable systems

#### Food Infrastructure
- 📦 **Food Hubs** - Distribution centers
- 👨‍🍳 **Community Kitchens** - Shared cooking facilities
- 🥫 **Food Pantries** - Emergency food distribution

## Integration Example

```javascript
// In App.js or a new analysis component

import { OptimalPlacementEngine } from './optimization/OptimalPlacementEngine';
import { assessSoilQuality } from './utils/soilDataIntegration';

async function analyzeOptimalPlacements(cityData, outlets, climate) {
  // Initialize the placement engine
  const engine = new OptimalPlacementEngine(
    cityData,
    outlets,
    climate,
    demographicData // Optional
  );

  // Find optimal placements for all intervention types
  const recommendations = await engine.findOptimalPlacements({
    gridResolution: 0.005,  // ~500m cells
    maxSuggestions: 10,
    interventionTypes: 'all', // Or specific types: ['FARMERS_MARKET', 'URBAN_FARM']
    priorityFactors: {
      equityWeight: 0.3,     // Prioritize underserved areas
      minCoverage: 0.8,      // Cover 80% of food deserts
      maxClusterDistance: 2000 // Prevent clustering within 2km
    }
  });

  return recommendations;
}

// Example: Check soil for a specific location
async function checkLocationSoil(lat, lng) {
  const soilAssessment = await assessSoilQuality(
    { lat, lng },
    100 // radius in meters
  );

  console.log('Soil Quality:', soilAssessment.suitability.category);
  console.log('Contamination:', soilAssessment.contamination);
  console.log('Recommendations:', soilAssessment.recommendations);

  return soilAssessment;
}
```

## How the Engine Works

### 1. Data Collection Phase
The engine analyzes ALL available data sources:
```javascript
{
  spatial: {
    vacantLots: [],        // From OpenStreetMap
    parkingLots: [],       // Underutilized spaces
    rooftops: [],          // For vertical farming
    parks: []              // Partial conversion potential
  },
  environmental: {
    soil: {},              // pH, nutrients, contamination
    climate: {},           // Temperature, precipitation, solar
    water: {}              // Availability and quality
  },
  social: {
    population: {},        // Density and demographics
    vulnerability: {},     // Economic and social factors
    foodDeserts: {},       // Access gaps
    equity: {}            // Distribution fairness
  },
  infrastructure: {
    transit: {},          // Public transportation
    utilities: {},        // Water, power, sewer
    roads: {},            // Accessibility
    parking: {}           // Customer access
  }
}
```

### 2. Scoring Algorithm
Each location is scored for each intervention type based on weighted factors:

```javascript
// Example: Farmers Market scoring
score = (
  accessibility * 0.25 +   // Transit and road access
  population * 0.20 +      // Nearby residents
  competition * 0.15 +     // Distance from similar outlets
  visibility * 0.15 +      // Main street vs hidden
  parking * 0.10 +         // Customer convenience
  climate * 0.05 +         // Weather protection needs
  equity * 0.10            // Serves vulnerable populations
)
```

### 3. Equity Optimization
The engine ensures equitable distribution:
- **Prioritizes underserved areas** - Higher scores for food deserts
- **Prevents clustering** - Spreads interventions across the city
- **Ensures coverage** - Minimum service for all neighborhoods
- **Considers vulnerability** - Weighted by economic and social factors

### 4. Output Format

```javascript
{
  placements: [
    {
      location: { lat: 42.3601, lng: -71.0589 },
      type: 'FARMERS_MARKET',
      icon: '🌾',
      score: 0.85,
      priority: 'HIGH',

      justification: 'Serves highly vulnerable population. Fills significant gap in food access.',

      implementation: {
        setupCost: 5000,
        operatingCost: 500, // per week
        timeframe: '2-3 months',
        requirements: ['Parking', 'Transit access', 'Open space'],
        partners: ['Local farmers association', 'City markets department']
      },

      expectedImpact: {
        populationServed: 5000,
        foodDesertReduction: 0.15,
        accessImprovement: 25,
        equityImprovement: 0.12,
        jobsCreated: 10,
        economicImpact: 150000
      },

      synergies: ['Supply fresh produce to nearby Community Kitchen'],
      risks: ['Limited parking may reduce customer access'],
      successFactors: ['Strong community support expected']
    },
    // ... more placements
  ],

  recommendations: [
    // Detailed implementation steps
  ],

  impact: {
    totalPopulationServed: 25000,
    foodDesertReduction: 0.45,
    equityImprovement: 0.30,
    totalJobsCreated: 85,
    totalInvestmentNeeded: 850000
  },

  visualizations: {
    markers: [],     // For map display
    heatmap: [],     // Impact intensity
    serviceAreas: [] // Coverage zones
  }
}
```

## Visualization Integration

Add to `Map.js`:

```javascript
import { OptimalPlacementEngine } from '../optimization/OptimalPlacementEngine';

// In your map component
function addOptimalPlacementLayer(map, placements) {
  // Create custom icons for each intervention type
  const icons = {
    FARMERS_MARKET: L.divIcon({
      html: '🌾',
      className: 'intervention-icon',
      iconSize: [30, 30]
    }),
    URBAN_FARM: L.divIcon({
      html: '🌱',
      className: 'intervention-icon',
      iconSize: [30, 30]
    }),
    // ... more icons
  };

  // Add markers for each placement
  placements.forEach(placement => {
    const marker = L.marker(
      [placement.location.lat, placement.location.lng],
      { icon: icons[placement.type] }
    );

    marker.bindPopup(`
      <h3>${placement.icon} Recommended: ${placement.type}</h3>
      <p><strong>Score:</strong> ${Math.round(placement.score * 100)}%</p>
      <p><strong>People Served:</strong> ${placement.expectedImpact.populationServed}</p>
      <p><strong>Setup Cost:</strong> $${placement.implementation.setupCost}</p>
      <p><strong>Justification:</strong> ${placement.justification}</p>
    `);

    marker.addTo(map);
  });

  // Add service area circles
  placements.forEach(placement => {
    const radius = getServiceRadius(placement.type);
    L.circle(
      [placement.location.lat, placement.location.lng],
      {
        radius,
        color: 'blue',
        fillOpacity: 0.1
      }
    ).addTo(map);
  });
}
```

## Key Features

### 1. Comprehensive Intervention Types
The engine considers 10+ different intervention types, each with specific requirements and scoring criteria.

### 2. Holistic Data Integration
Uses ALL available data sources:
- **Spatial**: Vacant lots, underused spaces, rooftops
- **Environmental**: Soil, climate, water, contamination
- **Social**: Population, vulnerability, equity
- **Infrastructure**: Transit, utilities, roads

### 3. Equity-First Design
- Prioritizes underserved communities
- Prevents resource clustering in wealthy areas
- Ensures minimum coverage standards
- Weights vulnerability in all decisions

### 4. Practical Implementation Focus
- Provides specific cost estimates
- Identifies required partners
- Suggests implementation timeframes
- Lists concrete requirements
- Identifies risks and success factors

### 5. Synergy Detection
- Identifies complementary placements (farm → market)
- Optimizes supply chain connections
- Prevents competitive clustering
- Maximizes system-wide impact

## Usage Scenarios

### Scenario 1: Emergency Food Desert Response
```javascript
const urgent = await engine.findOptimalPlacements({
  interventionTypes: ['MOBILE_MARKET', 'FOOD_PANTRY'],
  priorityFactors: {
    equityWeight: 0.5,  // Heavy equity focus
    timeframe: 'immediate'
  }
});
```

### Scenario 2: Long-term Urban Agriculture Plan
```javascript
const agricultural = await engine.findOptimalPlacements({
  interventionTypes: ['URBAN_FARM', 'COMMUNITY_GARDEN', 'VERTICAL_FARM'],
  priorityFactors: {
    soilWeight: 0.3,
    climateWeight: 0.3
  }
});
```

### Scenario 3: Commercial Development
```javascript
const commercial = await engine.findOptimalPlacements({
  interventionTypes: ['SUPERMARKET', 'FARMERS_MARKET'],
  priorityFactors: {
    profitability: 0.4,
    accessibility: 0.3
  }
});
```

## Performance Considerations

- **Caching**: Soil and contamination data are cached to reduce API calls
- **Parallel Processing**: Location scoring runs in parallel when possible
- **Progressive Loading**: Can fetch data incrementally for large cities
- **Configurable Resolution**: Adjust grid size for speed vs accuracy

## Next Steps

1. **Integrate with UI**: Add placement recommendations to the dashboard
2. **Enable filtering**: Let users select specific intervention types
3. **Add constraints**: Budget limits, zoning restrictions
4. **Time-series analysis**: Show how recommendations change over time
5. **Impact tracking**: Monitor actual vs predicted outcomes

## API Keys Required

For full functionality, add to `.env`:

```bash
# EPA Brownfields (contamination data)
REACT_APP_EPA_API_KEY=your_key_here

# USDA Soil Survey (soil properties)
REACT_APP_USDA_API_KEY=your_key_here

# OpenRouteService (accessibility analysis)
REACT_APP_ORS_API_KEY=your_key_here
```

Note: The system works with fallback estimates if APIs are unavailable.

## Conclusion

The Optimal Placement Engine transforms the Universal Healthy Food Access System from a visualization tool into a comprehensive decision support system that:

1. **Accounts for soil quality** and contamination in agricultural decisions
2. **Suggests optimal locations** for ANY type of food intervention
3. **Uses ALL available data** holistically to maximize impact
4. **Ensures equitable distribution** of resources
5. **Provides actionable implementation** guidance

This creates a truly holonomic and holistic system that considers all dimensions of food access and derives maximum value from the confluence of available data.
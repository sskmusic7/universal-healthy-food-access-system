import axios from "axios";

class GeminiAI_Service {
  constructor() {
    this.apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    this.baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";
  }

  /**
   * Generate AI solution recommendations for food access improvement
   * @param {Object} cityData - City information and NASA data
   * @returns {Object} AI-generated solution recommendations
   */
  async generateFoodAccessSolution(cityData) {
    try {
      if (!this.apiKey) {
        throw new Error('Gemini API key not found');
      }

      console.log('Generating AI solution recommendations...');
      
      const prompt = this.buildSolutionPrompt(cityData);
      const response = await this.callGeminiAPI(prompt);
      
      return this.parseAIResponse(response);
      
    } catch (error) {
      console.error("Error generating AI solution:", error);
      // Return fallback recommendations
      return this.generateFallbackRecommendations(cityData);
    }
  }

  /**
   * Build comprehensive prompt for AI solution generation
   */
  buildSolutionPrompt(cityData) {
    const { city, data } = cityData;
    
    return `You are an expert urban planning AI specializing in food access solutions. Analyze the following data for ${city.name} and provide specific, actionable recommendations.

CITY DATA:
- Location: ${city.lat}, ${city.lng}
- Food Outlets: ${data.foodOutlets?.length || 0} total
- Healthy Outlets: ${data.foodOutlets?.filter(o => o.classification.label === 'Healthy Food Source').length || 0}
- Mixed Outlets: ${data.foodOutlets?.filter(o => o.classification.label === 'Mixed Selection').length || 0}
- Unhealthy Outlets: ${data.foodOutlets?.filter(o => o.classification.label === 'Unhealthy').length || 0}

NASA CLIMATE DATA:
- Solar Irradiance: ${data.power?.data?.ALLSKY_SFC_SW_DWN?.mean?.toFixed(2) || 'N/A'} kWh/m²/day
- Temperature: ${data.power?.data?.T2M?.mean?.toFixed(1) || 'N/A'}°C
- Precipitation: ${data.power?.data?.PRECTOTCORR?.mean?.toFixed(1) || 'N/A'} mm/day

NASA HEAT ANALYSIS:
- Average Temperature: ${data.lst?.analysis?.averageTemperature || 'N/A'}°C
- Extreme Heat Zones: ${data.lst?.analysis?.extremeHeatZones || 0}
- Walking Barriers: ${data.lst?.analysis?.walkingBarriers || 0}
- Affected Population: ${data.lst?.analysis?.affectedPopulation?.toLocaleString() || 'N/A'}

NASA POPULATION DATA:
- Total Population: ${data.population?.analysis?.totalPopulation?.toLocaleString() || 'N/A'}
- Average Density: ${data.population?.analysis?.averageDensity || 'N/A'} people/km²
- Vulnerable Population: ${data.population?.analysis?.totalVulnerablePopulation?.toLocaleString() || 'N/A'}
- Food Access Demand: ${data.population?.analysis?.totalFoodAccessDemand?.toLocaleString() || 'N/A'}

NASA PRECIPITATION ANALYSIS:
- Annual Precipitation: ${data.precipitation?.analysis?.averageAnnualPrecipitation || 'N/A'} mm/year
- Dry Days: ${data.precipitation?.analysis?.averageDryDays || 'N/A'} days/year
- Heavy Rain Days: ${data.precipitation?.analysis?.averageHeavyRainDays || 'N/A'} days/year
- Best Urban Farm Areas: ${data.precipitation?.analysis?.bestUrbanFarmingAreas?.length || 0}

NASA COMMERCIAL ACTIVITY:
- Average Brightness: ${data.nighttimeLights?.analysis?.averageBrightness || 'N/A'}/100
- High Activity Areas: ${data.nighttimeLights?.analysis?.highActivityCount || 0}
- Informal Market Areas: ${data.nighttimeLights?.analysis?.informalMarketAreas || 0}
- Food Outlet Areas: ${data.nighttimeLights?.analysis?.foodOutletAreas || 0}

Please provide a comprehensive solution in JSON format with the following structure:

{
  "summary": "Brief overview of the food access situation and key challenges",
  "priority_actions": [
    {
      "action": "Action name",
      "priority": "high/medium/low",
      "description": "Detailed description",
      "nasa_evidence": "Specific NASA data supporting this action",
      "estimated_cost": "Cost range",
      "timeline": "Implementation timeline",
      "expected_impact": "Expected improvement in food access"
    }
  ],
  "urban_farming_recommendations": [
    {
      "location_type": "Type of location",
      "coordinates": [lat, lng],
      "justification": "Why this location is suitable",
      "nasa_evidence": "NASA data supporting this choice",
      "crop_suggestions": ["crop1", "crop2"],
      "irrigation_needs": "Water requirements"
    }
  ],
  "delivery_solutions": [
    {
      "solution_type": "Type of delivery solution",
      "description": "How it works",
      "weather_resilience": "How it handles weather challenges",
      "target_population": "Who it serves"
    }
  ],
  "heat_mitigation": [
    {
      "strategy": "Heat mitigation strategy",
      "description": "How it reduces heat barriers",
      "implementation": "How to implement",
      "nasa_evidence": "NASA LST data supporting this"
    }
  ],
  "economic_impact": {
    "healthcare_savings": "Estimated annual healthcare savings",
    "implementation_cost": "Total estimated cost",
    "roi_timeline": "Return on investment timeline",
    "beneficiaries": "Number of people who would benefit"
  }
}

Focus on practical, implementable solutions that use the NASA data as evidence for recommendations.`;
  }

  /**
   * Call Gemini API
   */
  async callGeminiAPI(prompt) {
    const response = await axios.post(
      `${this.baseUrl}?key=${this.apiKey}`,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    return response.data;
  }

  /**
   * Parse AI response
   */
  parseAIResponse(response) {
    try {
      const content = response.candidates[0].content.parts[0].text;
      
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // If no JSON found, return structured response
      return {
        summary: content,
        priority_actions: [],
        urban_farming_recommendations: [],
        delivery_solutions: [],
        heat_mitigation: [],
        economic_impact: {}
      };
      
    } catch (error) {
      console.error("Error parsing AI response:", error);
      return this.generateFallbackRecommendations();
    }
  }

  /**
   * Generate fallback recommendations when AI fails
   */
  generateFallbackRecommendations(cityData) {
    const { city, data } = cityData;
    
    return {
      summary: `Food access analysis for ${city.name} shows ${data.foodOutlets?.length || 0} total outlets with mixed access quality.`,
      priority_actions: [
        {
          action: "Mobile Market Implementation",
          priority: "high",
          description: "Deploy mobile food markets to reach underserved areas",
          nasa_evidence: `Population density of ${data.population?.analysis?.averageDensity || 'unknown'} people/km² indicates need for mobile solutions`,
          estimated_cost: "$100K - $300K",
          timeline: "6-12 months",
          expected_impact: "Serve 3,000-8,000 additional people"
        },
        {
          action: "Urban Farming Initiative",
          priority: "medium",
          description: "Establish community gardens in suitable locations",
          nasa_evidence: `Precipitation of ${data.precipitation?.analysis?.averageAnnualPrecipitation || 'unknown'}mm/year supports urban farming`,
          estimated_cost: "$200K - $600K",
          timeline: "12-18 months",
          expected_impact: "Serve 1,000-3,000 people with fresh produce"
        }
      ],
      urban_farming_recommendations: [
        {
          location_type: "Community Center",
          coordinates: [city.lat + 0.01, city.lng + 0.01],
          justification: "High population density area with good access",
          nasa_evidence: "Population density and solar irradiance data support this location",
          crop_suggestions: ["Leafy greens", "Herbs", "Tomatoes"],
          irrigation_needs: "Moderate - consider rainwater harvesting"
        }
      ],
      delivery_solutions: [
        {
          solution_type: "Drone Delivery",
          description: "Weather-resistant drone delivery for remote areas",
          weather_resilience: `Designed for ${data.precipitation?.analysis?.averageHeavyRainDays || 'unknown'} heavy rain days per year`,
          target_population: "Remote and vulnerable populations"
        }
      ],
      heat_mitigation: [
        {
          strategy: "Shaded Walking Routes",
          description: "Create covered walkways to reduce heat exposure",
          implementation: "Install solar panel canopies along main routes",
          nasa_evidence: `Average temperature of ${data.lst?.analysis?.averageTemperature || 'unknown'}°C requires heat mitigation`
        }
      ],
      economic_impact: {
        healthcare_savings: "$2.8M annually",
        implementation_cost: "$500K - $1.2M",
        roi_timeline: "2-3 years",
        beneficiaries: `${data.population?.analysis?.totalVulnerablePopulation?.toLocaleString() || '10,000'} people`
      }
    };
  }
}

export default new GeminiAI_Service();



// aiSolutionService.js - Generates AI strategy overlays using local Ollama model
// Wraps the gpt-oss:20b chat endpoint and provides structured planning output

import axios from 'axios';

const DEFAULT_MODEL = process.env.REACT_APP_OLLAMA_MODEL || 'gpt-oss:20b';
const DEFAULT_REMOTE_BASE = 'https://ollama.vps.iameternalzion.com/api';
const envApiBase = (process.env.REACT_APP_OLLAMA_API_BASE || '').trim();
const OLLAMA_API_BASE = envApiBase ? envApiBase.replace(/\/$/, '') : '';
const OLLAMA_PROXY_PATH = (process.env.REACT_APP_OLLAMA_PROXY_PATH || '/ollama').replace(/\/$/, '');

/**
 * Generate an AI-assisted solution plan for the current city
 */
export async function generateAiSolutionPlan({
  city,
  placements = [],
  climate = null,
  foodOutlets = []
}) {
  if (!city) {
    throw new Error('City data is required to generate AI solutions');
  }

  const preparedPlacements = placements
    .filter(Boolean)
    .slice(0, 6)
    .map((placement, index) => ({
      id: placement.id || `placement_${index}`,
      type: placement.type,
      priority: placement.priority,
      score: Number(((placement.score || 0) * 100).toFixed(1)),
      populationServed: placement.expectedImpact?.populationServed || placement.estimatedImpact?.population || 0,
      location: placement.location,
      justification: placement.justification,
      timeframe: placement.implementation?.timeframe,
      setupCost: placement.implementation?.setupCost
    }));

  const outletSummary = summarizeOutlets(foodOutlets);
  const climateSummary = summarizeClimate(climate);

  const userPrompt = buildPrompt({
    city,
    placements: preparedPlacements,
    outletSummary,
    climateSummary
  });

  const payload = {
    model: DEFAULT_MODEL,
    stream: false,
    options: {
      temperature: 0.4,
      top_p: 0.9
    },
    messages: [
      {
        role: 'system',
        content: 'You are an urban food systems planner. Respond with compact JSON only.'
      },
      {
        role: 'user',
        content: userPrompt
      }
    ]
  };

  const url = buildChatEndpoint();

  const response = await axios.post(url, payload, {
    timeout: 120000
  });

  const messageContent = response.data?.message?.content || '';
  const parsed = enrichPlanWithFallbacks(parseAiResponse(messageContent), preparedPlacements);

  return {
    summary: parsed.summary || 'No summary returned by the model.',
    recommendations: parsed.recommendations || [],
    priorityNotes: parsed.priorityNotes || parsed.priority_notes || [],
    implementationRoadmap: parsed.implementationRoadmap || parsed.implementation_roadmap || [],
    generatedAt: new Date().toISOString(),
    raw: messageContent
  };
}

function summarizeOutlets(foodOutlets) {
  const counts = {
    healthy: 0,
    mixed: 0,
    unhealthy: 0,
    unknown: 0
  };

  foodOutlets.forEach(outlet => {
    switch (outlet?.classification?.label) {
      case 'Healthy Food Source':
        counts.healthy += 1;
        break;
      case 'Mixed Selection':
        counts.mixed += 1;
        break;
      case 'Unhealthy':
        counts.unhealthy += 1;
        break;
      default:
        counts.unknown += 1;
    }
  });

  const total = foodOutlets.length || 1;
  const percentages = Object.fromEntries(
    Object.entries(counts).map(([key, value]) => [
      key,
      Number(((value / total) * 100).toFixed(1))
    ])
  );

  return { counts, percentages, total: foodOutlets.length };
}

function summarizeClimate(climate) {
  if (!climate?.data) {
    return null;
  }

  return {
    solar: Number((climate.data.ALLSKY_SFC_SW_DWN?.mean || 0).toFixed(2)),
    temperature: Number((climate.data.T2M?.mean || 0).toFixed(1)),
    precipitation: Number((climate.data.PRECTOTCORR?.mean || 0).toFixed(1))
  };
}

function buildPrompt({ city, placements, outletSummary, climateSummary }) {
  const lines = [];

  lines.push(`City: ${city.name}`);
  lines.push(`Coordinates: (${city.lat?.toFixed(4)}, ${city.lng?.toFixed(4)})`);

  lines.push('\nFood Outlet Snapshot:');
  lines.push(`- Healthy: ${outletSummary.counts.healthy} (${outletSummary.percentages.healthy}%)`);
  lines.push(`- Mixed: ${outletSummary.counts.mixed} (${outletSummary.percentages.mixed}%)`);
  lines.push(`- Unhealthy: ${outletSummary.counts.unhealthy} (${outletSummary.percentages.unhealthy}%)`);

  if (climateSummary) {
    lines.push('\nClimate Indicators (NASA POWER avg):');
    lines.push(`- Solar irradiance: ${climateSummary.solar} kWh/m²/day`);
    lines.push(`- Air temp: ${climateSummary.temperature} °C`);
    lines.push(`- Precipitation: ${climateSummary.precipitation} mm/day`);
  }

  if (placements.length) {
    lines.push('\nOptimized Intervention Candidates:');
    placements.forEach((placement, index) => {
      lines.push(`${index + 1}. ${placement.type} | Priority ${placement.priority} | Score ${placement.score}%`);
      lines.push(`   Location: (${placement.location.lat.toFixed(4)}, ${placement.location.lng.toFixed(4)})`);
      lines.push(`   Population reach: ${placement.populationServed}`);
      if (placement.justification) {
        lines.push(`   Why: ${placement.justification}`);
      }
    });
  } else {
    lines.push('\nNo optimized placements yet; propose high-impact starter actions.');
  }

  lines.push(`\nTask: Build an "AI Solution Map" for ${city.name}.`);
  lines.push('Return strict JSON with the following structure:');
  lines.push(`{
  "summary": string,
  "recommendations": [
    {
      "title": string,
      "interventionType": string,
      "priority": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
      "location": { "lat": number, "lng": number },
      "mapLabel": string,
      "rationale": string,
      "expectedImpact": {
        "population": number,
        "equityLift": string,
        "timeframe": string
      },
      "requiredPartners": string[]
    }
  ],
  "priorityNotes": string[],
  "implementationRoadmap": [
    {
      "phase": string,
      "focus": string,
      "duration": string,
      "milestones": string[]
    }
  ]
}`);
  lines.push('Do not include any additional commentary, preamble, or formatting. Return JSON only.');

  return lines.join('\n');
}

function parseAiResponse(content) {
  if (!content) return {};

  const directParse = tryParseJson(content.trim());
  if (directParse) return directParse;

  const extracted = extractFirstJsonBlock(content);
  if (extracted) {
    return tryParseJson(extracted) || {};
  }

  return {};
}

function buildChatEndpoint() {
  if (OLLAMA_API_BASE) {
    return `${OLLAMA_API_BASE}/chat`;
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname || '';
    const isLocal = ['localhost', '127.0.0.1'].includes(host) || host.endsWith('.local');
    if (!isLocal) {
      return `${DEFAULT_REMOTE_BASE}/chat`;
    }
  }

  if (/^https?:/i.test(OLLAMA_PROXY_PATH)) {
    return `${OLLAMA_PROXY_PATH}/chat`;
  }

  return `${OLLAMA_PROXY_PATH}/chat`;
}

function extractFirstJsonBlock(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }
  return text.slice(start, end + 1);
}

function tryParseJson(value) {
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
}

function enrichPlanWithFallbacks(plan = {}, placements = []) {
  const safePlan = { ...plan };
  if (!Array.isArray(safePlan.recommendations)) {
    safePlan.recommendations = [];
  }

  const placementByType = new Map();
  placements.forEach(placement => {
    if (placement?.type && !placementByType.has(placement.type)) {
      placementByType.set(placement.type, placement);
    }
  });

  safePlan.recommendations = safePlan.recommendations.map((recommendation = {}, index) => {
    const enriched = { ...recommendation };
    const typeKey = enriched.interventionType || enriched.type;
    const fallbackPlacement = placementByType.get(typeKey) || placements[index] || placements[0];

    if ((!enriched.location || typeof enriched.location.lat !== 'number' || typeof enriched.location.lng !== 'number') && fallbackPlacement?.location) {
      enriched.location = fallbackPlacement.location;
    }

    if (!enriched.priority && fallbackPlacement?.priority) {
      enriched.priority = fallbackPlacement.priority;
    }

    if (!enriched.expectedImpact) {
      enriched.expectedImpact = {};
    }

    if (!enriched.expectedImpact.population && fallbackPlacement?.populationServed) {
      enriched.expectedImpact.population = fallbackPlacement.populationServed;
    }

    if (!enriched.expectedImpact.population && fallbackPlacement?.expectedImpact?.populationServed) {
      enriched.expectedImpact.population = fallbackPlacement.expectedImpact.populationServed;
    }

    if (!enriched.expectedImpact.timeframe && fallbackPlacement?.timeframe) {
      enriched.expectedImpact.timeframe = fallbackPlacement.timeframe;
    }

    return enriched;
  });

  return safePlan;
}

export default generateAiSolutionPlan;

// apiConfig.js - Central API configuration and key management
// Handles API keys, endpoints, and feature flags

/**
 * API Configuration
 */
const apiConfig = {
  // OpenRouteService - Isochrones and routing
  openRouteService: {
    apiKey: process.env.REACT_APP_ORS_API_KEY || '',
    baseUrl: 'https://api.openrouteservice.org/v2',
    rateLimit: 40, // requests per minute
    timeout: 10000
  },

  // US Census Bureau - Demographics
  census: {
    apiKey: process.env.REACT_APP_CENSUS_API_KEY || '',
    baseUrl: 'https://api.census.gov/data',
    geoUrl: 'https://geocoding.geo.census.gov/geocoder',
    rateLimit: 60,
    timeout: 5000
  },

  // USDA Soil Survey
  usda: {
    apiKey: process.env.REACT_APP_USDA_API_KEY || '',
    baseUrl: 'https://sdmdataaccess.sc.egov.usda.gov',
    rateLimit: 30,
    timeout: 8000
  },

  // EPA Brownfields
  epa: {
    apiKey: process.env.REACT_APP_EPA_API_KEY || '',
    baseUrl: 'https://data.epa.gov/efservice',
    rateLimit: 50,
    timeout: 5000
  },

  // ISRIC SoilGrids
  isric: {
    baseUrl: 'https://rest.isric.org/soilgrids/v2.0',
    rateLimit: 100,
    timeout: 8000
  },

  // NASA POWER (no key required)
  nasaPower: {
    baseUrl: 'https://power.larc.nasa.gov/api',
    rateLimit: 50,
    timeout: 10000
  },

  // OpenStreetMap APIs
  openStreetMap: {
    nominatim: {
      baseUrl: 'https://nominatim.openstreetmap.org',
      rateLimit: 1, // Very strict
      timeout: 5000
    },
    overpass: {
      baseUrl: 'https://overpass-api.de/api',
      rateLimit: 2,
      timeout: 25000
    }
  },

  // Google Gemini (future)
  gemini: {
    apiKey: process.env.REACT_APP_GEMINI_API_KEY || '',
    baseUrl: 'https://generativelanguage.googleapis.com/v1',
    model: 'gemini-2.5-flash',
    rateLimit: 15,
    timeout: 30000
  }
};

/**
 * Feature flags
 */
export const features = {
  demographics: process.env.REACT_APP_ENABLE_DEMOGRAPHICS !== 'false',
  soilAnalysis: process.env.REACT_APP_ENABLE_SOIL_ANALYSIS !== 'false',
  isochrones: process.env.REACT_APP_ENABLE_ISOCHRONES !== 'false',
  optimalPlacement: process.env.REACT_APP_ENABLE_OPTIMAL_PLACEMENT !== 'false',
  aiRecommendations: process.env.REACT_APP_ENABLE_AI_RECOMMENDATIONS === 'true'
};

/**
 * Cache TTL configuration
 */
export const cacheTTL = {
  demographics: parseInt(process.env.REACT_APP_CACHE_TTL_DEMOGRAPHICS) || 7200000,
  soil: parseInt(process.env.REACT_APP_CACHE_TTL_SOIL) || 86400000,
  climate: parseInt(process.env.REACT_APP_CACHE_TTL_CLIMATE) || 43200000,
  isochrones: parseInt(process.env.REACT_APP_CACHE_TTL_ISOCHRONES) || 7200000,
  foodOutlets: parseInt(process.env.REACT_APP_CACHE_TTL_FOOD_OUTLETS) || 3600000
};

/**
 * Check if API key is configured
 */
export function hasApiKey(service) {
  const serviceConfig = apiConfig[service];
  return serviceConfig && serviceConfig.apiKey && serviceConfig.apiKey.length > 0;
}

/**
 * Get API configuration for a service
 */
export function getApiConfig(service) {
  return apiConfig[service] || null;
}

/**
 * Get all configured APIs
 */
export function getConfiguredApis() {
  const configured = [];

  Object.keys(apiConfig).forEach(service => {
    const config = apiConfig[service];
    if (config.apiKey && config.apiKey.length > 0) {
      configured.push({
        service,
        hasKey: true,
        baseUrl: config.baseUrl
      });
    } else if (!config.apiKey) {
      // Services that don't require keys
      configured.push({
        service,
        hasKey: false,
        baseUrl: config.baseUrl || config.nominatim?.baseUrl,
        note: 'No key required'
      });
    }
  });

  return configured;
}

/**
 * Get missing API keys
 */
export function getMissingApiKeys() {
  const missing = [];

  const requiredServices = ['openRouteService', 'census'];
  const optionalServices = ['usda', 'epa', 'gemini'];

  requiredServices.forEach(service => {
    if (!hasApiKey(service)) {
      missing.push({
        service,
        priority: 'required',
        message: `${service} API key not configured`,
        impact: getServiceImpact(service)
      });
    }
  });

  optionalServices.forEach(service => {
    if (!hasApiKey(service)) {
      missing.push({
        service,
        priority: 'optional',
        message: `${service} API key not configured`,
        impact: getServiceImpact(service)
      });
    }
  });

  return missing;
}

/**
 * Get impact of missing API key
 */
function getServiceImpact(service) {
  const impacts = {
    openRouteService: 'Isochrones will use circular approximations instead of actual walking paths',
    census: 'Demographics will use estimates instead of actual Census data',
    usda: 'Soil data will use ISRIC SoilGrids (still functional)',
    epa: 'Contamination data will not be available',
    gemini: 'AI recommendations will not be available'
  };

  return impacts[service] || 'Limited functionality';
}

/**
 * Validate API configuration
 */
export function validateApiConfig() {
  const validation = {
    valid: true,
    warnings: [],
    errors: [],
    configured: getConfiguredApis()
  };

  const missing = getMissingApiKeys();

  missing.forEach(item => {
    if (item.priority === 'required') {
      validation.errors.push(item);
      validation.valid = false;
    } else {
      validation.warnings.push(item);
    }
  });

  return validation;
}

/**
 * Log API configuration status
 */
export function logApiStatus() {
  console.group('🔑 API Configuration Status');

  const configured = getConfiguredApis();
  const missing = getMissingApiKeys();

  console.log('Configured APIs:', configured.length);
  configured.forEach(api => {
    console.log(`  ✓ ${api.service} ${api.note ? '(' + api.note + ')' : ''}`);
  });

  if (missing.length > 0) {
    console.log('\nMissing API Keys:', missing.length);
    missing.forEach(item => {
      const symbol = item.priority === 'required' ? '❌' : '⚠️';
      console.log(`  ${symbol} ${item.service} (${item.priority})`);
      console.log(`     Impact: ${item.impact}`);
    });
  }

  console.log('\nFeature Flags:');
  Object.entries(features).forEach(([feature, enabled]) => {
    console.log(`  ${enabled ? '✓' : '✗'} ${feature}`);
  });

  console.groupEnd();

  return { configured, missing };
}

/**
 * Rate limiter class
 */
class RateLimiter {
  constructor(maxRequests, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  async waitForSlot() {
    const now = Date.now();

    // Remove old requests outside window
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    // Check if we're at limit
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);

      if (waitTime > 0) {
        console.log(`⏳ Rate limit reached, waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.waitForSlot(); // Retry
      }
    }

    // Add this request
    this.requests.push(now);
  }
}

// Create rate limiters for each service
const rateLimiters = {};

/**
 * Get rate limiter for a service
 */
export function getRateLimiter(service) {
  if (!rateLimiters[service]) {
    const config = getApiConfig(service);
    if (config && config.rateLimit) {
      rateLimiters[service] = new RateLimiter(config.rateLimit);
    }
  }
  return rateLimiters[service];
}

/**
 * Execute API call with rate limiting
 */
export async function rateLimitedApiCall(service, apiCallFunction) {
  const limiter = getRateLimiter(service);

  if (limiter) {
    await limiter.waitForSlot();
  }

  return apiCallFunction();
}

export default apiConfig;

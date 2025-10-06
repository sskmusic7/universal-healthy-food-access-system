// cacheManager.js - Intelligent caching layer for expensive API calls
// Reduces API usage and improves performance for frequently accessed data

/**
 * CacheManager - In-memory cache with TTL and size limits
 */
class CacheManager {
  constructor(options = {}) {
    this.cache = new Map();
    this.maxSize = options.maxSize || 100; // Max number of entries
    this.defaultTTL = options.defaultTTL || 3600000; // 1 hour in milliseconds
    this.cleanupInterval = options.cleanupInterval || 300000; // 5 minutes

    // Start periodic cleanup
    this.startCleanup();
  }

  /**
   * Get item from cache
   */
  get(key) {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    // Update access time for LRU
    item.lastAccessed = Date.now();
    item.accessCount++;

    return item.data;
  }

  /**
   * Set item in cache
   */
  set(key, data, ttl = this.defaultTTL) {
    // Enforce size limit
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl,
      created: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 0,
      size: this.estimateSize(data)
    });
  }

  /**
   * Check if key exists and is not expired
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Delete item from cache
   */
  delete(key) {
    return this.cache.delete(key);
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    let totalSize = 0;
    let expiredCount = 0;

    this.cache.forEach((item, key) => {
      totalSize += item.size;
      if (Date.now() > item.expiry) {
        expiredCount++;
      }
    });

    return {
      entries: this.cache.size,
      maxSize: this.maxSize,
      totalSize,
      expiredCount,
      utilizationPercent: (this.cache.size / this.maxSize) * 100
    };
  }

  /**
   * Evict least recently used item
   */
  evictLRU() {
    let lruKey = null;
    let lruTime = Infinity;

    this.cache.forEach((item, key) => {
      if (item.lastAccessed < lruTime) {
        lruTime = item.lastAccessed;
        lruKey = key;
      }
    });

    if (lruKey) {
      this.cache.delete(lruKey);
      console.log(`⚠️ Cache evicted LRU item: ${lruKey}`);
    }
  }

  /**
   * Remove expired entries
   */
  cleanup() {
    const now = Date.now();
    let cleanedCount = 0;

    this.cache.forEach((item, key) => {
      if (now > item.expiry) {
        this.cache.delete(key);
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) {
      console.log(`🧹 Cache cleanup: removed ${cleanedCount} expired entries`);
    }
  }

  /**
   * Start periodic cleanup
   */
  startCleanup() {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  /**
   * Stop periodic cleanup
   */
  stopCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }

  /**
   * Estimate size of cached data (approximate)
   */
  estimateSize(data) {
    const str = JSON.stringify(data);
    return str.length;
  }
}

// Global cache instances for different data types
const demographicCache = new CacheManager({
  maxSize: 50,
  defaultTTL: 7200000 // 2 hours - demographic data changes slowly
});

const soilCache = new CacheManager({
  maxSize: 100,
  defaultTTL: 86400000 // 24 hours - soil data is very static
});

const foodOutletCache = new CacheManager({
  maxSize: 50,
  defaultTTL: 3600000 // 1 hour - food outlets can change
});

const climateCache = new CacheManager({
  maxSize: 30,
  defaultTTL: 43200000 // 12 hours - climate data changes slowly
});

const isochroneCache = new CacheManager({
  maxSize: 200,
  defaultTTL: 7200000 // 2 hours - accessibility patterns stable
});

/**
 * Generate cache key from parameters
 */
function generateCacheKey(prefix, params) {
  const sortedParams = Object.keys(params).sort().map(key => {
    const value = params[key];
    if (typeof value === 'object') {
      return `${key}:${JSON.stringify(value)}`;
    }
    return `${key}:${value}`;
  });

  return `${prefix}:${sortedParams.join('|')}`;
}

/**
 * Cached fetch wrapper
 */
export async function cachedFetch(cacheType, key, fetchFunction, ttl = null) {
  const cache = getCacheForType(cacheType);

  // Try to get from cache
  const cached = cache.get(key);
  if (cached) {
    console.log(`💾 Cache hit for ${cacheType}: ${key}`);
    return cached;
  }

  // Cache miss - fetch data
  console.log(`🌐 Cache miss for ${cacheType}: ${key}, fetching...`);
  try {
    const data = await fetchFunction();
    cache.set(key, data, ttl);
    return data;
  } catch (error) {
    console.error(`Failed to fetch ${cacheType}:`, error);
    throw error;
  }
}

/**
 * Get appropriate cache for data type
 */
function getCacheForType(type) {
  const caches = {
    demographic: demographicCache,
    soil: soilCache,
    foodOutlet: foodOutletCache,
    climate: climateCache,
    isochrone: isochroneCache
  };

  return caches[type] || demographicCache;
}

/**
 * Prefetch and cache data
 */
export async function prefetchData(type, key, fetchFunction, ttl = null) {
  const cache = getCacheForType(type);

  if (!cache.has(key)) {
    console.log(`🔄 Prefetching ${type}: ${key}`);
    try {
      const data = await fetchFunction();
      cache.set(key, data, ttl);
      return data;
    } catch (error) {
      console.warn(`Prefetch failed for ${type}:`, error);
      return null;
    }
  }

  return cache.get(key);
}

/**
 * Invalidate cache for specific type or key
 */
export function invalidateCache(type, key = null) {
  const cache = getCacheForType(type);

  if (key) {
    cache.delete(key);
    console.log(`🗑️ Invalidated cache: ${type}/${key}`);
  } else {
    cache.clear();
    console.log(`🗑️ Cleared all cache for: ${type}`);
  }
}

/**
 * Get cache statistics for all caches
 */
export function getAllCacheStats() {
  return {
    demographic: demographicCache.getStats(),
    soil: soilCache.getStats(),
    foodOutlet: foodOutletCache.getStats(),
    climate: climateCache.getStats(),
    isochrone: isochroneCache.getStats()
  };
}

/**
 * Clear all caches
 */
export function clearAllCaches() {
  demographicCache.clear();
  soilCache.clear();
  foodOutletCache.clear();
  climateCache.clear();
  isochroneCache.clear();
  console.log('🧹 Cleared all caches');
}

// Demographic data caching helpers
export const demographicCacheHelpers = {
  get: (cityName) => cachedFetch(
    'demographic',
    generateCacheKey('demo', { city: cityName }),
    () => null // Fetch function provided by caller
  ),

  set: (cityName, data, ttl = 7200000) => {
    const key = generateCacheKey('demo', { city: cityName });
    demographicCache.set(key, data, ttl);
  },

  generateKey: (cityName) => generateCacheKey('demo', { city: cityName })
};

// Soil data caching helpers
export const soilCacheHelpers = {
  get: (lat, lng, radius) => {
    const key = generateCacheKey('soil', { lat: lat.toFixed(4), lng: lng.toFixed(4), radius });
    return soilCache.get(key);
  },

  set: (lat, lng, radius, data, ttl = 86400000) => {
    const key = generateCacheKey('soil', { lat: lat.toFixed(4), lng: lng.toFixed(4), radius });
    soilCache.set(key, data, ttl);
  },

  has: (lat, lng, radius) => {
    const key = generateCacheKey('soil', { lat: lat.toFixed(4), lng: lng.toFixed(4), radius });
    return soilCache.has(key);
  }
};

// Climate data caching helpers
export const climateCacheHelpers = {
  get: (lat, lng) => {
    const key = generateCacheKey('climate', { lat: lat.toFixed(2), lng: lng.toFixed(2) });
    return climateCache.get(key);
  },

  set: (lat, lng, data, ttl = 43200000) => {
    const key = generateCacheKey('climate', { lat: lat.toFixed(2), lng: lng.toFixed(2) });
    climateCache.set(key, data, ttl);
  }
};

// Isochrone caching helpers
export const isochroneCacheHelpers = {
  get: (lat, lng, profile, intervals) => {
    const key = generateCacheKey('iso', {
      lat: lat.toFixed(4),
      lng: lng.toFixed(4),
      profile,
      intervals: intervals.join(',')
    });
    return isochroneCache.get(key);
  },

  set: (lat, lng, profile, intervals, data, ttl = 7200000) => {
    const key = generateCacheKey('iso', {
      lat: lat.toFixed(4),
      lng: lng.toFixed(4),
      profile,
      intervals: intervals.join(',')
    });
    isochroneCache.set(key, data, ttl);
  }
};

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  cachedFetch,
  prefetchData,
  invalidateCache,
  getAllCacheStats,
  clearAllCaches,
  demographicCacheHelpers,
  soilCacheHelpers,
  climateCacheHelpers,
  isochroneCacheHelpers
};

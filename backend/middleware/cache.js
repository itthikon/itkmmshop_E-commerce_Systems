const logger = require('../config/logger');

// Simple in-memory cache
const cache = new Map();

// Cache configuration
const CACHE_DURATION = {
  short: 5 * 60 * 1000,      // 5 minutes
  medium: 15 * 60 * 1000,    // 15 minutes
  long: 60 * 60 * 1000,      // 1 hour
  veryLong: 24 * 60 * 60 * 1000  // 24 hours
};

/**
 * Generate cache key from request
 */
const generateCacheKey = (req) => {
  const { method, originalUrl, user } = req;
  const userId = user ? user.id : 'guest';
  return `${method}:${originalUrl}:${userId}`;
};

/**
 * Cache middleware factory
 * @param {number} duration - Cache duration in milliseconds
 * @param {function} keyGenerator - Optional custom key generator
 */
const cacheMiddleware = (duration = CACHE_DURATION.medium, keyGenerator = null) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = keyGenerator ? keyGenerator(req) : generateCacheKey(req);
    const cachedData = cache.get(key);

    if (cachedData) {
      const { data, timestamp } = cachedData;
      const age = Date.now() - timestamp;

      // Check if cache is still valid
      if (age < duration) {
        logger.debug(`Cache hit for key: ${key}`);
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Age', Math.floor(age / 1000));
        return res.json(data);
      } else {
        // Cache expired, remove it
        cache.delete(key);
        logger.debug(`Cache expired for key: ${key}`);
      }
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache response
    res.json = function(data) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, {
          data,
          timestamp: Date.now()
        });
        logger.debug(`Cache set for key: ${key}`);
      }
      
      res.setHeader('X-Cache', 'MISS');
      return originalJson(data);
    };

    next();
  };
};

/**
 * Clear cache by pattern
 * @param {string|RegExp} pattern - Pattern to match cache keys
 */
const clearCache = (pattern) => {
  let cleared = 0;
  
  if (typeof pattern === 'string') {
    // Clear exact match
    if (cache.has(pattern)) {
      cache.delete(pattern);
      cleared = 1;
    }
  } else if (pattern instanceof RegExp) {
    // Clear by regex pattern
    for (const key of cache.keys()) {
      if (pattern.test(key)) {
        cache.delete(key);
        cleared++;
      }
    }
  }
  
  logger.info(`Cleared ${cleared} cache entries`);
  return cleared;
};

/**
 * Clear all cache
 */
const clearAllCache = () => {
  const size = cache.size;
  cache.clear();
  logger.info(`Cleared all ${size} cache entries`);
  return size;
};

/**
 * Get cache statistics
 */
const getCacheStats = () => {
  return {
    size: cache.size,
    keys: Array.from(cache.keys())
  };
};

/**
 * Periodic cache cleanup - remove expired entries
 */
const cleanupExpiredCache = () => {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, value] of cache.entries()) {
    const age = now - value.timestamp;
    // Remove entries older than 1 hour
    if (age > CACHE_DURATION.long) {
      cache.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    logger.info(`Cleaned up ${cleaned} expired cache entries`);
  }
};

// Run cleanup every 30 minutes
setInterval(cleanupExpiredCache, 30 * 60 * 1000);

module.exports = {
  cacheMiddleware,
  CACHE_DURATION,
  clearCache,
  clearAllCache,
  getCacheStats
};

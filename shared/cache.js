/**
 * Redis Cache Service
 * Provides distributed caching with TTL, serialization, and connection management
 */

class CacheService {
  constructor() {
    this.redis = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // 1 second

    // Configuration
    this.defaultTTL = 5 * 60; // 5 minutes
    this.keyPrefix = process.env.CACHE_KEY_PREFIX || 'movieapp:';
    this.redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  }

  /**
   * Initialize Redis connection
   */
  async connect() {
    try {
      // Dynamic import to handle cases where redis is not installed
      const Redis = require('ioredis');

      this.redis = new Redis(this.redisUrl, {
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        connectTimeout: 10000,
        commandTimeout: 5000
      });

      // Event listeners
      this.redis.on('connect', () => {
        console.log('Redis connected successfully');
        this.isConnected = true;
        this.reconnectAttempts = 0;
      });

      this.redis.on('error', (error) => {
        console.error('Redis connection error:', error);
        this.isConnected = false;
      });

      this.redis.on('close', () => {
        console.log('Redis connection closed');
        this.isConnected = false;
        this.scheduleReconnect();
      });

      this.redis.on('reconnecting', () => {
        console.log('Redis reconnecting...');
      });

      // Connect to Redis
      await this.redis.connect();

      // Test connection
      await this.redis.ping();
      console.log('Redis cache service initialized');

    } catch (error) {
      console.error('Failed to initialize Redis:', error.message);
      this.isConnected = false;
      this.redis = null;

      // Fallback to in-memory cache
      console.log('Falling back to in-memory cache');
      this.initMemoryCache();
    }
  }

  /**
   * Initialize in-memory cache as fallback
   */
  initMemoryCache() {
    this.memoryCache = new Map();
    this.cacheTimers = new Map();
    this.isUsingMemoryCache = true;
    console.log('Using in-memory cache fallback');
  }

  /**
   * Schedule reconnection attempt
   */
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      console.log(`Attempting to reconnect to Redis (attempt ${this.reconnectAttempts})`);
      this.connect();
    }, delay);
  }

  /**
   * Generate cache key with prefix
   */
  generateKey(key) {
    return `${this.keyPrefix}${key}`;
  }

  /**
   * Set cache value with TTL
   */
  async set(key, value, ttl = this.defaultTTL) {
    try {
      const cacheKey = this.generateKey(key);
      const serializedValue = JSON.stringify({
        data: value,
        timestamp: Date.now(),
        ttl
      });

      if (this.isConnected && this.redis) {
        // Use Redis
        await this.redis.setex(cacheKey, ttl, serializedValue);
      } else if (this.isUsingMemoryCache) {
        // Fallback to memory cache
        this.memoryCache.set(cacheKey, serializedValue);

        // Clear existing timer
        const existingTimer = this.cacheTimers.get(cacheKey);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }

        // Set new timer
        const timer = setTimeout(() => {
          this.memoryCache.delete(cacheKey);
          this.cacheTimers.delete(cacheKey);
        }, ttl * 1000);

        this.cacheTimers.set(cacheKey, timer);
      }

      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Get cache value
   */
  async get(key) {
    try {
      const cacheKey = this.generateKey(key);

      if (this.isConnected && this.redis) {
        // Use Redis
        const value = await this.redis.get(cacheKey);
        if (value) {
          const parsed = JSON.parse(value);
          return parsed.data;
        }
        return null;
      } else if (this.isUsingMemoryCache) {
        // Fallback to memory cache
        const value = this.memoryCache.get(cacheKey);
        if (value) {
          const parsed = JSON.parse(value);
          return parsed.data;
        }
        return null;
      }

      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Delete cache key
   */
  async del(key) {
    try {
      const cacheKey = this.generateKey(key);

      if (this.isConnected && this.redis) {
        await this.redis.del(cacheKey);
      } else if (this.isUsingMemoryCache) {
        this.memoryCache.delete(cacheKey);
        const timer = this.cacheTimers.get(cacheKey);
        if (timer) {
          clearTimeout(timer);
          this.cacheTimers.delete(cacheKey);
        }
      }

      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key) {
    try {
      const cacheKey = this.generateKey(key);

      if (this.isConnected && this.redis) {
        return await this.redis.exists(cacheKey) === 1;
      } else if (this.isUsingMemoryCache) {
        return this.memoryCache.has(cacheKey);
      }

      return false;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Set multiple values (pipeline operation for Redis)
   */
  async mset(keyValuePairs, ttl = this.defaultTTL) {
    try {
      if (this.isConnected && this.redis) {
        const pipeline = this.redis.pipeline();

        keyValuePairs.forEach(([key, value]) => {
          const cacheKey = this.generateKey(key);
          const serializedValue = JSON.stringify({
            data: value,
            timestamp: Date.now(),
            ttl
          });
          pipeline.setex(cacheKey, ttl, serializedValue);
        });

        await pipeline.exec();
        return true;
      } else {
        // Fallback: set individually
        const promises = keyValuePairs.map(([key, value]) =>
          this.set(key, value, ttl)
        );
        await Promise.all(promises);
        return true;
      }
    } catch (error) {
      console.error('Cache mset error:', error);
      return false;
    }
  }

  /**
   * Get multiple values
   */
  async mget(keys) {
    try {
      if (this.isConnected && this.redis) {
        const cacheKeys = keys.map(key => this.generateKey(key));
        const values = await this.redis.mget(...cacheKeys);

        return values.map(value => {
          if (value) {
            try {
              const parsed = JSON.parse(value);
              return parsed.data;
            } catch (parseError) {
              console.error('Cache value parse error:', parseError);
              return null;
            }
          }
          return null;
        });
      } else {
        // Fallback: get individually
        const promises = keys.map(key => this.get(key));
        return Promise.all(promises);
      }
    } catch (error) {
      console.error('Cache mget error:', error);
      return new Array(keys.length).fill(null);
    }
  }

  /**
   * Increment numeric value
   */
  async incr(key, amount = 1) {
    try {
      const cacheKey = this.generateKey(key);

      if (this.isConnected && this.redis) {
        return await this.redis.incrby(cacheKey, amount);
      } else if (this.isUsingMemoryCache) {
        const current = parseInt(this.memoryCache.get(cacheKey) || '0');
        const newValue = current + amount;
        this.memoryCache.set(cacheKey, newValue.toString());
        return newValue;
      }

      return null;
    } catch (error) {
      console.error('Cache increment error:', error);
      return null;
    }
  }

  /**
   * Clear all cache with prefix
   */
  async clear() {
    try {
      if (this.isConnected && this.redis) {
        const pattern = `${this.keyPrefix}*`;
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
        return keys.length;
      } else if (this.isUsingMemoryCache) {
        const size = this.memoryCache.size;
        this.memoryCache.clear();
        this.cacheTimers.forEach(timer => clearTimeout(timer));
        this.cacheTimers.clear();
        return size;
      }

      return 0;
    } catch (error) {
      console.error('Cache clear error:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    try {
      if (this.isConnected && this.redis) {
        const info = await this.redis.info('memory');
        const keyCount = await this.redis.dbsize();

        return {
          type: 'redis',
          connected: true,
          keyCount,
          memoryInfo: info,
          keyPrefix: this.keyPrefix,
          defaultTTL: this.defaultTTL
        };
      } else if (this.isUsingMemoryCache) {
        return {
          type: 'memory',
          connected: true,
          keyCount: this.memoryCache.size,
          keyPrefix: this.keyPrefix,
          defaultTTL: this.defaultTTL
        };
      }

      return {
        type: 'none',
        connected: false,
        keyCount: 0,
        keyPrefix: this.keyPrefix,
        defaultTTL: this.defaultTTL
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return {
        type: 'error',
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect() {
    try {
      if (this.redis) {
        await this.redis.disconnect();
        this.redis = null;
        this.isConnected = false;
      }

      // Clear memory cache timers
      if (this.cacheTimers) {
        this.cacheTimers.forEach(timer => clearTimeout(timer));
        this.cacheTimers.clear();
      }

      console.log('Cache service disconnected');
    } catch (error) {
      console.error('Cache disconnect error:', error);
    }
  }

  /**
   * Health check for cache
   */
  async healthCheck() {
    try {
      if (this.isConnected && this.redis) {
        const start = Date.now();
        await this.redis.ping();
        const latency = Date.now() - start;

        return {
          status: 'healthy',
          type: 'redis',
          latency: `${latency}ms`,
          connected: true
        };
      } else if (this.isUsingMemoryCache) {
        return {
          status: 'healthy',
          type: 'memory',
          connected: true,
          fallback: true
        };
      }

      return {
        status: 'unhealthy',
        type: 'none',
        connected: false
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        type: 'error',
        connected: false,
        error: error.message
      };
    }
  }
}

// Create singleton instance
const cacheService = new CacheService();

module.exports = cacheService;
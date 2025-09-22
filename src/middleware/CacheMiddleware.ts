// import { Request, Response, NextFunction } from 'express';
import { CacheManager } from '../utils/CacheManager';

export interface CacheMiddlewareOptions {
  enableCaching?: boolean;
  defaultTTL?: number;
  cacheKeyGenerator?: (req: any) => string;
  cacheCondition?: (req: any, res: any) => boolean;
  excludePaths?: string[];
  excludeMethods?: string[];
  includeHeaders?: string[];
  includeQuery?: boolean;
  includeBody?: boolean;
}

export class CacheMiddleware {
  private cacheManager: CacheManager;
  private options: CacheMiddlewareOptions;

  constructor(cacheManager: CacheManager, options: CacheMiddlewareOptions = {}) {
    this.cacheManager = cacheManager;
    this.options = {
      enableCaching: true,
      defaultTTL: 300,
      cacheCondition: (_req: any, res: any) => res.statusCode === 200,
      excludePaths: ['/health', '/metrics'],
      excludeMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],
      includeHeaders: ['authorization', 'content-type'],
      includeQuery: true,
      includeBody: false,
      ...options,
    };
  }

  /**
   * Cache middleware for GET requests
   */
  public cache() {
    return async (req: any, res: any, next: any): Promise<void> => {
      try {
        // Check if caching is enabled
        if (!this.options.enableCaching) {
          return next();
        }

        // Check if method should be excluded
        if (this.options.excludeMethods?.includes(req.method)) {
          return next();
        }

        // Check if path should be excluded
        if (this.shouldExcludePath(req.path)) {
          return next();
        }

        // Generate cache key
        const cacheKey = this.generateCacheKey(req);

        // Try to get from cache
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
          res.setHeader('x-cache', 'HIT');
          res.setHeader('x-cache-key', cacheKey);
          return res.json(cached);
        }

        // Set cache miss header
        res.setHeader('x-cache', 'MISS');
        res.setHeader('x-cache-key', cacheKey);

        // Override res.json to cache response
        const originalJson = res.json;
        res.json = (body: any) => {
          // Check if response should be cached
          if (this.options.cacheCondition?.(req, res)) {
            this.cacheManager.set(cacheKey, body, { ttl: this.options.defaultTTL || 300 });
          }
          return originalJson.call(res, body);
        };

        next();
      } catch (error) {
        console.error('Cache middleware error:', error);
        next();
      }
    };
  }

  /**
   * Cache invalidation middleware
   */
  public invalidateCache() {
    return async (req: any, _res: any, next: any): Promise<void> => {
      try {
        // Check if caching is enabled
        if (!this.options.enableCaching) {
          return next();
        }

        // Check if method should invalidate cache
        if (this.options.excludeMethods?.includes(req.method)) {
          // Invalidate cache for this resource
          const cacheKey = this.generateCacheKey(req);
          await this.cacheManager.del(cacheKey);

          // Invalidate related cache keys
          await this.invalidateRelatedCache(req);
        }

        next();
      } catch (error) {
        console.error('Cache invalidation error:', error);
        next();
      }
    };
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(req: any): string {
    if (this.options.cacheKeyGenerator) {
      return this.options.cacheKeyGenerator(req);
    }

    const keyParts: string[] = [req.method, req.path];

    // Include query parameters
    if (this.options.includeQuery && Object.keys(req.query).length > 0) {
      keyParts.push(JSON.stringify(req.query));
    }

    // Include body
    if (this.options.includeBody && req.body && Object.keys(req.body).length > 0) {
      keyParts.push(JSON.stringify(req.body));
    }

    // Include headers
    if (this.options.includeHeaders) {
      const headerValues: string[] = [];
      this.options.includeHeaders.forEach(header => {
        if (req.headers[header]) {
          headerValues.push(`${header}:${req.headers[header]}`);
        }
      });
      if (headerValues.length > 0) {
        keyParts.push(headerValues.join('|'));
      }
    }

    return this.cacheManager.generateKey('http', ...keyParts);
  }

  /**
   * Check if path should be excluded from caching
   */
  private shouldExcludePath(path: string): boolean {
    if (!this.options.excludePaths) return false;
    return this.options.excludePaths.some(excludePath => path.startsWith(excludePath));
  }

  /**
   * Invalidate related cache keys
   */
  private async invalidateRelatedCache(req: any): Promise<void> {
    try {
      // This is a simplified implementation
      // In a real application, you would maintain relationships between cache keys
      const baseKey = this.generateCacheKey(req);
      const relatedKeys = await this.getRelatedCacheKeys(baseKey);

      for (const key of relatedKeys) {
        await this.cacheManager.del(key);
      }
    } catch (error) {
      console.error('Error invalidating related cache:', error);
    }
  }

  /**
   * Get related cache keys (simplified implementation)
   */
  private async getRelatedCacheKeys(_baseKey: string): Promise<string[]> {
    // This is a simplified implementation
    // In a real application, you would maintain a mapping of related keys
    return [];
  }

  /**
   * Set cache options
   */
  public setOptions(options: Partial<CacheMiddlewareOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get cache options
   */
  public getOptions(): CacheMiddlewareOptions {
    return { ...this.options };
  }

  /**
   * Get cache manager
   */
  public getCacheManager(): CacheManager {
    return this.cacheManager;
  }

  /**
   * Enable caching
   */
  public enableCaching(): void {
    this.options.enableCaching = true;
  }

  /**
   * Disable caching
   */
  public disableCaching(): void {
    this.options.enableCaching = false;
  }

  /**
   * Set default TTL
   */
  public setDefaultTTL(ttl: number): void {
    this.options.defaultTTL = ttl;
  }

  /**
   * Set cache key generator
   */
  public setCacheKeyGenerator(generator: (req: any) => string): void {
    this.options.cacheKeyGenerator = generator;
  }

  /**
   * Set cache condition
   */
  public setCacheCondition(condition: (req: any, res: any) => boolean): void {
    this.options.cacheCondition = condition;
  }

  /**
   * Add excluded path
   */
  public addExcludedPath(path: string): void {
    if (!this.options.excludePaths) {
      this.options.excludePaths = [];
    }
    this.options.excludePaths.push(path);
  }

  /**
   * Remove excluded path
   */
  public removeExcludedPath(path: string): void {
    if (this.options.excludePaths) {
      this.options.excludePaths = this.options.excludePaths.filter(p => p !== path);
    }
  }

  /**
   * Add excluded method
   */
  public addExcludedMethod(method: string): void {
    if (!this.options.excludeMethods) {
      this.options.excludeMethods = [];
    }
    this.options.excludeMethods.push(method);
  }

  /**
   * Remove excluded method
   */
  public removeExcludedMethod(method: string): void {
    if (this.options.excludeMethods) {
      this.options.excludeMethods = this.options.excludeMethods.filter(m => m !== method);
    }
  }
}

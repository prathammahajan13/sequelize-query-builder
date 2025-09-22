import { CacheOptions } from '../types/QueryTypes';

export interface CacheProvider {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
}

export class MemoryCacheProvider implements CacheProvider {
  private cache: Map<string, { value: any; expires: number }> = new Map();
  private defaultTTL: number = 300; // 5 minutes

  constructor(defaultTTL: number = 300) {
    this.defaultTTL = defaultTTL;
  }

  public async get(key: string): Promise<any> {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  public async set(key: string, value: any, ttl?: number): Promise<void> {
    const expires = Date.now() + (ttl || this.defaultTTL) * 1000;
    this.cache.set(key, { value, expires });
  }

  public async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  public async clear(): Promise<void> {
    this.cache.clear();
  }

  public async has(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    if (!item) return false;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  public size(): number {
    return this.cache.size;
  }

  public cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }
}

export class CacheManager {
  private provider: CacheProvider;
  private enabled: boolean = false;
  private defaultTTL: number = 300;
  private keyPrefix: string = 'sqb:';

  constructor(provider: CacheProvider, enabled: boolean = false, defaultTTL: number = 300) {
    this.provider = provider;
    this.enabled = enabled;
    this.defaultTTL = defaultTTL;
  }

  public async get<T = any>(key: string): Promise<T | null> {
    if (!this.enabled) return null;

    try {
      const fullKey = this.keyPrefix + key;
      return await this.provider.get(fullKey);
    } catch (error) {
      console.warn(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  public async set(key: string, value: any, options?: Partial<CacheOptions>): Promise<void> {
    if (!this.enabled) return;

    try {
      const fullKey = this.keyPrefix + key;
      const ttl = options?.ttl || this.defaultTTL;
      await this.provider.set(fullKey, value, ttl);
    } catch (error) {
      console.warn(`Cache set error for key ${key}:`, error);
    }
  }

  public async del(key: string): Promise<void> {
    if (!this.enabled) return;

    try {
      const fullKey = this.keyPrefix + key;
      await this.provider.del(fullKey);
    } catch (error) {
      console.warn(`Cache delete error for key ${key}:`, error);
    }
  }

  public async clear(): Promise<void> {
    if (!this.enabled) return;

    try {
      await this.provider.clear();
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }

  public async has(key: string): Promise<boolean> {
    if (!this.enabled) return false;

    try {
      const fullKey = this.keyPrefix + key;
      return await this.provider.has(fullKey);
    } catch (error) {
      console.warn(`Cache has error for key ${key}:`, error);
      return false;
    }
  }

  public generateKey(prefix: string, ...parts: string[]): string {
    return [prefix, ...parts].join(':');
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public setDefaultTTL(ttl: number): void {
    this.defaultTTL = ttl;
  }

  public setKeyPrefix(prefix: string): void {
    this.keyPrefix = prefix;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public getDefaultTTL(): number {
    return this.defaultTTL;
  }

  public getKeyPrefix(): string {
    return this.keyPrefix;
  }

  public setProvider(provider: CacheProvider): void {
    this.provider = provider;
  }

  public getProvider(): CacheProvider {
    return this.provider;
  }

  // Utility methods for common cache operations
  public async getOrSet<T = any>(
    key: string,
    factory: () => Promise<T>,
    options?: Partial<CacheOptions>
  ): Promise<T> {
    let value = await this.get<T>(key);
    if (value === null) {
      value = await factory();
      await this.set(key, value, options);
    }
    return value;
  }

  public async invalidatePattern(_pattern: string): Promise<void> {
    if (!this.enabled) return;

    // This is a simplified implementation
    // In a real Redis implementation, you would use SCAN with MATCH
    console.warn('Pattern invalidation not implemented for current cache provider');
  }

  public async invalidateTags(_tags: string[]): Promise<void> {
    if (!this.enabled) return;

    // This is a simplified implementation
    // In a real implementation, you would maintain tag-to-key mappings
    console.warn('Tag invalidation not implemented for current cache provider');
  }
}

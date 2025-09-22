import { PerformanceMetrics, QueryContext } from '../types/QueryTypes';

export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private enabled: boolean = true;
  private threshold: number = 1000; // milliseconds

  constructor(enabled: boolean = true, threshold: number = 1000) {
    this.enabled = enabled;
    this.threshold = threshold;
  }

  public startMonitoring(context: QueryContext): string {
    if (!this.enabled) return '';

    const monitorId = this.generateMonitorId(context);
    // const _startTime = Date.now();

    this.metrics.set(monitorId, {
      queryExecutionTime: 0,
      totalExecutionTime: 0,
      memoryUsage: 0,
      queryCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
    });

    return monitorId;
  }

  public endMonitoring(monitorId: string): PerformanceMetrics | null {
    if (!this.enabled || !monitorId) return null;

    const metrics = this.metrics.get(monitorId);
    if (!metrics) return null;

    const endTime = Date.now();
    metrics.totalExecutionTime = endTime - Date.now();

    // Check if execution time exceeds threshold
    if (metrics.totalExecutionTime > this.threshold) {
      console.warn(
        `Query execution time (${metrics.totalExecutionTime}ms) exceeded threshold (${this.threshold}ms)`
      );
    }

    // Clean up
    this.metrics.delete(monitorId);
    return metrics;
  }

  public recordQueryExecution(monitorId: string, executionTime: number): void {
    if (!this.enabled || !monitorId) return;

    const metrics = this.metrics.get(monitorId);
    if (metrics) {
      metrics.queryExecutionTime += executionTime;
      metrics.queryCount++;
    }
  }

  public recordCacheHit(monitorId: string): void {
    if (!this.enabled || !monitorId) return;

    const metrics = this.metrics.get(monitorId);
    if (metrics) {
      metrics.cacheHits++;
    }
  }

  public recordCacheMiss(monitorId: string): void {
    if (!this.enabled || !monitorId) return;

    const metrics = this.metrics.get(monitorId);
    if (metrics) {
      metrics.cacheMisses++;
    }
  }

  public recordMemoryUsage(monitorId: string, memoryUsage: number): void {
    if (!this.enabled || !monitorId) return;

    const metrics = this.metrics.get(monitorId);
    if (metrics) {
      metrics.memoryUsage = memoryUsage;
    }
  }

  public getMetrics(monitorId: string): PerformanceMetrics | null {
    return this.metrics.get(monitorId) || null;
  }

  public getAllMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.metrics);
  }

  public clearMetrics(): void {
    this.metrics.clear();
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public setThreshold(threshold: number): void {
    this.threshold = threshold;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public getThreshold(): number {
    return this.threshold;
  }

  private generateMonitorId(context: QueryContext): string {
    return `${context.method}_${(context.model as any).name}_${context.requestId}_${Date.now()}`;
  }

  public getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return usage.heapUsed;
    }
    return 0;
  }

  public formatMetrics(metrics: PerformanceMetrics): string {
    return `
Performance Metrics:
- Total Execution Time: ${metrics.totalExecutionTime}ms
- Query Execution Time: ${metrics.queryExecutionTime}ms
- Query Count: ${metrics.queryCount}
- Memory Usage: ${this.formatBytes(metrics.memoryUsage)}
- Cache Hits: ${metrics.cacheHits}
- Cache Misses: ${metrics.cacheMisses}
- Cache Hit Rate: ${this.calculateCacheHitRate(metrics)}%
    `.trim();
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private calculateCacheHitRate(metrics: PerformanceMetrics): number {
    const total = metrics.cacheHits + metrics.cacheMisses;
    if (total === 0) return 0;
    return Math.round((metrics.cacheHits / total) * 100);
  }
}

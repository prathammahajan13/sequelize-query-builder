// import { Request, Response, NextFunction } from 'express';
import { PerformanceMonitor } from '../utils/PerformanceMonitor';
import { QueryContext } from '../types/QueryTypes';

export interface LoggingMiddlewareOptions {
  enableRequestLogging?: boolean;
  enableResponseLogging?: boolean;
  enablePerformanceLogging?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  performanceThreshold?: number;
  excludePaths?: string[];
  includeHeaders?: string[];
  includeBody?: boolean;
  includeQuery?: boolean;
}

export class LoggingMiddleware {
  private options: LoggingMiddlewareOptions;
  private performanceMonitor: PerformanceMonitor;
  private requestStartTimes: Map<string, number> = new Map();

  constructor(options: LoggingMiddlewareOptions = {}) {
    this.options = {
      enableRequestLogging: true,
      enableResponseLogging: true,
      enablePerformanceLogging: true,
      logLevel: 'info',
      performanceThreshold: 1000,
      excludePaths: ['/health', '/metrics'],
      includeHeaders: ['user-agent', 'content-type', 'authorization'],
      includeBody: false,
      includeQuery: true,
      ...options,
    };

    this.performanceMonitor = new PerformanceMonitor(
      this.options.enablePerformanceLogging,
      this.options.performanceThreshold
    );
  }

  /**
   * Request logging middleware
   */
  public requestLogger() {
    return (req: any, res: any, next: any): void => {
      const requestId = this.generateRequestId();
      const startTime = Date.now();

      // Store request start time
      this.requestStartTimes.set(requestId, startTime);

      // Add request ID to headers
      req.headers['x-request-id'] = requestId;
      res.setHeader('x-request-id', requestId);

      // Check if path should be excluded
      if (this.shouldExcludePath(req.path)) {
        return next();
      }

      // Log request
      if (this.options.enableRequestLogging) {
        this.logRequest(req, requestId);
      }

      // Override res.end to log response
      const originalEnd = res.end;
      res.end = (chunk?: any, encoding?: any) => {
        if (this.options.enableResponseLogging) {
          this.logResponse(req, res, requestId, startTime);
        }
        originalEnd.call(res, chunk, encoding);
      };

      next();
    };
  }

  /**
   * Performance logging middleware
   */
  public performanceLogger() {
    return (req: any, res: any, next: any): void => {
      const requestId = req.headers['x-request-id'] as string;
      const startTime = Date.now();

      if (!requestId) {
        return next();
      }

      // Create query context
      const context: QueryContext = {
        method: req.method as any,
        model: null as any, // Will be set by the query builder
        options: {},
        startTime,
        requestId,
      };

      const monitorId = this.performanceMonitor.startMonitoring(context);

      // Override res.end to log performance
      const originalEnd = res.end;
      res.end = (chunk?: any, encoding?: any) => {
        const endTime = Date.now();
        const executionTime = endTime - startTime;

        this.performanceMonitor.recordQueryExecution(monitorId, executionTime);
        const metrics = this.performanceMonitor.endMonitoring(monitorId);

        if (metrics && this.options.enablePerformanceLogging) {
          this.logPerformance(req, res, metrics, requestId);
        }

        originalEnd.call(res, chunk, encoding);
      };

      next();
    };
  }

  /**
   * Error logging middleware
   */
  public errorLogger() {
    return (error: any, req: any, _res: any, next: any): void => {
      const requestId = req.headers['x-request-id'] as string;

      this.logError(error, req, requestId);
      next(error);
    };
  }

  /**
   * Log request details
   */
  private logRequest(req: any, requestId: string): void {
    const logData: any = {
      type: 'request',
      requestId,
      method: req.method,
      url: req.url,
      path: req.path,
      timestamp: new Date().toISOString(),
    };

    if (this.options.includeHeaders) {
      logData.headers = this.filterHeaders(req.headers);
    }

    if (this.options.includeQuery && Object.keys(req.query).length > 0) {
      logData.query = req.query;
    }

    if (this.options.includeBody && req.body && Object.keys(req.body).length > 0) {
      logData.body = req.body;
    }

    this.log('info', 'Request received', logData);
  }

  /**
   * Log response details
   */
  private logResponse(req: any, res: any, requestId: string, startTime: number): void {
    const executionTime = Date.now() - startTime;

    const logData: any = {
      type: 'response',
      requestId,
      method: req.method,
      url: req.url,
      path: req.path,
      statusCode: res.statusCode,
      executionTime,
      timestamp: new Date().toISOString(),
    };

    if (this.options.includeHeaders) {
      logData.responseHeaders = this.filterHeaders(res.getHeaders());
    }

    this.log('info', 'Response sent', logData);
  }

  /**
   * Log performance metrics
   */
  private logPerformance(req: any, res: any, metrics: any, requestId: string): void {
    const logData: any = {
      type: 'performance',
      requestId,
      method: req.method,
      url: req.url,
      path: req.path,
      statusCode: res.statusCode,
      metrics,
      timestamp: new Date().toISOString(),
    };

    this.log('info', 'Performance metrics', logData);
  }

  /**
   * Log error details
   */
  private logError(error: any, req: any, requestId: string): void {
    const logData: any = {
      type: 'error',
      requestId,
      method: req.method,
      url: req.url,
      path: req.path,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      timestamp: new Date().toISOString(),
    };

    this.log('error', 'Error occurred', logData);
  }

  /**
   * Filter headers to include only specified ones
   */
  private filterHeaders(headers: any): any {
    if (!this.options.includeHeaders) return {};

    const filtered: any = {};
    this.options.includeHeaders.forEach(header => {
      if (headers[header]) {
        filtered[header] = headers[header];
      }
    });

    return filtered;
  }

  /**
   * Check if path should be excluded from logging
   */
  private shouldExcludePath(path: string): boolean {
    if (!this.options.excludePaths) return false;
    return this.options.excludePaths.some(excludePath => path.startsWith(excludePath));
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log message with specified level
   */
  private log(level: string, message: string, data: any): void {
    const logLevel = this.options.logLevel || 'info';
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };

    if (levels[level as keyof typeof levels] >= levels[logLevel as keyof typeof levels]) {
      console.log(`[${level.toUpperCase()}] ${message}`, JSON.stringify(data, null, 2));
    }
  }

  /**
   * Set options
   */
  public setOptions(options: Partial<LoggingMiddlewareOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get options
   */
  public getOptions(): LoggingMiddlewareOptions {
    return { ...this.options };
  }

  /**
   * Get performance monitor
   */
  public getPerformanceMonitor(): PerformanceMonitor {
    return this.performanceMonitor;
  }

  /**
   * Clear request start times
   */
  public clearRequestStartTimes(): void {
    this.requestStartTimes.clear();
  }

  /**
   * Get request start time
   */
  public getRequestStartTime(requestId: string): number | undefined {
    return this.requestStartTimes.get(requestId);
  }
}

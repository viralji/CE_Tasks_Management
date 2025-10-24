/**
 * Performance Monitoring Utilities
 * 
 * Tools for monitoring and optimizing application performance
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000; // Keep only last 1000 metrics

  /**
   * Measure execution time of a function
   */
  async measure<T>(
    name: string, 
    fn: () => Promise<T>, 
    metadata?: Record<string, any>
  ): Promise<T> {
    const start = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - start;
      
      this.recordMetric({
        name,
        duration,
        timestamp: Date.now(),
        metadata
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      
      this.recordMetric({
        name: `${name}-error`,
        duration,
        timestamp: Date.now(),
        metadata: { ...metadata, error: error instanceof Error ? error.message : 'Unknown error' }
      });
      
      throw error;
    }
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Get performance statistics
   */
  getStats(name?: string) {
    const filtered = name ? this.metrics.filter(m => m.name === name) : this.metrics;
    
    if (filtered.length === 0) {
      return { count: 0, avg: 0, min: 0, max: 0, p95: 0 };
    }

    const durations = filtered.map(m => m.duration).sort((a, b) => a - b);
    const count = durations.length;
    const avg = durations.reduce((sum, d) => sum + d, 0) / count;
    const min = durations[0];
    const max = durations[count - 1];
    const p95Index = Math.floor(count * 0.95);
    const p95 = durations[p95Index];

    return { count, avg, min, max, p95 };
  }

  /**
   * Get slow queries (over threshold)
   */
  getSlowQueries(threshold: number = 1000) {
    return this.metrics.filter(m => m.duration > threshold);
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = [];
  }
}

// Global performance monitor instance
export const perfMonitor = new PerformanceMonitor();

/**
 * Decorator for measuring function performance
 */
export function measurePerformance(name: string, metadata?: Record<string, any>) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return perfMonitor.measure(
        `${target.constructor.name}.${propertyName}`,
        () => method.apply(this, args),
        metadata
      );
    };
  };
}

/**
 * React hook for measuring component render performance
 */
export function usePerformanceMonitor(componentName: string) {
  const startTime = performance.now();

  return {
    endMeasure: (metadata?: Record<string, any>) => {
      const duration = performance.now() - startTime;
      perfMonitor.recordMetric({
        name: `component-${componentName}`,
        duration,
        timestamp: Date.now(),
        metadata
      });
    }
  };
}

/**
 * Database query performance wrapper
 */
export async function measureQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  return perfMonitor.measure(`db-${queryName}`, queryFn);
}

/**
 * API endpoint performance wrapper
 */
export async function measureApi<T>(
  endpoint: string,
  handler: () => Promise<T>
): Promise<T> {
  return perfMonitor.measure(`api-${endpoint}`, handler);
}

/**
 * Get performance report
 */
export function getPerformanceReport() {
  const stats = perfMonitor.getStats();
  const slowQueries = perfMonitor.getSlowQueries(500); // Queries over 500ms
  
  return {
    overall: stats,
    slowQueries: slowQueries.map(q => ({
      name: q.name,
      duration: q.duration,
      timestamp: new Date(q.timestamp).toISOString(),
      metadata: q.metadata
    })),
    recommendations: generateRecommendations(stats, slowQueries)
  };
}

/**
 * Generate performance recommendations
 */
function generateRecommendations(stats: any, slowQueries: PerformanceMetric[]) {
  const recommendations: string[] = [];

  if (stats.avg > 1000) {
    recommendations.push('Average response time is high. Consider optimizing database queries.');
  }

  if (slowQueries.length > 0) {
    recommendations.push(`${slowQueries.length} slow queries detected. Review and optimize.`);
  }

  if (stats.p95 > 2000) {
    recommendations.push('95th percentile response time is high. Consider adding caching.');
  }

  return recommendations;
}

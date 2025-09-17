import type { BaseEntity, EntityRelationship } from '../types/entityRegistry';
import type { TimelineEvent } from '../types/unifiedTimeline';

export interface PerformanceMetrics {
  entityCount: number;
  relationshipCount: number;
  timelineEventCount: number;
  memoryUsage: number;
  renderTime: number;
  searchLatency: number;
  lastOptimized: Date;
}

export interface OptimizationStrategy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  estimatedImprovement: number; // percentage
  implement: () => Promise<void>;
}

export interface LazyLoadConfig {
  entitiesPerPage: number;
  eventsPerPage: number;
  preloadDistance: number; // pages to preload ahead
  cacheSize: number; // maximum items in cache
  enableVirtualization: boolean;
}

export interface CacheStrategy {
  maxSize: number;
  ttl: number; // time to live in milliseconds
  strategy: 'lru' | 'lfu' | 'fifo';
  enablePersistence: boolean;
}

export class PerformanceOptimizer {
  private metrics: PerformanceMetrics;
  private strategies: Map<string, OptimizationStrategy> = new Map();
  private lazyLoadConfig: LazyLoadConfig;
  private cacheStrategy: CacheStrategy;
  private entityCache: Map<string, { data: BaseEntity; timestamp: number; accessCount: number }> = new Map();
  private relationshipCache: Map<string, { data: EntityRelationship[]; timestamp: number; accessCount: number }> = new Map();
  private searchCache: Map<string, { data: any; timestamp: number; accessCount: number }> = new Map();
  private isOptimizing = false;
  private optimizationInterval: number | null = null;

  constructor() {
    this.metrics = {
      entityCount: 0,
      relationshipCount: 0,
      timelineEventCount: 0,
      memoryUsage: 0,
      renderTime: 0,
      searchLatency: 0,
      lastOptimized: new Date()
    };

    this.lazyLoadConfig = {
      entitiesPerPage: 50,
      eventsPerPage: 100,
      preloadDistance: 2,
      cacheSize: 1000,
      enableVirtualization: true
    };

    this.cacheStrategy = {
      maxSize: 500,
      ttl: 300000, // 5 minutes
      strategy: 'lru',
      enablePersistence: true
    };

    this.initializeStrategies();
    this.startPerformanceMonitoring();
  }

  private initializeStrategies() {
    const strategies: OptimizationStrategy[] = [
      {
        id: 'entity-indexing',
        name: 'Entity Indexing',
        description: 'Create search indexes for faster entity queries',
        enabled: true,
        priority: 1,
        estimatedImprovement: 40,
        implement: async () => {
          await this.implementEntityIndexing();
        }
      },
      {
        id: 'relationship-caching',
        name: 'Relationship Caching',
        description: 'Cache frequently accessed entity relationships',
        enabled: true,
        priority: 2,
        estimatedImprovement: 30,
        implement: async () => {
          await this.implementRelationshipCaching();
        }
      },
      {
        id: 'lazy-loading',
        name: 'Lazy Loading',
        description: 'Load content on-demand to reduce initial load time',
        enabled: true,
        priority: 3,
        estimatedImprovement: 25,
        implement: async () => {
          await this.implementLazyLoading();
        }
      },
      {
        id: 'memory-optimization',
        name: 'Memory Optimization',
        description: 'Optimize memory usage for large datasets',
        enabled: true,
        priority: 4,
        estimatedImprovement: 20,
        implement: async () => {
          await this.implementMemoryOptimization();
        }
      },
      {
        id: 'search-optimization',
        name: 'Search Optimization',
        description: 'Optimize search algorithms and caching',
        enabled: true,
        priority: 5,
        estimatedImprovement: 35,
        implement: async () => {
          await this.implementSearchOptimization();
        }
      },
      {
        id: 'render-optimization',
        name: 'Render Optimization',
        description: 'Optimize component rendering and virtual DOM',
        enabled: true,
        priority: 6,
        estimatedImprovement: 15,
        implement: async () => {
          await this.implementRenderOptimization();
        }
      }
    ];

    strategies.forEach(strategy => {
      this.strategies.set(strategy.id, strategy);
    });
  }

  // Performance Monitoring
  private startPerformanceMonitoring() {
    // Monitor performance every 30 seconds
    this.optimizationInterval = setInterval(() => {
      this.updateMetrics();
      this.autoOptimize();
    }, 30000);

    // Initial metrics update
    this.updateMetrics();
  }

  private updateMetrics() {
    // Simulate metrics collection
    this.metrics = {
      ...this.metrics,
      memoryUsage: this.calculateMemoryUsage(),
      renderTime: performance.now() % 100, // Mock render time
      searchLatency: this.calculateAverageSearchLatency()
    };
  }

  private calculateMemoryUsage(): number {
    // Estimate memory usage based on cached data
    let usage = 0;
    usage += this.entityCache.size * 2; // KB per entity
    usage += this.relationshipCache.size * 1; // KB per relationship set
    usage += this.searchCache.size * 0.5; // KB per search result
    return usage;
  }

  private calculateAverageSearchLatency(): number {
    // Return mock latency based on cache hit rate
    const hitRate = this.getCacheHitRate();
    return hitRate > 0.8 ? 50 : hitRate > 0.5 ? 100 : 200; // milliseconds
  }

  // Auto-optimization
  private async autoOptimize() {
    if (this.isOptimizing) return;

    const shouldOptimize = this.shouldTriggerOptimization();
    if (shouldOptimize) {
      await this.runOptimization();
    }
  }

  private shouldTriggerOptimization(): boolean {
    const { memoryUsage, renderTime, searchLatency } = this.metrics;

    // Trigger optimization if any threshold is exceeded
    return (
      memoryUsage > 100 || // MB
      renderTime > 16 || // 16ms (60fps)
      searchLatency > 150 // ms
    );
  }

  async runOptimization(): Promise<void> {
    if (this.isOptimizing) return;

    this.isOptimizing = true;
    const startTime = performance.now();

    try {
      console.log('Starting performance optimization...');

      // Run enabled strategies in priority order
      const enabledStrategies = Array.from(this.strategies.values())
        .filter(s => s.enabled)
        .sort((a, b) => a.priority - b.priority);

      for (const strategy of enabledStrategies) {
        try {
          console.log(`Implementing ${strategy.name}...`);
          await strategy.implement();
        } catch (error) {
          console.error(`Failed to implement ${strategy.name}:`, error);
        }
      }

      this.metrics.lastOptimized = new Date();
      const optimizationTime = performance.now() - startTime;
      console.log(`Optimization completed in ${optimizationTime.toFixed(2)}ms`);

    } finally {
      this.isOptimizing = false;
    }
  }

  // Strategy Implementations
  private async implementEntityIndexing(): Promise<void> {
    // Create search indexes for entities
    const entities = await this.getAllEntities();
    const nameIndex = new Map<string, string[]>();
    const typeIndex = new Map<string, string[]>();
    const tagIndex = new Map<string, string[]>();

    entities.forEach(entity => {
      // Name index
      const nameKey = entity.name.toLowerCase();
      if (!nameIndex.has(nameKey)) {
        nameIndex.set(nameKey, []);
      }
      nameIndex.get(nameKey)!.push(entity.id);

      // Type index
      if (!typeIndex.has(entity.type)) {
        typeIndex.set(entity.type, []);
      }
      typeIndex.get(entity.type)!.push(entity.id);

      // Tag index
      if (entity.tags) {
        entity.tags.forEach(tag => {
          const tagKey = tag.toLowerCase();
          if (!tagIndex.has(tagKey)) {
            tagIndex.set(tagKey, []);
          }
          tagIndex.get(tagKey)!.push(entity.id);
        });
      }
    });

    // Store indexes (in a real implementation, these would be persisted)
    (window as any).__entityIndexes = { nameIndex, typeIndex, tagIndex };
  }

  private async implementRelationshipCaching(): Promise<void> {
    // Implement LRU cache for relationships
    this.cleanExpiredRelationshipCache();

    // Pre-cache frequently accessed relationships
    const entities = await this.getAllEntities();
    const popularEntities = entities.slice(0, 20); // Top 20 entities

    for (const entity of popularEntities) {
      await this.cacheEntityRelationships(entity.id);
    }
  }

  private async implementLazyLoading(): Promise<void> {
    // Configure lazy loading parameters based on current dataset size
    const entityCount = this.metrics.entityCount;
    const eventCount = this.metrics.timelineEventCount;

    if (entityCount > 1000) {
      this.lazyLoadConfig.entitiesPerPage = Math.min(25, this.lazyLoadConfig.entitiesPerPage);
    }

    if (eventCount > 5000) {
      this.lazyLoadConfig.eventsPerPage = Math.min(50, this.lazyLoadConfig.eventsPerPage);
    }

    this.lazyLoadConfig.enableVirtualization = entityCount > 500 || eventCount > 1000;
  }

  private async implementMemoryOptimization(): Promise<void> {
    // Clean up expired cache entries
    this.cleanExpiredEntityCache();
    this.cleanExpiredSearchCache();

    // Reduce cache sizes if memory usage is high
    if (this.metrics.memoryUsage > 150) {
      this.cacheStrategy.maxSize = Math.max(250, this.cacheStrategy.maxSize * 0.8);
      this.lazyLoadConfig.cacheSize = Math.max(500, this.lazyLoadConfig.cacheSize * 0.8);
    }

    // Force garbage collection if available
    if ((window as any).gc) {
      (window as any).gc();
    }
  }

  private async implementSearchOptimization(): Promise<void> {
    // Optimize search cache
    this.cleanExpiredSearchCache();

    // Pre-cache common search queries
    const commonQueries = ['character', 'location', 'item', 'skill', 'story'];
    for (const query of commonQueries) {
      await this.cacheSearchResults(query);
    }

    // Implement search result pagination
    this.lazyLoadConfig.preloadDistance = Math.min(1, this.lazyLoadConfig.preloadDistance);
  }

  private async implementRenderOptimization(): Promise<void> {
    // Enable virtual scrolling for large lists
    this.lazyLoadConfig.enableVirtualization = true;

    // Reduce preload distance to improve render time
    if (this.metrics.renderTime > 20) {
      this.lazyLoadConfig.preloadDistance = 1;
    }

    // Configure batch updates
    // (This would typically involve React optimizations)
  }

  // Cache Management
  private cleanExpiredEntityCache() {
    const now = Date.now();
    for (const [key, entry] of this.entityCache.entries()) {
      if (now - entry.timestamp > this.cacheStrategy.ttl) {
        this.entityCache.delete(key);
      }
    }

    // Implement cache size limit
    if (this.entityCache.size > this.cacheStrategy.maxSize) {
      this.evictCacheEntries('entity');
    }
  }

  private cleanExpiredRelationshipCache() {
    const now = Date.now();
    for (const [key, entry] of this.relationshipCache.entries()) {
      if (now - entry.timestamp > this.cacheStrategy.ttl) {
        this.relationshipCache.delete(key);
      }
    }

    if (this.relationshipCache.size > this.cacheStrategy.maxSize) {
      this.evictCacheEntries('relationship');
    }
  }

  private cleanExpiredSearchCache() {
    const now = Date.now();
    for (const [key, entry] of this.searchCache.entries()) {
      if (now - entry.timestamp > this.cacheStrategy.ttl) {
        this.searchCache.delete(key);
      }
    }

    if (this.searchCache.size > this.cacheStrategy.maxSize) {
      this.evictCacheEntries('search');
    }
  }

  private evictCacheEntries(cacheType: 'entity' | 'relationship' | 'search') {
    const cache = cacheType === 'entity' ? this.entityCache :
                 cacheType === 'relationship' ? this.relationshipCache :
                 this.searchCache;

    const entries = Array.from(cache.entries());

    // Sort by strategy (LRU, LFU, etc.)
    switch (this.cacheStrategy.strategy) {
      case 'lru':
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        break;
      case 'lfu':
        entries.sort((a, b) => a[1].accessCount - b[1].accessCount);
        break;
      case 'fifo':
        // Already in insertion order
        break;
    }

    // Remove oldest/least used entries
    const entriesToRemove = entries.slice(0, Math.floor(entries.length * 0.3));
    entriesToRemove.forEach(([key]) => cache.delete(key));
  }

  // Cache Operations
  async cacheEntityRelationships(entityId: string): Promise<void> {
    try {
      const relationships = await this.getEntityRelationships(entityId);
      this.relationshipCache.set(entityId, {
        data: relationships,
        timestamp: Date.now(),
        accessCount: 1
      });
    } catch (error) {
      console.error('Failed to cache entity relationships:', error);
    }
  }

  async cacheSearchResults(query: string): Promise<void> {
    try {
      const results = await this.performSearch(query);
      this.searchCache.set(query, {
        data: results,
        timestamp: Date.now(),
        accessCount: 1
      });
    } catch (error) {
      console.error('Failed to cache search results:', error);
    }
  }

  // Data Access Methods (Mock implementations)
  private async getAllEntities(): Promise<BaseEntity[]> {
    // Mock implementation - would fetch from actual store
    return [];
  }

  private async getEntityRelationships(_entityId: string): Promise<EntityRelationship[]> {
    // Mock implementation
    return [];
  }

  private async performSearch(_query: string): Promise<any[]> {
    // Mock implementation
    return [];
  }

  // Lazy Loading Utilities
  async loadEntitiesPage(page: number, pageSize?: number): Promise<BaseEntity[]> {
    const size = pageSize || this.lazyLoadConfig.entitiesPerPage;
    const _offset = page * size;

    // Check cache first
    const cacheKey = `entities-${page}-${size}`;
    const cached = this.searchCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheStrategy.ttl) {
      cached.accessCount++;
      return cached.data;
    }

    // Load from store (mock)
    const entities: BaseEntity[] = []; // Would load actual data

    // Cache results
    this.searchCache.set(cacheKey, {
      data: entities,
      timestamp: Date.now(),
      accessCount: 1
    });

    return entities;
  }

  async loadEventsPage(page: number, pageSize?: number): Promise<TimelineEvent[]> {
    const size = pageSize || this.lazyLoadConfig.eventsPerPage;
    const _offset = page * size;

    const cacheKey = `events-${page}-${size}`;
    const cached = this.searchCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheStrategy.ttl) {
      cached.accessCount++;
      return cached.data;
    }

    const events: TimelineEvent[] = []; // Would load actual data

    this.searchCache.set(cacheKey, {
      data: events,
      timestamp: Date.now(),
      accessCount: 1
    });

    return events;
  }

  // Configuration
  updateLazyLoadConfig(config: Partial<LazyLoadConfig>) {
    this.lazyLoadConfig = { ...this.lazyLoadConfig, ...config };
  }

  updateCacheStrategy(strategy: Partial<CacheStrategy>) {
    this.cacheStrategy = { ...this.cacheStrategy, ...strategy };
  }

  enableStrategy(strategyId: string) {
    const strategy = this.strategies.get(strategyId);
    if (strategy) {
      strategy.enabled = true;
    }
  }

  disableStrategy(strategyId: string) {
    const strategy = this.strategies.get(strategyId);
    if (strategy) {
      strategy.enabled = false;
    }
  }

  // Getters
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getStrategies(): OptimizationStrategy[] {
    return Array.from(this.strategies.values());
  }

  getLazyLoadConfig(): LazyLoadConfig {
    return { ...this.lazyLoadConfig };
  }

  getCacheStrategy(): CacheStrategy {
    return { ...this.cacheStrategy };
  }

  getCacheHitRate(): number {
    const totalCacheSize = this.entityCache.size + this.relationshipCache.size + this.searchCache.size;
    const totalAccesses = Array.from(this.entityCache.values()).reduce((sum, entry) => sum + entry.accessCount, 0) +
                         Array.from(this.relationshipCache.values()).reduce((sum, entry) => sum + entry.accessCount, 0) +
                         Array.from(this.searchCache.values()).reduce((sum, entry) => sum + entry.accessCount, 0);

    return totalAccesses > 0 ? totalCacheSize / totalAccesses : 0;
  }

  isOptimizationRunning(): boolean {
    return this.isOptimizing;
  }

  // Cleanup
  destroy() {
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
      this.optimizationInterval = null;
    }

    this.entityCache.clear();
    this.relationshipCache.clear();
    this.searchCache.clear();
  }
}

export const performanceOptimizer = new PerformanceOptimizer();
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Zap,
  Settings,
  Database,
  Search,
  Cpu,
  BarChart3,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  X,
  Play,
  Pause
} from 'lucide-react';
import { performanceOptimizer } from '../services/performanceOptimizer';
import type {
  PerformanceMetrics,
  OptimizationStrategy,
  LazyLoadConfig,
  CacheStrategy
} from '../services/performanceOptimizer';

interface PerformanceMonitorProps {
  isVisible: boolean;
  onToggle: () => void;
  className?: string;
}

type PerformanceTab = 'metrics' | 'strategies' | 'config';

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  isVisible,
  onToggle,
  className = ''
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [strategies, setStrategies] = useState<OptimizationStrategy[]>([]);
  const [lazyLoadConfig, setLazyLoadConfig] = useState<LazyLoadConfig | null>(null);
  const [cacheStrategy, setCacheStrategy] = useState<CacheStrategy | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [activeTab, setActiveTab] = useState<PerformanceTab>('metrics');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Update data from performance optimizer
  const updateData = useCallback(() => {
    setMetrics(performanceOptimizer.getMetrics());
    setStrategies(performanceOptimizer.getStrategies());
    setLazyLoadConfig(performanceOptimizer.getLazyLoadConfig());
    setCacheStrategy(performanceOptimizer.getCacheStrategy());
    setIsOptimizing(performanceOptimizer.isOptimizationRunning());
  }, []);

  useEffect(() => {
    updateData();

    let interval: number | undefined;
    if (autoRefresh) {
      interval = setInterval(updateData, 5000); // Update every 5 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, updateData]);

  const handleRunOptimization = useCallback(async () => {
    setIsOptimizing(true);
    try {
      await performanceOptimizer.runOptimization();
    } finally {
      setIsOptimizing(false);
      updateData();
    }
  }, [updateData]);

  const handleToggleStrategy = useCallback((strategyId: string, enabled: boolean) => {
    if (enabled) {
      performanceOptimizer.enableStrategy(strategyId);
    } else {
      performanceOptimizer.disableStrategy(strategyId);
    }
    setStrategies(performanceOptimizer.getStrategies());
  }, []);

  const getMetricStatus = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.warning) return 'warning';
    return 'critical';
  };


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'critical': return AlertTriangle;
      default: return Activity;
    }
  };


  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-28 right-4 p-3 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-colors z-40"
      >
        <Activity size={20} />
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 400 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 400 }}
      className={`fixed right-4 bottom-4 w-96 max-h-[80vh] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-40 flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Activity size={16} className="text-green-600 dark:text-green-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Performance Monitor
          </h3>
          {isOptimizing && (
            <div className="animate-spin">
              <RefreshCw size={12} className="text-green-600" />
            </div>
          )}
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-1 rounded transition-colors ${
              autoRefresh
                ? 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            {autoRefresh ? <Play size={14} /> : <Pause size={14} />}
          </button>
          <button
            onClick={updateData}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={onToggle}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {[
          { key: 'metrics', label: 'Metrics', icon: BarChart3 },
          { key: 'strategies', label: 'Optimization', icon: Zap },
          { key: 'config', label: 'Config', icon: Settings }
        ].map((tab: { key: PerformanceTab; label: string; icon: React.ComponentType<{ size?: number }> }) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-green-600 bg-green-50 border-b-2 border-green-600 dark:text-green-400 dark:bg-green-900/30'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <TabIcon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'metrics' && metrics && (
          <div className="space-y-4">
            {/* Overall Performance Score */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-800 dark:text-green-300">
                  Performance Score
                </span>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  85/100
                </span>
              </div>
              <div className="mt-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: 'Memory Usage',
                  value: `${metrics.memoryUsage.toFixed(1)} MB`,
                  status: getMetricStatus(metrics.memoryUsage, { good: 50, warning: 100 }),
                  icon: Cpu
                },
                {
                  label: 'Render Time',
                  value: `${metrics.renderTime.toFixed(1)}ms`,
                  status: getMetricStatus(metrics.renderTime, { good: 16, warning: 33 }),
                  icon: Cpu
                },
                {
                  label: 'Search Latency',
                  value: `${metrics.searchLatency.toFixed(0)}ms`,
                  status: getMetricStatus(metrics.searchLatency, { good: 100, warning: 200 }),
                  icon: Search
                },
                {
                  label: 'Cache Hit Rate',
                  value: `${(performanceOptimizer.getCacheHitRate() * 100).toFixed(1)}%`,
                  status: getMetricStatus(100 - performanceOptimizer.getCacheHitRate() * 100, { good: 20, warning: 50 }),
                  icon: Database
                }
              ].map((metric, index) => {
                const StatusIcon = getStatusIcon(metric.status);
                const MetricIcon = metric.icon;
                return (
                  <div key={index} className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <MetricIcon size={16} className="text-gray-500" />
                      <StatusIcon size={14} className={`${metric.status === 'good' ? 'text-green-500' : metric.status === 'warning' ? 'text-yellow-500' : 'text-red-500'}`} />
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {metric.value}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {metric.label}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Data Overview */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Data Overview</h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {metrics.entityCount}
                  </div>
                  <div className="text-xs text-gray-500">Entities</div>
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    {metrics.relationshipCount}
                  </div>
                  <div className="text-xs text-gray-500">Relations</div>
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {metrics.timelineEventCount}
                  </div>
                  <div className="text-xs text-gray-500">Events</div>
                </div>
              </div>
            </div>

            {/* Last Optimized */}
            <div className="text-xs text-gray-500 text-center">
              Last optimized: {metrics.lastOptimized.toLocaleTimeString()}
            </div>
          </div>
        )}

        {activeTab === 'strategies' && (
          <div className="space-y-4">
            {/* Run Optimization Button */}
            <button
              onClick={handleRunOptimization}
              disabled={isOptimizing}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isOptimizing ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Zap size={16} />
              )}
              <span>{isOptimizing ? 'Optimizing...' : 'Run Optimization'}</span>
            </button>

            {/* Strategy List */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Optimization Strategies
              </h4>
              {strategies.map(strategy => (
                <div key={strategy.id} className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                          {strategy.name}
                        </h5>
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                          +{strategy.estimatedImprovement}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {strategy.description}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleStrategy(strategy.id, !strategy.enabled)}
                      className={`ml-3 px-3 py-1 text-xs rounded transition-colors ${
                        strategy.enabled
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {strategy.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'config' && lazyLoadConfig && cacheStrategy && (
          <div className="space-y-4">
            {/* Lazy Loading Config */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Lazy Loading
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Entities per page
                  </label>
                  <input
                    type="number"
                    value={lazyLoadConfig.entitiesPerPage}
                    onChange={(e) => {
                      const newConfig = { ...lazyLoadConfig, entitiesPerPage: parseInt(e.target.value) };
                      setLazyLoadConfig(newConfig);
                      performanceOptimizer.updateLazyLoadConfig(newConfig);
                    }}
                    className="w-full p-2 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Events per page
                  </label>
                  <input
                    type="number"
                    value={lazyLoadConfig.eventsPerPage}
                    onChange={(e) => {
                      const newConfig = { ...lazyLoadConfig, eventsPerPage: parseInt(e.target.value) };
                      setLazyLoadConfig(newConfig);
                      performanceOptimizer.updateLazyLoadConfig(newConfig);
                    }}
                    className="w-full p-2 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={lazyLoadConfig.enableVirtualization}
                  onChange={(e) => {
                    const newConfig = { ...lazyLoadConfig, enableVirtualization: e.target.checked };
                    setLazyLoadConfig(newConfig);
                    performanceOptimizer.updateLazyLoadConfig(newConfig);
                  }}
                  className="rounded"
                />
                <label className="text-xs text-gray-600 dark:text-gray-400">
                  Enable virtualization
                </label>
              </div>
            </div>

            {/* Cache Strategy */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Cache Strategy
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Max cache size
                  </label>
                  <input
                    type="number"
                    value={cacheStrategy.maxSize}
                    onChange={(e) => {
                      const newStrategy = { ...cacheStrategy, maxSize: parseInt(e.target.value) };
                      setCacheStrategy(newStrategy);
                      performanceOptimizer.updateCacheStrategy(newStrategy);
                    }}
                    className="w-full p-2 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    TTL (minutes)
                  </label>
                  <input
                    type="number"
                    value={cacheStrategy.ttl / 60000}
                    onChange={(e) => {
                      const newStrategy = { ...cacheStrategy, ttl: parseInt(e.target.value) * 60000 };
                      setCacheStrategy(newStrategy);
                      performanceOptimizer.updateCacheStrategy(newStrategy);
                    }}
                    className="w-full p-2 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Eviction strategy
                </label>
                <select
                  value={cacheStrategy.strategy}
                  onChange={(e) => {
                    const newStrategy = { ...cacheStrategy, strategy: e.target.value as CacheStrategy['strategy'] };
                    setCacheStrategy(newStrategy);
                    performanceOptimizer.updateCacheStrategy(newStrategy);
                  }}
                  className="w-full p-2 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="lru">Least Recently Used (LRU)</option>
                  <option value="lfu">Least Frequently Used (LFU)</option>
                  <option value="fifo">First In, First Out (FIFO)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

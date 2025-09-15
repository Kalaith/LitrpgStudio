import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  AlertTriangle,
  Info,
  CheckCircle,
  X,
  Settings,
  Zap,
  Play,
  Pause,
  RotateCcw,
  Filter,
  TrendingUp,
  Users,
  Clock,
  MapPin,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  Wand2
} from 'lucide-react';
import { useEntityRegistryStore } from '../stores/entityRegistryStore';
import { useUnifiedTimelineStore } from '../stores/unifiedTimelineStore';
import { useStoryStore } from '../stores/storyStore';
import {
  aiConsistencyService,
  AIConsistencyIssue,
  WorldRule,
  AIAnalysisContext
} from '../services/aiConsistencyService';

interface AIConsistencyPanelProps {
  content: string;
  currentPosition: number;
  chapterId?: string;
  storyId?: string;
  isEnabled?: boolean;
  className?: string;
}

export const AIConsistencyPanel: React.FC<AIConsistencyPanelProps> = ({
  content,
  currentPosition,
  chapterId,
  storyId,
  isEnabled = true,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoAnalysis, setAutoAnalysis] = useState(true);
  const [issues, setIssues] = useState<AIConsistencyIssue[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(
    new Set(['critical', 'major', 'minor', 'suggestion'])
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['plot', 'character', 'world', 'timeline', 'logic'])
  );
  const [showSettings, setShowSettings] = useState(false);
  const [worldRules, setWorldRules] = useState<WorldRule[]>([]);

  const { getAllEntities, getAllRelationships } = useEntityRegistryStore();
  const { getAllEvents } = useUnifiedTimelineStore();
  const { stories, currentStory } = useStoryStore();

  // Get world context
  const worldContext = useMemo(() => ({
    entities: getAllEntities(),
    relationships: getAllRelationships(),
    timeline: getAllEvents(),
    stories: stories,
    rules: worldRules
  }), [getAllEntities, getAllRelationships, getAllEvents, stories, worldRules]);

  // Load world rules
  useEffect(() => {
    setWorldRules(aiConsistencyService.getWorldRules());
  }, []);

  // Auto-analysis effect
  useEffect(() => {
    if (autoAnalysis && isEnabled && content.length > 100) {
      const debounceTimer = setTimeout(() => {
        runAnalysis();
      }, 2000); // Debounce analysis

      return () => clearTimeout(debounceTimer);
    }
  }, [content, autoAnalysis, isEnabled, worldContext]);

  const runAnalysis = useCallback(async () => {
    if (isAnalyzing) return;

    setIsAnalyzing(true);
    try {
      const analysisContext: AIAnalysisContext = {
        targetContent: content,
        currentChapter: chapterId,
        currentStory: currentStory || undefined,
        worldContext
      };

      const detectedIssues = await aiConsistencyService.analyzeConsistency(analysisContext);
      setIssues(detectedIssues);
    } catch (error) {
      console.error('AI analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [content, chapterId, currentStory, worldContext, isAnalyzing]);

  // Filter issues by selected types and categories
  const filteredIssues = useMemo(() => {
    return issues.filter(issue =>
      selectedFilters.has(issue.type) &&
      expandedCategories.has(issue.category)
    );
  }, [issues, selectedFilters, expandedCategories]);

  // Group issues by category
  const groupedIssues = useMemo(() => {
    const groups: Record<string, AIConsistencyIssue[]> = {};
    filteredIssues.forEach(issue => {
      if (!groups[issue.category]) {
        groups[issue.category] = [];
      }
      groups[issue.category].push(issue);
    });
    return groups;
  }, [filteredIssues]);

  const toggleFilter = useCallback((filter: string) => {
    setSelectedFilters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(filter)) {
        newSet.delete(filter);
      } else {
        newSet.add(filter);
      }
      return newSet;
    });
  }, []);

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  }, []);

  const getIssueIcon = (type: AIConsistencyIssue['type']) => {
    switch (type) {
      case 'critical': return AlertTriangle;
      case 'major': return AlertTriangle;
      case 'minor': return Info;
      case 'suggestion': return Lightbulb;
      default: return Info;
    }
  };

  const getIssueColor = (type: AIConsistencyIssue['type']) => {
    switch (type) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
      case 'major': return 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800';
      case 'minor': return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
      case 'suggestion': return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
      default: return 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'plot': return TrendingUp;
      case 'character': return Users;
      case 'world': return MapPin;
      case 'timeline': return Clock;
      case 'logic': return Brain;
      default: return Info;
    }
  };

  const handleAutoFix = useCallback(async (issue: AIConsistencyIssue) => {
    if (issue.autoFix) {
      try {
        await issue.autoFix();
        // Refresh analysis after auto-fix
        await runAnalysis();
      } catch (error) {
        console.error('Auto-fix failed:', error);
      }
    }
  }, [runAnalysis]);

  if (!isVisible || !isEnabled) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-16 right-4 p-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-colors z-40"
      >
        <Brain size={20} />
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 400 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 400 }}
      className={`fixed right-4 top-1/2 transform -translate-y-1/2 w-96 max-h-[80vh] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-40 flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Brain size={16} className="text-purple-600 dark:text-purple-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            AI Consistency Analysis
          </h3>
          {isAnalyzing && (
            <div className="animate-spin">
              <RotateCcw size={12} className="text-purple-600" />
            </div>
          )}
          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
            {filteredIssues.length}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => setAutoAnalysis(!autoAnalysis)}
            className={`p-1 rounded transition-colors ${
              autoAnalysis
                ? 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            {autoAnalysis ? <Play size={14} /> : <Pause size={14} />}
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <Settings size={14} />
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-700/50"
          >
            <div className="space-y-4">
              {/* Issue Type Filters */}
              <div>
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Issue Types:
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'critical', label: 'Critical', color: 'text-red-600' },
                    { key: 'major', label: 'Major', color: 'text-orange-600' },
                    { key: 'minor', label: 'Minor', color: 'text-yellow-600' },
                    { key: 'suggestion', label: 'Suggestions', color: 'text-blue-600' }
                  ].map(type => (
                    <button
                      key={type.key}
                      onClick={() => toggleFilter(type.key)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        selectedFilters.has(type.key)
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual Analysis */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Auto-analysis: {autoAnalysis ? 'On' : 'Off'}
                </span>
                <button
                  onClick={runAnalysis}
                  disabled={isAnalyzing}
                  className="flex items-center space-x-1 px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  <Zap size={12} />
                  <span>Analyze Now</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Issues List */}
      <div className="flex-1 overflow-y-auto p-2">
        {isAnalyzing ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin mb-2">
                <Brain size={32} className="text-purple-600 mx-auto" />
              </div>
              <p className="text-sm text-gray-500">Analyzing consistency...</p>
            </div>
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <CheckCircle size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No consistency issues detected</p>
            <p className="text-xs mt-1">Your world appears coherent!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {Object.entries(groupedIssues).map(([category, categoryIssues]) => {
              const CategoryIcon = getCategoryIcon(category);
              const isExpanded = expandedCategories.has(category);

              return (
                <div key={category} className="border border-gray-200 dark:border-gray-600 rounded-lg">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <CategoryIcon size={16} className="text-gray-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                        {category}
                      </span>
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                        {categoryIssues.length}
                      </span>
                    </div>
                    {isExpanded ?
                      <ChevronDown size={16} className="text-gray-400" /> :
                      <ChevronRight size={16} className="text-gray-400" />
                    }
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-200 dark:border-gray-600"
                      >
                        <div className="p-2 space-y-2">
                          {categoryIssues.map((issue) => {
                            const Icon = getIssueIcon(issue.type);
                            return (
                              <motion.div
                                key={issue.id}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${getIssueColor(issue.type)}`}
                              >
                                <div className="flex items-start space-x-2">
                                  <Icon size={14} className="mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="text-sm font-medium">
                                        {issue.title}
                                      </div>
                                      <div className="text-xs opacity-75">
                                        {Math.round(issue.confidence * 100)}%
                                      </div>
                                    </div>
                                    <div className="text-xs opacity-90 mb-2">
                                      {issue.description}
                                    </div>

                                    {/* Evidence */}
                                    {issue.evidence.length > 0 && (
                                      <div className="text-xs space-y-1 mb-2">
                                        <div className="font-medium">Evidence:</div>
                                        <ul className="list-disc list-inside space-y-0.5 opacity-75">
                                          {issue.evidence.slice(0, 2).map((evidence, index) => (
                                            <li key={index} className="truncate">{evidence}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {/* Suggestions */}
                                    {issue.suggestions.length > 0 && (
                                      <div className="text-xs space-y-1 mb-2">
                                        <div className="font-medium">Suggestions:</div>
                                        <ul className="list-disc list-inside space-y-0.5 opacity-75">
                                          {issue.suggestions.slice(0, 2).map((suggestion, index) => (
                                            <li key={index}>{suggestion}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {/* Auto-fix button */}
                                    {issue.autoFixAvailable && (
                                      <button
                                        onClick={() => handleAutoFix(issue)}
                                        className="flex items-center space-x-1 text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded border opacity-80 hover:opacity-100 transition-opacity"
                                      >
                                        <Wand2 size={10} />
                                        <span>Auto-fix</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>🤖 AI-Powered Analysis</span>
          <span>{issues.length} total issues found</span>
        </div>
      </div>
    </motion.div>
  );
};
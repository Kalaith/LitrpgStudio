import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GripVertical,
  X,
  Settings,
  Maximize2,
  Minimize2,
  RefreshCw,
  MoreHorizontal,
  TrendingUp,
  Users,
  Clock,
  FileText,
  Target,
  BarChart3,
  Calendar
} from 'lucide-react';

export type WidgetType =
  | 'word_count'
  | 'writing_streak'
  | 'character_overview'
  | 'timeline_events'
  | 'writing_goals'
  | 'recent_activity'
  | 'story_progress'
  | 'quick_stats';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  settings?: Record<string, unknown>;
  collapsed?: boolean;
  refreshRate?: number; // in seconds
}

interface DashboardWidgetProps {
  config: WidgetConfig;
  onUpdate: (config: WidgetConfig) => void;
  onRemove: (id: string) => void;
  isDragging?: boolean;
  dragHandleProps?: any;
  className?: string;
}

// Widget size mappings with better responsive design
const sizeClasses = {
  small: 'col-span-1 min-h-[8rem] max-h-[12rem]',
  medium: 'col-span-1 md:col-span-2 min-h-[8rem] max-h-[16rem]',
  large: 'col-span-1 md:col-span-2 lg:col-span-3 min-h-[12rem] max-h-[20rem]'
};

// Widget icons
const getWidgetIcon = (type: WidgetType) => {
  switch (type) {
    case 'word_count': return FileText;
    case 'writing_streak': return TrendingUp;
    case 'character_overview': return Users;
    case 'timeline_events': return Clock;
    case 'writing_goals': return Target;
    case 'recent_activity': return Calendar;
    case 'story_progress': return BarChart3;
    case 'quick_stats': return BarChart3;
    default: return BarChart3;
  }
};

export const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  config,
  onUpdate,
  onRemove,
  isDragging = false,
  dragHandleProps,
  className = ''
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const Icon = getWidgetIcon(config.type);

  const handleToggleCollapse = () => {
    onUpdate({
      ...config,
      collapsed: !config.collapsed
    });
  };

  const handleResize = () => {
    const sizes: Array<WidgetConfig['size']> = ['small', 'medium', 'large'];
    const currentIndex = sizes.indexOf(config.size);
    const nextSize = sizes[(currentIndex + 1) % sizes.length];

    onUpdate({
      ...config,
      size: nextSize
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const renderWidgetContent = () => {
    switch (config.type) {
      case 'word_count':
        return (
          <div className="flex flex-col h-full justify-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              12,847
            </div>
            <div className="text-sm text-gray-500">Total Words</div>
            <div className="text-xs text-green-500 mt-1">+324 today</div>
          </div>
        );

      case 'writing_streak':
        return (
          <div className="flex flex-col h-full justify-center">
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              7
            </div>
            <div className="text-sm text-gray-500">Day Streak</div>
            <div className="text-xs text-gray-400 mt-1">Keep it up!</div>
          </div>
        );

      case 'character_overview':
        return (
          <div className="flex flex-col h-full justify-between">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Characters</span>
              <span className="text-lg font-bold">8</span>
            </div>
            {config.size !== 'small' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span>Main Characters</span>
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">3</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Supporting</span>
                  <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded">5</span>
                </div>
              </div>
            )}
          </div>
        );

      case 'timeline_events':
        return (
          <div className="flex flex-col h-full justify-between">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Upcoming Events</span>
              <span className="text-lg font-bold">4</span>
            </div>
            {config.size !== 'small' && (
              <div className="space-y-1">
                <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  • Chapter 12: Dragon encounter
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  • Chapter 13: Guild meeting
                </div>
              </div>
            )}
          </div>
        );

      case 'writing_goals':
        return (
          <div className="flex flex-col h-full justify-between">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Daily Goal</span>
              <span className="text-xs text-green-600">64%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <motion.div
                className="bg-green-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: '64%' }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
            <div className="text-xs text-gray-500">324 / 500 words</div>
          </div>
        );

      case 'story_progress':
        return (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Story Progress</span>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span>Chapters</span>
                <span>12/20</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '60%' }}></div>
              </div>
              {config.size !== 'small' && (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span>Target Words</span>
                    <span>12,847/80,000</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                    <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: '16%' }}></div>
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 'recent_activity':
        return (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Recent Activity</span>
            </div>
            <div className="flex-1 space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Added character "Lyra"</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Updated Chapter 11</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Created timeline event</span>
              </div>
            </div>
          </div>
        );

      case 'quick_stats':
        return (
          <div className="grid grid-cols-2 gap-4 h-full">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">8</div>
              <div className="text-xs text-gray-500">Characters</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">12</div>
              <div className="text-xs text-gray-500">Chapters</div>
            </div>
            {config.size !== 'small' && (
              <>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">24</div>
                  <div className="text-xs text-gray-500">Events</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">7</div>
                  <div className="text-xs text-gray-500">Days</div>
                </div>
              </>
            )}
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-400">
            <Icon size={24} />
          </div>
        );
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`
        ${sizeClasses[config.size]}
        bg-white dark:bg-gray-800
        border border-gray-200 dark:border-gray-700
        rounded-lg shadow-sm
        transition-all duration-200
        ${isDragging ? 'shadow-lg scale-105 rotate-1 z-10' : 'hover:shadow-md'}
        ${config.collapsed ? 'h-12' : 'flex flex-col'}
        overflow-hidden
        ${className}
      `}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          {/* Drag Handle */}
          <div
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
          >
            <GripVertical size={14} />
          </div>

          {/* Widget Icon & Title */}
          <Icon size={16} className="text-gray-500 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
            {config.title}
          </span>
        </div>

        {/* Widget Controls */}
        <div className="flex items-center space-x-1 flex-shrink-0">
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
          </button>

          {/* Collapse/Expand Button */}
          <button
            onClick={handleToggleCollapse}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            {config.collapsed ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
          </button>

          {/* Menu Button */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <MoreHorizontal size={12} />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-50 min-w-32"
                  onMouseLeave={() => setShowMenu(false)}
                >
                  <button
                    onClick={handleResize}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <Settings size={14} />
                    <span>Resize</span>
                  </button>
                  <button
                    onClick={() => onRemove(config.id)}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                  >
                    <X size={14} />
                    <span>Remove</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Widget Content */}
      <AnimatePresence>
        {!config.collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 flex-1 overflow-hidden min-h-0"
          >
            <div className="h-full overflow-auto">
              {renderWidgetContent()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
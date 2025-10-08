/**
 * Application Constants
 *
 * Centralized constants for LitRPG Studio.
 * Organized by category for easy maintenance and consistency.
 */

// =============================================================================
// WRITING DEFAULTS
// =============================================================================

export const WRITING_DEFAULTS = {
  /** Default daily word count goal */
  DAILY_WORD_GOAL: 500,

  /** Default target word count for a book */
  DEFAULT_BOOK_TARGET: 80000,

  /** Target words per minute for writing sessions */
  WORDS_PER_MINUTE_TARGET: 30,

  /** Default word target for a writing session */
  SESSION_WORD_TARGET: 500,

  /** Auto-save interval in milliseconds (30 seconds) */
  AUTO_SAVE_INTERVAL: 30000,

  /** Default chapter target words */
  DEFAULT_CHAPTER_TARGET: 3000,
} as const;

// =============================================================================
// APPLICATION CONFIGURATION
// =============================================================================

export const APP_CONFIG = {
  // Timer defaults
  DEFAULT_WORK_DURATION: 25,
  DEFAULT_SHORT_BREAK: 5,
  DEFAULT_LONG_BREAK: 15,
  DEFAULT_SESSIONS_UNTIL_LONG_BREAK: 4,

  // Editor settings
  DEFAULT_EDITOR_HEIGHT: 400,
  MAX_EDITOR_HEIGHT: 600,
  DEFAULT_FONT_SIZE: 16,

  // Chart dimensions
  CHART_WIDTH: 800,
  CHART_HEIGHT: 600,
  CHART_MARGIN: { top: 40, right: 40, bottom: 60, left: 40 },

  // Combat system
  COMBAT_SIMULATION_RUNS: 1000,
  DEFAULT_COMBAT_STATS: {
    health: 100,
    energy: 50,
    attack: 20,
    defense: 15,
    magicPower: 18,
    magicDefense: 12,
    speed: 25,
    accuracy: 85,
    evasion: 15,
    criticalRate: 10,
    criticalDamage: 150
  },

  // UI Constants
  SIDEBAR_WIDTH: 256, // 64 * 4 (w-64 in Tailwind)
  TOAST_DURATION: 3000,
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 500,

  // Data limits
  MAX_ITEMS_PER_PAGE: 50,
  MAX_SEARCH_RESULTS: 100,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB

  // Validation
  MIN_PASSWORD_LENGTH: 8,
  MAX_INPUT_LENGTH: 1000,
  MIN_LEVEL: 1,
  MAX_LEVEL: 100
} as const;

// =============================================================================
// DESIGN TOKENS
// =============================================================================

export const DESIGN_TOKENS = {
  spacing: {
    /** Spacing for small widgets/cards: p-2 sm:p-3 */
    widget: 'p-2 sm:p-3',

    /** Spacing for medium cards: p-4 sm:p-6 */
    card: 'p-4 sm:p-6',

    /** Spacing for large containers: p-6 sm:p-8 */
    container: 'p-6 sm:p-8',

    /** Gap between grid items: gap-4 */
    gridGap: 'gap-4',

    /** Gap between flex items: gap-2 */
    flexGap: 'gap-2',
  },

  sizes: {
    icon: {
      sm: 16,
      md: 20,
      lg: 24,
      xl: 32,
    },

    button: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    },

    input: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-5 py-3 text-lg',
    },
  },

  radius: {
    sm: 'rounded',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    full: 'rounded-full',
  },

  shadow: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  },

  transition: {
    fast: 'transition-all duration-150',
    normal: 'transition-all duration-300',
    slow: 'transition-all duration-500',
  },
} as const;

// =============================================================================
// ANALYTICS DEFAULTS
// =============================================================================

export const ANALYTICS_DEFAULTS = {
  /** Number of days to calculate streak */
  STREAK_LOOKBACK_DAYS: 2,

  /** Number of recent sessions to analyze */
  RECENT_SESSIONS_COUNT: 10,

  /** Number of sessions to display in charts */
  CHART_SESSIONS_COUNT: 30,

  /** Days to include in recent analytics */
  RECENT_ANALYTICS_DAYS: 30,

  /** Minimum WPM considered productive */
  MIN_PRODUCTIVE_WPM: 20,

  /** Good WPM target */
  GOOD_WPM_TARGET: 40,

  /** Excellent WPM target */
  EXCELLENT_WPM_TARGET: 60,
} as const;

// =============================================================================
// VALIDATION RULES
// =============================================================================

export const VALIDATION = {
  title: {
    minLength: 1,
    maxLength: 200,
  },

  description: {
    minLength: 0,
    maxLength: 2000,
  },

  characterName: {
    minLength: 1,
    maxLength: 100,
  },

  seriesName: {
    minLength: 1,
    maxLength: 150,
  },

  storyTitle: {
    minLength: 1,
    maxLength: 200,
  },

  chapterTitle: {
    minLength: 1,
    maxLength: 150,
  },
} as const;

// =============================================================================
// STATUS VALUES
// =============================================================================

export const STATUS = {
  story: {
    DRAFT: 'draft',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    PUBLISHED: 'published',
    ARCHIVED: 'archived',
  },

  book: {
    PLANNING: 'planning',
    DRAFTING: 'drafting',
    REVISION: 'revision',
    EDITING: 'editing',
    PUBLISHED: 'published',
  },

  character: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    DECEASED: 'deceased',
  },
} as const;

export const RARITY_COLORS = {
  common: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' },
  uncommon: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  rare: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  epic: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
  legendary: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  mythic: { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-300' }
} as const;

export const RELATIONSHIP_COLORS = {
  ally: '#10B981',
  enemy: '#EF4444',
  neutral: '#6B7280',
  romantic: '#F59E0B',
  family: '#8B5CF6'
} as const;

export const DAMAGE_TYPE_COLORS = {
  physical: '#DC2626',
  magical: '#7C3AED',
  fire: '#EA580C',
  ice: '#0EA5E9',
  lightning: '#FBBF24',
  poison: '#16A34A'
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  PASSWORD_TOO_SHORT: `Password must be at least ${APP_CONFIG.MIN_PASSWORD_LENGTH} characters`,
  FILE_TOO_LARGE: 'File size exceeds the maximum limit',
  NETWORK_ERROR: 'Network error occurred. Please try again.',
  GENERIC_ERROR: 'An unexpected error occurred'
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  SAVED_SUCCESSFULLY: 'Changes saved successfully',
  CREATED_SUCCESSFULLY: 'Item created successfully',
  DELETED_SUCCESSFULLY: 'Item deleted successfully',
  IMPORTED_SUCCESSFULLY: 'Data imported successfully',
  EXPORTED_SUCCESSFULLY: 'Data exported successfully'
} as const;

// API Endpoints (if used)
export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  STORIES: '/api/stories',
  CHARACTERS: '/api/characters',
  ANALYTICS: '/api/analytics'
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'userPreferences',
  RECENT_FILES: 'recentFiles',
  ANALYTICS_DATA: 'analyticsData',
  CHARACTER_DATA: 'characterData',
  STORY_DATA: 'storyData'
} as const;
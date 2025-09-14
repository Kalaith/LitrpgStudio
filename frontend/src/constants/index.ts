// Application Constants
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
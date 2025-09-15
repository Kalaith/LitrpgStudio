// Common utility types

export interface CommonBaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Timestamped {
  createdAt: Date;
  updatedAt: Date;
}

export interface Identifiable {
  id: string;
}

// Event handler types
export interface DragEvent {
  x: number;
  y: number;
  active: boolean;
}

export interface D3NodeDragEvent<T> {
  subject: T;
  x: number;
  y: number;
  dx: number;
  dy: number;
  active: boolean;
}

// Form field types
export interface FormField<T = string> {
  value: T;
  error?: string;
  touched: boolean;
  isDirty: boolean;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// API Response types
export interface ApiResponse<T = unknown> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Filter and sort types
export interface FilterOptions {
  search?: string;
  category?: string;
  type?: string;
  rarity?: string;
  level?: {
    min: number;
    max: number;
  };
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// Consistency check types
export interface ConsistencyIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  category: 'timeline' | 'character' | 'world' | 'plot';
  title: string;
  description: string;
  suggestions: string[];
  affectedItems: string[];
}

export interface ConsistencyReport {
  id: string;
  generatedAt: Date;
  issues: ConsistencyIssue[];
  summary: {
    totalIssues: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
  };
}

// World building updates
export interface WorldUpdatePayload {
  name?: string;
  description?: string;
  magicSystem?: string;
  technology?: string;
  politics?: string;
  geography?: string;
  locations?: unknown[];
  factions?: unknown[];
  timeline?: unknown[];
  maps?: unknown[];
}

// Generic update handler type
export type UpdateHandler<T> = (updates: Partial<T>) => void;

// Async operation states
export interface AsyncState<T = unknown> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export type AsyncOperation<T> = Promise<T>;

// Component state types
export interface ComponentState {
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// Editor types
export interface EditorInstance {
  getValue: () => string;
  setValue: (value: string) => void;
  focus: () => void;
  getModel: () => unknown;
}

// Chart data types
export interface ChartDataPoint {
  x: number | string | Date;
  y: number;
  label?: string;
  color?: string;
}

export interface ChartDataset {
  label: string;
  data: ChartDataPoint[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}
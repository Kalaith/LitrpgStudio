# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LitRPG Studio is a full-stack web application for LitRPG (Literary Role-Playing Game) authors to manage series, characters, stories, timelines, and world-building elements. It consists of a React + TypeScript frontend with a PHP Slim backend using MySQL for data persistence.

**Current Status:** Database migration completed (Phase 3). Series and character management are fully API-integrated. Stories, timeline, and analytics stores still use localStorage and need migration to API (Phase 4).

---

## Development Commands

### Frontend Development
```bash
cd frontend

# Install dependencies
npm install

# Development server (http://localhost:5173)
npm run dev

# Type checking (required before commits)
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Code formatting
npm run format
npm run format:check

# Testing
npm run test          # Watch mode
npm run test:run      # Single run
npm run test:coverage # With coverage
npm run test:ui       # UI mode

# Production build
npm run build                    # Build only
npm run build:with-types         # Build with TypeScript compilation first
npm run preview                  # Preview production build

# Full CI pipeline (lint + type-check + format + test + build)
npm run ci
npm run ci:quick                 # Skips build and tests
```

### Backend Development
```bash
cd backend

# Install dependencies
composer install

# Development server (http://localhost:8000)
composer run start
# OR
php -S localhost:8000 -t public/

# Testing
composer run test

# Code style
composer run cs-check
composer run cs-fix

# Production optimization
composer run production-install
composer run vendor-cleanup
```

### Database Operations

**Initialize database (development):**
```bash
# Via backend endpoint
POST http://localhost:8000/api/v1/init-database
```

**Test database connectivity:**
```bash
GET http://localhost:8000/api/v1/health
```

### Deployment

**Local deployment (preview):**
```powershell
.\publish.ps1                    # Deploy both frontend and backend
.\publish.ps1 -Frontend          # Frontend only
.\publish.ps1 -Backend           # Backend only
.\publish.ps1 -Clean             # Clean before deploy
.\publish.ps1 -Verbose           # Show detailed output
```

**Production deployment:**
```powershell
.\publish.ps1 -Production        # Deploy to production file system
.\publish.ps1 -FTP -Production   # Deploy to production FTP server
.\publish.ps1 -ForceVendor       # Force upload vendor directory (FTP)
```

---

## Architecture Overview

### High-Level Data Flow

```
Frontend (React + TypeScript)
    ↓ API calls via fetch
Backend (PHP Slim Framework)
    ↓ Eloquent ORM
Database (MySQL)
```

**Key Principle:** All persistent data (series, characters, stories, timeline) should live in the database. localStorage is only for UI state and caching.

### Current State Management Architecture

**✅ Fully API-Integrated Stores (Reference Implementations):**
- `seriesStore.ts` - Series, books, world-building (use this as pattern for other stores)
- `characterStore.ts` - Characters, skills, items, templates

**❌ Stores Still Using localStorage (Need Migration):**
- `storyStore.ts` - Stories and chapters (API exists: `storiesApi`, `chaptersApi`)
- `unifiedTimelineStore.ts` - Timeline events (API exists: `timelineApi`)
- `analyticsStore.ts` - Analytics data (API exists: `analyticsApi`)
- `worldStateStore.ts` - World state snapshots
- `entityRegistryStore.ts` - Entity relationships

### Backend Architecture

**Stack:**
- PHP 8.1+ with Slim Framework 4
- Eloquent ORM for database access
- PHP-DI for dependency injection
- PSR-7 HTTP message interfaces
- PSR-12 coding standards

**Key Patterns:**
1. **Repository Pattern** - All database access goes through repositories (`External/` directory)
2. **Action Pattern** - Business logic in action classes (`Actions/` directory)
3. **Dependency Injection** - All dependencies injected via constructor (see `public/index.php`)

**Controllers:**
- `SeriesController` - Series and book management
- `CharacterController` - Character CRUD and operations
- `StoryController` - Story management
- `ChapterController` - Chapter management
- `TimelineController` - Timeline events
- `AnalyticsController` - Analytics generation
- `WorldBuildingController` - World-building elements
- `ConsistencyController` - Consistency checking
- `ExportController` - Data export

**API Endpoints Pattern:**
```
GET    /api/v1/{resource}           - List all
GET    /api/v1/{resource}/{id}      - Get by ID
POST   /api/v1/{resource}           - Create
PUT    /api/v1/{resource}/{id}      - Update
DELETE /api/v1/{resource}/{id}      - Delete
```

### Frontend Architecture

**Stack:**
- React 19 with TypeScript 5.8
- Vite 6.3 for build tooling
- Tailwind CSS 4.1 for styling
- Zustand 5.0 for state management
- Framer Motion for animations
- React Router for navigation
- Chart.js for visualizations

**Directory Structure:**
```
frontend/src/
├── components/          # UI components (31+ components)
├── pages/              # Route-based page views
├── stores/             # Zustand state stores
├── api/                # API client modules
├── types/              # TypeScript type definitions
├── hooks/              # Custom React hooks
├── constants/          # Application constants
└── utils/              # Utility functions
```

**State Management Pattern (Zustand):**
```typescript
// Reference: seriesStore.ts
export const useSeriesStore = create<SeriesStore>()(
  persist(
    (set, get) => ({
      // State
      series: [],
      isLoading: false,
      error: null,

      // Async Actions (API-integrated)
      fetchSeries: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await seriesApi.getAll();
          set({ series: response.data, isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
        }
      },

      // Synchronous Actions
      setSeries: (series) => set({ series }),
    }),
    { name: 'series-storage' }
  )
);
```

**API Client Pattern:**
```typescript
// Reference: api/series.ts
export const seriesApi = {
  getAll: () => apiClient.get<Series[]>('/series'),
  getById: (id: string) => apiClient.get<Series>(`/series/${id}`),
  create: (data: CreateSeriesData) => apiClient.post<Series>('/series', data),
  update: (id: string, data: UpdateSeriesData) =>
    apiClient.put<Series>(`/series/${id}`, data),
  delete: (id: string) => apiClient.delete(`/series/${id}`),
};
```

---

## Critical Code Patterns

### TypeScript Export Standards

**IMPORTANT:** TypeScript `interface` declarations are stripped during Vite compilation. They don't exist at runtime.

**✅ Correct:**
```typescript
// Use class for runtime exports
export class ApiResponse<T = any> {
  success!: boolean;
  data?: T;
  error?: string;
}

// Or use type alias
export type Character = {
  id: string;
  name: string;
};

// Import works at runtime
import { ApiResponse } from './client';
```

**❌ Wrong:**
```typescript
// Interface is stripped at build time
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
}

// Runtime error: "does not provide an export named 'ApiResponse'"
import { ApiResponse } from './client';
```

### Environment Variables - No Fallbacks

**IMPORTANT:** Never use fallback values for environment variables. Applications should fail fast if misconfigured.

**✅ Correct:**
```typescript
const baseUrl = import.meta.env.VITE_API_BASE_URL;
if (!baseUrl) {
  throw new Error('VITE_API_BASE_URL is required');
}
```

**❌ Wrong:**
```typescript
// Hides configuration problems
const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
```

### API Integration Pattern (for localStorage → API migration)

When migrating a store from localStorage to API:

1. **Look at `seriesStore.ts` as reference** - it has the proven pattern
2. **Add async actions** - `fetchX()`, `createX()`, `updateX()`, `deleteX()`
3. **Keep localStorage for caching** - Persist API responses for offline access
4. **Add loading/error states** - `isLoading: boolean`, `error: string | null`
5. **Handle errors gracefully** - Try/catch blocks, user-friendly error messages

**Example migration template:**
```typescript
// Before (localStorage only)
export const useStoryStore = create<StoryStore>()(
  persist(
    (set) => ({
      stories: [],
      addStory: (story) => set((state) => ({
        stories: [...state.stories, story]
      })),
    }),
    { name: 'story-storage' }
  )
);

// After (API-integrated, using seriesStore pattern)
export const useStoryStore = create<StoryStore>()(
  persist(
    (set) => ({
      stories: [],
      isLoading: false,
      error: null,

      // Fetch from API
      fetchStories: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await storiesApi.getAll();
          set({ stories: response.data, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch stories',
            isLoading: false
          });
        }
      },

      // Create via API
      createStory: async (storyData) => {
        try {
          const response = await storiesApi.create(storyData);
          set((state) => ({
            stories: [...state.stories, response.data]
          }));
          return response.data;
        } catch (error) {
          throw error;
        }
      },
    }),
    { name: 'story-storage' }
  )
);
```

### Error Handling Pattern

```typescript
// Standardized error handling
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Use in components
const handleError = (error: unknown) => {
  if (error instanceof ApiError) {
    toast.error(error.message);
    console.error('API Error:', error);
  } else {
    toast.error('An unexpected error occurred');
    console.error('Unknown Error:', error);
  }
};
```

---

## Important Configuration Files

### Frontend Environment Files
- `.env.preview` - Preview/development environment (localhost:8000)
- `.env.production` - Production environment (live server)
- `.env.local` - Local overrides (gitignored)

**Required variables:**
```
VITE_API_BASE_URL=http://localhost:8000
VITE_API_VERSION=v1
```

### Backend Environment Files
- `.env.preview` - Preview database credentials
- `.env.production` - Production database credentials

**Required variables:**
```
DB_DRIVER=mysql
DB_HOST=localhost
DB_DATABASE=litrpg_studio
DB_USERNAME=root
DB_PASSWORD=
DB_PREFIX=
```

### Deployment Configuration
- `.env` (root) - Deployment paths and FTP credentials
- `publish.ps1` - Universal deployment script (frontend + backend)

---

## Common Development Workflows

### Adding a New API Endpoint

1. **Create Repository Method** (`backend/src/External/XRepository.php`):
```php
public function findAll(): array {
    return X::all()->toArray();
}
```

2. **Create Action Class** (`backend/src/Actions/X/CreateXAction.php`):
```php
class CreateXAction {
    public function __construct(private XRepository $repository) {}

    public function execute(array $data): array {
        return $this->repository->create($data);
    }
}
```

3. **Register in DI Container** (`backend/public/index.php`):
```php
$container->set(\App\Actions\X\CreateXAction::class, function() use ($container) {
    return new \App\Actions\X\CreateXAction(
        $container->get(\App\External\XRepository::class)
    );
});
```

4. **Add Controller Endpoint** (`backend/src/Controllers/XController.php`):
```php
public function create(Request $request, Response $response): Response {
    $data = $request->getParsedBody();
    $result = $this->createAction->execute($data);
    return $this->jsonResponse($response, $result, 201);
}
```

5. **Create Frontend API Client** (`frontend/src/api/x.ts`):
```typescript
export const xApi = {
  create: (data: CreateXData) => apiClient.post<X>('/x', data),
};
```

6. **Add Store Action** (`frontend/src/stores/xStore.ts`):
```typescript
createX: async (data: CreateXData) => {
  const response = await xApi.create(data);
  set((state) => ({ items: [...state.items, response.data] }));
}
```

### Debugging API Integration Issues

1. **Check browser DevTools Network tab** - See actual API requests/responses
2. **Verify backend is running** - `GET http://localhost:8000/api/v1/health`
3. **Check environment variables** - Frontend `.env.local`, backend `.env`
4. **Test API endpoint directly** - Use Postman or curl
5. **Check backend logs** - Look for PHP errors
6. **Verify DI container** - Ensure repositories and actions are registered

---

## Testing Strategy

### Frontend Testing
- **Unit tests** - Utility functions, calculations (Vitest)
- **Component tests** - UI components (React Testing Library)
- **Integration tests** - Store ↔ API communication (Mock Service Worker)

### Backend Testing
- **Unit tests** - Actions and repositories (PHPUnit)
- **Integration tests** - API endpoints (PHPUnit + database)

**Run specific test:**
```bash
# Frontend
npm test -- path/to/test.test.ts

# Backend
./vendor/bin/phpunit tests/Unit/SpecificTest.php
```

---

## Current Improvement Priorities

Based on `future_improvements.md` and `ARCHITECTURE_ASSESSMENT.md`:

### Phase 1: Complete Data Integration (Weeks 1-2) - IN PROGRESS
- Migrate `storyStore.ts` to use API (critical - stories are core feature)
- Migrate `analyticsStore.ts` to use API
- Migrate `unifiedTimelineStore.ts` to use API

### Phase 2: Code Quality & Consistency (Weeks 3-4)
- Remove all `any` types - replace with proper interfaces
- Standardize error handling across all components
- Move magic numbers to constants file

### Phase 3: Component Architecture (Weeks 5-6)
- Split large components (target: <200 lines)
- Extract custom hooks for data fetching
- Add React.memo and useMemo for performance

**Key Principle:** Focus on core features (writing, characters, series, analytics) before adding advanced features (AI, collaboration, advanced world-building).

---

## Production Deployment Notes

### Backend Vendor Optimization

For production, the vendor directory can be reduced from ~19MB to ~8-12MB (60-70% savings):

```bash
cd backend
./scripts/production-deploy.sh
```

This removes development dependencies, tests, docs, and unnecessary files.

### Database Initialization (Production)

After deploying to production:
1. Verify backend: `GET /api/v1/health`
2. Initialize database: `POST /api/v1/init-database`
3. Verify data: `GET /api/v1/series` and `GET /api/v1/characters`

---

## Critical Response Patterns

- When migrating stores from localStorage to API, use `seriesStore.ts` as the reference pattern
- Always add loading/error states when adding async actions
- Test API endpoints directly (Postman/curl) before integrating with frontend
- Use `replace_all: true` when making consistent changes across a file
- Fail fast on missing environment variables - no fallback values

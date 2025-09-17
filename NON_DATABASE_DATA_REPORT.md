# Non-Database Data Sources Report
## LitRPG Studio Application Data Analysis

### Executive Summary
This report identifies all frontend and backend data sources in the LitRPG Studio application that are **NOT** currently using the MySQL database. Despite having a comprehensive database schema and initialization system, several components still rely on alternative storage mechanisms.

---

## Backend Analysis

### JSON File Storage (backend/storage/)
The backend currently uses JSON files for persistent storage instead of the database:

#### Active JSON Storage Files:
- **`backend/storage/series.json`** - Series data storage
- **`backend/storage/characters.json`** - Character data storage
- **`backend/storage/books.json`** - Book data storage
- **`backend/storage/stories.json`** - Story data storage
- **`backend/storage/chapters.json`** - Chapter data storage

#### Controllers Using JSON Storage:
1. **SeriesController** (`backend/src/Controllers/SeriesController.php`)
   - Uses `JsonFileStorage` class
   - Methods: `getAll()`, `create()`, `getById()`, `update()`, `delete()`
   - **Impact**: All series data bypasses database

### Database vs JSON Storage Split:
- ✅ **Database Models Available**: Series, Book, Character, Story, Chapter, CharacterTemplate, StoryTemplate, SeriesAnalytics
- ❌ **Actually Using Database**: Limited to initialization only
- ❌ **Using JSON Files**: All CRUD operations

### Controller Dependency Issues:
Several controllers have constructor dependency injection problems preventing database usage:

1. **CharacterController** - Constructor expects `CharacterRepository` but container not configured
2. **BookController** - Constructor expects `BookRepository` but container not configured
3. **StoryController** - Constructor expects `StoryRepository` but container not configured
4. **ChapterController** - Constructor expects `ChapterRepository` but container not configured

---

## Frontend Analysis

### Local Storage Persistence:
Multiple Zustand stores use localStorage instead of API calls:

#### Stores Using Local Storage:
1. **`unifiedTimelineStore.ts`**
   - Persists timeline events, milestones, character development
   - Uses custom Map/Set serialization to localStorage
   - **Impact**: Timeline data never reaches backend

2. **`entityRegistryStore.ts`**
   - Persists entity relationships and cross-references
   - Uses custom Map/Set serialization to localStorage
   - **Impact**: Entity relationship data isolated to frontend

#### API Integration Status:
- **Series API** (`frontend/src/api/series.ts`) - ✅ Functional, hits backend JSON storage
- **Characters API** (`frontend/src/api/characters.ts`) - ❌ Broken due to backend DI issues
- **Stories API** (`frontend/src/api/stories.ts`) - ❌ Broken due to backend DI issues
- **Books API** (`frontend/src/api/books.ts`) - ❌ Broken due to backend DI issues
- **Analytics API** (`frontend/src/api/analytics.ts`) - ❌ Broken due to backend DI issues

### Mock Data Usage:
Components may fall back to hardcoded mock data when API calls fail:
- Character creation forms
- Story templates
- Analytics dashboards
- Timeline visualizations

---

## Critical Issues

### 1. Database Underutilization
- **Database Schema**: Fully implemented and initialized
- **Sample Data**: Successfully inserted via init script
- **Actual Usage**: Only SeriesController partially functional

### 2. Inconsistent Storage Strategy
- **Series**: JSON file storage (working)
- **Characters**: JSON intended, but broken DI prevents access
- **Books**: JSON intended, but broken DI prevents access
- **Stories**: JSON intended, but broken DI prevents access

### 3. Frontend Isolation
- **Timeline Data**: Trapped in localStorage, never synced
- **Entity Relationships**: Local-only, no backend persistence
- **User Preferences**: Local storage only

### 4. Dependency Injection Problems
Multiple backend controllers cannot instantiate due to missing repository bindings in DI container.

---

## Recommendations

### Phase 1: Fix Dependency Injection
1. Configure repository bindings in DI container
2. Implement proper repository pattern for database access
3. Fix constructor injection for all controllers

### Phase 2: Migrate JSON to Database
1. Update SeriesController to use database instead of JSON
2. Migrate existing JSON data to database tables
3. Remove JSON file dependencies

### Phase 3: Frontend Integration
1. Fix broken API endpoints
2. Update frontend stores to use API calls instead of localStorage
3. Implement proper sync mechanisms for timeline and entity data

### Phase 4: Data Consistency
1. Establish single source of truth (database)
2. Remove localStorage persistence for data that should be server-side
3. Implement proper offline handling if needed

---

## Files Requiring Updates

### Backend Files:
- `backend/config/container.php` - Add repository bindings
- `backend/src/Controllers/SeriesController.php` - Switch from JSON to database
- `backend/src/Controllers/CharacterController.php` - Fix DI constructor
- `backend/src/Controllers/BookController.php` - Fix DI constructor
- `backend/src/Controllers/StoryController.php` - Fix DI constructor
- `backend/src/Repositories/*.php` - Implement repository classes

### Frontend Files:
- `frontend/src/stores/unifiedTimelineStore.ts` - Replace localStorage with API
- `frontend/src/stores/entityRegistryStore.ts` - Replace localStorage with API
- `frontend/src/api/*.ts` - Fix error handling for broken endpoints

---

## Current State Summary
- **Database**: ✅ Initialized and ready
- **Backend**: ❌ Mostly broken due to DI issues
- **Frontend**: ⚠️ Working but isolated from backend
- **Data Flow**: ❌ Fragmented across JSON files, localStorage, and unused database

The application has the infrastructure for proper database-driven operation but currently operates on fragmented storage mechanisms that prevent data consistency and proper multi-user functionality.
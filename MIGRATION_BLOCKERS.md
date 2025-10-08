# LitRPG Studio - Data Migration Blockers

**Last Updated:** 2025-10-08
**Current Database Integration:** 3/7 stores (43%)

---

## ✅ Completed Migrations (3/7)

### 1. seriesStore ✅ COMPLETE
- **Backend:** Fully implemented with all CRUD endpoints
- **Database Tables:** `series`, `books`, `world_building`, etc.
- **Status:** Production ready

### 2. characterStore ✅ COMPLETE
- **Backend:** Fully implemented with character management
- **Database Tables:** `characters`, `character_skills`, `character_items`, etc.
- **Status:** Production ready

### 3. storyStore ✅ COMPLETE (Phase 1.1)
- **Backend:** Fully implemented
- **Database Tables:** `stories`, `chapters`
- **Frontend APIs:** `storiesApi`, `chaptersApi`, `writingSessionsApi`
- **Status:** Production ready
- **Note:** Writing session endpoints exist but return placeholders (not blocking story functionality)

---

## ❌ Blocked Migrations (4/7)

### 1. analyticsStore - BLOCKED (Backend Not Implemented)

**Why Blocked:**
- Backend `AnalyticsController.php` only has placeholder responses
- Writing session tracking endpoints exist in `StoryController` but return mock data
- No database tables for writing sessions, goals, or analytics data

**What's Needed:**
1. **Database Schema:**
   ```sql
   CREATE TABLE writing_sessions (
     id VARCHAR(36) PRIMARY KEY,
     story_id VARCHAR(36),
     chapter_id VARCHAR(36),
     start_time DATETIME,
     end_time DATETIME,
     word_target INT,
     words_written INT,
     duration INT,
     created_at TIMESTAMP,
     FOREIGN KEY (story_id) REFERENCES stories(id)
   );

   CREATE TABLE writing_goals (
     id VARCHAR(36) PRIMARY KEY,
     user_id VARCHAR(36),
     type ENUM('daily', 'weekly', 'monthly', 'custom'),
     target INT,
     current INT,
     deadline DATETIME,
     is_active BOOLEAN,
     created_at TIMESTAMP
   );
   ```

2. **Backend Implementation:**
   - Implement `AnalyticsController::getWritingSessions()`
   - Implement `AnalyticsController::saveWritingSession()`
   - Implement `AnalyticsController::getGoals()` / `createGoal()` / `updateGoal()`
   - Update `StoryController` writing session methods to persist to database

3. **Frontend Work:**
   - Migrate `analyticsStore.ts` to use real APIs (can follow `seriesStore.ts` pattern)
   - Add loading/error states
   - Keep localStorage for caching

**Estimated Effort:**
- Backend: 4-6 hours (database schema + controller implementation + testing)
- Frontend: 2-3 hours (store migration following existing pattern)
- **Total: 6-9 hours**

---

### 2. unifiedTimelineStore - BLOCKED (Complex Data Structures)

**Why Blocked:**
- Uses Map/Set data structures that don't serialize to JSON easily
- Very complex with 100+ actions
- Backend `timelineApi` exists but needs testing

**What's Needed:**
1. **Simplify Store:**
   - Reduce 100+ actions to core CRUD operations
   - Convert Map<string, TimelineEvent> → TimelineEvent[]
   - Convert Set<string> → string[]

2. **Backend Verification:**
   - Test if `timelineApi` endpoints actually work
   - May need database schema updates

3. **Frontend Refactoring:**
   - Major rewrite of timeline store structure
   - Update all components using timeline store

**Estimated Effort:**
- Analysis & Planning: 2 hours
- Backend verification/fixes: 2-4 hours
- Frontend refactoring: 8-12 hours
- **Total: 12-18 hours**

**Recommendation:** Defer until after analyticsStore

---

### 3. entityRegistryStore - BLOCKED (No Backend)

**Why Blocked:**
- Pure client-side data structure for tracking entity relationships
- No backend API exists for entity registry
- Uses complex Map/Set structures
- Low priority - mainly for cross-referencing

**What's Needed:**
1. **Backend API:**
   - Create `EntityRegistryController`
   - Database schema for entity relationships
   - CRUD endpoints

2. **OR Alternative Approach:**
   - Eliminate this store entirely
   - Use existing character/series APIs for relationships
   - Store relationships directly in character/series data

**Estimated Effort:**
- New Backend: 6-8 hours
- OR Eliminate & Refactor: 4-6 hours
- **Recommendation:** Consider elimination approach

---

### 4. worldStateStore - BLOCKED (No Backend)

**Why Blocked:**
- Tracks world state snapshots at different points in time
- No backend API exists
- Complex validation rules and snapshot system
- Low usage - mainly for advanced world-building

**What's Needed:**
1. **Backend API:**
   - Create `WorldStateController`
   - Database schema for world state snapshots
   - Snapshot versioning system

2. **OR Alternative Approach:**
   - Store world state in story/chapter metadata
   - Simplify to just current state, not full history

**Estimated Effort:**
- New Backend: 8-10 hours
- OR Simplify & Integrate: 4-6 hours
- **Recommendation:** Consider simplification approach

---

## 📊 Migration Priority Ranking

### High Priority (Should Do)
1. **analyticsStore** - Core feature, clear path forward, 6-9 hours
   - Writing analytics is important for writers
   - Backend structure is straightforward
   - Can follow proven seriesStore pattern

### Medium Priority (Could Do)
2. **unifiedTimelineStore** - Complex but useful, 12-18 hours
   - Timeline is a valuable feature
   - Requires significant refactoring
   - Backend API exists (needs verification)

### Low Priority (Consider Eliminating)
3. **entityRegistryStore** - 4-6 hours to eliminate
   - Functionality can be absorbed into other stores
   - Adds complexity without much benefit

4. **worldStateStore** - 4-6 hours to simplify
   - Advanced feature with low usage
   - Can be simplified to current state only

---

## 🎯 Recommended Migration Path

### Phase 4a: Analytics Store (Week 1)
1. Create database schema for writing_sessions and writing_goals
2. Implement AnalyticsController endpoints
3. Migrate analyticsStore.ts to use APIs
4. Test end-to-end writing session tracking

**Deliverable:** Full writing analytics with server persistence

### Phase 4b: Simplify Low-Priority Stores (Week 2)
1. Refactor entityRegistryStore → absorb into character/series stores
2. Simplify worldStateStore → store in chapter metadata
3. Reduce code complexity and maintenance burden

**Deliverable:** Cleaner codebase, fewer stores to maintain

### Phase 4c: Timeline Store (Week 3-4)
1. Analyze and simplify timeline store structure
2. Verify/fix backend timeline API
3. Migrate to server persistence
4. Update timeline components

**Deliverable:** Timeline data persisted to database

---

## 📈 Expected Outcomes

After completing recommended migrations:

**Database Integration:**
- Before: 3/7 stores (43%)
- After Phase 4a: 4/7 stores (57%)
- After Phase 4b: 4/5 stores (80%) - 2 stores eliminated
- After Phase 4c: 5/5 stores (100%) - Full database integration

**Code Quality:**
- Reduced store count from 7 to 5
- Eliminated complex Map/Set serialization
- Simplified data architecture
- Better separation of concerns

**User Benefits:**
- Writing analytics tracked across devices
- Timeline data preserved and shareable
- Reduced risk of data loss
- Better multi-device experience

---

## 🚫 What We're NOT Doing

**Not implementing these because they add complexity without clear benefit:**

1. ❌ Full world state snapshot history system
   - Too complex for current needs
   - Can add later if users demand it

2. ❌ Separate entity registry database
   - Relationships can live in character/series data
   - Simpler architecture is better

3. ❌ Client-side analytics computation
   - Server should generate analytics
   - More accurate, consistent, and performant

---

## ✅ Success Criteria

A migration is considered complete when:

1. ✅ Data survives browser localStorage clear
2. ✅ Works across multiple devices/browsers
3. ✅ Loading/error states properly handled
4. ✅ Offline caching works (reads from cache when API unavailable)
5. ✅ Type-safe API calls with proper interfaces
6. ✅ Backend endpoints tested and working
7. ✅ Database schema properly indexed and performant

---

## 📝 Notes

- All migrations should follow the `seriesStore.ts` pattern (proven, working implementation)
- Keep localStorage for caching even after API integration
- Prioritize user-facing features (analytics) over internal complexity (entity registry)
- Don't be afraid to eliminate stores that don't add clear value
- Focus on data integrity and user experience over feature completeness

# Writers Studio Out of Scope (Now)

This document defines what is explicitly out of scope for the current product cycle.

Current cycle focus is narrow:
- import and project setup,
- canon vault + world/character continuity,
- timeline confidence,
- continuity checks,
- revision workflow and exportable review reports.

If a feature does not directly improve continuity confidence or revision speed, it is out of scope now.

## 1) RPG and system-design tooling

These features are domain-specific and pull Writers Studio away from a general fiction continuity product.

Out of scope now:
- Combat system design and battle simulation
- Skills/progression systems
- Item databases and loot tables
- Level-up mechanics and equipment management

Current app areas to freeze (no new investment):
- `frontend/src/components/CombatSystemDesigner.tsx`
- `frontend/src/pages/SkillsView.tsx`
- `frontend/src/components/ItemDatabase.tsx`
- `frontend/src/components/LootTableDesigner.tsx`
- Character level/skill/item endpoints in `backend/config/routes.php`

## 2) Productivity gamification

Useful, but not core to continuity and revision confidence.

Out of scope now:
- Focus timers and sprint tooling
- Writing streaks/goals gamification
- Habit dashboards as a primary experience

Current app areas to freeze:
- `frontend/src/components/FocusTimer.tsx`
- `frontend/src/components/WritingGoals.tsx`
- `frontend/src/components/WritingSession.tsx`
- Goal/session-related widgets and backend writing-goal/session flows

## 3) Real-time collaboration complexity

This adds heavy product and support overhead before core single-author workflows are solid.

Out of scope now:
- Real-time co-authoring
- Presence indicators and live conflict resolution
- Multi-role permissions workflows

Current app areas to freeze:
- `frontend/src/components/CollaborationPanel.tsx`
- `frontend/src/services/collaborationService.ts`

## 4) Advanced analytics dashboards

Deep analytics is secondary until continuity checks and revision workflows are consistently valuable.

Out of scope now:
- Advanced productivity dashboards
- Pacing/engagement style analytics
- Broad analytics-first views

Current app areas to freeze:
- `frontend/src/components/WritingAnalytics.tsx`
- `frontend/src/components/AnalyticsDashboardWidget.tsx`
- `backend/src/Controllers/AnalyticsController.php`

## 5) Research database as a standalone platform

Research support is valuable later, but full research management is not part of the current core promise.

Out of scope now:
- Full research source/collection management platform
- Web clipping and external research ingestion ecosystems
- Citation-library style tooling

Current app areas to freeze:
- `frontend/src/components/ResearchDatabase.tsx`
- `backend/src/Controllers/ResearchController.php`

## 6) Publishing pipeline and author-business tooling

Writers Studio should support revision handoff first, not become a publishing suite.

Out of scope now:
- Direct publishing integrations (KDP/Smashwords/etc.)
- Full EPUB/print formatting workflows
- Marketing and sales tooling

Allowed in scope:
- exportable continuity/revision reports for editors and beta readers

## 7) AI co-authoring and generative writing

AI should stay constrained to optional continuity checks.

Out of scope now:
- Prompt-to-chapter generation
- Scene rewriting and plot-generation copilots
- "write my book" style assistant behavior

Allowed in scope:
- explainable issue detection tied to specific scenes and facts

## 8) Platform expansion overhead

Do not expand platform complexity before core web workflows are stable.

Out of scope now:
- Native desktop/mobile apps
- Offline-first sync/conflict architecture
- Plugin marketplace, public API platform, and scripting ecosystems

---

## Decision rule

A feature is out of scope now if it fails at least two checks:
- Improves continuity confidence within a typical writing session
- Reduces revision effort in a measurable way
- Can be delivered without creating major long-term maintenance burden

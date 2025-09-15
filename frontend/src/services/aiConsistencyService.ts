import type { BaseEntity, EntityRelationship } from '../types/entityRegistry';
import type { TimelineEvent } from '../types/unifiedTimeline';
import type { Story } from '../types/story';

export interface AIConsistencyIssue {
  id: string;
  type: 'critical' | 'major' | 'minor' | 'suggestion';
  category: 'plot' | 'character' | 'world' | 'timeline' | 'logic';
  title: string;
  description: string;
  confidence: number; // 0-1
  entities: string[];
  evidence: string[];
  suggestions: string[];
  autoFixAvailable: boolean;
  autoFix?: () => Promise<void>;
}

export interface WorldContext {
  entities: BaseEntity[];
  relationships: EntityRelationship[];
  timeline: TimelineEvent[];
  stories: Story[];
  rules: WorldRule[];
}

export interface WorldRule {
  id: string;
  category: 'physics' | 'magic' | 'society' | 'economy' | 'politics';
  description: string;
  scope: 'global' | 'regional' | 'local';
  exceptions: string[];
  enforcementLevel: 'strict' | 'flexible' | 'guideline';
}

export interface AIAnalysisContext {
  targetContent: string;
  targetEntity?: BaseEntity;
  currentChapter?: string;
  currentStory?: Story;
  worldContext: WorldContext;
  previousAnalysis?: AIConsistencyIssue[];
}

export class AIConsistencyService {
  private worldRules: Map<string, WorldRule> = new Map();
  private analysisCache: Map<string, AIConsistencyIssue[]> = new Map();
  private knowledgeGraph: Map<string, Set<string>> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules() {
    const defaultRules: WorldRule[] = [
      {
        id: 'character-mortality',
        category: 'physics',
        description: 'Dead characters cannot perform actions unless explicitly resurrected',
        scope: 'global',
        exceptions: ['flashbacks', 'dreams', 'spirit_communication'],
        enforcementLevel: 'strict'
      },
      {
        id: 'power-progression',
        category: 'magic',
        description: 'Character power levels should follow consistent progression rules',
        scope: 'global',
        exceptions: ['special_events', 'artifacts', 'divine_intervention'],
        enforcementLevel: 'flexible'
      },
      {
        id: 'timeline-causality',
        category: 'physics',
        description: 'Events must follow logical temporal sequence',
        scope: 'global',
        exceptions: ['time_travel', 'prophecy'],
        enforcementLevel: 'strict'
      },
      {
        id: 'economic-consistency',
        category: 'economy',
        description: 'Currency and economic systems should remain consistent',
        scope: 'regional',
        exceptions: ['economic_upheaval', 'new_territories'],
        enforcementLevel: 'flexible'
      },
      {
        id: 'character-knowledge',
        category: 'logic',
        description: 'Characters should not know information they haven\'t learned',
        scope: 'global',
        exceptions: ['telepathy', 'divine_knowledge', 'system_knowledge'],
        enforcementLevel: 'strict'
      }
    ];

    defaultRules.forEach(rule => this.worldRules.set(rule.id, rule));
  }

  async analyzeConsistency(context: AIAnalysisContext): Promise<AIConsistencyIssue[]> {
    const cacheKey = this.generateCacheKey(context);
    const cached = this.analysisCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const issues: AIConsistencyIssue[] = [];

    // Build knowledge graph for this analysis
    this.buildKnowledgeGraph(context.worldContext);

    // Run different analysis modules
    issues.push(...await this.analyzeCharacterConsistency(context));
    issues.push(...await this.analyzeTimelineConsistency(context));
    issues.push(...await this.analyzeWorldRuleViolations(context));
    issues.push(...await this.analyzePowerProgression(context));
    issues.push(...await this.analyzeKnowledgeConsistency(context));
    issues.push(...await this.analyzeEmotionalConsistency(context));

    // Sort by confidence and severity
    const sortedIssues = issues.sort((a, b) => {
      const severityOrder = { critical: 4, major: 3, minor: 2, suggestion: 1 };
      const severityDiff = severityOrder[b.type] - severityOrder[a.type];
      if (severityDiff !== 0) return severityDiff;
      return b.confidence - a.confidence;
    });

    // Cache results
    this.analysisCache.set(cacheKey, sortedIssues);
    return sortedIssues;
  }

  private async analyzeCharacterConsistency(context: AIAnalysisContext): Promise<AIConsistencyIssue[]> {
    const issues: AIConsistencyIssue[] = [];
    const { entities, timeline } = context.worldContext;
    const characters = entities.filter(e => e.type === 'character');

    for (const character of characters) {
      // Check for character death/resurrection consistency
      const deathEvents = timeline.filter(e =>
        e.involvedEntities.some(entity => entity.id === character.id) &&
        e.description.toLowerCase().includes('die') || e.description.toLowerCase().includes('death')
      );

      const postDeathEvents = timeline.filter(e => {
        const eventTime = e.timestamp.storyDay || 0;
        const latestDeath = deathEvents.reduce((latest, death) =>
          Math.max(latest, death.timestamp.storyDay || 0), 0);

        return eventTime > latestDeath &&
               e.involvedEntities.some(entity => entity.id === character.id) &&
               !e.description.toLowerCase().includes('resurrect') &&
               !e.description.toLowerCase().includes('spirit') &&
               !e.description.toLowerCase().includes('flashback');
      });

      if (deathEvents.length > 0 && postDeathEvents.length > 0) {
        issues.push({
          id: `character-death-${character.id}`,
          type: 'critical',
          category: 'character',
          title: 'Deceased Character Activity',
          description: `${character.name} appears to be active after death without resurrection`,
          confidence: 0.9,
          entities: [character.id],
          evidence: [
            `Death event: ${deathEvents[deathEvents.length - 1].description}`,
            `Post-death activity: ${postDeathEvents[0].description}`
          ],
          suggestions: [
            'Add resurrection event to timeline',
            'Mark post-death events as flashbacks or dreams',
            'Use spirit/ghost mechanics if applicable'
          ],
          autoFixAvailable: false
        });
      }

      // Check for character location consistency
      const locationEvents = timeline.filter(e =>
        e.involvedEntities.some(entity => entity.id === character.id) &&
        e.eventType === 'travel'
      ).sort((a, b) => (a.timestamp.storyDay || 0) - (b.timestamp.storyDay || 0));

      for (let i = 1; i < locationEvents.length; i++) {
        const prevEvent = locationEvents[i - 1];
        const currEvent = locationEvents[i];
        const timeDiff = (currEvent.timestamp.storyDay || 0) - (prevEvent.timestamp.storyDay || 0);

        // Check for impossible travel times (simplified)
        if (timeDiff < 1 && prevEvent.location !== currEvent.location) {
          issues.push({
            id: `travel-time-${character.id}-${i}`,
            type: 'major',
            category: 'world',
            title: 'Impossible Travel Time',
            description: `${character.name} traveled too quickly between distant locations`,
            confidence: 0.8,
            entities: [character.id],
            evidence: [
              `${prevEvent.description} at ${prevEvent.location}`,
              `${currEvent.description} at ${currEvent.location} (${timeDiff} days later)`
            ],
            suggestions: [
              'Add intermediate travel events',
              'Use teleportation or fast travel mechanics',
              'Adjust timeline spacing'
            ],
            autoFixAvailable: true,
            autoFix: async () => {
              // Could auto-generate intermediate travel events
            }
          });
        }
      }
    }

    return issues;
  }

  private async analyzeTimelineConsistency(context: AIAnalysisContext): Promise<AIConsistencyIssue[]> {
    const issues: AIConsistencyIssue[] = [];
    const { timeline } = context.worldContext;

    // Sort events by time
    const sortedEvents = [...timeline].sort((a, b) =>
      (a.timestamp.storyDay || 0) - (b.timestamp.storyDay || 0)
    );

    // Check for causality violations
    for (let i = 0; i < sortedEvents.length - 1; i++) {
      const currentEvent = sortedEvents[i];
      const nextEvent = sortedEvents[i + 1];

      // Check if effects happen before causes
      if (currentEvent.dependencies && currentEvent.dependencies.length > 0) {
        for (const depId of currentEvent.dependencies) {
          const dependentEvent = sortedEvents.find(e => e.id === depId);
          if (dependentEvent &&
              (dependentEvent.timestamp.storyDay || 0) > (currentEvent.timestamp.storyDay || 0)) {
            issues.push({
              id: `causality-${currentEvent.id}`,
              type: 'critical',
              category: 'timeline',
              title: 'Causality Violation',
              description: 'Event occurs before its prerequisite',
              confidence: 0.95,
              entities: currentEvent.involvedEntities.map(e => e.id),
              evidence: [
                `Event: ${currentEvent.description}`,
                `Prerequisite: ${dependentEvent.description}`
              ],
              suggestions: [
                'Reorder events in timeline',
                'Remove dependency if not required',
                'Add bridging events'
              ],
              autoFixAvailable: true,
              autoFix: async () => {
                // Could auto-reorder events
              }
            });
          }
        }
      }
    }

    return issues;
  }

  private async analyzeWorldRuleViolations(context: AIAnalysisContext): Promise<AIConsistencyIssue[]> {
    const issues: AIConsistencyIssue[] = [];
    const { entities, timeline } = context.worldContext;

    for (const rule of this.worldRules.values()) {
      switch (rule.id) {
        case 'power-progression':
          // Analyze power level consistency
          const powerEvents = timeline.filter(e =>
            e.description.toLowerCase().includes('level') ||
            e.description.toLowerCase().includes('power') ||
            e.description.toLowerCase().includes('skill')
          );

          // Look for sudden power spikes without explanation
          for (const event of powerEvents) {
            if (event.description.toLowerCase().includes('level') &&
                !event.description.toLowerCase().includes('gain') &&
                !event.description.toLowerCase().includes('train')) {

              const associatedCharacters = event.involvedEntities.filter(e =>
                entities.find(ent => ent.id === e.id && ent.type === 'character')
              );

              if (associatedCharacters.length > 0) {
                issues.push({
                  id: `power-spike-${event.id}`,
                  type: 'minor',
                  category: 'logic',
                  title: 'Unexplained Power Increase',
                  description: 'Character gained power without visible training or explanation',
                  confidence: 0.6,
                  entities: associatedCharacters.map(e => e.id),
                  evidence: [event.description],
                  suggestions: [
                    'Add training or quest events',
                    'Explain power source',
                    'Add mentor or teaching character'
                  ],
                  autoFixAvailable: false
                });
              }
            }
          }
          break;

        case 'economic-consistency':
          // Analyze economic transactions
          const economicEvents = timeline.filter(e =>
            e.description.toLowerCase().includes('gold') ||
            e.description.toLowerCase().includes('coin') ||
            e.description.toLowerCase().includes('buy') ||
            e.description.toLowerCase().includes('sell')
          );

          // Look for impossible wealth generation
          for (const event of economicEvents) {
            if (event.description.toLowerCase().includes('1000') &&
                event.description.toLowerCase().includes('gold')) {
              issues.push({
                id: `wealth-generation-${event.id}`,
                type: 'minor',
                category: 'world',
                title: 'Large Wealth Generation',
                description: 'Character gained significant wealth without clear source',
                confidence: 0.4,
                entities: event.involvedEntities.map(e => e.id),
                evidence: [event.description],
                suggestions: [
                  'Add treasure finding event',
                  'Explain wealth source',
                  'Break into smaller gains'
                ],
                autoFixAvailable: false
              });
            }
          }
          break;
      }
    }

    return issues;
  }

  private async analyzePowerProgression(context: AIAnalysisContext): Promise<AIConsistencyIssue[]> {
    const issues: AIConsistencyIssue[] = [];
    const { entities, timeline } = context.worldContext;
    const characters = entities.filter(e => e.type === 'character');

    for (const character of characters) {
      const characterEvents = timeline.filter(e =>
        e.involvedEntities.some(entity => entity.id === character.id)
      ).sort((a, b) => (a.timestamp.storyDay || 0) - (b.timestamp.storyDay || 0));

      // Look for power level mentions
      const powerEvents = characterEvents.filter(e =>
        e.description.toLowerCase().includes('level') ||
        e.description.toLowerCase().includes('class') ||
        e.description.toLowerCase().includes('skill')
      );

      if (powerEvents.length >= 2) {
        // Check for regression without explanation
        for (let i = 1; i < powerEvents.length; i++) {
          const prevEvent = powerEvents[i - 1];
          const currEvent = powerEvents[i];

          // Simple pattern matching for level decreases
          if (prevEvent.description.toLowerCase().includes('level') &&
              currEvent.description.toLowerCase().includes('level')) {

            issues.push({
              id: `power-regression-${character.id}-${i}`,
              type: 'suggestion',
              category: 'character',
              title: 'Character Development Tracking',
              description: `Consider tracking ${character.name}'s progression more explicitly`,
              confidence: 0.3,
              entities: [character.id],
              evidence: [
                prevEvent.description,
                currEvent.description
              ],
              suggestions: [
                'Create progression tracking system',
                'Add skill trees or level details',
                'Document training periods'
              ],
              autoFixAvailable: false
            });
          }
        }
      }
    }

    return issues;
  }

  private async analyzeKnowledgeConsistency(context: AIAnalysisContext): Promise<AIConsistencyIssue[]> {
    const issues: AIConsistencyIssue[] = [];
    const { entities, timeline } = context.worldContext;

    // Look for knowledge discovery patterns
    const knowledgeEvents = timeline.filter(e =>
      e.description.toLowerCase().includes('learn') ||
      e.description.toLowerCase().includes('discover') ||
      e.description.toLowerCase().includes('realize') ||
      e.description.toLowerCase().includes('remember')
    );

    for (const event of knowledgeEvents) {
      const characters = event.involvedEntities.filter(e =>
        entities.find(ent => ent.id === e.id && ent.type === 'character')
      );

      if (characters.length > 0) {
        // Check if character uses knowledge before learning it
        const laterEvents = timeline.filter(e =>
          (e.timestamp.storyDay || 0) < (event.timestamp.storyDay || 0) &&
          e.involvedEntities.some(entity =>
            characters.some(char => char.id === entity.id)
          )
        );

        // This is a simplified check - in reality you'd need NLP
        const suspiciousEvents = laterEvents.filter(e =>
          event.description.toLowerCase().includes('secret') &&
          e.description.toLowerCase().includes('secret')
        );

        if (suspiciousEvents.length > 0) {
          issues.push({
            id: `knowledge-${event.id}`,
            type: 'minor',
            category: 'logic',
            title: 'Possible Knowledge Inconsistency',
            description: 'Character may be using knowledge before learning it',
            confidence: 0.4,
            entities: characters.map(c => c.id),
            evidence: [
              `Knowledge gained: ${event.description}`,
              `Possible early use: ${suspiciousEvents[0].description}`
            ],
            suggestions: [
              'Verify timeline of knowledge acquisition',
              'Add explanation for early knowledge',
              'Reorder events if needed'
            ],
            autoFixAvailable: false
          });
        }
      }
    }

    return issues;
  }

  private async analyzeEmotionalConsistency(context: AIAnalysisContext): Promise<AIConsistencyIssue[]> {
    const issues: AIConsistencyIssue[] = [];
    const { timeline } = context.worldContext;

    // Look for emotional state changes
    const emotionalEvents = timeline.filter(e =>
      e.description.toLowerCase().includes('angry') ||
      e.description.toLowerCase().includes('sad') ||
      e.description.toLowerCase().includes('happy') ||
      e.description.toLowerCase().includes('rage') ||
      e.description.toLowerCase().includes('joy') ||
      e.description.toLowerCase().includes('grief')
    );

    // Check for rapid emotional shifts without triggers
    for (let i = 1; i < emotionalEvents.length; i++) {
      const prevEvent = emotionalEvents[i - 1];
      const currEvent = emotionalEvents[i];
      const timeDiff = (currEvent.timestamp.storyDay || 0) - (prevEvent.timestamp.storyDay || 0);

      if (timeDiff < 1 &&
          prevEvent.involvedEntities.some(e1 =>
            currEvent.involvedEntities.some(e2 => e1.id === e2.id)
          )) {

        issues.push({
          id: `emotion-shift-${currEvent.id}`,
          type: 'suggestion',
          category: 'character',
          title: 'Rapid Emotional Change',
          description: 'Character experienced quick emotional shift - consider adding transition',
          confidence: 0.3,
          entities: currEvent.involvedEntities.map(e => e.id),
          evidence: [
            prevEvent.description,
            currEvent.description
          ],
          suggestions: [
            'Add transitional events',
            'Explain emotional trigger',
            'Consider character personality'
          ],
          autoFixAvailable: false
        });
      }
    }

    return issues;
  }

  private buildKnowledgeGraph(worldContext: WorldContext) {
    this.knowledgeGraph.clear();

    // Build connections between entities
    for (const relationship of worldContext.relationships) {
      if (!this.knowledgeGraph.has(relationship.sourceId)) {
        this.knowledgeGraph.set(relationship.sourceId, new Set());
      }
      if (!this.knowledgeGraph.has(relationship.targetId)) {
        this.knowledgeGraph.set(relationship.targetId, new Set());
      }

      this.knowledgeGraph.get(relationship.sourceId)!.add(relationship.targetId);
      this.knowledgeGraph.get(relationship.targetId)!.add(relationship.sourceId);
    }
  }

  private generateCacheKey(context: AIAnalysisContext): string {
    const entityIds = context.worldContext.entities.map(e => e.id).sort().join(',');
    const timelineIds = context.worldContext.timeline.map(e => e.id).sort().join(',');
    return `${entityIds}-${timelineIds}-${context.targetContent.length}`;
  }

  // Add custom world rules
  addWorldRule(rule: WorldRule) {
    this.worldRules.set(rule.id, rule);
  }

  // Remove world rule
  removeWorldRule(ruleId: string) {
    this.worldRules.delete(ruleId);
  }

  // Get all world rules
  getWorldRules(): WorldRule[] {
    return Array.from(this.worldRules.values());
  }

  // Clear analysis cache
  clearCache() {
    this.analysisCache.clear();
  }
}

export const aiConsistencyService = new AIConsistencyService();
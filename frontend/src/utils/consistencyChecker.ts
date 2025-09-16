import type { Story, Location } from '../types/story';
import type { Character } from '../types/character';

export interface ConsistencyIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  category: 'character' | 'timeline' | 'world' | 'plot';
  relatedIds?: string[];
  suggestions?: string[];
}

export interface ConsistencyReport {
  timestamp: string;
  storyId: string;
  issuesCount: number;
  issues: ConsistencyIssue[];
  suggestions: string[];
  score: number; // 0-100 consistency score
}

export class ConsistencyChecker {
  static check(story: Story): ConsistencyReport {
    const issues: ConsistencyIssue[] = [];

    // Check character consistency
    issues.push(...this.checkCharacterConsistency(story));

    // Check timeline consistency
    issues.push(...this.checkTimelineConsistency(story));

    // Check world consistency
    issues.push(...this.checkWorldConsistency(story));

    // Check plot consistency
    issues.push(...this.checkPlotConsistency(story));

    const score = this.calculateConsistencyScore(issues);

    return {
      timestamp: new Date().toISOString(),
      storyId: story.id,
      issuesCount: issues.length,
      issues,
      suggestions: this.generateSuggestions(story, issues),
      score
    };
  }

  private static checkCharacterConsistency(story: Story): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];
    const allCharacters = [story.mainCharacter, ...story.supportingCharacters].filter(Boolean);

    // Check for duplicate character names
    const nameMap = new Map<string, Character[]>();
    allCharacters.forEach(char => {
      const existing = nameMap.get(char.name.toLowerCase()) || [];
      existing.push(char);
      nameMap.set(char.name.toLowerCase(), existing);
    });

    nameMap.forEach((chars, _name) => {
      if (chars.length > 1) {
        issues.push({
          type: 'warning',
          message: `Multiple characters with name "${chars[0].name}"`,
          category: 'character',
          relatedIds: chars.map(c => c.id),
          suggestions: ['Consider giving characters unique names', 'Use nicknames or titles to differentiate']
        });
      }
    });

    // Check character level progression
    allCharacters.forEach(char => {
      if (char.progression && char.progression.length > 1) {
        const levels = char.progression.map(p => p.level).sort((a, b) => a - b);
        for (let i = 1; i < levels.length; i++) {
          if (levels[i] <= levels[i - 1]) {
            issues.push({
              type: 'error',
              message: `Character "${char.name}" has inconsistent level progression`,
              category: 'character',
              relatedIds: [char.id],
              suggestions: ['Ensure level progression is always increasing']
            });
            break;
          }
        }
      }

      // Check if character stats match their level
      const expectedHitPoints = this.calculateExpectedHitPoints(char);
      if (Math.abs(char.stats.hitPoints - expectedHitPoints) > char.level * 2) {
        issues.push({
          type: 'warning',
          message: `Character "${char.name}" has unusual hit points for their level`,
          category: 'character',
          relatedIds: [char.id]
        });
      }

      // Check backstory references
      if (char.backstory) {
        const locationRefs = this.extractLocationReferences(char.backstory);
        const worldLocations = story.worldBuilding.locations?.map(l => l.name.toLowerCase()) || [];

        locationRefs.forEach(ref => {
          if (!worldLocations.includes(ref.toLowerCase())) {
            issues.push({
              type: 'info',
              message: `Character "${char.name}" references location "${ref}" that may not be defined`,
              category: 'character',
              relatedIds: [char.id],
              suggestions: ['Add referenced locations to world building', 'Update character backstory']
            });
          }
        });
      }
    });

    return issues;
  }

  private static checkTimelineConsistency(story: Story): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];

    if (story.timeline.length === 0) return issues;

    const sortedEvents = [...story.timeline].sort((a, b) => a.date.localeCompare(b.date));

    // Check for timeline conflicts
    for (let i = 1; i < sortedEvents.length; i++) {
      const prevEvent = sortedEvents[i - 1];
      const currentEvent = sortedEvents[i];

      // Check for character conflicts (character in multiple places at same time)
      const commonCharacters = prevEvent.charactersInvolved.filter(char =>
        currentEvent.charactersInvolved.includes(char)
      );

      if (commonCharacters.length > 0 && prevEvent.date === currentEvent.date) {
        issues.push({
          type: 'error',
          message: `Timeline conflict: Characters ${commonCharacters.join(', ')} appear in multiple events on ${prevEvent.date}`,
          category: 'timeline',
          relatedIds: [prevEvent.id, currentEvent.id],
          suggestions: ['Adjust event dates', 'Review character involvement']
        });
      }

      // Check for logical inconsistencies
      if (prevEvent.importance === 'critical' && currentEvent.importance === 'critical') {
        const timeDiff = this.calculateTimeDifference(prevEvent.date, currentEvent.date);
        if (timeDiff < 7) { // Less than a week apart
          issues.push({
            type: 'warning',
            message: `Two critical events "${prevEvent.title}" and "${currentEvent.title}" occur very close together`,
            category: 'timeline',
            relatedIds: [prevEvent.id, currentEvent.id],
            suggestions: ['Consider spacing major events', 'Reduce importance of one event']
          });
        }
      }
    }

    // Check chapter to timeline alignment
    story.chapters.forEach(chapter => {
      const chapterEvents = story.timeline.filter(event => event.chapter === chapter.id);
      if (chapterEvents.length === 0 && chapter.content.length > 1000) { // Long chapter with no events
        issues.push({
          type: 'info',
          message: `Chapter "${chapter.title}" has no timeline events but significant content`,
          category: 'timeline',
          relatedIds: [chapter.id],
          suggestions: ['Add timeline events for major chapter developments']
        });
      }
    });

    return issues;
  }

  private static checkWorldConsistency(story: Story): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];
    const world = story.worldBuilding;

    // Check basic world information
    if (!world.name || world.name.trim().length === 0) {
      issues.push({
        type: 'warning',
        message: 'World name is not defined',
        category: 'world',
        suggestions: ['Add a name for your world']
      });
    }

    if (!world.description || world.description.trim().length < 50) {
      issues.push({
        type: 'warning',
        message: 'World description is too brief or missing',
        category: 'world',
        suggestions: ['Add more detailed world description']
      });
    }

    // Check locations
    if (world.locations && world.locations.length > 0) {
      const locations = world.locations;

      // Check for location name conflicts
      const locationNames = new Map<string, Location[]>();
      locations.forEach(loc => {
        const existing = locationNames.get(loc.name.toLowerCase()) || [];
        existing.push(loc);
        locationNames.set(loc.name.toLowerCase(), existing);
      });

      locationNames.forEach((locs, _name) => {
        if (locs.length > 1) {
          issues.push({
            type: 'error',
            message: `Multiple locations named "${locs[0].name}"`,
            category: 'world',
            relatedIds: locs.map(l => l.id),
            suggestions: ['Use unique location names', 'Add regional prefixes']
          });
        }
      });

      // Check location hierarchies
      locations.forEach(location => {
        if (location.parentLocationId) {
          const parent = locations.find(l => l.id === location.parentLocationId);
          if (!parent) {
            issues.push({
              type: 'error',
              message: `Location "${location.name}" references non-existent parent location`,
              category: 'world',
              relatedIds: [location.id],
              suggestions: ['Fix parent location reference', 'Create missing parent location']
            });
          } else if (parent.size && location.size) {
            const sizeOrder = ['tiny', 'small', 'medium', 'large', 'huge', 'gigantic'];
            const parentSizeIndex = sizeOrder.indexOf(parent.size);
            const locationSizeIndex = sizeOrder.indexOf(location.size);

            if (locationSizeIndex >= parentSizeIndex) {
              issues.push({
                type: 'warning',
                message: `Location "${location.name}" is not smaller than its parent "${parent.name}"`,
                category: 'world',
                relatedIds: [location.id, parent.id],
                suggestions: ['Adjust location sizes', 'Review location hierarchy']
              });
            }
          }
        }
      });
    }

    // Check factions
    if (world.factions && world.factions.length > 0) {
      world.factions.forEach(faction => {
        // Check faction allies/enemies consistency
        faction.allies.forEach(allyId => {
          if (faction.enemies.includes(allyId)) {
            issues.push({
              type: 'error',
              message: `Faction "${faction.name}" lists the same entity as both ally and enemy`,
              category: 'world',
              relatedIds: [faction.id],
              suggestions: ['Review faction relationships', 'Choose either ally or enemy']
            });
          }
        });

        // Check influence levels
        if (faction.influence > 100 || faction.influence < 0) {
          issues.push({
            type: 'error',
            message: `Faction "${faction.name}" has invalid influence level: ${faction.influence}`,
            category: 'world',
            relatedIds: [faction.id],
            suggestions: ['Set influence between 0-100']
          });
        }
      });
    }

    return issues;
  }

  private static checkPlotConsistency(story: Story): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];

    // Check chapter ordering
    const chapters = story.chapters.sort((a, b) => a.order - b.order);
    for (let i = 1; i < chapters.length; i++) {
      if (chapters[i].order <= chapters[i - 1].order) {
        issues.push({
          type: 'error',
          message: `Chapter ordering conflict between "${chapters[i - 1].title}" and "${chapters[i].title}"`,
          category: 'plot',
          relatedIds: [chapters[i - 1].id, chapters[i].id],
          suggestions: ['Renumber chapters in correct order']
        });
      }
    }

    // Check for unresolved plot threads
    const allChapterContent = chapters.map(c => c.content).join(' ').toLowerCase();
    const commonPlotKeywords = [
      'mystery', 'secret', 'hidden', 'unknown', 'discover', 'find out',
      'question', 'wonder', 'curious', 'investigate'
    ];

    let plotThreads = 0;
    commonPlotKeywords.forEach(keyword => {
      if (allChapterContent.includes(keyword)) plotThreads++;
    });

    const resolutionKeywords = [
      'revealed', 'discovered', 'found', 'answered', 'solved', 'resolved'
    ];

    let resolutions = 0;
    resolutionKeywords.forEach(keyword => {
      if (allChapterContent.includes(keyword)) resolutions++;
    });

    if (plotThreads > resolutions * 2) {
      issues.push({
        type: 'info',
        message: 'Story may have many unresolved plot threads',
        category: 'plot',
        suggestions: ['Review unresolved mysteries', 'Consider resolving some plot threads']
      });
    }

    // Check story length consistency
    if (story.targetWordCount && story.wordCount > story.targetWordCount * 1.5) {
      issues.push({
        type: 'warning',
        message: `Story is significantly longer than target (${story.wordCount} vs ${story.targetWordCount} words)`,
        category: 'plot',
        suggestions: ['Consider editing for length', 'Adjust target word count']
      });
    }

    return issues;
  }

  private static calculateExpectedHitPoints(character: Character): number {
    // Simple formula: base HP + (level * constitution modifier)
    const baseHP = 10;
    const conModifier = Math.floor((character.stats.constitution - 10) / 2);
    return baseHP + (character.level * (conModifier + 5));
  }

  private static extractLocationReferences(text: string): string[] {
    // Simple pattern matching for location references
    const patterns = [
      /(?:from|in|at|near|of)\s+([A-Z][a-zA-Z\s]+?)(?:[,.!?]|$)/g,
      /([A-Z][a-zA-Z\s]+?)\s+(?:kingdom|city|town|village|land|realm)/gi
    ];

    const locations: string[] = [];
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const location = match[1].trim();
        if (location.length > 2 && !locations.includes(location)) {
          locations.push(location);
        }
      }
    });

    return locations;
  }

  private static calculateTimeDifference(date1: string, date2: string): number {
    // Simple date difference calculation - would need proper date parsing for real implementation
    return Math.abs(new Date(date1).getTime() - new Date(date2).getTime()) / (1000 * 60 * 60 * 24);
  }

  private static calculateConsistencyScore(issues: ConsistencyIssue[]): number {
    let score = 100;

    issues.forEach(issue => {
      switch (issue.type) {
        case 'error':
          score -= 10;
          break;
        case 'warning':
          score -= 5;
          break;
        case 'info':
          score -= 1;
          break;
      }
    });

    return Math.max(0, score);
  }

  private static generateSuggestions(story: Story, issues: ConsistencyIssue[]): string[] {
    const suggestions = [
      'Regularly run consistency checks during writing',
      'Keep a character sheet updated with key details',
      'Maintain a timeline of major story events'
    ];

    const errorCount = issues.filter(i => i.type === 'error').length;
    const warningCount = issues.filter(i => i.type === 'warning').length;

    if (errorCount > 0) {
      suggestions.push('Address critical errors first to maintain story integrity');
    }

    if (warningCount > 5) {
      suggestions.push('Review character and world building consistency');
    }

    if (!story.worldBuilding.name) {
      suggestions.push('Give your world a name to establish identity');
    }

    if (story.chapters.length > 5 && story.timeline.length === 0) {
      suggestions.push('Add timeline events to track story progression');
    }

    return suggestions;
  }
}
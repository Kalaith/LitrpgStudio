import type { Character, StoryReference, CharacterCrossReference } from '../types/character';
import type { Story, Chapter, CharacterProgressionEvent } from '../types/story';
import { useCharacterStore } from '../stores/characterStore';

export interface CharacterMention {
  characterId: string;
  characterName: string;
  context: string;
  position: number;
  confidence: number;
  mentionType: 'direct' | 'indirect' | 'reference';
}

export interface ConsistencyIssue {
  id: string;
  type: 'character_inconsistency' | 'timeline_error' | 'stat_mismatch' | 'relationship_conflict';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  sourceId: string;
  targetId?: string;
  suggestion?: string;
  autoFixAvailable: boolean;
}

export class CrossReferenceService {
  private static instance: CrossReferenceService;

  public static getInstance(): CrossReferenceService {
    if (!this.instance) {
      this.instance = new CrossReferenceService();
    }
    return this.instance;
  }

  // Detect character mentions in text
  public detectCharacterMentions(text: string, characters: Character[]): CharacterMention[] {
    const mentions: CharacterMention[] = [];

    characters.forEach(character => {
      const variations = this.generateNameVariations(character.name);

      variations.forEach(variation => {
        const regex = new RegExp(`\\b${this.escapeRegex(variation)}\\b`, 'gi');
        let match;

        while ((match = regex.exec(text)) !== null) {
          const context = this.extractContext(text, match.index, 100);
          const confidence = this.calculateMentionConfidence(variation, character.name, context);

          mentions.push({
            characterId: character.id,
            characterName: character.name,
            context,
            position: match.index,
            confidence,
            mentionType: this.determineMentionType(context, variation)
          });
        }
      });
    });

    return mentions.sort((a, b) => b.confidence - a.confidence);
  }

  // Generate story references from character mentions
  public generateStoryReferences(
    mentions: CharacterMention[],
    storyId: string,
    chapterId?: string,
    chapterNumber?: number
  ): StoryReference[] {
    return mentions
      .filter(mention => mention.confidence > 0.7)
      .map(mention => ({
        storyId,
        chapterId,
        mentionType: this.mapMentionToReferenceType(mention.mentionType),
        context: mention.context,
        chapterNumber,
        importanceLevel: this.determineImportanceLevel(mention.confidence, mention.context)
      }));
  }

  // Analyze story consistency
  public analyzeConsistency(
    characters: Character[],
    _stories: Story[],
    _chapters: Chapter[]
  ): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];

    // Check character stat consistency across chapters
    issues.push(...this.checkStatConsistency());

    // Check relationship consistency
    issues.push(...this.checkRelationshipConsistency(characters));

    // Check timeline consistency
    issues.push(...this.checkTimelineConsistency());

    // Check character appearance consistency
    issues.push(...this.checkAppearanceConsistency());

    return issues.sort((a, b) => this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity));
  }

  // Create cross-references between story elements
  public createCrossReference(
    sourceType: CharacterCrossReference['sourceType'],
    sourceId: string,
    targetType: CharacterCrossReference['targetType'],
    targetId: string,
    relationshipType: string,
    strength: number = 5,
    description?: string
  ): Omit<CharacterCrossReference, 'id'> {
    return {
      sourceType,
      sourceId,
      targetType,
      targetId,
      relationshipType,
      strength,
      description
    };
  }

  // Update character references when story content changes
  public updateCharacterReferences(
    characterId: string,
    newMentions: CharacterMention[],
    storyId: string,
    chapterId?: string
  ): void {
    const characterStore = useCharacterStore.getState();

    // Remove old references for this story/chapter
    characterStore.removeStoryReference(characterId, storyId, chapterId);

    // Add new references
    const newReferences = this.generateStoryReferences(newMentions, storyId, chapterId);
    newReferences.forEach(ref => {
      characterStore.addStoryReference(characterId, ref);
    });
  }

  // Track character progression through story
  public trackCharacterProgression(
    characterId: string,
    chapters: Chapter[]
  ): { chapter: Chapter; progressionEvents: CharacterProgressionEvent[] }[] {
    return chapters
      .filter(chapter =>
        chapter.characterProgression.some(event => event.characterId === characterId)
      )
      .map(chapter => ({
        chapter,
        progressionEvents: chapter.characterProgression.filter(
          event => event.characterId === characterId
        )
      }))
      .sort((a, b) => a.chapter.order - b.chapter.order);
  }

  // Private helper methods
  private generateNameVariations(name: string): string[] {
    const variations = [name];

    // Add common nickname patterns
    const parts = name.split(' ');
    if (parts.length > 1) {
      variations.push(parts[0]); // First name
      variations.push(parts[parts.length - 1]); // Last name
    }

    // Add shortened versions
    if (name.length > 4) {
      variations.push(name.substring(0, Math.ceil(name.length / 2)));
    }

    return variations;
  }

  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private extractContext(text: string, position: number, contextLength: number): string {
    const start = Math.max(0, position - contextLength / 2);
    const end = Math.min(text.length, position + contextLength / 2);
    return text.substring(start, end).trim();
  }

  private calculateMentionConfidence(
    variation: string,
    originalName: string,
    context: string
  ): number {
    let confidence = 0.5;

    // Exact name match gets higher confidence
    if (variation === originalName) confidence += 0.3;

    // Context clues increase confidence
    const contextWords = context.toLowerCase();
    if (contextWords.includes('said') || contextWords.includes('replied')) confidence += 0.2;
    if (contextWords.includes('he') || contextWords.includes('she')) confidence += 0.1;

    return Math.min(1, confidence);
  }

  private determineMentionType(context: string, variation: string): CharacterMention['mentionType'] {
    const lowerContext = context.toLowerCase();

    if (lowerContext.includes(variation.toLowerCase() + ' said') ||
        lowerContext.includes(variation.toLowerCase() + ' replied')) {
      return 'direct';
    }

    if (lowerContext.includes('he') || lowerContext.includes('she') ||
        lowerContext.includes('his') || lowerContext.includes('her')) {
      return 'indirect';
    }

    return 'reference';
  }

  private mapMentionToReferenceType(mentionType: CharacterMention['mentionType']): StoryReference['mentionType'] {
    switch (mentionType) {
      case 'direct': return 'appears';
      case 'indirect': return 'mentioned';
      case 'reference': return 'mentioned';
      default: return 'mentioned';
    }
  }

  private determineImportanceLevel(confidence: number, _context: string): StoryReference['importanceLevel'] {
    if (confidence > 0.9) return 'critical';
    if (confidence > 0.8) return 'major';
    if (confidence > 0.7) return 'moderate';
    if (confidence > 0.6) return 'minor';
    return 'background';
  }

  private checkStatConsistency(): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];

    // Implementation would go here for checking stat consistency
    // This is a placeholder for now

    return issues;
  }

  private checkRelationshipConsistency(characters: Character[]): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];

    characters.forEach(character => {
      character.relationships.forEach(relationship => {
        const targetCharacter = characters.find(c => c.id === relationship.characterId);

        if (targetCharacter) {
          const reciprocalRelationship = targetCharacter.relationships.find(
            r => r.characterId === character.id
          );

          if (!reciprocalRelationship) {
            issues.push({
              id: `missing_reciprocal_${character.id}_${relationship.characterId}`,
              type: 'relationship_conflict',
              severity: 'medium',
              description: `${character.name} has a relationship with ${targetCharacter.name}, but not vice versa`,
              sourceId: character.id,
              targetId: targetCharacter.id,
              suggestion: `Add reciprocal relationship to ${targetCharacter.name}`,
              autoFixAvailable: true
            });
          }
        }
      });
    });

    return issues;
  }

  private checkTimelineConsistency(): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];

    // Implementation would go here for checking timeline consistency
    // This is a placeholder for now

    return issues;
  }

  private checkAppearanceConsistency(): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];

    // Implementation would go here for checking appearance consistency
    // This is a placeholder for now

    return issues;
  }

  private getSeverityWeight(severity: ConsistencyIssue['severity']): number {
    switch (severity) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }
}

// Export singleton instance
export const crossReferenceService = CrossReferenceService.getInstance();

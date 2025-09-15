import { BaseEntity, EntityRelationship } from '../types/entityRegistry';
import { TimelineEvent } from '../types/unifiedTimeline';
import { Story } from '../types/story';

export interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'reviewer' | 'viewer';
  isOnline: boolean;
  lastActive: Date;
  currentView?: {
    storyId?: string;
    chapterId?: string;
    entityId?: string;
    cursorPosition?: number;
  };
  permissions: CollaborationPermissions;
}

export interface CollaborationPermissions {
  canEditStory: boolean;
  canEditCharacters: boolean;
  canEditTimeline: boolean;
  canEditWorldBuilding: boolean;
  canManageCollaborators: boolean;
  canExport: boolean;
  canDelete: boolean;
  allowedStoryIds: string[];
  allowedEntityTypes: string[];
}

export interface CollaborationChange {
  id: string;
  userId: string;
  timestamp: Date;
  type: 'create' | 'update' | 'delete' | 'comment';
  target: 'story' | 'character' | 'timeline' | 'entity' | 'relationship';
  targetId: string;
  oldValue?: any;
  newValue?: any;
  description: string;
  conflictsWith?: string[];
  isResolved: boolean;
}

export interface CollaborationComment {
  id: string;
  userId: string;
  timestamp: Date;
  targetType: 'story' | 'character' | 'timeline' | 'entity';
  targetId: string;
  position?: {
    start: number;
    end: number;
  };
  content: string;
  thread: CollaborationComment[];
  isResolved: boolean;
  mentions: string[]; // User IDs
}

export interface CollaborationConflict {
  id: string;
  type: 'concurrent_edit' | 'permission_denied' | 'version_mismatch';
  users: string[];
  targetType: string;
  targetId: string;
  changes: CollaborationChange[];
  resolutionStrategy?: 'merge' | 'override' | 'manual';
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
}

export interface CollaborationSession {
  id: string;
  projectId: string;
  participants: CollaborationUser[];
  changes: CollaborationChange[];
  comments: CollaborationComment[];
  conflicts: CollaborationConflict[];
  startedAt: Date;
  lastActivity: Date;
}

export interface ChangeTrackingOptions {
  enableRealTimeSync: boolean;
  conflictResolution: 'auto' | 'manual' | 'owner_priority';
  saveInterval: number; // milliseconds
  maxHistoryLength: number;
  enableComments: boolean;
  enablePresenceIndicators: boolean;
}

export class CollaborationService {
  private currentUser: CollaborationUser | null = null;
  private currentSession: CollaborationSession | null = null;
  private changeListeners: Map<string, (change: CollaborationChange) => void> = new Map();
  private presenceListeners: Map<string, (users: CollaborationUser[]) => void> = new Map();
  private commentListeners: Map<string, (comment: CollaborationComment) => void> = new Map();
  private conflictListeners: Map<string, (conflict: CollaborationConflict) => void> = new Map();
  private options: ChangeTrackingOptions;
  private isConnected = false;
  private pendingChanges: CollaborationChange[] = [];
  private version = 0;

  constructor(options: Partial<ChangeTrackingOptions> = {}) {
    this.options = {
      enableRealTimeSync: true,
      conflictResolution: 'manual',
      saveInterval: 5000,
      maxHistoryLength: 1000,
      enableComments: true,
      enablePresenceIndicators: true,
      ...options
    };

    this.initializeSession();
  }

  private initializeSession() {
    // Initialize mock collaboration session
    this.currentUser = {
      id: 'user-1',
      name: 'Current User',
      email: 'user@example.com',
      role: 'owner',
      isOnline: true,
      lastActive: new Date(),
      permissions: {
        canEditStory: true,
        canEditCharacters: true,
        canEditTimeline: true,
        canEditWorldBuilding: true,
        canManageCollaborators: true,
        canExport: true,
        canDelete: true,
        allowedStoryIds: [],
        allowedEntityTypes: []
      }
    };

    this.currentSession = {
      id: 'session-1',
      projectId: 'project-1',
      participants: [this.currentUser],
      changes: [],
      comments: [],
      conflicts: [],
      startedAt: new Date(),
      lastActivity: new Date()
    };

    this.isConnected = true;
  }

  // User Management
  async inviteUser(email: string, role: CollaborationUser['role'], permissions: Partial<CollaborationPermissions>): Promise<CollaborationUser> {
    if (!this.canManageCollaborators()) {
      throw new Error('Insufficient permissions to invite users');
    }

    const newUser: CollaborationUser = {
      id: `user-${Date.now()}`,
      name: email.split('@')[0],
      email,
      role,
      isOnline: false,
      lastActive: new Date(),
      permissions: {
        canEditStory: role === 'owner' || role === 'editor',
        canEditCharacters: role === 'owner' || role === 'editor',
        canEditTimeline: role === 'owner' || role === 'editor',
        canEditWorldBuilding: role === 'owner' || role === 'editor',
        canManageCollaborators: role === 'owner',
        canExport: role !== 'viewer',
        canDelete: role === 'owner',
        allowedStoryIds: [],
        allowedEntityTypes: [],
        ...permissions
      }
    };

    if (this.currentSession) {
      this.currentSession.participants.push(newUser);
      this.notifyPresenceChange();
    }

    return newUser;
  }

  async removeUser(userId: string): Promise<void> {
    if (!this.canManageCollaborators() || !this.currentSession) {
      throw new Error('Insufficient permissions or no active session');
    }

    this.currentSession.participants = this.currentSession.participants.filter(u => u.id !== userId);
    this.notifyPresenceChange();
  }

  async updateUserPermissions(userId: string, permissions: Partial<CollaborationPermissions>): Promise<void> {
    if (!this.canManageCollaborators() || !this.currentSession) {
      throw new Error('Insufficient permissions or no active session');
    }

    const user = this.currentSession.participants.find(u => u.id === userId);
    if (user) {
      user.permissions = { ...user.permissions, ...permissions };
      this.notifyPresenceChange();
    }
  }

  // Change Tracking
  async trackChange(
    type: CollaborationChange['type'],
    target: CollaborationChange['target'],
    targetId: string,
    oldValue: any,
    newValue: any,
    description: string
  ): Promise<CollaborationChange> {
    if (!this.currentUser || !this.currentSession) {
      throw new Error('No active collaboration session');
    }

    const change: CollaborationChange = {
      id: `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: this.currentUser.id,
      timestamp: new Date(),
      type,
      target,
      targetId,
      oldValue,
      newValue,
      description,
      conflictsWith: [],
      isResolved: true
    };

    // Check for conflicts
    const conflicts = await this.detectConflicts(change);
    if (conflicts.length > 0) {
      change.conflictsWith = conflicts.map(c => c.id);
      change.isResolved = false;

      for (const conflict of conflicts) {
        this.notifyConflict(conflict);
      }
    }

    this.currentSession.changes.push(change);
    this.currentSession.lastActivity = new Date();
    this.version++;

    // Trim history if too long
    if (this.currentSession.changes.length > this.options.maxHistoryLength) {
      this.currentSession.changes = this.currentSession.changes.slice(-this.options.maxHistoryLength);
    }

    this.notifyChange(change);

    // Simulate real-time sync
    if (this.options.enableRealTimeSync) {
      setTimeout(() => this.syncChanges(), 100);
    }

    return change;
  }

  private async detectConflicts(change: CollaborationChange): Promise<CollaborationConflict[]> {
    if (!this.currentSession) return [];

    const conflicts: CollaborationConflict[] = [];
    const recentChanges = this.currentSession.changes.filter(
      c => c.targetId === change.targetId &&
           c.userId !== change.userId &&
           Date.now() - c.timestamp.getTime() < 30000 // 30 seconds
    );

    if (recentChanges.length > 0) {
      const conflict: CollaborationConflict = {
        id: `conflict-${Date.now()}`,
        type: 'concurrent_edit',
        users: [change.userId, ...recentChanges.map(c => c.userId)],
        targetType: change.target,
        targetId: change.targetId,
        changes: [change, ...recentChanges],
        isResolved: false
      };

      conflicts.push(conflict);
      this.currentSession.conflicts.push(conflict);
    }

    return conflicts;
  }

  // Comments
  async addComment(
    targetType: CollaborationComment['targetType'],
    targetId: string,
    content: string,
    position?: { start: number; end: number },
    mentions: string[] = []
  ): Promise<CollaborationComment> {
    if (!this.currentUser || !this.currentSession) {
      throw new Error('No active collaboration session');
    }

    const comment: CollaborationComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: this.currentUser.id,
      timestamp: new Date(),
      targetType,
      targetId,
      position,
      content,
      thread: [],
      isResolved: false,
      mentions
    };

    this.currentSession.comments.push(comment);
    this.notifyComment(comment);

    return comment;
  }

  async replyToComment(commentId: string, content: string): Promise<CollaborationComment> {
    if (!this.currentUser || !this.currentSession) {
      throw new Error('No active collaboration session');
    }

    const parentComment = this.currentSession.comments.find(c => c.id === commentId);
    if (!parentComment) {
      throw new Error('Comment not found');
    }

    const reply: CollaborationComment = {
      id: `reply-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: this.currentUser.id,
      timestamp: new Date(),
      targetType: parentComment.targetType,
      targetId: parentComment.targetId,
      content,
      thread: [],
      isResolved: false,
      mentions: []
    };

    parentComment.thread.push(reply);
    this.notifyComment(reply);

    return reply;
  }

  async resolveComment(commentId: string): Promise<void> {
    if (!this.currentSession) return;

    const comment = this.currentSession.comments.find(c => c.id === commentId);
    if (comment) {
      comment.isResolved = true;
      this.notifyComment(comment);
    }
  }

  // Presence Tracking
  async updatePresence(view: CollaborationUser['currentView']): Promise<void> {
    if (!this.currentUser) return;

    this.currentUser.currentView = view;
    this.currentUser.lastActive = new Date();
    this.notifyPresenceChange();
  }

  async updateUserStatus(isOnline: boolean): Promise<void> {
    if (!this.currentUser) return;

    this.currentUser.isOnline = isOnline;
    this.currentUser.lastActive = new Date();
    this.notifyPresenceChange();
  }

  // Conflict Resolution
  async resolveConflict(
    conflictId: string,
    strategy: 'merge' | 'override' | 'manual',
    selectedChanges?: string[]
  ): Promise<void> {
    if (!this.currentSession || !this.currentUser) return;

    const conflict = this.currentSession.conflicts.find(c => c.id === conflictId);
    if (!conflict) return;

    conflict.resolutionStrategy = strategy;
    conflict.isResolved = true;
    conflict.resolvedBy = this.currentUser.id;
    conflict.resolvedAt = new Date();

    // Mark related changes as resolved
    for (const change of conflict.changes) {
      if (!selectedChanges || selectedChanges.includes(change.id)) {
        change.isResolved = true;
      }
    }

    this.notifyConflict(conflict);
  }

  // Event Listeners
  onChangeTracked(callback: (change: CollaborationChange) => void): () => void {
    const id = Math.random().toString(36);
    this.changeListeners.set(id, callback);
    return () => this.changeListeners.delete(id);
  }

  onPresenceChanged(callback: (users: CollaborationUser[]) => void): () => void {
    const id = Math.random().toString(36);
    this.presenceListeners.set(id, callback);
    return () => this.presenceListeners.delete(id);
  }

  onCommentAdded(callback: (comment: CollaborationComment) => void): () => void {
    const id = Math.random().toString(36);
    this.commentListeners.set(id, callback);
    return () => this.commentListeners.delete(id);
  }

  onConflictDetected(callback: (conflict: CollaborationConflict) => void): () => void {
    const id = Math.random().toString(36);
    this.conflictListeners.set(id, callback);
    return () => this.conflictListeners.delete(id);
  }

  // Utility Methods
  private notifyChange(change: CollaborationChange) {
    this.changeListeners.forEach(callback => callback(change));
  }

  private notifyPresenceChange() {
    if (!this.currentSession) return;
    this.presenceListeners.forEach(callback => callback(this.currentSession!.participants));
  }

  private notifyComment(comment: CollaborationComment) {
    this.commentListeners.forEach(callback => callback(comment));
  }

  private notifyConflict(conflict: CollaborationConflict) {
    this.conflictListeners.forEach(callback => callback(conflict));
  }

  private async syncChanges() {
    // Simulate network sync
    if (this.pendingChanges.length > 0) {
      console.log(`Syncing ${this.pendingChanges.length} changes...`);
      this.pendingChanges = [];
    }
  }

  private canManageCollaborators(): boolean {
    return this.currentUser?.permissions.canManageCollaborators ?? false;
  }

  // Getters
  getCurrentUser(): CollaborationUser | null {
    return this.currentUser;
  }

  getCurrentSession(): CollaborationSession | null {
    return this.currentSession;
  }

  getParticipants(): CollaborationUser[] {
    return this.currentSession?.participants ?? [];
  }

  getChanges(): CollaborationChange[] {
    return this.currentSession?.changes ?? [];
  }

  getComments(targetType?: string, targetId?: string): CollaborationComment[] {
    if (!this.currentSession) return [];

    let comments = this.currentSession.comments;
    if (targetType) {
      comments = comments.filter(c => c.targetType === targetType);
    }
    if (targetId) {
      comments = comments.filter(c => c.targetId === targetId);
    }

    return comments.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getConflicts(): CollaborationConflict[] {
    return this.currentSession?.conflicts.filter(c => !c.isResolved) ?? [];
  }

  isConnected(): boolean {
    return this.isConnected;
  }

  getVersion(): number {
    return this.version;
  }
}

export const collaborationService = new CollaborationService();
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  MessageSquare,
  AlertTriangle,
  Settings,
  Crown,
  Eye,
  Edit,
  X,
  Check,
  Clock,
  Send,
  MoreHorizontal,
  Wifi,
  WifiOff,
  CircleDot,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import {
  collaborationService,
  CollaborationUser,
  CollaborationComment,
  CollaborationConflict,
  CollaborationChange
} from '../services/collaborationService';

interface CollaborationPanelProps {
  isVisible: boolean;
  onToggle: () => void;
  className?: string;
}

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  isVisible,
  onToggle,
  className = ''
}) => {
  const [participants, setParticipants] = useState<CollaborationUser[]>([]);
  const [comments, setComments] = useState<CollaborationComment[]>([]);
  const [conflicts, setConflicts] = useState<CollaborationConflict[]>([]);
  const [changes, setChanges] = useState<CollaborationChange[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'comments' | 'conflicts' | 'history'>('users');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);

  useEffect(() => {
    // Initialize collaboration data
    setParticipants(collaborationService.getParticipants());
    setComments(collaborationService.getComments());
    setConflicts(collaborationService.getConflicts());
    setChanges(collaborationService.getChanges().slice(-20)); // Latest 20 changes
    setIsConnected(collaborationService.isConnected());

    // Set up event listeners
    const unsubscribePresence = collaborationService.onPresenceChanged(setParticipants);
    const unsubscribeComments = collaborationService.onCommentAdded((comment) => {
      setComments(prev => [comment, ...prev]);
    });
    const unsubscribeConflicts = collaborationService.onConflictDetected((conflict) => {
      setConflicts(prev => [conflict, ...prev]);
    });
    const unsubscribeChanges = collaborationService.onChangeTracked((change) => {
      setChanges(prev => [change, ...prev.slice(0, 19)]);
    });

    return () => {
      unsubscribePresence();
      unsubscribeComments();
      unsubscribeConflicts();
      unsubscribeChanges();
    };
  }, []);

  const handleInviteUser = useCallback(async (email: string, role: CollaborationUser['role']) => {
    try {
      await collaborationService.inviteUser(email, role, {});
      setShowInviteModal(false);
    } catch (error) {
      console.error('Failed to invite user:', error);
    }
  }, []);

  const handleAddComment = useCallback(async () => {
    if (!newComment.trim()) return;

    try {
      await collaborationService.addComment(
        'story',
        selectedEntity || 'current-context',
        newComment
      );
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  }, [newComment, selectedEntity]);

  const handleResolveConflict = useCallback(async (conflictId: string, strategy: 'merge' | 'override') => {
    try {
      await collaborationService.resolveConflict(conflictId, strategy);
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    }
  }, []);

  const getRoleIcon = (role: CollaborationUser['role']) => {
    switch (role) {
      case 'owner': return Crown;
      case 'editor': return Edit;
      case 'reviewer': return MessageSquare;
      case 'viewer': return Eye;
      default: return Users;
    }
  };

  const getRoleColor = (role: CollaborationUser['role']) => {
    switch (role) {
      case 'owner': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'editor': return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
      case 'reviewer': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'viewer': return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed top-4 right-4 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
      >
        <Users size={20} />
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 400 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 400 }}
      className={`fixed right-4 top-4 w-80 max-h-[90vh] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Users size={16} className="text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Collaboration
          </h3>
          <div className="flex items-center space-x-1">
            {isConnected ? (
              <Wifi size={12} className="text-green-500" />
            ) : (
              <WifiOff size={12} className="text-red-500" />
            )}
            <CircleDot size={8} className={isConnected ? 'text-green-500' : 'text-red-500'} />
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => setShowInviteModal(true)}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <UserPlus size={14} />
          </button>
          <button
            onClick={onToggle}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {[
          { key: 'users', label: 'Users', count: participants.length },
          { key: 'comments', label: 'Comments', count: comments.length },
          { key: 'conflicts', label: 'Conflicts', count: conflicts.length },
          { key: 'history', label: 'History', count: changes.length }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600 dark:text-blue-400 dark:bg-blue-900/30'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1 text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'users' && (
          <div className="p-3 space-y-3">
            {participants.map(user => {
              const RoleIcon = getRoleIcon(user.role);
              return (
                <div key={user.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="relative">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                      {user.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                      user.isOnline ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {user.name}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getRoleColor(user.role)}`}>
                        <RoleIcon size={10} className="inline mr-1" />
                        {user.role}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {user.currentView?.storyId ? 'Editing story' : 'Browsing'}
                      {!user.isOnline && ` • ${formatTimestamp(user.lastActive)}`}
                    </div>
                  </div>

                  <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <MoreHorizontal size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="p-3 space-y-3">
            {/* Add Comment */}
            <div className="space-y-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                rows={2}
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">@ to mention users</span>
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Send size={12} />
                  <span>Send</span>
                </button>
              </div>
            </div>

            {/* Comments List */}
            {comments.map(comment => {
              const user = participants.find(u => u.id === comment.userId);
              return (
                <div key={comment.id} className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                      {user?.name.slice(0, 1).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {user?.name || 'Unknown'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(comment.timestamp)}
                        </span>
                        {comment.isResolved && (
                          <Check size={12} className="text-green-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {comment.content}
                      </p>
                      {comment.thread.length > 0 && (
                        <div className="mt-2 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                          {comment.thread.map(reply => (
                            <div key={reply.id} className="py-2 text-sm">
                              <span className="font-medium">
                                {participants.find(u => u.id === reply.userId)?.name}:
                              </span>
                              <span className="ml-2">{reply.content}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'conflicts' && (
          <div className="p-3 space-y-3">
            {conflicts.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Check size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No conflicts detected</p>
              </div>
            ) : (
              conflicts.map(conflict => (
                <div key={conflict.id} className="p-3 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle size={16} className="text-red-600 dark:text-red-400 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
                        {conflict.type.replace('_', ' ').toUpperCase()}
                      </h4>
                      <p className="text-xs text-red-700 dark:text-red-400 mb-2">
                        Multiple users editing {conflict.targetType} simultaneously
                      </p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleResolveConflict(conflict.id, 'merge')}
                          className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Merge
                        </button>
                        <button
                          onClick={() => handleResolveConflict(conflict.id, 'override')}
                          className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Override
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="p-3 space-y-2">
            {changes.map(change => {
              const user = participants.find(u => u.id === change.userId);
              return (
                <div key={change.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                    {user?.name.slice(0, 1).toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {change.description}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {user?.name || 'Unknown'}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(change.timestamp)}
                      </span>
                      {!change.isResolved && (
                        <span className="text-xs text-red-500">• Conflicted</span>
                      )}
                    </div>
                  </div>
                  <Clock size={12} className="text-gray-400 mt-1" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60"
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-96 mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Invite Collaborator
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="collaborator@example.com"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role
                  </label>
                  <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="viewer">Viewer</option>
                    <option value="reviewer">Reviewer</option>
                    <option value="editor">Editor</option>
                  </select>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleInviteUser('test@example.com', 'editor')}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Send Invite
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
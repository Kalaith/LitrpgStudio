import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, addWeeks, addMonths, differenceInDays } from 'date-fns';
import { useAnalyticsStore } from '../stores/analyticsStore';
import { useStoryStore } from '../stores/storyStore';
import type { WritingGoal } from '../types/analytics';

interface WritingGoalsProps {
  className?: string;
}

export const WritingGoals: React.FC<WritingGoalsProps> = ({ className = '' }) => {
  const {
    goals,
    createGoal,
    updateGoal,
    deleteGoal,
    markGoalComplete,
  } = useAnalyticsStore();

  const { stories } = useStoryStore();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<WritingGoal | null>(null);

  const [newGoal, setNewGoal] = useState({
    type: 'daily' as const,
    target: 500,
    deadline: '',
    storyId: '',
  });

  const handleCreateGoal = () => {
    const goalData = {
      type: newGoal.type,
      target: newGoal.target,
      deadline: newGoal.deadline ? new Date(newGoal.deadline) : undefined,
      isActive: true,
      storyId: newGoal.storyId || undefined,
    };

    createGoal(goalData);
    setNewGoal({ type: 'daily', target: 500, deadline: '', storyId: '' });
    setShowCreateForm(false);
  };

  const handleUpdateGoal = (goalId: string, updates: Partial<WritingGoal>) => {
    updateGoal(goalId, updates);
    setEditingGoal(null);
  };

  const calculateGoalProgress = (goal: WritingGoal) => {
    // This is a simplified calculation. In a real implementation,
    // you'd want to track progress more precisely based on the goal type and timeframe.
    return Math.min((goal.current / goal.target) * 100, 100);
  };

  const getGoalStatus = (goal: WritingGoal) => {
    if (goal.completedAt) return 'completed';
    if (!goal.isActive) return 'inactive';

    if (goal.deadline) {
      const daysRemaining = differenceInDays(goal.deadline, new Date());
      if (daysRemaining < 0) return 'overdue';
      if (daysRemaining <= 1) return 'urgent';
    }

    const progress = calculateGoalProgress(goal);
    if (progress >= 100) return 'achieved';
    if (progress >= 75) return 'on_track';
    if (progress >= 50) return 'behind';
    return 'started';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'achieved':
        return 'text-green-600 bg-green-50';
      case 'on_track':
        return 'text-blue-600 bg-blue-50';
      case 'behind':
        return 'text-yellow-600 bg-yellow-50';
      case 'urgent':
      case 'overdue':
        return 'text-red-600 bg-red-50';
      case 'inactive':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getDefaultTarget = (type: string) => {
    switch (type) {
      case 'daily': return 500;
      case 'weekly': return 3500;
      case 'monthly': return 15000;
      case 'project': return 50000;
      default: return 500;
    }
  };

  const getDefaultDeadline = (type: string) => {
    const now = new Date();
    switch (type) {
      case 'daily': return format(addDays(now, 1), 'yyyy-MM-dd');
      case 'weekly': return format(addWeeks(now, 1), 'yyyy-MM-dd');
      case 'monthly': return format(addMonths(now, 1), 'yyyy-MM-dd');
      case 'project': return format(addMonths(now, 6), 'yyyy-MM-dd');
      default: return '';
    }
  };

  const activeGoals = goals.filter(g => g.isActive);
  const completedGoals = goals.filter(g => g.completedAt);

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Writing Goals</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
        >
          New Goal
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {activeGoals.length}
          </div>
          <div className="text-sm text-gray-600">Active Goals</div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {completedGoals.length}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {goals.length > 0 ? Math.round((completedGoals.length / goals.length) * 100) : 0}%
          </div>
          <div className="text-sm text-gray-600">Success Rate</div>
        </div>
      </div>

      {/* Create Goal Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50 rounded-lg p-4 mb-6"
          >
            <h3 className="text-lg font-medium text-gray-800 mb-4">Create New Goal</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Goal Type
                </label>
                <select
                  value={newGoal.type}
                  onChange={(e) => {
                    const type = e.target.value as WritingGoal['type'];
                    setNewGoal({
                      ...newGoal,
                      type,
                      target: getDefaultTarget(type),
                      deadline: getDefaultDeadline(type),
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="project">Project</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Words
                </label>
                <input
                  type="number"
                  value={newGoal.target}
                  onChange={(e) => setNewGoal({ ...newGoal, target: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deadline (Optional)
                </label>
                <input
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specific Story (Optional)
                </label>
                <select
                  value={newGoal.storyId}
                  onChange={(e) => setNewGoal({ ...newGoal, storyId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any story</option>
                  {stories.map(story => (
                    <option key={story.id} value={story.id}>
                      {story.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGoal}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Create Goal
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goals List */}
      <div className="space-y-4">
        <AnimatePresence>
          {goals.map(goal => {
            const status = getGoalStatus(goal);
            const progress = calculateGoalProgress(goal);
            const relatedStory = goal.storyId ? stories.find(s => s.id === goal.storyId) : null;

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                        {goal.type}
                      </span>

                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                        {status.replace('_', ' ')}
                      </span>

                      {relatedStory && (
                        <span className="text-sm text-gray-500">
                          {relatedStory.title}
                        </span>
                      )}
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{goal.current} / {goal.target} words</span>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div
                          className={`h-2 rounded-full ${
                            status === 'completed' || status === 'achieved'
                              ? 'bg-green-500'
                              : status === 'on_track'
                              ? 'bg-blue-500'
                              : status === 'behind'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(progress, 100)}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>

                      <div className="text-xs text-gray-500 mt-1">
                        {Math.round(progress)}% complete
                      </div>
                    </div>

                    {goal.deadline && (
                      <div className="text-sm text-gray-500">
                        Deadline: {format(goal.deadline, 'MMM dd, yyyy')}
                        {differenceInDays(goal.deadline, new Date()) >= 0 && (
                          <span className="ml-2">
                            ({differenceInDays(goal.deadline, new Date())} days remaining)
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {status === 'achieved' && !goal.completedAt && (
                      <button
                        onClick={() => markGoalComplete(goal.id)}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        Mark Complete
                      </button>
                    )}

                    <button
                      onClick={() => setEditingGoal(goal)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {goals.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-6xl mb-4">🎯</div>
            <div className="text-lg font-medium mb-2">No goals yet</div>
            <div className="text-sm">
              Set your first writing goal to start tracking your progress!
            </div>
          </div>
        )}
      </div>

      {/* Edit Goal Modal */}
      <AnimatePresence>
        {editingGoal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setEditingGoal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-medium text-gray-800 mb-4">Edit Goal</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Words
                  </label>
                  <input
                    type="number"
                    value={editingGoal.target}
                    onChange={(e) => setEditingGoal({
                      ...editingGoal,
                      target: parseInt(e.target.value) || 0
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Progress
                  </label>
                  <input
                    type="number"
                    value={editingGoal.current}
                    onChange={(e) => setEditingGoal({
                      ...editingGoal,
                      current: parseInt(e.target.value) || 0
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max={editingGoal.target}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={editingGoal.deadline ? format(editingGoal.deadline, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setEditingGoal({
                      ...editingGoal,
                      deadline: e.target.value ? new Date(e.target.value) : undefined
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={editingGoal.isActive}
                    onChange={(e) => setEditingGoal({
                      ...editingGoal,
                      isActive: e.target.checked
                    })}
                    className="mr-2"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">
                    Goal is active
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setEditingGoal(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateGoal(editingGoal.id, editingGoal)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useAnalyticsStore } from '../stores/analyticsStore';
import { useStoryStore } from '../stores/storyStore';

interface WritingSessionProps {
  onClose?: () => void;
  className?: string;
}

export const WritingSession: React.FC<WritingSessionProps> = ({ onClose, className = '' }) => {
  const {
    currentSession,
    isTrackingSession,
    startSession,
    endSession,
    updateSessionProgress,
    pauseSession,
    resumeSession,
  } = useAnalyticsStore();

  const { stories, currentStory } = useStoryStore();

  const [selectedStoryId, setSelectedStoryId] = useState(currentStory?.id || '');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [wordTarget, setWordTarget] = useState(500);
  const [sessionTime, setSessionTime] = useState(0);
  const [currentWordCount, setCurrentWordCount] = useState(0);

  // Timer effect
  useEffect(() => {
    if (!isTrackingSession || !currentSession) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - currentSession.startTime.getTime()) / 1000);
      setSessionTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [isTrackingSession, currentSession]);

  // Update word count from current story
  useEffect(() => {
    if (currentSession && selectedStoryId) {
      const story = stories.find(s => s.id === selectedStoryId);
      if (story) {
        setCurrentWordCount(story.wordCount);
        updateSessionProgress(story.wordCount);
      }
    }
  }, [stories, selectedStoryId, currentSession, updateSessionProgress]);

  const handleStartSession = () => {
    if (!selectedStoryId) return;

    startSession(
      selectedStoryId,
      selectedChapterId || undefined,
      wordTarget
    );

    const story = stories.find(s => s.id === selectedStoryId);
    if (story) {
      setCurrentWordCount(story.wordCount);
    }
  };

  const handleEndSession = () => {
    endSession();
    setSessionTime(0);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentWPM = () => {
    if (!currentSession || sessionTime === 0) return 0;
    const minutes = sessionTime / 60;
    return Math.round(currentSession.wordsWritten / minutes);
  };

  const getProgressPercentage = () => {
    if (!currentSession) return 0;
    return Math.min((currentSession.wordsWritten / currentSession.wordTarget) * 100, 100);
  };

  const selectedStory = stories.find(s => s.id === selectedStoryId);
  const availableChapters = selectedStory?.chapters || [];

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Writing Session</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!currentSession ? (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Story Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Story
              </label>
              <select
                value={selectedStoryId}
                onChange={(e) => {
                  setSelectedStoryId(e.target.value);
                  setSelectedChapterId('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a story...</option>
                {stories.map(story => (
                  <option key={story.id} value={story.id}>
                    {story.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Chapter Selection (Optional) */}
            {selectedStoryId && availableChapters.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Chapter (Optional)
                </label>
                <select
                  value={selectedChapterId}
                  onChange={(e) => setSelectedChapterId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Any chapter...</option>
                  {availableChapters.map(chapter => (
                    <option key={chapter.id} value={chapter.id}>
                      {chapter.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Word Target */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Word Target
              </label>
              <div className="flex space-x-2">
                {[250, 500, 750, 1000, 1500].map(target => (
                  <button
                    key={target}
                    onClick={() => setWordTarget(target)}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      wordTarget === target
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {target}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={wordTarget}
                onChange={(e) => setWordTarget(parseInt(e.target.value) || 500)}
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                max="10000"
              />
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartSession}
              disabled={!selectedStoryId}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Writing Session
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Session Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-800">
                  {selectedStory?.title}
                  {selectedChapterId && (
                    <span className="text-gray-500 ml-2">
                      - {availableChapters.find(c => c.id === selectedChapterId)?.title}
                    </span>
                  )}
                </h3>
                <span className="text-sm text-gray-500">
                  {format(currentSession.startTime, 'HH:mm')}
                </span>
              </div>
            </div>

            {/* Timer and Progress */}
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-800 mb-2">
                {formatTime(sessionTime)}
              </div>
              <div className="text-sm text-gray-500">
                Session Time
              </div>
            </div>

            {/* Word Progress */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Progress</span>
                <span>
                  {currentSession.wordsWritten} / {currentSession.wordTarget} words
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-3">
                <motion.div
                  className="bg-blue-600 h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${getProgressPercentage()}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              <div className="text-xs text-gray-500 text-center">
                {Math.round(getProgressPercentage())}% complete
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-600">
                  {currentSession.wordsWritten}
                </div>
                <div className="text-xs text-gray-500">Words Written</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-600">
                  {getCurrentWPM()}
                </div>
                <div className="text-xs text-gray-500">Words/Min</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-purple-600">
                  {currentSession.wordTarget - currentSession.wordsWritten > 0
                    ? currentSession.wordTarget - currentSession.wordsWritten
                    : 0
                  }
                </div>
                <div className="text-xs text-gray-500">Remaining</div>
              </div>
            </div>

            {/* Session Controls */}
            <div className="flex space-x-3">
              <button
                onClick={isTrackingSession ? pauseSession : resumeSession}
                className={`flex-1 py-2 px-4 rounded-md font-medium ${
                  isTrackingSession
                    ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {isTrackingSession ? 'Pause' : 'Resume'}
              </button>

              <button
                onClick={handleEndSession}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md font-medium hover:bg-red-700"
              >
                End Session
              </button>
            </div>

            {/* Motivational Message */}
            <AnimatePresence>
              {currentSession.wordsWritten >= currentSession.wordTarget && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-green-50 border border-green-200 rounded-lg p-4 text-center"
                >
                  <div className="text-2xl mb-2">🎉</div>
                  <div className="text-green-800 font-medium">
                    Goal achieved! Great work!
                  </div>
                  <div className="text-green-600 text-sm">
                    You've reached your word target for this session.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
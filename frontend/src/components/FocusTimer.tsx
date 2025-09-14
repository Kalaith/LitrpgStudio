import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface TimerSession {
  id: string;
  type: 'work' | 'shortBreak' | 'longBreak';
  duration: number;
  completed: boolean;
  wordsWritten?: number;
  startTime: Date;
  endTime?: Date;
}

export interface TimerSettings {
  workDuration: number; // in minutes
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
  autoStartBreaks: boolean;
  autoStartWork: boolean;
  soundEnabled: boolean;
  notifications: boolean;
}

interface FocusTimerProps {
  onSessionComplete?: (session: TimerSession) => void;
  onSessionStart?: (sessionType: 'work' | 'shortBreak' | 'longBreak') => void;
  className?: string;
  focusMode?: boolean;
}

export default function FocusTimer({
  onSessionComplete,
  onSessionStart,
  className = '',
  focusMode = false
}: FocusTimerProps) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [currentSession, setCurrentSession] = useState<TimerSession | null>(null);
  const [completedSessions, setCompletedSessions] = useState<TimerSession[]>([]);
  const [sessionCount, setSessionCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const [settings, setSettings] = useState<TimerSettings>({
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
    autoStartBreaks: false,
    autoStartWork: false,
    soundEnabled: true,
    notifications: true
  });

  // Calculate what the next session type should be
  const getNextSessionType = useCallback((): 'work' | 'shortBreak' | 'longBreak' => {
    if (!currentSession) return 'work';

    if (currentSession.type === 'work') {
      const workSessionsCompleted = completedSessions.filter(s => s.type === 'work').length + 1;
      return workSessionsCompleted % settings.sessionsUntilLongBreak === 0 ? 'longBreak' : 'shortBreak';
    }

    return 'work';
  }, [currentSession, completedSessions, settings.sessionsUntilLongBreak]);

  const getDurationForType = (type: 'work' | 'shortBreak' | 'longBreak'): number => {
    switch (type) {
      case 'work': return settings.workDuration * 60;
      case 'shortBreak': return settings.shortBreakDuration * 60;
      case 'longBreak': return settings.longBreakDuration * 60;
    }
  };

  const startSession = (type: 'work' | 'shortBreak' | 'longBreak') => {
    const duration = getDurationForType(type);
    const session: TimerSession = {
      id: crypto.randomUUID(),
      type,
      duration,
      completed: false,
      startTime: new Date()
    };

    setCurrentSession(session);
    setTimeLeft(duration);
    setIsRunning(true);

    if (onSessionStart) onSessionStart(type);

    // Request notification permission
    if (settings.notifications && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const pauseSession = () => {
    setIsRunning(false);
  };

  const resumeSession = () => {
    setIsRunning(true);
  };

  const completeSession = useCallback(() => {
    if (!currentSession) return;

    const completedSession: TimerSession = {
      ...currentSession,
      completed: true,
      endTime: new Date()
    };

    setCompletedSessions(prev => [...prev, completedSession]);
    setCurrentSession(null);
    setIsRunning(false);
    setTimeLeft(0);

    if (completedSession.type === 'work') {
      setSessionCount(prev => prev + 1);
    }

    // Notifications
    if (settings.notifications && 'Notification' in window && Notification.permission === 'granted') {
      const messages = {
        work: 'Work session completed! Time for a break.',
        shortBreak: 'Break is over! Ready to get back to work?',
        longBreak: 'Long break finished! You\'re refreshed and ready to continue.'
      };

      new Notification('Focus Timer', {
        body: messages[completedSession.type],
        icon: '/favicon.ico'
      });
    }

    // Play sound
    if (settings.soundEnabled) {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuWzPPI');
      audio.play().catch(() => {});
    }

    if (onSessionComplete) onSessionComplete(completedSession);

    // Auto-start next session if enabled
    const nextType = getNextSessionType();
    const shouldAutoStart =
      (completedSession.type === 'work' && settings.autoStartBreaks) ||
      (completedSession.type !== 'work' && settings.autoStartWork);

    if (shouldAutoStart) {
      setTimeout(() => startSession(nextType), 1000);
    }
  }, [currentSession, settings, onSessionComplete, getNextSessionType]);

  const skipSession = () => {
    if (currentSession) {
      completeSession();
    }
  };

  const resetTimer = () => {
    setCurrentSession(null);
    setIsRunning(false);
    setTimeLeft(0);
  };

  // Timer countdown effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            completeSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, completeSession]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getSessionColor = (type: 'work' | 'shortBreak' | 'longBreak') => {
    switch (type) {
      case 'work': return 'text-red-600 bg-red-50 border-red-200';
      case 'shortBreak': return 'text-green-600 bg-green-50 border-green-200';
      case 'longBreak': return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getSessionIcon = (type: 'work' | 'shortBreak' | 'longBreak') => {
    switch (type) {
      case 'work': return '📝';
      case 'shortBreak': return '☕';
      case 'longBreak': return '🧘';
    }
  };

  const progress = currentSession ? ((currentSession.duration - timeLeft) / currentSession.duration) * 100 : 0;

  if (focusMode && currentSession && isRunning) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">{getSessionIcon(currentSession.type)}</div>
          <div className="text-8xl font-mono mb-4">{formatTime(timeLeft)}</div>
          <div className="text-xl capitalize mb-8">
            {currentSession.type === 'work' ? 'Focus Time' : currentSession.type.replace(/([A-Z])/g, ' $1')}
          </div>
          <div className="flex space-x-4 justify-center">
            <button
              onClick={pauseSession}
              className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              Pause
            </button>
            <button
              onClick={skipSession}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Skip
            </button>
            <button
              onClick={resetTimer}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Stop
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Focus Timer</h2>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
        >
          ⚙️
        </button>
      </div>

      {/* Current Session */}
      <div className="text-center mb-8">
        {currentSession ? (
          <div>
            <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium mb-4 ${getSessionColor(currentSession.type)}`}>
              {getSessionIcon(currentSession.type)} {currentSession.type === 'work' ? 'Focus Time' : currentSession.type.replace(/([A-Z])/g, ' $1')}
            </div>

            <div className="text-6xl font-mono font-bold mb-4">
              {formatTime(timeLeft)}
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6">
              <motion.div
                className="bg-blue-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            <div className="flex justify-center space-x-4">
              {isRunning ? (
                <button
                  onClick={pauseSession}
                  className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium"
                >
                  ⏸️ Pause
                </button>
              ) : (
                <button
                  onClick={resumeSession}
                  className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
                >
                  ▶️ Resume
                </button>
              )}

              <button
                onClick={skipSession}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium"
              >
                ⏭️ Skip
              </button>

              <button
                onClick={resetTimer}
                className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
              >
                ⏹️ Stop
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-4xl font-mono font-bold mb-4 text-gray-400">
              25:00
            </div>
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-400">Ready to start a focus session?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => startSession('work')}
                className="p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                <div className="text-2xl mb-2">📝</div>
                <div className="font-medium text-red-700">Focus Time</div>
                <div className="text-sm text-red-600">{settings.workDuration} minutes</div>
              </button>

              <button
                onClick={() => startSession('shortBreak')}
                className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
              >
                <div className="text-2xl mb-2">☕</div>
                <div className="font-medium text-green-700">Short Break</div>
                <div className="text-sm text-green-600">{settings.shortBreakDuration} minutes</div>
              </button>

              <button
                onClick={() => startSession('longBreak')}
                className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <div className="text-2xl mb-2">🧘</div>
                <div className="font-medium text-blue-700">Long Break</div>
                <div className="text-sm text-blue-600">{settings.longBreakDuration} minutes</div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Session stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{sessionCount}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Completed Sessions</div>
        </div>

        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {Math.floor(completedSessions.filter(s => s.type === 'work').length * settings.workDuration / 60)}h
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Focus Time Today</div>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-200 dark:border-gray-700 pt-6"
          >
            <h3 className="text-lg font-semibold mb-4">Timer Settings</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Work Duration (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.workDuration}
                    onChange={(e) => setSettings({...settings, workDuration: parseInt(e.target.value) || 25})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Short Break (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={settings.shortBreakDuration}
                    onChange={(e) => setSettings({...settings, shortBreakDuration: parseInt(e.target.value) || 5})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Long Break (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.longBreakDuration}
                    onChange={(e) => setSettings({...settings, longBreakDuration: parseInt(e.target.value) || 15})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Sessions until Long Break</label>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={settings.sessionsUntilLongBreak}
                    onChange={(e) => setSettings({...settings, sessionsUntilLongBreak: parseInt(e.target.value) || 4})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                  />
                </div>

                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.autoStartBreaks}
                      onChange={(e) => setSettings({...settings, autoStartBreaks: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm">Auto-start breaks</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.autoStartWork}
                      onChange={(e) => setSettings({...settings, autoStartWork: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm">Auto-start work sessions</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.soundEnabled}
                      onChange={(e) => setSettings({...settings, soundEnabled: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm">Play sound notifications</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.notifications}
                      onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm">Browser notifications</span>
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
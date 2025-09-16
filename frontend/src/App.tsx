import { useState, useEffect } from 'react';
import ToastContainer from './components/Toast.tsx';
import Sidebar from './components/Sidebar.tsx';
import MainContent from './components/MainContent.tsx';
import { CollaborationPanel } from './components/CollaborationPanel';
import { PerformanceMonitor } from './components/PerformanceMonitor';
import { useAnalyticsIntegration, useGoalTracking } from './hooks/useAnalyticsIntegration';
import { useUnifiedSystemAutoInit } from './hooks/useUnifiedSystem';
import { useApiIntegration } from './hooks/useApiIntegration';
import { useApiStatus } from './hooks/useApiStatus';
import './App.css';

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);

  // Enable analytics integration
  useAnalyticsIntegration();
  useGoalTracking();

  // Initialize unified system
  useUnifiedSystemAutoInit();

  // API integration and status
  const { loadInitialData } = useApiIntegration();
  const { isOnline, baseUrl } = useApiStatus();

  // Load initial data from backend on app start
  useEffect(() => {
    if (isOnline) {
      loadInitialData().catch(console.warn);
    }
  }, [isOnline, loadInitialData]);

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
        {/* API Status Bar */}
        <div className={`px-4 py-2 text-sm ${isOnline ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
          <span className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
            {isOnline ? 'Connected to backend' : 'Using offline mode'} - {baseUrl}
          </span>
        </div>

        <div className="flex h-screen overflow-hidden">
          <Sidebar activeView={activeView} onViewChange={setActiveView} />
          <MainContent activeView={activeView} />
        </div>
      </div>
      <ToastContainer />

      {/* Collaboration Panel */}
      <CollaborationPanel
        isVisible={showCollaboration}
        onToggle={() => setShowCollaboration(!showCollaboration)}
      />

      {/* Performance Monitor */}
      <PerformanceMonitor
        isVisible={showPerformanceMonitor}
        onToggle={() => setShowPerformanceMonitor(!showPerformanceMonitor)}
      />
    </>
  )
}

export default App

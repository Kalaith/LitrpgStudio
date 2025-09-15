import { useState } from 'react';
import ToastContainer from './components/Toast.tsx';
import Sidebar from './components/Sidebar.tsx';
import MainContent from './components/MainContent.tsx';
import { CollaborationPanel } from './components/CollaborationPanel';
import { PerformanceMonitor } from './components/PerformanceMonitor';
import { useAnalyticsIntegration, useGoalTracking } from './hooks/useAnalyticsIntegration';
import { useUnifiedSystemAutoInit } from './hooks/useUnifiedSystem';
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

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
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

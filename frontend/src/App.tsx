import { useState, useEffect } from 'react';
import ToastContainer from './components/Toast.tsx';
import Sidebar from './components/Sidebar.tsx';
import MainContent from './components/MainContent.tsx';
import { useAnalyticsIntegration, useGoalTracking } from './hooks/useAnalyticsIntegration';
import { useUnifiedSystemAutoInit } from './hooks/useUnifiedSystem';
import { useApiIntegration } from './hooks/useApiIntegration';
import { useApiStatus } from './hooks/useApiStatus';
import { useBackendStateSync } from './hooks/useBackendStateSync';
import './App.css';

function App() {
  const [activeView, setActiveView] = useState('dashboard');

  // Enable analytics integration
  useAnalyticsIntegration();
  useGoalTracking();

  // Keep local sidebar-feature state synced with backend
  useBackendStateSync();

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
        {/* API Status Bar - Only show when offline */}
        {!isOnline && (
          <div className="px-4 py-2 text-sm bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
              Using offline mode - Backend unavailable at {baseUrl}
            </span>
          </div>
        )}

        <div className="flex h-screen overflow-hidden relative">
          <Sidebar activeView={activeView} onViewChange={setActiveView} />
          <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
            <MainContent activeView={activeView} />
          </div>
        </div>
      </div>
      <ToastContainer />
    </>
  )
}

export default App

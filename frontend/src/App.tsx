import { useState, useEffect, useCallback } from 'react';
import ToastContainer from './components/Toast.tsx';
import Sidebar from './components/Sidebar.tsx';
import MainContent from './components/MainContent.tsx';
import { useAnalyticsIntegration, useGoalTracking } from './hooks/useAnalyticsIntegration';
import { useUnifiedSystemAutoInit } from './hooks/useUnifiedSystem';
import { useApiIntegration } from './hooks/useApiIntegration';
import { useApiStatus } from './hooks/useApiStatus';
import { useBackendStateSync } from './hooks/useBackendStateSync';
import { useSeriesStore } from './stores/seriesStore';
import { useCharacterStore } from './stores/characterStore';
import { APP_NAVIGATE_EVENT, type AppNavigationDetail } from './utils/appNavigation';
import './App.css';

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [navigationState, setNavigationState] = useState<AppNavigationDetail | null>(null);

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
      loadInitialData()
        .then(() => {
          // If nothing loaded yet, drop straight to import
          const hasSeries = useSeriesStore.getState().series.length > 0;
          const hasChars = useCharacterStore.getState().characters.length > 0;
          if (!hasSeries && !hasChars) {
            setActiveView('import');
            setNavigationState({ view: 'import', token: Date.now() });
          }
        })
        .catch(console.warn);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  const handleViewChange = useCallback((view: string) => {
    setActiveView(view);
    setNavigationState({
      view,
      token: Date.now(),
    });
  }, []);

  useEffect(() => {
    const handleNavigate = (event: Event) => {
      const customEvent = event as CustomEvent<AppNavigationDetail>;
      const detail = customEvent.detail;
      if (!detail || typeof detail.view !== 'string' || detail.view.trim() === '') {
        return;
      }

      setActiveView(detail.view);
      setNavigationState({
        view: detail.view,
        payload: detail.payload,
        token: detail.token || Date.now(),
      });
    };

    window.addEventListener(APP_NAVIGATE_EVENT, handleNavigate as EventListener);
    return () => window.removeEventListener(APP_NAVIGATE_EVENT, handleNavigate as EventListener);
  }, []);

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
          <Sidebar activeView={activeView} onViewChange={handleViewChange} />
          <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
            <MainContent activeView={activeView} navigationState={navigationState} />
          </div>
        </div>
      </div>
      <ToastContainer />
    </>
  )
}

export default App

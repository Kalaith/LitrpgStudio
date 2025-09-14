import { useState } from 'react';
import ToastContainer from './components/Toast.tsx';
import Sidebar from './components/Sidebar.tsx';
import MainContent from './components/MainContent.tsx';
import { useAnalyticsIntegration, useGoalTracking } from './hooks/useAnalyticsIntegration';
import './App.css';

function App() {
  const [activeView, setActiveView] = useState('dashboard');

  // Enable analytics integration
  useAnalyticsIntegration();
  useGoalTracking();

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
        <div className="flex h-screen overflow-hidden">
          <Sidebar activeView={activeView} onViewChange={setActiveView} />
          <MainContent activeView={activeView} />
        </div>
      </div>
      <ToastContainer />
    </>
  )
}

export default App

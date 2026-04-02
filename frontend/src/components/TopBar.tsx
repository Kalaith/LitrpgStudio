import { useState, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { GlobalSearch } from './GlobalSearch';
import { useAuth } from '../contexts/AuthContext';
import { useSeriesStore } from '../stores/seriesStore';

interface TopBarProps {
  onCreateCharacter?: () => void;
  onCreateEvent?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onCreateCharacter, onCreateEvent }) => {
  const [isSaved] = useState(true);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showSeriesDropdown, setShowSeriesDropdown] = useState(false);
  const { user, getLinkAccountUrl } = useAuth();
  const { series, currentSeries, setCurrentSeries } = useSeriesStore();

  // Auto-select the first series when none is current
  useEffect(() => {
    if (!currentSeries && series.length > 0) {
      setCurrentSeries(series[0]);
    }
  }, [currentSeries, series, setCurrentSeries]);

  // Global keyboard shortcut for search (Ctrl/Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowGlobalSearch(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 sm:px-4 lg:px-6 py-3">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              {series.length > 0 ? (
                <div className="relative">
                  <button
                    onClick={() => setShowSeriesDropdown(v => !v)}
                    className="flex items-center gap-1.5 text-lg sm:text-xl font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors max-w-[220px] sm:max-w-xs"
                  >
                    <span className="truncate">
                      {currentSeries ? (currentSeries.name ?? currentSeries.title) : (series[0].name ?? series[0].title)}
                    </span>
                    <ChevronDown size={16} className="shrink-0 opacity-60" />
                  </button>
                  {showSeriesDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowSeriesDropdown(false)} />
                      <div className="absolute left-0 top-full mt-1 z-20 min-w-[200px] rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg py-1 overflow-hidden">
                        {series.map(s => {
                          const isActive = currentSeries ? String(s.id) === String(currentSeries.id) : String(s.id) === String(series[0].id);
                          return (
                            <button
                              key={s.id}
                              onClick={() => { setCurrentSeries(s); setShowSeriesDropdown(false); }}
                              className={`w-full text-left px-4 py-2 text-sm truncate transition-colors
                                ${isActive
                                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium'
                                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                            >
                              {s.name ?? s.title}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">Writers Studio</h1>
              )}
              {isSaved && <span className="text-sm text-success-600 dark:text-success-400 hidden sm:inline">Saved</span>}
              {user?.is_guest && (
                <a
                  href={getLinkAccountUrl()}
                  className="hidden sm:inline text-xs text-blue-600 dark:text-blue-400 underline hover:text-blue-700"
                >
                  Link to WebHatchery account
                </a>
              )}
            </div>

            {/* Mobile Search */}
            <div className="flex gap-2 sm:hidden">
              <button
                onClick={() => setShowGlobalSearch(true)}
                className="p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                aria-label="Search"
              >
                <Search size={16} className="text-gray-400" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Desktop Search Bar */}
            <div className="hidden sm:block flex-1 max-w-md">
              <button
                onClick={() => setShowGlobalSearch(true)}
                className="w-full flex items-center space-x-3 px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors group"
              >
                <Search size={16} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                <span className="flex-1 text-gray-500 dark:text-gray-400 text-sm">
                  Search anything...
                </span>
                <div className="flex items-center space-x-1">
                  <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-500 rounded text-xs font-mono text-gray-500">
                    Ctrl+K
                  </kbd>
                </div>
              </button>
            </div>


            {/* Mobile Search Bar (Full Width Below) */}
            <div className="sm:hidden w-full mt-2">
              <button
                onClick={() => setShowGlobalSearch(true)}
                className="w-full flex items-center space-x-3 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors group touch-manipulation"
              >
                <Search size={16} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                <span className="flex-1 text-gray-500 dark:text-gray-400 text-sm">
                  Search anything...
                </span>
                <div className="flex items-center space-x-1">
                  <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-500 rounded text-xs font-mono text-gray-500">
                    Ctrl+K
                  </kbd>
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearch
        isOpen={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
        onSelect={(result) => {
          console.log('Selected:', result);
          // Handle result selection - could navigate, insert reference, etc.
        }}
      />
    </>
  );
};

export default TopBar;

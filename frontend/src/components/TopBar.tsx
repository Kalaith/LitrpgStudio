import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { GlobalSearch } from './GlobalSearch';

interface TopBarProps {
  onCreateCharacter?: () => void;
  onCreateEvent?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onCreateCharacter, onCreateEvent }) => {
  const [isSaved] = useState(true);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

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
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">My LitRPG Novel</h1>
              {isSaved && <span className="text-sm text-success-600 dark:text-success-400 hidden sm:inline">✓ Saved</span>}
            </div>

            {/* Mobile Action Buttons */}
            <div className="flex gap-2 sm:hidden">
              <button
                onClick={() => setShowGlobalSearch(true)}
                className="p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                aria-label="Search"
              >
                <Search size={16} className="text-gray-400" />
              </button>
              <button
                className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors touch-manipulation"
                onClick={onCreateCharacter}
              >
                + Char
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
                    ⌘K
                  </kbd>
                </div>
              </button>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden sm:flex gap-2">
              <button
                className="px-4 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors touch-manipulation"
                onClick={onCreateCharacter}
              >
                + Character
              </button>
              <button
                className="px-4 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors touch-manipulation"
                onClick={onCreateEvent}
              >
                + Event
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
                    ⌘K
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

import { useState, useEffect } from 'react';
import { Search, Command } from 'lucide-react';
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
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">My LitRPG Novel</h1>
            {isSaved && <span className="text-sm text-success-600 dark:text-success-400">✓ Saved</span>}
          </div>

          {/* Global Search Bar */}
          <div className="flex-1 max-w-md mx-8">
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

          <div className="flex gap-2">
            <button
              className="px-4 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              onClick={onCreateCharacter}
            >
              + Character
            </button>
            <button
              className="px-4 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              onClick={onCreateEvent}
            >
              + Event
            </button>
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

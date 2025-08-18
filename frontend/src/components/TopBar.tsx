import { useState } from 'react';

interface TopBarProps {
  onCreateCharacter?: () => void;
  onCreateEvent?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onCreateCharacter, onCreateEvent }) => {
  const [isSaved] = useState(true);

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">My LitRPG Novel</h1>
          {isSaved && <span className="text-sm text-success-600 dark:text-success-400">✓ Saved</span>}
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
  );
};

export default TopBar;

import { useState } from 'react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const navItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'characters', icon: '👤', label: 'Characters' },
    { id: 'skills', icon: '⚡', label: 'Skills' },
    { id: 'timeline', icon: '📅', label: 'Timeline' },
    { id: 'editor', icon: '✍️', label: 'Editor' },
    { id: 'templates', icon: '📋', label: 'Templates' },
    { id: 'export', icon: '📤', label: 'Export' }
  ];

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0">
      <div className="px-4 py-3 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-primary-600 dark:text-primary-400">LitRPG Studio</h2>
        <button 
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          onClick={toggleTheme}
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>
      </div>
      <nav className="flex-1 py-4">
        {navItems.map(({ id, icon, label }) => (
          <button
            key={id}
            className={`w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2
              ${activeView === id ? 'bg-gray-100 dark:bg-gray-700 text-primary-600 dark:text-primary-400 border-l-4 border-primary-600 dark:border-primary-400' : ''}`}
            onClick={() => onViewChange(id)}
          >
            <span>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;

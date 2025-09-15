import { useState } from 'react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const navSections = [
    {
      name: 'Overview',
      items: [
        { id: 'dashboard', icon: '📊', label: 'Dashboard' }
      ]
    },
    {
      name: 'Story Tools',
      items: [
        { id: 'editor', icon: '✍️', label: 'Editor' },
        { id: 'timeline', icon: '📅', label: 'Timeline' },
        { id: 'characters', icon: '👤', label: 'Characters' },
        { id: 'worldbuilding', icon: '🌍', label: 'World Building' },
        { id: 'series', icon: '📚', label: 'Series Manager' },
        { id: 'research', icon: '🔍', label: 'Research Database' }
      ]
    },
    {
      name: 'System Tools',
      items: [
        { id: 'combat', icon: '⚔️', label: 'Combat Designer' },
        { id: 'skills', icon: '⚡', label: 'Skills & Progression' },
        { id: 'items', icon: '📦', label: 'Item Database' },
        { id: 'loot', icon: '💎', label: 'Loot Tables' },
        { id: 'system_bible', icon: '📖', label: 'System Bible' }
      ]
    },
    {
      name: 'Productivity',
      items: [
        { id: 'analytics', icon: '📈', label: 'Writing Analytics' },
        { id: 'focus', icon: '🎯', label: 'Focus Timer' },
        { id: 'templates', icon: '📋', label: 'Templates' },
        { id: 'export', icon: '📤', label: 'Export & Publish' }
      ]
    }
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
      <nav className="flex-1 py-4 overflow-y-auto">
        {navSections.map((section, sectionIndex) => (
          <div key={section.name} className={sectionIndex > 0 ? 'mt-6' : ''}>
            <div className="px-4 pb-2">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {section.name}
              </h3>
            </div>
            <div className="space-y-1">
              {section.items.map(({ id, icon, label }) => (
                <button
                  key={id}
                  className={`w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-3 text-sm
                    ${activeView === id ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-l-3 border-primary-600 dark:border-primary-400 font-medium' : ''}`}
                  onClick={() => onViewChange(id)}
                >
                  <span className="text-base">{icon}</span>
                  <span className="flex-1">{label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;

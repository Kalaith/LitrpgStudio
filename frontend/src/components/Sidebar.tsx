import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Pin,
  PinOff,
  Menu,
  X
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [pinnedItems, setPinnedItems] = useState<string[]>([]);

  // Initialize expanded sections and pinned items from localStorage
  useEffect(() => {
    const savedExpanded = localStorage.getItem('sidebar-expanded-sections');
    const savedPinned = localStorage.getItem('sidebar-pinned-items');
    const savedCollapsed = localStorage.getItem('sidebar-collapsed');

    if (savedExpanded) {
      setExpandedSections(JSON.parse(savedExpanded));
    } else {
      // Default to all sections expanded
      setExpandedSections({
        'Overview': true,
        'Story Tools': true,
        'System Tools': true,
        'Productivity': true
      });
    }

    if (savedPinned) {
      setPinnedItems(JSON.parse(savedPinned));
    }

    if (savedCollapsed) {
      setIsCollapsed(JSON.parse(savedCollapsed));
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-expanded-sections', JSON.stringify(expandedSections));
  }, [expandedSections]);

  useEffect(() => {
    localStorage.setItem('sidebar-pinned-items', JSON.stringify(pinnedItems));
  }, [pinnedItems]);

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

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

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  const togglePin = (itemId: string) => {
    setPinnedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobile = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  // Get all navigation items flattened for pinned section
  const allNavItems = navSections.flatMap(section => section.items);
  const pinnedNavItems = allNavItems.filter(item => pinnedItems.includes(item.id));

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobile}
        className="lg:hidden fixed top-3 left-3 z-50 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg hover:shadow-xl transition-shadow touch-manipulation"
        aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleMobile}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? '4rem' : '16rem',
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          fixed lg:relative inset-y-0 left-0 z-40 lg:z-0
          w-80 lg:w-auto
          bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          flex flex-col flex-shrink-0 transition-transform duration-300 ease-in-out
          max-w-[85vw] sm:max-w-80
        `}
      >
        {/* Header */}
        <div className="px-4 py-3 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="text-lg font-semibold text-primary-600 dark:text-primary-400"
              >
                LitRPG Studio
              </motion.h2>
            )}
          </AnimatePresence>

          <div className="flex items-center space-x-1">
            {!isCollapsed && (
              <button
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                onClick={toggleTheme}
                title="Toggle theme"
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
            )}

            <button
              onClick={toggleCollapse}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {/* Pinned Items Section */}
          {pinnedNavItems.length > 0 && (
            <div className="mb-6">
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-4 pb-2"
                  >
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Pinned
                    </h3>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1">
                {pinnedNavItems.map(({ id, icon, label }) => (
                  <div key={`pinned-${id}`} className="group relative">
                    <button
                      className={`w-full px-4 py-3 lg:py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-3 text-sm touch-manipulation
                        ${activeView === id ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-l-3 border-primary-600 dark:border-primary-400 font-medium' : ''}`}
                      onClick={() => onViewChange(id)}
                      title={isCollapsed ? label : undefined}
                    >
                      <span className="text-base flex-shrink-0">{icon}</span>
                      <AnimatePresence>
                        {!isCollapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            className="flex-1 truncate"
                          >
                            {label}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {!isCollapsed && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePin(id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-all"
                          title="Unpin item"
                        >
                          <PinOff size={12} />
                        </button>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Regular Sections */}
          {navSections.map((section, sectionIndex) => (
            <div key={section.name} className={sectionIndex > 0 || pinnedNavItems.length > 0 ? 'mt-6' : ''}>
              <div className="px-4 pb-2 flex items-center justify-between">
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.h3
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex-1"
                    >
                      {section.name}
                    </motion.h3>
                  )}
                </AnimatePresence>

                {!isCollapsed && (
                  <button
                    onClick={() => toggleSection(section.name)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    title={expandedSections[section.name] ? 'Collapse section' : 'Expand section'}
                  >
                    {expandedSections[section.name] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                )}
              </div>

              <AnimatePresence>
                {(isCollapsed || expandedSections[section.name]) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-1 overflow-hidden"
                  >
                    {section.items
                      .filter(item => !pinnedItems.includes(item.id)) // Don't show pinned items in regular sections
                      .map(({ id, icon, label }) => (
                        <div key={id} className="group relative">
                          <button
                            className={`w-full px-4 py-3 lg:py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-3 text-sm touch-manipulation
                              ${activeView === id ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-l-3 border-primary-600 dark:border-primary-400 font-medium' : ''}`}
                            onClick={() => onViewChange(id)}
                            title={isCollapsed ? label : undefined}
                          >
                            <span className="text-base flex-shrink-0">{icon}</span>
                            <AnimatePresence>
                              {!isCollapsed && (
                                <motion.span
                                  initial={{ opacity: 0, width: 0 }}
                                  animate={{ opacity: 1, width: 'auto' }}
                                  exit={{ opacity: 0, width: 0 }}
                                  className="flex-1 truncate"
                                >
                                  {label}
                                </motion.span>
                              )}
                            </AnimatePresence>

                            {!isCollapsed && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePin(id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-all"
                                title="Pin to top"
                              >
                                <Pin size={12} />
                              </button>
                            )}
                          </button>
                        </div>
                      ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </nav>
      </motion.aside>
    </>
  );
};

export default Sidebar;

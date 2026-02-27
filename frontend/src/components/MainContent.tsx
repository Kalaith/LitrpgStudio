import { useState } from 'react';
import TopBar from './TopBar';
import DashboardView from '../pages/DashboardView';
import CharacterManager from '../pages/CharacterManager';
import SkillsView from '../pages/SkillsView';
import TimelineView from '../pages/TimelineView';
import EditorView from '../pages/EditorView';
import TemplatesView from '../pages/TemplatesView';
import ExportView from '../pages/ExportView';
import WorldBuildingView from '../pages/WorldBuildingView';
import { WritingAnalytics } from './WritingAnalytics';
import CombatSystemDesigner from './CombatSystemDesigner';
import ItemDatabase from './ItemDatabase';
import FocusTimer from './FocusTimer';
import { SeriesManager } from './SeriesManager';
import { SystemBibleGenerator } from './SystemBibleGenerator';
import { LootTableDesigner } from './LootTableDesigner';
import { ResearchDatabase } from './ResearchDatabase';

interface MainContentProps {
  activeView: string;
}

const MainContent: React.FC<MainContentProps> = ({ activeView }) => {
  const [isCreatingCharacter, setIsCreatingCharacter] = useState(false);

  const handleCreateCharacter = () => {
    // Switch to characters view and set creating flag
    setIsCreatingCharacter(true);
  };

  const handleCreateEvent = () => undefined;

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'characters':
        return (
          <CharacterManager
            isCreating={isCreatingCharacter}
            onCreateComplete={() => setIsCreatingCharacter(false)}
          />
        );
      case 'skills':
        return <SkillsView />;
      case 'timeline':
        return <TimelineView />;
      case 'editor':
        return <EditorView />;
      case 'analytics':
        return <WritingAnalytics />;
      case 'worldbuilding':
        return <WorldBuildingView />;
      case 'combat':
        return <CombatSystemDesigner />;
      case 'items':
        return <ItemDatabase />;
      case 'focus':
        return <FocusTimer />;
      case 'series':
        return <SeriesManager />;
      case 'research':
        return <ResearchDatabase />;
      case 'loot':
        return <LootTableDesigner />;
      case 'system_bible':
        return <SystemBibleGenerator />;
      case 'templates':
        return <TemplatesView />;
      case 'export':
        return <ExportView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <TopBar
        onCreateCharacter={handleCreateCharacter}
        onCreateEvent={handleCreateEvent}
      />
      {renderActiveView()}
    </main>
  );
};

export default MainContent;

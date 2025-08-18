import { useState } from 'react';
import TopBar from './TopBar';
import DashboardView from './views/DashboardView';
import CharacterManager from './views/CharacterManager';
import SkillsView from './views/SkillsView';
import TimelineView from './views/TimelineView';
import EditorView from './views/EditorView';
import TemplatesView from './views/TemplatesView';
import ExportView from './views/ExportView';

interface MainContentProps {
  activeView: string;
}

const MainContent: React.FC<MainContentProps> = ({ activeView }) => {
  const [isCreatingCharacter, setIsCreatingCharacter] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  const handleCreateCharacter = () => {
    // Switch to characters view and set creating flag
    setIsCreatingCharacter(true);
  };

  const handleCreateEvent = () => {
    // Switch to timeline view and set creating flag
    setIsCreatingEvent(true);
  };

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
        return (
          <TimelineView
            isCreating={isCreatingEvent}
            onCreateComplete={() => setIsCreatingEvent(false)}
          />
        );
      case 'editor':
        return <EditorView />;
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

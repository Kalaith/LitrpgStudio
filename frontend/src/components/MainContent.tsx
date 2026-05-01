import TopBar from "./TopBar";
import DashboardView from "../pages/DashboardView";
import CharactersView from "../pages/CharactersView";
import TimelineView from "../pages/TimelineView";
import EditorView from "../pages/EditorView";
import TemplatesView from "../pages/TemplatesView";
import ExportView from "../pages/ExportView";
import WorldBuildingView from "../pages/WorldBuildingView";
import { SeriesManager } from "./SeriesManager";
import ImportView from "../pages/ImportView";
import ImportResultView from "../pages/ImportResultView";
import CanonVaultView from "../pages/CanonVaultView";
import type { AppNavigationDetail } from "../utils/appNavigation";

interface MainContentProps {
  activeView: string;
  navigationState?: AppNavigationDetail | null;
}

const MainContent: React.FC<MainContentProps> = ({
  activeView,
  navigationState,
}) => {
  const blockedViews = new Set([
    "skills",
    "analytics",
    "combat",
    "items",
    "focus",
    "research",
    "loot",
    "system_bible",
  ]);
  const supportedViews = new Set([
    "dashboard",
    "import",
    "import_result",
    "canon_vault",
    "editor",
    "timeline",
    "characters",
    "worldbuilding",
    "series",
    "templates",
    "export",
  ]);
  const resolvedView =
    blockedViews.has(activeView) || !supportedViews.has(activeView)
      ? "dashboard"
      : activeView;

  const renderActiveView = () => {
    switch (resolvedView) {
      case "dashboard":
        return <DashboardView />;
      case "import":
        return <ImportView />;
      case "import_result":
        return <ImportResultView navigationState={navigationState} />;
      case "canon_vault":
        return <CanonVaultView />;
      case "characters":
        return <CharactersView navigationState={navigationState} />;
      case "timeline":
        return <TimelineView />;
      case "editor":
        return <EditorView navigationState={navigationState} />;
      case "worldbuilding":
        return <WorldBuildingView />;
      case "series":
        return <SeriesManager />;
      case "templates":
        return <TemplatesView />;
      case "export":
        return <ExportView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <TopBar />
      {renderActiveView()}
    </main>
  );
};

export default MainContent;

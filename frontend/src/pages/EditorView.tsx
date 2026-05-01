import { useState, useCallback, useMemo, useEffect } from "react";
import { useStoryStore } from "../stores/storyStore";
import { useEntityRegistryStore } from "../stores/entityRegistryStore";
import AdvancedTextEditor from "../components/AdvancedTextEditor";
import { ContextSidebar } from "../components/ContextSidebar";
import { ContinuityChecker } from "../components/ContinuityChecker";
import { AIConsistencyPanel } from "../components/AIConsistencyPanel";
import type { BaseEntity } from "../types/entityRegistry";
import type { TimelineEvent } from "../types/unifiedTimeline";
import type { Chapter } from "../types/story";
import type {
  AppNavigationDetail,
  EditorNavigationPayload,
} from "../utils/appNavigation";

interface ContinuityIssueSummary {
  id: string;
  type: "error" | "warning" | "suggestion";
  title: string;
}

type ChapterTab = "write" | "continuity" | "ai";

interface EditorViewProps {
  navigationState?: AppNavigationDetail | null;
}

const getChapterOrder = (chapter: Chapter): number => {
  const chapterRecord = chapter as Chapter & { chapter_number?: number };
  return chapterRecord.order ?? chapterRecord.chapter_number ?? 0;
};

const getChapterWordCount = (chapter: Chapter): number => {
  const chapterRecord = chapter as Chapter & { word_count?: number };
  return chapterRecord.wordCount ?? chapterRecord.word_count ?? 0;
};

const EditorView: React.FC<EditorViewProps> = ({ navigationState }) => {
  const [chapterTitle, setChapterTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [focusMode, setFocusMode] = useState(false);
  const [editorMode, setEditorMode] = useState<"markdown" | "rich" | "plain">(
    "markdown",
  );
  const [spellCheck, setSpellCheck] = useState(true);
  const [activeTab, setActiveTab] = useState<ChapterTab>("write");
  const [showContextSidebar, setShowContextSidebar] = useState(true);
  const [currentChapterId, setCurrentChapterId] = useState<
    string | undefined
  >();
  const [cursorPosition, setCursorPosition] = useState(0);

  const {
    stories,
    currentStory,
    setCurrentStory,
    fetchStories,
    fetchStoryById,
  } = useStoryStore();
  const { addToRecentEntities } = useEntityRegistryStore();

  // Ensure stories are loaded
  useEffect(() => {
    fetchStories();
  }, []);

  // Auto-select first story if nothing is current
  useEffect(() => {
    if (!currentStory && stories.length > 0) {
      setCurrentStory(stories[0]);
    }
  }, [currentStory, stories]);

  const handleStoryChange = (storyId: string) => {
    if (!storyId) return;
    const story = stories.find((s) => s.id === storyId);
    if (story) {
      setCurrentStory(story);
      fetchStoryById(storyId);
    }
  };

  const orderedChapters = useMemo(() => {
    const chapters = currentStory?.chapters || [];
    return [...chapters].sort(
      (left, right) => getChapterOrder(left) - getChapterOrder(right),
    );
  }, [currentStory?.chapters]);

  useEffect(() => {
    if (orderedChapters.length === 0) {
      setCurrentChapterId(undefined);
      setChapterTitle("");
      setContent("");
      return;
    }

    const selectedChapter =
      orderedChapters.find((chapter) => chapter.id === currentChapterId) ??
      orderedChapters[0];

    if (selectedChapter.id !== currentChapterId) {
      setCurrentChapterId(selectedChapter.id);
    }

    setChapterTitle(selectedChapter.title || "");
    setContent(selectedChapter.content || "");
  }, [currentChapterId, orderedChapters]);

  useEffect(() => {
    const isEditorNavigation = navigationState?.view === "editor";
    if (!isEditorNavigation) {
      return;
    }

    const payload = (navigationState?.payload || {}) as EditorNavigationPayload;
    const hasStoryTarget =
      typeof payload.storyId === "string" && payload.storyId.trim() !== "";
    const hasChapterTarget =
      typeof payload.chapterId === "string" && payload.chapterId.trim() !== "";

    if (!hasStoryTarget && !hasChapterTarget) {
      return;
    }

    let cancelled = false;
    const hydrateTarget = async () => {
      const targetStoryId = hasStoryTarget
        ? (payload.storyId as string)
        : currentStory?.id;

      // Always fetch full story (with chapter content) from the API.
      // The stories list intentionally omits chapter content to keep initial load fast.
      if (targetStoryId) {
        await fetchStoryById(targetStoryId);
      }

      if (cancelled) {
        return;
      }

      const latestState = useStoryStore.getState();
      const targetStory = targetStoryId
        ? latestState.stories.find((story) => story.id === targetStoryId) ||
          latestState.currentStory ||
          null
        : currentStory;

      if (targetStory) {
        setCurrentStory(targetStory);
      }

      if (hasChapterTarget) {
        setCurrentChapterId(payload.chapterId as string);
      }

      setActiveTab("write");
      setShowContextSidebar(true);
    };

    hydrateTarget().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [navigationState?.token]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    // Update cursor position for context awareness
    setCursorPosition(newContent.length);
  };

  // Handle entity clicks from context sidebar
  const handleEntityClick = useCallback(
    (entity: BaseEntity) => {
      // Add entity reference at cursor position
      const entityRef = `[${entity.name}]`;
      const newContent =
        content.slice(0, cursorPosition) +
        entityRef +
        content.slice(cursorPosition);
      setContent(newContent);

      // Track entity usage
      addToRecentEntities(entity.id);
    },
    [content, cursorPosition, addToRecentEntities],
  );

  // Handle timeline event clicks
  const handleEventClick = useCallback(
    (event: TimelineEvent) => {
      // Insert event reference or create connection
      const eventRef = `[Event: ${event.name}]`;
      const newContent =
        content.slice(0, cursorPosition) +
        eventRef +
        content.slice(cursorPosition);
      setContent(newContent);
    },
    [content, cursorPosition],
  );

  // Toggle context sidebar
  const toggleContextSidebar = useCallback(() => {
    setShowContextSidebar(!showContextSidebar);
  }, [showContextSidebar]);

  // Handle continuity issue clicks
  const handleContinuityIssueClick = useCallback(
    (issue: ContinuityIssueSummary) => {
      // Could scroll to position, highlight text, or show details
      console.log("Continuity issue clicked:", issue);
    },
    [],
  );

  return (
    <div className="flex-1 overflow-hidden">
      <div className="flex h-full">
        {/* Chapter Navigation - Left Sidebar */}
        <div className="w-64 flex flex-col gap-6 p-6 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
          {/* Story Picker */}
          <select
            value={currentStory?.id ?? ""}
            onChange={(e) => handleStoryChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
          >
            <option value="">Select a story…</option>
            {stories.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold">Chapters</h4>
              <button className="btn-secondary text-sm">+ Add</button>
            </div>
            <div className="space-y-2">
              {orderedChapters.length > 0 ? (
                orderedChapters.map((chapter) => (
                  <button
                    key={chapter.id}
                    onClick={() => setCurrentChapterId(chapter.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      currentChapterId === chapter.id
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <div className="font-medium text-sm">{chapter.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {getChapterWordCount(chapter)} words
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-sm text-gray-500 italic py-4 text-center">
                  No chapters yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* Editor Toolbar */}
          <div className="flex items-center justify-between gap-2 p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setEditorMode("markdown")}
                  className={`btn-secondary text-sm py-1 px-3 ${editorMode === "markdown" ? "bg-blue-500 text-white" : ""}`}
                >
                  MD
                </button>
                <button
                  onClick={() => setEditorMode("rich")}
                  className={`btn-secondary text-sm py-1 px-3 ${editorMode === "rich" ? "bg-blue-500 text-white" : ""}`}
                >
                  Rich
                </button>
                <button
                  onClick={() => setEditorMode("plain")}
                  className={`btn-secondary text-sm py-1 px-3 ${editorMode === "plain" ? "bg-blue-500 text-white" : ""}`}
                >
                  Plain
                </button>
              </div>

              <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 mx-2"></div>

              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("write")}
                  className={`btn-secondary text-sm py-1 px-3 ${activeTab === "write" ? "bg-blue-500 text-white" : ""}`}
                >
                  Write
                </button>
                <button
                  onClick={() => setActiveTab("continuity")}
                  className={`btn-secondary text-sm py-1 px-3 ${activeTab === "continuity" ? "bg-amber-500 text-white" : ""}`}
                >
                  Continuity
                </button>
                <button
                  onClick={() => setActiveTab("ai")}
                  className={`btn-secondary text-sm py-1 px-3 ${activeTab === "ai" ? "bg-purple-500 text-white" : ""}`}
                >
                  Consistency Analysis
                </button>
              </div>

              {activeTab === "write" && (
                <>
                  <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 mx-2"></div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSpellCheck(!spellCheck)}
                      className={`btn-secondary text-sm py-1 px-3 ${spellCheck ? "bg-green-500 text-white" : ""}`}
                    >
                      Spell
                    </button>
                    <button
                      onClick={() => setFocusMode(!focusMode)}
                      className={`btn-secondary text-sm py-1 px-3 ${focusMode ? "bg-purple-500 text-white" : ""}`}
                    >
                      Focus
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Right Side Controls */}
            <div className="flex items-center gap-2">
              {activeTab === "write" && (
                <button
                  onClick={toggleContextSidebar}
                  className={`btn-secondary text-sm py-1 px-3 ${showContextSidebar ? "bg-blue-500 text-white" : ""}`}
                >
                  Context
                </button>
              )}
            </div>
          </div>

          {/* Editor Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Writing Area */}
            <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <input
                  type="text"
                  className="w-full text-2xl font-bold bg-transparent border-none outline-none placeholder-gray-400 text-gray-900 dark:text-white"
                  placeholder="Chapter Title"
                  value={chapterTitle}
                  onChange={(e) => setChapterTitle(e.target.value)}
                />
              </div>

              <div
                className={
                  activeTab === "write"
                    ? "flex-1 p-6 overflow-auto"
                    : "flex-1 overflow-hidden"
                }
              >
                {activeTab === "write" && (
                  <AdvancedTextEditor
                    content={content}
                    onChange={handleContentChange}
                    mode={editorMode}
                    showPreview={false}
                    theme="dark"
                    spellCheck={spellCheck}
                    focusMode={focusMode}
                  />
                )}

                {activeTab === "continuity" && (
                  <div className="h-full p-6">
                    <ContinuityChecker
                      content={content}
                      currentPosition={cursorPosition}
                      chapterId={currentChapterId}
                      storyId={currentStory?.id}
                      isEnabled
                      embedded
                      onIssueClick={handleContinuityIssueClick}
                      className="h-full"
                    />
                  </div>
                )}

                {activeTab === "ai" && (
                  <div className="h-full p-6">
                    <AIConsistencyPanel
                      content={content}
                      currentPosition={cursorPosition}
                      chapterId={currentChapterId}
                      storyId={currentStory?.id}
                      isEnabled
                      embedded
                      className="h-full"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Context Sidebar - Right Side */}
            {activeTab === "write" && showContextSidebar && (
              <ContextSidebar
                currentStoryId={currentStory?.id}
                currentChapterId={currentChapterId}
                currentPosition={cursorPosition}
                onEntityClick={handleEntityClick}
                onEventClick={handleEventClick}
                className="h-full"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorView;

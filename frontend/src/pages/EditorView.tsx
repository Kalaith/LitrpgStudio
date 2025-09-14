import { useState } from 'react';
import { useStoryStore } from '../stores/storyStore';
import AdvancedTextEditor from '../components/AdvancedTextEditor';

const EditorView = () => {
  const [chapterTitle, setChapterTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [focusMode, setFocusMode] = useState(false);
  const [editorMode, setEditorMode] = useState<'markdown' | 'rich' | 'plain'>('markdown');
  const [spellCheck, setSpellCheck] = useState(true);

  const { currentStory, addChapter, updateChapter } = useStoryStore();

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  return (
    <div className="flex-1 p-6 overflow-hidden">
      <div className="flex h-full gap-6">
        <div className="w-64 flex flex-col gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold">Chapters</h4>
              <button className="btn-secondary text-sm">+ Add</button>
            </div>
            <div id="chapterList" className="space-y-2">
              {/* Chapter list will be rendered here */}
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h4 className="font-semibold mb-4">Characters</h4>
            <div id="characterRefs" className="space-y-2">
              {/* Character references will be rendered here */}
            </div>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="flex items-center gap-2 p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <button
                onClick={() => setEditorMode('markdown')}
                className={`btn-secondary text-sm py-1 ${editorMode === 'markdown' ? 'bg-blue-500 text-white' : ''}`}
              >
                MD
              </button>
              <button
                onClick={() => setEditorMode('rich')}
                className={`btn-secondary text-sm py-1 ${editorMode === 'rich' ? 'bg-blue-500 text-white' : ''}`}
              >
                Rich
              </button>
              <button
                onClick={() => setEditorMode('plain')}
                className={`btn-secondary text-sm py-1 ${editorMode === 'plain' ? 'bg-blue-500 text-white' : ''}`}
              >
                Plain
              </button>
            </div>

            <div className="flex gap-2 ml-4">
              <button
                onClick={() => setSpellCheck(!spellCheck)}
                className={`btn-secondary text-sm py-1 ${spellCheck ? 'bg-green-500 text-white' : ''}`}
              >
                Spell
              </button>
              <button
                onClick={() => setFocusMode(!focusMode)}
                className={`btn-secondary text-sm py-1 ${focusMode ? 'bg-purple-500 text-white' : ''}`}
              >
                Focus
              </button>
            </div>
          </div>

          <div className="flex-1 p-4">
            <input
              type="text"
              className="input mb-4"
              placeholder="Chapter Title"
              value={chapterTitle}
              onChange={(e) => setChapterTitle(e.target.value)}
            />

            <AdvancedTextEditor
              content={content}
              onChange={handleContentChange}
              mode={editorMode}
              showPreview={true}
              theme="light"
              spellCheck={spellCheck}
              focusMode={focusMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorView;

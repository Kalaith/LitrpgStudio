import { useState } from 'react';

const EditorView = () => {
  const [wordCount, setWordCount] = useState<number>(0);
  const [chapterTitle, setChapterTitle] = useState<string>('');
  const [, setContent] = useState<string>(''); // Keep setter if needed, remove content if unused

  const handleContentChange = (event: React.FormEvent<HTMLDivElement>) => {
    const text = event.currentTarget.textContent || '';
    setContent(text);
    setWordCount(text.trim().split(/\s+/).length);
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
            <button className="btn-secondary text-sm py-1">B</button>
            <button className="btn-secondary text-sm py-1">I</button>
            <button className="btn-secondary text-sm py-1">[Tag]</button>
            <div className="ml-auto text-sm text-gray-600 dark:text-gray-400">{wordCount} words</div>
          </div>
          
          <div className="flex-1 p-4">
            <input
              type="text"
              className="input mb-4"
              placeholder="Chapter Title"
              value={chapterTitle}
              onChange={(e) => setChapterTitle(e.target.value)}
            />
            <div
              className="min-h-[500px] p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
              contentEditable
              onInput={handleContentChange}
              data-placeholder="Start writing your story..."
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorView;

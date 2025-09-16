import { useState, useEffect, useRef, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import { motion } from 'framer-motion';
import { marked } from 'marked';
import { APP_CONFIG } from '../constants';
import type { EditorInstance } from '../types/common';

export interface AdvancedTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  mode?: 'markdown' | 'rich' | 'plain';
  showPreview?: boolean;
  theme?: 'light' | 'dark';
  spellCheck?: boolean;
  focusMode?: boolean;
  height?: number;
  fontSize?: number;
  readOnly?: boolean;
  placeholder?: string;
  onSave?: () => void;
  className?: string;
}

interface EditorOptions {
  minimap: { enabled: boolean };
  scrollBeyondLastLine: boolean;
  wordWrap: 'on';
  lineNumbers: 'on' | 'off';
  glyphMargin: boolean;
  folding: boolean;
  lineDecorationsWidth?: number;
  lineNumbersMinChars?: number;
  renderLineHighlight: 'none' | 'all';
  hideCursorInOverviewRuler: boolean;
  overviewRulerBorder: boolean;
  fontSize: number;
  fontFamily: string;
  suggestOnTriggerCharacters: boolean;
  quickSuggestions: boolean;
  parameterHints: { enabled: boolean };
  hover: { enabled: boolean };
  readOnly?: boolean;
}

export default function AdvancedTextEditor({
  content,
  onChange,
  mode = 'markdown',
  showPreview = true,
  theme = 'light',
  spellCheck = true,
  focusMode = false,
  height: _height = APP_CONFIG.DEFAULT_EDITOR_HEIGHT,
  fontSize = APP_CONFIG.DEFAULT_FONT_SIZE,
  readOnly = false,
  placeholder: _placeholder = 'Start writing...',
  onSave: _onSave,
  className = ''
}: AdvancedTextEditorProps) {
  const [editorContent, setEditorContent] = useState(content);
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('split');
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const editorRef = useRef<EditorInstance | null>(null);

  useEffect(() => {
    const words = editorContent.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    setCharCount(editorContent.length);
  }, [editorContent]);

  const handleEditorChange = (value: string | undefined) => {
    const newContent = value || '';
    setEditorContent(newContent);
    onChange(newContent);
  };

  const previewHtml = useMemo(() => {
    if (mode === 'markdown') {
      const result = marked.parse(editorContent);
      return typeof result === 'string' ? result : '';
    }
    return editorContent.replace(/\n/g, '<br>');
  }, [mode, editorContent]);

  const editorOptions = useMemo<EditorOptions>(() => ({
    minimap: { enabled: !focusMode },
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    lineNumbers: focusMode ? 'off' : 'on',
    glyphMargin: !focusMode,
    folding: !focusMode,
    lineDecorationsWidth: focusMode ? 0 : undefined,
    lineNumbersMinChars: focusMode ? 0 : undefined,
    renderLineHighlight: focusMode ? 'none' : 'all',
    hideCursorInOverviewRuler: focusMode,
    overviewRulerBorder: !focusMode,
    fontSize,
    fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
    suggestOnTriggerCharacters: spellCheck,
    quickSuggestions: spellCheck,
    parameterHints: { enabled: spellCheck },
    hover: { enabled: spellCheck },
    readOnly
  }), [focusMode, fontSize, spellCheck, readOnly]);

  const containerClasses = useMemo(() =>
    `${focusMode
      ? 'fixed inset-0 bg-black bg-opacity-90 z-50'
      : 'border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden'
    } ${className}`.trim(),
    [focusMode, className]
  );

  return (
    <motion.div
      className={containerClasses}
      initial={focusMode ? { opacity: 0 } : {}}
      animate={focusMode ? { opacity: 1 } : {}}
      transition={{ duration: 0.3 }}
    >
      {/* Toolbar */}
      <div className={`
        flex items-center justify-between p-2 border-b border-gray-300 dark:border-gray-600
        ${focusMode ? 'bg-gray-900 text-white' : 'bg-gray-100 dark:bg-gray-800'}
      `}>
        <div className="flex items-center space-x-4">
          {/* View Mode Toggle */}
          {showPreview && (
            <div className="flex rounded-md overflow-hidden border border-gray-300 dark:border-gray-600">
              {['edit', 'split', 'preview'].map((modeOption) => (
                <button
                  key={modeOption}
                  onClick={() => setViewMode(modeOption as 'edit' | 'preview' | 'split')}
                  className={`
                    px-3 py-1 text-sm capitalize
                    ${viewMode === modeOption
                      ? 'bg-blue-500 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }
                  `}
                >
                  {modeOption}
                </button>
              ))}
            </div>
          )}

          {/* Mode Selector */}
          <select
            value={mode}
            onChange={() => {}}
            className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
          >
            <option value="markdown">Markdown</option>
            <option value="rich">Rich Text</option>
            <option value="plain">Plain Text</option>
          </select>
        </div>

        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
          <span>{wordCount} words</span>
          <span>{charCount} characters</span>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex h-96" style={{ height: focusMode ? 'calc(100vh - 60px)' : '400px' }}>
        {/* Editor Panel */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'w-1/2 border-r border-gray-300 dark:border-gray-600' : 'w-full'}`}>
            <Editor
              height="100%"
              defaultLanguage={mode === 'markdown' ? 'markdown' : 'plaintext'}
              value={editorContent}
              onChange={handleEditorChange}
              theme={theme === 'dark' ? 'vs-dark' : 'vs'}
              options={editorOptions}
              onMount={(editor) => {
                editorRef.current = editor;
              }}
            />
          </div>
        )}

        {/* Preview Panel */}
        {(viewMode === 'preview' || viewMode === 'split') && showPreview && (
          <div className={`
            ${viewMode === 'split' ? 'w-1/2' : 'w-full'}
            p-4 bg-white dark:bg-gray-800 overflow-auto
            prose prose-sm max-w-none
            dark:prose-invert
          `}>
            <div
              dangerouslySetInnerHTML={{ __html: previewHtml }}
              className="h-full"
            />
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className={`
        px-4 py-2 text-xs border-t border-gray-300 dark:border-gray-600
        ${focusMode ? 'bg-gray-900 text-gray-400' : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}
        flex justify-between items-center
      `}>
        <div className="flex space-x-4">
          <span>Mode: {mode}</span>
          <span>Spell Check: {spellCheck ? 'On' : 'Off'}</span>
        </div>
        <div className="flex space-x-2">
          <span>Lines: {editorContent.split('\n').length}</span>
          <span>Cursor: Line 1, Column 1</span>
        </div>
      </div>
    </motion.div>
  );
}
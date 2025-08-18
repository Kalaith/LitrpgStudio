import { useState } from 'react';
import type { ChangeEvent } from 'react';

type ExportFormat = 'markdown' | 'epub' | 'html' | 'pdf' | 'json';

interface ExportOptions {
  includeStats: boolean;
  includeTimeline: boolean;
  includeSkills: boolean;
  exportFormat: ExportFormat;
}

const ExportView = () => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeStats: false,
    includeTimeline: false,
    includeSkills: false,
    exportFormat: 'markdown'
  });

  const handleFormatChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setExportOptions({
      ...exportOptions,
      exportFormat: e.target.value as ExportFormat
    });
  };

  const handleCheckboxChange = (key: keyof Omit<ExportOptions, 'exportFormat'>) => (e: ChangeEvent<HTMLInputElement>) => {
    setExportOptions({
      ...exportOptions,
      [key]: e.target.checked
    });
  };

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Export</h2>
      </div>
      
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-6">Export Format</h3>
          
          <div className="space-y-6">
            <div>
              <select 
                className="input"
                value={exportOptions.exportFormat}
                onChange={handleFormatChange}
              >
                <option value="markdown">Markdown (Royal Road)</option>
                <option value="epub">EPUB (Amazon KDP)</option>
                <option value="html">HTML</option>
                <option value="pdf">PDF (Print)</option>
                <option value="json">JSON Data</option>
              </select>
            </div>
            
            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4"
                  checked={exportOptions.includeStats}
                  onChange={handleCheckboxChange('includeStats')}
                />
                <span>Include Character Stats</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4"
                  checked={exportOptions.includeTimeline}
                  onChange={handleCheckboxChange('includeTimeline')}
                />
                <span>Include Timeline</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4"
                  checked={exportOptions.includeSkills}
                  onChange={handleCheckboxChange('includeSkills')}
                />
                <span>Include Skill Trees</span>
              </label>
            </div>
            
            <button className="btn-primary w-full">Export</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportView;
